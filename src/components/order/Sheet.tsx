"use client";
import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

// Tấm trượt từ đáy trên điện thoại, hộp thoại giữa màn từ md (DESIGN.md). <dialog> gốc lo nền tối, focus và Esc.
// ponytail: chưa có cử chỉ kéo xuống để đóng; đóng bằng nền tối, nút Đóng hoặc Esc
export function Sheet({
  open,
  onClose,
  label,
  title,
  subtitle,
  actions,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      // React đẩy sự kiện close của tấm con (ghi chú) lên tấm cha; chỉ đóng khi chính tấm này đóng
      onClose={(e) => e.target === e.currentTarget && onClose()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="sheet m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-bg p-0 text-ink md:m-auto md:max-w-md md:rounded-3xl"
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col px-4 pt-2.5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <span aria-hidden="true" className="mx-auto mb-2 h-1 w-10 shrink-0 rounded-full bg-line md:hidden" />
          {title !== undefined && (
            <header className="flex shrink-0 items-center gap-2 pb-3">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold">{title}</h2>
                {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
              </div>
              {actions}
              <button
                type="button"
                aria-label="Đóng"
                onClick={onClose}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-surface-2"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </header>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
