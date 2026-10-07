begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c9', 'Quầy 9', 'counter');
insert into public.menu_items (id, name, price) values ('00000000-0000-0000-0000-0000000000e1', 'Thử A', 190000);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);

-- Tiền mặt
create temp table c1 as select public.create_order('00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'cash', null) as r;
select is((select r ->> 'payment_method' from c1), 'cash', 'đơn tiền mặt');
select is((select transfer_photo_id from public.orders where id = '00000000-0000-0000-0000-000000000101'), null, 'tiền mặt không có ảnh');

-- Chuyển khoản kèm ảnh
create temp table t1 as select public.create_order('00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]',
  'transfer', 'nuoc-noi/transfer/11111111-1111-1111-1111-111111111111') as r;
select is((select (r ->> 'payment_method') || '|' || (r ->> 'transfer_photo_id') from t1),
  'transfer|nuoc-noi/transfer/11111111-1111-1111-1111-111111111111', 'đơn chuyển khoản lưu public_id ảnh');

-- Đầu vào sai
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', null, null)$$,
  'P0001', 'PAYMENT_REQUIRED', 'thiếu hình thức thanh toán');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'card', null)$$,
  'P0001', 'PAYMENT_REQUIRED', 'hình thức thanh toán lạ');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'transfer', null)$$,
  'P0001', 'PHOTO_REQUIRED', 'chuyển khoản thiếu ảnh');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'transfer', 'https://evil.example/x.jpg')$$,
  'P0001', 'PHOTO_REQUIRED', 'ảnh không đúng mẫu public_id');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'cash',
  'nuoc-noi/transfer/11111111-1111-1111-1111-111111111111')$$,
  'P0001', 'INVALID_PAYMENT', 'tiền mặt không được kèm ảnh');

-- Gửi lại cùng id: trả đơn đã ghi trước mọi kiểm tra, kể cả khi lần gửi lại đổi hình thức thanh toán
select is((select public.create_order('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'cash', null)
  ->> 'payment_method'), 'transfer', 'gửi lại cùng id trả về đơn đã ghi');

-- Ràng buộc bảng: không ghi được chuyển khoản thiếu ảnh kể cả khi đi vòng qua RPC
select throws_ok($$insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, created_by, business_date, payment_method)
  values (gen_random_uuid(), 1, 1000, 1000, '00000000-0000-0000-0000-0000000000c9', '00000000-0000-0000-0000-0000000000b1', '2026-10-07', 'transfer')$$,
  '23514', null, 'ràng buộc: chuyển khoản phải có ảnh');

-- Đơn vừa tạo trả hình thức thanh toán và ảnh
select is((select payment_method || '|' || transfer_photo_id from public.list_orders_by_ids(array['00000000-0000-0000-0000-000000000102'::uuid])),
  'transfer|nuoc-noi/transfer/11111111-1111-1111-1111-111111111111', 'list_orders_by_ids trả hình thức thanh toán và ảnh');

-- Dòng tổng tách theo hình thức thanh toán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select is((select public.history_totals(public.current_business_date(), public.current_business_date()) ->> 'cash_revenue'),
  '190000', 'doanh thu tiền mặt');
select is((select public.history_totals(public.current_business_date(), public.current_business_date()) ->> 'transfer_revenue'),
  '190000', 'doanh thu chuyển khoản');

-- Quyền thực thi
select ok(not has_function_privilege('anon', 'public.create_order(uuid, uuid, integer, jsonb, text, text)', 'execute'),
  'anon không gọi được create_order');
select hasnt_function('public', 'create_order', array['uuid', 'uuid', 'integer', 'jsonb'], 'bỏ create_order 4 tham số');

select * from finish();
rollback;
