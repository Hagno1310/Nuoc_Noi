"use client";
import { ChevronLeft, History } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWide } from "@/hooks/useWide";
import {
  menuFromError,
  NetworkError,
  RpcError,
  type ActiveSeat,
  type MyOrder,
  type OpenOrder,
  type Payment,
  type StaffApi,
} from "@/lib/api";
import { buzz } from "@/lib/haptics";
import { formatVnd } from "@/lib/money";
import {
  addItem,
  applyMenu,
  clearPriceFlags,
  decrement,
  itemCount,
  lineKey,
  removeLine,
  setItemQuantity,
  setNote,
  setQuantity,
  subtotal,
  toPayload,
  type CartLine,
  type MenuItem,
} from "@/lib/order/cart";
import { getMyOrderIds, rememberOrder } from "@/lib/order/myOrders";
import { uploadTransferPhoto } from "@/lib/order/transferPhoto";
import { CartBar } from "./CartBar";
import { CartPanel } from "./CartPanel";
import { ConfirmBar, type Feedback } from "./ConfirmBar";
import { MenuBoard } from "./MenuBoard";
import { OpenOrders } from "./OpenOrders";
import { PaymentSheet } from "./PaymentSheet";
import { QuantityPad } from "./QuantityPad";
import { RecentOrders } from "./RecentOrders";
import type { SeatSelection } from "./SeatPicker";
import { Sheet } from "./Sheet";

const ERROR_TEXT: Record<string, string> = {
  INVALID_QUANTITY: "Số lượng mỗi món phải từ 1 đến 99.",
  INVALID_LINES: "Giỏ đơn không hợp lệ. Xóa hết rồi chọn lại món.",
  INVALID_DISCOUNT: "Giảm giá phải từ 0 đến 100%.",
  SEAT_REQUIRED: "Chọn chỗ ngồi trước khi gửi.",
  SEAT_NOT_FOUND: "Chỗ ngồi không còn tồn tại. Tải lại trang.",
  TOTAL_TOO_LARGE: "Đơn quá lớn (trên 1 tỷ đồng). Tách thành nhiều đơn.",
  ORDER_NOT_FOUND: "Không tìm thấy đơn.",
  PAYMENT_REQUIRED: "Chọn Tiền mặt hoặc Chuyển khoản rồi gửi lại.",
  PHOTO_REQUIRED: "Chụp lại ảnh chuyển khoản rồi gửi lại.",
  INVALID_PAYMENT: "Hình thức thanh toán không hợp lệ. Quay lại rồi chọn lại.",
  CANCEL_WINDOW_EXPIRED: "Đã quá 5 phút, nhờ chủ quán hủy đơn.",
  LINE_LIMIT: "Đơn chờ thanh toán đã đủ 60 dòng – thu tiền trước rồi gọi tiếp.",
  ORDER_NOT_OPEN: "Đơn này đã được thu tiền.",
};
const CANCEL_NETWORK_ERROR = "Chưa hủy được – kiểm tra mạng rồi thử lại.";
const MENU_CHANGED_TEXT = "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.";
const CANCELLED_TEXT = "Đơn này đã bị hủy – bấm Xác nhận đơn để tạo đơn mới.";
const OFFLINE = "Mất mạng – chưa gửi được đơn";
const ORDER_CHANGED_TEXT = "Đơn vừa có thay đổi – kiểm tra lại rồi thu tiền.";
const OPEN_POLL_MS = 15_000;

// Tấm thanh toán mở cho giỏ đơn, hoặc để thu tiền một đơn chờ thanh toán (FR-04c, FR-04d)
type Pay = { kind: "cart" } | { kind: "checkout"; order: OpenOrder };

export type OrderScreenProps = {
  api: StaffApi;
  menu: MenuItem[] | null;
  menuFailed?: boolean;
  online: boolean;
  onUnauthorized: () => void;
  newId?: () => string;
  now?: () => Date;
  // Tải ảnh chuyển khoản lên Cloudinary, trả public_id (SRS FR-04c); test truyền hàm giả
  uploadPhoto?: (file: Blob) => Promise<string>;
  // Có khi tài khoản là chủ quán: liên kết quay lại trang chủ quán (SRS §3.2)
  ownerHome?: string;
};

