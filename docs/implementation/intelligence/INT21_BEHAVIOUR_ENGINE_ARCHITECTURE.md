# INT21 — Behaviour Engine Architecture

> **Status: COMPLETE.** This workstream designs the Behaviour Engine as the canonical voice and
> personality layer of the Intelligence Platform and establishes its governing architecture at
> `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`. **Documentation only** — no code,
> no schema, no runtime, no API changes, no business logic changes. The design governs machinery
> that already exists (EWO2's `behaviour-engine.ts` + `personality-registry.ts`, EWX1's
> `phraseObservation`) rather than proposing any new engine, and fixes the rules under which
> personalities grow and multilingual support later lands without duplicating knowledge.

**Classification:** Intelligence Governance → Behaviour / Voice (design record for the governing document)
**Date:** 2026-07-08
**Branch:** `int1-intelligence-platform`
**EWO risk:** 🟢 GREEN — documentation-only; the two documents (plus one README index row) are the only writes
**Governing document created:** `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`
**Governing documents complied with:** TIP1, TIP2, TIP3, CPA1, INT17 (Context Composition Engine), INT20 (Observation Engine), `ARCHITECTURE_PRINCIPLES.md`, `ENGINEERING_WORKFLOW.md`

---

## 0. ROLLBACK PROTECTION — created before any file was modified

| Item | Value |
|------|-------|
| Git status at start | **Not clean** — the working tree carries INT20's own uncommitted output: `docs/architecture/README.md` (modified — INT20's index row) and the two untracked INT20 documents. No other changes. Recorded honestly rather than asserted clean. |
| HEAD at start | `fbc0a3e` — "Document INT19 — Context Composition Engine baseline and Context View rollout" |
| **Rollback tag created** | **`rollback-int21-pre-behaviour-engine`** → `fbc0a3e` |
| Action on rollback | **File-scoped only:** delete `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` and `docs/implementation/intelligence/INT21_BEHAVIOUR_ENGINE_ARCHITECTURE.md`, and remove the one INT21 row from `docs/architecture/README.md`. Do **not** `git checkout` the README from the tag — that would clobber INT20's uncommitted index row, which predates this workstream. |
| Code modified | **None** |
| Schema modified | **None** |
| Runtime modified | **None** |

---

## 1. REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (canonical entry point — Architecture Bootstrap)
- [x] `docs/architecture/THA_CONTEXT_COMPOSITION_ENGINE_ARCHITECTURE.md` (INT17 — the sibling engine on the model side; its §6 already states the CCE↔Behaviour boundary this design completes from the other side, and its §7 non-negotiables shape §7.1/§10 of the new document)
- [x] `docs/architecture/THA_COMPANION_NOTICE_ENGINE_ARCHITECTURE.md` (INT20; at review time named `THA_OBSERVATION_ENGINE_ARCHITECTURE.md`, re-homed by OBS1 — the sibling engine on the ambient side; §3 names `phraseObservation` as the one voice seam, §5.3/§6.6 fix the selection-vs-phrasing order and the day-seeded-voice rule the new document restates as its own)
- [x] `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (CPA1 — the governing frame: five responsibilities, the §0 invariant, §4.1/§4.2 the component this document details, §5.1 the three gateway call sites, §11 G5/G8 the dormant scaffold and household-personality gaps the growth path schedules)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` / `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` / `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP1–3 — the unchanged spine; TIP2 §5 confirmation tiers untouched by voice; TIP3's Persona split per EWO1)
- [x] Code read/verified before designing: `server/intelligence/conversation/behaviour-engine.ts` (every export and its invariant header), `server/intelligence/conversation/personality-registry.ts` (the six definitions, `BehaviourProfile`, `FallbackPhraseInputs`/`GrowthPhraseInputs` slot contracts, `ExperienceProfile` scaffold, the merge-gate comment), `shared/companion-personality.ts` (the closed id set), `server/intelligence/conversation/conversation-gateway.ts` (the live call sites), `server/routes.ts` + `client/src` wiring checks, `server/tests/test-intelligence-personality-platform.ts` (disclosure-preservation assertions)

---

## 2. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================
☑ One canonical identity — no new entity. The design elevates the existing
  behaviour-engine.ts + personality-registry.ts pair to component-level
  governance; it creates no new module, id, or store.
☑ One owner per fact — §2–§3 of the design walk every input to its existing
  owner (turn-fallback, companion-guidance, companion-growth, Observation
  Engine, CCE, user_preferences); the engine owns a decision (the words),
  never a fact.
☑ No duplicate entities / ownership / logic — the design's central rule:
  one engine, one registry, N personalities and (future) N locales as DATA
  dimensions, never forked mechanisms; knowledge is never translated into
  a second canonical form by this layer.
☑ Runtime consumes one assembled model — unchanged; the engine performs no
  I/O and holds no registry reference.
☑ No fabricated knowledge — tone-only templates; slot-fill-never-authorship
  (§4); verbatim-or-prefixed producer content; the §5.2 same-facts-
  different-voice acceptance test.
☑ No permanent synchronisation bridge — nothing persisted by this layer;
  locale/personality are preferences read fresh from their existing owner.
☑ Evolution over replacement — the same move INT17 made for the context
  seam and INT20 for the ambient seam, applied to the voice seam; nothing
  is replaced or retired.
```

