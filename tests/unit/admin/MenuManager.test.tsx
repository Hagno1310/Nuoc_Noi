import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MenuManager, type OwnerMenuItem } from "@/components/admin/MenuManager";

const db = vi.hoisted(() => ({ insert: vi.fn(), update: vi.fn(), eq: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({
  getBrowserSupabase: () => ({ from: () => ({ insert: db.insert, update: db.update }) }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const items: OwnerMenuItem[] = [
  { id: "a", name: "BeSpoke", price: 190000, sort_order: 1, is_archived: false },
  { id: "b", name: "Classic", price: 190000, sort_order: 2, is_archived: false },
  { id: "c", name: "Classic", price: 150000, sort_order: 3, is_archived: true },
];

beforeEach(() => {
  db.insert.mockReset().mockResolvedValue({ error: null });
  db.eq.mockReset().mockResolvedValue({ error: null });
  db.update.mockReset().mockImplementation(() => ({ eq: db.eq }));
});

describe("MenuManager", () => {
  it("thêm món hợp lệ, đứng cuối thực đơn", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món mới"), "  Highball ");
    await user.type(screen.getByLabelText("Giá món mới"), "120.000");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).toHaveBeenCalledWith({ name: "Highball", price: 120000, sort_order: 4 });
  });

  it("không thêm món trùng tên món đang bán", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món mới"), " classic ");
    await user.type(screen.getByLabelText("Giá món mới"), "100000");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Đã có món đang bán tên này. Đặt tên khác.");
  });

  it("không thêm món có giá ngoài khoảng", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món mới"), "Shot");
    await user.type(screen.getByLabelText("Giá món mới"), "999");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });

  it("đổi giá một món", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Đổi giá BeSpoke" }));
    const input = screen.getByLabelText("Giá mới cho BeSpoke");
    await user.clear(input);
    await user.type(input, "200.000");
    await user.click(screen.getByRole("button", { name: "Lưu" }));
    expect(db.update).toHaveBeenCalledWith({ price: 200000 });
    expect(db.eq).toHaveBeenCalledWith("id", "a");
  });

  it("ẩn món cần bấm hai lần", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Ẩn BeSpoke" }));
    expect(db.update).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Chắc chắn ẩn BeSpoke?" }));
    expect(db.update).toHaveBeenCalledWith({ is_archived: true });
    expect(db.eq).toHaveBeenCalledWith("id", "a");
  });

  it("hiện lại món đã ẩn trùng tên món đang bán thì báo trước khi gọi server", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByText("Món đã ẩn (1)"));
    await user.click(screen.getByRole("button", { name: "Hiện lại Classic" }));
    expect(db.update).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Đã có món đang bán tên này. Đặt tên khác.");
  });

  it("đổi chỗ hai món bằng hai lệnh, mỗi lệnh một dòng", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Đưa Classic lên" }));
    expect(db.update).toHaveBeenNthCalledWith(1, { sort_order: 1 });
    expect(db.eq).toHaveBeenNthCalledWith(1, "id", "b");
    expect(db.update).toHaveBeenNthCalledWith(2, { sort_order: 2 });
    expect(db.eq).toHaveBeenNthCalledWith(2, "id", "a");
  });

  it("thực đơn trống vẫn có hướng dẫn và form thêm món", () => {
    render(<MenuManager items={[]} />);
    expect(screen.getByText("Chưa có món nào đang bán. Thêm món ở ô bên dưới.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm món" })).toBeEnabled();
  });
});
