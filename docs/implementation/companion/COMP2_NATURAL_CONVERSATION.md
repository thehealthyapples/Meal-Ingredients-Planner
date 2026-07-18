# COMP2 — Natural Conversation — Implementation

**Date:** 2026-07-09
**Branch:** int1-intelligence-platform
**Risk:** 🟢 GREEN
**Reason:** Additive, read-only intent matchers on the EXISTING `PatternIntentResolver`, mapped onto capabilities and verbs the Capability Registry already registers and executes. No new capability, no new verb, no new gap kind, no new engine, no conversation state, no knowledge store, no schema change, no write path, no UI change.

> **Identifier note.** The identifier `COMP2` was already used, on 2026-07-06, for
> `docs/investigations/intelligence/COMP2_PLATFORM_KNOWLEDGE_ACTIVATION_AUDIT.md` (an audit) and its
> implementation `docs/implementation/intelligence/COMP2A_RESOLVER_MATCHER_ACTIVATION.md`. That is a
> **different workstream**. This document uses the distinct filename
> `COMP2_NATURAL_CONVERSATION.md` and overwrites nothing. The collision is recorded here
> rather than silently resolved; renaming either workstream is a governance decision.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-comp2-natural-conversation-20260709` → `6795a0c4a65acf5e7983945ab5c63dfe9a1bb4eb` (== COMP1 commit, == HEAD at start) |
| Working tree | Intentionally dirty — the uncommitted **KNOW4** workstream (`client/src/components/FoodReport.tsx`, `server/lib/food-intelligence-assembler.ts`, `server/lib/meal-intelligence-assembler.ts`, `server/routes.ts`, `server/tests/test-food-report-adapter.ts`, `shared/canonical/food-report-adapter.ts`, `shared/knowledge/index.ts`, `shared/knowledge/food-relationships.ts`, `server/tests/test-know4-graduated-food-reports.ts`, `docs/implementation/knowledge/KNOW4_GRADUATED_KNOWLEDGE_FOOD_REPORTS.md`, and KNOW4's `package.json` test-script line) pre-dates this task and is left untouched |
| This task's writes | **New:** `server/tests/test-comp2-natural-conversation.ts`, this document. **Edited:** `server/intelligence/pattern-intent-resolver.ts` (COMP2 matchers + clarifiers + step-order change only, +433/−11), `package.json` (one test script + one chain segment) |
| Rollback to committed state | `git checkout rollback/before-comp2-natural-conversation-20260709` (KNOW4's uncommitted work must be preserved separately — see Rollback Plan) |

---

## REFERENCE DOCUMENTS READ

- [x] docs/architecture/README.md (architecture bootstrap — canonical entry point)
- [x] docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md
- [x] docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md
- [x] docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md
- [x] docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
☑ One canonical identity
  COMP2 introduces no entity and no key space. A captured food term is a query
  STRING passed to an existing search handler, never an identity the resolver
  resolves, stores or asserts.

☑ One owner per fact
  The resolver owns only its ROUTING DECISION. Every fact stays with its owner:
  meals → meal-discovery, pantry → pantry-discovery, plan → planner /
  planner-discovery, household → household-discovery, prices → shopping (basket).
  COMP2 reads no storage and states no fact of its own (IIntentResolver's
  standing hard boundary, unchanged).

☑ No duplicate entities
  None created. A conversational statement is a per-turn parse, never stored.

☑ No duplicate ownership
  No attribute gains a second owner.

☑ No duplicate state
  No conversation state, no memory of prior turns, no budget store. The resolver
  is pure over (utterance, hints), as before.

☑ Extends existing architecture
  Matchers are added to the EXISTING PatternIntentResolver, through the two
  mechanisms it already has (CompoundMatcher, Matcher). The clarification is
  carried on the EXISTING gap { kind: "needs-clarification" }, which INT35 and the
  Conversation Gateway already understood. capability-registry.ts and
  intent-resolver.ts are untouched — verified by diff.

☑ Progressive enrichment where appropriate
  Not applicable — no knowledge entity, no transactional state.

☑ Honest gaps over fabricated information
  A recognised shape naming no groundable entity produces a clarifying QUESTION,
  never a guessed food. An unrecognised subject ("the dog won't eat chicken") is
  left unrouted rather than attributed to the household. Money amounts and
  pronouns are structurally barred from becoming search terms. Verified by test.

☑ No permanent synchronisation bridge
  None. The resolver performs no reads at all.

☑ Evolution over replacement
  No matcher is removed or rewritten. Statement frames are start-anchored so they
  cannot poach question-shaped utterances the existing matchers own.
```

