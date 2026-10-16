# POS Nước Nôi

Web app tạo đơn hàng cho quán bar Nước Nôi: màn hình order cho nhân viên (thu tiền ngay hoặc trả sau) và các trang của chủ quán (điện thoại và máy tính).

- Đặc tả (nguồn chuẩn): [docs/SRS.md](docs/SRS.md)
- Thiết kế: [design/design.pen](design/design.pen) (mở bằng pen.dev) · Hệ thiết kế: [DESIGN.md](DESIGN.md)
- Thuật ngữ: [GLOSSARY.md](GLOSSARY.md)
- Triển khai: [docs/deploy.md](docs/deploy.md) · Kiểm tra tay: [docs/manual-test.md](docs/manual-test.md)

## Chạy local

Cần Node 22 và Docker Desktop đang chạy.

```bash
npm install
npx supabase start
cp .env.example .env.local    # điền theo hướng dẫn bên dưới
npx supabase db reset         
npm run create-user -- owner owner@quan.vn matkhau123
npm run create-user -- staff nhanvien@quan.local 123456
npm run dev                   # http://localhost:3000 (PIN quán: 123456)
```

`.env.local`: chép từ [.env.example](.env.example) rồi điền (Supabase lấy từ `npx supabase status -o env`, Cloudinary từ Cloudinary → Settings → API Keys). File này không commit.

- Nhân viên: mở `/login`, nhập PIN quán.
- Chủ quán: mở `/admin/login`, đăng nhập bằng email và mật khẩu ở trên.

## Kiểm thử

```bash
npm test                                   # unit (Vitest)
npx supabase db reset && npx supabase test db   # database (pgTAP), cần database trống
```
