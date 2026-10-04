import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PeriodComparison } from "@/components/admin/PeriodComparison";

const zero = { revenue: 0, item_count: 0, order_count: 0, discount_total: 0 };

describe("PeriodComparison", () => {
  it("đếm bằng Số món, không còn Số cốc", () => {
    render(
      <PeriodComparison
        periods={[
          {
            title: "Ngày kinh doanh 05/10/2026",
            current: { revenue: 570000, item_count: 3, order_count: 1, discount_total: 0 },
            previous: { revenue: 380000, item_count: 2, order_count: 1, discount_total: 0 },
          },
        ]}
      />,
    );
    expect(screen.getByText("Số món")).toBeInTheDocument();
    expect(screen.queryByText(/cốc/)).toBeNull();
    // Doanh thu và số món đều tăng 50%
    expect(screen.getAllByText("+50%")).toHaveLength(2);
  });

  it("kỳ trước bằng 0 thì chỉ ghi số kỳ trước, không ra NaN", () => {
    render(
      <PeriodComparison
        periods={[{ title: "Tuần này", current: { ...zero, item_count: 4 }, previous: zero }]}
      />,
    );
    expect(screen.getAllByText("Kỳ trước: 0").length).toBeGreaterThan(0);
    expect(screen.queryByText(/NaN/)).toBeNull();
  });

  it("không còn hiệu ứng ảnh hiện dần hay vệt sáng", () => {
    const { container } = render(
      <PeriodComparison periods={[{ title: "Tuần này", current: zero, previous: zero }]} />,
    );
    expect(container.querySelector(".develop, .streak")).toBeNull();
  });
});
