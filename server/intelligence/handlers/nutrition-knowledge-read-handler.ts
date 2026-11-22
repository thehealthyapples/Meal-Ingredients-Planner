/**
 * Nutrition / Knowledge Read Handler (INT4 — third live capability binding)
 * ========================================================================
 * The THIRD execution handler bound to the THA Intelligence Platform. It makes the
 * `nutrition-knowledge` capability *executable* for READ-ONLY intents only, by delegating
 * every read to the existing Nutrition / Knowledge owner through a
 * {@link NutritionKnowledgeReadPort}. It proves the reusable Port → Handler → Binding
 * pattern (established by the Planner in INT2 and the Shopping binding in INT3) against a
 * third, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only read-only verbs run. There is NO code path here that writes a fact,
 *     authors a benefit, ingests knowledge, or mutates anything — Nutrition / Knowledge
 *     remains the sole owner of every nutrition fact and health claim (Principles 2 & 7).
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO nutrition logic, NO health-claim wording, NO food-science rule, NO
 *     scoring and NO evidence interpretation of its own. It projects the owner's already
 *     source-gated, display-safe output; the owner remains authoritative.
 *   • SOURCE-GATED / NO FABRICATION. Every claim originates in the source-gated registry.
 *     The handler never invents a nutrition fact, never invents a health benefit, and never
 *     asserts a benefit/food link the owner did not store. Unknown food/nutrient/benefit,
 *     empty search, and unlinked benefits all return a structured HONEST GAP (Principle 6).
 *   • GENERAL KNOWLEDGE / PERMISSION-AWARE. This binding exposes only general (public) food
 *     knowledge, mirroring the owner's existing access rules. User-specific / diary-linked
 *     summaries are out of scope and return an honest gap. The platform's server-side
 *     capability gate (role ≥ user, public class) is enforced before the handler runs.
 *
 * The handler is built by {@link createNutritionKnowledgeReadHandler} with a port provider,
 * so the production binding injects the real owning service and tests inject an in-memory owner.
 */

import {
  CapabilityExecutionError,
  type CapabilityHandler,
  type IntelligenceContext,
  type Intent,
} from "../types.js";
import type { NutritionKnowledgeReadPort, FoodKnowledgeEncyclopediaEntry } from "./nutrition-knowledge-read-port.js";
import type { FoodDetailView } from "../../services/nutrition-knowledge-registry.js";
import type { EvidenceConfidence } from "@shared/knowledge/evidence";
import { gap } from "./_read-kit.js";
import { checkFoodCompatibility } from "./nutrition-diet-compatibility.js";

// ---------------------------------------------------------------------------
// Result shapes (read projections — the owner's source-gated, display-safe data)
// ---------------------------------------------------------------------------

/** A citation as the read binding surfaces it — a direct passthrough of the owner's fields. */
export interface KnowledgeCitationView {
  readonly body: string;
  readonly title: string;
  readonly url: string;
}

/** A grounded benefit as the read binding surfaces it — owner editorial wording only.
 *
 *  COMP-DET2 (2026-11-20) — `confidence` and `sourceRefs` were added because the owner
 *  (`getFoodBenefitsForDisplay`) already computes and display-gates both: `confidence` is
 *  derived from the whole evidence chain and `under-review` rows are already excluded before
 *  this point, and `sourceRefs` are the citations that earned THIS food↔benefit chip the
 *  right to render (per-chip, not the generic benefit-catalog row). Previously the handler
 *  discarded both and kept only the generic catalog `description` — the same shared sentence
 *  for every food linked to a benefit — which is why an explain answer sounded thin even when
 *  the admin claim-review queue (knowledge_food_benefits / knowledge_food_nutrients) held a
 *  specific, human-signed-off citation for this exact food. Absent (not null) for the
 *  "benefit alone" path, which has no per-food evidence chain to carry. */
export interface KnowledgeBenefitView {
  readonly slug: string;
  readonly name: string;
  /** The owner's editorial description (source-gated). May be null if the owner stored none. */
  readonly description: string | null;
  readonly confidence?: "established" | "strong" | "emerging";
  readonly sourceRefs?: readonly KnowledgeCitationView[];
}

/**
 * PHASE5A — one preparation of one food, as the read binding surfaces it.
 *
 * The `state` field is the whole contract, and the handler passes it through
 * untouched. It is the owner's answer to a question the platform must never
 * answer for itself:
 *
 *   "effect"      an evidenced, signed-off claim exists → `note` is what to say
 *   "no-change"   an evidenced FINDING that it changes nothing → `note` says so
 *   "unreviewed"  THA has no reviewed note → `note` is null, and stays null
 *
 * The handler does not collapse these, does not default `unreviewed` to a
 * reassuring sentence, and does not compose a sentence of its own from the
 * other fields. An unreviewed preparation carries no note because there is no
 * true note to carry (WS5A §4.3; Principle 6).
 */
export interface KnowledgePreparationView {
  readonly slug: string;
  readonly name: string;
  readonly prepType: string;
  readonly state: "effect" | "no-change" | "unreviewed";
  /** The owner's approved wording. Null iff state is "unreviewed". */
  readonly note: string | null;
  /** The owner's hedge for a weaker-than-established claim. */
  readonly uncertainty: string | null;
  /** Citations that earned the note the right to be spoken. Empty when unreviewed. */
  readonly sources: readonly { readonly body: string; readonly title: string; readonly url: string }[];
}

export interface DietCompatibilityMemberInfo {
  readonly displayName: string;
  readonly compatible: boolean;
  readonly conflictingDietPatterns: readonly string[];
}

