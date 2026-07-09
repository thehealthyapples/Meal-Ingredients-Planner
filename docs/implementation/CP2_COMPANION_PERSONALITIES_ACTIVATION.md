# CP2 — Bring Companion Personalities to Life — Implementation

**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform` (on top of BEH1 / NCV1)
**Risk:** 🔴 RED
**Reason:** Converges the Companion-voice domain onto its single canonical owner by activating a preference the schema never declared, retiring three duplicate voice surfaces, and changing user-visible copy for five of six voices.

**Governing architecture:** `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (INT21 — the governing document for this workstream), `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1), `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1/OBS2), `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (INT20)

---

## 0. THE FINDING THAT DEFINED THIS WORKSTREAM

The brief asks CP2 to "fully activate the existing Companion personalities." Before implementing anything, the current state was verified against the branch and the live database rather than read from prior documents. The personalities were not partly activated. **They were entirely unreachable.**

| Layer | State before CP2 | Evidence |
|---|---|---|
| Postgres column | **Exists.** `user_preferences.companion_personality`, `text NOT NULL DEFAULT 'companion'`, 80 rows, all `'companion'` | `information_schema.columns` |
| Drizzle schema | **Absent.** `shared/schema.ts` never declared the column | `git show c363df3:shared/schema.ts` |
| Consequence | `db.select().from(userPreferences)` never selected it, so `storage.getUserPreferences()` returned an object **with no such key** | `storage.getUserPreferences(uid).companionPersonality === undefined` |
| Gateway | `resolveBehaviour(prefs?.companionPersonality)` therefore received `undefined` **on every turn, for every user** | `conversation-gateway.ts:1219` |
| Result | Every interaction applied the platform default voice, recorded as `overrideReason: "no-stored-preference"` with **`confidence: 0`**, 100% of the time. Five of the six personalities were dead code. | `resolveBehaviour(undefined)` |
| Selection surface | **None existed.** No client file imported `PERSONALITY_DISPLAY`; no route wrote the field | repo-wide search |

Two consequences follow, and both were fixed here rather than papered over:

1. **The governing architecture asserted something untrue.** INT21 §5.1 states the preference is "one column, `notNull`, default `'companion'`, read fresh every turn by the gateway." The *column* was; the *schema* was not, so the read returned nothing. `behaviour-engine.ts` carried the same claim in a comment, concluding that `overrideReason: "none"` was "the overwhelmingly common case" — it had literally never occurred. Both are corrected by this workstream (§10).
2. **BEH1's own test proved it, and nobody read the failure.** `test-intelligence-personality-platform.ts` §5 asserts "sergeant's registered wording is used verbatim" through the real gateway. It failed on the branch. BEH1 §8 recorded it as "a pre-existing DB-dependent failure… a Postgres syntax error… out of scope." It was neither pre-existing noise nor a syntax error: it was the activation bug, reported correctly by the one test written to catch it. The invalid SQL was Drizzle rendering an `as any` insert for a column it did not know about.

**"Activate" therefore means:** make the stored voice reachable, make it choosable, make every word the Companion says come from the one registry that owns those words, and record both halves of the decision — the voice a user *chose* and the voice that *spoke*. CP2 adds no engine, no second registry, no template mechanism, no personality, and no fact.

---

## 1. ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-cp2-companion-personalities-20260709` → `c363df377d2ec4c8f378678b2564ed2451e86f12` |
| Working tree at start | Clean |
| Rollback to committed state | `git checkout rollback/before-cp2-companion-personalities-20260709` |

**This task's writes**

```
shared/schema.ts
server/intelligence/conversation/personality-registry.ts
server/intelligence/conversation/behaviour-engine.ts
server/intelligence/conversation/conversation-gateway.ts
server/intelligence/handlers/profile-read-handler.ts
server/intelligence/observation/observation-engine.ts
server/intelligence/observation/execution-timeline.ts
server/routes.ts
client/src/components/conversation/FloatingAssistant.tsx
client/src/pages/profile-page.tsx
client/src/pages/admin-behaviour-workbench-page.tsx
server/tests/test-intelligence-personality-platform.ts
server/tests/test-intelligence-behaviour-decision.ts
server/tests/test-intelligence-observation-telemetry.ts
server/tests/test-intelligence-profile-binding.ts
server/tests/benchmark/run-benchmark.ts
server/scripts/intq7-run-full-benchmark.ts
server/scripts/intq8-full-benchmark.ts
server/scripts/intq8-quick-benchmark.ts
package.json
docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md
docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md
docs/implementation/CP2_COMPANION_PERSONALITIES_ACTIVATION.md (new)
```

