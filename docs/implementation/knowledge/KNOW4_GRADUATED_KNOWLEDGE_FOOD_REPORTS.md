# KNOW4 — Expose Graduated Knowledge in Food Reports — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Changes the contract of a shared, client-bundled adapter, rewires three runtime consumers onto the evidence gate, and removes 320 unsourced health claims from surfaces that render them today.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-know4-graduated-knowledge-food-reports-20260709` → `7508b399e8d1d07c3f83f7b65c1b28f6edc7cbd7` |
| Working tree | Clean at start |
| This task's writes | `shared/knowledge/food-relationships.ts` (new), `shared/knowledge/index.ts`, `shared/canonical/food-report-adapter.ts`, `server/lib/food-intelligence-assembler.ts`, `server/lib/meal-intelligence-assembler.ts`, `server/routes.ts`, `client/src/components/FoodReport.tsx`, `server/tests/test-food-report-adapter.ts`, `server/tests/test-know4-graduated-food-reports.ts` (new), `package.json`, this document |
| Rollback to committed state | `git checkout rollback/before-know4-graduated-knowledge-food-reports-20260709` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domains 1 and 2)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (STEP 7 — Trust and Claims Hard Stops)
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (§2 Rule KC4 "one owner, one mouth"; §4 the Evidence Standard; Rules KC5/KC6/KC8/KC9)
- [x] `docs/architecture/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`
- [x] `docs/architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md`
- [x] `docs/implementation/knowledge/KNOW1_FOOD_INTELLIGENCE_EXPANSION.md`, `KNOW2_KNOWLEDGE_FOOD_OWNERSHIP_CONVERGENCE.md`, `KNOW3_CANONICAL_KNOWLEDGE_FOOD_BINDING.md`
- [x] `docs/implementation/knowledge/PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md`

---

## THE DEFECT, AND THE SECOND DEFECT UNDERNEATH IT

KNOW3 §SUGGESTION 1 named the first: `buildFoodReport()` reads the **compact editorial maps**
`FOOD_NUTRIENTS` / `FOOD_BENEFITS`, which describe the 264 human-authored knowledge foods. The
346 graduated foods KNOW2 promoted into the same declared owner are invisible to it. So the
seven canonical foods KNOW3 bound — the first ever bound to *graduated* knowledge — returned
empty arrays from the seed-backed report:

```
buildFoodReport("grapefruit").keyNutrients   before: []   after: [Vitamin C, Fibre, Polyphenols]
buildFoodReport("kombucha").keyNutrients     before: []   after: [Polyphenols, Fibre]
```

Repairing that meant pointing the adapter at the unified seed. Doing so for **benefits** would
have shipped 667 AI-drafted benefit links straight to users — which is when the second defect
surfaced.

**`buildFoodReport().healthBenefits` is an ungated claim channel, and it is live.** PKC2 built
`getEvidenceBackedFoodReport()` to be the single gated mouth for benefit claims, and wrote that
"every consumer that used to call `buildFoodReport()` directly for those two fields now calls
this instead." Measured at HEAD:

- `getEvidenceBackedFoodReport()` has **zero callers**.
- `GET /api/foods/:slug/report`, the route its own header cites, **does not exist**.
- `getFoodIntelligence()`, `getMealIntelligence()` and `/api/pantry/search-index` all read
  `buildFoodReport().healthBenefits` — **660 unsourced claims across 312 canonical foods** —
  and `client/src/components/FoodReport.tsx` imports the adapter into the **browser bundle** and
  renders them there.
- `server/tests/test-food-report-evidence.ts:31` asserts `healthBenefits` is always empty. **It
  fails at HEAD.** KNOW3's validation table recorded that failure as a stale-dev-DB artifact. It
  is not. It is this.

So the naive fix would have taken the ungated surface from 660 claims to 679, fourteen of them
authored by ChatGPT. Rule KC9 says automation authors candidates and never publishes them.

The two defects have one cause and one repair. `reviewedAt` — the human sign-off the Layer-2
gate requires — is a **database column**. A seed-only, DB-free, client-bundled module cannot
read it, and therefore cannot know whether a benefit may be spoken. The adapter was never
entitled to speak one. It now speaks none, reads the unified nutrient links, and the gate
becomes the only mouth for claims — which is the *only* way the seven graduated foods can
surface their benefits at all.

