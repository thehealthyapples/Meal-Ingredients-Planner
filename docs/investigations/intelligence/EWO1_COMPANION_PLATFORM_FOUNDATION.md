# EWO1 — Companion Platform Foundation Investigation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Risk:** 🟡 AMBER
**Reason:** Investigation only — no code, schema, or route changes. Rated AMBER (not GREEN) because its recommendation, once implemented, touches the shared conversation/prompt pipeline every user passes through (`conversation-gateway.ts`), so a careless implementation of a future workstream could raise the risk band even though this document does not.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-ewo1-companion-platform-foundation-20260703` → `9d6cc99c59afd8720eb5ea12db0b0f4e6c0e4317` |
| Working tree | Intentionally dirty — pre-existing uncommitted work from a prior session (FI5 UI activation + EL2 investigation: `client/src/components/FoodOpportunitiesPanel.tsx`, `client/src/components/intelligence/FoodOpportunityCard.tsx`, `client/src/hooks/use-food-opportunities.ts`, modified `dashboard.tsx`/`meals-page.tsx`/`pantry-page.tsx`/`weekly-planner-page.tsx`/`capability-registry.ts`/`routes.ts`, and the two new docs). None of these files are touched by this investigation. |
| This task's writes | This file only: `docs/investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md` |
| Rollback to committed state | `git checkout rollback/before-ewo1-companion-platform-foundation-20260703` |

**This is an investigation only.** No application code, database schema, services, routes, or prompts were modified. The single output is this document.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — architecture bootstrap
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — the eight governing principles
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — domain ownership (Profile / `user_preferences` rows checked directly)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — compliance checklists, STEP 1–9
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1 — the platform)
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2 — the registry)
- [x] `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3 — the experience; **Part 1 personas, Part 11 Trust & Personality, Risk R10 are the direct precedent for this investigation**)
- [x] `docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md` — discovery/presentation ownership boundary
- [x] `docs/architecture/THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` — names "Companion Cards" as the canonical response vocabulary (directly relevant to naming, see §0.2)
- [x] Live code: `server/intelligence/` (README, `intelligence-platform.ts`, `capability-registry.ts`, `intent-engine.ts`, `intent-resolver.ts`, `pattern-intent-resolver.ts`, `permissions.ts`, `types.ts`), `server/intelligence/conversation/*` (`conversation-gateway.ts`, `conversation-store.ts`, `context-frame-assembler.ts`, `companion-guidance.ts`, `companion-actions.ts`, `companion-action-store.ts`, `turn-fallback.ts`, `llm-provider.ts`), `client/src/components/conversation/*` (`FloatingAssistant.tsx`, `companion-card.ts`, `companion-action.ts`), `server/routes.ts` (`/api/user/intelligence-settings`)

---

## 0. GROUNDING — WHAT THIS INVESTIGATION FOUND BEFORE DESIGNING ANYTHING

This is not a greenfield request. Two things must be established before any design, because they change the shape of the answer.

### 0.1 The Companion Platform already exists — this is not a build-from-zero

TIP1–TIP3 (`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `..._CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `..._AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`) are not aspirational documents here — they describe a spine that is **implemented and live** under workstreams INT1–INT39:

| TIP concept | Governing doc | Live implementation |
|---|---|---|
| Gateway / Capability Registry | TIP1 §2, TIP2 §2 | `server/intelligence/capability-registry.ts` (13 capabilities, C1–C13), `server/intelligence/intelligence-platform.ts` (canonical singleton) |
| Intent Engine | TIP1 §5 | `server/intelligence/intent-engine.ts` (locate → validate → permission → confirm → invoke → respond) |
| Intent resolution (NL → typed intent) | TIP2 §3 | `server/intelligence/intent-resolver.ts` + `pattern-intent-resolver.ts` (INT24 Canonical Intent Engine) |
| One conversation, references not business data | TIP3 Part 3 | `server/intelligence/conversation/conversation-store.ts` (`DatabaseConversationStore`) |
| Context Frame, derived per turn | TIP3 Part 4 | `server/intelligence/conversation/context-frame-assembler.ts` |
| One canonical assistant, contextual personas by surface | TIP3 Part 1 | `server/intelligence/conversation/conversation-gateway.ts` (single wiring point) + `client/src/components/conversation/FloatingAssistant.tsx` (`PersonaLabel` = "surface-aware contextual framing badge") |
| Companion Cards (response vocabulary) | `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` | `client/src/components/conversation/companion-card.ts` |
| Cross-domain "Next Step" guidance | — | `server/intelligence/conversation/companion-guidance.ts` (INT38/INT39, capability-owned guidance registry) |
| Honest gap / no-route / no-knowledge / no-results classification | TIP1 Principle 6 | `server/intelligence/conversation/turn-fallback.ts` |

