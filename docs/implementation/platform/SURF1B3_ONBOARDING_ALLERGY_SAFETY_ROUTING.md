# SURF1B3 — Onboarding Allergy Safety Routing

**Status:** Implementation — complete.
**Date:** 2026-07-14
**Branch:** `int1-intelligence-platform`
**Rollback identifier:** `rollback/SURF1B3-onboarding-allergy-safety-routing-20260714` → `194f7af2`
**Predecessor:** [`SURF1B2_DIETARY_RESTRICTION_KNOWLEDGE_COMPLETION.md`](./SURF1B2_DIETARY_RESTRICTION_KNOWLEDGE_COMPLETION.md) — *Remaining limitations*, item 2, which named this defect and deferred it: *"This is a routing defect, not a knowledge one … Its fix is now cheap: every onboarding chip value already resolves, and the write door already validates."*
**Authority (Architecture Bootstrap, `ENGINEERING_WORKFLOW.md` STEP 2):**
`docs/architecture/README.md` → `ARCHITECTURE_PRINCIPLES.md` (Principles 2, 8) → `CANONICAL_PUBLICATION_ARCHITECTURE.md` → `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17) → `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` → `THA_EXPERIENCE_ARCHITECTURE.md`.

---

## HEADLINE

**SURF1B restored the path. SURF1B2 completed the knowledge. The front door was posting
the letter to the wrong address.**

Onboarding asks *"Allergies or intolerances"* on screen 5 of 12. It wrote every answer to
`user_preferences.excluded_ingredients` — the column SURF1B's own resolver classifies, in
a comment, as *"soft, advisory, **never a safety gate**"*. It never wrote
`users.diet_restrictions`, the authoritative hard-restriction owner that the household
safety resolver, the one meal safety gate, and the AI context all read.

So a household that declared a nut allergy the day they signed up, and never afterwards
opened the Profile page, was carried as a **preference**:

| | What THA did with the nut allergy |
|---|---|
| `isMealSafeForHousehold()` — the one gate that can refuse a meal | **could not see it at all** |
| The Companion's context (INT17 `unionRestrictions`) | **absent** — it appeared under *"Household preference — try to avoid"* |
| The recommendation service | a **−30 ranking nudge**. Not a filter. |
| Smart Suggest / the planner | treated as hard — the single conservative accident that kept this from being catastrophic |

The safety architecture SURF1B built worked perfectly. **It was never handed the fact.**

---

## ROOT CAUSE

**The onboarding screen and the profile screen collected the same fact and disagreed about
what kind of fact it was.**

```
Onboarding "Allergies or intolerances"  →  user_preferences.excluded_ingredients   (SOFT)
Profile    "Allergies & intolerances"   →  users.diet_restrictions                 (HARD)
```

Two surfaces, one question, two owners — and only one of them was the owner the safety path
reads. That is a straight violation of Principle 2 (*one owner per fact*), and it survived
because nothing ever asked the onboarding payload what kind of fact it was carrying.

It went further than the write. **The read was wrong in the same direction, and reinforced
it:** the onboarding form *hydrated its allergy chips from `excludedIngredients`*
(`onboarding-page.tsx:290`). The form taught itself that an allergy lives in the preferences
table. A household re-running onboarding after declaring allergies on their profile would
have seen those chips **empty**.

### The trap under the fix

The obvious repair — *route the chip value to `users.diet_restrictions`* — would have
shipped a worse defect than the one it closed.

The two surfaces did not merely use different **tables**. They used different **vocabularies
for the same seven facts**:

| | Onboarding chips | Profile chips |
|---|---|---|
| source | `ALLERGY_OPTIONS` | `ALLERGY_INTOLERANCE_OPTIONS` |
| values | `nuts` · `dairy` · `gluten` … | `Nuts` · `Dairy-Free` · `Gluten-Free` … |

Writing `nuts` into `users.diet_restrictions` would have stored a restriction that:

1. the Profile page renders **no chip as selected** for — the household sees their allergy
   missing from the screen that owns it; and
2. `PUT /api/profile` **rejects with a 400**, because that door validated against a
   hand-written enum of seven Title-Case literals.

**The household would have declared an allergy at onboarding and been locked out of their own
profile by it.** Every subsequent edit — display name, photo, anything — would 400 on a value
THA itself had written.

And this is not hypothetical. **It is already happening to four live users.** `meat`, `fish`
and `honey` — restrictions SURF1B2 made fully enforceable — are held by users 181–184 and
rejected by that enum today:

```
4 user(s) CANNOT save their profile today:
  u181 ["meat","fish"]     u183 ["meat","fish","dairy","eggs","honey"]
  u182 ["meat","fish"]     u184 ["meat","fish","dairy","eggs","honey"]
