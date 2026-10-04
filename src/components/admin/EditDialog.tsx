"use client";
import { Ellipsis, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

// Nút ⋯ cuối hàng mở hộp thoại giữa màn hình. <dialog> gốc của trình duyệt lo nền tối,
// khóa focus trong hộp và phím Esc; chạm ra nền tối cũng đóng. Nội dung chỉ dựng khi mở,
// nên mỗi lần mở là dữ liệu mới.
export function EditDialog({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: (close: () => void) => ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => ref.current?.close();

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => {
          setOpen(true);
          ref.current?.showModal();
        }}
        className="flex min-h-12 min-w-12 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-raised hover:text-ink"
      >
        <Ellipsis aria-hidden="true" size={20} />
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="edit-dialog m-auto w-[min(24rem,calc(100vw-2rem))] rounded-xl border border-edge bg-raised p-0 text-ink backdrop:bg-bg/70"
      >
        {open && (
          <div className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-xl">{title}</h2>
              <button
                type="button"
                aria-label="Đóng"
                onClick={close}
                className="-mr-2 flex min-h-12 min-w-12 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:text-ink"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            {children(close)}
          </div>
        )}
      </dialog>
    </>
  );
}
