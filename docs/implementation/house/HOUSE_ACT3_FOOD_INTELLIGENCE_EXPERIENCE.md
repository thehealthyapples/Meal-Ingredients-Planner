# HOUSE_ACT3 — Food Intelligence Experience

**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Risk:** 💡 Premium Reasoning
**Reason:** Activate remaining production-ready Food Intelligence on food and meal experiences, without new capabilities or duplicated logic.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | `rollback/HOUSE_ACT3-food-intelligence-experience-20260718` |
| **Commit** | `b6cc6aaa` — HOUSE_ACT2 completion |
| **Baseline build** | 🟢 verified passing before any change |

**Rollback command:**
```
git reset --hard rollback/HOUSE_ACT3-food-intelligence-experience-20260718
```

The tree at tagging held uncommitted work from a concurrent **PROD3** session across `server/intelligence/**`, `package.json` and ~15 client files. **None of it was captured, and no server file was touched by this programme** — see Scope Decision below.

---

## SCOPE DECISION — TAKEN TO THE OWNER BEFORE IMPLEMENTATION

Two findings made the mission's stated scope unsafe to execute as written. Both were put to the owner, who directed the course taken.

### Finding 1 — a live session was editing this programme's exact dependencies

`git status` showed **PROD3** actively modifying `conversation-gateway.ts`, `food-intelligence/engine.ts` and `meal-discovery-engine.ts`. Priority 1 (Nutrition Enhancement) lives in the first; priority 2 (Meal Discovery) in the third.

Worse, PROD3 was mid-flight on the **exact type** priority 1 consumes. `composeHouseholdNutritionEnrichment(food, household)` takes a `HouseholdSignal`, and PROD3 was adding `resolutionFailed` to it (`engine.ts:150`) with fail-closed semantics:

> *"`resolved: false` conflated two situations that must not share a verdict … there IS a household and the read FAILED — in which case an empty `restrictionDefs` is not 'no restrictions', it is 'we do not know', and Rule T0 admitting everything is a silent safety failure."*

Building a Nutrition Enhancement door on that type mid-change risked merge conflict **and** undermining a live safety fix. PROD3 has since completed: it found `test-intelligence-native-discovery.ts:248` **passing inside `npm test` while asserting a gluten-bearing meal be delivered to a gluten-free household**, and gated meal discovery accordingly. Deferring was correct.

**Owner direction: defer all server work; audit and client-only doors.**

### Finding 2 — the food page already meets every stated success criterion

All six criteria were traced to live, data-conditional mounts on `food-detail-page.tsx` **before** any work began:

| Success criterion | Already delivered by | Reachable? |
|---|---|---|
| why a food is good | `IntelligenceCard` *"Why it matters"* (`:224`) | ⚠️ **~10 of 381 foods** — see below |
| how to make it healthier | `SimplyBetterChoiceCard` (`:399`) | ✅ name-token match |
| better alternatives | same card | ✅ |
| household suitability | `HouseholdInsightCard` (`:345`) | ✅ live |
| related foods | `ConnectedFoodPanel` (`:353`) | ✅ near-always |
| meal opportunities | `IntelligenceCard` *"In the cookbook"* (`:321`) | ✅ live |

**Owner direction: verify the claim, then find the real gaps.** That verification produced the two findings below — one a defect on food pages, one the actual gap on meal pages.

---

## AUDIT — WHAT VERIFICATION FOUND

### 🔴 "Why it matters" is half-dead against live data

`hasWhy = healthBenefits.length > 0 || nutritionContext.length > 0` (`:161`). The **first input is dead for every food in the database.**

`healthBenefits` flows from `getFoodBenefitsForDisplay` → `backedBenefitsViaNutrientBridge`, which filters the composition edge through `isEvidenceBackedClaim` (`shared/knowledge/evidence.ts:92`) — requiring `reviewedAt` **and** ≥1 valid sourceRef. Live database:

| Table | Rows | With `reviewed_at` |
|---|---|---|
| `knowledge_food_nutrients` | 1,988 | **0** |
| `knowledge_food_benefits` | 1,366 active | **0** |
| `knowledge_nutrient_benefits` | 21 | 21 ✅ |

