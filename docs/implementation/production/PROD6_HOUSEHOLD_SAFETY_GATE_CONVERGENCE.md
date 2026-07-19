# PROD6 — Household Safety Gate Convergence

**Status:** ✅ Complete — both PROD5 bypasses closed, two further bypasses found and closed, browser-verified.
**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Rollback:** `rollback/PROD6-household-safety-gate-convergence-20260718` → `6b93a752` (tag + branch); worktree snapshot `refs/snapshots/PROD6-worktree-20260718` → `4a079acb`
**Governing architecture:** [`README.md`](../../architecture/README.md) bootstrap read; Architecture + AI Architecture Compliance §7.
**Closes:** [`PROD5`](./PROD5_LAUNCH_READINESS_AND_TRUST_VERIFICATION.md) §10.1, §10.2, §10.5.

---

## 1. Executive summary

PROD5 reported two recipe-adaptation endpoints that reached **no safety gate at all**, with a
concrete path to physical harm: a tree-nut household told to use **almond flour**, a sesame
household offered **tahini** — and the result persisted as a row labelled `household-safe-variant`.
It deliberately did not fix them, on the grounds that *a partially repaired allergy gate is more
dangerous than a clearly reported open one*.

**Both are now closed.** So are **two more that PROD5 did not find.**

The four bypasses share one root cause, and it is not a missing rule: **every one of them put the
household's restrictions into an AI prompt and then trusted the answer.** A prompt is an
instruction to a model, not a guarantee about its output. Three of the four also called
`new OpenAI()` directly, outside the governed provider.

PROD6 adds **no restriction, allergen, keyword or matching rule.** Every verdict is produced by
the engines that already existed. The work was *connection*, not construction — which is why the
whole change is 6 files and adds one function to the canonical owner module rather than a new one
beside it.

> ### 🟠 The most important finding is §4 — the two bypasses PROD5 missed.
>
> `/api/suggest-from-ingredients` and `/api/generate-recipe-from-suggestion` **read as covered**:
> both resolve the household server-side, both fail closed when it cannot be resolved (SURF1B),
> both carry the restrictions in the prompt. Neither checked what came back. They were found by
> the new suite asserting the **complement** — *every* food-producing route reaches the gate —
> rather than re-checking the two routes already known to be broken. That assertion is the
> durable deliverable here; the four fixes are the perishable part.

---

## 2. What was wrong

| # | Route | Defect | Source |
|---|---|---|---|
| 1 | `POST /api/planner/entries/:entryId/adapt` | A second, ungoverned LLM surface. Prompt named **5** restrictions while the canonical library carries **13** — sesame, soy, shellfish, eggs, mustard, fish, peanut all absent. Told the model to substitute "using best culinary judgement". **Never re-validated the output.** | PROD5 §10.1 |
| 2 | `POST /api/planner/entries/:entryId/accept-household-safe-variant` | Persisted #1's output as `mealSourceType: "household-safe-variant"` with a `householdSafeFor` snapshot — a row asserting a safety claim about real people that nothing had verified. Also accepted **client-supplied** `userEditedInstructions`, never gated at all. | PROD5 §10.1 |
| 3 | `POST /api/meals/:id/adapt` | Restriction-blind by construction. Exclusions came from **client-supplied** `req.body.memberExclusions`; the live client sends only `{ goal }`, so the list was **empty on every real call**. `recipe-swap-engine.ts` had **zero** restriction references and proposes smoked tofu (soy), soy sauce (soy + gluten), almond flour (tree nut). Also missing a meal-ownership check. | PROD5 §10.2 |
| 4 | `POST /api/suggest-from-ingredients`<br>`POST /api/generate-recipe-from-suggestion` | Restrictions in the prompt, output unchecked. The second returns a **complete recipe card** the household cooks from and can save. | **PROD6 (new)** |

Cross-cutting: `isMealSafeForHousehold` reads **name + ingredients only** — never instructions.
That is correct for recommending an existing meal and wrong for an adaptation, because the method
is exactly what these paths rewrite. *"Serve with warm flatbread and tahini"* was invisible to
every gate in the system (PROD5 §10.5).

### Why 19 green suites missed all of it

