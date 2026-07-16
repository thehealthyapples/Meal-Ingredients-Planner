/**
 * HouseholdNutritionPanel.tsx — HNP1 Household Nutrition Platform Foundation
 * ==========================================================================
 * The household's own nutrition standing, for the week they are living in.
 *
 * IT OWNS NO INTELLIGENCE AND WRITES NO PROSE ABOUT HOUSEHOLD DATA.
 *
 * Every number, sentence, band, label and suggestion on this surface was composed
 * by the server (`shared/nutrition/household-nutrition.ts`, via
 * `/api/household-nutrition`) and is rendered VERBATIM. This component decides only
 * where things sit. That rule is already load-bearing elsewhere in this codebase —
 * `server/lib/meal-unlock.ts` exists precisely because a component had started
 * authoring sentences about a household's own data — and HNP1 holds to it from the
 * start rather than having to be corrected into it.
 *
 * THE TRUST RULES IT RENDERS
 * --------------------------
 *   1. A null score is SILENCE. The panel disappears entirely. It is never a 0,
 *      and never a "get started!" placeholder dressed up as a score.
 *   2. A dimension its owner had no data for is NOT drawn as an empty bar — an
 *      empty bar reads as "you scored zero". It is named, plainly, as not yet
 *      measured, under its own heading.
 *   3. The score always shows what it was computed FROM. A 2-of-4 score and a
 *      4-of-4 score are different claims and are never presented as the same one.
 *
 * STANDING IS READ. ADVICE IS DELIVERED. (HHP3)
 * ---------------------------------------------
 * This panel draws a hard line down the middle of what HNP1 produces, because the
 * two halves have different owners:
 *
 *   • The household's STANDING — score, dimensions, weekly summary, insights — is a
 *     statement about the week that is true whenever you ask. It is READ, here, from
 *     `/api/household-nutrition`. It has no lifecycle: you cannot "dismiss" a score.
 *
 *   • An OPPORTUNITY is advice, and advice has a lifecycle — it can be muted,
 *     dismissed, accepted, learned from, budgeted and ranked against every other
 *     piece of advice competing for the same household's attention. Exactly ONE
 *     component in THA owns that: the Decision Engine (OD1/DEC1), which HHP2
 *     enrolled Household Health into as a producer.
 *
 * Until HHP3 this panel rendered HNP1's opportunities DIRECTLY from the read route,
 * around the Decision Engine — so a household could dismiss a nutrition opportunity
 * in the Companion and be shown the very same card here, forever, by a path that had
 * never heard of dismissal. That is the "one fact, two owners" failure the
 * architecture forbids, and it was live.
 *
 * It now mounts `AmbientIntelligence` — the ONE ambient surface (PHASE5C) — scoped to
 * the `nutrition` domain group of the delivered bundle. Muting, dismissal, acceptance,
 * the attention budget, LEARN1's re-weighting and COACH1's seen-yields-to-unseen
 * ordering therefore apply on this surface for free, because they are applied ONCE, in
 * the engine that owns them, and this panel does not re-implement one of them.
 */

import { useQuery } from "@tanstack/react-query";
import { Leaf, Sparkles } from "lucide-react";
import { AmbientIntelligence, IntelligenceCard } from "@/components/intelligence";
import type {
  HouseholdNutritionScore,
  NutritionDimension,
  NutritionInsight,
  WeeklyNutritionSummary,
} from "@shared/nutrition/household-nutrition";
import { BAND_LABEL } from "@shared/nutrition/household-nutrition";

/**
 * The wire shape of `HouseholdNutritionReport` as the READ route now serialises it
 * (server/routes.ts).
 *
 * HHP3 — `opportunities` is deliberately ABSENT. The route no longer sends it, and
 * this type no longer names it, so the bypass cannot be re-opened here by accident:
 * there is nothing on the wire to render. The producer path (the `household-health`
 * capability → HNP1's assembler → the Decision Engine) is untouched and still receives
 * every opportunity HNP1 composes.
 *
 * Exported so that Home's entry card reads the household's standing from THIS shape
 * rather than re-declaring it. One wire type, one owner — a second copy on Home is how
 * a field quietly comes back.
 */
