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
    <section aria-label="Đơn vừa tạo" className="space-y-2">
      <h2 className="text-lg font-bold">Đơn vừa tạo</h2>
      <ul className="divide-y divide-slate-200">
        {orders.map((o) => {
          const cancelled = o.status === "cancelled";
          const cancellable =
            !cancelled && nowMs - Date.parse(o.created_at) <= CANCEL_WINDOW_MS;
          return (
            <li
              key={o.id}
              className="flex items-center justify-between gap-2 py-2"
            >
              <span className={cancelled ? "text-slate-400 line-through" : ""}>
                {formatVnTime(o.created_at)} · {o.seat_name ?? "—"} ·{" "}
                {o.quantity} cốc · {formatVnd(o.total_amount)}
              </span>
              {cancelled && (
                <span className="text-sm text-slate-500">Đã hủy</span>
              )}
              {cancellable && (
                <button
                  type="button"
                  disabled={cancelBusy}
                  onClick={() => onCancel(o.id)}
                  className="min-h-12 rounded-lg bg-red-100 px-3 font-semibold text-red-700 disabled:opacity-60"
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
