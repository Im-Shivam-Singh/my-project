"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingPillProps {
  rating: number;
  count?: number;
  className?: string;
}

export function RatingPill({ rating, count, className }: RatingPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-yellow-400/10 px-2.5 py-0.5 text-[11px] font-semibold border border-yellow-400/30",
        className,
      )}
    >
      <Star
        className="h-3 w-3 fill-yellow-400 text-yellow-400"
        strokeWidth={2}
      />
      <span className="text-white">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-muted-foreground">({count})</span>
      )}
    </span>
  );
}