export interface DietCompatibilityInfo {
  readonly compatible: boolean;
  readonly restrictions: readonly string[];
  readonly dietPatterns: readonly string[];
  readonly conflictingRestrictions: readonly string[];
  readonly conflictingDietPatterns: readonly string[];
  readonly members: readonly DietCompatibilityMemberInfo[];
  readonly explanation: string;
}

export interface NutritionFoodReadResult {
  readonly scope: "food";
  readonly slug: string;
  readonly name: string;
  readonly category: string;
  readonly subcategory: string | null;
  readonly description: string | null;
  readonly benefits: readonly { readonly slug: string; readonly name: string }[];
  readonly nutrients: readonly { readonly slug: string; readonly name: string; readonly amount: string | null }[];
  readonly preparations: readonly KnowledgePreparationView[];
  readonly source: "nutrition-knowledge-registry";
  readonly dietCompatibility?: DietCompatibilityInfo;
  /** 2026-11-22 — without this, "can I eat X" / "can my family eat X" (verb
   *  "read", scope "food") never qualified for the single-capability
   *  deterministic-answer short-circuit (conversation-gateway.ts COMP-DET1),
   *  so EVERY such answer went through full LLM generation — and the LLM,
   *  given per-member diet data, anonymised real household member names into
   *  "one household member" / "another member" (live-caught). The handler's
   *  own `dietCompatibility.explanation` already names them correctly; this
   *  surfaces it as the verbatim spoken answer instead of material an LLM
   *  paraphrases. */
  readonly deterministicAnswer?: string;
}

export interface NutritionPreparationsReadResult {
  readonly scope: "preparations";
  readonly foodSlug: string;
  readonly foodName: string;
  readonly preparations: readonly KnowledgePreparationView[];
  readonly source: "nutrition-knowledge-registry";
  readonly note: string;
}

export interface NutritionNutrientReadResult {
  readonly scope: "nutrient";
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly foods: readonly { readonly slug: string; readonly name: string }[];
  readonly benefits: readonly { readonly slug: string; readonly name: string }[];
  readonly source: "nutrition-knowledge-registry";
}

export interface NutritionBenefitReadResult {
  readonly scope: "benefit";
  readonly slug: string;
  readonly name: string;
  readonly description: string | null;
  readonly foods: readonly { readonly slug: string; readonly name: string }[];
  readonly source: "nutrition-knowledge-registry";
}

export interface NutritionCategoriesReadResult {
  readonly scope: "categories";
  readonly categories: readonly { readonly category: string; readonly count: number }[];
  readonly source: "nutrition-knowledge-registry";
}

export interface NutritionFoodsReadResult {
  readonly scope: "foods";
  readonly category: string | null;
  readonly foodCount: number;
  readonly foods: readonly { readonly slug: string; readonly name: string; readonly category: string }[];
  readonly source: "nutrition-knowledge-registry";
}

export interface NutritionSearchResult {
  readonly query: string;
  readonly foods: readonly { readonly slug: string; readonly name: string }[];
  readonly nutrients: readonly { readonly slug: string; readonly name: string }[];
  readonly benefits: readonly { readonly slug: string; readonly name: string }[];
  readonly source: "nutrition-knowledge-registry";
  /** COMP-DET7 (2026-11-21) — same rationale as COMP-DET2/6: state the real match list in
   *  code rather than handing the LLM a bare JSON array and hoping it enumerates correctly. */
  readonly deterministicAnswer: string;
}

export interface NutritionExplainResult {
  /** "food-benefits" = a food's grounded benefits; "food-benefit" = one (food, benefit);
   *  "benefit" = a benefit alone; "food-encyclopedia" (COMP-DET2) = the Food Knowledge
   *  Encyclopedia fallback, used only when the evidence-linked graph has nothing for this
   *  food; "food-category-search" (COMP-DET6) = a registry SEARCH fallback for a category/
   *  plural term ("legumes", not any single food's own slug) that has no row of its own;
   *  "food-description" = the food's own registry description (knowledge_foods.description),
   *  used only when the food exists but has NO evidence-linked benefit claim and NO
   *  encyclopedia entry — the last honest source before a gap, not a fabrication: this text
   *  is the owner's own stored editorial copy for the food row itself. */
  readonly scope: "food-benefits" | "food-benefit" | "benefit" | "food-encyclopedia" | "food-category-search" | "food-description";
  readonly foodSlug?: string;
  readonly foodName?: string;
  readonly benefits: readonly KnowledgeBenefitView[];
  /** For scope "benefit": the foods the owner says support this benefit. */
  readonly foods?: readonly { readonly slug: string; readonly name: string }[];
  readonly source: "nutrition-knowledge-registry" | "food-knowledge-encyclopedia";
  readonly note: string;
  /** COMP-DET2 — a handler-computed, citation-grounded answer. When present, the Companion
   *  may speak it verbatim instead of generating from context (conversation-gateway.ts's
   *  deterministic-answer short-circuit) — safer than an LLM paraphrase for citation text. */
  readonly deterministicAnswer?: string;
  /** COMP-DET2 — present only for scope "food-encyclopedia": the owner's encyclopedia fields,
   *  passed through unmodified (editorial, not evidence-graph; see FoodKnowledgeEncyclopediaEntry). */
  readonly encyclopedia?: {
    readonly title: string;
    readonly shortSummary: string | null;
    readonly whatToKnow: string | null;
    readonly whyThaHighlightsThis: string | null;
    readonly simplerAlternatives: string | null;
  };
  /** COMP-DET6 — present only for scope "food-category-search": the real registry foods a
   *  unified search found for the category/plural term, each with its own stored
   *  description (source-gated, not fabricated — the registry's own editorial text). */
  readonly categoryMatches?: readonly { readonly slug: string; readonly name: string; readonly description: string | null }[];
  /** Diet compatibility info for food scopes when a user has dietary constraints. */
  readonly dietCompatibility?: DietCompatibilityInfo;
}

