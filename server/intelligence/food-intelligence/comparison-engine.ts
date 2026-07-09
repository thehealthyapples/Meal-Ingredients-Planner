/**
 * Food Comparison Engine (COMP1 — Food Comparison Intelligence)
 * ================================================================================
 * Extends the Food Intelligence Engine family (FI3 `engine.ts`, FI4
 * `opportunity-engine.ts`) with a third deterministic reasoning process: given two
 * or more foods and/or products named by the caller, compose a structured,
 * cited, explainable COMPARISON from EXISTING owners — and return honest gaps for
 * every dimension no owner has evidence for.
 *
 * GOVERNING ARCHITECTURE: docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
 * This module remains the Domain Intelligence layer (§2, §7.1) — it owns its own
 * reasoning process (this file) and ZERO business-domain data (Rule FI1). Every
 * fact it surfaces is read, unmodified, from an existing owner:
 *
 *   Identity            → shared/canonical/resolver.ts (resolveCanonicalFood —
 *                          WS2A canonical seed; the preparation guard means a
 *                          resolved canonical slug IS a whole food by identity)
 *   Food knowledge      → server/lib/food-report-evidence.ts
 *                          (getEvidenceBackedFoodReport — the PKC2 "one mouth":
 *                          key nutrients, evidence-GATED health benefits,
 *                          curated nutrition context)
 *   Product analysis    → DB product_history via storage.getProductHistory —
 *                          the caller's OWN scan history rows, each a stored
 *                          snapshot the Analyser owner (product-analysis.ts +
 *                          upf-analysis-service.ts) computed at scan time
 *                          (thaRating, upfScore, novaGroup, nutriscoreGrade,
 *                          healthScore). NEVER a live OpenFoodFacts fetch and
 *                          NEVER a recompute — the analyser Capability Card's
 *                          trust rule ("never fabricate a UPF classification…
 *                          there is no stored result") is satisfied because here
 *                          there IS a stored result, scoped to the caller.
 *   Household context   → resolveHouseholdSignal (FI3, reused verbatim) +
 *                          resolveIngredientRestrictions (restriction library)
 *
 * TRUST RULES ENFORCED HERE (FI1 §5, carried forward):
 *   Rule E1 (no citation, no card) — every dimension entry carries the owner it
 *     was read from; a dimension with no owner evidence is a structured gap.
 *   Rule E2 (show uncertainty, don't hide it) — knowledge-registry dimensions
 *     (nutrients, benefits) are DOCUMENTATION comparisons: an absent link is
 *     stated as "not documented", never as "does not contain", and these
 *     dimensions NEVER contribute to the recommendation verdict — comparing
 *     documentation density would fabricate a difference between foods.
 *   Rule T0 (safety supersedes everything) — a subject that conflicts with an
 *     active household hard restriction is never recommended.
 *   Rule T1 (food, not bodies) — every statement names foods, links, scores and
 *     records; none claims a bodily outcome.
 *   Rule LT3 (the brain stays deterministic) — the recommendation is produced by
 *     the ordered rule ladder in {@link buildComparison}; no LLM selects anything.
 *   Honest gaps — an unresolvable item, an unstored dimension (product
 *     ingredients, additives, prices), or an anonymous caller asking about
 *     products all yield structured gaps, never invented values. THA stores no
 *     canonical prices, so value-for-money is currently ALWAYS an honest gap.
 *
 * TESTABILITY: the reasoning core — {@link buildComparison} — is a PURE function
 * (no I/O) over already-fetched subject facts and an already-resolved household
 * signal. {@link assembleFoodComparison} is the thin orchestration layer that
 * fetches from the existing owners above and calls it.
 */

import type { ProductHistory } from "@shared/schema";
import type { FoodReportKnowledge } from "@shared/canonical/food-report-adapter";
import { resolveCanonicalFood } from "@shared/canonical/resolver.js";
import { resolveIngredientRestrictions } from "@shared/restrictions/restriction-resolver.js";
import { resolveHouseholdSignal, NO_HOUSEHOLD_SIGNAL, type HouseholdSignal } from "./engine.js";

// ---------------------------------------------------------------------------
// Limits
// ---------------------------------------------------------------------------

