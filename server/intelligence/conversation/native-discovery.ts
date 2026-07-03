/**
 * native-discovery.ts — INT36 Native THA Discovery Responses
 * ==========================================================
 * When a discovery capability returns THA entities, the Intelligence Platform
 * should present and link to CANONICAL THA pages — never to external source
 * pages. This module is the conversation-layer vocabulary that turns a discovery
 * capability's honest result payload into a structured, client-agnostic
 * response following the standard THA pattern:
 *
 *     • Summary            — one honest line ("I found 5 meals matching …")
 *     • Canonical entities — THA meal / entity cards, each carrying a THA page
 *                            reference (ThaEntityRef), never an external URL
 *     • Available actions  — Open / Add to Planner / Add to Shopping / View All
 *
 * SCOPE DISCIPLINE (EWO-INT36):
 *   • No new assistant, no new state owner, no business logic, no duplicated
 *     state, no change to canonical ownership. This is pure PROJECTION over
 *     data the discovery capabilities already return — exactly like
 *     turn-fallback.ts is gateway vocabulary, not a new owner.
 *   • The conversation DISCOVERS content. THA pages OWN presentation. External
 *     sites own PROVENANCE only — so this module never emits a source website,
 *     an original recipe URL, or an external image. The only URL a card may
 *     carry is the meal's own canonical THA image (`imageUrl` on the meal row),
 *     which THA owns as part of the meal entity. Provenance (`sourceUrl`)
 *     lives exclusively on the THA Meal Detail read projection and is never
 *     surfaced here.
 *   • No fabrication. Every card field comes from a stored value on the
 *     discovery result. Optional canonical facts (Apple score, last cooked) are
 *     part of the card contract and are populated ONLY when a canonical source
 *     exposes them on the discovery item — never invented, never derived.
 *
 * CLIENT COMPATIBILITY (EWO-INT36 §6):
 *   Responses are structured canonical entities + refs, not presentation-
 *   specific markup, so Web, Mobile and future clients render them natively.
 *
 * GENERALITY (EWO-INT36 §7):
 *   `buildNativeDiscoveryResponse` is domain-agnostic. Meal discovery gets rich
 *   meal cards; every other discovery domain (Planner, Shopping, Pantry, Diary,
 *   Nutrition, Household) adopts the SAME pattern through the same code path with
 *   no per-domain code — driven entirely by the DISCOVERY_DOMAINS table.
 */

import type { EntityRef } from "./conversation-store.js";

// ---------------------------------------------------------------------------
// Public structured contract (client-agnostic)
// ---------------------------------------------------------------------------

/**
 * A canonical THA page reference. `type` names the THA entity/page (meal,
 * shopping_item, food, …); `id` is the canonical numeric id. This is the ONLY
 * kind of link a native discovery response emits — it always resolves to a THA
 * page, never to an external website.
 */
export interface ThaEntityRef {
  readonly type: string;
  readonly id: number;
}

/**
 * One canonical THA entity card. A single shape serves every domain so other
 * domains adopt the pattern without new card types:
 *   • kind "meal"   — rich meal card (title, THA image, servings, + optional
 *                     canonical facts) linking to the THA meal page.
 *   • kind "entity" — generic canonical card (title + optional subtitle)
 *                     linking to the domain's THA page.
 */
export interface ThaDiscoveryCard {
  readonly kind: "meal" | "entity";
  /** Canonical THA page reference — opens a THA page, never an external URL. */
  readonly ref: ThaEntityRef;
  readonly title: string;
  /** Secondary line (source label, category, week, …). Optional. */
  readonly subtitle?: string;
  // ── meal-card canonical fields (present only for kind "meal") ────────────
  /** The meal's own THA image, where available. Never an external source image. */
  readonly imageUrl?: string;
  readonly servings?: number;
  /** Apple score, when a canonical source exposes one. Never fabricated. */
  readonly appleScore?: number;
  /** Last-cooked marker, when a canonical source exposes one. Never fabricated. */
  readonly lastCooked?: string;
}

/**
 * One available action on a discovery response. `appliesTo` tells the client
 * whether the action targets a chosen card (`entity` → use `card.ref`) or the
 * whole result set (`results` → e.g. "View All", carrying the `query`).
 */
export interface DiscoveryAction {
  readonly kind: "open" | "add-to-planner" | "add-to-shopping" | "view-all";
  readonly label: string;
  readonly appliesTo: "entity" | "results";
  /** Present for "view-all": the query to re-run on the THA domain page. */
  readonly query?: string;
}

