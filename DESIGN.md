---
name: Nước Nôi
description: POS cho quán bar Nước Nôi. Giao diện tối, gọn, thẻ bo tròn, một màu nhấn cam. Thiết kế gốc nằm ở design/design.pen.
colors:
  bg: "#111310"
  surface: "#1b1e19"
  surface-2: "#262a23"
  line: "#2d3129"
  muted: "#949a88"
  ink: "#f3eee2"
  accent: "#f26a3d"
  accent-ink: "#1a0f0a"
  accent-soft: "#3a2219"
  ok: "#8fcf88"
  ok-soft: "#20301e"
  warn: "#f0b64e"
  warn-soft: "#3a2f19"
  danger: "#f27b84"
  danger-soft: "#3a1e21"
typography:
  family: "Be Vietnam Pro, system-ui, sans-serif"
  display: { fontSize: "2.5rem–3.5rem", fontWeight: 800, lineHeight: 1.1 }
  title-page: { fontSize: "1.75rem", fontWeight: 700 }
  title-section: { fontSize: "1.0625rem–1.25rem", fontWeight: 700 }
  body: { fontSize: "1rem", fontWeight: 400–500, lineHeight: 1.5 }
  label: { fontSize: "0.8125rem–0.875rem", fontWeight: 500–600 }
  caption: { fontSize: "0.75rem", fontWeight: 400–600 }
rounded:
  chip: "8px–12px"
  control: "14px"
  button: "16px"
  tile: "18px"
  card: "24px"
  sheet: "24px 24px 0 0"
  pill: "9999px"
spacing:
  unit: "4px"
  gutter: "16px"
  gap-tight: "6px–8px"
  gap: "10px–16px"
  section: "24px"
  touch: "48px"
  primary: "56px–64px"
---

# Design System: Nước Nôi

## Nguồn

- **Thiết kế gốc:** `design/design.pen` (mở bằng pen.dev). Canvas xếp theo 8 làn, mỗi làn là một luồng sử dụng, mỗi bước có số thứ tự và chú thích:
  1. Nhân viên · Tạo đơn, trả tiền mặt
  2. Nhân viên · Chuyển khoản
  3. Nhân viên · Trạng thái đặc biệt (xóa hết, mất mạng, thực đơn vừa đổi, lỗi tải ảnh)
  4. Chủ quán · Theo dõi doanh thu
  5. Chủ quán · Thực đơn & cài đặt
  6. Nhân viên · Trả sau
  7. Nhân viên · Nhập nhanh & ghi chú
  8. Chủ quán · Bản web (1440px)
- Khung "Components" phía trên canvas chứa các component dùng lại: StatusBar, BtnPrimary, BtnSecondary, OwnerNav, MenuTile.
- Hành vi lấy theo `docs/SRS.md` (v3.8). File này chỉ nói về hình thức.

## Tổng quan

Giao diện tối vì quán là phòng tối, nhưng **gọn và mềm**: các khối là thẻ bo tròn trên nền gần đen, phân cấp bằng **bậc nền** (bg → surface → surface-2), không dùng đường kẻ để chia sổ. Một màu nhấn cam cho hành động chính và lựa chọn đang chọn. Số tiền là chữ lớn nhất trên mỗi màn.

**Đặc điểm chính:**
- Ba bậc nền, một màu chữ chính (ink), một màu chữ phụ (muted).
- Một màu nhấn (accent). Ba màu trạng thái, mỗi màu có bản "soft" làm nền cho nhãn, nút phá hủy và thông báo.
- Một họ chữ: Be Vietnam Pro (hiển thị dấu tiếng Việt rõ), số luôn `tabular-nums`.
- Bo tròn rộng (14–24px), không đường kẻ dày, không gradient, không quầng sáng.
- Hộp thoại trên điện thoại là **tấm trượt từ đáy**; trên máy tính là **hộp thoại giữa màn**.

## Màu

