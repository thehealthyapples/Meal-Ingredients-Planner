# INT39 — Capability Guidance Registry & Goal Completion

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Branch:** int1-intelligence-platform
**EWO:** EWO-INT39 (🟡 AMBER)
**Builds on:** [`INT38_COMPANION_GUIDANCE_AND_ACTION_FRAMEWORK.md`](./INT38_COMPANION_GUIDANCE_AND_ACTION_FRAMEWORK.md) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md)
**Governing architecture:** [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) · [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md)
**Tests:** `npm run test:intelligence-capability-guidance-goals` (139 assertions) + `npm run test:intelligence-companion-guidance` (63 assertions, updated) · both in the `npm test` chain

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| HEAD at start | `4a2da73` (branch `int1-intelligence-platform`) |
| Working tree | Intentionally dirty at start — prior uncommitted INT35/INT35B/INT35C/INT36/INT37/INT38 work already present on this branch, unrelated to this workstream except where this workstream extends it (see §7) |
| This task's writes | See §7 Files changed |
| Rollback | Revert the files listed in §7 (all additive — two new nullable columns, two new modules, one new script, one new test file, targeted extensions to nine existing files). No destructive schema change: dropping the new columns (`conversation_turns.fallback_state`, `companion_guidance_events.source_capability_id`/`target_capability_id`/`target_verb`) is optional and harmless since they are nullable and no other code depends on their presence. |

---

## 1. Objective

INT38 gave the Companion a deterministic cross-domain "Next Step" suggestion graph — but that graph (`JOURNEY_MAP`) lived **inside the Companion layer** (`companion-guidance.ts`), not on the capabilities it described. Three gaps followed directly from that:

1. **Guidance was Companion-owned, not capability-owned.** A capability's "how do users naturally continue after this" knowledge was declared somewhere else, by someone else — a duplicate-ownership risk the governing architecture explicitly forbids (TIP2 "one owner per capability").
2. **Unsuccessful turns got no guidance at all.** `buildGuidanceSuggestions` only ever ran on the success path; a user who asked something the platform recognised but couldn't answer was left with an honest apology and nothing else.
3. **No Goal Completion tracking.** The platform could tell you a suggestion was *shown* and *clicked* (INT38), but nothing distinguished "the user clicked something" from "the user actually completed the journey the capability pointed them towards" — and nothing measured whether a failed conversation ever recovered.

INT39 closes all three gaps as a **strict extension** of the existing AI Capability Registry and the existing INT38 guidance/feedback plumbing. No new capability is invented, no capability's business logic changes, and no existing table is replaced — two nullable columns are added to two existing tables, and the Companion's own guidance module becomes a thin *consumer* instead of an *owner*.

| Piece | Role |
|---|---|
| `server/intelligence/types.ts` | + `GuidanceAction`, `CompletionCriterion`, `CapabilityGuidance` — the Capability Guidance Registry's type contract. `Capability.guidance?` is the new, optional field every capability may declare on itself. |
| `capability-registry.ts` | The 7 capabilities INT38's journey graph covered (nutrition-knowledge, meals, planner, shopping, pantry, diary, household) now declare `guidance` directly on their own `SEED_CAPABILITIES` entry. `CapabilityRegistry.getGuidance()` / `getCompletionCriteria()` are the registry's new read surface — this **is** the Capability Guidance Registry: an extension of the existing registry, not a second one. |
| `companion-guidance.ts` (rewritten, still pure) | No longer holds its own journey graph. Resolves `buildGuidanceSuggestions()` (success path) and the new `buildRecoverySuggestions()` (failure path) purely by reading each capability's own declared guidance from the registry, then gating every candidate through the live `canExecute()` check — identical honesty discipline to INT38, now capability-sourced. |
| `conversation-gateway.ts` | Wires recovery guidance into the failure path; persists the previously-ephemeral `fallbackState` and `resolvedIntent` onto the assistant turn (the durable Goal Completion signal); passes capability identity through to the "shown" events it records. |
| `shared/schema.ts` / `scripts/apply-companion-goal-columns.ts` | Two nullable, additive columns: `conversation_turns.fallback_state` and `companion_guidance_events.{source_capability_id, target_capability_id, target_verb}`. |
| `companion-goal-analytics.ts` (new, pure) | The six-state Goal Completion funnel, recovery-after-failure, and action-level conversion (highest-converting / frequently-ignored), computed from the (now-persisted) per-turn signal and the (now capability-tagged) guidance events. |
| `routes.ts` | `guidanceKind` on `POST /turn`; capability identity accepted on `POST guidance-click`; `GET /learning/dashboard` gains a `goalCompletion` section. |
| `companion-card.ts` / `FloatingAssistant.tsx` | Guidance suggestions carry capability identity end-to-end; the "Where to next?" block relabels to "You could also try" on a recovery (unsuccessful-turn) suggestion. |
| `admin-companion-intelligence-page.tsx` | Goal Completion funnel, recovery-after-failure rate, highest-converting/ignored guidance-action tables. |

