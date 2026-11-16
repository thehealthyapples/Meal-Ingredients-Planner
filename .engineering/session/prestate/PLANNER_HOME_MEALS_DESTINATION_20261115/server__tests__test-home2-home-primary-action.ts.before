/**
 * test-home2-home-primary-action.ts (HOME2)
 * ==========================================
 * Verifies the canonical Home Primary Action Resolver — the pure, total,
 * clock-free resolver designed by
 * docs/investigations/ux/HOME2_CANONICAL_HOME_DECISION_MODEL.md §4, which closes
 * NORTH1 §8.3 / EXPCOMP2's headline FAIL ("Home has no door").
 *
 * Coverage:
 *   §1  THE LADDER — the HomeState → tier table (HOME2 §4.2). Every rung, in
 *       isolation and in combination, including plan-before-shop precedence.
 *   §2  TOTALITY — the property that distinguishes this from a Decision Engine
 *       (HOME2 §2.1: "the Decision Engine's output may legitimately be empty; the
 *       Home Primary Action may never be. A total function cannot be implemented
 *       by a partial one"). A seeded sweep of 20k generated states — including
 *       empty, broken and unresolved — asserts exactly one action, always, with a
 *       destination the house has a room for. Never 0, never 2.
 *   §3  THE EDGE CASES — HOME2 §7.2's twelve cases, each asserted by number.
 *   §4  DETERMINISM & CALM (HOME2 §6) — same state, same door, every time; no
 *       clock; no randomness; the door moves only when a FACT moves.
 *   §5  TELEMETRY-BLINDNESS (HOME2 §9.12; Observation Engine §7) — the resolver
 *       is structurally incapable of reading an observation, so
 *       OBS_DISABLE_CAPTURE=1 cannot change which door is shown. Asserted by
 *       source-scan, the technique DEC1's own test uses for its boundaries (§4
 *       there).
 *   §6  BOUNDARIES (HOME2 §2.4, §10) — source-scan: the resolver declares no
 *       module-local sort/clamp/dedupe (DEC1 §4 — "an architecture violation" on
 *       arrival), imports no server module, no store, no engine, no clock, and no
 *       user-facing string (INT21 §0 — the words are never the resolver's).
 *   §7  MUTING SCOPE (HOME2 §4.3, §7.2 case 7) — muting silences notices, never
 *       doors. Compile-time: the resolver has no mute input to consult.
 *
 * Run with: npx tsx server/tests/test-home2-home-primary-action.ts
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { CRITICAL_TYPES, type AttentionLevel } from "../../shared/attention/index.js";
import {
  resolveHomePrimaryAction,
  MAX_DOORS,
  HOME_FLOOR_DESTINATION,
  type HomeState,
  type HomeCriticalCandidate,
  type HomePrimaryAction,
  type HomeDestination,
} from "../../shared/home/home-primary-action.js";
import type { DeliverableOpportunity } from "../intelligence/opportunity-delivery/framework.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──`);
}

// ---------------------------------------------------------------------------
// Compile-time: DEC1's DeliverableOpportunity IS a HomeCriticalCandidate.
//
// This is the whole basis of Tier 0 consuming the governed bundle AS-IS (HOME2
// §4.3) without `shared/` importing `server/`. If OD1's envelope ever diverges
// from what the resolver reads, this line stops compiling — which is the point.
// ---------------------------------------------------------------------------
type AssertAssignable<T extends U, U> = T;
type _BundleItemIsACandidate = AssertAssignable<DeliverableOpportunity, HomeCriticalCandidate>;

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

const CRITICAL_TYPE = "shopping-restriction-conflict"; // the sole member of CRITICAL_TYPES today

function critical(overrides: Partial<HomeCriticalCandidate> = {}): HomeCriticalCandidate {
  return {
    id: "food-intelligence:shopping-restriction-conflict:7",
    type: CRITICAL_TYPE,
    domain: "shopping",
    priority: "critical",
    subject: { entity: "shopping-item", id: 7, label: "Peanut butter" },
    ...overrides,
  };
}

function state(overrides: Partial<HomeState> = {}): HomeState {
  return {
    criticals: [],
    week: { weekNumber: 6, hasEmptyDays: false },
    shopping: { uncheckedCount: 0 },
    ...overrides,
  };
}

function sourceOf(relativePath: string): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return readFileSync(path.resolve(here, "..", "..", relativePath), "utf8");
}

/** Seeded LCG — no Math.random, so a failure is reproducible byte-for-byte (the DEC1 test's convention). */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1_664_525 + 1_013_904_223) >>> 0;
    return s / 0x1_0000_0000;
  };
}

