import { changerLabel } from "@/lib/admin/menu";
import { formatVnd } from "@/lib/money";
import { formatVnDateTime } from "@/lib/time";

export type PriceRow = {
  id: number;
  price: number;
  effective_from: string;
  changed_by: string | null;
  menu_items: { name: string } | { name: string }[] | null;
};

// SRS FR-05a: 20 lần đổi giá gần nhất; trạng thái trống và lỗi tải riêng, không làm mất danh sách món (R37)
export function PriceHistory({
  rows,
  failed,
  user,
}: {
  rows: PriceRow[];
  failed: boolean;
  user: { id: string; email?: string } | null;
}) {
  if (failed)
    return (
      <p role="alert" className="text-danger">
        Không tải được lịch sử đổi giá. Kiểm tra mạng rồi tải lại trang.
      </p>
    );
  if (rows.length === 0)
    return <p className="text-sm text-muted">Chưa có lần đổi giá nào.</p>;
  return (
    <ul className="divide-y divide-line rounded-3xl bg-surface px-5 text-sm">
      {rows.map((h) => {
        const item = Array.isArray(h.menu_items) ? h.menu_items[0] : h.menu_items;
        return (
          <li key={h.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 py-3.5">
            <span className="font-semibold">{item?.name ?? "—"}</span>
            <span>{formatVnd(h.price)}</span>
            <span className="text-xs text-muted">{formatVnDateTime(h.effective_from)}</span>
            <span className="truncate text-right text-xs text-muted">
              {changerLabel(h.changed_by, user)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