**The gate is not the obstacle to exposing graduated knowledge. It is the mechanism.**

| | ungated seed (HEAD) | evidence-gated (KNOW4) |
|---|---|---|
| benefit claims rendered | 660 | **359** |
| canonical foods rendering ≥1 benefit | 249 | 223 |
| **the seven KNOW3 bindings** | **0** | **13 claims, all seven surface** |

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No identity is touched. canonical_food.slug (Domain 2) and knowledge_foods.slug (Domain 1)
  keep their key spaces; `knowledge_food_slug` remains the only seam between them. No third
  key space is introduced.

☑ One owner per fact
  The food→nutrient and food→benefit links have exactly one owner: shared/knowledge/ (SoT
  Register Domain 1). KNOW2 composed its two halves in `index.ts`; KNOW4 moves that single
  composition to `food-relationships.ts` and has `index.ts` RE-EXPORT it. There is still one
  definition of the unified seed — asserted by test (`SEED_FROM_INDEX === SEED_FROM_OWNER`,
  reference equality, which a rebuilt copy would fail).

☑ No duplicate entities
  No food, nutrient, benefit, variety or link is created. `food-relationships.ts` holds no
  fact: it merges two arrays its owner already declares.

☑ No duplicate ownership
  The opposite: an ownership violation is REMOVED. Benefit claims had four narrators (two
  assemblers, one route, one client component), none gated. They now have one
  (getEvidenceBackedFoodReport) — Rule KC4, "one owner, one mouth", enforced rather than
  declared.

☑ No duplicate state
  No user state is touched. Every read is ephemeral; nothing is persisted or cached.

☑ Extends existing architecture
  Extends PKC2's `getEvidenceBackedFoodReport()` by giving it the callers it was written for.
  Extends KNOW2's composition rather than re-deriving it. No store, route or module is
  replaced. The Layer-2 gate (`isEvidenceBackedClaim`, `getFoodBenefitsForDisplay`) is
  untouched — it is now merely reached.

☑ Progressive enrichment where appropriate
  Knowledge entity. Identity (Level 1) is unchanged for all 312 canonical foods. Nutrients
  (Level 2) become visible for 7 more, taking the adapter from 249 to 256 foods. Benefits
  (Level 3) unlock only on evidence. Rule KC6 — enrichment adds a surface, never gates an
  existing one — is respected for nutrients. For benefits, the change REVOKES 320 renders;
  see the Trust Check, where that is argued as a correction, not an enrichment.

☑ Honest gaps over fabricated information
  A claim with no signed-off citation is absent, never softened, never shown as "emerging".
  33 canonical foods now render no benefit at all because none of their claims is sourced;
  they keep their identity, nutrients and context. 56 canonical foods have no knowledge
  binding and surface no nutrients. The browser component renders no benefits because it is
  structurally incapable of proving one.

☑ No permanent synchronisation bridge
  None. The adapter reads the seed; the gate reads the DB the seed writes. No fact is stored
  twice and no two stores must be kept in agreement.

☑ Evolution over replacement
  Nothing is replaced. `buildFoodReport()` keeps its name, signature, null contract and
  preparation guard; it loses a field it was never entitled to populate.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Food Knowledge (SoT Register Domain 1) — its RENDER surface, not its store.
                 Reads Canonical Food Identity (Domain 2). Writes neither.
Declared SoT: shared/knowledge/ → server/seeds/seed-knowledge-registry.ts → DB knowledge_*
New store created? NO
Existing store extended? NO — no row, column, table or entity is added or altered.
Consumer created? NO — three existing consumers are REPOINTED from an ungated reader to the
  declared gated one. shared/knowledge/food-relationships.ts is a composition module, not a
  consumer and not an owner: it holds no fact and performs no write.
