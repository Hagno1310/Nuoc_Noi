create table public.app_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'staff'))
);
-- Chỉ có một tài khoản nhân viên chung
create unique index app_roles_single_staff on public.app_roles (role) where role = 'staff';
alter table public.app_roles enable row level security;
create policy app_roles_read_self on public.app_roles for select to authenticated using (user_id = auth.uid());

-- Vai trò của người gọi. Trả về null nếu phiên đăng nhập đã bị xóa (ví dụ sau khi đổi PIN quán).
create function public.current_app_role()
returns text language sql stable security definer set search_path = public, auth as $$
  select r.role
  from public.app_roles r
  where r.user_id = auth.uid()
    and exists (
      select 1 from auth.sessions s
      where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    )
$$;

create function public.is_owner()
returns boolean language sql stable as $$
  select coalesce(public.current_app_role() = 'owner', false)
$$;

create function public.is_staff()
returns boolean language sql stable as $$
  select coalesce(public.current_app_role() in ('staff', 'owner'), false)
$$;

-- Đổi PIN quán = đổi mật khẩu tài khoản nhân viên chung + xóa mọi phiên của tài khoản đó.
-- Supabase Auth dùng bcrypt, nên hash do crypt(..., gen_salt('bf')) tạo ra đăng nhập được.
create function public.set_shop_pin(p_pin text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_staff uuid;
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;
  if p_pin is null or p_pin !~ '^\d{6}$' then
    raise exception 'INVALID_PIN_FORMAT';
  end if;
  select user_id into v_staff from public.app_roles where role = 'staff';
  if v_staff is null then
    raise exception 'STAFF_ACCOUNT_MISSING';
  end if;
  update auth.users
  set encrypted_password = extensions.crypt(p_pin, extensions.gen_salt('bf')), updated_at = now()
  where id = v_staff;
  delete from auth.sessions where user_id = v_staff;
end
$$;

revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.set_shop_pin(text) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.set_shop_pin(text) to authenticated;

create policy owner_read_price_history on public.price_history for select to authenticated using (public.is_owner());
create policy owner_all_seats on public.seats for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_read_orders on public.orders for select to authenticated using (public.is_owner());
