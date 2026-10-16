"use client";
import type { ActiveSeat } from "@/lib/api";

export type SeatSelection = { kind: "none" } | { kind: "seat"; id: string; name: string };

// SRS FR-03b: chỗ ngồi bắt buộc. Ghế quầy 2 hàng 6 như mép quầy thật, dưới là Bàn.
// Chỗ ngồi đang có đơn chờ thanh toán có chấm vàng (v3.8).
export function SeatPicker({
  seats,
  openSeats,
  selection,
  onChange,
}: {
  seats: ActiveSeat[];
  openSeats: Map<string, number>;
  selection: SeatSelection;
  onChange: (s: SeatSelection) => void;
}) {
  // Nhóm đã ghi "Ghế quầy", nên nút chỉ cần phần số ("Quầy 7" → "7"); tên đầy đủ ở aria-label
  const shortName = (s: ActiveSeat) => (s.kind === "counter" ? s.name.replace(/^Quầy\s+/, "") : s.name);
  const group = (kind: ActiveSeat["kind"], label: string, cols: string) => {
    const list = seats.filter((s) => s.kind === kind);
    if (list.length === 0) return null;
    return (
      <div role="group" aria-label={label} className="space-y-2">
        <p className="text-[13px] font-medium text-muted">{label}</p>
        <div className={`grid ${cols} gap-1.5`}>
          {list.map((s) => {
            const active = selection.kind === "seat" && selection.id === s.id;
            const open = openSeats.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                aria-pressed={active}
                aria-label={open ? `${s.name}, đang chờ thanh toán` : s.name}
                onClick={() => onChange(active ? { kind: "none" } : { kind: "seat", id: s.id, name: s.name })}
                className={`relative h-14 truncate rounded-[14px] px-1 font-bold ${kind === "counter" ? "text-xl" : "text-base"} ${active ? "bg-accent text-accent-ink" : "bg-surface"}`}
              >
                {shortName(s)}
                {open && <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-2 rounded-full bg-warn" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-[17px] font-bold">Chỗ ngồi</h3>
        <span className="text-[13px] text-muted">Bắt buộc</span>
      </div>
      {group("counter", "Ghế quầy", "grid-cols-6")}
      {group("table", "Bàn", "grid-cols-3")}
    </div>
  );
}
