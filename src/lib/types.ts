// Shared VibeMatch types and constants

export const CITIES = [
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Goa",
  "Pune",
] as const;

export type City = (typeof CITIES)[number];

export const VIBE_TAGS = [
  "Techno",
  "Bollywood",
  "BYOB",
  "Boardgames",
  "Lo-fi",
  "Chill",
  "EDM",
  "Retro",
] as const;

export type VibeTag = (typeof VIBE_TAGS)[number];

export const VIBE_EMOJI: Record<string, string> = {
  Techno: "🎧",
  Bollywood: "🎬",
  BYOB: "🍾",
  Boardgames: "🎲",
  "Lo-fi": "🌙",
  Chill: "🧊",
  EDM: "⚡",
  Retro: "📼",
};

// Vibe tag colors — Gen Z neon palette. Each tag gets its own neon hue so the
// feed reads like a colorful sticker pack: cyan techno, magenta EDM, violet
// lo-fi, lime boardgames, coral Bollywood, amber BYOB, sky chill, rose retro.
export const VIBE_COLORS: Record<string, string> = {
  Techno: "from-cyan-500/30 to-blue-600/20 text-cyan-200 border-cyan-400/50",
  Bollywood: "from-orange-500/30 to-rose-600/20 text-orange-200 border-orange-400/50",
  BYOB: "from-amber-400/30 to-yellow-600/20 text-amber-100 border-amber-300/50",
  Boardgames: "from-lime-400/30 to-green-600/20 text-lime-100 border-lime-300/50",
  "Lo-fi": "from-violet-500/30 to-purple-700/20 text-violet-200 border-violet-400/50",
  Chill: "from-sky-400/30 to-cyan-600/20 text-sky-100 border-sky-300/50",
  EDM: "from-pink-500/30 to-fuchsia-700/20 text-pink-200 border-pink-400/50",
  Retro: "from-rose-500/30 to-pink-700/20 text-rose-200 border-rose-400/50",
};

export interface Party {
  id: string;
  title: string;
  city: string;
  area: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  fee: number;
  maxGuests: number;
  vibes: string; // comma separated
  description: string;
  hostName: string;
  hostId?: string | null;
  coverUrl?: string | null;
  lat?: number | null;
  lng?: number | null;
  guestCount: number;
  createdAt: string;
}

export interface PartyCreateInput {
  title: string;
  city: string;
  area: string;
  date: string;
  time: string;
  fee: number;
  maxGuests: number;
  vibes: string[];
  description: string;
  hostName: string;
  coverUrl?: string;
  lat?: number;
  lng?: number;
}

export interface JoinRequest {
  id: string;
  partyId: string;
  requesterName: string;
  introMessage: string;
  status: "pending" | "accepted" | "rejected";
  requesterId?: string | null;
  createdAt: string;
}

export interface JoinRequestInput {
  partyId: string;
  requesterName: string;
  introMessage: string;
}

export interface VibeUser {
  id: string;
  name: string;
  username?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  city?: string | null;
  instagram?: string | null;
  vibePrefs?: string; // comma-separated vibe tag prefs (from onboarding)
  vibes: number;
  hosted: number;
  rating: number;
  ratingCount: number;
}

