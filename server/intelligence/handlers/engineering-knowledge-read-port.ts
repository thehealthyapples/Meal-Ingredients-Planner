/**
 * Engineering Knowledge Read Port (ENGINT1)
 * =========================================
 * The delegation surface onto the Engineering Knowledge Registry owner
 * (`server/services/engineering-knowledge-registry.ts`).
 *
 * READ-ONLY BY CONSTRUCTION: no write method exists, and none may be added. The
 * governing architecture, the investigations and the implementation reports are
 * authored by humans through the Engineering Workflow and reviewed in a PR.
 * Nothing at runtime may create, edit, or retire one — that boundary is what
 * keeps Engineering Intelligence a READER of engineering knowledge rather than
 * its owner (ENGINT1 scope lock; TIP1 §3.1).
 *
 * NO TIER ARGUMENT, DELIBERATELY. The Product Knowledge port threads a
 * visibility tier through every method because product knowledge spans four
 * audiences. Engineering knowledge spans exactly one: everything reachable here
 * is `developer`-class (TIP1 §3.2 — *"everything under docs/investigations/
 * defaults to developer"*). The whole capability is gated at the registry by
 * `knowledgeClass: "developer"`, and it is only ever bound on the isolated
 * developer plane. A per-entry tier here would imply some of this is safe for a
 * household to read, and none of it is (TIP1 §4.2).
 */

import type {
  EngineeringDocKind,
  EngineeringDocRef,
  EngineeringIndexSummary,
  EngineeringSearchHit,
  GoverningOwnerAnswer,
  ImplementationHistoryAnswer,
  RecentWorkAnswer,
  RiskAnswer,
  RoadmapPositionAnswer,
  SearchOptions,
} from "../../services/engineering-knowledge-registry.js";

export interface EngineeringKnowledgeReadPort {
  // --- Phase 1: engineering knowledge -------------------------------------
  /** What the index covers, and from which owners. */
  summarise(): Promise<EngineeringIndexSummary>;
  /** Documents of a kind and/or workstream, newest first. */
  listDocuments(filter?: { kind?: EngineeringDocKind; workstream?: string }): Promise<EngineeringDocRef[]>;
  /** One document by EWO id (`ENGINT1`), repo-relative path, or filename. */
  getDocument(idOrPath: string): Promise<EngineeringDocRef | undefined>;
  /** Ranked documents with `path:line` citations. */
  search(query: string, options?: SearchOptions): Promise<EngineeringSearchHit[]>;

  // --- Phase 2: engineering reasoning -------------------------------------
  /** Which GOVERNING document owns a behaviour — architecture only, never an investigation. */
  whoGoverns(topic: string): Promise<GoverningOwnerAnswer>;
  /** Whether something is implemented, per the documentary record, and why it exists. */
  implementationHistory(topic: string): Promise<ImplementationHistoryAnswer>;
  /** Position against the roadmap — including the fact that completion is unrecorded. */
  roadmapPosition(): Promise<RoadmapPositionAnswer>;
  /** Recent commits and recent implementation reports. */
  recentWork(limit?: number): Promise<RecentWorkAnswer>;
  /** Risks and gaps THA has already recorded about itself. */
  openRisks(): Promise<RiskAnswer>;
}

/**
 * Production factory. Dynamic import so binding this capability does not walk the
 * documentation tree at import time — the owner is touched only on first
 * invocation, mirroring every other binding's no-connection-at-import rule.
 */
export async function createRegistryEngineeringKnowledgeReadPort(): Promise<EngineeringKnowledgeReadPort> {
  const registry = await import("../../services/engineering-knowledge-registry.js");
  return {
    summarise: async () => registry.summariseIndex(),
    listDocuments: async (filter) => registry.listDocuments(filter),
    getDocument: async (idOrPath) => registry.getDocument(idOrPath),
    search: async (query, options) => registry.searchDocuments(query, options),
    whoGoverns: async (topic) => registry.whoGoverns(topic),
    implementationHistory: async (topic) => registry.implementationHistory(topic),
    roadmapPosition: async () => registry.roadmapPosition(),
    recentWork: async (limit) => registry.recentWork(limit),
    openRisks: async () => registry.openRisks(),
  };
}
