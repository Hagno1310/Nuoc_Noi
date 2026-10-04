import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PriceForm } from "@/components/admin/PriceForm";

describe("PriceForm", () => {
  it("lưu giá hợp lệ dưới dạng số nguyên", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(null);
    render(<PriceForm currentPrice={25000} onSave={onSave} />);
    const input = screen.getByLabelText("Đơn giá chung mới (đ/cốc)");
    await user.clear(input);
    await user.type(input, "30.000");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSave).toHaveBeenCalledWith(30000);
    expect(
      await screen.findByText("Đã lưu đơn giá chung mới."),
    ).toBeInTheDocument();
  });

  it("báo lỗi và không lưu khi giá không hợp lệ", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<PriceForm currentPrice={25000} onSave={onSave} />);
    const input = screen.getByLabelText("Đơn giá chung mới (đ/cốc)");
    await user.clear(input);
    await user.type(input, "5.000.000");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Giá phải là số nguyên từ 1đ đến 500.000đ.",
    );
  });
});
