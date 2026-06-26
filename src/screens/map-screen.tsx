"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  List,
  MapPin,
  Sparkles,
  LocateFixed,
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
} from "@/lib/types";
import { PartyCard } from "@/components/vibe/party-card";
import { EmptyState } from "@/components/vibe/empty-state";
import { cn } from "@/lib/utils";

const RADII = [1, 2, 5, 10, 25] as const;
type Radius = (typeof RADII)[number];

export function MapScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);
  const setSelectedPartyId = useAppStore((s) => s.setSelectedPartyId);
  const setCityFilter = useAppStore((s) => s.setCityFilter);
  const cityFilter = useAppStore((s) => s.cityFilter);
  const userLocation = useAppStore((s) => s.userLocation);
  const setUserLocation = useAppStore((s) => s.setUserLocation);

  // Local state — radius (km) + live-only filter
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

  // Compute distance + fun score for each party, then optionally filter
  // by "live only".
  const parties = useMemo(() => {
    const withMeta = allParties.map((p) => {
      const coords = partyCoords(p);
      const dist = haversineKm(center, coords);
      const score = funScore(p);
      const tier = funTier(score);
      return { party: p, coords, dist, score, tier };
    });
    const filtered = liveOnly
      ? withMeta.filter(
          (m) => partyLiveStatus(m.party.date, m.party.time) === "live",
        )
      : withMeta;
    return filtered.sort((a, b) => a.dist - b.dist);
  }, [allParties, center, liveOnly]);

  // Map projection — convert each party's lat/lng to a viewport pixel offset
  // from the center. We size the canvas in CSS pixels and pick a scale that
  // makes the active radius span ~45% of the canvas (so rings + pins both fit).
  const CANVAS_W = 360;
  const CANVAS_H = 380;
  const pixelsPerKm = Math.min(CANVAS_W, CANVAS_H) * 0.45 / radius;

  const openParty = (id: string) => {
    setSelectedPartyId(id);
    setScreen("detail");
  };

  const handleListToggle = () => {
    setCityFilter(cityFilter);
    setScreen("home");
  };

  // Try the browser geolocation API on first mount (best-effort, silent on failure).
  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      // fallback: keep current center
      return;
    }
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
      () => {
        // permission denied or unavailable — silently keep the city center
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 300_000 },
    );
  };

  // City switch — keeps the user moving between metros.
  // Also syncs the explore cityFilter so the proximity query doesn't
  // double-filter by an old city.
  const switchCity = (city: string | null) => {
    setCityFilter(city);
    if (city) {
      const c = CITY_CENTERS[city];
      setUserLocation({ ...c, label: city });
    } else {
      // null = "India" — clear stored location, fall back to mid-India
      setUserLocation(null);
    }
  };

  // Live count for the header
  const liveCount = parties.filter(
    (m) => partyLiveStatus(m.party.date, m.party.time) === "live",
  ).length;

  // Distance rings to render — 25%, 50%, 75%, 100% of the active radius
  const ringFractions = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center gap-2 glass-strong border-b border-gold/15 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gold/10 text-gold-light"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-lg font-extrabold leading-tight">
            <span className="vibe-gradient-text">Vibe Radar</span>
          </h1>
          <p className="text-[11px] text-muted-foreground truncate">
            <Navigation className="inline h-3 w-3 mr-0.5 text-gold/80" />
            {center.label} ·{" "}
            <span className="text-gold-light/90">{parties.length}</span> within{" "}
            <span className="text-gold-light/90">{radius} km</span>
            {liveOnly && (
              <>
                {" "}· <span className="text-gold-light">{liveCount} live</span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={handleListToggle}
          className="flex h-9 items-center gap-1.5 rounded-full border border-gold/25 bg-card/50 px-3 text-xs font-semibold text-gold-light transition hover:border-gold/60 hover:bg-gold/10"
          aria-label="Switch to list view"
        >
          <List className="h-4 w-4" />
          List
        </button>
      </header>

      {/* Radius + Live filter row */}
      <div className="z-20 -mt-px flex items-center gap-2 glass border-b border-gold/10 px-3 py-2">
        <div className="no-scrollbar flex flex-1 items-center gap-1.5 overflow-x-auto">
          <span className="shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground pr-1">
            Radius
          </span>
          {RADII.map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
                radius === r
                  ? "border-transparent vibe-gradient-bg text-black shadow-[0_4px_14px_-4px_rgba(212,175,55,0.7)]"
                  : "border-gold/20 bg-card/50 text-muted-foreground hover:border-gold/50 hover:text-gold-light",
              )}
            >
              {r < 1 ? `${r * 1000}m` : `${r}km`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setLiveOnly((v) => !v)}
          className={cn(
            "shrink-0 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold transition",
            liveOnly
              ? "border-gold/60 bg-gold/20 text-gold-light vibe-live-ring"
              : "border-gold/20 bg-card/50 text-muted-foreground hover:border-gold/50 hover:text-gold-light",
          )}
          aria-pressed={liveOnly}
        >
          <Flame className="h-3 w-3" />
          Live
        </button>
      </div>

      {/* Map canvas */}
      <div className="relative flex-1 overflow-hidden">
        {/* Subtle gold radial backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(212,175,55,0.10), rgba(6,6,6,0) 60%), radial-gradient(circle at 50% 45%, rgba(240,199,94,0.04), transparent 70%)",
          }}
        />

        {/* Canvas wrapper — centers the projection */}
        <div className="relative mx-auto h-full w-full max-w-[420px] flex items-center justify-center px-2">
          <div
            className="relative"
            style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: "100%" }}
          >
            {/* Concentric distance rings */}
            <svg
              viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <defs>
                <radialGradient id="ring-aura" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(212,175,55,0.18)" />
                  <stop offset="70%" stopColor="rgba(240,199,94,0.04)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(212,175,55,0.45)" />
                  <stop offset="100%" stopColor="rgba(139,105,20,0.25)" />
                </linearGradient>
              </defs>
              {/* Soft aura behind the rings */}
              <circle
                cx={CANVAS_W / 2}
                cy={CANVAS_H / 2}
                r={Math.min(CANVAS_W, CANVAS_H) * 0.46}
                fill="url(#ring-aura)"
              />
              {/* Distance rings */}
              {ringFractions.map((f, i) => {
                const r = pixelsPerKm * radius * f;
                return (
                  <circle
                    key={i}
                    cx={CANVAS_W / 2}
                    cy={CANVAS_H / 2}
                    r={r}
                    fill="none"
                    stroke="rgba(212,175,55,0.22)"
                    strokeWidth={1}
                    strokeDasharray={i === ringFractions.length - 1 ? "0" : "2 4"}
                  />
                );
              })}
              {/* Crosshair lines through center */}
              <line x1={CANVAS_W / 2} y1={0} x2={CANVAS_W / 2} y2={CANVAS_H} stroke="rgba(212,175,55,0.08)" strokeWidth={1} />
              <line x1={0} y1={CANVAS_H / 2} x2={CANVAS_W} y2={CANVAS_H / 2} stroke="rgba(212,175,55,0.08)" strokeWidth={1} />
            </svg>

            {/* Distance labels on each ring */}
            {ringFractions.map((f, i) => {
              const r = pixelsPerKm * radius * f;
              const dist = radius * f;
              if (r < 24) return null;
              return (
                <span
                  key={`label-${i}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 rounded-full bg-card/80 px-1.5 py-0.5 text-[8px] font-bold text-gold/70 border border-gold/15 backdrop-blur-sm"
                  style={{ transform: `translate(-50%, calc(-50% - ${r}px))` }}
                >
                  {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist}km`}
                </span>
              );
            })}

            {/* "You are here" marker */}
            <button
              onClick={useMyLocation}
              className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              aria-label="Use my location"
            >
              {/* pulsing rings — pointer-events-none so they don't block nearby pin clicks */}
              <span className="pointer-events-none absolute h-6 w-6 rounded-full bg-gold/30 here-pulse" />
              <span className="pointer-events-none absolute h-10 w-10 rounded-full bg-gold/15 here-pulse" style={{ animationDelay: "0.4s" }} />
              {/* center dot */}
              <span className="relative flex h-4 w-4 items-center justify-center rounded-full vibe-gradient-bg ring-2 ring-black/60 shadow-[0_0_18px_-2px_rgba(240,199,94,0.85)]">
                <span className="h-1.5 w-1.5 rounded-full bg-black/70" />
              </span>
              <span className="pointer-events-none mt-1.5 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[9px] font-bold text-gold-light border border-gold/30 backdrop-blur-sm">
                {locating ? "Locating…" : "You"}
              </span>
            </button>

            {/* Party pins — projected around the center */}
            {parties.map((m) => {
              const { x, y } = projectLatLng(m.coords, center, pixelsPerKm);
              // Clamp pins inside the canvas (with a small margin)
              const cx = Math.max(20, Math.min(CANVAS_W - 20, CANVAS_W / 2 + x));
              const cy = Math.max(24, Math.min(CANVAS_H - 24, CANVAS_H / 2 + y));
              const tier = FUN_TIER_META[m.tier];
              const vibes = parseVibes(m.party.vibes);
              const emoji = vibes[0] ? VIBE_EMOJI[vibes[0]] ?? "✨" : "✨";
              const isLive = partyLiveStatus(m.party.date, m.party.time) === "live";
              const isHovered = hoveredId === m.party.id;
              const sizePx = m.tier === "lit" ? 44 : m.tier === "lively" ? 40 : m.tier === "warm" ? 36 : 32;

              return (
                <button
                  key={m.party.id}
                  onClick={() => openParty(m.party.id)}
                  onMouseEnter={() => setHoveredId(m.party.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className="group absolute z-10 flex flex-col items-center"
                  style={{
                    left: `${(cx / CANVAS_W) * 100}%`,
                    top: `${(cy / CANVAS_H) * 100}%`,
                    transform: "translate(-50%, -100%)",
                  }}
                  aria-label={`${m.party.title} — ${m.dist.toFixed(1)}km — ${tier.label}`}
                >
                  {/* Lit-tier: rotating sparkle ring around the pin */}
                  {m.tier === "lit" && (
                    <span
                      className="pointer-events-none absolute -top-1 h-14 w-14 rounded-full border border-gold-bright/40 fun-sparkle-ring"
                      style={{
                        background:
                          "conic-gradient(from 0deg, transparent 0%, rgba(249,228,160,0.35) 25%, transparent 50%, rgba(240,199,94,0.35) 75%, transparent 100%)",
                      }}
                    />
                  )}

                  {/* Floating gold sparkles for lit pins */}
                  {m.tier === "lit" && (
                    <>
                      <span className="pointer-events-none absolute -top-2 left-1 h-1 w-1 rounded-full bg-gold-light fun-spark" style={{ ["--dx" as any]: "-6px", ["--dy" as any]: "-14px" }} />
                      <span className="pointer-events-none absolute -top-1 right-1 h-1 w-1 rounded-full bg-gold-bright fun-spark" style={{ ["--dx" as any]: "6px", ["--dy" as any]: "-12px", animationDelay: "0.3s" }} />
                      <span className="pointer-events-none absolute top-2 left-3 h-0.5 w-0.5 rounded-full bg-gold fun-spark" style={{ ["--dx" as any]: "0px", ["--dy" as any]: "-18px", animationDelay: "0.6s" }} />
                    </>
                  )}

                  {/* The pin itself — glassy disc with vibe emoji */}
                  <span
                    className={cn(
                      "relative flex items-center justify-center rounded-full border-2 backdrop-blur-md vibe-gradient-bg",
                      tier.ringClass,
                      tier.animClass,
                      tier.glowClass,
                      isLive && "ring-2 ring-gold-bright/60",
                    )}
                    style={{ height: sizePx, width: sizePx }}
                  >
                    {/* inner foil highlight */}
                    <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent pointer-events-none" />
                    <span className="relative text-base leading-none drop-shadow">
                      {emoji}
                    </span>
                    {/* distance chip */}
                    <span
                      className={cn(
                        "absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-black/80 px-1 py-0 text-[8px] font-bold text-gold-light border border-gold/30 whitespace-nowrap",
                      )}
                    >
                      {m.dist < 1 ? `${Math.round(m.dist * 1000)}m` : `${m.dist.toFixed(1)}k`}
                    </span>
                  </span>

                  {/* Hovered/active tooltip with title + fun tier */}
                  {isHovered && (
                    <span className="pointer-events-none absolute top-full mt-2 z-30 -translate-x-1/2 left-1/2 whitespace-nowrap rounded-lg glass-strong px-2 py-1 text-[10px] font-semibold text-gold-light border border-gold/30 shadow-lg">
                      <span className="block max-w-[160px] truncate">{m.party.title}</span>
                      <span className="block text-[9px] text-gold-bright/80">
                        {tier.label} · {m.score}/100
                      </span>
                    </span>
                  )}

                  {/* Pin tail (the triangle pointing down to the spot) */}
                  <span
                    className="block -mt-1 h-2 w-2 rotate-45 bg-gold-deep border-r-2 border-b-2 border-gold/50"
                    aria-hidden
                  />
                </button>
              );
            })}

            {/* Loading overlay */}
            {isLoading && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="flex items-center gap-2 rounded-full glass px-4 py-2 text-xs text-gold-light border border-gold/20">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse text-gold" />
                  Scanning the area…
                </div>
              </div>
            )}

            {/* Error / empty overlays */}
            {isError && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <EmptyState
                  icon={MapPin}
                  title="Couldn't scan the area"
                  description="Something went wrong fetching nearby parties."
                  action={
                    <button
                      onClick={() => refetch()}
                      className="rounded-full vibe-gradient-bg px-4 py-2 text-sm font-bold text-black"
                    >
                      Retry
                    </button>
                  }
                />
              </div>
            )}

            {!isLoading && !isError && parties.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center px-6">
                <EmptyState
                  icon={MapPin}
                  title={liveOnly ? "No live parties nearby" : "No parties in range"}
                  description={
                    radius <= 2
                      ? "Try expanding the radius, or launch your own vibe here."
                      : liveOnly
                        ? "Toggle off the Live filter to see all upcoming parties."
                        : "Be the first — launch a vibe and it'll show up on the radar."
                  }
                  action={
                    <button
                      onClick={() => setScreen("create")}
                      className="rounded-full vibe-gradient-bg px-4 py-2 text-sm font-bold text-black"
                    >
                      Launch a vibe
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </div>

        {/* Floating "use my location" + city switcher */}
        <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-2">
          <button
            onClick={useMyLocation}
            disabled={locating}
            className="flex h-9 items-center gap-1.5 rounded-full glass-strong border border-gold/30 px-3 text-[11px] font-bold text-gold-light transition hover:border-gold/60 disabled:opacity-60"
            aria-label="Use my GPS location"
          >
            <LocateFixed className={cn("h-3.5 w-3.5", locating && "animate-spin")} />
            {locating ? "Locating…" : "My GPS"}
          </button>
          <div className="no-scrollbar flex max-w-[240px] items-center gap-1.5 overflow-x-auto">
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

      {/* Bottom sheet: list of nearby parties sorted by distance */}
      <section className="glass-strong relative z-10 mb-20 flex max-h-[34vh] flex-col border-t border-gold/15">
        <div className="mx-auto my-2 h-1 w-10 rounded-full bg-gold/30" />

        <div className="flex items-center justify-between px-4 pb-1">
          <h2 className="font-display text-sm font-bold text-gold-light">
            {liveOnly ? "Live near you" : "Nearby vibes"}
          </h2>
          <span className="text-[11px] text-muted-foreground">
            sorted by distance
          </span>
        </div>

        <div className="fancy-scrollbar flex-1 space-y-3 overflow-y-auto px-4 pb-6">
          {isLoading && (
            <div className="space-y-3">
              {[0, 1].map((i) => (
                <div
                  key={i}
                  className="h-36 animate-pulse rounded-3xl border border-gold/15 bg-card/40"
                />
              ))}
            </div>
          )}

          {!isLoading && parties.length === 0 && (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No parties to list — try expanding the radius.
            </p>
          )}

          {!isLoading &&
            parties.length > 0 &&
            parties.map((m) => (
              <div key={m.party.id} className="relative">
                {/* distance + tier chip overlay */}
                <div className="pointer-events-none absolute -left-1 top-3 z-10 flex flex-col gap-1">
                  <span className="rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-bold text-gold-light border border-gold/30">
                    {m.dist < 1 ? `${Math.round(m.dist * 1000)}m` : `${m.dist.toFixed(1)} km`}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[9px] font-bold border backdrop-blur-md",
                      m.tier === "lit" && "bg-gold/25 text-gold-light border-gold/50",
                      m.tier === "lively" && "bg-gold-bright/20 text-gold-light border-gold-bright/40",
                      m.tier === "warm" && "bg-gold-deep/30 text-gold-light border-gold/30",
                      m.tier === "low" && "bg-card/70 text-muted-foreground border-border/40",
                    )}
                  >
                    {FUN_TIER_META[m.tier].label} · {m.score}
                  </span>
                </div>
                <PartyCard party={m.party} onOpen={openParty} />
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

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
      className={cn(
        "shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold transition",
        active
          ? "border-gold/60 bg-gold/20 text-gold-light"
          : "border-gold/15 bg-card/50 text-muted-foreground hover:border-gold/40 hover:text-gold-light",
      )}
    >
      {label}
    </button>
  );
}
