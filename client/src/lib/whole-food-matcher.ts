import type { ProductMatch } from "@shared/schema";

export interface WholeFoodIntent {
  ingredientName: string;
  variantSelections: Record<string, string>;
  attributePreferences: Record<string, boolean>;
  tier: string;
  selectedRetailers: string[];
}

const WEIGHT_VARIANT_MATCH = 25;
const WEIGHT_ATTRIBUTE_MATCH = 20;
const WEIGHT_TIER_ALIGN = 15;
const WEIGHT_RETAILER_BREADTH = 10;
const PENALTY_TIER_GAP = 10;

const TIER_ORDER = ["budget", "standard", "premium", "organic"];

function tierIndex(t: string): number {
  return TIER_ORDER.indexOf(t.toLowerCase());
}

export function scoreCandidate(
  candidate: ProductMatch,
  intent: WholeFoodIntent,
  tier: string,
  selectedRetailers: string[]
): number {
  if (!selectedRetailers.includes(candidate.supermarket)) return -Infinity;

  let score = 0;
  const nameLower = (candidate.productName || "").toLowerCase();

  const variantValues = Object.values(intent.variantSelections);
  for (const variant of variantValues) {
    if (!variant) continue;
    // Support comma-separated multi-select (e.g. "Chestnut,Portobello")
    const parts = variant.split(",").map((v) => v.trim()).filter(Boolean);
    for (const part of parts) {
      if (nameLower.includes(part.toLowerCase())) {
        score += WEIGHT_VARIANT_MATCH;
        break; // Don't award multiple times for the same selector
      }
    }
  }

  for (const [attr, wanted] of Object.entries(intent.attributePreferences)) {
    if (wanted && nameLower.includes(attr.toLowerCase().replace("_", " "))) {
      score += WEIGHT_ATTRIBUTE_MATCH;
    }
  }

  const candidateTier = (candidate.tier || "standard").toLowerCase();
  const targetTier = tier.toLowerCase();
  if (candidateTier === targetTier) {
    score += WEIGHT_TIER_ALIGN;
  }
  if (targetTier === "organic" && nameLower.includes("organic")) {
    score += WEIGHT_TIER_ALIGN;
  }

  const tierGap = Math.abs(tierIndex(candidateTier) - tierIndex(targetTier));
  score -= tierGap * PENALTY_TIER_GAP;

  if (selectedRetailers.length > 1) score += WEIGHT_RETAILER_BREADTH;

  return score;
}

export function resolveBestMatch(
  candidates: ProductMatch[],
  intent: WholeFoodIntent,
  tier: string,
  selectedRetailers: string[]
): ProductMatch | null {
  const filtered = candidates.filter((c) => selectedRetailers.includes(c.supermarket));
  if (filtered.length === 0) return null;

  const scored = filtered
    .map((c) => ({ candidate: c, score: scoreCandidate(c, intent, tier, selectedRetailers) }))
    .filter((x) => x.score > -Infinity)
    .sort((a, b) => b.score - a.score);

  return scored.length > 0 ? scored[0].candidate : null;
}
