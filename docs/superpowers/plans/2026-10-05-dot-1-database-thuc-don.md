# Đợt 1: Database cho thực đơn, dòng đơn và giảm giá

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Đưa database lên mô hình SRS v3.0: bảng món có lịch sử giá, đơn hàng gồm nhiều dòng đơn, giảm giá theo phần trăm do server tính.

**Architecture:** Hai migration mới.
- Migration thứ nhất chỉ thêm bảng, không phá gì: `menu_items`, `menu_price_history` (ghi bằng trigger), RLS, realtime, thực đơn khởi tạo.
- Migration thứ hai xóa dữ liệu thử một lần, đổi cấu trúc bảng `orders`, thêm `order_lines`, viết lại `create_order`, `list_orders_by_ids`, `history_totals`, và bỏ các hàm của mô hình đồng giá.

Mọi quy tắc tiền và quyền nằm trong hàm Postgres `security definer`.

**Tech Stack:** Supabase (Postgres 15+, RLS, Realtime), pgTAP.

**Spec:** `docs/superpowers/specs/2026-10-04-thuc-don-giam-gia-design.md` (§3, §4) và `docs/SRS.md` v3.0 (FR-01–FR-05a, FR-07, FR-07a, §4, NFR-05, R32–R36).

## Global Constraints

- Tiền là `integer` VND. Server tính `unit_price`, `subtotal_amount`, `discount_amount`, `total_amount` (NFR-05).
- Giá món 1.000–5.000.000đ. Số lượng mỗi dòng 1–99. Tối đa 30 dòng mỗi đơn. Tạm tính tối đa 1.000.000.000đ.
- Giảm giá là số nguyên 0–100. Số tiền giảm = `floor(tạm tính × % ÷ 100 ÷ 1000) × 1000`.
- Bắt buộc có chỗ ngồi hoặc Mang về.
- Không xóa cứng đơn hàng, chỗ ngồi, món. Ngoại lệ duy nhất là `delete from public.orders` trong migration v3.0 (R36).
- Mỗi hàm RPC mở đầu bằng `is_staff()` hoặc `is_owner()`, sai thì `raise exception 'FORBIDDEN'`.
- Mỗi RPC mới: `revoke execute … from public, anon` rồi `grant execute … to authenticated`.
- Không sửa migration đã có; mọi thay đổi đi vào migration mới có timestamp lớn hơn `20261004000300`.
- Mã lỗi mới: `SEAT_REQUIRED`, `INVALID_DISCOUNT`, `INVALID_LINES`, `MENU_CHANGED`, `TOTAL_TOO_LARGE`. Giữ các mã cũ: `FORBIDDEN`, `INVALID_SEAT`, `SEAT_NOT_FOUND`, `INVALID_QUANTITY`.
- Tên cột, hàm theo GLOSSARY: `menu_items` (Món), `order_lines` (Dòng đơn), `item_count` (Số món), `subtotal_amount` (Tạm tính), `discount_*` (Giảm giá), `total_amount` (Thành tiền).

## Review Focus

1. **Gửi lại cùng mã đơn sau khi giá món vừa đổi** (mạng chập chờn): phải trả về đơn đã ghi (`duplicate: true`), không ném `MENU_CHANGED`. → Task 2, bước 1, test "gửi lại sau khi giá đổi".
2. **Dữ liệu dòng đơn sai kiểu** (số lượng `"abc"` hoặc `1.5`, giá `null`): phải ra `INVALID_LINES` hoặc `INVALID_QUANTITY`, không ra lỗi Postgres thô `22P02`. → Task 2, bước 1.
3. **Món bị ẩn khi nhân viên đang mở màn order:** realtime chỉ gửi sự kiện cho người đọc được dòng đó. Vì vậy nhân viên phải đọc được cả món đã ẩn, nếu không sẽ không biết món vừa ngừng bán. → Task 1, bước 1, test "nhân viên vẫn thấy món đã ẩn".
4. **Giảm 100%:** thành tiền 0đ phải hợp lệ, ràng buộc bảng không được chặn. → Task 2, bước 1.
5. **Tạm tính quá lớn:** 3 món giá 5.000.000đ × 99 phải ra `TOTAL_TOO_LARGE`, không tràn số nguyên. → Task 2, bước 1.

## Lưu ý cho người thực hiện

- **Sau đợt 1, app trên nhánh sẽ hỏng tạm thời:** màn order, Cài đặt, Lịch sử và thông báo đơn mới vẫn gọi cột và hàm cũ. Đợt 2–4 sửa phần đó. Không chạy `npm run build` để đánh giá đợt 1; tiêu chí là `npx supabase test db` xanh.
- **Chạy test:** Docker Desktop phải đang chạy. Dùng `npx supabase start` (nếu chưa chạy), rồi `npx supabase db reset && npx supabase test db`.
- **Không chạy migration lên prod** trong đợt này. Prod chỉ nhận khi xong cả 4 đợt, sau khi chủ quán xác nhận số đơn sẽ bị xóa (spec §3.3).
- **Cách viết test của repo:** mỗi file `begin; … select plan(N); … select * from finish(); rollback;`. Giả lập người dùng bằng `set_config('request.jwt.claims', '<json có sub và session_id>', true)` kèm một dòng `auth.sessions`. Muốn RLS có hiệu lực thì thêm `set local role authenticated;`, xong thì `reset role;`.

---

### Task 1: Bảng món và lịch sử giá theo món

