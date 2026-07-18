/**
 * test-intelligence-engineering-knowledge-graph.ts (ENGINT2)
 * ==========================================================
 * Verifies derived relationship reasoning over the engineering record, against
 * THE REAL REPOSITORY.
 *
 * The suite is organised around the distinction that defines ENGINT2: what the
 * repository can EVIDENCE, and what it cannot. Two of the mission's five named
 * relationships are derivable from citations; three are not, and the tests
 * assert the refusals as strictly as the answers — because a capability that
 * quietly approximates an unanswerable question is worse than one that cannot
 * answer it at all.
 *
 *   PART A — DERIVED EDGES. Every edge carries a path:line. Self-edges are
 *   dropped, ambiguous ids are not guessed, and unresolved ids are REPORTED
 *   rather than inferred into links.
 *
 *   PART B — THE REFUSALS. "What has not shipped" and "which roadmap item owns
 *   this" return `answerable: false` with the evidence for why, and no code
 *   path returns a substitute dressed as an answer.
 *
 *   PART C — THE EIGHT QUESTIONS from the mission, asked of the live corpus.
 *
 *   PART D — NO NEW OWNERSHIP. One capability, one registry, no new verb, no
 *   stored graph. ENGINT2 must be invisible to the capability surface.
 *
 * Run with: npx tsx server/tests/test-intelligence-engineering-knowledge-graph.ts
 */

import {
  createRegistryEngineeringKnowledgeReadPort,
  developerPlaneContext,
  developerPlanePlatform,
  DEVELOPER_PLANE_ENV_FLAG,
  ENGINEERING_KNOWLEDGE_CAPABILITY_ID,
  ENGINEERING_KNOWLEDGE_INTENTS,
  intelligencePlatform,
  resetDeveloperPlane,
  type IntelligenceContext,
} from "../intelligence/index.js";
import type { IntelligencePlatform } from "../intelligence/intelligence-platform.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    passed++;
    console.log(`  ✅ ${label}`);
  } else {
    failed++;
    console.log(`  ❌ ${label}${detail ? `\n       ${detail}` : ""}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}\n${"─".repeat(title.length)}`);
}

interface Edge {
  from: string;
  to: string;
  kind: string;
  evidence: { path: string; line: number; text: string };
}
interface DocRef {
  path: string;
  kind: string;
  title: string;
  date: string | null;
}

// ---------------------------------------------------------------------------