**No migration was applied and none is required.** The column already exists in Postgres with exactly the DDL `shared/schema.ts` now declares (`text NOT NULL DEFAULT 'companion'`). CP2 declares the existing column; it does not create one. The dev server boots with `Schema at head: 2026-07-08_platform_observations` and no pending migrations.

---

## 2. REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` (INT21 — governing)
- [x] `docs/architecture/THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1/OBS2)
- [x] `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1 §0 invariant, §11 G5)
- [x] `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17 §7 — grounding ownership)
- [x] `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (INT20 §7/§8 — NTC-P1 owns the notice route)
- [x] `docs/implementation/BEH1_BEHAVIOUR_ENGINE_ACTIVATION.md`
- [x] `docs/implementation/EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md`
- [x] `docs/implementation/NCV1_NATIVE_CONTEXT_VIEW_ROLLOUT.md` (Native Context Views — reused, not extended)

---

## 3. WHAT WAS DELIVERED

### 3.1 The activation blocker (`shared/schema.ts`)

`companionPersonality: text("companion_personality").notNull().default("companion")` is declared on `userPreferences` and added to `insertUserPreferencesSchema`. The declaration matches the live DDL exactly, so no migration is generated and no data moves. This single line is what makes the five non-default voices reachable at all.

Three `as any` casts and a standing typecheck error disappear as a consequence (`routes.ts` ×2, three benchmark scripts, `run-benchmark.ts`). BEH1 §8 recorded that error as "pre-existing, unchanged"; it was the bug.

### 3.2 The user can now choose a voice

| Piece | Where |
|---|---|
| Picker UI | `client/src/pages/profile-page.tsx` — `CompanionVoiceSettings`, in the Personal section |
| Its data | `shared/companion-personality.ts` — `PERSONALITY_IDS` + `PERSONALITY_DISPLAY`, the one closed set. **The client declares no second list**, which is the reason that file exists |
| Write path | `PUT /api/profile` `{ preferences: { companionPersonality } }` — the existing partial-preferences writer, validated with `z.enum(PERSONALITY_IDS)` |
| Rejection | An unregistered voice is a **400 at the write**, not a silent normalisation at every later read. The engine's fail-safe default still covers rows written before this validation existed |

The picker's own copy states the invariant to the user: *"Changes how Apple talks to you. Same answers, same data, same checks before anything changes."* A user who believed a voice changed what the Companion knows would have been misled by us.

### 3.3 Every word the Companion says is now registry content

Three strings reached the user without passing through the Behaviour Engine. INT21 §8.4 named two of them; the third was found by this workstream's audit and was worse than a hardcoded string — it was a **verbatim copy of registry content**, frozen in the default register no matter which voice the user chose.

| Retired string | Was | Now |
|---|---|---|
| Write-intent refusal | `conversation-gateway.ts`, platform-owned | `escalationTemplate` per voice → `voiceEscalation()` |
| Provider-unavailable copy | `conversation-gateway.ts`, platform-owned | `degradationTemplate` per voice → `voiceDegradation()` |
| Panel empty-state greeting | `FloatingAssistant.tsx:1465`, hardcoded | `experience.greetings` + new `experience.invitation` → `buildCompanionExperience()` |
| Panel transport-error bubble | `FloatingAssistant.tsx:204` — **a verbatim copy of `companion`'s `internal-error` template** | the `internal-error` template itself, in the user's voice |

**The disclosure is machine-checked, not review-checked.** The two highest-risk phrases are pinned by shared clauses every voice must embed verbatim:

- `cannotYet(action)` → `"I can't {action} yet"`. A voice can change how a refusal *sounds*; it cannot change that it **is** a refusal, or drop the action it is refusing.
- `notConfigured()` → `"hasn't been configured yet"`. It carries no subject, so each register names its own — the clause fixes the *fact*, not the prose.

`test-intelligence-personality-platform.ts` §6/§7 asserts both, for all six voices, against **every action `detectWriteIntent()` can produce** (harvested from the guard itself, so a new refusal reason cannot be added without test coverage following it). Mutation-tested: rewriting `sergeant`'s refusal to `"Done. Handled."` turns three assertions red.

### 3.4 The transport-error path, and the one string CP2 deliberately did not voice

When a turn fails before reaching the server, the panel answers with the `internal-error` disclosure in the user's voice — fetched with the greeting when the panel opened, so it is already resolved by the time a turn can fail.

If that fetch never landed, **we do not know the user's voice, so we do not speak.** The panel renders a plain, clearly platform-owned connection notice instead of an assistant turn. Inventing a voice there, or defaulting to `companion`'s words for a user who chose `sergeant`, would be exactly the "second voice nobody chose" INT21 §10 forbids. It is chrome, it is counted as chrome in §6, and it is not disguised as the Companion.

