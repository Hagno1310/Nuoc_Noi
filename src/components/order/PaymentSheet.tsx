"use client";
import { Armchair, ChevronLeft, NotebookPen, QrCode, RotateCcw } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { transferPhotoUrl } from "@/lib/cloudinary";
import { formatVnd } from "@/lib/money";
import { discountAmount, parseDiscountInput } from "@/lib/order/cart";
import { shrinkImage, UploadError } from "@/lib/order/transferPhoto";

const UPLOAD_ERROR = "Chưa tải được ảnh – kiểm tra mạng rồi thử lại.";
const PRESETS = [5, 10, 15, 20];
type Step = "choose" | "qr" | "preview";

export type PaymentSheetProps = {
  open: boolean;
  subtotal: number;
  itemCount: number;
  discount: number;
  onDiscount: (p: number) => void;
  // Có khi mở từ giỏ đơn: gửi thành lượt gọi Trả sau (FR-04c, v3.8). Không có khi thu tiền đơn chờ thanh toán.
  // locked: lần trả ngay trước bị lỗi mạng, chỉ gửi lại bằng Tiền mặt/Chuyển khoản (FR-04d)
  payLater?: { label: string; onClick: () => void; busy: boolean; locked: boolean };
  seatName: string;
  sending: boolean;
  error: string | null;
  // Điều kiện khóa của FR-04 xuất hiện lúc tấm đang mở (SRS R41)
  blockReason: string | null;
  // Lần Trả sau trước bị lỗi mạng: khóa cả Chuyển khoản để khách không chuyển tiền cho một lần gửi không đi được (FR-04d)
  payNowLocked?: boolean;
  // Ảnh đã tải lên, OrderScreen giữ qua MENU_CHANGED và lỗi mạng (spec §4.1)
  photoId: string | null;
  upload: (file: Blob) => Promise<string>;
  onPhoto: (photoId: string | null) => void;
  onCash: () => void;
  onTransfer: () => void;
  onClose: () => void;
  onUnauthorized: () => void;
};

