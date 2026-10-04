begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

-- Đơn thứ hai giảm 10%: 75.000đ → giảm 7.000đ (7.500đ làm tròn xuống) → 68.000đ
insert into public.orders (id, item_count, subtotal_amount, discount_percent, discount_amount, total_amount, is_takeaway, status, created_by, business_date) values
  (gen_random_uuid(), 2, 50000, 0, 0, 50000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 3, 75000, 10, 7000, 68000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 10, 250000, 0, 0, 250000, true, 'cancelled', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 1, 20000, 0, 0, 20000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-01'),
  (gen_random_uuid(), 4, 80000, 0, 0, 80000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-09-30');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select throws_ok($$select public.history_totals('2026-09-30', '2026-10-15')$$, 'P0001', 'FORBIDDEN', 'nhân viên không xem được dòng tổng');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select is(public.history_totals('2026-09-30', '2026-10-15'),
  '{"revenue": 218000, "item_count": 10, "order_count": 4, "discount_total": 7000}'::jsonb,
  'dòng tổng: doanh thu sau giảm, không tính đơn hủy, kèm tổng số tiền đã giảm');

select throws_ok($$select public.update_business_day_start_hour(24)$$, 'P0001', 'INVALID_HOUR', 'giờ trong khoảng 0–23');
select public.update_business_day_start_hour(4);
select is((select business_day_start_hour::int from public.settings where id = 1), 4, 'cập nhật giờ mở cửa');

select hasnt_function('public', 'dashboard_summary', 'bỏ dashboard_summary (đã thay bằng owner_stats)');
select hasnt_function('public', 'update_price', 'bỏ update_price (không còn đơn giá chung)');

select * from finish();
rollback;
