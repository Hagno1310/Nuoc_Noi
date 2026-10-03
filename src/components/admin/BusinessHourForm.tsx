"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ownerErrorText } from "@/lib/admin/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function BusinessHourForm({ currentHour }: { currentHour: number }) {
  const router = useRouter();
  const [hour, setHour] = useState(currentHour);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    const { error } = await getBrowserSupabase().rpc(
      "update_business_day_start_hour",
      { p_hour: hour },
    );
    setBusy(false);
    setError(error ? ownerErrorText(error) : null);
    setSaved(!error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className="flex flex-wrap items-center gap-3">
        <span>Giờ mở cửa</span>
        <select
          value={hour}
          onChange={(e) => {
            setSaved(false);
            setHour(Number(e.target.value));
          }}
          className="min-h-12 rounded-lg border border-current/30 bg-transparent p-2 tabular-nums"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm opacity-80">
        Chỉ áp dụng cho đơn mới. Nên đổi khi quán đã đóng cửa.
      </p>
      {error && (
        <p role="alert" className="text-red-500">
          {error}
        </p>
      )}
      {saved && <p role="status">Đã lưu giờ mở cửa.</p>}
      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="min-h-12 rounded-lg border border-current px-6 font-bold disabled:opacity-50"
      >
        {busy ? "Đang lưu…" : "Lưu giờ mở cửa"}
      </button>
    </div>
  );
}
