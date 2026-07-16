// UX0 — Home Experience.
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
// No new store, no duplicate state, no second assistant. Honest gaps: a section
// that has no validated data renders as a calm empty state, never fabricated.
//
// ODL1 (2026-07-16) — Orchard Design Language refinement. Visual only: the named
// type roles (.title-page/.title-section/.title-card) replace raw sizes, the
// greeting becomes the display-voice identity moment, the plant card renders an
// honest absence instead of "0 of 30" when the server has no weekly picture, and
// the Companion holds its entrance (useWithholdCompanion) until the room settles.
// The orchard backdrop, signature hand, and depth vocabulary of the North Star
// concepts remain governance-gated (UIA §4 amendment / adoption register) and are
// deliberately NOT shipped here.
//
// PX1-W0 (fnd-px-false-empty-home). That promise was defeated by the loading path.
// Every query below destructured `= []`, and NOT ONE of them read isLoading or
// isError — so on first paint a household with a full week planned and a full
// basket was told "Nothing planned for today yet" and "Your list is clear", and a
// server outage was told to them in exactly the same words. Three states were
// rendered as one. Each section below now separates them: WAITING (skeleton),
// BROKEN (the canonical `LoadError`), and genuinely EMPTY. An absence is only ever
// claimed once it is known to be true.

import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { FullWeek } from "@/lib/planner-types";
import { api } from "@shared/routes";
import { useUser } from "@/hooks/use-user";
import { useMealsSummary } from "@/hooks/use-meals-summary";
import { useCompanionNotices } from "@/hooks/use-companion-notices";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { WorkspaceHeader } from "@/components/workspace-header";
import { MealCard } from "@/components/MealCard";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import {
  CalendarDays, ShoppingCart, Leaf, ArrowRight, Bell, ChevronRight,
} from "lucide-react";

// Mirror of the planner's active-week persistence (weekly-planner-page.tsx /
// use-week-meal-entries.ts) so Home resolves the same week without inheriting
// planner component state. Read-only.
const ACTIVE_WEEK_KEY = "planner:active-week";
const WEEKLY_PLANT_TARGET = 30;

function loadActiveWeek(): number {
  try {
    const raw = localStorage.getItem(ACTIVE_WEEK_KEY);
    if (!raw) return 1;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed === "string" && /^[1-9]\d*$/.test(parsed)) return Number(parsed);
  } catch {
    /* fall through to default */
  }
  return 1;
}

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

