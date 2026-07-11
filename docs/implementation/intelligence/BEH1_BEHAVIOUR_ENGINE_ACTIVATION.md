# BEH1 — Behaviour Engine Activation — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform` (on top of OBS1 / OBS2)
**Risk:** 🟡 AMBER
**Reason:** Architectural activation of an existing pure engine plus one additive telemetry kind — no schema change, no business logic change, and no change to a single word the user reads.

**Governing architecture:** `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (INT21, §2.4 added by this workstream), `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1/OBS2, §2.2 twelfth kind added by this workstream), `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1)

---

## 0. THE SCOPE INTERPRETATION THIS WORKSTREAM ENCODES

The brief asks BEH1 to "make Behaviour the canonical owner of Companion decisions." The governing architecture permits the Behaviour Engine to own **exactly one decision** and forbids it every other:

> INT21 §2.3 — *"the Behaviour Engine owns a decision, not a fact: given this already-produced content and this user's chosen voice, what are the exact words?"*

INT21 §3 then names nine boundaries the engine may never cross — facts, truth of gaps, eligibility, selection, grounding bytes, confirmation tiers, conversation state, identity, and knowledge in any language. So **"Companion decisions" is read here as "the Companion's voice/behaviour decision"**, the only decision INT21 lets this engine own. A broader reading (owning which facts are selected, which capabilities run, or what is true) would conflict with §3 and §10 and would have required a STOP under `ENGINEERING_WORKFLOW.md` STEP 2. The brief's own guardrails — *never own observations, never own business knowledge, never bypass the Intent Engine or Capability Registry* — confirm the narrow reading.

**What "activate" therefore means, concretely.** Before BEH1 the engine's one decision existed only as a bare `PersonalityId` threaded through the gateway and applied at three seams, surviving in telemetry as a `personalityId` metadata crumb on two *other* observation kinds. It was never named, never sealed, never explained, and never recorded for the interactions where no voice ran at all. BEH1 makes the decision **explicit, single, sealed, explained, and recorded for every interaction** — and changes nothing about what the Companion says.

---

## 1. ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-beh1-behaviour-engine-20260709` → `22e5bc7e0b9166d16b10831c47e185f4d9c26bba` |
| Working tree | Intentionally dirty — inherited in-progress OBS1/OBS2/INT20/INT21 work already on the branch (36 paths at start) |
| This task's writes | `server/intelligence/conversation/behaviour-engine.ts`, `server/intelligence/conversation/conversation-gateway.ts`, `server/intelligence/observation/observation-engine.ts`, `server/intelligence/observation/execution-timeline.ts`, `server/routes.ts`, `client/src/pages/admin-behaviour-workbench-page.tsx`, `server/tests/test-intelligence-behaviour-decision.ts` (new), `server/tests/test-intelligence-observation-telemetry.ts`, `package.json`, `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`, `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md`, `docs/implementation/intelligence/BEH1_BEHAVIOUR_ENGINE_ACTIVATION.md` (new) |
| Rollback to committed state | `git checkout rollback/before-beh1-behaviour-engine-20260709` |

