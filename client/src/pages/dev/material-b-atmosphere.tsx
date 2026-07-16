// EXP4 · Study B — NATURAL DEPTH AND ATMOSPHERE (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS STUDY ASKS: can LIGHT alone tell the eye where to go —
// depth through illumination, with no stacked planes and no ground?
//
// Its material thesis is ONE LIGHT. The room is lit the way a kitchen is on a
// bright morning: daylight falls from the upper left, once, and never moves.
// Everything about the hierarchy follows from where each surface stands in
// that light:
//
//   • THE AMBIENT — a still pool of warm morning light lies over the top of
//     the workspace, where orientation and the primary live. It is not an
//     effect: it never moves, never sweeps, never glows for attention. It is
//     the light of the room (Principle F: light means welcome, warmth, calm,
//     clarity, optimism — nothing else).
//   • THE PRIMARY SURFACE stands in the light: the brightest, warmest white
//     on the page, its upper-left edge catching the sun (a one-pixel warm
//     highlight), its shadow cast softly down and to the right.
//   • SUPPORTING SURFACES stand in the penumbra: a half-step dimmer and
//     warmer-grey, translucent enough for the orchard to tint them, shorter
//     shadows in the same direction. The eye reads "less lit" as "less now".
//   • QUIET SURFACES sit in the shade: no surface, slightly muted ink.
//
// Every shadow on the page falls the SAME way (down-right, from one morning
// sun) — depth comes from one believable light, never from drama. There are
// no layers-for-layers'-sake: remove the light and the page is flat.
//
// MICRO-INTERACTION THESIS: the hand moves things IN THE LIGHT. Hovering a
// supporting surface brings it into full daylight (it brightens to the
// primary's white; its shadow reaches a little further); pressing it holds it
// down toward the counter (shadow shortens); focus is the canonical ring.
// Physical, directional, and still — nothing moves unasked, and reduced
// motion removes the transitions entirely.
//
// Shell: canonical, byte-identical WorkspaceHeader, visible from frame one.
// Data: exp2-shared's useHomeData — same query keys and cache as the live
// Home. Content and hierarchy are IDENTICAL across Studies A/B/C, so the only
// variable is the material. Disposition: ideas graduate by governed
// amendment; the study files are then DELETED.
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

