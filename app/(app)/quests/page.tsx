import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QuestsClient } from "@/components/quests/quests-client";
import type { Quest } from "@/lib/game/types";

export const metadata = {
  title: "Quests",
};

/**
 * Quests page — server component that loads data, renders QuestsClient.
 *
 * - Loads quests for the authenticated user (scoped by RLS + explicit user_id filter)
 * - Passes initial data to the client component
 * - Any mutations happen through server actions
 */
export default async function QuestsPage() {
  const supabase = await createClient();

  // Get authenticated user (belt-and-suspenders — layout also checks)
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/auth/login");

  const userId = authData.user.id;

  // Load quests — order: active first, then by creation date desc
  const { data: quests, error } = await supabase
    .from("quests")
    .select("id, user_id, title, description, category, difficulty, xp_reward, gold_reward, completed, completed_at, created_at")
    .eq("user_id", userId)
    .order("completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
          Failed to load quests. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <QuestsClient
      initialQuests={(quests ?? []) as Quest[]}
      userId={userId}
    />
  );
}
