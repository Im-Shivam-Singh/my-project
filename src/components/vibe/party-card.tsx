"use client";

import {
  MapPin,
  Calendar,
  Clock,
  Users,
  IndianRupee,
  Sparkles,
  Heart,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatDateLabel,
  formatFee,
  formatTime,
  parseVibes,
  pickGuestAvatars,
  partyLiveStatus,
  slotsLeft,
  type Party,
} from "@/lib/types";
import { VibeBadge } from "./vibe-badge";
import { GuestAvatars } from "./guest-avatars";
import { LiveCountdown } from "./live-countdown";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";

interface PartyCardProps {
  party: Party;
  onOpen: (id: string) => void;
  className?: string;
}

export function PartyCard({ party, onOpen, className }: PartyCardProps) {
  const vibes = parseVibes(party.vibes).slice(0, 4);
  const left = slotsLeft(party.maxGuests, party.guestCount);
  const isLow = left > 0 && left <= 5;
  const isFull = left === 0;
  const status = partyLiveStatus(party.date, party.time);
  const isLive = status === "live";
  const isStartingSoon = status === "starting-soon";

  const saved = useAppStore((s) => s.savedPartyIds.includes(party.id));
  const toggleSaved = useAppStore((s) => s.toggleSaved);

  const guests = pickGuestAvatars(party.id, Math.min(5, party.guestCount));

  const onSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleSaved(party.id);
    toast.success(saved ? "Removed from saved" : "Saved to your list", {
      duration: 1500,
    });
  };

  // "Featured" feel: parties that are live OR have a high guest fill ratio get
  // a rotating holo ring in the top corner. Pure visual flourish.
  const featured = isLive || party.guestCount / Math.max(1, party.maxGuests) >= 0.75;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(party.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(party.id);
        }
      }}
      className={cn(
        "group relative w-full cursor-pointer overflow-hidden rounded-3xl text-left transition-all duration-300 press-feedback",
        "glass vibe-gradient-border",
        "hover:-translate-y-1 hover:glow-pink",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-pink/60",
        isLive && "ring-1 ring-pink/40 glow-pink",
        className,
      )}
    >
      {/* Live now accent strip on top edge */}
      {isLive && (
        <div className="absolute inset-x-0 top-0 z-20 h-0.5 vibe-gradient-bg animate-pulse" />
      )}

      {/* Featured holo badge — top-right corner */}
      {featured && (
        <div
          aria-hidden
          className="absolute right-2.5 top-2.5 z-20 flex h-7 w-7 items-center justify-center"
        >
          <span className="absolute inset-0 rounded-full vibe-gradient-bg opacity-60 blur-[6px]" />
          <span className="absolute inset-0 rounded-full border border-dashed border-white/60 holo-spin" />
          <Flame className="relative h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
      )}

      {/* Cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {party.coverUrl ? (
          <img
            src={party.coverUrl}
            alt={party.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full vibe-gradient-bg opacity-80" />
        )}
        {/* Violet→transparent gradient overlay for that Gen Z mood */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-violet/45 to-transparent" />
        {/* Subtle holo sheen on hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-cyan/15 via-transparent to-pink/15 mix-blend-screen" />

        {/* Top chips */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col gap-1.5">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
                isFull
                  ? "bg-rose-500/30 text-rose-100 border border-rose-400/60"
                  : isLow
                    ? "bg-amber-500/30 text-amber-100 border border-amber-400/60 shadow-[0_0_18px_-4px_rgba(255,214,10,0.7)]"
                    : "bg-lime-400/20 text-lime-100 border border-lime-300/50 shadow-[0_0_18px_-4px_rgba(199,255,0,0.6)]",
              )}
            >
              {isFull ? "Sold out" : isLow ? `Only ${left} left` : `${left} slots`}
            </span>
            {(isLive || isStartingSoon) && (
              <LiveCountdown date={party.date} time={party.time} />
            )}
          </div>
          <button
            onClick={onSave}
            aria-label={saved ? "Unsave" : "Save"}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md border transition active:scale-90",
              saved
                ? "bg-pink/35 border-pink/70 shadow-[0_0_18px_-4px_rgba(255,46,151,0.8)]"
                : "bg-black/55 border-violet/30 hover:bg-black/75 hover:border-pink/40",
            )}
          >
            <Heart
              className={cn(
                "h-4 w-4 transition",
                saved ? "fill-pink text-pink text-glow-pink" : "text-foreground/80",
              )}
            />
          </button>
        </div>

        {/* Bottom-left: fee badge on cover */}
        <div className="absolute bottom-3 left-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold backdrop-blur-md border",
              party.fee === 0
                ? "vibe-gradient-bg-acid text-black border-transparent shadow-[0_0_22px_-4px_rgba(199,255,0,0.7)]"
                : "vibe-gradient-bg-warm text-black border-transparent shadow-[0_0_22px_-6px_rgba(255,107,53,0.7)]",
            )}
          >
            <IndianRupee className="h-3.5 w-3.5" strokeWidth={2.5} />
            {formatFee(party.fee)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <h3 className="font-display text-lg font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-glow-pink transition">
          {party.title}
        </h3>

        {/* Vibes + guest stack on same row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {vibes.map((v) => (
              <VibeBadge key={v} vibe={v} />
            ))}
          </div>
        </div>

        {/* Metadata grid — each icon a different neon */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[12px]">
          <Meta icon={<MapPin className="h-3.5 w-3.5 text-cyan" />}>
            <span className="truncate">
              {party.area}, {party.city}
            </span>
          </Meta>
          <Meta icon={<Calendar className="h-3.5 w-3.5 text-coral" />}>
            {formatDateLabel(party.date)}
          </Meta>
          <Meta icon={<Clock className="h-3.5 w-3.5 text-sunshine" />}>
            {formatTime(party.time)}
          </Meta>
          <Meta icon={<Users className="h-3.5 w-3.5 text-lime-300" />}>
            {party.guestCount}/{party.maxGuests} going
          </Meta>
        </div>

        {/* Footer: host + going avatars */}
        <div className="flex items-center justify-between gap-2 border-t border-violet/20 pt-3">
          <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-pink" />
            <span className="truncate">
              <span className="text-muted-foreground/70">by</span>{" "}
              <span className="font-medium text-foreground">{party.hostName}</span>
            </span>
          </span>
          {party.guestCount > 0 && (
            <GuestAvatars avatars={guests} total={party.guestCount} size={22} max={3} />
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </span>
  );
}
