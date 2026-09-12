import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  xpProgressToNextLevel,
  nextRankThreshold,
  attributeLabel,
  QUEST_ATTRIBUTES,
} from "@/lib/game/logic";
import { SignOutButton } from "@/components/character/sign-out-button";
import type { Profile, QuestAttribute } from "@/lib/game/types";

export const metadata = {
  title: "Character",
};

// ── Attribute colours matching globals.css tokens ──────────────────────────
const ATTR_CSS: Record<QuestAttribute, string> = {
  intellect:  "var(--attr-intellect)",
  strength:   "var(--attr-strength)",
  wellness:   "var(--attr-wellness)",
  creativity: "var(--attr-creativity)",
  discipline: "var(--attr-discipline)",
};

// Rank colours — distinct from XP colour (design.md §14)
const RANK_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  unranked: { label: "Unranked", color: "hsl(var(--foreground-subtle))",  bg: "hsl(var(--surface-2))" },
  bronze:   { label: "Bronze",   color: "hsl(38 60% 55%)",               bg: "hsl(38 60% 55% / 0.12)" },
  silver:   { label: "Silver",   color: "hsl(220 15% 70%)",              bg: "hsl(220 15% 70% / 0.12)" },
  gold:     { label: "Gold",     color: "hsl(var(--gold))",              bg: "hsl(var(--gold) / 0.12)" },
  elite:    { label: "Elite",    color: "hsl(var(--rank))",              bg: "hsl(var(--rank) / 0.12)" },
};

/**
 * Character — fully server-rendered RPG character sheet.
 *
 * Layout (design.md §15):
 *  1. Identity block — avatar, username, rank badge, streak, sign out action
 *  2. Level + XP bar — primary progression
 *  3. Stats row — Gold, Total XP, Streak, Rank (compact, asymmetric weights)
 *  4. Attributes — full breakdown with bars, values, and context
 *
 * No mutations on this page. Pure read. No client component needed.
 */
