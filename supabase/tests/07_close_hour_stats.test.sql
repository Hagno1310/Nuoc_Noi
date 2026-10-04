begin;
create extension if not exists pgtap with schema extensions;
select plan(20);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

-- 2026-10-14 là thứ Tư; tuần này bắt đầu 2026-10-12 (thứ Hai)
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c1', 'Bàn 1', 'table');
insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, status, created_by, business_date) values
  (gen_random_uuid(), 2, 50000, 50000, '00000000-0000-0000-0000-0000000000c1', 'paid',      '00000000-0000-0000-0000-0000000000b1', '2026-10-14'),
  (gen_random_uuid(), 9, 225000, 225000, '00000000-0000-0000-0000-0000000000c1', 'cancelled', '00000000-0000-0000-0000-0000000000b1', '2026-10-14'),
  (gen_random_uuid(), 4, 100000, 100000, '00000000-0000-0000-0000-0000000000c1', 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-10-13'),
  (gen_random_uuid(), 1, 25000, 25000, '00000000-0000-0000-0000-0000000000c1', 'paid',      '00000000-0000-0000-0000-0000000000b1', '2026-10-12'),
  (gen_random_uuid(), 3, 60000, 60000, '00000000-0000-0000-0000-0000000000c1', 'paid',      '00000000-0000-0000-0000-0000000000b1', '2026-10-07'), -- thứ Tư tuần trước
  (gen_random_uuid(), 5, 100000, 100000, '00000000-0000-0000-0000-0000000000c1', 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-10-08'), -- thứ Năm tuần trước: ngoài cùng đoạn
  (gen_random_uuid(), 6, 120000, 120000, '00000000-0000-0000-0000-0000000000c1', 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-09-10'), -- trong ngày 1–14 tháng trước
  (gen_random_uuid(), 7, 140000, 140000, '00000000-0000-0000-0000-0000000000c1', 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-09-20'); -- ngoài cùng đoạn tháng trước

-- Nhân viên không gọi được
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select throws_ok($$select public.owner_stats('2026-10-14')$$, 'P0001', 'FORBIDDEN', 'nhân viên không xem được thống kê');
select throws_ok($$select public.update_business_day_end_hour(3)$$, 'P0001', 'FORBIDDEN', 'nhân viên không đổi được giờ đóng cửa');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);

-- Giờ đóng cửa
select is((select business_day_end_hour::int from public.settings where id = 1), 2, 'giờ đóng cửa mặc định là 2');
select public.update_business_day_end_hour(3);
select is((select business_day_end_hour::int from public.settings where id = 1), 3, 'chủ quán đổi được giờ đóng cửa');
select throws_ok($$select public.update_business_day_end_hour(20)$$, 'P0001', 'INVALID_HOUR', 'giờ đóng cửa không được trùng giờ mở cửa');
select throws_ok($$select public.update_business_day_end_hour(24)$$, 'P0001', 'INVALID_HOUR', 'giờ đóng cửa trong khoảng 0–23');
select throws_ok($$select public.update_business_day_start_hour(3)$$, 'P0001', 'INVALID_HOUR', 'giờ mở cửa không được trùng giờ đóng cửa');

create temp table st as select public.owner_stats('2026-10-14') as r;

select is((select r -> 'day' -> 'current' from st), '{"revenue": 50000, "item_count": 2, "order_count": 1, "discount_total": 0}'::jsonb, 'ngày kinh doanh hiện tại không tính đơn hủy');
select is((select r -> 'day' -> 'previous' from st), '{"revenue": 100000, "item_count": 4, "order_count": 1, "discount_total": 0}'::jsonb, 'ngày kinh doanh hôm trước');
select is((select r -> 'week' -> 'current' from st), '{"revenue": 175000, "item_count": 7, "order_count": 3, "discount_total": 0}'::jsonb, 'tuần này từ thứ Hai đến hôm nay');
select is((select r -> 'week' -> 'previous' from st), '{"revenue": 60000, "item_count": 3, "order_count": 1, "discount_total": 0}'::jsonb, 'tuần trước chỉ tính cùng đoạn thứ Hai đến thứ Tư');
select is((select r -> 'month' -> 'current' from st), '{"revenue": 335000, "item_count": 15, "order_count": 5, "discount_total": 0}'::jsonb, 'tháng này từ ngày 1 đến hôm nay');
select is((select r -> 'month' -> 'previous' from st), '{"revenue": 120000, "item_count": 6, "order_count": 1, "discount_total": 0}'::jsonb, 'tháng trước chỉ tính ngày 1 đến ngày 14');

select is((select jsonb_array_length(r -> 'month_days') from st), 31, 'chuỗi tháng có đủ 31 ngày của tháng 10');
select is((select r -> 'month_days' -> 13 from st), '{"day": 14, "revenue": 50000, "previous_revenue": 0}'::jsonb, 'ngày 14: doanh thu hiện tại và cùng ngày tháng trước');
select is((select r -> 'month_days' -> 14 -> 'revenue' from st), 'null'::jsonb, 'ngày chưa tới để trống');
select is((select r -> 'month_days' -> 30 -> 'previous_revenue' from st), 'null'::jsonb, 'ngày 31 không có ở tháng 9');
select is((select jsonb_array_length(r -> 'week_days') from st), 7, 'chuỗi tuần có 7 ngày');
select is((select r -> 'week_days' -> 2 from st), '{"weekday": 3, "revenue": 50000, "previous_revenue": 60000}'::jsonb, 'thứ Tư so với thứ Tư tuần trước');

-- Tháng trước ngắn hơn: 31/3 so với 1–28/2 (2027 không nhuận)
insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, status, created_by, business_date) values
  (gen_random_uuid(), 1, 10000, 10000, '00000000-0000-0000-0000-0000000000c1', 'paid', '00000000-0000-0000-0000-0000000000b1', '2027-02-28');
select is((select public.owner_stats('2027-03-31') -> 'month' -> 'previous' ->> 'revenue'), '10000', 'tháng trước ngắn hơn thì tính đến hết tháng trước');

select * from finish();
rollback;
