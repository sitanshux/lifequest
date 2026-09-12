/**
 * LifeQuest — Centralized Game Logic
 *
 * Pure functions. No side effects. No Supabase calls.
 * Import these anywhere without circular dependency risk.
 *
 * IMPORTANT: XP thresholds, rank logic, and level formulas must
 * live HERE. Do not duplicate them in components or pages.
 */

import type { Rank, QuestAttribute, QuestDifficulty } from "./types";

// ============================================================
// XP / Level
// ============================================================

/**
 * XP required to reach `level` from level 0.
 * Uses a progressive curve: each level costs more XP than the last.
 */
export function xpThresholdForLevel(level: number): number {
  if (level <= 0) return 0;
  // Cumulative XP to reach this level
  // Curve: level 1 = 100, each subsequent level +50% over previous step
  let total = 0;
  let step = 100;
  for (let i = 1; i < level; i++) {
    total += step;
    step = Math.round(step * 1.15);
  }
  return total;
}

/**
 * XP required for the step between `level` and `level + 1`.
 */
export function xpForNextLevel(level: number): number {
  return xpThresholdForLevel(level + 1) - xpThresholdForLevel(level);
}

/**
 * Determine the current level from total XP.
 */
export function levelFromXp(totalXp: number): number {
  let level = 1;
  while (xpThresholdForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * Current level's XP progress as a fraction of the current step.
 */
export function xpProgressToNextLevel(totalXp: number): {
  level: number;
  currentLevelXp: number;   // XP earned within the current level
  requiredXp: number;       // XP needed to complete the current level
  percent: number;          // 0–100
} {
  const level = levelFromXp(totalXp);
  const levelStart = xpThresholdForLevel(level);
  const levelEnd = xpThresholdForLevel(level + 1);
  const currentLevelXp = totalXp - levelStart;
  const requiredXp = levelEnd - levelStart;
  const percent = Math.min(100, Math.round((currentLevelXp / requiredXp) * 100));
  return { level, currentLevelXp, requiredXp, percent };
}

// ============================================================
// Rank / Streak
// ============================================================

const RANK_THRESHOLDS: { rank: Rank; minStreak: number }[] = [
  { rank: "elite",    minStreak: 30 },
  { rank: "gold",     minStreak: 14 },
  { rank: "silver",   minStreak: 7  },
  { rank: "bronze",   minStreak: 3  },
  { rank: "unranked", minStreak: 0  },
];

/**
 * Determine rank from current streak (consecutive active days).
 */
export function rankFromStreak(streak: number): Rank {
  for (const { rank, minStreak } of RANK_THRESHOLDS) {
    if (streak >= minStreak) return rank;
  }
  return "unranked";
}

/**
 * Human-readable rank label.
 */
export function rankLabel(rank: Rank): string {
  const labels: Record<Rank, string> = {
    unranked: "Unranked",
    bronze:   "Bronze",
    silver:   "Silver",
    gold:     "Gold",
    elite:    "Elite",
  };
  return labels[rank];
}

/**
 * Next rank threshold (streaks needed to advance).
 * Returns null if at max rank.
 */
export function nextRankThreshold(streak: number): number | null {
  const current = rankFromStreak(streak);
  const currentIndex = RANK_THRESHOLDS.findIndex((r) => r.rank === current);
  if (currentIndex <= 0) return null; // already elite
  return RANK_THRESHOLDS[currentIndex - 1].minStreak;
}

/**
 * Calculate the new streak value given the current streak and
 * the date of the last activity.
 *
 * Rules:
 * - If no prior activity, streak becomes 1.
 * - If last activity was today (same UTC date), streak stays the same.
 * - If last activity was yesterday (UTC), streak increments by 1.
 * - If last activity was more than 1 day ago, streak resets to 1.
 *
 * Uses UTC dates throughout to avoid timezone drift.
 */
export function calculateNewStreak(
  currentStreak: number,
  lastActiveDateIso: string | null,
  nowIso?: string, // injectable for testing; defaults to current UTC date
): number {
  const todayStr = (nowIso ?? new Date().toISOString()).slice(0, 10);

  if (!lastActiveDateIso) return 1; // first ever activity

  const last = new Date(lastActiveDateIso + "T00:00:00Z");
  const today = new Date(todayStr + "T00:00:00Z");
  const diffMs = today.getTime() - last.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays === 0) return currentStreak; // already active today
  if (diffDays === 1) return currentStreak + 1; // consecutive day
  return 1; // missed a day — reset
}

/** Today's UTC date string YYYY-MM-DD */
export function todayUtcString(): string {
  return new Date().toISOString().slice(0, 10);
}

// ============================================================
// Quest Rewards (base values by difficulty)
// ============================================================

const DIFFICULTY_XP: Record<QuestDifficulty, number> = {
  easy:   40,
  medium: 100,
  hard:   200,
  epic:   400,
};

const DIFFICULTY_GOLD: Record<QuestDifficulty, number> = {
  easy:   10,
  medium: 25,
  hard:   50,
  epic:   100,
};

const DIFFICULTY_ATTRIBUTE: Record<QuestDifficulty, number> = {
  easy:   1,
  medium: 2,
  hard:   4,
  epic:   8,
};

/**
 * Base reward values for a given difficulty.
 * The server validates these against the stored quest record.
 * These are provided here for UI display purposes only.
 */
export function baseRewardsForDifficulty(difficulty: QuestDifficulty): {
  xp: number;
  gold: number;
  attribute: number;
} {
  return {
    xp:        DIFFICULTY_XP[difficulty],
    gold:      DIFFICULTY_GOLD[difficulty],
    attribute: DIFFICULTY_ATTRIBUTE[difficulty],
  };
}

// ============================================================
// Attribute display helpers
// ============================================================

const ATTRIBUTE_LABELS: Record<QuestAttribute, string> = {
  intellect:  "Intellect",
  strength:   "Strength",
  wellness:   "Wellness",
  creativity: "Creativity",
  discipline: "Discipline",
};

export function attributeLabel(attr: QuestAttribute): string {
  return ATTRIBUTE_LABELS[attr];
}

export const QUEST_ATTRIBUTES: QuestAttribute[] = [
  "intellect",
  "strength",
  "wellness",
  "creativity",
  "discipline",
];

export const QUEST_DIFFICULTIES: QuestDifficulty[] = [
  "easy",
  "medium",
  "hard",
  "epic",
];

const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  easy:   "Easy",
  medium: "Medium",
  hard:   "Hard",
  epic:   "Epic",
};

export function difficultyLabel(difficulty: QuestDifficulty): string {
  return DIFFICULTY_LABELS[difficulty];
}
