# Nước Nôi

Bảng thuật ngữ chung cho chủ quán, nhân viên và code. **Nước Nôi** là quán nước bán theo **thực đơn**: mỗi món có giá riêng. Phần mềm ghi nhận đơn hàng, các món bán ra và doanh thu.

## Bán hàng

**Thực đơn** (Menu):
Danh sách các món quán đang bán. Chủ quán quản lý ở trang Thực đơn.
_Avoid_: Menu, bảng giá

**Món** (Menu item):
Một loại đồ uống trên thực đơn, có tên và giá riêng (ví dụ Classic, Bình Zax). Món bị ẩn thay vì xóa.
_Avoid_: Sản phẩm, đồ uống, cốc, ly

**Món đã ẩn** (Archived menu item):
Món không còn được chọn khi tạo đơn mới, nhưng vẫn hiện tên trên các đơn cũ.
_Avoid_: Món đã xóa

**Đơn hàng** (Order):
Một lần ghi nhận khách mua một hoặc nhiều món, gồm các dòng đơn, có số tiền đã chốt tại thời điểm tạo.
_Avoid_: Hóa đơn, giao dịch, order

**Dòng đơn** (Order line):
Một món cùng số lượng của nó trong một đơn hàng. Lưu tên món và đơn giá tại thời điểm bán.
_Avoid_: Item, mục, chi tiết đơn

**Giỏ đơn** (Cart):
Các dòng đơn nhân viên đã chọn nhưng chưa gửi. Mất khi tải lại trang.
_Avoid_: Giỏ hàng, cart

**Số lượng** (Quantity):
Số món của một dòng đơn, là số nguyên từ 1 đến 99.
_Avoid_: Số ly, SL

**Số món** (Item count):
Tổng số lượng các dòng đơn của một đơn, hoặc của nhiều đơn trong báo cáo.
_Avoid_: Số cốc, số ly

**Chỗ ngồi** (Seat):
Một vị trí cố định trong quán nơi khách ngồi, do chủ quán đặt tên. Chỗ ngồi có hai loại: bàn và ghế quầy. Mỗi đơn hàng gắn với đúng một chỗ ngồi, hoặc là mang về.
_Avoid_: Vị trí, tên khách, ghi chú, "bàn" (khi muốn nói chung cho cả bàn và ghế quầy)

**Bàn** (Table):
Loại chỗ ngồi là một chiếc bàn trong quán. Quán có 3 bàn.
_Avoid_: Số bàn

**Ghế quầy** (Counter seat):
Loại chỗ ngồi là một ghế dọc theo quầy bar, nơi khách ngồi đối diện nhân viên. Quán có 12 ghế quầy.
_Avoid_: Quầy (khi muốn chỉ một ghế cụ thể), ghế bar, ghế cao

**Chỗ ngồi đã ẩn** (Archived seat):
Chỗ ngồi không còn được chọn khi tạo đơn mới, nhưng vẫn hiện tên trên các đơn cũ.
_Avoid_: Chỗ ngồi đã xóa

**Mang về** (Takeaway):
Đơn hàng mà khách không ngồi tại quán. Đây là một lựa chọn cố định, không phải một chỗ ngồi.
_Avoid_: Take away, đem về, mua mang đi

## Giá và tiền

**Giá món** (Menu item price):
Giá hiện hành của một món, áp dụng cho các đơn hàng **tạo từ bây giờ**. Từ 1.000đ đến 5.000.000đ.
_Avoid_: Đơn giá chung, giá bán

**Đơn giá của đơn** (Unit price):
Giá món tại thời điểm đơn hàng được tạo, lưu trong dòng đơn. Giá này không bao giờ thay đổi về sau, kể cả khi giá món đổi.
_Avoid_: Giá lịch sử, giá cũ

**Tạm tính** (Subtotal):
Tổng thành tiền các dòng đơn của một đơn hàng, trước giảm giá.
_Avoid_: Tổng phụ, tiền hàng

**Giảm giá** (Discount):
Phần trăm nguyên (0–100) giảm trên tạm tính của cả đơn. Số tiền giảm làm tròn xuống tới bội số 1.000đ.
_Avoid_: Chiết khấu, khuyến mãi, voucher

