# COMP3 Unified Household Explanations — Implementation

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** No schema, route, capability or gate changes — but it edits user-visible copy on safety-refusal paths across both planes, so a mistake would be read by a household at exactly the moment THA is withholding food from them.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/COMP3-unified-household-explanations-20260719` → `772eb6edc7f2fe7b5ee1e7c0f7a6f54ee2a94360` |
| Working tree | **Intentionally dirty at tag time** — 41 modified tracked files, 2 staged deletions and 15 untracked files from prior sessions (NUTPLAN1, NUTPLAN2, KNOW2, PLAN2, HNP2) were already uncommitted. The tag covers **committed state only** and does **not** capture any of that work. |
| This task's writes | 3 files created, 7 modified (enumerated under IMPLEMENTATION). No file authored by another session was touched except `test-plan2-planner-intelligence-activation.ts`, for the reason given in §Validation. |
| Rollback to committed state | `git checkout rollback/COMP3-unified-household-explanations-20260719` |

> A tag protects committed state only. Because the tree was dirty, `git diff` against
> this tag shows prior sessions' work mixed with this session's. Per-file attribution
> for this task is therefore given explicitly below rather than inferred from a diff stat.

---

## REFERENCE DOCUMENTS READ

- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`
- [x] `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`
- [x] `shared/nutrition/uplift-phrasing.ts` (NUTPLAN2 — the convergence pattern this work follows)
- [x] `server/lib/explainability-service.ts`, `planner-explanation-context.ts`, `planner-compliance.ts`
- [x] `server/intelligence/opportunity-delivery/framework.ts`, `conversation/notice-engine.ts`, `conversation/behaviour-engine.ts`

---

## DISCOVERY — every explanation producer

A full sweep of `server/`, `shared/` and `client/src/` for household-facing
explanation text found **21 producers across five families**. Most were already
correctly owned; the inventory matters because it is what makes the "duplicate
ownership" claim below falsifiable rather than asserted.

| Family | Producers | Ownership verdict |
|---|---|---|
| **Planner "why this meal"** | `explainability-service.ts` (sole author, 14 dimensions) fed facts by `planner-explanation-context.ts` | ✅ Already single-owner. `reasons` is *derived* from `evidence`, so an unsourced sentence is structurally unreachable. |
| **Opportunity** | `opportunity-engine.ts` (11 producer functions), `shared/nutrition/household-nutrition.ts` | ✅ Already single-owner per opportunity type; `opportunity-engine.ts:1137` re-projects the nutrition one verbatim rather than rewording it. |
| **Opportunity delivery** | `opportunity-delivery/framework.ts`, `opportunity-delivery-handler.ts` | ✅ Pass-through only. `DeliveryDecision.reasoning` is authored but documented operator-facing, never shown to a household. |
| **Companion** | `notice-engine.ts` (facts, zero prose) → `behaviour-engine.ts` (`phraseNotice`) → `personality-registry.ts` (template corpus) | ✅ Already converged, and stricter than required: for opportunity, seasonal and learning facts the Companion may only *prefix*, never reword. |
| **Withholding / safety refusal** | **16 authoring sites** | ❌ **The duplication.** See below. |

Also confirmed single-owner and left untouched: `shared/discovery/`, `shared/alternatives/`,
`shared/stories/`, `shared/seasonal/` (each gated by its own fail-closed `trust.ts`),
`shared/relationships/food-graph.ts` (curated corpus), `comparison-engine.ts`.

---

## THE FINDING

Every intelligence surface that filters food must eventually say two things:
*"we left something out, and here is why"*, and *"we could not check, so we are not
guessing"*. Those two sentences were authored **sixteen times** — nine in
`server/routes.ts`, two in `recipe-swap-engine.ts`, three more across the same
files, and **two in the browser**.

Sixteen copies of one sentence is not sixteen times the risk of one; it is the
certainty that they will disagree and the near-certainty that nobody will notice
which one is right. They already had:

**1. A grammar defect in one copy only.** The pairings note read:

> "We left out **1 suggestion that don't suit** your household's dietary needs."

because that copy pluralised the noun (`count === 1 ? "" : "s"`) but hard-coded the
verb as `don't`. Its two siblings — which say the identical thing about *ideas* and
*meals* — agreed correctly. One sentence, three authors, two of them right. No test
could see this, because no test could see all three copies at once.

**2. A client-authored safety claim.** `use-smart-suggest.ts` rendered the server's
withhold note but supplied its own fallback:

```ts
`${withheldCount} left out because ${Array.from(withheldReasons)[0]
  ?? "they don't suit your household's dietary needs"}.`
```

