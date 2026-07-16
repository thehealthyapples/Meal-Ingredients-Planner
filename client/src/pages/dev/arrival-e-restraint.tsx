// EXP2 · Prototype E — PREMIUM RESTRAINT (DEVELOPMENT-ONLY EXPLORATION).
//
// ─────────────────────────────────────────────────────────────────────────────
// THE QUESTION THIS PROTOTYPE ASKS: how little can we do while making THA feel
// world-class?
//
// Its entire budget is spent on SUBTRACTION. One unhurried fade of one radically
// reduced composition — then nothing ever moves again. Whitespace, typography,
// pacing and light do all the work:
//
//   • ONE surface: today's meals, and the one action. Shopping, plants and the
//     reminder are not demoted — they are ABSENT, reachable through the one
//     quiet way deeper. The exploration deliberately overshoots the floor to
//     find it: does removing the supporting tier read as luxury (nothing is
//     asked of you) or as a missing room (where did my list go)? That answer is
//     a finding either way.
//   • Typography IS the welcome. The greeting is the display voice at full,
//     unhurried size — no signature hand (Prototype A's question), no second
//     line of copy explaining the greeting. Words are spent like emphasis.
//   • Whitespace is the luxury (Principle 8: the room is the message). The one
//     card floats in daylight and breathing space; nothing competes, because
//     there is nothing else present to compete.
//   • Pacing: a single 0.9s fade — slower than a snap, far short of ceremony.
//     The governing test, kept in one line: if the person notices the animation
//     before the content, the animation has failed (Principle H).
//
// Shell: canonical, visible from frame one — byte-identical WorkspaceHeader.
// Companion: the ONE FloatingAssistant, withheld only through the fade.
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
import {
  useArrivalGate, useSceneHeight, useHomeData, DashboardLink, todayLabel,
} from "./exp2-shared";

// ── One number. That is the point. ───────────────────────────────────────────
const T = {
  fadeDur: 0.9,      // one fade of the whole composition; then stillness
} as const;

const SESSION_KEY = "tha:exp2e-seen";

export default function ArrivalERestraintPage() {
  const arrival = useArrivalGate(SESSION_KEY);
  const isFull = arrival === "full";

  const d = useHomeData();
  const [settled, setSettled] = useState(!isFull);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const sceneH = useSceneHeight(workspaceRef);

  useWithholdCompanion(!settled);

  useEffect(() => {
    if (!isFull) return;
    const t = window.setTimeout(() => setSettled(true), (T.fadeDur + 0.3) * 1000);
    return () => clearTimeout(t);
  }, [isFull]);

  return (
    <div data-testid="arrival-e" data-arrival={arrival}>
      {/* The standard THA header — visible from the very first frame. */}
      <WorkspaceHeader realm="home" title="Home" wide titleTestId="text-home-title" />

      <motion.div
        ref={workspaceRef}
        className="relative z-[6] mx-auto w-full max-w-xl px-6 flex min-h-[100svh] flex-col justify-center py-12"
        style={sceneH ? { minHeight: sceneH } : undefined}
        initial={isFull ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: T.fadeDur, ease: [0.4, 0, 0.2, 1] }}
        data-testid="arrival-e-workspace"
      >
        {/* Typography is the welcome. Nothing explains it, nothing follows it. */}
        <header className="mb-10 sm:mb-12">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70 mb-2.5" data-testid="text-arrival-e-date">
            {todayLabel()}
          </p>
          <h2
            className="font-display text-[2.1rem] sm:text-[2.6rem] font-semibold tracking-tight text-foreground leading-tight"
            data-testid="text-arrival-e-greeting"
          >
            Welcome home{d.name ? `, ${d.name}` : ""}.
          </h2>
        </header>

        {/* The one surface. Today, and the one thing to do about it. */}
        {d.mealsBroken ? (
          <LoadError what="today's meals" onRetry={d.retryTodaysMeals} data-testid="error-e-todays-meals" />
        ) : (
          <Card className="border-border/30 bg-card/70 backdrop-blur-sm shadow-sm" data-testid="card-e-todays-meals">
            <CardContent className="p-7 sm:p-8">
              <h3 className="text-sm font-semibold text-foreground mb-4">Today's meals</h3>

              {d.mealsWaiting ? (
                <div className="flex flex-col gap-2" data-testid="loading-e-todays-meals">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ) : d.todaysMeals.length === 0 ? (
                <p className="text-sm text-muted-foreground" data-testid="text-e-meals-empty">
                  Nothing planned for today yet.
                </p>
              ) : (
                <ul className="flex flex-col gap-2" data-testid="list-e-todays-meals">
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
              <Button asChild variant="default" className="mt-6 w-full sm:w-auto" data-testid="button-e-primary">
                <Link href="/planner">{d.primaryLabel}</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <DashboardLink prefix="e" />
      </motion.div>
    </div>
  );
}
