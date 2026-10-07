import { createHash, randomUUID } from "node:crypto";

// Chữ ký upload của Cloudinary: tham số xếp theo tên, nối "k=v&…", thêm secret, băm SHA-1.
// Chỉ route ký (server) import file này; secret được truyền vào, file không tự đọc biến môi trường.
export function signParams(params: Record<string, string | number>, secret: string): string {
  const query = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(query + secret).digest("hex");
}

// Server sinh public_id, nên client không tự đặt tên ảnh và DB kiểm tra được mẫu
export function newTransferPhotoId(): string {
  return `nuoc-noi/transfer/${randomUUID()}`;
}
