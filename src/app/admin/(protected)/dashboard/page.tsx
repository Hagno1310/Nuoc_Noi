import { AnimatedNumber } from "@/components/admin/AnimatedNumber";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { BusinessDayArc } from "@/components/admin/BusinessDayArc";
import { PeriodComparison } from "@/components/admin/PeriodComparison";
import { RevenueBars } from "@/components/admin/RevenueBars";
import { openWindow } from "@/lib/admin/businessDay";
import type { PeriodTotals } from "@/lib/admin/stats";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatIsoDate, formatVnTime } from "@/lib/time";

type Pair = { current: PeriodTotals; previous: PeriodTotals };
type Stats = {
  business_date: string;
  day: Pair;
  week: Pair;
  month: Pair;
  month_days: {
    day: number;
    revenue: number | null;
    previous_revenue: number | null;
  }[];
  week_days: {
    weekday: number;
    revenue: number | null;
    previous_revenue: number | null;
  }[];
};

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const [{ data, error }, { data: settings }] = await Promise.all([
    supabase.rpc("owner_stats"),
    supabase
      .from("settings")
      .select("business_day_start_hour, business_day_end_hour")
      .eq("id", 1)
      .single(),
  ]);
  if (error || !data || !settings)
    return (
      <>
        <AutoRefresh seconds={60} />
        <p role="alert">
          Không tải được số liệu. Kiểm tra mạng; trang sẽ tự thử lại sau 60
          giây.
        </p>
      </>
    );
  const s = data as Stats;
  const now = new Date();
  const { business_day_start_hour: start, business_day_end_hour: end } =
    settings;
  const win = openWindow(now, start, end);
  const day = formatIsoDate(s.business_date);
  const monthLabel = day.slice(3);
  const lastDay = s.month_days.length;

  return (
    <div className="space-y-10 lg:space-y-14">
      <AutoRefresh seconds={60} />
      <h1 className="font-display text-3xl lg:sr-only">
        Tổng quan
      </h1>
      {/* Laptop: đồng hồ và sổ so sánh cùng một hàng; hai biểu đồ ở hàng dưới */}
      <div className="space-y-8 lg:grid lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center lg:gap-12 lg:space-y-0">
        <div>
          <BusinessDayArc
            fraction={win.fraction}
            closed={win.closed}
            startLabel={hh(start)}
            endLabel={hh(end)}
            nowLabel={formatVnTime(now.toISOString())}
          >
            {/* Tấm in đảo màu duy nhất của màn (surface brief): doanh thu ngày kinh doanh */}
            <p className="rounded-md bg-ember px-3 py-1 font-display text-[clamp(2rem,12cqw,4.5rem)] leading-none text-ember-ink tabular-nums">
              <AnimatedNumber value={s.day.current.revenue} kind="vnd" />
            </p>
            <p className="font-display text-xl tabular-nums">
              <AnimatedNumber value={s.day.current.item_count} /> món ·{" "}
              <AnimatedNumber value={s.day.current.order_count} /> đơn
            </p>
          </BusinessDayArc>
        </div>
        <PeriodComparison
          periods={[
            {
              title: `Ngày kinh doanh ${day}`,
              ...s.day,
            },
            {
              title: "Tuần này",
              ...s.week,
            },
            {
              title: `Tháng ${monthLabel}`,
              ...s.month,
            },
          ]}
        />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
        <RevenueBars
          title="Doanh thu tuần"
          currentLabel="Tuần này"
          previousLabel="Tuần trước"
          points={s.week_days.map((d) => ({
            label: WEEKDAYS[d.weekday - 1],
            revenue: d.revenue,
            previous_revenue: d.previous_revenue,
          }))}
          ticks={[0, 1, 2, 3, 4, 5, 6]}
        />
        <RevenueBars
          title={`Doanh thu tháng ${monthLabel}`}
          currentLabel="Tháng này"
          previousLabel="Tháng trước"
          points={s.month_days.map((d) => ({
            label: String(d.day),
            revenue: d.revenue,
            previous_revenue: d.previous_revenue,
          }))}
          ticks={s.month_days
            .map((_, i) => i)
            .filter(
              (i) =>
                i === 0 ||
                ((i + 1) % 5 === 0 && i < lastDay - 3) ||
                i === lastDay - 1,
            )}
        />
      </div>
    </div>
  );
}