---

## 2. Capability Guidance Registry — guidance moves onto the capability

### 2.1 The type contract (extends `Capability`, doesn't replace it)

```ts
interface GuidanceAction { capabilityId: string; verb: IntentVerb; label: string; }

interface CompletionCriterion {
  id: string;
  description: string;
  satisfiedByAction: GuidanceAction; // the click that means "this capability's goal was completed"
}

interface CapabilityGuidance {
  primaryAction?: GuidanceAction;
  relatedActions?: readonly GuidanceAction[];
  followUpActions?: readonly GuidanceAction[];
  recommendedJourneys?: readonly GuidanceAction[];
  completionCriteria?: readonly CompletionCriterion[];
}

interface Capability {
  // ...unchanged...
  guidance?: CapabilityGuidance; // NEW, optional — absence is honest, never a fabricated default
}
```

Every field the EWO asked for — primary action, related actions, follow-up actions, recommended companion journeys, completion criteria — is represented, and every `GuidanceAction` is itself a real `(capabilityId, verb)` pair from the existing intent taxonomy. **A guidance action IS its own executability gate**: resolving a suggestion re-checks `intelligencePlatform.canExecute(capabilityId, verb)` against the live registry every time, so a suggestion can never point at a capability that is unregistered, gapped, or not yet bound to a handler (Architecture Principle 6 — honest gaps).

### 2.2 Declared on the capability, not appended alongside it

`capability-registry.ts` keeps a `GUIDANCE` lookup table purely for readability, then merges it onto each capability's own `SEED_CAPABILITIES` entry before registration:

```ts
const SEED_CAPABILITIES: readonly Capability[] = SEED_CAPABILITIES_BASE.map((cap) =>
  GUIDANCE[cap.id] ? { ...cap, guidance: GUIDANCE[cap.id] } : cap,
);
```

The result is that `intelligencePlatform.getCapability("planner").guidance` is exactly as much a part of the Planner capability's descriptor as its `apiSurface` or `supportedIntents` — there is no second table anywhere that also claims to know how a Planner answer should continue. This is the extension the EWO's architecture principles require: *"Existing capabilities must be extended before introducing new guidance definitions"* and *"No duplicate workflow ownership may be introduced."*

The seven capabilities that carried an INT38 `JOURNEY_MAP` edge (nutrition-knowledge, meals, planner, shopping, pantry, diary, household) now carry the equivalent — and richer — guidance directly:

| Capability | primaryAction → | relatedActions | followUpActions → | completionCriteria (satisfied by) |
|---|---|---|---|---|
| nutrition-knowledge | meals/read "Find Matching Meals" | meal-discovery/search | planner/read "Plan This Week" | planner/read |
| meals | planner/read "Plan Your Week" | nutrition-knowledge/read | shopping/read "Build Shopping List" | planner/read |
| shopping | pantry/read "Compare with Pantry" | partners/read | planner/read "Review Your Plan" | pantry/read |
| planner | nutrition-knowledge/read "Check Nutrition Balance" | household/read | shopping/read "Build Shopping List" | shopping/read |
| pantry | meals/read "Find Meals I Can Cook" | pantry-discovery/search | planner/read "Plan With What I Have" | planner/read |
| diary | nutrition-knowledge/read "See Nutrition Insights" | — | planner/read "Adjust This Week's Plan" | planner/read |
| household | planner/read "Plan Around Preferences" | — | — | planner/read |

Every capability also declares a `recommendedJourneys` — an ordered, named multi-step path (e.g. Nutrition → Meal → Plan for nutrition-knowledge) satisfying the EWO's "recommended companion journeys" requirement explicitly, independent of the turn-by-turn suggestion mechanics above.

