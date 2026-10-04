begin;
create extension if not exists pgtap with schema extensions;
select plan(45);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');
update public.settings set business_day_start_hour = 6 where id = 1;
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c9', 'Quầy 9', 'counter');
insert into public.seats (id, name, kind, is_archived) values ('00000000-0000-0000-0000-0000000000c8', 'Ghế cũ', 'counter', true);
-- Món riêng cho test, giá cố định để phép tính dễ kiểm tra
insert into public.menu_items (id, name, price) values
  ('00000000-0000-0000-0000-0000000000e1', 'Thử A', 190000),
  ('00000000-0000-0000-0000-0000000000e2', 'Thử B', 100000),
  ('00000000-0000-0000-0000-0000000000e3', 'Thử C', 5000000),
  ('00000000-0000-0000-0000-0000000000e5', 'Thử D', 5000000),
  ('00000000-0000-0000-0000-0000000000e6', 'Thử E', 5000000);
insert into public.menu_items (id, name, price, is_archived) values
  ('00000000-0000-0000-0000-0000000000e4', 'Thử cũ', 50000, true);

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]')$$,
  'P0001', 'FORBIDDEN', 'chưa đăng nhập không tạo được đơn');
select throws_ok($$select * from public.list_active_seats()$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không xem được chỗ ngồi');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);

-- 2 × Thử A + 1 × Thử B = 480.000đ, giảm 10% = 48.000đ
create temp table o1 as select public.create_order('00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000c9', 10,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r;
select is((select (r ->> 'subtotal_amount')::int from o1), 480000, 'tạm tính = tổng thành tiền dòng');
select is((select (r ->> 'discount_amount')::int from o1), 48000, 'giảm 10%');
select is((select (r ->> 'total_amount')::int from o1), 432000, 'thành tiền = tạm tính − giảm');
select is((select (r ->> 'item_count')::int from o1), 3, 'số món = tổng số lượng');
select is((select (r ->> 'duplicate')::boolean from o1), false, 'đơn mới không phải duplicate');
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000001'), 'Quầy 9', 'lưu tên chỗ ngồi tại thời điểm tạo');
select is((select count(*)::int from public.order_lines where order_id = '00000000-0000-0000-0000-000000000001'), 2, 'ghi 2 dòng đơn');
select is((select item_name || '/' || unit_price || '/' || quantity || '/' || line_amount
           from public.order_lines where order_id = '00000000-0000-0000-0000-000000000001' order by sort_order limit 1),
  'Thử A/190000/2/380000', 'dòng đơn lưu tên và giá tại lúc bán, đúng thứ tự trong giỏ');
select is((select business_date from public.orders where id = '00000000-0000-0000-0000-000000000001'),
  public.compute_business_date(now(), 6::smallint), 'business_date theo giờ mở cửa');
select is((select created_by::text from public.orders where id = '00000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-0000000000b1', 'lưu người tạo');

-- Gửi lại cùng id (mạng rớt sau khi server đã ghi)
select is((select (r ->> 'duplicate') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c9', 10,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  'true/432000', 'gửi lại cùng id → duplicate, trả về đúng thành tiền');
select is((select count(*)::int from public.orders where id = '00000000-0000-0000-0000-000000000001'), 1, 'không tạo đơn thứ hai');
select is((select count(*)::int from public.order_lines where order_id = '00000000-0000-0000-0000-000000000001'), 2, 'không ghi thêm dòng đơn');

-- Review Focus 1: giá vừa đổi rồi máy gửi lại đơn đã ghi
update public.menu_items set price = 200000 where id = '00000000-0000-0000-0000-0000000000e1';
select is((select r ->> 'duplicate' from (select public.create_order(
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c9', 10,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  'true', 'gửi lại sau khi giá đổi vẫn trả về đơn đã ghi, không báo MENU_CHANGED');
update public.menu_items set price = 190000 where id = '00000000-0000-0000-0000-0000000000e1';

-- Làm tròn số tiền giảm xuống tới 1.000đ
select is((select (r ->> 'discount_amount') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c9', 15,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]') as r) x),
  '28000/162000', '15% của 190.000đ là 28.500đ, làm tròn xuống 28.000đ');
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000002'), 'Quầy 9', 'lưu tên chỗ ngồi của đơn');
select is((select (r ->> 'discount_amount') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000c9', 100,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  '100000/0', 'giảm 100%: thành tiền 0đ hợp lệ');
select is((select (r ->> 'discount_amount') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  '0/100000', 'không giảm giá');
select is(public.discount_amount(1500, 100), 1000, 'công thức làm tròn xuống, kể cả khi tạm tính lẻ');

-- Thực đơn đã đổi: từ chối cả đơn
select throws_ok($$select public.create_order('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":180000}]')$$,
  'P0001', 'MENU_CHANGED', 'giá trên máy khác giá hiện hành → MENU_CHANGED');
select is((select count(*)::int from public.orders where id = '00000000-0000-0000-0000-000000000005'), 0, 'MENU_CHANGED không ghi đơn');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e4","quantity":1,"client_price":50000}]')$$,
  'P0001', 'MENU_CHANGED', 'món đã ẩn → MENU_CHANGED');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e9","quantity":1,"client_price":50000}]')$$,
  'P0001', 'MENU_CHANGED', 'món không tồn tại → MENU_CHANGED');

-- Kiểm tra đầu vào
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 101,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'INVALID_DISCOUNT', 'giảm trên 100% bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', -1,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'INVALID_DISCOUNT', 'giảm âm bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), null, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'SEAT_REQUIRED', 'phải chọn chỗ ngồi');
select hasnt_function('public', 'create_order', array['uuid', 'uuid', 'boolean', 'integer', 'jsonb'], 'bỏ create_order có tham số Mang về');
select throws_ok($$select public.create_order(gen_random_uuid(), gen_random_uuid(), 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'SEAT_NOT_FOUND', 'chỗ ngồi không tồn tại');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c8', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'SEAT_NOT_FOUND', 'chỗ ngồi đã ẩn không được chọn');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0, '[]')$$,
  'P0001', 'INVALID_LINES', 'giỏ trống bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  (select jsonb_agg(jsonb_build_object('menu_item_id', gen_random_uuid(), 'quantity', 1, 'client_price', 1000))
   from generate_series(1, 31)))$$,
  'P0001', 'INVALID_LINES', 'quá 30 dòng bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":2,"client_price":100000}]')$$,
  'P0001', 'INVALID_LINES', 'một món chỉ có một dòng');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":0,"client_price":100000}]')$$,
  'P0001', 'INVALID_QUANTITY', 'số lượng 0 bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":100,"client_price":100000}]')$$,
  'P0001', 'INVALID_QUANTITY', 'số lượng 100 bị từ chối');
-- Review Focus 2: sai kiểu không ra lỗi Postgres thô
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":"abc","client_price":100000}]')$$,
  'P0001', 'INVALID_LINES', 'số lượng không phải số → INVALID_LINES');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1.5,"client_price":100000}]')$$,
  'P0001', 'INVALID_LINES', 'số lượng thập phân → INVALID_LINES');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1}]')$$,
  'P0001', 'INVALID_LINES', 'thiếu giá trên máy → INVALID_LINES');
