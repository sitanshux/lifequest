"use client";

/**
 * useToday — client-side hook for TODAY quest selection.
 *
 * TODAY is a focus layer over existing quests.
 * It uses localStorage to persist today's selection per user per day.
 *
 * IMPORTANT CONSTRAINTS:
 * - This does NOT control XP, Gold, completion, or any server state.
 * - Completing a quest uses the normal quest-completion flow regardless.
 * - The selection resets daily (keyed by YYYY-MM-DD date).
 * - The key includes the user ID to prevent cross-user pollution.
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_PREFIX = "lq_today";

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}_${userId}_${getTodayDateString()}`;
}

function readFromStorage(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}

function writeToStorage(key: string, ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage might be full or unavailable — degrade gracefully
  }
}

/**
 * Prune any old today keys for this user to keep localStorage clean.
 * Keeps only today's entry.
 */
function pruneOldEntries(userId: string): void {
  if (typeof window === "undefined") return;
  const todayKey = getStorageKey(userId);
  const prefix = `${STORAGE_PREFIX}_${userId}_`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const k = window.localStorage.key(i);
    if (k && k.startsWith(prefix) && k !== todayKey) {
      keysToRemove.push(k);
    }
  }
  keysToRemove.forEach((k) => window.localStorage.removeItem(k));
}

export interface UseTodayReturn {
  /** Quest IDs currently in TODAY for this user/day */
  todayQuestIds: string[];
  /** Add a quest to TODAY */
  addToToday: (questId: string) => void;
  /** Remove a quest from TODAY */
  removeFromToday: (questId: string) => void;
  /** Check if a quest is in TODAY */
  isInToday: (questId: string) => boolean;
  /** Whether the hook has hydrated from localStorage */
  isReady: boolean;
}

export function useToday(userId: string | undefined): UseTodayReturn {
  const [questIds, setQuestIds] = useState<string[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Hydrate from localStorage on mount / userId change
  useEffect(() => {
    if (!userId) {
      setQuestIds([]);
      setIsReady(true);
      return;
    }
    pruneOldEntries(userId);
    const key = getStorageKey(userId);
    const stored = readFromStorage(key);
    setQuestIds(stored);
    setIsReady(true);
  }, [userId]);

  const addToToday = useCallback(
    (questId: string) => {
      if (!userId) return;
      setQuestIds((prev) => {
        if (prev.includes(questId)) return prev;
        const next = [...prev, questId];
        writeToStorage(getStorageKey(userId), next);
        return next;
      });
    },
    [userId]
  );

  const removeFromToday = useCallback(
    (questId: string) => {
      if (!userId) return;
      setQuestIds((prev) => {
        const next = prev.filter((id) => id !== questId);
        writeToStorage(getStorageKey(userId), next);
        return next;
      });
    },
    [userId]
  );

  const isInToday = useCallback(
    (questId: string) => questIds.includes(questId),
    [questIds]
  );

  return { todayQuestIds: questIds, addToToday, removeFromToday, isInToday, isReady };
}
