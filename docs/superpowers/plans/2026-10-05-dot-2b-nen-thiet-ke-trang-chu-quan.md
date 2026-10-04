# Đợt 2b: Nền thiết kế "Bao diêm quán bar" và trang chủ quán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay thế giới "Phơi sáng dài" bằng "Bao diêm quán bar" ở tầng token và font, rồi áp lên trang chủ quán (khung, điều hướng, Tổng quan, Thực đơn, Cài đặt) và hai màn đăng nhập; Tổng quan chuyển sang "Số món".

**Architecture:**
- **Giữ nguyên tên token theo vai trò** (`bg`, `surface`, `raised`, `line`, `edge`, `ink`, `ink-muted`, `ember`, `ember-ink`, `ok`, `warn`, `danger`, `chart-*`), chỉ đổi giá trị. Component đang dùng `bg-ember`, `text-ink`, `border-edge`… tự đổi theo, không phải sửa từng file. `ember` từ nay là **mực in cam**.
- **Một họ chữ:** Archivo (biến thiên trục `wdth` 62–125 và `wght` 100–900, có bộ chữ tiếng Việt). Lớp `font-display` hiện có được định nghĩa lại thành Archivo hẹp (72%) và đậm (800), nên các chỗ đang dùng `font-display` không phải đổi tên.
- **Bỏ hiệu ứng của thế giới cũ:** quầng sáng logo, vệt sáng, nhiễu hạt, cung phát sáng, chuyển động "ảnh hiện dần", cột mọc, bóng đổ.
- Màn order **không** sửa trong đợt này (đợt 3 dựng lại từ đầu trên nền token mới); nó vẫn đang hỏng tạm thời từ đợt 1.

**Tech Stack:** Next.js 15, `next/font/google` (Archivo), Tailwind v4 (`@theme inline` trong `src/app/globals.css`), Vitest + Testing Library, impeccable (detect, finish reviewer, documenter).

**Spec:**
- Hợp đồng thiết kế: `.impeccable/surfaces/src-app-admin-protected-dashboard-page-tsx.md` và `.impeccable/surfaces/src-app-order-page-tsx.md`; đọc bằng `C:/Users/HP/.claude/skills/impeccable/scripts/impeccable surface-brief read "src/app/admin/(protected)/dashboard/page.tsx"`.
- Hành vi: `docs/SRS.md` v3.1 (FR-06, FR-06a, NFR-02, R35, R37). Hoàn cảnh sử dụng: `PRODUCT.md`.

## Global Constraints

- Chỉ nền tối (PRODUCT.md nguyên tắc 4).
- Bảng màu, đã đo tương phản:

  | Token | Giá trị | Ghi chú |
  |---|---|---|
  | `--bg` | `#141210` | bìa đen mờ |
  | `--surface`, `--raised` | `#221F1B` | cùng một bậc |
  | `--line` | `#3A352E` | đường kẻ 1px |
  | `--edge`, `--ink-muted` | `#958D81` | 5.7:1 trên nền, 5.0:1 trên raised |
  | `--ink` | `#EFE6D2` | 15:1 |
  | `--ember` | `#E8572C` | mực cam |
  | `--ember-ink` | `#141210` | chữ trên cam 5.2:1; chữ kem trên cam chỉ 2.9:1, **không dùng** |
  | `--ok` | `#8FBF7A` | |
  | `--warn` | `#E8B04A` | |
  | `--danger` | `#EF6F7A` | 6.4:1 |
  | `--chart-current` | mực cam | |
  | `--chart-previous` | `--edge` | vẽ dạng viền, không tô |

- **Thang trung tính đúng 5 bậc:** `#141210`, `#221F1B`, `#3A352E`, `#958D81`, `#EFE6D2`. Không thêm màu xám nào ngoài thang.
- **Mực cam chỉ dùng cho:** hành động chính, lựa chọn đang có hiệu lực, focus, và **một tấm in đảo màu mỗi màn**. Ở Tổng quan, tấm đó là doanh thu ngày kinh doanh trong đồng hồ.
- **Không còn:** `halo`, `streak`, `develop`, `arc-draw`, `after-draw`, `bar-rise`, `exposure-streak`, nhiễu hạt `feTurbulence`, `filter: blur`/`drop-shadow` trang trí, `shadow-[…]`.
- **Thang cỡ chữ ở trang chủ quán chỉ gồm:** `text-xs` (chú thích), `text-sm` (nhãn), `text-base` (chữ), `text-xl` (tiêu đề mục, con số phụ), `text-3xl` (tiêu đề trang, con số chính), và cỡ hiển thị `text-[clamp(2rem,12cqw,4.5rem)]` cho doanh thu ngày. Không còn `text-2xl`, `text-4xl`, `text-lg`. Ngoại lệ: `text-[7px]` là đơn vị bên trong SVG của đồng hồ.
- **Một hệ đường kẻ 1px** (`border-line`) cho vạch chia và tiêu đề mục.
- Vùng chạm ≥ 48px; nút chính trang chủ quán ≥ 48px (NFR-02, R37). Số dùng `tabular-nums`. Icon `lucide-react`.
- Thuật ngữ: **Số món** (Item count), **món**; không dùng "số cốc", "cốc" (GLOSSARY v3.0).

## Review Focus

