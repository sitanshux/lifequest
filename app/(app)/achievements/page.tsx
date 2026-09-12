import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Achievements",
};

/**
 * Achievements page — fully server-rendered.
 *
 * Loads all achievements + the authenticated user's unlocked achievements
 * in parallel. Merges them to produce a single sorted list:
 *   - Unlocked first, ordered by unlock date (most recent first)
 *   - Locked after, in DB order
 *
 * States: error | no achievements seeded | none unlocked | partial | all unlocked
 *
 * Design (design.md §18):
 * - Unlocked achievements: meaningful emphasis
 * - Locked achievements: visually restrained (dimmed, not removed)
 * - No excessive glow effects
 * - Not a generic identical-card grid
 * - Shows unlock date on unlocked items
 * - Shows requirement context on locked items
 */

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  requirement_type: string;
  requirement_value: number;
}

interface MergedAchievement {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  requirement_type: string;
  requirement_value: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

/** Human-readable unlock requirement per achievement name */
const REQUIREMENT_HINTS: Record<string, string> = {
  "First Quest":  "Complete your first quest.",
  "First Streak": "Maintain a 3-day streak.",
  "Quest Master": "Complete 50 quests.",
  "Scholar":      "Earn 500 Intellect points.",
  "Warrior":      "Earn 500 Strength points.",
  "Level 10":     "Reach character level 10.",
};

function getRequirementHint(ach: MergedAchievement): string {
  switch (ach.requirement_type) {
    case "quests_completed":
      return `Complete ${ach.requirement_value.toLocaleString()} quest${ach.requirement_value !== 1 ? "s" : ""}.`;
    case "streak":
      return `Maintain a ${ach.requirement_value}-day activity streak.`;
    case "level":
      return `Reach character level ${ach.requirement_value}.`;
    case "intellect":
      return `Earn ${ach.requirement_value.toLocaleString()} Intellect points.`;
    case "strength":
      return `Earn ${ach.requirement_value.toLocaleString()} Strength points.`;
    case "wellness":
      return `Earn ${ach.requirement_value.toLocaleString()} Wellness points.`;
    case "creativity":
      return `Earn ${ach.requirement_value.toLocaleString()} Creativity points.`;
    case "discipline":
      return `Earn ${ach.requirement_value.toLocaleString()} Discipline points.`;
    case "items_purchased":
      return `Acquire ${ach.requirement_value.toLocaleString()} shop item${ach.requirement_value !== 1 ? "s" : ""}.`;
    case "gold_held":
      return `Hold ${ach.requirement_value.toLocaleString()} Gold at one time.`;
    default:
      return ach.description;
  }
}

export default async function AchievementsPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/auth/login");
  const userId = authData.user.id;

  // Load all achievements + user's unlocked in parallel
  const [allResult, unlockedResult] = await Promise.all([
    supabase
      .from("achievements")
      .select("id, name, description, icon, requirement_type, requirement_value")
      .order("created_at", { ascending: true }),
    supabase
      .from("user_achievements")
      .select("achievement_id, unlocked_at")
      .eq("user_id", userId),
  ]);

