import { describe, expect, it } from "vitest";
import { hourUpdates } from "@/lib/admin/businessHours";

describe("hourUpdates", () => {
  it("chỉ lưu giờ đã đổi", () => {
    expect(hourUpdates({ start: 20, end: 2 }, { start: 19, end: 2 })).toEqual({ steps: ["start"] });
    expect(hourUpdates({ start: 20, end: 2 }, { start: 20, end: 3 })).toEqual({ steps: ["end"] });
    expect(hourUpdates({ start: 20, end: 2 }, { start: 20, end: 2 })).toEqual({ steps: [] });
  });

  it("giờ mở cửa mới trùng giờ đóng cửa cũ thì lưu giờ đóng cửa trước, để server không từ chối giữa chừng", () => {
    expect(hourUpdates({ start: 20, end: 2 }, { start: 2, end: 4 })).toEqual({ steps: ["end", "start"] });
    expect(hourUpdates({ start: 20, end: 2 }, { start: 21, end: 3 })).toEqual({ steps: ["start", "end"] });
  });

  it("không cho trùng nhau, và đổi chéo thì báo đổi từng giờ một", () => {
    expect(hourUpdates({ start: 20, end: 2 }, { start: 5, end: 5 })).toEqual({
      error: "Giờ mở cửa không được trùng giờ đóng cửa.",
    });
    expect(hourUpdates({ start: 20, end: 2 }, { start: 2, end: 20 })).toEqual({
      error: "Đổi từng giờ một: lưu giờ mở cửa trước, rồi đổi giờ đóng cửa.",
    });
  });
});
