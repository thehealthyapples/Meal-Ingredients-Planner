import type { ProductMatch } from "@shared/schema";
import type { WholeFoodIntent } from "./whole-food-matcher";

export type ConfidenceLevel = "exact" | "close" | "substitution";

export const CONFIDENCE_LABELS: Record<ConfidenceLevel, { label: string; colorClass: string; bgClass: string }> = {
  exact: {
    label: "Exact match likely",
    colorClass: "text-green-700",
    bgClass: "bg-green-50 border-green-200",
  },
  close: {
    label: "Close match likely",
    colorClass: "text-amber-700",
    bgClass: "bg-amber-50 border-amber-200",
  },
  substitution: {
    label: "Substitution likely",
    colorClass: "text-orange-700",
    bgClass: "bg-orange-50 border-orange-200",
  },
};

function candidateSatisfiesIntent(candidate: ProductMatch, intent: WholeFoodIntent): boolean {
  const name = (candidate.productName || "").toLowerCase();
  const variants = Object.values(intent.variantSelections).filter(Boolean);
  const wantedAttrs = Object.entries(intent.attributePreferences)
    .filter(([, v]) => v)
    .map(([k]) => k.replace("_", " "));

  const variantOk = variants.length === 0 || variants.some((v) => name.includes(v.toLowerCase()));
  const attrOk = wantedAttrs.length === 0 || wantedAttrs.some((a) => name.includes(a));

  return variantOk && attrOk;
}

export function calcConfidence(
  intent: WholeFoodIntent,
  candidates: ProductMatch[],
  selectedRetailers: string[]
): { level: ConfidenceLevel; reason: string } {
  const viableCandidates = candidates.filter((c) => selectedRetailers.includes(c.supermarket));

  if (viableCandidates.length === 0) {
    return {
      level: "substitution",
      reason: "Limited availability may require substitution.",
    };
  }

  const strongMatches = viableCandidates.filter((c) => candidateSatisfiesIntent(c, intent));

  if (strongMatches.length >= 2) {
    return {
      level: "exact",
      reason: "Several matching options available.",
    };
  }

  if (strongMatches.length === 1) {
    if (selectedRetailers.length > 1) {
      return {
        level: "exact",
        reason: "Match found across your selected supermarkets.",
      };
    }
    return {
      level: "close",
      reason: "Exact variety may vary by store.",
    };
  }

  if (viableCandidates.length >= 1) {
    return {
      level: "close",
      reason: selectedRetailers.length > 1
        ? "Close match available across your selected supermarkets."
        : "Close match available — consider adding more supermarkets.",
    };
  }

  return {
    level: "substitution",
    reason: "Limited availability may require substitution.",
  };
}
