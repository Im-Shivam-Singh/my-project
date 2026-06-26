"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, MapPin, Sparkles, PartyPopper } from "lucide-react";
import { CITIES, VIBE_TAGS, VIBE_EMOJI } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STEPS = ["city", "vibes", "done"] as const;
type Step = (typeof STEPS)[number];

// Per-city Gen Z neon color (Delhi=pink, Mumbai=cyan, Bangalore=violet,
// Goa=coral, Pune=lime). Selected tile glows + scales in its city color.
const CITY_COLOR: Record<string, { glow: string; text: string; ring: string; dot: string; bg: string }> = {
  Delhi: { glow: "glow-pink", text: "text-pink", ring: "ring-pink/60", dot: "bg-pink", bg: "bg-pink/15" },
  Mumbai: { glow: "glow-cyan", text: "text-cyan", ring: "ring-cyan/60", dot: "bg-cyan", bg: "bg-cyan/15" },
  Bangalore: { glow: "glow-violet", text: "text-violet", ring: "ring-violet/60", dot: "bg-violet", bg: "bg-violet/15" },
  Goa: { glow: "", text: "text-coral", ring: "ring-orange-400/60", dot: "bg-coral", bg: "bg-orange-400/15" },
  Pune: { glow: "glow-acid", text: "text-acid", ring: "ring-lime-400/60", dot: "bg-acid", bg: "bg-lime-400/15" },
};

// Per-vibe neon color (matches VIBE_COLORS theme from types.ts)
const VIBE_COLOR: Record<string, { text: string; ring: string; bg: string; glow: string }> = {
  Techno: { text: "text-cyan", ring: "ring-cyan/60", bg: "bg-cyan/15", glow: "glow-cyan" },
  Bollywood: { text: "text-coral", ring: "ring-orange-400/60", bg: "bg-orange-400/15", glow: "" },
  BYOB: { text: "text-sunshine", ring: "ring-amber-300/60", bg: "bg-amber-300/15", glow: "" },
  Boardgames: { text: "text-acid", ring: "ring-lime-400/60", bg: "bg-lime-400/15", glow: "glow-acid" },
  "Lo-fi": { text: "text-violet", ring: "ring-violet/60", bg: "bg-violet/15", glow: "glow-violet" },
  Chill: { text: "text-sky-400", ring: "ring-sky-400/60", bg: "bg-sky-400/15", glow: "" },
  EDM: { text: "text-pink", ring: "ring-pink/60", bg: "bg-pink/15", glow: "glow-pink" },
  Retro: { text: "text-rose-400", ring: "ring-rose-400/60", bg: "bg-rose-400/15", glow: "" },
};

