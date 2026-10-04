---
name: Nước Nôi
description: POS cho quán nước đồng giá, trong thế giới "Phơi sáng dài" — ảnh chụp đêm phơi sáng lâu trong một quán bar tối.
colors:
  olive-black: "#1A1E15"
  olive-raised: "#2E3424"
  olive-line: "#4A5238"
  olive-edge: "#78815E"
  cream-ink: "#E6D8B4"
  sage-muted: "#A9B08F"
  ember: "#E68A3C"
  ember-ink: "#1A1E15"
  amber-warn: "#E5BC5E"
  coral-danger: "#EE8A76"
typography:
  display-count:
    fontFamily: "Anton, Be Vietnam Pro, sans-serif"
    fontSize: "4.5rem"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "tnum"
  display-total:
    fontFamily: "Anton, Be Vietnam Pro, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 400
    lineHeight: 1.1
    letterSpacing: "0.025em"
    fontFeature: "tnum"
  display-revenue:
    fontFamily: "Anton, Be Vietnam Pro, sans-serif"
    fontSize: "clamp(2.75rem, 9vmin, 5.5rem)"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "0.025em"
    fontFeature: "tnum"
  headline:
    fontFamily: "Anton, Be Vietnam Pro, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "0.025em"
  title:
    fontFamily: "Anton, Be Vietnam Pro, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.025em"
  label-confirm:
    fontFamily: "Anton, Be Vietnam Pro, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 400
    lineHeight: 1.33
    letterSpacing: "0.025em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  body-strong:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  hair: "6px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  touch: "48px"
  touch-key: "56px"
  touch-primary: "64px"
components:
  button-confirm:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ember-ink}"
    typography: "{typography.label-confirm}"
    rounded: "{rounded.2xl}"
    height: "64px"
    width: "100%"
  button-confirm-disabled:
    backgroundColor: "{colors.olive-raised}"
    textColor: "{colors.sage-muted}"
  button-primary:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ember-ink}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.cream-ink}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "48px"
  button-key:
    backgroundColor: "transparent"
    textColor: "{colors.cream-ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.xl}"
    height: "56px"
  button-key-pressed:
    backgroundColor: "{colors.cream-ink}"
    textColor: "{colors.olive-black}"
  seat:
    backgroundColor: "transparent"
    textColor: "{colors.cream-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    height: "48px"
  seat-selected:
    backgroundColor: "{colors.ember}"
    textColor: "{colors.ember-ink}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.coral-danger}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "48px"
  button-danger-armed:
    backgroundColor: "{colors.coral-danger}"
    textColor: "{colors.ember-ink}"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.cream-ink}"
    rounded: "{rounded.lg}"
    padding: "12px"
    height: "48px"
  section-card:
    backgroundColor: "transparent"
    rounded: "{rounded.xl}"
    padding: "16px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.sage-muted}"
    typography: "{typography.label}"
    height: "48px"
  nav-item-current:
    textColor: "{colors.cream-ink}"
---

# Design System: Nước Nôi

## Overview

**Creative North Star: "Phơi sáng dài"**

Mỗi màn hình là một tấm ảnh chụp đêm phơi sáng lâu trong quán bar tối: nền ô liu gần đen có nhiễu hạt như phim, vài con số màu kem cháy sáng ở giữa khung, mọi thứ khác lùi vào bóng tối cho tới khi được chạm. Ánh sáng là chất liệu duy nhất của chiều sâu: vệt sáng ngang thay cho đường kẻ, quầng sáng quanh logo như đèn bar bị nhòe, ghế đang chọn phát sáng như một nguồn sáng, cung giờ của chủ quán là một vệt đèn kéo dài kết thúc bằng đốm than hồng như đầu điếu thuốc.

Mật độ khác nhau theo vai trò. Màn hình order thưa và to: hai con số khổng lồ, phím trong vùng ngón cái, một thanh ember duy nhất ở đáy. Trang chủ quán đặc hơn: sổ đơn hàng là bảng chữ kem trên nền ô liu, cài đặt là các khung viền mảnh. Cả hai dùng chung một bảng màu, một màu nhấn, hai họ chữ.

Thế giới này từ chối lưới ô màu sáng của POS có thực đơn và bảng điều khiển admin dạng thẻ thống kê với biểu đồ. Chỉ có giao diện tối, vì quán là phòng tối.

