/**
 * Pantry Read Handler (INT8 — fourth live capability binding)
 * ===========================================================
 * The FOURTH execution handler bound to the THA Intelligence Platform. It makes the
 * `pantry` capability *executable* for READ-ONLY intents only, by delegating every
 * read to the existing Pantry owner through a {@link PantryReadPort}. It proves the
 * reusable Port → Handler → Binding pattern (first established for the Planner in INT2)
 * against a fourth, independent owner.
 *
 * HARD BOUNDARIES (the reason this binding is safe):
 *   • READ-ONLY. Only the "read" and "explain" verbs execute. Any other verb (add,
 *     delete, search, recommend) throws an honest gap — there is NO code path here that
 *     adds, deletes, or mutates any pantry item or ingredient knowledge record.
 *   • DELEGATION ONLY. All data comes from the owning service via the port. This file
 *     contains NO pantry business rule, NO ingredient resolution logic, NO sorting or
 *     filtering beyond projecting the owner's stored values. Pantry remains the owner
 *     (Principles 2 & 7).
 *   • PERMISSION-AWARE / OWN DATA ONLY. The caller must be an authenticated user; every
 *     read is scoped to that user's household by the owner getter. The "explain" verb
 *     additionally confirms the requested ingredientKey appears in the caller's own pantry
 *     before surfacing knowledge — cross-household reads are impossible.
 *   • HONEST GAPS + THA TRUST RULES. Requests the Pantry owner holds no safe answer for
 *     return a structured gap, never a fabricated answer (Principle 6). The handler NEVER
 *     invents ingredient knowledge: it surfaces ONLY what the owner has already stored
 *     in pantry_ingredient_knowledge. Ingredients with no stored knowledge return a gap.
 *
 * The handler is built by {@link createPantryReadHandler} with a port provider, so the
 * production binding injects the real owning service and tests inject an in-memory owner.
 */

import type { CapabilityHandler, IntelligenceContext, Intent } from "../types.js";
import type { PantryReadPort } from "./pantry-read-port.js";
import { requireUserId, gap, denied, readOnlyVerbGuard } from "./_read-kit.js";
import type { UserPantryItem, PantryIngredientKnowledge } from "@shared/schema";

// ---------------------------------------------------------------------------
// Result shapes (read projections — owned data, surfaced honestly)
// ---------------------------------------------------------------------------

/** A pantry item as the read binding surfaces it — display-safe stored fields only. */
export interface PantryItemView {
  readonly id: number;
  readonly ingredientKey: string;
  /** The owner's stored display name, or null when not set. */
  readonly displayName: string | null;
  readonly category: string;
  readonly defaultHave: boolean;
  readonly isDefault: boolean;
  readonly notes: string | null;
  readonly needQuantityValue: number | null;
  readonly needUnit: string | null;
}

export interface PantryListReadResult {
  readonly scope: "list";
  readonly itemCount: number;
  readonly items: readonly PantryItemView[];
}

/** Stored ingredient knowledge as the read binding surfaces it — display-safe fields only. */
export interface PantryIngredientKnowledgeView {
  readonly ingredientKey: string;
  /** What diets / lifestyles this ingredient supports (owner-stored array). */
  readonly supports: readonly string[];
  /** Short highlight points stored by the owner, or null if not enriched. */
  readonly highlights: readonly string[] | null;
  /** "Why it matters" editorial copy stored by the owner, or null if not enriched. */
  readonly whyItMatters: string | null;
  /** "Good to know" editorial copy stored by the owner, or null if not enriched. */
  readonly goodToKnow: string | null;
  /** How-to-choose guidance stored by the owner, or null if not enriched. */
  readonly howToChoose: readonly string[] | null;
  /** Owner-assigned tags for this ingredient. */
  readonly tags: readonly string[];
  /** The owner's enrichment source (e.g. "manual", "ai"). Attribution — never a fabrication signal. */
  readonly enrichmentSource: string;
  /** Constant so consumers know what produced this result. */
  readonly source: "pantry-ingredient-knowledge";
}

export interface PantryExplainResult {
  readonly ingredientKey: string;
  readonly knowledge: PantryIngredientKnowledgeView;
}

// ---------------------------------------------------------------------------
// Read projections (stored fields only — no fabrication)
// ---------------------------------------------------------------------------

