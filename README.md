# POS Nước Nôi – quán nước đồng giá

Web app tạo đơn hàng cho quán nước đồng giá: màn hình order cho nhân viên và các trang của chủ quán.

- Đặc tả (nguồn chuẩn): [docs/SRS.md](docs/SRS.md)
- Thuật ngữ: [GLOSSARY.md](GLOSSARY.md)
- Triển khai: [docs/deploy.md](docs/deploy.md) · Kiểm tra tay: [docs/manual-test.md](docs/manual-test.md)

## Chạy local

Cần Node 22 và Docker Desktop đang chạy.

```bash
npm install
npx supabase start
npx supabase status -o env    # tạo .env.local với 4 biến bên dưới
npx supabase db reset         # migration + seed (12 ghế quầy, 3 bàn)
npm run create-user -- owner owner@quan.vn matkhau123
npm run create-user -- staff nhanvien@quan.local 123456
npm run dev                   # http://localhost:3000 (PIN quán: 123456)
```

`.env.local` (lấy giá trị từ `npx supabase status -o env`; file này không commit):

```text
NEXT_PUBLIC_SUPABASE_URL=<API_URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<ANON_KEY>
NEXT_PUBLIC_STAFF_EMAIL=nhanvien@quan.local
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>
```

- Nhân viên: mở `/login`, nhập PIN quán.
- Chủ quán: mở `/admin/login`, đăng nhập bằng email và mật khẩu ở trên.

## Kiểm thử

```bash
npm test                                   # unit (Vitest)
npx supabase db reset && npx supabase test db   # database (pgTAP), cần database trống
```
