"use client";

/**
 * QuestRow — a single quest item.
 *
 * Visual hierarchy:
 * 1. completion control (tactile checkbox)
 * 2. quest title (editorial serif typography)
 * 3. description (readable muted text)
 * 4. attribute / category (colored tag)
 * 5. difficulty badge
 * 6. XP & Gold rewards (scannable antique gold values)
 * 7. secondary actions (+ Today / – Today)
 *
 * Visual states:
 * - active: actionable, clear borders, subtle hover
 * - inToday: highlighted with amber left indicator
 * - completed: archived record, subdued but clearly legible, reward tokens preserved
 */

import { useState } from "react";
import { cn } from "@/lib/utils";
import { attributeLabel, difficultyLabel } from "@/lib/game/logic";
import type { Quest, QuestCompletionResult } from "@/lib/game/types";

interface QuestRowProps {
  quest: Quest;
  inToday: boolean;
  onComplete: (questId: string) => Promise<QuestCompletionResult>;
  onAddToToday: (questId: string) => void;
  onRemoveFromToday: (questId: string) => void;
  onCompletionResult: (result: QuestCompletionResult, quest: Quest) => void;
}

const ATTRIBUTE_COLORS: Record<string, string> = {
  intellect:  "hsl(var(--attr-intellect))",
  strength:   "hsl(var(--attr-strength))",
  wellness:   "hsl(var(--attr-wellness))",
  creativity: "hsl(var(--attr-creativity))",
  discipline: "hsl(var(--attr-discipline))",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy:   "hsl(var(--diff-easy))",
  medium: "hsl(var(--diff-medium))",
  hard:   "hsl(var(--diff-hard))",
  epic:   "hsl(var(--diff-epic))",
};

export function QuestRow({
  quest,
  inToday,
  onComplete,
  onAddToToday,
  onRemoveFromToday,
  onCompletionResult,
}: QuestRowProps) {
  const [completing, setCompleting] = useState(false);

  const handleComplete = async () => {
    if (quest.completed || completing) return;
    setCompleting(true);
    try {
      const result = await onComplete(quest.id);
      onCompletionResult(result, quest);
    } finally {
      setCompleting(false);
    }
  };

  const attrColor = ATTRIBUTE_COLORS[quest.category] ?? "hsl(var(--foreground-muted))";
  const diffColor = DIFFICULTY_COLORS[quest.difficulty] ?? "hsl(var(--foreground-muted))";

  return (
    <div
      className={cn(
        "group relative flex items-start gap-3.5 px-4 py-3.5 rounded-sm transition-colors duration-150",
        quest.completed
          ? "border border-[hsl(var(--border))] bg-[hsl(var(--surface-2)/0.6)] opacity-85"
          : inToday
            ? "border border-[hsl(var(--xp)/0.45)] bg-[hsl(var(--surface-1))] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
            : "border border-[hsl(var(--border))] hover:border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-1))] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
      )}
    >
      {/* TODAY left accent bar */}
      {inToday && !quest.completed && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm"
          style={{ backgroundColor: "hsl(var(--xp))" }}
        />
      )}

      {/* 1. Tactile completion control */}
      <button
        onClick={handleComplete}
        disabled={quest.completed || completing}
        aria-label={quest.completed ? `Completed: ${quest.title}` : `Complete: ${quest.title}`}
        className={cn(
          "mt-0.5 w-5 h-5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center",
          "transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          quest.completed
            ? "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]"
            : completing
              ? "border-[hsl(var(--xp))] bg-[hsl(var(--xp)/0.08)] animate-pulse"
              : "border-[hsl(var(--border-strong))] bg-white hover:border-[hsl(var(--xp))] hover:bg-[hsl(var(--xp)/0.06)]"
        )}
      >
        {quest.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {completing && (
          <span className="w-2.5 h-2.5 rounded-full border-2 border-[hsl(var(--xp))] border-t-transparent animate-spin" />
        )}
      </button>

      {/* 2. Quest body */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "text-[15px] font-semibold leading-snug tracking-[-0.01em]",
            quest.completed
              ? "line-through text-[hsl(var(--foreground-muted))]"
              : "text-[hsl(var(--foreground))]"
          )}
          style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
        >
          {quest.title}
        </h4>

        {quest.description && (
          <p
            className={cn(
              "text-xs mt-1 line-clamp-2 leading-relaxed",
              quest.completed ? "text-[hsl(var(--foreground-subtle))]" : "text-[hsl(var(--foreground-muted))]"
            )}
          >
            {quest.description}
          </p>
        )}

        {/* 3. Metadata & rewards row */}
        <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
          {/* Category */}
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider border"
            style={{
              color: attrColor,
              borderColor: `color-mix(in srgb, ${attrColor} 30%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${attrColor} 8%, transparent)`,
            }}
          >
            {attributeLabel(quest.category)}
          </span>

          {/* Difficulty */}
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider border"
            style={{
              color: diffColor,
              borderColor: `color-mix(in srgb, ${diffColor} 30%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${diffColor} 8%, transparent)`,
            }}
          >
            {difficultyLabel(quest.difficulty)}
          </span>

          <span className="text-[hsl(var(--border-strong))] text-xs select-none">·</span>

          {/* XP Reward */}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums text-[hsl(var(--xp))]"
            style={{ fontFamily: "var(--font-barlow), sans-serif" }}
          >
            +{quest.xp_reward} XP
          </span>

          {/* Gold Reward */}
          <span
            className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums text-[hsl(var(--gold))]"
            style={{ fontFamily: "var(--font-barlow), sans-serif" }}
          >
            +{quest.gold_reward} Gold
          </span>
        </div>
      </div>

      {/* 4. Secondary Action: Today toggle */}
      {!quest.completed && (
        <div className="flex-shrink-0 self-center">
          {inToday ? (
            <button
              onClick={() => onRemoveFromToday(quest.id)}
              aria-label={`Remove "${quest.title}" from Today`}
              title="Remove from Today"
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-sm",
                "text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--foreground))]",
                "border border-[hsl(var(--border))] hover:border-[hsl(var(--border-strong))]",
                "bg-[hsl(var(--surface-2)/0.6)] hover:bg-[hsl(var(--surface-2))]",
                "transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              )}
            >
              – Today
            </button>
          ) : (
            <button
              onClick={() => onAddToToday(quest.id)}
              aria-label={`Add "${quest.title}" to Today`}
              title="Add to Today"
              className={cn(
                "text-[11px] font-medium px-2.5 py-1 rounded-sm",
                "text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]",
                "border border-[hsl(var(--primary)/0.3)] hover:border-[hsl(var(--primary))]",
                "bg-[hsl(var(--primary)/0.05)] hover:bg-[hsl(var(--primary)/0.1)]",
                "transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              )}
            >
              + Today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