// ---------------------------------------------------------------------------
// Nutrition-specific helpers
// ---------------------------------------------------------------------------

/** Coerce a parameter to a trimmed non-empty string, or undefined. */
function toSlug(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length > 0 ? s : undefined;
}

const GROUNDED_NOTE =
  "Grounded in the source-gated Nutrition / Knowledge owner. No nutrition fact or health " +
  "benefit was authored here; nothing the owner does not record is shown.";

const ENCYCLOPEDIA_NOTE =
  "Grounded in THA's own Food Knowledge Encyclopedia (editorial, general, non-personalized). " +
  "This is a DIFFERENT source from the cited evidence graph above — shown only because that " +
  "graph has no evidence-linked benefit recorded for this food, not instead of it.";

/** COMP-DET2 — phrasing for the owner's derived Evidence Confidence. Never upgraded or
 *  downgraded here; the words only name what the owner already computed. `under-review` is
 *  handled defensively only — the owner's display-safe helpers (`isRenderableConfidence`)
 *  already exclude it before a `DisplayBenefit` ever reaches this handler. */
function confidencePhrase(confidence: EvidenceConfidence): string {
  switch (confidence) {
    case "established":
      return "well-established";
    case "strong":
      return "well-supported";
    case "emerging":
    case "under-review":
    default:
      return "emerging evidence";
  }
}

/** Narrow the owner's full Evidence Confidence to the three values that are ever actually
 *  renderable (`under-review` rows never reach this handler) — for the public view's type. */
function toDisplayConfidence(confidence: EvidenceConfidence): "established" | "strong" | "emerging" {
  return confidence === "under-review" ? "emerging" : confidence;
}

function toCitationView(ref: { body: string; title: string; url: string }): KnowledgeCitationView {
  return { body: ref.body, title: ref.title, url: ref.url };
}

/** Dedup citations by publisher (`body`) — the real title/url stays on `sourceRefs` for any
 *  consumer that wants the detail; the spoken sentence names only who said it, not the full
 *  legal citation text, so it reads like a sentence and not a bibliography. */
function dedupCitationLabels(refs: readonly { body: string }[], max = 4): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const r of refs) {
    if (seen.has(r.body)) continue;
    seen.add(r.body);
    labels.push(r.body);
    if (labels.length >= max) break;
  }
  return labels;
}

/** COMP-DET2 — build a spoken, citation-grounded answer for a food's full benefit list.
 *  Every clause names only what the owner's evidence chain already supports; no benefit,
 *  confidence or citation is invented here. */
function buildFoodBenefitsDeterministicAnswer(
  foodName: string,
  linked: readonly { benefit: { name: string }; confidence: EvidenceConfidence; sourceRefs: readonly { body: string; title: string; url: string }[] }[],
): string {
  const clauses = linked.map((b) => `${b.benefit.name.toLowerCase()} (${confidencePhrase(b.confidence)})`);
  const benefitsText =
    clauses.length === 1
      ? clauses[0]
      : `${clauses.slice(0, -1).join(", ")} and ${clauses[clauses.length - 1]}`;
  const citationLabels = dedupCitationLabels(linked.flatMap((b) => b.sourceRefs));
  const sourcesText = citationLabels.length > 0 ? ` Source: ${citationLabels.join(", ")}.` : "";
  return `${foodName} is linked to ${benefitsText}.${sourcesText}`;
}

/** COMP-DET2 — the single-(food, benefit) counterpart of the above. */
function buildFoodBenefitDeterministicAnswer(
  foodName: string,
  benefitName: string,
  confidence: EvidenceConfidence,
  sourceRefs: readonly { body: string; title: string; url: string }[],
): string {
  const citationLabels = dedupCitationLabels(sourceRefs);
  const sourcesText = citationLabels.length > 0 ? ` Source: ${citationLabels.join(", ")}.` : "";
  return `${foodName}'s link to ${benefitName.toLowerCase()} is ${confidencePhrase(confidence)}.${sourcesText}`;
}

/** COMP-DET6 (2026-11-21) — live-caught (FK-077): "why are legumes good for us?" resolves
 *  to `explain { foodSlug: "legumes" }`, but the registry has no food literally slugged
 *  "legumes" — it has 17 individual legumes (lentils, chickpeas, black beans...) each with
 *  their own real, editorial description. A plural/category term in the question is not
 *  the same as an unknown food; a unified search over the SAME registry finds them. Builds
 *  the deterministicAnswer from up to 3 real matches' own stored descriptions — no
 *  invented content, same source-gating as every other path in this handler. */
function buildCategorySearchExplainResult(term: string, foods: readonly { slug: string; name: string; description: string | null }[]): NutritionExplainResult {
  // COMP-DET7 (2026-11-21) — live-caught (FK-080 "is white bread always bad?"): the
  // first 3 raw matches can all have `description: null` (most registry rows do — only
  // the curated subset is annotated), producing a "found" answer that names a food and
  // says nothing else — technically not a gap, but no more useful than one. Prefer
  // matches that actually HAVE a description; only fall back to bare names, and say so
  // honestly, when truly none of the matches carry one.
  const withDescription = foods.filter((f) => f.description);
  const shown = (withDescription.length > 0 ? withDescription : foods).slice(0, 3);
  const deterministicAnswer =
    shown.length === 0
      ? `The Nutrition / Knowledge owner has no foods recorded matching "${term}".`
      : withDescription.length > 0
        ? shown.map((f) => `${f.name}: ${f.description}`).join(" ")
        : `The Nutrition / Knowledge owner recognises ${shown.map((f) => f.name).join(", ")} as matching "${term}", but has no further detail recorded for any of them.`;
  return {
    scope: "food-category-search",
    foodName: term,
    benefits: [],
    source: "nutrition-knowledge-registry",
    note: GROUNDED_NOTE,
    deterministicAnswer,
    categoryMatches: shown,
  };
}

