import type { ReactNode } from "react";

// Đồng hồ giờ mở cửa (SRS FR-06): khoảng giờ mở cửa → giờ đóng cửa trải trên 300°.
// In phẳng như mặt bao diêm: rãnh 1px cả vòng (giờ chưa tới), nét mực cam cho phần đã trôi qua,
// một đốm cam ở giờ hiện tại; không quầng sáng, không gradient, không chuyển động. Không vẽ số liệu lên cung.
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
  const elapsed = `M ${a.x} ${a.y} A ${R} ${R} 0 ${large} 1 ${b.x} ${b.y}`;
  return (
    <div className="relative mx-auto aspect-square w-[min(100%,70vh,560px)] [container-type:inline-size]">
      <svg viewBox="0 0 200 200" aria-hidden="true" className="absolute inset-0 overflow-visible">
        <path
          d={`M ${a.x} ${a.y} A ${R} ${R} 0 1 1 ${z.x} ${z.y}`}
          fill="none"
          stroke="var(--line)"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <line x1={z.x} y1={z.y} x2={zIn.x} y2={zIn.y} stroke="var(--edge)" strokeWidth="1" strokeLinecap="round" />
        {fraction > 0 && (
          <path d={elapsed} fill="none" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round" />
        )}
        {!closed && <circle cx={b.x} cy={b.y} r="3.2" fill="var(--ember)" />}
        <text x={a.x} y={a.y + 13} textAnchor="middle" className="fill-current text-[7px] tabular-nums text-ink-muted">
          {startLabel}
        </text>
        <text x={z.x} y={z.y + 13} textAnchor="middle" className="fill-current text-[7px] tabular-nums text-ink-muted">
          {endLabel}
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-[12%] text-center">
        {children}
        <p className="text-xs tabular-nums text-ink-muted">
          {closed ? "Đã đóng cửa" : `Bây giờ ${nowLabel}`}
        </p>
      </div>
    </div>
  );
}
