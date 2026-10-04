begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, email, aud, role, encrypted_password) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated', extensions.crypt('matkhau123', extensions.gen_salt('bf'))),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated', extensions.crypt('123456', extensions.gen_salt('bf')));
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

-- Nhân viên có phiên hợp lệ
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select is(public.is_staff(), true, 'nhân viên có quyền staff');
select is(public.is_owner(), false, 'nhân viên không có quyền owner');
select throws_ok($$select public.set_shop_pin('654321')$$, 'P0001', 'FORBIDDEN', 'nhân viên không đổi được PIN');

insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c1', 'Bàn 1', 'table');
insert into public.orders (id, quantity, unit_price, seat_id, created_by, business_date)
  values ('00000000-0000-0000-0000-0000000000d1', 1, 25000, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', current_date);
set local role authenticated;
select is((select count(*)::int from public.orders), 0, 'RLS: nhân viên không đọc được orders');
select throws_ok($$insert into public.seats (name, kind) values ('X', 'table')$$, '42501', null, 'RLS: nhân viên không thêm được seats');
select is((select count(*)::int from public.app_roles), 1, 'RLS: chỉ đọc được dòng app_roles của mình');
reset role;

-- Phiên không tồn tại thì mất quyền
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000ff"}', true);
select is(public.is_staff(), false, 'phiên không tồn tại thì không có quyền');

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select is(public.is_staff(), false, 'chưa đăng nhập thì không có quyền');

-- Chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select is(public.is_owner() and public.is_staff(), true, 'chủ quán có cả hai quyền');
set local role authenticated;
select is((select count(*)::int from public.orders), 1, 'RLS: chủ quán đọc được orders');
select lives_ok($$insert into public.seats (name, kind) values ('Bàn 2', 'table')$$, 'RLS: chủ quán thêm được seats');
select is_empty($$delete from public.seats returning 1$$, 'RLS: chủ quán không xóa được seats');
reset role;
select throws_ok($$select public.set_shop_pin('12ab')$$, 'P0001', 'INVALID_PIN_FORMAT', 'PIN phải đúng 6 chữ số');
select lives_ok($$select public.set_shop_pin('654321')$$, 'chủ quán đổi được PIN');
select is((select encrypted_password = extensions.crypt('654321', encrypted_password) from auth.users where id = '00000000-0000-0000-0000-0000000000b1'),
  true, 'mật khẩu tài khoản nhân viên đã thành PIN mới');
select is((select count(*)::int from auth.sessions where user_id = '00000000-0000-0000-0000-0000000000b1'), 0, 'mọi phiên của nhân viên bị xóa');
select is((select count(*)::int from auth.sessions where user_id = '00000000-0000-0000-0000-0000000000a1'), 1, 'phiên của chủ quán vẫn còn');

-- Chưa có tài khoản nhân viên
delete from public.app_roles where role = 'staff';
select throws_ok($$select public.set_shop_pin('111111')$$, 'P0001', 'STAFF_ACCOUNT_MISSING', 'báo lỗi khi chưa tạo tài khoản nhân viên');


-- anon
select set_config('request.jwt.claims', '{}', true);
set local role anon;
select is(public.is_staff(), false, 'anon gọi is_staff() nhận false');
reset role;

select * from finish();
rollback;
