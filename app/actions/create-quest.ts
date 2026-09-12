"use server";

/**
 * createQuest — Server Action
 *
 * Creates a new quest for the authenticated user.
 * The user_id is always taken from the server session — never from the client.
 * XP and Gold rewards come from the validated payload (user-chosen within allowed bounds).
 */

import { createClient } from "@/lib/supabase/server";
import {
  QUEST_ATTRIBUTES,
  QUEST_DIFFICULTIES,
  baseRewardsForDifficulty,
} from "@/lib/game/logic";
import type {
  CreateQuestPayload,
  CreateQuestResult,
  QuestAttribute,
  QuestDifficulty,
} from "@/lib/game/types";

const MAX_XP = 1000;
const MAX_GOLD = 500;
const MAX_TITLE_LENGTH = 120;
const MAX_DESC_LENGTH = 500;

export async function createQuest(
  payload: CreateQuestPayload
): Promise<CreateQuestResult> {
  // ── Validate auth ────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return { success: false, error: "Not authenticated." };
  }
  const userId = authData.user.id;

  // ── Validate payload ─────────────────────────────────────────────────────
  const title = (payload.title ?? "").trim();
  if (!title) return { success: false, error: "Title is required." };
  if (title.length > MAX_TITLE_LENGTH) {
    return { success: false, error: `Title must be ${MAX_TITLE_LENGTH} characters or fewer.` };
  }

  const description = (payload.description ?? "").trim();
  if (description.length > MAX_DESC_LENGTH) {
    return { success: false, error: `Description must be ${MAX_DESC_LENGTH} characters or fewer.` };
  }

  if (!QUEST_ATTRIBUTES.includes(payload.category as QuestAttribute)) {
    return { success: false, error: "Invalid category." };
  }
  if (!QUEST_DIFFICULTIES.includes(payload.difficulty as QuestDifficulty)) {
    return { success: false, error: "Invalid difficulty." };
  }

  // Rewards: use the centralized defaults, but allow user to customise within bounds
  const baseRewards = baseRewardsForDifficulty(payload.difficulty);
  const xpReward = Number(payload.xp_reward);
  const goldReward = Number(payload.gold_reward);

  if (!Number.isFinite(xpReward) || xpReward < 0 || xpReward > MAX_XP) {
    return { success: false, error: `XP reward must be between 0 and ${MAX_XP}.` };
  }
  if (!Number.isFinite(goldReward) || goldReward < 0 || goldReward > MAX_GOLD) {
    return { success: false, error: `Gold reward must be between 0 and ${MAX_GOLD}.` };
  }

  // ── Insert quest ─────────────────────────────────────────────────────────
  const { data: quest, error: insertError } = await supabase
    .from("quests")
    .insert({
      user_id: userId,
      title,
      description: description || null,
      category: payload.category,
      difficulty: payload.difficulty,
      xp_reward: xpReward || baseRewards.xp,
      gold_reward: goldReward || baseRewards.gold,
      completed: false,
    })
    .select()
    .single();

  if (insertError || !quest) {
    return { success: false, error: "Failed to create quest. Please try again." };
  }

  return { success: true, quest };
}
