"use client";
import { useState } from "react";
import { Delete } from "lucide-react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

export function PinLogin({
  onLogin,
}: {
  onLogin: (pin: string) => Promise<string | null>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function press(key: string) {
    setError(null);
    if (key === "⌫") setPin((p) => p.slice(0, -1));
    else if (key) setPin((p) => (p.length < 6 ? p + key : p));
  }

  async function submit() {
    setBusy(true);
    const failure = await onLogin(pin);
    setBusy(false);
    if (failure) {
      setError(failure);
      setPin("");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-center text-xl font-semibold">Nhập PIN quán</h1>
      <p aria-label="PIN đã nhập" className="flex justify-center gap-4">
        <span className="sr-only">Đã nhập {pin.length} trên 6 số</span>
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`size-3.5 rounded-full border transition-colors duration-150 ${i < pin.length ? "border-ember bg-ember" : "border-edge"}`}
          />
        ))}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, i) =>
          key ? (
            <button
              key={i}
              type="button"
              aria-label={key === "⌫" ? "Xóa số" : key}
              onClick={() => press(key)}
              className="flex min-h-16 items-center justify-center rounded-xl border border-edge text-2xl font-semibold tabular-nums transition-colors duration-150 active:border-ink active:bg-ink active:text-bg"
            >
              {key === "⌫" ? <Delete aria-hidden="true" /> : key}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      {error && (
        <p role="alert" className="text-center font-medium text-danger">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={pin.length !== 6 || busy}
        onClick={() => void submit()}
        className="min-h-16 w-full rounded-2xl bg-ember text-xl font-extrabold text-ember-ink disabled:bg-raised disabled:text-ink-muted"
      >
        Vào
      </button>
    </div>
  );
}
