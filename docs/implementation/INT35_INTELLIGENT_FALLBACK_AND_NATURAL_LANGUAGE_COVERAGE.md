# INT35 — Intelligent Fallback & Natural Language Coverage

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Precursor:** [`docs/investigations/INT34_CONVERSATION_GATEWAY_CAPABILITY_ROUTING_AUDIT.md`](../investigations/INT34_CONVERSATION_GATEWAY_CAPABILITY_ROUTING_AUDIT.md) (🔴 RED — two of four live queries failed at the resolver and collapsed into the generic "I don't have that information right now")
**Tests:** `npm run test:intelligence-fallback` (82 assertions) · included in the `npm test` chain

---

## 1. Objective

Before INT35, every unsuccessful assistant turn — whatever actually went wrong — collapsed into one generic LLM line: *"I don't have that information right now."* A resolver miss, an honest platform gap, an empty search, and a thrown fault were indistinguishable to the user, and none of them were recorded for future improvement.

INT35 makes THA Intelligence respond honestly and *specifically* when a query is unclear, unsupported, returns no results, or errors — and expands natural-language coverage for the failed examples INT34 traced.

**Architecture decision (scope rule honoured):** no new assistant, no new state owner, no new capability, no schema change. The work lives entirely in the existing pieces:

| Piece | Role in INT35 |
|---|---|
| `PatternIntentResolver` | Expanded matcher coverage (INT34 G1/G2); marks unrecognised utterances |
| `ConversationGateway` | Classifies every turn; responds with the state-specific message |
| Intelligence Platform / Intent Engine | **Unchanged** — its honest structured outcomes are consumed, not altered |
| Capability Registry / handlers / bindings | **Unchanged** |
| `turn-fallback.ts` (new module) | Pure classification + copy + bounded log. No storage, no platform calls, no business logic — it is gateway vocabulary, not a new state owner |

---

## 2. The four canonical unsuccessful states

Defined in `server/intelligence/conversation/turn-fallback.ts` as `UnsuccessfulTurnState`:

| State | Meaning | Detected by |
|---|---|---|
| `no-route` | **Did not understand the question.** The resolver produced no utterance-derived intent | Resolver marks the turn (see §3); no non-baseline intent was queried |
| `no-knowledge` | **Understood, but trusted knowledge is missing.** Every routed capability returned an honest platform non-ok (`gap`, `not_executable`, `unsupported_intent`, `unknown_capability`, `denied`, `confirmation_required`) | Platform outcome status |
| `no-results` | **Searched but found no matching results.** At least one `search` executed with `status: "ok"` and an honestly empty result | `isEmptySearchResult()` on ok search outcomes |
| `internal-error` | **Internal error.** A capability handler threw a genuine fault (not a structured `CapabilityExecutionError`), or the LLM provider failed | Caught throw |

### Classification (`classifyTurn`)

Per-turn, over the **routed** (non-baseline) queried intents, most-informative-first:

```
0. no routed intents at all            → no-route
1. any ok with real data               → success (LLM answers as before)
2. any ok-but-empty search             → no-results
3. any honest platform non-ok          → no-knowledge
4. only faults remain                  → internal-error
```

Rationale for the precedence: an empty search that *ran* is a real answer ("nothing matched") and outranks a parallel speculative intent's gap; an honest gap outranks a parallel fault. The **baseline** profile personalisation read (always appended by the resolver at confidence 0.50) never counts in any direction — a turn whose only success is the baseline profile read is still `no-route`, which is exactly what kept the pre-INT35 pipeline from ever admitting it hadn't understood.

### Empty-search detection (`isEmptySearchResult`)

Applied to `search`-verb ok outcomes only — read/explain handlers already throw an honest gap when nothing is stored, so an ok read IS data. Covers the three live search shapes:

- discovery engines (INT26–INT32): `{ totalCount: 0, results: [] }`
- meals search: `{ mealCount: 0, meals: [] }`
- nutrition-knowledge search: `{ foods: [], nutrients: [], benefits: [] }` (all arrays empty)

---

## 3. Resolver: the unrecognised marker and the baseline flag

Two additive changes to the `ResolvedIntent` contract (`intent-resolver.ts`):

