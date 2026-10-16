"use client";
import { Delete } from "lucide-react";
import { useState } from "react";
import { formatVnd } from "@/lib/money";
import { MAX_QUANTITY, type MenuItem } from "@/lib/order/cart";
import { Sheet } from "./Sheet";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "⌫"];

// SRS FR-01 (v3.8 R48): chạm giữ ô món để nhập số lượng. 0 hoặc trống thì giữ số cũ.
export function QuantityPad({
  item,
  current,
  onDone,
  onClose,
}: {
  item: MenuItem | null;
  current: number;
  onDone: (q: number) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const q = Math.min(Number(draft) || 0, MAX_QUANTITY);
  const close = () => {
    setDraft("");
    onClose();
  };
  return (
    <Sheet open={item !== null} onClose={close} label="Nhập số lượng" title={item?.name} subtitle={item && `${formatVnd(item.price)} · nhập số lượng`}>
      <div className="space-y-3">
        <p className="flex h-18 items-center justify-between rounded-[18px] bg-surface px-5 ring-[1.5px] ring-accent">
          <span aria-live="polite" className="text-4xl font-extrabold">
            {draft || current || 0}
          </span>
          {item && q > 0 && <span className="text-sm text-muted">= {formatVnd(item.price * q)}</span>}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              aria-label={k === "⌫" ? "Xóa số" : k === "C" ? "Xóa hết số" : k}
              onClick={() => setDraft((d) => (k === "C" ? "" : k === "⌫" ? d.slice(0, -1) : (d + k).replace(/^0+/, "").slice(0, 2)))}
              className={`grid h-14 place-items-center rounded-2xl text-2xl font-semibold ${/\d/.test(k) ? "bg-surface" : "text-base text-muted"}`}
            >
              {k === "⌫" ? <Delete aria-hidden="true" size={22} /> : k === "C" ? "Xóa" : k}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            if (q > 0) onDone(q);
            close();
          }}
          className="h-15 w-full rounded-2xl bg-accent font-semibold text-accent-ink"
        >
          Xong
        </button>
      </div>
    </Sheet>
  );
}
