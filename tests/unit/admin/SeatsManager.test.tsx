import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SeatsManager, type OwnerSeat } from "@/components/admin/SeatsManager";

const db = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  getBrowserSupabase: () => ({ from: () => ({ insert: db.insert, update: db.update }) }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const seats: OwnerSeat[] = [
  { id: "q1", name: "Quầy 1", kind: "counter", sort_order: 1, is_archived: false },
  { id: "q2", name: "Quầy 2", kind: "counter", sort_order: 2, is_archived: false },
  { id: "b1", name: "Bàn 1", kind: "table", sort_order: 1, is_archived: false },
];

beforeEach(() => {
  db.insert.mockReset().mockResolvedValue({ error: null });
  db.eq.mockReset().mockResolvedValue({ error: null });
  db.update.mockReset().mockImplementation(() => ({ eq: db.eq }));
});

describe("SeatsManager", () => {
  it("đổi thứ tự chỉ trong cùng loại, bằng tay cầm", () => {
    render(<SeatsManager seats={seats} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Kéo để đổi thứ tự Quầy 2" }), { key: "ArrowUp" });
    expect(db.update).toHaveBeenCalledWith({ sort_order: 1 });
    expect(db.eq).toHaveBeenCalledWith("id", "q2");
    expect(db.eq).not.toHaveBeenCalledWith("id", "b1");
  });

  it("nút ⋯ mở hộp thoại đổi tên; Ẩn chỗ ngồi cần bấm hai lần", async () => {
    const user = userEvent.setup();
    render(<SeatsManager seats={seats} />);
    await user.click(screen.getByRole("button", { name: "Sửa Bàn 1" }));
    const dialog = screen.getByRole("dialog", { name: "Bàn 1" });
    await user.click(within(dialog).getByRole("button", { name: "Ẩn chỗ ngồi" }));
    expect(db.update).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Chắc chắn ẩn?" }));
    expect(db.update).toHaveBeenCalledWith({ is_archived: true });
    expect(db.eq).toHaveBeenCalledWith("id", "b1");
  });
});
