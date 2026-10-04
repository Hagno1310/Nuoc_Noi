-- SRS FR-05b, R26: giờ đóng cửa, mặc định 2, không trùng giờ mở cửa. Chỉ để hiển thị; ngày kinh doanh không đổi.
alter table public.settings
  add column business_day_end_hour smallint not null default 2
    check (business_day_end_hour between 0 and 23);
-- Quán nào đang mở cửa lúc 2 giờ thì mặc định đóng sau 6 tiếng, để không vi phạm ràng buộc bên dưới
update public.settings set business_day_end_hour = (business_day_start_hour + 6) % 24
  where business_day_start_hour = 2;
alter table public.settings
  add constraint settings_open_close_differ check (business_day_end_hour <> business_day_start_hour);

create or replace function public.update_business_day_start_hour(p_hour integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  if p_hour is null or p_hour < 0 or p_hour > 23
     or p_hour = (select business_day_end_hour from public.settings where id = 1) then
    raise exception 'INVALID_HOUR';
  end if;
  update public.settings set business_day_start_hour = p_hour, updated_at = now() where id = 1;
end
$$;

create function public.update_business_day_end_hour(p_hour integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  if p_hour is null or p_hour < 0 or p_hour > 23
     or p_hour = (select business_day_start_hour from public.settings where id = 1) then
    raise exception 'INVALID_HOUR';
  end if;
  update public.settings set business_day_end_hour = p_hour, updated_at = now() where id = 1;
end
$$;

-- SRS FR-06, R27: ba kỳ (ngày kinh doanh, tuần T2–CN, tháng) so với cùng đoạn kỳ trước, và chuỗi doanh thu theo ngày cho biểu đồ.
-- Chỉ tính đơn đã thanh toán (dùng lại history_totals).
create function public.owner_stats(p_today date default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_today date := coalesce(p_today, public.current_business_date());
  v_week date := date_trunc('week', v_today)::date; -- thứ Hai
  v_month date := date_trunc('month', v_today)::date;
  v_month_end date := (date_trunc('month', v_today) + interval '1 month - 1 day')::date;
  v_prev_month date := (date_trunc('month', v_today) - interval '1 month')::date;
  v_prev_month_end date := least(v_prev_month + (v_today - v_month), v_month - 1);
  v_month_days jsonb;
  v_week_days jsonb;
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;

  with daily as (
    select business_date d, sum(total_amount) rev
    from public.orders
    where status = 'paid' and business_date between least(v_prev_month, v_week - 7) and v_today
    group by business_date
  )
  select
    (select jsonb_agg(jsonb_build_object(
        'day', extract(day from g)::int,
        'revenue', case when g <= v_today then coalesce((select rev from daily where d = g), 0) end,
        'previous_revenue', case when v_prev_month + (g - v_month) < v_month
          then coalesce((select rev from daily where d = v_prev_month + (g - v_month)), 0) end)
      order by g)
     from generate_series(v_month, v_month_end, interval '1 day') s(g0), lateral (select g0::date g) x),
    (select jsonb_agg(jsonb_build_object(
        'weekday', g - v_week + 1,
        'revenue', case when g <= v_today then coalesce((select rev from daily where d = g), 0) end,
        'previous_revenue', coalesce((select rev from daily where d = g - 7), 0))
      order by g)
     from generate_series(v_week, v_week + 6, interval '1 day') s(g0), lateral (select g0::date g) x)
  into v_month_days, v_week_days;

  return jsonb_build_object(
    'business_date', v_today,
    'day', jsonb_build_object(
      'current', public.history_totals(v_today, v_today),
      'previous', public.history_totals(v_today - 1, v_today - 1)),
    'week', jsonb_build_object(
      'current', public.history_totals(v_week, v_today),
      'previous', public.history_totals(v_week - 7, v_today - 7)),
    'month', jsonb_build_object(
      'current', public.history_totals(v_month, v_today),
      'previous', public.history_totals(v_prev_month, v_prev_month_end)),
    'month_days', v_month_days,
    'week_days', v_week_days);
end
$$;

revoke execute on function public.update_business_day_end_hour(integer) from public, anon;
revoke execute on function public.owner_stats(date) from public, anon;
grant execute on function public.update_business_day_end_hour(integer) to authenticated;
grant execute on function public.owner_stats(date) to authenticated;
