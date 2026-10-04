import { BusinessHourForm } from "@/components/admin/BusinessHourForm";
import { SectionTitle } from "@/components/admin/SectionTitle";
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
      <h1 className="font-display text-3xl">Cài đặt</h1>
      {/* Laptop: cài đặt ngắn bên trái, danh sách chỗ ngồi (dài) bên phải. Điện thoại: chỗ ngồi xuống cuối.
          Giá món nằm ở trang Thực đơn (SRS v3.0 FR-05). */}
      <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-16">
        <div className="space-y-12">
          <section className="space-y-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <BusinessHourForm
                label="Giờ mở cửa"
                rpc="update_business_day_start_hour"
                currentHour={settings.business_day_start_hour}
                note="Nên đổi khi quán đã đóng cửa."
              />
              <BusinessHourForm
                label="Giờ đóng cửa"
                rpc="update_business_day_end_hour"
                currentHour={settings.business_day_end_hour}
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>PIN quán</SectionTitle>
            <PinSection />
          </section>
        </div>

        <section className="space-y-4">
          <SeatsManager seats={(seats ?? []) as OwnerSeat[]} />
        </section>
      </div>
    </div>
  );
}
