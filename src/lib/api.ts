export type CreateOrderInput = {
  id: string;
  quantity: number;
  seatId: string | null;
  isTakeaway: boolean;
  clientPrice: number;
};
export type CreatedOrder = {
  id: string;
  unit_price: number;
  total_amount: number;
  price_changed: boolean;
  created_at: string;
  business_date: string;
  duplicate: boolean;
};
export type MyOrder = {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  seat_name: string | null;
  status: "paid" | "cancelled";
  created_at: string;
};
export type ActiveSeat = {
  id: string;
  name: string;
  kind: "table" | "counter";
};
export interface StaffApi {
  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;
  cancelOrder(orderId: string): Promise<void>;
  listOrdersByIds(ids: string[]): Promise<MyOrder[]>;
  listActiveSeats(): Promise<ActiveSeat[]>;
}

export type RpcClient = {
  rpc(
    fn: string,
    args?: Record<string, unknown>,
  ): PromiseLike<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

export class NetworkError extends Error {
  constructor(message = "NETWORK") {
    super(message);
    this.name = "NetworkError";
  }
}

export class RpcError extends Error {
  constructor(public code: string) {
    super(code);
    this.name = "RpcError";
  }
}

async function call<T>(
  client: RpcClient,
  fn: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  let result: Awaited<ReturnType<RpcClient["rpc"]>>;
  try {
    result = await client.rpc(fn, args);
  } catch (e) {
    throw new NetworkError(String(e));
  }
  const { data, error } = result;
  if (error) {
    // supabase-js trả về code rỗng khi fetch thất bại; lỗi do Postgres raise luôn có SQLSTATE
    if (!error.code) throw new NetworkError(error.message);
    throw new RpcError(error.message);
  }
  return data as T;
}

export function createStaffApi(getClient: () => RpcClient): StaffApi {
  return {
    createOrder: (input) =>
      call(getClient(), "create_order", {
        p_id: input.id,
        p_quantity: input.quantity,
        p_seat_id: input.seatId,
        p_is_takeaway: input.isTakeaway,
        p_client_price: input.clientPrice,
      }),
    cancelOrder: async (orderId) => {
      await call(getClient(), "cancel_order", { p_order_id: orderId });
    },
    listOrdersByIds: async (ids) =>
      ids.length === 0
        ? []
        : call(getClient(), "list_orders_by_ids", { p_ids: ids }),
    listActiveSeats: () => call(getClient(), "list_active_seats"),
  };
}
