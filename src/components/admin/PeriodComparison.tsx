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
// Kỳ trước bằng 0 thì không có phần trăm; số của kỳ trước nằm ở dòng "Kỳ trước" của kỳ đó.
function Change({ current, previous }: { current: number; previous: number }) {
  const pct = percentChange(current, previous);
  if (pct === null) return null;
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone = pct > 0 ? "text-ok" : pct < 0 ? "text-danger" : "text-ink-muted";
  return (
    <span className={`inline-flex items-center gap-0.5 font-sans text-xs font-normal tabular-nums ${tone}`}>
      <Icon aria-hidden="true" size={14} />
      {pct > 0 ? "+" : ""}
      {pct}%
    </span>
  );
}

const COLS = "lg:grid-cols-[minmax(11rem,1.5fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]";

// Sổ ba kỳ in như sổ cái, đường kẻ 1px giữa các kỳ; mỗi kỳ chỉ một dòng "Kỳ trước".
// Điện thoại: tên kỳ và doanh thu một dòng, món và đơn dòng dưới. Laptop: bảng có hàng tiêu đề, số canh phải.
export function PeriodComparison({ periods }: { periods: Period[] }) {
  return (
    <div>
      <div aria-hidden="true" className={`hidden border-b border-line pb-2 text-xs text-ink-muted lg:grid lg:gap-6 ${COLS}`}>
        <span>Kỳ</span>
        <span className="text-right">Doanh thu</span>
        <span className="text-right">Số món</span>
        <span className="text-right">Số đơn</span>
      </div>
      <div className="divide-y divide-line">
        {periods.map((p) => (
          <section key={p.title} aria-label={p.title} className={`py-4 lg:grid lg:items-baseline lg:gap-x-6 lg:py-5 ${COLS}`}>
            <div className="flex items-baseline justify-between gap-4 lg:contents">
              <h2 className="text-sm font-medium text-ink-muted">{p.title}</h2>
              <p className="flex items-baseline gap-2 font-display text-xl tabular-nums lg:justify-end lg:text-3xl">
                <AnimatedNumber value={p.current.revenue} kind="vnd" />
                <Change current={p.current.revenue} previous={p.previous.revenue} />
              </p>
            </div>
            <div className="mt-1 flex gap-6 text-sm tabular-nums lg:contents">
              <p className="flex items-baseline gap-1.5 lg:justify-end lg:font-display lg:text-xl">
                <AnimatedNumber value={p.current.item_count} />
                <span className="lg:hidden">món</span>
                <Change current={p.current.item_count} previous={p.previous.item_count} />
              </p>
              <p className="flex items-baseline gap-1.5 lg:justify-end lg:font-display lg:text-xl">
                <AnimatedNumber value={p.current.order_count} />
                <span className="lg:hidden">đơn</span>
                <Change current={p.current.order_count} previous={p.previous.order_count} />
              </p>
            </div>
            <p className="mt-1 text-xs text-ink-muted tabular-nums lg:hidden">
              {`Kỳ trước ${formatVnd(p.previous.revenue)} · ${p.previous.item_count} món · ${p.previous.order_count} đơn`}
            </p>
            {/* Màn rộng: mỗi số kỳ trước nằm dưới đúng cột nó so sánh */}
            <div className="hidden text-xs text-ink-muted tabular-nums lg:contents">
              <span>Kỳ trước</span>
              <span className="text-right">{formatVnd(p.previous.revenue)}</span>
              <span className="text-right">{p.previous.item_count}</span>
              <span className="text-right">{p.previous.order_count}</span>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
