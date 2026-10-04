# Đợt 2: Trang Thực đơn cho chủ quán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chủ quán quản lý thực đơn ở `/admin/menu` (thêm món, đổi tên, đổi giá, sắp xếp, ẩn, hiện lại, xem lịch sử đổi giá), và mục Đơn giá chung biến mất khỏi Cài đặt.

**Architecture:**
- Trang server component đọc `menu_items` và `menu_price_history` qua RLS của chủ quán.
- Component client `MenuManager` ghi thẳng vào bảng `menu_items`, theo đúng mẫu `SeatsManager` (RLS chỉ cho chủ quán insert/update; trigger tự ghi lịch sử giá).
- Kiểm tra tên và giá nằm trong hàm thuần ở `src/lib/admin/`, kèm Vitest.
- Không đổi database.

**Tech Stack:** Next.js 15 App Router, React, Tailwind v4 (token trong `src/app/globals.css`), Supabase JS, Vitest + Testing Library, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-04-thuc-don-giam-gia-design.md` (§6, mục Thực đơn) và `docs/SRS.md` v3.0 (FR-05, FR-05a, R32).

## Global Constraints

- Giá món là số nguyên VND từ **1.000đ đến 5.000.000đ** (FR-05). Server cũng chặn bằng CHECK (`23514`).
- Tên món không rỗng, **không trùng tên món đang bán khác** (không phân biệt hoa thường, khoảng trắng đầu/cuối); server chặn bằng unique index (`23505`). Món đã ẩn nhường tên lại.
- Ẩn món dùng xác nhận hai bước: "Ẩn" → "Chắc chắn ẩn?" trong vài giây (FR-05). Món không bao giờ bị xóa hẳn.
- Lịch sử đổi giá: 20 lần gần nhất, gồm tên món, mức giá, thời điểm, người đổi; người đổi hiện email chủ quán đang đăng nhập, "Chủ quán khác", hoặc "Khởi tạo" khi `changed_by` null (FR-05a).
- Không tải được thì báo "Không tải được thực đơn. Kiểm tra mạng rồi tải lại trang." (FR-05).
- Đọc trong server component bằng `createServerSupabase()`; ghi trong client bằng `getBrowserSupabase()`, ghi xong `router.refresh()` (`.claude/rules/owner-ui.md`).
- Giao diện: token vai trò (`bg-bg`, `text-ink`, `border-edge`, `bg-ember`…), không mã màu; vùng chạm ≥ 48px; `tabular-nums` cho tiền; icon `lucide-react` có `aria-hidden` hoặc `aria-label`; không `window.confirm/prompt/alert`; lỗi `role="alert"`, thông tin `role="status"` (`.claude/rules/ui-craft.md`).
- Thuật ngữ theo GLOSSARY: Thực đơn (Menu), Món (Menu item), Món đã ẩn (Archived menu item), Giá món (Menu item price). Không dùng "sản phẩm", "đồ uống", "đơn giá chung".

## Review Focus

1. **Hiện lại một món đã ẩn khi đã có món đang bán cùng tên:** phải báo rõ "Đã có món đang bán tên này. Đặt tên khác." trước khi gọi server, không ra lỗi chung. → Task 2, test "hiện lại món đã ẩn trùng tên".
2. **Gõ giá kiểu người Việt** ("120.000", "120,000", "120.000đ", " 120000 "): phải nhận đúng; "120,5" hay "1.20" phải từ chối, không thành số khác. → Task 1, `validate.test.ts`.
3. **Server từ chối** (trùng tên do người khác vừa thêm, giá ngoài khoảng): lỗi `23505`/`23514` phải ra câu tiếng Việt cụ thể, không ra "Không thực hiện được". → Task 1, `errors.test.ts`.
4. **Đổi tên thành chính nó (chỉ khác hoa thường hoặc khoảng trắng):** không được báo trùng với chính mình. → Task 1, `menu.test.ts`.
5. **Danh sách trống** (chủ quán ẩn hết món): hiện câu hướng dẫn, form thêm món vẫn dùng được. → Task 2, test "thực đơn trống".

## Lưu ý cho người thực hiện

- Màn order, Tổng quan và Lịch sử trên nhánh này vẫn đang hỏng tạm thời (đợt 3–4). Chỉ đánh giá trang `/admin/menu` và `/admin/settings`.
- Chạy unit test: `npm test`. Kiểm tra kiểu: `npx tsc --noEmit`. Lint: `npx eslint src`.
- **Không chạy `next build` khi `npm run dev` đang chạy** (ghi đè `.next` làm dev server lỗi `Cannot find module './887.js'`).
- **Sắp xếp không gây kẹt khóa:** đổi chỗ hai món là hai lệnh `update` riêng, mỗi lệnh khóa đúng một dòng. Vì vậy không bao giờ tạo vòng chờ với khóa `FOR SHARE` của `create_order` (lỗi nhỏ còn để lại ở đợt 1). Không gộp hai lệnh thành một `update … in (…)`.

---

### Task 1: Hàm thuần cho tên, giá và lỗi của thực đơn

**Files:**
- Modify: `src/lib/admin/validate.ts`
- Create: `src/lib/admin/menu.ts`
- Modify: `src/lib/admin/errors.ts`
- Test: `tests/unit/admin/validate.test.ts` (sửa), `tests/unit/admin/menu.test.ts` (mới), `tests/unit/admin/errors.test.ts` (mới)

**Interfaces:**
- Produces:
  - `validate.ts`: `MIN_PRICE = 1_000`, `MAX_PRICE = 5_000_000`, `PRICE_RANGE_TEXT: string`, `parsePriceInput(raw: string): number | null` (giữ tên cũ, đổi khoảng), `isValidPin` giữ nguyên.
  - `menu.ts`: `type MenuItemLike = { id: string; name: string; is_archived: boolean; sort_order: number }`; `normalizeMenuName(raw: string): string`; `menuNameError(raw: string, items: MenuItemLike[], exceptId?: string): string | null`; `nextSortOrder(items: MenuItemLike[]): number`; `changerLabel(changedBy: string | null, user: { id: string; email?: string } | null): string`.
  - `errors.ts`: `ownerErrorText(error: { message: string; code?: string }): string`, thêm ánh xạ cho `23505` trên `menu_items_active_name_key` và `23514` trên `menu_items_price_check`.

- [ ] **Step 1: Viết test thất bại**

Thay toàn bộ `tests/unit/admin/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  isValidPin,
  MAX_PRICE,
  MIN_PRICE,
  parsePriceInput,
  PRICE_RANGE_TEXT,
} from "@/lib/admin/validate";

