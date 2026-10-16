"use client";
import { Armchair, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import type { OpenOrder } from "@/lib/api";
import { formatVnd } from "@/lib/money";
import { formatVnTime } from "@/lib/time";
import { Sheet } from "./Sheet";

const CANCEL_WINDOW_MS = 5 * 60 * 1000;

// SRS FR-04d: danh sách đơn chờ thanh toán của cả quán; chạm một đơn để xem lượt gọi, Gọi thêm hoặc Thu tiền
export function OpenOrders({
  open,
  orders,
  now,
  cancellingId,
  cancelBusy,
  onClose,
  onCancelRound,
  onMore,
  onCheckout,
}: {
  open: boolean;
  orders: OpenOrder[];
  now: () => Date;
  cancellingId: string | null;
  // Đang hủy ở bất kỳ đâu thì mọi nút hủy bị khóa (FR-04b)
  cancelBusy: boolean;
  onClose: () => void;
  onCancelRound: (roundId: string) => void;
  onMore: (o: OpenOrder) => void;
  onCheckout: (o: OpenOrder) => void;
}) {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const picked = orders.find((o) => o.id === pickedId) ?? null;
  const close = () => {
    setPickedId(null);
    onClose();
  };
  const total = orders.reduce((s, o) => s + o.subtotal_amount, 0);

  if (picked)
    return (
      <Sheet open={open} onClose={close} label="Đơn chờ thanh toán" title={picked.seat_name} subtitle={`Chờ thanh toán từ ${formatVnTime(picked.created_at)}`}>
        <div className="-mx-1 min-h-0 flex-1 space-y-2.5 overflow-y-auto px-1 pb-3">
          {picked.rounds.map((r, i) => (
            <section key={r.id} className="space-y-2 rounded-[18px] bg-surface p-3.5">
              <header className="flex min-h-12 items-center justify-between">
                <h3 className="text-[13px] font-semibold text-muted">
                  Lượt {i + 1} · {formatVnTime(r.created_at)}
                </h3>
                {now().getTime() - Date.parse(r.created_at) <= CANCEL_WINDOW_MS && (
                  <button
                    type="button"
                    disabled={cancelBusy}
                    onClick={() => onCancelRound(r.id)}
                    className="h-12 rounded-xl bg-danger-soft px-4 text-[13px] font-semibold text-danger disabled:opacity-50"
                  >
                    {cancellingId === r.id ? "Đang hủy…" : "Hủy"}
                  </button>
                )}
              </header>
              {r.lines.map((l, j) => (
                <div key={j} className="flex justify-between gap-3 text-[15px]">
                  <div>
                    <p className="font-medium">
                      {l.quantity} × {l.item_name}
                    </p>
                    {l.note && <p className="text-xs text-warn">{l.note}</p>}
                  </div>
                  <p>{formatVnd(l.line_amount)}</p>
                </div>
              ))}
            </section>
          ))}
        </div>
        <p className="flex shrink-0 items-center justify-between py-3">
          <span className="font-semibold">Tạm tính · {picked.item_count} món</span>
          <span className="text-[28px] font-extrabold">{formatVnd(picked.subtotal_amount)}</span>
        </p>
        <div className="flex shrink-0 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setPickedId(null);
              onMore(picked);
            }}
            className="flex h-15 items-center gap-2 rounded-2xl bg-surface-2 px-5 font-semibold"
          >
            <Plus aria-hidden="true" size={18} />
            Gọi thêm
          </button>
          <button
            type="button"
            onClick={() => {
              setPickedId(null);
              onCheckout(picked);
            }}
            className="h-15 flex-1 rounded-2xl bg-accent font-semibold text-accent-ink"
          >
            Thu tiền
          </button>
        </div>
      </Sheet>
    );

  return (
    <Sheet
      open={open}
      onClose={close}
      label="Chờ thanh toán"
      title="Chờ thanh toán"
      subtitle={orders.length ? `${orders.length} đơn · ${formatVnd(total)}` : undefined}
    >
      {orders.length === 0 && <p className="pb-4 text-muted">Không có đơn nào chờ thanh toán.</p>}
      <ul className="-mx-1 min-h-0 space-y-2 overflow-y-auto px-1 pb-2">
        {orders.map((o) => (
          <li key={o.id}>
            <button
              type="button"
              onClick={() => setPickedId(o.id)}
              className="flex h-18 w-full items-center gap-2.5 rounded-[18px] bg-surface pr-2.5 pl-4 text-left"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-warn-soft text-warn">
                <Armchair aria-hidden="true" size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold">{o.seat_name}</span>
                <span className="block text-xs text-muted">
                  Từ {formatVnTime(o.created_at)} · {o.rounds.length} lượt gọi · {o.item_count} món
                </span>
              </span>
              <span className="text-[15px] font-bold">{formatVnd(o.subtotal_amount)}</span>
              <ChevronRight aria-hidden="true" size={18} className="text-muted" />
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}
