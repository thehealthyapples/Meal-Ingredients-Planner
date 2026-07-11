# COMP1 — Companion Response Enrichment

**Date:** 2026-07-06
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN
**Reason:** Wording-only change inside the existing Behaviour Engine / Personality Registry seam (`turn-fallback.ts`, `personality-registry.ts`, one call site in `conversation-gateway.ts`). No new capability, no new store, no schema change, no change to which gap fires or what is claimed — only what an already-classified honest gap *says*.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-COMP1-companion-response-enrichment-20260706` → `d63d7cd1b9c4a917d36880eb4399ae35e03d781c` |
| Working tree | Intentionally dirty at task start — the branch already carried unrelated in-progress work (PKC/FI2/FI2C, per `git status` at session start: modified files across `client/src/pages`, `server/intelligence`, `docs/architecture`, etc.). The rollback tag pins the commit; this task's own writes are listed below and are independently revertible per-file. |
| This task's writes | `server/intelligence/conversation/turn-fallback.ts`, `server/intelligence/conversation/personality-registry.ts`, `server/intelligence/conversation/conversation-gateway.ts`, `server/tests/test-intelligence-personality-platform.ts` |
| Rollback to committed state | `git checkout rollback/before-COMP1-companion-response-enrichment-20260706` |
| Rollback this task only | `git checkout d63d7cd1b9c4a917d36880eb4399ae35e03d781c -- server/intelligence/conversation/turn-fallback.ts server/intelligence/conversation/personality-registry.ts server/intelligence/conversation/conversation-gateway.ts server/tests/test-intelligence-personality-platform.ts` |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (governs the Behaviour Engine / Personality Registry seam this task edits)
- [x] `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3 — honest gaps as a first-class voice behaviour, Part 11)
- [x] Source code read for grounding: `turn-fallback.ts`, `companion-gap-classifier.ts`, `personality-registry.ts`, `behaviour-engine.ts`, `conversation-gateway.ts`, `companion-guidance.ts`, `pattern-intent-resolver.ts` (resolver tiers + keyword fallbacks)

---

## SUMMARY

COMP1 applies three governing Companion principles — **Graceful Honest Gaps**, **Human Conversation**, **Platform Knowledge First** — across the Companion's existing response seams. Two of the three were verified already compliant by reading the live code; one required an actual, scoped code change. No new mechanism was introduced anywhere: every change reuses the existing Behaviour Engine / Personality Registry / turn-fallback seam that `THA_COMPANION_PLATFORM_ARCHITECTURE.md` names as the Companion's one phrasing layer.

### Principle 1 — Graceful Honest Gaps (code changed)

**Before:** of the four canonical unsuccessful-turn states (`no-route` / `no-knowledge` / `no-results` / `internal-error`, `turn-fallback.ts`), the `no-knowledge` state — "I understood the question, but there's no trusted stored answer" — was the weakest against the four sub-requirements. Its copy, in all six personality voices, stopped at the bare disclosure: it named no area, offered no general guidance, suggested no next action, and invited no missing detail. `no-route` and `no-results` already did all four (rephrase suggestions with worked examples; named search area + query).

**After:** `no-knowledge` now, in every one of the six voices:
1. **Explains why**, naming the actual capability domain(s) that returned an honest platform gap (e.g. "the nutrition knowledge base"), not just "that".
2. **Provides general guidance** by reusing the existing, surface-tuned `formatSuggestions()` example list ("try asking about `<worked examples>`") — the SAME proven-routable examples `no-route` already uses, never invented.
3. **Suggests the next best action** — ask again with the missing specific, or try one of the worked examples.
4. **Invites the missing information** — explicitly asks for the specific food/meal/topic the user means.

**Mechanism, not a new one:** `turn-fallback.ts`'s `describeSearched()` (which named *searched* areas for `no-results` only) is generalised to `describeQueried(queried, statuses)`, keyed to whichever status the current state cares about — `["ok-empty"]` for `no-results` (unchanged), `["no-knowledge"]` for `no-knowledge` (new). `describeSearched` is retained as a one-line wrapper over the new function so every existing caller is untouched. `conversation-gateway.ts`'s one call site picks the right status set from the already-classified `fallbackState` before calling `voiceFallback()` — no new classification, no new decision about whether something is a gap; the SAME already-honest `queried` array is just described more precisely, mirroring exactly what `no-results` already did.

