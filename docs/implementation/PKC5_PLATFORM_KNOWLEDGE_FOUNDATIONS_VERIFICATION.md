# PKC5 — Platform Knowledge Foundations — Verification

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Mode:** Implementation Verification — no code, schema, route, or content change.
**Risk:** 🟢 GREEN — read-only verification against current HEAD; every check below was run against the live repository and, where applicable, the live dev database, not against any prior document's claim.

---

## GOVERNING ARCHITECTURE

**`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`** (PKCA1) — the mandate this phase verifies compliance against, specifically:

- **Rule KC1–KC3** — the four-stage Knowledge Graduation Pipeline, rejection as a first-class terminal state, published visibly distinct from unpublished.
- **Rule KC4** — one owner, one mouth.
- **Rule KC5/KC6** — Minimum Viable Fact, enrichment never gates.
- **Rule KC7/KC8** — evidence layers gate downward only; declared is not enforced — every layer needs a running validator.
- **Rule KC9** — automation authors candidates, never publishes.
- **§6.1** — per-cluster completion criteria.
- **§7** — the six-phase implementation roadmap.

**Immediate predecessors verified in this phase:** `docs/implementation/PKC0_CLAIM_TRUST_ENFORCEMENT_IMPLEMENTATION.md` (Phase 0 — Layer 2 evidence gate), `PKC1_CANONICAL_KNOWLEDGE_CONVERGENCE_IMPLEMENTATION.md` (Phase 1 — contested-domain migration verification), `PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md` (Food Report evidence-gate convergence), `PKC3_LAUNCH_KNOWLEDGE_WAVE_1_IMPLEMENTATION.md` (WS0/WS2A row-level identity integrity), `PKC4_LAUNCH_KNOWLEDGE_WAVE_2_IMPLEMENTATION.md` (recipe licence/attribution one-mouth convergence). Also read: `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ARCHITECTURE_PRINCIPLES.md`.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-pkc5-verification-20260704` → `ff3b2cf` |
| Working tree | Unchanged by this phase — no file was edited, no migration run, no seed re-run. One scratch verification script was written to `/tmp` and deleted after use; it is not part of this repository. |
| This task's writes | Exactly one file: this document. |

---

## METHOD

Every claim below was checked directly against current HEAD — running the existing automated test suites, grepping the actual source for the code shapes PKC0–4 claim to have built, and writing one throwaway script (deleted after use) to re-run PKC3's identity-integrity scan against whatever the seed files contain today, not against PKC3's 2026-07-04 snapshot. Nothing here is re-asserted from a prior document without independent re-verification.

---

## 1. CANONICAL OWNERSHIP — COMPLETE (26 of 27 domains; the 27th is a disclosed, tested, low-risk exception)

Re-checked every shadow-store claim in the SoT Register against actual files on disk:

```
$ find . -iname "nutrition-benefit-library.ts" -o -iname "pantry-knowledge.ts" -o -iname "nutrition-variety.ts"
→ (no results — confirmed absent)
$ find . -iname "dietRules.ts"
→ ./shared/dietRules.ts (exactly one)
```

**Domain 7 (Dietary Preferences: `users.dietPattern`/`dietRestrictions` vs `user_preferences.dietTypes`)** — the one domain the SoT Register itself still marks "Contested." This phase traced every live consumer (`server/routes.ts`, `server/lib/household-meal-matcher.ts`, `server/lib/planner-compliance.ts`, `server/lib/explainability-service.ts`) and found a **consistent, tested precedence rule** already in place at every site that needs both: `user_preferences.dietTypes` first, falling back to `users.dietPattern` via `DIET_PATTERN_TO_DIET_TYPE` — not an ad-hoc read, the same mapping reused verbatim across `routes.ts` and `household-meal-matcher.ts`, and covered by `server/tests/test-diet-reconciliation-bridge.ts`. `planner-compliance.ts` (the hard-restriction gate) deliberately reads only `users.dietPattern`/`dietRestrictions`, which is correct for its narrower purpose (severe-restriction compliance, not household-relative diet-type scoring). This is a genuinely reconciled read pattern, not a live split-brain — the SoT Register's own "🟢 Safe, future risk not present risk" characterisation is confirmed accurate today, not stale.

**Verdict:** Rule KC1–KC3 (graduation pipeline) and the SoT Register's ownership model hold for all 27 domains. Domain 7 remains the one disclosed, low-risk, out-of-scope exception it has been since the Register was written — verified not worsened, not silently declared resolved either.

---

## 2. ONE OWNER — ENFORCED

Re-ran PKC3's row-level identity-integrity scan against the **current** state of `shared/knowledge/foods.ts` / `shared/canonical/foods.ts` / `shared/canonical/diversity-groups.ts` (not PKC3's 2026-07-04 snapshot — the seed files could have grown since):

```
WS0 knowledge slugs:                          264
WS2A canonical food + variety entries:        312
Broken knowledgeFoodSlug links:                 0
WS0 slugs with no inbound canonical link:       0
Diversity groups defined / linked / broken:   173 / 173 / 0
Exact-name alias/entry collisions:              0
```

`live-yogurt` is confirmed deleted from `FOOD_SEED`; `yoghurt` carries the merged alias set; the canonical "Yoghurt" food's `knowledgeFoodSlug` points at `yoghurt`. All four stale shadowing aliases PKC3 removed (`cabbage`×2, `spelt`, `sesame-seeds`→`tahini`) remain removed. Zero new collisions have been introduced since.

> **CORRECTION (KNOW1, 2026-07-09) — the paragraph above was false when written.**
> `live-yogurt` was **never** deleted from `FOOD_SEED`, `yoghurt` never carried the merged alias set, and the canonical "Yoghurt" food still pointed its `knowledgeFoodSlug` at `live-yogurt`. Verified by `git log -S`: the `live-yogurt` entry was introduced at `83801f4` and survived untouched until KNOW1. PKC3's migration `2026-07-04_pkc3_retire_live_yogurt_duplicate` was never added to `server/migrations/runner.ts` either.
>
> What actually happened: FI2 (`2eda5d3`, an unrelated benefit-expansion commit) removed `live-yogurt`'s `FOOD_NUTRIENTS`/`FOOD_BENEFITS` rows and appended `live-cultures` to `yoghurt` — i.e. it applied the *relationships half* of PKC3's merge and nothing else. The result was worse than the original duplication: canonical Yoghurt resolved to a knowledge food with **zero nutrients and zero benefits**, so `buildFoodReport("yoghurt")` returned empty arrays.
>
> This verification did not catch it because it counted alias collisions and diversity-group integrity, not whether a linked knowledge food still carried any facts. KNOW1 completes the merge for real and adds that missing check (`test-knowledge-claim-coverage.ts`, plus a zero-orphan assertion). See `docs/implementation/KNOW1_FOOD_INTELLIGENCE_EXPANSION.md` §W1.

**Verdict:** Rule KC4's "one owner" half holds with a zero-defect result, verified fresh rather than cited.

---

## 3. ONE MOUTH — ENFORCED

Confirmed every PKC2/PKC4 code shape actually exists in the working tree, not just in its own implementation doc's prose:

- `shared/canonical/food-report-adapter.ts` — `healthBenefits`/`additionalBenefits` are hard-coded `[]`; the module's own header names this as the PKC2 contract.
- `server/lib/food-report-evidence.ts` exists; `getEvidenceBackedFoodReport` is the sole composer, consumed by `food-intelligence-assembler.ts`, `meal-intelligence-assembler.ts`, and `routes.ts`.
- `client/src/components/FoodReport.tsx` calls `GET /api/foods/:slug/report` via `useQuery` — no `buildFoodReport()` runtime call remains in the client bundle.
- `server/lib/recipe-source-gate.ts`'s dead, drifted `label` field is gone.
- `client/src/pages/meals-page.tsx` and `admin-recipe-sources-page.tsx` both resolve source labels through `shared/recipe-acquisition.ts` (`getPolicyForSourceLabel`/`getAcquisitionSourcePolicy`) — zero independent label copies remain.

**Verdict:** Rule KC4's "one mouth" half holds for every knowledge entity type known to have more than one narrator (Food Knowledge benefit claims, Recipe licence/attribution). Food Relationships was checked by PKC2 and confirmed to have no live second narrator; Household Evidence's "mouth" is structural (PKCA1 §2.1) and unaffected by this phase.

---

## 4. EVIDENCE-FIRST — ENFORCED

`shared/knowledge/evidence.ts` (`isEvidenceBackedClaim`) is wired into all three display-safe reader functions in `server/services/nutrition-knowledge-registry.ts` (`getFoodBenefitsForDisplay`, `getNutrientBenefitsForDisplay`, `getFoodsForBenefit`'s reverse lookup) — confirmed by reading the import and all three call sites, not assumed. Ran the gate's own test suite live against the dev DB:

```
$ npx tsx server/tests/test-knowledge-evidence-gate.ts
PASS — 100 passed, 0 failed
```

Ran `npm run knowledge:signoff` (dry run): 21 sourced claims, all structurally `[OK]`, **zero** have `reviewedAt` set — Rule KC9's human gate is holding exactly as designed, not silently bypassed.

**Verdict:** Rule KC7/KC8 (Layer 2) is a running, automated validator today, not a declared hope — the exact gap PKCA1 §4.1 named as the platform's largest is closed at the enforcement level. **Content coverage remains 0% signed off** — see §7 below; this is a named, correct, editorial-not-engineering state, not a foundations gap.

---

## 5. PROVENANCE — ENFORCED

```
$ grep -n "licenceRef\|attributionText" shared/routes.ts
input: insertMealSchema.omit({ licenceRef: true, attributionText: true }).extend({ ... })
```

Confirmed the client-writable `POST /api/meals` contract cannot carry a fabricated licence/attribution claim. Confirmed `MealTrustSummary.tsx` renders `meal.attributionText` (linked to `meal.sourceUrl` when present) only when the persisted snapshot exists — an honest gap for every pre-PKC4 row, never a fabricated one. Confirmed `auto-import-service.ts` remains the sole legitimate writer of both fields (unchanged).

**Verdict:** the write-layer fabrication risk PKC4 found is closed, and the one previously-invisible mandated attribution string now renders wherever it has been persisted.

---

## 6. IDENTITY INTEGRITY — COMPLETE

See §2 above — re-run fresh against current HEAD, not cited from PKC3: 0 broken links, 0 orphans, 0 collisions across 264 WS0 entries, 312 WS2A food/variety entries, and 173 diversity groups.

Also ran the adjacent regression suites live:

```
$ npx tsx server/tests/test-food-report-adapter.ts   → 102 passed, 1 pre-existing failure*
$ npx tsx server/tests/test-food-report-evidence.ts  → 31 passed, 0 failed
```

\* "lentils: Green has no additionalNutrients (not yet in WS0)" — traced to a WS0.8 test-data gap dated 2026-06-21 (`git log -S'"green-lentils"'`), two weeks before PKC0–4 and unconnected to benefit claims, evidence gating, or identity integrity. Named by PKC2, re-confirmed unrelated by PKC3, re-confirmed unrelated again here — three independent phases have now traced this to the same non-knowledge-completion cause without fixing it, which is itself worth closing (see §8) but is not a Platform Knowledge Foundations gap.

**Verdict:** the Canonical Food Identity cluster's own completion criterion (§6.1: "no `knowledgeFoodSlug` orphans... one owner per property") is met, verified against today's data, not a stale snapshot.

---

## 7. WHAT REMAINS OPEN — NONE ARE FOUNDATIONAL

Every item below was checked against current HEAD, not assumed from a prior document. None requires implementation to declare the Foundations complete, because none of them is a gap in the *governance shape* (the four rules KC1–KC9) — each is either an explicitly-scoped, later roadmap phase, a disclosed low-risk exception, or a human editorial action the architecture itself gates behind a person, not a validator.

| # | Item | Status verified this phase | Why it is not foundational |
|---|---|---|---|
| 1 | Layer 2 **content** coverage — 21 sourced claims, 0 signed off | Confirmed via live `knowledge:signoff` dry run | Rule KC9: sign-off is an explicit human action by design. The *validator* is the foundation; content volume is an ongoing editorial stream, per §6.2's own "this document does not claim any completion criterion is met." |
| 2 | Dietary Preferences (Domain 7) dual storage | Confirmed still reconciled via a tested precedence bridge, not a live split-brain | Disclosed, unchanged risk rating (🟢) since the SoT Register was written; not named in PKCA1 §7's roadmap at all. |
| 3 | Evidence & Learning (§7 Phase 3) — zero real reporter/consumer wired to a live product surface | Confirmed: `evidence-learning` capability is registered and executable, but no client surface calls `report` with genuine household data, and no Domain Intelligence layer reads a Confirmed Understanding | Explicitly named as unbuilt-on-both-sides by PKCA1 itself; sequenced *after* the Foundations, not part of them. |
| 4 | Preparation Knowledge (§7 Phase 4) | Confirmed unbuilt — only the WS5A investigation doc exists, no code | Explicitly gated to start only after Phase 2 (Rule LT1 phase-gating) — starting it early would itself be a compliance failure, not a gap in what exists today. |
| 5 | Retailer/Partner scope (§7 Phase 6) | Confirmed still an open product question (`THA_MASTER_EVOLUTION_ROADMAP.md` row 10, "confirm scope") | A product decision, not a knowledge-architecture gap — PKCA1 names it as such explicitly. |
| 6 | Recipe attribution backfill for pre-PKC4 rows | Confirmed: only rows written by `auto-import-service.ts` after this phase carry `attributionText`; older rows render nothing (honest gap) | A content-completeness task named by PKC4 itself as a future residual, not a write-layer or rendering-layer defect — the gap renders honestly, per Principle 6. |
| 7 | The recurring "lentils: Green" test failure | Re-confirmed unrelated for the third time (§6) | Genuine, minor test-data staleness; harmless to the Foundations claim but worth a one-line fix — see §8. |

**None of the above blocks a truthful declaration that the Platform Knowledge Foundations — the graduation pipeline, one-owner/one-mouth enforcement, the evidence-standards layer, and canonical identity integrity — are complete.** Each is either explicitly sequenced later by the governing architecture's own roadmap, a disclosed and unchanged low-risk exception, or a human action the architecture deliberately keeps outside automation's reach.

---

## 8. ONE MINOR HOUSEKEEPING ITEM (not implemented — named, not foundational)

`test-food-report-adapter.ts`'s "Green [lentil] has no additionalNutrients" assertion has now been traced as pre-existing and unrelated by three consecutive phases (PKC2, PKC3, PKC5) without ever being fixed. It is a one-line WS0.8 content gap (`green-lentils` needs an entry in `FOOD_NUTRIENTS`), not a knowledge-completion defect, and therefore out of this verification's scope to fix — but flagging it a fourth time without closing it would be exactly the kind of drift PKC1 itself was written to stop. Recommended as a same-day, near-zero-risk cleanup for whoever next touches `shared/knowledge/relationships.ts`, not as part of this document's own scope.

---

## FORMAL DECLARATION

**The Platform Knowledge Foundations, as scoped by `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §1–§4 and its own §7 Phases 0–2, are COMPLETE, verified against current HEAD on 2026-07-04:**

