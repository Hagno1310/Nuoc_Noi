---
name: Nước Nôi
description: POS cho quán nước đồng giá, trong thế giới "Bao diêm quán bar": mỗi màn hình là mặt một bao diêm in phẳng, bìa đen mờ, chữ kem, đúng một màu mực cam.
colors:
  matte-black: "#141210"
  card-raised: "#221f1b"
  rule-line: "#3a352e"
  ash: "#958d81"
  cream-ink: "#efe6d2"
  flame-ember: "#e8572c"
  ember-ink: "#141210"
  ok-green: "#8fbf7a"
  warn-amber: "#e8b04a"
  danger-rose: "#ef6f7a"
typography:
  display-plate:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(2rem, 12cqw, 4.5rem)"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0"
    fontVariation: "'wdth' 72"
    fontFeature: "tnum"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "0"
    fontVariation: "'wdth' 72"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0"
    fontVariation: "'wdth' 72"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "tnum"
  body-strong:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
    fontFeature: "tnum"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  caption:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.33
    fontFeature: "tnum"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
spacing:
  unit: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  section: "40px"
  touch: "48px"
components:
  button-primary:
    backgroundColor: "{colors.flame-ember}"
    textColor: "{colors.ember-ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.lg}"
    padding: "0 20px"
    height: "48px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.cream-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 16px"
    height: "48px"
  button-outline-active:
    backgroundColor: "{colors.cream-ink}"
    textColor: "{colors.matte-black}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger-rose}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "48px"
  button-danger-armed:
    backgroundColor: "{colors.danger-rose}"
    textColor: "{colors.ember-ink}"
  input-field:
    backgroundColor: "transparent"
    textColor: "{colors.cream-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "8px"
    height: "48px"
  revenue-plate:
    backgroundColor: "{colors.flame-ember}"
    textColor: "{colors.ember-ink}"
    typography: "{typography.display-plate}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
  edit-dialog:
    backgroundColor: "{colors.card-raised}"
    textColor: "{colors.cream-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
    width: "min(24rem, calc(100vw - 2rem))"
  section-title:
    textColor: "{colors.cream-ink}"
    typography: "{typography.title}"
    padding: "0 0 8px"
  hidden-mark:
    backgroundColor: "transparent"
    textColor: "{colors.ash}"
    typography: "{typography.caption}"
    rounded: "{rounded.sm}"
    padding: "0 4px"
  nav-item:
    backgroundColor: "transparent"
    textColor: "{colors.ash}"
    typography: "{typography.label}"
    height: "48px"
  nav-item-current:
    backgroundColor: "{colors.card-raised}"
    textColor: "{colors.cream-ink}"
---

# Design System: Nước Nôi

## Overview

**Creative North Star: "Bao diêm quán bar"**

Mỗi màn hình là mặt một bao diêm của quán Nước Nôi: bìa đen mờ in phẳng, chữ kem, và đúng một màu mực cam như đầu que diêm. Thứ bậc đến từ cách in chứ không từ ánh sáng: chữ biển hẹp và đậm cho con số và tiêu đề, chữ thường cho phần còn lại, một hệ đường kẻ 1px chia sổ, và một tấm in đảo màu duy nhất mỗi màn (trên Tổng quan là doanh thu ngày kinh doanh nằm trong đồng hồ giờ mở cửa). Dải quẹt diêm nhám là chất liệu duy nhất có kết cấu.

Trang chủ quán (đã dựng) là mặt sau của cùng bao diêm: đọc doanh thu tối nay trong một cái nhìn, rồi chỉ khi cần mới vào Thực đơn, Lịch sử đơn hàng hay Cài đặt. Danh sách là sổ in, thao tác theo thói quen web/app quen thuộc: kéo tay cầm, chạm chữ để sửa tại chỗ, nút ⋯ mở hộp thoại. Màn hình order (`/order`) do đợt 3 dựng theo hợp đồng trong `.impeccable/surfaces/src-app-order-page-tsx.md`; tài liệu này chưa mô tả nó.

Thế giới này từ chối POS tối phát sáng kiểu neon, lưới ô màu, và bảng điều khiển thẻ thống kê với biểu đồ phát sáng. Chỉ có nền tối, vì quán là phòng tối. Chữ trên giao diện tối giản; chữ SRS ghim cứng thì giữ nguyên.