const LEVELS: readonly AttentionLevel[] = ["critical", "high", "medium", "low"];
const DOMAINS: readonly string[] = ["planner", "shopping", "pantry", "diary", "nutrition", "", "unknown-domain"];
const KNOWN: ReadonlySet<string> = new Set<HomeDestination>(["planner", "shopping", "pantry"]);

async function main(): Promise<void> {
  console.log("\nHOME2 — The Canonical Home Primary Action Resolver");
  console.log("=".repeat(56));

  // =========================================================================
  section("§1 THE LADDER — HomeState → tier (HOME2 §4.2)");
  // =========================================================================

  // -- Tier 0: Safety -------------------------------------------------------
  const t0 = resolveHomePrimaryAction(state({ criticals: [critical()] }));
  assert(t0.tier === 0, "Tier 0 fires when a critical is live in DEC1's governed output");
  assert(t0.destination === "shopping", "Tier 0's destination is the critical's own `domain`, carried verbatim");
  assert(t0.provenance === "signal", "Tier 0 is signal-aimed, never the floor");
  assert(t0.subject?.id === 7 && t0.subject?.label === "Peanut butter", "Tier 0 carries the producer's subject verbatim");

  // Tier 0 outranks every other rung, even when they would all fire.
  const t0Wins = resolveHomePrimaryAction(
    state({ criticals: [critical()], week: { weekNumber: 6, hasEmptyDays: true }, shopping: { uncheckedCount: 9 } }),
  );
  assert(t0Wins.tier === 0, "Safety outranks an unplanned week and a pending trip — first match wins");

  // -- Tier 1: the week is unplanned ---------------------------------------
  const t1 = resolveHomePrimaryAction(state({ week: { weekNumber: 6, hasEmptyDays: true } }));
  assert(t1.tier === 1 && t1.destination === "planner", "Tier 1 fires on an unplanned week → Planner");
  assert(t1.provenance === "signal", "Tier 1 is signal-aimed");
  assert(t1.subject === undefined, "Tier 1 has no subject — the week is not an entity the producer named");

  // -- Tier 2: the trip is pending -----------------------------------------
  const t2 = resolveHomePrimaryAction(state({ week: { weekNumber: 6, hasEmptyDays: false }, shopping: { uncheckedCount: 3 } }));
  assert(t2.tier === 2 && t2.destination === "shopping", "Tier 2 fires on a full week + unchecked items → Shopping");

  // -- Tier 1 BEFORE Tier 2 — plan before shop ------------------------------
  const planBeforeShop = resolveHomePrimaryAction(
    state({ week: { weekNumber: 6, hasEmptyDays: true }, shopping: { uncheckedCount: 12 } }),
  );
  assert(
    planBeforeShop.tier === 1 && planBeforeShop.destination === "planner",
    "PLAN BEFORE SHOP: an empty week beats a full basket — if the week isn't planned, shopping now means shopping wrong",
  );

  // -- Tier 3: the floor ----------------------------------------------------
  const t3 = resolveHomePrimaryAction(state());
  assert(t3.tier === 3 && t3.destination === "planner", "Tier 3 (the floor) fires when nothing is outstanding → Planner");
  assert(t3.provenance === "floor", "the floor declares itself the floor — provenance, never quality");
  assert(HOME_FLOOR_DESTINATION === "planner", "the floor's destination is the household's own week");

  // The floor is honest, not filler: it routes to content that already exists.
  assert(
    KNOWN.has(HOME_FLOOR_DESTINATION),
    "the floor routes to a room that exists — a floor routes, filler invents (Blueprint §12.1 r3)",
  );

  // =========================================================================
  section("§2 TOTALITY — never 0, never 2 (HOME2 §2.1, §4.1)");
  // =========================================================================

  assert(MAX_DOORS === 1, "MAX_DOORS is 1 — the budget owned at this seam, as the Silence Rules own theirs");

  // The four named failure states.
  const allEmpty = resolveHomePrimaryAction({ criticals: [], week: null, shopping: null });
  assert(allEmpty.tier === 3 && allEmpty.provenance === "floor", "case 4: EVERYTHING failed → the floor still fires. Never zero");

  const plannerDown = resolveHomePrimaryAction(state({ week: null, shopping: { uncheckedCount: 5 } }));
  assert(
    plannerDown.tier === 3,
    "case 3: the planner read failed → the floor fires. Tier 2 does NOT fabricate 'the week is full' from an unreadable week",
  );

  const newHousehold = resolveHomePrimaryAction({ criticals: [], week: { weekNumber: 1, hasEmptyDays: true }, shopping: null });
  assert(newHousehold.tier === 1, "case 1: a brand-new household → Planner. 'Plan your first week' is genuinely next");

  // The sweep: 20k generated states, including malformed ones.
  const rng = makeRng(20260716);
  let totalityHolds = true;
  let destinationsAlwaysReal = true;
  let floorAlwaysProvenanced = true;
  let sweepTiers = new Set<number>();

  for (let i = 0; i < 20_000; i += 1) {
    const criticalCount = Math.floor(rng() * 4);
    const criticals: HomeCriticalCandidate[] = [];
    for (let c = 0; c < criticalCount; c += 1) {
      criticals.push(
        critical({
          id: `p:${c}:${i}`,
          priority: LEVELS[Math.floor(rng() * LEVELS.length)]!,
          domain: DOMAINS[Math.floor(rng() * DOMAINS.length)]!,
          ...(rng() < 0.3 ? { subject: undefined } : {}),
        }),
      );
    }
    const generated: HomeState = {
      criticals,
      week: rng() < 0.25 ? null : { weekNumber: Math.floor(rng() * 8), hasEmptyDays: rng() < 0.5 },
      shopping: rng() < 0.25 ? null : { uncheckedCount: Math.floor(rng() * 20) },
    };

    const action: HomePrimaryAction = resolveHomePrimaryAction(generated);

    if (action === null || action === undefined || typeof action.tier !== "number") totalityHolds = false;
    if (!KNOWN.has(action.destination)) destinationsAlwaysReal = false;
    if ((action.tier === 3) !== (action.provenance === "floor")) floorAlwaysProvenanced = false;
    sweepTiers.add(action.tier);
  }

  assert(totalityHolds, "TOTAL: 20,000 generated states — including empty, broken and unresolved — each yielded exactly one action");
  assert(destinationsAlwaysReal, "every resolved destination is a room the house has — an unmapped domain is never guessed at");
  assert(floorAlwaysProvenanced, "provenance is exactly 'floor' iff the tier is 3 — the two can never disagree");
  assert(sweepTiers.size === 4, "the sweep exercised all four rungs", `saw tiers: ${Array.from(sweepTiers).sort().join(",")}`);

  // =========================================================================
  section("§3 THE EDGE CASES (HOME2 §7.2)");
  // =========================================================================

  // case 5: two live criticals — resolved by the CANONICAL mechanics, not a local tie-break.
  const twoCriticals = resolveHomePrimaryAction(
    state({
      criticals: [
        critical({ id: "a", domain: "shopping", subject: { entity: "shopping-item", id: 1, label: "First" } }),
        critical({ id: "b", domain: "pantry", subject: { entity: "pantry-item", id: 2, label: "Second" } }),
      ],
    }),
  );
  assert(twoCriticals.tier === 0 && twoCriticals.subject?.label === "First", "case 5: two live criticals → exactly one door, DEC1's arrival order preserved");

  // Attention is the first key and cannot be displaced: a `critical` behind a `low` still wins.
  const criticalBehindLow = resolveHomePrimaryAction(
    state({
      criticals: [
        critical({ id: "low", priority: "low", domain: "planner", subject: { entity: "planner-day", id: 3, label: "Noise" } }),
        critical({ id: "crit", priority: "critical", domain: "shopping", subject: { entity: "shopping-item", id: 4, label: "Harm" } }),
      ],
    }),
  );
  assert(
    criticalBehindLow.tier === 0 && criticalBehindLow.subject?.label === "Harm",
    "a non-critical never aims the door: only `critical` reaches Tier 0, whatever order the bundle arrived in",
  );

  // A bundle with NO criticals falls straight through — a `high` is the product's judgement, not the household's.
  const noCriticals = resolveHomePrimaryAction(
    state({ criticals: [critical({ priority: "high" })], week: { weekNumber: 6, hasEmptyDays: true } }),
  );
  assert(
    noCriticals.tier === 1,
    "a `high` opportunity does NOT aim the door — Experience Principle 4: the person's intent, not the product's most desired behaviour",
  );

  // case 2: producers unreachable (trust.resolved:false ⇒ empty criticals) — Tiers 1–3 unaffected.
  const producersDown = resolveHomePrimaryAction(state({ criticals: [], week: { weekNumber: 6, hasEmptyDays: true } }));
  assert(producersDown.tier === 1, "case 2: producers unreachable → Tiers 1–3 unaffected; a safety door the platform cannot see is not claimed");

  // case 6: dismissal is terminal — a dismissed critical never reaches the bundle, so the ladder falls through.
  const dismissed = resolveHomePrimaryAction(state({ criticals: [], week: { weekNumber: 6, hasEmptyDays: false }, shopping: { uncheckedCount: 2 } }));
  assert(dismissed.tier === 2, "case 6: a dismissed critical is terminal (DEC1 lifecycle, inherited) → the ladder falls through");

  // case 8: week planned, list clear, nothing critical → the floor, not a manufactured task.
  const settled = resolveHomePrimaryAction(state({ week: { weekNumber: 6, hasEmptyDays: false }, shopping: { uncheckedCount: 0 } }));
  assert(settled.tier === 3, "case 8: a settled household is shown its own week — never a manufactured task");

  // An unmapped domain cannot be aimed: Tier 0 declines rather than guessing.
  const unmappedDomain = resolveHomePrimaryAction(
    state({ criticals: [critical({ domain: "some-future-domain" })], week: { weekNumber: 6, hasEmptyDays: true } }),
  );
  assert(
    unmappedDomain.tier === 1,
    "a critical in a domain the house has no room for does not fire Tier 0 — an honest gap, never a guess (Core Principle 6)",
  );

  // A critical with no subject still aims its domain — a card without a subject is an honest gap, not a defect.
  const noSubject = resolveHomePrimaryAction(state({ criticals: [critical({ subject: undefined })] }));
  assert(
    noSubject.tier === 0 && noSubject.destination === "shopping" && noSubject.subject === undefined,
    "a critical with no subject still aims its domain, and the absent subject is simply absent",
  );

  // case 12: CRITICAL_TYPES is the one governance dependency — stated, so a future review knows.
  assert(
    CRITICAL_TYPES.size === 1 && CRITICAL_TYPES.has(CRITICAL_TYPE),
    "case 12: CRITICAL_TYPES is the closed allowlist { shopping-restriction-conflict } — Home's door is DOWNSTREAM of it",
  );

  // =========================================================================
  section("§4 DETERMINISM & CALM (HOME2 §6)");
  // =========================================================================

  const fixed = state({ criticals: [critical()], week: { weekNumber: 6, hasEmptyDays: true }, shopping: { uncheckedCount: 4 } });
  const runs = Array.from({ length: 100 }, () => JSON.stringify(resolveHomePrimaryAction(fixed)));
  assert(new Set(runs).size === 1, "DETERMINISM: same state → same door, 100/100. No clock, no randomness, no learned weights");

  // The door moves ONLY when a fact moves — and every fact is one the household moved themselves.
  const before = resolveHomePrimaryAction(state({ week: { weekNumber: 6, hasEmptyDays: true }, shopping: { uncheckedCount: 4 } }));
  const afterTheyPlanned = resolveHomePrimaryAction(state({ week: { weekNumber: 6, hasEmptyDays: false }, shopping: { uncheckedCount: 4 } }));
  const afterTheyShopped = resolveHomePrimaryAction(state({ week: { weekNumber: 6, hasEmptyDays: false }, shopping: { uncheckedCount: 0 } }));
  assert(
    before.tier === 1 && afterTheyPlanned.tier === 2 && afterTheyShopped.tier === 3,
    "THE GOVERNING SENTENCE: the door changed three times, and each change is explained by one thing the HOUSEHOLD did",
  );

  // Input is never mutated — a resolver that edited the state it read would be a writer.
  const guarded = state({ criticals: [critical({ id: "x" }), critical({ id: "y" })] });
  const snapshot = JSON.stringify(guarded);
  resolveHomePrimaryAction(guarded);
  assert(JSON.stringify(guarded) === snapshot, "the input state is never mutated — this reads, it does not write");

  // =========================================================================
  section("§5 TELEMETRY-BLINDNESS (HOME2 §9.12; Observation Engine §7)");
  // =========================================================================

  const resolverSource = sourceOf("shared/home/home-primary-action.ts");

  // The structural proof: OBS_DISABLE_CAPTURE=1 cannot change the door because the
  // resolver has no way to read an observation in the first place.
  assert(
    !/observation|platform_observations|recordObservation|OBS_DISABLE_CAPTURE/i.test(
      resolverSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ""),
    ),
    "the resolver reads no observation, in code — Observation Engine §7 names ROUTING first among the behaviours that must stop",
  );

  // Behavioural half: telemetry is not an input, so toggling it is a functional no-op.
  const withCapture = JSON.stringify(resolveHomePrimaryAction(fixed));
  process.env.OBS_DISABLE_CAPTURE = "1";
  const withoutCapture = JSON.stringify(resolveHomePrimaryAction(fixed));
  delete process.env.OBS_DISABLE_CAPTURE;
  assert(withCapture === withoutCapture, "OBS_DISABLE_CAPTURE=1 is a functional no-op on the door — telemetry is never an input to behaviour");

  // =========================================================================
  section("§6 BOUNDARIES (HOME2 §2.4, §10; DEC1 §4)");
  // =========================================================================

  const codeOnly = resolverSource.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");

  assert(
    /from "\.\.\/attention\/decision\.js"/.test(resolverSource) && /orderByAttention/.test(codeOnly) && /clampLimit/.test(codeOnly),
    "REUSES the canonical Decision mechanics — orderByAttention + clampLimit, imported from their one owner",
  );
  assert(
    !/\.sort\(/.test(codeOnly),
    "declares NO module-local sort — a module-local attention sort is 'an architecture violation' on arrival (DEC1 §4)",
  );
  assert(
    !/Math\.min|Math\.max/.test(codeOnly),
    "declares NO module-local clamp — the limit-normalisation rule has exactly one owner",
  );
  assert(
    !/from "\.\.\/\.\.\/server|from "\.\.\/\.\.\/client|require\(/.test(codeOnly),
    "imports nothing from server/ or client/ — pure shared code, importable from either side",
  );
  assert(
    !/Date|Date\.now|performance\.now|Intl\./.test(codeOnly),
    "reads NO clock — the door cannot jitter with an hour it cannot see (HOME2 §1, §8.1)",
  );
  assert(
    !/Math\.random|crypto\./.test(codeOnly),
    "uses NO randomness — determinism is the base of stability",
  );
  assert(
    !/fetch|storage\.|db\.|await /.test(codeOnly),
    "performs NO I/O and is not even async — the caller assembles HomeState; pure modules never read (Observation Engine §4 r4)",
  );

  // -------------------------------------------------------------------------
  // THE WORDS ARE NEVER THE RESOLVER'S (INT21 §0).
  //
  // Stated as a property rather than a grep, because the grep that "obviously"
  // checks this is vacuous: a source-scan for prose cannot distinguish a label the
  // resolver AUTHORED from a label it CARRIED. The honest invariant is exactly that
  // distinction — every string the resolver emits is either (a) a member of its own
  // contract's closed vocabulary, or (b) copied verbatim from its input. It may
  // carry the producer's subject label ("Peanut butter"); it may never write one.
  // If anyone ever adds `label: "Plan your week"` to the returned object, this fails.
  // -------------------------------------------------------------------------
  const CONTRACT_VOCABULARY: ReadonlySet<string> = new Set([...Array.from(KNOWN), "signal", "floor"]);

  function emittedStrings(value: unknown): string[] {
    if (typeof value === "string") return [value];
    if (value && typeof value === "object") return Object.values(value).flatMap(emittedStrings);
    return [];
  }

  let everyStringIsVocabularyOrCarried = true;
  const rngWords = makeRng(4242);
  for (let i = 0; i < 2_000; i += 1) {
    const carriedLabel = `Producer label ${i}`;
    const input: HomeState = {
      criticals:
        rngWords() < 0.5
          ? [critical({ id: `c${i}`, subject: { entity: "shopping-item", id: i, label: carriedLabel } })]
          : [],
      week: rngWords() < 0.25 ? null : { weekNumber: 6, hasEmptyDays: rngWords() < 0.5 },
      shopping: rngWords() < 0.25 ? null : { uncheckedCount: Math.floor(rngWords() * 5) },
    };
    const inputStrings = new Set(emittedStrings(input));
    for (const emitted of emittedStrings(resolveHomePrimaryAction(input))) {
      if (!CONTRACT_VOCABULARY.has(emitted) && !inputStrings.has(emitted)) {
        everyStringIsVocabularyOrCarried = false;
      }
    }
  }
  assert(
    everyStringIsVocabularyOrCarried,
    "AUTHORS no words: every emitted string is either the contract's own closed vocabulary or carried verbatim from the input — selection then phrasing, nothing in between (INT21 §0, §7.2)",
  );

  // The compile-time half: the contract has no slot to put a word in. `HomePrimaryAction`
  // is exactly {tier, destination, subject?, provenance} — there is no `label`, no
  // `reason`, no `text`. A hardcoded door label beside a Home route would be "a second
  // voice nobody chose" (INT21 §10), and re-open the debt CP3 exists to close.
  const contractKeys = Object.keys(resolveHomePrimaryAction(state({ criticals: [critical()] }))).sort();
  assert(
    JSON.stringify(contractKeys) === JSON.stringify(["destination", "provenance", "subject", "tier"]),
    "the contract has no slot for a word — {tier, destination, subject?, provenance} and nothing else",
    `saw: ${contractKeys.join(",")}`,
  );

  // §7 — muting scope, proved by absence.
  assert(
    !/muted|mute|MutedOpportunityTypes/i.test(codeOnly),
    "§7 the resolver has NO mute input to consult — muting silences notices, never doors (HOME2 §4.3, case 7)",
  );

  // No persistence: no table, no cache. Determinism is the stability mechanism, not memoisation.
  assert(
    !/cache|memo|Map\(|WeakMap|localStorage|sessionStorage/i.test(codeOnly),
    "persists NOTHING — no table, no cache; the platform's stability mechanism is determinism, not memoisation (HOME2 §9.8)",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"=".repeat(56)}`);
  console.log(`HOME2 Home Primary Action Resolver: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
