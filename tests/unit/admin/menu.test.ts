import { describe, expect, it } from "vitest";
import {
  changerLabel,
  menuNameError,
  nextSortOrder,
  normalizeMenuName,
} from "@/lib/admin/menu";

const items = [
  { id: "a", name: "Classic", is_archived: false, sort_order: 2 },
  { id: "b", name: "Neat", is_archived: false, sort_order: 5 },
  { id: "c", name: "Highball", is_archived: true, sort_order: 9 },
];

describe("normalizeMenuName", () => {
  it("bỏ khoảng trắng đầu/cuối và gộp khoảng trắng giữa", () => {
    expect(normalizeMenuName("  Bình   Zax ")).toBe("Bình Zax");
  });
});

describe("menuNameError", () => {
  it("tên rỗng", () => {
    expect(menuNameError("   ", items)).toBe("Nhập tên món trước khi lưu.");
  });
  it("trùng tên món đang bán, không phân biệt hoa thường và khoảng trắng", () => {
    expect(menuNameError(" classic ", items)).toBe("Đã có món đang bán tên này. Đặt tên khác.");
  });
  it("tên của món đã ẩn dùng lại được", () => {
    expect(menuNameError("Highball", items)).toBeNull();
  });
  it("đổi tên thành chính nó (khác hoa thường) không bị coi là trùng", () => {
    expect(menuNameError("CLASSIC", items, "a")).toBeNull();
  });
  it("hiện lại món đã ẩn trùng tên món đang bán thì báo trùng", () => {
    const withDup = [...items, { id: "d", name: "Neat", is_archived: true, sort_order: 10 }];
    expect(menuNameError("Neat", withDup, "d")).toBe("Đã có món đang bán tên này. Đặt tên khác.");
  });
});

describe("nextSortOrder", () => {
  it("lớn hơn mọi món, kể cả món đã ẩn", () => {
    expect(nextSortOrder(items)).toBe(10);
    expect(nextSortOrder([])).toBe(1);
  });
});

describe("changerLabel", () => {
  const me = { id: "u1", email: "owner@quan.vn" };
  it("giá khởi tạo", () => expect(changerLabel(null, me)).toBe("Khởi tạo"));
  it("chủ quán đang đăng nhập", () => expect(changerLabel("u1", me)).toBe("owner@quan.vn"));
  it("tài khoản chủ quán khác", () => expect(changerLabel("u2", me)).toBe("Chủ quán khác"));
});
