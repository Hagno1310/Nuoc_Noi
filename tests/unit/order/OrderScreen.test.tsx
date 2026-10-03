import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  OrderScreen,
  type OrderScreenProps,
} from "@/components/order/OrderScreen";
import {
  NetworkError,
  RpcError,
  type CreateOrderInput,
  type CreatedOrder,
  type StaffApi,
} from "@/lib/api";
import { getMyOrderIds } from "@/lib/order/myOrders";

const NOW = new Date("2026-10-03T05:00:00Z");

const created = (
  i: CreateOrderInput,
  over: Partial<CreatedOrder> = {},
): CreatedOrder => ({
  id: i.id,
  unit_price: 25000,
  total_amount: i.quantity * 25000,
  price_changed: false,
  created_at: NOW.toISOString(),
  business_date: "2026-10-03",
  duplicate: false,
  ...over,
});

function setup(
  overrides: Partial<OrderScreenProps> = {},
  apiOverrides: Partial<StaffApi> = {},
) {
  const api: StaffApi = {
    createOrder: vi.fn(async (i: CreateOrderInput) => created(i)),
    cancelOrder: vi.fn(async () => {}),
    listOrdersByIds: vi.fn(async () => []),
    listActiveSeats: vi.fn(async () => [
      { id: "s1", name: "Quầy 1", kind: "counter" as const },
      { id: "t1", name: "Bàn 1", kind: "table" as const },
    ]),
    ...apiOverrides,
  };
  let n = 0;
  const props: OrderScreenProps = {
    api,
    price: 25000,
    online: true,
    onUnauthorized: vi.fn(),
    newId: () => `order-${++n}`,
    now: () => NOW,
    ...overrides,
  };
  const user = userEvent.setup();
  const utils = render(<OrderScreen {...props} />);
  return { api, props, user, ...utils };
}

describe("OrderScreen", () => {
  it("hiện thành tiền trước khi xác nhận, gửi đơn, rồi reset và nhớ đơn", async () => {
    const { api, user } = setup();
    await user.click(screen.getByRole("button", { name: "+5" }));
    await user.click(screen.getByRole("button", { name: "+2" }));
    expect(screen.getByTestId("total")).toHaveTextContent("175.000đ");
    await user.click(await screen.findByRole("button", { name: "Quầy 1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));

    expect(api.createOrder).toHaveBeenCalledWith({
      id: "order-1",
      quantity: 7,
      seatId: "s1",
      isTakeaway: false,
      clientPrice: 25000,
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Đã tạo đơn 7 cốc – 175.000đ",
    );
    expect(screen.getByLabelText("Số lượng cốc")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Quầy 1" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(getMyOrderIds()).toEqual(["order-1"]);
  });

  it("chia chỗ ngồi thành hai nhóm Ghế quầy và Bàn, ghế quầy đứng trước", async () => {
    setup();
    const counterGroup = await screen.findByRole("group", { name: "Ghế quầy" });
    const tableGroup = screen.getByRole("group", { name: "Bàn" });
    expect(
      within(counterGroup).getByRole("button", { name: "Quầy 1" }),
    ).toBeInTheDocument();
    expect(
      within(tableGroup).getByRole("button", { name: "Bàn 1" }),
    ).toBeInTheDocument();
    expect(
      counterGroup.compareDocumentPosition(tableGroup) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Mang về" })).toBeInTheDocument();
  });

  it("khóa nút Xác nhận khi số lượng bằng 0 hoặc chưa có giá", () => {
    setup({ price: null });
    expect(screen.getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
  });

  it("mất mạng: khóa nút và hiện cảnh báo", async () => {
    const { user } = setup({ online: false });
    await user.click(screen.getByRole("button", { name: "+1" }));
    expect(screen.getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
    expect(
      screen.getByText("Mất mạng – chưa gửi được đơn"),
    ).toBeInTheDocument();
  });

  it("gửi thất bại vì mạng thì giữ dữ liệu, bấm lại dùng cùng id", async () => {
    const createOrder = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const { user } = setup({}, { createOrder });
    await user.click(screen.getByRole("button", { name: "+2" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("kiểm tra mạng");
    expect(screen.getByLabelText("Số lượng cốc")).toHaveValue("2");

    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByRole("status");
    expect(createOrder.mock.calls.map((c) => c[0].id)).toEqual([
      "order-1",
      "order-1",
    ]);
  });

  it("server báo đơn đã được ghi từ lần gửi trước", async () => {
    const { user } = setup(
      {},
      {
        createOrder: vi.fn(async (i: CreateOrderInput) =>
          created(i, { duplicate: true, total_amount: 75000 }),
        ),
      },
    );
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "đã được ghi từ lần gửi trước (3 cốc)",
    );
  });

  it("server tính giá khác thì báo cho nhân viên", async () => {
    const { user } = setup(
      {},
      {
        createOrder: vi.fn(async (i: CreateOrderInput) =>
          created(i, {
            unit_price: 30000,
            total_amount: 30000,
            price_changed: true,
          }),
        ),
      },
    );
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Giá đã đổi: đơn được tính 30.000đ/cốc, thành tiền 30.000đ.",
    );
  });

  it("Hoàn tác gọi cancelOrder", async () => {
    const { api, user } = setup();
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(await screen.findByRole("button", { name: "Hoàn tác" }));
    await waitFor(() =>
      expect(api.cancelOrder).toHaveBeenCalledWith("order-1"),
    );
  });

  it("gửi thành công thì rung 30ms", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", {
      value: vibrate,
      configurable: true,
    });
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByRole("status");
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it("chạm phím số lượng khi đang hiện phản hồi thì thanh trở lại Xác nhận", async () => {
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: "+1" }));
    await user.click(screen.getByRole("button", { name: "Xác nhận đơn" }));
    await screen.findByRole("button", { name: "Hoàn tác" });
    await user.click(screen.getByRole("button", { name: "+2" }));
    expect(
      screen.queryByRole("button", { name: "Hoàn tác" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xác nhận đơn" })).toBeEnabled();
  });

  it("chỉ hiện nút Hủy cho đơn còn trong cửa sổ hủy 5 phút", async () => {
    // getMyOrderIds lọc theo đồng hồ thật, nên `at` dùng Date.now() chứ không dùng NOW
    localStorage.setItem(
      "pos.myOrders",
      JSON.stringify([
        { id: "new", at: Date.now() },
        { id: "old", at: Date.now() },
      ]),
    );
    setup(
      {},
      {
        listOrdersByIds: vi.fn(async () => [
          {
            id: "new",
            quantity: 1,
            unit_price: 25000,
            total_amount: 25000,
            seat_name: null,
            status: "paid" as const,
            created_at: new Date(NOW.getTime() - 60_000).toISOString(),
          },
          {
            id: "old",
            quantity: 2,
            unit_price: 25000,
            total_amount: 50000,
            seat_name: "Quầy 1",
            status: "paid" as const,
            created_at: new Date(NOW.getTime() - 6 * 60_000).toISOString(),
          },
        ]),
      },
    );
    const list = await screen.findByRole("region", { name: "Đơn vừa tạo" });
    await waitFor(() => expect(list.querySelectorAll("li")).toHaveLength(2));
    expect(screen.getAllByRole("button", { name: "Hủy" })).toHaveLength(1);
  });

  it("phiên bị thu hồi (FORBIDDEN) thì gọi onUnauthorized", async () => {
    const { props } = setup(
      {},
      {
        listActiveSeats: vi.fn(async () => {
          throw new RpcError("FORBIDDEN");
        }),
      },
    );
    await waitFor(() => expect(props.onUnauthorized).toHaveBeenCalled());
  });
});
