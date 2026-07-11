# THA COMPANION PLATFORM ARCHITECTURE — Investigation

**Status:** Investigation — promoted to governing architecture at `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`
**Workstream:** `EWO-CPA1`
**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Mode:** Architecture Investigation
**Scope:** Investigation only. No code, schema, runtime, or API changes.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| HEAD at start | `34605193032d75c496cb14a375c7ccb3f36366a5` |
| Rollback tag created | `rollback/before-companion-platform-architecture-20260703` |
| Tag points to | `34605193032d75c496cb14a375c7ccb3f36366a5` |
| Working tree | Intentionally dirty — pre-existing uncommitted Companion Platform work (EWO1 investigation, EWO2 + EWX1 implementations, EL2, FI5) already in progress on this branch before this investigation began; none of it is modified by this investigation |
| This investigation's writes | Two new files only: this document and `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`, plus one index update to `docs/architecture/README.md` |
| Action on rollback | `git checkout rollback/before-companion-platform-architecture-20260703 -- docs/investigations/intelligence/THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION.md docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md docs/architecture/README.md` (restores/removes only these three files; leaves all pre-existing uncommitted Companion Platform work untouched) |

---

## MANDATE

Design the canonical THA Companion Platform Architecture: the governing document that names Companion ownership, the Personality Registry, the Behaviour Engine, the Observation Engine, Companion Growth, Guidance, and Experience responsibilities as one coherent platform — states its runtime boundaries, its relationship to the Intelligence Platform, the Capability Registry, Platform Quality, and Platform Knowledge — and confirms there is one Companion, one conversation, one Behaviour Engine, one Observation Engine, and one Personality Registry. Identify any duplicated ownership or missing governance. Platform-first. No implementation detail. Suitable for permanent adoption.

