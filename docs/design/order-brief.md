# Brief thiết kế: Màn hình order (`/order`, `/login`)

> Đã chốt qua `/impeccable shape` ngày 2026-10-04. Hướng thiết kế: **Phơi sáng dài** (seed `59dd7cf0`, assigned, code-led).
> Khi bắt đầu dựng (Task 9–10), ghi phần "Direction contract" vào surface brief theo mục 5 của `new-work` trong impeccable, dựa trên file này.
> Hành vi lấy theo `docs/SRS.md`. Hoàn cảnh sử dụng lấy theo `PRODUCT.md`.

## 1. Người dùng và nhiệm vụ (Operate)

- Nhân viên đứng sau quầy bar tối của Nước Nôi, trong ca 20:00–02:00, một tay cầm điện thoại, tay kia pha chế.
- Nhiệm vụ: ghi một đơn hàng (số cốc, chỗ ngồi) trong khoảng 3 lần chạm, chỉ cần liếc nhanh.

## 2. Kết quả cần đạt

- Nhân viên **chắc chắn đơn đã gửi** mà không phải nhìn lại.
- Số tiền không bao giờ mơ hồ.
- Ánh sáng màn hình không làm phiền khách trong phòng tối.

## 3. Hướng thiết kế: Phơi sáng dài

- **Nguồn gốc:** ảnh đêm phơi sáng lâu, chính là nền nhiễu hạt và vệt sáng của logo Nước Nôi.
- **Chất liệu:**
  - Nền ô liu đậm có một lớp nhiễu hạt **tĩnh**.
  - Chữ màu kem đã giảm độ sáng (không dùng trắng).
  - Chỉ **một màu nhấn là than hồng**, như đầu điếu thuốc hay ngọn lửa bật lửa trong logo, dùng cho hành động chính và trạng thái đang chọn.
- **Mảng màu gợi ý** (chốt khi dựng): `#1A1E15` · `#2A3022` · `#F3E6C4` · `#9AA285` · `#E0893A`.
- **Logo:** `public/brand/nuoc-noi-wordmark.png` và `nuoc-noi-wordmark-small.png`, nền trong suốt, tách từ `docs/nuoc-noi.jpg`. Không vẽ lại logo bằng CSS hay bằng font.
- **Chuyển động đặc trưng:** khi gửi thành công, số cốc và thành tiền kéo thành một **vệt sáng ngang** rồi lướt về "Đơn vừa tạo".
  - Màn hình không chớp trắng, không tăng độ sáng.
  - Khi người dùng bật `prefers-reduced-motion`, đổi ngay lập tức, không có chuyển động.
- **Bốn điểm học từ các hướng không được chọn:**
  - Chọn một chỗ ngồi thì các chỗ khác **lùi vào bóng tối**, thay vì làm chỗ được chọn sáng chói lên.
  - Mọi ô bấm khớp vào **một lưới cố định**, không có ô nào lệch cỡ.
  - Trạng thái thể hiện **như dấu in**: nét mảnh khi nghỉ, khối đặc khi nhấn, vạch gạch ngang khi đã hủy.
  - Trong "Đơn vừa tạo", **vệt sáng của mỗi đơn dài theo số cốc**.

## 4. Phạm vi

- Màn hình `/order` và `/login` (nhập PIN), ở mức hoàn thiện để chạy thật.
- **Không làm:** neon hay cyberpunk, vùng sáng lớn, hiệu ứng nhấp nháy, giao diện kiểu app ngân hàng, icon bằng emoji hay ký tự Unicode.

## 5. Dữ liệu và trạng thái

- **Dữ liệu:**
  - Số cốc từ 0 đến 500, tối đa 3 chữ số.
  - Thành tiền tối đa khoảng 12.500.000đ.
  - Chỗ ngồi gồm 12 ghế quầy, 3 bàn và nút Mang về.
  - Mỗi đêm có từ 0 đến khoảng 100 đơn.
- **Trạng thái cần thiết kế:**
  - Đang tải giá, mất mạng, đang gửi.
  - Lỗi mạng (gửi lại bằng cùng mã đơn), giá đã đổi, đơn trùng.
  - Phiên bị thu hồi (quay về `/login`).
  - Danh sách trống, đơn đã hủy.

## 6. Bố cục (khung 390×844, phải dùng được ở 360×640, không cuộn mới thấy nút Xác nhận)

| Vùng, từ trên xuống | Nội dung |
|---|---|
| Dải trên (chỉ để đọc) | Chữ logo nhỏ, dòng "Đơn giá: 25.000đ/cốc" |
| Phần chính | **Số cốc** và **thành tiền** cỡ rất lớn |
| Chỗ ngồi | 12 ghế quầy xếp 2 hàng 6 ghế, giống mép quầy thật; dưới đó là Bàn 1–3 và Mang về |
| Vùng ngón cái | Phím +1 +2 +5 +10 −1 Xóa |
| Sát đáy (luôn hiện) | Thanh **Xác nhận đơn** |
| Cuộn xuống | Đơn vừa tạo |

**Phản hồi sau khi gửi đơn:**
- Chính thanh Xác nhận đổi thành "Đã tạo đơn N cốc – X đ · **Hoàn tác**" trong 5 giây.
- Điện thoại rung ngắn 30ms (chỉ có tác dụng trên Android).
- Chạm vào phím số lượng hay chỗ ngồi thì thanh trở lại thành Xác nhận ngay.

## 7. Ràng buộc

- Font sans có đủ bộ dấu tiếng Việt (`next/font`, `subsets: ["latin", "vietnamese"]`). Số dùng `tabular-nums`.
- Mọi quy tắc trong `.claude/rules/ui-craft.md`.
