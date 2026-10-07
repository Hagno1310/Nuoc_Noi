import { describe, expect, it, vi } from "vitest";
import { createStaffApi, menuFromError, NetworkError, RpcError, type RpcClient } from "@/lib/api";

function clientReturning(result: { data: unknown; error: { message: string; code?: string; details?: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as RpcClient, rpc };
}

describe("createStaffApi", () => {
  it("createOrder ánh xạ đúng tham số RPC, kèm hình thức thanh toán", async () => {
    const { client, rpc } = clientReturning({ data: { id: "o1" }, error: null });
    const api = createStaffApi(() => client);
    const base = {
      id: "o1",
      seatId: "s1",
      discountPercent: 10,
      lines: [{ menuItemId: "m1", quantity: 2, clientPrice: 190000 }],
    };
    await api.createOrder({ ...base, payment: { method: "cash" } });
    expect(rpc).toHaveBeenLastCalledWith("create_order", {
      p_id: "o1",
      p_seat_id: "s1",
      p_discount_percent: 10,
      p_lines: [{ menu_item_id: "m1", quantity: 2, client_price: 190000 }],
      p_payment_method: "cash",
      p_transfer_photo_id: null,
    });
    await api.createOrder({ ...base, payment: { method: "transfer", photoId: "nuoc-noi/transfer/x" } });
    expect(rpc).toHaveBeenLastCalledWith(
      "create_order",
      expect.objectContaining({ p_payment_method: "transfer", p_transfer_photo_id: "nuoc-noi/transfer/x" }),
    );
  });

  it("lỗi không có mã là lỗi mạng; lỗi có mã giữ cả details", async () => {
    const net = clientReturning({ data: null, error: { message: "fetch failed", code: "" } });
    await expect(createStaffApi(() => net.client).listActiveSeats()).rejects.toBeInstanceOf(NetworkError);
    const rpc = clientReturning({ data: null, error: { message: "MENU_CHANGED", code: "P0001", details: "[]" } });
    const err = await createStaffApi(() => rpc.client).listActiveSeats().catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.code).toBe("MENU_CHANGED");
    expect(err.details).toBe("[]");
  });

  it("client ném lỗi thì là lỗi mạng", async () => {
    const client = { rpc: vi.fn().mockRejectedValue(new Error("offline")) } as unknown as RpcClient;
    await expect(createStaffApi(() => client).cancelOrder("o1")).rejects.toBeInstanceOf(NetworkError);
  });

  it("listOrdersByIds rỗng thì không gọi server", async () => {
    const { client, rpc } = clientReturning({ data: [], error: null });
    expect(await createStaffApi(() => client).listOrdersByIds([])).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });
});

describe("menuFromError", () => {
  it("đọc thực đơn từ details của MENU_CHANGED", () => {
    const e = new RpcError("MENU_CHANGED", JSON.stringify([{ id: "m1", name: "Classic", price: 200000, is_archived: false }]));
    expect(menuFromError(e)).toEqual([{ id: "m1", name: "Classic", price: 200000, is_archived: false }]);
  });
  it("không phải MENU_CHANGED hoặc details hỏng thì null", () => {
    expect(menuFromError(new RpcError("SEAT_REQUIRED"))).toBeNull();
    expect(menuFromError(new RpcError("MENU_CHANGED", "{oops"))).toBeNull();
    expect(menuFromError(new Error("x"))).toBeNull();
  });
});
