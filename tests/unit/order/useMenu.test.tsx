import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useMenu } from "@/hooks/useMenu";

const sb = vi.hoisted(() => ({
  result: { data: [{ id: "m1", name: "Classic", price: 190000, sort_order: 1, is_archived: false }], error: null } as {
    data: unknown;
    error: unknown;
  },
  onChange: null as null | (() => void),
  removeChannel: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({
  getBrowserSupabase: () => ({
    from: () => ({ select: () => ({ order: () => ({ order: () => Promise.resolve(sb.result) }) }) }),
    channel: () => {
      const ch = {
        on: (_e: string, _f: unknown, cb: () => void) => {
          sb.onChange = cb;
          return ch;
        },
        subscribe: () => ch,
      };
      return ch;
    },
    removeChannel: sb.removeChannel,
  }),
}));

describe("useMenu", () => {
  it("đọc thực đơn, đọc lại khi có thay đổi realtime, gỡ kênh khi rời trang", async () => {
    const { result, unmount } = renderHook(() => useMenu());
    await waitFor(() => expect(result.current.menu?.[0].price).toBe(190000));
    sb.result = { data: [{ id: "m1", name: "Classic", price: 200000, sort_order: 1, is_archived: false }], error: null };
    await act(async () => sb.onChange?.());
    await waitFor(() => expect(result.current.menu?.[0].price).toBe(200000));
    unmount();
    expect(sb.removeChannel).toHaveBeenCalled();
  });

  it("không đọc được thì báo failed", async () => {
    sb.result = { data: null, error: { message: "x" } };
    const { result } = renderHook(() => useMenu());
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.menu).toBeNull();
  });
});
