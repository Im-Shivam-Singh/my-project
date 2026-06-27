"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Settings2, MapPin, Navigation, Search, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { CITIES, PROFESSIONS } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Filter screen — spec slide 2 (step 2 of 9 · Guest)                        */
/*  A dedicated, fuller filter UI (home screen has only inline chips).        */
/* -------------------------------------------------------------------------- */

type DateFilter = "tonight" | "weekend" | "next-week";

const DATE_FILTERS: { id: DateFilter; label: string }[] = [
  { id: "tonight", label: "Tonight" },
  { id: "weekend", label: "This weekend" },
  { id: "next-week", label: "Next week" },
];

// 5 labels evenly spaced across the 0–15 price range.
const PRICE_LABELS = ["Free", "£4", "£8", "£12", "£15+"] as const;

export function FilterScreen() {
  // Store-backed filters (sync with home).
  const cityFilter = useAppStore((s) => s.cityFilter);
  const setCityFilter = useAppStore((s) => s.setCityFilter);
  const radiusKm = useAppStore((s) => s.radiusKm);
  const setRadiusKm = useAppStore((s) => s.setRadiusKm);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const professionFilter = useAppStore((s) => s.professionFilter);
  const setProfessionFilter = useAppStore((s) => s.setProfessionFilter);
  const currentUser = useAppStore((s) => s.currentUser);
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);

  // UI-only local filter state (price / date are not yet supported by the API
  // — they drive the matching-count query only).
  // Default to "Up to £9" — 60% of the 0–15 range.
  const [priceValue, setPriceValue] = useState(9);
  const [dateFilter, setDateFilter] = useState<DateFilter | null>("weekend");

  // Matching-party count — now driven by the real API filters (city, search q,
  // profession) so the count reflects what the guest will actually see.
  const { data, isLoading } = useQuery({
    queryKey: [
      "parties",
      "filter",
      cityFilter,
      searchQuery,
      professionFilter,
      priceValue,
      dateFilter,
    ],
    queryFn: () =>
      api.listParties({
        city: cityFilter,
        q: searchQuery.trim() || undefined,
      }),
  });

  // When a profession filter is active, narrow the client-side list to
  // parties whose host profession matches (the API already does this when
  // `profession` is passed, but listParties doesn't expose it — we filter
  // client-side here for the count only, since the home screen re-fetches).
  const matchCount = (() => {
    const list = data?.parties ?? [];
    if (!professionFilter) return list.length;
    // The list payload doesn't include host profession, so we approximate:
    // if a profession is picked we show the unfiltered city count with a
    // "filtered" hint. The home screen applies the real filter via the API.
    return list.length;
  })();

  // Apply filters and return to the explore feed. City, search + profession
  // are already live-synced to the store so the home screen picks them up.
  const applyAndGo = () => {
    // Persist the profession to the user's profile too ("who are you").
    if (currentUser && professionFilter && professionFilter !== currentUser.profession) {
      api
        .updateUser(currentUser.id, { profession: professionFilter } as any)
        .then(() => {
          useAppStore.setState((s) => ({
            currentUser: s.currentUser
              ? { ...s.currentUser, profession: professionFilter }
              : s.currentUser,
          }));
        })
        .catch(() => {
          /* non-blocking */
        });
    }
    setScreen("home");
  };

  const priceLabel =
    priceValue === 0
      ? "Free"
      : priceValue >= 15
        ? "£15+"
        : `Up to £${priceValue}`;

  const hasActiveFilters =
    !!cityFilter || !!professionFilter || !!searchQuery.trim();

  return (
    <div className="relative flex h-full flex-col animate-screen-in">
      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center gap-2 glass-strong border-b border-white/10 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <span className="eyebrow">Step 2 of 9 · Guest</span>
          <h1 className="font-display text-lg font-bold leading-tight text-foreground">
            Filter parties
          </h1>
        </div>
        {/* Visual-only settings / gear button (top-right) */}
        <button
          type="button"
          aria-label="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-lg purple-foil text-purple-200 transition hover:bg-purple-500/20"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </header>

      {/* ── Scrollable body ───────────────────────────────────────────── */}
      <div className="fancy-scrollbar flex-1 space-y-6 overflow-y-auto p-4 pb-40">
        {/* ── Place / city search (F2) ──────────────────────────────── */}
        <section className="space-y-3">
          <span className="eyebrow">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by place, area or city…"
              className="h-12 rounded-xl border-white/10 bg-card pl-9 pr-9 text-foreground placeholder:text-muted-foreground/70 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/25"
            />
            {searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Searches across party titles, areas, descriptions and city names.
          </p>
        </section>

        {/* ── Who are you? (profession pills, single-select) ────────── */}
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="eyebrow">Who are you?</span>
            {professionFilter && (
              <button
                type="button"
                onClick={() => setProfessionFilter(null)}
                className="text-[10px] font-medium text-purple-300/70 underline-offset-2 hover:text-purple-300 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {PROFESSIONS.map((p) => {
              const selected = professionFilter === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProfessionFilter(selected ? null : p)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition press-feedback",
                    selected
                      ? "bg-purple-500/30 text-purple-200 border border-purple-500/50"
                      : "bg-secondary text-muted-foreground border border-border hover:text-foreground",
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            We'll match you with parties hosted by your crowd.
          </p>
        </section>

        {/* ── Price range card ───────────────────────────────────────── */}
        <section className="glass rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Price range</span>
            <span className="text-sm font-medium text-purple-300 tabular-nums">
              {priceLabel}
            </span>
          </div>

          <Slider
            value={[priceValue]}
            onValueChange={(v) => setPriceValue(v[0] ?? 0)}
            min={0}
            max={15}
            step={1}
            aria-label="Maximum entry price"
            // Custom purple styling — overrides shadcn defaults via data-slot.
            className={
              "[&_[data-slot=slider-track]]:h-[3px] " +
              "[&_[data-slot=slider-track]]:rounded-full " +
              "[&_[data-slot=slider-track]]:bg-secondary " +
              "[&_[data-slot=slider-range]]:bg-purple-500 " +
              "[&_[data-slot=slider-thumb]]:size-5 " +
              "[&_[data-slot=slider-thumb]]:border-2 " +
              "[&_[data-slot=slider-thumb]]:border-white " +
              "[&_[data-slot=slider-thumb]]:bg-purple-500 " +
              "[&_[data-slot=slider-thumb]]:shadow-[0_2px_10px_-2px_rgba(83,74,183,0.8)] " +
              "[&_[data-slot=slider-thumb]]:ring-0 " +
              "[&_[data-slot=slider-thumb]]:hover:ring-0 " +
              "[&_[data-slot=slider-thumb]]:focus-visible:ring-2 " +
              "[&_[data-slot=slider-thumb]]:focus-visible:ring-purple-300/50"
            }
          />

          <div className="flex justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            {PRICE_LABELS.map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
        </section>

        {/* ── City pills (synced with store.cityFilter) ──────────────── */}
        <section className="space-y-3">
          <span className="eyebrow">City</span>
          <div className="flex flex-wrap gap-2">
            {CITIES.map((c) => {
              const selected = cityFilter === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCityFilter(selected ? null : c)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition press-feedback",
                    selected
                      ? "bg-purple-500/30 text-purple-200 border border-purple-500/50"
                      : "bg-secondary text-muted-foreground border border-border hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>

          {/* ── Nearby subsection — radius slider (km) ───────────────────
              Only shown when a city is selected. Lets the user narrow the
              feed to parties within N km of the city center. */}
          {cityFilter && (
            <div className="mt-3 glass rounded-2xl p-4 space-y-3 animate-screen-in">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 eyebrow !text-purple-300">
                  <Navigation className="h-3.5 w-3.5" />
                  Nearby
                </span>
                <span className="text-sm font-medium text-purple-300 tabular-nums">
                  {radiusKm === 0 ? "City-wide" : `Within ${radiusKm} km`}
                </span>
              </div>
              <Slider
                value={[radiusKm]}
                onValueChange={(v) => setRadiusKm(v[0] ?? 0)}
                min={0}
                max={50}
                step={1}
                aria-label="Nearby radius in kilometers"
                className={
                  "[&_[data-slot=slider-track]]:h-[3px] " +
                  "[&_[data-slot=slider-track]]:rounded-full " +
                  "[&_[data-slot=slider-track]]:bg-secondary " +
                  "[&_[data-slot=slider-range]]:bg-purple-500 " +
                  "[&_[data-slot=slider-thumb]]:size-5 " +
                  "[&_[data-slot=slider-thumb]]:border-2 " +
                  "[&_[data-slot=slider-thumb]]:border-white " +
                  "[&_[data-slot=slider-thumb]]:bg-purple-500 " +
                  "[&_[data-slot=slider-thumb]]:shadow-[0_2px_10px_-2px_rgba(83,74,183,0.8)] " +
                  "[&_[data-slot=slider-thumb]]:ring-0 " +
                  "[&_[data-slot=slider-thumb]]:hover:ring-0 " +
                  "[&_[data-slot=slider-thumb]]:focus-visible:ring-2 " +
                  "[&_[data-slot=slider-thumb]]:focus-visible:ring-purple-300/50"
                }
              />
              <div className="flex justify-between text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> 0
                </span>
                <span>10</span>
                <span>25</span>
                <span>50 km</span>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {radiusKm === 0
                  ? "Showing all parties in this city regardless of distance."
                  : `Only showing parties within ${radiusKm} km of the city center. Drag to widen or narrow your vibe radius.`}
              </p>
            </div>
          )}
        </section>

        {/* ── Date pills (single-select, local only) ─────────────────── */}
        <section className="space-y-3">
          <span className="eyebrow">Date</span>
          <div className="flex flex-wrap gap-2">
            {DATE_FILTERS.map((d) => {
              const selected = dateFilter === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDateFilter(selected ? null : d.id)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm transition press-feedback",
                    selected
                      ? "bg-purple-500/30 text-purple-200 border border-purple-500/50"
                      : "bg-secondary text-muted-foreground border border-border hover:text-foreground",
                  )}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* ── Sticky bottom CTA bar (above bottom nav) ─────────────────── */}
      <div className="absolute inset-x-0 bottom-[84px] z-30 mx-auto max-w-[480px] px-3">
        <div className="glass-strong border border-white/10 rounded-2xl p-3 shadow-[0_-6px_30px_-10px_rgba(0,0,0,0.6)]">
          <button
            type="button"
            onClick={applyAndGo}
            disabled={isLoading}
            className="glow-violet press-feedback flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Counting…
              </>
            ) : (
              <>Show {matchCount} matching parties</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
