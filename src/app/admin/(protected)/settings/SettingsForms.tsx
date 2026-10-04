"use client";
import { PinForm } from "@/components/admin/PinForm";
import { ownerErrorText } from "@/lib/admin/errors";
import { getBrowserSupabase } from "@/lib/supabase/client";

// onSave là hàm, không truyền được từ server component, nên phần ghi nằm ở wrapper client này
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
