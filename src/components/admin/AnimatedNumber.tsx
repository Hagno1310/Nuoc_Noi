"use client";
import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/lib/money";

// Khi Tổng quan tự tải lại (SRS FR-06), con số chạy từ giá trị cũ sang mới trong 600ms.
// Lần đầu hiện ngay giá trị thật (không đếm từ 0); bỏ chạy số khi người dùng giảm chuyển động.
export function AnimatedNumber({
  value,
  kind = "plain",
}: {
  value: number;
  kind?: "vnd" | "plain";
}) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches)
      return setShown(value);
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 600);
      const eased = 1 - (1 - k) ** 3;
      setShown(Math.round(start + (value - start) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{kind === "vnd" ? formatVnd(shown) : shown}</>;
}
