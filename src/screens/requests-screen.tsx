"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, Inbox as InboxIcon, Check, X, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { UserAvatar } from "@/components/vibe/user-avatar";
import { EmptyState } from "@/components/vibe/empty-state";
import { relativeTime } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RequestsScreen() {
  const goBack = useAppStore((s) => s.goBack);
  const currentUser = useAppStore((s) => s.currentUser);
  const setScreen = useAppStore((s) => s.setScreen);
  const qc = useQueryClient();

  const [tab, setTab] = useState<"all" | "pending" | "accepted">("all");

  // Fetch the user's hosted parties, then their requests.
  const { data: myParties } = useQuery({
    queryKey: ["parties", "mine", currentUser?.name],
    queryFn: () =>
      api.listParties().then((res) => ({
        ...res,
        parties: res.parties.filter(
          (p) =>
            p.hostName === currentUser?.name ||
            p.hostId === currentUser?.id,
        ),
      })),
    enabled: !!currentUser,
  });

  const partyIds = (myParties?.parties ?? []).map((p) => p.id);
  const activePartyId = partyIds[0];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["requests", activePartyId],
    queryFn: () => api.listRequests(activePartyId!),
    enabled: !!activePartyId,
    refetchInterval: 12_000,
  });

  const actMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "accepted" | "rejected" }) =>
      api.updateRequest(id, status),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.status === "accepted" ? "Request accepted ✅" : "Request rejected",
        {
          description:
            vars.status === "accepted"
              ? "A chat thread has been opened with this guest."
              : "The slot has been released.",
        },
      );
      // invalidate requests + parties (guest counts may have changed)
      qc.invalidateQueries({ queryKey: ["requests", activePartyId] });
      qc.invalidateQueries({ queryKey: ["parties"] });
      qc.invalidateQueries({ queryKey: ["analytics", currentUser?.id] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  const requests = (data?.requests ?? []).filter((r) =>
    tab === "all" ? true : r.status === tab,
  );

  const act = (id: string, status: "accepted" | "rejected") => {
    actMutation.mutate({ id, status });
  };

  return (
    <div className="flex h-full flex-col animate-screen-in">
      <header className="sticky top-0 z-20 glass-strong border-b border-border/60 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="flex items-center gap-2">
          <button
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-cyan transition hover:bg-cyan/10 hover:text-cyan hover:glow-cyan"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 font-display text-lg font-bold">
            <span className="vibe-gradient-text">Requests</span>
          </h1>
        </div>
        {/* Tabs */}
        <div className="mt-3 flex gap-1 rounded-full glass p-1 ring-1 ring-border/40">
          {(["all", "pending", "accepted"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-xs font-semibold capitalize transition",
                tab === t
                  ? "vibe-gradient-bg text-white glow-pink"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <div className="fancy-scrollbar flex-1 overflow-y-auto p-4">
        {!activePartyId && (
          <EmptyState
            icon={InboxIcon}
            title="No hosted parties yet"
            description="Once you launch a vibe, join requests from guests will show up here."
            action={
              <button
                onClick={() => setScreen("create")}
                className="rounded-full vibe-gradient-bg px-4 py-2 text-sm font-semibold text-white glow-pink"
              >
                Launch a vibe
              </button>
            }
          />
        )}

        {activePartyId && isLoading && (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl glass-strong p-3"
              >
                <div className="h-10 w-10 rounded-full vibe-skeleton" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 rounded vibe-skeleton" />
                  <div className="h-2 w-2/3 rounded vibe-skeleton" />
                </div>
              </div>
            ))}
          </div>
        )}

        {activePartyId && !isLoading && requests.length === 0 && (
          <EmptyState
            icon={InboxIcon}
            title="No requests here"
            description="When guests send a Request to Connect, they'll appear in this list."
          />
        )}

        {activePartyId && !isLoading && requests.length > 0 && (
          <ul className="space-y-2">
            {requests.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl glass-strong vibe-gradient-border p-3"
              >
                <div className="flex items-start gap-3">
                  <span className="relative block shrink-0 rounded-full">
                    <span className="absolute -inset-0.5 rounded-full vibe-gradient-bg opacity-80 blur-[1px]" />
                    <span className="relative block rounded-full ring-2 ring-background">
                      <UserAvatar name={r.requesterName} size={40} />
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {r.requesterName}
                      </p>
                      <span className="shrink-0 text-[11px] font-medium text-cyan/80">
                        {relativeTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/90">
                      {r.introMessage}
                    </p>
                    {r.status === "pending" ? (
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => act(r.id, "accepted")}
                          className="inline-flex items-center gap-1 rounded-full vibe-gradient-bg-acid px-3 py-1 text-xs font-bold text-black glow-acid transition active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </button>
                        <button
                          onClick={() => act(r.id, "rejected")}
                          className="inline-flex items-center gap-1 rounded-full glass px-3 py-1 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/40 transition hover:bg-rose-500/15 hover:text-rose-200"
                        >
                          <X className="h-3.5 w-3.5" /> Decline
                        </button>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          "mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
                          r.status === "accepted"
                            ? "bg-lime-400/15 text-lime-300 ring-lime-400/40"
                            : "bg-rose-500/15 text-rose-300 ring-rose-500/40",
                        )}
                      >
                        <Clock className="h-3 w-3" />
                        {r.status}
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
