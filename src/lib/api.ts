import type { MenuChange } from "@/lib/order/cart";

// SRS FR-04: dữ liệu gửi server. Server quyết định mọi số tiền; clientPrice chỉ để server phát hiện thực đơn đã đổi.
export type OrderLineInput = { menuItemId: string; quantity: number; clientPrice: number };
// SRS v3.3 FR-04c: chuyển khoản luôn kèm public_id ảnh đã tải lên
export type Payment = { method: "cash" } | { method: "transfer"; photoId: string };
export type PaymentMethod = Payment["method"];
export type CreateOrderInput = {
  id: string;
  seatId: string;
  discountPercent: number;
  lines: OrderLineInput[];
  payment: Payment;
};
export type CreatedOrder = {
  id: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  seat_name: string;
  created_at: string;
  business_date: string;
  duplicate: boolean;
  status: "paid" | "cancelled";
  payment_method: PaymentMethod;
  transfer_photo_id: string | null;
};
export type OrderLine = { item_name: string; unit_price: number; quantity: number; line_amount: number };
export type MyOrder = {
  id: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  seat_name: string;
  status: "paid" | "cancelled";
  created_at: string;
  payment_method: PaymentMethod;
  transfer_photo_id: string | null;
  lines: OrderLine[] | null;
};
export type ActiveSeat = { id: string; name: string; kind: "table" | "counter" };
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
  ): PromiseLike<{ data: unknown; error: { message: string; code?: string; details?: string } | null }>;
};

export class NetworkError extends Error {
  constructor(message = "NETWORK") {
    super(message);
    this.name = "NetworkError";
  }
}

export class RpcError extends Error {
  constructor(
    public code: string,
    public details?: string,
  ) {
    super(code);
    this.name = "RpcError";
  }
}

async function call<T>(client: RpcClient, fn: string, args: Record<string, unknown> = {}): Promise<T> {
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
    throw new RpcError(error.message, error.details);
  }
  return data as T;
}

// MENU_CHANGED mang thực đơn hiện hành trong DETAIL (migration 20261005000200), để giỏ đơn cập nhật ngay
export function menuFromError(e: unknown): MenuChange[] | null {
  if (!(e instanceof RpcError) || e.code !== "MENU_CHANGED" || !e.details) return null;
  try {
    const v = JSON.parse(e.details);
    return Array.isArray(v)
      ? v.map((m) => ({ id: m.id, name: m.name, price: m.price, is_archived: m.is_archived }))
      : null;
  } catch {
    return null;
  }
}

export function createStaffApi(getClient: () => RpcClient): StaffApi {
  return {
    createOrder: (input) =>
      call(getClient(), "create_order", {
        p_id: input.id,
        p_seat_id: input.seatId,
        p_discount_percent: input.discountPercent,
        p_lines: input.lines.map((l) => ({
          menu_item_id: l.menuItemId,
          quantity: l.quantity,
          client_price: l.clientPrice,
        })),
        p_payment_method: input.payment.method,
        p_transfer_photo_id: input.payment.method === "transfer" ? input.payment.photoId : null,
      }),
    cancelOrder: async (orderId) => {
      await call(getClient(), "cancel_order", { p_order_id: orderId });
    },
    listOrdersByIds: async (ids) => (ids.length === 0 ? [] : call(getClient(), "list_orders_by_ids", { p_ids: ids })),
    listActiveSeats: () => call(getClient(), "list_active_seats"),
  };
}
