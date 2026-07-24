# NUT_VERIFY2 — Canonical Resolution Completion

**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Risk:** 💡 Premium Reasoning
**Reason:** Extend canonical ingredient parsing so descriptor-rich lines resolve, while preserving exact-key canonical ownership.

---

## ROLLBACK PROTECTION

| | |
|---|---|
| **Rollback identifier** | `rollback/NUT_VERIFY2-canonical-resolution-completion-20260718` |
| **Commit** | `fc9423ff` (BUS1, which follows NUT_VERIFY1) |
| **Baseline** | build 🟢 · NUT_VERIFY1 suite 43/0 · target files all clean |

**Rollback command:**
```
git reset --hard rollback/NUT_VERIFY2-canonical-resolution-completion-20260718
```

Concurrent sessions' uncommitted work was **not** captured. All five files this programme touches were clean at tagging.

---

## ROOT CAUSE

NUT_VERIFY1 fixed *how* the client called the classifier and measured what remained: **`parseIngredient` removed quantity and unit, but never descriptors.**

```
"400g tin chickpeas, drained"  →  "tin chickpeas drained"   ✗ not a canonical key
"200g dried red lentils"       →  "dried red lentils"       ✗
"1 small red onion"            →  "small red onion"         ✗
```

Three distinct gaps produced this:

| # | Gap | Example |
|---|---|---|
| **1** | **Trailing prep vocabulary incomplete** — `PREP_NOTES` was a hand-written inline list missing *drained*, *shredded*, *rinsed*, *to serve* | `chickpeas, drained` kept "drained" |
| **2** | **The multiplier form unparsed** — `1 x 400g …` defeated every pattern, leaving `"x 400g"` in the key | `x 400g tin chopped tomatoes` |
| **3** | **No leading-descriptor handling anywhere** — the resolver's candidate list held only the faithful key and plural→singular forms | `dried red lentils` never reached `red lentils` |

**The resolver was not at fault.** Exact-key matching is a deliberate, documented rule (`resolver.ts:10-11`) and this programme preserves it completely. The defect was that free text was never reduced to a shape the index could answer.

---

## DESCRIPTOR RULES IMPLEMENTED

A single vocabulary owner — `shared/ingredient-descriptors.ts` — modelled on the existing `shared/ingredient-units.ts` precedent, including its "Do NOT merge with" boundary list.

| Family | Members |
|---|---|
| **Size** | small, medium, large, extra, mini, baby, jumbo, thick, thin |
| **Container** | tin, tinned, can, canned, jar, jarred, packet, pack, box, boxed, bottle, bottled, carton, bag, bagged, frozen, tub |
| **Form / prep** | chopped, diced, minced, sliced, crushed, grated, shredded, peeled, trimmed, halved, quartered, cubed, torn, rinsed, drained, washed, deseeded, seeded, cored, stoned, pitted, skinned, boned, boneless, skinless, cooked, raw, ripe, fresh, dried, ground, rolled, whole, lean, wholegrain, wholemeal, finely, coarsely, roughly, thinly, freshly, roasted, toasted, smoked, unsalted, salted, sweetened, unsweetened, plain, natural, organic, free-range, mixed |

### The four rules that make peeling safe

1. **Faithful key first, always.** The unpeeled key is candidate #1. Any descriptor that begins a real canonical name — *dried lentils*, *ground cumin*, *baby spinach*, *tinned tomatoes*, *rolled oats* — resolves at full length and is never reduced.
2. **Leading run only.** Peeling stops at the first non-descriptor word. Whole words only; a word is never edited.
3. **🔴 COLOURS ARE NOT DESCRIPTORS.** Measured against the live seed:
   - `red cabbage` → canonical `red-cabbage`, group **`red-cabbage`**
   - `cabbage` → canonical `cabbage`, group **`cabbage`**
   - `black pepper` → group **`black-pepper`**; `pepper` → group **`pepper`**

   Four different foods in two pairs. A peeler that removed *red* or *black* would silently change which plant a household is credited with. Colour words are excluded by list **and** protected structurally by rule 1.
4. **Never peel to nothing.** The last remaining word is never removed.

