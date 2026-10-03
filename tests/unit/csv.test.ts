import { describe, expect, it } from "vitest";
import { csvFileName, ordersToCsv, type HistoryRow } from "@/lib/csv";

const row = (over: Partial<HistoryRow> = {}): HistoryRow => ({
  created_at: "2026-10-03T22:59:05Z",
  business_date: "2026-10-03",
  seat_name: "Quầy 1",
  quantity: 7,
  unit_price: 25000,
  total_amount: 175000,
  status: "paid",
  ...over,
});

describe("ordersToCsv", () => {
  it("bắt đầu bằng BOM, có header, xuống dòng bằng CRLF", () => {
    const csv = ordersToCsv([row()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const lines = csv.slice(1).split("\r\n");
    expect(lines[0]).toBe(
      "Thời gian,Ngày kinh doanh,Chỗ ngồi,Số cốc,Đơn giá,Thành tiền,Trạng thái",
    );
    expect(lines[1]).toBe(
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,7,25000,175000,Đã thanh toán",
    );
    expect(lines[2]).toBe("");
  });

  it("escape dấu phẩy và dấu nháy, chỗ ngồi null thành ô trống, đơn hủy có nhãn", () => {
    const lines = ordersToCsv([
      row({ seat_name: 'Bàn "VIP", tầng 2' }),
      row({ seat_name: null, status: "cancelled" }),
    ])
      .slice(1)
      .split("\r\n");
    expect(lines[1]).toContain('"Bàn ""VIP"", tầng 2"');
    expect(lines[2]).toBe(
      "04/10/2026 05:59:05,03/10/2026,,7,25000,175000,Đã hủy",
    );
  });

  it("chặn công thức Excel trong tên chỗ ngồi", () => {
    const lines = ordersToCsv([row({ seat_name: "=HYPERLINK(1)" })])
      .slice(1)
      .split("\r\n");
    expect(lines[1]).toContain(",'=HYPERLINK(1),");
  });

  it("danh sách rỗng chỉ có header", () => {
    expect(ordersToCsv([]).slice(1)).toBe(
      "Thời gian,Ngày kinh doanh,Chỗ ngồi,Số cốc,Đơn giá,Thành tiền,Trạng thái\r\n",
    );
  });

  it("tên file theo khoảng ngày", () => {
    expect(csvFileName("2026-10-01", "2026-10-31")).toBe(
      "don-hang_2026-10-01_2026-10-31.csv",
    );
  });
});
