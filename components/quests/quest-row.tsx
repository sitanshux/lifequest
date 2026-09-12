"use client";

/**
 * QuestRow — a single quest item.
 *
 * Visual states:
 * - completed: muted, strikethrough title, check mark
 * - inToday: subtle amber left accent
 * - active (default): normal
 *
 * Actions exposed (conditional on state):
 * - Complete quest
 * - Add to Today / Remove from Today
 *
 * Completing is disabled once completed or while in-flight.
 * Does not scale on hover. No pill clutter.
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
        "relative flex items-start gap-3 px-4 py-3 rounded transition-colors duration-100",
        "border",
        quest.completed
          ? "border-[hsl(var(--border))] opacity-50"
          : inToday
            ? "border-[hsl(var(--xp)/0.35)] bg-[hsl(var(--xp)/0.04)]"
            : "border-[hsl(var(--border))] hover:border-[hsl(var(--border-strong))]"
      )}
    >
      {/* TODAY indicator bar */}
      {inToday && !quest.completed && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r"
          style={{ backgroundColor: "hsl(var(--xp))" }}
        />
      )}

      {/* Complete button */}
      <button
        onClick={handleComplete}
        disabled={quest.completed || completing}
        aria-label={quest.completed ? `${quest.title} — completed` : `Complete: ${quest.title}`}
        className={cn(
          "mt-0.5 w-5 h-5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center",
          "transition-colors duration-100",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
          quest.completed
            ? "border-[hsl(var(--success))] bg-[hsl(var(--success)/0.15)]"
            : completing
              ? "border-[hsl(var(--xp))] animate-pulse"
              : "border-[hsl(var(--border-strong))] hover:border-[hsl(var(--xp))]"
        )}
      >
        {quest.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
            <path d="M1 4L3.5 6.5L9 1.5" stroke="hsl(var(--success))" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {completing && (
          <span className="w-2.5 h-2.5 rounded-full border-2 border-[hsl(var(--xp))] border-t-transparent animate-spin" />
        )}
      </button>

      {/* Quest content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium leading-snug",
            quest.completed && "line-through text-[hsl(var(--foreground-subtle))]"
          )}
          style={{ color: quest.completed ? undefined : "hsl(var(--foreground))" }}
        >
          {quest.title}
        </p>

        {quest.description && (
          <p
            className="text-xs mt-0.5 line-clamp-1"
            style={{ color: "hsl(var(--foreground-subtle))" }}
          >
            {quest.description}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          <span className="text-[11px] font-medium" style={{ color: attrColor }}>
            {attributeLabel(quest.category)}
          </span>
          <span className="text-[11px] font-medium" style={{ color: diffColor }}>
            {difficultyLabel(quest.difficulty)}
          </span>
          <span className="text-[11px]" style={{ color: "hsl(var(--xp))" }}>
            +{quest.xp_reward} XP
          </span>
          <span className="text-[11px]" style={{ color: "hsl(var(--gold))" }}>
            +{quest.gold_reward} Gold
          </span>
        </div>
      </div>

      {/* TODAY action */}
      {!quest.completed && (
        <div className="flex-shrink-0 self-center">
          {inToday ? (
            <button
              onClick={() => onRemoveFromToday(quest.id)}
              aria-label="Remove from Today"
              title="Remove from Today"
              className={cn(
                "text-[11px] font-medium px-2 py-1 rounded-sm",
                "text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--foreground-muted))]",
                "border border-transparent hover:border-[hsl(var(--border))]",
                "transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              )}
            >
              – Today
            </button>
          ) : (
            <button
              onClick={() => onAddToToday(quest.id)}
              aria-label="Add to Today"
              title="Add to Today"
              className={cn(
                "text-[11px] font-medium px-2 py-1 rounded-sm",
                "text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--xp))]",
                "border border-transparent hover:border-[hsl(var(--xp)/0.4)]",
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
