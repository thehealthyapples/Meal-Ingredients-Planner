# INT41 — Capability Enrichment

**Status:** 🟢 IMPLEMENTED
**Date:** 2026-07-02
**Branch:** int1-intelligence-platform
**EWO:** EWO-INT41 (🟡 AMBER)
**Builds on:** [`INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md`](./INT39_CAPABILITY_GUIDANCE_REGISTRY_AND_GOAL_COMPLETION.md) · [`INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md`](./INT37_COMPANION_CARD_EXPERIENCE_IMPLEMENTATION.md) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md)
**Governing architecture:** [`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) · [`THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) · [`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`](../architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md)
**Tests:** `npm run test:intelligence-companion-enrichment` (26 assertions, new) — in the `npm test` chain. Full chain (29 suites) re-run with zero regressions.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-int41-capability-enrichment-20260702` → `4a2da735f5b80bac2da4dd306c387adeb5e431de` |
| Working tree at start | Intentionally dirty — prior uncommitted INT35–INT40 work already present on this branch, unrelated to this workstream except where this workstream extends it (capability-registry.ts, intelligence-platform.ts, conversation-gateway.ts, companion-card.ts, FloatingAssistant.tsx) |
| This task's writes | See §7 Files changed |
| Rollback to committed state | `git checkout rollback/before-int41-capability-enrichment-20260702` |
| Rollback the registry extension only | Revert `types.ts`'s `enrichment?` field, `capability-registry.ts`'s `ENRICHMENT` table/merge/`getEnrichment()`, and `intelligence-platform.ts`'s `getEnrichment()` — additive-only, nothing else reads or depends on them |

---

## 1. Objective

INT39 gave every capability a way to declare structured "where to next" **guidance** — a navigable pointer at another capability. INT41 gives every capability a second, independent way to declare **enrichment**: contextual insights, explanations, recommendations and educational content that sits *alongside* its primary answer rather than pointing away from it. Where guidance answers "what should I do next?", enrichment answers "what's worth knowing about this answer, right now?" — matching EWO-INT41's ask to let capabilities "expose richer enrichment alongside their primary responses" without inventing a second conversation surface or a second content owner.

The two extensions are deliberately parallel and deliberately separate:

| | Guidance (INT39) | Enrichment (INT41) |
|---|---|---|
| Answers | "Where should I go next?" | "What's worth knowing right now?" |
| Shape | A `(capabilityId, verb, label)` pointer, re-checked against `canExecute()` at resolution time | Static prose (`kind`, `title`, `body`), never executable, never a navigation target |
| Gating | Every suggestion must resolve to a genuinely executable capability | No gating needed — content, not an action; nothing to execute or navigate |
| Rendered as | Tappable chips ("Where to next?") | Read-only info rows ("Insight" / "Good to know" / "Suggestion" / "Learn") |

## 2. Architecture — a second registry extension, not a second registry

Following the INT39 discipline exactly: enrichment is **capability-owned**, declared once per capability in `capability-registry.ts`, and consumed through a thin, stateless resolver — never a Companion-owned table, never a second copy of the content.

- **`server/intelligence/types.ts`** — `EnrichmentKind` (`"insight" | "explanation" | "recommendation" | "educational"`), `CapabilityEnrichmentItem` (`kind`, `title`, `body`, optional `appliesToVerbs`), and `CapabilityEnrichment` (`{ items: readonly CapabilityEnrichmentItem[] }`). `Capability.enrichment?` sits next to `Capability.guidance?` — both optional, both absent by default (no fabricated content for a capability that declares none).
- **`server/intelligence/capability-registry.ts`** — a new `ENRICHMENT` seed table, declared and merged onto `SEED_CAPABILITIES_BASE` the *same way* `GUIDANCE` already is (`ENRICHMENT[cap.id] ? { ...cap, enrichment: ENRICHMENT[cap.id] } : cap`). Seven capabilities declare content today: `nutrition-knowledge`, `meals`, `planner`, `shopping`, `pantry`, `diary`, `household` — the same set INT39 gave guidance to, kept in sync deliberately (not by construction) since both extensions describe the same base capabilities. `CapabilityRegistry.getEnrichment(capabilityId)` is the new accessor, mirroring `getGuidance()` exactly.
- **`server/intelligence/intelligence-platform.ts`** — `IntelligencePlatform.getEnrichment(capabilityId)` delegates to the registry, the same one-line pattern as `getGuidance()`. This is the single seam every consumer (today: the Companion; tomorrow: any other Intelligence surface) reads through — "reusable across all Intelligence surfaces" is satisfied by there being exactly one accessor, not by building multiple UIs.
- **`server/intelligence/conversation/companion-enrichment.ts`** (new) — the thin consumer, structurally identical to `companion-guidance.ts`'s resolver: pure, deterministic, no LLM call, capped (`MAX_ENRICHMENT_ITEMS = 3`), deduplicated per source capability, and — new to this extension — filtered by `appliesToVerbs` so a capability can scope an item to only the verbs it's actually relevant for (e.g. a "save this to your cookbook" recommendation only makes sense on `search`, not on a `read` of one meal already in hand). It **reuses** `companion-guidance.ts`'s exported `CAPABILITY_DOMAIN` table rather than declaring a second capability→domain mapping — one source of truth for "which Companion Card domain does this capability belong to," used by both extensions.

No new capability, no new owner, no live computation: every word of enrichment content is static prose a capability author wrote once in `ENRICHMENT`, exactly as every guidance label is static prose in `GUIDANCE`.

## 3. Wiring — the same success signal guidance already uses

`conversation-gateway.ts`'s `buildGroundedResponse()` already computed `successCapabilityIds` (the capabilities that produced real `"ok-data"` grounding this turn) to drive `buildGuidanceSuggestions()`. INT41 reuses that exact computation, additionally carrying each source's `verb` (`ResolvedIntent.verb`, already in scope) so `companion-enrichment.ts` can apply its `appliesToVerbs` filter:

```ts
const enrichmentSources = queryable
  .filter(ri => ri.baseline !== true && queryResults.get(ri.capability)?.status === "ok-data")
  .map(ri => ({ capabilityId: ri.capability, verb: ri.verb as IntentVerb }));
