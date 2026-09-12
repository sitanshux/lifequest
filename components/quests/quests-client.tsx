"use client";

/**
 * QuestsClient — the interactive quests experience.
 *
 * Manages:
 * - TODAY / ALL QUESTS tab state
 * - Quest list (optimistic updates on completion)
 * - TODAY localStorage via useToday()
 * - Create quest panel
 * - Completion toast
 *
 * All mutations go through server actions. Client never touches XP/Gold.
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
  const allQuests = [...quests].sort(
    (a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0)
  );

  const activeTodayQuests = todayQuests.filter((q) => !q.completed);
  const completedTodayQuests = todayQuests.filter((q) => q.completed);

  const TABS: { id: Tab; label: string }[] = [
    { id: "today", label: "TODAY" },
    { id: "all",   label: "ALL QUESTS" },
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

      <div className="max-w-3xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 pb-4 mb-0">
          <div>
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-barlow)" }}
            >
              Quests
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "hsl(var(--foreground-muted))" }}>
              {allQuests.filter(q => !q.completed).length} active &middot; {allQuests.filter(q => q.completed).length} completed
            </p>
          </div>
          <button
            onClick={() => setPanelOpen(true)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded text-sm font-semibold",
              "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
              "hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
              "mt-0.5"
            )}
            aria-label="Create new quest"
          >
            <Plus size={14} strokeWidth={2.5} />
            New Quest
          </button>
        </div>

        {/* Tab strip — border-bottom style, not pills */}
        <div
          role="tablist"
          aria-label="Quest views"
          className="flex border-b border-[hsl(var(--border))] mb-5"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              id={`tab-${id}`}
              aria-controls={`panel-${id}`}
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-4 py-2.5 text-sm font-semibold tracking-wide transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-inset",
                activeTab === id
                  ? "border-b-2 border-[hsl(var(--xp))] text-[hsl(var(--foreground))] -mb-px"
                  : "text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TODAY panel */}
        <div
          role="tabpanel"
          id="panel-today"
          aria-labelledby="tab-today"
          hidden={activeTab !== "today"}
        >
          {!isReady ? (
            // Hydrating from localStorage
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded border border-[hsl(var(--border))] skeleton" />
              ))}
            </div>
          ) : todayQuests.length === 0 ? (
            <EmptyState
              title="No quests selected for today."
              description="Switch to All Quests and add some to your daily focus."
              action={<button onClick={() => setActiveTab("all")} className="text-sm font-medium text-[hsl(var(--xp))] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] rounded">Browse All Quests</button>}
            />
          ) : (
            <div className="space-y-2">
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
              {completedTodayQuests.length > 0 && (
                <>
                  {activeTodayQuests.length > 0 && (
                    <div className="pt-2 pb-1">
                      <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.09em" }}>Completed</span>
                    </div>
                  )}
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
                </>
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
        >
          {allQuests.length === 0 ? (
            <EmptyState
              title="Your quest log is empty."
              description="Create your first quest to begin your journey."
              action={
                <button
                  onClick={() => setPanelOpen(true)}
                  className={cn(
                    "text-sm px-4 py-2 rounded border border-[hsl(var(--border))] font-medium",
                    "text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border-strong))]",
                    "transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                  )}
                >
                  Create your first quest
                </button>
              }
            />
          ) : (
            <div className="space-y-2">
              {allQuests.map((quest) => (
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
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground-muted))" }}>
        {title}
      </p>
      <p className="text-xs" style={{ color: "hsl(var(--foreground-subtle))" }}>
        {description}
      </p>
      {action}
    </div>
  );
}
