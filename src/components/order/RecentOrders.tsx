"use client";
import { Camera } from "lucide-react";
import { useEffect, useState } from "react";
import type { MyOrder } from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { summarize } from "@/lib/order/cart";
import { formatVnTime } from "@/lib/time";
import { PhotoViewer } from "@/components/TransferPhoto";

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

// SRS FR-04b: đơn và lượt gọi Trả sau do máy này tạo trong ngày kinh doanh. Đơn hủy giữ dòng, gạch ngang.
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
  onCancel: (o: MyOrder) => void;
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
    <section aria-label="Đơn vừa tạo" id="don-vua-tao" className="space-y-2 pt-7 pb-8">
      <h2 className="text-lg font-bold">Đơn vừa tạo</h2>
      {orders.length === 0 && <p className="text-sm text-muted">Chưa có đơn nào.</p>}
      <ul className="space-y-2">
        {orders.map((o) => {
          const cancelled = o.status === "cancelled";
          const later = o.kind === "round";
          const live = later ? o.status === "open" : !cancelled;
          const cancellable = live && nowMs - Date.parse(o.created_at) <= CANCEL_WINDOW_MS;
          const strike = cancelled ? "text-muted line-through" : "";
          return (
            <li key={o.id} className="rise flex items-center gap-1.5 rounded-[18px] bg-surface py-2.5 pr-2 pl-4">
              <div className={`min-w-0 flex-1 ${strike}`}>
                <p className="text-sm font-semibold">
                  {formatVnTime(o.created_at)} · {o.seat_name}
                </p>
                <p className="truncate text-[13px] text-muted">{summarize(o.lines)}</p>
              </div>
              <div className="flex flex-col items-end px-1">
                <p className={`text-[15px] font-bold ${strike}`}>{formatVnd(o.total_amount)}</p>
                {later ? (
                  <p className="text-xs font-semibold text-warn">Trả sau</p>
                ) : (
                  o.discount_percent > 0 && <p className="text-xs text-ok">−{o.discount_percent}%</p>
                )}
                {cancelled && <p className="text-xs font-semibold text-danger">Đã hủy</p>}
              </div>
              {o.transfer_photo_id && (
                <button
                  type="button"
                  aria-label="Xem ảnh chuyển khoản"
                  onClick={() => setPhoto(o.transfer_photo_id)}
                  className="grid size-12 shrink-0 place-items-center text-muted"
                >
                  <Camera aria-hidden="true" size={18} />
                </button>
              )}
              {cancellable && (
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => onCancel(o)}
                  className="h-12 shrink-0 rounded-[14px] bg-danger-soft px-3.5 text-sm font-semibold text-danger disabled:opacity-50"
                >
                  {cancellingId === o.id ? "Đang hủy…" : "Hủy"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <PhotoViewer publicId={photo} onClose={() => setPhoto(null)} />
    </section>
  );
}