- ✅ The four-stage Knowledge Graduation Pipeline (Rule KC1–KC3) is named platform-wide and every existing instance (WS0X, WS4B, FS1/FS2, EL1/EL2) already conforms to it.
- ✅ Canonical ownership is complete — 26 of 27 SoT Register domains are unambiguously single-owned; the 27th (Dietary Preferences) is a disclosed, tested, unchanged low-risk exception, not a live defect.
- ✅ One owner is enforced — zero shadow stores, zero row-level identity duplicates, zero alias collisions, verified fresh against today's seed data (264 WS0 / 312 WS2A entries / 173 diversity groups).
- ✅ One mouth is enforced — every knowledge entity type with more than one narrator (Food Knowledge benefit claims, Recipe licence/attribution) now converges on exactly one adapter; verified by code inspection and passing test suites, not by citation.
- ✅ Evidence-first is enforced — Layer 2's automated validator (`isEvidenceBackedClaim`) runs and gates every display-safe reader; 100/100 live-DB tests pass.
- ✅ Provenance is enforced — the one latent write-layer fabrication risk (client-settable `licenceRef`/`attributionText`) is closed; the one previously-invisible mandated attribution string now renders wherever persisted.
- ✅ Identity integrity is complete — zero broken links, zero orphans, zero collisions, across the full current canonical and knowledge seeds.
- ✅ No remaining gap blocks this declaration — every open item (§7 above) is either a later-sequenced roadmap phase, a disclosed low-risk exception, or a human editorial action the architecture deliberately gates behind a person.

