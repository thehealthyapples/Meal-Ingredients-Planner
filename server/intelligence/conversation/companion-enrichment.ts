/**
 * companion-enrichment.ts — INT41 Capability Enrichment
 * ========================================================
 * The Companion answers a question and can now ALSO attach a small,
 * deterministic set of contextual insights, explanations, recommendations
 * and educational content — declared by the capability that actually
 * produced the turn's grounding data. This is deliberately distinct from
 * INT38/INT39 guidance (companion-guidance.ts): guidance is "where to next"
 * (a navigable action pointing at another capability); enrichment is
 * "here's something worth knowing about this answer" (static, informational
 * content with no navigation target and no mutation).
 *
 * ARCHITECTURE — enrichment is CAPABILITY-OWNED, not Companion-owned:
 *  - This module holds no content of its own. It is a thin CONSUMER of the
 *    Capability Enrichment Registry (server/intelligence/types.ts
 *    `Capability.enrichment`, declared per capability in
 *    capability-registry.ts's ENRICHMENT table). "Content belongs to
 *    capabilities, not the Companion" — the same discipline INT39 established
 *    for guidance, applied here to a second, independent extension point.
 *  - No new capability, no new owner, no business logic, no live
 *    computation. Enrichment items are static prose the capability author
 *    wrote once; this module only RESOLVES which of a capability's declared
 *    items are relevant to this turn (by source capability + verb) and caps
 *    the total offered.
 *  - Reusable across every Intelligence surface: any future consumer reads
 *    the same intelligencePlatform.getEnrichment(capabilityId), never a
 *    second copy of this content.
 *
 * Run tests: npx tsx server/tests/test-intelligence-companion-enrichment.ts
 */

import { intelligencePlatform } from "../intelligence-platform.js";
import type { CapabilityEnrichment, CapabilityEnrichmentItem, EnrichmentKind, IntentVerb } from "../types.js";
import type { GetCompanionDomainFn } from "./companion-guidance.js";

// ---------------------------------------------------------------------------
// Public contract
// ---------------------------------------------------------------------------

/** One contextual enrichment item, offered on a turn (success only). */
export interface CompanionEnrichmentItem {
  /** The Companion Card domain this item was generated FROM. */
  readonly sourceDomain: string;
  /** The capability this item was declared by (INT41 — for traceability). */
  readonly sourceCapabilityId: string;
  readonly kind: EnrichmentKind;
  readonly title: string;
  readonly body: string;
}

/** One capability that produced grounding data this turn, and the verb it answered. */
export interface EnrichmentSource {
  readonly capabilityId: string;
  readonly verb: IntentVerb;
}

/**
 * Maximum enrichment items attached to one turn — avoid overwhelming the user.
 * Exported so other enrichment sources composed at the gateway (e.g. NUT1's
 * nutrition-enrichment.ts) can respect the same overall cap rather than
 * declaring a second one.
 */
export const MAX_ENRICHMENT_ITEMS = 3;

/** Injectable enrichment lookup — defaults to the production registry, pure/testable otherwise. */
export type GetEnrichmentFn = (capabilityId: string) => CapabilityEnrichment | undefined;

const defaultGetEnrichment: GetEnrichmentFn = (capabilityId) =>
  intelligencePlatform.getEnrichment(capabilityId);

/**
 * CONV1 BEH-8 — the same registry lookup companion-guidance.ts uses. Both modules
 * read the one owner; neither keeps a domain table of its own. (Before BEH-8 this
 * module imported companion-guidance.ts's CAPABILITY_DOMAIN, which was the closest
 * thing to a correct arrangement available at the time: one copy, two readers. The
 * copy was still a copy, and it had already fallen four capabilities behind.)
 */
const defaultGetCompanionDomain: GetCompanionDomainFn = (capabilityId) =>
  intelligencePlatform.getCompanionDomain(capabilityId);

function itemAppliesToVerb(item: CapabilityEnrichmentItem, verb: IntentVerb): boolean {
  return !item.appliesToVerbs || item.appliesToVerbs.includes(verb);
}

// ---------------------------------------------------------------------------
// Public builder
// ---------------------------------------------------------------------------

/**
 * Build the contextual enrichment for a turn, given the capabilities that
 * produced real grounding data this turn (deduped, resolver order) and the
 * verb each answered with. Reads each source capability's own declared
 * enrichment from the Capability Enrichment Registry, filtered to items that
 * apply to the verb actually used. Deterministic — no LLM call. Returns []
 * when no source capability declared anything to add (an honest gap, never
 * fabricated content).
 */
export function buildEnrichment(
  sources: readonly EnrichmentSource[],
  getEnrichment: GetEnrichmentFn = defaultGetEnrichment,
  getCompanionDomain: GetCompanionDomainFn = defaultGetCompanionDomain,
): CompanionEnrichmentItem[] {
  const seenCapabilities = new Set<string>();
  const items: CompanionEnrichmentItem[] = [];

  for (const source of sources) {
    // CONV1 BEH-8 — the domain is ATTRIBUTION here ("where this came from"), not
    // routing: an enrichment item is an explanation, never a door. So a
    // cross-cutting `platform` capability attributes honestly as itself and is
    // not excluded — which is what makes Food Intelligence's, Opportunity
    // Delivery's and Evidence Learning's own explanations of how they reason
    // reachable at all. An undeclared domain still means not reachable.
    const sourceDomain = getCompanionDomain(source.capabilityId);
    if (seenCapabilities.has(source.capabilityId) || !sourceDomain) continue;
    seenCapabilities.add(source.capabilityId);

    const enrichment = getEnrichment(source.capabilityId);
    if (!enrichment) continue;

    for (const item of enrichment.items) {
      if (!itemAppliesToVerb(item, source.verb)) continue;
      items.push({
        sourceDomain,
        sourceCapabilityId: source.capabilityId,
        kind: item.kind,
        title: item.title,
        body: item.body,
      });
      if (items.length >= MAX_ENRICHMENT_ITEMS) return items;
    }
  }
  return items;
}