1. **Chữ hẹp đậm có hiện đúng không:** nếu `font-stretch` không ăn với Archivo biến thiên, tiêu đề sẽ ra Archivo thường mà không báo lỗi gì. → Task 1, bước 5, kiểm tra `getComputedStyle` trên trình duyệt; Task 4, ảnh chụp.
2. **Dấu tiếng Việt trên chữ hẹp đậm** ("Tổng quan", "Ngày kinh doanh", "Thực đơn"): dấu không được chạm dòng trên hay bị cắt. → Task 4, ảnh chụp ở 390px.
3. **Chữ trên nền cam:** mọi chữ nằm trên `bg-ember` phải là `text-ember-ink`, không phải `text-ink`. → Task 1 test tương phản; Task 4, lệnh `grep`.
4. **Hai cột biểu đồ cùng độ sáng:** kỳ trước phải phân biệt bằng viền chứ không chỉ bằng màu. → Task 3, test `RevenueBars`.
5. **Số món khi kỳ trước bằng 0:** Delta vẫn hiện "Kỳ trước: 0", không hiện "NaN%". → Task 3, test `PeriodComparison`.

## Lưu ý cho người thực hiện

- **Màn order, Lịch sử đơn hàng vẫn hỏng tạm thời** (đợt 3, 4). Đừng sửa ở đây.
- Chạy test: `npm test`. Kiểm tra kiểu: `npx tsc --noEmit`. Lint: `npx eslint src`. **Không** chạy `next build` khi `npm run dev` đang chạy.
- **Ảnh chụp cho finish reviewer cần trình duyệt.** Ưu tiên tiện ích Chrome (`mcp__claude-in-chrome__*`, đăng nhập bằng tài khoản thử trong README trên `localhost`). Nếu tiện ích không kết nối, **dừng ở Task 4 bước 2 và hỏi người dùng** (kết nối lại Chrome, hoặc cho phép cài `@playwright/test` làm devDependency). Không tự cài thư viện.
- DESIGN.md **không** viết tay trong đợt này. Shipped documenter viết lại nó từ bản đã dựng ở Task 4 (impeccable new-work §7).

---

### Task 1: Token, font và bỏ hiệu ứng cũ

**Files:**
- Test: `tests/unit/tokens.test.ts` (mới)
- Modify: `src/app/globals.css` (thay toàn bộ)
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts:12-13`
- Modify: `src/app/icons/[size]/route.tsx:31`

**Interfaces:**
- Produces:
  - Biến CSS `--font-archivo` (từ `next/font`).
  - Token như bảng ở Global Constraints.
  - Lớp `.font-display` (Archivo 72% / 800).
  - Keyframe `fade-in`, `row-in`, `toast-in` và easing `--ease-print`. `--ease-exposure` bị đổi tên; trước khi đổi, kiểm tra không còn tham chiếu trong `src/`.

- [ ] **Step 1: Viết test thất bại**

Tạo `tests/unit/tokens.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Đọc token từ :root của globals.css, để test chặn được bảng màu trượt khỏi hợp đồng thiết kế
const css = readFileSync("src/app/globals.css", "utf8");
const root = css.slice(css.indexOf(":root"), css.indexOf("}", css.indexOf(":root")));
const token = (name: string) => {
  const m = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`thiếu token --${name}`);
  return m[1].toLowerCase();
};

