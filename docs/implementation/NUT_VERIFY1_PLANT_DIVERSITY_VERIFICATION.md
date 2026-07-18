# NUT_VERIFY1 — Plant Diversity Verification

**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Risk:** 💡 Premium Reasoning
**Reason:** Verify and complete the canonical Plant Diversity and Nutrition reporting pipeline so household nutrition insights reflect the underlying data.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | `rollback/NUT_VERIFY1-plant-diversity-verification-20260718` |
| **Commit** | `e5cd889e` — EXPERIENCE_VERIFY1 completion |
| **Baseline build** | 🟢 verified passing before any change |

**Rollback command:**
```
git reset --hard rollback/NUT_VERIFY1-plant-diversity-verification-20260718
```

The tree held uncommitted work from concurrent sessions — including `client/src/pages/plant-diversity-page.tsx` — **deliberately not captured**. That change is unrelated (a `/plant-diversity` → `/nutrition` route rename from PROD4) and touches no counting logic.

---

## ROOT CAUSE

> **The Nutrition room was calling the canonical plant classifier on raw recipe lines. The canonical resolver is exact-key by design, so almost every real ingredient failed to resolve and was silently counted as "not a plant".**

`client/src/components/PlantDiversityReport.tsx` fed `isPlantIngredient()` and its dedupe key the **whole recipe line**:

```ts
if (!raw.trim() || !isPlantIngredient(raw)) continue;   // "400g tin chickpeas, drained"
const key = normaliseForReuse(raw);
if (key) plantCountKeys.add(key);
```

`resolveCanonicalFood` is **exact-key, never substring** — stated as a deliberate rule at `shared/canonical/resolver.ts:10-11`. So `"400g tin chickpeas, drained"` returns `UNRESOLVED` → `matched: false` → `plantDiversityGroup()` returns `null` → **not a plant**. Bare `"chickpeas"` resolves cleanly.

**"Black Pepper" survived because it is the one ingredient conventionally written with no quantity.** That is the complete explanation for `1 / 30`.

### Two defects, pushing opposite ways

LAUNCH1 had already named both — *"the displayed number has no bounded error"* — and PROD2 explicitly left them open (`:309`).

| | Defect | Effect |
|---|---|---|
| **1** | Classifier called on the **raw line** | **Under-count** — the dominant error |
| **2** | Dedupe on the **ingredient key**, not the diversity group | **Over-count** |

Defect 2 violates a rule stated verbatim in the Source of Truth Register, **Domain 4**:

> *"One diversity group = one plant. `plantDiversityGroup()` is the sole owner of that question. **A counter that dedupes on the ingredient slug over-counts and is a defect (CPI1 S1-2).**"*

### The same bug, twice, in one file

`getSectionForIngredient:143` also called `isPlantIngredient(raw)`. That is why the **Plant Based section contained one ingredient** while the household had planned dozens — every quantity-prefixed plant fell through to "other".

### The correct pattern already existed

The **server's** 30-plants counter (converged by PUB1) had it right all along:

```ts
const parsed = parseIngredientShared(rawIng);
const slug   = singularizeIngredientKey(parsed.normalizedName);
const group  = plantDiversityGroup(slug);
if (group) plantGroups.add(group);        // dedupe on the GROUP
```

**The fix is the client adopting that chain — not a new algorithm.** No scoring rule was invented or changed.

---

## SECOND ROOT CAUSE — found by the browser, not by reading code

With counting fixed, garlic finally reached the Plant Based table and rendered as **"Arlic"**.

`stripForMatch` in `client/src/lib/ingredient-reuse.ts:34` had a unit alternation with **no trailing word boundary**:

```js
.replace(/\d+(\.\d+)?\s*(g|kg|ml|l|tsp|...)?\s*/gi, '')
```

For `"3 garlic cloves, crushed"` it matched `"3 g"` as **3 grams**, leaving `"arlic"`. Also `"2 cloves garlic, crushed"` → `"s garlic"`, a separate phantom row.

**Pre-existing, and invisible for exactly as long as garlic never reached that table.** It would not have been found by reading the diff — only by looking at the screen, which is the capability EXPERIENCE_VERIFY1 restored one programme earlier.

---

## FILES CHANGED

