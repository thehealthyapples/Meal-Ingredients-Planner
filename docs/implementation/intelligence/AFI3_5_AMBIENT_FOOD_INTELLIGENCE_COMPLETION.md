# AFI3–AFI5 — Ambient Food Intelligence Completion

**Session:** `AFI3_5_Ambient_Food_Intelligence_Completion`
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Status:** Complete — implemented, typechecked, tested, verified in the running app, screenshotted.

---

## 1. Rollback

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/AFI3_5-ambient-food-intelligence-completion-20260718` |
| Tag type | Annotated |
| Resolves to | commit `7bfad50c` — *ADMIN1 — Admin Console & Engineering Health Audit (investigation)* |
| HEAD at session start and end | `7bfad50c` (unchanged — no commit was made) |

Re-confirmed before any change was made this session:

```
git rev-parse --short 'rollback/AFI3_5-ambient-food-intelligence-completion-20260718^{commit}'  → 7bfad50c
git rev-parse --short HEAD                                                                      → 7bfad50c
```

> **Reading the tag correctly.** Plain `git rev-parse <tag>` returns `a89f4947` — the *tag object* SHA,
> not the commit. This is not a mismatch. Always resolve with `^{commit}`.

**Working-tree discipline.** The tree was already dirty at session start with a sibling session's work plus
AFI1/AFI2. It was **not stashed and not committed** — stashing would have destroyed work this session does
not own. The tag protects committed state only; all AFI3–AFI5 deliverables are additive files and additive
hunks that can be reverted individually.

---

## 2. What was built

All six generators extend the **one existing** Observation → Insight → Recommendation pipeline
(FI4 opportunity engine → OD1 delivery → DEC1 decision → PHASE5C ambient surface). No new engine,
pipeline, capability, notice channel or nutrition knowledge was introduced.

Per the confirmed decisions, these implement the **already-committed SHOP1 / CBK2 / PANTRY1 specifications**
rather than a parallel design. Those three docs and their three test suites already specified six generators
that did not exist in the engine and overlapped AFI3–AFI5 almost exactly; building alongside them would have
been the duplication the brief forbids.

| WS | Generator | Type | Domain / priority |
|---|---|---|---|
| AFI3 | `identifyShoppingPantryDuplicateOpportunities` | `shopping-item-already-in-pantry` | shopping / medium |
| AFI3 | `identifyShoppingHigherRatedProductOpportunities` | `shopping-higher-rated-product-available` | shopping / medium |
| AFI3 | `identifyShoppingLessProcessedOpportunities` | `shopping-less-processed-option` | shopping / low |
| AFI3 | `identifyPantryNeedOpportunities` | `pantry-need-not-on-shopping-list` | pantry / medium |
| AFI4 | `identifyCookbookCookableNowOpportunities` | `cookbook-recipe-cookable-now` | cookbook / low |
| AFI4 | `identifyCookbookHouseholdConflictOpportunities` | `cookbook-recipe-household-conflict` | cookbook / medium |

**AFI5 (Companion)** is the `cookbook` **domain registration** — the step that actually carries the new
observations to the household. An unregistered domain is dropped twice over: once at `DOMAIN_TO_CATEGORY`
(the Companion never voices it) and once at `DOMAIN_LABEL` (the card renders as a generic "Food"). Four
registrations plus the `meals-page` mount close it. `OPPORTUNITY_SOURCES` needed zero lines —
`food-intelligence` is already enrolled as a producer.

### Design properties worth keeping

- **Reads are joined, not added.** The pantry read is hoisted once and serves three domains
  (pantry, shopping, cookbook). The shopping duplicate card joins two reads already performed.
- **A knowledge gap is never an owned ingredient.** `cookbook-recipe-cookable-now` refuses to fire if any
  ingredient fails to resolve canonically — it will not count "nearly cookable" as cookable (CBK2 §4.5/§4.6).
- **The conflict card never edits the household's recipe.** It names the recipe *and* the offending
  ingredient and offers both honest choices — adapt it, or keep it as it is.
- **`medium`, never `critical`.** `shopping-restriction-conflict` remains the platform's sole `critical`
  emitter (ATTN1 invariant A2). A recipe sitting in a cookbook is not a thing about to be bought.

---

## 3. Files changed

Diff measured against the rollback commit `7bfad50c`.

| File | Δ | Role |
|---|---:|---|
| `server/intelligence/food-intelligence/opportunity-engine.ts` | +789 / −13 | The six generators + orchestrator wiring |
| `server/tests/test-intelligence-food-opportunity-binding.ts` | +289 | Coverage for all six + the AFI5 registration |
| `server/intelligence/conversation/notice-engine.ts` | +17 / −0 | `NoticeCategory` += `cookbook-opportunity`; `DOMAIN_TO_CATEGORY.cookbook` |
| `client/src/components/intelligence/AmbientIntelligence.tsx` | +16 / −0 | Cookbook surface support |
| `client/src/pages/meals-page.tsx` | +13 | Mounts the Cookbook ambient surface (`data-testid="ambient-cookbook"`) |
| `server/intelligence/opportunity-delivery/framework.ts` | +4 | `DOMAIN_SURFACE.cookbook = "meals"` |
| `client/src/components/intelligence/FoodOpportunityCard.tsx` | +3 | `DOMAIN_LABEL.cookbook = "Cookbook"` |
| `scripts/afi35-capture-ambient-screenshots.ts` | new | Screenshot capture harness (untracked) |
| `docs/implementation/assets/afi35/*` | new | 7 PNGs + `manifest.json` |

No other workstream's implementation document was modified (see §6).

### Defects found and fixed while resuming

Two type errors sat in this session's own additions to the already-enrolled binding suite. Both would have
failed the aggregate:

1. `tier: "major"` → **`"additional_restriction"`**. `RestrictionTier`
   (`shared/restrictions/restriction-types.ts:23`) is `'major_allergen' | 'additional_restriction'`;
   `"major"` was never a member. Vegetarian is a dietary restriction, not an allergen.
2. The fake `FoodIntelligenceReadPort` omitted **`assembleFoodComparison`**, which COMP1 added as a third
   required method. Added a throwing stub matching the file's existing idiom.

---

## 4. Verification results

### 4.1 Typecheck

Every production file AFI3–AFI5 touches is **error-free**:
`opportunity-engine.ts`, `notice-engine.ts`, `framework.ts`, `FoodOpportunityCard.tsx`,
`AmbientIntelligence.tsx`, `meals-page.tsx`.

The repository still reports **258 pre-existing `tsc` errors**, all in files this session did not touch
(`test-plan2-planner-evolution.ts`, `test-slot-filling-recovery.ts`, `test-tier4-shell-recovery-activation.ts`,
`publication-register.ts` / `publication-checks.ts` `--downlevelIteration`, and the CBK2/PANTRY1 suites in §5).
They are recorded as pre-existing debt, not introduced here.

### 4.2 Test suites — all green

| Suite | Result |
|---|---|
| `test:intelligence-food-opportunity-binding` — all six generators + AFI5 registration | **99 passed, 0 failed** |
| `test:shop1-intelligent-shopping` | **34 passed, 0 failed** |
| `test:intelligence-notice-engine` | **65 passed, 0 failed** |
| `test:intelligence-opportunity-delivery-binding` | **60 passed, 0 failed** |
| `test:intelligence-companion-card` | **36 passed, 0 failed** |

Three assertions carry AFI5 specifically:
*"a cookbook opportunity reaches the Companion as a `cookbook-opportunity` notice"*,
*"an UNCITED cookbook opportunity is still DROPPED at the notice boundary (Rule E1)"*, and
*"the cookbook domain routes to the EXISTING meals surface"*.

### 4.3 `npm test` aggregate

`test:shop1-intelligent-shopping` and `test:intelligence-food-opportunity-binding` were **already enrolled**
in the aggregate. No wiring change was required and none was made. Remaining unwired suites are reported as
engineering debt in §5.

### 4.4 Verified in the running app

Driven against the live dev server (`localhost:5000`) with a real seeded demo household (user `905`,
household `546`) through the product's own HTTP surface — not by calling internals.

**AFI3 — confirmed end-to-end.** The producer emits five `shopping-item-already-in-pantry` observations;
all five survive OD1/DEC1 delivery and group onto the `shopping` surface:

```
GET /api/intelligence/food-opportunities  → resolved=true, n=10
  grouped: { planner: 5, shopping: 5 }
  "Free Range Eggs (12)" is on your shopping list, and Eggs is already in your pantry.
```

**AFI4 + AFI5 — confirmed end-to-end.** After recording a fish allergy on a household eater row (via the
product's own `PATCH /api/household/eaters/:id`), the cookbook generator fired and its observation travelled
the full path — engine → delivery → `cookbook` surface → rendered card under its own **"COOKBOOK"** label:

```
"Baked Salmon with Tenderstem Broccoli" in your cookbook contains Salmon fillets,
which conflicts with a stored household restriction (Fish).
```

The Companion also voiced the household's shopping observation on Home, confirming the notice path is live.

> **An earlier capture run was wrong, and this is how.** The first run recorded
> `live_observations: {}` and produced screenshots of empty surfaces. That read as an honest "this household
> has no such observation" but was in fact a **race**: `/api/demo/start` returns as soon as the user row
> exists, while pantry/shopping/cookbook seeding lands after. The harness now polls until the household is
> genuinely seeded before shooting. Two further evidence defects in the same harness were fixed: it recorded
> `toggled: true` whenever a toggle was merely *configured* (never checking the click landed), and it used
> the wrong Cookbook testids (`ambient-intelligence-cookbook` — the mount uses `ambient-cookbook`). It now
> asserts `aria-expanded` and records what actually happened.

---

## 5. Engineering debt

### 5.1 CBK2 and PANTRY1 suites remain unwired — confirmed, not assumed

Both fail at **module load**, before a single assertion runs:

```
test-cbk2-intelligent-cookbook.ts  → SyntaxError: ... no export named 'generateRecipeExplanation'
test-pantry1-intelligent-pantry.ts → SyntaxError: ... no export named 'EMPTY_PANTRY_HOUSEHOLD_FACTS'
```

They specify an **explainer** surface — `generateRecipeExplanation`, `generatePantryExplanation`,
`PantryHouseholdFacts`, `PantryExplanation`, `RecipeExplanation`, `PlannerOpportunitySignal`,
`LearnedPreference` — that does not exist and is outside this brief. They have no `package.json` script
entries and **cannot** be wired until that surface is built.

The six **opportunity** generators those same documents specify *are* built and *are* covered, in the
already-enrolled binding suite. What is missing is the explainer layer, not the observations.

### 5.2 Coverage not reachable from the demo household

Four of the six types did not fire for the seeded demo household, so they have test coverage but no
screenshot: `shopping-higher-rated-product-available` (needs persisted Analyser product matches),
`shopping-less-processed-option` (needs a WS9-curated food on the list), `pantry-need-not-on-shopping-list`
(needs a recorded pantry need), and `cookbook-recipe-cookable-now` (needs a pantry covering *every*
canonically-resolvable ingredient of one recipe — deliberately hard to satisfy, by design).

### 5.3 The Companion's notice cap hides the cookbook notice

The Companion surfaces at most two notices. With a `critical` shopping conflict present, the
`cookbook-opportunity` notice ranks below the cap and is not displayed. Its registration is proven by test,
and the card is fully visible on the Cookbook surface — but the Companion voicing of a cookbook observation
has no screenshot.

---

## 6. Documentation integrity gaps (reported, not modified)

Per the confirmed decisions, other workstreams' implementation documents were **not** edited.

1. **`docs/implementation/pantry/PANTRY1_INTELLIGENT_PANTRY_EVOLUTION.md` §"Suggestions", item 4 — now stale.**
   It states the `pantry-opportunity` notice is *"a known dead end — the client fetches
   `/companion/observations` while the server serves `/companion/notices` … the Companion still cannot show
   it."* This has since been fixed: `client/src/hooks/use-companion-notices.ts:73` fetches
   `/api/intelligence/companion/notices`, matching `server/routes.ts:11760`. The hook's own comment (line 4)
   documents the historical bug. Verified live — the Companion card on Home renders notices
   (`home-companion-notices.png`). **Recommendation:** PANTRY1's owner should retire that item.

2. **SHOP1 / CBK2 / PANTRY1 "Implemented:" sections describe an explainer layer that does not exist.**
   Each doc's closing summary reads as delivered scope, but the `generateRecipeExplanation` /
   `generatePantryExplanation` surface (§5.1) is absent from `server/lib/explainability-service.ts`.
   The opportunity half is real; the explainer half is specification. **Recommendation:** those owners should
   split each summary into *implemented* and *specified-not-built*, so the suites' unrunnable state is
   visible from the documents rather than only from `tsx`.

3. **No canonical index entry for AFI3–AFI5 before this document.** `docs/implementation/` had AFI1 and AFI2
   completion records but no AFI3–AFI5 counterpart. This document closes that gap.

---

## 7. Screenshots

Captured at 430×932 (mobile) against the live dev server. Harness:
`scripts/afi35-capture-ambient-screenshots.ts`. Assets: `docs/implementation/assets/afi35/`
(`manifest.json` records the verbatim live observation text behind every shot). **7/7 captured.**

| File | Shows |
|---|---|
| `cookbook-ambient.png` | **AFI4 + AFI5.** The Cookbook's own ambient surface on `/meals` — *"From your cookbook · 1"* — expanded, with the conflict card under its own **COOKBOOK** label. This surface did not exist before AFI5. |
| `cookbook-household-conflict-card.png` | **AFI4**, focused. Names the recipe *and* the ingredient, cites the stored restriction, and offers *"Adapt … or keep it as it is."* — the refusal design, rendered. |
| `shopping-ambient.png` | **AFI3.** *"Worth a look before you shop · 5"* — the `critical` restriction card first, then two `shopping-item-already-in-pantry` cards. |
| `shopping-already-in-pantry-card.png` | **AFI3**, focused, with its Helpful / Not now / Why this? affordances. |
| `home-companion-notices.png` | **AFI5.** The Companion card on Home voicing the household's own observations. |
| `home-ambient-aggregate.png` | All domains in one calm aggregate surface. |
| `pantry-ambient.png` | The Pantry surface. Honest absence — no pantry-domain observation survived delivery for this household. |

---

## 8. Follow-on recommendations

1. **Build the explainer surface the three specs assume** (`generateRecipeExplanation`,
   `generatePantryExplanation`, `EMPTY_PANTRY_HOUSEHOLD_FACTS`, `PantryHouseholdFacts`,
   `PlannerOpportunitySignal`, `LearnedPreference`), then wire `test:cbk2-intelligent-cookbook` and
   `test:pantry1-intelligent-pantry` into the aggregate. This is the single highest-value follow-on: it
   converts two committed, unrunnable suites into live coverage. *(§5.1)*
2. **Give the capture harness a deterministic fixture household** that triggers all six types, rather than
   relying on the demo seed. Four types currently have no visual evidence. *(§5.2)*
3. **Retire PANTRY1's stale "dead end" note** and re-audit the other two docs' "Implemented:" sections. *(§6)*
4. **Consider whether the Companion's 2-notice cap should guarantee domain diversity.** A household with a
   `critical` shopping conflict currently never hears a cookbook observation. This is defensible (harm
   first) but worth an explicit decision rather than an emergent one. *(§5.3)*
5. **Watch conflict-card volume on first delivery.** CBK2 §10 already flags that a household with a large
   cookbook and a newly recorded restriction could see many conflict cards at once. The Decision Engine's
   attention budget bounds it and the cards are `medium` (fully mutable, per-recipe dismissible), but the
   first delivery after a household change remains the untested case.
6. **Pay down the 258 pre-existing `tsc` errors** — chiefly `--downlevelIteration` in
   `server/verification/*` and the drifted `PlannerExplanationContext` fixtures. They currently mask new
   type regressions, which is precisely how the two defects in §3 survived into this session.

---

## 9. Provenance

- Governing architecture: `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`,
  `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- Specifications implemented: `docs/implementation/shopping/SHOP1_INTELLIGENT_SHOPPING_EVOLUTION.md`,
  `docs/implementation/cookbook/CBK2_INTELLIGENT_COOKBOOK_EVOLUTION.md`,
  `docs/implementation/pantry/PANTRY1_INTELLIGENT_PANTRY_EVOLUTION.md`
- Predecessors: AFI1 (`planner-food-uplift`), AFI2 (`planner-batch-cook`)
- Session record: `.engineering/session/runs/AFI3_5_Ambient_Food_Intelligence_Completion.md`
