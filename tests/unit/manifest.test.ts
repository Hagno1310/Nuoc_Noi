import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";

describe("manifest", () => {
  it("mở thẳng màn hình order, chạy dạng standalone, có icon 192 và 512", () => {
    const m = manifest();
    expect(m.name).toBe("Nước Nôi");
    expect(m.start_url).toBe("/order");
    expect(m.display).toBe("standalone");
    expect(m.lang).toBe("vi");
    const sizes = (m.icons ?? []).map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });
});