**Key Characteristics:**
- Chỉ có nền tối: ô liu gần đen với nhiễu hạt tĩnh, không có chế độ sáng.
- Chữ màu kem, không bao giờ trắng.
- Một màu nhấn ember cho hành động chính, chỗ ngồi đang chọn, focus và các nguồn sáng.
- Điều khiển là viền mảnh khi nghỉ, khối đặc khi nhấn, gạch ngang khi đã hủy.
- Con số lớn dùng mặt chữ poster Anton; mọi chữ giao diện khác dùng Be Vietnam Pro, số luôn `tabular-nums`.
- Logo là hình vẽ tay gốc, chỉ dùng từ file PNG, có quầng sáng ember.

## Colors

Bảng màu ô liu tối lấy từ nền logo, chữ kem đã giảm sáng để không chói trong phòng tối, và một ánh than hồng duy nhất.

### Primary
- **Ember / Than hồng** (`--ember`): màu nhấn duy nhất. Nền nút Xác nhận đơn và nút lưu/lọc, ghế đang chọn, viền focus (`2px`, offset `2px`), con trỏ nhập, vùng bôi chọn, icon của mục điều hướng hiện tại, đốm than ở đầu cung giờ, sắc ấm trong vệt sáng. Dùng làm chữ đạt ≥ 4.9:1 nhưng hiện chỉ xuất hiện ở dạng nền và nét.
- **Ember Ink** (`--ember-ink`): chữ trên mọi nền đặc sáng (ember, danger, warn). Cùng giá trị với nền, 6.5:1 trên ember.

### Neutral
- **Olive Black / Ô liu gần đen** (`--bg`): nền mọi trang, `theme-color` của trình duyệt và nền icon ứng dụng. Body phủ lớp nhiễu hạt SVG tĩnh (fractalNoise, alpha 0.07, ô 160px).
- **Olive Raised** (`--raised`): bề mặt nổi duy nhất đang dùng: thanh phản hồi sau khi tạo đơn, nút bị vô hiệu, skeleton đang tải, nền khi nhấn ghế.
- **Olive Line** (`--line`): đường kẻ trang trí: vạch chia giữa các dòng đơn, viền khung cài đặt, viền trên thanh điều hướng, vệt của đơn đã hủy.
- **Olive Edge** (`--edge`): viền điều khiển (phím, ghế, ô nhập, nút viền), 4.1:1 trên nền, và màu thanh cuộn.
- **Cream Ink / Kem** (`--ink`): chữ chính, 12:1 trên nền. Cũng là khối đặc khi nhấn phím.
- **Sage Muted** (`--ink-muted`): chữ phụ, nhãn nhóm, chữ của đơn đã hủy, mục điều hướng chưa chọn; ≥ 5.6:1.

### Trạng thái
- **Amber Warn** (`--warn`): thông báo cần chú ý (giá đã đổi, đơn trùng) ở dạng chữ + viền 50%; nền đặc khi Đơn giá vừa đổi (3 giây).
- **Coral Danger** (`--danger`): lỗi, mất mạng, nút Hủy. Viền 60–70% khi nghỉ, nền đặc khi đã "Chắc chắn hủy?".

`--surface` dùng cho sidebar trang chủ quán (`lg`) và dòng tổng của sổ đơn hàng. `--ok` được khai báo trong `:root` như một phần của bộ token vai trò nhưng chưa có thành phần nào dùng; chỉ đưa vào khi có chỗ thật cần.

### Named Rules
**The One Ember Rule.** Ember chỉ dành cho hành động chính, lựa chọn đang có hiệu lực, focus và các nguồn sáng của thế giới (vệt sáng, đầu cung). Không dùng ember cho trang trí, nhãn hay trạng thái lỗi.

**The Cream-Not-White Rule.** Không có `#FFFFFF` ở bất cứ đâu. Chữ sáng nhất là kem; khối sáng nhất là ember hoặc kem khi nhấn.

**The Darkroom Rule.** Không có vùng sáng lớn. Khối đặc sáng chỉ xuất hiện ở nút hành động chính, ghế đang chọn và phím đang bị nhấn.

## Typography

Cỡ chữ gốc 15px dưới `lg` (`html { font-size: 93.75% }`), 16px từ `lg`; mọi cỡ `rem` bên dưới co theo. `--spacing` là 4px nên khoảng cách và vùng chạm không co. Ô nhập giữ chữ ≥ 16px (`max(16px, 1em)`) để iOS Safari không tự phóng to.

**Display Font:** Anton (fallback Be Vietnam Pro, sans-serif), một weight 400, subset `latin` + `vietnamese`.
**Body Font:** Be Vietnam Pro (fallback system-ui, sans-serif), weight 400/500/600/800, subset `latin` + `vietnamese`.

