"use client";
import type { QuantityAction } from "@/lib/order/quantity";

const QUICK_ADDS = [1, 2, 5, 10];
const btn =
  "min-h-14 rounded-xl text-2xl font-bold active:scale-95 transition-transform";

export function QuantityPad({
  quantity,
  dispatch,
}: {
  quantity: number;
  dispatch: (a: QuantityAction) => void;
}) {
  return (
    <div className="space-y-3">
      <input
        aria-label="Số lượng cốc"
        inputMode="numeric"
        pattern="[0-9]*"
        placeholder="0"
        value={quantity === 0 ? "" : String(quantity)}
        onChange={(e) => dispatch({ type: "set", raw: e.target.value })}
        className="w-full rounded-xl border-2 border-slate-300 py-3 text-center text-6xl font-extrabold tabular-nums"
      />
      <div className="grid grid-cols-4 gap-2">
        {QUICK_ADDS.map((n) => (
          <button
            key={n}
            type="button"
            className={`${btn} bg-sky-600 text-white`}
            onClick={() => dispatch({ type: "add", amount: n })}
          >
            +{n}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={`${btn} bg-slate-200`}
          onClick={() => dispatch({ type: "decrement" })}
        >
          −1
        </button>
        <button
          type="button"
          className={`${btn} bg-slate-200`}
          onClick={() => dispatch({ type: "clear" })}
        >
          Xóa
        </button>
      </div>
    </div>
  );
}
