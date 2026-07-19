# COMP4 Planner Conversation Activation — Implementation

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** No schema, scoring or selection change — but it puts a planner explanation in front of households through a new conversational path, and changes an existing capability's result contract and one existing test's assertions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/COMP4-planner-conversation-activation-20260719` → `772eb6edc7f2fe7b5ee1e7c0f7a6f54ee2a94360` |
| Supplementary snapshot | `scratchpad/pre-COMP4-snapshot/` — `tracked-changes.patch` (280,826 bytes) + `untracked.tar.gz` (23 files) |
| Working tree | **Intentionally dirty.** 66 changed paths from six prior sessions (NUTPLAN1/2, KNOW2, PLAN2, HNP2 and **COMP3**) were already uncommitted. |
| This task's writes | 8 files modified, 2 created (enumerated below) |
| Rollback to committed state | `git checkout rollback/COMP4-planner-conversation-activation-20260719` |

> **The tag resolves to the same commit as COMP3's**, because HEAD has not moved —
> COMP3 was never committed. A `git checkout` of this tag therefore discards COMP3 as
> well as COMP4. That is why the scratchpad snapshot exists: it restores the exact
> pre-COMP4 working tree (COMP3 included), which the tag alone cannot do. To revert
> COMP4 only: `git checkout <tag>`, apply `tracked-changes.patch`, untar `untracked.tar.gz`.

---

## REFERENCE DOCUMENTS READ

- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`
- [x] `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`
- [x] `docs/implementation/companion/COMP3_UNIFIED_HOUSEHOLD_EXPLANATIONS.md` (this work's parent)
- [x] `server/lib/explainability-service.ts`, `planner-explanation-context.ts`, `meal-scoring-service.ts`
- [x] `server/intelligence/` — `capability-registry.ts`, `intent-engine.ts`, `pattern-intent-resolver.ts`, `handlers/planner-read-handler.ts`, `handlers/opportunity-delivery-handler.ts`, `conversation/conversation-gateway.ts`, `context/context-composition-engine.ts`

---

## INVESTIGATION — every conversational path that can answer a planner question

| Path | What it does today | Verdict |
|---|---|---|
| `opportunity-delivery:explain` (`opportunity-delivery-handler.ts:203`) | Recomputes live opportunities, finds the card by id, returns the producer's `explanation`/`evidence` **verbatim**; honest gap if no longer live | ✅ **Already correct.** Left untouched — this is the pattern COMP4 copies. |
| `planner:explain` (`planner-read-handler.ts:220`) | Registered, bound, executable — but returned **only** `planner_entries.adaptation_result` | ❌ **Duplicate rationale source, and unreachable.** See below. |
| `planner:read` / `planner-discovery:search` | Return plan **contents** | ⚠️ Where "why?" questions actually landed. |
| LLM system prompt (`conversation-gateway.ts:1241-1277`) | Told to "SYNTHESISE… connect the facts" and "EXPLAIN THE 'WHY'" | ❌ **This is what answered "why this meal?"** |
| `explainability-service.ts` | The canonical owner, 14 cited dimensions | ❌ **One consumer only** — `smart-suggest-service.ts`. Unreachable from any conversation turn. |

### The three findings

**1. `planner:explain` was executable but resolver-unreachable.** A live, permission-checked,
ownership-walked handler with **no matcher pointing at it**. Every `explain` matcher in
`pattern-intent-resolver.ts` belonged to `nutrition-knowledge` or the opportunity
short-circuit; `PLANNER_MATCHERS` emitted `verb: "read"` only. The capability had been
built and never wired to a question.

**2. Its honest gap was asserting something false.** When an entry had no
`adaptation_result` — i.e. every ordinarily-planned meal, since that column is written
only by "Tailor for household" — it returned:

> *"the Planner records no selection rationale for this meal … The Intelligence Platform will not fabricate one."*

The Planner **did** record reasoning for that meal. It was on the Planner's own screen,
fully cited, produced by `explainability-service.ts`. What was missing was the wiring,
not the knowledge. An honest gap that reports the platform's own plumbing as an absence
of knowledge is not honest — it is a confident false statement, and it is worse than
silence because it forecloses the question.

**3. So the model answered instead.** With `planner.read` supplying the plan's contents
and the prompt instructing it to explain the why, the LLM produced a plausible rationale
from meal names and the household profile. Rule 1 ("answer ONLY from the CONTEXT DATA")
was satisfied — the context simply never contained the actual reason, and nothing told
the model that planner selection rationale was a distinct thing it had not been given.
**The explanation a household read was the model's, not THA's.**

---

## THE CONSTRAINT THAT SHAPED THE DESIGN

**Planner explanations are never persisted.** `MealExplanation` is generated inside the
suggest loop, returned in the `POST /api/smart-suggest` response body, and discarded.
There is no suggest-session table (95 tables checked), and `planner_entries` has no
explanation column. Once a meal is committed, the explanation it was chosen with is gone.

Persisting it would be a schema change, which this work is not permitted to make. So the
only way to give the Companion the Planner's explanation is to **recompute it from the
same owner** — exactly what `opportunity-delivery-handler` already does for opportunity
cards. This is not a workaround; it is the established THA pattern for explaining a
decision whose explanation is not stored.

It does bound the claim, and the bound is stated in the code, not just here: what the
Companion can truthfully offer is the explanation for this meal **as the plan stands
now** (`asOf: "current-week"`), not a recovered historical answer.

---

## IMPLEMENTATION

**Created (2):**
- `server/tests/test-comp4-planner-conversation-activation.ts` — 24 assertions
- `docs/implementation/companion/COMP4_PLANNER_CONVERSATION_ACTIVATION.md`

**Modified (8):**

| File | Change |
|---|---|
| `server/lib/planner-explanation-context.ts` | `+buildPlannerWeekState(meals, targets)` — the batch form of the week-state rule, plus `PlacedMeal` / `PlannerWeekTargets` |
| `server/intelligence/handlers/planner-read-port.ts` | `+explainPlannerEntry()` — delegates to the canonical owner; `+CanonicalPlannerExplanation` |
| `server/intelligence/handlers/planner-read-handler.ts` | `explainSelection` asks the canonical owner first; adaptation note reported beside it; gap corrected |
| `server/intelligence/pattern-intent-resolver.ts` | `+resolvePlannerExplain()` — the planner twin of the opportunity short-circuit |
| `server/intelligence/intent-resolver.ts` | `+selectedPlannerEntryId` on `IntentResolutionHints` |
| `server/intelligence/conversation/conversation-gateway.ts` | passes the pointer from frame → hints |
| `server/tests/test-intelligence-planner-binding.ts` | port fake implements the new method; assertions updated (see Validation) |
| `package.json` | registers `test:comp4-planner-conversation-activation` |

### The chain, and why nothing is re-authored

`explainPlannerEntry` composes the Planner's **own** owners, in the Planner's own order:

```
convertMealToCandidate  (meal-scoring-service — the planner's mapper)
  → scoreMeal           (meal-scoring-service — READ-ONLY; no weight touched)
  → buildPlannerExplanationContext  (the existing fact supplier)
  → buildPlannerWeekState           (the batch form, §3-verified)
  → generateMealExplanation         (THE CANONICAL OWNER — returns verbatim)
```

Not one sentence is authored on this path. The Companion gets the same object the
Planner would **because it is produced by the same function** — which is what §2 of the
test proves, by running both calls over identical inputs and requiring deep equality
rather than resemblance.

### Duplicate explanation ownership removed

`planner:explain` previously presented `adaptation_result` as **the** rationale, under
`source: "planner-household-adaptation"`. That made a second planner rationale source
look like the planner's explanation. It is a genuinely different fact — *what changed for
the household*, not *why this meal was selected*. Blending them would let "swapped to a
nut-free variant" be read as the reason a meal was chosen. They are now returned side by
side under `sources`, each named, with the canonical explanation leading.

### No duplicate conversation state

The entry pointer COMP4 needs **already existed** — `selectedPlannerEntryId`, added by
COMP_ACT2 as a write-action target, already plumbed client → routes → frame assembler,
and already published by `weekly-planner-page.tsx:1668` when an entry drawer is open. I
initially added a second one and the compiler caught it; the duplicate was removed and
the existing pointer reused. **COMP4 adds no client code and no new conversation state** —
the path is end-to-end today through the pointer that was already there.

---

## ARCHITECTURE COMPLIANCE

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:                        Planner decision explanation
Current Canonical Owner:       server/lib/explainability-service.ts (UNCHANGED)
Current Runtime Consumer(s):   smart-suggest-service.ts (Planner UI)
                               planner-read-port.ts → planner:explain (Companion) ← NEW
Duplicate Owners Remaining:    NONE — adaptation_result reclassified as a distinct
                               named fact, not a rival explanation
Duplicate State Remaining:     NONE — reuses COMP_ACT2's existing pointer
Duplicate Workflows Remaining: NONE
Current Convergence (%):       100% — both consumers call one function; proven by
                               deep-equality test, not by inspection
Remaining Architectural Risks: Explanations are not persisted, so no consumer can
                               reproduce a historic decision. Declared, not hidden.
```

- Preserve one canonical explanation owner — **YES**, `explainability-service.ts` untouched
- Preserve one owner per fact — **YES**; the one new derivation is equivalence-tested (§3)
- Extend the existing Intelligence Platform — **YES**; existing capability, verb, port, pointer
- No duplicate conversation state — **YES**; the duplicate I wrote was caught and removed
- No duplicate planner logic — **YES**; `scoreMeal` and `convertMealToCandidate` reused, not reimplemented

---

## OBJECTIVES — what was delivered, and what was not

| Question | Status |
|---|---|
| **Why this meal?** | ✅ **Delivered.** `planner:explain` → canonical owner, pointer-gated. |
| **Why was this opportunity shown?** | ✅ **Already worked** before COMP4. Verified, untouched. |
| **Why wasn't this meal chosen?** | ❌ **Not delivered.** Counterfactual. The planner does not retain rejected candidates — `scored` is a local array discarded when the loop ends. Answering would require either persisting the candidate pool (schema) or re-running selection (forbidden). Currently reaches no matcher and returns an honest "no route". |
| **Why was this swap suggested?** | ❌ **Not delivered.** `recipe-swap-engine.ts` authors swap explanations server-side, but no capability is registered for swaps, so there is nothing for a resolver to route to. Needs a capability registration, which is an addition rather than an activation. |
| **Why was something withheld?** | ⚠️ **Partial.** COMP3 made the wording single-owner and every withhold surfaces a note on its own surface; there is no conversational route that answers it on request. |

Three of five are not delivered. Each would need work this scope lock excludes — a
schema change, or a new capability registration. Reported rather than approximated:
routing a question to a path that cannot truthfully answer it would reintroduce exactly
the fabrication COMP4 exists to remove.

---

## VALIDATION PERFORMED

| Command | Result |
|---|---|
| `npx tsx server/tests/test-comp4-planner-conversation-activation.ts` | **24 passed, 0 failed** |
| `npm run test:intelligence-planner-binding` | **35 passed, 0 failed** (was 34; contract updated) |
| `npm run test:comp3-unified-household-explanations` | 19 passed, 0 failed |
| `npm run test:intelligence-context-composition` | 166 passed, 0 failed |
| `npm run test:intelligence-companion-actions` | 93 passed, 0 failed |
| `npm run test:intelligence-notice-engine` | 65 passed, 0 failed |
| `npm run test:plan1-planner-intelligence` | 58 passed, 0 failed |
| `npm run test:intelligence-read-kit` | 50 passed, 0 failed |
| `npm run test:intelligence-planner-discovery-binding` | 40 passed, 0 failed |
| `npm run test:intelligence-platform` | 33 passed, 0 failed |
| `npm run test:plan2-planner-intelligence-activation` | 23 passed, 0 failed |
| `npm run test:planner-compliance` | 25 passed, 0 failed |
| `npm run test:intent-resolver` / `intelligence-conversation-gateway` / `comp2-natural-conversation` | pass, 0 failed |
| `npm run build` | **OK** (4 pre-existing `import.meta`/cjs warnings) |
| `npx tsc --noEmit` | **88 errors — baseline exactly restored, 0 introduced** |
| `npm run test` (full aggregate, 160 suites) | **Exit 1.** Ran **98** reporting suites; **97 clean**, halting on ONE pre-existing failure — see below |
| 57 suites downstream of the blocker, run directly | **57/57 pass** |
| **Net across the whole aggregate** | **154 suites pass; 1 pre-existing failure; 0 caused by COMP4** |

**On the aggregate suite — a pre-existing blocker, and how it was ruled out.**
`npm run test` chains 160 suites with `&&`. It halts at suite **103**,
`test:benchmark-conversation-isolation`, which reports **24 passed, 2 failed** and exits
1, so the **57 suites after it never run at all**. Both failures are `entityRefs`
assertions unrelated to planner explanation.

Because COMP4 modifies the conversation gateway and the context frame assembler, "it
looks unrelated" was not good enough. The pre-COMP4 working tree was **reconstructed from
the scratchpad snapshot** into a separate directory (`git archive` of the tag +
`git apply` of the tracked patch + untar of the untracked files), verified to contain no
COMP4 code (`grep resolvePlannerExplain` → 0, `grep explainPlannerEntry` → 0), and the
same suite run against it. It produced the **identical two failures**. The blocker is
therefore pre-existing and independent of COMP4.

Because those 57 suites cannot run in the chain, they were **run directly instead** —
all 57 pass. Combined with the 36+ suites the aggregate completed before halting and the
15 targeted suites above, the regression evidence is real rather than inferred from an
exit code.

**A caution about that exit code — it misled twice.** An earlier reading of the suite
recorded "exit 0". That was wrong: the command had been piped through `grep`, so `$?` was
*grep's* status, not the suite's. Re-checked without the pipe, the suite exits **1**.

The same trap then reappeared at a larger scale: a background run of the full aggregate
was reported as "exit code 0", but that was the status of the compound command's trailing
`echo`, not of `npm`. The captured value was **`AGGREGATE EXIT: 1`**.

Both readings would have reported a green aggregate that does not exist. The final,
directly captured figures are: **98 reporting suites executed, 97 of them with zero
failures, one failing suite (the pre-existing blocker) halting the chain, and 57 suites
verified separately behind it** — 154 passing suites in total, none broken by COMP4. The
lesson is recorded here rather than smoothed over: an exit code is only evidence if you
know which process it belongs to.

**On `tsc`.** COMP4 momentarily introduced one error (88 → 89): the in-memory port fake
in `test-intelligence-planner-binding.ts` did not implement the new port method. That is
the type system doing its job — a new port obligation must be met by every implementer.
Fixed by implementing it in the fake; count returned to exactly 88, verified by diffing
per-file error counts against the COMP3 baseline.

**On changing an existing test's assertions.** `test-intelligence-planner-binding.ts`
asserted `explain entry with NO recorded rationale → honest gap`. COMP4 makes that entry
answerable, so the assertion had to change — and it is important to be clear that **the
old assertion was locking in a falsehood**. It asserted that THA correctly reported
having no reasoning for a meal it demonstrably had reasoning for. The replacement asserts
the new truth *and* keeps a real honest-gap case: a third fixture entry (`5002`) whose
meal row cannot be read, where neither owner can speak and the gap must still fire. The
gap path is therefore still tested, not deleted. Test count 34 → 35.

---

## DEFINITION OF DONE

- **Success:** a household with a planner entry open can ask "why this meal?" and receive
  THA's own cited explanation, identical to the Planner's, or an honest gap.
- **Must not break:** planner scoring, selection and opportunity ranking; the read-only
  boundary of the planner binding; ownership scoping; the opportunity explain path.
- **Manual test:** open a planner entry drawer → ask the Companion "why this meal?" →
  the answer is the Planner's cited reasons. Ask on a foreign entry id → denied. Ask
  about an entry whose meal row is missing → honest gap, no invented reason.

---

## DATA IMPACT

- Reads existing data: **YES** (planner entries, meals, preferences, pantry, seasonality)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Schema changes: **NONE**

---

## TRUST CHECK

- **Could this mislead the user?** Materially less than before. The previous answer was
  model-generated; this one is THA's own cited explanation. The residual risk — that the
  week has changed since the meal was planned — is named in the payload (`asOf`).
- **Could this fabricate certainty?** No. Every reason is derived from cited evidence;
  §2 re-asserts Rule E1 on this new path specifically.
- **Is anything guessed but shown as real?** No. The three unrecoverable inputs
  (`fishTarget`, `redMeatTarget`, `weeklyBudget` — transient request settings) are passed
  as `null`, so their dimensions go **silent** rather than being defaulted. Defaulting
  them to `0` would make "you have had 2 of 0 fish meals" reachable. §5 asserts this.
- **Honest gaps where explanations are unavailable?** Yes, and the gap message was
  corrected: it no longer claims an absence of knowledge when only the wiring was absent.
- **What happens if the system is wrong?** The ownership walk still denies foreign
  entries; a port failure degrades to `null` and then to an honest gap, never to a
  fabricated reason.
- No architectural duplication introduced: **NO** (one duplicate pointer written, caught by the compiler, removed)
- No new source of truth created: **NO**
- Every "verified" claim backed by a command that ran: **YES**

---

## ROLLBACK PLAN

- **Identifier:** `rollback/COMP4-planner-conversation-activation-20260719` → `772eb6ed…`
- **Files modified:** the 8 listed above; 2 created
- **Commands:** `git checkout rollback/COMP4-planner-conversation-activation-20260719`,
  then re-apply `scratchpad/pre-COMP4-snapshot/tracked-changes.patch` and untar
  `untracked.tar.gz` to restore COMP3 and the other five sessions' work
- **Verification after rollback:** `npm run test:intelligence-planner-binding` returns to
  34 assertions; `npx tsc --noEmit` returns 88; `grep resolvePlannerExplain` finds nothing

---

## SCOPE LOCK

- **Implemented scope:** investigated every conversational planner path; connected the
  Companion to the existing explanation owner through the existing port; routed the
  question via the existing pointer; removed the duplicate rationale presentation;
  corrected a dishonest gap; proved single ownership by deep equality.
- **Explicitly excluded:**
  - **No new explanation engine** — `explainability-service.ts` is byte-unchanged. The one
    function added (`buildPlannerWeekState`) builds an *input*, authors no sentence, and
    is equivalence-tested against the incremental form it mirrors.
  - **No planner scoring change** — `meal-scoring-service.ts` unchanged; `scoreMeal`
    called read-only. `test:plan1-planner-intelligence` (58) and `test:planner-compliance` (25) confirm.
  - **No planner selection change** — the smart-suggest loop is untouched.
  - **No Opportunity ranking change** — `opportunity-engine.ts` and the delivery framework untouched.
  - **No schema, migration or client change.**

**SUGGESTION (needs approval, not implemented):**
1. **A "Why this?" affordance on the planner entry**, mirroring `FoodOpportunityCard`'s
   button. Today the path works only if the household happens to ask while a drawer is
   open — discoverable by accident rather than by design. UI work, hence excluded.
2. **Persisting the explanation** (`planner_entries.explanation` or a suggest-session
   table) is the only way to answer "why was this chosen *at the time*" and to make
   "why wasn't X chosen?" answerable. Schema change — a separate workstream.
3. **Registering a swap capability** so swap explanations become conversationally reachable.

---

## OUTCOME

The Companion can now answer "why is this meal in my plan?" with THA's own explanation
instead of the language model's. The capability to do so had existed and been bound for
some time — what was missing was a question routed to it, and the reasoning it returned
was the wrong fact. Both are fixed: the question now short-circuits to `planner:explain`
whenever a household is looking at one specific entry, and that handler now asks the
canonical explanation owner first, reporting the household-adaptation note beside it as
the separate thing it is. Because both the Planner and the Companion call the same
function, their answers are identical by construction rather than by agreement, and the
test proves it by deep equality rather than by comparing sample sentences. The change
also removed a small dishonesty that had been sitting in the platform's most
trust-sensitive machinery: an "honest gap" that told households the Planner had recorded
no reasoning for a meal, when in fact it had a full cited evidence trail and only the
wiring was missing. Three of the five example questions remain unanswered, each for a
concrete structural reason that is now written down rather than assumed.

---

## NEXT STEPS

1. **The aggregate suite cannot complete, for a pre-existing reason.**
   `test:benchmark-conversation-isolation` (suite 103 of 160) fails on two `entityRefs`
   assertions and halts the `&&` chain, hiding the 57 suites behind it. Proven
   pre-existing by re-running it against a reconstruction of the pre-COMP4 tree. Those
   57 were run directly and all pass, so COMP4 is verified — but **the repository's
   headline `npm run test` is red before this change and remains red after it**, and
   that should be fixed on its own ticket rather than folded into a planner workstream.
2. **Nothing is committed or pushed.** COMP3 and COMP4 are both uncommitted, on a tree
   already carrying five other sessions' work. A commit should be scoped deliberately.
3. **Approval needed** for the three suggestions above, particularly the "Why this?"
   affordance — without it the capability is reachable but not discoverable.
4. **Unrelated, pre-existing:** 88 `tsc` errors and 2 repository-structure violations,
   both unchanged and both documented in the COMP3 report.
