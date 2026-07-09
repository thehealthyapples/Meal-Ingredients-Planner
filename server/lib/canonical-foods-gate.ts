/**
 * Canonical Foods Gate (NK6D importer, converged by KNOW2)
 *
 * Parse a v2.0-draft YAML → reconcile its identity → resolve its vocabulary →
 * emit a graduation record. **This module writes nothing to the knowledge_*
 * tables.**
 *
 * It used to. Until KNOW2 it inserted food identities straight into
 * `knowledge_foods`, making it a second writer of a table the Source of Truth
 * Register (Domain 1) assigns to `shared/knowledge/foods.ts` →
 * `server/seeds/seed-knowledge-registry.ts`. 346 of 610 live foods arrived that
 * way, unstamped (so they wore the default `source: "THA editorial"` despite
 * being `authored_by: ChatGPT` drafts) and invisible to the declared owner. The
 * two writers overwrote each other's identity rows — a later `seed:knowledge`
 * silently reverted whatever the importer had force-upserted.
 *
 * Its role is now Stage 2 of the Knowledge Graduation Pipeline
 * (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §1):
 *
 *     1 CANDIDATE  docs/knowledge/canonical-foods/drafts/*.yaml  (AI-authored)
 *     2 GATED      this module — structural filter, never a guess
 *     3 PROMOTED   a human commits the emitted record into shared/knowledge/
 *     4 PUBLISHED  seed-knowledge-registry.ts, the one writer
 *
 * Rule KC9 — automation authors candidates, never publishes them. The gate's
 * output is a reviewable record, not a row.
 */

import { readFileSync } from "fs";
import { parse as parseYaml } from "yaml";
import type {
  InsertKnowledgeFood,
  InsertKnowledgeFoodNutrient,
  InsertKnowledgeFoodBenefit,
} from "@shared/schema";
import {
  resolveNutrientTerm,
  resolveBenefitTerm,
  FOOD_SEED,
  NUTRIENT_SEED,
  HEALTH_BENEFIT_SEED,
  GRADUATED_FOOD_SOURCE,
  type VocabularyResolution,
} from "@shared/knowledge";
// GOV2 Rule 5 — ONE resolver for canonical FOOD identity (aliases → one identity).
// The gate must resolve the incoming food identity through this shared
// resolver BEFORE emitting, so an alias of an existing food (carrot→carrots,
// tomato→tomatoes, sweetcorn→corn, fennel-bulb→fennel) can never fork a second
// identity. No second resolver is introduced (NK6I).
import { resolveCanonicalFood } from "@shared/canonical";
import { recordUnresolvedVocabularyTerm } from "./knowledge-review-store";

/** Provenance carried by every record this gate emits (never "THA editorial"). */
const FOOD_IMPORT_SOURCE = GRADUATED_FOOD_SOURCE;

/**
 * The importer wrote `classification.whole_food_status` into `description`, a
 * display-copy column served by `/api/knowledge/foods`. A machine enum is not a
 * description. The gate emits no description at all: a gap renders as a gap
 * (Principle 6), and authoring prose here would be an unsourced knowledge claim
 * (NK1 Domain 6 trust gate, ENGINEERING_WORKFLOW STEP 7).
 */
const DESCRIPTION_IS_A_HUMAN_ACT = null;

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

/**
 * What the gate hands to the human who will promote it: exactly the rows that
 * belong in `shared/knowledge/graduated-*.ts`. Nothing is written anywhere.
 */
export interface GraduationRecord {
  food: InsertKnowledgeFood;
  nutrients: InsertKnowledgeFoodNutrient[];
  benefits: InsertKnowledgeFoodBenefit[];
}

/**
 * Terminal outcomes, per Rule KC2 — a rejected candidate is a named result,
 * never a silent drop or a silent retry.
 *
 *  - `promote`  cleared the gate; `record` holds the rows a human may commit.
 *  - `existing` the seed already owns this identity; folding the draft in is a
 *               governed merge, not a graduation (GOV2 Rule 7).
 *  - `blocked`  the draft's own identity resolves to a DIFFERENT existing food.
 *               Promoting it would fork the identity.
 *  - `invalid`  structurally unusable (no slug, unreadable, no bindable facts).
 */
export type GateOutcome = "promote" | "existing" | "blocked" | "invalid";

