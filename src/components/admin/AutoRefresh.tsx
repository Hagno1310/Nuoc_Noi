"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// SRS FR-06: Tổng quan tự tải lại mỗi 60 giây; số đổi tại chỗ, không tải lại cả trang
export function AutoRefresh({ seconds = 60 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