**Files:**
- Create: `supabase/migrations/20261005000100_menu.sql`
- Test: `supabase/tests/08_menu.test.sql`

**Interfaces:**
- Consumes: `public.is_staff()`, `public.is_owner()` (migration `20261003000200`), `auth.uid()`.
- Produces (các task và đợt sau dùng):
  - Bảng `public.menu_items(id uuid, name text, price integer, sort_order integer, is_archived boolean, created_at timestamptz)`. Nhân viên và chủ quán đọc được mọi dòng, kể cả món đã ẩn. Chủ quán được insert và update, không ai được delete.
  - Bảng `public.menu_price_history(id bigint, menu_item_id uuid, price integer, effective_from timestamptz, changed_by uuid)`. Chỉ chủ quán đọc được. `changed_by` null nghĩa là "Khởi tạo".
  - `menu_items` nằm trong publication `supabase_realtime`.

- [ ] **Step 1: Viết test thất bại**

Tạo `supabase/tests/08_menu.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

-- Thực đơn khởi tạo (SRS FR-05)
select is((select count(*)::int from public.menu_items), 8, 'thực đơn khởi tạo có 8 món');
select is((select price from public.menu_items where name = 'Bình Zax'), 800000, 'Bình Zax 800.000đ');
select is((select count(*)::int from public.menu_price_history where changed_by is null), 8,
  'mỗi món khởi tạo có một dòng lịch sử giá, người đổi để trống (hiện "Khởi tạo")');

-- Ràng buộc giá và tên
select throws_ok($$insert into public.menu_items (name, price) values ('Rẻ', 999)$$, '23514', null, 'giá dưới 1.000đ bị từ chối');
select throws_ok($$insert into public.menu_items (name, price) values ('Đắt', 5000001)$$, '23514', null, 'giá trên 5.000.000đ bị từ chối');
select throws_ok($$insert into public.menu_items (name, price) values ('   ', 1000)$$, '23514', null, 'tên rỗng bị từ chối');
select throws_ok($$insert into public.menu_items (name, price) values (' classic ', 1000)$$, '23505', null,
  'trùng tên một món đang bán (không phân biệt hoa thường, khoảng trắng) bị từ chối');

-- Nhân viên: đọc được, không ghi được
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
set local role authenticated;
select is((select count(*)::int from public.menu_items), 8, 'nhân viên đọc được thực đơn');
select throws_ok($$insert into public.menu_items (name, price) values ('X', 1000)$$, '42501', null, 'nhân viên không thêm được món');
update public.menu_items set price = 1000 where name = 'Classic';
reset role;
select is((select price from public.menu_items where name = 'Classic'), 190000, 'nhân viên không đổi được giá');

-- Chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
set local role authenticated;
update public.menu_items set price = 200000 where name = 'Classic';
update public.menu_items set sort_order = 99 where name = 'Classic';
delete from public.menu_items where name = 'Neat';
update public.menu_items set is_archived = true where name = 'Mocktail';
reset role;
select is((select h.changed_by::text from public.menu_price_history h
             join public.menu_items m on m.id = h.menu_item_id
           where m.name = 'Classic' order by h.id desc limit 1),
  '00000000-0000-0000-0000-0000000000a1', 'đổi giá ghi lịch sử kèm người đổi');
select is((select count(*)::int from public.menu_price_history h
             join public.menu_items m on m.id = h.menu_item_id where m.name = 'Classic'),
  2, 'đổi thứ tự không ghi thêm lịch sử giá');
select is((select count(*)::int from public.menu_items where name = 'Neat'), 1, 'không xóa cứng được món');
select lives_ok($$insert into public.menu_items (name, price) values ('Mocktail', 120000)$$, 'tên của món đã ẩn dùng lại được');

-- Realtime chỉ gửi sự kiện cho người đọc được dòng: nhân viên phải thấy cả món đã ẩn
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
set local role authenticated;
select is((select count(*)::int from public.menu_items where is_archived), 1, 'nhân viên vẫn thấy món đã ẩn');
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx supabase db reset && npx supabase test db`
Expected: `08_menu.test.sql` FAIL với lỗi `relation "public.menu_items" does not exist`. Các file 01–07 vẫn PASS.

- [ ] **Step 3: Viết migration**

Tạo `supabase/migrations/20261005000100_menu.sql`:

```sql
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
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npx supabase db reset && npx supabase test db`
Expected: tất cả file PASS, `08_menu.test.sql` có `ok 1 … ok 15`.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261005000100_menu.sql supabase/tests/08_menu.test.sql
git commit -m "feat(db): bảng món và lịch sử giá theo món (SRS v3.0 FR-05, FR-05a)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Đơn hàng gồm dòng đơn, giảm giá, RPC mới

**Files:**
- Create: `supabase/migrations/20261005000200_order_lines.sql`
- Rewrite: `supabase/tests/01_schema.test.sql`, `supabase/tests/03_create_order.test.sql`, `supabase/tests/05_owner_reports.test.sql`
- Modify: `supabase/tests/02_roles_pin.test.sql:22-23`, `supabase/tests/04_cancel_list.test.sql`, `supabase/tests/07_close_hour_stats.test.sql:15-24,42-47,57-58`
- Delete: `supabase/tests/06_price_cap.test.sql` (đơn giá chung không còn; giới hạn giá món đã nằm trong `08_menu`)

