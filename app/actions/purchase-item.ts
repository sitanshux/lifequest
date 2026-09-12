"use server";

/**
 * purchaseItem — Server Action (SECURITY CRITICAL)
 *
 * The browser sends ONLY the itemId.
 * The server:
 *  1. Validates authenticated user
 *  2. Calls purchase_item() Postgres RPC which atomically:
 *       a. Loads item and its authoritative price from public.items
 *       b. Loads user's current Gold from public.profiles
 *       c. Validates sufficient Gold
 *       d. Prevents duplicate ownership (unique constraint on inventory)
 *       e. Deducts Gold from profiles
 *       f. Inserts inventory row
 *     All within a single DB transaction — no partial state possible.
 *  3. Returns structured result to caller
 *
 * Client NEVER supplies: price, Gold amount, user_id, ownership state.
 * The RPC function is SECURITY DEFINER and handles all validation server-side.
 */

import { createClient } from "@/lib/supabase/server";
import { checkAndUnlockAchievements } from "@/lib/game/achievements";
import type { PurchaseResult, NewlyUnlockedAchievement } from "@/lib/game/types";

export async function purchaseItem(itemId: string): Promise<PurchaseResult> {
  if (!itemId || typeof itemId !== "string") {
    return { success: false, error: "Invalid item ID." };
  }

  const supabase = await createClient();

  // ── 1. Validate authenticated user ───────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { success: false, error: "Not authenticated." };
  }
  const userId = authData.user.id;

  // ── 2. Call atomic purchase RPC ──────────────────────────────────────────
  // The RPC handles: item validation, price check, Gold deduction,
  // inventory insert — all in one transaction. See migration SQL.
  const { data, error } = await supabase.rpc("purchase_item", {
    p_user_id: userId,
    p_item_id: itemId,
  });

  if (error) {
    // Map DB error messages to user-friendly strings
    const msg = error.message ?? "";
    if (msg.includes("Item not found") || msg.includes("not found")) {
      return { success: false, error: "Item not found." };
    }
    if (msg.includes("Insufficient Gold") || msg.includes("insufficient")) {
      return { success: false, error: "insufficient_gold" };
    }
    if (msg.includes("already owned") || msg.includes("duplicate") || msg.includes("unique")) {
      return { success: false, error: "already_owned" };
    }
    return { success: false, error: "Purchase failed. Please try again." };
  }

  // RPC returns { new_gold, item_id } on success
  const result = data as { new_gold: number; item_id: string } | null;

  // Check achievements (e.g. First Purchase, Loot Collector, Gold Hoarder)
  let newlyUnlocked: NewlyUnlockedAchievement[] = [];
  try {
    newlyUnlocked = await checkAndUnlockAchievements(supabase, {
      userId,
      newGold: result?.new_gold,
    });
  } catch {
    // Non-fatal — achievement check should never block a valid purchase
  }

  return {
    success: true,
    new_gold: result?.new_gold ?? 0,
    item_id: result?.item_id ?? itemId,
    newly_unlocked: newlyUnlocked,
  };
}
