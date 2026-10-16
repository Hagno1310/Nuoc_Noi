"use client";
import { CirclePlus, Coffee, LayoutDashboard, ReceiptText, Settings2, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; short: string; icon: LucideIcon };

const OWNER: Item[] = [
  { href: "/admin/dashboard", label: "Tổng quan", short: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/menu", label: "Thực đơn", short: "Thực đơn", icon: Coffee },
  { href: "/admin/history", label: "Lịch sử đơn hàng", short: "Lịch sử", icon: ReceiptText },
  { href: "/admin/settings", label: "Cài đặt", short: "Cài đặt", icon: Settings2 },
];
// Rời khu chủ quán: tách riêng sau đường chia trên máy tính
const ORDER: Item = { href: "/order", label: "Màn hình order", short: "Order", icon: CirclePlus };

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className="group flex flex-col items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-muted aria-[current=page]:font-semibold aria-[current=page]:text-ink lg:h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-[14px] lg:px-3.5 lg:text-[15px] lg:hover:text-ink lg:aria-[current=page]:bg-surface-2"
    >
      <Icon aria-hidden="true" size={22} className="shrink-0 group-aria-[current=page]:text-accent lg:size-5" />
      <span className="lg:hidden">{item.short}</span>
      <span className="hidden lg:inline">{item.label}</span>
    </Link>
  );
}

// Điện thoại: thanh dưới 5 mục, icon + chữ. Máy tính: danh sách dọc trong thanh bên.
export function OwnerNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Trang chủ quán"
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-bg px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:flex lg:flex-col lg:gap-1.5 lg:border-0 lg:bg-transparent lg:p-0"
    >
      {OWNER.map((n) => (
        <NavLink key={n.href} item={n} active={pathname.startsWith(n.href)} />
      ))}
      <span aria-hidden="true" className="hidden lg:my-2 lg:block lg:border-t lg:border-line" />
      <NavLink item={ORDER} active={false} />
    </nav>
  );
}
