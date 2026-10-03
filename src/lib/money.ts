export function formatVnd(amount: number): string {
  const digits = Math.trunc(amount).toString();
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "đ";
}
