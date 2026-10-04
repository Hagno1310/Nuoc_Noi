import { useReducer } from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuantityPad } from "@/components/order/QuantityPad";
import { quantityReducer } from "@/lib/order/quantity";

function Harness() {
  const [q, dispatch] = useReducer(quantityReducer, 0);
  return <QuantityPad quantity={q} dispatch={dispatch} />;
}

describe("QuantityPad", () => {
  it("bấm +5 rồi +2 ra 7, -1 ra 6, Xóa ra 0", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Số lượng cốc");
    await user.click(screen.getByRole("button", { name: "+5" }));
    await user.click(screen.getByRole("button", { name: "+2" }));
    expect(input).toHaveValue("7");
    await user.click(screen.getByRole("button", { name: "−1" }));
    expect(input).toHaveValue("6");
    await user.click(screen.getByRole("button", { name: "Xóa" }));
    expect(input).toHaveValue("");
  });

  it("gõ trực tiếp bằng bàn phím số", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText("Số lượng cốc");
    await user.type(input, "9999");
    expect(input).toHaveValue("500");
  });
});
