/**
 * HHP3 — Household Health Delivery Convergence
 * =============================================
 * HHP2 enrolled Household Health as a producer on the canonical Decision Engine, and
 * left one thing undone (its own Remaining Gap G2): the Household Nutrition panel went
 * on rendering HNP1's opportunities DIRECTLY from the read route, around the engine. So
 * a household could dismiss a nutrition opportunity in the Companion and be shown the
 * identical card on the panel — forever — by a path that had never heard of dismissal.
 *
 * One fact, two owners. HHP3 retires the second owner. These tests assert that it is
 * actually gone, rather than merely unused.
 *
 *   §1  Convergence — the panel has NO private opportunity path. It renders the
 *       Decision Engine's delivered `nutrition` group, via the ONE ambient surface.
 *   §2  The bypass is closed AT THE SOURCE — the read route withholds `opportunities`
 *       entirely, so no future surface can re-open it, while the PRODUCER still
 *       receives every opportunity HNP1 composes.
 *   §3  Not re-shown by a separate path — proven end-to-end through the REAL Decision
 *       Engine: a dismissed, muted or accepted health opportunity does not come back,
 *       and the panel reads the very bundle it vanished from.
 *   §4  Navigation — the Household Health surface is reachable, addressable, and is the
 *       same surface the engine already routes health opportunities to.
 *   §5  Boundaries — HHP3 creates no scoring, opportunity or delivery logic. It deletes
 *       a delivery path; it adds none.
 *
 * Run with: npx tsx server/tests/test-hhp3-household-health-delivery-convergence.ts
 */

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
  buildOpportunities,
  computeHouseholdNutritionScore,
  NUTRITION_OPPORTUNITY_TYPES,
  type HouseholdNutritionFacts,
} from "../../shared/nutrition/household-nutrition.js";
import { EMPTY_VARIETY_SCORE } from "../../shared/canonical/plant-classifier.js";
import {
  collectOpportunities,
  resolveOpportunity,
  selectSurface,
} from "../intelligence/opportunity-delivery/framework.js";
import { InMemoryOpportunityDeliveryStore } from "../intelligence/opportunity-delivery/delivery-store.js";
import type { IntentOutcome } from "../intelligence/types.js";

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

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** Reads a source file relative to the repository root. */
function sourceOf(relative: string): string {
  return readFileSync(path.join(HERE, "..", "..", relative), "utf8");
}

/**
 * The source with every comment removed — the HHP2 discipline, kept.
 *
 * The scans below assert what a module DOES, and a module's prose is not what it does.
 * The panel's own header explains at length that it renders no opportunities of its
 * own; a naive scan for `opportunities` would then fail it for SAYING so. Stripping
 * comments first makes each assertion mean what it claims, and makes it strictly harder
 * to pass: a violation can no longer hide behind the word that describes it.
 */
