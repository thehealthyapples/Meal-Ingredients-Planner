// WS0X.2 — Promotion Validator.
//
// Consolidates all WS0X.1 safety fixes into a single validation gate:
//   Fix 3: nameQuality = "review" blocks auto-promotion
//   Fix 4: Bean duplicate check against existing WS0 slugs
//   Fix 5: Processing level enforcement (composite and branded blocked)
//
// Also implements:
//   H1 UK Household Filter: only foods available in major UK supermarkets
//   (Tesco, Sainsbury's, Asda, Morrisons, Waitrose, M&S) auto-promote.
//   Non-H1 foods go to "needs_tha_review" stage.
//
// WS0X.10A — Progressive Food Intelligence. Food context (availability / peak_seasons /
//   origin_region) is OPTIONAL ENRICHMENT (Level 2), not a promotion gate. A food that
//   clears every correctness/exclusion check but lacks context promotes at LEVEL 1
//   (identity + nutrients — the trusted minimum) with context flagged pending. Context
//   is NEVER fabricated to satisfy a gate; absent context is suppressed in the UI. The
//   anti-fork, duplicate, prepared-food and brand gates are UNCHANGED — they protect
//   correctness, not enrichment. Malformed context that IS present still blocks.
//
// This module is stateless — it validates a single candidate against the
// rules and returns a typed result. It does NOT write to the database.

import { checkPreparedFood } from "./prepared-food-filter";
import { checkBrand } from "./brand-guard";
import { getFoodContext, validateFoodContext, type FoodContextSeed } from "../canonical/food-context";

// ── TYPES ─────────────────────────────────────────────────────────────────

export type NameQuality = "auto" | "review";

export interface PromotionCandidate {
  proposedSlug: string;
  proposedName: string;
  nameQuality: NameQuality;
  rawDescription: string;       // original USDA description (for filter checks)
  category: string;
  source?: string;
}

export type PromotionValidationStatus =
  | "auto_promote"
  | "h1_qualify"       // passes all checks; H1 UK available; context complete (Level 2)
  | "level_1"          // WS0X.10A — promote at Level 1 (identity + nutrients); context pending, optional enrichment
  | "needs_review"     // nameQuality=review or borderline H1
  | "blocked";         // hard block — never promote

export interface PromotionValidationResult {
  status: PromotionValidationStatus;
  blockedReason?: string;
  warnings: string[];
  /** WS0X.5A — auto-assigned food context; present when contextStatus is "auto_tagged". */
  autoTaggedContext?: FoodContextSeed;
  /** WS0X.5A — outcome of the context enforcement check. */
  contextStatus?: "auto_tagged" | "context_pending" | "blocked_missing";
}

// ── H1 UK HOUSEHOLD ALLOW LIST ────────────────────────────────────────────
// Foods explicitly confirmed as H1 UK (available in all major UK supermarkets).
// Slug-based. This list overrides H1 heuristics for borderline foods.
export const H1_UK_EXPLICIT_ALLOW: Set<string> = new Set([
  // Fish & Seafood
  "pollock", "tilapia", "sea-bass", "sea-bream", "squid", "mussels",
  "crab", "scallops",
  // Meat
  "venison", "liver",
  // Vegetables
  "okra", "runner-beans", "mangetout", "sugar-snap-peas",
  "purple-sprouting-broccoli", "spring-greens", "savoy-cabbage",
  "white-cabbage", "water-chestnuts", "baby-corn", "bean-sprouts",
  "bamboo-shoots", "cassava", "broccoli-raab", "mustard-greens",
  // Fruit
  "jackfruit", "elderberries", "goji-berries", "lychees", "papayas",
  "mulberries", "loganberries", "guava", "plantain", "physalis",
  // Grains
  "sorghum", "amaranth", "farro", "semolina", "black-rice", "polenta",
  "teff", "rice-flour", "almond-flour", "coconut-flour", "spelt-flour",
  "barley-flour",
  // Legumes
  "pinto-beans", "black-eyed-peas", "chickpea-flour",
  // Dairy
  "cottage-cheese", "cream-cheese", "sour-cream", "creme-fraiche",
  "buttermilk", "blue-cheese", "gouda", "brie", "camembert", "stilton",
  "goat-cheese", "mascarpone", "double-cream",
  // Nuts & Seeds
  "almond-butter", "tahini", "nigella-seeds",
  // Herbs
  "marjoram", "chervil",
  // Spices & Condiments
  "capers", "horseradish", "caraway-seeds", "fenugreek", "sumac",
  // Oils
  "coconut-oil", "rapeseed-oil", "sesame-oil",
  // Fermented
  "natto",
]);

// ── H2 / H3 FOODS THAT MUST NOT AUTO-PROMOTE ──────────────────────────────
// Explicitly blocked from the H1 batch (not available in major UK supermarkets).
export const NON_H1_EXPLICIT_BLOCK: Set<string> = new Set([
  "abiyuch", "dove", "frog-legs", "flor-de-mayo-beans", "carioca-beans",
  "epazote", "lambsquarters", "celtuce", "chrysanthemum-leaves",
  "cardoon", "lotus-root", "malabar-spinach", "nopales",
]);

