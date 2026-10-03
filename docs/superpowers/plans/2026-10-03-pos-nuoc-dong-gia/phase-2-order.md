# Giai đoạn 2: Màn hình order (nhân viên)

> Thuộc kế hoạch [POS Quán Nước Đồng Giá](../2026-10-03-pos-nuoc-dong-gia.md). Đọc phần **Global Constraints** và **Hợp đồng dùng chung** trong file đó trước khi làm. Mọi RPC đã có từ Giai đoạn 1.

**Chạy test:** `npm test`. Các test của giai đoạn này **không cần** Supabase đang chạy, vì API được giả lập (mock).

**Biến môi trường** (`.env.local`, đã nằm trong `.gitignore`). Lấy URL và key bằng lệnh `npx supabase status -o env`:

```text
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
NEXT_PUBLIC_STAFF_EMAIL=nhanvien@quan.local
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

---

### Task 7: API client và danh sách đơn của điện thoại

**Files:**
- Create: `src/lib/supabase/client.ts`, `src/lib/api.ts`, `src/lib/order/myOrders.ts`
- Test: `tests/unit/api.test.ts`, `tests/unit/order/myOrders.test.ts`

**Interfaces:**
- Consumes: các RPC `create_order`, `cancel_order`, `list_orders_by_ids`, `list_active_seats`.
- Produces:
  - Các kiểu `CreateOrderInput`, `CreatedOrder`, `MyOrder`, `ActiveSeat`, `StaffApi`, đúng như file tổng quan.
  - `class NetworkError extends Error`, `class RpcError extends Error { code: string }`, `type RpcClient`.
  - `createStaffApi(getClient: () => RpcClient): StaffApi`. Client được lấy lúc gọi, không phải lúc tạo, nên không chạy khi render ở server.
  - `getBrowserSupabase(): SupabaseClient`, `getRpcClient(): RpcClient`.
  - `rememberOrder(id: string, now?: number): void` và `getMyOrderIds(now?: number): string[]`. Danh sách lưu trong `localStorage["pos.myOrders"]`, mới nhất ở đầu, chỉ giữ đơn trong 36 giờ gần nhất và tối đa 100 đơn.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/api.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createStaffApi, NetworkError, RpcError, type RpcClient } from "@/lib/api";

function clientReturning(result: { data: unknown; error: { message: string; code?: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as RpcClient, rpc };
}

describe("createStaffApi", () => {
  it("createOrder ánh xạ đúng tham số RPC", async () => {
    const created = { id: "o1", unit_price: 25000, total_amount: 175000, price_changed: false,
      created_at: "2026-10-03T05:00:00Z", business_date: "2026-10-03", duplicate: false };
    const { client, rpc } = clientReturning({ data: created, error: null });
    const result = await createStaffApi(() => client).createOrder({
      id: "o1", quantity: 7, seatId: "s1", isTakeaway: false, clientPrice: 25000 });
    expect(result).toEqual(created);
    expect(rpc).toHaveBeenCalledWith("create_order", {
      p_id: "o1", p_quantity: 7, p_seat_id: "s1", p_is_takeaway: false, p_client_price: 25000 });
  });

  it("listOrdersByIds với danh sách rỗng thì không gọi server", async () => {
    const { client, rpc } = clientReturning({ data: [], error: null });
    expect(await createStaffApi(() => client).listOrdersByIds([])).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("lỗi có mã SQLSTATE thành RpcError mang mã lỗi", async () => {
    const { client } = clientReturning({ data: null, error: { message: "CANCEL_WINDOW_EXPIRED", code: "P0001" } });
    const err = await createStaffApi(() => client).cancelOrder("o1").catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.code).toBe("CANCEL_WINDOW_EXPIRED");
  });

  it("lỗi không có mã (fetch thất bại) thành NetworkError", async () => {
    const { client } = clientReturning({ data: null, error: { message: "TypeError: Failed to fetch", code: "" } });
    await expect(createStaffApi(() => client).listActiveSeats()).rejects.toBeInstanceOf(NetworkError);
  });

  it("rpc ném exception thì thành NetworkError", async () => {
    const client = { rpc: vi.fn().mockRejectedValue(new TypeError("offline")) } as unknown as RpcClient;
    await expect(createStaffApi(() => client).listActiveSeats()).rejects.toBeInstanceOf(NetworkError);
  });
});
```

`tests/unit/order/myOrders.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getMyOrderIds, rememberOrder } from "@/lib/order/myOrders";

const HOUR = 3_600_000;

describe("myOrders", () => {
  it("nhớ đơn, mới nhất ở đầu, không trùng", () => {
    rememberOrder("a", 1000);
    rememberOrder("b", 2000);
    rememberOrder("a", 3000);
    expect(getMyOrderIds(3000)).toEqual(["a", "b"]);
  });

  it("bỏ đơn cũ hơn 36 giờ", () => {
    rememberOrder("old", 0);
    rememberOrder("new", 37 * HOUR);
    expect(getMyOrderIds(37 * HOUR)).toEqual(["new"]);
  });

  it("giữ tối đa 100 đơn", () => {
    for (let i = 0; i < 120; i++) rememberOrder(`o${i}`, i);
    const ids = getMyOrderIds(200);
    expect(ids).toHaveLength(100);
    expect(ids[0]).toBe("o119");
  });

  it("dữ liệu hỏng thì coi như rỗng", () => {
    localStorage.setItem("pos.myOrders", "{không phải json");
    expect(getMyOrderIds()).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có module.

- [ ] **Step 3: Cài đặt**

`src/lib/api.ts`:

```ts
export type CreateOrderInput = { id: string; quantity: number; seatId: string | null; isTakeaway: boolean; clientPrice: number };
export type CreatedOrder = {
  id: string; unit_price: number; total_amount: number; price_changed: boolean;
  created_at: string; business_date: string; duplicate: boolean;
};
export type MyOrder = {
  id: string; quantity: number; unit_price: number; total_amount: number;
  seat_name: string | null; status: "paid" | "cancelled"; created_at: string;
};
export type ActiveSeat = { id: string; name: string; kind: "table" | "counter" };
export interface StaffApi {
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  cancelOrder(orderId: string): Promise<void>;
  listOrdersByIds(ids: string[]): Promise<MyOrder[]>;
  listActiveSeats(): Promise<ActiveSeat[]>;
}

