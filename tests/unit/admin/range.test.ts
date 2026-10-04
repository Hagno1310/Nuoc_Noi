import { describe, expect, it } from "vitest";
import { normalizeRange, parsePage } from "@/lib/admin/range";

describe("normalizeRange", () => {
  const today = "2026-10-03";
  it("mặc định là hôm nay", () => {
    expect(normalizeRange(undefined, undefined, today)).toEqual({
      from: today,
      to: today,
    });
  });
  it("ngày không hợp lệ thì thay bằng hôm nay", () => {
    expect(normalizeRange("2026-02-30", "abc", today)).toEqual({
      from: today,
      to: today,
    });
  });
  it("đảo lại nếu từ ngày lớn hơn đến ngày", () => {
    expect(normalizeRange("2026-10-31", "2026-10-01", today)).toEqual({
      from: "2026-10-01",
      to: "2026-10-31",
    });
  });
});

describe("parsePage", () => {
  it("chỉ nhận số nguyên từ 1 trở lên", () => {
    expect(parsePage("3")).toBe(3);
    expect(parsePage("0")).toBe(1);
    expect(parsePage("-2")).toBe(1);
    expect(parsePage("abc")).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });
});
