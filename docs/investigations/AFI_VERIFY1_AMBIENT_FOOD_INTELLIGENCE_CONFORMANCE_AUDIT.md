# AFI_VERIFY1 — Ambient Food Intelligence Conformance Audit

**Session:** `AFI_VERIFY1_Ambient_Food_Intelligence_Conformance_Audit`
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/AFI_VERIFY1-ambient-food-intelligence-conformance-audit-20260718` → commit `7bfad50c` (annotated)
**Type:** Read-only conformance audit. **No implementation. No file outside this document was modified.**

---

## Overall score — 6.6 / 10

| Axis | Score | One-line verdict |
|---|:--:|---|
| **Coverage** | 7.0 | All 11 generators wired and reachable; three consumer pages and one whole domain have no surface. |
| **Consistency** | 7.5 | One pipeline, one owner per type, no duplicate recommendation logic — with a contained double-clamp flaw. |
| **User value** | 6.0 | Real, cited, household-specific observations — but the engine's own clamp starves entire domains before the household sees them. |
| **Production readiness** | 6.0 | Server-side coverage is strong; the client layer is wholly untested and two named suites are dead. |

**Headline.** The core is architecturally sound and better than most of what surrounds it: a single Observation → Insight → Recommendation pipeline, a single registered producer, one owner per opportunity type, a real evidence gate, and a Companion that projects the producer's own words rather than re-authoring them. The defects are not in that spine — they are at its edges: **one entire domain (`nutrition`) is built, produced and dead**, the engine clamps its output *before* the delivery layer's learning-aware ranking can see it, and **the client rendering layer has no tests at all**.

This is production-ready for the four live domains, with the reservations in §9.

---

## 1. Scope and method

Static audit of the committed and working-tree state at `7bfad50c`, across `server/intelligence/`, `server/lib/`, `shared/`, `client/src/`, `server/tests/` and `package.json`. Every claim below carries a `file:line` citation. Runtime behaviour cited in §5.2 is empirical evidence carried forward from the `AFI3_5` session, which drove the live dev server against a real seeded household.

Nothing was executed that mutates state. No test suites were re-run for this audit; test findings are static reads of suite contents and `package.json` wiring.

---

## 2. Confirmations — what the architecture gets right

These were checked as explicit questions, and each passes.

### 2.1 One Observation → Insight → Recommendation pipeline — **CONFIRMED**

There is exactly one registered opportunity producer:

```ts
// server/intelligence/opportunity-delivery/framework.ts:285-287
const OPPORTUNITY_SOURCES: Readonly<Record<string, OpportunitySource>> = {
  "food-intelligence": { verb: "report", adapt: adaptFoodIntelligence },
};
```

Every household-visible opportunity flows FI4 engine → OD1 delivery → DEC1 decision → PHASE5C ambient surface / Notice Engine. No second engine, no second delivery path, no second ambient endpoint.

### 2.2 One owner per opportunity type — **CONFIRMED**

All 11 producible types are emitted from exactly one generator each, all in `server/intelligence/food-intelligence/opportunity-engine.ts`. The domain union is closed at four members (`opportunity-engine.ts:201`), and every `owningDomain` literal in the file falls inside it. No type is emitted from two places.

### 2.3 No duplicate recommendation logic — **CONFIRMED at the voicing boundary**

The Companion does not re-derive a recommendation. It concatenates a personality prefix onto the producer's own `suggestedAction`:

```ts
// server/intelligence/conversation/behaviour-engine.ts:258-283
case "opportunity": return voiceGuidanceLabel(fact.suggestedAction, personalityId);

