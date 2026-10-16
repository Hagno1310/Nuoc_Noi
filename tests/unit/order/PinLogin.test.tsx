import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinLogin } from "@/components/order/PinLogin";

async function typePin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const d of pin) await user.click(screen.getByRole("button", { name: d }));
}

describe("PinLogin", () => {
  it("đủ 6 số thì tự gửi PIN", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(null);
    render(<PinLogin onLogin={onLogin} />);
    await typePin(user, "12345");
    expect(onLogin).not.toHaveBeenCalled();
    await typePin(user, "6");
    expect(onLogin).toHaveBeenCalledWith("123456");
  });

  it("có lỗi thì hiện thông báo và xóa PIN đã nhập", async () => {
    const user = userEvent.setup();
    render(<PinLogin onLogin={vi.fn().mockResolvedValue("Sai mã PIN.")} />);
    await typePin(user, "000000");
    expect(await screen.findByRole("alert")).toHaveTextContent("Sai mã PIN.");
    expect(screen.getByText("Đã nhập 0 trên 6 số")).toBeInTheDocument();
  });

  it("nút Xóa số bỏ chữ số cuối", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<PinLogin onLogin={onLogin} />);
    await typePin(user, "12345");
    await user.click(screen.getByRole("button", { name: "Xóa số" }));
    await typePin(user, "6");
    expect(onLogin).not.toHaveBeenCalled();
    expect(screen.getByText("Đã nhập 5 trên 6 số")).toBeInTheDocument();
  });
});
