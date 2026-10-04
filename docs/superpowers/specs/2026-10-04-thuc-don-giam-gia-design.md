# Thực đơn nhiều món và giảm giá (SRS v3.0)

Ngày: 2026-10-04 · Trạng thái: chờ duyệt

## 1. Mục tiêu

Quán bỏ mô hình **đồng giá**. Nhân viên chọn **món** từ **thực đơn**, các món gom vào **giỏ đơn**, chọn chỗ ngồi, có thể **giảm giá theo phần trăm** cho cả đơn, rồi gửi. Chủ quán quản lý thực đơn ở một trang riêng.

**Thành công khi:**
- Thêm một món vào giỏ chỉ mất **một chạm**. Sửa số lượng, xóa dòng và gửi đơn làm được bằng một tay trên điện thoại.
- Server quyết định mọi số tiền: giá từng món, số tiền giảm, thành tiền (NFR-05).
- Báo cáo, lịch sử và CSV khớp với số tiền thực thu.

## 2. Quyết định đã chốt

Các quyết định dưới đây đã được chủ quán duyệt trong buổi hỏi đáp ngày 2026-10-04. Mã Q là số câu hỏi trong buổi đó.

| Mã | Quyết định |
|---|---|
| Phạm vi | Thay hẳn đồng giá bằng thực đơn. "Thực đơn nhiều món" chuyển vào phạm vi (SRS §1.3). |
| Q-loại | Mỗi loại là một **món**: một nút, một giá. Không có món con bên trong loại. |
| Q1/Q13 | Thực đơn khởi tạo: BeSpoke 190.000đ, Classic 190.000đ, Signature 250.000đ, Bình Zax 800.000đ, MixDrink 150.000đ, Neat 100.000đ, Absinthe 150.000đ (giá tạm), Mocktail 100.000đ. |
| Q2/Q11 | Điện thoại: lưới món + thanh giỏ đơn ở đáy, mở thành tấm giỏ đơn. Màn ≥ 768px: lưới món trái, phiếu đơn phải. |
| Q3 | Chọn món trước. Chỗ ngồi chọn trong giỏ đơn, **bắt buộc** (chỗ ngồi hoặc Mang về). |
| Q4 | Nút Ghế quầy và Bàn to, nổi bật hơn. Có dải "Đang chọn: …" ngay trên Xác nhận đơn. |
| Q5 | Dòng đơn có − / ô số / +. Bấm − khi còn 1 thì xóa dòng. Số lượng 1–99. Ô trống hoặc 0 khi rời ô thì trả về số cũ. Nút "Xóa hết", xác nhận hai bước. |
| Q6 | Đơn vị đếm là **Số món**: tổng số lượng các dòng đơn. |
| Q7/Q12 | Xóa đơn hàng và lịch sử đổi giá hiện có **một lần duy nhất** (cả local và prod, đều là dữ liệu thử). Sau đó NFR-05 áp dụng lại. |
| Q8 | Lịch sử đổi giá theo từng món. |
| Q9 | Chưa có thống kê theo từng món. |
| Q10 | CSV mỗi dòng đơn một hàng. |
| Q14 | Trang riêng **Thực đơn** `/admin/menu`. Thanh điều hướng thành 5 mục. |
| Q15 | Giá món 1.000đ–5.000.000đ. |
| Q16 | Lệch giá hoặc món đã ẩn: server từ chối cả đơn, giỏ đơn cập nhật theo thực đơn mới. Thực đơn trên màn order cập nhật realtime. |
| Q17/Q18 | Thông báo đơn mới: "Đơn mới: Bàn 3 · 3 món · 570.000đ". Bấm vào thì mở Lịch sử đơn hàng với đơn đó mở sẵn. Lịch sử bấm vào đơn để mở xem dòng đơn. |
| Q19 | Thuật ngữ: Thực đơn, Món, Dòng đơn, Giỏ đơn, Số món. Bỏ Đơn giá chung, Số cốc. |
| Q20 | Gửi xong: giỏ trống, bỏ chọn chỗ ngồi, "Đã tạo đơn 3 món – 570.000đ" + Hoàn tác 5 giây, rung ngắn. |
| Q21 | Bốn đợt, mỗi đợt một PR. Prod nhận cả bốn cùng lúc. |
| Q22 | Giảm giá áp lên **cả đơn**. |
| Q23 | **Nhân viên tự nhập**, không có mức tối đa. Server nhận số nguyên 0–100. |
| Q24 | Nút 5%, 10%, 15%, 20% kèm ô nhập tay, số nguyên. |
| Q25 | Số tiền giảm **làm tròn xuống** tới bội số 1.000đ. |
| Q26 | Không cần lý do giảm. |
| Q27 | Doanh thu tính sau giảm. CSV thêm hàng "Giảm giá" mang số âm. Dòng tổng Lịch sử hiện "Đã giảm X đ". |

