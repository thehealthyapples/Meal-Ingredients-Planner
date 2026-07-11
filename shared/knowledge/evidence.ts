// PKC Phase 0 — Layer-2 claim-trust validator (Rule KC8: "declared is not
// enforced" — every evidence layer must have a running, automated check).
//
// One implementation, two callers: the seed validator (refuses to seed a
// malformed citation) and the runtime registry (refuses to display an
// unsourced claim). Governing document:
// docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §4.
//
// This module is dependency-free on purpose — it must be importable from
// shared/schema.ts, seed scripts and server services without cycles.

/** A citation for a single knowledge claim. Shape per
 *  HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md §6.1 — all fields
 *  required; `lastReviewed` is when a human last checked link + content. */
export interface KnowledgeSourceRef {
  /** Publishing body, e.g. "EFSA", "NHS", "BNF", "NIH ODS". */
  body: string;
  /** The specific page/document title. */
  title: string;
  /** Direct, stable link. Must be https and on a Layer-1 trusted domain. */
  url: string;
  /** Mirrors the claim's strength. Never render `emerging` as established. */
  evidenceLevel: "established" | "emerging";
  /** ISO date (YYYY-MM-DD) the link + content were last checked. */
  lastReviewed: string;
}

// ── Layer 1 — source trust ────────────────────────────────────────────────────
// Domains a claim citation may point at (FS1 §4 tier1_official/tier2_scientific).
// A domain not on this list is not citable, regardless of author confidence
// (Rule KC7 — a claim may only cite a source that already cleared Layer 1).
export const TRUSTED_SOURCE_DOMAINS: readonly string[] = [
  "nhs.uk",                 // NHS — tier 1 (UK public health)
  "gov.uk",                 // UK government / FSA — tier 1
  "efsa.europa.eu",         // EFSA — tier 1 (EU claims authority)
  "ec.europa.eu",           // EU Register of nutrition & health claims — tier 1
  "eur-lex.europa.eu",      // EU law (authorised-claims regulations) — tier 1
  "ods.od.nih.gov",         // NIH Office of Dietary Supplements — tier 2
  "nutrition.org.uk",       // British Nutrition Foundation — tier 2
];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isTrustedSourceUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  const host = parsed.hostname.toLowerCase();
  return TRUSTED_SOURCE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
}

/** Structural check on one citation. Returns human-readable problems (empty = valid). */
export function validateSourceRef(ref: unknown): string[] {
  const problems: string[] = [];
  if (typeof ref !== "object" || ref === null) return ["sourceRef is not an object"];
  const r = ref as Partial<KnowledgeSourceRef>;
  if (!r.body || typeof r.body !== "string") problems.push("missing source body");
  if (!r.title || typeof r.title !== "string") problems.push("missing source title");
  if (!r.url || typeof r.url !== "string") problems.push("missing source url");
  else if (!isTrustedSourceUrl(r.url)) problems.push(`url not on a Layer-1 trusted domain: ${r.url}`);
  if (r.evidenceLevel !== "established" && r.evidenceLevel !== "emerging") {
    problems.push("evidenceLevel must be 'established' or 'emerging'");
  }
  if (!r.lastReviewed || typeof r.lastReviewed !== "string" || !ISO_DATE_RE.test(r.lastReviewed)) {
    problems.push("lastReviewed must be an ISO date (YYYY-MM-DD)");
  }
  return problems;
}

export function isValidSourceRef(ref: unknown): ref is KnowledgeSourceRef {
  return validateSourceRef(ref).length === 0;
}

// ── Layer 2 — claim trust ─────────────────────────────────────────────────────

/** The fields of a benefit-link row this gate reasons about. */
export interface ClaimEvidenceFields {
  sourceRefs: unknown;
  reviewedAt: Date | string | null;
}

/**
 * The Phase 0 render gate: a nutrition-benefit claim may reach a user only if
 * it carries ≥1 structurally valid SourceRef AND an explicit human sign-off
 * (reviewedAt). Automation may author sourceRefs; only the sign-off gate sets
 * reviewedAt (Rule KC9 — automation authors candidates, never publishes).
 */
export function isEvidenceBackedClaim(row: ClaimEvidenceFields): boolean {
  if (!row.reviewedAt) return false;
  if (!Array.isArray(row.sourceRefs) || row.sourceRefs.length === 0) return false;
  return row.sourceRefs.some((ref) => isValidSourceRef(ref));
}

// ── Review-state integrity (KNOW5) ────────────────────────────────────────────

/** The review columns every claim table carries. `reviewedBy` names the human. */
export interface ClaimReviewFields {
  reviewedAt: Date | string | null;
  reviewedBy?: string | null;
}

/**
 * A sign-off must name its reviewer. An anonymous `reviewed_at` is a rubber
 * stamp wearing the costume of a human gate (KNOW5 finding F3): it records that
 * *someone* approved a health claim without recording who, so it can never be
 * audited or withdrawn. Enforced at the sign-off boundary, not at render time —
 * pre-KNOW5 sign-offs are legitimately anonymous and are not retroactively
 * invalidated, but no new one may be.
 */
