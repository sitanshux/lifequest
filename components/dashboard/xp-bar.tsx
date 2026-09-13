"use client";

/**
 * XpBar — editorial RPG progression track.
 *
 * Smoothly interpolates from 0 to the current percent on mount.
 * On XP changes (quest completion), animates to the new value.
 * Respects prefers-reduced-motion.
 * Shows:
 *  - current Level with editorial typography & tier badge
 *  - current XP / required XP with percentage
 *  - progression track with milestone ticks at 25%, 50%, 75%
 *  - XP needed to reach next level
 */

import { useEffect, useState } from "react";
import { xpProgressToNextLevel } from "@/lib/game/logic";
import { cn } from "@/lib/utils";

interface XpBarProps {
  totalXp: number;
  className?: string;
}

export function XpBar({ totalXp, className }: XpBarProps) {
  const { level, currentLevelXp, requiredXp, percent } = xpProgressToNextLevel(totalXp);
  const [displayPercent, setDisplayPercent] = useState(0);

  const xpNeeded = Math.max(0, requiredXp - currentLevelXp);

  useEffect(() => {
    // Short rAF delay lets CSS transition do the work
    const t = requestAnimationFrame(() => setDisplayPercent(percent));
    return () => cancelAnimationFrame(t);
  }, [percent]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Level and XP readout */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            className="text-2xl sm:text-3xl font-bold tracking-tight text-[hsl(var(--foreground))]"
            style={{ fontFamily: "var(--font-newsreader), Georgia, serif" }}
            aria-label={`Level ${level}`}
          >
            Level {level}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-sm border border-[hsl(var(--xp)/0.35)] bg-[hsl(var(--xp)/0.08)] text-[hsl(var(--xp))]">
            Tier {Math.floor((level - 1) / 5) + 1}
          </span>
        </div>

        <div className="flex flex-col sm:items-end text-left sm:text-right">
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-sm font-bold tabular-nums text-[hsl(var(--foreground))]"
              style={{ fontFamily: "var(--font-barlow), sans-serif" }}
            >
              {currentLevelXp.toLocaleString()}
            </span>
            <span className="text-xs text-[hsl(var(--foreground-subtle))]">
              / {requiredXp.toLocaleString()} XP
            </span>
            <span
              className="text-xs font-semibold text-[hsl(var(--xp))] ml-1"
              style={{ fontFamily: "var(--font-barlow), sans-serif" }}
            >
              ({percent}%)
            </span>
          </div>
          <span className="text-[11px] text-[hsl(var(--foreground-subtle))]">
            {xpNeeded.toLocaleString()} XP needed for Level {level + 1}
          </span>
        </div>
      </div>

      {/* Progression Track */}
      <div className="space-y-1.5">
        <div
          className="relative h-3 w-full rounded-sm overflow-hidden border border-[hsl(var(--border-strong))] bg-[hsl(var(--surface-2))]"
          role="progressbar"
          aria-valuenow={currentLevelXp}
          aria-valuemin={0}
          aria-valuemax={requiredXp}
          aria-label={`XP progress: ${currentLevelXp} of ${requiredXp} XP`}
        >
          {/* Milestone tick marks at 25%, 50%, 75% */}
          <div className="absolute inset-0 pointer-events-none z-10">
            <div className="w-px h-full bg-[hsl(var(--border-strong)/0.8)] left-[25%] absolute" />
            <div className="w-px h-full bg-[hsl(var(--border-strong)/0.8)] left-[50%] absolute" />
            <div className="w-px h-full bg-[hsl(var(--border-strong)/0.8)] left-[75%] absolute" />
          </div>

          {/* Animated Gold Fill */}
          <div
            className="h-full bg-[hsl(var(--xp))] transition-all duration-500 ease-out"
            style={{ width: `${displayPercent}%` }}
          />
        </div>

        {/* Milestone Tick Labels */}
        <div className="flex justify-between items-center px-0.5 text-[9px] font-semibold text-[hsl(var(--foreground-subtle))] tracking-widest uppercase">
          <span>0%</span>
          <span className="pl-2">25%</span>
          <span>50%</span>
          <span className="pr-2">75%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