// The material, named once. One light, upper-left; every shadow obeys it.
const M = {
  primary:
    "rounded-2xl border-transparent bg-[hsl(46,55%,99%)] " +
    "shadow-[inset_1px_1px_0_hsl(48_80%_97%/0.9),1px_2px_2px_hsl(28_30%_25%/0.04),3px_12px_28px_-10px_hsl(28_35%_22%/0.18)] " +
    "dark:bg-card dark:border-border/40 dark:shadow-none",
  support:
    "h-full rounded-xl border-transparent bg-[hsl(42,28%,95%)]/85 backdrop-blur-[2px] " +
    "shadow-[inset_1px_1px_0_hsl(48_60%_97%/0.5),2px_5px_12px_-7px_hsl(28_30%_25%/0.14)] " +
    "dark:bg-card/70 dark:border-border/40 dark:shadow-none " +
    // The hand: hover brings the surface into the light; press holds it down.
    "transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none " +
    "hover:bg-[hsl(46,55%,99%)] " +
    "hover:shadow-[inset_1px_1px_0_hsl(48_80%_97%/0.9),2px_8px_20px_-8px_hsl(28_35%_22%/0.18)] " +
    "active:shadow-[inset_1px_1px_0_hsl(48_60%_97%/0.5),1px_2px_5px_-3px_hsl(28_30%_25%/0.14)]",
  supportLink:
    "block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;

export default function MaterialBAtmospherePage() {
  const d = useHomeData();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const sceneH = useSceneHeight(workspaceRef);

  // Said only once it is KNOWN — never fabricated while loading.
  const stateSentence = d.mealsSettled
    ? d.todaysMeals.length === 0 ? "Today is open." : "Today is planned."
    : null;

  return (
    <div data-testid="material-b">
      {/* The standard THA header — the shell earns no exception (Principle E). */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      <div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex flex-col justify-center py-8 sm:py-12"
        style={sceneH ? { minHeight: sceneH } : undefined}
        data-testid="material-b-workspace"
      >
        {/* ── THE AMBIENT — morning light pooling over the top of the room.
            Still, once, meaning exactly: warmth, welcome. Never an effect. ── */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-12 top-0 h-[26rem] dark:hidden"
          style={{
            background:
              "radial-gradient(85% 70% at 30% 6%, hsl(46 85% 90% / 0.55), hsl(46 85% 90% / 0) 72%)",
          }}
          data-testid="ambient-mb"
        />

        <div className="relative">
          {/* Orientation — standing in the light, on no surface at all. */}
          <header className="mb-8 sm:mb-10">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-mb-date">
              {todayLabel()}
            </p>
            <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
              Today
            </h2>
            {stateSentence && (
              <p className="mt-2 text-base sm:text-lg text-muted-foreground" data-testid="text-mb-state">
                {stateSentence}
              </p>
            )}
          </header>

          <div className="space-y-4 sm:space-y-5" aria-label="Home">
            {/* ── THE PRIMARY — standing in the morning light. ── */}
            {d.mealsBroken ? (
              <LoadError what="today's meals" onRetry={d.retryTodaysMeals} data-testid="error-mb-todays-meals" />
            ) : (
              <Card className={M.primary} data-testid="card-mb-todays-meals">
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
                    <div className="flex flex-col gap-2" data-testid="loading-mb-todays-meals">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  ) : d.todaysMeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-mb-meals-empty">
                      Nothing planned for today yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5" data-testid="list-mb-todays-meals">
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
                  <Button asChild variant="default" className="mt-5 w-full sm:w-auto" data-testid="button-mb-primary">
                    <Link href="/planner">{d.primaryLabel}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* ── SUPPORTING — standing in the penumbra. Hover brings a
                surface into the light; press holds it down. ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {d.shoppingBroken ? (
                <LoadError what="your shopping list" onRetry={d.retryShopping} className="h-full" data-testid="error-mb-shopping" />
              ) : (
                <Link href="/shopping-workspace" aria-label="Go to shopping" className={M.supportLink}>
                  <Card className={M.support} data-testid="card-mb-shopping">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(190,24%,92%)] text-[hsl(190,42%,26%)] dark:bg-[hsl(190,16%,18%)] dark:text-[hsl(190,30%,68%)] shrink-0">
                          <ShoppingCart style={{ width: 16, height: 16 }} />
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">Shopping</h3>
                      </div>
                      {d.shoppingWaiting ? (
                        <Skeleton className="h-5 w-24" data-testid="loading-mb-shopping" />
                      ) : (
                        <p className="text-sm text-foreground/85" data-testid="text-mb-shopping-summary">
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
                <LoadError what="your plant diversity" onRetry={d.retryPlants} className="h-full" data-testid="error-mb-plant-diversity" />
              ) : (
                <Link href="/plant-diversity" aria-label="Go to plant diversity" className={M.supportLink}>
                  <Card className={M.support} data-testid="card-mb-plant-diversity">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center bg-[hsl(145,20%,91%)] text-[hsl(145,36%,26%)] dark:bg-[hsl(145,14%,18%)] dark:text-[hsl(145,26%,66%)] shrink-0">
                          <Leaf style={{ width: 16, height: 16 }} />
                        </span>
                        <h3 className="text-sm font-semibold text-foreground">Plant diversity</h3>
                      </div>
                      {d.plantsWaiting ? (
                        <div className="flex flex-col gap-2" data-testid="loading-mb-plant-diversity">
                          <Skeleton className="h-5 w-28" />
                          <Skeleton className="h-1.5 w-full" />
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-foreground/85 mb-2" data-testid="text-mb-plant-summary">
                            <span className="font-semibold text-foreground">{d.plantCount}</span> of {WEEKLY_PLANT_TARGET} plants
                          </p>
                          <div className="h-1.5 w-full rounded-full bg-[hsl(145,16%,90%)] dark:bg-[hsl(145,10%,20%)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[hsl(145,34%,52%)]"
                              style={{ width: `${d.plantPct}%` }}
                              data-testid="bar-mb-plant-progress"
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )}
            </div>

            {/* ── QUIET — in the shade: no surface, slightly muted ink. ── */}
            {d.reminder && (
              <div className="flex items-start gap-2.5 px-1 pt-1 text-sm text-foreground/65 leading-relaxed" data-testid="mb-reminder">
                <Bell className="h-4 w-4 text-primary/40 mt-0.5 shrink-0" />
                {/* The Behaviour Engine's sentence, rendered verbatim. */}
                <span>{d.reminder.text}</span>
              </div>
            )}
          </div>

          <DashboardLink prefix="mb" />
        </div>
      </div>
    </div>
  );
}
