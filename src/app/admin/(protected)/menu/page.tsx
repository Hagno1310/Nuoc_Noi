import { MenuManager, type OwnerMenuItem } from "@/components/admin/MenuManager";
import { changerLabel } from "@/lib/admin/menu";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";

type PriceRow = {
  id: number;
  price: number;
  effective_from: string;
  changed_by: string | null;
  menu_items: { name: string } | { name: string }[] | null;
};

// SRS FR-05, FR-05a: thực đơn và 20 lần đổi giá gần nhất
export default async function MenuPage() {
  const supabase = await createServerSupabase();
  const [
    { data: items, error },
    { data: history },
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
      <h1 className="font-display text-3xl tracking-wide">Thực đơn</h1>
      {/* Laptop: danh sách món bên trái, lịch sử đổi giá bên phải. Điện thoại: lịch sử xuống cuối */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start lg:gap-16">
        <section className="space-y-4">
          <SectionTitle>Món đang bán</SectionTitle>
          <MenuManager items={items as OwnerMenuItem[]} />
        </section>
        <section className="space-y-4">
          <SectionTitle>Lịch sử đổi giá</SectionTitle>
          <ul className="divide-y divide-line text-sm tabular-nums">
            {((history ?? []) as PriceRow[]).map((h) => {
              const item = Array.isArray(h.menu_items) ? h.menu_items[0] : h.menu_items;
              return (
                <li key={h.id} className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-2">
                  <span className="font-medium">{item?.name ?? "—"}</span>
                  <span className="font-semibold">{formatVnd(h.price)}</span>
                  <span className="text-ink-muted">{formatVnDateTime(h.effective_from)}</span>
                  <span className="truncate text-right text-ink-muted">
                    {changerLabel(h.changed_by, user ? { id: user.id, email: user.email } : null)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

// Tiêu đề mục: chữ poster + vệt sáng, thay cho khung viền (DESIGN.md)
function SectionTitle({ children }: { children: string }) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl tracking-wide">
      {children}
      <span aria-hidden="true" className="streak flex-1 opacity-40" />
    </h2>
  );
}
