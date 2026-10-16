// Rung ngắn khi gửi đơn thành công. iOS Safari không hỗ trợ Vibration API, nên ở đó lệnh này không có tác dụng.
export function buzz(ms = 30): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Một số trình duyệt chặn rung khi chưa có thao tác người dùng; bỏ qua
  }
}
