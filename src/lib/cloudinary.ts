// SRS v3.3 FR-04c: ảnh chuyển khoản lưu trên Cloudinary; DB chỉ giữ public_id, URL ghép ở client (spec §3.1)
export const TRANSFER_PHOTO_PATTERN = /^nuoc-noi\/transfer\/[0-9a-f-]{36}$/;

export function transferPhotoUrl(publicId: string, width: number): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/c_limit,w_${width},q_auto,f_auto/${publicId}`;
}
