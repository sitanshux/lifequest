"use client";

/**
 * DashboardClient — reactive dashboard that updates on quest completion.
 *
 * Visual System:
 * - Editorial Daily Command Center composition
 * 1. Level + XP Progression Track (Hero status with milestone ticks)
 * 2. Today's Campaign Quests (Prominent interactive directive board)
 * 3. Character Status Folio (Gold treasury, streak, rank progression, lifetime XP)
 * 4. Core Attributes Ledger (5 character attributes with tailored colors)
 *
 * All mutations remain strictly via server actions (`completeQuest`).
 */

import { useState, useCallback } from "react";
import { XpBar } from "@/components/dashboard/xp-bar";
import { QuestRow } from "@/components/quests/quest-row";
import { CompletionToast } from "@/components/quests/completion-toast";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { completeQuest } from "@/app/actions/complete-quest";
import { rankLabel, nextRankThreshold, attributeLabel } from "@/lib/game/logic";
import { useToday } from "@/lib/hooks/use-today";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { Profile, Quest, QuestCompletionResult, QuestAttribute, NewlyUnlockedAchievement } from "@/lib/game/types";

interface DashboardClientProps {
  profile: Profile;
  todayQuestCandidates: Quest[]; // all user quests, filtered by TODAY hook on client
}

const ATTR_ORDER: QuestAttribute[] = [
  "intellect",
  "strength",
  "wellness",
  "creativity",
  "discipline",
];

const ATTR_COLORS: Record<QuestAttribute, string> = {
  intellect:  "hsl(var(--attr-intellect))",
  strength:   "hsl(var(--attr-strength))",
  wellness:   "hsl(var(--attr-wellness))",
  creativity: "hsl(var(--attr-creativity))",
  discipline: "hsl(var(--attr-discipline))",
};

