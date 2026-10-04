-- SRS v3.0 FR-05, FR-05a: thực đơn và lịch sử đổi giá theo món
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  price integer not null check (price between 1000 and 5000000),
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);
-- Không trùng tên giữa các món đang bán; món đã ẩn nhường tên lại
create unique index menu_items_active_name_key on public.menu_items (lower(trim(name))) where not is_archived;

create table public.menu_price_history (
  id bigint generated always as identity primary key,
  menu_item_id uuid not null references public.menu_items (id),
  price integer not null,
  effective_from timestamptz not null default now(),
  changed_by uuid references auth.users (id)
);

-- Mọi đường đổi giá đều có lịch sử; changed_by null là giá khởi tạo
create function public.log_menu_price()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.menu_price_history (menu_item_id, price, changed_by)
  values (new.id, new.price, auth.uid());
  return new;
end
$$;
revoke execute on function public.log_menu_price() from public, anon, authenticated;

create trigger menu_items_price_on_insert
  after insert on public.menu_items
  for each row execute function public.log_menu_price();
create trigger menu_items_price_on_update
  after update of price on public.menu_items
  for each row when (old.price is distinct from new.price)
  execute function public.log_menu_price();

alter table public.menu_items enable row level security;
alter table public.menu_price_history enable row level security;

-- Nhân viên đọc cả món đã ẩn: realtime chỉ gửi sự kiện cho người đọc được dòng (giỏ đơn cần biết món vừa ngừng bán)
create policy staff_read_menu_items on public.menu_items for select to authenticated using (public.is_staff());
create policy owner_insert_menu_items on public.menu_items for insert to authenticated with check (public.is_owner());
create policy owner_update_menu_items on public.menu_items for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_read_menu_price_history on public.menu_price_history for select to authenticated using (public.is_owner());

alter publication supabase_realtime add table public.menu_items;

insert into public.menu_items (name, price, sort_order) values
  ('BeSpoke', 190000, 1), ('Classic', 190000, 2), ('Signature', 250000, 3), ('Bình Zax', 800000, 4),
  ('MixDrink', 150000, 5), ('Neat', 100000, 6), ('Absinthe', 150000, 7), ('Mocktail', 100000, 8);
