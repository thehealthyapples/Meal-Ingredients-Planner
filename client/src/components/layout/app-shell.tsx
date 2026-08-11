// NAV1 — The shared THA application shell.
//
// The walls of the house (Experience Blueprint § 5.2). Every authenticated page
// stands inside this one shell and none of them draws it: the room threshold,
// the header zone, the room content, the contextual rail and the bottom nav are
// declared here, once.
//
// This file did not create the shell — it NAMES it. Before NAV1 the shell was
// inline JSX inside `ProtectedRoute` in `App.tsx`, which meant the app's layout
// had no owner you could import, test, or point at. The routing file now routes,
// and the shell file now shells.
//
// EXP1 (2026-07-20) — THE ROOM BEGINS AT THE VERY TOP OF THE BROWSER.
// The approved North Star ("NorthStar Final") governs: the environment is part
// of the room, not a banner beneath a toolbar. The permanent header bar that
// stood ABOVE the room is retired; the room threshold (view/light + identity)
// is painted first, the workspace pill stands at its fade boundary and sticks —
// compressing, not stacking — and the one Companion door is fixed top-right.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

import { BottomNav, NAV_ITEMS, AppRealmContext } from "@/components/nav-bar";
import { ErrorBoundary } from "@/components/error-boundary";
import { OrchardRoomWindow } from "@/components/layout/orchard-backdrop";
import { DressingLayer } from "@/components/layout/dressing-layer";
import FloatingAssistant from "@/components/conversation/FloatingAssistant";
import { CompanionContextProvider } from "@/components/conversation/companion-context";
import {
  WorkspaceHeader,
  WorkspaceHeaderSlotContext,
  WorkspaceChromeContext,
  pageContainerClass,
  type PageRealm,
} from "@/components/workspace-header";
import {
  PageHeaderPresenceContext,
  RoomActionsPresenceContext,
  RoomActionsSlotContext,
  type SlotPresence,
} from "@/components/layout/shell-slots";
import TrialBanner from "@/components/TrialBanner";
import SiteBanner from "@/components/SiteBanner";

/*
 * Room names are NOT redeclared here. `NAV_ITEMS` is the single source of truth
 * for every navigation surface, and a second list of room names would be a
 * second owner of every room's name (Adoption Register row 2). The shell reads
 * the label from there and adds only what that list does not hold: the realm
 * tint, and the names of the authenticated surfaces that are not rooms.
 */
const REALM_BY_HREF: Record<string, PageRealm> = {
  "/home": "home",
  "/planner": "planner",
  "/cookbook": "cookbook",
  "/shopping-workspace": "shopping",
  "/pantry": "pantry",
  "/nutrition": "nutrition",
  "/my-diary": "diary",
  "/analyser": "analyser",
  "/orchard": "orchard",
  // EXP1 — Household and Admin joined the shelf; their realms stay `home`
  // (no new realm was coined — a realm is a palette fact, not a nav fact).
};

/**
 * Authenticated surfaces that are not rooms in `NAV_ITEMS` and so have no
 * canonical label of their own. Only the HEADERLESS ones strictly need an entry
 * — the rest replace this header the moment they render — but a page that has
 * its own header still passes through here while its chunk loads, so the title
 * is correct during the wait rather than blank and then correct.
 *
 * EXP1 — the `/profile` row is gone: Household is a canonical room on
 * `NAV_ITEMS` now, so its name has exactly one owner again.
 */
const NON_ROOM_TITLES: Array<[test: (path: string) => boolean, title: string, realm: PageRealm]> = [
  [(p) => p.startsWith("/admin"), "Admin", "home"],
  [(p) => p === "/compare", "Compare foods", "analyser"],
  [(p) => p === "/import-recipe", "Import recipe", "cookbook"],
  [(p) => p === "/quick-meal", "Quick meal", "cookbook"],
  [(p) => p.startsWith("/meals/"), "Meal", "cookbook"],
  [(p) => p.startsWith("/foods/"), "Food", "analyser"],
  [(p) => p === "/dashboard", "Dashboard", "home"],
  [(p) => p === "/supermarkets", "Supermarkets", "shopping"],
  [(p) => p === "/privacy-settings", "Privacy", "home"],
  [(p) => p === "/help", "Help", "home"],
  [(p) => p === "/contact", "Contact", "home"],
];

