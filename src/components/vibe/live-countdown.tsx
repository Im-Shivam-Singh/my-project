"use client";

import { useEffect, useState } from "react";
import { Radio, Hourglass, CheckCircle2, CalendarClock } from "lucide-react";
import {
  countdownTo,
  partyLiveStatus,
  type PartyLiveStatus,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface LiveBadgeProps {
  date: string;
  time: string;
  className?: string;
  size?: "sm" | "md";
  durationHours?: number;
}

const STATUS_STYLES: Record<
  PartyLiveStatus,
  {
    bg: string;
    text: string;
    icon: typeof Radio;
    label: (c: string) => string;
    extra?: string;
  }
> = {
  // Hot magenta — LIVE NOW
  live: {
    bg: "bg-pink/25 border-pink/60",
    text: "text-pink text-glow-pink",
    icon: Radio,
    label: () => "Live now",
    extra: "vibe-live-ring",
  },
  // Amber + coral — starting soon (warm urgency)
  "starting-soon": {
    bg: "bg-orange-500/25 border-orange-400/60",
    text: "text-orange-200",
    icon: Hourglass,
    label: (c: string) => `Starts ${c}`,
    extra: "shadow-[0_0_18px_-4px_rgba(255,107,53,0.7)]",
  },
  // Electric cyan — today
  today: {
    bg: "bg-cyan-500/20 border-cyan-400/55",
    text: "text-cyan-100",
    icon: CalendarClock,
    label: (c: string) => `Today · ${c}`,
    extra: "shadow-[0_0_16px_-4px_rgba(0,240,255,0.6)]",
  },
  // Electric violet — upcoming
  upcoming: {
    bg: "bg-violet-500/20 border-violet-400/55",
    text: "text-violet-200",
    icon: CalendarClock,
    label: (c: string) => `Starts ${c}`,
    extra: "shadow-[0_0_16px_-4px_rgba(157,78,221,0.6)]",
  },
  // Muted — ended
  past: {
    bg: "bg-secondary/40 border-border/40",
    text: "text-muted-foreground",
    icon: CheckCircle2,
    label: () => "Ended",
  },
};

/**
 * LiveCountdown — a self-updating badge that shows the current live status
 * of a party ("Live now", "Starts in 2h 15m", "Today · in 5h", "Ended").
 * Re-renders every 30s so the countdown stays fresh.
 */
export function LiveCountdown({
  date,
  time,
  className,
  size = "sm",
  durationHours = 4,
}: LiveBadgeProps) {
  // tick state to force re-render every 30s
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const status = partyLiveStatus(date, time, durationHours);
  const countdown = countdownTo(date, time, durationHours);
  const cfg = STATUS_STYLES[status];
  const Icon = cfg.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-semibold backdrop-blur-md",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        cfg.bg,
        cfg.text,
        cfg.extra,
        className,
      )}
    >
      <Icon
        className={cn(
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5",
          status === "live" && "animate-pulse",
        )}
      />
      {cfg.label(countdown)}
    </span>
  );
}
