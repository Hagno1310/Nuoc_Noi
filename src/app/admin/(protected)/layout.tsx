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
    <div className="min-h-dvh pb-[calc(49px+env(safe-area-inset-bottom))] lg:pb-0">
      {/* Laptop/PC: sidebar cố định bên trái, chỉ phần nội dung cuộn. Điện thoại: dải trên + thanh điều hướng dưới */}
      <aside className="flex items-center justify-between p-4 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:w-64 lg:flex-col lg:items-stretch lg:justify-start lg:gap-8 lg:bg-surface lg:px-5 lg:py-8">
        <div className="lg:space-y-2 lg:px-3">
          <Image
            src="/brand/nuoc-noi-wordmark.png"
            alt="Nước Nôi"
            width={97}
            height={90}
            className="halo h-10 w-auto lg:h-20"
          />
          <p className="hidden text-xs tracking-wide text-ink-muted lg:block">
            Trang chủ quán
          </p>
        </div>
        <OwnerNav />
        <LogoutButton />
        {/* Mép sidebar là một vệt sáng dọc, motif của thế giới Phơi sáng dài */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-px bg-gradient-to-b from-transparent via-ember/50 to-transparent lg:block"
        />
      </aside>
      <NewOrderNotice />
      <main className="px-4 pb-4 lg:ml-64 lg:px-10 lg:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