/** COMP-DET2 — the Food Knowledge Encyclopedia fallback result. Used only when the
 *  evidence-linked graph (above) has nothing recorded for this food; a different, editorial
 *  source, so `scope`/`source` say so plainly rather than blending it into the cited result. */
function buildEncyclopediaExplainResult(entry: FoodKnowledgeEncyclopediaEntry): NutritionExplainResult {
  const pieces = [entry.shortSummary, entry.whatToKnow].filter((p): p is string => Boolean(p && p.trim()));
  const deterministicAnswer =
    pieces.length > 0
      ? pieces.join(" ")
      : `THA's Food Knowledge Encyclopedia has an entry for "${entry.title}" but no further detail recorded.`;
  return {
    scope: "food-encyclopedia",
    foodSlug: entry.slug,
    foodName: entry.title,
    benefits: [],
    source: "food-knowledge-encyclopedia",
    note: ENCYCLOPEDIA_NOTE,
    deterministicAnswer,
    encyclopedia: {
      title: entry.title,
      shortSummary: entry.shortSummary,
      whatToKnow: entry.whatToKnow,
      whyThaHighlightsThis: entry.whyThaHighlightsThis,
      simplerAlternatives: entry.simplerAlternatives,
    },
  };
}

const FOOD_DESCRIPTION_NOTE =
  "Grounded in the Nutrition / Knowledge owner's own registry description for this food. No " +
  "evidence-linked health benefit or encyclopedia entry is recorded for it yet, so no benefit " +
  "claim is made here — this is the food's own stored editorial copy, not a fabricated summary.";

/** Live-caught (2026-11-21): "tell me about pasta" / "tell me about lasagne" — the food EXISTS
 *  in the registry (610-row FOOD_SEED, slug "pasta") but has no evidence-linked health-benefit
 *  claim and no separate encyclopedia entry, so the two fallbacks above both came back empty
 *  and the handler fell straight to an honest gap — even though `knowledge_foods.description`
 *  itself holds real, source-seeded editorial text for exactly this food
 *  ("A versatile durum wheat staple, sold dried in every shape..."). That text was being read
 *  into every OTHER result shape (readFood's NutritionFoodReadResult.description) but never
 *  surfaced here, the one path an "explain" / "tell me about" utterance actually takes. This
 *  is the last honest source before a gap, not a new claim: the row's own stored description,
 *  same source-gating as everywhere else in this handler. */
function buildFoodDescriptionExplainResult(
  food: { slug: string; name: string; description: string | null },
  dietCompatibility: DietCompatibilityInfo | undefined,
): NutritionExplainResult {
  const base = food.description ?? `${food.name} is recorded in the Nutrition / Knowledge registry, but no further detail is recorded for it yet.`;
  const deterministicAnswer = dietCompatibility && !dietCompatibility.compatible
    ? `${base} However, ${dietCompatibility.explanation}`
    : dietCompatibility && dietCompatibility.compatible
    ? `${base} ${dietCompatibility.explanation}`
    : base;
  return {
    scope: "food-description",
    foodSlug: food.slug,
    foodName: food.name,
    benefits: [],
    source: "nutrition-knowledge-registry",
    note: FOOD_DESCRIPTION_NOTE,
    deterministicAnswer,
    ...(dietCompatibility && { dietCompatibility }),
  };
}

/**
 * 2026-11-22 (live-caught) — "can I eat lasagne?" / "tell me about lasagne" both
 * resolve to slug "lasagne", but `getFoodDetailView` is an EXACT slug lookup —
 * it has no knowledge that "lasagne" is a registered ALIAS of the food actually
 * recorded (slug "pasta", `aliases: [..., "lasagne", "lasagne sheets"]`). The
 * explain path already had a search-based fallback for the unknown-food case,
 * but it only built a bare category-list summary, never resurfaced the real
 * food so diet compatibility, benefits, etc. could be checked against it — and
 * the read path (used by "can I eat X") had no fallback at all, so "lasagne",
 * "spaghetti", "penne" and every other pasta alias gapped outright despite
 * being registered aliases of a food THA does know.
 *
 * This resolves slug → EXACT match first (unchanged, zero behaviour change for
 * every food that already worked), then falls back to `findBestFoodMatch`
 * (FOODUI7's exact-name > exact-alias > starts-with > substring ranking) rather
 * than a raw unified search: a plain substring search for "lasagne" also
 * returns the separate pantry-catalogue row "Lasagne Sheets" (a different food,
 * no description, from a different seed) ALONGSIDE "Pasta" — two results, and
 * a naive "only act on exactly one match" rule would gap on exactly the query
 * this fix exists for. `findBestFoodMatch`'s exact-alias tier picks "Pasta"
 * correctly because "lasagne" is a registered EXACT alias of it, while "Lasagne
 * Sheets" only matches by substring/name — the same priority order the
 * Pantry Explore one-box lookup already trusts for this exact ambiguity.
 */
