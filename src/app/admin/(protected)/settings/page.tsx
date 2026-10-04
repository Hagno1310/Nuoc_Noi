import { BusinessHourForm } from "@/components/admin/BusinessHourForm";
import { SeatsManager, type OwnerSeat } from "@/components/admin/SeatsManager";
import { formatVnd } from "@/lib/money";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatVnDateTime } from "@/lib/time";
import { PinSection, PriceSection } from "./SettingsForms";

const section = "space-y-3 rounded-xl border border-line p-4";

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
    <div className="space-y-6">
      <h1 className="font-display text-3xl tracking-wide">Cài đặt</h1>

      <section className={section}>
        <h2 className="text-lg font-bold">Đơn giá chung</h2>
        <PriceSection currentPrice={settings.current_price} />
        <h3 className="pt-2 font-semibold">Lịch sử đổi giá</h3>
        <ul className="text-sm tabular-nums">
          {(history ?? []).map((h) => (
            <li key={h.id}>
              {formatVnDateTime(h.effective_from)}:{" "}
              <strong>{formatVnd(h.price)}</strong>
              {" · "}
              {h.changed_by === null
                ? "Khởi tạo"
                : h.changed_by === user?.id && user
                  ? user.email
                  : "Chủ quán khác"}
            </li>
          ))}
        </ul>
      </section>

      <section className={section}>
        <h2 className="text-lg font-bold">Giờ mở cửa và giờ đóng cửa</h2>
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
      </section>

      <section className={section}>
        <h2 className="text-lg font-bold">Chỗ ngồi</h2>
        <SeatsManager seats={(seats ?? []) as OwnerSeat[]} />
      </section>

      <section className={section}>
        <h2 className="text-lg font-bold">PIN quán</h2>
        <PinSection />
      </section>
    </div>
  );
}