**Character:** Anton là chữ poster hẹp, nét dày, gần với nét vẽ tay của logo; nó chỉ chở con số và tiêu đề. Be Vietnam Pro là giọng nói rõ ràng, đủ dấu tiếng Việt, gánh toàn bộ phần còn lại.

### Hierarchy
- **Display Count** (Anton 400, 4.5rem → 6rem khi cao ≥ 740px → 8rem khi rộng ≥ 380px và cao ≥ 740px, line-height 1): số cốc trên màn hình order.
- **Display Total** (Anton 400, 2.25rem → 3.75rem khi cao ≥ 740px, tracking 0.025em): Thành tiền.
- **Display Revenue** (Anton 400, `clamp(2.75rem, 9vmin, 5.5rem)`, line-height 1): doanh thu của ngày kinh doanh trong tâm cung giờ (cỡ theo bề rộng cung: `clamp(2rem, 12cqw, 4.5rem)`).
- **Headline** (Anton 400, 1.875rem, tracking 0.025em): tiêu đề trang Tổng quan, doanh thu tháng, phím +1 +2 +5 +10.
- **Title** (Anton 400, 1.25rem–1.5rem, tracking 0.025em): tiêu đề mục "Đơn vừa tạo" (màu sage), số cốc dưới doanh thu, chữ "cốc" cạnh số cốc.
- **Label Confirm** (Anton 400, 1.5rem, tracking 0.025em): nhãn "Xác nhận đơn".
- **Body** (Be Vietnam Pro 400, 1rem): dòng đơn, nội dung cài đặt, thông báo.
- **Body Strong** (Be Vietnam Pro 600, 1rem): chữ trên nút viền, ghế, thành tiền trong dòng sổ.
- **Label** (Be Vietnam Pro 500, 0.875rem): nhãn ô nhập, Đơn giá, điều hướng, ngày kinh doanh.
- **Caption** (Be Vietnam Pro 500, 0.75rem): nhãn nhóm ghế, trạng thái trong dòng sổ, giờ "Bây giờ".

### Named Rules
**The Two Faces Rule.** Be Vietnam Pro cho mọi chữ giao diện. Anton chỉ cho con số hiển thị lớn, phím cộng số lượng, nhãn Xác nhận đơn và tiêu đề trang/mục. Quyết định này đã được người dùng duyệt và đứng trên dòng "một họ font sans" của `.claude/rules/ui-craft.md`. Không thêm họ chữ thứ ba, không dùng Anton cho câu văn, nhãn ô nhập hay thông báo.

**The Tabular Rule.** Mọi con số về tiền, số lượng và giờ dùng `tabular-nums` (đặt sẵn trên `body`), để con số không nhảy khi thay đổi.

## Layout

Một cột, ưu tiên điện thoại. Màn hình order là `max-w-md` (448px) với lề 16px; trang chủ quán là `max-w-6xl` (1152px).

**Màn hình order vừa một khung, không cuộn**, ở 390×844 và 360×640: header (logo trái, Đơn giá phải) → số cốc → Thành tiền + vệt sáng → Ghế quầy 2 hàng × 6 cột như mép quầy thật → Bàn · Mang về 4 cột → phím `+1 +2 +5 +10` (4 cột) và `−1 / Xóa` (2 cột) đẩy xuống vùng ngón cái bằng `mt-auto` → thanh Xác nhận đơn dính đáy, có `safe-area-inset-bottom`. Khung đầu cao `calc(100dvh - 96px)`. Con số chỉ phóng to và khoảng cách chỉ nới ra khi `min-height: 740px`; dưới mức đó mọi thứ giữ cỡ nhỏ để vừa khung. "Đơn vừa tạo" nằm dưới, phải cuộn tới.