async function resolveFoodDetail(
  slug: string,
  port: NutritionKnowledgeReadPort,
): Promise<FoodDetailView | undefined> {
  const direct = await port.getFoodDetailView(slug);
  if (direct) return direct;

  const best = await port.findBestFoodMatch(slug.replace(/-/g, " "));
  if (!best) return undefined;
  return port.getFoodDetailView(best.slug);
}

const PREPARATION_NOTE =
  "A preparation is shown because the owner records that people prepare this food that way. " +
  'A preparation NOTE is shown only where the owner holds a cited, human-signed-off claim. Where ' +
  'state is "unreviewed" there is no note, and none may be inferred: THA does not know whether that ' +
  "preparation changes this food's nutrition, and says so rather than guessing.";

/** Project the owner's preparation view. A pure re-shape — no interpretation,
 *  no defaulting, no sentence-building. The owner's `state` and `approvedWording`
 *  pass through exactly as stored. */
function toPreparationView(p: {
  slug: string;
  name: string;
  prepType: string;
  state: "effect" | "no-change" | "unreviewed";
  approvedWording: string | null;
  uncertaintyNote: string | null;
  sourceRefs: readonly { body: string; title: string; url: string }[];
}): KnowledgePreparationView {
  return {
    slug: p.slug,
    name: p.name,
    prepType: p.prepType,
    state: p.state,
    note: p.approvedWording,
    uncertainty: p.uncertaintyNote,
    sources: p.sourceRefs.map((r) => ({ body: r.body, title: r.title, url: r.url })),
  };
}

// ---------------------------------------------------------------------------
// Read scopes (general food knowledge — delegated, source-gated)
// ---------------------------------------------------------------------------

type ReadScope = "food" | "nutrient" | "benefit" | "categories" | "foods" | "preparations";

async function readFood(
  intent: Intent,
  port: NutritionKnowledgeReadPort,
  userId?: number,
): Promise<NutritionFoodReadResult> {
  const slug = toSlug(intent.parameters?.slug);
  if (!slug) throw gap('Reading a food needs { slug } — the food\'s canonical key.');

  const detail = await resolveFoodDetail(slug, port);
  if (!detail) {
    throw gap(
      `Honest gap: the Nutrition / Knowledge owner has no food recorded for slug ${JSON.stringify(slug)}. ` +
        "The Intelligence Platform will not infer or fabricate nutrition facts for an unknown food.",
    );
  }

  // Check diet compatibility (reusable across all domains)
  const dietCompatibility = userId ? await checkFoodCompatibility(detail.food.name, userId) : undefined;

  const base = detail.food.description ?? `${detail.food.name} is recorded in the Nutrition / Knowledge registry.`;
  const deterministicAnswer = dietCompatibility
    ? `${base} ${dietCompatibility.explanation}`
    : base;

  return {
    scope: "food",
    slug: detail.food.slug,
    name: detail.food.name,
    category: detail.food.category,
    subcategory: detail.food.subcategory,
    description: detail.food.description,
    benefits: detail.benefits.map((b) => ({ slug: b.slug, name: b.name })),
    nutrients: detail.nutrients.map((n) => ({ slug: n.slug, name: n.name, amount: n.amount })),
    preparations: detail.preparations.map(toPreparationView),
    source: "nutrition-knowledge-registry",
    deterministicAnswer,
    ...(dietCompatibility && { dietCompatibility }),
  };
}

/**
 * PHASE5A — "how do people cook/prepare this, and does it change anything?"
 *
 * An unknown food is a gap. A KNOWN food the owner records no preparations for
 * is ALSO a gap — and that distinction matters: the platform must not answer
 * "no preparations" with an empty list that a caller could read as "this food
 * has no preparations", when the truth is "THA has not recorded any".
 */
async function readPreparations(
  intent: Intent,
  port: NutritionKnowledgeReadPort,
): Promise<NutritionPreparationsReadResult> {
  const slug = toSlug(intent.parameters?.slug) ?? toSlug(intent.parameters?.foodSlug);
  if (!slug) throw gap("Reading preparations needs { slug } — the food's canonical key.");

  const detail = await port.getFoodDetailView(slug);
  if (!detail) {
    throw gap(
      `Honest gap: the Nutrition / Knowledge owner has no food recorded for slug ${JSON.stringify(slug)}. ` +
        "The Intelligence Platform will not infer how an unknown food is prepared.",
    );
  }
  if (detail.preparations.length === 0) {
    throw gap(
      `Honest gap: the Nutrition / Knowledge owner records no preparations for "${detail.food.name}". ` +
        "That is a gap in what THA has recorded — it is NOT a statement that this food has no " +
        "preparations, and the Intelligence Platform will not invent a set of them.",
    );
  }
  return {
    scope: "preparations",
    foodSlug: detail.food.slug,
    foodName: detail.food.name,
    preparations: detail.preparations.map(toPreparationView),
    source: "nutrition-knowledge-registry",
    note: PREPARATION_NOTE,
  };
}

async function readNutrient(
  intent: Intent,
  port: NutritionKnowledgeReadPort,
): Promise<NutritionNutrientReadResult> {
  const slug = toSlug(intent.parameters?.slug);
  if (!slug) throw gap('Reading a nutrient needs { slug } — the nutrient\'s canonical key.');

  const detail = await port.getNutrientDetailView(slug);
  if (!detail) {
    throw gap(
      `Honest gap: the Nutrition / Knowledge owner has no nutrient recorded for slug ${JSON.stringify(slug)}. ` +
        "The Intelligence Platform will not fabricate nutrient data.",
    );
  }
  return {
    scope: "nutrient",
    slug: detail.nutrient.slug,
    name: detail.nutrient.name,
    description: detail.nutrient.description,
    foods: detail.foods.map((f) => ({ slug: f.slug, name: f.name })),
    benefits: detail.benefits.map((b) => ({ slug: b.slug, name: b.name })),
    source: "nutrition-knowledge-registry",
  };
}

