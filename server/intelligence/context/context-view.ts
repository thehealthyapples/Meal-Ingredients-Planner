/**
 * INT17 — Context Views
 * =====================
 *
 * A **Context View** is the projection of a capability's Full Result into the
 * evidence the language model can actually use. It is the input contract of the
 * Context Composition Engine, and nothing else.
 *
 *     Full Result   →  UI, reports, downstream capabilities, TurnResult
 *     Context View  →  the LLM, and ONLY via the Context Composition Engine
 *
 * WHERE CONTEXT VIEWS LIVE (and why they live there for now)
 * ----------------------------------------------------------
 * The governing target state is that every capability exposes its own Context
 * View alongside its Full Result. That is a change to twenty-three capabilities.
 * INT17 does not make it, because INT17's scope forbids changing capability
 * ownership.
 *
 * Instead a Context View is DERIVED from the Full Result, here, by:
 *
 *   1. a registered `ContextViewSpec` — declarative DATA, no logic — when the
 *      payload's shape is known and its redundancies can be named; or
 *   2. a generic derivation over the payload's natural structure otherwise.
 *
 * Both produce the same `ContextView`. The engine cannot tell them apart, so
 * migrating a capability to own its Context View later is a pure move: delete
 * its spec here, add a `contextView()` to the capability, change nothing in the
 * engine. This file is the seam that makes that migration a non-event.
 *
 * WHAT A DERIVATION MUST NEVER DO
 * -------------------------------
 * Inherited directly from the Companion Platform's hard invariant
 * (THA_COMPANION_PLATFORM_ARCHITECTURE.md §0), and from INT16's:
 *
 *     A Context View may change HOW MUCH of an already-true fact the model is
 *     shown, and in WHAT SHAPE. It may never change WHAT IS TRUE, invent a
 *     fact, re-rank a capability's judgement, or hide an omission.
 *
 * Concretely:
 *   - `result` is READ-ONLY. Nothing here mutates it. The Full Result continues
 *     to flow to `TurnResult.outcome`, `opportunity-delivery`'s adapter, reports
 *     and UI, byte-for-byte unchanged.
 *   - An `id` is never dropped, never clipped, never synthesised. A truncated id
 *     is a plausible id for a DIFFERENT entity.
 *   - Provenance (`owningDomain`, `source`, `evidence[].source`) is harvested,
 *     never discarded — the engine is required to preserve it.
 *   - No I/O. No Capability Registry reference. No business rule. Pure functions.
 *
 * Determinism: no `Date.now()`, no `Math.random()`, no iteration over unordered
 * containers. Same Full Result in → byte-identical Context View out, forever.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** One field of a payload, addressed by dot-path, with its verbatim value. */
export interface ViewField {
  readonly path: string;
  readonly value: unknown;
}

/**
 * One piece of evidence the model may be shown: a single item from a
 * capability's collection, carrying its canonical id and its provenance.
 */
export interface ContextEvidence {
  /** The item's canonical entity id, verbatim from the Full Result. `null` when it has none. */
  readonly id: string | number | null;
  /** Cross-capability identity, for duplicate removal. Never shown to the model. */
  readonly dedupeKey: string;
  /** The value of the collection's balance dimension for this item (e.g. `type`). */
  readonly group: string;
  /** The item's emitted fields, verbatim. Ids present. */
  readonly fields: Record<string, unknown>;
  /** Payload-native origins (`owningDomain`, `evidence[].source`, …). Never invented. */
  readonly origins: readonly string[];
  /** The capability's OWN ranking of this item. The tiebreak that preserves its judgement. */
  readonly order: number;
  /** All string content, lowercased — the substrate for intent-relevance scoring. */
  readonly text: string;
}

export interface ContextCollection {
  readonly name: string;
  /** Every item the capability produced, before any selection. */
  readonly total: number;
  /** Every distinct group the capability produced, before any selection. */
  readonly groupsTotal: number;
  /** Groups in the capability's own first-appearance order. */
  readonly groups: readonly { readonly key: string; readonly items: readonly ContextEvidence[] }[];
}

