function isValidIsoDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function normalizeRange(
  from: string | undefined,
  to: string | undefined,
  today: string,
) {
  const f = isValidIsoDate(from) ? from : today;
  const t = isValidIsoDate(to) ? to : today;
  return f <= t ? { from: f, to: t } : { from: t, to: f };
}

export function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
