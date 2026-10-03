import { describe, expect, it } from "vitest";
import { elapsedHours } from "@/lib/admin/businessDay";

// Giờ VN = UTC+7
const vn = (iso: string) => new Date(`${iso}+07:00`);

describe("elapsedHours", () => {
  it("tính từ giờ mở cửa trong cùng buổi tối", () => {
    expect(elapsedHours(vn("2026-10-04T21:30:00"), 20)).toBe(1.5);
  });
  it("qua nửa đêm vẫn thuộc ngày kinh doanh trước", () => {
    expect(elapsedHours(vn("2026-10-05T01:00:00"), 20)).toBe(5);
  });
  it("ban ngày gần hết ngày kinh doanh", () => {
    expect(elapsedHours(vn("2026-10-05T19:00:00"), 20)).toBe(23);
  });
  it("đúng giờ mở cửa là bắt đầu ngày mới", () => {
    expect(elapsedHours(vn("2026-10-05T20:00:00"), 20)).toBe(0);
  });
});
