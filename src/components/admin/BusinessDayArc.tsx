import type { ReactNode } from "react";

// Đồng hồ giờ mở cửa (SRS FR-06, docs/design/owner-brief.md §3): khoảng giờ mở cửa → giờ đóng cửa trải trên 300°,
// cả vòng là một vệt mờ (giờ chưa tới), phần đã trôi qua vẽ sáng đè lên; không vẽ số liệu lên cung.
// Cung là một vệt sáng phơi sáng: quầng mờ phía sau, nét sáng kem → than hồng, đầu cung là đốm than như đầu điếu thuốc.
const R = 88;
const SPAN = 300;
const START = -SPAN / 2;

function point(deg: number, r = R) {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.sin(rad), y: 100 - r * Math.cos(rad) };
}

export function BusinessDayArc({
  fraction,
  closed,
  startLabel,
  endLabel,
  nowLabel,
  children,
}: {
  fraction: number;
  closed: boolean;
  startLabel: string;
  endLabel: string;
  nowLabel: string;
  children: ReactNode;
}) {
  const end = START + SPAN * Math.min(fraction, 0.9999);
  const a = point(START);
  const b = point(end);
  const z = point(START + SPAN);
  const zIn = point(START + SPAN, R - 7);
  const large = end - START > 180 ? 1 : 0;
  const d = `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`;
  return (
    <div className="relative mx-auto aspect-square w-[min(100%,70vh,560px)] [container-type:inline-size]">
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
        {/* Vệt mờ cả vòng: phần giờ chưa tới */}
        <path
          d={`M ${a.x} ${a.y} A ${R} ${R} 0 1 1 ${z.x} ${z.y}`}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* Vạch mảnh đánh dấu giờ đóng cửa */}
        <line
          x1={z.x}
          y1={z.y}
          x2={zIn.x}
          y2={zIn.y}
          stroke="var(--edge)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        {fraction > 0 && (
          <>
            <path
              d={d}
              fill="none"
              stroke="var(--ember)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.45"
              filter="url(#glow)"
              pathLength={1}
              className="arc-draw"
            />
            <path
              d={d}
              fill="none"
              stroke="url(#trail)"
              strokeWidth="1.6"
              strokeLinecap="round"
              pathLength={1}
              className="arc-draw"
            />
          </>
        )}
        {!closed && (
          <g className="after-draw">
            <circle
              cx={b.x}
              cy={b.y}
              r="7"
              fill="var(--ember)"
              opacity="0.5"
              filter="url(#glow)"
            />
            <circle cx={b.x} cy={b.y} r="3.2" fill="var(--ember)" />
          </g>
        )}
        <text
          x={a.x}
          y={a.y + 13}
          textAnchor="middle"
          className="fill-current text-[7px] tabular-nums text-ink-muted"
        >
          {startLabel}
        </text>
        <text
          x={z.x}
          y={z.y + 13}
          textAnchor="middle"
          className="fill-current text-[7px] tabular-nums text-ink-muted"
        >
          {endLabel}
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 px-[12%] text-center">
        {children}
        <p className="text-xs tabular-nums text-ink-muted">
          {closed ? "Đã đóng cửa" : `Bây giờ ${nowLabel}`}
        </p>
      </div>
    </div>
  );
}
