import type { ReactNode } from "react";

// Cung "Đồng hồ ca" (docs/design/owner-brief.md §3): 24 giờ của ngày kinh doanh trải trên 300°,
// chỉ vẽ phần đã trôi qua; không vẽ số liệu lên cung (SRS R6).
// Cung là một vệt sáng phơi sáng: quầng mờ phía sau, nét sáng kem → than hồng, đầu cung là đốm than như đầu điếu thuốc.
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
  const d = `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`;
  return (
    <div className="relative mx-auto aspect-square w-[min(100%,70vh,560px)]">
      <svg
        viewBox="0 0 200 200"
        aria-hidden="true"
        className="absolute inset-0 overflow-visible"
      >
        <defs>
          <linearGradient id="trail" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--ink)" stopOpacity="0.35" />
            <stop offset="0.55" stopColor="var(--ink)" />
            <stop offset="1" stopColor="var(--ember)" />
          </linearGradient>
          <filter
            id="glow"
            filterUnits="userSpaceOnUse"
            x="-20"
            y="-20"
            width="240"
            height="240"
          >
            <feGaussianBlur stdDeviation="3.5" />
          </filter>
        </defs>
        {elapsed > 0 && (
          <>
            <path
              d={d}
              fill="none"
              stroke="var(--ember)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.45"
              filter="url(#glow)"
            />
            <path
              d={d}
              fill="none"
              stroke="url(#trail)"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </>
        )}
        <circle
          cx={b.x}
          cy={b.y}
          r="7"
          fill="var(--ember)"
          opacity="0.5"
          filter="url(#glow)"
        />
        <circle cx={b.x} cy={b.y} r="3.2" fill="var(--ember)" />
        <text
          x={a.x}
          y={a.y + 13}
          textAnchor="middle"
          className="fill-current text-[7px] tabular-nums text-ink-muted"
        >
          {startLabel}
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-[12%] text-center">
        {children}
        <p className="text-xs tabular-nums text-ink-muted">
          Bây giờ {nowLabel}
        </p>
      </div>
    </div>
  );
}
