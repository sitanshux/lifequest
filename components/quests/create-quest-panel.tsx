"use client";

/**
 * CreateQuestPanel — modal dialog for creating a new quest.
 *
 * Uses a native <dialog> element for accessibility and focus trapping.
 * Validates on the client before calling the server action.
 * Defaults XP/Gold from difficulty selection via game logic.
 * Preserves all underlying form behavior and server actions.
 */

import { useState, useRef, useEffect } from "react";
import { createQuest } from "@/app/actions/create-quest";
import {
  QUEST_ATTRIBUTES,
  QUEST_DIFFICULTIES,
  baseRewardsForDifficulty,
  attributeLabel,
  difficultyLabel,
} from "@/lib/game/logic";
import type { Quest, QuestAttribute, QuestDifficulty } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface CreateQuestPanelProps {
  open: boolean;
  onClose: () => void;
  onCreated: (quest: Quest) => void;
}

export function CreateQuestPanel({ open, onClose, onCreated }: CreateQuestPanelProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<QuestAttribute>("intellect");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("medium");
  const [xpReward, setXpReward] = useState(100);
  const [goldReward, setGoldReward] = useState(25);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync defaults when difficulty changes
  useEffect(() => {
    const base = baseRewardsForDifficulty(difficulty);
    setXpReward(base.xp);
    setGoldReward(base.gold);
  }, [difficulty]);

  // Open/close dialog
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("intellect");
    setDifficulty("medium");
    setError(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createQuest({
        title: title.trim(),
        description: description.trim(),
        category,
        difficulty,
        xp_reward: xpReward,
        gold_reward: goldReward,
      });
      if (!result.success || !result.quest) {
        setError(result.error ?? "Failed to create quest.");
        return;
      }
      onCreated(result.quest);
      handleClose();
    } finally {
      setSubmitting(false);
    }
  };

  const ATTR_COLORS: Record<QuestAttribute, string> = {
    intellect:  "hsl(var(--attr-intellect))",
    strength:   "hsl(var(--attr-strength))",
    wellness:   "hsl(var(--attr-wellness))",
    creativity: "hsl(var(--attr-creativity))",
    discipline: "hsl(var(--attr-discipline))",
  };

  const DIFF_COLORS: Record<QuestDifficulty, string> = {
    easy:   "hsl(var(--diff-easy))",
    medium: "hsl(var(--diff-medium))",
    hard:   "hsl(var(--diff-hard))",
    epic:   "hsl(var(--diff-epic))",
  };

  const inputCls = cn(
    "w-full px-3 py-2.5 rounded-sm text-sm bg-[hsl(var(--surface-1))]",
    "border border-[hsl(var(--border-strong))] text-[hsl(var(--foreground))]",
    "placeholder:text-[hsl(var(--foreground-subtle))]",
    "focus:outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))]",
    "transition-colors duration-100"
  );

  const labelCls = "block text-[11px] font-bold tracking-wider uppercase mb-1.5 text-[hsl(var(--foreground-muted))]";

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className={cn(
        "fixed inset-0 z-50 m-auto",
        "w-full max-w-lg rounded-sm",
        "bg-[hsl(var(--surface-1))] border border-[hsl(var(--border-strong))]",
        "p-0 shadow-2xl",
        "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        "open:block"
      )}
      style={{ maxHeight: "90vh", overflowY: "auto" }}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[hsl(var(--border))]">
          <div>
            <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[hsl(var(--foreground-subtle))] block">
              Directives Folio
            </span>
            <h2
              className="text-xl sm:text-2xl font-bold tracking-tight text-[hsl(var(--foreground))] mt-0.5"
              style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
            >
              Enlist New Quest
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-sm text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-2))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 sm:px-6 py-5 space-y-4 sm:space-y-5">
          {/* Title */}
          <div>
            <label htmlFor="quest-title" className={labelCls}>
              Directive Title <span aria-hidden="true" className="text-[hsl(var(--xp))]">*</span>
            </label>
            <input
              id="quest-title"
              type="text"
              className={inputCls}
              placeholder="e.g. Read 20 pages of architecture literature"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="quest-description" className={labelCls}>
              Details & Context <span className="font-normal text-[hsl(var(--foreground-subtle))] lowercase">(optional)</span>
            </label>
            <textarea
              id="quest-description"
              className={cn(inputCls, "resize-none")}
              placeholder="Add key milestones, conditions, or clarifying notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Category / Attribute */}
          <div>
            <span className={labelCls}>Disciplinary Attribute</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUEST_ATTRIBUTES.map((attr) => {
                const isSelected = category === attr;
                const color = ATTR_COLORS[attr];

                return (
                  <button
                    key={attr}
                    type="button"
                    onClick={() => setCategory(attr)}
                    className={cn(
                      "px-3 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors duration-100 flex items-center justify-between border",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    )}
                    style={
                      isSelected
                        ? {
                            color: color,
                            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                            borderColor: color,
                          }
                        : {
                            color: "hsl(var(--foreground-muted))",
                            backgroundColor: "hsl(var(--surface-1))",
                            borderColor: "hsl(var(--border))",
                          }
                    }
                    aria-pressed={isSelected}
                  >
                    <span>{attributeLabel(attr)}</span>
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <span className={labelCls}>Quest Challenge Rating</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUEST_DIFFICULTIES.map((diff) => {
                const isSelected = difficulty === diff;
                const color = DIFF_COLORS[diff];

                return (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={cn(
                      "py-2 px-2.5 rounded-sm text-xs font-semibold uppercase tracking-wider transition-colors duration-100 text-center border",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    )}
                    style={
                      isSelected
                        ? {
                            color: color,
                            backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
                            borderColor: color,
                          }
                        : {
                            color: "hsl(var(--foreground-muted))",
                            backgroundColor: "hsl(var(--surface-1))",
                            borderColor: "hsl(var(--border))",
                          }
                    }
                    aria-pressed={isSelected}
                  >
                    {difficultyLabel(diff)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rewards row */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label htmlFor="quest-xp" className={labelCls}>
                XP Bounty
              </label>
              <div className="relative">
                <input
                  id="quest-xp"
                  type="number"
                  min="0"
                  max="1000"
                  className={cn(inputCls, "pr-8 font-semibold tabular-nums text-[hsl(var(--xp))]")}
                  value={xpReward}
                  onChange={(e) => setXpReward(Number(e.target.value))}
                />
                <span className="absolute right-2.5 top-2.5 text-xs font-bold text-[hsl(var(--xp))] select-none">
                  XP
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <label htmlFor="quest-gold" className={labelCls}>
                Gold Bounty
              </label>
              <div className="relative">
                <input
                  id="quest-gold"
                  type="number"
                  min="0"
                  max="500"
                  className={cn(inputCls, "pr-12 font-semibold tabular-nums text-[hsl(var(--gold))]")}
                  value={goldReward}
                  onChange={(e) => setGoldReward(Number(e.target.value))}
                />
                <span className="absolute right-2.5 top-2.5 text-xs font-bold text-[hsl(var(--gold))] select-none">
                  Gold
                </span>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="text-xs px-3 py-2 rounded-sm border"
              style={{
                color: "hsl(var(--destructive))",
                backgroundColor: "hsl(var(--destructive-muted))",
                borderColor: "hsl(var(--destructive) / 0.3)",
              }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-end gap-3 bg-[hsl(var(--surface-2)/0.4)]">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "px-4 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider",
              "text-[hsl(var(--foreground-muted))] border border-[hsl(var(--border))]",
              "hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--surface-1))]",
              "transition-colors duration-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            )}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className={cn(
              "px-5 py-2 rounded-sm text-xs font-semibold uppercase tracking-wider",
              "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
              "hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100 shadow-sm",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            )}
          >
            {submitting ? "Enlisting…" : "Enlist Quest"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
