create function public.cancel_order(p_order_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_order public.orders;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'ORDER_NOT_FOUND';
  end if;
  if v_order.status = 'cancelled' then
    return;
  end if;
  if not public.is_owner() and now() - v_order.created_at > interval '5 minutes' then
    raise exception 'CANCEL_WINDOW_EXPIRED';
  end if;
  update public.orders
  set status = 'cancelled', cancelled_at = now(), cancelled_by = auth.uid()
  where id = p_order_id;
end
$$;

create function public.list_orders_by_ids(p_ids uuid[])
returns table (id uuid, quantity integer, unit_price integer, total_amount integer,
               seat_name text, status text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select o.id, o.quantity, o.unit_price, o.total_amount, o.seat_name, o.status, o.created_at
    from public.orders o
    where o.id = any (p_ids) and o.business_date = public.current_business_date()
    order by o.created_at desc;
end
$$;

revoke execute on function public.cancel_order(uuid) from public, anon;
revoke execute on function public.list_orders_by_ids(uuid[]) from public, anon;
grant execute on function public.cancel_order(uuid) to authenticated;
grant execute on function public.list_orders_by_ids(uuid[]) to authenticated;
