# Đợt 3: Màn order chọn món (Bao diêm quán bar) và bỏ Mang về

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dựng lại `/order` theo SRS v3.2: bảng giá chạm để thêm món, giỏ đơn (− / ô số / +, giảm giá, chỗ ngồi bắt buộc), gửi đơn qua `create_order` mới; database bỏ hẳn Mang về.

**Architecture:**
- **Database:** một migration bỏ cột `is_takeaway`, ép `seat_id not null`, và đổi `create_order` sang 4 tham số.
- **Trình duyệt:**
  - Hàm thuần giỏ đơn `src/lib/order/cart.ts`.
  - Hook `useMenu` đọc thực đơn kèm realtime, thay cho `useCurrentPrice`.
  - `OrderScreen` ghép các component: `MenuBoard`, `CartBar`, `CartPanel`, `CartSheet`, `SeatPicker`, `ConfirmBar`, `RecentOrders`.
  - Điện thoại dùng `<dialog>` gốc làm tấm giỏ đơn; màn rộng từ 768px có phiếu đơn luôn hiện.
- **Hành vi giữ nguyên:** quy tắc thông báo, gửi lại cùng `id`, hủy, Hoàn tác.

**Tech Stack:** Supabase (Postgres, pgTAP, Realtime), Next.js 15, React 19, Tailwind v4, Vitest + Testing Library, lucide-react, Playwright (chụp ảnh).

**Spec:**
- `docs/SRS.md` v3.2: FR-01–FR-04b, R33, R34, R37, R38.
- Hợp đồng thiết kế: `C:/Users/HP/.claude/skills/impeccable/scripts/impeccable surface-brief read src/app/order/page.tsx`.
- Brief màn order: `docs/design/order-brief.md`; mục Mang về trong đó lỗi thời, Task 5 sửa.
- Spec thiết kế: `docs/superpowers/specs/2026-10-04-thuc-don-giam-gia-design.md` §5.

## Global Constraints

- **Bảng giá:**
  - Mỗi món chưa ẩn là một hàng nút cao ≥ 56px: tên `font-display` bên trái, giá bên phải.
  - Chạm hàng là +1. Món đang có trong giỏ hiện số lượng mực cam ở đầu hàng.
  - Nhấn thì hàng đảo màu kem (`active:bg-ink active:text-bg`).
- **Giỏ đơn:**
  - Số lượng mỗi dòng 1–99; tối đa 30 dòng.
  - − ở số lượng 1 thì xóa dòng.
  - Ô số để trống hoặc 0 thì khi rời ô trả về số cũ; nhập quá 99 thì về 99.
  - "Xóa hết" xác nhận hai bước.
- **Giảm giá:**
  - Số nguyên 0–100; nút 5, 10, 15, 20% và ô nhập tay; bấm lại nút đang chọn thì bỏ.
  - Số tiền giảm = `floor(tạm tính × % ÷ 100 ÷ 1000) × 1000`, cùng công thức `public.discount_amount` ở server.
- **Chỗ ngồi bắt buộc**, không có Mang về (R38).
  - Ghế quầy 2 hàng × 6, Bàn 4 cột; nút cao 56px.
  - Đang chọn là khối mực cam, chữ `text-ember-ink`; các chỗ khác lùi `opacity-60`.
  - Tên chỗ đang chọn hiện cỡ lớn ngay trên nút Xác nhận; chưa chọn thì "Chưa chọn chỗ ngồi" màu `text-warn`.
- **Thanh giỏ đơn (điện thoại):**
  - Dải quẹt diêm `.striker`, trên đó tấm in mực cam (tấm đảo màu duy nhất của màn): "N món" và Thành tiền `font-display` lớn bên trái, nút "Giỏ đơn" bên phải.
  - Giỏ trống: không có tấm cam, chỉ chữ "Chạm món để thêm".
- **Xác nhận đơn:** khối mực cam cao 64px. Bị khóa thì ghi lý do ngay trên nút, theo thứ tự ưu tiên:
  1. "Đang tải thực đơn…"
  2. "Chạm món để thêm"
  3. "Bỏ món đã ngừng bán khỏi đơn"
  4. "Chọn chỗ ngồi"
  5. "Mất mạng – chưa gửi được đơn"
- **Gửi thành công** (FR-04):
  - Rung 30ms; giỏ trống, bỏ giảm giá, bỏ chọn chỗ ngồi, tấm giỏ đơn đóng.
  - Thanh phản hồi "Đã tạo đơn N món – X đ" + Hoàn tác trong 5 giây.
  - Dải quẹt bùng sáng một lần 400ms (`.striker-flare`).
- **Thông báo** (FR-04):
  - Lỗi `role="alert"` và thông tin `role="status"` ở hai ô riêng.
  - Lỗi ẩn khi đổi giỏ, giảm giá hoặc chỗ ngồi.
  - Thông báo "Thực đơn vừa đổi…", đơn trùng, đơn đã hủy giữ tới lần gửi hoặc hủy thành công kế tiếp.
- **Câu chữ cố định:**
  - `MENU_CHANGED`: "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại." (FR-04)
  - Đơn trùng đã hủy: "Đơn này đã bị hủy – bấm Xác nhận đơn để tạo đơn mới." Giữ giỏ, lần sau dùng `id` mới (v3.1).
  - Món đã ẩn trong giỏ: "Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại" (FR-01).
  - Mất mạng: "Mất mạng – chưa gửi được đơn".
- **Thế giới "Bao diêm quán bar":**
  - Token sẵn có: `bg`, `raised`, `line`, `edge`, `ink`, `ink-muted`, `ember`, `ember-ink`, `warn`, `danger`.
  - Một họ chữ Archivo (`font-display` = hẹp đậm); một hệ đường kẻ 1px.
  - Không quầng sáng, vệt sáng, nhiễu hạt hay bóng đổ. Logo PNG in phẳng (bỏ `halo`).
- **Chuyển động:** 150–250ms (riêng flare 400ms). Mọi chuyển động tắt hoặc chỉ còn đổi độ mờ khi `prefers-reduced-motion`.
- **Vùng chạm:** ≥ 48px; nút chính màn order ≥ 56px (NFR-02). Số `tabular-nums`. Icon `lucide-react` có `aria-hidden` hoặc `aria-label`.
- **Thuật ngữ:** Thực đơn, Món, Dòng đơn, Giỏ đơn, Số món, Tạm tính, Giảm giá, Thành tiền, Chỗ ngồi. Không dùng "cốc", "mang về", "giỏ hàng".

## Review Focus

1. **Món bị ẩn hoặc đổi giá trong lúc giỏ đang có món đó** (realtime): dòng phải gạch ngang và khóa Xác nhận, hoặc cập nhật giá và nổi bật 3 giây. Không được gửi giá cũ. → Task 4, test "menu đổi khi giỏ đang có món".
2. **Gửi lại sau lỗi mạng khi nhân viên đã sửa giỏ:** vẫn dùng cùng `id` (FR-04), để không thành hai đơn nếu lần đầu đã ghi. → Task 4, test "lỗi mạng giữ giỏ, bấm lại cùng id".
3. **Ô số nhập tay:** "", "0", "150", "abc" không được làm hỏng giỏ. → Task 2, test `parseQuantityInput`; Task 4, test dòng đơn.
4. **Tổng tiền lớn:** 30 dòng × 99 × giá cao, Thành tiền tới 1.000.000.000đ phải vừa thanh giỏ ở 360px. → Task 4 ảnh chụp ở Task 5; chữ Thành tiền dùng `truncate` và `min-w-0`.
5. **Màn rộng:** phiếu đơn luôn hiện, không có thanh giỏ đơn hay tấm giỏ đơn. → Task 4, test "màn rộng".

## Lưu ý cho người thực hiện

- **Bước nào dùng database:** Docker Desktop phải chạy. Dùng `npx supabase db reset && npx supabase test db`; reset xong tạo lại tài khoản thử theo README.
- **Không chạy `next build`** khi `npm run dev` đang chạy.
- **Ngoài phạm vi đợt này (đợt 4):** Lịch sử đơn hàng, CSV, Tổng quan đã xong ở đợt 2b. Riêng `NewOrderNotice` sửa tối thiểu ở Task 1, vì nó đọc cột `is_takeaway` sắp bị bỏ.
- **Polyfill test:** `tests/setup.ts` đã có polyfill `<dialog>`; Task 3 thêm `matchMedia`.

---

### Task 1: Database bỏ Mang về; `create_order` 4 tham số

**Files:**
- Create: `supabase/migrations/20261005000400_no_takeaway.sql`
- Modify: `supabase/tests/01_schema.test.sql`, `03_create_order.test.sql`, `04_cancel_list.test.sql`, `05_owner_reports.test.sql`, `07_close_hour_stats.test.sql`
- Modify: `src/components/admin/NewOrderNotice.tsx`

**Interfaces:**
- Produces: `public.create_order(p_id uuid, p_seat_id uuid, p_discount_percent integer, p_lines jsonb) returns jsonb`. Cùng kết quả và mã lỗi như trước, bỏ `INVALID_SEAT`; `SEAT_REQUIRED` khi `p_seat_id` null. Cột `orders.is_takeaway` không còn; `orders.seat_id` là `not null`.

- [ ] **Step 1: Sửa test theo cấu trúc mới (thất bại trước)**

Quy tắc áp cho mọi test SQL:
- Mọi lời gọi `public.create_order(<id>, <seat>, <takeaway>, <discount>, <lines>)` bỏ tham số thứ ba.
  - `create_order(X, null, true, D, L)` thành `create_order(X, '00000000-0000-0000-0000-0000000000c9', D, L)`.
  - `create_order(X, '…c9', false, D, L)` thành `create_order(X, '…c9', D, L)`.
- Mọi khối `insert into public.orders (…, is_takeaway, …) values (…, true, …)`: thay cột `is_takeaway` bằng `seat_id` và giá trị `true` bằng `'00000000-0000-0000-0000-0000000000c1'`. Thêm dòng sau vào đầu file (sau phần `auth.sessions`), nếu file chưa có chỗ ngồi `c1`:

```sql
insert into public.seats (id, name, kind) values ('00000000-0000-0000-0000-0000000000c1', 'Bàn 1', 'table');
```

Riêng `supabase/tests/02_roles_pin.test.sql` đã có `c1`; không chèn thêm.

Trong `supabase/tests/01_schema.test.sql`:
- Đổi `select plan(11);` thành `select plan(13);`.
- Thêm sau dòng `hasnt_column … current_price …`:

```sql
select hasnt_column('public', 'orders', 'is_takeaway', 'bỏ Mang về (SRS R38)');
select col_not_null('public', 'orders', 'seat_id', 'mọi đơn bắt buộc có chỗ ngồi');
```

- Ở khối `throws_ok` cuối (anon insert), đổi danh sách cột thành `(id, item_count, subtotal_amount, total_amount, seat_id, created_by, business_date)` và giá trị `(gen_random_uuid(), 1, 1000, 1000, gen_random_uuid(), gen_random_uuid(), current_date)`.

Trong `supabase/tests/03_create_order.test.sql`, ngoài quy tắc chung:
- Đổi test `'mang về có seat_name = Mang về'` thành:

```sql
select is((select seat_name from public.orders where id = '00000000-0000-0000-0000-000000000002'), 'Quầy 9', 'lưu tên chỗ ngồi của đơn');
```

- Thay test `INVALID_SEAT` (`'không được vừa mang về vừa có chỗ ngồi'`) bằng:

```sql
select hasnt_function('public', 'create_order', array['uuid', 'uuid', 'boolean', 'integer', 'jsonb'], 'bỏ create_order có tham số Mang về');
```

- Test `SEAT_REQUIRED` gọi `public.create_order(gen_random_uuid(), null, 0, …)` với cùng dòng đơn, kỳ vọng `'SEAT_REQUIRED'`, mô tả `'phải chọn chỗ ngồi'`.
- `plan(45)` giữ nguyên, vì số test không đổi.

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx supabase db reset && npx supabase test db`
Expected: 01, 03, 04, 05, 07 FAIL (hàm 4 tham số chưa có, `is_takeaway` còn tồn tại, cột `seat_id` vẫn nullable). 02, 08 PASS.

- [ ] **Step 3: Viết migration**

Tạo `supabase/migrations/20261005000400_no_takeaway.sql`. Hàm `create_order` chép từ `20261005000300_order_fixes.sql`, chỉ sửa phần chỗ ngồi:

```sql
-- SRS v3.2 R38: bỏ Mang về. Mọi đơn bắt buộc có chỗ ngồi.
-- Trên prod chạy ngay sau 20261005000200 (đã xóa dữ liệu thử), nên bảng orders đang trống.
alter table public.orders drop constraint orders_takeaway_xor_seat;
alter table public.orders drop constraint orders_seat_required;
alter table public.orders drop column is_takeaway;
alter table public.orders alter column seat_id set not null;

drop function public.create_order(uuid, uuid, boolean, integer, jsonb);
```

Ngay sau khối trên, dán toàn bộ hàm `create or replace function public.create_order(…)` từ `20261005000300_order_fixes.sql` rồi sửa:
- Chữ ký thành `create function public.create_order(p_id uuid, p_seat_id uuid, p_discount_percent integer, p_lines jsonb)`.
- Bỏ khai báo `v_takeaway boolean := coalesce(p_is_takeaway, false);`.
- Thay khối kiểm tra chỗ ngồi (từ `if v_takeaway and p_seat_id is not null then` tới `end if;` của nhánh `SEAT_REQUIRED`) bằng:

```sql
  if p_seat_id is null then
    raise exception 'SEAT_REQUIRED';
  end if;
  select name into v_seat_name from public.seats where id = p_seat_id and not is_archived;
  if not found then
    raise exception 'SEAT_NOT_FOUND';
  end if;
```

- Trong câu `insert into public.orders (…)`, bỏ cột `is_takeaway` và giá trị `v_takeaway`.

Cuối file:

```sql
revoke execute on function public.create_order(uuid, uuid, integer, jsonb) from public, anon;
grant execute on function public.create_order(uuid, uuid, integer, jsonb) to authenticated;
```

- [ ] **Step 4: Sửa `NewOrderNotice` cho khớp cột mới**

Trong `src/components/admin/NewOrderNotice.tsx`:
- Kiểu `NewOrder` thành `{ id: string; item_count: number; total_amount: number; seat_name: string }`.
- `.select("id, quantity, total_amount, seat_name, is_takeaway")` thành `.select("id, item_count, total_amount, seat_name")`.
- Dòng nội dung thành: `Đơn mới: {order.seat_name} · {order.item_count} món · {formatVnd(order.total_amount)}` (SRS FR-06a v3.2).

- [ ] **Step 5: Chạy test, xác nhận đạt**

Run: `npx supabase db reset && npx supabase test db && npx tsc --noEmit`
Expected: tất cả PASS; `tsc` không lỗi.

- [ ] **Step 6: Commit**

```bash
git add supabase/ src/components/admin/NewOrderNotice.tsx
git commit -m "feat(db): bỏ Mang về, create_order 4 tham số, seat_id bắt buộc (SRS v3.2 R38)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Hàm thuần giỏ đơn

**Files:**
- Create: `src/lib/order/cart.ts`
- Test: `tests/unit/order/cart.test.ts`

**Interfaces:**
- Produces (`@/lib/order/cart`):
  - `type MenuItem = { id: string; name: string; price: number; sort_order: number; is_archived: boolean }`
  - `type MenuChange = Pick<MenuItem, "id" | "name" | "price" | "is_archived">`
  - `type CartLine = { menuItemId: string; name: string; price: number; quantity: number; archived: boolean; priceChanged: boolean }`
  - `MAX_QUANTITY = 99`, `MAX_LINES = 30`
  - `addItem(cart, item: MenuItem): CartLine[]`
  - `setQuantity(cart, id, q: number): CartLine[]`
  - `decrement(cart, id): CartLine[]`
  - `removeLine(cart, id): CartLine[]`
  - `applyMenu(cart, menu: MenuChange[]): CartLine[]`
  - `clearPriceFlags(cart): CartLine[]`
  - `subtotal(cart): number`
  - `itemCount(cart): number`
  - `discountAmount(subtotal: number, percent: number): number`
  - `parseQuantityInput(raw: string): number | null`
  - `parseDiscountInput(raw: string): number | null`
  - `summarize(lines: { item_name: string; quantity: number }[] | null): string`
  - `toPayload(cart): { menuItemId: string; quantity: number; clientPrice: number }[]`

- [ ] **Step 1: Viết test thất bại**

Tạo `tests/unit/order/cart.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  addItem,
  applyMenu,
  clearPriceFlags,
  decrement,
  discountAmount,
  itemCount,
  MAX_LINES,
  parseDiscountInput,
  parseQuantityInput,
  removeLine,
  setQuantity,
  subtotal,
  summarize,
  toPayload,
  type MenuItem,
} from "@/lib/order/cart";

const classic: MenuItem = { id: "m1", name: "Classic", price: 190000, sort_order: 1, is_archived: false };
const neat: MenuItem = { id: "m2", name: "Neat", price: 100000, sort_order: 2, is_archived: false };

describe("giỏ đơn", () => {
  it("chạm món là +1; món đã có thì cộng dồn", () => {
    const c = addItem(addItem(addItem([], classic), classic), neat);
    expect(c.map((l) => [l.menuItemId, l.quantity])).toEqual([["m1", 2], ["m2", 1]]);
    expect(itemCount(c)).toBe(3);
    expect(subtotal(c)).toBe(480000);
  });

  it("số lượng tối đa 99, tối đa 30 dòng", () => {
    let c = setQuantity(addItem([], classic), "m1", 99);
    expect(addItem(c, classic)[0].quantity).toBe(99);
    c = [];
    for (let i = 0; i < MAX_LINES + 2; i++) c = addItem(c, { ...classic, id: `x${i}` });
    expect(c).toHaveLength(MAX_LINES);
  });

  it("đặt số lượng: ngoài 1–99 hoặc không phải số nguyên thì giữ nguyên", () => {
    const c = addItem([], classic);
    expect(setQuantity(c, "m1", 0)).toBe(c);
    expect(setQuantity(c, "m1", 1.5)).toBe(c);
    expect(setQuantity(c, "m1", 150)[0].quantity).toBe(99);
  });

  it("bớt khi còn 1 thì xóa dòng; xóa dòng", () => {
    const c = addItem(addItem([], classic), neat);
    expect(decrement(c, "m1").map((l) => l.menuItemId)).toEqual(["m2"]);
    expect(removeLine(c, "m2").map((l) => l.menuItemId)).toEqual(["m1"]);
  });

  it("áp thực đơn mới: đổi giá thì đánh dấu, món ẩn hoặc mất thì gạch, hiện lại thì bỏ gạch", () => {
    const c = addItem(addItem([], classic), neat);
    const next = applyMenu(c, [
      { id: "m1", name: "Classic", price: 200000, is_archived: false },
      { id: "m2", name: "Neat", price: 100000, is_archived: true },
    ]);
    expect(next[0]).toMatchObject({ price: 200000, priceChanged: true, archived: false });
    expect(next[1]).toMatchObject({ archived: true, priceChanged: false });
    expect(applyMenu(next, [{ id: "m1", name: "Classic", price: 200000, is_archived: false }])[1].archived).toBe(true);
    expect(clearPriceFlags(next)[0].priceChanged).toBe(false);
    expect(applyMenu(next, [neat])[1].archived).toBe(false);
  });

  it("số tiền giảm cùng công thức với server: làm tròn xuống tới 1.000đ", () => {
    expect(discountAmount(480000, 10)).toBe(48000);
    expect(discountAmount(190000, 15)).toBe(28000);
    expect(discountAmount(100000, 100)).toBe(100000);
    expect(discountAmount(1500, 100)).toBe(1000);
    expect(discountAmount(75000, 10)).toBe(7000);
    expect(discountAmount(480000, 0)).toBe(0);
  });

  it("đọc ô số lượng và ô giảm giá", () => {
    expect(parseQuantityInput("5")).toBe(5);
    expect(parseQuantityInput(" 150 ")).toBe(99);
    expect(parseQuantityInput("0")).toBeNull();
    expect(parseQuantityInput("")).toBeNull();
    expect(parseQuantityInput("abc")).toBeNull();
    expect(parseQuantityInput("1.5")).toBeNull();
    expect(parseDiscountInput("10")).toBe(10);
    expect(parseDiscountInput("7%")).toBe(7);
    expect(parseDiscountInput("")).toBe(0);
    expect(parseDiscountInput("101")).toBeNull();
    expect(parseDiscountInput("-5")).toBeNull();
    expect(parseDiscountInput("7.5")).toBeNull();
  });

  it("tóm tắt dòng đơn và dữ liệu gửi server", () => {
    expect(summarize([{ item_name: "Classic", quantity: 2 }, { item_name: "Neat", quantity: 1 }])).toBe("2 Classic, 1 Neat");
    expect(summarize(null)).toBe("");
    expect(toPayload(addItem([], classic))).toEqual([{ menuItemId: "m1", quantity: 1, clientPrice: 190000 }]);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/order/cart.test.ts`
Expected: FAIL, không tìm thấy `@/lib/order/cart`.

- [ ] **Step 3: Viết code**

Tạo `src/lib/order/cart.ts`:

