# PROD3 — Trust & Safety Completion

**Session:** `PROD3_Trust_And_Safety_Completion`
**Date:** 2026-07-18
**Branch:** `int1-intelligence-platform`
**Rollback ID:** `rollback/PROD3-trust-and-safety-completion-20260718` → commit `6e326d9f` (annotated)
**Dirty-tree snapshot:** `stash@{0}` → `fd880809d679fe8d4c32e5c320f39267281fcba6` (3 tracked files; **32 untracked NOT covered** — §Rollback)
**Type:** Implementation. Connects an existing safety architecture. Builds none.
**Mandate:** No new AI capability. No new safety system. No new architecture. No duplicated business logic.

---

## 1. What this programme is

PROD2 found the gap and **refused to half-build it**, on the grounds that a partial allergen filter would imply a safety guarantee THA could not deliver. PROD3 is that work done properly, and its central claim is that **almost none of it is new code**.

THA has had a canonical household dietary safety gate since SURF1B: `server/lib/household-dietary-safety.ts`. It fails closed. It resolves child eaters who have no account. It is pinned by six existing suites. Its own header names its intended consumers, including — explicitly — *"the AI prompt blocks, chiefly"*.

Every consumer of it lived outside `server/intelligence/`. Measured at `6e326d9f`:

```
grep -rl "household-dietary-safety" server/intelligence/   →  no matches
```

**The Companion — the one surface that speaks to a household in sentences and hands them a meal to cook — consumed the safety gate nowhere.** LAUNCH1 §3.5 ranks this first of everything it found, as *"the only finding with a path to physical harm."*

PROD3 creates **no restriction, no allergen, no keyword list, no matching rule and no second gate**. Every verdict it enforces is `isMealSafeForHousehold()`'s.

### 1.1 A correction to PROD2, made here because it was mine

PROD2 §8 stated that `shared/restrictions/restriction-safety.ts` had *"zero production consumers anywhere in the repository."* **That was wrong.** It has three live client-side consumers — `WorkspaceAnalyserSheet.tsx:30`, `WholeFoodAnalysisCard.tsx:7`, `AnalyserDetailV2.tsx:16`. The true statement is *zero **server-side** consumers*. The error did not change PROD2's conclusion, but it overstated the evidence, and it is corrected here rather than left standing.

That module also turned out to be **the wrong tool for this job**, which is the more useful finding — see §4.1.

---

## 2. Architecture Compliance

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity is touched. No key space added, split or renamed.

☑ One owner per fact
  "What may this household not eat" keeps exactly one owner —
  `lib/household-dietary-safety.ts` (SURF1B). PROD3 adds a CONSUMER to it and
  re-derives nothing. §10 of the new test suite asserts this mechanically:
  neither changed intelligence file may declare an allergen or restriction list
  of its own, and both must reach the canonical owner.

☑ No duplicate entities
  None created.

☑ No duplicate ownership
  None created. The Companion previously reached restrictions through the
  WEAKER path (`resolveActiveRestrictions` inside food-intelligence, over
  `name + category` only). It now reaches the canonical gate, which is a
  reduction in rival paths, not an addition.

☑ No duplicate state
  Nothing is stored, cached or mirrored. The safety context is resolved per
  turn from the canonical owner and discarded.

☑ Extends existing architecture
  It adopts SURF1B's gate at the surface SURF1B named and never reached, using
  the same idiom `lib/meal-service.ts` already uses (`isSafetyGateActive` as the
  short-circuit, `isMealSafeForHousehold` as the verdict, "fewer, never unsafe"
  as the behaviour).

☑ Progressive enrichment where appropriate
  N/A — no knowledge entity introduced or extended.

☑ Knowledge domain compliance
  N/A — no knowledge domain introduced or extended. No claim, evidence chain or
  graduation path touched.

☑ Honest gaps over fabricated information
  Central. A household whose restrictions cannot be read is now told THA cannot
  check, and is offered nothing — rather than being served the unfiltered
  cookbook, which was the previous behaviour and was indistinguishable from
  "you have no restrictions".

☑ No permanent synchronisation bridge
  None introduced.

