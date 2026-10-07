"use client";
import { useEffect, useRef, useState } from "react";
import { transferPhotoUrl } from "@/lib/cloudinary";

// Ảnh Cloudinary đã tự thu nhỏ theo width. Lỗi tải thì báo tại chỗ, phần còn lại của đơn vẫn hiện (spec §5.1)
export function PhotoImg({
  publicId,
  width,
  className,
  alt = "Ảnh chuyển khoản",
}: {
  publicId: string;
  width: number;
  className?: string;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) return <p className="text-sm text-danger">Không tải được ảnh.</p>;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- Cloudinary đã thu nhỏ, không qua tối ưu ảnh của Next
    <img src={transferPhotoUrl(publicId, width)} alt={alt} className={className} onError={() => setFailed(true)} />
  );
}

// SRS v3.3 FR-04b, FR-07: xem ảnh chuyển khoản toàn màn hình. <dialog> gốc lo Esc và khóa focus.
export function PhotoViewer({ publicId, onClose }: { publicId: string | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (publicId && !d.open) d.showModal();
    if (!publicId && d.open) d.close();
  }, [publicId]);
  return (
    <dialog
      ref={ref}
      aria-label="Ảnh chuyển khoản"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto max-h-dvh max-w-none bg-transparent p-4 text-ink backdrop:bg-bg/90"
    >
      {publicId && (
        <div className="flex flex-col items-center gap-3">
          <PhotoImg key={publicId} publicId={publicId} width={1200} className="max-h-[80dvh] w-auto rounded-xl" />
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-xl border border-edge bg-raised px-6 font-semibold"
          >
            Đóng
          </button>
        </div>
      )}
    </dialog>
  );
}

// Lịch sử đơn hàng: ảnh nhỏ, bấm để xem to
export function TransferPhotoThumb({ publicId }: { publicId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        aria-label="Xem ảnh chuyển khoản"
        onClick={() => setOpen(true)}
        className="block min-h-12 overflow-hidden rounded-lg border border-edge"
      >
        <PhotoImg publicId={publicId} width={480} alt="" className="h-32 w-auto" />
      </button>
      <PhotoViewer publicId={open ? publicId : null} onClose={() => setOpen(false)} />
    </>
  );
}