```ts
// SRS FR-01–FR-03: giỏ đơn ở trình duyệt. Số tiền ở đây chỉ để hiển thị; số được lưu do server tính (FR-04).
export type MenuItem = { id: string; name: string; price: number; sort_order: number; is_archived: boolean };
export type MenuChange = Pick<MenuItem, "id" | "name" | "price" | "is_archived">;
export type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  archived: boolean; // món đã ngừng bán: dòng gạch, khóa Xác nhận
  priceChanged: boolean; // giá vừa đổi: nổi bật khoảng 3 giây
};

export const MAX_QUANTITY = 99;
export const MAX_LINES = 30;

export function setQuantity(cart: CartLine[], id: string, quantity: number): CartLine[] {
  if (!Number.isInteger(quantity) || quantity < 1) return cart;
  const q = Math.min(quantity, MAX_QUANTITY);
  return cart.map((l) => (l.menuItemId === id ? { ...l, quantity: q } : l));
}

export function addItem(cart: CartLine[], item: MenuItem): CartLine[] {
  const line = cart.find((l) => l.menuItemId === item.id);
  if (line) return setQuantity(cart, item.id, line.quantity + 1);
  if (cart.length >= MAX_LINES) return cart;
  return [
    ...cart,
    { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, archived: false, priceChanged: false },
  ];
}

export function removeLine(cart: CartLine[], id: string): CartLine[] {
  return cart.filter((l) => l.menuItemId !== id);
}

export function decrement(cart: CartLine[], id: string): CartLine[] {
  const line = cart.find((l) => l.menuItemId === id);
  if (!line) return cart;
  return line.quantity <= 1 ? removeLine(cart, id) : setQuantity(cart, id, line.quantity - 1);
}

// Thực đơn mới (realtime hoặc MENU_CHANGED): cập nhật tên và giá, gạch món đã ngừng bán
export function applyMenu(cart: CartLine[], menu: MenuChange[]): CartLine[] {
  const byId = new Map(menu.map((m) => [m.id, m]));
  return cart.map((l) => {
    const m = byId.get(l.menuItemId);
    if (!m || m.is_archived) return l.archived ? l : { ...l, archived: true };
    if (m.price === l.price && m.name === l.name && !l.archived) return l;
    return { ...l, name: m.name, price: m.price, archived: false, priceChanged: l.priceChanged || m.price !== l.price };
  });
}

export function clearPriceFlags(cart: CartLine[]): CartLine[] {
  return cart.some((l) => l.priceChanged) ? cart.map((l) => ({ ...l, priceChanged: false })) : cart;
}

export const subtotal = (cart: CartLine[]) => cart.reduce((s, l) => s + l.price * l.quantity, 0);
export const itemCount = (cart: CartLine[]) => cart.reduce((s, l) => s + l.quantity, 0);

// Cùng công thức với public.discount_amount ở server: làm tròn xuống tới 1.000đ (SRS FR-03, R34)
export const discountAmount = (sub: number, percent: number) => Math.floor((sub * percent) / 100000) * 1000;

export function parseQuantityInput(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d{1,4}$/.test(t)) return null;
  const v = parseInt(t, 10);
  return v < 1 ? null : Math.min(v, MAX_QUANTITY);
}

// Ô trống nghĩa là không giảm giá
export function parseDiscountInput(raw: string): number | null {
  const t = raw.trim().replace(/%$/, "").trim();
  if (t === "") return 0;
  if (!/^\d{1,3}$/.test(t)) return null;
  const v = parseInt(t, 10);
  return v <= 100 ? v : null;
}

export function summarize(lines: { item_name: string; quantity: number }[] | null): string {
  return (lines ?? []).map((l) => `${l.quantity} ${l.item_name}`).join(", ");
}

export function toPayload(cart: CartLine[]) {
  return cart.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity, clientPrice: l.price }));
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- tests/unit/order/cart.test.ts`
Expected: PASS 8/8.

- [ ] **Step 5: Commit**

```bash
git add src/lib/order/cart.ts tests/unit/order/cart.test.ts
git commit -m "feat(order): hàm thuần giỏ đơn, giảm giá cùng công thức server (SRS v3.2 FR-01–FR-03)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: API, thực đơn realtime, màn rộng

**Files:**
- Modify: `src/lib/api.ts` (thay toàn bộ)
- Create: `src/hooks/useMenu.ts`, `src/hooks/useWide.ts`
- Modify: `tests/setup.ts` (polyfill `matchMedia`)
- Test: `tests/unit/api.test.ts` (thay toàn bộ), `tests/unit/order/useMenu.test.tsx` (mới)

**Interfaces:**
- Consumes: `MenuItem`, `MenuChange` từ Task 2.
- Produces (`@/lib/api`):
  - `type OrderLineInput = { menuItemId: string; quantity: number; clientPrice: number }`
  - `type CreateOrderInput = { id: string; seatId: string; discountPercent: number; lines: OrderLineInput[] }`
  - `type CreatedOrder = { id: string; item_count: number; subtotal_amount: number; discount_percent: number; discount_amount: number; total_amount: number; seat_name: string; created_at: string; business_date: string; duplicate: boolean; status: "paid" | "cancelled" }`
  - `type OrderLine = { item_name: string; unit_price: number; quantity: number; line_amount: number }`
  - `type MyOrder = { id: string; item_count: number; subtotal_amount: number; discount_percent: number; discount_amount: number; total_amount: number; seat_name: string; status: "paid" | "cancelled"; created_at: string; lines: OrderLine[] | null }`
  - `ActiveSeat` và `StaffApi` giữ tên hàm cũ.
  - `class RpcError { code: string; details?: string }`
  - `menuFromError(e: unknown): MenuChange[] | null`
- Produces (hook):
  - `useMenu(): { menu: MenuItem[] | null; failed: boolean }`
  - `useWide(): boolean` (true khi `(min-width: 768px)`)

- [ ] **Step 1: Viết test thất bại**

Thay toàn bộ `tests/unit/api.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createStaffApi, menuFromError, NetworkError, RpcError, type RpcClient } from "@/lib/api";

