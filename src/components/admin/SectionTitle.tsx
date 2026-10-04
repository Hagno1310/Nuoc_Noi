import type { ReactNode } from "react";

// Tiêu đề mục: chữ biển hẹp đậm trên một đường kẻ 1px (hệ đường kẻ duy nhất của Bao diêm quán bar).
// action: nút đi kèm mục (ví dụ Sắp xếp), nằm cùng dòng để không chiếm một dải riêng
export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 border-b border-line pb-2">
      <h2 className="font-display text-xl">{children}</h2>
      {action}
    </div>
  );
}