The composition edge fails for **every** food, so `healthBenefits` is always `[]` and the benefit-chip branch (`:230`) is unreachable. The card therefore renders only via `NUTRITION_CONTEXT`, which has exactly **10 keys** — so *"why a food is good"* appears on roughly **10 of 381 food pages**, always prose-only, never with chips.

**This is a knowledge-curation gap, not a UI gap, and it is not fixed here.** No amount of client work surfaces evidence that has not been reviewed. Reported as the highest-value remaining opportunity.

### 🔴 The real gap is meal pages, and it is large

`food-detail-page` renders **14 populated surfaces from 1 query**. `meal-detail-page` renders **8 from 7 queries — plus 3 components that are structurally dead.**

| Intelligence | food-detail | meal-detail |
|---|---|---|
| Health benefits | ✅ | ❌ returned by the assembler, never rendered |
| Household planner history | ✅ | ❌ `plannerAppearanceCount` available, unrendered |
| Seasonality card | ✅ | ❌ per-ingredient text only |
| Alternatives / uplift | ✅ real data | 🔴 **empty shell** — `upliftMatches={[]}` |
| Lateral connected web | ✅ | ❌ |
| Related items | ✅ | ❌ |
| Plant diversity | n/a | ❌ fetched, then discarded |
| Trust / confidence | ❌ | ⚠️ `MealFamilyConfidence` always null |

**The cause: `meal-detail-page.tsx` never calls `GET /api/meals/:id/intelligence`.** The route (`routes.ts:5427`) and its **538-line assembler** (`meal-intelligence-assembler.ts`) have existed throughout, returning eleven sections. Their **only** consumer was `CookbookMealIntelligenceStrip`, on the Cookbook's Intelligence tab — so the assembler's most natural home, the meal's own page, never asked.

Three components sat dead in consequence (`meal-detail-page.tsx:1209-1224`):

| Component | State | Why |
|---|---|---|
| `SimplyBetterChoicesPanel` | 🔴 **renders an empty header on every meal page** | `upliftMatches={[]}` hardcoded, and the component had **no empty guard** |
| `MealFamilyConfidence` | always `null` | all three props hardcoded `undefined` |
| `HouseholdAdaptationsSummary` | always `null` | `adaptations={undefined}` |

---

## COMPLETED FOOD INTELLIGENCE EXPERIENCES

### 🚪 Door 1 — The meal page now asks for its own intelligence

`client/src/pages/meal-detail-page.tsx`

Added `useCookbookMealIntelligence(mealId)` — the **existing** hook, on the **existing** route, against the **existing** assembler. No new route, hook, service, capability or query shape. The hook's 5-minute `staleTime` and shared query key mean a household arriving from the Cookbook strip hits **cache, not a second fetch**.

### 🚪 Door 2 — "Simply Better Choices" now has choices in it

`upliftMatches={[]}` → `mealIntelligence?.nutritionEnhancement?.matches ?? []`.

The assembler has returned `nutritionEnhancement.matches` as `UpliftMatchResult[]` all along (`meal-intelligence-assembler.ts:196`) — the **exact type** the panel's prop declares. The two were built to fit and were never connected.

This delivers two of the mission's success criteria on meal pages — *how to make it healthier* and *better alternatives* — with zero new intelligence.

### 🚪 Door 3 — An empty promise became an honest absence

`client/src/components/meal-detail/SimplyBetterChoicesPanel.tsx`

The panel had **no empty guard**, so with its hardcoded `[]` it rendered a *"Simply Better Choices"* heading containing nothing — **on every meal page in THA**. A heading promising help that was never coming.

```ts
if (suggestionCount === 0) return null;
```

Every sibling already self-guards (`HouseholdInsightCard.tsx:34`, `SeasonalCard.tsx:35`, `SimplyBetterChoiceCard.tsx:32`). This one now matches. **Wiring the data without this guard would have replaced a permanent empty shell with an intermittent one** — the defect would have survived its own fix on every meal with no uplift match.

### 🔧 Supporting — one type, one owner