function clientReturning(result: { data: unknown; error: { message: string; code?: string; details?: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as RpcClient, rpc };
}

describe("createStaffApi", () => {
  it("createOrder ánh xạ đúng tham số RPC 4 tham số", async () => {
    const { client, rpc } = clientReturning({ data: { id: "o1" }, error: null });
    await createStaffApi(() => client).createOrder({
      id: "o1",
      seatId: "s1",
      discountPercent: 10,
      lines: [{ menuItemId: "m1", quantity: 2, clientPrice: 190000 }],
    });
    expect(rpc).toHaveBeenCalledWith("create_order", {
      p_id: "o1",
      p_seat_id: "s1",
      p_discount_percent: 10,
      p_lines: [{ menu_item_id: "m1", quantity: 2, client_price: 190000 }],
    });
  });

  it("lỗi không có mã là lỗi mạng; lỗi có mã giữ cả details", async () => {
    const net = clientReturning({ data: null, error: { message: "fetch failed", code: "" } });
    await expect(createStaffApi(() => net.client).listActiveSeats()).rejects.toBeInstanceOf(NetworkError);
    const rpc = clientReturning({ data: null, error: { message: "MENU_CHANGED", code: "P0001", details: "[]" } });
    const err = await createStaffApi(() => rpc.client).listActiveSeats().catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.code).toBe("MENU_CHANGED");
    expect(err.details).toBe("[]");
  });

  it("client ném lỗi thì là lỗi mạng", async () => {
    const client = { rpc: vi.fn().mockRejectedValue(new Error("offline")) } as unknown as RpcClient;
    await expect(createStaffApi(() => client).cancelOrder("o1")).rejects.toBeInstanceOf(NetworkError);
  });

  it("listOrdersByIds rỗng thì không gọi server", async () => {
    const { client, rpc } = clientReturning({ data: [], error: null });
    expect(await createStaffApi(() => client).listOrdersByIds([])).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("menuFromError", () => {
  it("đọc thực đơn từ details của MENU_CHANGED", () => {
    const e = new RpcError("MENU_CHANGED", JSON.stringify([{ id: "m1", name: "Classic", price: 200000, is_archived: false }]));
    expect(menuFromError(e)).toEqual([{ id: "m1", name: "Classic", price: 200000, is_archived: false }]);
  });
  it("không phải MENU_CHANGED hoặc details hỏng thì null", () => {
    expect(menuFromError(new RpcError("SEAT_REQUIRED"))).toBeNull();
    expect(menuFromError(new RpcError("MENU_CHANGED", "{oops"))).toBeNull();
    expect(menuFromError(new Error("x"))).toBeNull();
  });
});
```

Tạo `tests/unit/order/useMenu.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useMenu } from "@/hooks/useMenu";

const sb = vi.hoisted(() => ({
  result: { data: [{ id: "m1", name: "Classic", price: 190000, sort_order: 1, is_archived: false }], error: null } as {
    data: unknown;
    error: unknown;
  },
  onChange: null as null | (() => void),
  removeChannel: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  getBrowserSupabase: () => ({
    from: () => ({ select: () => ({ order: () => ({ order: () => Promise.resolve(sb.result) }) }) }),
    channel: () => {
      const ch = {
        on: (_e: string, _f: unknown, cb: () => void) => {
          sb.onChange = cb;
          return ch;
        },
        subscribe: () => ch,
      };
      return ch;
    },
    removeChannel: sb.removeChannel,
  }),
}));

describe("useMenu", () => {
  it("đọc thực đơn, đọc lại khi có thay đổi realtime, gỡ kênh khi rời trang", async () => {
    const { result, unmount } = renderHook(() => useMenu());
    await waitFor(() => expect(result.current.menu?.[0].price).toBe(190000));
    sb.result = { data: [{ id: "m1", name: "Classic", price: 200000, sort_order: 1, is_archived: false }], error: null };
    await act(async () => sb.onChange?.());
    await waitFor(() => expect(result.current.menu?.[0].price).toBe(200000));
    unmount();
    expect(sb.removeChannel).toHaveBeenCalled();
  });

  it("không đọc được thì báo failed", async () => {
    sb.result = { data: null, error: { message: "x" } };
    const { result } = renderHook(() => useMenu());
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.menu).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/api.test.ts tests/unit/order/useMenu.test.tsx`
Expected: FAIL. Thiếu `menuFromError`, ánh xạ tham số cũ, chưa có `@/hooks/useMenu`.

- [ ] **Step 3: Viết code**

Thay toàn bộ `src/lib/api.ts`:

```ts
import type { MenuChange } from "@/lib/order/cart";

// SRS FR-04: dữ liệu gửi server. Server quyết định mọi số tiền; clientPrice chỉ để server phát hiện thực đơn đã đổi.
export type OrderLineInput = { menuItemId: string; quantity: number; clientPrice: number };
export type CreateOrderInput = { id: string; seatId: string; discountPercent: number; lines: OrderLineInput[] };
export type CreatedOrder = {
  id: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  seat_name: string;
  created_at: string;
  business_date: string;
  duplicate: boolean;
  status: "paid" | "cancelled";
};
export type OrderLine = { item_name: string; unit_price: number; quantity: number; line_amount: number };
export type MyOrder = {
  id: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  seat_name: string;
  status: "paid" | "cancelled";
  created_at: string;
  lines: OrderLine[] | null;
};
export type ActiveSeat = { id: string; name: string; kind: "table" | "counter" };
export interface StaffApi {
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  cancelOrder(orderId: string): Promise<void>;
  listOrdersByIds(ids: string[]): Promise<MyOrder[]>;
  listActiveSeats(): Promise<ActiveSeat[]>;
}

export type RpcClient = {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<{ data: unknown; error: { message: string; code?: string; details?: string } | null }>;
};

export class NetworkError extends Error {
  constructor(message = "NETWORK") {
    super(message);
    this.name = "NetworkError";
  }
}

export class RpcError extends Error {
  constructor(
    public code: string,
    public details?: string,
  ) {
    super(code);
    this.name = "RpcError";
  }
}

async function call<T>(client: RpcClient, fn: string, args: Record<string, unknown> = {}): Promise<T> {
  let result: Awaited<ReturnType<RpcClient["rpc"]>>;
  try {
    result = await client.rpc(fn, args);
  } catch (e) {
    throw new NetworkError(String(e));
  }
  const { data, error } = result;
  if (error) {
    // supabase-js trả về code rỗng khi fetch thất bại; lỗi do Postgres raise luôn có SQLSTATE
    if (!error.code) throw new NetworkError(error.message);
    throw new RpcError(error.message, error.details);
  }
  return data as T;
}

// MENU_CHANGED mang thực đơn hiện hành trong DETAIL (migration 20261005000200), để giỏ đơn cập nhật ngay
export function menuFromError(e: unknown): MenuChange[] | null {
  if (!(e instanceof RpcError) || e.code !== "MENU_CHANGED" || !e.details) return null;
  try {
    const v = JSON.parse(e.details);
    return Array.isArray(v)
      ? v.map((m) => ({ id: m.id, name: m.name, price: m.price, is_archived: m.is_archived }))
      : null;
  } catch {
    return null;
  }
}

export function createStaffApi(getClient: () => RpcClient): StaffApi {
  return {
    createOrder: (input) =>
      call(getClient(), "create_order", {
        p_id: input.id,
        p_seat_id: input.seatId,
        p_discount_percent: input.discountPercent,
        p_lines: input.lines.map((l) => ({
          menu_item_id: l.menuItemId,
          quantity: l.quantity,
          client_price: l.clientPrice,
        })),
      }),
    cancelOrder: async (orderId) => {
      await call(getClient(), "cancel_order", { p_order_id: orderId });
    },
    listOrdersByIds: async (ids) => (ids.length === 0 ? [] : call(getClient(), "list_orders_by_ids", { p_ids: ids })),
    listActiveSeats: () => call(getClient(), "list_active_seats"),
  };
}
```

Tạo `src/hooks/useMenu.ts`:

```ts
"use client";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/order/cart";
import { getBrowserSupabase } from "@/lib/supabase/client";

// SRS FR-01: thực đơn cập nhật realtime. Nhân viên đọc được cả món đã ẩn (RLS), để giỏ đơn biết món vừa ngừng bán.
// ponytail: mỗi thay đổi thì đọc lại cả thực đơn (vài chục dòng) thay vì vá từng dòng
export function useMenu(): { menu: MenuItem[] | null; failed: boolean } {
  const [menu, setMenu] = useState<MenuItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const client = getBrowserSupabase();
    let active = true;
    const load = async () => {
      const { data, error } = await client
        .from("menu_items")
        .select("id, name, price, sort_order, is_archived")
        .order("sort_order")
        .order("name");
      if (!active) return;
      if (error || !data) return setFailed(true);
      setFailed(false);
      setMenu(data as MenuItem[]);
    };
    void load();
    const channel = client
      .channel("menu-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => void load())
      .subscribe();
    // iOS ngắt kết nối realtime khi app chạy nền, nên đọc lại khi quay lại
    const refetch = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("online", refetch);
    document.addEventListener("visibilitychange", refetch);
    return () => {
      active = false;
      window.removeEventListener("online", refetch);
      document.removeEventListener("visibilitychange", refetch);
      void client.removeChannel(channel);
    };
  }, []);

  return { menu, failed };
}
```

Tạo `src/hooks/useWide.ts`:

```ts
"use client";
import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

// Màn rộng (tablet, điện thoại xoay ngang): phiếu đơn luôn hiện bên phải thay cho tấm giỏ đơn
export function useWide(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
```

Thêm vào cuối `tests/setup.ts`:

```ts

// jsdom chưa có matchMedia: mặc định là màn hẹp (điện thoại); test màn rộng tự mock lại
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- tests/unit/api.test.ts tests/unit/order/useMenu.test.tsx`
Expected: PASS. Không chạy `tsc` ở bước này, vì `OrderScreen` cũ còn dùng kiểu cũ; Task 4 thay nó.

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.ts src/hooks/useMenu.ts src/hooks/useWide.ts tests/setup.ts tests/unit/api.test.ts tests/unit/order/useMenu.test.tsx
git commit -m "feat(order): API create_order mới, thực đơn realtime, nhận biết màn rộng (SRS v3.2 FR-01, FR-04)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Màn order mới

**Files:**
- Create: `src/components/order/MenuBoard.tsx`, `CartBar.tsx`, `CartPanel.tsx`, `CartSheet.tsx`
- Modify (thay toàn bộ): `src/components/order/OrderScreen.tsx`, `SeatPicker.tsx`, `ConfirmBar.tsx`, `RecentOrders.tsx`, `src/app/order/page.tsx`
- Modify: `src/app/globals.css` (`.striker` có `position: relative; overflow: hidden`, thêm `.striker-flare`, `.sheet-in`)
- Delete: `src/components/order/QuantityPad.tsx`, `PriceBanner.tsx`, `src/lib/order/quantity.ts`, `src/hooks/useCurrentPrice.ts`, `tests/unit/order/QuantityPad.test.tsx`, `PriceBanner.test.tsx`, `quantity.test.ts`
- Test: `tests/unit/order/OrderScreen.test.tsx` (thay toàn bộ)

**Interfaces:**
- Consumes: Task 2 (cart), Task 3 (`StaffApi`, `menuFromError`, `NetworkError`, `RpcError`, `useMenu`, `useWide`), `getMyOrderIds`, `rememberOrder` (`@/lib/order/myOrders`), `buzz` (`@/lib/haptics`), `formatVnd`, `formatVnTime`, `useTwoStep` (`@/lib/admin/useTwoStep`).
- Produces: `OrderScreenProps = { api: StaffApi; menu: MenuItem[] | null; menuFailed?: boolean; online: boolean; onUnauthorized: () => void; newId?: () => string; now?: () => Date; ownerHome?: string }`.

- [ ] **Step 1: Viết test thất bại**

Thay toàn bộ `tests/unit/order/OrderScreen.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderScreen, type OrderScreenProps } from "@/components/order/OrderScreen";
import { NetworkError, RpcError, type CreateOrderInput, type CreatedOrder, type StaffApi } from "@/lib/api";
import { discountAmount, type MenuItem } from "@/lib/order/cart";
import { getMyOrderIds } from "@/lib/order/myOrders";

const NOW = new Date("2026-10-05T14:00:00Z");
const MENU: MenuItem[] = [
  { id: "m1", name: "Classic", price: 190000, sort_order: 1, is_archived: false },
  { id: "m2", name: "Neat", price: 100000, sort_order: 2, is_archived: false },
  { id: "m3", name: "Cũ", price: 50000, sort_order: 3, is_archived: true },
];

const created = (i: CreateOrderInput, over: Partial<CreatedOrder> = {}): CreatedOrder => {
  const sub = i.lines.reduce((s, l) => s + l.quantity * l.clientPrice, 0);
  const off = discountAmount(sub, i.discountPercent);
  return {
    id: i.id,
    item_count: i.lines.reduce((s, l) => s + l.quantity, 0),
    subtotal_amount: sub,
    discount_percent: i.discountPercent,
    discount_amount: off,
    total_amount: sub - off,
    seat_name: "Quầy 1",
    created_at: NOW.toISOString(),
    business_date: "2026-10-05",
    duplicate: false,
    status: "paid",
    ...over,
  };
};

function setup(overrides: Partial<OrderScreenProps> = {}, apiOverrides: Partial<StaffApi> = {}) {
  const api: StaffApi = {
    createOrder: vi.fn(async (i: CreateOrderInput) => created(i)),
    cancelOrder: vi.fn(async () => {}),
    listOrdersByIds: vi.fn(async () => []),
    listActiveSeats: vi.fn(async () => [
      { id: "s1", name: "Quầy 1", kind: "counter" as const },
      { id: "t1", name: "Bàn 1", kind: "table" as const },
    ]),
    ...apiOverrides,
  };
  let n = 0;
  const props: OrderScreenProps = {
    api,
    menu: MENU,
    online: true,
    onUnauthorized: vi.fn(),
    newId: () => `order-${++n}`,
    now: () => NOW,
    ...overrides,
  };
  const user = userEvent.setup();
  const utils = render(<OrderScreen {...props} />);
  return { api, props, user, ...utils };
}

const row = (name: RegExp) => screen.getByRole("button", { name });
async function openCart(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Giỏ đơn" }));
  return screen.getByRole("dialog", { name: "Giỏ đơn" });
}

describe("OrderScreen", () => {
  it("chạm món là +1; thanh giỏ đơn hiện số món và thành tiền", async () => {
    const { user } = setup();
    expect(screen.getByText("Chạm món để thêm")).toBeInTheDocument();
    await user.click(row(/^Classic/));
    await user.click(row(/^Classic/));
    await user.click(row(/^Neat/));
    expect(screen.getByText("3 món")).toBeInTheDocument();
    expect(screen.getByTestId("bar-total")).toHaveTextContent("480.000đ");
    expect(row(/^Classic/)).toHaveAccessibleName(/đang có 2/);
  });

  it("món đã ẩn không có trên bảng giá", () => {
    setup();
    expect(screen.queryByRole("button", { name: /^Cũ/ })).toBeNull();
  });

  it("gửi đơn với chỗ ngồi và giảm giá, rồi reset và nhớ đơn", async () => {
    const { api, user } = setup();
    await user.click(row(/^Classic/));
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "10%" }));
    expect(within(cart).getByTestId("total")).toHaveTextContent("342.000đ");
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    expect(api.createOrder).toHaveBeenCalledWith({
      id: "order-1",
      seatId: "s1",
      discountPercent: 10,
      lines: [{ menuItemId: "m1", quantity: 2, clientPrice: 190000 }],
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Đã tạo đơn 2 món – 342.000đ");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getMyOrderIds()).toEqual(["order-1"]);
  });

  it("chưa chọn chỗ ngồi thì khóa Xác nhận và ghi lý do", async () => {
    const { user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    expect(within(cart).getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
    expect(within(cart).getAllByText("Chọn chỗ ngồi").length).toBeGreaterThan(0);
    expect(within(cart).getByText("Chưa chọn chỗ ngồi")).toBeInTheDocument();
  });

  it("dòng đơn: − ở 1 thì xóa dòng; ô số 150 thành 99; ô số 0 giữ số cũ", async () => {
    const { user } = setup();
    await user.click(row(/^Classic/));
    await user.click(row(/^Neat/));
    const cart = await openCart(user);
    const qty = within(cart).getByLabelText("Số lượng Classic");
    await user.clear(qty);
    await user.type(qty, "150");
    fireEvent.blur(qty);
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("99");
    await user.clear(within(cart).getByLabelText("Số lượng Classic"));
    await user.type(within(cart).getByLabelText("Số lượng Classic"), "0");
    fireEvent.blur(within(cart).getByLabelText("Số lượng Classic"));
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("99");
    await user.click(within(cart).getByRole("button", { name: "Bớt 1 Neat" }));
    expect(within(cart).queryByLabelText("Số lượng Neat")).toBeNull();
  });

  it("Xóa hết cần bấm hai lần", async () => {
    const { user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(within(cart).getByRole("button", { name: "Xóa hết" }));
    expect(within(cart).getByLabelText("Số lượng Classic")).toBeInTheDocument();
    await user.click(within(cart).getByRole("button", { name: "Chắc chắn xóa hết?" }));
    expect(within(cart).queryByLabelText("Số lượng Classic")).toBeNull();
  });

  it("giảm giá nhập tay: 7% được nhận, 120% bị bỏ qua", async () => {
    const { api, user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    const pct = within(cart).getByLabelText("Giảm giá (%)");
    await user.type(pct, "120");
    fireEvent.blur(pct);
    expect(within(cart).queryByText(/^Giảm /)).toBeNull();
    await user.clear(pct);
    await user.type(pct, "7");
    fireEvent.blur(pct);
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    expect(api.createOrder).toHaveBeenCalledWith(expect.objectContaining({ discountPercent: 7 }));
  });

  it("mất mạng: khóa nút và hiện cảnh báo", async () => {
    const { user } = setup({ online: false });
    expect(screen.getByText("Mất mạng – chưa gửi được đơn")).toBeInTheDocument();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    expect(within(cart).getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
  });

  it("lỗi mạng giữ giỏ, bấm lại cùng id", async () => {
    const createOrder = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const { user } = setup({}, { createOrder });
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    expect(await within(cart).findByRole("alert")).toHaveTextContent("kiểm tra mạng");
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("1");
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByText(/Đã tạo đơn/);
    expect(createOrder.mock.calls.map((c) => c[0].id)).toEqual(["order-1", "order-1"]);
  });

  it("server báo đơn đã ghi từ lần gửi trước", async () => {
    const { user } = setup(
      {},
      { createOrder: vi.fn(async (i: CreateOrderInput) => created(i, { duplicate: true })) },
    );
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    expect(await screen.findByText(/Đơn này đã được ghi từ lần gửi trước \(1 món\)/)).toBeInTheDocument();
  });

  it("gửi lại một đơn đã bị hủy: báo, giữ giỏ, lần sau dùng id mới", async () => {
    const createOrder = vi
      .fn()
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i, { duplicate: true, status: "cancelled" }))
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const { user } = setup({}, { createOrder });
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    expect(await within(cart).findByText("Đơn này đã bị hủy – bấm Xác nhận đơn để tạo đơn mới.")).toBeInTheDocument();
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("1");
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByText(/Đã tạo đơn/);
    expect(createOrder.mock.calls.map((c) => c[0].id)).toEqual(["order-1", "order-2"]);
  });

  it("MENU_CHANGED: cập nhật giá trong giỏ và báo thực đơn vừa đổi", async () => {
    const details = JSON.stringify([
      { id: "m1", name: "Classic", price: 200000, is_archived: false },
      { id: "m2", name: "Neat", price: 100000, is_archived: false },
    ]);
    const { user } = setup({}, { createOrder: vi.fn().mockRejectedValue(new RpcError("MENU_CHANGED", details)) });
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    expect(await within(cart).findByText("Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.")).toBeInTheDocument();
    expect(within(cart).getByTestId("total")).toHaveTextContent("200.000đ");
  });

  it("menu đổi khi giỏ đang có món: món bị ẩn thì gạch dòng và khóa Xác nhận", async () => {
    const { user, rerender, props } = setup();
    await user.click(row(/^Neat/));
    rerender(<OrderScreen {...props} menu={MENU.map((m) => (m.id === "m2" ? { ...m, is_archived: true } : m))} />);
    const cart = await openCart(user);
    expect(within(cart).getByText("Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại")).toBeInTheDocument();
    expect(within(cart).getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
    expect(within(cart).getAllByText("Bỏ món đã ngừng bán khỏi đơn").length).toBeGreaterThan(0);
  });

  it("Hoàn tác gọi cancelOrder; phiên bị thu hồi gọi onUnauthorized", async () => {
    const { api, user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(await screen.findByRole("button", { name: "Hoàn tác" }));
    expect(api.cancelOrder).toHaveBeenCalledWith("order-1");

    const second = setup({}, { createOrder: vi.fn().mockRejectedValue(new RpcError("FORBIDDEN")) });
    await second.user.click(screen.getAllByRole("button", { name: /^Classic/ })[1]);
    await second.user.click(screen.getAllByRole("button", { name: "Giỏ đơn" })[1]);
    const dialog = screen.getAllByRole("dialog", { name: "Giỏ đơn" }).at(-1)!;
    await second.user.click(await within(dialog).findByRole("button", { name: "Quầy 1" }));
    await second.user.click(within(dialog).getByRole("button", { name: "Xác nhận đơn" }));
    expect(second.props.onUnauthorized).toHaveBeenCalled();
  });

  it("gửi thành công thì rung 30ms", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    const { user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByText(/Đã tạo đơn/);
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it("Đơn vừa tạo: tóm tắt món, nút Hủy chỉ trong cửa sổ 5 phút, đơn hủy có dấu HỦY", async () => {
    setup(
      {},
      {
        listOrdersByIds: vi.fn(async () => [
          { id: "a", item_count: 3, subtotal_amount: 480000, discount_percent: 10, discount_amount: 48000, total_amount: 432000, seat_name: "Bàn 1", status: "paid" as const, created_at: new Date(NOW.getTime() - 60_000).toISOString(), lines: [{ item_name: "Classic", unit_price: 190000, quantity: 2, line_amount: 380000 }, { item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 }] },
          { id: "b", item_count: 1, subtotal_amount: 100000, discount_percent: 0, discount_amount: 0, total_amount: 100000, seat_name: "Quầy 1", status: "paid" as const, created_at: new Date(NOW.getTime() - 10 * 60_000).toISOString(), lines: [{ item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 }] },
          { id: "c", item_count: 1, subtotal_amount: 100000, discount_percent: 0, discount_amount: 0, total_amount: 100000, seat_name: "Quầy 1", status: "cancelled" as const, created_at: NOW.toISOString(), lines: [{ item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 }] },
        ]),
      },
    );
    const list = await screen.findByRole("region", { name: "Đơn vừa tạo" });
    expect(await within(list).findByText("2 Classic, 1 Neat")).toBeInTheDocument();
    expect(within(list).getByText("−10%")).toBeInTheDocument();
    expect(within(list).getAllByRole("button", { name: "Hủy" })).toHaveLength(1);
    expect(within(list).getByText("HỦY")).toBeInTheDocument();
  });

  it("tải lại chỗ ngồi khi có mạng trở lại", async () => {
    const { api, rerender, props } = setup({ online: false });
    expect(api.listActiveSeats).not.toHaveBeenCalled();
    rerender(<OrderScreen {...props} online />);
    await vi.waitFor(() => expect(api.listActiveSeats).toHaveBeenCalled());
  });

  it("chủ quán thấy liên kết quay lại trang chủ quán; nhân viên không thấy", () => {
    setup({ ownerHome: "/admin/dashboard" });
    expect(screen.getByRole("link", { name: /Trang chủ quán/ })).toHaveAttribute("href", "/admin/dashboard");
  });

  it("màn rộng: phiếu đơn luôn hiện, không có thanh giỏ đơn", async () => {
    const spy = vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    setup();
    expect(screen.queryByRole("button", { name: "Giỏ đơn" })).toBeNull();
    expect(screen.getByRole("region", { name: "Giỏ đơn" })).toBeInTheDocument();
    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/order/OrderScreen.test.tsx`
Expected: FAIL. `OrderScreen` cũ không nhận `menu`, không có bảng giá hay giỏ đơn.

- [ ] **Step 3: Viết component**

Tạo `src/components/order/MenuBoard.tsx`:

```tsx
"use client";
import { formatVnd } from "@/lib/money";
import type { CartLine, MenuItem } from "@/lib/order/cart";

// SRS FR-01: bảng giá in đậm như mặt bao diêm. Chạm một hàng là +1; món trong giỏ hiện số lượng mực cam ở đầu hàng.
export function MenuBoard({
  menu,
  failed,
  cart,
  onAdd,
}: {
  menu: MenuItem[] | null;
  failed: boolean;
  cart: CartLine[];
  onAdd: (item: MenuItem) => void;
}) {
  if (menu === null) {
    if (failed)
      return (
        <p role="alert" className="rounded-lg border border-danger/60 px-3 py-2 text-danger">
          Không tải được thực đơn. Kiểm tra mạng rồi tải lại trang.
        </p>
      );
    return (
      <div aria-busy="true" aria-label="Đang tải thực đơn" className="divide-y divide-line border-y border-line">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex min-h-14 items-center">
            <span className="h-5 w-32 rounded bg-raised motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    );
  }
  const items = menu.filter((m) => !m.is_archived);
  if (items.length === 0)
    return <p className="py-6 text-ink-muted">Chưa có món nào đang bán – nhờ chủ quán thêm ở trang Thực đơn.</p>;
  const qty = new Map(cart.map((l) => [l.menuItemId, l.quantity]));
  return (
    <div role="group" aria-label="Thực đơn" className="divide-y divide-line border-y border-line">
      {items.map((m) => {
        const n = qty.get(m.id) ?? 0;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onAdd(m)}
            aria-label={n > 0 ? `${m.name}, ${formatVnd(m.price)}, đang có ${n} trong giỏ` : `${m.name}, ${formatVnd(m.price)}`}
            className="flex min-h-14 w-full items-center gap-3 px-1 text-left transition-colors duration-150 active:bg-ink active:text-bg"
          >
            <span aria-hidden="true" className="w-7 shrink-0 font-display text-xl text-ember tabular-nums">
              {n > 0 ? n : ""}
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-xl">{m.name}</span>
            <span className="shrink-0 font-semibold tabular-nums">{formatVnd(m.price)}</span>
          </button>
        );
      })}
    </div>
  );
}
```

Tạo `src/components/order/CartBar.tsx`:

```tsx
"use client";
import { formatVnd } from "@/lib/money";

// Thanh giỏ đơn trên điện thoại: tấm in mực cam, tấm đảo màu duy nhất của màn order (hợp đồng thiết kế)
export function CartBar({ count, total, onOpen }: { count: number; total: number; onOpen: () => void }) {
  if (count === 0)
    return <p className="flex min-h-16 items-center justify-center text-ink-muted">Chạm món để thêm</p>;
  return (
    <div className="fade-in flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-ember px-4 text-ember-ink">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{count} món</p>
        <p data-testid="bar-total" className="truncate font-display text-3xl leading-tight tabular-nums">
          {formatVnd(total)}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-h-12 shrink-0 rounded-xl border-2 border-ember-ink px-5 font-display text-xl transition-transform duration-150 active:scale-[0.98]"
      >
        Giỏ đơn
      </button>
    </div>
  );
}
```

Tạo `src/components/order/CartSheet.tsx`:

```tsx
"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Tấm giỏ đơn trên điện thoại: <dialog> gốc của trình duyệt lo nền tối, khóa focus và phím Esc.
// Trượt lên từ đáy; chạm nền tối để đóng. Nội dung chỉ dựng khi mở.
// ponytail: chưa có cử chỉ kéo xuống để đóng; đóng bằng nền tối, nút Đóng hoặc Esc
export function CartSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label="Giỏ đơn"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="sheet-in mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-edge bg-bg p-0 text-ink backdrop:bg-bg/70"
    >
      {open && <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{children}</div>}
    </dialog>
  );
}
```

Thay toàn bộ `src/components/order/SeatPicker.tsx`:

```tsx
"use client";
import type { ActiveSeat } from "@/lib/api";

export type SeatSelection = { kind: "none" } | { kind: "seat"; id: string; name: string };

// SRS FR-03b (v3.2): chỗ ngồi bắt buộc, không có Mang về. Ghế quầy 2 hàng 6 như mép quầy thật, dưới là Bàn.
// Chọn một chỗ thì chỗ đó thành khối mực cam, các chỗ khác lùi vào bóng tối.
const base = "min-h-14 truncate rounded-lg border px-1 font-display tabular-nums transition-[opacity,background-color,color,border-color] duration-200";
const on = "border-ember bg-ember text-ember-ink";
const off = "border-edge text-ink active:bg-raised";

export function SeatPicker({
  seats,
  selection,
  onChange,
}: {
  seats: ActiveSeat[];
  selection: SeatSelection;
  onChange: (s: SeatSelection) => void;
}) {
  const anySelected = selection.kind !== "none";
  // Nhóm đã ghi "Ghế quầy", nên nút chỉ cần phần số ("Quầy 7" → "7"); tên đầy đủ ở aria-label
  const shortName = (s: ActiveSeat) => (s.kind === "counter" ? s.name.replace(/^Quầy\s+/, "") : s.name);
  const buttons = (kind: ActiveSeat["kind"]) =>
    seats
      .filter((s) => s.kind === kind)
      .map((s) => {
        const active = selection.kind === "seat" && selection.id === s.id;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={active}
            aria-label={s.name}
            onClick={() => onChange(active ? { kind: "none" } : { kind: "seat", id: s.id, name: s.name })}
            className={`${base} ${kind === "counter" ? "text-2xl" : "text-xl"} ${active ? on : off} ${anySelected && !active ? "opacity-60" : ""}`}
          >
            {shortName(s)}
          </button>
        );
      });
  const counters = buttons("counter");
  const tables = buttons("table");
  return (
    <div className="space-y-3">
      {counters.length > 0 && (
        <div role="group" aria-label="Ghế quầy" className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted">Ghế quầy</p>
          <div className="grid grid-cols-6 gap-1.5">{counters}</div>
        </div>
      )}
      {tables.length > 0 && (
        <div role="group" aria-label="Bàn" className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted">Bàn</p>
          <div className="grid grid-cols-4 gap-1.5">{tables}</div>
        </div>
      )}
    </div>
  );
}
```

Thay toàn bộ `src/components/order/ConfirmBar.tsx`:

```tsx
"use client";
import Image from "next/image";
import { useEffect } from "react";

export type Feedback = { orderId: string; text: string };

// Nút Xác nhận đơn (mực cam, 64px) hoặc thanh phản hồi sau khi gửi (motif điếu thuốc + Hoàn tác 5 giây), SRS FR-04.
export function ConfirmBar({
  canSubmit,
  blockReason,
  sending,
  feedback,
  cancelBusy,
  undoing,
  onSubmit,
  onUndo,
  onFeedbackEnd,
}: {
  canSubmit: boolean;
  blockReason: string | null;
  sending: boolean;
  feedback: Feedback | null;
  cancelBusy: boolean;
  undoing: boolean;
  onSubmit: () => void;
  onUndo: (orderId: string) => void;
  onFeedbackEnd: () => void;
}) {
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(onFeedbackEnd, 5000);
    return () => clearTimeout(timer);
  }, [feedback, onFeedbackEnd]);

  if (feedback)
    return (
      <div className="fade-in flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-ember/60 bg-raised pr-2 pl-4">
        <span className="flex items-center gap-3">
          <Image src="/brand/motif-cigarette.png" alt="" width={46} height={20} className="shrink-0" />
          <span role="status" className="font-semibold text-balance">
            {feedback.text}
          </span>
        </span>
        <button
          type="button"
          disabled={cancelBusy}
          onClick={() => onUndo(feedback.orderId)}
          className="min-h-12 shrink-0 rounded-xl border border-edge px-4 font-semibold transition-colors duration-150 active:bg-ink active:text-bg disabled:opacity-50"
        >
          {undoing ? "Đang hủy…" : "Hoàn tác"}
        </button>
      </div>
    );
  return (
    <div className="space-y-1.5">
      {!canSubmit && !sending && blockReason && <p className="text-center text-sm text-ink-muted">{blockReason}</p>}
      <button
        type="button"
        aria-label="Xác nhận đơn"
        disabled={!canSubmit || sending}
        onClick={onSubmit}
        className="min-h-16 w-full rounded-2xl bg-ember font-display text-2xl text-ember-ink transition-[transform,background-color] duration-150 active:scale-[0.98] disabled:bg-raised disabled:text-ink-muted"
      >
        {sending ? "Đang gửi…" : "Xác nhận đơn"}
      </button>
    </div>
  );
}
```

Tạo `src/components/order/CartPanel.tsx`:

```tsx
"use client";
import { Minus, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ActiveSeat } from "@/lib/api";
import { useTwoStep } from "@/lib/admin/useTwoStep";
import { formatVnd } from "@/lib/money";
import { discountAmount, parseDiscountInput, parseQuantityInput, subtotal, type CartLine } from "@/lib/order/cart";
import { SeatPicker, type SeatSelection } from "./SeatPicker";

const PRESETS = [5, 10, 15, 20];
const STEP =
  "flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-edge transition-[background-color,transform] duration-150 active:scale-95 active:bg-raised disabled:opacity-40";

// SRS FR-02, FR-03, FR-03b: dòng đơn, giảm giá, tổng, chỗ ngồi; dùng chung cho tấm giỏ đơn (điện thoại) và phiếu đơn (màn rộng)
export function CartPanel({
  cart,
  discount,
  seats,
  selection,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
  onClear,
  onDiscount,
  onSeat,
  onClose,
  notices,
  footer,
}: {
  cart: CartLine[];
  discount: number;
  seats: ActiveSeat[];
  selection: SeatSelection;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSetQuantity: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onDiscount: (p: number) => void;
  onSeat: (s: SeatSelection) => void;
  onClose?: () => void;
  notices: ReactNode;
  footer: ReactNode;
}) {
  const clear = useTwoStep();
  const sub = subtotal(cart);
  const off = discountAmount(sub, discount);
  return (
    <section aria-label="Giỏ đơn" className="flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <h2 className="flex-1 font-display text-2xl">Giỏ đơn</h2>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (clear.armed === null) return clear.arm(true);
              clear.reset();
              onClear();
            }}
            className={`min-h-12 rounded-lg border px-3 text-sm font-semibold transition-colors duration-150 ${clear.armed ? "border-danger bg-danger text-ember-ink" : "border-danger/70 text-danger"}`}
          >
            {clear.armed ? "Chắc chắn xóa hết?" : "Xóa hết"}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            aria-label="Đóng giỏ đơn"
            onClick={onClose}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:text-ink"
          >
            <X aria-hidden="true" size={22} />
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <p className="text-ink-muted">Giỏ đơn trống. Chạm món để thêm.</p>
      ) : (
        <ul className="-mt-2 divide-y divide-line">
          {cart.map((l) => (
            <LineRow
              key={l.menuItemId}
              line={l}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onSetQuantity={onSetQuantity}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      <Discount value={discount} onChange={onDiscount} />

      <dl className="space-y-1 tabular-nums">
        <div className="flex justify-between text-ink-muted">
          <dt>Tạm tính</dt>
          <dd>{formatVnd(sub)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-ink-muted">
            <dt>Giảm {discount}%</dt>
            <dd>−{formatVnd(off)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <dt className="font-semibold">Thành tiền</dt>
          <dd data-testid="total" className="truncate font-display text-4xl">
            {formatVnd(sub - off)}
          </dd>
        </div>
      </dl>

      <SeatPicker seats={seats} selection={selection} onChange={onSeat} />
      <p
        aria-live="polite"
        className={selection.kind === "seat" ? "font-display text-3xl" : "font-semibold text-warn"}
      >
        {selection.kind === "seat" ? selection.name : "Chưa chọn chỗ ngồi"}
      </p>

      {notices}
      {footer}
    </section>
  );
}

function LineRow({
  line,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
}: {
  line: CartLine;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSetQuantity: (id: string, q: number) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const q = parseQuantityInput(draft);
    if (q !== null) onSetQuantity(line.menuItemId, q);
    setDraft(null);
  };
  return (
    <li className={`space-y-2 py-3 transition-colors duration-200 ${line.priceChanged ? "rounded-lg bg-warn/15 px-2" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`min-w-0 font-semibold ${line.archived ? "text-ink-muted line-through" : ""}`}>{line.name}</span>
        <span className="font-semibold tabular-nums">{formatVnd(line.price * line.quantity)}</span>
      </div>
      {line.archived ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-warn">Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại</p>
          <button
            type="button"
            onClick={() => onRemove(line.menuItemId)}
            className="min-h-12 shrink-0 rounded-lg border border-edge px-3 text-sm transition-colors duration-150 hover:border-ink"
          >
            Bỏ khỏi đơn
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm text-ink-muted tabular-nums">{formatVnd(line.price)}</span>
          <button type="button" aria-label={`Bớt 1 ${line.name}`} onClick={() => onDecrement(line.menuItemId)} className={STEP}>
            <Minus aria-hidden="true" size={18} />
          </button>
          <input
            aria-label={`Số lượng ${line.name}`}
            inputMode="numeric"
            value={draft ?? String(line.quantity)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="min-h-12 w-14 rounded-lg border border-edge bg-transparent text-center tabular-nums transition-colors duration-150 focus:border-ember"
          />
          <button
            type="button"
            aria-label={`Thêm 1 ${line.name}`}
            disabled={line.quantity >= 99}
            onClick={() => onIncrement(line.menuItemId)}
            className={STEP}
          >
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>
      )}
    </li>
  );
}

// Giảm giá (SRS FR-03): nút có sẵn và ô nhập tay. Nút đang chọn đảo màu kem, để mực cam dành cho hành động chính.
function Discount({ value, onChange }: { value: number; onChange: (p: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const p = parseDiscountInput(draft);
    if (p !== null) onChange(p);
    setDraft(null);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-ink-muted">Giảm giá</legend>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={value === p}
            onClick={() => onChange(value === p ? 0 : p)}
            className={`min-h-12 min-w-14 rounded-lg border px-3 font-semibold tabular-nums transition-colors duration-150 ${value === p ? "border-ink bg-ink text-bg" : "border-edge"}`}
          >
            {p}%
          </button>
        ))}
        <label className="flex items-center gap-1">
          <input
            aria-label="Giảm giá (%)"
            inputMode="numeric"
            placeholder="%"
            value={draft ?? (value && !PRESETS.includes(value) ? String(value) : "")}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="min-h-12 w-16 rounded-lg border border-edge bg-transparent text-center tabular-nums transition-colors duration-150 placeholder:text-ink-muted focus:border-ember"
          />
          <span aria-hidden="true" className="text-ink-muted">
            %
          </span>
        </label>
      </div>
    </fieldset>
  );
}
```

Thay toàn bộ `src/components/order/RecentOrders.tsx`:

```tsx
"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { MyOrder } from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { summarize } from "@/lib/order/cart";
import { formatVnTime } from "@/lib/time";

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

// SRS FR-04b: đơn do máy này tạo trong ngày kinh doanh, in như sổ: giờ và chỗ ngồi | món | thành tiền.
// Đơn hủy giữ dòng, gạch ngang, có dấu HỦY in.
export function RecentOrders({
  orders,
  now,
  cancelBusy,
  cancellingId,
  onCancel,
}: {
  orders: MyOrder[];
  now: () => Date;
  cancelBusy: boolean;
  cancellingId: string | null;
  onCancel: (orderId: string) => void;
}) {
  // Render lại định kỳ để nút Hủy tự ẩn khi hết cửa sổ hủy
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(timer);
  }, []);
  const nowMs = now().getTime();

  return (
    <section aria-label="Đơn vừa tạo" className="space-y-2 pt-8 pb-8">
      <h2 className="border-b border-line pb-2 font-display text-xl text-ink-muted">Đơn vừa tạo</h2>
      {orders.length === 0 && (
        <div className="flex items-center gap-4 py-4 text-ink-muted">
          <Image src="/brand/motif-cocktail.png" alt="" width={40} height={49} className="opacity-40" />
          <p>Chưa có đơn nào.</p>
        </div>
      )}
      <ul className="divide-y divide-line">
        {orders.map((o) => {
          const cancelled = o.status === "cancelled";
          const cancellable = !cancelled && nowMs - Date.parse(o.created_at) <= CANCEL_WINDOW_MS;
          const muted = cancelled ? "text-ink-muted line-through" : "";
          return (
            <li key={o.id} className="row-in grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 py-2.5">
              <div className={`tabular-nums ${muted}`}>
                <p>{formatVnTime(o.created_at)}</p>
                <p className="text-sm text-ink-muted">{o.seat_name}</p>
              </div>
              <p className={`text-sm ${muted}`}>{summarize(o.lines)}</p>
              <div className="flex flex-col items-end gap-1">
                <p className={`font-semibold tabular-nums ${muted}`}>{formatVnd(o.total_amount)}</p>
                {o.discount_percent > 0 && <p className="text-xs text-ink-muted">−{o.discount_percent}%</p>}
                {cancelled && (
                  <span className="rounded-sm border border-line px-1 text-xs font-semibold text-ink-muted">HỦY</span>
                )}
                {cancellable && (
                  <button
                    type="button"
                    disabled={cancelBusy}
                    onClick={() => onCancel(o.id)}
                    className="min-h-12 rounded-lg border border-danger/70 px-4 font-semibold text-danger transition-colors duration-150 active:bg-danger active:text-ember-ink disabled:opacity-50"
                  >
                    {cancellingId === o.id ? "Đang hủy…" : "Hủy"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

Thay toàn bộ `src/components/order/OrderScreen.tsx`:

```tsx
"use client";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWide } from "@/hooks/useWide";
import { menuFromError, NetworkError, RpcError, type ActiveSeat, type MyOrder, type StaffApi } from "@/lib/api";
import { buzz } from "@/lib/haptics";
import { formatVnd } from "@/lib/money";
import {
  addItem,
  applyMenu,
  clearPriceFlags,
  decrement,
  discountAmount,
  itemCount,
  removeLine,
  setQuantity,
  subtotal,
  toPayload,
  type CartLine,
  type MenuItem,
} from "@/lib/order/cart";
import { getMyOrderIds, rememberOrder } from "@/lib/order/myOrders";
import { CartBar } from "./CartBar";
import { CartPanel } from "./CartPanel";
import { CartSheet } from "./CartSheet";
import { ConfirmBar, type Feedback } from "./ConfirmBar";
import { MenuBoard } from "./MenuBoard";
import { RecentOrders } from "./RecentOrders";
import type { SeatSelection } from "./SeatPicker";

const ERROR_TEXT: Record<string, string> = {
  INVALID_QUANTITY: "Số lượng mỗi món phải từ 1 đến 99.",
  INVALID_LINES: "Giỏ đơn không hợp lệ. Xóa hết rồi chọn lại món.",
  INVALID_DISCOUNT: "Giảm giá phải từ 0 đến 100%.",
  SEAT_REQUIRED: "Chọn chỗ ngồi trước khi gửi.",
  SEAT_NOT_FOUND: "Chỗ ngồi không còn tồn tại. Tải lại trang.",
  TOTAL_TOO_LARGE: "Đơn quá lớn (trên 1 tỷ đồng). Tách thành nhiều đơn.",
  ORDER_NOT_FOUND: "Không tìm thấy đơn.",
  CANCEL_WINDOW_EXPIRED: "Đã quá 5 phút, nhờ chủ quán hủy đơn.",
};
const CANCEL_NETWORK_ERROR = "Chưa hủy được – kiểm tra mạng rồi thử lại.";
const MENU_CHANGED_TEXT = "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.";
const CANCELLED_TEXT = "Đơn này đã bị hủy – bấm Xác nhận đơn để tạo đơn mới.";

export type OrderScreenProps = {
  api: StaffApi;
  menu: MenuItem[] | null;
  menuFailed?: boolean;
  online: boolean;
  onUnauthorized: () => void;
  newId?: () => string;
  now?: () => Date;
  // Có khi tài khoản là chủ quán: liên kết quay lại trang chủ quán (SRS §3.2)
  ownerHome?: string;
};

export function OrderScreen({
  api,
  menu,
  menuFailed = false,
  online,
  onUnauthorized,
  newId = () => crypto.randomUUID(),
  now = () => new Date(),
  ownerHome,
}: OrderScreenProps) {
  const wide = useWide();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [selection, setSelection] = useState<SeatSelection>({ kind: "none" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seats, setSeats] = useState<ActiveSeat[]>([]);
  const [recent, setRecent] = useState<MyOrder[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [flare, setFlare] = useState(0);
  // Lỗi ẩn khi đổi giỏ/giảm giá/chỗ ngồi; info giữ tới lần gửi/hủy thành công (SRS FR-04)
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Nhớ cả nút đã bấm: chỉ nút đó hiện "Đang hủy…", mọi nút hủy khác bị khóa (SRS FR-04b)
  const [cancelling, setCancelling] = useState<{ id: string; from: "undo" | "list" } | null>(null);
  // Giữ id tới khi gửi thành công, để bấm lại sau lỗi mạng không tạo đơn thứ hai (FR-04)
  const pendingId = useRef<string | null>(null);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof RpcError && e.code === "FORBIDDEN") return onUnauthorized();
      if (e instanceof RpcError) return setError(ERROR_TEXT[e.code] ?? `Lỗi: ${e.code}`);
      if (e instanceof NetworkError) return setError("Chưa gửi được – kiểm tra mạng rồi bấm lại.");
      setError("Có lỗi xảy ra.");
    },
    [onUnauthorized],
  );

  const refreshRecent = useCallback(async () => {
    try {
      setRecent(await api.listOrdersByIds(getMyOrderIds()));
    } catch (e) {
      if (!(e instanceof NetworkError)) handleError(e);
    }
  }, [api, handleError]);

  useEffect(() => {
    if (!online) return;
    api
      .listActiveSeats()
      .then(setSeats)
      .catch((e) => {
        if (!(e instanceof NetworkError)) handleError(e);
      });
    void refreshRecent();
  }, [api, online, handleError, refreshRecent]);

  // Thực đơn đổi (realtime): cập nhật giá, gạch món ngừng bán (FR-01)
  useEffect(() => {
    if (!menu) return;
    setCart((c) => applyMenu(c, menu));
  }, [menu]);
  // Dòng vừa đổi giá nổi bật khoảng 3 giây
  useEffect(() => {
    if (!cart.some((l) => l.priceChanged)) return;
    const timer = setTimeout(() => setCart(clearPriceFlags), 3000);
    return () => clearTimeout(timer);
  }, [cart]);

  const endFeedback = useCallback(() => setFeedback(null), []);
  // Mọi thao tác trên giỏ là bắt đầu đơn mới: ẩn lỗi và thanh phản hồi
  const edit = <T,>(apply: (v: T) => void) => (v: T) => {
    setFeedback(null);
    setError(null);
    apply(v);
  };
  const add = edit((item: MenuItem) => setCart((c) => addItem(c, item)));
  const inc = edit((id: string) => setCart((c) => {
    const l = c.find((x) => x.menuItemId === id);
    return l ? setQuantity(c, id, l.quantity + 1) : c;
  }));
  const dec = edit((id: string) => setCart((c) => decrement(c, id)));
  const setQty = (id: string, q: number) => edit(() => setCart((c) => setQuantity(c, id, q)))(undefined);
  const remove = edit((id: string) => setCart((c) => removeLine(c, id)));
  const clear = edit(() => setCart([]));
  const changeDiscount = edit(setDiscount);
  const changeSeat = edit(setSelection);

  const count = itemCount(cart);
  const sub = subtotal(cart);
  const total = sub - discountAmount(sub, discount);
  const hasArchived = cart.some((l) => l.archived);
  const blockReason =
    menu === null
      ? "Đang tải thực đơn…"
      : cart.length === 0
        ? "Chạm món để thêm"
        : hasArchived
          ? "Bỏ món đã ngừng bán khỏi đơn"
          : selection.kind === "none"
            ? "Chọn chỗ ngồi"
            : !online
              ? "Mất mạng – chưa gửi được đơn"
              : null;

  async function handleSubmit() {
    if (blockReason || sending || selection.kind !== "seat") return;
    const id = (pendingId.current ??= newId());
    setSending(true);
    setError(null);
    try {
      const res = await api.createOrder({ id, seatId: selection.id, discountPercent: discount, lines: toPayload(cart) });
      if (res.duplicate && res.status === "cancelled") {
        // Đơn đã ghi rồi bị hủy trước lần gửi lại: giữ giỏ, lần sau dùng id mới (SRS v3.1)
        pendingId.current = null;
        setInfo(CANCELLED_TEXT);
        return;
      }
      pendingId.current = null;
      setInfo(
        res.duplicate
          ? `Đơn này đã được ghi từ lần gửi trước (${res.item_count} món). Kiểm tra lại trước khi tạo đơn mới.`
          : null,
      );
      rememberOrder(res.id);
      setCart([]);
      setDiscount(0);
      setSelection({ kind: "none" });
      setSheetOpen(false);
      setFeedback({ orderId: res.id, text: `Đã tạo đơn ${res.item_count} món – ${formatVnd(res.total_amount)}` });
      setFlare((n) => n + 1);
      buzz();
      await refreshRecent();
    } catch (e) {
      const fresh = menuFromError(e);
      if (fresh) {
        setCart((c) => applyMenu(c, fresh));
        setInfo(MENU_CHANGED_TEXT);
      } else handleError(e);
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(orderId: string, from: "undo" | "list") {
    if (cancelling) return;
    setCancelling({ id: orderId, from });
    try {
      await api.cancelOrder(orderId);
      setError((e) => (e === CANCEL_NETWORK_ERROR ? null : e));
      setInfo(null);
      setFeedback((f) => (f?.orderId === orderId ? null : f));
      await refreshRecent();
    } catch (e) {
      if (e instanceof NetworkError) setError(CANCEL_NETWORK_ERROR);
      else handleError(e);
    } finally {
      setCancelling(null);
    }
  }

  const notices = (
    <>
      {info && (
        <p role="status" className="rounded-lg border border-warn/50 px-3 py-2 text-warn">
          {info}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-danger/60 px-3 py-2 text-danger">
          {error}
        </p>
      )}
    </>
  );
  const confirm = (fb: Feedback | null) => (
    <ConfirmBar
      canSubmit={blockReason === null}
      blockReason={blockReason}
      sending={sending}
      feedback={fb}
      cancelBusy={cancelling !== null}
      undoing={cancelling?.from === "undo" && cancelling.id === fb?.orderId}
      onSubmit={() => void handleSubmit()}
      onUndo={(id) => void handleCancel(id, "undo")}
      onFeedbackEnd={endFeedback}
    />
  );
  // Dải quẹt diêm: bùng sáng một lần khi gửi thành công (key đổi để chạy lại hiệu ứng)
  const striker = <span key={flare} aria-hidden="true" className={`striker block ${flare ? "striker-flare" : ""}`} />;
  const panel = (onClose?: () => void, fb: Feedback | null = null) => (
    <CartPanel
      cart={cart}
      discount={discount}
      seats={seats}
      selection={selection}
      onIncrement={inc}
      onDecrement={dec}
      onSetQuantity={setQty}
      onRemove={remove}
      onClear={clear}
      onDiscount={changeDiscount}
      onSeat={changeSeat}
      onClose={onClose}
      notices={notices}
      footer={
        <div className="space-y-2">
          {wide && striker}
          {confirm(fb)}
        </div>
      }
    />
  );

  return (
    <main className="mx-auto max-w-md px-4 pt-3 md:max-w-5xl">
      <header className="flex items-center justify-between gap-3 pb-3">
        <Image src="/brand/nuoc-noi-wordmark.png" alt="Nước Nôi" width={54} height={50} priority className="h-10 w-auto" />
        {ownerHome && (
          <Link href={ownerHome} className="inline-flex min-h-12 items-center gap-1 text-sm text-ink-muted transition-colors duration-150 hover:text-ink">
            <ChevronLeft aria-hidden="true" size={16} />
            Trang chủ quán
          </Link>
        )}
      </header>
      {!online && (
        <p className="mb-3 rounded-lg border border-danger/60 px-3 py-2 font-semibold text-danger">Mất mạng – chưa gửi được đơn</p>
      )}
      <div className="md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start md:gap-8">
        <div>
          <MenuBoard menu={menu} failed={menuFailed} cart={cart} onAdd={add} />
          <RecentOrders
            orders={recent}
            now={now}
            cancelBusy={cancelling !== null}
            cancellingId={cancelling?.from === "list" ? cancelling.id : null}
            onCancel={(id) => void handleCancel(id, "list")}
          />
        </div>
        {wide && <aside className="sticky top-4">{panel(undefined, feedback)}</aside>}
      </div>
      {!wide && (
        <>
          <div className="sticky bottom-0 z-10 -mx-4 space-y-2 bg-bg px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {!sheetOpen && notices}
            {striker}
            {feedback ? confirm(feedback) : <CartBar count={count} total={total} onOpen={() => setSheetOpen(true)} />}
          </div>
          <CartSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
            {panel(() => setSheetOpen(false))}
          </CartSheet>
        </>
      )}
    </main>
  );
}
```

Thay toàn bộ `src/app/order/page.tsx`:

```tsx
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderScreen } from "@/components/order/OrderScreen";
import { useMenu } from "@/hooks/useMenu";
import { useOnline } from "@/hooks/useOnline";
import { createStaffApi } from "@/lib/api";
import { getBrowserSupabase, getRpcClient } from "@/lib/supabase/client";

export default function OrderPage() {
  const router = useRouter();
  const { menu, failed } = useMenu();
  const online = useOnline();
  const api = useMemo(() => createStaffApi(getRpcClient), []);
  // Chủ quán cũng dùng được /order (SRS §2.2): hiện đường quay lại trang chủ quán
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    void getBrowserSupabase()
      .rpc("is_owner")
      .then(({ data }) => setIsOwner(data === true));
  }, []);
  const onUnauthorized = useCallback(() => {
    void getBrowserSupabase()
      .auth.signOut({ scope: "local" })
      .finally(() => router.replace("/login"));
  }, [router]);

  return (
    <OrderScreen
      api={api}
      menu={menu}
      menuFailed={failed}
      online={online}
      onUnauthorized={onUnauthorized}
      ownerHome={isOwner ? "/admin/dashboard" : undefined}
    />
  );
}
```

Trong `src/app/globals.css`:
- Trong khối `.striker { … }`, thêm `position: relative; overflow: hidden;`.
- Thêm ngay sau khối `.striker`:

```css
/* Gửi đơn thành công: dải quẹt bùng sáng một lần như que diêm vừa quẹt (hợp đồng thiết kế) */
@keyframes strike {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
.striker-flare::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, var(--ember), transparent);
  animation: strike 400ms var(--ease-print) both;
}

/* Tấm giỏ đơn trượt lên từ đáy */
@keyframes sheet-up {
  from {
    transform: translateY(100%);
  }
}
.sheet-in[open] {
  animation: sheet-up 250ms var(--ease-print) both;
}
.sheet-in::backdrop {
  animation: fade-in 200ms ease-out both;
}
```

- Trong `@media (prefers-reduced-motion: reduce)`:
  - thêm `.sheet-in[open]` vào danh sách đang dùng `animation: fade-in 200ms ease-out both;`;
  - thêm khối `.striker-flare::after { animation: fade-in 400ms ease-out reverse both; transform: none; }`, để dải chỉ chớp sáng rồi mờ, không chạy ngang.

Xóa file cũ: `git rm src/components/order/QuantityPad.tsx src/components/order/PriceBanner.tsx src/lib/order/quantity.ts src/hooks/useCurrentPrice.ts tests/unit/order/QuantityPad.test.tsx tests/unit/order/PriceBanner.test.tsx tests/unit/order/quantity.test.ts`.

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- tests/unit/order/OrderScreen.test.tsx`
Expected: PASS 19/19.

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: tất cả PASS. Có thể còn lỗi kiểu ở `src/app/admin/(protected)/history/page.tsx` (đợt 4). Nếu có, ghi Ruling và không sửa ở đây. Trường hợp `tsc` báo lỗi trong file của đợt này thì phải sửa.

- [ ] **Step 5: Commit**

```bash
git add -A src tests
git commit -m "feat(order): màn order chọn món — bảng giá, giỏ đơn, giảm giá, chỗ ngồi bắt buộc, dải quẹt diêm (SRS v3.2 FR-01–FR-04b)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Tài liệu, ảnh chụp, finish review, đối chiếu SRS

**Files:**
- Modify: `docs/design/order-brief.md` (bỏ Mang về), `docs/superpowers/specs/2026-10-04-thuc-don-giam-gia-design.md` (bỏ Mang về; giữ `id` khi gửi lại sau khi sửa giỏ, xem Ruling)
- Modify: `scripts/screenshots.mjs` (thêm `/order` bằng tài khoản nhân viên)
- Rewrite (bởi documenter): mục màn order trong `DESIGN.md` và `.impeccable/design.json`

**Interfaces:**
- Consumes: Task 1–4.
- Produces: tài liệu khớp v3.2; ảnh `.impeccable/review/order-*.png`; finish review; `srs-reviewer` báo "khớp SRS".

- [ ] **Step 1: Sửa tài liệu**

Trong `docs/design/order-brief.md` và spec: xóa mọi nhắc tới "Mang về". Ví dụ đổi "Bàn và Mang về 4 cột" thành "Bàn 4 cột", "chỗ ngồi hoặc Mang về" thành "chỗ ngồi". Thêm vào spec §5.3 một dòng: "Gửi lại sau lỗi mạng dùng cùng `id` kể cả khi giỏ đã sửa (FR-04), để không thành hai đơn nếu lần đầu đã ghi; `id` chỉ đổi sau khi gửi thành công hoặc server báo đơn đó đã bị hủy."

- [ ] **Step 2: Chụp ảnh màn order**

Trong `scripts/screenshots.mjs`, thêm trước `await browser.close();`:

```js
// Màn order bằng tài khoản nhân viên: nhập PIN quán trên bàn phím số
for (const [w, h, prefix] of [[390, 844, "order"], [360, 640, "order-360"], [1024, 768, "order-wide"]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(base + "/login");
  for (const d of "123456") await p.getByRole("button", { name: d, exact: true }).click();
  await p.waitForURL("**/order", { timeout: 30000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${prefix}.png` });
  await p.getByRole("button", { name: /^Classic/ }).click();
  await p.getByRole("button", { name: /^Classic/ }).click();
  await p.getByRole("button", { name: /^Neat/ }).click();
  await p.screenshot({ path: `${out}/${prefix}-cart.png` });
  if (w < 768) {
    await p.getByRole("button", { name: "Giỏ đơn" }).click();
    await p.waitForTimeout(400);
    await p.screenshot({ path: `${out}/${prefix}-sheet.png` });
  }
  await ctx.close();
}
```

Run: `npx supabase db reset`, tạo lại tài khoản thử theo README, rồi `node scripts/screenshots.mjs`. Mở từng ảnh `order*.png` một lần để xác nhận đúng trang, không trống. Phím PIN của `PinLogin` phải có tên là chính chữ số. Nếu không phải, đọc `src/components/order/PinLogin.tsx` và sửa bộ chọn cho khớp.

- [ ] **Step 3: Detector và finish review**

Run: `C:/Users/HP/.claude/skills/impeccable/scripts/impeccable detect --json src/components/order src/app/order/page.tsx src/app/globals.css`

Spawn `impeccable-finish-reviewer` với:
- hợp đồng thiết kế trong surface brief order;
- yêu cầu của người dùng: tối giản; thói quen app quen thuộc; chuyển động mượt; chất quán bar; bỏ Mang về;
- danh sách file đã đổi;
- ảnh `order*.png` (bắt buộc hết);
- kết quả detector;
- ghi chú "code-led";
- đường dẫn craft floor.

Làm theo disposition, tối đa hai vòng; còn mục mở thì đưa người dùng quyết.

- [ ] **Step 4: DESIGN.md mục màn order**

Spawn `impeccable-documenter`. Cập nhật DESIGN.md và `.impeccable/design.json` cho màn order từ bản đã dựng: bảng giá, tấm giỏ đơn, phiếu đơn màn rộng, dải quẹt và flare, quy tắc chỗ ngồi. Phần trang chủ quán giữ nguyên.

- [ ] **Step 5: `srs-reviewer`, commit**

Prompt cho `srs-reviewer`: đối chiếu `git diff <BASE đợt 3>..HEAD -- supabase/ src/ tests/ docs/ DESIGN.md` với SRS v3.2 (FR-01–FR-04b, R33, R34, R37, R38), GLOSSARY, `.claude/rules/`. Ghi chú: Lịch sử đơn hàng và CSV là đợt 4.
Expected: "khớp SRS". Sửa mọi chỗ lệch, chạy lại test, commit:

```bash
git add -A docs scripts DESIGN.md .impeccable/design.json src tests
git commit -m "docs(order): tài liệu bỏ Mang về, DESIGN.md màn order; sửa theo finish review đợt 3

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