export interface ContextView {
  readonly capabilityId: string;
  readonly verb: string;
  /**
   * Fields that are ALWAYS emitted, whatever the intent and whatever the budget.
   *
   * These are CONSTRAINTS, not answers: the dietary pattern, the recorded
   * restrictions, the excluded ingredients. HARD RULE 2 forbids the model from
   * claiming a food suits a condition without a source; the benchmark's G2 gate
   * fires when a dietary hard constraint is breached. A constraint that is
   * outbid by a token budget is a constraint the model cannot honour.
   *
   * Pinned fields are emitted EVEN WHEN EMPTY. `"dietRestrictions": []` tells the
   * model "none are recorded"; an absent key tells it nothing, and HARD RULE 3
   * then requires it to say it does not know. Absence and emptiness are not the
   * same fact, and only pinning can say so.
   */
  readonly pinned: readonly ViewField[];
  /** Every other leaf field. Relevance-ranked and budget-bounded by the engine. */
  readonly scalars: readonly ViewField[];
  readonly collections: readonly ContextCollection[];
  /** Section-level provenance harvested from the payload. Never invented. */
  readonly origins: readonly string[];
  /** `JSON.stringify(result).length` — what the payload actually cost. */
  readonly rawChars: number;
}

// ---------------------------------------------------------------------------
// The registry: declarative DATA, not logic
// ---------------------------------------------------------------------------

export interface CollectionViewSpec {
  /** Key on the Full Result holding an array of objects. */
  readonly name: string;
  /** Field whose distinct values define the balance dimension. Omit to auto-detect. */
  readonly groupBy?: string;
  /** Fields kept per item, in this order. Omit to keep every non-empty field. */
  readonly keep?: readonly string[];
}

export interface ContextViewSpec {
  /** Dot-paths always emitted. See `ContextView.pinned` for why this exists. */
  readonly pinned?: readonly string[];
  readonly collections?: readonly CollectionViewSpec[];
}

