import { describe, expect, it } from "vitest";
import { csvFileName, ordersToCsv, type CsvOrder } from "@/lib/csv";

const order = (over: Partial<CsvOrder> = {}): CsvOrder => ({
  created_at: "2026-10-03T22:59:05Z",
  business_date: "2026-10-03",
  seat_name: "Quầy 1",
  discount_percent: 10,
  discount_amount: 48000,
  status: "paid",
  payment_method: "transfer",
  order_lines: [
    { item_name: "Classic", unit_price: 190000, quantity: 2, line_amount: 380000 },
    { item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 },
  ],
  ...over,
});
const lines = (csv: string) => csv.slice(1).split("\r\n");

describe("ordersToCsv", () => {
  it("BOM, header 9 cột, mỗi dòng đơn một hàng, hàng Giảm giá mang số âm, CRLF", () => {
    const csv = ordersToCsv([order()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines(csv)).toEqual([
      "Thời gian,Ngày kinh doanh,Chỗ ngồi,Món,Số lượng,Đơn giá,Thành tiền,Trạng thái,Thanh toán",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Classic,2,190000,380000,Đã thanh toán,Chuyển khoản",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Neat,1,100000,100000,Đã thanh toán,Chuyển khoản",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Giảm giá 10%,,,-48000,Đã thanh toán,Chuyển khoản",
      "",
    ]);
  });

  it("cộng cột Thành tiền của đơn đã thanh toán ra đúng doanh thu", () => {
    const rows = lines(ordersToCsv([order(), order({ status: "cancelled" }), order({ discount_percent: 0, discount_amount: 0 })]))
      .slice(1, -1)
      .map((l) => l.split(","));
    const paid = rows.filter((r) => r[7] === "Đã thanh toán").reduce((s, r) => s + Number(r[6]), 0);
    expect(paid).toBe(432000 + 480000);
  });

  it("không giảm giá thì không có hàng Giảm giá; tiền mặt và đơn hủy có nhãn", () => {
    const rows = lines(ordersToCsv([order({ discount_percent: 0, discount_amount: 0, payment_method: "cash", status: "cancelled" })]));
    expect(rows).toHaveLength(4);
    expect(rows[1]).toBe("04/10/2026 05:59:05,03/10/2026,Quầy 1,Classic,2,190000,380000,Đã hủy,Tiền mặt");
  });

  it("escape dấu phẩy và dấu nháy, chặn công thức Excel ở tên món và chỗ ngồi", () => {
    const rows = lines(
      ordersToCsv([
        order({
          seat_name: 'Bàn "VIP", tầng 2',
          discount_percent: 0,
          order_lines: [{ item_name: "=HYPERLINK(1)", unit_price: 1000, quantity: 1, line_amount: 1000 }],
        }),
      ]),
    );
    expect(rows[1]).toContain('"Bàn ""VIP"", tầng 2"');
    expect(rows[1]).toContain(",'=HYPERLINK(1),");
  });
});

describe("csvFileName", () => {
  it("don-hang_<từ>_<đến>.csv", () => {
    expect(csvFileName("2026-10-01", "2026-10-07")).toBe("don-hang_2026-10-01_2026-10-07.csv");
  });
});
