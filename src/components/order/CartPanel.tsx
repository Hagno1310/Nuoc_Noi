"use client";
import { Minus, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ActiveSeat } from "@/lib/api";
import { useTwoStep } from "@/lib/admin/useTwoStep";
import { formatVnd } from "@/lib/money";
import { discountAmount, parseDiscountInput, parseQuantityInput, subtotal, type CartLine } from "@/lib/order/cart";
import { SeatPicker, type SeatSelection } from "./SeatPicker";

const PRESETS = [5, 10, 15, 20];
const STEP =
  "flex min-h-12 min-w-12 items-center justify-center rounded-lg border border-edge transition-[background-color,transform] duration-150 active:scale-95 active:bg-raised disabled:opacity-40";

// SRS FR-02, FR-03, FR-03b: dòng đơn, giảm giá, tổng, chỗ ngồi; dùng chung cho tấm giỏ đơn (điện thoại) và phiếu đơn (màn rộng)
export function CartPanel({
  cart,
  discount,
  seats,
  selection,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
  onClear,
  onDiscount,
  onSeat,
  onClose,
  notices,
  footer,
}: {
  cart: CartLine[];
  discount: number;
  seats: ActiveSeat[];
  selection: SeatSelection;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSetQuantity: (id: string, q: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onDiscount: (p: number) => void;
  onSeat: (s: SeatSelection) => void;
  onClose?: () => void;
  notices: ReactNode;
  footer: ReactNode;
}) {
  const clear = useTwoStep();
  const sub = subtotal(cart);
  const off = discountAmount(sub, discount);
  return (
    <section aria-label="Giỏ đơn" className="flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-line pb-2">
        <h2 className="flex-1 font-display text-3xl text-ink">Giỏ đơn</h2>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (clear.armed === null) return clear.arm(true);
              clear.reset();
              onClear();
            }}
            className={`min-h-12 rounded-lg border px-3 text-sm font-semibold transition-colors duration-150 ${clear.armed ? "border-danger bg-danger text-ember-ink" : "border-danger/70 text-danger"}`}
          >
            {clear.armed ? "Chắc chắn xóa hết?" : "Xóa hết"}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            aria-label="Đóng giỏ đơn"
            onClick={onClose}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-lg text-ink-muted transition-colors duration-150 hover:text-ink"
          >
            <X aria-hidden="true" size={22} />
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <p className="text-ink-muted">Giỏ đơn trống. Chạm món để thêm.</p>
      ) : (
        <ul className="-mt-2 divide-y divide-line">
          {cart.map((l) => (
            <LineRow
              key={l.menuItemId}
              line={l}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              onSetQuantity={onSetQuantity}
              onRemove={onRemove}
            />
          ))}
        </ul>
      )}

      <Discount value={discount} onChange={onDiscount} />

      <dl className="space-y-1 tabular-nums">
        <div className="flex justify-between text-ink-muted">
          <dt>Tạm tính</dt>
          <dd>{formatVnd(sub)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-ink-muted">
            <dt>Giảm {discount}%</dt>
            <dd>−{formatVnd(off)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 pt-1">
          <dt className="font-semibold">Thành tiền</dt>
          <dd data-testid="total" className="truncate font-display text-4xl">
            {formatVnd(sub - off)}
          </dd>
        </div>
      </dl>

      <SeatPicker seats={seats} selection={selection} onChange={onSeat} />
      <p
        aria-live="polite"
        className={selection.kind === "seat" ? "font-display text-3xl" : "font-semibold text-warn"}
      >
        {selection.kind === "seat" ? selection.name : "Chưa chọn chỗ ngồi"}
      </p>

      {notices}
      {footer}
    </section>
  );
}

function LineRow({
  line,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
}: {
  line: CartLine;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSetQuantity: (id: string, q: number) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const q = parseQuantityInput(draft);
    if (q !== null) onSetQuantity(line.menuItemId, q);
    setDraft(null);
  };
  return (
    <li className={`space-y-2 py-3 transition-colors duration-200 ${line.priceChanged ? "rounded-lg bg-warn/15 px-2" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={`min-w-0 font-semibold ${line.archived ? "text-ink-muted line-through" : ""}`}>{line.name}</span>
        <span className="font-semibold tabular-nums">{formatVnd(line.price * line.quantity)}</span>
      </div>
      {line.archived ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-warn">Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại</p>
          <button
            type="button"
            onClick={() => onRemove(line.menuItemId)}
            className="min-h-12 shrink-0 rounded-lg border border-edge px-3 text-sm transition-colors duration-150 hover:border-ink"
          >
            Bỏ khỏi đơn
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="flex-1 text-sm text-ink-muted tabular-nums">{formatVnd(line.price)}</span>
          <button type="button" aria-label={`Bớt 1 ${line.name}`} onClick={() => onDecrement(line.menuItemId)} className={STEP}>
            <Minus aria-hidden="true" size={18} />
          </button>
          <input
            aria-label={`Số lượng ${line.name}`}
            inputMode="numeric"
            value={draft ?? String(line.quantity)}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="min-h-12 w-14 rounded-lg border border-edge bg-transparent text-center tabular-nums transition-colors duration-150 focus:border-ember"
          />
          <button
            type="button"
            aria-label={`Thêm 1 ${line.name}`}
            disabled={line.quantity >= 99}
            onClick={() => onIncrement(line.menuItemId)}
            className={STEP}
          >
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>
      )}
    </li>
  );
}

// Giảm giá (SRS FR-03): nút có sẵn và ô nhập tay. Nút đang chọn đảo màu kem, để mực cam dành cho hành động chính.
function Discount({ value, onChange }: { value: number; onChange: (p: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const p = parseDiscountInput(draft);
    if (p !== null) onChange(p);
    setDraft(null);
  };
  return (
    <fieldset className="space-y-2">
      <legend className="pb-1 font-display text-xl text-ink">Giảm giá</legend>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={value === p}
            onClick={() => onChange(value === p ? 0 : p)}
            className={`min-h-12 min-w-14 rounded-lg border px-3 font-semibold tabular-nums transition-colors duration-150 ${value === p ? "border-ink bg-ink text-bg" : "border-edge"}`}
          >
            {p}%
          </button>
        ))}
        <label className="flex items-center gap-1">
          <input
            aria-label="Giảm giá (%)"
            inputMode="numeric"
            placeholder="%"
            value={draft ?? (value && !PRESETS.includes(value) ? String(value) : "")}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className="min-h-12 w-16 rounded-lg border border-edge bg-transparent text-center tabular-nums transition-colors duration-150 placeholder:text-ink-muted focus:border-ember"
          />
          <span aria-hidden="true" className="text-ink-muted">
            %
          </span>
        </label>
      </div>
    </fieldset>
  );
}