/**
 * EXPADOPT1 (2026-07-20) — THE ORCHARD EXPOSURE OF EVERY ROOM.
 *
 * Blueprint § 5.1 is the canonical map and this is its projection, nothing more.
 * Every value below is READ OFF that table; not one is a judgement made here.
 *
 *   Home       E3   drawn by the room itself (`OrchardWindow`) — not by this map
 *   Cookbook   E2   Pantry E2 · Nutrition E2 · Diary E2 · Orchard E2
 *   Planner    E1   Shopping E1 · Analyser E1 · Household/Profile E1
 *   Admin      E0   dialogs and overlays E0
 *
 * Exposure is a PER-DOMAIN CONSTANT (§ 6.2 rule 1) — "never a per-surface or
 * per-component choice, never adjusted for taste mid-feature." Declaring it here,
 * beside the realm resolution the shell already owns, is what makes that true by
 * construction: a room cannot choose its own exposure because a room is never
 * asked. GEA6 — "the orchard is a permanent fact of the site, not a feature of a
 * room" — is the principle, and one shell-level mount is its mechanism.
 *
 * E1 renders the house's morning LIGHT at the threshold (no image — § 6.2 gives
 * it "light only"), E0 renders nothing at all: shuttered, not relocated.
 *
 * NOT a default. An unmapped path falls to "e1" — the safe direction, because a
 * room that should have had a window and has none is quiet, whereas a dense
 * working surface that wrongly gained one is the "all view, no room" anti-pattern
 * (§ 16). Absence is the recoverable error.
 */
const ROOM_EXPOSURE: Record<string, "e0" | "e1" | "e2"> = {
  cookbook: "e2",
  pantry: "e2",
  nutrition: "e2",
  diary: "e2",
  orchard: "e2",
  planner: "e1",
  shopping: "e1",
  analyser: "e1",
  basket: "e1",
  list: "e1",
  home: "e1", // Home draws its OWN E3 window; the shell must not draw a second.
};

/*
 * INTARCH1 — THE GROUND POSTURE OF EVERY ROOM.
 *
 * A straight projection of the "Ground posture" column of the map at
 * `THA_EXPERIENCE_BLUEPRINT.md` § 5.1. No value here is a judgement made in this
 * file; each row is the § 5.1 posture reduced to the one thing the material
 * system permits a room to vary — how much air it holds around its ground plane
 * (§ 8.2: "one radius law, one shadow definition, different proportions and
 * density per room"). The material, radius, shadow and blur are identical in
 * every room and are owned by `.room-ground` in index.css.
 *
 * HOME IS DELIBERATELY ABSENT, and this is the load-bearing omission. § 8.2
 * fixes "one ground per workspace, NEVER NESTED", and Home already has one: the
 * plaster wall beneath its sill (`.home-room`). Home resolves to `none`.
 *
 * NOT A DEFAULT. An unmapped path falls to "none" and draws nothing.
 */
const ROOM_GROUND: Record<string, "full" | "room" | "air" | "none"> = {
  planner: "full",
  analyser: "full",
  cookbook: "room",
  pantry: "room",
  nutrition: "room",
  orchard: "room",
  diary: "air",
  shopping: "air",
  basket: "air",
  list: "air",
  home: "none", // Home owns its own ground (`.home-room`); never nest a second.
};

/** Routes that render the same room as a canonical nav destination. */
const ROOM_ALIASES: Record<string, string> = {
  "/diary": "/my-diary",
  "/meals": "/cookbook",
  "/weekly-planner": "/planner",
  "/products": "/analyser",
  // LARDER Pass 1 — the empty Living Larder room renders at /larder while it is
  // built (furniture-first, across passes). It IS the Larder room, so the shell
  // draws it the same threshold, identity and ground as the nav "Larder"
  // (/pantry): one owner of the room's identity (EXP1), never a second.
  "/larder": "/pantry",
};