**Interfaces:**
- Consumes: `public.menu_items` (Task 1), `public.seats`, `public.settings.business_day_start_hour`, `public.compute_business_date(timestamptz, smallint)`, `public.current_business_date()`, `public.is_staff()`, `public.is_owner()`.
- Produces (đợt 2–4 gọi từ frontend):
  - `public.create_order(p_id uuid, p_seat_id uuid, p_is_takeaway boolean, p_discount_percent integer, p_lines jsonb) returns jsonb`.
    - `p_lines` = `[{"menu_item_id": uuid, "quantity": int, "client_price": int}, …]`.
    - Trả về `{id, item_count, subtotal_amount, discount_percent, discount_amount, total_amount, seat_name, created_at, business_date, duplicate}`.
    - Lỗi `MENU_CHANGED` có `DETAIL` là JSON `[{id, name, price, is_archived}]` của toàn bộ thực đơn.
  - `public.list_orders_by_ids(p_ids uuid[]) returns table (id uuid, item_count integer, subtotal_amount integer, discount_percent integer, discount_amount integer, total_amount integer, seat_name text, status text, created_at timestamptz, lines jsonb)`. `lines` = `[{item_name, unit_price, quantity, line_amount}]` theo thứ tự trong giỏ.
  - `public.history_totals(p_from date, p_to date) returns jsonb`: `{revenue, item_count, order_count, discount_total}`. `owner_stats` giữ nguyên chữ ký, các khối `current`/`previous` có dạng mới này.
  - `public.discount_amount(p_subtotal bigint, p_percent integer) returns integer`: công thức làm tròn xuống tới 1.000đ, để đợt 3 viết test đối chiếu.
  - Bảng `public.order_lines`: chủ quán đọc trực tiếp được qua RLS (đợt 4 dùng cho Lịch sử và CSV).
  - Không còn: `settings.current_price`, bảng `price_history`, hàm `update_price`, `dashboard_summary`, `order_result`, `create_order` 5 tham số cũ.

- [ ] **Step 1: Viết lại test `03_create_order`**