async function readBenefit(
  intent: Intent,
  port: NutritionKnowledgeReadPort,
): Promise<NutritionBenefitReadResult> {
  const slug = toSlug(intent.parameters?.slug);
  if (!slug) throw gap('Reading a health benefit needs { slug } — the benefit\'s canonical key.');

  const detail = await port.getBenefitDetailView(slug);
  if (!detail) {
    throw gap(
      `Honest gap: the Nutrition / Knowledge owner has no health benefit recorded for slug ${JSON.stringify(slug)}. ` +
        "The Intelligence Platform will not fabricate a health benefit.",
    );
  }
  return {
    scope: "benefit",
    slug: detail.benefit.slug,
    name: detail.benefit.name,
    description: detail.benefit.description,
    foods: detail.foods.map((f) => ({ slug: f.slug, name: f.name })),
    source: "nutrition-knowledge-registry",
  };
}

async function readCategories(
  port: NutritionKnowledgeReadPort,
): Promise<NutritionCategoriesReadResult> {
  const categories = await port.listFoodCategories();
  return { scope: "categories", categories, source: "nutrition-knowledge-registry" };
}

async function readFoods(
  intent: Intent,
  port: NutritionKnowledgeReadPort,
): Promise<NutritionFoodsReadResult> {
  const category = toSlug(intent.parameters?.category) ?? null;
  const cards = await port.listFoodCards(category ?? undefined);
  return {
    scope: "foods",
    category,
    foodCount: cards.length,
    foods: cards.map((c) => ({ slug: c.slug, name: c.name, category: c.category })),
    source: "nutrition-knowledge-registry",
  };
}

async function handleRead(intent: Intent, port: NutritionKnowledgeReadPort, userId?: number): Promise<unknown> {
  const scope = intent.parameters?.scope as ReadScope | undefined;
  switch (scope) {
    case "food":
      return readFood(intent, port, userId);
    case "nutrient":
      return readNutrient(intent, port);
    case "benefit":
      return readBenefit(intent, port);
    case "categories":
      return readCategories(port);
    case "foods":
      return readFoods(intent, port);
    case "preparations":
      return readPreparations(intent, port);
    default:
      throw gap(
        `Unsupported nutrition-knowledge read scope ${JSON.stringify(scope)}. Supported read scopes: ` +
          '"food" / "nutrient" / "benefit" / "preparations" (each needs { slug }), "categories", and ' +
          '"foods" (optional { category }).',
      );
  }
}

// ---------------------------------------------------------------------------
// Search (delegated unified search)
// ---------------------------------------------------------------------------

/** COMP-DET7 (2026-11-21) — words too generic to search by on their own (would either
 *  match nothing useful or everything). Dropped only from the WORD-RETRY fallback below;
 *  the full phrase is always tried first, unfiltered. */
const SEARCH_RETRY_STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "what", "which", "good", "best", "some", "any", "for",
  "of", "to", "me", "my", "i", "should", "try", "do", "does", "it", "that", "this",
]);

/** COMP-DET7 — live-caught (FK-081): "what is a good keto-friendly whole-food snack?"
 *  resolved to a search for the ENTIRE captured phrase ("keto-friendly whole-food snack"),
 *  which matched nothing (the registry's own text match needs a real substring, not a
 *  5-word phrase) and returned a bare empty result — same "whole utterance as query"
 *  bug class as several pattern-intent-resolver matchers fixed earlier tonight, just
 *  surfacing here in the handler instead. Retrying word-by-word on an empty result lets
 *  "snack" or "keto" still find something real instead of a silent, total miss. */
async function searchWithWordFallback(
  query: string,
  port: NutritionKnowledgeReadPort,
): Promise<Awaited<ReturnType<NutritionKnowledgeReadPort["searchKnowledgeRegistry"]>>> {
  const first = await port.searchKnowledgeRegistry(query);
  if (first.foods.length > 0 || first.nutrients.length > 0 || first.benefits.length > 0) return first;

  const words = query.split(/\s+/).filter((w) => w.length > 2 && !SEARCH_RETRY_STOPWORDS.has(w));
  for (const word of words) {
    const retry = await port.searchKnowledgeRegistry(word);
    if (retry.foods.length > 0 || retry.nutrients.length > 0 || retry.benefits.length > 0) {
      return { ...retry, query };
    }
  }
  return first;
}

function buildSearchDeterministicAnswer(result: { query: string; foods: readonly { name: string }[]; nutrients: readonly { name: string }[]; benefits: readonly { name: string }[] }): string {
  const foodNames = result.foods.slice(0, 6).map((f) => f.name);
  const benefitNames = result.benefits.slice(0, 3).map((b) => b.name);
  if (foodNames.length === 0 && benefitNames.length === 0) {
    return `No foods, nutrients or health benefits matched "${result.query}" in the Nutrition / Knowledge registry.`;
  }
  const parts: string[] = [];
  if (foodNames.length > 0) parts.push(`Foods: ${foodNames.join(", ")}${result.foods.length > foodNames.length ? ", and more" : ""}.`);
  if (benefitNames.length > 0) parts.push(`Related benefits: ${benefitNames.join(", ")}.`);
  return parts.join(" ");
}