-- Review Focus 5: 3 × 5.000.000đ × 99 = 1.485.000.000đ
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e3","quantity":99,"client_price":5000000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e5","quantity":99,"client_price":5000000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e6","quantity":99,"client_price":5000000}]')$$,
  'P0001', 'TOTAL_TOO_LARGE', 'tạm tính trên 1.000.000.000đ bị từ chối');

-- Review đợt 1: một dòng thiếu số lượng trong đơn nhiều dòng không được lộ lỗi Postgres thô
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","client_price":100000}]')$$,
  'P0001', 'INVALID_QUANTITY', 'một dòng thiếu số lượng trong đơn nhiều dòng → INVALID_QUANTITY');
-- Review đợt 1: đơn đã ghi nhưng mất phản hồi, rồi bị hủy, máy gửi lại cùng id
select public.cancel_order('00000000-0000-0000-0000-000000000002');
select is((select r ->> 'status' from (select public.create_order(
  '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000c9', 15,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]') as r) x),
  'cancelled', 'gửi lại đơn đã bị hủy trả về trạng thái, để màn order không báo nhầm "Đã tạo đơn"');
select ok(not has_function_privilege('anon', 'public.discount_amount(bigint, integer)', 'execute'),
  'anon không gọi được discount_amount');

select ok(exists (select 1 from public.list_active_seats() where name = 'Quầy 9' and kind = 'counter'), 'có ghế quầy đang dùng, kèm loại');
select ok(not exists (select 1 from public.list_active_seats() where name = 'Ghế cũ'), 'không trả về chỗ ngồi đã ẩn');

select * from finish();
rollback;
