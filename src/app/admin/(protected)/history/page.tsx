import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { OwnerCancelButton } from "@/components/admin/OwnerCancelButton";
import { normalizeRange, parsePage } from "@/lib/admin/range";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";

const PAGE_SIZE = 50;
type Params = { from?: string; to?: string; page?: string };
type Totals = { revenue: number; cups: number; order_count: number };

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: today, error: todayError } = await supabase.rpc(
    "current_business_date",
  );
  if (todayError || !today)
    return (
      <p role="alert">
        Không tải được lịch sử đơn hàng. Kiểm tra mạng rồi tải lại trang.
      </p>
    );
  const { from, to } = normalizeRange(params.from, params.to, today as string);
  const page = parsePage(params.page);
  const start = (page - 1) * PAGE_SIZE;

  const [{ data: rows, count, error }, { data: totals, error: totalsError }] =
    await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, created_at, seat_name, quantity, unit_price, total_amount, status",
          { count: "exact" },
        )
        .gte("business_date", from)
        .lte("business_date", to)
        .order("created_at", { ascending: false })
        .order("id")
        .range(start, start + PAGE_SIZE - 1),
      supabase.rpc("history_totals", { p_from: from, p_to: to }),
    ]);
  const t = totals as Totals | null;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => `/admin/history?from=${from}&to=${to}&page=${p}`;
  const field =
    "block min-h-12 rounded-lg border border-edge bg-transparent p-2";
  const pager =
    "flex min-h-12 items-center gap-1 rounded-lg border border-edge px-3";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Lịch sử đơn hàng</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm">Từ ngày</span>
          <input
            type="date"
            name="from"
            defaultValue={from}
            className={field}
          />
        </label>
        <label className="block">
          <span className="text-sm">Đến ngày</span>
          <input type="date" name="to" defaultValue={to} className={field} />
        </label>
        <button
          type="submit"
          className="min-h-12 rounded-lg bg-ember px-4 font-bold text-ember-ink"
        >
          Lọc
        </button>
        <ExportCsvButton from={from} to={to} />
      </form>

      {error && (
        <p role="alert" className="text-danger">
          Không tải được danh sách đơn. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:min-w-[44rem] sm:text-sm [&_td]:px-0.5 [&_th]:px-0.5 sm:[&_td]:px-2 sm:[&_td]:whitespace-nowrap sm:[&_th]:px-2 sm:[&_th]:whitespace-nowrap">
          <thead>
            <tr className="border-b border-edge">
              <th className="py-2">Thời gian</th>
              <th>Chỗ ngồi</th>
              <th className="text-right">Số cốc</th>
              <th className="text-right">Đơn giá</th>
              <th className="text-right">Thành tiền</th>
              <th className="pl-3">Trạng thái</th>
              <th>
                <span className="sr-only">Hủy đơn</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((o) => {
              const cancelled = o.status === "cancelled";
              return (
                <tr key={o.id} className="border-b border-line">
                  <td
                    className={`py-2 tabular-nums ${cancelled ? "text-ink-muted line-through" : ""}`}
                  >
                    {formatVnDateTime(o.created_at).slice(0, 10)}{" "}
                    <span className="block sm:inline">
                      {formatVnDateTime(o.created_at).slice(11)}
                    </span>
                  </td>
                  <td
                    className={cancelled ? "text-ink-muted line-through" : ""}
                  >
                    {o.seat_name ?? "—"}
                  </td>
                  <td
                    className={`text-right tabular-nums ${cancelled ? "text-ink-muted line-through" : ""}`}
                  >
                    {o.quantity}
                  </td>
                  <td
                    className={`text-right tabular-nums ${cancelled ? "text-ink-muted line-through" : ""}`}
                  >
                    {formatVnd(o.unit_price)}
                  </td>
                  <td
                    className={`text-right tabular-nums ${cancelled ? "text-ink-muted line-through" : ""}`}
                  >
                    {formatVnd(o.total_amount)}
                  </td>
                  <td className="pl-3">
                    {cancelled ? "Đã hủy" : "Đã thanh toán"}
                  </td>
                  <td className="pl-2 text-right">
                    {!cancelled && <OwnerCancelButton orderId={o.id} />}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!error && (rows ?? []).length === 0 && (
          <p className="py-6 text-center text-ink-muted">
            Không có đơn hàng nào trong khoảng này. Chọn khoảng ngày khác rồi
            bấm Lọc.
          </p>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-3">
          {page > 1 && (
            <Link href={href(page - 1)} className={pager}>
              <ChevronLeft aria-hidden="true" size={18} /> Trước
            </Link>
          )}
          <span className="tabular-nums">
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={href(page + 1)} className={pager}>
              Sau <ChevronRight aria-hidden="true" size={18} />
            </Link>
          )}
        </nav>
      )}

      {t && (
        <p className="sticky bottom-16 border-t border-line bg-bg py-3 font-medium tabular-nums lg:bottom-0">
          {t.order_count} đơn · {t.cups} cốc · Doanh thu{" "}
          <strong>{formatVnd(t.revenue)}</strong>{" "}
          <span className="text-sm text-ink-muted">
            (không tính đơn đã hủy)
          </span>
        </p>
      )}
      {totalsError && (
        <p role="alert" className="text-danger">
          Không tải được dòng tổng. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}
    </div>
  );
}
