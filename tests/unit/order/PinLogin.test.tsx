import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PinLogin } from "@/components/order/PinLogin";

async function typePin(user: ReturnType<typeof userEvent.setup>, pin: string) {
  for (const d of pin)
    await user.click(screen.getByRole("button", { name: d }));
}

describe("PinLogin", () => {
  it("chỉ bật nút Vào khi đã nhập đủ 6 số", async () => {
    const user = userEvent.setup();
    render(<PinLogin onLogin={vi.fn()} />);
    await typePin(user, "12345");
    expect(screen.getByRole("button", { name: "Vào" })).toBeDisabled();
    await typePin(user, "6");
    expect(screen.getByRole("button", { name: "Vào" })).toBeEnabled();
  });

  it("gửi PIN đã nhập", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(null);
    render(<PinLogin onLogin={onLogin} />);
    await typePin(user, "123456");
    await user.click(screen.getByRole("button", { name: "Vào" }));
    expect(onLogin).toHaveBeenCalledWith("123456");
  });

  it("có lỗi thì hiện thông báo và xóa PIN đã nhập", async () => {
    const user = userEvent.setup();
    render(<PinLogin onLogin={vi.fn().mockResolvedValue("Sai mã PIN.")} />);
    await typePin(user, "000000");
    await user.click(screen.getByRole("button", { name: "Vào" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sai mã PIN.");
    expect(screen.getByRole("button", { name: "Vào" })).toBeDisabled();
  });

  it("nút Xóa số bỏ chữ số cuối", async () => {
    const user = userEvent.setup();
    render(<PinLogin onLogin={vi.fn()} />);
    await typePin(user, "123456");
    await user.click(screen.getByRole("button", { name: "Xóa số" }));
    expect(screen.getByRole("button", { name: "Vào" })).toBeDisabled();
  });
});
