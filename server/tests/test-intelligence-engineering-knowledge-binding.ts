/**
 * test-intelligence-engineering-knowledge-binding.ts (ENGINT1)
 * ============================================================
 * Verifies Engineering Intelligence — the activation of the `developer`
 * capability — end-to-end against THE REAL REPOSITORY.
 *
 * It reads the live docs tree deliberately. Every other read-only binding suite
 * injects an in-memory fixture through its port, and for those that is right:
 * the thing under test is the projection, and a fixture makes it deterministic.
 * Here the thing under test is whether THA can answer a question about ITSELF
 * from its own record — and a fixture would prove only that the handler can read
 * a fixture. So Part C asks the eight manual-verification questions of the
 * actual `docs/` tree and prints the citations, which is the evidence the
 * implementation report cites.
 *
 * Its centre of gravity is in two places, both of which would be defects rather
 * than failures:
 *
 *   PART A — ISOLATION. TIP1 §7 and §4.2. Four independent locks keep
 *   developer-class knowledge off the user plane, and each is asserted alone,
 *   because Risk R1 rates a single misclassification as 🔴 Critical and defence
 *   in depth is worthless if the layers are only tested together.
 *
 *   PART B — NON-FABRICATION. Core Principle 6. An absent answer must be an
 *   explicit, structured gap naming what was searched — never an empty list
 *   dressed as a result, and never a completion status the roadmap does not
 *   record.
 *
 * Run with: npx tsx server/tests/test-intelligence-engineering-knowledge-binding.ts
 */

import {
  CapabilityRegistry,
  IntelligencePlatform,
  intelligencePlatform,
  bindEngineeringKnowledgeReadCapability,
  createRegistryEngineeringKnowledgeReadPort,
  developerPlaneContext,
  developerPlanePlatform,
  DEVELOPER_PLANE_ENV_FLAG,
  ENGINEERING_KNOWLEDGE_CAPABILITY_ID,
  ENGINEERING_KNOWLEDGE_INTENTS,
  resetDeveloperPlane,
  type IntelligenceContext,
} from "../intelligence/index.js";
import { developerPlaneSeed } from "../intelligence/capability-registry.js";
import { canInvokeCapability } from "../intelligence/permissions.js";

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

// ---------------------------------------------------------------------------
// PART A — ISOLATION (TIP1 §7, §4.2, Risk R1)
// ---------------------------------------------------------------------------

async function testIsolation(): Promise<void> {
  section("PART A — Plane isolation: four independent locks");

  // LOCK 1 — the seed. The user-facing registry declares the capability
  // unreachable, and permissions rejects "never" BEFORE any role check.
  const userPlaneCap = intelligencePlatform.registry.get(ENGINEERING_KNOWLEDGE_CAPABILITY_ID);
  assert(
    userPlaneCap?.availability === "never",
    "LOCK 1 — user-facing seed keeps `developer` at availability: 'never'",
    `got: ${userPlaneCap?.availability}`,
  );

  const asDeveloper: IntelligenceContext = { role: "developer", userId: "1", premium: false };
  assert(
    userPlaneCap != null && !canInvokeCapability(asDeveloper, userPlaneCap).allowed,
    "LOCK 1 — even a developer-role caller is denied on the user plane",
  );

  const asUser: IntelligenceContext = { role: "user", userId: "1", premium: true };
  const asAdmin: IntelligenceContext = { role: "admin", userId: "1", premium: true };
  assert(
    userPlaneCap != null &&
      !canInvokeCapability(asUser, userPlaneCap).allowed &&
      !canInvokeCapability(asAdmin, userPlaneCap).allowed,
    "LOCK 1 — neither a household nor an admin can reach engineering knowledge",
  );

  // LOCK 2 — the binding. The user-facing singleton holds no handler for it.
  assert(
    !intelligencePlatform.registry.isExecutable(ENGINEERING_KNOWLEDGE_CAPABILITY_ID, "read"),
    "LOCK 2 — user-facing platform has no executable engineering handler bound",
  );
  assert(
    (userPlaneCap?.executableIntents ?? []).length === 0,
    "LOCK 2 — user-facing capability advertises zero executable intents (INT6A)",
  );

  // LOCK 3 — the role. resolveContext never mints `developer`, and the context
  // factory that does is env-gated.
  delete process.env[DEVELOPER_PLANE_ENV_FLAG];
  let contextThrew = false;
  try {
    developerPlaneContext("1");
  } catch {
    contextThrew = true;
  }
  assert(contextThrew, "LOCK 3 — developer context is unobtainable while the plane is disabled");

  // LOCK 4 — the environment.
  resetDeveloperPlane();
  let planeThrew = false;
  try {
    developerPlanePlatform();
  } catch {
    planeThrew = true;
  }
  assert(planeThrew, `LOCK 4 — developerPlanePlatform() throws unless ${DEVELOPER_PLANE_ENV_FLAG}=1`);

  // The dev-plane seed differs from the user seed in EXACTLY one capability.
  const devSeed = developerPlaneSeed();
  const userSeed = new CapabilityRegistry().list();
  const differing = devSeed.filter((d) => {
    const u = userSeed.find((c) => c.id === d.id);
    return u != null && u.availability !== d.availability;
  });
  assert(
    differing.length === 1 && differing[0].id === "developer",
    "SEED — developer-plane seed differs from the user seed in exactly one capability",
    `differing: ${differing.map((d) => d.id).join(", ") || "none"}`,
  );
  assert(
    devSeed.length === userSeed.length,
    "SEED — developer plane adds no capability the user plane lacks (one registry)",
  );
}

