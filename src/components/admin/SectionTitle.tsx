import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Tiêu đề trang: dòng phụ nhỏ + tiêu đề lớn, nút đi kèm bên phải (DESIGN.md)
export function PageTitle({ title, sub, action }: { title: string; sub?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 pb-5 lg:pb-7">
      <div>
        {sub && <p className="text-[13px] text-muted lg:text-sm">{sub}</p>}
        <h1 className="text-[28px] leading-tight font-bold lg:text-[32px]">{title}</h1>
      </div>
      {action}
    </header>
  );
}

// Tiêu đề mục trong trang; action: nút đi kèm mục, nằm cùng dòng
export function SectionTitle({ children, action, icon: Icon }: { children: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3.5">
      <h2 className="flex items-center gap-2.5 text-[17px] font-bold">
        {Icon && (
          <span className="grid size-9 place-items-center rounded-xl bg-surface-2">
            <Icon aria-hidden="true" size={18} />
          </span>
        )}
        {children}
      </h2>
      {action}
    </div>
  );
}