export function validateReviewState(row: ClaimReviewFields): string[] {
  const problems: string[] = [];
  if (row.reviewedAt && !row.reviewedBy) problems.push("reviewedAt is set without reviewedBy — a sign-off must name its reviewer");
  if (!row.reviewedAt && row.reviewedBy) problems.push("reviewedBy is set without reviewedAt — a reviewer without a sign-off");
  return problems;
}

// ── Evidence Confidence (KNOW5) ───────────────────────────────────────────────
//
// One vocabulary for "how well evidenced is this claim", derived SOLELY from the
// evidence chain and the review status. It is never authored, never stored, and
// never inherited from a `confidence` / `evidenceStrength` column — those are
// editorial self-assessments (an AI draft may call itself `established`) and the
// gate ignores them. Confidence is computed from what a claim can actually cite
// and who actually signed it off.

export type EvidenceConfidence = "established" | "strong" | "emerging" | "under-review";

export const EVIDENCE_CONFIDENCE_LABELS: Readonly<Record<EvidenceConfidence, string>> = {
  established: "Established",
  strong: "Strong",
  emerging: "Emerging",
  "under-review": "Under Review",
};

/** Only `under-review` is a gap. Everything else has cleared the Layer-2 gate. */
export function isRenderableConfidence(confidence: EvidenceConfidence): boolean {
  return confidence !== "under-review";
}

/** Rank for picking the best-evidenced route to a benefit. Higher is stronger. */
const CONFIDENCE_RANK: Readonly<Record<EvidenceConfidence, number>> = {
  "under-review": 0,
  emerging: 1,
  strong: 2,
  established: 3,
};

export function strongerConfidence(a: EvidenceConfidence, b: EvidenceConfidence): EvidenceConfidence {
  return CONFIDENCE_RANK[a] >= CONFIDENCE_RANK[b] ? a : b;
}

/**
 * The evidence level a single edge has actually earned: the strongest level
 * among its *structurally valid* citations, or null if the edge is not
 * evidence-backed at all. One established source is enough to establish an edge;
 * an invalid citation contributes nothing, whatever level it claims.
 */
export function edgeEvidenceLevel(row: ClaimEvidenceFields): "established" | "emerging" | null {
  if (!isEvidenceBackedClaim(row)) return null;
  const levels = (row.sourceRefs as unknown[]).filter(isValidSourceRef).map((ref) => ref.evidenceLevel);
  return levels.includes("established") ? "established" : "emerging";
}

/** Confidence of one standalone claim (e.g. nutrient → benefit, food → nutrient). */
export function deriveClaimConfidence(row: ClaimEvidenceFields): EvidenceConfidence {
  const level = edgeEvidenceLevel(row);
  if (level === null) return "under-review";
  return level;
}

/**
 * The full chain a food-level benefit chip depends on.
 *
 * `composition` and `nutrientBenefit` are BOTH required. Before KNOW5 only the
 * second was gated, so a chip could render an NHS citation for "fibre supports
 * gut health" on top of an unreviewed AI premise that white flour is a notable
 * fibre source. Requiring both is the whole point of this workstream.
 *
 * `foodBenefit` is the food→benefit row's own evidence, if it has any. It is
 * optional corroboration — it can raise confidence but never grants a chip.
 */
export interface BenefitEvidenceChain {
  /** food → nutrient: the food-specific premise. */
  composition: ClaimEvidenceFields;
  /** nutrient → benefit: the physiological claim. */
  nutrientBenefit: ClaimEvidenceFields;
  /** food → benefit: a direct citation for this food's claim, if one exists. */
  foodBenefit?: ClaimEvidenceFields | null;
}

/**
 * Evidence Confidence for a derived benefit claim.
 *
 *   Under Review  any required edge is unsourced or unreviewed → the chip does
 *                 not render. An honest gap (Principle 6).
 *   Emerging      the chain is complete, but its weakest citation is `emerging`.
 *                 Never presented as established (ENGINEERING_WORKFLOW STEP 7).
 *   Strong        every edge is established, but the food-specific claim is
 *                 DERIVED through the nutrient bridge — no source speaks about
 *                 this food and this benefit together.
 *   Established   every edge is established AND the food→benefit claim is itself
 *                 directly cited and signed off.
 *
 * The weakest link governs: a chain is never stronger than the edge that
 * supports it least.
 */
export function deriveEvidenceConfidence(chain: BenefitEvidenceChain): EvidenceConfidence {
  const composition = edgeEvidenceLevel(chain.composition);
  const nutrientBenefit = edgeEvidenceLevel(chain.nutrientBenefit);

  // A missing required edge is a gap, not a weak claim.
  if (composition === null || nutrientBenefit === null) return "under-review";
  if (composition === "emerging" || nutrientBenefit === "emerging") return "emerging";

  const foodBenefit = chain.foodBenefit ? edgeEvidenceLevel(chain.foodBenefit) : null;
  if (foodBenefit === "emerging") return "emerging";
  return foodBenefit === "established" ? "established" : "strong";
}
