"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Settings2, MapPin, Navigation } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { CITIES, PROFESSIONS } from "@/lib/types";
import { Slider } from "@/components/ui/slider";
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
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);

  // UI-only local filter state (profession / price / date are not yet
  // supported by the API — they drive the matching-count query only).
  const [profession, setProfession] = useState<string | null>(null);
  // Default to "Up to £9" — 60% of the 0–15 range.
  const [priceValue, setPriceValue] = useState(9);
  const [dateFilter, setDateFilter] = useState<DateFilter | null>("weekend");

  // Matching-party count. The API only supports city/vibe/q, so the count is
  // approximate (all parties in the selected city, or all if no city).
  const { data, isLoading } = useQuery({
    queryKey: ["parties", "filter", cityFilter, profession, priceValue, dateFilter],
    queryFn: () => api.listParties({ city: cityFilter }),
  });
  const matchCount = data?.parties?.length ?? 0;

  // Apply filters and return to the explore feed. City is already live-synced
  // to the store; profession/price/date are UI-only for now (no store slots).
  const applyAndGo = () => {
    setScreen("home");
  };

  const priceLabel =
    priceValue === 0
      ? "Free"
      : priceValue >= 15
        ? "£15+"
        : `Up to £${priceValue}`;

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
        {/* ── Who are you? (profession pills, single-select) ────────── */}
        <section className="space-y-3">
          <span className="eyebrow">Who are you?</span>
          <div className="flex flex-wrap gap-2">
            {PROFESSIONS.map((p) => {
              const selected = profession === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProfession(selected ? null : p)}
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
