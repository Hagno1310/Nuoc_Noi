"use client";
import { useRouter } from "next/navigation";
import { PinForm } from "@/components/admin/PinForm";
import { PriceForm } from "@/components/admin/PriceForm";
import { ownerErrorText } from "@/lib/admin/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";

// onSave là hàm, không truyền được từ server component, nên phần ghi nằm ở wrapper client này
export function PriceSection({ currentPrice }: { currentPrice: number }) {
  const router = useRouter();
  return (
    <PriceForm
      currentPrice={currentPrice}
      onSave={async (price) => {
        const { error } = await getBrowserSupabase().rpc("update_price", {
          p_price: price,
        });
        router.refresh();
        return error ? ownerErrorText(error) : null;
      }}
    />
  );
}

export function PinSection() {
  return (
    <PinForm
      onSave={async (pin) => {
        const { error } = await getBrowserSupabase().rpc("set_shop_pin", {
          p_pin: pin,
        });
        return error ? ownerErrorText(error) : null;
      }}
    />
  );
}
