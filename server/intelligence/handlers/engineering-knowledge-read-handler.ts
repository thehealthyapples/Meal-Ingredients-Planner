/**
 * Engineering Knowledge Read Handler (ENGINT1)
 * ============================================
 * Executes the `developer` capability's read-only verbs against the Engineering
 * Knowledge Registry: `read`, `search`, `explain`, `report`.
 *
 * THE ONE RULE THIS FILE EXISTS TO ENFORCE: every result carries its evidence,
 * or it is not a result. Each projection below returns `citations` (`path:line`)
 * or a structured `gap` explaining what was searched and why nothing was found.
 * There is no code path that returns a confident sentence with nothing behind
 * it, because an engineering answer that cannot be checked is worse than
 * silence — it is a plausible claim about the state of the system, which is the
 * most expensive kind of wrong THA can produce.
 *
 * WHAT IT DELIBERATELY WILL NOT DO. It never derives a completion status the
 * roadmap does not record (`handleReport` surfaces `completionRecorded: false`
 * verbatim); it never nominates a governing owner the architecture has not
 * declared; and it never lets an investigation stand in for a rule, because
 * `docs/architecture/README.md` states that investigations are *"point-in-time
 * analysis and history only"*. Investigations are returned, always in their own
 * field, never merged into the governing answer.
 *
 * PLANE: developer only (TIP1 §7). Bound exclusively through
 * `server/intelligence/developer-plane.ts`; the canonical user-facing registry
 * keeps this capability at `availability: "never"`, which `permissions.ts`
 * rejects before any role check.
 */

import { gap, readOnlyVerbGuard } from "./_read-kit.js";
import {
  CapabilityExecutionError,
  type CapabilityHandler,
  type Intent,
  type IntelligenceContext,
} from "../types.js";
import type { EngineeringKnowledgeReadPort } from "./engineering-knowledge-read-port.js";
import type { EngineeringDocKind } from "../../services/engineering-knowledge-registry.js";

/**
 * The verbs this binding actually executes. All four declared verbs are
 * executable — unlike `product-knowledge`, `report` is NOT a gap here, because
 * an engineering report is not an editorial judgement: it is the roadmap's own
 * declared workstreams plus the reports that reference them, each cited. The
 * platform selects nothing and summarises nothing it did not read.
 */
export const ENGINEERING_KNOWLEDGE_EXECUTABLE_INTENTS = ["read", "search", "explain", "report"] as const;

const GROUNDED_NOTE =
  "Answered from THA's own engineering record — the governing architecture, investigations, " +
  "implementation reports, roadmap and release documents — read live from the repository at the moment " +
  "of the question. Every statement traces to a path:line citation. The Intelligence Platform authored " +
  "none of it and owns none of it; where the record is silent, this answer reports the silence.";

const OWNERSHIP_NOTE =
  "Only docs/architecture/ can answer who GOVERNS a behaviour — that directory is the single canonical " +
  "home for governing architecture, and investigations there are explicitly history, never rule. Any " +
  "investigations below are supporting context for WHY, and are never the source of truth.";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const s = value.trim();
  return s.length > 0 ? s : undefined;
}

const KINDS: readonly EngineeringDocKind[] = [
  "architecture",
  "investigation",
  "implementation",
  "roadmap",
  "release",
];

function toKind(value: unknown): EngineeringDocKind | undefined {
  const s = toStr(value)?.toLowerCase();
  return KINDS.find((k) => k === s);
}

function toLimit(value: unknown, fallback: number, ceiling: number): number {
  const n = typeof value === "number" ? value : Number(toStr(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), ceiling);
}

/**
 * The subject of the question. Accepts `{ topic }`, `{ query }` or `{ id }` so a
 * resolver need not know which synonym this capability prefers.
 */
function subjectOf(intent: Intent): string | undefined {
  return toStr(intent.parameters?.topic) ?? toStr(intent.parameters?.query) ?? toStr(intent.parameters?.id);
}