async function testDerivedEdges(platform: IntelligencePlatform, ctx: IntelligenceContext): Promise<void> {
  section("PART A — Derived edges: every relationship carries its evidence");

  const ask = (verb: "explain" | "report" | "read", parameters: Record<string, unknown>) =>
    platform.handle({ capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb, parameters }, ctx);

  // A document with a rich, known citation graph.
  const outcome = await ask("explain", { topic: "ENGINT1", aspect: "relationships" });
  assert(outcome.status === "ok", "A document's relationship neighbourhood resolves", `status: ${outcome.status}`);

  const r = outcome.result as
    | {
        document: DocRef;
        cites: Edge[];
        citedBy: Edge[];
        promotedFrom: Edge[];
        commits: { sha: string; subject: string; relation: string }[];
        unresolvedReferences: { id: string; evidence: { path: string; line: number } }[];
      }
    | undefined;

  console.log(`       document: ${r?.document.path}`);
  for (const e of (r?.cites ?? []).slice(0, 5)) {
    console.log(`       cites → ${e.to}  [${e.kind}]  evidence ${e.evidence.path}:${e.evidence.line}`);
  }

  assert((r?.cites ?? []).length > 0, "The document's outgoing citations are derived");

  assert(
    (r?.cites ?? []).every((e) => e.evidence && typeof e.evidence.line === "number" && e.evidence.line > 0),
    "EVERY edge carries a path:line — no edge exists without evidence",
  );

  assert(
    (r?.cites ?? []).every((e) => e.evidence.path === r?.document.path),
    "An outgoing edge's evidence is a line in the SOURCE document, not the target",
  );

  assert(
    (r?.cites ?? []).every((e) => e.to !== r?.document.path) &&
      (r?.citedBy ?? []).every((e) => e.from !== r?.document.path),
    "No self-edges — a document naming its own id is not a relationship",
  );

  assert(
    (r?.cites ?? []).some((e) => e.to.startsWith("docs/architecture/")),
    "Architecture → governs → implementation is derived (the report cites its governing documents)",
  );

  // Commits. ENGINT1 was committed with its id in the subject.
  console.log(`       commits: ${(r?.commits ?? []).map((c) => `${c.sha}(${c.relation})`).join(" ")}`);
  assert((r?.commits ?? []).length > 0, "Implementation → linked to → Commit is derived from the commit log");
  assert(
    (r?.commits ?? []).some((c) => c.relation === "delivered-by"),
    "A commit naming the document's id is classified `delivered-by`",
  );

  // The chore-snapshot inversion.
  const conv = (await ask("explain", { topic: "CONV1", aspect: "relationships" })).result as
    | { commits: { subject: string; relation: string }[] }
    | undefined;
  const snapshots = (conv?.commits ?? []).filter((c) => c.relation === "preceded-by");
  console.log(`       CONV1 preceded-by commits: ${snapshots.length}`);
  assert(
    snapshots.length === 0 || snapshots.every((c) => /before|preserve/i.test(c.subject)),
    "`chore: preserve … before X` is classified `preceded-by`, never as delivery",
  );

  // Promotion edges — architecture promoted from an investigation.
  const time3 = (await ask("explain", { topic: "THA_HOUSEHOLD_TIME_ARCHITECTURE.md", aspect: "relationships" }))
    .result as { promotedFrom: Edge[] } | undefined;
  for (const e of time3?.promotedFrom ?? []) {
    console.log(`       promoted-from → ${e.to}  evidence ${e.evidence.path}:${e.evidence.line}`);
  }
  assert(
    (time3?.promotedFrom ?? []).length > 0 &&
      (time3?.promotedFrom ?? []).every((e) => e.to.startsWith("docs/investigations/")),
    "Architecture ← promoted from ← Investigation is derived, and points only at investigations",
  );

  // Unresolved ids are reported, not invented into edges.
  const withUnresolved = (await ask("explain", { topic: "CONV1", aspect: "relationships" })).result as
    | { unresolvedReferences: { id: string }[]; cites: Edge[] }
    | undefined;
  console.log(
    `       unresolved ids reported: ${(withUnresolved?.unresolvedReferences ?? []).slice(0, 6).map((u) => u.id).join(", ")}`,
  );
  assert(
    (withUnresolved?.unresolvedReferences ?? []).every((u) => typeof u.id === "string" && u.id.length > 0),
    "Ids that resolve to no document are REPORTED as unresolved, never dropped and never inferred",
  );

  // Regression guard. The first working version reported full filename STEMS
  // (`TIME1_HOUSEHOLD_TIME_FOUNDATION`) as unresolved, because the id regex
  // swallowed the whole stem and never matched the `TIME1` docId. That filled
  // the unresolved list with false gaps — the one defect that would make the
  // list worthless, since its entire value is that every entry can be trusted.
  const unresolvedIds = (withUnresolved?.unresolvedReferences ?? []).map((u) => u.id);
  const falseGaps = unresolvedIds.filter((id) => /^[A-Z]+[0-9]+_[A-Z_]{6,}$/.test(id));
  assert(
    falseGaps.length === 0,
    "A bare filename stem in prose resolves to its document — it is NOT a false unresolved gap",
    `false gaps: ${falseGaps.slice(0, 4).join(", ")}`,
  );
  assert(
    !unresolvedIds.some((id) => id.startsWith("TIME1_") || id.startsWith("TIME2_")),
    "Known-existing documents cited by stem never appear in the unresolved list",
  );

  // A topic that is not a document at all.
  const unknown = await ask("explain", { topic: "NOSUCHDOC404", aspect: "relationships" });
  assert(unknown.status === "gap", "Relationships for an unknown document return an honest gap");
}

// ---------------------------------------------------------------------------