`client/src/components/CookbookMealIntelligenceStrip.tsx`

The hook's local `MealIntelligence` typed `nutritionEnhancement.matches` as a structural subset (`{ruleName, suggestions}`), missing `ruleId`, `nutritionTags`, `confidence` and `priority`. Retyped to the canonical `UpliftMatchResult` it already carries at runtime, so the real consumer types without a cast. `trust` added to the interface for the same reason — it is on the wire and was undeclared.

---

## DECLINED, WITH EVIDENCE

### `MealFamilyConfidence` — deliberately left dead

The obvious move was to feed it the assembler's `trust`. **It would have been fabrication.**

The component's props are `householdCompatibilityPercent`, `substitutionCount`, `weeklyReuseFourWeeks`. `MealIntelligenceTrust` is `{totalIngredients, resolvedIngredients, confidenceLevel}`, and its own header states:

> *"Based solely on validated ingredient resolution. **Never estimated.**"*

Passing `resolvedIngredients / totalIngredients` as `householdCompatibilityPercent` would relabel *"we recognised 8 of 10 ingredients"* as *"this meal suits 80% of your household"* — two unrelated facts, one of them about people's diets. Core Principle 6 forbids it, and its `calculateConfidence` is itself a stub (*"Real algorithm will be implemented in Phase 2"*).

**A component that renders nothing is a smaller defect than one that renders a confident wrong number.** Left dead; recorded as an opportunity needing either real data or retirement.

### Priorities 1, 2 and 4 — not implemented

| Priority | Why not |
|---|---|
| **1 — Nutrition Enhancement** | Owner-directed deferral: its `HouseholdSignal` dependency was being changed by PROD3 mid-session, with safety semantics. Still the strongest remaining server-side door |
| **2 — Meal Discovery** | Same file (`meal-discovery-engine.ts`); PROD3 has now gated it on household safety, which **changes what a UI door must respect** — it must not surface meals the safety gate withheld |
| **3 — Product Knowledge** | Unchanged from HOUSE_ACT2: its natural room is Support/Help, which does not exist, and it has no HTTP route |
| **4 — Food Comparison entry points** | Still a product decision on placement. `/compare` works and is linked from `food-detail-page.tsx:210`; adding entries elsewhere without a chosen room adds visual noise |

---

## ARCHITECTURE COMPLIANCE CHECKLIST

- ☑ **One canonical identity** — no entity touched. A meal remains keyed by `meals.id`.
- ☑ **One owner per fact** — no fact acquired an owner. `meal-intelligence-assembler.ts` remains the sole assembler of meal intelligence; the page now *reads* it instead of passing `[]`.
- ☑ **No duplicate entities** — none created.
- ☑ **No duplicate ownership** — the uplift rules stay in `uplift-engine.ts`; nothing was re-derived client-side.
- ☑ **No duplicate state** — one shared query key, shared with the Cookbook strip.
- ☑ **Extends existing architecture** — reuses the existing route, hook, component and type. The `UpliftMatchResult` retype **removes** a rival structural shape rather than adding one.
- ☑ **Progressive enrichment** — N/A.
- ☑ **Knowledge domain compliance** — N/A; no knowledge domain introduced. The `reviewed_at` finding is **reported**, not filled in.
- ☑ **Honest gaps over fabricated information** — **the central act of this programme.** Door 3 converts a permanent empty promise into silence, and `MealFamilyConfidence` is left dead rather than fed a number that would mean something it does not.
- ☑ **No permanent synchronisation bridge** — none.
- ☑ **Evolution over replacement** — nothing replaced.

## AI ARCHITECTURE COMPLIANCE

- ✓ **Uses the canonical Intelligence Platform** — via the existing `/api/meals/:id/intelligence` route and its assembler. No bypass.
- ✓ **Uses the Capability Registry** — unchanged; **no descriptor edited**.
- ✓ **Uses the Intent Engine** — untouched.
- ✓ **Reuses existing business services** — `uplift-engine.ts` and the meal assembler, both unmodified.
- ✓ **Does not create another assistant** — none. No conversational surface added.
- ✓ **Does not duplicate conversation state** — no conversation state touched. **Gateway composition explicitly not duplicated** — the deferral of priority 1 is precisely that instruction being honoured.
- ✓ **Uses registered capabilities only** — no capability invoked directly.
- ✓ **Uses permission-aware access** — unchanged; the route is auth-gated and household-scoped server-side.
- ✓ **Produces honest gaps rather than fabricated knowledge** — Doors 3 and the `MealFamilyConfidence` refusal are both instances of this rule.

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

