/**
 * INT17 — The Context Composition Engine
 * ======================================
 *
 * THE SINGLE OWNER OF EVERY BYTE THE LANGUAGE MODEL READS AS GROUNDING.
 *
 * One engine. One budget. One place where "what does the model get to see?" is
 * decided. Before INT17 that decision was three separate accidents:
 *
 *   1. `JSON.stringify(result).slice(0, 1800) + "… [truncated]"` — per capability,
 *      cutting mid-object so the model received syntactically INVALID JSON, and
 *      spending the whole allowance on the first group of a priority-sorted array.
 *   2. No global budget at all. A four-capability turn paid 4 × 1,800 chars, and
 *      nothing anywhere knew the total.
 *   3. Section order taken from a `Map` populated inside `Promise.all` — i.e.
 *      capability COMPLETION order. The same question produced different prompts
 *      on different runs, and nothing was deterministic downstream of that.
 *
 * WHAT THE ENGINE GUARANTEES
 * --------------------------
 * Each of these is a property of the emitted text, verified offline, not a hope:
 *
 *   RELEVANCE     Evidence is selected against the user's intent, using only
 *                 signals an owner already computed (resolver confidence, routed
 *                 vs. baseline) plus lexical overlap. No semantics, no LLM.
 *   BALANCE       Every contributing capability, and every group within it, is
 *                 seated before any capability or group takes a second item.
 *                 A byte prefix of a priority-sorted array cannot do this at any
 *                 budget; this is what INT16 proved and this engine inherits.
 *   DE-DUPLICATED The same entity returned by two capabilities is emitted once,
 *                 and the second capability is named on it (`alsoIn`). Fields
 *                 identical across every item of a group are stated once
 *                 (`shared`). A string already contained in a longer string of
 *                 the same item is dropped.
 *   ENTITIES      An `id` is never clipped, never dropped, never invented.
 *   PROVENANCE    `owningDomain`, `source`, `evidence[].source` always survive —
 *                 relocated for economy, never discarded.
 *   BUDGETED      A configurable TOKEN budget bounds the whole CONTEXT DATA
 *                 block. The pre-existing per-capability 1,800-char ceiling is
 *                 retained, unchanged, as a hard sub-ceiling.
 *   DETERMINISTIC No clock, no randomness, no unordered iteration. Same inputs →
 *                 byte-identical output, always.
 *   STRUCTURED    Valid JSON per section. Never a free-text summary. (INT16
 *                 measured the alternative: a pipe-delimited table was ~20%
 *                 smaller and cost answer quality — the model cites `"id":1385`
 *                 far more reliably than a positional cell. Size is worth having,
 *                 but not at the cost of the answer.)
 *   HONEST        Everything withheld is declared in `_context`. Nothing is
 *                 silently absent.
 *
 * WHAT THE ENGINE MUST NEVER DO
 * -----------------------------
 * Inherited from THA_COMPANION_PLATFORM_ARCHITECTURE.md §0:
 *
 *     This layer may change HOW MUCH of an already-true fact the model is shown,
 *     and in WHAT SHAPE. It may never change WHAT IS TRUE, invent a fact,
 *     re-rank a capability's judgement, or hide an omission.
 *
 *   - It performs NO I/O and holds NO reference to the Capability Registry.
 *   - It NEVER mutates a Full Result. `outcome.result` continues to flow, intact,
 *     to `TurnResult`, to `opportunity-delivery`'s adapter, and to every report
 *     and UI surface. The engine's output is a PROMPT STRING and nothing else.
 *   - It owns no business logic. A capability's ranking is the tiebreak whenever
 *     relevance cannot separate two items, so the capability's judgement wins by
 *     default rather than by exception.
 *   - It never raises the per-capability ceiling. `CAPABILITY_CONTEXT_BUDGET_CHARS`
 *     is the same 1,800 the gateway has always used. Reduction comes from shape,
 *     relevance and de-duplication — never from a bigger allowance.
 */

import {
  deriveContextView,
  isEntityRefField,
  setPath,
  type ContextEvidence,
  type ContextView,
  type ViewField,
} from "./context-view.js";
import {
  capabilityRelevance,
  contentTokens,
  evidenceRelevance,
  fieldRelevance,
} from "./context-relevance.js";

// ---------------------------------------------------------------------------
// Budget
// ---------------------------------------------------------------------------

/**
 * Per-capability character ceiling for one CONTEXT DATA section.
 *
 * Deliberately IDENTICAL to the pre-INT16 `CAP_DATA_MAX_CHARS`, and to INT16's
 * `CAPABILITY_CONTEXT_BUDGET_CHARS`. INT17's remit is to fit more *meaning* under
 * this ceiling and to bound the SUM of sections, not to enlarge either. Raising
 * this number is an explicitly rejected alternative.
 */
export const CAPABILITY_CONTEXT_BUDGET_CHARS = 1_800;

/**
 * Chars per token, for the deterministic estimator.
 *
 * Not a guess. Calibrated against INT16's exact `prompt_tokens` measurements from
 * gpt-4o-mini — the companion's production model — over the real 100-question
 * corpus: 103,341 chars → 29,675 tokens (3.483) and 99,879 chars → 28,295 tokens
 * (3.530). JSON grounding context runs ~3.5 chars/token. Rounding DOWN would
 * under-estimate the spend and overrun the budget, so 3.5 is used and the
 * estimate is rounded up.
 */
export const CHARS_PER_TOKEN = 3.5;

