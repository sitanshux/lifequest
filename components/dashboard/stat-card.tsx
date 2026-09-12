import { cn } from "@/lib/utils";

/**
 * StatCard — compact stat display.
 *
 * Deliberately NOT a giant rounded card.
 * Different visual weights for different importance levels.
 */
interface StatCardProps {
  label: string;
  value: string | number;
  /** Optional color for the value */
  valueColor?: string;
  /** Optional sub-label */
  sub?: string;
  className?: string;
}

export function StatCard({ label, value, valueColor, sub, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 px-4 py-3",
        "border border-[hsl(var(--border))] rounded",
        "bg-[hsl(var(--surface-1))]",
        className
      )}
    >
      <span
        className="text-[11px] font-semibold tracking-widest uppercase"
        style={{ color: "hsl(var(--foreground-subtle))", letterSpacing: "0.09em" }}
      >
        {label}
      </span>
      <span
        className="text-xl font-bold leading-none"
        style={{
          fontFamily: "var(--font-barlow)",
          color: valueColor ?? "hsl(var(--foreground))",
        }}
      >
        {value}
      </span>
      {sub && (
        <span className="text-[11px]" style={{ color: "hsl(var(--foreground-subtle))" }}>
          {sub}
        </span>
      )}
    </div>
  );
}
