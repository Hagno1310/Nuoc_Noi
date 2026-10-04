import { PRICE_RANGE_TEXT } from "@/lib/admin/validate";

// Đổi lỗi từ Supabase thành câu tiếng Việt nêu vấn đề và cách khắc phục (ui-craft.md)
const TEXT: Record<string, string> = {
  FORBIDDEN: "Phiên chủ quán đã hết. Đăng nhập lại rồi thử lại.",
  INVALID_HOUR:
    "Giờ phải từ 0 đến 23, và giờ mở cửa không được trùng giờ đóng cửa.",
  INVALID_PIN_FORMAT: "PIN quán phải gồm đúng 6 chữ số.",
  ORDER_NOT_FOUND: "Không tìm thấy đơn. Tải lại trang rồi thử lại.",
  STAFF_ACCOUNT_MISSING:
    "Chưa có tài khoản nhân viên. Tạo bằng script create-user trước.",
};

// Ràng buộc của bảng menu_items (SRS FR-05). So cả mã lẫn tên ràng buộc, để CHECK của bảng khác không bị báo nhầm.
function constraintText(error: { message: string; code?: string }): string | undefined {
  if (error.code === "23505" && error.message.includes("menu_items_active_name_key"))
    return "Đã có món đang bán tên này. Đặt tên khác.";
  if (error.code === "23514" && error.message.includes("menu_items_price_check"))
    return PRICE_RANGE_TEXT;
  return undefined;
}

export function ownerErrorText(error: { message: string; code?: string }): string {
  return (
    constraintText(error) ??
    TEXT[error.message] ??
    "Không thực hiện được. Kiểm tra mạng rồi thử lại."
  );
}