Thay toàn bộ `supabase/tests/03_create_order.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(42);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');
update public.settings set business_day_start_hour = 6 where id = 1;
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c9', 'Quầy 9', 'counter');
insert into public.seats (id, name, kind, is_archived) values ('00000000-0000-0000-0000-0000000000c8', 'Ghế cũ', 'counter', true);
-- Món riêng cho test, giá cố định để phép tính dễ kiểm tra
insert into public.menu_items (id, name, price) values
  ('00000000-0000-0000-0000-0000000000e1', 'Thử A', 190000),
  ('00000000-0000-0000-0000-0000000000e2', 'Thử B', 100000),
  ('00000000-0000-0000-0000-0000000000e3', 'Thử C', 5000000),
  ('00000000-0000-0000-0000-0000000000e5', 'Thử D', 5000000),
  ('00000000-0000-0000-0000-0000000000e6', 'Thử E', 5000000);
insert into public.menu_items (id, name, price, is_archived) values
  ('00000000-0000-0000-0000-0000000000e4', 'Thử cũ', 50000, true);

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]')$$,
  'P0001', 'FORBIDDEN', 'chưa đăng nhập không tạo được đơn');
select throws_ok($$select * from public.list_active_seats()$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không xem được chỗ ngồi');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);

-- 2 × Thử A + 1 × Thử B = 480.000đ, giảm 10% = 48.000đ
create temp table o1 as select public.create_order('00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-0000000000c9', false, 10,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r;
select is((select (r ->> 'subtotal_amount')::int from o1), 480000, 'tạm tính = tổng thành tiền dòng');
select is((select (r ->> 'discount_amount')::int from o1), 48000, 'giảm 10%');
select is((select (r ->> 'total_amount')::int from o1), 432000, 'thành tiền = tạm tính − giảm');
select is((select (r ->> 'item_count')::int from o1), 3, 'số món = tổng số lượng');
select is((select (r ->> 'duplicate')::boolean from o1), false, 'đơn mới không phải duplicate');
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000001'), 'Quầy 9', 'lưu tên chỗ ngồi tại thời điểm tạo');
select is((select count(*)::int from public.order_lines where order_id = '00000000-0000-0000-0000-000000000001'), 2, 'ghi 2 dòng đơn');
select is((select item_name || '/' || unit_price || '/' || quantity || '/' || line_amount
           from public.order_lines where order_id = '00000000-0000-0000-0000-000000000001' order by sort_order limit 1),
  'Thử A/190000/2/380000', 'dòng đơn lưu tên và giá tại lúc bán, đúng thứ tự trong giỏ');
select is((select business_date from public.orders where id = '00000000-0000-0000-0000-000000000001'),
  public.compute_business_date(now(), 6::smallint), 'business_date theo giờ mở cửa');
select is((select created_by::text from public.orders where id = '00000000-0000-0000-0000-000000000001'),
  '00000000-0000-0000-0000-0000000000b1', 'lưu người tạo');

-- Gửi lại cùng id (mạng rớt sau khi server đã ghi)
select is((select (r ->> 'duplicate') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c9', false, 10,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  'true/432000', 'gửi lại cùng id → duplicate, trả về đúng thành tiền');
select is((select count(*)::int from public.orders where id = '00000000-0000-0000-0000-000000000001'), 1, 'không tạo đơn thứ hai');
select is((select count(*)::int from public.order_lines where order_id = '00000000-0000-0000-0000-000000000001'), 2, 'không ghi thêm dòng đơn');

-- Review Focus 1: giá vừa đổi rồi máy gửi lại đơn đã ghi
update public.menu_items set price = 200000 where id = '00000000-0000-0000-0000-0000000000e1';
select is((select r ->> 'duplicate' from (select public.create_order(
  '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000c9', false, 10,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":2,"client_price":190000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  'true', 'gửi lại sau khi giá đổi vẫn trả về đơn đã ghi, không báo MENU_CHANGED');
update public.menu_items set price = 190000 where id = '00000000-0000-0000-0000-0000000000e1';

-- Làm tròn số tiền giảm xuống tới 1.000đ
select is((select (r ->> 'discount_amount') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000002', null, true, 15,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":190000}]') as r) x),
  '28000/162000', '15% của 190.000đ là 28.500đ, làm tròn xuống 28.000đ');
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000002'), 'Mang về', 'mang về có seat_name = Mang về');
select is((select (r ->> 'discount_amount') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000003', null, true, 100,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  '100000/0', 'giảm 100%: thành tiền 0đ hợp lệ');
select is((select (r ->> 'discount_amount') || '/' || (r ->> 'total_amount') from (select public.create_order(
  '00000000-0000-0000-0000-000000000004', null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]') as r) x),
  '0/100000', 'không giảm giá');
select is(public.discount_amount(1500, 100), 1000, 'công thức làm tròn xuống, kể cả khi tạm tính lẻ');

-- Thực đơn đã đổi: từ chối cả đơn
select throws_ok($$select public.create_order('00000000-0000-0000-0000-000000000005', null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e1","quantity":1,"client_price":180000}]')$$,
  'P0001', 'MENU_CHANGED', 'giá trên máy khác giá hiện hành → MENU_CHANGED');
select is((select count(*)::int from public.orders where id = '00000000-0000-0000-0000-000000000005'), 0, 'MENU_CHANGED không ghi đơn');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e4","quantity":1,"client_price":50000}]')$$,
  'P0001', 'MENU_CHANGED', 'món đã ẩn → MENU_CHANGED');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e9","quantity":1,"client_price":50000}]')$$,
  'P0001', 'MENU_CHANGED', 'món không tồn tại → MENU_CHANGED');

-- Kiểm tra đầu vào
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 101,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'INVALID_DISCOUNT', 'giảm trên 100% bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, -1,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'INVALID_DISCOUNT', 'giảm âm bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), null, false, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'SEAT_REQUIRED', 'phải chọn chỗ ngồi hoặc Mang về');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c9', true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'INVALID_SEAT', 'không được vừa mang về vừa có chỗ ngồi');
select throws_ok($$select public.create_order(gen_random_uuid(), gen_random_uuid(), false, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'SEAT_NOT_FOUND', 'chỗ ngồi không tồn tại');
select throws_ok($$select public.create_order(gen_random_uuid(), '00000000-0000-0000-0000-0000000000c8', false, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000}]')$$,
  'P0001', 'SEAT_NOT_FOUND', 'chỗ ngồi đã ẩn không được chọn');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0, '[]')$$,
  'P0001', 'INVALID_LINES', 'giỏ trống bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  (select jsonb_agg(jsonb_build_object('menu_item_id', gen_random_uuid(), 'quantity', 1, 'client_price', 1000))
   from generate_series(1, 31)))$$,
  'P0001', 'INVALID_LINES', 'quá 30 dòng bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1,"client_price":100000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":2,"client_price":100000}]')$$,
  'P0001', 'INVALID_LINES', 'một món chỉ có một dòng');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":0,"client_price":100000}]')$$,
  'P0001', 'INVALID_QUANTITY', 'số lượng 0 bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":100,"client_price":100000}]')$$,
  'P0001', 'INVALID_QUANTITY', 'số lượng 100 bị từ chối');
-- Review Focus 2: sai kiểu không ra lỗi Postgres thô
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":"abc","client_price":100000}]')$$,
  'P0001', 'INVALID_LINES', 'số lượng không phải số → INVALID_LINES');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1.5,"client_price":100000}]')$$,
  'P0001', 'INVALID_LINES', 'số lượng thập phân → INVALID_LINES');
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e2","quantity":1}]')$$,
  'P0001', 'INVALID_LINES', 'thiếu giá trên máy → INVALID_LINES');
-- Review Focus 5: 3 × 5.000.000đ × 99 = 1.485.000.000đ
select throws_ok($$select public.create_order(gen_random_uuid(), null, true, 0,
  '[{"menu_item_id":"00000000-0000-0000-0000-0000000000e3","quantity":99,"client_price":5000000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e5","quantity":99,"client_price":5000000},
    {"menu_item_id":"00000000-0000-0000-0000-0000000000e6","quantity":99,"client_price":5000000}]')$$,
  'P0001', 'TOTAL_TOO_LARGE', 'tạm tính trên 1.000.000.000đ bị từ chối');

select ok(exists (select 1 from public.list_active_seats() where name = 'Quầy 9' and kind = 'counter'), 'có ghế quầy đang dùng, kèm loại');
select ok(not exists (select 1 from public.list_active_seats() where name = 'Ghế cũ'), 'không trả về chỗ ngồi đã ẩn');

select * from finish();
rollback;
```

- [ ] **Step 2: Sửa các test còn lại theo cấu trúc mới**