export function OnboardingScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setOnboarded = useAppStore((s) => s.setOnboarded);
  const setScreen = useAppStore((s) => s.setScreen);
  const setCityFilter = useAppStore((s) => s.setCityFilter);

  const [step, setStep] = useState<Step>("city");
  const [city, setCity] = useState<string>(currentUser?.city || "Mumbai");
  const [picks, setPicks] = useState<string[]>([]);

  const toggle = (v: string) =>
    setPicks((p) =>
      p.includes(v) ? p.filter((x) => x !== v) : [...p, v],
    );

  const finish = async () => {
    // persist city + vibe preferences to the user's profile
    if (currentUser) {
      try {
        await api.updateUser(currentUser.id, {
          city,
          vibePrefs: picks.join(","),
        });
      } catch {
        /* non-blocking */
      }
    }
    setCityFilter(city);
    setOnboarded(true);
    setScreen("home");
    toast.success("You're all set! 🎉", {
      description: `Showing vibes in ${city}.`,
    });
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden px-6 pb-8 pt-[max(env(safe-area-inset-top),24px)] animate-screen-in">
      {/* Aurora background blobs — tri-color Gen Z neon */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-16 -right-10 h-72 w-72 rounded-full bg-pink/30 blur-3xl aurora-drift" />
        <div className="absolute bottom-0 -left-16 h-72 w-72 rounded-full bg-violet/35 blur-3xl aurora-drift" style={{ animationDelay: "0.8s" }} />
        <div className="absolute top-1/3 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan/25 blur-3xl aurora-drift" style={{ animationDelay: "1.6s" }} />
        <div className="absolute bottom-1/4 right-0 h-48 w-48 rounded-full bg-acid/20 blur-3xl aurora-drift" style={{ animationDelay: "2.4s" }} />
      </div>

      {/* Progress dots */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => {
          const active = STEPS.indexOf(step) >= i;
          return (
            <span
              key={s}
              className={cn(
                "h-1.5 rounded-full transition-all",
                active ? "w-8 vibe-gradient-bg glow-pink" : "w-4 bg-border",
              )}
            />
          );
        })}
      </div>

      <div className="flex flex-1 flex-col justify-center">
        {step === "city" && (
          <div className="animate-slide-up space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl vibe-gradient-bg glow-pink">
                <MapPin className="h-8 w-8 text-white" />
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-tight">
                Let&apos;s set your <span className="vibe-gradient-text">vibe</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick your city — we&apos;ll show parties near you first.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {CITIES.map((c) => {
                const isActive = city === c;
                const col = CITY_COLOR[c];
                return (
                  <button
                    key={c}
                    onClick={() => setCity(c)}
                    className={cn(
                      "relative overflow-hidden rounded-2xl border p-4 text-left transition press-feedback",
                      isActive
                        ? cn("scale-[1.03] glass-strong vibe-gradient-border ring-2", col.ring, col.glow)
                        : "border-border/60 glass hover:border-pink/40",
                    )}
                  >
                    <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl ring-1", col.bg, col.ring)}>
                      <MapPin className={cn("h-5 w-5", col.text)} />
                    </span>
                    <p className={cn("mt-2 font-display text-lg font-bold", isActive ? col.text : "text-foreground")}>
                      {c}
                    </p>
                    {isActive && (
                      <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full vibe-gradient-bg">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setStep("vibes")}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl vibe-gradient-bg font-semibold text-white glow-pink vibe-pulse transition active:scale-95"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === "vibes" && (
          <div className="animate-slide-up space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl vibe-gradient-bg-warm glow-pink">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h1 className="font-display text-3xl font-extrabold leading-tight">
                Your <span className="vibe-gradient-text">vibe?</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Pick a few vibes you love. We&apos;ll tune your feed. (Optional)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {VIBE_TAGS.map((v) => {
                const active = picks.includes(v);
                const col = VIBE_COLOR[v] || VIBE_COLOR.Chill;
                return (
                  <button
                    key={v}
                    onClick={() => toggle(v)}
                    className={cn(
                      "relative flex items-center gap-2 overflow-hidden rounded-2xl border px-3 py-3 text-sm font-semibold transition press-feedback",
                      active
                        ? cn("scale-[1.04] glass-strong vibe-gradient-border ring-2", col.ring, col.glow)
                        : "border-border/60 glass text-muted-foreground hover:text-foreground hover:border-pink/40",
                    )}
                  >
                    {active && (
                      <span
                        className={cn(
                          "pointer-events-none absolute -inset-2 rounded-full opacity-40 blur-md",
                          col.bg,
                        )}
                      />
                    )}
                    <span className="relative text-2xl">{VIBE_EMOJI[v]}</span>
                    <span className={cn("relative", active ? col.text : "")}>{v}</span>
                    {active && (
                      <span className="relative ml-auto flex h-5 w-5 items-center justify-center rounded-full vibe-gradient-bg">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("city")}
                className="h-12 flex-1 rounded-xl glass font-medium text-foreground/90 ring-1 ring-border/40 transition hover:ring-violet/40"
              >
                Back
              </button>
              <button
                onClick={() => setStep("done")}
                className="flex h-12 flex-[2] items-center justify-center gap-1.5 rounded-xl vibe-gradient-bg font-semibold text-white glow-pink transition active:scale-95"
              >
                {picks.length > 0 ? "Looks good" : "Skip for now"}{" "}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="animate-slide-up space-y-5 text-center">
            <div className="mx-auto mb-2 flex h-20 w-20 items-center justify-center rounded-3xl vibe-gradient-bg-warm glow-pink vibe-pulse">
              <PartyPopper className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-extrabold leading-tight">
                You&apos;re <span className="vibe-gradient-text">all set!</span>
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                {picks.length > 0
                  ? `We've tuned your feed for ${city} with ${picks.length} vibe${picks.length > 1 ? "s" : ""}. Time to find your night out.`
                  : `We'll show you everything happening in ${city}. Let's go!`}
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-1.5">
              {picks.map((v) => {
                const col = VIBE_COLOR[v] || VIBE_COLOR.Chill;
                return (
                  <span
                    key={v}
                    className={cn(
                      "rounded-full glass px-3 py-1 text-xs font-medium ring-1",
                      col.bg,
                      col.ring,
                      col.text,
                    )}
                  >
                    {VIBE_EMOJI[v]} {v}
                  </span>
                );
              })}
              {picks.length === 0 && (
                <span className="rounded-full glass px-3 py-1 text-xs text-muted-foreground ring-1 ring-border/40">
                  All vibes welcome
                </span>
              )}
            </div>
            <button
              onClick={finish}
              className="flex h-12 w-full items-center justify-center gap-1.5 rounded-xl vibe-gradient-bg font-semibold text-white glow-pink vibe-pulse transition active:scale-95"
            >
              Enter VibeMatch <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
