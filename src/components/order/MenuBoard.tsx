"use client";
import { formatVnd } from "@/lib/money";
import type { CartLine, MenuItem } from "@/lib/order/cart";

// SRS FR-01: bảng giá in đậm như mặt bao diêm. Chạm một hàng là +1; món trong giỏ hiện số lượng mực cam ở đầu hàng.
export function MenuBoard({
  menu,
  failed,
  cart,
  onAdd,
}: {
  menu: MenuItem[] | null;
  failed: boolean;
  cart: CartLine[];
  onAdd: (item: MenuItem) => void;
}) {
  if (menu === null) {
    if (failed)
      return (
        <p role="alert" className="rounded-lg border border-danger/60 px-3 py-2 text-danger">
          Không tải được thực đơn. Kiểm tra mạng rồi tải lại trang.
        </p>
      );
    return (
      <div aria-busy="true" aria-label="Đang tải thực đơn" className="divide-y divide-line border-y border-line">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex min-h-14 items-center">
            <span className="h-5 w-32 rounded bg-raised motion-safe:animate-pulse" />
          </div>
        ))}
      </div>
    );
  }
  const items = menu.filter((m) => !m.is_archived);
  if (items.length === 0)
    return <p className="py-6 text-ink-muted">Chưa có món nào đang bán – nhờ chủ quán thêm ở trang Thực đơn.</p>;
  const qty = new Map(cart.map((l) => [l.menuItemId, l.quantity]));
  return (
    <div role="group" aria-label="Thực đơn" className="divide-y divide-line border-y border-line">
      {items.map((m) => {
        const n = qty.get(m.id) ?? 0;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onAdd(m)}
            aria-label={n > 0 ? `${m.name}, ${formatVnd(m.price)}, đang có ${n} trong giỏ` : `${m.name}, ${formatVnd(m.price)}`}
            className="flex min-h-14 w-full items-center gap-3 px-1 text-left transition-colors duration-150 active:bg-ink active:text-bg"
          >
            <span aria-hidden="true" className="w-7 shrink-0 font-display text-xl text-ember tabular-nums">
              {n > 0 ? n : ""}
            </span>
            <span className="min-w-0 flex-1 truncate font-display text-xl">{m.name}</span>
            <span className="shrink-0 font-semibold tabular-nums">{formatVnd(m.price)}</span>
          </button>
        );
      })}
    </div>
  );
}
