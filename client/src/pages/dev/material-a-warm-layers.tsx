// EXP4 · Study A — THE WARM LAYERED WORKSPACE (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS STUDY ASKS: can THA's surfaces feel like objects resting
// on a prepared counter, rather than rectangles printed on a page?
//
// Its material thesis is LAYERS. The room is built from distinct planes, each
// one nameable, back to front:
//
//   1. ENVIRONMENT — the orchard backdrop (canonical, untouched). The daylight
//      the whole room stands in.
//   2. THE GROUND — a broad, warm, linen-soft plane the workspace sits ON: the
//      prepared counter. It gathers the content into one place and gives every
//      card something to rest against, so nothing floats on the raw page.
//   3. THE PRIMARY SURFACE — today's meals. The nearest plane to the person:
//      fully solid, warmest white, the deepest (still soft, still warm-toned)
//      shadow, and a hairline rim of light along its top edge — the one place
//      the morning catches.
//   4. SUPPORTING SURFACES — shopping and plants. Visibly lower: translucent
//      enough for the ground to breathe through, a shallower shadow, a quieter
//      rim. Present, subordinate, unmistakably NOT the primary.
//   5. QUIET SURFACES — the reminder. No surface at all: it lies directly on
//      the counter, the way a note does.
//   6. FLOATING — the Companion (canonical, untouched). It already floats
//      above every plane and is deliberately left to demonstrate that layer
//      by itself.
//
// Every shadow is warm (hue from the foreground green-brown, never black) and
// describes SPACE — how far a surface sits above the counter — never drama.
//
// MICRO-INTERACTION THESIS: surfaces answer the hand physically. Hover LIFTS a
// supporting surface slightly toward you (small rise, shadow deepens); press
// SETTLES it back down (rise cancelled, shadow shortens); focus is the
// canonical visible ring. Nothing animates on its own — motion only ever
// answers the person, and reduced motion removes the transitions entirely.
//
// Shell: canonical, byte-identical WorkspaceHeader, visible from frame one.
// Data: exp2-shared's useHomeData — same query keys and cache as the live
// Home, nothing fetched twice, nothing owned. Content and hierarchy are
// IDENTICAL across Studies A/B/C, so the only variable is the material.
// Disposition: ideas graduate (any change to the UIA's flat-surface law is a
// governed amendment, never a drift); the study files are then DELETED.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef } from "react";
import { Link } from "wouter";
import { WorkspaceHeader } from "@/components/workspace-header";
import { MealCard } from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import { CalendarDays, ShoppingCart, Leaf, Bell } from "lucide-react";
import {
  useHomeData, useSceneHeight, DashboardLink, todayLabel, WEEKLY_PLANT_TARGET,
} from "./exp2-shared";

