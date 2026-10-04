import { describe, expect, it } from "vitest";
import { elapsedHours, openWindow } from "@/lib/admin/businessDay";

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

describe("openWindow", () => {
  // Mở 20:00, đóng 02:00: 6 tiếng (SRS FR-05b, FR-06)
  it("đầu giờ mở cửa là 0", () => {
    expect(openWindow(vn("2026-10-04T20:00:00"), 20, 2)).toEqual({
      fraction: 0,
      closed: false,
    });
  });
  it("23:00 là nửa khoảng mở cửa", () => {
    expect(openWindow(vn("2026-10-04T23:00:00"), 20, 2)).toEqual({
      fraction: 0.5,
      closed: false,
    });
  });
  it("đúng giờ đóng cửa là đầy và đã đóng", () => {
    expect(openWindow(vn("2026-10-05T02:00:00"), 20, 2)).toEqual({
      fraction: 1,
      closed: true,
    });
  });
  it("ban ngày vẫn đầy và đã đóng", () => {
    expect(openWindow(vn("2026-10-05T14:00:00"), 20, 2)).toEqual({
      fraction: 1,
      closed: true,
    });
  });
  it("quán mở và đóng trong cùng ngày", () => {
    expect(openWindow(vn("2026-10-05T09:00:00"), 7, 11)).toEqual({
      fraction: 0.5,
      closed: false,
    });
  });
});