**Why now, not earlier.** `EWO1` (2026-07-03, `docs/investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md`) scoped exactly one addition — a Personality layer — onto a Companion Platform it found already live (Gateway, Capability Registry, Intent Engine, Conversation Store, Context Frame, Companion Cards). `EWO2` then implemented Personality, and a follow-on workstream, `EWX1`, implemented a Behaviour-adjacent Observation Engine and Companion Growth signal on top of it. Both are real, tested, and merged into the working tree, but neither produced governing architecture — `EWO2` and `EWX1` are implementation documents (`docs/implementation/`), which record what was built, not what is permanently true of the platform going forward. Four modules (`personality-registry.ts`, `behaviour-engine.ts`, `observation-engine.ts`, `companion-growth.ts`) and a client delight/interaction layer now exist with no single document naming how they compose, what each owns, and where the line is that keeps the Companion one platform rather than a set of independently-evolving pieces. This investigation closes that gap, following the exact promotion pattern already used for `PLATFORM_QUALITY_ARCHITECTURE.md` (`EWO-PQA1`) and `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (`EWO-PKCA1`) earlier the same day.

---

## STEP 2 — ARCHITECTURE BOOTSTRAP (read before starting)

Read in full before any design work, per `ENGINEERING_WORKFLOW.md` STEP 2:

- `docs/architecture/README.md` — canonical index
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — the eight governing principles
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — domain ownership register
- `docs/architecture/ENGINEERING_WORKFLOW.md` — release/compliance workflow
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1) — the Intelligence Platform: Gateway, Knowledge Plane, Intent Engine, security model
- `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2) — the Capability Registry and verb taxonomy
- `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3) — one canonical assistant surfaced as contextual personas, the Context Frame, Part 11 Trust & Personality, Risk R10 (the direct precedent this document must reconcile with, exactly as `EWO1` §0.4 already did once)
- `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` — the canonical response-rendering vocabulary
- `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md` — discovery/presentation ownership boundary
- `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md` — already contains a §9 characterisation of "the Companion Platform (personality, behaviour engine, observation engine)" as a pure phrasing/observation layer; this investigation must not contradict it, only make it authoritative in detail
- `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` — the graduation-pipeline/evidence/ownership shape for knowledge domains, to confirm the Companion Platform is *not* a knowledge domain and does not need to comply with it
- `docs/investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md` — direct precedent; the Personality design this document must build on, not re-derive
- `docs/implementation/intelligence/EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md` — what EWO1's design actually became in code
- `docs/implementation/ux/EWX1_LIVING_COMPANION_EXPERIENCE.md` — the Observation Engine, Companion Growth, Interaction, and Delight work built after EWO2
- Live code (read in full): `server/intelligence/conversation/personality-registry.ts`, `behaviour-engine.ts`, `observation-engine.ts`, `companion-growth.ts`, `conversation-gateway.ts`, `turn-fallback.ts`, `companion-guidance.ts` (header/exports); `shared/companion-personality.ts`, `shared/companion-interaction.ts`; `client/src/components/conversation/FloatingAssistant.tsx`, `client/src/hooks/use-companion-observations.ts`, `client/src/lib/companion-delight.ts`; `server/intelligence/capability-registry.ts`; `shared/schema.ts` (companion-related columns); `server/tests/test-intelligence-personality-platform.ts`, `test-intelligence-observation-engine.ts`

---

## ARCHITECTURE COMPLIANCE REVIEW (gate)

| Principle | Companion Platform Architecture compliance | Verdict |
|---|---|---|
| 1 — One canonical identity per entity | No new entity. The Companion is confirmed (Grounding, below) to remain one identity: one conversation store, one Gateway, one Capability Registry, one Personality Registry, one Behaviour Engine, one Observation Engine. This document names that identity; it does not create a second one. | ✅ Pass |
| 2 — One owner per fact | This document owns no new facts. It names existing owners: `user_preferences.companionPersonality` (the user's voice choice), `personality-registry.ts` (voice content, code-owned reference data), `storage.getUserHealthTrends`/`getUserStreak` (growth/streak facts, pre-existing owners), the `opportunity-delivery` capability (opportunity facts, pre-existing owner). | ✅ Pass |
| 3 — Progressive enrichment / single-owner state | Not directly applicable in the knowledge-entity sense — Companion Personality is transactional user-preference state (single-owner, per `EWO1`'s own compliance finding); Observation/Growth are stateless per-request computations with no owned store at all. | ✅ Pass |
| 4 — Runtime consumes one assembled model | Reinforced, not weakened: personality is read once per turn and threaded as a parameter (§ Grounding); Observation/Growth read already-owned data at request time and produce a value, never a second cached copy of it. | ✅ Pass |
| 5 — Reference vocabularies stay beside the spine | `PERSONALITY_REGISTRY` (6 closed entries) and the `InteractionKind` vocabulary (9 closed entries) are exactly this pattern — closed, code-owned, versionless lookup tables beside the Conversation Gateway, the same class of artefact as `capability-registry.ts` itself. | ✅ Pass |
| 6 — No fabricated knowledge | The hard invariant carried from `EWO1` §5 and restated by every module built since ("changes how, never what") is Principle 6 applied to voice and to companion-generated commentary. `companion-growth.ts` returns `null` below a minimum sample size rather than fabricate a trend; `observation-engine.ts` only fires on genuinely notable, already-true thresholds. | ✅ Pass |
| 7 — No permanent synchronisation bridge | No bridge exists. Personality content is static code, not a second copy of anything database-backed. Observation/Growth read live from existing owners on every request — there is no cache, no denormalised copy, nothing to fall out of sync. | ✅ Pass |
| 8 — Evolution over replacement | Nothing is replaced. This document formalises what `EWO1`→`EWO2`→`EWX1` already built incrementally; it retires no mechanism and introduces no parallel one. Gaps found (§ Gaps and Missing Governance) are named and deferred, not silently patched here. | ✅ Pass |

**Gate result: PASS.** The investigation proceeds as a naming/governance layer over already-implemented, already-tested mechanisms — the same footing as `EWO-PQA1` and `EWO-PKCA1`.

---

## GROUNDING — WHAT THA ACTUALLY HAS TODAY

This investigation is grounded in the live working tree (including uncommitted `EWO2`/`EWX1` work), not a greenfield or aspirational design. Every module below was read in full; nothing here is invented.

### The Companion Platform, restated (unchanged since `EWO1`)

The spine `EWO1` found live remains exactly as it was: Gateway/role-tier resolution (`access.ts`, `conversation-gateway.ts`), Capability Registry (`capability-registry.ts`), Intent resolution (`intent-resolver.ts`/`pattern-intent-resolver.ts`), Intent Engine (`intent-engine.ts`), Conversation history (`conversation-store.ts`), Context Frame (`context-frame-assembler.ts`), Companion Card rendering (`companion-card.ts`), cross-domain guidance (`companion-guidance.ts`), and honest-gap classification (`turn-fallback.ts`). None of these were touched by `EWO2` or `EWX1` in any structural sense — confirmed by direct read.

### What has been added since EWO1 (EWO2 + EWX1) — one module, one job each

| Module | File | Single responsibility (grounded in the code's own header comments and export shape) | Reads | Writes |
|---|---|---|---|---|
| **Personality vocabulary** | `shared/companion-personality.ts` | The closed `PersonalityId` enum (`companion \| friend \| coach \| chef \| teacher \| sergeant`) and display copy, shared byte-identical client/server | Nothing (pure constants) | Nothing |
| **Personality Registry** | `server/intelligence/conversation/personality-registry.ts` | The closed, code-owned reference table of the six voices — one `PersonalityDefinition` per id (behaviour profile, priorities, system-prompt fragment, 4 fallback templates, guidance-label prefix, growth template, experience profile). Pure data plus `getPersonality(id)` lookup. No I/O, no LLM call. | Nothing | Nothing |
| **Behaviour Engine** | `server/intelligence/conversation/behaviour-engine.ts` | Turns a `PersonalityId` into phrasing at the Companion's existing output seams. Every export is a pure string transform: `systemPromptFragment`, `voiceFallback`, `voiceGuidanceLabel`, `prioritizeGuidance` (stable reorder only), `voiceGuidanceSuggestions`, `buildGreeting`/`buildCelebration` (deterministic, day-seeded), `phraseGrowth`, `phraseObservation`. States in its own header: "Contains NO business logic and makes NO decisions about WHAT the Companion says — only HOW." | `personality-registry.ts`, and (type-only) `turn-fallback.ts`, `companion-guidance.ts`, `observation-engine.ts` | Nothing |
| **Companion Growth** | `server/intelligence/conversation/companion-growth.ts` | Computes a `GrowthSignal` from `UserHealthTrend[]` rows the caller already fetched — a recent-vs-earlier window comparison — returning `null` unless both windows have ≥5 samples (`MIN_SAMPLES_PER_WINDOW`). States in its own header: "Never fabricate familiarity. Never invent achievements." Phrasing is explicitly not this module's job. | Caller-supplied `UserHealthTrend[]` (ultimately `storage.getUserHealthTrends`) | Nothing — read-only by construction, stated explicitly in-file |
| **Observation Engine** | `server/intelligence/conversation/observation-engine.ts` | A thin adapter that wraps facts already computed by four existing, unmodified owners (`companion-growth.ts`, streak storage, plant-diversity assembly, the `opportunity-delivery` capability) into one common `Observation` shape, then applies one shared **Silence Rules** gate (`applySilenceRules`: de-dupe by id, rank by priority, cap at `MAX_OBSERVATIONS_PER_MOMENT = 2`). States in its own header: "Contains NO new business logic and performs NO reasoning of its own." | Caller-supplied `UserHealthTrend[]`, `UserStreak`, a plant-diversity number, and `OpportunityLike[]` — all I/O happens in the caller (`server/routes.ts`), never inside this module | Nothing |
| **Interaction vocabulary** | `shared/companion-interaction.ts` | The closed `InteractionKind` enum (9 values) and a static map from each `ObservationCategory` to an `InteractionKind`. Pure vocabulary — no phrasing, no behaviour. | Nothing | Nothing |
| **Delight** | `client/src/lib/companion-delight.ts` | Three bounded (≤400ms) `framer-motion` variants and a picker keyed off `InteractionKind`, plus a `prefersReducedMotion()` check. States in its own header: "owns NO state and NO data." | Nothing | Nothing |
| **Client observation read** | `client/src/hooks/use-companion-observations.ts` | "The ONE client-side owner of the Companion Observation read" — a TanStack Query hook against `GET /api/intelligence/companion/observations`. Performs no filtering/ranking/rewording — the server has already applied Silence Rules and voicing. | The one route above | Nothing |

Every module above satisfies the same test `EWO1` applied to Personality: one job, one owner, zero fabrication, additive-only wiring into the existing pipeline.

### Where each module is wired into the runtime

**`conversation-gateway.ts`'s pipeline** (the one wiring point, unchanged in step count/order from `EWO1`'s description) now reads `companionPersonality` once per turn (via `normalizePersonalityId`, from `storage.getUserPreferences`) and threads it as a plain parameter into `buildGroundedResponse`, which calls exactly three Behaviour Engine functions: `voiceFallback` (the four honest-gap/fallback states), `voiceGuidanceSuggestions` (guidance label copy and stable reorder), and `systemPromptFragment` (one additional, clearly-labelled paragraph appended after the five hard rules in the system prompt). This is the entirety of the per-turn integration.

**`observation-engine.ts` and `companion-growth.ts` are not part of the per-turn pipeline at all.** They are wired exclusively through two separate `server/routes.ts` handlers: `GET /api/intelligence/companion/observations` (the live route — fetches health trends, streak, plant-diversity, and opportunities in parallel, runs the four `observe*` producers, applies Silence Rules, then voices each via `phraseObservation`) and `GET /api/intelligence/companion/growth-insight` (an earlier, still-registered `EWO2` route, superseded by the observations route per `EWX1`'s own "Consolidation note" — the client no longer calls it; see § Gaps, item G2). Neither route is reached by `conversation-gateway.ts`; both sit beside it, called independently by the client when the Companion panel opens with no history yet.

**`turn-fallback.ts`** changed by exactly two exports (`formatSuggestions`, `describeSearched` made `export`, with an in-file comment explaining why: so `behaviour-engine.ts` can voice the same already-computed, already-honest facts without recomputing them). No logic changed; the four-state vocabulary (`no-route`/`no-knowledge`/`no-results`/`internal-error`) is byte-identical to what `EWO1` documented.

**`capability-registry.ts`** has zero diff attributable to Personality/Behaviour/Observation/Growth — confirmed by direct read and asserted independently by both `EWO2`'s and `EWX1`'s own implementation documents. The one line that did change (the `opportunity-delivery` capability's `apiSurface` description) belongs to the earlier, unrelated `FI5` workstream.

**`shared/schema.ts`** gained exactly one additive column: `userPreferences.companionPersonality` (`text`, `notNull`, default `'companion'`). No table was added for Behaviour, Observation, or Growth — confirmed by grep; the pre-existing `companion_health_snapshots`, `companion_learning_recommendations`, `companion_response_feedback`, `companion_guidance_events`, and `companion_action_proposals` tables belong to earlier `INT35C`/`INT38`/`INT40` workstreams and are untouched.

**`FloatingAssistant.tsx`** gained, additively: a conditional "speaking as {personality}" label beside the existing surface `PersonaLabel` badge (hidden for the silent default so a user who never opened Settings sees no new UI), and one `useCompanionObservations` call that renders the single top-ranked observation beneath the existing empty-state greeting, animated via `variantForInteraction`. This replaced an earlier `EWO2`-only growth-insight banner — the client no longer fetches `/growth-insight` directly.

---

## CONFIRMATION — ONE OF EACH

The mandate asks this investigation to confirm, explicitly, that there is one Companion, one conversation, one Behaviour Engine, one Observation Engine, and one Personality Registry. Each was checked directly, not assumed.

| Claim | Method of verification | Result |
|---|---|---|
| **One Companion** | Grep for a second conversational identity, a second system-prompt assembly point, or a second "assistant" brand anywhere in the codebase. | Confirmed. One system-prompt assembly point exists (`conversation-gateway.ts`'s `buildGroundedResponse`). Several unrelated, single-purpose LLM calls exist elsewhere (`server/routes.ts`/`server/services/`: recipe extraction, ingredient extraction, household meal-adaptation, recipe generation, OCR, UPF classification) — none of these are conversational, none touch `personality-registry.ts` or `behaviour-engine.ts`, and none present themselves to a user as an assistant. They are feature-local LLM calls, not a second Companion. The product is one Companion, internally named `companion-*` throughout the file tree and displayed to the user under the friendly name "Apple" in the greeting copy — one identity with one internal name and one display name, not two identities (this is the exact relationship `EWO1` §0.2 already established between "the Companion" and "Companion Cards"; it now also covers "Apple" as the display-layer name for the same one identity). |
| **One conversation** | Confirm `conversation-store.ts` is still the only turn/thread store, and that no new module writes conversation state. | Confirmed. Personality is read fresh every turn from `user_preferences` and never written into a conversation turn (mirrors the Context Frame's own non-duplication rule, `EWO1` §6). Observation/Growth write nothing at all — they are pure request-time reads. No new conversation store exists anywhere in the diff. |
| **One Behaviour Engine** | Grep `class.*Engine\|export.*Engine` under `server/intelligence`. | Confirmed. Exactly one `behaviour-engine.ts` file exists in the tree; it is a plain module (functions + re-exports), not a class, so there is no instantiable second copy anywhere. |
| **One Observation Engine** | Same method. | Confirmed. Exactly one `observation-engine.ts` file exists. The pre-existing domain "discovery engines" (`MealDiscoveryEngine`, `NutritionDiscoveryEngine`, `PlannerDiscoveryEngine`, `ShoppingDiscoveryEngine`, `HouseholdDiscoveryEngine`, `DiaryDiscoveryEngine`, `PantryDiscoveryEngine`) are a different, older, unrelated class of machinery (capability-side discovery, not Companion presentation) and were not touched by, and do not overlap in responsibility with, `observation-engine.ts`. |
| **One Personality Registry** | Same method, plus a check that no second closed-enum voice list exists. | Confirmed. `shared/companion-personality.ts` declares the closed `PersonalityId` set once; `personality-registry.ts` is the only file that attaches behaviour/content to it. No second enum, no second content table. |

**No duplication was found.** This is a genuinely clean result, not a formality — the grep-based check above is the same method `EWO1`'s own duplication check used, applied again after two further implementation workstreams, and it still comes back negative.

---

## GAPS AND MISSING GOVERNANCE IDENTIFIED

The mandate also asks this investigation to name duplicated ownership *or* missing governance. No duplicated ownership was found (above). The following are the real, named gaps — none of them are duplication, all of them are either (a) documentation debt this investigation itself substantially closes, or (b) scoped, already-flagged future work carried forward from `EWO2`/`EWX1`'s own "Suggestions" sections rather than newly discovered here.

- **G1 — No governing architecture existed for four live modules until this document.** `personality-registry.ts`, `behaviour-engine.ts`, `observation-engine.ts`, and `companion-growth.ts` were each designed and implemented (`EWO1`→`EWO2`→`EWX1`) but never named together as one platform in `docs/architecture/`. `PLATFORM_QUALITY_ARCHITECTURE.md` §9 already refers to "the Companion Platform (personality, behaviour engine, observation engine)" as if it were a settled, documented thing — it was accurate but pointed at nothing canonical. This is the gap this investigation and its governing document close.
- **G2 — An orphaned route.** `GET /api/intelligence/companion/growth-insight` is still registered and functional, but no client code calls it — it was superseded by `GET /api/intelligence/companion/observations` per `EWX1`'s own "Consolidation note," and the superseding route re-derives the same signal via `observation-engine.ts` → `companion-growth.ts`. The route is not a duplicate *owner* (it computes nothing the observations route doesn't also compute, from the same underlying data), but it is dead client-facing surface that should be named so a future cleanup workstream retires it deliberately rather than leaving it to be rediscovered by accident.
- **G3 — Two HTTP surfaces over one capability, by design, but worth naming once, in one place.** `observation-engine.ts`'s `observeOpportunities` (via `GET /api/intelligence/companion/observations`) and the separate `FI5` workstream's `GET /api/intelligence/food-opportunities` both ultimately read the same `opportunity-delivery` capability's `report` verb through `intelligencePlatform.handle()`. This is intentional — one is the Companion's own conversational surfacing (a maximum of one opportunity, silence-ruled, personality-voiced, inside the floating panel), the other is a page-embedded panel (`FoodOpportunitiesPanel.tsx`) with its own accept/dismiss actions across Dashboard/Planner/Cookbook/Pantry. Both read the *same* verbatim `explanation`/`suggestedAction` text from the one capability; neither reasons independently. It is not duplicated ownership of the underlying fact (the capability still owns it once), but it is two independent client/server code paths presenting it, and the governing document (§7) names this explicitly so a future engineer does not "fix" the apparent overlap by deleting one without understanding both are legitimate, differently-scoped presentation channels.
- **G4 — `InteractionKind` is a 9-value closed vocabulary; only 6 have a live producer.** `welcome`, `encouragement`, and `seasonal` are declared in `shared/companion-interaction.ts` for future use but are not emitted by any current `observe*` producer or Behaviour Engine function. Not a defect — an honestly incomplete vocabulary, not a fabricated one — but worth naming so a future implementer knows these are placeholders, not bugs.
- **G5 — `ExperienceProfile` (avatar, colour theme, greetings, celebrations, seasonal, voice-profile id) is a data shape with no renderer.** `personality-registry.ts` populates a full `ExperienceProfile` per personality, but nothing in `FloatingAssistant.tsx` or any other client component reads `avatarId`, `colorTheme`, or `voiceProfileId` yet — only `buildGreeting`/`buildCelebration` (text) are wired, and even those are not yet called from the client's hardcoded "Hi, I'm Apple!" empty-state line (`EWO2`'s own named suggestion, still open). This is a scaffold, honestly labelled as such in-code, not a shipped visual experience — the governing document must not describe it as delivered.
- **G6 — No cross-session memory for Silence Rules.** `applySilenceRules` de-dupes and caps *within a single request*; there is no `companion_observation_log` (or equivalent) to remember what was already shown across sessions, so a user could see the same notable observation again the next day, and `observeDiversity`/`observeStreak` can only phrase a milestone as a present-state fact ("you're at 40 plants"), never a genuinely-dated "you just crossed 40" claim. `EWX1` named this itself as the single biggest honesty-ceiling upgrade available, deliberately not built. This governing document carries the deferral forward rather than re-deciding it.
- **G7 — `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3) Part 11 still reads as if the Companion has one fixed tone.** `EWO1` §0.4 already reconciled this in prose (Personality matures Part 11 rather than contradicting it), and `EWO2`'s own Suggestions section named the same document-maintenance gap. It remains open: Part 11's text has not itself been edited to fold in the reconciliation. Not a code gap — a stale cross-reference in an otherwise-correct document, named again here so it does not get lost a second time.
- **G8 — Household-level personality default/override is not built.** Named as a plausible future extension by both `EWO1` §8 and `EWO2`'s Suggestions, following the same per-eater-vs-household-default scope test `household_eaters` already established elsewhere. Not started; no schema exists for it.

