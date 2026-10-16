"use client";
import { Ellipsis, X } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

// Nút ⋯ cuối hàng mở tấm trượt từ đáy trên điện thoại, hộp thoại giữa màn từ lg (DESIGN.md). <dialog> gốc của trình duyệt lo nền tối,
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
        className="flex size-12 shrink-0 items-center justify-center rounded-xl text-muted hover:text-ink"
      >
        <Ellipsis aria-hidden="true" size={20} />
      </button>
      <dialog
        ref={ref}
        aria-label={title}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === e.currentTarget && close()}
        className="sheet m-0 mt-auto w-full max-w-none rounded-t-3xl bg-surface p-0 text-ink lg:m-auto lg:w-110 lg:rounded-3xl lg:border lg:border-line"
      >
        {open && (
          <div className="space-y-4 p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{title}</h2>
              <button
                type="button"
                aria-label="Đóng"
                onClick={close}
                className="flex size-12 items-center justify-center rounded-full bg-surface-2"
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
