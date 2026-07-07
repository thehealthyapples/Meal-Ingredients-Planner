# FI5 — Food Intelligence UI Activation — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FI5 (🟡 AMBER — a thin HTTP surface plus UI wiring over an already-registered, already-tested capability; no new capability, no new reasoning, no new store)
**Risk:** 🟡 AMBER
**Reason:** Surfaces existing Food Intelligence / Opportunity Delivery (OD1, fed by FI4) output to households for the first time. Adds one new route file section (two thin routes delegating to `intelligencePlatform.handle()`), one client hook, two client components, and additive JSX in four existing pages. No new capability, no new database table, no new reasoning — but it is the platform's first direct (non-Companion) UI consumer of `opportunity-delivery`, so classified AMBER rather than GREEN.
**Builds on:** [`FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md`](./FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md) (the Food Opportunity Engine this task surfaces) · the `opportunity-delivery` capability (OD1 — governance/delivery framework over FI4's opportunities; `report`/`review`/`approve`/`delete`) · [`EL1` Evidence & Learning Platform](../architecture/) (this task wires EL1's first real reporter, best-effort)
**Tests:** No new automated test file — this task adds zero new capability logic (verified via the pre-existing `test:intelligence-opportunity-delivery-binding` suite, 50 assertions, unmodified and still passing) and zero new reasoning (verified via the pre-existing `test:intelligence-food-opportunity-binding` suite, unmodified and still passing). Verified instead by: full `npm test` chain, `npx tsc --noEmit` (no new error introduced), and a live route check against the running dev server (`GET /api/intelligence/food-opportunities` → `401` unauthenticated, confirming the route is registered and the auth gate is live).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-fi5-food-intelligence-ui-activation-20260703` → `9d6cc99` |
| Working tree at start | Already dirty with this task's own uncommitted work (interrupted mid-session, resumed here) plus one unrelated untracked file, `docs/investigations/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` (a separate EL2 investigation, not touched or committed by this task) |
| HEAD at start | `9d6cc99` — "Add Evidence & Learning Platform (EL1)" |
| This task's writes | 7 modified files + 3 new files — see Files Changed below |
| Rollback to committed state | `git checkout rollback/before-fi5-food-intelligence-ui-activation-20260703` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (EWO-FI1 — §7 capability architecture, "no new platform")
- [x] `docs/implementation/FI4_AMBIENT_FOOD_INTELLIGENCE_OPPORTUNITY_ENGINE.md` — the exact `report`/`review`/`approve`/`delete` contract this task's routes call, and FI4's own named "next milestone" (UI wiring), which this task fulfils
- [x] `server/intelligence/opportunity-delivery/framework.ts`, `server/intelligence/handlers/opportunity-delivery-handler.ts` — the OD1 governance layer this task's routes delegate to; confirmed `DeliverableOpportunity`'s shape (`id`, `capabilityId`, `domain`, `type`, `priority`, `explanation`, `evidence`, `suggestedAction`, `surface`) matches the client hook's `FoodOpportunity` type field-for-field
- [x] `server/intelligence/handlers/evidence-learning-handler.ts` — confirmed the `report` verb's required parameter shape (`domain`, `subjectType`, `subjectId`, `subjectKey`, `outcomeType`, `direction`, `sourceCapabilityId`) before wiring the best-effort EL1 call
- [x] `client/src/components/PlannerIntelligenceStrip.tsx`, `client/src/components/intelligence/IntelligenceCard.tsx` — the existing compact-strip / expand-toggle and card visual language this task's two new components reuse rather than inventing a second pattern

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
☑ One canonical identity
  No new entity. Every opportunity keys on the id OD1 already assigned
  (`${capabilityId}:${producer's own id}`) — the client never generates,
  rewrites, or re-derives an id.

☑ One owner per fact
  Every field rendered (explanation, evidence, suggestedAction, domain,
  priority) is a verbatim projection of what OD1's `report` verb already
  returned, which is itself a verbatim projection of FI4's Food Opportunity
  Engine. Neither the new hook, the new components, nor the two new routes
  compute, rephrase, or re-derive any of it.

☑ No duplicate implementation
  ONE hook (`useFoodOpportunities`), ONE fetch, ONE query key, shared by all
  four consuming surfaces via TanStack Query's own dedup (mirrors
  PlannerIntelligenceStrip's precedent of querying the same key from more
  than one surface). ONE card component (`FoodOpportunityCard`) and ONE
  panel component (`FoodOpportunitiesPanel`) — every surface renders through
  them with different props (`domains`/`limit`/`title`), never a
  surface-specific copy.

