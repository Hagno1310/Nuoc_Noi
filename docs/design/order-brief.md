# Brief thiết kế: Màn hình order (`/order`, `/login`)

> Chốt lại qua `/impeccable shape` ngày 2026-10-05, theo SRS v3.0 (thực đơn nhiều món, giỏ đơn, giảm giá). Bản trước (2026-10-04, đồng giá, số cốc khổng lồ) đã thay hẳn.
> **Cập nhật 2026-10-05:** thế giới thiết kế đổi sang **Bao diêm quán bar** (seed `73f06246`, re-roll 3, code-led). Hợp đồng thiết kế nằm trong surface brief `src/app/order/page.tsx`. Phần hành vi, trạng thái và dữ liệu (mục 1, 2, 6, 7, 8) vẫn giữ; mục 3–5 bên dưới đã viết lại theo thế giới mới.
> Khi dựng (đợt 3, `docs/superpowers/specs/2026-10-04-thuc-don-giam-gia-design.md` §5), ghi lại phần "Direction contract" trong surface brief `src/app/order/page.tsx` theo mục 5 của `new-work` trong impeccable, dựa trên file này.
> Hành vi lấy theo `docs/SRS.md` (FR-01–FR-04b). Hoàn cảnh sử dụng lấy theo `PRODUCT.md`. Ống kính phê bình: skill `frontend-design`; khi lệch thì DESIGN.md thắng.

## 1. Người dùng và nhiệm vụ (Operate)

- Nhân viên đứng sau quầy bar tối của Nước Nôi, trong ca 20:00–02:00, một tay cầm điện thoại, tay kia pha chế.
- Nhiệm vụ: ghi một đơn (các món, chỗ ngồi, có thể giảm giá). Một đơn một món chỉ cần **bốn chạm**: chạm món → Giỏ đơn → chạm chỗ ngồi → Xác nhận đơn.

## 2. Kết quả cần đạt

- **Thành tiền** đọc được trong một cái liếc, ở bất cứ lúc nào.
- **Không bao giờ gửi nhầm chỗ ngồi:** chỗ ngồi bắt buộc chọn và được nhắc lại cỡ lớn ngay trên nút Xác nhận.
- Mọi lần chạm có phản hồi dưới 200ms (NFR-01).
- Nhân viên **chắc chắn đơn đã gửi** mà không phải nhìn lại.
- Ánh sáng màn hình không làm phiền khách trong phòng tối.

## 3. Hướng thiết kế: Bao diêm quán bar

- **Luận điểm:** mỗi màn là mặt bao diêm in của Nước Nôi. Thực đơn là bảng giá in đậm; gửi đơn là quẹt một que diêm.
- **Chỉ một chỗ nổi bật nhất:** tấm in đảo màu mực cam ở đáy, chở Thành tiền.
- **Chất liệu:** bìa đen mờ phẳng, chữ kem, đúng một màu mực cam lửa cho hành động chính và lựa chọn đang có hiệu lực, dải quẹt diêm nhám là đường chia duy nhất có chất liệu.
- **Luật:** một họ chữ (Archivo, hẹp đậm cho tiêu đề và con số, thường cho chữ), thang trung tính 5 bậc, một hệ đường kẻ 1px; không quầng sáng, vệt sáng, nhiễu hạt hay bóng đổ; trạng thái như dấu in; món ngừng bán in xám, giữ chỗ.
- **Giữ:** logo vẽ tay (in phẳng, bỏ quầng sáng), motif điếu thuốc khi đơn vừa tạo.
- **Từ chối:** POS tối kiểu neon phát sáng, lưới ô màu, ảnh đồ uống, tab danh mục, icon bằng emoji hay ký tự Unicode.

## 4. Bố cục điện thoại (khung 360×640 và 390×844)

| Vùng, từ trên xuống | Nội dung |
|---|---|
| Dải trên | Logo vẽ tay bên trái; liên kết "Trang chủ quán" bên phải nếu là chủ quán |
| Bảng giá | Mỗi món một hàng in đậm cao 56px, cách nhau bằng đường kẻ 1px: tên chữ hẹp đậm bên trái (tối đa 2 dòng), giá bên phải. Chạm hàng là +1, nhấn thì hàng đảo màu kem 150ms. Có trong giỏ: số lượng mực cam ở đầu hàng |
| Cuộn xuống | Đơn vừa tạo, chia cột: giờ và chỗ ngồi bên trái, món ở giữa (xuống dòng được), thành tiền canh phải; có giảm giá thì thêm "−N%" cạnh thành tiền |
| Sát đáy (dính) | **Dải quẹt diêm** nhám, trên đó **tấm in mực cam** cao 64px: trái là "3 món" nhỏ ở trên, **Thành tiền** chữ hẹp đậm cỡ lớn ở dưới; phải là nút **Giỏ đơn**. Giỏ trống: không có tấm cam, chỉ dải quẹt và chữ "Chạm món để thêm" |