**Thành tiền** (Total amount):
Số tiền khách phải trả cho **một** đơn hàng: tạm tính trừ số tiền giảm. Với một dòng đơn, "thành tiền dòng" là số lượng nhân đơn giá.
_Avoid_: Tổng tiền, tiền đơn

**Doanh thu** (Revenue):
Tổng thành tiền của các đơn hàng **đã thanh toán** trong một khoảng thời gian. Đơn đã hủy không được tính.
_Avoid_: Tổng tiền, thu nhập, lợi nhuận

## Trạng thái đơn

**Đã thanh toán** (Paid):
Trạng thái mặc định của đơn hàng: khách trả tiền ngay khi tạo đơn.
_Avoid_: Hoàn thành, đã chốt

**Hủy đơn** / **Đã hủy** (Cancelled):
Đơn hàng được đánh dấu là không tính doanh thu. Đơn vẫn được giữ lại và vẫn hiện trong lịch sử, không bao giờ bị xóa.
_Avoid_: Xóa đơn, hoàn tiền, void

**Cửa sổ hủy** (Cancel window):
5 phút tính từ lúc tạo đơn. Trong khoảng này, nhân viên được tự hủy bất kỳ đơn nào. Hết khoảng này, chỉ chủ quán hủy được.
_Avoid_: Thời gian hoàn tác

## Con người

**Chủ quán** (Owner):
Người quản lý thực đơn, xem doanh thu và có quyền cao nhất trong hệ thống.
_Avoid_: Admin, quản trị viên, quản lý

**Nhân viên** (Staff):
Người tạo đơn hàng tại quán. Nhân viên không đổi được giá và không xem được báo cáo. Mọi nhân viên dùng chung một danh tính; hệ thống không phân biệt ai tạo đơn nào.
_Avoid_: Thu ngân, phục vụ, user

**PIN quán** (Shop PIN):
Mã 6 chữ số chung mà nhân viên nhập để vào màn hình tạo đơn. Đổi PIN quán thì mọi điện thoại của nhân viên phải nhập lại.
_Avoid_: Mật khẩu nhân viên, mã đăng nhập

## Thời gian

**Giờ mở cửa** (Business day start hour):
Mốc giờ mà chủ quán chọn để bắt đầu một ngày kinh doanh mới. Nước Nôi mở từ 20:00 đến 02:00, nên giờ mở cửa là 20: các đơn hàng sau nửa đêm vẫn thuộc ngày kinh doanh của buổi tối trước đó.
_Avoid_: Giờ chuyển ngày, giờ chốt sổ

**Giờ đóng cửa** (Business day end hour):
Mốc giờ quán đóng cửa, mặc định 02:00. Chỉ dùng để hiển thị khoảng giờ quán mở; không quyết định đơn hàng thuộc ngày kinh doanh nào.
_Avoid_: Giờ kết ca, giờ chốt sổ

**Ngày kinh doanh** (Business date):
Khoảng 24 giờ bắt đầu từ giờ mở cửa. Mỗi đơn hàng thuộc đúng một ngày kinh doanh, và ngày đó không đổi kể cả khi giờ mở cửa được đổi về sau.
_Avoid_: Ngày, ca, hôm nay (khi nói về báo cáo)

## Báo cáo

**Tuần** (Business week):
Bảy ngày kinh doanh từ thứ Hai đến Chủ nhật. Đơn lúc 01:00 sáng thứ Hai thuộc ngày kinh doanh Chủ nhật, nên thuộc tuần trước.
_Avoid_: 7 ngày gần nhất

**Kỳ trước** (Previous period):
Cùng đoạn của kỳ liền trước, dùng để so sánh: hôm trước, cùng các ngày của tuần trước, hoặc cùng các ngày của tháng trước.
_Avoid_: Cùng kỳ năm trước

**Lịch sử đơn hàng** (Order history):
Danh sách mọi đơn hàng trong một khoảng ngày, gồm cả đơn đã hủy.
_Avoid_: Lịch sử giao dịch, log


**Thông báo đơn mới** (New order notice):
Thông báo hiện vài giây trên trang chủ quán khi nhân viên vừa tạo đơn, ghi chỗ ngồi, số món và thành tiền.
_Avoid_: Popup đơn, push
