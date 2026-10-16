"use client";
import { CircleCheck } from "lucide-react";
import { useEffect } from "react";

// kind "round": Hoàn tác hủy lượt gọi Trả sau vừa gửi (FR-04d)
// kind "paid": vừa thu tiền một đơn chờ thanh toán, không có Hoàn tác
export type Feedback = { id: string; kind: "order" | "round" | "paid"; text: string };

// Nút Xác nhận đơn, hoặc thanh phản hồi sau khi gửi kèm Hoàn tác 5 giây (SRS FR-04)
export function ConfirmBar({
  canSubmit,
  blockReason,
  sending,
  feedback,
  cancelBusy,
  undoing,
  onSubmit,
  onUndo,
  onFeedbackEnd,
}: {
  canSubmit: boolean;
  blockReason: string | null;
  sending: boolean;
  feedback: Feedback | null;
  cancelBusy: boolean;
  undoing: boolean;
  onSubmit: () => void;
  onUndo: (fb: Feedback) => void;
  onFeedbackEnd: () => void;
}) {
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(onFeedbackEnd, 5000);
    return () => clearTimeout(timer);
  }, [feedback, onFeedbackEnd]);

  if (feedback)
    return (
      <div className="rise flex h-15 items-center gap-2.5 rounded-[18px] bg-surface-2 pr-1.5 pl-4">
        <CircleCheck aria-hidden="true" size={20} className="shrink-0 text-ok" />
        <span role="status" className="min-w-0 flex-1 text-sm font-semibold">
          {feedback.text}
        </span>
        {feedback.kind !== "paid" && <button
          type="button"
          disabled={cancelBusy}
          onClick={() => onUndo(feedback)}
          className="h-12 shrink-0 rounded-[14px] bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-50"
        >
          {undoing ? "Đang hủy…" : "Hoàn tác"}
        </button>}
      </div>
    );
  return (
    <button
      type="button"
      aria-label="Xác nhận đơn"
      disabled={!canSubmit || sending}
      onClick={onSubmit}
      className="h-16 w-full rounded-2xl bg-accent text-lg font-semibold text-accent-ink disabled:bg-surface-2 disabled:text-muted"
    >
      {sending ? "Đang gửi…" : canSubmit ? "Xác nhận đơn" : blockReason}
    </button>
  );
}
