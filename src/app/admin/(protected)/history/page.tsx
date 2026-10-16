import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ExportCsvButton } from "@/components/admin/ExportCsvButton";
import { OwnerCancelButton } from "@/components/admin/OwnerCancelButton";
import { ScrollToOrder } from "@/components/admin/ScrollToOrder";
import { PageTitle } from "@/components/admin/SectionTitle";
import { TransferPhotoThumb } from "@/components/TransferPhoto";
import { LINES_SELECT, liveLines, PAYMENT_LABEL, STATUS_LABEL, type DbLine, type OrderStatus } from "@/lib/csv";
import { normalizeRange, parsePage } from "@/lib/admin/range";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatIsoDate, formatVnDateTime, formatVnTime } from "@/lib/time";

const PAGE_SIZE = 50;
const STATUSES: OrderStatus[] = ["paid", "open", "cancelled"];
type Params = { from?: string; to?: string; page?: string; order?: string; status?: string };
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
  paid_at: string | null;
  seat_name: string;
  item_count: number;
  subtotal_amount: number;
  discount_percent: number;
  discount_amount: number;
  total_amount: number;
  status: OrderStatus;
  payment_method: "cash" | "transfer" | null;
  transfer_photo_id: string | null;
  order_lines: DbLine[];
};
const TONE: Record<OrderStatus, string> = {
  paid: "bg-ok-soft text-ok",
  open: "bg-warn-soft text-warn",
  cancelled: "bg-danger-soft text-danger",
};
// Từ tablet: 7 trường của FR-07 thành 7 cột; nút Hủy nằm ngoài <summary> để bấm Hủy không mở đơn
const COLS = "sm:grid sm:grid-cols-[9.5rem_minmax(0,1fr)_3.5rem_4rem_7.5rem_7rem_8rem] sm:items-center sm:gap-x-4";

