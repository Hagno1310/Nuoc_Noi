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
    <div className="space-y-4">
      <h1 className="text-center text-2xl font-bold">Nhập PIN quán</h1>
      <p
        aria-label="PIN đã nhập"
        className="text-center text-4xl tracking-[0.5em]"
      >
        {"●".repeat(pin.length).padEnd(6, "○")}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key, i) =>
          key ? (
            <button
              key={i}
              type="button"
              aria-label={key === "⌫" ? "Xóa số" : key}
              onClick={() => press(key)}
              className="flex min-h-14 items-center justify-center rounded-xl bg-slate-200 text-2xl font-bold active:scale-95"
            >
              {key === "⌫" ? <Delete aria-hidden="true" /> : key}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
      {error && (
        <p role="alert" className="text-center font-medium text-red-600">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={pin.length !== 6 || busy}
        onClick={() => void submit()}
        className="min-h-14 w-full rounded-xl bg-emerald-600 text-xl font-bold text-white disabled:bg-slate-300"
      >
        Vào
      </button>
    </div>
  );
}
