// Đổi lỗi từ Supabase thành câu tiếng Việt nêu vấn đề và cách khắc phục (ui-craft.md)
const TEXT: Record<string, string> = {
  FORBIDDEN: "Phiên chủ quán đã hết. Đăng nhập lại rồi thử lại.",
  INVALID_PRICE: "Giá phải là số nguyên từ 1đ đến 500.000đ.",
  INVALID_HOUR: "Giờ mở cửa phải từ 0 đến 23.",
  INVALID_PIN_FORMAT: "PIN quán phải gồm đúng 6 chữ số.",
  STAFF_ACCOUNT_MISSING:
    "Chưa có tài khoản nhân viên. Tạo bằng script create-user trước.",
};

export function ownerErrorText(error: { message: string }): string {
  return TEXT[error.message] ?? "Không lưu được. Kiểm tra mạng rồi thử lại.";
}
