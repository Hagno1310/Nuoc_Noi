import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PriceHistory } from "@/components/admin/PriceHistory";

const me = { id: "u1", email: "owner@quan.vn" };

describe("PriceHistory", () => {
  it("chưa có lần đổi giá nào", () => {
    render(<PriceHistory rows={[]} failed={false} user={me} />);
    expect(screen.getByText("Chưa có lần đổi giá nào.")).toBeInTheDocument();
  });

  it("không tải được lịch sử thì báo lỗi riêng", () => {
    render(<PriceHistory rows={[]} failed user={me} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Không tải được lịch sử đổi giá. Kiểm tra mạng rồi tải lại trang.",
    );
  });

  it("mỗi dòng có tên món, giá và người đổi", () => {
    render(
      <PriceHistory
        rows={[
          { id: 2, price: 200000, effective_from: "2026-10-05T14:00:00Z", changed_by: "u1", menu_items: { name: "Classic" } },
          { id: 1, price: 190000, effective_from: "2026-10-05T13:00:00Z", changed_by: null, menu_items: [{ name: "BeSpoke" }] },
        ]}
        failed={false}
        user={me}
      />,
    );
    expect(screen.getByText("Classic")).toBeInTheDocument();
    expect(screen.getByText("200.000đ")).toBeInTheDocument();
    expect(screen.getByText("owner@quan.vn")).toBeInTheDocument();
    expect(screen.getByText("BeSpoke")).toBeInTheDocument();
    expect(screen.getByText("Khởi tạo")).toBeInTheDocument();
  });
});
