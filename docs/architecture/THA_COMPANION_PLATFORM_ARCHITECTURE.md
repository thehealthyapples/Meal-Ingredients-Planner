# THA Companion Platform Architecture

**Status:** GOVERNING ARCHITECTURE — promoted from investigation `THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION.md` (workstream `EWO-CPA1`), 2026-07-03. No code, schema, runtime, or API changes.
**Classification:** Intelligence Governance (canonical — the single user-facing assistant's voice, behaviour, and observation layer)
**Governing documents:** `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3), `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md`
**Source investigation:** `docs/investigations/THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION.md`
**Direct precedent:** `docs/investigations/EWO1_COMPANION_PLATFORM_FOUNDATION.md`, `docs/implementation/EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md`, `docs/implementation/EWX1_LIVING_COMPANION_EXPERIENCE.md`

---

## 0. MANDATE

**There is one Companion. Every capability it gains — voice, behaviour, observation, growth, guidance, experience — is a new responsibility of that one platform, never a new assistant, a new conversation, or a second copy of a mechanism the platform already owns.**

This document is the governing blueprint for every current and future Companion capability. It names five responsibilities that exist today — the **Personality Registry**, the **Behaviour Engine**, the **Notice Engine** (renamed from Observation Engine under OBS1, 2026-07-08), **Companion Growth**, and **Guidance + Experience** — states exactly where each sits in the runtime, and draws the line that keeps all five presentation/voice concerns rather than a second execution plane. It does not replace the Intelligence Platform (TIP1), the Capability Registry (TIP2), or the Conversation Architecture (TIP3) — it is the layer of the Companion built *on* them, and it inherits their security, permission, and honest-gap guarantees rather than re-declaring them.

---

## 1. EXECUTIVE SUMMARY

The Companion Platform is not a second platform beside the Intelligence Platform — it is what the Intelligence Platform's one canonical assistant (TIP3's "one Companion, surfaced as contextual personas") *sounds and feels like* to the user, built as five additive layers over an unchanged spine:

| Layer | What it owns | What it explicitly does not own |
|---|---|---|
| **Personality Registry** | The closed set of six voices' content (tone fragments, phrasing templates, priorities) | Facts, routing, capability access |
| **Behaviour Engine** | Pure phrasing transforms that apply a chosen voice to already-produced output | What the output says, which suggestions are eligible, whether a gap is a gap |
| **Notice Engine** | A read-only adapter that selects and rate-limits which already-true facts get surfaced as a passive "notice" | Any new metric, threshold, or reasoning of its own |
| **Companion Growth** | One honest, minimum-sample-gated trend signal | Phrasing (that's the Behaviour Engine's job) |
| **Guidance + Experience** | Cross-domain "next step" suggestions (pre-existing `companion-guidance.ts`) and the rendering vocabulary (Companion Cards, Delight motion, Interaction taxonomy) | Business logic, new capabilities |

**The one hard invariant that makes all five safe to keep additive, restated once here as the platform's own rule rather than five independently-repeated module comments:**

> The Companion Platform may change **how** something is said, or **which already-true fact** is surfaced and **when** — it may never change **what is true, what is permitted, or what requires confirmation.**

Every module audited in the source investigation restates this in its own header; this document is what makes it one governed rule instead of four coincidentally-identical ones.

**Confirmed (§10): one Companion, one conversation, one Behaviour Engine, one Notice Engine, one Personality Registry.** No duplicated ownership was found anywhere in the platform. The gaps that do exist (§11) are documentation debt, one dead route, one worth-naming dual-presentation pattern, and honestly-scoped future extensions — never a second owner of an existing fact or mechanism.

---

## 2. THE COMPANION PLATFORM SPINE

The Companion Platform adds exactly two new seams to the Intelligence Platform's existing pipeline — a per-turn voice seam and a request-time observation seam — and reuses everything else unchanged:

```
                        ┌───────────────────────────────────────────┐
   INTELLIGENCE          │  Gateway · Capability Registry · Intent    │
   PLATFORM (TIP1–3,      │  Engine · Conversation Store · Context     │
   unchanged spine)       │  Frame — identity, routing, permission,    │
                          │  honest-gap classification (turn-fallback) │
                          └─────────────────────┬───────────────────────┘
                                                │ produces an already-resolved
                                                │ answer, gap, or guidance set
                        ┌─────────────────────▼───────────────────────┐
   COMPANION PLATFORM     │  Behaviour Engine                            │
   — per-turn voice seam  │  reads PersonalityId (user_preferences,      │
   (conversation-gateway  │  read fresh, never cached) → voices the      │
   .ts, step 10)          │  SAME answer/gap/guidance in the chosen tone │
                          └─────────────────────┬───────────────────────┘
                                                │ answer/gap/guidance is now voiced
                        ┌─────────────────────▼───────────────────────┐
   RENDERING              │  Companion Cards · Delight motion ·          │
   (Guidance + Experience)│  Interaction taxonomy — the ONE structural   │
                          │  contract every response renders through    │
                          └───────────────────────────────────────────────┘

   ── independently, outside the per-turn pipeline ──

                        ┌───────────────────────────────────────────┐
   COMPANION PLATFORM     │  Notice Engine                        │
   — request-time         │  adapts already-owned facts (health        │
   observation seam       │  trends via Companion Growth, streaks,     │
   (GET /companion/       │  plant diversity, opportunity-delivery)    │
   observations route)    │  into one Observation shape, applies       │
                          │  Silence Rules (cap 2, de-dupe, priority)  │
                          └─────────────────────┬───────────────────────┘
                                                │ voiced by the SAME Behaviour
                                                │ Engine (phraseNotice)
                                                ▼
                                    rendered in the Companion panel's
                                    empty-state banner (client hook,
                                    §5.2)
```

Two things are structural, not incidental: **the voice seam and the observation seam both terminate in the same Behaviour Engine** (there is no second phrasing mechanism for observations), and **the observation seam never touches the per-turn conversation pipeline** — it is a separate, additive read that the client fetches once when the panel opens with no history, not a step `conversation-gateway.ts` executes on every turn.

---

## 3. COMPANION OWNERSHIP MAP

| Concern | Owner (file) | Layer |
|---|---|---|
| Identity, role/tier resolution, audit | `server/lib/access.ts`, `conversation-gateway.ts` | Intelligence Platform (unchanged) |
| Capability Registry (allow-list) | `server/intelligence/capability-registry.ts` | Intelligence Platform (unchanged) |
| Intent resolution (NL → typed intent) | `intent-resolver.ts` / `pattern-intent-resolver.ts` | Intelligence Platform (unchanged) |
| Intent Engine (validate → confirm → invoke) | `intent-engine.ts` | Intelligence Platform (unchanged) |
| Conversation history (turns + references) | `conversation-store.ts` | Intelligence Platform (unchanged) |
| Context Frame (per-turn derived pointers) | `context-frame-assembler.ts` | Intelligence Platform (unchanged) |
| Honest-gap / fallback classification | `turn-fallback.ts` | Intelligence Platform (unchanged; 2 exports made public for the Behaviour Engine to reuse — no logic change) |
| **The user's chosen voice (fact)** | **`user_preferences.companionPersonality`** | Companion Platform — Personality (own-data, Profile-scoped) |
| **Voice content (the six definitions)** | **`server/intelligence/conversation/personality-registry.ts`** | Companion Platform — Personality |
| **Phrasing transforms over already-resolved output** | **`server/intelligence/conversation/behaviour-engine.ts`** | Companion Platform — Behaviour |
| **Selecting/rate-limiting which true facts to surface as a passive notice** | **`server/intelligence/conversation/notice-engine.ts`** | Companion Platform — Observation |
| **One honest trend signal (recent vs. earlier window)** | **`server/intelligence/conversation/companion-growth.ts`** | Companion Platform — Growth |
| Cross-domain "next step" guidance suggestions | `companion-guidance.ts` (pre-existing, capability-owned per INT39) | Companion Platform — Guidance |
| Companion Card structural rendering | `client/src/components/conversation/companion-card.ts` (pre-existing) | Companion Platform — Experience |
| Interaction taxonomy (closed vocabulary) | `shared/companion-interaction.ts` | Companion Platform — Experience |
| Motion/delight primitives | `client/src/lib/companion-delight.ts` | Companion Platform — Experience |
| Panel presence, personality label, observation banner | `client/src/components/conversation/FloatingAssistant.tsx` (pre-existing, additively extended) | Companion Platform — Experience |

Every Companion Platform row owns exactly one new thing, additive to an existing owner it never duplicates. No row in this table owns a fact another row also owns.

---

## 4. THE FIVE RESPONSIBILITIES

### 4.1 Personality Registry

**What it is.** The closed, code-owned reference table of six voices — `companion` (default), `friend`, `coach`, `chef`, `teacher`, `sergeant`. Each entry (`PersonalityDefinition`) carries a `BehaviourProfile` (12 numeric dimensions: warmth, encouragement, coaching intensity, humour, empathy, explanation depth, directness, celebration style, curiosity, accountability, challenge level, optimism), a `priorities` list, one `systemPromptFragment`, four `fallbackTemplates` (one per honest-gap state), a `guidanceLabelPrefix`, a `growthTemplate`, and an `ExperienceProfile` (avatar/theme/greetings/celebrations — see §4.5 on what of this is actually wired).

**What it is not.** Not a second capability registry — it cannot expand what the Companion can *do*, only how it talks about what it already does. Not a source of facts — every phrasing template supplies tone, never a claim. Not a second conversation store or LLM pipeline.

**Reads/writes.** Pure data. No I/O of any kind. `getPersonality(id)` normalises any unknown/missing id to `companion` — there is no error state, only a safe default.

**Owner of the user's choice.** `user_preferences.companionPersonality` (one additive column, `notNull`, default `'companion'`) — the existing Profile capability (C6), read fresh every turn from `conversation-gateway.ts`, never cached in the Context Frame or the conversation store, exactly mirroring how planner-week or household context is re-read every turn rather than remembered.

### 4.2 Behaviour Engine

**What it is.** The single phrasing-transform layer. Every export is a pure function from `(already-produced content, PersonalityId)` to `voiced content`: `systemPromptFragment`, `voiceFallback`, `voiceGuidanceLabel`, `prioritizeGuidance` (stable reorder of an already-eligible suggestion set — never adds, drops, or replaces a suggestion), `voiceGuidanceSuggestions`, `buildGreeting`/`buildCelebration` (deterministic, day-seeded — not random, so behaviour is reproducible and testable), `phraseGrowth`, `phraseNotice`.

**The line it does not cross, stated in its own header and restated here as governing:** *"Contains NO business logic and makes NO decisions about WHAT the Companion says — only HOW."* Concretely: it never decides whether a gap is a gap, never adds a suggestion a capability didn't already make eligible, never reorders a fact out of a Companion Card, never invents a claim.

**Where it plugs in.** Exactly three call sites inside `conversation-gateway.ts`'s existing pipeline (§5.1), plus two call sites in `server/routes.ts` (`phraseGrowth` for the growth-insight route, `phraseNotice` for the observations route) — no new pipeline step, no new service.

### 4.3 Notice Engine

**What it is.** A thin, pure adapter — stated in its own header as performing *"NO new business logic and NO reasoning of its own"* — that wraps facts four existing, unmodified owners already computed into one common `Notice` shape (`noticeNutritionTrend` over Companion Growth's signal, `noticeStreak` over `storage.getUserStreak`, `noticeDiversity` over the assembled plant-diversity count, `noticeOpportunities` over the `opportunity-delivery` capability's output), then applies exactly one shared gate: **Silence Rules** (`applySilenceRules` — de-dupe by id, rank by priority, cap at two per moment). This is the *only* place presentation order/volume for observations is decided, stated explicitly in-code.

**Notability, not invention.** `noticeStreak`/`noticeDiversity` only fire on a "notable" round multiple (every 7 for streaks, every 10 for plant diversity) — they summarise an already-true state, they never compute a new metric or claim a "just happened" moment the platform cannot actually date (see §11, G6, for the named limitation this creates honestly rather than papering over).

**Where it plugs in.** Exactly one route, `GET /api/intelligence/companion/notices` — **not** the per-turn conversation pipeline. All I/O (fetching trends, streak, diversity, opportunities) happens in the caller (`server/routes.ts`); the module itself performs zero I/O, which is what keeps it pure-function-testable and keeps its Silence Rules gate the single, un-bypassable choke point for what the user sees.

### 4.4 Companion Growth

**What it is.** One computation: `computeGrowthSignal(trends, now?)` splits `UserHealthTrend[]` rows into a recent window (last 30 days) and an earlier window (30–180 days back), computes a sample-weighted average, and returns a `GrowthSignal` — **or `null`** unless both windows have at least 5 samples (`MIN_SAMPLES_PER_WINDOW`). Stated in its own header: *"Never fabricate familiarity. Never invent achievements."* Phrasing is explicitly out of scope for this module — it is consumed exclusively by the Behaviour Engine's `phraseGrowth`.

**Read-only by construction**, stated in-file: *"No new table, no new write path."* It is the Notice Engine's sole input for the `nutrition-trend` category, and is also called directly by the (now largely superseded, see §11 G2) `growth-insight` route.

### 4.5 Guidance + Experience

**Guidance** is not new — `companion-guidance.ts` (INT38/INT39) is the pre-existing, capability-owned cross-domain "next step" suggestion registry, gated by `intelligencePlatform.canExecute`. The Companion Platform's only touch on it is cosmetic: the Behaviour Engine's `voiceGuidanceSuggestions` reorders (never adds/drops) and relabels (never retargets) an already-eligible suggestion set per the active personality's `priorities` and `guidanceLabelPrefix`.

**Experience** is the rendering vocabulary the Companion Platform presents through, some of it mature and some of it explicitly a scaffold:
- **Mature:** Companion Cards (`companion-card.ts`, governed separately by `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` — the fixed Summary → Cards → Next Steps structure, no raw markdown, no external URLs), the `InteractionKind` taxonomy (9 closed values, 6 currently wired to a real producer via `OBSERVATION_CATEGORY_INTERACTION_KIND`), and the Delight motion primitives (`companion-delight.ts` — three bounded, ≤400ms `framer-motion` variants keyed off `InteractionKind`, plus a `prefersReducedMotion()` check).
- **Scaffold, not yet rendered:** each `PersonalityDefinition`'s `ExperienceProfile` (`avatarId`, `colorTheme`, `voiceProfileId`) is populated data with **no client renderer today** — only the text fields (`greetings`, `celebrations`, via `buildGreeting`/`buildCelebration`) are wired into the Behaviour Engine, and even those are not yet called from `FloatingAssistant.tsx`'s hardcoded empty-state greeting. This document names the distinction explicitly (§11, G5) so a future reader does not mistake the data shape for a shipped visual experience.

---

## 5. RUNTIME BOUNDARIES

### 5.1 The per-turn voice seam (`conversation-gateway.ts`)

The Gateway's pipeline is unchanged in step count/order from TIP3/`EWO1`'s description. Personality is read once, alongside the existing role/tier resolution, and threaded as a plain `PersonalityId` parameter into exactly three points inside `buildGroundedResponse`:

```
1. Get/create the persistent conversation                              —
2. Get/open the active thread                                          —
   (read companionPersonality from user_preferences, once, here)       ← NEW seam, read-only
3. Resolve prior entity refs                                           —
4. Assemble the Context Frame                                          —
5. Record the user turn                                                —
6. Detect write intents → honest gap, no LLM call        voiceFallback() voices the gap
7. Resolve typed intent (IIntentResolver)                               —
8. Query via intelligencePlatform.handle()                              —
9. Classify unsuccessful turns (turn-fallback.ts)         voiceFallback() voices the fallback
10. Call ILlmProvider with grounding context              systemPromptFragment() appended
                                                            as a labelled, additive 6th
                                                            paragraph, always AFTER the 5
                                                            hard grounding/firewall rules
11. Record the assistant turn, return TurnResult                        —
                                                           voiceGuidanceSuggestions() applied
                                                            to both the success-path and the
                                                            recovery-path suggestion sets
```

**What is guaranteed by construction, not by convention:** the system prompt's grounding/firewall instructions are assembled first and are immutable; the personality fragment is concatenated strictly after and may only add tone words, never override or negate them. `voiceFallback` and `voiceGuidanceSuggestions` operate on values `turn-fallback.ts` and `companion-guidance.ts` already computed — they cannot manufacture a gap that wasn't there, suppress one that was, or make an ineligible suggestion eligible.

### 5.2 The request-time observation seam (`GET /api/intelligence/companion/notices`)

This is a **separate route, not a Gateway pipeline step.** `server/routes.ts`'s handler fetches health trends, streak, plant diversity, and opportunities in parallel (each independently best-effort — a failure in one does not fail the others), runs the four `notice*` producers, applies `applySilenceRules` (cap 2), then voices each surviving observation via the same `phraseNotice` (Behaviour Engine) used everywhere else. The client (`use-companion-observations.ts`) calls this exactly once, gated `enabled: isOpen && !hasHistory` — a fresh-panel affordance, not a per-turn event. This boundary is deliberate: observations are a passive "here's something true you might not have noticed," not part of answering a question, and keeping it out of the per-turn pipeline keeps conversation latency unaffected by trend/streak/diversity/opportunity computation on every message.

### 5.3 What never crosses either seam

- No capability invocation. Neither the Behaviour Engine nor the Notice Engine calls `intelligencePlatform.handle()` directly for anything the caller didn't already resolve — Observation's opportunity data is fetched by the *route*, then handed to the engine as plain data.
- No confirmation-tier change. A Strong-tier action (Delete, Clear, Share, Export, Order) requires the same explicit assent under every personality; Behaviour Engine functions only touch the echo-back wording (TIP2 §5's tiers are untouched).
- No new conversation state. Personality is never written into a `conversation-store.ts` turn. Observations are never written anywhere — they are computed fresh on every request.
- No second knowledge boundary. Neither engine performs retrieval — they operate exclusively on data the caller already fetched through an existing, permission-checked owner.

---

## 6. RELATIONSHIP WITH THE INTELLIGENCE PLATFORM

The Intelligence Platform (TIP1: Gateway, Knowledge Plane, Intent Engine, security model; TIP2: Capability Registry, verb taxonomy, confirmation tiers; TIP3: one canonical assistant surfaced as contextual personas, the Context Frame, Companion Cards) is the spine the Companion Platform is built *on*, not beside. Concretely:

- TIP3 already defined `Persona = (entry surface, default Context Frame, tone framing)`. `EWO1` split the third slot: `Persona = (entry surface, default Context Frame, Personality)` — entry surface and Context Frame are unchanged TIP3 mechanics (which surface, what's in scope); Personality is the sole owner of voice (word choice, warmth, directness), independent of which surface the Companion was opened from. This is the one structural amendment the Companion Platform makes to TIP3's model, and it is additive: nothing in TIP3's surface-framing logic changed.
- TIP3 Part 11 (Trust & Personality) and Risk R10 were written assuming no user-selectable voice existed, and treated tone drift as a risk to suppress. The Companion Platform is the *intentional, bounded* version of exactly that variation — safe only because the identity (one Companion, one history, one trust boundary) never varies and only tone/phrasing does, within a closed, registered set of six. This reconciliation is stated once, here, as the canonical answer; `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 11 itself has not yet been edited to fold it in (named as an open item, §11 G7) — this document is authoritative in the meantime.
- TIP1's security model (identity boundary, knowledge boundary, capability boundary, prompt-injection resistance) is inherited automatically: the Companion Platform introduces no new data path, so it has nothing new to secure — every read the Behaviour/Observation/Growth modules perform goes through an owner (`storage.*`, `intelligencePlatform.handle()`) that already enforces TIP1's boundaries.

**The Companion Platform is TIP3's one canonical assistant, given a voice and a passive noticing capability — not a fourth platform.**

---

## 7. RELATIONSHIP WITH THE CAPABILITY REGISTRY

**The Companion Platform registers zero new capabilities.** Personality, Behaviour, and Growth touch no capability at all — they operate purely on already-produced conversational output. The Notice Engine reads exactly one existing capability's output (`opportunity-delivery`, via `intelligencePlatform.handle()`), performed by the *caller* (`server/routes.ts`), never by the engine itself — the engine never holds a reference to the Capability Registry.

**The one fact worth naming precisely, once, here:** `notice-engine.ts`'s `noticeOpportunities` (surfaced through `GET /api/intelligence/companion/notices`, inside the Companion panel) and the separate `FI5` workstream's page-embedded `FoodOpportunitiesPanel.tsx` (surfaced through `GET /api/intelligence/food-opportunities`, on Dashboard/Planner/Cookbook/Pantry) both read the **same** `opportunity-delivery` capability's `report` verb. This is two independent, differently-scoped **presentation channels** over one capability's output — the Companion's silence-ruled, single-observation, personality-voiced notice versus a page's persistent, multi-item, accept/dismiss panel — not two reasoning engines and not duplicated ownership of the underlying opportunity fact, which the capability still owns exactly once. A future engineer must not "resolve" this apparent overlap by deleting either channel without recognising both are legitimate.

Any future Companion capability that needs to *do* something new (not just voice or notice something an existing capability already produced) must register through the Capability Registry like any other capability, with the same permission and confirmation-tier declarations TIP2 requires of every entry. **Personality is never a side channel around the Capability Registry.**

---

## 8. RELATIONSHIP WITH PLATFORM QUALITY

`PLATFORM_QUALITY_ARCHITECTURE.md` §9 already characterised "the Companion Platform (personality, behaviour engine, observation engine)" as "architecturally a pure presentation/phrasing layer over the Conversation Gateway's already-resolved answers — it introduces no new data owner and no new capability." This document confirms that characterisation in full detail and extends it to the two modules PQA's §9 did not yet name (Companion Growth, Guidance + Experience):

- **Security & Privacy:** inherited automatically — the Companion Platform adds no new data path, so it has nothing to secure that its upstream owner (`storage.*`, the Gateway, the Capability Registry) does not already secure.
- **Trust:** the Companion Platform's own hard invariant (§0) *is* the Trust domain applied to voice and to companion-generated commentary — `companion-growth.ts`'s minimum-sample-size rule and `notice-engine.ts`'s notability-not-invention rule are the same non-fabrication discipline PQA names as THA's most mature quality dimension, applied one layer higher (to noticing, not just answering).
- **Accessibility:** the Companion Card Experience Principle is PQA's one mature Accessibility enforcement point today; the Companion Platform renders every voiced answer, gap, and observation through it — Behaviour Engine output is text substituted into an existing card/summary structure, never a new rendering surface with its own accessibility posture to get right or wrong.
- **Observability:** unsuccessful turns are classified by the unchanged four-state `turn-fallback.ts` taxonomy regardless of voice; Behaviour Engine changes wording, never which of the four states fired — so PQA's Observability mechanism (and its named gap: an in-memory, non-durable log, PQA §11.3) applies identically underneath every personality.
- **Performance:** Personality adds one additional per-turn read (`storage.getUserPreferences`, already read for other settings) — no new latency-sensitive computation. Observation/Growth run only on the separate, infrequent panel-open request, never per-turn.

No new Quality gap is introduced by the Companion Platform beyond the ones PQA already names platform-wide (§11 of that document); no Companion-specific quality mechanism is required.

---

## 9. RELATIONSHIP WITH PLATFORM KNOWLEDGE (COMPLETION)

**The Companion Platform is not a knowledge domain and does not participate in the graduation pipeline `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` governs.** That document's shape (identity → core → optional → runtime enrichment, evidence-backed graduation, one owner per knowledge entity) applies to knowledge stores THA authors and matures over time — food knowledge, nutrition benefits, pantry knowledge, and the like.

The Companion Platform's modules do the opposite: they consume already-graduated facts at request time and produce nothing durable of their own.
- Personality content is closed, versionless reference data (six entries, will not grow without a registry review, per `EWO1`'s own governance note) — the same class of artefact as `capability-registry.ts`, not a knowledge entity subject to enrichment.
- Companion Growth and the Notice Engine read already-owned transactional/derived data (`UserHealthTrend`, `UserStreak`, plant-diversity counts, opportunity outputs) and compute a request-scoped value that is never persisted — there is nothing here for a graduation pipeline to operate on, because nothing is stored.

If a future Companion capability *did* need to own a durable knowledge store (for example, the deferred `companion_observation_log`, §11 G6), that store — not the Companion Platform's presentation modules — would be the thing evaluated against `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`'s graduation shape at the point it is proposed, exactly like any other new knowledge store in THA.

---

## 10. ONE OF EACH — CONFIRMED

| Claim | Verified by | Result |
|---|---|---|
| **One Companion** | Grep for a second system-prompt assembly point or a second conversational identity anywhere in the codebase | Confirmed. One assembly point (`conversation-gateway.ts`'s `buildGroundedResponse`). Other LLM calls in the codebase (recipe extraction, ingredient extraction, meal-adaptation, OCR, UPF classification) are feature-local, non-conversational, and never touch `personality-registry.ts`/`behaviour-engine.ts` — not a second Companion. Internally named `companion-*` throughout; displayed to the user as "Apple" — one identity, one internal name, one display name. |
| **One conversation** | Confirm `conversation-store.ts` remains the only turn/thread store; confirm no new module writes conversation state | Confirmed. Personality is read fresh per turn, never written into a turn. Observation/Growth write nothing at all. |
| **One Behaviour Engine** | `grep -r "class.*Engine\|export.*Engine" server/intelligence` | Confirmed. Exactly one `behaviour-engine.ts`, a plain module (not a class), no second file anywhere in the tree. |
| **One Notice Engine** | Same method | Confirmed. Exactly one `notice-engine.ts`. Pre-existing domain "discovery engines" (`MealDiscoveryEngine` et al.) are unrelated, older, capability-side machinery — different responsibility, no overlap. |
| **One Personality Registry** | Confirm no second closed voice-enum or content table exists | Confirmed. `shared/companion-personality.ts` declares the enum once; `personality-registry.ts` is the only file that attaches content to it. |

**No duplicated ownership exists anywhere in the Companion Platform.** This was re-verified directly for this document (not assumed from `EWO1`'s earlier, now one-workstream-stale check) after two further implementation workstreams (`EWO2`, `EWX1`) landed on top of `EWO1`'s original scope.

---

## 11. GAPS AND MISSING GOVERNANCE

No duplicated ownership was found (§10). The following are the real, named gaps — documentation debt this document substantially closes, one dead route, one worth-naming dual-presentation pattern, and honestly-scoped future extensions already flagged by the workstreams that built them:

- **G1 — Closed by this document.** Four live modules (`personality-registry.ts`, `behaviour-engine.ts`, `notice-engine.ts`, `companion-growth.ts`) had no single governing document naming them as one platform until now, despite `PLATFORM_QUALITY_ARCHITECTURE.md` §9 already referring to "the Companion Platform" as if one existed.
- **G2 — An orphaned route.** `GET /api/intelligence/companion/growth-insight` remains registered and functional but is called by no client code — superseded by `GET /companion/notices`. Not duplicate ownership (it re-derives the same signal from the same source, computing nothing independently), but dead client-facing surface that should be retired deliberately.
- **G3 — Two presentation channels over `opportunity-delivery`, by design.** See §7. Named once, here, so it is never "resolved" by accident.
- **G4 — Incomplete `InteractionKind` vocabulary.** 9 declared values, 6 wired to a real producer (`welcome`, `encouragement`, `seasonal` are placeholders for future use, honestly unwired rather than fabricated).
- **G5 — `ExperienceProfile` is a data scaffold, not a rendered experience.** `avatarId`, `colorTheme`, `voiceProfileId` exist in every personality's data but have no client renderer; only greeting/celebration text is wired, and not yet into the client's hardcoded empty-state line. See §4.5.
- **G6 — No cross-session memory for Silence Rules.** `applySilenceRules` operates within a single request only; there is no persisted log of what was already shown, so a notable observation can repeat across sessions, and milestones can only be phrased as present-state facts, never genuinely-dated "just crossed" claims. A small, additive `companion_observation_log` table is the named (not built) fix — its own future Rule 8 governance review, not authorised here.
- **G7 — `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 11 is stale.** It still reads as if the Companion has one fixed tone; the reconciliation with Personality exists in `EWO1` §0.4 and is restated in §6 above, but Part 11's own text has not been edited to fold it in. This document is authoritative on the point in the meantime.
- **G8 — No household-level personality.** A plausible, straightforward future extension of the existing `user_preferences`-owned fact (per-eater-vs-household-default precedent already exists via `household_eaters`), not built.

---

## 12. NON-NEGOTIABLES

Hard stops, in the same spirit as `ENGINEERING_WORKFLOW.md` STEP 7 and `PLATFORM_QUALITY_ARCHITECTURE.md` §10:

- Any Companion Platform module that invokes a capability directly, rather than voicing or noticing output an existing owner already produced — stop. That is a second execution path, not a presentation layer.
- Any personality, behaviour, or observation change that alters what is claimed, what is permitted, or what requires confirmation (not just how it is phrased, or which already-true fact is surfaced) — stop.
- Any new Behaviour Engine, Notice Engine, or Personality Registry created anywhere else in the codebase, rather than extended in place — stop. There is exactly one of each (§10); a second one is a duplication, not a variant.
- Any Companion voice content (phrasing, priorities, templates) that asserts a fact not already produced by an existing, sourced owner — stop. Voice content is tone-only, reviewed as such.
- Any observation or growth signal presented as more certain, more recent, or more precisely dated than the underlying data supports — stop. `companion-growth.ts`'s minimum-sample-size gate and `notice-engine.ts`'s notability-not-invention rule are the enforcement mechanism; do not weaken them to make an observation feel more alive.
- Any Companion-adjacent feature that renders outside the Companion Card structural contract, or bypasses `turn-fallback.ts`'s four-state classification, or reaches a capability the caller's role does not already permit — stop (inherited directly from TIP1/TIP3/PQA; the Companion Platform does not get an exemption from platform-wide rules by virtue of being closer to the user).

---

## 13. OPEN ITEMS DEFERRED TO IMPLEMENTATION

This document is architecture, not implementation (Rule 8 applies — governance review before any new schema or mechanism). It authorises no code change. Named so none of them are lost:

1. **Retire `GET /companion/growth-insight`** (G2) once confirmed unused by any client — pure deletion or a deprecation note.
2. **`companion_observation_log` table** (G6) — one additive table (`user_id`, `category`, `shown_at`) for cross-session Silence Rules and genuinely-dated milestone claims. Requires its own Rule 8 review.
3. **Edit `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 11** (G7) to fold in the `EWO1` §0.4 / this document §6 reconciliation. Pure documentation change.
4. **Household-level personality default/override** (G8), following the `household_eaters` precedent.
5. **Wire or retire `welcome`/`encouragement`/`seasonal` `InteractionKind`s** (G4) — a scoping decision, not urgent either direction.
6. **A server-owned weekly plant-diversity counter**, so `noticeDiversity` can produce a genuinely weekly observation instead of an all-time count (named by `EWX1`, not built).

Each of these is a governed workstream in its own right — none is authorised by this document.

---

*Required reading before implementing any new Companion capability, any change to voice/behaviour/observation, or any new conversational surface in THA.*
*Source investigation: `docs/investigations/THA_COMPANION_PLATFORM_ARCHITECTURE_INVESTIGATION.md`.*
*Rollback: this document only — `git checkout HEAD -- docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (or delete the file to revert). No code was changed to produce it.*