const MIN_SUBJECTS = 2;
const MAX_SUBJECTS = 4;
/** Same page size the owner's own history route uses (storage.getProductHistory default). */
const PRODUCT_HISTORY_LOOKUP_LIMIT = 50;

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** How an input item resolved. `unresolved` is an honest state, not an error. */
export type ComparisonSubjectKind = "canonical-food" | "scanned-product" | "unresolved";

/** The dimensions COMP1 compares. Fixed vocabulary — consumers render all of them. */
export type ComparisonDimensionKey =
  | "appleScore"
  | "processing"
  | "ingredientQuality"
  | "additives"
  | "nutritionalProfile"
  | "healthBenefits"
  | "valueForMoney"
  | "householdSuitability";

export const COMPARISON_DIMENSION_KEYS: readonly ComparisonDimensionKey[] = [
  "appleScore",
  "processing",
  "ingredientQuality",
  "additives",
  "nutritionalProfile",
  "healthBenefits",
  "valueForMoney",
  "householdSuitability",
];

/** One cited fact — the owner it was read from, and the statement it grounds. */
export interface ComparisonEvidence {
  readonly owner: string;
  readonly fact: string;
}

/** One subject's entry for one dimension: owner evidence, or a structured gap. */
export interface ComparisonDimensionEntry {
  readonly status: "evidence" | "gap";
  /** Present when status is "evidence" — the cited, human-readable statement. */
  readonly summary: string | null;
  /** Present when status is "gap" — why no owner has this fact. */
  readonly gapReason: string | null;
  readonly evidence: readonly ComparisonEvidence[];
}

export interface ComparisonSubject {
  /** The caller's input string, verbatim. */
  readonly query: string;
  readonly kind: ComparisonSubjectKind;
  /** Canonical slug (canonical-food) or barcode/product-history id key (scanned-product). Null when unresolved. */
  readonly slug: string | null;
  readonly name: string | null;
  readonly category: string | null;
  readonly dimensions: Readonly<Record<ComparisonDimensionKey, ComparisonDimensionEntry>>;
}

/** The cross-subject outcome for one dimension. */
export interface ComparisonDimensionOutcome {
  readonly dimension: ComparisonDimensionKey;
  /** True only when EVERY resolved subject has owner evidence on this dimension. */
  readonly comparable: boolean;
  /** Deterministic statement of the difference/sameness. Null when not comparable. */
  readonly outcome: string | null;
  /** Why the dimension could not be compared. Null when comparable. */
  readonly gapReason: string | null;
}

export interface ComparisonRecommendation {
  readonly slug: string | null;
  readonly name: string;
  /** Every reason traces to a dimension outcome or a safety fact above (Rule E1). */
  readonly basis: readonly string[];
}

export interface FoodComparisonTrust {
  /** True only when at least two subjects resolved to an owner-backed identity. */
  readonly isGrounded: boolean;
  /** True only when the caller's own household resolved and contributed context. */
  readonly householdAware: boolean;
  /** Every honest gap in this comparison, summarised for the consumer. */
  readonly gaps: readonly string[];
}

export interface FoodComparisonBundle {
  readonly subjects: readonly ComparisonSubject[];
  readonly dimensions: readonly ComparisonDimensionOutcome[];
  /** Null when no dimension produced a grounded, safety-cleared winner. */
  readonly recommendation: ComparisonRecommendation | null;
  /** Why there is no recommendation, when there is none. Null when there is one. */
  readonly recommendationGap: string | null;
  readonly trust: FoodComparisonTrust;
  readonly metadata: { readonly assembledAt: string; readonly sources: readonly string[] };
}

export interface FoodComparisonRequest {
  /** Two to four food/product names or canonical slugs, as the caller said them. */
  readonly items: readonly string[];
  /**
   * The caller's own authenticated user id — used ONLY to resolve their own
   * household (restrictions, familiarity) and their own product scan history.
   * Never a client-supplied household id. Omit for anonymous (Stage 1) results.
   */
  readonly userId?: number;
}

// ---------------------------------------------------------------------------
// Pure-core input — already-fetched owner facts for one subject
// ---------------------------------------------------------------------------