```

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Knowledge → the Food Report render surface (PKCA §2, Rule KC4 "one owner, one mouth")

Current Canonical Owner:
  Facts:            shared/knowledge/ → DB knowledge_* (SoT Register Domain 1)
  Composition:      shared/knowledge/food-relationships.ts (one definition, re-exported by index.ts)
  Benefit claims:   server/lib/food-report-evidence.ts → getEvidenceBackedFoodReport()
                    (the one mouth; wraps the Layer-2 gate getFoodBenefitsForDisplay)
  Identity/nutrients/context:
                    shared/canonical/food-report-adapter.ts → buildFoodReport()

Current Runtime Consumer(s):
  getEvidenceBackedFoodReport()  ← server/lib/food-intelligence-assembler.ts   (/api/foods/:slug/intelligence)
                                 ← server/lib/meal-intelligence-assembler.ts   (/api/meals/:id/intelligence)
                                 ← server/routes.ts                            (/api/pantry/search-index)
  buildFoodReport()              ← the above, transitively (identity + nutrients + context)
                                 ← server/lib/connected-food-intelligence-assembler.ts (identity only, no claims)
                                 ← client/src/components/FoodReport.tsx        (identity + nutrients + context; renders no claim)

Duplicate Owners Remaining:
  NONE

Duplicate State Remaining:
  NONE

Duplicate Workflows Remaining:
  NONE. The editorial+graduated merge happens in exactly one place. The canonical→knowledge
  match happens in exactly one place (KNOW3's resolveKnowledgeBinding). The benefit-claim
  render decision happens in exactly one place (the Layer-2 gate).

Current Convergence (%):
  Benefit-claim mouths: 0% → 100%. Four surfaces rendered benefit claims at HEAD; none passed
  the gate, and the gated composer PKC2 built had zero callers. Three server surfaces now read
  it exclusively; the fourth (browser) renders no claim, because it cannot evaluate `reviewedAt`.

  Graduated knowledge reachable from a Food Report: 0/7 → 7/7 canonical foods, 22 nutrient
  links and 13 evidence-backed benefit claims. Adapter nutrient coverage 249/312 → 256/312
  canonical foods (the remaining 56 have no knowledge binding — KNOW3's honest gaps).

Target Convergence (%):
  100% for this workstream, reached. Platform-wide Layer-2 closure is not: 21 of 70
  nutrient→benefit links carry a human sign-off, so 320 of 679 declared benefit links stay
  dark. That is content work (PKCA §7 Phase 0), not architecture, and it is a gate working.

Next Planned Milestone:
  An editorial pass over the graduated food→nutrient links (SUGGESTION 1) — the corroborating
  edge the gate does not check. `plain-wheat-flour → fibre` is the live example.

Remaining Architectural Risks:
  1. The Layer-2 gate audits the nutrient→benefit edge, not the food→nutrient edge that
     corroborates a chip. For the 264 editorial foods that edge is human-authored. For the 346
     graduated foods it is AI-drafted. KNOW4 is the first workstream for which the difference
     reaches the Food Report. Pre-existing (the DB path and /api/knowledge/foods already served
     it), named here for the first time. See SUGGESTION 1.
  2. FoodReport.tsx imports a 188KB canonical seed and now a 220KB graduated relationship seed
     into the browser bundle. Pre-existing in kind; enlarged by this change. See SUGGESTION 5.
```

---

## IMPLEMENTATION

### W1 — Measure before touching anything

The unified seed (`FOOD_NUTRIENT_SEED`) holds 1950 food→nutrient rows over 610 knowledge foods:
915 editorial, 1035 graduated. Projected through the 312 canonical identities and their 68
varieties, pointing the adapter at it moves **exactly seven foods and zero varieties**:

| Outcome | Foods | Varieties |
|---|---|---|
| Gains nutrients it could not see before | **7** | 0 |
| Already visible, unchanged | 249 | 41 |
| No knowledge binding — an honest gap | 56 | 27 (inherit parent) |

The seven are precisely KNOW3's seven. No other food's nutrient list changes membership. Four
foods (`spinach`, `broccoli`, `blueberries`, `greek-yoghurt`) are described by **both** halves
and gain a fifth nutrient each.

### W2 — The ordering rule, which is not `ranking`

Those four overlap foods exposed a trap. `ranking` is authored **independently within each
half** — no editorial author could see the graduated list, and no draft author could see the
editorial one. Merging the halves therefore produces colliding ranks:

```
broccoli   editorial:  vitamin-c@0  sulforaphane@1  folate@2  fibre@3
           graduated:  vitamin-k@1
```

Sorting the merged array by `ranking` — the obvious move, and the one the DB's own
`orderBy(asc(ranking))` implies — yields:

```
["Vitamin C", "Sulforaphane", "Vitamin K", "Folate", "Fibre"]
                               ^^^^^^^^^^^
                    an AI-drafted link, hoisted above two human-authored ones
```

Two independent sequences were never on one scale. The honest order is the composition's own
array order: **editorial links first, in their rank order; then graduated links, in theirs.**
`FOOD_NUTRIENT_LINKS` groups by food slug preserving array order and never re-sorts.
`validateKnowledgeSeed()` already refuses a duplicate `(food, fact)` pair, so no food can list
one nutrient twice. The rule is asserted by test, and the `ranking`-sorted mutation is asserted
to fail.

### W3 — Give the composition one home the browser can reach

The adapter needs one thing: the unified food→nutrient links. Reaching them through
`shared/knowledge/index.ts` would have pulled the knowledge identity seed (133KB), the graduated
identity seed (64KB), the vocabulary resolver, and — worst — `claim-sources.ts`, the citation
pack, into a client bundle that by design must never render a claim.

So the composition moved to `shared/knowledge/food-relationships.ts`, and `index.ts` re-exports
it. This creates no store and no fact; it gives one merge one home. The seed runner and the six
existing importers of `FOOD_NUTRIENT_SEED` / `FOOD_BENEFIT_SEED` are unchanged — they still
import from `@shared/knowledge`. That the arrays are the *same objects* (`===`) on both import
paths is asserted, because a re-derived copy is exactly the duplicate-composition failure this
module exists to prevent.

The adapter's value imports are now `CANONICAL_SEED`, `FOOD_NUTRIENT_LINKS`, `NUTRIENT_SEED`,
`NUTRITION_CONTEXT`, `varietyLabel`. It no longer imports `FOOD_BENEFITS` or
`HEALTH_BENEFIT_SEED` at all — it has no use for a benefit's display name.

### W4 — Close the claim channel, and give the gate its callers

`buildFoodReport()` returns `healthBenefits: []` and `additionalBenefits: []`, always, for every
food and every variety. This is not a regression of the adapter's capability; it is the removal
of an authority it never had. The module's header now says why, in the module.

Three consumers move onto `getEvidenceBackedFoodReport()`:

- **`getFoodIntelligence()`** — already `async`; one line.
- **`getMealIntelligence()`** — `assembleFoods()` becomes `async`, resolving one gated report per
  *distinct* canonical food (a meal's duplicate ingredients already deduped), concurrently. The
  same pattern `resolveIngredientsToKnowledgeSummary()` already uses.
- **`/api/pantry/search-index`** — resolves every live item, then fetches each **distinct** food's
  gated report once. A 200-item pantry over 40 foods costs 40 reads, not 200. A user can no
  longer find a food by a claim the platform is not allowed to make about it.

`connected-food-intelligence-assembler.ts` stays on `buildFoodReport()`: it reads
`overview.name` and nothing else. Repointing it would have bought a DB round-trip for a string.

### W5 — The browser renders no claim

`client/src/components/FoodReport.tsx` calls `buildFoodReport()` in the bundle. Its
`healthBenefits` guard would now never fire, and its variety `additionalBenefits` block never
render. Leaving unreachable JSX would tell the next reader that this component renders benefits.
It does not, and it cannot: `reviewedAt` is not in the bundle. The Health Benefits section and
the variety benefit chips are removed, and the header states the reason. `HEALTH_DISCLAIMER` is
still rendered by `PantryKnowledgeHub` and `PlantDiversityReport`, which are unaffected.

This is a visible product change: the Plant Diversity food report loses its benefit chips. It is
recorded here rather than buried, and SUGGESTION 4 names the route that would restore them
honestly.

---

## DEFINITION OF DONE

**Success**
- The seven KNOW3 bindings surface through `buildFoodReport()`: 22 nutrient links, matching
  KNOW3's own count. Measured, and asserted per-food against the graduated seed.
- The seven surface 13 evidence-backed benefit claims through the gated composer, each carrying
  ≥1 valid `SourceRef`. KNOW3 counted 14 *declared* benefit links; the gate withholds exactly one
  — `semi-skimmed-milk → muscle-recovery`, which no signed-off nutrient bridge corroborates.
- No benefit claim leaves `buildFoodReport()` for any of 312 foods or any variety.
- Editorial nutrients precede graduated ones for every food described by both halves.
- `test-food-report-evidence.ts` — PKC2's own test, failing at HEAD — passes.

**Must not break**
- `buildFoodReport()` returns `null` for preparations, containers and unknown slugs.
- Meal food resolution is unchanged (same foods resolved, same order).
- No new type error; no new fabricated fact; no seed row added, changed or removed.

**Manual test steps**
1. `npm run test:know4-graduated-food-reports` → 100 passed, 0 failed.
2. `npm run test:food-report-evidence` → 32 passed, 0 failed (was 31/1 at HEAD).
3. Drive the real routes' assemblers against the live DB:
   `getFoodIntelligence("grapefruit")` → nutrients `[Vitamin C, Fibre, Polyphenols]`,
   benefits `[Heart Health, Gut Health]`; `("mushroom")` → both empty (honest gap);
   `("not-a-food")` → `isCanonical: false`. **Performed.**
4. `getMealIntelligence()` over the same four meals at HEAD and at KNOW4: identical `foods`
   counts; benefit lists strictly shrink to the gated subset. **Performed.**
5. Mutate the code four ways and confirm the test refuses each. **Performed** — see below.

---

## DATA IMPACT

- **Reads existing data:** YES — `CANONICAL_SEED` (Domain 2), the unified knowledge seed
  (Domain 1), and the `knowledge_*` tables via the existing evidence gate.
- **Writes new data:** **NO.** Not one row, column, table, entity, seed entry or migration. No
  `reviewedAt` is set. No `SourceRef` is authored. `git diff` touches no seed data file.
- **Changes meaning of existing data:** NO. A benefit link that is withheld is not deleted,
  weakened or re-stamped — it remains in the seed and in the DB exactly as authored, awaiting a
  human sign-off. `FOOD_BENEFIT_LINKS` is exported and asserted non-empty precisely so that
  "withheld" cannot be confused with "gone".
- **Requires backfill:** NO. **Requires no seed run.** The change is entirely in what the code
  reads and what it is permitted to say.

**What users see change (dev/lower; production untouched, nothing seeded):**

```
canonical foods                                312
benefit claims rendered        660  →  359     (320 withheld: no SourceRef + reviewedAt)
foods rendering ≥1 benefit     249  →  223     (33 foods: every claim unsourced)
foods rendering ≥1 nutrient    249  →  256     (+7: the KNOW3 bindings)
the seven KNOW3 foods            0  →  22 nutrient links + 13 evidence-backed claims
```

---

## TRUST CHECK

- **Could this mislead the user?** It removes misleading content. 320 benefit claims that carry
  no citation and no human sign-off stop rendering. Nothing is softened into a hedge; an
  unprovable claim is simply absent, per Rule KC9 and Architecture Principle 6.

- **Could this fabricate certainty?** The single largest risk in this workstream, and the reason
  it did not take the one-line route. Pointing `healthBenefits` at the unified seed was a
  three-character change that would have rendered 667 ChatGPT-authored benefit links as THA
  health claims. The adapter now cannot make that mistake: it has no benefit data in scope, no
  benefit display map imported, and a 312-food test asserting it emits none.

- **Is anything guessed but shown as real?** No claim is. **One corroborating edge is, and it
  must be named.** The Layer-2 gate proves the *nutrient→benefit* edge (EFSA-cited, human
  signed-off). It does **not** audit the *food→nutrient* edge that corroborates the chip. For
  the 264 editorial foods that edge is human-authored. For the 346 graduated foods it is an AI
  draft. So `plain-wheat-flour` renders "Gut Health" and "Heart Health" because a ChatGPT draft
  says white flour notably contributes **fibre**, and fibre→gut-health is properly cited. The
  citation is real; the premise is weak — white flour is milled of its bran. KNOW3 flagged the
  underlying data as its SUGGESTION 5. This exposure is **pre-existing** — `/api/knowledge/foods`
  and the DB-backed path already serve it — and KNOW4 does not create it. But KNOW4 is what
  carries it onto the Food Report, and that is a fact the reviewer must weigh, not discover.
  It is SUGGESTION 1, first in the list, and it is content work: no code change removes it.

- **Is any `emerging` benefit shown as `established`?** No. `getFoodBenefitsForDisplay()` strips
  evidence strength before returning, unchanged by this workstream.

- **What happens if the system is wrong?** A wrong benefit renders as a health claim. Four
  barriers, three of them new to these surfaces: the adapter carries no benefit data at all; the
  gate requires a valid `SourceRef` *and* a human `reviewedAt`; the gate may only ever filter the
  links the seed declared, never introduce one (asserted per food); and the browser — the one
  surface that could never prove a claim — no longer renders one.

- **No architectural duplication introduced:** YES (none; one is removed).
- **No new source of truth created:** YES (none — `food-relationships.ts` owns no fact).
- **No runtime behaviour altered:** **NO.** This workstream deliberately alters what renders.
  Seven foods gain nutrients and benefits; 33 foods lose benefit chips; one client section is
  removed. Every change is stated above and none is silent.

---

## VALIDATION PERFORMED

Dev/lower. `REPLIT_DEPLOYMENT` unset. No seed run; production untouched. No migration.

| Check | Result |
|---|---|
| `test:know4-graduated-food-reports` (new, 100 assertions) | **100 / 100** |
| `test:food-report-evidence` (PKC2's own) | **32 / 32** — was **31 / 1** at HEAD |
| `test:food-report` (adapter) | 103 / 2 — the same 2 failures as HEAD, unchanged |
| `test:knowledge-food-ownership` | 24 / 24 |
| `test:knowledge-registry` | 27 / 27 |
| `test:knowledge-evidence-gate` | 116 / 116 |
| `test:knowledge-claim-coverage` | 14 / 14 |
| `test:canonical-knowledge-binding` (KNOW3) | 67 / 67 |
| `test:intelligence-food-intelligence-binding` | 36 / 36 |
| `test:intelligence-food-opportunity-binding` | 40 / 40 |
| `test:intelligence-nutrition-knowledge-binding` | 37 / 37 |
| `test:intelligence-meals-binding` | 72 / 72 |
| `test:intelligence-meal-discovery-binding` | 68 / 68 |
| `test:nutrition-enrichment` | 22 / 22 |
| `test-nk6r-canonical-identity` | 161 / 161 |
| `test-nk6s-beverage-and-pasta` | 97 / 97 |
| `tsc --noEmit` | **173 errors, byte-identical per-file to HEAD (173); 0 in any file touched** |
| `npm test` (full chain, 47 suites) | **exit 0**, zero failures; the new suite runs inside it |

**Cost of reaching the gate.** Two assemblers that were previously seed-only now read the
database. Measured against the same dev DB, warm, HEAD vs KNOW4:

| Call | HEAD | KNOW4 |
|---|---|---|
| `getFoodIntelligence()` | 14 ms | 21 ms |
| `getMealIntelligence()` | 8 ms | 14 ms |

Both routes already query the DB for household, planner and meal data, so this adds ~7 ms to a
request that was never free. `/api/pantry/search-index` performs one gated read per **distinct**
canonical food rather than one per pantry item. No caching was introduced; nothing is stored twice.

`test-food-report-adapter` fails 2 assertions (`lentils: Red has Plant Protein`, `lentils: Green
has no additionalNutrients`) and `test-canonical-food` fails 3 (`db=52 seed=173` etc.). All five
fail **identically at HEAD**, verified by `git stash`-ing this workstream and re-running against
the same database. They are the `plant-protein` residue KNOW1/KNOW2 documented and the stale dev
DB KNOW3 documented. Neither is touched here, and neither is silently repaired.

> **A correction to KNOW3's record.** KNOW3 reported `test-food-report-evidence` as failing 1
> assertion at HEAD and attributed all its pre-existing failures to "stale-dev-DB assertions or
> the `plant-protein` residue". That attribution was wrong for this one: the failing assertion is
> `tomato: sync healthBenefits always empty`, and it was failing because the ungated claim channel
> was real. It is now green. `tsc --noEmit` reports 173 errors at HEAD, not the 190 KNOW3 records.

**The load-bearing test.** Every assertion above passes on a clean tree, and none of them proves
the guards bite. `test-know4-graduated-food-reports.ts` was therefore run against four deliberate
mutations of the source, each restored afterwards:

| Mutation | Caught by |
|---|---|
| Adapter reads `FOOD_NUTRIENTS` again (the KNOW4 defect) | **30 assertions** — all seven foods report `[]` |
| Adapter emits `FOOD_BENEFIT_LINKS` (the PKC2 leak, widened) | `no food leaks a benefit claim` — names all 249 |
| `FOOD_NUTRIENT_LINKS` sorted by `ranking` | `broccoli: editorial Fibre (rank 3) still precedes graduated Vitamin K (rank 1)` — got `[Vitamin C, Sulforaphane, Vitamin K, Folate, Fibre]` |
| `index.ts` rebuilds its own `FOOD_NUTRIENT_SEED` | `index.ts re-exports the composition, it does not rebuild it` |

The gate is also asserted to **refuse** rather than merely to pass: `tomato` declares 3 benefit
links in the seed and renders 1; `Skin Health` is proven present in the seed and absent from the
report. Without that, every parity assertion would pass vacuously on a platform that had signed
off every claim. And `getFoodIntelligence()` — the assembler behind the route users actually hit
— is asserted equal to the evidence-gated registry, which is the assertion that would have caught
the PKC2 gap at HEAD.

---

## ROLLBACK PLAN

| Item | Value |
|------|-------|
| Rollback identifier | `rollback/before-know4-graduated-knowledge-food-reports-20260709` → `7508b399e8d1d07c3f83f7b65c1b28f6edc7cbd7` |

**Files modified**
```
shared/knowledge/food-relationships.ts             (new — the one composition)
shared/knowledge/index.ts                          (re-exports it; expanders moved out)
shared/canonical/food-report-adapter.ts            (unified nutrients; benefits removed)
server/lib/food-intelligence-assembler.ts          (→ getEvidenceBackedFoodReport)
server/lib/meal-intelligence-assembler.ts          (→ getEvidenceBackedFoodReport, assembleFoods async)
server/routes.ts                                   (/api/pantry/search-index → gated, deduped)
client/src/components/FoodReport.tsx               (benefit sections removed)
server/tests/test-food-report-adapter.ts           (benefit assertions inverted; ordering asserted)
server/tests/test-know4-graduated-food-reports.ts  (new)
package.json                                       (test script + npm test chain)
docs/implementation/knowledge/KNOW4_GRADUATED_KNOWLEDGE_FOOD_REPORTS.md (new)
```

**Rollback commands**
```bash
git checkout rollback/before-know4-graduated-knowledge-food-reports-20260709
```

**Verification after rollback**
```bash
npx tsx server/tests/test-food-report-adapter.ts    # 102 passed, 2 failed (pre-existing)
npx tsx server/tests/test-food-report-evidence.ts   # 31 passed, 1 failed (the leak, restored)
npx tsx server/tests/test-canonical-knowledge-binding.ts  # 67 passed
```

No migration was added and no data was written, so there is nothing to reverse. Rollback restores
the ungated claim channel — which is the point of recording that it exists.

---

## SCOPE LOCK

**Implemented scope**
- `buildFoodReport()` reads the unified `FOOD_NUTRIENT_LINKS`; the seven KNOW3 bindings surface.
- Editorial-before-graduated ordering, never a `ranking` sort across authorship halves.
- `buildFoodReport()` emits no benefit claim, for any food or variety, ever.
- `getEvidenceBackedFoodReport()` becomes the one mouth for benefit claims, with three callers.
- `shared/knowledge/food-relationships.ts` — one composition, re-exported by `index.ts`.
- `FoodReport.tsx` renders no claim it cannot prove.
- `test-know4-graduated-food-reports.ts` (100 assertions), wired into `npm test`.

**Explicitly excluded scope**
- No knowledge food, nutrient, benefit or link created, edited, merged, renamed or deleted.
- No `reviewedAt` written. No `SourceRef` authored. No seed data file touched.
- No migration. No seed run. `seed:canonical` and `seed:knowledge` were deliberately not run.
- No new API route. No amendment to any governing architecture document.
- The 5 pre-existing test failures (2 adapter, 3 canonical-food) are left failing, not repaired.
- KNOW3's two deferrals (`lentils`, `pasta`) remain deferred; both still surface no nutrients.

**SUGGESTIONS — observed, not implemented, do not action without approval**

1. **The gate does not audit the edge that corroborates the chip.** A food's benefit chip renders
   when the food links a nutrient whose link to that benefit is evidence-backed. The
   *nutrient→benefit* edge is audited; the *food→nutrient* edge is not. For the 346 graduated
   foods that edge is a ChatGPT draft, and KNOW4 is the first workstream to carry it onto the Food
   Report. `plain-wheat-flour → fibre → gut-health` is the live example: a real EFSA citation
   resting on a claim that white flour notably contributes fibre. This is content work, not code:
   an editorial pass over the 1035 graduated food→nutrient links. It is the highest-value follow-up
   in this document. (KNOW3's SUGGESTION 5 named the datum; this names the mechanism.)

2. **PKC2's record is wrong and should be corrected, as KNOW1 corrected PKC3/PKC5.**
   `PKC2_ONE_MOUTH_CONVERGENCE_IMPLEMENTATION.md` states that every consumer was migrated to the
   gated composer and that `buildFoodReport()`'s benefit fields are always empty. Neither was true
   at HEAD; `getEvidenceBackedFoodReport()` had zero callers and `GET /api/foods/:slug/report` was
   never built. The header of `server/lib/food-report-evidence.ts` still cites that route.

3. **PKCA §2.1's "one mouth" register names `buildFoodReport` for "Food (nutrition + identity
   composed)".** After KNOW4 the row is split in practice: `buildFoodReport` is the mouth for
   identity, nutrients and context; `getEvidenceBackedFoodReport` is the mouth for benefit claims.
   The register is governing architecture and was not amended. It should be.

4. **No route serves a gated Food Report.** `PlantDiversityReport` lost its benefit chips because
   the browser cannot evaluate `reviewedAt`. Adding `GET /api/foods/:slug/report` →
   `getEvidenceBackedFoodReport()` (the route PKC2 already documented) and having `FoodReport.tsx`
   fetch it would restore them honestly, and would let the component stop importing the canonical
   seed into the bundle.

5. **`graduated-relationships.ts` imports 64KB of food identities for one string.** It reads
   `GRADUATED_FOOD_SOURCE` from `graduated-foods.ts`. Tree-shaking should drop the rest, but the
   dependency is real and now sits in the client bundle. Moving the constant to its own module
   would cost nothing.

6. **`greek-yoghurt` has six nutrient links and the report shows five.** The unified seed gives it
   `calcium, vitamin-b12, vitamin-d, selenium` (editorial) + `iodine, live-cultures` (graduated).
   `slice(0, 5)` admits `iodine` and drops `live-cultures` — arguably the signature nutrient of a
   live-cultured food. Nothing is lost against HEAD (which showed four), but the top-5 cut now has
   an editorial consequence it did not have before.

7. **The DB orders nutrients by `ranking`; the seed orders them by authorship half.**
   `getNutrientsForFood()` runs `orderBy(asc(ranking))`, and for the four overlap foods two rows
   share a rank, so the DB's order is undefined where the seed's is deterministic. The two readers
   agree on the *set* (asserted) but may disagree on the *order*. Resolving this means renumbering
   graduated rankings — which KNOW2 explicitly refused to do, because it would silently change data.

8. **SoT Register figures remain stale.** Domain 1 records "188 foods" (actual: 610). KNOW2 and
   KNOW3 both reported this drift; it is still unamended.
