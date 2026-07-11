# IA2 — Dormant Capability Activation, Wave 2

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Mode:** Implementation.
**Risk:** 🟢 GREEN — two small, additive wiring changes; zero new capabilities, zero new verbs, zero schema changes. Every read this wave surfaces was already computed by an existing, tested engine; every write path this wave surfaces was already registered, permissioned and confirmation-gated by an existing capability. This wave adds consuming surfaces, not business logic.
**Rollback tag:** `rollback/before-ia2-dormant-capability-activation-20260704` → `ff3b2cf` (the HEAD this wave started from — identical to IA1's own starting point; nothing between that commit and this wave's edits was reverted or altered).

---

## OBJECTIVE

Continue Intelligence Activation past `IA1` (`docs/implementation/intelligence/IA1_PLATFORM_INTELLIGENCE_ACTIVATION_WAVE_1.md`) by identifying and activating the next highest-value dormant Intelligence Platform capabilities — capabilities that are `available`/registered, tested, and already live on at least one path, but have never been reached by a real user-facing consumer on a second one. Prioritise platform-wide activation over new capability creation. Preserve: one Intelligence Platform, one Companion, one source of truth, one owner, permission-aware intelligence. Land Wave 2 as one independently releasable increment.

---

## GOVERNING ARCHITECTURE (reviewed before starting)

