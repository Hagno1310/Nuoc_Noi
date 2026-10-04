import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BusinessHoursForm } from "@/components/admin/BusinessHoursForm";

const db = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ getBrowserSupabase: () => ({ rpc: db.rpc }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

beforeEach(() => db.rpc.mockReset().mockResolvedValue({ error: null }));

describe("BusinessHoursForm", () => {
  it("một nút Lưu cho cả hai giờ, chỉ gửi giờ đã đổi", async () => {
    const user = userEvent.setup();
    render(<BusinessHoursForm start={20} end={2} />);
    const save = screen.getByRole("button", { name: "Lưu giờ" });
    expect(save).toBeDisabled();
    await user.selectOptions(screen.getByLabelText("Giờ đóng cửa"), "3");
    await user.click(save);
    expect(db.rpc).toHaveBeenCalledTimes(1);
    expect(db.rpc).toHaveBeenCalledWith("update_business_day_end_hour", { p_hour: 3 });
    expect(await screen.findByRole("status")).toHaveTextContent("Đã lưu giờ.");
  });

  it("giờ trùng nhau thì báo lỗi, không gửi", async () => {
    const user = userEvent.setup();
    render(<BusinessHoursForm start={20} end={2} />);
    await user.selectOptions(screen.getByLabelText("Giờ mở cửa"), "2");
    await user.click(screen.getByRole("button", { name: "Lưu giờ" }));
    expect(db.rpc).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("Giờ mở cửa không được trùng giờ đóng cửa.");
  });

  it("giữ câu nhắc của SRS FR-05b", () => {
    render(<BusinessHoursForm start={20} end={2} />);
    expect(screen.getByText("Nên đổi khi quán đã đóng cửa.")).toBeInTheDocument();
  });
});