/**
 * Default token budget for the WHOLE CONTEXT DATA block, all sections together.
 *
 * The pre-INT17 platform had no such number. It emitted, per turn, up to
 * `sections × 1,813` chars: a median of 3,080 and a maximum of 5,350 over the
 * benchmark corpus (~880 and ~1,530 tokens). This budget is a ceiling on the sum,
 * chosen so the median turn is unconstrained by it and the fat tail is bounded.
 *
 * Configurable per call. `Infinity` disables the global bound (the per-capability
 * ceiling still applies).
 */
export const CONTEXT_TOKEN_BUDGET = 600;

/**
 * Representativeness cap: the most items shown from any ONE group of a
 * MULTI-group collection.
 *
 * Past a few examples of the same category, further examples are repetition
 * rather than evidence — the real `food-intelligence:report` payload carries seven
 * `planner-empty-day` items that differ only by weekday. `_context` always states
 * the true total, so the model can still say "your whole week is empty" without
 * reading all seven.
 *
 * A collection with exactly ONE group is exempt. It has no siblings to be balanced
 * against, so a cap there only hides data — `nutrition-knowledge:search` returns a
 * single, already-relevance-ranked list, and capping it at four would discard
 * evidence the capability had itself selected. Budget alone bounds it.
 */
const GROUP_ITEM_CAP = 4;

/**
 * The most groups seated from one collection.
 *
 * The balance guarantee is bounded by arithmetic, not by intent:
 * `nutrition-knowledge:read scope=foods` returns 611 foods across 14+ categories
 * in ~40,700 chars. At any sane budget there is no rendering in which every
 * category carries a real example. So seat the first `MAX_GROUPS_SHOWN` in the
 * capability's own order and DECLARE the remainder by count.
 */
const MAX_GROUPS_SHOWN = 8;

/** Underscore-prefixed: metadata about the context, never capability data. */
const CONTEXT_KEY = "_context";

const CLIP_MARKER = "… [clipped]";

export function estimateTokens(chars: number): number {
  return Math.ceil(chars / CHARS_PER_TOKEN);
}

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

/** One capability's Full Result, plus the resolver's own view of why it is here. */
export interface CompositionCapability {
  readonly capabilityId: string;
  readonly verb: string;
  /** The Full Result. READ-ONLY — the engine never mutates or retains it. */
  readonly result: unknown;
  /** The Intent Resolver's confidence in this route, 0..1. */
  readonly confidence: number;
  /** True when this capability was injected by surface context, not by the utterance. */
  readonly baseline: boolean;
}

/** A supplementary knowledge item (COMP6 enrichment). Not a Context View. */
export interface CompositionEnrichment {
  readonly title: string;
  readonly body: string;
}

export interface CompositionRequest {
  /** The user's utterance. The only intent signal the engine reads. */
  readonly utterance: string;
  /** Contributing capabilities, in the resolver's order. */
  readonly capabilities: readonly CompositionCapability[];
  readonly enrichment?: readonly CompositionEnrichment[];
  /** Token ceiling for the whole block. Default `CONTEXT_TOKEN_BUDGET`. */
  readonly tokenBudget?: number;
  /** Hard per-section char ceiling. Default (and maximum) `CAPABILITY_CONTEXT_BUDGET_CHARS`. */
  readonly perCapabilityCharCeiling?: number;
}

export interface CapabilityCompositionMetrics {
  readonly capabilityId: string;
  readonly verb: string;
  readonly baseline: boolean;
  readonly relevance: number;
  readonly rawChars: number;
  /** What the pre-INT17 gateway would have emitted for this capability. */
  readonly legacyChars: number;
  readonly composedChars: number;
  readonly charCeiling: number;
  readonly itemsTotal: number;
  readonly itemsShown: number;
  readonly groupsTotal: number;
  /** Groups with at least one item in the prompt. The balance guarantee. */
  readonly groupsShown: number;
  readonly fieldsShown: number;
  readonly fieldsOmitted: number;
  readonly entityIds: number;
  readonly wellFormed: boolean;
}

export interface CompositionMetrics {
  readonly tokenBudget: number;
  readonly estimatedTokens: number;
  /**
   * True when the GUARANTEED CORE (pinned constraints + one item per group per
   * capability) alone exceeded the token budget. Reported, never hidden: the
   * balance guarantee outranks the budget, and a turn that had to spend more than
   * it was given should say so rather than quietly drop a category of evidence.
   */
  readonly budgetExceeded: boolean;
  readonly chars: number;
  /** Chars the pre-INT17 gateway would have emitted for the same turn. */
  readonly legacyChars: number;
  readonly legacyEstimatedTokens: number;
  readonly sections: number;
  readonly evidenceTotal: number;
  readonly evidenceShown: number;
  /** Evidence items removed because another capability already supplied them. */
  readonly duplicatesRemoved: number;
  /** Field values stated once per group instead of once per item. */
  readonly sharedFieldsHoisted: number;
  /** Distinct canonical entity ids reaching the model. */
  readonly entityIds: number;
  readonly capabilitiesContributing: number;
  /** MUST equal `capabilitiesContributing`. The cross-capability balance guarantee. */
  readonly capabilitiesRepresented: number;
  readonly enrichmentTotal: number;
  readonly enrichmentShown: number;
  /** True when every emitted section is parseable JSON within its ceiling. */
  readonly wellFormed: boolean;
  readonly perCapability: readonly CapabilityCompositionMetrics[];
}

export interface ComposedContext {
  /** The CONTEXT DATA block, verbatim, ready for the prompt. */
  readonly text: string;
  /**
   * The clauses the prompt must add so the model reads `_context` correctly.
   * Empty when nothing was withheld, hoisted or de-duplicated — a turn whose
   * capabilities all fit reads exactly the prompt it read before INT17.
   */
  readonly formatNote: string;
  readonly metrics: CompositionMetrics;
}

