# Software Requirements Specification (SRS)

## Hệ thống Quản lý Quán Nước Đồng Giá

| | |
|---|---|
| **Phiên bản** | 1.7 |
| **Tác giả** | Chủ quán / Developer |
| **Ngày cập nhật** | 2026-10-04 |
| **Thuật ngữ** | Xem [GLOSSARY.md](../GLOSSARY.md). Mọi thuật ngữ in đậm trong tài liệu này đều được định nghĩa ở đó. |
| **Thay đổi ở v1.7** | Quy định câu báo lỗi khi các trang chủ quán không tải được dữ liệu (R23). |
| **Thay đổi ở v1.6** | Đơn giá chung tối đa 500.000đ, để thành tiền không vượt giới hạn số nguyên (R21). Một tài khoản chủ quán và cách hiện người đổi giá; xác nhận hai bước khi ẩn chỗ ngồi và đổi PIN quán (R22). |
| **Thay đổi ở v1.5** | Quy định câu báo lỗi khi chủ quán đăng nhập, mật khẩu chủ quán tối thiểu 8 ký tự, và trường hợp không kiểm tra được quyền chủ quán (R20). |
| **Thay đổi ở v1.4** | Hủy đơn thất bại vì lỗi mạng: giữ nút Hoàn tác và báo lỗi (R17). Quy định khi nào thông báo trên màn hình order được ẩn (R18). Có mạng trở lại thì tải lại chỗ ngồi và đơn vừa tạo (R19). |
| **Thay đổi ở v1.3** | Thay "Bàn" bằng khái niệm chung **Chỗ ngồi**, gồm hai loại: **Bàn** và **Ghế quầy** (R14). Giờ mở cửa mặc định là 20, vì quán mở từ 20:00 đến 02:00 (R15). |
| **Thay đổi ở v1.2** | Rút gọn phạm vi: bỏ chế độ offline và service worker; nhân viên dùng một tài khoản chung với **PIN quán** là mật khẩu; bỏ quản lý từng thiết bị; nhân viên được hủy bất kỳ đơn nào trong **cửa sổ hủy**; bỏ biểu đồ; bỏ E2E. Xem [Phụ lục A](#phụ-lục-a--nhật-ký-quyết-định). |

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu này mô tả yêu cầu cho phần mềm quản lý quán nước bán **đồng giá**: mọi **cốc** có cùng một **đơn giá chung**. Hệ thống được thiết kế tối giản, để **nhân viên** tạo **đơn hàng** nhanh và **chủ quán** theo dõi **doanh thu**.

### 1.2. Người dùng

| Vai trò | Thiết bị | Mục đích |
|---|---|---|
| **Nhân viên** | Điện thoại | Tạo đơn hàng; hủy đơn bấm nhầm trong cửa sổ hủy |
| **Chủ quán** | Máy tính / tablet / điện thoại | Đặt giá, chỗ ngồi, giờ mở cửa, PIN quán; xem báo cáo; hủy đơn; cũng tạo được đơn hàng |

### 1.3. Phạm vi

**Trong phạm vi:**
- Tạo đơn hàng và hủy đơn.
- Cấu hình đơn giá chung (kèm lịch sử đổi giá), danh sách chỗ ngồi, giờ mở cửa và PIN quán.
- Thống kê doanh thu hôm nay và tháng này.
- Lịch sử đơn hàng và xuất CSV.

**Ngoài phạm vi:**
- Chế độ offline. Khi mất mạng thì không tạo được đơn.
- Hình thức thanh toán.
- Sửa đơn đã tạo.
- Nhiều chi nhánh.
- Tài khoản riêng cho từng nhân viên.
- Danh sách thiết bị và thu hồi từng thiết bị.
- Biểu đồ.
- Thực đơn nhiều món, quản lý kho, in hóa đơn.
- Đa ngôn ngữ (giao diện chỉ có tiếng Việt).

---

## 2. Tổng quan

### 2.1. Kiến trúc

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS. Có web app manifest để cài app ra màn hình chính. **Không có service worker.** |
| Backend | Supabase: Postgres, RPC, Realtime, Auth |
| Hosting | Vercel và Supabase, đều dùng gói miễn phí |

Mọi quy tắc nghiệp vụ liên quan đến **tiền, quyền và thời gian** chạy ở server, trong các hàm Postgres. Client chỉ hiển thị kết quả và gửi yêu cầu lên server.

Quy mô thiết kế: 1 cơ sở, tối đa khoảng 5 điện thoại dùng cùng lúc.

### 2.2. Phân quyền

| Vai trò | Cách đăng nhập | Được truy cập |
|---|---|---|
| **Nhân viên** | Nhập **PIN quán** (6 số). Hệ thống dùng PIN làm mật khẩu của **một tài khoản nhân viên chung**. | `/order` |
| **Chủ quán** | Email + mật khẩu (tài khoản riêng) | `/order`, `/admin/*` |

- Không có chức năng tự đăng ký. Tài khoản được tạo bằng script khi cài đặt.
- Phân quyền được kiểm tra ở server. Mỗi lần kiểm tra quyền, server còn xác nhận **phiên đăng nhập vẫn còn tồn tại**, nên phiên bị thu hồi thì mất quyền ngay lập tức.

---

## 3. Yêu cầu chức năng

### 3.1. Đăng nhập

**FR-00a: Nhân viên đăng nhập bằng PIN quán**
- Màn hình `/login` có bàn phím số để nhập PIN quán 6 số.
- PIN đúng thì vào `/order` và **giữ đăng nhập** cho đến khi PIN quán bị đổi.
- PIN sai thì báo "Sai mã PIN.".
- Khi bị giới hạn do nhập sai nhiều lần (theo giới hạn đăng nhập của Supabase Auth) thì báo "Nhập sai quá nhiều lần, thử lại sau ít phút.".
- Chưa đăng nhập mà vào `/order` thì bị chuyển sang `/login`.

**FR-00b: Chủ quán đăng nhập**
- `/admin/login` dùng email + mật khẩu. Mật khẩu chủ quán dài ít nhất 8 ký tự (script tạo tài khoản kiểm tra).
- Báo lỗi khi đăng nhập:
  - Sai email hoặc mật khẩu: "Sai email hoặc mật khẩu.".
  - Bị giới hạn do nhập sai nhiều lần: "Nhập sai quá nhiều lần, thử lại sau ít phút.".
  - Lỗi khác (mất mạng): "Không kết nối được. Kiểm tra mạng rồi thử lại.".
- Chưa đăng nhập hoặc không phải chủ quán mà vào `/admin/*` thì bị chặn:
  - Chưa đăng nhập: chuyển sang `/admin/login`.
  - Đã đăng nhập nhưng không phải chủ quán: báo "Tài khoản này không phải tài khoản chủ quán." kèm nút Đăng xuất.
  - Không kiểm tra được quyền (lỗi mạng hoặc server): vẫn chặn, báo "Không kiểm tra được quyền truy cập. Tải lại trang.".
- Chủ quán đã đăng nhập mà vào `/admin/login` thì chuyển sang `/admin/dashboard`. Tài khoản khác (ví dụ điện thoại đang đăng nhập bằng PIN quán) vẫn thấy form đăng nhập; chủ quán đăng nhập trên máy đó thì thay phiên của nhân viên.

### 3.2. Màn hình order (nhân viên)

**FR-01: Nhập số lượng**
- Các nút **+1, +2, +5, +10** cộng dồn vào số lượng.
- Nút **−1** (không cho xuống dưới 0) và nút **Xóa** (đưa về 0).
- Có ô nhập số lượng trực tiếp bằng bàn phím số.
- Số lượng hợp lệ là số nguyên từ 1 đến 500.

**FR-02: Hiển thị đơn giá chung**
- Luôn hiển thị dòng "Đơn giá: 25.000đ/cốc".
- Đơn giá được cập nhật realtime. Khi đơn giá đổi, ô đơn giá được làm nổi bật khoảng 3 giây và thành tiền được tính lại ngay.

**FR-03: Thành tiền**
- Thành tiền = số lượng × đơn giá chung. Số tiền này hiển thị cỡ lớn ngay trên nút "Xác nhận đơn".

**FR-03b: Chọn chỗ ngồi**
- Hiển thị các **chỗ ngồi** chưa bị ẩn, chia thành hai nhóm: **Ghế quầy** và **Bàn**. Có thêm nút cố định **"Mang về"**.
- Mỗi nhóm được sắp theo `sort_order`. Ghế quầy được xếp sao cho giống thứ tự ghế ngoài quầy thật.
- Không bắt buộc chọn. Bấm lại vào lựa chọn đang chọn thì bỏ chọn.

**FR-04: Gửi đơn hàng**
- Nút "Xác nhận đơn" bị khóa khi số lượng bằng 0, khi chưa tải được giá, hoặc khi mất mạng.
- Khi mất mạng, màn hình hiện thông báo "Mất mạng – chưa gửi được đơn".
- Có mạng trở lại thì màn hình tải lại danh sách chỗ ngồi và đơn vừa tạo.
- **Server quyết định đơn giá của đơn**:
  - Client gửi lên `id` (UUID do client sinh), số lượng, chỗ ngồi hoặc mang về, và giá đang hiển thị.
  - Server dùng **đơn giá chung hiện hành**. Nếu giá này khác giá client gửi, server báo lại để màn hình hiện "Giá đã đổi: đơn được tính X đ/cốc, thành tiền Y đ.".
- Gửi lại cùng một `id` thì **không tạo đơn thứ hai**. Trường hợp này xảy ra khi mạng chập chờn và nhân viên bấm gửi lại.
- **Gửi thành công:**
  - Điện thoại rung ngắn (trên trình duyệt có hỗ trợ, ví dụ Chrome Android).
  - Giao diện reset (số lượng về 0, bỏ chọn chỗ ngồi).
  - Hiện thông báo "Đã tạo đơn N cốc – X đ" kèm nút **"Hoàn tác"** trong 5 giây.
- **Gửi thất bại vì lỗi mạng:**
  - Giữ nguyên số lượng và chỗ ngồi đã chọn, rồi báo lỗi.
  - Lần bấm lại dùng **cùng `id`** đơn.
- **Thông báo trên màn hình order:** thông báo lỗi và thông báo thông tin hiện ở hai ô riêng.
  - Thông báo lỗi ẩn khi nhân viên bắt đầu đơn mới (đổi số lượng hoặc chỗ ngồi).
  - Thông báo "Giá đã đổi" và thông báo đơn đã được ghi từ lần gửi trước giữ nguyên đến lần gửi đơn thành công tiếp theo hoặc lần hủy đơn thành công tiếp theo. Gửi hoặc hủy thất bại không làm mất chúng.

**FR-04b: Đơn vừa tạo và hủy đơn**
- Màn hình order liệt kê các đơn hàng **do chính điện thoại này tạo** trong ngày kinh doanh hiện tại. Mỗi điện thoại tự nhớ danh sách đơn của mình.
- Đơn còn trong **cửa sổ hủy** (5 phút kể từ lúc tạo) thì có nút "Hủy". Nút "Hoàn tác" cũng dùng chính chức năng hủy này.
- **Quy tắc hủy (server kiểm tra):**
  - Nhân viên được hủy **bất kỳ đơn nào** còn trong cửa sổ hủy.
  - Chủ quán được hủy bất kỳ đơn nào, vào bất kỳ lúc nào.
  - Hủy đơn đã hủy thì không báo lỗi.
- **Đang hủy:** bấm "Hoàn tác" hoặc "Hủy" thì nút vừa bấm hiện "Đang hủy…". Mọi nút hủy trên màn hình bị khóa cho tới khi server trả lời; mỗi lần chỉ hủy một đơn.
- **Hủy thất bại vì lỗi mạng:** giữ nút "Hoàn tác" (vẫn ẩn sau 5 giây) và hiện "Chưa hủy được – kiểm tra mạng rồi thử lại.". Hủy thành công thì thông báo này biến mất; các lỗi khác (ví dụ lỗi gửi đơn) vẫn giữ.
- Hủy là đánh dấu **đã hủy**, ghi lại thời điểm và người hủy. Đơn không bao giờ bị xóa.

### 3.3. Cài đặt (chủ quán), `/admin/settings`

- Không tải được cài đặt thì báo "Không tải được cài đặt. Kiểm tra mạng rồi tải lại trang.".

**FR-05: Đơn giá chung**
- Có ô nhập số tiền (số nguyên VND, từ 1đ đến 500.000đ) và nút "Lưu thay đổi". Server từ chối giá ngoài khoảng này.
- Giá mới áp dụng cho các đơn tạo sau thời điểm lưu. Đơn cũ giữ nguyên đơn giá của đơn.

**FR-05a: Lịch sử đổi giá**
- Hiển thị 20 lần đổi giá gần nhất, gồm mức giá, thời điểm và người đổi.
- Quán có **một** tài khoản chủ quán. Người đổi hiện bằng email của chủ quán đang đăng nhập; lần đổi của tài khoản chủ quán khác (nếu có) hiện "Chủ quán khác"; giá ban đầu lúc khởi tạo hệ thống hiện "Khởi tạo".

**FR-05b: Giờ mở cửa**
- Chọn từ 0 đến 23 giờ, mặc định 20:00 (quán mở từ 20:00 đến 02:00 sáng hôm sau).
- Chỉ áp dụng cho đơn mới; ngày kinh doanh của đơn cũ không đổi.
- Bên cạnh có ghi chú "Nên đổi khi quán đã đóng cửa".

**FR-05c: Chỗ ngồi**
- Chủ quán thêm chỗ ngồi (chọn loại **Bàn** hoặc **Ghế quầy**), đổi tên, sắp xếp thứ tự trong từng loại, ẩn và hiện lại chỗ ngồi đã ẩn.
- Ẩn chỗ ngồi cần xác nhận hai bước: bấm "Ẩn" thì nút đổi thành "Chắc chắn ẩn?" trong vài giây.
- Chỗ ngồi không bao giờ bị xóa hẳn.
- Mỗi đơn lưu **tên chỗ ngồi tại thời điểm tạo**, nên đổi tên chỗ ngồi không làm thay đổi đơn cũ.

**FR-05d: PIN quán**
- Chủ quán nhập PIN mới (6 số, nhập 2 lần) để đổi. Cần xác nhận hai bước: bấm "Đổi PIN quán" thì nút đổi thành "Chắc chắn đổi PIN?" trong vài giây.
- Đổi PIN thì **mọi điện thoại của nhân viên bị đăng xuất ngay**: lần thao tác tiếp theo bị từ chối, và màn hình quay về `/login`.

### 3.4. Báo cáo (chủ quán)

Doanh thu và số cốc **chỉ tính đơn đã thanh toán**.

**FR-06: Tổng quan, `/admin/dashboard`**
- Doanh thu và số cốc của ngày kinh doanh hiện tại.
- Doanh thu của tháng này: các ngày kinh doanh thuộc tháng dương lịch hiện tại, tính đến hôm nay.
- Tự tải lại mỗi 60 giây.
- Không tải được số liệu thì báo "Không tải được số liệu. Kiểm tra mạng; trang sẽ tự thử lại sau 60 giây." và vẫn tự thử lại.

**FR-07: Lịch sử đơn hàng, `/admin/history`**
- **Cột:** Thời gian (giờ VN), Chỗ ngồi, Số cốc, Đơn giá, Thành tiền, Trạng thái.
- **Lọc:** theo khoảng **Từ ngày – Đến ngày**, tính theo ngày kinh doanh.
  - Mặc định là hôm nay.
  - Ngày không hợp lệ thì thay bằng hôm nay.
  - "Từ ngày" lớn hơn "Đến ngày" thì tự đảo lại.
- **Đơn đã hủy:** vẫn hiện, có gạch ngang, nhưng không tính vào dòng tổng.
- **Dòng tổng** của khoảng đang lọc: số đơn, số cốc, doanh thu.
- **Phân trang:** 50 đơn mỗi trang.
- **Lỗi khi tải** (đều kèm "Kiểm tra mạng rồi tải lại trang."):
  - Không xác định được ngày kinh doanh hiện tại: "Không tải được lịch sử đơn hàng.", không hiện bảng.
  - Không tải được danh sách đơn: "Không tải được danh sách đơn.".
  - Không tải được dòng tổng: ẩn dòng tổng, báo "Không tải được dòng tổng.".
- **Hủy đơn:** chủ quán hủy được đơn ngay từ trang này, có bước xác nhận.

**FR-07a: Xuất CSV**
- Xuất toàn bộ đơn trong khoảng đang lọc, mã hóa UTF-8 có BOM, xuống dòng bằng CRLF.
- 7 cột: `Thời gian, Ngày kinh doanh, Chỗ ngồi, Số cốc, Đơn giá, Thành tiền, Trạng thái`.
- Ô văn bản bắt đầu bằng `= + - @` được thêm dấu `'` ở đầu, để Excel không hiểu nhầm là công thức.
- Tên file: `don-hang_<từ>_<đến>.csv`.

---

## 4. Dữ liệu

**Quy ước:**
- Tiền là **số nguyên VND**.
- Thời điểm lưu theo UTC, hiển thị theo `Asia/Ho_Chi_Minh`.

| Bảng | Nội dung chính |
|---|---|
| `settings` | Một dòng duy nhất: `current_price`, `business_day_start_hour`, `updated_at` |
| `price_history` | `price`, `effective_from`, `changed_by` |
| `seats` | `name`, `kind` (`table` = Bàn, `counter` = Ghế quầy), `sort_order`, `is_archived` |
| `app_roles` | `user_id`, `role` (`owner` hoặc `staff`). Chỉ có **một** tài khoản `staff`. |
| `orders` | `id` (do client sinh), `quantity` (1–500), `unit_price`, `total_amount` (cột tự tính = `quantity × unit_price`), `seat_id`, `seat_name`, `is_takeaway`, `status` (`paid`/`cancelled`), `created_by`, `created_at`, `business_date`, `cancelled_at`, `cancelled_by` |

**Quy tắc tính `business_date`:** lấy giờ Việt Nam của thời điểm tạo đơn, lùi lại `business_day_start_hour` giờ, rồi lấy phần ngày. Giá trị này được tính một lần lúc tạo đơn và lưu vào đơn.

---

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu |
|---|---|
| NFR-01 | Mỗi lần bấm nút trên `/order` có phản hồi trên giao diện dưới 200ms. Trong lúc gửi đơn, nút hiện trạng thái "Đang gửi…". |
| NFR-02 | Mobile-first. Nút chính cao ít nhất 56px. Số lượng và thành tiền hiển thị cỡ lớn. |
| NFR-04 | Mọi kiểm tra quyền chạy ở server. Không có chức năng tự đăng ký. Không bao giờ đưa service_role key lên Vercel. |
| NFR-05 | Tiền là số nguyên. Server tính đơn giá và thành tiền. Không bao giờ xóa cứng đơn hàng hoặc chỗ ngồi. |
| NFR-06 | Giao diện tiếng Việt, tiền định dạng `25.000đ`, giờ Việt Nam. |
| NFR-07 | Chạy trên Chrome Android và Safari iOS bản mới nhất. Cài được ra màn hình chính. |

---

## 6. Vận hành

- **Cài đặt ban đầu:**
  - Tạo project Supabase và chạy migration.
  - Tạo tài khoản chủ quán và tài khoản nhân viên bằng script.
  - Đặt giá, giờ mở cửa và chỗ ngồi.
  - Deploy lên Vercel.
- **Nghỉ hơn 7 ngày:** Supabase gói miễn phí tạm dừng database. Vào trang Supabase bấm **Restore** để chạy lại.
- **Sao lưu:** xuất CSV hằng tháng.

---

## Phụ lục A – Nhật ký quyết định

| # | Chủ đề | Quyết định |
|---|---|---|
| Q1 (v1.1) | Vòng đời đơn | Thu tiền ngay khi tạo đơn. Có trạng thái `cancelled`. |
| Q4 | Nguồn đơn giá | Server quyết định đơn giá của đơn |
| Q5 | Kiểu tiền | Số nguyên VND |
| Q8 | Nút số lượng | Cộng dồn, có −1 và Xóa |
| Q9 | Hình thức thanh toán | Không có trong app |
| Q10 | Quy mô | 1 cơ sở, tối đa khoảng 5 điện thoại |
| Q11 | Chỉnh giá | Chỉ đổi đơn giá chung. Đơn sai thì hủy rồi tạo lại. |
| Q12, Q26 | Ngày kinh doanh | Theo giờ mở cửa cấu hình được. Lưu sẵn trong từng đơn. |
| Q15 | Backend | Supabase |
| Q17 | Báo cáo | Hôm nay, tổng tháng, lịch sử, CSV |
| Q18, Q19 | Bàn | Danh sách cố định, ẩn thay vì xóa, lưu tên bàn trong đơn, có "Mang về", không bắt buộc chọn |
| Q20, Q21 | Đơn hủy, CSV | Đơn hủy vẫn hiện trong lịch sử và CSV, không tính doanh thu. CSV có BOM và 7 cột. |
| Q22 | Lịch sử giá | Hiện trong trang Cài đặt |
| Q24 | Xác nhận đơn | Bấm một lần, có nút "Hoàn tác" |
| Q27 | Tài khoản | Tạo sẵn, tắt tự đăng ký |
| Q28 | Giá đổi khi đang nhập | Tính lại ngay và làm nổi bật ô đơn giá |
| R1 (v1.2) | Offline | **Bỏ.** Mất mạng thì khóa nút Xác nhận và báo cho nhân viên. |
| R2 (v1.2) | Nhân viên đăng nhập | Một tài khoản nhân viên chung, PIN quán là mật khẩu |
| R3 (v1.2) | Quyền hủy đơn | Nhân viên hủy được bất kỳ đơn nào trong 5 phút; chủ quán hủy được mọi lúc |
| R6 (v1.2) | Báo cáo | Bỏ biểu đồ |
| R7 (v1.2) | Kiểm thử | pgTAP + Vitest, cộng danh sách kiểm tra tay. Không có E2E. |
| R9 (v1.2) | Đơn vừa tạo | Chỉ hiện đơn do chính điện thoại đó tạo |
| R10 (v1.2) | Đổi PIN | Đổi trong trang Cài đặt |
| R11 (v1.2) | Lịch sử giá | Giữ |
| R14 (v1.3) | Chỗ ngồi | Khái niệm chung **Chỗ ngồi**, gồm hai loại: **Bàn** (3) và **Ghế quầy** (12). Màn hình order chia hai nhóm. Bảng `seats` thay cho bảng `tables`. Ghi đúng số ghế quầy vào đơn hàng. |
| R16 (v1.3) | Phản hồi khi gửi đơn | Rung ngắn khi gửi thành công. Thông báo "Đã tạo đơn" kèm nút Hoàn tác hiện ngay trên thanh Xác nhận (theo `docs/design/order-brief.md`). |
| R15 (v1.3) | Giờ mở cửa | Mặc định là 20. Ca 20:00–02:00 thuộc một ngày kinh doanh, mang ngày của buổi tối. |
| R13 (v1.2) | Thu hồi phiên | Có hiệu lực ngay: mỗi lần kiểm tra quyền đều xác nhận phiên đăng nhập còn tồn tại |
| R17 (v1.4) | Hủy thất bại vì lỗi mạng | Mọi nút hủy khóa, nút vừa bấm hiện "Đang hủy…" khi đang chờ server. Lỗi mạng thì giữ nút Hoàn tác và báo "Chưa hủy được – kiểm tra mạng rồi thử lại." |
| R18 (v1.4) | Ẩn thông báo trên màn hình order | Thông báo lỗi ẩn khi bắt đầu đơn mới. "Giá đã đổi" và đơn trùng ở ô riêng, giữ đến lần gửi thành công hoặc hủy thành công tiếp theo. Trong các thông báo lỗi, hủy thành công chỉ xóa "Chưa hủy được". |
| R19 (v1.4) | Có mạng trở lại | Tải lại chỗ ngồi và đơn vừa tạo. Lúc mất mạng thì không tải. |
| R20 (v1.5) | Đăng nhập chủ quán | Ba câu báo lỗi giống cách FR-00a làm cho nhân viên. Mật khẩu chủ quán ≥ 8 ký tự. Lỗi khi kiểm tra quyền thì báo riêng, không báo nhầm là không phải chủ quán. Chỉ chủ quán mới bị chuyển khỏi `/admin/login`. |
| R21 (v1.6) | Đơn giá chung tối đa | 500.000đ. Giá thật khoảng 200.000đ/cốc; giới hạn chặn gõ thừa số 0 và giữ thành tiền (tối đa 500 cốc) trong giới hạn số nguyên. Server kiểm tra. |
| R22 (v1.6) | Lịch sử đổi giá, xác nhận | Một tài khoản chủ quán; người đổi hiện email, "Chủ quán khác" hoặc "Khởi tạo". Ẩn chỗ ngồi và đổi PIN quán cần xác nhận hai bước (theo `ui-craft.md`). |
| R23 (v1.7) | Lỗi tải trang chủ quán | Mỗi trang (Tổng quan, Lịch sử đơn hàng, Cài đặt) có câu báo lỗi riêng nêu vấn đề và cách khắc phục; Tổng quan tự thử lại sau 60 giây. |
