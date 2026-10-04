import { describe, expect, it } from "vitest";
import { ownerErrorText } from "@/lib/admin/errors";

describe("ownerErrorText", () => {
  it("trùng tên món đang bán (unique index)", () => {
    expect(ownerErrorText({ message: 'duplicate key value violates unique constraint "menu_items_active_name_key"', code: "23505" }))
      .toBe("Đã có món đang bán tên này. Đặt tên khác.");
  });
  it("giá ngoài khoảng (CHECK của menu_items)", () => {
    expect(ownerErrorText({ message: 'new row for relation "menu_items" violates check constraint "menu_items_price_check"', code: "23514" }))
      .toBe("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });
  it("CHECK của bảng khác không bị báo nhầm là giá sai", () => {
    expect(ownerErrorText({ message: 'new row for relation "seats" violates check constraint "seats_name_check"', code: "23514" }))
      .toBe("Không thực hiện được. Kiểm tra mạng rồi thử lại.");
  });
  it("lỗi mạng có mã rỗng vẫn ra câu đầy đủ", () => {
    expect(ownerErrorText({ message: "TypeError: fetch failed", code: "" }))
      .toBe("Không thực hiện được. Kiểm tra mạng rồi thử lại.");
  });
  it("mã lỗi nghiệp vụ trong message", () => {
    expect(ownerErrorText({ message: "FORBIDDEN" })).toBe("Phiên chủ quán đã hết. Đăng nhập lại rồi thử lại.");
  });
  it("lỗi khác", () => {
    expect(ownerErrorText({ message: "fetch failed" })).toBe("Không thực hiện được. Kiểm tra mạng rồi thử lại.");
  });
});
