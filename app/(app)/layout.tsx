import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app/sidebar";
import { MobileNav } from "@/components/app/mobile-nav";

// All (app) routes require an authenticated session.
// instant = false blocks prerendering — the correct flag when cacheComponents is enabled.
export const instant = false;

/**
 * Authenticated application shell.
 *
 * All routes inside app/(app)/ are protected here.
 * Unauthenticated users are redirected to /auth/login.
 * The middleware (proxy.ts) also handles this at the edge,
 * so this is a belt-and-suspenders server-side check.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Desktop sidebar — fixed, full height */}
      <AppSidebar />

      {/* Main content — offset by sidebar on desktop */}
      <div className="md:pl-[220px] w-full">
        <main
          id="main-content"
          className={[
            "min-h-screen",
            "px-4 py-6",
            "sm:px-6",
            "md:px-8 md:py-8",
            "lg:px-10 lg:py-10",
            "max-w-7xl mx-auto",
            // Bottom padding for mobile nav bar
            "pb-24 md:pb-12",
          ].join(" ")}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav — fixed, visible below md breakpoint */}
      <MobileNav />
    </div>
  );
}
