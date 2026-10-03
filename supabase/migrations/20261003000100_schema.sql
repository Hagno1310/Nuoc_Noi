create extension if not exists pgcrypto with schema extensions;

create table public.settings (
  id smallint primary key default 1 check (id = 1),
  current_price integer not null check (current_price > 0),
  business_day_start_hour smallint not null default 20 check (business_day_start_hour between 0 and 23),
  updated_at timestamptz not null default now()
);

create table public.price_history (
  id bigint generated always as identity primary key,
  price integer not null check (price > 0),
  effective_from timestamptz not null default now(),
  changed_by uuid references auth.users (id)
);
create index price_history_effective_from_idx on public.price_history (effective_from desc);

-- Chỗ ngồi: kind = 'table' (Bàn) hoặc 'counter' (Ghế quầy)
create table public.seats (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  kind text not null check (kind in ('table', 'counter')),
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key,
  quantity integer not null check (quantity between 1 and 500),
  unit_price integer not null check (unit_price > 0),
  total_amount integer generated always as (quantity * unit_price) stored,
  seat_id uuid references public.seats (id),
  seat_name text,
  is_takeaway boolean not null default false,
  status text not null default 'paid' check (status in ('paid', 'cancelled')),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  business_date date not null,
  cancelled_at timestamptz,
  cancelled_by uuid references auth.users (id),
  constraint orders_takeaway_xor_seat check (not (is_takeaway and seat_id is not null))
);
create index orders_business_date_status_idx on public.orders (business_date, status);

-- Ngày kinh doanh: lấy giờ VN, lùi lại start_hour giờ, rồi lấy phần ngày
create function public.compute_business_date(ts timestamptz, start_hour smallint)
returns date language sql stable as $$
  select ((ts at time zone 'Asia/Ho_Chi_Minh') - make_interval(hours => start_hour))::date
$$;

create function public.current_business_date()
returns date language sql stable security definer set search_path = public as $$
  select public.compute_business_date(now(), business_day_start_hour) from public.settings where id = 1
$$;

insert into public.settings (id, current_price) values (1, 25000);
insert into public.price_history (price) values (25000);

alter table public.settings enable row level security;
alter table public.price_history enable row level security;
alter table public.seats enable row level security;
alter table public.orders enable row level security;

-- Ai cũng đọc được giá và giờ mở cửa (cần cho màn hình order và realtime). Mọi thao tác ghi đều đi qua RPC.
create policy settings_read_all on public.settings for select to anon, authenticated using (true);

alter publication supabase_realtime add table public.settings;
