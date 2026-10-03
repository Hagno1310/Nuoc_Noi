"use client";
import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { OrderScreen } from "@/components/order/OrderScreen";
import { useCurrentPrice } from "@/hooks/useCurrentPrice";
import { useOnline } from "@/hooks/useOnline";
import { createStaffApi } from "@/lib/api";
import { getBrowserSupabase, getRpcClient } from "@/lib/supabase/client";

export default function OrderPage() {
  const router = useRouter();
  const price = useCurrentPrice();
  const online = useOnline();
  const api = useMemo(() => createStaffApi(getRpcClient), []);
  const onUnauthorized = useCallback(() => {
    void getBrowserSupabase()
      .auth.signOut({ scope: "local" })
      .finally(() => router.replace("/login"));
  }, [router]);

  return (
    <OrderScreen
      api={api}
      price={price}
      online={online}
      onUnauthorized={onUnauthorized}
    />
  );
}
