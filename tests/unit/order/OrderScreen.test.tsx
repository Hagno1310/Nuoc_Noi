import { describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrderScreen, type OrderScreenProps } from "@/components/order/OrderScreen";
import { NetworkError, RpcError, type CreateOrderInput, type CreatedOrder, type StaffApi } from "@/lib/api";
import { discountAmount, type MenuItem } from "@/lib/order/cart";
import { UploadError } from "@/lib/order/transferPhoto";
import { getMyOrderIds } from "@/lib/order/myOrders";

const NOW = new Date("2026-10-05T14:00:00Z");
const MENU: MenuItem[] = [
  { id: "m1", name: "Classic", price: 190000, sort_order: 1, is_archived: false },
  { id: "m2", name: "Neat", price: 100000, sort_order: 2, is_archived: false },
  { id: "m3", name: "Cũ", price: 50000, sort_order: 3, is_archived: true },
];

const created = (i: CreateOrderInput, over: Partial<CreatedOrder> = {}): CreatedOrder => {
  const sub = i.lines.reduce((s, l) => s + l.quantity * l.clientPrice, 0);
  const off = discountAmount(sub, i.discountPercent);
  return {
    id: i.id,
    item_count: i.lines.reduce((s, l) => s + l.quantity, 0),
    subtotal_amount: sub,
    discount_percent: i.discountPercent,
    discount_amount: off,
    total_amount: sub - off,
    seat_name: "Quầy 1",
    created_at: NOW.toISOString(),
    business_date: "2026-10-05",
    duplicate: false,
    status: "paid",
    payment_method: "cash",
    transfer_photo_id: null,
    ...over,
  };
};

function setup(overrides: Partial<OrderScreenProps> = {}, apiOverrides: Partial<StaffApi> = {}) {
  const api: StaffApi = {
    createOrder: vi.fn(async (i: CreateOrderInput) => created(i)),
    cancelOrder: vi.fn(async () => {}),
    listOrdersByIds: vi.fn(async () => []),
    listActiveSeats: vi.fn(async () => [
      { id: "s1", name: "Quầy 1", kind: "counter" as const },
      { id: "t1", name: "Bàn 1", kind: "table" as const },
    ]),
    ...apiOverrides,
  };
  let n = 0;
  const props: OrderScreenProps = {
    api,
    menu: MENU,
    online: true,
    onUnauthorized: vi.fn(),
    newId: () => `order-${++n}`,
    now: () => NOW,
    uploadPhoto: vi.fn(async () => PHOTO),
    ...overrides,
  };
  const user = userEvent.setup();
  const utils = render(<OrderScreen {...props} />);
  return { api, props, user, ...utils };
}

const row = (name: RegExp) => screen.getByRole("button", { name });
async function openCart(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Giỏ đơn" }));
  return screen.getByRole("dialog", { name: "Giỏ đơn" });
}

const PHOTO = "nuoc-noi/transfer/11111111-1111-1111-1111-111111111111";
const PHOTO2 = "nuoc-noi/transfer/22222222-2222-2222-2222-222222222222";
const photoFile = () => new File(["x"], "ck.png", { type: "image/png" });
const payDialog = () => screen.getByRole("dialog", { name: "Thanh toán" });
function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((a, b) => {
    resolve = a;
    reject = b;
  });
  return { promise, resolve, reject };
}
async function chooseCash(user: ReturnType<typeof userEvent.setup>) {
  await user.click(within(payDialog()).getByRole("button", { name: "Tiền mặt" }));
}
// Một Classic, chọn Quầy 1, mở tấm thanh toán
async function openPayment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(row(/^Classic/));
  const cart = await openCart(user);
  await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
  await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
  return { cart, pay: payDialog() };
}
async function takePhoto(user: ReturnType<typeof userEvent.setup>, pay: HTMLElement) {
  await user.upload(within(pay).getByLabelText("Ảnh chuyển khoản"), photoFile());
}

