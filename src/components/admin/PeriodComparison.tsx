import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { formatVnd } from "@/lib/money";
import { percentChange, type PeriodTotals } from "@/lib/admin/stats";

export type Period = {
  title: string;
  compareLabel: string; // "so với kỳ trước (tuần trước)"…
  current: PeriodTotals;
  previous: PeriodTotals;
};

// Thay đổi so với kỳ trước, cùng đoạn (SRS FR-06): mũi tên + chữ, không chỉ dựa vào màu
function Delta({
  current,
  previous,
  money,
  label,
}: {
  current: number;
  previous: number;
  money?: boolean;
  label: string;
}) {
  const pct = percentChange(current, previous);
  const prevText = money ? formatVnd(previous) : String(previous);
  if (pct === null)
    return (
      <span className="text-xs text-ink-muted">
        {label}: {prevText}
      </span>
    );
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone = pct > 0 ? "text-ok" : pct < 0 ? "text-danger" : "text-ink-muted";
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs ${tone}`}>
      <Icon aria-hidden="true" size={14} />
      <span className="tabular-nums">
        {pct > 0 ? "+" : ""}
        {pct}%
      </span>
      <span className="text-ink-muted">
        {" "}
        {label} ({prevText})
      </span>
    </span>
  );
}

// Sổ ba kỳ: mỗi kỳ một dòng, doanh thu nổi bật, số cốc và số đơn bên cạnh
export function PeriodComparison({ periods }: { periods: Period[] }) {
  return (
    <div className="divide-y divide-line">
      {periods.map((p) => (
        <section
          key={p.title}
          aria-label={p.title}
          className="grid grid-cols-2 gap-x-4 gap-y-2 py-4 sm:grid-cols-[1.4fr_1fr_1fr]"
        >
          <h2 className="col-span-2 flex items-center gap-3 text-sm font-medium text-ink-muted sm:col-span-3">
            {p.title}
            <span aria-hidden="true" className="streak flex-1 opacity-30" />
          </h2>
          <div className="col-span-2 space-y-1 sm:col-span-1">
            <p className="font-display text-4xl tracking-wide tabular-nums">
              {formatVnd(p.current.revenue)}
            </p>
            <Delta
              current={p.current.revenue}
              previous={p.previous.revenue}
              money
              label={p.compareLabel}
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-2xl tracking-wide tabular-nums">
              {p.current.cups} cốc
            </p>
            <Delta
              current={p.current.cups}
              previous={p.previous.cups}
              label="kỳ trước"
            />
          </div>
          <div className="space-y-1">
            <p className="font-display text-2xl tracking-wide tabular-nums">
              {p.current.order_count} đơn
            </p>
            <Delta
              current={p.current.order_count}
              previous={p.previous.order_count}
              label="kỳ trước"
            />
          </div>
        </section>
      ))}
    </div>
  );
}
