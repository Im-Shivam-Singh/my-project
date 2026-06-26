"use client";

import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function UserAvatar({
  name,
  src,
  size = 40,
  ring,
  className,
}: UserAvatarProps) {
  // Padding around the avatar so the gradient ring can breathe. 0 when ring
  // is off so existing tight layouts are unchanged.
  const padding = ring ? Math.max(2, Math.round(size * 0.08)) : 0;
  const innerSize = size - padding * 2;

  return (
    <div
      className={cn(
        "relative shrink-0",
        ring && "rounded-full vibe-gradient-bg glow-pink",
        className,
      )}
      style={{ width: size, height: size, padding }}
    >
      {/* Inner avatar — sits inside the gradient ring */}
      <div
        className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet/40 to-pink/40 ring-1 ring-background"
      >
        {src ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span
            className="font-display font-semibold text-white drop-shadow-[0_0_6px_rgba(255,46,151,0.6)]"
            style={{ fontSize: innerSize * 0.36 }}
          >
            {initials(name)}
          </span>
        )}
      </div>

      {/* Online dot — shown when `ring` is on as a status accent */}
      {ring && (
        <span
          aria-hidden
          className="absolute bottom-0 right-0 block rounded-full bg-lime-300 ring-2 ring-background"
          style={{
            width: Math.max(8, Math.round(size * 0.22)),
            height: Math.max(8, Math.round(size * 0.22)),
            boxShadow: "0 0 10px 2px rgba(199,255,0,0.85)",
          }}
        />
      )}
    </div>
  );
}
