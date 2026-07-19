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

// ── Claim review lifecycle (KNOW2) ────────────────────────────────────────────
//
// KNOW5 gave a claim two review columns, and KNOW1 found what they could not
// say. `reviewedAt IS NULL` carried two different meanings at once — "no one has
// looked at this yet" and "a reviewer looked at this and refused it" — and a
// database cannot tell them apart. The consequences are both bad and both
// silent: a refused health claim is offered back to every future reviewer
// forever, and the next reviewer, seeing no record of the refusal, may approve
// what a qualified colleague already rejected.
//
// So rejection is given its own terminal state. This vocabulary is pure and
// zero-I/O — it sits beside the entity spine under ARCHITECTURE_PRINCIPLES.md
// Principle 5, exactly as the Layer-1/Layer-2 gates above do.
//
// IT IS NOT A RENDER GATE, and must never be used as one. `isEvidenceBackedClaim`
// remains the single gate deciding what a household sees. The distinction is
// load-bearing:
//
//   isEvidenceBackedClaim  →  may a HOUSEHOLD see this claim?   (the Trust Gate)
//   deriveClaimReviewStatus →  what should a REVIEWER be shown?  (the worklist)
//
// A rejected claim is invisible to households because its `reviewedAt` is NULL
// and the existing gate already refuses it — not because anything new filters it
// out. That is deliberate: a second filter is a second thing that can be got
// wrong, and the strongest guarantee available here is that rejection needs no
// new enforcement to be safe.

export type ClaimReviewStatus = "pending" | "approved" | "rejected";

export const CLAIM_REVIEW_STATUS_LABELS: Readonly<Record<ClaimReviewStatus, string>> = {
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
};

/** The review columns a claim row carries after KNOW2. */
export interface ClaimReviewLifecycleFields {
  reviewedAt: Date | string | null;
  reviewedBy?: string | null;
  rejectedAt?: Date | string | null;
  rejectedBy?: string | null;
  rejectionReason?: string | null;
}

/**
 * The state a claim row is actually in.
 *
 * Approval and rejection are mutually exclusive by construction (a database
 * CHECK constraint enforces it, and `validateClaimLifecycleState` reports it) —
 * but if a row ever holds both, this reports `rejected`. Failing closed is the
 * only safe reading: the alternative would surface a claim that a human refused.
 */
export function deriveClaimReviewStatus(row: ClaimReviewLifecycleFields): ClaimReviewStatus {
  if (row.rejectedAt) return "rejected";
  if (row.reviewedAt) return "approved";
  return "pending";
}

/**
 * Structural integrity of a claim's review state. Empty = valid.
 *
 * Extends `validateReviewState` (which owns the "a sign-off must name its
 * reviewer" rule and is not restated here) with the rejection half: a rejection
 * must also name its reviewer, must carry a reason, and may never coexist with
 * an approval on the same row.
 */
export function validateClaimLifecycleState(row: ClaimReviewLifecycleFields): string[] {
  const problems = validateReviewState(row);
  if (row.reviewedAt && row.rejectedAt) {
    problems.push("a claim may not be both approved and rejected — the two states are exclusive");
  }
  if (row.rejectedAt && !row.rejectedBy) {
    problems.push("rejectedAt is set without rejectedBy — a rejection must name its reviewer");
  }
  if (!row.rejectedAt && row.rejectedBy) {
    problems.push("rejectedBy is set without rejectedAt — a reviewer without a rejection");
  }
  if (row.rejectedAt && !row.rejectionReason?.trim()) {
    problems.push("a rejection must record why — an unexplained refusal cannot be reviewed or reversed");
  }
  return problems;
}

/** The decisions a reviewer can take on a claim. */
export type ClaimReviewAction = "approve" | "reject" | "reopen";

/**
 * Which decisions are legal from a given state.
 *
 *   pending  → approve | reject
 *   approved → reject                (a withdrawal: evidence found wrong later)
 *   rejected → reopen                (back to pending, for re-examination)
 *
 * `rejected → approve` is deliberately NOT permitted in one step. Reversing a
 * colleague's refusal of a health claim must be an explicit two-part act —
 * reopen, then approve — so it can never be a mis-click, and so the audit trail
 * records the reopening as its own decision with its own named reviewer.
 */
export function allowedClaimReviewActions(status: ClaimReviewStatus): readonly ClaimReviewAction[] {
  switch (status) {
    case "pending":
      return ["approve", "reject"];
    case "approved":
      return ["reject"];
    case "rejected":
      return ["reopen"];
  }
}

export function isAllowedClaimReviewAction(status: ClaimReviewStatus, action: ClaimReviewAction): boolean {
  return allowedClaimReviewActions(status).includes(action);
}

/**
 * Whether a claim is eligible to be APPROVED at all.
 *
 * Approval writes the `reviewedAt` the Trust Gate reads, so approving a claim
 * whose citation cannot clear Layer 1 would publish an unsourced health claim
 * through the front door. The reviewer's judgement is required but never
 * sufficient: the citation must be structurally valid first.
 */
export function canApproveClaim(row: ClaimEvidenceFields & ClaimReviewLifecycleFields): boolean {
  if (deriveClaimReviewStatus(row) !== "pending") return false;
  if (!Array.isArray(row.sourceRefs) || row.sourceRefs.length === 0) return false;
  return row.sourceRefs.some((ref) => isValidSourceRef(ref));
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
