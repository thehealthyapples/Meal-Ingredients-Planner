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
 * Keyed `${capabilityId}:${verb}`.
 *
 * A spec is a *statement about redundancy and constraint in a known payload
 * shape*. It is not a business rule: it cannot add a fact, reorder a
 * capability's ranking, or change what any field means. Each entry is justified
 * against the module that owns the payload.
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
};

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
