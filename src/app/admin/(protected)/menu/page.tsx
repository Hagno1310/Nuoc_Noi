import { MenuManager, type OwnerMenuItem } from "@/components/admin/MenuManager";
import { SectionTitle } from "@/components/admin/SectionTitle";
import { PriceHistory, type PriceRow } from "@/components/admin/PriceHistory";
import { createServerSupabase } from "@/lib/supabase/server";

// SRS FR-05, FR-05a: thực đơn và 20 lần đổi giá gần nhất
export default async function MenuPage() {
  const supabase = await createServerSupabase();
  const [
    { data: items, error },
    { data: history, error: historyError },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, name, price, sort_order, is_archived")
      .order("sort_order")
      .order("name"),
    supabase
      .from("menu_price_history")
      .select("id, price, effective_from, changed_by, menu_items(name)")
      .order("effective_from", { ascending: false })
      .order("id", { ascending: false })
      .limit(20),
    supabase.auth.getUser(),
  ]);

  if (error || !items) {
    return (
      <p role="alert">Không tải được thực đơn. Kiểm tra mạng rồi tải lại trang.</p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Thực đơn</h1>
      {/* Laptop: danh sách món bên trái, lịch sử đổi giá bên phải. Điện thoại: lịch sử xuống cuối */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-16">
        <section className="space-y-4">
          <SectionTitle>Món đang bán</SectionTitle>
          <MenuManager items={items as OwnerMenuItem[]} />
        </section>
        <section className="space-y-4">
          <SectionTitle>Lịch sử đổi giá</SectionTitle>
          <PriceHistory
            rows={(history ?? []) as PriceRow[]}
            failed={historyError !== null}
            user={user ? { id: user.id, email: user.email } : null}
          />
        </section>
      </div>
    </div>
  );
}
