import Image from "next/image";
import type { ReactNode } from "react";
import { OwnerNav } from "@/components/admin/OwnerNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { NewOrderNotice } from "@/components/admin/NewOrderNotice";
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
    <div className="min-h-dvh pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Máy tính: thanh bên cố định 248px (DESIGN.md). Điện thoại: chỉ thanh điều hướng dưới; Đăng xuất nằm trong Cài đặt (R49) */}
      <aside className="lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-62 lg:flex-col lg:gap-6 lg:border-r lg:border-line lg:bg-[#0d0f0c] lg:px-4 lg:py-7">
        <Image
          src="/brand/nuoc-noi-wordmark-small.png"
          alt="Nước Nôi"
          width={330}
          height={90}
          className="hidden h-8.5 w-auto self-start lg:block"
        />
        <OwnerNav />
        <div className="mt-auto hidden lg:block">
          <LogoutButton />
        </div>
      </aside>
      <NewOrderNotice />
      <main className="px-4 pt-4 pb-6 lg:ml-62 lg:px-10 lg:py-9">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
