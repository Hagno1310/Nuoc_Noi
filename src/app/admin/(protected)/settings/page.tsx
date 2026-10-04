import { BusinessHourForm } from "@/components/admin/BusinessHourForm";
import { SeatsManager, type OwnerSeat } from "@/components/admin/SeatsManager";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";
import { PinSection, PriceSection } from "./SettingsForms";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const [
    { data: settings, error },
    { data: history },
    { data: seats },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase
      .from("settings")
      .select("current_price, business_day_start_hour, business_day_end_hour")
      .eq("id", 1)
      .single(),
    supabase
      .from("price_history")
      .select("id, price, effective_from, changed_by")
      .order("effective_from", { ascending: false })
      .limit(20),
    supabase
      .from("seats")
      .select("id, name, kind, sort_order, is_archived")
      .order("kind")
      .order("sort_order")
      .order("name"),
    supabase.auth.getUser(),
  ]);

  if (error || !settings) {
    return (
      <p role="alert">
        Không tải được cài đặt. Kiểm tra mạng rồi tải lại trang.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl tracking-wide">Cài đặt</h1>
      {/* Laptop: cài đặt ngắn bên trái, danh sách chỗ ngồi (dài) bên phải. Điện thoại: chỗ ngồi xuống cuối */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-16">
        <div className="space-y-12">
          <section className="space-y-4">
            <SectionTitle>Đơn giá chung</SectionTitle>
            <PriceSection currentPrice={settings.current_price} />
            <div className="space-y-2 pt-2">
              <h3 className="text-sm font-medium text-ink-muted">
                Lịch sử đổi giá
              </h3>
              <ul className="divide-y divide-line text-sm tabular-nums">
                {(history ?? []).map((h) => (
                  <li
                    key={h.id}
                    className="grid grid-cols-[auto_1fr_auto] items-baseline gap-3 py-1.5"
                  >
                    <span className="text-ink-muted">
                      {formatVnDateTime(h.effective_from)}
                    </span>
                    <span className="truncate text-ink-muted">
                      {h.changed_by === null
                        ? "Khởi tạo"
                        : h.changed_by === user?.id && user
                          ? user.email
                          : "Chủ quán khác"}
                    </span>
                    <span className="font-semibold">{formatVnd(h.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Giờ mở cửa và giờ đóng cửa</SectionTitle>
            <div className="grid gap-6 sm:grid-cols-2">
              <BusinessHourForm
                label="Giờ mở cửa"
                rpc="update_business_day_start_hour"
                currentHour={settings.business_day_start_hour}
                note="Chỉ áp dụng cho đơn mới. Nên đổi khi quán đã đóng cửa."
              />
              <BusinessHourForm
                label="Giờ đóng cửa"
                rpc="update_business_day_end_hour"
                currentHour={settings.business_day_end_hour}
                note="Chỉ dùng để vẽ đồng hồ giờ mở cửa ở Tổng quan; không đổi ngày kinh doanh của đơn."
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>PIN quán</SectionTitle>
            <PinSection />
          </section>
        </div>

        <section className="space-y-4">
          <SectionTitle>Chỗ ngồi</SectionTitle>
          <SeatsManager seats={(seats ?? []) as OwnerSeat[]} />
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
