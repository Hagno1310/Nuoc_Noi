"use client";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

// Nút có viền + icon để không lẫn với các mục điều hướng; màu trung tính (không phải hành động chính hay phá hủy)
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-edge px-4 text-sm font-medium transition-colors duration-150 hover:border-ink hover:bg-raised active:bg-ink active:text-bg disabled:opacity-50 lg:self-start"
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
