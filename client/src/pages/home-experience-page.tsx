// UX0 — Home Experience. THE NORTH STAR ROOM.
//
// The calm, welcoming landing screen shown as the default destination after
// login. It surfaces only TODAY's most relevant information and always makes the
// next logical action obvious.
//
// This page owns NO data. Every value is read from an existing canonical owner
// through the shared react-query caches:
//   • Today's meals  → /api/planner/full + /api/meals/summary (Planner state;
//                       PX1-W3 — names and thumbnails only, never the full rows)
//   • Shopping        → /api/shopping-list      (Shopping state)
//   • Plant diversity → /api/home/intelligence  (weeklyProgress.plantCount)
//   • Reminders       → useCompanionNotices (the Notice Engine, voiced by the Behaviour
//                       Engine). Live since PHASE5E repointed it at the real route;
//                       silence remains a first-class outcome, never padded.
//   • The rooms       → NAV_ITEMS via roomsByHref (UX1's one navigation list)
// No new store, no duplicate state, no second assistant. Honest gaps: a section
// that has no validated data renders as a calm empty state, never fabricated.
//
// ─────────────────────────────────────────────────────────────────────────────
// NORTH1 (2026-07-17) — the North Star built.
//
// Home now stands at E3, "the open view" — the orchard visible as itself,
// generously; the view IS part of the room's purpose (Blueprint §6.2, Home only).
// It is the last of the four exposure levels to exist and the only room that will
// ever hold this one.
//
// The room reads, top to bottom, as NORTH1 §4.1's grammar — light above, horizon,
// working plane, hand below:
//
//   1. THE OPEN VIEW  — the orchard, dissolving into the room: a window beside the
//                       greeting on a wide wall, a band over the counter on a narrow
//                       one (OrchardOpenView, the asset's one owner). It is also the
//                       room's ONLY light — Home pours no --light-ambient, because the
//                       pool plus the sun in the window is two suns in one room, which
//                       Blueprint §16 forbids and which looked exactly as bad as it
//                       sounds.
//   2. THE ARRIVAL    — the household's name in THA's own hand, standing on the warm
//                       canvas in the light from that window, with the Companion's card
//                       beside it resting against the view.
//   3. THE COUNTER    — the ground plane: one warm working surface, rising into the
//                       bottom of the view so it has a world behind it, holding the
//                       glance, the one door, and the doors of the house.
//
// Every value here is a governed token (UIA §4, valued by ODL2). Nothing on this
// page sets a colour, a shadow, a radius or an exposure of its own — the ODL1-era
// hardcoded HSL chips are gone with the rest of the token bypass (NORTH1 §8.5).
//
// WHAT THE NORTH STAR IMAGE ASKS FOR AND THIS ROOM REFUSES, each refused by a rule
// that already had an owner, and each recorded in docs/implementation/
// NORTH1_HOME_IMPLEMENTATION.md rather than discovered again later:
//   • Its left sidebar — UX1's BottomNav is the sole primary navigation at every
//     size and the walls never change (Blueprint §14; NORTH1 §5.3).
//   • Type on the orchard — the greeting sits on canvas, never on the image
//     (Blueprint §6.1, "without negotiation"; the law that deleted EXP4's B and C).
//   • Its photographic props (the notebook, the soup, the jars, the tote, the apple
//     bowl) — "data-borne or dead" (Blueprint §12.1); where the render puts a bowl
//     of apples, the software puts the household's actual plan (NORTH1 §5.2).
//   • "Nourishing food. Happy home." — a marketing line inside the product
//     (NORTH1 §5.7). The state sentence below is data-borne and says more.
//   • Its Family and Pantry glance columns — Home has no validated data for either,
//     and a fabricated fact is the one thing this page has never done.
//   • Its clock — a CIVIL read. Household Time (HT1–HT18) owns it and CONV1 P6 is
//     converging the four getGreeting copies right now; a fifth private clock added
//     here would be the exact duplication that architecture exists to retire.
//
// PX1-W0 (fnd-px-false-empty-home). Every query below separates WAITING (skeleton),
// BROKEN (the canonical LoadError), and genuinely EMPTY. An absence is only ever
// claimed once it is known to be true. That is unchanged by the North Star, and the
// three states are why the room survives a bad morning as well as a good one.

import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { FullWeek } from "@/lib/planner-types";
import { api } from "@shared/routes";
import { useUser } from "@/hooks/use-user";
import { useMealsSummary } from "@/hooks/use-meals-summary";
import { useCompanionNotices } from "@/hooks/use-companion-notices";
// CONV1 P8 / READ-3, OWN-6, BEH-3 — the one client answer to "which planner week is this
// household living in?", and the day that goes with it. Home used to answer both itself.
import { useCurrentPlannerWeek } from "@/hooks/use-current-planner-week";
// CONV1 P8 / BEH-9 — HOME2's canonical resolver. It was built, proven total, given 47
// tests and then never called by anything in production; Home hand-rolled a rival door
// instead. This is its first consumer.
import { resolveHomePrimaryAction } from "@shared/home/home-primary-action";
import { useFoodOpportunities } from "@/hooks/use-food-opportunities";
import AmbientIntelligence from "@/components/intelligence/AmbientIntelligence";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { prefersReducedMotion } from "@/lib/companion-delight";
import { WorkspaceHeader, PageContainer } from "@/components/workspace-header";
import { roomsByHref } from "@/components/nav-bar";
import { OrchardArch } from "@/components/layout/orchard-backdrop";
import { MealCard } from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
// MAT1 — imported, not redeclared. This file held its own `= 30`; so did two other
// client surfaces and the shared core, so the platform's single most user-visible
// number was declared four times. One owner, one source of truth.
import { WEEKLY_PLANT_TARGET } from "@shared/nutrition/household-nutrition";
import {
  CalendarDays, ShoppingCart, Leaf, ArrowRight, ChevronRight,
} from "lucide-react";

