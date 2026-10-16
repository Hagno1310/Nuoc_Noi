-- SRS v3.8 FR-04d, R45: Trả sau. Đơn chờ thanh toán ('open') gom nhiều lượt gọi, thu tiền một lần.
-- SRS v3.8 FR-02, R46: ghi chú trên từng dòng đơn.
-- SRS v3.8 FR-06, R47: món bán chạy và số món theo giờ.

alter table public.orders drop constraint orders_status_check;
alter table public.orders
  add constraint orders_status_check check (status in ('open', 'paid', 'cancelled')),
  alter column payment_method drop not null,
  add column paid_at timestamptz,
  add constraint orders_paid_has_method check (status <> 'paid' or payment_method is not null),
  add constraint orders_open_no_method check (status <> 'open' or payment_method is null);
update public.orders set paid_at = created_at;
-- Mỗi chỗ ngồi có tối đa một đơn chờ thanh toán
create unique index orders_one_open_per_seat on public.orders (seat_id) where status = 'open';

-- Lượt gọi. Đơn trả ngay có đúng một lượt gọi, id trùng id đơn.
create table public.order_rounds (
  id uuid primary key,
  order_id uuid not null references public.orders (id),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users (id)
);
create index order_rounds_order_idx on public.order_rounds (order_id);
alter table public.order_rounds enable row level security;
create policy owner_read_order_rounds on public.order_rounds for select to authenticated using (public.is_owner());
insert into public.order_rounds (id, order_id, created_by, created_at)
select id, id, created_by, created_at from public.orders;

alter table public.order_lines
  add column round_id uuid references public.order_rounds (id),
  add column note text not null default '' check (char_length(note) <= 60);
update public.order_lines set round_id = order_id;
alter table public.order_lines
  alter column round_id set not null,
  drop constraint order_lines_order_id_menu_item_id_key,
  add constraint order_lines_round_item_note_key unique (round_id, menu_item_id, note);

-- Kiểm tra dòng đơn gửi lên (dùng chung cho create_order và add_round). Khóa các món tới hết giao dịch.
create function public.check_lines(p_lines jsonb)
returns void language plpgsql set search_path = public as $$
declare
  v_count integer;
  v_distinct integer;
  v_qty_ok boolean;
  v_price_ok boolean;
  v_note_ok boolean;
begin
  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) < 1 or jsonb_array_length(p_lines) > 30 then
    raise exception 'INVALID_LINES';
  end if;
  begin
    select count(*),
           count(distinct ((l ->> 'menu_item_id')::uuid, btrim(coalesce(l ->> 'note', '')))),
           bool_and(coalesce((l ->> 'quantity')::integer between 1 and 99, false)),
           coalesce(bool_and((l ->> 'client_price')::integer is not null), false),
           bool_and(char_length(btrim(coalesce(l ->> 'note', ''))) <= 60)
    into v_count, v_distinct, v_qty_ok, v_price_ok, v_note_ok
    from jsonb_array_elements(p_lines) l;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'INVALID_LINES';
  end;
  if v_distinct <> v_count or not v_price_ok or not v_note_ok then
    raise exception 'INVALID_LINES';
  end if;
  if not v_qty_ok then
    raise exception 'INVALID_QUANTITY';
  end if;

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
end
$$;

-- Hình thức thanh toán (SRS FR-04c)
create function public.check_payment(p_method text, p_photo text)
returns void language plpgsql immutable as $$
begin
  if p_method is null or p_method not in ('cash', 'transfer') then
    raise exception 'PAYMENT_REQUIRED';
  end if;
  if p_method = 'transfer' and (p_photo is null or p_photo !~ '^nuoc-noi/transfer/[0-9a-f-]{36}$') then
    raise exception 'PHOTO_REQUIRED';
  end if;
  if p_method = 'cash' and p_photo is not null then
    raise exception 'INVALID_PAYMENT';
  end if;
end
$$;

-- Ghi các dòng đơn của một lượt gọi theo giá hiện hành (đã kiểm tra bởi check_lines)
create function public.insert_lines(p_order uuid, p_round uuid, p_lines jsonb)
returns void language sql set search_path = public as $$
  insert into public.order_lines (order_id, round_id, menu_item_id, item_name, unit_price, quantity, note, sort_order)
  select p_order, p_round, m.id, m.name, m.price, (l.value ->> 'quantity')::integer,
         btrim(coalesce(l.value ->> 'note', '')),
         (select coalesce(max(sort_order), 0) from public.order_lines where order_id = p_order) + l.ordinality
  from jsonb_array_elements(p_lines) with ordinality l(value, ordinality)
  join public.menu_items m on m.id = (l.value ->> 'menu_item_id')::uuid