| Token | Vai trò |
|---|---|
| `bg` | Nền mọi trang, `theme-color`. |
| `surface` | Thẻ, ô món, tấm trượt, ô nhập trên nền bg. |
| `surface-2` | Điều khiển nằm trong thẻ (nút phụ, stepper, ô nhập trong tấm), nút chỗ ngồi chưa chọn trong tấm, mục điều hướng đang chọn trên web. |
| `line` | Đường chia mảnh hiếm hoi (giữa các dòng trong một thẻ danh sách), viền ô nhập phụ, grabber. |
| `muted` | Chữ phụ, nhãn, icon chưa chọn. |
| `ink` | Chữ chính. Khối "đang chọn" trung tính (chip giảm giá, bộ lọc, segmented) là nền ink, chữ bg. |
| `accent` | Nút chính (Xác nhận đơn, Tiền mặt, Thu tiền, Lưu), thanh giỏ đơn khi có món, chỗ ngồi đang chọn, viền ô món đã chọn, badge số lượng, focus, cột "kỳ này" và cột cao điểm trên biểu đồ. |
| `accent-ink` | Chữ trên nền accent và trên nền danger đặc. |
| `accent-soft` | Nền ô món đã có trong giỏ, nền icon thông báo đơn mới, nhãn "Cao điểm". |
| `ok` / `ok-soft` | Giảm giá trong tổng tiền, "Đã thanh toán", phần trăm tăng, "Đã tải ảnh lên". |
| `warn` / `warn-soft` | Mọi thứ của **Trả sau và chờ thanh toán** (nút Trả sau, badge, chấm trên chỗ ngồi, nhãn trạng thái), giá vừa đổi, ghi chú dòng đơn. |
| `danger` / `danger-soft` | Nút phá hủy (Xóa hết, Hủy, Ẩn món, Đổi PIN quán): nền soft chữ danger; khi đã bấm lần một thì nền danger chữ accent-ink. Thông báo lỗi. Phần trăm giảm. |

**Quy tắc:**
- **Một màu nhấn.** Accent chỉ cho hành động chính, lựa chọn đang có hiệu lực, focus và dữ liệu "kỳ này". Không dùng cho trang trí.
- **Warn là màu của tiền chưa thu.** Mọi chỗ nói về đơn chờ thanh toán dùng warn, để không lẫn với doanh thu đã thu.
- **Màu trạng thái nằm trong khung của nó:** nhãn, nút, thông báo. Không tô cả màn.
- Không có chế độ sáng; không vùng sáng lớn. Ngoại lệ duy nhất: ảnh mã QR (nền trắng để quét được).

## Chữ

Be Vietnam Pro, nạp bằng `next/font/google` với `subsets: ["latin", "vietnamese"]`, weight 400/500/600/700/800. Chữ gốc 16px (SRS R40); ô nhập ≥ 16px.

| Vai trò | Cỡ / độ đậm | Dùng cho |
|---|---|---|
| Display | 40–56px / 800 | Thành tiền trong tấm thanh toán, doanh thu tối nay |
| Tiền trong tấm | 28–36px / 800 | Thành tiền / Tạm tính ở đáy tấm giỏ đơn và đơn chờ thanh toán |
| Tiêu đề trang | 28px (32px web) / 700 | Tổng quan, Thực đơn, Lịch sử đơn hàng, Cài đặt |
| Tiêu đề tấm / mục | 17–22px / 700 | Giỏ đơn, Chỗ ngồi, Món bán chạy |
| Tên món trên ô | 17px / 600 | Ô món |
| Body | 15–16px / 500 | Nội dung, ô nhập, dòng đơn |
| Label | 13–14px / 500–600 | Nhãn ô nhập, chip, nút phụ |
| Caption | 11–12px | Trục biểu đồ, "Kỳ trước", ghi chú, đếm ký tự |

Mọi con số về tiền, số lượng và giờ dùng `tabular-nums`.

