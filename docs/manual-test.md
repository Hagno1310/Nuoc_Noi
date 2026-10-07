# Kiểm tra tay trước khi phát hành

Chạy trên bản production ở local: `npx supabase db reset`, tạo tài khoản theo README, rồi `npm run build && npm run start`.
Dùng Chrome ở chế độ thiết bị di động (DevTools → Toggle device toolbar).
Đánh dấu `[x]` cho từng bước đã đạt. Đối chiếu hành vi với `docs/SRS.md`.

## Nhân viên

- [ ] 1. Mở `/order` khi chưa đăng nhập: bị chuyển sang `/login`.
- [ ] 2. Nhập PIN sai: thấy "Sai mã PIN.". Nhập PIN đúng: vào `/order`.
- [ ] 3. Chỗ ngồi chia hai nhóm: "Ghế quầy" (Quầy 1–12) ở trên, "Bàn" (Bàn 1–3) ở dưới, cùng nút "Mang về". Bấm +5, +2, chọn "Quầy 1": thành tiền là 175.000đ. Bấm "Xác nhận đơn": thông báo "Đã tạo đơn 7 cốc – 175.000đ", màn hình reset, và đơn hiện trong "Đơn vừa tạo".
- [ ] 4. Bấm "Hoàn tác": nút hiện "Đang hủy…" rồi đơn bị gạch ngang và có nhãn "Đã hủy".
- [ ] 5. DevTools → Network → Offline: thấy "Mất mạng – chưa gửi được đơn" và nút Xác nhận bị khóa. Bật lại mạng thì nút dùng được và danh sách chỗ ngồi tải lại.
- [ ] 6. Chặn request `rpc/create_order` (DevTools → Network → Block request URL), bấm Xác nhận: thấy báo lỗi và số lượng vẫn giữ nguyên. Bỏ chặn rồi bấm lại: chỉ có **một** đơn được tạo (kiểm tra ở Lịch sử đơn hàng).
- [ ] 7. Đơn tạo hơn 5 phút trước không còn nút "Hủy".

## Chủ quán

- [ ] 8. Đăng nhập `/admin/login`. Tổng quan đúng doanh thu và số cốc của ngày kinh doanh (không tính đơn hủy); cung chỉ vẽ phần ngày kinh doanh đã trôi qua. Tạo thêm một đơn: trong vòng 60 giây số liệu tự cập nhật.
- [ ] 9. Đổi đơn giá chung sang 30.000đ: tab `/order` đổi giá ngay và ô giá nhấp nháy. Lịch sử đổi giá có thêm một dòng ghi email chủ quán. Nhập 600.000: bị báo "Giá phải là số nguyên từ 1đ đến 500.000đ.".
- [ ] 10. Thêm chỗ ngồi (chọn loại Bàn hoặc Ghế quầy), đổi tên, sắp xếp trong từng loại, ẩn chỗ ngồi (bấm "Ẩn" rồi "Chắc chắn ẩn?"): tải lại `/order` thì thấy thay đổi ở đúng nhóm. Đơn cũ vẫn giữ tên chỗ ngồi cũ.
- [ ] 11. Đổi PIN quán (bấm "Đổi PIN quán" rồi "Chắc chắn đổi PIN?"): lần bấm tiếp theo trên tab `/order` của nhân viên bị chuyển về `/login`. PIN mới vào được.
- [ ] 12. Lịch sử đơn hàng: lọc theo khoảng ngày (nhập ngược thì tự đảo), hủy một đơn ("Hủy" rồi "Chắc chắn hủy?"), rồi xuất CSV. Mở file bằng Excel: tiếng Việt hiển thị đúng, có 9 cột (Thời gian, Ngày kinh doanh, Chỗ ngồi, Món, Số lượng, Đơn giá, Thành tiền, Trạng thái, Thanh toán), mỗi dòng đơn một hàng kèm hàng "Giảm giá N%" nếu có, đơn hủy ghi "Đã hủy".
- [ ] 13. Tài khoản nhân viên mở `/admin/dashboard`: thấy "Tài khoản này không phải tài khoản chủ quán.". Mở `/admin/login` thì vẫn thấy form đăng nhập.

## Cài ra màn hình chính

- [ ] 14. Chrome Android: menu ⋮ → "Thêm vào màn hình chính" → mở app từ biểu tượng (logo Nước Nôi) thì vào thẳng `/order`, toàn màn hình. Safari iOS: Chia sẻ → "Thêm vào MH chính", kết quả tương tự.

## Thanh toán và ảnh chuyển khoản (SRS v3.3 FR-04c, R39)

Cần `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` thật. Thử trên **Chrome Android** và **Safari iOS** bằng điện thoại thật (camera thật).

- [ ] Xác nhận đơn → Tiền mặt: đơn tạo ngay, "Đã tạo đơn…" + Hoàn tác.
- [ ] Xác nhận đơn → Chuyển khoản: QR hiện rõ, quét được bằng app ngân hàng.
- [ ] "Chụp ảnh chuyển khoản" mở camera sau. Chụp xong thấy ảnh, nút xác nhận hiện "Đang tải ảnh…" rồi bật.
- [ ] "Chụp lại" thay ảnh; ảnh mới nhất là ảnh được lưu (mở Lịch sử để kiểm tra).
- [ ] Bật chế độ máy bay sau khi chụp: báo "Chưa tải được ảnh…"; tắt máy bay, "Thử lại" thành công.
- [ ] "Quay lại" ở mọi bước: giỏ đơn còn nguyên, không có đơn mới trong Lịch sử.
- [ ] Đơn vừa tạo: đơn chuyển khoản có nút máy ảnh, bấm xem ảnh to, "Đóng" tắt.
- [ ] Lịch sử đơn hàng: mở đơn chuyển khoản thấy ảnh nhỏ; bấm thấy ảnh to; dòng tổng tách Tiền mặt / Chuyển khoản; CSV có cột Thanh toán.
- [ ] Đổi PIN quán khi điện thoại nhân viên đang ở bước chụp ảnh: lần tải ảnh kế tiếp đưa về `/login`.

## Chữ gốc 16px (R40)

- [ ] Điện thoại 360px: nút Ghế quầy vẫn 2 hàng × 6; thanh giỏ đơn không tràn.
- [ ] Trang chủ quán ở 390px: thanh điều hướng dưới và dòng tổng Lịch sử không tràn.
