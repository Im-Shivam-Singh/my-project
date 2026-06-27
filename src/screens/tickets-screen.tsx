"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ticket as TicketIcon, RefreshCw, QrCode, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import {
  currencyForCity,
  formatDateLabel,
  formatTime,
  type OrderItem,
  type Ticket,
} from "@/lib/types";

/* -------------------------------------------------------------------------- */
/*  QR placeholder (qrcode npm package is NOT installed)                       */
/*  Renders a 7×7 deterministic boolean grid derived from the ticket's         */
/*  qrHash, with the 3 classic QR "finder" patterns (top-left, top-right,       */
/*  bottom-left) drawn as ringed squares to make it read as a real QR.          */
/* -------------------------------------------------------------------------- */

const QR_N = 7;

function hashSeed(hash: string): number {
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < hash.length; i++) {
    h ^= hash.charCodeAt(i);
    h = Math.imul(h, 0x01000193); // FNV prime
  }
  return h >>> 0;
}

/** A cell belongs to one of the 3 finder patterns (TL, TR, BL). */
function finderZone(
  r: number,
  c: number,
): "tl" | "tr" | "bl" | null {
  if (r < 3 && c < 3) return "tl";
  if (r < 3 && c >= QR_N - 3) return "tr";
  if (r >= QR_N - 3 && c < 3) return "bl";
  return null;
}

/**
 * Returns the visual value of a finder cell.
 * Classic QR finder = 3×3 outer dark ring + 1×1 dark center, with light mid-edges.
 * Local coords are computed per-finder (each finder behaves the same).
 */
function finderValue(r: number, c: number): boolean {
  const lr = r < 3 ? r : r - (QR_N - 3);
  const lc = c < 3 ? c : c - (QR_N - 3);
  const isOuter = lr === 0 || lr === 2 || lc === 0 || lc === 2;
  const isCenter = lr === 1 && lc === 1;
  return isOuter || isCenter;
}

/** Build a 7×7 boolean grid from the qrHash (deterministic). */
function qrGrid(hash: string): boolean[][] {
  const seed = hashSeed(hash || "vm-ticket");
  const grid: boolean[][] = Array.from({ length: QR_N }, () =>
    Array<boolean>(QR_N).fill(false),
  );

  for (let r = 0; r < QR_N; r++) {
    for (let c = 0; c < QR_N; c++) {
      if (finderZone(r, c)) {
        grid[r][c] = finderValue(r, c);
      } else {
        // Hash-derived pseudo-random bit per cell
        const bit = (seed >>> ((r * QR_N + c) % 31)) & 1;
        grid[r][c] = bit === 1;
      }
    }
  }
  return grid;
}

