# SURF1B — Dietary Restriction Safety Path

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B-dietary-restriction-safety-path-20260714` → `9d14d10d`
**Source investigation:** [`DCA1_USER_VISIBLE_DATA_COVERAGE_AUDIT.md`](../../investigations/platform/DCA1_USER_VISIBLE_DATA_COVERAGE_AUDIT.md) — gap #1, workstream `SURF1` W0.
**Predecessor:** [`SURF1A_EXISTING_DATA_SURFACING.md`](./SURF1A_EXISTING_DATA_SURFACING.md), which deferred this deliberately: *"the most serious finding in DCA1 … it remains open, and it is the thing to do next."*
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 7) → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17) → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` → CPI1 / CPV1.

---

## HEADLINE

**DCA1 found one hardcoded empty array. Tracing the chain found that THA accepts seven
dietary restrictions and enforced two.**

The audit's finding was exact and it was the smaller half:

> `server/storage.ts:2751` hardcodes `dietRestrictions: []` into the AI-facing household
> context. **21 users carry live restrictions the Companion has never once seen.**

That is true, and it is now false. But the empty array was a symptom of something the
audit could not see from the surface. Following the fact from the profile form to the
recommendation output turned up **three more defects, each independently sufficient to
put an allergen on a plate**:

| | Defect | Blast radius |
|---|---|---|
| **D1** | The AI-facing household context hardcoded an empty restriction list | **21 of 21** restricted households — the Companion saw *zero* allergens, platform-wide |
| **D2** | `users.diet_restrictions` — the profile, and the authoritative owner — was **never read by any safety path**. Every consumer read the `household_eaters` mirror instead, which stores `[]` for adults *by design* | **10 of 21** restricted households: their declared allergens existed in the database and reached nothing |
| **D3** | THA accepts **7** declarable restrictions and routed them to an engine implementing **2** | `Nuts`, `Eggs`, `Shellfish`, `Soy`, `Sesame` were **accepted by the profile form and enforced by nothing** |
| **D4** | `users.diet_pattern` is stored lower-case for 6 users; `shouldExcludeRecipe` exact-matches `"Vegan"` and falls through to `default: return false` | **4 households** who declared themselves vegan or vegetarian received **no hard exclusion at all** and could be recommended beef |

D3 is the one that matters most, and it is the one no audit of *coverage* could have found.
It is not a missing row. **The knowledge to enforce all seven restrictions already existed,
fully built, and was wired to the wrong input.**

---

## ROOT CAUSE

THA has **two** dietary engines, and they are both correct. That is not the bug.

| Engine | Implements | Reached by |
|---|---|---|
| `shared/dietRules.ts` | diet **patterns** (Vegan, Keto, Paleo…) + `Gluten-Free`, `Dairy-Free` | `users.diet_pattern` + `users.diet_restrictions` |
| `shared/restrictions/` — the canonical restriction library | **all 10 allergens**: gluten, dairy, peanut, tree_nut, sesame, soy, mustard, shellfish, eggs, coconut — with aliases, *derived* ingredients (tahini→sesame, ghee→dairy), *hidden* ingredients (soy sauce→gluten), and excluded compounds (oat milk ≠ dairy) | `household_eaters.hard_restrictions` **only** |

**Each engine was fed from a different store, and the two stores hold the same fact.**

The profile writes `users.diet_restrictions`. The eater model holds
`household_eaters.hard_restrictions`. Adult eater rows store `[]` — the profile is
authoritative, and `GET /api/household/eaters` enriches them from it *at read time,
without persisting*. So:

- The **restriction library**, which implements all seven, was fed the mirror — empty for
  every adult whose row had never been hand-populated (10 of 21).
- **dietRules**, which implements two of seven, was fed the profile — the real data.

The result is the exact shape of the defect: **the engine with the data couldn't enforce,
and the engine that could enforce had no data.** A household could declare a sesame
allergy, see it saved, see it rendered back on their profile — and have it reach no gate
in the platform.

And one call before the Companion read it, `storage.getHouseholdDietaryContext()` — which
assembled the AI context from `user_preferences`, a table with **no restrictions column at
all** — filled the field with `[]` rather than joining the table that had it.

### The cruellest detail

INT17's Context Composition Engine **pins** `aggregated.unionRestrictions` precisely so a
token budget can never outbid a household's allergens. `context-view.ts` argues the case
at length:

> *"A household hard restriction that a token budget can outbid is a restriction the
> Companion cannot honour; the pins end that."*

