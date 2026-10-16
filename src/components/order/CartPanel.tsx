"use client";
import { Armchair, MessageSquareText, Minus, Plus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { ActiveSeat } from "@/lib/api";
import { useTwoStep } from "@/lib/admin/useTwoStep";
import { formatVnd } from "@/lib/money";
import { lineKey, MAX_NOTE, parseQuantityInput, subtotal, type CartLine } from "@/lib/order/cart";
import { SeatPicker, type SeatSelection } from "./SeatPicker";
import { Sheet } from "./Sheet";

const NOTE_PRESETS = ["Ít đá", "Không đá", "Ít ngọt"];
const STEP = "grid size-12 shrink-0 place-items-center rounded-[14px] bg-surface-2 disabled:opacity-40";

// SRS FR-02, FR-03b: dòng đơn (kèm ghi chú), chỗ ngồi; đáy dính Tạm tính, Đang chọn và nút gửi.
// Dùng chung cho tấm giỏ đơn (điện thoại) và phiếu đơn (màn rộng). Giảm giá nằm trong tấm thanh toán (v3.8).
export function CartPanel({
  cart,
  seats,
  openSeats,
  selection,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onSetNote,
  onRemove,
  onClear,
  onSeat,
  onClose,
  notices,
  footer,
}: {
  cart: CartLine[];
  seats: ActiveSeat[];
  // Chỗ ngồi đang có đơn chờ thanh toán → tạm tính của đơn đó
  openSeats: Map<string, number>;
  selection: SeatSelection;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onSetQuantity: (key: string, q: number) => void;
  onSetNote: (key: string, note: string) => void;
  onRemove: (key: string) => void;
  onClear: () => void;
  onSeat: (s: SeatSelection) => void;
  // Có khi panel nằm trong tấm giỏ đơn (điện thoại)
  onClose?: () => void;
  notices: ReactNode;
  footer: ReactNode;
}) {
  const clear = useTwoStep();
  const [noteFor, setNoteFor] = useState<CartLine | null>(null);
  const open = selection.kind === "seat" ? openSeats.get(selection.id) : undefined;
  return (
    <section aria-label="Giỏ đơn" className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 pb-2">
        <h2 className="flex-1 text-[22px] font-bold">Giỏ đơn</h2>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (clear.armed === null) return clear.arm(true);
              clear.reset();
              onClear();
            }}
            className={`h-12 rounded-xl px-3.5 text-sm font-semibold ${clear.armed ? "bg-danger text-accent-ink" : "bg-danger-soft text-danger"}`}
          >
            {clear.armed ? "Chắc chắn xóa hết?" : "Xóa hết"}
          </button>
        )}
        {onClose && (
          <button type="button" aria-label="Đóng giỏ đơn" onClick={onClose} className="grid size-12 place-items-center rounded-full bg-surface">
            <X aria-hidden="true" size={18} />
          </button>
        )}
      </div>

      <div className="-mx-1 flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-1 pt-1 pb-5">
        {cart.length === 0 ? (
          <p className="text-muted">Giỏ đơn trống. Chạm món để thêm.</p>
        ) : (
          <ul className="space-y-2">
            {cart.map((l) => (
              <LineRow
                key={lineKey(l)}
                line={l}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onSetQuantity={onSetQuantity}
                onRemove={onRemove}
                onNote={() => setNoteFor(l)}
              />
            ))}
          </ul>
        )}
        <SeatPicker seats={seats} openSeats={openSeats} selection={selection} onChange={onSeat} />
      </div>

      <div className="shrink-0 space-y-2 rounded-3xl bg-surface p-4">
        <p className="flex items-center justify-between">
          <span className="font-semibold">Tạm tính</span>
          <span data-testid="total" className="text-[32px] leading-tight font-extrabold">
            {formatVnd(subtotal(cart))}
          </span>
        </p>
        {notices}
        <p aria-live="polite" className="flex items-center gap-2 text-sm font-medium">
          {selection.kind === "seat" ? (
            <>
              <Armchair aria-hidden="true" size={16} className="text-accent" />
              Đang chọn: {selection.name}
              {open !== undefined && <span className="text-warn">· đang chờ thanh toán {formatVnd(open)}</span>}
            </>
          ) : (
            <span className="text-warn">Chưa chọn chỗ ngồi</span>
          )}
        </p>
        {footer}
      </div>
      <NoteSheet line={noteFor} onSave={(note) => noteFor && onSetNote(lineKey(noteFor), note)} onClose={() => setNoteFor(null)} />
    </section>
  );
}

