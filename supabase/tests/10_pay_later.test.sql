begin;
create extension if not exists pgtap with schema extensions;
select plan(31);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c9', 'Bàn 9', 'table');
insert into public.menu_items (id, name, price) values
  ('00000000-0000-0000-0000-0000000000e1', 'Thử A', 190000),
  ('00000000-0000-0000-0000-0000000000e2', 'Thử B', 100000);

create function pg_temp.as_staff() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true)
$$;
create function pg_temp.as_owner() returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true)
$$;
select pg_temp.as_staff();

-- Ghi chú: cùng món khác ghi chú là hai dòng
select is((public.create_order('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-0000000000c9', 10,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000,"note":" Ít đá "},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]', 'cash', null)
  ->> 'total_amount'), '513000', 'trả ngay: server tính tiền, giảm 10%');
select is((select note from public.order_lines where order_id = '00000000-0000-0000-0000-000000000201' and quantity = 2),
  'Ít đá', 'ghi chú được cắt khoảng trắng');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000,"note":"a"},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000,"note":"a"}]', 'cash', null)$$,
  'P0001', 'INVALID_LINES', 'trùng món và ghi chú');
select throws_ok(format($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000,"note":"%s"}]', 'cash', null)$$,
  repeat('x', 61)), 'P0001', 'INVALID_LINES', 'ghi chú quá 60 ký tự');

-- Trả sau: lượt gọi đầu tạo đơn chờ thanh toán
create temp table r1 as select public.add_round('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-0000000000c9',
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000}]') as r;
select is((select r ->> 'status' from r1), 'open', 'lượt gọi đầu mở đơn chờ thanh toán');
select is((select r ->> 'subtotal_amount' from r1), '380000', 'tạm tính của lượt gọi');
select is((select count(*)::integer from public.orders where seat_id = '00000000-0000-0000-0000-0000000000c9' and status = 'open'), 1, 'một đơn mở');