## 3. Dữ liệu

### 3.1. Bảng mới

**`menu_items`** (Món)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | khóa chính |
| `name` | text | không rỗng sau khi trim, duy nhất trong các món chưa ẩn |
| `price` | integer | 1.000–5.000.000 |
| `sort_order` | integer | mặc định 0 |
| `is_archived` | boolean | mặc định false; món không bao giờ bị xóa cứng |
| `created_at` | timestamptz | |

**`menu_price_history`** thay cho `price_history`
| Cột | Kiểu |
|---|---|
| `menu_item_id` | uuid → `menu_items` |
| `price` | integer |
| `effective_from` | timestamptz |
| `changed_by` | uuid → `auth.users`, null với giá khởi tạo |

Ghi bằng trigger khi thêm món hoặc khi `price` đổi, nên mọi đường đổi giá đều có lịch sử.

**`order_lines`** (Dòng đơn)
| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `id` | uuid | khóa chính |
| `order_id` | uuid → `orders` | |
| `menu_item_id` | uuid → `menu_items` | |
| `item_name` | text | tên món **tại lúc bán** |
| `unit_price` | integer | giá **tại lúc bán**, server lấy từ `menu_items` |
| `quantity` | integer | 1–99 |
| `line_amount` | integer | cột tự tính = `quantity × unit_price` |
| `sort_order` | integer | thứ tự dòng trong giỏ |

### 3.2. Bảng `orders` đổi

- Bỏ `quantity`, `unit_price`, `total_amount` (cột tự tính).
- Thêm:
  - `item_count` integer: tổng `quantity` các dòng.
  - `subtotal_amount` integer: tổng `line_amount`.
  - `discount_percent` integer 0–100, mặc định 0.
  - `discount_amount` integer = `floor(subtotal_amount × discount_percent / 100 / 1000) × 1000`.
  - `total_amount` integer = `subtotal_amount − discount_amount`.
- Ràng buộc mới: `seat_id is not null or is_takeaway`, tức bắt buộc chọn chỗ ngồi hoặc Mang về (Q3).
- `subtotal_amount` tối đa 1.000.000.000đ. Server tính bằng `bigint` rồi kiểm tra, nên không tràn số nguyên.

`settings.current_price` bị bỏ.

### 3.3. Xóa dữ liệu thử một lần

Migration v3.0 xóa toàn bộ `orders` và `price_history` **trước** khi đổi cấu trúc bảng. Đây là ngoại lệ duy nhất của NFR-05, được ghi vào SRS Phụ lục A.

Chạy lên prod gồm ba bước:
1. Mình đếm số đơn trên prod và báo chủ quán.
2. Chủ quán xác nhận.
3. Chủ quán tự chạy `npx supabase db push`.

Chỗ ngồi, giờ mở/đóng cửa, PIN quán và tài khoản giữ nguyên.

## 4. Server (RPC và quyền)

**`create_order(p_id, p_seat_id, p_is_takeaway, p_discount_percent, p_lines jsonb)`**
- Kiểm tra `is_staff()`, giữ mã lỗi `FORBIDDEN`.
- `p_lines` là mảng `[{menu_item_id, quantity, client_price}]`:
  - 1–30 dòng, không trùng `menu_item_id`, `quantity` 1–99.
  - `client_price` là giá màn order đang hiện, để server phát hiện lệch giá.
- Bắt buộc có chỗ ngồi hoặc Mang về. Chỗ ngồi phải chưa ẩn.
- `p_discount_percent` là số nguyên 0–100.
- Có dòng nào lệch giá hoặc món đã ẩn thì từ chối **cả đơn** bằng `MENU_CHANGED`. Kèm theo đó là danh sách món hiện hành (id, tên, giá, đã ẩn) để màn order cập nhật giỏ.
- Gửi lại cùng `p_id` thì trả về đơn đã có, không tạo đơn thứ hai (giữ hành vi FR-04).
- Trả về: `id`, `item_count`, `subtotal_amount`, `discount_percent`, `discount_amount`, `total_amount`, `seat_name`, `created_at`.

**Quản lý thực đơn:** đi theo mẫu của `seats`:
- RLS cho chủ quán đọc, thêm và sửa bảng `menu_items`, không có quyền xóa.
- Nhân viên đọc được mọi món, kể cả món đã ẩn: Realtime chỉ gửi sự kiện cho người đọc được dòng, và giỏ đơn cần biết món vừa ngừng bán. Màn order tự lọc món đã ẩn khỏi lưới.
- `menu_items` thêm vào publication `supabase_realtime`.

