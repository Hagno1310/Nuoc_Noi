"use client";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  NetworkError,
  RpcError,
  type ActiveSeat,
  type MyOrder,
  type StaffApi,
} from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { getMyOrderIds, rememberOrder } from "@/lib/order/myOrders";
import { quantityReducer, type QuantityAction } from "@/lib/order/quantity";
import { PriceBanner } from "./PriceBanner";
import { QuantityPad } from "./QuantityPad";
import { RecentOrders } from "./RecentOrders";
import { buzz } from "@/lib/haptics";
import { ConfirmBar, type Feedback } from "./ConfirmBar";
import { SeatPicker, type SeatSelection } from "./SeatPicker";

const ERROR_TEXT: Record<string, string> = {
  INVALID_QUANTITY: "Số lượng không hợp lệ.",
  INVALID_SEAT: "Chỗ ngồi không hợp lệ.",
  SEAT_NOT_FOUND: "Chỗ ngồi không còn tồn tại. Tải lại trang.",
  ORDER_NOT_FOUND: "Không tìm thấy đơn.",
  CANCEL_WINDOW_EXPIRED: "Đã quá 5 phút, nhờ chủ quán hủy đơn.",
};

export type OrderScreenProps = {
  api: StaffApi;
  price: number | null;
  online: boolean;
  onUnauthorized: () => void;
  newId?: () => string;
  now?: () => Date;
};

export function OrderScreen({
  api,
  price,
  online,
  onUnauthorized,
  newId = () => crypto.randomUUID(),
  now = () => new Date(),
}: OrderScreenProps) {
  const [quantity, dispatch] = useReducer(quantityReducer, 0);
  const [selection, setSelection] = useState<SeatSelection>({ kind: "none" });
  const [seats, setSeats] = useState<ActiveSeat[]>([]);
  const [recent, setRecent] = useState<MyOrder[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Giữ nguyên id cho tới khi gửi thành công, để bấm lại sau lỗi mạng không tạo đơn thứ hai
  const pendingId = useRef<string | null>(null);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof RpcError && e.code === "FORBIDDEN")
        return onUnauthorized();
      if (e instanceof RpcError)
        return setNotice(ERROR_TEXT[e.code] ?? `Lỗi: ${e.code}`);
      if (e instanceof NetworkError)
        return setNotice("Chưa gửi được – kiểm tra mạng rồi bấm lại.");
      setNotice("Có lỗi xảy ra.");
    },
    [onUnauthorized],
  );

  const refreshRecent = useCallback(async () => {
    try {
      setRecent(await api.listOrdersByIds(getMyOrderIds()));
    } catch (e) {
      if (!(e instanceof NetworkError)) handleError(e);
    }
  }, [api, handleError]);

  useEffect(() => {
    api
      .listActiveSeats()
      .then(setSeats)
      .catch((e) => {
        if (!(e instanceof NetworkError)) handleError(e);
      });
    void refreshRecent();
  }, [api, handleError, refreshRecent]);

  const endFeedback = useCallback(() => setFeedback(null), []);

  // Chạm vào số lượng hay chỗ ngồi nghĩa là bắt đầu đơn mới: thanh trở lại thành Xác nhận
  const changeQuantity = (a: QuantityAction) => {
    setFeedback(null);
    dispatch(a);
  };
  const changeSeat = (s: SeatSelection) => {
    setFeedback(null);
    setSelection(s);
  };

  async function handleSubmit() {
    if (quantity === 0 || price === null || !online || sending) return;
    const id = (pendingId.current ??= newId());
    setSending(true);
    setNotice(null);
    try {
      const res = await api.createOrder({
        id,
        quantity,
        seatId: selection.kind === "seat" ? selection.id : null,
        isTakeaway: selection.kind === "takeaway",
        clientPrice: price,
      });
      pendingId.current = null;
      rememberOrder(res.id);
      dispatch({ type: "clear" });
      setSelection({ kind: "none" });
      const cups = Math.round(res.total_amount / res.unit_price);
      setFeedback({
        orderId: res.id,
        text: `Đã tạo đơn ${cups} cốc – ${formatVnd(res.total_amount)}`,
      });
      buzz();
      if (res.duplicate) {
        setNotice(
          `Đơn này đã được ghi từ lần gửi trước (${cups} cốc). Kiểm tra lại trước khi tạo đơn mới.`,
        );
      } else if (res.price_changed) {
        setNotice(
          `Giá đã đổi: đơn được tính ${formatVnd(res.unit_price)}/cốc, thành tiền ${formatVnd(res.total_amount)}.`,
        );
      }
      await refreshRecent();
    } catch (e) {
      handleError(e);
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(orderId: string) {
    setFeedback((f) => (f?.orderId === orderId ? null : f));
    try {
      await api.cancelOrder(orderId);
      await refreshRecent();
    } catch (e) {
      handleError(e);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 p-4">
      <PriceBanner price={price} offline={!online} />
      {!online && (
        <p className="rounded-lg bg-red-100 p-3 font-semibold text-red-800">
          Mất mạng – chưa gửi được đơn
        </p>
      )}
      <p
        data-testid="total"
        className="text-center text-4xl font-extrabold tabular-nums"
      >
        {price === null ? "—" : formatVnd(quantity * price)}
      </p>
      <SeatPicker seats={seats} selection={selection} onChange={changeSeat} />
      <QuantityPad quantity={quantity} dispatch={changeQuantity} />
      {notice && (
        <p role="alert" className="rounded-lg bg-amber-100 p-3 text-amber-900">
          {notice}
        </p>
      )}
      <div className="sticky bottom-0 bg-white pb-2 pt-1">
        <ConfirmBar
          canSubmit={quantity > 0 && price !== null && online}
          sending={sending}
          feedback={feedback}
          onSubmit={() => void handleSubmit()}
          onUndo={(id) => void handleCancel(id)}
          onFeedbackEnd={endFeedback}
        />
      </div>
      <RecentOrders
        orders={recent}
        now={now}
        onCancel={(id) => void handleCancel(id)}
      />
    </main>
  );
}