### 2.3 The Companion is now a pure consumer

`companion-guidance.ts` no longer holds a journey graph. `buildGuidanceSuggestions(successCapabilityIds, canExecute, getGuidance)` walks, for each capability that actually produced data this turn, its own declared `primaryAction → relatedActions → followUpActions` (in that priority), dedupes by target *domain* (never re-suggesting a domain already answered this turn), gates every candidate through `canExecute`, and caps at 2 — identical shape and discipline to INT38, sourced from the registry instead of a static map. `CAPABILITY_DOMAIN` (capability id → one of the 7 Companion Card UI domains) stays in the Companion layer, because it is presentation vocabulary, not workflow knowledge — it says nothing about which capability leads to which, only which UI page a capability's answers belong on.

A worked example of the honesty guarantee (test §1, `test-intelligence-capability-guidance-goals.ts`): the "meal" domain is reachable through two different capabilities (`meals` and `meal-discovery`). If `meals/read` is specifically gapped, `meal-discovery/search` (a *different, real* capability) still resolves the suggestion — an honest substitution, not a fabrication, because it is still a live, registered, executable capability. If a domain is reachable through only *one* capability and that capability is gapped, the suggestion for that domain disappears entirely rather than being invented.

---

## 3. Recovery guidance — the Companion on an unsuccessful turn

`buildRecoverySuggestions(attemptedCapabilityIds, canExecute, getGuidance)` reuses the **exact same** Capability Guidance Registry data, called from `conversation-gateway.ts`'s fallback branch instead of its success branch, with the capabilities the resolver actually **attempted** this turn (not the ones that succeeded — there are none). It prioritises `relatedActions` before `primaryAction`/`followUpActions`: recovery means "try something else at the same level", not "go deeper into a journey that just failed".

```
buildGuidanceSuggestions  (success): primary → related → follow-up
buildRecoverySuggestions  (failure): related → primary → follow-up
```

`TurnResult.guidanceKind` (`"next-step" | "recovery" | undefined`) tells every downstream consumer — the API response, the persisted "shown" event, the client — which mode produced a given suggestion set, without needing to re-derive it from `fallbackState`.

This directly satisfies the EWO's *"unsuccessful interactions also offer the most appropriate alternative actions or recovery paths where possible"* — "where possible" is enforced structurally: a capability with no declared `relatedActions`/`primaryAction` (or one whose declared actions are all gapped) simply produces `[]`, exactly like the success path. Nothing is invented to fill the gap (test §2).

A genuine **no-route** turn (the resolver produced no intent at all) has no capability to recover from and — correctly — offers no recovery guidance; this is different from a **no-knowledge**/**no-results**/**internal-error** turn, where the resolver *did* identify a capability and recovery guidance from that capability's own registry entry is offered.

---

## 4. Goal Completion tracking

### 4.1 The six states, and where each one now lives

| State | Signal | Where it lives |
|---|---|---|
| Intent recognised | The resolver routed to ≥1 non-baseline capability this turn | `conversation_turns.resolved_intent` (now populated on every turn, not just write-intent turns) |
| Capability executed | A routed capability returned real data (`fallbackState === null`) | `conversation_turns.fallback_state` (new column) + `resolved_intent` |
| Guidance presented | A "shown" `companion_guidance_events` row | Existing INT38 table (unchanged ownership) |
| Guidance followed | A "clicked" `companion_guidance_events` row | Existing INT38 table (unchanged ownership) |
| Goal completed | A "clicked" row whose `(sourceCapabilityId, targetCapabilityId, targetVerb)` matches a `completionCriteria` entry the **source capability itself** declared | `companion_guidance_events` (+3 new nullable columns) joined against the Capability Guidance Registry at analytics time |
| Goal abandoned | The honest complement: shown but never followed | Derived at analytics time — never a separately stored "abandoned" event |

No new table was introduced. `conversation_turns.resolved_intent` already existed (INT18) but was never populated; INT39 populates it with the routed capabilities' `(capabilityId, verb, status)` for **every** turn, successful or not — this alone makes "intent recognised" and "capability executed" queryable facts instead of requiring a new write path. `conversation_turns.fallback_state` makes the previously-ephemeral INT35 classification durable. `companion_guidance_events` gains three nullable columns (`source_capability_id`, `target_capability_id`, `target_verb`) so a click can be matched against the *specific* capability action it followed, not just a domain string — domains are many-to-one over capabilities (e.g. "shopping" is served by both `shopping` and `partners`), so domain-only matching could not honestly distinguish "the user completed shopping's own goal" from "the user merely looked at supermarkets".

