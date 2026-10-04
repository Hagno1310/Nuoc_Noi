begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public', 'settings', 'có bảng settings');
select has_table('public', 'price_history', 'có bảng price_history');
select has_table('public', 'seats', 'có bảng seats');
select has_table('public', 'orders', 'có bảng orders');

-- 22:59 UTC = 05:59 giờ VN ngày 04/10, vẫn thuộc ngày kinh doanh 03/10 khi giờ mở cửa là 6
select is(public.compute_business_date('2026-10-03 22:59:00+00', 6::smallint), '2026-10-03'::date, '05:59 VN thuộc ngày hôm trước');
-- 23:00 UTC = 06:00 giờ VN ngày 04/10, bắt đầu ngày kinh doanh 04/10
select is(public.compute_business_date('2026-10-03 23:00:00+00', 6::smallint), '2026-10-04'::date, '06:00 VN là ngày mới');

select is((select current_price from public.settings where id = 1), 25000, 'giá mặc định 25000');
select is((select count(*)::int from public.price_history), 1, 'có 1 dòng price_history khởi tạo');

set local role anon;
select is((select count(*)::int from public.settings), 1, 'anon đọc được settings');
select throws_ok(
  $$insert into public.orders (id, quantity, unit_price, created_by, business_date)
    values (gen_random_uuid(), 1, 1000, gen_random_uuid(), current_date)$$,
  '42501'
);
reset role;

select * from finish();
rollback;
