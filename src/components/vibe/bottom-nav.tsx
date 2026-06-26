"use client";

import { Compass, MessageCircle, Plus, User } from "lucide-react";
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
  { screen: "profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const screen = useAppStore((s) => s.screen);
  const setScreen = useAppStore((s) => s.setScreen);
  const openCreate = useAppStore((s) => s.openCreate);

  // hide bottom nav on login
  if (screen === "login") return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-[480px] items-end justify-around px-4 pb-[max(env(safe-area-inset-bottom),12px)] pt-2"
      aria-label="Primary"
    >
      {/* Glass shell with solid yellow top edge */}
      <div className="pointer-events-none absolute inset-x-3 bottom-2 top-0 -z-10 rounded-3xl glass-strong shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.75)]">
        <div className="absolute inset-x-0 top-0 h-px rounded-t-3xl bg-yellow-400 opacity-90" />
      </div>

      {/* Explore */}
      <NavButton
        item={NAV_ITEMS[0]}
        active={screen === "home" || screen === "detail" || screen === "map" || screen === "saved"}
        onClick={() => setScreen("home")}
      />

      {/* Inbox with FAB gap */}
      <NavButton
        item={NAV_ITEMS[1]}
        active={screen === "inbox" || screen === "chat"}
        onClick={() => setScreen("inbox")}
      />

      {/* Floating Action Button — solid yellow disc */}
      <button
        onClick={openCreate}
        aria-label="Launch a vibe"
        className="relative -mt-8 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-black ring-4 ring-background transition-transform active:scale-90 active:vibe-pulse hover:scale-105"
      >
        <Plus className="relative h-7 w-7 text-black" strokeWidth={2.75} />
      </button>

      {/* Profile (right of FAB) */}
      <NavButton
        item={NAV_ITEMS[2]}
        active={
          screen === "profile" ||
          screen === "edit-profile" ||
          screen === "my-parties" ||
          screen === "requests"
        }
        onClick={() => setScreen("profile")}
      />

      {/* spacer to balance the 5-slot visual rhythm */}
      <div className="w-8" aria-hidden />
    </nav>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
        active ? "text-yellow-400" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all",
          active
            ? "bg-yellow-400/15"
            : "group-hover:bg-white/5",
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
        {active && (
          <>
            {/* solid yellow dot under the icon */}
            <span
              aria-hidden
              className="absolute -bottom-[7px] left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-yellow-400"
            />
          </>
        )}
      </span>
      {item.label}
    </button>
  );
}
