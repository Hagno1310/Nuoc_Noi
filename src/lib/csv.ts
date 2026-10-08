import { formatIsoDate, formatVnDateTime } from "@/lib/time";

export type CsvOrder = {
  created_at: string;
  business_date: string;
  seat_name: string;
  discount_percent: number;
  discount_amount: number;
  status: "paid" | "cancelled";
  payment_method: "cash" | "transfer";
  order_lines: { item_name: string; unit_price: number; quantity: number; line_amount: number }[];
};

const HEADER = [
  "Thời gian",
  "Ngày kinh doanh",
  "Chỗ ngồi",
  "Món",
  "Số lượng",
  "Đơn giá",
  "Thành tiền",
  "Trạng thái",
  "Thanh toán",
];
const STATUS_LABEL: Record<CsvOrder["status"], string> = { paid: "Đã thanh toán", cancelled: "Đã hủy" };
export const PAYMENT_LABEL: Record<CsvOrder["payment_method"], string> = { cash: "Tiền mặt", transfer: "Chuyển khoản" };

function textCell(value: string): string {
  // Chặn CSV injection: Excel coi ô bắt đầu bằng = + - @ là công thức
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// BOM để Excel đọc đúng UTF-8 (SRS FR-07a)
const BOM = String.fromCharCode(0xfeff);

// SRS FR-07a (v3.3): mỗi dòng đơn một hàng; đơn có giảm giá thêm hàng "Giảm giá N%" mang số âm,
// nên cộng cột Thành tiền của các đơn đã thanh toán ra đúng doanh thu
export function ordersToCsv(orders: CsvOrder[]): string {
  const rows = orders.flatMap((o) => {
    const head = [textCell(formatVnDateTime(o.created_at)), textCell(formatIsoDate(o.business_date)), textCell(o.seat_name)];
    const tail = [textCell(STATUS_LABEL[o.status]), textCell(PAYMENT_LABEL[o.payment_method])];
    const out = o.order_lines.map((l) => [
      ...head,
      textCell(l.item_name),
      String(l.quantity),
      String(l.unit_price),
      String(l.line_amount),
      ...tail,
    ]);
    if (o.discount_percent > 0) {
      out.push([...head, textCell(`Giảm giá ${o.discount_percent}%`), "", "", String(-o.discount_amount), ...tail]);
    }
    return out.map((r) => r.join(","));
  });
  return BOM + [HEADER.join(","), ...rows].join("\r\n") + "\r\n";
}

export function csvFileName(from: string, to: string): string {
  return `don-hang_${from}_${to}.csv`;
}