None of G1–G8 involves a second owner of an existing fact, a second engine, or a second registry — they are documentation debt (G1, G7), one dead route (G2), one worth-naming dual-surface pattern (G3), and five honestly-scoped, previously-named future extensions (G4–G6, G8). This is the complete answer to the mandate's "identify any duplicated ownership or missing governance" — duplicated ownership: none found; missing governance: G1 (closed by this document) and G7 (named, not closed — a follow-up edit to TIP3, out of this document's scope per Rule 8).

---

## WHY A SEPARATE DOCUMENT, NOT AN EXTENSION OF AN EXISTING ONE

Checked against Source of Truth Register Rule 8 and Architecture Principle 8, applied to documents:

1. **Is there an existing document for this domain?** No single one. `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3) governs the conversation *experience* broadly (personas, Context Frame, voice-as-interface, proactivity) but was written before Personality, Behaviour, Observation, or Growth existed, and — per G7 — has not been updated to reflect them. `EWO1` is a point-in-time investigation for Personality alone, not a living governing document, and by this repository's own convention (`docs/architecture/README.md`, "Architecture Bootstrap") investigation documents in `docs/investigations/` are point-in-time analysis and history only, never governing.
2. **If yes, why insufficient?** N/A — no existing governing document names Behaviour Engine, Observation Engine, or Companion Growth at all; TIP3 predates all three.
3. **If no, is this genuinely a different domain?** Yes, narrowly: TIP1–TIP3 govern the Intelligence Platform and the conversation experience in general (any surface, any capability). The Companion Platform Architecture is scoped specifically to the presentation/voice/observation layer that sits on top of that spine for the one user-facing assistant — a real, separate concern the same way `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` is a real, separate, narrower concern from TIP3, and the same way `PLATFORM_QUALITY_ARCHITECTURE.md` is a real, separate, cross-cutting concern from TIP1. This document sits at the same altitude as `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, generalised from "how cards render" to "how the Companion's identity, voice, behaviour, and observations compose" — genuinely new territory, not a restatement of TIP3.

