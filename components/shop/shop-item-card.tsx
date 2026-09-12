"use client";

/**
 * ShopItemCard — a single shop item with purchase state machine.
 *
 * States:
 * - idle:             available to buy, shows price + Purchase button
 * - purchasing:       request in-flight, button disabled + spinner
 * - owned:            already in inventory, "Owned" indicator, no buy button
 * - insufficient:     not enough Gold — dimmed price, tooltip-style hint
 * - error:            server returned unknown error
 *
 * Design (design.md §16):
 * - Items feel like collectible rewards, not generic e-commerce cards
 * - Gold price visually meaningful
 * - Clear purchase confirmation on success
 * - No excessive rounding, no glassmorphism, no identical repeated cards
 * - Hierarchy: name → description → type tag → price + action
 */

import { useState } from "react";
import { purchaseItem } from "@/app/actions/purchase-item";
import { cn } from "@/lib/utils";
import type { ShopItem, PurchaseResult } from "@/lib/game/types";

interface ShopItemCardProps {
  item: ShopItem;
  userGold: number;
  initiallyOwned: boolean;
  onPurchased: (result: PurchaseResult, item: ShopItem) => void;
}

// Type display labels — not raw DB strings
const TYPE_LABELS: Record<string, string> = {
  theme:    "Theme",
  badge:    "Badge",
  frame:    "Frame",
  cosmetic: "Cosmetic",
};

export function ShopItemCard({
  item,
  userGold,
  initiallyOwned,
  onPurchased,
}: ShopItemCardProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [localOwned, setLocalOwned] = useState(false);
  const [isError, setIsError] = useState(false);

  const isOwned = initiallyOwned || localOwned;
  const canAfford = userGold >= item.price;
  const isInsufficient = !isOwned && !canAfford;

  const handlePurchase = async () => {
    if (isOwned || !canAfford || isPurchasing) return;
    setIsPurchasing(true);
    setIsError(false);
    try {
      const result = await purchaseItem(item.id);
      if (result.success) {
        setLocalOwned(true);
        onPurchased(result, item);
      } else if (result.error === "already_owned") {
        setLocalOwned(true);
      } else if (result.error === "insufficient_gold") {
        setIsError(false);
      } else {
        setIsError(true);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <article
      className={cn(
        "flex flex-col border rounded",
        "bg-[hsl(var(--surface-1))]",
        isOwned
          ? "border-[hsl(var(--success)/0.4)]"
          : "border-[hsl(var(--border))]"
      )}
      aria-label={item.name}
    >
      {/* Image / placeholder — consistent aspect ratio */}
      <div
        className="relative w-full overflow-hidden rounded-t"
        style={{
          aspectRatio: "16/7",
          backgroundColor: "hsl(var(--surface-2))",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      >
        {item.image_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          /* Type-coded placeholder — no random blobs */
          <div className="absolute inset-0 flex items-center justify-center select-none">
            <span
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.12em" }}
            >
              {TYPE_LABELS[item.type] ?? item.type}
            </span>
          </div>
        )}

        {/* Owned overlay */}
        {isOwned && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundColor: "hsl(var(--success) / 0.12)" }}
          >
            <span
              className="text-xs font-bold tracking-widest uppercase px-2 py-1 rounded-sm"
              style={{
                color: "hsl(var(--success))",
                backgroundColor: "hsl(var(--surface-1) / 0.9)",
                letterSpacing: "0.1em",
              }}
            >
              Owned
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Type tag — small, not dominant */}
        <span
          className="text-[10px] font-semibold tracking-widest uppercase self-start"
          style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.12em" }}
        >
          {TYPE_LABELS[item.type] ?? item.type}
        </span>

        {/* Name */}
        <h3
          className="text-sm font-bold leading-snug"
          style={{
            fontFamily: "var(--font-barlow)",
            color: isOwned ? "hsl(var(--foreground-muted))" : "hsl(var(--foreground))",
          }}
        >
          {item.name}
        </h3>

        {/* Description */}
        <p
          className="text-xs leading-relaxed flex-1"
          style={{ color: "hsl(var(--foreground-subtle))" }}
        >
          {item.description}
        </p>

        {/* Error state */}
        {isError && (
          <p
            role="alert"
            className="text-xs"
            style={{ color: "hsl(var(--destructive))" }}
          >
            Purchase failed — please try again.
          </p>
        )}

        {/* Price + action row */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[hsl(var(--border))]">
          {/* Price */}
          <span
            className="text-sm font-bold tabular-nums"
            style={{
              fontFamily: "var(--font-barlow)",
              color: isOwned
                ? "hsl(var(--foreground-subtle))"
                : isInsufficient
                  ? "hsl(var(--foreground-subtle))"
                  : "hsl(var(--gold))",
            }}
          >
            {item.price.toLocaleString()} Gold
          </span>

          {/* Action */}
          {isOwned ? (
            <span
              className="text-xs font-semibold"
              style={{ color: "hsl(var(--success))" }}
            >
              ✓ In Inventory
            </span>
          ) : (
            <button
              onClick={handlePurchase}
              disabled={isPurchasing || isInsufficient || isOwned}
              aria-label={
                isInsufficient
                  ? `Cannot afford ${item.name} — need ${item.price} Gold`
                  : `Purchase ${item.name} for ${item.price} Gold`
              }
              className={cn(
                "px-3 py-1.5 rounded-sm text-xs font-semibold",
                "transition-colors duration-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
                isPurchasing || isInsufficient
                  ? "opacity-50 cursor-not-allowed bg-[hsl(var(--surface-2))] text-[hsl(var(--foreground-subtle))] border border-[hsl(var(--border))]"
                  : "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary-hover))]"
              )}
            >
              {isPurchasing ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Buying…
                </span>
              ) : isInsufficient ? (
                "Need more Gold"
              ) : isError ? (
                "Retry"
              ) : (
                "Purchase"
              )}
            </button>
          )}
        </div>

        {/* Insufficient Gold hint */}
        {isInsufficient && (
          <p className="text-[11px]" style={{ color: "hsl(var(--foreground-subtle))" }}>
            You need {(item.price - userGold).toLocaleString()} more Gold.
            Complete quests to earn Gold.
          </p>
        )}
      </div>
    </article>
  );
}
