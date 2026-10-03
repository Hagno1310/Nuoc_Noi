"use client";
import { useEffect, useState } from "react";

// Xác nhận hai bước cho hành động phá hủy (ui-craft.md): bấm lần đầu thì "armed" vài giây
export function useTwoStep<T = true>(ms = 4000) {
  const [armed, setArmed] = useState<T | null>(null);
  useEffect(() => {
    if (armed === null) return;
    const timer = setTimeout(() => setArmed(null), ms);
    return () => clearTimeout(timer);
  }, [armed, ms]);
  return { armed, arm: setArmed, reset: () => setArmed(null) };
}