This satisfies Rule 8's governance check.

---

## DOMAIN IMPACT DECLARATION

Per `ENGINEERING_WORKFLOW.md` STEP 6:

```
DOMAIN IMPACT
=============
Domain affected: None (cross-cutting governance document over an already-implemented
  presentation/voice/observation layer, not a data domain)
Declared SoT: N/A — this document names existing SoTs (user_preferences,
  personality-registry.ts, storage.getUserHealthTrends/getUserStreak, the
  opportunity-delivery capability); it does not become a new SoT for any of them
New store created? NO
Existing store extended? NO — no schema change of any kind
Consumer created? NO
```

No answer creates a duplication. No implementation is authorised by this document.

---

## RECOMMENDED ARCHITECTURE (summary — full detail in the governing document)

**The Companion Platform is a presentation/voice/observation layer, not a second platform.** It sits entirely on top of the Intelligence Platform's Gateway, Capability Registry, Intent Engine, Conversation Store, and Context Frame — it introduces no second identity, no second conversation, no second capability plane, and no second data owner. Its five named responsibilities are: **Personality Registry** (closed voice content), **Behaviour Engine** (phrasing transforms over already-resolved answers), **Observation Engine** (a read-only adapter that surfaces already-true facts, silence-ruled), **Companion Growth** (one honest, minimum-sample-gated trend signal feeding the Observation Engine), and **Guidance + Experience** (the pre-existing cross-domain suggestion registry and the Companion Card/Delight/Interaction rendering vocabulary). Full detail, ownership map, runtime boundaries, and platform relationships are in `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`.