export interface GateResult {
  outcome: GateOutcome;
  foodSlug: string;
  fileName: string;
  errors: string[];
  warnings: string[];
  /** Populated only when `outcome === "promote"`. */
  record: GraduationRecord | null;
  // NK6O, made pre-flight — canonical slugs that resolved but that the seed does
  // not define, so no row may reference them. The importer discovered this only
  // when Postgres rejected the foreign key, AFTER the identity was already
  // written (which is how the Batch 006 legumes ended up with benefits and zero
  // nutrients). The gate now catches it before anything is emitted.
  unbindable: {
    nutrients: string[];
    benefits: string[];
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
  // the draft is BLOCKED (never promoted) — a merge is a governed, human-approved
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
 * Gate a single canonical food YAML draft and, if it clears, emit the record a
 * human may promote into `shared/knowledge/`. Reads the draft and the seed;
 * writes nothing.
 */
export async function gateCanonicalFood(filePath: string): Promise<GateResult> {
  const result: GateResult = {
    outcome: "invalid",
    foodSlug: "",
    fileName: filePath.split("/").pop() || filePath,
    errors: [],
    warnings: [],
    record: null,
    unbindable: { nutrients: [], benefits: [] },
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
      result.outcome = "blocked";
      // Rule 7: STOP. Do not promote a duplicate. A merge into the existing
      // identity is a governed, human-approved decision — never an automatic one.
      result.errors.push(
        `Canonical identity conflict: draft "${foodIdentity.slug}" resolves to existing canonical food ` +
        `"${identityReconciliation.block.resolvedToSlug}" (matched on "${identityReconciliation.block.matchedOn}"). ` +
        `Promoting would create a DUPLICATE identity (GOV2 Rule 7). Reconcile the draft slug to the existing ` +
        `identity or fold its metadata in via a governed, human-approved merge — do not promote as-is.`
      );
      return result;
    }

    // Step 3b: Check for exact slug duplicate against the SEED — the owner of
    // `knowledge_foods` — not against the database. Asking the DB was how the
    // importer came to treat the published table as the authority on identity;
    // the seed is the authority, and the DB is its projection (KNOW2).
    const existing = FOOD_SEED.some((f) => f.slug === foodIdentity.slug);

    if (existing) {
      result.identity.outcome = "existing";
      result.outcome = "existing";
      result.errors.push(
        `Food slug "${foodIdentity.slug}" is already owned by the canonical seed. Folding this draft's ` +
        `metadata into that identity is a governed merge (GOV2 Rule 7), performed by a human in ` +
        `shared/knowledge/ — there is no automatic override.`
      );
      return result;
    }
    result.identity.outcome = "new";

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

    // Step 5: Pre-flight bindability. A slug the resolver knows but the seed does
    // not define cannot appear in a relationship row — `validateKnowledgeSeed()`
    // would refuse the whole seed, and before KNOW2 Postgres refused the row only
    // after the identity had already been written. Drop the unbindable target
    // here, name it, and keep the rest of the food's facts.
    const seedNutrients = new Set(NUTRIENT_SEED.map((n) => n.slug));
    const seedBenefits = new Set(HEALTH_BENEFIT_SEED.map((b) => b.slug));
    const bindableNutrients = nutrientBindings.filter((s) => seedNutrients.has(s));
    const bindableBenefits = benefitBindings.filter((s) => seedBenefits.has(s));
    result.unbindable.nutrients = nutrientBindings.filter((s) => !seedNutrients.has(s));
    result.unbindable.benefits = benefitBindings.filter((s) => !seedBenefits.has(s));
    for (const s of result.unbindable.nutrients) {
      result.warnings.push(`Nutrient "${s}" resolves but is not defined by NUTRIENT_SEED — cannot be promoted; seed the vocabulary first.`);
    }
    for (const s of result.unbindable.benefits) {
      result.warnings.push(`Benefit "${s}" resolves but is not defined by HEALTH_BENEFIT_SEED — cannot be promoted; seed the vocabulary first.`);
    }

    // Step 6: A food with no bindable fact is not a Minimum Viable Fact (Rule
    // KC5: identity + at least one real fact). It is a candidate, not knowledge.
    if (bindableNutrients.length === 0 && bindableBenefits.length === 0) {
      result.outcome = "invalid";
      result.errors.push(
        `Draft "${foodIdentity.slug}" has no bindable nutrient or benefit — identity alone is below the ` +
        `Minimum Viable Fact bar (Rule KC5). Not promoted.`
      );
      return result;
    }

    // Step 7: Emit the graduation record. Identity carries honest draft
    // provenance and no description (see DESCRIPTION_IS_A_HUMAN_ACT). Rankings
    // are the de-duplicated binding order, exactly as the importer computed them.
    result.record = {
      food: {
        slug: foodIdentity.slug,
        name: foodIdentity.name,
        category: foodIdentity.category,
        aliases: foodIdentity.aliases,
        description: DESCRIPTION_IS_A_HUMAN_ACT,
        source: FOOD_IMPORT_SOURCE,
      },
      nutrients: bindableNutrients.map((nutrientSlug, i) => ({
        foodSlug: foodIdentity.slug,
        nutrientSlug,
        confidence: nutrientConfidence.get(nutrientSlug) || "emerging",
        ranking: i,
        source: FOOD_IMPORT_SOURCE,
        // Quantitative values NOT imported (per v2.0-draft numeric policy).
      })),
      benefits: bindableBenefits.map((benefitSlug, i) => ({
        foodSlug: foodIdentity.slug,
        benefitSlug,
        // Draft-sourced association: internal signal only, not surfaced.
        evidenceStrength: "emerging",
        ranking: i,
        source: FOOD_IMPORT_SOURCE,
        // Evidence sources / sign-off NOT imported (human sign-off gate only).
      })),
    };
    result.outcome = "promote";
    return result;
  } catch (error) {
    result.outcome = "invalid";
    result.errors.push(
      error instanceof Error ? error.message : String(error)
    );
    return result;
  }
}

/**
 * KQ1B — persist rejected nutrient/benefit terms into the Knowledge Review
 * Queue. Best-effort: swallow (and record) any failure as a warning so a queue
 * outage cannot fail an import. Each rejection carries its food + file context
 * so the queue dedupes distinct terms while counting every sighting.
 */
async function captureRejectedTerms(result: GateResult, foodSlug: string): Promise<void> {
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
 * Extract food identity from v2.0-draft YAML.
 *
 * `scientificName`, `plantFamily` and `countsToDiversity` are NOT columns of
 * `knowledge_foods`. The importer passed them to Drizzle anyway, which dropped
 * them silently on every one of the 346 rows it wrote. They are returned here
 * because the identity reconciler and the graduation emitter read them, and
 * because naming the gap is better than pretending the draft carried less than
 * it does — but `gateCanonicalFood` builds its record field-by-field and never
 * relies on an insert to discard them. Plant-diversity policy already has an
 * owner in `shared/canonical/foods.ts`; it does not belong in this table.
 */
export function extractFoodIdentity(draft: any) {
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
export function extractBenefits(draft: any): ExtractedBenefit[] {
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