/** Everything the pure core needs about one subject, fetched by the orchestrator. */
export interface SubjectFacts {
  readonly query: string;
  readonly kind: ComparisonSubjectKind;
  readonly slug: string | null;
  readonly name: string | null;
  readonly category: string | null;
  /** Evidence-backed Food Report (canonical foods only; benefits already gated). */
  readonly report: FoodReportKnowledge | null;
  /** The caller's own stored scan record (scanned products only). */
  readonly product: ProductHistory | null;
}

// ---------------------------------------------------------------------------
// Owners (named once, cited everywhere)
// ---------------------------------------------------------------------------

const OWNER_CANONICAL = "canonical-food-seed (shared/canonical)";
const OWNER_KNOWLEDGE = "food-knowledge-registry (WS0 knowledge_*, evidence-gated)";
const OWNER_PRODUCT_HISTORY = "product-history (the caller's own stored scan record)";
const OWNER_RESTRICTIONS = "restriction-library + household eaters";
const OWNER_PLANNER = "planner-history";

// ---------------------------------------------------------------------------
// Dimension builders (pure)
// ---------------------------------------------------------------------------

function evidence(summary: string, ...refs: ComparisonEvidence[]): ComparisonDimensionEntry {
  return { status: "evidence", summary, gapReason: null, evidence: refs };
}

function dimensionGap(reason: string): ComparisonDimensionEntry {
  return { status: "gap", summary: null, gapReason: reason, evidence: [] };
}

const GAP_UNRESOLVED =
  "This item did not resolve to a canonical food or to a product in your scan history — no owner has evidence about it.";

function unresolvedDimensions(): Record<ComparisonDimensionKey, ComparisonDimensionEntry> {
  const entries = {} as Record<ComparisonDimensionKey, ComparisonDimensionEntry>;
  for (const key of COMPARISON_DIMENSION_KEYS) entries[key] = dimensionGap(GAP_UNRESOLVED);
  return entries;
}

/** Numeric rank used ONLY inside the deterministic verdict ladder — lower is less processed. */
function processingRank(subject: SubjectFacts): number | null {
  if (subject.kind === "canonical-food") return 1; // whole food by canonical identity
  if (subject.kind === "scanned-product") return subject.product?.novaGroup ?? null;
  return null;
}