- **`baseline?: boolean`** — set on the always-on profile intent. Baseline intents are still queried for grounding context but never count as "understanding the question".
- **Unrecognised marker** — when NO utterance-derived signal fires (no compound matcher, no specific matcher, no keyword fallback), the profile intent carries `gap: { kind: "unknown" }` (the `ResolverGap` shape reserved for exactly this in INT24). The surface-primary intent (step 2) is *context*, not understanding, so it does not suppress the marker — but it still runs, so deictic questions on a mapped surface ("what's this?" on a food page) keep their existing grounded behaviour.

The gateway logs every resolver-unmatched utterance (stage `resolver-unmatched`) even when surface context rescues the turn — those utterances are precisely the future matcher backlog.

---

## 4. Gateway: state-specific responses replace the generic line

`conversation-gateway.ts` changes:

1. `queryCapability()` no longer collapses every non-ok into `null`. It classifies each platform outcome into `ok-data` / `ok-empty` / `no-knowledge` / `error` and retains the honest `IntentOutcome`.
2. After querying, `classifyTurn()` runs. A non-null state **bypasses the LLM entirely** (there is nothing grounded for it to say) and returns the deterministic, state-specific message from `buildFallbackText()`:
   - `no-route` → *"I'm not sure I understood that question. Could you try rephrasing it? For example: …"* with **surface-aware rephrase suggestions** — every suggested phrasing is proven by test to route. A resolver-supplied `clarificationPrompt` (the INT24 contract) is surfaced verbatim when present.
   - `no-knowledge` → *"I understood what you're asking, but I don't have trusted information stored to answer it yet — I'd rather say so than guess."*
   - `no-results` → *"I searched your meals for "pasta" but couldn't find any matches. …"* — names the searched areas (friendly capability names) and the query.
   - `internal-error` → *"Something went wrong on my side while answering that — it's not you. Please try again in a moment."* (also used when the LLM call itself fails)
3. The first routed platform outcome is surfaced on `TurnResult.outcome` so the stored assistant turn's `outcomeRef` stays traceable.
4. **New injection seam:** the constructor accepts an optional `HandleIntentFn` (defaults to `intelligencePlatform.handle`), letting tests drive controlled ok / empty / gap / fault outcomes through the *real* pipeline. Production behaviour is unchanged.

The successful path is untouched: any routed intent that returns real data still goes to the LLM with the same grounding prompt, history and JSON contract as before.

**Honest gaps preserved (scope item 6):** the platform, engine, handlers and their gap semantics are unmodified; INT35 only *translates* those honest outcomes into distinguishable user-facing states. Nothing is fabricated in any state — each message says exactly what happened.

---

## 5. Unmatched / failed query logging

`turn-fallback.ts` keeps a bounded in-memory ring buffer (200 entries) plus a structured `console.info` line per event (`[IntelligenceFallback] …`), at two stages:

- `resolver-unmatched` — the resolver had no utterance-derived route.
- `turn-fallback` — the turn ended in one of the four states.

**Privacy rule, enforced by test:** an entry contains the timestamp, stage, state, surface, the utterance (truncated to 200 chars — it is the artefact resolver improvement needs), and the routing shape (`capability/verb:status`). It NEVER contains a user id, household id, intent parameters, or capability result payloads.

---

## 6. Natural language coverage expansion

All in `pattern-intent-resolver.ts`, per the INT34 gap analysis:

| Utterance | Before | After |
|---|---|---|
| `show me a past meal` | no matcher → generic line | **diary-discovery / search** ("past" = already eaten — INT34 G1 recommendation). Also `recent`, `last`, `previous`, `earlier`, `old` qualifiers |
| `what pasta meals have I got` | `MEALS_MATCHERS[1]` was SVO-only → generic line | **meals / search "pasta"** — new inverted-OVS matcher (`what/which X meals have I got / do I have`, bare `X meals have I got`) (INT34 G2) |
| `pasta meals` | nothing | **meal-discovery / search "pasta"** — new bare noun-phrase matcher (whole-utterance anchored, stop-word guarded) |
| `show me pasta recipes` | `recipe\b` never matched the plural → generic line | **meal-discovery / search "pasta"** — pattern now `recipes?` |
| `meals under 400 calories` | worked (INT27) | still works — regression-tested |
| `foods that help with sleep` | worked (INT4/INT26) | still works — regression-tested |
| `show me a chicken meal` | nothing (terminal noun "meal" uncovered) | **meal-discovery / search "chicken"** |
| `what meals have I got` (no qualifier) | nothing | **meals / read `{scope:"summary"}`** (week-scoped phrasings guarded to stay with the planner matchers) |
| any meal-noun query with no specific match | "meal/meals" absent from every keyword fallback | keyword fallback `meals?` added at confidence **0.48** — a coverage floor deliberately BELOW the profile baseline (0.50) so it can never displace the personalisation read from the `MAX_INTENTS` cap when specific matchers fired |