// behaviour-engine.ts:142-146
export function voiceGuidanceLabel(baseLabel: string, personalityId: PersonalityId): string {
  const prefix = getPersonality(personalityId).guidanceLabelPrefix;
  return prefix ? `${prefix}${baseLabel}` : baseLabel;
}
```

Ranking, dedupe and clamping mechanics live once, in `shared/attention/decision.ts`, and all four consumers import them rather than reimplementing (`framework.ts:592`, `notice-engine.ts:487`, `opportunity-engine.ts:1032`, `shared/home/home-primary-action.ts:337`). See §5.2 for the one genuine flaw in *how* they are sequenced — it is a composition error, not a duplicated implementation.

### 2.4 Every recommendation is cited — **CONFIRMED, and enforced twice**

All 11 generator push-sites attach a literal non-empty `evidence[]` (verified at `opportunity-engine.ts` lines 334, 370, 416, 507, 578, 673, 730, 801, 864, 936, 1000). Independently, the Notice Engine drops any uncited notice:

```ts
// server/intelligence/conversation/notice-engine.ts:343-344
const evidence = o.evidence ?? [];
if (evidence.length === 0) continue; // Rule E1 — no citation, no card.
```

**No uncited recommendation path exists.** Belt and braces: the producers cannot emit one, and the boundary would refuse it anyway.

### 2.5 Architecture and AI-architecture compliance — **CONFIRMED, with one caveat**

- No new capability was introduced for AFI3–AFI5; `food-intelligence` was extended (`framework.ts:285-287`).
- `critical` remains a closed allowlist — `shopping-restriction-conflict` is the sole emitter, enforced at `adaptFoodIntelligence` via `assertCriticalAllowed` (`framework.ts:257`).
- Honest-gap discipline holds throughout: every domain read degrades independently inside its own `try/catch` (`opportunity-engine.ts:1139-1142`, `1195-1197`, `1217-1219`), and `AmbientIntelligence` renders `null` rather than a fabricated "all clear" (`AmbientIntelligence.tsx:116`).
- No LLM sits in the opportunity path. Generation is deterministic, rule-based and reproducible; the Companion's only model-adjacent step is a cosmetic personality prefix. This is the correct AI architecture for advice that must be defensible — **nothing here can hallucinate a recommendation.**

*Caveat:* the Companion notice channel and the ambient card channel both surface the same opportunities on Home (§4.4). The codebase argues this is a mount, not a second channel (`home-experience-page.tsx:929-931, 943-946`). I accept that reading — both derive from the same OD1 bundle — but note the notice channel bypasses the ambient surface's affordances and the ambient surface bypasses the Silence Rules.

---

## 3. Generator inventory — 11 generators, all live

All exported, all called by the orchestrator. **No dead generators.**

| # | Generator (`opportunity-engine.ts`) | Type | Domain | Priority | Call site |
|---|---|---|---|:--:|:--:|
| 1 | `identifyPlannerGapOpportunities` :305 | `planner-empty-day` | planner | high/medium | :1107 |
| 2 | `identifyPantryUnusedOpportunities` :353 | `pantry-item-unused-in-plan` | pantry | low | :1147 |
| 3 | `identifyShoppingRestrictionOpportunities` :397 | `shopping-restriction-conflict` | shopping | **critical** | :1155 |
| 4 | `identifyPlannerMealUpliftOpportunities` :464 | `planner-meal-uplift` | planner | low | :1129 |
| 5 | `identifyPlannerBatchCookOpportunities` :542 | `planner-batch-cook` | planner | low | :1135 |
| 6 | `identifyShoppingPantryDuplicateOpportunities` :652 | `shopping-item-already-in-pantry` | shopping | medium | :1160 |
| 7 | `identifyShoppingHigherRatedProductOpportunities` :701 | `shopping-higher-rated-product-available` | shopping | medium | :1175 |
| 8 | `identifyShoppingLessProcessedOpportunities` :767 | `shopping-less-processed-option` | shopping | low | :1165 |
| 9 | `identifyPantryNeedOpportunities` :831 | `pantry-need-not-on-shopping-list` | pantry | medium | :1186, :1193 |
| 10 | `identifyCookbookCookableNowOpportunities` :898 | `cookbook-recipe-cookable-now` | cookbook | low | :1211 |
| 11 | `identifyCookbookHouseholdConflictOpportunities` :966 | `cookbook-recipe-household-conflict` | cookbook | medium | :1213 |

### 3.1 Generators that never fire — **NONE structurally; four are hard to reach**

No generator is unreachable. Four have preconditions strict enough that they did not fire for a fully seeded demo household (empirically confirmed in `AFI3_5`):

| Generator | Why it rarely fires |
|---|---|
| `cookbook-recipe-cookable-now` | Requires **every** ingredient of a recipe to resolve canonically **and** be in the pantry (`:917-925`). A single unresolvable ingredient blocks the card. |
| `shopping-higher-rated-product-available` | Requires persisted Analyser product matches **and** `item.thaRating != null` **and** a strictly better match (`:710, :715`). |
| `shopping-less-processed-option` | Requires WS9 to return a curated `lower_upf` option surviving restriction filtering (`:783, :789`). |
| `pantry-need-not-on-shopping-list` | Requires `needQuantityValue > 0` (`:847`) — a field most households never populate. |

**Assessment: not a defect.** For `cookable-now` in particular, the strictness *is* the design — CBK2 §4.5/§4.6 exists precisely to refuse "nearly cookable". A card that claimed a household could cook something they cannot is far worse than silence. Recorded as a coverage-of-evidence issue (§8.2), not a bug.

---

## 4. Findings

### 4.1 🔴 **CRITICAL — an entire domain is built, produced, and dead**

The `nutrition` opportunity limb exists end-to-end in code and reaches **nothing**.

**Evidence:**
- Three types are defined — `shared/nutrition/household-nutrition.ts:601-605`: `nutrition-plant-diversity-gap`, `nutrition-balance-gap`, `nutrition-planning-gap`.
- They are genuinely produced with `owningDomain: "nutrition"` (`household-nutrition.ts:632, 649, 666`) by `buildOpportunities` (`:619`), called from `server/lib/household-nutrition-assembler.ts:275`.
- **`assembleHouseholdNutrition` (`household-nutrition-assembler.ts:221`) is never called in production.** Verified: no route, no handler, no server caller.
- `nutrition` is absent from **all four** registries: `OPPORTUNITY_SOURCES` (`framework.ts:285`), `DOMAIN_SURFACE` (`framework.ts:293`), `DOMAIN_TO_CATEGORY` (`notice-engine.ts:309`), `DOMAIN_LABEL` (`FoodOpportunityCard.tsx:36`).
- The only UI that would render them — `client/src/components/HouseholdNutritionPanel.tsx:308` mounting `<AmbientIntelligence domains={["nutrition"]} title="Ways to eat better this week">` — **is itself never mounted anywhere.** Verified by grep across `client/src`, `server`, `shared`: the only references are inside its own file.

So the limb is dead at *four* independent layers simultaneously. Even if the panel were mounted, `data.grouped["nutrition"]` could never populate, because no `nutrition` producer is registered — `AmbientIntelligence.tsx:91` would yield `[]` and render `null`.

The codebase already knows: `HouseholdNutritionPanel.tsx:85` states *"The honest state is that these opportunities currently reach NO surface."* That honesty is commendable, but the comment has not been acted on, and the code has kept accreting around it.

**This is simultaneously the audit's orphaned-types finding, its dead-code finding, and its UI-without-intelligence finding.** One decision resolves all three.

### 4.2 🟠 **HIGH — the engine clamps before the delivery layer can rank**

`prioritizeOpportunities` sorts and clamps to `DELIVERY_DEFAULT_LIMIT` (10) inside the engine:

```ts
// opportunity-engine.ts:1028-1033
export function prioritizeOpportunities(opportunities, limit = DELIVERY_DEFAULT_LIMIT) {
  return clampWithCriticalExemption(orderByAttention(opportunities), limit, DELIVERY_MAX_LIMIT);
}
```

The delivery framework then sorts and clamps *the survivors* again — this time with LEARN1's household-learning re-ranking and seen-suppression:

```ts
// framework.ts:592-598
const sorted = orderByAttention(opportunities, [
  (opportunity) => learningRankFor(opportunity, understanding),
  (opportunity) => (seen.has(opportunity.id) ? 1 : 0),
]);
const prioritised = clampWithCriticalExemption(sorted, limit, DELIVERY_MAX_LIMIT);
```

Both use the shared DEC1 mechanics, so this is **not** duplicated logic — it is a **sequencing** error. The consequence is concrete: candidates dropped by the engine's clamp are invisible to the household's own Confirmed Understanding, which is the entire point of LEARN1.

**Empirical proof** (`AFI3_5`, live server, demo household 905): the engine produced **30** opportunities at `limit=100`. At the default limit it returned **10**. Twenty `pantry-item-unused-in-plan` observations were discarded *inside the engine* — LEARN1 never saw them, and no amount of household learning could ever promote one. The Pantry surface consequently rendered empty for a household with a fully stocked pantry.

**Impact:** low-priority domains are structurally starved whenever a household has several medium/high-priority observations. This is the single largest suppressor of realised user value in the platform.

### 4.3 🟠 **HIGH — the client rendering layer has no tests of any kind**

There is **no client test infrastructure at all**: no `*.test.*` or `*.spec.*` under `client/`, no `vitest`/`jest` config, no runner in `devDependencies`. Playwright is present but used only by the screenshot-capture scripts, which assert nothing.

The exposed surface that matters:

- **`DOMAIN_LABEL` (`FoodOpportunityCard.tsx:36-43`) has zero coverage.** Its server-side counterparts are all asserted — `DOMAIN_SURFACE` at `test-intelligence-opportunity-delivery-binding.ts:95-98` and `test-intelligence-food-opportunity-binding.ts:456`; `DOMAIN_TO_CATEGORY` at `test-intelligence-notice-engine.ts:132-135, :338` and `test-intelligence-food-opportunity-binding.ts:447`. `DOMAIN_LABEL` is the **one registry of the four with no test**, and it is the last step before the household's eyes.
- A future domain registered server-side would pass every test and silently render under the generic `"Food"` fallback (`FoodOpportunityCard.tsx:110`). This is precisely the failure mode AFI5 was created to close for `cookbook` — and it remains open for the next domain.
- `AmbientIntelligence.tsx`'s selection logic (`:85-95`), its `null`-on-empty contract (`:116`) and its critical auto-expand (`:98-102`) are all untested.

### 4.4 🟡 **MEDIUM — two channels reach the household on Home, with asymmetric affordances**

The same OD1 bundle arrives on Home twice:

- **Companion notice** — `home-experience-page.tsx:615-640`, rendering `<li>{o.text}</li>`. Capped at 2 (`notice-engine.ts:462`), phrased via `phraseNotice`. **No affordances** — no accept, dismiss, or "why".
- **Ambient card** — `home-experience-page.tsx:945`, rendering `FoodOpportunityCard` with Helpful / Not now / Why this? and a collapsible evidence list (`FoodOpportunityCard.tsx:132-169`).

The codebase argues this is a mount rather than a channel (`home-experience-page.tsx:929-931`), and I accept that: one fetch, one bundle, TanStack-deduped. But two consequences are real:

1. **The Companion voices the action and drops the reason.** `phraseNotice` projects only `fact.suggestedAction` (`behaviour-engine.ts:281`). The producer's `explanation` — the evidence-bearing "why" — is computed, carried across the wire on the notice object, and never rendered. A household hears *"Review Salmon Fillets before buying it"* without *"…because it conflicts with a stored household restriction (Fish)."*
2. **The notice cap has no domain diversity rule.** `applySilenceRules` (`notice-engine.ts:483-488`) takes the top 2 by attention with no critical exemption and no diversity constraint. Empirically (`AFI3_5`): with a `critical` shopping conflict present, the cookbook observation never reached the Companion at all.

Related, and already documented as debt rather than defect — `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md:201` records that `/api/home/intelligence` and `/api/planner/weeks/:weekId/intelligence` assemble opportunity-shaped objects outside OD1 governance entirely. Not introduced by AFI; flagged here because it bears on the "one pipeline" claim at the edges.

### 4.5 🟡 **MEDIUM — duplicate-observation risk between generator pairs**

No two generators emit the *same* type, but four pairs can fire on the same household situation. Two are live today:

| Pair | Overlap | Status |
|---|---|---|
| `shopping-higher-rated-product-available` (:729) vs `shopping-less-processed-option` (:800) | Both fire on the **same unchecked shopping line** with no mutual exclusion (called at :1175 and :1165). Both say "consider a different product for this line". | **Live risk** |
| `pantry-item-unused-in-plan` (:369) vs `cookbook-recipe-cookable-now` (:935) | Both are "cook from what you have" over the same pantry rows. An unused item that is an ingredient of a cookable recipe yields both. | **Live risk** |
| `planner-empty-day` (:333) vs `nutrition-planning-gap` (`household-nutrition.ts:672`) | Near-identical observation, two engines. | Masked only by §4.1 |
| `planner-meal-uplift` (:515) vs `nutrition-plant-diversity-gap` (`household-nutrition.ts:640`) | Both "add an ingredient to a meal this week". | Masked only by §4.1 |

The last two are a direct argument against resolving §4.1 by *enrolling* the nutrition producer without first reconciling its types against the existing four domains.

Checked and confirmed **not** duplicates: `shopping-item-already-in-pantry` (:672) and `pantry-need-not-on-shopping-list` (:863) are mutually exclusive by construction — one requires the slug on the list, the other requires it absent (`:852`).

### 4.6 🟡 **MEDIUM — surface gaps on three consumer pages**

Eight `AmbientIntelligence` mounts exist. Coverage of the pages named in this brief:

| Page | Ambient surface | Domains |
|---|:--:|---|
| Home (`home-experience-page.tsx:945`) | ✅ | all (aggregate) |
| Dashboard (`dashboard.tsx:340`) | ✅ | all (aggregate) |
| Planner (`weekly-planner-page.tsx:1994`) | ✅ | planner |
| Shopping (`shopping-workspace-page.tsx:2310`) | ✅ | shopping |
| Pantry (`pantry-page.tsx:1184`) | ✅ | pantry |
| Cookbook / Meals (`meals-page.tsx:3593`) | ✅ | cookbook — hidden while searching (`:3592`) |
| Meal detail (`meal-detail-page.tsx:1228`) | ✅ | planner, filtered to `planner-meal-uplift` |
| **Food detail** (`food-detail-page.tsx`) | ❌ | — |
| **Diary** (`food-diary-page.tsx`) | ❌ | — |
| **Analyser / Products** (`products-page.tsx`) | ❌ | — |

**No missing surface in the server→client direction:** every domain in `DOMAIN_SURFACE` (`framework.ts:293-301`) has a matching client mount. The gaps are consumer pages with no ambient presence at all.

The **Food detail page** is the most defensible gap to close — `shopping-higher-rated-product-available` and `shopping-less-processed-option` are both *food-level* observations whose natural home is the food's own page, and both are currently among the hardest types for a household to ever encounter (§3.1).

### 4.7 🟢 **LOW — two pantry readers disagree on `defaultHave`**

`identifyPantryUnusedOpportunities` (`:353-361`) filters on `isDeleted` but does **not** check `defaultHave`, while `pantryCanonicalFoods` (`:620`) — used by the shopping-duplicate and cookbook-cookable generators — does. Two readers of the same table in the same file apply different notions of "in the pantry". Not currently known to produce a wrong card, but it is an inconsistency that will eventually cause one.

### 4.8 🟢 **LOW — one theoretical uncited-evidence path**

`opportunity-engine.ts:513` pushes `{ source: "nutrition-enhancement", detail: suggestion.why }`, copying `UpliftSuggestion.why` verbatim without checking it is non-empty. The array is non-empty so Rule E1 would not drop it, but a rule with a blank `why` would ship a card with a present-but-empty citation. I did not audit every entry in `server/lib/uplift-rules.ts` to determine whether such a rule exists — **unverified, flagged as a latent risk only.**

---

## 5. Test coverage assessment

### 5.1 Strong

All 11 opportunity types have at least one assertion in a **runnable, aggregate-wired** suite:

- 8 types in `test-intelligence-food-opportunity-binding.ts` (`:104-430`)
- The 3 SHOP1 types in `test-shop1-intelligent-shopping.ts` (`:123, :159, :201`)
- Delivery mechanics — `selectSurface`, `filterMutedTypes`, `partitionForDelivery`, `prioritiseAndGroup` (`test-intelligence-opportunity-delivery-binding.ts:13, 28, 94-98`)
- Rule E1 and domain categorisation (`test-intelligence-notice-engine.ts`, `test-intelligence-food-opportunity-binding.ts:447-454`)
- Three of the four registries fully asserted (§4.3)

### 5.2 Weak or absent

| Gap | Evidence |
|---|---|
| **Client layer — no tests at all** | No runner, no config, no test files under `client/` (§4.3) |
| **`DOMAIN_LABEL` unguarded** | `FoodOpportunityCard.tsx:36` — the only unasserted registry |
| **CBK2 / PANTRY1 suites are dead** | No `package.json` scripts; both fail at module load on **value** imports — `generateRecipeExplanation` (`test-cbk2:28`), `generatePantryExplanation` / `EMPTY_PANTRY_HOUSEHOLD_FACTS` (`test-pantry1:44-45`). `server/lib/explainability-service.ts` exports only 5 symbols, none of them these. ~1,274 lines of committed assertions never run. |
| **Nutrition types — zero runnable coverage** | Referenced only in `test-plan2-planner-evolution.ts:298-355`, which has no script entry |
| **SHOP1 types single-suite dependent** | No redundancy in the binding suite |
| **Four further unwired suites** | `test-plan2-planner-evolution.ts`, `test-comp-act1-companion-actions.ts`, `test-household-nutrition.ts`, `test-intelligence-capability-composition.ts` |

Three `test:*` scripts are defined but absent from the aggregate: `test:companion-benchmark`, `test:companion-benchmark:validate`, `test:food-report`.

---

## 6. Scoring rationale

**Coverage — 7.0.** All 11 generators wired, all 4 live domains registered at all 4 registries, 8 ambient mounts spanning every primary journey. Deductions: an entire domain dead (§4.1), three consumer pages with no surface (§4.6), four types practically unreachable (§3.1).

**Consistency — 7.5.** The strongest axis. One pipeline, one producer, one owner per type, shared mechanics, verbatim projection, no re-authored recommendations. Deductions: the double-clamp sequencing flaw (§4.2), two pantry readers disagreeing (§4.7), two live duplicate-observation pairs (§4.5), and two Home channels with asymmetric affordances (§4.4).

**User value — 6.0.** What reaches the household is genuinely good: specific, cited, household-owned, and refusing to overclaim. But value *realised* is materially below value *built* — §4.2 discards two-thirds of generated observations before delivery, §4.4 strips the "why" from the Companion's voice, and §4.1 means a whole nutrition limb delivers nothing at all.

**Production readiness — 6.0.** The server pipeline is well covered and behaves correctly under live verification. Against that: no client tests whatsoever on the layer the household actually sees, the one unguarded registry sitting at the final step, two dead suites, and 258 pre-existing repo-wide `tsc` errors that mask new type regressions.

---

## 7. Recommended follow-on work — highest value only

Ordered by value per unit of effort. **These are recommendations; nothing was implemented.**

### R1 — Decide the fate of the `nutrition` limb (resolves §4.1)
One decision retires the audit's largest orphaned-type, dead-code and phantom-UI findings at once. Two honest options:
- **Retire it** — delete `buildOpportunities`, `NUTRITION_OPPORTUNITY_TYPES`, the unused assembler path and `HouseholdNutritionPanel`. Cheapest, and defensible: none of it has ever run.
- **Enrol it** — register `nutrition` in all four registries and mount the panel. **Do not do this without first reconciling §4.5**: `nutrition-planning-gap` and `planner-empty-day` are near-duplicates, as are `nutrition-plant-diversity-gap` and `planner-meal-uplift`. Enrolling as-is would ship visible duplicate advice on day one.

*Recommendation: retire it.* Two of its three types duplicate live observations, and the third has never been validated against a household.

### R2 — Pass the full candidate set to the delivery layer (resolves §4.2)
Have the producer hand OD1 an unclamped (or `DELIVERY_MAX_LIMIT`-bounded) list so LEARN1's re-ranking sees every candidate, and let the single clamp happen once, at the delivery boundary that owns it. Highest user-value fix in the audit: it restores two-thirds of generated observations to eligibility and makes household learning actually able to promote them. Guard with a test asserting a low-priority opportunity can be promoted above a medium-priority one by Confirmed Understanding.

### R3 — Establish minimal client test coverage, starting with `DOMAIN_LABEL` (resolves §4.3)
The cheapest high-value version is not a full client test rig: add a **server-side** assertion that every member of `FoodOpportunityDomain` (`opportunity-engine.ts:201`) has a row in all four registries, reading `DOMAIN_LABEL` from source. That closes the one unguarded registry without introducing a runner. A client runner remains worth having, but should not block this.

### R4 — Build the explainer surface, then wire CBK2 and PANTRY1 (resolves §5.2)
The missing symbols are precisely enumerated in §5.2. Building them converts ~1,274 lines of committed, currently-dead assertions into live coverage — the best coverage-per-effort ratio available.

### R5 — Voice the "why", and decide the notice-cap diversity question (resolves §4.4)
The producer's `explanation` already travels to the client on the notice object and is discarded at render. Surfacing it is a small change with a direct honesty benefit: the Companion currently tells households *what* to do while withholding the evidence it already computed. Separately, make the cap's domain-diversity behaviour an explicit decision rather than an emergent one.

**Deliberately not recommended:** adding ambient surfaces to Diary and Analyser (§4.6). No current generator produces observations naturally belonging there; mounting a surface before there is intelligence to put in it would invert the very failure this audit flags in §4.1. The Food detail page is the one gap worth revisiting — but only after R2, since the two food-level types it would host are today among the least likely to fire.

---

## 8. Production readiness assessment

**Verdict: READY for the four live domains (`planner`, `pantry`, `shopping`, `cookbook`), with reservations.**

**What supports shipping:**
- One pipeline, one producer, one owner per type — verified, not assumed.
- No uncited recommendation can reach a household; enforced at both producer and boundary.
- Deterministic, rule-based generation with no model in the advice path — nothing can hallucinate a recommendation.
- Honest degradation everywhere; absence renders as silence, never as a fabricated all-clear.
- All 11 types covered by runnable, aggregate-wired suites; verified end-to-end against a live household in `AFI3_5`.

**Reservations to carry knowingly:**

| # | Reservation | Severity |
|---|---|---|
| 1 | The client layer that households actually see has **no automated tests**, and the final registry before render is unguarded. | High |
| 2 | Roughly two-thirds of generated observations are discarded before the delivery layer's ranking sees them (§4.2). Not incorrect output — **suppressed** output. | High |
| 3 | A dead `nutrition` limb ships in the bundle: unreferenced code, phantom UI, three orphaned types (§4.1). | Medium |
| 4 | Two generator pairs can produce overlapping advice in one view (§4.5). Untested against a real household. | Medium |
| 5 | The Companion states actions without the reasons it already computed (§4.4). | Medium |
| 6 | 258 pre-existing repo-wide `tsc` errors mask new type regressions. | Medium |

**None of these can produce a false or unsafe claim to a household.** Every one is a suppression, a redundancy, or a coverage gap — not a correctness fault in what is said. That distinction is why this ships. The safety-critical path (`shopping-restriction-conflict`, the sole `critical` emitter, allowlist-enforced at `framework.ts:257`) is the best-tested path in the platform.

**Recommended gate before wider rollout:** R2 and R3. R2 because the platform currently under-delivers its own built value by a wide margin; R3 because the one registry standing between a correct server-side observation and a correctly-labelled card is the only one nothing tests.

---

## 9. Audit provenance

- Rollback: `rollback/AFI_VERIFY1-ambient-food-intelligence-conformance-audit-20260718` → `7bfad50c` (annotated; resolve with `^{commit}`)
- Predecessor sessions: AFI1, AFI2, AFI3–AFI5 (`docs/implementation/AFI3_5_AMBIENT_FOOD_INTELLIGENCE_COMPLETION.md`)
- Governing architecture: `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md`
- Session record: `.engineering/session/runs/AFI_VERIFY1_Ambient_Food_Intelligence_Conformance_Audit.md`
- Method: static read with `file:line` citation for every claim; runtime evidence in §4.2 and §4.4 carried from the `AFI3_5` live verification. Items I could not verify are marked as such in §4.8.
