# Giai đoạn 3: Chủ quán

> Thuộc kế hoạch [POS Quán Nước Đồng Giá](../2026-10-03-pos-nuoc-dong-gia.md). Đọc phần **Global Constraints** và **Hợp đồng dùng chung** trong file đó trước khi làm.

**Quy ước:**

- Trang của chủ quán là **server component**, đọc dữ liệu bằng `createServerSupabase()`. Quyền được bảo vệ bằng RLS và các RPC kiểm tra `is_owner()`.
- Thao tác ghi do **client component** thực hiện, qua `getBrowserSupabase()` (session lưu trong cookie, dùng chung với server). Sau khi ghi thì gọi `router.refresh()`.
- Phần logic có thể sai được tách thành **hàm thuần** và có unit test. Phần CRUD mỏng được kiểm tra bằng tay theo `docs/manual-test.md` (Task 14).

---

### Task 11: Đăng nhập chủ quán, middleware và script tạo tài khoản

**Files:**

- Create: `src/lib/supabase/server.ts`, `src/middleware.ts`
- Create: `src/components/admin/LoginForm.tsx`, `src/components/admin/LogoutButton.tsx`
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/(protected)/layout.tsx`, `src/app/admin/page.tsx`
- Create: `scripts/create-user.mjs`
- Test: `tests/unit/admin/LoginForm.test.tsx`

**Interfaces:**

- Consumes: `getBrowserSupabase()` (Task 7), RPC `is_owner`, bảng `app_roles`.
- Produces:
  - `createServerSupabase(): Promise<SupabaseClient>`.
  - `<LoginForm onLogin={(email, password) => Promise<string | null>} />`.
  - `<LogoutButton />`.
  - **Middleware:**
    - Chưa đăng nhập mà vào `/order` thì chuyển sang `/login`.
    - Chưa đăng nhập mà vào `/admin/*` (trừ `/admin/login`) thì chuyển sang `/admin/login`.
    - `/admin` chuyển sang `/admin/dashboard`.
  - Script `npm run create-user -- <owner|staff> <email> <mật khẩu hoặc PIN>`.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/admin/LoginForm.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/admin/LoginForm";

describe("LoginForm", () => {
  it("gửi email và mật khẩu", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(null);
    render(<LoginForm onLogin={onLogin} />);
    await user.type(screen.getByLabelText("Email"), "owner@quan.vn");
    await user.type(screen.getByLabelText("Mật khẩu"), "matkhau123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(onLogin).toHaveBeenCalledWith("owner@quan.vn", "matkhau123");
  });

  it("hiện lỗi do onLogin trả về", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        onLogin={vi.fn().mockResolvedValue("Sai email hoặc mật khẩu.")}
      />,
    );
    await user.type(screen.getByLabelText("Email"), "a@b.vn");
    await user.type(screen.getByLabelText("Mật khẩu"), "x");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sai email hoặc mật khẩu.",
    );
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có module.

- [ ] **Step 3: Cài đặt `LoginForm`**

`src/components/admin/LoginForm.tsx`:

```tsx
"use client";
import { useState, type FormEvent } from "react";

export function LoginForm({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<string | null>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(await onLogin(email.trim(), password));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-bold">Đăng nhập chủ quán</h1>
      <label className="block">
        <span>Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
        />
      </label>
      <label className="block">
        <span>Mật khẩu</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 p-3"
        />
      </label>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 w-full rounded-lg bg-slate-900 font-bold text-white disabled:opacity-50"
      >
        Đăng nhập
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS.

- [ ] **Step 5: Server client, middleware, các trang và script**

`src/lib/supabase/server.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Gọi từ server component thì không ghi cookie được; middleware sẽ làm mới session
          }
        },
      },
    },
  );
}
```

`src/middleware.ts`:

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  return NextResponse.redirect(url);
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAdminLogin = path === "/admin/login";

  if (!user) {
    if (isAdminLogin) return response;
    return redirectTo(
      request,
      path.startsWith("/order") ? "/login" : "/admin/login",
    );
  }
  if (isAdminLogin) return redirectTo(request, "/admin/dashboard");
  return response;
}

export const config = { matcher: ["/order/:path*", "/admin/:path*"] };
```

`src/app/admin/login/page.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function OwnerLoginPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-sm p-6">
      <LoginForm
        onLogin={async (email, password) => {
          const { error } = await getBrowserSupabase().auth.signInWithPassword({
            email,
            password,
          });
          if (error)
            return error.status === 429
              ? "Thử sai quá nhiều lần, thử lại sau ít phút."
              : "Sai email hoặc mật khẩu.";
          router.replace("/admin/dashboard");
          router.refresh();
          return null;
        }}
      />
    </main>
  );
}
```

`src/components/admin/LogoutButton.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
      onClick={async () => {
        await getBrowserSupabase().auth.signOut({ scope: "local" });
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      Đăng xuất
    </button>
  );
}
```

`src/app/admin/(protected)/layout.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { createServerSupabase } from "@/lib/supabase/server";

const NAV = [
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/history", label: "Lịch sử đơn hàng" },
  { href: "/admin/settings", label: "Cài đặt" },
];

export default async function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: isOwner } = await supabase.rpc("is_owner");
  if (!isOwner) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-6">
        <p role="alert">Tài khoản này không phải tài khoản chủ quán.</p>
        <LogoutButton />
      </main>
    );
  }
  return (
    <div className="mx-auto max-w-5xl p-4">
      <nav className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="rounded-lg px-3 py-2 font-medium hover:bg-slate-100"
          >
            {n.label}
          </Link>
        ))}
        <Link
          href="/order"
          className="rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100"
        >
          Màn hình order
        </Link>
        <span className="ml-auto">
          <LogoutButton />
        </span>
      </nav>
      {children}
    </div>
  );
}
```

`src/app/admin/page.tsx`:

```tsx
import { redirect } from "next/navigation";

export default function OwnerIndex() {
  redirect("/admin/dashboard");
}
```

`scripts/create-user.mjs`:

```js
// Cách dùng: node --env-file=.env.local scripts/create-user.mjs <owner|staff> <email> <mật khẩu | PIN 6 số>
import { createClient } from "@supabase/supabase-js";

const [role, email, password] = process.argv.slice(2);
const valid =
  (role === "owner" && email && password?.length >= 8) ||
  (role === "staff" && email && /^\d{6}$/.test(password ?? ""));
if (!valid) {
  console.error(
    "Cách dùng:\n  create-user owner <email> <mật khẩu ≥ 8 ký tự>\n  create-user staff <email> <PIN quán 6 số>",
  );
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
  },
);

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (error) {
  console.error(`Không tạo được tài khoản: ${error.message}`);
  process.exit(1);
}
const { error: roleError } = await supabase
  .from("app_roles")
  .insert({ user_id: data.user.id, role });
if (roleError) {
  console.error(
    `Đã tạo tài khoản nhưng chưa gán vai trò: ${roleError.message}`,
  );
  process.exit(1);
}
console.log(`Đã tạo tài khoản ${role}: ${email}`);
```

Thêm vào `"scripts"` trong `package.json`: `"create-user": "node --env-file=.env.local scripts/create-user.mjs"`.

- [ ] **Step 6: Kiểm tra tay**

1. `npx supabase db reset`, rồi tạo hai tài khoản:
   - `npm run create-user -- owner owner@quan.vn matkhau123`
   - `npm run create-user -- staff nhanvien@quan.local 123456`
2. Chạy `npm run dev`. Mở `/order`: bị chuyển sang `/login`.
3. Nhập PIN `000000`: báo "Sai mã PIN.". Nhập `123456`: vào được `/order`. Tạo một đơn: đơn hiện trong "Đơn vừa tạo".
4. Mở `/admin` trên một **cửa sổ ẩn danh**: bị chuyển sang `/admin/login`. Đăng nhập chủ quán: thấy thanh điều hướng (trang tổng quan sẽ báo 404 cho đến khi làm xong Task 13).
5. Trên điện thoại đã đăng nhập bằng PIN, mở `/admin/dashboard`: thấy "Tài khoản này không phải tài khoản chủ quán.".

- [ ] **Step 7: Commit**

```bash
git add src scripts package.json tests/unit/admin
git commit -m "feat(auth): owner login, route middleware, create-user script

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Trang cài đặt

**Files:**

- Create: `src/lib/admin/validate.ts`
- Create: `src/components/admin/PriceForm.tsx`, `src/components/admin/BusinessHourForm.tsx`, `src/components/admin/PinForm.tsx`, `src/components/admin/SeatsManager.tsx`
- Create: `src/app/admin/(protected)/settings/page.tsx`, `src/app/admin/(protected)/settings/SettingsForms.tsx`
- Test: `tests/unit/admin/validate.test.ts`, `tests/unit/admin/PriceForm.test.tsx`, `tests/unit/admin/PinForm.test.tsx`

**Interfaces:**

- Consumes: các RPC `update_price`, `update_business_day_start_hour`, `set_shop_pin`; bảng `seats`, `price_history`, `settings` (qua RLS của chủ quán); `formatVnd`, `formatVnDateTime`.
- Produces:
  - `MAX_PRICE = 10_000_000`.
  - `parsePriceInput(raw: string): number | null`: bỏ các ký tự `.`, `,`, khoảng trắng và `đ`. Trả về `null` nếu kết quả không phải số nguyên trong khoảng 1 đến `MAX_PRICE`.
  - `isValidPin(pin: string): boolean`.
  - `<PriceForm currentPrice={number} onSave={(price: number) => Promise<string | null>} />`.
  - `<PinForm onSave={(pin: string) => Promise<string | null>} />`.
  - `type OwnerSeat = { id: string; name: string; kind: "table" | "counter"; sort_order: number; is_archived: boolean }` và `<SeatsManager seats={OwnerSeat[]} />` (SRS FR-05c): thêm chỗ ngồi phải chọn loại (Bàn hoặc Ghế quầy), đưa lên/xuống chỉ trong cùng loại, danh sách đã ẩn ghi rõ loại.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/admin/validate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isValidPin, MAX_PRICE, parsePriceInput } from "@/lib/admin/validate";

describe("parsePriceInput", () => {
  it("chấp nhận nhiều cách gõ tiền", () => {
    expect(parsePriceInput("30000")).toBe(30000);
    expect(parsePriceInput("30.000")).toBe(30000);
    expect(parsePriceInput(" 30.000đ ")).toBe(30000);
    expect(parsePriceInput("30,000")).toBe(30000);
  });
  it("từ chối giá trị không hợp lệ", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("0")).toBeNull();
    expect(parsePriceInput("-5000")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
    expect(parsePriceInput(String(MAX_PRICE + 1))).toBeNull();
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

`tests/unit/admin/PriceForm.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PriceForm } from "@/components/admin/PriceForm";

describe("PriceForm", () => {
  it("lưu giá hợp lệ dưới dạng số nguyên", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    render(<PriceForm currentPrice={25000} onSave={onSave} />);
    const input = screen.getByLabelText("Đơn giá chung mới (đ/cốc)");
    await user.clear(input);
    await user.type(input, "30.000");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSave).toHaveBeenCalledWith(30000);
    expect(
      await screen.findByText("Đã lưu đơn giá chung mới."),
    ).toBeInTheDocument();
  });

  it("báo lỗi và không lưu khi giá không hợp lệ", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<PriceForm currentPrice={25000} onSave={onSave} />);
    const input = screen.getByLabelText("Đơn giá chung mới (đ/cốc)");
    await user.clear(input);
    await user.type(input, "0");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Giá phải là số nguyên",
    );
  });
});
```

`tests/unit/admin/PinForm.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinForm } from "@/components/admin/PinForm";

describe("PinForm", () => {
  it("hai lần nhập không khớp thì báo lỗi", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<PinForm onSave={onSave} />);
    await user.type(screen.getByLabelText("PIN quán mới"), "111111");
    await user.type(screen.getByLabelText("Nhập lại PIN"), "222222");
    await user.click(screen.getByRole("button", { name: "Đổi PIN quán" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("không khớp");
  });

  it("PIN hợp lệ thì lưu", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    render(<PinForm onSave={onSave} />);
    await user.type(screen.getByLabelText("PIN quán mới"), "654321");
    await user.type(screen.getByLabelText("Nhập lại PIN"), "654321");
    await user.click(screen.getByRole("button", { name: "Đổi PIN quán" }));
    expect(onSave).toHaveBeenCalledWith("654321");
    expect(await screen.findByText(/Đã đổi PIN quán/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có module.

- [ ] **Step 3: Cài đặt phần validate và hai form**

`src/lib/admin/validate.ts`:

```ts
export const MAX_PRICE = 10_000_000;

export function parsePriceInput(raw: string): number | null {
  const cleaned = raw.replace(/[.,\sđ]/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const value = parseInt(cleaned, 10);
  return value >= 1 && value <= MAX_PRICE ? value : null;
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
```

`src/components/admin/PriceForm.tsx`:

```tsx
"use client";
import { useState, type FormEvent } from "react";
import { parsePriceInput } from "@/lib/admin/validate";
import { formatVnd } from "@/lib/money";

type Props = {
  currentPrice: number;
  onSave: (price: number) => Promise<string | null>;
};

export function PriceForm({ currentPrice, onSave }: Props) {
  const [raw, setRaw] = useState(String(currentPrice));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const price = parsePriceInput(raw);
    if (price === null) return setError("Giá phải là số nguyên lớn hơn 0.");
    setError(null);
    const failure = await onSave(price);
    if (failure) setError(failure);
    else setSaved(true);
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p>
        Đơn giá chung hiện tại: <strong>{formatVnd(currentPrice)}/cốc</strong>
      </p>
      <label className="block">
        <span>Đơn giá chung mới (đ/cốc)</span>
        <input
          inputMode="numeric"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="mt-1 w-full max-w-xs rounded-lg border border-slate-300 p-3 text-xl"
        />
      </label>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {saved && <p className="text-emerald-700">Đã lưu đơn giá chung mới.</p>}
      <button
        type="submit"
        className="min-h-12 rounded-lg bg-emerald-600 px-6 font-bold text-white"
      >
        Lưu thay đổi
      </button>
    </form>
  );
}
```

`src/components/admin/PinForm.tsx`:

```tsx
"use client";
import { useState, type FormEvent } from "react";
import { isValidPin } from "@/lib/admin/validate";

export function PinForm({
  onSave,
}: {
  onSave: (pin: string) => Promise<string | null>;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (!isValidPin(pin)) return setError("PIN quán phải gồm đúng 6 chữ số.");
    if (pin !== confirm) return setError("Hai lần nhập PIN không khớp.");
    setError(null);
    const failure = await onSave(pin);
    if (failure) return setError(failure);
    setSaved(true);
    setPin("");
    setConfirm("");
  }

  const field =
    "mt-1 w-40 rounded-lg border border-slate-300 p-3 text-xl tracking-widest";
  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm text-amber-700">
        Đổi PIN quán sẽ đăng xuất ngay mọi điện thoại của nhân viên.
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="block">
          <span>PIN quán mới</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className={field}
          />
        </label>
        <label className="block">
          <span>Nhập lại PIN</span>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={field}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-emerald-700">
          Đã đổi PIN quán. Mọi điện thoại của nhân viên phải nhập PIN mới.
        </p>
      )}
      <button
        type="submit"
        className="min-h-12 rounded-lg bg-slate-900 px-6 font-bold text-white"
      >
        Đổi PIN quán
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS.

- [ ] **Step 5: Viết các component CRUD còn lại**

`src/components/admin/BusinessHourForm.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function BusinessHourForm({ currentHour }: { currentHour: number }) {
  const router = useRouter();
  const [hour, setHour] = useState(currentHour);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    const { error } = await getBrowserSupabase().rpc(
      "update_business_day_start_hour",
      { p_hour: hour },
    );
    setMessage(error ? `Lỗi: ${error.message}` : "Đã lưu giờ mở cửa.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-3">
        <span>Ngày kinh doanh bắt đầu lúc</span>
        <select
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
          className="rounded-lg border border-slate-300 p-2"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-slate-600">
        Chỉ áp dụng cho đơn mới. Nên đổi khi quán đã đóng cửa.
      </p>
      {message && <p>{message}</p>}
      <button
        type="button"
        onClick={() => void save()}
        className="min-h-12 rounded-lg bg-slate-900 px-6 font-bold text-white"
      >
        Lưu giờ mở cửa
      </button>
    </div>
  );
}
```

`src/components/admin/SeatsManager.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export type SeatKind = "table" | "counter";
export type OwnerSeat = {
  id: string;
  name: string;
  kind: SeatKind;
  sort_order: number;
  is_archived: boolean;
};

// Ghế quầy trước, Bàn sau, giống màn hình order
const KINDS: SeatKind[] = ["counter", "table"];
const KIND_LABEL: Record<SeatKind, string> = {
  counter: "Ghế quầy",
  table: "Bàn",
};

export function SeatsManager({ seats }: { seats: OwnerSeat[] }) {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<SeatKind>("counter");
  const [error, setError] = useState<string | null>(null);
  const supabase = getBrowserSupabase();
  const active = seats.filter((s) => !s.is_archived);
  const archived = seats.filter((s) => s.is_archived);

  async function run(op: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await op;
    setError(error ? `Lỗi: ${error.message}` : null);
    router.refresh();
  }

  async function add() {
    const name = newName.trim();
    if (!name) return;
    // sort_order chỉ có nghĩa trong cùng loại
    const maxOrder = Math.max(
      0,
      ...seats.filter((s) => s.kind === newKind).map((s) => s.sort_order),
    );
    await run(
      supabase
        .from("seats")
        .insert({ name, kind: newKind, sort_order: maxOrder + 1 }),
    );
    setNewName("");
  }

  async function rename(s: OwnerSeat) {
    const name = window.prompt("Tên chỗ ngồi mới", s.name)?.trim();
    if (name && name !== s.name)
      await run(supabase.from("seats").update({ name }).eq("id", s.id));
  }

  // `list` là các chỗ ngồi đang dùng của một loại, nên chỉ đổi chỗ được trong cùng loại
  async function move(list: OwnerSeat[], index: number, delta: -1 | 1) {
    const a = list[index];
    const b = list[index + delta];
    if (!a || !b) return;
    await run(
      supabase
        .from("seats")
        .update({ sort_order: b.sort_order })
        .eq("id", a.id),
    );
    await run(
      supabase
        .from("seats")
        .update({ sort_order: a.sort_order })
        .eq("id", b.id),
    );
  }

  const setArchived = (s: OwnerSeat, value: boolean) =>
    void run(
      supabase.from("seats").update({ is_archived: value }).eq("id", s.id),
    );

  const small = "rounded-md bg-slate-100 px-2 py-1 text-sm hover:bg-slate-200";
  return (
    <div className="space-y-3">
      {KINDS.map((kind) => {
        const list = active.filter((s) => s.kind === kind);
        return (
          <div key={kind}>
            <h3 className="font-semibold">
              {KIND_LABEL[kind]} ({list.length})
            </h3>
            <ul className="divide-y divide-slate-200">
              {list.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2 py-2">
                  <span className="flex-1 font-medium">{s.name}</span>
                  <button
                    type="button"
                    className={small}
                    aria-label={`Đưa ${s.name} lên`}
                    onClick={() => void move(list, i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={small}
                    aria-label={`Đưa ${s.name} xuống`}
                    onClick={() => void move(list, i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className={small}
                    onClick={() => void rename(s)}
                  >
                    Đổi tên
                  </button>
                  <button
                    type="button"
                    className={small}
                    onClick={() => setArchived(s, true)}
                  >
                    Ẩn
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="flex gap-2">
        <select
          value={newKind}
          onChange={(e) => setNewKind(e.target.value as SeatKind)}
          aria-label="Loại chỗ ngồi"
          className="rounded-lg border border-slate-300 p-2"
        >
          <option value="counter">Ghế quầy</option>
          <option value="table">Bàn</option>
        </select>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="VD: Quầy 13"
          aria-label="Tên chỗ ngồi mới"
          className="flex-1 rounded-lg border border-slate-300 p-2"
        />
        <button
          type="button"
          onClick={() => void add()}
          className="rounded-lg bg-slate-900 px-4 font-bold text-white"
        >
          Thêm chỗ ngồi
        </button>
      </div>
      {archived.length > 0 && (
        <details>
          <summary className="cursor-pointer text-sm text-slate-600">
            Chỗ ngồi đã ẩn ({archived.length})
          </summary>
          <ul>
            {archived.map((s) => (
              <li key={s.id} className="flex items-center gap-2 py-1">
                <span className="flex-1 text-slate-500">
                  {s.name} · {KIND_LABEL[s.kind]}
                </span>
                <button
                  type="button"
                  className={small}
                  onClick={() => setArchived(s, false)}
                >
                  Hiện lại
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Viết trang cài đặt**

`src/app/admin/(protected)/settings/SettingsForms.tsx`. `onSave` là hàm, không truyền được từ server component xuống client component, nên phần ghi dữ liệu nằm trong wrapper client này:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { PinForm } from "@/components/admin/PinForm";
import { PriceForm } from "@/components/admin/PriceForm";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function PriceSection({ currentPrice }: { currentPrice: number }) {
  const router = useRouter();
  return (
    <PriceForm
      currentPrice={currentPrice}
      onSave={async (price) => {
        const { error } = await getBrowserSupabase().rpc("update_price", {
          p_price: price,
        });
        router.refresh();
        return error ? `Lỗi: ${error.message}` : null;
      }}
    />
  );
}

export function PinSection() {
  return (
    <PinForm
      onSave={async (pin) => {
        const { error } = await getBrowserSupabase().rpc("set_shop_pin", {
          p_pin: pin,
        });
        if (!error) return null;
        return error.message === "STAFF_ACCOUNT_MISSING"
          ? "Chưa có tài khoản nhân viên. Tạo bằng script create-user trước."
          : `Lỗi: ${error.message}`;
      }}
    />
  );
}
```

`src/app/admin/(protected)/settings/page.tsx`:

```tsx
import { BusinessHourForm } from "@/components/admin/BusinessHourForm";
import { SeatsManager, type OwnerSeat } from "@/components/admin/SeatsManager";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";
import { PinSection, PriceSection } from "./SettingsForms";

const section = "space-y-3 rounded-xl border border-slate-200 p-4";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const [
    { data: settings },
    { data: history },
    { data: seats },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("settings")
      .select("current_price, business_day_start_hour")
      .eq("id", 1)
      .single(),
    supabase
      .from("price_history")
      .select("id, price, effective_from, changed_by")
      .order("effective_from", { ascending: false })
      .limit(20),
    supabase
      .from("seats")
      .select("id, name, kind, sort_order, is_archived")
      .order("kind")
      .order("sort_order")
      .order("name"),
    supabase.auth.getUser(),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Cài đặt</h1>

      <section className={section}>
        <h2 className="text-lg font-bold">Đơn giá chung</h2>
        <PriceSection currentPrice={settings?.current_price ?? 0} />
        <h3 className="pt-2 font-semibold">Lịch sử đổi giá</h3>
        <ul className="text-sm">
          {(history ?? []).map((h) => (
            <li key={h.id}>
              {formatVnDateTime(h.effective_from)}:{" "}
              <strong>{formatVnd(h.price)}</strong>
              {" · "}
              {h.changed_by === null
                ? "Khởi tạo"
                : h.changed_by === user?.id
                  ? user.email
                  : "Chủ quán khác"}
            </li>
          ))}
        </ul>
      </section>

      <section className={section}>
        <h2 className="text-lg font-bold">Giờ mở cửa</h2>
        <BusinessHourForm
          currentHour={settings?.business_day_start_hour ?? 20}
        />
      </section>

      <section className={section}>
        <h2 className="text-lg font-bold">Chỗ ngồi</h2>
        <SeatsManager seats={(seats ?? []) as OwnerSeat[]} />
      </section>

      <section className={section}>
        <h2 className="text-lg font-bold">PIN quán</h2>
        <PinSection />
      </section>
    </div>
  );
}
```

- [ ] **Step 7: Kiểm tra tay**

Đăng nhập chủ quán, mở `/admin/settings`, rồi kiểm tra:

1. Đổi đơn giá chung sang `30.000`: thấy "Đã lưu đơn giá chung mới.", lịch sử có thêm một dòng ghi email của bạn. Một tab `/order` đang mở thì đổi giá ngay và ô giá nhấp nháy vàng.
2. Đổi giờ mở cửa sang 04:00, tải lại trang: vẫn là 04:00.
3. Mục "Chỗ ngồi" hiện hai nhóm Ghế quầy (12) và Bàn (3). Chọn loại "Ghế quầy", thêm "Quầy 13": nó nằm cuối nhóm Ghế quầy. Đưa nó lên trên (chỉ đổi chỗ với ghế quầy khác, không nhảy sang nhóm Bàn), đổi tên, rồi ẩn: mục "Chỗ ngồi đã ẩn" ghi rõ loại "Ghế quầy". Chọn loại "Bàn", thêm "Bàn 4": nó nằm trong nhóm Bàn. Trên `/order` (tải lại trang), hai nhóm chỗ ngồi thay đổi tương ứng.
4. Đổi PIN quán sang `654321`. Trên tab `/order` của nhân viên, bấm tạo đơn: bị chuyển về `/login`. Nhập `654321` thì vào lại được.

- [ ] **Step 8: Commit**

```bash
git add src tests/unit/admin
git commit -m "feat(owner): settings for price, price history, business hour, seats, shop PIN

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Tổng quan, lịch sử đơn hàng và xuất CSV

**Files:**

- Create: `src/lib/csv.ts`, `src/lib/admin/range.ts`
- Create: `src/components/admin/AutoRefresh.tsx`, `src/components/admin/ExportCsvButton.tsx`, `src/components/admin/OwnerCancelButton.tsx`
- Create: `src/app/admin/(protected)/dashboard/page.tsx`, `src/app/admin/(protected)/history/page.tsx`
- Test: `tests/unit/csv.test.ts`, `tests/unit/admin/range.test.ts`

**Interfaces:**

- Consumes:
  - RPC `dashboard_summary`, `history_totals`, `current_business_date`, `cancel_order`.
  - Bảng `orders` (qua RLS của chủ quán).
  - `formatVnd`, `formatVnDateTime`, `formatIsoDate`.
- Produces:
  - `type HistoryRow = { created_at: string; business_date: string; seat_name: string | null; quantity: number; unit_price: number; total_amount: number; status: "paid" | "cancelled" }`.
  - `ordersToCsv(rows: HistoryRow[]): string`, `csvFileName(from: string, to: string): string`.
  - `normalizeRange(from: string | undefined, to: string | undefined, today: string): { from: string; to: string }`.
  - `parsePage(raw: string | undefined): number`.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/csv.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { csvFileName, ordersToCsv, type HistoryRow } from "@/lib/csv";

const row = (over: Partial<HistoryRow> = {}): HistoryRow => ({
  created_at: "2026-10-03T22:59:05Z",
  business_date: "2026-10-03",
  seat_name: "Quầy 1",
  quantity: 7,
  unit_price: 25000,
  total_amount: 175000,
  status: "paid",
  ...over,
});

describe("ordersToCsv", () => {
  it("bắt đầu bằng BOM, có header, xuống dòng bằng CRLF", () => {
    const csv = ordersToCsv([row()]);
    expect(csv.startsWith("﻿")).toBe(true);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe(
      "Thời gian,Ngày kinh doanh,Chỗ ngồi,Số cốc,Đơn giá,Thành tiền,Trạng thái",
    );
    expect(lines[1]).toBe(
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,7,25000,175000,Đã thanh toán",
    );
    expect(lines[2]).toBe("");
  });

  it("escape dấu phẩy và dấu nháy, chỗ ngồi null thành ô trống, đơn hủy có nhãn", () => {
    const lines = ordersToCsv([
      row({ seat_name: 'Bàn "VIP", tầng 2' }),
      row({ seat_name: null, status: "cancelled" }),
    ])
      .slice(1)
      .split("\r\n");
    expect(lines[1]).toContain('"Bàn ""VIP"", tầng 2"');
    expect(lines[2]).toBe(
      "04/10/2026 05:59:05,03/10/2026,,7,25000,175000,Đã hủy",
    );
  });

  it("chặn công thức Excel trong tên chỗ ngồi", () => {
    const lines = ordersToCsv([row({ seat_name: "=HYPERLINK(1)" })])
      .slice(1)
      .split("\r\n");
    expect(lines[1]).toContain(",'=HYPERLINK(1),");
  });

  it("danh sách rỗng chỉ có header", () => {
    expect(ordersToCsv([]).slice(1)).toBe(
      "Thời gian,Ngày kinh doanh,Chỗ ngồi,Số cốc,Đơn giá,Thành tiền,Trạng thái\r\n",
    );
  });

  it("tên file theo khoảng ngày", () => {
    expect(csvFileName("2026-10-01", "2026-10-31")).toBe(
      "don-hang_2026-10-01_2026-10-31.csv",
    );
  });
});
```

`tests/unit/admin/range.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeRange, parsePage } from "@/lib/admin/range";

describe("normalizeRange", () => {
  const today = "2026-10-03";
  it("mặc định là hôm nay", () => {
    expect(normalizeRange(undefined, undefined, today)).toEqual({
      from: today,
      to: today,
    });
  });
  it("ngày không hợp lệ thì thay bằng hôm nay", () => {
    expect(normalizeRange("2026-02-30", "abc", today)).toEqual({
      from: today,
      to: today,
    });
  });
  it("đảo lại nếu từ ngày lớn hơn đến ngày", () => {
    expect(normalizeRange("2026-10-31", "2026-10-01", today)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });
});

describe("parsePage", () => {
  it("chỉ nhận số nguyên từ 1 trở lên", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có module.

- [ ] **Step 3: Cài đặt**

`src/lib/csv.ts`:

```ts
import { formatIsoDate, formatVnDateTime } from "@/lib/time";

export type HistoryRow = {
  created_at: string;
  business_date: string;
  seat_name: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: "paid" | "cancelled";
};

const HEADER = [
  "Thời gian",
  "Ngày kinh doanh",
  "Chỗ ngồi",
  "Số cốc",
  "Đơn giá",
  "Thành tiền",
  "Trạng thái",
];
const STATUS_LABEL: Record<HistoryRow["status"], string> = {
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

function textCell(value: string): string {
  // Chặn CSV injection: Excel coi ô bắt đầu bằng = + - @ là công thức
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function ordersToCsv(rows: HistoryRow[]): string {
  const lines = [
    HEADER.join(","),
    ...rows.map((r) =>
      [
        textCell(formatVnDateTime(r.created_at)),
        textCell(formatIsoDate(r.business_date)),
        textCell(r.seat_name ?? ""),
        String(r.quantity),
        String(r.unit_price),
        String(r.total_amount),
        textCell(STATUS_LABEL[r.status]),
      ].join(","),
    ),
  ];
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function csvFileName(from: string, to: string): string {
  return `don-hang_${from}_${to}.csv`;
}
```

`src/lib/admin/range.ts`:

```ts
function isValidIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function normalizeRange(
  from: string | undefined,
  to: string | undefined,
  today: string,
) {
  const f = isValidIsoDate(from) ? from : today;
  const t = isValidIsoDate(to) ? to : today;
  return f <= t ? { from: f, to: t } : { from: t, to: f };
}

export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS.

- [ ] **Step 5: Viết các nút và hai trang**

`src/components/admin/AutoRefresh.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
```

`src/app/admin/(protected)/dashboard/page.tsx`:

```tsx
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatIsoDate } from "@/lib/time";

type Summary = {
  business_date: string;
  today_revenue: number;
  today_cups: number;
  month_revenue: number;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-3xl font-extrabold tabular-nums">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("dashboard_summary");
  if (error || !data)
    return <p role="alert">Không tải được số liệu: {error?.message}</p>;
  const s = data as Summary;

  return (
    <div className="space-y-6">
      <AutoRefresh seconds={60} />
      <h1 className="text-2xl font-bold">Tổng quan</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={`Doanh thu hôm nay (${formatIsoDate(s.business_date)})`}
          value={formatVnd(s.today_revenue)}
        />
        <Stat label="Số cốc hôm nay" value={String(s.today_cups)} />
        <Stat
          label={`Doanh thu tháng ${formatIsoDate(s.business_date).slice(3)}`}
          value={formatVnd(s.month_revenue)}
        />
      </div>
    </div>
  );
}
```

`src/components/admin/ExportCsvButton.tsx`:

```tsx
"use client";
import { useState } from "react";
import { csvFileName, ordersToCsv, type HistoryRow } from "@/lib/csv";
import { getBrowserSupabase } from "@/lib/supabase/client";

const BATCH = 1000;

export function ExportCsvButton({ from, to }: { from: string; to: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function exportCsv() {
    setBusy(true);
    setError(null);
    try {
      const supabase = getBrowserSupabase();
      const rows: HistoryRow[] = [];
      for (let start = 0; ; start += BATCH) {
        const { data, error } = await supabase
          .from("orders")
          .select(
            "created_at, business_date, seat_name, quantity, unit_price, total_amount, status",
          )
          .gte("business_date", from)
          .lte("business_date", to)
          .order("created_at")
          .order("id")
          .range(start, start + BATCH - 1);
        if (error) throw new Error(error.message);
        rows.push(...(data as HistoryRow[]));
        if (data.length < BATCH) break;
      }
      const url = URL.createObjectURL(
        new Blob([ordersToCsv(rows)], { type: "text/csv;charset=utf-8" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.download = csvFileName(from, to);
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`Không xuất được CSV: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={() => void exportCsv()}
        className="rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Đang xuất…" : "Xuất CSV"}
      </button>
      {error && (
        <span role="alert" className="text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
```

`src/components/admin/OwnerCancelButton.tsx`:

```tsx
"use client";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function OwnerCancelButton({
  orderId,
  label,
}: {
  orderId: string;
  label: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      className="rounded-md bg-red-100 px-2 py-1 text-sm text-red-700"
      onClick={async () => {
        if (
          !window.confirm(
            `Hủy đơn ${label}? Đơn sẽ không còn được tính vào doanh thu.`,
          )
        )
          return;
        const { error } = await getBrowserSupabase().rpc("cancel_order", {
          p_order_id: orderId,
        });
        if (error) window.alert(`Không hủy được: ${error.message}`);
        router.refresh();
      }}
    >
      Hủy
    </button>
  );
}
```

`src/app/admin/(protected)/history/page.tsx`:

```tsx
import Link from "next/link";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { OwnerCancelButton } from "@/components/admin/OwnerCancelButton";
import { normalizeRange, parsePage } from "@/lib/admin/range";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";

const PAGE_SIZE = 50;
type Params = { from?: string; to?: string; page?: string };
type Totals = { revenue: number; cups: number; order_count: number };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: today } = await supabase.rpc("current_business_date");
  const { from, to } = normalizeRange(params.from, params.to, today as string);
  const page = parsePage(params.page);
  const start = (page - 1) * PAGE_SIZE;

  const [{ data: rows, count, error }, { data: totals }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, created_at, seat_name, quantity, unit_price, total_amount, status",
        { count: "exact" },
      )
      .gte("business_date", from)
      .lte("business_date", to)
      .order("created_at", { ascending: false })
      .order("id")
      .range(start, start + PAGE_SIZE - 1),
    supabase.rpc("history_totals", { p_from: from, p_to: to }),
  ]);
  const t = totals as Totals | null;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => `/admin/history?from=${from}&to=${to}&page=${p}`;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lịch sử đơn hàng</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm">Từ ngày</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="block rounded-lg border border-slate-300 p-2"
          />
        </label>
        <label className="block">
          <span className="text-sm">Đến ngày</span>
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="block rounded-lg border border-slate-300 p-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 font-bold text-white"
        >
          Lọc
        </button>
        <ExportCsvButton from={from} to={to} />
      </form>

      {t && (
        <p className="font-medium">
          {t.order_count} đơn · {t.cups} cốc · Doanh thu{" "}
          <strong>{formatVnd(t.revenue)}</strong> (không tính đơn đã hủy)
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-600">
          Lỗi tải dữ liệu: {error.message}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-2">Thời gian</th>
              <th>Chỗ ngồi</th>
              <th className="text-right">Số cốc</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Thành tiền</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((o) => {
              const cancelled = o.status === "cancelled";
              return (
                <tr
                  key={o.id}
                  className={`border-b border-slate-100 ${cancelled ? "text-slate-400 line-through" : ""}`}
                >
                  <td className="py-2">{formatVnDateTime(o.created_at)}</td>
                  <td>{o.seat_name ?? "—"}</td>
                  <td className="text-right tabular-nums">{o.quantity}</td>
                  <td className="text-right tabular-nums">
                    {formatVnd(o.unit_price)}
                  </td>
                  <td className="text-right tabular-nums">
                    {formatVnd(o.total_amount)}
                  </td>
                  <td>{cancelled ? "Đã hủy" : "Đã thanh toán"}</td>
                  <td>
                    {!cancelled && (
                      <OwnerCancelButton
                        orderId={o.id}
                        label={`${o.quantity} cốc lúc ${formatVnDateTime(o.created_at)}`}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(rows ?? []).length === 0 && (
          <p className="py-6 text-center text-slate-500">
            Không có đơn hàng nào trong khoảng này.
          </p>
        )}
      </div>

      {pages > 1 && (
        <nav className="flex items-center gap-3">
          {page > 1 && (
            <Link
              href={href(page - 1)}
              className="rounded-lg bg-slate-100 px-3 py-1"
            >
              ← Trước
            </Link>
          )}
          <span>
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link
              href={href(page + 1)}
              className="rounded-lg bg-slate-100 px-3 py-1"
            >
              Sau →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Kiểm tra tay**

1. Tạo 2 đơn trên `/order`, hủy 1 đơn bằng nút "Hoàn tác".
2. Mở `/admin/dashboard`: doanh thu và số cốc hôm nay chỉ tính đơn chưa hủy. Tạo thêm một đơn: trong vòng 60 giây, số liệu tự cập nhật.
3. Mở `/admin/history`: đơn đã hủy bị gạch ngang và không tính vào dòng tổng. Lọc với "từ ngày" lớn hơn "đến ngày": hai mốc tự đảo lại.
4. Bấm "Hủy" trên một đơn: đơn bị gạch ngang và dòng tổng giảm xuống.
5. Bấm "Xuất CSV" rồi mở file bằng Excel: tiếng Việt hiển thị đúng, có 7 cột, đơn hủy ghi "Đã hủy".

- [ ] **Step 7: Commit**

```bash
git add src tests/unit
git commit -m "feat(owner): dashboard, order history with date filter, owner cancel, CSV export

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
