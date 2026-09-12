/**
 * LifeQuest — Server-Authoritative Achievement Checking
 *
 * Called from complete-quest server action AFTER the profile has been updated.
 * All values come from the database, never from the client.
 *
 * The checker is fully DATA-DRIVEN: it reads requirement_type and
 * requirement_value from public.achievements and evaluates each against
 * actual DB state. No hardcoded achievement names.
 *
 * Supported requirement_type values:
 *   quests_completed  — count of completed quests >= requirement_value
 *   streak            — newStreak >= requirement_value
 *   intellect         — newIntellect >= requirement_value
 *   strength          — newStrength >= requirement_value
 *   level             — newLevel >= requirement_value
 *
 * Security:
 * - Uses the authenticated server Supabase client
 * - Inserts only for the verified userId from the session
 * - Duplicate inserts silently ignored via the unique constraint
 * - Non-fatal: achievement failure never blocks quest completion
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { NewlyUnlockedAchievement } from "./types";

export interface PostCompletionState {
  userId: string;
  newLevel?: number;
  newStreak?: number;
  newIntellect?: number;
  newStrength?: number;
  newWellness?: number;
  newCreativity?: number;
  newDiscipline?: number;
  newGold?: number;
}

interface AchievementRow {
  id: string;
  name: string;
  description: string;
  requirement_type: string;
  requirement_value: number;
}

/**
 * Check all achievement conditions against authoritative DB state.
 * Returns the list of achievements newly unlocked in this call.
 */
export async function checkAndUnlockAchievements(
  supabase: SupabaseClient,
  state: PostCompletionState
): Promise<NewlyUnlockedAchievement[]> {
  const { userId } = state;

  // ── 1. Load all achievements with their requirements ──────────────────
  const { data: allAchievements, error: achError } = await supabase
    .from("achievements")
    .select("id, name, description, requirement_type, requirement_value");

  if (achError || !allAchievements || allAchievements.length === 0) {
    // Non-fatal — don't fail quest completion if achievements table is missing
    return [];
  }

  const achievements = allAchievements as AchievementRow[];

  // ── 2. Load already-unlocked achievement IDs for this user ────────────
  const { data: existing } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);

  const alreadyUnlocked = new Set(
    (existing ?? []).map((r: { achievement_id: string }) => r.achievement_id)
  );

  // ── 3. Determine queries needed for evaluating requirements ───────────
  const unearned = achievements.filter((a) => !alreadyUnlocked.has(a.id));

  const needsQuestCount = unearned.some(
    (a) => a.requirement_type === "quests_completed"
  );

  const needsInventoryCount = unearned.some(
    (a) => a.requirement_type === "items_purchased"
  );

  const profileRequiredTypes = [
    "level",
    "streak",
    "intellect",
    "strength",
    "wellness",
    "creativity",
    "discipline",
    "gold_held",
  ];

  const needsProfileFetch =
    unearned.some((a) => profileRequiredTypes.includes(a.requirement_type)) &&
    (state.newLevel === undefined ||
      state.newStreak === undefined ||
      state.newIntellect === undefined ||
      state.newStrength === undefined ||
      state.newWellness === undefined ||
      state.newCreativity === undefined ||
      state.newDiscipline === undefined ||
      state.newGold === undefined);

  let profileData: {
    level: number;
    streak: number;
    intellect: number;
    strength: number;
    wellness: number;
    creativity: number;
    discipline: number;
    gold: number;
  } | null = null;

  if (needsProfileFetch) {
    const { data: p } = await supabase
      .from("profiles")
      .select("level, streak, intellect, strength, wellness, creativity, discipline, gold")
      .eq("id", userId)
      .single();
    if (p) profileData = p;
  }

  const userLevel = state.newLevel ?? profileData?.level ?? 1;
  const userStreak = state.newStreak ?? profileData?.streak ?? 0;
  const userIntellect = state.newIntellect ?? profileData?.intellect ?? 0;
  const userStrength = state.newStrength ?? profileData?.strength ?? 0;
  const userWellness = state.newWellness ?? profileData?.wellness ?? 0;
  const userCreativity = state.newCreativity ?? profileData?.creativity ?? 0;
  const userDiscipline = state.newDiscipline ?? profileData?.discipline ?? 0;
  const userGold = state.newGold ?? profileData?.gold ?? 0;

  let completedQuestCount = 0;
  if (needsQuestCount) {
    const { count } = await supabase
      .from("quests")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("completed", true);
    completedQuestCount = count ?? 0;
  }

  let inventoryCount = 0;
  if (needsInventoryCount) {
    const { count } = await supabase
      .from("inventory")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    inventoryCount = count ?? 0;
  }

  // ── 4. Evaluate each achievement — data-driven from DB schema ─────────
  const toUnlock: string[] = [];

  for (const ach of achievements) {
    if (alreadyUnlocked.has(ach.id)) continue;

    const threshold = ach.requirement_value;
    let met = false;

    switch (ach.requirement_type) {
      case "quests_completed":
        met = completedQuestCount >= threshold;
        break;
      case "streak":
        met = userStreak >= threshold;
        break;
      case "level":
        met = userLevel >= threshold;
        break;
      case "intellect":
        met = userIntellect >= threshold;
        break;
      case "strength":
        met = userStrength >= threshold;
        break;
      case "wellness":
        met = userWellness >= threshold;
        break;
      case "creativity":
        met = userCreativity >= threshold;
        break;
      case "discipline":
        met = userDiscipline >= threshold;
        break;
      case "items_purchased":
        met = inventoryCount >= threshold;
        break;
      case "gold_held":
        met = userGold >= threshold;
        break;
      default:
        // Unknown requirement_type — skip safely
        break;
    }

    if (met) toUnlock.push(ach.id);
  }

  if (toUnlock.length === 0) return [];

  // ── 5. Insert new user_achievements ───────────────────────────────────
  // The UNIQUE(user_id, achievement_id) constraint makes this safe from races.
  const insertRows = toUnlock.map((achievementId) => ({
    user_id: userId,
    achievement_id: achievementId,
  }));

  const { error: insertError } = await supabase
    .from("user_achievements")
    .insert(insertRows);

  if (insertError) {
    // Unique violation = concurrent unlock (non-fatal), anything else = log
    if (
      !insertError.message?.includes("duplicate") &&
      !insertError.message?.includes("unique")
    ) {
      console.error("[achievements] Insert error:", insertError.message);
    }
    return [];
  }

  // ── 6. Return safe payload for the client ─────────────────────────────
  return achievements
    .filter((a) => toUnlock.includes(a.id))
    .map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
    }));
}
