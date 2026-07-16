// EXP2 · Prototype C — THE WORKSPACE (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS PROTOTYPE ASKS: can Home feel like arriving in a
// beautifully prepared kitchen?
//
// Its entire budget is spent on the ROOM ITSELF — hierarchy, composition,
// information ordering, visual breathing. There is deliberately NO greeting
// scene (Prototype A) and no environment moment (Prototype B). The exploration
// is whether the dashboard, composed strictly enough and given enough air, can
// BE the arrival: you open the door and the kitchen is simply ready.
//
// The interpretation:
//   • The information order is the canonical hierarchy taken literally, one
//     tier per visual register: ORIENTATION (the date, "Today") → STATE (one
//     honest sentence: is today under control?) → THE PRIMARY (today's meals,
//     the one card and the one action) → SUPPORT (shopping and plants DEMOTED
//     from cards to two quiet rows — a prepared kitchen does not present the
//     salt with the same ceremony as the meal) → one reminder → one way deeper.
//   • The most reassuring fact reaches the person before any detail
//     (Principle 1): "Today is planned." / "Today is open." — derived from the
//     same canonical data the card then details, said once, plainly, and only
//     once it is actually KNOWN (never fabricated while loading).
//   • The reveal is composed, not assembled (Principle 1: the moment of entry
//     is a place settling, never a screen loading — and never UXHOME1's
//     card-by-card sequence, which was already tried and discarded). Two beats
//     only: the orientation lands first, then the WHOLE of the rest arrives as
//     one piece. After that, stillness.
//
// Shell: canonical, visible from frame one — byte-identical WorkspaceHeader.
// Companion: the ONE FloatingAssistant, withheld ~2s while the room settles.
// Disposition: see exp2-shared.tsx — ideas graduate; prototypes are deleted.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useWithholdCompanion } from "@/components/conversation/companion-context";
import { WorkspaceHeader } from "@/components/workspace-header";
import { MealCard } from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LoadError } from "@/components/ui/load-error";
import { ShoppingCart, Leaf, Bell, ChevronRight } from "lucide-react";
import {
  useArrivalGate, useSceneHeight, useHomeData, DashboardLink,
  todayLabel, WEEKLY_PLANT_TARGET,
} from "./exp2-shared";

// ── The two beats, in seconds ────────────────────────────────────────────────
const T = {
  orient: 0.35,      // beat one: the date and "Today" — where am I?
  orientDur: 0.7,
  compose: 1.05,     // beat two: everything else, as ONE piece
  composeDur: 0.9,
  settled: 2.2,      // stillness; the Companion may arrive
} as const;

const SESSION_KEY = "tha:exp2c-seen";