Plural containers (*tins*, *cans*, *jars*) are matched by tolerating a single trailing "s" **in the membership test only** — a word matches only if its singular is already in the vocabulary.

---

## THE BOUNDARY I CROSSED, AND FIXED

The first implementation folded peeling into `ingredientKeyVariants`. **That broke three suites, and I caused it.**

`ingredientKeyVariants` has two callers with opposite needs, and its own KNOW3 comment says identity matching happens "through THIS normalisation and no other":

- `resolveCanonicalFood` — *what might a person have meant?* Peeling **correct**.
- `knowledge-binding.ts` — *what forms IS this identity?* Peeling **wrong**.

With peeling folded in, `smoked-cheese` reduced to `cheese`, `ground-coffee` to `coffee`, `baby-spinach` to `spinach`, `smoked-paprika` to `paprika`, `extra-virgin-olive-oil` to `virgin olive oil`. `validateCanonicalSeed()` then reported **six real seed entries as ambiguous knowledge bindings**, and `canonical-food`, `NK6R` and `NK6S` went red.

**Verified as mine, not pre-existing:** at the rollback tag those suites were 46/0, 161/0, 97/0.

**Fix:** `ingredientKeyVariants` is restored byte-for-byte to its original behaviour, and peeling lives in a new `freeTextIngredientKeyVariants`, called only by `resolveCanonicalFood`. Identity matching stays faithful; free text gets the wider net. §6b of the new suite pins the boundary so it cannot be re-merged.

---

## FILES CHANGED

| File | Change |
|---|---|
| `shared/ingredient-descriptors.ts` | **New** — the one descriptor vocabulary, with the colour prohibition documented and measured |
| `shared/parse-ingredient.ts` | Prep notes now read from the shared vocabulary; multiplier form (`1 x 400g …`) removed before the existing patterns |
| `shared/canonical/resolver.ts` | `ingredientKeyVariants` **unchanged**; new `freeTextIngredientKeyVariants` peels; `resolveCanonicalFood` uses it |
| `server/tests/test-nut-verify2-descriptor-resolution.ts` | **New** — 81 assertions |
| `server/tests/test-nut-verify1-plant-diversity.ts` | `BLOCKED_BY_DESCRIPTORS` discharged; six entries promoted |
| `package.json` | Registered `test:nut-verify2` into `npm test` |

**No client file, no schema, no migration, no canonical seed row, and no scoring algorithm was changed.** `plantDiversityGroup` is untouched.

---

## BEFORE / AFTER VERIFICATION

### The mission's examples

| Line | Before | After |
|---|---|---|
| `400g tin chickpeas, drained` | ✗ UNRESOLVED | ✅ `chickpeas` |
| `200g dried red lentils` | ✗ UNRESOLVED | ✅ `lentils` |
| `1 small red onion` | ✗ UNRESOLVED | ✅ `onion` |
| `2 cloves garlic, crushed` | ✅ `garlic` | ✅ `garlic` *(unchanged)* |

### Identity preserved

| Line | Resolves to | Must NOT be |
|---|---|---|
| `1 small red cabbage, shredded` | ✅ `red-cabbage` | ~~cabbage~~ |
| `black pepper` | ✅ `black-pepper` | ~~pepper~~ |
| `2 tsp ground cumin` | ✅ `cumin` | — |
| `100g baby spinach` | ✅ `spinach` | — |

### Honest gaps preserved

`a pinch of qwertyuiop` · `200g dried unicorn flakes` · `1 small red dragonfruit` · `2 tins of nonsensefruit, drained` → **all still `null`.** Peeling widened which exact keys are tried; it invented no match.

### Real cookbook data — 14 recipes, 147 ingredient lines

| Stage | Distinct plants |
|---|---|
| Before NUT_VERIFY1 | **1** |
| After NUT_VERIFY1 | 31 |
| **After NUT_VERIFY2** | **38** |

### On screen, authenticated household

| | Plants | Plant ingredients |
|---|---|---|
| Before NUT_VERIFY1 | **1 / 30** | 1 |
| After NUT_VERIFY1 | 32 / 30 | 35 |
| **After NUT_VERIFY2** | **39 / 30** | **43** |

