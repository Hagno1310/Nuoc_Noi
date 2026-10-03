# Brief thiết kế: Trang chủ quán (`/admin/*`)

> Chốt qua `/impeccable shape` ngày 2026-10-04. Thế giới hình ảnh: **Phơi sáng dài**, kế thừa từ `docs/design/order-brief.md`. Bố cục: **Đồng hồ ca** (seed `a922e4bb`, dealt lead, code-led).
> Khi bắt đầu dựng (Task 11–13), ghi phần "Direction contract" vào surface brief theo mục 5 của `new-work` trong impeccable, dựa trên file này.
> Hành vi lấy theo `docs/SRS.md` (FR-00b, FR-05 đến FR-07a). Hoàn cảnh sử dụng lấy theo `PRODUCT.md`.

## 1. Người dùng và nhiệm vụ (Operate)

- Chủ quán dùng **ngang nhau ở hai hoàn cảnh**:
  - **Buổi tối, điện thoại, trong quán tối:** liếc doanh thu đêm nay, hủy đơn sai.
  - **Ban ngày, máy tính:** xem lịch sử đơn hàng, xuất CSV, chỉnh cài đặt khi quán đóng cửa.
- Điều đầu tiên cần thấy: **doanh thu và số cốc của ngày kinh doanh hiện tại**.

## 2. Kết quả cần đạt

- Mở trang là biết ngay đêm nay bán được bao nhiêu, không phải bấm thêm.
- Số tiền không bao giờ mơ hồ: luôn đầy đủ dạng `1.250.000đ`, không viết tắt (`1,25tr`).
- Hành động phá hủy (hủy đơn, đổi PIN quán, ẩn chỗ ngồi) khó chạm trúng do vô tình và luôn có bước xác nhận ngay trên trang.

## 3. Hướng thiết kế

- **Thế giới:** giữ nguyên Phơi sáng dài: nền ô liu đậm có lớp nhiễu hạt tĩnh, chữ kem đã giảm độ sáng, **một màu nhấn than hồng** cho hành động chính và trạng thái đang chọn. Cùng token với màn hình order; không tạo bảng màu sáng riêng.
- **Bố cục: Đồng hồ ca.** Trang Tổng quan lấy **ngày kinh doanh** làm đồng hồ:
  - Một cung mảnh biểu diễn ngày kinh doanh hiện tại (24 giờ, bắt đầu từ **giờ mở cửa** trong Cài đặt), có một vạch "bây giờ".
  - Doanh thu đêm nay là con số lớn nhất, nằm trong lòng cung; số cốc ngay dưới.
  - Doanh thu tháng này nhỏ hơn, phía dưới cung.
  - Ban ngày (ngày kinh doanh đã qua phần lớn) cung gần đầy và đọc như "ca đã đóng"; con số vẫn là của ngày kinh doanh hiện tại.
- **Cung chỉ là đồng hồ, không phải biểu đồ** (SRS R6 bỏ biểu đồ): không vẽ đơn hàng, doanh thu hay mật độ lên cung.
- **Chỉ ghi mốc có thật trong dữ liệu:** giờ mở cửa và giờ hiện tại. Giờ đóng cửa (02:00) không được lưu ở đâu, nên không ghi lên cung.
- **Liên kết với màn hình order:** đơn đã hủy dùng **vạch gạch ngang** như dấu in; trạng thái thể hiện bằng nét mảnh khi nghỉ, khối đặc khi nhấn.

## 4. Phạm vi

- `/admin/login`, khung điều hướng, `/admin/dashboard`, `/admin/history`, `/admin/settings`, trang báo "không phải tài khoản chủ quán".
- **Không làm:** biểu đồ, giao diện sáng riêng cho ban ngày, neon, vùng sáng lớn, icon bằng emoji hay ký tự Unicode, viết tắt số tiền.

## 5. Dữ liệu và trạng thái

- **Dữ liệu:**
  - Doanh thu đêm: 0 đến khoảng 12.500.000đ. Doanh thu tháng: tới hàng trăm triệu (9–11 chữ số kể cả dấu chấm).
  - Lịch sử: 0 đến vài nghìn đơn mỗi khoảng lọc, 50 đơn mỗi trang, 6 cột.
  - Cài đặt: đơn giá chung, 20 lần đổi giá gần nhất, giờ mở cửa, 15 chỗ ngồi trở lên (Bàn, Ghế quầy, có chỗ đã ẩn), PIN quán.
- **Trạng thái cần thiết kế:**
  - Đang tải (skeleton), danh sách trống (có câu hướng dẫn), lỗi tải.
  - Đêm chưa có đơn nào (doanh thu 0đ vẫn hiện rõ, không để trống).
  - Tự tải lại mỗi 60 giây (FR-06): con số đổi tại chỗ, không chớp màn hình.
  - Đang lưu, lưu xong, lỗi khi lưu; xác nhận hai bước khi hủy đơn và đổi PIN.
  - Đăng nhập sai, thử sai quá nhiều lần; tài khoản không phải chủ quán.

## 6. Bố cục và tương tác

| Vùng | Điện thoại (390×844) | Máy tính (≥ 1024) |
|---|---|---|
| Điều hướng | Thanh dưới cố định: Tổng quan · Lịch sử · Cài đặt · Màn hình order. Logo nhỏ và Đăng xuất ở dải trên. | Cột trái hẹp: logo, bốn mục, Đăng xuất ở cuối. |
| Tổng quan | Cung và doanh thu đêm nay chiếm màn hình đầu; tháng này ngay dưới, không cuộn mới thấy. | Cung ở giữa vùng nội dung, tháng này bên dưới. |
| Lịch sử | Bộ lọc Từ ngày – Đến ngày và nút Xuất CSV ở trên; mỗi đơn là một hàng gọn (giờ, chỗ ngồi, số cốc, thành tiền), dòng tổng dính ở đáy trên thanh điều hướng. | Bảng đủ 6 cột, số canh phải, `tabular-nums`, dòng tổng ở cuối bảng. |
| Cài đặt | Một cột các khối: Đơn giá chung (kèm lịch sử đổi giá), Giờ mở cửa, Chỗ ngồi, PIN quán. | Cùng thứ tự, có thể chia hai cột. |

- Hủy đơn trong Lịch sử: bấm "Hủy" thì nút đổi thành "Chắc chắn hủy?" trong vài giây (theo `ui-craft.md`).
- Đăng nhập chủ quán: một cột hẹp ở giữa, logo chữ phụ phía trên, Email và Mật khẩu, nút Đăng nhập dùng màu nhấn.

## 7. Ràng buộc và quyết định còn mở

- Mọi quy tắc trong `.claude/rules/ui-craft.md` và `.claude/rules/owner-ui.md`.
- Font và token **dùng chung với màn hình order**. Hiện `globals.css` và `layout.tsx` vẫn là bản mặc định (Geist, nền trắng) và màn hình order còn dùng class tạm: phải dựng token Phơi sáng dài trước, rồi cả hai nhóm màn hình dùng chung.
- Logo: `public/brand/nuoc-noi-wordmark-small.png`. Không vẽ lại bằng CSS hay font.
- Vùng chạm ≥ 48px trên điện thoại; trên máy tính hàng bảng có thể thấp hơn nhưng nút vẫn ≥ 44px.
- **Còn mở:** người dựng không được tự chọn — cung vẽ đủ 24 giờ hay chỉ phần đã trôi qua; quyết định khi dựng Task 13 cùng người dùng.
