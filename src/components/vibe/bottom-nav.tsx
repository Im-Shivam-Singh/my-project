"use client";

import { Compass, MessageCircle, Plus, User, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import type { Screen } from "@/lib/types";

interface NavItem {
  screen: Screen;
  label: string;
  icon: typeof Compass;
}

const NAV_ITEMS: NavItem[] = [
  { screen: "home", label: "Explore", icon: Compass },
  { screen: "inbox", label: "Inbox", icon: MessageCircle },
  { screen: "tickets", label: "Tickets", icon: Ticket },
  { screen: "profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const screen = useAppStore((s) => s.screen);
  const setScreen = useAppStore((s) => s.setScreen);
  const openCreate = useAppStore((s) => s.openCreate);

  // hide bottom nav on login + onboarding
  if (screen === "login" || screen === "onboarding") return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] items-end justify-around px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
      aria-label="Primary"
    >
      {/* Glass shell with purple top edge */}
      <div className="pointer-events-none absolute inset-x-3 bottom-2 top-0 -z-10 rounded-3xl glass-strong shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-purple-500/80" />
      </div>

      {/* Explore (position 1) */}
      <NavButton
        item={NAV_ITEMS[0]}
        active={
          screen === "home" ||
          screen === "detail" ||
          screen === "filter" ||
          screen === "map" ||
          screen === "saved"
        }
        onClick={() => setScreen("home")}
      />

      {/* Inbox (position 2) — with coral unread dot */}
      <NavButton
        item={NAV_ITEMS[1]}
        active={screen === "inbox" || screen === "chat"}
        onClick={() => setScreen("inbox")}
        showUnreadDot
      />

      {/* Floating Action Button — solid purple disc (position 3, center) */}
      <button
        onClick={openCreate}
        aria-label="Launch a vibe"
        className="relative -mt-8 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-purple-500 text-purple-foreground ring-4 ring-background transition-transform active:scale-90 hover:scale-105 glow-violet"
      >
        <Plus className="relative h-7 w-7 text-white" strokeWidth={2.75} />
      </button>

      {/* Tickets (position 4) */}
      <NavButton
        item={NAV_ITEMS[2]}
        active={
          screen === "tickets" ||
          screen === "payment" ||
          screen === "confirmation" ||
          screen === "countdown"
        }
        onClick={() => setScreen("tickets")}
      />

      {/* Profile (position 5) */}
      <NavButton
        item={NAV_ITEMS[3]}
        active={
          screen === "profile" ||
          screen === "edit-profile" ||
          screen === "my-parties" ||
          screen === "host-dashboard" ||
          screen === "admin" ||
          screen === "requests"
        }
        onClick={() => setScreen("profile")}
      />
    </nav>
  );
}

function NavButton({
  item,
  active,
  onClick,
  showUnreadDot,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
  showUnreadDot?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
        active ? "text-purple-300" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all",
          active ? "bg-purple-500/15" : "group-hover:bg-white/5",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
        {showUnreadDot && (
          <span
            aria-hidden
            className="absolute right-1 top-1 h-2 w-2 rounded-full bg-coral-500 ring-2 ring-background"
          />
        )}
        {active && (
          <span
            aria-hidden
            className="absolute -bottom-[7px] left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-purple-400"
          />
        )}
      </span>
      {item.label}
    </button>
  );
}
