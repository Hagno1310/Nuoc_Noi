import { TRANSFER_PHOTO_PATTERN } from "@/lib/cloudinary";

export class UploadError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FAILED") {
    super(code);
    this.name = "UploadError";
  }
}

type Signed = { cloudName: string; apiKey: string; publicId: string; timestamp: number; signature: string };

async function attempt<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    throw e instanceof UploadError ? e : new UploadError("FAILED");
  }
}

// SRS v3.3 FR-04c: xin chữ ký ở server rồi upload thẳng lên Cloudinary; trả public_id để gửi kèm đơn
export async function uploadTransferPhoto(file: Blob, fetchFn: typeof fetch = fetch): Promise<string> {
  const signed = await attempt(async () => {
    const res = await fetchFn("/api/transfer-photo/sign", { method: "POST" });
    if (res.status === 401) throw new UploadError("UNAUTHORIZED");
    if (!res.ok) throw new UploadError("FAILED");
    return (await res.json()) as Signed;
  });
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", signed.apiKey);
  form.append("timestamp", String(signed.timestamp));
  form.append("public_id", signed.publicId);
  form.append("signature", signed.signature);
  return attempt(async () => {
    const res = await fetchFn(`https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`, {
      method: "POST",
      body: form,
    });
    const body = res.ok ? ((await res.json()) as { public_id?: string }) : null;
    // Chỉ nhận đúng ảnh đã ký; id lạ không bao giờ đi vào đơn (DB cũng kiểm tra mẫu)
    if (body?.public_id !== signed.publicId || !TRANSFER_PHOTO_PATTERN.test(signed.publicId)) {
      throw new UploadError("FAILED");
    }
    return signed.publicId;
  });
}

// Thu nhỏ còn cạnh dài 1600px, JPEG 0,8 (spec §3.4): ảnh 12MP còn vài trăm KB.
// createImageBitmap tự xoay theo EXIF. Trình duyệt không hỗ trợ hoặc lỗi thì gửi ảnh gốc.
export async function shrinkImage(file: Blob, maxSide = 1600): Promise<Blob> {
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")?.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    return blob ?? file;
  } catch {
    return file;
  }
}
