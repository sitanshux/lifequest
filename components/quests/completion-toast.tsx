"use client";

/**
 * CompletionToast — Quest completion reward feedback.
 *
 * Shows: +XP, +Gold, +Attribute, level-up if applicable.
 * Auto-dismisses after 4 seconds.
 * Respects prefers-reduced-motion.
 * Does NOT show level-up celebration unless a real level-up occurred.
 */

import { useEffect, useState } from "react";
import { attributeLabel } from "@/lib/game/logic";
import type { QuestCompletionResult } from "@/lib/game/types";
import { cn } from "@/lib/utils";

interface CompletionToastProps {
  result: QuestCompletionResult | null;
  questTitle: string;
  onDismiss: () => void;
}

export function CompletionToast({ result, questTitle, onDismiss }: CompletionToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!result?.success) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);
    return () => clearTimeout(t);
  }, [result, onDismiss]);

  if (!result?.success) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50",
        "w-72 rounded border",
        "bg-[hsl(var(--surface-2))] border-[hsl(var(--border-strong))]",
        "transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      )}
      style={{ willChange: "opacity, transform" }}
    >
      <div className="px-4 py-3">
        {/* Quest title */}
        <p className="text-xs font-semibold mb-2 truncate" style={{ color: "hsl(var(--foreground-subtle))" }}>
          Quest Complete
        </p>
        <p className="text-sm font-medium mb-3 leading-snug truncate" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-barlow)" }}>
          {questTitle}
        </p>

        {/* Rewards */}
        <div className="flex items-center gap-4 flex-wrap">
          {result.xp_gained != null && result.xp_gained > 0 && (
            <span className="text-sm font-bold" style={{ color: "hsl(var(--xp))" }}>
              +{result.xp_gained} XP
            </span>
          )}
          {result.gold_gained != null && result.gold_gained > 0 && (
            <span className="text-sm font-bold" style={{ color: "hsl(var(--gold))" }}>
              +{result.gold_gained} Gold
            </span>
          )}
          {result.attribute && result.attribute_gained != null && result.attribute_gained > 0 && (
            <span className="text-sm font-semibold" style={{ color: "hsl(var(--foreground-muted))" }}>
              +{result.attribute_gained} {attributeLabel(result.attribute)}
            </span>
          )}
        </div>

        {/* Level-up — only if it actually happened */}
        {result.leveled_up && (
          <div
            className="mt-2 pt-2 border-t border-[hsl(var(--border))]"
          >
            <p
              className="text-sm font-bold"
              style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--xp))" }}
            >
              ⬆ Level {result.level_after}!
            </p>
          </div>
        )}

        {/* Streak/rank update */}
        {result.ranked_up && result.rank_after && (
          <div className="mt-1">
            <p className="text-xs font-medium" style={{ color: "hsl(var(--rank))" }}>
              Rank up → {result.rank_after.charAt(0).toUpperCase() + result.rank_after.slice(1)}
            </p>
          </div>
        )}
      </div>

      {/* Progress bar indicating auto-dismiss */}
      <div className="h-[2px] bg-[hsl(var(--surface-3))] rounded-b overflow-hidden">
        <div
          className="h-full"
          style={{
            backgroundColor: "hsl(var(--xp))",
            animation: visible ? "toast-drain 4s linear forwards" : "none",
          }}
        />
      </div>
    </div>
  );
}
