// SRS FR-05, FR-05a: quy tắc tên món và nhãn người đổi giá (server cũng chặn trùng bằng unique index)
export type MenuItemLike = {
  id: string;
  name: string;
  is_archived: boolean;
  sort_order: number;
};

export function normalizeMenuName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

const key = (name: string) => normalizeMenuName(name).toLowerCase();

// exceptId: món đang được đổi tên hoặc hiện lại, không so với chính nó
export function menuNameError(
  raw: string,
  items: MenuItemLike[],
  exceptId?: string,
): string | null {
  const name = normalizeMenuName(raw);
  if (!name) return "Nhập tên món trước khi lưu.";
  const taken = items.some(
    (i) => !i.is_archived && i.id !== exceptId && key(i.name) === key(name),
  );
  return taken ? "Đã có món đang bán tên này. Đặt tên khác." : null;
}

// Món mới đứng cuối; tính cả món đã ẩn để hiện lại không đụng thứ tự
export function nextSortOrder(items: MenuItemLike[]): number {
  return Math.max(0, ...items.map((i) => i.sort_order)) + 1;
}

export function changerLabel(
  changedBy: string | null,
  user: { id: string; email?: string } | null,
): string {
  if (changedBy === null) return "Khởi tạo";
  if (user && changedBy === user.id && user.email) return user.email;
  return "Chủ quán khác";
}
