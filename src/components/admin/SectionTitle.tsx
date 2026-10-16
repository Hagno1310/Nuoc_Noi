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
export function SectionTitle({ children, action }: { children: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 pb-3">
      <h2 className="text-[17px] font-bold">{children}</h2>
      {action}
    </div>
  );
}
