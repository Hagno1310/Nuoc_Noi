# Brief thiết kế: Trang chủ quán (`/admin/*`)

> Cập nhật 2026-10-17 theo SRS v3.8 (R47, R49). Các thế giới "Phơi sáng dài" và "Bao diêm quán bar" trước đây đã bị thay thế.
> Bản vẽ: `design/design.pen`, làn 4, 5 (điện thoại) và 8 (máy tính 1440px). Hệ thiết kế: `DESIGN.md`. Hành vi: `docs/SRS.md` FR-00b, FR-05–FR-07a.

## 1. Người dùng và nhiệm vụ

- **Buổi tối, điện thoại:** liếc doanh thu tối nay, đơn chờ thanh toán, hủy đơn sai.
- **Ban ngày, máy tính:** xem lịch sử đơn hàng, xuất CSV, sửa thực đơn, chỗ ngồi, giờ mở cửa, PIN quán; xem món bán chạy và giờ cao điểm.

## 2. Kết quả cần đạt

- Mở Tổng quan là thấy doanh thu tối nay (chữ lớn nhất), thời gian còn lại đến giờ đóng cửa, và tiền đang chờ thu (warn, tách khỏi doanh thu).
- Số tiền luôn đầy đủ dạng `1.250.000đ`, không viết tắt.
- Hành động phá hủy (hủy đơn, ẩn món, ẩn chỗ ngồi, đổi PIN) luôn có bước xác nhận.

## 3. Các màn

| Trang | Điện thoại | Máy tính (≥ 1024px) |
|---|---|---|
| Đăng nhập | Một cột, logo, Email, Mật khẩu, nút Đăng nhập ở đáy | Như điện thoại, căn giữa, rộng tối đa 400px |
| Tổng quan | Thẻ Tối nay → Chờ thanh toán → Tuần/Tháng → chọn kỳ → Món bán chạy → Số món theo giờ → Doanh thu theo ngày (Tuần/Tháng) | Tối nay + Tuần/Tháng; Doanh thu theo ngày + Món bán chạy; Số món theo giờ |
| Thực đơn | Danh sách món (kéo, ⋯), Món đã ẩn, Lịch sử đổi giá; tấm Sửa món / Thêm món | Danh sách món + Lịch sử đổi giá hai cột; hộp thoại Sửa món |
| Lịch sử đơn hàng | Từ ngày / Đến ngày, chip trạng thái, thẻ tổng, danh sách dòng hai tầng mở xuống; tấm xác nhận hủy | Bộ lọc một hàng, 5 ô tổng, bảng 7 cột có dòng mở xuống |
| Cài đặt | Giờ mở cửa, Chỗ ngồi, PIN quán, Đăng xuất | Hai cột: Giờ mở cửa + PIN quán / Chỗ ngồi |

Thông báo đơn mới nổi ở mép trên (điện thoại) hoặc góc trên phải (máy tính).

## 4. Dữ liệu và trạng thái

- Doanh thu tối: 0 đến khoảng 12.500.000đ; tháng: tới hàng trăm triệu.
- Lịch sử: tới vài nghìn đơn mỗi khoảng lọc, 50 đơn mỗi trang.
- Trạng thái: đang tải (skeleton), trống (có câu hướng dẫn), lỗi tải (câu SRS), đang lưu, lỗi lưu, xác nhận hai bước, không phải tài khoản chủ quán.
