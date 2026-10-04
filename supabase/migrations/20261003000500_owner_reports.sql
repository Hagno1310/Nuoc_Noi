create function public.update_price(p_price integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  if p_price is null or p_price <= 0 then raise exception 'INVALID_PRICE'; end if;
  update public.settings set current_price = p_price, updated_at = now() where id = 1;
  insert into public.price_history (price, changed_by) values (p_price, auth.uid());
end
$$;

create function public.update_business_day_start_hour(p_hour integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  if p_hour is null or p_hour < 0 or p_hour > 23 then raise exception 'INVALID_HOUR'; end if;
  update public.settings set business_day_start_hour = p_hour, updated_at = now() where id = 1;
end
$$;

create function public.dashboard_summary(p_today date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_today date := coalesce(p_today, public.current_business_date());
  v_result jsonb;
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'business_date', v_today,
    'today_revenue', coalesce(sum(o.total_amount) filter (where o.business_date = v_today), 0),
    'today_cups', coalesce(sum(o.quantity) filter (where o.business_date = v_today), 0),
    'month_revenue', coalesce(sum(o.total_amount), 0))
  into v_result
  from public.orders o
  where o.status = 'paid'
    and o.business_date between date_trunc('month', v_today)::date and v_today;
  return v_result;
end
$$;

create function public.history_totals(p_from date, p_to date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'revenue', coalesce(sum(total_amount), 0),
    'cups', coalesce(sum(quantity), 0),
    'order_count', count(*))
  into v_result
  from public.orders
  where status = 'paid' and business_date between p_from and p_to;
  return v_result;
end
$$;

revoke execute on function public.update_price(integer) from public, anon;
revoke execute on function public.update_business_day_start_hour(integer) from public, anon;
revoke execute on function public.dashboard_summary(date) from public, anon;
revoke execute on function public.history_totals(date, date) from public, anon;
grant execute on function public.update_price(integer) to authenticated;
grant execute on function public.update_business_day_start_hour(integer) to authenticated;
grant execute on function public.dashboard_summary(date) to authenticated;
grant execute on function public.history_totals(date, date) to authenticated;
