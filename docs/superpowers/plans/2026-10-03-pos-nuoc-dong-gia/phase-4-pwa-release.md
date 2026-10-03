# Giai đoạn 4: Phát hành

> Thuộc kế hoạch [POS Quán Nước Đồng Giá](../2026-10-03-pos-nuoc-dong-gia.md). Đọc phần **Global Constraints** trong file đó trước khi làm.

**Ngoài phạm vi (SRS v1.3), không được làm:** service worker, cache offline, E2E bằng Playwright.

---

### Task 14: Manifest, tài liệu và kiểm tra tay

**Files:**

- Create: `src/app/manifest.ts`, `src/app/icons/[size]/route.tsx`
- Modify: `src/app/layout.tsx` (thêm `viewport` và `appleWebApp`)
- Create: `docs/deploy.md`, `docs/manual-test.md`
- Create: `README.md` (thay README do `create-next-app` tạo)
- Test: `tests/unit/manifest.test.ts`

**Interfaces:**

- Produces:
  - Manifest tại `/manifest.webmanifest`, với `start_url: "/order"` và `display: "standalone"`.
  - Icon PNG tại `/icons/192` và `/icons/512`.

- [ ] **Step 1: Viết test thất bại**

`tests/unit/manifest.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("manifest", () => {
  it("mở thẳng màn hình order, chạy dạng standalone, có icon 192 và 512", () => {
    const m = manifest();
    expect(m.start_url).toBe("/order");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("vi");
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });
});
```

- [ ] **Step 2: Chạy test và xác nhận nó thất bại**

Chạy `npm test`. Kết quả mong đợi: FAIL vì chưa có `@/app/manifest`.

- [ ] **Step 3: Cài đặt manifest, icon và layout**

`src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quán Nước – Gọi món",
    short_name: "Quán Nước",
    lang: "vi",
    start_url: "/order",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#059669",
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png" },
      { src: "/icons/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
```

`src/app/icons/[size]/route.tsx`:

```tsx
import { ImageResponse } from "next/og";

const SIZES = ["192", "512"];

export function generateStaticParams() {
  return SIZES.map((size) => ({ size }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size } = await params;
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  const px = Number(size);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#059669",
        color: "#ffffff",
        fontSize: px * 0.55,
        fontWeight: 800,
      }}
    >
      N
    </div>,
    { width: px, height: px },
  );
}
```

Sửa `src/app/layout.tsx`: đổi `metadata` và thêm `viewport` như sau. Giữ nguyên `lang="vi"` đã đặt ở Task 10.

```ts
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Quán Nước",
  description: "Gọi món nhanh cho quán nước đồng giá",
  appleWebApp: { capable: true, title: "Quán Nước", statusBarStyle: "default" },
  icons: { apple: "/icons/192" },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};
```

- [ ] **Step 4: Chạy test và xác nhận nó đã qua**

Chạy `npm test`. Kết quả mong đợi: PASS.

- [ ] **Step 5: Viết `docs/manual-test.md`**

```markdown
# Kiểm tra tay trước khi phát hành

Chạy trên bản production ở local: `npx supabase db reset`, tạo tài khoản theo README, rồi `npm run build && npm run start`.
Dùng Chrome ở chế độ thiết bị di động (DevTools → Toggle device toolbar).
Đánh dấu `[x]` cho từng bước đã đạt.

## Nhân viên

- [ ] 1. Mở `/order` khi chưa đăng nhập: bị chuyển sang `/login`.
- [ ] 2. Nhập PIN sai: thấy "Sai mã PIN.". Nhập PIN đúng: vào `/order`.
- [ ] 3. Chỗ ngồi chia hai nhóm: "Ghế quầy" (Quầy 1–12) ở trên, "Bàn" (Bàn 1–3) ở dưới, cùng nút "Mang về". Bấm +5, +2, chọn "Quầy 1": thành tiền là 175.000đ. Bấm "Xác nhận đơn": thông báo "Đã tạo đơn 7 cốc – 175.000đ", màn hình reset, và đơn hiện trong "Đơn vừa tạo".
- [ ] 4. Bấm "Hoàn tác": đơn bị gạch ngang và có nhãn "Đã hủy".
- [ ] 5. DevTools → Network → Offline: thấy nhãn "Mất mạng" và nút Xác nhận bị khóa. Bật lại mạng thì nút dùng được.
- [ ] 6. Chặn request `rpc/create_order` (DevTools → Network → Block request URL), bấm Xác nhận: thấy báo lỗi và số lượng vẫn giữ nguyên. Bỏ chặn rồi bấm lại: chỉ có **một** đơn được tạo (kiểm tra ở trang lịch sử).
- [ ] 7. Đơn tạo hơn 5 phút trước không còn nút "Hủy".

## Chủ quán

- [ ] 8. Đăng nhập `/admin/login`. Trang tổng quan đúng doanh thu và số cốc hôm nay (không tính đơn hủy).
- [ ] 9. Đổi đơn giá chung sang 30.000đ: tab `/order` đổi giá ngay và ô giá nhấp nháy. Lịch sử đổi giá có thêm một dòng.
- [ ] 10. Thêm chỗ ngồi (chọn loại Bàn hoặc Ghế quầy), đổi tên, sắp xếp trong từng loại, ẩn chỗ ngồi: tải lại `/order` thì thấy thay đổi ở đúng nhóm. Đơn cũ vẫn giữ tên chỗ ngồi cũ.
- [ ] 11. Đổi PIN quán: lần bấm tiếp theo trên tab `/order` của nhân viên bị chuyển về `/login`. PIN mới vào được.
- [ ] 12. Lịch sử đơn hàng: lọc theo khoảng ngày, hủy một đơn, rồi xuất CSV. Mở file bằng Excel: tiếng Việt hiển thị đúng, có 7 cột.
- [ ] 13. Tài khoản nhân viên mở `/admin/dashboard`: thấy "Tài khoản này không phải tài khoản chủ quán.".

## Cài ra màn hình chính

- [ ] 14. Chrome Android: menu ⋮ → "Thêm vào màn hình chính" → mở app từ biểu tượng thì vào thẳng `/order`, toàn màn hình.
```

