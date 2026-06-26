"use client";

import { cn } from "@/lib/utils";

interface GuestAvatarsProps {
  avatars: string[];
  total: number;
  size?: number;
  max?: number;
  className?: string;
}

/**
 * Rotating neon ring colors — pink → violet → cyan → acid → coral — so the
 * stacked avatars read like a colorful sticker pack.
 */
const RING_COLORS = [
  "ring-pink shadow-[0_0_10px_-2px_rgba(255,46,151,0.8)]",
  "ring-violet shadow-[0_0_10px_-2px_rgba(157,78,221,0.8)]",
  "ring-cyan shadow-[0_0_10px_-2px_rgba(0,240,255,0.8)]",
  "ring-lime-300 shadow-[0_0_10px_-2px_rgba(199,255,0,0.8)]",
  "ring-orange-400 shadow-[0_0_10px_-2px_rgba(255,107,53,0.8)]",
];

/**
 * Overlapping avatar stack showing who's going. Renders up to `max` avatars
 * then a "+N" pill if total exceeds the shown count.
 */
export function GuestAvatars({
  avatars,
  total,
  size = 24,
  max = 4,
  className,
}: GuestAvatarsProps) {
  const shown = avatars.slice(0, max);
  const extra = Math.max(0, total - shown.length);
  const overlap = Math.round(size * 0.42);

  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex items-center" style={{ paddingRight: extra > 0 ? overlap : 0 }}>
        {shown.map((src, i) => (
          <span
            key={i}
            className={cn(
              "relative overflow-hidden rounded-full ring-2 ring-offset-1 ring-offset-background bg-card",
              RING_COLORS[i % RING_COLORS.length],
            )}
            style={{
              width: size,
              height: size,
              marginLeft: i === 0 ? 0 : -overlap,
              zIndex: shown.length - i,
            }}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </span>
        ))}
      </div>
      {extra > 0 && (
        <span
          className="flex items-center justify-center rounded-full vibe-gradient-bg text-[10px] font-bold text-black ring-2 ring-card ring-offset-1 ring-offset-background shadow-[0_0_12px_-2px_rgba(255,46,151,0.7)]"
          style={{
            width: size,
            height: size,
            marginLeft: -overlap,
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}
