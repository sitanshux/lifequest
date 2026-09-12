import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional right-side slot (e.g., a button) */
  action?: React.ReactNode;
  className?: string;
}

/**
 * PageHeader — used at the top of every app page.
 * Title uses Barlow display font. Subtitle in muted body text.
 * Optionally renders an action slot on the right.
 */
export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        "pb-6 border-b border-[hsl(var(--border))]",
        className
      )}
    >
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-barlow)" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[hsl(var(--foreground-muted))] max-w-none">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className="flex-shrink-0 mt-0.5">{action}</div>
      )}
    </div>
  );
}
