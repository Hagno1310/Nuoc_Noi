"use client";
import { useState, type FormEvent } from "react";
import { parsePriceInput } from "@/lib/admin/validate";
import { formatVnd } from "@/lib/money";

type Props = {
  currentPrice: number;
  onSave: (price: number) => Promise<string | null>;
};

export function PriceForm({ currentPrice, onSave }: Props) {
  const [raw, setRaw] = useState(String(currentPrice));
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const price = parsePriceInput(raw);
    if (price === null)
      return setError("Giá phải là số nguyên từ 1đ đến 500.000đ.");
    setError(null);
    setBusy(true);
    const failure = await onSave(price);
    setBusy(false);
    if (failure) setError(failure);
    else setSaved(true);
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="flex items-baseline gap-2">
        <span className="font-display text-4xl tracking-wide tabular-nums">
          {formatVnd(currentPrice)}
        </span>
        <span className="text-sm text-ink-muted">/cốc, đang áp dụng</span>
      </p>
      <label htmlFor="new-price" className="block text-sm text-ink-muted">
        Đơn giá chung mới (đ/cốc)
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id="new-price"
          inputMode="numeric"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="min-h-12 w-40 rounded-lg border border-edge bg-transparent px-3 text-xl tabular-nums"
        />
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 rounded-lg bg-ember px-6 font-bold text-ember-ink disabled:opacity-50"
        >
          {busy ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </div>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {saved && <p role="status">Đã lưu đơn giá chung mới.</p>}
    </form>
  );
}