Thay toàn bộ `supabase/tests/01_schema.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

select has_table('public', 'settings', 'có bảng settings');
select has_table('public', 'seats', 'có bảng seats');
select has_table('public', 'orders', 'có bảng orders');
select has_table('public', 'order_lines', 'có bảng order_lines');
select has_table('public', 'menu_items', 'có bảng menu_items');
select hasnt_table('public', 'price_history', 'bỏ price_history, thay bằng menu_price_history');
select hasnt_column('public', 'settings', 'current_price', 'bỏ đơn giá chung');

-- 22:59 UTC = 05:59 giờ VN ngày 04/10, vẫn thuộc ngày kinh doanh 03/10 khi giờ mở cửa là 6
select is(public.compute_business_date('2026-10-03 22:59:00+00', 6::smallint), '2026-10-03'::date, '05:59 VN thuộc ngày hôm trước');
-- 23:00 UTC = 06:00 giờ VN ngày 04/10, bắt đầu ngày kinh doanh 04/10
select is(public.compute_business_date('2026-10-03 23:00:00+00', 6::smallint), '2026-10-04'::date, '06:00 VN là ngày mới');

set local role anon;
select is((select count(*)::int from public.settings), 1, 'anon đọc được settings');
select throws_ok(
  $$insert into public.orders (id, item_count, subtotal_amount, total_amount, is_takeaway, created_by, business_date)
    values (gen_random_uuid(), 1, 1000, 1000, true, gen_random_uuid(), current_date)$$,
  '42501'
);
reset role;

select * from finish();
rollback;
```

Trong `supabase/tests/02_roles_pin.test.sql`, thay hai dòng 22–23:

```sql
insert into public.orders (id, quantity, unit_price, seat_id, created_by, business_date)
  values ('00000000-0000-0000-0000-0000000000d1', 1, 25000, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', current_date);
```

bằng:

```sql
insert into public.orders (id, item_count, subtotal_amount, total_amount, seat_id, created_by, business_date)
  values ('00000000-0000-0000-0000-0000000000d1', 1, 25000, 25000, '00000000-0000-0000-0000-0000000000c1', '00000000-0000-0000-0000-0000000000b1', current_date);
```

Trong `supabase/tests/04_cancel_list.test.sql`:
- Đổi `select plan(11);` thành `select plan(12);`.
- Thay khối `insert into public.orders …` (4 dòng giá trị) bằng:

```sql
insert into public.menu_items (id, name, price) values ('00000000-0000-0000-0000-0000000000e1', 'Thử A', 25000);
insert into public.orders (id, item_count, subtotal_amount, total_amount, is_takeaway, created_by, created_at, business_date) values
  ('00000000-0000-0000-0000-0000000000d1', 1, 25000, 25000, true, '00000000-0000-0000-0000-0000000000b1', now() - interval '2 minutes', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d2', 2, 50000, 50000, true, '00000000-0000-0000-0000-0000000000b1', now() - interval '6 minutes', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d3', 3, 75000, 75000, true, '00000000-0000-0000-0000-0000000000a1', now() - interval '1 minute', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d4', 4, 100000, 100000, true, '00000000-0000-0000-0000-0000000000b1', now() - interval '1 day', public.current_business_date() - 1);
insert into public.order_lines (order_id, menu_item_id, item_name, unit_price, quantity, sort_order) values
  ('00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000e1', 'Thử A', 25000, 1, 1);
```

- Ngay sau test `'mới nhất ở trên'`, thêm:

```sql
select is((select lines from public.list_orders_by_ids(array['00000000-0000-0000-0000-0000000000d1']::uuid[])),
  '[{"item_name": "Thử A", "unit_price": 25000, "quantity": 1, "line_amount": 25000}]'::jsonb, 'trả kèm dòng đơn');
```

Thay toàn bộ `supabase/tests/05_owner_reports.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

-- Đơn thứ hai giảm 10%: 75.000đ → giảm 7.000đ (7.500đ làm tròn xuống) → 68.000đ
insert into public.orders (id, item_count, subtotal_amount, discount_percent, discount_amount, total_amount, is_takeaway, status, created_by, business_date) values
  (gen_random_uuid(), 2, 50000, 0, 0, 50000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 3, 75000, 10, 7000, 68000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 10, 250000, 0, 0, 250000, true, 'cancelled', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 1, 20000, 0, 0, 20000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-01'),
  (gen_random_uuid(), 4, 80000, 0, 0, 80000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-09-30');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select throws_ok($$select public.history_totals('2026-09-30', '2026-10-15')$$, 'P0001', 'FORBIDDEN', 'nhân viên không xem được dòng tổng');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select is(public.history_totals('2026-09-30', '2026-10-15'),
  '{"revenue": 218000, "item_count": 10, "order_count": 4, "discount_total": 7000}'::jsonb,
  'dòng tổng: doanh thu sau giảm, không tính đơn hủy, kèm tổng tiền đã giảm');

select throws_ok($$select public.update_business_day_start_hour(24)$$, 'P0001', 'INVALID_HOUR', 'giờ trong khoảng 0–23');
select public.update_business_day_start_hour(4);
select is((select business_day_start_hour::int from public.settings where id = 1), 4, 'cập nhật giờ mở cửa');

select hasnt_function('public', 'dashboard_summary', 'bỏ dashboard_summary (đã thay bằng owner_stats)');
select hasnt_function('public', 'update_price', 'bỏ update_price (không còn đơn giá chung)');

select * from finish();
rollback;
```

Trong `supabase/tests/07_close_hour_stats.test.sql`:
- Thay khối insert ở dòng 15–24 bằng:

