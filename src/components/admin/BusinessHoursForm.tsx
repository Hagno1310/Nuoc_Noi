"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { hourUpdates } from "@/lib/admin/businessHours";
import { ownerErrorText } from "@/lib/admin/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";

const RPC = { start: "update_business_day_start_hour", end: "update_business_day_end_hour" } as const;
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

// SRS FR-05b: giờ mở cửa và giờ đóng cửa trong một form, một nút Lưu
export function BusinessHoursForm({ start, end }: { start: number; end: number }) {
  const router = useRouter();
  const [next, setNext] = useState({ start, end });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const dirty = next.start !== start || next.end !== end;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaved(false);
    const plan = hourUpdates({ start, end }, next);
    if ("error" in plan) return setError(plan.error);
    setError(null);
    setBusy(true);
    for (const step of plan.steps) {
      const { error } = await getBrowserSupabase().rpc(RPC[step], { p_hour: next[step] });
      if (error) {
        setBusy(false);
        setError(ownerErrorText(error));
        router.refresh();
        return;
      }
    }
    setBusy(false);
    setSaved(true);
    router.refresh();
  }

  const select =
    "min-h-12 rounded-lg border border-edge bg-transparent px-3 font-display text-xl tabular-nums transition-colors duration-150 hover:border-ink";
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-4">
        {(["start", "end"] as const).map((key) => (
          <label key={key} className="flex flex-col gap-1 text-sm text-ink-muted">
            {key === "start" ? "Giờ mở cửa" : "Giờ đóng cửa"}
            <select
              value={next[key]}
              onChange={(e) => {
                setSaved(false);
                setNext({ ...next, [key]: Number(e.target.value) });
              }}
              className={select}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {hh(h)}
                </option>
              ))}
            </select>
          </label>
        ))}
        <button
          type="submit"
          disabled={!dirty || busy}
          className="min-h-12 rounded-lg bg-ember px-5 font-semibold text-ember-ink transition-[transform,opacity] duration-150 active:scale-[0.98] disabled:opacity-40"
        >
          {busy ? "Đang lưu…" : "Lưu giờ"}
        </button>
      </div>
      <p className="text-xs text-ink-muted">Nên đổi khi quán đã đóng cửa.</p>
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
      {saved && <p role="status">Đã lưu giờ.</p>}
    </form>
  );
}