const enrichment = buildEnrichment(enrichmentSources);
```

This runs on the **successful path only** — every unsuccessful-turn branch (write-intent guard, provider unavailable, the four INT35 fallback states, an LLM transport failure) returns `enrichment: []`, the same discipline `guidance: []` already follows on those branches (recovery-mode guidance is still offered on failure; enrichment is not — a "here's something worth knowing about this answer" only makes sense once there is an answer). `TurnResult.enrichment` is always a `CompanionEnrichmentItem[]`, never `undefined`, matching `guidance`'s (not `actions`'/`discoveries`') contract.

Unlike INT38's guidance "shown" events, **enrichment records no analytics**. It is pure informational content with no click-through to measure — there is nothing to navigate to, so there is nothing to track. This keeps the workstream additive-only: no new table, no new dashboard section, no new privacy surface.

## 4. Presentation — a third, distinct block, never grafted onto a card

`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` permits a Companion Card to "surface key insights" but forbids it from becoming a second rendering of anything beyond a compact entity summary. Enrichment is **turn-level, not entity-scoped** — like guidance, it is not information about one discovered meal or shopping item, it is context about the *answer as a whole*. It is rendered in its own block, consistent with how INT38 guidance and INT40 actions were each kept structurally separate from Companion Cards rather than added as new card fields:

```
Companion Cards  (navigate-only, INT36/INT37)
      ↓
Enrichment       (informational-only, INT41 — NEW)
      ↓
Companion Actions (execute-only, INT40)
      ↓
