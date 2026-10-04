-- Không xóa cứng seats: bỏ policy "for all", chỉ cho đọc/thêm/sửa
drop policy owner_all_seats on public.seats;
create policy owner_read_seats on public.seats for select to authenticated using (public.is_owner());
create policy owner_insert_seats on public.seats for insert to authenticated with check (public.is_owner());
create policy owner_update_seats on public.seats for update to authenticated using (public.is_owner()) with check (public.is_owner());

-- Phiên phải thuộc đúng người dùng; anon gọi được và nhận null
create or replace function public.current_app_role()
returns text language sql stable security definer set search_path = public, auth as $$
  select r.role
  from public.app_roles r
  where r.user_id = auth.uid()
    and exists (
      select 1 from auth.sessions s
      where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
        and s.user_id = r.user_id
    )
$$;
revoke execute on function public.current_app_role() from public;
grant execute on function public.current_app_role() to anon, authenticated;
