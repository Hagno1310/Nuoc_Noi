import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionTitle } from "@/components/admin/SectionTitle";

describe("SectionTitle", () => {
  it("là tiêu đề cấp 2, chữ biển trên một đường kẻ 1px, không có vệt sáng", () => {
    const { container } = render(<SectionTitle>Chỗ ngồi</SectionTitle>);
    const h2 = screen.getByRole("heading", { level: 2, name: "Chỗ ngồi" });
    expect(h2.className).toContain("font-display");
    expect(h2.parentElement?.className).toContain("border-b");
    expect(h2.parentElement?.className).toContain("border-line");
    expect(h2.className).toContain("text-xl");
    expect(container.querySelector(".streak")).toBeNull();
  });
});
