"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="relative">
        {/* soft pink/violet aura behind the icon */}
        <div className="absolute inset-0 rounded-full vibe-gradient-bg opacity-40 blur-2xl scale-125" />
        <div className="absolute inset-0 rounded-3xl vibe-gradient-bg opacity-30 blur-lg" />
        <div className="relative vibe-float flex h-20 w-20 items-center justify-center rounded-3xl glass-strong vibe-gradient-border glow-pink">
          <Icon className="h-9 w-9 text-pink text-glow-pink" strokeWidth={2} />
        </div>
      </div>
      <h3 className="font-display text-xl font-semibold vibe-gradient-text">
        {title}
      </h3>
      {description && (
        <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
