import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { OwnerCancelButton } from "@/components/admin/OwnerCancelButton";
import { ScrollToOrder } from "@/components/admin/ScrollToOrder";
import { TransferPhotoThumb } from "@/components/TransferPhoto";
import { normalizeRange, parsePage } from "@/lib/admin/range";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";

const PAGE_SIZE = 50;
const PAYMENT_LABEL = { cash: "Tiền mặt", transfer: "Chuyển khoản" } as const;
type Params = { from?: string; to?: string; page?: string; order?: string };
type Totals = {
  revenue: number;
  item_count: number;
  order_count: number;
  discount_total: number;
  cash_revenue: number;
  transfer_revenue: number;
};
type Row = {
  id: string;
  created_at: string;
  seat_name: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  status: "paid" | "cancelled";
  payment_method: keyof typeof PAYMENT_LABEL;
  transfer_photo_id: string | null;
  order_lines: { item_name: string; unit_price: number; quantity: number; line_amount: number }[];
};
// Từ tablet: 7 trường của FR-07 (v3.3) thành 7 cột; nút Hủy nằm ngoài <summary> để bấm Hủy không mở đơn
const COLS =
  "sm:grid sm:grid-cols-[9.5rem_minmax(0,1fr)_3.5rem_4rem_7.5rem_7rem_6.5rem] sm:items-center sm:gap-x-3";
