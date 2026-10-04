// Phần trăm thay đổi so với kỳ trước, làm tròn; kỳ trước bằng 0 thì không tính (SRS FR-06)
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

// owner_stats / history_totals (SRS v3.0 FR-06): doanh thu sau giảm, số món, số đơn, tổng số tiền đã giảm
export type PeriodTotals = {
  revenue: number;
  item_count: number;
  order_count: number;
  discount_total: number;
};
export type DayPoint = {
  label: string;
  revenue: number | null;
  previous_revenue: number | null;
};
