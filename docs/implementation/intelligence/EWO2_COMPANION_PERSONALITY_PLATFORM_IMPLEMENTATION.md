# EWO2 — Companion Personality Platform — Implementation

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**EWO:** EWO2 (implements the design approved in [EWO1](../../investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md))
**Risk:** 🟡 AMBER
**Reason:** Touches the shared prompt-assembly and fallback-phrasing seams inside `conversation-gateway.ts` — the single wiring point every user's turn passes through — but every change there is additive-only (a new parameter, a new appended prompt paragraph) and is proven, not just asserted, by an end-to-end test that the same honest gap fires under two different voices (§ Trust Validation). No new capability, no new conversation store, no schema change beyond one additive column.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/before-ewo2-companion-personality-platform-20260703` → `3460519` |
| Working tree at start | Dirty with pre-existing, unrelated uncommitted work from prior sessions (FI5 Food Intelligence UI activation + EL2 investigation doc — see EWO1's own rollback section for the same note). None of those files were authored by this task; they are listed below only because `git status` still shows them. |
| This task's writes | See **Files Changed** at the end of this document. |
| Rollback to committed state | `git checkout rollback/before-ewo2-companion-personality-platform-20260703` |
| Rollback this task only | `git checkout rollback/before-ewo2-companion-personality-platform-20260703 -- <path>` for any file listed in Files Changed; delete the new files listed there. The `companion_personality` DB column is additive (`NOT NULL DEFAULT 'companion'`) and safe to leave in place even after a code rollback — see **Data Impact**. |

---

## REFERENCE DOCUMENTS READ

- [x] [`EWO1_COMPANION_PLATFORM_FOUNDATION.md`](../../investigations/intelligence/EWO1_COMPANION_PLATFORM_FOUNDATION.md) — the approved architecture this task implements verbatim (Personality as a voice layer, not a second assistant; §5 hard invariant; Phase P0–P3 roadmap)
- [x] `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3) — Part 1 (persona 3-tuple), Part 11 (Trust & Personality), Risk R10
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2) — confirmation tiers (§5), guidance registry ownership
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — the eight governing principles (one owner per fact, no duplicate state, evolution over replacement)
- [x] Live code: `server/intelligence/conversation/conversation-gateway.ts`, `turn-fallback.ts`, `companion-guidance.ts`, `companion-card.ts`, `conversation-store.ts`; `server/routes.ts` (`/api/profile`, `/api/user/intelligence-settings`); `client/src/components/conversation/FloatingAssistant.tsx`; `client/src/pages/profile-page.tsx`; `shared/schema.ts` (`userPreferences`)

---

## ARCHITECTURE COMPLIANCE (confirmed before implementation)

```
☑ One canonical Intelligence Platform  — every personality routes through the SAME
  intelligencePlatform.handle() call the gateway already used; personality never
  reaches routing (Stage 3/4 code only reorders/relabels an ALREADY-eligible list).
☑ One Companion                        — no new persona/assistant object. `PersonalityId`
  is a 6-value enum threaded as a plain parameter; the Companion's identity, history,
  and trust boundary are unchanged.
☑ One conversation                     — personality is read fresh per turn from
  user_preferences and is NEVER written into a conversation_turns row. Switching
  personality mid-thread does not open a new thread (proven by §5 of the test suite:
  same InMemoryConversationStore instance is never touched by the personality change).
☑ One Capability Registry              — zero new capabilities, zero new (verb ×
  capability) pairs. `capability-registry.ts` is untouched by this task.
☑ One Intent Engine                    — intent-resolver.ts / intent-engine.ts are
  untouched. Personality is applied strictly AFTER resolution and AFTER the platform
  has already answered.
☑ One owner per fact                   — the user's personality choice is one additive
  column on `user_preferences` (existing owner, Profile capability C6). The 6
  personalities' voice content is one new static, code-owned registry — the same
  artefact class as capability-registry.ts.
☑ Personality extends existing architecture — new files added at conversation-gateway.ts's
  own seams (system prompt, turn-fallback text, guidance labels); zero new pipeline.
☑ No duplicate AI / state / logic / ownership — see Platform Audit below.
```

**Gate result: PASS** (same conclusion EWO1 reached at design time; re-confirmed here against the actual diff, not just the plan).

---

## AI ARCHITECTURE COMPLIANCE

```
✓ Uses the existing Intelligence Platform — conversation-gateway.ts's call to
  intelligencePlatform.handle() is byte-identical to before this task; personality
  is threaded around it, never through it.
✓ Uses the Capability Registry           — capability-registry.ts has zero diff in
  this task (FI5's earlier apiSurface edit predates and is unrelated to this task).
✓ Uses the Intent Engine                 — intent-resolver.ts/intent-engine.ts
  have zero diff in this task.
✓ Uses existing business services        — zero new services; storage.getUserPreferences
  and storage.getUserHealthTrends are both pre-existing storage methods, called
  read-only.
✓ Uses existing permissions              — companionPersonality is gated behind the
  same req.isAuthenticated() + own-row (userId from session) pattern every other
  user_preferences field already uses. No new role, no elevation.
✓ Uses existing conversation history     — conversation-store.ts has zero diff.
✓ Produces honest gaps                   — proven by test (§5, test-intelligence-
  personality-platform.ts): the SAME stubbed "gap" outcome classifies as the SAME
  fallbackState ("no-knowledge") under two different personalities; only `text` differs.
✓ Does not alter truthfulness            — the system prompt's five HARD RULES
  (grounding-only, no medical claims, honest "I don't know", conciseness, real-ID-only
  entity refs) are unchanged text; the personality fragment is appended as a clearly
  labelled 6th, voice-only paragraph (see conversation-gateway.ts diff).
✓ Does not alter safety                  — the EFSA/health-claim firewall (hard rule 2)
  is verbatim; no personality template contains a factual or medical claim (see
  personality-registry.ts's own file-header invariant).
✓ Does not alter capability availability — no personality reads a different
  Capability Registry entry, confirmation tier, or knowledge class than any other.
```

**Gate result: PASS.**

---

## 1. Personality Registry (Stage 1)

`shared/companion-personality.ts` — the closed `PersonalityId` enum (`companion | friend | coach | chef | teacher | sergeant`) plus display-only copy (name + one-line description), shared verbatim between server and client so the Settings picker never duplicates a second list.

`server/intelligence/conversation/personality-registry.ts` — imports and extends the shared enum with the full **structured** behavioural definition per personality: a `BehaviourProfile` (Stage 2), a `priorities` emphasis list (Stage 3), a `systemPromptFragment` (voice-only, additive), four `fallbackTemplates` (one per `turn-fallback.ts` state), a `guidanceLabelPrefix`, a `growthTemplate` (Stage 7), and an `experience` block (Stage 6). All six entries are pure data — no I/O, no LLM call.

## 2. Behaviour Engine (Stage 2)

`server/intelligence/conversation/behaviour-engine.ts` replaces "simple tone selection" with 12 named dimensions per personality (`warmth`, `encouragement`, `coachingIntensity`, `humour`, `empathy`, `explanationDepth`, `directness`, `celebrationStyle`, `curiosity`, `accountability`, `challengeLevel`, `optimism`) plus a set of **pure phrasing-transform functions** reused at every output seam:

| Function | Reused at |
|---|---|
| `systemPromptFragment(id)` | `conversation-gateway.ts` system prompt (appended, never prepended) |
| `voiceFallback(state, id, inputs)` | The 4 `turn-fallback.ts` states |
| `prioritizeGuidance` / `voiceGuidanceSuggestions` | `companion-guidance.ts` suggestion output (reorder + relabel only) |
| `buildGreeting` / `buildCelebration` | Stage 6 Experience Framework consumption (FloatingAssistant's empty-state greeting is a natural next call site — not wired in this pass, see Suggestions) |
| `phraseGrowth` | Stage 7 Growth Model output |

Every function is a **pure string transform** — none makes a routing decision, none can add or remove a fact.

## 3. Behaviour Priorities (Stage 3)

Each personality's `priorities` list matches the brief's examples exactly (Friend: encouragement/simplicity/reassurance/celebrate progress; Coach: goals/progress/accountability/action; Chef: flavour/cooking/ingredients/nutrition; Teacher: education/science/explanation/understanding; Sergeant: action/discipline/efficiency/accountability; Companion: balanced/trusted/calm/supportive).

`behaviour-engine.ts`'s `prioritizeGuidance` uses this list to **reorder** — never regenerate — the guidance suggestions `companion-guidance.ts` already resolved as eligible. Proven by test (§3): the same 2-item suggestion set, reordered under `"chef"`, still contains exactly the same two `targetCapabilityId`s afterward. The recommendation itself is identical; only display order and label wording change.

## 4. Companion Integration (Stage 4)

Wired into `conversation-gateway.ts` (`processUserTurn`): the user's `companionPersonality` is read once per turn, directly from `storage.getUserPreferences(userId)` — the same non-duplication pattern EWO1 §6 specified (never cached beyond the request, never written into a `conversation_turns` row; mirrors how the Context Frame itself is re-derived every turn). Threaded through as a plain parameter into:

- The system prompt (one additive, clearly-labelled paragraph after the 5 hard rules)
- `turn-fallback.ts`'s 4-state disclosure (via `voiceFallback`, which reuses `turn-fallback.ts`'s own `describeSearched`/`formatSuggestions` helpers so no personality template can invent what was searched)
- `companion-guidance.ts`'s next-step / recovery suggestion labels and order

Conversation history is untouched — `conversation-store.ts` has zero diff in this task. Changing personality does not open a new thread.

## 5. Workspace Integration Matrix (Stage 5 — Companion Presence audit)

`FloatingAssistant.tsx` is mounted **once**, globally, in the authenticated app shell (`client/src/App.tsx:170`) — outside the per-route `<Component />` — so it is already present, closed-by-default and user-triggered, on every one of the 9 named workspaces. This task's changes to that one shared component therefore apply everywhere at once, with no per-page wiring:

| Workspace | Companion presence today | What this task added |
|---|---|---|
| Dashboard | Global floating entry point + FI5's `FoodOpportunitiesPanel` (pre-existing, unrelated to this task) | Personality-voiced conversation; personality label; growth insight banner (fresh-panel only) |
| Planner | Global floating entry point, `planner` surface persona + FI5 panel | Same as above |
| Shopping | Global floating entry point, `shopping` surface persona | Same as above |
| Cookbook (Meals) | Global floating entry point, `meals` surface persona + FI5 panel | Same as above |
| Pantry | Global floating entry point, `pantry` surface persona + FI5 panel | Same as above |
| Nutrition Report | Global floating entry point, `nutrition` surface persona | Same as above |
| Diary | Global floating entry point, `diary` surface persona | Same as above |
| Profile | Global floating entry point + **new**: the Companion voice selector itself | Personality selector card (`CompanionPersonalitySettings`) |
| Partners | Global floating entry point, `partners` surface persona | Same as above |

No new per-workspace widget was built. The existing surface-scoped `PersonaLabel` badge (TIP3 §0.3's "contextual persona" — which surface you're on) is left exactly as-is; a small second, personality-only label ("speaking as {Name}") is shown beside it, and **only** when the user has picked something other than the silent default — a workspace where nobody has touched Settings shows no new UI at all (non-intrusive, per the brief's Stage 5 principle).

## 6. Experience Framework (Stage 6 — scaffold only)

Each `PersonalityDefinition.experience` carries: `avatarId`, `colorTheme` (opaque keys a future asset/theme map would resolve — not rendered anywhere yet), `greetings`/`celebrations` (plain string templates, `{detail}` filled only from caller-verified data), an optional `seasonal` override map, and a `voiceProfileId` placeholder for future TTS (TIP3 Part 5 / EWO1 Roadmap Phase P5). `behaviour-engine.ts`'s `buildGreeting`/`buildCelebration` are the reusable consumption functions. **Deliberately not implemented**: no artwork, no animation, no theme CSS, no TTS call — exactly the brief's "build the reusable framework, don't fully implement every visual feature."

## 7. Growth Model (Stage 7)

`server/intelligence/conversation/companion-growth.ts` computes a `GrowthSignal` from **one existing, already-owned data source** — `storage.getUserHealthTrends()`, the per-day Health Score trend already recorded by the pre-existing product-scanning flow. No new table, no new write path. It compares a recent 30-day window against an earlier 150-day-back window and returns **`null`** — an honest "not enough history yet" — whenever either window has fewer than `MIN_SAMPLES_PER_WINDOW` (5) real samples. `behaviour-engine.ts`'s `phraseGrowth` then voices the real, already-verified numbers in the active personality — it cannot add a number that wasn't in the signal.

Exposed via a new thin route, `GET /api/intelligence/companion/growth-insight`, and surfaced in `FloatingAssistant.tsx` as one muted, italic line shown **only** on a fresh (no-history) panel open, **only** when `available: true`. Proven by test (§4): zero/thin trend data → `null`; sufficient data → a signal whose phrased text cites exactly the computed numbers, for all 6 personalities.

## 8. Platform Audit (no duplication)

- **No duplicate AI**: one `ILlmProvider` call site (`conversation-gateway.ts`), unchanged. Personality never issues its own LLM call.
- **No duplicate prompts**: one system prompt is assembled; the personality fragment is one appended paragraph inside it, not a second prompt.
- **No duplicated conversation state**: `conversation-store.ts` and `conversation_turns` have zero diff in this task; personality is read, never persisted, per turn.
- **No duplicated business logic**: `capability-registry.ts`, `intent-resolver.ts`, `intent-engine.ts` have zero diff (FI5's earlier, unrelated `apiSurface` text edit predates this task).
- **No duplicated ownership**: `companionPersonality` is one additive column on the existing `user_preferences` row (Profile capability, C6) — not a new table, not a second preferences store.

Every personality consumes the identical `intelligencePlatform.handle()` result; verified end-to-end by the gateway test in §5 of the test file (same stubbed platform outcome, same `fallbackState`, different `text` only).

---

## DELIVERABLES

1. **Personality Registry** — `shared/companion-personality.ts` + `server/intelligence/conversation/personality-registry.ts`
2. **Behaviour Engine** — `server/intelligence/conversation/behaviour-engine.ts`
3. **Behaviour Specification** — the 12-dimension `BehaviourProfile` + priorities list per personality (§2–3 above; see registry file)
4. **Companion Integration** — `conversation-gateway.ts` diff (§4 above)
5. **Workspace Integration Matrix** — §5 above
6. **Experience Framework** — `ExperienceProfile` type + `buildGreeting`/`buildCelebration` (§6 above)
7. **Growth Framework** — `companion-growth.ts` + `GET /api/intelligence/companion/growth-insight` (§7 above)
8. **Trust Validation** — see below
9. **Risks** — see below
10. **Rollback Plan** — see Rollback Protection above and Files Changed below

---

## TRUST VALIDATION

- **Personality never changes truth.** The system prompt's 5 hard rules (grounding-only, no medical claims, honest "I don't know", conciseness, real-ID-only refs) are byte-identical across all 6 personalities; only one additional, clearly-labelled voice paragraph is appended.
- **Personality never changes safety.** No personality template (fallback text, growth phrase, guidance label) contains a factual, medical, or nutrition claim — enforced by construction (every template takes only caller-supplied, already-verified strings/numbers as input) and spot-checked by test.
- **Personality never changes capability.** Zero diff to `capability-registry.ts`, `intent-resolver.ts`, `intent-engine.ts`. `voiceGuidanceSuggestions` only reorders/relabels an already-`canExecute`-gated list.
- **Personality never fabricates familiarity.** `companion-growth.ts` returns `null` on thin data; the route returns `available: false`; the client renders nothing. Proven by test.
- **Personality only reflects validated platform knowledge.** Every phrase-builder input is either (a) a fact the platform already produced this turn (fallback disclosure, guidance target) or (b) a verified historical number (`GrowthSignal`) — never invented by a template.
- **Honest gaps remain honest.** Proven end-to-end: the same stubbed "gap" platform outcome produces the same `fallbackState: "no-knowledge"` under both `"sergeant"` and `"friend"` — only the wording of the disclosure differs (`server/tests/test-intelligence-personality-platform.ts` §5).

---

## RISKS

| ID | Risk | Severity | Mitigation |
|---|---|---|---|
| P1 | A personality's system-prompt fragment could be written to override the grounding/firewall instructions | 🔴 Critical | The fragment is appended AFTER all 5 hard rules, in its own labelled paragraph ("PERSONALITY (voice only — never overrides rules 1–5 above)"); code-review discipline for any future 7th personality: tone words only, never a claim |
| P2 | A future fallback template could soften wording enough to imply an answer exists | 🟠 High | Every template is built from `turn-fallback.ts`'s own already-computed dynamic facts (`describeSearched`/`formatSuggestions`) — a template cannot invent what was searched; spot-checked by test that no personality's `no-knowledge` text matches an "I have the answer" pattern |
| P3 | Guidance reordering could be implemented to also change eligibility | 🟡 Medium | `prioritizeGuidance` operates on an already-resolved array and is proven by test to preserve the exact `targetCapabilityId` set before/after reordering |
| P4 | Growth Model could be extended later to a thinner data source that reads as fabricated familiarity | 🟡 Medium | `MIN_SAMPLES_PER_WINDOW` floor is a named, tested constant; any future data source must honour the same "return null on thin data" contract |
| P5 | The new direct `storage.getUserPreferences` read in `conversation-gateway.ts` adds a DB round-trip to every turn | 🟢 Low | Single indexed lookup (`user_preferences.user_id` is already a unique-indexed column); no measurable latency impact expected; not benchmarked in this pass |

---

## DATA IMPACT

- **Reads existing data:** `user_preferences` (existing row, one new column), `user_health_trends` (existing table, unchanged read pattern via `storage.getUserHealthTrends`).
- **Writes new data:** one additive column, `user_preferences.companion_personality text NOT NULL DEFAULT 'companion'` (applied via direct `ALTER TABLE`, verified against the live schema — `npm run db:push`'s interactive prompt for an unrelated, pre-existing `meal_plan_template_items` constraint was left untouched, not resolved by this task). No new table.
- **Changes meaning of existing data:** No.
- **Requires backfill:** No — every existing row defaults to `'companion'` (the pre-existing behaviour, unchanged) with no migration semantics needed.

---

## SCOPE LOCK

**Implemented scope (this task):**
- Personality Registry, Behaviour Engine, Behaviour Specification, Companion Integration, Workspace Integration Matrix (audit — no new per-page widgets), Experience Framework scaffold, Growth Model + route + minimal client surfacing, Platform Audit, this document.

**Explicitly excluded (not implemented, not to be started without a further decision gate):**
- No new per-workspace Companion widgets beyond the global `FloatingAssistant` (Stage 5 is presence + voicing, not 9 new components).
- No avatar artwork, animation, theme CSS, or TTS integration (Stage 6 is a data-shape scaffold only).
- No change to `capability-registry.ts`, `intent-resolver.ts`, `intent-engine.ts`, or `conversation-store.ts`.
- No household-level personality default/override (named as a plausible future extension in EWO1 §8, not built here).
- No full browser/Playwright UI verification was performed (no headless browser tool available in this environment) — verified instead via `tsc --noEmit` (0 new errors), the full existing test suite (unmodified, still passing), a new dedicated test suite (114/114, including a real DB-backed end-to-end proof of the hard invariant), and a live dev-server route-registration check (`curl` → `401` unauthenticated on both new/changed routes).

**SUGGESTIONS (observed outside scope — do not implement without approval):**
- Wire `buildGreeting`/`buildCelebration` into `FloatingAssistant.tsx`'s existing hardcoded "Hi, I'm Apple!" empty-state line, so the greeting itself is personality-voiced (currently only the growth-insight line beneath it is).
- A household-level personality default with per-member override (EWO1 §8), following the same scope test `household_eaters` already established for other per-eater facts.
- Revisit `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 11, which still reads as "one personality spec... identity/voice does not [vary]" — now that Personality has shipped, that document should be updated to fold in the EWO1 §0.4 reconciliation so it doesn't read as contradicting the shipped feature.
- A dedicated Playwright/browser smoke test for the Settings selector and the FloatingAssistant personality label, once a headless-browser tool is available in this environment.
- Benchmark the added per-turn `storage.getUserPreferences` read under load (Risk P5) if conversation latency becomes a concern.

---

## FILES CHANGED

**New:**
| File | Purpose |
|---|---|
| `shared/companion-personality.ts` | Closed `PersonalityId` enum + display copy (client+server shared) |
| `server/intelligence/conversation/personality-registry.ts` | Full behavioural definitions (Stages 1–3, 6) |
| `server/intelligence/conversation/behaviour-engine.ts` | Reusable phrasing-transform functions (Stage 2, 4, 6, 7) |
| `server/intelligence/conversation/companion-growth.ts` | Growth Model — real-data-only signal computation (Stage 7) |
| `server/tests/test-intelligence-personality-platform.ts` | 114 assertions incl. end-to-end DB-backed hard-invariant proof |
| `docs/implementation/intelligence/EWO2_COMPANION_PERSONALITY_PLATFORM_IMPLEMENTATION.md` | This document |

**Modified (additive only):**
| File | Change |
|---|---|
| `shared/schema.ts` | + `userPreferences.companionPersonality` column + insert-schema pick |
| `server/intelligence/conversation/conversation-gateway.ts` | Reads personality once per turn; threads into system prompt, fallback text, guidance voicing |
| `server/intelligence/conversation/turn-fallback.ts` | Exports `formatSuggestions`/`describeSearched` (were private) for reuse by `behaviour-engine.ts` |
| `server/routes.ts` | `companionPersonality` added to `/api/user/intelligence-settings` GET/PATCH (enum-validated); + `GET /api/intelligence/companion/growth-insight` |
| `server/tests/test-intelligence-profile-binding.ts` | Mock `UserPreferences` fixture updated with the new required field (0-new-tsc-error discipline) |
| `client/src/pages/profile-page.tsx` | + `CompanionPersonalitySettings` card (voice selector) in the Personal section |
| `client/src/components/conversation/FloatingAssistant.tsx` | + personality label beside `PersonaLabel`; + growth-insight banner on a fresh panel |
| `package.json` | + `test:intelligence-personality-platform`, appended to the `test` chain |

**Database:** `user_preferences.companion_personality text NOT NULL DEFAULT 'companion'` (applied directly; verified via `\d user_preferences`).

**Verified:** `npx tsc --noEmit` (154 pre-existing errors, 0 new — confirmed by diff against the pre-task baseline), full existing `npm test` chain (unmodified suites still passing — see below for this task's own run), new `test:intelligence-personality-platform` (114/114), live dev-server restart + route registration check (`401` unauthenticated on both new/changed routes, not a 404/500/SPA-fallthrough).
