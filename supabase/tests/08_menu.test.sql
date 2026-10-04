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

-- Thực đơn khởi tạo (SRS FR-05)
select is((select count(*)::int from public.menu_items), 8, 'thực đơn khởi tạo có 8 món');
select is((select price from public.menu_items where name = 'Bình Zax'), 800000, 'Bình Zax 800.000đ');
select is((select count(*)::int from public.menu_price_history where changed_by is null), 8,
  'mỗi món khởi tạo có một dòng lịch sử giá, người đổi để trống (hiện "Khởi tạo")');

-- Ràng buộc giá và tên
select throws_ok($$insert into public.menu_items (name, price) values ('Rẻ', 999)$$, '23514', null, 'giá dưới 1.000đ bị từ chối');
select throws_ok($$insert into public.menu_items (name, price) values ('Đắt', 5000001)$$, '23514', null, 'giá trên 5.000.000đ bị từ chối');
select throws_ok($$insert into public.menu_items (name, price) values ('   ', 1000)$$, '23514', null, 'tên rỗng bị từ chối');
select throws_ok($$insert into public.menu_items (name, price) values (' classic ', 1000)$$, '23505', null,
  'trùng tên một món đang bán (không phân biệt hoa thường, khoảng trắng) bị từ chối');

-- Nhân viên: đọc được, không ghi được
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
set local role authenticated;
select is((select count(*)::int from public.menu_items), 8, 'nhân viên đọc được thực đơn');
select throws_ok($$insert into public.menu_items (name, price) values ('X', 1000)$$, '42501', null, 'nhân viên không thêm được món');
update public.menu_items set price = 1000 where name = 'Classic';
reset role;
select is((select price from public.menu_items where name = 'Classic'), 190000, 'nhân viên không đổi được giá');

-- Chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
set local role authenticated;
update public.menu_items set price = 200000 where name = 'Classic';
update public.menu_items set sort_order = 99 where name = 'Classic';
delete from public.menu_items where name = 'Neat';
update public.menu_items set is_archived = true where name = 'Mocktail';
reset role;
select is((select h.changed_by::text from public.menu_price_history h
             join public.menu_items m on m.id = h.menu_item_id
           where m.name = 'Classic' order by h.id desc limit 1),
  '00000000-0000-0000-0000-0000000000a1', 'đổi giá ghi lịch sử kèm người đổi');
select is((select count(*)::int from public.menu_price_history h
             join public.menu_items m on m.id = h.menu_item_id where m.name = 'Classic'),
  2, 'đổi thứ tự không ghi thêm lịch sử giá');
select is((select count(*)::int from public.menu_items where name = 'Neat'), 1, 'không xóa cứng được món');
select lives_ok($$insert into public.menu_items (name, price) values ('Mocktail', 120000)$$, 'tên của món đã ẩn dùng lại được');

-- Realtime chỉ gửi sự kiện cho người đọc được dòng: nhân viên phải thấy cả món đã ẩn
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
set local role authenticated;
select is((select count(*)::int from public.menu_items where is_archived), 1, 'nhân viên vẫn thấy món đã ẩn');
reset role;

select * from finish();
rollback;
