"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Camera } from "lucide-react";
import type { MyOrder } from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { summarize } from "@/lib/order/cart";
import { formatVnTime } from "@/lib/time";
import { PhotoViewer } from "@/components/TransferPhoto";

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

// SRS FR-04b: đơn do máy này tạo trong ngày kinh doanh, in như sổ: giờ và chỗ ngồi | món | thành tiền.
// Đơn chuyển khoản có nút máy ảnh để xem lại ảnh (v3.3). Đơn hủy giữ dòng, gạch ngang, có dấu HỦY in.
export function RecentOrders({
  orders,
  now,
  cancelBusy,
  cancellingId,
  onCancel,
}: {
  orders: MyOrder[];
  now: () => Date;
  cancelBusy: boolean;
  cancellingId: string | null;
  onCancel: (orderId: string) => void;
}) {
  // Render lại định kỳ để nút Hủy tự ẩn khi hết cửa sổ hủy
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(timer);
  }, []);
  const nowMs = now().getTime();
  const [photo, setPhoto] = useState<string | null>(null);

  return (
    <section aria-label="Đơn vừa tạo" className="space-y-2 pt-8 pb-8">
      <h2 className="border-b border-line pb-2 font-display text-2xl text-ink">Đơn vừa tạo</h2>
      {orders.length === 0 && (
        <div className="flex items-center gap-4 py-4 text-ink-muted">
          <Image src="/brand/motif-cocktail.png" alt="" width={40} height={49} className="opacity-40" />
          <p>Chưa có đơn nào.</p>
        </div>
      )}
      <ul className="divide-y divide-line">
        {orders.map((o) => {
          const cancelled = o.status === "cancelled";
          const cancellable = !cancelled && nowMs - Date.parse(o.created_at) <= CANCEL_WINDOW_MS;
          const muted = cancelled ? "text-ink-muted line-through" : "";
          return (
            <li key={o.id} className="row-in grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 py-2.5">
              <div className={`tabular-nums ${muted}`}>
                <p>{formatVnTime(o.created_at)}</p>
                <p className="text-sm text-ink-muted">{o.seat_name}</p>
              </div>
              <p className={`text-sm ${muted}`}>{summarize(o.lines)}</p>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {o.transfer_photo_id && (
                    <button
                      type="button"
                      aria-label="Xem ảnh chuyển khoản"
                      onClick={() => setPhoto(o.transfer_photo_id)}
                      className="grid size-12 place-items-center rounded-lg text-ink-muted transition-colors duration-150 active:bg-ink active:text-bg"
                    >
                      <Camera aria-hidden="true" size={20} />
                    </button>
                  )}
                  <p className={`font-semibold tabular-nums ${muted}`}>{formatVnd(o.total_amount)}</p>
                </div>
                {o.discount_percent > 0 && <p className="text-xs text-ink-muted">−{o.discount_percent}%</p>}
                {cancelled && (
                  <span className="rounded-sm border border-line px-1 text-xs font-semibold text-ink-muted">HỦY</span>
                )}
                {cancellable && (
                  <button
                    type="button"
                    disabled={cancelBusy}
                    onClick={() => onCancel(o.id)}
                    className="min-h-12 rounded-lg border border-danger/70 px-4 font-semibold text-danger transition-colors duration-150 active:bg-danger active:text-ember-ink disabled:opacity-50"
                  >
                    {cancellingId === o.id ? "Đang hủy…" : "Hủy"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <PhotoViewer publicId={photo} onClose={() => setPhoto(null)} />
    </section>
  );
}
