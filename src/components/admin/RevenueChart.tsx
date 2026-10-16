"use client";
import { useState, type ComponentProps } from "react";
import { RevenueBars } from "@/components/admin/RevenueBars";

type Bars = Omit<ComponentProps<typeof RevenueBars>, "head">;

// SRS FR-06: hai biểu đồ doanh thu (tuần, tháng) trong một thẻ, chuyển bằng nút Tuần/Tháng (design.pen)
export function RevenueChart({ week, month }: { week: Bars; month: Bars }) {
  const [kind, setKind] = useState<"week" | "month">("week");
  const head = (
    <span className="flex gap-0.5 rounded-xl bg-surface-2 p-0.5">
      {(
        [
          ["week", "Tuần"],
          ["month", "Tháng"],
        ] as const
      ).map(([k, label]) => (
        <button
          key={k}
          type="button"
          aria-pressed={kind === k}
          onClick={() => setKind(k)}
          className={`h-11 rounded-[10px] px-4 text-[13px] font-semibold ${kind === k ? "bg-ink text-bg" : "text-muted"}`}
        >
          {label}
        </button>
      ))}
    </span>
  );
  return <RevenueBars key={kind} {...(kind === "week" ? week : month)} head={head} />;
}