// ---------------------------------------------------------------------------
// Internal working types
// ---------------------------------------------------------------------------

interface RankedCapability {
  readonly input: CompositionCapability;
  readonly view: ContextView;
  readonly relevance: number;
  /** Resolver order. The stable tiebreak — never a Map's iteration order. */
  readonly index: number;
  charCeiling: number;
}

interface Candidate {
  readonly cap: RankedCapability;
  readonly collection: string;
  readonly group: string;
  readonly evidence: ContextEvidence;
  readonly score: number;
  /** Rank of this item WITHIN its group, by relevance. Drives the round-robin. */
  round: number;
  /** `GROUP_ITEM_CAP`, or unbounded for a single-group collection. */
  readonly itemCap: number;
  alsoIn: string[];
}

const jsonLen = (v: unknown): number => JSON.stringify(v)?.length ?? 0;

/** Deep value equality, by canonical JSON. Sufficient for payload leaves. */
const sameValue = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/**
 * May two capabilities' evidence be merged when it shares a name and an id?
 *
 * ONLY a capability and its own discovery sibling. This is the platform's own
 * structural pairing — `conversation-gateway.ts` already prefers the owning
 * capability over its `-discovery` sibling when choosing `primaryOutcome`, on the
 * grounds that the owner is the Source-of-Truth owner of the same data.
 *
 * Without this restriction a name+id match could merge a MEAL called "Peas" with
 * a PANTRY ITEM called "Peas", and the surviving row's `alsoIn` would assert a
 * provenance that is not true. Merging is only safe where the two capabilities
 * are, by construction, describing the same entity.
 */
const DISCOVERY_SUFFIX = "-discovery";

/**
 * The domain a capability id belongs to.
 *
 * The registry's owner/discovery pairs are not a clean suffix relation — the
 * owner of `meal-discovery` is `meals` (depluralised), and the owner of
 * `nutrition-discovery` is `nutrition-knowledge` (a different second segment). The
 * stable part is the FIRST hyphen segment, singularised.
 */
function domainStem(id: string): string {
  const base = id.endsWith(DISCOVERY_SUFFIX) ? id.slice(0, -DISCOVERY_SUFFIX.length) : id;
  return base.split("-")[0].replace(/s$/, "");
}

function sameEntityFamily(a: string, b: string): boolean {
  if (a === b) return true;
  const aDiscovery = a.endsWith(DISCOVERY_SUFFIX);
  const bDiscovery = b.endsWith(DISCOVERY_SUFFIX);
  // Two owners, or two discovery capabilities, describe different entities even
  // when a name and an id happen to coincide. Only an owner and ITS OWN discovery
  // sibling are, by construction, describing the same thing.
  if (aDiscovery === bDiscovery) return false;
  return domainStem(a) === domainStem(b);
}

// ---------------------------------------------------------------------------
// Clipping — the last resort, and the only place a value is ever shortened
// ---------------------------------------------------------------------------

/**
 * Clip the longest string anywhere in a section until it fits, never touching an
 * id and never touching `_context` (the honesty block).
 *
 * Needed because dropping items cannot rescue a section whose single surviving
 * item is itself larger than the ceiling — `meals:read scope=detail` can carry one
 * recipe with a 5,000-character instruction list. Clipping a value keeps the JSON
 * valid and MARKS the clip, neither of which `slice()` could do.
 */
function clipDeep(payload: Record<string, unknown>, ceiling: number): Record<string, unknown> {
  const clone = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;

  const findLongest = (): { set: (v: string) => void; value: string } | null => {
    let best: { set: (v: string) => void; value: string } | null = null;
    const consider = (v: string, set: (s: string) => void) => {
      if (!best || v.length > best.value.length) best = { set, value: v };
    };
    const walk = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach((v, i) => {
          if (typeof v === "string") consider(v, s => { (node as unknown[])[i] = s; });
          else walk(v);
        });
        return;
      }
      if (node !== null && typeof node === "object") {
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
          if (k === CONTEXT_KEY || isEntityRefField(k)) continue;
          if (typeof v === "string") consider(v, s => { (node as Record<string, unknown>)[k] = s; });
          else walk(v);
        }
      }
    };
    walk(clone);
    return best;
  };

  for (let guard = 0; guard < 200 && jsonLen(clone) > ceiling; guard++) {
    const target = findLongest();
    if (!target || target.value.length <= CLIP_MARKER.length + 8) break;
    const over = jsonLen(clone) - ceiling;
    const keep = Math.max(8, target.value.length - over - CLIP_MARKER.length);
    target.set(target.value.slice(0, keep) + CLIP_MARKER);
  }
  return clone;
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

