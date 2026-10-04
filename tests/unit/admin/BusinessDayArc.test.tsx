import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BusinessDayArc } from "@/components/admin/BusinessDayArc";

describe("BusinessDayArc", () => {
  it("in phẳng: nét mực cam trên rãnh 1px, không quầng sáng, không gradient", () => {
    const { container } = render(
      <BusinessDayArc fraction={0.5} closed={false} startLabel="20:00" endLabel="02:00" nowLabel="23:00">
        <p>Doanh thu</p>
      </BusinessDayArc>,
    );
    expect(container.querySelector("filter")).toBeNull();
    expect(container.querySelector("linearGradient")).toBeNull();
    const strokes = [...container.querySelectorAll("path")].map((p) => p.getAttribute("stroke"));
    expect(strokes).toContain("var(--line)");
    expect(strokes).toContain("var(--ember)");
  });

  it("ngoài giờ mở cửa thì ghi Đã đóng cửa và không có đốm giờ hiện tại", () => {
    const { container, getByText } = render(
      <BusinessDayArc fraction={1} closed startLabel="20:00" endLabel="02:00" nowLabel="03:00">
        <p>Doanh thu</p>
      </BusinessDayArc>,
    );
    expect(getByText("Đã đóng cửa")).toBeInTheDocument();
    expect(container.querySelector("circle")).toBeNull();
  });
});
