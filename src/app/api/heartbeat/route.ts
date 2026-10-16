import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// SRS v3.9 R52: Vercel Cron gọi mỗi ngày để Supabase gói miễn phí không tạm dừng database.
// File duy nhất đọc CRON_SECRET (NFR-04); Vercel tự gửi header Authorization: Bearer <CRON_SECRET>.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const supabase = await createServerSupabase();
  const { error } = await supabase.from("settings").select("*").limit(1);
  if (error) return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  return NextResponse.json({ ok: true });
}
