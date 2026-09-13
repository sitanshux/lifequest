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
        "bg-[#FAF8F3]",
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
                  "relative flex flex-col items-center justify-center gap-1 h-full w-full",
                  "text-[9.5px] tracking-wider uppercase font-medium transition-colors duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-inset",
                  isActive
                    ? [
                        "text-[hsl(var(--foreground))] font-semibold",
                        "border-t-2 border-t-[hsl(var(--primary))]",
                        "[&_svg]:text-[hsl(var(--primary))]",
                      ]
                    : [
                        "text-[hsl(var(--foreground-muted))]",
                        "border-t-2 border-t-transparent",
                        "hover:text-[hsl(var(--foreground))]",
                      ]
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.25 : 1.75}
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
