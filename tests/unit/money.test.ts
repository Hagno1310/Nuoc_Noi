import { describe, expect, it } from "vitest";
import { formatVnd } from "@/lib/money";

describe("formatVnd", () => {
  it("định dạng hàng nghìn bằng dấu chấm và hậu tố đ", () => {
    expect(formatVnd(25000)).toBe("25.000đ");
    expect(formatVnd(175000)).toBe("175.000đ");
    expect(formatVnd(1250000)).toBe("1.250.000đ");
  });
  it("số nhỏ và số 0", () => {
    expect(formatVnd(0)).toBe("0đ");
    expect(formatVnd(500)).toBe("500đ");
  });
});
