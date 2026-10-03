---
paths:
  - "supabase/**"
---

# Quy tắc database

Đối chiếu SRS §2.1, §4 và NFR-05 trước khi sửa bất kỳ file nào ở đây.

- **Tiền là số nguyên VND.** Mọi cột và tham số tiền dùng kiểu `integer`. Server tính `unit_price` và `total_amount`.
- **Quy tắc nghiệp vụ nằm trong hàm Postgres `SECURITY DEFINER` có `set search_path`.** Mỗi hàm mở đầu bằng một bước kiểm tra quyền:
  - `is_staff()` cho thao tác của nhân viên.
  - `is_owner()` cho thao tác của chủ quán.

  Nếu không đạt thì `raise exception` với một mã lỗi có trong hợp đồng của kế hoạch (`FORBIDDEN`, …).
- **Phân quyền thực thi:** mỗi RPC mới `revoke execute … from public, anon` rồi `grant execute … to authenticated`.
- **Không bao giờ xóa cứng đơn hàng hay bàn.** Đơn hàng dùng `status = 'cancelled'`, bàn dùng `is_archived = true`.
- **Không sửa migration đã có.** Mọi thay đổi schema đi vào một migration mới, tên có timestamp lớn hơn migration cuối cùng.
- **Mỗi RPC mới hoặc RPC bị sửa đều có test pgTAP** trong `supabase/tests/`. Test bao phủ đủ ba trường hợp:
  - Người được phép gọi.
  - Người không được phép gọi.
  - Ít nhất một đầu vào sai.

  Chạy `npx supabase db reset && npx supabase test db` cho tới khi tất cả đều xanh.
