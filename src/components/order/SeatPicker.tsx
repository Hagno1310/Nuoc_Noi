"use client";
import type { ActiveSeat } from "@/lib/api";

export type SeatSelection = { kind: "none" } | { kind: "seat"; id: string; name: string };

// SRS FR-03b (v3.2): chỗ ngồi bắt buộc, không có Mang về. Ghế quầy 2 hàng 6 như mép quầy thật, dưới là Bàn.
// Chọn một chỗ thì chỗ đó thành khối mực cam, các chỗ khác lùi vào bóng tối.
const base = "min-h-14 truncate rounded-lg border px-1 font-display tabular-nums transition-[opacity,background-color,color,border-color] duration-200";
const on = "border-ember bg-ember text-ember-ink";
const off = "border-edge text-ink active:bg-raised";

export function SeatPicker({
  seats,
  selection,
  onChange,
}: {
  seats: ActiveSeat[];
  selection: SeatSelection;
  onChange: (s: SeatSelection) => void;
}) {
  const anySelected = selection.kind !== "none";
  // Nhóm đã ghi "Ghế quầy", nên nút chỉ cần phần số ("Quầy 7" → "7"); tên đầy đủ ở aria-label
  const shortName = (s: ActiveSeat) => (s.kind === "counter" ? s.name.replace(/^Quầy\s+/, "") : s.name);
  const buttons = (kind: ActiveSeat["kind"]) =>
    seats
      .filter((s) => s.kind === kind)
      .map((s) => {
        const active = selection.kind === "seat" && selection.id === s.id;
        return (
          <button
            key={s.id}
            type="button"
            aria-pressed={active}
            aria-label={s.name}
            onClick={() => onChange(active ? { kind: "none" } : { kind: "seat", id: s.id, name: s.name })}
            className={`${base} ${kind === "counter" ? "text-2xl" : "text-xl"} ${active ? on : off} ${anySelected && !active ? "opacity-60" : ""}`}
          >
            {shortName(s)}
          </button>
        );
      });
  const counters = buttons("counter");
  const tables = buttons("table");
  return (
    <div className="space-y-3">
      {counters.length > 0 && (
        <div role="group" aria-label="Ghế quầy" className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted">Ghế quầy</p>
          <div className="grid grid-cols-6 gap-1.5">{counters}</div>
        </div>
      )}
      {tables.length > 0 && (
        <div role="group" aria-label="Bàn" className="space-y-1.5">
          <p className="text-xs font-medium text-ink-muted">Bàn</p>
          <div className="grid grid-cols-4 gap-1.5">{tables}</div>
        </div>
      )}
    </div>
  );
}