Guidance         (navigate-only, INT38/INT39)
```

- **`client/src/components/conversation/companion-card.ts`** — `CompanionEnrichmentItem` type, mirroring the server shape. Unlike `GuidanceSuggestion → CompanionGuidanceAction` or the discovery→card transforms, there is **no resolve step**: enrichment carries no ref, no href, no navigation target to compute, so the server shape *is* the render shape.
- **`client/src/components/conversation/FloatingAssistant.tsx`** — `EnrichmentBlock`, a read-only list of rows (`kind` label + `title` + `body`, a `Lightbulb` icon), with **no buttons, no click handler, no mutation** — the firewall is structural: the component has nothing to wire a click to. Wired into `TurnBubble` / `ConversationThread` / top-level state (`enrichmentByTurn`) using the exact same ephemeral, session-memory, keyed-by-assistant-turn-id pattern `discoveriesByTurn`/`guidanceByTurn` already use (derived per turn, never persisted client-side — TIP3).

## 5. Definition of Done

- **What success looks like:** a successful Companion turn grounded in a capability that has declared enrichment (e.g. a nutrition answer) shows one to three short, capability-authored info rows beneath its Companion Cards — genuinely different content per capability, never fabricated, never present on a turn that didn't succeed or whose source capability declared nothing.
- **What must not break:** every existing read capability, discovery response, guidance suggestion, Companion Action, and the four INT35 fallback states. Proven by the unchanged 29-suite `npm test` chain (was 28 suites pre-INT41; this workstream adds the 29th).
- **Manual verification:** `npx tsc --noEmit` clean for every file this workstream touched (pre-existing, unrelated baseline errors in `household-discovery-handler.ts` and `shopping-discovery-port.ts` confirmed present and unchanged before/after — the same baseline INT40 documented).

## 6. Data Impact

- Reads existing data: **NO new reads** — enrichment content is static, declared in-process; the gateway wiring reuses data (`successCapabilityIds`, `verb`) already computed for guidance.
- Writes new data: **NO** — no new table, no new column, no persistence of any kind. Enrichment is derived per turn and held only in ephemeral client state, like discoveries and guidance.
- Changes meaning of existing data: **NO.**
- Requires backfill: **NO.**

## 7. Trust Check

- **Could this mislead the user?** No — every item is static, capability-authored educational/organisational content, never a live computation, never a personalised claim, never a medical or nutrition-outcome claim (the same EFSA/health-claim firewall the LLM system prompt enforces was applied when authoring `ENRICHMENT`'s content).
- **Could this fabricate certainty?** No — an item is only ever surfaced when a real capability declared it in the registry; a capability with no declared enrichment (e.g. `administration`, `developer`, or any capability without an `ENRICHMENT` entry) yields `[]`, never a generic fallback.
- **Is anything guessed but shown as real?** No — `appliesToVerbs` scoping is declarative and static; nothing is inferred from turn content.
- **What happens if the system is wrong?** Worst case is an irrelevant-but-harmless static tip attached to a correct answer — there is no mutation, no navigation, and no claim about the user's own data for this content to get wrong.
- No architectural duplication introduced: **YES** confirmed — one owner per fact (§8).
- No new source of truth created: **YES** confirmed — `Capability.enrichment` lives on the existing capability descriptor; nothing else stores it.
- No runtime behaviour altered for capabilities outside this slice: **YES** confirmed — capabilities with no `ENRICHMENT` entry behave exactly as before this workstream; `buildGuidanceSuggestions`, `buildActionProposals`, and every existing gateway branch are unchanged except for the additive `enrichment` field threaded alongside their existing returns.

## 8. Governance compliance

- **Enrichment reuses the existing Capability Registry; the Companion never authors or owns content itself** — `companion-enrichment.ts` holds zero content of its own (proven by test §4: an empty injected registry yields zero output regardless of input).
- **Honest gaps preserved** — a capability with nothing to add yields `[]`, never a fabricated default (test §1, §2).
- **Deterministic routing/content preserved** — `buildEnrichment()` is pure (test §4: byte-identical output for identical input); no LLM is in the enrichment path.
- **Existing ownership boundaries preserved** — `companion-enrichment.ts` imports `CAPABILITY_DOMAIN` from `companion-guidance.ts` rather than re-declaring the capability→domain mapping; one source of truth for two independent extensions.
- **Companion Card Experience Principle preserved** — enrichment never edits, never navigates, never duplicates a canonical page; it is content, structurally incapable of the actions the Principle forbids (no `href`, no mutation handler exists on the type or the component).
- **Existing Capability Registry ownership preserved** — no second registry; `getEnrichment()` is bound the same way `getGuidance()` is, on the same `Capability` record.
- **Permission-aware access unaffected** — enrichment carries no user data and requires no additional permission check; it is gated only by "did this capability's own read succeed this turn," the same success signal already governing guidance.

---

## 9. Scope Lock

**Implemented:**
- `CapabilityEnrichment` / `CapabilityEnrichmentItem` / `EnrichmentKind` types; `Capability.enrichment?`.
- The `ENRICHMENT` seed table for the same seven capabilities INT39 gave guidance to, plus `CapabilityRegistry.getEnrichment()` and `IntelligencePlatform.getEnrichment()`.
- `companion-enrichment.ts` — deterministic resolution with per-source dedup, verb-scoping (`appliesToVerbs`), and a 3-item cap.
- Gateway wiring: `enrichment` on `TurnResult`, populated on the successful path only, `[]` on every unsuccessful/degraded branch.
- `POST /api/intelligence/conversation/turn` response gains `enrichment`, omitted when empty (matching the `guidance`/`discoveries`/`actions` convention).
- Client: `CompanionEnrichmentItem` type, `EnrichmentBlock` component, full state wiring through `FloatingAssistant.tsx`.
- 26 new automated assertions (`test-intelligence-companion-enrichment.ts`), added to the `npm test` chain.

**Explicitly excluded (honest gaps, not implemented):**
- No dashboard/analytics extension for enrichment — the EWO did not ask for one, and enrichment has no click-through event to measure (§3). A future workstream could add "which enrichment kinds are shown most often" if a real need arises; not fabricated here.
- No enrichment declared for capabilities beyond the seven listed above (e.g. `analyser`, `partners`, `templates`, the `*-discovery` capabilities) — an honest gap, not an oversight; any capability owner can add an `ENRICHMENT` entry for itself with zero change to `CapabilityRegistry`, `companion-enrichment.ts`, or any consumer.
- No per-user personalisation of enrichment content — every item is the same static prose for every user, by design (Trust Check §7).

**Suggestions for follow-up workstreams (not implemented without approval):**
- Declare enrichment for the remaining capabilities once real content is written and reviewed for the EFSA/health-claim firewall.
- If future capabilities need enrichment scoped by more than verb (e.g. by surface, or by whether the answer was empty vs. populated), extend `CapabilityEnrichmentItem` additively — the resolver's dedup/cap/gating discipline does not need to change.

---

## 10. Files changed

| File | Change |
|---|---|
| `server/intelligence/types.ts` | + `EnrichmentKind`, `CapabilityEnrichmentItem`, `CapabilityEnrichment`; `Capability.enrichment?` |
| `server/intelligence/capability-registry.ts` | + `ENRICHMENT` seed table (7 capabilities); merged into `SEED_CAPABILITIES`; + `CapabilityRegistry.getEnrichment()` |
| `server/intelligence/intelligence-platform.ts` | + `IntelligencePlatform.getEnrichment()`; doc-comment ledger entry |
| `server/intelligence/conversation/companion-enrichment.ts` | **New** — pure `buildEnrichment()` resolver |
| `server/intelligence/conversation/conversation-gateway.ts` | `TurnResult.enrichment`; computed alongside guidance on the success path; `[]` on every unsuccessful/degraded branch |
| `server/routes.ts` | `POST .../turn` response gains `enrichment`, omitted when empty |
| `client/src/components/conversation/companion-card.ts` | + `CompanionEnrichmentItem` type |
| `client/src/components/conversation/FloatingAssistant.tsx` | + `EnrichmentBlock`; `enrichmentByTurn` state; wired into `TurnBubble`/`ConversationThread`/`TurnApiResponse` |
| `server/tests/test-intelligence-companion-enrichment.ts` | **New** — 26 assertions across 4 sections |
| `package.json` | + `test:intelligence-companion-enrichment`, added to the `test` chain |

Full chain (`npm test`, 29 suites) passes with zero regressions. `tsc --noEmit` clean for every file this workstream touched (pre-existing, unrelated baseline errors in two other files confirmed unchanged before/after this workstream, same baseline INT40 documented).