// ---------------------------------------------------------------------------
// read — the index, a filtered list, or one document
// ---------------------------------------------------------------------------

async function handleRead(intent: Intent, port: EngineeringKnowledgeReadPort): Promise<unknown> {
  const id = toStr(intent.parameters?.id) ?? toStr(intent.parameters?.path);
  const kind = toKind(intent.parameters?.kind);
  const workstream = toStr(intent.parameters?.workstream);

  if (id) {
    const doc = await port.getDocument(id);
    if (!doc) {
      throw gap(
        `Honest gap: no engineering document is indexed under ${JSON.stringify(id)}. ` +
          "Engineering Intelligence indexes docs/architecture/, docs/investigations/, docs/implementation/ " +
          "and the release documents. If the document exists outside those owners, " +
          "it is not engineering knowledge as this capability defines it — and the platform will not " +
          "describe a document it has not read.",
      );
    }
    return { scope: "document", document: doc, source: "engineering-knowledge-registry", note: GROUNDED_NOTE };
  }

  if (kind || workstream) {
    const documents = await port.listDocuments({ kind, workstream });
    if (documents.length === 0) {
      throw gap(
        `Honest gap: no engineering documents are indexed for ` +
          `${[kind && `kind=${kind}`, workstream && `workstream=${workstream}`].filter(Boolean).join(", ")}. ` +
          "The filter matched nothing; the platform will not widen it silently and answer a different question.",
      );
    }
    return {
      scope: "documents",
      filter: { kind: kind ?? null, workstream: workstream ?? null },
      documents,
      source: "engineering-knowledge-registry",
      note: GROUNDED_NOTE,
    };
  }

  // Neither → the map of what can be answered at all.
  const summary = await port.summarise();
  return { scope: "index", summary, source: "engineering-knowledge-registry", note: GROUNDED_NOTE };
}

// ---------------------------------------------------------------------------
// search — locate the documents and files that bear on a question
// ---------------------------------------------------------------------------

async function handleSearch(intent: Intent, port: EngineeringKnowledgeReadPort): Promise<unknown> {
  const query = subjectOf(intent);
  if (!query) throw gap("Searching engineering knowledge needs a non-empty { query } string.");

  const hits = await port.search(query, {
    kind: toKind(intent.parameters?.kind),
    workstream: toStr(intent.parameters?.workstream),
    limit: toLimit(intent.parameters?.limit, 8, 25),
  });

  if (hits.length === 0) {
    throw gap(
      `Honest gap: nothing in THA's engineering record matches ${JSON.stringify(query)}. ` +
        "Searched: docs/architecture/, docs/investigations/, docs/implementation/ " +
        "and the release documents. This means the repository does not record it under that name — it does " +
        "NOT mean the work was never done. Engineering Intelligence will not answer from anything other " +
        "than the record.",
    );
  }

  return { query, hits, source: "engineering-knowledge-registry", note: GROUNDED_NOTE };
}

// ---------------------------------------------------------------------------
// explain — the reasoning verb: connect ownership, history and evidence
// ---------------------------------------------------------------------------