/**
 * EXP1 — THE PURPOSE OF EVERY ROOM, said once, at the threshold.
 *
 * One line per room, keyed on the room's canonical href so the room's NAME
 * stays `NAV_ITEMS`' and only its purpose lives here. These are the rooms'
 * FACTS — what a room is for — never coaching, judgement or interpretation
 * (GEA21: rooms report; the Companion understands).
 */
const ROOM_PURPOSE: Record<string, string> = {
  "/planner": "The week's meals, planned around your household.",
  "/cookbook": "Discover, create and cook meals your household will love.",
  "/shopping-workspace": "One list, ready for the shop.",
  "/pantry": "See what you keep.",
  "/nutrition": "The variety on the household's table.",
  "/my-diary": "A quiet record of the household's days.",
  "/analyser": "A closer look at packaged food.",
  "/orchard": "The neighbourhood beyond the fence.",
  "/profile": "The people this home cooks for.",
};

export function resolveShellRoom(path: string): { title: string; realm: PageRealm } {
  const canonical = ROOM_ALIASES[path] ?? path;
  const room = NAV_ITEMS.find((item) => item.href === canonical);
  if (room) return { title: room.label, realm: REALM_BY_HREF[room.href] ?? "home" };

  for (const [test, title, realm] of NON_ROOM_TITLES) {
    if (test(path)) return { title, realm };
  }
  // An unknown authenticated path still gets the house's walls. The nav and
  // the Companion are the household's way OUT of a page that has gone wrong —
  // a nameless room is recoverable, a headerless one is not.
  return { title: "", realm: "home" };
}

/*
 * INTARCH1 — resolving a room's ground.
 *
 *   /admin/*   § 5.1 "Admin — solid working ground" → full.
 *   /profile   § 5.1 "Household / Profile — the family record" → air.
 *
 * WHAT IS DELIBERATELY NOT LISTED: /dashboard, /privacy-settings, /help,
 * /contact, /supermarkets, /compare and the two detail routes. § 5.1 does not
 * name any of them as a room, so none is given a ground here. They stand on
 * the warm canvas, as they did.
 */
function resolveShellGround(path: string): "full" | "room" | "air" | "none" {
  if (path.startsWith("/admin")) return "full";
  if (path === "/profile") return "air";
  return ROOM_GROUND[resolveShellRoom(path).realm] ?? "none";
}

function ShellHeader() {
  const [location] = useLocation();
  const { title, realm } = resolveShellRoom(location);
  return <WorkspaceHeader role="shell" title={title} realm={realm} />;
}

/* ── EXP1 — THE ROOM THRESHOLD ────────────────────────────────────────────────
 *
 * The top of every room: the view (E2), the morning light (E1), or nothing at
 * all (E0 — shuttered), with the room's name and purpose standing at the
 * threshold on the ground-plane scrim. The identity is the SHELL's to draw —
 * it is orientation, the answer to the Experience Test's "which room is this?",
 * and a room cannot be trusted to introduce itself differently per page.
 *
 * The type NEVER sits on the view: the scrim beneath it is ground plane, which
 * is Blueprint § 6.1's own non-negotiable remedy. Home draws no threshold here
 * — its E3 window and welcome ARE its threshold, owned by the room since NORTH4.
 */
// Concept Lock P1 — the Living Home rooms are immersive: the Environment Plate is
// the page. The shell's threshold banner (orchard window + room identity) and its
// default header stand down for them, leaving only essential navigation, the
// Companion and trust notices. Technology recedes behind the room.
const LIVING_HOME_ROUTES = new Set<string>(["/pantry", "/pantry/fridge-preview"]);
function isLivingHomeRoom(path: string): boolean {
  return LIVING_HOME_ROUTES.has(ROOM_ALIASES[path] ?? path);
}

