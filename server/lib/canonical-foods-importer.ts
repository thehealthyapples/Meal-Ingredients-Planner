/**
 * NK6D Canonical Foods Importer
 *
 * Thin translation layer: Parse v2.0-draft YAML → extract knowledge → insert using existing services
 * No new architecture, no new schema, no new tables.
 * Extends existing canonical knowledge persistence.
 */

import { readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
import { db } from "../db";
import { eq } from "drizzle-orm";
import {
  knowledgeFoods,
  knowledgeFoodNutrients,
  knowledgeFoodBenefits,
} from "@shared/schema";
import {
  resolveNutrientTerm,
  resolveBenefitTerm,
  type VocabularyResolution,
} from "@shared/knowledge";
// GOV2 Rule 5 — ONE resolver for canonical FOOD identity (aliases → one identity).
// The importer must resolve the incoming food identity through this shared
// resolver BEFORE minting, so an alias of an existing food (carrot→carrots,
// tomato→tomatoes, sweetcorn→corn, fennel-bulb→fennel) can never fork a second
// identity. No second resolver is introduced (NK6I).
import { resolveCanonicalFood } from "@shared/canonical";
import { recordUnresolvedVocabularyTerm } from "./knowledge-review-store";

/** Provenance stamped on relationship rows written by this importer. */
const FOOD_IMPORT_SOURCE = "NK6 canonical food draft";

/** A term that resolved through the GOV2 resolver to a canonical slug. */
export interface ResolvedTerm {
  input: string;
  canonicalSlug: string;
  via: "exact" | "alias";
}

/** A term the GOV2 resolver could not resolve — rejected and reported. */
export interface RejectedTerm {
  input: string;
  reason: string;
}

export interface ImportResult {
  success: boolean;
  // NK6O — set when the food identity was written but one or more resolved
  // nutrient/benefit targets could NOT be bound (e.g. a resolved canonical slug
  // is missing from knowledge_nutrients). The food is persisted but INCOMPLETE.
  // A partial import is deliberately NOT `success: true` — the drop must never be
  // masked as a clean success (the exact failure that left Batch 006 legumes with
  // benefits but zero nutrients). `success` and `partial` are mutually exclusive.
  partial: boolean;
  foodSlug: string;
  fileName: string;
  errors: string[];
  warnings: string[];
  // NK6O — canonical slugs that resolved but failed to bind (missing FK target,
  // etc.). Populated per-row so ONE bad target drops only itself, never the set.
  dropped: {
    nutrients: string[];
    benefits: string[];
  };
  // Rows newly written this run (existing canonical rows are preserved, not
  // re-counted — the relationship inserts are non-destructive upserts).
  inserted: {
    foods: number;
    nutrients: number;
    benefits: number;
  };
  // Terms that resolved to a canonical identity (exact match or via alias).
  resolved: {
    nutrients: ResolvedTerm[];
    benefits: ResolvedTerm[];
  };
  // Terms rejected by the resolver (unknown / non-canonical) with a reason.
  rejected: {
    nutrients: RejectedTerm[];
    benefits: RejectedTerm[];
  };
  // NK6I — GOV2 canonical FOOD identity reconciliation. When the incoming draft
  // identity resolves (by slug, display name, or a declared alias) to an EXISTING
  // canonical food under a different slug, this records that existing identity and
  // the draft is BLOCKED (never minted) — a merge is a governed, human-approved
  // decision, not a silent insert (GOV2 Rule 7 / draft duplicate_policy).
  identity: {
    /** The draft's own canonical_slug. */
    draftSlug: string;
    /** Existing knowledge_food identity the draft's OWN identity resolves to (block). */
    resolvedToSlug: string | null;
    /** The draft identity string that triggered the block (slug / slug-words / name). */
    matchedOn: string | null;
    /** "new" (no collision), "existing" (same slug), or "alias-of-existing" (block). */
    outcome: "new" | "existing" | "alias-of-existing" | "unchecked";
    /**
     * Softer signal: a DECLARED ALIAS on the draft resolves to a DIFFERENT
     * existing identity (potential scope overlap, e.g. sweet-pepper's alias
     * "red pepper" → existing red-pepper). Surfaced for editorial review, not a
     * hard block — the alias set, not the food's own identity, is what overlaps.
     */
    aliasOverlaps: Array<{ alias: string; resolvedToSlug: string }>;
  };
}

/**
 * Import a single canonical food YAML file
 */
export async function importCanonicalFood(
  filePath: string,
  forceUpsert: boolean = false
): Promise<ImportResult> {
  const result: ImportResult = {
    success: false,
    partial: false,
    foodSlug: "",
    fileName: filePath.split("/").pop() || filePath,
    errors: [],
    warnings: [],
    dropped: { nutrients: [], benefits: [] },
    inserted: { foods: 0, nutrients: 0, benefits: 0 },
    resolved: { nutrients: [], benefits: [] },
    rejected: { nutrients: [], benefits: [] },
    identity: { draftSlug: "", resolvedToSlug: null, matchedOn: null, outcome: "unchecked", aliasOverlaps: [] },
  };

  try {
    // Step 1: Parse YAML
    const content = readFileSync(filePath, "utf-8");
    const draft = parseYaml(content) as any;

    if (!draft?.record?.canonical_slug) {
      result.errors.push("Missing record.canonical_slug in YAML");
      return result;
    }

    result.foodSlug = draft.record.canonical_slug;

    // Step 2: Extract knowledge sections (ignore governance)
    const foodIdentity = extractFoodIdentity(draft);
    const nutrients = extractNutrients(draft);
    const benefits = extractBenefits(draft);

    if (!foodIdentity.slug) {
      result.errors.push("Could not extract valid food identity");
      return result;
    }
    result.identity.draftSlug = foodIdentity.slug;

    // Step 3a: GOV2 canonical-identity reconciliation (NK6I). BEFORE any slug
    // equality check or insert, resolve the incoming identity through the single
    // shared food resolver. An alias of an existing food (e.g. "carrot"→carrots,
    // "sweetcorn"→corn, "fennel-bulb"→fennel) must bind to that ONE identity, not
    // fork a second one — the previous slug-only guard could not see this.
    const identityReconciliation = reconcileFoodIdentity(foodIdentity);
    result.identity.aliasOverlaps = identityReconciliation.aliasOverlaps;
    for (const o of identityReconciliation.aliasOverlaps) {
      result.warnings.push(
        `Declared alias "${o.alias}" resolves to a different existing identity "${o.resolvedToSlug}" ` +
        `— possible scope overlap; review before import (not a hard block).`
      );
    }
    if (identityReconciliation.block) {
      result.identity.resolvedToSlug = identityReconciliation.block.resolvedToSlug;
      result.identity.matchedOn = identityReconciliation.block.matchedOn;
      result.identity.outcome = "alias-of-existing";
      // Rule 7: STOP. Do not mint a duplicate. A merge into the existing identity
      // is a governed, human-approved decision — never a silent importer insert.
      result.errors.push(
        `Canonical identity conflict: draft "${foodIdentity.slug}" resolves to existing canonical food ` +
        `"${identityReconciliation.block.resolvedToSlug}" (matched on "${identityReconciliation.block.matchedOn}"). ` +
        `Importing would create a DUPLICATE identity (GOV2 Rule 7). Reconcile the draft slug to the existing ` +
        `identity or fold its metadata in via a governed, human-approved merge — do not import as-is. ` +
        `--force-upsert must NOT be used to bypass this.`
      );
      return result;
    }

    // Step 3b: Check for exact slug duplicate against the knowledge_food identity.
    const existing = await db.query.knowledgeFoods.findFirst({
      where: (t) => eq(t.slug, foodIdentity.slug),
    });

    if (existing && !forceUpsert) {
      result.identity.outcome = "existing";
      result.errors.push(
        `Food slug "${foodIdentity.slug}" already exists. Use --force-upsert to override.`
      );
      return result;
    }
    result.identity.outcome = existing ? "existing" : "new";

    // Step 4: Resolve incoming vocabulary through the single GOV2 resolver.
    // Every nutrient/benefit name resolves to a canonical slug (exactly or via
    // an alias) BEFORE it is referenced; unresolved names are rejected and
    // reported — never silently minted (GOV2 Rules 4–7).
    const nutrientResolutions = nutrients.map((n) => ({
      resolution: resolveNutrientTerm(n.term),
      confidence: n.confidence,
    }));
    const benefitResolutions = benefits.map((b) => ({
      resolution: resolveBenefitTerm(b.term),
    }));

    // Canonical nutrient slugs to bind (deduplicated — a food may name the same
    // canonical nutrient twice, e.g. "beta_glucan_soluble_fibre" + "fibre").
    const nutrientBindings = collectResolved(
      nutrientResolutions.map((n) => n.resolution),
      result.resolved.nutrients,
      result.rejected.nutrients,
    );
    const benefitBindings = collectResolved(
      benefitResolutions.map((b) => b.resolution),
      result.resolved.benefits,
      result.rejected.benefits,
    );

    // Confidence per canonical nutrient slug (first occurrence wins).
    const nutrientConfidence = new Map<string, string>();
    for (const { resolution, confidence } of nutrientResolutions) {
      if (resolution.resolved && resolution.canonicalSlug && !nutrientConfidence.has(resolution.canonicalSlug)) {
        nutrientConfidence.set(resolution.canonicalSlug, confidence);
      }
    }

    if (result.rejected.nutrients.length > 0) {
      result.warnings.push(
        `Rejected unknown nutrients: ${result.rejected.nutrients.map((r) => r.input).join(", ")}`
      );
    }
    if (result.rejected.benefits.length > 0) {
      result.warnings.push(
        `Rejected unknown benefits: ${result.rejected.benefits.map((r) => r.input).join(", ")}`
      );
    }

    // KQ1B — persist every rejected term to the Knowledge Review Queue so the
    // unresolved vocabulary the GOV2 resolver hands back is no longer ephemeral.
    // Best-effort: a capture failure must never break the import (GOV2 ownership
    // is unchanged; this only records a review PROPOSAL, it mints nothing).
    await captureRejectedTerms(result, foodIdentity.slug);

    // Step 5: Insert / update food identity.
    if (forceUpsert && existing) {
      await db
        .update(knowledgeFoods)
        .set(foodIdentity)
        .where(eq(knowledgeFoods.slug, foodIdentity.slug));
    } else {
      await db.insert(knowledgeFoods).values(foodIdentity);
    }
    result.inserted.foods = 1;

    // Step 6: Bind food → nutrients. NK6O — resilient, ROW-BY-ROW upsert. A single
    // unbindable target (a resolved slug missing from knowledge_nutrients) drops
    // ONLY that row and is reported; it can no longer abort the food's entire
    // nutrient set as the old all-or-nothing multi-row INSERT did (the defect that
    // left Batch 006 legumes with zero nutrients). Non-destructive: existing
    // canonical (e.g. editorial-seed) relationships are preserved.
    if (nutrientBindings.length > 0) {
      const outcome = await bindFoodNutrients(foodIdentity.slug, nutrientBindings, nutrientConfidence);
      result.inserted.nutrients = outcome.inserted;
      result.warnings.push(...outcome.warnings);
      result.dropped.nutrients.push(...outcome.dropped);
    }

    // Step 7: Bind food → benefits (same resilient, non-destructive upsert).
    if (benefitBindings.length > 0) {
      const outcome = await bindFoodBenefits(foodIdentity.slug, benefitBindings);
      result.inserted.benefits = outcome.inserted;
      result.warnings.push(...outcome.warnings);
      result.dropped.benefits.push(...outcome.dropped);
    }

    // NK6O — honest completeness. A dropped target means the food is persisted but
    // INCOMPLETE. Report `partial`, never a clean `success` — silently reporting
    // success while a food loses relationships is the exact bug this repairs.
    result.partial = result.dropped.nutrients.length > 0 || result.dropped.benefits.length > 0;
    if (result.partial) {
      result.warnings.push(
        `PARTIAL import for "${foodIdentity.slug}": identity written, but ` +
        [
          result.dropped.nutrients.length
            ? `${result.dropped.nutrients.length} nutrient(s) dropped [${result.dropped.nutrients.join(", ")}]`
            : "",
          result.dropped.benefits.length
            ? `${result.dropped.benefits.length} benefit(s) dropped [${result.dropped.benefits.join(", ")}]`
            : "",
        ].filter(Boolean).join(" and ") +
        `. Resolve the missing canonical target(s) (seed the vocabulary), then re-bind — not a clean success.`
      );
    }
    result.success = !result.partial;
    return result;
  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : String(error)
    );
    return result;
  }
}

