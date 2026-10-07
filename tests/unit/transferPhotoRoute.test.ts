// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: async () => ({ rpc }) }));

import { POST } from "@/app/api/transfer-photo/sign/route";
import { signParams } from "@/lib/cloudinarySign";

beforeEach(() => {
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
  process.env.CLOUDINARY_API_KEY = "key123";
  process.env.CLOUDINARY_API_SECRET = "secret456";
  rpc.mockReset();
});

describe("POST /api/transfer-photo/sign", () => {
  it("không phải nhân viên/chủ quán đang đăng nhập → 401", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    expect((await POST()).status).toBe(401);
    rpc.mockResolvedValue({ data: null, error: { message: "JWT expired" } });
    expect((await POST()).status).toBe(401);
  });

  it("ký public_id do server sinh, không trả secret", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const res = await POST();
    const body = await res.json();
    expect(rpc).toHaveBeenCalledWith("is_staff");
    expect(body.publicId).toMatch(/^nuoc-noi\/transfer\/[0-9a-f-]{36}$/);
    expect(body).toMatchObject({ cloudName: "demo", apiKey: "key123" });
    expect(body.signature).toBe(signParams({ public_id: body.publicId, timestamp: body.timestamp }, "secret456"));
    expect(JSON.stringify(body)).not.toContain("secret456");
  });

  it("thiếu cấu hình Cloudinary → 500", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    delete process.env.CLOUDINARY_API_SECRET;
    expect((await POST()).status).toBe(500);
  });
});
