import { describe, expect, it } from "vitest";
import { isValidPin, MAX_PRICE, parsePriceInput } from "@/lib/admin/validate";

describe("parsePriceInput", () => {
  it("chấp nhận nhiều cách gõ tiền", () => {
    expect(parsePriceInput("30000")).toBe(30000);
    expect(parsePriceInput("30.000")).toBe(30000);
    expect(parsePriceInput(" 30.000đ ")).toBe(30000);
    expect(parsePriceInput("30,000")).toBe(30000);
    expect(parsePriceInput(String(MAX_PRICE))).toBe(500000);
  });
  it("từ chối giá trị không hợp lệ", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("0")).toBeNull();
    expect(parsePriceInput("-5000")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
    expect(parsePriceInput("25,5")).toBeNull();
    expect(parsePriceInput("2.50")).toBeNull();
    expect(parsePriceInput(String(MAX_PRICE + 1))).toBeNull();
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
