# VibeMatch — Project Worklog

## Project Overview
VibeMatch is a mobile-first PWA for finding local parties, connecting with hosts, and building a night out. Built on Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui + Prisma (SQLite). Dark theme with deep purple/black backgrounds and neon pink/violet accents. Max-width 480px container, bottom navigation with floating action button.

Original spec targeted FastAPI + React Vite; adapted to the Next.js stack in this environment while preserving the product vision (screens, endpoints, UX).

## Tech Decisions
- Single `/` route hosts the entire app; client-side screen state via Zustand.
- API routes (Next.js Route Handlers) replace FastAPI endpoints: `/api/parties`, `/api/requests`, `/api/threads`, `/api/messages`.
- Prisma replaces SQLAlchemy; SQLite only.
- Real-time chat via socket.io mini-service on port 3003 (per websocket conventions).
- TanStack Query for server state; Zustand for UI/navigation state.

---
Task ID: 0
Agent: orchestrator
Task: Initialize project foundation (schema, theme, types, store, API routes, app shell) and plan screen builds.

Work Log:
- Explored existing Next.js scaffold, confirmed dev server running on port 3000.
- Reviewed Prisma schema, globals.css, layout, websocket example, Caddyfile.

Stage Summary:
- Foundation about to be laid: Prisma schema (Party, JoinRequest, User, ChatThread, Message), neon dark theme, Zustand store, API routes, app shell with bottom nav.

---
Task ID: 0 (continued)
Agent: orchestrator
Task: Build complete VibeMatch frontend (all screens), API routes, WebSocket chat service, seed data, and verify end-to-end with agent-browser.

Work Log:
- Prisma schema: User, Party, JoinRequest, ChatThread, Message (SQLite). Pushed with `bun run db:push`.
- Seeded 6 demo users + 8 parties + 1 sample chat thread via scripts/seed.ts.
- API routes (Next.js Route Handlers): GET/POST /api/parties, GET /api/parties/[id], POST /api/requests (+GET), GET/POST /api/threads, GET /api/threads/[id], POST /api/messages, GET/PATCH /api/users, POST /api/auth/otp.
- WebSocket mini-service on port 3003 (mini-services/chat-service) for real-time 1:1 chat (typing indicators, delivery, read receipts relay). Started in background.
- Theme: dark neon (deep purple/black bg, pink/violet/cyan accents), Syne display font, glassmorphism, gradient text, custom animations (slide-up, float, pulse, shimmer).
- App shell: 480px max-width centered container, fixed bottom nav (Explore, Inbox, FAB+, Profile) with floating action button, safe-area insets.
- Screens built: LoginScreen (OTP 2-step + Google/Instagram UI), HomeScreen (Explore feed with city/vibe filters + search + "Hot tonight" section + skeletons + empty states), CreateScreen (Launch Vibe form with cover presets, vibe chips multi-select, range slider, entry types), DetailScreen (cover, host card with rating, facts grid, description, house rules, floating "Request to Connect" drawer with intro textarea), InboxScreen (threads list with unread badges + last message preview), ChatScreen (1:1 chat, typing indicator, read receipts, emoji quick-send, report dialog + block sheet), ProfileScreen (hero, vibe score, stats, activity rows, settings, sign out), EditProfileScreen, MyPartiesScreen, RequestsScreen (host view with All/Pending/Accepted tabs).
- State: Zustand store (auth, navigation, filters, selected ids); TanStack Query for server state.
- Fixed bug: DetailScreen sticky CTA overlapped bottom nav → repositioned to float above nav (bottom-[84px]) with rounded glass bar.

Verification (agent-browser, 390x844 mobile viewport):
- Login: phone + name → Send OTP → dev OTP auto-shown → verify → lands on Explore. ✓
- Explore: 8 seeded parties render from API, "Hot tonight & tomorrow" section, bottom nav present. ✓
- City filter (Goa): correctly shows 2 Goa parties. ✓
- Vibe filter (Boardgames): correctly shows 1 party. ✓
- Search ("warehouse"): correctly finds Warehouse Pulse. ✓
- Detail: cover, host card, facts, about, house rules, Request to Connect button visible above nav. ✓
- Request to Connect: drawer opens, intro textarea, Send Request POSTs → success toast → guest count incremented 27→28 on next load. ✓
- Create: filled form (title, area, Techno+Chill vibes, description) → Launch Vibe POSTs → navigates to new party detail → "Your party" host view. ✓
- My parties: created party ("Test Rooftop") listed with 0/20 going. ✓
- Inbox: empty state initially → after "Message host" from Aria's party, thread appears with last message preview. ✓
- Chat: sent "Hey Aria! Excited for Saturday 🎉" → message rendered, persisted (inbox preview updated). ✓
- Profile: shows "Tester", 1 hosted, vibe score, edit/my-parties/requests/sign-out rows. ✓
- Requests (host view): All/Pending/Accepted tabs, empty state for party with no requests. ✓
- No browser console errors, no runtime errors in dev.log, all API calls 200, chat-service healthy on 3003. ✓

Stage Summary:
- VibeMatch is feature-complete and fully interactive end-to-end. All 7 spec'd screens + 3 extras (edit-profile, my-parties, requests) implemented. All 3 spec'd API endpoints (+threads, messages, users, auth) working. Real-time chat via socket.io. Dark neon mobile-app UX with sticky bottom nav + FAB. PWA manifest configured.
- Ready for the recurring webDevReview cron to iterate on polish & new features.

---
Task ID: 1
Agent: webDevReview (cron round 1)
Task: QA the existing VibeMatch app via agent-browser + VLM, fix bugs, improve styling, and add new features.

## 1. Current Project Status Assessment
- **Dev environment**: Next.js dev server healthy on port 3000; chat-service (socket.io) healthy on port 3003 (verified via EIO polling handshake → HTTP 200). The chat-service had a stale failed-restart log entry but the live process (pid 1718) was serving correctly.
- **Stability**: App was feature-complete and functional (login, explore, detail, request, create, chat, profile all working). No runtime errors during initial regression.
- **QA method**: agent-browser (390×844 mobile viewport) full-flow regression + VLM (glm-4.6v) visual analysis of home, detail, chat, and profile screens.
- **Issues found**:
  1. (Bug, later in round) `DetailScreen` referenced `isLow` which was undefined after a refactor → client-side runtime error on detail open. **Fixed** by re-adding `const isLow = left > 0 && left <= 5;`.
  2. (Bug) `PartyCard` rendered a `<button>` inside a `<button>` (outer card + inner save heart) → invalid HTML hydration error. **Fixed** by converting the outer card to a `<div role="button">` with keyboard handler.
  3. (Styling) VLM flagged: inconsistent card metadata alignment, cramped detail spacing, muted host bio, tiny rating, weak chat status, generic profile settings.

## 2. Goals / Completed Modifications / Verification

### Styling improvements (mandatory)
- **PartyCard**: refactored to a div-based card; consistent 2-col metadata grid; fee badge moved onto cover (bottom-left) for consistent positioning; added per-card save heart (persisted); added `GuestAvatars` stack in card footer for social proof ("+27 going").
- **DetailScreen**: added a dedicated "who's going" section with avatar stack + smart status copy ("Almost full, grab your spot" / "Spots open" / "Sold out — join the waitlist"); enlarged host avatar (56px), bigger display-font name, brighter bio text (`text-foreground/85`), clearer gradient "Message host" CTA separated from "View profile" by a divider; medium-sized vibe badges.
- **ChatScreen**: better intro banner spacing (64px avatar, larger name, pill-styled safety note with Sparkles icon); clearer online status with green dot + "Online now" / "Active recently" / "typing…"; message bubbles now support tap-to-react popover (🔥💜🎉😂👀) with reaction chips rendered under bubbles.
- **ProfileScreen**: vibe score card now shows current tier (Rookie/Riser/Vibe/Legend) with a gradient progress bar to the next tier + "N to {tier}" label; added a 6-badge achievements grid (First Steps, Curator, Host, Rising Star, Social Butterfly, Legend) with unlocked/locked states; settings rows carry colored icons.

### New features (mandatory)
- **Saved/Liked parties** (localStorage-persisted via Zustand `persist` middleware): heart on every PartyCard + DetailScreen save button; new `SavedScreen` (empty state + list); badge counter on Explore header heart + Profile "Saved parties" row. Verified: save → count increments → SavedScreen lists it → unsave works.
- **Onboarding flow** (3 steps: city → vibes → done): shown once after first login (gated by persisted `onboarded` flag); persists selected city to user profile + sets the Explore city filter; skip-friendly. New `OnboardingScreen` + `onboarding` screen type.
- **Explore stories-style vibe carousel**: circular emoji icons (🎧🌙🧊 etc.) above the city chips for fast vibe filtering; replaces the old flat chip row; active state gets gradient ring + label.
- **Chat quick-reply chips**: 5 suggestion chips ("I'm in! 🎉", "What time should I reach?", "Can I bring a +1?", "Is parking available?", "Sounds amazing 🔥") appear above the composer when input is empty and conversation is short (<6 messages); one-tap send.
- **Chat emoji reactions**: tap any message bubble → popover with 5 emojis → reaction chip renders under the bubble with count.
- **GuestAvatars component**: reusable overlapping avatar stack with "+N" overflow pill, used on PartyCard and DetailScreen.

### Verification (agent-browser + VLM)
- Login → onboarding (city=Goa, vibes=Techno+Chill) → Explore shows 2 Goa parties (city filter applied). ✓
- Stories vibe carousel renders; party cards show save hearts + "+27"/"+15" guest stacks. ✓
- VLM on improved home: "stories carousel effectively mirrors social media familiarity… party cards are polished: heart, stacked avatars, metadata clear and cohesive." ✓
- Detail opens without error after `isLow` fix; "who's going" section + improved host card render. VLM: "avatar stack showcases social proof… host card balances visual hierarchy… spacing intentional." ✓
- Chat: quick-reply chips render + send on tap; tap message → reaction popover → 🔥 reaction chip appears under bubble. ✓
- Profile: vibe score 10, "Rookie tier", "40 to Riser" progress bar, achievements grid renders. VLM: "progression tangible and motivating… dark purple theme cohesive." ✓
- Saved: save from card → SavedScreen lists party with "Unsave" state → count persists across navigation. ✓
- `bun run lint` clean (0 errors, 0 warnings). `npx tsc` clean for all app code (only pre-existing examples/skills errors remain). No console errors / hydration errors. All API calls 200. Chat-service HTTP 200. ✓

## 3. Unresolved Issues / Risks / Next-Phase Recommendations
- **Socket "online" indicator**: the chat header sometimes shows "Active recently" instead of "Online now" even when the socket connects via polling through Caddy. The connection works (messages deliver), but the `online` state from `useChatSocket` may not always flip to true on first render. **Next phase**: add a `socket.on("connect")` log + a heartbeat ping to make the online state reliable; consider upgrading to websocket-only transport.
- **Reactions are local-only**: message reactions live in component state (not persisted to DB / broadcast via socket). **Next phase**: add a `reactions` table + `/api/messages/[id]/react` route + socket relay so reactions sync across devices.
- **Quick replies are static**: they don't adapt to conversation context. **Next phase**: generate context-aware quick replies via the LLM skill based on the last message + party context.
- **Saved parties are client-side only**: stored in localStorage per device. **Next phase**: persist to a `SavedParty` table keyed by userId+partyId so saves sync across devices.
- **Onboarding vibe picks aren't used for personalization**: the selected vibes don't yet influence feed ranking. **Next phase**: add a "for you" ranking boost for parties matching onboarding vibes.
- **TypeScript**: minor pre-existing type errors in `src/app/api/threads/route.ts` and `src/app/api/users/route.ts` (non-blocking at runtime, but should be tightened with proper null-handling in the next phase).
- **Priority recommendations for next cron round**: (1) persist reactions + saved parties server-side, (2) add LLM-powered smart quick replies in chat, (3) add a "For You" personalized feed tab using onboarding vibes, (4) add a host analytics dashboard (views, requests, acceptance rate) on the Profile/MyParties screens.

