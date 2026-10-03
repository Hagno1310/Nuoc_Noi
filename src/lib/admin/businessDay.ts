// Số giờ đã trôi qua trong ngày kinh doanh hiện tại (0 đến dưới 24), theo giờ VN.
// Ngày kinh doanh bắt đầu từ giờ mở cửa (GLOSSARY), nên 01:00 với giờ mở cửa 20 là 5 giờ.
export function elapsedHours(now: Date, startHour: number): number {
  const vn = new Date(now.getTime() + 7 * 3600_000); // Asia/Ho_Chi_Minh không có giờ mùa hè
  const hours = vn.getUTCHours() + vn.getUTCMinutes() / 60;
  return (hours - startHour + 24) % 24;
}
