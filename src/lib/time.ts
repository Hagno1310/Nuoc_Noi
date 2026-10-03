const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Ho_Chi_Minh",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function vnParts(iso: string): Record<string, string> {
  return Object.fromEntries(
    formatter.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
}

export function formatVnDateTime(iso: string): string {
  const p = vnParts(iso);
  return `${p.day}/${p.month}/${p.year} ${p.hour}:${p.minute}:${p.second}`;
}

export function formatVnTime(iso: string): string {
  const p = vnParts(iso);
  return `${p.hour}:${p.minute}`;
}

export function formatIsoDate(date: string): string {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}
