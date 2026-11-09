// EXP2 — shared helpers for the five Arrival Experience exploration prototypes
// (DEVELOPMENT-ONLY, consumed only by pages/dev/arrival-{a..e}-*.tsx).
//
// ─────────────────────────────────────────────────────────────────────────────
// The five EXP2 prototypes are an EXPLORATION: five genuinely different
// interpretations of the THA Experience Language's arrival, built to be looked
// at side by side. None of them is a second Home. This module exists so the five
// pages differ ONLY in the thing being explored — the emotional experience of
// arriving — while everything else (data, workspace content, gates) is literally
// the same code:
//
//   • useHomeData() reads the SAME query keys as the live Home, so all five
//     prototypes share its react-query cache entries and fetch nothing extra.
//   • HomeWorkspace renders the ARRIVAL1-parity workspace from the canonical
//     owners (Card, Button, Skeleton, LoadError, MealCard). Nothing is forked.
//   • useArrivalGate() is the one gate: reduced motion → no arrival, ever;
//     one arrival per prototype per session; `?replay` re-plays it for review.
//
// Disposition is the exploration's, and binary per idea (not per file): ideas
// worth keeping graduate into the ONE adopted arrival; the five prototypes and
// this module are then DELETED. A prototype that survives its own decision has
// become the thing it was built to prevent.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { FullWeek } from "@/lib/planner-types";
import { api } from "@shared/routes";
import { useUser } from "@/hooks/use-user";
import { useMealsSummary } from "@/hooks/use-meals-summary";
import { useCompanionNotices } from "@/hooks/use-companion-notices";
import { prefersReducedMotion } from "@/lib/companion-delight";
import { MealCard } from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import { CalendarDays, ShoppingCart, Leaf, ArrowRight, Bell } from "lucide-react";

// ── The one arrival gate ─────────────────────────────────────────────────────

export type Arrival = "full" | "none";

/**
 * Resolves ONCE per mount — the arrival must not change under the household
 * mid-sequence.
 *
 *  • Reduced motion is a guarantee, not a variant (UIA §11): the finished
 *    workspace immediately, with no arrival of any kind.
 *  • One arrival per prototype per session (a return is navigation, not a first
 *    impression) — each prototype has its own key so walking A → B → C for
 *    review still lets each say hello once.
 *  • `?replay` re-plays the arrival regardless — these pages exist to be
 *    watched repeatedly, and forcing a fresh session per viewing would make the
 *    exploration harder to review, which is the whole point of building it.
 */
export function useArrivalGate(storageKey: string): Arrival {
  const [arrival] = useState<Arrival>(() => {
    if (prefersReducedMotion()) return "none";
    try {
      const replay = new URLSearchParams(window.location.search).has("replay");
      if (!replay && sessionStorage.getItem(storageKey)) return "none";
      sessionStorage.setItem(storageKey, "1");
      return "full";
    } catch {
      return "none";
    }
  });
  return arrival;
}

