# SURF1B2 — Canonical Dietary Restriction Knowledge Completion

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B2-dietary-restriction-knowledge-completion-20260714` → `9f57680c`
**Predecessor:** [`SURF1B_DIETARY_RESTRICTION_SAFETY_PATH.md`](./SURF1B_DIETARY_RESTRICTION_SAFETY_PATH.md) — *Remaining limitations*, item 1, which closed with: *"**It is the first thing to do next.**"*
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 7, 8) → `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`.

---

## HEADLINE

**SURF1B restored the path. It was carrying three facts the library could not read.**

SURF1B made every declared restriction reach a gate, and closed by naming what it could
not fix: `meat`, `fish` and `honey` resolved to **no canonical restriction definition**.
Four live households declared them. The conservative substring fallback caught
`"meatball"` and not `"beef"`.

Auditing every hard-restriction value THA accepts, at every door, against the canonical
library found the gap was exactly the three SURF1B named — and one more thing nobody had
asked:

> **Five of the six doors that write a hard restriction never validated their input.**

`PUT /api/profile` checked against a hand-written array of seven strings. The other five —
onboarding, eater create, eater edit, and two guest-eater paths — took `z.array(z.string())`.
Free text. That is how `meat`, `fish` and `honey` came to live in the database with nothing
behind them: **not because someone chose to accept them, but because nobody ever asked whether
THA could enforce what it was being handed.**

So this workstream did two things, and the second is the one that makes the first stay true:

1. **Authored the missing knowledge** — `meat`, `fish` and `honey` as governed canonical
   restriction definitions, with aliases, derived and hidden ingredients, and negative controls.
2. **Made "accepted" and "enforceable" the same set, structurally.** A restriction is now
   accepted *if and only if* the canonical library can resolve it. The two cannot drift apart
   again, because the door asks the library.

---

## THE ACCEPTED RESTRICTION COVERAGE MATRIX

Every value THA accepts as a hard restriction, at every door, audited against the library.
`✓` = resolves to an enforceable canonical definition.

| Value | Accepted at | Resolves to | Via | Before | After |
|---|---|---|---|---|---|
| `Gluten-Free` | profile chips · server enum · **live** | `gluten` | alias | ✓ | ✓ |
| `Dairy-Free` | profile chips · server enum · **live** | `dairy` | alias | ✓ | ✓ |
| `Nuts` | profile chips · server enum · **live** | `peanut` + `tree_nut` | legacy expansion | ✓ | ✓ |
| `Eggs` / `eggs` | profile · onboarding · **live** | `eggs` | alias | ✓ | ✓ |
| `Shellfish` / `shellfish` | profile · onboarding | `shellfish` | alias | ✓ | ✓ |
| `Soy` / `soy` | profile · onboarding · **live** | `soy` | alias | ✓ | ✓ |
| `Sesame` / `sesame` | profile · onboarding · **live** | `sesame` | alias | ✓ | ✓ |
| `nuts` | onboarding chips | `peanut` + `tree_nut` | legacy expansion | ✓ | ✓ |
| `dairy` | onboarding · **live** | `dairy` | alias | ✓ | ✓ |
| `gluten` | onboarding · **live (eaters)** | `gluten` | alias | ✓ | ✓ |
| `tree nuts` | dev-world · **live (eaters)** | `tree_nut` | alias | ✓ | ✓ |
| **`meat`** | seeds · dev-world · **live (both columns)** | **`meat`** | alias | ✗ **nothing** | ✓ |
| **`fish`** | seeds · dev-world · **live (both columns)** | **`fish`** | alias | ✗ **nothing** | ✓ |
| **`honey`** | seeds · dev-world · **live (both columns)** | **`honey`** | alias | ✗ **nothing** | ✓ |
| `other` + free text | onboarding "Other" | — | — | ✗ **accepted, unenforceable** | **rejected at the door** |

`mustard` and `coconut` are defined in the library and offered by no door — enforceable if
declared, which the eater API now permits and validates.

**The doors, and what each one checked:**

| Door | File | Before | After |
|---|---|---|---|
| `PUT /api/profile` | `routes.ts:594` | enum of 7 literals | enum of 7 — **every one now proven enforceable by test** |
| `POST /api/user/complete-onboarding` | `routes.ts:5066` | `z.array(z.string())` | **library-validated** |
| `POST /api/household/eaters` | `routes.ts:8979` | `z.array(z.string())` | **library-validated** |
| `PATCH /api/household/eaters/:id` | `routes.ts:9005` | `z.array(z.string())` | **library-validated** |
| planner guest eaters | `routes.ts:6026` | `z.array(z.string())` | **library-validated** |
| entry guest eaters | `routes.ts:9133` | `z.array(z.string())` | **library-validated** |

---

## CANONICAL DEFINITIONS ADDED

`shared/restrictions/restriction-library.ts` — `RESTRICTION_LIBRARY_VERSION` `3.0.0` → **`4.0.0`**.
Ten definitions become thirteen. **The library remains the single owner; no keyword list was
created anywhere else.**

### `fish` — major allergen

A UK/EU statutory major allergen, and the library's own header had listed it as a Phase 4
candidate since Phase 3 shipped.

**The valuable half of this entry is `hiddenIngredients`.** Anchovy is why Worcestershire
sauce, Caesar dressing, puttanesca and kedgeree are unsafe, and **not one of them says
"fish" anywhere in its name.** No substring fallback could ever have caught them.

**Boundary — fish is not shellfish.** They are separate allergens in law and in medicine, and
`shellfish` already owns crustaceans and molluscs. A fish restriction does not exclude prawns;
a shellfish restriction does not exclude salmon. Both directions are asserted.

> `"shellfish"` is deliberately **not** an `excludedCompound` of `fish`, even though it contains
> the letters. An `excludedCompound` is an *unconditional early exit* — listing it would make
> `"shellfish and cod chowder"` miss the cod. The whole-word alias match already prevents the
> false positive, and the guard would have introduced a fail-**open** path to fix a problem
> that did not exist.

### `meat` — additional restriction

Not an allergen: an ethical, religious or dietary restriction. **The tier describes what the
restriction *is*, not how strictly it binds** — it is enforced exactly as hard as an allergen.

**Boundary — `meat` is the flesh of land animals, and does not include fish or shellfish.**
THA's own data settles this: households 181–184 declare `{meat, fish, dairy, eggs, honey}` —
they *enumerate* meat and fish separately. Folding fish into meat would also silently break
pescatarians, a diet THA offers. A household that eats neither declares both, and both now
resolve.

### `honey` — additional restriction

An ethical restriction (honey is an animal product, excluded by veganism) and, separately, an
infant safety rule — honey must not be given to children under 12 months. Its
`hiddenIngredients` carry baklava, nougat and halva: traditionally honey-sweetened and rarely
labelled as such.

### The authoring rule this workstream had to discover first

The resolver matches each field **differently**, and the library had never written this down.
Getting it wrong ships a false positive:

| Field | Match | Consequence |
|---|---|---|
| `aliases` | **whole-word** | Safe for short words. `"ham"` here cannot match `"chamomile"`; `"lamb"` cannot match `"lambrusco"`. Also resolves a *declared* restriction string, so every entry must be a name a household could plausibly declare. |
| `derivedIngredients` · `hiddenIngredients` | **substring** | Handles plurals free (`"sausage"` catches `"sausages"`) — but `"ham"` here **would** match `"chamomile"`. Distinctive words and phrases only. |
| `excludedCompounds` | **substring, unconditional early exit** | Add one **only** where a match would otherwise wrongly occur. Every unnecessary entry is a **fail-open path**. |

That table is now the authoring contract at the head of the library. It is the reason
`"honeydew"` is **not** an `excludedCompound` of `honey`: the whole-word match already cannot
reach it, so the guard would buy nothing and cost a fail-open.

---

## ENFORCEMENT EXAMPLES

Live, through `isMealSafeForHousehold()` — the single meal safety gate SURF1B built. No new gate.

```
household declares ["meat"]                         (no diet pattern at all)
  ✗ Beef Bourguignon        — beef shin            alias:beef
  ✗ Honey-Glazed Ham        — gammon joint         alias:gammon
  ✗ Prosciutto & Melon      — prosciutto           derived:prosciutto     ← dietRules cannot catch this
  ✗ Chicken Stock Risotto   — chicken stock        derived:chicken
  ✗ Panna Cotta             — gelatine             derived:gelatine
  ✓ Lentil & Squash Curry   — served

