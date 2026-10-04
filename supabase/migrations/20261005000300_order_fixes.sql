-- Review đợt 1 (SRS v3.0 FR-04):
-- 1. bool_and bỏ qua NULL: một dòng thiếu số lượng trong đơn nhiều dòng lọt qua kiểm tra rồi hỏng ở bước ghi dòng đơn (lỗi 23502 thô).
--    Mỗi dòng phải tự có số lượng hợp lệ.
-- 2. Gửi lại đơn đã bị hủy: trả về status để màn order không báo nhầm "Đã tạo đơn".
create or replace function public.order_summary(o public.orders, p_duplicate boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', o.id, 'item_count', o.item_count, 'subtotal_amount', o.subtotal_amount,
    'discount_percent', o.discount_percent, 'discount_amount', o.discount_amount,
    'total_amount', o.total_amount, 'seat_name', o.seat_name, 'status', o.status,
    'created_at', o.created_at, 'business_date', o.business_date, 'duplicate', p_duplicate)
$$;

create or replace function public.create_order(
  p_id uuid, p_seat_id uuid, p_is_takeaway boolean, p_discount_percent integer, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_takeaway boolean := coalesce(p_is_takeaway, false);
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

  -- Gửi lại cùng id: trả về đơn đã ghi, kể cả khi thực đơn đã đổi sau đó
  select * into v_order from public.orders where id = p_id;
  if found then
    return public.order_summary(v_order, true);
  end if;

  if p_discount_percent is null or p_discount_percent < 0 or p_discount_percent > 100 then
    raise exception 'INVALID_DISCOUNT';
  end if;

  if v_takeaway and p_seat_id is not null then
    raise exception 'INVALID_SEAT';
  end if;
  if p_seat_id is not null then
    select name into v_seat_name from public.seats where id = p_seat_id and not is_archived;
    if not found then
      raise exception 'SEAT_NOT_FOUND';
    end if;
  elsif v_takeaway then
    v_seat_name := 'Mang về';
  else
    raise exception 'SEAT_REQUIRED';
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
                             seat_id, seat_name, is_takeaway, created_by, created_at, business_date)
  values (p_id, v_items, v_subtotal, p_discount_percent, v_discount, v_subtotal - v_discount,
          p_seat_id, v_seat_name, v_takeaway, auth.uid(), now(), public.compute_business_date(now(), v_start))
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