The comment directly above it said the clause "is the SERVER's sentence, rendered
verbatim… the client composes only the count and the connective, **never a claim
about the household's own dietary data**". The `??` fallback made that comment false:
whenever the server sent no note, the browser asserted a dietary-safety conclusion
that no server gate had established. A second client-side copy sat in
`weekly-planner-page.tsx`.

**3. Unexplained drift in the refusal.** For one underlying fact — safety context
unresolved — households were told "can't check" / "could not check" / "couldn't
confirm", "right now" / "just now", with recovery advice present in some copies and
absent in others.

**4. A silently-drifting type.** `MealExplanation` and `PlannerExplanationEvidence`
were declared twice as structural twins with no shared import: `evidence` was
**required** on the server and **optional** on the client, and `dimension` was a
14-member union on the server and a bare `string` on the client. A duplicated *type*
is worse than a duplicated function — a function drifts loudly, but each type copy
type-checks against itself, so nothing can notice the producer and the renderer
disagreeing until a household sees a blank panel.

---

## IMPLEMENTATION

**Created (3):**

- `shared/explanations/household-withholding.ts` (128 lines) — the one owner of the
  withholding/refusal sentence family. Four functions: `withheldClause`,
  `withheldNote`, `nothingSuitableNote`, `safetyUnavailableNote`.
- `shared/explanations/planner-explanation.ts` (90 lines) — the one declaration of
  `MealExplanation`, `PlannerExplanationEvidence`, `PlannerExplanationDimension`.
- `server/tests/test-comp3-unified-household-explanations.ts` (222 lines) — 19 assertions.

**Modified (7):**

| File | Change |
|---|---|
| `server/routes.ts` | 14 authored literals → 19 owner calls |
| `server/lib/recipe-swap-engine.ts` | 2 authored literals → owner calls |
| `client/src/hooks/use-smart-suggest.ts` | client-authored safety fallback → `withheldClause` |
| `client/src/pages/weekly-planner-page.tsx` | client-authored refusal → `safetyUnavailableNote` |
| `server/lib/explainability-service.ts` | types moved to `shared/`; adds `GeneratedMealExplanation` |
| `client/src/lib/planner-types.ts` | twin declarations deleted; imports the one declaration |
| `server/tests/test-plan2-planner-intelligence-activation.ts` | assertion re-pointed at the owner (see Validation) |
| `package.json` | registers `test:comp3-unified-household-explanations` in `test:*` and the aggregate `test` |

**Both invariants preserved, not flattened.** The optionality conflict was not a
mistake by either side — it was two true statements about two different moments. The
producer *always* emits `evidence` (`reasons` is derived from it); a reader may
legitimately find a pre-PLAN1 persisted session *without* one. So the shared wire
shape keeps `evidence` optional (honest about what a reader may find), and the
producer's stronger guarantee is restated at the producer as
`GeneratedMealExplanation`, which narrows it back to required. **Converging a type
must not weaken the guarantee its owner actually offers.**

---

## ARCHITECTURE CONVERGENCE STATUS

```
Domain:                        Household explanation wording
Current Canonical Owner:       shared/explanations/household-withholding.ts (wording)
                               shared/explanations/planner-explanation.ts (shape)
                               server/lib/explainability-service.ts (planner authorship — UNCHANGED)
Current Runtime Consumer(s):   server/routes.ts (19), recipe-swap-engine.ts (3),
                               use-smart-suggest.ts (2), weekly-planner-page.tsx (2)
Duplicate Owners Remaining:    NONE for this family — enforced by scan (§1)
Duplicate State Remaining:     NONE
Duplicate Workflows Remaining: NONE
Current Convergence (%):       100% — 16 of 16 authored copies retired; a repo-wide
                               scan for the sentence family returns zero files
                               outside the owner
Target Convergence (%):        100%
Next Planned Milestone:        Companion planner-explanation access (see NEXT STEPS)
Remaining Architectural Risks: The Companion cannot explain a planner decision —
                               reported below, deliberately NOT built under this
                               scope lock
```

---

## VALIDATION PERFORMED