export function composeContext(request: CompositionRequest): ComposedContext {
  const tokenBudget = request.tokenBudget ?? CONTEXT_TOKEN_BUDGET;
  const perCapCeiling = Math.min(
    request.perCapabilityCharCeiling ?? CAPABILITY_CONTEXT_BUDGET_CHARS,
    CAPABILITY_CONTEXT_BUDGET_CHARS, // never raised, whatever the caller asks
  );
  const charBudget = Number.isFinite(tokenBudget) ? tokenBudget * CHARS_PER_TOKEN : Infinity;
  const utteranceTokens = contentTokens(request.utterance);

  // ---- PHASE 1 · DERIVE ----------------------------------------------------
  // Full Result → Context View. Nothing is mutated; nothing is retained.
  const ranked: RankedCapability[] = request.capabilities.map((input, index) => ({
    input,
    view: deriveContextView(input.capabilityId, input.verb, input.result),
    relevance: capabilityRelevance(input.confidence, input.baseline),
    index,
    charCeiling: perCapCeiling,
  }));

  const legacyChars = ranked.reduce(
    (n, c) =>
      n + Math.min(c.view.rawChars, perCapCeiling + "… [truncated]".length) +
      `### ${c.input.capabilityId}\n`.length + 2,
    0,
  );

  if (ranked.length === 0) {
    return emptyResult(tokenBudget, legacyChars, request.enrichment?.length ?? 0);
  }

  // ---- PHASE 2 · RANK ------------------------------------------------------
  // Utterance-routed capabilities outrank surface baselines. Ties break on the
  // resolver's order, never on a Map's insertion order — this is what makes the
  // whole composition deterministic.
  const order = [...ranked].sort((a, b) => b.relevance - a.relevance || a.index - b.index);

  // ---- PHASE 4 · CANDIDATES + CROSS-CAPABILITY DE-DUPLICATION --------------
  // Walk capabilities in RANK order so the most relevant capability wins an
  // entity, and the losers are recorded on it rather than deleted from history.
  const seen = new Map<string, Candidate>();
  const candidates: Candidate[] = [];
  let duplicatesRemoved = 0;

  for (const cap of order) {
    for (const collection of cap.view.collections) {
      const itemCap = collection.groupsTotal === 1 ? Infinity : GROUP_ITEM_CAP;
      for (const group of collection.groups.slice(0, MAX_GROUPS_SHOWN)) {
        // THE CAPABILITY'S OWN TOP ITEM IS ALWAYS THE GROUP'S REPRESENTATIVE.
        //
        // Lexical relevance orders the ADDITIONAL examples; it never chooses the
        // first one. This is not conservatism for its own sake — it is the only
        // way this module can honour its own contract ("it can ORDER evidence the
        // capability already ranked; it may never re-rank the capability's
        // judgement") when a surface-token match is wrong.
        //
        // Measured: "Which meals are the LEAST PROCESSED or most whole-food based?"
        // Every content token is a food word. Scoring by overlap promoted "Whole
        // Milk" (matches "whole") and "Cow & Gate Baby Food" (matches "food") over
        // the scratch-cooked porridge the question is actually about — and the model,
        // shown only ultra-processed products, cited nothing. Lexical relevance has
        // no way to know that "whole-food based" is a concept rather than two words.
        //
        // So the engine can ADD relevant evidence and ADD missing groups. It can
        // never show a WORSE first example than the byte prefix it replaced.
        const scored = group.items
          .map(evidence => ({
            evidence,
            score: cap.relevance + evidenceRelevance(evidence.text, utteranceTokens),
          }))
          .sort((a, b) => b.score - a.score || a.evidence.order - b.evidence.order);

        const representative = group.items.reduce((best, e) => (e.order < best.order ? e : best));
        const ordered = [
          { evidence: representative, score: cap.relevance + evidenceRelevance(representative.text, utteranceTokens) },
          ...scored.filter(x => x.evidence !== representative),
        ];

        let round = 0;
        for (const { evidence, score } of ordered) {
          const prior = seen.get(evidence.dedupeKey);
          if (prior && sameEntityFamily(prior.cap.input.capabilityId, cap.input.capabilityId)) {
            if (!prior.alsoIn.includes(cap.input.capabilityId)) prior.alsoIn.push(cap.input.capabilityId);
            duplicatesRemoved++;
            continue;
          }
          const candidate: Candidate = {
            cap, collection: collection.name, group: group.key, evidence, score,
            round: round++, itemCap, alsoIn: [],
          };
          if (!prior) seen.set(evidence.dedupeKey, candidate);
          candidates.push(candidate);
        }
      }
    }
  }

  // ---- PHASE 5 · SELECT ----------------------------------------------------
  //
  // THE BALANCE GUARANTEE. Round 0 seats one item from every group of every
  // capability before round 1 seats anyone's second. A payload whose every group
  // is non-empty therefore yields a prompt whose every group is non-empty — the
  // property a byte prefix of a priority-sorted array cannot have at any budget.
  //
  // Rounds 1+ are filled in global relevance order until the budget is spent.
  const selected = new Set<Candidate>();
  const roundZero = candidates.filter(c => c.round === 0);
  const laterRounds = candidates
    .filter(c => c.round > 0 && c.round < c.itemCap)
    .sort((a, b) => b.score - a.score || a.cap.index - b.cap.index || a.evidence.order - b.evidence.order);

  const sections = new Map<RankedCapability, SectionBuilder>();
  for (const cap of order) sections.set(cap, new SectionBuilder(cap, utteranceTokens));

  // Pinned constraints — always, for every capability, before anything competes.
  for (const cap of order) sections.get(cap)!.addPinned();

  let spent = ranked.reduce((n, c) => n + sections.get(c)!.chars(), 0);

  /**
   * Admit one item if the applicable ceilings hold.
   *
   * ROUND 0 IS THE GUARANTEED CORE and is bounded ONLY by the hard, unchanged
   * 1,800-char per-section ceiling — not by the turn's token budget, and not by
   * the capability's relevance-derived share.
   *
   * This is a deliberate ordering of two requirements that genuinely conflict.
   * "Balance evidence across contributing capabilities" and "respect a token
   * budget" cannot both hold when the budget is smaller than one item per group
   * per capability. A balance guarantee a budget can revoke is not a guarantee,
   * and revoking it is precisely the category-blindness this engine exists to
   * remove: it is how seven near-identical `planner-empty-day` rows deleted both
   * `shopping-restriction-conflict` and `pantry-item-unused-in-plan` from the
   * prompt (BENCH4 §5).
   *
   * So the budget binds everything discretionary — rounds 1+, and every scalar —
   * and `metrics.budgetExceeded` reports honestly when the core alone outgrew it.
   * The 1,800-char ceiling and `clipDeep` bound the core absolutely, so this
   * cannot run away.
   */
  const tryAdd = (c: Candidate, guaranteed: boolean): boolean => {
    const section = sections.get(c.cap)!;
    // A capability that produced grounding data must reach the model with at least
    // ONE piece of evidence. `meals:read scope=detail` can carry a single recipe
    // whose instruction list alone exceeds 1,800 chars; refusing it here would
    // silently delete the capability from the turn. `clipDeep` bounds it at emit —
    // valid JSON, ids intact, the clip declared. Bounding is honest; dropping is not.
    const firstEvidence = guaranteed && !section.hasEvidence();
    const before = section.chars();
    section.addEvidence(c);
    const after = section.chars();
    if (!firstEvidence) {
      const ceiling = guaranteed ? perCapCeiling : c.cap.charCeiling;
      const overGlobal = !guaranteed && spent - before + after > charBudget;
      if (after > ceiling || overGlobal) { section.undo(); return false; }
    }
    spent = spent - before + after;
    selected.add(c);
    return true;
  };

  const rankOf = new Map(order.map((c, i) => [c, i]));
  const zeroOrdered = [...roundZero].sort((a, b) =>
    rankOf.get(a.cap)! - rankOf.get(b.cap)! || a.evidence.order - b.evidence.order);
  for (const c of zeroOrdered) tryAdd(c, true);

  // ---- PHASE 5b · ALLOCATE THE DISCRETIONARY REMAINDER ---------------------
  //
  // The core is now seated and its true cost is known — it does not have to be
  // predicted. Whatever the budget has left is shared out in proportion to
  // relevance, so a baseline read the user never asked for cannot outspend the
  // capability that answers the question. A capability's ceiling is its OWN core
  // plus its share: relevance buys extra evidence, it never confiscates the core.
  const coreSpent = ranked.reduce((n, c) => n + sections.get(c)!.chars(), 0);
  const discretionary = Math.max(0, charBudget - coreSpent);
  const relevanceSum = order.reduce((n, c) => n + c.relevance, 0) || 1;
  for (const cap of order) {
    const share = Number.isFinite(discretionary) ? (cap.relevance / relevanceSum) * discretionary : Infinity;
    cap.charCeiling = Math.min(perCapCeiling, sections.get(cap)!.chars() + share);
  }
  spent = coreSpent;

  for (const c of laterRounds) tryAdd(c, false);

  // Scalars compete last, in relevance order, for whatever the evidence left.
  // A field that does not fit is skipped, not terminal: the next field down is
  // usually smaller, and a 12-char `heightCm` should not be locked out by a
  // 400-char `instructions` that happened to score one point higher.
  for (const cap of order) {
    if (spent >= charBudget) break;
    const section = sections.get(cap)!;
    for (const field of section.rankedScalars()) {
      const before = section.chars();
      section.addScalar(field);
      const after = section.chars();
      if (after > cap.charCeiling || spent - before + after > charBudget) { section.undo(); continue; }
      spent = spent - before + after;
    }
  }

  // ---- PHASE 6 · EMIT ------------------------------------------------------
  let sharedFieldsHoisted = 0;
  const perCapability: CapabilityCompositionMetrics[] = [];
  const rendered: string[] = [];
  let wellFormed = true;
  let entityIds = 0;
  const allIds = new Set<string>();
  let evidenceShown = 0;
  let evidenceTotal = 0;
  let capabilitiesRepresented = 0;
  let anyOmission = false;
  let anyShared = false;
  let anyAlsoIn = false;
  const emittedText: string[] = [];

  // Sections are emitted in RESOLVER order, not rank order: the prompt's shape
  // stays stable across turns, and the model is not taught to read rank from
  // position. Selection used rank; presentation uses the platform's own order.
  for (const cap of ranked) {
    const section = sections.get(cap)!;
    const emitted = section.emit();
    sharedFieldsHoisted += emitted.hoisted;
    evidenceShown += emitted.itemsShown;
    evidenceTotal += emitted.itemsTotal;

    // A section carrying only `_context` tells the model nothing it can use. It is
    // not silently dropped: the capability produced no evidence that survived, and
    // `capabilitiesRepresented < capabilitiesContributing` records exactly that.
    const contributes = emitted.itemsShown > 0 || emitted.fieldsShown > 0;

    // Clip against the HARD 1,800-char ceiling, never against the relevance-derived
    // share. The share governs what a capability may ADD; it must not shred the
    // guaranteed core that was already, deliberately, admitted above it.
    let text = JSON.stringify(emitted.payload);
    if (text.length > perCapCeiling) text = JSON.stringify(clipDeep(emitted.payload, perCapCeiling));
    let parses = true;
    try { JSON.parse(text); } catch { parses = false; }

    if (contributes) {
      capabilitiesRepresented++;
      if (emitted.itemsOmitted) anyOmission = true;
      if (emitted.hoisted > 0) anyShared = true;
      if (emitted.alsoIn) anyAlsoIn = true;
      for (const id of emitted.ids) allIds.add(id);
      if (!parses) wellFormed = false;
      rendered.push(`### ${cap.input.capabilityId}\n${text}`);
      emittedText.push(text.toLowerCase());
    }

    perCapability.push({
      capabilityId: cap.input.capabilityId,
      verb: cap.input.verb,
      baseline: cap.input.baseline,
      relevance: cap.relevance,
      rawChars: cap.view.rawChars,
      legacyChars: Math.min(cap.view.rawChars, perCapCeiling + "… [truncated]".length),
      composedChars: contributes ? text.length : 0,
      charCeiling: Math.round(cap.charCeiling),
      itemsTotal: emitted.itemsTotal,
      itemsShown: emitted.itemsShown,
      groupsTotal: emitted.groupsTotal,
      groupsShown: emitted.groupsShown,
      fieldsShown: emitted.fieldsShown,
      fieldsOmitted: emitted.fieldsOmitted,
      entityIds: emitted.ids.length,
      wellFormed: !contributes || (parses && text.length <= perCapCeiling),
    });
  }
  entityIds = allIds.size;

  // ---- PHASE 7 · ENRICHMENT ------------------------------------------------
  // Not a Context View — supplementary knowledge (COMP6). It crosses the same
  // grounding boundary, so the engine budgets it and de-duplicates it against the
  // evidence already emitted, then hands it to the model under the label the
  // prompt's WEAVE ENRICHMENTS rule already binds to.
  const enrichmentTotal = request.enrichment?.length ?? 0;
  const enrichmentLines: string[] = [];
  const emittedBlob = emittedText.join(" ");
  for (const item of request.enrichment ?? []) {
    const line = `• ${item.title}: ${item.body}`;
    const norm = item.body.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (norm.length > 24 && emittedBlob.includes(norm)) { duplicatesRemoved++; continue; }
    if (spent + line.length + 1 > charBudget) break;
    enrichmentLines.push(line);
    spent += line.length + 1;
  }
  if (enrichmentLines.length > 0) {
    rendered.push(`### Related Context (enrichment)\n${enrichmentLines.join("\n")}`);
  }

  const text = rendered.join("\n\n");
  const formatNote = buildFormatNote(anyOmission, anyShared, anyAlsoIn);
  const formatNoteChars = formatNote.length;

  return {
    text,
    formatNote,
    metrics: {
      tokenBudget,
      estimatedTokens: estimateTokens(text.length + formatNoteChars),
      budgetExceeded: estimateTokens(text.length + formatNoteChars) > tokenBudget,
      chars: text.length,
      legacyChars,
      legacyEstimatedTokens: estimateTokens(legacyChars),
      sections: rendered.length,
      evidenceTotal,
      evidenceShown,
      duplicatesRemoved,
      sharedFieldsHoisted,
      entityIds,
      capabilitiesContributing: ranked.length,
      capabilitiesRepresented,
      enrichmentTotal,
      enrichmentShown: enrichmentLines.length,
      wellFormed,
      perCapability,
    },
  };
}

