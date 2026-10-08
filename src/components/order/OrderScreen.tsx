"use client";
import { ChevronLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useWide } from "@/hooks/useWide";
import { menuFromError, NetworkError, RpcError, type ActiveSeat, type MyOrder, type Payment, type StaffApi } from "@/lib/api";
import { buzz } from "@/lib/haptics";
import { formatVnd } from "@/lib/money";
import {
  addItem,
  applyMenu,
  clearPriceFlags,
  decrement,
  discountAmount,
  itemCount,
  removeLine,
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
import { CartSheet } from "./CartSheet";
import { ConfirmBar, type Feedback } from "./ConfirmBar";
import { MenuBoard } from "./MenuBoard";
import { PaymentSheet } from "./PaymentSheet";
import { RecentOrders } from "./RecentOrders";
import type { SeatSelection } from "./SeatPicker";

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
};
const CANCEL_NETWORK_ERROR = "Chưa hủy được – kiểm tra mạng rồi thử lại.";
const MENU_CHANGED_TEXT = "Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.";
const CANCELLED_TEXT = "Đơn này đã bị hủy – bấm Xác nhận đơn để tạo đơn mới.";

export type OrderScreenProps = {
  api: StaffApi;
  menu: MenuItem[] | null;
  menuFailed?: boolean;
  online: boolean;
  onUnauthorized: () => void;
  newId?: () => string;
  now?: () => Date;
  // Tải ảnh chuyển khoản lên Cloudinary, trả public_id (SRS v3.3 FR-04c); test truyền hàm giả
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
  const [selection, setSelection] = useState<SeatSelection>({ kind: "none" });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [seats, setSeats] = useState<ActiveSeat[]>([]);
  const [recent, setRecent] = useState<MyOrder[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [flare, setFlare] = useState(0);
  // Lỗi ẩn khi đổi giỏ/giảm giá/chỗ ngồi; info giữ tới lần gửi/hủy thành công (SRS FR-04)
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Nhớ cả nút đã bấm: chỉ nút đó hiện "Đang hủy…", mọi nút hủy khác bị khóa (SRS FR-04b)
  const [cancelling, setCancelling] = useState<{ id: string; from: "undo" | "list" } | null>(null);
  // Giữ id tới khi gửi thành công, để bấm lại sau lỗi mạng không tạo đơn thứ hai (FR-04)
  const pendingId = useRef<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  // Ảnh chuyển khoản đã tải lên: giữ qua MENU_CHANGED, lỗi mạng, đơn đã hủy; bỏ khi gửi thành công hoặc giỏ trống (FR-04c, R42)
  const [photoId, setPhotoId] = useState<string | null>(null);
  // Tăng khi bỏ ảnh (Xóa hết, gửi xong): ảnh đang tải dở của giỏ cũ không được ghi lại
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

  const refreshRecent = useCallback(async () => {
    try {
      setRecent(await api.listOrdersByIds(getMyOrderIds()));
    } catch (e) {
      if (!(e instanceof NetworkError)) handleError(e);
    }
  }, [api, handleError]);

  useEffect(() => {
    if (!online) return;
    api
      .listActiveSeats()
      .then(setSeats)
      .catch((e) => {
        if (!(e instanceof NetworkError)) handleError(e);
      });
    void refreshRecent();
  }, [api, online, handleError, refreshRecent]);

  // Thực đơn đổi (realtime): cập nhật giá, gạch món ngừng bán (FR-01)
  useEffect(() => {
    if (!menu) return;
    setCart((c) => applyMenu(c, menu));
  }, [menu]);
  // Dòng vừa đổi giá nổi bật khoảng 3 giây
  useEffect(() => {
    if (!cart.some((l) => l.priceChanged)) return;
    const timer = setTimeout(() => setCart(clearPriceFlags), 3000);
    return () => clearTimeout(timer);
  }, [cart]);

  const endFeedback = useCallback(() => setFeedback(null), []);
  // Mọi thao tác trên giỏ là bắt đầu đơn mới: ẩn lỗi và thanh phản hồi
  const edit = <T,>(apply: (v: T) => void) => (v: T) => {
    setFeedback(null);
    setError(null);
    apply(v);
  };
  const add = edit((item: MenuItem) => setCart((c) => addItem(c, item)));
  const inc = edit((id: string) => setCart((c) => {
    const l = c.find((x) => x.menuItemId === id);
    return l ? setQuantity(c, id, l.quantity + 1) : c;
  }));
  const dec = edit((id: string) => setCart((c) => decrement(c, id)));
  const setQty = (id: string, q: number) => edit<void>(() => setCart((c) => setQuantity(c, id, q)))();
  const remove = edit((id: string) => setCart((c) => removeLine(c, id)));
  const clear = edit<void>(() => {
    setCart([]);
  });
  // Giỏ trống vì bất cứ lý do gì: bỏ ảnh đang giữ và ảnh đang tải dở (SRS R42)
  useEffect(() => {
    if (cart.length > 0) return;
    setPhotoId(null);
    photoGen.current++;
  }, [cart.length]);
  const changeDiscount = edit(setDiscount);
  const changeSeat = edit(setSelection);

  const count = itemCount(cart);
  const sub = subtotal(cart);
  const total = sub - discountAmount(sub, discount);
  const hasArchived = cart.some((l) => l.archived);
  const blockReason =
    menu === null
      ? "Đang tải thực đơn…"
      : cart.length === 0
        ? "Chạm món để thêm"
        : hasArchived
          ? "Bỏ món đã ngừng bán khỏi đơn"
          : selection.kind === "none"
            ? "Chọn chỗ ngồi"
            : !online
              ? "Mất mạng – chưa gửi được đơn"
              : null;

  async function handleSubmit(payment: Payment) {
    if (blockReason || sending || selection.kind !== "seat") return;
    const id = (pendingId.current ??= newId());
    setSending(true);
    setError(null);
    try {
      const res = await api.createOrder({ id, seatId: selection.id, discountPercent: discount, lines: toPayload(cart), payment });
      if (res.duplicate && res.status === "cancelled") {
        // Đơn đã ghi rồi bị hủy trước lần gửi lại: giữ giỏ, lần sau dùng id mới (SRS v3.1)
        pendingId.current = null;
        setPayOpen(false);
        setInfo(CANCELLED_TEXT);
        return;
      }
      pendingId.current = null;
      setPayOpen(false);
      setPhotoId(null);
      photoGen.current++;
      setInfo(
        res.duplicate
          ? `Đơn này đã được ghi từ lần gửi trước (${res.item_count} món). Kiểm tra lại trước khi tạo đơn mới.`
          : null,
      );
      rememberOrder(res.id);
      setCart([]);
      setDiscount(0);
      setSelection({ kind: "none" });
      setSheetOpen(false);
      setFeedback({ orderId: res.id, text: `Đã tạo đơn ${res.item_count} món – ${formatVnd(res.total_amount)}` });
      setFlare((n) => n + 1);
      buzz();
      await refreshRecent();
    } catch (e) {
      const fresh = menuFromError(e);
      if (fresh) {
        setPayOpen(false);
        setCart((c) => applyMenu(c, fresh));
        setInfo(MENU_CHANGED_TEXT);
      } else handleError(e);
    } finally {
      setSending(false);
    }
  }

  async function handleCancel(orderId: string, from: "undo" | "list") {
    if (cancelling) return;
    setCancelling({ id: orderId, from });
    try {
      await api.cancelOrder(orderId);
      setError((e) => (e === CANCEL_NETWORK_ERROR ? null : e));
      setInfo(null);
      setFeedback((f) => (f?.orderId === orderId ? null : f));
      await refreshRecent();
    } catch (e) {
      if (e instanceof NetworkError) setError(CANCEL_NETWORK_ERROR);
      else handleError(e);
    } finally {
      setCancelling(null);
    }
  }

  const notices = (
    <>
      {info && (
        <p role="status" className="rounded-lg border border-warn/50 px-3 py-2 text-warn">
          {info}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-lg border border-danger/60 px-3 py-2 text-danger">
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
      undoing={cancelling?.from === "undo" && cancelling.id === fb?.orderId}
      onSubmit={() => {
        if (blockReason !== null) return;
        setError(null);
        setPayOpen(true);
      }}
      onUndo={(id) => void handleCancel(id, "undo")}
      onFeedbackEnd={endFeedback}
    />
  );
  // Dải quẹt diêm: bùng sáng một lần khi gửi thành công (key đổi để chạy lại hiệu ứng)
  const striker = <span key={flare} aria-hidden="true" className={`striker block ${flare ? "striker-flare" : ""}`} />;
  const panel = (onClose?: () => void, fb: Feedback | null = null) => (
    <CartPanel
      cart={cart}
      discount={discount}
      seats={seats}
      selection={selection}
      onIncrement={inc}
      onDecrement={dec}
      onSetQuantity={setQty}
      onRemove={remove}
      onClear={clear}
      onDiscount={changeDiscount}
      onSeat={changeSeat}
      onClose={onClose}
      notices={notices}
      footer={
        <div className="space-y-2">
          {wide && striker}
          {confirm(fb)}
        </div>
      }
    />
  );

  return (
    <main className="mx-auto max-w-md px-4 pt-3 md:max-w-5xl">
      <header className="flex items-center justify-between gap-3 pb-3">
        <Image src="/brand/nuoc-noi-wordmark.png" alt="Nước Nôi" width={54} height={50} priority className="h-10 w-auto" />
        {ownerHome && (
          <Link href={ownerHome} className="inline-flex min-h-12 items-center gap-1 text-sm text-ink-muted transition-colors duration-150 hover:text-ink">
            <ChevronLeft aria-hidden="true" size={16} />
            Trang chủ quán
          </Link>
        )}
      </header>
      {!online && (
        <p className="mb-3 rounded-lg border border-danger/60 px-3 py-2 font-semibold text-danger">Mất mạng – chưa gửi được đơn</p>
      )}
      <div className="md:grid md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-start md:gap-8">
        <div>
          <MenuBoard menu={menu} failed={menuFailed} cart={cart} onAdd={add} />
          <RecentOrders
            orders={recent}
            now={now}
            cancelBusy={cancelling !== null}
            cancellingId={cancelling?.from === "list" ? cancelling.id : null}
            onCancel={(id) => void handleCancel(id, "list")}
          />
        </div>
        {wide && <aside className="sticky top-4">{panel(undefined, feedback)}</aside>}
      </div>
      {!wide && (
        <>
          <div className="sticky bottom-0 z-10 -mx-4 space-y-2 bg-bg px-4 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {!sheetOpen && notices}
            {striker}
            {feedback ? confirm(feedback) : <CartBar count={count} total={total} onOpen={() => setSheetOpen(true)} />}
          </div>
          <CartSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
            {panel(() => setSheetOpen(false))}
          </CartSheet>
        </>
      )}
      <PaymentSheet
        open={payOpen}
        total={total}
        seatName={selection.kind === "seat" ? selection.name : ""}
        sending={sending}
        error={error}
        blockReason={blockReason}
        photoId={photoId}
        upload={async (f) => {
          const g = photoGen.current;
          const id = await uploadPhoto(f);
          if (g !== photoGen.current) throw new Error("STALE_PHOTO");
          return id;
        }}
        onPhoto={setPhotoId}
        onCash={() => void handleSubmit({ method: "cash" })}
        onTransfer={() => {
          if (photoId) void handleSubmit({ method: "transfer", photoId });
        }}
        onClose={() => setPayOpen(false)}
        onUnauthorized={onUnauthorized}
      />
    </main>
  );
}
