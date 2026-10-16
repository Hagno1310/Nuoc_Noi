import { describe, expect, it } from "vitest";
import { csvFileName, ordersToCsv, type CsvOrder, type DbLine } from "@/lib/csv";

const line = (item_name: string, unit_price: number, quantity: number, over: Partial<DbLine> = {}): DbLine => ({
  item_name,
  unit_price,
  quantity,
  line_amount: unit_price * quantity,
  note: "",
  round: null,
  ...over,
});
const order = (over: Partial<CsvOrder> = {}): CsvOrder => ({
  created_at: "2026-10-03T22:59:05Z",
  paid_at: null,
  business_date: "2026-10-03",
  seat_name: "Quầy 1",
  discount_percent: 10,
  discount_amount: 48000,
  status: "paid",
  payment_method: "transfer",
  order_lines: [line("Classic", 190000, 2, { note: "Ít đá" }), line("Neat", 100000, 1)],
  ...over,
});
const lines = (csv: string) => csv.slice(1).split("\r\n");

describe("ordersToCsv", () => {
  it("BOM, header 10 cột có Ghi chú, mỗi dòng đơn một hàng, hàng Giảm giá mang số âm, CRLF", () => {
    const csv = ordersToCsv([order()]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(lines(csv)).toEqual([
      "Thời gian,Ngày kinh doanh,Chỗ ngồi,Món,Ghi chú,Số lượng,Đơn giá,Thành tiền,Trạng thái,Thanh toán",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Classic,Ít đá,2,190000,380000,Đã thanh toán,Chuyển khoản",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Neat,,1,100000,100000,Đã thanh toán,Chuyển khoản",
      "04/10/2026 05:59:05,03/10/2026,Quầy 1,Giảm giá 10%,,,,-48000,Đã thanh toán,Chuyển khoản",
      "",
    ]);
  });

  it("cộng cột Thành tiền của đơn đã thanh toán ra đúng doanh thu", () => {
    const rows = lines(ordersToCsv([order(), order({ status: "cancelled" }), order({ discount_percent: 0, discount_amount: 0 })]))
      .slice(1, -1)
      .map((l) => l.split(","));
    const paid = rows.filter((r) => r[8] === "Đã thanh toán").reduce((s, r) => s + Number(r[7]), 0);
    expect(paid).toBe(432000 + 480000);
  });

  it("đơn trả sau: giờ thu tiền, bỏ dòng của lượt gọi đã hủy; đơn chờ thanh toán để trống Thanh toán", () => {
    const tab = order({
      paid_at: "2026-10-03T23:30:00Z",
      discount_percent: 0,
      discount_amount: 0,
      order_lines: [line("Classic", 190000, 1), line("Neat", 100000, 1, { round: { id: "r2", created_at: "", cancelled_at: "x" } })],
    });
    expect(lines(ordersToCsv([tab]))[1]).toBe("04/10/2026 06:30:00,03/10/2026,Quầy 1,Classic,,1,190000,190000,Đã thanh toán,Chuyển khoản");
    expect(lines(ordersToCsv([tab])).length).toBe(3);
    const open = lines(ordersToCsv([order({ status: "open", payment_method: null, discount_percent: 0 })]));
    expect(open[1].endsWith(",Chờ thanh toán,")).toBe(true);
  });

  it("escape dấu phẩy và dấu nháy, chặn công thức Excel ở tên món, ghi chú và chỗ ngồi", () => {
    const rows = lines(
      ordersToCsv([
        order({
          seat_name: 'Bàn "VIP", tầng 2',
          discount_percent: 0,
          order_lines: [line("=HYPERLINK(1)", 1000, 1, { note: "+1 chanh" })],
        }),
      ]),
    );
    expect(rows[1]).toContain('"Bàn ""VIP"", tầng 2"');
    expect(rows[1]).toContain(",'=HYPERLINK(1),'+1 chanh,");
  });
});

describe("csvFileName", () => {
  it("don-hang_<từ>_<đến>.csv", () => {
    expect(csvFileName("2026-10-01", "2026-10-07")).toBe("don-hang_2026-10-01_2026-10-07.csv");
  });
});