```

The profile door was the **last write door still answering *"can we enforce this?"* from a
list rather than from the canonical library** — the one SURF1B2 left as *"enum of 7 — every
one now proven enforceable by test"*. It had already drifted, and it was already costing
real households. Retiring it was not scope creep; **it was the precondition for the fix
being safe.**

---

## THE CORRECTED WRITE AND READ PATHS

```
                    BEFORE                                    AFTER
Onboarding chip  ──→ excludedIngredients   (SOFT)   Onboarding chip  ──→ dietRestrictions  (HARD)
                        │                                                    │
                        ├─→ recommendation: −30 nudge                        ├─→ household safety resolver
                        ├─→ AI: "try to avoid"                               ├─→ isMealSafeForHousehold()  ✗ REFUSED
                        └─→ safety gate: INVISIBLE                           ├─→ AI: "must never be violated"
                                                                             └─→ planner gate
Onboarding "Other" ─→ excludedIngredients   (SOFT)   Onboarding "Other" ─→ asked of the canonical library:
                                                            enforceable → HARD   ·   not → SOFT, and said so
Genuine dislike   ──→ excludedIngredients   (SOFT)   Genuine dislike   ──→ excludedIngredients  (SOFT)  ← unchanged
```

### What was built

**One new module.** It owns **routing**, and deliberately owns nothing else.

#### `shared/onboarding-restrictions.ts` — the routing contract

It answers exactly one question: *is this selection a safety fact or a preference?*

It is **not a rules engine.** It defines no food, no allergen and no keyword. Every judgement
about what a declared string *means* is delegated to the canonical restriction library. A test
scans its source (comments stripped — a check that cannot tell prose from a keyword list is not
a check) and **fails if a food keyword ever appears in it** — the same guard SURF1B put on the
household safety resolver.

It is also **the single owner of the declarable restriction list**, replacing the three copies
that had drifted apart (Principle 8, retire-on-introduction):

| Retired | Was | Now |
|---|---|---|
| `ALLERGY_OPTIONS` (client, onboarding) | its own lower-cased vocabulary | derived from the owner |
| `ALLERGY_INTOLERANCE_OPTIONS` (client, profile · planner · meals) | a second literal list | derived from the owner |
| `ALLOWED_DIET_RESTRICTIONS` (server, the profile enum) | 7 hand-written literals | **deleted** — the door asks the library |

**The vocabulary mapping is derived, never hand-written.** Two declared strings are the same
restriction precisely when they resolve to the same set of canonical restriction ids: `dairy`
and `Dairy-Free` both resolve to `{dairy}`; `nuts` and `Nuts` both resolve to
`{peanut, tree_nut}`. There is no alias table in this module, because **an alias table here
would be the second owner of the fact that caused the bug in the first place.**

### Files changed

| # | File | Change |
|---|---|---|
| — | `shared/onboarding-restrictions.ts` | **New.** The routing contract + the single owner of the declarable restriction list. Owns routing; delegates every judgement. |
| W | `client/src/pages/onboarding-page.tsx` | Submits `dietRestrictions` (**HARD**) and `excludedIngredients` (**SOFT**) as **separate fields**. The payload now states which kind of fact each value is. |
| R | `client/src/pages/onboarding-page.tsx` | Hydrates the allergy chips from `profile.dietRestrictions` — **the owner** — not from the preferences table. The read-side face of the same defect, closed. |
| — | `client/src/lib/diets.ts` | Both chip lists derived from the single owner. Stored values unchanged for every existing surface. |
| D | `server/routes.ts` — `POST /api/user/complete-onboarding` | Routes any enforceable value arriving in `excludedIngredients` **to the hard owner, at the door**. |
| **T** | `server/routes.ts` — `PUT /api/profile` | The seven-literal enum is **retired**; `dietRestrictions` is validated by `hardRestrictionsSchema`, like the other five doors since SURF1B2. **Unlocks the 4 live users who cannot save their profile today.** |
| — | `scripts/repair-onboarding-allergy-routing.ts` | **New.** The live-data audit and repair — idempotent, reversible, lossless. |

### The door is the enforcement point, not the client

The server routes soft-filed allergies **at the door**, not only in the browser. This matters:
a household with the pre-SURF1B3 bundle still open in a tab sends its allergy chips as soft
exclusions, and would keep doing so for as long as that tab lives. Proven over real HTTP:

```
POST /api/user/complete-onboarding
  {"excludedIngredients":["nuts","dairy","mushrooms"]}      ← a cached browser's exact payload
                                                              (no dietRestrictions field at all)
