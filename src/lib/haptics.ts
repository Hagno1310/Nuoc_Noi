// Rung ngắn khi gửi đơn thành công. iOS Safari không hỗ trợ Vibration API, nên ở đó lệnh này không có tác dụng.
export function buzz(): void {
  try {
    navigator.vibrate?.(30);
  } catch {
    // Một số trình duyệt chặn rung khi chưa có thao tác người dùng; bỏ qua
  }
}