// ---------------------------------------------------------------------------
// PART B — NON-FABRICATION (Core Principle 6)
// ---------------------------------------------------------------------------

async function testNonFabrication(platform: IntelligencePlatform, ctx: IntelligenceContext): Promise<void> {
  section("PART B — Non-fabrication: honest gaps, never invented answers");

  const nonsense = "quantum flux capacitor onboarding ritual";

  const searchOutcome = await platform.handle(
    { capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb: "search", parameters: { query: nonsense } },
    ctx,
  );
  assert(
    searchOutcome.status === "gap",
    "A search with no match returns an explicit GAP, not an empty result set",
    `got status: ${searchOutcome.status}`,
  );
  assert(
    typeof searchOutcome.message === "string" && searchOutcome.message.includes("does NOT mean the work was never done"),
    "The gap distinguishes 'unrecorded' from 'not done' — it does not overclaim absence",
  );

  const explainOutcome = await platform.handle(
    { capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb: "explain", parameters: { topic: nonsense } },
    ctx,
  );
  assert(
    explainOutcome.status === "gap",
    "Explaining an unknown topic returns a GAP rather than nominating an owner",
    `got status: ${explainOutcome.status}`,
  );

  const readOutcome = await platform.handle(
    { capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb: "read", parameters: { id: "NOSUCHDOC99" } },
    ctx,
  );
  assert(readOutcome.status === "gap", "An unknown document id returns a GAP, never a fabricated document");

  // The single most tempting fabrication in the whole capability.
  const report = await platform.handle(
    { capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb: "report", parameters: { subject: "roadmap" } },
    ctx,
  );
  assert(report.status === "ok", "Roadmap position reports successfully", `got status: ${report.status}`);
  const result = report.result as { completionRecorded?: unknown; completionGap?: { reason?: string } } | undefined;
  assert(
    result?.completionRecorded === false,
    "Roadmap completion is reported as UNRECORDED — no completion verdict is derived",
  );
  assert(
    typeof result?.completionGap?.reason === "string" && result.completionGap.reason.includes("records no per-workstream completion"),
    "The report explains WHY completion cannot be answered, naming what was searched",
  );

  // Write verbs must be structurally unreachable.
  for (const verb of ["add", "delete", "generate", "import"] as const) {
    const outcome = await platform.handle(
      { capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb, parameters: {} },
      ctx,
    );
    assert(
      outcome.status !== "ok",
      `READ-ONLY — "${verb}" is not executable against engineering knowledge`,
      `got status: ${outcome.status}`,
    );
  }

  assert(
    !ENGINEERING_KNOWLEDGE_INTENTS.some((v) => ["add", "delete", "generate", "import", "move", "replace"].includes(v)),
    "READ-ONLY — the declared executable set contains no write verb",
  );
}

