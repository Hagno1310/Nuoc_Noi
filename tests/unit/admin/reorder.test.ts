import { describe, expect, it } from "vitest";
import { moveItem, renumber } from "@/lib/admin/reorder";

const list = [
  { id: "a", sort_order: 1 },
  { id: "b", sort_order: 2 },
  { id: "c", sort_order: 3 },
];

describe("moveItem", () => {
  it("kéo một hàng sang vị trí mới, không đổi mảng gốc", () => {
    expect(moveItem(list, 2, 0).map((x) => x.id)).toEqual(["c", "a", "b"]);
    expect(list.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});

describe("renumber", () => {
  it("chỉ trả về các hàng đổi số, mỗi hàng một lệnh", () => {
    expect(renumber(moveItem(list, 2, 0))).toEqual([
      { id: "c", sort_order: 1 },
      { id: "a", sort_order: 2 },
      { id: "b", sort_order: 3 },
    ]);
    expect(renumber(list)).toEqual([]);
  });

  it("gỡ được hai hàng trùng số thứ tự", () => {
    expect(renumber([{ id: "a", sort_order: 1 }, { id: "b", sort_order: 1 }])).toEqual([
      { id: "b", sort_order: 2 },
    ]);
  });
});