// ---------------------------------------------------------------------------
// The format note — paid for only when it says something true about this turn
// ---------------------------------------------------------------------------

/**
 * INT16's single hard-won lesson, made structural.
 *
 * INT16 emitted one fixed 299-char note on every turn carrying a compacted
 * section. It cost 66 tokens and the compaction it explained saved ~28 — a NET
 * INCREASE of 1,854 prompt tokens across the corpus. The note was not optional
 * decoration (without it the model reports the number of items it can SEE rather
 * than the true `_context.total`, converting an honest compaction into a false
 * claim), so INT16 simply paid.
 *
 * INT17 pays only for the clauses this turn's context actually needs. A turn with
 * no omission, no hoisting and no de-duplication emits no note at all and reads
 * exactly the prompt it read before.
 */
function buildFormatNote(itemsOmitted: boolean, shared: boolean, alsoIn: boolean): string {
  const clauses: string[] = [];
  if (itemsOmitted) {
    // The second half of this clause is not decoration. Measured, on PL-025
    // ("What meals are missing from my plan?"): shown `_context.meals`
    // `{total:591, shown:4, omitted:{...582}}`, the model answered *"582 meals are
    // omitted from your current plan"* — reading an artefact of THIS COMPOSITION as
    // a fact about the user's planner. An omission is a statement about the context
    // block, never about the user's data, and the note must say so or the engine
    // manufactures false claims. (CPA1 §0: never change what is true.)
    clauses.push(
      `"_context" describes this block, not the user's data. "found" is how many items the capability returned and the listed rows are EXAMPLES of them. Cite "found", never the number of rows you can see, and never say the user lacks something merely because it is not listed. Every listed group is real evidence`,
    );
  }
  if (shared) clauses.push(`"shared" holds fields common to every item of that group`);
  if (alsoIn) clauses.push(`"alsoIn" names other capabilities that returned the same item`);
  if (clauses.length === 0) return "";
  // Deliberately NOT the literal string "CONTEXT DATA:" — that is the prompt's own
  // section header, and a second occurrence breaks anything that slices on it.
  return `- READING THE CONTEXT: ${clauses.join("; ")}.`;
}

