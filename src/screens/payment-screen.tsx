"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronLeft, Minus, Plus, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  currencyForCity,
  formatDateLabel,
  type MenuItem,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type PaymentMethod = "visa" | "applepay" | "googlepay";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  sub?: string;
}[] = [
  { id: "visa", label: "Visa ending 4242", sub: "Default card" },
  { id: "applepay", label: "Apple Pay" },
  { id: "googlepay", label: "Google Pay" },
];

export function PaymentScreen() {
  const partyId = useAppStore((s) => s.selectedPartyId);
  const currentUser = useAppStore((s) => s.currentUser);
  const goBack = useAppStore((s) => s.goBack);
  const setScreen = useAppStore((s) => s.setScreen);
  const setSelectedOrderId = useAppStore((s) => s.setSelectedOrderId);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("visa");
  const [submitting, setSubmitting] = useState(false);

  const partyQuery = useQuery({
    queryKey: ["party", partyId],
    queryFn: () => api.getParty(partyId!),
    enabled: !!partyId,
  });

  const menuQuery = useQuery({
    queryKey: ["menu", partyId],
    queryFn: () => api.listMenu(partyId!),
    enabled: !!partyId,
  });

  const party = partyQuery.data?.party;
  const menuItems: MenuItem[] = menuQuery.data?.items ?? [];
  const currency = party ? currencyForCity(party.city) : "£";

  const addOnCount = useMemo(
    () =>
      Object.values(quantities).reduce((sum, q) => sum + (q ?? 0), 0),
    [quantities],
  );

  const menuTotal = useMemo(
    () =>
      menuItems.reduce(
        (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
        0,
      ),
    [menuItems, quantities],
  );

  const entryFee = party?.fee ?? 0;
  const total = entryFee + menuTotal;

  const formatPrice = (n: number) => `${currency}${n.toFixed(2)}`;

  const orderMutation = useMutation({
    mutationFn: (items: {
      menuItemId?: string;
      name: string;
      emoji: string;
      unitPrice: number;
      quantity: number;
    }[]) =>
      api.createOrder({
        userId: currentUser!.id,
        partyId: partyId!,
        items,
      }),
    onSuccess: (data) => {
      setSelectedOrderId(data.order.id);
      toast.success("Spot secured!", {
        description: "Your ticket + add-ons are locked in.",
      });
      setScreen("confirmation");
    },
    onError: () => {
      toast.error("Payment failed — try again");
    },
  });

  const submit = (skipDrinks = false) => {
    if (!party || !currentUser || !partyId) return;
    if (submitting) return;
    setSubmitting(true);

    const items: {
      menuItemId?: string;
      name: string;
      emoji: string;
      unitPrice: number;
      quantity: number;
    }[] = [
      {
        name: "Entry ticket",
        emoji: "🎟️",
        unitPrice: party.fee,
        quantity: 1,
      },
    ];

    if (!skipDrinks) {
      for (const item of menuItems) {
        const q = quantities[item.id] ?? 0;
        if (q > 0) {
          items.push({
            menuItemId: item.id,
            name: item.name,
            emoji: item.emoji,
            unitPrice: item.price,
            quantity: q,
          });
        }
      }
    }

    orderMutation.mutate(items, {
      onSettled: () => setSubmitting(false),
    });
  };

  const setQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const next = Math.max(0, (prev[id] ?? 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  // Guard: no selected party / user
  if (!partyId || !currentUser) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center animate-screen-in">
        <p className="text-sm text-muted-foreground">
          Pick a party to confirm your spot.
        </p>
        <Button variant="outline" onClick={() => setScreen("home")}>
          Browse parties
        </Button>
      </div>
    );
  }

  // Loading skeleton
  if (partyQuery.isLoading || !party) {
    return (
      <div className="flex h-full flex-col animate-screen-in">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/10 glass px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-2.5 w-28" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-48" />
          </div>
        </header>
        <div className="space-y-4 p-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col animate-screen-in">
      {/* Sticky header */}
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-white/10 glass px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full glass border border-white/10 text-white transition hover:bg-purple-500/10 active:scale-95"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <span className="eyebrow">Step 4 of 9 · Checkout</span>
          <h1 className="font-display text-lg font-semibold leading-tight text-foreground">
            Confirm your spot
          </h1>
          <p className="truncate text-xs text-muted-foreground">
            {party.title} · {formatDateLabel(party.date)}
          </p>
        </div>
      </header>

      {/* Scrollable content */}
      <div className="fancy-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        {/* Entry ticket card */}
        <section
          className="glass animate-stagger rounded-2xl p-4"
          style={{ animationDelay: "40ms" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="purple-foil flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg">
                🎟️
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  1 × entry ticket
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {party.title}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-base font-semibold text-purple-300">
                {formatPrice(party.fee)}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Fixed
              </p>
            </div>
          </div>
        </section>

        {/* Add drinks & snacks */}
        <section
          className="glass animate-stagger rounded-2xl p-4"
          style={{ animationDelay: "100ms" }}
        >
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-semibold text-foreground">
                Add drinks & snacks
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Like ordering at a cinema — pick up at the door
              </p>
            </div>
            <span className="teal-foil rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-teal-300">
              Optional
            </span>
          </div>

          {menuQuery.isLoading ? (
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : menuItems.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-white/10 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                No pre-order menu for this party.
              </p>
            </div>
          ) : (
            <ul className="mt-3 space-y-1">
              {menuItems.map((item) => {
                const qty = quantities[item.id] ?? 0;
                return (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl px-1 py-2"
                  >
                    <span className="shrink-0 text-xl">{item.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.name}
                      </p>
                      <p className="text-xs text-purple-300">
                        {formatPrice(item.price)}
                      </p>
                    </div>
                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQty(item.id, -1)}
                        disabled={qty === 0}
                        aria-label={`Remove one ${item.name}`}
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full border transition active:scale-95",
                          qty === 0
                            ? "cursor-not-allowed border-white/10 text-white/20"
                            : "border-purple-500/40 text-purple-200 hover:bg-purple-500/15",
                        )}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-medium tabular-nums text-foreground">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQty(item.id, 1)}
                        aria-label={`Add one ${item.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-purple-500/40 text-purple-200 transition hover:bg-purple-500/15 active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Payment method card */}
        <section
          className="glass animate-stagger rounded-2xl p-4"
          style={{ animationDelay: "160ms" }}
        >
          <h2 className="mb-3 font-display text-base font-semibold text-foreground">
            Payment method
          </h2>
          <ul className="space-y-1">
            {PAYMENT_METHODS.map((m) => {
              const selected = paymentMethod === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                      selected ? "purple-foil" : "hover:bg-white/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition",
                        selected
                          ? "border-purple-400 bg-purple-500"
                          : "border-white/20",
                      )}
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-sm font-medium",
                          selected
                            ? "text-foreground"
                            : "text-foreground/80",
                        )}
                      >
                        {m.label}
                      </p>
                      {m.sub && (
                        <p className="text-xs text-muted-foreground">
                          {m.sub}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Total + CTA + skip + footer */}
        <section className="pt-2">
          {/* Total row */}
          <div className="flex items-end justify-between border-t border-border pt-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="text-[10px] text-muted-foreground">
                Entry + {addOnCount} add-on{addOnCount === 1 ? "" : "s"}
              </p>
            </div>
            <p className="font-display text-3xl font-bold tabular-nums text-primary">
              {formatPrice(total)}
            </p>
          </div>

          {/* CTA */}
          <Button
            type="button"
            onClick={() => submit(false)}
            disabled={submitting}
            className="glow-violet mt-4 h-12 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {submitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/40 border-t-primary-foreground" />
                Processing…
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pay {formatPrice(total)} · confirm spot 🔒
              </>
            )}
          </Button>

          {/* Skip link */}
          <div className="mt-2 text-center">
            <button
              type="button"
              onClick={() => submit(true)}
              disabled={submitting}
              className="text-xs font-medium text-purple-300/70 underline-offset-2 transition hover:text-purple-300 hover:underline disabled:opacity-50"
            >
              Skip drinks for now · entry only
            </button>
          </div>

          {/* Footer micro */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Secured by Stripe · refundable if host cancels
          </p>
        </section>
      </div>
    </div>
  );
}