**Tấm giỏ đơn** (trượt lên 250ms, khoảng 85% chiều cao; kéo xuống hoặc chạm nền tối để đóng). Từ trên xuống, càng gần đáy càng là thao tác chính:
1. Tiêu đề "Giỏ đơn" và **Xóa hết** (viền danger, trên cùng, xa Xác nhận; hai bước "Chắc chắn xóa hết?").
2. Dòng đơn: tên món và đơn giá; − / ô số / + (mỗi nút 48px); thành tiền dòng canh phải.
3. Giảm giá: nút 5%, 10%, 15%, 20% và ô nhập "%"; bấm lại nút đang chọn thì bỏ. Tổng: Tạm tính, Giảm N% −X đ, **Thành tiền** cỡ lớn.
4. Chỗ ngồi: Ghế quầy 2 hàng × 6 như mép quầy thật; Bàn 4 cột. Nút cao 56px, số chữ hẹp đậm 1.5rem. Đang chọn: khối mực cam, chữ đen; các chỗ khác in xám nhạt hơn.
5. Tên chỗ ngồi đang chọn cỡ lớn ("Ghế 5"), không có chữ "Đang chọn:"; chưa chọn thì "Chưa chọn chỗ ngồi" màu cảnh báo.
6. **Xác nhận đơn**: khối mực cam, cao 64px, dính đáy tấm. Bị khóa thì ghi lý do ngay trên nút.

## 5. Bố cục màn rộng (≥ 768px)

Bảng giá chiếm khoảng 60% bên trái (một hoặc hai cột hàng tùy bề rộng). Phiếu đơn luôn hiện bên phải, cùng nội dung tấm giỏ đơn; không có thanh giỏ đơn.

## 6. Phản hồi sau khi gửi đơn

- Tấm giỏ đơn đóng. Thanh giỏ đơn nhường chỗ cho thanh phản hồi: motif điếu thuốc bốc khói, "Đã tạo đơn 3 món – 513.000đ", nút **Hoàn tác**, trong 5 giây.
- Dải quẹt diêm bùng sáng một lần từ trái sang phải trong 400ms (thay cho `exposure-streak`). Điện thoại rung ngắn 30ms (chỉ có tác dụng trên Android). Khi bật giảm chuyển động: dải đổi màu tức thì rồi trở lại, không chạy.
- Chạm vào món bất kỳ thì thanh trở lại thành thanh giỏ đơn ngay.

## 7. Dữ liệu và trạng thái

- **Dữ liệu:** 8 món lúc khởi tạo (chủ quán thêm được); tên món tới khoảng 24 ký tự; giá 1.000đ–5.000.000đ; mỗi dòng 1–99; tối đa 30 dòng; thành tiền tới 1.000.000.000đ; 12 ghế quầy, 3 bàn; 0 đến khoảng 100 đơn mỗi đêm.
- **Trạng thái cần thiết kế:**
  - Đang tải thực đơn: khung xương các ô món.
  - Thực đơn trống: "Chưa có món nào đang bán – nhờ chủ quán thêm ở trang Thực đơn."
  - Giỏ trống, giỏ đầy 30 dòng.
  - Thực đơn đổi realtime: dòng bị đổi giá nổi màu cảnh báo khoảng 3 giây; món bị ẩn thì dòng gạch ngang kèm "Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại", Xác nhận khóa.
  - `MENU_CHANGED`: "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại."
  - Mất mạng, đang gửi ("Đang gửi…"), lỗi mạng (gửi lại bằng cùng mã đơn), phiên bị thu hồi (về `/login`).
  - Đơn vừa tạo trống, đơn đã hủy (gạch ngang).
  - `prefers-reduced-motion`: bỏ trượt và nảy, chỉ giữ đổi độ mờ.

## 8. Phạm vi và ràng buộc

- Màn `/order`, ở mức hoàn thiện để chạy thật. `/login` (nhập PIN) giữ nguyên.
- Không đụng tới: logo, bảng màu, hai họ chữ, quy tắc tách ô thông báo lỗi và thông tin (FR-04).
- Vùng chạm ≥ 48px, nút chính ≥ 56px, cách nhau ≥ 8px (NFR-02). Số dùng `tabular-nums`. Mọi quy tắc trong `.claude/rules/ui-craft.md`.
- DESIGN.md cập nhật sau khi đợt 3 dựng xong, từ chính bản đã dựng.
