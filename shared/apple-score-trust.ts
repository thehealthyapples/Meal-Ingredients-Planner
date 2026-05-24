// ---------------------------------------------------------------------------
// Canonical Apple Score trust-state model
// Usable by client and server — no external dependencies.
// ---------------------------------------------------------------------------

/**
 * Five discrete trust states that determine whether an authoritative
 * Apple Score may be shown for a given item.
 */
export type AppleScoreTrustState =
  | "WHOLE_FOOD_TRUSTED"     // canonical whole food — direct scoring allowed
  | "PRODUCT_RESOLVED"       // matched/scanned product with ingredients analysis
  | "ANALYSIS_REQUIRED"      // packaged/generic, unresolved — no authoritative score
  | "PRODUCT_MATCH_PENDING"  // user has initiated matching/scan flow (transitional)
  | "MANUAL_OVERRIDE";       // user explicitly set value — visually distinguishable

/**
 * Minimum fields required to derive trust state.
 * All fields optional/nullable to handle partial data safely.
 */
export interface AppleScoreGateInput {
  itemType?: string | null;
  resolutionState?: string | null;
  matchedProductId?: string | null;
  barcode?: string | null;
}

/**
 * Derive the canonical trust state from item data.
 *
 * Universal invariant:
 *   A product may only display an authoritative Apple Score if it is a
 *   trusted whole food OR a resolved analysed product.
 */
export function deriveAppleScoreTrustState(
  item: AppleScoreGateInput,
): AppleScoreTrustState {
  // Trusted whole foods always allowed — they have no ingredient ambiguity.
  if (item.itemType === "whole_food") return "WHOLE_FOOD_TRUSTED";

  // Explicitly matched to a specific product — user confirmed or barcode-confirmed.
  if (item.resolutionState === "matched_to_product") return "PRODUCT_RESOLVED";

  // matchedProductId set means the item was matched to a known product entry.
  if (item.matchedProductId != null && item.matchedProductId.trim() !== "") {
    return "PRODUCT_RESOLVED";
  }

  // Barcode-confirmed product — a scan provides ingredient-level certainty.
  if (item.barcode != null && item.barcode.trim() !== "") return "PRODUCT_RESOLVED";

  // User has started a matching/review flow but hasn't confirmed yet.
  if (item.resolutionState === "needs_review") return "PRODUCT_MATCH_PENDING";

  // Everything else: raw, resolved-by-name-only, unclassified packaged items.
  return "ANALYSIS_REQUIRED";
}

/**
 * Universal visibility gate.
 *
 * Returns true ONLY when an authoritative Apple Score may be displayed.
 * Use this check before rendering any 1–5 apple score badge on any surface.
 */
export function canShowAuthoritativeAppleScore(
  item: AppleScoreGateInput,
): boolean {
  const state = deriveAppleScoreTrustState(item);
  return (
    state === "WHOLE_FOOD_TRUSTED" ||
    state === "PRODUCT_RESOLVED" ||
    state === "MANUAL_OVERRIDE"
  );
}

/**
 * Returns a safe display label for items blocked by the trust gate.
 * Callers may use this in place of apple-icon scores.
 */
export function getUnresolvedScoreLabel(
  state: AppleScoreTrustState,
): string {
  if (state === "PRODUCT_MATCH_PENDING") return "Select Product";
  return "Analysis Required";
}
