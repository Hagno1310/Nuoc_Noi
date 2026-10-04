// Một nút Lưu cho cả giờ mở cửa và giờ đóng cửa (SRS FR-05b). Server từ chối hai giờ trùng nhau,
// nên khi đổi cả hai phải lưu theo thứ tự không bao giờ đi qua trạng thái trùng.
type Hours = { start: number; end: number };

export function hourUpdates(
  current: Hours,
  next: Hours,
): { steps: ("start" | "end")[] } | { error: string } {
  if (next.start === next.end) return { error: "Giờ mở cửa không được trùng giờ đóng cửa." };
  const startChanged = next.start !== current.start;
  const endChanged = next.end !== current.end;
  if (!startChanged || !endChanged)
    return { steps: startChanged ? ["start"] : endChanged ? ["end"] : [] };
  if (next.start === current.end && next.end === current.start)
    return { error: "Đổi từng giờ một: lưu giờ mở cửa trước, rồi đổi giờ đóng cửa." };
  return { steps: next.start === current.end ? ["end", "start"] : ["start", "end"] };
}
