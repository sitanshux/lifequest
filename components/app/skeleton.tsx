import { cn } from "@/lib/utils";

// ============================================================
// Skeleton primitives
// ============================================================

interface SkeletonProps {
  className?: string;
}

/**
 * Base skeleton block. Use for any placeholder content.
 * Inherits the shimmer animation from globals.css .skeleton class.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded", className)}
    />
  );
}

/** Single line of text skeleton */
export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} />;
}

/** Quest row skeleton — matches approximate quest row height */
export function SkeletonQuestRow({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center gap-4 px-4 py-3",
        "border border-[hsl(var(--border))] rounded",
        className
      )}
    >
      {/* Completion checkbox */}
      <Skeleton className="h-5 w-5 flex-shrink-0 rounded-sm" />
      <div className="flex-1 flex flex-col gap-1.5">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-5 w-14 rounded-sm" />
    </div>
  );
}

/** Stat card skeleton */
export function SkeletonStatCard({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex flex-col gap-2 p-4",
        "border border-[hsl(var(--border))] rounded",
        className
      )}
    >
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-7 w-3/4" />
    </div>
  );
}

/** XP bar skeleton */
export function SkeletonXpBar({ className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-1.5 w-full rounded-sm" />
    </div>
  );
}