## AI ARCHITECTURE COMPLIANCE

```
✓ Uses the canonical Intelligence Platform (no new platform; resolver feeds the existing gateway)
✓ Uses the Capability Registry (routes ONLY to already-registered capabilities; the test asserts
  every emitted (capability × verb) is in supportedIntents AND executableIntents — a COMP2
  matcher cannot pass by naming a capability the platform could not actually execute)
✓ Uses the Intent Engine (no second intent engine; matchers are added to the one resolver)
✓ Reuses existing business services (meal-discovery, pantry-discovery, planner, planner-discovery,
  household-discovery, shopping — all consumed through their existing handlers, unmodified)
✓ Does not create another assistant (no new conversational surface)
✓ Does not duplicate conversation state (none created; the resolver stays pure and stateless)
✓ Uses registered capabilities only, with permission-aware access (handlers enforce userId as before)
✓ Produces honest gaps rather than fabricated knowledge (clarification, not invention — see Trust Check)
✓ Opens no write path — every emitted verb is `search` or `read`, both in READ_ONLY_VERBS, so
  confirmationFor() returns "none" and no confirmation gate is skipped. detectWriteIntent still
  runs BEFORE the resolver and is unaffected (INTA1 §8.1 constraint holds). Verified by test.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Intelligence Platform → Intent Resolution (routing only)
Declared SoT: none read, none written — the resolver reads no storage
New store created? NO
Existing store extended? NO
Consumer created? NO (routing decisions only; the existing handlers remain the consumers)
```

---

## IMPLEMENTATION

### What was built

Households state situations at least as often as they ask questions. Before COMP2, every
utterance in the mission set carried no interrogative, no capability noun and no known
verb, so all of them collapsed to the INT35 no-route ("I'm not sure I understood that").

COMP2 adds **matchers only**. Four conversational shapes are mapped onto the same
`(verb × capability)` pairs the registry already executes:

| # | Shape | Example | Route(s) |
|---|---|---|---|
| 1 | Ingredient on hand | "We've got half a cauliflower..." | `meal-discovery · search {query: "cauliflower"}` + `pantry-discovery · search {query: ""}` |
| 2 | Dislike / exclusion | "The kids don't fancy chicken." | `planner-discovery · search {query: "chicken"}` + `household-discovery · search {query: ""}` |
| 3 | Budget | "Can we eat cheaply this week?" / "We've only got £30 left." | `shopping · read {scope: "basket"}` (+ `planner · read` only with a week signal) |
| 4 | Time / effort pressure | "I need something quick tonight." | `meal-discovery · search {query: "quick"}` |

Four decisions carry the mission's "never fabricate" constraint:

- **A dislike never asks for "anything but chicken."** No such query exists, and inventing
  the food the household *does* want is precisely the fabrication the platform forbids.
  The named food is searched **in the plan**, where it can be found and swapped by the user.
- **The £30 is never stored, echoed as a known budget, or passed as a parameter.** THA owns
  no budget store. The amount is only a *signal* that the priced basket is the relevant
  grounding. A test asserts no intent's parameters contain `30` or `budget`.
- **The week is `read`, not `search`ed.** `planner-discovery` substring-matches a meal name;
  a budget utterance names no meal, so a search could never match — yet would let the turn
  claim the plan had been searched. The `read` returns the week's actual entries.
- **An unrecognised subject is left unrouted.** "The dog won't eat chicken" routes nothing;
  the dog is not a household member the platform has any record of.

**Multi-intent** falls out of the existing `CompoundMatcher` mechanism: shapes 1–3 fan out
to two distinct capabilities each, deduplicated by capability at the highest confidence.

**Clarification** fires *only* for a shape that is recognised but names no groundable entity
("we've got some left over", "the kids don't fancy it"). It is carried on the always-on
profile baseline intent as the pre-existing `gap { kind: "needs-clarification", clarificationPrompt }`.
The gateway already excludes gapped intents from `queryable` (conversation-gateway.ts:578),
so the turn classifies `no-route`, and `buildFallbackText` already voices a
`clarificationPrompt` verbatim in place of the generic rephrase message. **No new
mechanism was added for this** — COMP2 reuses the carrier INT35 built.

