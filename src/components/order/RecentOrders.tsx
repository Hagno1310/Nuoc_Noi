"use client";
import { useEffect, useState } from "react";
import type { MyOrder } from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { formatVnTime } from "@/lib/time";

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

type Props = {
  orders: MyOrder[];
  now: () => Date;
  cancelBusy: boolean;
  cancellingId: string | null;
  onCancel: (orderId: string) => void;
};

// Vệt sáng của mỗi đơn dài theo số cốc (order-brief §3); 25 cốc trở lên là đủ chiều dài
const streakWidth = (cups: number) => `${Math.min(100, 6 + cups * 4)}%`;

export function RecentOrders({
  orders,
  now,
  cancelBusy,
  cancellingId,
  onCancel,
}: Props) {
  // Render lại định kỳ để nút Hủy tự ẩn khi hết cửa sổ hủy
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 15_000);
    return () => clearInterval(timer);
  }, []);

  if (orders.length === 0) return null;
  const nowMs = now().getTime();

  return (
    <section aria-label="Đơn vừa tạo" className="space-y-2 pt-4 pb-6">
      <h2 className="text-base font-semibold text-ink-muted">Đơn vừa tạo</h2>
      <ul className="divide-y divide-line">
        {orders.map((o) => {
          const cancelled = o.status === "cancelled";
          const cancellable =
            !cancelled && nowMs - Date.parse(o.created_at) <= CANCEL_WINDOW_MS;
          return (
            <li key={o.id} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1 space-y-1.5">
                <p
                  className={`tabular-nums ${cancelled ? "text-ink-muted line-through" : ""}`}
                >
                  {formatVnTime(o.created_at)} · {o.seat_name ?? "—"} ·{" "}
                  {o.quantity} cốc · {formatVnd(o.total_amount)}
                </p>
                <span
                  aria-hidden="true"
                  className={`block h-0.5 rounded-full ${cancelled ? "bg-line" : "bg-ember/70"}`}
                  style={{ width: streakWidth(o.quantity) }}
                />
              </div>
              {cancelled && (
                <span className="text-sm text-ink-muted">Đã hủy</span>
              )}
              {cancellable && (
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => onCancel(o.id)}
                  className="min-h-12 shrink-0 rounded-lg border border-danger/70 px-4 font-semibold text-danger active:bg-danger active:text-ember-ink disabled:opacity-50"
                >
                  {cancellingId === o.id ? "Đang hủy…" : "Hủy"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