/**
 * Keyed `${capabilityId}:${verb}`. **The single canonical owner of every Context
 * View in THA.** Nothing else — no capability, no handler, no gateway, no
 * Workbench — may define, override, or shadow a view registered here.
 *
 * A spec is a *statement about redundancy and constraint in a known payload
 * shape*. It is not a business rule: it cannot add a fact, reorder a
 * capability's ranking, or change what any field means. Each entry is justified
 * against the module that owns the payload.
 *
 * THREE THINGS A SPEC MAY SAY, AND NOTHING ELSE
 * ---------------------------------------------
 *   `pinned`      — this path is a CONSTRAINT: emit it always, even empty, even
 *                   at a starvation budget. Reserved for facts whose absence
 *                   lets the model state a falsehood (a dietary restriction; an
 *                   owner's own "this total is not an estimate" caveat).
 *   `collections[].groupBy`
 *                 — this field is the collection's BALANCE DIMENSION (a kind),
 *                   never its ranking. Declared only where the generic
 *                   `pickGroupField` cannot see it and every item carries it.
 *   `collections[].keep`
 *                 — this is the field ALLOWLIST for one collection's ROWS. Its
 *                   second, quieter job is a safety property the generic path
 *                   cannot offer: a field added to a row type tomorrow cannot
 *                   silently reach the language model. Verified: adding `email`
 *                   to `HouseholdMemberView` reaches the model under the generic
 *                   derivation and does not under the native view.
 *
 *                   It bounds ROWS ONLY. A new TOP-LEVEL scalar on a Full Result
 *                   still flows to the engine as a leaf and still competes for
 *                   budget — `keep` cannot see it. What keeps a join secret out
 *                   of the prompt is the handler's own projection (`household`'s
 *                   Capability Card excludes `inviteCode` at the source), not
 *                   this registry. Do not mistake `keep` for a redaction layer.
 *
 * A `keep` list is the UNION across the verb's scopes. `deriveContextView` skips
 * a collection whose key is absent and a field whose value is empty, so one
 * entry serves every scope a verb can return without a scope-keyed registry
 * (`meals:read` alone returns three different top-level shapes).
 *
 * NOT PINNING IS A DECISION TOO. `pinned` makes `SectionBuilder.rankedScalars()`
 * drop every zero-relevance leaf — a capability that has declared its core is
 * taken at its word. A spec that pins nothing therefore behaves, for scalars,
 * exactly as the generic path did: everything competes and the budget alone
 * decides. That is the conservative default, and it is why only `profile`,
 * `shopping` (basket) and `household` (dietary-context) pin anything.
 *
 * -- INT17 ------------------------------------------------------------------
 *
 * `profile:read` — the largest single consumer of prompt budget in the platform.
 *    Measured over the 100-question benchmark corpus: `profile:read` is injected
 *    into 90 of 100 prompts (85 of them as a *baseline* read, not because the
 *    user asked about their profile) at 1,484 chars each — **50.4% of all
 *    CONTEXT DATA bytes the platform emits**. Most of that is plumbing the model
 *    can never use: `emailVerified`, `subscriptionExpiresAt`, `lastLoginAt`,
 *    `soundEnabled`, `barcodeScannerEnabled`, `profilePhotoUrl`, `isDemo`.
 *
 *    What the model must ALWAYS see is the user's dietary constraints — those
 *    are pinned. Everything else competes for budget on intent relevance, so
 *    `weightKg` reaches a weight question and `calorieTarget` reaches a calorie
 *    question, and neither reaches "what's on my shopping list?".
 *
 *    Nothing is dropped from the Full Result. The Profile capability is unchanged.
 *
 * `food-intelligence:report` — `FoodOpportunity` (opportunity-engine.ts:113-129):
 *    A priority-sorted array of 10 opportunities across 3 types. `type` is the
 *    balance dimension (NOT `priority`, which is a ranking — grouping by it would
 *    reproduce the exact priority-prefix bias this engine exists to remove).
 *    `owningDomain` and `evidence[].source` are provenance and are preserved.
 *    `evidence[].detail` is IDENTICAL across all seven `planner-empty-day` items
 *    in the real payload; the engine's duplicate removal hoists it once rather
 *    than paying for it seven times.
 *
 * -- NCV1 -------------------------------------------------------------------
 *
 * `meals:read` — `meals-read-handler.ts`. Three shapes behind one verb:
 *    `scope=list` → `meals[MealView]`, `scope=summary` → `meals[MealSummaryView]`,
 *    `scope=detail` → `meal{}` + `items[MealItemView]`. `keep` is their union.
 *
 *    `groupBy: "mealSourceType"` is the whole point. The generic path picks
 *    `kind` (first match in `GENERIC_GROUP_FIELDS`), whose values are `meal` and
 *    `drink` — a distinction no meal-quality question asks about. `mealSourceType`
 *    (scratch / ready meal / …) is the kind CB-017 ("least processed or most
 *    whole-food based?") and CB-022 ("which meals need better ingredient or
 *    nutrition data?") actually ask about, and it seats one meal per source type
 *    before any source type takes a second.
 *
 *    Measured on the INT19 §4 P2 payload: the two ready-meal rows that answer
 *    CB-022 (ids 2151, 2139, both `ingredientCount: 0`) sit late in a payload
 *    whose leading rows are all `scratch`. Under `kind` they are ordinary members
 *    of the `meal` group and no lexical token reaches them, so neither is ever
 *    seated. Under `mealSourceType`, `2151` is the `ready_meal` group's own
 *    representative and enters the guaranteed core — including on the crowded
 *    turn where `nutrition-knowledge:read scope=foods` co-resides. Relevance is
 *    not what fixes this and could not be: the engine may never displace a
 *    capability's own top item (§4.1). Naming the right balance dimension is.
 *
 *    Dropped, and why each is lossless: `userId` (the caller's own id, repeated
 *    on every row), `categoryId` (an opaque foreign key — no category NAME reaches
 *    the model, so it cannot be resolved or cited), `sourceUrl` (not an entity
 *    reference and never cited), `isFreezerEligible` (no question in the corpus
 *    reads it). `imageUrl` and `createdAt` were already dropped by `NOISE_FIELDS`.
 *    `ingredients` and `instructions` are KEPT: `scope=list` and `scope=detail`
 *    carry them and CB-018 ("which meals include salmon?") is answerable only
 *    from them.
 *
 * `meals:search` — `MealSearchView` (a deliberately lightweight projection: no
 *    ingredients, no instructions). It has no `mealSourceType`, so `groupBy` is
 *    omitted and the generic detector picks `kind` — which is the correct balance
 *    dimension for this shape. `keep` drops nothing; the spec exists so the search
 *    projection is an allowlist rather than an inference.
 *
 * `planner:read` — `planner-read-handler.ts`. `scope=week` → `days[PlannerDayView]`,
 *    each day carrying its own `meals[PlannerMealView]`; `scope=day` → `meals[]`.
 *
 *    **NO `groupBy`, and the reason is the most useful thing NCV1 learned.**
 *
 *    `groupBy: "dayOfWeek"` is the obvious declaration — seven groups, one day
 *    each, the whole week in the guaranteed core. It was implemented, measured,
 *    and reverted.
 *
 *    **A balance dimension must name a KIND that several rows SHARE.** `dayOfWeek`
 *    has exactly one row per value, so declaring it degenerates every mechanism
 *    that rests on it:
 *
 *      · `_context.days.groups` becomes `{"0":1,"1":1,…,"6":1}` — one entry per
 *        row, stating nothing the rows do not, and inviting the model to read the
 *        `1` as a meal count rather than a day count. Compare `food-intelligence`,
 *        where `{"planner-empty-day":7}` is true and useful precisely because
 *        seven opportunities really do share one type.
 *      · The balance guarantee becomes "print every row" — the thing a budget
 *        exists to prevent. Round 0 is bounded only by the 1,800-char section
 *        ceiling, never by the token budget.
 *
 *    Measured deterministically against the benchmark household's real planner
 *    state — a week of seven EMPTY days, each emitting a bare `{dayId, dayOfWeek}`
 *    because the emptiness rule drops `meals: []` — composed beside `pantry` and
 *    `food-intelligence` at the production budget:
 *
 *        with groupBy    planner 7 rows / 360 chars    pantry 4 of 6 items
 *        without         planner 5 rows / 222 chars    pantry 5 of 6 items
 *
 *    Note what did NOT happen, because the first draft of this note asserted it
 *    and the measurement refuted it: **no capability lost its guaranteed core.**
 *    The Milk and restriction-conflict evidence reached the model either way; the
 *    balance guarantee held exactly as designed, because round 0 is guaranteed per
 *    capability. This is not §8 item 7's core displacement. The cost is seven rows
 *    asserting a day with no meals, a degenerate `_context`, and one pantry item
 *    of discretionary budget.
 *
 *    On the 100-question corpus the declaration scored PL-023 at 74.3 in 3 of 3
 *    runs, against 81.8 in 6 of 6 runs without it, across two different live-world
 *    states. Consistent, not conclusive: `single-world` mode runs against a live
 *    household, and that household drifted mid-session.
 *
 *    So `days` keeps its single generic group and this spec states only its field
 *    allowlist. Naming planner's balance dimension is a real question — `mealType`
 *    over a full week is the candidate — deferred to a workstream that can measure
 *    it against a household whose planner is not empty.
 *
 * `shopping:read` — `shopping-read-handler.ts`. `scope=list` → `items` + `extras`,
 *    `scope=unresolved` → `items` (with two extra review fields), `scope=basket` →
 *    `pricedItems` + `unpricedItems`.
 *
 *    NO `groupBy` is declared. `category` is nullable on `ShoppingItemView`, and a
 *    declared `groupBy` over a nullable field labels the null rows `"all"` — a group
 *    name that reads to the model like "everything". The generic detector already
 *    picks `category` when every row has one and declines when they do not, which
 *    is exactly the honest behaviour. Declaring it would only make the mixed case
 *    worse.
 *
 *    The pins are `scope=basket`'s and exist for one measured reason.
 *    `totalMatchedPrice` is a sum of prices the Shopping owner already stored;
 *    `note` is the owner's own statement that it estimates nothing, may span
 *    stores, and excludes the unpriced and unresolved items counted beside it.
 *
 *    On a realistic four-capability turn at the production budget (`shopping` +
 *    `pantry` + `food-intelligence` + a baseline `profile`), the generic view emits
 *    the priced ROWS — `[2.50]` — and drops `totalMatchedPrice`, `currency`, `note`
 *    and all three counts. A model shown prices and no total must either decline or
 *    add them up itself, and it is told nothing about the six unpriced and five
 *    unresolved items excluded from the figure it would produce. Under the native
 *    view all six survive at every budget, down to a starvation budget of 1 token.
 *
 *    Generic retention of `note` is worse than absent — it is an accident. Measured
 *    in isolation at 260 tokens, `note` alone survives, and only because its text
 *    contains the word "Shopping", which the utterance also contained: a lexical
 *    coincidence scoring it 2 while every other scalar scores 0. An honesty caveat
 *    that reaches the model when the question happens to rhyme with it is not a
 *    caveat. That is what a pin is for (§4.8), and it is why `currency` and the
 *    three counts are pinned beside it rather than left to compete.
 *
 *    None of these paths exist in `scope=list` or `scope=unresolved`, so those
 *    scopes pin nothing and compose exactly as they did generically.
 *
 * `household:read` — `household-read-handler.ts`. `scope=household` →
 *    `members[HouseholdMemberView]`, `scope=dietary-context` → `members[]` (a
 *    DIFFERENT shape, from `storage.ts`'s `HouseholdDietaryContext`) + `aggregated{}`,
 *    `scope=eaters` → `eaters[HouseholdEaterView]`. `keep` is the union over both
 *    `members` shapes.
 *
 *    The three `aggregated.*` pins are the household's hard dietary constraints —
 *    the same class of fact as `profile.dietRestrictions`, governed by HARD RULE 2
 *    and the benchmark's G2 gate, and emitted even when empty because "none are
 *    recorded" and "not recorded" are different facts. They resolve only under
 *    `scope=dietary-context`; under the other two scopes this spec pins nothing.
 *
 *    Measured, `dietary-context` injected as a baseline read on a busy turn
 *    (`meals` + `food-intelligence`, production budget), household restrictions
 *    `["Gluten","Peanut"]`: the generic view emits neither `unionRestrictions` nor
 *    `unionExclusions` — outbid, being zero-relevance scalars on a dinner question —
 *    and the only restriction reaching the model is `Gluten`, surviving incidentally
 *    inside the one member row the balance guarantee happened to seat. `Peanut` does
 *    not reach the model at all. A household hard restriction that a token budget can
 *    outbid is a restriction the Companion cannot honour; the pins end that.
 *
 *    No `groupBy`: households are small, and declaring one would replace the
 *    single-group `Infinity` item cap with `GROUP_ITEM_CAP`, silently bounding how
 *    many members a large household may show. `eaters` is auto-detected on `kind`
 *    (`user` / `child`) by the generic detector already. `keep` drops no field the
 *    handler surfaces today; it is the row allowlist that keeps the next one from
 *    reaching the prompt unreviewed.
 */