**"Goal completed" is a stricter, more honest signal than "guidance followed".** A click only counts as completing the goal when it matches the *source capability's own declared* `completionCriteria` — not any click on any suggestion. This is a deterministic proxy, in the same spirit as INT38's click-through proxy for "task completion", extended so it is capability-owned rather than assumed. Deeper cross-page completion tracking (did the user actually finish adding the meal to the planner?) would require new business-data ownership this workstream must not introduce — exactly the same boundary INT38 already drew for task completion, now applied one level deeper.

### 4.2 Recovery after a failed conversation

`computeRecoveryAfterFailure` walks each conversation thread's assistant turns in order; for every unsuccessful turn, it checks whether the **next** assistant turn in the same thread succeeded. A failed turn with no follow-up turn (the user simply left) is excluded from the rate's denominator rather than counted as "not recovered" — an honest gap, since the platform genuinely cannot know what would have happened next.

### 4.3 Action-level conversion

`computeHighestConvertingGuidanceActions` / `computeIgnoredGuidanceActions` aggregate `companion_guidance_events` at **action** granularity (`sourceCapabilityId → targetCapabilityId + verb`) rather than the coarser domain-pair granularity INT38's `companion-guidance-analytics.ts` already provides — necessary because one domain can be served by more than one capability. Both require a minimum sample size (3 "shown" events) before a row is trusted, exactly like every other ranked list in this system; "highest converting" additionally requires at least one click (a reliably-sampled, zero-click action has no conversion to rank as "highest" — it belongs in "ignored" instead, and does appear there).

---

## 5. Dashboard extensions

`GET /api/intelligence/learning/dashboard` (admin-only, unchanged auth) gains one additive top-level key, `goalCompletion`:

```jsonc
{
  "goalCompletion": {
    "funnel": { "intentRecognised": 0, "capabilityExecuted": 0, "guidancePresented": 0, "guidanceFollowed": 0, "goalCompleted": 0, "completionRate": null, "abandonmentRate": null },
    "recoveryAfterFailure": { "rate": null, "totalFailed": 0, "totalRecovered": 0, "totalWithoutFollowUp": 0 },
    "highestConvertingActions": [],
    "ignoredActions": []
  }
}
```

`admin-companion-intelligence-page.tsx` adds: Goal Completion Rate / Goal Abandonment Rate / Recovery-After-Failure-Rate stat tiles, a five-stage funnel card, and Highest-Converting / Frequently-Ignored guidance-action tables — every rate is `null` (rendered "No data yet") below its denominator, every ranked list carries a `reliable` flag rather than hiding sparse rows, matching every other metric already on this dashboard. "Most successful journeys" and "Abandonment opportunities" (domain-pair granularity) already existed from INT38 and are unchanged — INT39 adds the finer-grained, capability-level views alongside them rather than replacing them.

---

## 6. Governance compliance

- **Guidance belongs to capabilities, not the Companion** — `companion-guidance.ts` contains zero business/workflow knowledge after this change; every suggestion is a read of `Capability.guidance`, gated by the live registry.
- **The Companion orchestrates, never owns** — recovery and success guidance share one resolver (`resolveSuggestions`) and one data source; the only Companion-owned concept is *which UI domain a capability's answers render on* (`CAPABILITY_DOMAIN`), which is presentation, not workflow.
- **Existing capabilities extended before new guidance definitions** — every guidance declaration in §2.2 lives on an existing `SEED_CAPABILITIES` entry; no new capability was registered.
- **No duplicate workflow ownership** — `companion_guidance_events` (shown/clicked, domain strings) remains INT38's table, extended with nullable capability-identity columns rather than superseded by a second table; the six-state funnel is computed by joining the extended table against the registry, never by re-declaring shown/click tracking.
- **Honest gaps preserved** — every rate (`completionRate`, `abandonmentRate`, `recoveryAfterFailure.rate`) is `null` below its denominator; a capability with no declared guidance returns `undefined`, never a fabricated default; a guidance action whose target is gapped disappears rather than being invented; a failed turn with no follow-up is excluded from the recovery denominator rather than assumed unrecovered.
- **Deterministic routing preserved** — guidance/recovery resolution is a pure, static-data read plus an executability check; it can never be an LLM call and can never alter which capability handles an utterance (unchanged from INT38; re-verified — test §8 in `test-intelligence-companion-guidance.ts` still asserts byte-identical resolver output before/after feedback and guidance-event writes).
- **Permission-aware access preserved** — the `goalCompletion` dashboard section inherits the existing `assertAdmin` gate; the guidance-click route's ownership check (INT38) is unchanged, only its accepted body fields grew (optional, additive).
- **Existing Capability Registry ownership preserved** — the Capability Guidance Registry is `CapabilityRegistry.getGuidance()`/`getCompletionCriteria()`, methods on the *existing* registry class, not a new registry instance or a parallel store.
- **Continue using the workspace as context, never a restriction** — neither `buildGuidanceSuggestions` nor `buildRecoverySuggestions` take the current `surface` as an input; guidance is generated purely from which capabilities produced (or were attempted for) data this turn, regardless of the page the user is on (unchanged from INT38, re-verified for the new recovery path).

