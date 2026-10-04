# Nước Nôi

Bảng thuật ngữ chung cho chủ quán, nhân viên và code. **Nước Nôi** là quán nước bán **đồng giá**: mọi cốc có cùng một mức giá. Phần mềm chỉ ghi nhận số cốc bán ra và doanh thu.

## Bán hàng

**Cốc**:
Đơn vị bán duy nhất của quán. Mọi cốc có giá như nhau, không phân biệt món.
_Avoid_: Ly, món, sản phẩm, đồ uống

**Đơn hàng** (Order):
Một lần ghi nhận khách mua một số cốc, có số tiền đã chốt tại thời điểm tạo.
_Avoid_: Hóa đơn, giao dịch, order

**Số lượng** (Quantity):
Số cốc trong một đơn hàng, là số nguyên dương.
_Avoid_: Số ly, SL

**Chỗ ngồi** (Seat):
Một vị trí cố định trong quán nơi khách ngồi, do chủ quán đặt tên. Chỗ ngồi có hai loại: bàn và ghế quầy. Mỗi đơn hàng gắn với tối đa một chỗ ngồi, hoặc là mang về, hoặc không ghi gì.
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

**Đơn giá chung** (Current price):
Mức giá hiện hành áp dụng cho mọi cốc của các đơn hàng **tạo từ bây giờ**.
_Avoid_: Giá bán, giá món, giá hiện tại

**Đơn giá của đơn** (Unit price):
Đơn giá chung tại thời điểm đơn hàng được tạo. Giá này không bao giờ thay đổi về sau, kể cả khi đơn giá chung đổi.
_Avoid_: Giá lịch sử, giá cũ

**Thành tiền** (Total amount):
Số lượng nhân với đơn giá của đơn, là số tiền của **một** đơn hàng.
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
Người đặt đơn giá chung, xem doanh thu và có quyền cao nhất trong hệ thống.
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