export const CONTEXT_VIEW_SPECS: Readonly<Record<string, ContextViewSpec>> = {
  "profile:read": {
    pinned: [
      "scope",
      "profile.id",
      "profile.dietPattern",
      "profile.dietRestrictions",
      "preferences.dietTypes",
      "preferences.excludedIngredients",
      "preferences.healthGoals",
    ],
  },
  "food-intelligence:report": {
    collections: [
      {
        name: "opportunities",
        groupBy: "type",
        keep: ["id", "type", "priority", "owningDomain", "explanation", "suggestedAction", "evidence"],
      },
    ],
  },
  "meals:read": {
    collections: [
      {
        name: "meals",
        groupBy: "mealSourceType",
        keep: [
          "id", "name", "mealSourceType", "isReadyMeal", "isSystemMeal", "kind",
          "mealFormat", "audience", "dietTypes", "ingredientCount", "servings",
          "isDrink", "drinkType", "ingredients", "instructions",
        ],
      },
      // `scope=detail` only. `meal` itself is a plain object and flows to the
      // engine as scalars, ranked against the utterance like any other leaf.
      { name: "items", groupBy: "type", keep: ["id", "type", "referenceId", "name", "quantity"] },
    ],
  },
  "meals:search": {
    collections: [
      {
        name: "meals",
        keep: ["id", "name", "kind", "mealFormat", "dietTypes", "servings", "isSystemMeal"],
      },
    ],
  },
  "planner:read": {
    collections: [
      // No `groupBy` on either collection: an empty planner day is not evidence, and
      // a balance dimension that seats rows carrying none spends the core on nothing.
      // See the note above — this was measured, not assumed.
      { name: "days", keep: ["dayId", "dayOfWeek", "meals"] },
      // `scope=day` only.
      { name: "meals", keep: ["entryId", "mealId", "mealName", "mealType", "audience", "isDrink"] },
    ],
  },
  "shopping:read": {
    pinned: [
      "matchedItemCount",
      "pricedItemCount",
      "unresolvedItemCount",
      "totalMatchedPrice",
      "currency",
      "note",
    ],
    collections: [
      {
        name: "items",
        keep: [
          "id", "name", "quantity", "unit", "category", "checked",
          "resolutionState", "shopStatus", "needsReview", "reviewReason",
          "hasMatch", "matchedStore", "matchedPrice", "confidenceLevel", "confidenceReason",
        ],
      },
      { name: "extras", keep: ["id", "name", "category", "alwaysAdd", "inBasket"] },
      { name: "pricedItems", keep: ["id", "name", "matchedStore", "matchedPrice"] },
      { name: "unpricedItems", keep: ["id", "name"] },
    ],
  },
  "household:read": {
    pinned: [
      "aggregated.unionDietTypes",
      "aggregated.unionRestrictions",
      "aggregated.unionExclusions",
    ],
    collections: [
      {
        name: "members",
        keep: [
          "userId", "displayName", "role", "status",
          "dietTypes", "dietRestrictions", "excludedIngredients",
        ],
      },
      { name: "eaters", keep: ["id", "displayName", "kind", "userId", "defaultDietTypes", "hardRestrictions"] },
    ],
  },
};

