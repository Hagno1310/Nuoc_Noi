-- SRS v3.3 FR-04c, R39: hình thức thanh toán; chuyển khoản bắt buộc có ảnh (public_id Cloudinary).
-- Đơn cũ nhận 'cash': trước v3.3 app không ghi hình thức thanh toán. create_order luôn ghi rõ, không dựa vào default.
alter table public.orders
  add column payment_method text not null default 'cash' check (payment_method in ('cash', 'transfer')),
  add column transfer_photo_id text check (transfer_photo_id ~ '^nuoc-noi/transfer/[0-9a-f-]{36}$'),
  add constraint orders_transfer_photo check ((payment_method = 'transfer') = (transfer_photo_id is not null));

create or replace function public.order_summary(o public.orders, p_duplicate boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', o.id, 'item_count', o.item_count, 'subtotal_amount', o.subtotal_amount,
    'discount_percent', o.discount_percent, 'discount_amount', o.discount_amount,
    'total_amount', o.total_amount, 'seat_name', o.seat_name, 'status', o.status,
    'payment_method', o.payment_method, 'transfer_photo_id', o.transfer_photo_id,
    'created_at', o.created_at, 'business_date', o.business_date, 'duplicate', p_duplicate)
$$;

drop function public.create_order(uuid, uuid, integer, jsonb);

create function public.create_order(
  p_id uuid, p_seat_id uuid, p_discount_percent integer, p_lines jsonb,
  p_payment_method text, p_transfer_photo_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_seat_name text;
  v_count integer;
  v_distinct integer;
  v_qty_ok boolean;
  v_price_ok boolean;
  v_items integer;
  v_subtotal bigint;
  v_discount integer;
  v_start smallint;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  -- Gửi lại cùng id: trả về đơn đã ghi, kể cả khi thực đơn hoặc hình thức thanh toán đã đổi sau đó
  select * into v_order from public.orders where id = p_id;
  if found then
    return public.order_summary(v_order, true);
  end if;

  if p_discount_percent is null or p_discount_percent < 0 or p_discount_percent > 100 then
    raise exception 'INVALID_DISCOUNT';
  end if;

  if p_seat_id is null then
    raise exception 'SEAT_REQUIRED';
  end if;
  select name into v_seat_name from public.seats where id = p_seat_id and not is_archived;
  if not found then
    raise exception 'SEAT_NOT_FOUND';
  end if;

  -- SRS FR-04c: chuyển khoản bắt buộc có ảnh; tiền mặt không kèm ảnh
  if p_payment_method is null or p_payment_method not in ('cash', 'transfer') then
    raise exception 'PAYMENT_REQUIRED';
  end if;
  if p_payment_method = 'transfer'
     and (p_transfer_photo_id is null or p_transfer_photo_id !~ '^nuoc-noi/transfer/[0-9a-f-]{36}$') then
    raise exception 'PHOTO_REQUIRED';
  end if;
  if p_payment_method = 'cash' and p_transfer_photo_id is not null then
    raise exception 'INVALID_PAYMENT';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) < 1 or jsonb_array_length(p_lines) > 30 then
    raise exception 'INVALID_LINES';
  end if;

  -- Đọc dòng đơn; sai kiểu thì báo INVALID_LINES thay vì lỗi Postgres thô
  begin
    select count(*),
           count(distinct (l ->> 'menu_item_id')::uuid),
           bool_and(coalesce((l ->> 'quantity')::integer between 1 and 99, false)),
           coalesce(bool_and((l ->> 'client_price')::integer is not null), false)
    into v_count, v_distinct, v_qty_ok, v_price_ok
    from jsonb_array_elements(p_lines) l;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'INVALID_LINES';
  end;
  if v_distinct <> v_count or not v_price_ok then
    raise exception 'INVALID_LINES';
  end if;
  if not v_qty_ok then
    raise exception 'INVALID_QUANTITY';
  end if;

  -- Khóa các món trong đơn tới hết giao dịch, để giá không đổi giữa lúc kiểm tra và lúc ghi
  perform 1 from public.menu_items
  where id in (select (l ->> 'menu_item_id')::uuid from jsonb_array_elements(p_lines) l)
  for share;

  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    left join public.menu_items m on m.id = (l ->> 'menu_item_id')::uuid
    where m.id is null or m.is_archived or m.price <> (l ->> 'client_price')::integer
  ) then
    raise exception 'MENU_CHANGED' using detail = (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', id, 'name', name, 'price', price, 'is_archived', is_archived)
             order by sort_order, name), '[]'::jsonb)::text
      from public.menu_items);
  end if;

  select sum((l ->> 'quantity')::integer), sum((l ->> 'quantity')::bigint * m.price)
  into v_items, v_subtotal
  from jsonb_array_elements(p_lines) l
  join public.menu_items m on m.id = (l ->> 'menu_item_id')::uuid;
  if v_subtotal > 1000000000 then
    raise exception 'TOTAL_TOO_LARGE';
  end if;
  v_discount := public.discount_amount(v_subtotal, p_discount_percent);

  select business_day_start_hour into v_start from public.settings where id = 1;

  insert into public.orders (id, item_count, subtotal_amount, discount_percent, discount_amount, total_amount,
                             seat_id, seat_name, created_by, created_at, business_date,
                             payment_method, transfer_photo_id)
  values (p_id, v_items, v_subtotal, p_discount_percent, v_discount, v_subtotal - v_discount,
          p_seat_id, v_seat_name, auth.uid(), now(), public.compute_business_date(now(), v_start),
          p_payment_method, p_transfer_photo_id)
  on conflict (id) do nothing
  returning * into v_order;

  if not found then
    select * into v_order from public.orders where id = p_id;
    return public.order_summary(v_order, true);
  end if;

  insert into public.order_lines (order_id, menu_item_id, item_name, unit_price, quantity, sort_order)
  select p_id, m.id, m.name, m.price, (l.value ->> 'quantity')::integer, l.ordinality
  from jsonb_array_elements(p_lines) with ordinality l(value, ordinality)
  join public.menu_items m on m.id = (l.value ->> 'menu_item_id')::uuid;

  return public.order_summary(v_order, false);