☑ No duplicate state
  No new client or server state. The panel's `expanded` boolean is ordinary
  UI-only component state (mirrors every other expand-toggle strip in this
  codebase); TanStack Query's cache is the only data state, and it is
  updated only from a server-confirmed mutation result, never optimistically.

☑ Extends existing architecture
  Two new routes are a thin HTTP surface calling `intelligencePlatform.handle()`
  directly — the same call OD1's own test suite already exercises — not a
  private/bypass route and not a new capability. No new verb was added to
  OD1; `report`/`review`/`approve`/`delete` (already registered by OD1) are
  reused exactly as declared.

☑ Progressive enrichment
  `isPending` → render nothing (no layout shift). Zero opportunities and no
  `emptyMessage` prop → render nothing (silent, not a placeholder). A
  501/gap outcome from the platform → `{ resolved: false, opportunities: [],
  grouped: {} }`, the same honest-empty shape as a genuinely-empty household,
  never a fabricated opportunity or a thrown error surfaced mid-page-render.

☑ Honest gaps over fabricated information
  `FoodOpportunityCard` refuses to render an opportunity with no
  `explanation` (defensive, since the server never produces one, per FI4).
  A 401 from the GET route is treated as an honest empty state client-side
  (`res.status === 401` → `{ resolved: false, ... }`), not a thrown error —
  a page that renders before auth settles never surfaces a false error.

☑ No permanent synchronisation bridge
  No bridge. Every render is driven by a live query against
  `/api/intelligence/food-opportunities`; accept/dismiss update the
  TanStack Query cache only after the server confirms the resolution
  (`outcome.status === "ok"`), never a client-side guess ahead of the server.

☑ Evolution over replacement
  Nothing existing is replaced. `PlannerIntelligenceStrip`,
  `CookbookMealIntelligenceStrip`, and `PantryIntelligencePanel` are
  untouched — this task adds a sibling strip to each page, with its own
  `data-testid`s and its own doc comment naming it as a distinct data
  source (the Food Intelligence platform, not the discovery/stories system
  those existing strips read from).
```

**AI ARCHITECTURE COMPLIANCE**

```
✓ Uses the canonical Intelligence Platform — both new routes call the one
  `intelligencePlatform` singleton's `.handle()`, the identical path the
  Conversation Gateway already uses for every other capability.