```sql
insert into public.orders (id, item_count, subtotal_amount, total_amount, is_takeaway, status, created_by, business_date) values
  (gen_random_uuid(), 2, 50000, 50000, true, 'paid',      '00000000-0000-0000-0000-0000000000b1', '2026-10-14'),
  (gen_random_uuid(), 9, 225000, 225000, true, 'cancelled', '00000000-0000-0000-0000-0000000000b1', '2026-10-14'),
  (gen_random_uuid(), 4, 100000, 100000, true, 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-10-13'),
  (gen_random_uuid(), 1, 25000, 25000, true, 'paid',      '00000000-0000-0000-0000-0000000000b1', '2026-10-12'),
  (gen_random_uuid(), 3, 60000, 60000, true, 'paid',      '00000000-0000-0000-0000-0000000000b1', '2026-10-07'), -- thứ Tư tuần trước
  (gen_random_uuid(), 5, 100000, 100000, true, 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-10-08'), -- thứ Năm tuần trước: ngoài cùng đoạn
  (gen_random_uuid(), 6, 120000, 120000, true, 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-09-10'), -- trong ngày 1–14 tháng trước
  (gen_random_uuid(), 7, 140000, 140000, true, 'paid',    '00000000-0000-0000-0000-0000000000b1', '2026-09-20'); -- ngoài cùng đoạn tháng trước
```

- Thay 6 dòng kỳ vọng ở dòng 42–47 bằng:

```sql
select is((select r -> 'day' -> 'current' from st), '{"revenue": 50000, "item_count": 2, "order_count": 1, "discount_total": 0}'::jsonb, 'ngày kinh doanh hiện tại không tính đơn hủy');
select is((select r -> 'day' -> 'previous' from st), '{"revenue": 100000, "item_count": 4, "order_count": 1, "discount_total": 0}'::jsonb, 'ngày kinh doanh hôm trước');
select is((select r -> 'week' -> 'current' from st), '{"revenue": 175000, "item_count": 7, "order_count": 3, "discount_total": 0}'::jsonb, 'tuần này từ thứ Hai đến hôm nay');
select is((select r -> 'week' -> 'previous' from st), '{"revenue": 60000, "item_count": 3, "order_count": 1, "discount_total": 0}'::jsonb, 'tuần trước chỉ tính cùng đoạn thứ Hai đến thứ Tư');
select is((select r -> 'month' -> 'current' from st), '{"revenue": 335000, "item_count": 15, "order_count": 5, "discount_total": 0}'::jsonb, 'tháng này từ ngày 1 đến hôm nay');
select is((select r -> 'month' -> 'previous' from st), '{"revenue": 120000, "item_count": 6, "order_count": 1, "discount_total": 0}'::jsonb, 'tháng trước chỉ tính ngày 1 đến ngày 14');
```

- Thay khối insert ở dòng 57–58 bằng:

```sql
insert into public.orders (id, item_count, subtotal_amount, total_amount, is_takeaway, status, created_by, business_date) values
  (gen_random_uuid(), 1, 10000, 10000, true, 'paid', '00000000-0000-0000-0000-0000000000b1', '2027-02-28');
```

Xóa test đơn giá chung: `git rm supabase/tests/06_price_cap.test.sql`.

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx supabase db reset && npx supabase test db`
Expected: 01, 02, 03, 04, 05, 07 FAIL (cột `item_count` và bảng `order_lines` chưa có, `create_order` 5 tham số mới chưa có). 08 PASS.

- [ ] **Step 4: Viết migration**

Tạo `supabase/migrations/20261005000200_order_lines.sql`:

```sql
-- SRS v3.0 R36: app chưa dùng thật. Xóa dữ liệu thử MỘT LẦN trước khi đổi cấu trúc đơn hàng.
-- Đây là ngoại lệ duy nhất của NFR-05; không migration nào khác được xóa đơn.
delete from public.orders;
drop table public.price_history;

-- Các hàm của mô hình đồng giá
drop function public.create_order(uuid, integer, uuid, boolean, integer);
drop function public.order_result(public.orders, boolean, boolean);
drop function public.update_price(integer);
drop function public.dashboard_summary(date);
drop function public.list_orders_by_ids(uuid[]);
alter table public.settings drop column current_price;

-- total_amount cũ là cột tự tính từ quantity × unit_price, phải bỏ trước
alter table public.orders drop column total_amount;
alter table public.orders drop column quantity, drop column unit_price;
alter table public.orders
  add column item_count integer not null check (item_count > 0),
  add column subtotal_amount integer not null check (subtotal_amount > 0 and subtotal_amount <= 1000000000),
  add column discount_percent integer not null default 0 check (discount_percent between 0 and 100),
  add column discount_amount integer not null default 0,
  add column total_amount integer not null,
  add constraint orders_discount_range check (discount_amount between 0 and subtotal_amount),
  add constraint orders_total_matches check (total_amount = subtotal_amount - discount_amount),
  add constraint orders_seat_required check (seat_id is not null or is_takeaway);

create table public.order_lines (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id),
  menu_item_id uuid not null references public.menu_items (id),
  item_name text not null,
  unit_price integer not null check (unit_price between 1000 and 5000000),
  quantity integer not null check (quantity between 1 and 99),
  line_amount integer generated always as (quantity * unit_price) stored,
  sort_order integer not null,
  unique (order_id, menu_item_id)
);
alter table public.order_lines enable row level security;
create policy owner_read_order_lines on public.order_lines for select to authenticated using (public.is_owner());

-- Số tiền giảm làm tròn xuống tới 1.000đ (SRS FR-03, R34)
create function public.discount_amount(p_subtotal bigint, p_percent integer)
returns integer language sql immutable as $$
  select (p_subtotal * p_percent / 100000 * 1000)::integer