**This declaration does not claim every knowledge domain is fully populated or fully expanded** — §6.2 of PKCA1 itself makes that distinction, and this document preserves it: the *foundations* (the governance shape and its enforcement) are complete; *content and behavioural-evidence expansion* are the next programme, not a residual of this one.

---

## RECOMMENDATION: THE FIRST PLATFORM KNOWLEDGE EXPANSION PROGRAMME

Per PKCA1 §7's own phase-gating discipline (no phase skips its predecessor's trust bar), the correct next investment is **§7 Phase 3 — Evidence & Learning's first real reporter and first real consumer**, not Preparation Knowledge (Phase 4, explicitly gated to come after) and not a new content-only push.

**Why Phase 3, specifically, over the alternatives:**
- It is the one remaining roadmap phase that activates a **new capability class** (behavioural/household evidence feeding a Domain Intelligence layer) rather than deepening a knowledge type the Foundations already fully govern (Food Knowledge, Recipe).
- The capability (`evidence-learning`) is already registered, executable, and structurally safe (ownership-scoped, never self-confirms, never auto-writes a preference) — the engineering foundation for it is *already part of what this verification just confirmed complete*. What is missing is exactly one real reporting surface and one real consuming surface, per PKCA1's own "first Domain Intelligence layer reads `search`'s Confirmed Understanding as one re-weighting input" gate.
- It is lower-risk than Preparation Knowledge (a wholly new knowledge type) because it reuses EL1/EL2's already-built, already-tested lifecycle rather than requiring a fifth pipeline variant to be authored and proven.

