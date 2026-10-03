import { describe, expect, it } from "vitest";
import { getMyOrderIds, rememberOrder } from "@/lib/order/myOrders";

const HOUR = 3_600_000;

describe("myOrders", () => {
  it("nhớ đơn, mới nhất ở đầu, không trùng", () => {
    rememberOrder("a", 1000);
    rememberOrder("b", 2000);
    rememberOrder("a", 3000);
    expect(getMyOrderIds(3000)).toEqual(["a", "b"]);
  });

  it("bỏ đơn cũ hơn 36 giờ", () => {
    rememberOrder("old", 0);
    rememberOrder("new", 37 * HOUR);
    expect(getMyOrderIds(37 * HOUR)).toEqual(["new"]);
  });

  it("giữ tối đa 100 đơn", () => {
    for (let i = 0; i < 120; i++) rememberOrder(`o${i}`, i);
    const ids = getMyOrderIds(200);
    expect(ids).toHaveLength(100);
    expect(ids[0]).toBe("o119");
  });

  it("dữ liệu hỏng thì coi như rỗng", () => {
    localStorage.setItem("pos.myOrders", "{không phải json");
    expect(getMyOrderIds()).toEqual([]);
  });
});