export function DashboardClient({ profile, todayQuestCandidates }: DashboardClientProps) {
  const [liveXp, setLiveXp] = useState(profile.xp);
  const [liveGold, setLiveGold] = useState(profile.gold);
  const [liveStreak, setLiveStreak] = useState(profile.streak);
  const [liveRank, setLiveRank] = useState(profile.rank);
  const [liveAttrs, setLiveAttrs] = useState<Record<QuestAttribute, number>>({
    intellect:  profile.intellect,
    strength:   profile.strength,
    wellness:   profile.wellness,
    creativity: profile.creativity,
    discipline: profile.discipline,
  });
  const [quests, setQuests] = useState<Quest[]>(todayQuestCandidates);
  const [toastResult, setToastResult] = useState<QuestCompletionResult | null>(null);
  const [toastTitle, setToastTitle] = useState("");
  const [achUnlocks, setAchUnlocks] = useState<NewlyUnlockedAchievement[]>([]);

  const { addToToday, removeFromToday, isInToday, isReady } =
    useToday(profile.id);

  const handleComplete = useCallback(
    async (questId: string): Promise<QuestCompletionResult> => {
      const result = await completeQuest(questId);
      if (result.success) {
        // Update live state from server result
        if (result.new_xp != null) setLiveXp(result.new_xp);
        if (result.new_gold != null) setLiveGold(result.new_gold);
        if (result.streak != null) setLiveStreak(result.streak);
        if (result.rank_after != null) setLiveRank(result.rank_after);
        if (result.attribute && result.attribute_gained != null) {
          setLiveAttrs((prev) => ({
            ...prev,
            [result.attribute!]: (prev[result.attribute!] ?? 0) + result.attribute_gained!,
          }));
        }
        // Optimistically mark quest as completed
        setQuests((prev) =>
          prev.map((q) =>
            q.id === questId
              ? { ...q, completed: true, completed_at: new Date().toISOString() }
              : q
          )
        );
      }
      return result;
    },
    []
  );

  const handleCompletionResult = useCallback(
    (result: QuestCompletionResult, quest: Quest) => {
      setToastTitle(quest.title);
      setToastResult(result);
      if (result.newly_unlocked && result.newly_unlocked.length > 0) {
        setAchUnlocks(result.newly_unlocked);
      }
    },
    []
  );

  // Today's quests visible on the dashboard
  const todayQuests = isReady
    ? quests.filter((q) => isInToday(q.id))
    : [];

  const activeTodayQuests = todayQuests.filter((q) => !q.completed);
  const completedTodayQuests = todayQuests.filter((q) => q.completed);

  // Max attribute value for relative bar scaling
  const maxAttr = Math.max(10, ...Object.values(liveAttrs));

  // Rank progression calculation
  const nextStreakReq = nextRankThreshold(liveStreak);
  const daysToNextRank = nextStreakReq !== null ? Math.max(0, nextStreakReq - liveStreak) : null;

  return (
    <>
      <CompletionToast
        result={toastResult}
        questTitle={toastTitle}
        onDismiss={() => setToastResult(null)}
      />

      {/* Achievement Toast — shown only on actual unlock */}
      {achUnlocks.length > 0 && (
        <AchievementToast
          achievements={achUnlocks}
          onDismiss={() => setAchUnlocks([])}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* ── 1. Priority One: Level + XP Progression Hero ── */}
        <section
          aria-labelledby="progression-heading"
          className="border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-5 sm:p-6 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.03)] bg-cartographic"
        >
          <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[hsl(var(--xp))]" aria-hidden="true" />
              <span
                id="progression-heading"
                className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))]"
              >
                            Campaign Dossier
              </span>
            </div>
            <div className="text-[11px] font-medium text-[hsl(var(--foreground-subtle))]">
              Campaign Day <strong className="text-[hsl(var(--foreground))] font-semibold">{liveStreak}</strong>
            </div>
          </div>

          <XpBar totalXp={liveXp} />
        </section>

        {/* ── Main 2-Column Command Grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ── 2. Priority Two: Today's Quests (Main interactive section) ── */}
          <section aria-labelledby="today-heading" className="lg:col-span-7 xl:col-span-8 space-y-4">
            <div className="flex items-baseline justify-between gap-4 border-b border-[hsl(var(--border))] pb-3">
              <div>
                <h2
                  id="today-heading"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]"
                  style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
                >
                  Today&apos;s Campaign Quests
                </h2>
                <p className="text-xs text-[hsl(var(--foreground-muted))] mt-0.5">
                  {isReady ? (
                    <>
                      <span className="font-semibold text-[hsl(var(--foreground))]">{activeTodayQuests.length}</span> active
                      {" · "}
                      <span className="font-semibold text-[hsl(var(--foreground))]">{completedTodayQuests.length}</span> completed today
                    </>
                  ) : (
                    "Consulting active directives…"
                  )}
                </p>
              </div>

              <Link
                href="/quests"
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-sm",
                  "text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]",
                  "border border-[hsl(var(--primary)/0.3)] hover:border-[hsl(var(--primary))]",
                  "bg-[hsl(var(--primary)/0.04)] hover:bg-[hsl(var(--primary)/0.08)]",
                  "transition-colors duration-100 flex items-center gap-1 flex-shrink-0",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                )}
              >
                All Quests ({quests.length}) →
              </Link>
            </div>

            {!isReady ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-sm border border-[hsl(var(--border))] skeleton"
                  />
                ))}
              </div>
            ) : todayQuests.length === 0 ? (
              <div className="border border-dashed border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-1))] p-8 sm:p-10 text-center rounded-sm space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--foreground-subtle))]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3
                    className="text-base font-semibold text-[hsl(var(--foreground))]"
                    style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
                  >
                    No Directives Assigned to Today&apos;s Campaign
                  </h3>
                  <p className="text-xs text-[hsl(var(--foreground-muted))] max-w-sm mx-auto leading-relaxed">
                    Select quests from your master log to direct your daily focus and claim experience & gold upon completion.
                  </p>
                </div>
                <div className="pt-2">
                  <Link
                    href="/quests"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  >
                    Assign Quests from Log →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active quests */}
                {activeTodayQuests.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeTodayQuests.map((quest) => (
                      <QuestRow
                        key={quest.id}
                        quest={quest}
                        inToday={true}
                        onComplete={handleComplete}
                        onAddToToday={addToToday}
                        onRemoveFromToday={removeFromToday}
                        onCompletionResult={handleCompletionResult}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-5 text-center rounded-sm">
                    <p className="text-xs font-medium text-[hsl(var(--success))]">
                      ✓ All today&apos;s campaign directives have been completed!
                    </p>
                  </div>
                )}

                {/* Completed today section */}
                {completedTodayQuests.length > 0 && (
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-1.5">
                      <span
                        className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))]"
                      >
                        Completed Today ({completedTodayQuests.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {completedTodayQuests.map((quest) => (
                        <QuestRow
                          key={quest.id}
                          quest={quest}
                          inToday={true}
                          onComplete={handleComplete}
                          onAddToToday={addToToday}
                          onRemoveFromToday={removeFromToday}
                          onCompletionResult={handleCompletionResult}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Right Column: Character Status & Attributes (lg:col-span-5 xl:col-span-4) ── */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* ── 3. Priority Three: Character Status Ledger (Gold / Streak / Rank / XP) ── */}
            <section
              aria-labelledby="status-folio-heading"
              className="border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-5 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2.5">
                <h3
                  id="status-folio-heading"
                  className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))]"
                >
                  Character Status // Standing
                </h3>
                <span className="text-[10px] font-semibold tracking-wider uppercase text-[hsl(var(--foreground-subtle))]">
                  Folio
                </span>
              </div>

              {/* Treasury (Gold) */}
              <div className="space-y-1.5 bg-[hsl(var(--surface-2)/0.5)] p-3 rounded-sm border border-[hsl(var(--border))]">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--foreground-subtle))]">
                    Treasury
                  </span>
                  <Link
                    href="/shop"
                    className="text-[11px] font-semibold text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                  >
                    Visit Shop →
                  </Link>
                </div>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl font-bold tabular-nums leading-none text-[hsl(var(--gold))]"
                    style={{ fontFamily: "var(--font-barlow), sans-serif" }}
                  >
                    {liveGold.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--gold))]">
                    Gold
                  </span>
                </div>
                <p className="text-[11px] text-[hsl(var(--foreground-subtle))] leading-tight">
                  Available currency for equipment & rewards.
                </p>
              </div>

              {/* Streak & Rank Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Active Streak */}
                <div className="border border-[hsl(var(--border))] p-3 rounded-sm bg-[hsl(var(--surface-1))] space-y-1 min-w-0">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--foreground-subtle))] block">
                    Streak
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-lg sm:text-xl font-bold tabular-nums leading-none text-[hsl(var(--foreground))]"
                      style={{ fontFamily: "var(--font-barlow), sans-serif" }}
                    >
                      {liveStreak}
                    </span>
                    <span className="text-xs text-[hsl(var(--foreground-muted))] font-medium">
                      {liveStreak === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--foreground-subtle))] leading-tight">
                    Consecutive active campaign days.
                  </p>
                </div>

                {/* Heraldic Rank */}
                <div className="border border-[hsl(var(--border))] p-3 rounded-sm bg-[hsl(var(--surface-1))] space-y-1 min-w-0">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--foreground-subtle))] block">
                    Standing
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-lg sm:text-xl font-bold leading-none text-[hsl(var(--rank))]"
                      style={{ fontFamily: "var(--font-barlow), sans-serif" }}
                    >
                      {rankLabel(liveRank)}
                    </span>
                  </div>
                  <p className="text-[10px] text-[hsl(var(--foreground-subtle))] leading-tight truncate">
                    {daysToNextRank !== null ? (
                      <span>{daysToNextRank}d to next rank tier</span>
                    ) : (
                      <span>Apex rank attained</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Lifetime Experience */}
              <div className="border-t border-[hsl(var(--border))] pt-3 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-[hsl(var(--foreground-subtle))] block">
                    Total Experience
                  </span>
                  <span className="text-[11px] text-[hsl(var(--foreground-subtle))]">
                    Lifetime campaign points
                  </span>
                </div>
                <span
                  className="text-lg font-bold tabular-nums text-[hsl(var(--xp))]"
                  style={{ fontFamily: "var(--font-barlow), sans-serif" }}
                >
                  {liveXp.toLocaleString()} XP
                </span>
              </div>
            </section>

            {/* ── 4. Priority Four: Core Attributes Ledger ── */}
            <section
              aria-labelledby="attributes-ledger-heading"
              className="border border-[hsl(var(--border))] bg-[hsl(var(--surface-1))] p-5 rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-2.5">
                <div>
                  <h3
                    id="attributes-ledger-heading"
                    className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))]"
                  >
                    Core Attributes // Progression
                  </h3>
                </div>
                <Link
                  href="/character"
                  className="text-[11px] font-semibold text-[hsl(var(--primary))] hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[hsl(var(--ring))]"
                >
                  Sheet →
                </Link>
              </div>

              <div className="space-y-3">
                {ATTR_ORDER.map((attr) => {
                  const value = liveAttrs[attr];
                  const pct = Math.min(100, Math.round((value / maxAttr) * 100));
                  const attrColor = ATTR_COLORS[attr];

                  return (
                    <div key={attr} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: attrColor }}
                            aria-hidden="true"
                          />
                          <span className="font-semibold text-[hsl(var(--foreground))]">
                            {attributeLabel(attr)}
                          </span>
                        </div>
                        <span
                          className="font-bold tabular-nums text-[hsl(var(--foreground))]"
                          style={{ fontFamily: "var(--font-barlow), sans-serif" }}
                        >
                          {value}
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-sm overflow-hidden bg-[hsl(var(--surface-2))] border border-[hsl(var(--border))]">
                        <div
                          className="h-full rounded-sm transition-all duration-500 ease-out"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: attrColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