/** Outcome of a resilient, row-by-row relationship bind (NK6O). */
export interface BindOutcome {
  /** Rows newly inserted this call. */
  inserted: number;
  /** Rows skipped because the pair already existed (non-destructive upsert). */
  alreadyPresent: number;
  /** Canonical slugs that could not be bound (e.g. missing FK target). */
  dropped: string[];
  /** Human-readable notes, one per dropped row. */
  warnings: string[];
}

/**
 * NK6O — resilient food→nutrient binding. Insert each resolved nutrient slug as
 * its OWN statement so a single unbindable target (typically a canonical slug the
 * resolver knows but that is absent from `knowledge_nutrients`, tripping the
 * `knowledge_food_nutrients_nutrient_slug_fkey` foreign key) drops only that one
 * row. The previous single multi-row `INSERT … VALUES(rows)` aborted the whole
 * batch on one bad row, silently stripping a food of ALL its nutrients while the
 * import still reported success — exactly what happened to the Batch 006 legumes
 * when `protein` was missing from the table.
 *
 * Reused by the importer (Step 6) and by targeted governed re-binds.
 */
export async function bindFoodNutrients(
  foodSlug: string,
  bindings: string[],
  confidence: Map<string, string>,
): Promise<BindOutcome> {
  const outcome: BindOutcome = { inserted: 0, alreadyPresent: 0, dropped: [], warnings: [] };
  for (let i = 0; i < bindings.length; i++) {
    const nutrientSlug = bindings[i];
    try {
      const written = await db
        .insert(knowledgeFoodNutrients)
        .values({
          foodSlug,
          nutrientSlug,
          confidence: confidence.get(nutrientSlug) || "emerging",
          ranking: i,
          source: FOOD_IMPORT_SOURCE,
          isActive: true,
          // Quantitative values NOT imported (per v2.0-draft numeric policy).
        })
        .onConflictDoNothing({ target: [knowledgeFoodNutrients.foodSlug, knowledgeFoodNutrients.nutrientSlug] })
        .returning({ id: knowledgeFoodNutrients.id });
      if (written.length > 0) outcome.inserted++;
      else outcome.alreadyPresent++;
    } catch (error) {
      // Row isolation: this one target could not bind — record and continue.
      outcome.dropped.push(nutrientSlug);
      outcome.warnings.push(
        `Dropped nutrient "${nutrientSlug}" for food "${foodSlug}" ` +
        `(canonical target likely missing from knowledge_nutrients): ` +
        `${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }
  return outcome;
}

/**
 * NK6O — resilient food→benefit binding, symmetric to {@link bindFoodNutrients}.
 * One unbindable benefit target drops only its own row, never the food's set.
 */
export async function bindFoodBenefits(
  foodSlug: string,
  bindings: string[],
): Promise<BindOutcome> {
  const outcome: BindOutcome = { inserted: 0, alreadyPresent: 0, dropped: [], warnings: [] };
  for (let i = 0; i < bindings.length; i++) {
    const benefitSlug = bindings[i];
    try {
      const written = await db
        .insert(knowledgeFoodBenefits)
        .values({
          foodSlug,
          benefitSlug,
          // Draft-sourced association: internal signal only, not surfaced.
          evidenceStrength: "emerging",
          ranking: i,
          source: FOOD_IMPORT_SOURCE,
          isActive: true,
          // Evidence sources / sign-off NOT imported (human sign-off gate only).
        })
        .onConflictDoNothing({ target: [knowledgeFoodBenefits.foodSlug, knowledgeFoodBenefits.benefitSlug] })
        .returning({ id: knowledgeFoodBenefits.id });
      if (written.length > 0) outcome.inserted++;
      else outcome.alreadyPresent++;
    } catch (error) {
      outcome.dropped.push(benefitSlug);
      outcome.warnings.push(
        `Dropped benefit "${benefitSlug}" for food "${foodSlug}" ` +
        `(canonical target likely missing from knowledge_health_benefits): ` +
        `${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }
  return outcome;
}

/**
 * KQ1B — persist rejected nutrient/benefit terms into the Knowledge Review
 * Queue. Best-effort: swallow (and record) any failure as a warning so a queue
 * outage cannot fail an import. Each rejection carries its food + file context
 * so the queue dedupes distinct terms while counting every sighting.
 */
async function captureRejectedTerms(result: ImportResult, foodSlug: string): Promise<void> {
  const captures: Array<{ domain: "nutrient" | "benefit"; term: RejectedTerm }> = [
    ...result.rejected.nutrients.map((term) => ({ domain: "nutrient" as const, term })),
    ...result.rejected.benefits.map((term) => ({ domain: "benefit" as const, term })),
  ];
  for (const { domain, term } of captures) {
    try {
      await recordUnresolvedVocabularyTerm({
        domain,
        rawTerm: term.input,
        reason: term.reason,
        source: "importer",
        context: { source: "importer", foodSlug, file: result.fileName },
      });
    } catch (error) {
      result.warnings.push(
        `Could not persist rejected ${domain} "${term.input}" to review queue: ${error instanceof Error ? error.message : "unknown error"}`
      );
    }
  }
}

/**
 * NK6I — GOV2 canonical-identity reconciliation. Resolve the incoming draft
 * identity through the single shared food resolver and detect when it names an
 * EXISTING canonical food under a different slug (an alias collision the old
 * slug-equality guard was blind to).
 *
 * Two distinct signals, deliberately separated:
 *
 *  - BLOCK (hard): the food's OWN identity — its slug (raw), its slug with
 *    hyphens→spaces (so "fennel-bulb" reaches the alias "fennel bulb"), or its
 *    display name — resolves to an EXISTING identity under a different slug. This
 *    IS the draft being a duplicate of an existing food (carrot→carrots,
 *    tomato→tomatoes, sweetcorn→corn, fennel-bulb→fennel). Minting it forks the
 *    identity (GOV2 Rule 7) → stop.
 *
 *  - aliasOverlaps (soft): a DECLARED alias resolves to a different existing
 *    identity (e.g. sweet-pepper's "red pepper" → red-pepper). The food's own
 *    identity may be legitimately distinct; the alias SET overlaps. Surfaced for
 *    editorial review, never a silent import and never a hard block.
 *
 * `not_same_as` is deliberately never resolved. A resolution back to the draft's
 * own slug is the exact-match case (left to the slug-equality guard), not a fork.
 */
function reconcileFoodIdentity(
  foodIdentity: { slug: string; name: string; aliases: string[] },
): {
  block: { resolvedToSlug: string; matchedOn: string } | null;
  aliasOverlaps: Array<{ alias: string; resolvedToSlug: string }>;
} {
  const isForeignIdentity = (res: ReturnType<typeof resolveCanonicalFood>): string | null =>
    res.matched && res.knowledgeFoodSlug && res.knowledgeFoodSlug !== foodIdentity.slug
      ? res.knowledgeFoodSlug
      : null;

  // Own-identity candidates (hard block), highest-confidence first.
  const identityCandidates: string[] = [
    foodIdentity.slug,
    foodIdentity.slug.replace(/-/g, " "),
    foodIdentity.name,
  ].filter((c) => typeof c === "string" && c.trim().length > 0);

  let block: { resolvedToSlug: string; matchedOn: string } | null = null;
  for (const candidate of identityCandidates) {
    const foreign = isForeignIdentity(resolveCanonicalFood(candidate));
    if (foreign) {
      block = { resolvedToSlug: foreign, matchedOn: candidate };
      break;
    }
  }

  // Declared-alias overlaps (soft signal), deduplicated by target identity.
  const aliasOverlaps: Array<{ alias: string; resolvedToSlug: string }> = [];
  const seen = new Set<string>();
  for (const alias of Array.isArray(foodIdentity.aliases) ? foodIdentity.aliases : []) {
    if (typeof alias !== "string" || !alias.trim()) continue;
    const foreign = isForeignIdentity(resolveCanonicalFood(alias));
    // Skip the identity we already blocked on to avoid double-reporting.
    if (foreign && foreign !== block?.resolvedToSlug && !seen.has(foreign)) {
      seen.add(foreign);
      aliasOverlaps.push({ alias, resolvedToSlug: foreign });
    }
  }

  return { block, aliasOverlaps };
}

/**
 * Extract food identity from v2.0-draft YAML
 */
function extractFoodIdentity(draft: any) {
  const identity = draft.identity || {};
  const record = draft.record || {};

  return {
    slug: record.canonical_slug || "",
    name: record.display_name || "",
    scientificName: record.scientific_or_source_name || null,
    category: mapFoodCategory(identity.food_category) || "other",
    description: draft.classification?.whole_food_status || null,
    aliases: identity.aliases || [],
    plantFamily: identity.plant_count_policy?.plant_family || null,
    countsToDiversity: identity.plant_count_policy?.counts_towards_plant_diversity ?? true,
    isActive: true,
  };
}

interface ExtractedNutrient { term: string; confidence: string; }
interface ExtractedBenefit { term: string; }

/**
 * Extract nutrients from v2.0-draft YAML. Returns the RAW incoming term — the
 * GOV2 resolver owns normalisation and alias resolution.
 */
export function extractNutrients(draft: any): ExtractedNutrient[] {
  const notable = draft.nutrition_profile?.notable_nutrients || [];
  return notable.map((n: any) => ({
    term: String(n.nutrient || n.slug || ""),
    confidence: mapConfidence(n.confidence || "emerging"),
  }));
}

/**
 * Extract benefits from v2.0-draft YAML. Returns the RAW incoming framing term
 * (`benefit_language[].area`) for the resolver to resolve or reject.
 */
function extractBenefits(draft: any): ExtractedBenefit[] {
  const benefitLanguage = draft.benefit_language || [];
  return benefitLanguage.map((b: any) => ({
    term: String(b.area || b.slug || ""),
  }));
}

/**
 * Map v2.0-draft food_category enum to existing category name
 */
function mapFoodCategory(draft_category: string | undefined): string {
  if (!draft_category) return "other";

  const mapping: Record<string, string> = {
    leafy_green_vegetable: "vegetable",
    cruciferous_vegetable: "vegetable",
    legume_pulse: "legume",
    whole_grain: "grain",
    fish_shellfish: "fish",
    meat_poultry: "meat",
    dairy: "dairy",
    egg: "protein",
    nut_seed: "nuts",
    fruit: "fruit",
    oil: "oil",
    fermented: "fermented",
    herb_spice: "herbs",
  };

  return mapping[draft_category] || draft_category;
}

/**
 * Map v2.0-draft confidence enum to existing confidence level
 */
export function mapConfidence(draft_conf: string | undefined): string {
  if (!draft_conf) return "emerging";

  const mapping: Record<string, string> = {
    well_established: "established",
    well_established_with_absorption_context: "established",
    high_level_consensus: "established",
    moderate: "emerging",
    emerging: "emerging",
    established: "established",
    good: "good",
  };

  return mapping[draft_conf] || "emerging";
}

/**
 * Partition a batch of resolver outcomes: record every resolved term (for
 * reporting), every rejected term (with its reason), and return the ordered,
 * de-duplicated list of canonical slugs to bind. Deduplication upholds GOV2
 * Rule 7 — two aliases of the same identity must not create two relationship
 * rows for one food.
 */
export function collectResolved(
  resolutions: VocabularyResolution[],
  resolvedOut: ResolvedTerm[],
  rejectedOut: RejectedTerm[]
): string[] {
  const seen = new Set<string>();
  const bindings: string[] = [];

  for (const r of resolutions) {
    if (r.resolved && r.canonicalSlug) {
      resolvedOut.push({
        input: r.input,
        canonicalSlug: r.canonicalSlug,
        via: r.via === "alias" ? "alias" : "exact",
      });
      if (!seen.has(r.canonicalSlug)) {
        seen.add(r.canonicalSlug);
        bindings.push(r.canonicalSlug);
      }
    } else {
      rejectedOut.push({ input: r.input, reason: r.reason || "unresolved" });
    }
  }

  return bindings;
}