export interface HouseholdNutritionReport {
  available: boolean;
  score: HouseholdNutritionScore | null;
  weekly: WeeklyNutritionSummary | null;
  insights: NutritionInsight[];
  trust: { sources: string[]; unscoredDimensions: string[] };
}

/**
 * The owning domain HNP1's opportunities declare, and the key the Decision Engine
 * groups them under (`framework.ts` DOMAIN_SURFACE). Module-scoped so its identity is
 * stable across renders — `AmbientIntelligence` memoises on it.
 *
 * This names a group; it does not select, rank or filter one. The engine decided what
 * is in it.
 */
const NUTRITION_DOMAIN = ["nutrition"] as const;

/** Only ever used to COLOUR a bar — never to decide what a number means. */
function barTone(value: number): string {
  if (value >= 80) return "bg-emerald-500/80";
  if (value >= 60) return "bg-teal-500/80";
  if (value >= 40) return "bg-amber-400/80";
  return "bg-amber-500/70";
}

/**
 * One scored dimension. Rendered ONLY when its owner had data — a null dimension
 * is handled by `UnscoredNote` below, because drawing it as an empty bar would say
 * "you scored zero", which is the one thing the platform must never say.
 */
function DimensionBar({ dimension }: { dimension: NutritionDimension }) {
  if (dimension.value === null) return null;
  const pct = Math.min(dimension.value, 100);

  return (
    <div data-testid={`hnp-dimension-${dimension.key}`}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-medium text-foreground/80">{dimension.label}</span>
        {/* The honest denominator, from the server — "12 of 30", never a bare percentage. */}
        <span className="text-[11px] tabular-nums text-muted-foreground/55">
          {dimension.actual} of {dimension.target}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barTone(dimension.value)}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-label={dimension.label}
          aria-valuenow={dimension.actual}
          aria-valuemin={0}
          aria-valuemax={dimension.target}
        />
      </div>
    </div>
  );
}

/**
 * Trust Rule 3, made visible. The dimensions THA could not measure are NAMED rather
 * than quietly omitted — a household is entitled to know what its score does not
 * yet include, and why the number would move if it scanned a product.
 */
function UnscoredNote({ dimensions }: { dimensions: readonly NutritionDimension[] }) {
  const unscored = dimensions.filter((d) => d.value === null);
  if (unscored.length === 0) return null;

  return (
    <p className="text-[11px] leading-relaxed text-muted-foreground/55" data-testid="hnp-unscored">
      Not yet measured: {unscored.map((d) => d.label.toLowerCase()).join(", ")}. This score is not
      counting {unscored.length === 1 ? "it" : "them"}.
    </p>
  );
}

function ScoreBlock({ score }: { score: HouseholdNutritionScore }) {
  // Trust Rule 2 — nothing to score is silence. The caller has already checked this;
  // it is re-checked here so the component is safe to mount anywhere.
  if (score.value === null || score.band === null) return null;

  return (
    <IntelligenceCard
      icon={<Leaf className="h-4 w-4" />}
      eyebrow="Your household this week"
      title="Nutrition score"
      data-testid="hnp-score"
      details={
        <div className="space-y-3">
          {score.dimensions.map((d) => (
            <DimensionBar key={d.key} dimension={d} />
          ))}
          <UnscoredNote dimensions={score.dimensions} />
        </div>
      }
      detailsLabel="How this is made up"
    >
      <div className="flex items-baseline gap-2.5">
        <span className="text-3xl font-bold leading-none tabular-nums" data-testid="hnp-score-value">
          {score.value}
        </span>
        <span className="text-sm font-medium text-foreground/70">
          {BAND_LABEL[score.band]}
        </span>
      </div>

      {/* Trust Rule 3 — the score never forgets which claim it is. */}
      <p className="mt-2 text-[11px] leading-tight text-muted-foreground/55" data-testid="hnp-confidence">
        Based on {score.dimensionsCounted} of {score.dimensionsTotal} measures
        {" · "}
        {score.confidence} confidence
      </p>
    </IntelligenceCard>
  );
}

