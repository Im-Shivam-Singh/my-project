"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Settings,
  Pencil,
  Flame,
  Sparkles,
  Star,
  ChevronRight,
  CalendarDays,
  Inbox as InboxIcon,
  Heart,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Moon,
  Globe,
  Crown,
  Trophy,
  Zap,
  Award,
  Rocket,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { UserAvatar } from "@/components/vibe/user-avatar";
import { RatingPill } from "@/components/vibe/rating-pill";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function ProfileScreen() {
  const currentUser = useAppStore((s) => s.currentUser);
  const setScreen = useAppStore((s) => s.setScreen);
  const logout = useAppStore((s) => s.logout);
  const savedCount = useAppStore((s) => s.savedPartyIds.length);

  const { data } = useQuery({
    queryKey: ["user", currentUser?.id],
    queryFn: () => api.getUser({ id: currentUser!.id }),
    enabled: !!currentUser,
  });

  const user = data?.user ?? currentUser;

  if (!user) return null;

  const vibeScore = Math.min(999, user.vibes + user.hosted * 10);
  const tiers = [
    { name: "Rookie", min: 0, icon: Rocket, color: "from-slate-400 to-slate-500" },
    { name: "Riser", min: 50, icon: Zap, color: "from-cyan-400 to-blue-500" },
    { name: "Vibe", min: 150, icon: Sparkles, color: "from-violet-400 to-purple-500" },
    { name: "Legend", min: 400, icon: Crown, color: "from-amber-400 to-pink-500" },
  ];
  const currentTier = [...tiers].reverse().find((t) => vibeScore >= t.min) || tiers[0];
  const nextTier = tiers.find((t) => t.min > vibeScore);
  const tierProgress = nextTier
    ? Math.round(
        ((vibeScore - currentTier.min) / (nextTier.min - currentTier.min)) * 100,
      )
    : 100;

  const achievements = [
    {
      icon: Rocket,
      label: "First Steps",
      desc: "Joined VibeMatch",
      unlocked: true,
      color: "text-cyan-400",
    },
    {
      icon: Heart,
      label: "Curator",
      desc: "Saved 3+ parties",
      unlocked: savedCount >= 3,
      color: "text-rose-400",
    },
    {
      icon: Flame,
      label: "Host",
      desc: "Hosted a party",
      unlocked: user.hosted >= 1,
      color: "text-amber-400",
    },
    {
      icon: Star,
      label: "Rising Star",
      desc: "Reach 100 vibes",
      unlocked: user.vibes >= 100,
      color: "text-violet-400",
    },
    {
      icon: Award,
      label: "Social Butterfly",
      desc: "5+ conversations",
      unlocked: false,
      color: "text-pink-400",
    },
    {
      icon: Crown,
      label: "Legend",
      desc: "Reach 400 vibe score",
      unlocked: vibeScore >= 400,
      color: "text-amber-300",
    },
  ];

  return (
    <div className="flex h-full flex-col animate-screen-in">
      <header className="sticky top-0 z-20 flex items-center justify-between glass-strong border-b border-border/60 px-4 py-3 pt-[max(env(safe-area-inset-top),12px)]">
        <h1 className="font-display text-xl font-bold">
          <span className="vibe-gradient-text">Profile</span>
        </h1>
        <button
          onClick={() => toast.info("Settings coming soon")}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-violet/10 hover:text-violet"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <div className="fancy-scrollbar flex-1 overflow-y-auto px-4 pb-6">
        {/* Hero */}
        <section className="relative mt-4 overflow-hidden rounded-3xl glass-strong vibe-gradient-border p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 vibe-gradient-bg opacity-30" />
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink/30 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-cyan/25 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <span className="relative block rounded-full">
              <span className="absolute -inset-1 rounded-full vibe-gradient-bg opacity-80 blur-[2px]" />
              <span className="relative block rounded-full ring-2 ring-background">
                <UserAvatar name={user.name} src={user.avatarUrl} size={72} />
              </span>
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-xl font-bold truncate">
                  {user.name}
                </h2>
                <Crown className="h-4 w-4 text-sunshine text-glow-acid" />
              </div>
              <p className="truncate text-sm font-medium text-cyan/90">
                @{user.username || "viber"} · {user.city || "India"}
              </p>
              <div className="mt-1.5">
                <RatingPill rating={user.rating} count={user.ratingCount} />
              </div>
            </div>
          </div>
          {user.bio && (
            <p className="relative mt-4 rounded-2xl glass px-3 py-2 text-sm text-foreground/90">{user.bio}</p>
          )}
          <button
            onClick={() => setScreen("edit-profile")}
            className="relative mt-4 inline-flex h-10 items-center gap-1.5 rounded-full vibe-gradient-bg px-4 text-sm font-semibold text-white glow-pink transition active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit profile
          </button>
        </section>

        {/* Stats */}
        <section className="mt-4 grid grid-cols-3 gap-3">
          <Stat icon={<Sparkles className="h-4 w-4 text-pink" />} label="Vibes" value={user.vibes} accent="pink" delay={0} />
          <Stat icon={<Flame className="h-4 w-4 text-coral" />} label="Hosted" value={user.hosted} accent="violet" delay={60} />
          <Stat icon={<Star className="h-4 w-4 text-cyan" />} label="Rating" value={user.rating.toFixed(1)} accent="cyan" delay={120} />
        </section>

        {/* Vibe score card with tier + progress */}
        <section className="mt-4 overflow-hidden rounded-3xl glass-strong vibe-gradient-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-cyan/80">
                Vibe score
              </p>
              <p className="font-display text-3xl font-extrabold">
                <span className="vibe-gradient-text">{vibeScore}</span>
              </p>
            </div>
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg",
                currentTier.color,
              )}
            >
              <currentTier.icon className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Tier + progress */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">
                {currentTier.name} tier
              </span>
              {nextTier ? (
                <span className="text-muted-foreground">
                  {nextTier.min - vibeScore} to {nextTier.name}
                </span>
              ) : (
                <span className="font-semibold text-sunshine text-glow-acid">Max tier reached 👑</span>
              )}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary/60 ring-1 ring-border/40">
              <div
                className="h-full rounded-full vibe-gradient-bg transition-all duration-700"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Host parties & get vibes from guests to climb the leaderboard.
          </p>
        </section>

        {/* Achievements / badges */}
        <section className="mt-4">
          <h3 className="mb-2 flex items-center gap-1.5 px-1 text-[11px] uppercase tracking-[0.2em] text-cyan/80">
            <Trophy className="h-3.5 w-3.5 text-sunshine" /> Achievements
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {achievements.map((a) => (
              <div
                key={a.label}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition glass",
                  a.unlocked
                    ? "border-border/60 vibe-gradient-border"
                    : "border-border/40 bg-card/20 opacity-50 grayscale",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    a.unlocked ? "bg-white/5" : "bg-white/5",
                  )}
                >
                  <a.icon className={cn("h-5 w-5", a.unlocked ? a.color : "text-muted-foreground")} />
                </div>
                <p className="text-[10px] font-semibold leading-tight">{a.label}</p>
                <p className="text-[9px] leading-tight text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Activity */}
        <section className="mt-6">
          <h3 className="mb-2 px-1 text-[11px] uppercase tracking-[0.2em] text-cyan/80">
            Activity
          </h3>
          <div className="overflow-hidden rounded-2xl glass-strong vibe-gradient-border">
            <Row
              icon={<Flame className="h-4 w-4 text-coral" />}
              label="My parties"
              sub={`${user.hosted} hosted`}
              onClick={() => setScreen("my-parties")}
            />
            <Row
              icon={<InboxIcon className="h-4 w-4 text-pink" />}
              label="Requests received"
              sub="Review join requests"
              onClick={() => setScreen("requests")}
            />
            <Row
              icon={<CalendarDays className="h-4 w-4 text-cyan" />}
              label="My RSVPs"
              sub="Parties you're going to"
              onClick={() => toast.info("RSVPs coming soon")}
            />
            <Row
              icon={<Heart className="h-4 w-4 text-rose-400" />}
              label="Saved parties"
              sub={`${savedCount} saved`}
              onClick={() => setScreen("saved")}
              last
            />
          </div>
        </section>

        {/* Settings */}
        <section className="mt-6">
          <h3 className="mb-2 px-1 text-[11px] uppercase tracking-[0.2em] text-cyan/80">
            Settings
          </h3>
          <div className="overflow-hidden rounded-2xl glass-strong vibe-gradient-border">
            <Row
              icon={<Bell className="h-4 w-4 text-violet" />}
              label="Notifications"
              onClick={() => toast.info("Notifications coming soon")}
            />
            <Row
              icon={<Moon className="h-4 w-4 text-indigo-300" />}
              label="Appearance"
              sub="Dark mode"
              onClick={() => toast.info("Always dark here ✨")}
            />
            <Row
              icon={<Globe className="h-4 w-4 text-cyan" />}
              label="Language"
              sub="English"
              onClick={() => toast.info("More languages coming soon")}
            />
            <Row
              icon={<Shield className="h-4 w-4 text-emerald-400" />}
              label="Privacy & safety"
              onClick={() => toast.info("Privacy settings coming soon")}
            />
            <Row
              icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />}
              label="Help & support"
              onClick={() => toast.info("Help center coming soon")}
              last
            />
          </div>
        </section>

        {/* Logout */}
        <button
          onClick={() => {
            logout();
            toast.success("Signed out. See you on the dancefloor 💃");
          }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 py-3 text-sm font-medium text-rose-300 transition hover:bg-rose-500/20 hover:border-rose-500/60"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          VibeMatch v1.0 · Made with 💜 in India
        </p>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  accent = "pink",
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "pink" | "violet" | "cyan";
  delay?: number;
}) {
  const accentRing =
    accent === "pink"
      ? "ring-pink/40 hover:glow-pink"
      : accent === "violet"
        ? "ring-violet/40 hover:glow-violet"
        : "ring-cyan/40 hover:glow-cyan";
  return (
    <div
      className={cn(
        "animate-pop-in rounded-2xl glass-strong p-3 text-center ring-1 transition",
        accentRing,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-center">{icon}</div>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({
  icon,
  label,
  sub,
  onClick,
  last,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-white/5",
        !last && "border-b border-border/40",
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-border/40">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {sub && <p className="truncate text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}
