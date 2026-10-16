import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { AnimatedNumber } from "@/components/admin/AnimatedNumber";
import { formatVnd } from "@/lib/money";
import { percentChange, type PeriodTotals } from "@/lib/admin/stats";

export type Period = {
  title: string;
  current: PeriodTotals;
  previous: PeriodTotals;
};

// Phần trăm so với kỳ trước, cùng đoạn (SRS FR-06): mũi tên + số, không chỉ dựa vào màu.
// Kỳ trước bằng 0 thì không có phần trăm; số của kỳ trước nằm ở dòng "Kỳ trước".
export function Change({ current, previous }: { current: number; previous: number }) {
  const pct = percentChange(current, previous);
  if (pct === null) return null;
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone = pct > 0 ? "bg-ok-soft text-ok" : pct < 0 ? "bg-danger-soft text-danger" : "bg-surface-2 text-muted";
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-[10px] px-2 py-1 text-[13px] font-semibold ${tone}`}>
      <Icon aria-hidden="true" size={14} />
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

// Sổ các kỳ trong một thẻ: tên kỳ, doanh thu + phần trăm, món và đơn (kèm phần trăm), một dòng "Kỳ trước"
export function PeriodComparison({ periods }: { periods: Period[] }) {
  return (
    <div className="divide-y divide-line rounded-3xl bg-surface px-5 lg:px-6">
      {periods.map((p) => (
        <section key={p.title} aria-label={p.title} className="space-y-1 py-4 lg:py-5">
          <h2 className="text-[13px] text-muted">{p.title}</h2>
          <p className="flex items-center justify-between gap-3 text-[22px] font-bold lg:text-[28px]">
            <AnimatedNumber value={p.current.revenue} kind="vnd" />
            <Change current={p.current.revenue} previous={p.previous.revenue} />
          </p>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5">
              <AnimatedNumber value={p.current.item_count} /> món
              <Change current={p.current.item_count} previous={p.previous.item_count} />
            </span>
            <span className="flex items-center gap-1.5">
              <AnimatedNumber value={p.current.order_count} /> đơn
              <Change current={p.current.order_count} previous={p.previous.order_count} />
            </span>
          </p>
          <p className="text-xs text-muted">
            {`Kỳ trước ${formatVnd(p.previous.revenue)} · ${p.previous.item_count} món · ${p.previous.order_count} đơn`}
          </p>
        </section>
      ))}
    </div>
  );
}
