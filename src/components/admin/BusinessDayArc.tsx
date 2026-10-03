import type { ReactNode } from "react";

// Cung "Đồng hồ ca" (docs/design/owner-brief.md §3): 24 giờ của ngày kinh doanh trải trên 300°,
// chỉ vẽ phần đã trôi qua; không vẽ số liệu lên cung (SRS R6 bỏ biểu đồ).
const R = 88;
const SPAN = 300;
const START = -SPAN / 2;

function point(deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + R * Math.sin(rad), y: 100 - R * Math.cos(rad) };
}

export function BusinessDayArc({
  elapsed,
  startLabel,
  nowLabel,
  children,
}: {
  elapsed: number;
  startLabel: string;
  nowLabel: string;
  children: ReactNode;
}) {
  const end = START + (SPAN * Math.min(elapsed, 23.99)) / 24;
  const a = point(START);
  const b = point(end);
  const large = end - START > 180 ? 1 : 0;
  return (
    <div className="relative mx-auto aspect-square w-full max-w-sm">
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="absolute inset-0"
      >
        {elapsed > 0 && (
          <path
            d={`M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-ember"
          />
        )}
        <circle cx={b.x} cy={b.y} r="4" className="fill-ember" />
        <text
          x={a.x}
          y={a.y + 14}
          textAnchor="middle"
          className="fill-current text-[8px] tabular-nums text-ink-muted"
        >
          {startLabel}
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-10 text-center">
        {children}
        <p className="text-xs tabular-nums text-ink-muted">
          Bây giờ {nowLabel}
        </p>
      </div>
    </div>
  );
}
