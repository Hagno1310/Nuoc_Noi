# Brief thiết kế: Màn hình order (`/order`, `/login`)

> Cập nhật 2026-10-17 theo SRS v3.8 (R45–R49). Bản "Bao diêm quán bar" trước đây đã bị thay thế.
> Bản vẽ: `design/design.pen`, làn 1, 2, 3, 6, 7. Hệ thiết kế: `DESIGN.md`. Hành vi: `docs/SRS.md` FR-00a–FR-04d.

## 1. Người dùng và nhiệm vụ

- Nhân viên đứng sau quầy bar tối, ca 20:00–02:00, một tay cầm điện thoại.
- Nhiệm vụ: ghi một đơn (món, ghi chú, chỗ ngồi), rồi thu tiền ngay (tiền mặt / chuyển khoản) hoặc ghi Trả sau; về sau thu tiền đơn chờ thanh toán.
- Đơn một món, trả tiền mặt: chạm món → Giỏ đơn → chỗ ngồi → Xác nhận đơn → Tiền mặt.

## 2. Kết quả cần đạt

- Tạm tính / Thành tiền đọc được trong một cái liếc.
- Không gửi nhầm chỗ ngồi: "Đang chọn: <tên>" ngay trên nút Xác nhận đơn.
- Mỗi chạm có phản hồi dưới 200ms (số nảy, rung nhẹ).
- Tiền chưa thu (Trả sau) luôn nhìn ra được: màu warn, badge "Chờ thanh toán".

## 3. Các màn (theo canvas)

| Làn | Màn |
|---|---|
| 1 | Đăng nhập PIN · Order trống · Order có món · Tấm giỏ đơn · Tấm thanh toán · Đang gửi… · Gửi xong + Hoàn tác |
| 2 | Mã QR · Đang tải ảnh… · Kiểm tra ảnh · Xem lại ảnh chuyển khoản |
| 3 | Xóa hết hai bước · Mất mạng · Thực đơn vừa đổi · Lỗi tải ảnh |
| 6 | Đã ghi Trả sau · Danh sách chờ thanh toán · Chi tiết đơn chờ (lượt gọi, Hủy, Gọi thêm, Thu tiền) · Thu tiền |
| 7 | Chạm giữ nhập số lượng · Dòng đơn có ghi chú · Tấm ghi chú |

## 4. Bố cục điện thoại (390×844)

- **Đầu màn:** logo chữ phụ; nút "Chờ thanh toán" kèm badge warn; nút tròn mở Đơn vừa tạo. Chủ quán thấy thêm liên kết "Trang chủ quán".
- **Lưới món 2 cột** (ô 116px), Đơn vừa tạo bên dưới (thẻ từng đơn, nút Hủy danger-soft, icon máy ảnh cho đơn chuyển khoản, "Trả sau" màu warn).
- **Thanh giỏ đơn** dính đáy (72px, bo 20px).
- **Tấm giỏ đơn:** Xóa hết · dòng đơn (ghi chú, stepper) · Chỗ ngồi (Ghế quầy 2×6, Bàn 3 cột, chấm warn cho chỗ đang chờ thanh toán) · đáy dính: Tạm tính, Đang chọn, Xác nhận đơn.
- **Tấm thanh toán:** Quay lại + chỗ ngồi · Tạm tính · chip giảm giá · Thành tiền cỡ display · Khách trả bằng? · Chuyển khoản · Tiền mặt · Trả sau.

## 5. Màn rộng (≥ 768px)

Lưới món bên trái (3–4 cột), phiếu đơn luôn hiện bên phải với cùng nội dung tấm giỏ đơn; tấm thanh toán là hộp thoại giữa màn.

## 6. Dữ liệu và trạng thái

- 8 món lúc khởi tạo; tên tới khoảng 24 ký tự; số lượng 1–99; tối đa 30 dòng mỗi giỏ, 60 dòng mỗi đơn chờ thanh toán; ghi chú ≤ 60 ký tự.
- Trạng thái: đang tải thực đơn (khung xương ô món), thực đơn trống, giỏ trống, mất mạng, đang gửi, lỗi mạng (gửi lại cùng mã), thực đơn vừa đổi, món ngừng bán, đơn đã bị hủy, đơn đã được thu tiền ở máy khác, đang tải ảnh, lỗi tải ảnh, phiên bị thu hồi.
