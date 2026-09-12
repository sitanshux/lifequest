"use client";

/**
 * XpBar — animated XP progress bar.
 *
 * Smoothly interpolates from 0 to the current percent on mount.
 * On XP changes (quest completion), animates to the new value.
 * Respects prefers-reduced-motion.
 * Does NOT perform level-up animation — that's handled by the completion toast.
 */

import { useEffect, useState } from "react";
import { xpProgressToNextLevel } from "@/lib/game/logic";

interface XpBarProps {
  totalXp: number;
  className?: string;
}

export function XpBar({ totalXp, className }: XpBarProps) {
  const { level, currentLevelXp, requiredXp, percent } = xpProgressToNextLevel(totalXp);
  const [displayPercent, setDisplayPercent] = useState(0);

  useEffect(() => {
    // Short rAF delay lets CSS transition do the work
    const t = requestAnimationFrame(() => setDisplayPercent(percent));
    return () => cancelAnimationFrame(t);
  }, [percent]);

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between mb-2">
        <span
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--foreground))" }}
          aria-label={`Level ${level}`}
        >
          Level {level}
        </span>
        <span className="text-xs" style={{ color: "hsl(var(--foreground-subtle))" }}>
          {currentLevelXp.toLocaleString()} / {requiredXp.toLocaleString()} XP
        </span>
      </div>

      <div
        className="xp-bar-track"
        role="progressbar"
        aria-valuenow={currentLevelXp}
        aria-valuemin={0}
        aria-valuemax={requiredXp}
        aria-label={`XP progress: ${currentLevelXp} of ${requiredXp}`}
      >
        <div
          className="xp-bar-fill"
          style={{ width: `${displayPercent}%` }}
        />
      </div>
    </div>
  );
}