### 3.5 The engine's vocabularies, grown by exactly what shipped

`behaviour-engine.ts` gains `voiceEscalation`, `voiceDegradation`, `buildInvitation`, `buildCompanionExperience`. It remains pure: no I/O, no clock, no randomness, no persistence, no reference to the Intent Engine or Capability Registry. The greeting's day-seed is computed by the **caller**, because the engine holds no clock.

| Vocabulary | Before | After | Added |
|---|---|---|---|
| `BEHAVIOUR_SURFACES` | 3 | 6 | `escalation-voicing`, `degradation-voicing`, `greeting-voicing` |
| `BEHAVIOUR_OUTCOMES` | 4 | 7 | `voiced-escalation`, `voiced-degradation`, `voiced-experience` |

Both stayed closed to what is **genuinely live**. `phraseGrowth`, `phraseNotice` and `buildCelebration` remain code-complete and dormant — their route belongs to NTC-P1, not to this workstream — so they still claim **no surface**. A test asserts this, so a future workstream cannot quietly promote a dormant export.

An operator seeing only `voiced` could not distinguish an answer from a refusal, which is why the outcome vocabulary grew rather than collapsing three different things into one. **`not-voiced` is retained even though no gateway path now emits it**: it is the mechanism by which a future unvoiced surface is forced to declare itself. Deleting it would have hidden the debt rather than paid it; its count falling to zero is the *measurement* that CP2 closed it.

### 3.6 Native Context Views are reused, and the voice never becomes grounding

CP2 adds **no Context View, no `ContextViewSpec`, no pinned field, and no byte of CONTEXT DATA**. The seven views NCV1 rolled out are untouched.

The load-bearing rule is the one that could have been broken silently: declaring `companionPersonality` in the schema made it a field on the row that `profile:read` reads. Had `ProfilePreferencesView` been a spread of the preferences row, the user's voice choice would have become **grounding evidence the model could quote back as a fact about the household**. It is an explicit allowlist, the voice is deliberately absent, and `profile-read-handler.ts` now says so at the definition.

The voice reaches the prompt exactly once, exactly as INT17 §7 and INT21 §7.1 require: as the additive tone fragment, appended **after** the five hard rules, outside the CONTEXT DATA block. §9 of the test suite drives the **real handler through its port** with `companionPersonality: "sergeant"` stored on the row and asserts the string appears nowhere in its serialised Full Result. Mutation-tested: adding the field to `toPreferencesView` turns two assertions red.

### 3.7 Selection and effectiveness, recorded through the Observation Engine

BEH1 recorded which voice **spoke**. It could not record which voice a user **chose**, because no user could choose one. CP2 records both, and they answer different questions: a platform whose users never change voice and one whose selector is broken look identical in `byPersonality` and different in `selections`.

| Kind | Capture point | Records |
|---|---|---|
| `behaviour-decision` (BEH1, 12th) | `conversation-gateway.ts` (5 exit paths) + `routes.ts` (the experience route) | the voice that spoke, its provenance, the surfaces it touched |
| `behaviour-selection` (CP2, **13th**) | `routes.ts` → `PUT /api/profile` — the one place a voice is chosen | the voice chosen, the voice replaced, `changed` vs `unchanged` |

The Behaviour Engine records nothing and reads nothing; its callers record. This is Observation Engine §4 rule 4, and CP2 adds a **second documented capture point** for `behaviour-decision` (the experience route) because it is a genuinely new surface that speaks. Both callers already perform I/O.

A re-save of the voice a user already had is recorded as `unchanged`, not discarded: *"the user opened the picker and confirmed their voice"* is a different fact from *"the user never looked,"* and inferring one from the other would be a guess.

**Effectiveness is unchanged in nature and now finally meaningful.** It is the user-feedback rate on turns a voice phrased, joined by the turn correlation id, `null` when nothing is rated. Nothing reads it back. No voice, threshold, or default adapts to it. Before CP2 it could only ever have described one voice.

### 3.8 Execution Timeline and Behaviour Workbench

- **Timeline:** `"behaviour-selection": "Companion voice selected"` joins the stage vocabulary. The per-turn `behaviourDecision` panel and its reasoning trail now explain the three new surfaces; every reasoning sentence still states something the engine did and names the owner of what it did not.
- **Workbench** (extended in place — one Workbench, still read-only, still admin-only):
  - "Active behaviour selected" gains **Refusals / Degraded / Experience** columns, so a refusal is never counted as an answer.
  - **"Companion voice selected"** — a new panel: total, changed, re-confirmed, and the distribution of voices users actually chose. Empty windows read *"No user changed their Companion voice in this window"* — never a fabricated 0%.
  - The **Not voiced** column carries its meaning in its tooltip: *any count above zero means a surface is speaking outside the Behaviour Engine.*
  - Registry cards show each voice's `invitation`, read live from the registry per request — never a copy captured at record time.

