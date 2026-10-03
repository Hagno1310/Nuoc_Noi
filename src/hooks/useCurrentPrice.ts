"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function useCurrentPrice(): number | null {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const client = getBrowserSupabase();
    let active = true;
    const fetchPrice = async () => {
      const { data } = await client
        .from("settings")
        .select("current_price")
        .eq("id", 1)
        .single();
      if (active && data) setPrice(data.current_price);
    };
    void fetchPrice();

    const channel = client
      .channel("settings-price")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "settings" },
        (payload) => {
          if (active)
            setPrice((payload.new as { current_price: number }).current_price);
        },
      )
      .subscribe();

    // iOS ngắt kết nối realtime khi app chạy nền, nên fetch lại khi quay lại
    const refetch = () => {
      if (document.visibilityState === "visible") void fetchPrice();
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

  return price;
}
