/**
 * COMM2 — Orchard Experience
 * ===========================================================================
 *
 * COMM1 proved the boundary exists. COMM2 builds the first surface a household
 * can actually reach, so these assertions are about a different risk: that a
 * page, once it exists, quietly renders or fetches something the boundary was
 * built to withhold.
 *
 * The strongest assertions here are NEGATIVE — the room does not name another
 * household, does not reach a forbidden route, does not fork navigation. COMM1
 * § 12 is the standing warning about negatives: they are proven structurally
 * (the method does not exist) rather than by observation. These are source-level
 * assertions over the built room, which is the same class of proof, and the same
 * limitation applies. The runtime two-household test named in COMM1 § 11.1 is
 * still absent and is still the thing that would make this airtight.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..", "..");
const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

const ORCHARD_SRC   = read("client/src/pages/orchard-page.tsx");
const NAV_SRC       = read("client/src/components/nav-bar.tsx");
const APP_SRC       = read("client/src/App.tsx");
const TYPES_SRC     = read("server/intelligence/types.ts");
const REGISTRY_SRC  = read("server/intelligence/capability-registry.ts");
const CARD_SRC      = read("client/src/components/conversation/companion-card.ts");
const HEADER_SRC    = read("client/src/components/workspace-header.tsx");
const ASSISTANT_SRC = read("client/src/components/conversation/FloatingAssistant.tsx");
const COMMUNITY_SRC = read("server/lib/community.ts");

/**
 * Comments explain what a room deliberately does NOT do, so they legitimately
 * contain the very words these assertions forbid — "no message surface", "the
 * port returns no name", "invented businesses on example.com". Matching raw
 * source therefore fails on the prose that exists to document the rule.
 *
 * Stripping comments first is what makes the assertions mean what they say:
 * every check below runs against CODE, not against the explanation of the code.
 */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const ORCHARD_CODE = stripComments(ORCHARD_SRC);

let passed = 0;
let failed = 0;

