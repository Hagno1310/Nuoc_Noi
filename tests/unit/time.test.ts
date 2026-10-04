import { describe, expect, it } from "vitest";
import { formatIsoDate, formatVnDateTime, formatVnTime } from "@/lib/time";

describe("time helpers", () => {
  it("đổi UTC sang giờ Việt Nam", () => {
    expect(formatVnDateTime("2026-10-03T22:59:05Z")).toBe(
      "04/10/2026 05:59:05",
    );
    expect(formatVnTime("2026-10-03T22:59:05Z")).toBe("05:59");
  });
  it("định dạng ngày kinh doanh", () => {
    expect(formatIsoDate("2026-10-03")).toBe("03/10/2026");
  });
});
