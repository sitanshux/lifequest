import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// Reads auth session at runtime — block prerendering.
export const instant = false;

export const metadata = {
  title: "LifeQuest — Your real life is the game",
  description:
    "Turn your real-world responsibilities into an RPG-style progression system. Complete quests, earn XP and Gold, level up your life.",
};

export default async function LandingPage() {
  // Redirect authenticated users directly to the dashboard
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* ── Header ── */}
      <header className="px-6 py-5 flex items-center justify-between border-b border-[hsl(var(--border))]">
        <span
          className="text-base font-bold tracking-tight"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          Life<span style={{ color: "hsl(var(--xp))" }}>Quest</span>
        </span>

        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-sm px-4 py-2 rounded border border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border-strong))] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-sm px-4 py-2 rounded font-medium text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            Begin your quest
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-start justify-center px-6 md:px-16 lg:px-24 py-20 max-w-4xl">
        {/* Eyebrow — restrained, not a pill */}
        <p
          className="text-xs font-semibold tracking-widest uppercase mb-6"
          style={{ color: "hsl(var(--xp))", letterSpacing: "0.12em" }}
        >
          RPG Productivity System
        </p>

        {/* Primary heading — intentional asymmetry, not centered */}
        <h1
          className="text-5xl md:text-7xl font-bold leading-none tracking-tight mb-6"
          style={{
            fontFamily: "var(--font-barlow)",
            color: "hsl(var(--foreground))",
          }}
        >
          Your real life<br />
          <span style={{ color: "hsl(var(--xp))" }}>is the game.</span>
        </h1>

        <p
          className="text-base md:text-lg mb-10 max-w-lg"
          style={{ color: "hsl(var(--foreground-muted))", lineHeight: "1.7" }}
        >
          Complete real-world quests. Earn XP and Gold. Track your Attributes,
          Streak, and Rank. Level up your character — and your life.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/auth/sign-up"
            className="inline-flex items-center justify-center px-6 py-3 rounded font-semibold text-sm text-[hsl(var(--primary-foreground))] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            Create your character
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center px-6 py-3 rounded font-medium text-sm text-[hsl(var(--foreground-muted))] border border-[hsl(var(--border))] hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))] transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            Sign in
          </Link>
        </div>

        {/* Attribute pills — deliberately informational, not decorative */}
        <div className="flex flex-wrap gap-2 mt-14" aria-label="Attributes tracked in LifeQuest">
          {[
            { label: "Intellect",  color: "var(--attr-intellect)"  },
            { label: "Strength",   color: "var(--attr-strength)"   },
            { label: "Wellness",   color: "var(--attr-wellness)"   },
            { label: "Creativity", color: "var(--attr-creativity)" },
            { label: "Discipline", color: "var(--attr-discipline)" },
          ].map(({ label, color }) => (
            <span
              key={label}
              className="text-xs font-medium px-2.5 py-1 rounded-sm"
              style={{
                color: `hsl(${color})`,
                backgroundColor: `hsl(${color} / 0.12)`,
                border: `1px solid hsl(${color} / 0.25)`,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="px-6 py-5 border-t border-[hsl(var(--border))] flex items-center justify-between">
        <span
          className="text-xs font-bold tracking-tight"
          style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--foreground-subtle))" }}
        >
          Life<span style={{ color: "hsl(var(--xp))" }}>Quest</span>
        </span>
        <p className="text-xs max-w-none" style={{ color: "hsl(var(--foreground-subtle))" }}>
          A personal RPG for real life.
        </p>
      </footer>
    </div>
  );
}
