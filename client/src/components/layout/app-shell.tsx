// NAV1 — The shared THA application shell.
//
// The walls of the house (Experience Blueprint § 5.2). Every authenticated page
// stands inside this one shell and none of them draws it: the top header, the
// room content, the contextual rail and the bottom nav are declared here, once.
//
// This file did not create the shell — it NAMES it. Before NAV1 the shell was
// inline JSX inside `ProtectedRoute` in `App.tsx`, which meant the app's layout
// had no owner you could import, test, or point at. The routing file now routes,
// and the shell file now shells.
//
// What NAV1 genuinely ADDS is header permanence — see `ShellHeader` below.

import { useCallback, useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

import { BottomNav, NAV_ITEMS, AppRealmContext } from "@/components/nav-bar";
import { ErrorBoundary } from "@/components/error-boundary";
import { OrchardRoomWindow } from "@/components/layout/orchard-backdrop";
import FloatingAssistant from "@/components/conversation/FloatingAssistant";
import { CompanionContextProvider } from "@/components/conversation/companion-context";
import {
  WorkspaceHeader,
  WorkspaceHeaderSlotContext,
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

/* ── The default header ───────────────────────────────────────────────────────
 *
 * THE DEFECT NAV1 CLOSES.
 *
 * `WorkspaceHeader` portals into a slot this shell provides, which means a page
 * only had a header if it chose to render one. Measured before the change:
 *
 *   • `/compare` (food-comparison-page)   — no header at all
 *   • `/import-recipe`                     — no header at all
 *   • all 13 `/admin/*` pages              — no header at all
 *   • every `isLoading` state, every lazy-chunk `Suspense` fallback, and every
 *     caught render error — the slot is EMPTY, so walking between rooms
 *     transiently painted a headerless app.
 *
 * The header is now the shell's, not the page's. The shell renders it by
 * default; a page that renders its own REPLACES it rather than adding to it, so
 * there is exactly one header on screen at all times and not one page file had
 * to change to gain one.
 *
 * This is deliberately NOT a second header component. The default is the SAME
 * `WorkspaceHeader` every room already uses, rendered with `role="shell"` so it
 * does not register itself and cancel its own fallback. One owner of the banner
 * (Adoption Register row 1), used two ways.
 *
 * Which room is this? — the question the Experience Test (Blueprint § 15.3)
 * requires every screen to answer. The shell must be able to answer it even
 * before the page has loaded.
 *
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
};

/**
 * Authenticated surfaces that are not rooms in `NAV_ITEMS` and so have no
 * canonical label of their own. Only the HEADERLESS ones strictly need an entry
 * — the rest replace this header the moment they render — but a page that has
 * its own header still passes through here while its chunk loads, so the title
 * is correct during the wait rather than blank and then correct.
 */
const NON_ROOM_TITLES: Array<[test: (path: string) => boolean, title: string, realm: PageRealm]> = [
  [(p) => p.startsWith("/admin"), "Admin", "home"],
  [(p) => p === "/compare", "Compare foods", "analyser"],
  [(p) => p === "/import-recipe", "Import recipe", "cookbook"],
  [(p) => p === "/quick-meal", "Quick meal", "cookbook"],
  [(p) => p.startsWith("/meals/"), "Meal", "cookbook"],
  [(p) => p.startsWith("/foods/"), "Food", "analyser"],
  [(p) => p === "/dashboard", "Dashboard", "home"],
  [(p) => p === "/profile", "Profile", "home"],
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
 * E1 and E0 differ from each other in the canon (light-only vs lit-from-the-hall)
 * but not in what is DRAWN: § 6.2 gives both "no orchard image", and ODL2 valued
 * both tokens at 0 for exactly that reason. Both render nothing here. They are
 * distinguished so the map stays readable against § 5.1, not to produce two
 * pictures.
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
 *   § 5.1 posture                            → posture here
 *   ─────────────────────────────────────────────────────────
 *   Planner   "one solid table holding the week"   → full
 *   Analyser  "the bench"                          → full
 *   Admin     "solid working ground"               → full
 *   Cookbook  "shelf; recipe cards as objects"     → room
 *   Pantry    "shelf strata"                       → room
 *   Nutrition "noticeboard tier over a solid tier" → room
 *   Orchard   "ground plane; neighbours on it"     → room
 *   Diary     "lap desk; the MOST AIR in the house"→ air
 *   Shopping  "one note sized to its list"         → air
 *   Profile   "the record; anchored strata"        → air
 *
 * HOME IS DELIBERATELY ABSENT, and this is the load-bearing omission. § 8.2
 * fixes "one ground per workspace, NEVER NESTED", and Home already has one: the
 * plaster wall beneath its sill (`.home-room`), which is the compact counter
 * § 5.1 gives it. Laying a second plane inside that wall is precisely the
 * nesting the law forbids, so Home resolves to `none` and draws nothing —
 * exactly as it resolves to E1 in ROOM_EXPOSURE above while drawing its own E3.
 *
 * NOT A DEFAULT. An unmapped path falls to "none" and draws nothing, which is
 * the recoverable direction: a room that should have had a ground and has none
 * looks as it did yesterday, whereas a surface that wrongly gained one has a
 * plane under content that was never composed for it.
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
};

export function resolveShellRoom(path: string): { title: string; realm: PageRealm } {
  const canonical = ROOM_ALIASES[path] ?? path;
  const room = NAV_ITEMS.find((item) => item.href === canonical);
  if (room) return { title: room.label, realm: REALM_BY_HREF[room.href] ?? "home" };

  for (const [test, title, realm] of NON_ROOM_TITLES) {
    if (test(path)) return { title, realm };
  }
  // An unknown authenticated path still gets the house's walls. The brand mark,
  // the nav and the Companion are the household's way OUT of a page that has
  // gone wrong — a nameless room is recoverable, a headerless one is not.
  return { title: "", realm: "home" };
}

/*
 * INTARCH1 — resolving a room's ground.
 *
 * Two rooms the map at § 5.1 names cannot be reached through their realm, and
 * both would silently draw no ground if this resolved on realm alone. They are
 * handled by PATH here, in the open, rather than by editing NON_ROOM_TITLES —
 * because that table's realm also drives the header's ink and the room's orchard
 * exposure, and re-pointing it to fix a floor would change two other things a
 * household can see. The narrow fix is the honest one.
 *
 *   /admin/*   § 5.1 "Admin — solid working ground" → full. Every admin route
 *              resolves to realm `home`, and Home is the ONE room that must not
 *              be grounded (it has its own), so without this line the study off
 *              the hall would be the only working room in the house with no floor.
 *
 *   /profile   § 5.1 "Household / Profile — the family record; anchored strata"
 *              → air. It resolves to realm `home` for the same reason, with the
 *              same consequence.
 *
 * WHAT IS DELIBERATELY NOT LISTED: /dashboard, /privacy-settings, /help,
 * /contact, /supermarkets, /compare and the two detail routes. § 5.1 does not
 * name any of them as a room, so none is given a ground here. Inventing a
 * posture for a surface the governing map does not describe is exactly the
 * upward flow GEA20 forbids — the map is amended by governance, never by a
 * shell that needed a row. They stand on the warm canvas, as they did.
 *
 * A LIVE INCONSISTENCY THIS DOES NOT RESOLVE, and must not: `/profile`,
 * `/privacy-settings`, `/help` and `/contact` each pass `realm="diary"` to their
 * own WorkspaceHeader while this table assigns them `home`. One surface, two
 * realms. That is a wayfinding question with an owner, and it is reported rather
 * than quietly settled here.
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
  // The room's governed exposure, resolved once, from the map above. Admin and
  // every unmapped authenticated surface resolve to E1/E0 and draw nothing.
  const shellExposure = location.startsWith("/admin")
    ? "e0"
    : ROOM_EXPOSURE[resolveShellRoom(location).realm] ?? "e1";
  const shellGround = resolveShellGround(location);
  const [headerSlot, setHeaderSlot] = useState<HTMLDivElement | null>(null);
  const [railSlot, setRailSlot] = useState<HTMLDivElement | null>(null);
  const [pageHeaders, setPageHeaders] = useState(0);
  const [roomActions, setRoomActions] = useState(0);
  const [activeRealm, setActiveRealm] = useState("home");

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
        <PageHeaderPresenceContext.Provider value={headerPresence}>
          <RoomActionsSlotContext.Provider value={railSlot}>
            <RoomActionsPresenceContext.Provider value={railPresence}>
              {/* PHASE5D — the Companion Context Channel wraps the routed page (which
                  publishes the pointers on screen) and the one FloatingAssistant (which
                  reads them). One channel, one assistant — never one per surface. */}
              <CompanionContextProvider>
                {/* CONV1 BEH-7 — no orchard WALLPAPER stands behind the rooms, and
                    none ever will: the Experience Blueprint § 6.1 forbids it by name
                    ("the orchard is never wallpaper") and § 16 names it an
                    anti-pattern. E1 and E0 rooms stand on the warm canvas and draw
                    no image at all.

                    EXPADOPT1 amends only what that sentence had come to mean in
                    practice. BEH-7 correctly retired `fixed inset-0` behind every
                    room at one strength; what it left behind was a house in which
                    the ONLY room with a window was Home — so `--orchard-exposure-e2`
                    sat valued and consumed by nothing, and five rooms the governing
                    map (§ 5.1) puts at E2 stood at E1. EXPGOV1 § I2 named the
                    consequence: an orchard "reducible to a few lines on the home
                    page" is "an image on one screen", not a fact of the site (GEA6).

                    The window below is the opposite of wallpaper by construction —
                    a committed region, at the room's own governed constant, rendered
                    for five rooms and for no others. */}
                <div className="relative min-h-[100dvh]">
                  <div className="relative z-10 flex flex-col h-[100dvh]">
                    {showTrialBanner && <TrialBanner />}
                    <SiteBanner />

                    {/* The permanent top header. The slot is where a page's own
                        header portals to; the default below it stands in whenever
                        no page header is mounted — including while a chunk loads,
                        while the session resolves, and after a caught error. */}
                    <div ref={setHeaderSlot} className="shrink-0 w-full" data-testid="ws-header-slot" />
                    {pageHeaders === 0 && <ShellHeader />}

                    <div className="flex flex-1 overflow-hidden">
                      {/* The contextual rail (UX1 unchanged: this is not navigation,
                          and BottomNav remains the sole primary navigation at every
                          size). `lg` and above only, and NOT RENDERED AT ALL until a
                          room declares actions — an empty rail is dead furniture, and
                          a `hidden` one is dead furniture you cannot see, which is
                          worse. No room declares any today, so this costs a household
                          nothing; see the NAV2 gap in the adoption register.

                          The two-pass mount is deliberate and is why `RoomActions`
                          registers as well as portals: on its first render the slot
                          does not exist, so it registers and portals nothing; that
                          registration mounts this aside, which sets the slot ref, which
                          re-renders `RoomActions` with a target to portal into. */}
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
                        {/* The room's window. Inside `main` and IN FLOW, so it
                            belongs to the room, scrolls away with it, and occupies
                            "one committed region the content deliberately does not
                            cover" (§ 6.2). `fixed` would make it wallpaper again and
                            would also be the parallax UIA § 4 forbids outright;
                            `absolute` would put the room's type on the view, which
                            § 6.1 forbids without negotiation — see the component's
                            header for the screenshot that caught exactly that. */}
                        <OrchardRoomWindow exposure={shellExposure} />
                        {/* INTARCH1 — the room's ground plane. Mounted ONCE, here,
                            for the same reason the window is: Blueprint § 8.1 makes
                            the middle ground "the only layer that varies by domain",
                            and a layer that varies by domain is a property of the
                            house, not a decision each room makes for itself
                            (GEA19 — a room may not fork the house).

                            It sits BELOW the window in the DOM and therefore below
                            it on the wall, which is the honest arrangement: the
                            window is glazing in the wall, the ground is the surface
                            beneath it, and the room's content stands on the ground.
                            Wrapping the children rather than sitting beside them is
                            what makes it a ground rather than a backdrop — the
                            content is ON it, not in front of it.

                            `none` renders no wrapper at all, so Home and every
                            unmapped surface cost a household no element and no
                            paint, exactly as E1/E0 rooms cost them no window. */}
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
      </WorkspaceHeaderSlotContext.Provider>
    </AppRealmContext.Provider>
  );
}
