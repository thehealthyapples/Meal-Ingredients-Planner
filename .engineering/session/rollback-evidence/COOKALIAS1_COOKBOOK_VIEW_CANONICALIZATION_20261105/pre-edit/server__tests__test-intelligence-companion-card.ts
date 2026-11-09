/**
 * test-intelligence-companion-card.ts — EWO-ARCH-INT02 / INT37
 * ============================================================
 * Tests for the Companion Card Experience — the presentation view model that
 * turns a Native Discovery Response (INT36) into the canonical
 * Summary → Companion Cards → Next Steps layout rendered by the Conversation UI.
 *
 * The module under test is pure (no React, no DOM) so it runs directly here.
 *
 * Coverage:
 *   §1  Companion Cards replace markdown discovery output
 *   §2  Meal cards navigate to canonical THA pages
 *   §3  Next Steps render correctly
 *   §4  External URLs / markdown / provenance are suppressed
 *   §5  Legacy / empty conversations continue to render correctly
 *   §6  Every discovery domain adopts the SAME framework (reuse)
 *
 * Run: npx tsx server/tests/test-intelligence-companion-card.ts
 */

import {
  buildCompanionCardView,
  sanitizeSummary,
  thaDetailPath,
  domainLandingPath,
  type NativeDiscoveryResponse,
} from "../../client/src/components/conversation/companion-card.js";

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, label: string): void {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.error(`  ✗ ${label}`);
  }
}

function section(name: string): void {
  console.log(`\n── ${name} ──────────────────────────────────────────`);
}

// ---------------------------------------------------------------------------
// Fixtures — the exact NativeDiscoveryResponse shape INT36 produces
// ---------------------------------------------------------------------------

/** An external provenance URL. It must NEVER appear as a navigation target. */
const EXTERNAL_URL = "https://external-recipes.example.com/pasta-bake";
/** A canonical THA-hosted image. It MAY appear as a card image (never a link). */
const THA_IMAGE = "https://cdn.thehealthyapples.test/meal/42.jpg";

const MEAL_DISCOVERY: NativeDiscoveryResponse = {
  domain: "meal",
  // The summary the LLM might have written — with markdown + an external URL
  // that the Companion Card experience must suppress before display.
  summary: `I found **2 meals** matching “pasta”. See ![img](${THA_IMAGE}) or [source](${EXTERNAL_URL}).`,
  entities: [
    {
      kind: "meal",
      ref: { type: "meal", id: 42 },
      title: "Creamy Tomato Pasta Bake",
      subtitle: "Your cookbook",
      imageUrl: THA_IMAGE,
      servings: 4,
      appleScore: 82,
      lastCooked: "last week",
    },
    {
      kind: "meal",
      ref: { type: "meal", id: 100 },
      title: "One-Pot Pasta Primavera",
      subtitle: "THA library",
      servings: 1,
    },
  ],
  actions: [
    { kind: "open", label: "Open Meal", appliesTo: "entity" },
    { kind: "add-to-planner", label: "Add to Planner", appliesTo: "entity" },
    { kind: "add-to-shopping", label: "Add to Shopping", appliesTo: "entity" },
    { kind: "view-all", label: "View All", appliesTo: "results", query: "pasta" },
  ],
  entityRefs: [{ type: "meal", id: 42 }, { type: "meal", id: 100 }],
};

/** A non-meal domain response (planner), to prove domain-agnostic reuse. */
const PLANNER_DISCOVERY: NativeDiscoveryResponse = {
  domain: "planner",
  summary: "I found 3 planned meals this week.",
  entities: [
    { kind: "entity", ref: { type: "meal", id: 7 }, title: "Monday — Chilli", subtitle: "This week" },
  ],
  actions: [
    { kind: "open", label: "Open", appliesTo: "entity" },
    { kind: "view-all", label: "View All", appliesTo: "results", query: "" },
  ],
};

// ---------------------------------------------------------------------------

