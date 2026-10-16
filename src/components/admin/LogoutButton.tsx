"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

// Nút viền trung tính, không phải hành động chính hay phá hủy
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-medium text-muted ring-[1.5px] ring-line hover:text-ink disabled:opacity-50"
      onClick={async () => {
        setBusy(true);
        await getBrowserSupabase().auth.signOut({ scope: "local" });
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      <LogOut aria-hidden="true" size={16} />
      {busy ? "Đang đăng xuất…" : "Đăng xuất"}
    </button>
  );
}
