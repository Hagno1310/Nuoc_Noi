"use client";
import { useEffect } from "react";

export type Feedback = { orderId: string; text: string };

type Props = {
  canSubmit: boolean;
  sending: boolean;
  feedback: Feedback | null;
  onSubmit: () => void;
  onUndo: (orderId: string) => void;
  onFeedbackEnd: () => void;
};

export function ConfirmBar({
  canSubmit,
  sending,
  feedback,
  onSubmit,
  onUndo,
  onFeedbackEnd,
}: Props) {
  useEffect(() => {
    if (!feedback) return;
    const timer = setTimeout(onFeedbackEnd, 5000);
    return () => clearTimeout(timer);
  }, [feedback, onFeedbackEnd]);

  if (feedback) {
    return (
      <div className="flex min-h-16 items-center justify-between gap-3 rounded-2xl bg-slate-800 px-4 text-white">
        <span role="status" className="font-semibold">
          {feedback.text}
        </span>
        <button
          type="button"
          onClick={() => onUndo(feedback.orderId)}
          className="min-h-12 rounded-lg border border-white/60 px-4 font-bold"
        >
          Hoàn tác
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      aria-label="Xác nhận đơn"
      disabled={!canSubmit || sending}
      onClick={onSubmit}
      className="min-h-16 w-full rounded-2xl bg-emerald-600 text-2xl font-bold text-white active:scale-[0.98] disabled:bg-slate-300"
    >
      {sending ? "Đang gửi…" : "Xác nhận đơn"}
    </button>
  );
}
