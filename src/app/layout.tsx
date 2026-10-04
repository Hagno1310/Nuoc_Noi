import type { Metadata, Viewport } from "next";
import { Anton, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

// Một họ font sans có đủ dấu tiếng Việt (ui-craft.md)
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

// Font hiển thị kiểu poster retro, chỉ cho con số lớn và tiêu đề (gần nét dày của logo vẽ tay)
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin", "vietnamese"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Nước Nôi",
  description: "Tạo đơn hàng nhanh cho quán nước đồng giá",
  // Ảnh xem trước khi gửi link (SRS R29): ảnh lấy từ src/app/opengraph-image.png
  openGraph: {
    title: "Nước Nôi",
    description: "Tạo đơn hàng nhanh cho quán nước đồng giá",
    siteName: "Nước Nôi",
    locale: "vi_VN",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Nước Nôi", statusBarStyle: "black" },
  icons: { apple: "/icons/192" },
};

export const viewport: Viewport = {
  themeColor: "#1A1E15",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={`${beVietnam.variable} ${anton.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
