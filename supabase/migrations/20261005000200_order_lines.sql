-- SRS v3.0 R36: app chưa dùng thật. Xóa dữ liệu thử MỘT LẦN trước khi đổi cấu trúc đơn hàng.
-- Đây là ngoại lệ duy nhất của NFR-05; không migration nào khác được xóa đơn.
delete from public.orders;
drop table public.price_history;

-- Các hàm của mô hình đồng giá
drop function public.create_order(uuid, integer, uuid, boolean, integer);
drop function public.order_result(public.orders, boolean, boolean);
drop function public.update_price(integer);
drop function public.dashboard_summary(date);
drop function public.list_orders_by_ids(uuid[]);
alter table public.settings drop column current_price;

-- total_amount cũ là cột tự tính từ quantity × unit_price, phải bỏ trước
alter table public.orders drop column total_amount;
alter table public.orders drop column quantity, drop column unit_price;
alter table public.orders
  add column item_count integer not null check (item_count > 0),
  add column subtotal_amount integer not null check (subtotal_amount > 0 and subtotal_amount <= 1000000000),
  add column discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  add column discount_amount integer not null default 0,
  add column total_amount integer not null,
  add constraint orders_discount_range check (discount_amount between 0 and subtotal_amount),
  add constraint orders_total_matches check (total_amount = subtotal_amount - discount_amount),
  add constraint orders_seat_required check (seat_id is not null or is_takeaway);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  menu_item_id uuid not null references public.menu_items (id),
  item_name text not null,
  unit_price integer not null check (unit_price between 1000 and 5000000),
  quantity integer not null check (quantity between 1 and 99),
  line_amount integer generated always as (quantity * unit_price) stored,
  sort_order integer not null,
  unique (order_id, menu_item_id)
);
alter table public.order_lines enable row level security;
create policy owner_read_order_lines on public.order_lines for select to authenticated using (public.is_owner());

-- Số tiền giảm làm tròn xuống tới 1.000đ (SRS FR-03, R34)
create function public.discount_amount(p_subtotal bigint, p_percent integer)
returns integer language sql immutable as $$
  select (p_subtotal * p_percent / 100000 * 1000)::integer
$$;

create function public.order_summary(o public.orders, p_duplicate boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', o.id, 'item_count', o.item_count, 'subtotal_amount', o.subtotal_amount,
    'discount_percent', o.discount_percent, 'discount_amount', o.discount_amount,
    'total_amount', o.total_amount, 'seat_name', o.seat_name,
    'created_at', o.created_at, 'business_date', o.business_date, 'duplicate', p_duplicate)
$$;

-- SRS FR-04: server quyết định mọi số tiền; lệch giá hoặc món đã ẩn thì từ chối cả đơn
create function public.create_order(
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
           coalesce(bool_and((l ->> 'quantity')::integer between 1 and 99), false),
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

-- SRS FR-04b: Đơn vừa tạo, kèm dòng đơn
create function public.list_orders_by_ids(p_ids uuid[])
returns table (id uuid, item_count integer, subtotal_amount integer, discount_percent integer,
               discount_amount integer, total_amount integer, seat_name text, status text,
               created_at timestamptz, lines jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select o.id, o.item_count, o.subtotal_amount, o.discount_percent, o.discount_amount, o.total_amount,
           o.seat_name, o.status, o.created_at,
           (select jsonb_agg(jsonb_build_object(
                     'item_name', ol.item_name, 'unit_price', ol.unit_price,
                     'quantity', ol.quantity, 'line_amount', ol.line_amount) order by ol.sort_order)
            from public.order_lines ol where ol.order_id = o.id)
    from public.orders o
    where o.id = any (p_ids) and o.business_date = public.current_business_date()
    order by o.created_at desc;
end
$$;

-- SRS FR-06, FR-07: doanh thu sau giảm, số món, tổng tiền đã giảm. owner_stats dùng lại hàm này.
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
    'discount_total', coalesce(sum(discount_amount), 0))
  into v_result
  from public.orders
  where status = 'paid' and business_date between p_from and p_to;
  return v_result;
end
$$;

revoke execute on function public.order_summary(public.orders, boolean) from public, anon, authenticated;
revoke execute on function public.discount_amount(bigint, integer) from public, anon;
revoke execute on function public.create_order(uuid, uuid, boolean, integer, jsonb) from public, anon;
revoke execute on function public.list_orders_by_ids(uuid[]) from public, anon;
grant execute on function public.discount_amount(bigint, integer) to authenticated;
grant execute on function public.create_order(uuid, uuid, boolean, integer, jsonb) to authenticated;
grant execute on function public.list_orders_by_ids(uuid[]) to authenticated;
