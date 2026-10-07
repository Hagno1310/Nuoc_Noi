# Triển khai Nước Nôi

## 1. Supabase (một lần)

1. Tạo project tại https://supabase.com, chọn region **Singapore**.
2. Ở máy dev, chạy:
   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push        # áp các migration (không chạy seed.sql)
   ```
3. Dashboard → Authentication → Sign In / Providers:
   - Giữ **Email** được bật (nhân viên và chủ quán đều đăng nhập bằng email + mật khẩu).
   - **Tắt "Allow new users to sign up"** (SRS Q27). `supabase/config.toml` chỉ áp dụng cho bản local, không tự áp lên cloud.
4. Dashboard → Project Settings → API: lấy `Project URL`, `anon key` và `service_role key`.

## 2. Tạo tài khoản

Tạo file `.env.production.local` ở máy dev (file này **không commit**; `.env*` đã nằm trong `.gitignore`):

```text
NEXT_PUBLIC_SUPABASE_URL=<Project URL>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

```bash
node --env-file=.env.production.local scripts/create-user.mjs owner <email chủ quán> <mật khẩu ≥ 8 ký tự>
node --env-file=.env.production.local scripts/create-user.mjs staff nhanvien@quan.local <PIN quán 6 số>
```

Email của tài khoản nhân viên phải trùng `NEXT_PUBLIC_STAFF_EMAIL` ở bước 3, nếu không trang `/login` sẽ không đăng nhập được.
Quán chỉ có **một** tài khoản chủ quán (SRS FR-05a).

## 3. Vercel

1. Đẩy repo lên GitHub, rồi import vào https://vercel.com.
2. Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` và `NEXT_PUBLIC_STAFF_EMAIL=nhanvien@quan.local`.
   **Không** thêm service_role key (SRS NFR-04).
   Thêm `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Cloudinary → Settings → API Keys). Hai biến sau **không** có tiền tố `NEXT_PUBLIC_`.
3. Deploy. Hàm server chạy ở Singapore (`sin1`, khai báo trong `vercel.json`), cạnh Supabase; đổi region Supabase thì đổi cả dòng này.

Đặt cùng ba biến vào `.env.local` để chạy local (file không commit).

## 4. Cài đặt quán và kiểm tra lần đầu

1. Mở `https://<tên>.vercel.app/admin`, đăng nhập chủ quán. Đặt **đơn giá chung** (tối đa 500.000đ), **giờ mở cửa** (mặc định 20), thêm **chỗ ngồi** (12 ghế quầy và 3 bàn, chọn đúng loại khi thêm).
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