A clarification **never** coexists with a route: a question the platform can answer must be
answered, not asked back. This required one ordering change (below).

### The one behavioural change: resolver step order

Surface-primary (step 2) now runs *after* keyword fallbacks (step 3), and is **suppressed
while a clarification is pending**. Surface-primary is a *routed* intent, so leaving it in
would ground the turn on whatever page the user is looking at, and the gateway would never
reach the `no-route` branch that voices the prompt.

Moving it is safe: `dedupe()` keeps the highest confidence per capability, surface-primary
is `0.65`, and the highest keyword-fallback confidence in the file is `0.62`. No tie is
reachable, so surface-primary still wins its capability regardless of collection order.
(Verified by inspection **and** by the 124-test intent-resolver, 109-test compound-resolver,
82-test INT35 fallback and 64-test gateway suites, all green.)

### Files created / modified

| File | Change |
|---|---|
| `server/intelligence/pattern-intent-resolver.ts` | **Edited** (+433/−11): COMP2 matcher block (4 shapes), 2 clarifiers, step-order change |
| `server/tests/test-comp2-natural-conversation.ts` | **New** (408 lines, 210 assertions) |
| `package.json` | **Edited**: `test:comp2-natural-conversation` script + one `npm test` chain segment |
| `docs/implementation/intelligence/COMP2_NATURAL_CONVERSATION.md` | **New** — this document |
| `server/intelligence/capability-registry.ts` | **UNTOUCHED** (no new capability/verb) |
| `server/intelligence/intent-resolver.ts` | **UNTOUCHED** (no new gap kind) |

---

## DEFINITION OF DONE

- **What success looks like:** a household can speak naturally — state an ingredient, a
  dislike, a budget, or time pressure — and reach a registered, executable, read-only
  capability; compound statements fan out to more than one; genuinely underspecified
  statements get one specific question instead of a guess. ✅
- **What must not break:** every existing question-shaped route (statement frames are
  start-anchored); INT35 no-route classification; the compound matchers; `detectWriteIntent`
  precedence; the benchmark routing/utilisation suites; the full regression chain. ✅
- **Manual test steps:** see MANUAL VERIFICATION below.

## MANUAL VERIFICATION

1. `npx tsx server/tests/test-comp2-natural-conversation.ts` → **210 passed, 0 failed**.
2. Composed gateway path without DB/LLM (scratch script chaining the real
   `PatternIntentResolver` → the gateway's own `queryable` filter (`!ri.gap`) →
   `classifyTurn` → `buildFallbackText`), which proves the user-visible string:

   | Utterance | Result |
   |---|---|
   | "We've got half a cauliflower..." | `meal-discovery:search {"query":"cauliflower"}` + `pantry-discovery:search {"query":""}` — both executable, `confirm=none` |
   | "The kids don't fancy chicken." | `planner-discovery:search {"query":"chicken"}` + `household-discovery:search {"query":""}` |
   | "Can we eat cheaply this week?" | `shopping:read {"scope":"basket"}` + `planner:read {}` |
   | "We've only got £30 left." | `shopping:read {"scope":"basket"}` only — no week signal, and **no `30` in any parameter** |
   | "I need something quick tonight." | `meal-discovery:search {"query":"quick"}` |
   | "we've got some left over" | no route → `gapState: no-route` → *"What have you got in? Name the ingredient and I'll look for meals that use it."* |
   | "The kids don't fancy it." | no route → *"Which food is that? Name it and I can check where it appears in your meal plan."* |
   | "the dog won't eat chicken" | no route → generic rephrase message (**not** attributed to the household) |
   | "do I have flour in my pantry?" | still `pantry-discovery:search` — regression intact, not read as a possession statement |

3. Companion turn (requires a signed-in session): POST `/api/intelligence/conversation/turn`
   with `message: "We've got half a cauliflower"` → routed intents are
   `meal-discovery · search` and `pantry-discovery · search`; the answer is grounded in
   real meal/pantry results, or an honest empty result when nothing matches.

## VALIDATION PERFORMED