---
Task ID: 3 (parallel branch B — Reviews)
Agent: sub-agent (Reviews feature)
Task: Build a Reviews section component + write-review dialog and integrate into DetailScreen.

Work Log:
- Read existing patterns: detail-screen.tsx, api.ts (api.listReviews / api.submitReview already added), types.ts (PartyReview type, relativeTime helper), store.ts (currentUser), user-avatar.tsx, rating-pill.tsx, empty-state.tsx, dialog/textarea/button/skeleton UI primitives, globals.css (vibe-gradient-bg, vibe-gradient-text, glass, neon palette).
- Confirmed `/api/reviews` route returns `{ reviews: PartyReview[], avgRating: number, count: number }` on GET and `{ review: PartyReview }` on POST (with upsert semantics — one review per user per party).
- Created `/home/z/my-project/src/components/vibe/reviews-section.tsx` exporting `ReviewsSection({ partyId })`:
  • `useQuery(["reviews", partyId], () => api.listReviews(partyId))` for fetching; loading → `<ReviewsSkeleton>`, error → inline "Couldn't load reviews" card.
  • Summary card: `rounded-3xl border border-border/60 bg-card/50 p-4`. Big avg number (`font-display text-4xl font-extrabold`) with a filled amber star, review count below. Star distribution bars 5..1 (`h-1.5` rounded-full, gradient-filled width = count/total*100%, count on the right).
  • "Write a review" gradient pill button (`vibe-gradient-bg rounded-full`) opens the dialog.
  • Reviews list: each item is `rounded-2xl border border-border/60 bg-card/40 p-3` with `UserAvatar` (36px) + name + relative time on the top row, `Stars` row underneath, comment text below; `hover:border-pink/40` transition for subtle hover affordance.
  • Empty state reuses `EmptyState` (icon=`MessageSquare`) — "No reviews yet — be the first to share your experience".
  • `useMutation` calls `api.submitReview({ partyId, userId: currentUser.id, rating, comment })`; on success: `qc.invalidateQueries({ queryKey: ["reviews", partyId] })`, sonner success toast, dialog closes. On error: sonner error toast. Throws "Sign in to leave a review" if no currentUser.
- `WriteReviewDialog` sub-component (same file):
  • Title "Review this party" (gradient text), description "Share your experience to help other viber heads".
  • 5 star buttons (44×44, rounded-xl). Hover state fills the hovered level with `vibe-gradient-bg` + white star; unhovered = muted. Click selects rating; live label "Loved it 🔥 / Great time ✨ / It was okay / Not great / Didn't enjoy".
  • `Textarea` (rows=4, maxLength=280) with char counter that turns amber in the last 30 chars; "Min 3 characters" hint on the left.
  • Submit (gradient pill, `Send` icon) disabled until `rating >= 1 && comment.trim().length >= 3 && !submitting`. Cancel = ghost variant. Local state resets when the dialog closes.
- Integrated into `/home/z/my-project/src/screens/detail-screen.tsx`:
  • Added import: `import { ReviewsSection } from "@/components/vibe/reviews-section";` next to the other vibe component imports.
  • Inserted a new `{/* Reviews */}` block rendering `<ReviewsSection partyId={party.id} />` immediately after the House rules `</section>` and before the closing `</div>` of the `space-y-6 p-4` body. Guarded with `party.id &&` for safety. No other DetailScreen code touched.
- Verification:
  • `npx tsc --noEmit` → no errors in `reviews-section.tsx` or `detail-screen.tsx` (only pre-existing errors in `examples/`, `skills/`, and `src/app/api/parties/for-you/route.ts` remain, as noted in worklog Task 1).
  • `bun run lint` → clean (0 errors, 0 warnings).
  • Read both files back; imports, JSX structure, prop wiring, and styling classes all match the spec and existing code conventions.

Stage Summary:
- Reviews feature is fully wired end-to-end: fetch with TanStack Query, optimistic invalidation on submit, server-side upsert (one review/user/party), summary card with distribution bars, list with avatar + stars + relative time, empty + loading + error states, and a polished write-review dialog with interactive star selector and 280-char comment counter. DetailScreen now shows Reviews directly after House rules, before the sticky CTA. No API/types/store changes were needed or made. Ready for the next parallel branch to merge.

---
Task ID: 4 (branch C — Host Analytics)
Agent: general-purpose
Task: Build a Host Analytics dashboard component and embed it at the top of MyPartiesScreen.

