"use client";
import { useEffect, useRef, type ReactNode } from "react";
import type { QuantityAction } from "@/lib/order/quantity";

const QUICK_ADDS = [1, 2, 5, 10];
// Dấu in: nét mảnh khi nghỉ, khối đặc khi nhấn (order-brief §3)
const key =
  "flex items-center justify-center rounded-xl border border-edge font-extrabold transition-colors duration-150 active:border-ink active:bg-ink active:text-bg";

export function QuantityPad({
  quantity,
  dispatch,
  children,
}: {
  quantity: number;
  dispatch: (a: QuantityAction) => void;
  // Nằm giữa số cốc và các phím (thành tiền, chỗ ngồi), để phím rơi vào vùng ngón cái
  children?: ReactNode;
}) {
  // Số cốc nảy nhẹ mỗi lần đổi: xác nhận phím đã ăn (bỏ khi người dùng giảm chuyển động)
  const input = useRef<HTMLInputElement>(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = input.current;
    if (!el?.animate || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    el.animate([{ transform: "scale(1.08)" }, { transform: "scale(1)" }], {
      duration: 160,
      easing: "cubic-bezier(0.16, 1, 0.3, 1)",
    });
  }, [quantity]);

  return (
    <>
      <label className="flex items-baseline justify-center gap-2">
        <input
          ref={input}
          aria-label="Số lượng cốc"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={quantity === 0 ? "" : String(quantity)}
          onChange={(e) => dispatch({ type: "set", raw: e.target.value })}
          style={{ width: `${Math.max(1, String(quantity).length) + 0.2}ch` }}
          className="bg-transparent text-right font-display text-7xl leading-none [@media(min-height:740px)]:text-8xl min-[380px]:[@media(min-height:740px)]:text-9xl tabular-nums border-b-2 border-transparent placeholder:text-ink-muted/60 focus-visible:border-ember focus-visible:outline-none"
        />
        <span
          aria-hidden="true"
          className="font-display text-2xl tracking-wide text-ink-muted [@media(min-height:740px)]:text-3xl"
        >
          cốc
        </span>
      </label>
      {children}
      <div className="mt-auto space-y-2">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_ADDS.map((n) => (
            <button
              key={n}
              type="button"
              className={`${key} min-h-14 font-display text-3xl font-normal tracking-wide`}
              onClick={() => dispatch({ type: "add", amount: n })}
            >
              +{n}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`${key} min-h-12 text-xl text-ink-muted`}
            onClick={() => dispatch({ type: "decrement" })}
          >
            −1
          </button>
          <button
            type="button"
            className={`${key} min-h-12 text-xl text-ink-muted`}
            onClick={() => dispatch({ type: "clear" })}
          >
            Xóa
          </button>
        </div>
      </div>
    </>
  );
}
