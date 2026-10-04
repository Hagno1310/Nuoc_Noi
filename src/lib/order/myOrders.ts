const KEY = "pos.myOrders";
const MAX_ENTRIES = 100;
const MAX_AGE_MS = 36 * 3_600_000;

type Entry = { id: string; at: number };

function read(): Entry[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter(
          (e) => typeof e?.id === "string" && typeof e?.at === "number",
        )
      : [];
  } catch {
    return [];
  }
}

function fresh(entries: Entry[], now: number): Entry[] {
  return entries.filter((e) => now - e.at <= MAX_AGE_MS).slice(0, MAX_ENTRIES);
}

export function rememberOrder(id: string, now = Date.now()): void {
  const entries = fresh(
    [{ id, at: now }, ...read().filter((e) => e.id !== id)],
    now,
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // Bộ nhớ trình duyệt bị chặn: danh sách "Đơn vừa tạo" sẽ trống, việc bán hàng không bị ảnh hưởng
  }
}

export function getMyOrderIds(now = Date.now()): string[] {
  return fresh(read(), now).map((e) => e.id);
}
