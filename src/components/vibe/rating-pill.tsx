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
        "inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-200 border border-amber-300/30 shadow-[0_0_14px_-4px_rgba(255,214,10,0.6)]",
        className,
      )}
    >
      <Star
        className="h-3 w-3 fill-amber-300 text-amber-300 drop-shadow-[0_0_6px_rgba(255,214,10,0.85)]"
        strokeWidth={2}
      />
      <span className="text-amber-100">{rating.toFixed(1)}</span>
      {count !== undefined && (
        <span className="text-amber-200/55">({count})</span>
      )}
    </span>
  );
}