export interface ChatThread {
  id: string;
  userAId: string;
  userBId: string;
  partyId?: string | null;
  createdAt: string;
  updatedAt: string;
  // joined for UI convenience
  otherUser?: VibeUser;
  lastMessage?: ChatMessage;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// Party review — submitted by guests after attending
export interface PartyReview {
  id: string;
  partyId: string;
  userId: string;
  rating: number; // 1..5
  comment: string;
  createdAt: string;
  // joined for UI
  user?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

// Host analytics summary
export interface HostAnalytics {
  hostId: string;
  totalViews: number;
  partyCount: number;
  totalGuests: number;
  totalCapacity: number;
  totalRequests: number;
  acceptedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  acceptanceRate: number; // 0..100
  avgRating: number; // 0..5
  reviewCount: number;
  topParties: {
    partyId: string;
    title: string;
    views: number;
    requests: number;
    guests: number;
    capacity: number;
  }[];
}

// Map cluster summary — for the map view
export interface PartyCluster {
  city: string;
  count: number;
  parties: Party[];
}

export type Screen =
  | "login"
  | "onboarding"
  | "home"
  | "create"
  | "detail"
  | "inbox"
  | "chat"
  | "profile"
  | "edit-profile"
  | "my-parties"
  | "requests"
  | "saved"
  | "map";

export function parseVibes(vibes: string): string[] {
  if (!vibes) return [];
  return vibes
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function formatFee(fee: number): string {
  if (fee === 0) return "Free";
  return `₹${fee}`;
}

export function formatDateLabel(date: string): string {
  // date: yyyy-mm-dd
  const d = new Date(date + "T00:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  // time: HH:mm (24h) -> 9:30 PM
  const [hStr, m] = time.split(":");
  const h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m} ${ampm}`;
}

export function relativeTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function slotsLeft(maxGuests: number, guestCount: number): number {
  return Math.max(0, maxGuests - guestCount);
}

// Status of a party relative to now: live / upcoming / today / past
export type PartyLiveStatus = "live" | "starting-soon" | "today" | "upcoming" | "past";

export function partyLiveStatus(date: string, time: string, durationHours = 4): PartyLiveStatus {
  // date: yyyy-mm-dd, time: HH:mm
  const start = new Date(`${date}T${time || "00:00"}:00`);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  const now = new Date();

  const d = new Date(date + "T00:00:00");
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dayDiff = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (now >= start && now <= end) return "live";
  if (dayDiff < 0 || now > end) return "past";
  if (dayDiff === 0) {
    // today: starting soon if within 2h
    const msToStart = start.getTime() - now.getTime();
    if (msToStart > 0 && msToStart <= 2 * 3_600_000) return "starting-soon";
    return "today";
  }
  return "upcoming";
}

// Returns a humanized countdown string e.g. "in 2h 15m", "starts in 3d", "Live now"
export function countdownTo(date: string, time: string, durationHours = 4): string {
  const start = new Date(`${date}T${time || "00:00"}:00`);
  const end = new Date(start.getTime() + durationHours * 3_600_000);
  const now = new Date();

  if (now >= start && now <= end) return "Live now";
  if (now > end) return "Ended";

  const ms = start.getTime() - now.getTime();
  const totalMin = Math.floor(ms / 60_000);
  const days = Math.floor(totalMin / (60 * 24));
  const hours = Math.floor((totalMin % (60 * 24)) / 60);
  const mins = totalMin % 60;

  if (days > 0) return `in ${days}d ${hours}h`;
  if (hours > 0) return `in ${hours}h ${mins}m`;
  if (mins > 0) return `in ${mins}m`;
  return "starting";
}

// Map a city name to approximate lat/lng for the stylized map view.
export const CITY_COORDS: Record<string, { x: number; y: number }> = {
  Delhi: { x: 0.42, y: 0.28 },
  Mumbai: { x: 0.22, y: 0.62 },
  Bangalore: { x: 0.36, y: 0.85 },
  Goa: { x: 0.18, y: 0.78 },
  Pune: { x: 0.26, y: 0.68 },
};

// Deterministic small jitter per party id so pins don't perfectly overlap
export function partyPinOffset(seed: string, city: string): { x: number; y: number } {
  const base = CITY_COORDS[city] || { x: 0.5, y: 0.5 };
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const jx = ((h % 60) - 30) / 600; // -0.05..+0.05
  const jy = (((h >> 4) % 60) - 30) / 600;
  return { x: base.x + jx, y: base.y + jy };
}

// Demo guest avatars used for the "who's going" social-proof stack.
// In production this would come from RSVP records.
export const GUEST_AVATARS = [
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=80&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=80&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=80&q=80&auto=format&fit=crop",
];

export function pickGuestAvatars(seed: string, count: number): string[] {
  // deterministic pick based on seed string
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const out: string[] = [];
  for (let i = 0; i < Math.min(count, GUEST_AVATARS.length); i++) {
    out.push(GUEST_AVATARS[(h + i * 7) % GUEST_AVATARS.length]);
  }
  return out;
}


// ===== Geographic helpers for the local map view =====

// Real lat/lng centers for each city — used to default the user's location
// when geolocation is unavailable, and to seed parties with coords.
export const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  Delhi: { lat: 28.6139, lng: 77.209 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bangalore: { lat: 12.9716, lng: 77.5946 },
  Goa: { lat: 15.2993, lng: 74.124 },
  Pune: { lat: 18.5204, lng: 73.8567 },
};

// Haversine distance in kilometres between two lat/lng points.
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371; // earth radius, km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Project a lat/lng to viewport pixels relative to a center point using
// an equirectangular approximation (good enough for a few-km view).
// Returns {x, y} in pixels where (0,0) is the center; y is inverted so
// north = up.
export function projectLatLng(
  point: { lat: number; lng: number },
  center: { lat: number; lng: number },
  pixelsPerKm: number,
): { x: number; y: number } {
  const dxKm = haversineKm(
    { lat: center.lat, lng: center.lng },
    { lat: center.lat, lng: point.lng },
  ) * (point.lng < center.lng ? -1 : 1);
  const dyKm = haversineKm(
    { lat: center.lat, lng: center.lng },
    { lat: point.lat, lng: center.lng },
  ) * (point.lat < center.lat ? 1 : -1);
  return { x: dxKm * pixelsPerKm, y: dyKm * pixelsPerKm };
}

// ===== "Fun score" — drives the animation intensity on map pins =====
// 0..100. Combines crowd fill, vibe variety, live status, and free entry.

export type FunTier = "low" | "warm" | "lively" | "lit";

export function funScore(p: {
  guestCount: number;
  maxGuests: number;
  vibes: string;
  date: string;
  time: string;
  fee: number;
}): number {
  const fillRatio =
    p.maxGuests > 0 ? Math.min(1, p.guestCount / p.maxGuests) : 0;
  const crowd = fillRatio * 50; // 0..50 — a packed house is half the score
  const vibeCount = parseVibes(p.vibes).length;
  const vibeScore = Math.min(20, vibeCount * 5); // 0..20 — variety matters
  const status = partyLiveStatus(p.date, p.time);
  const liveBonus =
    status === "live"
      ? 25
      : status === "starting-soon"
        ? 18
        : status === "today"
          ? 10
          : 0;
  const freeBonus = p.fee === 0 ? 5 : 0;
  return Math.round(crowd + vibeScore + liveBonus + freeBonus);
}

export function funTier(score: number): FunTier {
  if (score >= 80) return "lit";
  if (score >= 60) return "lively";
  if (score >= 35) return "warm";
  return "low";
}

// Tier metadata for the map pin animation — each tier is a distinct Gen Z neon.
//   low    → cyan     (chill / low-key)
//   warm   → violet   (warming up)
//   lively → hot pink (lively)
//   lit    → lime+coral (absolutely lit 🔥)
export const FUN_TIER_META: Record<
  FunTier,
  {
    label: string;
    ringClass: string;
    animClass: string;
    glowClass: string;
    dotClass: string;
    textClass: string;
    chipClass: string;
    sparkClass: string;
  }
> = {
  low: {
    label: "Low-key",
    ringClass: "border-cyan-400/60",
    animClass: "fun-breathe",
    glowClass: "shadow-[0_0_14px_-3px_rgba(0,240,255,0.65)]",
    dotClass: "bg-cyan-400",
    textClass: "text-cyan-200",
    chipClass: "bg-cyan-500/15 text-cyan-200 border-cyan-400/40",
    sparkClass: "bg-cyan-300",
  },
  warm: {
    label: "Warming up",
    ringClass: "border-violet-400/70",
    animClass: "fun-pulse",
    glowClass: "shadow-[0_0_18px_-3px_rgba(157,78,221,0.75)]",
    dotClass: "bg-violet-400",
    textClass: "text-violet-200",
    chipClass: "bg-violet-500/15 text-violet-200 border-violet-400/40",
    sparkClass: "bg-violet-300",
  },
  lively: {
    label: "Lively",
    ringClass: "border-pink-400/75",
    animClass: "fun-bounce",
    glowClass: "shadow-[0_0_22px_-3px_rgba(255,46,151,0.85)]",
    dotClass: "bg-pink-400",
    textClass: "text-pink-200",
    chipClass: "bg-pink-500/15 text-pink-200 border-pink-400/45",
    sparkClass: "bg-pink-300",
  },
  lit: {
    label: "Lit 🔥",
    ringClass: "border-lime-300/80",
    animClass: "fun-lit",
    glowClass: "shadow-[0_0_26px_-2px_rgba(199,255,0,0.95)]",
    dotClass: "bg-lime-300",
    textClass: "text-lime-200",
    chipClass: "bg-lime-400/15 text-lime-100 border-lime-300/50",
    sparkClass: "bg-orange-400",
  },
};

// Pick a deterministic small offset within a city for parties without
// explicit lat/lng. Uses the area name + id as the seed so the same party
// always lands at the same spot.
export function partyGeoFallback(
  seed: string,
  city: string,
): { lat: number; lng: number } {
  const center = CITY_CENTERS[city] ?? { lat: 28.6139, lng: 77.209 };
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  // ±0.04 degrees ≈ ±4.4 km — keeps fallback pins inside the city
  const dLat = ((h % 800) - 400) / 10000; // -0.04..+0.04
  const dLng = (((h >> 8) % 800) - 400) / 10000;
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

// Resolve a party's coordinates — uses stored lat/lng if present, else fallback.
export function partyCoords(p: {
  lat?: number | null;
  lng?: number | null;
  id: string;
  city: string;
}): { lat: number; lng: number } {
  if (typeof p.lat === "number" && typeof p.lng === "number") {
    return { lat: p.lat, lng: p.lng };
  }
  return partyGeoFallback(p.id, p.city);
}
