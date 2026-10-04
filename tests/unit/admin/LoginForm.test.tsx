import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/admin/LoginForm";

describe("LoginForm", () => {
  it("gửi email và mật khẩu", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn().mockResolvedValue(null);
    render(<LoginForm onLogin={onLogin} />);
    await user.type(screen.getByLabelText("Email"), "owner@quan.vn");
    await user.type(screen.getByLabelText("Mật khẩu"), "matkhau123");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(onLogin).toHaveBeenCalledWith("owner@quan.vn", "matkhau123");
  });

  it("hiện lỗi do onLogin trả về", async () => {
    const user = userEvent.setup();
    render(
      <LoginForm
        onLogin={vi.fn().mockResolvedValue("Sai email hoặc mật khẩu.")}
      />,
    );
    await user.type(screen.getByLabelText("Email"), "a@b.vn");
    await user.type(screen.getByLabelText("Mật khẩu"), "x");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Sai email hoặc mật khẩu.",
    );
  });
});