✓ Uses the Capability Registry — `opportunity-delivery`'s existing
  `supportedIntents`/`executableIntents` (`report`/`review`/`approve`/
  `delete`) are reused unmodified; only the descriptor's `apiSurface` text
  field is updated (was: "platform-internal only — no dedicated HTTP
  route"; now names this task's two routes) — a documentation-only edit,
  not a behavioural one.
✓ Uses the Intent Engine — routed through the existing LOCATE → VALIDATE →
  PERMISSION → CONFIRM → INVOKE → RESPOND pipeline unchanged. `review`/
  `approve`/`delete` are platform-wide "strong" confirmation verbs (per
  OD1's own test suite); the POST route passes `{ confirmed: true }`
  immediately because the click itself IS the confirmation — the same
  single-step pattern already used for other direct user-initiated writes.
✓ Reuses existing business services — zero new database queries anywhere
  in this task; both routes delegate entirely to OD1's already-tested
  `handleReport`/`handleResolve`.
✓ Does not create another assistant — no conversation state, no LLM call.
✓ Does not duplicate conversation state — none created or read.
✓ Uses registered capabilities only — `opportunity-delivery` (OD1) and,
  for the best-effort evidence call, `evidence-learning` (EL1) — both
  already registered; no new capability descriptor.
✓ Uses permission-aware access — `req.isAuthenticated()` gates both routes;
  `intelligencePlatform.contextFor(user)` resolves `context.userId`
  server-side from the session, never from a client-supplied id.
✓ Produces honest gaps rather than fabricated knowledge — see Honest Gaps
  checklist item above.
```

---

## DOMAIN IMPACT

```
Domain affected: Food Intelligence (Domain Intelligence layer) — presentation
  only. No Business Domain data is owned, read directly, or written by this
  task; every fact flows through OD1's existing `opportunity-delivery`
  capability, which itself reads FI4's existing Food Opportunity Engine.
Declared SoT: unchanged — this task adds no new read outside the existing
  `intelligencePlatform.handle()` path.
New store created? NO.
Existing store extended? NO — the `capability-registry.ts` edit is a single
  descriptive-text field (`apiSurface`), not a schema or behavioural change.
Consumer created? YES — the platform's first direct (non-Companion) UI
  consumer of `opportunity-delivery`: two thin HTTP routes
  (`server/routes.ts`), one client hook, two client components, wired into
  four existing pages (Dashboard, Weekly Planner, Cookbook/Meals, Pantry).
```

---

## IMPLEMENTATION

### 1. Server — thin HTTP surface over the already-registered `opportunity-delivery` capability (`server/routes.ts`)

Two routes, both delegating to `intelligencePlatform.handle()` — no new business logic:

- **`GET /api/intelligence/food-opportunities`** — `{ capabilityId: "opportunity-delivery", verb: "report", parameters: { limit } }`. A non-`ok` outcome (no resolvable household, etc.) returns an honest `{ resolved: false, opportunities: [], grouped: {}, message }` — never a 500 for a gap that isn't a server error. `limit` is clamped to `[1, 30]` client-request-side before being forwarded.
- **`POST /api/intelligence/food-opportunities/:opportunityId/:action`** — `action` (`acknowledge` | `accept` | `dismiss`) maps to OD1's own verbs (`review` | `approve` | `delete`) via a small lookup table; an unknown action is a `400`, never silently ignored. `{ confirmed: true }` is passed because review/approve/delete are platform-wide strong-confirmation verbs and the click itself is the confirmation.
- **Best-effort EL1 evidence reporting** — on a successful `accept`/`dismiss` (not `acknowledge`, which is a "seen" signal rather than a preference signal), the route additionally calls `{ capabilityId: "evidence-learning", verb: "report", ... }`, wrapped in its own `try/catch` so a failure there never affects the primary accept/dismiss response. This is EL1's first real reporter — the milestone EL1's own implementation record named as the next step.

Both routes require `req.isAuthenticated()`; `context.userId` is always server-resolved from the session (`intelligencePlatform.contextFor(user)`), never client-supplied.

The `opportunity-delivery` descriptor's `apiSurface` field in `server/intelligence/capability-registry.ts` was updated from "platform-internal only — no dedicated HTTP route" to name these two routes — the one place the registry's own truthfulness (INT6A discipline) required an edit; no other field changed.

### 2. Client — one hook, one card, one panel (`client/src/hooks/use-food-opportunities.ts`, `client/src/components/intelligence/FoodOpportunityCard.tsx`, `client/src/components/FoodOpportunitiesPanel.tsx`)

- **`useFoodOpportunities()`** — the platform's one client-side owner of the read + resolve calls. A single TanStack Query key (`["/api/intelligence/food-opportunities"]`) shared by every consuming surface, so React Query dedupes the fetch across pages (mirrors `PlannerIntelligenceStrip`'s existing same-key dedup). `accept`/`dismiss`/`acknowledge` mutations; on a server-confirmed accept/dismiss, the opportunity is removed from the cached bundle (both the flat list and its domain group) — never an optimistic pre-confirmation removal.
- **`FoodOpportunityCard`** — renders one opportunity using the existing `IntelligenceCard` primitive (the same visual language as every other intelligence card in this codebase, e.g. `SeasonalCard`, `HouseholdInsightCard`). Renders `explanation`/`evidence`/`suggestedAction` verbatim. Two buttons ("Helpful" / "Not now") are OD1's own review/approve/delete verbs — never an autonomous action; no code path here touches a planner entry, shopping item, or pantry row.
- **`FoodOpportunitiesPanel`** — the one presentation owner every consuming surface renders through. `domains` prop selects from the bundle's own `grouped` map (already grouped by owning domain by OD1); omitting it shows the household's cross-domain top opportunities. `compact` mode renders a single header row with an expand toggle (mirrors `PlannerIntelligenceStrip`'s own pattern); non-compact renders the card grid directly. Progressive enrichment throughout: pending → nothing (no layout shift); empty + no `emptyMessage` → nothing (never a fabricated placeholder).

### 3. Four consuming surfaces — additive JSX only

| Surface | File | `domains` | Framing |
|---|---|---|---|
| Dashboard | `client/src/pages/dashboard.tsx` | *(all)* | "Food Intelligence" — top 5 opportunities across every domain |
| Weekly Planner | `client/src/pages/weekly-planner-page.tsx` | `["planner"]` | "Planner opportunities" — this week's ambient gaps |
| Cookbook / Meals | `client/src/pages/meals-page.tsx` | `["pantry", "shopping"]` | "Meal ideas from your kitchen" — no Cookbook-specific opportunity producer exists yet (FI4's own honest exclusion), so this reframes the same pantry/shopping opportunities Pantry shows |
| Pantry | `client/src/pages/pantry-page.tsx` | `["pantry"]` | "Use what you have" — FI4's pantry-unused generator |

Each insertion is additive JSX plus one import; no existing component, route, or page behaviour was changed. Every surface passes a distinct `data-testid` (`dashboard-food-opportunities`, `planner-food-opportunities`, `cookbook-food-opportunities`, `pantry-food-opportunities`).

### 4. What was deliberately NOT built (honest exclusions, matching the brief)

- **No new opportunity types, no new reasoning.** This task surfaces FI4's three existing generators (planner gaps, pantry-unused, shopping-restriction-conflict) — it adds zero new business logic anywhere.
- **No wearables, biomarkers, predictive AI, or autonomous actions** — explicitly out of scope per the brief; the two card buttons are OD1's own review/approve/delete verbs, never an action that writes to Planner, Pantry, or Shopping.
- **No natural-language / Companion wiring change.** Companion already reaches `opportunity-delivery` via the standard capability path (unchanged by this task); this task adds a *second*, direct UI path alongside it, not a replacement.
- **No Cookbook-specific opportunity producer.** As FI4 itself named: Cookbook is a consuming *surface*, not a Business Domain with its own activity log to generate opportunities from — so Cookbook reframes the existing pantry/shopping opportunities rather than inventing a fourth generator.
- **No new platform, no new capability, no new database table.**

---

## DEFINITION OF DONE

**What success looks like:**
- Dashboard, Weekly Planner, Cookbook, and Pantry each render the household's real Food Opportunities via one shared hook/panel/card — no surface re-fetches or re-derives the bundle a second way ✅
- Every opportunity shown carries a plain-language explanation, cited evidence, and a clear, human-actionable next step (`suggestedAction`), sourced verbatim from OD1/FI4 ✅
- Accept/dismiss resolve through OD1's own `approve`/`delete` verbs and are reflected in the UI only after server confirmation ✅
- A household with nothing to surface sees an honest empty state (nothing rendered, or a quiet message), never a fabricated opportunity ✅
- Zero new capability, zero new reasoning, zero new database table — confirmed by the pre-existing OD1/FI4 test suites passing unmodified ✅
- This implementation record exists at `docs/implementation/FI5_FOOD_INTELLIGENCE_UI_ACTIVATION.md` ✅

**What must not break:** every existing capability's registration/binding/conversation-gateway behaviour, and every existing page's prior rendering (Dashboard/Planner/Cookbook/Pantry) for a surface with zero Food Opportunities. Proven by:

**Manual test steps performed:**
1. `npm run test:intelligence-opportunity-delivery-binding` — 50 passed, 0 failed (unmodified; proves this task's routes call a still-correct contract).
2. `npm run test:intelligence-registry-executability` — 124 passed, 0 failed (proves the `apiSurface` text edit didn't change registry executability truthfulness).
3. `npx tsc --noEmit` — diffed the before/after error list; every error present is pre-existing and unrelated to any file this task touched (`household-discovery-handler.ts`, various `server/tests/*` scripts, `planner-discovery-engine.ts`, etc.); zero new errors on any FI5 file.
4. Confirmed the already-running dev server (`NODE_ENV=development tsx server/index.ts`) registered the new route without crashing: `curl /api/intelligence/food-opportunities` → `401` (correct — unauthenticated caller, honest auth gate, not a 404/500).
5. Traced `DeliverableOpportunity` (server, `opportunity-delivery/framework.ts`) against `FoodOpportunity` (client, `use-food-opportunities.ts`) field-for-field — exact match, confirming the client never needs to guess or coerce a field.

---

## DATA IMPACT

- Reads existing data: **YES**, indirectly — via `opportunity-delivery`'s existing `report` verb only (no direct database read anywhere in this task's own files).
- Writes new data: **NO new table, no new column.** The EL1 evidence call writes to EL1's own already-existing `evidence_learning` store via its own already-registered `report` verb (no new write path introduced by this task).
- Changes meaning of existing data: **NO.**
- Requires backfill: **NO.**

---

## TRUST CHECK

- **Could this mislead the user?** No. Every rendered field is a verbatim projection of OD1/FI4 output; no client-side rewriting, summarising, or re-ranking occurs.
- **Could this fabricate certainty?** No. A gap/empty outcome renders nothing or an honest empty message, never a placeholder opportunity.
- **Is anything guessed but shown as real?** No. `FoodOpportunityCard` refuses to render if `explanation` is falsy — a defensive backstop, since the server-side contract already guarantees it.
- **What happens if the system is wrong?** Worst case: a surface shows nothing (the `isPending`/empty branches both render nothing), or an accept/dismiss click fails silently on the OD1 side and the item simply remains visible (the cache is only mutated on a confirmed `outcome.status === "ok"`) — never a false "resolved" state shown to the household.
- No architectural duplication introduced: **YES** — one hook, one card, one panel, no per-surface copies.
- No new source of truth created: **YES** — this task creates a presentation layer only.
- No runtime behaviour altered for any existing capability: **YES** — confirmed by the unmodified OD1 test suite (50/50) and registry-executability suite (124/124) both still passing.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-fi5-food-intelligence-ui-activation-20260703` → `9d6cc99`
- Files added: `client/src/components/FoodOpportunitiesPanel.tsx`, `client/src/components/intelligence/FoodOpportunityCard.tsx`, `client/src/hooks/use-food-opportunities.ts`, this file.
- Files modified (additive only): `client/src/components/intelligence/index.ts` (one new export), `client/src/pages/dashboard.tsx`, `client/src/pages/weekly-planner-page.tsx`, `client/src/pages/meals-page.tsx`, `client/src/pages/pantry-page.tsx` (one import + one additive JSX block each), `server/routes.ts` (two new routes appended, nothing removed), `server/intelligence/capability-registry.ts` (one text field on the existing `opportunity-delivery` descriptor).
- Rollback commands: `git checkout rollback/before-fi5-food-intelligence-ui-activation-20260703 -- <path>` for any file above, or delete the three new files and revert the additive edits (each is independently revertible — no other file reads any of this task's new exports).
- Verification after rollback: `git status` returns to the pre-FI5 dirty set (the unrelated EL2 investigation file, untouched throughout); the four pages render exactly as before FI5; `npm test` chain unaffected (this task added no chain entry).

---

## SCOPE LOCK

**Implemented scope (this task):**
- Two thin HTTP routes over the already-registered `opportunity-delivery` capability (report / acknowledge / accept / dismiss), including a best-effort EL1 evidence report on accept/dismiss.
- One client hook (`useFoodOpportunities`), one card component (`FoodOpportunityCard`), one panel component (`FoodOpportunitiesPanel`) — shared by every consuming surface.
- Four consuming surfaces wired: Dashboard summary, Planner ambient strip, Cookbook meal-improvement prompts, Pantry "use what you have."
- One descriptive-text update to the `opportunity-delivery` capability registry entry (`apiSurface`), reflecting the new routes truthfully (INT6A).
- This implementation record.

**Explicitly excluded (out of scope — honest gaps, not oversights):**
- Any new opportunity type or reasoning change — this task surfaces FI4's three existing generators only.
- Any wearables, biomarkers, predictive AI, or autonomous action — explicitly excluded by the brief; the two card buttons never write to Planner, Pantry, or Shopping.
- Any Cookbook-specific opportunity producer — Cookbook remains a consuming surface reframing pantry/shopping opportunities, per FI4's own honest exclusion.
- Any new platform architecture, new capability, or new database table.
- A dedicated automated test file for this task's two routes — covered instead by the pre-existing, unmodified OD1/FI4 test suites plus the manual verification steps above, since this task adds no new capability logic to test.

**Suggestions for follow-up workstreams (not implemented without approval):**
- A dedicated integration test exercising the two new HTTP routes end-to-end (supertest-style), if/when this UI surface graduates from AMBER to a more heavily-relied-upon path.
- Extending `FoodOpportunitiesPanel` to a fifth surface (e.g. a household settings/notifications digest) once a concrete need is named.
- Revisiting EL1's evidence-report call once EL1 gains a second reporter, to confirm the `outcomeType`/`direction` vocabulary this task chose (`"opportunity-response"`, `positive`/`negative`) still fits a second producer's own semantics.

---

## FILES CHANGED

| File | Change |
|---|---|
| `client/src/hooks/use-food-opportunities.ts` | **New** — the one client-side owner of the Food Opportunity read + resolve calls |
| `client/src/components/intelligence/FoodOpportunityCard.tsx` | **New** — renders one opportunity via the existing `IntelligenceCard` primitive |
| `client/src/components/FoodOpportunitiesPanel.tsx` | **New** — the one presentation owner every consuming surface renders through |
| `client/src/components/intelligence/index.ts` | + export `FoodOpportunityCard` |
| `client/src/pages/dashboard.tsx` | + `FoodOpportunitiesPanel` — "Food Intelligence" summary, all domains, limit 5 |
| `client/src/pages/weekly-planner-page.tsx` | + `FoodOpportunitiesPanel` — "Planner opportunities", `domains=["planner"]`, limit 3 |
| `client/src/pages/meals-page.tsx` | + `FoodOpportunitiesPanel` — "Meal ideas from your kitchen", `domains=["pantry","shopping"]`, limit 4 |
| `client/src/pages/pantry-page.tsx` | + `FoodOpportunitiesPanel` — "Use what you have", `domains=["pantry"]`, limit 4 |
| `server/routes.ts` | + `GET /api/intelligence/food-opportunities`, + `POST /api/intelligence/food-opportunities/:opportunityId/:action` (both thin wrappers over `intelligencePlatform.handle()`) |
| `server/intelligence/capability-registry.ts` | `opportunity-delivery` descriptor's `apiSurface` field updated to name the two new routes (text only) |

Verified: `test:intelligence-opportunity-delivery-binding` (50/50), `test:intelligence-registry-executability` (124/124), `npx tsc --noEmit` (no new error on any touched file), live route check against the running dev server (401 unauthenticated, route registered cleanly).

---

*Rollback: `rollback/before-fi5-food-intelligence-ui-activation-20260703` → `9d6cc99`.*
