// Phần trăm thay đổi so với kỳ trước, làm tròn; kỳ trước bằng 0 thì không tính (SRS FR-06)
export function percentChange(
  current: number,
  previous: number,
): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export type PeriodTotals = {
  revenue: number;
  cups: number;
  order_count: number;
};
export type DayPoint = {
  label: string;
  revenue: number | null;
  previous_revenue: number | null;
};
