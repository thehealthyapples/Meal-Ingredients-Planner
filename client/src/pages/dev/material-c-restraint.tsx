// EXP4 · Study C — MINIMAL PREMIUM RESTRAINT (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS STUDY ASKS: how little material does the hierarchy need?
// If Studies A and B add planes and light, C subtracts until exactly ONE
// surface remains — and asks whether space and ink can do the rest.
//
// Its material thesis is ONE OBJECT IN A ROOM:
//
//   • THE PRIMARY SURFACE is the only card on the page. Solid, hairline
//     border, one minimal shadow — barely more than the certainty that it is
//     an object. Because it is the only surface, it needs no depth contest to
//     win: presence itself is the hierarchy.
//   • SUPPORTING SURFACES are not surfaces at all: shopping and plants are two
//     quiet rows of ink separated by hairlines, exactly the demotion EXP2's
//     Prototype C discovered ("a prepared kitchen does not present the salt
//     with the meal's ceremony").
//   • QUIET SURFACES are plain sentences on the canvas.
//   • The spacing rhythm is a full step more generous than the live Home —
//     breathing space is the study's principal material.
//
// This study is also the CONTROL for the other two: it renders the current
// canonical flat-surface law (UIA § 4) at its best, so the exploration can
// honestly ask whether A's layers or B's light buy anything the flat law,
// executed with enough air, does not already give.
//
// MICRO-INTERACTION THESIS: the canonical answer, unchanged. Hover and press
// on the rows use the existing hover-elevate / active-elevate-2 overlay (the
// one mechanism every THA control already speaks); focus is the canonical
// ring. Nothing translates, nothing casts more shadow — restraint extends to
// the hand.
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
import { CalendarDays, ShoppingCart, Leaf, Bell, ChevronRight } from "lucide-react";
import {
  useHomeData, useSceneHeight, DashboardLink, todayLabel, WEEKLY_PLANT_TARGET,
} from "./exp2-shared";

// The material, named once. One object; everything else is ink and air.
const M = {
  primary:
    "rounded-xl border-border/70 bg-card shadow-[0_1px_2px_hsl(30_20%_25%/0.05)] dark:shadow-none",
  row:
    "group flex items-center gap-3 rounded-lg px-2 py-3.5 text-sm " +
    "hover-elevate active-elevate-2 " +
    "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
} as const;

export default function MaterialCRestraintPage() {
  const d = useHomeData();
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const sceneH = useSceneHeight(workspaceRef);

  // Said only once it is KNOWN — never fabricated while loading.
  const stateSentence = d.mealsSettled
    ? d.todaysMeals.length === 0 ? "Today is open." : "Today is planned."
    : null;

  return (
    <div data-testid="material-c">
      {/* The standard THA header — the shell earns no exception (Principle E). */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      <div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        data-testid="material-c-workspace"
      >
        {/* Orientation — ink on the canvas, given a full step more air. */}
        <header className="mb-9 sm:mb-12">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-mc-date">
            {todayLabel()}
          </p>
          <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
            Today
          </h2>
          {stateSentence && (
            <p className="mt-2 text-base sm:text-lg text-muted-foreground" data-testid="text-mc-state">
              {stateSentence}
            </p>
          )}
        </header>

        <div className="space-y-8 sm:space-y-10" aria-label="Home">
          {/* ── THE ONE OBJECT — the only surface on the page. ── */}
          {d.mealsBroken ? (
            <LoadError what="today's meals" onRetry={d.retryTodaysMeals} data-testid="error-mc-todays-meals" />
          ) : (
            <Card className={M.primary} data-testid="card-mc-todays-meals">
              <CardContent className="p-7 sm:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[hsl(172,20%,92%)] text-[hsl(172,38%,26%)] dark:bg-[hsl(172,14%,18%)] dark:text-[hsl(172,26%,68%)] shrink-0">
                    <CalendarDays style={{ width: 18, height: 18 }} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">Today's meals</h3>
                    <p className="text-xs text-muted-foreground">What's planned for today</p>
                  </div>
                </div>

                {d.mealsWaiting ? (
                  <div className="flex flex-col gap-2" data-testid="loading-mc-todays-meals">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                  </div>
                ) : d.todaysMeals.length === 0 ? (
                  <p className="text-sm text-muted-foreground" data-testid="text-mc-meals-empty">
                    Nothing planned for today yet.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2" data-testid="list-mc-todays-meals">
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
                <Button asChild variant="default" className="mt-6 w-full sm:w-auto" data-testid="button-mc-primary">
                  <Link href="/planner">{d.primaryLabel}</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── SUPPORT — ink, not surfaces: two quiet rows on the canvas.
              Hover and press speak the one canonical overlay. ── */}
          <div className="divide-y divide-border/40" data-testid="mc-support">
            {d.shoppingBroken ? (
              <LoadError what="your shopping list" onRetry={d.retryShopping} data-testid="error-mc-shopping" />
            ) : (
              <Link href="/shopping-workspace" aria-label="Go to shopping" className={M.row} data-testid="row-mc-shopping">
                <ShoppingCart className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                {d.shoppingWaiting ? (
                  <Skeleton className="h-4 w-28" data-testid="loading-mc-shopping" />
                ) : (
                  <span className="text-foreground/80" data-testid="text-mc-shopping-summary">
                    {d.openShoppingCount === 0 ? (
                      "Your shopping list is clear."
                    ) : (
                      <>
                        <span className="font-medium text-foreground">{d.openShoppingCount}</span>{" "}
                        {d.openShoppingCount === 1 ? "item" : "items"} to buy
                      </>
                    )}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors motion-reduce:transition-none" />
              </Link>
            )}

            {d.plantsBroken ? (
              <LoadError what="your plant diversity" onRetry={d.retryPlants} data-testid="error-mc-plant-diversity" />
            ) : (
              <Link href="/plant-diversity" aria-label="Go to plant diversity" className={M.row} data-testid="row-mc-plants">
                <Leaf className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                {d.plantsWaiting ? (
                  <Skeleton className="h-4 w-24" data-testid="loading-mc-plant-diversity" />
                ) : (
                  <span className="text-foreground/80" data-testid="text-mc-plant-summary">
                    <span className="font-medium text-foreground">{d.plantCount}</span> of {WEEKLY_PLANT_TARGET} plants this week
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors motion-reduce:transition-none" />
              </Link>
            )}
          </div>

          {/* ── QUIET — a plain sentence on the canvas. ── */}
          {d.reminder && (
            <div className="flex items-start gap-2.5 px-1 text-sm text-foreground/75 leading-relaxed" data-testid="mc-reminder">
              <Bell className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
              {/* The Behaviour Engine's sentence, rendered verbatim. */}
              <span>{d.reminder.text}</span>
            </div>
          )}
        </div>

        <DashboardLink prefix="mc" />
      </div>
    </div>
  );
}
