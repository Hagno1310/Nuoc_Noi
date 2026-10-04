"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OrderScreen } from "@/components/order/OrderScreen";
import { useMenu } from "@/hooks/useMenu";
import { useOnline } from "@/hooks/useOnline";
import { createStaffApi } from "@/lib/api";
import { getBrowserSupabase, getRpcClient } from "@/lib/supabase/client";

export default function OrderPage() {
  const router = useRouter();
  const { menu, failed } = useMenu();
  const online = useOnline();
  const api = useMemo(() => createStaffApi(getRpcClient), []);
  // Chủ quán cũng dùng được /order (SRS §2.2): hiện đường quay lại trang chủ quán
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    void getBrowserSupabase()
      .rpc("is_owner")
      .then(({ data }) => setIsOwner(data === true));
  }, []);
  const onUnauthorized = useCallback(() => {
    void getBrowserSupabase()
      .auth.signOut({ scope: "local" })
      .finally(() => router.replace("/login"));
  }, [router]);

  return (
    <OrderScreen
      api={api}
      menu={menu}
      menuFailed={failed}
      online={online}
      onUnauthorized={onUnauthorized}
      ownerHome={isOwner ? "/admin/dashboard" : undefined}
    />
  );
}
