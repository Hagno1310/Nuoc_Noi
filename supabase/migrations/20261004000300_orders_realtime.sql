-- SRS FR-06a: chủ quán nhận đơn mới qua Realtime. RLS owner_read_orders vẫn áp dụng: chỉ chủ quán nhận được sự kiện.
alter publication supabase_realtime add table public.orders;