---

## 4. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Entities touched: the Companion voice (PersonalityId — one closed key space owned by
  shared/companion-personality.ts, now imported by BOTH the server registry and the client
  picker, so no second list exists) and the platform observation (platform_observations.id).
  CP2 introduces no identity of its own.

☑ One owner per fact
  · The user's voice choice        → user_preferences.companionPersonality (Profile capability)
                                     — declared in shared/schema.ts by this workstream, so the
                                       one owner is now actually readable.
  · Voice CONTENT (templates/tone) → personality-registry.ts (the ONLY place any Companion
                                     word lives, including the three strings CP2 retired)
  · The voice DECISION (transform) → behaviour-engine.ts
  · The decision's durable RECORD  → platform_observations (observation-store.ts)
  · Timeline/analytics projections → observation-engine.ts + execution-timeline.ts (on read)
  No attribute has two stores that must agree.

☑ No duplicate entities
  No new entity. `behaviour-selection` is one value in the existing closed `kind` vocabulary
  of the existing table — the extensibility path the Observation Engine architecture mandates.

☑ No duplicate ownership
  The reverse: THREE duplicate owners of Companion voice content were RETIRED (two gateway
  strings, one client string that was a verbatim copy of a registry template). The engine
  gains no ownership of observations; the Observation Engine gains no ownership of voice.

☑ No duplicate state
  Nothing is persisted twice. The voice is read fresh every turn from its one column, never
  cached, never copied into the Context Frame, never written onto a conversation turn. The
  client holds no copy of any Companion string — it fetches them.

☑ Extends existing architecture
  Extends in place: the one Behaviour Engine, the one Personality Registry, the one closed-but-
  growable observation kind vocabulary, the one Execution Timeline projection, the one Behaviour
  Workbench page, the one partial-preferences write route (PUT /api/profile). No new mechanism.

☑ Progressive enrichment where appropriate
  Not a knowledge entity. The behaviour decision and selection are transactional telemetry;
  retention is the observation store's existing 30-day / 50,000-row window.

☑ Honest gaps over fabricated information
  · The panel renders NO greeting until the registry text arrives — an empty panel is honest,
    an invented greeting is not.
  · When the voice is unknown and a turn fails in transport, the panel shows platform chrome
    rather than putting words in the Companion's mouth.
  · `not-voiced` is retained so a future unvoiced surface must declare itself.
  · Selections/effectiveness are `null` or "—" when there is nothing to report, never 0%.
  · An unregistered voice is rejected at the write and degrades to the default at every read.

☑ No permanent synchronisation bridge
  None. The Workbench joins telemetry and registry at read time for display only.

☑ Evolution over replacement
  Nothing is replaced. No store retires. Three duplicate voice surfaces retire, each named,
  counted, and replaced by the canonical owner. Three further surfaces remain and are named,
  counted, and scheduled (§6) rather than silently absorbed or claimed as done.
```

### AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ Uses the canonical Intelligence Platform
    The voice sits inside the one Conversation Gateway pipeline; the experience route reads the
    registry and records telemetry, and reaches no capability. No parallel assistant path exists.
✓ Uses the Capability Registry
    Untouched and unreachable from the engine (asserted by test). Capability access is decided
    upstream, before any voice runs. The Behaviour Engine is not a capability and registers none.
✓ Uses the Intent Engine
    Untouched and unreachable from the engine. The behaviour decision is sealed after intent
    resolution, never before. The write-intent guard still fires BEFORE the resolver: CP2 changed
    only the words of the refusal, never when or whether it fires.
✓ Reuses existing business services
    storage.getUserPreferences / upsertUserPreferences and the existing PUT /api/profile writer.
    No business service added, and no business rule changed.
✓ Does not create another assistant
    One Companion, displayed as "Apple", six registers of one voice. No personality gains state,
    memory, history, or identity. The picker changes a register, not a persona.
✓ Does not duplicate conversation state
    The voice is never written into a conversation turn. The conversation store is untouched.
    The experience route creates no turn and no thread.
✓ Uses registered capabilities only
    The experience route serves registry content and reads no capability.
✓ Uses permission-aware access
    /api/intelligence/companion/experience → 401 unauthenticated (verified). The Workbench stays
    admin-only and read-only. Confirmation tiers are untouched: a Strong-tier action requires the
    same assent in every voice.
✓ Produces honest gaps rather than fabricated knowledge
    The refusal clause and the degradation clause are embedded verbatim by all six voices and
    asserted by test. A gap stays a gap in every register.
```

