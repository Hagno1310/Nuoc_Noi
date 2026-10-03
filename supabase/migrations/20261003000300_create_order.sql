create function public.order_result(o public.orders, p_price_changed boolean, p_duplicate boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', o.id, 'unit_price', o.unit_price, 'total_amount', o.total_amount,
    'price_changed', p_price_changed, 'created_at', o.created_at,
    'business_date', o.business_date, 'duplicate', p_duplicate)
$$;

create function public.create_order(
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
    return public.order_result(v_order, false, true);
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 500 then
    raise exception 'INVALID_QUANTITY';
  end if;
  if v_takeaway and p_seat_id is not null then
    raise exception 'INVALID_SEAT';
  end if;

  if p_seat_id is not null then
    select name into v_seat_name from public.seats where id = p_seat_id;
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
    -- Một request đồng thời với cùng id vừa ghi xong
    select * into v_order from public.orders where id = p_id;
    return public.order_result(v_order, false, true);
  end if;

  return public.order_result(v_order, v_order.unit_price is distinct from p_client_price, false);
end
$$;

-- 'counter' < 'table' theo thứ tự chữ cái, nên ghế quầy đứng trước bàn
create function public.list_active_seats()
returns table (id uuid, name text, kind text) language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select s.id, s.name, s.kind from public.seats s
    where not s.is_archived
    order by s.kind, s.sort_order, s.name;
end
$$;

revoke execute on function public.order_result(public.orders, boolean, boolean) from public, anon, authenticated;
revoke execute on function public.create_order(uuid, integer, uuid, boolean, integer) from public, anon;
revoke execute on function public.list_active_seats() from public, anon;
grant execute on function public.create_order(uuid, integer, uuid, boolean, integer) to authenticated;
grant execute on function public.list_active_seats() to authenticated;