end
$$;

revoke execute on function public.create_order(uuid, uuid, integer, jsonb, text, text) from public, anon;
grant execute on function public.create_order(uuid, uuid, integer, jsonb, text, text) to authenticated;

-- SRS FR-04b: Đơn vừa tạo cần hình thức thanh toán và ảnh để xem lại
drop function public.list_orders_by_ids(uuid[]);
create function public.list_orders_by_ids(p_ids uuid[])
returns table (id uuid, item_count integer, subtotal_amount integer, discount_percent integer,
               discount_amount integer, total_amount integer, seat_name text, status text,
               created_at timestamptz, payment_method text, transfer_photo_id text, lines jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select o.id, o.item_count, o.subtotal_amount, o.discount_percent, o.discount_amount, o.total_amount,
           o.seat_name, o.status, o.created_at, o.payment_method, o.transfer_photo_id,
           (select jsonb_agg(jsonb_build_object(
                     'item_name', ol.item_name, 'unit_price', ol.unit_price,
                     'quantity', ol.quantity, 'line_amount', ol.line_amount) order by ol.sort_order)
            from public.order_lines ol where ol.order_id = o.id)
    from public.orders o
    where o.id = any (p_ids) and o.business_date = public.current_business_date()
    order by o.created_at desc;
end
$$;
revoke execute on function public.list_orders_by_ids(uuid[]) from public, anon;
grant execute on function public.list_orders_by_ids(uuid[]) to authenticated;

-- SRS FR-07 (v3.3): dòng tổng tách doanh thu tiền mặt / chuyển khoản để đối chiếu két và ngân hàng
create or replace function public.history_totals(p_from date, p_to date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'revenue', coalesce(sum(total_amount), 0),
    'item_count', coalesce(sum(item_count), 0),
    'order_count', count(*),
    'discount_total', coalesce(sum(discount_amount), 0),
    'cash_revenue', coalesce(sum(total_amount) filter (where payment_method = 'cash'), 0),
    'transfer_revenue', coalesce(sum(total_amount) filter (where payment_method = 'transfer'), 0))
  into v_result
  from public.orders
  where status = 'paid' and business_date between p_from and p_to;
  return v_result;
end
$$;