The pins worked perfectly. They were faithfully delivering an empty array, every turn, to
every household, for the entire life of the feature. **The safety architecture was sound;
it was guarding a value that had already been thrown away upstream.**

---

## WHAT WAS BUILT

One new module. It owns **resolution**, and deliberately owns nothing else.

### `server/lib/household-dietary-safety.ts` — the canonical household safety resolver

It answers exactly one question: *what may this household not eat, and who says so?*

It is **not a rules engine.** It defines no keyword, no allergen, and no food. Every act of
*matching* is delegated to the two engines that already existed:

- household hard restrictions → `candidateHardExcluded()` → **the canonical restriction library**
- the requester's diet pattern → **`dietRules.shouldExcludeRecipe()`**

A test asserts this and fails if the resolver ever grows a food keyword of its own
(§ *Tests*, layer 6). The brief forbade a second household dietary rules engine; the
resolver is the enforcement of that rule, not an exception to it.

**It reads every canonical owner, and re-derives nothing:**

| Fact | Owner | Class |
|---|---|---|
| `users.diet_restrictions` | the profile — **authoritative for adults** | **HARD** |
| `household_eaters.hard_restrictions` | the eater row — **authoritative for children with no account** | **HARD** |
| `users.diet_pattern` | the profile | **HARD, per member** |
| `user_preferences.diet_types` | preferences | *soft* |
| `user_preferences.excluded_ingredients` | preferences | *soft* |
| `household_eaters.default_diet_types` | preferences | *soft* |

Adult eater rows are still unioned in, so the 9 households whose mirror *is* populated lose
nothing. The profile stays authoritative; the mirror may only ever **add**.

---

## SAFETY RULES ENFORCED

### 1. Hard restrictions union across the **whole** household

An allergen belonging to **any** member — including a child with no account, whose eater
row is their canonical owner — binds **every** meal the household is offered. A parent with
no restrictions of their own is no longer recommended satay because their partner's nut
allergy lived in a table nobody read.

### 2. Diet patterns stay **per member** — and this is a deliberate boundary, not an oversight

A vegan and an omnivore sharing a kitchen do not make every meal vegan. Unioning patterns
would change recommendation ranking far beyond what safety requires, which the brief
forbids. So the requester's pattern gates *their* recommendations, while **every** member's
pattern is now carried into the AI context (`members[].dietPattern`, newly added to INT17's
`keep` allowlist) so the Companion can reason about the whole household.

A member who means *"no meat, ever, in this house"* declares it as a **restriction** — which
is exactly what the live data shows real households doing (users 181–184 declared
`{meat, fish, dairy, eggs, honey}`), and restrictions **do** union.

### 3. A preference never becomes a gate, and a restriction never decays into one

`excluded_ingredients` ("we don't love olives") cannot make a meal *unsafe*. A declared
allergen cannot be downgraded to a hint. The two travel in separate fields all the way to
the model, which sees `unionRestrictions` (hard) and `unionExclusions` (soft) as distinct
facts — and the AI prompt blocks already distinguish them: *"HOUSEHOLD HARD RESTRICTIONS —
these must never be violated"* versus *"Household preference — try to avoid"*.

The planner continues to treat `excluded_ingredients` as hard. That is conservative, it
predates this work, and it is **preserved deliberately**: SURF1B changes no filter in the
permissive direction.

### 4. Fail closed — everywhere, without exception

**This is the rule the old code inverted.** Six call sites caught a resolution failure, logged
a warning, and carried on with an empty restriction list — serving a household whose
allergens THA could not read as though it had none.

> "We know of no restrictions" and "we could not find out" are different facts, and
> collapsing them is precisely how an allergen reaches a plate.

The resolver now returns `status: "unavailable"` — never an empty list — and:

| Path | Behaviour when safety context is unresolvable |
|---|---|
| `isMealSafeForHousehold()` | **rejects every meal** (`reason: "safety-context-unavailable"`) |
| `isSafetyGateActive()` | returns **`true`** — the gate must run, and refuse; it may not short-circuit into "everything is compliant" |
| `requireHardRestrictions()` | **throws** — a prompt builder cannot silently omit the restriction block |
| `storage.getHouseholdDietaryContext()` | **throws** |
| `POST /api/suggest-from-ingredients` | **503**, no suggestions |
| `POST /api/generate-recipe-from-suggestion` | **503**, no recipe |
| `POST /api/uplift/batch` | **503**, suggestions suppressed |
| Smart Suggest plan generation | **503**, no plan |
| System planner writes (`planner-compliance`) | **place nothing** |

