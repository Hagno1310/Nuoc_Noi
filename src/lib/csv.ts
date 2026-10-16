import { formatIsoDate, formatVnDateTime } from "@/lib/time";

// Dòng đơn đọc từ DB, kèm lượt gọi để bỏ dòng của lượt gọi đã hủy (FR-04d)
export type DbLine = {
  item_name: string;
  unit_price: number;
  quantity: number;
  line_amount: number;
  note: string;
  round: { id: string; created_at: string; cancelled_at: string | null } | null;
};
export const LINES_SELECT =
  "order_lines(item_name, unit_price, quantity, line_amount, note, sort_order, round:order_rounds(id, created_at, cancelled_at))";
// Đơn đã hủy giữ mọi dòng (để vẫn có trong CSV và Lịch sử); đơn còn hiệu lực bỏ dòng của lượt gọi đã hủy
export const liveLines = (lines: DbLine[], status: OrderStatus) =>
  status === "cancelled" ? lines : lines.filter((l) => !l.round?.cancelled_at);

export type OrderStatus = "open" | "paid" | "cancelled";
export type CsvOrder = {
  created_at: string;
  paid_at: string | null;
  business_date: string;
  seat_name: string;
  discount_percent: number;
  discount_amount: number;
  status: OrderStatus;
  payment_method: "cash" | "transfer" | null;
  order_lines: DbLine[];
};

const HEADER = [
  "Thời gian",
  "Ngày kinh doanh",
  "Chỗ ngồi",
  "Món",
  "Ghi chú",
  "Số lượng",
  "Đơn giá",
  "Thành tiền",
  "Trạng thái",
  "Thanh toán",
];
export const STATUS_LABEL: Record<OrderStatus, string> = { open: "Chờ thanh toán", paid: "Đã thanh toán", cancelled: "Đã hủy" };
export const PAYMENT_LABEL: Record<"cash" | "transfer", string> = { cash: "Tiền mặt", transfer: "Chuyển khoản" };

function textCell(value: string): string {
  // Chặn CSV injection: Excel coi ô bắt đầu bằng = + - @ là công thức
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// BOM để Excel đọc đúng UTF-8 (SRS FR-07a)
const BOM = String.fromCharCode(0xfeff);

// SRS FR-07a (v3.8): mỗi dòng đơn một hàng (bỏ lượt gọi đã hủy); đơn có giảm giá thêm hàng "Giảm giá N%" mang số âm,
// nên cộng cột Thành tiền của các đơn đã thanh toán ra đúng doanh thu. Đơn trả sau lấy giờ thu tiền.
export function ordersToCsv(orders: CsvOrder[]): string {
  const rows = orders.flatMap((o) => {
    const head = [
      textCell(formatVnDateTime(o.paid_at ?? o.created_at)),
      textCell(formatIsoDate(o.business_date)),
      textCell(o.seat_name),
    ];
    const tail = [textCell(STATUS_LABEL[o.status]), o.payment_method ? textCell(PAYMENT_LABEL[o.payment_method]) : ""];
    const out = liveLines(o.order_lines, o.status).map((l) => [
      ...head,
      textCell(l.item_name),
      textCell(l.note),
      String(l.quantity),
      String(l.unit_price),
      String(l.line_amount),
      ...tail,
    ]);
    if (o.discount_percent > 0) {
      out.push([...head, textCell(`Giảm giá ${o.discount_percent}%`), "", "", "", String(-o.discount_amount), ...tail]);
    }
    return out.map((r) => r.join(","));
  });
  return BOM + [HEADER.join(","), ...rows].join("\r\n") + "\r\n";
}

export function csvFileName(from: string, to: string): string {
  return `don-hang_${from}_${to}.csv`;
}