This is a **wording-only** change per the Companion Platform's own hard invariant (§0, §4.2 of `THA_COMPANION_PLATFORM_ARCHITECTURE.md`): `classifyTurn()` still decides whether a turn is a gap; `voiceFallback()` still only re-wraps facts the platform already computed. No personality template asserts a new claim — `describeQueried` can only name a capability domain that is *already* in the caller-supplied `queried` array with the matching status.

### Principle 2 — Human Conversation (verified, no code change needed)

Grepped every return/label in the live seam (`turn-fallback.ts`, `personality-registry.ts`, `behaviour-engine.ts`, `companion-guidance.ts`, the gateway's write-intent-guard and system-prompt text) for internal terms — "capability", "resolver", "handler", "context frame", "intent", "platform", the literal state names `no-knowledge`/`no-route`/`no-results`/`internal-error`. Every hit was either a code comment, a TypeScript identifier/object key, or a `console.info` log line (`turn-fallback.ts` `logUnsuccessfulQuery`) — never a string rendered to the user. The four state names are used purely as a `switch` discriminant inside `buildFallbackText`/`fallbackTemplates`; no template interpolates the state's own name into its copy. **Verified compliant — no change required.**

### Principle 3 — Platform Knowledge First (verified, no code change needed)

Before a turn is ever classified as an honest gap, `PatternIntentResolver.resolve()` (`pattern-intent-resolver.ts:1927-2000`) already runs a five-tier cascade — compound cross-domain matchers, specific high-confidence patterns, surface-primary, keyword fallbacks (covering all 13 capabilities' vocabulary), and the always-on profile baseline — deduplicating to up to `MAX_INTENTS = 4` distinct capability domains, all queried **in parallel** through `intelligencePlatform.handle()` (`conversation-gateway.ts` `buildGroundedResponse`, the `Promise.all` over `queryable`). INT42 composition (`capability-composition.ts`, `deriveFoodIntelligenceExplainFromUplift`) additionally derives a second, dependent query from a first capability's own result before the turn is classified. Only after every one of these already-registered, already-executable capability routes has been tried does `classifyTurn()` (`turn-fallback.ts:124-133`) declare a gap. The Companion never silently re-queries an *unrelated* capability with no signal of relevance — instead it offers "you could also try" recovery suggestions (`companion-guidance.ts` `buildRecoverySuggestions`, gated through `intelligencePlatform.canExecute`) as an explicit, honest alternative, never a guess. **Verified: platform knowledge is already exhausted before an honest gap is returned — no code change required.**

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity touched. This task edits phrasing functions only (turn-fallback.ts,
  personality-registry.ts) and one call site (conversation-gateway.ts); no
  entity/key space is read, written, or introduced.

☑ One owner per fact
  The four-state classification remains solely owned by classifyTurn()
  (turn-fallback.ts). describeQueried() reads the SAME already-computed
  `queried` array classifyTurn() already used — no second computation of
  "what happened this turn".

☑ No duplicate entities
  Nothing new is created. describeQueried() is a generalisation of the
  existing describeSearched() (same file, same owner) — describeSearched
  becomes a one-line wrapper, not a parallel implementation.

☑ No duplicate ownership
  fallbackTemplates (personality-registry.ts) remains the sole owner of
  per-voice fallback copy; turn-fallback.ts remains the sole owner of the
  four-state classification and the reference/spec default copy used by its
  own test. Neither owner changed hands.

☑ No duplicate state
  No user state introduced, read, or written. Personality is still read once
  per turn from user_preferences (unchanged, EWO2's existing seam).

☑ Extends existing architecture
  Extends the exact seam THA_COMPANION_PLATFORM_ARCHITECTURE.md §4.2 names:
  the Behaviour Engine's per-state fallback voicing (voiceFallback →
  fallbackTemplates). No new seam, no new call site type.

☑ Progressive enrichment where appropriate
  N/A — this is presentation/phrasing over already-resolved output (Companion
  Platform, not a knowledge entity). No enrichment pipeline touched.

☑ Honest gaps over fabricated information
  Strengthened, not weakened: describeQueried can only name a capability
  domain already present in the caller-supplied `queried` array with the
  matching status — it cannot invent an area. The hard invariant test
  (test-intelligence-personality-platform.ts §2, "no personality's no-knowledge
  text claims an answer exists") still passes for all six personalities.

☑ No permanent synchronisation bridge
  N/A — no second store of any fact was created.

☑ Evolution over replacement
  describeSearched() is not replaced — it is retained verbatim as a wrapper so
  every existing caller/test is unaffected; describeQueried() is the new,
  more general entry point future callers should prefer.
```

---

## AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ Uses the canonical Intelligence Platform — unchanged; no new call to
  intelligencePlatform.handle() or a second instance.
✓ Uses the Capability Registry — unchanged; describeQueried only reads
  CAPABILITY_FRIENDLY_NAMES, the existing display-name map, never a new
  registry.
✓ Uses the Intent Engine — unchanged; PatternIntentResolver / classifyTurn
  are untouched (verified by test, see Validation below).
✓ Reuses existing business services — no business service touched at all;
  this is the Companion Platform's presentation layer only.
✓ Does not create another assistant — confirmed; one Behaviour Engine, one
  Personality Registry, no new file.
✓ Does not duplicate conversation state — confirmed; no new read/write of
  conversation-store.ts or user_preferences.
✓ Uses registered capabilities only — confirmed; no new capability invoked.
✓ Uses permission-aware access — unaffected; no permission-gated path touched.
✓ Produces honest gaps rather than fabricated knowledge — strengthened (see
  Principle 1 above and the Trust Check below).
```

---

## PLATFORM QUALITY COMPLIANCE

```
PLATFORM QUALITY COMPLIANCE CHECKLIST
======================================

☑ Security — no new endpoint, no new minimumRole; unaffected.
☑ Privacy — no new data read; describeQueried reads only the same
  capability/verb/status shape turn-fallback.ts's log already retains
  (no user id, no result payload).
☑ Performance — no new I/O, no new computation cost beyond a small array
  filter+map already the same order of work as the pre-existing
  describeSearched() it generalises.
☑ Observability — classification/logging (logUnsuccessfulQuery,
  classifyTurn) is completely untouched; only the rendered text changed.
☑ Accessibility — output still renders as plain text through the same
  Companion Card structural contract; no markup, no ad hoc layout.
☑ Trust — every fact named in the enriched copy (capability domain, worked
  suggestion examples) already existed in the caller-supplied data before
  this change; nothing is asserted that the platform did not already compute.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Companion Platform — Behaviour Engine / fallback voicing
  (not a Source-of-Truth-Register domain; the Companion Platform is
  explicitly out of the graduation pipeline per
  THA_COMPANION_PLATFORM_ARCHITECTURE.md §9 — it owns no durable knowledge)
Declared SoT: server/intelligence/conversation/turn-fallback.ts
  (classification + reference copy) and
  server/intelligence/conversation/personality-registry.ts (per-voice copy)
New store created? NO
Existing store extended? NO — no store; pure functions only
Consumer created? NO — conversation-gateway.ts's existing call site was
  updated in place, not duplicated
  Reads from declared SoT? YES — voiceFallback() still the only entry point
```

---

## DEFINITION OF DONE

**What success looks like:** every honest-gap response the Companion can give — across all six personalities and all four unsuccessful-turn states — states what's missing, explains why in terms of what was actually checked, offers general guidance toward something the platform CAN answer, suggests a concrete next action, and invites the specific missing detail, without ever implying an answer exists when it doesn't.

**What must not break:**
- The four-state classification (`classifyTurn`) and its precedence rules — untouched, verified by test.
- The "gap stays a gap" hard invariant across all six personalities — verified by the existing `test-intelligence-personality-platform.ts` regex check (no personality claims "here's the answer").
- `no-route`/`no-results` wording, which was already compliant — verified byte-for-byte unchanged except for the (intended) generalisation of the shared helper name.
- Every existing test suite touching this seam.

**Manual test steps:**
1. In the running app, ask the floating Companion a question that resolves to a real capability but returns an honest platform gap (e.g. a food not in the knowledge registry) — confirm the response names the checked area, offers a next step, and invites specifics, in the user's chosen personality.
2. Switch personality in Profile settings and repeat — confirm wording changes, disclosure does not.
3. Ask a genuinely unrouted question (gibberish) — confirm `no-route` phrasing is unchanged from before this task.

---

## VALIDATION PERFORMED

| Suite | Command | Result |
|---|---|---|
| INT35 Intelligent Fallback | `npx tsx server/tests/test-intelligence-fallback.ts` | **82 passed, 0 failed** |
| Companion Personality Platform (EWO2) | `npx tsx server/tests/test-intelligence-personality-platform.ts` | **114 passed, 0 failed** (1 test updated — see below) |
| Conversation Gateway (INT18) | `npx tsx server/tests/test-intelligence-conversation-gateway.ts` | **64 passed, 0 failed** |
| `tsc --noEmit` on touched files | `npx tsc --noEmit -p .` | No errors attributable to the four files this task edited (pre-existing, unrelated errors remain in unrelated test files) |

**One test updated, not just re-passed:** `test-intelligence-personality-platform.ts`'s gateway end-to-end check asserted the sergeant `no-knowledge` response **verbatim** ("No documented answer for that. Not guessing."). That literal string was the exact thing Principle 1 required enriching, so the assertion was updated to the new, richer, still-fully-deterministic sergeant wording (computed via the same `formatSuggestions`/`CAPABILITY_FRIENDLY_NAMES` helpers the production code calls — not a loosened assertion). Every other assertion in that suite passed unchanged, including the hard "never claims to have the answer" invariant and the "two personalities voice the same gap differently" check.

---

## TRUST CHECK

- **Could this mislead the user?** No — every enriched sentence names only facts already present in the turn's own `queried`/`suggestionExamples` data; nothing is invented.
- **Could this fabricate certainty?** No — the disclosure ("I don't have trusted information... yet") is preserved in every one of the six voices; enrichment adds guidance and an invitation, never a claim of knowledge.
- **Is anything guessed but shown as real?** No.
- **What happens if the system is wrong?** Unchanged failure mode: if `classifyTurn` mis-classifies a turn, the wrong *state's* template fires (a pre-existing, untouched risk) — this task cannot introduce a new way for that to happen, since it does not touch classification.
- **No architectural duplication introduced:** YES (confirmed above).
- **No new source of truth created:** YES.
- **No runtime behaviour altered (for governance-only work):** N/A — this is not governance-only work; runtime *text* changed by design (that is the task), runtime *decisions* (classification, routing, capability access) did not.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-COMP1-companion-response-enrichment-20260706` → `d63d7cd1b9c4a917d36880eb4399ae35e03d781c`
- **Files modified:**
  - `server/intelligence/conversation/turn-fallback.ts`
  - `server/intelligence/conversation/personality-registry.ts`
  - `server/intelligence/conversation/conversation-gateway.ts`
  - `server/tests/test-intelligence-personality-platform.ts`
- **Rollback commands:** `git checkout d63d7cd1b9c4a917d36880eb4399ae35e03d781c -- <files above>`
- **Verification after rollback:** re-run the three test suites listed above; all four files return to their pre-COMP1 byte-for-byte content and the pre-existing (114-1=113… actually pre-COMP1 baseline) test results.

---

## SCOPE LOCK

**Implemented scope:**
- Generalised `describeSearched` → `describeQueried` (turn-fallback.ts), preserving the old function as a wrapper.
- Enriched the `no-knowledge` fallback template (why + general guidance + next action + invite specifics) for the reference default (`buildFallbackText`) and all six personality voices (companion, friend, coach, chef, teacher, sergeant).
- Wired the gateway's fallback branch to compute the area description with the status set matching the fired state (`ok-empty` for `no-results`, `no-knowledge` for `no-knowledge`).
- Verified (no code change) that Principle 2 (no internal terminology leakage) and Principle 3 (platform knowledge exhausted before a gap) already hold, with file:line citations above.
- Updated one test assertion that had hardcoded the now-intentionally-changed literal string.

**Explicitly excluded scope (not done):**
- `no-route`, `no-results`, and `internal-error` copy were left unchanged — they were already independently verified to satisfy all four Principle 1 sub-requirements (see Summary).
- No change to `classifyTurn`, the resolver, capability registry, or any capability handler.
- No change to the Observation Engine, Companion Growth, or Guidance/Experience layers.
- The Companion Benchmark was **not** executed, per Principle 9 / the Benchmark Ownership Rule — this document confirms readiness (tests above) and stops here, awaiting explicit instruction.

**Suggestions (out of scope, not implemented):**
- `no-route`'s clarification path could additionally invite the missing specific by name (e.g. "did you mean a food, a meal, or a day?") when the resolver's own gap carries no `clarificationPrompt` — a small, separate enrichment if desired later.
- `internal-error` currently offers only "try again"; a "this isn't a knowledge gap, it's a system hiccup" framing already exists, but no invitation for missing info applies here by nature of the state — left as is deliberately, not an oversight.
