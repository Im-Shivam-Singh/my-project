"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  List,
  MapPin,
  Sparkles,
  Crosshair,
  Flame,
  Navigation,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  CITIES,
  CITY_CENTERS,
  VIBE_EMOJI,
  FUN_TIER_META,
  haversineKm,
  partyCoords,
  partyLiveStatus,
  parseVibes,
  funScore,
  funTier,
  projectLatLng,
  type Party,
  type FunTier,
} from "@/lib/types";
import { EmptyState } from "@/components/vibe/empty-state";
import { cn } from "@/lib/utils";

const RADII = [1, 2, 5, 10, 25] as const;
type Radius = (typeof RADII)[number];

// Uniform yellow distance rings — Bumble uses one accent only.
// Each ring has the same yellow stroke + a soft matching glow.
const RING_COLORS = [
  {
    stroke: "rgba(255,203,5,0.30)",
    glow: "rgba(255,203,5,0.40)",
    chip: "bg-yellow-400/15 border-yellow-400/40 text-yellow-300/80",
  },
  {
    stroke: "rgba(255,203,5,0.30)",
    glow: "rgba(255,203,5,0.40)",
    chip: "bg-yellow-400/15 border-yellow-400/40 text-yellow-300/80",
  },
  {
    stroke: "rgba(255,203,5,0.30)",
    glow: "rgba(255,203,5,0.40)",
    chip: "bg-yellow-400/15 border-yellow-400/40 text-yellow-300/80",
  },
  {
    stroke: "rgba(255,203,5,0.30)",
    glow: "rgba(255,203,5,0.40)",
    chip: "bg-yellow-400/15 border-yellow-400/40 text-yellow-300/80",
  },
];

// Solid yellow bar for the tooltip's fun-score progress (Bumble = single accent).
const TIER_BAR: Record<FunTier, string> = {
  low: "bg-yellow-400",
  warm: "bg-yellow-400",
  lively: "bg-yellow-400",
  lit: "bg-yellow-400",
};

// Projected party ready to render on the map.
interface ProjectedParty {
  party: Party;
  coords: { lat: number; lng: number };
  dist: number;
  score: number;
  tier: FunTier;
  isLive: boolean;
  dimmed: boolean;
  cx: number;
  cy: number;
}

