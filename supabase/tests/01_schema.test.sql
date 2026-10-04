begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public', 'settings', 'có bảng settings');
select has_table('public', 'seats', 'có bảng seats');
select has_table('public', 'orders', 'có bảng orders');
select has_table('public', 'order_lines', 'có bảng order_lines');
select has_table('public', 'menu_items', 'có bảng menu_items');
select hasnt_table('public', 'price_history', 'bỏ price_history, thay bằng menu_price_history');
select hasnt_column('public', 'settings', 'current_price', 'bỏ đơn giá chung');
select hasnt_column('public', 'orders', 'is_takeaway', 'bỏ Mang về (SRS R38)');
select col_not_null('public', 'orders', 'seat_id', 'mọi đơn bắt buộc có chỗ ngồi');

-- 22:59 UTC = 05:59 giờ VN ngày 04/10, vẫn thuộc ngày kinh doanh 03/10 khi giờ mở cửa là 6
select is(public.compute_business_date('2026-10-03 22:59:00+00', 6::smallint), '2026-10-03'::date, '05:59 VN thuộc ngày hôm trước');
-- 23:00 UTC = 06:00 giờ VN ngày 04/10, bắt đầu ngày kinh doanh 04/10
select is(public.compute_business_date('2026-10-03 23:00:00+00', 6::smallint), '2026-10-04'::date, '06:00 VN là ngày mới');

set local role anon;
select is((select count(*)::int from public.settings), 1, 'anon đọc được settings');
select throws_ok(
  $$insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, created_by, business_date)
    values (gen_random_uuid(), 1, 1000, 1000, gen_random_uuid(), gen_random_uuid(), current_date)$$,
  '42501'
);
reset role;

select * from finish();
rollback;