---

## 7. Files changed

| File | Change |
|---|---|
| `server/intelligence/conversation/turn-fallback.ts` | **NEW** — states, classification, empty-search detection, state copy, rephrase suggestions, bounded privacy-safe log |
| `server/intelligence/conversation/conversation-gateway.ts` | Outcome classification, state-specific responses, LLM bypass on unsuccessful turns, `HandleIntentFn` seam, logging |
| `server/intelligence/intent-resolver.ts` | Additive `baseline?: boolean` on `ResolvedIntent` |
| `server/intelligence/pattern-intent-resolver.ts` | Coverage expansion (§6), profile baseline flag, unrecognised marker |
| `server/tests/test-intelligence-fallback.ts` | **NEW** — 82 assertions (§8) |
| `server/tests/test-intent-resolver.ts` | Repaired stale INT25B expectations (recipe queries moved `meals` → `meal-discovery` in INT26; the suite crashed mid-run and its later sections never executed). Now 124/124 |
| `package.json` | `test:intelligence-fallback` script; appended to the `npm test` chain |

Not touched: intelligence-platform, intent-engine, capability-registry, permissions, every handler/port/binding, every discovery engine, schema.

---

## 8. Test evidence (`test-intelligence-fallback.ts`)

| Scope requirement | Proven by |
|---|---|
| understood/no-data is distinct from no-route | §1: baseline-only → `no-route`; routed gap → `no-knowledge`; §6 end-to-end: the two responses differ and no-knowledge never asks to rephrase |
| no-results is distinct from no-knowledge | §1 precedence tests; §6: empty-search turn names the query, gap turn does not |
| internal errors use the error fallback | §1; §6: thrown handler fault AND thrown LLM fault both produce the error copy |
| common British phrasing routes correctly | §4: all six INT35 example utterances + OVS variants assert capability, verb and extracted query |
| existing successful routing still works | §8 regressions (INT22/24/26/27/33 phrasings) + full existing suites re-run green: intent-resolver 124, compound-resolver 109, conversation-gateway 64, all 21 platform/binding/discovery suites |
| no LLM call on unsuccessful turns | §6: stub LLM call-count is 0 for all four states, 1 for the success path |
| logging without sensitive data | §7: entries recorded for both stages; serialized log contains no `userId` key and no capability result data; utterance truncated at 200 chars |

Full verification run (2026-07-02): `test:intelligence-fallback` 82/82 · `test-intent-resolver` 124/124 · `test-intelligence-compound-resolver` 109/109 · `test-intelligence-conversation-gateway` 64/64 · all 21 platform/binding/discovery suites 0 failures · `tsc --noEmit` introduces no new errors (153 pre-existing before and after, none in INT35 files).

---

## 9. Behavioural notes & accepted trade-offs

- **Surface-primary on mapped surfaces still rescues vague questions.** An unrecognised utterance on e.g. the nutrition food page still reaches the LLM grounded in the surface's data (pre-INT35 behaviour, deliberately preserved for deictic questions like "what's this?"). The `no-route` response therefore fires primarily on the floating assistant — exactly where the INT34 failures occurred. The unmatched utterance is logged in both cases.
- **`denied` maps to `no-knowledge`.** The four canonical states have no "denied" slot; the no-knowledge copy is honest without leaking existence, matching the platform's no-existence-leak discipline. Denials remain visible in `outcomeRef` and the log for diagnosis.
- **Fallback turns are deterministic.** No LLM call means the four states are testable, cheap, and immune to prompt drift; the LLM's own "answer only from context" rule (system prompt rule 3) remains as defence-in-depth for partially-grounded successful turns.
- **The log is in-memory.** Persisting unmatched queries to a table would be a schema change outside INT35's scope; the structured console line additionally lands in whatever log aggregation production has.
