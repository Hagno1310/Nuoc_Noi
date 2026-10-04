"use client";
import { useEffect, useRef, useState } from "react";
import { formatVnd } from "@/lib/money";
import type { DayPoint } from "@/lib/admin/stats";

// Cột đôi doanh thu theo ngày: kỳ này (than hồng) cạnh kỳ trước (xanh ngọc), SRS FR-06.
// Một trục, cột neo đáy, bo 4px đầu cột, khe 2px giữa hai cột; chú giải + tooltip + bảng cho trình đọc màn hình (dataviz).
const H = 180;
const PAD_TOP = 12;
const GUTTER = 76; // lề trái cho nhãn tiền, để nhãn không chồng lên cột

function niceMax(v: number) {
  if (v <= 0) return 100000;
  const step = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / step) * step;
}

function bar(x: number, w: number, value: number, max: number) {
  const h = Math.max(value > 0 ? 2 : 0, ((H - PAD_TOP) * value) / max);
  const y = H - h;
  const r = Math.min(4, w / 2, h);
  // Bo hai góc trên, đáy phẳng neo vào trục
  return `M${x},${H} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${H} Z`;
}

export function RevenueBars({
  title,
  points,
  currentLabel,
  previousLabel,
  ticks,
}: {
  title: string;
  points: DayPoint[];
  currentLabel: string;
  previousLabel: string;
  ticks: number[]; // chỉ số các ngày có nhãn trục
}) {
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const max = niceMax(
    Math.max(
      0,
      ...points.flatMap((p) => [p.revenue ?? 0, p.previous_revenue ?? 0]),
    ),
  );
  const plotW = Math.max(0, width - GUTTER);
  const slot = plotW / Math.max(1, points.length);
  const gap = 2;
  const barW = Math.max(1, (slot * 0.72 - gap) / 2);
  const groupPad = (slot - (barW * 2 + gap)) / 2;
  const hovered = active === null ? null : points[active];

  return (
    <figure className="space-y-3">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-display text-xl tracking-wide">{title}</span>
        <span className="flex gap-4 text-xs text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm bg-chart-current"
            />
            {currentLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-sm bg-chart-previous"
            />
            {previousLabel}
          </span>
        </span>
      </figcaption>
      <div
        ref={box}
        className="relative"
        onPointerLeave={() => setActive(null)}
      >
        {width > 0 && (
          <svg
            width={width}
            height={H + 18}
            aria-hidden="true"
            className="block overflow-visible"
          >
            {[0.5, 1].map((t) => (
              <g key={t}>
                <line
                  x1={GUTTER}
                  x2={width}
                  y1={H - (H - PAD_TOP) * t}
                  y2={H - (H - PAD_TOP) * t}
                  stroke="var(--line)"
                  strokeDasharray="2 4"
                />
                <text
                  x={GUTTER - 6}
                  y={H - (H - PAD_TOP) * t + 4}
                  textAnchor="end"
                  className="fill-current text-xs tabular-nums text-ink-muted"
                >
                  {formatVnd(max * t)}
                </text>
              </g>
            ))}
            <line x1={GUTTER} x2={width} y1={H} y2={H} stroke="var(--edge)" />
            {points.map((p, i) => {
              const x0 = GUTTER + i * slot + groupPad;
              return (
                <g key={i} opacity={active === null || active === i ? 1 : 0.45}>
                  {p.previous_revenue !== null && (
                    <path
                      d={bar(x0 + barW + gap, barW, p.previous_revenue, max)}
                      fill="var(--chart-previous)"
                    />
                  )}
                  {p.revenue !== null && (
                    <path
                      d={bar(x0, barW, p.revenue, max)}
                      fill="var(--chart-current)"
                    />
                  )}
                  {ticks.includes(i) && (
                    <text
                      x={GUTTER + i * slot + slot / 2}
                      y={H + 14}
                      textAnchor="middle"
                      className="fill-current text-xs tabular-nums text-ink-muted"
                    >
                      {p.label}
                    </text>
                  )}
                  {/* Vùng bắt chạm cao hết biểu đồ, rộng hơn cột */}
                  <rect
                    x={GUTTER + i * slot}
                    y={0}
                    width={slot}
                    height={H + 18}
                    fill="transparent"
                    onPointerEnter={() => setActive(i)}
                    onPointerDown={() => setActive(i)}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {hovered && width > 0 && active !== null && (
          <div
            role="status"
            className="pointer-events-none absolute top-0 z-10 rounded-lg border border-edge bg-raised px-3 py-2 text-xs shadow-[0_6px_20px_rgb(0_0_0/0.45)]"
            style={{
              left: Math.min(
                Math.max(0, GUTTER + active * slot - 60),
                width - 150,
              ),
            }}
          >
            <p className="font-semibold">{hovered.label}</p>
            <p className="tabular-nums">
              {currentLabel}:{" "}
              {hovered.revenue === null
                ? "chưa tới"
                : formatVnd(hovered.revenue)}
            </p>
            <p className="tabular-nums text-ink-muted">
              {previousLabel}:{" "}
              {hovered.previous_revenue === null
                ? "—"
                : formatVnd(hovered.previous_revenue)}
            </p>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Ngày kinh doanh</th>
            <th>{currentLabel}</th>
            <th>{previousLabel}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td>{p.label}</td>
              <td>{p.revenue === null ? "chưa tới" : formatVnd(p.revenue)}</td>
              <td>
                {p.previous_revenue === null
                  ? "—"
                  : formatVnd(p.previous_revenue)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