Screenshot: `docs/ui-audit/experience-verify1/nut-verify2-nutrition-after.png`

## REGRESSION TEST RESULTS

| Suite | Result |
|---|---|
| **`test:nut-verify2`** *(new)* | 🟢 **81 passed, 0 failed** |
| `test:nut-verify1` | 🟢 **55 passed, 0 failed** *(was 43 — six promoted)* |
| `test:canonical-food` | 🟢 46 / 0 *(matches tag)* |
| `test:nk6r-canonical-identity` | 🟢 161 / 0 *(matches tag)* |
| `test:nk6s-beverage-and-pasta` | 🟢 97 / 0 *(matches tag)* |
| `test:household-nutrition` | 🟢 54 / 0 |
| `test:knowledge-registry` | 🟢 27 / 0 |
| `test:ingredient-verification` | 🟢 22 / 0 |
| `food-graph` · `plant-milk-vegan` · `restriction-resolver` · `intelligence-compound-resolver` | 🟢 all pass |
| `npx vite build` | 🟢 passes |
| `npx tsc --noEmit` — `client/` | 🟢 0 errors |
| `npx tsc --noEmit` — total | **94**, identical to baseline, **0 introduced** |

The new suite covers: mission examples · five descriptor families · identity preservation · faithful-first ordering · honest gaps · never-peel-to-nothing · **no substring matching** (`oatscarf`, `garlicky`, `tomatoish` must not match) · whole-word-only peeling · the colour prohibition · **the identity/free-text boundary** · client≡server behaviour.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

- ☑ **One canonical identity** — no identity created, renamed or merged. `red-cabbage` and `black-pepper` remain distinct from `cabbage` and `pepper`, asserted in tests.
- ☑ **One owner per fact** — the descriptor vocabulary has exactly one owner, consumed by both the parser and the resolver. The parser's inline prep list — a second, divergent copy — was **retired into it**.
- ☑ **No duplicate entities** — none created.
- ☑ **No duplicate ownership** — **reduced.** One vocabulary replaces two lists; `plantDiversityGroup` remains the sole classifier and was not touched.
- ☑ **No duplicate state** — none.
- ☑ **Extends existing architecture** — `ingredient-descriptors.ts` follows `ingredient-units.ts`'s established shape; peeling extends the resolver's existing candidate-list mechanism rather than adding a parallel path.
- ☑ **Progressive enrichment** — N/A.
- ☑ **Knowledge domain compliance** — **no canonical seed row added, removed or edited.** A food absent from the seed is still absent. The knowledge-binding boundary is restored and pinned.
- ☑ **Honest gaps over fabricated information** — **the central property.** Every candidate must equal a canonical key exactly; no fuzzy, no substring, no nearest-match. Four unknown fixtures assert this, plus four substring traps.
- ☑ **No permanent synchronisation bridge** — none. Client and server share one function rather than two kept in step.
- ☑ **Evolution over replacement** — the parser's inline list was replaced and **deleted** in the same change.

## AI ARCHITECTURE COMPLIANCE

- ✓ **Uses the canonical Intelligence Platform** — no intelligence code touched. Canonical resolution is deterministic lookup, not an AI capability.
- ✓ **Uses the Capability Registry** — unchanged; no descriptor read or edited.
- ✓ **Uses the Intent Engine** — untouched.
- ✓ **Reuses existing business services** — extends `parseIngredient` and the resolver in place; creates no rival.
- ✓ **Does not create another assistant** — none.
- ✓ **Does not duplicate conversation state** — none touched.
- ✓ **Uses registered capabilities only** — none invoked.
- ✓ **Uses permission-aware access** — unchanged; no route, auth path or data scope altered.
- ✓ **Produces honest gaps rather than fabricated knowledge** — **no fuzzy matching, no substring matching, no relaxation of exact-key ownership**, all three explicitly asserted.

---

## DEFINITION OF DONE

**Success:** descriptor-rich recipe lines reach their canonical food; foods whose names begin with a descriptor keep their own identity; unknown ingredients stay unknown; and one vocabulary serves both planes.

