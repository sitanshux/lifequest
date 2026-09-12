import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Inventory",
};

// Type display labels — consistent with Shop
const TYPE_LABELS: Record<string, string> = {
  theme:    "Theme",
  badge:    "Badge",
  frame:    "Frame",
  cosmetic: "Cosmetic",
};

// Per-type colour accent — reuses existing CSS tokens
const TYPE_COLORS: Record<string, string> = {
  theme:    "hsl(var(--attr-intellect))",
  badge:    "hsl(var(--attr-strength))",
  frame:    "hsl(var(--gold))",
  cosmetic: "hsl(var(--attr-creativity))",
};

// Supabase returns many-to-one relations as an array at the type level.
// We normalize to a single object in the render loop.
interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: string;
  image_url: string | null;
}

interface InventoryRow {
  id: string;
  purchased_at: string;
  item: InventoryItem | InventoryItem[] | null;
}

/**
 * Inventory page — server-rendered, no client JS needed.
 *
 * Loads the authenticated user's purchased items via a single
 * joined query (inventory → items). Ordered by acquisition date desc
 * so most-recently acquired items appear first.
 *
 * States: error | empty | items list
 */
export default async function InventoryPage() {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/auth/login");
  const userId = authData.user.id;

  const { data: rows, error } = await supabase
    .from("inventory")
    .select("id, purchased_at, item:item_id(id, name, description, type, image_url)")
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false });

  // ── Error state ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <h1
          className="text-2xl font-bold tracking-tight mb-2"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          Inventory
        </h1>
        <p className="text-sm" style={{ color: "hsl(var(--destructive))" }}>
          Failed to load your inventory. Please refresh the page.
        </p>
      </div>
    );
  }

  const items = (rows ?? []) as unknown as InventoryRow[];

  return (
    <div className="max-w-3xl mx-auto">

      {/* Page header */}
      <div className="pb-6 border-b border-[hsl(var(--border))] mb-6">
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          Inventory
        </h1>
        <p className="text-sm mt-0.5" style={{ color: "hsl(var(--foreground-muted))" }}>
          {items.length > 0
            ? `${items.length} item${items.length !== 1 ? "s" : ""} in your loot bag.`
            : "Your collected loot."}
        </p>
      </div>

      {/* ── Empty state ─────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 gap-4 text-center"
          role="status"
        >
          <p
            className="text-sm font-medium"
            style={{ color: "hsl(var(--foreground-muted))" }}
          >
            Your loot bag is empty.
          </p>
          <p
            className="text-xs"
            style={{ color: "hsl(var(--foreground-subtle))" }}
          >
            Items you purchase in the Shop will appear here.
          </p>
          <Link
            href="/shop"
            className="text-sm px-4 py-2 rounded border border-[hsl(var(--border))] font-medium
              text-[hsl(var(--foreground-muted))] hover:text-[hsl(var(--foreground))]
              hover:border-[hsl(var(--border-strong))] transition-colors duration-100
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            Visit the Shop
          </Link>
        </div>
      ) : (
        /* ── Loot list — not a generic identical-card grid ─────────────── */
        <ul className="space-y-px" aria-label="Your inventory">
          {items.map((row, index) => {
            // Normalise: Supabase may return array or object for the join
            const raw = row.item;
            const item: InventoryItem | null = Array.isArray(raw)
              ? (raw[0] ?? null)
              : raw;
            if (!item) return null;

            const typeLabel = TYPE_LABELS[item.type] ?? item.type;
            const typeColor = TYPE_COLORS[item.type] ?? "hsl(var(--foreground-subtle))";
            const acquiredDate = new Date(row.purchased_at).toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <li
                key={row.id}
                className="flex items-start gap-4 py-4"
                style={{
                  borderBottom:
                    index < items.length - 1
                      ? "1px solid hsl(var(--border))"
                      : "none",
                }}
              >
                {/* Type icon / image — fixed width, no hover-scale */}
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-sm flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: "hsl(var(--surface-2))" }}
                  aria-hidden="true"
                >
                  {item.image_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={item.image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="text-[10px] font-bold tracking-widest uppercase text-center leading-tight px-1"
                      style={{ color: typeColor, letterSpacing: "0.08em" }}
                    >
                      {typeLabel.slice(0, 3)}
                    </span>
                  )}
                </div>

                {/* Item details */}
                <div className="flex-1 min-w-0">
                  {/* Type label — small, semantic colour */}
                  <span
                    className="text-[10px] font-semibold tracking-widest uppercase"
                    style={{ color: typeColor, letterSpacing: "0.1em" }}
                  >
                    {typeLabel}
                  </span>

                  {/* Name — primary hierarchy */}
                  <p
                    className="text-sm font-bold leading-snug mt-0.5"
                    style={{
                      fontFamily: "var(--font-barlow)",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    {item.name}
                  </p>

                  {/* Description */}
                  <p
                    className="text-xs mt-1 leading-relaxed"
                    style={{ color: "hsl(var(--foreground-subtle))" }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Acquisition date — right-aligned, secondary */}
                <div className="flex-shrink-0 text-right pt-0.5">
                  <span
                    className="text-[11px]"
                    style={{ color: "hsl(var(--foreground-subtle))" }}
                  >
                    Acquired
                  </span>
                  <p
                    className="text-xs font-medium mt-0.5"
                    style={{ color: "hsl(var(--foreground-muted))" }}
                  >
                    {acquiredDate}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