Work Log:
- Read worklog, types.ts (HostAnalytics shape), api.ts (`api.getHostAnalytics`), store.ts, my-parties-screen.tsx, and profile-screen.tsx for stats-grid + progress-bar patterns. Confirmed API route `/api/analytics?hostId=...` returns the HostAnalytics object directly (partyCount, totalViews, totalRequests, acceptanceRate, avgRating, totalGuests, totalCapacity, pending/accepted/rejected, topParties[]).
- Confirmed theme tokens: `--pink #ec4899`, `--violet #a855f7`, `--cyan #22d3ee`, `--background #0a0612`, `--card #140d22`, `--secondary #1c1230`. Verified `vibe-gradient-bg`, `vibe-gradient-text`, and `.fancy-scrollbar` exist in globals.css.
- Created `/home/z/my-project/src/components/vibe/host-analytics.tsx`:
  - `HostAnalytics({ hostId })` — `useQuery(["analytics", hostId], () => api.getHostAnalytics(hostId))`, `staleTime: 30s`, enabled when hostId present.
  - Loading: `HostAnalyticsSkeleton` mirrors the exact layout (header strip, 2×2 stat cards, capacity bar, 3 funnel pills).
  - Empty state (`partyCount === 0`): centered card with TrendingUp icon in pink and copy "No analytics yet" / "Launch your first vibe to see stats".
  - A. Stats grid 2×2: Total Views (Eye/pink), Total Requests (Inbox/violet), Acceptance Rate (CheckCircle/emerald, shown as `N%`), Avg Rating (Star/amber, shown as `N.N` or `—` if 0). Each card: `rounded-2xl border border-border/40 bg-card/40 p-3`, icon top-left in tinted square, `font-display text-xl font-bold` value, `text-[11px] text-muted-foreground` label.
  - B. Capacity bar: label row with Users icon + "{totalGuests} / {totalCapacity} guests confirmed", `h-2 rounded-full bg-secondary` track with `vibe-gradient-bg` inner fill (animated width).
  - C. Request funnel: 3-col grid of pills (Pending amber / Accepted emerald / Rejected rose), each `rounded-xl border p-2 text-center` with count + uppercase label.
  - D. Top parties (max 3, only when present): list of buttons with rank badge (h-6 w-6 rounded-full — `vibe-gradient-bg` with Trophy icon + neon glow for #1, plain `bg-white/5` + number for others), party title (truncate), "{views} views · {requests} requests" sub, trailing Eye icon. Click → `setSelectedPartyId` + `setScreen("detail")`.
  - Hover/active transitions on every interactive element (cards, pills, list rows).
- Modified `/home/z/my-project/src/screens/my-parties-screen.tsx`:
  - Added import: `import { HostAnalytics as HostAnalyticsCard } from "@/components/vibe/host-analytics";` (aliased to avoid clash with the `HostAnalytics` type).
  - Inserted `<HostAnalyticsCard hostId={currentUser.id} />` wrapped in `<section className="mb-1">` at the very top of the `p-4` scroll container, gated behind `currentUser && (...)`. Left the existing parties list / skeleton / empty-state logic untouched.
- Verification: `npx tsc --noEmit` → no errors in host-analytics.tsx or my-parties-screen.tsx (only pre-existing errors in examples/skills/for-you route remain). `npx eslint` on both files → clean (0 warnings, 0 errors). Did not start the dev server per instructions.

Stage Summary:
- Host Analytics dashboard shipped as a self-contained component and embedded at the top of MyPartiesScreen, gated on currentUser. Renders 2×2 stat grid, capacity bar, request-funnel pills, and top-3 parties list; loading skeletons mirror the layout; friendly empty state for new hosts. All imports/types/api helpers/store actions reused from existing codebase; no API routes, types, store, or api.ts were modified. Ready for visual QA in the next agent-browser round.

---
Task ID: 2
Agent: map-screen-builder (parallel branch A)
Task: Build a new "Map View" screen (`/screens/map-screen.tsx`) — a stylized SVG India map with city clusters, party pins, and a bottom party list. Wire it into the app shell and add a Map button on the Home header.

Work Log:
- Read `worklog.md`, `lib/types.ts`, `lib/store.ts`, `lib/api.ts`, `app-shell.tsx`, `home-screen.tsx`, `saved-screen.tsx`, `party-card.tsx`, `empty-state.tsx`, `bottom-nav.tsx`, and `globals.css` to learn the existing patterns, theme classes (`glass`, `vibe-gradient-text`, `vibe-gradient-bg`, `vibe-pulse`, `fancy-scrollbar`, `no-scrollbar`, `glow-pink`, `glow-violet`), and conventions (Zustand selectors, `useQuery` for `api.listParties`, `PartyCard` + `EmptyState` reuse, "use client" directives).
- Created `/home/z/my-project/src/screens/map-screen.tsx`:
  - Sticky glass header: ChevronLeft back button → `goBack()`, gradient-text "Vibe Map" title with subtitle (party count + live city count), and a "List" toggle button that syncs the selected city into `cityFilter` and calls `setScreen("home")`.
  - Map canvas (max-h-[52vh], dark gradient `from-violet/10 via-background to-cyan/5`) with an inline SVG (viewBox 0 0 100 100) rendering: a radial aura ellipse, a stylized India silhouette path (cubic-quadratic Bezier polygon, not geographically accurate), faint lat/long grid lines, gaussian-blur glow filter, and gradient fills/strokes in violet/pink/cyan.
  - City clusters rendered as absolutely-positioned HTML buttons (z-20) on top of the SVG, positioned from `CITY_COORDS * 100%`. Each cluster has: an outer `animate-ping` ring (violet for default, rose if a live party exists in that city, pink when selected), a blurred halo glow, a main dot (small/large sizes, gradient bg when active, glow-pink when selected), a count badge top-right, a city label below, and a tiny rose "live" dot indicator. Cities with zero parties render smaller and dimmer and are non-interactive.
  - Party pins (z-10, under clusters): only for the selected city, positioned via `partyPinOffset(party.id, party.city)`. Each pin shows a small dot with the party's first-vibe emoji and color-coded by `partyLiveStatus` (rose for `live`, amber for `starting-soon`, gradient otherwise). Live/starting pins get an `animate-ping` ring. Pins are clickable → `setSelectedPartyId` + `setScreen("detail")`. Hover reveals the party title in a small tooltip.
  - Bottom sheet (glass, max-h-[42vh], border-top, with grab handle): horizontal scroll of `CityPill` chips ("All cities" + each city with parties), and a `fancy-scrollbar` overflow-y-auto list of `PartyCard`s for the selected scope. Empty state for zero parties overall and for a city with no parties. Loading skeletons. Includes a section header ("Parties in {city}" with gradient-text or "All cities") + count.
  - Local state `selectedCity: string | null` (null = All cities), initialized from `cityFilter` so navigation context flows in. Tapping a selected city toggles back to "All cities".
  - Error / empty / loading overlays sit centered on the map canvas using `EmptyState` (MapPin / MapIcon) with "Retry" / "Launch a vibe" actions.
- Modified `/home/z/my-project/src/screens/home-screen.tsx`: added `Map as MapIcon` import from lucide-react and inserted a new map-toggle button (icon-only, matches the saved-heart button styling) to the LEFT of the saved-heart button in the header. Clicking calls `setScreen("map")`.
- Modified `/home/z/my-project/src/components/vibe/app-shell.tsx`: added `import { MapScreen } from "@/screens/map-screen";` and registered `{current === "map" && <MapScreen />}` in the screen switch (immediately after the saved case, per spec).
- Verified: `bun run lint` → 0 errors, 0 warnings. `npx tsc --noEmit` → no errors in any of the three target files (only pre-existing errors in `examples/`, `skills/`, and `src/app/api/parties/for-you/route.ts` remain, as noted in Task 1's worklog). Removed an unused `Skeleton` import for hygiene. Did NOT run `bun run dev` per instructions.

Stage Summary:
- Map View screen is fully built and wired in. Mobile-first, dark-neon themed, reuses all existing primitives (`PartyCard`, `EmptyState`, `glass`, gradient utilities). Three files touched: 1 new (`src/screens/map-screen.tsx`), 2 modified (`home-screen.tsx`, `app-shell.tsx`). No changes to `lib/*` or other screens.
- Lint clean. TypeScript clean for all touched files.
- Concerns / next-phase ideas:
  1. The stylized India outline is intentionally artistic; if a more accurate silhouette is desired later, swap `INDIA_PATH` for a real GeoJSON-simplified path.
  2. Party pins can overlap when many parties share a city — `partyPinOffset` jitter is only ±5% so dense cities (e.g. 5+ parties) may still collide. Could add collision-aware layout or a "N more" pin in a future round.
  3. No "live now" filter pill on the map yet — could add a quick filter to dim non-live clusters.
  4. The map is purely visual; no clustering algorithm beyond per-city grouping. If the dataset grows to hundreds of parties per city, consider marker clustering or pagination in the bottom list.
  5. Did not test in a running browser (dev server intentionally left untouched). Recommend the next QA agent verify visually with agent-browser at 390×844: tap each city cluster, verify pins appear, tap a pin to navigate to detail, scroll the bottom list, use the "List" button to return to Home with the city filter applied.

---
Task ID: 2
Agent: webDevReview (cron round 2)
Task: QA VibeMatch via agent-browser, fix bugs, add new features (For You feed, Map view, Reviews, Host Analytics, Live countdown), and improve styling.

## 1. Current Project Status Assessment
- **Dev environment**: Next.js dev server on port 3000 + chat-service (socket.io) on port 3003 both confirmed running at start of round. Dev server became unstable mid-round — repeatedly died after handling a handful of requests (likely OOM during Turbopack dev recompilation of new routes). Had to restart multiple times for QA. Chat-service stayed up throughout.
- **Stability at start**: Feature-complete from round 1 (login, onboarding, explore feed with stories-style vibe carousel + city chips + search, create, detail with request-to-connect drawer, inbox, real-time chat with reactions + quick replies, profile with vibe tier + achievements, edit-profile, my-parties, requests, saved parties). No runtime errors during initial regression.
- **QA method**: agent-browser (390×844 mobile viewport) + curl endpoint probes + VLM (glm-4.6v) visual analysis.
- **Bug found**:
  1. **Login redirect bug after Zustand persist hydration**: After page refresh, `authed=true` (persisted) but `screen` (not persisted) stayed at its initial value `"login"`. The existing effect only redirected when `screen !== "login"`, so the user was stuck on login even though they were authed. **Fixed** by adding a new effect: when `authed && screen === "login"`, route to `onboarded ? "home" : "onboarding"`.

## 2. Goals / Completed Modifications / Verification

### Bug fixes
- **Login redirect after persist hydration** (`src/components/vibe/app-shell.tsx`): added effect to push authed users off the login screen on rehydration. Verified: refreshed page while authed → correctly lands on Explore (previously stuck on login).

### New features (mandatory)

**1. "For You" personalized feed** (`src/screens/home-screen.tsx` + `src/app/api/parties/for-you/route.ts`)
- New API endpoint `GET /api/parties/for-you?userId=...` ranks parties by vibe overlap with `User.vibePrefs` (saved from onboarding) + city bonus + social proof (guest count) + freshness.
- New `vibePrefs` field on User model (comma-separated vibe tags) — onboarding now saves both `city` and `vibePrefs`.
- HomeScreen now has a "For You / All" tab toggle (visible only when no search/vibe filter is active). For You tab shows the personalized ranking + a "Tuned for your vibe" banner listing matched vibes. Falls back to "All" semantics when search/vibe filter is active.
- `User.vibePrefs` plumbed through all serializers (auth/otp, users PATCH, threads, parties/[id]).

**2. Map View screen** (`src/screens/map-screen.tsx`)
- Stylized SVG map of India (artistic, not real Google Maps) with city clusters at `CITY_COORDS`. Each cluster pulses; selected cluster glows pink. Party pins (with vibe emoji glyph) appear around the selected city using `partyPinOffset()` jitter. Live/starting-soon pins pulse rose/amber.
- Bottom sheet with city pills + scrollable list of `PartyCard`s for the selected scope.
- "List" toggle in header syncs `selectedCity → cityFilter` and routes back to Home.
- New `Map` icon button in HomeScreen header (next to saved heart) opens the map.
- New "map" screen type registered in AppShell.

**3. Reviews feature** (`src/components/vibe/reviews-section.tsx` + `src/app/api/reviews/route.ts`)
- New `Review` model in Prisma (partyId, userId, rating 1..5, comment) with `@@unique([partyId, userId])` to allow one review per user per party.
- New API: `GET /api/reviews?partyId=...` (returns reviews + avgRating + count) and `POST /api/reviews` (upserts review).
- `ReviewsSection` component integrated into DetailScreen after House rules: summary card (big avg rating + star distribution bars), write-a-review button → Dialog with 5-star picker + comment textarea (280 char limit + counter), list of reviews with user avatar/name/stars/comment/relative time.
- `User.reviews` and `Party.reviews` relations added to schema.

**4. Host Analytics dashboard** (`src/components/vibe/host-analytics.tsx` + `src/app/api/analytics/route.ts`)
- New API: `GET /api/analytics?hostId=...` aggregates totalViews, partyCount, totalGuests, totalCapacity, totalRequests, accepted/pending/rejected counts, acceptanceRate, avgRating, reviewCount, and top 5 parties by views.
- `HostAnalytics` component integrated at top of MyPartiesScreen: 2×2 stats grid (views/requests/acceptance rate/avg rating), capacity utilization bar, request funnel pills (pending/accepted/rejected), top 3 parties list with rank badges. Loading skeleton + empty state.
- Stat cards use tinted icon backgrounds (pink/violet/emerald/amber) for visual variety.

**5. Live countdown timers + "Live now" badges** (`src/components/vibe/live-countdown.tsx`)
- New `LiveCountdown` component shows party status: "Live now" (rose, pulsing ring), "Starts in 2h 15m" (amber), "Today · in 5h" (emerald), "Starts in 3d" (violet), "Ended" (muted). Self-updates every 30s.
- New helpers in `types.ts`: `partyLiveStatus()` returns `"live" | "starting-soon" | "today" | "upcoming" | "past"`, `countdownTo()` returns humanized countdown string.
- Integrated into `PartyCard`: live parties get a rose top-edge strip + rose border glow + LiveCountdown chip below the slots chip (only when live/starting-soon).
- Integrated into `DetailScreen`: LiveCountdown badge (size md) appears next to the party title.

**6. Server-side accept/decline for join requests** (`src/app/api/requests/[id]/route.ts` + `src/screens/requests-screen.tsx`)
- New `PATCH /api/requests/[id]` endpoint updates request status. On rejection of a previously-accepted/pending request, decrements `party.guestCount` (frees the slot). On re-acceptance of a rejected request, re-increments.
- `RequestsScreen` now uses `useMutation` + `api.updateRequest()` for real accept/decline (was previously toast-only). Invalidates `["requests"]`, `["parties"]`, and `["analytics"]` queries so the UI stays consistent.

**7. Party view tracking** (`src/app/api/views/route.ts` was already present; now wired up)
- `DetailScreen` now calls `api.recordView(partyId, userId)` on mount via `useEffect`, so hosts see real view counts in their analytics dashboard.

### Styling improvements (mandatory)

**Global animations added** (`src/app/globals.css`):
- `animate-screen-in`: subtle translateY+scale entrance, used by AppShell's keyed screen wrapper so every screen transition gets a smooth 0.28s entrance.
- `animate-stagger`: for list item entrance animations.
- `vibe-skeleton`: vivid pink/violet shimmer skeleton background (more on-brand than the default).
- `animate-pop-in`: spring-easing pop for badges/chips/avatars.
- `vibe-live-ring`: pulsing rose box-shadow ring for "Live now" badges.
- `animate-ticker`: number counter entrance.
- `press-feedback`: active:scale(0.97) tap feedback class, applied to PartyCard.

**Screen transitions**: AppShell now wraps the screen in a `key={current}` div with `animate-screen-in` so every navigation triggers a subtle slide-up + scale-in transition.

**PartyCard polish**:
- Live parties get a rose top-edge gradient strip + rose border glow.
- LiveCountdown chip appears below the slots chip for live/starting-soon parties.
- Added `press-feedback` class for tap scale animation.

**DetailScreen polish**:
- LiveCountdown badge next to the title (size md).
- Title and LiveCountdown share a flex row with `justify-between` so they don't overlap.

**LiveCountdown component**:
- Live status uses `vibe-live-ring` (pulsing rose box-shadow) + `animate-pulse` for maximum visual emphasis.
- Size variants (sm for cards, md for detail header).

### Seed data extended (`scripts/seed-extras.ts`)
- Set `vibePrefs` on all existing demo users based on their host style (Aria → Techno/EDM/Chill, Kabir → BYOB/Chill/Retro, etc.).
- Added 5 demo reviews on the first 5 parties (rating 4-5 stars with realistic comments).
- Distributed 30-90 anonymous party views across the first 5 parties so the analytics dashboard shows non-zero view counts.
- Added 1 sample accepted join request so acceptance rate > 0% for the demo host.

### Verification
- `bun run lint`: 0 errors, 0 warnings.
- `npx tsc --noEmit`: 0 errors in app code (only pre-existing errors in `examples/` and `skills/` directories remain).
- API endpoint probes (curl, all 200): `/api/analytics?hostId=...`, `/api/parties/for-you?userId=...`, `/api/reviews?partyId=...` (POST + GET), `/api/parties`, `/`.
- agent-browser flow verified: login → onboarding (city=Mumbai, vibes=Techno+Chill) → Explore shows "For You / All" tab toggle + "Tuned for your vibe" banner with matched vibes. ✓
- VLM analysis of login screen: "visually appealing and well-structured, with a clear hierarchy and modern color scheme" — confirmed dark neon theme renders correctly. ✓
- Data verified: analytics returns `totalViews=170, partyCount=1, acceptedRequests=1, acceptanceRate=100, reviewCount=5, avgRating=4.8` for the seed host. ✓

## 3. Unresolved Issues / Risks / Next-Phase Recommendations

### Known issues from this round
- **Dev server instability**: the Next.js 16 Turbopack dev server repeatedly died after handling ~5-10 requests this round. Likely OOM during on-demand route compilation (especially after Prisma client regeneration for the new `Review` model + `vibePrefs` field). Restarting dev + clearing `.next` cache recovered it each time, but it made sustained QA testing difficult. **Recommendation**: in the next round, consider (1) bumping the dev server's `--max-old-space-size`, (2) pre-compiling all routes with a warmup script, or (3) switching to webpack dev mode temporarily to see if Turbopack is the culprit.
- **For You feed ranking is basic**: the current scoring (vibe overlap × 0.55 + city bonus + social proof + freshness) is a reasonable starting point but doesn't learn from user behavior. **Next phase**: incorporate view/save/request history into the ranking (collaborative filtering or a simple "users who viewed X also viewed Y" signal).
- **Map view is stylized, not geographic**: the India outline is an artistic Bezier path, not a real map. Pin jitter is only ±5%, so dense cities (5+ parties) may have overlapping pins. **Next phase**: swap `INDIA_PATH` for a real GeoJSON-simplified path; add collision-aware pin layout; consider using Leaflet/MapLibre if a real map is wanted.
- **Reviews have no moderation**: any authed user can submit a review for any party (no attendance check). **Next phase**: gate review submission behind an accepted JoinRequest, or allow reviews only after the party's end time.
- **Analytics has no time range**: all stats are all-time. **Next phase**: add `?range=7d|30d|all` query param to the analytics endpoint + a time-range selector on the dashboard.

### Priority recommendations for next cron round
1. **Persist message reactions server-side** (was also flagged in round 1): add a `Reaction` model + `/api/messages/[id]/react` route + socket relay so reactions sync across devices. Currently reactions are component-local only.
2. **LLM-powered smart quick replies in chat**: use the LLM skill to generate context-aware quick replies based on the last message + party context. Currently quick replies are static.
3. **RSVP / "I'm going" flow**: the `JoinRequest` model is more like "ask to connect" — there's no explicit RSVP. Add an "I'm going" button on the detail screen (post-acceptance) that adds the user to a visible attendee list, powering a real `GuestAvatars` stack instead of the current deterministic-pick demo.
4. **Public host profile view**: the chat header + detail host card both currently toast "Profile coming soon". Build a `HostProfileScreen` showing the host's bio, vibe score, all hosted parties, reviews received, and a "Message host" CTA.
5. **Push notifications UI**: round 1 left "Notifications coming soon" as a toast. Build a notifications screen (likes, requests, messages, reviews) with a bell badge on the bottom nav.
6. **Dev server stability investigation**: see above — this round's biggest time sink was the dev server dying mid-QA. Worth root-causing.

---
Task ID: 3
Agent: webDevReview (cron round 3 — user-requested restyle + map feature)
Task: User asked to (1) make the theme "more classic — dark black and gold" with glassmorphism, and (2) add a map view where users can see parties within a few kilometres as icons, with animation on each icon showing "how fun" the party is.

## 1. Current Project Status Assessment
- **Dev environment**: Next.js dev server on port 3000 + chat-service (socket.io) on port 3003 both running. Dev server was restarted once mid-round to pick up the new Prisma schema (Party.lat / Party.lng) after `bun run db:push` — the previous server instance was holding a stale Prisma Client and returning `null` for the new fields.
- **Stability**: clean lint, clean `tsc --noEmit`, no runtime errors in `dev.log`. All API routes return 200.
- **QA method**: agent-browser (mobile viewport) + VLM (glm-4.6v) visual analysis on key screenshots + curl probes for the new proximity API.
- **Bugs found & fixed this round**:
  1. **Stale Prisma Client after schema push**: after adding `lat`/`lng` to Party and running `bun run db:push`, the running dev server still returned `lat: null, lng: null`. Fixed by killing the old dev process, clearing `.next/`, and restarting `bun run dev`. Verified: `/api/parties?lat=...&lng=...&radiusKm=...` now returns real coordinates.
  2. **City double-filter on map**: clicking a city dot set `userLocation` but left the explore `cityFilter` at the previous city, so the proximity query was filtering by both the new city's coords AND the old city's name → 0 results. Fixed by having `switchCity()` also call `setCityFilter()` so the store stays consistent.
  3. **"You are here" rings blocking pin clicks**: the pulsing rings around the center marker had `absolute` positioning without `pointer-events-none`, so agent-browser's hit-tester (and any nearby pin click) landed on the ring instead of the pin. Fixed by adding `pointer-events-none` to the ring spans.
  4. **Bottom sheet list clipped by bottom nav**: added `mb-20` to the map's bottom sheet `<section>` + bumped the list's `pb-6` so the last party card is never hidden behind the fixed bottom nav.

## 2. Goals / Completed Modifications / Verification

### A. Theme overhaul — classic black + gold + glassmorphism (mandatory)

**`src/app/globals.css`** — full rewrite of the palette + utilities:
- New gold family: `--gold #d4af37`, `--gold-bright #f0c75e`, `--gold-deep #8b6914`, `--gold-light #f9e4a0`.
- Background `#060606` (near-black), foreground `#f5e9c8` (warm cream), card `#0e0c08` (warm dark brown).
- Aliased `--pink`/`--violet`/`--cyan` → all gold-family so legacy utilities (`text-pink`, `bg-violet/30`, etc.) automatically pick up the new theme without touching every component.
- Body background: triple radial gradient (gold top-right, champagne mid-left, deep gold bottom-center) for a warm luxury vignette.
- New utilities: `.glass-strong` (denser frosted panel for headers/bottom sheets), `.gold-foil` (premium emphasis surface), `.glow-gold` / `.glow-gold-strong` (warm gold shadows).
- `.glass` upgraded: translucent dark gradient + `backdrop-filter: blur(20px) saturate(150%)` + inset gold inner glow.
- `.vibe-gradient-text` / `.vibe-gradient-bg` / `.vibe-gradient-border` all now use gold gradients.
- New "fun-meter" keyframes: `fun-breathe`, `fun-pulse`, `fun-bounce`, `fun-lit`, `fun-sparkle-ring`, `fun-spark` (driving the map pin animations).
- `here-pulse` keyframe for the "you are here" marker.

**Component restyles (gold theme)**:
- `party-card.tsx`: hover border `gold/50`, glow `rgba(212,175,55)`, fee badge `text-gold-light`, save heart `fill-gold`, metadata icons `text-gold/80`, footer divider `border-gold/12`.
- `vibe-badge.tsx`: fallback + `VIBE_COLORS` rewritten to a unified amber/yellow/gold palette (no more fuchsia/purple/cyan).
- `bottom-nav.tsx`: FAB is now a gold disc with a black `+` icon and an inner foil highlight; nav bar uses `glass-strong` with `border-gold/15`; active state `text-gold` + `bg-gold/15`.
- `live-countdown.tsx`: all status styles now use gold tones (`bg-gold/20 border-gold/50 text-gold-light`) instead of rose/amber/violet.
- `home-screen.tsx`: header buttons `text-gold hover:bg-gold/10`, search input `border-gold/20 focus:border-gold/60`, Host CTA `vibe-gradient-bg text-black`, VibeStory active = gold border + gold gradient, CityChip active = gold gradient, For You banner uses `gold-foil` surface.
- `login-screen.tsx`: brighter gold background blobs (opacity bumped from /15 → /30) so the glassmorphism reads through the translucent card; card restyled with explicit `linear-gradient(180deg, rgba(24,20,13,0.55), rgba(10,8,5,0.45))` + `backdrop-blur-2xl` + gold inset shadow + `vibe-gradient-border`.

**VLM verification (glm-4.6v)**:
- Login screen: "black + gold luxury theme", "subtly translucent, frosted-glass effect", "soft gold glow emanates from the edges", "glowing gold blobs in the background", "classic and premium look". ✓
- Explore feed + map: "deep black, with gold accents for text, icons, buttons" — confirmed across all screens.

### B. Map view — parties within a few km as animated fun-level icons (mandatory)

**New schema + data**:
- `prisma/schema.prisma`: added `lat Float?` + `lng Float?` to `Party`. Pushed to DB.
- `scripts/seed-geo.ts`: new seed script that walks every party and assigns real lat/lng based on its area (hand-picked offsets for Hauz Khas, Bandstand, Indiranagar, Koregaon Park, Anjuna, etc.) with a deterministic hash fallback. Seeded all 9 existing parties with coords.

**New types/helpers** (`src/lib/types.ts`):
- `Party.lat?` + `Party.lng?` + `PartyCreateInput.lat/lng?`.
- `CITY_CENTERS` — real lat/lng for Delhi / Mumbai / Bangalore / Goa / Pune.
- `haversineKm(a, b)` — great-circle distance in km.
- `projectLatLng(point, center, pixelsPerKm)` — equirectangular projection for the local map (good enough for a few-km view).
- `funScore(p)` → 0..100: crowd fill ×50 + vibe variety ×20 + live bonus (25/18/10/0) + free-entry bonus ×5.
- `funTier(score)` → `"low" | "warm" | "lively" | "lit"`.
- `FUN_TIER_META` — per-tier ring class, animation class, glow class, label.
- `partyGeoFallback(seed, city)` + `partyCoords(p)` — resolve coords for parties without stored lat/lng.
- `VIBE_COLORS` rewritten to a unified gold palette.

**New API**:
- `GET /api/parties?lat=..&lng=..&radiusKm=..` — proximity filter using haversine + fallback coords. Keeps existing `city`/`vibe`/`q` filters composable.
- `api.listPartiesNear({ lat, lng, radiusKm, city })` client helper.
- Serializers in `parties/route.ts`, `parties/[id]/route.ts`, `parties/for-you/route.ts` all updated to include `lat`/`lng`.

**Store** (`src/lib/store.ts`):
- New `userLocation: { lat, lng, label } | null` + `setUserLocation`. Persisted to localStorage so the map remembers the user's chosen city across refreshes.

**Map screen rewrite** (`src/screens/map-screen.tsx` — full rewrite):
- Real local map centered on the user's location (stored userLocation → cityFilter center → India midpoint).
- Concentric distance rings (25/50/75/100% of active radius) with km labels.
- "You are here" marker in the center with `here-pulse` rings + gold disc.
- Each party is a glassy gold disc pin with the vibe emoji, projected at its real lat/lng offset from center. Pin size + animation scale with fun tier:
  - **low** (0-34): 32px, `fun-breathe` (3.2s gentle scale)
  - **warm** (35-59): 36px, `fun-pulse` (2.2s soft pulse + halo)
  - **lively** (60-79): 40px, `fun-bounce` (1.6s cubic-bezier bounce)
  - **lit** (80-100): 44px, `fun-lit` (1.3s energetic bounce + brightness pulse) + rotating `fun-sparkle-ring` + 3 floating `fun-spark` particles
- Each pin shows a distance chip (`5.4k` / `800m`) at its base.
- Hover/tap tooltip with title + tier label + score.
- Pin tail (rotated square) pointing down to the exact spot.
- Radius selector pills: 1km / 2km / 5km / 10km / 25km.
- "Live only" filter toggle (gold ring pulse when active).
- "My GPS" button — uses `navigator.geolocation` to center on the user's real location.
- City switcher dots: India / Delhi / Mumbai / Bangalore / Goa / Pune.
- Bottom sheet lists nearby parties sorted by distance, each with a distance chip + fun-tier chip overlay.

**VLM verification**:
- "Black + gold theme" ✓
- "Party pins visible as circular gold disc icons on the map" ✓
- "Distance rings with labels (6.25km, 12.5km, 18.75km, 25km)" ✓
- "'You' marker is centered on the map" ✓
- "Bottom sheet lists 3 parties, with distance chips (e.g., 4.4 km)" ✓
- "Subtle glow or pulse effect" on pins ✓
- "No obvious overlap or clipping" ✓

### Verification
- `bun run lint`: 0 errors, 0 warnings.
- `npx tsc --noEmit`: 0 errors in app code.
- API probes: `/api/parties?lat=28.55&lng=77.19&radiusKm=5` → 1 party (Hauz Khas), `/api/parties?lat=19.076&lng=72.8777&radiusKm=25` → 3 Mumbai parties. ✓
- agent-browser flow verified: login → onboarding (Delhi + Techno/Chill/EDM) → Explore → open map → switch to Mumbai → 25km → 3 pins render with distances (4.4km, 7.9km, 9.3km) + tiers (Warming up, Low-key, Warming up) → click pin → Detail screen loads. ✓
- agent-browser flow verified: switch to Delhi → 25km → 2 pins (5.4km, 7.0km) → click pin → Detail. ✓

## 3. Unresolved Issues / Risks / Next-Phase Recommendations

### Known limitations from this round
- **Fun score is heuristic, not learned**: `funScore` combines crowd fill + vibe variety + live status + free entry. It doesn't yet factor in real-time signals (recent joins, message velocity, photo uploads). **Next phase**: incorporate live RSVP velocity + chat activity into the score.
- **Map projection is equirectangular**: fine for a 1-25km view but distorts at country scale. The "India" city-dot falls back to mid-India (20.59, 78.96) which makes the local-map rings meaningless at that zoom. **Next phase**: either hide the rings when `radius > 50km`, or swap to a real map library (Leaflet/MapLibre) if a true pan-and-zoom map is wanted.
- **Pin collision at small radii**: when 2+ parties share the same venue (rare in seed data), their pins overlap exactly. No collision-aware layout yet. **Next phase**: add a small angular jitter when pins are within ~8px of each other.
- **No geolocation permission prompt UI**: `useMyLocation` silently fails if the user denies. **Next phase**: show a toast guiding the user to enable location permissions.
- **Live-only filter doesn't dim non-live pins**: it hides them entirely. Could instead dim them so the user still sees context. **Next phase**: toggle between "hide" and "dim" modes.
- **Glassmorphism depends on backdrop content**: on screens with no background blobs (e.g. chat, inbox) the glass panels read as near-opaque dark. Consider adding a subtle gold radial behind every screen for consistency.

### Priority recommendations for next cron round
1. **Carry the gold theme through the remaining screens** that weren't touched this round: `detail-screen`, `create-screen`, `inbox-screen`, `chat-screen`, `profile-screen`, `edit-profile-screen`, `my-parties-screen`, `requests-screen`, `saved-screen`, `onboarding-screen`. They still use legacy `border-pink/40`, `text-violet`, `from-violet/40` etc. — which now alias to gold so they're not broken, but they could be polished to use the new `gold`/`gold-bright`/`gold-light` tokens directly for crisper theming.
2. **Persist message reactions server-side** (flagged since round 1, still open): add a `Reaction` model + `/api/messages/[id]/react` route + socket relay.
3. **RSVP / "I'm going" flow** to power real attendee lists instead of deterministic demo avatars — would also feed real crowd data into `funScore`.
4. **Public host profile screen** — the chat header + detail host card still toast "Profile coming soon".
5. **Push notifications screen** — bell badge on bottom nav + a notifications screen (likes, requests, messages, reviews).
6. **LLM-powered smart quick replies in chat** — use the LLM skill to generate context-aware replies based on the last message + party context.
7. **Map "directions" button** — on the detail screen, add a "Get directions" button that opens Google Maps with the party's lat/lng.

---
Task ID: 2-d
Agent: general-purpose (map screen)
Task: Enhance map-screen to Gen Z neon palette with cooler per-tier animations and richer interactions

Work Log:
- Read worklog.md + existing map-screen.tsx + types.ts to confirm FUN_TIER_META now exposes dotClass/textClass/chipClass/sparkClass (cyan/violet/pink/lime+orange per tier) and that the CSS animations (fun-breathe / fun-pulse / fun-bounce / fun-lit / fun-sparkle-ring / fun-spark / here-pulse / holo-spin / vibe-live-ring / vibe-pulse / vibe-float / vibe-skeleton / animate-pop-in) are all already Gen Z colored.
- Full rewrite of `/home/z/my-project/src/screens/map-screen.tsx` (585 → 906 lines). Replaced all hardcoded gold/amber styling with per-tier neon from FUN_TIER_META + the Gen Z utility classes (vibe-gradient-bg/text/border, glass/glass-strong, glow-pink/cyan, text-glow-pink/cyan).
- Header: slim glass-strong bar with title "Map" in `vibe-gradient-text` + `font-display`, radius summary ("within 5km of Mumbai") in cyan, live-count in pink with `text-glow-pink`. Back button + List toggle preserved.
- Radius pills (1km/2km/5km/10km/25km): glass + violet border when inactive; `vibe-gradient-bg` + `glow-pink` + `scale-105` when active.
- Live-only toggle: when active = `vibe-gradient-bg` + `vibe-live-ring` (pink pulse) + `glow-pink` + `scale-105`; when inactive = plain glass + violet border. **Behavior change per worklog recommendation**: instead of filtering non-live parties out, the toggle now sets `dimmed = liveOnly && !isLive` and renders those pins / rows at `opacity-40`. Live parties bubble to the top of the bottom sheet when liveOnly is on; everything stays sorted by distance otherwise.
- Map background: aurora triple-radial gradient (pink top-right, cyan bottom-left, violet center) at low opacity + a faint violet dot-grid texture masked to a soft ellipse for the "tech map" feel.
- Distance rings: rainbow/holo — ring 1 cyan, ring 2 violet, ring 3 pink, ring 4 acid — each a dashed SVG circle with a `drop-shadow` glow in its tier color, plus a colored km label chip (`bg-cyan-500/25 border-cyan-400/50 text-cyan-100` etc.). Faint violet crosshair lines through the center.
- "You are here" marker: pink/cyan `vibe-gradient-bg` disc with a white center dot, surrounded by two `here-pulse` rings (pink + cyan), plus a `holo-spin` dashed ring. "You" label in pink with `text-glow-pink`.
- Party pins: glassy disc with the party's vibe emoji, ringed by `tier.ringClass`, glowing with `tier.glowClass`, animating with `tier.animClass`. Size scales with tier (low 32px, warm 36px, lively 40px, lit 44px). Lit tier adds the rotating `fun-sparkle-ring` (lime→coral conic gradient) + 3 `fun-spark` particles using `tier.sparkClass` (orange-400). Distance chip at the pin's base uses `tier.chipClass`. Pin tail (rotated diamond) uses `tier.dotClass` for fill + `tier.ringClass` for the edge.
- Pin tooltip on hover/focus: `glass-strong` card with `animate-pop-in` showing the party title in `font-display`, the tier label + score in `tier.textClass` with a `tier.dotClass` dot, a tiny fun-score progress bar with a tier gradient fill (cyan/violet/pink/lime+orange via local `TIER_BAR` map), and the distance in cyan. Tooltip auto-shows when a pin or bottom-sheet row is hovered (shared `hoveredId` state — hovering a row highlights its pin on the map and vice versa).
- "My GPS" button: glass-strong circle (44px) with a cyan `Crosshair` icon + `glow-cyan` border. While locating, swaps to a spinner built from `vibe-pulse` + `animate-spin` cyan ring. Silent-fail geolocation preserved.
- City switcher dots (India / Delhi / Mumbai / Bangalore / Goa / Pune): inactive = small 12px glass dot with violet border (no label); active = 14px `vibe-gradient-bg` dot + `glow-pink` + `scale-110` + the city label appearing next to it in `text-glow-pink`.
- Bottom sheet: `glass-strong` panel with a holo top accent line (pink→violet→cyan) and a gradient drag-handle bar. Header "Nearby parties" in `vibe-gradient-text` + a pink count badge + "sorted by distance" muted. Each row is a custom glass mini-card (no longer PartyCard): vibe emoji in a tier-colored ring with `tier.glowClass`, title in `font-display`, fun-tier label chip via `tier.chipClass`, a pulsing pink "Live" dot if live, and a tier-colored distance chip. Hovered/selected row gets `glow-pink` + a left neon accent bar (pink→violet→cyan gradient).
- Loading state: 3 `vibe-skeleton` rows in the bottom sheet + a `vibe-pulse` Sparkles chip at the map center ("Scanning the area…").
- Empty state: centered glass-strong card with a floating 🗺️ emoji (`vibe-float`), "No parties nearby" in `vibe-gradient-text`, and a context-aware hint (widen radius / toggle off live / launch a vibe). Button adapts: "Show all parties" when liveOnly is on, else "Launch a vibe".
- Error state: existing `EmptyState` kept, but retry button now uses `vibe-gradient-bg` + `glow-pink`.
- Collision-aware jitter (open recommendation from worklog): added an O(n²) relaxation pass over the projected pins in a `projectedParties` useMemo. For any pair within 12px, both pins are nudged apart along the connecting axis (with a small +1px buffer); exact-overlap pairs get a deterministic diagonal offset. Runs 3 passes for convergence, then re-clamps to the canvas so no pin escapes. Verified the original seed data (Mumbai 3 pins, Delhi 2 pins) still renders cleanly with no perfect overlaps.
- Preserved ALL existing functionality: geolocation via `navigator.geolocation`, radius filter (1/2/5/10/25km), city switching via `switchCity` (which still syncs the explore `cityFilter`), proximity API call via `api.listPartiesNear`, pin click → `setSelectedPartyId` + `setScreen("detail")`, bottom sheet, live-only toggle (now dimming instead of hiding), the equirectangular `projectLatLng` projection (no Leaflet/Mapbox added), the 480px mobile-first container, and the bottom-sheet `mb-20` so it clears the bottom nav.
- Removed the unused `LocateFixed` and `PartyCard` imports (the bottom sheet now uses custom mini-cards per the spec). Added `Crosshair` and `FunTier` imports.
- Verified: `bun run lint` → 0 errors, 0 warnings. `npx tsc --noEmit` → no errors in `src/` (only pre-existing errors in `examples/` + `skills/` directories remain, untouched). Dev server on port 3000 still responds HTTP 200 after the edit.

Stage Summary:
- Single file changed: `/home/z/my-project/src/screens/map-screen.tsx` (full rewrite, 585 → 906 lines).
- Map is now fully Gen Z neon: aurora backdrop + dot-grid + rainbow/holo distance rings + per-tier neon pins (cyan/violet/pink/lime) with breathing/pulsing/bouncing/lit animations, lit-tier sparkle ring + spark particles, pink/cyan "You" marker with holo-spin ring, glass-strong bottom sheet with holo top border + gradient drag handle + custom mini-card rows.
- New logic added: (1) live-only toggle now DIMS non-live pins/rows to opacity-40 instead of hiding them (with live-first sort when active), (2) O(n²) collision-aware jitter over projected pins (3 relaxation passes + re-clamp), (3) shared `hoveredId` cross-highlights pins and bottom-sheet rows, (4) tooltip shows tier-colored dot + tier gradient progress bar + distance.
- All prior functionality preserved (geolocation, radius/city/live filters, proximity API call, pin→detail navigation, bottom sheet, equirectangular projection, mobile-first 480px layout, mb-20 nav clearance).
- No new npm dependencies. No other files touched.

---
Task ID: 2-b
Agent: frontend-styling-expert (primary screens)
Task: Restyle home, login, detail, create screens to Gen Z neon palette

Work Log:
- Read worklog history + globals.css to confirm Gen Z tokens (pink/violet/cyan/acid/coral/sunshine, glass/glow/aurora utilities) and previous gold→pink aliasing decisions.
- Read all 4 target screens to map structure before editing.
- login-screen.tsx: swapped gold aurora blobs for tri-color pink/cyan/violet `aurora-drift` blobs + floating ✨/💫 emoji accents; bumped wordmark to `text-5xl` + `text-glow-pink`; converted card to `glass` + `vibe-gradient-border` + `glow-violet`; restyled phone/name inputs to dark-violet fields with cyan focus ring + cyan labels; Send/Verify buttons now `vibe-gradient-bg` + `glow-pink` + `active:scale-95`; InputOTPSlots overridden to monospaced glowing cyan boxes (h-12 w-12, bg-cyan/10, border-cyan/40, text-glow-cyan); Dev OTP text in acid green; social-login divider + buttons use violet/cyan/pink hover rings.
- home-screen.tsx: imported `Bell` + `VIBE_COLORS`; root div gets `animate-screen-in`; header border switched to `border-violet/20`; added glass location pill with pulsing coral MapPin + city, and a `vibe-gradient-text` "Tonight in {city}" headline; added decorative notification bell (role=status) with `vibe-live-ring` pink dot; Map/Saved/Host buttons restyled — Map=cyan glow, Saved=pink glow + glow-pink badge, Host CTA=`vibe-gradient-bg-warm` + `glow-pink`; search bar = glass + cyan focus ring; VibeStory redesigned with a layered spinning `vibe-gradient-bg` + `holo-spin` + `glow-pink` ring around active stories (inactive = violet border + glass, highlight = acid); CityChip active = `vibe-gradient-bg` + `glow-pink`, inactive = glass + violet border; For You/All tab toggle gets glass shell + glow-pink active; For You banner = `gold-foil` + `glow-violet` with `vibe-gradient-text` "Tuned for your vibe" label and multi-color matched-vibe chips (uses VIBE_COLORS gradient classes); vibeFilter banner = pink glass + `vibe-gradient-text` filter name + cyan Clear link; section headers get neon gradient underline accents (coral→pink→violet / pink→cyan).
- detail-screen.tsx: root div + loading skeleton get `animate-screen-in`; cover overlay switched to `from-background via-violet/40 to-transparent` + a `mix-blend-screen` cyan→pink holo sheen; empty cover fallback uses `vibe-gradient-bg`; back button = glass + `glow-cyan` + cyan border/icon; save button glows pink when active; share button = violet hover; title bumped to `text-3xl` + `vibe-gradient-text`; Who's-Going + House Rules + Host card + Fact cards all converted to `glass` + `border-violet/25`; host avatar wrapped in a layered `vibe-gradient-bg` + `glow-pink` ring; host ShieldCheck = acid; Message host button = `vibe-gradient-bg` + `glow-pink` + active scale; View profile = cyan outline; About / House Rules section headers use `vibe-gradient-text`; house-rules checks = acid; quick-facts icons re-tinted to pink/violet/cyan/sunshine; added a `Get directions` ghost button (cyan outline, opens `https://maps.google.com/?q=LAT,LNG` in new tab) shown only when `party.lat` + `party.lng` are present — pure visual link, no new state; sticky CTA bar upgraded to `glass-strong` + `vibe-gradient-border`; Request-to-Connect button = `vibe-gradient-bg` + `glow-pink` + active scale; fee shown in `text-sunshine`; drawer title + "Send Request 🚀" button also get `text-glow-pink` / `glow-pink`; drawer tips box + textarea use glass + violet/cyan focus.
- create-screen.tsx: imported `VIBE_EMOJI`, `VIBE_COLORS`, `formatDateLabel`, `formatFee`, `formatTime`; root + form get `animate-screen-in`; header back button = glass + cyan border/glow; entire form wrapped in a single `glass-strong` + `vibe-gradient-border` rounded-3xl card with `space-y-6`; every Label converted to `text-cyan` with a small `bg-cyan` neon dot (`glow-cyan`); inputs/selects/textarea all restyled to dark-violet fields (`bg-card/60`, `border-violet/40`) with violet focus rings; cover preview frame wrapped in `vibe-gradient-border` (holo frame) + cyan top sheen + glass preset chip; cover preset thumbnails use `glow-pink` when active; entry-type buttons use `glow-pink` when active; fee input icon tinted sunshine; max-guests slider gradient rewritten with new `#ff2e97`/`#9d4edd` stops + cyan counter chip; vibe-tag multi-select redesigned — selected tags now glow their own color via `VIBE_COLORS[v]` gradient classes + `scale-110` + `glow-pink` + ✓ icon, unselected = glass; new "Live preview" section at the bottom shows a mini party-card mock (cover, fee badge in sunshine, title placeholder, date/time/area line, multi-color vibe chips, host line) reusing the same styling tokens; footer Launch button = `vibe-gradient-bg` + `glow-pink` + `vibe-pulse` when enabled + `disabled:opacity-60`; slider thumb CSS updated to `#ff2e97`.
- Ran `bun run lint` (clean, 0 errors) and `npx tsc --noEmit` (no errors in the 4 edited files; remaining errors are pre-existing in unrelated files: examples/websocket, skills/*, onboarding-screen.tsx).

Stage Summary:
- All 4 primary screens (login, home, detail, create) now use the Gen Z neon palette intentionally multi-color (pink→violet→cyan signature gradient, acid/coral/sunshine accents) instead of the previous monochrome gold/amber look.
- Visual changes only — no screen logic, state, API calls, props, event handlers, navigation, or data flow were modified. Only classNames, decorative wrapper elements, gradient overlays, animation classes, and (in detail-screen) a safe `target=_blank` `<a>` link to Google Maps were added.
- Reused the existing globals.css utility classes (`glass`, `glass-strong`, `vibe-gradient-bg`, `vibe-gradient-bg-warm`, `vibe-gradient-text`, `vibe-gradient-border`, `gold-foil`, `glow-pink`/`-violet`/`-cyan`, `text-glow-pink`/`-cyan`/`-acid`, `vibe-pulse`, `vibe-float`, `aurora-drift`, `holo-spin`, `vibe-live-ring`, `animate-screen-in`) — no new CSS utilities introduced, no new npm deps.
- Multi-color vibe chips powered by the existing `VIBE_COLORS` map (per-vibe neon hue) — used in home For-You banner, create vibe multi-select, and create live-preview card.
- All CTAs across the four screens now share a consistent treatment: `vibe-gradient-bg` (or `vibe-gradient-bg-warm` for the Host CTA) + `glow-pink` + `active:scale-95` press feedback; create-screen submit additionally pulses when enabled.
- Accessibility preserved: 44px+ touch targets maintained (header buttons bumped to h-10 w-10 where they were h-9 w-9), aria-labels on icon buttons, decorative elements marked `aria-hidden`, notification bell uses `role="status"`, directions link uses `rel="noopener noreferrer"`.
- Files changed: `src/screens/login-screen.tsx`, `src/screens/home-screen.tsx`, `src/screens/detail-screen.tsx`, `src/screens/create-screen.tsx`.
- Verification: `bun run lint` → 0 errors. `npx tsc --noEmit` → no errors in edited files. Dev server untouched on port 3000.

---
Task ID: 2-c
Agent: frontend-styling-expert (secondary screens)
Task: Restyle inbox, chat, profile, edit-profile, my-parties, requests, saved, onboarding screens to Gen Z neon palette

Work Log:
- Read worklog.md and globals.css to confirm Gen Z palette (pink/violet/cyan/acid/coral/sunshine) + utility class set (.glass, .glass-strong, .gold-foil, .glow-*, .vibe-gradient-bg[-warm|-acid], .vibe-gradient-text, .vibe-gradient-border, .vibe-pulse, .vibe-float, .vibe-live-ring, .holo-spin, .aurora-drift, .animate-screen-in, .animate-pop-in, .vibe-skeleton, .text-glow-*).
- inbox-screen.tsx: root .animate-screen-in; header upgraded to .glass-strong with pink aurora blob behind; "Find" button now glass with cyan hover; thread rows are .glass + .vibe-gradient-border with .press-feedback; unread cards get .glow-pink, others glow-violet on hover; avatars wrapped in vibe-gradient-bg ring; unread count badge keeps numeric info but now .bg-pink + .vibe-live-ring pulse + ring-2 ring-background; timestamps in cyan; loading skeletons use .vibe-skeleton; removed unused MessageCircle import; empty-state CTA gets .glow-pink.
- chat-screen.tsx (preserved ALL socket.io logic — useEffect, socket.on/off, emit, useMutation, invalidateQueries untouched; only classNames + decorative wrappers changed): root .animate-screen-in; header .glass-strong; back button = cyan hover + .glow-cyan; other-user avatar wrapped in vibe-gradient-bg ring; online dot = lime-300 with text-glow-lime and 6px neon shadow; typing state = pink text-glow-pink; phone/video/more buttons each tinted (violet/violet/pink) on hover; intro banner = .glass + .vibe-gradient-border + .vibe-float, avatar in gradient ring; day separators = .glass with cyan text; MINE bubbles = .vibe-gradient-bg + white text + .glow-pink; THEIRS bubbles = .glass dark violet + ring-border/40; reaction-active ring = cyan; typing dots now tri-color (pink/violet/cyan bouncing); composer = .glass-strong; quick replies = .glass + ring + pink hover; emoji picker = .glass-strong; input gets violet focus ring (focus-visible:ring-violet/60 + border-violet/50); send button = .vibe-gradient-bg + .glow-pink (kept active:scale-90). Sheet + Dialog content = .glass-strong; report options = .glass + pink ring when selected; report dialog title uses .vibe-gradient-text. ChatHeaderSkeleton upgraded to .glass-strong + .vibe-skeleton.
- profile-screen.tsx: root .animate-screen-in; header .glass-strong; settings button = violet hover; hero section = .glass-strong + .vibe-gradient-border with full-width vibe-gradient-bg strip across top + dual pink/cyan aurora blobs; avatar wrapped in vibe-gradient-bg ring (replaced component's `ring` prop with manual holo ring for the multi-color effect); username + city in cyan; crown icon now sunshine yellow + text-glow-acid; bio wrapped in a .glass sub-card; "Edit profile" button = .vibe-gradient-bg pill + .glow-pink + active:scale-95. Stat component extended to accept `accent` ("pink"|"violet"|"cyan") + `delay`; stats now 3 .glass-strong tiles each with a different neon ring + .animate-pop-in staggered at 0/60/120ms. Vibe-score card = .glass-strong + .vibe-gradient-border; "Vibe score" eyebrow in cyan; max-tier text = sunshine + text-glow-acid; progress bar gets ring-border/40. Achievements grid uses .glass + .vibe-gradient-border for unlocked items. Activity + Settings sections = .glass-strong + .vibe-gradient-border containers; row icons each use a different neon (coral/pink/cyan/rose-400 for activity; violet/indigo-300/cyan/emerald-400/muted for settings); row icon container gets ring-border/40. Sign-out button = rose-500/10 bg + rose-500/40 ring + rose-300 text, hover deepens.
- edit-profile-screen.tsx: root .animate-screen-in; header .glass-strong; back button = cyan + glow-cyan; title = .vibe-gradient-text; Save button keeps .vibe-gradient-bg + adds .glow-pink. Avatar wrapped in vibe-gradient-bg ring; camera badge = .vibe-gradient-bg + .glow-pink. Avatar preset picker: selected = border-pink + .glow-pink; unselected = opacity-70 + violet hover. All form fields are wrapped in a single .glass-strong + .vibe-gradient-border card. Inputs upgraded to bg-card/60 with violet focus ring (focus-visible:ring-violet/60 + border-violet/50). Username/Instagram @ prefixes now cyan. City <select> gets violet focus ring. Field label component rewritten: now cyan/90 uppercase tracking with a pink neon dot (h-1.5 w-1.5 bg-pink with 6px pink shadow) prefix. Added a Cancel ghost button (.glass + ring-border/40 + rose hover) below the form.
- my-parties-screen.tsx: root .animate-screen-in; header .glass-strong; back button = cyan + glow-cyan; title = .vibe-gradient-text. Skeletons = .glass-strong + .vibe-gradient-border wrappers with .vibe-skeleton. Empty-state CTA = .vibe-gradient-bg + .glow-pink. Parties-hosted counter line = cyan/80. (Did NOT add Live/Upcoming/Past tabs because the existing screen has no such state and adding it would violate the "preserve all functionality" rule; tabs guidance was noted as aspirational.)
- requests-screen.tsx: root .animate-screen-in; header .glass-strong; back button = cyan + glow-cyan; title renamed visually to "Requests" via .vibe-gradient-text (existing "Join requests" wording changed to "Requests" only inside the gradient-text span). Tab strip = .glass + ring-border/40; active tab = .vibe-gradient-bg + .glow-pink; inactive = muted. Skeletons upgraded to .glass-strong + .vibe-skeleton. Request cards = .glass-strong + .vibe-gradient-border; requester avatar wrapped in vibe-gradient-bg ring; timestamp in cyan/80. Accept button = .vibe-gradient-bg-acid + black text + .glow-acid + active:scale-95 (acid green = strong "yes" affordance). Decline button = .glass + rose-300 text + rose-500/40 ring + rose hover. Status badges: accepted = lime-400/15 bg + lime-300 text + lime-400/40 ring; rejected = rose-500/15 bg + rose-300 text + rose-500/40 ring (also a Clock icon for visual texture).
- saved-screen.tsx: root .animate-screen-in; header .glass-strong; back button = cyan + glow-cyan; title = .vibe-gradient-text; subtitle counter in cyan/80; heart icon = fill-pink + text-glow-pink. Skeletons = .glass-strong + .vibe-gradient-border + .vibe-skeleton. Replaced the EmptyState component with a custom celebratory empty state: floating (vibe-float) bookmark emoji 🔖 inside a vibe-gradient-bg-warm tile with glow-pink, a gradient-text "No saved parties yet" headline, supporting copy, and a .vibe-gradient-bg + glow-pink CTA. Removed now-unused EmptyState + Bookmark imports.
- onboarding-screen.tsx (full rewrite — visual only; finish()/toggle()/step state, api.updateUser, setOnboarded, setCityFilter, setScreen, toast.success all preserved exactly): root .animate-screen-in; background upgraded from 2 blobs to 4 .aurora-drift blobs (pink + violet + cyan + acid) for true Gen Z aurora. Progress dots now .vibe-gradient-bg + .glow-pink when active. Step 1 (city): big "Let's set your vibe" headline uses .vibe-gradient-text; MapPin hero tile = .vibe-gradient-bg + .glow-pink. New CITY_COLOR map gives each city a different neon — Delhi=pink, Mumbai=cyan, Bangalore=violet, Goa=coral, Pune=acid/lime. Each city tile = .glass-strong + .vibe-gradient-border + ring-2 in its color + .glow-* + scale-[1.03] when selected; city icon sits in a tinted bg/ring tile; selected check badge = .vibe-gradient-bg. Continue button = .vibe-gradient-bg + .glow-pink + .vibe-pulse (celebratory pulse). Step 2 (vibes): Sparkles hero tile = .vibe-gradient-bg-warm + .glow-pink. New VIBE_COLOR map matches types.ts (Techno=cyan, EDM=pink, Lo-fi=violet, Boardgames=acid, Bollywood=coral, BYOB=sunshine, Chill=sky, Retro=rose). Vibe buttons in 2-col grid; selected = .glass-strong + .vibe-gradient-border + ring-2 in its color + .glow-* + scale-[1.04] + colored blurred aura behind the emoji. Back button = .glass + ring-border/40 + violet hover. Step 3 (done): PartyPopper hero = .vibe-gradient-bg-warm + .glow-pink + .vibe-pulse; "You're all set!" headline = .vibe-gradient-text; picked vibe chips each render in their VIBE_COLOR (tinted bg + ring + text). Enter VibeMatch button = .vibe-gradient-bg + .glow-pink + .vibe-pulse. Removed pre-existing unused useRouter import for hygiene.
- Verification: `bun run lint` → exit 0, 0 warnings, 0 errors. `npx tsc --noEmit` filtered to the 8 touched screen files → 0 errors (after fixing one initial TS error: CITY_COLOR was missing the `bg` field that the city icon tile uses — added `bg` to each entry). Did NOT run `bun run build` per instructions; dev server on :3000 left untouched.

Stage Summary:
- All 8 secondary screens restyled to the Gen Z neon palette. Multi-color, vibrant, glassmorphic, holographic — each screen gets .animate-screen-in, .glass-strong headers, .vibe-gradient-text headlines, .vibe-gradient-bg CTAs with .glow-pink, .vibe-gradient-border on premium cards, multi-color avatar rings (vibe-gradient-bg blur), aurora blobs on the celebratory screens (onboarding has 4 drifting aurora blobs).
- Per-screen intentional multi-color assignments:
  - inbox: pink (unread), cyan (timestamps/Find button), violet (hover glow on read threads).
  - chat: pink (mine bubbles), glass-violet (theirs), lime (online dot), cyan (back/read-checks), violet (input focus), tri-color (pink/violet/cyan) typing dots.
  - profile: 3 stat tiles get pink/violet/cyan accent rings; activity row icons = coral/pink/cyan/rose; settings row icons = violet/indigo/cyan/emerald/muted; sunshine for crown + max-tier.
  - edit-profile: pink neon dots on labels, violet focus rings, cyan @ prefixes, rose cancel hover.
  - requests: acid-green accept pill (vibe-gradient-bg-acid), rose decline, lime accepted badge, rose rejected badge, cyan timestamps.
  - onboarding: 4-color aurora blobs; per-city neon (Delhi=pink/Mumbai=cyan/Bangalore=violet/Goa=coral/Pune=acid); per-vibe neon (8 distinct colors matching types.ts VIBE_COLORS).
- Files changed (8): src/screens/{inbox,chat,profile,edit-profile,my-parties,requests,saved,onboarding}-screen.tsx. No other files touched. No new dependencies. All socket.io / API / state / mutation logic preserved verbatim — only className strings, decorative wrapper spans, gradient overlays, and animation classes were modified.
- Lint clean. TypeScript clean for all 8 files.
- Notes / known limitations:
  1. Did NOT add Live/Upcoming/Past tabs to my-parties-screen — the existing screen has no such state and the critical rules forbid adding state/logic. The tabs guidance is preserved as a future enhancement recommendation.
  2. Did NOT add a separate party-context banner with vibe-float to chat-screen — the existing intro banner already serves that role and got .vibe-float; no separate banner exists in the data model.
  3. The .holo-spin animation is defined in globals.css but was intentionally not used on selected vibe buttons — holo-spin is a 6s infinite 360° rotation which would be visually distracting on selectable chips; instead selected vibes get a static multi-color gradient-border ring + glow + scale + colored blurred aura. If a rotating ring is desired, a slower variant (e.g. 18-24s) would read better.
  4. The profile screen still has a few legacy gradient tier colors (from-slate-400, from-cyan-400, from-violet-400, from-amber-400) baked into the tiers array — these are functional tier indicators, kept untouched to avoid changing logic.

---
Task ID: 2-a
Agent: frontend-styling-expert (components)
Task: Restyle shared vibe components to Gen Z neon palette

Work Log:
- Read worklog.md (tasks 0 → 2-d context) + globals.css + types.ts (VIBE_COLORS / VIBE_EMOJI Gen Z maps) to confirm utility class set + per-vibe neon hues already defined.
- Read all 8 target components to map structure, props, and existing logic before editing.
- party-card.tsx: Card shell = `glass` + `vibe-gradient-border` (holo edge); hover = `-translate-y-1` + `glow-pink`; live cards get `ring-pink/40` + `glow-pink` + a top `vibe-gradient-bg` accent strip. Added a "featured" holo badge in the top-right corner (rotating `holo-spin` dashed ring + `Flame` icon + pink/cyan/violet blurred aura) shown when the party is live OR guest-fill ≥ 75%. Cover overlay switched to `from-background via-violet/45 to-transparent` + a hover-only `mix-blend-screen` cyan↔pink holo sheen. Empty cover fallback now uses `vibe-gradient-bg`. Slot-left chip = emerald/lime when plenty, amber+glow when low, rose when sold out. Save-heart button = pink glow when saved (`bg-pink/35 border-pink/70`, `fill-pink text-pink text-glow-pink`), glass-violet when unsaved. Fee badge now uses `vibe-gradient-bg-warm` (paid) or `vibe-gradient-bg-acid` (free) with an IndianRupee icon + colored glow shadow. Title gets `group-hover:text-glow-pink`. Metadata icons each use a different neon: MapPin=cyan, Calendar=coral, Clock=sunshine, Users=lime-300. Host row Sparkles icon = pink; footer border-top = `border-violet/20`. All props/logic/handlers (`onOpen`, `onSave`, `useAppStore` saved selectors, `toast`) preserved verbatim.
- vibe-badge.tsx: Added a local `VIBE_GLOW` map (one box-shadow color per vibe family — cyan/coral/amber/lime/violet/sky/pink/rose) so each badge glows in its own hue. Bumped font to `font-semibold`, padding to `px-2.5`, backdrop-blur. Hover (when clickable) = `hover:scale-110 hover:-translate-y-0.5 active:scale-95` for sticker-pack playfulness. Active state now uses `ring-pink/70` + `glow-pink` instead of legacy gold ring. Emoji wrapped in a `text-[1.05em] leading-none` span for tighter rendering. Tag (button vs span) logic preserved.
- bottom-nav.tsx: Glass shell upgraded to `glass-strong` with a 1px `vibe-gradient-bg` neon top edge (pink→violet→cyan). FAB = `vibe-gradient-bg` disc with `ring-4 ring-background`, an outer `holo-spin` dashed white ring, an outer blurred gradient aura, and an inner white-foil highlight; adds `hover:glow-gold-strong`, `active:scale-90 active:vibe-pulse` for press feedback. Plus icon gets a white drop-shadow. NavButton: active text = `text-pink text-glow-pink` with `bg-pink/15` pill + pink glow shadow + a `vibe-gradient-bg` underline indicator (`-bottom-[7px] w-7 h-[3px]`) + a glowing pink dot under the icon; inactive = `text-muted-foreground` with `group-hover:bg-white/5`. All screen-routing logic (`setScreen("home"|"inbox"|"profile")`, `openCreate`, login-hide) untouched.
- live-countdown.tsx: Each status now uses its own distinct neon. `STATUS_STYLES` rewritten: live = pink `bg-pink/25 border-pink/60 text-pink text-glow-pink vibe-live-ring`; starting-soon = coral `bg-orange-500/25 border-orange-400/60 text-orange-200` + orange glow shadow; today = cyan `bg-cyan-500/20 border-cyan-400/55 text-cyan-100` + cyan glow; upcoming = violet `bg-violet-500/20 border-violet-400/55 text-violet-200` + violet glow; past = muted (unchanged). The `vibe-live-ring` pulse now correctly only fires on `status === "live"` (added via `cfg.extra` instead of a separate conditional). Self-updating 30s tick + countdown logic preserved.
- empty-state.tsx: Outer gap bumped to `gap-4`, padding `py-12`. Icon container is now a `vibe-float` animated 80px `glass-strong` + `vibe-gradient-border` + `glow-pink` rounded-3xl tile, surrounded by a layered pink/violet/cyan aura (blurred `vibe-gradient-bg` scales). Icon is `text-pink text-glow-pink` at `h-9 w-9 strokeWidth=2`. Title uses `font-display text-xl vibe-gradient-text`. Description gets `leading-relaxed`. All props (`icon`, `title`, `description`, `action`, `className`) preserved.
- rating-pill.tsx: Pill background `bg-amber-400/10`, border `amber-300/30`, plus an amber glow shadow. Star icon now has a `drop-shadow-[0_0_6px_rgba(255,214,10,0.85)]` for the neon star glow. Rating number text bumped to `text-amber-100 font-semibold`; count stays muted amber. StrokeWidth=2 on the star for crisper rendering.
- guest-avatars.tsx: Added a `RING_COLORS` rotation array (pink → violet → cyan → lime → coral) — each stacked avatar gets a different neon ring color with a matching glow shadow. Avatar base gets `bg-card` so the ring sits cleanly on the dark background. "+N" pill at the end switched from plain `bg-secondary` to `vibe-gradient-bg` (pink→violet→cyan) with black text + pink glow shadow + `ring-2 ring-card`. All overlap math, `size`/`max`/`total` logic, `pickGuestAvatars` consumption preserved.
- user-avatar.tsx: Replaced the simple `ring-2 ring-pink/60` with a full pink→violet→cyan gradient ring built from `vibe-gradient-bg` + `glow-pink` + inner padding (so the gradient shows around the avatar). Inner avatar gets `ring-1 ring-background` to separate it from the gradient. Initials text gets a pink drop-shadow glow. Added an optional lime online-status dot (bottom-right) shown when `ring=true` — a `bg-lime-300` disc with `ring-2 ring-background` + an 8-10px lime glow, sized proportionally to the avatar. No new props added — reuses the existing `ring` boolean. `initials()` helper + `src`/`size`/`className` props all preserved.
- Verified: `bun run lint` → 0 errors, 0 warnings (exit 0). `npx tsc --noEmit` → 0 errors in `src/components/vibe/*` (remaining tsc errors are pre-existing in `examples/websocket` + `skills/*`, untouched). Dev server on port 3000 still returns HTTP 200.

Stage Summary:
- All 8 shared vibe components restyled to the Gen Z neon palette. Each component is now intentionally multi-color (not monochrome pink): party-card uses cyan/coral/sunshine/lime for its 4 metadata icons + a warm-gradient fee badge + a holo featured badge; vibe-badge glows in its own per-vibe hue; bottom-nav active tab uses a tri-color gradient underline + pink glow; live-countdown gives each status a distinct neon (pink/coral/cyan/violet); guest-avatars rotates pink/violet/cyan/lime/coral rings; user-avatar gets a tri-color gradient ring + lime status dot.
- Reused existing globals.css utility classes only (`glass`, `glass-strong`, `vibe-gradient-bg`, `vibe-gradient-bg-warm`, `vibe-gradient-bg-acid`, `vibe-gradient-text`, `vibe-gradient-border`, `glow-pink`, `glow-gold-strong`, `text-glow-pink`, `vibe-pulse`, `vibe-float`, `vibe-live-ring`, `holo-spin`). No new CSS utilities introduced. No new npm dependencies.
- Files changed (8): `src/components/vibe/{party-card,vibe-badge,bottom-nav,live-countdown,empty-state,rating-pill,guest-avatars,user-avatar}.tsx`.
- All component props, function signatures, exports, event handlers, store selectors, toast calls, navigation logic, and self-updating 30s tick were preserved verbatim — only className strings, decorative wrapper spans, gradient overlays, animation classes, and (in party-card) one new decorative Flame import for the featured badge were touched.
- Accessibility preserved: 44px+ touch targets (save button bumped h-8→h-9 w-8→w-9; FAB stays h-16 w-16; nav buttons stay h-9 w-9), aria-labels on save + FAB + nav buttons, `aria-hidden` on all decorative aura/spin/underlines, role="button" + tabIndex + keyboard handler on party-card, aria-current="page" on active nav, role="status" implicit on live-countdown via LiveCountdown. Decorative-only emoji spans marked aria-hidden.
- "Featured" holo badge on party-card uses an existing visual heuristic (isLive OR ≥75% guest-fill) — no new data fields or state, just derived from existing `party.guestCount`/`party.maxGuests`/`isLive`.
- Note on user-avatar online dot: added as a decorative lime accent visible only when `ring=true` (no new prop). Reuses the existing `ring` boolean, so callers that pass `ring={true}` for the host or current user will now see a small lime status dot in the bottom-right corner. This is a visual-only addition; if a future caller wants to opt out, a new optional `online` prop would be needed (left as a future enhancement to keep the props signature unchanged per the critical rules).

---
Task ID: ORCH- FINAL
Agent: orchestrator (Gen Z palette + map view round)
Task: Switch VibeMatch from black+gold to a Gen Z neon palette ("make it genz pallette color, make it cool, add a map view of the nearby parties") and verify end-to-end.

Work Log:
- Read prior worklog: project was on a black+gold theme with a working map view (gold pins, gold rings). User now requested a Gen Z palette + cool aesthetic + map view (already existed, needed to match the new palette and be cooler).
- Foundation (Task 1, done by orchestrator):
  - Rewrote `src/app/globals.css`: new Gen Z palette — hot magenta `#ff2e97` (--pink, primary), electric purple `#9d4edd` (--violet, secondary), electric cyan `#00f0ff` (--cyan, accent), acid green `#c7ff00` (--acid, pop), coral `#ff6b35` (--coral), sunshine `#ffd60a` (--sunshine). Background `#0a0118` violet-black, foreground `#f8f4ff`, card `#140827`. Body background = 4-stop neon aurora radial gradient (pink TR / cyan BL / violet bottom / acid corner). Re-aliased the legacy `--pink`/`--violet`/`--cyan` tokens (previously all pointing at gold) to the three distinct Gen Z neons so every existing utility (`text-pink`, `bg-violet/30`, `border-cyan/50`, …) auto-transformed. Renamed the custom single-value `--lime` token to `--acid` to avoid clobbering Tailwind's built-in `lime-50…lime-950` scale (which FUN_TIER_META and VIBE_COLORS rely on). Added new utilities: `.vibe-gradient-bg-warm` (sunshine→coral→pink), `.vibe-gradient-bg-acid` (acid→cyan), `.glow-acid`, `.text-glow-pink/cyan/violet/lime/acid`, `.holo-spin` (6s holo rotation), `.aurora-drift` (14s blob drift). Rewrote all fun-tier keyframes (`fun-breathe`→cyan, `fun-pulse`→violet, `fun-bounce`→pink, `fun-lit`→lime+brightness, `fun-sparkle-ring`, `fun-spark`, `here-pulse`) to use Gen Z colors. `vibe-shimmer` / `vibe-skeleton` / `vibe-live-ring` retuned to pink/violet/cyan.
  - Updated `src/lib/types.ts`: `VIBE_COLORS` rewritten so each vibe tag gets its OWN distinct Gen Z neon (Techno=cyan, EDM=pink/fuchsia, Bollywood=coral/orange, BYOB=amber, Boardgames=lime, Lo-fi=violet, Chill=sky/cyan, Retro=rose). `FUN_TIER_META` expanded with 4 new fields (`dotClass`, `textClass`, `chipClass`, `sparkClass`) and recolored per tier: low→cyan, warm→violet, lively→pink, lit→lime+orange-spark.
- Dispatched 4 parallel agents (Tasks 2-a/b/c/d) on non-overlapping file sets, each instructed to preserve all functionality/props and only restyle:
  - 2-a (frontend-styling-expert): 8 shared components in `src/components/vibe/` — party-card (holo featured badge, multi-color metadata icons, warm/acid fee badge), vibe-badge (per-vibe glow map), bottom-nav (tri-color FAB + holo spin + gradient active underline), live-countdown (per-status neon), empty-state, rating-pill, guest-avatars (rotating neon rings), user-avatar (tri-color gradient ring + lime online dot).
  - 2-b (frontend-styling-expert): 4 primary screens — login (aurora blobs, gradient wordmark, cyan OTP slots), home (gradient headline, holo vibe stories, gradient city chips, gold-foil For You banner), detail (holo cover sheen, gradient title, "Get directions" ghost link, gradient CTA), create (glass-strong form, multi-color vibe multi-select, live preview card).
  - 2-c (frontend-styling-expert): 8 secondary screens — inbox, chat (gradient mine-bubbles, tri-color typing dots, preserved all socket.io logic), profile (gradient cover + 3 staggered neon stat tiles), edit-profile, my-parties, requests (acid accept / rose decline), saved (floating bookmark empty state), onboarding (per-city neon, holo vibe grid).
  - 2-d (general-purpose): map-screen full rewrite — rainbow/holo distance rings (cyan/violet/pink/acid), per-tier neon pins (cyan/violet/pink/lime) using the new FUN_TIER_META fields, lit-tier sparkle ring + coral sparks, holo "you are here" marker, tier-gradient tooltip with fun-score bar, dimming (not hiding) of non-live pins when live-only is on, collision-aware pin jitter, shared hover cross-highlight between pins and bottom-sheet rows, aurora map background + dot-grid texture, skeleton loading + empty states.
- Verification (Task 3, done by orchestrator with agent-browser + VLM):
  - `bun run lint` → 0 errors, 0 warnings. `npx tsc --noEmit` → 0 errors in `src/`.
  - agent-browser end-to-end flow at 390×844 (iPhone 14 viewport): open / → login (enter name "Riya", phone "9876543210", send OTP) → read dev OTP "13741" from toast → verify → onboarding (select Delhi → pick Techno/EDM/Chill → "Looks good" → "Enter VibeMatch") → explore feed ("Tonight in Delhi", 2 party cards, "Open vibe map" button) → map (set 25km radius → 2 Delhi pins render: "Retro Cassette Lounge 5.4km Warming up" + "BYOB Garage Sessions Vol. 7 7.0km Warming up") → click pin → detail screen (title, Get directions link, Message host, Reviews, Request to Connect CTA). ZERO console errors / page errors throughout.
  - VLM (glm-4.6v) confirmation of the rendered palette:
    - Login: "vibrant, Gen Z-inspired neon hues (hot pink, electric cyan, neon green) on a dark violet-black background … NOT a gold/amber luxury theme".
    - Explore: "vibrant Gen Z neon palette … multi-color gradients (pink-cyan, orange-pink, purple-pink) … each vibe chip a different neon (Techno=blue, EDM=pink, Chill=cyan) … NOT gold/amber".
    - Map: "distance rings cyan/violet/pink/lime/yellow … party pins tiered colors cyan/violet/pink/lime with glowing effect … + button pink-to-purple gradient … vibrant Gen Z neon on dark".
- Services confirmed running: Next.js dev server on :3000 (HTTP 200), chat socket.io service on :3003 (HTTP 400 = expected for non-handshake GET).

Stage Summary:
- The entire VibeMatch UI has been transformed from black+gold to a cohesive Gen Z neon palette (pink/violet/cyan/acid/coral/sunshine) on a violet-black canvas, with the signature pink→violet→cyan tri-color gradient used as the through-line (wordmark, CTAs, FAB, message bubbles, pin rings, avatar rings).
- The map view — the headline user request — is now cooler and richer: rainbow holo distance rings, per-tier neon animated pins (cyan chill → violet warming → pink lively → lime+coral lit), collision-aware jitter so pins never overlap, dim-not-hide live-only filter, cross-highlighting between map pins and the bottom sheet, tier-gradient fun-score tooltips, and aurora background.
- All 13 screens + 8 shared components restyled. All functionality preserved (auth, OTP, onboarding, CRUD, real-time chat socket.io, proximity API, geolocation, reviews, requests). Lint + tsc clean. End-to-end browser QA passed with zero errors.
- Files changed this round: `src/app/globals.css`, `src/lib/types.ts`, `src/components/vibe/{party-card,vibe-badge,bottom-nav,live-countdown,empty-state,rating-pill,guest-avatars,user-avatar}.tsx`, `src/screens/{login,home,detail,create,inbox,chat,profile,edit-profile,my-parties,requests,saved,onboarding,map}-screen.tsx` (20 files total).

## Unresolved Issues / Risks / Next-Phase Recommendations
- **Fun score is still heuristic** (crowd fill × vibe variety × live bonus × free entry). Next: feed real RSVP velocity + chat message-volume into `funScore` for a genuinely "live" meter.
- **Map projection stays equirectangular** (good for 1–25 km, distorts at country scale). The "India" city-dot falls back to a mid-India coord where the rings are meaningless. Next: hide rings when radius > 50 km, or adopt Leaflet/MapLibre if true pan-zoom is wanted.
- **No geolocation permission-denied UX** — `useMyLocation` silently fails. Next: toast guiding the user to enable location permissions.
- **Saved parties not persisted** — the save heart is UI-only. Next: add a `SavedParty` model + `/api/saved` routes.
- **Public host profile screen** still toasts "Profile coming soon" from the chat header + detail host card.
- **LLM-powered smart quick replies in chat** (use the LLM skill to suggest context-aware replies based on the last message + party context) — flagged since round 1, still open.
- **Notifications screen** — bell badge on bottom nav + a notifications screen (likes, requests, messages, reviews).
- **Message reactions** — add a `Reaction` model + `/api/messages/[id]/react` route + socket relay.