async function handleExplain(intent: Intent, port: EngineeringKnowledgeReadPort): Promise<unknown> {
  const topic = subjectOf(intent);
  if (!topic) {
    throw gap(
      "Explaining an engineering topic needs { topic } — the architecture, behaviour, workstream or " +
        "document to explain.",
    );
  }

  const aspect = toStr(intent.parameters?.aspect)?.toLowerCase();

  // ENGINT2 — "Why does this feature exist? Which investigation led to this
  // implementation? Which architecture governs this?" are one question asked of
  // a document's neighbourhood in three directions, so they share one path.
  if (aspect === "relationships" || aspect === "graph" || aspect === "related") {
    const graph = await port.documentGraph(topic);
    if (!graph) {
      throw gap(
        `Honest gap: no engineering document is indexed under ${JSON.stringify(topic)}, so it has no ` +
          "derivable relationships. Relationships are derived from citations between documents that exist; " +
          "the platform will not relate a document it has not read.",
      );
    }
    return {
      topic,
      aspect: "relationships",
      document: graph.document,
      // What this document cites — its governing architecture and prior investigations.
      cites: graph.outgoing,
      // What cites this document — the work that followed from it.
      citedBy: graph.incoming,
      promotedFrom: graph.promotedFrom,
      commits: graph.commits,
      // Ids named in prose that resolve to no document. Reported, never inferred
      // into an edge: most are intra-document rule ids, not broken links.
      unresolvedReferences: graph.unresolvedReferences,
      gap: graph.gap,
      source: "engineering-knowledge-registry",
      note:
        GROUNDED_NOTE +
        " Every relationship above is DERIVED at read time from a citation in a file, and carries the " +
        "path:line that proves it. Nothing is stored, and no relationship is inferred from subject-matter " +
        "similarity — if the link was never written down, it is not claimed here.",
    };
  }

  // "Why was this decision made? What investigations exist? Which release
  // introduced this behaviour?" — the history question.
  if (aspect === "history" || aspect === "why" || aspect === "implementation") {
    const history = await port.implementationHistory(topic);
    return {
      topic,
      aspect: "history",
      implementationReports: history.reports,
      investigations: history.investigations,
      gap: history.gap,
      source: "engineering-knowledge-registry",
      note:
        GROUNDED_NOTE +
        " Implementation reports record WHAT was built; investigations record WHY it was decided. They are " +
        "reported separately and never merged.",
    };
  }

  // Default: "Explain this architecture. Which document owns this behaviour?
  // What is the source of truth?" — the ownership question.
  const governance = await port.whoGoverns(topic);

  if (governance.gap && governance.supportingImplementations.length === 0) {
    // Nothing governing AND nothing implemented — a total absence, reported as one.
    throw new CapabilityExecutionError("gap", `${governance.gap.reason} Searched: ${governance.gap.searched.join("; ")}.`);
  }

  return {
    topic,
    aspect: "governance",
    governingDocuments: governance.governingDocuments,
    supportingImplementations: governance.supportingImplementations,
    gap: governance.gap,
    source: "engineering-knowledge-registry",
    note: `${GROUNDED_NOTE} ${OWNERSHIP_NOTE}`,
  };
}

// ---------------------------------------------------------------------------
// report — roadmap position, recent work, and open risk
// ---------------------------------------------------------------------------

