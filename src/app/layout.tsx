import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// Một họ chữ duy nhất (surface brief): Archivo biến thiên, trục wdth cho chữ biển hẹp, đủ dấu tiếng Việt
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "vietnamese"],
  axes: ["wdth"],
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
  themeColor: "#1a1e15",
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
      <body className={`${archivo.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
