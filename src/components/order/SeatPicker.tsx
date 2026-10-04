"use client";
import type { ActiveSeat } from "@/lib/api";

export type SeatSelection =
  | { kind: "none" }
  | { kind: "seat"; id: string; name: string }
  | { kind: "takeaway" };

const base =
  "min-h-12 truncate rounded-lg border px-1 text-base font-semibold tabular-nums transition-[opacity,background-color,color] duration-200";
const on =
  "border-ember bg-ember text-ember-ink shadow-[0_0_18px_rgb(230_138_60/0.45)]";
const off = "border-edge text-ink active:bg-raised";

function GroupLabel({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2 text-xs font-medium text-ink-muted">
      {children}
      <span aria-hidden="true" className="streak flex-1 opacity-30" />
    </p>
  );
}

type Props = {
  seats: ActiveSeat[];
  selection: SeatSelection;
  onChange: (s: SeatSelection) => void;
};

export function SeatPicker({ seats, selection, onChange }: Props) {
  const takeaway = selection.kind === "takeaway";
  const anySelected = selection.kind !== "none";
  // Chọn một chỗ thì các chỗ khác lùi vào bóng tối, thay vì làm chỗ được chọn sáng chói (order-brief §3)
  const cls = (active: boolean) =>
    `${base} ${active ? on : off} ${anySelected && !active ? "opacity-60" : ""}`;

  // Server đã sắp theo kind, sort_order, name; filter giữ nguyên thứ tự đó
  // Nhóm đã ghi "Ghế quầy", nên nút chỉ cần phần số ("Quầy 7" → "7") để vừa 6 cột; tên đầy đủ vẫn ở aria-label
  const shortName = (s: ActiveSeat) =>
    s.kind === "counter" ? s.name.replace(/^Quầy\s+/, "") : s.name;
  const seatButtons = (kind: ActiveSeat["kind"]) =>
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
            className={cls(active)}
            onClick={() =>
              onChange(
                active
                  ? { kind: "none" }
                  : { kind: "seat", id: s.id, name: s.name },
              )
            }
          >
            {shortName(s)}
          </button>
        );
      });
  const counters = seatButtons("counter");
  const tables = seatButtons("table");

  // Ghế quầy trước, 2 hàng 6 như mép quầy thật; dưới đó là Bàn và Mang về (SRS FR-03b, order-brief §6)
  return (
    <div className="space-y-3">
      {counters.length > 0 && (
        <div role="group" aria-label="Ghế quầy" className="space-y-1.5">
          <GroupLabel>Ghế quầy</GroupLabel>
          <div className="grid grid-cols-6 gap-1.5">{counters}</div>
        </div>
      )}
      <div className="space-y-1.5">
        <GroupLabel>Bàn · Mang về</GroupLabel>
        <div className="grid grid-cols-4 gap-1.5">
          {tables.length > 0 && (
            <div role="group" aria-label="Bàn" className="contents">
              {tables}
            </div>
          )}
          <button
            type="button"
            aria-pressed={takeaway}
            className={cls(takeaway)}
            onClick={() =>
              onChange(takeaway ? { kind: "none" } : { kind: "takeaway" })
            }
          >
            Mang về
          </button>
        </div>
      </div>
    </div>
  );
}