const CANCEL_COL = "shrink-0 sm:w-32 sm:text-right";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: today, error: todayError } = await supabase.rpc("current_business_date");
  if (todayError || !today)
    return <p role="alert">Không tải được lịch sử đơn hàng. Kiểm tra mạng rồi tải lại trang.</p>;
  const { from, to } = normalizeRange(params.from, params.to, today as string);
  const page = parsePage(params.page);
  const start = (page - 1) * PAGE_SIZE;

  const [{ data, count, error }, { data: totals, error: totalsError }] = await Promise.all([
    supabase
      .from("orders")
      .select(
        "id, created_at, seat_name, item_count, subtotal_amount, discount_percent, discount_amount, total_amount, status, payment_method, transfer_photo_id, order_lines(item_name, unit_price, quantity, line_amount, sort_order)",
        { count: "exact" },
      )
      .gte("business_date", from)
      .lte("business_date", to)
      .order("created_at", { ascending: false })
      .order("id")
      .order("sort_order", { referencedTable: "order_lines" })
      .range(start, start + PAGE_SIZE - 1),
    supabase.rpc("history_totals", { p_from: from, p_to: to }),
  ]);
  const rows = (data ?? []) as Row[];
  const t = totals as Totals | null;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (p: number) => `/admin/history?from=${from}&to=${to}&page=${p}`;
  const field = "block min-h-12 rounded-lg border border-edge bg-transparent p-2";
  const pager = "flex min-h-12 items-center gap-1 rounded-lg border border-edge px-3";

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Lịch sử đơn hàng</h1>
      <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-sm">Từ ngày</span>
          <input type="date" name="from" defaultValue={from} className={field} />
        </label>
        <label className="block">
          <span className="text-sm">Đến ngày</span>
          <input type="date" name="to" defaultValue={to} className={field} />
        </label>
        <button type="submit" className="min-h-12 rounded-lg bg-ember px-4 font-bold text-ember-ink">
          Lọc
        </button>
        <ExportCsvButton from={from} to={to} />
      </form>

      {error && (
        <p role="alert" className="text-danger">
          Không tải được danh sách đơn. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}

      <div className="sm:overflow-x-auto">
        <div className="sm:min-w-[50rem]">
          <div className="hidden border-b border-edge py-2 text-sm text-ink-muted sm:flex sm:gap-3">
            <div className={`flex-1 ${COLS}`}>
              <span>Thời gian</span>
              <span>Chỗ ngồi</span>
              <span className="text-right">Số món</span>
              <span className="text-right">Giảm giá</span>
              <span className="text-right">Thành tiền</span>
              <span>Thanh toán</span>
              <span>Trạng thái</span>
            </div>
            <span className={CANCEL_COL}>
              <span className="sr-only">Hủy đơn</span>
            </span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((o) => {
              const cancelled = o.status === "cancelled";
              const muted = cancelled ? "text-ink-muted line-through" : "";
              const status = cancelled ? "Đã hủy" : "Đã thanh toán";
              const payment = PAYMENT_LABEL[o.payment_method];
              return (
                <li key={o.id} id={`order-${o.id}`} className="flex items-start gap-3">
                  {/* FR-07: bấm vào đơn thì mở dòng đơn, bấm lần nữa thì đóng */}
                  <details open={o.id === params.order} className="min-w-0 flex-1">
                    <summary className="flex min-h-12 cursor-pointer list-none items-center py-3 [&::-webkit-details-marker]:hidden">
                      <div className="min-w-0 flex-1 space-y-1 tabular-nums sm:hidden">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className={muted}>
                            {formatVnDateTime(o.created_at)} · {o.seat_name}
                          </span>
                          <span className="text-xs whitespace-nowrap text-ink-muted">{status}</span>
                        </p>
                        <p className={`flex justify-between gap-4 ${muted}`}>
                          <span>
                            {o.item_count} món{o.discount_percent > 0 && ` −${o.discount_percent}%`} · {payment}
                          </span>
                          <span className="font-semibold">{formatVnd(o.total_amount)}</span>
                        </p>
                      </div>
                      <div className={`hidden flex-1 tabular-nums ${COLS}`}>
                        <span className={muted}>{formatVnDateTime(o.created_at)}</span>
                        <span className={`truncate ${muted}`}>{o.seat_name}</span>
                        <span className={`text-right ${muted}`}>{o.item_count}</span>
                        <span className={`text-right ${muted}`}>
                          {o.discount_percent > 0 ? `−${o.discount_percent}%` : "—"}
                        </span>
                        <span className={`text-right font-semibold ${muted}`}>{formatVnd(o.total_amount)}</span>
                        <span>{payment}</span>
                        <span>{status}</span>
                      </div>
                    </summary>
                    <div className="space-y-1 pb-4 text-sm tabular-nums">
                      <ul className="space-y-1">
                        {o.order_lines.map((l, i) => (
                          <li key={i}>
                            {l.quantity} × {l.item_name} · {formatVnd(l.unit_price)} · {formatVnd(l.line_amount)}
                          </li>
                        ))}
                      </ul>
                      <p className="flex max-w-xs justify-between border-t border-line pt-1">
                        <span>Tạm tính</span>
                        <span>{formatVnd(o.subtotal_amount)}</span>
                      </p>
                      {o.discount_percent > 0 && (
                        <p className="flex max-w-xs justify-between">
                          <span>Giảm {o.discount_percent}%</span>
                          <span>−{formatVnd(o.discount_amount)}</span>
                        </p>
                      )}
                      <p className="flex max-w-xs justify-between font-semibold">
                        <span>Thành tiền</span>
                        <span>{formatVnd(o.total_amount)}</span>
                      </p>
                      <p>Thanh toán: {payment}</p>
                      {o.transfer_photo_id && <TransferPhotoThumb publicId={o.transfer_photo_id} />}
                    </div>
                  </details>
                  <span className={`${CANCEL_COL} py-1.5`}>{!cancelled && <OwnerCancelButton orderId={o.id} />}</span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {params.order && <ScrollToOrder id={params.order} />}
      {!error && rows.length === 0 && (
        <p className="py-6 text-center text-ink-muted">
          Không có đơn hàng nào trong khoảng này. Chọn khoảng ngày khác rồi bấm Lọc.
        </p>
      )}

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
        <div className="sticky bottom-[calc(49px+env(safe-area-inset-bottom))] my-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-lg bg-surface px-4 py-2.5 text-sm tabular-nums lg:bottom-4">
          <p>
            {t.order_count} đơn · {t.item_count} món
            <span className="block text-xs font-medium text-ink-muted">
              Không tính đơn đã hủy · Đã giảm {formatVnd(t.discount_total)}
            </span>
          </p>
          <p className="text-xs font-medium text-ink-muted">
            Tiền mặt {formatVnd(t.cash_revenue)} · Chuyển khoản {formatVnd(t.transfer_revenue)}
          </p>
          <p className="text-right">
            <span className="block text-xs font-medium text-ink-muted">Doanh thu</span>
            <strong className="text-base font-semibold">{formatVnd(t.revenue)}</strong>
          </p>
        </div>
      )}
      {totalsError && (
        <p role="alert" className="text-danger">
          Không tải được dòng tổng. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}
    </div>
  );
}