function buildSubjectDimensions(
  subject: SubjectFacts,
  household: HouseholdSignal,
): Record<ComparisonDimensionKey, ComparisonDimensionEntry> {
  if (subject.kind === "unresolved") return unresolvedDimensions();

  const dims = {} as Record<ComparisonDimensionKey, ComparisonDimensionEntry>;
  const name = subject.name ?? subject.query;

  if (subject.kind === "canonical-food") {
    const report = subject.report;

    dims.appleScore = dimensionGap(
      `${name} is a canonical whole food — THA computes numeric Apple Scores for analysed products, not whole foods; no owner stores a numeric score for it.`,
    );
    dims.processing = evidence(
      `${name} is a canonical whole food (single unprocessed food by identity — preparations and packaged products are never in the canonical seed).`,
      { owner: OWNER_CANONICAL, fact: `${name} resolves in the WS2A canonical food seed (slug: ${subject.slug}).` },
    );
    dims.ingredientQuality = evidence(
      `${name} is itself a single whole ingredient — there is no manufactured ingredient list to grade.`,
      { owner: OWNER_CANONICAL, fact: `Canonical identity: one whole food, not a formulated product.` },
    );
    dims.additives = evidence(
      `Not applicable — ${name} is a single whole food with no manufactured ingredient list, so there is no additive declaration to inspect.`,
      { owner: OWNER_CANONICAL, fact: `Canonical identity: one whole food, not a formulated product.` },
    );

    const nutrients = report?.keyNutrients ?? [];
    dims.nutritionalProfile =
      nutrients.length > 0
        ? evidence(
            `Documented key nutrients: ${nutrients.join(", ")}. (Documentation, not a full composition table — an undocumented nutrient is not evidence of absence.)`,
            { owner: OWNER_KNOWLEDGE, fact: `Food Knowledge Registry links ${name} to: ${nutrients.join(", ")}.` },
          )
        : dimensionGap(
            `The Food Knowledge Registry documents no key nutrients for ${name} yet — an honest gap, not evidence that it has none.`,
          );

    const benefits = report?.healthBenefits ?? [];
    dims.healthBenefits =
      benefits.length > 0
        ? evidence(
            `Evidence-gated documented benefits: ${benefits.join(", ")}.`,
            { owner: OWNER_KNOWLEDGE, fact: `Each listed benefit passed the Layer-2 evidence gate (valid SourceRef + human review).` },
          )
        : dimensionGap(
            `No evidence-gated health benefit is documented for ${name} yet — an honest gap, not evidence that it has none.`,
          );

    dims.valueForMoney = dimensionGap(
      "THA stores no canonical price for this item, so value for money cannot be compared without fabricating a price.",
    );

    if (!household.resolved) {
      dims.householdSuitability = dimensionGap(
        "No household resolved for this caller — suitability against household restrictions cannot be assessed.",
      );
    } else {
      const conflicts = resolveIngredientRestrictions(
        `${name} ${subject.category ?? ""}`,
        [...household.restrictionDefs],
      );
      const appearances = subject.slug ? household.familiarAppearances.get(subject.slug) ?? 0 : 0;
      if (conflicts.length > 0) {
        const names = conflicts.map((c) => c.restriction.displayName).join(", ");
        dims.householdSuitability = evidence(
          `Conflicts with an active household restriction (${names}) — not suitable for this household.`,
          { owner: OWNER_RESTRICTIONS, fact: `${name} matches restriction rule(s): ${names}.` },
        );
      } else {
        const familiarity =
          appearances > 0
            ? ` Your household has already planned it (${appearances} planner appearance${appearances === 1 ? "" : "s"}).`
            : "";
        dims.householdSuitability = evidence(
          `No conflict with any active household restriction.${familiarity}`,
          { owner: OWNER_RESTRICTIONS, fact: `${name} matches no active restriction rule.` },
          ...(appearances > 0
            ? [{ owner: OWNER_PLANNER, fact: `${name} appears ${appearances} time(s) in this household's planner history.` }]
            : []),
        );
      }
    }
    return dims;
  }

  // scanned-product
  const product = subject.product!;
  const scanRef: ComparisonEvidence = {
    owner: OWNER_PRODUCT_HISTORY,
    fact: `"${product.productName}"${product.brand ? ` (${product.brand})` : ""} scanned/recorded ${product.scannedAt}.`,
  };

  dims.appleScore =
    product.thaRating != null
      ? evidence(`THA Apple Score ${product.thaRating}/5, as recorded when this product was analysed.`, scanRef)
      : dimensionGap(
          `Your scan record for ${name} has no stored Apple Score — THA will not recompute one without the product's ingredient data.`,
        );

  const processingParts: string[] = [];
  if (product.novaGroup != null) processingParts.push(`NOVA group ${product.novaGroup}`);
  if (product.upfScore != null) processingParts.push(`UPF score ${product.upfScore}/100`);
  dims.processing =
    processingParts.length > 0
      ? evidence(`Recorded processing level: ${processingParts.join(", ")}.`, scanRef)
      : dimensionGap(`Your scan record for ${name} has no stored processing classification.`);

  dims.ingredientQuality = dimensionGap(
    `The ingredient list is not stored in your scan history — ingredient quality cannot be compared without re-analysing the product.`,
  );
  dims.additives = dimensionGap(
    `Additive matches are not stored in your scan history — THA will not re-derive them without the product's ingredient data.`,
  );

  dims.nutritionalProfile =
    product.nutriscoreGrade != null
      ? evidence(`Recorded Nutri-Score grade: ${product.nutriscoreGrade.toUpperCase()}.`, scanRef)
      : dimensionGap(`Your scan record for ${name} has no stored nutrition grade.`);

  dims.healthBenefits = dimensionGap(
    "THA's evidence-gated health-benefit knowledge covers foods in the Food Knowledge Registry, not branded products.",
  );
  dims.valueForMoney = dimensionGap(
    "THA stores no canonical price for this item, so value for money cannot be compared without fabricating a price.",
  );
  dims.householdSuitability = dimensionGap(
    `The ingredient list is not stored in your scan history, so ${name} cannot be verified against household restrictions — check the label.`,
  );

  return dims;
}