describe("parsePriceInput", () => {
  it("chấp nhận nhiều cách gõ tiền", () => {
    expect(parsePriceInput("120000")).toBe(120000);
    expect(parsePriceInput("120.000")).toBe(120000);
    expect(parsePriceInput(" 120.000đ ")).toBe(120000);
    expect(parsePriceInput("120,000")).toBe(120000);
    expect(parsePriceInput("5.000.000")).toBe(5000000);
    expect(parsePriceInput(String(MIN_PRICE))).toBe(1000);
  });
  it("từ chối giá ngoài khoảng 1.000đ–5.000.000đ hoặc gõ sai", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("999")).toBeNull();
    expect(parsePriceInput("-5000")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
    expect(parsePriceInput("120,5")).toBeNull();
    expect(parsePriceInput("1.20")).toBeNull();
    expect(parsePriceInput(String(MAX_PRICE + 1))).toBeNull();
  });
  it("câu báo lỗi nêu đúng khoảng giá", () => {
    expect(PRICE_RANGE_TEXT).toBe("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });
});

describe("isValidPin", () => {
  it("đúng 6 chữ số", () => {
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a456")).toBe(false);
  });
});
```

Tạo `tests/unit/admin/menu.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  changerLabel,
  menuNameError,
  nextSortOrder,
  normalizeMenuName,
} from "@/lib/admin/menu";

const items = [
  { id: "a", name: "Classic", is_archived: false, sort_order: 2 },
  { id: "b", name: "Neat", is_archived: false, sort_order: 5 },
  { id: "c", name: "Highball", is_archived: true, sort_order: 9 },
];

describe("normalizeMenuName", () => {
  it("bỏ khoảng trắng đầu/cuối và gộp khoảng trắng giữa", () => {
    expect(normalizeMenuName("  Bình   Zax ")).toBe("Bình Zax");
  });
});

describe("menuNameError", () => {
  it("tên rỗng", () => {
    expect(menuNameError("   ", items)).toBe("Nhập tên món trước khi lưu.");
  });
  it("trùng tên món đang bán, không phân biệt hoa thường và khoảng trắng", () => {
    expect(menuNameError(" classic ", items)).toBe("Đã có món đang bán tên này. Đặt tên khác.");
  });
  it("tên của món đã ẩn dùng lại được", () => {
    expect(menuNameError("Highball", items)).toBeNull();
  });
  it("đổi tên thành chính nó (khác hoa thường) không bị coi là trùng", () => {
    expect(menuNameError("CLASSIC", items, "a")).toBeNull();
  });
  it("hiện lại món đã ẩn trùng tên món đang bán thì báo trùng", () => {
    const withDup = [...items, { id: "d", name: "Neat", is_archived: true, sort_order: 10 }];
    expect(menuNameError("Neat", withDup, "d")).toBe("Đã có món đang bán tên này. Đặt tên khác.");
  });
});

describe("nextSortOrder", () => {
  it("lớn hơn mọi món, kể cả món đã ẩn", () => {
    expect(nextSortOrder(items)).toBe(10);
    expect(nextSortOrder([])).toBe(1);
  });
});

describe("changerLabel", () => {
  const me = { id: "u1", email: "owner@quan.vn" };
  it("giá khởi tạo", () => expect(changerLabel(null, me)).toBe("Khởi tạo"));
  it("chủ quán đang đăng nhập", () => expect(changerLabel("u1", me)).toBe("owner@quan.vn"));
  it("tài khoản chủ quán khác", () => expect(changerLabel("u2", me)).toBe("Chủ quán khác"));
});
```

Tạo `tests/unit/admin/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ownerErrorText } from "@/lib/admin/errors";

