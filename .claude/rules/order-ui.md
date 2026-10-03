---
paths:
  - "src/app/order/**"
  - "src/app/login/**"
  - "src/components/order/**"
  - "src/hooks/**"
  - "src/lib/order/**"
  - "src/lib/api.ts"
---

# Quy tắc màn hình order (nhân viên)

Đối chiếu SRS FR-00a đến FR-04b và NFR-01, NFR-02 trước khi sửa.

Quy tắc thiết kế (kích thước vùng chạm, màu, icon, trạng thái) nằm ở `ui-craft.md`.

- **Số lượng và thành tiền** là hai con số lớn nhất trên màn hình. Nhân viên phải đọc được chúng chỉ trong một cái liếc.
- **Đơn giá của đơn do server quyết định.** Client chỉ gửi giá đang hiển thị để server so sánh, và hiển thị `unit_price` / `total_amount` mà server trả về.
- **Gửi đơn:**
  - Màn hình chỉ reset sau khi server xác nhận đơn.
  - Bấm gửi lại sau lỗi mạng phải dùng **cùng mã đơn**, cho tới khi gửi thành công.
- **Mất mạng:** khóa nút "Xác nhận đơn" và hiện thông báo. Đây là cách xử lý duy nhất, vì mọi thao tác đều cần mạng (SRS §1.3).
- **Mã lỗi `FORBIDDEN`** từ RPC nghĩa là phiên đăng nhập đã bị thu hồi. Khi đó đăng xuất và chuyển về `/login`.
- **Gọi RPC** qua `createStaffApi` trong `src/lib/api.ts`, để mọi lỗi đều được phân loại thành `NetworkError` hoặc `RpcError`.