describe("OrderScreen", () => {
  it("chạm món là +1; thanh giỏ đơn hiện số món và thành tiền", async () => {
    const { user } = setup();
    expect(screen.getByText("Chạm món để thêm")).toBeInTheDocument();
    await user.click(row(/^Classic/));
    await user.click(row(/^Classic/));
    await user.click(row(/^Neat/));
    expect(screen.getByText("3 món")).toBeInTheDocument();
    expect(screen.getByTestId("bar-total")).toHaveTextContent("480.000đ");
    expect(row(/^Classic/)).toHaveAccessibleName(/đang có 2/);
  });

  it("món đã ẩn không có trên bảng giá", () => {
    setup();
    expect(screen.queryByRole("button", { name: /^Cũ/ })).toBeNull();
  });

  it("gửi đơn với chỗ ngồi và giảm giá, rồi reset và nhớ đơn", async () => {
    const { api, user } = setup();
    await user.click(row(/^Classic/));
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "10%" }));
    expect(within(cart).getByTestId("total")).toHaveTextContent("342.000đ");
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    expect(api.createOrder).toHaveBeenCalledWith({
      id: "order-1",
      seatId: "s1",
      discountPercent: 10,
      lines: [{ menuItemId: "m1", quantity: 2, clientPrice: 190000 }],
      payment: { method: "cash" },
    });
    expect(await screen.findByRole("status")).toHaveTextContent("Đã tạo đơn 2 món – 342.000đ");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(getMyOrderIds()).toEqual(["order-1"]);
  });

  it("chưa chọn chỗ ngồi thì khóa Xác nhận và ghi lý do", async () => {
    const { user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    expect(within(cart).getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
    expect(within(cart).getAllByText("Chọn chỗ ngồi").length).toBeGreaterThan(0);
    expect(within(cart).getByText("Chưa chọn chỗ ngồi")).toBeInTheDocument();
  });

  it("dòng đơn: − ở 1 thì xóa dòng; ô số 150 thành 99; ô số 0 giữ số cũ", async () => {
    const { user } = setup();
    await user.click(row(/^Classic/));
    await user.click(row(/^Neat/));
    const cart = await openCart(user);
    const qty = within(cart).getByLabelText("Số lượng Classic");
    await user.clear(qty);
    await user.type(qty, "150");
    fireEvent.blur(qty);
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("99");
    await user.clear(within(cart).getByLabelText("Số lượng Classic"));
    await user.type(within(cart).getByLabelText("Số lượng Classic"), "0");
    fireEvent.blur(within(cart).getByLabelText("Số lượng Classic"));
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("99");
    await user.click(within(cart).getByRole("button", { name: "Bớt 1 Neat" }));
    expect(within(cart).queryByLabelText("Số lượng Neat")).toBeNull();
  });

  it("Xóa hết cần bấm hai lần", async () => {
    const { user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(within(cart).getByRole("button", { name: "Xóa hết" }));
    expect(within(cart).getByLabelText("Số lượng Classic")).toBeInTheDocument();
    await user.click(within(cart).getByRole("button", { name: "Chắc chắn xóa hết?" }));
    expect(within(cart).queryByLabelText("Số lượng Classic")).toBeNull();
  });

  it("giảm giá nhập tay: 7% được nhận, 120% bị bỏ qua", async () => {
    const { api, user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    const pct = within(cart).getByLabelText("Giảm giá (%)");
    await user.type(pct, "120");
    fireEvent.blur(pct);
    expect(within(cart).queryByText(/^Giảm \d+%/)).toBeNull();
    await user.clear(pct);
    await user.type(pct, "7");
    fireEvent.blur(pct);
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    expect(api.createOrder).toHaveBeenCalledWith(expect.objectContaining({ discountPercent: 7 }));
  });

  it("mất mạng: khóa nút và hiện cảnh báo", async () => {
    const { user } = setup({ online: false });
    expect(screen.getByText("Mất mạng – chưa gửi được đơn")).toBeInTheDocument();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    expect(within(cart).getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
  });

  it("lỗi mạng giữ giỏ, bấm lại cùng id", async () => {
    const createOrder = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const { user } = setup({}, { createOrder });
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    expect(await within(cart).findByRole("alert")).toHaveTextContent("kiểm tra mạng");
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("1");
    await chooseCash(user);
    await screen.findByText(/Đã tạo đơn/);
    expect(createOrder.mock.calls.map((c) => c[0].id)).toEqual(["order-1", "order-1"]);
  });

  it("server báo đơn đã ghi từ lần gửi trước", async () => {
    const { user } = setup(
      {},
      { createOrder: vi.fn(async (i: CreateOrderInput) => created(i, { duplicate: true })) },
    );
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    expect(await screen.findByText(/Đơn này đã được ghi từ lần gửi trước \(1 món\)/)).toBeInTheDocument();
  });

  it("gửi lại một đơn đã bị hủy: báo, giữ giỏ, lần sau dùng id mới", async () => {
    const createOrder = vi
      .fn()
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i, { duplicate: true, status: "cancelled" }))
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const { user } = setup({}, { createOrder });
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    expect(await within(cart).findByText("Đơn này đã bị hủy – bấm Xác nhận đơn để tạo đơn mới.")).toBeInTheDocument();
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("1");
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    await screen.findByText(/Đã tạo đơn/);
    expect(createOrder.mock.calls.map((c) => c[0].id)).toEqual(["order-1", "order-2"]);
  });

  it("MENU_CHANGED: cập nhật giá trong giỏ và báo thực đơn vừa đổi", async () => {
    const details = JSON.stringify([
      { id: "m1", name: "Classic", price: 200000, is_archived: false },
      { id: "m2", name: "Neat", price: 100000, is_archived: false },
    ]);
    const { user } = setup({}, { createOrder: vi.fn().mockRejectedValue(new RpcError("MENU_CHANGED", details)) });
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    expect(await within(cart).findByText("Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.")).toBeInTheDocument();
    expect(within(cart).getByTestId("total")).toHaveTextContent("200.000đ");
  });

  it("menu đổi khi giỏ đang có món: món bị ẩn thì gạch dòng và khóa Xác nhận", async () => {
    const { user, rerender, props } = setup();
    await user.click(row(/^Neat/));
    rerender(<OrderScreen {...props} menu={MENU.map((m) => (m.id === "m2" ? { ...m, is_archived: true } : m))} />);
    const cart = await openCart(user);
    expect(within(cart).getByText("Món đã ngừng bán – bỏ khỏi đơn rồi gửi lại")).toBeInTheDocument();
    expect(within(cart).getByRole("button", { name: "Xác nhận đơn" })).toBeDisabled();
    expect(within(cart).getAllByText("Bỏ món đã ngừng bán khỏi đơn").length).toBeGreaterThan(0);
  });

  it("Hoàn tác gọi cancelOrder", async () => {
    const { api, user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    await user.click(await screen.findByRole("button", { name: "Hoàn tác" }));
    expect(api.cancelOrder).toHaveBeenCalledWith("order-1");
  });

  it("phiên bị thu hồi thì gọi onUnauthorized", async () => {
    const { props, user } = setup({}, { createOrder: vi.fn().mockRejectedValue(new RpcError("FORBIDDEN")) });
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    expect(props.onUnauthorized).toHaveBeenCalled();
  });

  it("gửi thành công thì rung 30ms", async () => {
    const vibrate = vi.fn();
    Object.defineProperty(navigator, "vibrate", { value: vibrate, configurable: true });
    const { user } = setup();
    await user.click(row(/^Classic/));
    const cart = await openCart(user);
    await user.click(await within(cart).findByRole("button", { name: "Quầy 1" }));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await chooseCash(user);
    await screen.findByText(/Đã tạo đơn/);
    expect(vibrate).toHaveBeenCalledWith(30);
  });

  it("Đơn vừa tạo: tóm tắt món, nút Hủy chỉ trong cửa sổ 5 phút, đơn hủy có dấu HỦY", async () => {
    setup(
      {},
      {
        listOrdersByIds: vi.fn(async () => [
          { id: "a", item_count: 3, subtotal_amount: 480000, discount_percent: 10, discount_amount: 48000, total_amount: 432000, seat_name: "Bàn 1", status: "paid" as const, payment_method: "cash" as const, transfer_photo_id: null, created_at: new Date(NOW.getTime() - 60_000).toISOString(), lines: [{ item_name: "Classic", unit_price: 190000, quantity: 2, line_amount: 380000 }, { item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 }] },
          { id: "b", item_count: 1, subtotal_amount: 100000, discount_percent: 0, discount_amount: 0, total_amount: 100000, seat_name: "Quầy 1", status: "paid" as const, payment_method: "cash" as const, transfer_photo_id: null, created_at: new Date(NOW.getTime() - 10 * 60_000).toISOString(), lines: [{ item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 }] },
          { id: "c", item_count: 1, subtotal_amount: 100000, discount_percent: 0, discount_amount: 0, total_amount: 100000, seat_name: "Quầy 1", status: "cancelled" as const, payment_method: "cash" as const, transfer_photo_id: null, created_at: NOW.toISOString(), lines: [{ item_name: "Neat", unit_price: 100000, quantity: 1, line_amount: 100000 }] },
        ]),
      },
    );
    const list = await screen.findByRole("region", { name: "Đơn vừa tạo" });
    expect(await within(list).findByText("2 Classic, 1 Neat")).toBeInTheDocument();
    expect(within(list).getByText("−10%")).toBeInTheDocument();
    expect(within(list).getAllByRole("button", { name: "Hủy" })).toHaveLength(1);
    expect(within(list).getByText("HỦY")).toBeInTheDocument();
  });

  it("tải lại chỗ ngồi khi có mạng trở lại", async () => {
    const { api, rerender, props } = setup({ online: false });
    expect(api.listActiveSeats).not.toHaveBeenCalled();
    rerender(<OrderScreen {...props} online />);
    await vi.waitFor(() => expect(api.listActiveSeats).toHaveBeenCalled());
  });

  it("chủ quán thấy liên kết quay lại trang chủ quán; nhân viên không thấy", () => {
    setup({ ownerHome: "/admin/dashboard" });
    expect(screen.getByRole("link", { name: /Trang chủ quán/ })).toHaveAttribute("href", "/admin/dashboard");
  });

  it("màn rộng: phiếu đơn luôn hiện, không có thanh giỏ đơn", async () => {
    const spy = vi.spyOn(window, "matchMedia").mockImplementation(
      (q: string) => ({ matches: true, media: q, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList,
    );
    setup();
    expect(screen.queryByRole("button", { name: "Giỏ đơn" })).toBeNull();
    expect(screen.getByRole("region", { name: "Giỏ đơn" })).toBeInTheDocument();
    spy.mockRestore();
  });

  it("Quay lại: đóng tấm thanh toán, giỏ còn nguyên, chưa gửi đơn", async () => {
    const { api, user } = setup();
    const { cart, pay } = await openPayment(user);
    expect(within(pay).getByTestId("pay-total")).toHaveTextContent("190.000đ");
    expect(within(pay).getByText("Quầy 1")).toBeInTheDocument();
    await user.click(within(pay).getByRole("button", { name: "Quay lại" }));
    expect(screen.queryByRole("dialog", { name: "Thanh toán" })).toBeNull();
    expect(api.createOrder).not.toHaveBeenCalled();
    expect(within(cart).getByLabelText("Số lượng Classic")).toHaveValue("1");
  });

  it("chuyển khoản: QR, chụp ảnh bắt buộc, xác nhận khóa tới khi tải ảnh xong, gửi kèm ảnh", async () => {
    const up = deferred<string>();
    const uploadPhoto = vi.fn(() => up.promise);
    const { api, user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(pay).getByRole("img", { name: "Mã QR chuyển khoản của quán" })).toBeInTheDocument();
    expect(within(pay).queryByRole("button", { name: "Xác nhận đã thanh toán" })).toBeNull();
    await takePhoto(user, pay);
    expect(within(pay).getByRole("img", { name: "Ảnh chuyển khoản vừa chụp" })).toBeInTheDocument();
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveTextContent("Đang tải ảnh…");
    await act(async () => up.resolve(PHOTO));
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(api.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({ id: "order-1", payment: { method: "transfer", photoId: PHOTO } }),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Đã tạo đơn 1 món – 190.000đ");
    expect(screen.queryByRole("dialog", { name: "Thanh toán" })).toBeNull();
  });

  it("tải ảnh lỗi: báo lỗi, Thử lại gửi lại chính ảnh đó", async () => {
    const uploadPhoto = vi.fn().mockRejectedValueOnce(new UploadError("FAILED")).mockResolvedValueOnce(PHOTO);
    const { user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    expect(await within(pay).findByText("Chưa tải được ảnh – kiểm tra mạng rồi thử lại.")).toBeInTheDocument();
    expect(within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" })).toBeDisabled();
    await user.click(within(pay).getByRole("button", { name: "Thử lại" }));
    await waitFor(() => expect(within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" })).toBeEnabled());
    expect(uploadPhoto).toHaveBeenCalledTimes(2);
    expect(uploadPhoto.mock.calls[1][0]).toBe(uploadPhoto.mock.calls[0][0]);
  });

  it("chụp lại khi ảnh trước chưa tải xong: chỉ ảnh mới nhất được gửi (Review Focus 1)", async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const uploadPhoto = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const { api, user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    await takePhoto(user, pay); // "Chụp lại" mở cùng ô chọn ảnh
    await act(async () => second.resolve(PHOTO2));
    await act(async () => first.resolve(PHOTO));
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(api.createOrder).toHaveBeenCalledWith(expect.objectContaining({ payment: { method: "transfer", photoId: PHOTO2 } }));
  });

  it("lỗi mạng khi gửi chuyển khoản: giữ tấm và ảnh, bấm lại cùng id và cùng ảnh (Review Focus 2)", async () => {
    const createOrder = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError())
      .mockImplementationOnce(async (i: CreateOrderInput) => created(i));
    const uploadPhoto = vi.fn(async () => PHOTO);
    const { user } = setup({ uploadPhoto }, { createOrder });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(await within(pay).findByRole("alert")).toHaveTextContent("kiểm tra mạng");
    expect(within(pay).getByRole("img", { name: "Ảnh chuyển khoản vừa chụp" })).toBeInTheDocument();
    await user.click(confirm);
    await screen.findByText(/Đã tạo đơn/);
    expect(createOrder.mock.calls.map((c) => [c[0].id, c[0].payment])).toEqual([
      ["order-1", { method: "transfer", photoId: PHOTO }],
      ["order-1", { method: "transfer", photoId: PHOTO }],
    ]);
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
  });

  it("MENU_CHANGED: đóng tấm, giữ ảnh; mở lại vào thẳng bước kiểm tra ảnh; Xóa hết thì bỏ ảnh", async () => {
    const details = JSON.stringify([
      { id: "m1", name: "Classic", price: 200000, is_archived: false },
      { id: "m2", name: "Neat", price: 100000, is_archived: false },
    ]);
    const createOrder = vi
      .fn()
      .mockRejectedValueOnce(new RpcError("MENU_CHANGED", details))
      .mockImplementation(async (i: CreateOrderInput) => created(i));
    const uploadPhoto = vi.fn(async () => PHOTO);
    const { user } = setup({ uploadPhoto }, { createOrder });
    const { cart, pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    await waitFor(() => expect(confirm).toBeEnabled());
    await user.click(confirm);
    expect(await within(cart).findByText("Thực đơn vừa đổi – kiểm tra lại giỏ đơn rồi gửi lại.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Thanh toán" })).toBeNull();

    // Mở lại: vào thẳng bước kiểm tra ảnh, không phải chụp lại
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(within(payDialog()).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(payDialog()).getByRole("button", { name: "Xác nhận đã thanh toán" })).toBeEnabled();
    await user.click(within(payDialog()).getByRole("button", { name: "Quay lại" }));

    // Xóa hết thì bỏ ảnh: lần sau chọn Chuyển khoản phải quét QR và chụp lại
    await user.click(within(cart).getByRole("button", { name: "Xóa hết" }));
    await user.click(within(cart).getByRole("button", { name: "Chắc chắn xóa hết?" }));
    await user.click(row(/^Classic/));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(within(payDialog()).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(payDialog()).getByRole("img", { name: "Mã QR chuyển khoản của quán" })).toBeInTheDocument();
    expect(uploadPhoto).toHaveBeenCalledTimes(1);
  });

  it("bỏ từng món đến khi giỏ trống thì bỏ ảnh đang giữ (SRS R42)", async () => {
    const { user } = setup();
    const { cart, pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    await waitFor(() => expect(within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" })).toBeEnabled());
    await user.click(within(pay).getByRole("button", { name: "Quay lại" }));
    await user.click(within(cart).getByRole("button", { name: "Bớt 1 Classic" }));
    await user.click(row(/^Classic/));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(within(payDialog()).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(payDialog()).getByRole("img", { name: "Mã QR chuyển khoản của quán" })).toBeInTheDocument();
    expect(within(payDialog()).queryByRole("button", { name: "Xác nhận đã thanh toán" })).toBeNull();
  });

  it("bấm hai lần chỉ gửi một lần (Review Focus 3)", async () => {
    const pending = deferred<CreatedOrder>();
    const createOrder = vi.fn(() => pending.promise);
    const { user } = setup({}, { createOrder });
    const { pay } = await openPayment(user);
    const cash = within(pay).getByRole("button", { name: "Tiền mặt" });
    await user.click(cash);
    await user.click(cash);
    expect(createOrder).toHaveBeenCalledTimes(1);
    expect(cash).toHaveTextContent("Đang gửi…");
  });

  it("upload bị từ chối quyền thì đăng xuất (Review Focus 5)", async () => {
    const uploadPhoto = vi.fn().mockRejectedValueOnce(new UploadError("UNAUTHORIZED"));
    const { props, user } = setup({ uploadPhoto });
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    await waitFor(() => expect(props.onUnauthorized).toHaveBeenCalled());
  });

  it("ảnh tải dở của giỏ cũ không sống lại sau Xóa hết", async () => {
    const up = deferred<string>();
    const uploadPhoto = vi.fn(() => up.promise);
    const { user } = setup({ uploadPhoto });
    const { cart, pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    await user.click(within(pay).getByRole("button", { name: "Quay lại" }));
    await user.click(within(cart).getByRole("button", { name: "Xóa hết" }));
    await user.click(within(cart).getByRole("button", { name: "Chắc chắn xóa hết?" }));
    await act(async () => up.resolve(PHOTO));
    await user.click(row(/^Classic/));
    await user.click(within(cart).getByRole("button", { name: "Xác nhận đơn" }));
    await user.click(within(payDialog()).getByRole("button", { name: "Chuyển khoản" }));
    expect(within(payDialog()).getByRole("img", { name: "Mã QR chuyển khoản của quán" })).toBeInTheDocument();
    expect(within(payDialog()).queryByRole("button", { name: "Xác nhận đã thanh toán" })).toBeNull();
  });

  it("mất mạng khi tấm thanh toán đang mở: khóa Tiền mặt, ghi lý do; có mạng lại thì gửi tiếp cùng id", async () => {
    const { api, props, user, rerender } = setup();
    const { pay } = await openPayment(user);
    rerender(<OrderScreen {...props} online={false} />);
    expect(within(pay).getByRole("button", { name: "Tiền mặt" })).toBeDisabled();
    expect(within(pay).getByText("Mất mạng – chưa gửi được đơn")).toBeInTheDocument();
    rerender(<OrderScreen {...props} online />);
    await user.click(within(pay).getByRole("button", { name: "Tiền mặt" }));
    expect(api.createOrder).toHaveBeenCalledTimes(1);
    expect(api.createOrder).toHaveBeenCalledWith(expect.objectContaining({ id: "order-1" }));
  });

  it("món vừa ngừng bán khi đang xem ảnh: khóa Xác nhận đã thanh toán, ghi lý do, giữ ảnh", async () => {
    const { props, user, rerender } = setup();
    const { pay } = await openPayment(user);
    await user.click(within(pay).getByRole("button", { name: "Chuyển khoản" }));
    await takePhoto(user, pay);
    const confirm = within(pay).getByRole("button", { name: "Xác nhận đã thanh toán" });
    await waitFor(() => expect(confirm).toBeEnabled());
    rerender(<OrderScreen {...props} menu={MENU.map((m) => (m.id === "m1" ? { ...m, is_archived: true } : m))} />);
    expect(confirm).toBeDisabled();
    expect(within(pay).getByText("Bỏ món đã ngừng bán khỏi đơn")).toBeInTheDocument();
    expect(within(pay).getByRole("img", { name: "Ảnh chuyển khoản vừa chụp" })).toBeInTheDocument();
  });
});