| Command | Result |
|---|---|
| `npx tsx server/tests/test-comp3-unified-household-explanations.ts` | **19 passed, 0 failed** |
| `npm run test:plan2-planner-intelligence-activation` | **23 passed, 0 failed** (was 22 — one assertion added) |
| `npm run test:plan1-planner-intelligence` | 58 passed, 0 failed |
| `npm run test:planner-compliance` | 25 passed, 0 failed |
| `npm run test:prod6-safety-gate-convergence` | 158 passed, 0 failed |
| `npm run test:smart-suggest-restrictions` | 30 passed, 0 failed |
| `npm run test:restriction-safety` | 75 passed, 0 failed |
| `npm run test:household-vegan-vegetarian-hard-enforcement` | 31 passed, 0 failed |
| `npm run test:surf1b-dietary-restriction-safety-path` | 54 passed, 0 failed |
| `npm run test:prod3-companion-restriction-safety` | 36 passed, 0 failed |
| `npm run test:intelligence-notice-engine` | 65 passed, 0 failed |
| `npm run test:intelligence-opportunity-delivery-binding` | 60 passed, 0 failed |
| `npm run test:intelligence-companion-actions` | 93 passed, 0 failed |
| `npm run test:nutplan1` / `nutplan2` / `hnp2…` / `uplift` / `mat1…` / `dec1…` / `attn1…` / `comp2…` | all pass, 0 failed |
| `npm run build` | **OK** (4 pre-existing `import.meta`/cjs warnings, unrelated) |
| `npx tsc --noEmit` | **88 errors — 0 introduced.** Zero in any file this task touched. |
| `bash .engineering/scripts/repo-structure-verify.sh` | 2 FAILs — **both pre-existing** |

**On the 88 tsc errors.** None are in `routes.ts`, `explainability-service.ts`,
`planner-types.ts`, `use-smart-suggest.ts`, `weekly-planner-page.tsx`,
`recipe-swap-engine.ts` or `shared/explanations/`. Six *mention*
`explainability-service` — stale tests importing `generateRecipeExplanation`,
`generatePantryExplanation`, `RecipeExplanation`, `PantryExplanation` and
`EMPTY_PANTRY_HOUSEHOLD_FACTS`. Verified against the rollback tag: **none of those
five symbols existed there either**, so those tests were already broken and this work
neither caused nor worsened them.

**On the 2 structure FAILs.** `docs/implementation/` and `docs/investigations/` have
loose files. Verified by `git ls-tree` against the rollback tag: the lists are
**byte-identical** to the current ones. Pre-existing, and this report is filed
correctly under `docs/implementation/companion/`, so it does not add to them.

**On editing another session's test.** `test-plan2-planner-intelligence-activation.ts`
(uncommitted, PLAN2) asserted the no-restriction-named rule by grepping `routes.ts`
for a **double-quoted `withheldNote:` literal**. Convergence replaces that literal
with a function call, so the regex would find nothing and the assertion would fail.
The rule was not weakened to accommodate the change — it was **strengthened and
re-pointed at the owner**. The old form could only ever see *one* of the sixteen
copies, so fifteen could have named a restriction and it would still have passed. It
now checks every string the family can produce, plus a new assertion that the
smart-apply gate reads from the owner rather than a local literal (22 → 23).

---

## DEFINITION OF DONE

- **Success:** one owner for the withholding sentence family; one declaration for the
  explanation shape; no client authors a claim about household dietary data; a scan
  makes the convergence self-enforcing.
- **Must not break:** every safety gate still fails closed; withheld counts still
  surface; planner scoring untouched; the Companion still may not reword a producer's
  explanation.
- **Manual test:** apply a smart plan for a household with a hard restriction where at
  least one candidate is withheld → the toast reads "*N left out because …*" with the
  server's clause. Force safety-context failure → each surface refuses with the same
  wording rather than returning an empty list.

**Self-enforcement (§1.4).** Converging sixteen copies once is worth little if the
seventeenth can be written tomorrow — which is exactly how there came to be sixteen.
§1 scans both planes and fails on any authored copy outside the owner. §1.4 **plants**
a violating string and requires the scan to catch it, so a scan that has silently
stopped matching cannot pass by finding nothing.

---

## DATA IMPACT

- Reads existing data: **NO** (the owner never sees a restriction, member or meal)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## TRUST CHECK

- **Could this mislead the user?** Less than before. One copy told households
  "1 suggestion that don't suit"; that is now grammatical everywhere.
- **Could this fabricate certainty?** The opposite — it removes the one place THA
  fabricated a safety claim. The browser can no longer assert a dietary conclusion
  no server gate reached.
- **Is anything guessed but shown as real?** No. The owner takes what the caller's
  gate already decided and words it. It has no access to household data.
- **What happens if the system is wrong?** Every converged site still fails closed
  and refuses, as before. `safetyUnavailableNote` now *requires* a `consequence` —
  a refusal that does not say what it cost the household is not an explanation.
- No architectural duplication introduced: **NO** (16 → 1, and 2 type twins → 1)
- No new source of truth created: **NO** — wording and shape moved to one place;
  `explainability-service.ts` remains the sole author of planner explanations
- No runtime behaviour altered: **user-visible copy changed** — declared below
- Every "verified" claim backed by a command that ran: **YES**

### Copy changes, declared

Convergence necessarily normalises wording. Preserved verbatim wherever copies agreed.
Changed where they disagreed:

