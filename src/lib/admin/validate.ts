// SRS FR-05, R21: đơn giá chung từ 1đ đến 500.000đ (server cũng kiểm tra)
export const MAX_PRICE = 500_000;

// Dấu chấm, phẩy, khoảng trắng chỉ được dùng để tách nhóm nghìn: "25,5" bị từ chối, không thành 255đ
export function parsePriceInput(raw: string): number | null {
  const text = raw.trim().replace(/\s*đ$/, "");
  if (!/^(\d+|\d{1,3}([.,\s]\d{3})+)$/.test(text)) return null;
  const value = parseInt(text.replace(/[.,\s]/g, ""), 10);
  return value >= 1 && value <= MAX_PRICE ? value : null;
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin);
}
