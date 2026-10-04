# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Nhân viên:** người trẻ, rành điện thoại. Họ tạo đơn hàng trên điện thoại của mình và **thường bấm bằng một tay**, vì tay kia đang cầm cốc, khay hoặc tiền thối. Lúc quán đông, họ cần ghi xong một đơn trong vài giây rồi quay lại phục vụ.
- **Chủ quán:** quản lý thực đơn (món và giá), chỗ ngồi, giờ mở cửa và PIN quán; xem doanh thu; hủy đơn sai. Dùng máy tính, tablet hoặc điện thoại. Chủ quán cũng có thể tạo đơn.

## Product Purpose

Ghi nhận nhanh các món bán ra và doanh thu của một quán bar nhỏ bán theo **thực đơn ngắn** (khoảng 8 món, mỗi món một giá). Thành công nghĩa là:
- Nhân viên ghi đơn mà gần như không phải nghĩ.
- Không có đơn bị sai giá, ghi trùng hoặc mất.
- Chủ quán biết chính xác doanh thu ngày và tháng.

## Positioning

Thực đơn rất ngắn và mỗi món chỉ có một giá, không có biến thể, topping hay size. Cả quy trình gọi món chỉ còn: **chạm các món** (mỗi chạm +1), **chọn chỗ ngồi**, **xác nhận**. Ứng dụng tận dụng điều đó để 8 món nằm gọn trong một màn hình, không có danh mục hay tìm kiếm, và một đơn một món chỉ mất bốn chạm. Các app POS đa năng, với cây danh mục và hộp thoại tùy chọn, không làm gọn được như vậy.

## Operating Context

- **Quán chỉ mở buổi tối, từ 20:00 đến 02:00 sáng hôm sau.** Mọi đơn hàng đều được tạo vào ban đêm.
- **Quán là phòng tối, có quầy bar:** 12 ghế quầy và 3 bàn. Nhân viên **đứng sau quầy, cầm điện thoại bằng một tay**, vừa pha chế vừa tạo đơn hàng.
- **Mỗi đơn có từ một đến vài món**, mỗi món từ 1 đến vài chục ly; thường có giảm giá theo phần trăm cho khách quen. Giá món từ 100.000đ (Neat, Mocktail) đến 800.000đ (Bình Zax).
- **Một quán, tối đa khoảng 5 điện thoại** dùng cùng lúc. Nhân viên dùng chung một tài khoản, đăng nhập bằng PIN quán 6 số.
- **App cần mạng.** Khi mất mạng, nhân viên không tạo được đơn và màn hình báo rõ điều đó.
- **App được cài ra màn hình chính** (web app có manifest) trên Chrome Android hoặc Safari iOS.

## Capabilities and Constraints

Nguồn chuẩn là `docs/SRS.md`. Thuật ngữ nằm trong `GLOSSARY.md`.

- **Nhân viên:** chạm món để thêm vào giỏ đơn, sửa số lượng, giảm giá theo phần trăm cho cả đơn; bắt buộc chọn chỗ ngồi hoặc "Mang về"; hoàn tác hoặc hủy đơn trong 5 phút.
- **Chủ quán:** quản lý thực đơn ở trang Thực đơn (có lịch sử đổi giá theo món), danh sách chỗ ngồi, giờ mở cửa và PIN quán; xem doanh thu, số món, số đơn theo ngày, tuần, tháng; xem lịch sử đơn hàng (mở xem từng dòng đơn) và xuất CSV.
- **Giao diện chỉ dùng tiếng Việt.** Tiền hiển thị dạng `25.000đ`, giờ theo giờ Việt Nam.

## Brand Commitments

- **Tên quán: Nước Nôi** (viết hoa trong logo: "NƯỚC NÔI").
- **Logo:** `docs/nuoc-noi.jpg`, kích thước 2000×2000.
  - **Chữ chính:** chữ vẽ tay, nét dày, hơi méo. Có ba hình vẽ lồng vào chữ:
    - Móc của chữ "Ơ" là một điếu thuốc đang bốc khói.
    - Chữ "Ô" trong "NÔI" là một ly cocktail, dấu mũ phía trên là đôi môi.
    - Chữ "I" là một chiếc bật lửa.
  - **Chữ phụ:** dòng "NƯỚC NÔI" cỡ nhỏ, nét hình học kiểu art deco.
- **Logo là hình vẽ tay, không phải font chữ.** Luôn dùng file logo gốc; không vẽ lại logo bằng CSS hay bằng một font gần giống.
- **Màu đo được trên logo** (chỉ là ghi nhận, việc dùng chúng trong app do hướng thiết kế quyết định):
  - Nền xanh ô liu: khoảng `#40452F` đến `#424C3D`, tối dần về góc còn khoảng `#1D2218`.
  - Chữ màu kem: khoảng `#FCEDCC`.
  - Nền có lớp nhiễu hạt và một vệt sáng ngang, như vệt chuyển động.
- **Không khí:** quán bar tối, nhiều khói, mang màu retro và hơi tinh nghịch.

## Evidence on Hand

- **Logo quán:** `docs/nuoc-noi.jpg` (file gốc).
- **Chữ logo nền trong suốt** (tách từ file gốc, chữ màu kem):
  - `docs/brand/nuoc-noi-wordmark.png`: chữ chính, 1220×1150.
  - `docs/brand/nuoc-noi-wordmark-small.png`: chữ phụ kiểu art deco, 330×90.
- **Chưa có:** dữ liệu bán hàng thật, ảnh không gian quán. Không được bịa số liệu, lời khen hay ảnh quán.

## Product Principles

1. **Một tay, vài giây.** Mọi thao tác thường gặp trên màn hình order đều làm được bằng ngón cái, trong vài lần chạm.
2. **Không bấm nhầm.** Lúc quán đông, hành động phá hủy hoặc tốn tiền phải khó chạm trúng do vô tình, và luôn có đường lui.
3. **Số tiền không bao giờ mơ hồ.** Thành tiền luôn là con số dễ đọc nhất trên màn order; giá từng món và số tiền giảm luôn thấy được. Khi giá món thay đổi, người dùng phải thấy ngay.
4. **Hợp với phòng tối.** Màn hình không làm chói mắt người dùng hay làm phiền khách trong phòng tối.

## Accessibility & Inclusion

- Đáp ứng WCAG 2.2 AA về độ tương phản và kích thước vùng chạm, trong điều kiện **thiếu sáng**.
- Mọi điều khiển đều bấm được bằng một tay trên điện thoại.
