"use client";

import { cn } from "@/lib/utils";
import { VIBE_COLORS, VIBE_EMOJI } from "@/lib/types";

interface VibeBadgeProps {
  vibe: string;
  size?: "sm" | "md";
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Per-vibe neon glow classes — one box-shadow color per vibe family so the
 * feed reads like a colorful sticker pack (cyan techno, magenta EDM, etc.).
 */
const VIBE_GLOW: Record<string, string> = {
  Techno: "shadow-[0_0_14px_-3px_rgba(0,240,255,0.55)]",
  Bollywood: "shadow-[0_0_14px_-3px_rgba(255,107,53,0.55)]",
  BYOB: "shadow-[0_0_14px_-3px_rgba(255,214,10,0.55)]",
  Boardgames: "shadow-[0_0_14px_-3px_rgba(199,255,0,0.55)]",
  "Lo-fi": "shadow-[0_0_14px_-3px_rgba(157,78,221,0.6)]",
  Chill: "shadow-[0_0_14px_-3px_rgba(56,189,248,0.55)]",
  EDM: "shadow-[0_0_14px_-3px_rgba(255,46,151,0.6)]",
  Retro: "shadow-[0_0_14px_-3px_rgba(244,63,94,0.55)]",
};

export function VibeBadge({
  vibe,
  size = "sm",
  active,
  onClick,
  className,
}: VibeBadgeProps) {
  const colorClass =
    VIBE_COLORS[vibe] ||
    "from-amber-500/30 to-yellow-600/20 text-amber-200 border-amber-400/50";
  const glowClass = VIBE_GLOW[vibe] || "";
  const emoji = VIBE_EMOJI[vibe] || "✨";
  const sizing =
    size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs";
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-gradient-to-br font-semibold backdrop-blur-md transition",
        colorClass,
        glowClass,
        sizing,
        onClick && "hover:scale-110 hover:-translate-y-0.5 active:scale-95 cursor-pointer",
        active &&
          "ring-2 ring-pink/70 ring-offset-1 ring-offset-background glow-pink",
        className,
      )}
    >
      <span aria-hidden className="text-[1.05em] leading-none">
        {emoji}
      </span>
      {vibe}
    </Tag>
  );
}
