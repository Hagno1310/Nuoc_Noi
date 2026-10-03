# POS Quán Nước Đồng Giá

## Nguồn chuẩn

`docs/SRS.md` là **nguồn chuẩn** cho mọi hành vi của sản phẩm. Trước khi thiết kế, viết code, review, hoặc trả lời câu hỏi "app hoạt động thế nào", đọc mục SRS liên quan.

Khi các nguồn nói khác nhau, thứ tự ưu tiên là:

> `docs/SRS.md` → `GLOSSARY.md` → kế hoạch trong `docs/superpowers/plans/` → code hiện có

Về giao diện (màu, font, khoảng cách, icon), thứ tự là `PRODUCT.md` → `DESIGN.md` → `.claude/rules/ui-craft.md`. Cả ba đứng trên code mẫu trong kế hoạch.

## Khi gặp chỗ lệch SRS

Một yêu cầu, một bước trong kế hoạch hoặc một đoạn code có thể mâu thuẫn với SRS, hoặc chạm vào chỗ SRS chưa nói tới. Gặp trường hợp đó thì:
1. Dừng lại.
2. Trích mã mục SRS liên quan (ví dụ `FR-04b`, `NFR-05`).
3. Nêu rõ chỗ lệch.
4. Hỏi người dùng muốn theo hướng nào.

Chỉ làm tiếp khi người dùng đã chọn.

Khi người dùng đổi yêu cầu, sửa theo thứ tự sau:
1. **SRS:** tăng số phiên bản và thêm một dòng vào Phụ lục A.
2. **`GLOSSARY.md`:** nếu có thuật ngữ mới hoặc nghĩa của thuật ngữ thay đổi.
3. **Code.**

## Phạm vi

Chỉ xây những gì nằm trong mục "Trong phạm vi" của SRS §1.3. Mọi thứ thuộc "Ngoài phạm vi" chỉ được làm sau khi SRS đã được cập nhật để đưa nó vào phạm vi.

## Thuật ngữ

Dùng đúng thuật ngữ trong `GLOSSARY.md` cho chữ trên giao diện, tên biến, tên hàm, commit message và câu trả lời. Đặt tên trong code bằng tên tiếng Anh ghi trong ngoặc của từng thuật ngữ. Những từ nằm trong `_Avoid_` thì thay bằng thuật ngữ chuẩn.

## Quy tắc theo vùng code

`.claude/rules/` chứa quy tắc riêng cho database, màn hình order, trang chủ quán, thiết kế giao diện và khóa bí mật. Mỗi file quy tắc chỉ được nạp khi đọc hoặc sửa file thuộc vùng của nó bằng Read, Edit hoặc Write. Vì vậy, sửa file trong `src/`, `supabase/` và `scripts/` bằng Edit hoặc Write.

## Bất biến

Các bất biến về tiền, quyền và dữ liệu nằm ở SRS §2.1, §4, NFR-04 và NFR-05. Đối chiếu với chúng trước mọi thay đổi trong `supabase/` hoặc trong code gọi RPC.

## Trước khi báo xong

Sau mọi thay đổi trong `src/` hoặc `supabase/`:
1. Giao cho subagent `srs-reviewer` kiểm tra thay đổi đó.
2. Sửa mọi chỗ lệch mà agent báo.
3. Chỉ báo xong hoặc commit sau khi kết quả kiểm tra là **khớp SRS**.