/** A complete native THA discovery response for one discovery domain. */
export interface NativeDiscoveryResponse {
  /** THA domain: "meal" | "planner" | "shopping" | "pantry" | "diary" | "nutrition" | "household". */
  readonly domain: string;
  /** Honest one-line summary of what was found. */
  readonly summary: string;
  /** Canonical THA entities — meal cards or generic entity cards. */
  readonly entities: readonly ThaDiscoveryCard[];
  /** Available actions for this response. */
  readonly actions: readonly DiscoveryAction[];
  /** Canonical THA refs flattened for turn traceability / pronoun resolution. */
  readonly entityRefs: readonly EntityRef[];
}

// ---------------------------------------------------------------------------
// Domain configuration — the single place a new discovery domain plugs in
// ---------------------------------------------------------------------------

interface DomainConfig {
  /** THA domain name surfaced on the response. */
  readonly domain: string;
  /** Canonical THA page type for each card's ref. */
  readonly refType: string;
  /** Singular / plural noun for the summary line. */
  readonly noun: string;
  readonly pluralNoun: string;
  /** Explicit numeric id field on the result item (falls back to composite id parse). */
  readonly idField?: string;
  /** When true, build rich meal cards (meal discovery only). */
  readonly mealCards?: boolean;
  /** Meal-only actions (Add to Planner / Add to Shopping) apply to this domain. */
  readonly mealActions?: boolean;
}

/**
 * Every live discovery capability's `source` value → its THA projection.
 * Adding a domain is one row here; no other code changes (EWO-INT36 §7).
 */
const DISCOVERY_DOMAINS: Readonly<Record<string, DomainConfig>> = {
  "meal-discovery":      { domain: "meal",      refType: "meal",             noun: "meal",             pluralNoun: "meals",             mealCards: true, mealActions: true },
  "planner-discovery":   { domain: "planner",   refType: "meal",             noun: "planned meal",     pluralNoun: "planned meals",     idField: "mealId" },
  "shopping-discovery":  { domain: "shopping",  refType: "shopping_item",    noun: "shopping item",    pluralNoun: "shopping items",    idField: "shoppingItemId" },
  "pantry-discovery":    { domain: "pantry",    refType: "pantry_item",      noun: "pantry item",      pluralNoun: "pantry items" },
  "diary-discovery":     { domain: "diary",     refType: "diary_entry",      noun: "diary entry",      pluralNoun: "diary entries",     idField: "diaryEntryId" },
  "nutrition-discovery": { domain: "nutrition", refType: "food",             noun: "food",             pluralNoun: "foods",             idField: "internalId" },
  "household-discovery": { domain: "household", refType: "household_member",  noun: "household member", pluralNoun: "household members", idField: "userId" },
};

/** Maximum cards surfaced in one response — the discovery capability already caps results. */
const MAX_CARDS = 15;

/** Title fields tried, in priority order, for a generic discovery item. */
const TITLE_KEYS = [
  "name", "title", "mealName", "foodName", "displayName", "productName", "weekName",
] as const;

/** Subtitle fields tried, in priority order, for a generic discovery item. */
const SUBTITLE_KEYS = ["sourceLabel", "category", "role", "mealType", "weekName"] as const;

// ---------------------------------------------------------------------------
// Discovery-result detection
// ---------------------------------------------------------------------------

/**
 * Is this handler result a discovery-capability payload we can project into a
 * native THA response? Recognised purely by the canonical `{ source: "*-discovery" }`
 * shape every discovery capability returns — no capability-id coupling.
 */
export function isDiscoveryResult(result: unknown): result is DiscoveryResultShape {
  if (result == null || typeof result !== "object") return false;
  const r = result as Record<string, unknown>;
  return (
    typeof r.source === "string" &&
    DISCOVERY_DOMAINS[r.source] !== undefined &&
    Array.isArray(r.results)
  );
}

/** The minimal common shape every discovery capability returns. */
interface DiscoveryResultShape {
  readonly source: string;
  readonly query?: string;
  readonly totalCount?: number;
  readonly results: ReadonlyArray<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Field extraction helpers (read stored values only — no business logic)
// ---------------------------------------------------------------------------

function pickString(item: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const k of keys) {
    const v = item[k];
    if (typeof v === "string" && v.trim() !== "") return v;
  }
  return undefined;
}