☑ No duplicate capabilities
  No capability registered, bound, renamed or extended. The Capability Registry
  and the Intent Engine are byte-untouched.
```

### AI Architecture Compliance

**Applicable, and completed in full.**

- **Canonical Intelligence Platform** — used, unchanged. No second assistant, no rival conversation path, no new gateway.
- **Capability Registry** — untouched. **No capability was added, and none was needed**: safety is not a capability the household asks for, it is a constraint on every answer.
- **Intent Engine** — untouched. Routing, confirmation and the write-verb gate are unchanged.
- **Reuses existing business services** — `resolveHouseholdSafetyContext`, `isMealSafeForHousehold`, `isSafetyGateActive`, all existing, all SURF1B's.
- **No second assistant · no duplicated conversation state** — one gateway, one store, one turn pipeline.
- **Permission-aware access** — the safety context is resolved from the **server-authenticated `userId`** already in `buildGroundedResponse` (FI5's own comment: *"never a client-suppliable id"*). No household data crosses a household boundary.
- **Honest gaps over fabricated knowledge** — HARD RULE 6 instructs the model that offering nothing is always correct; the unresolved-context branch forbids food recommendation outright.
- **INT17's ownership of grounding is preserved.** The safety block is a **RULE in the system prompt, not a Context View**. Nothing is composed, serialised, ordered or budgeted into the `CONTEXT DATA` block, which remains INT17's alone. This distinction is deliberate and is the reason the block sits beside HARD RULES rather than inside the context — a safety constraint that a token budget could evict is not a safety constraint.

---

## 3. What was wrong, with evidence

Five defects, each verified before it was changed.

| # | Defect | Evidence |
|---|---|---|
| 1 | **Meal discovery had the ingredients and threw them away.** | `meal-discovery-engine.ts:61` reads `m.ingredients` to MATCH a query; `mealToDiscoveryItem` (`:81`) omits them; `DiscoveryItem` has no ingredients field. `discover(query, userId)` took `userId` and used it only for `getMeals`. No restriction code in the file at all. |
| 2 | **HARD RULES never mentioned allergies.** | `conversation-gateway.ts:1166-1171` — five rules covering grounding, medical claims, honest gaps, tone and entity refs. Not one word about allergens or restrictions. |
| 3 | **Restrictions reached the model only by accident of routing.** | `household:read`'s Context View pins `aggregated.unionRestrictions` — but only when the `household` capability is routed for that turn. A meal-discovery turn carried **no restriction fact at all**. |
| 4 | **Response validation was type-shape only, with two raw bypasses.** | `:1286-1296` checks `typeof text === "string"` and that each ref has a `type` and an `id`. `:1289` falls back to raw model output; `:1311` returns `rawContent` unvalidated on a parse failure. And `mergeEntityRefs` (`:1331`) **adds** meal refs the model did not cite. |
| 5 | **Food Intelligence Rule T0 failed OPEN.** | `resolveHouseholdSignal`'s catch returned `NO_HOUSEHOLD_SIGNAL`, identical to "this caller has no household". `rankAndExplain` then saw `restrictionDefs.length === 0` and admitted every candidate. A household whose allergens THA failed to read was treated exactly like one with none. |

### 3.1 The finding that proves it was real and shipped

`server/tests/test-intelligence-native-discovery.ts:248` — **passing, and inside `npm test`** — asserted:

```ts
assert(r.entityRefs.some(x => x.type === "meal" && x.id === 42),
  "canonical THA meal refs are merged onto the turn even though the LLM returned none");
```

Resolved against the live database:

```
user 1 → household 44 → hardRestrictions: ["Gluten-Free"], dietPattern: "Keto"
meal 42 → "Pasta Bake Test", ingredients: ["300g pasta", "1 onion", "200g cheese", …]
isMealSafeForHousehold(42, ctx) → { safe: false, reason: "household-hard-restriction" }
```

**A green test in the aggregate suite was pinning the delivery of a gluten-bearing pasta bake to a gluten-free household as correct behaviour.** It was not a bad test — it was testing INT36's merge logic and had no idea the household it borrowed carried an allergen. That is precisely how this class of defect survives: nothing was lying, and nobody was looking.

### 3.2 Who was exposed

Measured through the canonical resolver across every live user:

```
users resolved:              327
safety gate ACTIVE:          100  (30.6%)
   with hard restrictions:    27
   with a diet pattern:       95
