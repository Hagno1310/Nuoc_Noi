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
    <form onSubmit={submit} className="space-y-2">
      <p>
        Đơn giá chung hiện tại:{" "}
        <strong className="tabular-nums">{formatVnd(currentPrice)}/cốc</strong>
      </p>
      <label className="block">
        <span>Đơn giá chung mới (đ/cốc)</span>
        <input
          inputMode="numeric"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          className="mt-1 min-h-12 w-full max-w-xs rounded-lg border border-current/30 bg-transparent p-3 text-xl tabular-nums"
        />
      </label>
      {error && (
        <p role="alert" className="text-red-500">
          {error}
        </p>
      )}
      {saved && <p role="status">Đã lưu đơn giá chung mới.</p>}
      <button
        type="submit"
        disabled={busy}
        className="min-h-12 rounded-lg bg-emerald-600 px-6 font-bold text-white disabled:opacity-50"
      >
        {busy ? "Đang lưu…" : "Lưu thay đổi"}
      </button>
    </form>
  );
}
