// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: async () => ({ from }) }));

import { GET } from "@/app/api/heartbeat/route";

const call = (auth?: string) =>
  GET(new Request("http://x/api/heartbeat", { headers: auth ? { authorization: auth } : {} }));
const query = (result: { error: unknown }) =>
  from.mockReturnValue({ select: () => ({ limit: async () => result }) });

beforeEach(() => {
  process.env.CRON_SECRET = "cron-secret-123";
  from.mockReset();
});

describe("GET /api/heartbeat", () => {
  it("thiếu hoặc sai secret → 401, không truy vấn database", async () => {
    expect((await call()).status).toBe(401);
    expect((await call("Bearer sai")).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it("chưa đặt CRON_SECRET → 401 kể cả khi gửi 'Bearer undefined'", async () => {
    delete process.env.CRON_SECRET;
    expect((await call("Bearer undefined")).status).toBe(401);
  });

  it("đúng secret → đọc settings, 200", async () => {
    query({ error: null });
    const res = await call("Bearer cron-secret-123");
    expect(res.status).toBe(200);
    expect(from).toHaveBeenCalledWith("settings");
  });

  it("database lỗi → 503", async () => {
    query({ error: { message: "paused" } });
    expect((await call("Bearer cron-secret-123")).status).toBe(503);
  });
});
