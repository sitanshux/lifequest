"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  className?: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={signingOut}
      aria-label="Sign out of LifeQuest"
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold",
        "border border-[hsl(var(--border))]",
        "bg-[hsl(var(--surface-1))] text-[hsl(var(--foreground-muted))]",
        "hover:bg-[hsl(var(--surface-2))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border-strong))]",
        "transition-colors duration-100",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]",
        signingOut && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <LogOut size={13} strokeWidth={2} />
      <span>{signingOut ? "Signing out…" : "Sign out"}</span>
    </button>
  );
}