**RPC báo cáo đổi:**
- `owner_stats`: "cốc" thành `item_count`; doanh thu là tổng `total_amount`, tức sau giảm.
- `history_totals`: thêm `discount_total`.
- `list_orders_by_ids` (Đơn vừa tạo): trả kèm dòng đơn.

Mọi RPC mới hoặc bị sửa đều có test pgTAP cho ba trường hợp: người được phép gọi, người không được phép gọi, và ít nhất một đầu vào sai.

## 5. Màn order

### 5.1. Điện thoại (< 768px)

Thứ tự từ trên xuống:
1. **Header:** logo, liên kết "Trang chủ quán" nếu là chủ quán.
2. **Lưới món**, 2 cột:
   - Mỗi nút cao ít nhất 72px. Tên món dùng Title Anton, giá dùng Body bên dưới.
   - Món đã có trong giỏ thì viền chuyển sang kem và góc nút hiện số lượng chữ kem nhỏ (không dùng ember; xem `docs/design/order-brief.md`).
   - Chạm một lần là +1, có phản hồi dưới 200ms (NFR-01) kèm hiệu ứng nhấn 150ms.
3. **Đơn vừa tạo** nằm dưới lưới, phải cuộn tới. Mỗi đơn ghi "21:05 · Bàn 3 · 2 Classic, 1 Neat · 570.000đ" (nếu có giảm giá thì thêm "−10%"), có nút Hủy trong cửa sổ hủy.
4. **Thanh giỏ đơn** dính đáy, cao 64px: "3 món" nhỏ ở trên, Thành tiền lớn ở dưới, nút ember **Giỏ đơn** bên phải. Giỏ trống thì thanh mờ, ghi "Chạm món để thêm". Bố cục chi tiết theo `docs/design/order-brief.md`.

**Tấm giỏ đơn** trượt lên, chiếm khoảng 85% chiều cao, chuyển động 250ms. Kéo xuống hoặc bấm nền tối để đóng. Từ trên xuống:
- Tiêu đề "Giỏ đơn" và nút "Xóa hết" (bấm lần đầu đổi thành "Chắc chắn xóa hết?").
- **Dòng đơn:** tên món, đơn giá nhỏ bên dưới; − (48px) / ô số (`inputmode="numeric"`) / + (48px); thành tiền dòng ở bên phải.
- **Giảm giá:** nút 5%, 10%, 15%, 20% và ô "%" nhập tay. Bấm lại nút đang chọn thì bỏ giảm giá.
- **Tổng:** "Tạm tính 570.000đ", "Giảm 10% −57.000đ", **"Thành tiền 513.000đ"** cỡ Display Total.
- **Chỗ ngồi:** lưới Ghế quầy 2 hàng × 6, Bàn và Mang về 4 cột.
  - Nút cao 56px, số dùng Anton 1.5rem, viền `--edge` 2px.
  - Nút đang chọn có nền ember, chữ `--ember-ink`.
- **Dải "Đang chọn: Ghế 5"** (hoặc "Chưa chọn chỗ ngồi" màu cảnh báo).
- **Xác nhận đơn**, cao 64px. Bị khóa khi giỏ trống, chưa chọn chỗ ngồi, chưa tải được thực đơn hoặc mất mạng. Lý do khóa hiện ngay trên nút.

### 5.2. Màn rộng (≥ 768px)

Lưới món 3–4 cột chiếm khoảng 60% bên trái. Phiếu đơn chiếm khoảng 40% bên phải, luôn hiện, có cùng nội dung với tấm giỏ đơn. Không có thanh giỏ đơn.

### 5.3. Trạng thái

- **Giỏ đơn** lưu trong bộ nhớ trang; tải lại trang thì mất. Mã đơn `p_id` được sinh khi gửi lần đầu, và giữ nguyên khi gửi lại sau lỗi mạng, cho tới khi gửi thành công hoặc giỏ đổi.
- **Thực đơn đổi realtime:**
  - Món trong giỏ đổi giá: dòng cập nhật giá mới, nền nổi bật khoảng 3 giây.
  - Món trong giỏ bị ẩn: dòng bị gạch, kèm "Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại", và nút Xác nhận bị khóa.
- **`MENU_CHANGED`:** áp danh sách món server trả về theo cách trên, rồi hiện "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.".
- **Thông báo:** giữ quy tắc tách ô lỗi và ô thông tin của FR-04 và FR-04b.

## 6. Trang chủ quán

