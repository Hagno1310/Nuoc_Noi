"use client";
import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

// Kéo thả bằng tay cầm ⋮⋮ (chuột và cảm ứng qua Pointer Events); phím mũi tên trên tay cầm cho người dùng bàn phím.
// ponytail: vị trí thả tính theo chiều cao của hàng đang kéo (các hàng cao gần bằng nhau); hàng cao lệch nhiều thì đo từng hàng
export function useDragSort(count: number, onMove: (from: number, to: number) => void, disabled = false) {
  const [drag, setDrag] = useState<{ from: number; to: number; dy: number } | null>(null);
  const origin = useRef<{ y: number; h: number } | null>(null);

  const end = () => {
    origin.current = null;
    setDrag(null);
  };

  const handleProps = (index: number) => ({
    disabled,
    style: { touchAction: "none" } as const,
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      const row = e.currentTarget.closest("li");
      if (!row || disabled) return;
      e.currentTarget.setPointerCapture?.(e.pointerId);
      origin.current = { y: e.clientY, h: row.getBoundingClientRect().height || 48 };
      setDrag({ from: index, to: index, dy: 0 });
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const o = origin.current;
      if (!o || !drag) return;
      const dy = e.clientY - o.y;
      const to = Math.max(0, Math.min(count - 1, drag.from + Math.round(dy / o.h)));
      setDrag({ ...drag, to, dy });
    },
    onPointerUp: () => {
      if (drag && drag.to !== drag.from) onMove(drag.from, drag.to);
      end();
    },
    onPointerCancel: end,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      if (e.key === "ArrowUp" && index > 0) {
        e.preventDefault();
        onMove(index, index - 1);
      }
      if (e.key === "ArrowDown" && index < count - 1) {
        e.preventDefault();
        onMove(index, index + 1);
      }
    },
  });

  // Hàng đang kéo đi theo ngón tay; hàng ở chỗ sẽ thả có vạch mực cam phía trên/dưới
  const rowStyle = (index: number) =>
    drag?.from === index ? { transform: `translateY(${drag.dy}px)` } : undefined;
  const dropMark = (index: number) =>
    drag && drag.to === index && drag.to !== drag.from
      ? drag.to < drag.from
        ? "border-t-2 border-t-ember"
        : "border-b-2 border-b-ember"
      : "";

  return { drag, handleProps, rowStyle, dropMark };
}