| File | Change |
|---|---|
| `client/src/components/PlantDiversityReport.tsx` | Added `canonicalIngredientSlug()` (the server's chain); count now dedupes on **diversity group**; `getSectionForIngredient` classifies the **slug** |
| `client/src/lib/ingredient-reuse.ts` | One regex: `\b` inside the optional unit group |
| `server/tests/test-nut-verify1-plant-diversity.ts` | **New** — 43 assertions |
| `package.json` | Registered `test:nut-verify1`, added to the `npm test` chain |

**No server file, no schema, no migration, no canonical seed, and no scoring algorithm was changed.**

---

## VERIFICATION RESULTS

### On screen — the household-visible number

| | Before | After |
|---|---|---|
| **Plants** | **1 / 30** | **32 / 30** |
| **Plant categories** | **1 / 9** | **5 / 9** |
| **Plant Based section** | **1 ingredient** | **35 ingredients** |
| Ingredients this week | 75 | 75 *(unchanged — correct)* |
| Garlic row | *"Arlic"* | *"Garlic"* |

The room now reads *"You've hit 30 plants this week — brilliant variety."* Screenshot: `docs/ui-audit/experience-verify1/nut-verify1-nutrition-after.png`.

### Against real cookbook data

14 founding-cookbook recipes, 147 ingredient lines: **1 plant → 31 plants**.

### Test suite

```
✓ nut-verify1 plant-diversity tests — 43 passed, 0 failed
```

| Command | Outcome |
|---|---|
| `npx tsx server/tests/test-nut-verify1-plant-diversity.ts` | 🟢 **43 passed, 0 failed** |
| `npx vite build` | 🟢 **PASSES** |
| `npx tsc --noEmit` — `client/` | 🟢 **0 errors** |
| Browser, `/plant-diversity`, authenticated | 🟢 **32/30**, 5/9, no *"Arlic"* |

### The test suite found that my own fix was partial

The first version of the suite **failed 13 assertions**, and it was right to. `parseIngredient` strips quantity and unit but **not descriptor words**, so a descriptor still defeats exact-key matching:

| Line | Reduces to | Result |
|---|---|---|
| `400g tin chickpeas, drained` | `tin chickpeas` | ❌ still null |
| `200g dried red lentils` | `dried red lentils` | ❌ still null |
| `100g baby spinach` | `baby spinach` | ✅ resolves |
| `2 cloves garlic, crushed` | `garlic` | ✅ resolves |

Rather than weaken the assertions, the suite now **characterises** the gap: `BLOCKED_BY_DESCRIPTORS` asserts these are *currently* null so the gap is measured and cannot silently widen, and its comment says plainly that **a failure there is good news** — the resolver improved, and the entry should move.

**This residual is not a client defect and was deliberately not fixed:** the server's counter uses the identical chain and loses exactly the same lines. Closing it means teaching the parser about descriptors or relaxing the resolver's exact-key discipline — a change to a canonical owner, outside this scope. It is recommendation R1.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

- ☑ **One canonical identity** — no entity touched. Plants remain keyed by `diversity_group`.
- ☑ **One owner per fact** — **strengthened.** The client previously answered "is this a plant, and which one" with its own raw-string call plus its own slug dedupe. It now asks `plantDiversityGroup()`, the sole owner named in SoT Domain 4, and owns no counting rule.
- ☑ **No duplicate entities** — none created.
- ☑ **No duplicate ownership** — **reduced by one.** `canonicalIngredientSlug()` is key *shaping*, not classification; it reproduces the server's existing chain and decides nothing.
- ☑ **No duplicate state** — none.
- ☑ **Extends existing architecture** — the fix adopts the pattern the server counter already used. No new pattern.
- ☑ **Progressive enrichment** — N/A.
- ☑ **Knowledge domain compliance** — no knowledge domain introduced or extended; **no canonical seed row added**. Foods that do not resolve stay unresolved.
- ☑ **Honest gaps over fabricated information** — **load-bearing.** The fix adds no fallback, no fuzzy match and no guess: an unresolved ingredient is still not a plant. The descriptor residual is *characterised in tests*, not papered over, and §Recommendations names it rather than quietly absorbing it.
- ☑ **No permanent synchronisation bridge** — none.
- ☑ **Evolution over replacement** — nothing replaced.

## AI ARCHITECTURE COMPLIANCE

- ✓ **Uses the canonical Intelligence Platform** — no intelligence code touched. Plant diversity is deterministic canonical classification, not an AI capability.
- ✓ **Uses the Capability Registry** — unchanged; no descriptor read or edited.
- ✓ **Uses the Intent Engine** — untouched.
- ✓ **Reuses existing business services** — `plantDiversityGroup`, `parseIngredient`, `singularizeIngredientKey`, all unmodified.
- ✓ **Does not create another assistant** — **none.** No conversational surface touched.
- ✓ **Does not duplicate conversation state** — none touched.
- ✓ **Uses registered capabilities only** — none invoked.
- ✓ **Uses permission-aware access** — unchanged; the report renders from the household's own planner data via existing authenticated routes.
- ✓ **Produces honest gaps rather than fabricated knowledge** — see above; nothing was made to resolve that does not.

---

## DEFINITION OF DONE

**Success:** the plants number on the Nutrition room reflects the household's actual planned variety, counted by the canonical owner's rule — one diversity group, one plant — and a regression test makes the specific failure impossible to reintroduce silently.

**What must not break:** the server's 30-plants counter (untouched), the Planner intelligence strip, nutrition variety chips, the ingredient-reuse panel and `ingredient-imagery` (the four other `normaliseForReuse` consumers), and honest absence for unresolved ingredients.

**Manual test steps:** below.

## DATA IMPACT

- **Reads existing data:** YES — planner entries and meal ingredients, through existing authenticated routes.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO — **the underlying data was always correct.** Only the count derived from it changes, from wrong to right. No stored value is reinterpreted.
- **Requires backfill:** NO. Nothing was persisted; the count is computed per render.

No schema, migration, seed, or stored row was touched.

## TRUST CHECK

- **Could this mislead the user?** It **removes** a misleading number. A household eating 32 distinct plants was told it had eaten 1 — against a headline promise. The new figure is computed by the owner the architecture names.
- **Could this fabricate certainty?** No. No fallback, fuzzy match or guess was added. An ingredient that does not resolve is still not counted, and the descriptor residual is measured in tests rather than hidden — so the number is now **under-inclusive and honest** rather than wrong in an unbounded direction.
- **Is anything guessed but shown as real?** No. Every plant counted resolved to a canonical diversity group.
- **What happens if the system is wrong?** The failure mode is under-count (an unresolved ingredient is skipped), which understates variety — the safe direction for a health-adjacent figure. It cannot invent a plant a household did not plan.
- **No architectural duplication introduced:** YES — duplication was **reduced**.
- **No new source of truth created:** YES.
- **No runtime behaviour altered:** NO — deliberately altered: the plants figure, the plant categories figure, the section assignment, and ingredient display names.
- **Every "verified" claim backed by a command that ran:** YES — build, typecheck, 43 tests, a cookbook measurement, and a browser session; all in §Verification Results.

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/NUT_VERIFY1-plant-diversity-verification-20260718` → `e5cd889e`
- **Files modified:** the four in §Files Changed, plus this report and one screenshot.
- **Rollback command:** `git reset --hard rollback/NUT_VERIFY1-plant-diversity-verification-20260718`
- ⚠️ Reverting restores the `1 / 30` under-count and the *"Arlic"* display name.
- **Preferred:** `git revert <sha>` of this commit alone, so concurrent sessions' work is unaffected.
- **Verification after rollback:** `npx vite build` 🟢; `npm run test:nut-verify1` **fails** (correctly — the guard outlives nothing).

## SCOPE LOCK

**Implemented:** the counting fix (both defects), the sectioning fix, the display-name regex fix, and 43 regression assertions registered into `npm test`.

**Explicitly excluded — NOT done:**
- Descriptor-aware ingredient parsing (**R1**) — a change to a canonical owner
- Wiring plant diversity to the **diary** (LAUNCH1 `:580`) — a product decision about what the number should measure
- The display-row grouping artifacts (**R2**) — a third private normalisation path
- Any change to `plantDiversityGroup`, the canonical seed, or any scoring algorithm
- Any server file, schema, migration or route
- Resolving the architecture-document contradiction (**R4**)
- The `nutrition-variety.ts` M4 duplicate-owner question

**Suggestions observed outside scope (not implemented):**
- `PlantDiversityReport` has a **third** private normalisation path — `getDisplayKey` (`EXTRA_UNIT_RE` + `normaliseForReuse`) — distinct from both the canonical chain and `parseIngredient`. It produces the artifact rows in R2
- `getPlantCategory(displayKey) ?? "Vegetables"` force-categorises anything reaching the plant section, so a resolved plant of an unmapped category silently reads as a vegetable

---

## MANUAL VERIFICATION

**1 — The count is right (the fix)**
- *Start:* signed in as a household with a populated planner week; open `/nutrition` (or `/plant-diversity`), **Foods** tab
- *Expected:* PLANTS reads a realistic figure — for the dev-world household, **32 / 30**, not 1 / 30
- *Success:* the number is plausible against the meals visible in `/planner`
- *Regression:* PLANT CATEGORIES > 1; the Plant Based section lists many ingredients, not one

**2 — Group dedupe, not slug dedupe**
- *Action:* plan meals using two varieties of one plant (kale and cavolo nero, or two tomato varieties)
- *Expected:* the plant count rises by **one**, not two
- *Success:* matches SoT Domain 4 — *"Kale and cavolo nero are one plant"*

**3 — Display names are not eaten**
- *Action:* in the Plant Based table, find the garlic row
- *Expected:* **"Garlic"** — never *"Arlic"* or *"S Garlic"*

**4 — Honest absence preserved**
- *Action:* plan a meal with an ingredient not in the canonical seed
- *Expected:* it is **not** counted as a plant and **not** guessed into a category
- *Success:* the number never exceeds what the seed can justify

**5 — Regression guard**
- *Action:* `npm run test:nut-verify1`
- *Expected:* **43 passed, 0 failed**

## USER ACCEPTANCE EVIDENCE

**Captured.** A real authenticated browser session against the dev-world household, before and after:

| Evidence | Value |
|---|---|
| Before *(EXPERIENCE_VERIFY1 `verify-nutrition.png`)* | 1/30 plants · 1/9 categories · 1 plant ingredient |
| After *(`nut-verify1-nutrition-after.png`)* | **32/30 plants · 5/9 categories · 35 plant ingredients** |
| Display name | *"Arlic"* → *"Garlic"*, asserted in-page |
| Cookbook measurement | 147 real ingredient lines: 1 → 31 |

**Not covered:** desktop 1440×900 light mode only; one household; the **Nutrients** tab (`/api/nutrition-centre`, a different assembler) was **not** re-verified; manual steps 2 and 4 were **not** executed — no meal was planned through the UI, so group-dedupe is proven by unit test, not by a household action.

---

## REMAINING RECOMMENDATIONS

| # | Recommendation | Value | Cost |
|---|---|---|---|
| **R1** | **Descriptor-aware ingredient resolution.** `tin`, `dried`, `rolled`, `chopped`, `small`, `red` still defeat exact-key matching, so a real week under-counts. Fix at the canonical layer — parser or resolver — so the **server counter benefits identically**. `BLOCKED_BY_DESCRIPTORS` is the ready-made acceptance list | 🔴 High | M |
| **R2** | **One display-key owner.** `getDisplayKey` is a third private normalisation producing artifact rows — *"Cucumber Or Finely"*, *"Celery Sticks"* beside *"Celery"*, *"Black Pepper And Little Salt"*. Counting is unaffected (group dedupe), but the table reads as broken | 🟠 Med-High | M |
| **R3** | **Decide what the number measures.** LAUNCH1 `:580`: plant diversity reads the **planner**, never the **diary** — *"what you planned, never what you ate"*. A product decision, not a defect | 🟠 Med-High | M |
| **R4** | **Resolve the architecture contradiction.** The docs disagree with themselves: SoT Register and NK1 say M4 is complete and Plant Diversity is 173/173 published; `ARCHITECTURE_PRINCIPLES.md:121` still says **Contested** and `CANONICAL_PUBLICATION_ARCHITECTURE.md:207` says **🔴 DRIFT: 30% published (52/173)**. One of these is wrong and a future programme will trust the wrong one | 🟠 Med | S |
| **R5** | **Audit the other two counters.** SoT Domain 22 names `household-nutrition-assembler.ts` (`weekPlantFacts`) and `nutrition-centre-assembler.ts` (`plantDiversity`) as **still deduping on the canonical slug** — the same over-count defect fixed here, in two server files. **Not verified by this programme** | 🟠 Med | S |
| **R6** | Category fallback `?? "Vegetables"` silently mis-files a plant of an unmapped category | 🟡 Low-Med | S |

### Suggested follow-on programme

**`NUT_VERIFY2 — Canonical Resolution Completion`** — R1, R2 and R5 together: close the descriptor gap at the canonical layer, converge the display-key rival, and fix the two remaining slug-deduping counters. R1 is the one that moves the number again, and by design it moves it in only one direction: **up, and honestly.**

---

## OUTCOME

**The Nutrition room was telling households they had eaten one plant when they had planned thirty-two.**

The cause was not the data, the seed, or the algorithm — all three were correct. It was that the client asked the canonical classifier a question in a shape it cannot answer: a whole recipe line, given to a resolver that is exact-key by deliberate design. The server had been doing it correctly the whole time; **the fix is the client adopting the server's existing chain, and no new rule was written.**

The second fix was found only by looking: with counting repaired, garlic reached the table for the first time and rendered as *"Arlic"*, because a unit regex without a word boundary had been reading the "g" in "garlic" as grams. That defect was invisible for as long as the first one hid it — and it is the clearest argument yet for the browser verification EXPERIENCE_VERIFY1 restored.

**Verified end to end: 1/30 → 32/30 on screen, 1 → 31 across real cookbook data, 43 assertions green, no server file touched.** The number is now under-inclusive and honest rather than wrong without bound — and R1 names exactly what still keeps it lower than the truth.
