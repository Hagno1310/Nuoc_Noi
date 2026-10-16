"use client";
import { Delete } from "lucide-react";
import { useState } from "react";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"];

// SRS FR-00a: bàn phím số nhập PIN quán 6 số; đủ 6 số thì tự gửi (design.pen, màn "Đăng nhập PIN")
export function PinLogin({ onLogin }: { onLogin: (pin: string) => Promise<string | null> }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function press(key: string) {
    if (busy) return;
    setError(null);
    if (key === "⌫") return setPin((p) => p.slice(0, -1));
    const next = (pin + key).slice(0, 6);
    setPin(next);
    if (next.length < 6) return;
    setBusy(true);
    const failure = await onLogin(next);
    setBusy(false);
    if (failure) {
      setError(failure);
      setPin("");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <h1 className="text-[15px] font-medium text-muted">Nhập PIN quán</h1>
        <p aria-label="PIN đã nhập" className="flex gap-3.5">
          <span className="sr-only">Đã nhập {pin.length} trên 6 số</span>
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              aria-hidden="true"
              className={`size-3.5 rounded-full transition-colors duration-150 ${i < pin.length ? "bg-accent" : "bg-surface-2"}`}
            />
          ))}
        </p>
        <p role="alert" className="min-h-5 text-sm text-danger">
          {busy ? <span className="text-muted">Đang vào…</span> : error}
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {KEYS.map((key, i) =>
          key ? (
            <button
              key={i}
              type="button"
              disabled={busy}
              aria-label={key === "⌫" ? "Xóa số" : key}
              onClick={() => void press(key)}
              className={`flex h-16 items-center justify-center rounded-[20px] text-[26px] font-semibold ${key === "⌫" ? "text-muted" : "bg-surface active:bg-surface-2"}`}
            >
              {key === "⌫" ? <Delete aria-hidden="true" /> : key}
            </button>
          ) : (
            <span key={i} />
          ),
        )}
      </div>
    </div>
  );
}