async function handleReport(intent: Intent, port: EngineeringKnowledgeReadPort): Promise<unknown> {
  const subject = (toStr(intent.parameters?.subject) ?? toStr(intent.parameters?.topic) ?? "roadmap").toLowerCase();

  if (subject.includes("recent") || subject.includes("change") || subject.includes("commit")) {
    const recent = await port.recentWork(toLimit(intent.parameters?.limit, 15, 100));
    return {
      subject: "recent-work",
      commits: recent.commits,
      recentReports: recent.reports,
      gap: recent.gap,
      source: "engineering-knowledge-registry",
      note: GROUNDED_NOTE,
    };
  }

  // ENGINT2 — "Which architecture has no implementation? Which implementations
  // have no governing architecture? Which investigations remain unresolved?"
  if (subject.includes("coverage") || subject.includes("orphan") || subject.includes("unresolved")) {
    const coverage = await port.coverageGaps();
    return {
      subject: "record-coverage",
      architectureWithoutImplementation: coverage.architectureWithoutImplementation,
      implementationsWithoutGoverningArchitecture: coverage.implementationsWithoutGoverningArchitecture,
      unresolvedInvestigations: coverage.unresolvedInvestigations,
      counts: coverage.counts,
      source: "engineering-knowledge-registry",
      // The caveat is part of the answer, not a footnote to it.
      note: `${GROUNDED_NOTE} ${coverage.caveat}`,
    };
  }

  // ENGINT2 — "What has not yet shipped?" This repository cannot answer it.
  if (subject.includes("ship") || subject.includes("release") || subject.includes("deploy")) {
    const shipping = await port.shippingStatus();
    return {
      subject: "shipping-status",
      answerable: shipping.answerable,
      gap: shipping.gap,
      tagEvidence: shipping.tagEvidence,
      proxy: shipping.proxy,
      source: "engineering-knowledge-registry",
      note:
        GROUNDED_NOTE +
        " THA records no release ledger, so 'shipped' is not a fact this repository holds. The gap above " +
        "states the evidence; the proxy answers a narrower question and is labelled as a proxy, not an answer.",
    };
  }

  // ENGINT2 — "Which roadmap item owns this?" Not derivable; the WS token space collides.
  if (subject.includes("owns") || subject.includes("ownership") || subject.includes("workstream")) {
    const ownership = await port.roadmapOwnership();
    return {
      subject: "roadmap-ownership",
      answerable: ownership.answerable,
      gap: ownership.gap,
      declaredWorkstreams: ownership.position.workstreams,
      completionRecorded: ownership.position.completionRecorded,
      source: "engineering-knowledge-registry",
      note:
        GROUNDED_NOTE +
        " The roadmap's declared workstreams are shown because they ARE recorded; the link from a document " +
        "to the workstream that owns it is not, and is reported as a gap rather than guessed from a token.",
    };
  }

  if (subject.includes("risk") || subject.includes("gap") || subject.includes("blocker")) {
    const risks = await port.openRisks();
    return {
      subject: "open-risk",
      openRoadmapItems: risks.openRoadmapItems,
      redRatedDocuments: risks.redRatedDocuments,
      source: "engineering-knowledge-registry",
      note: `${GROUNDED_NOTE} ${risks.note}`,
    };
  }

  // Default: position against the roadmap — "What remains before production?"
  const position = await port.roadmapPosition();

  if (!position.roadmap) {
    throw gap(
      "Honest gap: the Master Evolution Roadmap (docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md) could " +
        "not be read, so there is no roadmap to report position against. Engineering Intelligence will not " +
        "assemble a roadmap from implementation reports — that would invent a plan THA never approved.",
    );
  }

  return {
    subject: "roadmap-position",
    roadmap: position.roadmap,
    workstreams: position.workstreams,
    openDefinitionOfDoneItems: position.openCheckboxes,
    // Surfaced verbatim, and it is always false. See the registry's
    // roadmapPosition() for why deriving completion here would be fabrication.
    completionRecorded: position.completionRecorded,
    completionGap: position.completionGap,
    source: "engineering-knowledge-registry",
    note:
      `${GROUNDED_NOTE} The workstreams below are the roadmap's own declarations and the implementation ` +
      "reports that NAME each one. Whether that evidence amounts to completion is a human judgement; the " +
      "roadmap records no completion status, and the platform does not invent one.",
  };
}

// ---------------------------------------------------------------------------
// Handler factory
// ---------------------------------------------------------------------------

export function createEngineeringKnowledgeReadHandler(
  resolvePort: () => Promise<EngineeringKnowledgeReadPort>,
): CapabilityHandler {
  return async (intent: Intent, _context: IntelligenceContext): Promise<unknown> => {
    readOnlyVerbGuard(intent, ENGINEERING_KNOWLEDGE_EXECUTABLE_INTENTS, "Engineering Intelligence");

    switch (intent.verb) {
      case "read":
        return handleRead(intent, await resolvePort());
      case "search":
        return handleSearch(intent, await resolvePort());
      case "explain":
        return handleExplain(intent, await resolvePort());
      case "report":
        return handleReport(intent, await resolvePort());
      default:
        throw new CapabilityExecutionError(
          "gap",
          `Engineering Intelligence is bound to the Intelligence Platform read-only: "${intent.verb}" is not ` +
            "executable via the platform. Engineering knowledge is authored by humans through the " +
            "Engineering Workflow and reviewed in a PR — nothing at runtime may create, edit or retire an " +
            "architecture document, an investigation, an implementation report, or the roadmap.",
          intent.verb,
        );
    }
  };
}
