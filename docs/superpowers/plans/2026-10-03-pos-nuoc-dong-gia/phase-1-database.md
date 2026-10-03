# Giai đoạn 1: Nền tảng & Database

> Thuộc kế hoạch [POS Quán Nước Đồng Giá](../2026-10-03-pos-nuoc-dong-gia.md). Đọc phần **Global Constraints** và **Hợp đồng dùng chung** trong file đó trước khi làm.

**Cách chạy test DB:** bật Docker Desktop, chạy `npx supabase start` (lần đầu mất vài phút để tải image), sau đó:
- `npx supabase db reset`: áp lại toàn bộ migration và `seed.sql`.
- `npx supabase test db`: chạy mọi file trong `supabase/tests/`.

Mỗi file pgTAP tự bọc trong `begin … rollback`, không phụ thuộc vào seed.

**Cách giả lập người gọi trong pgTAP:** dùng tài khoản `owner` (`…a1`, phiên `…a5`) và `staff` (`…b1`, phiên `…b5`). Tạo các dòng này trong `auth.users`, `public.app_roles` và `auth.sessions`, rồi đặt `request.jwt.claims`:

```sql
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
```

Đặt lại claims thành `'{}'` để giả lập người chưa đăng nhập.

---

### Task 1: Khởi tạo dự án

**Files:**
- Create: toàn bộ khung dự án do `create-next-app` tạo ra, `vitest.config.ts`, `tests/setup.ts`, `src/lib/money.ts`
- Create: `supabase/config.toml` (do `supabase init` tạo, sau đó sửa)
- Test: `tests/unit/money.test.ts`

**Interfaces:**
- Produces:
  - `formatVnd(amount: number): string`, ví dụ `formatVnd(175000) === "175.000đ"`.
  - Các script npm: `test`, `db:start`, `db:reset`, `db:test`.

- [ ] **Step 1: Khởi tạo git và Next.js 15**

```bash
cd E:/Work/POS_Nuoc_Noi
git init
npx create-next-app@15 . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack --yes
```

Nếu `create-next-app` báo thư mục có file gây xung đột (vì đã có `docs/`, `.claude/`, `GLOSSARY.md`), chạy với `pos-tmp` thay cho `.` và chuyển toàn bộ nội dung của `pos-tmp/` (kể cả file ẩn) lên thư mục gốc, rồi xóa `pos-tmp`. **Không được ghi đè** `docs/`, `.claude/` và `GLOSSARY.md`.

- [ ] **Step 2: Cài dependency**

```bash
npm i @supabase/supabase-js @supabase/ssr
npm i -D supabase vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

- [ ] **Step 3: Cấu hình Vitest**

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}"],
  },
});
```

`tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest không bật globals, nên Testing Library không tự dọn DOM giữa các test
afterEach(() => {
  cleanup();
  localStorage.clear();
});
```

Thêm vào `"scripts"` trong `package.json` (giữ nguyên các script có sẵn):

```json
"test": "vitest run",
"test:watch": "vitest",
"db:start": "supabase start",
"db:reset": "supabase db reset",
"db:test": "supabase test db"
```

- [ ] **Step 4: Khởi tạo Supabase và tắt tự đăng ký**

```bash
npx supabase init
```

Trong `supabase/config.toml`, sửa **cả hai** dòng sau:
- Dưới `[auth]`: `enable_signup = false`.
- Dưới `[auth.email]`: `enable_signup = false`.

- [ ] **Step 5: Viết test thất bại cho `formatVnd`**

`tests/unit/money.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatVnd } from "@/lib/money";

describe("formatVnd", () => {
  it("định dạng hàng nghìn bằng dấu chấm và hậu tố đ", () => {
    expect(formatVnd(25000)).toBe("25.000đ");
    expect(formatVnd(175000)).toBe("175.000đ");
    expect(formatVnd(1250000)).toBe("1.250.000đ");
  });
  it("số nhỏ và số 0", () => {
    expect(formatVnd(0)).toBe("0đ");
    expect(formatVnd(500)).toBe("500đ");
  });
});
```