function QRPlaceholder({ hash }: { hash: string }) {
  const grid = useMemo(() => qrGrid(hash), [hash]);
  return (
    <div
      className="grid h-[120px] w-[120px] grid-cols-7 grid-rows-7 gap-[2px] rounded-xl bg-white p-2"
      role="img"
      aria-label="QR code"
    >
      {grid.flatMap((row, r) =>
        row.map((dark, c) => (
          <div
            key={`${r}-${c}`}
            className={dark ? "bg-[#09080f]" : "bg-white"}
          />
        )),
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Items that aren't the entry ticket itself (i.e. pre-ordered add-ons). */
function preOrderItems(t: Ticket): OrderItem[] {
  const items = t.order?.items ?? [];
  return items.filter((it) => it.menuItemId !== null && it.menuItemId !== undefined);
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function TicketSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-72 animate-pulse rounded-2xl glass border border-white/10 vibe-skeleton" />
      <div className="h-16 animate-pulse rounded-2xl glass border border-white/10 vibe-skeleton" />
    </div>
  );
}

function EmptyTickets() {
  const setScreen = useAppStore((s) => s.setScreen);
  return (
    <div className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <div className="vibe-float">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl purple-foil glow-violet">
          <TicketIcon className="h-9 w-9 text-purple-bright" />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="font-display text-xl font-bold text-white">
          No tickets yet
        </p>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          Join a party to get your entry QR
        </p>
      </div>
      <button
        onClick={() => setScreen("home")}
        className="press-feedback rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
      >
        Explore parties
      </button>
    </div>
  );
}

function TicketCard({ ticket }: { ticket: Ticket }) {
  const party = ticket.party;
  const addOns = preOrderItems(ticket);
  const sym = party ? currencyForCity(party.city) : "£";
  const setSelectedPartyId = useAppStore((s) => s.setSelectedPartyId);
  const setScreen = useAppStore((s) => s.setScreen);

  const openGroupChat = () => {
    if (!party) return;
    setSelectedPartyId(party.id);
    setScreen("group-chat");
  };

  if (!party) return null;

  const dateLabel = formatDateLabel(party.date);
  const timeLabel = formatTime(party.time);

  return (
    <div className="space-y-3">
      {/* ---- Big QR card ---- */}
      <div className="glass rounded-2xl p-5">
        <div className="flex flex-col items-center text-center">
          <h2 className="font-display text-2xl font-bold leading-tight text-white">
            {party.title}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {dateLabel} · {timeLabel} · {party.area}
          </p>

          {/* QR code */}
          <div className="mt-4">
            <QRPlaceholder hash={ticket.qrHash} />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Scan this QR code at the door
          </p>

          {/* Pre-order amber pills */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {addOns.length === 0 ? (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted-foreground">
                Entry only
              </span>
            ) : (
              addOns.map((it) => (
                <span
                  key={it.id}
                  className="rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs text-amber-300"
                >
                  {it.emoji} {it.name} × {it.quantity}
                </span>
              ))
            )}
          </div>

          <p className="mt-3 text-[10px] text-muted-foreground">
            Pre-orders flagged when scanned · host has them ready
          </p>
        </div>
      </div>

      {/* ---- Guest-list confirmation ---- */}
      <div className="teal-foil flex items-center gap-3 rounded-2xl p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/15">
          <span className="text-teal-300" aria-hidden>
            ✓
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-teal-300">
            You&rsquo;re on the guest list
          </p>
          <p className="text-xs text-muted-foreground">
            Approved by host · spot confirmed
          </p>
        </div>
      </div>

      {/* ---- Your order at the door ---- */}
      {addOns.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <div className="mb-3 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-purple-bright" />
            <h3 className="eyebrow">Your order at the door</h3>
          </div>
          <ul className="space-y-2">
            {addOns.map((it) => (
              <li
                key={it.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="min-w-0 truncate text-white/90">
                  <span className="mr-1.5" aria-hidden>
                    {it.emoji}
                  </span>
                  {it.name} × {it.quantity}
                </span>
                <span className="shrink-0 font-semibold text-primary">
                  {sym}
                  {(it.unitPrice * it.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ---- CTA ---- */}
      <button
        onClick={() => toast.success("Show this to your host 🎟️")}
        className="press-feedback vibe-gradient-bg flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(83,74,183,0.6)] hover:brightness-110"
      >
        <TicketIcon className="h-4 w-4" />
        Ready · show QR to host
      </button>

      {/* ---- Open group chat (active events entry point) ---- */}
      <button
        onClick={openGroupChat}
        className="press-feedback glass flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-white ring-1 ring-purple-500/40 transition hover:bg-purple-500/10 hover:text-purple-200"
      >
        <MessageCircle className="h-4 w-4 text-purple-bright" />
        Open group chat
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function TicketsScreen() {
  const currentUser = useAppStore((s) => s.currentUser);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tickets", currentUser?.id],
    queryFn: () => api.listTickets(currentUser!.id),
    enabled: !!currentUser?.id,
  });

  const tickets = data?.tickets ?? [];

  return (
    <div className="flex h-full flex-col">
      {/* Sticky header — this is a tab destination, no back button */}
      <header className="sticky top-0 z-10 glass-strong px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <span className="eyebrow">My tickets</span>
        <h1 className="mt-1 font-display text-xl font-bold text-white">
          Show QR at the door
        </h1>
      </header>

      {/* Scrollable body */}
      <div className="fancy-scrollbar flex-1 space-y-4 overflow-y-auto p-4 pb-32">
        {isLoading && (
          <>
            <TicketSkeleton />
            <TicketSkeleton />
          </>
        )}

        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl coral-foil">
              <RefreshCw className="h-7 w-7 text-coral-bright" />
            </div>
            <div className="space-y-1">
              <p className="font-display text-lg font-bold text-white">
                Couldn&rsquo;t load tickets
              </p>
              <p className="mx-auto max-w-xs text-sm text-muted-foreground">
                Pull your tickets again — your connection might have dropped.
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="press-feedback rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:brightness-110"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && tickets.length === 0 && <EmptyTickets />}

        {!isLoading &&
          !isError &&
          tickets.length > 0 &&
          tickets.map((t) => <TicketCard key={t.id} ticket={t} />)}
      </div>
    </div>
  );
}