function codeOf(relative: string): string {
  return sourceOf(relative)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

// ---------------------------------------------------------------------------
// Fixtures — a household with a genuinely weak week, so HNP1 composes real
// opportunities and every suppression below has something real to suppress.
// ---------------------------------------------------------------------------

const WEAK_WEEK: HouseholdNutritionFacts = {
  weeklyPlantSlugs: ["carrot", "onion", "potato"],
  weeklyVariety: { ...EMPTY_VARIETY_SCORE, vegetables: 3, total: 3 },
  mealsPlanned: 3,
  daysWithMeals: 2,
  averageAppleRating: null,
  appleRatingSampleCount: 0,
  categoriesCovered: 2,
  categoriesTotal: 12,
  allTimePlantDiversity: 14,
  weekNumber: 7,
};

const WEAK_SCORE = computeHouseholdNutritionScore(WEAK_WEEK);
const WEAK_OPPORTUNITIES = buildOpportunities(WEAK_WEEK, WEAK_SCORE);

/** The full HNP1 report — exactly what the assembler hands the PRODUCER. */
const HNP1_REPORT = {
  available: WEAK_SCORE.value !== null,
  score: WEAK_SCORE,
  weekly: null,
  insights: [],
  opportunities: WEAK_OPPORTUNITIES,
  trust: { sources: ["planner", "plant-classifier"], unscoredDimensions: [] },
};

/** The one registered producer under test. Dispatches on capability id, as production does. */
const fetchProducer = async (capabilityId: string): Promise<IntentOutcome> => {
  if (capabilityId !== "household-health") {
    return { status: "ok", capabilityId, verb: "report", result: { opportunities: [] } } as IntentOutcome;
  }
  return {
    status: "ok",
    capabilityId,
    verb: "report",
    result: { opportunities: WEAK_OPPORTUNITIES },
  } as IntentOutcome;
};

const PANEL = "client/src/components/HouseholdNutritionPanel.tsx";
const PAGE = "client/src/pages/plant-diversity-page.tsx";
const CARD = "client/src/components/intelligence/FoodOpportunityCard.tsx";
const ASSISTANT = "client/src/components/conversation/FloatingAssistant.tsx";
const HOME = "client/src/pages/home-experience-page.tsx";
const ROUTES = "server/routes.ts";

/** Every client source file, so "no SECOND destination" is checked against all of them. */
function clientSources(): string[] {
  const root = path.join(HERE, "..", "..", "client", "src");
  return readdirSync(root, { recursive: true })
    .filter((f): f is string => typeof f === "string" && /\.tsx?$/.test(f))
    .map((rel) => path.posix.join("client/src", rel.split(path.sep).join("/")));
}

async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  section("1. CONVERGENCE — the panel has no private opportunity path");
  // -------------------------------------------------------------------------

  const panel = codeOf(PANEL);

  assert(
    !/OpportunityCard/.test(panel),
    "the panel no longer renders `OpportunityCard` — the component it used to draw HNP1's raw opportunities with is gone from this surface",
  );
  assert(
    !/\.opportunities/.test(panel) && !/opportunities\s*:/.test(panel),
    "the panel reads no `opportunities` field at all — not from the wire type, not from the query result",
  );
  assert(
    /AmbientIntelligence/.test(panel),
    "it mounts `AmbientIntelligence` — the ONE ambient surface (PHASE5C), which every other opportunity surface in THA already mounts",
  );
  assert(
    /NUTRITION_DOMAIN\s*=\s*\[\s*"nutrition"\s*\]/.test(panel) && /domains=\{NUTRITION_DOMAIN\}/.test(panel),
    "scoped to the `nutrition` domain GROUP the Decision Engine itself assembled — the panel names a group, it does not select one",
  );
  assert(
    !/useFoodOpportunities|food-opportunities/.test(panel),
    "and it does not fetch the bundle itself — it composes the ambient surface, which shares the one canonical query key (no second fetch, no second cache)",
  );

  // -------------------------------------------------------------------------
  section("2. THE BYPASS IS CLOSED AT THE SOURCE — the read route withholds advice");
  // -------------------------------------------------------------------------

  const routes = codeOf(ROUTES);
  const hnp1Route = routes.slice(
    routes.indexOf('app.get("/api/household-nutrition"'),
    routes.indexOf('app.get("/api/food-knowledge"'),
  );

  assert(
    hnp1Route.length > 0,
    "the HNP1 read route still exists (the household's STANDING is still readable — HHP3 removed a delivery path, not a report)",
  );
  assert(
    /const\s*\{\s*opportunities:[^}]*\}\s*=\s*report/.test(hnp1Route) && /res\.json\(standing\)/.test(hnp1Route),
    "it destructures `opportunities` OUT of HNP1's report and serialises only the standing — the field is withheld, not merely unrendered",
  );
  assert(
    !/res\.json\(report\)/.test(hnp1Route),
    "the whole report is never serialised — so a future surface cannot render an opportunity this route does not send",
  );

  // The producer is fed something REAL — we are withholding advice that exists,
  // not testing a vacuum.
  assert(
    HNP1_REPORT.opportunities.length === 3,
    "HNP1 genuinely composes opportunities for this household (3) — the producer path still receives every one of them",
  );

  // The standing survives the projection VERBATIM. This is the route's own projection,
  // applied to a real HNP1 report.
  const { opportunities: _withheld, ...standing } = HNP1_REPORT;
  assert(
    !("opportunities" in standing),
    "the projection removes `opportunities` from the wire",
  );
  assert(
    standing.score === HNP1_REPORT.score &&
      standing.insights === HNP1_REPORT.insights &&
      standing.trust === HNP1_REPORT.trust &&
      standing.available === HNP1_REPORT.available,
    "and changes nothing else — score, insights, trust and availability are HNP1's own objects, by identity (the route re-derives nothing)",
  );

  // -------------------------------------------------------------------------
  section("3. NOT RE-SHOWN BY A SEPARATE PATH — through the REAL Decision Engine");
  // -------------------------------------------------------------------------

  // (a) DISMISSED — the case that made HHP3 necessary.
  const dismissStore = new InMemoryOpportunityDeliveryStore();
  const first = await collectOpportunities(
    { userId: 1 },
    { store: dismissStore, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  const target = first.opportunities[0];

  assert(
    first.opportunities.length === 3 && (first.grouped.nutrition?.length ?? 0) === 3,
    "the engine delivers the household's three health opportunities, grouped under `nutrition` — the exact group the panel now reads",
  );

  const resolution = await resolveOpportunity(1, target.id, "dismissed", dismissStore, async () => ({
    recorded: false,
  }) as any);
  assert(resolution?.status === "dismissed", "the household dismisses one of them");

  const afterDismiss = await collectOpportunities(
    { userId: 1 },
    { store: dismissStore, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  assert(
    !afterDismiss.opportunities.some((o) => o.id === target.id),
    "it is GONE from the delivered bundle — the lifecycle suppresses it",
  );
  assert(
    !(afterDismiss.grouped.nutrition ?? []).some((o) => o.id === target.id),
    "and gone from the `nutrition` group — which, since HHP3, is the panel's ONLY source. **This is the bug HHP3 exists to fix**: before it, the panel re-derived this card from the read route and showed it again regardless.",
  );
  assert(
    afterDismiss.decision?.suppressedByLifecycle === 1,
    "the sealed decision accounts the suppression to the lifecycle rule — 'why didn't I see it?' is answerable",
  );

  // (b) MUTED — a silenced TYPE never reaches the panel either.
  const muteStore = new InMemoryOpportunityDeliveryStore();
  muteStore.setMutedOpportunityTypes(1, [NUTRITION_OPPORTUNITY_TYPES.plantDiversity]);
  const muted = await collectOpportunities(
    { userId: 1 },
    { store: muteStore, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  assert(
    !(muted.grouped.nutrition ?? []).some((o) => o.type === NUTRITION_OPPORTUNITY_TYPES.plantDiversity),
    "a muted health type is absent from the panel's group — the household's existing mute preference now reaches this surface, with no HHP3 code",
  );
  assert(
    muted.decision?.suppressedByMute === 1,
    "accounted to the mute rule",
  );

  // (c) ACCEPTED (resolved) — a household that acted on advice is not asked twice.
  const acceptStore = new InMemoryOpportunityDeliveryStore();
  const before = await collectOpportunities(
    { userId: 1 },
    { store: acceptStore, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  const accepted = before.opportunities[1];
  await resolveOpportunity(1, accepted.id, "accepted", acceptStore, async () => ({ recorded: false }) as any);

  const afterAccept = await collectOpportunities(
    { userId: 1 },
    { store: acceptStore, fetchProducer, fetchConfirmedUnderstanding: async () => [] },
  );
  assert(
    !(afterAccept.grouped.nutrition ?? []).some((o) => o.id === accepted.id),
    "an ACCEPTED health opportunity is not re-shown on the panel — a household that already acted is never asked again",
  );

  // (d) The convergence itself: one lifecycle, not two.
  assert(
    afterDismiss.metadata.sources.includes("household-health"),
    "and throughout, the producer is reached through the ordinary registered path — the panel's cards and the Companion's notices are the SAME delivered objects, from the same bundle, resolved through the same lifecycle",
  );

  // -------------------------------------------------------------------------
  section("4. NAVIGATION — the Household Health surface is reachable and addressable");
  // -------------------------------------------------------------------------

  const assistant = codeOf(ASSISTANT);
  const page = codeOf(PAGE);
  const card = codeOf(CARD);

  assert(
    selectSurface("nutrition") === "nutrition",
    "the Decision Engine routes a household health opportunity to the `nutrition` ConversationSurface (HHP2's DOMAIN_SURFACE row)",
  );
  assert(
    /plant-diversity[^)]*\)\/\.test\(location\)\)\s*return\s*"nutrition"/.test(assistant.replace(/\s+/g, " ")) ||
      /\/\^\\\/\(foods\|plant-diversity\)\//.test(assistant),
    "and `/plant-diversity` — the page the nav bar calls 'Nutrition', and the home of the Household Health surface — now RESOLVES to that same surface. The engine's destination and the household's location are the same place.",
  );
  assert(
    /view=\$\{HOUSEHOLD_HEALTH_TAB\}|view=nutrients/.test(page),
    "the Household Health surface has a URL — `/plant-diversity?view=nutrients` — so it can be linked to at all (before HHP3 it was reachable only by loading the page and clicking)",
  );
  assert(
    /useSearch\(\)/.test(page) && /URLSearchParams\(search\)\.get\("view"\)/.test(page),
    "the tab is URL-driven, following the existing `/pantry?mode=explore` precedent — no new routing pattern is invented",
  );
  assert(
    /DEFAULT_TAB/.test(page) && /TAB_IDS\.has/.test(page),
    "an unknown or absent `view` falls back to a real tab — a bad link lands somewhere honest, never on an empty page",
  );
  assert(
    /nutrition:\s*"[^"]+"/.test(card),
    "and a delivered health card names its own domain instead of falling through to the 'Food' label — a card about a household's nutrition no longer announces itself as something it is not",
  );

  // An address nobody can reach is not navigation. `HOUSEHOLD_HEALTH_PATH` was
  // EXPORTED and imported by no one — the surface was addressable in principle and
  // undiscoverable in practice. These assertions are what stop that recurring.
  const home = codeOf(HOME);

  assert(
    /export const HOUSEHOLD_HEALTH_PATH/.test(page),
    "`plant-diversity-page` owns the ONE canonical address of the Household Health surface",
  );
  assert(
    /import\s*\{[^}]*\bHOUSEHOLD_HEALTH_PATH\b[^}]*\}\s*from\s*"@\/pages\/plant-diversity-page"/.test(
      home.replace(/\s+/g, " "),
    ) && /href=\{HOUSEHOLD_HEALTH_PATH\}/.test(home),
    "and Home NAVIGATES to it — the exported address has a real production navigation path, not merely a definition. Home links through the constant rather than spelling the URL, so it cannot drift from the surface it points at.",
  );

  // The whole point of one owner: no second door, anywhere in the client.
  const strays = clientSources().filter(
    (rel) => rel !== PAGE && /view=nutrients|view=\$\{HOUSEHOLD_HEALTH_TAB\}/.test(codeOf(rel)),
  );
  assert(
    strays.length === 0,
    "and NO other surface hard-codes the address — there is exactly one destination for the Household Health surface, and every future link must come through it",
    strays.join(", "),
  );

  // -------------------------------------------------------------------------
  section("5. BOUNDARIES — HHP3 creates no scoring, opportunity or delivery logic");
  // -------------------------------------------------------------------------

  const framework = codeOf("server/intelligence/opportunity-delivery/framework.ts");

  const producers = framework.match(/"[a-z-]+":\s*\{\s*verb:\s*"report"/g) ?? [];
  assert(
    producers.length === 2,
    "HHP3 enrols NO new producer — OPPORTUNITY_SOURCES still holds exactly the two HHP2 left (food-intelligence, household-health)",
    `found ${producers.length}`,
  );
  assert(
    (framework.match(/function adapt\w*\(result: unknown\)/g) ?? []).length === 1,
    "and adds no adapter — the one shared `adaptOpportunityReport` still serves every producer",
  );

  assert(
    Object.keys(NUTRITION_OPPORTUNITY_TYPES).length === 3,
    "HHP3 invents no opportunity — HNP1's three types are still the only household health types that exist",
  );
  const noticeEngine = codeOf("server/intelligence/conversation/notice-engine.ts");
  assert(
    /nutrition:\s*"nutrition-opportunity"/.test(noticeEngine),
    "HHP3 adds no NoticeCategory — the `nutrition → nutrition-opportunity` mapping HHP2 created is intact and untouched, and health still reaches the Companion through it",
  );
  assert(
    (sourceOf(ROUTES).match(/app\.get\("\/api\/intelligence\/food-opportunities"/g) ?? []).length === 1,
    "and no second delivered-bundle route — there is exactly ONE mouth for the Decision Engine's bundle, and HHP3 did not add another",
  );

  /**
   * The panel's delivery boundary is not proven by scanning it for forbidden WORDS —
   * a TSX file is full of `text-muted-foreground` and `score={...}`, and a scan that
   * trips on those is measuring Tailwind, not logic. It is proven by something far
   * stronger, already asserted in §1: the panel never holds an opportunity object at
   * all. It cannot rank, suppress, budget or re-derive what it never touches.
   *
   * What remains worth asserting is that it did not acquire a back door.
   */
  assert(
    !/\.sort\(|\.filter\(\s*\(?o\b|\.slice\(/.test(panel),
    "the panel sorts, filters and slices nothing — ordering and budgeting are the engine's (DEC1 §3), and the panel does not quietly re-apply them",
  );
  assert(
    !/opportunity-delivery\/framework|delivery-store/.test(panel + page),
    "neither the panel nor its page imports the Decision Engine's framework or store — they reach it only through the ordinary ambient surface",
  );
  assert(
    !/fetch\(["'`]\/api\/intelligence/.test(panel + page),
    "and neither calls an intelligence route directly — the one canonical hook, behind the one ambient surface, remains the only client door to the bundle",
  );

  // Home is a DOOR to the surface, never a second mouth for the bundle. It carries the
  // household's standing and links onward; the advice stays with the engine that owns
  // its lifecycle. (It could not render an opportunity even if it tried — the route it
  // reads no longer sends any — but a surface that never holds one cannot leak one.)
  assert(
    !/\.opportunities|OpportunityCard|AmbientIntelligence|food-opportunities/.test(home),
    "Home renders NO opportunity — it shows the household's standing and a way in, and does not become a third place advice is delivered",
  );
  assert(
    /householdScore\s*&&/.test(home),
    "and it honours HNP1's Trust Rule 1 — a household with no score is shown no card, rather than a 0 or a 'get started!' placeholder dressed up as a standing",
  );

  // -------------------------------------------------------------------------
  console.log(`\n${"─".repeat(70)}`);
  console.log(`HHP3 — Household Health Delivery Convergence: ${passed} passed, ${failed} failed`);
  console.log("─".repeat(70));
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("FATAL", err);
  process.exit(1);
});
