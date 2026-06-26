"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { PartyCard } from "@/components/vibe/party-card";

export function SavedScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const savedPartyIds = useAppStore((s) => s.savedPartyIds);
  const setSelectedPartyId = useAppStore((s) => s.setSelectedPartyId);
  const setScreen = useAppStore((s) => s.setScreen);

  const { data, isLoading } = useQuery({
    queryKey: ["parties", "all"],
    queryFn: () => api.listParties(),
  });

  const saved = useMemo(() => {
    const all = data?.parties ?? [];
    return all.filter((p) => savedPartyIds.includes(p.id));
  }, [data, savedPartyIds]);

  const openParty = (id: string) => {
    setSelectedPartyId(id);
    setScreen("detail");
  };

  return (
    <div className="flex h-full flex-col animate-screen-in">
      <header className="sticky top-0 z-20 flex items-center gap-2 glass-strong border-b border-border/60 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-cyan transition hover:bg-cyan/10 hover:text-cyan hover:glow-cyan"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">
            <span className="vibe-gradient-text">Saved</span>
          </h1>
          <p className="text-[11px] font-medium text-cyan/80">
            {saved.length} saved
          </p>
        </div>
        <Heart className="h-5 w-5 fill-pink text-pink text-glow-pink" />
      </header>

      <div className="fancy-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-3xl glass-strong vibe-gradient-border vibe-skeleton"
              />
            ))}
          </div>
        )}

        {!isLoading && saved.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="vibe-float">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl vibe-gradient-bg-warm text-4xl shadow-lg glow-pink">
                🔖
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg font-bold vibe-gradient-text">
                No saved parties yet
              </p>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                Tap the heart on any party to save it here for later.
              </p>
            </div>
            <button
              onClick={() => setScreen("home")}
              className="rounded-full vibe-gradient-bg px-4 py-2 text-sm font-semibold text-white glow-pink transition active:scale-95"
            >
              Explore parties
            </button>
          </div>
        )}

        {!isLoading &&
          saved.length > 0 &&
          saved.map((p) => (
            <PartyCard key={p.id} party={p} onOpen={openParty} />
          ))}
      </div>
    </div>
  );
}
