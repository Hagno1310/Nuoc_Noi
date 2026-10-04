// SRS FR-05: giá món từ 1.000đ đến 5.000.000đ (server cũng chặn bằng CHECK)
export const MIN_PRICE = 1_000;
export const MAX_PRICE = 5_000_000;
export const PRICE_RANGE_TEXT = "Giá phải là số nguyên từ 1.000đ đến 5.000.000đ.";

// Dấu chấm, phẩy, khoảng trắng chỉ được dùng để tách nhóm nghìn: "120,5" bị từ chối, không thành 1.205đ
export function parsePriceInput(raw: string): number | null {
  const text = raw.trim().replace(/\s*đ$/, "");
  if (!/^(\d+|\d{1,3}([.,\s]\d{3})+)$/.test(text)) return null;
  const value = parseInt(text.replace(/[.,\s]/g, ""), 10);
  return value >= MIN_PRICE && value <= MAX_PRICE ? value : null;
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
