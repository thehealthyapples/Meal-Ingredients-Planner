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
//   • Room navigation → the canonical BottomNav in AppShell
// Reminders are NOT read here any more (UX3): the Notice Engine's mouth is the
// Companion, in every room, not this one page speaking in its name.
// No new store, no duplicate state, no second assistant. Honest gaps: a section
// that has no validated data renders as a calm empty state, never fabricated.
//
// ─────────────────────────────────────────────────────────────────────────────
// HOMEEXT1 — Home now opens onto the owner-selected front garden. The image is
// decorative and static; the welcome and the three sourced summaries each have
// solid reading ground. Home still owns no data and the canonical shell still
// owns navigation, the Companion and all trust notices.

import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { FullWeek } from "@/lib/planner-types";
import { api } from "@shared/routes";
import { useUser } from "@/hooks/use-user";
import { useMealsSummary } from "@/hooks/use-meals-summary";
// CONV1 P8 / READ-3, OWN-6, BEH-3 — the one client answer to "which planner week is this
// household living in?", and the day that goes with it. Home used to answer both itself.
import { useCurrentPlannerWeek } from "@/hooks/use-current-planner-week";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { prefersReducedMotion } from "@/lib/companion-delight";
import { HomeExteriorView } from "@/components/layout/orchard-backdrop";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
// HOME2 — The canonical Home Primary Action Resolver (Priority 4 repair)
import { resolveHomePrimaryAction, type HomeState } from "@shared/home/home-primary-action";
// MAT1 converged this file's private `= 30` onto the shared owner. PRESENCE1 went
// one step further and removed the import entirely: Home no longer needs the target,
// because it no longer measures anybody against it. `WEEKLY_PLANT_TARGET` remains the
// single owner of the fact for the consumers that still legitimately reason about it.
import {
  CalendarDays, ShoppingCart, Leaf, ArrowRight,
} from "lucide-react";

// CONV1 P8 / OWN-6 — the `planner:active-week` mirror is GONE from Home.
//
// It read: "Mirror of the planner's active-week persistence (weekly-planner-page.tsx /
// use-week-meal-entries.ts) so Home resolves the same week without inheriting planner
// component state. Read-only." The intent was sound and the mechanism was the defect:
// mirroring a DEVICE's key made Home agree with the planner tab and disagree with the
// household's own laptop — and with the server, twenty-one lines below (BEH-3).
// Home asks the owner now: `useCurrentPlannerWeek()`.

// Home uses the shared focus and radius roles; the exterior material values live
// in the single Home CSS block in index.css.
const M = {
  radius: "rounded-[var(--radius-support)]",
  focus:
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;

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

// Weekly progress aggregate. We consume only `weeklyProgress` — the plant count,
// which is household DATA and stays here under the owner's UX3 split (the room
// keeps today, orientation and context; the Companion takes the coaching).
// The Dashboard's second reader of this payload was `HomeIntelligenceCompanion`,
// retired by UX3, so this is now the route's one client consumer.
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
      className="w-7 h-7 rounded-lg flex items-center justify-center bg-accent shrink-0"
      style={{ color: "var(--primary-border)" }}
    >
      {children}
    </span>
  );
}