- [ ] **Step 6: Viết `docs/deploy.md`**

````markdown
# Triển khai Quán Nước

## 1. Supabase (một lần)

1. Tạo project tại https://supabase.com, chọn region **Singapore**.
2. Ở máy dev, chạy:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push        # áp các migration (không chạy seed.sql)
   ```
3. Dashboard → Authentication → Sign In / Providers: **tắt "Allow new users to sign up"**.
4. Dashboard → Project Settings → API: lấy `Project URL`, `anon key` và `service_role key`.

## 2. Tạo tài khoản

Tạo file `.env.production.local` ở máy dev (file này **không commit**):

```text
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

```bash
node --env-file=.env.production.local scripts/create-user.mjs owner <email chủ quán> <mật khẩu ≥ 8 ký tự>
node --env-file=.env.production.local scripts/create-user.mjs staff nhanvien@quan.local <PIN quán 6 số>
```

## 3. Vercel

1. Đẩy repo lên GitHub, rồi import vào https://vercel.com.
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `NEXT_PUBLIC_STAFF_EMAIL=nhanvien@quan.local`.
   **Không** thêm service_role key.
3. Deploy.

## 4. Cài đặt quán và kiểm tra lần đầu

1. Mở `https://<tên>.vercel.app/admin`, đăng nhập chủ quán. Đặt **đơn giá chung**, **giờ mở cửa**, thêm **chỗ ngồi** (12 ghế quầy và 3 bàn, chọn đúng loại khi thêm).
2. **Bắt buộc:** thử đổi PIN quán một lần trên production, rồi đăng nhập `/login` bằng PIN mới.
   Bước này xác nhận hàm `set_shop_pin` có quyền ghi vào `auth.users` trên Supabase cloud.
   Nếu thấy lỗi `permission denied`, báo lại trước khi cho nhân viên dùng.

## 5. Cài lên điện thoại nhân viên

- **Android (Chrome):** mở link, chọn menu ⋮ → "Thêm vào màn hình chính".
- **iPhone (Safari):** mở link, bấm nút Chia sẻ → "Thêm vào MH chính".
- Mở app từ biểu tượng và nhập PIN quán.

## 6. Vận hành

- **Nghỉ hơn 7 ngày:** Supabase gói miễn phí tạm dừng database. Vào Dashboard → bấm **Restore project**.
- **Sao lưu:** đầu mỗi tháng, vào Lịch sử đơn hàng, lọc cả tháng trước, rồi bấm **Xuất CSV** và lưu file lại.
- **Nhân viên nghỉ việc:** đổi PIN quán trong trang Cài đặt.
- **Cập nhật app:** push lên `main`, Vercel tự deploy. Có migration mới thì chạy `npx supabase db push`.
````

- [ ] **Step 7: Viết `README.md`**

````markdown
# POS Quán Nước Đồng Giá

Web app gọi món cho quán nước đồng giá: màn hình order cho nhân viên và trang quản lý cho chủ quán.

- Đặc tả (nguồn chuẩn): [docs/SRS.md](docs/SRS.md)
- Thuật ngữ: [GLOSSARY.md](GLOSSARY.md)
- Triển khai: [docs/deploy.md](docs/deploy.md) · Kiểm tra tay: [docs/manual-test.md](docs/manual-test.md)

## Chạy local

Cần Node 22 và Docker Desktop đang chạy.

```bash
npm install
npx supabase start
npx supabase status -o env    # chép URL, ANON_KEY, SERVICE_ROLE_KEY vào .env.local
                              # thêm NEXT_PUBLIC_STAFF_EMAIL=nhanvien@quan.local
npx supabase db reset         # migration + seed (12 ghế quầy, 3 bàn)
npm run create-user -- owner owner@quan.vn matkhau123
npm run create-user -- staff nhanvien@quan.local 123456
npm run dev                   # http://localhost:3000 (PIN quán: 123456)
```

## Kiểm thử

```bash
npm test                 # unit (Vitest)
npx supabase test db     # database (pgTAP)
```
````

- [ ] **Step 8: Chạy toàn bộ bộ kiểm thử và danh sách kiểm tra tay**

Chạy `npm test && npx supabase test db && npm run lint && npm run build`. Kết quả mong đợi: tất cả đều xanh.

Sau đó làm lần lượt 14 bước trong `docs/manual-test.md` và đánh dấu từng bước. Bước nào không đạt thì sửa trước khi commit.

- [ ] **Step 9: Kiểm tra lại README**

Làm theo đúng mục "Chạy local" trong README trên một thư mục clone mới (`git clone . ../pos-check`), từ `npm install` đến đăng nhập được bằng PIN. Nếu thiếu bước nào thì sửa README cho đúng, sau đó xóa `../pos-check`.

- [ ] **Step 10: Commit**

```bash
git add src tests/unit/manifest.test.ts docs README.md
git commit -m "feat: web app manifest and icons; docs: deploy runbook, manual test checklist, README

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
