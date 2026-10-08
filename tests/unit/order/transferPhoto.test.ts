import { describe, expect, it, vi } from "vitest";
import { shrinkImage, uploadTransferPhoto, UploadError } from "@/lib/order/transferPhoto";

const ID = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";
const signed = { cloudName: "demo", apiKey: "k", publicId: ID, timestamp: 1, signature: "s" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const file = new Blob(["x"], { type: "image/jpeg" });

describe("uploadTransferPhoto", () => {
  it("xin chữ ký rồi upload thẳng lên Cloudinary, trả public_id", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(json(signed))
      .mockResolvedValueOnce(json({ public_id: ID }));
    await expect(uploadTransferPhoto(file, fetchFn)).resolves.toBe(ID);
    expect(fetchFn.mock.calls[0]).toEqual(["/api/transfer-photo/sign", { method: "POST" }]);
    const [url, init] = fetchFn.mock.calls[1];
    expect(url).toBe("https://api.cloudinary.com/v1_1/demo/image/upload");
    const form = init.body as FormData;
    expect([form.get("api_key"), form.get("timestamp"), form.get("public_id"), form.get("signature"), form.get("overwrite")]).toEqual(["k", "1", ID, "s", "false"]);
  });

  it("route ký trả 401 → UNAUTHORIZED", async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(json({ error: "FORBIDDEN" }, 401));
    await expect(uploadTransferPhoto(file, fetchFn)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("mất mạng → FAILED", async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await expect(uploadTransferPhoto(file, fetchFn)).rejects.toBeInstanceOf(UploadError);
  });

  it("Cloudinary trả public_id khác cái đã ký hoặc trang lỗi → FAILED (Review Focus 4)", async () => {
    const other = vi.fn().mockResolvedValueOnce(json(signed)).mockResolvedValueOnce(json({ public_id: "khac" }));
    await expect(uploadTransferPhoto(file, other)).rejects.toMatchObject({ code: "FAILED" });
    const html = vi.fn().mockResolvedValueOnce(json(signed)).mockResolvedValueOnce(new Response("<html>", { status: 200 }));
    await expect(uploadTransferPhoto(file, html)).rejects.toMatchObject({ code: "FAILED" });
    const bad = vi.fn().mockResolvedValueOnce(json(signed)).mockResolvedValueOnce(json({ error: {} }, 400));
    await expect(uploadTransferPhoto(file, bad)).rejects.toMatchObject({ code: "FAILED" });
  });
});

describe("shrinkImage", () => {
  it("trình duyệt không có createImageBitmap thì trả ảnh gốc", async () => {
    await expect(shrinkImage(file)).resolves.toBe(file);
  });
});
