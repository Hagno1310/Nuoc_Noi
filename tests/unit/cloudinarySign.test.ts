import { describe, expect, it } from "vitest";
import { newTransferPhotoId, signParams } from "@/lib/cloudinarySign";
import { TRANSFER_PHOTO_PATTERN, transferPhotoUrl } from "@/lib/cloudinary";

describe("signParams", () => {
  it("khớp ví dụ trong tài liệu Cloudinary (tham số xếp theo tên, nối secret, SHA-1)", () => {
    expect(
      signParams({ timestamp: 1315060510, public_id: "sample_image", eager: "w_400,h_300,c_pad|w_260,h_200,c_crop" }, "abcd"),
    ).toBe("bfd09f95f331f558cbd1320e67aa8d488770583e");
  });
});

describe("ảnh chuyển khoản", () => {
  it("public_id do server sinh khớp mẫu DB", () => {
    expect(newTransferPhotoId()).toMatch(TRANSFER_PHOTO_PATTERN);
    expect(newTransferPhotoId()).not.toBe(newTransferPhotoId());
  });
  it("URL xem ảnh ghép từ cloud name và public_id, Cloudinary tự thu nhỏ", () => {
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = "demo";
    expect(transferPhotoUrl("nuoc-noi/transfer/abc", 480)).toBe(
      "https://res.cloudinary.com/demo/image/upload/c_limit,w_480,q_auto,f_auto/nuoc-noi/transfer/abc",
    );
  });
});
