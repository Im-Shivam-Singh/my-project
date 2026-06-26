"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  X,
  MapPin,
  CalendarClock,
  Flame,
  TrendingUp,
  Heart,
  Sparkles,
  Map as MapIcon,
  Wand2,
  Bell,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { CITIES, VIBE_TAGS, VIBE_EMOJI, VIBE_COLORS, parseVibes } from "@/lib/types";
import { PartyCard } from "@/components/vibe/party-card";
import { EmptyState } from "@/components/vibe/empty-state";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type FeedTab = "for-you" | "all";

export function HomeScreen() {
  const cityFilter = useAppStore((s) => s.cityFilter);
  const vibeFilter = useAppStore((s) => s.vibeFilter);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setCityFilter = useAppStore((s) => s.setCityFilter);
  const setVibeFilter = useAppStore((s) => s.setVibeFilter);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setSelectedPartyId = useAppStore((s) => s.setSelectedPartyId);
  const setScreen = useAppStore((s) => s.setScreen);
  const openCreate = useAppStore((s) => s.openCreate);
  const savedCount = useAppStore((s) => s.savedPartyIds.length);
  const currentUser = useAppStore((s) => s.currentUser);

  const [tab, setTab] = useState<FeedTab>("for-you");

  // Standard feed query — used by both tabs (For You is a re-rank of the same data,
  // combined with the personalization endpoint for vibe matching)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parties", cityFilter, vibeFilter, searchQuery],
    queryFn: () =>
      api.listParties({
        city: cityFilter,
        vibe: vibeFilter,
        q: searchQuery || undefined,
      }),
  });

  // Personalized feed — ranked by vibe overlap with the user's preferences
  const { data: forYouData } = useQuery({
    queryKey: ["for-you", currentUser?.id],
    queryFn: () => api.forYou(currentUser!.id),
    enabled: !!currentUser && tab === "for-you" && !searchQuery && !vibeFilter,
    staleTime: 60_000,
  });

  const parties = data?.parties ?? [];

  const hotTonight = useMemo(
    () =>
      parties.filter((p) => {
        const d = new Date(p.date + "T00:00:00");
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diff = (target.getTime() - today.getTime()) / 86400000;
        return diff >= 0 && diff <= 1;
      }),
    [parties],
  );

  // For You parties — fall back to all parties if no personalization yet
  const forYouParties = forYouData?.parties ?? parties;
  const matchedVibes = forYouData?.matchedVibes ?? [];

  const openParty = (id: string) => {
    setSelectedPartyId(id);
    setScreen("detail");
  };

  // Decide which list to show based on tab + active filters
  // (For You is only meaningful when no search/vibe filter is active — otherwise we
  // fall back to "all" semantics so the user sees the filtered list)
  const showForYou = tab === "for-you" && !searchQuery && !vibeFilter;
  const displayParties = showForYou ? forYouParties : parties;

  return (
    <div className="flex h-full flex-col animate-screen-in">
      {/* Header */}
      <header className="sticky top-0 z-20 space-y-3 px-4 pb-2 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="glass -mx-4 px-4 pb-3 pt-2 border-b border-violet/20">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 rounded-full glass border border-violet/30 px-2.5 py-1 mb-1.5">
                <MapPin className="h-3 w-3 text-coral vibe-pulse" />
                <span className="text-[11px] font-semibold text-foreground/90">
                  {cityFilter || "All cities"}
                </span>
              </div>
              <h1 className="font-display text-2xl font-extrabold leading-tight">
                <span className="vibe-gradient-text">Tonight in {cityFilter || "India"}</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setScreen("map")}
                className="flex h-10 w-10 items-center justify-center rounded-full glass border border-violet/30 text-cyan transition hover:border-cyan/60 hover:bg-cyan/10 active:scale-95"
                aria-label="Open vibe map"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <span
                className="relative flex h-10 w-10 items-center justify-center rounded-full glass border border-violet/30"
                role="status"
                aria-label="No new notifications"
              >
                <Bell className="h-4 w-4 text-cyan" />
                <span
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-pink vibe-live-ring"
                  aria-hidden
                />
              </span>
              <button
                onClick={() => setScreen("saved")}
                className="relative flex h-10 w-10 items-center justify-center rounded-full glass border border-violet/30 text-pink transition hover:border-pink/60 hover:bg-pink/10 active:scale-95"
                aria-label="Saved parties"
              >
                <Heart className="h-4 w-4" />
                {savedCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-pink px-1 text-[9px] font-bold text-black glow-pink">
                    {savedCount}
                  </span>
                )}
              </button>
              <button
                onClick={openCreate}
                className="flex h-10 items-center gap-1.5 rounded-full vibe-gradient-bg-warm px-3 text-xs font-bold text-black glow-pink transition active:scale-95"
              >
                <Flame className="h-4 w-4" />
                Host
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan/70" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parties, areas, vibes…"
              className="h-11 w-full rounded-xl glass border border-violet/30 pl-9 pr-9 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-cyan/60 focus:ring-2 focus:ring-cyan/25"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stories-style vibe carousel */}
        <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-1">
          <VibeStory
            label="All"
            active={!vibeFilter}
            onClick={() => setVibeFilter(null)}
            highlight
          />
          {VIBE_TAGS.map((v) => (
            <VibeStory
              key={v}
              label={v}
              emoji={VIBE_EMOJI[v]}
              active={vibeFilter === v}
              onClick={() => setVibeFilter(vibeFilter === v ? null : v)}
            />
          ))}
        </div>

        {/* City chips */}
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          <CityChip
            label="All cities"
            active={!cityFilter}
            onClick={() => setCityFilter(null)}
          />
          {CITIES.map((c) => (
            <CityChip
              key={c}
              label={c}
              active={cityFilter === c}
              onClick={() => setCityFilter(cityFilter === c ? null : c)}
            />
          ))}
        </div>

        {/* For You / All tab toggle — only when no search/vibe filter is active */}
        {!searchQuery && !vibeFilter && (
          <div className="flex gap-1 rounded-full border border-violet/25 bg-card/40 p-1 glass">
            <button
              onClick={() => setTab("for-you")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition",
                tab === "for-you"
                  ? "vibe-gradient-bg text-black glow-pink active:scale-95"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Wand2 className="h-3.5 w-3.5" />
              For You
            </button>
            <button
              onClick={() => setTab("all")}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-bold transition",
                tab === "all"
                  ? "vibe-gradient-bg text-black glow-pink active:scale-95"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              All
            </button>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="fancy-scrollbar flex-1 space-y-6 overflow-y-auto px-4 pb-4">
        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="overflow-hidden rounded-3xl border border-border bg-card/60"
              >
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={MapPin}
            title="Couldn't load parties"
            description="Something went wrong fetching the feed. Try again."
            action={
              <button
                onClick={() => refetch()}
                className="rounded-full vibe-gradient-bg px-4 py-2 text-sm font-semibold text-white"
              >
                Retry
              </button>
            }
          />
        )}

        {!isLoading && !isError && parties.length === 0 && (
          <EmptyState
            icon={CalendarClock}
            title="No parties match your filters"
            description="Try clearing filters or launch your own vibe to get the night started."
            action={
              <button
                onClick={openCreate}
                className="rounded-full vibe-gradient-bg px-4 py-2 text-sm font-semibold text-white"
              >
                Launch a vibe
              </button>
            }
          />
        )}

        {!isLoading && !isError && displayParties.length > 0 && (
          <>
            {/* For You banner — shown when on the personalized tab with no filters */}
            {showForYou && (
              <div className="overflow-hidden rounded-2xl gold-foil p-3 glow-violet">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full vibe-gradient-bg glow-pink">
                    <Wand2 className="h-4 w-4 text-black" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      <span className="vibe-gradient-text">Tuned for your vibe</span>
                    </p>
                    <p className="text-[11px] text-foreground/70">
                      {matchedVibes.length > 0
                        ? `Ranked by your love for ${matchedVibes.slice(0, 3).join(", ")}`
                        : "Update your vibe preferences to personalize this feed"}
                    </p>
                  </div>
                </div>
                {matchedVibes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {matchedVibes.map((v) => (
                      <span
                        key={v}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border bg-gradient-to-br px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm",
                          VIBE_COLORS[v] ||
                            "from-pink/20 to-violet/20 text-pink-200 border-pink-400/40",
                        )}
                      >
                        {VIBE_EMOJI[v]} {v}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {vibeFilter && (
              <div className="flex items-center justify-between rounded-2xl border border-pink/30 bg-pink/5 px-3 py-2 glass">
                <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-acid" />
                  Filtered by{" "}
                  <span className="font-semibold vibe-gradient-text">{vibeFilter}</span>
                </span>
                <button
                  onClick={() => setVibeFilter(null)}
                  className="text-xs font-medium text-cyan hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Hot tonight — only on All tab (For You has its own ordering) */}
            {!showForYou && hotTonight.length > 0 && (
              <section>
                <div className="mb-2 flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-coral" />
                  <h2 className="font-display text-sm font-semibold text-coral">
                    Hot tonight &amp; tomorrow
                  </h2>
                  <span className="block h-0.5 flex-1 rounded-full bg-gradient-to-r from-coral/60 via-pink/40 to-violet/40" />
                </div>
                <div className="space-y-3">
                  {hotTonight.map((p) => (
                    <PartyCard key={p.id} party={p} onOpen={openParty} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-display text-sm font-semibold text-foreground">
                    {showForYou
                      ? "Recommended for you"
                      : cityFilter
                        ? `All in ${cityFilter}`
                        : "All upcoming"}
                  </h2>
                  <span className="block h-0.5 w-6 rounded-full bg-gradient-to-r from-pink to-cyan" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {displayParties.length} parties
                </span>
              </div>
              <div className="space-y-3">
                {displayParties.map((p) => (
                  <PartyCard key={p.id} party={p} onOpen={openParty} />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function VibeStory({
  label,
  emoji,
  active,
  onClick,
  highlight,
}: {
  label: string;
  emoji?: string;
  active?: boolean;
  onClick: () => void;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 flex-col items-center gap-1.5"
    >
      <span className="relative flex h-16 w-16 items-center justify-center">
        {active && (
          <span
            className="absolute inset-0 rounded-full vibe-gradient-bg holo-spin glow-pink"
            aria-hidden
          />
        )}
        <span
          className={cn(
            "relative flex h-[58px] w-[58px] m-[3px] items-center justify-center rounded-full text-2xl transition",
            active
              ? "bg-card"
              : highlight
                ? "border-2 border-acid/50 bg-acid/10 hover:border-acid"
                : "border-2 border-violet/20 bg-card/60 hover:border-pink/40",
          )}
        >
          {emoji || (highlight ? <Sparkles className="h-6 w-6 text-acid" /> : "✨")}
        </span>
      </span>
      <span
        className={cn(
          "text-[10px] font-medium",
          active ? "vibe-gradient-text font-bold" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </button>
  );
}

function CityChip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95",
        active
          ? "border-transparent vibe-gradient-bg text-black glow-pink"
          : "border-violet/20 glass text-foreground/80 hover:text-foreground hover:border-cyan/40",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
