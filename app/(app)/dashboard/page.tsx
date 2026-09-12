import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { Profile, Quest } from "@/lib/game/types";

export const metadata = {
  title: "Dashboard",
};

/**
 * Dashboard — server component that loads profile + quests, renders DashboardClient.
 *
 * Data flow:
 *  1. Load authenticated user's profile (level, XP, Gold, Streak, Rank, Attributes)
 *  2. Load active quests (for TODAY filtering on the client)
 *  3. Render DashboardClient with initial data
 *  4. On quest completion, client updates live state from server action result
 */
export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/auth/login");

  const userId = authData.user.id;

  // Load profile and quests in parallel
  const [profileResult, questsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url, level, xp, gold, streak, rank, last_active_date, intellect, strength, wellness, creativity, discipline, created_at, updated_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("quests")
      .select("id, user_id, title, description, category, difficulty, xp_reward, gold_reward, completed, completed_at, created_at")
      .eq("user_id", userId)
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error || !profileResult.data) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
          Failed to load your profile. Please refresh the page.
        </p>
        <p className="text-xs mt-1" style={{ color: "hsl(var(--foreground-subtle))" }}>
          {profileResult.error?.message}
        </p>
      </div>
    );
  }

  return (
    <DashboardClient
      profile={profileResult.data as Profile}
      todayQuestCandidates={(questsResult.data ?? []) as Quest[]}
    />
  );
}
