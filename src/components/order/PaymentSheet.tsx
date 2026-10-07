"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { transferPhotoUrl } from "@/lib/cloudinary";
import { formatVnd } from "@/lib/money";
import { shrinkImage, UploadError } from "@/lib/order/transferPhoto";

const UPLOAD_ERROR = "Chưa tải được ảnh – kiểm tra mạng rồi thử lại.";
type Step = "choose" | "qr" | "preview";

export type PaymentSheetProps = {
  open: boolean;
  total: number;
  seatName: string;
  sending: boolean;
  error: string | null;
  // Ảnh đã tải lên, OrderScreen giữ qua MENU_CHANGED và lỗi mạng (spec §4.1)
  photoId: string | null;
  upload: (file: Blob) => Promise<string>;
  onPhoto: (photoId: string | null) => void;
  onCash: () => void;
  onTransfer: () => void;
  onClose: () => void;
  onUnauthorized: () => void;
};

// SRS v3.3 FR-04c: tấm thanh toán. Tiền mặt gửi ngay; chuyển khoản: QR → chụp ảnh (bắt buộc) → kiểm tra ảnh → xác nhận.
// <dialog> gốc lo nền tối, khóa focus và Esc (như CartSheet). Toàn màn hình trên điện thoại, hộp giữa màn từ md.
export function PaymentSheet({
  open,
  total,
  seatName,
  sending,
  error,
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
  const primary =
    "min-h-16 w-full rounded-2xl bg-ember font-display text-2xl text-ember-ink transition-[transform,background-color] duration-150 active:scale-[0.98] disabled:bg-raised disabled:text-ink-muted";
  const choice =
    "min-h-16 rounded-2xl border border-edge bg-raised font-display text-2xl transition-[transform,background-color] duration-150 active:scale-[0.98] active:bg-ink active:text-bg disabled:opacity-50";

  return (
    <dialog
      ref={ref}
      aria-label="Thanh toán"
      onClose={() => {
        setStep("choose");
        onClose();
      }}
      onCancel={(e) => sending && e.preventDefault()}
      className="sheet-in m-0 h-dvh max-h-none w-full max-w-none bg-bg p-0 text-ink backdrop:bg-bg/80 md:m-auto md:h-auto md:max-h-[90dvh] md:max-w-md md:rounded-2xl md:border md:border-edge"
    >
      <div className="flex min-h-full flex-col gap-5 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <header className="text-center">
          <p className="text-ink-muted">{seatName}</p>
          <p data-testid="pay-total" className="font-display text-5xl tabular-nums">
            {formatVnd(total)}
          </p>
        </header>

        {step === "choose" && (
          <section className="space-y-3">
            <h2 className="text-center font-display text-2xl">Khách trả bằng?</h2>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" disabled={sending} onClick={onCash} className={choice}>
                {sending ? "Đang gửi…" : "Tiền mặt"}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={() => setStep(photoId ? "preview" : "qr")}
                className={choice}
              >
                Chuyển khoản
              </button>
            </div>
          </section>
        )}

        {step === "qr" && (
          <section className="space-y-4">
            <h2 className="text-center font-display text-2xl">Quét mã để chuyển khoản</h2>
            <Image
              src="/qr.jpg"
              alt="Mã QR chuyển khoản của quán"
              width={1072}
              height={1280}
              priority
              className="mx-auto w-full max-w-xs rounded-xl bg-white"
            />
            <button type="button" onClick={shoot} className={primary}>
              Chụp ảnh chuyển khoản
            </button>
          </section>
        )}

        {step === "preview" && (
          <section className="space-y-4">
            <h2 className="text-center font-display text-2xl">Kiểm tra ảnh</h2>
            {shown && (
              // eslint-disable-next-line @next/next/no-img-element -- ảnh blob: hoặc Cloudinary đã thu nhỏ
              <img
                src={shown}
                alt="Ảnh chuyển khoản vừa chụp"
                className="mx-auto max-h-[45dvh] rounded-xl border border-edge object-contain"
              />
            )}
            {uploadFailed && (
              <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-danger/60 px-3 py-2 text-danger">
                <span>{UPLOAD_ERROR}</span>
                <button
                  type="button"
                  onClick={() => lastFile.current && void send(lastFile.current)}
                  className="min-h-12 shrink-0 rounded-lg border border-danger/70 px-3 font-semibold"
                >
                  Thử lại
                </button>
              </div>
            )}
            <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-3">
              <button
                type="button"
                disabled={sending}
                onClick={shoot}
                className="min-h-16 rounded-2xl border border-edge px-4 font-semibold disabled:opacity-50"
              >
                Chụp lại
              </button>
              <button
                type="button"
                aria-label="Xác nhận đã thanh toán"
                disabled={!photoId || uploading || sending}
                onClick={onTransfer}
                className={primary}
              >
                {sending ? "Đang gửi…" : uploading ? "Đang tải ảnh…" : "Xác nhận đã thanh toán"}
              </button>
            </div>
          </section>
        )}

        {error && (
          <p role="alert" className="rounded-lg border border-danger/60 px-3 py-2 text-danger">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={sending}
          onClick={() => ref.current?.close()}
          className="mt-auto min-h-12 rounded-xl border border-edge font-semibold disabled:opacity-50"
        >
          Quay lại
        </button>
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
