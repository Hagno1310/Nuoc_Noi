---
paths:
  - "src/app/admin/**"
  - "src/components/admin/**"
  - "src/lib/admin/**"
  - "src/lib/csv.ts"
  - "src/middleware.ts"
---

# Quy tắc trang chủ quán

Đối chiếu SRS FR-00b và FR-05 đến FR-07a trước khi sửa.

- **Đọc dữ liệu** trong server component bằng `createServerSupabase()`. Quyền đọc do RLS và `is_owner()` bảo vệ.
- **Ghi dữ liệu** trong client component bằng `getBrowserSupabase()`, qua RPC hoặc bảng có RLS dành cho chủ quán. Ghi xong thì gọi `router.refresh()`.
- **Doanh thu và số món chỉ tính đơn đã thanh toán.** Đơn chờ thanh toán hiện riêng (màu warn), không cộng vào doanh thu. Đơn đã hủy vẫn hiện trong lịch sử, có gạch ngang.
- **CSV** giữ đúng định dạng của FR-07a: BOM, CRLF, 10 cột (có Ghi chú), và chặn công thức Excel.
- **Hai bố cục:** điện thoại (thanh điều hướng dưới, một cột) và máy tính từ 1024px (thanh bên trái, nhiều cột), theo làn 4, 5 và 8 của `design/design.pen`.
- **Phần logic có thể sai** (kiểm tra đầu vào, khoảng ngày, định dạng CSV) đặt trong hàm thuần ở `src/lib/`, kèm test Vitest.