- **Thực đơn** (`/admin/menu`), icon lucide `UtensilsCrossed`:
  - Danh sách món chưa ẩn theo `sort_order`. Mỗi món có ô sửa tên ngay tại chỗ, ô giá, nút lên/xuống để sắp xếp, nút "Ẩn" (xác nhận hai bước).
  - Món đã ẩn nằm trong nhóm thu gọn, có nút "Hiện lại".
  - Form "Thêm món".
  - Lịch sử đổi giá: 20 lần gần nhất, gồm món, giá, thời điểm, người đổi.
- **Cài đặt:** bỏ mục Đơn giá chung.
- **Tổng quan:** "Số cốc" thành "Số món". Doanh thu tính sau giảm.
- **Lịch sử đơn hàng:**
  - Mỗi đơn là `<details>`.
    - Dòng tóm tắt gồm thời gian · chỗ ngồi · trạng thái, rồi "3 món · 513.000đ", thêm "−10%" nếu có giảm giá.
    - Mở ra thì thấy từng dòng "2 × Classic · 190.000đ · 380.000đ", rồi Tạm tính / Giảm / Thành tiền.
  - Bảng trên màn rộng có các cột Thời gian, Chỗ ngồi, Số món, Giảm, Thành tiền, Trạng thái.
  - Dòng tổng: số đơn · số món · doanh thu · "Đã giảm X đ".
  - URL `?order=<id>` mở sẵn đơn đó và cuộn tới.
- **CSV:**
  - 7 cột: `Thời gian, Ngày kinh doanh, Chỗ ngồi, Món, Số lượng, Đơn giá, Thành tiền`, thêm `Trạng thái` thành 8 cột. *(Cần duyệt: xem §9.)*
  - Mỗi dòng đơn một hàng. Đơn có giảm giá thêm một hàng `Giảm giá 10%`, Số lượng để trống, Thành tiền là số âm.
  - Cộng cột Thành tiền của các đơn đã thanh toán ra đúng doanh thu.
  - Giữ BOM, CRLF và chặn công thức Excel.
- **Thông báo đơn mới:** "Đơn mới: Bàn 3 · 3 món · 513.000đ", là liên kết tới `/admin/history?order=<id>`.

## 7. Thuật ngữ (GLOSSARY)

**Thêm:**
- **Thực đơn** (Menu)
- **Món** (Menu item); tránh dùng: sản phẩm, đồ uống
- **Dòng đơn** (Order line)
- **Giỏ đơn** (Cart); tránh dùng: giỏ hàng, cart
- **Số món** (Item count)
- **Tạm tính** (Subtotal)
- **Giảm giá** (Discount); tránh dùng: chiết khấu, khuyến mãi

**Bỏ:** Đơn giá chung, Số cốc, Quán nước đồng giá.

**Sửa:** Thành tiền: số tiền đơn phải trả **sau giảm giá**.

## 8. Thứ tự làm và kiểm thử

| Đợt | Nội dung | Kiểm thử |
|---|---|---|
| 1 | Migration: xóa dữ liệu thử, bảng mới, `orders` đổi, RPC `create_order` và báo cáo, RLS, realtime, seed thực đơn | pgTAP cho mọi RPC mới hoặc bị sửa; `db reset && test db` xanh |
| 2 | Trang Thực đơn, bỏ mục Đơn giá chung, thanh điều hướng 5 mục | Vitest cho kiểm tra tên và giá |
| 3 | Màn order mới | Vitest cho hàm thuần của giỏ đơn (thêm, bớt, nhập tay, áp thực đơn mới) và hàm tính tiền hiển thị; kiểm tra tay ở 360×640, 390×844, 768×1024 |
| 4 | Lịch sử (`<details>`, `?order=`), Tổng quan, CSV, thông báo đơn mới | Vitest cho CSV (hàng giảm giá, tổng khớp doanh thu) |

Mỗi đợt kết thúc bằng `srs-reviewer` báo "khớp SRS". Prod nhận cả 4 đợt cùng lúc, theo thứ tự: `db push` (sau khi chủ quán xác nhận xóa dữ liệu thử) → merge → Vercel deploy.

Hàm tính tiền ở trình duyệt chỉ dùng để **hiển thị** trước khi gửi. Số được lưu luôn là số server tính. Một test Vitest bảo đảm công thức hiển thị cho ra cùng kết quả với công thức của server trên một bộ ví dụ chung, gồm 15% của 190.000đ ra 28.000đ và 100% ra 0đ.

## 9. Điểm còn mở

1. **Số cột CSV:** FR-07a đang ghi 7 cột. Bản mới cần 8 cột (thêm Món, Số lượng; bỏ Số cốc), vì Trạng thái vẫn phải có. Đề xuất: SRS đổi thành 8 cột.
2. **Giá Absinthe** là giá tạm 150.000đ. Chủ quán sửa ở trang Thực đơn sau khi lên prod.
