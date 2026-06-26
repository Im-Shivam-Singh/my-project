"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Share2,
  Heart,
  MessageCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  currencyForCity,
  formatDateLabel,
  formatFee,
  formatTime,
  parseVibes,
  slotsLeft,
  VIBE_COLORS,
  VIBE_EMOJI,
} from "@/lib/types";
import { ReviewsSection } from "@/components/vibe/reviews-section";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Hero background per first vibe — deep tinted colors from the spec
// (R&B/purple → #1a1035, Games/teal → #0d1f2d, Bollywood/green → #1a2410).
const VIBE_HERO_BG: Record<string, string> = {
  "R&B": "#1a1035",
  Bollywood: "#1a2410",
  BYOB: "#1a1035",
  Games: "#0d1f2d",
  "Lo-fi": "#1a1035",
  Chill: "#0d1f2d",
  EDM: "#1a1035",
  Retro: "#0d1f2d",
};

// Demo guest initials shown in the "Who's going" stack — full names are
// hidden until payment per the spec ("mystery is the mechanic").
const GUEST_INITIALS = ["P", "R", "J", "S"];
const GUEST_AVATAR_COLORS = [
  "bg-purple-500/30 text-purple-200",
  "bg-teal-500/25 text-teal-200",
  "bg-amber-500/25 text-amber-200",
  "bg-purple-500/20 text-purple-200",
];

