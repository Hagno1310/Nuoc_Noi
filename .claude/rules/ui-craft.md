---
paths:
  - "src/app/**"
  - "src/components/**"
---

# Quy tắc thiết kế giao diện

## Nguồn chuẩn về giao diện

- **Hoàn cảnh sử dụng:** `PRODUCT.md`. Người dùng ở trong **phòng tối**, bấm **một tay**, là **người trẻ rành điện thoại**. Mọi quyết định thiết kế phải đứng vững trong hoàn cảnh đó.
- **Hệ thiết kế (màu, font, khoảng cách, bo góc):** `DESIGN.md`, cùng phần "Direction contract" trong surface brief của từng màn hình.
  - Chưa có `DESIGN.md` thì chạy `/impeccable shape <màn hình>` để chốt hướng thiết kế trước khi dựng màn hình đó.
- **Code mẫu trong kế hoạch:** chỉ dùng phần **cấu trúc và hành vi**. Các class màu và kích thước Tailwind trong đó là giá trị tạm. Giá trị thật lấy từ các token trong `DESIGN.md`.

## Hoàn cảnh quyết định thiết kế

- **Nền tối:**
  - Không có vùng trắng hay vùng sáng lớn.
  - Màu nhấn đủ sáng để nhìn rõ nhưng không gây chói.
  - Độ tương phản đạt WCAG AA trên nền tối: chữ thường ≥ 4.5:1, chữ lớn ≥ 3:1.
- **Vùng ngón cái:**
  - Hành động chính, bàn phím số lượng và bàn nằm ở **nửa dưới** màn hình.
  - Thông tin chỉ để đọc (đơn giá chung, danh sách đơn vừa tạo) nằm phía trên hoặc ở vùng phải cuộn tới.
- **Chống bấm nhầm** (SRS NFR-02):
  - Mọi vùng chạm cao và rộng ít nhất 48px. Nút hành động chính cao ít nhất 56px.
  - Các vùng chạm cách nhau ít nhất 8px.
  - Nút phá hủy ("Hủy", "Xóa") đặt xa nút hành động chính và trông khác hẳn nút đó.

## Token và thành phần

- **Màu:** khai báo bằng biến CSS theo **vai trò** trong `src/app/globals.css`, gồm nền, bề mặt, chữ, chữ phụ, viền, nhấn, thành công, cảnh báo và nguy hiểm.
  - Chỉ có **một màu nhấn**, dùng cho hành động chính và trạng thái đang chọn.
  - Component dùng token, không dùng trực tiếp mã màu hay tên màu của Tailwind.
- **Font:**
  - Một họ font sans, nạp bằng `next/font` với `subsets: ["latin", "vietnamese"]`.
  - Cỡ chữ theo thang `rem` cố định.
  - Mọi con số về tiền, số lượng và giờ dùng `tabular-nums`.
- **Icon:**
  - Dùng một bộ icon duy nhất (`lucide-react`), cùng độ dày nét.
  - Nút chỉ có icon phải có `aria-label`.
  - Icon là hình vẽ từ bộ icon, không dùng ký tự Unicode hay emoji.
- **Trạng thái:** mọi điều khiển có đủ các trạng thái mặc định, nhấn, `focus-visible`, vô hiệu, đang xử lý và lỗi.
  - Danh sách và bảng có trạng thái đang tải (dùng skeleton) và trạng thái trống (có câu hướng dẫn việc cần làm).
- **Xác nhận và nhập liệu:** làm ngay trên trang.
  - Hành động phá hủy dùng xác nhận hai bước: bấm "Hủy" thì nút đổi thành "Chắc chắn hủy?" trong vài giây.
  - Đổi tên dùng ô sửa ngay tại chỗ.
  - `window.prompt`, `confirm` và `alert` không thuộc ngôn ngữ giao diện của app.
- **Thông báo:**
  - Nằm ở vị trí không che nút hành động chính và bàn phím số lượng.
  - Dùng `role="status"` cho thông tin, `role="alert"` cho lỗi.
- **Chuyển động:**
  - Kéo dài 150–250ms và chỉ để báo thay đổi trạng thái (gửi, đổi giá, chọn).
  - Tắt khi người dùng bật `prefers-reduced-motion`.
- **Chữ trên giao diện:** nút ghi rõ hành động của nó. Thông báo lỗi nêu vấn đề và cách khắc phục.

## Trước khi báo xong một thay đổi UI

1. Chạy `C:/Users/HP/.claude/skills/impeccable/scripts/impeccable detect --json <các file UI đã đổi>` một lần.
2. Sửa các lỗi máy móc mà nó báo.
3. Kiểm tra trên khung điện thoại 390px với nền tối.