An empty restriction array from a **resolved** context still means "this household declared
none" — a fact, and it is served as one.

### 5. Diet patterns are case-normalised at the engine's own door

`canonicaliseDietPattern()` was added to `shared/dietRules.ts` — the owner of diet patterns —
and applied inside `shouldExcludeRecipe()` and `scoreRecipeForDiet()`. Fixing it there fixes
**every** caller at once (recipe search, Smart Suggest, the planner gate, the Companion, and
the client) rather than asking each to remember. An unrecognised pattern is passed through
unchanged, so the `default` branch still governs genuinely unknown values.

---

## PATHS CORRECTED

Every chain DCA1 named, end to end:

```
Household Profile → Member Requirements → Household Resolution → Runtime Context → Intelligence/AI → Recommendation
     users.            household_          household-dietary-      HouseholdDietary   INT17 pins      planner gate
  diet_restrictions      eaters              safety.ts (NEW)         Context         (already ok)    smart suggest
       ▲ was never read      ▲ was the only thing read      ▲ was `[]`                                    ▲ requester-only
```

| # | File | Change |
|---|---|---|
| — | `server/lib/household-dietary-safety.ts` | **New.** The canonical household safety resolver + the one meal safety gate. Owns resolution; delegates every match. |
| D1 | `server/storage.ts` | `getHouseholdDietaryContext()` delegates wholly to the resolver. **The hardcoded empty array is gone.** Now carries each member's `dietPattern`, and children (`userId: null`) as full members of the safety union. Throws when unresolved. |
| D2 | `server/routes.ts` | `collectHouseholdHardRestrictions()` delegates to the resolver — it now reads the **profile**, not just the mirror. Its three AI callers (`suggest-from-ingredients`, `generate-recipe-from-suggestion`, `uplift/batch`) **fail closed**. |
| D2 | `server/routes.ts` | Smart Suggest generation resolves household-wide hard restrictions through the resolver and **fails closed**; its eater-enrichment `catch` now degrades *scoring only*, never safety. |
| D3 | `server/lib/planner-compliance.ts` | No longer resolves diet itself. `dietRestrictions` is now the **household-wide** union — so another member's allergen gates the system planner. New `safetyUnavailable` flag makes the gate reject every meal when safety is unknown. |
| D4 | `shared/dietRules.ts` | `DIET_PATTERNS` + `canonicaliseDietPattern()`; applied at both engine entry points. |
| — | `server/intelligence/context/context-view.ts` | `dietPattern` added to the `household:read` members `keep` allowlist — a field not in `keep` is dropped before the model reads it. |

**No seed, no migration, and no database row was written.** Every fact SURF1B put in front of
the Companion was already true and already stored. It was being dropped in transit.

---

## TESTS AND NEGATIVE CONTROLS

### `npm run test:surf1b-dietary-restriction-safety-path` — **53 passed, 0 failed**

Registered in `npm test`. Seven layers, one per place a defect lived.

**Layer 1 — NEGATIVE CONTROL: what the old path could not see.** These assertions pin the
**defect**, not the fix, and they must keep passing forever — they state what `dietRules`
does and does not implement, and they will fail the day someone quietly grows a second
allergen engine inside it:

```
✓ dietRules alone does NOT reject a peanut dish for a "Nuts" restriction
✓ dietRules alone does NOT reject prawns for a "Shellfish" restriction
✓ dietRules alone does NOT reject tahini for a "Sesame" restriction
✓ dietRules alone does NOT reject eggs for an "Eggs" restriction
✓ dietRules alone does NOT reject tofu for a "Soy" restriction
✓ dietRules DOES reject gluten for "Gluten-Free"   (2 of 7 implemented)
✓ dietRules DOES reject dairy  for "Dairy-Free"    (2 of 7 implemented)
```

**Layer 2 — ENFORCEMENT.** All seven declarable restrictions now reject a meal containing
them. **Five of these seven fail at `9d14d10d`.** Plus the library's real depth — `soy sauce`
rejected for Gluten-Free (hidden wheat), `tahini` for Sesame (derived), `ghee` for Dairy-Free
(derived), `pine nuts` for Nuts (legacy expansion → peanut + tree_nut) — and proof it does not
over-reject: **oat milk is not dairy**, and a safe meal still reaches a household with three
allergies.

