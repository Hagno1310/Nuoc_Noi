# Software Requirements Specification (SRS)

## Hệ thống Quản lý Quán Nước Nôi

| | |
|---|---|
| **Phiên bản** | 3.0 |
| **Tác giả** | Chủ quán / Developer |
| **Ngày cập nhật** | 2026-10-04 |
| **Thuật ngữ** | Xem [GLOSSARY.md](../GLOSSARY.md). Mọi thuật ngữ in đậm trong tài liệu này đều được định nghĩa ở đó. |
| **Thay đổi ở v3.0** | Bỏ đồng giá: **thực đơn** nhiều món do chủ quán quản lý ở trang Thực đơn, đơn hàng gồm các **dòng đơn**, **giảm giá** theo phần trăm cho cả đơn; bắt buộc chọn chỗ ngồi; thống kê theo **số món**; lịch sử mở xem dòng đơn; CSV 8 cột. Xóa dữ liệu thử một lần trước khi dùng thật (R32–R36). Thiết kế: `docs/superpowers/specs/2026-10-04-thuc-don-giam-gia-design.md`. |
| **Thay đổi ở v2.3** | Trang chủ quán hiện thông báo đơn mới ngay khi nhân viên tạo đơn và cập nhật số liệu, qua Realtime (R30). Đồng hồ giờ mở cửa có vệt mờ cho phần giờ chưa tới. Trên điện thoại, thanh điều hướng chỉ hiện icon và cỡ chữ gốc nhỏ hơn (R31). |
| **Thay đổi ở v2.2** | Gửi link app vào ứng dụng chat thì hiện ảnh xem trước theo thương hiệu (R29). |
| **Thay đổi ở v2.1** | Chủ quán mở màn hình order thì có liên kết quay lại trang chủ quán (R28). |
| **Thay đổi ở v2.0** | Thêm giờ đóng cửa (R26). Tổng quan theo dõi ngày kinh doanh, tuần và tháng, so với cùng đoạn kỳ trước, có hai biểu đồ doanh thu; đưa biểu đồ trở lại phạm vi (R27). |
| **Thay đổi ở v1.9** | Trạng thái trống của Đơn vừa tạo; Lịch sử đơn hàng dạng dòng hai tầng trên điện thoại (R25). |
| **Thay đổi ở v1.8** | Thành tiền hiển thị ngay dưới số cốc; nút ghế quầy chỉ hiện phần số (R24). |
| **Thay đổi ở v1.7** | Quy định câu báo lỗi khi các trang chủ quán không tải được dữ liệu (R23). |
| **Thay đổi ở v1.6** | Đơn giá chung tối đa 500.000đ, để thành tiền không vượt giới hạn số nguyên (R21). Một tài khoản chủ quán và cách hiện người đổi giá; xác nhận hai bước khi ẩn chỗ ngồi và đổi PIN quán (R22). |
| **Thay đổi ở v1.5** | Quy định câu báo lỗi khi chủ quán đăng nhập, mật khẩu chủ quán tối thiểu 8 ký tự, và trường hợp không kiểm tra được quyền chủ quán (R20). |
| **Thay đổi ở v1.4** | Hủy đơn thất bại vì lỗi mạng: giữ nút Hoàn tác và báo lỗi (R17). Quy định khi nào thông báo trên màn hình order được ẩn (R18). Có mạng trở lại thì tải lại chỗ ngồi và đơn vừa tạo (R19). |
| **Thay đổi ở v1.3** | Thay "Bàn" bằng khái niệm chung **Chỗ ngồi**, gồm hai loại: **Bàn** và **Ghế quầy** (R14). Giờ mở cửa mặc định là 20, vì quán mở từ 20:00 đến 02:00 (R15). |
| **Thay đổi ở v1.2** | Rút gọn phạm vi: bỏ chế độ offline và service worker; nhân viên dùng một tài khoản chung với **PIN quán** là mật khẩu; bỏ quản lý từng thiết bị; nhân viên được hủy bất kỳ đơn nào trong **cửa sổ hủy**; bỏ biểu đồ; bỏ E2E. Xem [Phụ lục A](#phụ-lục-a--nhật-ký-quyết-định). |

---

## 1. Giới thiệu

### 1.1. Mục đích

Tài liệu này mô tả yêu cầu cho phần mềm quản lý quán nước Nước Nôi. Quán bán theo **thực đơn**: mỗi **món** có giá riêng. Hệ thống được thiết kế tối giản, để **nhân viên** tạo **đơn hàng** nhanh và **chủ quán** theo dõi **doanh thu**.

### 1.2. Người dùng

| Vai trò | Thiết bị | Mục đích |
|---|---|---|
| **Nhân viên** | Điện thoại | Tạo đơn hàng; hủy đơn bấm nhầm trong cửa sổ hủy |
| **Chủ quán** | Máy tính / tablet / điện thoại | Quản lý thực đơn, chỗ ngồi, giờ mở cửa, PIN quán; xem báo cáo; hủy đơn; cũng tạo được đơn hàng |

### 1.3. Phạm vi

**Trong phạm vi:**
- Tạo đơn hàng gồm nhiều món, giảm giá theo phần trăm cho cả đơn, và hủy đơn.
- Quản lý thực đơn (kèm lịch sử đổi giá theo món), danh sách chỗ ngồi, giờ mở cửa, giờ đóng cửa và PIN quán.
- Thống kê doanh thu, số món và số đơn theo ngày kinh doanh, tuần và tháng, so với kỳ trước, kèm biểu đồ doanh thu theo ngày.
- Lịch sử đơn hàng và xuất CSV.
- Thông báo đơn mới trên trang chủ quán.

**Ngoài phạm vi:**
- Chế độ offline. Khi mất mạng thì không tạo được đơn.
- Hình thức thanh toán.
- Sửa đơn đã tạo.
- Nhiều chi nhánh.
- Tài khoản riêng cho từng nhân viên.
- Danh sách thiết bị và thu hồi từng thiết bị.
- Món con bên trong một món (ví dụ chọn tên ly cụ thể), tùy chọn thêm (topping, size), quản lý kho, in hóa đơn.
- Giảm giá cho từng dòng đơn; lý do giảm giá.
- Thống kê theo từng món.
- Đa ngôn ngữ (giao diện chỉ có tiếng Việt).

---

## 2. Tổng quan

### 2.1. Kiến trúc

| Thành phần | Công nghệ |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS. Có web app manifest để cài app ra màn hình chính, và ảnh xem trước khi gửi link (Open Graph). **Không có service worker.** |
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

- Khi tài khoản đang dùng là chủ quán, màn hình order có liên kết "Trang chủ quán" để quay lại `/admin/dashboard`. Điện thoại của nhân viên không thấy liên kết này.

**FR-01: Chọn món**
- Hiển thị các **món** chưa bị ẩn theo `sort_order`, mỗi món là một nút ghi tên và giá.
- Chạm một lần vào món thì thêm 1 vào **giỏ đơn**. Món đã có trong giỏ hiện số lượng ngay trên nút.
- Thực đơn được cập nhật realtime:
  - Món trong giỏ đổi giá thì dòng đơn cập nhật giá mới và được làm nổi bật khoảng 3 giây.
  - Món trong giỏ bị ẩn thì dòng đơn bị gạch, kèm "Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại", và nút Xác nhận đơn bị khóa.
- Bố cục (theo `docs/superpowers/specs/2026-10-04-thuc-don-giam-gia-design.md` §5):
  - Điện thoại: lưới món, thanh giỏ đơn dính đáy (số món, Thành tiền và nút "Giỏ đơn"), bấm vào mở tấm giỏ đơn.
  - Màn rộng từ 768px: lưới món bên trái, phiếu đơn luôn hiện bên phải.

**FR-02: Giỏ đơn**
- Mỗi **dòng đơn** gồm tên món, đơn giá, nút **−**, ô số lượng nhập tay, nút **+**, và thành tiền dòng.
- Số lượng mỗi dòng là số nguyên từ 1 đến 99. Bấm − khi số lượng là 1 thì xóa dòng. Ô số để trống hoặc nhập 0 thì khi rời ô trả về số cũ; nhập quá 99 thì về 99.
- Nút "Xóa hết" dùng xác nhận hai bước: bấm lần đầu đổi thành "Chắc chắn xóa hết?" trong vài giây.
- Tối đa 30 dòng đơn mỗi đơn.

**FR-03: Giảm giá và thành tiền**
- **Giảm giá** áp lên cả đơn, theo phần trăm nguyên từ 0 đến 100. Có nút 5%, 10%, 15%, 20% và ô nhập tay. Bấm lại nút đang chọn thì bỏ giảm giá. Nhân viên tự nhập, không cần lý do.
- **Tạm tính** = tổng thành tiền các dòng đơn.
- **Số tiền giảm** = tạm tính × phần trăm ÷ 100, **làm tròn xuống** tới bội số 1.000đ.
- **Thành tiền** = tạm tính − số tiền giảm. Giỏ đơn hiện "Tạm tính", "Giảm N% −X đ" (khi có giảm giá) và "Thành tiền" cỡ lớn.
- Số trên giỏ đơn chỉ để hiển thị; số được lưu là số server tính (FR-04).

**FR-03b: Chọn chỗ ngồi**
- Hiển thị các **chỗ ngồi** chưa bị ẩn, chia thành hai nhóm: **Ghế quầy** và **Bàn**. Có thêm nút cố định **"Mang về"**.
- Mỗi nhóm được sắp theo `sort_order`. Ghế quầy được xếp sao cho giống thứ tự ghế ngoài quầy thật.
- Trong nhóm Ghế quầy, nút bỏ tiền tố "Quầy " của tên ("Quầy 7" hiện "7"); tên khác hiện nguyên. Đơn hàng vẫn lưu tên đầy đủ, và trình đọc màn hình đọc tên đầy đủ.
- **Bắt buộc chọn** một chỗ ngồi hoặc Mang về trước khi gửi. Bấm lại vào lựa chọn đang chọn thì bỏ chọn.
- Nút Ghế quầy và Bàn cao ít nhất 56px, số dùng font hiển thị cỡ lớn; nút đang chọn có nền màu nhấn. Ngay trên nút Xác nhận đơn có dải "Đang chọn: <tên chỗ ngồi>" hoặc "Chưa chọn chỗ ngồi".

**FR-04: Gửi đơn hàng**
- Nút "Xác nhận đơn" bị khóa khi giỏ đơn trống, khi chưa chọn chỗ ngồi, khi chưa tải được thực đơn, khi giỏ có món đã ngừng bán, hoặc khi mất mạng. Lý do khóa hiện ngay trên nút.
- Khi mất mạng, màn hình hiện thông báo "Mất mạng – chưa gửi được đơn".
- Có mạng trở lại thì màn hình tải lại danh sách chỗ ngồi và đơn vừa tạo.
- **Server quyết định mọi số tiền của đơn**:
  - Client gửi lên `id` (UUID do client sinh), chỗ ngồi hoặc mang về, phần trăm giảm giá, và các dòng đơn (món, số lượng, giá đang hiển thị).
  - Server dùng **giá hiện hành của từng món** và tính tạm tính, số tiền giảm, thành tiền. Nếu có dòng lệch giá hoặc món đã bị ẩn, server **từ chối cả đơn** và trả về thực đơn hiện hành; giỏ đơn cập nhật theo FR-01 và màn hình hiện "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.".
- Gửi lại cùng một `id` thì **không tạo đơn thứ hai**. Trường hợp này xảy ra khi mạng chập chờn và nhân viên bấm gửi lại.
- **Gửi thành công:**
  - Điện thoại rung ngắn (trên trình duyệt có hỗ trợ, ví dụ Chrome Android).
  - Giao diện reset (giỏ đơn trống, bỏ giảm giá, bỏ chọn chỗ ngồi).
  - Hiện thông báo "Đã tạo đơn N món – X đ" kèm nút **"Hoàn tác"** trong 5 giây.
- **Gửi thất bại vì lỗi mạng:**
  - Giữ nguyên giỏ đơn, giảm giá và chỗ ngồi đã chọn, rồi báo lỗi.
  - Lần bấm lại dùng **cùng `id`** đơn.
- **Thông báo trên màn hình order:** thông báo lỗi và thông báo thông tin hiện ở hai ô riêng.
  - Thông báo lỗi ẩn khi nhân viên đổi giỏ đơn, giảm giá hoặc chỗ ngồi.
  - Thông báo "Thực đơn vừa đổi" và thông báo đơn đã được ghi từ lần gửi trước giữ nguyên đến lần gửi đơn thành công tiếp theo hoặc lần hủy đơn thành công tiếp theo. Gửi hoặc hủy thất bại không làm mất chúng.

**FR-04b: Đơn vừa tạo và hủy đơn**
- Màn hình order liệt kê các đơn hàng **do chính điện thoại này tạo** trong ngày kinh doanh hiện tại. Mỗi điện thoại tự nhớ danh sách đơn của mình.
- Khi chưa có đơn nào, mục "Đơn vừa tạo" vẫn hiện, kèm câu "Chưa có đơn nào.".
- Mỗi đơn ghi giờ · chỗ ngồi · tóm tắt món (ví dụ "2 Classic, 1 Neat") · thành tiền, thêm "−N%" nếu có giảm giá.
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

**FR-05: Thực đơn, `/admin/menu`**
- Trang riêng trên thanh điều hướng của chủ quán.
- Chủ quán **thêm món** (tên + giá), **đổi tên** ngay tại chỗ, **đổi giá**, **sắp xếp** thứ tự, **ẩn** món và **hiện lại** món đã ẩn.
- Giá là số nguyên VND từ 1.000đ đến 5.000.000đ; server từ chối giá ngoài khoảng này. Tên không được rỗng và không trùng tên món đang bán khác.
- Ẩn món cần xác nhận hai bước: bấm "Ẩn" thì nút đổi thành "Chắc chắn ẩn?" trong vài giây. Món không bao giờ bị xóa hẳn.
- Giá mới áp dụng cho các đơn tạo sau thời điểm lưu. Mỗi dòng đơn lưu **tên món và đơn giá tại thời điểm bán**, nên đổi tên hoặc giá không làm thay đổi đơn cũ.
- Thực đơn khởi tạo: BeSpoke 190.000đ, Classic 190.000đ, Signature 250.000đ, Bình Zax 800.000đ, MixDrink 150.000đ, Neat 100.000đ, Absinthe 150.000đ, Mocktail 100.000đ.
- Không tải được thực đơn thì báo "Không tải được thực đơn. Kiểm tra mạng rồi tải lại trang.".

**FR-05a: Lịch sử đổi giá**
- Trên trang Thực đơn, hiển thị 20 lần đổi giá gần nhất của mọi món, gồm tên món, mức giá, thời điểm và người đổi.
- Quán có **một** tài khoản chủ quán. Người đổi hiện bằng email của chủ quán đang đăng nhập; lần đổi của tài khoản chủ quán khác (nếu có) hiện "Chủ quán khác"; giá lúc thêm món của thực đơn khởi tạo hiện "Khởi tạo".

**FR-05b: Giờ mở cửa và giờ đóng cửa**
- **Giờ mở cửa:** chọn từ 0 đến 23 giờ, mặc định 20:00 (quán mở từ 20:00 đến 02:00 sáng hôm sau).
  - Chỉ áp dụng cho đơn mới; ngày kinh doanh của đơn cũ không đổi.
  - Bên cạnh có ghi chú "Nên đổi khi quán đã đóng cửa".
- **Giờ đóng cửa:** chọn từ 0 đến 23 giờ, mặc định 02:00. Không được trùng giờ mở cửa; server từ chối nếu trùng.
  - Chỉ dùng để hiển thị khoảng giờ quán mở trên Tổng quan. Không ảnh hưởng ngày kinh doanh của đơn hàng (ngày kinh doanh vẫn bắt đầu từ giờ mở cửa và kéo dài 24 giờ).

**FR-05c: Chỗ ngồi**
- Chủ quán thêm chỗ ngồi (chọn loại **Bàn** hoặc **Ghế quầy**), đổi tên, sắp xếp thứ tự trong từng loại, ẩn và hiện lại chỗ ngồi đã ẩn.
- Ẩn chỗ ngồi cần xác nhận hai bước: bấm "Ẩn" thì nút đổi thành "Chắc chắn ẩn?" trong vài giây.
- Chỗ ngồi không bao giờ bị xóa hẳn.
- Mỗi đơn lưu **tên chỗ ngồi tại thời điểm tạo**, nên đổi tên chỗ ngồi không làm thay đổi đơn cũ.

**FR-05d: PIN quán**
- Chủ quán nhập PIN mới (6 số, nhập 2 lần) để đổi. Cần xác nhận hai bước: bấm "Đổi PIN quán" thì nút đổi thành "Chắc chắn đổi PIN?" trong vài giây.
- Đổi PIN thì **mọi điện thoại của nhân viên bị đăng xuất ngay**: lần thao tác tiếp theo bị từ chối, và màn hình quay về `/login`.

### 3.4. Báo cáo (chủ quán)

Doanh thu và số món **chỉ tính đơn đã thanh toán**. **Doanh thu** là tổng thành tiền, tức **sau giảm giá**. **Số món** là tổng số lượng các dòng đơn.

**FR-06: Tổng quan, `/admin/dashboard`**
- **Đồng hồ giờ mở cửa:** vẽ khoảng từ giờ mở cửa đến giờ đóng cửa (ví dụ 20:00–02:00, 6 tiếng), đánh dấu giờ hiện tại. Cả khoảng là một vệt mờ; phần đã trôi qua vẽ sáng đè lên, phần giờ chưa tới giữ vệt mờ. Sau giờ đóng cửa và trước giờ mở cửa kế tiếp, đồng hồ đầy và ghi "Đã đóng cửa".
- **Ba kỳ:** ngày kinh doanh hiện tại, tuần này (thứ Hai đến Chủ nhật, theo ngày kinh doanh, tính đến hôm nay), tháng này (các ngày kinh doanh thuộc tháng dương lịch hiện tại, tính đến hôm nay).
- **Mỗi kỳ có:** doanh thu, số món, số đơn (chỉ tính đơn đã thanh toán).
- **So với kỳ trước, cùng đoạn:**
  - Ngày kinh doanh hiện tại so với cả ngày kinh doanh hôm trước.
  - Tuần này (thứ Hai đến hôm nay) so với cùng các ngày đó của tuần trước.
  - Tháng này (ngày 1 đến hôm nay) so với ngày 1 đến cùng ngày của tháng trước (nếu tháng trước ngắn hơn thì tính đến hết tháng trước).
  - Cả ba chỉ số (doanh thu, số món, số đơn) của cả ba kỳ đều có so sánh.
  - Hiển thị phần trăm tăng hoặc giảm, làm tròn đến số nguyên. Kỳ trước bằng 0 thì không tính phần trăm, chỉ hiện số của kỳ trước.
- **Biểu đồ:**
  - Doanh thu từng ngày kinh doanh trong tháng này, đặt cạnh doanh thu cùng ngày của tháng trước.
  - Doanh thu 7 ngày của tuần này (thứ Hai đến Chủ nhật), đặt cạnh tuần trước.
  - Ở cả hai biểu đồ, ngày chưa tới thì để trống cột kỳ này.
- Tự tải lại mỗi 60 giây.
- Không tải được số liệu thì báo "Không tải được số liệu. Kiểm tra mạng; trang sẽ tự thử lại sau 60 giây." và vẫn tự thử lại.

**FR-06a: Thông báo đơn mới**
- Khi nhân viên tạo đơn thành công, mọi trang chủ quán đang mở hiện thông báo "Đơn mới: <tên chỗ ngồi hoặc Mang về> · N món · 25.000đ" trong 5 giây (`role="status"`), không che thanh điều hướng. Bấm vào thông báo thì mở Lịch sử đơn hàng với đơn đó mở sẵn.
- Cùng lúc, số liệu trên trang (Tổng quan, Lịch sử đơn hàng) được tải lại, không cần đợi chu kỳ 60 giây.
- Dùng Supabase Realtime trên bảng đơn hàng; RLS vẫn áp dụng, chỉ chủ quán nhận được sự kiện. Số món và thành tiền lấy từ đơn trên server (đọc lại theo mã đơn), không tính ở trình duyệt.
- Mất kết nối Realtime thì không có thông báo; Tổng quan vẫn tự tải lại mỗi 60 giây.

**FR-07: Lịch sử đơn hàng, `/admin/history`**
- **Cột:** Thời gian (giờ VN), Chỗ ngồi, Số món, Giảm giá, Thành tiền, Trạng thái.
  - Trên điện thoại, mỗi đơn hiện thành một dòng hai tầng (thời gian · chỗ ngồi và trạng thái; "N món" kèm "−N%" nếu có giảm giá, và thành tiền), đủ 6 trường trên. Từ tablet trở lên là bảng 6 cột.
  - Bấm vào một đơn thì mở xuống các dòng đơn ("2 × Classic · 190.000đ · 380.000đ"), rồi Tạm tính, Giảm giá, Thành tiền. Bấm lần nữa thì đóng. Bấm nút Hủy không mở đơn.
  - Địa chỉ `?order=<mã đơn>` mở sẵn và cuộn tới đơn đó.
- **Lọc:** theo khoảng **Từ ngày – Đến ngày**, tính theo ngày kinh doanh.
  - Mặc định là hôm nay.
  - Ngày không hợp lệ thì thay bằng hôm nay.
  - "Từ ngày" lớn hơn "Đến ngày" thì tự đảo lại.
- **Đơn đã hủy:** vẫn hiện, có gạch ngang, nhưng không tính vào dòng tổng.
- **Dòng tổng** của khoảng đang lọc: số đơn, số món, doanh thu, và tổng số tiền đã giảm ("Đã giảm X đ").
- **Phân trang:** 50 đơn mỗi trang.
- **Lỗi khi tải** (đều kèm "Kiểm tra mạng rồi tải lại trang."):
  - Không xác định được ngày kinh doanh hiện tại: "Không tải được lịch sử đơn hàng.", không hiện bảng.
  - Không tải được danh sách đơn: "Không tải được danh sách đơn.".
  - Không tải được dòng tổng: ẩn dòng tổng, báo "Không tải được dòng tổng.".
- **Hủy đơn:** chủ quán hủy được đơn ngay từ trang này, có bước xác nhận.

**FR-07a: Xuất CSV**
- Xuất toàn bộ đơn trong khoảng đang lọc, mã hóa UTF-8 có BOM, xuống dòng bằng CRLF.
- 8 cột: `Thời gian, Ngày kinh doanh, Chỗ ngồi, Món, Số lượng, Đơn giá, Thành tiền, Trạng thái`.
- Mỗi dòng đơn là một hàng. Đơn có giảm giá có thêm một hàng: Món là `Giảm giá N%`, Số lượng và Đơn giá để trống, Thành tiền là số tiền giảm mang dấu âm. Cộng cột Thành tiền của các đơn đã thanh toán ra đúng doanh thu.
- Ô văn bản bắt đầu bằng `= + - @` được thêm dấu `'` ở đầu, để Excel không hiểu nhầm là công thức.
- Tên file: `don-hang_<từ>_<đến>.csv`.

---

## 4. Dữ liệu

**Quy ước:**
- Tiền là **số nguyên VND**.
- Thời điểm lưu theo UTC, hiển thị theo `Asia/Ho_Chi_Minh`.

| Bảng | Nội dung chính |
|---|---|
| `settings` | Một dòng duy nhất: `business_day_start_hour`, `business_day_end_hour` (mặc định 2, khác giờ mở cửa), `updated_at` |
| `menu_items` | `name`, `price` (1.000–5.000.000), `sort_order`, `is_archived` |
| `menu_price_history` | `menu_item_id`, `price`, `effective_from`, `changed_by` (ghi bằng trigger khi thêm món hoặc đổi giá) |
| `seats` | `name`, `kind` (`table` = Bàn, `counter` = Ghế quầy), `sort_order`, `is_archived` |
| `app_roles` | `user_id`, `role` (`owner` hoặc `staff`). Chỉ có **một** tài khoản `staff`. |
| `orders` | `id` (do client sinh), `item_count`, `subtotal_amount`, `discount_percent` (0–100), `discount_amount`, `total_amount`, `seat_id`, `seat_name`, `is_takeaway` (bắt buộc có `seat_id` hoặc `is_takeaway`), `status` (`paid`/`cancelled`), `created_by`, `created_at`, `business_date`, `cancelled_at`, `cancelled_by` |
| `order_lines` | `order_id`, `menu_item_id`, `item_name`, `unit_price`, `quantity` (1–99), `line_amount` (cột tự tính = `quantity × unit_price`), `sort_order` |

**Quy tắc tính `business_date`:** lấy giờ Việt Nam của thời điểm tạo đơn, lùi lại `business_day_start_hour` giờ, rồi lấy phần ngày. Giá trị này được tính một lần lúc tạo đơn và lưu vào đơn.

---

## 5. Yêu cầu phi chức năng

| Mã | Yêu cầu |
|---|---|
| NFR-01 | Mỗi lần bấm nút trên `/order` có phản hồi trên giao diện dưới 200ms. Trong lúc gửi đơn, nút hiện trạng thái "Đang gửi…". |
| NFR-02 | Mobile-first. Nút chính cao ít nhất 56px. Thành tiền hiển thị cỡ lớn. |
| NFR-04 | Mọi kiểm tra quyền chạy ở server. Không có chức năng tự đăng ký. Không bao giờ đưa service_role key lên Vercel. |
| NFR-05 | Tiền là số nguyên. Server tính đơn giá, tạm tính, số tiền giảm và thành tiền. Không bao giờ xóa cứng đơn hàng, chỗ ngồi hoặc món. Ngoại lệ duy nhất: migration v3.0 xóa dữ liệu thử một lần trước khi dùng thật (R36). |
| NFR-06 | Giao diện tiếng Việt, tiền định dạng `25.000đ`, giờ Việt Nam. |
| NFR-07 | Chạy trên Chrome Android và Safari iOS bản mới nhất. Cài được ra màn hình chính. |

---

## 6. Vận hành

- **Cài đặt ban đầu:**
  - Tạo project Supabase và chạy migration.
  - Tạo tài khoản chủ quán và tài khoản nhân viên bằng script.
  - Kiểm tra thực đơn, đặt giờ mở cửa và chỗ ngồi.
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
| R6 (v1.2) | Báo cáo | Bỏ biểu đồ. **Thay bởi R27 (v2.0).** |
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
| R24 (v1.8) | Bố cục màn hình order | Thành tiền ngay dưới số cốc (đọc cùng một cái liếc); nút ghế quầy chỉ hiện phần số để vừa 2 hàng 6 như mép quầy. |
| R25 (v1.9) | Giao diện | Đơn vừa tạo trống thì hiện "Chưa có đơn nào."; Lịch sử đơn hàng dạng dòng hai tầng trên điện thoại, bảng 6 cột từ tablet. |
| R26 (v2.0) | Giờ đóng cửa | Thêm vào Cài đặt, mặc định 02:00, không trùng giờ mở cửa. Chỉ để vẽ đồng hồ giờ mở cửa; ngày kinh doanh không đổi. |
| R27 (v2.0) | Thống kê | Ngày kinh doanh, tuần (T2–CN), tháng; doanh thu, số cốc, số đơn; so với cùng đoạn kỳ trước; biểu đồ doanh thu theo ngày trong tháng và trong tuần. Cả ba chỉ số của ba kỳ đều so sánh; phần trăm làm tròn số nguyên; ngày chưa tới để trống. Biểu đồ trở lại phạm vi. |
| R28 (v2.1) | Điều hướng | Chủ quán vào /order có liên kết "Trang chủ quán" quay lại /admin/dashboard; nhân viên không thấy. |
| R29 (v2.2) | Ảnh xem trước | Gửi link app vào ứng dụng chat thì hiện ảnh 1200×630: logo trên nền thương hiệu và câu mô tả app. Một ảnh tĩnh chung cho mọi trang, không chứa số liệu của quán. |
| R30 (v2.3) | Thông báo đơn mới | Trang chủ quán nghe Realtime trên bảng đơn hàng; đơn mới hiện thông báo 5 giây và tải lại số liệu. Không âm thanh, không rung. |
| R31 (v2.3) | Giao diện điện thoại | Đồng hồ giờ mở cửa có vệt mờ cho giờ chưa tới. Thanh điều hướng dưới chỉ icon (tên trong aria-label), cao 48px. Cỡ chữ gốc 15px dưới `lg`; khoảng cách và vùng chạm tính bằng px nên vẫn ≥ 48px (NFR-02). Ô nhập giữ chữ ≥ 16px để iOS không tự phóng to. |
| R32 (v3.0) | Thực đơn | Bỏ đồng giá. Mỗi loại đồ uống là một món, một giá (1.000–5.000.000đ). Trang Thực đơn riêng; lịch sử đổi giá theo món; món ẩn thay vì xóa. |
| R33 (v3.0) | Màn order | Chạm món là +1 vào giỏ đơn; dòng đơn có − / ô số / + (1–99); điện thoại dùng thanh giỏ đơn mở thành tấm, màn rộng có phiếu đơn bên phải. Bắt buộc chọn chỗ ngồi; nút chỗ ngồi to và nổi bật, có dải "Đang chọn". Lệch giá hoặc món đã ẩn thì server từ chối cả đơn. |
| R34 (v3.0) | Giảm giá | Phần trăm nguyên 0–100 cho cả đơn, nhân viên tự nhập, không cần lý do; số tiền giảm làm tròn xuống tới 1.000đ; doanh thu tính sau giảm. |
| R35 (v3.0) | Báo cáo | Số cốc đổi thành số món. Lịch sử mở xem dòng đơn, `?order=` mở sẵn đơn. CSV 8 cột, mỗi dòng đơn một hàng, thêm hàng "Giảm giá" mang số âm. Chưa có thống kê theo món. |
| R36 (v3.0) | Dữ liệu thử | App chưa dùng thật: migration v3.0 xóa toàn bộ đơn hàng và lịch sử đổi giá một lần (local và prod), sau khi chủ quán xác nhận số đơn trên prod. Sau đó NFR-05 áp dụng lại. |