  // ── Error state ──────────────────────────────────────────────────────────
  if (allResult.error) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <h1
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          Achievements
        </h1>
        <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
          Failed to load achievements. Please refresh the page.
        </p>
      </div>
    );
  }

  const all = (allResult.data ?? []) as Achievement[];
  const unlockedMap = new Map(
    (unlockedResult.data ?? []).map((r: { achievement_id: string; unlocked_at: string }) => [
      r.achievement_id,
      r.unlocked_at,
    ])
  );

  // Merge: annotate each achievement with its unlock state
  const merged: MergedAchievement[] = all.map((a) => {
    const unlocked_at = unlockedMap.get(a.id) ?? null;
    return {
      ...a,
      unlocked: unlocked_at !== null,
      unlocked_at,
    };
  });

  // Sort: unlocked first (by date desc), then locked in original order
  const sorted = [
    ...merged.filter((a) => a.unlocked).sort(
      (a, b) => new Date(b.unlocked_at!).getTime() - new Date(a.unlocked_at!).getTime()
    ),
    ...merged.filter((a) => !a.unlocked),
  ];

  const unlockedCount = sorted.filter((a) => a.unlocked).length;
  const totalCount = sorted.length;

  return (
    <div className="max-w-3xl mx-auto">

      {/* Page header */}
      <div className="pb-6 border-b border-[hsl(var(--border))] mb-6">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          Achievements
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--foreground-muted))" }}>
          {totalCount === 0
            ? "No achievements available yet."
            : unlockedCount === 0
              ? "Complete quests and build streaks to unlock achievements."
              : unlockedCount === totalCount
                ? `All ${totalCount} achievements unlocked.`
                : `${unlockedCount} of ${totalCount} unlocked.`}
        </p>
      </div>

      {/* ── No achievements seeded ──────────────────────────────────────── */}
      {totalCount === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: "hsl(var(--foreground-subtle))" }}>
            No achievements have been added yet.
          </p>
        </div>
      )}

      {/* ── Achievement list ────────────────────────────────────────────── */}
      {totalCount > 0 && (
        <ul role="list" className="space-y-1" aria-label="Achievements">
          {sorted.map((ach, index) => {
            const isUnlocked = ach.unlocked;
            const isFirstLocked = index > 0 && !sorted[index - 1].unlocked && index === unlockedCount;
            const hint = REQUIREMENT_HINTS[ach.name] ?? getRequirementHint(ach);
            const unlockDate = ach.unlocked_at
              ? new Date(ach.unlocked_at).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : null;

            return (
              <li key={ach.id}>
                {/* Section separator between unlocked and locked groups */}
                {isFirstLocked && unlockedCount > 0 && (
                  <div className="flex items-center gap-3 py-3">
                    <div className="flex-1 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
                    <span
                      className="text-[10px] font-semibold tracking-widest uppercase"
                      style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.1em" }}
                    >
                      Locked
                    </span>
                    <div className="flex-1 h-px" style={{ backgroundColor: "hsl(var(--border))" }} />
                  </div>
                )}

                <div
                  className="flex items-start gap-4 px-4 py-4 rounded border"
                  style={{
                    borderColor: isUnlocked
                      ? "hsl(var(--xp) / 0.35)"
                      : "hsl(var(--border))",
                    backgroundColor: isUnlocked
                      ? "hsl(var(--xp) / 0.04)"
                      : "transparent",
                    opacity: isUnlocked ? 1 : 0.55,
                  }}
                  aria-label={`${ach.name}${isUnlocked ? " — unlocked" : " — locked"}`}
                >
                  {/* State indicator — deliberate marker, not a generic icon */}
                  <div
                    className="flex-shrink-0 w-9 h-9 rounded-sm flex items-center justify-center"
                    style={{
                      backgroundColor: isUnlocked
                        ? "hsl(var(--xp) / 0.12)"
                        : "hsl(var(--surface-2))",
                    }}
                    aria-hidden="true"
                  >
                    {isUnlocked ? (
                      /* Checkmark — not a floating glow circle */
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 8L6.5 11.5L13 5"
                          stroke="hsl(var(--xp))"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      /* Lock — small, not decorative */
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden="true"
                      >
                        <rect
                          x="2"
                          y="6"
                          width="10"
                          height="7"
                          rx="1"
                          stroke="hsl(var(--foreground-subtle))"
                          strokeWidth="1.5"
                        />
                        <path
                          d="M4 6V4a3 3 0 016 0v2"
                          stroke="hsl(var(--foreground-subtle))"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold leading-snug"
                      style={{
                        fontFamily: "var(--font-barlow)",
                        color: isUnlocked
                          ? "hsl(var(--foreground))"
                          : "hsl(var(--foreground-muted))",
                      }}
                    >
                      {ach.name}
                    </p>
                    <p
                      className="text-xs mt-0.5 leading-relaxed"
                      style={{ color: "hsl(var(--foreground-subtle))" }}
                    >
                      {isUnlocked ? ach.description : hint}
                    </p>
                  </div>

                  {/* Right side: unlock badge or locked context */}
                  <div className="flex-shrink-0 text-right pt-0.5">
                    {isUnlocked ? (
                      <>
                        <span
                          className="text-[11px] font-bold tracking-widest uppercase"
                          style={{ color: "hsl(var(--xp))", letterSpacing: "0.08em" }}
                        >
                          Unlocked
                        </span>
                        {unlockDate && (
                          <p
                            className="text-[11px] mt-0.5"
                            style={{ color: "hsl(var(--foreground-subtle))" }}
                          >
                            {unlockDate}
                          </p>
                        )}
                      </>
                    ) : (
                      <span
                        className="text-[11px]"
                        style={{ color: "hsl(var(--foreground-subtle))" }}
                      >
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