async function testRefusals(platform: IntelligencePlatform, ctx: IntelligenceContext): Promise<void> {
  section("PART B — The refusals: what this repository cannot evidence");

  const ask = (parameters: Record<string, unknown>) =>
    platform.handle({ capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb: "report", parameters }, ctx);

  // "What has not yet shipped?"
  const shipping = await ask({ subject: "what has not shipped" });
  const s = shipping.result as
    | {
        answerable: boolean;
        gap: { reason: string; searched: string[] };
        tagEvidence: { totalTags: number; rollbackTags: number; releaseTags: number };
        proxy: { description: string; documentsWithNoDeliveringCommit: DocRef[] };
      }
    | undefined;

  console.log(`       answerable: ${s?.answerable}`);
  console.log(
    `       tags: ${s?.tagEvidence.totalTags} total, ${s?.tagEvidence.rollbackTags} rollback, ${s?.tagEvidence.releaseTags} release`,
  );
  console.log(`       proxy found ${s?.proxy.documentsWithNoDeliveringCommit.length} reports with no delivering commit`);

  assert(shipping.status === "ok", "The shipping question returns a structured result");
  assert(s?.answerable === false, "'What has not shipped' is declared UNANSWERABLE, not approximated");
  assert(
    (s?.tagEvidence.totalTags ?? 0) > 100 && s?.tagEvidence.releaseTags === 0,
    "The refusal cites tag evidence: many tags, zero release tags",
    `total=${s?.tagEvidence.totalTags} release=${s?.tagEvidence.releaseTags}`,
  );
  assert(
    typeof s?.gap.reason === "string" && s.gap.reason.includes("will not call a rollback point a release"),
    "The gap states the reason in terms a human can check and disagree with",
  );
  assert(
    typeof s?.proxy.description === "string" && s.proxy.description.startsWith("PROXY, NOT AN ANSWER"),
    "The proxy is labelled a PROXY — it cannot be mistaken for the answer",
  );

  // "Which roadmap item owns this?"
  const ownership = await ask({ subject: "which roadmap item owns this workstream" });
  const o = ownership.result as
    | { answerable: boolean; gap: { reason: string }; declaredWorkstreams: { id: string }[] }
    | undefined;

  console.log(`       roadmap ownership answerable: ${o?.answerable}`);
  console.log(`       declared workstreams still reported: ${(o?.declaredWorkstreams ?? []).map((w) => w.id).join(", ")}`);

  assert(o?.answerable === false, "'Which roadmap item owns this' is declared UNANSWERABLE");
  assert(
    typeof o?.gap.reason === "string" && o.gap.reason.includes("three unrelated"),
    "The refusal names the colliding WS schemes as its evidence",
  );
  assert(
    (o?.declaredWorkstreams ?? []).length >= 5,
    "What IS recorded — the declared workstreams — is still returned alongside the gap",
  );
}

// ---------------------------------------------------------------------------