async function handleSearch(
  intent: Intent,
  port: NutritionKnowledgeReadPort,
  userId?: number,
): Promise<NutritionSearchResult> {
  const query = toSlug(intent.parameters?.query);
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[NUTRITION-SEARCH] Query input: "${intent.parameters?.query}" → slug: "${query}"`);
  }
  if (!query) {
    throw gap('Searching nutrition knowledge needs a non-empty { query } string.');
  }
  const result = await searchWithWordFallback(query, port);
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[NUTRITION-SEARCH] Search results: ${result.foods.length} foods, ${result.nutrients.length} nutrients, ${result.benefits.length} benefits`);
  }

  // For search results, check compatibility on first food result if user has dietary constraints
  let dietCompatibility: DietCompatibilityInfo | undefined;
  if (userId && result.foods.length > 0) {
    dietCompatibility = await checkFoodCompatibility(result.foods[0].name, userId);
  }

  return {
    query: result.query,
    foods: result.foods.map((f) => ({ slug: f.slug, name: f.name })),
    nutrients: result.nutrients.map((n) => ({ slug: n.slug, name: n.name })),
    benefits: result.benefits.map((b) => ({ slug: b.slug, name: b.name })),
    source: "nutrition-knowledge-registry",
    deterministicAnswer: buildSearchDeterministicAnswer(result),
    ...(dietCompatibility && { dietCompatibility }),
  };
}

// ---------------------------------------------------------------------------
// Explain (source-gated benefit wording only — no fabrication)
// ---------------------------------------------------------------------------

/**
 * Explain a food benefit using the owner's source-gated editorial knowledge only. The
 * handler NEVER authors a benefit and NEVER asserts a (food, benefit) link the owner did
 * not store — an unlinked benefit, or an unknown food/benefit, is an honest gap.
 */