context unavailable:           0
```

**100 of 327 users could receive a Companion meal recommendation the canonical gate refuses.** 27 of those hold declared allergens or hard restrictions.

---

## 4. What changed

```
 server/intelligence/conversation/conversation-gateway.ts    | 170 +++++++++++++-
 server/intelligence/services/meal-discovery-engine.ts       | 128 ++++++++++-
 server/intelligence/food-intelligence/engine.ts             |  33 ++-
 server/tests/test-intelligence-native-discovery.ts          |  20 +-
 package.json                                                |   5 +-
 5 files changed, 342 insertions(+), 14 deletions(-)
 + server/tests/test-prod3-companion-restriction-safety.ts   | 418 (new)
```

### 4.1 The design decision that mattered most: which engine to wire

The mission named the **Restriction Safety engine** (`shared/restrictions/restriction-safety.ts`). Wiring *that* function as the gate would have been a mistake, and it is worth recording why, because it is not obvious:

| | `computeRestrictionSafety` | `isMealSafeForHousehold` |
|---|---|---|
| Shape | returns **findings** to render (`warning`/`unsafe`/`explanation`) | returns a **verdict** (`{ safe, reason }`) |
| Built for | the product analyser, over packaged-product ingredient text | the meal gate — planner, Smart Suggest, starter cookbook |
| Unknown restriction | `return []` — **fails open** | refuses |
| Missing eaters | `return []` — **fails open** | refuses |
| Unresolved context | no concept of one | `{ safe: false, reason: "safety-context-unavailable" }` — **fails closed** |
| Diet patterns | not covered | covered via `dietRules` |

`computeRestrictionSafety` has **three early `return []`** paths (`:131`, `:137`, `:141`). Each is correct for a reporting function and catastrophic for a gate: they turn "I could not evaluate this" into "no findings", which a filter reads as *safe*.

So PROD3 wired **`isMealSafeForHousehold`** — the gate SURF1B built, that SURF1B/1B3/1B5 already pin, and that fails closed by construction. This satisfies the mission's intent (*connect the existing safety architecture*) using the correct existing component, and it is the option that duplicates nothing: `restriction-safety.ts` and the canonical gate ultimately call the **same** `restriction-resolver` library underneath, so this is one owner reached by the right door, not two engines.

### 4.2 Meal discovery — the gate at the only place the ingredients exist

`MealDiscoveryEngine` now resolves the safety context once per query and filters every candidate. The safety module is **injectable** (like `MealDiscoveryStorage` already was) so engine tests drive the gate without a database, and lazily imported in production so importing the engine still opens no database connection.

- **Personal meals are gated too.** A household's own saved recipe is not exempt: saving a recipe is not a declaration that everyone at the table can eat it, and the Companion recommending it is a new act.
- **Templates** have no `ingredients` column; their ingredient evidence is their slot arrays. **A template with no slot data is withheld while the gate is active** — "we cannot see what is in this" is not "this is safe". LAUNCH1 measured only 55 of 1,316 templates carrying `protein_slots`, so this is a real reduction, and it is a cookbook-data gap rather than a reason to relax the gate.
- **The exclusion is counted, not silent** — `getSafetyExclusion()` returns `{ excludedForSafety, status }`, so a caller can tell *"we could not check"* from *"you have nothing"*.

### 4.3 The prompt — HARD RULE 6 and the safety block

Rule 6 was added and the household's own restrictions now reach the model **on every turn**, sourced verbatim from the canonical owner. The personality fragment's invariant was extended from *"never overrides rules 1–5"* to *"never overrides rules 1–6 above, and never softens rule 6"*.

Captured from a real turn (a **profile** turn — one where the household capability was *not* routed, which previously carried no restriction fact whatsoever):

```
6. SAFETY OVERRIDES EVERYTHING. Never recommend, suggest, endorse or describe as suitable
any food, meal, recipe or ingredient that conflicts with the HOUSEHOLD DIETARY SAFETY block
below. … A restriction belongs to the whole household, not only to the person typing. If the
honest answer is that you have nothing safe to suggest, say so — offering nothing is always
correct, and offering something unsafe never is. Never claim a specific food IS safe for
them; THA verifies that, not you.

