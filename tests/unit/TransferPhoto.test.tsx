import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PhotoImg, TransferPhotoThumb } from "@/components/TransferPhoto";

const PHOTO = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";

describe("TransferPhoto", () => {
  it("ảnh không tải được thì báo tại chỗ", () => {
    render(<PhotoImg publicId={PHOTO} width={480} />);
    fireEvent.error(screen.getByRole("img", { name: "Ảnh chuyển khoản" }));
    expect(screen.getByText("Không tải được ảnh.")).toBeInTheDocument();
  });

  it("ảnh nhỏ bấm vào thì xem to, Đóng thì tắt", async () => {
    const user = userEvent.setup();
    render(<TransferPhotoThumb publicId={PHOTO} />);
    await user.click(screen.getByRole("button", { name: "Xem ảnh chuyển khoản" }));
    const viewer = screen.getByRole("dialog", { name: "Ảnh chuyển khoản" });
    expect(within(viewer).getByRole("img", { name: "Ảnh chuyển khoản" }).getAttribute("src")).toContain("w_1200");
    await user.click(within(viewer).getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
