"use client";
import { formatVnd } from "@/lib/money";

// Thanh giỏ đơn trên điện thoại: tấm in mực cam, tấm đảo màu duy nhất của màn order (hợp đồng thiết kế)
export function CartBar({ count, total, onOpen }: { count: number; total: number; onOpen: () => void }) {
  if (count === 0)
    return <p className="flex min-h-16 items-center justify-center text-ink-muted">Chạm món để thêm</p>;
  return (
    <div className="fade-in flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-ember px-4 text-ember-ink">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{count} món</p>
        <p data-testid="bar-total" className="truncate font-display text-3xl leading-tight tabular-nums">
          {formatVnd(total)}
        </p>
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="min-h-12 shrink-0 rounded-xl border-2 border-ember-ink px-5 font-display text-xl transition-transform duration-150 active:scale-[0.98]"
      >
        Giỏ đơn
      </button>
    </div>
  );
}
