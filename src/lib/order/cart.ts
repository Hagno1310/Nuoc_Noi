// SRS FR-01–FR-03: giỏ đơn ở trình duyệt. Số tiền ở đây chỉ để hiển thị; số được lưu do server tính (FR-04).
export type MenuItem = { id: string; name: string; price: number; sort_order: number; is_archived: boolean };
export type MenuChange = Pick<MenuItem, "id" | "name" | "price" | "is_archived">;
export type CartLine = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  note: string; // ghi chú dòng đơn (FR-02); cùng món khác ghi chú là hai dòng
  archived: boolean; // món đã ngừng bán: dòng gạch, khóa Xác nhận
  priceChanged: boolean; // giá vừa đổi: nổi bật khoảng 3 giây
};

export const MAX_QUANTITY = 99;
export const MAX_LINES = 30;
export const MAX_NOTE = 60;

// Khóa của dòng đơn: món + ghi chú. Dòng không ghi chú dùng thẳng id món.
export const lineKey = (l: Pick<CartLine, "menuItemId" | "note">) => (l.note ? `${l.menuItemId}|${l.note}` : l.menuItemId);

export function setQuantity(cart: CartLine[], id: string, quantity: number): CartLine[] {
  if (!Number.isInteger(quantity) || quantity < 1) return cart;
  const q = Math.min(quantity, MAX_QUANTITY);
  return cart.map((l) => (lineKey(l) === id ? { ...l, quantity: q } : l));
}

export function addItem(cart: CartLine[], item: MenuItem): CartLine[] {
  const line = cart.find((l) => lineKey(l) === item.id);
  return setItemQuantity(cart, item, (line?.quantity ?? 0) + 1);
}

// Chạm giữ ô món: đặt số lượng cho dòng không ghi chú của món đó (FR-01)
export function setItemQuantity(cart: CartLine[], item: MenuItem, quantity: number): CartLine[] {
  if (cart.some((l) => lineKey(l) === item.id)) return setQuantity(cart, item.id, quantity);
  if (cart.length >= MAX_LINES || !Number.isInteger(quantity) || quantity < 1) return cart;
  const line = { menuItemId: item.id, name: item.name, price: item.price, quantity: 1, note: "", archived: false, priceChanged: false };
  return setQuantity([...cart, line], item.id, quantity);
}

// Đổi ghi chú; trùng ghi chú với dòng khác của cùng món thì gộp số lượng
export function setNote(cart: CartLine[], key: string, raw: string): CartLine[] {
  const note = raw.trim().slice(0, MAX_NOTE);
  const line = cart.find((l) => lineKey(l) === key);
  if (!line || line.note === note) return cart;
  const target = cart.find((l) => l.menuItemId === line.menuItemId && l.note === note);
  if (!target) return cart.map((l) => (l === line ? { ...l, note } : l));
  return cart
    .filter((l) => l !== line)
    .map((l) => (l === target ? { ...l, quantity: Math.min(l.quantity + line.quantity, MAX_QUANTITY) } : l));
}

export function removeLine(cart: CartLine[], id: string): CartLine[] {
  return cart.filter((l) => lineKey(l) !== id);
}

export function decrement(cart: CartLine[], id: string): CartLine[] {
  const line = cart.find((l) => lineKey(l) === id);
  if (!line) return cart;
  return line.quantity <= 1 ? removeLine(cart, id) : setQuantity(cart, id, line.quantity - 1);
}

// Thực đơn mới (realtime hoặc MENU_CHANGED): cập nhật tên và giá, gạch món đã ngừng bán
export function applyMenu(cart: CartLine[], menu: MenuChange[]): CartLine[] {
  const byId = new Map(menu.map((m) => [m.id, m]));
  return cart.map((l) => {
    const m = byId.get(l.menuItemId);
    if (!m || m.is_archived) return l.archived ? l : { ...l, archived: true };
    if (m.price === l.price && m.name === l.name && !l.archived) return l;
    return { ...l, name: m.name, price: m.price, archived: false, priceChanged: l.priceChanged || m.price !== l.price };
  });
}

export function clearPriceFlags(cart: CartLine[]): CartLine[] {
  return cart.some((l) => l.priceChanged) ? cart.map((l) => ({ ...l, priceChanged: false })) : cart;
}

export const subtotal = (cart: CartLine[]) => cart.reduce((s, l) => s + l.price * l.quantity, 0);
export const itemCount = (cart: CartLine[]) => cart.reduce((s, l) => s + l.quantity, 0);

// Cùng công thức với public.discount_amount ở server: làm tròn xuống tới 1.000đ (SRS FR-03, R34)
export const discountAmount = (sub: number, percent: number) => Math.floor((sub * percent) / 100000) * 1000;

export function parseQuantityInput(raw: string): number | null {
  const t = raw.trim();
  if (!/^\d{1,4}$/.test(t)) return null;
  const v = parseInt(t, 10);
  return v < 1 ? null : Math.min(v, MAX_QUANTITY);
}

// Ô trống nghĩa là không giảm giá
export function parseDiscountInput(raw: string): number | null {
  const t = raw.trim().replace(/%$/, "").trim();
  if (t === "") return 0;
  if (!/^\d{1,3}$/.test(t)) return null;
  const v = parseInt(t, 10);
  return v <= 100 ? v : null;
}

export function summarize(lines: { item_name: string; quantity: number }[] | null): string {
  return (lines ?? []).map((l) => `${l.quantity} ${l.item_name}`).join(", ");
}

export function toPayload(cart: CartLine[]) {
  return cart.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity, clientPrice: l.price, note: l.note }));
}
