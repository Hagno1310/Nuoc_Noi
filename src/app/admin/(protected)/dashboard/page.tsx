import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { BusinessDayArc } from "@/components/admin/BusinessDayArc";
import { elapsedHours } from "@/lib/admin/businessDay";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatIsoDate, formatVnTime } from "@/lib/time";

type Summary = {
  business_date: string;
  today_revenue: number;
  today_cups: number;
  month_revenue: number;
};

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const [{ data, error }, { data: settings }] = await Promise.all([
    supabase.rpc("dashboard_summary"),
    supabase
      .from("settings")
      .select("business_day_start_hour")
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
  const s = data as Summary;
  const now = new Date();
  const startHour = settings.business_day_start_hour;
  const day = formatIsoDate(s.business_date);

  return (
    <div className="space-y-6 lg:flex lg:min-h-[calc(100dvh-2rem)] lg:flex-col lg:justify-center">
      <AutoRefresh seconds={60} />
      <h1 className="font-display text-3xl tracking-wide lg:sr-only">
        Tổng quan
      </h1>
      <BusinessDayArc
        elapsed={elapsedHours(now, startHour)}
        startLabel={`${String(startHour).padStart(2, "0")}:00`}
        nowLabel={formatVnTime(now.toISOString())}
      >
        <p className="text-sm text-ink-muted">Ngày kinh doanh {day}</p>
        <p className="font-display text-[clamp(2.75rem,9vmin,5.5rem)] leading-none tracking-wide tabular-nums">
          {formatVnd(s.today_revenue)}
        </p>
        <p className="font-display text-2xl tracking-wide tabular-nums">
          {s.today_cups} cốc
        </p>
      </BusinessDayArc>
      <div className="space-y-2 text-center">
        <span aria-hidden="true" className="streak mx-auto block w-48" />
        <p className="text-sm text-ink-muted">Doanh thu tháng {day.slice(3)}</p>
        <p className="font-display text-3xl tracking-wide tabular-nums">
          {formatVnd(s.month_revenue)}
        </p>
      </div>
    </div>
  );
}