// ---------------------------------------------------------------------------
// Cross-subject outcomes (pure)
// ---------------------------------------------------------------------------

function describeSubject(s: SubjectFacts): string {
  return s.name ?? s.query;
}

function buildDimensionOutcomes(
  subjects: readonly SubjectFacts[],
  perSubject: readonly Record<ComparisonDimensionKey, ComparisonDimensionEntry>[],
): ComparisonDimensionOutcome[] {
  return COMPARISON_DIMENSION_KEYS.map((dimension) => {
    const entries = perSubject.map((d) => d[dimension]);
    const missing = entries
      .map((e, i) => (e.status === "gap" ? describeSubject(subjects[i]) : null))
      .filter((n): n is string => n !== null);

    if (missing.length > 0) {
      return {
        dimension,
        comparable: false,
        outcome: null,
        gapReason: `No owner evidence for: ${missing.join(", ")}. THA will not fabricate the missing side of a comparison.`,
      };
    }

    const summaries = entries.map((e, i) => `${describeSubject(subjects[i])}: ${e.summary}`);
    return {
      dimension,
      comparable: true,
      outcome: summaries.join(" · "),
      gapReason: null,
    };
  });
}

// ---------------------------------------------------------------------------
// Recommendation ladder (pure, deterministic — Rule LT3)
// ---------------------------------------------------------------------------

interface LadderResult {
  readonly recommendation: ComparisonRecommendation | null;
  readonly recommendationGap: string | null;
}

function hasRestrictionConflict(subject: SubjectFacts, household: HouseholdSignal): boolean {
  if (subject.kind !== "canonical-food" || !household.resolved || household.restrictionDefs.length === 0) {
    return false;
  }
  return (
    resolveIngredientRestrictions(
      `${subject.name ?? subject.query} ${subject.category ?? ""}`,
      [...household.restrictionDefs],
    ).length > 0
  );
}

function suitabilityCaveat(
  eligible: readonly SubjectFacts[],
  perDims: ReadonlyMap<SubjectFacts, Record<ComparisonDimensionKey, ComparisonDimensionEntry>>,
  household: HouseholdSignal,
): string[] {
  if (!household.resolved || household.restrictionDefs.length === 0) return [];
  const unverifiable = eligible.filter(
    (s) => perDims.get(s)!.householdSuitability.status === "gap" && s.kind === "scanned-product",
  );
  if (unverifiable.length === 0) return [];
  return [
    `Your household has active restrictions and ${unverifiable
      .map(describeSubject)
      .join(", ")} cannot be verified against them from stored data — check the label.`,
  ];
}

