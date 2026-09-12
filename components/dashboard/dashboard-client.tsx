"use client";

/**
 * DashboardClient — reactive dashboard that updates on quest completion.
 *
 * Receives profile + today's quests from the server.
 * On quest completion, updates local XP/Gold state immediately from
 * the server action result (no page reload needed).
 * XP bar animates to new value.
 */

import { useState, useCallback } from "react";
import { XpBar } from "@/components/dashboard/xp-bar";
import { StatCard } from "@/components/dashboard/stat-card";
import { QuestRow } from "@/components/quests/quest-row";
import { CompletionToast } from "@/components/quests/completion-toast";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { completeQuest } from "@/app/actions/complete-quest";
import { rankLabel, attributeLabel } from "@/lib/game/logic";
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

  // Max attribute value for relative bar scaling
  const maxAttr = Math.max(10, ...Object.values(liveAttrs));

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

      <div className="max-w-5xl mx-auto space-y-8">
        {/* ── 1. Level + XP — primary progression ── */}
        <section aria-labelledby="progression-heading">
          <XpBar totalXp={liveXp} className="max-w-lg" />
        </section>

        {/* ── 2. Stats row ── */}
        <section aria-labelledby="stats-heading">
          <h2
            id="stats-heading"
            className="text-[11px] font-semibold tracking-widest uppercase mb-3"
            style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
          >
            Stats
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              label="Gold"
              value={liveGold.toLocaleString()}
              valueColor="hsl(var(--gold))"
            />
            <StatCard
              label="Streak"
              value={`${liveStreak}d`}
              valueColor={liveStreak >= 7 ? "hsl(var(--xp))" : undefined}
              sub={liveStreak === 1 ? "day" : "days"}
            />
            <StatCard
              label="Rank"
              value={rankLabel(liveRank)}
              valueColor="hsl(var(--rank))"
            />
            <StatCard
              label="Total XP"
              value={liveXp.toLocaleString()}
              valueColor="hsl(var(--xp))"
            />
          </div>
        </section>

        {/* ── 3. Attributes ── */}
        <section aria-labelledby="attributes-heading">
          <h2
            id="attributes-heading"
            className="text-[11px] font-semibold tracking-widest uppercase mb-3"
            style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
          >
            Attributes
          </h2>
          <div className="space-y-2.5 max-w-sm">
            {ATTR_ORDER.map((attr) => {
              const value = liveAttrs[attr];
              const pct = Math.min(100, Math.round((value / maxAttr) * 100));
              return (
                <div key={attr} className="flex items-center gap-3">
                  <span
                    className="text-xs font-medium w-20 flex-shrink-0"
                    style={{ color: "hsl(var(--foreground-muted))" }}
                  >
                    {attributeLabel(attr)}
                  </span>
                  <div className="flex-1 xp-bar-track">
                    <div
                      className="h-full rounded-sm transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: ATTR_COLORS[attr],
                      }}
                    />
                  </div>
                  <span
                    className="text-xs font-medium w-6 text-right tabular-nums"
                    style={{ color: "hsl(var(--foreground-subtle))" }}
                  >
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. TODAY quests ── */}
        <section aria-labelledby="today-heading">
          <div className="flex items-baseline justify-between mb-3">
            <h2
              id="today-heading"
              className="text-[11px] font-semibold tracking-widest uppercase"
              style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
            >
              Today
            </h2>
            <Link
              href="/quests"
              className={cn(
                "text-xs font-medium",
                "text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--foreground-muted))]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded"
              )}
            >
              All Quests →
            </Link>
          </div>

          {!isReady ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 rounded border border-[hsl(var(--border))] skeleton"
                />
              ))}
            </div>
          ) : todayQuests.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm" style={{ color: "hsl(var(--foreground-subtle))" }}>
                No quests selected for today.{" "}
                <Link
                  href="/quests"
                  className="text-[hsl(var(--xp))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded"
                >
                  Add some →
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayQuests.map((quest) => (
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
          )}
        </section>
      </div>
    </>
  );
}