**The hard invariant, unchanged and now formally the platform's own, not just Personality's:** the Companion Platform may change *how* something is said or *which* already-true fact is surfaced — never *what* is true, permitted, or requires confirmation. Every module built since `EWO1` restates this in its own header comment; the governing document makes it one platform-wide rule instead of four independently-repeated ones.

**Integration:**
- **Intelligence Platform (TIP1–3):** the Companion Platform is not a fourth platform beside TIP1–3 — it is the presentation layer *of* TIP3's one canonical assistant, reusing TIP1's Gateway/security model and TIP2's Capability Registry verbatim, adding zero new capabilities.
- **Capability Registry:** zero new entries attributable to this work; the one dual-surface pattern (G3) is named, not resolved, and is not a Registry-level concern.
- **Platform Quality:** the Companion Platform is the concrete instance §9 of `PLATFORM_QUALITY_ARCHITECTURE.md` already named — this document makes that characterisation precise and complete rather than introducing a new one.
- **Platform Knowledge (Completion):** the Companion Platform is confirmed to be *outside* the knowledge-graduation pipeline `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` governs — it consumes already-graduated facts (health trends, streaks, opportunities) at request time and owns no knowledge store of its own.

---

## RISKS

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| C1 | A future workstream adds a capability-invoking behaviour directly inside `behaviour-engine.ts` or `observation-engine.ts` (rather than routing through the Intent Engine/Capability Registry like every other capability), quietly turning "voice/observation" into a second execution path | 🔴 Critical | Governing document §5/§12 states this as a hard stop; both modules' own in-file invariants already forbid it; the duplication check in this document (§ Confirmation) is the repeatable test any future audit can re-run |
| C2 | `growth-insight` (G2) is rediscovered by a future engineer and extended in parallel with the observations route, creating real duplicate ownership of the growth signal where today there is only a redundant route | 🟠 High | Named explicitly in the governing document (§ Gaps) as a retirement candidate, not a second surface to build on |
| C3 | The two-HTTP-surface pattern over `opportunity-delivery` (G3) is "fixed" by an engineer who does not realise both are legitimate, differently-scoped presentation channels, either by deleting one or by merging them into a shared client component that reintroduces coupling between the Companion panel and page-embedded panels | 🟡 Medium | Named explicitly, with both call sites and their distinct scope stated, in the governing document §7 |
| C4 | `ExperienceProfile`'s unwired fields (avatarId, colorTheme, voiceProfileId — G5) get referenced by a future component as if already rendered, producing a visual feature that silently does nothing | 🟡 Medium | Named explicitly as a scaffold, not a shipped experience, in the governing document §4.5 |
| C5 | TIP3 Part 11's stale "one fixed tone" text (G7) is read literally by a future investigation and treated as still-current, contradicting the shipped Personality feature | 🟢 Low | Named in both `EWO2` and this document; the actual reconciliation already exists in `EWO1` §0.4 and is restated in the governing document §6 |

