import { beforeAll, describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { RevenueBars } from "@/components/admin/RevenueBars";

// jsdom không có ResizeObserver; giả lập bề rộng 400px để biểu đồ vẽ ra
beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(private cb: ResizeObserverCallback) {}
    observe() {
      this.cb([{ contentRect: { width: 400 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

describe("RevenueBars", () => {
  it("kỳ này tô mực cam, kỳ trước chỉ viền (cùng độ sáng nên không phân biệt chỉ bằng màu)", () => {
    const { container } = render(
      <RevenueBars
        title="Doanh thu tuần"
        currentLabel="Tuần này"
        previousLabel="Tuần trước"
        points={[{ label: "T2", revenue: 300000, previous_revenue: 200000 }]}
        ticks={[0]}
      />,
    );
    const paths = [...container.querySelectorAll("path")];
    const current = paths.find((p) => p.getAttribute("fill") === "var(--chart-current)");
    const previous = paths.find((p) => p.getAttribute("stroke") === "var(--chart-previous)");
    expect(current).toBeTruthy();
    expect(previous?.getAttribute("fill")).toBe("none");
    expect(container.querySelector(".bar-rise")).toBeNull();
  });
});