$$;

-- Tính lại số món và tiền từ các lượt gọi chưa hủy. Trả null nếu không còn dòng nào.
create function public.refresh_totals(p_order uuid, p_discount integer)
returns public.orders language plpgsql set search_path = public as $$
declare
  v_items integer;
  v_sub bigint;
  v_order public.orders;
begin
  select sum(ol.quantity), sum(ol.line_amount::bigint) into v_items, v_sub
  from public.order_lines ol join public.order_rounds r on r.id = ol.round_id
  where ol.order_id = p_order and r.cancelled_at is null;
  if v_items is null then
    return null;
  end if;
  if v_sub > 1000000000 then
    raise exception 'TOTAL_TOO_LARGE';
  end if;
  update public.orders
  set item_count = v_items, subtotal_amount = v_sub, discount_percent = p_discount,
      discount_amount = public.discount_amount(v_sub, p_discount),
      total_amount = v_sub - public.discount_amount(v_sub, p_discount)
  where id = p_order
  returning * into v_order;
  return v_order;
end
$$;

revoke execute on function public.check_lines(jsonb) from public, anon, authenticated;
revoke execute on function public.check_payment(text, text) from public, anon, authenticated;
revoke execute on function public.insert_lines(uuid, uuid, jsonb) from public, anon, authenticated;
revoke execute on function public.refresh_totals(uuid, integer) from public, anon, authenticated;

create or replace function public.order_summary(o public.orders, p_duplicate boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', o.id, 'item_count', o.item_count, 'subtotal_amount', o.subtotal_amount,
    'discount_percent', o.discount_percent, 'discount_amount', o.discount_amount,
    'total_amount', o.total_amount, 'seat_name', o.seat_name, 'status', o.status,
    'payment_method', o.payment_method, 'transfer_photo_id', o.transfer_photo_id,
    'created_at', o.created_at, 'business_date', o.business_date, 'duplicate', p_duplicate)
$$;

-- SRS FR-04: trả ngay. Giữ chữ ký cũ; dòng đơn nhận thêm "note".
create or replace function public.create_order(
  p_id uuid, p_seat_id uuid, p_discount_percent integer, p_lines jsonb,
  p_payment_method text, p_transfer_photo_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_seat_name text;
  v_start smallint;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
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
  perform public.check_payment(p_payment_method, p_transfer_photo_id);
  perform public.check_lines(p_lines);

  select business_day_start_hour into v_start from public.settings where id = 1;
  -- Số tiền tạm là 1đ để qua ràng buộc; refresh_totals tính lại ngay sau khi ghi dòng đơn
  insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, seat_name, status,
                             created_by, created_at, paid_at, business_date, payment_method, transfer_photo_id)
  values (p_id, 1, 1, 1, p_seat_id, v_seat_name, 'paid', auth.uid(), now(), now(),
          public.compute_business_date(now(), v_start), p_payment_method, p_transfer_photo_id)
  on conflict (id) do nothing;
  if not found then
    select * into v_order from public.orders where id = p_id;
    return public.order_summary(v_order, true);
  end if;
  insert into public.order_rounds (id, order_id, created_by) values (p_id, p_id, auth.uid());
  perform public.insert_lines(p_id, p_id, p_lines);
  return public.order_summary(public.refresh_totals(p_id, p_discount_percent), false);
end
$$;

create function public.round_summary(p_round uuid, p_duplicate boolean)
returns jsonb language sql stable set search_path = public as $$
  select jsonb_build_object(
    'round_id', r.id, 'order_id', o.id, 'seat_name', o.seat_name, 'created_at', r.created_at,
    'item_count', (select coalesce(sum(quantity), 0) from public.order_lines where round_id = r.id),
    'subtotal_amount', (select coalesce(sum(line_amount), 0) from public.order_lines where round_id = r.id),
    'status', case when r.cancelled_at is not null then 'cancelled' else o.status end,
    'duplicate', p_duplicate)
  from public.order_rounds r join public.orders o on o.id = r.order_id
  where r.id = p_round
$$;
revoke execute on function public.round_summary(uuid, boolean) from public, anon, authenticated;

