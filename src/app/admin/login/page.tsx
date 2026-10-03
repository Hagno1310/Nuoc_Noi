"use client";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function OwnerLoginPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-sm p-6">
      <LoginForm
        onLogin={async (email, password) => {
          const { error } = await getBrowserSupabase().auth.signInWithPassword({
            email,
            password,
          });
          if (!error) {
            router.replace("/admin/dashboard");
            router.refresh();
            return null;
          }
          if (error.status === 429)
            return "Nhập sai quá nhiều lần, thử lại sau ít phút.";
          if (error.status === 400) return "Sai email hoặc mật khẩu.";
          return "Không kết nối được. Kiểm tra mạng rồi thử lại.";
        }}
      />
    </main>
  );
}