function pickNumber(item: Record<string, unknown>, key: string): number | undefined {
  const v = item[key];
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/**
 * Resolve the canonical numeric id for an item: the configured id field when
 * present, else the number in the composite `id` ("<prefix>:<number>").
 * Returns null when neither yields a usable canonical id (the card is skipped).
 */
function canonicalId(item: Record<string, unknown>, idField?: string): number | null {
  if (idField) {
    const n = pickNumber(item, idField);
    if (n != null) return n;
  }
  const composite = item.id;
  if (typeof composite === "string") {
    const tail = composite.slice(composite.lastIndexOf(":") + 1);
    const n = Number(tail);
    if (Number.isInteger(n)) return n;
  } else if (typeof composite === "number" && Number.isInteger(composite)) {
    return composite;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Card projections
// ---------------------------------------------------------------------------

/**
 * Project one meal-discovery item into a card. Personal/system meals become
 * rich meal cards referencing the canonical THA meal page; templates become
 * generic entity cards referencing the canonical THA template page. Neither
 * carries an external source URL.
 */
function mealDiscoveryCard(item: Record<string, unknown>): ThaDiscoveryCard | null {
  const title = pickString(item, TITLE_KEYS);
  if (!title) return null;

  const sourceType = typeof item.sourceType === "string" ? item.sourceType : undefined;
  const sourceLabel = pickString(item, ["sourceLabel"]);

  // Templates are canonical THA entities but not saved meals — link to the THA
  // template page, not a meal page, and render as a generic entity card.
  if (sourceType === "template") {
    const id = canonicalId(item); // parses "template:<id>"
    if (id == null) return null;
    return { kind: "entity", ref: { type: "meal_template", id }, title, subtitle: sourceLabel };
  }

  const id = canonicalId(item, "internalId");
  if (id == null) return null;

  const imageUrl = pickString(item, ["imageUrl"]);
  const servings = pickNumber(item, "servings");
  // Optional canonical facts — surfaced only when the item carries them (§ never fabricated).
  const appleScore = pickNumber(item, "appleScore");
  const lastCooked = pickString(item, ["lastCooked"]);

  return {
    kind: "meal",
    ref: { type: "meal", id },
    title,
    subtitle: sourceLabel,
    ...(imageUrl ? { imageUrl } : {}),
    ...(servings != null ? { servings } : {}),
    ...(appleScore != null ? { appleScore } : {}),
    ...(lastCooked ? { lastCooked } : {}),
  };
}

/** Project one generic discovery item into a canonical entity card. */
function genericCard(item: Record<string, unknown>, cfg: DomainConfig): ThaDiscoveryCard | null {
  const title = pickString(item, TITLE_KEYS);
  if (!title) return null;
  const id = canonicalId(item, cfg.idField);
  if (id == null) return null;
  const subtitle = pickString(item, SUBTITLE_KEYS);
  return { kind: "entity", ref: { type: cfg.refType, id }, title, ...(subtitle ? { subtitle } : {}) };
}

// ---------------------------------------------------------------------------
// Actions + summary
// ---------------------------------------------------------------------------

function buildActions(cfg: DomainConfig, query: string): DiscoveryAction[] {
  const actions: DiscoveryAction[] = [
    { kind: "open", label: cfg.mealCards ? "Open Meal" : "Open", appliesTo: "entity" },
  ];
  if (cfg.mealActions) {
    actions.push({ kind: "add-to-planner", label: "Add to Planner", appliesTo: "entity" });
    actions.push({ kind: "add-to-shopping", label: "Add to Shopping", appliesTo: "entity" });
  }
  actions.push({ kind: "view-all", label: "View All", appliesTo: "results", ...(query ? { query } : {}) });
  return actions;
}

function buildSummary(count: number, cfg: DomainConfig, query: string): string {
  const noun = count === 1 ? cfg.noun : cfg.pluralNoun;
  const q = query.trim();
  return q
    ? `I found ${count} ${noun} matching “${q}”.`
    : `I found ${count} ${noun}.`;
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

/**
 * Build a native THA discovery response from one discovery capability result,
 * or null when the payload is not a (non-empty) discovery result. Empty results
 * return null — the empty-search state is handled upstream by turn-fallback
 * (INT35 no-results), never as an empty card block.
 */
export function buildNativeDiscoveryResponse(result: unknown): NativeDiscoveryResponse | null {
  if (!isDiscoveryResult(result)) return null;
  const cfg = DISCOVERY_DOMAINS[result.source];
  const query = typeof result.query === "string" ? result.query : "";

  const cards: ThaDiscoveryCard[] = [];
  for (const item of result.results.slice(0, MAX_CARDS)) {
    const card = cfg.mealCards ? mealDiscoveryCard(item) : genericCard(item, cfg);
    if (card) cards.push(card);
  }
  if (cards.length === 0) return null;

  return {
    domain: cfg.domain,
    summary: buildSummary(cards.length, cfg, query),
    entities: cards,
    actions: buildActions(cfg, query),
    entityRefs: cards.map((c) => ({ type: c.ref.type, id: c.ref.id })),
  };
}