export default function ArrivalCWorkspacePage() {
  const arrival = useArrivalGate(SESSION_KEY);
  const isFull = arrival === "full";

  const d = useHomeData();
  const [settled, setSettled] = useState(!isFull);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const sceneH = useSceneHeight(workspaceRef);

  useWithholdCompanion(!settled);

  useEffect(() => {
    if (!isFull) return;
    const t = window.setTimeout(() => setSettled(true), T.settled * 1000);
    return () => clearTimeout(t);
  }, [isFull]);

  // The state sentence — said only once it is KNOWN. While the truth is still
  // loading there is quiet space, never a guess (Core Principle 6).
  const stateSentence = d.mealsSettled
    ? d.todaysMeals.length === 0
      ? "Today is open."
      : "Today is planned."
    : null;

  return (
    <div data-testid="arrival-c" data-arrival={arrival}>
      {/* The standard THA header — visible from the very first frame. */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      <div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-2xl px-4 sm:px-6 flex min-h-[100svh] flex-col justify-center py-10 sm:py-14"
        style={sceneH ? { minHeight: sceneH } : undefined}
        data-testid="arrival-c-workspace"
      >
        {/* ── Beat one — ORIENTATION and STATE. Where am I, and is today under
            control? The answer lands before any detail does. ── */}
        <motion.header
          className="mb-8 sm:mb-10"
          initial={isFull ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: T.orientDur, delay: T.orient, ease: [0.4, 0, 0.2, 1] }}
        >
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-1.5" data-testid="text-arrival-c-date">
            {todayLabel()}
          </p>
          <h2 className="font-display text-2xl sm:text-[1.75rem] font-semibold tracking-tight text-foreground">
            Today
          </h2>
          {stateSentence && (
            <p className="mt-2 text-base sm:text-lg text-muted-foreground" data-testid="text-arrival-c-state">
              {stateSentence}
            </p>
          )}
        </motion.header>

        {/* ── Beat two — the rest of the kitchen, as ONE piece. ── */}
        <motion.div
          initial={isFull ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: T.composeDur, delay: T.compose, ease: [0.4, 0, 0.2, 1] }}
        >
          <div className="space-y-6" aria-label="Home">
            {/* THE PRIMARY — today's meals, the one card on the surface. */}
            {d.mealsBroken ? (
              <LoadError what="today's meals" onRetry={d.retryTodaysMeals} data-testid="error-c-todays-meals" />
            ) : (
              <Card className="border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" data-testid="card-c-todays-meals">
                <CardContent className="p-6 sm:p-7">
                  {d.mealsWaiting ? (
                    <div className="flex flex-col gap-2" data-testid="loading-c-todays-meals">
                      <Skeleton className="h-5 w-2/3" />
                      <Skeleton className="h-5 w-1/2" />
                    </div>
                  ) : d.todaysMeals.length === 0 ? (
                    <p className="text-sm text-muted-foreground" data-testid="text-c-meals-empty">
                      Nothing planned for today yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2" data-testid="list-c-todays-meals">
                      {d.todaysMeals.map((m) => (
                        <li key={m.id} className="text-foreground/85">
                          <MealCard
                            meal={m}
                            variant="row"
                            thumbnailSize="sm"
                            href={null}
                            meta={m.mealType ? <span className="capitalize">{m.mealType}</span> : undefined}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* The one primary-styled action on the page. */}
                  <Button asChild variant="default" className="mt-6 w-full sm:w-auto" data-testid="button-c-primary">
                    <Link href="/planner">{d.primaryLabel}</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* SUPPORT — demoted from cards to two quiet rows. A prepared
                kitchen doesn't present the salt with the meal's ceremony. */}
            <div className="divide-y divide-border/30 rounded-xl" data-testid="arrival-c-support">
              {d.shoppingBroken ? (
                <LoadError what="your shopping list" onRetry={d.retryShopping} data-testid="error-c-shopping" />
              ) : (
                <Link
                  href="/shopping-workspace"
                  aria-label="Go to shopping"
                  className="group flex items-center gap-3 px-1 py-3 text-sm transition-colors"
                  data-testid="row-c-shopping"
                >
                  <ShoppingCart className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  {d.shoppingWaiting ? (
                    <Skeleton className="h-4 w-28" data-testid="loading-c-shopping" />
                  ) : (
                    <span className="text-foreground/80">
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
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                </Link>
              )}

              {d.plantsBroken ? (
                <LoadError what="your plant diversity" onRetry={d.retryPlants} data-testid="error-c-plants" />
              ) : (
                <Link
                  href="/plant-diversity"
                  aria-label="Go to plant diversity"
                  className="group flex items-center gap-3 px-1 py-3 text-sm transition-colors"
                  data-testid="row-c-plants"
                >
                  <Leaf className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                  {d.plantsWaiting ? (
                    <Skeleton className="h-4 w-24" data-testid="loading-c-plants" />
                  ) : (
                    <span className="text-foreground/80">
                      <span className="font-medium text-foreground">{d.plantCount}</span> of {WEEKLY_PLANT_TARGET} plants this week
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 ml-auto shrink-0 group-hover:text-muted-foreground transition-colors" />
                </Link>
              )}
            </div>

            {/* One household reminder — a single sentence, never a feed. */}
            {d.reminder && (
              <div className="flex items-start gap-2.5 px-1 text-sm text-foreground/75 leading-relaxed" data-testid="arrival-c-reminder">
                <Bell className="h-4 w-4 text-primary/50 mt-0.5 shrink-0" />
                {/* The Behaviour Engine's sentence, rendered verbatim. */}
                <span>{d.reminder.text}</span>
              </div>
            )}
          </div>

          <DashboardLink prefix="c" />
        </motion.div>
      </div>
    </div>
  );
}
