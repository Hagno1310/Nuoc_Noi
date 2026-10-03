"use client";
import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/lib/money";

export function PriceBanner({
  price,
  offline,
}: {
  price: number | null;
  offline: boolean;
}) {
  const [highlight, setHighlight] = useState(false);
  const previous = useRef(price);

  useEffect(() => {
    const before = previous.current;
    previous.current = price;
    if (before === null || price === null || before === price) return;
    setHighlight(true);
    const timer = setTimeout(() => setHighlight(false), 3000);
    return () => clearTimeout(timer);
  }, [price]);

  return (
    <div
      data-testid="price-banner"
      data-highlight={highlight ? "true" : "false"}
      className="flex items-center gap-2"
    >
      <span
        className={`rounded-md px-2 py-1 text-sm font-medium transition-colors duration-200 ${highlight ? "bg-warn text-ember-ink" : "text-ink-muted"}`}
      >
        {price === null ? "Đang tải giá…" : `Đơn giá: ${formatVnd(price)}/cốc`}
      </span>
      {offline && (
        <span className="rounded-full bg-danger px-2.5 py-0.5 text-xs font-semibold text-ember-ink">
          Mất mạng
        </span>
      )}
    </div>
  );
}
