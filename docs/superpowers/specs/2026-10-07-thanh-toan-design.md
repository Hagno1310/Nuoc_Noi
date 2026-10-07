# Hình thức thanh toán và ảnh chuyển khoản (SRS v3.3)

Ngày: 2026-10-07 · Trạng thái: chờ duyệt

## 1. Mục tiêu

Khi gửi đơn, nhân viên chọn **Tiền mặt** hoặc **Chuyển khoản**. Chuyển khoản thì màn hình hiện mã QR của quán cho khách quét, rồi nhân viên **bắt buộc** chụp ảnh màn hình chuyển khoản của khách trước khi xác nhận. Ảnh lưu trên Cloudinary. Chủ quán và nhân viên xem lại được ảnh cùng thông tin đơn.

**Thành công khi:**
- Không đơn chuyển khoản nào được ghi mà thiếu ảnh (server kiểm tra).
- Đơn tiền mặt chỉ thêm đúng **một chạm** so với hiện nay.
- Chủ quán mở một đơn trong Lịch sử đơn hàng là thấy hình thức thanh toán và ảnh chuyển khoản.
- Cuối ngày kinh doanh, chủ quán đối chiếu được két tiền và tài khoản ngân hàng nhờ dòng tổng tách theo hình thức thanh toán.

## 2. Quyết định đã chốt

Các quyết định dưới đây đã được chủ quán duyệt trong buổi hỏi đáp ngày 2026-10-07.

| Mã | Quyết định |
|---|---|
| Phạm vi | "Hình thức thanh toán" (tiền mặt; chuyển khoản qua mã QR cố định, kèm ảnh) chuyển vào phạm vi (SRS §1.3). "In hóa đơn" vẫn ngoài phạm vi. |
| Q1 | **Thanh toán xong mới tạo đơn.** Không có trạng thái "chờ thanh toán". Đơn được ghi là **đã thanh toán** như hiện nay (giữ Q1 v1.1); doanh thu, cửa sổ hủy, Hoàn tác và báo cáo giữ nguyên quy tắc. |
| Q2 | Bấm "Xác nhận đơn" thì hiện hai nút **Tiền mặt** và **Chuyển khoản**. Tiền mặt gửi đơn ngay. Chuyển khoản: QR → chụp ảnh (bắt buộc, không bỏ qua) → xem trước, có "Chụp lại" → "Xác nhận đã thanh toán". |
| Q3 | Xem lại ảnh ở **cả hai nơi**: Lịch sử đơn hàng của chủ quán (FR-07) và "Đơn vừa tạo" trên màn order (FR-04b). |
| Q4 | Upload **có chữ ký do server cấp**. Route Next.js kiểm tra phiên đăng nhập và ký bằng `CLOUDINARY_API_SECRET`, chỉ đọc ở server. Trình duyệt upload thẳng lên Cloudinary. |
| Q5 | Ảnh xem bằng URL công khai có tên ngẫu nhiên (không ký URL xem). |
| Q6 | Màn mới theo thang chữ và lưới khoảng cách 4px của `DESIGN.md`; chọn bậc gần nhất với bảng chủ quán gửi (Display cho số tiền, H1 cho tiêu đề bước). |
| Q7 | **Chữ gốc 16px trên mọi màn hình**, bỏ mức 15px dưới `lg` (sửa R31). |
| Q8 | Dòng tổng Lịch sử đơn hàng tách "Tiền mặt X đ · Chuyển khoản Y đ". |

## 3. Dữ liệu và server

### 3.1. Bảng `orders`

| Cột | Kiểu | Ràng buộc |
|---|---|---|
| `payment_method` | `text not null` | `in ('cash', 'transfer')` |
| `transfer_photo_id` | `text null` | public_id Cloudinary, khớp `^nuoc-noi/transfer/[0-9a-f-]{36}$` |

- Ràng buộc bảng: `(payment_method = 'transfer') = (transfer_photo_id is not null)`.
- Đơn cũ: `payment_method = 'cash'` (trước đây app không ghi hình thức thanh toán; migration ghi chú điều này).
- Lưu **public_id**, không lưu URL: server không nhận URL tùy ý từ client, và đổi tài khoản Cloudinary không phải sửa dữ liệu. URL xem ghép ở client: `https://res.cloudinary.com/<NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME>/image/upload/<biến đổi>/<public_id>`.

### 3.2. RPC

- `create_order(p_id, p_seat_id, p_discount_percent, p_lines, p_payment_method, p_transfer_photo_id)`:
  - Thứ tự kiểm tra không đổi; thêm sau `SEAT_*`:
    - phương thức không phải `cash`/`transfer` → `PAYMENT_REQUIRED`;
    - `transfer` thiếu ảnh hoặc ảnh sai mẫu → `PHOTO_REQUIRED`;
    - `cash` kèm ảnh → `INVALID_PAYMENT`.
  - Gửi lại cùng `id` vẫn trả về đơn đã ghi (trước mọi kiểm tra), như hiện nay.
  - `order_summary` trả thêm `payment_method`, `transfer_photo_id`.
