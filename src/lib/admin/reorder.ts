// Đổi thứ tự bằng kéo thả (SRS FR-05, FR-05c): đánh số lại theo thứ tự mới và chỉ trả về các hàng đổi số.
// Mỗi hàng là một lệnh update riêng, nên không tạo vòng chờ với khóa FOR SHARE của create_order.
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function renumber<T extends { id: string; sort_order: number }>(
  ordered: T[],
): { id: string; sort_order: number }[] {
  return ordered.flatMap((item, i) =>
    item.sort_order === i + 1 ? [] : [{ id: item.id, sort_order: i + 1 }],
  );
}
