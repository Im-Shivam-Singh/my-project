"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  Check,
  MapPin,
  MessageCircle,
  ArrowRight,
  Bell,
  Clock,
  CalendarClock,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  countdownTo,
  formatDateLabel,
  formatTime,
  type Party,
} from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Step model ────────────────────────────────────────────────────────
type StepState = "done" | "active" | "pending";

interface TrackerStep {
  number: number;
  title: string;
  subtitle?: string;
}

const STEPS: TrackerStep[] = [
  {
    number: 1,
    title: "Spot confirmed",
    subtitle: "Receipt sent to email",
  },
  {
    number: 2,
    title: "Group chat unlocked",
    subtitle: "Meet everyone before arriving",
  },
  {
    number: 3,
    title: "Reminders coming",
    subtitle: "24hr + 2hr push notifications",
  },
  {
    number: 4,
    title: "Location drops day-of",
    subtitle: "Map pin at {time} on {day}",
  },
  {
    number: 5,
    title: "Arrive · scan QR · collect order",
  },
];

function stepStateFor(stepNumber: number, activeStep: number): StepState {
  if (stepNumber < activeStep) return "done";
  if (stepNumber === activeStep) return "active";
  return "pending";
}

// ── Step dot ──────────────────────────────────────────────────────────
function StepDot({
  number,
  state,
}: {
  number: number;
  state: StepState;
}) {
  if (state === "done") {
    return (
      <div className="glow-cyan flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-500">
        <Check className="h-4 w-4 text-white" strokeWidth={3} />
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="glow-violet flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white">
        <span className="text-xs font-bold">{number}</span>
      </div>
    );
  }
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-secondary text-muted-foreground">
      <span className="text-xs font-medium">{number}</span>
    </div>
  );
}

