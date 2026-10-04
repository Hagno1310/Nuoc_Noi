"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { PinLogin } from "@/components/order/PinLogin";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function StaffLoginPage() {
  const router = useRouter();
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-10 px-6 py-8">
      <Image
        src="/brand/nuoc-noi-wordmark.png"
        alt="Nước Nôi"
        width={160}
        height={148}
        priority
        className="mx-auto"
      />
      <PinLogin
        onLogin={async (pin) => {
          const { error } = await getBrowserSupabase().auth.signInWithPassword({
            email: process.env.NEXT_PUBLIC_STAFF_EMAIL!,
            password: pin,
          });
          if (!error) {
            router.replace("/order");
            router.refresh();
            return null;
          }
          if (error.status === 429)
            return "Nhập sai quá nhiều lần, thử lại sau ít phút.";
          if (error.status === 400) return "Sai mã PIN.";
          return "Không kết nối được. Kiểm tra mạng rồi thử lại.";
        }}
      />
    </main>
  );
}
