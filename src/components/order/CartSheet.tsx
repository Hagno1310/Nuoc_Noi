"use client";
import { useEffect, useRef, type ReactNode } from "react";

// Tấm giỏ đơn trên điện thoại: <dialog> gốc của trình duyệt lo nền tối, khóa focus và phím Esc.
// Trượt lên từ đáy; chạm nền tối để đóng. Nội dung chỉ dựng khi mở.
// ponytail: chưa có cử chỉ kéo xuống để đóng; đóng bằng nền tối, nút Đóng hoặc Esc
export function CartSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
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
      aria-label="Giỏ đơn"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="sheet-in mx-auto mt-auto mb-0 max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border-t border-edge bg-bg p-0 text-ink backdrop:bg-bg/70"
    >
      {open && <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{children}</div>}
    </dialog>
  );
}