**Trang chủ quán:** dưới `lg` (1024px) là dải trên (logo + Đăng xuất), nội dung, và thanh điều hướng 4 cột cố định ở đáy (nội dung chừa `49px + safe-area`). Từ `lg` là **sidebar cố định** bên trái, rộng 256px, nền `--surface`, mép phải là vệt sáng dọc 1px (ember 50%): logo lớn + "Trang chủ quán", điều hướng dọc có icon, "Màn hình order" tách riêng dưới một đường kẻ, Đăng xuất (nút viền + icon) ở đáy; chỉ phần nội dung bên phải cuộn. Đệm đáy trên điện thoại vừa bằng thanh điều hướng (`49px + safe-area`: 48px + viền 1px). Thông báo đơn mới nổi ở mép trên (điện thoại: cách lề 16px; `lg`: góc trên phải), nền `--raised`, viền `--edge`, bo 8px, hiện 5 giây, vào bằng `toast-in` 200ms. Tổng quan trên `lg`: hàng trên là cung giờ cạnh sổ so sánh dạng bảng (hàng tiêu đề Doanh thu / Số cốc / Số đơn, số canh phải), hàng dưới là hai biểu đồ (tuần 2fr, tháng 3fr). Cài đặt trên `lg`: hai cột, cài đặt ngắn (Đơn giá chung, Giờ mở/đóng cửa, PIN quán) bên trái, Chỗ ngồi bên phải; điện thoại một cột, Chỗ ngồi cuối. Các mục dùng tiêu đề Anton + vệt sáng thay cho khung viền.

**Sổ đơn hàng:** dưới `sm` (640px) mỗi đơn là một dòng sổ hai tầng (giờ · chỗ ngồi + trạng thái; số cốc × đơn giá ↔ thành tiền). Từ `sm` là bảng 6 cột. Dòng tổng dính đáy, nằm trên thanh điều hướng: khối `--surface` bo 8px, đệm 16px ngang; trái là số đơn · số cốc (0.875rem) kèm "Không tính đơn đã hủy" (Caption), phải là nhãn Doanh thu (Caption) trên số doanh thu (Body Strong).

**Nhịp khoảng cách:** 6px giữa các ghế, 8px giữa các phím và giữa các nhóm hẹp, 12px giữa các nhóm, 16px lề và đệm khung, 24px giữa các mục lớn. Vùng chạm tối thiểu 48px; phím cộng 56px; nút hành động chính 64px; mục điều hướng 48px.

### Named Rules
**The One Frame Rule.** Mọi thứ cần để tạo một đơn (số cốc, chỗ ngồi, phím, Xác nhận đơn) nằm trọn trong khung đầu ở 360×640 mà không cuộn.

**The Narrow Ledger Rule.** Không đặt bảng có `min-width` lớn trong `overflow-x-auto` ở khổ điện thoại: Chrome Android thu nhỏ cả trang. Dưới `sm` dùng dòng sổ hai tầng.

## Elevation & Depth

Không có bóng đổ để nâng bề mặt. Chiều sâu đến từ hai thứ: tông (nền → `--raised` cho bề mặt nổi duy nhất) và ánh sáng phát ra từ chính vật thể, như trong ảnh phơi sáng.

### Shadow Vocabulary
- **Logo halo** (`filter: drop-shadow(0 0 1px rgb(230 216 180 / .5)) drop-shadow(0 0 14px rgb(230 138 60 / .35)) drop-shadow(0 0 40px rgb(230 138 60 / .18))`): chỉ cho ảnh logo và motif điếu thuốc, không bao giờ cho chữ.
- **Seat glow** (`box-shadow: 0 0 18px rgb(230 138 60 / .45)`): ghế đang chọn phát sáng như một nguồn sáng.
- **Streak bloom** (bản sao mờ `blur(6px)`, opacity .55, dưới vệt sáng 2px): quầng của vệt sáng.
- **Arc glow** (`feGaussianBlur` 3.5 dưới nét cung ember 5 đơn vị, opacity .45; đốm than r 3.2 với quầng r 7): cung giờ của chủ quán.

### Named Rules
**The Light-Is-Depth Rule.** Quầng sáng chỉ gắn với thứ đang phát sáng (logo, lựa chọn, vệt sáng, đầu cung). Không dùng bóng đổ xám hay bóng lệch cứng để nâng thẻ, nút hay hộp thoại.

## Shapes

Góc bo vừa phải, mềm như cạnh ly. Nút hành động chính và thanh phản hồi bo 16px; phím số lượng và khung cài đặt bo 12px; ghế, ô nhập, nút viền và thông báo bo 8px; nút Hủy của chủ quán và nhãn Đơn giá bo 6px; vệt sáng, chấm PIN và nhãn Mất mạng bo tròn hẳn.

Đường kẻ của thế giới này là **vệt sáng** (`.streak`): cao 2px, gradient ngang trong suốt → ember 12% → kem 55% → kem 25% → trong suốt, có quầng mờ. Nó nằm dưới Thành tiền, bên phải nhãn nhóm ghế (opacity .3) và tiêu đề Đơn vừa tạo (opacity .4), và phía trên doanh thu tháng. Mỗi dòng trong Đơn vừa tạo có một vệt ember 2px dài theo số cốc (6% + 4%/cốc, đủ dài ở 25 cốc); đơn đã hủy thì vệt chuyển sang `--line`.