---

## 5. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Companion Behaviour (voice)
Declared SoT: personality-registry.ts (voice content) · behaviour-engine.ts (the transform)
              · user_preferences.companionPersonality (the user's choice)
New store created? NO
Existing store extended? YES — shared/schema.ts now DECLARES the existing companion_personality
  column (text NOT NULL DEFAULT 'companion'). The column pre-existed in Postgres; no DDL runs,
  no migration is generated, no data moves. Voice CONTENT is extended: escalationTemplate,
  degradationTemplate and experience.invitation per personality.
Consumer created? YES — GET /api/intelligence/companion/experience (read-only, registry only)
  and the Settings voice picker.
  If YES: reads from declared SoT? YES — the registry (live, per request) and the preferences
  column (fresh, per request). Neither is cached or copied.

Domain affected: Platform Observations (runtime telemetry)
Declared SoT: platform_observations (server/intelligence/observation/observation-store.ts)
New store created? NO
Existing store extended? YES — one new value (`behaviour-selection`) in the closed `kind`
  vocabulary, plus three new `behaviour-decision` outcome values inside the existing JSONB
  metadata bag. No column, no index, no migration.
Consumer created? YES — the Workbench's "Companion voice selected" panel and the timeline's
  "Companion voice selected" stage.
  If YES: reads from declared SoT? YES — observationStore only.

Domain affected: Profile / Preferences
Declared SoT: user_preferences (storage.ts)
New store created? NO
Existing store extended? NO — the column already existed and already held data.
Consumer created? NO new read path. profile:read's Full Result deliberately OMITS the voice, so
  the Profile Capability Card's Context View is unchanged and the model's grounding is unchanged.
```

No duplication is introduced. Three duplications are removed; three are named and scheduled (§6).

---

## 6. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Companion Behaviour — the Companion's voice decision and every surface it speaks through.

Current Canonical Owner:
  server/intelligence/conversation/personality-registry.ts (voice content)
  server/intelligence/conversation/behaviour-engine.ts     (the transform + the decision)
  user_preferences.companionPersonality                    (the user's choice)
  — one component, two halves (INT21 §2.2), plus one preference column.

Current Runtime Consumer(s):
  · conversation-gateway.ts — resolves the decision once per interaction, applies it at five
    seams, records it on all five exit paths
  · routes.ts — GET /api/intelligence/companion/experience (voiced greeting/invitation/
    transport-error + one behaviour-decision); PUT /api/profile (voice selection + one
    behaviour-selection); GET /api/intelligence/observation/behaviour (read-only Workbench)
  · client/src/components/conversation/FloatingAssistant.tsx — renders voiced text, stores none
  · client/src/pages/profile-page.tsx — the voice picker (reads the one shared closed set)
  · client/src/pages/admin-behaviour-workbench-page.tsx — read-only display

Duplicate Owners Remaining:
  NONE for the conversation surface. Exactly one Behaviour Engine and one Personality Registry
  exist; no second phrasing transform, template mechanism, or voice registry exists anywhere.

Duplicate State Remaining:
  NONE. The voice choice lives once, is read fresh every turn, and is never cached, copied into
  the Context Frame, persisted onto a turn, or duplicated into the client.

Duplicate Workflows Remaining:
  THREE Companion-voiced strings still reach the user without passing through the engine. All are
  OUTSIDE the Companion conversation surface; all are named with evidence rather than estimated:
    1. client/src/components/HomeIntelligenceCompanion.tsx:32-37,77 — a client-generated
       time-of-day greeting ("Good morning{, name}.") on the home page.
    2. client/src/components/conversation/companion-action.ts:157-177 —
       buildWorkflowOutcomeSummary()'s "Done — …" / "couldn't …" action-outcome copy.
    3. client/src/components/conversation/FloatingAssistant.tsx:697 — the action-confirm
       error copy ("Something went wrong confirming this — please try again.").
  CP2 does not retire them: (1) and (2) require new registry content and a route that does not
  exist, and all three are user-visible copy changes outside this workstream's scope lock.

  NOT counted as a duplicate workflow: FloatingAssistant's transport-failure notice
  ("Couldn't reach the assistant…"), added by CP2. It is platform chrome shown precisely when the
  user's voice is unknown, and is deliberately NOT presented as an assistant turn (§3.4).

Current Convergence (%):
  Voice-surface ownership: 75% — 9 of 12 Companion voice surfaces are owned by the
    Behaviour Engine + Personality Registry pair. Counted, with evidence:
      OWNED (9): grounded-answer tone (systemPromptFragment) · the four honest-gap disclosures
        (voiceFallback) · guidance labels and order (voiceGuidanceSuggestions) · growth
        statements (phraseGrowth, code-complete, no route) · voiced notices (phraseNotice,
        code-complete, no route) · the write-intent refusal (voiceEscalation, NEW) · the
        provider-unavailable degradation (voiceDegradation, NEW) · the panel greeting +
        invitation (buildCompanionExperience, NEW) · the panel transport-error bubble (NEW)
      NOT OWNED (3): the three surfaces under Duplicate Workflows above.

  INT21 §8.4 reported this as "5 of 8 (63%)". That denominator was incomplete: it omitted the
  client's transport-error string (which was a verbatim COPY of registry content), the home-page
  greeting, the workflow-outcome summary, and the action-confirm error. CP2 corrects the
  inventory to 12 and reports 9/12. Measured against BEH1's own 8-surface enumeration, CP2
  reaches 8/8 — but that enumeration was wrong, and reporting 100% against it would have been
  a truer-sounding number describing a smaller world.

  Personality reachability: 100% — 6 of 6 registered voices are selectable and reachable by a
    real user through a real surface. Before CP2: 17% (1 of 6 — the default, unavoidably).
  Behaviour decision recording: 100% — every interaction on every exit path, plus the experience
    surface, seals and records exactly one decision. `not-voiced` decisions: 0 (verified at
    runtime through the real routes).

Target Convergence (%):
  Voice-surface ownership: 100%, via the separately gated workstreams below.

Next Planned Milestone:
  BEH-P2 / NTC-P1 (jointly) — wire the notice route, activating phraseNotice/phraseGrowth/
  buildCelebration and their three surfaces. NTC-P1 owns the route; CP2 deliberately did not
  take it.
  CP3 (proposed, §11 SUGGESTION 1) — retire the three remaining client-side voiced strings.

Remaining Architectural Risks:
  · Voice content review remains a human gate (INT21 §8.7, unchanged) for the FOUR fallback
    templates and the tone fragments: a PR that weakens one of those disclosures in wording is
    caught by review, not by a type. CP2 narrows this: the refusal and degradation clauses are
    now machine-checked (cannotYet / notConfigured), which is the first time any voice content
    has had a structural guarantee rather than a reviewed one. Extending the same technique to
    the four fallback states is the obvious next hardening and is NOT done here.
  · The three remaining client strings are frozen in one register for every user, exactly as the
    transport-error string was before CP2 found it. They are counted above, not tolerated.
  · Observation timestamps remain persist-time (OBS2 honest limit #1, unchanged).
```

---

## 7. DEFINITION OF DONE

**What success looks like**

- A user can choose any of the six voices, and that choice reaches every word the Companion says to them.
- Every Companion word on the conversation surface is Personality Registry content; `not-voiced` decisions fall to zero.
- Personality changes communication style only. The facts, the ids, the counts, the disclosures, the eligibility, and the confirmations are identical in all six voices.
- The voice never becomes grounding: no personality byte reaches CONTEXT DATA, and `profile:read`'s Full Result omits it.
- Selection and effectiveness are recorded through the Observation Engine, surfaced in the Timeline and the Workbench, and read by nothing.

**What must not break**

- The default (`companion`) voice's refusal, degradation and invitation copy is **byte-identical** to the pre-CP2 strings, so a user who never opens the picker sees no change to those surfaces. (The default voice's *greeting* does change — see Data Impact.)
- `OBS_DISABLE_CAPTURE=1` remains a functional no-op: disabling telemetry changes no word.
- The Behaviour Engine stays pure: no I/O, no clock, no randomness, no persistence, no Intent Engine or Capability Registry reference.
- The write-intent guard still fires before the resolver, and still returns `not_executable`.
- A malformed or unknown stored preference degrades to the default voice — never to an error, a crash, or silence.