$$;

create function public.order_summary(o public.orders, p_duplicate boolean)
returns jsonb language sql immutable as $$
  select jsonb_build_object(
    'id', o.id, 'item_count', o.item_count, 'subtotal_amount', o.subtotal_amount,
    'discount_percent', o.discount_percent, 'discount_amount', o.discount_amount,
    'total_amount', o.total_amount, 'seat_name', o.seat_name,
    'created_at', o.created_at, 'business_date', o.business_date, 'duplicate', p_duplicate)
$$;

-- SRS FR-04: server quyết định mọi số tiền; lệch giá hoặc món đã ẩn thì từ chối cả đơn
create function public.create_order(
  p_id uuid, p_seat_id uuid, p_is_takeaway boolean, p_discount_percent integer, p_lines jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_takeaway boolean := coalesce(p_is_takeaway, false);
  v_order public.orders;
  v_seat_name text;
  v_count integer;
  v_distinct integer;
  v_qty_ok boolean;
  v_price_ok boolean;
  v_items integer;
  v_subtotal bigint;
  v_discount integer;
  v_start smallint;
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;

  -- Gửi lại cùng id: trả về đơn đã ghi, kể cả khi thực đơn đã đổi sau đó
  select * into v_order from public.orders where id = p_id;
  if found then
    return public.order_summary(v_order, true);
  end if;

  if p_discount_percent is null or p_discount_percent < 0 or p_discount_percent > 100 then
    raise exception 'INVALID_DISCOUNT';
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
  else
    raise exception 'SEAT_REQUIRED';
  end if;

  if p_lines is null or jsonb_typeof(p_lines) <> 'array'
     or jsonb_array_length(p_lines) < 1 or jsonb_array_length(p_lines) > 30 then
    raise exception 'INVALID_LINES';
  end if;

  -- Đọc dòng đơn; sai kiểu thì báo INVALID_LINES thay vì lỗi Postgres thô
  begin
    select count(*),
           count(distinct (l ->> 'menu_item_id')::uuid),
           coalesce(bool_and((l ->> 'quantity')::integer between 1 and 99), false),
           coalesce(bool_and((l ->> 'client_price')::integer is not null), false)
    into v_count, v_distinct, v_qty_ok, v_price_ok
    from jsonb_array_elements(p_lines) l;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'INVALID_LINES';
  end;
  if v_distinct <> v_count or not v_price_ok then
    raise exception 'INVALID_LINES';
  end if;
  if not v_qty_ok then
    raise exception 'INVALID_QUANTITY';
  end if;

  -- Khóa các món trong đơn tới hết giao dịch, để giá không đổi giữa lúc kiểm tra và lúc ghi
  perform 1 from public.menu_items
  where id in (select (l ->> 'menu_item_id')::uuid from jsonb_array_elements(p_lines) l)
  for share;

  if exists (
    select 1 from jsonb_array_elements(p_lines) l
    left join public.menu_items m on m.id = (l ->> 'menu_item_id')::uuid
    where m.id is null or m.is_archived or m.price <> (l ->> 'client_price')::integer
  ) then
    raise exception 'MENU_CHANGED' using detail = (
      select coalesce(jsonb_agg(jsonb_build_object(
               'id', id, 'name', name, 'price', price, 'is_archived', is_archived)
             order by sort_order, name), '[]'::jsonb)::text
      from public.menu_items);
  end if;

  select sum((l ->> 'quantity')::integer), sum((l ->> 'quantity')::bigint * m.price)
  into v_items, v_subtotal
  from jsonb_array_elements(p_lines) l
  join public.menu_items m on m.id = (l ->> 'menu_item_id')::uuid;
  if v_subtotal > 1000000000 then
    raise exception 'TOTAL_TOO_LARGE';
  end if;
  v_discount := public.discount_amount(v_subtotal, p_discount_percent);

  select business_day_start_hour into v_start from public.settings where id = 1;

  insert into public.orders (id, item_count, subtotal_amount, discount_percent, discount_amount, total_amount,
                             seat_id, seat_name, is_takeaway, created_by, created_at, business_date)
  values (p_id, v_items, v_subtotal, p_discount_percent, v_discount, v_subtotal - v_discount,
          p_seat_id, v_seat_name, v_takeaway, auth.uid(), now(), public.compute_business_date(now(), v_start))
  on conflict (id) do nothing
  returning * into v_order;

  if not found then
    select * into v_order from public.orders where id = p_id;
    return public.order_summary(v_order, true);
  end if;

  insert into public.order_lines (order_id, menu_item_id, item_name, unit_price, quantity, sort_order)
  select p_id, m.id, m.name, m.price, (l.value ->> 'quantity')::integer, l.ordinality
  from jsonb_array_elements(p_lines) with ordinality l(value, ordinality)
  join public.menu_items m on m.id = (l.value ->> 'menu_item_id')::uuid;

  return public.order_summary(v_order, false);
end
$$;

-- SRS FR-04b: Đơn vừa tạo, kèm dòng đơn
create function public.list_orders_by_ids(p_ids uuid[])
returns table (id uuid, item_count integer, subtotal_amount integer, discount_percent integer,
               discount_amount integer, total_amount integer, seat_name text, status text,
               created_at timestamptz, lines jsonb)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    raise exception 'FORBIDDEN';
  end if;
  return query
    select o.id, o.item_count, o.subtotal_amount, o.discount_percent, o.discount_amount, o.total_amount,
           o.seat_name, o.status, o.created_at,
           (select jsonb_agg(jsonb_build_object(
                     'item_name', ol.item_name, 'unit_price', ol.unit_price,
                     'quantity', ol.quantity, 'line_amount', ol.line_amount) order by ol.sort_order)
            from public.order_lines ol where ol.order_id = o.id)
    from public.orders o
    where o.id = any (p_ids) and o.business_date = public.current_business_date()
    order by o.created_at desc;
end
$$;

-- SRS FR-06, FR-07: doanh thu sau giảm, số món, tổng tiền đã giảm. owner_stats dùng lại hàm này.
create or replace function public.history_totals(p_from date, p_to date)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.is_owner() then raise exception 'FORBIDDEN'; end if;
  select jsonb_build_object(
    'revenue', coalesce(sum(total_amount), 0),
    'item_count', coalesce(sum(item_count), 0),
    'order_count', count(*),
    'discount_total', coalesce(sum(discount_amount), 0))
  into v_result
  from public.orders
  where status = 'paid' and business_date between p_from and p_to;
  return v_result;
end
$$;

revoke execute on function public.order_summary(public.orders, boolean) from public, anon, authenticated;
revoke execute on function public.discount_amount(bigint, integer) from public, anon;
revoke execute on function public.create_order(uuid, uuid, boolean, integer, jsonb) from public, anon;
revoke execute on function public.list_orders_by_ids(uuid[]) from public, anon;
grant execute on function public.discount_amount(bigint, integer) to authenticated;
grant execute on function public.create_order(uuid, uuid, boolean, integer, jsonb) to authenticated;
grant execute on function public.list_orders_by_ids(uuid[]) to authenticated;
```

- [ ] **Step 5: Chạy test, xác nhận đạt**

Run: `npx supabase db reset && npx supabase test db`
Expected: tất cả PASS: 01 (11), 02, 03 (42), 04 (12), 05 (6), 07 (20), 08 (15). Nếu 03 báo sai `plan`, đếm lại số `select is/throws_ok/ok` trong file và sửa số trong `plan(…)` cho khớp; **không** xóa test để khớp số.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20261005000200_order_lines.sql supabase/tests/
git commit -m "feat(db): đơn hàng gồm dòng đơn, giảm giá theo phần trăm; xóa dữ liệu thử một lần (SRS v3.0 FR-03, FR-04, R36)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Kiểm tra realtime và đối chiếu SRS

**Files:** không có file mới. Script kiểm tra realtime chỉ đặt trong thư mục tạm, không commit.

**Interfaces:**
- Consumes: mọi thứ của Task 1–2.
- Produces: kết quả "khớp SRS" của `srs-reviewer` cho `supabase/`.

- [ ] **Step 1: Kiểm tra tay realtime của thực đơn và đơn mới**

Chạy `npx supabase db reset`, tạo hai tài khoản theo README (`npm run create-user -- owner owner@quan.vn matkhau123`, `npm run create-user -- staff nhanvien@quan.local 123456`). Sau đó chạy một script Node dùng `@supabase/supabase-js` (đặt trong thư mục tạm, nạp `.env.local`) làm các việc sau:
- Đăng nhập nhân viên, subscribe `postgres_changes` UPDATE trên `menu_items`.
- Đăng nhập chủ quán, `update menu_items set is_archived = true where name = 'Mocktail'`.

Expected: nhân viên nhận sự kiện với `is_archived: true`. Lần chạy đầu ngay sau khi Realtime khởi động có thể trượt sự kiện, đã gặp ở v2.3; chạy lại một lần trước khi kết luận lỗi.

- [ ] **Step 2: Giao `srs-reviewer`**

Prompt cho agent `srs-reviewer`: đối chiếu `git diff origin/main -- supabase/` với SRS v3.0 (FR-01–FR-05a, FR-07, FR-07a, §4, NFR-04, NFR-05, R32–R36) và `.claude/rules/database.md`. Ghi chú cho agent: frontend chưa sửa, đó là việc của đợt 2–4.

Expected: "khớp SRS". Sửa mọi chỗ lệch nó báo, chạy lại `npx supabase test db`, rồi commit phần sửa.

---

## Các đợt sau (kế hoạch riêng, viết khi đợt trước xong)

| Đợt | File kế hoạch | Nội dung chính |
|---|---|---|
| 2 | `docs/superpowers/plans/…-dot-2-trang-thuc-don.md` | `/admin/menu` (thêm, sửa tên, sửa giá, sắp xếp, ẩn/hiện, lịch sử giá); bỏ mục Đơn giá chung ở Cài đặt; thanh điều hướng 5 mục; hàm thuần kiểm tra tên/giá trong `src/lib/` kèm Vitest |
| 3 | `…-dot-3-man-order.md` | Hàm thuần giỏ đơn (`src/lib/cart.ts`) và tính tiền hiển thị đối chiếu với `discount_amount`; lưới món, thanh và tấm giỏ đơn, phiếu đơn màn rộng; chỗ ngồi to, bắt buộc, dải "Đang chọn"; xử lý `MENU_CHANGED` và realtime thực đơn; `src/lib/api.ts` gọi `create_order` mới |
| 4 | `…-dot-4-bao-cao.md` | Lịch sử `<details>` và `?order=`; Tổng quan "Số món"; CSV 8 cột và hàng "Giảm giá" kèm Vitest; thông báo đơn mới thành liên kết; đếm đơn prod và bàn giao `db push` cho chủ quán |