function main(): void {

// § 1 — Companion Cards replace markdown discovery output
section("§1 Companion Cards replace markdown discovery output");
{
  const view = buildCompanionCardView(MEAL_DISCOVERY);
  assert(view !== null, "a discovery response yields a Companion Card view");
  assert(view!.cards.length === 2, "one Companion Card per discovered entity");
  assert(view!.cards[0].title === "Creamy Tomato Pasta Bake", "card carries the canonical meal title");
  assert(view!.cards[0].kind === "meal", "meal discovery produces meal cards");
  // The summary is plain text — no markdown syntax survives to the UI.
  assert(!/[*_`]/.test(view!.summary), "summary carries no markdown emphasis/code markers");
  assert(!view!.summary.includes("!["), "summary carries no markdown image syntax");
  assert(!view!.summary.includes("]("), "summary carries no markdown link syntax");
  assert(view!.summary.includes("2 meals matching"), "summary keeps the honest human text");
}

// § 2 — Meal cards navigate to canonical THA pages
section("§2 Meal cards navigate to canonical THA pages");
{
  const view = buildCompanionCardView(MEAL_DISCOVERY)!;
  const card0 = view.cards[0];
  assert(card0.actions.length === 3, "meal card offers Open Meal · Add to Planner · Add to Shopping");
  assert(card0.actions.every(a => a.href === "/meals/42"), "every meal-card action navigates to the canonical THA meal page /meals/42");
  assert(view.cards[1].actions.every(a => a.href === "/meals/100"), "second card navigates to its own canonical page /meals/100");
  assert(thaDetailPath({ type: "meal", id: 42 }) === "/meals/42", "thaDetailPath resolves a meal to its canonical detail route");
  assert(thaDetailPath({ type: "food", id: 5 }) === null, "types without an id-addressable detail route return null (fall back to domain landing)");
  // A meal card carries the canonical THA image (an image source, not a link).
  assert(view.cards[0].imageUrl === THA_IMAGE, "meal card keeps the canonical THA image as an image source");
  assert(view.cards[1].imageUrl === undefined, "a meal without a THA image honestly omits it (never fabricated)");
}

// § 3 — Next Steps render correctly
section("§3 Next Steps render correctly");
{
  const view = buildCompanionCardView(MEAL_DISCOVERY)!;
  assert(view.nextSteps.length === 1, "result-level actions become Next Steps");
  assert(view.nextSteps[0].kind === "view-all", "View All is a Next Step, not a per-card action");
  assert(view.nextSteps[0].href === "/meals", "View All navigates to the canonical domain landing page");
  // Per-card actions are NOT duplicated into Next Steps.
  assert(!view.nextSteps.some(s => s.kind === "open"), "per-card (entity) actions do not leak into Next Steps");
  assert(!view.cards[0].actions.some(a => a.kind === "view-all"), "result-level View All does not leak onto cards");
  assert(domainLandingPath("shopping") === "/shopping-workspace", "each domain has a canonical landing route");
}

// § 4 — External URLs / markdown / provenance are suppressed
section("§4 External URLs and provenance are suppressed");
{
  const view = buildCompanionCardView(MEAL_DISCOVERY)!;
  assert(!view.summary.includes(EXTERNAL_URL), "the external provenance URL is stripped from the summary");
  assert(!/https?:\/\//.test(view.summary), "no external URL of any kind survives in the summary");
  // No navigation target is ever an external URL — every href is an in-app path.
  const allHrefs = [
    ...view.cards.flatMap(c => c.actions.map(a => a.href)),
    ...view.nextSteps.map(s => s.href),
  ];
  assert(allHrefs.every(h => h.startsWith("/")), "every navigation target is a canonical in-app THA path");
  assert(!allHrefs.some(h => /https?:\/\//.test(h)), "no navigation target is an external URL");
  // Direct sanitiser checks.
  assert(sanitizeSummary("![alt](http://x.test/i.png)") === "", "sanitizeSummary removes a lone markdown image");
  assert(sanitizeSummary("See [the recipe](https://x.test).") === "See the recipe.", "sanitizeSummary keeps link text, drops the URL");
  assert(!/https?:\/\//.test(sanitizeSummary("Visit https://x.test/page now")), "sanitizeSummary strips a bare URL");
}

// § 5 — Legacy / empty conversations continue to render correctly
section("§5 Legacy and empty conversations render correctly");
{
  // A response with no entities is never rendered as an empty card block.
  const empty: NativeDiscoveryResponse = { domain: "meal", summary: "I found 0 meals.", entities: [], actions: [] };
  assert(buildCompanionCardView(empty) === null, "an empty discovery yields no card block (empty state handled upstream, INT35)");
  // A plain assistant sentence (no markdown) passes through unchanged — legacy turns still read naturally.
  const legacy = "You have 5 meals planned for this week. Nice work!";
  assert(sanitizeSummary(legacy) === legacy, "a plain legacy summary is unchanged by sanitisation");
  assert(sanitizeSummary("") === "", "an empty summary sanitises to empty");
}

// § 6 — Reuse across every Intelligence domain
section("§6 Every discovery domain adopts the same framework");
{
  const view = buildCompanionCardView(PLANNER_DISCOVERY)!;
  assert(view !== null, "a non-meal domain flows through the same builder");
  assert(view.cards.length === 1 && view.cards[0].kind === "entity", "non-meal domains produce generic entity cards");
  assert(view.cards[0].actions.every(a => a.href === "/meals/7"), "a planner card linking a meal ref navigates to the canonical meal page");
  assert(!view.cards[0].actions.some(a => a.kind === "add-to-planner"), "meal-only actions never leak into other domains");
  assert(view.nextSteps.length === 1 && view.nextSteps[0].href === "/planner", "View All navigates to the planner's canonical landing page");
}

// ---------------------------------------------------------------------------
console.log(`\n════════════════════════════════════════════════════════`);
console.log(`  INT37 companion cards: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  console.error(`\n  Failures:\n${failures.map(f => `    ✗ ${f}`).join("\n")}`);
  process.exit(1);
}
console.log(`  ✅ All companion card tests passed.`);

}

main();
