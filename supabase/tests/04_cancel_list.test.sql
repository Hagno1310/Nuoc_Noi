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

insert into public.menu_items (id, name, price) values ('00000000-0000-0000-0000-0000000000e1', 'Thử A', 25000);
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c1', 'Bàn 1', 'table');
insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, created_by, created_at, business_date) values
  ('00000000-0000-0000-0000-0000000000d1', 1, 25000, 25000, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', now() - interval '2 minutes', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d2', 2, 50000, 50000, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', now() - interval '6 minutes', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d3', 3, 75000, 75000, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000a1', now() - interval '1 minute', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d4', 4, 100000, 100000, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', now() - interval '1 day', public.current_business_date() - 1);
insert into public.order_lines (order_id, menu_item_id, item_name, unit_price, quantity, sort_order) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', 'Thử A', 25000, 1, 1);

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d1')$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không hủy được');
select throws_ok($$select * from public.list_orders_by_ids(array['00000000-0000-0000-0000-0000000000d1'::uuid])$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không xem được');

-- Nhân viên
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select is((select count(*)::int from public.list_orders_by_ids(array[
  '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d4']::uuid[])),
  2, 'chỉ trả về đơn của ngày kinh doanh hiện tại');
select is((select id from public.list_orders_by_ids(array[
  '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2']::uuid[]) limit 1),
  '00000000-0000-0000-0000-0000000000d1'::uuid, 'mới nhất ở trên');
select is((select lines from public.list_orders_by_ids(array['00000000-0000-0000-0000-0000000000d1']::uuid[])),
  '[{"item_name": "Thử A", "unit_price": 25000, "quantity": 1, "line_amount": 25000}]'::jsonb, 'trả kèm dòng đơn');

select lives_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d3')$$, 'nhân viên hủy được đơn của người khác trong 5 phút');
select is((select status || '/' || cancelled_by from public.orders where id = '00000000-0000-0000-0000-0000000000d3'),
  'cancelled/00000000-0000-0000-0000-0000000000b1', 'ghi trạng thái và người hủy');
select lives_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d3')$$, 'hủy lần 2 không lỗi');
select throws_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d2')$$, 'P0001', 'CANCEL_WINDOW_EXPIRED', 'nhân viên không hủy được đơn quá 5 phút');
select throws_ok($$select public.cancel_order(gen_random_uuid())$$, 'P0001', 'ORDER_NOT_FOUND', 'đơn không tồn tại');

-- Chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select lives_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d2')$$, 'chủ quán hủy được đơn quá 5 phút');
select is((select cancelled_by::text from public.orders where id = '00000000-0000-0000-0000-0000000000d2'), '00000000-0000-0000-0000-0000000000a1', 'ghi chủ quán là người hủy');

select * from finish();
rollback;