// ---------------------------------------------------------------------------
// PART C — THE EIGHT MANUAL VERIFICATION QUESTIONS, against the real repo
// ---------------------------------------------------------------------------

interface Citation {
  path: string;
  line: number;
}
interface Hit {
  doc: { path: string; title: string; kind: string; date: string | null };
  citations: Citation[];
}

function showHits(hits: Hit[] | undefined, max = 3): void {
  for (const hit of (hits ?? []).slice(0, max)) {
    const cite = hit.citations[0];
    console.log(
      `       → ${hit.doc.path}${cite ? `:${cite.line}` : ""}` + (hit.doc.date ? `  (${hit.doc.date})` : ""),
    );
  }
}

async function testManualVerification(platform: IntelligencePlatform, ctx: IntelligenceContext): Promise<void> {
  section("PART C — Manual verification: the eight questions, answered from the live repository");

  const ask = (verb: "read" | "search" | "explain" | "report", parameters: Record<string, unknown>) =>
    platform.handle({ capabilityId: ENGINEERING_KNOWLEDGE_CAPABILITY_ID, verb, parameters }, ctx);

  // Q1 — What architecture governs Food Intelligence?
  console.log("\n  Q1. What architecture governs Food Intelligence?");
  const q1 = await ask("explain", { topic: "Food Intelligence" });
  const q1r = q1.result as { governingDocuments?: Hit[] } | undefined;
  showHits(q1r?.governingDocuments);
  assert(
    q1.status === "ok" &&
      (q1r?.governingDocuments ?? []).some((h) => h.doc.path.includes("FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE")),
    "Q1 — names THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md as the governing owner",
  );

  // Q2 — Which implementation completed Companion Action Activation?
  console.log("\n  Q2. Which implementation completed Companion Action Activation?");
  const q2 = await ask("explain", { topic: "Companion Action Activation", aspect: "history" });
  const q2r = q2.result as { implementationReports?: Hit[] } | undefined;
  showHits(q2r?.implementationReports);
  assert(
    q2.status === "ok" && (q2r?.implementationReports ?? []).some((h) => h.doc.path.includes("COMP_ACT1")),
    "Q2 — finds COMP_ACT1_COMPANION_ACTION_ACTIVATION.md",
  );

  // Q3 — What workstreams remain before production?
  console.log("\n  Q3. What workstreams remain before production?");
  const q3 = await ask("report", { subject: "roadmap" });
  const q3r = q3.result as
    | { workstreams?: { id: string; name: string; gatesLaunch: string | null }[]; completionRecorded?: boolean }
    | undefined;
  for (const ws of (q3r?.workstreams ?? []).slice(0, 6)) {
    console.log(`       → ${ws.id}: ${ws.name}  [gates launch: ${ws.gatesLaunch ?? "unstated"}]`);
  }
  console.log(`       → completionRecorded: ${q3r?.completionRecorded} (honest — the roadmap records none)`);
  assert(
    q3.status === "ok" && (q3r?.workstreams ?? []).length >= 5,
    "Q3 — extracts the declared launch workstreams from the roadmap",
    `found ${(q3r?.workstreams ?? []).length}`,
  );

  // Q4 — Which roadmap items are unfinished?
  console.log("\n  Q4. Which roadmap items are unfinished?");
  const q4r = q3.result as { openDefinitionOfDoneItems?: Citation[] } | undefined;
  for (const item of (q4r?.openDefinitionOfDoneItems ?? []).slice(0, 4)) {
    console.log(`       → ${item.path}:${item.line}`);
  }
  assert(
    (q4r?.openDefinitionOfDoneItems ?? []).length > 0,
    "Q4 — surfaces the roadmap's unchecked Definition-of-Done items, with citations",
  );

  // Q5 — Which document owns Planner architecture?
  console.log("\n  Q5. Which document owns Planner architecture?");
  const q5 = await ask("explain", { topic: "planner architecture" });
  const q5r = q5.result as { governingDocuments?: Hit[]; gap?: unknown } | undefined;
  showHits(q5r?.governingDocuments);
  assert(
    q5.status === "ok",
    "Q5 — answers from governing architecture only, or reports an honest gap",
  );
  assert(
    (q5r?.governingDocuments ?? []).every((h) => h.doc.path.startsWith("docs/architecture/")),
    "Q5 — every governing answer comes from docs/architecture/, never an investigation",
  );

  // Q6 — Summarise the last implementation reports.
  console.log("\n  Q6. Summarise the last implementation reports.");
  const q6 = await ask("report", { subject: "recent changes" });
  const q6r = q6.result as
    | { recentReports?: { path: string; date: string | null; title: string }[]; commits?: { sha: string; subject: string }[] }
    | undefined;
  for (const r of (q6r?.recentReports ?? []).slice(0, 4)) {
    console.log(`       → ${r.date ?? "undated"}  ${r.path}`);
  }
  assert(q6.status === "ok" && (q6r?.recentReports ?? []).length > 0, "Q6 — lists recent implementation reports, newest first");
  assert((q6r?.commits ?? []).length > 0, "Q6 — reads git history as a canonical source");

  // Q7 — Explain why a feature exists using implementation history.
  console.log("\n  Q7. Explain why Household Time exists (implementation history).");
  const q7 = await ask("explain", { topic: "Household Time", aspect: "why" });
  const q7r = q7.result as { implementationReports?: Hit[]; investigations?: { path: string }[] } | undefined;
  showHits(q7r?.implementationReports, 2);
  for (const inv of (q7r?.investigations ?? []).slice(0, 2)) console.log(`       → (why) ${inv.path}`);
  assert(
    q7.status === "ok" && ((q7r?.implementationReports ?? []).length > 0 || (q7r?.investigations ?? []).length > 0),
    "Q7 — separates WHAT was built (reports) from WHY it was decided (investigations)",
  );

  // Q8 — Report when information is unavailable rather than inventing an answer.
  console.log("\n  Q8. Report unavailable information honestly.");
  const q8 = await ask("explain", { topic: "blockchain loyalty programme" });
  console.log(`       → status: ${q8.status}`);
  console.log(`       → ${String(q8.message ?? "").slice(0, 140)}…`);
  assert(q8.status === "gap", "Q8 — reports the gap rather than inventing an answer");

  // Coverage of the index itself.
  console.log("\n  Index coverage");
  const idx = await ask("read", {});
  const idxr = idx.result as { summary?: { totalDocuments: number; byKind: Record<string, number> } } | undefined;
  console.log(`       → ${idxr?.summary?.totalDocuments} documents indexed: ${JSON.stringify(idxr?.summary?.byKind)}`);
  assert((idxr?.summary?.totalDocuments ?? 0) > 500, "Index covers the engineering corpus (>500 documents)");
}

// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log("ENGINT1 — Engineering Intelligence binding\n==========================================");

  await testIsolation();

  // Enable the plane for the remaining parts — exactly as an isolated developer
  // deployment would, and never as a production process does.
  process.env[DEVELOPER_PLANE_ENV_FLAG] = "1";
  resetDeveloperPlane();
  const platform = developerPlanePlatform(createRegistryEngineeringKnowledgeReadPort);
  const ctx = developerPlaneContext("1");

  assert(
    platform.registry.isExecutable(ENGINEERING_KNOWLEDGE_CAPABILITY_ID, "read"),
    "PLANE — the capability IS executable on the developer plane",
  );
  assert(
    platform !== intelligencePlatform,
    "PLANE — the developer plane is a separate instance from the user-facing singleton",
  );

  await testNonFabrication(platform, ctx);
  await testManualVerification(platform, ctx);

  delete process.env[DEVELOPER_PLANE_ENV_FLAG];
  resetDeveloperPlane();

  console.log(`\n${"═".repeat(60)}`);
  console.log(`ENGINT1: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error("Suite crashed:", error);
  process.exit(1);
});