function buildRecommendation(
  subjects: readonly SubjectFacts[],
  perSubject: readonly Record<ComparisonDimensionKey, ComparisonDimensionEntry>[],
  household: HouseholdSignal,
): LadderResult {
  const dimsBySubject = new Map<SubjectFacts, Record<ComparisonDimensionKey, ComparisonDimensionEntry>>();
  subjects.forEach((s, i) => dimsBySubject.set(s, perSubject[i]));

  const resolved = subjects.filter((s) => s.kind !== "unresolved");
  if (resolved.length < MIN_SUBJECTS) {
    return {
      recommendation: null,
      recommendationGap:
        "Fewer than two items resolved to owner-backed identities, so there is nothing grounded to recommend between.",
    };
  }

  // Rung 1 — safety (Rule T0). A subject conflicting with an active hard
  // restriction is never recommended.
  const safe = resolved.filter((s) => !hasRestrictionConflict(s, household));
  if (safe.length === 0) {
    return {
      recommendation: null,
      recommendationGap:
        "Every resolved item conflicts with an active household restriction — THA will not recommend any of them.",
    };
  }
  if (safe.length === 1 && resolved.length > 1) {
    const winner = safe[0];
    const excluded = resolved.filter((s) => s !== safe[0]).map(describeSubject);
    return {
      recommendation: {
        slug: winner.slug,
        name: describeSubject(winner),
        basis: [
          `${excluded.join(", ")} conflict${excluded.length === 1 ? "s" : ""} with an active household restriction; ${describeSubject(winner)} does not (Rule T0 — safety supersedes everything).`,
          ...suitabilityCaveat(safe, dimsBySubject, household),
        ],
      },
      recommendationGap: null,
    };
  }

  // Rung 2 — THA Apple Score: only when every safe subject has a stored rating.
  const ratings = safe.map((s) => (s.kind === "scanned-product" ? s.product?.thaRating ?? null : null));
  if (ratings.every((r): r is number => r != null)) {
    const max = Math.max(...ratings);
    const winners = safe.filter((_, i) => ratings[i] === max);
    if (winners.length === 1) {
      const winner = winners[0];
      return {
        recommendation: {
          slug: winner.slug,
          name: describeSubject(winner),
          basis: [
            `Highest recorded THA Apple Score: ${describeSubject(winner)} at ${max}/5 (${safe
              .map((s, i) => `${describeSubject(s)}: ${ratings[i]}/5`)
              .join(", ")}), each as stored in your own scan history.`,
            ...suitabilityCaveat(safe, dimsBySubject, household),
          ],
        },
        recommendationGap: null,
      };
    }
  }

  // Rung 3 — processing: canonical whole food ranks 1 by identity; a product
  // ranks by its recorded NOVA group. Only when every safe subject has a rank.
  const ranks = safe.map((s) => processingRank(s));
  if (ranks.every((r): r is number => r != null)) {
    const min = Math.min(...ranks);
    const winners = safe.filter((_, i) => ranks[i] === min);
    if (winners.length === 1) {
      const winner = winners[0];
      const rankLabel = (s: SubjectFacts, r: number) =>
        s.kind === "canonical-food" ? "whole food" : `NOVA ${r}`;
      return {
        recommendation: {
          slug: winner.slug,
          name: describeSubject(winner),
          basis: [
            `Least processed: ${safe
              .map((s, i) => `${describeSubject(s)} (${rankLabel(s, ranks[i]!)})`)
              .join(" vs ")} — whole-food identity from the canonical seed, product processing from your own scan records.`,
            ...suitabilityCaveat(safe, dimsBySubject, household),
          ],
        },
        recommendationGap: null,
      };
    }
    // All safe subjects tie on processing — an honest tie, not a fabricated edge.
    return {
      recommendation: null,
      recommendationGap:
        "The compared items tie on every dimension with full evidence — THA will not fabricate a difference to break the tie. (Documented nutrients and benefits are not ranked: documentation coverage is not food quality.)",
    };
  }

  return {
    recommendation: null,
    recommendationGap:
      "No dimension has owner evidence for every compared item, so no grounded recommendation is possible. The per-item gaps above say exactly what evidence is missing.",
  };
}

// ---------------------------------------------------------------------------
// Pure reasoning core
// ---------------------------------------------------------------------------

/**
 * Compose the full comparison from already-fetched subject facts and an
 * already-resolved household signal. PURE — no I/O, no randomness, no clock
 * reads; byte-identical output for identical input (Rule LT3).
 */
export function buildComparison(
  subjectFacts: readonly SubjectFacts[],
  household: HouseholdSignal,
): Omit<FoodComparisonBundle, "metadata"> {
  const perSubject = subjectFacts.map((s) => buildSubjectDimensions(s, household));

  const subjects: ComparisonSubject[] = subjectFacts.map((s, i) => ({
    query: s.query,
    kind: s.kind,
    slug: s.slug,
    name: s.name,
    category: s.category,
    dimensions: perSubject[i],
  }));

  const dimensions = buildDimensionOutcomes(subjectFacts, perSubject);
  const { recommendation, recommendationGap } = buildRecommendation(subjectFacts, perSubject, household);

  const gaps: string[] = [];
  for (const subject of subjects) {
    if (subject.kind === "unresolved") {
      gaps.push(`"${subject.query}" did not resolve to a canonical food or a product in your scan history.`);
    }
  }
  for (const d of dimensions) {
    if (!d.comparable) gaps.push(`${d.dimension}: ${d.gapReason}`);
  }

  const resolvedCount = subjectFacts.filter((s) => s.kind !== "unresolved").length;

  return {
    subjects,
    dimensions,
    recommendation,
    recommendationGap,
    trust: {
      isGrounded: resolvedCount >= MIN_SUBJECTS,
      householdAware: household.resolved,
      gaps,
    },
  };
}

