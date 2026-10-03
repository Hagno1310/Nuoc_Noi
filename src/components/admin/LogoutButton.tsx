"use client";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="min-h-12 rounded-lg px-3 text-ink-muted hover:underline lg:self-start"
      onClick={async () => {
        await getBrowserSupabase().auth.signOut({ scope: "local" });
        router.replace("/admin/login");
        router.refresh();
      }}
    >
      Đăng xuất
    </button>
  );
}