function toItemView(item: UserPantryItem): PantryItemView {
  return {
    id: item.id,
    ingredientKey: item.ingredientKey,
    displayName: item.displayName ?? null,
    category: item.category,
    defaultHave: item.defaultHave,
    isDefault: item.isDefault,
    notes: item.notes ?? null,
    needQuantityValue: item.needQuantityValue ?? null,
    needUnit: item.needUnit ?? null,
  };
}

function toKnowledgeView(k: PantryIngredientKnowledge): PantryIngredientKnowledgeView {
  return {
    ingredientKey: k.ingredientKey,
    supports: k.supports,
    highlights: k.highlights ?? null,
    whyItMatters: k.whyItMatters ?? null,
    goodToKnow: k.goodToKnow ?? null,
    howToChoose: k.howToChoose ?? null,
    tags: k.tags,
    enrichmentSource: k.enrichmentSource,
    source: "pantry-ingredient-knowledge",
  };
}

// ---------------------------------------------------------------------------
// Verb implementations
// ---------------------------------------------------------------------------

async function handleRead(intent: Intent, userId: number, port: PantryReadPort): Promise<PantryListReadResult> {
  const params = intent.parameters ?? {};
  const scope = params.scope as string | undefined;

  if (scope !== "list") {
    throw gap(
      `Unsupported pantry read scope ${JSON.stringify(scope)}. ` +
        'Supported read scope: "list" (the household\'s pantry items).',
    );
  }

  const items = await port.getPantryItems(userId);
  return {
    scope: "list",
    itemCount: items.length,
    items: items.map(toItemView),
  };
}

/**
 * Explain the stored ingredient knowledge for an item in the caller's pantry.
 * Ownership is enforced by checking the item appears in the caller's household-scoped
 * pantry list — a foreign ingredientKey returns denied with no existence leak. When
 * the owner holds no stored knowledge for the ingredient, that is an honest gap rather
 * than a fabricated description.
 */
async function handleExplain(
  intent: Intent,
  userId: number,
  port: PantryReadPort,
): Promise<PantryExplainResult> {
  const params = intent.parameters ?? {};
  const ingredientKey = typeof params.ingredientKey === "string" ? params.ingredientKey.trim() : "";
  if (!ingredientKey) {
    throw gap(
      "Explaining a pantry item needs { ingredientKey } — the ingredient key of the pantry item to explain.",
    );
  }

  // Ownership gate: only items in the caller's household pantry may be explained.
  // Resolving via the household-scoped owner getter ensures no cross-household read.
  const pantryItems = await port.getPantryItems(userId);
  const item = pantryItems.find((i) => i.ingredientKey === ingredientKey);
  if (!item) {
    throw denied(
      "Pantry item not found in your household's pantry (no cross-household access).",
    );
  }

  const knowledge = await port.getPantryIngredientKnowledge(ingredientKey);
  if (!knowledge) {
    throw gap(
      `Honest gap: the Pantry owner has no stored knowledge for "${ingredientKey}" in pantry_ingredient_knowledge. ` +
        "The Intelligence Platform will not fabricate ingredient descriptions, storage guidance, or dietary claims.",
    );
  }

  return {
    ingredientKey,
    knowledge: toKnowledgeView(knowledge),
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

/**
 * Create the pantry read-only handler. `resolvePort` provides the owning-service surface
 * (production: real storage; tests: in-memory owner). The returned handler is what the
 * Capability Registry binds to the `pantry` capability (INT8).
 */
export function createPantryReadHandler(
  resolvePort: () => Promise<PantryReadPort>,
): CapabilityHandler {
  return async (intent: Intent, context: IntelligenceContext): Promise<unknown> => {
    // Read-only binding: only "read" and "explain" execute. Every other verb (add,
    // delete, search, recommend — all in the pantry allow-list but all out of scope for
    // this read-only binding) is an honest gap. There is no code path here that adds,
    // deletes, searches, or recommends; the Pantry service remains the sole owner of
    // every pantry mutation and recommendation.
    readOnlyVerbGuard(intent, ["read", "explain"], "Pantry");

    const userId = requireUserId(context, "Pantry");
    const port = await resolvePort();

    if (intent.verb === "read") return handleRead(intent, userId, port);
    return handleExplain(intent, userId, port);
  };
}