function LineRow({
  line,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onRemove,
  onNote,
}: {
  line: CartLine;
  onIncrement: (key: string) => void;
  onDecrement: (key: string) => void;
  onSetQuantity: (key: string, q: number) => void;
  onRemove: (key: string) => void;
  onNote: () => void;
}) {
  const key = lineKey(line);
  const [draft, setDraft] = useState<string | null>(null);
  const commit = () => {
    if (draft === null) return;
    const q = parseQuantityInput(draft);
    if (q !== null) onSetQuantity(key, q);
    setDraft(null);
  };
  return (
    <li
      className={`flex items-center gap-2.5 rounded-[18px] bg-surface py-3 pr-3 pl-4 ${line.priceChanged ? "ring-[1.5px] ring-warn" : ""}`}
    >
      <div className="min-w-0 flex-1">
        {/* FR-02: chạm tên dòng đơn thì mở ô ghi chú */}
        <button
          type="button"
          disabled={line.archived}
          aria-label={`Ghi chú cho ${line.name}`}
          onClick={onNote}
          className="flex min-h-12 w-full flex-col justify-center text-left"
        >
          <span className={`truncate text-[17px] font-semibold ${line.archived ? "text-muted line-through" : ""}`}>{line.name}</span>
          {!line.archived && (
            <span className="flex items-center gap-1 text-xs">
            {line.note ? (
              <span className="flex items-center gap-1 rounded-lg bg-warn-soft px-2 py-0.5 font-medium text-warn">
                <MessageSquareText aria-hidden="true" size={12} />
                {line.note}
              </span>
            ) : (
              <span className="text-muted">+ Ghi chú</span>
            )}
            </span>
          )}
        </button>
        {line.archived ? (
          <p className="text-xs text-danger">Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại</p>
        ) : (
          <p className={`text-[13px] ${line.priceChanged ? "font-semibold text-warn" : "text-muted"}`}>
            {formatVnd(line.price)} · {formatVnd(line.price * line.quantity)}
          </p>
        )}
      </div>
      {line.archived ? (
        <button type="button" onClick={() => onRemove(key)} className="h-12 shrink-0 rounded-[14px] bg-surface-2 px-3 text-sm font-semibold">
          Bỏ khỏi đơn
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <button type="button" aria-label={`Bớt 1 ${line.name}`} onClick={() => onDecrement(key)} className={STEP}>
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
            className="h-12 w-12 bg-transparent text-center text-lg font-bold"
          />
          <button
            type="button"
            aria-label={`Thêm 1 ${line.name}`}
            disabled={line.quantity >= 99}
            onClick={() => onIncrement(key)}
            className={STEP}
          >
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>
      )}
    </li>
  );
}

// SRS FR-02 (v3.8 R46): ghi chú dòng đơn, có nút mẫu, tối đa 60 ký tự
function NoteSheet({ line, onSave, onClose }: { line: CartLine | null; onSave: (note: string) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? line?.note ?? "";
  const done = (note: string) => {
    onSave(note);
    setDraft(null);
    onClose();
  };
  return (
    <Sheet
      open={line !== null}
      onClose={() => {
        setDraft(null);
        onClose();
      }}
      label="Ghi chú"
      title={`Ghi chú · ${line?.name ?? ""}`}
      subtitle={`Tối đa ${MAX_NOTE} ký tự`}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {NOTE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={value === p}
              onClick={() => setDraft(value === p ? "" : p)}
              className={`h-12 rounded-full px-4 text-sm font-semibold ${value === p ? "bg-ink text-bg" : "bg-surface"}`}
            >
              {p}
            </button>
          ))}
        </div>
        <label className="block space-y-1.5">
          <span className="sr-only">Ghi chú</span>
          <input
            value={value}
            maxLength={MAX_NOTE}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && done(value)}
            placeholder="Ví dụ: ít đá, thêm chanh"
            className="h-14 w-full rounded-[14px] bg-surface px-4 ring-accent placeholder:text-muted focus:ring-[1.5px] focus:outline-none"
          />
          <span className="block text-xs text-muted">
            {value.length}/{MAX_NOTE}
          </span>
        </label>
        <div className="flex gap-2.5">
          <button type="button" onClick={() => done("")} className="h-15 rounded-2xl bg-surface px-5 font-semibold text-muted">
            Bỏ ghi chú
          </button>
          <button type="button" onClick={() => done(value)} className="h-15 flex-1 rounded-2xl bg-accent font-semibold text-accent-ink">
            Lưu ghi chú
          </button>
        </div>
      </div>
    </Sheet>
  );
}
