"use client";

/**
 * AchievementToast — shown when a quest completion unlocks one or more achievements.
 *
 * Design rules (design.md §18, §19):
 * - No excessive glow effects.
 * - Short, purposeful animation only.
 * - Respects prefers-reduced-motion.
 * - Only shown when an achievement is ACTUALLY newly unlocked.
 * - Never shown on page load.
 * - Multiple unlocks shown sequentially, one at a time.
 */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { NewlyUnlockedAchievement } from "@/lib/game/types";

interface AchievementToastProps {
  achievements: NewlyUnlockedAchievement[];
  onDismiss: () => void;
}

export function AchievementToast({ achievements, onDismiss }: AchievementToastProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const current = achievements[index] ?? null;

  useEffect(() => {
    if (!current) return;

    // Small delay so the toast animates in after the completion toast
    const show = setTimeout(() => setVisible(true), 600);
    const hide = setTimeout(() => {
      setVisible(false);
      // Advance to next or dismiss after fade-out
      setTimeout(() => {
        if (index + 1 < achievements.length) {
          setIndex((i) => i + 1);
          setVisible(true);
        } else {
          onDismiss();
        }
      }, 400);
    }, 4000);

    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [current, index, achievements.length, onDismiss]);

  if (!current) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label={`Achievement unlocked: ${current.name}`}
      className={cn(
        "fixed bottom-44 md:bottom-20 right-4 md:right-6 z-50 w-72",
        "rounded border bg-[hsl(var(--surface-2))]",
        "border-[hsl(var(--gold)/0.5)]",
        "px-4 py-3",
        "transition-all duration-300",
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      )}
      style={{ willChange: "opacity, transform" }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2 mb-1.5">
        {/* Achievement marker — deliberate, not a generic icon */}
        <span
          className="text-[11px] font-bold tracking-widest uppercase flex-shrink-0"
          style={{ color: "hsl(var(--gold))", letterSpacing: "0.1em" }}
        >
          Achievement
        </span>
        <div
          className="flex-1 h-px"
          style={{ backgroundColor: "hsl(var(--gold) / 0.2)" }}
        />
      </div>

      {/* Achievement name */}
      <p
        className="text-sm font-bold leading-snug"
        style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--foreground))" }}
      >
        {current.name}
      </p>

      {/* Description */}
      <p className="text-xs mt-1" style={{ color: "hsl(var(--foreground-subtle))" }}>
        {current.description}
      </p>

      {/* Multiple indicator */}
      {achievements.length > 1 && (
        <p
          className="text-[11px] mt-1.5"
          style={{ color: "hsl(var(--foreground-subtle))" }}
        >
          {index + 1} of {achievements.length}
        </p>
      )}
    </div>
  );
}
