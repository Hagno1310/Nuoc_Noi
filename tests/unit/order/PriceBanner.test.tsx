import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { PriceBanner } from "@/components/order/PriceBanner";

describe("PriceBanner", () => {
  afterEach(() => vi.useRealTimers());

  it("hiển thị đơn giá theo định dạng VND", () => {
    render(<PriceBanner price={25000} offline={false} />);
    expect(screen.getByText("Đơn giá: 25.000đ/cốc")).toBeInTheDocument();
  });

  it("làm nổi bật 3 giây khi giá thay đổi", () => {
    vi.useFakeTimers();
    const { rerender } = render(<PriceBanner price={25000} offline={false} />);
    const banner = screen.getByTestId("price-banner");
    expect(banner).toHaveAttribute("data-highlight", "false");
    rerender(<PriceBanner price={30000} offline={false} />);
    expect(screen.getByText("Đơn giá: 30.000đ/cốc")).toBeInTheDocument();
    expect(banner).toHaveAttribute("data-highlight", "true");
    act(() => vi.advanceTimersByTime(3000));
    expect(banner).toHaveAttribute("data-highlight", "false");
  });

  it("không làm nổi bật ở lần tải giá đầu tiên", () => {
    const { rerender } = render(<PriceBanner price={null} offline={false} />);
    expect(screen.getByText("Đang tải giá…")).toBeInTheDocument();
    rerender(<PriceBanner price={25000} offline={false} />);
    expect(screen.getByTestId("price-banner")).toHaveAttribute(
      "data-highlight",
      "false",
    );
  });

  it("hiện nhãn Mất mạng", () => {
    render(<PriceBanner price={25000} offline />);
    expect(screen.getByText("Mất mạng")).toBeInTheDocument();
  });
});