async function handleExplain(
  intent: Intent,
  port: NutritionKnowledgeReadPort,
  userId?: number,
): Promise<NutritionExplainResult> {
  const params = intent.parameters ?? {};
  let foodSlug = toSlug(params.foodSlug);
  const benefitSlug = toSlug(params.benefitSlug);

  if (!foodSlug && !benefitSlug) {
    throw gap(
      "Explaining nutrition knowledge needs { foodSlug } and/or { benefitSlug } — which food's " +
        "benefit(s) to explain from the source-gated owner.",
    );
  }

  // Benefit alone → the benefit's grounded description + the foods the owner links to it.
  if (foodSlug == null) {
    const detail = await port.getBenefitDetailView(benefitSlug!);
    if (!detail) {
      throw gap(
        `Honest gap: the Nutrition / Knowledge owner records no health benefit for slug ${JSON.stringify(benefitSlug)}. ` +
          "The Intelligence Platform will not fabricate a health benefit.",
      );
    }
    return {
      scope: "benefit",
      benefits: [{ slug: detail.benefit.slug, name: detail.benefit.name, description: detail.benefit.description }],
      foods: detail.foods.map((f) => ({ slug: f.slug, name: f.name })),
      source: "nutrition-knowledge-registry",
      note: GROUNDED_NOTE,
    };
  }

  // Food present → confirm it exists, then surface ONLY its owner-linked benefits.
  // resolveFoodDetail tries the exact slug first, then (2026-11-22) a single alias
  // match — "lasagne" resolving to the registered food "pasta" (aliases: [...,
  // "lasagne", "lasagne sheets"]) — before any fallback below runs.
  const food = await resolveFoodDetail(foodSlug, port);
  if (!food) {
    // COMP-DET2 — the evidence-linked graph has never heard of this food, but THA's own
    // Food Knowledge Encyclopedia might (it is a separate owner, keyed by the same slugs).
    // Checked BEFORE the honest gap so a caller never gets "I don't know" when THA's own
    // editorial content already answers the question.
    const encyclopedia = await port.getEncyclopediaEntry(foodSlug);
    if (encyclopedia) return buildEncyclopediaExplainResult(encyclopedia);
    // COMP-DET6 — the slug itself may be a category/plural term ("legumes") rather than
    // any single food's own slug; a unified search over the SAME registry can still find
    // real individual foods it belongs to. Tried last, after the two more specific owners.
    const searched = await port.searchKnowledgeRegistry(foodSlug.replace(/-/g, " "));
    if (searched.foods.length > 0) return buildCategorySearchExplainResult(foodSlug.replace(/-/g, " "), searched.foods);
    throw gap(
      `Honest gap: the Nutrition / Knowledge owner has no food recorded for slug ${JSON.stringify(foodSlug)}. ` +
        "The Intelligence Platform will not fabricate benefits for an unknown food.",
    );
  }
  // Resolved via alias (e.g. "lasagne" → "pasta") — every lookup below must use the
  // food's OWN slug, not the caller's search term, or getFoodBenefitsForDisplay etc.
  // would look up benefits for a slug that was never the real key.
  foodSlug = food.food.slug;

  // The owner's source-gated benefit descriptions for this food (evidence signal already stripped).
  const linked = await port.getFoodBenefitsForDisplay(foodSlug);

  // Check diet compatibility for food-based results
  const dietCompatibility = userId ? await checkFoodCompatibility(food.food.name, userId) : undefined;

  if (benefitSlug != null) {
    const match = linked.find((b) => b.benefit.slug === benefitSlug);
    if (!match) {
      throw gap(
        `Honest gap: the Nutrition / Knowledge owner does not link benefit ${JSON.stringify(benefitSlug)} to ` +
          `"${food.food.name}". The Intelligence Platform will not fabricate a health benefit or an ` +
          "unsupported food↔benefit claim.",
      );
    }
    // Build deterministicAnswer including diet compatibility info if present
    const baseBenefitAnswer = buildFoodBenefitDeterministicAnswer(
      food.food.name,
      match.benefit.name,
      match.confidence,
      match.sourceRefs,
    );
    const benefitDeterministicAnswer = dietCompatibility && !dietCompatibility.compatible
      ? `${baseBenefitAnswer} However, ${dietCompatibility.explanation}`
      : dietCompatibility && dietCompatibility.compatible
      ? `${baseBenefitAnswer} ${dietCompatibility.explanation}`
      : baseBenefitAnswer;

    return {
      scope: "food-benefit",
      foodSlug: food.food.slug,
      foodName: food.food.name,
      benefits: [{
        slug: match.benefit.slug,
        name: match.benefit.name,
        description: match.benefit.description,
        confidence: toDisplayConfidence(match.confidence),
        sourceRefs: match.sourceRefs.map(toCitationView),
      }],
      source: "nutrition-knowledge-registry",
      note: GROUNDED_NOTE,
      deterministicAnswer: benefitDeterministicAnswer,
      ...(dietCompatibility && { dietCompatibility }),
    };
  }

  // Food alone → all its owner-linked benefits with grounded descriptions + citations.
  if (linked.length === 0) {
    // COMP-DET2 — same encyclopedia fallback: the food exists in the registry but the
    // evidence-linked benefit chain is empty for it (an honest gap in THAT owner, not
    // necessarily in THA's knowledge as a whole).
    const encyclopedia = await port.getEncyclopediaEntry(foodSlug);
    if (encyclopedia) return buildEncyclopediaExplainResult(encyclopedia);
    // 2026-11-21 — last honest fallback before a gap: the food's OWN registry description
    // (see buildFoodDescriptionExplainResult doc comment). Only used when it actually holds
    // text; an empty/null description is still an honest gap, not a fabricated summary.
    if (food.food.description) {
      return buildFoodDescriptionExplainResult(
        { slug: food.food.slug, name: food.food.name, description: food.food.description },
        dietCompatibility,
      );
    }
    throw gap(
      `Honest gap: the Nutrition / Knowledge owner records no health benefits for "${food.food.name}". ` +
        "The Intelligence Platform will not invent one.",
    );
  }

  // Build deterministicAnswer including diet compatibility info if present
  const baseBenefitsAnswer = buildFoodBenefitsDeterministicAnswer(food.food.name, linked);
  const deterministicAnswer = dietCompatibility && !dietCompatibility.compatible
    ? `${baseBenefitsAnswer} However, ${dietCompatibility.explanation}`
    : dietCompatibility && dietCompatibility.compatible
    ? `${baseBenefitsAnswer} ${dietCompatibility.explanation}`
    : baseBenefitsAnswer;

  return {
    scope: "food-benefits",
    foodSlug: food.food.slug,
    foodName: food.food.name,
    benefits: linked.map((b) => ({
      slug: b.benefit.slug,
      name: b.benefit.name,
      description: b.benefit.description,
      confidence: toDisplayConfidence(b.confidence),
      sourceRefs: b.sourceRefs.map(toCitationView),
    })),
    source: "nutrition-knowledge-registry",
    note: GROUNDED_NOTE,
    deterministicAnswer,
    ...(dietCompatibility && { dietCompatibility }),
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the Nutrition / Knowledge read-only handler. `resolvePort` provides the owning-
 * service surface (production: the real registry; tests: an in-memory owner). The returned
 * handler is what the Capability Registry binds to the `nutrition-knowledge` capability (INT4).
 */
export function createNutritionKnowledgeReadHandler(
  resolvePort: () => Promise<NutritionKnowledgeReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding. `read`, `explain` and `search` delegate to the owner. The remaining
    // allow-listed verbs (`analyse`, `compare`, `report`) have NO safe grounded owner read in
    // this binding's scope, so they are honest gaps — the platform never fabricates an
    // analysis, a comparison judgement, or a user-specific report.
    //
    // Port is resolved inside each executable verb case only (not for gap-returning verbs),
    // preserving the original behaviour that gap verbs never trigger owner resolution.
    const userId = context.userId ? parseInt(context.userId, 10) : undefined;
    switch (intent.verb) {
      case "read":
        return handleRead(intent, await resolvePort(), userId);
      case "search":
        return handleSearch(intent, await resolvePort(), userId);
      case "explain":
        return handleExplain(intent, await resolvePort(), userId);
      case "analyse":
        throw new CapabilityExecutionError(
          "gap",
          "Honest gap: the Nutrition / Knowledge owner exposes no grounded analysis read to this " +
            "binding. The Intelligence Platform will not compute or fabricate a nutrition analysis — " +
            "analysis/scoring is owned by the Nutrition / Knowledge and Analyser services.",
          intent.verb,
        );
      case "compare":
        throw new CapabilityExecutionError(
          "gap",
          "Honest gap: the Nutrition / Knowledge owner exposes no grounded food comparison read. The " +
            "Intelligence Platform will not fabricate a comparison or a judgement between foods; read " +
            'each food individually ({ verb: "read", scope: "food" }) for grounded facts.',
          intent.verb,
        );
      case "report":
        throw new CapabilityExecutionError(
          "gap",
          "Honest gap: a user-specific nutrition report (e.g. the nutrition centre summary) is " +
            "diary-linked and out of this read-only general-knowledge binding's scope. The Intelligence " +
            "Platform will not fabricate one; it remains owned by the Nutrition / Knowledge owner.",
          intent.verb,
        );
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Nutrition / Knowledge is bound to the Intelligence Platform read-only (INT4): "${intent.verb}" ` +
            "is not executable via the platform. The Nutrition / Knowledge service remains the sole owner " +
            "of all nutrition facts, health knowledge and any write/ingestion operation.",
          intent.verb,
        );
    }
  };
}
