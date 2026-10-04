import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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
    await user.type(screen.getByLabelText("Tên món"), "  Highball ");
    await user.type(screen.getByLabelText("Giá"), "120.000");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).toHaveBeenCalledWith({ name: "Highball", price: 120000, sort_order: 4 });
  });

  it("không thêm món trùng tên món đang bán", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món"), " classic ");
    await user.type(screen.getByLabelText("Giá"), "100000");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Đã có món đang bán tên này. Đặt tên khác.");
  });

  it("không thêm món có giá ngoài khoảng", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.type(screen.getByLabelText("Tên món"), "Shot");
    await user.type(screen.getByLabelText("Giá"), "999");
    await user.click(screen.getByRole("button", { name: "Thêm món" }));
    expect(db.insert).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });

  it("chạm vào giá để sửa tại chỗ, Enter là lưu", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Sửa giá BeSpoke" }));
    const input = screen.getByLabelText("Giá mới cho BeSpoke");
    await user.clear(input);
    await user.type(input, "200.000{Enter}");
    expect(db.update).toHaveBeenCalledWith({ price: 200000 });
    expect(db.eq).toHaveBeenCalledWith("id", "a");
  });

  it("chạm vào tên để sửa tại chỗ, Esc là hủy", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Sửa tên BeSpoke" }));
    await user.type(screen.getByLabelText("Tên mới cho BeSpoke"), " Đêm{Escape}");
    expect(db.update).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Tên mới cho BeSpoke")).toBeNull();
  });

  it("lỗi khi sửa giá hiện ngay dưới ô đang sửa", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Sửa giá BeSpoke" }));
    const input = screen.getByLabelText("Giá mới cho BeSpoke");
    await user.clear(input);
    await user.type(input, "999{Enter}");
    expect(db.update).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("nút ⋯ cuối mỗi hàng mở hộp thoại sửa tên và giá giữa màn hình", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    expect(screen.getByRole("button", { name: "Sửa Classic" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sửa BeSpoke" }));
    const dialog = screen.getByRole("dialog", { name: "BeSpoke" });
    const name = within(dialog).getByLabelText("Tên món");
    const price = within(dialog).getByLabelText("Giá");
    expect(name).toHaveValue("BeSpoke");
    await user.clear(name);
    await user.type(name, "BeSpoke Đêm");
    await user.clear(price);
    await user.type(price, "210.000");
    await user.click(within(dialog).getByRole("button", { name: "Lưu" }));
    expect(db.update).toHaveBeenCalledWith({ name: "BeSpoke Đêm" });
    expect(db.update).toHaveBeenCalledWith({ price: 210000 });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("hộp thoại báo lỗi tại chỗ và không đóng khi giá sai", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Sửa BeSpoke" }));
    const dialog = screen.getByRole("dialog", { name: "BeSpoke" });
    await user.clear(within(dialog).getByLabelText("Giá"));
    await user.type(within(dialog).getByLabelText("Giá"), "999");
    await user.click(within(dialog).getByRole("button", { name: "Lưu" }));
    expect(db.update).not.toHaveBeenCalled();
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.");
  });

  it("Ẩn món trong hộp thoại cần bấm hai lần, nằm xa nút Lưu và có màu nguy hiểm", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByRole("button", { name: "Sửa BeSpoke" }));
    const dialog = screen.getByRole("dialog", { name: "BeSpoke" });
    const hide = within(dialog).getByRole("button", { name: "Ẩn món" });
    expect(hide.className).toContain("text-danger");
    await user.click(hide);
    expect(db.update).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Chắc chắn ẩn?" }));
    expect(db.update).toHaveBeenCalledWith({ is_archived: true });
    expect(db.eq).toHaveBeenCalledWith("id", "a");
  });

  it("hiện lại món đã ẩn trùng tên món đang bán thì báo trước khi gọi server", async () => {
    const user = userEvent.setup();
    render(<MenuManager items={items} />);
    await user.click(screen.getByText("Món đã ẩn (1)"));
    await user.click(screen.getByRole("button", { name: "Hiện lại Classic" }));
    expect(db.update).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Đã có món đang bán tên này. Đổi tên hoặc ẩn món đang bán đó rồi hiện lại.",
    );
  });

  it("đổi thứ tự bằng tay cầm (phím mũi tên): đánh số lại, mỗi lệnh một dòng", () => {
    render(<MenuManager items={items} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Kéo để đổi thứ tự Classic" }), { key: "ArrowUp" });
    expect(db.update).toHaveBeenNthCalledWith(1, { sort_order: 1 });
    expect(db.eq).toHaveBeenNthCalledWith(1, "id", "b");
  });

  it("hai món trùng thứ tự thì đánh số lại, chỉ hàng đổi số mới được gửi", () => {
    const tied: OwnerMenuItem[] = [
      { id: "a", name: "BeSpoke", price: 190000, sort_order: 1, is_archived: false },
      { id: "b", name: "Classic", price: 190000, sort_order: 1, is_archived: false },
      { id: "c", name: "Neat", price: 100000, sort_order: 3, is_archived: true },
    ];
    render(<MenuManager items={tied} />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Kéo để đổi thứ tự Classic" }), { key: "ArrowUp" });
    expect(db.update).toHaveBeenCalledTimes(1);
    expect(db.update).toHaveBeenCalledWith({ sort_order: 2 });
    expect(db.eq).toHaveBeenCalledWith("id", "a");
  });

  it("thực đơn trống vẫn có hướng dẫn và form thêm món", () => {
    render(<MenuManager items={[]} />);
    expect(screen.getByText("Chưa có món nào đang bán. Thêm món ở ô bên dưới.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thêm món" })).toBeEnabled();
  });
});