- [ ] **Step 6: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL, vì không tìm thấy module `@/lib/money`.

- [ ] **Step 7: Cài đặt `formatVnd`**

`src/lib/money.ts`:

```ts
export function formatVnd(amount: number): string {
  const digits = Math.trunc(amount).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
}
```

- [ ] **Step 8: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS (2 test).

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15, Vitest, Supabase; add formatVnd

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Schema, RLS và `business_date`

**Files:**
- Create: `supabase/migrations/20261003000100_schema.sql`, `supabase/seed.sql`
- Test: `supabase/tests/01_schema.test.sql`

**Interfaces:**
- Produces:
  - Các bảng `settings`, `price_history`, `seats`, `orders`, đúng SRS mục 4. `seats.kind` là `table` (Bàn) hoặc `counter` (Ghế quầy).
  - Hàm `public.compute_business_date(ts timestamptz, start_hour smallint) returns date`.
  - Hàm `public.current_business_date() returns date`.
  - Dòng `settings(id=1, current_price=25000, business_day_start_hour=20)` và một dòng `price_history` khởi tạo.

- [ ] **Step 1: Viết test thất bại**

`supabase/tests/01_schema.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public', 'settings', 'có bảng settings');
select has_table('public', 'price_history', 'có bảng price_history');
select has_table('public', 'seats', 'có bảng seats');
select has_table('public', 'orders', 'có bảng orders');

-- 22:59 UTC = 05:59 giờ VN ngày 04/10, vẫn thuộc ngày kinh doanh 03/10 khi giờ mở cửa là 6
select is(public.compute_business_date('2026-10-03 22:59:00+00', 6::smallint), '2026-10-03'::date, '05:59 VN thuộc ngày hôm trước');
-- 23:00 UTC = 06:00 giờ VN ngày 04/10, bắt đầu ngày kinh doanh 04/10
select is(public.compute_business_date('2026-10-03 23:00:00+00', 6::smallint), '2026-10-04'::date, '06:00 VN là ngày mới');

select is((select current_price from public.settings where id = 1), 25000, 'giá mặc định 25000');
select is((select count(*)::int from public.price_history), 1, 'có 1 dòng price_history khởi tạo');

set local role anon;
select is((select count(*)::int from public.settings), 1, 'anon đọc được settings');
select throws_ok(
  $$insert into public.orders (id, quantity, unit_price, created_by, business_date)
    values (gen_random_uuid(), 1, 1000, gen_random_uuid(), current_date)$$,
  '42501'
);
reset role;

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npx supabase start` (nếu chưa chạy), rồi `npx supabase test db`. Kết quả mong đợi: FAIL ở `has_table`.

- [ ] **Step 3: Viết migration và seed**

`supabase/migrations/20261003000100_schema.sql`:

```sql
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
```

`supabase/seed.sql`:

```sql
-- 12 ghế quầy và 3 bàn (SRS R14)
insert into public.seats (name, kind, sort_order) values
  ('Quầy 1', 'counter', 1), ('Quầy 2', 'counter', 2), ('Quầy 3', 'counter', 3),
  ('Quầy 4', 'counter', 4), ('Quầy 5', 'counter', 5), ('Quầy 6', 'counter', 6),
  ('Quầy 7', 'counter', 7), ('Quầy 8', 'counter', 8), ('Quầy 9', 'counter', 9),
  ('Quầy 10', 'counter', 10), ('Quầy 11', 'counter', 11), ('Quầy 12', 'counter', 12),
  ('Bàn 1', 'table', 1), ('Bàn 2', 'table', 2), ('Bàn 3', 'table', 3);
```

Policy cho chủ quán được thêm ở Task 3, sau khi có hàm `is_owner()`.

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npx supabase db reset && npx supabase test db`. Kết quả mong đợi: `01_schema.test.sql .. ok`.

- [ ] **Step 5: Commit**

```bash
git add supabase
git commit -m "feat(db): schema, RLS baseline, business_date functions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Vai trò, kiểm tra phiên đăng nhập và PIN quán

