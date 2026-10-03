-- Đơn giá chung tối đa 500.000đ (SRS FR-05, R21): 500 cốc × 500.000đ vẫn nằm trong integer
create or replace function public.update_price(p_price integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  if p_price is null or p_price <= 0 or p_price > 500000 then raise exception 'INVALID_PRICE'; end if;
  update public.settings set current_price = p_price, updated_at = now() where id = 1;
  insert into public.price_history (price, changed_by) values (p_price, auth.uid());
end
$$;
