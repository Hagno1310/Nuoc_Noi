"use client";
import type { ActiveSeat } from "@/lib/api";

export type SeatSelection =
  | { kind: "none" }
  | { kind: "seat"; id: string; name: string }
  | { kind: "takeaway" };

const base = "min-h-14 rounded-xl px-2 text-lg font-semibold active:scale-95";
const on = "bg-indigo-600 text-white";
const off = "bg-slate-100 text-slate-800";

// Ghế quầy hiện trước, rồi tới Bàn (SRS FR-03b)
const GROUPS = [
  { kind: "counter", label: "Ghế quầy" },
  { kind: "table", label: "Bàn" },
] as const;

type Props = {
  seats: ActiveSeat[];
  selection: SeatSelection;
  onChange: (s: SeatSelection) => void;
};

export function SeatPicker({ seats, selection, onChange }: Props) {
  const takeaway = selection.kind === "takeaway";
  return (
    <div className="space-y-3">
      {GROUPS.map((g) => {
        // Server đã sắp theo kind, sort_order, name; filter giữ nguyên thứ tự đó
        const items = seats.filter((s) => s.kind === g.kind);
        if (items.length === 0) return null;
        return (
          <div
            key={g.kind}
            role="group"
            aria-label={g.label}
            className="space-y-1"
          >
            <p className="text-sm font-semibold text-slate-600">{g.label}</p>
            <div className="grid grid-cols-4 gap-2">
              {items.map((s) => {
                const active =
                  selection.kind === "seat" && selection.id === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={active}
                    className={`${base} ${active ? on : off}`}
                    onClick={() =>
                      onChange(
                        active
                          ? { kind: "none" }
                          : { kind: "seat", id: s.id, name: s.name },
                      )
                    }
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          aria-pressed={takeaway}
          className={`${base} ${takeaway ? on : off}`}
          onClick={() =>
            onChange(takeaway ? { kind: "none" } : { kind: "takeaway" })
          }
        >
          Mang về
        </button>
      </div>
    </div>
  );
}