No migration was applied and none is required: the twelfth observation kind is a value in a `text` column, and the decision rides in the existing JSONB `metadata` bag (the schema's extensibility rule — *"new analytical needs never add columns"*).

---

## 2. REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (INT21 — the governing document for this workstream)
- [x] `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1/OBS2 — telemetry ownership and capture discipline)
- [x] `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1 §4.2 — the engine's Companion-layer position)
- [x] `docs/implementation/intelligence/OBS2_EXECUTION_TIMELINE.md` (the Execution Timeline this workstream integrates with)
- [x] `docs/implementation/intelligence/INT19_CONTEXT_COMPOSITION_ENGINE_BASELINE_AND_ROLLOUT.md` §3.1 (Native Context Views)

---

## 3. WHAT WAS DELIVERED

### 3.1 The decision layer (`behaviour-engine.ts` — extended in place, no second engine)

| Export | What it is |
|---|---|
| `resolveBehaviour(storedPreference)` | Pure and **total**: decides the voice once per interaction from the raw `user_preferences.companionPersonality` value, and records honestly whether that voice was *chosen* or *defaulted*. Every input — `null`, `undefined`, `""`, `42`, `{}`, an unknown id — resolves to a registered voice. There is no error state at the voice seam. |
| `sealBehaviourDecision(input)` | Pure: closes the decision with the outcome, the surfaces the transform genuinely touched, and a deterministic reasoning trail. Same inputs → byte-identical decision. |
| `describeBehaviourRegistry()` | A read-only projection of the one Personality Registry for the Workbench's "personality applied" panel — read live per request, never copied into an observation. |

**Four closed vocabularies**, each closed to what is *genuinely live* rather than to what is imaginable:

- `BEHAVIOUR_SURFACES` — `system-prompt-fragment`, `fallback-voicing`, `guidance-voicing`. The dormant exports (`phraseGrowth`, `phraseNotice`, `buildGreeting`, `buildCelebration`) name **no surface**, because they have no route: BEH-P1/BEH-P2 add theirs when they are wired.
- `BEHAVIOUR_OUTCOMES` — `voiced`, `voiced-fallback`, `voiced-error`, **`not-voiced`**.
- `BEHAVIOUR_OVERRIDE_REASONS` — `none`, `no-stored-preference`, `unrecognised-preference`.
- `BehaviourConfidenceBasis` — `stored-preference` | `platform-default`.

**Three definitions that had to be honest, not merely plausible:**

1. **Behaviour confidence is voice *provenance*, not quality.** The engine is deterministic, so a "confidence" in its own phrasing would be fabricated. What the engine genuinely does or does not know is whether the applied voice is the one the user chose. So `confidence` is `1` when an explicit, recognised preference resolved, and `0` when the platform default was applied instead. There is no middle value, because there is no middle knowledge. It is never a model score, and nothing reads it back.

2. **A behaviour override is the engine's fail-safe default firing** (INT21 §4.1 — *"a broken preference degrades to the default voice, never to silence or a crash"*), recorded with the value that failed to resolve. It is not an operator-facing control, and BEH1 adds no mechanism to force a voice: the Workbench stays read-only.

3. **`not-voiced` records the interactions no voice touched.** Two strings still reach the user without passing through the engine — the write-intent refusal and the provider-unavailable copy, both in `conversation-gateway.ts`. Rather than let the timeline imply a voice ran, BEH1 records `outcome: "not-voiced"` with a reason code. The grandfathered debt INT21 §8/§10 names is now *visible in telemetry* instead of invisible.

### 3.2 The capture points (`conversation-gateway.ts`)

The gateway resolves the voice once (`resolveBehaviour`, immediately after reading the preference) and threads a `BehaviourResolution` — not a bare id — into `buildGroundedResponse`. Each of the **five exit paths** seals and records exactly one decision:

| Exit path | Outcome | Surfaces touched |
|---|---|---|
| Write-intent guard | `not-voiced` | — (`escalation-copy-not-registry-owned`) |
| Provider unavailable | `not-voiced` | — (`provider-unavailable-copy-not-registry-owned`) |
| Honest gap (`turn-fallback` state) | `voiced-fallback` | `fallback-voicing` (+ `guidance-voicing` when recovery suggestions exist) |
| LLM generation failed | `voiced-error` | `system-prompt-fragment`, `fallback-voicing` |
| Answered | `voiced` | `system-prompt-fragment` (+ `guidance-voicing` when suggestions exist) |

**The engine records nothing.** `recordObservation` is called by the gateway, never by the engine — Observation Engine §4 rule 4: *"Pure modules (the Notice Engine, the Behaviour Engine, the Context Composition Engine's composer) never record — their callers do."* A test asserts the engine's source contains no reference to `recordObservation` and imports no observation, Intent Engine, Capability Registry, or storage module.

### 3.3 The twelfth observation kind (`observation-engine.ts`)

`behaviour-decision` joins the closed taxonomy, with its capture point documented (`conversation-gateway.ts`). Growing the vocabulary is exactly the architecture decision the Observation Engine sanctions: *"extend this union + document the capture point."* No new store, no new seam, no new aggregation layer, no column.

`summarizeBehaviour(rows, windowDays)` is added beside the existing `summarize*` functions — a pure projection over `PlatformObservation[]`, joining `behaviour-decision` rows to `user-feedback` rows by the OBS2 `metadata.turnId` correlation id.

### 3.4 Execution Timeline integration (`execution-timeline.ts`)

- `TimelineTurn.behaviourDecision` — the full sealed decision, projected per turn.
- `TimelineTurn.behaviour` — retained, and now sourced from the decision, falling back to OBS2's legacy `personalityId` crumb for pre-BEH1 turns, and honestly `null` when neither exists. **Pre-BEH1 turns are shown as absent, never reconstructed.**
- `"behaviour-decision": "Behaviour decided"` joins the stage vocabulary, so the decision appears in the chronological flow and is clickable through to its underlying observation like every other event.

### 3.5 The Behaviour Admin Workbench (`/admin/behaviour`)

The existing OBS2 page is **extended, not duplicated** — one Workbench, two tabs.

| Required item | Where it is met |
|---|---|
| Active behaviour selected | "Active behaviour selected" table — decisions per applied voice |
| Behaviour reasoning | Per-turn "Behaviour reasoning" panel on the Execution Timeline turn card (the engine's own deterministic trail) |
| Personality applied | "Personality applied" cards — display name, description, 12-dimension profile, priorities, label prefix, tone fragment, read live from the registry |
| Behaviour outcome | Outcome distribution + per-voice columns (voiced / honest gap / error / not voiced) |
| Behaviour confidence | Window stat tile + per-turn confidence and basis |
| Behaviour effectiveness | Per-voice and window-level feedback rate, `—` when unrated |
| Behaviour overrides | Total, reasons, and the recent overrides table (requested → applied) |
| Behaviour analytics | Decisions, surfaces touched, per-day trend, override rate |

**API:** `GET /api/intelligence/observation/behaviour` (admin-only, read-only) returns `{ telemetry, registry }` — two halves from their two owners, joined for display and never merged, never persisted together.

---

## 4. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Entities touched: the Companion voice (PersonalityId — one closed key space owned by
  shared/companion-personality.ts) and the platform observation (platform_observations.id).
  The behaviour decision introduces no identity of its own: it is correlated by the
  Observation Engine's existing sessionId + metadata.turnId, not by a new key.

☑ One owner per fact
  · The user's voice choice        → user_preferences.companionPersonality (Profile capability)
  · Voice CONTENT (templates/tone) → personality-registry.ts
  · The voice DECISION (transform) → behaviour-engine.ts
  · The decision's durable RECORD  → platform_observations (observation-store.ts)
  · Timeline/analytics projections → observation-engine.ts + execution-timeline.ts (computed on read)
  No attribute has two stores that must agree. The Workbench reads the registry live rather
  than replaying a copy captured at record time, so a voice definition has exactly one form.

☑ No duplicate entities
  No new entity. `behaviour-decision` is a value in the existing closed `kind` vocabulary of
  the existing table — the extensibility path the Observation Engine architecture mandates.

☑ No duplicate ownership
  The Behaviour Engine gains no ownership of observations (it never calls recordObservation);
  the Observation Engine gains no ownership of voice (it stores what the gateway hands it and
  never phrases anything). `summarizeBehaviour` lives with the other summarizers, in the
  Observation Engine, because it aggregates observations — not because it understands voice.

☑ No duplicate state
  Nothing is persisted twice. The decision is derived per turn from a preference read fresh
  (never cached, never written into a conversation turn); its observation row is telemetry,
  not conversation state. No timeline table, no materialised aggregate, no cache.

☑ Extends existing architecture
  Extends: the one Behaviour Engine (in place), the one Personality Registry (unchanged),
  the one Observation Engine's closed-but-growable kind vocabulary, the one Execution
  Timeline projection, and the one Behaviour Admin Workbench page (a tab, not a page).

☑ Progressive enrichment where appropriate
  Not a knowledge entity. The behaviour decision is transactional telemetry: no enrichment
  is added, and retention is the observation store's existing 30-day / 50,000-row window.

☑ Honest gaps over fabricated information
  · `not-voiced` records interactions where no voice ran, rather than implying one did.
  · Effectiveness, override rate, and confidence are `null` when there is nothing to judge —
    never a fabricated 0 or 100%.
  · Feedback that names no recorded decision is counted as `unattributedFeedback`, never
    guessed into a voice.
  · Pre-BEH1 turns show `behaviourDecision: null` — absent, not reconstructed.
  · Confidence is defined as provenance precisely because a deterministic engine has no
    honest "quality" confidence to report.

☑ No permanent synchronisation bridge
  None. The Workbench joins telemetry and registry at read time for display; neither is kept
  in sync with the other, and neither is a copy of the other.

☑ Evolution over replacement
  Nothing is replaced. No store retires. The three voiced strings that still live outside the
  engine are named, counted, and left in place — recorded honestly as `not-voiced` /
  documented as CPA1 G5, and scheduled by INT21 §9 (BEH-P1), not silently absorbed here.
```

### AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ Uses the canonical Intelligence Platform
    The decision sits inside the one Conversation Gateway pipeline; no parallel path exists.
✓ Uses the Capability Registry
    Untouched and unreachable from the engine — a test asserts the engine imports no
    capability-registry module. Capability access is decided upstream, before any voice runs.
✓ Uses the Intent Engine
    Untouched and unreachable from the engine (asserted by the same test). The behaviour
    decision is sealed after intent resolution and capability invocation, never before.
✓ Reuses existing business services
    None are added, called, or modified. The engine performs no I/O.
✓ Does not create another assistant
    One Companion, six registers of one voice. No personality gains state, memory, or identity.
✓ Does not duplicate conversation state
    The decision is never written into a conversation turn. The conversation store is untouched.
✓ Uses registered capabilities only
    The Behaviour Engine is not a capability and registers none (CPA1 §7).
✓ Uses permission-aware access
    The Workbench routes are admin-only and read-only. Confirmation tiers are untouched: a
    Strong-tier action requires the same assent in every voice.
✓ Produces honest gaps rather than fabricated knowledge
    See the honest-gaps checklist item above — and the hard invariant is preserved: the
    disclosure a gap makes is identical in all six voices.
```

---

## 5. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Platform Observations (runtime telemetry)
Declared SoT: platform_observations (server/intelligence/observation/observation-store.ts)
New store created? NO
Existing store extended? YES — one new value (`behaviour-decision`) in the closed `kind`
  vocabulary, plus decision fields inside the existing JSONB metadata bag. No column, no
  index, no migration.
Consumer created? YES — the Behaviour view (GET /api/intelligence/observation/behaviour)
  and the Execution Timeline's behaviourDecision projection.
  If YES: reads from declared SoT? YES — observationStore only.

Domain affected: Companion Behaviour (voice)
Declared SoT: personality-registry.ts (voice content) · behaviour-engine.ts (the transform)
              · user_preferences.companionPersonality (the user's choice)
New store created? NO
Existing store extended? NO — no voice content added, removed, or reworded.
Consumer created? YES — routes.ts reads describeBehaviourRegistry() for the Workbench.
  If YES: reads from declared SoT? YES — the registry itself, live, per request.
```

No duplication is introduced, so no retirement plan is required.

---

## 6. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Companion Behaviour — the Companion's voice decision and every surface it speaks through.

Current Canonical Owner:
  server/intelligence/conversation/behaviour-engine.ts (the transform + the decision)
  server/intelligence/conversation/personality-registry.ts (the voice content)
  — one component, two halves (INT21 §2.2).

Current Runtime Consumer(s):
  · server/intelligence/conversation/conversation-gateway.ts — resolves the decision once
    per interaction, applies it at three seams, records it on all five exit paths
  · server/routes.ts — describeBehaviourRegistry() for the read-only Workbench
  · client/src/pages/admin-behaviour-workbench-page.tsx — read-only display

Duplicate Owners Remaining:
  NONE. There is exactly one Behaviour Engine and one Personality Registry. No second
  phrasing transform, template mechanism, or voice registry exists anywhere in the codebase.

Duplicate State Remaining:
  NONE. The voice choice lives once (user_preferences.companionPersonality), is read fresh
  every turn, and is never cached, copied into the Context Frame, or persisted onto a turn.

Duplicate Workflows Remaining:
  THREE voiced strings still reach the user without passing through the engine —
  the only remaining phrasing outside the canonical owner:
    1. client/src/components/conversation/FloatingAssistant.tsx:1465 — hardcoded empty-state
       greeting ("Hi, I'm Apple!" / "Ask me anything about your food and plans.") — CPA1 G5
    2. server/intelligence/conversation/conversation-gateway.ts — write-intent refusal copy
    3. server/intelligence/conversation/conversation-gateway.ts — provider-unavailable copy
  BEH1 does not remove them (that would be a user-visible voice change, outside scope lock).
  It makes (2) and (3) visible in telemetry as `not-voiced` decisions instead of silent.

Current Convergence (%):
  Behaviour decision recording: 100% — 5 of 5 gateway exit paths seal and record exactly one
    behaviour decision per interaction (verified by test and by driving all three reachable
    paths at runtime). Before BEH1: 0% — no decision record existed; a `personalityId` crumb
    rode on 3 of 5 paths, inside two other observation kinds.

  Voice-surface ownership: 63% — 5 of 8 Companion voice surfaces are owned by the
    Behaviour Engine + Personality Registry pair. Counted:
      OWNED (5): grounded-answer tone (systemPromptFragment) · the four honest-gap
        disclosures (voiceFallback) · guidance labels and order (voiceGuidanceSuggestions) ·
        growth statements (phraseGrowth, code-complete, no route) · voiced notices
        (phraseNotice, code-complete, no route)
      NOT OWNED (3): the three strings listed under Duplicate Workflows above.
    Unchanged by BEH1 — this workstream activates the decision, it does not migrate copy.

Target Convergence (%):
  Behaviour decision recording: 100% (achieved).
  Voice-surface ownership: 100%, via the separately gated workstreams below.

Next Planned Milestone:
  BEH-P1 (INT21 §9) — wire buildGreeting/buildCelebration into the Companion panel's empty
  state, closing CPA1 G5 and surface (1). Surfaces (2) and (3) require new registry template
  content (an escalation/degradation register per voice) and are named as a SUGGESTION below,
  not implemented — they are user-visible copy changes.

Remaining Architectural Risks:
  · Voice content review remains a human gate (INT21 §8.5, unchanged): a future personality
    or locale PR that weakens a disclosure *in wording* is caught by review and the §5.2
    acceptance criterion, not by a type. BEH1 adds a machine check for the decision's SHAPE
    (outcome, surfaces, counts, disclosure state identical across all six voices) but cannot
    type-check prose.
  · Observation timestamps are persist-time (OBS2 honest limit #1, unchanged): the "Behaviour
    decided" stage's position in the flow is exact in ordering terms only when its
    fire-and-forget write lands after the preceding stage's. Per-stage durationMs is exact.
```

---

## 7. DEFINITION OF DONE

**What success looks like**

- The Behaviour Engine is the single, canonical owner of the Companion's voice decision, and that decision is a named, sealed, explained value rather than a threaded id.
- Every interaction records exactly one behaviour decision — including the interactions where no voice ran.
- The Execution Timeline shows the decision and the engine's reasoning for it, per turn.
- The Behaviour Admin Workbench shows all eight required items, with honest nulls where there is nothing to report.

**What must not break**

- Not one word the user reads changes. Same answers, same disclosures, same suggestion sets, same confirmations, in all six voices.
- `OBS_DISABLE_CAPTURE=1` remains a functional no-op: disabling telemetry must change no behaviour.
- Capture can never fail, slow, or alter the observed turn.
- The engine remains pure: no I/O, no clock, no randomness, no persistence, no reference to the Intent Engine or Capability Registry.

**Manual test steps**

1. `npm run test:intelligence-behaviour-decision` → 114 passed, 0 failed.
2. `npm run dev`, then `GET /api/intelligence/observation/behaviour` unauthenticated → `403` (admin gate).
3. Sign in as an admin, open `/admin/behaviour`. The **Behaviour** tab shows decisions, confidence, effectiveness, overrides, outcomes, surfaces, the per-day trend, and the six registry cards. An empty window shows `—` for every rate, never `0%`.
4. Open the **Execution Timeline** tab, pick a session, open a turn: "Behaviour selected", the "Behaviour decision" panel, and the "Behaviour reasoning" bullets are present; a pre-BEH1 turn instead states the decision was not recorded.
5. Change your Companion personality in Settings, ask a question, and confirm the new turn's decision records the new voice with `confidence 1` and `override: none`.

---

## 8. VERIFICATION

| Check | Result |
|---|---|
| `test-intelligence-behaviour-decision` (new, 114 assertions, DB-free) | **114 passed, 0 failed** |
| `test-intelligence-observation-telemetry` (updated: 12-kind vocabulary) | 67 passed, 0 failed |
| `test-intelligence-execution-timeline` | 64 passed, 0 failed |
| `test-intelligence-conversation-gateway` | All tests passed ✓ |
| `test-intelligence-fallback` | 82 passed, 0 failed |
| `test-intelligence-notice-engine` | 42 passed, 0 failed |
| `test-intelligence-context-composition` | 105 passed, 0 failed |
| `test-intelligence-platform` / `test-intelligence-observability` / `test-intelligence-companion-actions` | 33 / 60 / 62 passed, 0 failed |
| Typecheck | No new errors. The only error in BEH1 files is the pre-existing `companionPersonality` error on the preferences read (OBS1 §5 / OBS2 §4 baseline, unchanged) |
| Runtime — boot | Dev server boots; migrations at head (`2026-07-08_platform_observations`); **no migration required** |
| Runtime — admin gate | `/api/intelligence/observation/behaviour` → `403` unauthenticated (as do `timeline/sessions` and `overview`) |
| Runtime — durable write | A `behaviour-decision` recorded through the real seam into Postgres, read back with `outcome`, `confidence`, `metadata.turnId` and its 3 reasoning entries intact; projected by both the timeline (`correlation: exact`) and `summarizeBehaviour` (override captured, feedback joined to the voice); rows deleted afterwards |
| Runtime — all three reachable gateway paths driven | **answered** → `voiced` / `["system-prompt-fragment","guidance-voicing"]`; **honest gap** → `voiced-fallback` / `["fallback-voicing","guidance-voicing"]`; **write-intent** → `not-voiced` / `[]` / `escalation-copy-not-registry-owned`. Timeline flow ends `… → Behaviour decided` in each |
| Runtime — privacy | The recorded decision metadata contains no utterance and no answer text (asserted at runtime on every path, and by test) |

**Known pre-existing failure, unrelated to BEH1:** `server/tests/test-intelligence-personality-platform.ts` fails at its one DB-dependent assertion (it inserts `user_preferences` directly and hits a Postgres syntax error). It is not registered in the `npm test` chain and was failing before this workstream. Not fixed here — out of scope.

---

## 9. DATA IMPACT

- **Reads existing data:** YES — `user_preferences.companionPersonality` (unchanged read, now passed raw to the engine instead of pre-normalised), and `platform_observations` for the read-only views.
- **Writes new data:** YES — one additional `platform_observations` row per interaction, of the new `behaviour-decision` kind. Bounded by the store's existing 30-day / 50,000-row retention. No new table, column, or index.
- **Changes meaning of existing data:** NO. `TimelineTurn.behaviour` keeps its meaning and its legacy source for pre-BEH1 rows.
- **Requires backfill:** NO. Pre-BEH1 turns are shown as having no recorded decision — honestly absent, never reconstructed.

---

## 10. TRUST CHECK

- **Could this mislead the user?** No. The Workbench is admin-only, and not one word the user reads changes.
- **Could this fabricate certainty?** This was the sharpest risk in the brief, and it drove three definitions. "Behaviour confidence" could easily have become a fake quality score for a deterministic transform; it is instead defined as voice *provenance* (1 = the user's explicit choice; 0 = the platform default), with the basis recorded alongside it. "Behaviour effectiveness" could easily have become a scoring signal; it is a feedback rate over turns a voice phrased, `null` when nothing is rated, and read by nothing. "Active behaviour selected" could easily have implied a voice ran on every interaction; `not-voiced` says when it did not.
- **Is anything guessed but shown as real?** No. Pre-BEH1 turns render as absent. Feedback that cannot be correlated is counted as unattributed. Every rate is `null` rather than `0%` when there is nothing to judge. The overrides table discloses its own cap while the counts stay complete.
- **What happens if the system is wrong?** Telemetry is a side effect, never an input: a wrong or missing decision row degrades an admin view and nothing else. `OBS_DISABLE_CAPTURE=1` removes every row with zero functional difference. A malformed personality preference degrades to the default voice, recorded as an override — never to an error or to silence.
- **No architectural duplication introduced:** YES (none).
- **No new source of truth created:** YES (none — one new value in an existing closed vocabulary).
- **No runtime behaviour altered:** The user-facing turn is byte-identical. The only runtime addition is one fire-and-forget telemetry write per interaction.

---

## 11. ROLLBACK PLAN

| Item | Value |
|---|---|
| Rollback identifier | `rollback/before-beh1-behaviour-engine-20260709` → `22e5bc7e0b9166d16b10831c47e185f4d9c26bba` |
| Files modified | See §1 |
| Rollback commands | `git checkout rollback/before-beh1-behaviour-engine-20260709 -- <files>` (or revert the BEH1 commit) |
| Verification after rollback | `npm run test:intelligence-execution-timeline` and `npm run test:intelligence-observation-telemetry` pass (revert the 12-kind assertion with them); the gateway answers turns unchanged |

No migration was applied. Existing `behaviour-decision` rows, if any were recorded before a rollback, are inert: the timeline ignores unknown kinds gracefully (they render under their raw kind name), and the retention window prunes them.

---

## 12. SCOPE LOCK

**Implemented scope**

- Activated the Behaviour Engine as the Intelligence Platform's decision layer: one sealed, explained decision per interaction.
- Made the Behaviour Engine the canonical owner of the Companion's *voice* decision (the only decision INT21 permits it to own — see §0).
- Consumed Observation Engine data for every behaviour view; the engine owns none of it.
- Integrated with the Execution Timeline by recording a behaviour decision for every interaction.
- Implemented the Behaviour Admin Workbench's eight required items.

**Explicitly excluded scope (NOT done)**

- **No autonomous learning.** Nothing reads a behaviour decision back. Effectiveness is an operator view; no voice, threshold, or default adapts to it.
- **No business logic changes.** No capability, handler, permission, confirmation tier, intent, or business service was touched.
- **No Observation Engine responsibilities duplicated.** No second store, seam, or aggregation layer; the engine records nothing itself.
- **No voice content changed.** Not one template, tone fragment, greeting, or disclosure was added, removed, or reworded.
- **No new personality, no locale work** (BEH-P3/BEH-P4 remain gated).
- **BEH-P1 / BEH-P2 not implemented.** Greetings/celebrations remain unwired; `phraseGrowth`/`phraseNotice` remain dormant, awaiting their routes.
- **No override control.** The Workbench is read-only; BEH1 adds no way to force a voice.

**SUGGESTIONS (observed, not implemented — require approval)**

1. **Retire the two gateway-owned strings.** The write-intent refusal and provider-unavailable copy are the last two server-side voices outside the registry. Retiring them means adding an escalation/degradation template per personality — six new template entries and a user-visible copy change in every voice. It belongs with BEH-P1 as a single "close CPA1 G5" workstream, not smuggled into an activation. BEH1 has already made both visible as `not-voiced` decisions, so the debt is now measurable before it is paid.
2. **`test-intelligence-personality-platform.ts` is unregistered and currently failing** at its DB-dependent assertion. Splitting its pure assertions (which pass) from its one gateway/DB assertion would let the pure half join the `npm test` chain, where the engine's disclosure-preservation guarantee belongs.
3. **`summarizeCompanion`'s feedback block and `summarizeBehaviour`'s effectiveness block now read the same `user-feedback` rows for different questions.** Neither duplicates the other's ownership, but if a third feedback view appears, a shared private helper inside `observation-engine.ts` would be worth extracting.

---

*Governing architecture updated by this workstream: `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` §2.4 / §7.4 / §8 / §9; `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §2.2 / §3 / §5.1 / §6.2.*
*Rollback: `rollback/before-beh1-behaviour-engine-20260709` → `22e5bc7`.*
