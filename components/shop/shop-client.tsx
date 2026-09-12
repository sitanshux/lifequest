"use client";

/**
 * ShopClient — interactive shell for the Shop page.
 *
 * Receives initial items, owned item IDs, and user's Gold from the server.
 * Manages live Gold state — updates immediately from server action result.
 * Shows a purchase confirmation toast.
 * Does not reload the page on purchase.
 */

import { useState, useCallback } from "react";
import { ShopItemCard } from "@/components/shop/shop-item-card";
import { AchievementToast } from "@/components/achievements/achievement-toast";
import { cn } from "@/lib/utils";
import type { ShopItem, PurchaseResult, NewlyUnlockedAchievement } from "@/lib/game/types";

interface ShopClientProps {
  items: ShopItem[];
  initialGold: number;
  initialOwnedIds: string[];
}

interface PurchaseToast {
  itemName: string;
  goldSpent: number;
  newGold: number;
}

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "theme", label: "Themes" },
  { id: "badge", label: "Badges" },
  { id: "frame", label: "Frames" },
  { id: "cosmetic", label: "Cosmetics" },
] as const;

export function ShopClient({ items, initialGold, initialOwnedIds }: ShopClientProps) {
  const [liveGold, setLiveGold] = useState(initialGold);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set(initialOwnedIds));
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [toast, setToast] = useState<PurchaseToast | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [unlockedAchievements, setUnlockedAchievements] = useState<NewlyUnlockedAchievement[]>([]);

  const showToast = useCallback((t: PurchaseToast) => {
    setToast(t);
    setToastVisible(true);
    const hide = setTimeout(() => setToastVisible(false), 3500);
    const clear = setTimeout(() => setToast(null), 4000);
    return () => { clearTimeout(hide); clearTimeout(clear); };
  }, []);

  const handlePurchased = useCallback((result: PurchaseResult, item: ShopItem) => {
    if (!result.success) return;
    // Update Gold from server-authoritative result
    if (result.new_gold != null) setLiveGold(result.new_gold);
    // Mark item as owned
    setOwnedIds((prev) => new Set([...prev, item.id]));
    // Show confirmation toast
    showToast({
      itemName: item.name,
      goldSpent: item.price,
      newGold: result.new_gold ?? liveGold - item.price,
    });
    // Trigger achievement toast if any achievement unlocked (e.g. First Purchase)
    if (result.newly_unlocked && result.newly_unlocked.length > 0) {
      setUnlockedAchievements(result.newly_unlocked);
    }
  }, [liveGold, showToast]);

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground-muted))" }}>
          The shop is empty.
        </p>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--foreground-subtle))" }}>
          No items are available right now. Check back later.
        </p>
      </div>
    );
  }

  const filteredItems = activeCategory === "all"
    ? items
    : items.filter((item) => item.type === activeCategory);

  return (
    <>
      {/* Newly unlocked achievement toast */}
      {unlockedAchievements.length > 0 && (
        <AchievementToast
          achievements={unlockedAchievements}
          onDismiss={() => setUnlockedAchievements([])}
        />
      )}

      {/* Purchase confirmation toast */}
      <div
        role="alert"
        aria-live="assertive"
        className={cn(
          "fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50",
          "w-64 rounded border px-4 py-3",
          "bg-[hsl(var(--surface-2))] border-[hsl(var(--success)/0.4)]",
          "transition-all duration-300",
          toastVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 pointer-events-none"
        )}
        style={{ willChange: "opacity, transform" }}
      >
        {toast && (
          <>
            <p className="text-xs font-semibold mb-1" style={{ color: "hsl(var(--success))" }}>
              Purchased!
            </p>
            <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))", fontFamily: "var(--font-barlow)" }}>
              {toast.itemName}
            </p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--foreground-subtle))" }}>
              −{toast.goldSpent.toLocaleString()} Gold &middot; {toast.newGold.toLocaleString()} remaining
            </p>
          </>
        )}
      </div>

      {/* Header bar: Category filter + Gold balance */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 border-b border-[hsl(var(--border))] pb-4">
        {/* Category filter tabs */}
        <div role="tablist" aria-label="Shop categories" className="flex gap-1.5 overflow-x-auto">
          {CATEGORIES.map(({ id, label }) => {
            const count = id === "all" ? items.length : items.filter((i) => i.type === id).length;
            if (count === 0 && id !== "all") return null;
            const isSelected = activeCategory === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveCategory(id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors duration-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                  isSelected
                    ? "bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))]"
                    : "text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))] border border-transparent"
                )}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>

        {/* Gold balance */}
        <div
          className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded border border-[hsl(var(--border))] self-start sm:self-auto flex-shrink-0"
          aria-label={`Your Gold balance: ${liveGold}`}
        >
          <span
            className="text-[11px] font-semibold tracking-widest uppercase"
            style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
          >
            Gold
          </span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ fontFamily: "var(--font-barlow)", color: "hsl(var(--gold))" }}
          >
            {liveGold.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Item grid */}
      {filteredItems.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-xs" style={{ color: "hsl(var(--foreground-subtle))" }}>
            No items found in this category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <ShopItemCard
              key={item.id}
              item={item}
              userGold={liveGold}
              initiallyOwned={ownedIds.has(item.id)}
              onPurchased={handlePurchased}
            />
          ))}
        </div>
      )}
    </>
  );
}
