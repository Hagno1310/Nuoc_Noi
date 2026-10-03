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
      className={`flex items-center justify-between rounded-xl p-3 transition-colors ${highlight ? "bg-yellow-300" : "bg-slate-100"}`}
    >
      <span className="text-xl font-semibold">
        {price === null ? "Đang tải giá…" : `Đơn giá: ${formatVnd(price)}/cốc`}
      </span>
      {offline && (
        <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white">
          Mất mạng
        </span>
      )}
    </div>
  );
}
