create or replace function public.create_order(
  p_id uuid, p_quantity integer, p_seat_id uuid, p_is_takeaway boolean, p_client_price integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_takeaway boolean := coalesce(p_is_takeaway, false);
  v_settings public.settings;
  v_order public.orders;
  v_seat_name text;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_order from public.orders where id = p_id;
  if found then
    return public.order_result(v_order, v_order.unit_price is distinct from p_client_price, true);
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 500 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if v_takeaway and p_seat_id is not null then
    raise exception 'INVALID_SEAT';
  end if;

  if p_seat_id is not null then
    select name into v_seat_name from public.seats where id = p_seat_id and not is_archived;
    if not found then
      raise exception 'SEAT_NOT_FOUND';
    end if;
  elsif v_takeaway then
    v_seat_name := 'Mang về';
  end if;

  select * into v_settings from public.settings where id = 1;

  insert into public.orders (id, quantity, unit_price, seat_id, seat_name, is_takeaway, created_by, created_at, business_date)
  values (p_id, p_quantity, v_settings.current_price, p_seat_id, v_seat_name, v_takeaway, auth.uid(), now(),
          public.compute_business_date(now(), v_settings.business_day_start_hour))
  on conflict (id) do nothing
  returning * into v_order;

  if not found then
    select * into v_order from public.orders where id = p_id;
    return public.order_result(v_order, v_order.unit_price is distinct from p_client_price, true);
  end if;

  return public.order_result(v_order, v_order.unit_price is distinct from p_client_price, false);
end
$$;

revoke execute on function public.create_order(uuid, integer, uuid, boolean, integer) from public, anon;
grant execute on function public.create_order(uuid, integer, uuid, boolean, integer) to authenticated;