-- Lượt gọi thứ hai vào cùng đơn
select public.add_round('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-0000000000c9',
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":3,"client_price":100000}]');
select is((select subtotal_amount from public.orders where status = 'open'), 680000, 'đơn mở cộng dồn hai lượt gọi');
select is((public.add_round('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-0000000000c9',
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":9,"client_price":100000}]') ->> 'duplicate'),
  'true', 'gửi lại cùng id lượt gọi không ghi trùng');
select is((select subtotal_amount from public.orders where status = 'open'), 680000, 'tiền không đổi sau gửi trùng');
select throws_ok($$select public.add_round(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9',
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":90000}]')$$,
  'P0001', 'MENU_CHANGED', 'lệch giá thì từ chối lượt gọi');
select throws_ok($$select public.add_round(gen_random_uuid(), null,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'SEAT_REQUIRED', 'lượt gọi bắt buộc chỗ ngồi');

-- Đơn vừa tạo: lượt gọi hiện riêng
select is((select kind || '|' || status || '|' || total_amount from public.list_orders_by_ids(array['00000000-0000-0000-0000-000000000302'::uuid])),
  'round|open|300000', 'list_orders_by_ids trả lượt gọi');
select is((select jsonb_array_length(public.list_open_orders())), 1, 'danh sách chờ thanh toán');

-- Nhân viên không hủy được cả đơn mở, chỉ hủy lượt gọi
select throws_ok(format('select public.cancel_order(%L)', (select id from public.orders where status = 'open')),
  'P0001', 'ORDER_NOT_OPEN', 'nhân viên không hủy cả đơn chờ thanh toán');
select public.cancel_round('00000000-0000-0000-0000-000000000302');
select is((select subtotal_amount from public.orders where status = 'open'), 380000, 'hủy lượt gọi thì tính lại tạm tính');

-- Thu tiền
select throws_ok(format($$select public.checkout_order(%L, 680000, 0, 'cash', null)$$, (select id from public.orders where status = 'open')),
  'P0001', 'ORDER_CHANGED', 'tạm tính lệch với server thì từ chối thu tiền');
select throws_ok(format($$select public.checkout_order(%L, 380000, 0, 'transfer', null)$$, (select id from public.orders where status = 'open')),
  'P0001', 'PHOTO_REQUIRED', 'thu tiền chuyển khoản bắt buộc ảnh');
create temp table c1 as select public.checkout_order((select id from public.orders where status = 'open'), 380000, 10, 'cash', null) as r;
select is((select (r ->> 'status') || '|' || (r ->> 'total_amount') from c1), 'paid|342000', 'thu tiền: giảm giá cho cả đơn');
select throws_ok(format($$select public.checkout_order(%L, 342000, 0, 'cash', null)$$, (select r ->> 'id' from c1)),
  'P0001', 'ORDER_NOT_OPEN', 'không thu tiền một đơn hai lần');

-- Hủy hết lượt gọi thì đơn chuyển sang đã hủy
select public.add_round('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-0000000000c9',
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]');
select public.cancel_round('00000000-0000-0000-0000-000000000303');
select is((select o.status from public.orders o join public.order_rounds r on r.order_id = o.id
           where r.id = '00000000-0000-0000-0000-000000000303'), 'cancelled', 'hủy hết lượt gọi thì hủy đơn');

-- Báo cáo theo món: chỉ đơn đã thanh toán, lượt gọi đã hủy không tính
select pg_temp.as_owner();
select is((public.item_stats(public.current_business_date(), public.current_business_date()) -> 'top' -> 0 ->> 'quantity'),
  '5', 'món bán chạy: 3 (trả ngay) + 2 (trả sau)');
select is((select sum((h ->> 'quantity')::integer)::integer
           from jsonb_array_elements(public.item_stats(public.current_business_date(), public.current_business_date()) -> 'hours') h),
  5, 'số món theo giờ không tính lượt gọi đã hủy');

-- Giới hạn 60 dòng một đơn chờ thanh toán: 30 + 30 dòng được, thêm 1 dòng bị từ chối
insert into public.menu_items (id, name, price) select gen_random_uuid(), 'Món ' || g, 1000 from generate_series(1, 30) g;
create temp table many as
  select jsonb_agg(jsonb_build_object('menu_item_id', id, 'quantity', 1, 'client_price', 1000)) as l
  from public.menu_items where name like 'Món %';
select pg_temp.as_staff();
select public.add_round(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', (select l from many));
select public.add_round(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', (select l from many));
select throws_ok($$select public.add_round(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9',
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'LINE_LIMIT', 'đơn chờ thanh toán quá 60 dòng');

-- Hủy lượt gọi quá 5 phút
update public.order_rounds set created_at = now() - interval '6 minutes'
where order_id = (select id from public.orders where status = 'open');
select throws_ok(format('select public.cancel_round(%L)',
  (select id from public.order_rounds where order_id = (select id from public.orders where status = 'open') limit 1)),
  'P0001', 'CANCEL_WINDOW_EXPIRED', 'nhân viên không hủy lượt gọi quá 5 phút');

-- Quyền
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$select public.add_round(gen_random_uuid(), null, '[]')$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không gửi lượt gọi');
select throws_ok($$select public.checkout_order(gen_random_uuid(), 0, 0, 'cash', null)$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không thu tiền');
select throws_ok($$select public.cancel_round(gen_random_uuid())$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không hủy lượt gọi');
select throws_ok($$select public.list_open_orders()$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không xem đơn chờ thanh toán');
select pg_temp.as_staff();
select throws_ok($$select public.item_stats(current_date, current_date)$$, 'P0001', 'FORBIDDEN', 'nhân viên không xem báo cáo theo món');
select ok(not has_function_privilege('anon', 'public.add_round(uuid, uuid, jsonb)', 'execute'), 'anon không gọi được add_round');

select * from finish();
rollback;