**What must not break:** exact-key resolution, canonical identities, `plantDiversityGroup`, the knowledge-binding identity path (`validateCanonicalSeed`), and the server's 30-plants counter.

**Manual test steps:** below.

## DATA IMPACT

- **Reads existing data:** YES — planner meals and their ingredient strings, unchanged.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO. No stored value is reinterpreted; the same strings now reduce to keys the index already held. **No canonical identity changed meaning.**
- **Requires backfill:** NO. Resolution is computed per call; nothing is persisted.

No schema, migration, seed row or stored record was touched.

## TRUST CHECK

- **Could this mislead the user?** It makes an existing number *more* accurate. The risk would be crediting a plant the household did not have — prevented structurally: every candidate must equal a canonical key exactly, and colour identity is protected by list and by ordering.
- **Could this fabricate certainty?** No. Peeling only widens which **exact** keys are tried. Four unknown fixtures and four substring traps assert nothing is invented.
- **Is anything guessed but shown as real?** No. Every resolution is an exact index hit, and the faithful key always wins.
- **What happens if the system is wrong?** The failure mode remains under-count — an unresolved line is skipped, which understates variety, the safe direction. The one dangerous failure (a specific food collapsing into a generic one) is exactly what §3 tests.
- **No architectural duplication introduced:** YES — duplication **reduced** by one list.
- **No new source of truth created:** YES — a vocabulary of descriptor words, owning no food and no classification.
- **No runtime behaviour altered:** NO — deliberately altered: more ingredient lines resolve.
- **Every "verified" claim backed by a command that ran:** YES — build, typecheck, 12 suites, a cookbook measurement, a browser session, and a stash-comparison against the tag to prove which failures were mine.

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/NUT_VERIFY2-canonical-resolution-completion-20260718` → `fc9423ff`
- **Files:** the six in §Files Changed, plus this report and one screenshot.
- **Rollback command:** `git reset --hard rollback/NUT_VERIFY2-…-20260718`
- **Preferred:** `git revert <sha>` of this commit alone, leaving concurrent sessions' work untouched.
- ⚠️ Reverting returns the plants figure from **39** to **32** and re-blocks the six descriptor shapes.
- **Verification after rollback:** `npx vite build` 🟢; `npm run test:nut-verify2` fails (the guard outlives nothing); `npm run test:nut-verify1` fails on the six promoted entries — restore them to `BLOCKED_BY_DESCRIPTORS` if reverting permanently.

## SCOPE LOCK

**Implemented:** the descriptor vocabulary; parser prep-note and multiplier handling; free-text descriptor peeling; the identity/free-text boundary; 81 new assertions plus 12 promoted; registration into `npm test`.

**Explicitly excluded — NOT done:**
- Fuzzy matching, substring matching, or any relaxation of exact-key ownership — **forbidden and asserted against**
- Any change to `plantDiversityGroup` or plant-diversity scoring
- Any canonical food identity, seed row, or diversity group
- Compound "A or B" ingredient lines (see R1)
- The display-key rival in `PlantDiversityReport` (NUT_VERIFY1 R2 — still open)
- The two server counters deduping on the slug (NUT_VERIFY1 R5 — still unverified)
- Any client file or UX change

**Suggestions observed outside scope (not implemented):**
- `singularizeIngredientKey("tins")` returns `"tins"` — it addresses only a multi-word key's last word. Callers needing a bare-word singular must handle it themselves, as this change does
- The **Legumes** category checkbox stays unticked though chickpeas and lentils now resolve: the category comes from `getPlantCategory(displayKey)`, still fed the *display* key rather than the canonical slug — the same rival path as NUT_VERIFY1 R2

---

## MANUAL VERIFICATION

**1 — Descriptor lines resolve**
- *Start:* signed in, planner week containing tinned/dried/chopped ingredients; open `/nutrition` → **Foods**
- *Expected:* PLANTS materially higher than before — **39 / 30** for the dev-world household
- *Success:* chickpeas, lentils, tomatoes and oats appear in the Plant Based table

**2 — Identity is not collapsed (the safety check)**
- *Action:* plan a meal with **red cabbage** and another with plain **cabbage**
- *Expected:* they count as **two** distinct plants, not one
- *Success:* same for **black pepper** vs **pepper**

**3 — Unknowns stay unknown**
- *Action:* add an invented ingredient, e.g. `200g dried unicorn flakes`
- *Expected:* **not** counted as a plant, **not** guessed into a category

**4 — Regression guards**
- *Action:* `npm run test:nut-verify2` → **81 passed**; `npm run test:nut-verify1` → **55 passed**; `npm run test:canonical-food` → **46 passed**

## USER ACCEPTANCE EVIDENCE

**Captured.** A real authenticated browser session against the dev-world household:

| Evidence | Value |
|---|---|
| Before NUT_VERIFY1 | 1 / 30 plants · 1 plant ingredient |
| After NUT_VERIFY1 | 32 / 30 · 35 |
| **After NUT_VERIFY2** | **39 / 30 · 43 plant ingredients** |
| Cookbook measurement | 147 real lines: 1 → 31 → **38** distinct plants |

**Not covered:** desktop 1440×900 light mode, one household, the **Foods** tab only. Manual steps 2 and 3 were **not executed through the UI** — both are proven by unit test, not by a household action. The **Nutrients** tab (a different assembler) was not re-verified. Plant **categories** remain 5/9 — unchanged by this work, and explained under Scope Lock.

---

## REMAINING RECOMMENDATIONS

| # | Recommendation | Value | Cost |
|---|---|---|---|
| **R1** | **Compound and alternative lines.** Still unresolved: `600ml semi-skimmed milk or unsweetened oat milk`, `2 eating apples, 1 grated and 1 diced`, `1 tbsp mixed seeds`. These need an "A or B" / multi-food shape, not more descriptors — a genuinely different problem, and the largest remaining share | 🟠 Med-High | M |
| **R2** | **Feed `getPlantCategory` the canonical slug**, not the display key. Chickpeas and lentils resolve as plants yet **Legumes** stays unticked — the category path still uses the display-key rival (NUT_VERIFY1 R2) | 🟠 Med-High | S |
| **R3** | **Audit the two server counters** that SoT Domain 22 names as still deduping on the canonical slug (`household-nutrition-assembler`, `nutrition-centre-assembler`). Carried forward from NUT_VERIFY1 R5, **still unverified** | 🟠 Med | S |
| **R4** | **Resolve the architecture contradiction** on M4 status and Plant Diversity publication (173/173 vs 🔴 52/173). Carried from NUT_VERIFY1 R4, untouched | 🟠 Med | S |
| **R5** | Consider whether `singularizeIngredientKey` should handle bare words, so callers stop compensating individually | 🟡 Low | S |
| **R6** | Plant diversity still reads the **planner**, never the **diary** (LAUNCH1) — a product decision about what the number measures | 🟡 Low-Med | M |

### Suggested follow-on programme

**`NUT_VERIFY3 — Compound Ingredient Resolution`** — R1 and R2 together: the "A or B" line shape, and the last display-key rival. R2 is the cheaper and more visible of the two; R1 is where the remaining unresolved lines actually live.

---

## OUTCOME

**Descriptor-rich ingredient lines now resolve, and exact-key canonical ownership is exactly as strict as it was.**

Nothing was relaxed. There is no fuzzy matching, no substring matching, and no new way for a food to be "close enough" — a claim asserted rather than promised, by fixtures that require `oatscarf`, `garlicky` and `tomatoish` to match nothing at all. What changed is only *which* exact keys get tried, and in what order: the faithful key always first, so `red cabbage` stays `red-cabbage` and `black pepper` stays `black-pepper`.

The most useful thing this programme produced may be the regression it caused. Folding peeling into `ingredientKeyVariants` looked like the tidy change — one function, one candidate list — and it quietly told the seed validator that `smoked-cheese` was `cheese`. **Three suites caught it, a stash-comparison against the tag proved it was mine rather than pre-existing, and the fix is now a documented boundary with its own test.** Free text may peel. Identity may not.

The household-visible result: **1 → 32 → 39 plants**, each step verified in a real browser, and every ingredient still counted only because the canonical index actually holds it.
