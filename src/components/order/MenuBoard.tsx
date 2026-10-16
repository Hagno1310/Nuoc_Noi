"use client";
import { Minus } from "lucide-react";
import { useRef } from "react";
import { buzz } from "@/lib/haptics";
import { formatVnd } from "@/lib/money";
import { lineKey, type CartLine, type MenuItem } from "@/lib/order/cart";

const HOLD_MS = 500;

// SRS FR-01: lưới món 2 cột. Chạm là +1 (số nảy, rung nhẹ); chạm giữ mở bàn phím số; món trong giỏ có badge và nút −.
export function MenuBoard({
  menu,
  failed,
  cart,
  onAdd,
  onHold,
  onRemoveOne,
}: {
  menu: MenuItem[] | null;
  failed: boolean;
  cart: CartLine[];
  onAdd: (item: MenuItem) => void;
  onHold: (item: MenuItem) => void;
  onRemoveOne: (key: string) => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const held = useRef(false);

  if (menu === null) {
    if (failed)
      return (
        <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-danger">
          Không tải được thực đơn. Kiểm tra mạng rồi tải lại trang.
        </p>
      );
    return (
      <div aria-busy="true" aria-label="Đang tải thực đơn" className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-29 rounded-[18px] bg-surface motion-safe:animate-pulse" />
        ))}
      </div>
    );
  }
  const items = menu.filter((m) => !m.is_archived);
  if (items.length === 0)
    return <p className="py-6 text-muted">Chưa có món nào đang bán – nhờ chủ quán thêm ở trang Thực đơn.</p>;
  // Số trên ô là dòng không ghi chú; dòng có ghi chú sửa trong giỏ đơn
  const qty = new Map(cart.filter((l) => !l.note).map((l) => [l.menuItemId, l.quantity]));
  const stop = () => clearTimeout(timer.current);

  return (
    <div role="group" aria-label="Thực đơn" className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
      {items.map((m) => {
        const n = qty.get(m.id) ?? 0;
        return (
          <div
            key={m.id}
            className={`relative h-29 rounded-[18px] transition-colors duration-150 ${n ? "bg-accent-soft ring-[1.5px] ring-accent" : "bg-surface"}`}
          >
            <button
              type="button"
              aria-label={n > 0 ? `${m.name}, ${formatVnd(m.price)}, đang có ${n} trong giỏ` : `${m.name}, ${formatVnd(m.price)}`}
              onPointerDown={() => {
                held.current = false;
                timer.current = setTimeout(() => {
                  held.current = true;
                  buzz(15);
                  onHold(m);
                }, HOLD_MS);
              }}
              onPointerUp={stop}
              onPointerLeave={stop}
              onPointerCancel={stop}
              onContextMenu={(e) => e.preventDefault()}
              onClick={() => {
                if (held.current) return void (held.current = false);
                buzz(10);
                onAdd(m);
              }}
              className="flex size-full flex-col justify-between rounded-[18px] p-3.5 pr-12 text-left select-none [-webkit-touch-callout:none]"
            >
              <span className="line-clamp-2 text-[17px] leading-tight font-semibold">{m.name}</span>
              <span className={`text-sm font-medium ${n ? "text-ink" : "text-muted"}`}>{formatVnd(m.price)}</span>
            </button>
            {n > 0 && (
              <>
                <span
                  key={n}
                  aria-hidden="true"
                  className="pop pointer-events-none absolute top-3 right-3 grid size-7.5 place-items-center rounded-full bg-accent text-[15px] font-bold text-accent-ink"
                >
                  {n}
                </span>
                <button
                  type="button"
                  aria-label={`Bớt 1 ${m.name}`}
                  onClick={() => onRemoveOne(lineKey({ menuItemId: m.id, note: "" }))}
                  className="fade-in absolute right-2.5 bottom-2.5 grid size-12 place-items-center rounded-[14px] bg-surface-2"
                >
                  <Minus aria-hidden="true" size={20} />
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