// CONV1 P8 / OWN-6 — the `planner:active-week` mirror is GONE from Home.
//
// It read: "Mirror of the planner's active-week persistence (weekly-planner-page.tsx /
// use-week-meal-entries.ts) so Home resolves the same week without inheriting planner
// component state. Read-only." The intent was sound and the mechanism was the defect:
// mirroring a DEVICE's key made Home agree with the planner tab and disagree with the
// household's own laptop — and with the server, twenty-one lines below (BEH-3).
// Home asks the owner now: `useCurrentPlannerWeek()`.

// ── The material, resolved from the one definition source ────────────────────
//
// UIA §4's vocabulary, valued by ODL2 in client/src/index.css. This page names no
// number: it names the token, and the token names the number, once.
//
// NOTE the `shadow:` type hint on every box-shadow. Without it Tailwind reads
// `shadow-[var(--x)]` as a shadow COLOUR — it cannot tell a colour from a box-shadow
// inside a var() — and silently emits `--tw-shadow-color`, leaving the surface flat
// while the build, the typecheck and the gate all stay green. ODL2 §6.3 found this by
// looking at a picture, which is the only way it can be found.
// ARRIVAL1 — the room's surfaces are now the orchard's own materials, defined once
// in index.css (the .home-arrival block) and named here as classes:
//   • .home-arch / .home-arch__view / .home-arch__light — the plaster aperture
//     (owned by orchard-backdrop.tsx's OrchardArch shape).
//   • .home-console — the bounded oak furniture the day rests on (wall visible
//     left and right; a light-pool from the arch; a shadow onto the wall behind and
//     a contact shadow onto the floor). Never full-width, never a colour band.
//   • .home-object — an ivory surface resting ON the console: a thing left on the
//     wood, each with its own contact shadow, not a cell in a grid.
//   • .home-door — a quiet handle at the floor line, in the penumbra.
//   • .home-floor — the near stone ground.
// The counter/ground/support material chips (--ground-plane etc.) are the other
// rooms' surfaces and are untouched; Home no longer consumes them.
const M = {
  radius: "rounded-[var(--radius-support)]",
  focus:
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;

// The house's doors, in the order Home offers them. The href, the label and the glyph
// are UX1's (roomsByHref); only the sentence under each is Home's. These four are the
// rooms a household cooks out of — Nutrition, Diary and Analyser are a walk further in,
// and the walls hold all eight at every size regardless.
const DOOR_HREFS = ["/planner", "/cookbook", "/pantry", "/shopping-workspace"] as const;

// NORTH3 — `DOOR_LINES` IS RETIRED, AND IT WAS A MARKETING LINE THIS PAGE HAD
// ALREADY REFUSED ONCE.
//
// It read:
//   "/planner":            "Plan your meals with ease"
//   "/cookbook":           "Discover recipes and inspiration"
//   "/pantry":             "See what you have at home"
//   "/shopping-workspace": "Your list and reminders"
//
// NORTH1 §5.7 deleted the render's "Nourishing food. Happy home." from this room
// and gave the reason in one line: *a marketing line inside the product*. It is
// the same sentence four times. "Discover recipes and inspiration" is not a fact
// about the household, it is not a fact about their cookbook, and it is not
// something anybody has ever needed to be told while standing in their own hall.
// It is the brochure, and the brochure had already been shown the door.
//
// A door in a house carries a NAME and a HANDLE. It does not carry a paragraph
// explaining the room behind it — you can see the room behind it, and if you
// cannot, a sentence in 12px will not help. The label and the glyph are UX1's
// (roomsByHref); the sentence was Home's own invention, and it is gone.
//
// This is the Kept Room's ordering law 8 — TRUTH BEFORE CHARM — applied to the
// only four strings on this page that had no owner and no source.

// CONV1 P8 / OWN-6 — `loadActiveWeek()` is RETIRED from Home.
//
// It read `planner:active-week` from localStorage and, failing that, returned the number
// one. Five readers, one writer (a manual pick on the planner page), never seeded from the
// server — so a household on a phone and a laptop had TWO current weeks, and a household
// who had never clicked anything had "Week 1" asserted at them forever. It was a
// household-shaped fact with no entry in the Source of Truth Register, living on a device.
//
// HOME3 § 4 refused it by name: *"localStorage is not household state."* It cannot be fixed
// by seeding it; it is fixed by asking the owner (`useCurrentPlannerWeek`), which is what
// this page now does.
//
// The key itself SURVIVES on the planner page, and that is not an oversight: there it means
// *"which week am I editing"* — genuine, device-local view state, which is nobody's idea of
// a household fact. OWN-6 is about Home reading it as THE CURRENT WEEK. That reading is
// gone.

// Weekly progress aggregate — the same payload the Dashboard's
// HomeIntelligenceCompanion reads. Same query key → shared cache, no duplicate
// fetch. We only consume weeklyProgress here.
interface HomeIntelligenceData {
  weeklyProgress: {
    plantCount: number;
    mealsPlanned: number;
    daysWithMeals: number;
  } | null;
}

function firstNameOf(user: ReturnType<typeof useUser>["user"]): string | null {
  const raw = user?.firstName || user?.displayName || user?.username || null;
  if (!raw) return null;
  // displayName/username may be an email — show only the local part.
  return raw.split("@")[0] || null;
}

function todayLabel(): string {
  try {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return "";
  }
}

interface TodayMeal {
  id: string;
  name: string;
  mealType: string | null;
  imageUrl: string | null;
}

/** The glance's icon, in the house's one accent. Never a colour this page invented. */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="w-9 h-9 rounded-xl flex items-center justify-center bg-accent shrink-0"
      style={{ color: "var(--primary-border)" }}
    >
      {children}
    </span>
  );
}