| Check | Result |
|---|---|
| `server/tests/test-comp2-natural-conversation.ts` (new) | ✅ 210 passed, 0 failed |
| `test-intent-resolver.ts` | ✅ 124 passed, 0 failed |
| `test-intelligence-compound-resolver.ts` | ✅ 109 passed, 0 failed |
| `test-intelligence-conversation-gateway.ts` (PER-1 gate) | ✅ 64 passed, 0 failed |
| `test:intelligence-fallback` (INT35) | ✅ 82 passed, 0 failed |
| `test:intelligence-registry-executability` | ✅ 124 passed, 0 failed |
| `test:intelligence-native-discovery` | ✅ 81 passed, 0 failed |
| `test:intelligence-companion-learning` | ✅ 55 passed, 0 failed |
| `test:intelligence-platform` | ✅ 33 passed, 0 failed |
| `test:benchmark-routing` | ✅ 101 passed, 0 failed |
| `test:benchmark-utilisation` | ✅ 70 passed, 0 failed |
| `npx tsc --noEmit` | ✅ 175 errors in the working tree and **175 at HEAD** (clean worktree comparison) — **0 in COMP2 files**; the baseline is pre-existing and unchanged |
| Full `npm test` chain | ✅ **exit 0** |

> Note: `test-intent-resolver.ts`, `test-intelligence-compound-resolver.ts` and
> `test-intelligence-conversation-gateway.ts` exist as files but have **no `package.json`
> script** (COMP1's report cites script names that do not exist). They were run directly
> with `npx tsx`. Wiring them into the chain is pre-existing debt, out of COMP2's scope.

---

## DATA IMPACT

- Reads existing data: **NO** — the resolver performs no storage reads.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Schema changes: **NO**

## TRUST CHECK

- **Could this mislead the user?** The resolver can only *route*. It states no fact. Each
  routed handler answers from its own owner, or returns its own honest gap/empty result.
- **Could this fabricate certainty?** No. The two structural guards are tested: a bare
  quantity ("some", "a bit") and a pronoun ("it") never become a search term, and a
  money amount never becomes a parameter. Both produce a question, not a guess.
- **Is anything guessed but shown as real?** No. An exclusion never proposes a replacement
  food; a budget never implies a stored budget; an unrecognised subject routes nothing.
- **What happens if the system is wrong?** A mis-parsed food yields an honest empty search
  result from the owning handler ("no meals matched"), never an invented one. A missed
  statement falls back to the pre-existing INT35 rephrase message — the behaviour before COMP2.
- **Rule T0/T1 posture:** no health claims, no bodies — routing only.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered outside the new matchers + the documented step-order change: **YES**

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-comp2-natural-conversation-20260709` →
  `6795a0c4a65acf5e7983945ab5c63dfe9a1bb4eb`
- **Files modified:** see Files created / modified above.
- **Rollback commands (surgical — preserves the unrelated KNOW4 uncommitted work):**
  ```
  git checkout rollback/before-comp2-natural-conversation-20260709 -- \
    server/intelligence/pattern-intent-resolver.ts
  rm server/tests/test-comp2-natural-conversation.ts \
     docs/implementation/intelligence/COMP2_NATURAL_CONVERSATION.md
  # package.json: remove the "test:comp2-natural-conversation" script line and the
  # "&& npm run test:comp2-natural-conversation" chain segment. Do NOT checkout the
  # whole file from the tag — it also holds an uncommitted KNOW4 script line.
  ```
- **Verification after rollback:** `npx tsc --noEmit` returns to the 175-error baseline;
  `npx tsx server/tests/test-intent-resolver.ts` and
  `npx tsx server/tests/test-intelligence-conversation-gateway.ts` pass;
  `grep -ri comp2-natural package.json server/` is empty.

---

## SCOPE LOCK

**Implemented scope (exactly COMP2):** conversational statement matchers (ingredient on
hand, dislike/exclusion, budget, time/effort pressure) on the existing
`PatternIntentResolver`; two clarifiers for recognised-but-underspecified shapes; the
step-order change that lets a clarification suppress surface-primary; tests; this document.

**Explicitly excluded (not done):**
- No UI changes of any kind (per the mission).
- No new AI system, intent engine, conversation state, or knowledge store (per the mission).
- No new capability, verb, or gap kind — `capability-registry.ts` and `intent-resolver.ts`
  are untouched.
- No write path, no confirmation-gate change.
- No changes to the unrelated in-flight KNOW4 workstream in the working tree.
- The `COMP2` identifier collision with the 2026-07-06 Platform Knowledge Activation Audit
  is **recorded, not resolved** — renaming is a governance decision, out of scope here.
