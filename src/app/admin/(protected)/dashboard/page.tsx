import { ChevronRight, NotebookPen } from "lucide-react";
import Link from "next/link";
import { AnimatedNumber } from "@/components/admin/AnimatedNumber";
import { AutoRefresh } from "@/components/admin/AutoRefresh";
import { Change, PeriodComparison } from "@/components/admin/PeriodComparison";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { PageTitle } from "@/components/admin/SectionTitle";
import { minutesToClose, openWindow, periodRange, type PeriodKind } from "@/lib/admin/businessDay";
import type { PeriodTotals } from "@/lib/admin/stats";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatIsoDate } from "@/lib/time";

type Pair = { current: PeriodTotals; previous: PeriodTotals };
type Stats = {
  business_date: string;
  day: Pair;
  week: Pair;
  month: Pair;
  month_days: { day: number; revenue: number | null; previous_revenue: number | null }[];
  week_days: { weekday: number; revenue: number | null; previous_revenue: number | null }[];
};
type ItemStats = { top: { item_name: string; quantity: number }[]; hours: { hour: number; quantity: number }[] };

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const KINDS: [PeriodKind, string][] = [
  ["day", "Ngày"],
  ["week", "Tuần"],
  ["month", "Tháng"],
];
const hh = (h: number) => String(h).padStart(2, "0");

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ ky?: string }> }) {
  const { ky: raw } = await searchParams;
  const ky: PeriodKind = raw === "week" || raw === "month" ? raw : "day";
  const supabase = await createServerSupabase();
  const [{ data, error }, { data: settings }, { data: open, error: openError }] = await Promise.all([
    supabase.rpc("owner_stats"),
    supabase.from("settings").select("business_day_start_hour, business_day_end_hour").eq("id", 1).single(),
    supabase.from("orders").select("subtotal_amount, business_date").eq("status", "open"),
  ]);
  if (error || !data || !settings || openError)
    return (
      <>
        <AutoRefresh seconds={60} />
        <p role="alert">Không tải được số liệu. Kiểm tra mạng; trang sẽ tự thử lại sau 60 giây.</p>
      </>
    );
  const s = data as Stats;
  const [from, to] = periodRange(s.business_date, ky);
  const { data: items, error: itemsError } = await supabase.rpc("item_stats", { p_from: from, p_to: to });
  const it = items as ItemStats | null;

  const now = new Date();
  const { business_day_start_hour: start, business_day_end_hour: end } = settings;
  const win = openWindow(now, start, end);
  const left = minutesToClose(now, start, end);
  const day = formatIsoDate(s.business_date);
  const monthLabel = day.slice(3);
  const lastDay = s.month_days.length;
  const openTotal = (open ?? []).reduce((t, o) => t + o.subtotal_amount, 0);
  // Mở Lịch sử lọc Chờ thanh toán, từ ngày kinh doanh của đơn chờ cũ nhất (FR-06)
  const openHref = open?.length
    ? `/admin/history?status=open&from=${open.map((o) => o.business_date).sort()[0]}&to=${s.business_date}`
    : null;
  const openHours = (end - start + 24) % 24;
  const hours = Array.from({ length: openHours }, (_, i) => (start + i) % 24);
  // Chỉ vẽ và xét cao điểm trong khoảng giờ mở cửa (FR-06)
  const perHour = new Map((it?.hours ?? []).filter((h) => hours.includes(h.hour)).map((h) => [h.hour, h.quantity]));
  const peak = Math.max(0, ...perHour.values());
  const topMax = it?.top[0]?.quantity ?? 1;

  return (
    <div className="space-y-4 lg:space-y-5">
      <AutoRefresh seconds={60} />
      <PageTitle title="Tổng quan" sub={`Ngày kinh doanh ${day}`} />

      <div className="space-y-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-start lg:gap-5 lg:space-y-0">
        <section aria-label="Ngày kinh doanh" className="space-y-4 rounded-3xl bg-surface p-5 lg:p-6">
          <p className="flex flex-col gap-1 text-[13px] font-medium text-muted sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className={`size-2 rounded-full ${win.closed ? "bg-muted" : "bg-ok"}`} />
              {win.closed ? "Đã đóng cửa" : `Đang mở · ${hh(start)}:00 – ${hh(end)}:00`}
            </span>
            {left !== null && `Còn ${Math.floor(left / 60)} giờ ${left % 60} phút đến giờ đóng cửa`}
          </p>
          <div>
            <p className="text-sm text-muted">Doanh thu ngày kinh doanh</p>
            <p className="flex flex-wrap items-center gap-3 text-[40px] leading-tight font-extrabold lg:text-[56px]">
              <AnimatedNumber value={s.day.current.revenue} kind="vnd" />
              <Change current={s.day.current.revenue} previous={s.day.previous.revenue} />
            </p>
          </div>
          {/* Thanh giờ mở cửa: phần đã trôi qua tô cam, phần chưa tới mờ (FR-06) */}
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-accent" style={{ width: `${win.fraction * 100}%` }} />
            </div>
            <p className="mt-2 flex justify-between text-xs text-muted">
              <span>{hh(start)}:00</span>
              <span>{hh(end)}:00</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3">
            <Stat label="Món" value={<AnimatedNumber value={s.day.current.item_count} />} change={<Change current={s.day.current.item_count} previous={s.day.previous.item_count} />} />
            <Stat label="Đơn" value={<AnimatedNumber value={s.day.current.order_count} />} change={<Change current={s.day.current.order_count} previous={s.day.previous.order_count} />} />
            {openHref && (
              <Link href={openHref} className="hidden flex-col gap-0.5 rounded-[14px] bg-warn-soft p-3.5 text-warn lg:flex">
                <span className="text-[22px] font-bold">{formatVnd(openTotal)}</span>
                <span className="text-xs">{open!.length} đơn chờ thanh toán</span>
              </Link>
            )}
          </div>
          <p className="text-xs text-muted">{`Hôm trước ${formatVnd(s.day.previous.revenue)} · ${s.day.previous.item_count} món · ${s.day.previous.order_count} đơn`}</p>
        </section>
        {/* Điện thoại: tiền chờ thu là một dải riêng ngay dưới thẻ ngày kinh doanh (design.pen) */}
        {openHref && (
          <Link href={openHref} className="flex h-15 items-center gap-2.5 rounded-[18px] bg-warn-soft pr-3 pl-4 text-warn lg:hidden">
            <NotebookPen aria-hidden="true" size={18} />
            <span className="flex-1 text-sm font-semibold">
              {open!.length} đơn chờ thanh toán · {formatVnd(openTotal)}
            </span>
            <ChevronRight aria-hidden="true" size={18} />
          </Link>
        )}
        <PeriodComparison
          periods={[
            { title: "Tuần này", ...s.week },
            { title: `Tháng ${monthLabel}`, ...s.month },
          ]}
        />
      </div>

      <nav aria-label="Kỳ của báo cáo theo món" className="flex gap-1 rounded-[14px] bg-surface p-1 lg:w-80">
        {KINDS.map(([k, label]) => (
          <Link
            key={k}
            href={k === "day" ? "/admin/dashboard" : `/admin/dashboard?ky=${k}`}
            aria-current={k === ky ? "page" : undefined}
            className="flex h-12 flex-1 items-center justify-center rounded-[11px] text-sm font-semibold text-muted aria-[current=page]:bg-surface-2 aria-[current=page]:text-ink"
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-5">
        <section aria-label="Số món theo giờ" className="order-2 space-y-4 rounded-3xl bg-surface p-5 lg:order-3 lg:col-span-2 lg:p-6">
          <h2 className="flex items-center justify-between font-bold">
            Số món theo giờ
            {peak > 0 && (
              <span className="rounded-[10px] bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
                Cao điểm {[...perHour].filter(([, q]) => q === peak).map(([h]) => `${hh(h)}–${hh((h + 1) % 24)}h`)[0]}
              </span>
            )}
          </h2>
          <ol className="flex h-36 items-end gap-2">
            {hours.map((h) => {
              const q = perHour.get(h) ?? 0;
              return (
                <li key={h} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  {q > 0 && <span className={`text-[11px] font-semibold ${q === peak ? "text-accent" : "text-muted"}`}>{q}</span>}
                  <span
                    aria-label={`${hh(h)}:00: ${q} món`}
                    className={`w-full rounded-t-md ${q === peak && q > 0 ? "bg-accent" : q ? "bg-surface-2" : "bg-line"}`}
                    style={{ height: q ? `${(q / peak) * 80}%` : 3 }}
                  />
                  <span className="text-[11px] text-muted">{hh(h)}</span>
                </li>
              );
            })}
          </ol>
        </section>
        <section aria-label="Món bán chạy" className="order-1 space-y-3.5 rounded-3xl bg-surface p-5 lg:order-2 lg:p-6">
          <h2 className="font-bold">Món bán chạy</h2>
          {itemsError ? (
            <p role="alert" className="text-sm text-danger">
              Không tải được số liệu. Kiểm tra mạng; trang sẽ tự thử lại sau 60 giây.
            </p>
          ) : (
            !it?.top.length && <p className="text-sm text-muted">Chưa có món nào được bán trong kỳ này.</p>
          )}
          <ol className="space-y-3.5">
            {it?.top.map((t, i) => (
              <li key={t.item_name} className="space-y-1.5">
                <p className="flex justify-between text-sm">
                  <span className={i ? "font-medium" : "font-bold"}>
                    {i + 1}&nbsp;&nbsp;{t.item_name}
                  </span>
                  <span className="text-muted">{t.quantity} món</span>
                </p>
                <div className="h-1.5 rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${i ? "bg-muted" : "bg-accent"}`} style={{ width: `${(t.quantity / topMax) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>
        <div className="order-3 lg:order-1">
          <RevenueChart
            week={{
              title: "Doanh thu tuần",
              currentLabel: "Tuần này",
              previousLabel: "Tuần trước",
              points: s.week_days.map((d) => ({ label: WEEKDAYS[d.weekday - 1], revenue: d.revenue, previous_revenue: d.previous_revenue })),
              ticks: [0, 1, 2, 3, 4, 5, 6],
            }}
            month={{
              title: `Doanh thu tháng ${monthLabel}`,
              currentLabel: "Tháng này",
              previousLabel: "Tháng trước",
              points: s.month_days.map((d) => ({ label: String(d.day), revenue: d.revenue, previous_revenue: d.previous_revenue })),
              ticks: s.month_days
                .map((_, i) => i)
                .filter((i) => i === 0 || ((i + 1) % 5 === 0 && i < lastDay - 3) || i === lastDay - 1),
            }}
          />
        </div>
      </div>

    </div>
  );
}

function Stat({ label, value, change }: { label: string; value: React.ReactNode; change: React.ReactNode }) {
  return (
    <div className="rounded-[14px] bg-surface-2 p-3.5">
      <p className="flex items-center gap-2 text-[22px] font-bold">
        {value}
        {change}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