HOUSEHOLD DIETARY SAFETY — THIS HOUSEHOLD HAS DECLARED RESTRICTIONS:
Gluten-Free
Diet patterns held by members (hard for that member): Keto.
These are the household's own declared allergies and hard restrictions, and they apply to
EVERY member at the table — including children with no account of their own.
```

The unresolved branch is the one that matters most, and it refuses rather than falls silent:

```
HOUSEHOLD DIETARY SAFETY — UNRESOLVED:
THA could not read this household's allergies and dietary restrictions for this turn.
You therefore do NOT know what is unsafe for them. Do not recommend, suggest, endorse or
propose any specific food … in this turn.
```

### 4.4 Response validation — and why it validates refs, not prose

`validateResponseSafety` runs on **both** return paths, including the JSON-parse fallback that previously returned raw model output with no checking at all, and it validates the **merged** refs — so a meal that `mergeEntityRefs` attached on the model's behalf is checked even when the model never cited it.

**It deliberately does not scan the prose.** Scanning response text for restriction keywords would block the Companion from doing the thing a household most needs it to do: *"you've told us about Ava's peanut allergy, so avoid the satay"* contains both "peanut" and "satay" and is exactly the right answer. An `entityRef`, by contrast, is a claim THA makes in its own voice — it renders as a real, tappable meal card — so a match there is unambiguous. Validating the structured claim gives a precise gate with no false positives; validating the sentence would produce an assistant that cannot discuss allergies.

When a ref fails, the ref is dropped **and the text is replaced**, because dropping only the link leaves a sentence recommending a meal whose card has silently vanished — and we cannot know the sentence did not name it.

**One correction made during implementation.** The first version ran on every turn. It was wrong on its own terms — a household with nothing to enforce needs no enforcement — and it broke two `native-discovery` assertions. It now short-circuits on `isSafetyGateActive`, the same canonical predicate `meal-service.ts` uses, which is deliberately **TRUE** for an unavailable context so "we could not check" still validates.

### 4.5 Food Intelligence — Rule T0 now fails closed

`HouseholdSignal` gained `resolutionFailed`, set only in the catch, to separate *"there is no household"* (nothing to protect — Stage 1 static behaviour is correct) from *"the household read FAILED"* (an empty restriction list is not "no restrictions", it is "we do not know"). Rule T0's filter now refuses in the second case.

**The Food Opportunity Engine was checked and needed no change** — `identifyOpportunities:1076` already returns an empty bundle when `resolved` is false, and the new signal keeps `resolved: false`. Verified rather than assumed, and left alone.

---

## 5. Definition of Done

| # | Required | Status |
|---|---|---|
| 1 | Restriction Safety engine connected throughout the Companion | ✅ meal discovery, the prompt, and response validation — the three paths by which a meal reaches a household |
| 2 | Allergies and hard restrictions enforced before every recommendation | ⚠️ **Enforced on every *meal recommendation* path. Scope stated precisely in §9** — the own-data discovery engines (pantry, shopping, diary, planner) are deliberately excluded, with reasons. |
| 3 | Companion responses validated before return | ✅ both return paths, merged refs included, fail-closed |
| 4 | Fabricated / unsupported recommendations removed | ✅ the fail-open paths that produced them (Rule T0, the raw-output bypasses) are closed |
| 5 | Existing Trust Gates execute in production | ✅ the canonical gate now executes in `server/intelligence/`, where it previously never ran; verified against the production engine and live data (§7.3) |
| 6 | Verification tests added or updated | ✅ new 418-line suite, **36 assertions, wired into `npm test`**; one existing test corrected |
| 7 | No new AI capability / safety system / architecture | ✅ registry, intent engine and INT17's grounding ownership all untouched |
| 8 | No duplicated business logic | ✅ asserted mechanically by §10 of the new suite |

---

## 6. Data Impact

**None.** No schema change, no migration, no write path, no new column, no backfill. `shared/schema.ts` and `server/migrations/**` are byte-untouched. No row was created, updated or deleted by this session.

Reads only, all through existing owners: `resolveHouseholdSafetyContext` (which reads `household_eaters`, `household_members`, `users`, `user_preferences`), `storage.getMeal`, and the three discovery sources.

**One behavioural consequence is a data-visibility change, not a data change:** restricted households now see fewer meals. Nothing was deleted from their cookbook — the meals are still there, and remain visible in every non-Companion surface that has its own gate. §7.3 quantifies it.

---

## 7. Verification

### 7.1 Test suites

| Set | Result |
|---|---|
| **New PROD3 suite** | **36 assertions, 0 failed** — 10 layers incl. fail-closed, own-meal gating, slotless templates, and the live regression pin on meal 42 |
| All 13 safety suites | **13/13 pass** |
| Intelligence / Companion suites | **17/17 pass** |
| `npx tsc --noEmit` | **94 errors — unchanged**, none in any touched file |
| `npm run typecheck:ci` | **18 regressions — unchanged** (none PROD3's; ownership recorded in PROD2 §7.2) |
| `npm run adoption:check` | **82 passed · 0 failed** |
| `NODE_ENV=production npm run build` | **exit 0** |

Total: **30 suites run, 0 failures.** The full `npm test` was not run — ~3.7 h against a 45-minute CI timeout (LAUNCH1 §2.1, still unfixed and still the top engineering blocker).

### 7.2 One existing test was changed — and why that is the finding, not a workaround

`test-intelligence-native-discovery.ts` §4 was pointed from user 1 (Gluten-Free + Keto) to user 2 (`hardRestrictions: []`, no diet pattern). The INT36 merge behaviour it exists to prove is unchanged and still asserted; it is now proven on a household where the safety gate is inactive, so the merge is the only thing under test.

This is deliberately **not** a relaxation. The withholding behaviour for a restricted household is now owned by §5 of the new suite, which runs that same fixture against user 1 and **requires meal 42 to be refused**. The assertion moved to the file that should own it, and the old file carries a comment explaining exactly what it used to pin and why that was wrong.

Both stub meals in that fixture are unsafe for user 1 (meal 42 → gluten; meal 100 "Healthy tomato soup" → `diet:Keto`), so no id substitution could have preserved the test on that household.

### 7.3 Production behaviour — measured, not modelled

The **production** `MealDiscoveryEngine` with real storage and the real canonical gate, for user 1 (Gluten-Free + Keto), compared against the pre-PROD3 path:

```
query        pre-PROD3   PROD3   excluded
  pasta          15         0         68
  chicken        15        15        305
  salad          15         6         60
  curry          15         9         38
  soup           15        11         46
  fish           15         9         39
  eggs           15         7         31
```

Read this carefully, because both halves matter:

- **"pasta" returns nothing** to a gluten-free household. That is correct and it is the whole point — 68 candidates were refused, and every one of them would have been offered before.
- **"chicken" is completely unaffected** at 15. The gate is not a blanket refusal, and the Companion still works.

Independently verified: **0 unsafe items leaked** — every returned item was re-checked against the gate after the fact.

### 7.4 Fail-closed, proven by forcing it

An `unavailable` safety context (the state a database failure produces) was driven through the production engine: **0 meals returned, 2 candidates recorded as withheld, status reported as `unavailable`** — so the caller can distinguish "we could not check" from "you have nothing". `isSafetyGateActive(unavailable) === true` is asserted, pinning SURF1B's rule that unavailable is not inactive.

---

## 8. Trust Check

| Question | Answer |
|---|---|
| Can any change cause THA to state something untrue? | No — every change **removes** a false implication. The largest was structural: THA presented a meal to a household as a suggestion without ever having asked whether they can eat it. |
| Can a household lose data? | No. No write path is touched. Meals are withheld from one surface's *recommendations*, never deleted, and remain visible everywhere else. |
| Does anything fabricate? | No. No restriction, allergen or keyword is authored here; every fact comes from the household's own declaration via the canonical owner. |
| Is any household data exposed? | No. The safety context is keyed on the server-authenticated `userId` and never leaves the turn. The prompt block names restrictions the household itself declared, to that household's own assistant. **Member names are not sent** — only the restriction strings and diet patterns. |
| Safety-critical paths? | This *is* the safety-critical path, and it now fails closed in all three places it can fail: an unreadable household refuses every meal, refuses to prompt for food, and refuses every ref. |
| What is the cost of being wrong in the new direction? | A restricted household is shown fewer meals, or on a transient failure none. That is the correct direction to be wrong in, and it is the trade SURF1B already chose for the planner and the starter cookbook. |

---

## 9. Scope Lock

**In scope, delivered:** the meal-recommendation path (discovery engine), the generation constraint (HARD RULE 6 + the always-on safety block), post-generation validation of both return paths, and the Rule T0 fail-open in Food Intelligence.

**Deliberately NOT gated, with reasons** — stated rather than silently skipped:

- **`pantry-discovery`, `shopping-discovery`, `diary-discovery`, `planner-discovery`.** These surface the household's **own recorded data** — what is in their pantry, on their list, in their diary, on their plan. Telling a household what they already own or already logged is not a recommendation, and filtering it would mean THA hiding a household's own data from them, which is a different and worse defect. **If any of these ever begins to *suggest* rather than *report*, it must adopt the gate at that moment.**
- **`household-discovery`** searches *by* restriction ("who has a nut allergy") — reporting, not recommending.
- **The nutrition enrichment "may conflict" insight** is advisory prose over the household's own data and was left as-is.

**Out of scope, nothing attempted:** any new AI capability, model, judge or embedding index; any new safety system or second gate; payments, entitlement or commercial functionality; the cookbook content problem; ingredient-resolution parser defects; the CI/test-runner blocker.

---

## 10. Rollback Plan

| Step | Command |
|---|---|
| Inspect the rollback point | `git show --stat rollback/PROD3-trust-and-safety-completion-20260718` |
| Restore committed state | `git reset --hard rollback/PROD3-trust-and-safety-completion-20260718` |
| Restore the pre-PROD3 working tree | `git stash apply fd880809d679fe8d4c32e5c320f39267281fcba6` |
| Revert only this session's files | `git checkout fd880809 -- server/intelligence/ server/tests/test-intelligence-native-discovery.ts package.json` |
| Remove the new suite | `rm server/tests/test-prod3-companion-restriction-safety.ts` (and its two `package.json` entries) |

**What the tag does not protect** (`ROLLBACK_PROTECTION_PROTOCOL` §3): the tree was dirty at session start — **3 modified tracked files and 32 untracked**. The tag covers committed state only; the snapshot (taken with `git stash create`, non-destructive — the tree was never disturbed) covers the 3 tracked modifications and **none of the 32 untracked files**, which belong to concurrent sessions and were never touched.

Every change is code and test. **No data migration to unwind, no schema change to reverse.** A rollback restores the previous behaviour exactly — including, it should be said plainly, the delivery of gluten-bearing meals to gluten-free households.

---

## 11. Manual Verification

**Setup.** `npm run dev`, sign in as a household with a declared restriction (or add one at Profile → dietary requirements).

1. **The recommendation path.** Ask the Companion *"suggest a pasta dish"* from a gluten-free household. *Expect:* no gluten-bearing meal card. *Must not see:* a pasta bake presented as a suggestion.
2. **Not a blanket refusal.** Ask the same household *"what chicken meals do we have"*. *Expect:* results — the gate removes what conflicts, not everything.
3. **The whole household, not the typist.** Add a restriction to a **child eater with no account**, then ask for a meal containing it. *Expect:* it is withheld. This is the case `household_eaters` exists for and the one most easily missed.
4. **Honest absence.** Search for something the household cannot eat at all. *Expect:* an honest "nothing safe to suggest", never a padded list.
5. **Unrestricted households are unchanged.** Repeat 1–2 as a household with no restrictions. *Expect:* identical behaviour to before this change.
6. **Automated equivalents:**
   `npm run test:prod3-companion-restriction-safety` → 36 passed, 0 failed
   `npm run test:surf1b-dietary-restriction-safety-path` → pass
   `npm run test:intelligence-native-discovery` → 81 passed, 0 failed

---

## 12. User Acceptance Evidence

The acceptance criterion, phrased from the household's side rather than the code's:

> *When I have told THA that someone at my table cannot eat something, will THA ever suggest it to me anyway — and if THA cannot check, will it guess?*

Answered **no** and **no**, with evidence for each:

| Claim | Evidence |
|---|---|
| A meal that violates a hard restriction is not offered | Production engine, live data: 68 candidates refused for "pasta" on a Gluten-Free household; **0 unsafe items leaked** across seven queries |
| The Companion still works | "chicken" unchanged at 15 results; five other queries return 6–11 |
| A child's restriction binds the adult who is typing | `resolveHouseholdSafetyContext` unions account-less eaters (SURF1B, pinned by `surf1b` §"child with no account counts") |
| An unreadable household is refused, not guessed | Forced `unavailable`: 0 returned, 2 withheld, status surfaced; prompt switches to the explicit refusal block |
| The model is told, on every turn | Real captured system prompt (§4.3), from a turn where the household capability was not routed |
| The old unsafe behaviour cannot return | §5 of the new suite pins meal 42 as refused for user 1, in the aggregate suite |

**Test result: 36 passed, 0 failed** (new suite); **30 suites, 0 failures** overall.

---

## 13. Remaining Recommendations — NOT implemented

1. **`npm test` still cannot complete in CI** (~3.7 h vs a 45-minute timeout). **This now matters more than it did yesterday**: PROD3's safety suite is in the aggregate, and an aggregate that cannot run is a safety suite that does not run. Parallelising the runner is the highest-value engineering task in the repository.
2. **Ingredient data quality is now the binding constraint on recommendation breadth.** 1,261 of 1,316 meal templates carry no slot data, so they are withheld from every restricted household. The gate is behaving correctly; the cookbook is the gap. Populating slots (or an `ingredients` column for templates) directly restores choice to exactly the households with the least of it.
3. **`users.diet_restrictions` vs `household_eaters.hard_restrictions`** remains a partial mirror (SURF1B's own §"the defect it exists to fix"). The canonical resolver reconciles them correctly, so this is not a live safety hole — but it is why the naive table count (16 households) understates the true figure (100 gate-active users).
4. **The external/Phase-2 discovery tier does not exist yet.** When it ships, it must adopt the gate **in the same change** — an external recipe provider is the one source with no THA-verified ingredient list, and it is the likeliest way this defect returns.
5. **Not attempted, from LAUNCH1:** the LLM provider's missing timeouts/retries/spend cap; `completion.usage` discarded; the disabled benchmark judge (`D3` safety scored 3/4 for *not throwing*); the unenforced `subscriptionExpiresAt`; the legal/consent base for Art. 9 data — including that **named children's allergies are still transmitted to OpenAI** with no pseudonymisation (`routes.ts:9563`), which PROD3 did not touch and which is now the largest remaining trust exposure in this area.

---

## 14. Provenance

- Rollback: `rollback/PROD3-trust-and-safety-completion-20260718` → `6e326d9f`; snapshot `stash@{0}` → `fd880809`
- Read first: `docs/architecture/README.md` (the mandatory Bootstrap), `LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md` (§2.1, §3.4, §3.5, §5, §7), `PROD2_PRODUCT_COMPLETION_PROGRAMME.md` (§8.1 — the refusal this programme discharges)
- Owner adopted (created by SURF1B, not by this session): `server/lib/household-dietary-safety.ts`
- Idiom followed: `server/lib/meal-service.ts:87-99` (`toSafetyCheckable` + `isSafetyGateActive` short-circuit + "fewer, never unsafe")
- New suite: `server/tests/test-prod3-companion-restriction-safety.ts` (418 lines, 36 assertions, in `npm test`)
- Session record: `.engineering/session/runs/PROD3_Trust_And_Safety_Completion.md`