| Site | Before | After |
|---|---|---|
| Pairings note (singular) | "1 suggestion that **don't** suit…" | "1 suggestion that **doesn't** suit…" — **defect fix** |
| Pairings refusal | "We **could not** check … **just now**, so we **are not** suggesting anything to go with this." | "We **can't** check this against … **right now**, so we're not suggesting anything to go with it." |
| Swap refusal | "We couldn't **confirm** …, so we haven't suggested any swaps." | "We can't **check these swaps against** … right now, so we haven't suggested any." |
| Adapt-persist refusal | "We couldn't **confirm** …, so we haven't saved this version." | "We can't **check this version against** … right now, so we haven't saved it." |
| Uplift batch refusal | "We can't check ingredient suggestions against … right now." *(no consequence)* | "…, so we haven't suggested any." — **now states what it cost** |
| Swap suffix | "N further swaps **were withheld** — they don't suit…" | "**We left out** N further swaps that don't suit…" |

No copy change alters what is withheld or why — only how it is said.

---

## SCOPE LOCK

- **Implemented scope:** discovered every explanation producer; converged the one
  duplicated family (16 → 1); converged the twin explanation type (2 → 1); removed
  the two client-authored safety claims; made the convergence self-enforcing.
- **Explicitly excluded scope:**
  - **No new explanation engine.** Both new modules are *ownership* modules, not
    engines: they hold no facts, take no decisions, read no household data, and
    produce no new sentence that did not already exist. This is the pattern
    `shared/nutrition/uplift-phrasing.ts` established under NUTPLAN2 (five copies →
    one), applied to a family sixteen copies wide.
  - **No planner scoring change.** `meal-scoring-service.ts` and every weight,
    threshold and ranking rule are untouched; `test:plan1-planner-intelligence` (58)
    and `test:planner-compliance` (25) confirm it.
  - **No gate, route, schema, migration or capability change.**

**SUGGESTION — the one gap found and deliberately not closed.**
`generateMealExplanation` has **exactly one consumer**: `smart-suggest-service.ts` →
`routes.ts` → the planner UI. Nothing in `server/intelligence/conversation/` can reach
it. **The Companion therefore cannot answer "why is this meal in my plan?"** — the
planner's evidence trail exists, is well-owned and is unreachable from the surface a
household is most likely to ask on.

This is objective 4 ("Companion uses the same explanation service") only *partly*
satisfied: the Companion already shares the same explanation service for
**opportunities** (verified — it projects verbatim and may not reword), but has **no
path at all** to **planner** explanations. Closing it means wiring a new Companion
capability to an existing service. That is a capability addition, and this scope lock
forbids new engines and permits only ownership convergence — so it is reported, not
built. **Recommend a follow-on (COMP4) with its own rollback and registry review.**

---

## OUTCOME

THA now has one place that decides how it tells a household it withheld food, and one
declaration of the shape a planner explanation travels in. Sixteen authored copies of
the withholding sentence became one, and a repo-wide scan — which plants a violation
to prove it can still see one — fails the build if a seventeenth is written. Two of
those copies were in the browser, including a fallback where the client asserted a
conclusion about the household's dietary data that no server gate had established;
that is gone. The convergence immediately paid for itself by exposing a defect that
was invisible while the copies were separate: one surface had been telling households
"we left out 1 suggestion that **don't** suit your household's dietary needs", while
its two siblings said the same thing correctly. And the discovery pass that found all
this also found what was *already* right — the Planner, Opportunity and Companion
explanation paths each had exactly one owner, with the Companion structurally
forbidden from rewording what a producer said. The one real gap it surfaced is that
the Companion cannot reach the planner's explanation at all, which is now written
down rather than assumed.

---

## NEXT STEPS

1. **Nothing is committed.** All COMP3 work is uncommitted, on a tree that was already
   dirty with five prior sessions' work. Committing requires user approval, and the
   commit should be scoped to the 10 COMP3 files so prior sessions' work is not swept in.
2. **Nothing is pushed or deployed.** No deployment approval sought.
3. **COMP4 (recommended):** give the Companion a path to `generateMealExplanation`
   so "why is this meal in my plan?" is answerable in conversation. Needs its own
   rollback, scope lock and Product Registry review — it adds a capability.
4. **Unrelated, pre-existing, worth a ticket:** 88 `tsc` errors (chiefly stale test
   imports in `test-plan2-planner-evolution.ts`, `test-pantry1-intelligent-pantry.ts`
   and `test-cbk2-intelligent-cookbook.ts`, referencing symbols that do not exist at
   the rollback tag), and 2 repository-structure violations from loose files under
   `docs/implementation/` and `docs/investigations/`.