function assert(ok: boolean, what: string, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${what}`);
  } else {
    failed++;
    console.log(`  ✗ ${what}${detail ? `\n      got: ${detail}` : ""}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

// ───────────────────────────────────────────────────────────────────────────
section("1. ONE ROOM — the owner ruling, asserted");
// ───────────────────────────────────────────────────────────────────────────

const navOrchardEntries = (NAV_SRC.match(/href:\s*"\/orchard"/g) ?? []).length;
assert(
  navOrchardEntries === 1,
  "exactly ONE nav entry for the Orchard — not one per part",
  `${navOrchardEntries}`,
);

for (const forbidden of ["/village", "/high-street", "/highstreet", "/neighbourhood", "/neighbourhoods"]) {
  assert(
    !NAV_SRC.includes(`"${forbidden}"`) && !APP_SRC.includes(`path="${forbidden}"`),
    `no nav entry and no route for ${forbidden} — it is part of the room, not a destination`,
  );
}

const orchardRoutes = (APP_SRC.match(/path="\/orchard"/g) ?? []).length;
assert(orchardRoutes === 1, "exactly ONE route declares /orchard", `${orchardRoutes}`);

assert(
  /NAV_ITEMS\s*=\s*\[[\s\S]*?href:\s*"\/orchard"[\s\S]*?\]/.test(NAV_SRC),
  "the Orchard is declared in NAV_ITEMS — the one canonical navigation owner, not a second list",
);

// The parts are page state. If any of them became a route, the ruling broke.
assert(
  /type OrchardPart\s*=\s*"orchard"\s*\|\s*"neighbourhood"\s*\|\s*"village"\s*\|\s*"highstreet"/.test(ORCHARD_SRC),
  "the four parts are a state union inside the page, never routes",
);

// ───────────────────────────────────────────────────────────────────────────
section("2. THE PRIVACY BOUNDARY — COMM1's claim, held by the first surface");
// ───────────────────────────────────────────────────────────────────────────

// The room may only reach routes COMM1 built, plus the real retailer route —
// and, since COMM1A, the invitation surface it owns.
//
// UPDATED BY COMM1A (2026-07-19), DELIBERATELY. This list is a scope lock and it
// fired: adding the invite form put `/api/invitations` on the page, and the test
// refused it. It is widened rather than deleted, and by exactly one entry,
// because COMM1A's whole contribution to this room is one door. A widened lock
// with its reason recorded is still a lock; a deleted one is not.
const fetchedPaths = [...ORCHARD_SRC.matchAll(/queryKey:\s*\[\s*[`"]([^`"]+)[`"]/g)].map(m => m[1]);
const ALLOWED = [
  "/api/community",
  "/api/community/invitations",
  "/api/community/${openCommunityId}/members",
  "/api/basket/supermarkets-enhanced",
  // COMM1A — the invitations this household has sent. Addressed to emails, and
  // it returns no token and no household id.
  "/api/invitations",
];
for (const p of fetchedPaths) {
  assert(ALLOWED.includes(p), `the room reads only declared routes — ${p}`, p);
}

// The household-facing catastrophe this domain exists to prevent: the room
// rendering a neighbour's name, eaters, plans or lists. None of those are
// reachable, and none are referenced.
for (const leak of ["householdName", "eaters", "restrictions", "allergen", "plannerWeek", "shoppingList", "mealPlan"]) {
  assert(
    !ORCHARD_CODE.includes(leak),
    `the room never references \`${leak}\` — another household's data has no path to this page`,
  );
}

// The interface the room types for a member must not claim a name field: a
// field typed here is a field someone will try to render.
const membersIface = stripComments(ORCHARD_SRC.match(/interface CommunityMembers \{[\s\S]*?\n\}/)?.[0] ?? "");
assert(membersIface.length > 0, "the members response is typed in the room");
assert(
  !/\bname\b/.test(membersIface),
  "the member type has no `name` — the port returns none, so the page cannot invent one",
  membersIface,
);
assert(
  /householdId/.test(membersIface) && /role/.test(membersIface),
  "the member type is exactly { householdId, role } — the whole of what COMM1 discloses",
);

// The room states the boundary rather than leaving it to be inferred.
assert(
  ORCHARD_SRC.includes("orchard-privacy-note"),
  "the room tells the household what its neighbours can see — the boundary is visible, not merely enforced",
);

// ───────────────────────────────────────────────────────────────────────────
section("3. NO INTER-HOUSEHOLD EXCHANGE — the scope lock, asserted not asserted-to");
// ───────────────────────────────────────────────────────────────────────────

// Word-matching proved worthless here — it fires on `LoadError message=` and on
// the comments that document the lock. What actually distinguishes a messaging
// or sharing surface is STRUCTURAL: somewhere to compose, and somewhere to send.
// So assert the absence of both.

for (const compose of ["<textarea", "<Textarea", "contentEditable", "<form", "<Form"]) {
  assert(
    !ORCHARD_CODE.includes(compose),
    `nothing to compose in the Orchard (${compose}) — no messaging, no posting, no sharing`,
  );
}

// Every mutating call the room makes, ENUMERATED BY NAME. If a fifth appears,
// this fails — which is the point, and it is why the list is exact rather than
// a ceiling.
//
// UPDATED BY COMM1A: two became four. The two added are the invite door and its
// withdrawal, and both are COMM1A lifecycle routes addressed to an email — no
// household id is sent by any of them.
const mutations = [...ORCHARD_CODE.matchAll(/apiRequest\(\s*"(GET|POST|PUT|PATCH|DELETE)"\s*,\s*([^,)]+)/g)]
  .map(m => `${m[1]} ${m[2].trim()}`);
const EXPECTED_MUTATIONS = [
  'POST path',                                          // COMM1 — accept/decline an invitation
  'POST `/api/community/${communityId}/leave`',          // COMM1 — leave
  'POST "/api/invitations"',                             // COMM1A — invite by email
  'DELETE `/api/invitations/${id}`',                     // COMM1A — withdraw
];
assert(
  mutations.length === EXPECTED_MUTATIONS.length,
  "the room makes exactly four kinds of mutating call — answer, leave, invite, withdraw",
  mutations.join(" | "),
);
for (const m of mutations) {
  assert(EXPECTED_MUTATIONS.includes(m), `mutating call is one of the four declared — ${m}`, m);
}
// Precisely: no apiRequest BODY carries a household id. `householdId` appears in
// the page as a TYPE (the members response is `{ householdId, role }`), which is
// a thing the room receives, not a thing it sends — so matching the bare
// identifier would fail on the declaration and prove nothing.
const requestBodies = [...ORCHARD_CODE.matchAll(/apiRequest\([^,]+,[^,]+,\s*(\{[^;]*?\})\s*\)/g)].map(m => m[1]);
for (const body of requestBodies) {
  assert(
    !/householdId/.test(body),
    "no mutating call sends a household id — COMM1A's invitations are addressed to an email",
    body,
  );
}
assert(requestBodies.length >= 3, "request bodies were actually found and inspected", `${requestBodies.length}`);

// The three invitation routes the room may touch. `POST /:id/invitations`
// (create) is NOT among them.
// STILL TRUE AFTER COMM1A, and still worth asserting. COMM2 left the invite
// form unbuilt because `POST /api/community/:id/invitations` needs a household
// id nobody can discover. COMM1A did NOT reach for that route — it built an
// email-addressed one instead — so the id-taking endpoint remains uncalled from
// the client, which is the property this assertion was always really about.
assert(
  !/communityId\}\/invitations/.test(ORCHARD_CODE) && !/community\/\$\{[^}]*\}\/invitations/.test(ORCHARD_CODE),
  "the client never calls the household-id-taking community invite route — COMM1A invites by email instead",
);

