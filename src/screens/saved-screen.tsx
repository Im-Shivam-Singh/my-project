"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Heart, Bookmark } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { PartyCard } from "@/components/vibe/party-card";
import { EmptyState } from "@/components/vibe/empty-state";

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
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center gap-2 glass border-b border-border/60 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/5"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-bold">Saved parties</h1>
          <p className="text-[11px] text-muted-foreground">
            {saved.length} saved
          </p>
        </div>
        <Heart className="h-5 w-5 fill-pink text-pink" />
      </header>

      <div className="fancy-scrollbar flex-1 space-y-3 overflow-y-auto p-4">
        {isLoading && (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-48 animate-pulse rounded-3xl border border-border bg-card/40"
              />
            ))}
          </div>
        )}

        {!isLoading && saved.length === 0 && (
          <EmptyState
            icon={Bookmark}
            title="No saved parties yet"
            description="Tap the heart on any party to save it here for later."
            action={
              <button
                onClick={() => setScreen("home")}
                className="rounded-full vibe-gradient-bg px-4 py-2 text-sm font-semibold text-white"
              >
                Explore parties
              </button>
            }
          />
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
