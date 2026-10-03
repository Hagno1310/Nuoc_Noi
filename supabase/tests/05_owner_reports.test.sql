begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

insert into public.orders (id, quantity, unit_price, status, created_by, business_date) values
  (gen_random_uuid(), 2, 25000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 3, 25000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 10, 25000, 'cancelled', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 1, 20000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-01'),
  (gen_random_uuid(), 4, 20000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-09-30');

-- Nhân viên không gọi được RPC của chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select throws_ok($$select public.dashboard_summary('2026-10-15')$$, 'P0001', 'FORBIDDEN', 'nhân viên không xem được tổng quan');
select throws_ok($$select public.update_price(30000)$$, 'P0001', 'FORBIDDEN', 'nhân viên không đổi được giá');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);

create temp table s as select public.dashboard_summary('2026-10-15') as r;
select is((select (r ->> 'today_revenue')::int from s), 125000, 'doanh thu hôm nay không tính đơn hủy');
select is((select (r ->> 'today_cups')::int from s), 5, 'số cốc hôm nay');
select is((select (r ->> 'month_revenue')::int from s), 145000, 'doanh thu tháng không tính tháng trước');
select is((select r ->> 'business_date' from s), '2026-10-15', 'trả về ngày đang xem');

select is(public.history_totals('2026-09-30', '2026-10-15'),
  '{"revenue": 225000, "cups": 10, "order_count": 4}'::jsonb, 'tổng của khoảng lọc chỉ tính đơn đã thanh toán');

select public.update_price(30000);
select is((select current_price from public.settings where id = 1), 30000, 'cập nhật đơn giá chung');
select is((select changed_by::text from public.price_history order by effective_from desc, id desc limit 1),
  '00000000-0000-0000-0000-0000000000a1', 'ghi price_history kèm người đổi');
select throws_ok($$select public.update_price(0)$$, 'P0001', 'INVALID_PRICE', 'giá phải lớn hơn 0');

select throws_ok($$select public.update_business_day_start_hour(24)$$, 'P0001', 'INVALID_HOUR', 'giờ trong khoảng 0–23');
select public.update_business_day_start_hour(4);
select is((select business_day_start_hour::int from public.settings where id = 1), 4, 'cập nhật giờ mở cửa');

select * from finish();
rollback;