Viền điều khiển 1px `--edge`; viền trang trí 1px `--line`.

## Components

### Buttons
Dấu in: viền mảnh khi nghỉ, khối đặc khi nhấn.
- **Xác nhận đơn:** khối ember rộng hết khung, cao 64px, bo 16px, nhãn Anton 1.5rem. Nhấn: thu `scale(.98)` trong 150ms. Vô hiệu: nền `--raised`, chữ sage. Đang gửi: "Đang gửi…".
- **Primary trên trang chủ quán** (Lưu thay đổi, Lọc, Đăng nhập): khối ember, cao 48–56px, bo 8px, Be Vietnam Pro đậm; vô hiệu giảm opacity .5.
- **Nút viền** (Hoàn tác, Xuất CSV, nút lưu phụ): viền `--edge`, chữ kem, bo 8–12px; nhấn chuyển thành khối kem chữ nền.
- **Nút phá hủy** (Hủy): viền danger 70%, chữ danger. Hai bước: bấm lần đầu thành khối danger "Chắc chắn hủy?"; đang chạy "Đang hủy…". Luôn đặt xa nút hành động chính.
- **Focus:** viền ember 2px, offset 2px, trên mọi điều khiển.

### Quantity Keys
Phím `+1 +2 +5 +10` cao 56px, bo 12px, viền `--edge`, số Anton 1.875rem. `−1` và `Xóa` cao 48px, chữ sage Be Vietnam Pro 800. Nhấn: viền và nền chuyển sang kem, chữ sang màu nền, 150ms.

### Seats (Chips)
- **Style:** cao 48px, bo 8px, viền `--edge`, chữ kem Be Vietnam Pro 600; Ghế quầy chỉ ghi số ("7"), tên đầy đủ trong `aria-label`.
- **Đang chọn:** khối ember, chữ ember-ink, quầng ember 18px. Các chỗ khác lùi về opacity .6 (vẫn 5.1:1), thay vì làm chỗ được chọn chói hơn. Chuyển 200ms.
- Nhãn nhóm: caption sage + vệt sáng mờ kéo hết hàng.

### Order Feedback Bar
Sau khi tạo đơn, nút Xác nhận nhường chỗ cho thanh `--raised` bo 16px, viền ember 60%, cao 64px: motif điếu thuốc bốc khói (cắt từ logo, có halo) + "Đã tạo đơn N cốc – X đ" + nút Hoàn tác. Tự tắt sau 5 giây. Cùng lúc, một vệt ember 6px chạy `exposure-streak` (250ms, `cubic-bezier(0.16, 1, 0.3, 1)`): co từ 15% bề ngang, kéo dài ra, rồi trượt xuống 48px và mờ dần về phía Đơn vừa tạo. Ẩn hẳn khi `prefers-reduced-motion`.

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** trong suốt trên nền hạt; không đổ nền khối.
- **Shadow Strategy:** không (xem Elevation & Depth).
- **Border:** 1px `--line`.
- **Internal Padding:** 16px, khoảng cách bên trong 12px.
- Thông báo (lỗi, cảnh báo): bo 8px, viền màu trạng thái 50–60%, chữ màu trạng thái, không nền.

### Inputs / Fields
- **Style:** nền trong suốt, viền 1px `--edge`, bo 8px, cao ≥ 48px, đệm 8–12px; ô giá dùng chữ 1.25rem tabular. Con trỏ ember; biểu tượng lịch của ô ngày được lọc sang tông kem.
- **Ô số cốc:** không có khung; chỉ là con số Anton khổng lồ với gạch chân 2px trong suốt, chuyển sang ember khi focus. Placeholder "0" màu sage 60%.
- **Focus:** viền ember 2px offset 2px.
- **Error:** dòng chữ danger ngay dưới ô, `role="alert"`.

### Navigation
Bốn mục: Tổng quan, Lịch sử đơn hàng, Cài đặt, Màn hình order. Mỗi mục có icon lucide 20px. Chữ label sage 500; mục hiện tại chữ kem, icon ember. Điện thoại: thanh 4 cột cố định ở đáy, chỉ icon (tên đầy đủ trong `aria-label`), nền `--bg`, viền trên `--line`, mỗi mục cao 48px. Máy tính (`lg`): danh sách dọc trong sidebar, chữ 1rem, mục hiện tại có nền `--raised` và chữ 600.

