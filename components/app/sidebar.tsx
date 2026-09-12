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
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <aside
      aria-label="Main navigation"
      className={cn(
        "hidden md:flex flex-col",
        "fixed left-0 top-0 bottom-0 z-40",
        "w-sidebar",
        "bg-[hsl(var(--surface-1))]",
        "border-r border-[hsl(var(--border))]",
      )}
    >
      {/* Wordmark */}
      <div className="px-5 py-6 border-b border-[hsl(var(--border))]">
        <Link
          href="/dashboard"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded"
        >
          <span
            className="text-lg font-bold tracking-tight text-display"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            Life<span className="text-[hsl(var(--xp))]">Quest</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="App navigation">
        <ul role="list" className="flex flex-col gap-0.5">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive =
              href === "/dashboard"
                ? pathname === "/dashboard" || pathname === "/"
                : pathname.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded text-sm transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                    isActive
                      ? [
                          "bg-[hsl(var(--surface-3))]",
                          "text-[hsl(var(--foreground))]",
                          "font-medium",
                          "[&_svg]:text-[hsl(var(--xp))]",
                        ]
                      : [
                          "text-[hsl(var(--foreground-muted))]",
                          "hover:bg-[hsl(var(--surface-2))]",
                          "hover:text-[hsl(var(--foreground))]",
                        ]
                  )}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                  {/* Active indicator — left bar, not a glowing dot */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 w-[3px] h-5 rounded-r bg-[hsl(var(--xp))]"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[hsl(var(--border))]">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded text-sm transition-colors duration-100",
            "text-[hsl(var(--foreground-subtle))]",
            "hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--foreground-muted))]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          )}
        >
          <LogOut size={16} strokeWidth={2} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
