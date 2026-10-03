begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select throws_ok($$select public.update_price(200000)$$, 'P0001', 'FORBIDDEN', 'nhân viên không đổi được giá');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select public.update_price(500000);
select is((select current_price from public.settings where id = 1), 500000, 'chấp nhận đúng mức tối đa 500.000đ');
select throws_ok($$select public.update_price(500001)$$, 'P0001', 'INVALID_PRICE', 'từ chối giá trên 500.000đ');
select is((select current_price from public.settings where id = 1), 500000, 'giá bị từ chối không ghi đè giá cũ');

select * from finish();
rollback;