export type RpcClient = {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

export class NetworkError extends Error {
  constructor(message = "NETWORK") {
    super(message);
    this.name = "NetworkError";
  }
}

export class RpcError extends Error {
  constructor(public code: string) {
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
    throw new RpcError(error.message);
  }
  return data as T;
}

export function createStaffApi(getClient: () => RpcClient): StaffApi {
  return {
    createOrder: (input) =>
      call(getClient(), "create_order", {
        p_id: input.id,
        p_quantity: input.quantity,
        p_seat_id: input.seatId,
        p_is_takeaway: input.isTakeaway,
        p_client_price: input.clientPrice,
      }),
    cancelOrder: async (orderId) => {
      await call(getClient(), "cancel_order", { p_order_id: orderId });
    },
    listOrdersByIds: async (ids) => (ids.length === 0 ? [] : call(getClient(), "list_orders_by_ids", { p_ids: ids })),
    listActiveSeats: () => call(getClient(), "list_active_seats"),
  };
}
```

`src/lib/supabase/client.ts`:

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RpcClient } from "@/lib/api";

let client: SupabaseClient | undefined;

export function getBrowserSupabase(): SupabaseClient {
  client ??= createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  return client;
}

export function getRpcClient(): RpcClient {
  return getBrowserSupabase() as unknown as RpcClient;
}
```

`src/lib/order/myOrders.ts`:

```ts
const KEY = "pos.myOrders";
const MAX_ENTRIES = 100;
const MAX_AGE_MS = 36 * 3_600_000;

type Entry = { id: string; at: number };

function read(): Entry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((e) => typeof e?.id === "string" && typeof e?.at === "number") : [];
  } catch {
    return [];
  }
}

function fresh(entries: Entry[], now: number): Entry[] {
  return entries.filter((e) => now - e.at <= MAX_AGE_MS).slice(0, MAX_ENTRIES);
}

export function rememberOrder(id: string, now = Date.now()): void {
  const entries = fresh([{ id, at: now }, ...read().filter((e) => e.id !== id)], now);
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Bộ nhớ trình duyệt bị chặn: danh sách "Đơn vừa tạo" sẽ trống, việc bán hàng không bị ảnh hưởng
  }
}

export function getMyOrderIds(now = Date.now()): string[] {
  return fresh(read(), now).map((e) => e.id);
}
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib tests/unit
git commit -m "feat(order): typed staff RPC client and per-phone order list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Bàn phím số lượng và định dạng giờ

**Files:**
- Create: `src/lib/order/quantity.ts`, `src/lib/time.ts`, `src/components/order/QuantityPad.tsx`
- Test: `tests/unit/order/quantity.test.ts`, `tests/unit/time.test.ts`, `tests/unit/order/QuantityPad.test.tsx`

**Interfaces:**
- Produces:
  - `MAX_QUANTITY = 500`.
  - `type QuantityAction = { type: "add"; amount: number } | { type: "decrement" } | { type: "clear" } | { type: "set"; raw: string }`.
  - `quantityReducer(state: number, action: QuantityAction): number`.
  - `formatVnDateTime(iso: string): string`, trả về `"dd/MM/yyyy HH:mm:ss"`.
  - `formatVnTime(iso: string): string`, trả về `"HH:mm"`.
  - `formatIsoDate(date: string): string`, ví dụ `"2026-10-03"` thành `"03/10/2026"`.
  - `<QuantityPad quantity={number} dispatch={(a: QuantityAction) => void} />`.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/order/quantity.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { MAX_QUANTITY, quantityReducer } from "@/lib/order/quantity";

describe("quantityReducer", () => {
  it("các nút + cộng dồn", () => {
    let q = quantityReducer(0, { type: "add", amount: 5 });
    q = quantityReducer(q, { type: "add", amount: 2 });
    expect(q).toBe(7);
  });
  it("không vượt quá MAX_QUANTITY", () => {
    expect(quantityReducer(495, { type: "add", amount: 10 })).toBe(MAX_QUANTITY);
  });
  it("-1 không xuống dưới 0", () => {
    expect(quantityReducer(1, { type: "decrement" })).toBe(0);
    expect(quantityReducer(0, { type: "decrement" })).toBe(0);
  });
  it("clear đưa về 0", () => {
    expect(quantityReducer(42, { type: "clear" })).toBe(0);
  });
  it("set chỉ nhận chữ số và chặn ở MAX_QUANTITY", () => {
    expect(quantityReducer(0, { type: "set", raw: "12" })).toBe(12);
    expect(quantityReducer(0, { type: "set", raw: "1a2" })).toBe(12);
    expect(quantityReducer(5, { type: "set", raw: "" })).toBe(0);
    expect(quantityReducer(0, { type: "set", raw: "9999" })).toBe(MAX_QUANTITY);
    expect(quantityReducer(0, { type: "set", raw: "-3" })).toBe(3);
  });
});
```

`tests/unit/time.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { formatIsoDate, formatVnDateTime, formatVnTime } from "@/lib/time";

describe("time helpers", () => {
  it("đổi UTC sang giờ Việt Nam", () => {
    expect(formatVnDateTime("2026-10-03T22:59:05Z")).toBe("04/10/2026 05:59:05");
    expect(formatVnTime("2026-10-03T22:59:05Z")).toBe("05:59");
  });
  it("định dạng ngày kinh doanh", () => {
    expect(formatIsoDate("2026-10-03")).toBe("03/10/2026");
  });
});
```

`tests/unit/order/QuantityPad.test.tsx`:

```tsx
import { useReducer } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityPad } from "@/components/order/QuantityPad";
import { quantityReducer } from "@/lib/order/quantity";

function Harness() {
  const [q, dispatch] = useReducer(quantityReducer, 0);
  return <QuantityPad quantity={q} dispatch={dispatch} />;
}

describe("QuantityPad", () => {
  it("bấm +5 rồi +2 ra 7, -1 ra 6, Xóa ra 0", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Số lượng cốc");
    await user.click(screen.getByRole("button", { name: "+5" }));
    await user.click(screen.getByRole("button", { name: "+2" }));
    expect(input).toHaveValue("7");
    await user.click(screen.getByRole("button", { name: "−1" }));
    expect(input).toHaveValue("6");
    await user.click(screen.getByRole("button", { name: "Xóa" }));
    expect(input).toHaveValue("");
  });

  it("gõ trực tiếp bằng bàn phím số", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Số lượng cốc");
    await user.type(input, "9999");
    expect(input).toHaveValue("500");
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có module.

- [ ] **Step 3: Cài đặt**

`src/lib/order/quantity.ts`:

```ts
export const MAX_QUANTITY = 500;

export type QuantityAction =
  | { type: "add"; amount: number }
  | { type: "decrement" }
  | { type: "clear" }
  | { type: "set"; raw: string };

export function quantityReducer(state: number, action: QuantityAction): number {
  switch (action.type) {
    case "add":
      return Math.min(MAX_QUANTITY, state + action.amount);
    case "decrement":
      return Math.max(0, state - 1);
    case "clear":
      return 0;
    case "set": {
      const digits = action.raw.replace(/\D/g, "");
      if (!digits) return 0;
      return Math.min(MAX_QUANTITY, parseInt(digits, 10));
    }
  }
}
```

`src/lib/time.ts`:

```ts
const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit",
  hourCycle: "h23",
});