function emptyResult(tokenBudget: number, legacyChars: number, enrichmentTotal: number): ComposedContext {
  return {
    text: "",
    formatNote: "",
    metrics: {
      tokenBudget, estimatedTokens: 0, budgetExceeded: false, chars: 0, legacyChars,
      legacyEstimatedTokens: estimateTokens(legacyChars),
      sections: 0, evidenceTotal: 0, evidenceShown: 0, duplicatesRemoved: 0,
      sharedFieldsHoisted: 0, entityIds: 0, capabilitiesContributing: 0,
      capabilitiesRepresented: 0, enrichmentTotal, enrichmentShown: 0,
      wellFormed: true, perCapability: [],
    },
  };
}

// ---------------------------------------------------------------------------
// SectionBuilder — one capability's section, built incrementally under a ceiling
// ---------------------------------------------------------------------------

interface EmittedSection {
  readonly payload: Record<string, unknown>;
  readonly itemsTotal: number;
  readonly itemsShown: number;
  readonly groupsTotal: number;
  readonly groupsShown: number;
  readonly fieldsShown: number;
  readonly fieldsOmitted: number;
  readonly ids: string[];
  readonly hoisted: number;
  /** A COLLECTION withheld items or groups. Only this needs explaining to the model. */
  readonly itemsOmitted: boolean;
  readonly alsoIn: boolean;
}