**AI ARCHITECTURE COMPLIANCE**

```
✓ Uses the canonical Intelligence Platform — the engine sits after
  intelligencePlatform.handle() and turn-fallback classification; it
  invokes nothing and shortcuts nothing.
✓ Uses the Capability Registry — ruled NOT a capability (CPA1 §7); every
  fact it voices was produced by a registered, permission-checked owner.
✓ Uses the Intent Engine — no voice or locale may alter a confirmation
  tier; Strong-tier assent is identical under every personality and every
  future language.
✓ Creates no second assistant — six voices are registers of one Companion
  with one identity, one history, one trust boundary; a personality with
  its own state is an explicit hard stop.
✓ Duplicates no conversation state — personality is never written into a
  turn; the engine persists nothing.
✓ Registered capabilities only, permission-aware — inherited; the engine
  adds no read path.
✓ Honest gaps over fabricated knowledge — voiceFallback re-wraps the four
  states' own disclosure facts; a gap worded to read as an answer fails
  the registry's stated merge gate and the design's acceptance test.
```

**Gate result: PASS.** No conflict with any governing document. Two factual notes recorded honestly rather than glossed: (a) CPA1 §4.2/§5.2 describe `phraseGrowth`/`phraseObservation` call sites in `server/routes.ts` that do not exist on this branch — same dormancy INT20 §7 already established; the design's §8 states it and BEH-P2 activates jointly with OBS-P1. (b) The working tree was not clean at start (INT20's uncommitted output) — recorded in §0 with a file-scoped rollback action so INT20's work cannot be clobbered.

---

## 3. WHAT THIS WORKSTREAM DID

