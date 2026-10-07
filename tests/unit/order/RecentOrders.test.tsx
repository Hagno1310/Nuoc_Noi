import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecentOrders } from "@/components/order/RecentOrders";
import type { MyOrder } from "@/lib/api";

const NOW = new Date("2026-10-07T14:00:00Z");
const PHOTO = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";
const order = (over: Partial<MyOrder>): MyOrder => ({
  id: "o1",
  item_count: 1,
  subtotal_amount: 190000,
  discount_percent: 0,
  discount_amount: 0,
  total_amount: 190000,
  seat_name: "Quầy 1",
  status: "paid",
  created_at: NOW.toISOString(),
  payment_method: "cash",
  transfer_photo_id: null,
  lines: [{ item_name: "Classic", unit_price: 190000, quantity: 1, line_amount: 190000 }],
  ...over,
});

describe("RecentOrders", () => {
  it("chỉ đơn chuyển khoản có nút xem ảnh; bấm thì mở ảnh toàn màn hình", async () => {
    const user = userEvent.setup();
    render(
      <RecentOrders
        orders={[order({ id: "o1", payment_method: "transfer", transfer_photo_id: PHOTO }), order({ id: "o2" })]}
        now={() => NOW}
        cancelBusy={false}
        cancellingId={null}
        onCancel={vi.fn()}
      />,
    );
    const buttons = screen.getAllByRole("button", { name: "Xem ảnh chuyển khoản" });
    expect(buttons).toHaveLength(1);
    await user.click(buttons[0]);
    const viewer = screen.getByRole("dialog", { name: "Ảnh chuyển khoản" });
    expect(within(viewer).getByRole("img", { name: "Ảnh chuyển khoản" }).getAttribute("src")).toContain(PHOTO);
    await user.click(within(viewer).getByRole("button", { name: "Đóng" }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
