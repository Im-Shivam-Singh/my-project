"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Check, MessageCircle, QrCode } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  currencyForCity,
  formatDateLabel,
  formatTime,
  type Order,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function ConfirmationScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const selectedOrderId = useAppStore((s) => s.selectedOrderId);
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders", currentUser?.id],
    queryFn: () => api.listOrders({ userId: currentUser!.id }),
    enabled: !!currentUser,
  });

  const orders: Order[] = data?.orders ?? [];
  const order = selectedOrderId
    ? orders.find((o) => o.id === selectedOrderId)
    : undefined;

  // ── Loading skeleton ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full flex-col animate-screen-in">
        <header className="sticky top-0 z-20 flex items-center gap-2 glass-strong border-b border-white/10 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
          <div className="h-9 w-9" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        </header>
        <div className="fancy-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-32">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-12 rounded-2xl" />
            <Skeleton className="h-12 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not-found / error state ───────────────────────────────────────
  if (isError || !order || !order.party) {
    return (
      <div className="flex h-full flex-col animate-screen-in">
        <header className="sticky top-0 z-20 flex items-center gap-2 glass-strong border-b border-white/10 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
          <button
            onClick={goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="eyebrow">Confirmed</span>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full coral-foil">
            <span className="text-2xl">🧾</span>
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            Order not found
          </h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            We couldn’t find that order. It may have been removed, or your
            session may have changed.
          </p>
          <button
            onClick={() => setScreen("home")}
            className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-violet press-feedback"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  const party = order.party;
  const sym = currencyForCity(party.city);
  const guestCount = (party.guestCount || 0) + 1; // include the host

  return (
    <div className="flex h-full flex-col animate-screen-in">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 glass-strong border-b border-white/10 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <span className="eyebrow">Confirmed</span>
          <h1 className="font-display text-lg font-bold leading-tight text-foreground">
            You’re in
          </h1>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="fancy-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        {/* ── Success banner ─────────────────────────────────────── */}
        <section className="teal-foil animate-pop-in rounded-3xl p-5">
          <div className="flex items-start gap-3.5">
            <div className="glow-cyan flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500">
              <Check className="h-4 w-4 text-white" strokeWidth={3} />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <h2 className="font-display text-lg font-bold leading-tight text-teal-300">
                You’re in. Spot secured.
              </h2>
              <p className="text-sm font-medium text-foreground/85">
                {party.title} · {formatDateLabel(party.date)} ·{" "}
                {formatTime(party.time)}
              </p>
              <p className="text-xs text-muted-foreground">
                Group chat is now unlocked
              </p>
            </div>
          </div>
        </section>

        {/* ── Receipt card ───────────────────────────────────────── */}
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Receipt</span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {order.status}
            </span>
          </div>
          <ul className="space-y-2.5">
            {order.items.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2 text-foreground">
                  <span className="text-base leading-none">{it.emoji}</span>
                  <span className="truncate font-medium">{it.name}</span>
                  <span className="shrink-0 text-muted-foreground">
                    × {it.quantity}
                  </span>
                </span>
                <span className="shrink-0 font-medium text-foreground/90">
                  {sym}
                  {(it.unitPrice * it.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3.5 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-sm font-semibold text-foreground">
              Total paid
            </span>
            <span className="font-display text-base font-bold text-primary">
              {sym}
              {order.totalAmount.toFixed(2)}
            </span>
          </div>
        </section>

        {/* ── QR card ────────────────────────────────────────────── */}
        <section className="glass flex flex-col items-center rounded-2xl p-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-white/8">
            <span className="text-[32px] leading-none">▦</span>
          </div>
          <p className="mt-3 text-sm font-semibold text-foreground">
            Your entry QR
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Show at the door · host scans to check in and flag your pre-order
          </p>
        </section>

        {/* ── Group chat preview ─────────────────────────────────── */}
        <section className="purple-foil rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-purple-300" />
              <span className="text-sm font-semibold text-foreground">
                Group chat · {guestCount} people
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] text-purple-300/80">
              Unlocked
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Host bubble (theirs, left) */}
            <div className="flex items-end gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/30 text-[10px] font-bold text-purple-200">
                {party.hostName?.slice(0, 1).toUpperCase() ?? "H"}
              </div>
              <div className="max-w-[78%] rounded-[4px_12px_12px_12px] bg-white/8 px-3 py-2 text-sm text-foreground">
                Welcome to the group! Doors open at {formatTime(party.time)} 🎉
              </div>
            </div>

            {/* Guest bubble (theirs, left) */}
            <div className="flex items-end gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-500/25 text-[10px] font-bold text-teal-200">
                S
              </div>
              <div className="max-w-[78%] rounded-[4px_12px_12px_12px] bg-white/8 px-3 py-2 text-sm text-foreground">
                Bringing board games 🎲
              </div>
            </div>

            {/* You bubble (right) */}
            <div className="flex items-end justify-end gap-2">
              <div className="max-w-[78%] rounded-[12px_4px_12px_12px] bg-purple-500/40 px-3 py-2 text-sm text-purple-foreground">
                See you there 🙌
              </div>
            </div>
          </div>

          {/* Disabled input row (visual only) */}
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-border bg-white/5 px-3 py-2 opacity-60">
            <input
              type="text"
              disabled
              placeholder="Message the group…"
              className="flex-1 bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <span className="text-muted-foreground">↩</span>
          </div>
        </section>

        {/* ── CTAs ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setScreen("inbox")}
            className="press-feedback glow-violet flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            Open chat
          </button>
          <button
            onClick={() => setScreen("tickets")}
            className="press-feedback flex items-center justify-center gap-2 rounded-2xl border border-purple-500/40 bg-transparent px-4 py-3 text-sm font-semibold text-purple-300"
          >
            <QrCode className="h-4 w-4" />
            View QR
          </button>
        </div>
      </div>
    </div>
  );
}