// ───────────────────────────────────────────────────────────────────────────
section("4. THE GOVERNED COMPANION CHANGE — the two lists move together");
// ───────────────────────────────────────────────────────────────────────────

assert(
  /COMPANION_ROOMS\s*=\s*\[[\s\S]*?"community",[\s\S]*?\]/.test(TYPES_SRC),
  "`community` is admitted to COMPANION_ROOMS",
);
assert(
  /companionDomain:\s*"community"/.test(REGISTRY_SRC),
  "the capability descriptor declares the `community` room",
);
assert(
  /community:\s*"\/orchard"/.test(CARD_SRC),
  "DOMAIN_LANDING routes the community room to /orchard — without this, every Next Step silently lands on '/'",
);

// The failure mode BEH-8 deleted the old table to prevent: a room in the type
// with no landing row. Assert the invariant for EVERY room, not just this one.
const roomsBlock = TYPES_SRC.match(/COMPANION_ROOMS = \[([\s\S]*?)\] as const/)?.[1] ?? "";
const rooms = [...roomsBlock.matchAll(/"([a-z-]+)"/g)].map(m => m[1]);
assert(rooms.length === 8, "eight Companion rooms after COMM2", `${rooms.length}: ${rooms.join(", ")}`);
for (const room of rooms) {
  assert(
    new RegExp(`\\b${room}:\\s*"/`).test(CARD_SRC),
    `room "${room}" has a DOMAIN_LANDING route — no room may route to the fallback`,
  );
}

// A destination, not a verb.
assert(
  /supportedIntents:\s*\["read"\]/.test(
    REGISTRY_SRC.slice(REGISTRY_SRC.indexOf('id: "community"'), REGISTRY_SRC.indexOf('id: "community"') + 1200),
  ),
  "the capability is still read-only — COMM2 added a destination, not a write verb",
);

// Community is deliberately NOT a discovery domain.
const discoverySrc = read("server/intelligence/conversation/native-discovery.ts");
assert(
  !/DISCOVERY_DOMAINS[\s\S]*?"community(-discovery)?":/.test(discoverySrc),
  "Community is not a discovery domain — it exposes no searchable entity, only membership",
);

// ───────────────────────────────────────────────────────────────────────────
section("5. THE ROOM IS A ROOM — realm, header, Companion surface");
// ───────────────────────────────────────────────────────────────────────────