describe("ownerErrorText", () => {
  it("trùng tên món đang bán (unique index)", () => {
    expect(ownerErrorText({ message: 'duplicate key value violates unique constraint "menu_items_active_name_key"', code: "23505" }))
      .toBe("Đã có món đang bán tên này. Đặt tên khác.");
  });
  it("giá ngoài khoảng (CHECK của menu_items)", () => {
    expect(ownerErrorText({ message: 'new row for relation "menu_items" violates check constraint "menu_items_price_check"', code: "23514" }))
      .toBe("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });
  it("CHECK của bảng khác không bị báo nhầm là giá sai", () => {
    expect(ownerErrorText({ message: 'new row for relation "seats" violates check constraint "seats_name_check"', code: "23514" }))
      .toBe("Không thực hiện được. Kiểm tra mạng rồi thử lại.");
  });
  it("lỗi mạng có mã rỗng vẫn ra câu đầy đủ", () => {
    expect(ownerErrorText({ message: "TypeError: fetch failed", code: "" }))
      .toBe("Không thực hiện được. Kiểm tra mạng rồi thử lại.");
  });
  it("mã lỗi nghiệp vụ trong message", () => {
    expect(ownerErrorText({ message: "FORBIDDEN" })).toBe("Phiên chủ quán đã hết. Đăng nhập lại rồi thử lại.");
  });
  it("lỗi khác", () => {
    expect(ownerErrorText({ message: "fetch failed" })).toBe("Không thực hiện được. Kiểm tra mạng rồi thử lại.");
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/admin/validate.test.ts tests/unit/admin/menu.test.ts tests/unit/admin/errors.test.ts`
Expected: FAIL. `menu.test.ts` lỗi không tìm thấy `@/lib/admin/menu`; `validate.test.ts` lỗi thiếu `MIN_PRICE`/`PRICE_RANGE_TEXT` và giá 5.000.000 bị từ chối; `errors.test.ts` hai test đầu ra "Không thực hiện được…" (hai test sau có thể đã PASS vì hành vi cũ cũng ra câu chung; chúng giữ hành vi đó về sau).

- [ ] **Step 3: Viết code**

Thay toàn bộ `src/lib/admin/validate.ts`:

```ts
// SRS FR-05: giá món từ 1.000đ đến 5.000.000đ (server cũng chặn bằng CHECK)
export const MIN_PRICE = 1_000;
export const MAX_PRICE = 5_000_000;
export const PRICE_RANGE_TEXT = "Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.";

// Dấu chấm, phẩy, khoảng trắng chỉ được dùng để tách nhóm nghìn: "120,5" bị từ chối, không thành 1.205đ
export function parsePriceInput(raw: string): number | null {
  const text = raw.trim().replace(/\s*đ$/, "");
  if (!/^(\d+|\d{1,3}([.,\s]\d{3})+)$/.test(text)) return null;
  const value = parseInt(text.replace(/[.,\s]/g, ""), 10);
  return value >= MIN_PRICE && value <= MAX_PRICE ? value : null;
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
```

Tạo `src/lib/admin/menu.ts`:

```ts
// SRS FR-05, FR-05a: quy tắc tên món và nhãn người đổi giá (server cũng chặn trùng bằng unique index)
export type MenuItemLike = {
  id: string;
  name: string;
  is_archived: boolean;
  sort_order: number;
};

export function normalizeMenuName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

const key = (name: string) => normalizeMenuName(name).toLowerCase();

// exceptId: món đang được đổi tên hoặc hiện lại, không so với chính nó
export function menuNameError(
  raw: string,
  items: MenuItemLike[],
  exceptId?: string,
): string | null {
  const name = normalizeMenuName(raw);
  if (!name) return "Nhập tên món trước khi lưu.";
  const taken = items.some(
    (i) => !i.is_archived && i.id !== exceptId && key(i.name) === key(name),
  );
  return taken ? "Đã có món đang bán tên này. Đặt tên khác." : null;
}

// Món mới đứng cuối; tính cả món đã ẩn để hiện lại không đụng thứ tự
export function nextSortOrder(items: MenuItemLike[]): number {
  return Math.max(0, ...items.map((i) => i.sort_order)) + 1;
}

export function changerLabel(
  changedBy: string | null,
  user: { id: string; email?: string } | null,
): string {
  if (changedBy === null) return "Khởi tạo";
  if (user && changedBy === user.id && user.email) return user.email;
  return "Chủ quán khác";
}
```

Thay toàn bộ `src/lib/admin/errors.ts`:

```ts
import { PRICE_RANGE_TEXT } from "@/lib/admin/validate";

// Đổi lỗi từ Supabase thành câu tiếng Việt nêu vấn đề và cách khắc phục (ui-craft.md)
const TEXT: Record<string, string> = {
  FORBIDDEN: "Phiên chủ quán đã hết. Đăng nhập lại rồi thử lại.",
  INVALID_HOUR:
    "Giờ phải từ 0 đến 23, và giờ mở cửa không được trùng giờ đóng cửa.",
  INVALID_PIN_FORMAT: "PIN quán phải gồm đúng 6 chữ số.",
  ORDER_NOT_FOUND: "Không tìm thấy đơn. Tải lại trang rồi thử lại.",
  STAFF_ACCOUNT_MISSING:
    "Chưa có tài khoản nhân viên. Tạo bằng script create-user trước.",
};

// Ràng buộc của bảng menu_items (SRS FR-05). So cả mã lẫn tên ràng buộc, để CHECK của bảng khác không bị báo nhầm.
function constraintText(error: { message: string; code?: string }): string | undefined {
  if (error.code === "23505" && error.message.includes("menu_items_active_name_key"))
    return "Đã có món đang bán tên này. Đặt tên khác.";
  if (error.code === "23514" && error.message.includes("menu_items_price_check"))
    return PRICE_RANGE_TEXT;
  return undefined;
}

export function ownerErrorText(error: { message: string; code?: string }): string {
  return (
    constraintText(error) ??
    TEXT[error.message] ??
    "Không thực hiện được. Kiểm tra mạng rồi thử lại."
  );
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- tests/unit/admin/validate.test.ts tests/unit/admin/menu.test.ts tests/unit/admin/errors.test.ts`
Expected: PASS cả 3 file.

Run: `npm test`
Expected: chỉ `tests/unit/admin/PriceForm.test.tsx` có thể FAIL (nó kiểm tra câu lỗi và giới hạn 500.000đ cũ). File này bị xóa ở Task 3; ghi nhận, không sửa ở đây. Mọi file khác PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/validate.ts src/lib/admin/menu.ts src/lib/admin/errors.ts tests/unit/admin/validate.test.ts tests/unit/admin/menu.test.ts tests/unit/admin/errors.test.ts
git commit -m "feat(menu): kiểm tra tên và giá món, câu lỗi cho ràng buộc thực đơn (SRS v3.0 FR-05, FR-05a)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Trang `/admin/menu` và component `MenuManager`

**Files:**
- Create: `src/components/admin/MenuManager.tsx`
- Create: `src/app/admin/(protected)/menu/page.tsx`
- Modify: `src/components/admin/OwnerNav.tsx`
- Test: `tests/unit/admin/MenuManager.test.tsx`

**Interfaces:**
- Consumes (Task 1): `parsePriceInput`, `PRICE_RANGE_TEXT` từ `@/lib/admin/validate`; `menuNameError`, `nextSortOrder`, `normalizeMenuName`, `changerLabel` từ `@/lib/admin/menu`; `ownerErrorText` từ `@/lib/admin/errors`. Có sẵn: `useTwoStep` (`@/lib/admin/useTwoStep`), `formatVnd` (`@/lib/money`), `formatVnDateTime` (`@/lib/time`), `getBrowserSupabase`, `createServerSupabase`.
- Consumes (đợt 1, DB): bảng `menu_items(id, name, price, sort_order, is_archived)`, `menu_price_history(id, menu_item_id, price, effective_from, changed_by)` có khóa ngoại tới `menu_items`.
- Produces: `export type OwnerMenuItem = { id: string; name: string; price: number; sort_order: number; is_archived: boolean }`; `export function MenuManager({ items }: { items: OwnerMenuItem[] })`; route `/admin/menu`; mục điều hướng "Thực đơn".

- [ ] **Step 1: Viết test thất bại**

Tạo `tests/unit/admin/MenuManager.test.tsx`:

```tsx
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuManager, type OwnerMenuItem } from "@/components/admin/MenuManager";

const db = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  getBrowserSupabase: () => ({ from: () => ({ insert: db.insert, update: db.update }) }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const items: OwnerMenuItem[] = [
  { id: "a", name: "BeSpoke", price: 190000, sort_order: 1, is_archived: false },
  { id: "b", name: "Classic", price: 190000, sort_order: 2, is_archived: false },
  { id: "c", name: "Classic", price: 150000, sort_order: 3, is_archived: true },
];

beforeEach(() => {
  db.insert.mockReset().mockResolvedValue({ error: null });
  db.eq.mockReset().mockResolvedValue({ error: null });
  db.update.mockReset().mockImplementation(() => ({ eq: db.eq }));
});

describe("MenuManager", () => {
  it("thêm món hợp lệ, đứng cuối thực đơn", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món mới"), "  Highball ");
    await user.type(screen.getByLabelText("Giá món mới"), "120.000");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).toHaveBeenCalledWith({ name: "Highball", price: 120000, sort_order: 4 });
  });

  it("không thêm món trùng tên món đang bán", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món mới"), " classic ");
    await user.type(screen.getByLabelText("Giá món mới"), "100000");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Đã có món đang bán tên này. Đặt tên khác.");
  });

  it("không thêm món có giá ngoài khoảng", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món mới"), "Shot");
    await user.type(screen.getByLabelText("Giá món mới"), "999");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });

  it("đổi giá một món", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Đổi giá BeSpoke" }));
    const input = screen.getByLabelText("Giá mới cho BeSpoke");
    await user.clear(input);
    await user.type(input, "200.000");
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(db.update).toHaveBeenCalledWith({ price: 200000 });
    expect(db.eq).toHaveBeenCalledWith("id", "a");
  });

  it("ẩn món cần bấm hai lần", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Ẩn BeSpoke" }));
    expect(db.update).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Chắc chắn ẩn BeSpoke?" }));
    expect(db.update).toHaveBeenCalledWith({ is_archived: true });
    expect(db.eq).toHaveBeenCalledWith("id", "a");
  });

  it("hiện lại món đã ẩn trùng tên món đang bán thì báo trước khi gọi server", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByText("Món đã ẩn (1)"));
    await user.click(screen.getByRole("button", { name: "Hiện lại Classic" }));
    expect(db.update).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Đã có món đang bán tên này. Đặt tên khác.");
  });

  it("đổi chỗ hai món bằng hai lệnh, mỗi lệnh một dòng", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Đưa Classic lên" }));
    expect(db.update).toHaveBeenNthCalledWith(1, { sort_order: 1 });
    expect(db.eq).toHaveBeenNthCalledWith(1, "id", "b");
    expect(db.update).toHaveBeenNthCalledWith(2, { sort_order: 2 });
    expect(db.eq).toHaveBeenNthCalledWith(2, "id", "a");
  });

  it("thực đơn trống vẫn có hướng dẫn và form thêm món", () => {
    render(<MenuManager items={[]} />);
    expect(screen.getByText("Chưa có món nào đang bán. Thêm món ở ô bên dưới.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm món" })).toBeEnabled();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/admin/MenuManager.test.tsx`
Expected: FAIL, không tìm thấy `@/components/admin/MenuManager`.

- [ ] **Step 3: Viết component**

Tạo `src/components/admin/MenuManager.tsx`:

```tsx
"use client";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ownerErrorText } from "@/lib/admin/errors";
import { menuNameError, nextSortOrder, normalizeMenuName } from "@/lib/admin/menu";
import { useTwoStep } from "@/lib/admin/useTwoStep";
import { parsePriceInput, PRICE_RANGE_TEXT } from "@/lib/admin/validate";
import { formatVnd } from "@/lib/money";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type OwnerMenuItem = {
  id: string;
  name: string;
  price: number;
  sort_order: number;
  is_archived: boolean;
};

type Result = PromiseLike<{ error: { message: string; code?: string } | null }>;
type Editing = { id: string; field: "name" | "price"; value: string } | null;

// SRS FR-05: thêm, đổi tên, đổi giá, sắp xếp, ẩn và hiện lại món. Trigger ở DB tự ghi lịch sử giá.
export function MenuManager({ items }: { items: OwnerMenuItem[] }) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [editing, setEditing] = useState<Editing>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hide = useTwoStep<string>();
  const active = items.filter((i) => !i.is_archived);
  const archived = items.filter((i) => i.is_archived);

  async function run(...ops: (() => Result)[]) {
    setBusy(true);
    let failure: string | null = null;
    for (const op of ops) {
      const { error } = await op();
      if (error) {
        failure = ownerErrorText(error);
        break;
      }
    }
    setBusy(false);
    setError(failure);
    router.refresh();
    return failure === null;
  }

  async function add() {
    const nameError = menuNameError(newName, items);
    if (nameError) return setError(nameError);
    const price = parsePriceInput(newPrice);
    if (price === null) return setError(PRICE_RANGE_TEXT);
    const name = normalizeMenuName(newName);
    if (
      await run(() =>
        supabase.from("menu_items").insert({ name, price, sort_order: nextSortOrder(items) }),
      )
    ) {
      setNewName("");
      setNewPrice("");
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const item = items.find((i) => i.id === editing.id);
    if (!item) return setEditing(null);
    if (editing.field === "name") {
      const name = normalizeMenuName(editing.value);
      if (name === item.name) return setEditing(null);
      const nameError = menuNameError(name, items, item.id);
      if (nameError) return setError(nameError);
      if (await run(() => supabase.from("menu_items").update({ name }).eq("id", item.id)))
        setEditing(null);
      return;
    }
    const price = parsePriceInput(editing.value);
    if (price === null) return setError(PRICE_RANGE_TEXT);
    if (price === item.price) return setEditing(null);
    if (await run(() => supabase.from("menu_items").update({ price }).eq("id", item.id)))
      setEditing(null);
  }

  // Hai lệnh update riêng, mỗi lệnh khóa một dòng: không tạo vòng chờ với khóa FOR SHARE của create_order.
  // ponytail: hai lệnh không nằm trong một transaction; lỗi giữa chừng chỉ làm lệch thứ tự, bấm lại là sửa được
  function move(index: number, delta: -1 | 1) {
    const a = active[index];
    const b = active[index + delta];
    if (!a || !b) return;
    void run(
      () => supabase.from("menu_items").update({ sort_order: b.sort_order }).eq("id", a.id),
      () => supabase.from("menu_items").update({ sort_order: a.sort_order }).eq("id", b.id),
    );
  }

  function archive(item: OwnerMenuItem) {
    if (hide.armed !== item.id) return hide.arm(item.id);
    hide.reset();
    void run(() => supabase.from("menu_items").update({ is_archived: true }).eq("id", item.id));
  }

  function restore(item: OwnerMenuItem) {
    const nameError = menuNameError(item.name, items, item.id);
    if (nameError) return setError(nameError);
    void run(() => supabase.from("menu_items").update({ is_archived: false }).eq("id", item.id));
  }

  const small =
    "flex min-h-12 min-w-12 items-center justify-center rounded-md border border-edge px-3 text-sm disabled:opacity-40";
  const field = "min-h-12 rounded-lg border border-edge bg-transparent p-2";
  return (
    <div className="space-y-6">
      {active.length === 0 ? (
        <p className="text-sm text-ink-muted">Chưa có món nào đang bán. Thêm món ở ô bên dưới.</p>
      ) : (
        <ul className="divide-y divide-line">
          {active.map((item, i) => (
            <li key={item.id} className="space-y-2 py-3">
              {editing?.id === item.id ? (
                <form
                  className="flex flex-wrap gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveEdit();
                  }}
                >
                  <input
                    autoFocus
                    aria-label={
                      editing.field === "name" ? `Tên mới cho ${item.name}` : `Giá mới cho ${item.name}`
                    }
                    inputMode={editing.field === "price" ? "numeric" : undefined}
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                    onKeyDown={(e) => e.key === "Escape" && setEditing(null)}
                    className={`${field} min-w-40 flex-1 tabular-nums`}
                  />
                  <button type="submit" disabled={busy} className={small}>
                    Lưu
                  </button>
                  <button type="button" className={small} onClick={() => setEditing(null)}>
                    Bỏ qua
                  </button>
                </form>
              ) : (
                <div className="flex items-baseline justify-between gap-3">
                  <span className="min-w-0 break-words font-display text-xl tracking-wide">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{formatVnd(item.price)}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={small}
                  aria-label={`Đưa ${item.name} lên`}
                  disabled={busy || i === 0}
                  onClick={() => move(i, -1)}
                >
                  <ChevronUp aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className={small}
                  aria-label={`Đưa ${item.name} xuống`}
                  disabled={busy || i === active.length - 1}
                  onClick={() => move(i, 1)}
                >
                  <ChevronDown aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  className={small}
                  aria-label={`Đổi tên ${item.name}`}
                  onClick={() => setEditing({ id: item.id, field: "name", value: item.name })}
                >
                  Đổi tên
                </button>
                <button
                  type="button"
                  className={small}
                  aria-label={`Đổi giá ${item.name}`}
                  onClick={() => setEditing({ id: item.id, field: "price", value: String(item.price) })}
                >
                  Đổi giá
                </button>
                <button
                  type="button"
                  className={`${small} ml-auto ${hide.armed === item.id ? "border-danger bg-danger text-ember-ink" : "border-danger/70 text-danger"}`}
                  aria-label={hide.armed === item.id ? `Chắc chắn ẩn ${item.name}?` : `Ẩn ${item.name}`}
                  disabled={busy}
                  onClick={() => archive(item)}
                >
                  {hide.armed === item.id ? "Chắc chắn ẩn?" : "Ẩn"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add();
        }}
      >
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="VD: Highball"
          aria-label="Tên món mới"
          className={`${field} min-w-40 flex-1`}
        />
        <input
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="VD: 120.000"
          inputMode="numeric"
          aria-label="Giá món mới"
          className={`${field} w-36 tabular-nums`}
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-lg bg-ember px-5 font-bold text-ember-ink disabled:opacity-50"
        >
          Thêm món
        </button>
      </form>

      {archived.length > 0 && (
        <details>
          <summary className="flex min-h-12 cursor-pointer items-center text-sm text-ink-muted">
            Món đã ẩn ({archived.length})
          </summary>
          <ul>
            {archived.map((item) => (
              <li key={item.id} className="flex items-center gap-3 py-1">
                <span className="flex-1 text-ink-muted">{item.name}</span>
                <span className="text-sm tabular-nums text-ink-muted">{formatVnd(item.price)}</span>
                <button
                  type="button"
                  className={small}
                  aria-label={`Hiện lại ${item.name}`}
                  disabled={busy}
                  onClick={() => restore(item)}
                >
                  Hiện lại
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- tests/unit/admin/MenuManager.test.tsx`
Expected: PASS 8/8.

- [ ] **Step 5: Viết trang và thêm mục điều hướng**

Tạo `src/app/admin/(protected)/menu/page.tsx`:

```tsx
import { MenuManager, type OwnerMenuItem } from "@/components/admin/MenuManager";
import { changerLabel } from "@/lib/admin/menu";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";

type PriceRow = {
  id: number;
  price: number;
  effective_from: string;
  changed_by: string | null;
  menu_items: { name: string } | { name: string }[] | null;
};

// SRS FR-05, FR-05a: thực đơn và 20 lần đổi giá gần nhất
export default async function MenuPage() {
  const supabase = await createServerSupabase();
  const [
    { data: items, error },
    { data: history },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name, price, sort_order, is_archived")
      .order("sort_order")
      .order("name"),
    supabase
      .from("menu_price_history")
      .select("id, price, effective_from, changed_by, menu_items(name)")
      .order("effective_from", { ascending: false })
      .order("id", { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  if (error || !items) {
    return (
      <p role="alert">Không tải được thực đơn. Kiểm tra mạng rồi tải lại trang.</p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl tracking-wide">Thực đơn</h1>
      {/* Laptop: danh sách món bên trái, lịch sử đổi giá bên phải. Điện thoại: lịch sử xuống cuối */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-16">
        <section className="space-y-4">
          <SectionTitle>Món đang bán</SectionTitle>
          <MenuManager items={items as OwnerMenuItem[]} />
        </section>
        <section className="space-y-4">
          <SectionTitle>Lịch sử đổi giá</SectionTitle>
          <ul className="divide-y divide-line text-sm tabular-nums">
            {((history ?? []) as PriceRow[]).map((h) => {
              const item = Array.isArray(h.menu_items) ? h.menu_items[0] : h.menu_items;
              return (
                <li key={h.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-2">
                  <span className="font-medium">{item?.name ?? "—"}</span>
                  <span className="font-semibold">{formatVnd(h.price)}</span>
                  <span className="text-ink-muted">{formatVnDateTime(h.effective_from)}</span>
                  <span className="truncate text-right text-ink-muted">
                    {changerLabel(h.changed_by, user ? { id: user.id, email: user.email } : null)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

// Tiêu đề mục: chữ poster + vệt sáng, thay cho khung viền (DESIGN.md)
function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl tracking-wide">
      {children}
      <span aria-hidden="true" className="streak flex-1 opacity-40" />
    </h2>
  );
}
```

Trong `src/components/admin/OwnerNav.tsx`:
- Thêm `UtensilsCrossed` vào import từ `lucide-react`.
- Chèn mục Thực đơn ngay sau Tổng quan trong mảng `OWNER`:

```tsx
  {
    href: "/admin/menu",
    label: "Thực đơn",
    icon: UtensilsCrossed,
  },
```

- Đổi `grid-cols-4` thành `grid-cols-5` trong `className` của `<nav>`.

- [ ] **Step 6: Chạy kiểm tra, xác nhận đạt**

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: `npm test` PASS trừ `PriceForm.test.tsx` (xóa ở Task 3); `tsc` và `eslint` không lỗi.

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/MenuManager.tsx "src/app/admin/(protected)/menu/page.tsx" src/components/admin/OwnerNav.tsx tests/unit/admin/MenuManager.test.tsx
git commit -m "feat(menu): trang Thực đơn cho chủ quán, lịch sử đổi giá theo món (SRS v3.0 FR-05, FR-05a)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Bỏ Đơn giá chung khỏi Cài đặt, cập nhật DESIGN.md, kiểm tra cuối

**Files:**
- Modify: `src/app/admin/(protected)/settings/page.tsx`
- Modify: `src/app/admin/(protected)/settings/SettingsForms.tsx`
- Delete: `src/components/admin/PriceForm.tsx`, `tests/unit/admin/PriceForm.test.tsx`
- Modify: `DESIGN.md` (mục Layout "Trang chủ quán", mục Navigation)

**Interfaces:**
- Consumes: Task 2 (route `/admin/menu`, nav 5 mục).
- Produces: Cài đặt chỉ còn Giờ mở/đóng cửa, PIN quán, Chỗ ngồi; không còn tham chiếu `current_price`, `price_history`, `update_price`, `PriceForm`, `PriceSection` trong `src/` và `tests/`.

- [ ] **Step 1: Viết kiểm tra thất bại**

Run: `grep -rn "current_price\|price_history\|update_price\|PriceForm\|PriceSection" src tests --include=*.ts --include=*.tsx | grep -v "menu_price_history\|useCurrentPrice\|PriceBanner\|OrderScreen\|order/"`
Expected: có kết quả trong `settings/page.tsx`, `settings/SettingsForms.tsx`, `PriceForm.tsx`, `PriceForm.test.tsx`. (Các chỗ của màn order là việc của đợt 3, đã lọc ra.)

- [ ] **Step 2: Sửa Cài đặt**

Thay toàn bộ `src/app/admin/(protected)/settings/page.tsx`:

```tsx
import { BusinessHourForm } from "@/components/admin/BusinessHourForm";
import { SeatsManager, type OwnerSeat } from "@/components/admin/SeatsManager";
import { createServerSupabase } from "@/lib/supabase/server";
import { PinSection } from "./SettingsForms";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const [{ data: settings, error }, { data: seats }] = await Promise.all([
    supabase
      .from("settings")
      .select("business_day_start_hour, business_day_end_hour")
      .eq("id", 1)
      .single(),
    supabase
      .from("seats")
      .select("id, name, kind, sort_order, is_archived")
      .order("kind")
      .order("sort_order")
      .order("name"),
  ]);

  if (error || !settings) {
    return (
      <p role="alert">
        Không tải được cài đặt. Kiểm tra mạng rồi tải lại trang.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl tracking-wide">Cài đặt</h1>
      {/* Laptop: cài đặt ngắn bên trái, danh sách chỗ ngồi (dài) bên phải. Điện thoại: chỗ ngồi xuống cuối.
          Giá món nằm ở trang Thực đơn (SRS v3.0 FR-05). */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-16">
        <div className="space-y-12">
          <section className="space-y-4">
            <SectionTitle>Giờ mở cửa và giờ đóng cửa</SectionTitle>
            <div className="grid gap-6 sm:grid-cols-2">
              <BusinessHourForm
                label="Giờ mở cửa"
                rpc="update_business_day_start_hour"
                currentHour={settings.business_day_start_hour}
                note="Chỉ áp dụng cho đơn mới. Nên đổi khi quán đã đóng cửa."
              />
              <BusinessHourForm
                label="Giờ đóng cửa"
                rpc="update_business_day_end_hour"
                currentHour={settings.business_day_end_hour}
                note="Chỉ dùng để vẽ đồng hồ giờ mở cửa ở Tổng quan; không đổi ngày kinh doanh của đơn."
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>PIN quán</SectionTitle>
            <PinSection />
          </section>
        </div>

        <section className="space-y-4">
          <SectionTitle>Chỗ ngồi</SectionTitle>
          <SeatsManager seats={(seats ?? []) as OwnerSeat[]} />
        </section>
      </div>
    </div>
  );
}

// Tiêu đề mục: chữ poster + vệt sáng, thay cho khung viền (DESIGN.md)
function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl tracking-wide">
      {children}
      <span aria-hidden="true" className="streak flex-1 opacity-40" />
    </h2>
  );
}
```

Thay toàn bộ `src/app/admin/(protected)/settings/SettingsForms.tsx`:

```tsx
"use client";
import { PinForm } from "@/components/admin/PinForm";
import { ownerErrorText } from "@/lib/admin/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";

// onSave là hàm, không truyền được từ server component, nên phần ghi nằm ở wrapper client này
export function PinSection() {
  return (
    <PinForm
      onSave={async (pin) => {
        const { error } = await getBrowserSupabase().rpc("set_shop_pin", {
          p_pin: pin,
        });
        return error ? ownerErrorText(error) : null;
      }}
    />
  );
}
```

Xóa form đơn giá chung: `git rm src/components/admin/PriceForm.tsx tests/unit/admin/PriceForm.test.tsx`.

- [ ] **Step 3: Chạy lại kiểm tra, xác nhận đạt**

Run: lệnh `grep` ở Step 1.
Expected: không có kết quả.

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: tất cả PASS, không lỗi.

- [ ] **Step 4: Cập nhật DESIGN.md**

Trong mục **Layout**, đoạn "Trang chủ quán":
- Đổi "thanh điều hướng 4 cột cố định ở đáy" thành "thanh điều hướng 5 cột cố định ở đáy".
- Thay câu "Cài đặt trên `lg`: hai cột, cài đặt ngắn (Đơn giá chung, Giờ mở/đóng cửa, PIN quán) bên trái, Chỗ ngồi bên phải; điện thoại một cột, Chỗ ngồi cuối." bằng: "Cài đặt trên `lg`: hai cột, cài đặt ngắn (Giờ mở/đóng cửa, PIN quán) bên trái, Chỗ ngồi bên phải; điện thoại một cột, Chỗ ngồi cuối. Thực đơn trên `lg`: hai cột, danh sách món (tên Anton, giá canh phải, hàng nút bên dưới) bên trái, lịch sử đổi giá bên phải; điện thoại một cột, lịch sử cuối."

Trong mục **Navigation**: thay "Bốn mục: Tổng quan, Lịch sử đơn hàng, Cài đặt, Màn hình order." bằng "Năm mục: Tổng quan, Thực đơn, Lịch sử đơn hàng, Cài đặt, Màn hình order." và "thanh 4 cột" bằng "thanh 5 cột".

- [ ] **Step 5: Kiểm tra giao diện**

Run: `C:/Users/HP/.claude/skills/impeccable/scripts/impeccable detect --json src/components/admin/MenuManager.tsx "src/app/admin/(protected)/menu/page.tsx" src/components/admin/OwnerNav.tsx "src/app/admin/(protected)/settings/page.tsx"`
Expected: không có lỗi máy móc mới (cảnh báo `design-system-font-size` 7px có sẵn ở `BusinessDayArc.tsx` không thuộc đợt này). Sửa mọi lỗi mới mà nó báo.

Kiểm tra tay trên trình duyệt (dev server do người dùng chạy, hoặc `npm run dev`; tài khoản thử từ README, `owner@quan.vn`): mở `http://localhost:3000/admin/menu` ở khung 390px và ≥ 1024px. Thêm một món, đổi giá, đổi tên, sắp xếp, ẩn (hai bước), hiện lại; lịch sử đổi giá có dòng mới với email chủ quán. Thanh điều hướng điện thoại có đủ 5 icon, không tràn.

- [ ] **Step 6: Giao `srs-reviewer`, commit**

Prompt cho agent `srs-reviewer`: đối chiếu `git diff <BASE của đợt 2>..HEAD -- src/ DESIGN.md` với SRS v3.0 (FR-05, FR-05a, R32), GLOSSARY, `.claude/rules/owner-ui.md`, `.claude/rules/ui-craft.md`. Ghi chú: màn order, Tổng quan, Lịch sử còn hỏng là việc của đợt 3–4.
Expected: "khớp SRS". Sửa mọi chỗ lệch, chạy lại `npm test`, rồi commit:

```bash
git add -A src tests DESIGN.md
git commit -m "feat(settings): bỏ Đơn giá chung khỏi Cài đặt; DESIGN.md điều hướng 5 mục, trang Thực đơn (SRS v3.0 FR-05)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