**Files:**
- Create: `supabase/migrations/20261003000200_roles_pin.sql`
- Test: `supabase/tests/02_roles_pin.test.sql`

**Interfaces:**
- Consumes: các bảng của Task 2.
- Produces:
  - Bảng `app_roles(user_id uuid pk, role text check in ('owner','staff'))`, có ràng buộc unique: chỉ một dòng `staff`.
  - `public.current_app_role() returns text`: trả về `null` nếu chưa đăng nhập **hoặc phiên đăng nhập đã bị xóa**.
  - `public.is_owner() returns boolean`.
  - `public.is_staff() returns boolean`: đúng cho cả `staff` và `owner`.
  - `public.set_shop_pin(p_pin text) returns void`: đổi mật khẩu của tài khoản `staff` và xóa mọi phiên của tài khoản đó.
  - RLS cho chủ quán trên `price_history`, `seats`, `orders`. Mỗi người tự đọc được dòng `app_roles` của mình.

- [ ] **Step 1: Viết test thất bại**

`supabase/tests/02_roles_pin.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, aud, role, encrypted_password) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated', extensions.crypt('matkhau123', extensions.gen_salt('bf'))),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated', extensions.crypt('123456', extensions.gen_salt('bf')));
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

-- Nhân viên có phiên hợp lệ
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select is(public.is_staff(), true, 'nhân viên có quyền staff');
select is(public.is_owner(), false, 'nhân viên không có quyền owner');
select throws_ok($$select public.set_shop_pin('654321')$$, 'P0001', 'FORBIDDEN', 'nhân viên không đổi được PIN');

-- Phiên không tồn tại thì mất quyền
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000ff"}', true);
select is(public.is_staff(), false, 'phiên không tồn tại thì không có quyền');

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select is(public.is_staff(), false, 'chưa đăng nhập thì không có quyền');

-- Chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select is(public.is_owner() and public.is_staff(), true, 'chủ quán có cả hai quyền');
select throws_ok($$select public.set_shop_pin('12ab')$$, 'P0001', 'INVALID_PIN_FORMAT', 'PIN phải đúng 6 chữ số');
select lives_ok($$select public.set_shop_pin('654321')$$, 'chủ quán đổi được PIN');
select is((select encrypted_password = extensions.crypt('654321', encrypted_password) from auth.users where id = '00000000-0000-0000-0000-0000000000b1'),
  true, 'mật khẩu tài khoản nhân viên đã thành PIN mới');
select is((select count(*)::int from auth.sessions where user_id = '00000000-0000-0000-0000-0000000000b1'), 0, 'mọi phiên của nhân viên bị xóa');
select is((select count(*)::int from auth.sessions where user_id = '00000000-0000-0000-0000-0000000000a1'), 1, 'phiên của chủ quán vẫn còn');

-- Chưa có tài khoản nhân viên
delete from public.app_roles where role = 'staff';
select throws_ok($$select public.set_shop_pin('111111')$$, 'P0001', 'STAFF_ACCOUNT_MISSING', 'báo lỗi khi chưa tạo tài khoản nhân viên');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npx supabase test db`. Kết quả mong đợi: `02_roles_pin` FAIL vì chưa có bảng `app_roles`.

- [ ] **Step 3: Viết migration**

`supabase/migrations/20261003000200_roles_pin.sql`:

