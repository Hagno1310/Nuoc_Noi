"use client";
import {
  CupSoda,
  Gauge,
  ScrollText,
  Settings,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: LucideIcon };

const OWNER: Item[] = [
  {
    href: "/admin/dashboard",
    label: "Tổng quan",
    icon: Gauge,
  },
  {
    href: "/admin/menu",
    label: "Thực đơn",
    icon: UtensilsCrossed,
  },
  {
    href: "/admin/history",
    label: "Lịch sử đơn hàng",
    icon: ScrollText,
  },
  {
    href: "/admin/settings",
    label: "Cài đặt",
    icon: Settings,
  },
];
// Rời khu chủ quán: tách riêng trên laptop
const ORDER: Item = {
  href: "/order",
  label: "Màn hình order",
  icon: CupSoda,
};

function NavLink({ item, active }: { item: Item; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      aria-label={item.label}
      className="group flex min-h-12 items-center justify-center px-2 font-medium text-ink-muted transition-colors duration-150 aria-[current=page]:text-ink lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-lg lg:px-3 lg:text-base lg:hover:bg-raised/60 lg:hover:text-ink lg:aria-[current=page]:bg-raised lg:aria-[current=page]:font-semibold"
    >
      <Icon
        aria-hidden="true"
        size={20}
        className="shrink-0 group-aria-[current=page]:text-ember"
      />
      <span className="hidden lg:inline">{item.label}</span>
    </Link>
  );
}

// Điện thoại: thanh dưới cố định, chỉ icon (tên nằm trong aria-label). Laptop: danh sách dọc trong sidebar cố định.
export function OwnerNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Trang chủ quán"
      className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-5 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] lg:static lg:flex lg:flex-1 lg:flex-col lg:gap-1 lg:border-0 lg:bg-transparent lg:pb-0"
    >
      {OWNER.map((n) => (
        <NavLink key={n.href} item={n} active={pathname.startsWith(n.href)} />
      ))}
      <span
        aria-hidden="true"
        className="hidden lg:my-4 lg:block lg:border-t lg:border-line"
      />
      <NavLink item={ORDER} active={false} />
    </nav>
  );
}