1. **Confirmed git status and reported it honestly** (HEAD `fbc0a3e`; INT20's output uncommitted in the tree), **created and reported the rollback tag** (`rollback-int21-pre-behaviour-engine` → `fbc0a3e`) before touching any file, with a file-scoped rollback action that preserves INT20's uncommitted work.
2. **Grounded the design in the live branch, not prior documents' claims.** Verified by direct read/search: exactly one `behaviour-engine.ts` and one `personality-registry.ts`; live call sites only in `conversation-gateway.ts` (`voiceFallback` ×2 + internal-error path, `voiceGuidanceSuggestions` ×2, `systemPromptFragment` ×1 appended after the five hard rules under the label "PERSONALITY (voice only — never overrides rules 1–5 above)"); `phraseGrowth`/`phraseObservation` dormant (no consuming route on this branch); `buildGreeting`/`buildCelebration` unreferenced by any client surface (the FloatingAssistant greeting is hardcoded — CPA1 G5); **zero localisation machinery anywhere** (no locale preference, no i18n dependency, no translated template) — multilingual is greenfield, which is why its rules are fixed in this design before any workstream needs them.
3. **Authored the governing architecture** (`THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md`): mandate (one voice seam, one owner, completing the three-engine symmetry with INT17 and INT20); what the engine owns (§2 — every voice surface, the registry as its data half, one decision not data); what it must never own (§3 — nine boundaries, each with its named owner: facts, gap truth, eligibility, selection, grounding bytes, confirmation tiers, conversation state, identity, knowledge-in-any-language); how facts become voice (§4 — the pure slot-fill transform contract and the two modes, deterministic templates vs. model-mediated tone); how personalities apply (§5 — closed data-driven set, one seam, the same-facts-different-voice acceptance test); how multilingual later fits without duplicating knowledge (§6 — fact/voice/language as orthogonal axes; locale as a template dimension with a fallback chain; facts never translated by this layer; the model speaks the locale while grounding stays canonical; locale as a preference read like personality); integration contracts (§7 — CCE mutual exclusivity of grounding vs. tone; Observation Engine selection-then-phrasing; TIP/CPA1 frame unchanged); the honest current-state baseline (§8); a gated growth path (§9 — BEH-P1…P5, nothing authorised); and ten non-negotiable hard stops (§10).
4. **Indexed the document in `docs/architecture/README.md`** (Intelligence Governance table) at creation — per the standing lesson INT17's index note records from `INTA1` §4.1, so the document is never invisible-by-navigation.
5. **Wrote this implementation record.**

---

## 4. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Intelligence Governance (documentation only).
Stores created/extended: NONE. No schema, code, or runtime change of any kind.
Consumers created: NONE.
Existing owners: all unchanged — behaviour-engine.ts, personality-registry.ts,
  shared/companion-personality.ts, turn-fallback.ts, companion-guidance.ts,
  companion-growth.ts, observation-engine.ts, conversation-gateway.ts and
  user_preferences each keep exactly the ownership they had.
```

---

## 5. TRUST CHECK

- **Could this mislead?** The design's current-state section was verified against the branch by direct read/search, including where reality diverges from CPA1's description of live wiring (the dormant `phraseGrowth`/`phraseObservation` routes) and including the not-clean working tree — both stated with evidence, not glossed.
- **Does it fabricate certainty?** No. Everything unbuilt (greeting wiring, observation voicing, household personality, every locale rule) is a named, separately gated growth-path phase; nothing is authorised by the document itself, and the multilingual section is explicitly design-ahead-of-need.
- **Does it create a second owner of anything?** No. It assigns no new ownership except naming the already-existing voice seam (engine + registry, as one component) canonical — and it adds hard stops against every foreseeable second owner: a hardcoded voiced string, a per-language fork, a translated fact, a personality with state.

---

## 6. SCOPE LOCK

**Implemented scope (this task):** the governing architecture document, this implementation record, one index row in `docs/architecture/README.md`. Nothing else.

**Explicitly excluded (honest gaps, each its own future gated workstream — see design §9):** wiring `buildGreeting`/`buildCelebration` into the Companion panel (BEH-P1 / CPA1 G5); voicing the activated observation seam (BEH-P2, jointly with OBS-P1); household personality default/override (BEH-P3 / CPA1 G8); the entire locale foundation — preference field, template locale dimension, fallback chain, language instruction (BEH-P4); experience rendering and TTS via `voiceProfileId` (BEH-P5); editing TIP3 Part 11's stale single-tone text (pre-existing CPA1 G7, unchanged); any new personality beyond the closed six (registry review, per EWO1's governance note).

---

## 7. DEFINITION OF DONE — CHECK

| Requirement | Met |
|---|---|
| `docs/architecture/README.md` read first | ✅ §1 |
| The two named architecture documents read | ✅ §1 (INT17, INT20 — plus CPA1, the engine's governing frame) |
| Git status confirmed before changes | ✅ §0 — HEAD `fbc0a3e`, INT20 output uncommitted, recorded honestly |
| Rollback created and identifier reported | ✅ `rollback-int21-pre-behaviour-engine` → `fbc0a3e` |
| One canonical Behaviour Engine designed | ✅ design §0, §2, §10 |
| Owns / never owns / facts→voice / personalities / multilingual / integrations defined | ✅ design §2 / §3 / §4 / §5 / §6 / §7 |
| No business logic changes, no duplicate assistants, no duplicate conversation state | ✅ documentation only; design §3, §10 harden all three permanently |
| Same facts, different voice | ✅ design §5.2 — promoted to the governing acceptance test |
| No implementation beyond architecture/report | ✅ two documents + one README index row (§4 above) |
| One governing architecture for voice, tone, personality and future language localisation | ✅ the design document, with the gated BEH-P1…P5 growth path |

---

## FILES CHANGED

| File | Change |
|---|---|
| `docs/architecture/THA_BEHAVIOUR_ENGINE_ARCHITECTURE.md` | **New** — the governing architecture |
| `docs/implementation/intelligence/INT21_BEHAVIOUR_ENGINE_ARCHITECTURE.md` | **New** — this record |
| `docs/architecture/README.md` | One index row added (Intelligence Governance table) |

---

*Rollback: `rollback-int21-pre-behaviour-engine` → `fbc0a3e` (file-scoped action — see §0).*