## Bố cục

**Điện thoại (390px):** lề 16px; khoảng cách giữa các khối 16px (12px trong cùng nhóm). Màn order: đầu màn (logo, "Chờ thanh toán" kèm badge, nút Đơn vừa tạo), lưới món 2 cột (gap 10px), Đơn vừa tạo bên dưới, thanh giỏ đơn dính đáy. Trang chủ quán: tiêu đề trang, các thẻ một cột, thanh điều hướng 5 mục dính đáy (icon + chữ 11px).

**Máy tính (≥ 1024px, trang chủ quán):** thanh bên trái rộng 248px (logo, 4 mục, đường chia, Màn hình order, thẻ tài khoản kèm Đăng xuất ở đáy); nội dung lề 40px, gap 20–24px.
- Tổng quan: hàng 1 là thẻ Tối nay (rộng) + sổ Tuần/Tháng (520px); hàng 2 là biểu đồ doanh thu theo ngày + Món bán chạy (380px); hàng 3 là Số món theo giờ.
- Thực đơn: danh sách món (rộng) + Lịch sử đổi giá (460px).
- Lịch sử đơn hàng: hàng bộ lọc (Từ ngày, Đến ngày, chip trạng thái), 5 ô tổng, bảng 7 cột có dòng mở xuống.
- Cài đặt: cột trái Giờ mở cửa + PIN quán, cột phải Chỗ ngồi.
- Đăng nhập chủ quán: chia hai nửa; nửa trái nền surface, wordmark lớn (tối đa 360px, 60% bề rộng nửa trái) ở giữa; nửa phải form rộng tối đa 384px căn giữa theo chiều dọc, không có wordmark nhỏ.

**Vùng chạm:** ≥ 48px; nút chính trên màn order 56–64px (NFR-02); các vùng chạm cách nhau ≥ 6–8px.

## Hình khối và chiều sâu

- Ô món 18px, thẻ 24px, nút chính 16px, điều khiển 14px, chip 8–12px, nút tròn/pill 9999px.
- Phẳng. Chiều sâu chỉ đến từ bậc nền. Ngoại lệ: thông báo đơn mới nổi trên nội dung có một bóng mềm (y 8, blur 24, đen 50%).
- Lớp phủ sau tấm trượt và hộp thoại: đen 72%.

## Component

### Nút
- **Chính:** nền accent, chữ accent-ink 600, bo 16px, cao 56px (màn order 60–64px).
- **Phụ:** nền surface-2, chữ ink 600, icon 20px, bo 16px.
- **Phá hủy hai bước:** nền danger-soft, chữ danger; bấm lần một thành nền danger, chữ accent-ink, nhãn "Chắc chắn …?" trong vài giây. Đặt xa nút chính (trái hàng nút hoặc đầu tấm).
- **Trả sau:** nút không nền, icon và chữ warn, dòng phụ "Giảm giá chọn lúc thu tiền" màu muted.
- **Icon tròn:** 48×48, nền surface, icon 18–20px.
- **Vô hiệu:** opacity .35–.45; nếu bị khóa vì lý do thì nền surface-2, chữ muted ghi lý do ngay trên nút.

### Ô món (MenuTile)
Thẻ surface 18px, cao 116px, 2 cột. Trên: tên món (17/600, tối đa 2 dòng) và badge số lượng (tròn 30px, accent, chỉ hiện khi có trong giỏ). Dưới: giá (14/500 muted) và nút − (48px, surface-2, chỉ hiện khi có trong giỏ). Có trong giỏ: nền accent-soft, viền accent 1.5px, giá màu ink. Chạm: số nảy và rung nhẹ. Chạm giữ: mở bàn phím số.

### Thanh giỏ đơn
Cao 72px, bo 20px, lề 16px trên đáy. Trống: nền surface, "Giỏ đơn trống / Chạm món để thêm". Có món: nền accent, "N món" + Tạm tính 24/800 + nút "Giỏ đơn" (nền đen 12%). Thông báo gửi xong nằm ngay trên thanh: nền surface-2, icon ok, nút Hoàn tác nền accent.