- `list_orders_by_ids` (FR-04b), RPC danh sách Lịch sử đơn hàng và RPC xuất CSV trả thêm hai cột trên.
- RPC dòng tổng Lịch sử đơn hàng trả thêm `cash_revenue`, `transfer_revenue` (chỉ đơn đã thanh toán).
- Server không kiểm tra ảnh có thật trên Cloudinary (giới hạn đã biết; public_id do server sinh nên client khó bịa).

### 3.3. Ký upload

`POST /api/transfer-photo/sign` (route handler Next.js, runtime Node):
1. Tạo Supabase server client từ cookie; gọi RPC `is_staff()` (đúng cho cả nhân viên và chủ quán, đồng thời xác nhận phiên còn tồn tại). Sai hoặc lỗi → 401.
2. Sinh `public_id = nuoc-noi/transfer/<crypto.randomUUID()>`, `timestamp` hiện tại.
3. Ký `public_id` + `timestamp` bằng SHA-1 với `CLOUDINARY_API_SECRET` (`node:crypto`, không thêm thư viện).
4. Trả `{ cloudName, apiKey, publicId, timestamp, signature }`.

Trình duyệt `POST` ảnh tới `https://api.cloudinary.com/v1_1/<cloud>/image/upload` với các trường trên. Chữ ký Cloudinary hết hạn sau 1 giờ.

Biến môi trường mới: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. Hai biến sau chỉ được đọc trong file route này.

### 3.4. Nén ảnh

Trước khi upload: vẽ ảnh lên `<canvas>`, cạnh dài tối đa 1600px, xuất JPEG chất lượng 0,8. Ảnh chụp 12MP còn khoảng 300–500KB.

## 4. Màn order

### 4.1. Tấm thanh toán (FR-04)

Nút "Xác nhận đơn" giữ chữ, điều kiện khóa và lý do khóa. Bấm vào thì mở **tấm thanh toán**: toàn màn hình trên điện thoại, hộp thoại giữa màn trên màn rộng (≥ 768px). Tấm luôn hiện Thành tiền cỡ Display và chỗ ngồi đang chọn.

| Bước | Nội dung | Nút |
|---|---|---|
| Chọn | "Khách trả bằng?" | **Tiền mặt**, **Chuyển khoản** (≥ 56px), "Quay lại" |
| QR | Ảnh `public/qr.jpg` lớn + Thành tiền | **"Chụp ảnh chuyển khoản"**, "Quay lại" |
| Xem trước | Ảnh vừa chụp; dòng trạng thái upload | "Chụp lại", **"Xác nhận đã thanh toán"** |

- **Tiền mặt:** gửi đơn với `cash`. Trong lúc gửi, nút hiện "Đang gửi…" (NFR-01).
- **Chụp ảnh:** `<input type="file" accept="image/*" capture="environment">`, ẩn sau nút. Không thư viện camera.
- **Upload bắt đầu ngay khi có ảnh.** "Xác nhận đã thanh toán" khóa và hiện "Đang tải ảnh…" cho tới khi upload xong. "Chụp lại" hủy ảnh cũ trên máy, upload ảnh mới (ảnh cũ trên Cloudinary bị bỏ lại).
- **Upload lỗi:** "Chưa tải được ảnh – kiểm tra mạng rồi thử lại." kèm nút "Thử lại" (dùng lại ảnh đã chụp, xin chữ ký mới).
- **Không có nút bỏ qua ảnh.** "Quay lại" ở mọi bước đóng tấm; giỏ đơn, giảm giá, chỗ ngồi giữ nguyên, chưa đơn nào được ghi.
- **Gửi thành công** (cả hai hình thức): đóng tấm rồi làm đúng như hiện nay: rung, reset, "Đã tạo đơn N món – X đ" + Hoàn tác 5 giây. Ảnh đã upload được bỏ khỏi bộ nhớ.
- **Gửi lỗi mạng:** giữ tấm ở bước hiện tại, giữ ảnh và `id` đơn; báo lỗi như hiện nay.
- **`MENU_CHANGED`:** đóng tấm, hiện thông báo "Thực đơn vừa đổi…" như hiện nay. **Giữ public_id ảnh đã upload và `id` đơn**: lần mở tấm sau, chọn Chuyển khoản thì vào thẳng bước Xem trước. Ảnh giữ lại bị bỏ khi đơn gửi thành công hoặc khi bấm "Xóa hết".
- **Đơn đã bị hủy** (lần gửi lại trùng `id` đã hủy): xử lý như hiện nay; ảnh giữ lại, lần gửi sau dùng `id` mới với cùng ảnh.
- Mất mạng: nút "Xác nhận đơn" đã khóa sẵn.

