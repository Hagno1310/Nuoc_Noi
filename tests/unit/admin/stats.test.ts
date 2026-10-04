import { describe, expect, it } from "vitest";
import { percentChange } from "@/lib/admin/stats";

describe("percentChange", () => {
  it("tính phần trăm làm tròn", () => {
    expect(percentChange(150000, 100000)).toBe(50);
    expect(percentChange(50000, 150000)).toBe(-67);
    expect(percentChange(100, 100)).toBe(0);
  });
  it("kỳ trước bằng 0 thì không tính phần trăm (SRS FR-06)", () => {
    expect(percentChange(50000, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
  });
});
