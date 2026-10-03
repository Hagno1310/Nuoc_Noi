import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinForm } from "@/components/admin/PinForm";

describe("PinForm", () => {
  it("hai lần nhập không khớp thì báo lỗi", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<PinForm onSave={onSave} />);
    await user.type(screen.getByLabelText("PIN quán mới"), "111111");
    await user.type(screen.getByLabelText("Nhập lại PIN"), "222222");
    await user.click(screen.getByRole("button", { name: "Đổi PIN quán" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("không khớp");
  });

  it("PIN hợp lệ thì phải xác nhận lần hai mới lưu", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    render(<PinForm onSave={onSave} />);
    await user.type(screen.getByLabelText("PIN quán mới"), "654321");
    await user.type(screen.getByLabelText("Nhập lại PIN"), "654321");
    await user.click(screen.getByRole("button", { name: "Đổi PIN quán" }));
    expect(onSave).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole("button", { name: "Chắc chắn đổi PIN?" }),
    );
    expect(onSave).toHaveBeenCalledWith("654321");
    expect(await screen.findByText(/Đã đổi PIN quán/)).toBeInTheDocument();
  });
});
