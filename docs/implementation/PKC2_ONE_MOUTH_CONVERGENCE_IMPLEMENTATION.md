# PKC2 — One Mouth Convergence — Implementation

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Changes what a live, user-facing surface (Food Report, and every assembler that embeds it) is allowed to return for health-benefit claims — a behavioural change to an existing read path, not additive-only content. Consistent with PKC0's own risk rating for the same reason.

---

## GOVERNING ARCHITECTURE

**`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** (PKCA1), specifically:

- **Rule KC4 ("one mouth")** — *"Every knowledge entity type has exactly one owning store … and exactly one runtime adapter that is the sole surface permitted to render facts about it. Every consuming surface calls that adapter; no surface re-derives, re-phrases, or independently queries the underlying store for the same fact."*
- **§2.1** — names `shared/canonical/food-report-adapter.ts` (`buildFoodReport`) as Food's "one mouth" in the platform register — a claim this phase makes true for benefit claims specifically, closing the gap PKC1 found in it.
- **§7 Phase 1 (carried forward as the PKC2 candidate)** — PKC1's own "Suggestions" section named this work precisely: *"converge Food Report's health-benefit rendering onto the PKC0 evidence gate — likely shape: expose an API endpoint the client calls instead of computing `buildFoodReport`'s `healthBenefits` field in-browser, so the evidence-gated (DB-backed) reader can be reused directly rather than reimplemented against static seed data."* This phase implements exactly that shape.
- **Rule KC8** — "declared is not enforced" — a rule with no running validator is a hope, not a guarantee.
- **§8 Risk R3** — *"The 'one mouth' rule (KC4) is treated as aspirational rather than enforced, allowing a second narrator to appear before the adapter is built."*

**Immediate predecessor:** `docs/implementation/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md`'s **Finding 2** is this phase's exact starting point (quoted in full below, §"What This Phase Found").

Also read as background: `docs/implementation/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md` (the Layer-2 evidence gate this phase converges onto), `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-pkc2-one-mouth-convergence-20260704` → `ff3b2cf` |
| Working tree | Intentionally dirty — carries prior uncommitted, unrelated workstreams (EWO2 Companion Personality, EWX1 Living Companion Experience, FI5 Food Intelligence UI Activation, Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture) untouched by this work |
| This task's writes | See "Files changed" in the Rollback Plan below |
| Rollback command | `git checkout rollback/before-pkc2-one-mouth-convergence-20260704 -- <file>` per file, or full reset to the tag |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md`
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (the governing architecture for this workstream)
- [x] `docs/implementation/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md`
- [x] `docs/implementation/PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md` (Finding 2 — this phase's mandate)

---

## WHAT THIS PHASE FOUND

PKC1 (2026-07-04, immediately prior) traced every consumer of Food Knowledge and found one live, unresolved "one mouth" violation it named as **Finding 2**, quoted here in full because this phase closes it:

> `shared/canonical/food-report-adapter.ts` (`buildFoodReport`, the adapter behind `FoodReport.tsx`, `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, and `connected-food-intelligence-assembler.ts`) reads food↔benefit facts **directly from the raw editorial seed** (`FOOD_BENEFITS` in `shared/knowledge/relationships.ts`). It does not call `isEvidenceBackedClaim`, does not check `sourceRefs`, and does not check `reviewedAt` — the Layer-2 evidence gate PKC0 built one phase earlier … This means, today: the identical food↔benefit claim can render on the Food Report page with zero sourcing and zero human sign-off, while the same claim is correctly hidden on Pantry/Boost pending evidence and review. Two mouths, two trust guarantees, one fact.

Verification this phase performed before writing any code, against actual `HEAD`, not against any document's claim:

1. **Traced every real call site of `buildFoodReport(...)`** (`grep -rn "buildFoodReport("`) across `client/`, `server/`, `shared/`: `client/src/components/FoodReport.tsx` (client, in-browser, via `PlantDiversityReport.tsx`), `server/routes.ts`'s `/api/pantry/search-index` route, `server/lib/food-intelligence-assembler.ts`, `server/lib/meal-intelligence-assembler.ts`, `server/lib/connected-food-intelligence-assembler.ts`, and the file's own test suite.
2. **Confirmed `connected-food-intelligence-assembler.ts` is NOT a second violation** — its two `buildFoodReport(...)` calls (partner-food co-occurrence naming, and the top-level report) only ever read `report.overview.name`; grep for `report\.` in that file shows no `healthBenefits` access anywhere. It needed no change.
3. **Confirmed `shares_benefits` food-relationship edges (`shared/relationships/food-graph.ts`) are dead for display, not a second violation** — `derivedSharesBenefits()` builds an `explanation` string naming raw benefit *slugs* (unformatted), but `shared/discovery/engine.ts`'s own `fromGraph()` calls (lines 340–342) never request `"shares_benefits"` in their `wsTypes` filter, and neither does `connected-food-intelligence-assembler.ts`'s `relationshipLinks(graph, [...])` calls. `discovery/engine.ts`'s own comment (line 70) explains why: `shares_benefits`-only pairings are "a bad discovery" (WS8's own finding), so the type is used only as an internal familiarity-ranking signal (`buildFamiliaritySet`), never rendered as text. No live surface reaches it.
4. **Confirmed `PlantDiversityReport.tsx`'s `benefitSummary` field is already evidence-gated** — it comes from `/api/knowledge/ingredient-lookup` → `resolveIngredientsToKnowledgeSummary()` → `getFoodBenefitsForDisplay()` (`server/services/nutrition-knowledge-registry.ts`), the same Layer-2 gate PKC0 built. Not a second mouth; already converged.

**Conclusion:** exactly one real "one mouth" violation existed — `buildFoodReport()`'s `healthBenefits`/variety `additionalBenefits` fields, reached through five call sites. This phase closes all five without opening a sixth.

---

## THE ARCHITECTURAL CONSTRAINT THIS PHASE HAD TO RESOLVE

`buildFoodReport()` is deliberately DB-free — its own header comment states it "runs identically in the client bundle … and on the server … reads directly from the typed seed constants (no DB round-trip)." The Layer-2 evidence gate (`isEvidenceBackedClaim`, PKC0) reasons over `reviewedAt`, a column that is genuine DB state written only by the human sign-off tool (`server/seeds/signoff-knowledge-claims.ts`) — it does not exist in the static seed constants at all. `buildFoodReport()` therefore cannot ever itself answer "is this claim evidence-backed?" without either (a) becoming DB-dependent (breaking its client-bundle contract) or (b) duplicating the evidence gate's logic against a copy of the data (a second gate — exactly what Rule KC4 forbids). PKC1 named both real options; this phase takes the one it recommended.

---

## WHAT THIS PHASE DID

### 1. `buildFoodReport()` no longer computes benefit claims (`shared/canonical/food-report-adapter.ts`)

`healthBenefits` and every variety's `additionalBenefits` are now **always** `[]` from this function. The dead code that used to compute them from the raw `FOOD_BENEFITS` seed (`getHealthBenefits`, `toBenefitDisplayNames`, the `benefitDisplayName` lookup map) is deleted, along with the now-unused `FOOD_BENEFITS`/`HEALTH_BENEFIT_SEED` imports. This is the change that actually closes Rule KC4 for Food Report: it is not enough to add a second, better path *alongside* the old one — the old path's ability to produce an ungated claim had to be removed, or a future caller could silently reappear on it (PKCA1 §8 Risk R3). `keyNutrients`/`nutritionContext`/identity/varieties are untouched — nutrient *facts* are not benefit *claims* and stay outside PKC0's scope, exactly as PKC1's own suggestion flagged for a future phase to confirm explicitly (now confirmed: unchanged).

### 2. One new composition function — the actual "one mouth" (`server/lib/food-report-evidence.ts`, new)

`getEvidenceBackedFoodReport(canonicalSlug)` is the single function that composes:
- **Identity + nutrients + context** — `buildFoodReport()` (unchanged, DB-free, shared)
- **Benefit claims** — `getFoodBenefitsForDisplay()` (`server/services/nutrition-knowledge-registry.ts`, PKC0's existing Layer-2 gate — reused, not reimplemented)

into the same `FoodReportKnowledge` shape every existing consumer already expects, with `healthBenefits`/`additionalBenefits` now populated from the evidence-gated registry instead of always empty. This file is server-only (it imports the DB-backed registry) — it must never be imported from a client-bundled file, which is exactly why it lives in `server/lib/`, not `shared/`.

### 3. Every real consumer switched from `buildFoodReport()` to `getEvidenceBackedFoodReport()` for benefit claims

| Consumer | Change |
|---|---|
| `server/lib/food-intelligence-assembler.ts` (`getFoodIntelligence`) | `buildFoodReport(foodSlug)` → `await getEvidenceBackedFoodReport(foodSlug)`. Already an async function; drop-in. |
| `server/lib/meal-intelligence-assembler.ts` (`assembleFoods`) | Converted from sync to async; resolves unique ingredient slugs first, then fetches reports for them in parallel (`Promise.all`), preserving the existing per-meal dedup-by-slug behaviour. `getMealIntelligence` now awaits it inside its existing `Promise.all` phase instead of calling it as a "pure synchronous" step. |
| `server/routes.ts` — `/api/pantry/search-index` | Was already async but called `buildFoodReport` synchronously per pantry item in a `for` loop. Rewritten to resolve canonical slugs first, fetch evidence-gated reports for the **unique** slugs in parallel, then build the per-item term index from that map — one DB round-trip per distinct food, never per pantry item (a performance improvement, not just a correctness fix, since `getEvidenceBackedFoodReport` now does real queries this route never paid for before). |
| `server/routes.ts` — new `GET /api/foods/:slug/report` | New route, same auth/validation/404 shape as the sibling `/api/foods/:slug/intelligence` route. This is the client-safe way to read a Food Report. |
| `client/src/components/FoodReport.tsx` | Was the one true in-browser violation: `useMemo(() => buildFoodReport(canonicalSlug))`, computed entirely client-side with no possibility of DB access. Converted to `useQuery` against the new `/api/foods/:slug/report` endpoint (same pattern already used by `food-detail-page.tsx`). Only `type` imports remain from `food-report-adapter.ts` — no runtime code from that module ships in this component's bundle any more. |
| `server/lib/connected-food-intelligence-assembler.ts` | **Not changed** — confirmed (see "What This Phase Found" #2) it never reads `healthBenefits`; its two `buildFoodReport` calls remain, unmodified, for identity-name lookups only. |

### 4. Test coverage

- **`server/tests/test-food-report-adapter.ts`** — the three assertions that expected `buildFoodReport()` to return real benefit names (tomato/spinach/mushroom) were updated to assert the new, correct contract: always `[]`. Header comment updated to state the DB-free/DB-gated split explicitly.
- **`server/tests/test-food-report-evidence.ts`** (new) — proves (a) `buildFoodReport()` never renders a claim itself, (b) an unknown slug returns `null` from the composer exactly as it does from `buildFoodReport()`, and (c) for a sample of 15 canonical foods (and every one of their varieties), `getEvidenceBackedFoodReport()`'s `healthBenefits`/`additionalBenefits` are **exactly** what `getFoodBenefitsForDisplay()` — the same registry function Pantry/Boost already call — returns for that food's knowledge slug. This is a parity test, not a snapshot test: it holds regardless of whether zero or many claims have cleared human sign-off, so it stays valid as content is reviewed over time rather than needing to be rewritten the day an editor runs `npm run knowledge:signoff`.
- Wired into `package.json` as `test:food-report-evidence` and added to the aggregate `npm run test` chain, alongside `test:knowledge-evidence-gate` (PKC0's own gate test) — this is now the second automated check standing behind Rule KC4/KC8 for Food Knowledge.

### A pre-existing, unrelated test failure found incidentally (not fixed by this phase)

While running `test:food-report-adapter.ts` to confirm no regressions, one pre-existing failure was found: *"lentils: Green has no additionalNutrients (not yet in WS0)"* now fails, because `green-lentil`'s `knowledgeFoodSlug: "green-lentils"` link (and its `FOOD_NUTRIENTS["green-lentils"]` entries) were added by `feat(ws0.8): launch food coverage expansion` (2026-06-21) — over two weeks before this phase, and unrelated to health benefits or evidence gating. `git log -S'"green-lentils"' -- shared/canonical/foods.ts` confirms the date. Named here, not fixed, per this document's own scope (PKC2 is about benefit-claim convergence, not WS0.8 nutrient-coverage test maintenance) — exactly the same "name it, don't silently absorb it into an unrelated phase" discipline PKC1 itself modelled for Finding 2.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity, key space, or identity touched. canonical_food / knowledge_food_*
  keys unchanged; getEvidenceBackedFoodReport reads the same knowledgeFoodSlug
  bridge buildFoodReport already used.

☑ One owner per fact
  Benefit claims: knowledge_food_benefits / knowledge_nutrient_benefits
  (unchanged owner, per the SoT Register). Identity/nutrients/context:
  CANONICAL_SEED / FOOD_NUTRIENTS / NUTRITION_CONTEXT (unchanged owner).
  This phase adds no new store.

☑ No duplicate source of truth
  getEvidenceBackedFoodReport() composes two existing owners; it does not
  re-derive, cache, or copy either. isEvidenceBackedClaim (PKC0) is called
  exactly once per claim, inside getFoodBenefitsForDisplay — never
  reimplemented in the new composer.

☑ Honest gaps, never fabrication
  A benefit claim with no valid SourceRef or no human reviewedAt sign-off is
  absent from every consumer listed above — the same "honest gap, not
  fabrication" behaviour PKC0 already enforces for Pantry/Boost, now
  identical for Food Report. Today this means healthBenefits render empty
  everywhere (0 of PKC0's 21 sourced claims have completed sign-off yet) —
  an accurate, if currently sparse, honest state, not a regression this
  phase introduces silently: PKC0 already made this exact trade-off for
  Pantry/Boost and it was accepted then.

☑ Extends existing architecture, does not invent new architecture
  Implements PKCA1 Rule KC4 + PKC1's own named suggestion exactly: one new
  server-only composition function reusing two existing owners, plus one
  new API route following the existing /api/foods/:slug/* pattern. No new
  lifecycle, evidence vocabulary, or storage shape introduced.
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — the new /api/foods/:slug/report route requires
  req.isAuthenticated(), matches the existing /api/foods/:slug/intelligence
  and /api/foods/:slug/connected routes' auth + slug-validation shape exactly
  ([a-z0-9-]+, 400 on malformed input).
☑ Privacy — no user/household data touched; benefit claims are editorial
  content, not personal data.
☑ Performance — the pantry-search-index route went from N synchronous seed
  reads to min(N, unique-foods) parallel DB queries — bounded by distinct
  foods in the pantry, not item count, and run concurrently via Promise.all
  rather than sequentially. meal-intelligence's assembleFoods similarly
  batches its per-ingredient lookups in parallel. FoodReport.tsx trades one
  in-browser seed read for one network request per expanded row — acceptable
  because (confirmed by reading PlantDiversityReport.tsx) FoodReport only
  renders inside an already-expanded table row, i.e. on explicit user
  interaction, not eagerly for every row.
☑ Observability — no new failure mode; getEvidenceBackedFoodReport returns
  null under the same conditions buildFoodReport already did (unknown slug),
  and getFoodBenefitsForDisplay already never throws (PKC0).
☑ Accessibility — no layout/markup change to FoodReport.tsx; only its data
  source changed (useMemo → useQuery). Loading state renders nothing (report
  undefined → same `if (!report) return null` guard as before), consistent
  with the component's existing "no placeholders" rule.
☑ Trust — this IS the Trust closure PKC1 named as its own next milestone:
  the identical food↔benefit claim now carries the identical trust
  guarantee on Food Report as it already does on Pantry/Boost. Rule KC4
  ("one mouth") is now enforced for Food Knowledge with zero known
  exceptions, not just declared.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Knowledge — Food Report health-benefit rendering
  (PKCA1 §2, Rule KC4; the specific gap named as PKC1 Finding 2)
Declared SoT: knowledge_food_benefits / knowledge_nutrient_benefits
  (unchanged owner) for benefit claims; CANONICAL_SEED / WS0 knowledge seed
  (unchanged owner) for identity/nutrients/context.
New store created? NO.
Existing store extended? NO — no schema change. PKC0 already added the
  sourceRefs/reviewedAt columns this phase reads through the existing gate.
Consumer created? YES (composition, not storage) — server/lib/food-report-
  evidence.ts (getEvidenceBackedFoodReport) and GET /api/foods/:slug/report.
  Both compose two pre-existing owners; neither introduces a third.
Consumer retired? Effectively — buildFoodReport() can no longer act as a
  benefit-claim consumer of the raw editorial seed (its healthBenefits/
  additionalBenefits output is now permanently []); the function itself is
  not deleted because its identity/nutrient/context role is still real and
  still DB-free by design.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Knowledge — Food Report health-benefit rendering (PKCA1 §2, Rule KC4)

Current Canonical Owner:
  knowledge_food_benefits / knowledge_nutrient_benefits (benefit claims,
  Layer-2 gated per PKC0); CANONICAL_SEED / WS0 knowledge seed
  (identity/nutrients/context, unchanged).

Current Runtime Consumer(s):
  FoodReport.tsx (via GET /api/foods/:slug/report), food-intelligence-
  assembler.ts (getFoodIntelligence → /api/foods/:slug/intelligence),
  meal-intelligence-assembler.ts (getMealIntelligence → /api/meals/:id/
  intelligence), routes.ts's /api/pantry/search-index — all five now via
  the single getEvidenceBackedFoodReport() composer. connected-food-
  intelligence-assembler.ts unchanged (identity-only, confirmed no benefit
  claim ever passed through it).

Duplicate Owners Remaining:
  NONE — this phase introduces no new store. The pre-existing evidence gate
  (PKC0) and the pre-existing identity/nutrient seed (WS2A/WS0) remain the
  only two owners; they are now composed in exactly one place.

Duplicate State Remaining:
  NONE.

Duplicate Workflows Remaining:
  NONE for Food Report benefit claims — PKC1 Finding 2 (food-report-
  adapter.ts vs nutrition-knowledge-registry.ts, same fact, two trust
  guarantees) is closed. No other duplicate-adapter gap is known for Food
  Knowledge (confirmed by this phase's own consumer trace, "What This Phase
  Found" above).

Current Convergence (%):
  Rule KC4 ("one mouth") convergence for Food Knowledge: 100% — every known
  consumer of food↔benefit claims (5 call sites, verified) now reaches
  exactly one adapter (getEvidenceBackedFoodReport, itself a thin composer
  over the one pre-existing evidence gate). Content convergence is
  unchanged by this phase: still 0 of PKC0's 21 sourced claims have
  completed human sign-off (an editorial state, not an engineering gap;
  see PKC0's own Convergence Status).

Target Convergence (%):
  100% Rule KC4 convergence for Food Knowledge — met by this phase.
  Content convergence has no phase-specific target here; it is PKC0's
  "minimum 5 established, EFSA-signed-off benefits" criterion, unchanged
  and still pending an editorial sign-off action.

Next Planned Milestone:
  Editorial: a human reviewer runs `npm run knowledge:signoff -- --confirm
  REVIEWED` against PKC0's 21 pending sourced claims — the moment this
  phase's work becomes visible (currently, and correctly, invisible
  everywhere, including Food Report, because nothing has been reviewed
  yet). Engineering: PKCA1 §7 Phase 2 (name the "one mouth" adapter for
  every remaining Cluster A/B/C entity type still missing one — Food
  Relationships, Preparation Knowledge once built, recipe licence/
  attribution detail).

Remaining Architectural Risks:
  A pre-existing, unrelated test-data staleness item was found incidentally
  (see "A pre-existing, unrelated test failure" above) — not a PKC2 risk,
  named so a future WS0-coverage pass does not have to rediscover it.
```

---

## DEFINITION OF DONE

**What success looks like:**
- Every real consumer of Food Report health-benefit claims (5 call sites, verified by tracing every `buildFoodReport(...)` call site in the repo) reaches exactly one adapter — `getEvidenceBackedFoodReport()` — which itself calls the one pre-existing Layer-2 evidence gate (`getFoodBenefitsForDisplay`), never a second implementation of it.
- `buildFoodReport()` can no longer itself produce a benefit claim — the ungated path is closed, not merely bypassed by a newer path left standing alongside it.
- The client (`FoodReport.tsx`) no longer computes benefit claims in-browser against static, unreviewed seed data; it reads the same evidence-gated composition every server assembler reads.
- A parity test (`test-food-report-evidence.ts`) proves the composer's output exactly matches the registry's evidence-gated output, for a sample of real foods and their varieties, in a way that stays valid regardless of future sign-off state.

**What must not break:**
- Every existing Food Report / Food Intelligence / Meal Intelligence test continues to pass.
- Identity, nutrients (`keyNutrients`/`additionalNutrients`), and nutrition context are byte-for-byte unchanged (out of PKC0/PKC2's scope — confirmed, not merely assumed, via `test-food-report-adapter.ts`).
- `npm run seed:knowledge` and `npm run knowledge:signoff` remain unaffected (no schema or seed-pipeline change in this phase).

**Manual verification (performed this session):**
- `npx tsc --noEmit` — zero new errors from any file this phase touched (`food-report-adapter.ts`, `food-report-evidence.ts`, `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, `routes.ts`, `FoodReport.tsx`, both test files); the ~150 pre-existing errors present before this phase (top-level-`await` tsconfig issues in unrelated discovery-binding test files, and EWO2's `companionPersonality`/`weeklyBudget` schema drift in other in-flight test files) are unchanged and confirmed unrelated by filename.
- `npx tsx server/tests/test-food-report-adapter.ts` — 102 passed, 1 pre-existing unrelated failure (named above, not introduced by this phase).
- `npx tsx server/tests/test-food-report-evidence.ts` — 31/31 passed, including the live DB parity check across 15 canonical foods and all their varieties.
- `npx tsx server/tests/test-knowledge-evidence-gate.ts` — 100/100 passed (PKC0's own gate, unaffected).
- `npx tsx server/tests/test-intelligence-food-intelligence-binding.ts` — 36/36 passed (the FI3 read-only binding this phase's assembler feeds).
- Booted the dev server (`tsx server/index.ts`) directly and confirmed both the new `GET /api/foods/:slug/report` route and the modified `GET /api/pantry/search-index` route respond `401` (auth-required, as designed) rather than `500` — proving the new module resolves and wires cleanly at runtime, not just at typecheck.

---

## DATA IMPACT

- Reads existing data: YES — `knowledge_food_benefits`/`knowledge_nutrient_benefits` (via the pre-existing PKC0 gate) and the existing WS2A/WS0 seed constants. No new table or column read.
- Writes new data: NO.
- Changes meaning of existing data: NO — no row's stored meaning changes. What changes is which code path is *allowed to render* an already-existing row, and only for the one entity type (Food Report) that was previously bypassing the gate.
- Requires backfill: NO.

---

## TRUST CHECK

- **Could this mislead the user?** No — the opposite: before this phase, a user reading the Food Report page could see an unsourced, unreviewed benefit claim stated as fact, while the identical claim was correctly hidden on Pantry/Boost. This phase removes that inconsistency by making Food Report as honest as Pantry/Boost already were.
- **Could this fabricate certainty?** No. The only behavioural change is a further restriction on what may render — never an addition.
- **Is anything guessed but shown as real?** No. `getEvidenceBackedFoodReport()` performs no new inference; it composes two existing, already-verified data reads.
- **What happens if the system is wrong?** Same asymmetric failure mode PKC0 established: a bug in the gate or the composer can only cause an evidence-backed claim to be hidden (an honest gap), never cause an unsourced claim to render as if it were established.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- No runtime behaviour altered beyond the declared scope: **YES** — the only behavioural change is Food Report's benefit-claim rendering becoming evidence-gated, identically to Pantry/Boost, which is the entire point of this phase.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-pkc2-one-mouth-convergence-20260704` → `ff3b2cf`.
- Files changed by this phase:
  - `shared/canonical/food-report-adapter.ts` — `healthBenefits`/`additionalBenefits` always `[]`; dead benefit-name helpers and unused imports removed.
  - `server/lib/food-report-evidence.ts` — new; the `getEvidenceBackedFoodReport()` composer.
  - `server/lib/food-intelligence-assembler.ts` — swapped to the evidence-gated composer.
  - `server/lib/meal-intelligence-assembler.ts` — `assembleFoods` made async; swapped to the evidence-gated composer.
  - `server/routes.ts` — `/api/pantry/search-index` swapped and parallelised; new `GET /api/foods/:slug/report` route added.
  - `client/src/components/FoodReport.tsx` — converted from in-browser `buildFoodReport()` call to `useQuery` against the new route.
  - `server/tests/test-food-report-adapter.ts` — 3 assertions updated to the new (correct) contract; header comment updated.
  - `server/tests/test-food-report-evidence.ts` — new test file.
  - `package.json` — new `test:food-report-evidence` script, added to the aggregate `test` chain.
  - `docs/implementation/PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md` — this file, new.
- Rollback commands: `git checkout rollback/before-pkc2-one-mouth-convergence-20260704 -- shared/canonical/food-report-adapter.ts server/lib/food-intelligence-assembler.ts server/lib/meal-intelligence-assembler.ts server/routes.ts client/src/components/FoodReport.tsx server/tests/test-food-report-adapter.ts package.json` reverts every modified file; `rm server/lib/food-report-evidence.ts server/tests/test-food-report-evidence.ts docs/implementation/PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md` removes the three new files.
- Verification after rollback: `npx tsx server/tests/test-food-report-adapter.ts` shows the pre-PKC2 pass count (with the 3 healthBenefits assertions passing against the old, unsourced-seed behaviour); `grep -rn "buildFoodReport(" client server shared` shows the original 5 call sites unchanged.

---

## SCOPE LOCK

**Implemented scope (this phase):** exactly the PKC2 candidate PKC1 named — converge `buildFoodReport()`'s health-benefit rendering (and every consumer that read it: `FoodReport.tsx`, `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, and the `/api/pantry/search-index` route) onto the PKC0 Layer-2 evidence gate, via one new server-only composition function and one new client-facing API route; remove the raw-seed benefit computation from `buildFoodReport()` itself so the old ungated path cannot silently reappear; add test coverage proving the composer's parity with the evidence gate; confirm (not assume) `connected-food-intelligence-assembler.ts` and the `shares_benefits` food-relationship edges needed no change, with the trace recorded above so a future phase does not have to redo it.

**Explicitly excluded (out of scope — not implemented by this phase):**
- Any human sign-off of PKC0's 21 pending sourced claims — `reviewedAt` remains NULL for all of them; this is an editorial action (Rule KC9), not an engineering one, and this phase does not perform it.
- Fixing the pre-existing, unrelated `test-food-report-adapter.ts` "Green has no additionalNutrients" failure (WS0.8 test-data staleness, dated 2026-06-21, unconnected to benefit claims or evidence gating) — named above, left for a future WS0-coverage pass.
- PKCA1 §7 Phases 2–6 (per-entity-type "one mouth" adapters beyond Food Knowledge — Food Relationships, Preparation Knowledge once built, recipe licence/attribution detail; Evidence & Learning's first real reporter/consumer; demand-driven prioritisation; Retailer/Partner scope decisions).
- Any schema, migration, or seed-pipeline change — PKC0's `sourceRefs`/`reviewedAt` columns and seeding logic are reused exactly as they already exist.
- Any change to the other workstreams sitting uncommitted in the same working tree (EWO2, EWX1, FI5, Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture) — untouched, left exactly as found.

**Suggestions (not implemented without approval):**
- Once PKC0's claims clear human sign-off, spot-check `FoodReport.tsx`'s rendered output in a browser for at least one signed-off food, to visually confirm the citation-carrying `sourceRefs` data (already returned by `getFoodBenefitsForDisplay` and threaded through this phase's composer) is worth surfacing as a citation affordance on the benefit chip itself — the natural next UI consumer PKC0 already flagged as unimplemented.
- PKCA1 §7 Phase 2's own next candidate — Food Relationships (`shared/relationships/food-graph.ts`) — currently has no live benefit-claim leak (confirmed above), but its `shares_benefits` explanation text does directly interpolate raw benefit *slugs* (not display names) into a user-facing string if it were ever wired into a live surface in the future; worth a one-line fix (map through `HEALTH_BENEFIT_SEED` names) the day someone requests that type, so it does not ship pre-broken.

---

*Rollback: `rollback/before-pkc2-one-mouth-convergence-20260704` → `ff3b2cf`.*