**Key Characteristics:**
- Bìa đen mờ phẳng, chữ kem, một mực cam; trung tính khóa đúng 5 bậc.
- Một họ chữ Archivo: hẹp đậm (wdth 72, 800) cho con số và tiêu đề, thường cho câu chữ; số luôn `tabular-nums`.
- Một hệ đường kẻ 1px; không quầng sáng, không vệt sáng, không hạt nhiễu, không bóng đổ.
- Một tấm in đảo màu mỗi màn.
- Trạng thái là dấu in: món/chỗ ngồi ẩn in xám kèm dấu "ẨN" có viền; đơn đã hủy giữ dòng, gạch ngang.
- Chuyển động ngắn, chỉ báo thay đổi trạng thái.

## Colors

Bìa đen ấm, chữ kem, một mực cam lửa; ba màu trạng thái chỉ sống trong khung của chính nó.

### Primary
- **Mực cam lửa** (`--ember`, flame-ember): nền nút hành động chính (Lưu, Lưu giờ, Đăng nhập), lựa chọn đang có hiệu lực (icon mục điều hướng hiện tại, chấm PIN đã nhập, đường thả khi kéo dòng), focus 2px offset 2px, con trỏ nhập, vùng bôi chọn, nét cung đã trôi qua và đốm giờ hiện tại của đồng hồ, cột "kỳ này" của biểu đồ (`--chart-current`), và tấm in đảo màu duy nhất của màn.
- **Chữ trên mực cam** (`--ember-ink`): chữ trên mọi nền đặc sáng (cam, danger), 5.2:1 trên cam. Chữ kem trên cam chỉ 2.9:1, cấm.

### Neutral
- **Bìa đen mờ** (`--bg`): nền mọi trang, `theme-color`, nền thanh điều hướng dưới.
- **Bìa nổi** (`--raised` = `--surface`): một bậc duy nhất cho hộp thoại sửa, thông báo đơn mới, tooltip biểu đồ, dòng đang kéo, sidebar `lg`, nền mục điều hướng hiện tại, nền hover của nút icon.
- **Đường kẻ** (`--line`): hệ đường kẻ duy nhất: chia dòng sổ, gạch dưới tiêu đề mục, rãnh 1px của đồng hồ, lưới chấm biểu đồ, viền dấu "ẨN", viền trên thanh điều hướng, mép sidebar.
- **Tro** (`--edge` = `--ink-muted`): viền điều khiển và chữ phụ cùng một giá trị; 5.7:1 trên nền, 5.0:1 trên bìa nổi. Cũng là trục đáy và cột "kỳ trước" chỉ viền (`--chart-previous`).
- **Kem** (`--ink`): chữ chính, 15:1 trên nền; khối đặc khi nhấn nút viền.

### Trạng thái
- **Xanh ổn** (`--ok`), **Hổ phách** (`--warn`), **Hồng nguy** (`--danger`): lỗi in chữ danger ngay dưới ô hoặc dưới form (`role="alert"`); nút phá hủy viền danger 70%, khối danger khi đã xác nhận. Phần trăm so với kỳ trước dùng xanh ổn/hồng nguy làm tông số, luôn đi kèm mũi tên lên/xuống.

### Named Rules
**The One Spot Ink Rule.** Mực cam chỉ cho hành động chính, lựa chọn đang có hiệu lực, focus, dữ liệu "kỳ này", và đúng một tấm in đảo màu mỗi màn. Không dùng cho trang trí, nhãn hay lỗi.

**The Five Neutrals Rule.** Trung tính chỉ có 5 bậc: bìa đen, bìa nổi, đường kẻ, tro, kem. Không thêm bậc, không dùng opacity để chế bậc mới cho chữ.

**The Framed Alarm Rule.** Màu cảnh báo và lỗi ở yên trong khung của nó (dòng lỗi, nút phá hủy, mũi tên so sánh); không tô cả dòng, cả khối hay cả trang.

## Typography

**Display Font:** Archivo biến thiên, trục `wdth` (fallback system-ui, sans-serif), subset `latin` + `vietnamese`.
**Body Font:** cùng họ Archivo, độ rộng thường.

**Character:** chữ biển trên bao diêm: một họ chữ, thứ bậc bằng độ rộng và độ đậm. Lớp `.font-display` đặt `font-stretch: 72%`, weight 800, tracking 0.

Cỡ chữ gốc 16px ở mọi cỡ màn (SRS R40); mọi cỡ `rem` tính từ đó. Ô nhập giữ chữ ≥ 16px (`max(16px, 1em)`) để iOS Safari không tự phóng to.