household declares ["fish"]
  ✗ Spaghetti Puttanesca    — anchovies            derived:anchovy
  ✗ Caesar Salad            — caesar dressing      HIDDEN:caesar dressing ← the anchovy is in the dressing
  ✗ Beef in Worcestershire  — worcestershire sauce HIDDEN:worcestershire sauce
  ✗ Kedgeree                — (name alone)         HIDDEN:kedgeree
  ✓ King Prawn Linguine     — served   (shellfish is a SEPARATE allergen)

household declares ["honey"]
  ✗ Manuka Honey Granola    — manuka honey         alias:honey
  ✗ Baklava                 — (name alone)         HIDDEN:baklava
  ✓ Honeydew & Mint Salad   — served

households 181–184, ["meat","fish","dairy","eggs","honey"]
  ✗ Honey-Glazed Ham   ✗ Salmon Niçoise   ✗ Chicken Caesar
  ✓ Chickpea & Spinach Stew — served
```

**Five of the seven `meat` rejections above fail at `9f57680c`.** `Beef Bourguignon` was served
to a household that had declared they do not eat meat.

---

## NEGATIVE CONTROLS

**This is the larger half of the work, and the unglamorous one.** A restriction that excludes
kidney beans from a vegan is not cautious; it is a broken platform. Every one of these
**must not** match, and each is a live assertion:

| Restriction | Must NOT exclude | Why |
|---|---|---|
| `meat` | **kidney beans** | a vegan staple — shares the word with offal |
| `meat` | **beef tomatoes** | a tomato variety |
| `meat` | **lamb's lettuce** | a salad leaf |
| `meat` | **goat's cheese**, goats milk | dairy, not meat |
| `meat` | **duck egg**, quail eggs | an egg, not meat |
| `meat` | **mince pies**, mincemeat | fruit — no meat |
| `meat` | **chicken of the woods** | a mushroom |
| `meat` | **coconut meat** | the flesh of a coconut |
| `meat` | **vegetable suet**, vegetarian rennet | not animal-derived |
| `meat` | **cauliflower steak**, mushroom steak | a vegetable |
| `meat` | **hamburger bun** | the bun is bread; it carries no meat |
| `meat` | chamomile tea · lambrusco · gooseberries | contain the *letters* of ham / lamb / goose |
| `meat` | **vegan sausage · quorn mince · beyond burger · jackfruit · meat-free sausages** | *the entire purpose of the product is that it is not meat* |
| `fish` | **prawns · crab · mussels · scallops · squid** | shellfish — a separate allergen |
| `fish` | vegan fish fingers · fish-free batter | it says so on the packet |
| `fish` | peeled potatoes | contains the letters of "eel" |
| `shellfish` | **salmon · cod · tuna** | fish — a separate allergen (the converse) |
| `honey` | **honeydew melon** · honeysuckle | a melon; a flower |
| `honey` | meadow herbs | contains the letters of "mead" |
| `honey` | **maple syrup** | *the substitute must not be excluded too* |

And the whole-household proof: a `{meat, fish, honey}` household is still **served** a Kidney
Bean Chilli, a Goat's Cheese & Beetroot Salad, a Vegan Sausage Casserole, and a Honeydew &
Mint Salad.

---

## ONE OWNER — the divergence this workstream refused to create

`shared/dietRules.ts` has held `MEAT_KEYWORDS` and `FISH_SEAFOOD_KEYWORDS` since the Vegan and
Vegetarian patterns were written. **THA already knew what meat was.** The canonical restriction
library — the governed owner of restriction knowledge — did not.

That is the same shape as SURF1B's root cause, one level down: *the engine with the knowledge
was not the engine being asked the question.*

Authoring `meat` in the library therefore risked creating a **second owner of one fact**, which
`ARCHITECTURE_PRINCIPLES.md` Principle 2 forbids and which is precisely the divergence that let
SURF1B's defects survive. Two options existed:

- **Merge** — have `dietRules` delegate meat/fish matching to the library. Correct, and it would
  fix real holes (below). But it changes the Vegan/Vegetarian gate **for every household**, which
  is *"change recommendation ranking beyond required safety exclusion"* — forbidden by this brief.
- **Pin** — keep both, and make divergence *impossible to introduce silently*.

**Pinned.** `MEAT_KEYWORDS` and `FISH_SEAFOOD_KEYWORDS` are now exported for exactly one consumer —
a governance test asserting the canonical library is a strict **superset** of both:

```
✓ the canonical "meat" definition is a SUPERSET of dietRules MEAT_KEYWORDS      (29 terms)
✓ "fish" ∪ "shellfish" is a SUPERSET of dietRules FISH_SEAFOOD_KEYWORDS         (40 terms)
```

(The fish check is against the **union**, because `dietRules` mixes fish and shellfish into one
list while the library keeps them as the two separate allergens they are in law.)

**And the pin records why merging is still worth doing.** The library knows meats `dietRules`
does not — `prosciutto`, `pancetta`, `gammon`, `mutton`, `gelatine`, `bone broth`, `foie gras`.
Which means, today, at `HEAD`:

> **A household whose diet pattern is `Vegan` can still be recommended a prosciutto dish.**
> Their *pattern* is enforced by `dietRules`, whose meat list has holes. Their *restriction*,
> if they declare `meat`, is now enforced by the library, which does not.

That is a real, live gap in the **pattern** path. It is named here, asserted by test, and
**deliberately not fixed** — fixing it is a change to the recommendation behaviour of every
vegan and vegetarian household, and it belongs to its own workstream with its own regression
budget. It is the first thing to do next.

---

## LIVE-DATA VERIFICATION

`npm run test:surf1b2-dietary-restriction-knowledge` — **167 passed, 0 failed.** Registered in `npm test`.

Against the real database, through the real code path:

```
… users.diet_restrictions holds 11 distinct values:
     Soy, Dairy-Free, Gluten-Free, fish, eggs, meat, Nuts, honey, Eggs, dairy, Sesame
