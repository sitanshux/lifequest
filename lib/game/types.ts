/**
 * LifeQuest — Core Game Types
 *
 * These types represent the canonical domain model for LifeQuest.
 * They must stay in sync with the Supabase database schema.
 * Do not duplicate these across components.
 *
 * Column names match the actual database schema exactly.
 */

// ============================================================
// Quest
// ============================================================

/** Maps to the `category` column in the quests table */
export type QuestAttribute =
  | "intellect"
  | "strength"
  | "wellness"
  | "creativity"
  | "discipline";

export type QuestDifficulty = "easy" | "medium" | "hard" | "epic";

/** Matches the public.quests table schema exactly */
export interface Quest {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: QuestAttribute;   // DB column is "category"
  difficulty: QuestDifficulty;
  xp_reward: number;
  gold_reward: number;
  completed: boolean;          // DB column is "completed"
  completed_at: string | null;
  created_at: string;
}

/** Payload sent to the create-quest server action */
export interface CreateQuestPayload {
  title: string;
  description: string;
  category: QuestAttribute;
  difficulty: QuestDifficulty;
  xp_reward: number;
  gold_reward: number;
}

// ============================================================
// Profile / Character
// ============================================================

export type Rank = "unranked" | "bronze" | "silver" | "gold" | "elite";

/** Matches the public.profiles table schema exactly */
export interface Profile {
  id: string;                    // matches auth user id
  username: string | null;
  avatar_url: string | null;
  level: number;
  xp: number;
  gold: number;
  streak: number;
  rank: Rank;
  last_active_date: string | null; // ISO date YYYY-MM-DD
  // Attribute totals
  intellect: number;
  strength: number;
  wellness: number;
  creativity: number;
  discipline: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// Achievement
// ============================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  /** Maps to requirement_type column: "quests_completed" | "streak" | "level" | "intellect" | "strength" | "wellness" | "creativity" | "discipline" | "items_purchased" | "gold_held" */
  requirement_type: string;
  /** Maps to requirement_value column: the threshold to meet */
  requirement_value: number;
  icon: string | null;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

// ============================================================
// Shop
// ============================================================

export type ShopItemType = "theme" | "badge" | "frame" | "cosmetic";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: ShopItemType;
  price: number;       // Gold cost — authoritative on server
  image_url: string | null;
  is_active: boolean;
  created_at: string;
}

// ============================================================
// Inventory
// ============================================================

export interface InventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  purchased_at: string;
  item?: ShopItem;
}

// ============================================================
// Game History
// ============================================================

export type GameHistoryEventType =
  | "quest_completed"
  | "level_up"
  | "rank_up"
  | "achievement_unlocked"
  | "item_purchased";

export interface GameHistoryEntry {
  id: string;
  user_id: string;
  event_type: GameHistoryEventType;
  xp_gained: number | null;
  gold_gained: number | null;
  attribute: QuestAttribute | null;
  attribute_gained: number | null;
  quest_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ============================================================
// Quest Completion Result (returned from server action)
// ============================================================

export interface QuestCompletionResult {
  success: boolean;
  error?: string;
  xp_gained?: number;
  gold_gained?: number;
  attribute?: QuestAttribute;
  attribute_gained?: number;
  level_before?: number;
  level_after?: number;
  leveled_up?: boolean;
  streak?: number;
  rank_before?: Rank;
  rank_after?: Rank;
  ranked_up?: boolean;
  new_xp?: number;
  new_gold?: number;
  /** Achievements newly unlocked by this quest completion (empty if none) */
  newly_unlocked?: NewlyUnlockedAchievement[];
}

// ============================================================
// Achievement Unlock (returned inside QuestCompletionResult)
// ============================================================

/** Minimal achievement info safe to send to the client */
export interface NewlyUnlockedAchievement {
  id: string;
  name: string;
  description: string;
}


// ============================================================
// Create Quest Result
// ============================================================

export interface CreateQuestResult {
  success: boolean;
  error?: string;
  quest?: Quest;
}

// ============================================================
// TODAY View (client-side only, not persisted to server)
// ============================================================

export interface TodayState {
  questIds: string[];
  date: string; // ISO date string YYYY-MM-DD — resets daily
}

// ============================================================
// Purchase Result (returned from purchaseItem server action)
// ============================================================

export interface PurchaseResult {
  success: boolean;
  /** User-facing error message, or sentinel: "insufficient_gold" | "already_owned" */
  error?: string;
  /** Authoritative new Gold balance after purchase */
  new_gold?: number;
  /** The item that was purchased */
  item_id?: string;
  /** Achievements newly unlocked by this purchase (e.g. First Purchase) */
  newly_unlocked?: NewlyUnlockedAchievement[];
}