### Hierarchy
- **Display Plate** (hẹp 800, `clamp(2rem, 12cqw, 4.5rem)` theo bề rộng đồng hồ, line-height 1): chỉ cho doanh thu ngày kinh doanh trong tấm in đảo màu.
- **Headline** (hẹp 800, 1.875rem): tiêu đề trang (Tổng quan, Thực đơn, Cài đặt, Đăng nhập); doanh thu kỳ trong sổ so sánh ở `lg`.
- **Title** (hẹp 800, 1.25rem): tiêu đề mục, tên món trong sổ, tiêu đề biểu đồ và hộp thoại, giờ trong ô chọn giờ, "món · đơn" dưới tấm in.
- **Body** (400, 1rem): nội dung, ô nhập, thông báo.
- **Body Strong** (600, 1rem): chữ nút chính, giá món.
- **Label** (500, 0.875rem): nhãn ô nhập, tên kỳ, nút viền, điều hướng.
- **Caption** (400, 0.75rem): "Kỳ trước", chú giải và trục biểu đồ, phần trăm so sánh, "Bây giờ HH:MM", câu SRS "Nên đổi khi quán đã đóng cửa.", dấu "ẨN" (600).

### Named Rules
**The One Family Rule.** Chỉ Archivo. Hẹp đậm cho con số và tiêu đề; thường cho câu chữ. Không thêm họ chữ thứ hai, không dùng chữ hẹp cho câu văn hay thông báo.

**The Tabular Rule.** Mọi con số về tiền, số lượng và giờ dùng `tabular-nums` (đặt sẵn trên `body`).

## Layout

Một cột, ưu tiên điện thoại; trang chủ quán rộng tối đa 1152px. `--spacing` là 4px nên khoảng cách và vùng chạm không co theo cỡ chữ gốc.

**Điện thoại:** dải trên (chữ chính vẽ tay + Đăng xuất), dải quẹt diêm dưới nó, nội dung lề 16px, thanh điều hướng 5 icon cố định ở đáy (nội dung chừa `49px + safe-area`). **`lg` (1024px):** sidebar cố định rộng 256px, nền bìa nổi, mép phải kẻ 1px: chữ chính lớn với dải quẹt diêm bên dưới, điều hướng dọc có chữ, "Màn hình order" tách sau một đường kẻ, Đăng xuất ở đáy; chỉ phần nội dung cuộn, lề 40px.

Tổng quan: đồng hồ giờ mở cửa rộng hết khung (tối đa 560px, 70vh) rồi sổ so sánh ba kỳ, rồi hai biểu đồ cột; `lg` đặt đồng hồ cạnh sổ (2fr : 3fr) và hai biểu đồ ở hàng dưới. Thực đơn và Cài đặt: một cột trên điện thoại, hai cột trên `lg` (6fr : 5fr). Thông báo đơn mới nổi ở mép trên (điện thoại cách lề 16px; `lg` góc trên phải).

**Nhịp khoảng cách:** 4px gốc; 8px giữa các nút cạnh nhau và dưới tiêu đề mục, 12–16px trong nhóm, 20px đệm hộp thoại, 24px giữa các khối trong mục, 40px (48–56px trên `lg`) giữa các mục. Vùng chạm tối thiểu 48px.

### Named Rules
**The Owner Forty-Eight Rule.** Nút chính trang chủ quán cao 48px, ngoại lệ có chủ ý so với 56px của màn hình order (SRS NFR-02, R37). Mọi vùng chạm ≥ 48px.

**The Narrow Ledger Rule.** Không đặt bảng có `min-width` lớn trong `overflow-x-auto` ở khổ điện thoại; dưới `sm` sổ xếp thành dòng hai tầng.

## Elevation & Depth

Phẳng hoàn toàn. Không có bóng đổ, quầng sáng, gradient hay hạt nhiễu. Chiều sâu chỉ đến từ một bậc tông (bìa đen → bìa nổi) và viền 1px. Hộp thoại sửa là bìa nổi viền tro trên nền tối mờ 70%; dòng đang kéo nhấc lên bằng nền bìa nổi.

### Named Rules
**The Flat Print Rule.** Mọi thứ in phẳng trên bìa. Không `box-shadow`, không `filter: drop-shadow`, không quầng, không vệt sáng, kể cả trên logo.