→ 200
  users.diet_restrictions    = ["Nuts","Dairy-Free"]   ← ROUTED to the owner, in the profile's vocabulary
  prefs.excluded_ingredients = ["mushrooms"]           ← only the genuine dislike remains

→ resolveHouseholdSafetyContext()  activeRestrictions: peanut, tree_nut, dairy
     ✗ REFUSED  Chicken Satay          — household-hard-restriction
     ✗ REFUSED  Mac & Cheese           — household-hard-restriction
     ✓ served   Mushroom Risotto       — a dislike is not a gate
     ✓ served   Grilled Chicken Salad
→ AI context   unionRestrictions: ["Nuts","Dairy-Free"]   unionExclusions: ["mushrooms"]
```

**The scope of that rule is exact, and it is the reason it is safe.** Onboarding's
`excludedIngredients` has exactly **one** upstream: the "Allergies or intolerances" screen.
There is no dislikes input anywhere in the flow. So an enforceable value arriving in that field
**at that door** is a declared allergy filed under the wrong heading. The rule applies to that
door and no other — `PUT /api/user/preferences` collects genuine dislikes, and **a dislike is
never promoted however enforceable it happens to be.** *"I don't like eggs"* is not *"eggs will
hurt me"*, and collapsing the two would put a hard gate around a matter of taste.

---

## SAFETY VERSUS PREFERENCE

The whole workstream is one distinction, held in four places.

### 1. A chip is a hard fact. Always.

The screen asks for allergies and intolerances. An allergy is not a preference. Every selected
chip becomes a hard restriction, in the canonical vocabulary, unconditionally.

### 2. Free text is asked of the library, value by value

The "Other" box is split into the individual things the household named, and each is put to the
canonical restriction library:

- **enforceable → HARD.** A household typing `mustard` is now genuinely *protected* rather than
  merely accommodated — `mustard` has a full canonical definition and no chip. This is a
  strict improvement on the previous behaviour, where it became a soft hint.
- **not enforceable → SOFT, and the household is told.**

### 3. The household is told the truth, in the place they typed it

A restriction presented as a guarantee it is not is worse than no restriction at all —
SURF1B2's central argument. So the onboarding screen says so, plainly, before they submit:

> *We can't check every meal for **mushrooms** yet, so we'll avoid it where we can rather than
> promise you more than we can keep. Everything else here we'll treat as a strict no.*

**What the household is told and what THA stores come from the same routing call.** They cannot
disagree, because there is only one of them.

### 4. Nothing typed is ever discarded

An unenforceable value is still recorded as a soft exclusion and still avoided where possible —
including by the planner, which treats `excluded_ingredients` as hard. The narrowing SURF1B2
introduced at the *hard* door is preserved; nothing new is thrown away.

---

## LIVE-DATA AUDIT AND REPAIRS

`npx tsx scripts/repair-onboarding-allergy-routing.ts` — read-only by default.

### The audit

```
── SURF1B3 · live-data audit ──

  3 user(s) carry any excluded ingredient.
  distinct values in user_preferences.excluded_ingredients:
    "meat"       ×2   ENFORCEABLE — a safety fact
    "fish"       ×2   ENFORCEABLE — a safety fact
    "dairy"      ×1   ENFORCEABLE — a safety fact
    "eggs"       ×1   ENFORCEABLE — a safety fact
    "honey"      ×1   ENFORCEABLE — a safety fact
    "mushrooms"  ×1   not enforceable — a preference, and it stays one

  0 user(s) hold an allergy ONLY as a soft exclusion.