- ✓ **UX Governance Checklist** (EXP §18 + Premium §17) — *calm before capability*: Door 3 **removes** a card from every meal page that had nothing to say. **Premium as "the perceptible result of care"**: an empty "Simply Better Choices" heading is the precise opposite — its absence is felt as care.
- ✓ **UI Governance Checklist** (UIA §18) — no colour, token, spacing, type role or motion value introduced.
- ✓ **Experience Review Questions** (EXPLANG §6) — serves **reassuring** and **intelligent**. Anti-pattern removed: a heading that promises and does not deliver.
- ✓ **Experience Test** (EXPBLUE §15.3) — *Meal detail: this is where the household decides whether to cook this; they should feel confident and unhurried; the one thing it helps them do is understand the meal.* Uplift suggestions are exactly that understanding; an empty card was noise against it.
- ✓ **Blueprint Checks** (EXPBLUE §15.2) — no room's place character, orchard, light, material, shell constancy or Living Detail changed.
- ✓ Conflicts resolved in the Experience Architecture's favour — one arose (wire `MealFamilyConfidence` for completeness vs Core Principle 6); resolved for the principle.
- ✓ Nothing owns a fact at the presentation layer — every value rendered comes from the assembler verbatim.
- ✓ Any new visual pattern retired its predecessor — **no new visual pattern introduced.**

## PRODUCT REGISTRY COMPLIANCE / IMPACT

- **Registry affected:** NO.
- Entries **created**: NONE · **updated**: NONE · **retired**: NONE.
- No page, route, journey, capability, dialog, integration or setting added, removed or renamed. Door 1 calls an **existing** route from an **existing** page; Door 3 removes an empty card from a page that already existed.
- Product knowledge written into a prompt, template or fallback string: **NO** (Rule PKR27).

## ADOPTION REGISTER IMPACT

- **Register affected:** NO.
- Owners **created / adopted / retired**: NONE. `SimplyBetterChoicesPanel` has exactly one consumer before and after; no concern changed owner.
- **Rival ceilings raised: NONE.**
- Exemptions **added**: NONE.
- `npm run adoption:check` passes: **YES** — **82 passed · 0 notices · 0 failed** (unchanged from HOUSE_ACT2).

---

## DEFINITION OF DONE

**Success looks like:** a meal page explains how to make the meal better using intelligence THA already computed, and says nothing at all when it has nothing to suggest.

