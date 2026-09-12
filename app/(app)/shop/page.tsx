import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ShopClient } from "@/components/shop/shop-client";
import type { ShopItem } from "@/lib/game/types";

export const metadata = {
  title: "Shop",
};

/**
 * Shop page — server component.
 *
 * Loads in parallel:
 *  1. Active shop items from public.items
 *  2. User's current Gold from public.profiles
 *  3. User's owned item IDs from public.inventory
 *
 * Passes initial data to ShopClient for interactive rendering.
 * Purchases happen through the purchaseItem server action (purchase_item RPC).
 */
export default async function ShopPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/auth/login");
  const userId = authData.user.id;

  // Load all three data sources in parallel
  const [itemsResult, profileResult, inventoryResult] = await Promise.all([
    supabase
      .from("items")
      .select("id, name, description, type, price, image_url, is_active")
      .eq("is_active", true)
      .order("price", { ascending: true }),
    supabase
      .from("profiles")
      .select("gold")
      .eq("id", userId)
      .single(),
    supabase
      .from("inventory")
      .select("item_id")
      .eq("user_id", userId),
  ]);

  // ── Error state ──────────────────────────────────────────────────────────
  if (itemsResult.error) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <h1
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          Shop
        </h1>
        <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
          Failed to load shop items. Please refresh the page.
        </p>
      </div>
    );
  }

  const items = (itemsResult.data ?? []) as ShopItem[];
  const gold = (profileResult.data?.gold as number) ?? 0;
  const ownedIds = (inventoryResult.data ?? []).map((row) => row.item_id as string);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="pb-6 border-b border-[hsl(var(--border))] mb-6">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          Shop
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--foreground-muted))" }}>
          Spend your Gold on rewards.{" "}
          {items.length > 0 && (
            <span style={{ color: "hsl(var(--foreground-subtle))" }}>
              {items.length} item{items.length !== 1 ? "s" : ""} available.
            </span>
          )}
        </p>
      </div>

      <ShopClient
        items={items}
        initialGold={gold}
        initialOwnedIds={ownedIds}
      />
    </div>
  );
}
