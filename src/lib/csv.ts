import { formatIsoDate, formatVnDateTime } from "@/lib/time";

export type HistoryRow = {
  created_at: string;
  business_date: string;
  seat_name: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: "paid" | "cancelled";
};

const HEADER = [
  "Thời gian",
  "Ngày kinh doanh",
  "Chỗ ngồi",
  "Số cốc",
  "Đơn giá",
  "Thành tiền",
  "Trạng thái",
];
const STATUS_LABEL: Record<HistoryRow["status"], string> = {
  paid: "Đã thanh toán",
  cancelled: "Đã hủy",
};

function textCell(value: string): string {
  // Chặn CSV injection: Excel coi ô bắt đầu bằng = + - @ là công thức
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// BOM để Excel đọc đúng UTF-8 (SRS FR-07a)
const BOM = String.fromCharCode(0xfeff);

export function ordersToCsv(rows: HistoryRow[]): string {
  const lines = [
    HEADER.join(","),
    ...rows.map((r) =>
      [
        textCell(formatVnDateTime(r.created_at)),
        textCell(formatIsoDate(r.business_date)),
        textCell(r.seat_name ?? ""),
        String(r.quantity),
        String(r.unit_price),
        String(r.total_amount),
        textCell(STATUS_LABEL[r.status]),
      ].join(","),
    ),
  ];
  return BOM + lines.join("\r\n") + "\r\n";
}

export function csvFileName(from: string, to: string): string {
  return `don-hang_${from}_${to}.csv`;
}
