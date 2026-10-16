"use client";
import { ChevronUp } from "lucide-react";
import { formatVnd } from "@/lib/money";

// Thanh giỏ đơn dính đáy trên điện thoại (DESIGN.md): trống thì xám, có món thì khối cam
export function CartBar({ count, total, onOpen }: { count: number; total: number; onOpen: () => void }) {
  if (count === 0)
    return (
      <div className="flex h-18 flex-col justify-center rounded-[20px] bg-surface px-5">
        <p className="text-[13px] font-medium text-muted">Giỏ đơn trống</p>
        <p className="font-medium">Chạm món để thêm</p>
      </div>
    );
  return (
    <button
      type="button"
      onClick={onOpen}
      className="fade-in flex h-18 w-full items-center justify-between gap-3 rounded-[20px] bg-accent pr-4 pl-5 text-left text-accent-ink"
    >
      <span className="min-w-0">
        <span className="block text-[13px] font-medium">{count} món</span>
        <span data-testid="bar-total" className="block truncate text-2xl font-extrabold">
          {formatVnd(total)}
        </span>
      </span>
      <span className="flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-accent-ink/10 px-3.5 font-semibold">
        Giỏ đơn
        <ChevronUp aria-hidden="true" size={18} />
      </span>
    </button>
  );
}
