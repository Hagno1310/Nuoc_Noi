"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/dashboard", label: "Tổng quan" },
  { href: "/admin/history", label: "Lịch sử đơn hàng" },
  { href: "/admin/settings", label: "Cài đặt" },
  { href: "/order", label: "Màn hình order" },
];

// Điện thoại: thanh dưới cố định; máy tính: cột trái (docs/design/owner-brief.md §6)
export function OwnerNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Trang chủ quán"
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-current/20 bg-background lg:static lg:flex lg:flex-col lg:border-0"
    >
      {NAV.map((n) => (
        <Link
          key={n.href}
          href={n.href}
          aria-current={pathname.startsWith(n.href) ? "page" : undefined}
          className="flex min-h-14 items-center justify-center px-2 text-center text-sm font-medium opacity-70 aria-[current=page]:font-bold aria-[current=page]:underline aria-[current=page]:opacity-100 lg:justify-start lg:rounded-lg lg:px-3 lg:text-base"
        >
          {n.label}
        </Link>
      ))}
    </nav>
  );
}