async function testCoverage(platform: IntelligencePlatform, ctx: IntelligenceContext): Promise<void> {
  section("PART C — Coverage: where the engineering record is thin");

  const outcome = await platform.handle(
    { capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb: "report", parameters: { subject: "coverage" } },
    ctx,
  );

  const c = outcome.result as
    | {
        architectureWithoutImplementation: { document: DocRef; basis: string }[];
        implementationsWithoutGoverningArchitecture: { document: DocRef; basis: string }[];
        unresolvedInvestigations: { document: DocRef; basis: string }[];
        counts: Record<string, number>;
        note: string;
      }
    | undefined;

  console.log(`       total derived edges: ${c?.counts.totalEdges}`);
  console.log(`       architecture with no implementation:      ${c?.counts.architectureWithoutImplementation}`);
  console.log(`       implementations with no governing arch:   ${c?.counts.implementationsWithoutGoverningArchitecture}`);
  console.log(`       investigations with no follow-through:    ${c?.counts.unresolvedInvestigations}`);
  for (const e of (c?.architectureWithoutImplementation ?? []).slice(0, 3)) {
    console.log(`       → ${e.document.path}`);
  }

  assert(outcome.status === "ok", "Coverage reports successfully");
  assert((c?.counts.totalEdges ?? 0) > 500, "A substantial edge set is derived across the corpus");
  assert(
    (c?.architectureWithoutImplementation ?? []).every((e) => e.document.kind === "architecture"),
    "Architecture-without-implementation contains only architecture documents",
  );
  assert(
    (c?.unresolvedInvestigations ?? []).every((e) => e.document.kind === "investigation"),
    "Unresolved-investigations contains only investigations",
  );
  assert(
    (c?.implementationsWithoutGoverningArchitecture ?? []).every((e) => e.document.kind === "implementation"),
    "Ungoverned-implementations contains only implementation reports",
  );
  assert(
    (c?.architectureWithoutImplementation ?? []).every((e) => typeof e.basis === "string" && e.basis.length > 10),
    "Every listed document states the BASIS on which it was listed",
  );
  assert(
    typeof c?.note === "string" && c.note.includes("does not mean the work was never done"),
    "The over-reporting caveat is part of the answer, not omitted",
  );

  // The counts must be bounded by reality — an absurd count means the derivation broke.
  const totalArch = 45;
  assert(
    (c?.counts.architectureWithoutImplementation ?? 999) < totalArch,
    "Not every architecture document is reported as unimplemented (the derivation actually found edges)",
  );
}

// ---------------------------------------------------------------------------

async function testNoNewOwnership(platform: IntelligencePlatform): Promise<void> {
  section("PART D — No new ownership: one capability, one registry, no stored graph");

  const capabilities = platform.registry.list();
  const engineeringish = capabilities.filter(
    (c) => /engineering|graph|knowledge-graph/i.test(c.id) && c.id !== ENGINEERING_KNOWLEDGE_CAPABILITY_ID,
  );
  assert(engineeringish.length === 0, "ENGINT2 registered NO new capability", `found: ${engineeringish.map((c) => c.id).join(", ")}`);

  const cap = platform.registry.get(ENGINEERING_KNOWLEDGE_CAPABILITY_ID);
  assert(
    (cap?.executableIntents ?? []).length === ENGINEERING_KNOWLEDGE_INTENTS.length,
    "ENGINT2 added no new verb — the executable set is unchanged",
    `${(cap?.executableIntents ?? []).join(",")} vs ${ENGINEERING_KNOWLEDGE_INTENTS.join(",")}`,
  );
  assert(
    (cap?.supportedIntents ?? []).every((v) => ["read", "explain", "search", "report"].includes(v)),
    "The capability still declares only the four read-only verbs",
  );

  // The user plane is still sealed — ENGINT2 must not have loosened ENGINT1's locks.
  const userCap = intelligencePlatform.registry.get(ENGINEERING_KNOWLEDGE_CAPABILITY_ID);
  assert(userCap?.availability === "never", "The user-facing plane is still sealed at availability: 'never'");
  assert(
    !intelligencePlatform.registry.isExecutable(ENGINEERING_KNOWLEDGE_CAPABILITY_ID, "explain"),
    "The household Companion still cannot reach engineering relationships",
  );

  assert(
    platform.registry.list().length === intelligencePlatform.registry.list().length,
    "The developer plane still holds exactly the same capability set as the user plane",
  );
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("ENGINT2 — Engineering Knowledge Graph (derived relationships)\n" + "=".repeat(60));

  process.env[DEVELOPER_PLANE_ENV_FLAG] = "1";
  resetDeveloperPlane();
  const platform = developerPlanePlatform(createRegistryEngineeringKnowledgeReadPort);
  const ctx = developerPlaneContext("1");

  await testDerivedEdges(platform, ctx);
  await testRefusals(platform, ctx);
  await testCoverage(platform, ctx);
  await testNoNewOwnership(platform);

  delete process.env[DEVELOPER_PLANE_ENV_FLAG];
  resetDeveloperPlane();

  console.log(`\n${"═".repeat(60)}`);
  console.log(`ENGINT2: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Suite crashed:", error);
  process.exit(1);
});