### 4.2. Đơn vừa tạo (FR-04b)

- Đơn chuyển khoản có icon máy ảnh (lucide `Camera`) cạnh thành tiền, `aria-label="Xem ảnh chuyển khoản"`.
- Chạm vào đơn chuyển khoản thì mở **trình xem ảnh** toàn màn hình (ảnh rộng ~1200px), nút "Đóng" ≥ 48px; Esc cũng đóng.
- Đơn tiền mặt không chạm được, như hiện nay. Nút Hủy vẫn không mở ảnh.

## 5. Trang chủ quán

### 5.1. Lịch sử đơn hàng (FR-07)

- Thêm trường thứ 7 **Thanh toán** ("Tiền mặt" / "Chuyển khoản"). Điện thoại: thêm vào tầng dưới của dòng hai tầng. Từ tablet: bảng 7 cột.
- Mở một đơn chuyển khoản: dưới Thành tiền có "Thanh toán: Chuyển khoản" và ảnh nhỏ (Cloudinary `w_480`). Chạm ảnh mở trình xem ảnh (dùng chung với §4.2).
- Dòng tổng thêm "Tiền mặt X đ · Chuyển khoản Y đ".
- Ảnh không tải được (Cloudinary lỗi): hiện "Không tải được ảnh." tại chỗ ảnh, phần còn lại của đơn vẫn hiện.

### 5.2. CSV (FR-07a)

Thêm cột thứ 9 **Thanh toán** ("Tiền mặt" / "Chuyển khoản"), lặp ở mọi hàng của đơn, kể cả hàng Giảm giá. Không xuất ảnh.

### 5.3. Thông báo đơn mới (FR-06a)

Không đổi.

## 6. Chữ gốc 16px

- Bỏ `font-size: 93.75%` trên `html` và media query 100% ở `src/app/globals.css`. Chữ gốc 16px ở mọi cỡ màn.
- Sửa `DESIGN.md` và SRS R31.
- Chụp lại màn order trên khung 360px và 390px: nút ghế quầy vẫn phải vừa 2 hàng 6 (R24); nếu không vừa, chỉnh riêng cỡ nút ghế quầy.

## 7. Tài liệu (sửa trước code)

1. **SRS v3.3:** §1.3 phạm vi; viết lại FR-04 (tấm thanh toán), sửa FR-04b, FR-07, FR-07a, §4 (bảng `orders`), NFR-04 (cho phép `CLOUDINARY_API_SECRET` ở server Vercel, chỉ trong route ký), R31; Phụ lục A thêm R39 (thanh toán), R40 (chữ gốc 16px).
2. **GLOSSARY:** thêm **Hình thức thanh toán** (Payment method), **Tiền mặt** (Cash), **Chuyển khoản** (Bank transfer), **Ảnh chuyển khoản** (Transfer photo) — _Avoid_: bill, hóa đơn, biên lai. Sửa **Đã thanh toán**: khách đã trả bằng tiền mặt hoặc chuyển khoản trước khi đơn được ghi.
3. **`.claude/rules/secrets.md`:** cho phép `CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` chỉ trong `src/app/api/transfer-photo/sign/route.ts`; thêm `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` vào danh sách biến công khai.
4. **`docs/deploy.md`:** tạo tài khoản Cloudinary, đặt ba biến môi trường trên Vercel.

## 8. Kiểm thử

- **pgTAP:** ràng buộc `payment_method`/ảnh; mẫu public_id; `PAYMENT_REQUIRED`, `PHOTO_REQUIRED`, `INVALID_PAYMENT`; gửi lại cùng `id` trả đơn cũ; `cash_revenue + transfer_revenue = doanh thu`.
- **Vitest:**
  - Route ký: không đăng nhập → 401; public_id đúng mẫu; chữ ký khớp công thức Cloudinary.
  - Tấm thanh toán: "Xác nhận đã thanh toán" khóa khi chưa upload xong; không có đường gửi chuyển khoản thiếu ảnh; `MENU_CHANGED` giữ ảnh và `id`; "Xóa hết" bỏ ảnh.
  - CSV có cột Thanh toán.
- **Kiểm tay** (`docs/manual-test.md`): chụp bằng camera thật trên Chrome Android và Safari iOS; xem lại ảnh ở Đơn vừa tạo và Lịch sử đơn hàng; nút ghế quầy vừa 2 hàng ở chữ gốc 16px.

## 9. Ngoài phạm vi đợt này

- Đối soát tự động với ngân hàng, QR động theo số tiền (VietQR có số tiền).
- Dọn ảnh mồ côi trên Cloudinary (ảnh đã upload nhưng đơn không được ghi).
- Ký URL xem ảnh.
- Đổi hình thức thanh toán của đơn đã ghi (sửa đơn vẫn ngoài phạm vi; sai thì hủy và tạo lại).