**The One Striker Rule.** Dải quẹt diêm (`.striker`: cao 8px, bo 2px, chấm nhám tĩnh trên bìa nổi) là đường chia duy nhất có kết cấu: dưới dải trên điện thoại và dưới chữ chính trong sidebar. Mọi đường chia khác là đường kẻ 1px.

## Shapes

Góc bo nhỏ, như góc tem in. Nút, ô nhập, thông báo, tooltip và mục điều hướng `lg` bo 8px; hộp thoại bo 12px; tấm in đảo màu, nút icon và nút viền nhỏ bo 6px; dấu "ẨN", ô chú giải và đầu cột biểu đồ bo 4px. Viền điều khiển 1px tro; đường kẻ 1px đường kẻ. Cột biểu đồ neo đáy, bo hai góc trên, khe 2px giữa cột kỳ này (tô cam) và kỳ trước (chỉ viền tro), vì cam và tro gần cùng độ sáng nên phân biệt bằng tô và viền.

## Components

### Buttons
In thẳng: khối cam cho việc chính, viền tro cho việc phụ, viền hồng cho việc phá hủy.
- **Shape:** bo 8px, cao 48px.
- **Primary** (Lưu, Lưu giờ, Đăng nhập): khối cam, chữ đen 600, đệm ngang 20px. Nhấn thu `scale(.98)` trong 150ms; vô hiệu opacity .4; đang chạy đổi chữ ("Đang lưu…").
- **Outline** (Hủy trong hộp thoại, Thêm món, Hiện lại, Đăng xuất): viền tro, chữ kem; hover viền kem; Đăng xuất nhấn thành khối kem chữ đen.
- **Danger hai bước** ("Ẩn món" / "Ẩn chỗ ngồi" → "Chắc chắn ẩn?"; "Chắc chắn đổi PIN?"): viền danger 70% chữ danger, bấm lần đầu thành khối danger chữ đen. Trong hộp thoại nó nằm sát trái, Hủy và Lưu dồn sát phải.
- **Icon** (⋯, Đóng): vùng 48×48, icon lucide 20px màu tro, hover thành kem trên bìa nổi.
- **Focus:** viền cam 2px offset 2px trên mọi điều khiển.

### Ledger Rows (Thực đơn, Chỗ ngồi)
Dòng sổ kẻ 1px. Từ trái sang: tay cầm kéo (GripVertical, vùng 48px cao, kéo bằng con trỏ hoặc phím mũi tên), tên chạm để sửa tại chỗ (Title), giá chạm để sửa tại chỗ (Body Strong, canh phải; chỉ Thực đơn), nút ⋯. Dòng đang kéo nền bìa nổi và theo ngón tay; vị trí thả là đường cam 2px trên hoặc dưới dòng. Món/chỗ ngồi ẩn nằm trong "Món đã ẩn (n)" có thể mở: chữ tro, dấu "ẨN" viền đường kẻ, nút Hiện lại.

### Inline Edit
Chữ là một nút; hover hoặc focus chuyển chữ sang cam. Chạm mở ô viền tro (focus viền cam), mờ dần vào trong 180ms, chọn sẵn toàn bộ chữ. Enter hoặc chạm ra ngoài là lưu, Esc là hủy; lỗi in chữ danger ngay dưới ô.

### Edit Dialog
`<dialog>` gốc giữa màn hình, rộng `min(24rem, 100vw − 2rem)`, bìa nổi, viền tro, bo 12px, nền sau tối mờ 70%. Tiêu đề Title + nút Đóng; các ô có nhãn; hàng nút: Ẩn hai bước bên trái, Hủy + Lưu cam bên phải. Esc hoặc chạm nền là đóng. Hiện ra bằng nổi lên 8px và thu từ .98 trong 200ms, nền mờ dần 200ms.

### Inputs / Fields
- **Style:** nền trong suốt, viền 1px tro, bo 8px, cao 48px, nhãn Label tro ở trên. Ô giá và giờ dùng `tabular-nums`; ô chọn giờ dùng Title.
- **Focus:** viền chuyển cam, cộng vòng focus cam 2px.
- **Error:** dòng chữ danger dưới ô hoặc form, `role="alert"`.

### Navigation
Bốn mục chủ quán (Tổng quan, Thực đơn, Lịch sử đơn hàng, Cài đặt) và Màn hình order, mỗi mục icon lucide 20px. Chưa chọn: tro 500. Hiện tại: chữ kem, icon cam; `lg` thêm nền bìa nổi và chữ 600. Điện thoại: thanh 5 cột cố định ở đáy, chỉ icon (tên trong `aria-label`), nền bìa đen, kẻ trên 1px.

