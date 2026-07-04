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
