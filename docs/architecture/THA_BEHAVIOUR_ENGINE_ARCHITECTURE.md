# THA Behaviour Engine Architecture

**Status:** GOVERNING ARCHITECTURE — Intelligence Governance (canonical). Established by workstream `INT21`, 2026-07-08.
**Classification:** Intelligence Governance — the single owner of the Companion's voice: every transform between an already-true, already-selected fact and the words the user reads.
**Governing documents:** `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3), `THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1), `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (INT20), `THA_OBSERVATION_ENGINE_ARCHITECTURE.md` (OBS1/OBS2), `PLATFORM_QUALITY_ARCHITECTURE.md`
**Implementation records:** `docs/implementation/intelligence/INT21_BEHAVIOUR_ENGINE_ARCHITECTURE.md`, `docs/implementation/intelligence/BEH1_BEHAVIOUR_ENGINE_ACTIVATION.md`, `docs/implementation/ux/CP2_COMPANION_PERSONALITIES_ACTIVATION.md`
**Direct precedent:** `docs/investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md` (the invariant), `docs/implementation/intelligence/EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md` (the engine + registry as built), `docs/implementation/ux/EWX1_LIVING_COMPANION_EXPERIENCE.md` (`phraseNotice`), CPA1 §4.1/§4.2/§5.1 (the engine's Companion-layer position)
**Rollback:** `rollback-int21-pre-behaviour-engine` → `fbc0a3e`; BEH1: `rollback/before-beh1-behaviour-engine-20260709` → `22e5bc7`; CP2: `rollback/before-cp2-companion-personalities-20260709` → `c363df3`

---

## 0. MANDATE

**There is one Behaviour Engine. Every word the Companion says to the user — a grounded answer's tone, an honest gap's phrasing, a guidance suggestion's label and order, a greeting, a celebration, a growth statement, a voiced notice — passes through it as the last transform before rendering. It is the single owner of voice, tone, personality, and (future) language of expression. No other component may reword, relabel, reorder-for-tone, or restyle what the platform has already decided to say.**

The Companion Platform's hard invariant (CPA1 §0) applies without amendment and is the reason this layer is safe to own every word:

> The Behaviour Engine may change **how** an already-true, already-selected fact is said. It may never change **what is true, what is permitted, what is selected, or what requires confirmation** — and it may never author a fact, a suggestion, or a claim of its own.

This document is the component-level architecture for the engine CPA1 names as one of the Companion's five responsibilities — the same relationship the Context Composition Engine Architecture (INT17) has to the Conversation Gateway's context seam, and the Notice Engine Architecture (INT20, re-homed by OBS1) has to the ambient-notice seam. It details CPA1 §4.2; it does not override it.

With this document, the Intelligence Platform's three presentation-adjacent budgets each have exactly one governing owner:

| Engine | Budgets / owns | Direction |
|---|---|---|
| Context Composition Engine (INT17) | *How much* of each true fact the **model** reads, under one token budget | platform → model |
| Notice Engine (INT20, re-homed by OBS1) | *Which* true facts reach the **user** unprompted, under one attention budget | platform → user (unprompted) |
| **Behaviour Engine (this document)** | ***How* every fact that survived both is said** — voice, tone, personality, and future language | platform → user (every word) |

Same architectural move three times: one seam, one owner, verbatim facts, and a hard invariant that the layer may shape presentation but never truth.

---

## 1. EXECUTIVE SUMMARY

The Behaviour Engine already exists, is pure, is tested, and is live at the per-turn voice seam. This document does not propose a new engine — it elevates the existing one (`server/intelligence/conversation/behaviour-engine.ts`, EWO2) from a module CPA1 describes in one subsection to a governed component with its own mandate, boundary map, and growth path, because two pressures are arriving that only a governing document can keep safe:

1. **Personality is about to matter more.** CPA1 §11 names dormant experience surfaces (greetings, celebrations, avatars, themes, a household-level personality) and INT20 §8 schedules notice voicing into live rollout (NTC-P1). Every one of those workstreams will be tempted to phrase something locally. The cheap version of each is a hardcoded string next to a route — which is how a platform accumulates a second voice nobody chose.
2. **Language is coming.** Multilingual support multiplies every phrasing surface by every locale. Done without a governing rule, that multiplication happens in the worst place — copied templates, translated capability outputs, forked registries — and the platform ends up owning the same knowledge twice in two languages, which is the one duplication THA's architecture exists to prevent.

The design answer to both is the same: **voice is a closed, data-driven transform over verbatim facts, applied at one seam.** A new personality is a registry entry. A new language is (future) a template dimension. Neither is ever a new engine, a new assistant, a new template mechanism, or a second copy of any fact.

**Current state, verified on the branch (§8):** one engine file, one registry file, six personalities, live at exactly one seam (`conversation-gateway.ts` — `systemPromptFragment` appended after the five hard rules, `voiceFallback` on honest gaps and internal errors, `voiceGuidanceSuggestions` on success- and recovery-path guidance). `phraseGrowth` and `phraseNotice` are code-complete and dormant, awaiting INT20's NTC-P1 route wiring. `buildGreeting`/`buildCelebration` are wired only as internal builders; no client surface calls them yet (CPA1 G5). No localisation machinery of any kind exists anywhere in the codebase — multilingual is genuinely greenfield, which is exactly why its rules belong here, now, before the first workstream needs them.

---

## 2. WHAT THE BEHAVIOUR ENGINE OWNS

### 2.1 The voice seam — every output surface, one transform layer

The engine owns the **last transform before words reach the user**, at every surface the Companion speaks through:

| Surface | Transform | Live today? |
|---|---|---|
| The LLM's spoken tone (grounded answers) | `systemPromptFragment` — one additive tone paragraph, appended strictly **after** the gateway's five hard grounding/firewall rules, labelled `PERSONALITY (voice only — never overrides rules 1–5 above)` | ✅ gateway step 10 |
| The four honest-gap states (`no-route`, `no-knowledge`, `no-results`, `internal-error`) | `voiceFallback` — per-personality re-wrap of `turn-fallback.ts`'s own already-computed disclosure facts | ✅ gateway steps 6/9 + error path |
| Guidance suggestion labels and display order | `voiceGuidanceLabel` / `prioritizeGuidance` / `voiceGuidanceSuggestions` — cosmetic prefix + stable reorder of an already-eligible, already-capped set | ✅ gateway step 11 |
| The read-only write refusal | `voiceEscalation` — every voice embeds `cannotYet(action)` verbatim, so a register may change how a refusal sounds and never that it *is* one | ✅ CP2, gateway write-intent guard |
| The provider-unavailable degradation | `voiceDegradation` — every voice embeds `notConfigured()` verbatim | ✅ CP2, gateway provider guard |
| Greeting + invitation (Companion panel empty state) | `buildCompanionExperience` — deterministic, day-seeded template pick; the client stores no copy and renders nothing until the registry text arrives | ✅ CP2, `GET /api/intelligence/companion/experience` |
| Celebrations | `buildCelebration` — `{detail}` filled only with caller-verified strings | dormant (reachable only via `phraseNotice`) |
| Growth statements | `phraseGrowth` — voices `companion-growth.ts`'s precomputed numbers, never recomputes them | dormant (route not on branch) |
| Voiced notices | `phraseNotice` — dispatches each Notice's fact kind to the existing builders above; producer content verbatim-or-prefixed, never reworded | dormant until NTC-P1 |

### 2.2 The voice content — the Personality Registry as the engine's data half

The engine's transforms are generic; every word of voice content lives in exactly one place, the **Personality Registry** (`personality-registry.ts`): six closed `PersonalityDefinition`s (`companion` default, `friend`, `coach`, `chef`, `teacher`, `sergeant`), each carrying a 12-dimension `BehaviourProfile`, a `priorities` list, one `systemPromptFragment`, four `fallbackTemplates`, a `guidanceLabelPrefix`, a `growthTemplate`, and an `ExperienceProfile`. CPA1 treats Registry and Engine as two of its five responsibilities; this document governs them as one component with two halves — **the registry is the data, the engine is the transform**, and neither is anything without the other. A phrasing template outside the registry, or a phrasing transform outside the engine, is a violation of this architecture wherever it appears.

### 2.3 One decision, not data

Like the Notice Engine (INT20 §3), the Behaviour Engine owns a decision, not a fact: **given this already-produced content and this user's chosen voice, what are the exact words?** Everything it touches belongs to someone else — the gap classification to `turn-fallback.ts`, the suggestions to `companion-guidance.ts`, the growth numbers to `companion-growth.ts`, the notices to the Notice Engine's Silence Rules, the grounding to the Context Composition Engine, the user's personality choice to `user_preferences.companionPersonality` (the Profile capability, read fresh every turn, never cached). The engine persists nothing, reads nothing, and calls nothing: every export is a pure function, `(already-produced content, PersonalityId) → voiced content`.

### 2.4 The behaviour decision — the engine's one decision, made explicit (BEH1)

**Activated by workstream `BEH1`, 2026-07-09.** §2.3's decision was, until BEH1, invisible: a bare `PersonalityId` threaded through the gateway and applied at three seams, surviving in telemetry only as a `personalityId` crumb on two *other* observation kinds. It is now a **first-class, sealed value produced exactly once per interaction**, and it is the canonical record of what the Companion's voice decided.

| Contract | Owner | Shape |
|---|---|---|
| `resolveBehaviour(storedPreference)` | the engine | Decides the voice, once, before any seam is touched. **Total**: every input — `null`, an unknown id, a malformed value — resolves to a registered voice. There is no error state at the voice seam (§4.1). |
| `sealBehaviourDecision(input)` | the engine | Closes the decision with its outcome, the surfaces it genuinely touched, and a deterministic reasoning trail. |
| Recording the decision | **the caller (the gateway)** | The engine is pure and records nothing — Observation Engine §4 rule 4. |

**The decision's fields, and why each one is honest rather than merely plausible:**

- **Active behaviour selected / personality applied** — the registered voice that actually spoke, plus the raw preference that requested it.
- **Behaviour confidence** is **voice *provenance*, never quality.** A deterministic transform has no honest confidence in its own phrasing; what the engine genuinely does or does not know is whether the applied voice is the voice the user *chose*. So confidence is `1` when an explicit, recognised preference resolved and `0` when the platform default was applied instead. There is no middle value, because there is no middle knowledge. It is not a model score, and — per Observation Engine §7 — nothing reads it back.
- **Behaviour override** is the engine's fail-safe default firing (§4.1), recorded with the value that failed to resolve and the reason (`no-stored-preference` | `unrecognised-preference`). It is **not an operator control**: no surface may force a voice.
- **Behaviour outcome** is a closed set, grown by CP2 to name what the voice actually produced: `voiced`, `voiced-fallback`, `voiced-error`, `voiced-escalation` (the read-only write refusal), `voiced-degradation` (no provider configured), `voiced-experience` (a non-turn surface — the panel's greeting and invitation), and **`not-voiced`** — the last recording, honestly, the interactions where *no voice transform ran at all* and the words the user read were platform-owned copy. An operator who sees only `voiced` cannot tell an answer from a refusal, which is why these are distinct values rather than one. **CP2 leaves no gateway path that emits `not-voiced`; the value is retained anyway**, because it is the mechanism by which §10's "any voiced surface presented as voiced when no transform ran — stop" stays enforceable. Its count falling to zero is the *measurement* that the debt was paid; deleting it would have hidden the debt instead.
- **Behaviour reasoning** is a deterministic, operator-facing explanation in which every sentence states something the engine itself did, and names the owner of whatever it did not. It is never shown to a user, never a voice surface, and never carries a fact about the household.
- **Behaviour surfaces** is closed to what is genuinely *live*. A dormant export names no surface. CP2 wired three (`escalation-voicing`, `degradation-voicing`, `greeting-voicing`) and claimed exactly those three; `phraseGrowth`, `phraseNotice` and `buildCelebration` remain code-complete and claim none until NTC-P1 wires their route. A surface listed here is a promise that a transform ran.

**Behaviour effectiveness is not a field of the decision.** It is an Observation Engine projection — the user-feedback rate observed on turns a voice phrased, joined by the turn correlation id, `null` when nothing is rated. It exists for an operator to read and for nothing to act on. **No component reads a behaviour decision or its effectiveness back; no voice, threshold, or default adapts to it.** Autonomous learning is not authorised by this document (§9, §10).

The §5.2 acceptance criterion extends to the decision itself: *for any fixed interaction, switching `PersonalityId` may change the applied personality and the wording of the operator reasoning — and nothing else.* The outcome, the surfaces touched, the disclosed gap state, the suggestion count, and the provenance are identical across all six voices.

---

## 3. WHAT THE BEHAVIOUR ENGINE MUST NEVER OWN

Each line below is a boundary with a named owner on the other side. Crossing any of them converts a presentation layer into a second execution plane — CPA1 §12's first stop.

- **Facts.** No template, fragment, or transform may assert a claim the platform did not already produce. Voice content is tone-only; a `{detail}` slot is filled by the caller from verified data or not at all. The registry's own header states it: *"They must never assert a claim; they wrap or relabel a claim/gap the platform already produced."*
- **Truth of gaps.** Whether a turn is a gap, and which of the four states fired, is `turn-fallback.ts`'s alone. The engine voices the state; a `sergeant`-brisk `no-knowledge` makes the same disclosure as the default — *"minimal hedging IN WORDING ONLY."* A personality that lets a gap read as an answer fails the registry's own merge gate.
- **Eligibility and targets.** Which guidance suggestions exist, what they target, and how many there are is `companion-guidance.ts`'s (permission-gated by `intelligencePlatform.canExecute`). `prioritizeGuidance` is a stable sort; it never adds, drops, or replaces an entry, and `voiceGuidanceLabel` never retargets one.
- **Selection and attention.** Which facts are surfaced, and how many, is the Notice Engine's (Silence Rules) and the producers'. Day-seeded phrasing varies the *voice*, never the *selection* (INT20 §6.6).
- **Grounding bytes.** The engine emits exactly one prompt contribution — the additive tone fragment — and zero bytes of CONTEXT DATA. Serialising, truncating, ordering, or budgeting what the model reads as grounding is the Context Composition Engine's alone (INT17 §7). The fragment instructs the model how to *sound*; it may never carry a fact for the model to *cite*.
- **Confirmation tiers and permissions.** A Strong-tier action requires the same explicit assent in every voice and (future) every language. The engine touches echo-back wording only; TIP2 §5's tiers and TIP1's boundaries are untouched and untouchable from here.
- **Conversation state.** Personality is never written into a turn; nothing the engine produces is persisted by it. The conversation store remains the only turn store, unchanged.
- **Identity.** One Companion, displayed as "Apple", whatever the voice. A personality is a register of speech, not a persona with its own memory, history, or trust boundary — six voices share one conversation, one identity, one set of permissions. A personality with separate state is a second assistant, and is forbidden.
- **Knowledge, in any language.** The engine owns how its *own tone surfaces* are worded — in English today, per locale tomorrow (§6). It must never own a translated copy of any capability output, food name, nutrition fact, or knowledge-store content. Domain knowledge stays with its domain owner in exactly one canonical form, whatever language the user reads.

---

## 4. HOW FACTS BECOME VOICE

One contract, two modes, and the same rule under both: **facts travel as structured slots, verbatim; only the words around them belong to the voice.**

### 4.1 The transform contract

```
   an already-true, already-selected fact
   (turn-fallback state + its disclosure inputs · an eligible
    suggestion set · a GrowthSignal · a Notice · a
    caller-verified {detail})
            │
            ▼
  ┌───────────────────────────────────────────────┐
  │ THE BEHAVIOUR ENGINE                          │
  │                                               │
  │   personalityId ── getPersonality() ──┐       │
  │   (user_preferences, read fresh       │       │
  │    by the caller, normalised to       ▼       │
  │    'companion' on any unknown)   registry     │
  │                                  template     │
  │   fact slots ───────────────────► filled ──►  │  voiced words
  │   (verbatim, never reworded,      around      │
  │    never dropped, never added)    the slots   │
  └───────────────────────────────────────────────┘
