import { BusinessHoursForm } from "@/components/admin/BusinessHoursForm";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { PageTitle, SectionTitle } from "@/components/admin/SectionTitle";
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
    <div>
      <PageTitle title="Cài đặt" sub="Quán" />
      {/* Laptop: cài đặt ngắn bên trái, danh sách chỗ ngồi (dài) bên phải. Điện thoại: chỗ ngồi xuống cuối.
          Giá món nằm ở trang Thực đơn (SRS v3.0 FR-05). */}
      <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
        <div className="space-y-4 lg:space-y-5">
          <section className="rounded-3xl bg-surface p-5 lg:p-6">
            <SectionTitle>Giờ mở cửa</SectionTitle>
            <BusinessHoursForm
              start={settings.business_day_start_hour}
              end={settings.business_day_end_hour}
            />
          </section>

          <section className="rounded-3xl bg-surface p-5 lg:p-6">
            <SectionTitle>PIN quán</SectionTitle>
            <PinSection />
          </section>
        </div>

        <section className="rounded-3xl bg-surface p-5 lg:p-6">
          <SeatsManager seats={(seats ?? []) as OwnerSeat[]} />
        </section>
      </div>
      {/* Đăng xuất chủ quán trên điện thoại nằm ở đây; máy tính có nút ở thanh bên (R49) */}
      <div className="mt-4 lg:hidden">
        <LogoutButton />
      </div>
    </div>
  );
}