The product is **already named "Companion" throughout the codebase** — not "Apple" (TIP3's provisional name), not a new brand. The file names alone confirm it: `companion-card.ts`, `companion-action.ts`, `companion-actions.ts`, `companion-guidance.ts`, `companion-guidance-analytics.ts`, `companion-feedback-store.ts`, `companion-gap-classifier.ts`, `companion-learning-store.ts`, `companion-learning-recommender.ts`, `companion-delegation-analytics.ts`, `companion-goal-analytics.ts`, `companion-observability.ts`, `companion-enrichment.ts`. The README for `server/intelligence/` and the doc-comment headers of every one of those files describe "the Companion" as the singular, already-existing user-facing assistant.

**This changes the mandate of EWO1.** The brief asks to "introduce a canonical Companion Platform" and to confirm it "integrates with the AI Capability Registry" and "the Intent Engine." Both integrations are not proposals — they are the existing, shipped architecture. Re-designing them here would violate Principle 8 (evolution over replacement) by proposing a second spine beside the one that already exists. **The only genuinely new thing EWO1 asks for is personality** — Companion / Friend / Coach / Chef / Teacher / Sergeant — layered on top of the one Companion that is already built. That is the actual scope of this investigation, and it is scoped tightly on purpose.

### 0.2 Naming: "Companion Platform" and "Companion Cards" are the same family, not a collision

`THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md` names **Companion Cards** as "the canonical Intelligence Experience pattern" — the reusable card vocabulary the Companion uses to present what it discovers. At first read this looks like a naming collision with "Companion Platform." It is not: Companion Cards are how the Companion (the one assistant) renders discovery output. "The Companion presents its findings as Companion Cards" is a coherent sentence, not an overlap. This investigation adopts **"the Companion"** as the name for the one assistant (matching the existing code, not TIP3's provisional "Apple"), and treats Companion Cards as one of its existing rendering primitives. No renaming of either is proposed.

### 0.3 What "personality" must NOT be confused with — the existing "contextual persona"

TIP3 Part 1 already defines a `Persona = (entry surface, default Context Frame, tone framing)` 3-tuple — implemented today as `PersonaLabel` in `FloatingAssistant.tsx`, a badge that reflects *which surface* the Companion was opened from (Planner / Shopping / Nutrition / Household / …). That axis is **presentational context, not voice** — it changes the default Context Frame and a label, not how the Companion talks.

EWO1's "personalities" (Companion, Friend, Coach, Chef, Teacher, Sergeant) are a **different, orthogonal axis**: a user-selected **voice/tone** that applies *regardless of which surface the Companion was opened from*. Conflating the two would mean the existing surface persona and the new personality fight over the same "tone framing" slot. §3 below resolves this by making Personality the sole owner of voice/tone, and demoting the surface persona to context-framing + label only (which is in fact closer to how `PersonaLabel` already behaves — it does not currently change wording, only the badge).

### 0.4 The direct precedent this investigation must reconcile with

TIP3 Part 11 (Trust & Personality) and Risk R10 were written **assuming no user-selectable personality feature existed**, and they treat "persona tone drift" as a *risk to suppress*: "One personality spec (Part 11) across all personas; framing varies, identity/voice does not." EWO1 asks THA to deliberately build the thing R10 was written to prevent by accident: **intentional, user-chosen, bounded voice variation.**

This is not a contradiction if — and only if — the variation is constrained exactly the way R10's mitigation implies: **the identity (one Companion, one history, one set of trust guarantees) never varies; only tone/phrasing does, and only within a closed, registered set.** §3–§5 make this the hard architectural line. Framed this way, EWO1 is TIP3 Part 11 maturing from "one fixed tone" to "one trust-invariant machine, several registered voices" — an additive evolution of Part 11, not a reversal of R10.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity
  Entities touched: none new. "Personality" is not an entity — it is a closed,
  enumerated selector (6 values) plus one new preference column. The Companion
  itself keeps its single existing identity (one conversation store, one
  Gateway, one Capability Registry). PASS.

□ One owner per fact
  The user's selected personality is a fact about the user's preferences —
  owned by `user_preferences` (existing table, already the SoT for display/
  behavioural preferences per the SoT Register, distinct from the contested
  `users.dietPattern`/`dietRestrictions` columns). The personality *content*
  (voice descriptors, phrasing rules) is reference data (see Principle 5 below)
  owned by one new static registry file, read-only at runtime. No fact gets a
  second store. PASS.

□ No duplicate entities
  No new entity is created. A `PersonalityId` enum and a personality-content
  registry are configuration, the same class of artefact as
  `capability-registry.ts` (an enumerated, code-owned registry of existing
  things) — not a new business entity. PASS.

□ No duplicate ownership
  Personality never touches planner/shopping/meals/nutrition/household
  ownership. It touches exactly one existing owner (`user_preferences`) with
  one new additive column. PASS.

□ No duplicate state
  The selected personality is read fresh from `user_preferences` at the top
  of `conversation-gateway.ts` (the same place role/tier are already resolved
  from `access.ts`), exactly like every other per-turn context value. It is
  NOT written into `conversation-store.ts` turns, NOT cached in the Context
  Frame beyond the turn, and NOT duplicated into a second preferences store.
  This mirrors the Context Frame's own non-duplication rule (TIP3 Part 4.4).
  PASS.

□ Extends existing architecture
  Extends: `user_preferences` (Profile capability, C6), the existing
  `/api/user/intelligence-settings` PATCH pattern (add one field to the
  existing allow-list — no new endpoint), `conversation-gateway.ts`'s existing
  system-prompt assembly step, `turn-fallback.ts`'s existing message-building
  functions, and `companion-guidance.ts`'s existing suggestion-label builder.
  No new service, no new route group, no new store. PASS.

□ Progressive enrichment where appropriate
  Personality is user preference state (transactional, single-owner), not a
  knowledge entity — so the identity→core→optional→runtime enrichment ladder
  (Principle 3) does not apply. Only "one owner, no duplicate state" applies,
  and it is satisfied above. PASS.

□ Honest gaps over fabricated information
  Personality changes voice, never facts. Every existing honest-gap surface
  (turn-fallback's no-route/no-knowledge/no-results/internal-error states,
  the nutrition EFSA firewall, TIP2's Order/Export gaps) fires exactly as
  before under every personality — a gap is rephrased in the selected voice,
  never suppressed, softened into a fabricated answer, or upgraded into false
  confidence by "Sergeant" bluntness or "Chef" enthusiasm. This is the single
  hardest constraint in this document and is restated as a hard invariant in
  §5. PASS (conditional on that invariant holding — carried into Risks).

□ No permanent synchronisation bridge
  No bridge is created. The personality registry is static code (like
  `capability-registry.ts`), not a second copy of anything kept in sync with
  a database. PASS.

□ Evolution over replacement
  Nothing is replaced. TIP3 Part 1's contextual persona (surface framing) and
  Part 11's personality spec are extended, not superseded — §0.4 states
  precisely how. PASS.
```

**Gate result: PASS.** Design continues below.

---

## AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

✓ Uses the canonical Intelligence Platform
  All personality output still flows through intelligencePlatform.handle() /
  the existing capability bindings. Personality touches prompt assembly and
  fixed-copy phrasing only — never the platform's routing.

✓ Uses the Capability Registry
  No new capability. No new (verb × capability) pair. Personality is
  orthogonal to what is done; it only affects how the result is voiced.

✓ Uses the Intent Engine
  All state-changing intents still go through intent-resolver.ts →
  intent-engine.ts → the one owning service, with the same confirmation
  tiers (TIP2 §5) regardless of personality. "Sergeant" does not get a
  lower confirmation bar for Delete; "Friend" does not get a higher one.

✓ Reuses existing business services
  Zero new services. Personality reads one existing table
  (user_preferences) and writes zero business data.

✓ Does not create another assistant
  This is the central gate (TIP3 Risk R2). Personality is a voice selector
  over the one Companion — one conversation history, one Gateway, one
  Context Frame — never a second runtime. See §3.

✓ Does not duplicate conversation state
  Personality is not written into conversation-store.ts turns. It is read
  fresh per turn from user_preferences, the same non-duplication pattern the
  Context Frame already uses (TIP3 Risk R1).

✓ Uses registered capabilities only
  Personality cannot expand what the Companion can do — it has no access to
  the Capability Registry's allow-list and cannot unlock a capability, verb,
  or knowledge class. A "Sergeant" personality cannot see anything a
  "Companion" (default) personality cannot.

✓ Uses permission-aware access
  Personality is a user-level preference (own-data, via the existing Profile
  capability C6 permission model) — no elevation, no new role.

✓ Produces honest gaps rather than fabricated knowledge
  See the hard invariant in §5: personality changes voice, never truth value.
  A gap stays a gap in every personality.
```

**Gate result: PASS.**

---

## 1. EXECUTIVE SUMMARY

The Companion Platform — the Gateway, Capability Registry, Intent Engine, Conversation Store, Context Frame, and Companion Card renderer — already exists and is live (INT1–INT39). EWO1's actual, scoped deliverable is the one capability that does not yet exist: **a Personality layer** that lets the Companion express six distinct voices (Companion, Friend, Coach, Chef, Teacher, Sergeant) while sharing exactly one intelligence, one conversation, one trust boundary, and one capability set.

**Four commitments define the design:**

1. **Personality is a voice, not an agent.** It is a 3rd, orthogonal axis alongside TIP3's existing `(entry surface, Context Frame)` pair — `Persona = (entry surface, Context Frame, Personality)`. Changing personality never changes what the Companion knows, can do, or has said. It is implemented as a phrasing/tone layer over the *existing* prompt-assembly and fixed-copy surfaces in `conversation-gateway.ts`, `turn-fallback.ts`, and `companion-guidance.ts` — not a new pipeline.

2. **Personality is owned exactly once, by the existing Profile capability.** The user's chosen personality is one additive column on `user_preferences` (C6, already the SoT for behavioural preferences), read fresh each turn — never cached in the conversation store, never a second preferences table. The six personalities' voice *content* (system-prompt fragments, phrasing templates) is a small, closed, code-owned registry — the same class of artefact as `capability-registry.ts`, not a database knowledge store (Governance Rule 6: it will never grow beyond 6 entries and needs no post-launch enrichment).

3. **Trust invariants hold across every personality, without exception.** Honest gaps, the EFSA wording firewall, confirmation tiers, capability access, and the Companion Card firewall (no raw markdown, no external URLs, no fabricated fields) are identical under Sergeant, Chef, and every other voice. Only wording changes; never what is true, never what requires confirmation, never what the Companion is allowed to touch.

4. **This reconciles — and matures — TIP3 Part 11 / Risk R10**, which suppressed *accidental* tone drift across surfaces. EWO1 asks for *intentional*, bounded, user-chosen tone variation. The reconciliation is precise: R10's protected identity (one Companion, one history, one trust boundary) still never varies; only the previously-implicit "one tone" becomes an explicit, closed set of six registered tones.

**Recommendation:** Adopt Personality as an additive presentation-layer capability over the existing Companion Platform. No new platform, no new registry class, no new conversation mechanism. Implementation is estimated at a fraction of the size of TIP1–TIP3 because the spine already exists — see the roadmap in §7.

---

## 2. COMPANION CAPABILITY OWNERSHIP

| Concern | Owner | Already exists? |
|---|---|---|
| Gateway, role/tier resolution, audit | `server/lib/access.ts`, `conversation-gateway.ts` | Yes |
| Capability Registry (allow-list) | `server/intelligence/capability-registry.ts` | Yes |
| Intent resolution (NL → typed intent) | `intent-resolver.ts` / `pattern-intent-resolver.ts` | Yes |
| Intent Engine (validate → confirm → invoke) | `intent-engine.ts` | Yes |
| Conversation history (turns + references) | `conversation-store.ts` | Yes |
| Context Frame (per-turn derived pointers) | `context-frame-assembler.ts` | Yes |
| Companion Card rendering | `client/src/components/conversation/companion-card.ts` | Yes |
| Cross-domain guidance suggestions | `companion-guidance.ts` (capability-owned per INT39) | Yes |
| Honest-gap / fallback classification | `turn-fallback.ts` | Yes |
| **Personality selection (the user's fact)** | **`user_preferences` (new additive column)** | **No — this investigation's scope** |
| **Personality content (voice registry)** | **New static registry, `server/intelligence/conversation/personality-registry.ts`** | **No — this investigation's scope** |

Personality owns **nothing** that any existing owner already owns. It adds exactly one preference fact (own-data, Profile-scoped) and one small, closed, code-owned reference table (voice descriptors) — both new, both named here, and both satisfy Governance Rules 1–8 as shown in the compliance checklist above.

---

## 3. PERSONALITY ARCHITECTURE

### 3.1 The extended persona model

TIP3 Part 1 defined:

```
Persona = ( entry surface , default Context Frame , tone framing )
```

This investigation splits the third slot, because "tone framing" was doing two jobs at once — surface-appropriate framing ("organising, forward-looking" for Planner) and voice/personality. It becomes:

```
Persona = ( entry surface , default Context Frame , Personality )
```

- **Entry surface** and **default Context Frame** are unchanged (TIP3 Part 1/2 — Planner/Shopping/Nutrition/Household/Floating).
- **Personality** replaces "tone framing" as the sole owner of *voice*: word choice, warmth, directness, structure of encouragement. It is user-selected, persists across every surface, and is independent of which surface the Companion was opened from. Opening the Nutrition persona while "Chef" is selected still sounds like Chef; it does not silently sound "educational, calm" because TIP3 previously tied tone to surface.
- Surface-driven framing becomes strictly about *what's in the Context Frame and how results are organised* (e.g. Planner surfaces planner-shaped suggestions first) — never about vocabulary or warmth. This is a tightening, not a removal: the existing `PersonaLabel` badge and surface-scoped default suggestions are untouched.

### 3.2 The six personalities

Each is a **voice specification**, not a capability bundle and not a different assistant. All six read the exact same Capability Registry, the same Intent Engine, the same Context Frame, the same conversation history.

| Personality | Voice character | Where it shows up |
|---|---|---|
| **Companion** (default) | Calm, warm, balanced — the existing TIP3 Part 11 spec verbatim | System prompt tone, gap phrasing, guidance labels |
| **Friend** | Casual, encouraging, informal — talks *with* you, not *at* you | Same surfaces, warmer/less formal phrasing |
| **Coach** | Motivating, structured, goal-oriented — frames suggestions as progress | Same surfaces, more "next step" framing (still capped by `companion-guidance.ts` MAX_SUGGESTIONS) |
| **Chef** | Enthusiastic about food, sensory, kitchen-minded | Strongest on Nutrition/Meals/Planner surfaces; identical trust rules |
| **Teacher** | Explanatory, patient, "here's why" — leans into the existing "teach the why" TIP3 §12.3 philosophy | Strongest on Nutrition explain/read answers |
| **Sergeant** | Brisk, direct, no-nonsense — short sentences, minimal hedging *in wording only* | Same confirmation tiers as every other personality — brisk wording is never a substitute for a required confirmation |

None of the six adds a capability, changes a confirmation tier, changes what counts as a gap, or changes access. §5 makes this an enforced invariant, not a style guideline.

### 3.3 Where Personality is NOT allowed to reach (explicit non-goals)

- It does not create a `PersonalityEngine`, a second LLM call pipeline, or a second conversation store.
- It does not change `intent-resolver.ts`'s resolution logic — "Sergeant" and "Friend" resolve "add milk" to the exact same `Add × Shopping` intent.
- It does not touch the Companion Card firewall (`companion-card.ts` sanitisation, no markdown, no external URLs) — cards render identically in every voice; only the summary sentence's wording changes, and it still passes through the same sanitiser.
- It does not touch `companion-guidance.ts`'s guidance-eligibility logic (`intelligencePlatform.canExecute` gating) — only the label copy of an already-eligible suggestion.

---

## 4. BEHAVIOUR ARCHITECTURE

### 4.1 Where personality plugs into the existing pipeline

`conversation-gateway.ts`'s documented pipeline (see file header, reproduced in §0.1) already has exactly the right seams. Personality adds one read and three phrasing hooks — no new steps:

```
Existing gateway pipeline (unchanged)              Personality's touch point
──────────────────────────────────────             ──────────────────────────
1. Get/create conversation                          —
2. Get/open active thread                           —
3. Resolve prior entity refs                        —
4. Assemble ContextFrame                             —
5. Record user turn                                  —
6. Detect write intent → honest gap                  gap TEXT voiced per personality (turn-fallback.ts)
7. Resolve typed intent (IIntentResolver)             —
8. Query via intelligencePlatform.handle()            —
9. Classify unsuccessful turn (turn-fallback.ts)      fallback TEXT voiced per personality
10. Call ILlmProvider w/ grounding context            system-prompt TONE FRAGMENT voiced per personality
11. Record assistant turn, return TurnResult          —

                                                     + companion-guidance.ts label copy
                                                       voiced per personality
```

Personality is read **once, at step 0** (alongside the existing role/tier resolution from `access.ts`) from `user_preferences`, and threaded through as a plain `PersonalityId` parameter into: (a) the system-prompt assembly at step 10, (b) `turn-fallback.ts`'s message-building functions at steps 6/9, and (c) `companion-guidance.ts`'s label builder. None of these three functions currently branch on anything more than fixed English strings — adding a `personality` parameter that selects a phrasing template is a pure, additive, non-branching change to each.

### 4.2 What changes vs. what is invariant, function by function

| Function | What Personality changes | What stays identical |
|---|---|---|
| System prompt (step 10) | One tone-fragment paragraph swapped in (from the personality registry) | The EFSA/health-claim firewall instruction, the "answer only from provided context" instruction, the grounding data itself |
| `turn-fallback.ts` gap/fallback text | Sentence wording ("I don't have documented guidance on that yet" → Sergeant: "No documented answer for that.") | Which of the four states (no-route/no-knowledge/no-results/internal-error) fired, and that a gap is reported at all |
| `companion-guidance.ts` suggestion labels | Copy tone ("You might also want to…" → Coach: "Next step:") | `MAX_SUGGESTIONS` cap, `canExecute` eligibility gating, the target capability/verb |
| Companion Card summary line | Sentence wording only, still passed through `sanitizeSummary` | Card facts (title, image, servings, Apple Score, last cooked), action targets, the markdown/URL firewall |
| Confirmation copy (TIP2 §5 tiers) | Wording of the echo-back | The tier itself (Light/Required/Strong) and the requirement that a Strong tier always confirms explicitly |

---

## 5. THE HARD INVARIANT (non-negotiable, carried from TIP3 Part 11 / R10 and Principle 6)

> **Personality changes how the Companion says something. It never changes what is true, what is allowed, or what requires confirmation.**

Concretely, for every personality:

1. A gap stays a gap — Sergeant's brevity must never be achieved by dropping the honest-gap disclosure.
2. A Strong-confirmation action (Delete, Clear, Share, Export, Order, all Admin writes) requires the same explicit assent — Friend's casualness must never soften "Okay?" into an implied yes, and Sergeant's brusqueness must never skip the confirmation step to sound decisive.
3. Nutrition/health claims stay inside the EFSA-firewalled, source-gated registry — Chef's enthusiasm must never upgrade "emerging" evidence into "established," and Coach's motivational framing must never turn a sourced fact into unsourced encouragement.
4. No personality unlocks a capability, knowledge class, or verb another personality cannot reach.
5. No personality is allowed to author new phrasing for a *fact* — only for the *delivery* of a fact or gap the platform already produced. The personality registry supplies tone fragments and template phrasing, never a source of new claims.

This is the direct, load-bearing answer to TIP3 Risk R10 and Core Principle 6 for this feature. Any future implementation that lets a personality's system-prompt fragment override or bypass the base grounding/firewall instructions — rather than sit alongside them — fails this gate and must stop.

---

## 6. CONTEXT MODEL

Personality participates in the Context Frame's discipline (TIP3 Part 4) without becoming part of the Context Frame itself, because it is not a pointer into a business entity — it is a user preference, already owned by Profile (C6):

```
Per-turn assembly (conversation-gateway.ts step 0, alongside role/tier resolution)
 ├─ identity              ← session / access.ts                    (existing)
 ├─ role / tier           ← access.ts                               (existing)
 ├─ Personality            ← user_preferences.companionPersonality  (NEW — read fresh, never cached)
 └─ Context Frame          ← context-frame-assembler.ts             (existing, unchanged)
      ├─ active surface
      ├─ active planner week
      ├─ household context
      ├─ selected meal / list / food
      └─ temporal anchor
```

**Non-duplication guarantee (mirrors TIP3 §5.4):** Personality is never written into a conversation turn, never cached beyond the current request, and never given its own store. If the user changes their personality in Settings mid-conversation, the very next turn reads the new value — exactly like a planner-week change is re-read by the next Context Frame, never remembered by the conversation layer.

---

## 7. INTEGRATION POINTS ACROSS THA

| Surface | Integration | New surface? |
|---|---|---|
| Settings / Profile page | Add a "Companion voice" selector (6 options) | No — extends the existing intelligence-settings section of `profile-page.tsx` |
| `/api/user/intelligence-settings` (GET/PATCH) | Add `companionPersonality` to the existing boolean-settings pattern (allow-list gets one more field; PATCH validates against the closed `PersonalityId` enum instead of `boolean`) | No — same endpoint, same owner (`user_preferences`), same auth check |
| `conversation-gateway.ts` | Read personality once per turn; thread into prompt assembly | No — existing file, additive parameter |
| `turn-fallback.ts` | Personality-aware phrasing templates for the 4 fallback states | No — existing file, additive parameter |
| `companion-guidance.ts` | Personality-aware label copy for suggestion chips | No — existing file, additive parameter |
| `companion-card.ts` | No change to card structure/firewall; summary sentence sourced with the active voice | No |
| `FloatingAssistant.tsx` | `PersonaLabel` continues to show surface framing; the personality itself is not necessarily shown per-turn (a one-time "Companion is speaking as {X}" affordance in Settings/first-run is sufficient — a UX decision for the implementing workstream, not this investigation) | No new component required; a small addition to existing components is enough |
| Voice (TIP3 Part 5, when built) | Confirmation read-back inherits the active personality's phrasing but not its confirmation tier (§5.2) | N/A — future phase, same rule applies by construction |

No new page, no new route group, no new database table is required anywhere in this list.

---

## 8. FUTURE EXTENSIBILITY

- **Adding a 7th personality** is a registry entry (voice descriptor + phrasing templates) plus a `PersonalityId` enum value — the same "adding a capability = registering intents" ethos TIP1 §12 established for capabilities, applied to voices. It is never a new pipeline.
- **Household-level personality** (e.g. a shared household default with per-member override) is a plausible future ask; it is a straightforward extension of the same `user_preferences`-owned fact (household defaulting already has precedent via `household_eaters` per Principle 2's scope test — eater-level override vs household default are legitimately different facts at different scopes, not a duplication).
- **Personality-flavoured proactive digests** (TIP3 Part 10) would reuse the same phrasing-template mechanism at the digest-composition step — no new mechanism.
- **Voice/TTS personality** (TIP3 Part 5) would map each personality to a TTS voice profile as one more field in the same registry entry — an adapter concern, consistent with "voice is another interface" (TIP1 §11).
- **The line to hold, restated for this feature specifically:** the day a personality needs its own capability, its own confirmation rule, its own knowledge source, or its own conversation store, the architecture has failed — exactly the line TIP1 §12 and TIP2 §6 already draw for capability-bundle personas, now extended to voice personas.

---

## 9. RISKS

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| P1 | **Personality prompt fragment overrides the grounding/firewall instruction** instead of sitting alongside it, letting a "confident" voice (Sergeant, Chef) state an ungrounded claim more assertively | 🔴 Critical | System-prompt assembly concatenates [base grounding + firewall instructions, always first and immutable] + [personality tone fragment, always second and additive-only]; code-review gate: personality fragments may add tone words, never override/negate the firewall clause; inherits TIP1 R2 |
| P2 | **Confirmation copy softened into implied consent** by a casual personality ("Friend") or skipped for brevity by a terse one ("Sergeant") | 🔴 Critical | Confirmation tier and the requirement of explicit assent are enforced server-side by capability class (TIP2 §5), never by prompt wording; personality changes the echo-back sentence, never removes it; inherits TIP1 R5/TIP2 confirmation model |
| P3 | **Personality becomes a second identity** — a future workstream gives "Chef" its own memory/history so it "remembers" past cooking chats specifically | 🔴 Critical | Explicit non-goal in §3.3; one conversation store, one history, regardless of personality; inherits TIP3 R2 |
| P4 | **Personality content creeps from tone into facts** — a "Coach" personality starts inventing motivational health claims not in the knowledge registry | 🟠 High | §5 hard invariant; personality registry entries are reviewed as tone-only content (Rule 8 governance review before any entry is added); no personality entry may contain a factual claim |
| P5 | **Six voices fragment trust** if they read as inconsistent about what the Companion actually knows/can do | 🟡 Medium | All six share identical capability access, gaps, and confirmation tiers (§5) — the only variable is wording; this is the direct answer to TIP3 R10 |
| P6 | **`user_preferences` enum drifts from the registry** if `companionPersonality` accepts a value with no matching registry entry | 🟡 Medium | PATCH validates against the closed `PersonalityId` enum server-side (mirrors the existing boolean-field allow-list pattern at `server/routes.ts:6925`); default-to-`companion` on any unrecognised/missing value, never a runtime crash |
| P7 | **Cost/latency** of an extra tone fragment in every system prompt | 🟢 Low | One short paragraph per call; negligible versus existing grounding context; inherits TIP1 R10 |

---

## 10. RECOMMENDED PHASED ROADMAP

Each phase is small because the spine already exists.

**Phase P0 — Personality registry (no user-visible change).**
Add `server/intelligence/conversation/personality-registry.ts`: a closed `PersonalityId` enum (`companion | friend | coach | chef | teacher | sergeant`) and one voice-descriptor record per id (display name, one-paragraph system-prompt tone fragment, phrasing templates for the 4 fallback states and the guidance-label builder). Pure data, no wiring yet. *Exit: registry compiles, unused.*

**Phase P1 — Storage + settings surface.**
Add `companionPersonality` column to `user_preferences` (default `'companion'`). Extend `/api/user/intelligence-settings` GET/PATCH to include it, validated against the enum. Add the selector to the Settings/Profile UI. *Exit: users can select and persist a personality; it has no effect yet.*

**Phase P2 — Wire into the Gateway (read-only voice).**
`conversation-gateway.ts` reads the personality once per turn and threads it into system-prompt assembly (step 10) and `turn-fallback.ts` phrasing (steps 6/9). *Exit: read/explain/gap responses are voiced in the selected personality; §5 invariants verified by test — same gap fires, same wording template swap only.*

**Phase P3 — Guidance & card copy.**
`companion-guidance.ts` suggestion labels and the Companion Card summary sentence adopt the active personality's phrasing templates. *Exit: full conversational surface (answers, gaps, suggestions, card summaries) is voiced consistently; card facts/actions/firewall unchanged.*

**Phase P4 — Confirmation copy (write path).**
Once/if the Intent Engine's write path is live for a given capability, confirmation echo-back text adopts personality phrasing while the tier and explicit-assent requirement remain exactly as TIP2 §5 defines. *Exit: a Strong-tier delete reads distinctly under Sergeant vs Friend but requires identical explicit confirmation under both.*

**Phase P5 — Voice/TTS mapping (future, aligned to TIP3 Phase E3).**
Each personality gains a TTS voice-profile field in the same registry entry. *Exit: voice inherits personality with zero new services, per TIP1 §11's standing proof.*

---

## 11. DEFINITION OF DONE

**What success looks like:** A user can select one of six personalities in Settings; every subsequent Companion interaction — answers, gaps, guidance suggestions, card summaries, confirmations — is voiced consistently in that personality, while every fact, gap, confirmation requirement, and capability boundary is byte-for-byte identical to what "Companion" (default) would have produced for the same query.

**What must not break:** The existing Capability Registry, Intent Engine, conversation store, Context Frame, Companion Card firewall, EFSA nutrition firewall, and confirmation tiers — none are modified by this design, only read from one additional angle (the personality parameter).

**Manual test steps (for the implementing workstream, not performed here):**
1. Ask an identical grounded question under two personalities; confirm the underlying fact/citation is identical and only wording differs.
2. Trigger a no-knowledge gap under two personalities; confirm both honestly disclose the gap.
3. Trigger a Strong-confirmation action under "Sergeant"; confirm explicit assent is still required before invoke.
4. Trigger a health-adjacent nutrition question under "Chef"; confirm the EFSA firewall wording is unchanged.

---

## DATA IMPACT

- Reads existing data: YES — `user_preferences`, unchanged read path.
- Writes new data: NO in this investigation. The implementing workstream (Phase P1) writes one new additive column (`user_preferences.companionPersonality`) to an existing table — no new table.
- Changes meaning of existing data: NO.
- Requires backfill: NO — new column defaults to `'companion'`; no existing rows require migration semantics beyond the default.

---

## TRUST CHECK

- Could this mislead the user? Only if a future implementation lets tone override truth (P1/P4 above) — explicitly guarded against in §5 and the roadmap's exit criteria.
- Could this fabricate certainty? No — §5 makes wording-only variation a hard invariant; gaps, EFSA firewall, and confirmation tiers are unchanged inputs to every personality's output.
- Is anything guessed but shown as real? No new guessing surface is introduced; personality is phrasing, not inference.
- What happens if the system is wrong? Identical to today — an honest gap, in whichever voice is selected.
- No architectural duplication introduced: YES (confirmed) — no new conversation store, no new capability registry, no new intent engine.
- No new source of truth created: YES (confirmed) — personality selection lives in the existing `user_preferences` owner; personality content is code-owned reference data, the same class as the existing Capability Registry.
- No runtime behaviour altered (governance-only work): YES — this document changes no code; it is an investigation only.

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-ewo1-companion-platform-foundation-20260703` → `9d6cc99c59afd8720eb5ea12db0b0f4e6c0e4317`
- Files modified by this task: `docs/investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md` (new file only)
- Rollback commands: `git checkout rollback/before-ewo1-companion-platform-foundation-20260703` (or, to only undo this file, `git rm docs/investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md`)
- Verification steps after rollback: `git status` shows the file absent; no other file in the repository is affected, since none were touched.

---

## SCOPE LOCK

**Implemented scope:** This investigation document only. No code, schema, route, or prompt was written or modified.

**Explicitly excluded scope (not done, and not to be started without a further decision gate):**
- No `personality-registry.ts` file created.
- No `user_preferences` schema/column change.
- No change to `/api/user/intelligence-settings`.
- No change to `conversation-gateway.ts`, `turn-fallback.ts`, `companion-guidance.ts`, or `companion-card.ts`.
- No Settings/Profile UI change.
- No renaming of "Companion Cards" or any existing `companion-*` file.

**Suggestions (observed outside scope — do not implement without approval):**
- The existing `PersonaLabel` badge in `FloatingAssistant.tsx` currently shows only surface framing. Once Personality ships, there may be user value in also surfacing the active personality name near that badge — a small UI decision left to the Phase P1/P3 implementing workstream, not decided here.
- `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 11 currently reads as if tone is fixed ("one personality spec... framing varies, identity/voice does not"). Once a Personality workstream is approved and implemented, that document should be revisited to fold in the §0.4 reconciliation recorded here, so the governing document and the shipped feature do not read as contradicting each other. This is a documentation-maintenance suggestion, not part of this investigation's deliverable.