export function DetailScreen() {
  const id = useAppStore((s) => s.selectedPartyId);
  const goBack = useAppStore((s) => s.goBack);
  const currentUser = useAppStore((s) => s.currentUser);
  const setSelectedThreadId = useAppStore((s) => s.setSelectedThreadId);
  const setScreen = useAppStore((s) => s.setScreen);
  const saved = useAppStore((s) =>
    id ? s.savedPartyIds.includes(id) : false,
  );
  const toggleSaved = useAppStore((s) => s.toggleSaved);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["party", id],
    queryFn: () => api.getParty(id!),
    enabled: !!id,
  });

  // Menu preview — drinks/snacks available for pre-order on the payment screen.
  const { data: menuData } = useQuery({
    queryKey: ["menu", id],
    queryFn: () => api.listMenu(id!),
    enabled: !!id,
  });

  // Record a view once per party detail mount (for host analytics)
  useEffect(() => {
    if (!id) return;
    api.recordView(id, currentUser?.id).catch(() => {
      /* non-blocking */
    });
  }, [id, currentUser?.id]);

  const messageHost = async () => {
    if (!currentUser || !data?.host) {
      toast.error("Sign in to message the host");
      return;
    }
    try {
      const res = await api.ensureThread(
        currentUser.id,
        data.host.id,
        data.party.id,
      );
      setSelectedThreadId(res.threadId);
      setScreen("chat");
    } catch {
      toast.error("Couldn't open chat");
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: data?.party.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {
      /* user cancelled */
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="animate-screen-in space-y-4 p-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Couldn't load this party.
        </p>
        <Button variant="outline" onClick={goBack}>
          Go back
        </Button>
      </div>
    );
  }

  const { party, host, vibes } = data;
  const firstVibe = vibes[0] || parseVibes(party.vibes)[0] || "Chill";
  const heroBg = VIBE_HERO_BG[firstVibe] || "#1a1035";
  const heroEmoji = VIBE_EMOJI[firstVibe] || "✨";
  const currency = currencyForCity(party.city);
  const left = slotsLeft(party.maxGuests, party.guestCount);
  const going = party.guestCount;
  const isFull = left === 0;
  const isLow = left > 0 && left <= 2;
  const isOwn = !!currentUser && !!host && currentUser.id === host.id;

  // End time = start + 4h (matches the spec's ~4h default party duration)
  const [hStr, mStr] = party.time.split(":");
  const startH = parseInt(hStr, 10) || 0;
  const startM = parseInt(mStr, 10) || 0;
  const endTotalMin = startH * 60 + startM + 4 * 60;
  const endH = Math.floor(endTotalMin / 60) % 24;
  const endM = endTotalMin % 60;
  const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

  const feeLabel = formatFee(party.fee, party.city);
  const menuItems = (menuData?.items ?? []).slice(0, 4);
  const menuOverflow = (menuData?.items ?? []).length - menuItems.length;

  const handleJoin = () => {
    if (isFull) {
      toast.info("Sold out — join the waitlist", {
        description: "We'll notify you if a spot opens up.",
      });
      return;
    }
    // selectedPartyId is already set — go straight to the payment screen.
    setScreen("payment");
  };

  const handleSaveToggle = () => {
    toggleSaved(id!);
    toast.success(saved ? "Removed from saved" : "Saved!", {
      duration: 1500,
    });
  };

  return (
    <div className="flex h-full flex-col animate-screen-in">
      {/* Scrollable content */}
      <div className="fancy-scrollbar flex-1 overflow-y-auto pb-40">
        {/* ── HERO ─────────────────────────────────────────────────── */}
        <div
          className="relative h-44 w-full overflow-hidden"
          style={{ background: heroBg }}
        >
          {/* Subtle sheen for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" />

          {/* Large emoji centerpiece */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="vibe-float text-5xl opacity-90"
              aria-hidden
            >
              {heroEmoji}
            </span>
          </div>

          {/* Back button (top-left, 32px round) */}
          <button
            onClick={goBack}
            className="absolute left-3 top-[max(env(safe-area-inset-top),12px)] flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-95"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Share button (top-right, 32px round) */}
          <button
            onClick={share}
            className="absolute right-3 top-[max(env(safe-area-inset-top),12px)] flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition active:scale-95"
            aria-label="Share"
          >
            <Share2 className="h-4 w-4" />
          </button>

          {/* Theme pill (bottom-left) */}
          <span className="absolute bottom-3 left-3 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {firstVibe}
          </span>

          {/* Spots pill (bottom-right) */}
          {isFull ? (
            <span className="absolute bottom-3 right-3 rounded-lg bg-coral px-2.5 py-1 text-xs font-semibold text-white">
              Sold out
            </span>
          ) : isLow ? (
            <span className="absolute bottom-3 right-3 rounded-lg bg-coral/80 px-2.5 py-1 text-xs font-semibold text-white">
              {left} left!
            </span>
          ) : (
            <span className="absolute bottom-3 right-3 rounded-lg bg-purple-500/80 px-2.5 py-1 text-xs font-semibold text-white">
              {going} going · {left} left
            </span>
          )}
        </div>

        {/* ── BODY ─────────────────────────────────────────────────── */}
        <div className="space-y-4 p-4">
          {/* Title row */}
          <section className="space-y-1.5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h1 className="flex-1 font-display text-xl font-bold leading-tight text-foreground">
                {party.title}
              </h1>
              <span className="shrink-0 rounded-lg bg-purple-500/20 px-2.5 py-1 text-sm font-medium text-purple-300">
                {feeLabel} entry
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Pay once · drinks add-on available after
            </p>
          </section>

          {/* Meta grid 2×2 */}
          <section className="grid grid-cols-2 gap-2">
            <MetaCell
              emoji="📅"
              text={`${formatDateLabel(party.date)} · ${formatTime(party.time)}`}
            />
            <MetaCell emoji="🕑" text={`Ends ~${formatTime(endTime)}`} />
            <MetaCell emoji="📍" text={`${party.area}, ${party.city}`} />
            <MetaCell emoji="👥" text={`Max ${party.maxGuests} guests`} />
          </section>

          {/* Tag row — multi-color vibe chips + visual 21+/Students tags */}
          <section className="flex flex-wrap gap-1.5">
            {vibes.map((v) => {
              const cls =
                VIBE_COLORS[v] ||
                "bg-purple-500/15 text-purple-300 border-purple-500/45";
              return (
                <span
                  key={v}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                    cls,
                  )}
                >
                  {v}
                </span>
              );
            })}
            {party.fee > 0 && (
              <span className="rounded-full border border-coral/35 bg-coral/10 px-2.5 py-0.5 text-[11px] font-semibold text-coral">
                21+
              </span>
            )}
            <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
              Students
            </span>
          </section>

          {/* Host card — with teal Verified badge */}
          {host && (
            <section className="glass flex items-center gap-3 rounded-2xl p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500/30 text-sm font-bold text-purple-200">
                {host.name.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {host.name}
                  </p>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-semibold text-teal-300">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="text-amber-300">★★★★★</span>{" "}
                  <span className="font-medium text-foreground/80">
                    {host.rating.toFixed(1)}
                  </span>{" "}
                  · {host.hosted} parties
                </p>
              </div>
              {!isOwn && (
                <button
                  onClick={messageHost}
                  className="flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-500/10 px-3 text-xs font-semibold text-purple-300 transition active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Message
                </button>
              )}
            </section>
          )}

          {/* Who's going — guest initials, locked until payment */}
          <section className="glass rounded-2xl p-3">
            <span className="eyebrow">Who's going</span>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center">
                {GUEST_INITIALS.map((letter, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full border border-card text-[11px] font-bold",
                      GUEST_AVATAR_COLORS[i % GUEST_AVATAR_COLORS.length],
                    )}
                    style={{
                      marginLeft: i === 0 ? 0 : -8,
                      zIndex: GUEST_INITIALS.length - i,
                    }}
                  >
                    {letter}
                  </div>
                ))}
                {going > GUEST_INITIALS.length && (
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-card bg-white/5 text-[10px] font-bold text-muted-foreground"
                    style={{ marginLeft: -8 }}
                  >
                    +{going - GUEST_INITIALS.length}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {going} going
              </span>
            </div>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Full names visible after payment
            </p>
          </section>

          {/* About this party */}
          {party.description && (
            <section className="space-y-1.5">
              <span className="eyebrow">About this party</span>
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {party.description}
              </p>
            </section>
          )}

          {/* Menu preview */}
          <section className="glass rounded-2xl p-3">
            <span className="eyebrow">Menu preview</span>
            {menuItems.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No pre-order menu
              </p>
            ) : (
              <ul className="mt-2.5 space-y-2">
                {menuItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-foreground">
                      <span className="text-base leading-none">
                        {item.emoji}
                      </span>
                      <span className="truncate font-medium">{item.name}</span>
                    </span>
                    <span className="shrink-0 font-medium text-purple-300">
                      {currency}
                      {item.price}
                    </span>
                  </li>
                ))}
                {menuOverflow > 0 && (
                  <li className="text-xs text-muted-foreground">
                    +{menuOverflow} more
                  </li>
                )}
              </ul>
            )}
          </section>

          {/* Reviews — KEEP existing ReviewsSection component */}
          {party.id && <ReviewsSection partyId={party.id} />}
        </div>
      </div>

      {/* ── STICKY CTA — Join for £N · get your spot ────────────────── */}
      <div className="fixed inset-x-0 bottom-[84px] z-30 mx-auto max-w-[480px] px-4">
        <div className="flex items-center gap-2">
          {/* Save / heart toggle */}
          <button
            onClick={handleSaveToggle}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition active:scale-95",
              saved
                ? "border-coral/50 bg-coral/15 text-coral"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
            aria-label={saved ? "Unsave" : "Save"}
          >
            <Heart className={cn("h-5 w-5", saved && "fill-coral")} />
          </button>

          {/* Primary CTA */}
          {isOwn ? (
            <button
              onClick={() => setScreen("host-dashboard")}
              className="press-feedback glow-violet flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground"
            >
              Manage your party
            </button>
          ) : (
            <button
              onClick={handleJoin}
              className={cn(
                "press-feedback flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition",
                isFull
                  ? "bg-white/8 text-muted-foreground"
                  : "glow-violet bg-primary text-primary-foreground",
              )}
            >
              {isFull ? (
                "Sold out — join waitlist"
              ) : (
                <>
                  <span>Join for {feeLabel}</span>
                  <span className="opacity-50">·</span>
                  <span>get your spot</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Meta cell for the 2×2 meta grid ──────────────────────────────────
function MetaCell({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-white/4 p-2.5 text-xs">
      <span aria-hidden className="text-sm leading-none">
        {emoji}
      </span>
      <span className="min-w-0 truncate text-foreground/90">{text}</span>
    </div>
  );
}
