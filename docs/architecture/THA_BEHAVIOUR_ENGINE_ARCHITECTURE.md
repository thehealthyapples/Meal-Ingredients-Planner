# THA Behaviour Engine Architecture

**Status:** GOVERNING ARCHITECTURE — Intelligence Governance (canonical). Established by workstream `INT21`, 2026-07-08.
**Classification:** Intelligence Governance — the single owner of the Companion's voice: every transform between an already-true, already-selected fact and the words the user reads.
**Governing documents:** `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3), `THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1), `THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17), `THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (INT20), `PLATFORM_QUALITY_ARCHITECTURE.md`
**Implementation record:** `docs/implementation/INT21_BEHAVIOUR_ENGINE_ARCHITECTURE.md`
**Direct precedent:** `docs/investigations/EWO1_COMPANION_PLATFORM_FOUNDATION.md` (the invariant), `docs/implementation/EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md` (the engine + registry as built), `docs/implementation/EWX1_LIVING_COMPANION_EXPERIENCE.md` (`phraseNotice`), CPA1 §4.1/§4.2/§5.1 (the engine's Companion-layer position)
**Rollback:** `rollback-int21-pre-behaviour-engine` → `fbc0a3e`

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
| Greetings and celebrations | `buildGreeting` / `buildCelebration` — deterministic, day-seeded template pick; `{name}`/`{detail}` slots filled only with caller-verified strings | scaffold (CPA1 G5) |
| Growth statements | `phraseGrowth` — voices `companion-growth.ts`'s precomputed numbers, never recomputes them | dormant (route not on branch) |
| Voiced notices | `phraseNotice` — dispatches each Notice's fact kind to the existing builders above; producer content verbatim-or-prefixed, never reworded | dormant until NTC-P1 |

### 2.2 The voice content — the Personality Registry as the engine's data half

The engine's transforms are generic; every word of voice content lives in exactly one place, the **Personality Registry** (`personality-registry.ts`): six closed `PersonalityDefinition`s (`companion` default, `friend`, `coach`, `chef`, `teacher`, `sergeant`), each carrying a 12-dimension `BehaviourProfile`, a `priorities` list, one `systemPromptFragment`, four `fallbackTemplates`, a `guidanceLabelPrefix`, a `growthTemplate`, and an `ExperienceProfile`. CPA1 treats Registry and Engine as two of its five responsibilities; this document governs them as one component with two halves — **the registry is the data, the engine is the transform**, and neither is anything without the other. A phrasing template outside the registry, or a phrasing transform outside the engine, is a violation of this architecture wherever it appears.

### 2.3 One decision, not data

Like the Notice Engine (INT20 §3), the Behaviour Engine owns a decision, not a fact: **given this already-produced content and this user's chosen voice, what are the exact words?** Everything it touches belongs to someone else — the gap classification to `turn-fallback.ts`, the suggestions to `companion-guidance.ts`, the growth numbers to `companion-growth.ts`, the notices to the Notice Engine's Silence Rules, the grounding to the Context Composition Engine, the user's personality choice to `user_preferences.companionPersonality` (the Profile capability, read fresh every turn, never cached). The engine persists nothing, reads nothing, and calls nothing: every export is a pure function, `(already-produced content, PersonalityId) → voiced content`.

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

- **A closed set.** Six voices, owned in code (`shared/companion-personality.ts` declares the ids and display copy once; the registry attaches all content). Growing the set is a registry review (EWO1's governance note), not a feature branch — and a new personality is **one new registry entry, zero new code paths**: every transform already iterates the registry generically.
- **The user's choice is a Profile fact.** `user_preferences.companionPersonality` — one column, `notNull`, default `'companion'`, read fresh every turn by the gateway (never cached in the Context Frame or the conversation store), threaded as a plain `PersonalityId` parameter to the seams. Households may later get a default/override (CPA1 G8); that remains a preferences-owned fact, not an engine concern.
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

### 7.3 With the Intelligence Platform (TIP1–TIP3) and the Companion Platform (CPA1)

- **The pipeline is upstream and unchanged.** Identity, permission, intent resolution, capability invocation, honest-gap classification: all decided before the engine sees a word. The engine holds no reference to the Capability Registry, performs no I/O, and is **not a capability** (CPA1 §7 — the Companion Platform registers zero capabilities). Nothing about voice may shortcut, soften, or restyle a confirmation: the tier is decided server-side by capability class, and every personality and every future locale asks it.
- **CPA1 remains the governing frame.** One Companion, five responsibilities, one hard invariant. This document adds component depth to §4.1/§4.2 — the ownership boundary (§2–§3), the transform contract (§4), the acceptance criterion (§5.2), and the localisation rules (§6) — and changes none of CPA1's rules. TIP3's Persona model is likewise unchanged: entry surface and Context Frame stay TIP3's; the Personality slot is this engine's, exactly as EWO1 split it.
- **Rendering is downstream and unchanged.** Voiced text renders through the Companion Card structural contract (Summary → Cards → Next Steps) and the closed `InteractionKind` taxonomy. The engine substitutes words into an existing structure; it owns no rendering surface, no motion, no layout.

---

## 8. CURRENT STATE — THE HONEST BASELINE

Verified against the branch (`int1-intelligence-platform`, 2026-07-08), not asserted from prior documents:

1. **One engine, one registry, live at one seam.** `behaviour-engine.ts` and `personality-registry.ts` exist exactly once; `conversation-gateway.ts` is the only live consumer (`voiceFallback` at the write-intent gap and unsuccessful-turn classification plus the internal-error path; `voiceGuidanceSuggestions` on both success- and recovery-path suggestion sets; `systemPromptFragment` appended as the labelled paragraph after hard rules 1–5). The engine's test suite (`test-intelligence-personality-platform.ts`) asserts disclosure preservation across all six voices.
2. **Two exports are code-complete and dormant.** `phraseGrowth` and `phraseNotice` have no live route on this branch — the same dormancy INT20 §7 records for the notice chain; NTC-P1 activates both together. `buildGreeting`/`buildCelebration` are called only via `phraseNotice`; `FloatingAssistant.tsx`'s empty-state greeting remains hardcoded (CPA1 G5).
3. **The `ExperienceProfile` is a data scaffold** — `avatarId`, `colorTheme`, `voiceProfileId` populated but rendered nowhere (CPA1 G5). `voiceProfileId` is the declared slot for future TTS voice; it is named here so audio, when it comes, is one more field on a shipped registry entry, not a new mechanism.
4. **No localisation machinery exists** — no locale preference, no i18n library, no translated template, no language field anywhere in `server/intelligence`, `shared/companion-personality.ts`, or the client Companion surfaces. §6 is a design for greenfield, stated before the first workstream needs it.
5. **Known residual risk, named:** voice content review is a human gate. The registry's header states the merge rule (no template may imply an answer exists when it doesn't), and the test suite enforces the four fallback states' disclosures — but a future personality or locale PR that weakens a disclosure *in wording* is caught by review and the §5.2 acceptance criterion, not by a type. This is the same class of residual risk PQA accepts for all reviewed reference data.

---

## 9. GROWTH PATH

Each item is a separately gated workstream under `ENGINEERING_WORKFLOW.md`. **Nothing below is authorised by this document.**

**BEH-P1 — Wire the dormant experience text.** Call `buildGreeting`/`buildCelebration` from the Companion panel's empty state (closing CPA1 G5's text half). *Exit: no hardcoded greeting; every greeting is registry content in the user's voice.*

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