### Business Day Dial (Đồng hồ giờ mở cửa)
Giờ mở cửa → giờ đóng cửa trải trên 300°. Rãnh 1px màu đường kẻ cả vòng, vạch tro ở giờ đóng cửa, nét cam 2.5 đơn vị cho phần đã trôi qua, đốm cam ở giờ hiện tại (ẩn khi "Đã đóng cửa"). Nhãn giờ ở hai chân cung. Tâm là tấm in đảo màu doanh thu (khối cam bo 6px, chữ đen Display Plate), dưới là "món · đơn" (Title) và "Bây giờ HH:MM". Không vẽ số liệu lên cung, không chuyển động.

### Period Ledger & Revenue Bars
Sổ ba kỳ (ngày kinh doanh, tuần, tháng) kẻ 1px: tên kỳ Label tro, doanh thu Title (Headline ở `lg`), món và đơn, phần trăm có mũi tên, và một dòng "Kỳ trước" Caption; `lg` là bảng có hàng tiêu đề, số canh phải. Biểu đồ: một trục, lưới chấm đường kẻ, chú giải ô tô/ô viền, tooltip bìa nổi viền tro, bảng ẩn cho trình đọc màn hình.

### New Order Notice
Thông báo `role="status"` ở mép trên: bìa nổi, viền tro, bo 8px, chữ 500 tabular; vào bằng trượt xuống 8px trong 200ms, tự tắt sau 5 giây.

## Do's and Don'ts

### Do:
- **Do** dùng token vai trò (`bg-bg`, `text-ink`, `border-edge`, `bg-ember`…) trong component; không dùng mã màu hay tên màu Tailwind.
- **Do** giữ mực cam cho hành động chính, lựa chọn đang có hiệu lực, focus và một tấm in đảo màu mỗi màn (One Spot Ink Rule).
- **Do** đặt chữ đen `--ember-ink` trên mọi nền cam hoặc danger.
- **Do** chia sổ, mục và danh sách bằng đường kẻ 1px; dải quẹt diêm chỉ ở dưới dải trên và dưới chữ chính sidebar.
- **Do** theo thói quen quen thuộc cho dòng sổ: tay cầm kéo, chạm chữ để sửa tại chỗ, ⋯ mở hộp thoại giữa màn hình; giờ mở cửa là một form với một nút "Lưu giờ".
- **Do** in món/chỗ ngồi ẩn bằng chữ tro kèm dấu "ẨN" có viền; in đơn đã hủy bằng gạch ngang, chữ tro, giữ dòng.
- **Do** đặt nút phá hủy hai bước xa nút Lưu và trông khác hẳn nó.
- **Do** giữ chuyển động trong 150–200ms: mọi điều khiển đổi màu/nền/viền/độ mờ/transform 150ms, nhấn nút chính `scale(.98)`, hộp thoại 200ms, ô sửa và danh sách đã ẩn mờ dần 180ms, thông báo 200ms; riêng số liệu Tổng quan chạy 600ms khi tự tải lại. Với `prefers-reduced-motion`: bỏ di chuyển, chỉ giữ đổi độ mờ, tắt chạy số.
- **Do** giữ chữ tối giản; chữ SRS ghim cứng thì giữ nguyên.

### Don't:
- **Don't** thêm chế độ sáng, vùng nền sáng lớn hay chữ trắng `#FFFFFF`.
- **Don't** dùng bóng đổ, quầng sáng, vệt sáng, gradient hay hạt nhiễu, kể cả trên logo.
- **Don't** đặt chữ kem trên nền cam (2.9:1).
- **Don't** in tấm cam đảo màu thứ hai trên cùng một màn.
- **Don't** thêm bậc trung tính thứ sáu hay họ chữ thứ hai.
- **Don't** làm thẻ thống kê hay biểu đồ phát sáng; dữ liệu là sổ in và cột phẳng.
- **Don't** tô đỏ cả dòng hay cả khối cho lỗi hoặc cảnh báo.
- **Don't** dùng ký tự Unicode hay emoji làm icon; dùng `lucide-react` với `aria-hidden` hoặc `aria-label`.
- **Don't** dùng `window.prompt`, `confirm`, `alert`.
