import { NextResponse } from "next/server";
import { newTransferPhotoId, signParams } from "@/lib/cloudinarySign";
import { createServerSupabase } from "@/lib/supabase/server";

// SRS v3.3 NFR-04: file duy nhất đọc CLOUDINARY_API_KEY/SECRET. Chỉ ký cho nhân viên hoặc chủ quán
// đang đăng nhập; is_staff() còn xác nhận phiên chưa bị thu hồi (SRS §2.2).
export async function POST() {
  const supabase = await createServerSupabase();
  const { data: allowed, error } = await supabase.rpc("is_staff");
  if (error) return NextResponse.json({ error: "UNAVAILABLE" }, { status: 503 });
  if (allowed !== true) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) return NextResponse.json({ error: "NOT_CONFIGURED" }, { status: 500 });

  const publicId = newTransferPhotoId();
  const timestamp = Math.floor(Date.now() / 1000);
  return NextResponse.json({
    cloudName,
    apiKey,
    publicId,
    timestamp,
    overwrite: "false",
    signature: signParams({ public_id: publicId, timestamp, overwrite: "false" }, secret),
  });
}
