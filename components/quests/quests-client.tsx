"use client";

/**
 * QuestsClient — the interactive quests experience.
 *
 * Visual System:
 * - Editorial Quest Board hierarchy
 * - Newsreader serif headings & clean tabular meta
 * - Clear distinction between active actionable quests and completed archive records
 * - Thematic RPG empty states
 *
 * All mutations go through server actions. Client never touches XP/Gold directly.
 */

import { useState, useCallback } from "react";
import { useToday } from "@/lib/hooks/use-today";
import { completeQuest } from "@/app/actions/complete-quest";
import { QuestRow } from "@/components/quests/quest-row";
import { CompletionToast } from "@/components/quests/completion-toast";
import { CreateQuestPanel } from "@/components/quests/create-quest-panel";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Quest, QuestCompletionResult, NewlyUnlockedAchievement } from "@/lib/game/types";

type Tab = "today" | "all";

interface QuestsClientProps {
  initialQuests: Quest[];
  userId: string;
  onProgressUpdate?: (result: QuestCompletionResult) => void;
}

export function QuestsClient({ initialQuests, userId }: QuestsClientProps) {
  const [quests, setQuests] = useState<Quest[]>(initialQuests);
  const [activeTab, setActiveTab] = useState<Tab>("today");
  const [panelOpen, setPanelOpen] = useState(false);
  const [toastResult, setToastResult] = useState<QuestCompletionResult | null>(null);
  const [toastTitle, setToastTitle] = useState("");
  const [achUnlocks, setAchUnlocks] = useState<NewlyUnlockedAchievement[]>([]);

  const { addToToday, removeFromToday, isInToday, isReady } =
    useToday(userId);

  // Optimistically mark quest completed in local state
  const handleComplete = useCallback(
    async (questId: string): Promise<QuestCompletionResult> => {
      const result = await completeQuest(questId);
      if (result.success) {
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
      // Show achievement toast if any were newly unlocked
      if (result.newly_unlocked && result.newly_unlocked.length > 0) {
        setAchUnlocks(result.newly_unlocked);
      }
    },
    []
  );

  const handleQuestCreated = useCallback((quest: Quest) => {
    setQuests((prev) => [quest, ...prev]);
  }, []);

  // Compute views
  const todayQuests = quests.filter((q) => isInToday(q.id));
  const activeTodayQuests = todayQuests.filter((q) => !q.completed);
  const completedTodayQuests = todayQuests.filter((q) => q.completed);

  const activeAllQuests = quests.filter((q) => !q.completed);
  const completedAllQuests = quests.filter((q) => q.completed);

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "today", label: "TODAY", count: todayQuests.length },
    { id: "all",   label: "ALL QUESTS", count: quests.length },
  ];

  return (
    <>
      {/* Create Quest Panel */}
      <CreateQuestPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onCreated={handleQuestCreated}
      />

      {/* Completion Toast */}
      <CompletionToast
        result={toastResult}
        questTitle={toastTitle}
        onDismiss={() => setToastResult(null)}
      />

      {/* Achievement Toast — only shown when achievements are newly unlocked */}
      {achUnlocks.length > 0 && (
        <AchievementToast
          achievements={achUnlocks}
          onDismiss={() => setAchUnlocks([])}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Editorial Quest Board Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[hsl(var(--border))] pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))] block">
              Master Directives
            </span>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
            >
              Quest Board
            </h1>
            <p className="text-xs text-[hsl(var(--foreground-muted))]">
              <span className="font-semibold text-[hsl(var(--foreground))]">{activeAllQuests.length}</span> active directives
              {" · "}
              <span className="font-semibold text-[hsl(var(--foreground))]">{completedAllQuests.length}</span> completed records
            </p>
          </div>

          <button
            onClick={() => setPanelOpen(true)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider",
              "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
              "hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100 shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
              "self-start sm:self-end"
            )}
            aria-label="Create new quest"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Quest
          </button>
        </div>

        {/* Tab strip — editorial border-bottom style */}
        <div
          role="tablist"
          aria-label="Quest views"
          className="flex border-b border-[hsl(var(--border))]"
        >
          {TABS.map(({ id, label, count }) => (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-controls={`panel-${id}`}
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-4 py-2.5 text-xs font-bold tracking-wider uppercase transition-colors duration-100 flex items-center gap-2",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-inset",
                activeTab === id
                  ? "border-b-2 border-[hsl(var(--xp))] text-[hsl(var(--foreground))] -mb-px"
                  : "text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              <span>{label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-sm text-[10px] tabular-nums font-semibold",
                  activeTab === id
                    ? "bg-[hsl(var(--xp)/0.12)] text-[hsl(var(--xp))]"
                    : "bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground-subtle))]"
                )}
              >
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* TODAY panel */}
        <div
          role="tabpanel"
          id="panel-today"
          aria-labelledby="tab-today"
          hidden={activeTab !== "today"}
          className="space-y-4"
        >
          {!isReady ? (
            // Hydrating from localStorage
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-sm border border-[hsl(var(--border))] skeleton" />
              ))}
            </div>
          ) : todayQuests.length === 0 ? (
            <EmptyState
              title="No Directives Assigned to Today's Campaign"
              description="Choose objectives from your master quest log to focus your efforts and claim rewards."
              action={
                <button
                  onClick={() => setActiveTab("all")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                >
                  Browse All Quests ({quests.length}) →
                </button>
              }
            />
          ) : (
            <div className="space-y-3">
              {/* Active Today Quests */}
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

              {/* Completed Today Quests */}
              {completedTodayQuests.length > 0 && (
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-1.5">
                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))]">
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
        </div>

        {/* ALL QUESTS panel */}
        <div
          role="tabpanel"
          id="panel-all"
          aria-labelledby="tab-all"
          hidden={activeTab !== "all"}
          className="space-y-4"
        >
          {quests.length === 0 ? (
            <EmptyState
              title="Your Quest Log is Empty"
              description="Pen your first real-life directive to initiate your adventurer's journey."
              action={
                <button
                  onClick={() => setPanelOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-sm bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  Pen your first quest
                </button>
              }
            />
          ) : (
            <div className="space-y-4">
              {/* Active quests group */}
              {activeAllQuests.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-1.5">
                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))]">
                      Active Directives ({activeAllQuests.length})
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {activeAllQuests.map((quest) => (
                      <QuestRow
                        key={quest.id}
                        quest={quest}
                        inToday={isInToday(quest.id)}
                        onComplete={handleComplete}
                        onAddToToday={addToToday}
                        onRemoveFromToday={removeFromToday}
                        onCompletionResult={handleCompletionResult}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed records group */}
              {completedAllQuests.length > 0 && (
                <div className="pt-3 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-1.5">
                    <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))]">
                      Archived & Completed ({completedAllQuests.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {completedAllQuests.map((quest) => (
                      <QuestRow
                        key={quest.id}
                        quest={quest}
                        inToday={isInToday(quest.id)}
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
        </div>
      </div>
    </>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-1))] p-8 sm:p-12 text-center rounded-sm space-y-3">
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
          {title}
        </h3>
        <p className="text-xs text-[hsl(var(--foreground-muted))] max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