```sql
create table public.app_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'staff'))
);
-- Chỉ có một tài khoản nhân viên chung
create unique index app_roles_single_staff on public.app_roles (role) where role = 'staff';
alter table public.app_roles enable row level security;
create policy app_roles_read_self on public.app_roles for select to authenticated using (user_id = auth.uid());

-- Vai trò của người gọi. Trả về null nếu phiên đăng nhập đã bị xóa (ví dụ sau khi đổi PIN quán).
create function public.current_app_role()
returns text language sql stable security definer set search_path = public, auth as $$
  select r.role
  from public.app_roles r
  where r.user_id = auth.uid()
    and exists (
      select 1 from auth.sessions s
      where s.id = nullif(auth.jwt() ->> 'session_id', '')::uuid
    )
$$;

create function public.is_owner()
returns boolean language sql stable as $$
  select coalesce(public.current_app_role() = 'owner', false)
$$;

create function public.is_staff()
returns boolean language sql stable as $$
  select coalesce(public.current_app_role() in ('staff', 'owner'), false)
$$;

-- Đổi PIN quán = đổi mật khẩu tài khoản nhân viên chung + xóa mọi phiên của tài khoản đó.
-- Supabase Auth dùng bcrypt, nên hash do crypt(..., gen_salt('bf')) tạo ra đăng nhập được.
create function public.set_shop_pin(p_pin text)
returns void language plpgsql security definer set search_path = public, extensions, auth as $$
declare
  v_staff uuid;
begin
  if not public.is_owner() then
    raise exception 'FORBIDDEN';
  end if;
  if p_pin is null or p_pin !~ '^\d{6}$' then
    raise exception 'INVALID_PIN_FORMAT';
  end if;
  select user_id into v_staff from public.app_roles where role = 'staff';
  if v_staff is null then
    raise exception 'STAFF_ACCOUNT_MISSING';
  end if;
  update auth.users
  set encrypted_password = extensions.crypt(p_pin, extensions.gen_salt('bf')), updated_at = now()
  where id = v_staff;
  delete from auth.sessions where user_id = v_staff;
end
$$;

revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.set_shop_pin(text) from public, anon;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.set_shop_pin(text) to authenticated;

create policy owner_read_price_history on public.price_history for select to authenticated using (public.is_owner());
create policy owner_all_seats on public.seats for all to authenticated using (public.is_owner()) with check (public.is_owner());
create policy owner_read_orders on public.orders for select to authenticated using (public.is_owner());
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npx supabase db reset && npx supabase test db`. Kết quả mong đợi: `01` và `02` đều ok.

- [ ] **Step 5: Commit**

