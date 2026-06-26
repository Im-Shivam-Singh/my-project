"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ImagePlus, CalendarDays, Clock, IndianRupee, Users, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  CITIES,
  VIBE_TAGS,
  VIBE_EMOJI,
  formatDateLabel,
  formatFee,
  formatTime,
  type PartyCreateInput,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const COVER_PRESETS = [
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1496337589254-7e19d01cec44?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1571266028243-d220c9c3b31e?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483452389744-eaaf621f05cb?w=800&q=80&auto=format&fit=crop",
];

const ENTRY_TYPES = [
  { label: "Free", value: 0 },
  { label: "Cover", value: 500 },
  { label: "Premium", value: 1200 },
];

export function CreateScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);
  const setSelectedPartyId = useAppStore((s) => s.setSelectedPartyId);
  const currentUser = useAppStore((s) => s.currentUser);
  const qc = useQueryClient();

  const [form, setForm] = useState<PartyCreateInput>({
    title: "",
    city: currentUser?.city || "Mumbai",
    area: "",
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    time: "21:00",
    fee: 0,
    maxGuests: 20,
    vibes: [],
    description: "",
    hostName: currentUser?.name || "You",
    coverUrl: COVER_PRESETS[0],
  });

  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof PartyCreateInput>(k: K, v: PartyCreateInput[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleVibe = (v: string) =>
    setForm((f) => ({
      ...f,
      vibes: f.vibes.includes(v)
        ? f.vibes.filter((x) => x !== v)
        : [...f.vibes, v],
    }));

  const createMutation = useMutation({
    mutationFn: (input: PartyCreateInput) => api.createParty(input),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["parties"] });
      toast.success("Vibe launched! 🚀", {
        description: "Your party is now live on Explore.",
      });
      setSelectedPartyId(data.party.id);
      setScreen("detail");
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Failed to launch"),
  });

  const submit = () => {
    if (!form.title.trim()) {
      toast.error("Give your party a title");
      return;
    }
    if (!form.area.trim()) {
      toast.error("Add an area / neighbourhood");
      return;
    }
    if (form.vibes.length === 0) {
      toast.error("Pick at least one vibe");
      return;
    }
    setSubmitting(true);
    createMutation.mutate(form, {
      onSettled: () => setSubmitting(false),
    });
  };

  return (
    <div className="flex h-full flex-col animate-screen-in">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/10 glass px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-full glass border border-white/10 text-white hover:bg-yellow-400/10 active:scale-95 transition"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold leading-tight">
            Launch a <span className="text-yellow-400">Vibe</span>
          </h1>
          <p className="text-[11px] text-muted-foreground">
            Fill the details and go live in seconds
          </p>
        </div>
      </header>

      <div className="fancy-scrollbar flex-1 overflow-y-auto p-4">
        <div className="glass-strong rounded-3xl border border-yellow-400/40 p-4 space-y-6">
          {/* Cover preview */}
          <section className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-white flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
              Cover
            </Label>
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-yellow-400/40">
              {form.coverUrl && (
                <img
                  src={form.coverUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-yellow-400/10" />
              <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full glass border border-white/10 px-2 py-1 text-[10px] text-foreground backdrop-blur">
                <ImagePlus className="h-3 w-3 text-yellow-300" /> Tap a preset below
              </div>
            </div>
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
              {COVER_PRESETS.map((url) => (
                <button
                  key={url}
                  onClick={() => set("coverUrl", url)}
                  className={cn(
                    "relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition active:scale-95",
                    form.coverUrl === url
                      ? "border-yellow-400 ring-2 ring-yellow-400/50"
                      : "border-white/10 hover:border-yellow-400/40",
                  )}
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  {form.coverUrl === url && (
                    <span className="absolute inset-0 flex items-center justify-center bg-yellow-400/30">
                      <Check className="h-4 w-4 text-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Title */}
          <section className="space-y-1.5">
            <Label htmlFor="title" className="text-white flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
              Party title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Neon Rooftop: Techno Till Dawn"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="h-12 rounded-xl border-white/10 bg-card text-foreground placeholder:text-muted-foreground/70 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
              maxLength={80}
            />
          </section>

          {/* City + Area */}
          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-white flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
                City
              </Label>
              <select
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                className="h-12 w-full rounded-xl border border-white/10 bg-card px-3 text-sm text-foreground outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c} className="bg-card">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="area" className="text-white flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
                Area
              </Label>
              <Input
                id="area"
                placeholder="Bandra West"
                value={form.area}
                onChange={(e) => set("area", e.target.value)}
                className="h-12 rounded-xl border-white/10 bg-card text-foreground placeholder:text-muted-foreground/70 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
              />
            </div>
          </section>

          {/* Date + Time */}
          <section className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-white">
                <CalendarDays className="h-3.5 w-3.5 text-yellow-400" /> Date
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="h-12 rounded-xl border-white/10 bg-card text-foreground focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-white">
                <Clock className="h-3.5 w-3.5 text-yellow-400" /> Time
              </Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => set("time", e.target.value)}
                className="h-12 rounded-xl border-white/10 bg-card text-foreground focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
              />
            </div>
          </section>

          {/* Entry type quick */}
          <section className="space-y-2">
            <Label className="text-white flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
              Entry type
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {ENTRY_TYPES.map((t) => {
                const active = form.fee === t.value;
                return (
                  <button
                    key={t.label}
                    onClick={() => set("fee", t.value)}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-left transition active:scale-95",
                      active
                        ? "border-yellow-400 bg-yellow-400/10"
                        : "border-white/10 bg-card hover:border-yellow-400/40",
                    )}
                  >
                    <div className="text-xs font-semibold">{t.label}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {t.value === 0 ? "No charge" : `~₹${t.value}`}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-yellow-400" />
              <Input
                type="number"
                min={0}
                value={form.fee}
                onChange={(e) => set("fee", Number(e.target.value) || 0)}
                className="h-11 rounded-xl border-white/10 bg-card pl-9 text-foreground focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
              />
            </div>
          </section>

          {/* Max guests */}
          <section className="space-y-2">
            <Label className="flex items-center gap-1.5 text-white">
              <Users className="h-3.5 w-3.5 text-yellow-400" /> Max guests
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={5}
                max={100}
                step={1}
                value={form.maxGuests}
                onChange={(e) => set("maxGuests", Number(e.target.value))}
                className="vibe-slider h-2 flex-1"
                style={
                  {
                    background: `linear-gradient(to right, #ffcb05 0%, #e0a800 ${
                      ((form.maxGuests - 5) / 95) * 100
                    }%, rgba(255,203,5,0.18) ${
                      ((form.maxGuests - 5) / 95) * 100
                    }%)`,
                  } as React.CSSProperties
                }
              />
              <span className="w-12 rounded-lg border border-white/10 bg-card py-1.5 text-center text-sm font-semibold text-yellow-400">
                {form.maxGuests}
              </span>
            </div>
          </section>

          {/* Vibe chips multi-select */}
          <section className="space-y-2">
            <Label className="text-white flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
              Vibes (pick what fits)
            </Label>
            <div className="flex flex-wrap gap-2">
              {VIBE_TAGS.map((v) => {
                const active = form.vibes.includes(v);
                return (
                  <button
                    key={v}
                    onClick={() => toggleVibe(v)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95",
                      active
                        ? "scale-110 border-yellow-400/50 bg-yellow-400/15 text-yellow-300"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-foreground hover:border-yellow-400/40",
                    )}
                  >
                    <span aria-hidden>{VIBE_EMOJI[v]}</span>
                    {v}
                    {active && <Check className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Description */}
          <section className="space-y-1.5">
            <Label htmlFor="desc" className="text-white flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
              Description
            </Label>
            <Textarea
              id="desc"
              rows={4}
              placeholder="Set the scene: music, vibe, dress code, what to bring, house rules…"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="rounded-xl border-white/10 bg-card text-foreground placeholder:text-muted-foreground/70 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
              maxLength={600}
            />
            <p className="text-right text-[11px] text-muted-foreground">
              {form.description.length}/600
            </p>
          </section>

          {/* Host name */}
          <section className="space-y-1.5">
            <Label htmlFor="host" className="text-white flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-yellow-400" aria-hidden />
              Host name
            </Label>
            <Input
              id="host"
              value={form.hostName}
              onChange={(e) => set("hostName", e.target.value)}
              className="h-12 rounded-xl border-white/10 bg-card text-foreground placeholder:text-muted-foreground/70 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/25"
            />
          </section>

          {/* Live preview — how the party card will look */}
          <section className="space-y-2">
            <Label className="text-white flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
              Live preview
            </Label>
            <div className="overflow-hidden rounded-2xl glass border border-yellow-400/40">
              <div className="relative aspect-[16/9] w-full">
                {form.coverUrl ? (
                  <img
                    src={form.coverUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-yellow-400 opacity-60" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
                <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-yellow-400 backdrop-blur">
                  {formatFee(form.fee)}
                </span>
              </div>
              <div className="space-y-2 p-3">
                <p className="font-display text-sm font-bold leading-tight">
                  {form.title.trim() || (
                    <span className="text-muted-foreground">Your party title</span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDateLabel(form.date)} · {formatTime(form.time)} ·{" "}
                  {form.area || "Area"}, {form.city}
                </p>
                {form.vibes.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {form.vibes.map((v) => (
                      <span
                        key={v}
                        className="inline-flex items-center gap-1 rounded-full border border-yellow-400/50 bg-yellow-400/15 px-2 py-0.5 text-[10px] font-medium text-yellow-300"
                      >
                        {VIBE_EMOJI[v]} {v}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-foreground/70">
                  Hosted by{" "}
                  <span className="font-semibold text-yellow-400">
                    {form.hostName || "You"}
                  </span>{" "}
                  · up to {form.maxGuests} guests
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Footer CTA */}
      <footer className="sticky bottom-0 z-20 border-t border-white/10 glass px-4 py-3 safe-bottom">
        <Button
          onClick={submit}
          disabled={submitting}
          className={cn(
            "h-12 w-full rounded-xl bg-yellow-400 text-base font-semibold text-black transition active:scale-95 disabled:opacity-60",
            !submitting && "vibe-pulse",
          )}
        >
          {submitting ? (
            "Launching…"
          ) : (
            <>
              <Sparkles className="mr-1.5 h-4 w-4" /> Launch Vibe
            </>
          )}
        </Button>
      </footer>

      <style>{`
        .vibe-slider { -webkit-appearance: none; appearance: none; border-radius: 999px; outline: none; }
        .vibe-slider::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 3px solid #ffcb05;
          box-shadow: 0 2px 8px rgba(255,203,5,0.6); cursor: pointer;
        }
        .vibe-slider::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: #fff; border: 3px solid #ffcb05; cursor: pointer;
        }
      `}</style>
    </div>
  );
}
