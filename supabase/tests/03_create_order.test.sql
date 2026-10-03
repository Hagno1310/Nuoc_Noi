begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');
update public.settings set current_price = 25000, business_day_start_hour = 6 where id = 1;
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c9', 'Quầy 9', 'counter');
insert into public.seats (id, name, kind, is_archived) values ('00000000-0000-0000-0000-0000000000c8', 'Ghế cũ', 'counter', true);

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$select public.create_order(gen_random_uuid(), 1, null, false, 25000)$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không tạo được đơn');
select throws_ok($$select * from public.list_active_seats()$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không xem được chỗ ngồi');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);

create temp table o1 as select public.create_order(
  '00000000-0000-0000-0000-000000000001', 7, '00000000-0000-0000-0000-0000000000c9', false, 25000) as r;
select is((select (r ->> 'unit_price')::int from o1), 25000, 'dùng đơn giá chung hiện hành');
select is((select (r ->> 'total_amount')::int from o1), 175000, 'thành tiền = 7 × 25000');
select is((select (r ->> 'price_changed')::boolean from o1), false, 'giá khớp thì price_changed = false');
select is((select (r ->> 'duplicate')::boolean from o1), false, 'đơn mới không phải duplicate');
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000001'), 'Quầy 9', 'lưu tên chỗ ngồi tại thời điểm tạo');
select is((select created_by::text from public.orders where id = '00000000-0000-0000-0000-000000000001'), '00000000-0000-0000-0000-0000000000b1', 'lưu người tạo');
select is((select business_date from public.orders where id = '00000000-0000-0000-0000-000000000001'),
  public.compute_business_date(now(), 6::smallint), 'business_date theo giờ mở cửa');

-- Mạng rớt sau khi server đã ghi, nhân viên bấm gửi lại cùng id
select is((public.create_order('00000000-0000-0000-0000-000000000001', 7, '00000000-0000-0000-0000-0000000000c9', false, 25000) ->> 'duplicate')::boolean,
  true, 'gửi lại cùng id → duplicate');
select is((select count(*)::int from public.orders where id = '00000000-0000-0000-0000-000000000001'), 1, 'không tạo đơn thứ hai');

-- Giá trên máy đã cũ
create temp table o2 as select public.create_order('00000000-0000-0000-0000-000000000002', 1, null, false, 20000) as r;
select is((select (r ->> 'unit_price')::int || '/' || (r ->> 'price_changed') from o2), '25000/true', 'giá cũ trên máy: server dùng giá mới và báo price_changed');

-- Kiểm tra dữ liệu đầu vào
select throws_ok($$select public.create_order(gen_random_uuid(), 0, null, false, 25000)$$, 'P0001', 'INVALID_QUANTITY', 'số lượng 0 bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), 501, null, false, 25000)$$, 'P0001', 'INVALID_QUANTITY', 'số lượng 501 bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), 1, '00000000-0000-0000-0000-0000000000c9', true, 25000)$$,
  'P0001', 'INVALID_SEAT', 'không được vừa mang về vừa có chỗ ngồi');
select throws_ok($$select public.create_order(gen_random_uuid(), 1, gen_random_uuid(), false, 25000)$$,
  'P0001', 'SEAT_NOT_FOUND', 'chỗ ngồi không tồn tại');

select public.create_order('00000000-0000-0000-0000-000000000003', 2, null, true, 25000);
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000003'), 'Mang về', 'mang về có seat_name = Mang về');

select ok(exists (select 1 from public.list_active_seats() where name = 'Quầy 9' and kind = 'counter'), 'có ghế quầy đang dùng, kèm loại');
select ok(not exists (select 1 from public.list_active_seats() where name = 'Ghế cũ'), 'không trả về chỗ ngồi đã ẩn');

select * from finish();
rollback;
