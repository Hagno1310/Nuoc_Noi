"use client";
import Image from "next/image";
import { useEffect } from "react";

export type Feedback = { orderId: string; text: string };

type Props = {
  canSubmit: boolean;
  sending: boolean;
  feedback: Feedback | null;
  cancelBusy: boolean;
  undoing: boolean;
  onSubmit: () => void;
  onUndo: (orderId: string) => void;
  onFeedbackEnd: () => void;
};

export function ConfirmBar({
  canSubmit,
  sending,
  feedback,
  cancelBusy,
  undoing,
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
      <div className="flex min-h-16 items-center justify-between gap-3 rounded-2xl border border-ember/60 bg-raised pr-2 pl-4">
        <span className="flex items-center gap-3">
          <Image
            src="/brand/motif-cigarette.png"
            alt=""
            width={46}
            height={20}
            className="halo shrink-0"
          />
          <span role="status" className="font-semibold text-balance">
            {feedback.text}
          </span>
        </span>
        <button
          type="button"
          disabled={cancelBusy}
          onClick={() => onUndo(feedback.orderId)}
          className="min-h-12 shrink-0 rounded-xl border border-edge px-4 font-semibold active:bg-ink active:text-bg disabled:opacity-50"
        >
          {undoing ? "Đang hủy…" : "Hoàn tác"}
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
      className="min-h-16 w-full rounded-2xl bg-ember font-display text-2xl tracking-wide text-ember-ink transition-[transform,background-color] duration-150 active:scale-[0.98] disabled:bg-raised disabled:text-ink-muted"
    >
      {sending ? "Đang gửi…" : "Xác nhận đơn"}
    </button>
  );
}