export default async function HistoryPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: today, error: todayError } = await supabase.rpc("current_business_date");
  if (todayError || !today) return <p role="alert">Không tải được lịch sử đơn hàng. Kiểm tra mạng rồi tải lại trang.</p>;
  const { from, to } = normalizeRange(params.from, params.to, today as string);
  const status = STATUSES.find((s) => s === params.status);
  const page = parsePage(params.page);
  const start = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("orders")
    .select(
      `id, created_at, paid_at, seat_name, item_count, subtotal_amount, discount_percent, discount_amount, total_amount, status, payment_method, transfer_photo_id, ${LINES_SELECT}`,
      { count: "exact" },
    )
    .gte("business_date", from)
    .lte("business_date", to);
  if (status) query = query.eq("status", status);
  const [{ data, count, error }, { data: totals, error: totalsError }] = await Promise.all([
    query
      .order("created_at", { ascending: false })
      .order("id")
      .order("sort_order", { referencedTable: "order_lines" })
      .range(start, start + PAGE_SIZE - 1),
    supabase.rpc("history_totals", { p_from: from, p_to: to }),
  ]);
  const rows = (data ?? []) as unknown as Row[]; // quan hệ tới order_rounds là một-một, supabase-js không có kiểu DB nên đoán là mảng
  const t = totals as Totals | null;
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const href = (over: Partial<Params>) => {
    const q = new URLSearchParams({ from, to, ...(status && { status }), ...over } as Record<string, string>);
    return `/admin/history?${q}`;
  };
  const chip = "flex h-12 shrink-0 items-center rounded-full px-3.5 text-[13px] font-semibold";
  const pager = "flex h-12 items-center gap-1 rounded-[14px] bg-surface px-3.5";

  return (
    <div className="space-y-4">
      <PageTitle
        title="Lịch sử đơn hàng"
        sub={from === to ? formatIsoDate(from) : `${formatIsoDate(from)} – ${formatIsoDate(to)}`}
        action={<ExportCsvButton from={from} to={to} />}
      />
      <form method="get" className="flex flex-wrap items-end gap-2.5">
        {status && <input type="hidden" name="status" value={status} />}
        {(
          [
            ["from", "Từ ngày", from],
            ["to", "Đến ngày", to],
          ] as const
        ).map(([name, label, value]) => (
          <label key={name} className="flex h-14 min-w-0 flex-1 flex-col justify-center rounded-[14px] bg-surface px-3.5 sm:flex-none">
            <span className="text-[11px] text-muted">{label}</span>
            <input type="date" name={name} defaultValue={value} className="bg-transparent text-[15px] font-semibold" />
          </label>
        ))}
        <button type="submit" className="h-14 rounded-[14px] bg-accent px-5 font-semibold text-accent-ink">
          Lọc
        </button>
      </form>
      <nav aria-label="Lọc trạng thái" className="-mx-4 flex gap-1.5 overflow-x-auto px-4 [scrollbar-width:none]">
        {[undefined, ...STATUSES].map((s) => (
          <Link
            key={s ?? "all"}
            href={href({ status: s, page: undefined })}
            aria-current={s === status ? "page" : undefined}
            className={`${chip} bg-surface text-muted aria-[current=page]:bg-ink aria-[current=page]:text-bg`}
          >
            {s ? STATUS_LABEL[s] : "Tất cả"}
          </Link>
        ))}
      </nav>

      {t && (
        <>
          {/* Điện thoại: một thẻ doanh thu kèm ba ô nhỏ; máy tính: năm ô một hàng (design.pen) */}
          <section aria-label="Dòng tổng" className="space-y-3 rounded-3xl bg-surface p-5 lg:hidden">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[13px] text-muted">Doanh thu</p>
                <p className="text-[28px] leading-tight font-extrabold">{formatVnd(t.revenue)}</p>
              </div>
              <p className="pb-1 text-[13px] text-muted">
                {t.order_count} đơn · {t.item_count} món
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Tile label="Tiền mặt" value={formatVnd(t.cash_revenue)} small />
              <Tile label="Chuyển khoản" value={formatVnd(t.transfer_revenue)} small />
              <Tile label="Đã giảm" value={formatVnd(t.discount_total)} small />
            </div>
          </section>
          <div className="hidden grid-cols-5 gap-3 lg:grid">
            <Tile label="Doanh thu" value={formatVnd(t.revenue)} big />
            <Tile label="Đơn · Món" value={`${t.order_count} · ${t.item_count}`} />
            <Tile label="Tiền mặt" value={formatVnd(t.cash_revenue)} />
            <Tile label="Chuyển khoản" value={formatVnd(t.transfer_revenue)} />
            <Tile label="Đã giảm" value={formatVnd(t.discount_total)} />
          </div>
        </>
      )}
      {totalsError && (
        <p role="alert" className="text-danger">
          Không tải được dòng tổng. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}
      {error && (
        <p role="alert" className="text-danger">
          Không tải được danh sách đơn. Kiểm tra mạng rồi tải lại trang.
        </p>
      )}

      {rows.length > 0 && (
        <div className="rounded-3xl bg-surface p-2">
          <div className={`hidden h-11 border-b border-line px-4 text-xs font-semibold text-muted ${COLS}`}>
            <span>Thời gian</span>
            <span>Chỗ ngồi</span>
            <span className="text-right">Số món</span>
            <span className="text-right">Giảm giá</span>
            <span className="text-right">Thành tiền</span>
            <span>Thanh toán</span>
            <span>Trạng thái</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((o) => {
              const cancelled = o.status === "cancelled";
              const strike = cancelled ? "text-muted line-through" : "";
              const payment = o.payment_method ? PAYMENT_LABEL[o.payment_method] : "—";
              const badge = <span className={`rounded-lg px-2 py-1 text-[11px] font-semibold ${TONE[o.status]}`}>{STATUS_LABEL[o.status]}</span>;
              const lines = liveLines(o.order_lines, o.status);
              // Đơn trả sau có lượt gọi khác id đơn: nhóm dòng theo lượt gọi, kèm giờ (FR-07)
              const later = o.order_lines.some((l) => l.round && l.round.id !== o.id);
              // Đơn trả sau ghi giờ thu tiền, như CSV (FR-07a)
              const at = o.paid_at ?? o.created_at;
              const rounds = [...new Set(lines.map((l) => l.round?.created_at ?? ""))];
              return (
                <li key={o.id} id={`order-${o.id}`}>
                  {/* FR-07: bấm vào đơn thì mở dòng đơn, bấm lần nữa thì đóng */}
                  <details open={o.id === params.order} className="group">
                    <summary className="cursor-pointer list-none rounded-2xl px-3.5 py-3 group-open:bg-surface-2 sm:px-4 [&::-webkit-details-marker]:hidden">
                      <div className="space-y-1 sm:hidden">
                        <p className="flex items-center justify-between gap-2">
                          <span className={`text-[15px] font-semibold ${strike}`}>
                            {formatVnTime(at)} · {o.seat_name}
                          </span>
                          {badge}
                        </p>
                        <p className="flex items-center justify-between gap-2">
                          <span className="text-[13px] text-muted">
                            {o.item_count} món{o.discount_percent > 0 && ` · −${o.discount_percent}%`} · {payment}
                          </span>
                          <span className={`text-[15px] font-bold ${o.status === "open" ? "text-warn" : strike}`}>{formatVnd(o.total_amount)}</span>
                        </p>
                      </div>
                      <div className={`hidden text-sm ${COLS}`}>
                        <span className={strike}>{formatVnDateTime(at)}</span>
                        <span className={`truncate ${strike}`}>{o.seat_name}</span>
                        <span className={`text-right ${strike}`}>{o.item_count}</span>
                        <span className={`text-right ${strike}`}>{o.discount_percent > 0 ? `−${o.discount_percent}%` : "—"}</span>
                        <span className={`text-right font-bold ${o.status === "open" ? "text-warn" : strike}`}>{formatVnd(o.total_amount)}</span>
                        <span className={strike}>{payment}</span>
                        <span>{badge}</span>
                      </div>
                    </summary>
                    <div className="space-y-3 px-3.5 pt-2 pb-4 text-[13px] sm:ml-[10.5rem] sm:max-w-xl">
                      <div className="space-y-2 rounded-[14px] bg-surface-2 p-3.5">
                        {rounds.map((r, i) => (
                          <div key={r} className="space-y-1.5">
                            {later && (
                              <p className="text-xs font-semibold text-muted">
                                Lượt {i + 1} · {formatVnTime(r)}
                              </p>
                            )}
                            {lines
                              .filter((l) => (l.round?.created_at ?? "") === r)
                              .map((l, j) => (
                                <div key={j} className="flex justify-between gap-3">
                                  <span>
                                    <span className="text-muted">
                                      {l.quantity} × {l.item_name} · {formatVnd(l.unit_price)}
                                    </span>
                                    {l.note && <span className="block text-xs text-warn">{l.note}</span>}
                                  </span>
                                  <span>{formatVnd(l.line_amount)}</span>
                                </div>
                              ))}
                          </div>
                        ))}
                        <div className="space-y-1 border-t border-line pt-2">
                          <p className="flex justify-between text-muted">
                            <span>Tạm tính</span>
                            <span>{formatVnd(o.subtotal_amount)}</span>
                          </p>
                          {o.discount_percent > 0 && (
                            <p className="flex justify-between text-ok">
                              <span>Giảm {o.discount_percent}%</span>
                              <span>−{formatVnd(o.discount_amount)}</span>
                            </p>
                          )}
                          {o.status !== "open" && (
                            <p className="flex justify-between font-bold">
                              <span>Thành tiền</span>
                              <span>{formatVnd(o.total_amount)}</span>
                            </p>
                          )}
                          <p className="text-muted">Thanh toán: {payment}</p>
                        </div>
                      </div>
                      {o.transfer_photo_id && <TransferPhotoThumb publicId={o.transfer_photo_id} />}
                      {!cancelled && <OwnerCancelButton orderId={o.id} />}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {params.order && <ScrollToOrder id={params.order} />}
      {!error && rows.length === 0 && (
        <p className="py-6 text-center text-muted">Không có đơn hàng nào trong khoảng này. Chọn khoảng ngày khác rồi bấm Lọc.</p>
      )}
      {pages > 1 && (
        <nav aria-label="Phân trang" className="flex items-center gap-3">
          {page > 1 && (
            <Link href={href({ page: String(page - 1) })} className={pager}>
              <ChevronLeft aria-hidden="true" size={18} /> Trước
            </Link>
          )}
          <span>
            Trang {page}/{pages}
          </span>
          {page < pages && (
            <Link href={href({ page: String(page + 1) })} className={pager}>
              Sau <ChevronRight aria-hidden="true" size={18} />
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function Tile({ label, value, big, small }: { label: string; value: string; big?: boolean; small?: boolean }) {
  return (
    <div className={`rounded-[18px] ${small ? "rounded-xl bg-surface-2 p-2.5" : "bg-surface p-4"}`}>
      <p className={`text-muted ${small ? "text-[11px]" : "text-xs"}`}>{label}</p>
      <p className={`font-bold ${big ? "text-2xl" : small ? "text-[13px]" : "text-lg"}`}>{value}</p>
    </div>
  );
}