export function OrderScreen({
  api,
  menu,
  menuFailed = false,
  online,
  onUnauthorized,
  newId = () => crypto.randomUUID(),
  now = () => new Date(),
  uploadPhoto = uploadTransferPhoto,
  ownerHome,
}: OrderScreenProps) {
  const wide = useWide();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discount, setDiscount] = useState(0);
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);
  const [selection, setSelection] = useState<SeatSelection>({ kind: "none" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seats, setSeats] = useState<ActiveSeat[]>([]);
  const [recent, setRecent] = useState<MyOrder[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [openSheet, setOpenSheet] = useState(false);
  const [holdItem, setHoldItem] = useState<MenuItem | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // Lỗi ẩn khi đổi giỏ/chỗ ngồi; info giữ tới lần gửi/hủy thành công (SRS FR-04)
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Chỉ nút vừa bấm hiện "Đang hủy…", mọi nút hủy khác bị khóa (SRS FR-04b)
  const [cancelling, setCancelling] = useState<{ id: string; from: "undo" | "list" } | null>(null);
  // Giữ id tới khi gửi thành công, để bấm lại sau lỗi mạng không ghi trùng (FR-04, FR-04d).
  // Trả ngay và Trả sau ghi vào hai bảng khác nhau, nên sau lỗi mạng chỉ cho gửi lại bằng đúng cách vừa chọn.
  const [pending, setPending] = useState<{ id: string; kind: "order" | "round" } | null>(null);
  const [laterBusy, setLaterBusy] = useState(false);
  const [pay, setPay] = useState<Pay | null>(null);
  // Ảnh chuyển khoản gắn với giỏ đơn ("cart") hoặc với đơn đang thu tiền (id đơn); giữ qua lỗi mạng và MENU_CHANGED (FR-04c, R42)
  const [photo, setPhoto] = useState<{ for: string; id: string } | null>(null);
  // Tăng khi bỏ ảnh: ảnh đang tải dở của lần trước không được ghi lại
  const photoGen = useRef(0);

  const handleError = useCallback(
    (e: unknown) => {
      if (e instanceof RpcError && e.code === "FORBIDDEN") return onUnauthorized();
      if (e instanceof RpcError) return setError(ERROR_TEXT[e.code] ?? `Lỗi: ${e.code}`);
      if (e instanceof NetworkError) return setError("Chưa gửi được – kiểm tra mạng rồi bấm lại.");
      setError("Có lỗi xảy ra.");
    },
    [onUnauthorized],
  );
  const quiet = useCallback((e: unknown) => !(e instanceof NetworkError) && handleError(e), [handleError]);

  const refreshRecent = useCallback(
    () => api.listOrdersByIds(getMyOrderIds()).then(setRecent, quiet),
    [api, quiet],
  );
  const refreshOpen = useCallback(() => api.listOpenOrders().then(setOpenOrders, quiet), [api, quiet]);

  // Có mạng (lần đầu hoặc trở lại): tải chỗ ngồi, đơn vừa tạo, đơn chờ thanh toán (FR-04, FR-04d)
  useEffect(() => {
    if (!online) return;
    api.listActiveSeats().then(setSeats, quiet);
    void refreshRecent();
    void refreshOpen();
    // ponytail: hỏi lại mỗi 15 giây thay cho Realtime (nhân viên không đọc được bảng orders qua RLS)
    const timer = setInterval(() => void refreshOpen(), OPEN_POLL_MS);
    return () => clearInterval(timer);
  }, [api, online, quiet, refreshRecent, refreshOpen]);

  // Thực đơn đổi (realtime): cập nhật giá, gạch món ngừng bán (FR-01); dòng đổi giá nổi bật khoảng 3 giây
  useEffect(() => {
    if (menu) setCart((c) => applyMenu(c, menu));
  }, [menu]);
  useEffect(() => {
    if (!cart.some((l) => l.priceChanged)) return;
    const timer = setTimeout(() => setCart(clearPriceFlags), 3000);
    return () => clearTimeout(timer);
  }, [cart]);

  const dropPhoto = useCallback(() => {
    setPhoto(null);
    photoGen.current++;
  }, []);
  // Giỏ trống vì bất cứ lý do gì: bỏ ảnh của giỏ (SRS R42)
  useEffect(() => {
    if (cart.length === 0 && photo?.for === "cart") dropPhoto();
  }, [cart.length, photo, dropPhoto]);
  useEffect(() => {
    if (cart.length === 0) setPending(null);
  }, [cart.length]);

  const endFeedback = useCallback(() => setFeedback(null), []);
  // Mọi thao tác trên giỏ là bắt đầu đơn mới: ẩn lỗi và thanh phản hồi
  const edit =
    <T,>(apply: (v: T) => void) =>
    (v: T) => {
      setFeedback(null);
      setError(null);
      apply(v);
    };
  const add = edit((item: MenuItem) => setCart((c) => addItem(c, item)));
  const inc = edit((key: string) =>
    setCart((c) => {
      const l = c.find((x) => lineKey(x) === key);
      return l ? setQuantity(c, key, l.quantity + 1) : c;
    }),
  );
  const dec = edit((key: string) => setCart((c) => decrement(c, key)));
  const setQty = (key: string, q: number) => edit<void>(() => setCart((c) => setQuantity(c, key, q)))();
  const setLineNote = (key: string, note: string) => edit<void>(() => setCart((c) => setNote(c, key, note)))();
  const remove = edit((key: string) => setCart((c) => removeLine(c, key)));
  const clear = edit<void>(() => setCart([]));
  const changeSeat = edit(setSelection);

  const openSeats = new Map(openOrders.map((o) => [o.seat_id, o.subtotal_amount]));
  const count = itemCount(cart);
  const sub = subtotal(cart);
  const hasArchived = cart.some((l) => l.archived);
  const blockReason =
    menu === null
      ? "Đang tải thực đơn…"
      : cart.length === 0
        ? "Chạm món để thêm"
        : hasArchived
          ? "Bỏ món đã ngừng bán để gửi"
          : selection.kind === "none"
            ? "Chọn chỗ ngồi"
            : !online
              ? OFFLINE
              : null;

  // Gửi xong (đơn hoặc lượt gọi): giỏ trống, bỏ chọn chỗ ngồi, rung, Hoàn tác 5 giây (FR-04, FR-04d)
  async function done(fb: Feedback) {
    rememberOrder(fb.id);
    setPay(null);
    setCart([]);
    setDiscount(0);
    setSelection({ kind: "none" });
    setSheetOpen(false);
    setFeedback(fb);
    buzz();
    await Promise.all([refreshRecent(), refreshOpen()]);
  }

  function menuChanged(e: unknown) {
    const fresh = menuFromError(e);
    if (!fresh) return false;
    setPay(null);
    setCart((c) => applyMenu(c, fresh));
    setInfo(MENU_CHANGED_TEXT);
    return true;
  }

  async function run(task: () => Promise<void>) {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      await task();
    } catch (e) {
      // Server từ chối hẳn thì chưa có gì được ghi: bỏ khóa cách gửi, lần sau dùng id mới. Chỉ lỗi mạng mới giữ khóa (FR-04d).
      // Lỗi khi thu tiền một đơn chờ thanh toán không đụng tới khóa của giỏ đơn.
      if (e instanceof RpcError && pay?.kind !== "checkout") setPending(null);
      if (!menuChanged(e)) handleError(e);
    } finally {
      setSending(false);
    }
  }

  const submitCart = (payment: Payment) =>
    run(async () => {
      if (blockReason || selection.kind !== "seat") return;
      if (pending?.kind === "round") return;
      const id = pending?.id ?? newId();
      setPending({ id, kind: "order" });
      const res = await api.createOrder({ id, seatId: selection.id, discountPercent: discount, lines: toPayload(cart), payment });
      setPending(null);
      if (res.duplicate && res.status === "cancelled") {
        // Đơn đã ghi rồi bị hủy trước lần gửi lại: giữ giỏ, lần sau dùng id mới (SRS v3.1)
        setPay(null);
        setInfo(CANCELLED_TEXT);
        return;
      }
      dropPhoto();
      setInfo(res.duplicate ? `Đơn này đã được ghi từ lần gửi trước (${res.item_count} món). Kiểm tra lại trước khi tạo đơn mới.` : null);
      await done({ id: res.id, kind: "order", text: `Đã tạo đơn ${res.item_count} món – ${formatVnd(res.total_amount)}` });
    });

  const submitRound = () =>
    run(async () => {
      if (blockReason || selection.kind !== "seat") return;
      if (pending?.kind === "order") return;
      const id = pending?.id ?? newId();
      setPending({ id, kind: "round" });
      setLaterBusy(true);
      try {
        const res = await api.addRound({ id, seatId: selection.id, lines: toPayload(cart) });
        setPending(null);
        if (res.duplicate && res.status === "cancelled") {
          // Như FR-04: lần gửi trước đã ghi rồi bị hủy; giữ giỏ, lần sau dùng id mới
          setPay(null);
          setInfo(CANCELLED_TEXT);
          return;
        }
        setInfo(res.duplicate ? `Đơn này đã được ghi từ lần gửi trước (${res.item_count} món). Kiểm tra lại trước khi tạo đơn mới.` : null);
        await done({ id: res.round_id, kind: "round", text: `Đã ghi ${res.item_count} món vào ${res.seat_name}` });
      } finally {
        setLaterBusy(false);
      }
    });

  const checkout = (order: OpenOrder, payment: Payment) =>
    run(async () => {
      try {
        const res = await api.checkoutOrder({
          orderId: order.id,
          expectedSubtotal: order.subtotal_amount,
          discountPercent: checkoutDiscount,
          payment,
        });
        dropPhoto();
        setPay(null);
        setFeedback({ id: res.id, kind: "paid", text: `Đã thu ${formatVnd(res.total_amount)} – ${res.seat_name}` });
        buzz();
      } catch (e) {
        // Máy khác vừa thu tiền, hủy đơn, hoặc gửi/hủy lượt gọi làm tạm tính đổi (FR-04d)
        if (!(e instanceof RpcError && (e.code === "ORDER_NOT_OPEN" || e.code === "ORDER_CHANGED"))) throw e;
        setPay(null);
        setInfo(e.code === "ORDER_NOT_OPEN" && e.details === "paid" ? "Đơn này đã được thu tiền." : ORDER_CHANGED_TEXT);
      }
      await refreshOpen();
    });

  async function handleCancel(target: { id: string; kind: "order" | "round" }, from: "undo" | "list") {
    if (cancelling) return;
    setCancelling({ id: target.id, from });
    try {
      await (target.kind === "round" ? api.cancelRound(target.id) : api.cancelOrder(target.id));
      setError((e) => (e === CANCEL_NETWORK_ERROR ? null : e));
      setInfo(null);
      setFeedback((f) => (f?.id === target.id ? null : f));
      await Promise.all([refreshRecent(), refreshOpen()]);
    } catch (e) {
      if (e instanceof NetworkError) setError(CANCEL_NETWORK_ERROR);
      else {
        handleError(e);
        void refreshOpen();
      }
    } finally {
      setCancelling(null);
    }
  }

  const notices = (
    <>
      {info && (
        <p role="status" className="rounded-[14px] bg-warn-soft px-3.5 py-3 text-sm font-medium text-warn">
          {info}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-[14px] bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </>
  );
  const confirm = (fb: Feedback | null) => (
    <ConfirmBar
      canSubmit={blockReason === null}
      blockReason={blockReason}
      sending={sending}
      feedback={fb}
      cancelBusy={cancelling !== null}
      undoing={cancelling?.from === "undo" && cancelling.id === fb?.id}
      onSubmit={() => {
        if (blockReason !== null) return;
        setError(null);
        setPay({ kind: "cart" });
      }}
      onUndo={(f) => f.kind !== "paid" && void handleCancel({ id: f.id, kind: f.kind }, "undo")}
      onFeedbackEnd={endFeedback}
    />
  );
  const panel = (fb: Feedback | null = null, onClose?: () => void) => (
    <CartPanel
      cart={cart}
      seats={seats}
      openSeats={openSeats}
      selection={selection}
      onIncrement={inc}
      onDecrement={dec}
      onSetQuantity={setQty}
      onSetNote={setLineNote}
      onRemove={remove}
      onClear={clear}
      onSeat={changeSeat}
      onClose={onClose}
      notices={notices}
      footer={confirm(fb)}
    />
  );

  const payKey = pay?.kind === "checkout" ? pay.order.id : "cart";
  const seatName = pay?.kind === "checkout" ? pay.order.seat_name : selection.kind === "seat" ? selection.name : "";
  const holdQty = holdItem ? (cart.find((l) => lineKey(l) === holdItem.id)?.quantity ?? 0) : 0;
  const send = (payment: Payment) => (pay?.kind === "checkout" ? checkout(pay.order, payment) : submitCart(payment));

  return (
    <main className="mx-auto max-w-md px-4 md:max-w-5xl">
      <header className="flex h-15 items-center justify-between gap-2">
        <Image src="/brand/nuoc-noi-wordmark-small.png" alt="Nước Nôi" width={330} height={90} priority className="h-7.5 w-auto" />
        <div className="flex items-center gap-2">
          {ownerHome && (
            <Link href={ownerHome} className="inline-flex h-12 items-center gap-1 text-sm text-muted hover:text-ink">
              <ChevronLeft aria-hidden="true" size={16} />
              Trang chủ quán
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              void refreshOpen();
              setOpenSheet(true);
            }}
            className="flex h-12 items-center gap-2 rounded-full bg-surface pr-2 pl-3.5 text-[13px] font-semibold"
          >
            Chờ thanh toán
            <span className={`grid size-6.5 place-items-center rounded-full text-[13px] font-bold ${openOrders.length ? "bg-warn text-accent-ink" : "bg-surface-2 text-muted"}`}>
              {openOrders.length}
            </span>
          </button>
          <a href="#don-vua-tao" aria-label="Đơn vừa tạo" className="grid size-12 place-items-center rounded-full bg-surface">
            <History aria-hidden="true" size={20} />
          </a>
        </div>
      </header>
      {!online && (
        // Dính đầu trang để cuộn xuống vẫn thấy (SRS FR-04)
        <p className="sticky top-0 z-20 mb-3 rounded-[14px] bg-danger-soft px-3.5 py-3 font-semibold text-danger">{OFFLINE}</p>
      )}
      <div className="pt-2 md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start md:gap-8">
        <div>
          <MenuBoard menu={menu} failed={menuFailed} cart={cart} onAdd={add} onHold={setHoldItem} onRemoveOne={dec} />
          <RecentOrders
            orders={recent}
            now={now}
            cancelBusy={cancelling !== null}
            cancellingId={cancelling?.from === "list" ? cancelling.id : null}
            onCancel={(o) => void handleCancel(o, "list")}
          />
        </div>
        {wide && <aside className="sticky top-4 flex max-h-[calc(100dvh-5rem)] flex-col">{panel(feedback)}</aside>}
      </div>
      {!wide && (
        <>
          <div className="sticky bottom-0 z-10 -mx-4 space-y-2 bg-bg px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
            {!sheetOpen && notices}
            {feedback && confirm(feedback)}
            <CartBar count={count} total={sub} onOpen={() => setSheetOpen(true)} />
          </div>
          <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="Giỏ đơn">
            {panel(null, () => setSheetOpen(false))}
          </Sheet>
        </>
      )}
      <QuantityPad
        item={holdItem}
        current={holdQty}
        onDone={(q) => holdItem && edit<void>(() => setCart((c) => setItemQuantity(c, holdItem, q)))()}
        onClose={() => setHoldItem(null)}
      />
      <OpenOrders
        open={openSheet}
        orders={openOrders}
        now={now}
        cancellingId={cancelling?.from === "list" ? cancelling.id : null}
        cancelBusy={cancelling !== null}
        onClose={() => setOpenSheet(false)}
        onCancelRound={(id) => void handleCancel({ id, kind: "round" }, "list")}
        onMore={(o) => {
          setOpenSheet(false);
          changeSeat({ kind: "seat", id: o.seat_id, name: o.seat_name });
        }}
        onCheckout={(o) => {
          setOpenSheet(false);
          setError(null);
          setCheckoutDiscount(0);
          setPay({ kind: "checkout", order: o });
        }}
      />
      <PaymentSheet
        open={pay !== null}
        subtotal={pay?.kind === "checkout" ? pay.order.subtotal_amount : sub}
        itemCount={pay?.kind === "checkout" ? pay.order.item_count : count}
        discount={pay?.kind === "checkout" ? checkoutDiscount : discount}
        onDiscount={pay?.kind === "checkout" ? edit(setCheckoutDiscount) : edit(setDiscount)}
        payLater={
          pay?.kind === "cart" && selection.kind === "seat"
            ? {
                label: openSeats.has(selection.id) ? `Ghi thêm vào ${selection.name}` : `Trả sau – ghi vào ${selection.name}`,
                onClick: () => void submitRound(),
                busy: laterBusy,
                locked: pending?.kind === "order",
              }
            : undefined
        }
        seatName={seatName}
        sending={sending}
        error={error}
        blockReason={pay?.kind === "checkout" ? (online ? null : OFFLINE) : blockReason}
        payNowLocked={pay?.kind === "cart" && pending?.kind === "round"}
        photoId={photo?.for === payKey ? photo.id : null}
        upload={async (f) => {
          const g = photoGen.current;
          const id = await uploadPhoto(f);
          if (g !== photoGen.current) throw new Error("STALE_PHOTO");
          return id;
        }}
        onPhoto={(id) => setPhoto(id ? { for: payKey, id } : null)}
        onCash={() => void send({ method: "cash" })}
        onTransfer={() => {
          const id = photo?.for === payKey ? photo.id : null;
          if (id) void send({ method: "transfer", photoId: id });
        }}
        onClose={() => setPay(null)}
        onUnauthorized={onUnauthorized}
      />
    </main>
  );
}