### Tấm trượt (điện thoại)
Nền surface (tấm giỏ đơn: nền bg, đáy dính nền surface), bo trên 24px, grabber 40×4. Đầu tấm: tiêu đề + nút Đóng tròn. Đáy tấm dính: tổng tiền và nút chính.

### Hộp thoại (máy tính)
Rộng 440px, nền surface, viền line, bo 24px, đệm 24px, giữa màn. Hàng nút: phá hủy bên trái, Hủy (surface-2) và Lưu (accent) bên phải.

### Chỗ ngồi
Nút 56px bo 14px. Ghế quầy 2 hàng × 6 (chỉ hiện số), Bàn 3 cột. Đang chọn: nền accent, chữ accent-ink. Có đơn chờ thanh toán: chấm warn 8px góc trên phải. Dải "Đang chọn: <tên>" có icon armchair accent, ngay trên nút Xác nhận đơn.

### Dòng đơn
Thẻ surface 18px: tên món 17/600, ghi chú (pill warn-soft, chữ warn 12px) hoặc "+ Ghi chú" muted, "đơn giá · thành tiền dòng" 13px muted; stepper − / số / + (nút 48px surface-2).

### Nhãn trạng thái
Pill bo 8px, chữ 11–12px/600: Đã thanh toán (ok-soft/ok), Chờ thanh toán (warn-soft/warn), Đã hủy (danger-soft/danger, dòng chữ gạch ngang và muted).

### Biểu đồ
Cột bo trên 4–6px, không trục dọc. Kỳ này accent, kỳ trước surface-2, ngày chưa tới là vạch line 2px. Số món theo giờ: cột cao điểm accent kèm số, còn lại surface-2. Món bán chạy: thanh ngang 6px, món đầu accent, còn lại muted.

### Điều hướng
- Điện thoại: 5 mục (Tổng quan, Thực đơn, Lịch sử, Cài đặt, Order), icon lucide 22px + chữ 11px; đang chọn icon accent, chữ ink 600.
- Máy tính: thanh bên 248px, mục 48px bo 14px; đang chọn nền surface-2, icon accent.

### Thông báo
- Trên màn order: khung bo 14px nền `<tone>-soft`, icon và chữ `<tone>` 13px, đặt dưới đầu tấm.
- Đơn mới (trang chủ quán): nổi ở mép trên, nền surface-2, viền line, có bóng; icon chuông trong ô accent-soft.

## Chuyển động
150–250ms, chỉ báo thay đổi trạng thái: tấm trượt lên 250ms; nút nhấn `scale(.98)` 150ms; số trên ô món nảy 150ms; giá đổi tô warn khoảng 3 giây. Với `prefers-reduced-motion`: bỏ trượt và nảy, chỉ đổi độ mờ.

## Nên và không nên

**Nên:**
- Dùng token vai trò trong component (`bg-surface`, `text-muted`, `bg-accent`…), không dùng mã màu hay tên màu Tailwind.
- Đặt hành động chính ở nửa dưới màn điện thoại.
- Phân cấp bằng bậc nền và cỡ chữ trước, rồi mới đến màu.
- Giữ chữ ngắn; chữ SRS ghim cứng thì giữ nguyên.

**Không nên:**
- Thêm chế độ sáng, vùng sáng lớn hay chữ trắng `#FFFFFF`.
- Dùng gradient, quầng sáng, nhiễu hạt; bóng đổ chỉ cho thông báo đơn mới.
- Dùng accent cho trang trí, hay warn cho thứ không liên quan tới tiền chưa thu / thay đổi.
- Dùng ký tự Unicode hay emoji làm icon; dùng `lucide-react`.
- Dùng `window.prompt`, `confirm`, `alert`.