assert(/\|\s*"orchard"/.test(HEADER_SRC), "`orchard` is a PageRealm");
assert(/"\/orchard":\s*\{/.test(NAV_SRC), "the Orchard has a realm tint for wayfinding");
assert(
  /realm="orchard"/.test(ORCHARD_SRC),
  "the room declares its realm through the canonical WorkspaceHeader — not a private header",
);
const pageHeaders = (ORCHARD_CODE.match(/<WorkspaceHeader/g) ?? []).length;
assert(
  pageHeaders === 1,
  "exactly ONE WorkspaceHeader — the room uses the shell's header owner and does not fork one",
  `${pageHeaders}`,
);
assert(
  /if \(\/\^\\\/orchard\/\.test\(location\)\) return "orchard";/.test(ASSISTANT_SRC),
  "the Companion knows which room it is standing in",
);
assert(
  /orchard:\s*"Orchard"/.test(ASSISTANT_SRC),
  "the Companion surface is labelled",
);

// ───────────────────────────────────────────────────────────────────────────
section("6. ORCHARD EXPOSURE — E2, opening one level when empty");
// ───────────────────────────────────────────────────────────────────────────

assert(
  /isEmptyOrchard \? "e3" : "e2"/.test(ORCHARD_SRC),
  "exposure is E2, opening to E3 when empty — one level, never two (Blueprint § 6.2 rule 2)",
);
assert(
  // UX2 — `OrchardArch` was retired with the arch; `OrchardWindow` is the shape
  // that replaced it. Named here so the guard keeps naming every shape the
  // canonical owner exposes, rather than silently ageing into a test of nothing.
  !/orchard-bg\.webp|OrchardBackdrop|OrchardOpenView|OrchardWindow/.test(ORCHARD_SRC),
  "the room mounts no orchard image — it does not become a sixth bypass of the canonical owner",
);
for (const drawn of ["<svg", "background-image", "backgroundImage"]) {
  assert(
    !ORCHARD_SRC.includes(drawn),
    `the room draws no scene (${drawn}) — "the rendered world" and "the theme park" are named anti-patterns`,
  );
}

// ───────────────────────────────────────────────────────────────────────────
section("7. THE HIGH STREET — real businesses only");
// ───────────────────────────────────────────────────────────────────────────

assert(
  ORCHARD_SRC.includes("/api/basket/supermarkets-enhanced"),
  "the High Street reads the registered `partners` capability — nine real UK retailers",
);
assert(
  !ORCHARD_SRC.includes("@/data/partners") && !ORCHARD_SRC.includes("types/partner"),
  "the withdrawn wellness partners are NOT reopened — they are invented businesses on example.com (PROD2, Core Principle 6)",
);
assert(
  !ORCHARD_CODE.includes("example.com"),
  "no fabricated business appears in the room's code",
);
assert(
  /orchard-goto-shopping/.test(ORCHARD_SRC) &&
    !/addToBasket|addToList|shoppingListItem/.test(ORCHARD_SRC),
  "the High Street does no shopping — Shopping remains the one owner, reached by one door",
);

// ───────────────────────────────────────────────────────────────────────────
section("8. NO NEW SERVER SURFACE — the foundation is reused, not extended");
// ───────────────────────────────────────────────────────────────────────────

assert(
  COMMUNITY_SRC.includes("COMMUNITY_READABLE_TABLES"),
  "the owning service is untouched and still declares its readable set",
);
const routesSrc = read("server/routes.ts");
const communityRoutes = (routesSrc.match(/app\.(get|post|delete)\(['"`]\/api\/community/g) ?? []).length;
assert(
  communityRoutes === 9,
  "still exactly nine /api/community routes — COMM2 added no endpoint",
  `${communityRoutes}`,
);

const schemaSrc = read("shared/schema.ts");
const communityTables = (schemaSrc.match(/pgTable\("communit(ies|y_\w+)"/g) ?? []).length;
assert(
  communityTables === 3,
  "still exactly three Community tables — COMM2 declared no new entity and needs no migration",
  `${communityTables}`,
);

// ───────────────────────────────────────────────────────────────────────────
section("9. THE TOKEN — a bearer grant is not left lying about");
// ───────────────────────────────────────────────────────────────────────────

assert(
  /new URLSearchParams\(search\)\.get\("invitation"\)/.test(ORCHARD_SRC),
  "the token is taken from the link the household was sent — the only honest source",
);
assert(
  /navigate\("\/orchard"\);/.test(ORCHARD_SRC),
  "the token is cleared from the URL once spent — single-use, so it must not linger in history",
);
assert(
  !/localStorage|sessionStorage|document\.cookie/.test(ORCHARD_SRC),
  "the token is never persisted client-side",
);

// ───────────────────────────────────────────────────────────────────────────
console.log("\n────────────────────────────────────────────────────────────");
console.log(`COMM2: ${passed} passed, ${failed} failed`);
console.log("Community as a place. Households present, and nothing else crossing.");
process.exit(failed === 0 ? 0 : 1);