/** A column's quiet way into its room. Never competing with the one door. */
function ViewLink({ href, children, testId }: { href: string; children: React.ReactNode; testId: string }) {
  return (
    <Link
      href={href}
      className={`${M.focus} group/vl mt-4 inline-flex items-center gap-1 rounded-sm text-sm font-medium transition-colors`}
      style={{ color: "var(--primary-border)" }}
      data-testid={testId}
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/vl:translate-x-0.5 motion-reduce:transition-none" />
    </Link>
  );
}

/**
 * The week's variety, as a ring.
 *
 * The North Star's one instrument, and it is kept because it is the one element of the
 * render that was already data-borne: it draws a number a canonical owner produced, and
 * it draws nothing when that owner has no picture yet. It is STILL — no sweep, no count
 * up, no draw-on (UIA §11; Blueprint §6.1's "place survives total stillness"). Motion
 * here would be the ring performing the household's diet back at them.
 */
function PlantRing({ pct, count }: { pct: number; count: number }) {
  const R = 34;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden>
        <circle cx="44" cy="44" r={R} fill="none" stroke="hsl(var(--accent))" strokeWidth="7" />
        {/* No arc at zero. A round cap on a zero-length dash draws a DOT — so a
            household who has planted nothing this week was shown a small mark on the
            ring, which is a claim of progress that has not happened. An honest nothing
            is nothing. */}
        {pct > 0 && (
          <circle
            cx="44" cy="44" r={R} fill="none"
            stroke="var(--primary-border)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * C} ${C}`}
            transform="rotate(-90 44 44)"
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center">
        <Leaf style={{ width: 22, height: 22, color: "var(--primary-border)" }} />
      </span>
      <span className="sr-only">{count} of {WEEKLY_PLANT_TARGET} plants this week</span>
    </div>
  );
}

export default function HomeExperiencePage() {
  const { user } = useUser();
  // CONV1 P8 / READ-3, OWN-6, BEH-3 — THE ONE CANONICAL PLANNER STATE.
  //
  // Every card on this page that depends on "which week is it?" resolves from THIS, and
  // from nothing else. That is the whole of BEH-3's fix: Home rendered Week 1's meals
  // (localStorage) twenty-one lines above Week 6's plant count (the server's
  // max(weekNumber)) — one component, one screen, one paint, and it did not agree with
  // itself. Two cards reading one field cannot contradict each other.
  const { data: plannerWeek } = useCurrentPlannerWeek(!!user);

  const plannerQuery = useQuery<FullWeek[]>({
    queryKey: ["/api/planner/full"],
    enabled: !!user,
  });
  // PX1-W3 (fnd-px-home-fetches-whole-cookbook): Home used to fetch the full
  // /api/meals rows — ingredients and instructions included, ~1 MB for a real
  // household — to read three meal names and thumbnails. The canonical summary
  // hook shares the Dashboard's cache entry, so this is the SAME data the
  // Dashboard renders, fetched once between them.
  const mealsQuery = useMealsSummary();
  const shoppingQuery = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const homeIntelQuery = useQuery<HomeIntelligenceData>({
    queryKey: ["/api/home/intelligence"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const fullPlanner = plannerQuery.data ?? [];
  const mealsList = mealsQuery.meals ?? [];
  const shoppingItems = shoppingQuery.data ?? [];
  const homeIntel = homeIntelQuery.data;

  // "Today's meals" is only true once BOTH the week and the cookbook have landed —
  // a resolved planner against an unresolved cookbook resolves zero meal names.
  const mealsWaiting = plannerQuery.isLoading || mealsQuery.isLoading;
  const mealsBroken = plannerQuery.isError || mealsQuery.isError;
  const retryTodaysMeals = () => { plannerQuery.refetch(); mealsQuery.refetch(); };
  const { data: noticesData } = useCompanionNotices(!!user);
  // CONV1 P8 / BEH-9 — DEC1's governed output, so the resolver's Tier 0 (safety) can
  // fire. Home had no access to it before, because Home had no resolver.
  const { data: opportunitiesData } = useFoodOpportunities(!!user);

  // Today's planned meals — the household's week, the household's day.
  //
  // CONV1 P8. This comment used to read: *"active week, calendar day-of-week. The planner
  // is week-number based (no stored date), so 'today' is derived, not queried."* Both
  // halves are retired. The planner HAS a stored date (`weekStartDate` — CONV1 P7), and
  // "today" is no longer derived here at all:
  //
  //   • THE WEEK was `activeWeek` — localStorage, defaulting to 1 (OWN-6).
  //   • THE DAY was `new Date().getDay()` — the DEVICE's day (HT12: the client may supply
  //     the instant; it may never decide the day). A household whose phone was in another
  //     zone could be shown the wrong day's dinners, and on a Saturday night in London a
  //     device on Auckland time would already be showing Sunday's.
  //
  // Both now arrive together from ONE server-side resolution (HT11 — all of it, or none
  // of it; a card taking the week from the household and the day from the device compares
  // them against two calendars at once). If the planner is not anchored there is NO WEEK
  // and therefore NO "today's meals" to claim — the page renders the unanchored state
  // instead of quietly showing Week 1's (BEH-3: "do not pick a week to fix it").
  const todaysMeals = useMemo<TodayMeal[]>(() => {
    if (!plannerWeek?.anchored) return [];
    const week = fullPlanner.find((w) => w.weekNumber === plannerWeek.weekNumber);
    if (!week) return [];
    const day = week.days.find((d) => d.dayOfWeek === plannerWeek.todayDayOfWeek);
    if (!day) return [];
    const mealById = new Map(mealsList.map((m) => [m.id, m]));
    const out: TodayMeal[] = [];
    for (const entry of day.entries) {
      const meal = mealById.get(entry.mealId);
      if (!meal) continue;
      out.push({
        id: String(entry.id),
        name: meal.name,
        mealType: entry.mealType ?? null,
        imageUrl: meal.imageUrl ?? null,
      });
    }
    return out;
  }, [fullPlanner, mealsList, plannerWeek]);

  const openItems = shoppingItems.filter((i: any) => !i.checked);
  const openShoppingCount = openItems.length;
  // EXPCOMP2 FAIL 2 — the server returns weeklyProgress: null when it has NO
  // weekly picture. That is an absence, not a zero; rendering "0 of 30" where
  // nothing is known is fabrication. Absence gets its own calm state below.
  const weeklyProgress = homeIntel?.weeklyProgress ?? null;
  const plantCount = weeklyProgress?.plantCount ?? null;
  const plantPct =
    plantCount === null
      ? 0
      : Math.min(100, Math.round((plantCount / WEEKLY_PLANT_TARGET) * 100));

  // EXPCOMP2 FAIL 4 — the Companion is invited, not intrusive: it arrives a beat
  // after the household, once the room has settled. The mechanism (and its
  // unmount release) is owned by companion-context; this is only the invitation.
  const settling =
    mealsWaiting || shoppingQuery.isLoading || homeIntelQuery.isLoading;
  useWithholdCompanion(settling);

  // Reminders — the Notice Engine's Silence Rules already chose WHICH notices and HOW
  // MANY (at most two per moment), and the Behaviour Engine already voiced each one in
  // the household's chosen personality. Both happened server-side, once.
  //
  // PHASE5E removed a `.slice(0, 3)` that used to sit here. It never bit (the server's
  // cap is two), but it was a SECOND attention budget on the client — and "callers must
  // never re-sort or re-slice a gathered list themselves" is precisely what the Notice
  // Engine owns and its §9 forbids. The North Star moved this list to the Companion's
  // card against the view; it did NOT re-slice it to fit the new shape, which would have
  // reintroduced from the design side exactly what PHASE5E removed from the code side.
  //
  // No notices → the card is absent. Silence is a first-class outcome, never padded.
  const reminders = noticesData?.notices ?? [];

  const name = firstNameOf(user);

  // The state sentence — said only once it is KNOWN. This is the line the render puts a
  // tagline on ("Nourishing food. Happy home."), and the difference is the whole of the
  // Living Details rule: this one is true, and it is about the household rather than
  // about THA.
  // CONV1 P8 / BEH-3 — THE UNANCHORED HOME.
  //
  // 192 of THA's 195 households have a planner nobody dated, and under HT7 they always
  // will: the anchor is written only at week creation and never back-filled, and their
  // weeks predate it. So this is the ORDINARY state, not an edge case — and it is NOT an
  // error and NOT an empty state. It is the expected first-run experience until a
  // canonical anchor exists (the governing decision of 2026-07-17; THA_HOUSEHOLD_TIME_
  // ARCHITECTURE.md § 13.1).
  //
  // Everything below hangs off this ONE flag, which hangs off the ONE resolution — which
  // is the whole of BEH-3: two cards reading one field cannot contradict each other.
  const plannerWaiting = plannerWeek === undefined;
  const plannerUnanchored = plannerWeek != null && !plannerWeek.anchored;

  const stateSentence = mealsBroken
    ? null
    : mealsWaiting || plannerWaiting
      ? null
      // "Today is open." and "Today is planned." are both CLAIMS ABOUT TODAY, and THA
      // cannot make either about a week it cannot name. Saying "Today is open" to a
      // household who planned every day of it is the fabrication this phase retires.
      : plannerUnanchored
        ? "Your planner isn't linked to the calendar yet."
        : todaysMeals.length === 0
          ? "Today is open."
          : "Today is planned.";

  // ── CONV1 P8 / BEH-9 — THE ONE DOOR, aimed by HOME2's resolver ──────────────
  //
  // The door was `todaysMeals.length === 0 ? "Plan today" : "Open today's plan"` — a
  // hand-rolled rival of a canonical owner that already existed, was total, and had
  // 47 passing tests and ZERO production consumers. CONV1 grades BEH-9 "Home has no
  // primary action"; that grade is now wrong (the door was built hours before this
  // phase) and the real defect is sharper: the door WAS AIMED BY `localStorage`, through
  // `todaysMeals` → `activeWeek`. HOME3 § 4 refused exactly that — *"aimed at
  // localStorage it moves when you change device"* — which breaks HOME2 § 6.1's theorem
  // (*the door changes when the household's state changes*) at its root.
  //
  // The resolver decides the TIER and the DESTINATION from household facts. It does not
  // decide the WORDS: the labels below are this page's, exactly as they were, and remain
  // INT21's open item (§ 9 / CP3) — P6's discipline, one phase on: converge the
  // decision, leave the voice.
  //
  // `week: null` when unanchored is not a degradation — it is the resolver's designed
  // input for "the planner could not be read", and it falls to the floor and still
  // returns exactly ONE action (HOME3 § 6). So Home keeps its door for all 192 without
  // anyone inventing a week for it.
  const homeWeekState = useMemo(() => {
    if (!plannerWeek?.anchored) return null;
    const week = fullPlanner.find((w) => w.weekNumber === plannerWeek.weekNumber);
    if (!week) return null;
    return {
      weekNumber: plannerWeek.weekNumber,
      hasEmptyDays: week.days.some((d) => d.entries.length === 0),
    };
  }, [fullPlanner, plannerWeek]);

  const primaryAction = useMemo(
    () =>
      resolveHomePrimaryAction({
        // DEC1's governed output, carried verbatim — the resolver applies ATTN1's own
        // `isCritical` predicate itself and never re-derives a level (A1). An empty
        // array deliberately conflates "none exist" with "could not be reached": a
        // safety door the platform cannot see is not claimed (HOME2 § 7.2 case 2).
        criticals: (opportunitiesData?.opportunities ?? []).map((o) => ({
          id: o.id,
          type: o.type,
          domain: o.domain,
          priority: o.priority,
        })),
        week: homeWeekState,
        shopping: { uncheckedCount: openShoppingCount },
      }),
    [opportunitiesData, homeWeekState, openShoppingCount],
  );

  const DOOR_HREF: Record<string, string> = {
    planner: "/planner",
    shopping: "/shopping-workspace",
    pantry: "/pantry",
  };
  const primaryHref = DOOR_HREF[primaryAction.destination] ?? "/planner";
  const primaryLabel =
    primaryAction.tier === 0
      ? "Check your shopping list"
      : primaryAction.destination === "shopping"
        ? "Ready to shop"
        : primaryAction.destination === "pantry"
          ? "Open the pantry"
          : homeWeekState?.hasEmptyDays === true
            ? "Plan your week"
            : todaysMeals.length === 0 && !plannerUnanchored
              ? "Plan today"
              : "Open the planner";

  // The writing reveal is a reveal, never a withholding: under reduced motion the class
  // is not applied at all, so the name is simply there, complete, from frame one. The
  // mask must never be left mid-sweep by a 0.01ms duration (index.css, .signature-ink).
  const inkClass = prefersReducedMotion() ? "" : "signature-ink";

  const doors = roomsByHref(DOOR_HREFS);

  return (
    <>
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      {/* ── THE ROOM ──────────────────────────────────────────────────────────
             ARRIVAL1 — NORTH5's definitive Home. One continuous plaster wall (the
             .home-arrival background), a stone floor at its base, a plaster archway
             onto the orchard, and a bounded oak console the day rests on. The law
             is wall → furniture → floor (NORTH5 §4): cover the console and the wall
             is continuous behind it; the orchard is an opening in that wall, not a
             banner above a dashboard. `isolate` keeps the light and the arch in
             their own stacking context. */}
      <div className="home-arrival relative isolate flex-1" data-testid="home-room">
        {/* THE FLOOR — the near stone ground the room stands on, behind the content.
             Its soft top edge is the floor line where the wall turns into the floor. */}
        <div className="home-floor" aria-hidden data-testid="home-floor" />

        <PageContainer className="relative z-10 pt-4 sm:pt-6 lg:pt-6 pb-28">
          {/* ── THE ARCH — the emotional focal point ─────────────────────────────
                 A plaster aperture cut into the wall, the orchard genuinely behind it
                 (Blueprint §6.2 rule 4, amended ARRIVAL1). The morning enters here and
                 here only; the shape, reveal, depth and petal-light are the CSS, the
                 asset and its crop are OrchardArch's. It carries no type and never
                 animates (§6.1). The orchard continues beyond it. */}
          <div className="flex justify-center">
            <OrchardArch />
          </div>

          {/* ── THE ARRIVAL ────────────────────────────────────────────────────
                 The household's name in THA's own hand — the house's one ornament at
                 Home, data-borne (Blueprint §12.1). It stands on the plaster wall, in
                 the light spilling from the arch above — never on the orchard (§6.1).
                 The Companion's card is propped on the wall beside it. */}
          <div className="mt-6 sm:mt-7 lg:mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-12">
            <header className="max-w-xl">
              <h1 data-testid="text-home-greeting" className="text-foreground">
                {name ? (
                  <>
                    {/* NORTH2 — the salutation, re-voiced.
                        It was `title-section`: DM Sans SEMIBOLD at 22px, standing
                        directly above an 84px hand. The weight was there to be heard
                        next to something four times its size, and it lost — which is
                        UIA §8's own rule, stated in the law rather than discovered
                        here: "Weight is hierarchy's quietest tool … heavy weight is
                        reserved for the few numerals and scores that deserve it.
                        Shouting in bold is spending the emphasis budget on the shout."

                        It is now `title-page` at font-normal: the named role for the
                        title of a page — which this literally is — carried at the one
                        weight that lets the household's NAME be the loudest thing in
                        the room. Larger, lighter, and calmer than what it replaces.
                        The emphasis was never supposed to be on the greeting; it was
                        always supposed to be on the person being greeted. */}
                    <span className="block title-page font-normal tracking-[-0.015em] text-muted-foreground">
                      Welcome home,
                    </span>
                    <span
                      className={`block text-signature ${inkClass} text-[3.75rem] sm:text-[5.5rem] leading-[1.02] mt-2`}
                      style={{ color: "var(--primary-border)" }}
                      data-testid="text-home-signature"
                    >
                      {name}
                    </span>
                  </>
                ) : (
                  // No name, no hand: a signature is a person's, and there is nobody to
                  // sign for. The welcome stands in the display voice instead — an
                  // honest absence, not a blank.
                  <span className="block title-page">Welcome home.</span>
                )}
              </h1>

              {/* NORTH2 — the day, moved BELOW the name and taken out of uppercase.
                    It was `text-xs uppercase tracking-[0.16em]` ABOVE the greeting:
                    micro-size, all-caps, wide-tracked — which is the typographic
                    signature of a dashboard widget header, and it was the first thing
                    the room said. A house does not announce the date before it says
                    hello. Now it is sentence case, quiet, and it sits under the name:
                    greet the person, THEN mention the day.

                    ⚠️ `todayLabel()` is byte-untouched and deliberately so. This moves
                    and re-voices the STRING; it does not read a clock differently, add
                    a second one, or resolve a civil date. Household Time (HT1–HT18)
                    owns that read and CONV1 P8 is still to converge it — NORTH1 §5.6
                    left this line for the convergence, and it is still left for it. */}
              <p className="mt-6 text-sm text-muted-foreground" data-testid="text-home-date">
                {todayLabel()}
              </p>
            </header>

            {/* The Companion's card — the friend at the counter, resting against the
                view. Solid, because it stands where the orchard is: type gets ground
                without negotiation (Blueprint §6.1), and a translucent panel over an
                image has contingent contrast, which cannot be measured once (UIA §15;
                NORTH1 §5.6 — this is why the render's frosted glass is refused and this
                panel is warm and opaque).

                The sentences are the Behaviour Engine's, verbatim. Absent in silence. */}
            {reminders.length > 0 && (
              <aside
                className="home-object rounded-[var(--radius-primary)] p-5 animate-in fade-in duration-700 motion-reduce:animate-none"
                data-testid="card-home-companion"
                aria-labelledby="home-companion-heading"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Leaf style={{ width: 15, height: 15, color: "var(--primary-border)" }} />
                  <h2 id="home-companion-heading" className="title-card text-foreground">
                    Companion
                  </h2>
                </div>
                <ul className="space-y-2.5" data-testid="list-home-reminders">
                  {reminders.map((o, i) => (
                    <li
                      key={o.id}
                      className="text-sm text-foreground/80 leading-relaxed"
                      data-testid={`home-reminder-${i}`}
                    >
                      {/* The Behaviour Engine's sentence, rendered verbatim. Never reworded here. */}
                      {o.text}
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </div>

          {/* ── THE CONSOLE — the oak furniture the day rests on ────────────────────
                 The day's information is gently placed on a bounded oak console: wall
                 visible left and right, a light-pool from the arch, a shadow onto the
                 wall behind and a contact shadow onto the floor. It is FURNITURE inside
                 the room, not a coloured lower band and not the counter's full-width
                 ground (NORTH5 §4 — the hand test). The three facts rest on it as ivory
                 objects, each with its own contact shadow: things left on the wood.

                 It stands back from the greeting so the arrival speaks first (the
                 NORTH2 pause), but the whole composition is shorter than the old
                 open-view room, so the one lit action never falls behind the nav. */}
          <section className="mt-7 sm:mt-8" aria-labelledby="home-today-heading">
            <div className="mb-4 px-1 max-w-4xl mx-auto">
              <h2
                id="home-today-heading"
                className="title-section text-foreground"
                data-testid="text-home-today-heading"
              >
                Today at a glance
              </h2>
              {stateSentence && (
                <p className="mt-1 text-base text-muted-foreground" data-testid="text-home-state">
                  {stateSentence}
                </p>
              )}
            </div>

            {/* The console: the bounded oak surface. `max-w-4xl mx-auto` keeps the wall
                visible on both sides — furniture in the room, never edge to edge. */}
            <div className="home-console mx-auto max-w-4xl p-4 sm:p-6" data-testid="ground-home">
              {/* The glance — THA's real three, each a separate ivory object resting on
                  the oak (oak shows between them). Family and Pantry are the render's
                  other two and Home has no validated data for either; not invented. */}
              {mealsBroken && shoppingQuery.isError && homeIntelQuery.isError ? (
                <LoadError
                  what="today at a glance"
                  onRetry={() => { retryTodaysMeals(); shoppingQuery.refetch(); homeIntelQuery.refetch(); }}
                  data-testid="error-home-glance"
                />
              ) : (
                <div
                  className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3"
                  data-testid="card-home-glance"
                >
                  {/* ── Meals ── */}
                  <div className={`home-object ${M.radius} p-5 min-w-0`} data-testid="glance-meals">
                    <div className="flex items-center gap-3 mb-4">
                      <Chip><CalendarDays style={{ width: 18, height: 18 }} /></Chip>
                      <div className="min-w-0">
                        <h3 className="title-card text-foreground">Meals</h3>
                        {mealsWaiting ? (
                          <Skeleton className="h-4 w-20 mt-1" />
                        ) : mealsBroken ? (
                          <p className="text-sm text-muted-foreground">Unavailable</p>
                        ) : plannerUnanchored ? (
                          /* CONV1 P8 / BEH-3 — "Nothing planned" is a claim about TODAY,
                             and THA has no today in the planner to make it about. */
                          <p className="text-sm text-muted-foreground" data-testid="text-home-meals-unanchored-count">
                            Not linked to dates
                          </p>
                        ) : (
                          <p className="text-sm font-medium" style={{ color: "var(--primary-border)" }} data-testid="text-home-meals-count">
                            {todaysMeals.length === 0
                              ? "Nothing planned"
                              : `${todaysMeals.length} planned`}
                          </p>
                        )}
                      </div>
                    </div>

                    {mealsBroken ? (
                      <LoadError
                        what="today's meals"
                        onRetry={retryTodaysMeals}
                        data-testid="error-home-todays-meals"
                      />
                    ) : mealsWaiting ? (
                      <div className="flex flex-col gap-2" data-testid="loading-home-todays-meals">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-5 w-1/2" />
                      </div>
                    ) : plannerUnanchored ? (
                      /* ── CONV1 P8 / BEH-3 — THE UNANCHORED HOME ───────────────────
                         NOT an error, and NOT "you have planned nothing". THA does not
                         know which of the six planner weeks the household is living in,
                         because their weeks were created before the anchor existed and
                         HT7 forbids inventing one after the fact. So Home says that,
                         plainly, and shows the plan it CAN honestly point at — instead
                         of quietly rendering Week 1's dinners under the word "today"
                         beside Week 6's plant count, which is what it did before.
                         This is the expected first-run experience until an anchor
                         exists (the governing decision of 2026-07-17). */
                      <div className="flex flex-col gap-2" data-testid="empty-home-planner-unanchored">
                        <p className="text-sm text-muted-foreground">
                          Your planner's weeks aren't linked to calendar dates yet, so THA
                          can't tell which one is this week. Your plan is all still there.
                        </p>
                        <Link
                          href="/planner"
                          className="text-sm font-medium inline-flex items-center gap-1"
                          style={{ color: "var(--primary-border)" }}
                          data-testid="link-home-open-planner-unanchored"
                        >
                          Open the planner <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    ) : todaysMeals.length === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="text-home-meals-empty">
                        Nothing planned for today yet — the day is yours to map out.
                      </p>
                    ) : (
                      <ul className="flex flex-col gap-1.5" data-testid="list-home-todays-meals">
                        {todaysMeals.map((m) => (
                          <li key={m.id} className="text-foreground/85">
                            <MealCard
                              meal={m}
                              variant="row"
                              thumbnailSize="xs"
                              href={null}
                              meta={m.mealType ? <span className="capitalize">{m.mealType}</span> : undefined}
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                    <ViewLink href="/planner" testId="link-home-view-planner">View planner</ViewLink>
                  </div>

                  {/* ── Shopping ── */}
                  <div className={`home-object ${M.radius} p-5 min-w-0`} data-testid="glance-shopping">
                    <div className="flex items-center gap-3 mb-4">
                      <Chip><ShoppingCart style={{ width: 18, height: 18 }} /></Chip>
                      <div className="min-w-0">
                        <h3 className="title-card text-foreground">Shopping</h3>
                        {shoppingQuery.isLoading ? (
                          <Skeleton className="h-4 w-20 mt-1" />
                        ) : shoppingQuery.isError ? (
                          <p className="text-sm text-muted-foreground">Unavailable</p>
                        ) : (
                          <p className="text-sm font-medium" style={{ color: "var(--primary-border)" }} data-testid="text-home-shopping-summary">
                            {openShoppingCount === 0
                              ? "List is clear"
                              : `${openShoppingCount} ${openShoppingCount === 1 ? "item" : "items"} to buy`}
                          </p>
                        )}
                      </div>
                    </div>

                    {shoppingQuery.isError ? (
                      <LoadError
                        what="your shopping list"
                        onRetry={() => shoppingQuery.refetch()}
                        data-testid="error-home-shopping"
                      />
                    ) : shoppingQuery.isLoading ? (
                      <div className="flex flex-col gap-2" data-testid="loading-home-shopping">
                        <Skeleton className="h-5 w-2/3" />
                        <Skeleton className="h-5 w-1/2" />
                      </div>
                    ) : openShoppingCount === 0 ? (
                      <p className="text-sm text-muted-foreground" data-testid="text-home-shopping-empty">
                        Nothing to fetch — the cupboards are as you left them.
                      </p>
                    ) : (
                      // The list's own first items, in the list's own order. Never
                      // re-sorted, never re-ranked: Shopping owns what matters most.
                      <ul className="flex flex-col gap-1.5 text-sm text-foreground/85" data-testid="list-home-shopping">
                        {openItems.slice(0, 3).map((i: any) => (
                          <li key={i.id} className="truncate">{i.name ?? i.itemName}</li>
                        ))}
                        {openShoppingCount > 3 && (
                          <li className="text-muted-foreground">
                            and {openShoppingCount - 3} more
                          </li>
                        )}
                      </ul>
                    )}
                    <ViewLink href="/shopping-workspace" testId="link-home-view-shopping">View shopping list</ViewLink>
                  </div>

                  {/* ── From the orchard ── the week's variety. The render's ring, kept:
                      it is the one thing in that frame already drawing a true number. */}
                  <div className={`home-object ${M.radius} p-5 min-w-0`} data-testid="glance-plants">
                    <div className="flex items-center gap-3 mb-4">
                      <Chip><Leaf style={{ width: 18, height: 18 }} /></Chip>
                      <div className="min-w-0">
                        <h3 className="title-card text-foreground">From the orchard</h3>
                        <p className="text-sm text-muted-foreground">Your week's variety</p>
                      </div>
                    </div>

                    {homeIntelQuery.isError ? (
                      <LoadError
                        what="your plant diversity"
                        onRetry={() => homeIntelQuery.refetch()}
                        data-testid="error-home-plant-diversity"
                      />
                    ) : homeIntelQuery.isLoading ? (
                      <div className="flex items-center gap-4" data-testid="loading-home-plant-diversity">
                        <Skeleton className="h-[88px] w-[88px] rounded-full" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ) : plantCount === null ? (
                      // Absence, honestly: the server has no weekly picture yet. No ring
                      // is drawn, because a ring at zero is a claim.
                      <p className="text-sm text-muted-foreground" data-testid="text-home-plant-empty">
                        Your week's variety will appear here as meals are planned.
                      </p>
                    ) : (
                      <div className="flex items-center gap-4">
                        <PlantRing pct={plantPct} count={plantCount} />
                        <p className="text-sm text-muted-foreground" data-testid="text-home-plant-summary">
                          <span className="block text-2xl font-semibold text-foreground">
                            {plantCount}
                            <span className="text-base font-normal text-muted-foreground"> / {WEEKLY_PLANT_TARGET}</span>
                          </span>
                          plants this week
                        </p>
                      </div>
                    )}
                    <ViewLink href="/plant-diversity" testId="link-home-view-plants">View plant diversity</ViewLink>
                  </div>
                </div>
              )}

              {/* ── The one lit action, on the console ────────────────────────────
                     Orientation, then one door — the whole of Home's job (DESIGN1 §0.1).
                     Re-aimed by the truth of today (HOME2's resolver), the only
                     primary-styled control on the page, sitting on the oak among the
                     day's facts. Its destination is the RESOLVER's, not this page's. */}
              <div className="mt-4 sm:mt-5 px-1">
                <Button asChild variant="default" className="w-full sm:w-auto" data-testid="button-home-primary">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
              </div>
            </div>
          </section>

          {/* ── THE DOORS — quiet handles at the floor line ─────────────────────────
                 One home, many places (Blueprint §5.1). Set down on the stone floor now,
                 below the console rather than carved into it — in the penumbra, visibly
                 subordinate to the one lit action on the console above. Their hrefs,
                 labels and glyphs are UX1's one list; Home keeps no second copy of the
                 rooms, and hangs no photographs (Blueprint §12.1). NORTH3 made these
                 doors and not feature cards — a NAME and a HANDLE on one line; ARRIVAL1
                 stands them on the floor. Bounded to the console's width so the wall
                 shows past them too. */}
          <nav
            className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 max-w-4xl mx-auto"
            aria-label="The rooms of your home"
            data-testid="home-doors"
          >
            {doors.map((room) => {
              const Icon = room.icon;
              return (
                <Link
                  key={room.href}
                  href={room.href}
                  className={`${M.focus} block ${M.radius}`}
                  data-testid={`door-home-${room.label.toLowerCase()}`}
                >
                  <div className={`home-door group/door ${M.radius} py-3 pl-4 pr-3 flex items-center gap-3`}>
                    <Icon className="h-[18px] w-[18px] shrink-0" style={{ color: "var(--primary-border)" }} />
                    <h3 className="title-card text-foreground min-w-0 truncate">{room.label}</h3>
                    {/* The handle — the house's accent, quiet until the hand arrives:
                        a door handle catches the light when you reach for it. */}
                    <span
                      className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent
                                 transition-colors duration-200 ease-out motion-reduce:transition-none"
                      style={{ color: "var(--primary-border)" }}
                    >
                      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 ease-out group-hover/door:translate-x-0.5 motion-reduce:transition-none" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* ── The room's ambient intelligence ──────────────────────────────────
                 INT19 — Home gains the ONE ambient surface, so the arrival room
                 becomes THA's primary ambient intelligence experience (its mission,
                 §1/§5). It is a MOUNT, not a new channel: it composes the same
                 `useFoodOpportunities` bundle this page ALREADY fetches (line ~337,
                 until now read only to aim the door's safety tier), so TanStack
                 dedupes it — no new request, no new endpoint, no new ownership.

                 It sits BELOW the doors deliberately. Home's job is arrive → orient →
                 one door, and the counter's primary action must never fall behind the
                 nav (the NORTH2/NORTH3 collision). A collapsed row here changes no
                 layout above it. For the 192/195 unanchored households it renders
                 NOTHING (`isPending || items.length === 0` → null), so the quiet day
                 stays quiet. A `critical` — the restriction conflict, THA's one safety
                 signal — auto-opens the surface itself.

                 Home is the ONE sanctioned aggregate view alongside the dashboard, so
                 no `domains` filter: every domain's opportunities, ranked by the
                 Decision Engine, rendered in its order verbatim. This mirrors the exact
                 pairing the dashboard already ships (HomeIntelligenceCompanion beside
                 AmbientIntelligence): the Companion card above speaks the phrased
                 notice; this surface carries the resolvable card with its evidence. */}
          <div className="mt-10 max-w-4xl mx-auto">
            <AmbientIntelligence surfaceKey="home" title="Things you could do" />
          </div>

          {/* ── Quiet way back to the full dashboard ── */}
          <div className="mt-8 flex justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-home-dashboard"
            >
              See your full dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </PageContainer>
      </div>
    </>
  );
}
