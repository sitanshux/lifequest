/**
 * Auth layout — wraps /auth/* pages.
 * Centered, dark, minimal. LifeQuest branding visible.
 * No sidebar, no application chrome.
 */

import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* Minimal header with wordmark */}
      <header className="px-6 py-5 border-b border-[hsl(var(--border))]">
        <Link
          href="/"
          className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded"
        >
          <span
            className="text-base font-bold tracking-tight"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            Life<span style={{ color: "hsl(var(--xp))" }}>Quest</span>
          </span>
        </Link>
      </header>

      {/* Centered auth content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>

      {/* Minimal footer */}
      <footer className="px-6 py-4 text-center text-xs text-[hsl(var(--foreground-subtle))]">
        Your real life is the game.
      </footer>
    </div>
  );
}
