import Image from "next/image";
import type { ReactNode } from "react";
import { OwnerNav } from "@/components/admin/OwnerNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function OwnerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: isOwner, error } = await supabase.rpc("is_owner");
  if (error || !isOwner) {
    return (
      <main className="mx-auto max-w-md space-y-4 p-6">
        <p role="alert">
          {error
            ? "Không kiểm tra được quyền truy cập. Tải lại trang."
            : "Tài khoản này không phải tài khoản chủ quán."}
        </p>
        <LogoutButton />
      </main>
    );
  }
  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col pb-16 lg:flex-row lg:gap-6 lg:p-4 lg:pb-4">
      <header className="flex items-center justify-between p-4 lg:w-56 lg:flex-col lg:items-stretch lg:justify-start lg:gap-4 lg:p-0">
        <Image
          src="/brand/nuoc-noi-wordmark-small.png"
          alt="Nước Nôi"
          width={110}
          height={30}
        />
        <div className="contents lg:flex lg:flex-1 lg:flex-col lg:justify-between">
          <OwnerNav />
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-4 lg:p-0">{children}</main>
    </div>
  );
}
