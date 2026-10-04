import { describe, expect, it } from "vitest";
import { MAX_QUANTITY, quantityReducer } from "@/lib/order/quantity";

describe("quantityReducer", () => {
  it("các nút + cộng dồn", () => {
    let q = quantityReducer(0, { type: "add", amount: 5 });
    q = quantityReducer(q, { type: "add", amount: 2 });
    expect(q).toBe(7);
  });
  it("không vượt quá MAX_QUANTITY", () => {
    expect(quantityReducer(495, { type: "add", amount: 10 })).toBe(
      MAX_QUANTITY,
    );
  });
  it("-1 không xuống dưới 0", () => {
    expect(quantityReducer(1, { type: "decrement" })).toBe(0);
    expect(quantityReducer(0, { type: "decrement" })).toBe(0);
  });
  it("clear đưa về 0", () => {
    expect(quantityReducer(42, { type: "clear" })).toBe(0);
  });
  it("set chỉ nhận chữ số và chặn ở MAX_QUANTITY", () => {
    expect(quantityReducer(0, { type: "set", raw: "12" })).toBe(12);
    expect(quantityReducer(0, { type: "set", raw: "1a2" })).toBe(12);
    expect(quantityReducer(5, { type: "set", raw: "" })).toBe(0);
    expect(quantityReducer(0, { type: "set", raw: "9999" })).toBe(MAX_QUANTITY);
    expect(quantityReducer(0, { type: "set", raw: "-3" })).toBe(3);
  });
});