They ask *"is the gate correct where it is called?"* — and it is, across 1,656 assertions. None
asked *"does every surface that puts food in front of a household call it?"* `test-prod3-companion-restriction-safety.ts`
asserts by grepping `server/intelligence/` — a directory **none** of the four holes lives in.
THA's safety tests enumerate **consumers**, so they prove what is connected and can never prove
what is missing.

---

## 3. What was built

### `validateAdaptationSafety()` — `server/lib/household-dietary-safety.ts`

A new **view** over the existing matchers, in the canonical owner module — not a second engine
beside it. It defines no allergen. The verdict comes from `candidateHardExcluded()` (the same
matcher the meal gate uses, so an adaptation can never be admitted by a weaker bar than a
recommendation); attribution comes from `resolveIngredientRestrictions` / `resolveTextRestrictions`.

It checks **proposed ingredients and rewritten instructions**, closing the method blindness.

Supporting: `refuseAdaptation()` (fail-closed refusal, distinct from "found nothing"),
`unionHardRestrictions()` (household **+ entry guests**, whose restrictions live on the planner
entry and are invisible to `resolveHouseholdSafetyContext`), and
`renderRestrictionReferenceForPrompt()` — which replaces the hand-written 5-restriction prompt
block with one rendered from the canonical library, carrying `derivedIngredients` /
`hiddenIngredients` (tahini for sesame, casein for dairy). Adding a restriction to the library now
updates every prompt that shows one. **It remains a projection, never an authority** — nothing
downstream trusts that the model read it.

### The five gate points

1. **Generation** (`entries/:entryId/adapt`) — the AI's proposed ingredients *and* rewritten
   method are validated. An unsafe preview is **withheld entirely**, never shown with a warning:
   this object is the sole input to accept-household-safe-variant, so anything reachable is one
   tap from persistence (Rule T0).
2. **Persistence** (`accept-household-safe-variant`) — re-validated on the **final composed**
   ingredients and instructions, not trusted from the preview. Necessary because
   `userEditedInstructions` is client-supplied, `isUpdate` composes against the variant rather
   than the original, and restrictions can change between preview and accept. Refuses **422**.
3. **Swap engine** (`meals/:id/adapt`) — household resolved **server-side**; the client's
   `memberExclusions` is now honoured **additively only** (it can narrow, never widen). *A safety
   input the caller can set is not a safety input.* Replacements are filtered inside the engine
   **and** re-checked at the route. Meal-ownership check added (404, per TRUST1-S3A).
4. **Suggestions** (`suggest-from-ingredients`) — unsafe suggestions dropped, with an honest count
   of what was withheld.
5. **Recipe generation** (`generate-recipe-from-suggestion`) — refused **whole**, not filtered:
   dropping one ingredient leaves instructions that still reference it, which is a broken recipe
   presented as a safe one.

### Honest gaps, not silence

A withheld suggestion is never shown in the act of withholding it — surfacing "we wanted to
suggest almond flour but you're allergic" defeats the gate. But silence is also wrong: a household
that asked for a safe version and got nothing reads it as *"nothing to adapt"*. Every path now
states the gap without the content (Core Principle 6), including a new client branch in
`weekly-planner-page.tsx` driven by `householdSafeUnavailableReason`, which distinguishes
*"we couldn't confirm your household"* from *"no safe version exists"*.

---

## 4. Verification evidence

| Check | Result |
|---|---|
| `test:prod6-safety-gate-convergence` (new, wired into `npm test`) | **76 passed, 0 failed** |
| `test:restriction-resolver` | 335 passed, 0 failed |
| `test:surf1b4-canonical-diet-pattern-safety` | 316 passed, 0 failed |
| `test:restriction-safety` | 75 passed, 0 failed |
| `test:surf1c2-canonical-restriction-matcher-boundary-safety` | 65 passed, 0 failed |
| `test:prod3-companion-restriction-safety` | 36 passed, 0 failed |
| `test:household-vegan-vegetarian-hard-enforcement` | 31 passed, 0 failed |
| `test:smart-suggest-restrictions` | 30 passed, 0 failed |
| **Total** | **964 assertions, 0 failures** |
| `tsc --noEmit` | **94 errors — identical to the pre-PROD6 baseline** (measured by stashing the working tree). Zero in any PROD6-touched file. The 94 are PROD5's documented pre-existing breakage at HEAD. |
| `npm run build` | PASS (4 pre-existing esbuild warnings) |
| Browser | PASS — see below |