---

## PHASED FOLLOW-UP (not authorised here — named for future governed workstreams)

1. **Retire or explicitly repurpose `GET /companion/growth-insight`** (G2) — lowest-risk, pure deletion or a one-line deprecation note once confirmed unused by any client.
2. **`companion_observation_log` table** (G6) — one small, additive table (`user_id`, `category`, `shown_at`) to give Silence Rules genuine cross-session memory and let milestones honestly say "you just crossed this." Named by `EWX1` as the single biggest honesty-ceiling upgrade available; requires its own Rule 8 governance review before the schema is added.
3. **TIP3 Part 11 edit** (G7) — fold in the `EWO1` §0.4 reconciliation so the governing document and the shipped feature read as consistent. Pure documentation change.
4. **Household-level personality default/override** (G8) — a straightforward extension of the existing `user_preferences`-owned fact, following the `household_eaters` per-eater-vs-household-default precedent.
5. **Wire `welcome`/`encouragement`/`seasonal` `InteractionKind`s to real producers, or remove them from the enum** (G4) — a scoping decision, not urgent either direction.

Each step is independently valuable and does not require the next, consistent with the Companion Platform's own incremental-phase discipline (`EWO1` §10, `EWO2`/`EWX1` staged rollout).

---

## DEFINITION OF DONE — CHECK

