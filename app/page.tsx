import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Flame, Coins, Trophy, CheckCircle2, ArrowRight } from "lucide-react";

// Reads auth session at runtime — block prerendering.
export const instant = false;

export const metadata = {
  title: "LifeQuest — Your real life is the game",
  description:
    "Turn your real-world responsibilities into an RPG-style progression system. Complete quests, earn XP and Gold, level up your life.",
};

const ATTRIBUTES = [
  { name: "Intellect",  action: "Learn",   color: "var(--attr-intellect)",  score: 420, max: 500, percent: 84 },
  { name: "Strength",   action: "Train",   color: "var(--attr-strength)",   score: 280, max: 500, percent: 56 },
  { name: "Wellness",   action: "Recover", color: "var(--attr-wellness)",   score: 350, max: 500, percent: 70 },
  { name: "Creativity", action: "Create",  color: "var(--attr-creativity)", score: 210, max: 500, percent: 42 },
  { name: "Discipline", action: "Execute", color: "var(--attr-discipline)", score: 510, max: 600, percent: 85 },
];

export default async function LandingPage() {
  // Redirect authenticated users directly to the dashboard
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-screen flex flex-col selection:bg-[hsl(var(--surface-3))] selection:text-[hsl(var(--foreground))]"
      style={{ backgroundColor: "hsl(var(--background))" }}
    >
      {/* ── Top Header Navigation ── */}
      <header className="px-4 sm:px-6 md:px-12 lg:px-16 py-3.5 sm:py-5 flex items-center justify-between gap-2 sm:gap-4 border-b border-[hsl(var(--border))] bg-[#FAF8F3]/80 backdrop-blur-sm sticky top-0 z-30">
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded-sm"
        >
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rotate-45 bg-[hsl(var(--gold))] inline-block shrink-0" />
          <span
            className="text-sm sm:text-base font-semibold tracking-wider font-serif uppercase text-[hsl(var(--foreground))]"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
          >
            LifeQuest
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link
            href="/auth/login"
            className="text-[11px] sm:text-xs uppercase tracking-wider font-medium px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-sm border border-[hsl(var(--border))] bg-white text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--border-strong))] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] whitespace-nowrap"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-sm text-white bg-[hsl(var(--primary))] hover:bg-[#2A548A] active:bg-[#234572] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] whitespace-nowrap"
          >
            <span className="hidden sm:inline">Begin your quest</span>
            <span className="sm:hidden">Start quest</span>
          </Link>
        </div>
      </header>

      {/* ── Main Hero Composition ── */}
      <main className="flex-1 flex flex-col justify-center">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-20 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            
            {/* ── LEFT COLUMN: Editorial Hero Copy & CTAs ── */}
            <div className="lg:col-span-5 flex flex-col items-start">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm border border-[hsl(var(--border))] bg-white mb-6">
                <span className="w-1.5 h-1.5 rotate-45 bg-[hsl(var(--gold))]" />
                <span className="text-[11px] font-semibold tracking-widest uppercase text-[hsl(var(--gold))] font-mono">
                  REAL-LIFE RPG
                </span>
              </div>

              {/* Large editorial headline with unique style font */}
              <h1
                className="text-4xl sm:text-5xl lg:text-[3.65rem] font-bold tracking-tight text-[hsl(var(--foreground))] leading-[1.12] mb-6"
                style={{ fontFamily: "'Cinzel', var(--font-newsreader), Georgia, serif" }}
              >
                Start your life <br />
                <span className="text-[hsl(var(--primary))]">adventure.</span>
              </h1>

              {/* Supporting description */}
              <p className="text-base text-[hsl(var(--foreground-muted))] leading-relaxed mb-8 max-w-md">
                Turn your everyday responsibilities into an authentic character progression
                system. Complete real-world quests, level up core attributes, maintain daily streaks,
                and earn Gold in a server-authoritative RPG world.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Link
                  href="/auth/sign-up"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-sm font-semibold text-xs uppercase tracking-wider text-white bg-[hsl(var(--primary))] hover:bg-[#2A548A] active:bg-[#234572] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] shadow-sm"
                >
                  <span>Create your character</span>
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-sm font-medium text-xs uppercase tracking-wider text-[hsl(var(--foreground))] bg-white border border-[hsl(var(--border))] hover:bg-[hsl(var(--surface-2))] hover:border-[hsl(var(--border-strong))] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Composed LifeQuest Character Chronicle Preview ── */}
            <div className="lg:col-span-7 flex flex-col w-full relative">
              
              {/* Main Folio Card: Character Vitals & Progression */}
              <div className="border border-[hsl(var(--border))] bg-white rounded-sm p-6 sm:p-7 shadow-[0_2px_12px_rgba(23,35,61,0.04)] relative z-10">
                
                {/* Folio Masthead Ribbon */}
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-[hsl(var(--border))] text-[11px] font-mono text-[hsl(var(--foreground-subtle))] uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />
                    <span>CHRONICLE FOLIO // RECORD #0482</span>
                  </div>
                  <span className="text-[hsl(var(--gold))] font-semibold">STAGE: VETERAN</span>
                </div>

                {/* Character Title & Level Header */}
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-6">
                  <div>
                    <h2
                      className="text-2xl sm:text-3xl font-semibold tracking-tight text-[hsl(var(--foreground))] font-serif"
                      style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
                    >
                      Scholar of the Realm
                    </h2>
                    <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">
                      Class: Polymath • Active Campaign
                    </p>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs uppercase tracking-wider text-[hsl(var(--foreground-subtle))] font-mono font-medium">
                      LEVEL
                    </span>
                    <span className="text-3xl font-bold font-mono text-[hsl(var(--foreground))] tracking-tight">
                      14
                    </span>
                  </div>
                </div>

                {/* XP Progression Bar */}
                <div className="mb-6 p-4 rounded-sm bg-[#FAF8F3] border border-[hsl(var(--border))]">
                  <div className="flex justify-between items-baseline mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-[hsl(var(--foreground))]">
                        EXPERIENCE POINTS
                      </span>
                      <span className="text-[10px] font-mono text-[hsl(var(--gold))] font-medium">
                        (Level 14 → 15)
                      </span>
                    </div>
                    <span className="text-xs font-mono font-semibold text-[hsl(var(--foreground))]">
                      1,850 / 2,400 <span className="text-[hsl(var(--foreground-muted))] font-normal">XP</span>
                    </span>
                  </div>
                  {/* Bar Track */}
                  <div className="w-full h-2 rounded-sm bg-[hsl(var(--xp-muted))] overflow-hidden">
                    <div
                      className="h-full bg-[hsl(var(--xp))] rounded-sm transition-all duration-300"
                      style={{ width: "77%" }}
                      role="progressbar"
                      aria-valuenow={77}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[hsl(var(--foreground-subtle))] mt-1.5">
                    <span>Current Tier: 77%</span>
                    <span>550 XP to Level 15</span>
                  </div>
                </div>

                {/* 3 Key Stats Columns */}
                <div className="grid grid-cols-3 gap-3 border-t border-[hsl(var(--border))] pt-4">
                  {/* GOLD */}
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-mono text-[hsl(var(--foreground-subtle))] flex items-center gap-1">
                      <Coins size={11} className="text-[hsl(var(--gold))]" />
                      GOLD
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[hsl(var(--gold))] mt-1">
                      385
                    </span>
                  </div>

                  {/* STREAK */}
                  <div className="flex flex-col border-l border-[hsl(var(--border))] pl-3">
                    <span className="text-[10px] uppercase tracking-widest font-mono text-[hsl(var(--foreground-subtle))] flex items-center gap-1">
                      <Flame size={11} className="text-[#A84332]" />
                      STREAK
                    </span>
                    <span className="text-xl sm:text-2xl font-bold font-mono text-[hsl(var(--foreground))] mt-1">
                      7 <span className="text-xs font-normal text-[hsl(var(--foreground-muted))]">DAYS</span>
                    </span>
                  </div>

                  {/* RANK */}
                  <div className="flex flex-col border-l border-[hsl(var(--border))] pl-3">
                    <span className="text-[10px] uppercase tracking-widest font-mono text-[hsl(var(--foreground-subtle))] flex items-center gap-1">
                      <Trophy size={11} className="text-[#9E672C]" />
                      RANK
                    </span>
                    <span className="text-lg sm:text-xl font-semibold font-serif uppercase tracking-wider text-[hsl(var(--foreground))] mt-1">
                      BRONZE
                    </span>
                  </div>
                </div>
              </div>

              {/* Overlapping Secondary Layer: Attributes Ledger & Sample Quest Slip */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3 sm:-mt-2 relative z-20 sm:px-3">
                
                {/* Left: Compact Five Attributes Ledger */}
                <div className="md:col-span-7 bg-[#FAF8F3] border border-[hsl(var(--border))] rounded-sm p-4 shadow-sm">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-[hsl(var(--border))]">
                    <span className="text-[10px] uppercase tracking-widest font-mono font-semibold text-[hsl(var(--foreground))]">
                      CORE ATTRIBUTES
                    </span>
                    <span className="text-[10px] font-mono text-[hsl(var(--foreground-subtle))]">
                      5 METRICS
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {ATTRIBUTES.map((attr) => (
                      <div key={attr.name} className="flex flex-col">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-[hsl(var(--foreground))] text-[11px]">
                            {attr.name}
                          </span>
                          <span className="font-mono text-[10px] text-[hsl(var(--foreground-muted))]">
                            {attr.score} <span className="text-[hsl(var(--foreground-subtle))]">pts</span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-sm bg-white border border-[hsl(var(--border))] overflow-hidden">
                          <div
                            className="h-full rounded-sm"
                            style={{
                              width: `${attr.percent}%`,
                              backgroundColor: `hsl(${attr.color})`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Asymmetric Active Quest Slip */}
                <div className="md:col-span-5 bg-white border border-[hsl(var(--border-strong))] rounded-sm p-4 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[9.5px] uppercase tracking-wider font-mono font-bold text-[hsl(var(--primary))]">
                        ACTIVE QUEST
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.5 rounded-sm bg-[#FAF8F3] border border-[hsl(var(--border))] text-[hsl(var(--foreground-muted))]">
                        TODAY
                      </span>
                    </div>

                    <h3
                      className="text-sm font-semibold tracking-tight text-[hsl(var(--foreground))] font-serif leading-snug mt-1"
                      style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
                    >
                      Complete 45 min of focused study
                    </h3>

                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "hsl(var(--attr-intellect))" }} />
                      <span className="text-[10px] font-medium text-[hsl(var(--foreground-muted))]">
                        Intellect • Medium
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-[hsl(var(--foreground-subtle))] block mb-1.5">
                      REWARDS
                    </span>
                    <div className="flex items-center justify-between text-xs font-mono font-semibold">
                      <span className="text-[hsl(var(--xp))]">
                        +100 XP
                      </span>
                      <span className="text-[hsl(var(--gold))]">
                        +25 Gold
                      </span>
                      <CheckCircle2 size={13} className="text-[hsl(var(--foreground-subtle))]" />
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

        {/* ── Compact Five Attributes Strip ── */}
        <section
          aria-label="Core RPG Attributes"
          className="border-t border-[hsl(var(--border))] bg-white/70 backdrop-blur-sm py-8 px-6 md:px-12 lg:px-16"
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[hsl(var(--foreground-subtle))] font-semibold">
                THE FIVE CORE ATTRIBUTES
              </span>
              <span className="text-xs text-[hsl(var(--foreground-muted))] font-serif italic">
                Every quest fuels intentional growth.
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {ATTRIBUTES.map(({ name, action, color }) => (
                <div
                  key={name}
                  className="bg-[#FAF8F3] border border-[hsl(var(--border))] p-3 rounded-sm flex items-center gap-3 transition-colors hover:border-[hsl(var(--border-strong))]"
                >
                  <span
                    className="w-2.5 h-2.5 rotate-45 shrink-0"
                    style={{ backgroundColor: `hsl(${color})` }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold text-[hsl(var(--foreground))] tracking-tight truncate">
                      {name}
                    </span>
                    <span className="text-[11px] text-[hsl(var(--foreground-muted))] font-mono">
                      — {action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="px-6 md:px-12 lg:px-16 py-6 border-t border-[hsl(var(--border))] bg-[#FAF8F3] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[hsl(var(--foreground-subtle))]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rotate-45 bg-[hsl(var(--gold))] inline-block shrink-0" />
          <span
            className="font-serif font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider text-xs"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
          >
            LifeQuest
          </span>
          <span>• Personal Character Dossier</span>
        </div>
        <p className="text-center sm:text-right font-mono text-[11px]">
          Hackathon Edition • Server-Authoritative Architecture
        </p>
      </footer>
    </div>
  );
}