class SectionBuilder {
  private readonly pinnedFields: ViewField[] = [];
  private readonly scalarFields: ViewField[] = [];
  private readonly items = new Map<string, Candidate[]>(); // collection → chosen
  private lastUndo: (() => void) | null = null;

  constructor(
    private readonly cap: RankedCapability,
    private readonly utterance: Set<string>,
  ) {}

  addPinned(): void {
    for (const field of this.cap.view.pinned) this.pinnedFields.push(field);
  }

  /**
   * Non-pinned leaves, ordered by intent relevance. The capability's own payload
   * order is the tiebreak, so an unmatched payload keeps its natural shape.
   *
   * Provenance scalars (`source`, `sources`) are excluded: they are already
   * stated once, for the whole section, in `_context.sources`. Stating them twice
   * is the duplicate evidence this engine exists to remove.
   */
  /** Leaves whose value IS the section's provenance, already stated in `_context.sources`. */
  private relocatedToProvenance(field: ViewField): boolean {
    if (this.cap.view.origins.length === 0) return false;
    const leaf = field.path.split(".").pop()!;
    return leaf === "source" || leaf === "sources";
  }

  /**
   * Non-pinned leaves, ordered by intent relevance, filtered by whether the
   * capability declared a core.
   *
   * A capability with a registered Context View has STATED what the model always
   * needs (`pinned`). Everything else must earn its place: a leaf the utterance
   * does not touch is plumbing — `username`, `isBetaUser`, `soundEnabled`,
   * `barcodeScannerEnabled` — and a zero-relevance leaf is emitted only because
   * budget happened to remain. That is how an email address ends up in a prompt
   * about shopping lists.
   *
   * A capability with NO registered view has stated nothing, so the engine may not
   * assume any of its fields are irrelevant. Everything competes, ordered by
   * relevance, and the budget alone decides. Conservative by construction: an
   * unmigrated capability can only lose fields to the budget, never to a guess.
   */
  rankedScalars(): ViewField[] {
    const hasCore = this.cap.view.pinned.length > 0;
    return this.cap.view.scalars
      .filter(f => !this.relocatedToProvenance(f))
      .map((f, i) => ({ f, i, score: fieldRelevance(f.path, f.value, this.utterance) }))
      .filter(x => !hasCore || x.score > 0)
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .map(x => x.f);
  }

  /** Number of leaves that competed for budget — provenance did not, it was relocated. */
  private competingFieldCount(): number {
    return this.cap.view.pinned.length +
      this.cap.view.scalars.filter(f => !this.relocatedToProvenance(f)).length;
  }

  addScalar(field: ViewField): void {
    this.scalarFields.push(field);
    this.lastUndo = () => { this.scalarFields.pop(); };
  }

  hasEvidence(): boolean {
    return Array.from(this.items.values()).some(list => list.length > 0);
  }

  addEvidence(c: Candidate): void {
    const list = this.items.get(c.collection) ?? [];
    if (list.length === 0) this.items.set(c.collection, list);
    list.push(c);
    this.lastUndo = () => { list.pop(); };
  }

  undo(): void {
    this.lastUndo?.();
    this.lastUndo = null;
  }

  chars(): number {
    return jsonLen(this.emit().payload);
  }