/**
 * The registered Context View keys, `${capabilityId}:${verb}`, sorted.
 *
 * The registry is the canonical owner of Context Views, so it — and only it —
 * answers the question "is this view native?". The Observation Engine's capture
 * point (`conversation-gateway.ts`) asks; nothing else may keep its own list.
 */
export const NATIVE_CONTEXT_VIEW_KEYS: readonly string[] =
  Object.keys(CONTEXT_VIEW_SPECS).sort();

/**
 * Does this `(capability, verb)` have a **native** Context View — one the payload's
 * owner has declared — rather than a generic derivation over its natural structure?
 *
 * TELEMETRY ONLY. The Context Composition Engine never calls this and never branches
 * on it: a spec-derived view and a generically-derived view are the same `ContextView`
 * and the engine cannot tell them apart (INT17 §2.1). That indistinguishability is what
 * makes the eventual migration to capability-owned `contextView()` a pure move, and it
 * is deliberately preserved here — the fact is read at the *capture point*, to be
 * recorded, never inside composition, to be acted on.
 */
export function hasNativeContextView(capabilityId: string, verb: string): boolean {
  return `${capabilityId}:${verb}` in CONTEXT_VIEW_SPECS;
}

// ---------------------------------------------------------------------------
// Generic structural conventions (shape, never meaning)
// ---------------------------------------------------------------------------