export function MapScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);
  const setSelectedPartyId = useAppStore((s) => s.setSelectedPartyId);
  const setCityFilter = useAppStore((s) => s.setCityFilter);
  const cityFilter = useAppStore((s) => s.cityFilter);
  const userLocation = useAppStore((s) => s.userLocation);
  const setUserLocation = useAppStore((s) => s.setUserLocation);

  // Local state — radius (km) + live-only filter (now DIMS instead of hides).
  const [radius, setRadius] = useState<Radius>(5);
  const [liveOnly, setLiveOnly] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  // Resolve the map center: stored user location > city center > India mid.
  const center = useMemo<{ lat: number; lng: number; label: string }>(() => {
    if (userLocation) return userLocation;
    if (cityFilter && CITY_CENTERS[cityFilter]) {
      return { ...CITY_CENTERS[cityFilter], label: cityFilter };
    }
    return { lat: 20.5937, lng: 78.9629, label: "India" };
  }, [userLocation, cityFilter]);

  // Proximity query — fetches all parties within `radius` km of `center`.
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["parties", "near", center.lat, center.lng, radius, cityFilter],
    queryFn: () =>
      api.listPartiesNear({
        lat: center.lat,
        lng: center.lng,
        radiusKm: radius,
        city: cityFilter ?? undefined,
      }),
    staleTime: 30_000,
  });

  const allParties = data?.parties ?? [];

  // Compute distance + fun score for each party. We KEEP non-live parties
  // in the list (rather than filtering them out) so the live-only toggle
  // can DIM them to 40% opacity instead of hiding them — this implements
  // the open recommendation from the worklog. Live parties bubble to the
  // top of the bottom sheet when liveOnly is on; everything stays sorted
  // by distance otherwise.
  const parties = useMemo<ProjectedParty[]>(() => {
    const withMeta: ProjectedParty[] = allParties.map((p) => {
      const coords = partyCoords(p);
      const dist = haversineKm(center, coords);
      const score = funScore(p);
      const tier = funTier(score);
      const isLive = partyLiveStatus(p.date, p.time) === "live";
      return {
        party: p,
        coords,
        dist,
        score,
        tier,
        isLive,
        dimmed: false,
        cx: 0,
        cy: 0,
      };
    });
    if (liveOnly) {
      // Live first, then dimmed — each group sorted by distance.
      return withMeta.sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        return a.dist - b.dist;
      });
    }
    return withMeta.sort((a, b) => a.dist - b.dist);
  }, [allParties, center, liveOnly]);

  // Map projection — convert each party's lat/lng to a viewport pixel offset
  // from the center. Scale chosen so the active radius spans ~45% of canvas.
  const CANVAS_W = 360;
  const CANVAS_H = 380;
  const pixelsPerKm = (Math.min(CANVAS_W, CANVAS_H) * 0.45) / radius;

  // Apply projection + collision-aware jitter so dense clusters don't overlap.
  // O(n²) over the projected pins with a few relaxation passes — fine for
  // the small N (~30 pins) this map ever shows.
  const projectedParties = useMemo<ProjectedParty[]>(() => {
    const out = parties.map((m) => {
      const { x, y } = projectLatLng(m.coords, center, pixelsPerKm);
      const cx = Math.max(24, Math.min(CANVAS_W - 24, CANVAS_W / 2 + x));
      const cy = Math.max(30, Math.min(CANVAS_H - 30, CANVAS_H / 2 + y));
      return {
        ...m,
        cx,
        cy,
        dimmed: liveOnly && !m.isLive,
      };
    });
    const MIN_DIST = 12; // px — minimum separation between pin centers
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i < out.length; i++) {
        for (let j = i + 1; j < out.length; j++) {
          const dx = out[j].cx - out[i].cx;
          const dy = out[j].cy - out[i].cy;
          const d = Math.hypot(dx, dy);
          if (d < MIN_DIST) {
            if (d < 0.001) {
              // Exact overlap (same venue) — pick a deterministic offset.
              out[j].cx += MIN_DIST;
              out[j].cy += MIN_DIST * 0.4;
            } else {
              const overlap = (MIN_DIST - d) / 2 + 1;
              const nx = dx / d;
              const ny = dy / d;
              out[i].cx -= nx * overlap;
              out[i].cy -= ny * overlap;
              out[j].cx += nx * overlap;
              out[j].cy += ny * overlap;
            }
          }
        }
      }
    }
    // Re-clamp so jittered pins stay inside the canvas.
    return out.map((m) => ({
      ...m,
      cx: Math.max(24, Math.min(CANVAS_W - 24, m.cx)),
      cy: Math.max(30, Math.min(CANVAS_H - 30, m.cy)),
    }));
  }, [parties, center, pixelsPerKm, liveOnly]);

  const openParty = (id: string) => {
    setSelectedPartyId(id);
    setScreen("detail");
  };

  const handleListToggle = () => {
    setCityFilter(cityFilter);
    setScreen("home");
  };

  // Best-effort browser geolocation — silent on failure.
  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Your location",
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300_000 },
    );
  };

  // City switch — syncs the explore cityFilter so the proximity query
  // doesn't double-filter by an old city.
  const switchCity = (city: string | null) => {
    setCityFilter(city);
    if (city) {
      const c = CITY_CENTERS[city];
      setUserLocation({ ...c, label: city });
    } else {
      setUserLocation(null);
    }
  };

  const liveCount = parties.filter((m) => m.isLive).length;
  const ringFractions = [0.25, 0.5, 0.75, 1];
  const radiusLabel = radius < 1 ? `${radius * 1000}m` : `${radius}km`;

  return (
    <div className="flex h-full flex-col bg-black">
      {/* Header — slim glass with yellow title + radius summary */}
      <header className="sticky top-0 z-30 flex items-center gap-2 glass-strong border-b border-white/10 px-3 py-2.5 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-extrabold leading-tight text-yellow-400">
            Map
          </h1>
          <p className="truncate text-[11px] text-white/50">
            <Navigation className="mr-0.5 inline h-3 w-3 text-yellow-400" />
            within {radiusLabel} of {center.label}
            {liveOnly && (
              <>
                {" · "}
                <span className="text-yellow-400">
                  {liveCount} live
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={handleListToggle}
          className="flex h-9 items-center gap-1.5 rounded-full glass border border-white/10 px-3 text-xs font-semibold text-white/70 transition hover:border-yellow-400/50 hover:text-yellow-300"
          aria-label="Switch to list view"
        >
          <List className="h-4 w-4" />
          List
        </button>
      </header>

      {/* Radius + Live filter row */}
      <div className="z-20 -mt-px flex items-center gap-2 glass border-b border-white/10 px-3 py-2">
        <div className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto">
          <span className="shrink-0 pr-1 text-[10px] uppercase tracking-wider text-white/50">
            Radius
          </span>
          {RADII.map((r) => {
            const active = radius === r;
            return (
              <button
                key={r}
                onClick={() => setRadius(r)}
                aria-pressed={active}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold transition",
                  active
                    ? "bg-yellow-400 scale-105 text-black"
                    : "glass border border-white/10 text-white/70 hover:border-yellow-400/50 hover:text-yellow-300",
                )}
              >
                {r < 1 ? `${r * 1000}m` : `${r}km`}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setLiveOnly((v) => !v)}
          aria-pressed={liveOnly}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition",
            liveOnly
              ? "bg-yellow-400 vibe-live-ring scale-105 text-black"
              : "glass border border-white/10 text-white/70 hover:border-yellow-400/50 hover:text-yellow-300",
          )}
        >
          <Flame
            className={cn(
              "h-3 w-3",
              liveOnly && "drop-shadow-[0_0_6px_rgba(255,203,5,0.9)]",
            )}
          />
          Live
        </button>
      </div>

      {/* Map canvas */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {/* Subtle white dot-grid texture for the "tech map" feel */}
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            maskImage:
              "radial-gradient(ellipse at center, black 55%, transparent 95%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 55%, transparent 95%)",
          }}
        />

        {/* Canvas wrapper — centers the projection */}
        <div className="relative mx-auto flex h-full w-full max-w-[420px] items-center justify-center px-2">
          <div
            className="relative"
            style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100%" }}
          >
            {/* Concentric uniform-yellow distance rings */}
            <svg
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              {/* Per-ring uniform yellow dashed circles with soft glow */}
              {ringFractions.map((f, i) => {
                const r = Math.max(2, pixelsPerKm * radius * f);
                const c = RING_COLORS[i];
                return (
                  <circle
                    key={`ring-${i}`}
                    cx={CANVAS_W / 2}
                    cy={CANVAS_H / 2}
                    r={r}
                    fill="none"
                    stroke={c.stroke}
                    strokeWidth={1.4}
                    strokeDasharray="3 5"
                    style={{ filter: `drop-shadow(0 0 4px ${c.glow})` }}
                  />
                );
              })}
              {/* Faint crosshair */}
              <line
                x1={CANVAS_W / 2}
                y1={0}
                x2={CANVAS_W / 2}
                y2={CANVAS_H}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
              <line
                x1={0}
                y1={CANVAS_H / 2}
                x2={CANVAS_W}
                y2={CANVAS_H / 2}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            </svg>

            {/* Distance labels per ring (uniform yellow) */}
            {ringFractions.map((f, i) => {
              const r = pixelsPerKm * radius * f;
              const dist = radius * f;
              if (r < 22) return null;
              const c = RING_COLORS[i];
              return (
                <span
                  key={`label-${i}`}
                  className={cn(
                    "absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full border px-1.5 py-0.5 text-[8px] font-bold backdrop-blur-sm",
                    c.chip,
                  )}
                  style={{ transform: `translate(-50%, calc(-50% - ${r}px))` }}
                >
                  {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist}km`}
                </span>
              );
            })}

            {/* "You are here" marker — yellow disc + here-pulse rings */}
            <button
              onClick={useMyLocation}
              className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              aria-label="Use my location"
            >
              {/* pulsing rings — pointer-events-none so they don't block pin clicks */}
              <span className="pointer-events-none absolute h-6 w-6 rounded-full bg-yellow-400/40 here-pulse" />
              <span
                className="pointer-events-none absolute h-10 w-10 rounded-full bg-yellow-400/25 here-pulse"
                style={{ animationDelay: "0.4s" }}
              />
              {/* solid yellow disc + white center dot */}
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-yellow-400 ring-2 ring-black/60 shadow-[0_0_18px_-2px_rgba(255,203,5,0.85)]">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="pointer-events-none mt-1.5 whitespace-nowrap rounded-full border border-yellow-400/30 bg-black/70 px-2 py-0.5 text-[9px] font-bold text-yellow-400 backdrop-blur-sm">
                {locating ? "Locating…" : "You"}
              </span>
            </button>

            {/* Party pins — projected + collision-jittered */}
            {projectedParties.map((m) => {
              const tier = FUN_TIER_META[m.tier];
              const vibes = parseVibes(m.party.vibes);
              const emoji = vibes[0] ? (VIBE_EMOJI[vibes[0]] ?? "✨") : "✨";
              const isHovered = hoveredId === m.party.id;
              const sizePx =
                m.tier === "lit"
                  ? 44
                  : m.tier === "lively"
                    ? 40
                    : m.tier === "warm"
                      ? 36
                      : 32;

              return (
                <button
                  key={m.party.id}
                  onClick={() => openParty(m.party.id)}
                  onMouseEnter={() => setHoveredId(m.party.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onFocus={() => setHoveredId(m.party.id)}
                  onBlur={() => setHoveredId(null)}
                  className={cn(
                    "group absolute z-10 flex flex-col items-center transition-opacity",
                    m.dimmed && "opacity-40",
                  )}
                  style={{
                    left: `${(m.cx / CANVAS_W) * 100}%`,
                    top: `${(m.cy / CANVAS_H) * 100}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                  aria-label={`${m.party.title} — ${m.dist.toFixed(1)}km — ${tier.label}${m.isLive ? " — live now" : ""}`}
                >
                  {/* Lit-tier rotating sparkle ring — uniform yellow */}
                  {m.tier === "lit" && (
                    <span
                      className="pointer-events-none absolute -top-1 h-14 w-14 rounded-full border border-yellow-300/40 fun-sparkle-ring"
                      style={{
                        background:
                          "conic-gradient(from 0deg, transparent 0%, rgba(255,203,5,0.40) 25%, transparent 50%, rgba(255,203,5,0.40) 75%, transparent 100%)",
                      }}
                    />
                  )}

                  {/* Lit-tier floating spark particles using tier sparkClass */}
                  {m.tier === "lit" && (
                    <>
                      <span
                        className={cn(
                          "pointer-events-none absolute -top-2 left-1 h-1 w-1 rounded-full fun-spark",
                          tier.sparkClass,
                        )}
                        style={
                          {
                            "--dx": "-6px",
                            "--dy": "-14px",
                          } as React.CSSProperties
                        }
                      />
                      <span
                        className={cn(
                          "pointer-events-none absolute -top-1 right-1 h-1 w-1 rounded-full fun-spark",
                          tier.sparkClass,
                        )}
                        style={
                          {
                            "--dx": "6px",
                            "--dy": "-12px",
                            animationDelay: "0.3s",
                          } as React.CSSProperties
                        }
                      />
                      <span
                        className={cn(
                          "pointer-events-none absolute top-2 left-3 h-0.5 w-0.5 rounded-full fun-spark",
                          tier.sparkClass,
                        )}
                        style={
                          {
                            "--dx": "0px",
                            "--dy": "-18px",
                            animationDelay: "0.6s",
                          } as React.CSSProperties
                        }
                      />
                    </>
                  )}

                  {/* The pin itself — solid yellow disc with vibe emoji */}
                  <span
                    className={cn(
                      "relative flex items-center justify-center rounded-full border-2 bg-yellow-400",
                      tier.ringClass,
                      tier.animClass,
                      tier.glowClass,
                      m.isLive && "ring-2 ring-yellow-400",
                    )}
                    style={{ height: sizePx, width: sizePx }}
                  >
                    {/* inner highlight */}
                    <span className="pointer-events-none absolute inset-1 rounded-full bg-white/20" />
                    <span className="relative text-base leading-none drop-shadow">
                      {emoji}
                    </span>
                    {/* distance chip in tier color */}
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border px-1 py-0 text-[8px] font-bold backdrop-blur-sm",
                        tier.chipClass,
                      )}
                    >
                      {m.dist < 1
                        ? `${Math.round(m.dist * 1000)}m`
                        : `${m.dist.toFixed(1)}k`}
                    </span>
                  </span>

                  {/* Hovered/focused tooltip — title + tier label + score bar + distance */}
                  {isHovered && (
                    <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-3 w-44 -translate-x-1/2 rounded-xl glass-strong border border-yellow-400/30 px-2.5 py-2 shadow-lg animate-pop-in">
                      <span className="block max-w-[160px] truncate font-display text-[11px] font-bold text-white">
                        {m.party.title}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 flex items-center gap-1 text-[9px] font-bold",
                          tier.textClass,
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-1.5 w-1.5 rounded-full",
                            tier.dotClass,
                          )}
                        />
                        {tier.label} · {m.score}/100
                      </span>
                      {/* fun-score progress bar — solid yellow on white/10 track */}
                      <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-white/10">
                        <span
                          className={cn(
                            "block h-full rounded-full",
                            TIER_BAR[m.tier],
                          )}
                          style={{ width: `${m.score}%` }}
                        />
                      </span>
                      <span className="mt-1 block text-[9px] text-white/50">
                        {m.dist < 1
                          ? `${Math.round(m.dist * 1000)}m away`
                          : `${m.dist.toFixed(1)}km away`}
                        {m.isLive && (
                          <span className="ml-1 text-yellow-300">· Live</span>
                        )}
                      </span>
                    </span>
                  )}

                  {/* Pin tail — tier-colored diamond pointing at the exact spot */}
                  <span
                    className={cn(
                      "block -mt-1 h-2 w-2 rotate-45 border-r-2 border-b-2",
                      tier.dotClass,
                      tier.ringClass,
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}

            {/* Loading overlay — vibe-pulse on the scanner chip */}
            {isLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full glass border border-yellow-400/30 px-4 py-2 text-xs text-yellow-300">
                  <Sparkles className="h-3.5 w-3.5 vibe-pulse text-yellow-400" />
                  Scanning the area…
                </div>
              </div>
            )}

            {/* Error overlay */}
            {isError && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <EmptyState
                  icon={MapPin}
                  title="Couldn't scan the area"
                  description="Something went wrong fetching nearby parties."
                  action={
                    <button
                      onClick={() => refetch()}
                      className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-bold text-black transition active:scale-95"
                    >
                      Retry
                    </button>
                  }
                />
              </div>
            )}

            {/* Empty state — floating 🗺️ + yellow title + hint to widen radius */}
            {!isLoading && !isError && parties.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <div className="flex flex-col items-center gap-3 rounded-3xl glass border border-yellow-400/30 px-6 py-8 text-center">
                  <span className="text-4xl vibe-float" aria-hidden>
                    🗺️
                  </span>
                  <h3 className="font-display text-base font-extrabold text-yellow-400">
                    No parties nearby
                  </h3>
                  <p className="max-w-[220px] text-xs text-muted-foreground">
                    {radius <= 2
                      ? "Try widening the radius — your scene is just out of frame."
                      : liveOnly
                        ? "Toggle off Live to see all upcoming parties on the radar."
                        : "Be the first — launch a vibe and it'll pop up on the radar."}
                  </p>
                  <button
                    onClick={() =>
                      liveOnly ? setLiveOnly(false) : setScreen("create")
                    }
                    className="rounded-full bg-yellow-400 px-4 py-2 text-xs font-bold text-black transition active:scale-95"
                  >
                    {liveOnly ? "Show all parties" : "Launch a vibe"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating "use my location" + city switcher */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="flex h-11 w-11 items-center justify-center rounded-full glass-strong border border-white/10 text-yellow-400 transition hover:border-yellow-400/50 disabled:opacity-70"
            aria-label="Use my GPS location"
          >
            {locating ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/20 border-t-yellow-400 vibe-pulse animate-spin" />
            ) : (
              <Crosshair className="h-4 w-4" />
            )}
          </button>
          <div className="no-scrollbar flex max-w-[260px] items-center gap-1.5 overflow-x-auto">
            <CityDot
              label="India"
              active={!userLocation && !cityFilter}
              onClick={() => switchCity(null)}
            />
            {CITIES.map((c) => (
              <CityDot
                key={c}
                label={c}
                active={userLocation?.label === c || cityFilter === c}
                onClick={() => switchCity(c)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom sheet — glass-strong with solid yellow top accent + drag handle */}
      <section className="glass-strong relative z-10 mb-20 flex max-h-[34vh] flex-col border-t border-white/10">
        {/* Solid yellow top accent line */}
        <div className="absolute -top-px left-0 right-0 h-px bg-yellow-400" aria-hidden />
        {/* Drag handle — short solid bar */}
        <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-white/30" />

        <div className="flex items-center justify-between px-4 pb-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-sm font-extrabold text-yellow-400">
              Nearby parties
            </h2>
            <span className="rounded-full bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-black">
              {parties.length}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            sorted by distance
          </span>
        </div>

        <div className="fancy-scrollbar flex-1 space-y-2 overflow-y-auto px-3 pb-6">
          {/* Loading skeleton rows */}
          {isLoading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-2xl border border-white/10 vibe-skeleton"
                />
              ))}
            </div>
          )}

          {!isLoading && parties.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No parties to list — try widening the radius.
            </p>
          )}

          {!isLoading &&
            parties.length > 0 &&
            projectedParties.map((m) => {
              const tier = FUN_TIER_META[m.tier];
              const vibes = parseVibes(m.party.vibes);
              const emoji = vibes[0] ? (VIBE_EMOJI[vibes[0]] ?? "✨") : "✨";
              const isHovered = hoveredId === m.party.id;
              return (
                <button
                  key={m.party.id}
                  onClick={() => openParty(m.party.id)}
                  onMouseEnter={() => setHoveredId(m.party.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "relative flex w-full items-center gap-3 overflow-hidden rounded-2xl glass border px-3 py-2.5 text-left transition",
                    "border-white/10 hover:border-yellow-400/50",
                    isHovered && "border-yellow-400/50",
                    m.dimmed && "opacity-40",
                  )}
                  aria-label={`${m.party.title} — ${m.dist.toFixed(1)}km — ${tier.label}`}
                >
                  {/* left yellow accent bar on hover */}
                  <span
                    className={cn(
                      "absolute left-0 top-0 h-full w-1 bg-yellow-400 transition-opacity",
                      isHovered ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                  {/* vibe emoji in tier-colored ring */}
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-card/60 text-lg",
                      tier.ringClass,
                      tier.glowClass,
                    )}
                  >
                    {emoji}
                  </span>
                  {/* title + meta */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-sm font-bold text-white">
                      {m.party.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[10px]">
                      <span
                        className={cn(
                          "rounded-full border px-1.5 py-0.5 font-bold",
                          tier.chipClass,
                        )}
                      >
                        {tier.label}
                      </span>
                      {m.isLive && (
                        <span className="flex items-center gap-0.5 font-bold text-yellow-300">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400 vibe-pulse" />
                          Live
                        </span>
                      )}
                    </span>
                  </span>
                  {/* distance chip */}
                  <span
                    className={cn(
                      "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold",
                      tier.chipClass,
                    )}
                  >
                    {m.dist < 1
                      ? `${Math.round(m.dist * 1000)}m`
                      : `${m.dist.toFixed(1)}km`}
                  </span>
                </button>
              );
            })}
        </div>
      </section>
    </div>
  );
}

// City switcher — small dot with yellow fill + label appearing when active.
function CityDot({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className="flex shrink-0 items-center gap-1.5"
    >
      <span
        className={cn(
          "h-3 w-3 rounded-full transition",
          active
            ? "bg-yellow-400 scale-110"
            : "glass border border-white/20",
        )}
      />
      {active && (
        <span className="text-[10px] font-bold text-yellow-400">
          {label}
        </span>
      )}
    </button>
  );
}
