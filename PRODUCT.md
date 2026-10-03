# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Nhân viên:** người trẻ, rành điện thoại. Họ tạo đơn hàng trên điện thoại của mình và **thường bấm bằng một tay**, vì tay kia đang cầm cốc, khay hoặc tiền thối. Lúc quán đông, họ cần ghi xong một đơn trong vài giây rồi quay lại phục vụ.
- **Chủ quán:** đặt đơn giá chung, bàn, giờ mở cửa và PIN quán; xem doanh thu; hủy đơn sai. Dùng máy tính, tablet hoặc điện thoại. Chủ quán cũng có thể tạo đơn.

## Product Purpose

Ghi nhận nhanh số cốc bán ra và doanh thu của một quán nước **đồng giá**, nơi mọi cốc có cùng một giá. Thành công nghĩa là:
- Nhân viên ghi đơn mà gần như không phải nghĩ.
- Không có đơn bị sai giá, ghi trùng hoặc mất.
- Chủ quán biết chính xác doanh thu ngày và tháng.

## Positioning

Vì mọi cốc cùng một giá, cả quy trình gọi món chỉ còn lại **số lượng cốc** và (không bắt buộc) **bàn**. Không có thực đơn, không có biến thể món. Ứng dụng tận dụng điều đó để ghi một đơn chỉ bằng vài lần chạm. Các app POS có thực đơn thì không làm gọn được như vậy.

## Operating Context

- **Quán chỉ mở buổi tối, từ 20:00 đến 02:00 sáng hôm sau.** Mọi đơn hàng đều được tạo vào ban đêm.
- **Quán là phòng tối, có quầy bar:** 12 ghế quầy và 3 bàn. Nhân viên **đứng sau quầy, cầm điện thoại bằng một tay**, vừa pha chế vừa tạo đơn hàng.
- **Số cốc mỗi đơn rất đa dạng:** từ 1 cốc đến vài chục cốc.
- **Một quán, tối đa khoảng 5 điện thoại** dùng cùng lúc. Nhân viên dùng chung một tài khoản, đăng nhập bằng PIN quán 6 số.
- **App cần mạng.** Khi mất mạng, nhân viên không tạo được đơn và màn hình báo rõ điều đó.
- **App được cài ra màn hình chính** (web app có manifest) trên Chrome Android hoặc Safari iOS.

## Capabilities and Constraints

Nguồn chuẩn là `docs/SRS.md`. Thuật ngữ nằm trong `GLOSSARY.md`.

- **Nhân viên:** tạo đơn hàng bằng các nút cộng dồn số lượng; chọn bàn hoặc "Mang về"; hoàn tác hoặc hủy đơn trong 5 phút.
- **Chủ quán:** đặt đơn giá chung (có lịch sử đổi giá), danh sách bàn, giờ mở cửa và PIN quán; xem doanh thu hôm nay và tháng này; xem lịch sử đơn hàng và xuất CSV.
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
3. **Số tiền không bao giờ mơ hồ.** Đơn giá và thành tiền luôn hiển thị rõ. Khi giá thay đổi, người dùng phải thấy ngay.
4. **Hợp với phòng tối.** Màn hình không làm chói mắt người dùng hay làm phiền khách trong phòng tối.

## Accessibility & Inclusion

- Đáp ứng WCAG 2.2 AA về độ tương phản và kích thước vùng chạm, trong điều kiện **thiếu sáng**.
- Mọi điều khiển đều bấm được bằng một tay trên điện thoại.