… household_eaters.hard_restrictions holds 9 distinct values:
     tree nuts, fish, eggs, meat, gluten, honey, dairy, soy, sesame

✓ EVERY distinct restriction in live users.diet_restrictions resolves            (11/11)
✓ EVERY distinct restriction in live household_eaters.hard_restrictions resolves  (9/9)

… 4 live user(s) declare meat / fish / honey
✓ every meat/fish/honey household's safety context RESOLVES                       (4/4)
✓ every meat/fish/honey household's declaration now appears as a
  CANONICAL active restriction                                          (4/4) — was 0/4
✓ every meat/fish/honey household REFUSES a beef lasagne                (4/4) — the SURF1B gap, closed
✓ every value ALREADY IN PRODUCTION passes the new write-door check
       — no live row becomes unwritable
```

**The last line is load-bearing.** Closing the write doors is worthless if it locks out data the
platform already holds. It does not: every one of the 20 distinct values in production resolves.

### The negative control, and SURF1B's pin firing

SURF1B pinned its own gap so it could not be forgotten:

```
✗ FAIL: KNOWN GAP: "meat" resolves to NO canonical restriction definition
```

**That assertion failed the moment SURF1B2 landed — which is exactly what a pin is for.** It has
been *inverted*, not deleted: it now asserts the definitions exist, so nobody can remove them
without the SURF1B suite saying so. The suite goes 52 passed / 1 failed → **54 passed, 0 failed**.

### Regression

| Gate | Result |
|---|---|
| `test:surf1b-dietary-restriction-safety-path` | **54 passed, 0 failed** — *was 52 passed, 1 failed (the pin)* |
| `test:surf1a-existing-data-surfacing` | 31 passed, 0 failed |
| `test:planner-compliance` | 25 passed, 0 failed |
| `test:smart-suggest-diet-pattern` | 26 passed, 0 failed |
| `test:smart-suggest-restrictions` | 30 passed, 0 failed |
| `test:smart-suggest-tailoring` | 14 passed, 0 failed |
| `test:smart-suggest-product-filter` | 21 passed, 0 failed |
| `test:smart-suggest-premium-filter` | 17 passed, 0 failed |
| `test:household-eater` | 13 passed, 0 failed |
| `test:intelligence-household-binding` | 51 passed, 0 failed |
| `test:intelligence-profile-binding` | 50 passed, 0 failed |
| `test:intelligence-context-composition` | 166 passed, 0 failed |
| `test:intelligence-platform` | 33 passed, 0 failed |
| `test:plan1-planner-intelligence` | 58 passed, 0 failed |
| `test:nutrition-enrichment` | 22 passed, 0 failed |
| `test-household-vegan-vegetarian-hard-enforcement` | 31 passed, 0 failed |
| `test-keto-low-carb-dictionary` | 80 passed, 0 failed |
| `test-plant-milk-vegan` | 27 passed, 0 failed |
| `npm run verify:publication` | **24 passed, 12 failed — identical to SURF1B. No check moved.** |
| `npm run typecheck` | **304 errors — identical to baseline. 0 new.** |

---

## REMAINING LIMITATIONS

Stated plainly, because a safety document that overclaims is worse than one that does not exist.

1. **A `Vegan` or `Vegetarian` *pattern* can still be recommended prosciutto.** The pattern path
   (`dietRules.MEAT_KEYWORDS`) has holes the restriction path no longer has — no `prosciutto`,
   `pancetta`, `gammon`, `mutton`, `gelatine`, `bone broth` or `foie gras`. **This is a live
   defect and it predates SURF1B2**, which neither introduced nor widened it. It is pinned by the
   superset test and left unfixed *because closing it changes the recommendation behaviour of
   every vegan and vegetarian household* — beyond this brief. **It is the first thing to do next.**

2. **Onboarding files declared allergies as SOFT preferences.** `onboarding-page.tsx:316` writes the
   "Allergies or intolerances" chips to `user_preferences.excluded_ingredients` — never to
   `users.diet_restrictions`. A household that declares a nut allergy during onboarding has it
   stored as *"try to avoid"*, not *"must never be violated"*, and it does not enter the hard
   restriction union. **This is a routing defect, not a knowledge one** — SURF1B's domain, found
   here, and out of scope by the same argument SURF1B used to defer the preference-owner migration.
   It is mitigated (the planner treats `excluded_ingredients` as hard, conservatively) but the
   Companion sees them under the wrong heading. Its fix is now cheap: every onboarding chip value
   already resolves, and the write door already validates.

3. **`meat` deliberately excludes fish and shellfish.** A household declaring bare `meat` and
   nothing else is still offered salmon. This is the documented boundary, chosen because THA's
   own data enumerates them separately and because folding them together silently breaks
   pescatarians. A household that eats neither declares both — but a household that *meant*
   both and typed one is not protected by the one they typed. The UI does not offer `meat` at
   all (see 4), so today this affects only seeded and API-written data.

4. **The profile UI still offers seven chips.** `meat`, `fish` and `honey` are now enforceable but
   are **not offered** on the profile form — they enter only via the API, seeds, and the
   development world. Adding them is a product decision and a UI change, which this brief forbids.
   The knowledge is ready for them the moment the chips are added.

5. **`excludedCompounds` remains an unconditional early exit.** An ingredient string containing
   *both* an excluded compound and a genuine allergen exits before the allergen is seen
   (`"cod in fish-free batter"`). This is a property of the pre-existing matcher, not of the new
   definitions; it is why each new `excludedCompound` was justified individually and why none was
   added "just in case".

6. **Free-text restrictions are now rejected rather than half-enforced.** A household can no longer
   store `"kiwi"`. Previously it was accepted and caught only by a substring scan. This is the
   fail-closed direction — THA does not claim to enforce what it cannot — but it is a *narrowing*,
   and it is the one change here a user could notice. Extending the library is now the way to say yes.

---

## GOVERNANCE

- **Architecture Bootstrap** — `docs/architecture/README.md` and the documents above were read before implementation.
- **Principle 2 (one owner per fact)** — all new knowledge went into the canonical restriction
  library. No keyword list was created anywhere else, and the one pre-existing second owner
  (`dietRules`) is now **pinned by a superset test** rather than left free to diverge.
- **Principle 8 (retire on introduction)** — the hand-written `ALLOWED_DIET_RESTRICTIONS` literal is
  no longer the platform's answer to *"can we enforce this?"*; the library is, and the five
  unvalidated doors now ask it.
- **No second rules engine** — `household-dietary-safety.ts` was **not touched**. It grew no food
  keyword; SURF1B's layer-6 test still scans it and still passes.
- **No union of household diet patterns** — unchanged. Patterns remain per-member.
- **No diet preference ownership migration** — unchanged. `hh-sync-bridge` and `hh-contested-owner`
  still fail in CPV1, exactly as SURF1B left them.
- **Fail-closed preserved** — an `unavailable` context still refuses every meal, still keeps the
  gate active, and `requireHardRestrictions()` still throws. Asserted in layer 7.
- **No permissive change** — every filter moved in the restrictive direction or not at all. The
  only relaxations are the negative controls, each of which removes a **false** exclusion
  (kidney beans, goat's cheese, vegan sausages) and none of which removes a true one.

**The working tree was already dirty on arrival** (uncommitted work by other sessions:
`HouseholdNutritionPanel.tsx`, `household-nutrition-assembler.ts`, `notice-gateway.ts`,
`plant-classifier.ts`, and others). SURF1B2 **did not touch, commit, or revert any of it.**

---

## ROLLBACK

```
git reset --hard rollback/SURF1B2-dietary-restriction-knowledge-completion-20260714   # → 9f57680c
```

The tag anchors committed state only. **No seed, no migration, and no database row was written** —
SURF1B2 changed what THA *knows*, never what any store *contains*. Rollback is complete and
requires no data migration. Note that rolling back re-opens the write doors, so any restriction
value written while it was in place remains valid.

---

*Implementation. 2026-07-14. Completes the dietary restriction knowledge; creates no second engine.*