function vnParts(iso: string): Record<string, string> {
  return Object.fromEntries(formatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
}

export function formatVnDateTime(iso: string): string {
  const p = vnParts(iso);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
}

export function formatVnTime(iso: string): string {
  const p = vnParts(iso);
  return `${p.hour}:${p.minute}`;
}

export function formatIsoDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
```

`src/components/order/QuantityPad.tsx`:

```tsx
"use client";
import type { QuantityAction } from "@/lib/order/quantity";

const QUICK_ADDS = [1, 2, 5, 10];
const btn = "min-h-14 rounded-xl text-2xl font-bold active:scale-95 transition-transform";

export function QuantityPad({ quantity, dispatch }: { quantity: number; dispatch: (a: QuantityAction) => void }) {
  return (
    <div className="space-y-3">
      <input
        aria-label="Số lượng cốc"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0"
        value={quantity === 0 ? "" : String(quantity)}
        onChange={(e) => dispatch({ type: "set", raw: e.target.value })}
        className="w-full rounded-xl border-2 border-slate-300 py-3 text-center text-6xl font-extrabold tabular-nums"
      />
      <div className="grid grid-cols-4 gap-2">
        {QUICK_ADDS.map((n) => (
          <button key={n} type="button" className={`${btn} bg-sky-600 text-white`} onClick={() => dispatch({ type: "add", amount: n })}>
            +{n}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className={`${btn} bg-slate-200`} onClick={() => dispatch({ type: "decrement" })}>
          −1
        </button>
        <button type="button" className={`${btn} bg-slate-200`} onClick={() => dispatch({ type: "clear" })}>
          Xóa
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS.

- [ ] **Step 5: Commit**

```bash
git add src tests/unit
git commit -m "feat(order): cumulative quantity pad and VN time formatting

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Đăng nhập bằng PIN quán, trạng thái mạng và giá realtime

**Files:**
- Create: `src/components/order/PinLogin.tsx`, `src/components/order/PriceBanner.tsx`
- Create: `src/hooks/useOnline.ts`, `src/hooks/useCurrentPrice.ts`
- Create: `src/app/login/page.tsx`
- Test: `tests/unit/order/PinLogin.test.tsx`, `tests/unit/order/PriceBanner.test.tsx`

**Interfaces:**
- Consumes: `getBrowserSupabase`, `formatVnd`.
- Produces:
  - `<PinLogin onLogin={(pin: string) => Promise<string | null>} />`: `onLogin` trả về thông báo lỗi, hoặc `null` nếu thành công.
  - `<PriceBanner price={number | null} offline={boolean} />`: phần tử gốc có `data-testid="price-banner"`, và `data-highlight="true"` trong 3 giây sau khi giá đổi.
  - `useOnline(): boolean`.
  - `useCurrentPrice(): number | null`: fetch `settings`, đăng ký realtime, và fetch lại khi có mạng lại hoặc khi app quay về foreground.
  - Trang `/login`: đăng nhập bằng `NEXT_PUBLIC_STAFF_EMAIL` với PIN làm mật khẩu.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/order/PinLogin.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinLogin } from "@/components/order/PinLogin";

async function typePin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const d of pin) await user.click(screen.getByRole("button", { name: d }));
}

describe("PinLogin", () => {
  it("chỉ bật nút Vào khi đã nhập đủ 6 số", async () => {
    const user = userEvent.setup();
    render(<PinLogin onLogin={vi.fn()} />);
    await typePin(user, "12345");
    expect(screen.getByRole("button", { name: "Vào" })).toBeDisabled();
    await typePin(user, "6");
    expect(screen.getByRole("button", { name: "Vào" })).toBeEnabled();
  });

  it("gửi PIN đã nhập", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(null);
    render(<PinLogin onLogin={onLogin} />);
    await typePin(user, "123456");
    await user.click(screen.getByRole("button", { name: "Vào" }));
    expect(onLogin).toHaveBeenCalledWith("123456");
  });

  it("có lỗi thì hiện thông báo và xóa PIN đã nhập", async () => {
    const user = userEvent.setup();
    render(<PinLogin onLogin={vi.fn().mockResolvedValue("Sai mã PIN.")} />);
    await typePin(user, "000000");
    await user.click(screen.getByRole("button", { name: "Vào" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sai mã PIN.");
    expect(screen.getByRole("button", { name: "Vào" })).toBeDisabled();
  });

  it("nút Xóa số bỏ chữ số cuối", async () => {
    const user = userEvent.setup();
    render(<PinLogin onLogin={vi.fn()} />);
    await typePin(user, "123456");
    await user.click(screen.getByRole("button", { name: "Xóa số" }));
    expect(screen.getByRole("button", { name: "Vào" })).toBeDisabled();
  });
});
```

`tests/unit/order/PriceBanner.test.tsx`:

```tsx
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { PriceBanner } from "@/components/order/PriceBanner";

describe("PriceBanner", () => {
  afterEach(() => vi.useRealTimers());

  it("hiển thị đơn giá theo định dạng VND", () => {
    render(<PriceBanner price={25000} offline={false} />);
    expect(screen.getByText("Đơn giá: 25.000đ/cốc")).toBeInTheDocument();
  });

  it("làm nổi bật 3 giây khi giá thay đổi", () => {
    vi.useFakeTimers();
    const { rerender } = render(<PriceBanner price={25000} offline={false} />);
    const banner = screen.getByTestId("price-banner");
    expect(banner).toHaveAttribute("data-highlight", "false");
    rerender(<PriceBanner price={30000} offline={false} />);
    expect(screen.getByText("Đơn giá: 30.000đ/cốc")).toBeInTheDocument();
    expect(banner).toHaveAttribute("data-highlight", "true");
    act(() => vi.advanceTimersByTime(3000));
    expect(banner).toHaveAttribute("data-highlight", "false");
  });

  it("không làm nổi bật ở lần tải giá đầu tiên", () => {
    const { rerender } = render(<PriceBanner price={null} offline={false} />);
    expect(screen.getByText("Đang tải giá…")).toBeInTheDocument();
    rerender(<PriceBanner price={25000} offline={false} />);
    expect(screen.getByTestId("price-banner")).toHaveAttribute("data-highlight", "false");
  });

  it("hiện nhãn Mất mạng", () => {
    render(<PriceBanner price={25000} offline />);
    expect(screen.getByText("Mất mạng")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có component.

- [ ] **Step 3: Cài đặt các component**

`src/components/order/PinLogin.tsx`:

```tsx
"use client";
import { useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function PinLogin({ onLogin }: { onLogin: (pin: string) => Promise<string | null> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function press(key: string) {
    setError(null);
    if (key === "⌫") setPin((p) => p.slice(0, -1));
    else if (key) setPin((p) => (p.length < 6 ? p + key : p));
  }

  async function submit() {
    setBusy(true);
    const failure = await onLogin(pin);
    setBusy(false);
    if (failure) {
      setError(failure);
      setPin("");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold">Nhập PIN quán</h1>
      <p aria-label="PIN đã nhập" className="text-center text-4xl tracking-[0.5em]">
        {"●".repeat(pin.length).padEnd(6, "○")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, i) =>
          key ? (
            <button key={i} type="button" aria-label={key === "⌫" ? "Xóa số" : key} onClick={() => press(key)}
              className="min-h-14 rounded-xl bg-slate-200 text-2xl font-bold active:scale-95">
              {key}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      {error && <p role="alert" className="text-center font-medium text-red-600">{error}</p>}
      <button type="button" disabled={pin.length !== 6 || busy} onClick={() => void submit()}
        className="min-h-14 w-full rounded-xl bg-emerald-600 text-xl font-bold text-white disabled:bg-slate-300">
        Vào
      </button>
    </div>
  );
}
```

`src/components/order/PriceBanner.tsx`:

```tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/lib/money";

export function PriceBanner({ price, offline }: { price: number | null; offline: boolean }) {
  const [highlight, setHighlight] = useState(false);
  const previous = useRef(price);

  useEffect(() => {
    const before = previous.current;
    previous.current = price;
    if (before === null || price === null || before === price) return;
    setHighlight(true);
    const timer = setTimeout(() => setHighlight(false), 3000);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <div data-testid="price-banner" data-highlight={highlight ? "true" : "false"}
      className={`flex items-center justify-between rounded-xl p-3 transition-colors ${highlight ? "bg-yellow-300" : "bg-slate-100"}`}>
      <span className="text-xl font-semibold">
        {price === null ? "Đang tải giá…" : `Đơn giá: ${formatVnd(price)}/cốc`}
      </span>
      {offline && <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">Mất mạng</span>}
    </div>
  );
}
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS.

- [ ] **Step 5: Viết các hook và trang `/login`**

Phần này chỉ là nối các thành phần với nhau, và được kiểm tra bằng tay ở Step 6 cùng danh sách kiểm tra tay ở Task 14.

`src/hooks/useOnline.ts`:

```ts
"use client";
import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function useOnline(): boolean {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
}
```

`src/hooks/useCurrentPrice.ts`:

```ts
"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function useCurrentPrice(): number | null {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const client = getBrowserSupabase();
    let active = true;
    const fetchPrice = async () => {
      const { data } = await client.from("settings").select("current_price").eq("id", 1).single();
      if (active && data) setPrice(data.current_price);
    };
    void fetchPrice();

    const channel = client
      .channel("settings-price")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "settings" },
        (payload) => { if (active) setPrice((payload.new as { current_price: number }).current_price); })
      .subscribe();

    // iOS ngắt kết nối realtime khi app chạy nền, nên fetch lại khi quay lại
    const refetch = () => { if (document.visibilityState === "visible") void fetchPrice(); };
    window.addEventListener("online", refetch);
    document.addEventListener("visibilitychange", refetch);
    return () => {
      active = false;
      window.removeEventListener("online", refetch);
      document.removeEventListener("visibilitychange", refetch);
      void client.removeChannel(channel);
    };
  }, []);

  return price;
}
```

`src/app/login/page.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { PinLogin } from "@/components/order/PinLogin";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function StaffLoginPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-sm p-4">
      <PinLogin
        onLogin={async (pin) => {
          const { error } = await getBrowserSupabase().auth.signInWithPassword({
            email: process.env.NEXT_PUBLIC_STAFF_EMAIL!,
            password: pin,
          });
          if (!error) {
            router.replace("/order");
            router.refresh();
            return null;
          }
          if (error.status === 429) return "Nhập sai quá nhiều lần, thử lại sau ít phút.";
          if (error.status === 400) return "Sai mã PIN.";
          return "Không kết nối được. Kiểm tra mạng rồi thử lại.";
        }}
      />
    </main>
  );
}
```

- [ ] **Step 6: Kiểm tra tay**

Phải làm xong Task 11 (đã có script `create-user` và middleware) thì mới kiểm tra được đầy đủ. Còn bây giờ chỉ cần chạy `npm run dev`, mở `/login`, rồi kiểm tra: bàn phím nhập được, và nút "Vào" chỉ bật khi đã nhập đủ 6 số.

- [ ] **Step 7: Commit**

```bash
git add src tests/unit
git commit -m "feat(order): shop PIN login, online status, realtime price banner

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Màn hình order hoàn chỉnh

**Files:**
- Create: `src/components/order/SeatPicker.tsx`, `src/components/order/RecentOrders.tsx`, `src/components/order/ConfirmBar.tsx`, `src/components/order/OrderScreen.tsx`, `src/lib/haptics.ts`
- Copy: `docs/brand/nuoc-noi-wordmark.png` và `docs/brand/nuoc-noi-wordmark-small.png` → `public/brand/` (logo nền trong suốt; luôn dùng file này, không vẽ lại logo)
- Create: `src/app/order/page.tsx`
- Modify: `src/app/page.tsx` (thay toàn bộ nội dung), `src/app/layout.tsx` (đổi `lang` thành `"vi"` và đổi metadata)
- Test: `tests/unit/order/OrderScreen.test.tsx`

**Interfaces:**
- Consumes: mọi thứ từ Task 7 đến Task 9.
- Produces:
  - `type SeatSelection = { kind: "none" } | { kind: "seat"; id: string; name: string } | { kind: "takeaway" }`.
  - `<SeatPicker seats={ActiveSeat[]} selection={SeatSelection} onChange={(s: SeatSelection) => void} />`: hai nhóm có nhãn, **"Ghế quầy"** trước rồi **"Bàn"** (mỗi nhóm là `role="group"` với `aria-label` tương ứng), cộng nút cố định "Mang về" (SRS FR-03b).
  - `type OrderScreenProps = { api: StaffApi; price: number | null; online: boolean; onUnauthorized: () => void; newId?: () => string; now?: () => Date }`.
  - `<OrderScreen {...OrderScreenProps} />`.

**Hành vi chính** (SRS FR-04, FR-04b):
- Bấm gửi thì nút chuyển sang "Đang gửi…". **Chỉ reset sau khi server xác nhận.**
- **Gửi thất bại:** giữ nguyên dữ liệu đã nhập. Lần bấm lại dùng **cùng `id`**, vì `pendingId` chỉ được xóa khi gửi thành công.
- **Server trả `duplicate: true`:** báo cho nhân viên biết đơn này đã được ghi từ lần gửi trước. Số cốc trong thông báo lấy từ kết quả server (`total_amount / unit_price`).
- **Lỗi `FORBIDDEN`** (phiên đã bị thu hồi, ví dụ vì PIN quán vừa đổi): gọi `onUnauthorized()`.
- **Phản hồi ngay trên thanh Xác nhận** (brief `docs/design/order-brief.md`):
  - Gửi thành công thì chính thanh Xác nhận đổi thành "Đã tạo đơn N cốc – X đ" kèm nút **Hoàn tác** trong 5 giây. Không dùng thông báo nổi.
  - Đồng thời điện thoại rung ngắn 30ms (chỉ có tác dụng trên Android).
  - Chạm vào bất kỳ phím số lượng hay chỗ ngồi nào thì thanh trở lại thành "Xác nhận đơn" ngay.
- **Bố cục, màu và chuyển động "vệt sáng"** làm theo brief và `.claude/rules/ui-craft.md`. Các class Tailwind dưới đây chỉ là giá trị tạm.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/order/OrderScreen.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderScreen, type OrderScreenProps } from "@/components/order/OrderScreen";
import { NetworkError, RpcError, type CreateOrderInput, type CreatedOrder, type StaffApi } from "@/lib/api";
import { getMyOrderIds } from "@/lib/order/myOrders";

const NOW = new Date("2026-10-03T05:00:00Z");

const created = (i: CreateOrderInput, over: Partial<CreatedOrder> = {}): CreatedOrder => ({
  id: i.id, unit_price: 25000, total_amount: i.quantity * 25000, price_changed: false,
  created_at: NOW.toISOString(), business_date: "2026-10-03", duplicate: false, ...over,
});

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
    api, price: 25000, online: true, onUnauthorized: vi.fn(),
    newId: () => `order-${++n}`, now: () => NOW, ...overrides,
  };
  const user = userEvent.setup();
  const utils = render(<OrderScreen {...props} />);
  return { api, props, user, ...utils };
}

describe("OrderScreen", () => {
  it("hiện thành tiền trước khi xác nhận, gửi đơn, rồi reset và nhớ đơn", async () => {
    const { api, user } = setup();
    await user.click(screen.getByRole("button", { name: "+5" }));
    await user.click(screen.getByRole("button", { name: "+2" }));
    expect(screen.getByTestId("total")).toHaveTextContent("175.000đ");
    await user.click(await screen.findByRole("button", { name: "Quầy 1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));

    expect(api.createOrder).toHaveBeenCalledWith({ id: "order-1", quantity: 7, seatId: "s1", isTakeaway: false, clientPrice: 25000 });
    expect(await screen.findByRole("status")).toHaveTextContent("Đã tạo đơn 7 cốc – 175.000đ");
    expect(screen.getByLabelText("Số lượng cốc")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Quầy 1" })).toHaveAttribute("aria-pressed", "false");
    expect(getMyOrderIds()).toEqual(["order-1"]);
  });

  it("chia chỗ ngồi thành hai nhóm Ghế quầy và Bàn, ghế quầy đứng trước", async () => {
    setup();
    const counterGroup = await screen.findByRole("group", { name: "Ghế quầy" });
    const tableGroup = screen.getByRole("group", { name: "Bàn" });
    expect(within(counterGroup).getByRole("button", { name: "Quầy 1" })).toBeInTheDocument();
    expect(within(tableGroup).getByRole("button", { name: "Bàn 1" })).toBeInTheDocument();
    expect(counterGroup.compareDocumentPosition(tableGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mang về" })).toBeInTheDocument();
  });

  it("khóa nút Xác nhận khi số lượng bằng 0 hoặc chưa có giá", () => {
    setup({ price: null });
    expect(screen.getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
  });

  it("mất mạng: khóa nút và hiện cảnh báo", async () => {
    const { user } = setup({ online: false });
    await user.click(screen.getByRole("button", { name: "+1" }));
    expect(screen.getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
    expect(screen.getByText("Mất mạng – chưa gửi được đơn")).toBeInTheDocument();
  });

  it("gửi thất bại vì mạng thì giữ dữ liệu, bấm lại dùng cùng id", async () => {
    const createOrder = vi.fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const { user } = setup({}, { createOrder });
    await user.click(screen.getByRole("button", { name: "+2" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("kiểm tra mạng");
    expect(screen.getByLabelText("Số lượng cốc")).toHaveValue("2");

    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByRole("status");
    expect(createOrder.mock.calls.map((c) => c[0].id)).toEqual(["order-1", "order-1"]);
  });

  it("server báo đơn đã được ghi từ lần gửi trước", async () => {
    const { user } = setup({}, {
      createOrder: vi.fn(async (i: CreateOrderInput) => created(i, { duplicate: true, total_amount: 75000 })),
    });
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("đã được ghi từ lần gửi trước (3 cốc)");
  });

  it("server tính giá khác thì báo cho nhân viên", async () => {
    const { user } = setup({}, {
      createOrder: vi.fn(async (i: CreateOrderInput) => created(i, { unit_price: 30000, total_amount: 30000, price_changed: true })),
    });
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Giá đã đổi: đơn được tính 30.000đ/cốc, thành tiền 30.000đ.");
  });

  it("Hoàn tác gọi cancelOrder", async () => {
    const { api, user } = setup();
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(await screen.findByRole("button", { name: "Hoàn tác" }));
    await waitFor(() => expect(api.cancelOrder).toHaveBeenCalledWith("order-1"));
  });

  it("gửi thành công thì rung 30ms", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByRole("status");
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it("chạm phím số lượng khi đang hiện phản hồi thì thanh trở lại Xác nhận", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByRole("button", { name: "Hoàn tác" });
    await user.click(screen.getByRole("button", { name: "+2" }));
    expect(screen.queryByRole("button", { name: "Hoàn tác" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận đơn" })).toBeEnabled();
  });

  it("chỉ hiện nút Hủy cho đơn còn trong cửa sổ hủy 5 phút", async () => {
    // getMyOrderIds lọc theo đồng hồ thật, nên `at` dùng Date.now() chứ không dùng NOW
    localStorage.setItem("pos.myOrders", JSON.stringify([
      { id: "new", at: Date.now() }, { id: "old", at: Date.now() },
    ]));
    setup({}, {
      listOrdersByIds: vi.fn(async () => [
        { id: "new", quantity: 1, unit_price: 25000, total_amount: 25000, seat_name: null, status: "paid" as const,
          created_at: new Date(NOW.getTime() - 60_000).toISOString() },
        { id: "old", quantity: 2, unit_price: 25000, total_amount: 50000, seat_name: "Quầy 1", status: "paid" as const,
          created_at: new Date(NOW.getTime() - 6 * 60_000).toISOString() },
      ]),
    });
    const list = await screen.findByRole("region", { name: "Đơn vừa tạo" });
    await waitFor(() => expect(list.querySelectorAll("li")).toHaveLength(2));
    expect(screen.getAllByRole("button", { name: "Hủy" })).toHaveLength(1);
  });

  it("phiên bị thu hồi (FORBIDDEN) thì gọi onUnauthorized", async () => {
    const { props } = setup({}, {
      listActiveSeats: vi.fn(async () => { throw new RpcError("FORBIDDEN"); }),
    });
    await waitFor(() => expect(props.onUnauthorized).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có `OrderScreen`.

- [ ] **Step 3: Cài đặt các component con**

`src/components/order/SeatPicker.tsx`:

```tsx
"use client";
import type { ActiveSeat } from "@/lib/api";

export type SeatSelection = { kind: "none" } | { kind: "seat"; id: string; name: string } | { kind: "takeaway" };

const base = "min-h-14 rounded-xl px-2 text-lg font-semibold active:scale-95";
const on = "bg-indigo-600 text-white";
const off = "bg-slate-100 text-slate-800";

// Ghế quầy hiện trước, rồi tới Bàn (SRS FR-03b)
const GROUPS = [
  { kind: "counter", label: "Ghế quầy" },
  { kind: "table", label: "Bàn" },
] as const;

type Props = { seats: ActiveSeat[]; selection: SeatSelection; onChange: (s: SeatSelection) => void };

export function SeatPicker({ seats, selection, onChange }: Props) {
  const takeaway = selection.kind === "takeaway";
  return (
    <div className="space-y-3">
      {GROUPS.map((g) => {
        // Server đã sắp theo kind, sort_order, name; filter giữ nguyên thứ tự đó
        const items = seats.filter((s) => s.kind === g.kind);
        if (items.length === 0) return null;
        return (
          <div key={g.kind} role="group" aria-label={g.label} className="space-y-1">
            <p className="text-sm font-semibold text-slate-600">{g.label}</p>
            <div className="grid grid-cols-4 gap-2">
              {items.map((s) => {
                const active = selection.kind === "seat" && selection.id === s.id;
                return (
                  <button key={s.id} type="button" aria-pressed={active} className={`${base} ${active ? on : off}`}
                    onClick={() => onChange(active ? { kind: "none" } : { kind: "seat", id: s.id, name: s.name })}>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-4 gap-2">
        <button type="button" aria-pressed={takeaway} className={`${base} ${takeaway ? on : off}`}
          onClick={() => onChange(takeaway ? { kind: "none" } : { kind: "takeaway" })}>
          Mang về
        </button>
      </div>
    </div>
  );
}
```

`src/lib/haptics.ts`:

```ts
// Rung ngắn khi gửi đơn thành công. iOS Safari không hỗ trợ Vibration API, nên ở đó lệnh này không có tác dụng.
export function buzz(): void {
  try {
    navigator.vibrate?.(30);
  } catch {
    // Một số trình duyệt chặn rung khi chưa có thao tác người dùng; bỏ qua
  }
}
```

`src/components/order/ConfirmBar.tsx`. Thanh này nằm sát đáy, luôn hiện. Lúc bình thường là nút Xác nhận; sau khi gửi thành công thì đổi thành phản hồi kèm nút Hoàn tác trong 5 giây:

```tsx
"use client";
import { useEffect } from "react";

export type Feedback = { orderId: string; text: string };

type Props = {
  canSubmit: boolean;
  sending: boolean;
  feedback: Feedback | null;
  onSubmit: () => void;
  onUndo: (orderId: string) => void;
  onFeedbackEnd: () => void;
};

export function ConfirmBar({ canSubmit, sending, feedback, onSubmit, onUndo, onFeedbackEnd }: Props) {
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(onFeedbackEnd, 5000);
    return () => clearTimeout(timer);
  }, [feedback, onFeedbackEnd]);

  if (feedback) {
    return (
      <div className="flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-slate-800 px-4 text-white">
        <span role="status" className="font-semibold">{feedback.text}</span>
        <button type="button" onClick={() => onUndo(feedback.orderId)}
          className="min-h-12 rounded-lg border border-white/60 px-4 font-bold">
          Hoàn tác
        </button>
      </div>
    );
  }
  return (
    <button type="button" aria-label="Xác nhận đơn" disabled={!canSubmit || sending} onClick={onSubmit}
      className="min-h-16 w-full rounded-2xl bg-emerald-600 text-2xl font-bold text-white active:scale-[0.98] disabled:bg-slate-300">
      {sending ? "Đang gửi…" : "Xác nhận đơn"}
    </button>
  );
}
```

`src/components/order/RecentOrders.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import type { MyOrder } from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { formatVnTime } from "@/lib/time";

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

type Props = { orders: MyOrder[]; now: () => Date; onCancel: (orderId: string) => void };

export function RecentOrders({ orders, now, onCancel }: Props) {
  // Render lại định kỳ để nút Hủy tự ẩn khi hết cửa sổ hủy
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(timer);
  }, []);

  if (orders.length === 0) return null;
  const nowMs = now().getTime();

  return (
    <section aria-label="Đơn vừa tạo" className="space-y-2">
      <h2 className="text-lg font-bold">Đơn vừa tạo</h2>
      <ul className="divide-y divide-slate-200">
        {orders.map((o) => {
          const cancelled = o.status === "cancelled";
          const cancellable = !cancelled && nowMs - Date.parse(o.created_at) <= CANCEL_WINDOW_MS;
          return (
            <li key={o.id} className="flex items-center justify-between gap-2 py-2">
              <span className={cancelled ? "text-slate-400 line-through" : ""}>
                {formatVnTime(o.created_at)} · {o.seat_name ?? "—"} · {o.quantity} cốc · {formatVnd(o.total_amount)}
              </span>
              {cancelled && <span className="text-sm text-slate-500">Đã hủy</span>}
              {cancellable && (
                <button type="button" onClick={() => onCancel(o.id)} className="min-h-10 rounded-lg bg-red-100 px-3 font-semibold text-red-700">
                  Hủy
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Cài đặt `OrderScreen`**

`src/components/order/OrderScreen.tsx`:

```tsx
"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { NetworkError, RpcError, type ActiveSeat, type MyOrder, type StaffApi } from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { getMyOrderIds, rememberOrder } from "@/lib/order/myOrders";
import { quantityReducer, type QuantityAction } from "@/lib/order/quantity";
import { PriceBanner } from "./PriceBanner";
import { QuantityPad } from "./QuantityPad";
import { RecentOrders } from "./RecentOrders";
import { buzz } from "@/lib/haptics";
import { ConfirmBar, type Feedback } from "./ConfirmBar";
import { SeatPicker, type SeatSelection } from "./SeatPicker";

const ERROR_TEXT: Record<string, string> = {
  INVALID_QUANTITY: "Số lượng không hợp lệ.",
  INVALID_SEAT: "Chỗ ngồi không hợp lệ.",
  SEAT_NOT_FOUND: "Chỗ ngồi không còn tồn tại. Tải lại trang.",
  ORDER_NOT_FOUND: "Không tìm thấy đơn.",
  CANCEL_WINDOW_EXPIRED: "Đã quá 5 phút, nhờ chủ quán hủy đơn.",
};

export type OrderScreenProps = {
  api: StaffApi;
  price: number | null;
  online: boolean;
  onUnauthorized: () => void;
  newId?: () => string;
  now?: () => Date;
};

export function OrderScreen({
  api, price, online, onUnauthorized,
  newId = () => crypto.randomUUID(), now = () => new Date(),
}: OrderScreenProps) {
  const [quantity, dispatch] = useReducer(quantityReducer, 0);
  const [selection, setSelection] = useState<SeatSelection>({ kind: "none" });
  const [seats, setSeats] = useState<ActiveSeat[]>([]);
  const [recent, setRecent] = useState<MyOrder[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Giữ nguyên id cho tới khi gửi thành công, để bấm lại sau lỗi mạng không tạo đơn thứ hai
  const pendingId = useRef<string | null>(null);

  const handleError = useCallback((e: unknown) => {
    if (e instanceof RpcError && e.code === "FORBIDDEN") return onUnauthorized();
    if (e instanceof RpcError) return setNotice(ERROR_TEXT[e.code] ?? `Lỗi: ${e.code}`);
    if (e instanceof NetworkError) return setNotice("Chưa gửi được – kiểm tra mạng rồi bấm lại.");
    setNotice("Có lỗi xảy ra.");
  }, [onUnauthorized]);

  const refreshRecent = useCallback(async () => {
    try {
      setRecent(await api.listOrdersByIds(getMyOrderIds()));
    } catch (e) {
      if (!(e instanceof NetworkError)) handleError(e);
    }
  }, [api, handleError]);

  useEffect(() => {
    api.listActiveSeats().then(setSeats).catch((e) => { if (!(e instanceof NetworkError)) handleError(e); });
    void refreshRecent();
  }, [api, handleError, refreshRecent]);

  const endFeedback = useCallback(() => setFeedback(null), []);

  // Chạm vào số lượng hay chỗ ngồi nghĩa là bắt đầu đơn mới: thanh trở lại thành Xác nhận
  const changeQuantity = (a: QuantityAction) => { setFeedback(null); dispatch(a); };
  const changeSeat = (s: SeatSelection) => { setFeedback(null); setSelection(s); };

  async function handleSubmit() {
    if (quantity === 0 || price === null || !online || sending) return;
    const id = (pendingId.current ??= newId());
    setSending(true);
    setNotice(null);
    try {
      const res = await api.createOrder({
        id,
        quantity,
        seatId: selection.kind === "seat" ? selection.id : null,
        isTakeaway: selection.kind === "takeaway",
        clientPrice: price,
      });
      pendingId.current = null;
      rememberOrder(res.id);
      dispatch({ type: "clear" });
      setSelection({ kind: "none" });
      const cups = Math.round(res.total_amount / res.unit_price);
      setFeedback({ orderId: res.id, text: `Đã tạo đơn ${cups} cốc – ${formatVnd(res.total_amount)}` });
      buzz();
      if (res.duplicate) {
        setNotice(`Đơn này đã được ghi từ lần gửi trước (${cups} cốc). Kiểm tra lại trước khi tạo đơn mới.`);
      } else if (res.price_changed) {
        setNotice(`Giá đã đổi: đơn được tính ${formatVnd(res.unit_price)}/cốc, thành tiền ${formatVnd(res.total_amount)}.`);
      }
      await refreshRecent();
    } catch (e) {
      handleError(e);
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(orderId: string) {
    setFeedback((f) => (f?.orderId === orderId ? null : f));
    try {
      await api.cancelOrder(orderId);
      await refreshRecent();
    } catch (e) {
      handleError(e);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4">
      <PriceBanner price={price} offline={!online} />
      {!online && <p className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">Mất mạng – chưa gửi được đơn</p>}
      <p data-testid="total" className="text-center text-4xl font-extrabold tabular-nums">
        {price === null ? "—" : formatVnd(quantity * price)}
      </p>
      <SeatPicker seats={seats} selection={selection} onChange={changeSeat} />
      <QuantityPad quantity={quantity} dispatch={changeQuantity} />
      {notice && <p role="alert" className="rounded-lg bg-amber-100 p-3 text-amber-900">{notice}</p>}
      <div className="sticky bottom-0 bg-white pb-2 pt-1">
        <ConfirmBar
          canSubmit={quantity > 0 && price !== null && online}
          sending={sending}
          feedback={feedback}
          onSubmit={() => void handleSubmit()}
          onUndo={(id) => void handleCancel(id)}
          onFeedbackEnd={endFeedback}
        />
      </div>
      <RecentOrders orders={recent} now={now} onCancel={(id) => void handleCancel(id)} />
    </main>
  );
}
```

- [ ] **Step 5: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS toàn bộ, gồm 12 test của `OrderScreen`.

- [ ] **Step 6: Nối trang `/order`, trang gốc và layout**

`src/app/order/page.tsx`:

```tsx
"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { OrderScreen } from "@/components/order/OrderScreen";
import { useCurrentPrice } from "@/hooks/useCurrentPrice";
import { useOnline } from "@/hooks/useOnline";
import { createStaffApi } from "@/lib/api";
import { getBrowserSupabase, getRpcClient } from "@/lib/supabase/client";

export default function OrderPage() {
  const router = useRouter();
  const price = useCurrentPrice();
  const online = useOnline();
  const api = useMemo(() => createStaffApi(getRpcClient), []);
  const onUnauthorized = useCallback(() => {
    void getBrowserSupabase().auth.signOut({ scope: "local" }).finally(() => router.replace("/login"));
  }, [router]);

  return <OrderScreen api={api} price={price} online={online} onUnauthorized={onUnauthorized} />;
}
```

`src/app/page.tsx` (thay toàn bộ nội dung):

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/order");
}
```

`src/app/layout.tsx`:
- Đổi `<html lang="en">` thành `<html lang="vi">`.
- Đổi `metadata` thành `{ title: "Quán Nước", description: "Gọi món nhanh cho quán nước đồng giá" }`.

Việc chặn người chưa đăng nhập vào `/order` do middleware ở Task 11 đảm nhận.

- [ ] **Step 7: Commit**

```bash
git add src tests/unit
git commit -m "feat(order): order screen with seat picker, undo, idempotent retry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