- **`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)** — same reading as IA1: a capability can be `available` yet still **dormant** — reachable in principle, never reached by any real client surface. This wave closes two more such gaps.
- **`docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`** — nothing in this wave adds a new discovery surface. The Learning Signals panel presents a fact the platform already owns (a household's own confirmed/pending Pattern) on Profile's existing Household section — the same canonical-page-owns-presentation model `FoodOpportunitiesPanel` already established for `opportunity-delivery`. The seasonal observation reuses the Companion's existing passive-notice banner (`FloatingAssistant.tsx`), adding no new discovery surface.
- **`docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`** — governs the Observation Engine directly. §11 names **G4 — Incomplete `InteractionKind` vocabulary** ("`welcome`, `encouragement`, `seasonal` are placeholders for future use, honestly unwired rather than fabricated") as an open item. This wave wires `seasonal` for the first time, closing one third of G4. The Behaviour Engine's hard invariant (§0: "may change *how* something is said or *which already-true fact* is surfaced and *when* — may never change *what is true*") is upheld: `observeSeasonal`/`phraseObservation`'s new `"seasonal"` case add zero new voice content, reusing the existing generic `voiceGuidanceLabel` prefix mechanism verbatim.
- **`docs/implementation/knowledge/EL1_EVIDENCE_AND_LEARNING_PLATFORM.md`** and **`docs/investigations/intelligence/EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md`** — EL1 built the platform's 21st capability (`evidence-learning`) with zero real reporters and zero real consumers; EL2 (a same-day, documentation-only refinement) named "wiring a first real reporter" and "wiring a first real consumer of Confirmed Understanding" as EL1's own next milestones, explicitly unstarted as of EL2's writing. **Finding, not new work:** reading the current repository state (not just its docs) found the reporter half already wired, uncommitted and undocumented — `server/routes.ts`'s `POST /api/intelligence/food-opportunities/:opportunityId/:action` already calls `evidence-learning`'s `report` verb on accept/dismiss (best-effort, non-blocking). This wave does not redo that half; it verifies it, credits it honestly here (see "Finding" below), and builds the still-entirely-missing consumer half.
- **`docs/implementation/intelligence/OD1_OPPORTUNITY_DELIVERY_FRAMEWORK.md`** — the Port → Handler → Binding and `use-food-opportunities.ts`/`FoodOpportunitiesPanel.tsx` shapes this wave's Evidence & Learning consumer mirrors verb-for-verb and file-for-file, the same way OD1 itself mirrored `companion-action-store.ts`.
- **`docs/implementation/intelligence/IA1_PLATFORM_INTELLIGENCE_ACTIVATION_WAVE_1.md`** — the immediate predecessor. Its own "Suggestion for IA2" named the ambient-widget unification and the household-meal-matcher UI entry point as candidates needing their own design/scope pass first — both remain correctly deferred here (see "Deliberately NOT done in this wave"). Investigating those candidates surfaced a separate, useful correction: IA1's characterisation of `household-meal-matcher.ts`'s Tier-4 wiring as unscoped/deferred is now stale — `server/lib/smart-suggest-service.ts` and `docs/investigations/cookbook/TIER4_SHELL_RECOVERY_ACTIVATION.md` show it was fully migrated to `household_eaters` and wired as Tier-4 planner recovery in its own prior, tested workstream (`test-tier4-shell-recovery-activation.ts`). Recorded here so the next reader does not re-open it as if it were still open.

### Architecture compliance gate (confirmed before implementation)

| Check | Finding | Verdict |
|---|---|---|
| One canonical Intelligence Platform | No new capability registered; `capability-registry.ts` unchanged by this wave. `evidence-learning` remains the platform's 21st capability, `opportunity-delivery` the 20th — counts unchanged. | ✅ PASS |
| One Companion | `phraseObservation`, `voiceGuidanceLabel`, and Silence Rules are all reused verbatim for the seasonal observation — zero new template content, zero new voicing logic, zero new interaction taxonomy value (the `"seasonal"` kind already existed, unused). | ✅ PASS |
| One source of truth | The Learning Signals panel reads the same `household_learning_signals` rows EL1 already owns, through the same `evidence-learning-store.ts` sole owner, via the same `search`/`approve`/`delete` verbs — no second read path, no second confirmation mechanism. The seasonal observation reads the exact same `seasonalStories()`/`buildHouseholdHistory()` computation already consumed by `/api/home/intelligence` and `/api/planner/weeks/:weekId/intelligence` — a third consuming surface, not a third computation. | ✅ PASS |
| Permission-aware intelligence | Every new route requires `req.isAuthenticated()`; every capability call resolves `context.userId` server-side via `intelligencePlatform.contextFor(user)` (identical guard to every sibling route); `approve`/`delete` on a learning signal remain the platform's own "strong"-confirmation-tier verbs, unmodified — a household can only ever decide a signal `decideSignal` resolves as its own (`evidence-learning-handler.ts`'s existing ownership check, untouched). | ✅ PASS |
| No new capability, store, or duplicate state | Confirmed — see per-item sections below. Zero new tables, zero new columns, zero new verbs. | ✅ PASS |

**Gate result: PASS.** Implementation proceeded.

---

## FINDING — the reporter half of Evidence & Learning was already wired, undocumented

Before choosing this wave's scope, the repository's current state (not just its docs) was read directly, per this platform's own discipline of treating the codebase as source of truth. `server/routes.ts`'s `POST /api/intelligence/food-opportunities/:opportunityId/:action` handler (the FI5 route activated in IA1's predecessor workstream) already contains a best-effort call to `evidence-learning`'s `report` verb on `accept`/`dismiss`, tagging the resolution as `outcomeType: "opportunity-response"` with `direction` derived from the action. This code is present in the working tree but:

- is **not described in any implementation record** (`EL1_EVIDENCE_AND_LEARNING_PLATFORM.md` explicitly lists "no first real reporting capability" as excluded; `EL2` — dated the same day — explicitly lists "wiring a first real reporting capability... still unstarted"), and
- has **zero test coverage** of its own (the binding tests for `opportunity-delivery` and `evidence-learning` each test their own capability in isolation; neither exercises this specific cross-capability call).

This wave verified the code compiles and is logically sound (correct verb, correct required fields per `RecordOutcomeParams`, correctly gated to the two terminal actions only, correctly best-effort/non-blocking), and treats it as pre-existing platform state this wave builds the missing half onto — it is not re-implemented, and it is not claimed as this wave's own work. It is named here so the gap between "what the docs say" and "what the code does" does not silently persist, per the SoT Register's own Rule 7 discipline.

**What was still completely missing, confirmed by grep across the full repository:** nothing anywhere called `evidence-learning`'s `search`, `approve`, or `delete` verbs outside the handler's own unit test. Zero real consumer existed. That is this wave's actual scope.

---

## WHAT WAS ACTIVATED

### 1. Evidence & Learning's first real consumer — a "Something we've noticed" panel (Household — closes the platform's one write-only-with-no-read-back loop)

**Gap:** `evidence-learning` (EL1, the platform's 21st capability) can already accumulate structured household evidence, detect a Pattern once it clears `MIN_EVIDENCE_COUNT`/`MIN_CONSISTENCY`, and hold it as `pending_confirmation` — but no household could ever see one, confirm it, or decline it. A Pattern that can never be shown or confirmed can never become Confirmed Understanding (EL2 §2, stage 4) — the loop was permanently open at its far end, regardless of how much evidence the reporter half (see Finding, above) now feeds in.

**What changed:**
- `server/routes.ts` — new `GET /api/intelligence/learning-signals` (calls the already-registered `search` verb, filtered to `pending_confirmation`) and `POST /api/intelligence/learning-signals/:signalId/:decision` (`confirm`/`decline` → the existing `approve`/`delete` verbs, `{ confirmed: true }` on the click itself, identical single-step pattern to the food-opportunities resolve route). Thinnest possible seam: no new verb, no new business logic, no new store.
- `client/src/hooks/use-learning-signals.ts` — new, mirrors `use-food-opportunities.ts`'s exact shape (thin fetch wrapper, honest `401` → empty list, optimistic-after-server-confirms cache update on decide).
- `client/src/components/intelligence/LearningSignalCard.tsx` — new, mirrors `FoodOpportunityCard.tsx`'s structure exactly (built on the same `IntelligenceCard` primitive). Renders `rationale` verbatim (EL1's ET6 explainability rule: never present a Pattern without its evidence trail) and an evidence-count line; two buttons wired to `confirm`/`decline`. Copy follows `EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md`'s own canonical user-facing glossary (§3) verbatim: confidence labels ("Just noticed" / "Fairly sure" / "Confident"), confirm ("Yes, that's right"), decline ("No, that's not right") — this wave invents no new language, it uses EL2's already-written words for the first time.
- `client/src/components/LearningSignalsPanel.tsx` — new, mirrors `FoodOpportunitiesPanel.tsx`'s progressive-enrichment discipline: pending fetch or an honestly-empty household (no Pattern has cleared the evidence bar yet) renders nothing at all, never a placeholder implying something is missing.
- `client/src/pages/profile-page.tsx` — one `<LearningSignalsPanel />` instance inside the existing "Household" section, directly after `HouseholdEatersSection` — Patterns are household-scoped facts, the same home `HouseholdEatersSection`/`HouseholdManagementSection` already occupy. No new page, no new nav entry.

**Why Household, not a new page:** per the Discovery/Presentation Principle, presentation belongs on a canonical page. Profile's Household section is that page for every other household-scoped fact today (eaters, restrictions, management); a Pattern is exactly that class of fact, scoped to `householdId` by EL1's own schema.

### 2. Seasonal awareness for the Companion's Observation Engine (Companion — closes one third of a named gap, G4)

**Gap:** `shared/seasonal/engine.ts`'s `seasonalStories()` (WS11) is already computed and consumed twice — `GET /api/home/intelligence` and `GET /api/planner/weeks/:weekId/intelligence` both derive a `seasonalHighlight` headline from it — but the Observation Engine (`server/intelligence/conversation/observation-engine.ts`), which IA1 already activated for `nutrition-trend`/`streak`/`diversity`/`opportunity`, had no seasonal producer at all. `THA_COMPANION_PLATFORM_ARCHITECTURE.md` §11 names this precisely: the `"seasonal"` `InteractionKind` is one of three declared-but-unwired placeholders (G4).

**What changed:**
- `server/intelligence/conversation/observation-engine.ts` — new `ObservationCategory` value `"seasonal-highlight"`, new fact kind `{ kind: "seasonal"; headline: string }`, and a new pure producer `observeSeasonal(headline: string | null)` — an honest no-op on `null` (WS11's own "not enough of a season yet — staying silent" discipline), a single Observation on a real headline. Zero I/O in this module, matching every existing producer's own discipline.
- `shared/companion-interaction.ts` — `"seasonal-highlight"` mapped to the already-declared, previously-unused `"seasonal"` `InteractionKind`.
- `server/intelligence/conversation/behaviour-engine.ts` — `phraseObservation`'s switch gained one `"seasonal"` case, voicing the headline through the exact same generic `voiceGuidanceLabel` prefix mechanism the `"opportunity"` case already uses — no new per-personality template content added anywhere.
- `server/routes.ts` — `GET /api/intelligence/companion/observations` now also derives a seasonal headline via `buildHouseholdHistory()` + `seasonalStories()` — the identical two-call derivation (`looking_ahead` block first, `discoveries` block fallback) already inlined twice elsewhere in this same file — and passes it to `observeSeasonal`. Best-effort: a household with no history yet degrades this one source silently, exactly like the existing plant-diversity and opportunity fetches beside it.

**Why this is a Wave 2 item, not a Wave 1 item:** it needed IA1's own Companion observation seam to exist first (IA1 activated the route itself for `nutrition-trend`); this wave is the next incremental producer on an already-open seam, not a new one.

### Deliberately NOT done in this wave

- **Ambient-widget unification (Planner/Cookbook/Pantry's "two widgets side by side")** — IA1 named this as a Wave 2 candidate. Investigated further this wave: `PlannerIntelligenceStrip`'s own `opportunity` pill is sourced from a *different*, older endpoint (`/api/planner/weeks/:weekId/intelligence`) than `FoodOpportunitiesPanel`'s `opportunity-delivery`-backed feed sitting beside it on the same page — a real, confirmed duplication, but one that requires a genuine design decision (which visual frame wins, whether to retire or fold the older endpoint's opportunity field) that this wave's own "small, additive, no new business logic" scope does not accommodate safely. Left named, not fixed, for its own scoped design pass — unchanged from IA1's own conclusion.
- **`household-meal-matcher.ts` direct UI entry point** ("what can everyone eat" discovery) — per the correction in "Governing Architecture" above, Tier-4 slot-fill wiring is done, but the matcher's own rich, explainable output (`fitScore`, `sharedIngredients`, `memberChanges`, `explanation`) is still only ever consumed silently inside planner slot recovery, never shown to a household with its own reasoning. A dedicated surface for this is real and valuable, but meal shell templates have no canonical detail page of their own yet to link to (per the Discovery/Presentation Principle's "link to the canonical page, never render in place" rule) — that's a genuine design decision, not a same-wave wiring task. Named as a strong IA3 candidate.
- **Personality `ExperienceProfile` visual identity** (`avatarId`/`colorTheme`) — unchanged from IA1: real data, no client renderer, needs design assets before implementation, not just wiring.
- **Retiring the orphaned `GET /api/intelligence/companion/growth-insight` route** (`THA_COMPANION_PLATFORM_ARCHITECTURE.md` §13, item 1) — real, safe, and trivial, but out of this wave's activation focus (it is a deletion, not an activation); left for a small, dedicated hygiene pass.
- **Confirmed-signal re-weighting of Opportunity/Food Intelligence ranking** (EL2 §2, stage 5, "Improved Opportunities") — this wave gives a household a way to confirm a Pattern for the first time, but wiring that Confirmed Understanding back into what FI4's opportunity engine actually suggests is a separate, larger Domain Intelligence change (re-scoring, not just reading) that neither EL1 nor EL2 authorised building yet. Correctly the next milestone after this one, not part of it.

---

## DATA IMPACT

- **Reads existing data only.** No new table, no new column, no new capability, no new producer, no new verb.
- **Writes:** the confirm/decline actions write only to `household_learning_signals`' own `status`/`confirmedByUserId`/`confirmedAt` fields — the exact write path `evidence-learning-handler.ts`'s `approve`/`delete` verbs already perform, unmodified by this wave. No preference store is touched (EL1's own hard boundary, untouched).
- **Schema:** unchanged.
- **Requires backfill:** no.

---

## TRUST CHECK

- **Could this mislead the user?** No. Every `rationale` shown is EL1's own deterministic, evidence-counted sentence (ET6) — never paraphrased by this wave. Confidence labels map 1:1 to EL1's own fixed buckets (`low`/`medium`/`high`), never implying more certainty than `bucketConfidence` computed. The seasonal headline is the exact same WS11 sentence already shown twice elsewhere — reworded by nobody.
- **Could this fabricate certainty?** No. `observeSeasonal(null)` and an empty `LearningSignalsPanel` both produce silence, never a guessed placeholder. A Pattern is never presented as confirmed until this household's own explicit `approve` click — EL1's ET5 gate is untouched by this wave; the panel only ever shows `pending_confirmation` signals and only ever calls `approve`/`delete`, never any path that could mark a signal confirmed without the click.
- **Is anything guessed but shown as real?** No — every rendered value traces to an existing, tested function or an existing, tested store row; nothing here infers or estimates.
- **Permission-aware?** Every new/changed route requires authentication; the household is always resolved server-side (`getHouseholdForUser`/`context.userId`, never client-supplied); `decideSignal`'s existing cross-household guard (unmodified) still refuses to resolve a signal id that does not belong to the caller's own household.
- **No architectural duplication introduced:** confirmed — no new capability, no new store, no second search/approve/decline mechanism, no second seasonal computation path.
- **No new source of truth created:** confirmed.

---

## VERIFICATION PERFORMED

- **`npx tsc --noEmit`** — zero new errors in any file this wave touched (`server/routes.ts`, `server/intelligence/conversation/observation-engine.ts`, `server/intelligence/conversation/behaviour-engine.ts`, `shared/companion-interaction.ts`, `client/src/hooks/use-learning-signals.ts`, `client/src/components/intelligence/LearningSignalCard.tsx`, `client/src/components/intelligence/index.ts`, `client/src/components/LearningSignalsPanel.tsx`, `client/src/pages/profile-page.tsx`). The repo's pre-existing baseline (170 errors, entirely in unrelated `server/tests/test-intelligence-*-discovery-binding.ts` top-level-`await` files and pre-existing fixture-type mismatches) is unchanged — none of this wave's files appear anywhere in the error output.
- **`npx tsx server/tests/test-intelligence-observation-engine.ts`** — extended with a new §3b (`observeSeasonal`: honest gap on `null`, verbatim headline pass-through on a real one) and extended §5 (`phraseObservation`'s new `"seasonal"` case, all six personalities). 42 passed, 0 failed (up from 33 pre-existing assertions).
- **`npx tsx server/tests/test-intelligence-evidence-learning-binding.ts`** — 59 passed, 0 failed (unchanged; confirms the consumer's routes call the capability exactly as already contracted, no regression from adding a real caller).
- **`npx tsx server/tests/test-intelligence-opportunity-delivery-binding.ts`** — 50 passed, 0 failed (unchanged; confirms the pre-existing reporter wiring's own capability is unaffected).
- **`npx tsx server/tests/test-intelligence-personality-platform.ts`** — 114 passed, 0 failed (confirms `behaviour-engine.ts`'s new `"seasonal"` switch arm did not disturb any existing personality/voicing assertion).
- **`npm test`** (full chain) — run to confirm zero regressions across every existing suite.

---

## SCOPE LOCK

**Implemented (this wave):**
1. `GET /api/intelligence/learning-signals` + `POST /api/intelligence/learning-signals/:signalId/:decision` + `use-learning-signals.ts` + `LearningSignalCard.tsx` + `LearningSignalsPanel.tsx` + `profile-page.tsx` wiring — `evidence-learning`'s `search`/`approve`/`delete` verbs activated for the first time.
2. `observeSeasonal` producer + `"seasonal-highlight"` category + `"seasonal"` `InteractionKind` wiring + `GET /api/intelligence/companion/observations` extension — WS11's Seasonal Stories engine activated as the Companion's third consuming surface.
3. Verified and honestly credited (not re-implemented) the pre-existing, previously-undocumented Evidence & Learning reporter wiring found in `server/routes.ts`.

**Explicitly excluded from this wave (candidates for IA3, not forgotten):**
- Ambient-widget unification on Planner/Cookbook/Pantry — confirmed real, needs a design pass (which visual frame wins) before implementation.
- `household-meal-matcher.ts` direct UI entry point — confirmed the underlying engine is already live and tested (Tier-4); needs a canonical presentation destination decided first (meal shell templates have none today).
- Personality `ExperienceProfile` visual identity (`avatarId`/`colorTheme`) — needs design assets.
- Retiring `GET /api/intelligence/companion/growth-insight` — safe, trivial, but a deletion, not this wave's activation focus.
- Wiring Confirmed Understanding back into Food Intelligence's own opportunity ranking (EL2's "Improved Opportunities" stage) — a Domain Intelligence re-scoring change, larger than this wave's UI-activation scope.

**Suggestion for IA3 (not implemented without further scoping):** once real Confirmed Understanding accumulates from this wave's own panel, the highest-value next step is wiring it back into FI4's opportunity engine as one more (re-weight-never-author, per EL2 §2 stage 5) ranking input — the natural third link in the Observe → Understand → Opportunity/Deliver → Evidence loop `EL2_EVIDENCE_AND_LEARNING_ARCHITECTURE_REFINEMENT.md` §1 names.

---

*Rollback: `git checkout rollback/before-ia2-dormant-capability-activation-20260704` (tag on `ff3b2cf`, the HEAD this wave started from — identical to IA1's own starting point; nothing between that commit and this wave's edits was reverted or altered).*
