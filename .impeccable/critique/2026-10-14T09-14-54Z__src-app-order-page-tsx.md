---
target: màn order
total_score: 28
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:E:\\Work\\POS_Nuoc_Noi\\src\\app\\order\\page.tsx"
target_fingerprint: "sha256:6a56c6cedc1800b4b87434c0725ae4bec51947df7b30b410b8cd99420a5dcfe8"
target_path: "E:\\Work\\POS_Nuoc_Noi\\src\\app\\order\\page.tsx"
timestamp: 2026-10-14T09-14-54Z
slug: src-app-order-page-tsx
---
# Critique /order — 28/40
Method: dual-agent. Detector CLI 0 findings; overlay skipped (Chrome ERR_CONNECTION_REFUSED to localhost:3000).
Scores: 1:3 2:3 3:3 4:2 5:3 6:3 7:2 8:3 9:3 10:3
P0 Xác nhận đơn + tên ghế nằm dưới nếp gấp tấm giỏ (cả dialog cuộn) — CartSheet.tsx:21-23, CartPanel.tsx:95-125. Fix: footer dính đáy, thân cuộn; đưa ghế lên trước giảm giá.
P1 Tấm thanh toán ngược vùng ngón cái: Tiền mặt/Chuyển khoản ở đỉnh, Quay lại ở đáy; Tiền mặt (gửi thật) là nút viền; tên ghế chữ tro nhỏ — PaymentSheet.tsx:114-139.
P1 Flare dùng linear-gradient — globals.css:125. Fix: khối ember đặc chạy translateX.
P2 Sửa chạm nhầm +1 tốn 3 chạm (cần SRS) — MenuBoard.tsx:48-53.
P2 Lệch hệ: rounded-2xl (CartBar:9, ConfirmBar:37,62, PaymentSheet:99-101), opacity-60 ghế (SeatPicker:36), bg-warn/15 cả dòng (CartPanel:151), DESIGN.md token cũ.
Minor: giảm giá 5 lựa chọn; banner mất mạng không dính; panel desktop sticky không max-h (OrderScreen:328); FR-03b "Đang chọn:" lệch.
