import { describe, expect, it } from "vitest";
import {
  isValidPin,
  MAX_PRICE,
  MIN_PRICE,
  parsePriceInput,
  PRICE_RANGE_TEXT,
} from "@/lib/admin/validate";

describe("parsePriceInput", () => {
  it("chấp nhận nhiều cách gõ tiền", () => {
    expect(parsePriceInput("120000")).toBe(120000);
    expect(parsePriceInput("120.000")).toBe(120000);
    expect(parsePriceInput(" 120.000đ ")).toBe(120000);
    expect(parsePriceInput("120,000")).toBe(120000);
    expect(parsePriceInput("5.000.000")).toBe(5000000);
    expect(parsePriceInput(String(MIN_PRICE))).toBe(1000);
  });
  it("từ chối giá ngoài khoảng 1.000đ–5.000.000đ hoặc gõ sai", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("999")).toBeNull();
    expect(parsePriceInput("-5000")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
    expect(parsePriceInput("120,5")).toBeNull();
    expect(parsePriceInput("1.20")).toBeNull();
    expect(parsePriceInput(String(MAX_PRICE + 1))).toBeNull();
  });
  it("câu báo lỗi nêu đúng khoảng giá", () => {
    expect(PRICE_RANGE_TEXT).toBe("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });
});

describe("isValidPin", () => {
  it("đúng 6 chữ số", () => {
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("12a456")).toBe(false);
  });
});