// REBUILD1 (Room 1, 2026-07-22) — THE PLANT RING IS RETIRED.
//
// PRESENCE1 removed the ring's arc (the progress meter that graded a household's
// week against a target they never set — GEA13) but left the ring itself: an
// `--accent`-stroked circle around a leaf, drawn at 88px beside the count. With the
// arc gone it encoded NOTHING — plaster-on-ivory, near-invisible — and its only
// remaining effect was a dashboard-meter silhouette on the calmest room in the
// house. So it goes, by the room's own values: *delete before adding* and *never
// decorative for its own sake* (CRAFT1 §5–§6; the with-and-without test, LHDC1 §18 —
// removing it loses nothing and quietens the frame). The count is the fact and now
// stands as the one quiet mark; the card's header already carries the leaf that
// names it. No data, owner, or state path changed — a decorative SVG left the room.

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
  // PRESENCE1: plantPct is gone with the progress ring it drove. Home no longer
  // computes how far along a household is, because it no longer has anywhere to
  // say it. The import of WEEKLY_PLANT_TARGET goes with it — Home holds no
  // target to measure a family against.

  // EXPCOMP2 FAIL 4 — the Companion is invited, not intrusive: it arrives a beat
  // after the household, once the room has settled. The mechanism (and its
  // unmount release) is owned by companion-context; this is only the invitation.
  const settling =
    mealsWaiting || shoppingQuery.isLoading || homeIntelQuery.isLoading;
  useWithholdCompanion(settling);


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
      // PRESENCE1: this said "Your planner isn't linked to the calendar yet."
      // — as the FIRST sentence under "Today at a glance", on the emotional
      // centre of the house, on a household's first morning. The statement is
      // true and the honesty behind it is right; what was wrong was its
      // PLACEMENT. It made a technical fact about THA's own bookkeeping into
      // the room's greeting, and handed a guest a worry they did not arrive
      // with ("what is a calendar link, and have I done something wrong?") —
      // the exact inverse of outcome 1, less on their mind (§ 3.5).
      //
      // Home now says nothing here. Silence is the default and speech the
      // exception (GEA15), and the Meals card still explains the situation in
      // the one place where it actually bears on what the household sees.
      : plannerUnanchored
        ? null
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
  // The writing reveal is a reveal, never a withholding: under reduced motion the class
  // is not applied at all, so the name is simply there, complete, from frame one. The
  // mask must never be left mid-sweep by a 0.01ms duration (index.css, .signature-ink).
  const inkClass = prefersReducedMotion() ? "" : "signature-ink";

  // ── HOME2 Resolver — Determine primary action destination ──────────────────────────
  //
  // PRIORITY 4 REPAIR: Wire HOME2's canonical resolver to determine where the
  // primary action (Meals card) navigates to, based on household state rather than
  // device-local localStorage. This resolves BEH-9 defect ("Home has no door").
  //
  // The resolver is pure and total: it always returns exactly one destination, even
  // when data is loading/unavailable. When week is unanchored, week data is null (the
  // designed input), and the resolver falls to the floor (→ Planner).
  const primaryActionState: HomeState = {
    criticals: [], // TODO: Wire from Decision Engine when available
    week: plannerWeek?.anchored ? {
      weekNumber: plannerWeek.weekNumber,
      hasEmptyDays: todaysMeals.length === 0,
    } : null,
    shopping: {
      uncheckedCount: openShoppingCount,
    },
  };
  const primaryAction = resolveHomePrimaryAction(primaryActionState);

  return (
    <>
      {/* HOMEEXT1: one admitted exterior view and one content ground. */}
      <div className="home-room home-room--exterior relative isolate flex-1" data-testid="home-room">
        <HomeExteriorView />
        <div className="home-exterior-content">
          <div className="home-exterior-intro">
          <header className="home-exterior-welcome">
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
              {stateSentence && (
                <p className="mt-1 text-sm text-muted-foreground" data-testid="text-home-state">
                  {stateSentence === "Today is open." ? "Should we plan today?" : stateSentence}
                </p>
              )}
            </header>

            {/* THE COMPANION IS NOT IN THIS COLUMN, BY DESIGN.
                UX2 dissolved Home's boxed "From your Companion" panel — *"a boxed
                panel that lists notices is a PAGE speaking in the Companion's
                name"* — and UX3 gave the Companion its own mouth: the global
                FloatingAssistant (app-shell.tsx), which lights the emblem's `aware`
                state in EVERY room rather than letting one page quote the friend at
                the counter. The Notice Engine, its Silence Rules and the Behaviour
                Engine's voicing are untouched; only the mouth moved. Home therefore
                renders NO Companion surface of its own, and none may be re-added
                here (the impersonation defect UX2/UX3 retired). */}
          </div>

          {/* Today stays on a readable ground while the garden remains a view. */}
          <section className="home-exterior-day" aria-label="Home summaries">
            <div className="home-exterior-ground" data-testid="ground-home">
              {/* The three small summaries use their existing source data. */}
              {mealsBroken && shoppingQuery.isError && homeIntelQuery.isError ? (
                <LoadError
                  what="today at a glance"
                  onRetry={() => { retryTodaysMeals(); shoppingQuery.refetch(); homeIntelQuery.refetch(); }}
                  data-testid="error-home-glance"
                />
              ) : (
                <div
                  className="home-exterior-cards grid grid-cols-1 gap-2 sm:gap-2.5 md:grid-cols-3"
                  data-testid="card-home-glance"
                >
                  {/* ── Meals ── whole card is the one door to the room (GEA18); the
                      former in-card "View planner ›" text is gone, not duplicated. */}
                  {mealsBroken ? (
                    <div className={`home-object home-object--compact ${M.radius} min-w-0`} data-testid="glance-meals">
                      <div className="flex items-center gap-2 mb-2">
                        <Chip><CalendarDays style={{ width: 14, height: 14 }} /></Chip>
                        <div className="min-w-0">
                          <h3 className="title-card text-foreground">Meals</h3>
                          <p className="text-sm text-muted-foreground">Unavailable</p>
                        </div>
                      </div>
                      <LoadError
                        what="today's meals"
                        onRetry={retryTodaysMeals}
                        data-testid="error-home-todays-meals"
                      />
                    </div>
                  ) : (
                    <Link
                      href={
                        primaryAction.destination === "shopping"
                          ? "/shopping"
                          : primaryAction.destination === "pantry"
                            ? "/larder-room"
                            : "/planner"
                      }
                      className={`home-object home-object--compact ${M.radius} ${M.focus} min-w-0 block`}
                      data-testid="glance-meals"
                    >
                      <div className="flex items-center gap-2">
                        <Chip><CalendarDays style={{ width: 14, height: 14 }} /></Chip>
                        <div className="min-w-0">
                          <h3 className="title-card text-foreground">Meals</h3>
                          {mealsWaiting ? (
                            <Skeleton className="h-4 w-20 mt-1" />
                          ) : plannerUnanchored ? (
                            /* CONV1 P8 / BEH-3 — "Nothing planned" is a claim about TODAY,
                               and THA has no today in the planner to make it about. */
                            <p className="text-sm text-muted-foreground" data-testid="text-home-meals-unanchored-count">
                              Not tied to a week yet
                            </p>
                          ) : (
                            <p className="text-sm font-medium" style={{ color: "var(--primary-border)" }} data-testid="text-home-meals-count">
                              {todaysMeals.length === 0
                                ? "An open day"
                                : `${todaysMeals.length} planned`}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* ── Shopping ── whole card is the one door; see the Meals
                      card's note above (GEA18) — applies here identically. */}
                  {shoppingQuery.isError ? (
                    <div className={`home-object home-object--compact ${M.radius} min-w-0`} data-testid="glance-shopping">
                      <div className="flex items-center gap-2 mb-2">
                        <Chip><ShoppingCart style={{ width: 14, height: 14 }} /></Chip>
                        <div className="min-w-0">
                          <h3 className="title-card text-foreground">Shopping</h3>
                          <p className="text-sm text-muted-foreground">Unavailable</p>
                        </div>
                      </div>
                      <LoadError
                        what="your shopping list"
                        onRetry={() => shoppingQuery.refetch()}
                        data-testid="error-home-shopping"
                      />
                    </div>
                  ) : (
                    <Link
                      href="/shopping-workspace"
                      className={`home-object home-object--compact ${M.radius} ${M.focus} min-w-0 block`}
                      data-testid="glance-shopping"
                    >
                      <div className="flex items-center gap-2">
                        <Chip><ShoppingCart style={{ width: 14, height: 14 }} /></Chip>
                        <div className="min-w-0">
                          <h3 className="title-card text-foreground">Shopping</h3>
                          {shoppingQuery.isLoading ? (
                            <Skeleton className="h-4 w-20 mt-1" />
                          ) : (
                            <p className="text-sm font-medium" style={{ color: "var(--primary-border)" }} data-testid="text-home-shopping-summary">
                              {openShoppingCount === 0
                                ? "List is clear"
                                : `${openShoppingCount} ${openShoppingCount === 1 ? "item" : "items"} to buy`}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}

                  {/* ── From the orchard ── the week's variety. Compact header-only
                      card, whole-card link like Meals/Shopping above (GEA18). */}
                  {homeIntelQuery.isError ? (
                    <div className={`home-object home-object--compact ${M.radius} min-w-0`} data-testid="glance-plants">
                      <div className="flex items-center gap-2 mb-2">
                        <Chip><Leaf style={{ width: 14, height: 14 }} /></Chip>
                        <div className="min-w-0">
                          <h3 className="title-card text-foreground">From the orchard</h3>
                          <p className="text-sm text-muted-foreground">Unavailable</p>
                        </div>
                      </div>
                      <LoadError
                        what="your plant diversity"
                        onRetry={() => homeIntelQuery.refetch()}
                        data-testid="error-home-plant-diversity"
                      />
                    </div>
                  ) : (
                    <Link
                      href="/food"
                      className={`home-object home-object--compact ${M.radius} ${M.focus} min-w-0 block`}
                      data-testid="glance-plants"
                    >
                      <div className="flex items-center gap-2">
                        <Chip><Leaf style={{ width: 14, height: 14 }} /></Chip>
                        <div className="min-w-0">
                          <h3 className="title-card text-foreground">From the orchard</h3>
                          {homeIntelQuery.isLoading ? (
                            <Skeleton className="h-4 w-20 mt-1" />
                          ) : plantCount === null ? (
                            // Absence, honestly: the server has no weekly picture yet.
                            <p className="text-sm text-muted-foreground" data-testid="text-home-plant-empty">
                              No variety yet this week
                            </p>
                          ) : (
                            // PRESENCE1: the "/ 30" denominator stays gone — the count is
                            // the fact; the target was the judgement.
                            <p className="text-sm font-medium" style={{ color: "var(--primary-border)" }} data-testid="text-home-plant-summary">
                              {plantCount} different plant{plantCount === 1 ? "" : "s"} this week
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              )}

            </div>
          </section>

          {/* The shared bottom navigation keeps every room one step away. */}
          <div className="home-exterior-dashboard-link">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="link-home-dashboard"
            >
              See your full dashboard
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