```bash
git add supabase
git commit -m "feat(db): owner/staff roles with live session check, shop PIN change

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: `create_order` và `list_active_seats`

**Files:**
- Create: `supabase/migrations/20261003000300_create_order.sql`
- Test: `supabase/tests/03_create_order.test.sql`

**Interfaces:**
- Consumes: `is_staff`, `compute_business_date`, các bảng `settings`, `seats`, `orders`.
- Produces:
  - `public.create_order(p_id uuid, p_quantity integer, p_seat_id uuid, p_is_takeaway boolean, p_client_price integer) returns jsonb`, trả về các field của `CreatedOrder`.
  - `public.list_active_seats() returns table (id uuid, name text, kind text)`, sắp theo `kind`, `sort_order`, `name` (ghế quầy `counter` đứng trước bàn `table`).

**Quy tắc** (SRS FR-04):
- `unit_price = settings.current_price` và `created_at = now()`.
- `price_changed = unit_price ≠ client_price`.
- `id` đã tồn tại thì trả về đơn cũ kèm `duplicate: true`, không ghi thêm.

- [ ] **Step 1: Viết test thất bại**

`supabase/tests/03_create_order.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(19);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');
update public.settings set current_price = 25000, business_day_start_hour = 6 where id = 1;
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c9', 'Quầy 9', 'counter');
insert into public.seats (id, name, kind, is_archived) values ('00000000-0000-0000-0000-0000000000c8', 'Ghế cũ', 'counter', true);

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$select public.create_order(gen_random_uuid(), 1, null, false, 25000)$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không tạo được đơn');
select throws_ok($$select * from public.list_active_seats()$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không xem được chỗ ngồi');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);

create temp table o1 as select public.create_order(
  '00000000-0000-0000-0000-000000000001', 7, '00000000-0000-0000-0000-0000000000c9', false, 25000) as r;
select is((select (r ->> 'unit_price')::int from o1), 25000, 'dùng đơn giá chung hiện hành');
select is((select (r ->> 'total_amount')::int from o1), 175000, 'thành tiền = 7 × 25000');
select is((select (r ->> 'price_changed')::boolean from o1), false, 'giá khớp thì price_changed = false');
select is((select (r ->> 'duplicate')::boolean from o1), false, 'đơn mới không phải duplicate');
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000001'), 'Quầy 9', 'lưu tên chỗ ngồi tại thời điểm tạo');
select is((select created_by::text from public.orders where id = '00000000-0000-0000-0000-000000000001'), '00000000-0000-0000-0000-0000000000b1', 'lưu người tạo');
select is((select business_date from public.orders where id = '00000000-0000-0000-0000-000000000001'),
  public.compute_business_date(now(), 6::smallint), 'business_date theo giờ mở cửa');

-- Mạng rớt sau khi server đã ghi, nhân viên bấm gửi lại cùng id
select is((public.create_order('00000000-0000-0000-0000-000000000001', 7, '00000000-0000-0000-0000-0000000000c9', false, 25000) ->> 'duplicate')::boolean,
  true, 'gửi lại cùng id → duplicate');
select is((select count(*)::int from public.orders where id = '00000000-0000-0000-0000-000000000001'), 1, 'không tạo đơn thứ hai');

-- Giá trên máy đã cũ
create temp table o2 as select public.create_order('00000000-0000-0000-0000-000000000002', 1, null, false, 20000) as r;
select is((select (r ->> 'unit_price')::int || '/' || (r ->> 'price_changed') from o2), '25000/true', 'giá cũ trên máy: server dùng giá mới và báo price_changed');

-- Kiểm tra dữ liệu đầu vào
select throws_ok($$select public.create_order(gen_random_uuid(), 0, null, false, 25000)$$, 'P0001', 'INVALID_QUANTITY', 'số lượng 0 bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), 501, null, false, 25000)$$, 'P0001', 'INVALID_QUANTITY', 'số lượng 501 bị từ chối');
select throws_ok($$select public.create_order(gen_random_uuid(), 1, '00000000-0000-0000-0000-0000000000c9', true, 25000)$$,
  'P0001', 'INVALID_SEAT', 'không được vừa mang về vừa có chỗ ngồi');
select throws_ok($$select public.create_order(gen_random_uuid(), 1, gen_random_uuid(), false, 25000)$$,
  'P0001', 'SEAT_NOT_FOUND', 'chỗ ngồi không tồn tại');

select public.create_order('00000000-0000-0000-0000-000000000003', 2, null, true, 25000);
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000003'), 'Mang về', 'mang về có seat_name = Mang về');

select ok(exists (select 1 from public.list_active_seats() where name = 'Quầy 9' and kind = 'counter'), 'có ghế quầy đang dùng, kèm loại');
select ok(not exists (select 1 from public.list_active_seats() where name = 'Ghế cũ'), 'không trả về chỗ ngồi đã ẩn');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npx supabase test db`. Kết quả mong đợi: `03` FAIL vì chưa có hàm `create_order`.

- [ ] **Step 3: Viết migration**

`supabase/migrations/20261003000300_create_order.sql`:

```sql
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
```

Test chạy với role `postgres` (không `set role`), nên việc thu hồi quyền `anon` không làm test thất bại. Quyền thật sự được chặn bởi `is_staff()`.

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npx supabase db reset && npx supabase test db`. Kết quả mong đợi: từ `01` đến `03` đều ok.

- [ ] **Step 5: Commit**

```bash
git add supabase
git commit -m "feat(db): create_order with server pricing and idempotent retry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Hủy đơn và danh sách đơn của điện thoại

**Files:**
- Create: `supabase/migrations/20261003000400_cancel_list.sql`
- Test: `supabase/tests/04_cancel_list.test.sql`

**Interfaces:**
- Consumes: `is_staff`, `is_owner`, `current_business_date`.
- Produces:
  - `public.cancel_order(p_order_id uuid) returns void`.
    - Nhân viên chỉ hủy được trong 5 phút; chủ quán hủy được mọi lúc.
    - Hủy đơn đã hủy thì không báo lỗi.
    - Không phân biệt ai đã tạo đơn.
  - `public.list_orders_by_ids(p_ids uuid[]) returns table (id uuid, quantity integer, unit_price integer, total_amount integer, seat_name text, status text, created_at timestamptz)`: chỉ các đơn thuộc ngày kinh doanh hiện tại, mới nhất ở trên.

- [ ] **Step 1: Viết test thất bại**

`supabase/tests/04_cancel_list.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

insert into public.orders (id, quantity, unit_price, created_by, created_at, business_date) values
  ('00000000-0000-0000-0000-0000000000d1', 1, 25000, '00000000-0000-0000-0000-0000000000b1', now() - interval '2 minutes', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d2', 2, 25000, '00000000-0000-0000-0000-0000000000b1', now() - interval '6 minutes', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d3', 3, 25000, '00000000-0000-0000-0000-0000000000a1', now() - interval '1 minute', public.current_business_date()),
  ('00000000-0000-0000-0000-0000000000d4', 4, 25000, '00000000-0000-0000-0000-0000000000b1', now() - interval '1 day', public.current_business_date() - 1);

-- Chưa đăng nhập
select set_config('request.jwt.claims', '{}', true);
select throws_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d1')$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không hủy được');
select throws_ok($$select * from public.list_orders_by_ids(array['00000000-0000-0000-0000-0000000000d1'::uuid])$$, 'P0001', 'FORBIDDEN', 'chưa đăng nhập không xem được');

-- Nhân viên
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select is((select count(*)::int from public.list_orders_by_ids(array[
  '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2', '00000000-0000-0000-0000-0000000000d4']::uuid[])),
  2, 'chỉ trả về đơn của ngày kinh doanh hiện tại');
select is((select id from public.list_orders_by_ids(array[
  '00000000-0000-0000-0000-0000000000d1', '00000000-0000-0000-0000-0000000000d2']::uuid[]) limit 1),
  '00000000-0000-0000-0000-0000000000d1'::uuid, 'mới nhất ở trên');

select lives_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d3')$$, 'nhân viên hủy được đơn của người khác trong 5 phút');
select is((select status || '/' || cancelled_by from public.orders where id = '00000000-0000-0000-0000-0000000000d3'),
  'cancelled/00000000-0000-0000-0000-0000000000b1', 'ghi trạng thái và người hủy');
select lives_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d3')$$, 'hủy lần 2 không lỗi');
select throws_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d2')$$, 'P0001', 'CANCEL_WINDOW_EXPIRED', 'nhân viên không hủy được đơn quá 5 phút');
select throws_ok($$select public.cancel_order(gen_random_uuid())$$, 'P0001', 'ORDER_NOT_FOUND', 'đơn không tồn tại');

-- Chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);
select lives_ok($$select public.cancel_order('00000000-0000-0000-0000-0000000000d2')$$, 'chủ quán hủy được đơn quá 5 phút');
select is((select cancelled_by::text from public.orders where id = '00000000-0000-0000-0000-0000000000d2'), '00000000-0000-0000-0000-0000000000a1', 'ghi chủ quán là người hủy');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npx supabase test db`. Kết quả mong đợi: `04` FAIL vì chưa có hàm.

- [ ] **Step 3: Viết migration**

`supabase/migrations/20261003000400_cancel_list.sql`:

```sql
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
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npx supabase db reset && npx supabase test db`. Kết quả mong đợi: từ `01` đến `04` đều ok.

- [ ] **Step 5: Commit**

```bash
git add supabase
git commit -m "feat(db): cancel_order with 5-minute staff window, list orders by ids

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: RPC của chủ quán và báo cáo