function WeeklyBlock({ weekly }: { weekly: WeeklyNutritionSummary }) {
  return (
    <IntelligenceCard
      icon={<Sparkles className="h-4 w-4" />}
      eyebrow="This week"
      title="Weekly summary"
      data-testid="hnp-weekly"
    >
      <div className="grid grid-cols-3 gap-x-6 gap-y-3">
        <Stat value={`${weekly.plantCount}/${weekly.plantTarget}`} label="Distinct plants" />
        <Stat
          value={`${weekly.componentsPresent}/${weekly.componentsTotal}`}
          label="Food components"
        />
        <Stat value={`${weekly.mealsPlanned}`} label="Meals planned" />
      </div>
    </IntelligenceCard>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-2xl font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground/60">{label}</p>
    </div>
  );
}

/**
 * The household's insights — each a finished, cited sentence written by the fact's
 * owner. Rendered verbatim: this component does not join, trim, re-phrase or
 * pluralise them.
 */
function InsightsBlock({ insights }: { insights: NutritionInsight[] }) {
  if (insights.length === 0) return null;

  return (
    <IntelligenceCard
      icon={<Leaf className="h-4 w-4" />}
      eyebrow="What we notice"
      title="Your nutrition"
      data-testid="hnp-insights"
    >
      <ul className="space-y-2">
        {insights.map((insight) => (
          <li
            key={insight.id}
            className="text-sm leading-relaxed text-foreground/80"
            data-testid={`hnp-insight-${insight.id}`}
          >
            {insight.text}
          </li>
        ))}
      </ul>
    </IntelligenceCard>
  );
}

export function HouseholdNutritionPanel() {
  const { data } = useQuery<HouseholdNutritionReport>({
    queryKey: ["/api/household-nutrition"],
    queryFn: async () => {
      const res = await fetch("/api/household-nutrition");
      if (!res.ok) throw new Error("not ok");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Trust Rules 1 & 2 — a household THA knows nothing about is told nothing.
  // No skeleton, no placeholder, no "start planning to see your score!". Silence.
  if (!data || !data.available || !data.score || data.score.value === null) return null;

  return (
    <div className="space-y-4" data-testid="household-nutrition-panel">
      <ScoreBlock score={data.score} />
      {data.weekly && <WeeklyBlock weekly={data.weekly} />}
      <InsightsBlock insights={data.insights} />

      {/*
        HHP3 — the household's health advice, DELIVERED rather than read.

        This is the same bundle, from the same query key, that the Companion and every
        other ambient surface in THA reads (TanStack dedupes the fetch across all of
        them), scoped to the `nutrition` domain group the Decision Engine itself
        assembled — never re-grouped, re-ranked or re-budgeted here, which is precisely
        what DEC1 §3 forbids a surface from doing.

        What the household gets that they did not have before HHP3: a nutrition
        opportunity they dismissed HERE is gone from the Companion, and one they
        dismissed in the Companion is gone from HERE — because there is now one
        delivery lifecycle rather than two. And it renders NOTHING when the engine
        delivered nothing: silence is a correct, complete answer, and this surface
        never pads it.
      */}
      <AmbientIntelligence
        domains={NUTRITION_DOMAIN}
        surfaceKey="household-health"
        title="Ways to eat better this week"
        data-testid="household-health-opportunities"
      />

      {/* Rule E1, made visible — the household can always see which owners produced
          the numbers above. A surface that cannot say where a claim came from is a
          surface THA does not ship. */}
      {data.trust.sources.length > 0 && (
        <p className="px-1 text-[11px] leading-tight text-muted-foreground/45" data-testid="hnp-trust">
          Based on your {data.trust.sources.join(", ").replace(/_/g, " ")}.
        </p>
      )}
    </div>
  );
}
