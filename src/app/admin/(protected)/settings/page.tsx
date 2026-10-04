import { BusinessHourForm } from "@/components/admin/BusinessHourForm";
import { SeatsManager, type OwnerSeat } from "@/components/admin/SeatsManager";
import { createServerSupabase } from "@/lib/supabase/server";
import { PinSection } from "./SettingsForms";

export default async function SettingsPage() {
  const supabase = await createServerSupabase();
  const [{ data: settings, error }, { data: seats }] = await Promise.all([
    supabase
      .from("settings")
      .select("business_day_start_hour, business_day_end_hour")
      .eq("id", 1)
      .single(),
    supabase
      .from("seats")
      .select("id, name, kind, sort_order, is_archived")
      .order("kind")
      .order("sort_order")
      .order("name"),
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
      {/* Laptop: cài đặt ngắn bên trái, danh sách chỗ ngồi (dài) bên phải. Điện thoại: chỗ ngồi xuống cuối.
          Giá món nằm ở trang Thực đơn (SRS v3.0 FR-05). */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-16">
        <div className="space-y-12">
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
