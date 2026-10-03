"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ownerErrorText } from "@/lib/admin/errors";
import { useTwoStep } from "@/lib/admin/useTwoStep";
import { getBrowserSupabase } from "@/lib/supabase/client";

// SRS FR-07: chủ quán hủy đơn từ lịch sử, có bước xác nhận (hai bước theo ui-craft.md)
export function OwnerCancelButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const step = useTwoStep();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function click() {
    if (!step.armed) return step.arm(true);
    step.reset();
    setBusy(true);
    const { error } = await getBrowserSupabase().rpc("cancel_order", {
      p_order_id: orderId,
    });
    setBusy(false);
    setError(error ? ownerErrorText(error) : null);
    router.refresh();
  }

  return (
    <span className="inline-flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={busy}
        onClick={() => void click()}
        className={`min-h-12 rounded-md border px-2 text-xs font-semibold sm:px-3 sm:text-sm disabled:opacity-50 ${step.armed ? "border-danger bg-danger text-ember-ink" : "border-danger/70 text-danger"}`}
      >
        {busy ? "Đang hủy…" : step.armed ? "Chắc chắn hủy?" : "Hủy"}
      </button>
      {error && (
        <span role="alert" className="text-xs text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
