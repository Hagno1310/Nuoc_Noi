"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ownerErrorText } from "@/lib/admin/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";

type HourRpc =
  "update_business_day_start_hour" | "update_business_day_end_hour";

// Dùng cho cả giờ mở cửa và giờ đóng cửa (SRS FR-05b)
export function BusinessHourForm({
  label,
  rpc,
  currentHour,
  note,
}: {
  label: string;
  rpc: HourRpc;
  currentHour: number;
  note?: string;
}) {
  const router = useRouter();
  const [hour, setHour] = useState(currentHour);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setSaved(false);
    const { error } = await getBrowserSupabase().rpc(rpc, { p_hour: hour });
    setBusy(false);
    setError(error ? ownerErrorText(error) : null);
    setSaved(!error);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-ink-muted" htmlFor={rpc}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <select
          id={rpc}
          value={hour}
          onChange={(e) => {
            setSaved(false);
            setHour(Number(e.target.value));
          }}
          className="min-h-12 rounded-lg border border-edge bg-transparent px-3 font-display text-xl tabular-nums"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h} className="bg-bg font-sans text-base">
              {String(h).padStart(2, "0")}:00
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          aria-label={`Lưu ${label.toLowerCase()}`}
          className="min-h-12 rounded-lg border border-edge px-4 font-semibold disabled:opacity-50"
        >
          {busy ? "Đang lưu…" : "Lưu"}
        </button>
      </div>
      {note && <p className="text-xs text-ink-muted">{note}</p>}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {saved && <p role="status">Đã lưu {label.toLowerCase()}.</p>}
    </div>
  );
}