| Requirement | Met by this investigation |
|---|---|
| Read the governing architecture before starting | Architecture Bootstrap section above; all listed documents and live code read in full |
| Architecture Compliance Review against the eight principles | Gate table above — PASS |
| Grounded in the live codebase, not invented | Grounding section cites the real header comments, exports, and wiring of every module; the duplication check was re-run directly, not assumed from `EWO1` |
| Companion ownership, Personality Registry, Behaviour Engine, Observation Engine, Companion Growth, Guidance, Experience, runtime boundaries, and platform relationships defined | Governing document §2–§9 |
| Confirmed one Companion, one conversation, one Behaviour Engine, one Observation Engine, one Personality Registry | § Confirmation — One of Each, above; restated in the governing document §10 |
| Duplicated ownership or missing governance identified | § Gaps and Missing Governance (G1–G8), above |
| Platform-first, no implementation detail | Governing document contains no code, no schema DDL, no file-level implementation instructions beyond naming existing files as evidence |
| Suitable for permanent adoption | Structured identically to `PLATFORM_QUALITY_ARCHITECTURE.md` and `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` — status header, compliance gate, ownership, hard stops, rollback footer |
| Rollback identifier reported before beginning | Top of this document: `rollback/before-companion-platform-architecture-20260703` → `34605193032d75c496cb14a375c7ccb3f36366a5` |
| Project documentation requirement (STEP 9) | This file |