-- SRS FR-04d: gửi một lượt gọi vào đơn chờ thanh toán của chỗ ngồi (tạo đơn nếu chưa có)
create function public.add_round(p_round_id uuid, p_seat_id uuid, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
  v_seat_name text;
  v_start smallint;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  if exists (select 1 from public.order_rounds where id = p_round_id) then
    return public.round_summary(p_round_id, true);
  end if;
  if p_seat_id is null then
    raise exception 'SEAT_REQUIRED';
  end if;
  select name into v_seat_name from public.seats where id = p_seat_id and not is_archived;
  if not found then
    raise exception 'SEAT_NOT_FOUND';
  end if;
  perform public.check_lines(p_lines);

  select * into v_order from public.orders where seat_id = p_seat_id and status = 'open' for update;
  if not found then
    select business_day_start_hour into v_start from public.settings where id = 1;
    begin
      insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, seat_name, status,
                                 created_by, created_at, business_date, payment_method)
      values (gen_random_uuid(), 1, 1, 1, p_seat_id, v_seat_name, 'open', auth.uid(), now(),
              public.compute_business_date(now(), v_start), null)
      returning * into v_order;
    exception when unique_violation then
      -- Máy khác vừa mở đơn cho chỗ ngồi này
      select * into v_order from public.orders where seat_id = p_seat_id and status = 'open' for update;
    end;
  end if;
  if (select count(*) from public.order_lines ol join public.order_rounds r on r.id = ol.round_id
      where ol.order_id = v_order.id and r.cancelled_at is null) + jsonb_array_length(p_lines) > 60 then
    raise exception 'LINE_LIMIT';
  end if;

  insert into public.order_rounds (id, order_id, created_by) values (p_round_id, v_order.id, auth.uid())
  on conflict (id) do nothing;
  if not found then
    return public.round_summary(p_round_id, true);
  end if;
  perform public.insert_lines(v_order.id, p_round_id, p_lines);
  perform public.refresh_totals(v_order.id, 0);
  return public.round_summary(p_round_id, false);
end
$$;

-- SRS FR-04d: thu tiền một đơn chờ thanh toán. p_expected_subtotal là tạm tính nhân viên đang thấy:
-- lệch (máy khác vừa gửi hoặc hủy lượt gọi) thì từ chối, để khách không trả theo số cũ.
create function public.checkout_order(
  p_order_id uuid, p_expected_subtotal integer, p_discount_percent integer, p_payment_method text, p_transfer_photo_id text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status <> 'open' then
    raise exception 'ORDER_NOT_OPEN' using detail = v_order.status;
  end if;
  if v_order.subtotal_amount is distinct from p_expected_subtotal then
    raise exception 'ORDER_CHANGED';
  end if;
  if p_discount_percent is null or p_discount_percent < 0 or p_discount_percent > 100 then
    raise exception 'INVALID_DISCOUNT';
  end if;
  perform public.check_payment(p_payment_method, p_transfer_photo_id);
  perform public.refresh_totals(p_order_id, p_discount_percent);
  update public.orders
  set status = 'paid', payment_method = p_payment_method, transfer_photo_id = p_transfer_photo_id, paid_at = now()
  where id = p_order_id
  returning * into v_order;
  return public.order_summary(v_order, false);
end
$$;

-- SRS FR-04d: hủy một lượt gọi. Nhân viên trong 5 phút từ lúc gửi lượt đó; chủ quán mọi lúc.
create function public.cancel_round(p_round_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_round public.order_rounds;
  v_order public.orders;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_round from public.order_rounds where id = p_round_id;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  select * into v_order from public.orders where id = v_round.order_id for update;
  if v_round.cancelled_at is not null or v_order.status = 'cancelled' then
    return;
  end if;
  if v_order.status <> 'open' then
    raise exception 'ORDER_NOT_OPEN' using detail = v_order.status;
  end if;
  if not public.is_owner() and now() - v_round.created_at > interval '5 minutes' then
    raise exception 'CANCEL_WINDOW_EXPIRED';
  end if;
  update public.order_rounds set cancelled_at = now(), cancelled_by = auth.uid() where id = p_round_id;
  if public.refresh_totals(v_order.id, 0) is null then
    update public.orders set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
    where id = v_order.id;
  end if;
end
$$;

-- Dòng đơn dạng JSON, nhóm theo lượt gọi chưa hủy
create function public.round_lines(p_round uuid)
returns jsonb language sql stable set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
           'item_name', item_name, 'unit_price', unit_price, 'quantity', quantity,
           'line_amount', line_amount, 'note', note) order by sort_order), '[]'::jsonb)
  from public.order_lines where round_id = p_round