function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("token Bao diêm quán bar", () => {
  it("trung tính khóa đúng 5 bậc", () => {
    const neutrals = new Set(
      ["bg", "surface", "raised", "line", "edge", "ink", "ink-muted"].map(token),
    );
    expect([...neutrals].sort()).toEqual(
      ["#141210", "#221f1b", "#3a352e", "#958d81", "#efe6d2"].sort(),
    );
  });

  it("chữ đạt WCAG AA trên nền tối (phòng tối)", () => {
    expect(contrast(token("ink"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("ink-muted"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("ink-muted"), token("raised"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("danger"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("warn"), token("bg"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("ok"), token("bg"))).toBeGreaterThanOrEqual(4.5);
  });

  it("chữ trên mực cam là màu nền, đạt AA; viền điều khiển ≥ 3:1", () => {
    expect(token("ember")).toBe("#e8572c");
    expect(contrast(token("ember-ink"), token("ember"))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(token("edge"), token("bg"))).toBeGreaterThanOrEqual(3);
  });

  it("không còn hiệu ứng của thế giới cũ", () => {
    for (const gone of ["feTurbulence", ".halo", ".streak", ".develop", ".arc-draw", ".bar-rise", ".exposure-streak", "drop-shadow"]) {
      expect(css).not.toContain(gone);
    }
  });

  it("chữ hiển thị là Archivo hẹp đậm, cùng một họ với chữ thường", () => {
    expect(css).toMatch(/--font-sans:\s*var\(--font-archivo\)/);
    expect(css).toMatch(/--font-display:\s*var\(--font-archivo\)/);
    expect(css).toMatch(/\.font-display\s*\{[^}]*font-stretch:\s*72%/);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/tokens.test.ts`
Expected: FAIL cả 5 test. Thang có hơn 5 giá trị, `--ember` là `#e68a3c`, còn `.halo`/`feTurbulence`, `--font-sans` trỏ Be Vietnam Pro, chưa có `.font-display`.

- [ ] **Step 3: Viết lại `globals.css`**

Kiểm tra trước: `grep -rn "ease-exposure" src --include=*.tsx --include=*.ts`. Expected: không có kết quả (chỉ `globals.css` dùng).

Thay toàn bộ `src/app/globals.css`:

```css
@import "tailwindcss";

/* Bao diêm quán bar (surface brief, seed 73f06246): bìa đen mờ phẳng, chữ kem, đúng một màu mực cam.
   Chỉ có nền tối, vì quán là phòng tối (PRODUCT.md). Màu theo vai trò; component chỉ dùng token.
   Trung tính khóa đúng 5 bậc: bg, raised/surface, line, edge/ink-muted, ink. */
:root {
  color-scheme: dark;
  --bg: #141210; /* bìa đen mờ */
  --surface: #221f1b; /* sidebar, dòng tổng: cùng bậc với raised */
  --raised: #221f1b;
  --line: #3a352e; /* đường kẻ 1px, hệ đường kẻ duy nhất */
  --edge: #958d81; /* viền điều khiển, 5.7:1 trên nền */
  --ink: #efe6d2; /* chữ kem, 15:1 */
  --ink-muted: #958d81; /* chữ phụ, 5.7:1 trên nền, 5.0:1 trên raised */
  --ember: #e8572c; /* mực in cam: hành động chính, lựa chọn đang có hiệu lực, focus, một tấm in đảo màu mỗi màn */
  --ember-ink: #141210; /* chữ trên mực cam, 5.2:1 (chữ kem trên cam chỉ 2.9:1) */
  --ok: #8fbf7a;
  --warn: #e8b04a;
  --danger: #ef6f7a;
  /* Biểu đồ: kỳ này tô mực cam, kỳ trước chỉ viền xám. Cam và xám gần cùng độ sáng (1.01:1),
     nên phân biệt bằng tô và viền, không chỉ bằng màu */
  --chart-current: var(--ember);
  --chart-previous: var(--edge);
}

@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-raised: var(--raised);
  --color-line: var(--line);
  --color-edge: var(--edge);
  --color-ink: var(--ink);
  --color-ink-muted: var(--ink-muted);
  --color-ember: var(--ember);
  --color-ember-ink: var(--ember-ink);
  --color-ok: var(--ok);
  --color-warn: var(--warn);
  --color-danger: var(--danger);
  --color-chart-current: var(--chart-current);
  --color-chart-previous: var(--chart-previous);
  --font-sans: var(--font-archivo), system-ui, sans-serif;
  --font-display: var(--font-archivo), system-ui, sans-serif;
  --ease-print: cubic-bezier(0.16, 1, 0.3, 1);
  /* Khoảng cách và vùng chạm tính bằng px, để thu nhỏ chữ trên điện thoại không làm vùng chạm dưới 48px (NFR-02) */
  --spacing: 4px;
}

html {
  background-color: var(--bg);
  font-size: 93.75%; /* điện thoại: chữ 15px, từ lg trở lên 16px */
}

body {
  min-height: 100dvh;
  color: var(--ink);
  font-family: var(--font-archivo), system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
  -webkit-tap-highlight-color: transparent;
}

/* Chữ biển trên bao diêm: cùng họ Archivo, hẹp và đậm. Một họ chữ, thứ bậc bằng độ rộng và độ đậm.
   Không nằm trong layer, nên thắng tracking-wide còn sót từ thế giới cũ */
.font-display {
  font-stretch: 72%;
  font-weight: 800;
  letter-spacing: 0;
}

::selection {
  background: var(--ember);
  color: var(--ember-ink);
}

input,
select,
textarea {
  caret-color: var(--ember);
}

:focus-visible {
  outline: 2px solid var(--ember);
  outline-offset: 2px;
}

a {
  text-underline-offset: 0.2em;
}

* {
  scrollbar-color: var(--edge) transparent;
  scrollbar-width: thin;
}

input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(0.85) sepia(0.3);
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}

/* Đơn mới trượt vào Đơn vừa tạo */
@keyframes row-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}
.row-in {
  animation: row-in 240ms var(--ease-print) both;
}

@media (min-width: 64rem) {
  html {
    font-size: 100%;
  }
}

/* iOS Safari phóng to trang khi chạm ô nhập có chữ dưới 16px. Nằm trong base để class text-* vẫn thắng */
@layer base {
  input,
  select,
  textarea {
    font-size: max(16px, 1em);
  }
}

/* Thông báo đơn mới trên trang chủ quán */
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
}
.toast-in {
  animation: toast-in 200ms var(--ease-print) both;
}

@media (prefers-reduced-motion: reduce) {
  /* Bỏ di chuyển, giữ thay đổi độ mờ để trạng thái vẫn đọc được */
  .row-in,
  .toast-in {
    animation: fade-in 200ms ease-out both;
  }
  *,
  *::before,
  *::after {
    transition-duration: 0ms !important;
  }
}
```

- [ ] **Step 4: Đổi font và màu chủ đề**

Trong `src/app/layout.tsx`:
- Thay khối import và hai khai báo font bằng:

```tsx
import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Một họ chữ duy nhất (surface brief): Archivo biến thiên, trục wdth cho chữ biển hẹp, đủ dấu tiếng Việt
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "vietnamese"],
  axes: ["wdth"],
});
```

- Đổi `themeColor: "#1A1E15"` thành `themeColor: "#141210"`.
- Đổi `className={`${beVietnam.variable} ${anton.variable} antialiased`}` thành `className={`${archivo.variable} antialiased`}`.
- Đổi hai chỗ `description: "Tạo đơn hàng nhanh cho quán nước đồng giá"` thành `description: "Ghi đơn nhanh cho quán Nước Nôi"` (bỏ "đồng giá", SRS v3.0).

Trong `src/app/manifest.ts`: đổi `background_color: "#1A1E15"` và `theme_color: "#1A1E15"` thành `"#141210"`; nếu có `description` nhắc "đồng giá" thì đổi giống `layout.tsx`.

Trong `src/app/icons/[size]/route.tsx`: đổi `background: "#1A1E15"` thành `background: "#141210"`.

- [ ] **Step 5: Chạy test, xác nhận đạt; kiểm tra chữ hẹp trên trình duyệt**

Run: `npm test -- tests/unit/tokens.test.ts && npx tsc --noEmit && npx eslint src`
Expected: PASS 5/5, không lỗi kiểu, không lỗi lint.

Run: `npm test`
Expected: các file khác vẫn PASS. Riêng `tests/unit/order/*` có thể đã đỏ từ đợt 1 hoặc vẫn xanh (chúng không phụ thuộc màu); ghi nhận, không sửa.

Kiểm tra trên trình duyệt (dev server; tiện ích Chrome nếu có, nếu không thì nhờ người dùng): mở `http://localhost:3000/admin/login`, chạy trong console `getComputedStyle(document.querySelector('.font-display') ?? document.body).fontStretch`. Trên trang đăng nhập chưa có `.font-display`; mở `/admin/dashboard` sau khi đăng nhập.
Expected: `72%`. Nếu ra `100%` (`next/font` không khai báo dải `font-stretch`), thêm vào `.font-display` dòng `font-variation-settings: "wdth" 72;` và kiểm tra lại.

- [ ] **Step 6: Commit**

```bash
git add tests/unit/tokens.test.ts src/app/globals.css src/app/layout.tsx src/app/manifest.ts "src/app/icons/[size]/route.tsx"
git commit -m "feat(design): token và font Bao diêm quán bar; bỏ hiệu ứng Phơi sáng dài

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Khung trang chủ quán, tiêu đề mục, đăng nhập

**Files:**
- Create: `src/components/admin/SectionTitle.tsx`
- Modify: `src/app/admin/(protected)/layout.tsx`
- Modify: `src/app/admin/(protected)/settings/page.tsx`, `src/app/admin/(protected)/menu/page.tsx` (dùng `SectionTitle` chung)
- Modify: `src/app/admin/login/page.tsx`
- Test: `tests/unit/admin/SectionTitle.test.tsx`

**Interfaces:**
- Consumes: token Task 1.
- Produces: `export function SectionTitle({ children }: { children: string })`: `<h2>` chữ biển cỡ `text-xl` trên đường kẻ 1px `border-line`.

- [ ] **Step 1: Viết test thất bại**

Tạo `tests/unit/admin/SectionTitle.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionTitle } from "@/components/admin/SectionTitle";

describe("SectionTitle", () => {
  it("là tiêu đề cấp 2, chữ biển trên một đường kẻ 1px, không có vệt sáng", () => {
    const { container } = render(<SectionTitle>Chỗ ngồi</SectionTitle>);
    const h2 = screen.getByRole("heading", { level: 2, name: "Chỗ ngồi" });
    expect(h2.className).toContain("font-display");
    expect(h2.className).toContain("border-b");
    expect(h2.className).toContain("border-line");
    expect(h2.className).toContain("text-xl");
    expect(container.querySelector(".streak")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/admin/SectionTitle.test.tsx`
Expected: FAIL, không tìm thấy `@/components/admin/SectionTitle`.

- [ ] **Step 3: Viết component và thay hai bản sao cũ**

Tạo `src/components/admin/SectionTitle.tsx`:

```tsx
// Tiêu đề mục: chữ biển hẹp đậm trên một đường kẻ 1px (hệ đường kẻ duy nhất của Bao diêm quán bar)
export function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="border-b border-line pb-2 font-display text-xl">{children}</h2>
  );
}
```

Trong `src/app/admin/(protected)/settings/page.tsx` và `src/app/admin/(protected)/menu/page.tsx`:
- Xóa hàm `SectionTitle` cục bộ ở cuối file, cùng dòng chú thích `// Tiêu đề mục: chữ poster + vệt sáng…` phía trên nó.
- Thêm `import { SectionTitle } from "@/components/admin/SectionTitle";`.
- Đổi `<h1 className="font-display text-3xl tracking-wide">` thành `<h1 className="font-display text-3xl">`.

- [ ] **Step 4: Sửa khung trang và màn đăng nhập chủ quán**

Trong `src/app/admin/(protected)/layout.tsx`:
- Ở `<Image … className="halo h-10 w-auto lg:h-20" />`, đổi `className` thành `"h-10 w-auto lg:h-20"` (logo in phẳng, không quầng sáng).
- Xóa khối chú thích `{/* Mép sidebar là một vệt sáng dọc… */}` và thẻ `<span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-ember/50 to-transparent lg:block" />` ngay dưới nó.
- Trong `className` của `<aside>`, thêm `lg:border-r lg:border-line` (mép sidebar là một đường kẻ 1px).

Trong `src/app/admin/login/page.tsx`: đổi `className="halo"` của logo thành `className="h-auto w-[97px]"`.

- [ ] **Step 5: Chạy kiểm tra, xác nhận đạt**

Run: `npm test -- tests/unit/admin/SectionTitle.test.tsx && npx tsc --noEmit && npx eslint src`
Expected: PASS, không lỗi.

Run: `grep -rnE "\bhalo\b|\bstreak\b|tracking-wide" src/app/admin src/components/admin src/app/login`
Expected: còn `PeriodComparison.tsx` (Task 3 sửa) và các chỗ `tracking-wide` của Tổng quan (Task 3); không còn trong `layout.tsx`, `settings`, `menu`, `login`.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/SectionTitle.tsx tests/unit/admin/SectionTitle.test.tsx "src/app/admin/(protected)/layout.tsx" "src/app/admin/(protected)/settings/page.tsx" "src/app/admin/(protected)/menu/page.tsx" src/app/admin/login/page.tsx
git commit -m "feat(design): khung trang chủ quán và tiêu đề mục theo Bao diêm quán bar

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Tổng quan: đồng hồ in phẳng, tấm doanh thu, Số món, biểu đồ

**Files:**
- Modify: `src/lib/admin/stats.ts` (kiểu `PeriodTotals`)
- Modify: `src/components/admin/BusinessDayArc.tsx` (thay toàn bộ)
- Modify: `src/components/admin/PeriodComparison.tsx` (thay toàn bộ)
- Modify: `src/components/admin/RevenueBars.tsx`
- Modify: `src/app/admin/(protected)/dashboard/page.tsx`
- Test: `tests/unit/admin/BusinessDayArc.test.tsx`, `tests/unit/admin/PeriodComparison.test.tsx`, `tests/unit/admin/RevenueBars.test.tsx` (mới)

**Interfaces:**
- Consumes (đợt 1, DB): `owner_stats` trả các khối `current`/`previous` dạng `{revenue, item_count, order_count, discount_total}`.
- Produces: `export type PeriodTotals = { revenue: number; item_count: number; order_count: number; discount_total: number }`. Các props của `BusinessDayArc`, `PeriodComparison`, `RevenueBars` giữ nguyên.

- [ ] **Step 1: Viết test thất bại**

Tạo `tests/unit/admin/BusinessDayArc.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BusinessDayArc } from "@/components/admin/BusinessDayArc";

describe("BusinessDayArc", () => {
  it("in phẳng: nét mực cam trên rãnh 1px, không quầng sáng, không gradient", () => {
    const { container } = render(
      <BusinessDayArc fraction={0.5} closed={false} startLabel="20:00" endLabel="02:00" nowLabel="23:00">
        <p>Doanh thu</p>
      </BusinessDayArc>,
    );
    expect(container.querySelector("filter")).toBeNull();
    expect(container.querySelector("linearGradient")).toBeNull();
    const strokes = [...container.querySelectorAll("path")].map((p) => p.getAttribute("stroke"));
    expect(strokes).toContain("var(--line)");
    expect(strokes).toContain("var(--ember)");
  });

  it("ngoài giờ mở cửa thì ghi Đã đóng cửa và không có đốm giờ hiện tại", () => {
    const { container, getByText } = render(
      <BusinessDayArc fraction={1} closed startLabel="20:00" endLabel="02:00" nowLabel="03:00">
        <p>Doanh thu</p>
      </BusinessDayArc>,
    );
    expect(getByText("Đã đóng cửa")).toBeInTheDocument();
    expect(container.querySelector("circle")).toBeNull();
  });
});
```

Tạo `tests/unit/admin/PeriodComparison.test.tsx`:

```tsx
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PeriodComparison } from "@/components/admin/PeriodComparison";

const zero = { revenue: 0, item_count: 0, order_count: 0, discount_total: 0 };

describe("PeriodComparison", () => {
  it("đếm bằng Số món, không còn Số cốc", () => {
    render(
      <PeriodComparison
        periods={[
          {
            title: "Ngày kinh doanh 05/10/2026",
            compareLabel: "so với ngày kinh doanh trước",
            current: { revenue: 570000, item_count: 3, order_count: 1, discount_total: 0 },
            previous: { revenue: 380000, item_count: 2, order_count: 1, discount_total: 0 },
          },
        ]}
      />,
    );
    expect(screen.getByText("Số món")).toBeInTheDocument();
    expect(screen.queryByText(/cốc/)).toBeNull();
    // Doanh thu và số món đều tăng 50%
    expect(screen.getAllByText("+50%")).toHaveLength(2);
  });

  it("kỳ trước bằng 0 thì chỉ ghi số kỳ trước, không ra NaN", () => {
    render(
      <PeriodComparison
        periods={[{ title: "Tuần này", compareLabel: "so với kỳ trước", current: { ...zero, item_count: 4 }, previous: zero }]}
      />,
    );
    expect(screen.getAllByText("Kỳ trước: 0").length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("không còn hiệu ứng ảnh hiện dần hay vệt sáng", () => {
    const { container } = render(
      <PeriodComparison periods={[{ title: "Tuần này", compareLabel: "so với kỳ trước", current: zero, previous: zero }]} />,
    );
    expect(container.querySelector(".develop, .streak")).toBeNull();
  });
});
```

Tạo `tests/unit/admin/RevenueBars.test.tsx`:

```tsx
import { beforeAll, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { RevenueBars } from "@/components/admin/RevenueBars";

// jsdom không có ResizeObserver; giả lập bề rộng 400px để biểu đồ vẽ ra
beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {
      this.cb([{ contentRect: { width: 400 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("RevenueBars", () => {
  it("kỳ này tô mực cam, kỳ trước chỉ viền (cùng độ sáng nên không phân biệt chỉ bằng màu)", () => {
    const { container } = render(
      <RevenueBars
        title="Doanh thu tuần"
        currentLabel="Tuần này"
        previousLabel="Tuần trước"
        points={[{ label: "T2", revenue: 300000, previous_revenue: 200000 }]}
        ticks={[0]}
      />,
    );
    const paths = [...container.querySelectorAll("path")];
    const current = paths.find((p) => p.getAttribute("fill") === "var(--chart-current)");
    const previous = paths.find((p) => p.getAttribute("stroke") === "var(--chart-previous)");
    expect(current).toBeTruthy();
    expect(previous?.getAttribute("fill")).toBe("none");
    expect(container.querySelector(".bar-rise")).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npm test -- tests/unit/admin/BusinessDayArc.test.tsx tests/unit/admin/PeriodComparison.test.tsx tests/unit/admin/RevenueBars.test.tsx`
Expected: FAIL.
- `BusinessDayArc`: có `<filter>` và `<linearGradient>`.
- `PeriodComparison`: có "Số cốc", có `.develop`.
- `RevenueBars`: kỳ trước đang tô đặc, có `.bar-rise`.

- [ ] **Step 3: Viết code**

Trong `src/lib/admin/stats.ts`, thay kiểu `PeriodTotals`:

```ts
// owner_stats / history_totals (SRS v3.0 FR-06): doanh thu sau giảm, số món, số đơn, tổng số tiền đã giảm
export type PeriodTotals = {
  revenue: number;
  item_count: number;
  order_count: number;
  discount_total: number;
};
```

Thay toàn bộ `src/components/admin/BusinessDayArc.tsx`:

```tsx
import type { ReactNode } from "react";

// Đồng hồ giờ mở cửa (SRS FR-06): khoảng giờ mở cửa → giờ đóng cửa trải trên 300°.
// In phẳng như mặt bao diêm: rãnh 1px cả vòng (giờ chưa tới), nét mực cam cho phần đã trôi qua,
// một đốm cam ở giờ hiện tại; không quầng sáng, không gradient, không chuyển động. Không vẽ số liệu lên cung.
const R = 88;
const SPAN = 300;
const START = -SPAN / 2;

function point(deg: number, r = R) {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.sin(rad), y: 100 - r * Math.cos(rad) };
}

export function BusinessDayArc({
  fraction,
  closed,
  startLabel,
  endLabel,
  nowLabel,
  children,
}: {
  fraction: number;
  closed: boolean;
  startLabel: string;
  endLabel: string;
  nowLabel: string;
  children: ReactNode;
}) {
  const end = START + SPAN * Math.min(fraction, 0.9999);
  const a = point(START);
  const b = point(end);
  const z = point(START + SPAN);
  const zIn = point(START + SPAN, R - 7);
  const large = end - START > 180 ? 1 : 0;
  const elapsed = `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`;
  return (
    <div className="relative mx-auto aspect-square w-[min(100%,70vh,560px)] [container-type:inline-size]">
      <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 overflow-visible">
        <path
          d={`M ${a.x} ${a.y} A ${R} ${R} 0 1 1 ${z.x} ${z.y}`}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line x1={z.x} y1={z.y} x2={zIn.x} y2={zIn.y} stroke="var(--edge)" strokeWidth="1" strokeLinecap="round" />
        {fraction > 0 && (
          <path d={elapsed} fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round" />
        )}
        {!closed && <circle cx={b.x} cy={b.y} r="3.2" fill="var(--ember)" />}
        <text x={a.x} y={a.y + 13} textAnchor="middle" className="fill-current text-[7px] tabular-nums text-ink-muted">
          {startLabel}
        </text>
        <text x={z.x} y={z.y + 13} textAnchor="middle" className="fill-current text-[7px] tabular-nums text-ink-muted">
          {endLabel}
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-[12%] text-center">
        {children}
        <p className="text-xs tabular-nums text-ink-muted">
          {closed ? "Đã đóng cửa" : `Bây giờ ${nowLabel}`}
        </p>
      </div>
    </div>
  );
}
```

Thay toàn bộ `src/components/admin/PeriodComparison.tsx`:

```tsx
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { AnimatedNumber } from "@/components/admin/AnimatedNumber";
import { formatVnd } from "@/lib/money";
import { percentChange, type PeriodTotals } from "@/lib/admin/stats";

export type Period = {
  title: string;
  compareLabel: string; // "so với kỳ trước (tuần trước)"…
  current: PeriodTotals;
  previous: PeriodTotals;
};

// Thay đổi so với kỳ trước, cùng đoạn (SRS FR-06): mũi tên + phần trăm + số kỳ trước, không chỉ dựa vào màu
function Delta({ current, previous, money }: { current: number; previous: number; money?: boolean }) {
  const pct = percentChange(current, previous);
  const prevText = money ? formatVnd(previous) : String(previous);
  if (pct === null)
    return <span className="block text-xs whitespace-nowrap text-ink-muted">Kỳ trước: {prevText}</span>;
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone = pct > 0 ? "text-ok" : pct < 0 ? "text-danger" : "text-ink-muted";
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 text-xs lg:justify-end">
      <span className={`inline-flex items-center gap-0.5 ${tone}`}>
        <Icon aria-hidden="true" size={14} />
        <span className="tabular-nums">
          {pct > 0 ? "+" : ""}
          {pct}%
        </span>
      </span>
      <span className="whitespace-nowrap text-ink-muted tabular-nums">kỳ trước {prevText}</span>
    </span>
  );
}

const COLS = "lg:grid-cols-[minmax(11rem,1.5fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]";

// Sổ ba kỳ in như sổ cái: đường kẻ 1px giữa các kỳ. Điện thoại: mỗi kỳ một khối. Laptop: bảng có hàng tiêu đề, số canh phải.
export function PeriodComparison({ periods }: { periods: Period[] }) {
  return (
    <div>
      <div aria-hidden="true" className={`hidden border-b border-line pb-2 text-xs text-ink-muted lg:grid lg:gap-6 ${COLS}`}>
        <span>Kỳ</span>
        <span className="text-right">Doanh thu</span>
        <span className="text-right">Số món</span>
        <span className="text-right">Số đơn</span>
      </div>
      <div className="divide-y divide-line">
        {periods.map((p) => (
          <section
            key={p.title}
            aria-label={p.title}
            className={`grid grid-cols-2 gap-x-4 gap-y-2 py-4 lg:items-start lg:gap-x-6 lg:py-5 ${COLS}`}
          >
            <h2 className="col-span-2 text-sm font-medium text-ink-muted lg:col-span-1 lg:pt-1">
              {p.title}
              <span className="block text-xs font-normal max-lg:hidden">{p.compareLabel}</span>
            </h2>
            <div className="col-span-2 space-y-1 lg:col-span-1 lg:text-right">
              <p className="font-display text-3xl tabular-nums">
                <AnimatedNumber value={p.current.revenue} kind="vnd" />
              </p>
              <Delta current={p.current.revenue} previous={p.previous.revenue} money />
            </div>
            <div className="space-y-1 lg:text-right">
              <p className="font-display text-xl tabular-nums">
                <AnimatedNumber value={p.current.item_count} />
                <span className="lg:hidden"> món</span>
              </p>
              <Delta current={p.current.item_count} previous={p.previous.item_count} />
            </div>
            <div className="space-y-1 lg:text-right">
              <p className="font-display text-xl tabular-nums">
                <AnimatedNumber value={p.current.order_count} />
                <span className="lg:hidden"> đơn</span>
              </p>
              <Delta current={p.current.order_count} previous={p.previous.order_count} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
```

Trong `src/components/admin/RevenueBars.tsx`:
- Sửa chú thích đầu file thành: `// Cột đôi doanh thu theo ngày: kỳ này tô mực cam, kỳ trước chỉ viền (cùng độ sáng nên phân biệt bằng tô/viền), SRS FR-06.`
- Ở `<span className="font-display text-xl tracking-wide">{title}</span>`, bỏ `tracking-wide`.
- Ở chú giải kỳ trước, đổi `className="size-2.5 rounded-sm bg-chart-previous"` thành `className="size-2.5 rounded-sm border border-chart-previous"`.
- Ở `<path d={bar(x0 + barW + gap, barW, p.previous_revenue, max)} fill="var(--chart-previous)" className="bar-rise" style={{ "--i": i } as CSSProperties} />`, thay bằng `<path d={bar(x0 + barW + gap, barW, p.previous_revenue, max)} fill="none" stroke="var(--chart-previous)" strokeWidth="1" />`.
- Ở path kỳ này, bỏ `className="bar-rise"` và `style={{ "--i": i } as CSSProperties}`.
- Ở tooltip, bỏ `shadow-[0_6px_20px_rgb(0_0_0/0.45)]`.
- Bỏ `CSSProperties` khỏi import nếu không còn dùng: `import { useEffect, useRef, useState } from "react";`.

Trong `src/app/admin/(protected)/dashboard/page.tsx`:
- Đổi `<h1 className="font-display text-3xl tracking-wide lg:sr-only">` thành `<h1 className="font-display text-3xl lg:sr-only">`.
- Đổi `<div className="develop">` thành `<div>`.
- Thay hai đoạn `<p>` doanh thu và số cốc bên trong `BusinessDayArc` bằng:

```tsx
            {/* Tấm in đảo màu duy nhất của màn (surface brief): doanh thu ngày kinh doanh */}
            <p className="rounded-md bg-ember px-3 py-1 font-display text-[clamp(2rem,12cqw,4.5rem)] leading-none text-ember-ink tabular-nums">
              <AnimatedNumber value={s.day.current.revenue} kind="vnd" />
            </p>
            <p className="font-display text-xl tabular-nums">
              <AnimatedNumber value={s.day.current.item_count} /> món ·{" "}
              <AnimatedNumber value={s.day.current.order_count} /> đơn
            </p>
```

- [ ] **Step 4: Chạy test, xác nhận đạt**

Run: `npm test -- tests/unit/admin/BusinessDayArc.test.tsx tests/unit/admin/PeriodComparison.test.tsx tests/unit/admin/RevenueBars.test.tsx`
Expected: PASS 6/6.

Run: `npm test && npx tsc --noEmit && npx eslint src`
Expected: PASS (trừ test màn order nếu đã đỏ từ đợt 1, ghi nhận); không lỗi kiểu (mọi chỗ dùng `PeriodTotals.cups` đã đổi). `src/app/admin/(protected)/history/page.tsx` có kiểu `Totals` riêng, đợt 4 sửa.

Run: `grep -rnE "\bhalo\b|\bstreak\b|develop|bar-rise|arc-draw|after-draw|shadow-\[|tracking-wide|text-2xl|text-4xl|\bcốc\b" src/app/admin src/components/admin src/app/login`
Expected: chỉ còn trong `src/app/admin/(protected)/history/page.tsx` (đợt 4).

- [ ] **Step 5: Commit**

```bash
git add src/lib/admin/stats.ts src/components/admin/BusinessDayArc.tsx src/components/admin/PeriodComparison.tsx src/components/admin/RevenueBars.tsx "src/app/admin/(protected)/dashboard/page.tsx" tests/unit/admin/BusinessDayArc.test.tsx tests/unit/admin/PeriodComparison.test.tsx tests/unit/admin/RevenueBars.test.tsx
git commit -m "feat(dashboard): đồng hồ in phẳng, tấm doanh thu mực cam, Số món, biểu đồ tô/viền (SRS v3.0 FR-06, R35)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Ảnh chụp, finish review, DESIGN.md, đối chiếu SRS

**Files:**
- Create: `.impeccable/review/desktop.png`, `.impeccable/review/mobile.png` (ảnh chụp, không commit)
- Rewrite (bởi documenter): `DESIGN.md`, `.impeccable/design.json`
- Có thể sửa: các file của Task 1–3 theo phát hiện của reviewer

**Interfaces:**
- Consumes: Task 1–3.
- Produces: DESIGN.md mới mô tả Bao diêm quán bar (token, thang cỡ chữ 6 bậc, hệ đường kẻ, loại nút, luật mực cam); `srs-reviewer` báo "khớp SRS".

- [ ] **Step 1: Chạy detector**

Run: `C:/Users/HP/.claude/skills/impeccable/scripts/impeccable detect --json src/app/globals.css src/app/layout.tsx "src/app/admin/(protected)/layout.tsx" "src/app/admin/(protected)/dashboard/page.tsx" "src/app/admin/(protected)/menu/page.tsx" "src/app/admin/(protected)/settings/page.tsx" src/app/admin/login/page.tsx src/components/admin`
Expected: không lỗi máy móc. Cảnh báo `design-system-font-size` so với DESIGN.md cũ là dự kiến, vì DESIGN.md sẽ được viết lại ở bước 4. Ghi các cảnh báo còn lại vào packet cho reviewer.

- [ ] **Step 2: Chụp ảnh**

Với dev server đang chạy và tài khoản thử (`owner@quan.vn` theo README, chỉ trên `localhost`), chụp ở hai bề rộng:
- `mobile.png`: 390px, `/admin/dashboard`.
- `desktop.png`: 1440px, `/admin/dashboard`.
- Thêm `mobile-menu.png`, `mobile-settings.png`, `mobile-login.png` (`/admin/menu`, `/admin/settings`, `/admin/login`).

Lưu vào `.impeccable/review/`, chụp từ đầu trang, tắt hoặc chờ hết chuyển động. Mở từng file một lần để xác nhận đúng trang, không trống.
**Nếu không có trình duyệt điều khiển được, dừng và hỏi người dùng** (xem Lưu ý).

- [ ] **Step 3: Finish review**

Spawn agent `impeccable-finish-reviewer` với:
- yêu cầu gốc: "tinh chỉnh lại toàn bộ thiết kế, rối mắt, không có luật thiết kế rõ ràng; làm hướng mới; chất quán bar";
- hợp đồng thiết kế trong surface brief admin;
- danh sách file đã đổi;
- đường dẫn ảnh chụp ở bước 2 (ghi rõ tất cả là bắt buộc);
- kết quả detector;
- ghi chú "code-led, không có comp";
- đường dẫn craft floor `C:/Users/HP/.claude/skills/impeccable/reference/craft-floor.md`.

Làm theo disposition trả về (`fix`: sửa một lượt, chụp lại, gửi lại cho đúng reviewer chấm từng mục; `recapture`: chụp lại; `rebuild`: dựng lại vùng bị nêu). Tối đa hai vòng; còn mục mở thì đưa bảng cho người dùng quyết.

- [ ] **Step 4: Viết lại DESIGN.md**

Spawn agent `impeccable-documenter` với: project root, các file đã đổi, hợp đồng thiết kế, `PRODUCT.md`, `C:/Users/HP/.claude/skills/impeccable/reference/document.md`, ranh giới ghi `DESIGN.md` và `.impeccable/design.json`.

DESIGN.md mới phải ghi:
- token như Global Constraints;
- thang cỡ chữ 6 bậc;
- Archivo một họ chữ, kèm quy ước `.font-display`;
- hệ đường kẻ 1px;
- luật mực cam và tấm in đảo màu;
- ba loại nút (chính mực cam, viền, phá hủy);
- nút chính trang chủ quán 48px;
- phần màn order ghi là "đợt 3 dựng". Không mô tả màn order hiện đang hỏng.

Kiểm tra cả hai file có token, không chỉ văn xuôi.

- [ ] **Step 5: Giao `srs-reviewer`, commit**

Prompt cho agent `srs-reviewer`: đối chiếu `git diff <BASE của đợt 2b>..HEAD -- src/ tests/ DESIGN.md` với SRS v3.1 (FR-06, FR-06a, NFR-02, R35, R37), GLOSSARY, `.claude/rules/ui-craft.md`, `.claude/rules/owner-ui.md`, PRODUCT.md. Ghi chú: màn order và Lịch sử đơn hàng là việc của đợt 3–4.
Expected: "khớp SRS". Sửa mọi chỗ lệch, chạy `npm test`, rồi commit:

```bash
git add -A src tests DESIGN.md .impeccable/design.json
git commit -m "docs(design): DESIGN.md cho Bao diêm quán bar, ghi từ bản đã dựng; sửa theo finish review

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