// The material, named once. Warm-hued shadows describe distance-from-counter;
// the inset hairline is the rim of light along a surface's top edge.
const M = {
  ground:
    "rounded-[1.75rem] border border-[hsl(36,28%,88%)]/70 bg-[hsl(42,40%,97%)]/75 backdrop-blur-md " +
    "shadow-[0_1px_3px_hsl(28_25%_28%/0.05)] " +
    "dark:bg-card/40 dark:border-border/30 dark:shadow-none",
  primary:
    "rounded-2xl border-[hsl(36,30%,91%)] bg-white " +
    "shadow-[inset_0_1px_0_hsl(48_60%_98%),0_1px_2px_hsl(28_25%_28%/0.05),0_10px_24px_-10px_hsl(28_30%_25%/0.16)] " +
    "dark:bg-card dark:border-border/40 dark:shadow-none",
  support:
    "h-full rounded-xl border-[hsl(36,26%,90%)]/80 bg-white/65 backdrop-blur-[2px] " +
    "shadow-[inset_0_1px_0_hsl(48_50%_97%/0.7),0_1px_2px_hsl(28_25%_28%/0.04),0_4px_10px_-6px_hsl(28_30%_25%/0.10)] " +
    "dark:bg-card/70 dark:border-border/40 dark:shadow-none " +
    // The hand: hover lifts, press settles, nothing moves unasked.
    "transition-[transform,box-shadow,background-color] duration-200 ease-out motion-reduce:transition-none " +
    "hover:-translate-y-0.5 hover:bg-white/85 " +
    "hover:shadow-[inset_0_1px_0_hsl(48_60%_98%),0_1px_2px_hsl(28_25%_28%/0.05),0_10px_22px_-9px_hsl(28_30%_25%/0.16)] " +
    "active:translate-y-0 " +
    "active:shadow-[inset_0_1px_0_hsl(48_50%_97%/0.7),0_1px_2px_hsl(28_25%_28%/0.06),0_2px_6px_-4px_hsl(28_30%_25%/0.12)]",
  supportLink:
    "block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;

export default function MaterialAWarmLayersPage() {
  const d = useHomeData();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const sceneH = useSceneHeight(workspaceRef);

  // Said only once it is KNOWN — never fabricated while loading.
  const stateSentence = d.mealsSettled
    ? d.todaysMeals.length === 0 ? "Today is open." : "Today is planned."
    : null;

  return (
    <div data-testid="material-a">
      {/* The standard THA header — the shell earns no exception (Principle E). */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      <div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex flex-col justify-center py-8 sm:py-12"
        style={sceneH ? { minHeight: sceneH } : undefined}
        data-testid="material-a-workspace"
      >
        {/* ── LAYER 2 — the ground: the prepared counter the room rests on. ── */}
        <section className={`${M.ground} p-4 sm:p-8`} data-testid="ground-ma">
          {/* Orientation — written on the counter itself, not on a card. */}
          <header className="mb-7 sm:mb-9 px-2 sm:px-1 pt-3 sm:pt-0">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-ma-date">
              {todayLabel()}
            </p>
            <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
              Today
            </h2>
            {stateSentence && (
              <p className="mt-2 text-base sm:text-lg text-muted-foreground" data-testid="text-ma-state">
                {stateSentence}
              </p>
            )}
          </header>

          <div className="space-y-4 sm:space-y-5" aria-label="Home">
            {/* ── LAYER 3 — THE PRIMARY SURFACE. Nearest the person, warmest
                white, the deepest soft shadow, the rim of light. ── */}
            {d.mealsBroken ? (
              <LoadError what="today's meals" onRetry={d.retryTodaysMeals} data-testid="error-ma-todays-meals" />
            ) : (
              <Card className={M.primary} data-testid="card-ma-todays-meals">
                <CardContent className="p-6 sm:p-7">
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
                    <div className="flex flex-col gap-2" data-testid="loading-ma-todays-meals">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  ) : d.todaysMeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-ma-meals-empty">
                      Nothing planned for today yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5" data-testid="list-ma-todays-meals">
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
                  <Button asChild variant="default" className="mt-5 w-full sm:w-auto" data-testid="button-ma-primary">
                    <Link href="/planner">{d.primaryLabel}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── LAYER 4 — SUPPORTING SURFACES. Lower planes: translucent to
                the counter, shallower shadows. Hover lifts; press settles. ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {d.shoppingBroken ? (
                <LoadError what="your shopping list" onRetry={d.retryShopping} className="h-full" data-testid="error-ma-shopping" />
              ) : (
                <Link href="/shopping-workspace" aria-label="Go to shopping" className={M.supportLink}>
                  <Card className={M.support} data-testid="card-ma-shopping">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(190,24%,92%)] text-[hsl(190,42%,26%)] dark:bg-[hsl(190,16%,18%)] dark:text-[hsl(190,30%,68%)] shrink-0">
                          <ShoppingCart style={{ width: 16, height: 16 }} />
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">Shopping</h3>
                      </div>
                      {d.shoppingWaiting ? (
                        <Skeleton className="h-5 w-24" data-testid="loading-ma-shopping" />
                      ) : (
                        <p className="text-sm text-foreground/85" data-testid="text-ma-shopping-summary">
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
                <LoadError what="your plant diversity" onRetry={d.retryPlants} className="h-full" data-testid="error-ma-plant-diversity" />
              ) : (
                <Link href="/plant-diversity" aria-label="Go to plant diversity" className={M.supportLink}>
                  <Card className={M.support} data-testid="card-ma-plant-diversity">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(145,20%,91%)] text-[hsl(145,36%,26%)] dark:bg-[hsl(145,14%,18%)] dark:text-[hsl(145,26%,66%)] shrink-0">
                          <Leaf style={{ width: 16, height: 16 }} />
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">Plant diversity</h3>
                      </div>
                      {d.plantsWaiting ? (
                        <div className="flex flex-col gap-2" data-testid="loading-ma-plant-diversity">
                          <Skeleton className="h-5 w-28" />
                          <Skeleton className="h-1.5 w-full" />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-foreground/85 mb-2" data-testid="text-ma-plant-summary">
                            <span className="font-semibold text-foreground">{d.plantCount}</span> of {WEEKLY_PLANT_TARGET} plants
                          </p>
                          <div className="h-1.5 w-full rounded-full bg-[hsl(145,16%,90%)] dark:bg-[hsl(145,10%,20%)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[hsl(145,34%,52%)]"
                              style={{ width: `${d.plantPct}%` }}
                              data-testid="bar-ma-plant-progress"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* ── LAYER 5 — QUIET. No surface: a note lying on the counter. ── */}
            {d.reminder && (
              <div className="flex items-start gap-2.5 px-2 sm:px-1 pt-1 pb-2 sm:pb-0 text-sm text-foreground/75 leading-relaxed" data-testid="ma-reminder">
                <Bell className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
                {/* The Behaviour Engine's sentence, rendered verbatim. */}
                <span>{d.reminder.text}</span>
              </div>
            )}
          </div>
        </section>

        <DashboardLink prefix="ma" />
      </div>
    </div>
  );
}
