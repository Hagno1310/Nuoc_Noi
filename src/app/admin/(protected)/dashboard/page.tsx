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
    <div className="space-y-6">
      <AutoRefresh seconds={60} />
      <h1 className="text-2xl font-bold">Tổng quan</h1>
      <BusinessDayArc
        elapsed={elapsedHours(now, startHour)}
        startLabel={`${String(startHour).padStart(2, "0")}:00`}
        nowLabel={formatVnTime(now.toISOString())}
      >
        <p className="text-sm text-ink-muted">Ngày kinh doanh {day}</p>
        <p className="text-4xl font-extrabold tabular-nums sm:text-5xl">
          {formatVnd(s.today_revenue)}
        </p>
        <p className="text-lg tabular-nums">{s.today_cups} cốc</p>
      </BusinessDayArc>
      <div className="text-center">
        <p className="text-sm text-ink-muted">Doanh thu tháng {day.slice(3)}</p>
        <p className="text-2xl font-bold tabular-nums">
          {formatVnd(s.month_revenue)}
        </p>
      </div>
    </div>
  );
}