export default function HomeExperiencePage() {
  const { user } = useUser();
  const activeWeek = loadActiveWeek();

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

  // Today's planned meals — active week, calendar day-of-week. The planner is
  // week-number based (no stored date), so "today" is derived, not queried.
  const todaysMeals = useMemo<TodayMeal[]>(() => {
    const week = fullPlanner.find((w) => w.weekNumber === activeWeek);
    if (!week) return [];
    const todayDow = new Date().getDay();
    const day = week.days.find((d) => d.dayOfWeek === todayDow);
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
  }, [fullPlanner, mealsList, activeWeek]);

  const openShoppingCount = shoppingItems.filter((i: any) => !i.checked).length;
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
  // Engine owns and its §9 forbids. A latent second budget is still a second budget: the
  // day someone raised MAX_NOTICES_PER_MOMENT, this line would have silently overruled
  // them from the wrong layer.
  //
  // No notices → the section is absent. Silence is a first-class outcome, never padded.
  const reminders = noticesData?.notices ?? [];

  const name = firstNameOf(user);

  return (
    <>
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      {/* Home keeps its compact-counter column (max-w-3xl) — the adoption of the
          canonical pageContainerClass is a named open item (EXPCOMP2 conflict);
          widening here would silently change the room's posture. Air, not width. */}
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* ── Greeting — the arrival, an identity moment in the display voice.
               Two lines as one heading: the welcome is quiet, the household's
               name carries the room. (EXPCOMP2 FAIL 5: the date line's /70 was
               3.40:1 at 11px; raw sizes move onto the named type roles.) ── */}
        <header className="mb-10 sm:mb-12">
          <p
            className="text-xs uppercase tracking-widest text-muted-foreground mb-3"
            data-testid="text-home-date"
          >
            {todayLabel()}
          </p>
          <h1 data-testid="text-home-greeting" className="text-foreground">
            {name ? (
              <>
                <span className="block title-section text-muted-foreground">
                  Welcome home,
                </span>
                <span className="block title-page mt-0.5">{name}</span>
              </>
            ) : (
              <span className="block title-page">Welcome home.</span>
            )}
          </h1>
          <p
            className="mt-3 text-base sm:text-lg text-muted-foreground"
            data-testid="text-home-subtitle"
          >
            How can I help your family today?
          </p>
        </header>

        {/* ── Today at a glance ── */}
        <section className="space-y-4" aria-labelledby="home-today-heading">
          <h2
            id="home-today-heading"
            className="title-card text-muted-foreground pt-1"
            data-testid="text-home-today-heading"
          >
            Today at a glance
          </h2>
          {/* Today's Meals */}
          {mealsBroken ? (
            <LoadError
              what="today's meals"
              onRetry={retryTodaysMeals}
              data-testid="error-home-todays-meals"
            />
          ) : (
          <Link href="/planner" aria-label="Go to the planner">
            <Card
              className="group cursor-pointer hover-elevate transition-all duration-200 border-border/40"
              data-testid="card-home-todays-meals"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(172,20%,92%)] text-[hsl(172,38%,26%)] shrink-0">
                    <CalendarDays style={{ width: 18, height: 18 }} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="title-card text-foreground">Today's Meals</h3>
                    <p className="text-xs text-muted-foreground">What's planned for today</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>

                {mealsWaiting ? (
                  <div className="flex flex-col gap-2" data-testid="loading-home-todays-meals">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ) : todaysMeals.length === 0 ? (
                  <p className="text-sm text-muted-foreground" data-testid="text-home-meals-empty">
                    Nothing planned for today yet — tap to map out your day.
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
              </CardContent>
            </Card>
          </Link>
          )}

          {/* Shopping + Plant diversity — paired row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shopping */}
            {shoppingQuery.isError ? (
              <LoadError
                what="your shopping list"
                onRetry={() => shoppingQuery.refetch()}
                className="h-full"
                data-testid="error-home-shopping"
              />
            ) : (
            <Link href="/shopping-workspace" aria-label="Go to shopping">
              <Card
                className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/40"
                data-testid="card-home-shopping"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(190,24%,92%)] text-[hsl(190,42%,26%)] shrink-0">
                      <ShoppingCart style={{ width: 18, height: 18 }} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="title-card text-foreground">Shopping</h3>
                      <p className="text-xs text-muted-foreground">Your list</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  {shoppingQuery.isLoading ? (
                    <Skeleton className="h-5 w-24" data-testid="loading-home-shopping" />
                  ) : (
                    <p className="text-sm text-foreground/85" data-testid="text-home-shopping-summary">
                      {openShoppingCount === 0 ? (
                        "Your list is clear."
                      ) : (
                        <>
                          <span className="font-semibold text-foreground">{openShoppingCount}</span>{" "}
                          {openShoppingCount === 1 ? "item" : "items"} to buy
                        </>
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
            )}

            {/* Plant diversity */}
            {homeIntelQuery.isError ? (
              <LoadError
                what="your plant diversity"
                onRetry={() => homeIntelQuery.refetch()}
                className="h-full"
                data-testid="error-home-plant-diversity"
              />
            ) : (
            <Link href="/plant-diversity" aria-label="Go to plant diversity">
              <Card
                className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/40"
                data-testid="card-home-plant-diversity"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(145,20%,91%)] text-[hsl(145,36%,26%)] shrink-0">
                      <Leaf style={{ width: 18, height: 18 }} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="title-card text-foreground">Plant Diversity</h3>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  {homeIntelQuery.isLoading ? (
                    <div className="flex flex-col gap-2" data-testid="loading-home-plant-diversity">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-1.5 w-full" />
                    </div>
                  ) : plantCount === null ? (
                    // Absence, honestly: the server has no weekly picture yet.
                    // A calm invitation, never a fabricated zero.
                    <p className="text-sm text-muted-foreground" data-testid="text-home-plant-empty">
                      Your week's variety will appear here as meals are planned.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm text-foreground/85 mb-2" data-testid="text-home-plant-summary">
                        <span className="font-semibold text-foreground">{plantCount}</span> of {WEEKLY_PLANT_TARGET} plants
                      </p>
                      <div className="h-1.5 w-full rounded-full bg-[hsl(145,16%,90%)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[hsl(145,34%,52%)] transition-all"
                          style={{ width: `${plantPct}%` }}
                          data-testid="bar-home-plant-progress"
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </Link>
            )}
          </div>

          {/* Reminders — only when the Notice Engine has something to say */}
          {reminders.length > 0 && (
            <Card
              className="border-border/40 animate-in fade-in duration-500 motion-reduce:animate-none"
              data-testid="card-home-reminders"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-primary/60" />
                  <h3 className="title-card text-foreground">A gentle reminder</h3>
                </div>
                <ul className="space-y-2.5" data-testid="list-home-reminders">
                  {reminders.map((o, i) => (
                    <li
                      key={o.id}
                      className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed"
                      data-testid={`home-reminder-${i}`}
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                      {/* The Behaviour Engine's sentence, rendered verbatim. Never reworded here. */}
                      <span>{o.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </section>

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
      </div>
    </>
  );
}
