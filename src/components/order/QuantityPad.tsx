"use client";
import type { ReactNode } from "react";
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
  return (
    <>
      <label className="flex items-baseline justify-center gap-2">
        <input
          aria-label="Số lượng cốc"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="0"
          value={quantity === 0 ? "" : String(quantity)}
          onChange={(e) => dispatch({ type: "set", raw: e.target.value })}
          style={{ width: `${Math.max(1, String(quantity).length) + 0.2}ch` }}
          className="bg-transparent text-right text-7xl leading-none min-[380px]:[@media(min-height:740px)]:text-8xl font-extrabold tracking-tight tabular-nums border-b-2 border-transparent placeholder:text-ink-muted/60 focus-visible:border-ember focus-visible:outline-none"
        />
        <span
          aria-hidden="true"
          className="text-2xl font-medium text-ink-muted"
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
              className={`${key} min-h-14 text-2xl`}
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