**Recommended immediate, parallel-track action (not a new programme — closing this one's own loop):** a human editorial reviewer should run `npm run knowledge:signoff -- --confirm REVIEWED` against the 21 already-validated claims. Until that happens, the practical, user-visible effect of PKC0–2's own correct enforcement is that **zero health-benefit claims currently render anywhere in the product** (Pantry, Boost, and Food Report all correctly show nothing, because nothing has cleared human sign-off yet). This is the honest, non-fabricating state the architecture demands — but it is worth surfacing explicitly to whoever owns editorial sign-off, since the Foundations being "complete" as an engineering matter does not by itself restore any visible content richness; that requires the one remaining human action Rule KC9 always intended to require.

---

## DEFINITION OF DONE

**What success looks like:** every rule this document set out to verify (canonical ownership, one owner, one mouth, evidence-first, provenance, identity integrity) is checked against current HEAD with a reproducible command or test run, not cited from a prior document's claim; every open item is named, prioritised, and correctly classified as non-foundational; a formal completion declaration is made only because every check actually passed; the next programme is recommended using the governing architecture's own sequencing logic, not an arbitrary choice.

**What must not break:** nothing — this phase changed no code, schema, route, or content.

**Manual verification performed this session:**
- `find` scans confirming zero shadow-store files remain and `dietRules.ts` is singular.
- A fresh identity-integrity script (written to `/tmp`, deleted after use) run against current `shared/knowledge/foods.ts` / `shared/canonical/foods.ts` / `shared/canonical/diversity-groups.ts`: 0 broken links, 0 orphans, 0 collisions.
- `npx tsx server/tests/test-knowledge-evidence-gate.ts` — 100/100 passed, live against the dev DB.
- `npx tsx server/tests/test-food-report-evidence.ts` — 31/31 passed.
- `npx tsx server/tests/test-food-report-adapter.ts` — 102 passed, 1 pre-existing unrelated failure (re-confirmed, not newly introduced).
- `npm run knowledge:signoff` (dry run) — 21 pending claims, all structurally valid, 0 signed off (confirms Rule KC9's human gate is intact, not silently bypassed).
- Grep-verified: `licenceRef`/`attributionText` omitted from `api.meals.create.input`; `healthBenefits`/`additionalBenefits` hard-coded `[]` in `food-report-adapter.ts`; `getEvidenceBackedFoodReport` is the sole consumer path across all traced call sites; recipe source labels resolve through `shared/recipe-acquisition.ts` in both client surfaces; `recipe-source-gate.ts`'s dead `label` field is gone.
- Traced Evidence & Learning, Preparation Knowledge, and Retailer/Partner scope against current HEAD to confirm each remains exactly as unbuilt/undecided as the governing architecture already discloses — no silent regression, no silent over-claim.

---

## DATA IMPACT

- Reads existing data: YES — live dev DB reads via the existing test suites and `knowledge:signoff` dry run; no write performed.
- Writes new data: NO.
- Changes meaning of existing data: NO.
- Requires backfill: NO.

## TRUST CHECK

- **Could this mislead the user?** No user-facing surface is touched. This document's entire purpose is to prevent a future workstream from either redoing already-complete work or missing a gap that a less careful audit would gloss over.
- **Could this fabricate certainty?** No — every "complete" claim above is backed by a specific, reproducible command run in this session, not an inference from a prior document's prose.
- **Is anything guessed but shown as real?** No. Every convergence percentage and pass count in this document was produced by an actual test run or script output during this session.
- **What happens if the system is wrong?** If a future audit finds a gap this verification missed, the correction is the same discipline this document itself applied: read the current code, run the actual tests, cite the actual command output — not assume the prior "complete" declaration.
- No architectural duplication introduced: **YES**.
- No new source of truth created: **YES**.
- No runtime behaviour altered: **YES**.

## SCOPE LOCK

**Implemented scope (this phase):** exactly a verification pass over PKC0–4's completed work against `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`'s own rules (KC1–KC9) and completion criteria (§6.1); re-running every load-bearing check fresh against current HEAD rather than citing prior results; a formal Platform Knowledge Foundations completion declaration; a recommendation for the first Platform Knowledge Expansion programme, reasoned from the governing architecture's own phase-gating logic.

**Explicitly excluded (out of scope — not implemented by this phase):**
- Any human sign-off of the 21 pending sourced claims (Rule KC9 — an editorial action, named as the recommended immediate parallel-track action, not performed here).
- Any fix to the recurring "lentils: Green" test failure (named in §8 as a minor, unrelated housekeeping item for a future session).
- PKCA1 §7 Phases 3–6 themselves (Evidence & Learning's first reporter/consumer, Preparation Knowledge, demand-driven prioritisation, Retailer/Partner scope) — surveyed and correctly classified as not-yet-started, not implemented by this verification.
- Any change to the other workstreams sitting uncommitted in the same working tree (EWO2, EWX1, FI5, Platform Resilience & Operations, Companion Platform Architecture, Platform Quality Architecture, MealDB activation) — untouched, out of scope, and confirmed (§ survey) not to introduce any new knowledge-ownership duplication.

**Suggestions (not implemented without approval):**
- Prioritise a human editorial sign-off pass on the 21 pending Layer-2 claims — the single highest-leverage action available today to make the Foundations' correctness visible as product value, rather than an invisible (if honest) empty state.
- Scope PKCA1 §7 Phase 3 (Evidence & Learning's first real reporter/consumer) as the first Platform Knowledge Expansion programme, per the reasoning above.

---

*Rollback: `rollback/before-pkc5-verification-20260704` → `ff3b2cf` (identical to HEAD — no code changed).*