---

## 7. Files changed

| File | Change |
|---|---|
| `server/intelligence/types.ts` | + `GuidanceAction`, `CompletionCriterion`, `CapabilityGuidance`; `Capability.guidance?` |
| `server/intelligence/capability-registry.ts` | + `GUIDANCE` seed merged onto 7 `SEED_CAPABILITIES` entries; + `getGuidance()`, `getCompletionCriteria()` |
| `server/intelligence/intelligence-platform.ts` | + `getGuidance()` passthrough |
| `server/intelligence/conversation/companion-guidance.ts` | **Rewritten** — static `JOURNEY_MAP` removed; now reads the Capability Guidance Registry; + `buildRecoverySuggestions`; `GuidanceSuggestion` gains `sourceCapabilityId`/`targetCapabilityId`/`verb` |
| `server/intelligence/conversation/companion-goal-analytics.ts` | **New** — pure Goal Completion funnel, recovery-after-failure, action-level conversion |
| `server/intelligence/conversation/conversation-gateway.ts` | Recovery guidance wired into the fallback path; `fallbackState`/`resolvedIntent` persisted on the assistant turn; capability identity passed to "shown" events; `guidanceKind` on `TurnResult` |
| `server/intelligence/conversation/conversation-store.ts` | `NewConversationTurn.fallbackState`; + `GoalSignalTurn`, `listAssistantTurnGoalSignals()` (DB + in-memory) |
| `server/intelligence/conversation/companion-feedback-store.ts` | `NewGuidanceEvent` gains optional `sourceCapabilityId`/`targetCapabilityId`/`targetVerb`, persisted/read (DB + in-memory) |
| `shared/schema.ts` | + `conversation_turns.fallback_state`; + `companion_guidance_events.{source_capability_id, target_capability_id, target_verb}` |
| `scripts/apply-companion-goal-columns.ts` | **New** — idempotent `ADD COLUMN IF NOT EXISTS` DDL (drizzle-kit push is interactive in this environment) |
| `server/routes.ts` | `guidanceKind` on `POST /turn`; capability identity accepted on `POST guidance-click`; `goalCompletion` on `GET /learning/dashboard` |
| `client/src/components/conversation/companion-card.ts` | `GuidanceSuggestion`/`CompanionGuidanceAction` carry capability identity |
| `client/src/components/conversation/FloatingAssistant.tsx` | `guidanceKind` threaded through; guidance block relabels "You could also try" on recovery; click POST carries capability identity |
| `client/src/pages/admin-companion-intelligence-page.tsx` | + Goal Completion stat tiles, funnel card, highest-converting/ignored action tables |
| `server/tests/test-intelligence-companion-guidance.ts` | §1 updated for the registry-driven signature (capability ids, not domain strings); §8 hint-shape fix |
| `server/tests/test-intelligence-capability-guidance-goals.ts` | **New** — 139 assertions |
| `package.json` | + `test:intelligence-capability-guidance-goals`, added to the `test` chain |

Full chain (`npm test`, 25 suites) passes with zero regressions to INT35/INT35B/INT35C/INT36/INT37/INT38 behaviour. `tsc --noEmit` and `vite build` are clean for every file this workstream touched.