```

Properties of every transform, by construction:

- **Pure and deterministic.** No I/O, no clock, no randomness. Greeting/celebration variety is day-seeded (`stablePick`), so the same personality on the same day says the same words — reproducible, testable, and never a jarring re-render.
- **Slot-fill, never authorship.** Templates receive the *same* dynamic inputs the default copy uses (`FallbackPhraseInputs`: what was searched, what was suggested, the resolver's clarification; `GrowthPhraseInputs`: the real numbers, windows, units). No template can invent its own account of what was checked, because it is never given the chance — it only re-wraps what upstream computed.
- **Dispatch, never rewording.** `phraseNotice` routes each fact kind to an existing builder (`growth` → `phraseGrowth`, `streak`/`diversity` → `buildCelebration`, `opportunity`/`seasonal` → `voiceGuidanceLabel`). Content produced by a capability — an opportunity's `explanation` and `suggestedAction` — is never reworded, only optionally prefixed. Verbatim-or-prefixed is the notice rule; verbatim-or-absent is the producer rule (INT20 §9); both hold here.
- **Fail-safe default.** `getPersonality()` normalises any unknown, missing, or malformed id to `companion`. There is no error state at the voice seam — a broken preference degrades to the default voice, never to silence or a crash.

### 4.2 The two modes

1. **Deterministic template voicing** (server-side, no model): fallbacks, labels, greetings, celebrations, growth, notices. The words are fully determined by `(fact, personality, seed)` — auditable string-for-string in tests.
2. **Model-mediated tone** (the LLM turn): the engine contributes one labelled, additive paragraph appended strictly *after* the gateway's five hard grounding/firewall rules — never prepended, never replacing them (EWO1 Risk P1). The model shapes sentences in the personality's register, but every fact it may state comes from the CONTEXT DATA block the Context Composition Engine composed, and every hard rule outranks the voice instruction by position and by its own label.

The two modes must never blur: a template must not try to sound spontaneous by inventing content, and the model must not be asked to voice a deterministic surface (a fallback, a label) that a template already owns — the deterministic surfaces exist precisely so the platform's honesty does not depend on a model call.

---

## 5. HOW PERSONALITIES ARE APPLIED

### 5.1 Personality is data, applied at one seam

- **A closed set.** Six voices, owned in code (`shared/companion-personality.ts` declares the ids and display copy once; the registry attaches all content; the Settings picker and the registry both read that one list, so no second list exists). Growing the set is a registry review (EWO1's governance note), not a feature branch — and a new personality is **one new registry entry, zero new code paths**: every transform already iterates the registry generically.
- **The user's choice is a Profile fact.** `user_preferences.companionPersonality` — one column, `notNull`, default `'companion'`, read fresh every turn by the gateway (never cached in the Context Frame or the conversation store), threaded as a plain `PersonalityId` parameter to the seams. Households may later get a default/override (CPA1 G8); that remains a preferences-owned fact, not an engine concern.

  > **CP2 correction (2026-07-09).** Until CP2 this paragraph was true of the *database* and false of the *platform*. The column existed in Postgres exactly as described, but was never declared in `shared/schema.ts`, so Drizzle omitted it from every `SELECT` and `storage.getUserPreferences()` returned an object with no such key. The gateway therefore read `undefined` on every turn: **every user received the platform default voice, recorded as `no-stored-preference` with `confidence: 0`, 100% of the time, and five of the six personalities were unreachable code.** No surface existed for a user to choose a voice either. CP2 declared the column, shipped the picker, and validated writes against the closed set. The paragraph above now describes the running system. This footnote is retained rather than deleted: an architecture that once asserted a mechanism it did not have should say so, so the next reader trusts the rest by evidence rather than by assumption.
- **Every seam, same voice.** The per-turn voice seam and the ambient notice seam terminate in the same engine (CPA1 §2 names this structural). A user who chose `coach` hears `coach` in the answer, the gap, the suggestion label, the greeting, and the notice. There is no surface with its own voice.
- **`BehaviourProfile` drives phrasing choices only.** The 12 numeric dimensions (warmth, directness, explanation depth, …) select and shape template content. No dimension is read by any business-logic path, confirmation check, or capability gate — a number in the registry can change which words are picked, never what happens.

### 5.2 Same facts, different voice — the acceptance test

The platform-level property every personality change must preserve, testable per seam:

> For any fixed input (same turn, same data, same gap, same suggestions, same notice), switching `PersonalityId` may change **wording, label prefixes, and display order within the already-eligible set** — and nothing else. The disclosures are the same disclosures; the ids are the same ids; the counts are the same counts; the confirmation asked is the same confirmation.

This is already how the engine's test suite is written (`test-intelligence-personality-platform.ts` asserts disclosure preservation across all six voices); this document promotes it from test convention to governing acceptance criterion for every future voice surface, personality, and (future) language.

---

## 6. HOW MULTILINGUAL SUPPORT WILL FIT — WITHOUT DUPLICATING KNOWLEDGE

Nothing multilingual is built or authorised here. But the engine is the place language *will* land, and the difference between a safe landing and a duplication disaster is three rules fixed now.

### 6.1 The three axes are orthogonal, and only one of them is the engine's

| Axis | What varies | Owner | Stored how many times? |
|---|---|---|---|
| **Fact** | nothing — a fact is canonical | the producing capability / knowledge store | **once**, language-neutral |
| **Voice** | register, warmth, directness, emphasis | Behaviour Engine (registry content) | once per personality |
| **Language** | the natural language of the *template surface* | Behaviour Engine (future locale dimension) | once per locale **per template**, never per fact |

Today the registry's template strings conflate voice and language — every template is (voice × English). The multilingual design is to make the locale explicit, not to copy anything: the template lookup grows from `(seam, personality)` to `(seam, personality, locale)`, while every **slot** (`GrowthPhraseInputs` numbers, searched areas, suggestion examples, `{detail}`) stays a language-neutral structured value filled at call time. Templates carry zero knowledge — they are pure connective tissue around verbatim slots — so multiplying templates by locale multiplies **no knowledge whatsoever**. That is the entire trick, and it only works if §3's "no facts in templates" boundary holds absolutely, which is why it is a non-negotiable and not a style preference.

### 6.2 The four rules that prevent duplication

1. **One registry, one engine, N locales.** A locale is a *dimension of template content* inside the one Personality Registry — never a forked registry, a per-language engine, a per-language assistant, or a per-language conversation store. `getPersonality(id)` grows a locale-aware template resolver with an explicit fallback chain (requested locale → default locale) so a missing translation degrades to English in the chosen voice, never to an error and never to a different voice.
2. **Facts are never translated by this layer.** Capability outputs, entity names, ids, and knowledge-store content cross the engine verbatim in canonical form, exactly as they do today. If THA ever localises *domain* content (food names, nutrition copy), that is the owning knowledge store's workstream under its own graduation/ownership rules (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`) — a second canonical form of a fact is a knowledge-platform decision, never a phrasing side effect. The engine's locale dimension covers the engine's own surfaces only.
3. **The model speaks the locale; the grounding stays canonical.** For LLM turns, language arrives the same way voice does — an instruction in the additive fragment ("respond in Dutch"), appended after the hard rules. CONTEXT DATA remains exactly what the Context Composition Engine composed: canonical field names, canonical ids, one form. The model renders the answer in the user's language from canonical grounding; the platform never assembles, stores, or budgets a translated prompt. INT17's ownership is unchanged by localisation — that is the point of settling this rule here.
4. **Locale is a preference, read like personality.** One additive `user_preferences` field (or household default, following G8's precedent when it lands), read fresh by the caller, threaded as a plain parameter. Personality and locale are independent choices: six voices × N languages is a *content* matrix in one registry, never a code matrix. A "Dutch coach" is `(coach, nl)` — not a seventh personality, and not a second coach.

### 6.3 What multilingual work will look like when authorised

A future `LANG-P*` workstream adds the locale parameter to the transform signatures, the locale dimension and fallback chain to the registry's template storage, the language instruction to the fragment builder, and the preference field — and translates template content. It adds **no engine, no seam, no store, no capability, and no translated fact**. If a proposed multilingual design needs any of those five, it is violating this architecture and must stop at the gate.

---

## 7. INTEGRATION

### 7.1 With the Context Composition Engine (INT17)

The boundary is absolute in both directions, and INT17 §6 already states its half:

- **The CCE decides how much of a true fact the model sees; the Behaviour Engine decides how the model (and every template) says it. Neither changes what is true.**
- The Behaviour Engine's only prompt contribution is the labelled tone/locale fragment, positioned after the hard rules and outside the CONTEXT DATA block. It contains instructions, never facts — so it is not grounding, and the CCE neither composes nor budgets it.
- The Behaviour Engine never touches CONTEXT DATA: not a byte serialised, ordered, truncated, or budgeted. If voicing ever seems to need a fact reshaped for the prompt, that is a Context View concern (INT17 §2), and it belongs to the CCE or the owning capability — never to a phrasing template.

### 7.2 With the Notice Engine (INT20, re-homed by OBS1)

**Selection, then phrasing — in that order, with nothing in between.** The Notice Engine's Silence Rules decide *which* facts (at most two) reach the user; `phraseNotice` decides the *words*, per the user's voice. The engine pair shares one fact shape (`Notice`), one direction of flow, and the verbatim discipline: producer `explanation`/`suggestedAction` cross both engines unreworded (optionally prefixed at the voice seam, exactly like guidance labels). Day-seeded phrasing variety never feeds back into selection — a fact is not resurfaced because its wording changed. When NTC-P1 wires the notice route, the route composes the two engines in this order; any other composition (voicing before selection, a second phraser beside the panel) is a violation of both documents.

### 7.3 With the Observation Engine (OBS1/OBS2) — BEH1

**The engine is observed; it never observes.** The direction is absolute and one-way:

- The Behaviour Engine **records nothing.** It is a pure module, and the Observation Engine's capture discipline (§4 rule 4) forbids pure modules from recording their own telemetry. Its callers record, and each caller is documented: `conversation-gateway.ts` captures `behaviour-decision` on every one of its five exit paths, and (CP2) the Companion experience route in `routes.ts` captures one for the greeting surface it serves. CP2 additionally makes `PUT /api/profile` the single capture point for the `behaviour-selection` kind — the one place a user chooses a voice. All three are components that already perform I/O. A *capture point per speaking surface* is the rule; a capture point inside the engine is the violation.
- The Behaviour Engine **reads nothing.** No observation, no aggregate, no timeline. A voice is never chosen, adapted, prioritised, or suppressed because of what telemetry says. `OBS_DISABLE_CAPTURE=1` must always remain a functional no-op: if disabling capture changed a single word, that word was illegally reading telemetry.
- The Behaviour Engine **owns no timeline data and no analytics.** Despite the Workbench's name, `summarizeBehaviour` and `buildExecutionTimeline` are Observation Engine projections over `platform_observations`, computed on read. There is no behaviour table, no materialised aggregate, and no second store of the decision.
- The one thing that crosses in the other direction is **registry description, not telemetry**: the Workbench reads `describeBehaviourRegistry()` live per request so a voice is displayed as it is *defined today*, never as a stale copy captured at record time. Telemetry and registry are joined for display and never merged, never persisted together.

The pair therefore mirrors §7.1 and §7.2: **the Behaviour Engine decides the words; the Observation Engine records that it did. Neither reads the other's decision.**

CP2 adds the decision's mirror image. `behaviour-decision` records the voice that **spoke**; `behaviour-selection` records the voice a user **chose**. They answer different questions and neither is derivable from the other — a platform whose users never change voice and one whose picker is broken look identical in the first and different in the second. Both are operator telemetry, and **nothing reads either back**.

### 7.4 With the Intelligence Platform (TIP1–TIP3) and the Companion Platform (CPA1)

- **The pipeline is upstream and unchanged.** Identity, permission, intent resolution, capability invocation, honest-gap classification: all decided before the engine sees a word. The engine holds no reference to the Capability Registry, performs no I/O, and is **not a capability** (CPA1 §7 — the Companion Platform registers zero capabilities). Nothing about voice may shortcut, soften, or restyle a confirmation: the tier is decided server-side by capability class, and every personality and every future locale asks it.
- **CPA1 remains the governing frame.** One Companion, five responsibilities, one hard invariant. This document adds component depth to §4.1/§4.2 — the ownership boundary (§2–§3), the transform contract (§4), the acceptance criterion (§5.2), and the localisation rules (§6) — and changes none of CPA1's rules. TIP3's Persona model is likewise unchanged: entry surface and Context Frame stay TIP3's; the Personality slot is this engine's, exactly as EWO1 split it.
- **Rendering is downstream and unchanged.** Voiced text renders through the Companion Card structural contract (Summary → Cards → Next Steps) and the closed `InteractionKind` taxonomy. The engine substitutes words into an existing structure; it owns no rendering surface, no motion, no layout.

---

## 8. CURRENT STATE — THE HONEST BASELINE

Verified against the branch (`int1-intelligence-platform`) and the live database, not asserted from prior documents. Updated by CP2, 2026-07-09.

> **What CP2's audit found, and why this section is worded carefully now.** The version of §8 written by BEH1 was accurate about the engine and wrong about the platform. It recorded that the user's voice preference was "read fresh every turn" and counted three unvoiced strings. In fact `user_preferences.companionPersonality` was never declared in `shared/schema.ts`, so it was never selected, never read, and never applied: **every user received the default voice, and five of six personalities were unreachable code.** BEH1's own test suite failed on exactly this assertion and the failure was recorded as unrelated DB noise. The lesson is written into this section's first line: *verified against the running system, not against the last document that described it.*

1. **One engine, one registry, and every Companion word inside them.** `behaviour-engine.ts` and `personality-registry.ts` exist exactly once. Live consumers: `conversation-gateway.ts` (tone fragment, the four honest-gap disclosures, guidance labels/order, the write refusal, the provider-unavailable degradation), `routes.ts` (`GET /api/intelligence/companion/experience` for the panel's greeting + invitation; `describeBehaviourRegistry()` for the read-only Workbench — a description of the registry, not a phrasing seam).
2. **The voice is reachable and choosable (CP2).** The preference column is declared, validated against the closed set at the write (`PUT /api/profile` → 400 on an unregistered voice), read fresh every turn, and normalised to the default at every read. The Settings picker reads the one shared closed set. **All six personalities are selectable by a real user.**
3. **The decision is activated and recorded (BEH1, extended by CP2).** Every interaction seals exactly one behaviour decision. Capture points: the gateway's five exit paths, plus the experience route. `behaviour-selection` records the user's *choice* at `PUT /api/profile`. `test-intelligence-behaviour-decision.ts` asserts the engine records nothing, imports no Observation Engine / Intent Engine / Capability Registry / storage module, performs no I/O, and uses no clock or randomness. `test-intelligence-personality-platform.ts` (322 assertions) is registered in `npm test` and asserts functional identity across all six voices.
4. **Three exports remain code-complete and dormant.** `phraseGrowth`, `phraseNotice` and `buildCelebration` have no live route on this branch — the same dormancy INT20 §7 records for the notice chain; NTC-P1 activates them together. None claims a `BehaviourSurface` until its route exists, and a test asserts that they do not.
5. **Three voiced strings remain outside the engine — the complete list, counted with file:line, not estimated:**
   - `client/src/components/HomeIntelligenceCompanion.tsx:32-37,77` — a client-generated time-of-day greeting.
   - `client/src/components/conversation/companion-action.ts:157-177` — the workflow-outcome summary ("Done — …").
   - `client/src/components/conversation/FloatingAssistant.tsx:697` — the action-confirm error copy.

   **Voice-surface ownership is therefore 9 of 12 (75%).** BEH1 reported "5 of 8 (63%)"; that denominator omitted four surfaces, including a client string that was a *verbatim copy of the `companion` personality's `internal-error` template* — a duplicate frozen in the default register whatever voice the user chose. CP2 retired that copy along with the two gateway strings and the hardcoded greeting, and corrected the inventory. Reporting 100% against BEH1's enumeration would have been a truer-sounding number describing a smaller world. Grandfathered strings are debt scheduled by §9 — never precedent (§10).
6. **The `ExperienceProfile` is live in part.** `greetings` and `invitation` are rendered (CP2). `avatarId`, `colorTheme` and `voiceProfileId` remain populated-but-unrendered scaffolding (CPA1 G5, BEH-P5). `voiceProfileId` is the declared slot for future TTS voice; it is named here so audio, when it comes, is one more field on a shipped registry entry, not a new mechanism.
7. **No localisation machinery exists** — no locale preference, no i18n library, no translated template, no language field anywhere in `server/intelligence`, `shared/companion-personality.ts`, or the client Companion surfaces. §6 is a design for greenfield, stated before the first workstream needs it.
8. **Known residual risk, named and narrowed.** Voice content review is a human gate: a PR that weakens a disclosure *in wording* is caught by review and the §5.2 acceptance criterion, not by a type. CP2 narrows this for the two highest-risk phrases — every `escalationTemplate` must embed `cannotYet(action)` verbatim and every `degradationTemplate` must embed `notConfigured()` verbatim, asserted for all six voices against every action the write-intent guard can produce. **A voice can change how a refusal sounds; it cannot change that it is a refusal.** The four fallback-state disclosures have no such structural pin yet, and that is the largest remaining risk in this document. Extending the technique to them is a named suggestion, not a delivered guarantee.

---

## 9. GROWTH PATH

Each item is a separately gated workstream under `ENGINEERING_WORKFLOW.md`. **Nothing below is authorised by this document.**

**BEH1 — Behaviour Engine Activation. ✅ DELIVERED (2026-07-09).** The decision layer (§2.4), its capture on every interaction, its Execution Timeline projection, and the Behaviour Admin Workbench. Record: `docs/implementation/intelligence/BEH1_BEHAVIOUR_ENGINE_ACTIVATION.md`. It changed no voice content, no business logic, and no word the user reads.

**BEH-P1 — Wire the dormant experience text. ✅ DELIVERED by `CP2` (2026-07-09).** Delivered together with the activation of the personalities themselves, because the greeting was unreachable for the same reason the voices were: `companionPersonality` was never declared in `shared/schema.ts`. CP2 shipped the Settings picker, retired the hardcoded greeting and both gateway-owned strings, added the escalation/degradation templates per personality, and drove `not-voiced` decisions to zero. Record: `docs/implementation/ux/CP2_COMPANION_PERSONALITIES_ACTIVATION.md`. Three client-side voiced strings remain outside the engine (§8.5) and are proposed as `CP3`.

**CP3 — Retire the last three client-side voiced strings** (§8.5). The home-page time-of-day greeting and the workflow-outcome summary each need registry content and a route to reach it; the action-confirm error can reuse the experience payload CP2 already ships. *Exit: voice-surface ownership 12 of 12; every word the Companion says, anywhere, is registry content in the user's voice.*

**BEH-P2 — Voice the activated notice seam** (jointly with NTC-P1, which owns the route). *Exit: every ambient notice reaches the user through `phraseNotice`; no notice text exists outside the registry.*

**BEH-P3 — Household personality default** (CPA1 G8). A preferences-owned fact; the engine gains nothing but a resolved id. *Exit: per-eater override with household default, read at the same seam.*

**BEH-P4 — Locale foundation.** The locale preference, the template locale dimension with fallback chain, the fragment's language instruction (§6.3). *Exit: one non-English locale live for every engine-owned surface; zero translated facts; zero new mechanisms.*

**BEH-P5 — Experience rendering** (avatars/themes) and, far later, TTS via `voiceProfileId`. Client rendering workstreams over existing registry data. *Exit: rendered experience keyed off the same six entries; still one engine.*

---

## 10. NON-NEGOTIABLES

Hard stops, in the spirit of `ENGINEERING_WORKFLOW.md` STEP 7, CPA1 §12, INT17 §7, and INT20 §9:

- **Any phrasing transform, template, or voiced string created outside the Behaviour Engine + Personality Registry pair** — a hardcoded notice next to a route, a per-surface tone tweak, a component that rewords capability output — **stop.** That is a second voice nobody chose; grandfathered strings (the hardcoded greeting) are debt scheduled by §9, not precedent.
- **Any second Behaviour Engine, Personality Registry, or template mechanism, anywhere, rather than the one extended in place — stop.**
- **Any template or fragment that asserts, implies, or fabricates a fact** — including a gap worded to read as an answer, or a `{detail}` filled from anything but caller-verified data — **stop.** Tone-only is the merge gate.
- **Any voice or locale change that alters what is disclosed, what is selected, what is eligible, or what requires confirmation — stop.** Same facts, different voice — §5.2 is the acceptance test.
- **Any personality with its own state, memory, history, or identity — stop.** Six registers of one voice, one Companion, one conversation.
- **Any grounding byte emitted by this engine, or any tone byte composed by the CCE — stop.** The fragment is instructions after the hard rules; CONTEXT DATA is INT17's alone.
- **Any translated copy of a capability output, entity name, or knowledge-store fact held by this layer — stop.** Locale is a template dimension; knowledge is canonical, once, with its owner (§6.2).
- **Any per-language fork — a registry, engine, assistant, store, or pipeline variant per locale — stop.** A missing translation falls back; it never forks.
- **Any non-deterministic phrasing — a clock-driven, random, or model-generated template pick on a deterministic surface — stop.** Day-seeded is the ceiling of variety; honesty surfaces never depend on a model call.
- **Any `BehaviourProfile` dimension read by business logic, a confirmation check, or a capability gate — stop.** Registry numbers pick words, never behaviour of the platform.
- **Any behaviour decision that is read back by anything — routing, a voice choice, a threshold, a default, a "learned" preference — stop.** The decision is recorded as telemetry and consumed only by operator views (§7.3). Effectiveness is a number an operator reads, not a signal the platform acts on. Autonomous learning is a separately gated workstream and is not authorised here.
- **Any behaviour decision recorded by the engine itself, or any observation the engine reads — stop.** The engine is pure; the gateway captures. `OBS_DISABLE_CAPTURE=1` must remain a functional no-op.
- **Any "confidence" reported for a deterministic transform as though it were a quality or model score — stop.** Behaviour confidence is voice *provenance* (§2.4): the engine either knows the user's chosen voice or it does not, and it says which.
- **Any voiced surface presented as voiced when no transform ran — stop.** `not-voiced` exists so platform-owned copy is counted as debt, never disguised as the Companion's voice.
- **Any second Behaviour Workbench, behaviour table, or materialised behaviour aggregate — stop.** One admin-only, read-only Workbench; every number in it is an Observation Engine projection computed on read.

---

## 11. DEFINITION OF DONE — CHECK

| Requirement | Met by |
|---|---|
| One canonical Behaviour Engine defined | §0 mandate; §2 (the seam + the registry as one component); §10 (second-engine stop) |
| What it owns | §2 — every voice surface, the registry content, one decision (words), sealed and recorded per interaction (§2.4) |
| What it must never own | §3 — nine named boundaries, each with its owner; §7.3 — observations, timelines, analytics |
| How facts become voice | §4 — the transform contract, two modes, slot-fill-never-authorship |
| How personalities are applied | §5 — data-driven, one seam, closed set, §5.2 acceptance test (extended to the decision by §2.4) |
| How multilingual fits without duplicating knowledge | §6 — three orthogonal axes, four rules, template-dimension-only locale |
| Integration with CCE, Notice Engine and Observation Engine | §7.1 / §7.2 / §7.3 (+ §7.4 TIP1–3/CPA1) |
| The decision is observable for every interaction | §2.4; capture at every speaking surface; Execution Timeline projection (OBS2 §6.2) |
| The user can choose a voice, and the choice is recorded | §5.1 (the preference + its picker); §7.3 (`behaviour-selection`) — both delivered by CP2 |
| No business logic changes | BEH1 record §12 / CP2 record §11 Scope Lock — no capability, permission, confirmation tier, intent, or business service touched by either |
| One governing architecture for voice, tone, personality, future localisation | This document; growth path §9 (BEH1 and BEH-P1/CP2 delivered; CP3, BEH-P2…P5 each separately gated) |

---

*Required reading before changing any Companion voice content, adding a personality, wiring any surface that speaks to the user, recording anything about a behaviour decision, or beginning any localisation work in THA.*
*Implementation records: `docs/implementation/intelligence/INT21_BEHAVIOUR_ENGINE_ARCHITECTURE.md`, `docs/implementation/intelligence/BEH1_BEHAVIOUR_ENGINE_ACTIVATION.md`, `docs/implementation/ux/CP2_COMPANION_PERSONALITIES_ACTIVATION.md`.*
*Rollback: `rollback-int21-pre-behaviour-engine` → `fbc0a3e`; BEH1: `rollback/before-beh1-behaviour-engine-20260709` → `22e5bc7`; CP2: `rollback/before-cp2-companion-personalities-20260709` → `c363df3`.*