// ── The signature webfont (prototype A only) ─────────────────────────────────
//
// Loaded HERE, not in index.css, so production pays nothing for it: no
// household downloads a font for a page only a developer can open. The TOKEN
// (`--font-signature`) lives in index.css where §16 requires it.
export function useSignatureFont(): void {
  useEffect(() => {
    const HREF = "https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap";
    if (document.querySelector(`link[href="${HREF}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = HREF;
    document.head.appendChild(link);
  }, []);
}

// ── Sizing a scene to the shell's own scroll viewport ────────────────────────
//
// The scroll container is the shared <main> (viewport − header − bottom nav).
// Measuring it lets a scene fill EXACTLY that area, so a one-viewport workspace
// lands with no stray scroll — rather than guessing with `100dvh` and
// overshooting by the chrome.
export function findScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const oy = getComputedStyle(node).overflowY;
    if ((oy === "auto" || oy === "scroll") && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }
  return null;
}

export function useSceneHeight(ref: React.RefObject<HTMLElement | null>): number | null {
  const [sceneH, setSceneH] = useState<number | null>(null);
  useEffect(() => {
    const measure = () => {
      const container = findScrollParent(ref.current);
      if (container) setSceneH(container.clientHeight);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref]);
  return sceneH;
}

// ── Data — same keys, same cache, as the live Home ───────────────────────────

const ACTIVE_WEEK_KEY = "planner:active-week";
export const WEEKLY_PLANT_TARGET = 30;

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

interface HomeIntelligenceData {
  weeklyProgress: { plantCount: number; mealsPlanned: number; daysWithMeals: number } | null;
}

export interface TodayMeal {
  id: string;
  name: string;
  mealType: string | null;
  imageUrl: string | null;
}

function firstNameOf(user: ReturnType<typeof useUser>["user"]): string | null {
  const raw = user?.firstName || user?.displayName || user?.username || null;
  if (!raw) return null;
  return raw.split("@")[0] || null;
}

export function todayLabel(): string {
  try {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long", day: "numeric", month: "long",
    });
  } catch {
    return "";
  }
}

export interface HomeData {
  name: string | null;
  todaysMeals: TodayMeal[];
  mealsWaiting: boolean;
  mealsBroken: boolean;
  mealsSettled: boolean;
  retryTodaysMeals: () => void;
  shoppingWaiting: boolean;
  shoppingBroken: boolean;
  retryShopping: () => void;
  openShoppingCount: number;
  plantsWaiting: boolean;
  plantsBroken: boolean;
  retryPlants: () => void;
  plantCount: number;
  plantPct: number;
  /** The single most relevant household reminder — never a feed (EXP §7). */
  reminder: { id: string; text: string } | null;
  /** The one primary action's label follows the truth of today. */
  primaryLabel: string;
}

export function useHomeData(): HomeData {
  const { user } = useUser();
  const activeWeek = loadActiveWeek();
  const plannerQuery = useQuery<FullWeek[]>({ queryKey: ["/api/planner/full"], enabled: !!user });
  const mealsQuery = useMealsSummary();
  const shoppingQuery = useQuery<any[]>({ queryKey: [api.shoppingList.list.path], enabled: !!user });
  const homeIntelQuery = useQuery<HomeIntelligenceData>({
    queryKey: ["/api/home/intelligence"],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
  const { data: noticesData } = useCompanionNotices(!!user);

  const fullPlanner = plannerQuery.data ?? [];
  const mealsList = mealsQuery.meals ?? [];
  const shoppingItems = shoppingQuery.data ?? [];

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

  const mealsWaiting = plannerQuery.isLoading || mealsQuery.isLoading;
  const mealsBroken = plannerQuery.isError || mealsQuery.isError;
  const openShoppingCount = shoppingItems.filter((i: any) => !i.checked).length;
  const plantCount = homeIntelQuery.data?.weeklyProgress?.plantCount ?? 0;

  return {
    name: firstNameOf(user),
    todaysMeals,
    mealsWaiting,
    mealsBroken,
    mealsSettled: !mealsWaiting && !mealsBroken,
    retryTodaysMeals: () => { plannerQuery.refetch(); mealsQuery.refetch(); },
    shoppingWaiting: shoppingQuery.isLoading,
    shoppingBroken: shoppingQuery.isError,
    retryShopping: () => shoppingQuery.refetch(),
    openShoppingCount,
    plantsWaiting: homeIntelQuery.isLoading,
    plantsBroken: homeIntelQuery.isError,
    retryPlants: () => homeIntelQuery.refetch(),
    plantCount,
    plantPct: Math.min(100, Math.round((plantCount / WEEKLY_PLANT_TARGET) * 100)),
    reminder: (noticesData?.notices ?? [])[0] ?? null,
    primaryLabel: todaysMeals.length === 0 ? "Plan today" : "Open today's plan",
  };
}

// ── The parity workspace ─────────────────────────────────────────────────────
//
// The ARRIVAL1 workspace, verbatim in content and hierarchy: Today (primary,
// home of the one action) → Shopping + Plants as one supporting beat → one
// reminder → one quiet way deeper. Used by the prototypes whose exploration is
// the ARRIVAL, so the room they land in is identical and only the arriving
// differs. Prototypes whose exploration IS the room (C, E) compose their own.
export function HomeWorkspace({ data, prefix, lead }: {
  data: HomeData;
  /** test-id prefix, e.g. "a" → data-testid="card-a-todays-meals" */
  prefix: string;
  /** An optional quiet element rendered before the cards (prototype D's observation). */
  lead?: React.ReactNode;
}) {
  const d = data;
  return (
    <div className="space-y-4" aria-label="Home">
      {lead}

      {/* ── Today's meals — the primary, and the home of the one action ────── */}
      {d.mealsBroken ? (
        <LoadError what="today's meals" onRetry={d.retryTodaysMeals} data-testid={`error-${prefix}-todays-meals`} />
      ) : (
        <Card className="border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" data-testid={`card-${prefix}-todays-meals`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(172,20%,92%)] text-[hsl(172,38%,26%)] dark:bg-[hsl(172,14%,18%)] dark:text-[hsl(172,26%,68%)] shrink-0">
                <CalendarDays style={{ width: 18, height: 18 }} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Today's meals</h3>
                <p className="text-xs text-muted-foreground">What's planned for today</p>
              </div>
            </div>

            {d.mealsWaiting ? (
              <div className="flex flex-col gap-2" data-testid={`loading-${prefix}-todays-meals`}>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            ) : d.todaysMeals.length === 0 ? (
              <p className="text-sm text-muted-foreground" data-testid={`text-${prefix}-meals-empty`}>
                Nothing planned for today yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5" data-testid={`list-${prefix}-todays-meals`}>
                {d.todaysMeals.map((m) => (
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

            {/* The one primary-styled action on the page. */}
            <Button asChild variant="default" className="mt-5 w-full sm:w-auto" data-testid={`button-${prefix}-primary`}>
              <Link href="/planner">{d.primaryLabel}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Shopping + Plants — one supporting beat, visibly subordinate ────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {d.shoppingBroken ? (
          <LoadError what="your shopping list" onRetry={d.retryShopping} className="h-full" data-testid={`error-${prefix}-shopping`} />
        ) : (
          <Link href="/shopping-workspace" aria-label="Go to shopping">
            <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/30 bg-card/60 backdrop-blur-sm" data-testid={`card-${prefix}-shopping`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(190,24%,92%)] text-[hsl(190,42%,26%)] dark:bg-[hsl(190,16%,18%)] dark:text-[hsl(190,30%,68%)] shrink-0">
                    <ShoppingCart style={{ width: 16, height: 16 }} />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">Shopping</h3>
                </div>
                {d.shoppingWaiting ? (
                  <Skeleton className="h-5 w-24" data-testid={`loading-${prefix}-shopping`} />
                ) : (
                  <p className="text-sm text-foreground/85" data-testid={`text-${prefix}-shopping-summary`}>
                    {d.openShoppingCount === 0 ? (
                      "Your list is clear."
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">{d.openShoppingCount}</span>{" "}
                        {d.openShoppingCount === 1 ? "item" : "items"} to buy
                      </>
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        )}

        {d.plantsBroken ? (
          <LoadError what="your plant diversity" onRetry={d.retryPlants} className="h-full" data-testid={`error-${prefix}-plant-diversity`} />
        ) : (
          <Link href="/plant-diversity" aria-label="Go to plant diversity">
            <Card className="h-full group cursor-pointer hover-elevate transition-all duration-200 border-border/30 bg-card/60 backdrop-blur-sm" data-testid={`card-${prefix}-plant-diversity`}>
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(145,20%,91%)] text-[hsl(145,36%,26%)] dark:bg-[hsl(145,14%,18%)] dark:text-[hsl(145,26%,66%)] shrink-0">
                    <Leaf style={{ width: 16, height: 16 }} />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">Plant diversity</h3>
                </div>
                {d.plantsWaiting ? (
                  <div className="flex flex-col gap-2" data-testid={`loading-${prefix}-plant-diversity`}>
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-1.5 w-full" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-foreground/85 mb-2" data-testid={`text-${prefix}-plant-summary`}>
                      <span className="font-semibold text-foreground">{d.plantCount}</span> of {WEEKLY_PLANT_TARGET} plants
                    </p>
                    <div className="h-1.5 w-full rounded-full bg-[hsl(145,16%,90%)] dark:bg-[hsl(145,10%,20%)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[hsl(145,34%,52%)] transition-all"
                        style={{ width: `${d.plantPct}%` }}
                        data-testid={`bar-${prefix}-plant-progress`}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </Link>
        )}
      </div>

      {/* ── One household reminder — a single sentence, never a feed ────────── */}
      {d.reminder && (
        <div className="flex items-start gap-2.5 px-1 pt-1 text-sm text-foreground/75 leading-relaxed" data-testid={`${prefix}-reminder`}>
          <Bell className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
          {/* The Behaviour Engine's sentence, rendered verbatim. Never reworded here. */}
          <span>{d.reminder.text}</span>
        </div>
      )}
    </div>
  );
}

/** The quiet way deeper — never competing with the primary. */
export function DashboardLink({ prefix }: { prefix: string }) {
  return (
    <div className="mt-8 flex justify-center">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        data-testid={`link-${prefix}-dashboard`}
      >
        See your full dashboard
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