  emit(): EmittedSection {
    const view = this.cap.view;
    const payload: Record<string, unknown> = {};
    const meta: Record<string, unknown> = { from: `${view.capabilityId}:${view.verb}` };
    if (view.origins.length > 0) meta.sources = view.origins;

    let hoisted = 0;
    let itemsTotal = 0;
    let itemsShown = 0;
    let groupsTotal = 0;
    let groupsShown = 0;
    let itemsOmitted = false;
    let alsoInPresent = false;
    const ids: string[] = [];

    // Fields. Pinned first (constraints), then admitted scalars — both rendered
    // in the payload's own path order so the model reads a familiar shape.
    const chosen = [...this.pinnedFields, ...this.scalarFields];
    const chosenPaths = new Set(chosen.map(f => f.path));
    const inPayloadOrder = [
      ...view.pinned.filter(f => chosenPaths.has(f.path)),
      ...view.scalars.filter(f => chosenPaths.has(f.path)),
    ];
    for (const field of inPayloadOrder) setPath(payload, field.path, field.value);

    const fieldsShown = inPayloadOrder.length;
    // NOTE: a withheld FIELD does not need explaining. `"fields":{"omitted":31}`
    // says exactly what it means, and there is no total for the model to mis-cite.
    // Only a withheld ITEM can make the model count rows and report a false total,
    // which is the one thing the format note exists to prevent.
    const fieldsOmitted = this.competingFieldCount() - fieldsShown;
    if (fieldsOmitted > 0) meta.fields = { omitted: fieldsOmitted };

    // Collections.
    for (const collection of view.collections) {
      itemsTotal += collection.total;
      groupsTotal += collection.groupsTotal;

      const chosenItems = this.items.get(collection.name) ?? [];
      if (chosenItems.length === 0) {
        if (collection.total > 0) {
          meta[collection.name] = { found: collection.total };
          itemsOmitted = true;
        }
        continue;
      }

      // DUPLICATE EVIDENCE: a field identical across EVERY item of a group (not
      // merely across the shown subset) is a property of the group, and is stated
      // once. `id` and the group discriminator always stay on the item, so every
      // row remains individually citable and joinable back to its group.
      const groupOf = new Map<string, ContextEvidence[]>();
      for (const g of collection.groups) groupOf.set(g.key, [...g.items]);

      const shared: Record<string, Record<string, unknown>> = {};
      const shownByGroup = new Map<string, Candidate[]>();
      for (const c of chosenItems) {
        const list = shownByGroup.get(c.group) ?? [];
        if (list.length === 0) shownByGroup.set(c.group, list);
        list.push(c);
      }

      for (const [groupKey, shown] of Array.from(shownByGroup.entries())) {
        const all = groupOf.get(groupKey) ?? [];
        // A group of one duplicates nothing. A group of many duplicates whatever is
        // constant across it — and hoisting that constant BEFORE a second row is
        // seated is what makes room for the second row. Provenance is the biggest
        // constant (`owningDomain`, the identical `evidence[]` block on all seven
        // `planner-empty-day` items), and it is exactly what must not be dropped:
        // hoisting is how the engine keeps it and still affords the evidence.
        if (all.length < 2) continue;
        const first = all[0]?.fields ?? {};
        const constant: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(first)) {
          if (isEntityRefField(k)) continue;
          if (all.every(e => k in e.fields && sameValue(e.fields[k], v))) {
            // Never hoist the group discriminator: the flat item array needs it.
            if (String(v) === groupKey) continue;
            constant[k] = v;
          }
        }
        if (Object.keys(constant).length === 0) continue;

        // Hoist ONLY when it removes bytes. Stating a constant once under a group
        // key costs the key; repeating it per row costs the row count. With one row
        // shown, the key is the more expensive of the two — and a rule that made the
        // context bigger while claiming to de-duplicate it would be a lie about
        // itself. Exact, deterministic, no heuristic.
        const inlineCost = shown.length *
          Object.entries(constant).reduce((n, [k, v]) => n + k.length + jsonLen(v) + 4, 0);
        const hoistCost = groupKey.length + jsonLen(constant) + 4;
        if (hoistCost >= inlineCost) continue;

        shared[groupKey] = constant;
        hoisted += Object.keys(constant).length * shown.length;
      }

      // Items, in the capability's own ranking order.
      const rows: Record<string, unknown>[] = [];
      const inOrder = [...chosenItems].sort((a, b) => a.evidence.order - b.evidence.order);
      for (const c of inOrder) {
        const row: Record<string, unknown> = {};
        const hoistedHere = shared[c.group] ?? {};
        for (const [k, v] of Object.entries(c.evidence.fields)) {
          if (k in hoistedHere) continue;
          row[k] = v;
        }
        if (c.alsoIn.length > 0) { row.alsoIn = c.alsoIn; alsoInPresent = true; }
        rows.push(row);
        const ref = c.evidence.id ?? (typeof c.evidence.fields.slug === "string" ? c.evidence.fields.slug : null);
        if (ref != null) ids.push(String(ref));
      }
      payload[collection.name] = rows;
      itemsShown += rows.length;
      groupsShown += shownByGroup.size;

      // `_context` STATES WHAT EXISTS. IT NEVER STATES WHAT THIS BLOCK WITHHELD.
      //
      // The difference is not cosmetic; it is the difference between a true
      // statement and a false one. Measured, on PL-025 ("What meals are missing
      // from my plan?"): emitting `{total:591, shown:4, omitted:{...}}` let the
      // model subtract — *"587 meals are not included in your plan"* — turning
      // bookkeeping about THIS COMPOSITION into a fabricated fact about the user's
      // planner. Neither 587 nor "not in your plan" came from any capability.
      //
      // `found` and the per-group counts say everything the model legitimately
      // needs: how many exist, and of what kinds. How many of them this block chose
      // to print is the engine's business, not the model's, and a number the model
      // can do arithmetic with is a number it will do arithmetic with.
      //
      // The rows are examples. `found` is the truth. Nothing is silently absent,
      // because `found` and `groups` are the capability's OWN totals — not this
      // block's — and the format note says the rows are examples of them.
      const entry: Record<string, unknown> = { found: collection.total };

      // `_context` must not cost more than the evidence it describes:
      // `nutrition-knowledge:read scope=foods` has 40 groups, and naming them all
      // cost ~1,400 chars to describe six items. Name only the groups the model can
      // SEE; account for the rest by count.
      const seatedGroups = collection.groups.slice(0, MAX_GROUPS_SHOWN);
      const hiddenGroups = collection.groups.slice(MAX_GROUPS_SHOWN);

      if (collection.groupsTotal > 1) {
        const counts: Record<string, number> = {};
        for (const g of seatedGroups) counts[g.key] = g.items.length;
        entry.groups = counts;
      }
      if (rows.length < collection.total) itemsOmitted = true;
      if (hiddenGroups.length > 0) {
        entry.moreGroups = hiddenGroups.length;
        entry.moreGroupItems = hiddenGroups.reduce((n, g) => n + g.items.length, 0);
        itemsOmitted = true;
      }
      if (Object.keys(shared).length > 0) entry.shared = shared;
      meta[collection.name] = entry;
    }

    // `_context` is written LAST and read FIRST: JSON.stringify emits insertion
    // order, and the model should meet the totals before the examples.
    const ordered: Record<string, unknown> = { [CONTEXT_KEY]: meta };
    for (const [k, v] of Object.entries(payload)) ordered[k] = v;

    return {
      payload: ordered,
      itemsTotal, itemsShown, groupsTotal, groupsShown,
      fieldsShown, fieldsOmitted, ids, hoisted, itemsOmitted, alsoIn: alsoInPresent,
    };
  }
}