**Layer 3 — MULTI-MEMBER HOUSEHOLDS.**
- a partner's nut allergy rejects the requester's satay *when the requester declared nothing*
- a **child with no account** — eater row as owner — rejects a tahini meal
- **conflicting requirements stack, they do not cancel**: with one gluten-free and one
  shellfish-allergic member, prawn linguine is rejected by both, a prawn salad by one, a pasta
  primavera by the other — and a grilled chicken salad, safe for both, is still served
- a lower-case `"vegan"` pattern rejects beef, and a lower-case `"vegetarian"` rejects chicken

**Layer 4 — HARD vs PREFERENCE.** A soft `excludedIngredient` ("olives") does not make a meal
unsafe; a hard restriction is never filed as a preference; `"Nuts"` resolves through the
canonical library to `peanut` + `tree_nut`, both at the `major_allergen` tier.

**Layer 5 — FAIL-SAFE.** An `unavailable` context refuses every meal, says why, keeps the gate
*active*, and makes `requireHardRestrictions()` **throw**. An empty list from a *resolved*
context is still served as the fact it is.

**Layer 6 — ONE ENGINE.** The resolver's source is scanned (comments stripped — a check that
cannot tell prose from a keyword list is not a check) and **must contain no food keyword of its
own**. It fails if the resolver ever becomes the second rules engine the brief forbids.

**Layer 7 — LIVE, against the real database.**
```
… 21 users carry a live restriction
✓ every restricted user's safety context RESOLVES                      (21/21)
✓ every restricted user's context carries their restrictions           (21/21) — was 0/21
✓ the AI-facing household context carries restrictions for all 21 — the DCA1 defect, closed
✓ an unrestricted household RESOLVES — "none declared" is a fact, not a failure
```

### The negative control, run

The suite was run against the code as it stands at `9d14d10d`, asking the AI-facing context
the one question DCA1 asked. **It detects the original defect rather than merely describing
the fix:**

```
[at 9d14d10d]  AI-facing household context carries restrictions for  0/21 households  → FAIL
[at SURF1B]    AI-facing household context carries restrictions for 21/21 households  → PASS
```

### The check THA already had, which this workstream flipped

CPV1's `hh-dropped-restrictions` exists precisely to catch this. **It is an instrument SURF1B
did not write and did not modify** — and the temptation it presented was real: the check greps
`server/storage.ts` for the literal `dietRestrictions: []`, so a *code comment* quoting the old
defect would have tripped it. The comments were reworded. **The check was not.**

```
BEFORE  🔴 Household Dietary Preference
        ✗ [FAIL] Dietary restrictions reach the AI-facing household context
            storage.ts hardcodes dietRestrictions: [] in the household dietary context —
            every allergen and restriction is dropped before the AI reads it.
            21 user(s) carry live restrictions the Companion never sees.

AFTER   (the check is absent from the output — it passes)
```

Suite-wide: **23 → 24 passed, 13 → 12 failed.** Exactly one check moved. No check was added,
weakened, or reworded to achieve it.

### Regression

| Gate | Result |
|---|---|
| `test:planner-compliance` | 25 passed, 0 failed |
| `test:smart-suggest-diet-pattern` | 26 passed, 0 failed |
| `test:smart-suggest-restrictions` | 30 passed, 0 failed |
| `test:smart-suggest-tailoring` | 14 passed, 0 failed |
| `test:intelligence-household-binding` | 51 passed, 0 failed |
| `test:intelligence-profile-binding` | 50 passed, 0 failed |
| `test:intelligence-context-composition` | 166 passed, 0 failed |
| `test:intelligence-platform` | 33 passed, 0 failed |
| `test:plan1-planner-intelligence` | 58 passed, 0 failed |
| `test:nutrition-enrichment` | 22 passed, 0 failed |
| `test:surf1a-existing-data-surfacing` | 31 passed, 0 failed |
| `test-keto-low-carb-dictionary` | 80 passed, 0 failed |
| `test-plant-milk-vegan` | 27 passed, 0 failed |
| `test-household-vegan-vegetarian-hard-enforcement` | **31 passed, 0 failed** — *was 29 passed, 2 failed at `9d14d10d`* |
| `npm run typecheck` | **304 errors — identical to baseline. 0 new.** |