**Files:**
- Create: `supabase/migrations/20261003000500_owner_reports.sql`
- Test: `supabase/tests/05_owner_reports.test.sql`

**Interfaces:**
- Consumes: `is_owner`, `current_business_date`.
- Produces (tất cả raise `FORBIDDEN` nếu người gọi không phải chủ quán):
  - `public.update_price(p_price integer) returns void`: raise `INVALID_PRICE`; ghi thêm một dòng `price_history`.
  - `public.update_business_day_start_hour(p_hour integer) returns void`: raise `INVALID_HOUR`.
  - `public.dashboard_summary(p_today date default null) returns jsonb`, trả về `{ business_date, today_revenue, today_cups, month_revenue }`.
  - `public.history_totals(p_from date, p_to date) returns jsonb`, trả về `{ revenue, cups, order_count }`.

  Mọi số liệu chỉ tính đơn có `status = 'paid'`. Tham số `p_today` chỉ có để test cố định được ngày "hôm nay". UI gọi hàm mà không truyền tham số này.

- [ ] **Step 1: Viết test thất bại**

`supabase/tests/05_owner_reports.test.sql`:

```sql
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.vn', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'staff@test.vn', 'authenticated', 'authenticated');
insert into public.app_roles (user_id, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner'), ('00000000-0000-0000-0000-0000000000b1', 'staff');
insert into auth.sessions (id, user_id) values
  ('00000000-0000-0000-0000-0000000000a5', '00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000b5', '00000000-0000-0000-0000-0000000000b1');

insert into public.orders (id, quantity, unit_price, status, created_by, business_date) values
  (gen_random_uuid(), 2, 25000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 3, 25000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 10, 25000, 'cancelled', '00000000-0000-0000-0000-0000000000b1', '2026-10-15'),
  (gen_random_uuid(), 1, 20000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-10-01'),
  (gen_random_uuid(), 4, 20000, 'paid', '00000000-0000-0000-0000-0000000000b1', '2026-09-30');

-- Nhân viên không gọi được RPC của chủ quán
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000b5"}', true);
select throws_ok($$select public.dashboard_summary('2026-10-15')$$, 'P0001', 'FORBIDDEN', 'nhân viên không xem được tổng quan');
select throws_ok($$select public.update_price(30000)$$, 'P0001', 'FORBIDDEN', 'nhân viên không đổi được giá');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated","session_id":"00000000-0000-0000-0000-0000000000a5"}', true);

create temp table s as select public.dashboard_summary('2026-10-15') as r;
select is((select (r ->> 'today_revenue')::int from s), 125000, 'doanh thu hôm nay không tính đơn hủy');
select is((select (r ->> 'today_cups')::int from s), 5, 'số cốc hôm nay');
select is((select (r ->> 'month_revenue')::int from s), 145000, 'doanh thu tháng không tính tháng trước');
select is((select r ->> 'business_date' from s), '2026-10-15', 'trả về ngày đang xem');

select is(public.history_totals('2026-09-30', '2026-10-15'),
  '{"revenue": 225000, "cups": 10, "order_count": 4}'::jsonb, 'tổng của khoảng lọc chỉ tính đơn đã thanh toán');

select public.update_price(30000);
select is((select current_price from public.settings where id = 1), 30000, 'cập nhật đơn giá chung');
select is((select changed_by::text from public.price_history order by effective_from desc, id desc limit 1),
  '00000000-0000-0000-0000-0000000000a1', 'ghi price_history kèm người đổi');
select throws_ok($$select public.update_price(0)$$, 'P0001', 'INVALID_PRICE', 'giá phải lớn hơn 0');

select throws_ok($$select public.update_business_day_start_hour(24)$$, 'P0001', 'INVALID_HOUR', 'giờ trong khoảng 0–23');
select public.update_business_day_start_hour(4);
select is((select business_day_start_hour::int from public.settings where id = 1), 4, 'cập nhật giờ mở cửa');

select * from finish();
rollback;
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npx supabase test db`. Kết quả mong đợi: `05` FAIL vì chưa có hàm.

- [ ] **Step 3: Viết migration**

`supabase/migrations/20261003000500_owner_reports.sql`:

```sql
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
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npx supabase db reset && npx supabase test db`. Kết quả mong đợi: từ `01` đến `05` đều ok.

- [ ] **Step 5: Commit**

```bash
git add supabase
git commit -m "feat(db): owner price/hour settings and revenue report RPCs

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
