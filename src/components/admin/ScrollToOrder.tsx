"use client";
import { useEffect } from "react";

// SRS FR-07: ?order=<mã đơn> mở sẵn và cuộn tới đơn đó
// ponytail: chỉ cuộn khi đơn nằm trong trang đang xem; đơn ngoài khoảng ngày hoặc trang khác thì không có gì xảy ra
export function ScrollToOrder({ id }: { id: string }) {
  useEffect(() => {
    document.getElementById(`order-${id}`)?.scrollIntoView({ block: "center" });
  }, [id]);
  return null;
}