// ── Step row (with vertical connector) ────────────────────────────────
function StepRow({
  step,
  state,
  isLast,
}: {
  step: TrackerStep;
  state: StepState;
  isLast: boolean;
}) {
  const titleClass =
    state === "done"
      ? "text-foreground"
      : state === "active"
        ? "text-purple-300"
        : "text-muted-foreground";
  const subtitleClass =
    state === "active" ? "text-purple-300/70" : "text-muted-foreground/85";

  return (
    <li className="relative flex gap-3.5 pb-5 last:pb-0">
      {/* dot */}
      <StepDot number={step.number} state={state} />
      {/* connector line */}
      {!isLast && (
        <span
          aria-hidden
          className={cn(
            "absolute left-[13.5px] top-7 h-[calc(100%-1.25rem)] w-px",
            state === "done" ? "bg-teal-500/45" : "bg-white/10",
          )}
        />
      )}
      {/* content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={cn("text-sm font-medium leading-tight", titleClass)}>
          {step.title}
        </p>
        {step.subtitle && (
          <p className={cn("mt-0.5 text-xs leading-snug", subtitleClass)}>
            {step.subtitle}
          </p>
        )}
      </div>
    </li>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────
function CountdownSkeleton() {
  return (
    <div className="flex h-full flex-col animate-screen-in">
      <header className="sticky top-0 z-20 flex items-center gap-2 glass-strong border-b border-white/10 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <div className="h-9 w-9" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </header>
      <div className="fancy-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────
function EmptyState({ goBack }: { goBack: () => void }) {
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
        <span className="eyebrow">Countdown</span>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full purple-foil">
          <CalendarClock className="h-6 w-6 text-purple-300" />
        </div>
        <h2 className="font-display text-lg font-bold text-foreground">
          No party selected
        </h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Pick a party from the feed to see what happens between paying and
          arriving.
        </p>
        <button
          onClick={() => useAppStore.getState().setScreen("home")}
          className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground glow-violet press-feedback"
        >
          Browse parties
        </button>
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────
export function CountdownScreen() {
  const id = useAppStore((s) => s.selectedPartyId);
  const goBack = useAppStore((s) => s.goBack);
  const currentUser = useAppStore((s) => s.currentUser);
  const setScreen = useAppStore((s) => s.setScreen);

  // Party + ticket queries (hooks must run unconditionally — see rules-of-hooks)
  const { data: partyData, isLoading, isError } = useQuery({
    queryKey: ["party", id],
    queryFn: () => api.getParty(id!),
    enabled: !!id,
  });

  const { data: ticketsData } = useQuery({
    queryKey: ["tickets", currentUser?.id],
    queryFn: () => api.listTickets(currentUser!.id),
    enabled: !!currentUser && !!id,
  });

  // ── Loading ───────────────────────────────────────────────────────
  if (isLoading) return <CountdownSkeleton />;
  if (isError || !id || !partyData?.party) return <EmptyState goBack={goBack} />;

  const party: Party = partyData.party;
  const userTickets = ticketsData?.tickets ?? [];
  const hasTicket = userTickets.some((t) => t.partyId === id);

  // ── Time derivations ──────────────────────────────────────────────
  const now = Date.now();
  const partyStart = new Date(`${party.date}T${party.time}:00`).getTime();
  const revealAt = party.locationRevealAt
    ? new Date(party.locationRevealAt).getTime()
    : partyStart - 3 * 3600 * 1000;

  let activeStep = 3; // default: reminders phase
  if (now > revealAt) activeStep = 5;
  else if (now > partyStart - 24 * 3600 * 1000) activeStep = 4;

  const msUntilReveal = revealAt - now;
  const hoursUntilReveal = Math.max(0, Math.ceil(msUntilReveal / 3_600_000));
  const revealDropped = msUntilReveal <= 0;

  // Reveal time + day label (e.g. "9:00 PM on Sat")
  const revealDate = new Date(revealAt);
  const revealHour = String(revealDate.getHours()).padStart(2, "0");
  const revealMin = String(revealDate.getMinutes()).padStart(2, "0");
  const revealTimeStr = formatTime(`${revealHour}:${revealMin}`);
  const revealDay = revealDate.toLocaleDateString("en-GB", {
    weekday: "short",
  });

  // Fill step 4 subtitle template: "Map pin at {time} on {day}"
  const steps = STEPS.map((s) =>
    s.number === 4
      ? { ...s, subtitle: `Map pin at ${revealTimeStr} on ${revealDay}` }
      : s,
  );

  const guestCount = Math.max(1, (party.guestCount || 0) + 1); // include host
  const partyCountdown = countdownTo(party.date, party.time);

  return (
    <div className="flex h-full flex-col animate-screen-in">
      {/* ── Sticky header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-20 flex items-center gap-2 glass-strong border-b border-white/10 px-3 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition hover:bg-white/10"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <span className="eyebrow">Countdown</span>
          <h1 className="truncate font-display text-base font-bold leading-tight text-foreground">
            {party.title}
          </h1>
        </div>
        <span className="teal-foil shrink-0 rounded-full px-3 py-1 text-xs font-medium text-teal-300">
          {partyCountdown}
        </span>
      </header>

      {/* ── Scrollable body ───────────────────────────────────────── */}
      <div className="fancy-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        {/* ── No-ticket soft banner ─────────────────────────────── */}
        {!hasTicket && currentUser && (
          <section className="amber-foil animate-pop-in rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <Bell className="h-4 w-4 text-amber-300" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-amber-300">
                  You haven&apos;t secured a spot yet
                </p>
                <p className="text-xs text-muted-foreground">
                  This is a preview of what happens after you pay. Grab a spot
                  to unlock reminders, the group chat, and the day-of location
                  drop.
                </p>
                <button
                  onClick={() => setScreen("detail")}
                  className="press-feedback mt-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-200 transition hover:bg-amber-500/30"
                >
                  View party & get a spot
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ── Step tracker ───────────────────────────────────────── */}
        <section className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="eyebrow">Your night, mapped</span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              Step {activeStep}/5
            </span>
          </div>
          <ol className="relative">
            {steps.map((step, i) => (
              <StepRow
                key={step.number}
                step={step}
                state={stepStateFor(step.number, activeStep)}
                isLast={i === steps.length - 1}
              />
            ))}
          </ol>
        </section>

        {/* ── Location-drop alert (coral) ────────────────────────── */}
        {!revealDropped && (
          <section className="coral-foil animate-pop-in rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-base leading-none">📍</span>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold text-orange-300">
                  Location drops in {hoursUntilReveal}{" "}
                  {hoursUntilReveal === 1 ? "hour" : "hours"}
                </p>
                <p className="text-xs leading-snug text-orange-300/70">
                  Map pin will appear in your group chat at {revealTimeStr} on{" "}
                  {revealDay}. Only visible to you and other confirmed guests.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ── Location card (purple) ─────────────────────────────── */}
        <section className="purple-foil rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
              <MapPin className="h-5 w-5 text-purple-300" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-sm font-semibold text-purple-300">
                {party.area}
                {party.city ? `, ${party.city}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {revealDropped
                  ? "Exact address is in your group chat"
                  : "Exact address arriving soon"}
              </p>
              <button
                onClick={() => setScreen("map")}
                className="press-feedback mt-2 inline-flex items-center gap-1.5 rounded-xl bg-purple-500/20 px-3 py-1.5 text-xs font-semibold text-purple-200 transition hover:bg-purple-500/30"
              >
                Open full map
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ── Party chat preview (purple) ────────────────────────── */}
        <button
          onClick={() => setScreen("inbox")}
          className="press-feedback purple-foil block w-full rounded-2xl p-4 text-left"
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-purple-300" />
              <span className="text-sm font-semibold text-foreground">
                Party chat · {guestCount} people 🔥
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-[0.15em] text-purple-300/80">
              Tap to open
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Other guest bubble (left, amber avatar) */}
            <div className="flex items-end gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-[10px] font-bold text-amber-200">
                R
              </div>
              <div className="max-w-[78%] rounded-[4px_12px_12px_12px] bg-white/8 px-3 py-2 text-sm text-foreground">
                Anyone else getting hyped?? 🎵
              </div>
            </div>

            {/* You bubble (right, purple) */}
            <div className="flex items-end justify-end gap-2">
              <div className="max-w-[78%] rounded-[12px_4px_12px_12px] bg-purple-500/40 px-3 py-2 text-sm text-purple-foreground">
                So ready for this 🙌
              </div>
            </div>
          </div>

          {/* hint row */}
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-border bg-white/5 px-3 py-2 opacity-70">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="flex-1 text-xs text-muted-foreground">
              {formatDateLabel(party.date)} · {formatTime(party.time)}
            </span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </button>
      </div>
    </div>
  );
}
