---
paths:
  - "src/**"
  - "scripts/**"
  - ".env*"
---

# Quy tắc về khóa bí mật

Đối chiếu SRS NFR-04.

- **`SUPABASE_SERVICE_ROLE_KEY` chỉ được đọc trong `scripts/`**, là những script chạy trên máy dev. Code trong `src/` chỉ dùng `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STAFF_EMAIL` và `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
- **`CLOUDINARY_API_KEY` và `CLOUDINARY_API_SECRET` chỉ được đọc trong `src/app/api/transfer-photo/sign/route.ts`** (SRS NFR-04). Route đó kiểm tra `is_staff()` trước khi ký, và không bao giờ trả secret về trình duyệt.
- **Mọi quyền hạn vượt quá anon key** được cấp qua hàm Postgres có kiểm tra `is_owner()` hoặc `is_staff()`, không cấp qua key.
- **File `.env*` chỉ nằm trên máy.** Khi cần chỉ chỗ lấy một giá trị, ghi tên biến và nguồn của nó (ví dụ `npx supabase status -o env`), không ghi giá trị thật.
