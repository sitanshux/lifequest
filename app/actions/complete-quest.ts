"use server";

/**
 * completeQuest — Server Action (SECURITY CRITICAL)
 *
 * The browser sends ONLY the questId.
 * The server:
 *  1. Validates the authenticated user
 *  2. Loads the quest from Supabase
 *  3. Verifies quest ownership
 *  4. Verifies quest is not already completed
 *  5. Reads authoritative rewards from the DB record (xp_reward, gold_reward)
 *  6. Computes attribute reward from centralized logic
 *  7. Marks quest as completed
 *  8. Updates profile: xp, gold, attribute, level, streak, rank, last_active_date
 *  9. Inserts game_history record
 * 10. Returns full progression result to caller
 *
 * The client NEVER supplies XP, Gold, attribute values, user_id, level, or rank.
 * RLS remains intact — all mutations go through the authenticated server client.
 */

import { createClient } from "@/lib/supabase/server";
import {
  levelFromXp,
  rankFromStreak,
  calculateNewStreak,
  todayUtcString,
  baseRewardsForDifficulty,
} from "@/lib/game/logic";
import { checkAndUnlockAchievements } from "@/lib/game/achievements";
import type { QuestCompletionResult, QuestDifficulty, QuestAttribute } from "@/lib/game/types";

export async function completeQuest(
  questId: string
): Promise<QuestCompletionResult> {
  if (!questId || typeof questId !== "string") {
    return { success: false, error: "Invalid quest ID." };
  }

  const supabase = await createClient();

  // ── 1. Validate authenticated user ──────────────────────────────────────
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { success: false, error: "Not authenticated." };
  }
  const userId = authData.user.id;

  // ── 2 & 3. Load quest and verify ownership ───────────────────────────────
  const { data: quest, error: questError } = await supabase
    .from("quests")
    .select("id, user_id, xp_reward, gold_reward, category, difficulty, completed")
    .eq("id", questId)
    .single();

  if (questError || !quest) {
    return { success: false, error: "Quest not found." };
  }
  if (quest.user_id !== userId) {
    return { success: false, error: "Quest does not belong to you." };
  }

  // ── 4. Verify not already completed ─────────────────────────────────────
  if (quest.completed) {
    return { success: false, error: "Quest already completed." };
  }

  // ── 5. Authoritative rewards from DB record ──────────────────────────────
  const xpGained = quest.xp_reward as number;
  const goldGained = quest.gold_reward as number;
  const difficulty = quest.difficulty as QuestDifficulty;
  const category = quest.category as QuestAttribute;
  const { attribute: attrGained } = baseRewardsForDifficulty(difficulty);

  // ── 6. Mark quest as completed ───────────────────────────────────────────
  const completedAt = new Date().toISOString();
  const { error: questUpdateError } = await supabase
    .from("quests")
    .update({ completed: true, completed_at: completedAt })
    .eq("id", questId)
    .eq("user_id", userId); // extra ownership guard

  if (questUpdateError) {
    return { success: false, error: "Failed to complete quest. Please try again." };
  }

  // ── 7. Load current profile ──────────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("xp, gold, streak, rank, last_active_date, level, intellect, strength, wellness, creativity, discipline")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    // Quest is already marked complete; profile update failed — log but don't fail silently
    return { success: false, error: "Profile not found. Quest marked complete but rewards not applied." };
  }

  // ── 8. Compute new progression values ───────────────────────────────────
  const oldXp = profile.xp as number;
  const newXp = oldXp + xpGained;
  const levelBefore = levelFromXp(oldXp);
  const levelAfter = levelFromXp(newXp);
  const leveledUp = levelAfter > levelBefore;

  const newStreak = calculateNewStreak(
    profile.streak as number,
    profile.last_active_date as string | null
  );
  const today = todayUtcString();
  const rankBefore = profile.rank as string;
  const newRank = rankFromStreak(newStreak);
  const rankedUp = newRank !== rankBefore;

  // Attribute increment
  const attrKey = category; // category matches attribute column names in profiles
  const currentAttrValue = (profile[attrKey] as number) ?? 0;

  // ── 9. Update profile ────────────────────────────────────────────────────
  const profileUpdates: Record<string, unknown> = {
    xp: newXp,
    gold: (profile.gold as number) + goldGained,
    level: levelAfter,
    streak: newStreak,
    rank: newRank,
    last_active_date: today,
    [attrKey]: currentAttrValue + attrGained,
    updated_at: new Date().toISOString(),
  };

  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update(profileUpdates)
    .eq("id", userId);

  if (profileUpdateError) {
    return { success: false, error: "Failed to apply rewards. Please refresh and try again." };
  }

  // ── 10. Insert game_history record ───────────────────────────────────────
  await supabase.from("game_history").insert({
    user_id: userId,
    event_type: "quest_completed",
    xp_gained: xpGained,
    gold_gained: goldGained,
    attribute: category,
    attribute_gained: attrGained,
    quest_id: questId,
    metadata: { difficulty, leveled_up: leveledUp, ranked_up: rankedUp },
  });
  // History insert failure is non-fatal — don't block completion result

  // ── 11. Check and unlock achievements (server-authoritative) ─────────────
  // Uses the post-update profile values — never the client's state.
  const newlyUnlocked = await checkAndUnlockAchievements(supabase, {
    userId,
    newLevel:      levelAfter,
    newStreak:     newStreak,
    newIntellect:  (profile.intellect  as number) + (category === "intellect"  ? attrGained : 0),
    newStrength:   (profile.strength   as number) + (category === "strength"   ? attrGained : 0),
    newWellness:   (profile.wellness   as number) + (category === "wellness"   ? attrGained : 0),
    newCreativity: (profile.creativity as number) + (category === "creativity" ? attrGained : 0),
    newDiscipline: (profile.discipline as number) + (category === "discipline" ? attrGained : 0),
    newGold:       (profile.gold as number) + goldGained,
  });
  // Achievement check failure is non-fatal — don't block completion result

  return {
    success: true,
    xp_gained: xpGained,
    gold_gained: goldGained,
    attribute: category,
    attribute_gained: attrGained,
    level_before: levelBefore,
    level_after: levelAfter,
    leveled_up: leveledUp,
    streak: newStreak,
    rank_before: rankBefore as import("@/lib/game/types").Rank,
    rank_after: newRank,
    ranked_up: rankedUp,
    new_xp: newXp,
    new_gold: (profile.gold as number) + goldGained,
    newly_unlocked: newlyUnlocked,
  };
}
