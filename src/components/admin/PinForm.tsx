"use client";
import { useState, type FormEvent } from "react";
import { isValidPin } from "@/lib/admin/validate";
import { useTwoStep } from "@/lib/admin/useTwoStep";

export function PinForm({
  onSave,
}: {
  onSave: (pin: string) => Promise<string | null>;
}) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const step = useTwoStep();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    if (!isValidPin(pin)) return setError("PIN quán phải gồm đúng 6 chữ số.");
    if (pin !== confirm) return setError("Hai lần nhập PIN không khớp.");
    setError(null);
    // Đổi PIN đăng xuất mọi điện thoại nhân viên: bấm lần hai mới đổi
    if (!step.armed) return step.arm(true);
    step.reset();
    setBusy(true);
    const failure = await onSave(pin);
    setBusy(false);
    if (failure) return setError(failure);
    setSaved(true);
    setPin("");
    setConfirm("");
  }

  const edit = (set: (v: string) => void) => (v: string) => {
    step.reset();
    set(v);
  };
  const field =
    "mt-1 min-h-12 w-40 rounded-lg border border-edge bg-transparent p-3 text-xl tracking-widest";
  return (
    <form onSubmit={submit} className="space-y-2">
      <p className="text-sm text-warn">
        Đổi PIN quán sẽ đăng xuất ngay mọi điện thoại của nhân viên.
      </p>
      <div className="flex flex-wrap gap-4">
        <label className="block">
          <span className="block">PIN quán mới</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={pin}
            onChange={(e) => edit(setPin)(e.target.value)}
            className={field}
          />
        </label>
        <label className="block">
          <span className="block">Nhập lại PIN</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="new-password"
            maxLength={6}
            value={confirm}
            onChange={(e) => edit(setConfirm)(e.target.value)}
            className={field}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {saved && (
        <p role="status">
          Đã đổi PIN quán. Mọi điện thoại của nhân viên phải nhập PIN mới.
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className={`min-h-12 rounded-lg border px-6 font-bold disabled:opacity-50 ${step.armed ? "border-danger bg-danger text-ember-ink" : "border-edge"}`}
      >
        {busy
          ? "Đang đổi…"
          : step.armed
            ? "Chắc chắn đổi PIN?"
            : "Đổi PIN quán"}
      </button>
    </form>
  );
}