// ---------------------------------------------------------------------------
// I/O orchestration — fetches from existing owners, then calls the pure core
// ---------------------------------------------------------------------------

/** Case-insensitive containment match against the caller's own scan history. */
function matchProductHistory(query: string, history: readonly ProductHistory[]): ProductHistory | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  // History arrives most-recent-first from the owner; the first hit is the
  // caller's most recent matching scan — deterministic for a given history state.
  for (const row of history) {
    const name = row.productName.toLowerCase();
    const brand = (row.brand ?? "").toLowerCase();
    if (name.includes(q) || q.includes(name) || (brand && `${brand} ${name}`.includes(q))) return row;
  }
  return null;
}

async function resolveSubject(
  query: string,
  history: readonly ProductHistory[],
): Promise<SubjectFacts> {
  // Identity spine first: a canonical whole food wins over a scan-history match.
  const canonical = resolveCanonicalFood(query);
  if (canonical.matched && canonical.canonicalSlug) {
    const { getEvidenceBackedFoodReport } = await import("../../lib/food-report-evidence.js");
    const report = await getEvidenceBackedFoodReport(canonical.canonicalSlug);
    return {
      query,
      kind: "canonical-food",
      slug: canonical.canonicalSlug,
      name: report?.overview.name ?? canonical.canonicalName,
      category: report?.overview.category ?? null,
      report,
      product: null,
    };
  }

  const product = matchProductHistory(query, history);
  if (product) {
    return {
      query,
      kind: "scanned-product",
      slug: product.barcode ?? String(product.id),
      name: product.productName,
      category: product.brand ?? null,
      report: null,
      product,
    };
  }

  return { query, kind: "unresolved", slug: null, name: null, category: null, report: null, product: null };
}

/**
 * Assemble a deterministic, cited, explainable Food Comparison for two or more
 * named foods/products. Always returns a complete bundle — never throws for an
 * unresolvable item (that is an honest per-subject gap). Throws only for a
 * structurally invalid request (fewer than two non-empty items).
 */
export async function assembleFoodComparison(
  request: FoodComparisonRequest,
): Promise<FoodComparisonBundle> {
  const now = new Date();
  const items = (request.items ?? [])
    .map((i) => (typeof i === "string" ? i.trim() : ""))
    .filter((i) => i.length > 0)
    .slice(0, MAX_SUBJECTS);

  if (items.length < MIN_SUBJECTS) {
    throw new Error(`A food comparison needs at least ${MIN_SUBJECTS} items.`);
  }

  // The caller's own scan history — only for an authenticated caller, read via
  // the owner's existing method. Anonymous callers honestly have no history.
  let history: ProductHistory[] = [];
  if (request.userId != null) {
    try {
      const { storage } = await import("../../storage.js");
      history = await storage.getProductHistory(request.userId, PRODUCT_HISTORY_LOOKUP_LIMIT);
    } catch {
      history = []; // an honest empty history, never a fabricated product record
    }
  }

  const household = request.userId != null ? await resolveHouseholdSignal(request.userId) : NO_HOUSEHOLD_SIGNAL;

  const subjectFacts: SubjectFacts[] = [];
  for (const item of items) {
    subjectFacts.push(await resolveSubject(item, history));
  }

  const core = buildComparison(subjectFacts, household);

  const sources = new Set<string>();
  for (const s of subjectFacts) {
    if (s.kind === "canonical-food") {
      sources.add("canonical-food-seed");
      sources.add("nutrition-knowledge-registry");
    }
    if (s.kind === "scanned-product") sources.add("product-history");
  }
  if (household.resolved) {
    sources.add("household-eaters");
    sources.add("planner-history");
  }

  return {
    ...core,
    metadata: { assembledAt: now.toISOString(), sources: Array.from(sources) },
  };
}