### Suite structure

The suite's §1 asserts the **complement**, not a list of known holes: all five food-producing
routes must reach a canonical gate symbol, the four AI paths must call `validateAdaptationSafety`
specifically (because `isMealSafeForHousehold` would pass a method step naming an allergen), and
must fail closed. §7 asserts **one owner** — that `recipe-swap-engine.ts` still contains no
`resolveActiveRestrictions`, no `TRUSTED_SOURCE`, no `ALLERGEN`, and that every one of the 13
canonical restriction ids renders in a prompt reference.

### Browser verification

`scripts/prod6-verify-safety-gate.ts` drives the real planner at 1440×1000 against the dev
household, mocking the adapt endpoint to return **exactly** the withheld-preview shape the server
now produces:

| State | Notice rendered | Withheld content leaked |
|---|---|---|
| `adaptation-violates-restrictions` | ✅ *"We couldn't find a household-safe version of this meal that suits everyone eating it, so we haven't suggested one."* | ❌ none |
| `safety-context-unavailable` | ✅ *"We couldn't confirm your household's dietary needs, so we haven't suggested a household-safe version."* | ❌ none |

Screenshots: `docs/ui-audit/prod6-safety-gate/`. Console errors during the run were the
pre-existing `data-replit-metadata` React.Fragment dev warnings, unrelated to this change.

---

## 5. Remaining risks

1. 🟠 **The route coverage list in §1 of the suite is hand-maintained.** It caught two unknown
   bypasses precisely because it was written as a complement — but the *inventory* of routes is
   still enumerated by a human. A new food-producing endpoint is covered only if someone adds it.
   Deriving the inventory from the route table itself would close this properly; PROD6 did not,
   as it needs a route-classification signal the codebase does not yet carry.
2. 🟠 **Two of these paths still call `new OpenAI()` directly**, bypassing the governed
   `llm-provider` and its observability. PROD6 gated their **output** but did not move them onto
   the provider — that is a refactor beyond this mission's scope, and the safety hole is closed
   either way. It remains an architecture-compliance gap.
3. 🟡 **The gate is only as wide as the canonical library.** A household whose restriction has no
   canonical definition falls back to conservative substring matching, which is correct but
   coarse. Unchanged by PROD6, noted because the gate now depends on it in more places.
4. 🔴 **`tsc` is at 94 pre-existing errors** (PROD5's finding, untouched here). PROD6 adds zero,
   but the project has no clean typecheck to regress *against* — every future session must
   baseline-diff rather than read the number.
5. 🟡 **The swap engine's withheld-swap message is coarse** — it reports a count, not which goal
   became unachievable. A keto household with a tree-nut allergy is told a swap was withheld,
   not that keto is largely unreachable for them without nuts.
6. 🟡 **Not exercised against a live LLM.** Every gate is verified deterministically (unit,
   structural, and browser with a mocked response). No test drives a real model into proposing
   tahini, because that is non-deterministic. The validator is the thing under test and it is
   fully covered; the *integration* with real model output is inferred, not observed.

---

## 6. Files changed

| File | Change |
|---|---|
| `server/lib/household-dietary-safety.ts` | `validateAdaptationSafety`, `refuseAdaptation`, `unionHardRestrictions`, `renderRestrictionReferenceForPrompt` (+151) |
| `server/routes.ts` | Five gate points; server-side household resolution on the swap route; meal-ownership check; canonical prompt reference (+172) |
| `server/lib/recipe-swap-engine.ts` | Accepts server-resolved restrictions; filters replacements through the canonical gate; honest withheld-swap explanation (+60) |
| `shared/meal-adaptation.ts` | `householdSafeUnavailableReason` (+7) |
| `client/src/pages/weekly-planner-page.tsx` | Honest-gap notice for a withheld household-safe version |
| `server/tests/test-prod6-safety-gate-convergence.ts` | New suite, 76 assertions, wired into `npm test` |
| `scripts/prod6-verify-safety-gate.ts` | Browser verification harness |

**No new capability, domain, route, schema or migration.**