/**
 * Candidate balance dimensions for the generic path, most-natural first.
 *
 * `priority` and `status` are deliberately LAST: they are rankings, not kinds.
 * Grouping by a ranking reproduces the priority-prefix bias.
 */
const GENERIC_GROUP_FIELDS = [
  "type", "category", "kind", "owningDomain", "domain", "scope", "group", "status", "priority",
] as const;

/** Fields that carry no information the model can use. Dropping them is lossless. */
const NOISE_FIELDS = new Set([
  "createdAt", "updatedAt", "deletedAt", "lastLoginAt", "lastSeenAt",
  "profilePhotoUrl", "photoUrl", "imageUrl", "avatarUrl",
]);

/** Fields whose value IS provenance. Harvested, and never dropped as redundant. */
const PROVENANCE_FIELDS = new Set(["source", "sources", "owningDomain", "domain", "provider"]);

const MAX_SCALAR_DEPTH = 3;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** An array of objects — the only thing that can be balanced, grouped, or deduplicated. */
export function asItems(value: unknown): Record<string, unknown>[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  return value.every(isPlainObject) ? (value as Record<string, unknown>[]) : null;
}

export const isIdField = (field: string): boolean => field === "id" || /[a-z]Id$/.test(field);

/**
 * A field the model may legitimately cite as an entity reference.
 *
 * `slug` belongs here and its absence was a real defect: HARD RULE 5 permits the
 * model to reference an entity only when it can see a real id, and a food's
 * canonical id IS its slug (`{"type":"food","id":"allspice"}`). `slug` is also
 * usually a normalisation of `name` — `"Active Dry Yeast"` → `"active-dry-yeast"` —
 * so the generic redundant-string rule would happily delete it as "already
 * present in a longer string", silently removing the only thing that made the
 * food citable. Entity references are never redundant.
 */
export const isEntityRefField = (field: string): boolean => isIdField(field) || field === "slug";

export function isEmptyValue(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  if (isPlainObject(v)) return Object.keys(v).length === 0;
  return false;
}

/** A leaf: a scalar, or an array/object we will not descend into further. */
function isLeaf(v: unknown, depth: number): boolean {
  if (v == null) return true;
  if (typeof v !== "object") return true;
  if (Array.isArray(v)) return asItems(v) === null || depth >= MAX_SCALAR_DEPTH;
  return depth >= MAX_SCALAR_DEPTH;
}

export function getPath(root: unknown, path: string): unknown {
  let node: unknown = root;
  for (const part of path.split(".")) {
    if (!isPlainObject(node)) return undefined;
    node = node[part];
  }
  return node;
}

/** Rebuild a nested object from dot-path fields, in the order given. Deterministic. */
export function setPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!isPlainObject(node[part])) node[part] = {};
    node = node[part] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/** Every string reachable in a value, lowercased and joined. The relevance substrate. */
function collectText(v: unknown, out: string[]): void {
  if (typeof v === "string") { out.push(v.toLowerCase()); return; }
  if (Array.isArray(v)) { for (const x of v) collectText(x, out); return; }
  if (isPlainObject(v)) { for (const x of Object.values(v)) collectText(x, out); }
}

// ---------------------------------------------------------------------------
// Provenance harvesting — generic, over shape
// ---------------------------------------------------------------------------

/**
 * Pull every origin the payload states about itself. Never invents one.
 *
 * Recognised, in the order they appear: `owningDomain`/`domain`, `source`,
 * `sources[]`, and `evidence[].source` — the shapes THA's capabilities actually
 * use (`FoodOpportunity`, `FoodOpportunityEvidence`, handler `source` literals).
 */
