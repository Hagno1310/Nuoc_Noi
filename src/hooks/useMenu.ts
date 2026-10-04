"use client";
import { useEffect, useState } from "react";
import type { MenuItem } from "@/lib/order/cart";
import { getBrowserSupabase } from "@/lib/supabase/client";

// SRS FR-01: thực đơn cập nhật realtime. Nhân viên đọc được cả món đã ẩn (RLS), để giỏ đơn biết món vừa ngừng bán.
// ponytail: mỗi thay đổi thì đọc lại cả thực đơn (vài chục dòng) thay vì vá từng dòng
export function useMenu(): { menu: MenuItem[] | null; failed: boolean } {
  const [menu, setMenu] = useState<MenuItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const client = getBrowserSupabase();
    let active = true;
    const load = async () => {
      const { data, error } = await client
        .from("menu_items")
        .select("id, name, price, sort_order, is_archived")
        .order("sort_order")
        .order("name");
      if (!active) return;
      if (error || !data) return setFailed(true);
      setFailed(false);
      setMenu(data as MenuItem[]);
    };
    void load();
    const channel = client
      .channel("menu-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_items" }, () => void load())
      .subscribe();
    // iOS ngắt kết nối realtime khi app chạy nền, nên đọc lại khi quay lại
    const refetch = () => {
      if (document.visibilityState === "visible") void load();
    };
    window.addEventListener("online", refetch);
    document.addEventListener("visibilitychange", refetch);
    return () => {
      active = false;
      window.removeEventListener("online", refetch);
      document.removeEventListener("visibilitychange", refetch);
      void client.removeChannel(channel);
    };
  }, []);

  return { menu, failed };
}