**Manual test steps**

1. `npm test` → 40 suites, exit 0, 0 failures.
2. `npm run test:intelligence-personality-platform` → 322 passed, 0 failed.
3. `npm run dev`; `curl -o /dev/null -w '%{http_code}' localhost:5000/api/intelligence/companion/experience` → `401`.
4. Sign in, open Settings → Personal → **Companion voice**. Pick *Sergeant*. Open the Companion panel: the empty state reads *"Ready. What's the task?"* / *"State your question. Food, plans, pantry — anything on record."*
5. Ask *"add chicken to my shopping list"*. The refusal arrives in Sergeant's register and still contains *"I can't add items to the planner or shopping list yet"*. Switch to *Chef*, ask again: different sentence, same refusal, same `not_executable` outcome.
6. `PUT /api/profile {"preferences":{"companionPersonality":"wizard"}}` → `400`.
7. Open `/admin/behaviour`. The **Behaviour** tab shows the *Companion voice selected* panel (your change, and any re-confirmation), the *Refusals* / *Experience* columns populated, and **Not voiced = —** for every voice.
8. Open a turn on the **Execution Timeline** tab: "Behaviour decided" carries the reasoning trail naming the surfaces that ran.

---

## 8. VERIFICATION

| Check | Result |
|---|---|
| `npm test` (full chain, 40 suites) | **exit 0 — 0 failures** |
| `test-intelligence-personality-platform` (extended: §6–§10, now registered in `npm test`) | **322 passed, 0 failed** (was 114, and **failing** on the branch) |
| `test-intelligence-behaviour-decision` (updated vocabularies) | 115 passed, 0 failed |
| `test-intelligence-observation-telemetry` (13-kind vocabulary) | 74 passed, 0 failed |
| `test-intelligence-execution-timeline` | 70 passed, 0 failed |
| `test-intelligence-context-composition` / `-fallback` / `-notice-engine` / `-profile-binding` | 161 / 82 / 42 / 50 passed, 0 failed |
| Typecheck | **177 errors vs a 180-error baseline** — three resolved (incl. BEH1's standing `companionPersonality` error), **none introduced** |
| **Mutation test** — leak the voice into `profile:read` | 2 assertions go **red** ✓ |
| **Mutation test** — reword `sergeant`'s refusal to "Done. Handled." | 3 assertions go **red** ✓ |
| Runtime — boot | Dev server boots; `Schema at head: 2026-07-08_platform_observations`; **no pending migration** |
| Runtime — preference round-trip | `set coach/sergeant/chef` → each read back and resolved with `confidence 1`, `override none`. **Impossible before CP2** |
| Runtime — fail-safe | stored `'wizard'` → applied `companion`, `confidence 0`, `unrecognised-preference`. No error surfaced |
| Runtime — gateway escalation path | driven through the **real** `ConversationGateway` in all six voices: 6/6 distinct wordings, 6/6 embed the verbatim refusal, all return `outcome=not_executable` |
| Runtime — gateway degradation path | driven with an unavailable provider: every voice discloses "hasn't been configured yet" |
| Runtime — authenticated HTTP end-to-end | login → `GET /experience` (default) → `PUT /api/profile` (sergeant) → `GET /experience` (sergeant's words) → `PUT` wizard = **400**. Observations written: `behaviour-decision/voiced-experience` ×2 (`confidence 1`, `surfaces:["greeting-voicing"]`), `behaviour-selection/changed` (companion→sergeant), `behaviour-selection/unchanged` (re-confirm). **`not-voiced` count: 0** |
| Runtime — privacy | no utterance, answer text, or household fact appears in any recorded decision or selection metadata |
| Runtime — capture never breaks a turn | observation writes against a non-existent FK user fail loudly in logs and change nothing about the turn (observed in tests) |

**A note on the one test that was already telling us.** `test-intelligence-personality-platform.ts` was unregistered in `npm test` and failing. It is now registered, and its §5 assertion — "sergeant's registered wording is used verbatim", driven through the real gateway against a real stored preference — passes for the first time. That single assertion is the difference between a personality platform and six pieces of unreachable data.

---

## 9. DATA IMPACT

- **Reads existing data:** YES — `user_preferences.companionPersonality` (readable for the first time), and `platform_observations` for the read-only views.
- **Writes new data:** YES —
  - `user_preferences.companionPersonality` is now written when a user picks a voice (the column and its default already existed).
  - One additional `platform_observations` row per Companion-panel open (`behaviour-decision` / `voiced-experience`) and per voice save (`behaviour-selection`). Bounded by the store's existing 30-day / 50,000-row retention. No new table, column, or index.
- **Changes meaning of existing data:** NO — with one honest caveat. Pre-CP2 `behaviour-decision` rows recorded `confidence: 0` / `no-stored-preference` for **every** interaction. Those rows are accurate records of what happened; they are simply not evidence that users declined to choose a voice, because no user could. Post-CP2 rows are not comparable to them, and the Workbench does not present them as a trend.
- **Requires backfill:** NO. Every existing row already holds `'companion'`, which is the value the default voice would resolve to anyway. Nothing is reconstructed.

---

## 10. GOVERNING ARCHITECTURE CORRECTED BY THIS WORKSTREAM

CP2 does not amend any rule. It corrects two statements of fact that the architecture made about the codebase and that were untrue.

| Document | Was | Now |
|---|---|---|
| `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` §5.1 | "`user_preferences.companionPersonality` — one column, `notNull`, default `'companion'`, read fresh every turn by the gateway" | Records that the column existed in Postgres but was never declared in `shared/schema.ts`, so the read returned `undefined` and every user received the default voice until CP2 |
| `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` §8 | "5 of 8 (63%)" voice-surface ownership; "no client surface calls them yet (CPA1 G5)" | Corrected inventory (12 surfaces), 9 owned, three named with file:line; greeting/invitation live |
| `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` §9 | "BEH-P1 — Wire the dormant experience text" (planned) | **✅ DELIVERED by CP2**, with the two gateway strings it named |
| `behaviour-engine.ts` `BEHAVIOUR_OVERRIDE_REASONS` comment | "`none` is the overwhelmingly common case" | Records that `no-stored-preference` fired for 100% of interactions before CP2 |
| `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §2.2 | twelve kinds | thirteen kinds; `behaviour-selection` and its capture point documented |

Everything else in INT21 — the mandate, the nine boundaries, the transform contract, the §5.2 acceptance criterion, the localisation rules, and every non-negotiable — is unchanged and was complied with.

---

## 11. SCOPE LOCK

**Implemented scope**

- Activated the six existing personalities end to end: schema declaration → Settings picker → validated write → fresh per-turn read → every voice seam.
- Made the personalities consume the Behaviour Engine rather than duplicate it: three duplicate voice surfaces retired, including one that was a verbatim copy of a registry template.
- Kept personality to communication style only: the refusal and degradation clauses are machine-pinned; the sealed decision's shape is identical across all six voices (asserted); no `BehaviourProfile` dimension is read by business logic.
- Reused Native Context Views unchanged: no view, no spec, no pinned field, no CONTEXT DATA byte — and proved the voice never becomes grounding by driving the real `profile:read` handler.
- Recorded personality selection (13th observation kind) and effectiveness through the Observation Engine; both read by nothing.
- Surfaced personality behaviour in the Execution Timeline and the Behaviour Workbench.

**Explicitly excluded scope (NOT done)**

- **No new personality.** Still exactly six. `PERSONALITY_IDS` is unchanged.
- **No change to Behaviour Engine ownership.** The engine still owns exactly one decision — the words — and still records nothing, reads nothing, and persists nothing.
- **No business rule or knowledge change.** No capability, handler, permission, confirmation tier, intent, or business service was touched. `detectWriteIntent`'s logic is byte-for-byte unchanged; only the refusal's wording moved.
- **No duplicated conversation state.** The experience route creates no turn and no thread; the voice is never written onto a turn.
- **No notice or growth route.** `phraseNotice` / `phraseGrowth` / `buildCelebration` stay dormant and claim no surface. That route is NTC-P1's to own (INT20 §8); taking it here would have been a second component claiming a seam.
- **No autonomous learning.** Nothing reads a behaviour decision or a selection back. No voice, threshold, or default adapts to telemetry.
- **No household default (BEH-P3), no locale work (BEH-P4), no avatar/theme rendering (BEH-P5).**
- **No override control.** The Workbench stays read-only; no surface may force a voice.

**SUGGESTIONS (observed, not implemented — require approval)**

1. **CP3 — retire the last three client-side voiced strings** (§6 Duplicate Workflows). The home-page time-of-day greeting and the workflow-outcome summary each need new registry content and a way to reach it; the action-confirm error can reuse the experience payload CP2 already ships. This closes voice-surface ownership to 100%.
2. **Machine-pin the four fallback disclosures**, as CP2 did for the refusal and degradation clauses. Each state has an irreducible fact (`no-results` = *nothing was found*, `no-knowledge` = *nothing trusted is stored*). Extracting those as shared clauses would convert INT21 §8.7's largest residual risk from a review gate into a type-adjacent one.
3. **`client/src/hooks/use-companion-observations.ts` is dead code.** It fetches `GET /api/intelligence/companion/observations`, a route with no server handler, and no component imports the hook. It appears to be an abandoned Stage-7 notice surface. Deleting it, or wiring it under NTC-P1, would remove a misleading signal that the notice chain is partly live.
4. **`?? "default"` in the four benchmark scripts** is now unreachable (`companionPersonality` is `notNull`), and `"default"` is not a registered `PersonalityId`. Harmless, but it labels benchmark rows with a voice that does not exist.

---

*Governing architecture updated by this workstream: `THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` §5.1 / §8 / §9 / §2.4 / §7.3; `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` §2.2.*
*Rollback: `rollback/before-cp2-companion-personalities-20260709` → `c363df3`.*