// SRS FR-04c: tấm thanh toán. Giảm giá → Tiền mặt (gửi ngay) / Chuyển khoản (QR → chụp ảnh bắt buộc → kiểm tra → xác nhận) / Trả sau.
// Đọc ở trên, bấm ở dưới: nút trả tiền nằm trong tầm ngón cái (R44). Toàn màn hình trên điện thoại, hộp giữa màn từ md.
export function PaymentSheet({
  open,
  subtotal,
  itemCount,
  discount,
  onDiscount,
  payLater,
  seatName,
  sending,
  error,
  blockReason,
  payNowLocked = false,
  photoId,
  upload,
  onPhoto,
  onCash,
  onTransfer,
  onClose,
  onUnauthorized,
}: PaymentSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const lastFile = useRef<Blob | null>(null);
  // Chụp lại khi ảnh trước chưa tải xong: chỉ kết quả của lần chụp mới nhất được tính
  const seq = useRef(0);
  const [step, setStep] = useState<Step>("choose");
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFailed, setUploadFailed] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function send(file: Blob) {
    const n = ++seq.current;
    lastFile.current = file;
    setUploading(true);
    setUploadFailed(false);
    try {
      const id = await upload(await shrinkImage(file));
      if (n === seq.current) onPhoto(id);
    } catch (e) {
      if (n !== seq.current) return;
      if (e instanceof UploadError && e.code === "UNAUTHORIZED") return onUnauthorized();
      setUploadFailed(true);
    } finally {
      if (n === seq.current) setUploading(false);
    }
  }

  function pick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // chọn lại cùng ảnh vẫn kích hoạt change
    if (!file) return;
    onPhoto(null);
    setPreview(URL.createObjectURL(file));
    setStep("preview");
    void send(file);
  }

  const shoot = () => input.current?.click();
  const shown = preview ?? (photoId ? transferPhotoUrl(photoId, 800) : null);
  const off = discountAmount(subtotal, discount);
  const total = subtotal - off;
  const primary = "h-16 w-full rounded-2xl bg-accent text-lg font-semibold text-accent-ink disabled:bg-surface-2 disabled:text-muted";
  const secondary = "flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-surface-2 font-semibold disabled:opacity-40";
  const why = blockReason ?? (payNowLocked ? "Bấm Trả sau để gửi lại" : null);
  const reason = open && why && <p className="text-center text-sm text-muted">{why}</p>;

  return (
    <dialog
      ref={ref}
      aria-label="Thanh toán"
      onClose={() => {
        setStep("choose");
        onClose();
      }}
      onCancel={(e) => sending && e.preventDefault()}
      className="sheet m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-ink md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-md md:rounded-3xl"
    >
      <div className="flex min-h-full flex-col gap-4 px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between">
          <button
            type="button"
            disabled={sending}
            onClick={() => ref.current?.close()}
            className="flex h-12 items-center gap-1 rounded-full bg-surface pr-3.5 pl-2.5 text-sm font-medium disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" size={18} />
            Quay lại
          </button>
          <span className="flex items-center gap-1.5 font-semibold">
            <Armchair aria-hidden="true" size={16} className="text-accent" />
            {seatName}
          </span>
        </header>

        {step === "choose" && (
          <>
            <section className="flex flex-1 flex-col justify-center gap-3.5">
              <p className="flex justify-between text-sm text-muted">
                <span>Tạm tính · {itemCount} món</span>
                <span>{formatVnd(subtotal)}</span>
              </p>
              <Discount value={discount} onChange={onDiscount} disabled={sending} />
              {discount > 0 && (
                <p className="flex justify-between text-sm text-ok">
                  <span>Giảm {discount}%</span>
                  <span>−{formatVnd(off)}</span>
                </p>
              )}
              <p className="flex items-center justify-between gap-3 border-t border-line pt-3.5">
                <span className="font-semibold">Thành tiền</span>
                <span data-testid="pay-total" className="truncate text-[44px] leading-tight font-extrabold">
                  {formatVnd(total)}
                </span>
              </p>
            </section>
            <section className="space-y-2.5">
              <h2 className="text-[15px] font-semibold text-muted">Khách trả bằng?</h2>
              <button type="button" disabled={sending || payNowLocked} onClick={() => setStep(photoId ? "preview" : "qr")} className={secondary}>
                <QrCode aria-hidden="true" size={20} />
                Chuyển khoản
              </button>
              {/* Tiền mặt gửi đơn ngay nên là nút chính; lý do khóa ngay trên nó (FR-04c, R41) */}
              {reason}
              <button type="button" disabled={sending || !!blockReason || payNowLocked} onClick={onCash} className={primary}>
                {sending && !payLater?.busy ? "Đang gửi…" : "Tiền mặt"}
              </button>
              {payLater && (
                <button
                  type="button"
                  disabled={sending || !!blockReason || payLater.locked}
                  onClick={payLater.onClick}
                  className="flex min-h-14 w-full flex-col items-center justify-center rounded-2xl text-warn disabled:opacity-35"
                >
                  <span className="flex items-center gap-2 font-semibold">
                    <NotebookPen aria-hidden="true" size={18} />
                    {payLater.busy ? "Đang gửi…" : payLater.label}
                  </span>
                  {discount > 0 && <span className="text-xs text-muted">(giảm giá chọn lúc thu tiền)</span>}
                </button>
              )}
            </section>
          </>
        )}

        {step === "qr" && (
          <section className="flex flex-1 flex-col gap-4">
            <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl bg-surface p-5">
              <Image src="/qr.jpg" alt="Mã QR chuyển khoản của quán" width={1072} height={1280} priority className="w-full max-w-64 rounded-2xl" />
              <p className="text-center">
                <span className="block text-[13px] text-muted">Chuyển đúng</span>
                <span className="text-[34px] font-extrabold">{formatVnd(total)}</span>
              </p>
            </div>
            <button type="button" onClick={shoot} className={primary}>
              Chụp ảnh chuyển khoản
            </button>
          </section>
        )}

        {step === "preview" && (
          <section className="flex flex-1 flex-col gap-3">
            <h2 className="flex items-center justify-between text-[22px] font-bold">
              Kiểm tra ảnh <span className="font-extrabold">{formatVnd(total)}</span>
            </h2>
            <div className="grid flex-1 place-items-center overflow-hidden rounded-3xl bg-surface">
              {shown && (
                // eslint-disable-next-line @next/next/no-img-element -- ảnh blob: hoặc Cloudinary đã thu nhỏ
                <img src={shown} alt="Ảnh chuyển khoản vừa chụp" className="max-h-[50dvh] object-contain" />
              )}
            </div>
            {uploadFailed ? (
              <p role="alert" className="rounded-[14px] bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">
                {UPLOAD_ERROR}
              </p>
            ) : (
              <p className={`text-[13px] ${uploading ? "text-muted" : "text-ok"}`}>
                {uploading ? "Đang tải ảnh…" : photoId ? "Đã tải ảnh lên" : ""}
              </p>
            )}
            {reason}
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2.5">
              <button
                type="button"
                disabled={sending}
                onClick={() => (uploadFailed && lastFile.current ? void send(lastFile.current) : shoot())}
                className={`${secondary} px-5`}
              >
                <RotateCcw aria-hidden="true" size={18} />
                {uploadFailed ? "Thử lại" : "Chụp lại"}
              </button>
              <button
                type="button"
                aria-label="Xác nhận đã thanh toán"
                disabled={!photoId || uploading || sending || !!blockReason || payNowLocked}
                onClick={onTransfer}
                className={primary}
              >
                {sending ? "Đang gửi…" : uploading ? "Đang tải ảnh…" : "Xác nhận đã thanh toán"}
              </button>
            </div>
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-[14px] bg-danger-soft px-3.5 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label="Ảnh chuyển khoản"
          tabIndex={-1}
          className="sr-only"
          onChange={pick}
        />
      </div>
    </dialog>
  );
}

// Giảm giá (SRS FR-03): nút có sẵn và ô nhập tay; nút đang chọn đảo màu kem, cam dành cho hành động chính
function Discount({ value, onChange, disabled }: { value: number; onChange: (p: number) => void; disabled: boolean }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const p = parseDiscountInput(draft);
    if (p !== null) onChange(p);
    setDraft(null);
  };
  return (
    <fieldset disabled={disabled}>
      <legend className="pb-2 text-[13px] font-semibold text-muted">Giảm giá</legend>
      <div className="flex gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={value === p}
            onClick={() => onChange(value === p ? 0 : p)}
            className={`h-12 flex-1 rounded-[14px] text-[15px] font-semibold ${value === p ? "bg-ink text-bg" : "bg-surface"}`}
          >
            {p}%
          </button>
        ))}
        <input
          aria-label="Giảm giá (%)"
          inputMode="numeric"
          placeholder="– %"
          value={draft ?? (value && !PRESETS.includes(value) ? String(value) : "")}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="h-12 w-17 rounded-[14px] bg-transparent text-center ring-[1.5px] ring-line placeholder:text-muted focus:ring-accent focus:outline-none"
        />
      </div>
    </fieldset>
  );
}