### Business Day Arc (Đồng hồ ca)
Khoảng giờ mở cửa → giờ đóng cửa (mặc định 20:00–02:00) trải trên 300°; cả vòng là một vệt mờ 1 đơn vị màu `--line` (giờ chưa tới), phần đã trôi qua vẽ sáng đè lên; ngoài giờ mở cửa cung đầy và ghi "Đã đóng cửa". Nét cung 1.6 đơn vị gradient kem 35% → kem → ember, trên một quầng ember mờ; đầu cung là đốm than ember có quầng, như đầu điếu thuốc. Giờ mở cửa ghi nhỏ ở chân cung. Doanh thu của ngày kinh doanh (Display Revenue), số cốc · số đơn (Title) và "Bây giờ HH:MM" nằm trong tâm. Không vẽ số liệu lên cung.

### Brand Marks
- **Chữ chính vẽ tay** (`/brand/nuoc-noi-wordmark.png`, 1096×1016, nền trong suốt): góc trên trái màn hình order (cao 36px → 50px), dải trên/cột trái trang chủ quán (40px → 80px), trang đăng nhập; luôn có halo. Icon ứng dụng đặt chữ chính ở 60% khung trên nền `#1A1E15`.
- **Motif điếu thuốc** và **motif ly cocktail**: cắt nguyên từ chữ chính. Điếu thuốc đánh dấu đơn vừa tạo; ly cocktail (opacity .4, không halo) nằm cạnh "Chưa có đơn nào."
- **Chữ phụ art deco** (`nuoc-noi-wordmark-small.png`, 238×50): có sẵn trong `public/brand`, hiện chưa dùng ở màn hình nào.

## Do's and Don'ts

### Do:
- **Do** dùng token vai trò (`bg-bg`, `text-ink`, `border-edge`, `bg-ember`…) trong component; không dùng mã màu hay tên màu Tailwind.
- **Do** giữ ember cho hành động chính, lựa chọn đang có hiệu lực, focus và nguồn sáng (One Ember Rule).
- **Do** vẽ điều khiển bằng viền mảnh `--edge` khi nghỉ và chuyển thành khối kem (hoặc ember nếu là lựa chọn) khi nhấn.
- **Do** hiển thị đơn đã hủy bằng gạch ngang + chữ sage, giữ nguyên dòng; không xóa, không tô đỏ cả dòng.
- **Do** dùng vệt sáng `.streak` thay cho đường kẻ trang trí đứng một mình.
- **Do** dùng logo và motif từ file PNG gốc, có halo (trừ motif ly cocktail ở trạng thái trống).
- **Do** giữ chuyển động phản hồi trong 120–250ms (số cốc nảy 160ms, đơn mới trượt vào 240ms, vệt sáng khi gửi 250ms). Khoảnh khắc chính duy nhất là "ảnh hiện dần" khi mở Tổng quan: số liệu từ nhòe sang rõ (`develop` 700ms), cung tự vẽ (`arc-draw` 800ms), cột mọc lần lượt (`bar-rise` 450ms, trễ tối đa ~300ms); số chạy 600ms khi tự tải lại. Với `prefers-reduced-motion`: bỏ di chuyển, chỉ giữ đổi độ mờ.
- **Do** kiểm tra màn hình order ở 360×640 và 390×844: không được cuộn mới tới nút Xác nhận đơn.

### Don't:
- **Don't** thêm chế độ sáng, vùng nền sáng lớn hay chữ trắng `#FFFFFF`.
- **Don't** vẽ lại logo bằng CSS, SVG hay một font gần giống; không đặt halo lên chữ.
- **Don't** dùng Anton cho câu văn, nhãn ô nhập, thông báo hay nút thường; không thêm họ chữ thứ ba.
- **Don't** dùng bóng đổ xám hoặc bóng lệch cứng để nâng bề mặt; chiều sâu chỉ đến từ tông `--raised` và quầng sáng của vật phát sáng.
- **Don't** làm lưới ô màu sáng kiểu POS có thực đơn, hay thẻ thống kê và biểu đồ trên trang Tổng quan.
- **Don't** cho vệt sáng hay nhiễu hạt chuyển động; chỉ `exposure-streak` được chạy, và chỉ khi tạo đơn.
- **Don't** đặt bảng rộng có `min-width` trong `overflow-x-auto` ở khổ điện thoại.
- **Don't** dùng ký tự Unicode hay emoji làm icon; dùng `lucide-react` với `aria-hidden` hoặc `aria-label`.
