"use client";

/**
 * CreateQuestPanel — slide-in panel for creating a new quest.
 *
 * Uses a <dialog> element for proper accessibility and focus trapping.
 * Validates on the client before calling the server action.
 * Shows per-field errors and a global success/error state.
 * Defaults XP/Gold from difficulty selection via game logic.
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
    if (!title.trim()) { setError("Title is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const result = await createQuest({ title: title.trim(), description: description.trim(), category, difficulty, xp_reward: xpReward, gold_reward: goldReward });
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
    intellect: "var(--attr-intellect)",
    strength: "var(--attr-strength)",
    wellness: "var(--attr-wellness)",
    creativity: "var(--attr-creativity)",
    discipline: "var(--attr-discipline)",
  };

  const DIFF_COLORS: Record<QuestDifficulty, string> = {
    easy: "var(--diff-easy)",
    medium: "var(--diff-medium)",
    hard: "var(--diff-hard)",
    epic: "var(--diff-epic)",
  };

  const inputCls = cn(
    "w-full px-3 py-2 rounded text-sm bg-[hsl(var(--surface-2))]",
    "border border-[hsl(var(--border))] text-[hsl(var(--foreground))]",
    "placeholder:text-[hsl(var(--foreground-subtle))]",
    "focus:outline-none focus:border-[hsl(var(--xp))] focus:ring-1 focus:ring-[hsl(var(--xp)/0.4)]",
    "transition-colors duration-100"
  );

  const labelCls = "block text-xs font-medium mb-1.5 text-[hsl(var(--foreground-muted))]";

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      className={cn(
        "fixed inset-0 z-50 m-auto",
        "w-full max-w-md rounded-lg",
        "bg-[hsl(var(--surface-1))] border border-[hsl(var(--border-strong))]",
        "p-0 shadow-2xl",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "open:block"
      )}
      style={{ maxHeight: "90vh", overflowY: "auto" }}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
          <h2
            className="text-base font-bold tracking-tight"
            style={{ fontFamily: "var(--font-barlow)" }}
          >
            New Quest
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded text-[hsl(var(--foreground-subtle))] hover:text-[hsl(var(--foreground))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="quest-title" className={labelCls}>Title <span aria-hidden="true" className="text-[hsl(var(--xp))]">*</span></label>
            <input
              id="quest-title"
              type="text"
              className={inputCls}
              placeholder="What do you need to do?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="quest-description" className={labelCls}>Description</label>
            <textarea
              id="quest-description"
              className={cn(inputCls, "resize-none")}
              placeholder="Optional details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          {/* Category */}
          <div>
            <span className={labelCls}>Attribute</span>
            <div className="flex flex-wrap gap-2">
              {QUEST_ATTRIBUTES.map((attr) => (
                <button
                  key={attr}
                  type="button"
                  onClick={() => setCategory(attr)}
                  className={cn(
                    "px-3 py-1.5 rounded-sm text-xs font-medium transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                    "border"
                  )}
                  style={
                    category === attr
                      ? {
                          color: `hsl(${ATTR_COLORS[attr]})`,
                          backgroundColor: `hsl(${ATTR_COLORS[attr]} / 0.15)`,
                          borderColor: `hsl(${ATTR_COLORS[attr]} / 0.5)`,
                        }
                      : {
                          color: "hsl(var(--foreground-subtle))",
                          backgroundColor: "transparent",
                          borderColor: "hsl(var(--border))",
                        }
                  }
                  aria-pressed={category === attr}
                >
                  {attributeLabel(attr)}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <span className={labelCls}>Difficulty</span>
            <div className="flex gap-2">
              {QUEST_DIFFICULTIES.map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setDifficulty(diff)}
                  className={cn(
                    "flex-1 py-1.5 rounded-sm text-xs font-medium transition-colors duration-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                    "border"
                  )}
                  style={
                    difficulty === diff
                      ? {
                          color: `hsl(${DIFF_COLORS[diff]})`,
                          backgroundColor: `hsl(${DIFF_COLORS[diff]} / 0.12)`,
                          borderColor: `hsl(${DIFF_COLORS[diff]} / 0.4)`,
                        }
                      : {
                          color: "hsl(var(--foreground-subtle))",
                          backgroundColor: "transparent",
                          borderColor: "hsl(var(--border))",
                        }
                  }
                  aria-pressed={difficulty === diff}
                >
                  {difficultyLabel(diff)}
                </button>
              ))}
            </div>
          </div>

          {/* Rewards row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="quest-xp" className={labelCls}>XP Reward</label>
              <input
                id="quest-xp"
                type="number"
                min="0"
                max="1000"
                className={inputCls}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
              />
            </div>
            <div>
              <label htmlFor="quest-gold" className={labelCls}>Gold Reward</label>
              <input
                id="quest-gold"
                type="number"
                min="0"
                max="500"
                className={inputCls}
                value={goldReward}
                onChange={(e) => setGoldReward(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="text-sm px-3 py-2 rounded border"
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
        <div className="px-5 py-4 border-t border-[hsl(var(--border))] flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "px-4 py-2 rounded text-sm font-medium",
              "text-[hsl(var(--foreground-muted))] border border-[hsl(var(--border))]",
              "hover:border-[hsl(var(--border-strong))] hover:text-[hsl(var(--foreground))]",
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
              "px-4 py-2 rounded text-sm font-semibold",
              "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
              "hover:bg-[hsl(var(--primary-hover))] transition-colors duration-100",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
            )}
          >
            {submitting ? "Creating…" : "Create Quest"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
