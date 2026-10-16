"use client";
import { useSyncExternalStore } from "react";

// Màn rộng: 768px (md) cho phiếu đơn luôn hiện bên phải; 1024px (lg) cho bố cục máy tính của trang chủ quán
export function useWide(query = "(min-width: 768px)"): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