// ── BEAN SLUGS ALREADY IN WS0 ─────────────────────────────────────────────
// Fix 4: Pre-validated list of bean slugs already in knowledge_foods.
// Any new promotion whose slug matches one of these is a duplicate and must block.
export const EXISTING_WS0_BEAN_SLUGS: Set<string> = new Set([
  "black-beans",
  "cannellini-beans",
  "borlotti-beans",
  "haricot-beans",
  "kidney-beans",
  "butter-beans",
  "broad-beans",
  "garden-peas",
  "chickpeas",
  "edamame",
  "red-lentils",
  "green-lentils",
  "puy-lentils",
  "beluga-lentils",
]);

// ── PROCESSING LEVEL ENFORCEMENT ─────────────────────────────────────────
// Fix 5: These USDA category names contain predominantly non-whole-food items.
// Foods in these categories are blocked unless explicitly H1-qualified.
const BLOCKED_USDA_CATEGORIES: Set<string> = new Set([
  "Baby Foods",
  "Meals, Entrees, and Side Dishes",
  "Fast Foods",
  "Restaurant Foods",
  "Snacks",
  "Sweets",
  "Beverages",
  "Cereal Grains and Pasta",  // too broad; many composites
]);

// ── MAIN VALIDATION FUNCTION ──────────────────────────────────────────────

export function validatePromotion(
  candidate: PromotionCandidate,
  existingSlugs: Set<string>,
): PromotionValidationResult {
  const warnings: string[] = [];

  // Fix 1: prepared/composite food check (delegates to existing filter)
  const preparedCheck = checkPreparedFood(candidate.rawDescription);
  if (preparedCheck.isPrepared) {
    return {
      status: "blocked",
      blockedReason: `Prepared/composite food: ${preparedCheck.reason}`,
      warnings,
    };
  }

  // Fix 2: brand guard
  const brandCheck = checkBrand(candidate.proposedName);
  if (brandCheck.isBlocked) {
    return {
      status: "blocked",
      blockedReason: `Brand blocked: ${brandCheck.reason}`,
      warnings,
    };
  }

  // Fix 3: name quality gate — only "auto" quality names auto-promote
  if (candidate.nameQuality === "review") {
    return {
      status: "needs_review",
      blockedReason: undefined,
      warnings: ["nameQuality=review: manual name confirmation required before promotion"],
    };
  }

  // Fix 4: bean duplicate check
  if (EXISTING_WS0_BEAN_SLUGS.has(candidate.proposedSlug)) {
    return {
      status: "blocked",
      blockedReason: `Duplicate bean slug "${candidate.proposedSlug}" already exists in WS0.`,
      warnings,
    };
  }

  // General slug duplicate check
  if (existingSlugs.has(candidate.proposedSlug)) {
    return {
      status: "blocked",
      blockedReason: `Slug "${candidate.proposedSlug}" already exists in knowledge_foods.`,
      warnings,
    };
  }

  // Fix 5: processing level — block explicitly non-ingredient categories
  if (BLOCKED_USDA_CATEGORIES.has(candidate.category)) {
    return {
      status: "blocked",
      blockedReason: `USDA category "${candidate.category}" contains composite/processed products.`,
      warnings,
    };
  }

  // Explicit non-H1 block
  if (NON_H1_EXPLICIT_BLOCK.has(candidate.proposedSlug)) {
    return {
      status: "needs_review",
      blockedReason: undefined,
      warnings: [`Slug "${candidate.proposedSlug}" is not H1 UK household relevant. Defer to H2/H3 batch.`],
    };
  }

  // H1 explicit allow — WS0X.5A authored context auto-tags to Level 2.
  // WS0X.10A Progressive Food Intelligence: missing context NO LONGER blocks. The food
  // promotes at LEVEL 1 (identity + nutrients are the trusted minimum) with context
  // flagged pending and back-filled later. Context is NEVER fabricated to satisfy a gate;
  // absent context is suppressed everywhere in the UI. Context that IS present but
  // malformed STILL blocks — shipping malformed data would break trust.
  if (H1_UK_EXPLICIT_ALLOW.has(candidate.proposedSlug)) {
    const ctx = getFoodContext(candidate.proposedSlug);
    if (!ctx) {
      return {
        status: "level_1",
        warnings: [
          ...warnings,
          `Food context not yet authored for "${candidate.proposedSlug}" — promoting at Level 1 (identity + nutrients). Context is optional enrichment; add availability / peak_seasons / origin_region to FOOD_CONTEXT_SEED to reach Level 2. Never fabricate it.`,
        ],
        contextStatus: "context_pending",
      };
    }
    const ctxProblems = validateFoodContext(candidate.proposedSlug, ctx);
    if (ctxProblems.length > 0) {
      return {
        status: "blocked",
        blockedReason: `Invalid food context for "${candidate.proposedSlug}": ${ctxProblems.join("; ")}`,
        warnings,
        contextStatus: "blocked_missing",
      };
    }
    return { status: "h1_qualify", warnings, autoTaggedContext: ctx, contextStatus: "auto_tagged" };
  }

  // Default: needs review (unknown H1 status).
  warnings.push("H1 UK status not confirmed — manual review recommended.");
  const ctxDefault = getFoodContext(candidate.proposedSlug);
  if (ctxDefault) {
    return { status: "needs_review", warnings, autoTaggedContext: ctxDefault, contextStatus: "auto_tagged" };
  }
  warnings.push(`Food context not yet authored for "${candidate.proposedSlug}". Optional enrichment (Level 2) — the food can promote at Level 1 once H1 status is confirmed; add to FOOD_CONTEXT_SEED to enrich. Never fabricate it.`);
  return { status: "needs_review", warnings, contextStatus: "context_pending" };
}