function RoomThreshold({ path }: { path: string }) {
  const canonical = ROOM_ALIASES[path] ?? path;
  if (canonical === "/home") return null;
  if (isLivingHomeRoom(canonical)) return null; // the Environment Plate is the page

  const { title, realm } = resolveShellRoom(path);
  const exposure = path.startsWith("/admin") ? "e0" : ROOM_EXPOSURE[realm] ?? "e1";
  if (exposure === "e0") return null;

  const isRoom = NAV_ITEMS.some((item) => item.href === canonical);
  const purpose = ROOM_PURPOSE[canonical];

  return (
    <div className="room-threshold" data-exposure={exposure} data-testid="room-threshold">
      {exposure === "e2" ? (
        <>
          <OrchardRoomWindow exposure="e2" />
          {/* Environmental Dressing (LH1): the home's standing welcome, on the sill
              of the committed E2 window band. Renders nothing where refused (§ 5.1)
              or where there is no view. The one mouth: dressing-layer.tsx. */}
          <DressingLayer room={realm} exposure="e2" />
        </>
      ) : (
        <div className="room-threshold-light" aria-hidden />
      )}
      {isRoom && (
        <>
          <div className="room-threshold-scrim" aria-hidden />
          <div className="room-threshold-identity">
            {/* The identity aligns to the canonical content column — resolved
                through its one owner (`pageContainerClass`), never a second
                hand-rolled container string (PX1-W4.5). The column's top
                padding is not wanted at the threshold and is zeroed. */}
            <div className={`${pageContainerClass(true)} !pt-0`}>
              {/* The pill's h1 is the document's heading; this is the room's
                  sign at the door — presentation of the same one name. */}
              <p className="room-threshold-title realm-title" aria-hidden data-testid="room-threshold-title">
                {title}
              </p>
              {purpose && <p className="room-threshold-purpose">{purpose}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── The shell ───────────────────────────────────────────────────────────────── */

export function AppShell({
  children,
  isLoading = false,
  showTrialBanner = false,
}: {
  children: ReactNode;
  isLoading?: boolean;
  showTrialBanner?: boolean;
}) {
  const [location] = useLocation();
  const canonical = ROOM_ALIASES[location] ?? location;
  const shellGround = resolveShellGround(location);
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const [railSlot, setRailSlot] = useState<HTMLDivElement | null>(null);
  const [pageHeaders, setPageHeaders] = useState(0);
  const [roomActions, setRoomActions] = useState(0);
  const [activeRealm, setActiveRealm] = useState("home");

  // EXP1 — has the household scrolled the threshold away? A sentinel at the
  // top of the room's flow answers; the header zone below is sticky and its
  // contents compress the moment the sentinel leaves the viewport. One
  // observer for the house — a page never decides it is stuck.
  const [stuck, setStuck] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [location]);

  // The room's identity is on screen at rest when the shell's threshold names
  // it — or on Home, whose window and welcome are its own threshold.
  const thresholdExposure = location.startsWith("/admin")
    ? "e0"
    : ROOM_EXPOSURE[resolveShellRoom(location).realm] ?? "e1";
  const roomIdentity =
    canonical === "/home" ||
    (thresholdExposure !== "e0" && NAV_ITEMS.some((item) => item.href === canonical));

  const registerPageHeader = useCallback(() => {
    setPageHeaders((n) => n + 1);
    return () => setPageHeaders((n) => n - 1);
  }, []);
  const registerRoomActions = useCallback(() => {
    setRoomActions((n) => n + 1);
    return () => setRoomActions((n) => n - 1);
  }, []);

  // Stable identities: a fresh object each render would re-fire every consumer's
  // registration effect on every render, which is a mount/unmount loop.
  const [headerPresence] = useState<SlotPresence>(() => ({ register: registerPageHeader }));
  const [railPresence] = useState<SlotPresence>(() => ({ register: registerRoomActions }));
  const realmContext = { realm: activeRealm, setRealm: setActiveRealm };

  return (
    <AppRealmContext.Provider value={realmContext}>
      <WorkspaceHeaderSlotContext.Provider value={headerSlot}>
        <WorkspaceChromeContext.Provider value={{ stuck, roomIdentity }}>
          <PageHeaderPresenceContext.Provider value={headerPresence}>
            <RoomActionsSlotContext.Provider value={railSlot}>
              <RoomActionsPresenceContext.Provider value={railPresence}>
                {/* PHASE5D — the Companion Context Channel wraps the routed page (which
                    publishes the pointers on screen) and the one FloatingAssistant (which
                    reads them). One channel, one assistant — never one per surface. */}
                <CompanionContextProvider>
                  <div className="relative min-h-[100dvh]">
                    <div className="relative z-10 flex flex-col h-[100dvh]">
                      {/* Trust notices may stand above the room: a household must
                          be able to read what THA owes them before the room greets
                          them. Hospitality yields to honesty here, and only here. */}
                      {showTrialBanner && <TrialBanner />}
                      <SiteBanner />

                      <div className="flex flex-1 overflow-hidden">
                        {/* The contextual rail (UX1 unchanged: not navigation; BottomNav
                            remains the sole primary navigation at every size). `lg`+ only,
                            and NOT RENDERED AT ALL until a room declares actions. */}
                        {roomActions > 0 && (
                          <aside
                            className="hidden lg:flex w-[220px] shrink-0 flex-col overflow-y-auto border-r border-border px-3 py-4"
                            aria-label="Room actions"
                            data-testid="room-actions-rail"
                          >
                            <div ref={setRailSlot} className="flex flex-col gap-1" />
                          </aside>
                        )}

                        <main className="relative flex-1 overflow-y-auto overflow-x-hidden main-safe flex flex-col">
                          {/* EXP1 — the room begins here, at the very top of the
                              browser: threshold first (view/light + identity, in
                              flow, scrolling away with the room), then the sticky
                              header zone at its fade boundary. The old permanent
                              bar above the room is retired. */}
                          <RoomThreshold path={location} />

                          {/* The stuck sentinel — 1px of the room's own flow. While
                              it is visible the pill floats at rest; the moment it
                              scrolls out, the zone below is stuck and compresses. */}
                          <div ref={sentinelRef} aria-hidden className="h-px w-full shrink-0 -mb-px" />

                          {/* The sticky header zone. The slot is where a page's own
                              header portals to; the default below it stands in
                              whenever no page header is mounted — including while a
                              chunk loads, while the session resolves, and after a
                              caught error (NAV1, preserved). */}
                          <div className="sticky top-0 z-40 shrink-0" data-testid="ws-header-zone">
                            <div ref={setHeaderSlot} className="w-full" data-testid="ws-header-slot" />
                            {pageHeaders === 0 && !isLivingHomeRoom(location) && <ShellHeader />}
                          </div>

                          {/* INTARCH1 — the room's ground plane. Mounted ONCE, here:
                              the middle ground is "the only layer that varies by
                              domain", and a layer that varies by domain is a property
                              of the house, not a decision each room makes (GEA19). */}
                          {isLoading ? (
                            <div className="flex h-full items-center justify-center">
                              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                            </div>
                          ) : shellGround === "none" ? (
                            // PX1-W0 (fnd-px-error-renders-as-empty). The boundary sits
                            // INSIDE the shell — the header and the bottom nav survive,
                            // so a broken surface is never one the household cannot
                            // leave. Keyed on the location so walking away unbreaks it.
                            <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>
                          ) : (
                            <div
                              className={`room-ground room-ground--${shellGround} flex-1 flex flex-col min-h-0`}
                              data-room-ground={shellGround}
                            >
                              <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>
                            </div>
                          )}
                        </main>
                      </div>

                      <BottomNav />
                    </div>
                  </div>
                  <FloatingAssistant />
                </CompanionContextProvider>
              </RoomActionsPresenceContext.Provider>
            </RoomActionsSlotContext.Provider>
          </PageHeaderPresenceContext.Provider>
        </WorkspaceChromeContext.Provider>
      </WorkspaceHeaderSlotContext.Provider>
    </AppRealmContext.Provider>
  );
}