**The vegan-enforcement suite was failing before this work began, and is worth naming.**
SURF1B fixed one of its two failures outright (an adult vegan member's pattern now enforces).
The other was a **defect in the test**: it ran a bare `/milk|cream|butter/` over the served
meals, and was failing on a vegan Thai pumpkin soup whose only crime was containing **coconut
milk**. The pool filter had been right all along. The assertion now strips plant forms before
checking — and was made *stricter* in the same edit (it now also catches cheese, tuna, prawn,
ghee, lard, gelatin). *A false alarm in a safety suite is worse than no alarm: it teaches the
reader to discount the one red line they most need to trust.*

---

## REMAINING LIMITATIONS

Stated plainly, because a safety document that overclaims is worse than one that does not exist.

1. **`meat`, `fish` and `honey` have no canonical restriction definition.** Four households
   (users 181–184) declared them. They are protected — their `diet_pattern` is vegan or
   vegetarian, which `dietRules` enforces fully now that casing is fixed, and their `dairy`
   and `eggs` restrictions resolve through the library. But a household declaring bare
   `"meat"` with **no** pattern is enforced only by the conservative substring fallback, which
   catches `"meatball"` and not `"beef"`. **Closing this means authoring new dietary knowledge,
   which this workstream was explicitly forbidden to do.** A test pins the gap
   (`KNOWN GAP: "meat" resolves to NO canonical restriction definition`) so it cannot be
   quietly forgotten. **It is the first thing to do next.**

2. **The three-owner diet contest survives — but the safety path no longer depends on it.**
   CPV1 still reports `hh-sync-bridge` and `hh-contested-owner` as failures: `routes.ts:697`
   carries the platform's only self-confessed permanent synchronisation bridge
   (`users.diet_pattern → user_preferences.diet_types`), which `ARCHITECTURE_PRINCIPLES.md`
   Principle 7 forbids. **Both concern diet *preferences* (`diet_types`), not restrictions.**
   Restrictions now have exactly one owner chain, read in one place. Collapsing the preference
   owners is a data-ownership migration with different risk, and bundling it into a safety fix
   is the mistake DCA1 W0 explicitly warned against.

3. **Diet patterns are not unioned household-wide.** § *Safety rule 2* argues why. The
   consequence is honest and worth stating: a vegan member who declares *only* a pattern, and
   no restrictions, does not stop an omnivore requester being recommended beef **for
   themselves**. Every member's pattern is now visible to the Companion, so it can raise this;
   the deterministic gate does not.

4. **CPV1 `hh-unprojected` remains a warning** — 5 of 94 users' diet pattern has no eater-model
   projection. This is now **cosmetic to safety**: SURF1B reads the profile directly and no
   longer depends on the projection being present. It was that dependency that caused D2.

5. **The `household_eaters` adult mirror still exists.** SURF1B unions it rather than deleting
   it, so nothing regresses for the 9 households whose rows are populated. It is now redundant
   for adults. Retiring it is a follow-up (Principle 8, retire-on-introduction).

---

## GOVERNANCE

- **Architecture Bootstrap** — `docs/architecture/README.md` and the documents above were read
  before implementation.
- **Principle 2 (one owner per fact)** — no fact was copied, cached, or re-derived. Restrictions
  are read from their owners in exactly one place. The resolver owns *resolution*; it owns no
  rule and no food.
- **No second rules engine** — enforced by test, not by discipline. The resolver's source is
  scanned for food keywords and the suite fails if one appears.
- **Rule KC6 / progressive enrichment** — an unrestricted household resolves cleanly and pays no
  per-meal cost; the gate short-circuits as inactive.
- **Fail-safe** — the resolver cannot express "no restrictions" and "could not resolve" as the
  same value. That collapse was the defect class, and the type system now forbids it.
- **No permissive change** — every filter SURF1B touched moved in the restrictive direction or
  not at all.

**The working tree was already dirty on arrival** (uncommitted work by other sessions:
`HouseholdNutritionPanel.tsx`, `household-nutrition-assembler.ts`, `notice-gateway.ts`,
`plant-classifier.ts`, and others). SURF1B **did not touch, commit, or revert any of it**, and
the milestone commit contains only the files listed under *Paths Corrected* plus its tests,
this document, and the `package.json` test registration.

---

## ROLLBACK

```
git reset --hard rollback/SURF1B-dietary-restriction-safety-path-20260714   # → 9d14d10d
```

The tag anchors committed state only. Nothing in the database was written, so rollback is
complete and requires no data migration: SURF1B changed **which stores are read**, never what
any store contains.

---

*Implementation. 2026-07-14. Restores the safety path; creates no dietary knowledge.*
