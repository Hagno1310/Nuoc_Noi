# Brief thiết kế: Màn hình order (`/order`, `/login`)

> Chốt lại qua `/impeccable shape` ngày 2026-10-05, theo SRS v3.0 (thực đơn nhiều món, giỏ đơn, giảm giá). Bản trước (2026-10-04, đồng giá, số cốc khổng lồ) đã thay hẳn.
> Hướng thiết kế: **Phơi sáng dài** (seed `59dd7cf0`, assigned, code-led), giữ nguyên thế giới, đổi nhân vật chính.
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

## 3. Hướng thiết kế: Phơi sáng dài, nhân vật chính mới

- **Luận điểm:** lưới món viền mảnh lùi trong bóng tối; chỉ **Thành tiền** cháy sáng ở đáy, trong vùng ngón cái. Ember chỉ dành cho hành động chính (Giỏ đơn, Xác nhận đơn) và chỗ ngồi đang chọn.
- **Chỉ một chỗ nổi bật nhất:** Thành tiền. Món đã có trong giỏ chỉ đổi viền sang **kem** kèm số lượng kem nhỏ ở góc; không có huy hiệu ember.
- **Giữ nguyên:** nền ô liu có nhiễu hạt tĩnh, chữ kem (không trắng), một màu nhấn than hồng, Anton cho con số và tên món, Be Vietnam Pro cho mọi chữ khác, logo vẽ tay có quầng sáng, vệt sáng `.streak`, motif điếu thuốc khi đơn vừa tạo, motif ly cocktail khi trống.
- **Bỏ:** con số cốc khổng lồ, phím `+1 +2 +5 +10 −1 Xóa`, dòng "Đơn giá".
- **Vẫn từ chối:** ô màu cho từng món, ảnh đồ uống, tab danh mục (8 món vừa một màn), neon, vùng sáng lớn, nhấp nháy, icon bằng emoji hay ký tự Unicode.
- **Trạng thái như dấu in:** nét mảnh khi nghỉ, khối đặc khi nhấn, gạch ngang khi đã hủy. Mọi ô bấm khớp một lưới cố định.
- **Bớt chuỗi ghép bằng dấu chấm giữa:** thông tin xếp theo tầng hoặc theo cột, không nối "A · B · C" trên các bề mặt mới. Không viết hoa toàn bộ nhãn.

## 4. Bố cục điện thoại (khung 360×640 và 390×844)

| Vùng, từ trên xuống | Nội dung |
|---|---|
| Dải trên | Logo vẽ tay bên trái; liên kết "Trang chủ quán" bên phải nếu là chủ quán |
| Lưới món | 2 cột × 4 hàng, mỗi ô cao ≥ 72px, viền `--edge`; tên món Anton (tối đa 2 dòng), giá Be Vietnam Pro nhỏ bên dưới. Nhấn: khối kem 150ms. Có trong giỏ: viền kem, số lượng kem ở góc |
| Cuộn xuống | Đơn vừa tạo, chia cột: giờ và chỗ ngồi bên trái, món ở giữa (xuống dòng được), thành tiền canh phải; có giảm giá thì thêm "−N%" cạnh thành tiền |
| Sát đáy (dính, cao 64px) | **Thanh giỏ đơn**: trái là "3 món" nhỏ ở trên, **Thành tiền** Anton lớn ở dưới (nảy 160ms mỗi lần thêm món, tự thu nhỏ khi số dài); phải là nút ember **Giỏ đơn**. Giỏ trống: thanh mờ, "Chạm món để thêm", không ember |

**Tấm giỏ đơn** (trượt lên 250ms, khoảng 85% chiều cao; kéo xuống hoặc chạm nền tối để đóng). Từ trên xuống, càng gần đáy càng là thao tác chính:
1. Tiêu đề "Giỏ đơn" và **Xóa hết** (viền danger, trên cùng, xa Xác nhận; hai bước "Chắc chắn xóa hết?").
2. Dòng đơn: tên món và đơn giá; − / ô số / + (mỗi nút 48px); thành tiền dòng canh phải.
3. Giảm giá: nút 5%, 10%, 15%, 20% và ô nhập "%"; bấm lại nút đang chọn thì bỏ. Tổng: Tạm tính, Giảm N% −X đ, **Thành tiền** cỡ lớn.
4. Chỗ ngồi: Ghế quầy 2 hàng × 6 như mép quầy thật; Bàn và Mang về 4 cột. Nút cao 56px, số Anton 1.5rem. Đang chọn: khối ember, quầng sáng, các chỗ khác lùi vào bóng tối.
5. Tên chỗ ngồi đang chọn cỡ lớn ("Ghế 5"), không có chữ "Đang chọn:"; chưa chọn thì "Chưa chọn chỗ ngồi" màu cảnh báo.
6. **Xác nhận đơn**: ember, cao 64px, dính đáy tấm. Bị khóa thì ghi lý do ngay trên nút.

## 5. Bố cục màn rộng (≥ 768px)

Lưới món 3–4 cột chiếm khoảng 60% bên trái. Phiếu đơn luôn hiện bên phải, cùng nội dung tấm giỏ đơn; không có thanh giỏ đơn.

## 6. Phản hồi sau khi gửi đơn

- Tấm giỏ đơn đóng. Thanh giỏ đơn nhường chỗ cho thanh phản hồi: motif điếu thuốc bốc khói, "Đã tạo đơn 3 món – 513.000đ", nút **Hoàn tác**, trong 5 giây.
- Vệt sáng `exposure-streak` chạy như hiện nay (250ms). Điện thoại rung ngắn 30ms (chỉ có tác dụng trên Android).
- Chạm vào món bất kỳ thì thanh trở lại thành thanh giỏ đơn ngay.

## 7. Dữ liệu và trạng thái

- **Dữ liệu:** 8 món lúc khởi tạo (chủ quán thêm được); tên món tới khoảng 24 ký tự; giá 1.000đ–5.000.000đ; mỗi dòng 1–99; tối đa 30 dòng; thành tiền tới 1.000.000.000đ; 12 ghế quầy, 3 bàn, Mang về; 0 đến khoảng 100 đơn mỗi đêm.
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