function harvestOrigins(node: Record<string, unknown>): string[] {
  const origins: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim() !== "" && !origins.includes(v)) origins.push(v);
  };
  push(node.owningDomain);
  push(node.domain);
  push(node.source);
  if (Array.isArray(node.sources)) for (const s of node.sources) push(s);
  if (Array.isArray(node.evidence)) {
    for (const e of node.evidence) if (isPlainObject(e)) push(e.source);
  }
  return origins;
}

// ---------------------------------------------------------------------------
// Duplicate removal WITHIN one item
// ---------------------------------------------------------------------------

/**
 * Drop a string field whose content is already fully present in a longer string
 * field of the SAME item.
 *
 * This is duplicate *evidence*, not duplicate *provenance*: a `source` label is
 * never dropped, and an id is never dropped. The retained field is always the
 * longer one, so nothing the model could have read is lost — the dropped string
 * is, by construction, a substring of a string it still sees.
 *
 * Deterministic: candidates are considered in (length desc, path asc) order, so
 * the retained set never depends on object key iteration.
 */
function dropContainedStrings(fields: Record<string, unknown>): Record<string, unknown> {
  const strings: Array<{ key: string; norm: string }> = [];
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v !== "string" || isEntityRefField(k) || PROVENANCE_FIELDS.has(k)) continue;
    if (v.length < 12) continue;
    strings.push({ key: k, norm: v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() });
  }
  if (strings.length < 2) return fields;

  strings.sort((a, b) => b.norm.length - a.norm.length || (a.key < b.key ? -1 : 1));
  const retained: string[] = [];
  const dropped = new Set<string>();
  for (const s of strings) {
    if (retained.some(r => r.includes(s.norm))) dropped.add(s.key);
    else retained.push(s.norm);
  }
  if (dropped.size === 0) return fields;

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) if (!dropped.has(k)) out[k] = v;
  return out;
}

// ---------------------------------------------------------------------------
// Grouping
// ---------------------------------------------------------------------------

/**
 * Distinct-value ceiling for a candidate balance dimension.
 *
 * A field with more distinct values than this is an identifier, not a kind —
 * grouping by `slug` (611 distinct) balances nothing. The ceiling is well above
 * `MAX_GROUPS_SHOWN`: `nutrition-knowledge:read scope=foods` carries 611 foods
 * across **40** categories, and grouping by category then seating the first eight
 * gives the model eight genuinely different foods where alphabetical order gave
 * it four kinds of nothing. The engine declares the 32 categories it withheld.
 */
const MAX_GROUP_CARDINALITY = 48;

function pickGroupField(items: Record<string, unknown>[]): string | null {
  for (const field of GENERIC_GROUP_FIELDS) {
    const values = new Set<string>();
    let present = 0;
    for (const item of items) {
      const v = item[field];
      if (typeof v === "string" || typeof v === "number") { present++; values.add(String(v)); }
      if (values.size > MAX_GROUP_CARDINALITY) break;
    }
    if (present === items.length && values.size >= 2 && values.size <= MAX_GROUP_CARDINALITY) return field;
  }
  return null;
}

/**
 * Identity of a piece of evidence, for duplicate removal.
 *
 * Two items are the same evidence when they carry the same human name AND the
 * same entity id. Ids are namespace-stripped first, because a discovery sibling
 * namespaces what its owning capability does not: `meal-discovery` returns
 * `id: "personal:1794"` with `internalId: 1794` for the meal `meals:read` calls
 * `id: 1794`. Without stripping, the same meal is emitted twice.
 *
 * An item with no id falls back to a fingerprint of its emitted content, which is
 * exactly the condition under which two id-less items ARE the same evidence.
 *
 * Note this key is necessary but NOT sufficient to merge: the engine additionally
 * requires the two capabilities to be an owner/discovery pair, so a meal named
 * "Peas" can never be merged with a pantry item named "Peas". See
 * `sameEntityFamily` in the engine.
 */
const ID_BEARING_FIELDS = ["id", "internalId", "slug"] as const;

function dedupeKeyFor(fields: Record<string, unknown>): string {
  const ids = new Set<string>();
  for (const field of ID_BEARING_FIELDS) {
    const v = fields[field];
    if (typeof v === "string" || typeof v === "number") {
      ids.add(String(v).split(":").pop()!);
    }
  }
  const name = ["name", "title", "label", "slug", "explanation"]
    .map(k => fields[k])
    .find(v => typeof v === "string") as string | undefined;

  if (ids.size === 0) return `fp:${JSON.stringify(fields)}`;
  const idPart = Array.from(ids).sort().join("|");
  return `id:${idPart}|${(name ?? "").toLowerCase().trim()}`;
}