---

## 11. DEFINITION OF DONE — CHECK

| Requirement | Met by |
|---|---|
| One canonical Behaviour Engine defined | §0 mandate; §2 (the seam + the registry as one component); §10 (second-engine stop) |
| What it owns | §2 — every voice surface, the registry content, one decision (words) |
| What it must never own | §3 — nine named boundaries, each with its owner |
| How facts become voice | §4 — the transform contract, two modes, slot-fill-never-authorship |
| How personalities are applied | §5 — data-driven, one seam, closed set, §5.2 acceptance test |
| How multilingual fits without duplicating knowledge | §6 — three orthogonal axes, four rules, template-dimension-only locale |
| Integration with CCE and Notice Engine | §7.1 / §7.2 (+ §7.3 TIP1–3/CPA1) |
| No implementation, no business logic changes | This document and its INT21 record are the only artefacts |
| One governing architecture for voice, tone, personality, future localisation | This document; growth path §9 (BEH-P1…P5, each separately gated) |

---

*Required reading before changing any Companion voice content, adding a personality, wiring any surface that speaks to the user, or beginning any localisation work in THA.*
*Implementation record: `docs/implementation/INT21_BEHAVIOUR_ENGINE_ARCHITECTURE.md`.*
*Rollback: `rollback-int21-pre-behaviour-engine` → `fbc0a3e`.*