$$;
revoke execute on function public.round_lines(uuid) from public, anon, authenticated;

-- SRS FR-04d: danh sách đơn chờ thanh toán của cả quán
create function public.list_open_orders()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return (
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', o.id, 'seat_id', o.seat_id, 'seat_name', o.seat_name, 'created_at', o.created_at,
             'item_count', o.item_count, 'subtotal_amount', o.subtotal_amount,
             'rounds', (select jsonb_agg(jsonb_build_object(
                          'id', r.id, 'created_at', r.created_at, 'lines', public.round_lines(r.id))
                        order by r.created_at)
                        from public.order_rounds r where r.order_id = o.id and r.cancelled_at is null))
           order by o.created_at), '[]'::jsonb)
    from public.orders o where o.status = 'open');
end
$$;

-- SRS FR-04b: Đơn vừa tạo gồm đơn trả ngay (id đơn) và lượt gọi Trả sau (id lượt gọi) của máy này
drop function public.list_orders_by_ids(uuid[]);
create function public.list_orders_by_ids(p_ids uuid[])
returns table (id uuid, kind text, item_count integer, subtotal_amount integer, discount_percent integer,
               discount_amount integer, total_amount integer, seat_name text, status text,
               created_at timestamptz, payment_method text, transfer_photo_id text, lines jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select * from (
      select o.id, 'order'::text, o.item_count, o.subtotal_amount, o.discount_percent, o.discount_amount,
             o.total_amount, o.seat_name, o.status, o.created_at, o.payment_method, o.transfer_photo_id,
             public.round_lines(o.id)
      from public.orders o
      where o.id = any (p_ids) and o.business_date = public.current_business_date()
      union all
      select r.id, 'round', s.item_count, s.subtotal_amount, 0, 0, s.subtotal_amount, o.seat_name,
             case when r.cancelled_at is not null then 'cancelled' else o.status end,
             r.created_at, null, null, public.round_lines(r.id)
      from public.order_rounds r
      join public.orders o on o.id = r.order_id
      cross join lateral (select sum(quantity)::integer item_count, sum(line_amount)::integer subtotal_amount
                          from public.order_lines where round_id = r.id) s
      where r.id = any (p_ids) and r.id <> o.id and o.business_date = public.current_business_date()
    ) x
    order by 10 desc;
end
$$;

-- SRS FR-06, R47: món bán chạy (theo số món) và số món theo giờ của đơn đã thanh toán
create function public.item_stats(p_from date, p_to date)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;
  return (
    with sold as (
      select ol.item_name, ol.quantity,
             extract(hour from r.created_at at time zone 'Asia/Ho_Chi_Minh')::integer as hour
      from public.order_lines ol
      join public.order_rounds r on r.id = ol.round_id and r.cancelled_at is null
      join public.orders o on o.id = ol.order_id and o.status = 'paid'
      where o.business_date between p_from and p_to)
    select jsonb_build_object(
      'top', (select coalesce(jsonb_agg(t order by t.quantity desc, t.item_name), '[]'::jsonb)
              from (select item_name, sum(quantity)::integer quantity from sold
                    group by item_name order by 2 desc, 1 limit 5) t),
      'hours', (select coalesce(jsonb_agg(h order by h.hour), '[]'::jsonb)
                from (select hour, sum(quantity)::integer quantity from sold group by hour) h)));
end
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.add_round(uuid, uuid, jsonb)', 'public.checkout_order(uuid, integer, integer, text, text)',
    'public.cancel_round(uuid)', 'public.list_open_orders()', 'public.list_orders_by_ids(uuid[])',
    'public.item_stats(date, date)']
  loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end
$$;

-- Nhân viên không hủy cả đơn chờ thanh toán; chỉ hủy từng lượt gọi (cancel_round). Chủ quán hủy được cả đơn.
create or replace function public.cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status = 'cancelled' then
    return;
  end if;
  if not public.is_owner() then
    if v_order.status = 'open' then
      raise exception 'ORDER_NOT_OPEN' using detail = 'open';
    end if;
    if now() - v_order.created_at > interval '5 minutes' then
      raise exception 'CANCEL_WINDOW_EXPIRED';
    end if;
  end if;
  update public.orders
  set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
  where id = p_order_id;
end
$$;