// ---------------------------------------------------------------------------
// Derivation
// ---------------------------------------------------------------------------

function buildEvidence(
  item: Record<string, unknown>,
  keep: readonly string[] | undefined,
  groupBy: string | null,
  order: number,
): ContextEvidence {
  const fieldNames = keep && keep.length > 0 ? keep : Object.keys(item);
  let fields: Record<string, unknown> = {};
  for (const name of fieldNames) {
    if (NOISE_FIELDS.has(name)) continue;
    const value = item[name];
    // An entity reference is emitted even when the generic emptiness rule would drop it.
    if (isEmptyValue(value) && !isEntityRefField(name)) continue;
    fields[name] = value;
  }
  fields = dropContainedStrings(fields);

  const rawId = item.id;
  const id = typeof rawId === "string" || typeof rawId === "number" ? rawId : null;
  const group = groupBy != null && (typeof item[groupBy] === "string" || typeof item[groupBy] === "number")
    ? String(item[groupBy])
    : "all";

  const textParts: string[] = [];
  collectText(fields, textParts);

  return {
    id,
    dedupeKey: dedupeKeyFor(fields),
    group,
    fields,
    origins: harvestOrigins(item),
    order,
    text: textParts.join(" "),
  };
}

/**
 * Derive the Context View of one capability's Full Result.
 *
 * `result` is never mutated, never retained, never returned by reference.
 */
export function deriveContextView(capabilityId: string, verb: string, result: unknown): ContextView {
  const rawChars = JSON.stringify(result)?.length ?? 0;
  const spec = CONTEXT_VIEW_SPECS[`${capabilityId}:${verb}`];

  const empty: ContextView = {
    capabilityId, verb, pinned: [], scalars: [], collections: [], origins: [], rawChars,
  };

  // A non-object payload (a bare string, number, array of scalars) has no view to
  // derive. It is carried as a single scalar leaf and budgeted like any other.
  if (!isPlainObject(result)) {
    if (result == null) return empty;
    const textParts: string[] = [];
    collectText(result, textParts);
    return { ...empty, scalars: [{ path: "value", value: result }] };
  }

  // Which top-level keys are collections?
  const declared = spec?.collections?.filter(c => asItems(result[c.name]) !== null) ?? null;
  const collectionSpecs: CollectionViewSpec[] = declared && declared.length > 0
    ? [...declared]
    : Object.keys(result).filter(k => asItems(result[k]) !== null).map(name => ({ name }));
  const collectionNames = new Set(collectionSpecs.map(c => c.name));

  const collections: ContextCollection[] = collectionSpecs.map(cs => {
    const items = asItems(result[cs.name])!;
    const groupBy = cs.groupBy ?? pickGroupField(items);
    const evidence = items.map((item, i) => buildEvidence(item, cs.keep, groupBy, i));

    // First-appearance order preserves the capability's own ranking of its TOP
    // item across groups, while never starving the groups that follow it.
    const order: string[] = [];
    const byGroup = new Map<string, ContextEvidence[]>();
    for (const e of evidence) {
      if (!byGroup.has(e.group)) { byGroup.set(e.group, []); order.push(e.group); }
      byGroup.get(e.group)!.push(e);
    }
    return {
      name: cs.name,
      total: items.length,
      groupsTotal: order.length,
      groups: order.map(key => ({ key, items: byGroup.get(key)! })),
    };
  });

  // Pinned fields, in declared order. Emitted even when empty (see `ContextView.pinned`).
  const pinnedPaths = spec?.pinned ?? [];
  const pinned: ViewField[] = [];
  for (const path of pinnedPaths) {
    const value = getPath(result, path);
    if (value !== undefined) pinned.push({ path, value });
  }
  const pinnedSet = new Set(pinnedPaths);

  // Every remaining leaf, flattened to a dot-path so the engine can rank it.
  const scalars: ViewField[] = [];
  const walk = (node: Record<string, unknown>, prefix: string, depth: number): void => {
    for (const [key, value] of Object.entries(node)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (depth === 0 && collectionNames.has(key)) continue;
      if (pinnedSet.has(path)) continue;
      if (NOISE_FIELDS.has(key)) continue;
      if (isEmptyValue(value)) continue;
      if (isLeaf(value, depth)) { scalars.push({ path, value }); continue; }
      if (isPlainObject(value)) { walk(value, path, depth + 1); continue; }
      scalars.push({ path, value });
    }
  };
  walk(result, "", 0);

  return {
    capabilityId,
    verb,
    pinned,
    scalars,
    collections,
    origins: harvestOrigins(result),
    rawChars,
  };
}
