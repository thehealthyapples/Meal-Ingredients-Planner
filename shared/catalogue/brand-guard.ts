// WS0X.1 Fix 2 — Brand Guard (pipeline-level).
//
// The WS0.11 brand filter blocked brands at the START of a description.
// Four SMART BALANCE / SMART BEAT entries slipped through because the brand
// name followed a comma: "Margarine-like spread, SMART BALANCE Omega Plus".
//
// This module adds a post-normalisation guard:
//   1. BLOCKED_BRANDS — known brand names (case-insensitive).
//   2. Heuristic all-caps detection — multi-word sequences in all-caps
//      that are not known legitimate food category words.
//
// Used by the promotion validator; the pipeline calls this AFTER
// name-normaliser produces a proposed canonical name.

export interface BrandGuardResult {
  isBlocked: boolean;
  matchedBrand: string | null;
  reason: string;
}

// ── EXPLICIT BRAND BLOCK LIST ─────────────────────────────────────────────
// Add known branded product names here. Case-insensitive matching.
export const BLOCKED_BRANDS: string[] = [
  // Margarine / spread brands (confirmed in WS0.11 pilot)
  "SMART BALANCE",
  "SMART BEAT",
  // Add further brands as discovered during promotion runs.
];

// ── ALL-CAPS BRAND HEURISTIC ──────────────────────────────────────────────
// A two-or-more-word sequence entirely in UPPER_CASE (with spaces) that is
// not a known legitimate food-category abbreviation is a likely brand name.
// Legitimate all-caps terms (not brands) — do not flag these.
const CAPS_ALLOWLIST: string[] = [
  "UHT",   // ultra-high-temperature processed dairy
  "UK",
  "USA",
  "FDA",
  "USDA",
];

function isCapsAllowed(term: string): boolean {
  return CAPS_ALLOWLIST.some((a) => a === term.trim().toUpperCase());
}

// Matches sequences like "SMART BALANCE" or "COCA COLA" — two+ all-caps words
const ALL_CAPS_PATTERN = /\b([A-Z]{2,}(?:\s+[A-Z]{2,})+)\b/g;

// ── MAIN CHECK ────────────────────────────────────────────────────────────

/**
 * Run the brand guard against a proposed canonical name (post-normalisation).
 * Returns isBlocked=true if the name contains a known brand or a suspicious
 * all-caps multi-word sequence.
 */
export function checkBrand(proposedName: string): BrandGuardResult {
  const upper = proposedName.toUpperCase();

  // 1. Explicit block list.
  for (const brand of BLOCKED_BRANDS) {
    if (upper.includes(brand.toUpperCase())) {
      return {
        isBlocked: true,
        matchedBrand: brand,
        reason: `Explicit brand block: "${brand}"`,
      };
    }
  }

  // 2. All-caps heuristic — use exec loop for ES5 compat.
  ALL_CAPS_PATTERN.lastIndex = 0;
  let capsMatch: RegExpExecArray | null;
  while ((capsMatch = ALL_CAPS_PATTERN.exec(proposedName)) !== null) {
    const term = capsMatch[1];
    if (!isCapsAllowed(term)) {
      return {
        isBlocked: true,
        matchedBrand: term,
        reason: `Suspicious all-caps sequence "${term}" — likely a brand name. Review manually.`,
      };
    }
  }

  return { isBlocked: false, matchedBrand: null, reason: "No brand signal" };
}