export default async function CharacterPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/auth/login");

  const userId = authData.user.id;
  const email = authData.user.email ?? "";

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, username, avatar_url, level, xp, gold, streak, rank, last_active_date, intellect, strength, wellness, creativity, discipline, created_at"
    )
    .eq("id", userId)
    .single();

  // ── Error state ─────────────────────────────────────────────────────────
  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
          Failed to load your character. Please refresh the page.
        </p>
      </div>
    );
  }

  const p = profile as Profile;

  // ── Derived values ────────────────────────────────────────────────────────
  const { level, currentLevelXp, requiredXp, percent } = xpProgressToNextLevel(p.xp);
  const rankInfo = RANK_BADGE[p.rank] ?? RANK_BADGE.unranked;
  const nextThreshold = nextRankThreshold(p.streak);
  const displayName = p.username || email.split("@")[0] || "Adventurer";

  // Attribute values for display
  const attrValues: Record<QuestAttribute, number> = {
    intellect:  p.intellect,
    strength:   p.strength,
    wellness:   p.wellness,
    creativity: p.creativity,
    discipline: p.discipline,
  };
  const maxAttr = Math.max(10, ...Object.values(attrValues));
  const totalAttrPoints = Object.values(attrValues).reduce((s, v) => s + v, 0);

  // Member since
  const memberSince = new Date(p.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-2xl mx-auto">

      {/* ── 1. IDENTITY BLOCK ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 pb-8 border-b border-[hsl(var(--border))]">
        <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
          {/* Avatar */}
          <div
            className="relative flex-shrink-0 w-16 h-16 rounded overflow-hidden"
            style={{ backgroundColor: "hsl(var(--surface-2))" }}
            aria-hidden="true"
          >
            {p.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={p.avatar_url}
                alt={`${displayName} avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              /* Monogram fallback — not a generic grey circle */
              <span
                className="absolute inset-0 flex items-center justify-center text-xl font-bold select-none"
                style={{
                  fontFamily: "var(--font-barlow)",
                  color: "hsl(var(--xp))",
                  letterSpacing: "-0.02em",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Identity text */}
          <div className="flex-1 min-w-0 pt-0.5">
            <h1
              className="text-2xl font-bold tracking-tight leading-none mb-1 truncate"
              style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--foreground))" }}
            >
              {displayName}
            </h1>

            {/* Rank badge — visually distinct from Level */}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-bold tracking-widest uppercase"
                style={{
                  color: rankInfo.color,
                  backgroundColor: rankInfo.bg,
                  letterSpacing: "0.1em",
                }}
              >
                {rankInfo.label} Rank
              </span>
              <span
                className="text-xs"
                style={{ color: "hsl(var(--foreground-subtle))" }}
              >
                {p.streak > 0
                  ? `${p.streak}-day streak`
                  : "No active streak"}
              </span>
            </div>

            <p
              className="text-xs mt-2"
              style={{ color: "hsl(var(--foreground-subtle))" }}
            >
              Playing since {memberSince}
            </p>
          </div>
        </div>

        {/* Sign out button */}
        <div className="flex-shrink-0 pt-0.5">
          <SignOutButton />
        </div>
      </div>

      {/* ── 2. LEVEL + XP — primary progression ───────────────────────────── */}
      <div className="pt-7 pb-7 border-b border-[hsl(var(--border))]">
        <div className="flex items-baseline justify-between mb-3">
          <span
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--foreground))" }}
          >
            Level {level}
          </span>
          <span className="text-xs tabular-nums" style={{ color: "hsl(var(--foreground-subtle))" }}>
            {currentLevelXp.toLocaleString()} / {requiredXp.toLocaleString()} XP
          </span>
        </div>

        {/* XP bar */}
        <div
          className="xp-bar-track"
          role="progressbar"
          aria-valuenow={currentLevelXp}
          aria-valuemin={0}
          aria-valuemax={requiredXp}
          aria-label={`Level ${level} XP: ${currentLevelXp} of ${requiredXp}`}
        >
          <div
            className="xp-bar-fill"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "hsl(var(--foreground-subtle))" }}>
          {(requiredXp - currentLevelXp).toLocaleString()} XP to Level {level + 1}
        </p>
      </div>

      {/* ── 3. STATS ROW — intentionally asymmetric weights ───────────────── */}
      {/* Gold gets different treatment than XP. Rank ≠ Level. design.md §14 */}
      <div className="pt-7 pb-7 border-b border-[hsl(var(--border))]">
        <h2
          className="text-[11px] font-semibold tracking-widest uppercase mb-4"
          style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
        >
          Stats
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4 sm:gap-x-4">
          {/* Gold — prominent, currency identity */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground-subtle))" }}>Gold</span>
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--gold))" }}
            >
              {p.gold.toLocaleString()}
            </span>
          </div>

          {/* Total XP — secondary to level */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground-subtle))" }}>Total XP</span>
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--xp))" }}
            >
              {p.xp.toLocaleString()}
            </span>
          </div>

          {/* Streak — consistency signal */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground-subtle))" }}>Streak</span>
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              style={{
                fontFamily: "var(--font-barlow)",
                color: p.streak >= 3
                  ? "hsl(var(--xp))"
                  : "hsl(var(--foreground))",
              }}
            >
              {p.streak}
            </span>
            <span className="text-[11px]" style={{ color: "hsl(var(--foreground-subtle))" }}>
              {p.streak === 1 ? "day" : "days"}
            </span>
          </div>

          {/* Rank — different styling, not a copy of Level */}
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground-subtle))" }}>Rank</span>
            <span
              className="text-2xl font-bold leading-none"
              style={{ fontFamily: "var(--font-barlow)", color: rankInfo.color }}
            >
              {rankInfo.label}
            </span>
            {nextThreshold !== null ? (
              <span className="text-[11px]" style={{ color: "hsl(var(--foreground-subtle))" }}>
                {nextThreshold - p.streak} day{nextThreshold - p.streak !== 1 ? "s" : ""} to next
              </span>
            ) : (
              <span className="text-[11px]" style={{ color: rankInfo.color }}>
                Max rank
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. ATTRIBUTES — full RPG character sheet section ─────────────── */}
      <div className="pt-7">
        <div className="flex items-baseline justify-between mb-4">
          <h2
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
          >
            Attributes
          </h2>
          <span className="text-xs tabular-nums" style={{ color: "hsl(var(--foreground-subtle))" }}>
            {totalAttrPoints} total points
          </span>
        </div>

        <div className="space-y-5">
          {QUEST_ATTRIBUTES.map((attr) => {
            const value = attrValues[attr];
            const pct = maxAttr > 0
              ? Math.min(100, Math.round((value / maxAttr) * 100))
              : 0;
            const cssColor = ATTR_CSS[attr];

            return (
              <div key={attr}>
                {/* Label row */}
                <div className="flex items-baseline justify-between mb-1.5">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: `hsl(${cssColor})` }}
                  >
                    {attributeLabel(attr)}
                  </span>
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{
                      fontFamily: "var(--font-barlow)",
                      color: value > 0
                        ? `hsl(${cssColor})`
                        : "hsl(var(--foreground-subtle))",
                    }}
                  >
                    {value}
                  </span>
                </div>

                {/* Bar — 8px tall, restrained radius, game-feel */}
                <div
                  role="meter"
                  aria-label={`${attributeLabel(attr)}: ${value} points`}
                  aria-valuenow={value}
                  aria-valuemin={0}
                  aria-valuemax={maxAttr}
                  className="w-full rounded-sm overflow-hidden"
                  style={{
                    height: "8px",
                    backgroundColor: "hsl(var(--surface-2))",
                  }}
                >
                  <div
                    className="h-full rounded-sm"
                    style={{
                      width: value > 0 ? `${pct}%` : "0%",
                      backgroundColor: `hsl(${cssColor})`,
                      transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                      minWidth: value > 0 ? "4px" : "0",
                    }}
                  />
                </div>

                {/* Context text — only when the attribute has any points */}
                {value === 0 && (
                  <p className="text-[11px] mt-1" style={{ color: "hsl(var(--foreground-subtle))" }}>
                    Complete {attributeLabel(attr)} quests to earn points.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Total attribute point context */}
        {totalAttrPoints === 0 && (
          <div className="mt-8 py-6 border border-dashed border-[hsl(var(--border))] rounded text-center">
            <p className="text-sm" style={{ color: "hsl(var(--foreground-muted))" }}>
              No attribute points yet.
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--foreground-subtle))" }}>
              Complete quests to earn Intellect, Strength, Wellness, Creativity, and Discipline.
            </p>
          </div>
        )}
      </div>

      {/* ── 5. ACCOUNT / SESSION ────────────────────────────────────────── */}
      <div className="pt-8 mt-8 border-t border-[hsl(var(--border))] flex items-center justify-between">
        <div>
          <span
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
          >
            Account Session
          </span>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--foreground-muted))" }}>
            {email || displayName}
          </p>
        </div>
        <SignOutButton />
      </div>

    </div>
  );
}
