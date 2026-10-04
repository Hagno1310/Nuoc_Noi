import { describe, expect, it, vi } from "vitest";
import {
  createStaffApi,
  NetworkError,
  RpcError,
  type RpcClient,
} from "@/lib/api";

function clientReturning(result: {
  data: unknown;
  error: { message: string; code?: string } | null;
}) {
  const rpc = vi.fn().mockResolvedValue(result);
  return { client: { rpc } as unknown as RpcClient, rpc };
}

describe("createStaffApi", () => {
  it("createOrder ánh xạ đúng tham số RPC", async () => {
    const created = {
      id: "o1",
      unit_price: 25000,
      total_amount: 175000,
      price_changed: false,
      created_at: "2026-10-03T05:00:00Z",
      business_date: "2026-10-03",
      duplicate: false,
    };
    const { client, rpc } = clientReturning({ data: created, error: null });
    const result = await createStaffApi(() => client).createOrder({
      id: "o1",
      quantity: 7,
      seatId: "s1",
      isTakeaway: false,
      clientPrice: 25000,
    });
    expect(result).toEqual(created);
    expect(rpc).toHaveBeenCalledWith("create_order", {
      p_id: "o1",
      p_quantity: 7,
      p_seat_id: "s1",
      p_is_takeaway: false,
      p_client_price: 25000,
    });
  });

  it("listOrdersByIds với danh sách rỗng thì không gọi server", async () => {
    const { client, rpc } = clientReturning({ data: [], error: null });
    expect(await createStaffApi(() => client).listOrdersByIds([])).toEqual([]);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("lỗi có mã SQLSTATE thành RpcError mang mã lỗi", async () => {
    const { client } = clientReturning({
      data: null,
      error: { message: "CANCEL_WINDOW_EXPIRED", code: "P0001" },
    });
    const err = await createStaffApi(() => client)
      .cancelOrder("o1")
      .catch((e) => e);
    expect(err).toBeInstanceOf(RpcError);
    expect(err.code).toBe("CANCEL_WINDOW_EXPIRED");
  });

  it("lỗi không có mã (fetch thất bại) thành NetworkError", async () => {
    const { client } = clientReturning({
      data: null,
      error: { message: "TypeError: Failed to fetch", code: "" },
    });
    await expect(
      createStaffApi(() => client).listActiveSeats(),
    ).rejects.toBeInstanceOf(NetworkError);
  });

  it("rpc ném exception thì thành NetworkError", async () => {
    const client = {
      rpc: vi.fn().mockRejectedValue(new TypeError("offline")),
    } as unknown as RpcClient;
    await expect(
      createStaffApi(() => client).listActiveSeats(),
    ).rejects.toBeInstanceOf(NetworkError);
  });
});
