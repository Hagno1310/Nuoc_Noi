import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

// DESIGN.md: một họ chữ, đủ dấu tiếng Việt
const font = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Nước Nôi",
  description: "Ghi đơn nhanh cho quán Nước Nôi",
  // Ảnh xem trước khi gửi link (SRS R29): ảnh lấy từ src/app/opengraph-image.png
  openGraph: {
    title: "Nước Nôi",
    description: "Ghi đơn nhanh cho quán Nước Nôi",
    siteName: "Nước Nôi",
    locale: "vi_VN",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Nước Nôi", statusBarStyle: "black" },
  icons: { apple: "/icons/192" },
};

export const viewport: Viewport = {
  themeColor: "#111310",
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
      <body className={`${font.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