```

### **The repair set is empty, and that is the finding — not an absence of one.**

Every enforceable value in the live soft lists is **already held by its hard owner**. Users 181
and 183 carry `meat`/`fish`/`dairy`/`eggs`/`honey` in *both* columns — seeded that way, not
written by onboarding. The one value that exists *only* as a soft exclusion is user 189's
`mushrooms`, which is not an allergy, is not enforceable, and **stays exactly where it is.**

**The defect is real, live, and latent.** It has not yet corrupted production data because no
household has completed the allergy screen with a chip selected since the current flow shipped.
It would have corrupted the data of the next one. That is the honest result, and it is asserted
as a test (§ *Tests*, layer 11) rather than merely reported here — so if a household *does*
land in that state before the fix deploys, **the suite says so instead of staying quiet.**

### The repair, for the environments where it is not empty

It is built, tested, and shipped anyway — staging and development data differ, and the audit
must be re-runnable.

**It contains no rule of its own.** It calls `promoteSoftAllergies()` — the same function the
live onboarding door uses — so *the migration and the runtime cannot disagree about what an
allergy is.*

**The safe-to-promote criterion**, stated once and enforced in one place. A value moves only when:

1. the canonical restriction library **can enforce it**, and
2. the household's hard-restriction owner **does not already hold it** (compared *canonically*,
   so `dairy` ≡ `Dairy-Free`).

| Property | How |
|---|---|
| **Idempotent** | After a run, every promoted value is held by the hard owner — so criterion (2) no longer matches it. A second run is a no-op and says so. Asserted by test. |
| **Reversible** | Every write records the user's exact before/after arrays in a manifest. `--revert <manifest>` restores them verbatim, and **refuses any row that has changed since** — a revert that overwrites a household's later edit is a worse defect than the one it undoes. |
| **Lossless** | Nothing is deleted. A promoted value **moves**; an unenforceable preference is **never touched**. Asserted by test against the live rows. |
| **Non-duplicating** | A promoted value leaves the soft list as it enters the hard one. One fact, one owner. |
| **Minimal** | A value the hard owner already holds is not rewritten at all. Users 181–184 are not touched. |

**Enforcement can only strengthen.** The safety gate begins to see the allergen; the planner
(which already unioned both lists) sees the same set as before; the Companion is told *"never
violate this"* where it was told *"try to avoid"*. **No filter moves in the permissive
direction.**

---

## TESTS AND NEGATIVE CONTROLS

### `npm run test:surf1b3-onboarding-allergy-routing` — **64 passed, 0 failed**

Registered in `npm test`. Eleven layers, one per place the defect could return.

**Layer 1 — NEGATIVE CONTROL: what the old write path could not do.** These pin the **defect**,
not the fix, and must pass forever. The day one fails, someone has quietly made
`excludedIngredients` a hard gate and the hard/soft distinction has collapsed:

```
✓ a nut allergy stored ONLY as a soft exclusion does NOT stop a satay — the defect, pinned
✓ a soft exclusion contributes NOTHING to the hard restriction union
✓ the safety gate does not even ACTIVATE for such a household
✓ the SAME allergy, routed to users.diet_restrictions, REFUSES the satay
```

**Layer 3 — VOCABULARY: the trap.** Every chip resolves to an enforceable canonical restriction;
a legacy lower-cased value is rewritten into the profile's vocabulary *derived from the library,
not from an alias table*; the retired enum is gone; **every value onboarding can write passes the
profile write door — no household can be locked out of its own profile.**

**Layer 6 — END TO END, against the real database.** A real user, a real household, a real write,
the real resolver:

```
✓ the nut allergy entered at onboarding reaches HOUSEHOLD SAFETY RESOLUTION as a hard restriction
✓ …and resolves through the canonical library to peanut + tree_nut
✓ an UNSAFE meal (chicken satay — peanut butter) is REJECTED
✓ …and a safe meal is still served — the gate does not over-reject
✓ the nut allergy reaches the AI-FACING HOUSEHOLD CONTEXT as a HARD restriction (unionRestrictions)
✓ …and is NOT filed under preferences, where the Companion would be told merely to "try to avoid" it
```

**Layer 7 — SEPARATION.** The same submission carried a mushroom dislike:

```
✓ the mushroom dislike reaches the AI context as a SOFT preference
✓ …and is absent from the hard restriction union — a preference is never a gate
✓ …so a mushroom risotto is NOT unsafe. It is merely not their favourite.
… one submission, two owners: hard=["Nuts"]  soft=["mushrooms"]
```

**Layer 8 — REJECTION.** `kiwi` is refused by the write door (400, naming the value and not the
whole submission); the router never routes an unenforceable value to the hard owner; nothing the
household typed is discarded; **and the screen says so** — asserted against the client source, so
the message and the storage cannot drift apart.

**Layer 10 — ONE ENGINE.** The router's source is scanned (comments stripped) and **must contain
no food keyword of its own.** It fails if the router ever becomes the second rules engine.

**Layer 11 — LIVE DATA.** The assertions that make the empty repair set a *fact* rather than a
claim: no live user holds an allergy only as a soft exclusion; user 189's `mushrooms` is
**preserved and never promoted**; every live soft value is either kept or moved, **none lost**;
**none duplicated**.

### Verified in the running application

Not only in tests. The dev server was booted and driven over real HTTP — register → onboard →
profile → gate — for both the new client payload and the legacy one. Both transcripts are in
§ *The door is the enforcement point*. `PUT /api/profile` with `["Nuts","mustard"]` returns
**200** where it returned **400** at `194f7af2`.

### Regression

| Gate | Result |
|---|---|
| `test:surf1b-dietary-restriction-safety-path` | 54 passed, 0 failed |
| `test:surf1b2-dietary-restriction-knowledge` | 167 passed, 0 failed |
| `test:surf1a-existing-data-surfacing` | 31 passed, 0 failed |
| `test:planner-compliance` | 25 passed, 0 failed |
| `test:smart-suggest-restrictions` | 30 passed, 0 failed |
| `test:smart-suggest-diet-pattern` | 26 passed, 0 failed |
| `test:smart-suggest-tailoring` | 14 passed, 0 failed |
| `test:household-eater` | 13 passed, 0 failed |
| `test:intelligence-household-binding` | 51 passed, 0 failed |
| `test:intelligence-profile-binding` | 50 passed, 0 failed |
| `test:intelligence-context-composition` | 166 passed, 0 failed |
| `test:intelligence-platform` | 33 passed, 0 failed |
| `test:plan1-planner-intelligence` | 58 passed, 0 failed |
| `test:nutrition-enrichment` | 22 passed, 0 failed |
| `npm run build` | **clean** — client bundle builds with the new `@shared` import |
| `npm run verify:publication` | **24 passed, 12 failed — identical to SURF1B2. No check moved.** |
| `npm run typecheck` | **304 errors — identical to baseline. 0 new, and 0 in any file this workstream touched.** |

---

## REMAINING LIMITATIONS

Stated plainly, because a safety document that overclaims is worse than one that does not exist.

1. **A `Vegan` or `Vegetarian` *pattern* can still be recommended prosciutto.** SURF1B2's first
   limitation, **untouched and still the first thing to do next.** `dietRules.MEAT_KEYWORDS` has
   holes the canonical library does not (`prosciutto`, `pancetta`, `gammon`, `mutton`, `gelatine`,
   `bone broth`, `foie gras`). It is pinned by SURF1B2's superset test. Closing it changes the
   recommendation behaviour of every vegan and vegetarian household and needs its own regression
   budget.

2. **The profile UI still offers seven chips.** `meat`, `fish`, `honey`, `mustard` and `coconut`
   are enforceable, and are now *writable and re-savable* through the profile door — but no chip
   offers them. A household can declare them through onboarding's free-text box, and will then see
   them in their profile summary but not as a selected chip they can remove. **Adding the chips is
   a product decision this brief forbids**; the knowledge, the doors and the vocabulary are all
   ready for them.

3. **Users 181–184 still hold `meat`/`fish` in both columns.** Pre-existing duplication from a
   seed, not from onboarding. The repair deliberately does **not** touch it: the hard owner already
   holds the fact, so moving the soft copy buys no safety and a repair with an unnecessary blast
   radius is a repair with an unnecessary risk. Collapsing it belongs to the diet-preference
   ownership migration, which SURF1B and SURF1B2 both deferred and which this brief forbids.

4. **`user_preferences.excluded_ingredients` is still read as *hard* by the planner** and as
   *soft* by everything else. That inconsistency predates SURF1B and is preserved deliberately —
   it is conservative, and SURF1B3 changes no filter in the permissive direction. But it means the
   platform still has one place where a preference gates a meal.

5. **The three-owner diet *preference* contest survives.** CPV1 still reports `hh-sync-bridge` and
   `hh-contested-owner`. Both concern `diet_types`, not restrictions. **Restrictions now have one
   owner chain, written at every door and read in one place.**

6. **The onboarding allergy chips render in the owner's order** (Gluten, Dairy, Nuts, …) rather
   than their previous ad-hoc order (Nuts, Dairy, Gluten, …). Same seven chips, same labels, same
   grid — the single cosmetic consequence of collapsing the two lists into one owner.

---

## GOVERNANCE

- **Architecture Bootstrap** — `docs/architecture/README.md` and the documents above were read
  before implementation.
- **Principle 2 (one owner per fact)** — the defect *was* a second owner. Restrictions now have
  one, written by every door. The routing module owns *routing*; it owns no rule and no food.
- **Principle 8 (retire on introduction)** — three copies of the declarable restriction list are
  collapsed into one owner, and the profile's hand-written enum is **deleted**, not deprecated.
- **No new restriction knowledge** — not one definition, alias, derived or hidden ingredient was
  added. `RESTRICTION_LIBRARY_VERSION` is unchanged at `4.0.0`.
- **No keyword matching outside the canonical library** — enforced by test, not by discipline. The
  router's source is scanned and the suite fails if a food keyword appears.
- **No change to vegan/vegetarian pattern enforcement** — `shared/dietRules.ts` was not touched.
- **No diet-preference ownership migration** — `diet_types` untouched; CPV1 unchanged.
- **No union of household diet patterns** — unchanged. Patterns remain per member.
- **Fail-closed preserved** — an `unavailable` context still refuses every meal, still keeps the
  gate active, and `requireHardRestrictions()` still throws. Asserted in layer 9.
- **No permissive change** — every filter moved in the restrictive direction or not at all.
- **Experience Architecture** — the onboarding flow is **not redesigned**: same twelve steps, same
  seven chips, same labels, same free-text box. The one addition is an honest sentence, shown only
  when THA cannot enforce what the household typed. *If the household would not feel the care, it
  is decoration; if they would feel its absence, it is craft* — a household told the truth about
  what THA can guarantee would feel the absence of it acutely.

**The working tree was already dirty on arrival** (uncommitted work by other sessions:
`HouseholdNutritionPanel.tsx`, `household-nutrition-assembler.ts`, `notice-gateway.ts`,
`plant-classifier.ts`, and others). SURF1B3 **did not touch, commit, or revert any of it**, and
the milestone commit contains only the files listed under *Files changed* plus its test, this
document, and the `package.json` test registration.

---

## ROLLBACK

```
git reset --hard rollback/SURF1B3-onboarding-allergy-safety-routing-20260714   # → 194f7af2
```

The tag anchors committed state only. **No seed, no migration, and no database row was written** —
the live repair set was empty, so `--apply` was never run and no manifest exists. Rollback is
complete and requires no data migration.

Had the repair been applied, it would be reversed by
`npx tsx scripts/repair-onboarding-allergy-routing.ts --revert <manifest>` **before** the code
rollback — the manifest holds each user's exact prior arrays, and the revert refuses any row that
has changed since.

Note that rolling back re-opens the profile enum, so a household holding `meat`, `fish`, `honey`,
`mustard` or `coconut` becomes unable to save their profile again.

---

*Implementation. 2026-07-14. Routes the allergy to its owner; creates no dietary knowledge.*
