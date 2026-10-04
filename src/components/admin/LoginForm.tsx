"use client";
import { useState, type FormEvent } from "react";

export function LoginForm({
  onLogin,
}: {
  onLogin: (email: string, password: string) => Promise<string | null>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(await onLogin(email.trim(), password));
    setBusy(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="font-display text-3xl tracking-wide">
        Đăng nhập chủ quán
      </h1>
      <label className="block">
        <span>Email</span>
        <input
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-lg border border-edge bg-transparent p-3"
        />
      </label>
      <label className="block">
        <span>Mật khẩu</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 min-h-12 w-full rounded-lg border border-edge bg-transparent p-3"
        />
      </label>
      {error && (
        <p role="alert" className="font-medium text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="min-h-14 w-full rounded-lg bg-ember font-bold text-ember-ink disabled:opacity-50"
      >
        {busy ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}
