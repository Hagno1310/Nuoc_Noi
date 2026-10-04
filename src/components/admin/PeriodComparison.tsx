import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { AnimatedNumber } from "@/components/admin/AnimatedNumber";
import { formatVnd } from "@/lib/money";
import { percentChange, type PeriodTotals } from "@/lib/admin/stats";

export type Period = {
  title: string;
  current: PeriodTotals;
  previous: PeriodTotals;
};

// Thay đổi so với kỳ trước, cùng đoạn (SRS FR-06): mũi tên + phần trăm + số kỳ trước, không chỉ dựa vào màu
function Delta({ current, previous, money }: { current: number; previous: number; money?: boolean }) {
  const pct = percentChange(current, previous);
  const prevText = money ? formatVnd(previous) : String(previous);
  if (pct === null)
    return <span className="block text-xs whitespace-nowrap text-ink-muted">Kỳ trước: {prevText}</span>;
  const Icon = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus;
  const tone = pct > 0 ? "text-ok" : pct < 0 ? "text-danger" : "text-ink-muted";
  return (
    <span className="flex flex-wrap items-center gap-x-1.5 text-xs lg:justify-end">
      <span className={`inline-flex items-center gap-0.5 ${tone}`}>
        <Icon aria-hidden="true" size={14} />
        <span className="tabular-nums">
          {pct > 0 ? "+" : ""}
          {pct}%
        </span>
      </span>
      <span className="whitespace-nowrap text-ink-muted tabular-nums">kỳ trước {prevText}</span>
    </span>
  );
}

const COLS = "lg:grid-cols-[minmax(11rem,1.5fr)_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]";

// Sổ ba kỳ in như sổ cái: đường kẻ 1px giữa các kỳ. Điện thoại: mỗi kỳ một khối. Laptop: bảng có hàng tiêu đề, số canh phải.
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
          <section
            key={p.title}
            aria-label={p.title}
            className={`grid grid-cols-2 gap-x-4 gap-y-2 py-4 lg:items-start lg:gap-x-6 lg:py-5 ${COLS}`}
          >
            <h2 className="col-span-2 text-sm font-medium text-ink-muted lg:col-span-1 lg:pt-1">
              {p.title}
            </h2>
            <div className="col-span-2 space-y-1 lg:col-span-1 lg:text-right">
              <p className="font-display text-3xl tabular-nums">
                <AnimatedNumber value={p.current.revenue} kind="vnd" />
              </p>
              <Delta current={p.current.revenue} previous={p.previous.revenue} money />
            </div>
            <div className="space-y-1 lg:text-right">
              <p className="font-display text-xl tabular-nums">
                <AnimatedNumber value={p.current.item_count} />
                <span className="lg:hidden"> món</span>
              </p>
              <Delta current={p.current.item_count} previous={p.previous.item_count} />
            </div>
            <div className="space-y-1 lg:text-right">
              <p className="font-display text-xl tabular-nums">
                <AnimatedNumber value={p.current.order_count} />
                <span className="lg:hidden"> đơn</span>
              </p>
              <Delta current={p.current.order_count} previous={p.previous.order_count} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
