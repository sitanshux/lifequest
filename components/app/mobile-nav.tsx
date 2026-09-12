"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Scroll,
  User,
  ShoppingBag,
  Archive,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",    href: "/dashboard",    icon: LayoutDashboard },
  { label: "Quests",       href: "/quests",       icon: Scroll         },
  { label: "Character",    href: "/character",    icon: User           },
  { label: "Shop",         href: "/shop",         icon: ShoppingBag    },
  { label: "Inventory",    href: "/inventory",    icon: Archive        },
  { label: "Achievements", href: "/achievements", icon: Trophy         },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "md:hidden",
        "fixed bottom-0 left-0 right-0 z-40",
        "bg-[hsl(var(--surface-1))]",
        "border-t border-[hsl(var(--border))]",
        // Safe area padding for devices with home indicator
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul
        role="list"
        className="flex items-stretch justify-around h-16"
      >
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/"
              : pathname.startsWith(href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 h-full w-full",
                  "text-[10px] font-medium tracking-wide",
                  "transition-colors duration-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-inset",
                  // Minimum touch target 44px (covered by h-16)
                  isActive
                    ? "text-[hsl(var(--xp))]"
                    : "text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--foreground-muted))]"
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.75}
                />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
