"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { formatVnd } from "@/lib/money";

type NewOrder = {
  id: string;
  item_count: number;
  total_amount: number;
  seat_name: string;
};

// SRS FR-06a: nhân viên tạo đơn thì trang chủ quán hiện thông báo vài giây và cập nhật số liệu ngay
export function NewOrderNotice() {
  const router = useRouter();
  const [order, setOrder] = useState<NewOrder | null>(null);

  useEffect(() => {
    const client = getBrowserSupabase();
    const channel = client
      .channel("owner-new-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        async (payload) => {
          router.refresh();
          // Cột generated (total_amount) có thể không có trong payload Realtime: đọc lại dòng đơn
          const { data } = await client
            .from("orders")
            .select("id, item_count, total_amount, seat_name")
            .eq("id", (payload.new as { id: string }).id)
            .single();
          if (data) setOrder(data);
        },
      )
      .subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [router]);

  useEffect(() => {
    if (!order) return;
    const timer = setTimeout(() => setOrder(null), 5000);
    return () => clearTimeout(timer);
  }, [order]);

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-4 top-4 z-30 flex justify-center lg:left-auto lg:right-10 lg:top-8"
    >
      {order && (
        <Link
          key={order.id}
          href={`/admin/history?order=${order.id}`}
          className="toast-in pointer-events-auto flex min-h-12 items-center rounded-lg border border-edge bg-raised px-4 py-3 font-medium tabular-nums"
        >
          Đơn mới: {order.seat_name} · {order.item_count} món · {formatVnd(order.total_amount)}
        </Link>
      )}
    </div>
  );
}