**What must not break:** the Cookbook Intelligence strip (the hook's original consumer), the meal page's seven existing queries, `MealTrustSummary`, and `AmbientIntelligence` on meal detail.

---

## VALIDATION PERFORMED

| Command | Outcome |
|---|---|
| `npx vite build` (baseline, before changes) | 🟢 PASSED |
| `npx vite build` (after Doors 1–3) | 🟢 **PASSED** |
| `npx tsc --noEmit` — `client/` only | 🟢 **0 errors** |
| `npx tsc --noEmit` — total | **94** — identical to baseline; **0 introduced** |
| `npm run adoption:check` | 🟢 **82 passed · 0 notices · 0 failed** |
| `grep` consumers of `SimplyBetterChoicesPanel` | 1 (`meal-detail-page.tsx`) — the new guard's blast radius is one page |
| `grep` consumers of `useCookbookMealIntelligence` | 2 — the Cookbook strip (unchanged) and meal detail (new) |

**Server files touched: zero.** Verified by `git diff --name-only` — every change is under `client/`.

**Not run:** the full test suite, and **no browser verification.** Doors 1–2 are proven wired and type-correct, not proven to render suggestions for a real meal — that needs a meal whose ingredients match an uplift rule.

---

## MANUAL VERIFICATION STEPS

**1 — Uplift suggestions appear (Doors 1–2)**
- *Starting page:* `/meals/:id` for a meal containing an uplift trigger ingredient (e.g. one with **pasta**, **rice**, **potato** or **chicken**)
- *Action:* scroll to the intelligence block below the recipe; expand *"Simply Better Choices"*
- *Expected:* a count beside the heading and ≥1 suggestion (*"Swap in…"* / *"boost with…"*)
- *Success criteria:* the suggestions match what the Cookbook Intelligence tab shows for the same meal — same route, same data
- *Regression checks:* `MealTrustSummary` still renders; the ambient *"A small lift for this week"* card is unaffected; the Cookbook Intelligence strip still works

**2 — Honest absence (Door 3)**
- *Starting page:* `/meals/:id` for a meal with **no** uplift match (e.g. a simple salad)
- *Expected:* **no "Simply Better Choices" card at all** — not an empty one
- *Success criteria:* before this change every meal page showed the empty heading; now it appears only when there is something to say

**3 — One fetch, not two**
- *Action:* DevTools → Network, filter `intelligence`; open the Cookbook Intelligence tab for a meal, then navigate into that meal's page
- *Expected:* the second view is a **cache hit** within the 5-minute window

## USER ACCEPTANCE EVIDENCE

**None captured.** The three steps above **have not been executed** — no browser session, no screenshots. The doors are verified by build, typecheck and consumer tracing, which prove they compile and are correctly wired; they do not prove a household sees a suggestion. Step 1 needs a meal with a matching uplift rule, which I did not seed or identify in live data.

---

## DATA IMPACT

- **Reads existing data:** YES — `GET /api/meals/:id/intelligence`, an existing auth-gated route, now called from a second page.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO. `nutritionEnhancement.matches` is rendered by the component whose prop type it already matched.
- **Requires backfill:** NO — **and the `reviewed_at` finding is deliberately *not* actioned as one.** Marking 3,354 unreviewed knowledge rows as reviewed to light up a UI card would fabricate the evidence the gate exists to require.

## TRUST CHECK

- **Could this mislead the user?** No — it **removes** a misleading element. An empty "Simply Better Choices" card implied THA had checked and found nothing, when it had never looked.
- **Could this fabricate certainty?** No — and the sharpest decision in this programme was declining to: `MealFamilyConfidence` was left dead rather than fed ingredient-resolution data relabelled as household compatibility.
- **Is anything guessed but shown as real?** No. Every rendered value comes from the assembler verbatim; the client computes only a count.
- **What happens if the system is wrong?** If the intelligence query fails, `mealIntelligence` is `undefined`, `?? []` yields zero suggestions, and Door 3's guard renders **nothing** — the honest-absence path, identical to a meal with no matches.
- **No architectural duplication introduced:** YES.
- **No new source of truth created:** YES.
- **No runtime behaviour altered:** NO — deliberately altered: meal pages now fetch intelligence and show or hide a card accordingly.
- **Every "verified" claim backed by a command that ran:** YES. Unbacked claims are marked **not run** or **not captured**.

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/HOUSE_ACT3-food-intelligence-experience-20260718` → `b6cc6aaa`
- **Files modified:** `client/src/pages/meal-detail-page.tsx`, `client/src/components/meal-detail/SimplyBetterChoicesPanel.tsx`, `client/src/components/CookbookMealIntelligenceStrip.tsx`, and this report. **No server file.**
- **Rollback command:** `git reset --hard rollback/HOUSE_ACT3-food-intelligence-experience-20260718`
- ⚠️ **Reverting also unwinds PROD3's committed safety work if it lands after this tag.** Prefer reverting this programme's commit specifically (`git revert <sha>`) over resetting to the tag.
- **Verification after rollback:** `npx vite build` 🟢 and `npm run adoption:check` → 82 passed. The empty "Simply Better Choices" card returns to every meal page.

## SCOPE LOCK

**Implemented:** Doors 1–3 and the supporting `UpliftMatchResult` retype. Client only.

**Explicitly excluded — NOT done:**
- Nutrition Enhancement (priority 1) — owner-directed deferral
- Meal Discovery UI (priority 2) — same reason; now additionally constrained by PROD3's safety gate
- Product Knowledge (priority 3) — blocked on Support/Help not existing
- Food Comparison entry points (priority 4) — product decision
- `MealFamilyConfidence` / `HouseholdAdaptationsSummary` — **declined**, no honest data mapping
- The `healthBenefits` knowledge gap — a curation problem, not a UI one
- Any server, schema, route, capability or `package.json` change
- Execution of the manual verification steps

**Suggestions observed outside scope (not implemented):**
- `meal-detail-page` fetches `/api/meals/:id/food-intelligence` and **discards** `highlights[]`, `benefits[]`, `plantCount`, `seasonalIngredients[]`, `origins[]`, `rareItems[]` — six fields on the wire, dropped by the hook at `MealFoodIntelligenceSection.tsx:62-66`
- `routes.ts:5434` never passes `plannerWeekId` to `getMealIntelligence`, so `MealIntelligence.planner` is **permanently null** despite the assembler supporting it (`:470`)
- `ConnectedFoodPanel` fetches `oftenAppearsIn`, `discoverNext` and `simplyBetterChoices` and deliberately drops all three (`:113-116`) — the food page renders equivalents from a different payload, so three sections are fetched on every food page and never used

---

## REMAINING OPPORTUNITIES — PRIORITISED

| # | Opportunity | Value | Cost |
|---|---|---|---|
| **1** | **Review the nutrition knowledge base.** 0 of 1,988 `knowledge_food_nutrients` and 0 of 1,366 `knowledge_food_benefits` rows carry `reviewed_at`, so *"why a food is good"* is dark on ~371 of 381 food pages. **The single highest-value item in the house — and it is curation, not engineering** | 🔴 High | L |
| **2** | **Render the rest of `MealIntelligence` on meal pages.** `healthBenefits`, `seasonality`, `household.plannerAppearanceCount`, `foods[]` (ingredient → `/foods/:slug` links) are all on the wire after Door 1 and still unrendered | 🔴 High | M |
| **3** | **Nutrition Enhancement door** (HOUSE_ACT2 #1, deferred). Now unblocked — PROD3 has landed. Use the pure `composeHouseholdNutritionEnrichment(food, household)` seam; do **not** re-synthesise gateway query results, and respect `resolutionFailed` | 🔴 High | M |
| **4** | **Stop discarding the six `food-intelligence` fields** already fetched by meal detail | 🟠 Med-High | S |
| **5** | **Decide `MealFamilyConfidence` and `HouseholdAdaptationsSummary`** — give them real data or retire them (UI Principle 5) | 🟠 Med | S |
| **6** | **Fix the 94 `server/tests/*.ts` type errors** (carried from HOUSE_ACT1) | 🟠 Med | M |
| **7** | Meal Discovery UI — must respect PROD3's safety gate and never surface a withheld meal | 🟡 Low-Med | M |

### Suggested follow-on programme

**`HOUSE_ACT4 — The Meal Page`** — opportunities 2, 4 and 5 together. Door 1 put the assembler's full payload on the page; four of its eleven sections are now one render away, and two dead components need a verdict. It is the cheapest large gain left in the house.

**`KNOW1 — Nutrition Evidence Review`** — opportunity 1. Not an engineering programme; it needs a named reviewer signing off `reviewed_at` on real sources.

---

## OUTCOME

**Three doors opened, all client-side, no server file touched.**

The meal page now asks for the intelligence THA had been computing for it all along — a 538-line assembler whose only reader was a strip on another page — and *"Simply Better Choices"* stopped being an empty promise on every meal in the product.

The programme's most useful output may again be a refusal: **`MealFamilyConfidence` was left dead rather than fed ingredient-resolution data dressed up as household compatibility.** A component that shows nothing is a smaller defect than one that shows a confident wrong number.

And the largest gap found is not in the UI at all. *"Why a food is good"* is dark on roughly **371 of 381 food pages** because **not one** of 3,354 knowledge rows has ever been marked reviewed. No client work can open that door; a person has to review the evidence.
