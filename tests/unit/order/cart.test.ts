import { describe, expect, it } from "vitest";
import {
  addItem,
  applyMenu,
  clearPriceFlags,
  decrement,
  discountAmount,
  itemCount,
  MAX_LINES,
  parseDiscountInput,
  parseQuantityInput,
  removeLine,
  setQuantity,
  subtotal,
  summarize,
  toPayload,
  type MenuItem,
} from "@/lib/order/cart";

const classic: MenuItem = { id: "m1", name: "Classic", price: 190000, sort_order: 1, is_archived: false };
const neat: MenuItem = { id: "m2", name: "Neat", price: 100000, sort_order: 2, is_archived: false };

describe("giỏ đơn", () => {
  it("chạm món là +1; món đã có thì cộng dồn", () => {
    const c = addItem(addItem(addItem([], classic), classic), neat);
    expect(c.map((l) => [l.menuItemId, l.quantity])).toEqual([["m1", 2], ["m2", 1]]);
    expect(itemCount(c)).toBe(3);
    expect(subtotal(c)).toBe(480000);
  });

  it("số lượng tối đa 99, tối đa 30 dòng", () => {
    let c = setQuantity(addItem([], classic), "m1", 99);
    expect(addItem(c, classic)[0].quantity).toBe(99);
    c = [];
    for (let i = 0; i < MAX_LINES + 2; i++) c = addItem(c, { ...classic, id: `x${i}` });
    expect(c).toHaveLength(MAX_LINES);
  });

  it("đặt số lượng: ngoài 1–99 hoặc không phải số nguyên thì giữ nguyên", () => {
    const c = addItem([], classic);
    expect(setQuantity(c, "m1", 0)).toBe(c);
    expect(setQuantity(c, "m1", 1.5)).toBe(c);
    expect(setQuantity(c, "m1", 150)[0].quantity).toBe(99);
  });

  it("bớt khi còn 1 thì xóa dòng; xóa dòng", () => {
    const c = addItem(addItem([], classic), neat);
    expect(decrement(c, "m1").map((l) => l.menuItemId)).toEqual(["m2"]);
    expect(removeLine(c, "m2").map((l) => l.menuItemId)).toEqual(["m1"]);
  });

  it("áp thực đơn mới: đổi giá thì đánh dấu, món ẩn hoặc mất thì gạch, hiện lại thì bỏ gạch", () => {
    const c = addItem(addItem([], classic), neat);
    const next = applyMenu(c, [
      { id: "m1", name: "Classic", price: 200000, is_archived: false },
      { id: "m2", name: "Neat", price: 100000, is_archived: true },
    ]);
    expect(next[0]).toMatchObject({ price: 200000, priceChanged: true, archived: false });
    expect(next[1]).toMatchObject({ archived: true, priceChanged: false });
    expect(applyMenu(next, [{ id: "m1", name: "Classic", price: 200000, is_archived: false }])[1].archived).toBe(true);
    expect(clearPriceFlags(next)[0].priceChanged).toBe(false);
    expect(applyMenu(next, [neat])[1].archived).toBe(false);
  });

  it("số tiền giảm cùng công thức với server: làm tròn xuống tới 1.000đ", () => {
    expect(discountAmount(480000, 10)).toBe(48000);
    expect(discountAmount(190000, 15)).toBe(28000);
    expect(discountAmount(100000, 100)).toBe(100000);
    expect(discountAmount(1500, 100)).toBe(1000);
    expect(discountAmount(75000, 10)).toBe(7000);
    expect(discountAmount(480000, 0)).toBe(0);
  });

  it("đọc ô số lượng và ô giảm giá", () => {
    expect(parseQuantityInput("5")).toBe(5);
    expect(parseQuantityInput(" 150 ")).toBe(99);
    expect(parseQuantityInput("0")).toBeNull();
    expect(parseQuantityInput("")).toBeNull();
    expect(parseQuantityInput("abc")).toBeNull();
    expect(parseQuantityInput("1.5")).toBeNull();
    expect(parseDiscountInput("10")).toBe(10);
    expect(parseDiscountInput("7%")).toBe(7);
    expect(parseDiscountInput("")).toBe(0);
    expect(parseDiscountInput("101")).toBeNull();
    expect(parseDiscountInput("-5")).toBeNull();
    expect(parseDiscountInput("7.5")).toBeNull();
  });

  it("tóm tắt dòng đơn và dữ liệu gửi server", () => {
    expect(summarize([{ item_name: "Classic", quantity: 2 }, { item_name: "Neat", quantity: 1 }])).toBe("2 Classic, 1 Neat");
    expect(summarize(null)).toBe("");
    expect(toPayload(addItem([], classic))).toEqual([{ menuItemId: "m1", quantity: 1, clientPrice: 190000 }]);
  });
});