---

## TRUST CHECK

- Could this mislead the user? No new claims are made about the product; every "confirmed" statement in § Confirmation was checked directly against the current working tree, not inferred from `EWO1`'s earlier (still-accurate but now one workstream stale) check.
- Could this fabricate certainty? No — G1–G8 are stated as real, named gaps rather than presented as already closed; `ExperienceProfile` (G5) is explicitly called a scaffold, not a shipped feature.
- Is anything guessed but shown as real? No — every module's responsibility, reads, and writes were read from the file itself, not assumed from its name.
- No architectural duplication introduced: confirmed — no new store, no new owner of any existing fact, and the duplication check (§ Confirmation) came back negative on direct re-verification.
- No new source of truth created: confirmed — this document names existing SoTs; nothing new is created.
- No runtime behaviour altered: confirmed — governance-only work.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-companion-platform-architecture-20260703` → `34605193032d75c496cb14a375c7ccb3f36366a5`
- Files created by this investigation: `docs/investigations/intelligence/THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION.md`, `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`, and an update to `docs/architecture/README.md`'s index (adding this document to Intelligence Governance)
- Rollback commands: `git checkout rollback/before-companion-platform-architecture-20260703 -- docs/investigations/intelligence/THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION.md docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md docs/architecture/README.md` (removes/reverts only these three files; leaves all pre-existing uncommitted Companion Platform work untouched)
- Verification after rollback: `git status` shows the three files reverted/removed; no other file affected

---

## SCOPE LOCK

**Implemented scope:** Two governing documents (this investigation and `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`), plus indexing the new governing document in `docs/architecture/README.md`.

**Explicitly excluded scope:**
- No code, schema, route, or prompt change of any kind.
- No retirement of `GET /companion/growth-insight` (G2 named, not acted on).
- No `companion_observation_log` table (G6 named, not created).
- No edit to `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 11 (G7 named, not edited).
- No household-level personality change (G8 named, not built).
- No `welcome`/`encouragement`/`seasonal` interaction producers (G4 named, not built).

**Suggestions (not implemented without approval):**
- Treat § Phased Follow-Up items 1–5 as the next Companion Platform backlog, in roughly that priority order (documentation/dead-code cleanup first, schema work last).

---

*Investigation only. No implementation performed.*
*Rollback: `git checkout rollback/before-companion-platform-architecture-20260703 -- docs/investigations/intelligence/THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION.md docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md docs/architecture/README.md`.*
