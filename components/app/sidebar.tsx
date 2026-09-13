"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
        "bg-[#FAF8F3]",
        "border-r border-[hsl(var(--border))]",
      )}
    >
      {/* Editorial Insignia Masthead */}
      <div className="px-5 py-5 border-b border-[hsl(var(--border))]">
        <Link
          href="/dashboard"
          className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded-sm"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rotate-45 bg-[hsl(var(--gold))] inline-block shrink-0" />
            <span
              className="text-base font-semibold tracking-wider font-serif uppercase text-[hsl(var(--foreground))]"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
            >
              LifeQuest
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-[hsl(var(--foreground-muted))] mt-1 pl-4 font-sans font-medium">
            Character Chronicle
          </p>
        </Link>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="App navigation">
        <ul role="list" className="flex flex-col gap-1">
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
                    "relative flex items-center gap-3 px-3.5 py-2.5 rounded-sm text-xs tracking-wide uppercase transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                    isActive
                      ? [
                          "bg-[hsl(var(--surface-2))]",
                          "text-[hsl(var(--foreground))]",
                          "font-semibold",
                          "border-l-2 border-l-[hsl(var(--primary))]",
                          "[&_svg]:text-[hsl(var(--primary))]",
                        ]
                      : [
                          "text-[hsl(var(--foreground-muted))]",
                          "font-medium",
                          "hover:bg-[hsl(var(--surface-2))]",
                          "hover:text-[hsl(var(--foreground))]",
                          "[&_svg]:text-[hsl(var(--foreground-muted))]",
                          "hover:[&_svg]:text-[hsl(var(--foreground))]",
                          "border-l-2 border-l-transparent",
                        ]
                  )}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.25 : 1.75} />
                  <span>{label}</span>
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
            "flex items-center gap-3 w-full px-3.5 py-2.5 rounded-sm text-xs font-medium tracking-wide uppercase transition-colors duration-150",
            "text-[hsl(var(--foreground-muted))]",
            "hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--foreground))]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          )}
        >
          <LogOut size={16} strokeWidth={1.75} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
