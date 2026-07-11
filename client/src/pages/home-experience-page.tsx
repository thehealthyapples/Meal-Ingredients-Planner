// UX0 — Home Experience.
//
// The calm, welcoming landing screen shown as the default destination after
// login. It surfaces only TODAY's most relevant information and always makes the
// next logical action obvious.
//
// This page owns NO data. Every value is read from an existing canonical owner
// through the shared react-query caches:
//   • Today's meals  → /api/planner/full + /api/meals (Planner state)
//   • Shopping        → /api/shopping-list      (Shopping state)
//   • Plant diversity → /api/home/intelligence  (weeklyProgress.plantCount)
//   • Reminders       → useCompanionObservations (Notice Engine projection)
// No new store, no duplicate state, no second assistant. Honest gaps: a section
// that has no validated data renders as a calm empty state, never fabricated.

import { useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { Meal } from "@shared/schema";
import type { FullWeek } from "@/lib/planner-types";
import { api } from "@shared/routes";
import { useUser } from "@/hooks/use-user";
import { useCompanionObservations } from "@/hooks/use-companion-observations";
import { WorkspaceHeader } from "@/components/workspace-header";
import { Card, CardContent } from "@/components/ui/card";
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

  const { data: fullPlanner = [] } = useQuery<FullWeek[]>({
    queryKey: ["/api/planner/full"],
    enabled: !!user,
  });
  const { data: mealsList = [] } = useQuery<Meal[]>({
    queryKey: ["/api/meals"],
    enabled: !!user,
  });
  const { data: shoppingItems = [] } = useQuery<any[]>({
    queryKey: [api.shoppingList.list.path],
    enabled: !!user,
  });
  const { data: homeIntel } = useQuery<HomeIntelligenceData>({
    queryKey: ["/api/home/intelligence"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const { data: observationsData } = useCompanionObservations(!!user);

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
  const plantCount = homeIntel?.weeklyProgress?.plantCount ?? 0;
  const plantPct = Math.min(100, Math.round((plantCount / WEEKLY_PLANT_TARGET) * 100));

  // Reminders — server already applied Silence Rules + ranking + voicing. We
  // show a calm few and never fabricate: no notices → the section is absent.
  const reminders = (observationsData?.observations ?? []).slice(0, 3);

  const name = firstNameOf(user);

  return (
    <>
      <WorkspaceHeader realm="home" title="Home" titleTestId="text-home-title" />

      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* ── Greeting ── */}
        <header className="mb-8 sm:mb-10">
          <p
            className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground/70 mb-2"
            data-testid="text-home-date"
          >
            {todayLabel()}
          </p>
          <h1
            className="text-[1.9rem] sm:text-4xl font-semibold tracking-tight text-foreground leading-tight"
            data-testid="text-home-greeting"
          >
            Welcome Home{name ? `, ${name}` : ""}.
          </h1>
          <p
            className="mt-2 text-base sm:text-lg text-muted-foreground"
            data-testid="text-home-subtitle"
          >
            How can I help your family today?
          </p>
        </header>

        {/* ── Today's focus ── */}
        <section className="space-y-4" aria-label="Today">
          {/* Today's Meals */}
          <Link href="/planner" aria-label="Go to the planner">
            <Card
              className="group cursor-pointer hover-elevate transition-all duration-200 border-border/40"
              data-testid="card-home-todays-meals"
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(172,20%,92%)] text-[hsl(172,38%,26%)] dark:bg-[hsl(172,14%,18%)] dark:text-[hsl(172,26%,68%)] shrink-0">
                    <CalendarDays className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-foreground">Today's Meals</h2>
                    <p className="text-xs text-muted-foreground">What's planned for today</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                </div>

                {todaysMeals.length === 0 ? (
                  <p className="text-sm text-muted-foreground" data-testid="text-home-meals-empty">
                    Nothing planned for today yet — tap to map out your day.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-1.5" data-testid="list-home-todays-meals">
                    {todaysMeals.map((m) => (
                      <li key={m.id} className="flex items-center gap-2 text-sm text-foreground/85">
                        {m.imageUrl ? (
                          <img
                            src={m.imageUrl}
                            alt=""
                            className="w-7 h-7 rounded-md object-cover shrink-0"
                            onError={(e) => { (e.target as HTMLImageElement).style.visibility = "hidden"; }}
                          />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(172,30%,55%)] shrink-0 ml-2.5 mr-2.5" />
                        )}
                        <span className="truncate">{m.name}</span>
                        {m.mealType && (
                          <span className="text-[11px] text-muted-foreground/70 capitalize shrink-0 ml-auto">
                            {m.mealType}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Shopping + Plant diversity — paired row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Shopping */}
            <Link href="/shopping-workspace" aria-label="Go to shopping">
              <Card
                className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/40"
                data-testid="card-home-shopping"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(190,24%,92%)] text-[hsl(190,42%,26%)] dark:bg-[hsl(190,16%,18%)] dark:text-[hsl(190,30%,68%)] shrink-0">
                      <ShoppingCart className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-foreground">Shopping</h2>
                      <p className="text-xs text-muted-foreground">Your list</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                  </div>
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
                </CardContent>
              </Card>
            </Link>

            {/* Plant diversity */}
            <Link href="/plant-diversity" aria-label="Go to plant diversity">
              <Card
                className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/40"
                data-testid="card-home-plant-diversity"
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(145,20%,91%)] text-[hsl(145,36%,26%)] dark:bg-[hsl(145,14%,18%)] dark:text-[hsl(145,26%,66%)] shrink-0">
                      <Leaf className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-foreground">Plant Diversity</h2>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                  </div>
                  <p className="text-sm text-foreground/85 mb-2" data-testid="text-home-plant-summary">
                    <span className="font-semibold text-foreground">{plantCount}</span> of {WEEKLY_PLANT_TARGET} plants
                  </p>
                  <div className="h-1.5 w-full rounded-full bg-[hsl(145,16%,90%)] dark:bg-[hsl(145,10%,20%)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[hsl(145,34%,52%)] transition-all"
                      style={{ width: `${plantPct}%` }}
                      data-testid="bar-home-plant-progress"
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Reminders — only when the Notice Engine has something to say */}
          {reminders.length > 0 && (
            <Card className="border-border/40" data-testid="card-home-reminders">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-primary/60" />
                  <h2 className="text-sm font-semibold text-foreground">A gentle reminder</h2>
                </div>
                <ul className="space-y-2.5" data-testid="list-home-reminders">
                  {reminders.map((o, i) => (
                    <li
                      key={`${o.category}-${i}`}
                      className="flex items-start gap-2.5 text-sm text-foreground/80 leading-relaxed"
                      data-testid={`home-reminder-${i}`}
                    >
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
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
