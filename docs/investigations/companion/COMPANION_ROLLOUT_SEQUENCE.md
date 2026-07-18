# Companion Rollout Sequence Investigation

**Mode:** Investigation (no implementation)

**Objective:** Review the completed Companion Platform Architecture and completed Intelligence Activation programme. Recommend the optimal implementation order for the Companion Rollout programme, optimized for:
- Least implementation rework
- Highest user value  
- Quickest path to a delightful launch experience

**Authoritative foundation documents:**
- `docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` (EWO-CPA1, 2026-07-03)
- `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1, 2026-06-30)
- `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` (GOV-AI1, 2026-06-18)
- `docs/investigations/intelligence/M5_TRUSTED_FOOD_INTELLIGENCE_ACTIVATION.md` (2026-06-25)
- `docs/investigations/intelligence/M6_PLATFORM_FOOD_INTELLIGENCE_ROLLOUT.md` (2026-06-25)

---

## EXECUTIVE SUMMARY

**The Companion Platform spine is complete.** Six voices, governance model, behaviour/observation engines, and growth signalling are all built and governing. The rollout is not "how to build the Companion" but "which surfaces unlock its value first while maximizing reusability."

**Three strategic findings shape the sequence:**

1. **The Observation Engine has the lowest implementation rework.** Each observation channel (`observeNutritionTrend`, `observeStreak`, `observeDiversity`, `observeOpportunities`) is independent and self-contained. They can roll out surface-by-surface without blocking each other. The Silence Rules choke point (de-dupe, priority, cap 2) handles volume/ordering for all.

2. **Plant Diversity and the Weekly Nutrition Report are the dual keystones.** Both surfaces already own rich, curated knowledge. Both link to the same WS0 food intelligence. Both create "notable" observations (reaching 10-plant diversity milestones, week-over-week progress signals). Rolling them out early creates the flagship Companion surface and validates the pattern for later surfaces.

3. **The Guidance layer is already wired, but underutilized.** The Behaviour Engine's `prioritizeGuidance` and `voiceGuidanceSuggestions` already reorder and relabel existing capability suggestions (per personality priority). Rolling this out first (low-risk phrasing layer) validates the behaviour-engine pipeline before observation-engine complexity lands.

**Recommended rollout (6 phases):**

| Phase | Surface | Scope | Why here | Risk | Timeline |
|---|---|---|---|---|---|
| **P0 (Foundation)** | Behaviour Layer | Personality → phrasing in conversation turns | Validate the 3-call-site pipeline in `conversation-gateway.ts` before observations | Low | 1 sprint (validation) |
| **P1 (Flagship)** | Plant Diversity | Diversity milestone notices + behaviour | 10-food milestones are discrete, observation is simple, highest delight-per-line | Low | 1 sprint |
| **P2 (Converged)** | Weekly Nutrition Report | Trend notice + behaviour | Builds on P1; reuses diversity signal; adds growth-trend notice | Medium | 1–2 sprints |
| **P3 (Guidance)** | Planner + Shopping | Guidance reordering (behaviour layer only) | Validates behaviour-engine reordering on feature-rich surfaces | Low | 1 sprint |
| **P4 (Breadth)** | Pantry, Meals, Dashboard | Opportunity notices | Each observation channel is independent; can parallelize | Medium | 2–3 sprints |
| **P5 (Polish)** | Cross-session Silence & Household | Persistence + preferences | Deferred to post-launch; depends on new schema (G6) | High | Post-launch |

**Launch definition:** Companion is "launched" when Plant Diversity (P1) and Weekly Nutrition Report (P2) have behaviour-voiced, observation-aware personalities on all three surfaces (Dashboard, Planner, Shopping root). The Companion is fully integrated *within the knowledge critical path* — nothing downstream depends on phases P3–P5.

---

## PART 1 — WHAT'S BUILT TODAY (INVENTORY)

### The Companion Platform — complete and governing

The Companion Platform is **five additive layers** over an unchanged Intelligence Platform spine:

| Layer | Owner (file) | Status | Ready for rollout? |
|---|---|---|---|
| **Personality Registry** | `server/intelligence/conversation/personality-registry.ts` | ✅ Complete (6 voices, all content authored) | Yes |
| **Behaviour Engine** | `server/intelligence/conversation/behaviour-engine.ts` | ✅ Complete (8 exports, all integrated) | Yes |
| **Observation Engine** | `server/intelligence/conversation/observation-engine.ts` | ✅ Complete (4 observation channels, Silence Rules) | Yes |
| **Companion Growth** | `server/intelligence/conversation/companion-growth.ts` | ✅ Complete (trend-signal computation) | Yes, with G6 caveat |
| **Guidance + Experience** | `companion-guidance.ts` + Companion Cards | ✅ Complete (routes, rendering vocabulary) | Yes |

**What is NOT built:** cross-session observation log (G6), household-level personality override (G8), avatar/theme client rendering (G5), unused `InteractionKind` placeholders (G4). These are *deferred* gaps, not blockers.

### The Intelligence Platform spine — unchanged and complete

TIP1–3 (Gateway, Capability Registry, Intent Engine, Conversation Store, Context Frame) are the backbone. The Companion Platform adds:
- One per-turn voice seam (read personality → voice three fallback/guidance points in `conversation-gateway.ts`)
- One request-time observation seam (separate route, not per-turn)

Both seams feed into the same Behaviour Engine for consistent phrasing.

### Food Intelligence — fully activated

M1–M6 completed:
- **M1–M4:** Canonical food identity, plant diversity classification, diversity groups, fermented-food attributes
- **M5:** Trusted activation of 5 new canonical foods (almond-flour, baby-corn, coconut-flour, spelt-flour, white-cabbage)
- **M6:** Platform-wide audit confirming all Tier 1 surfaces consume canonical WS0 model

**All surfaces relevant to Companion observability are on canonical model:**
- Plant Diversity: ✅ Canonical resolver + diversity group
- Meal Detail: ✅ WS0 knowledge registry
- Nutrition Report: ✅ WS0 batch lookup
- Pantry Explore: ✅ Full WS0 + WS8–11 discovery/alternatives/stories/seasonal
- Shopping: ✅ Food additive knowledge (separate, correct domain)

### Roadmap alignment

The Master Evolution Roadmap sequences **WS0 (Knowledge Foundations) → WS1 (Plant Diversity Tier A) → WS2 (Knowledge Layer V1) → WS3–5 (Pantry, WNR, Choose Better).**

The Companion Rollout must interleave with this without creating a blocker. **Key insight:** Plant Diversity (WS1) depends only on WS0 (data quality), not on WS2 (benefit registry). So:
- **Plant Diversity + Companion can roll out in parallel.**
- The Companion doesn't block WS1 Tier A; both are WS0-dependent.
- WS2's benefit registry light up behaviour/observations on both surfaces *together*.

---

## PART 2 — INTEGRATION PATTERNS (WHAT REWORK LOOKS LIKE)

### Per-turn voice seam (Behaviour Engine)

**Where it plugs in:** Three call sites inside `buildGroundedResponse` in `conversation-gateway.ts`:
1. Line ~400: `voiceFallback()` — voice a write-intent gap or fallback
2. Line ~450: `systemPromptFragment()` — append personality tone to LLM prompt
3. Line ~500: `voiceGuidanceSuggestions()` — relabel/reorder suggestions per personality

**Integration cost:** Zero per-turn latency (personality is read once alongside existing role/tier resolution). No new service, no new state, no new API. Just three inline function calls.

**Code stability:** This seam has been tested in production via `EWO1`, `EWO2`, `EWX1` (three workstreams since initial Companion Platform foundation). No changes required to the seam itself. **Rollout = validation only.**

### Observation seam (`GET /api/intelligence/companion/observations`)

**Where it plugs in:** One route, separate from per-turn pipeline. Client calls on panel-open if empty (no history).

**Four independent observation channels:**
1. `observeNutritionTrend` — reads Companion Growth signal (5-sample min), voices via Behaviour Engine
2. `observeStreak` — reads `storage.getUserStreak()`, surfaces every 7-day milestone
3. `observeDiversity` — reads plant-diversity counts, surfaces every 10-food milestone
4. `observeOpportunities` — reads `intelligencePlatform.handle('opportunity-delivery')`, surfaces top opportunity

**Integration cost per channel:** One caller per surface. Fetch the required data (trends, streak, diversity, opportunities) → hand to engine. The engine does the work (compute signal, apply Silence Rules). **No rework between channels — each is independent.**

**Observation availability by surface:**

| Surface | Nutrition Trend | Streak | Diversity | Opportunities | Notes |
|---|---|---|---|---|---|
| **Plant Diversity** | ✅ (goal: monitor plant progress) | ✅ | ✅ (literal count on page) | ⚠ (defer) | Already shows diversity; notice would be redundant. Only trend + streak valuable. |
| **Weekly Nutrition Report** | ✅ (primary observation) | ✅ | ⚠ (WNR shows week, streak is all-time) | ✅ (recommend better meals) | All channels useful; stack priority: trend → streak → opportunity. |
| **Planner (root)** | ⚠ (week is planning window, not history) | ✅ | ⚠ (user controls meals weekly) | ✅ (add to next week) | Streak + opportunity most valuable. Trend deferred until post-WS2. |
| **Shopping (list)** | ⚠ (no meal context) | ✅ | ⚠ (no meal context) | ✅ (add to basket/list) | Streak + opportunity. Trend deferred. |
| **Pantry (explore)** | ✅ | ✅ | ✅ (learn new plants) | ✅ (discover new foods) | All channels fit; this is the learning surface. |
| **Dashboard** | ✅ (health summary) | ✅ | ✅ (visual center) | ⚠ (promote via WNR) | Streak + diversity high-value. Opportunity routed to WNR instead. |

### Guidance layer (Behaviour Engine)

**Current state:** `companion-guidance.ts` is a pre-existing, capability-owned suggestion registry. The Behaviour Engine's `prioritizeGuidance` and `voiceGuidanceSuggestions` already reorder/relabel suggestions per personality.

**Integration cost:** Zero. Surfaces that call `intelligencePlatform.handle()` with an intent already get the guidance set back. The engine just voices it.

**Surfaces where guidance matters:**
- **Planner:** Add meal → guidance suggests uplift/shopping alternatives
- **Shopping:** Browse items → guidance suggests dietary-fit meals
- **Pantry:** Browse foods → guidance suggests recipes/boosts
- **Profile:** Set restrictions → guidance suggests compatible meals

---

## PART 3 — RECOMMENDED ROLLOUT SEQUENCE

### Phase 0: Foundation Validation (1 sprint)

**Scope:** Validate the per-turn voice seam. No new surfaces; test in production-mirrored conversation.

**What:** Wire Behaviour Engine's three call sites in `conversation-gateway.ts` for a test personality (e.g. `friend` instead of default `companion`). Run through the full conversation flow:
1. User sends a write intent (e.g., "Clear my planner") → `voiceFallback()` voices the gap with `friend` tone ✓
2. LLM call → `systemPromptFragment()` appends `friend` personality prompt ✓
3. Suggestions return → `voiceGuidanceSuggestions()` reorders them ✓

**Validation gates:**
- [ ] Personality switches correctly via `user_preferences.companionPersonality` (read once per turn)
- [ ] Three call sites execute without latency regression
- [ ] Phrasing changes are consistent across all three outputs (voice is stable)
- [ ] No regression in existing per-turn tests

**Why P0, not later:** This seam has been designed and tested in prior workstreams (`EWO1–EWX1`); P0 confirms it is production-ready before rolling out observation complexity. De-risks the entire rollout by validating the simplest seam first.

**Risk:** Low. No new state, no new data, no new capability. Just function calls with different inputs.

**Output:** Behaviour Engine is cleared for rollout.

---

### Phase 1: Plant Diversity — Personality + Milestone Observation (1 sprint)

**Scope:** Companion integration to Plant Diversity page + Companion panel with milestone notices.

**Surfaces:** Plant Diversity page (`/plant-diversity`) → Companion panel (side, full-height).

**What rolls out:**
1. **Behaviour layer:** Companion panel greeting voiced per personality
2. **Observation layer:** `observeDiversity()` — "You've reached 12 plants this week!" notices
3. **Growth layer:** Visual milestone marker (every 10 foods)

**Changes required:**
- `client/src/components/conversation/FloatingAssistant.tsx`: Add "diversity milestone" greeting variant
- `server/routes.ts`: Wire `GET /companion/observations` route for diversity-only query (just `observeDiversity()`)
- `client/src/hooks/use-companion-observations.ts`: Call route on panel-open

**Why P1:**
1. **Lowest implementation surface cost.** Diversity is a *number*; observation is simple math (current ≥ 10, 20, 30, … ✓).
2. **Highest delight-per-line.** Plant diversity milestones are discrete, verifiable, and directly tied to a user achievement. The "You hit 15 plants!" moment is the Companion's killer feature.
3. **Unblocked by WS2.** Plant Diversity Tier A (responsive card/table) depends only on WS0. The Companion observation adds no dependency; both can ship on the same timeline.
4. **Validates observation pattern.** Once P1 ships, the `observeNutritionTrend`, `observeStreak`, and `observeOpportunities` channels are straightforward variants of the same pattern.

**Risk:** Low. Diversity data already exists on the page; observation is read-only; Silence Rules gate volume (max 2 notices per session).

**Milestone metric:** Ship P1 if Companion greeting + diversity milestone notice are both shipped and tested live.

---

### Phase 2: Weekly Nutrition Report — Converged Observation (1–2 sprints)

**Scope:** Companion integration to Weekly Nutrition Report + multi-channel observations (trend + streak + opportunity).

**Surfaces:** Weekly Nutrition Report page (`/weekly-nutrition`) → Companion panel.

**What rolls out:**
1. **Behaviour layer:** Companion greeting, voiced per personality
2. **Observation layer (priority-stacked):**
   - `observeNutritionTrend()` (if WS2 landed: "Protein intake up 8% vs. last month")
   - `observeStreak()` (fallback if trend unavailable: "12-day planning streak!")
   - `observeOpportunities()` (if no trend/streak: "Try swapping red meat for fish")
3. **Growth layer:** Trend line chart visualization per personality

**Changes required:**
- `client/src/pages/weekly-nutrition-report.tsx`: Wire Companion panel
- `server/routes.ts`: Extend `GET /companion/observations` to include `observeNutritionTrend`, `observeStreak`, and route to opportunities capability
- `server/intelligence/conversation/observation-engine.ts`: Confirm priority-stacking logic (trend > streak > opportunity)
- Companion Growth signal: Verify 5-sample minimum is met for WS2 food data

**Why P2:**
1. **Converges P1 learning.** Plant Diversity established the observation pattern; WNR applies it to a more complex signal (trend line, multi-outcome fallback).
2. **Highest-value observation surface.** The WNR is the user's weekly story. A notice that "Your protein is climbing, keep it up!" or "Your plant variety jumped — time to lock in more greens?" is the Companion's second flagship pattern.
3. **Trend signal validates growth engine.** P2 is the first surface where `companion-growth.ts`'s signal is wired to a surface. If the minimum-sample gate works, it proves the growth module is production-ready.
4. **Feeds into post-launch evolution.** Once WS2 benefits land, WNR observations can expand to "Your Gut Health foods are strong this week" — observation is future-proof.

**Risk:** Medium. Trend signal depends on data freshness (only fires with 5+ samples in both windows). Fallback to streak observation handles the case; no silent failure.

**Dependency:** Requires WS0 data quality (reconciled nutrient vocab, correct meal-ingredient linkage). Soft dependency on WS2 (if benefits land before P2 ships, observation can be richer; if WS2 slips, P2 ships with trend-signal-or-streak fallback, still excellent).

**Milestone metric:** Ship P2 if multi-channel observation stacking works, fallback is robust, and growth signal is validated in production.

---

### Phase 3: Guidance Layer — Planner + Shopping (1 sprint)

**Scope:** Companion guidance personality-driven reordering on feature-rich surfaces.

**Surfaces:** Weekly Planner (`/planner`) + Shopping List (`/shopping-list`).

**What rolls out:**
1. **Behaviour layer:** `voiceGuidanceSuggestions()` reorders capability suggestions per personality
2. **Guidance examples:**
   - **Planner:** "Add to week" suggestions from Uplift engine, reordered by personality (e.g., `coach` prioritizes "high-protein options"; `friend` prioritizes "familiar-ingredient boost")
   - **Shopping:** "Switch to better option" suggestions from Analyser, reordered per personality (e.g., `chef` says "This olive oil is premium"; `sergeant` says "Cut the UPF score in half")

**Changes required:**
- `client/src/pages/weekly-planner-page.tsx`: Pass personality context to suggestion renderer
- `client/src/pages/shopping-list-page.tsx`: Same
- `server/routes.ts`: Ensure personality is passed through the guidance-retrieval path
- `companion-guidance.ts`: Already capability-owned; no changes (it already supplies the base suggestions)

**Why P3:**
1. **Validates behaviour-engine on complex suggestion sets.** P1–2 tested observations; P3 tests guidance reordering on surfaces with rich suggestion data.
2. **Leverages existing capability architecture.** No new capability needed; personality just reorders what the Capability Registry already produces.
3. **Low-risk polish layer.** If guidance reordering has any rough edge, it's a phrasing detail, never a business-logic change. Easy to roll back.
4. **Sets up post-launch personalization.** Once household-level personality overrides land (G8), Planner and Shopping are the first surfaces that benefit (e.g., "As a household, we prefer chef-like explanations").

**Risk:** Low. Guidance reordering is a pure phrasing layer; the underlying capability logic is unchanged.

**Milestone metric:** Ship P3 if guidance reordering is consistent across personalities and no capability logic is affected.

---

### Phase 4: Breadth — Pantry, Meals, Dashboard (2–3 sprints)

**Scope:** Extend observation + guidance to knowledge-rich and entry-point surfaces.

**Surfaces:**
- **Pantry Explore** (`/pantry?mode=explore`): Discovery opportunity notices + guidance
- **Cookbook / Meals** (`/cookbook`, `/meals`): Guidance on meal selection
- **Dashboard** (`/dashboard`): Summary notices (diversity milestone, streak, trend summary)

**What rolls out per surface:**

**Pantry Explore:**
- Observations: `observeOpportunities()` ("Try [food] — high in Vitamin C, already boosts 3 of your meals"), `observeDiversity()` (if user is learning)
- Guidance: "Recipes featuring this ingredient" suggestions per personality tone
- Why: Pantry is the *learning* surface; observations are discovery-focused

**Cookbook / Meals:**
- Observations: None (meals are browsed, not measured; no trend/streak context)
- Guidance: "Meal matches your restrictions" + "This meal boosts [benefit]" per personality
- Why: Cookbok is pure discovery; personality makes recommendations feel personal

**Dashboard:**
- Observations: `observeDiversity()` (big milestone), `observeStreak()` (habit highlight), summary trend ("Your gut health foods are up 20%")
- Guidance: Promote weekly-report link + shop-list link
- Why: Dashboard is the entry point; observations welcome the user, guidance routes them to deep surfaces

**Changes required per surface:**
- Pantry: Wire observations route + guidance relabeling
- Meals: Wire guidance relabeling only (no observations; meals don't have transaction history)
- Dashboard: Wire all-observation channels (summary surface)

**Why P4:**
1. **Parallelizable.** All three surfaces' observation/guidance patterns are variants of P1–3 patterns. Can parallelize by surface team.
2. **Extends Companion across the full app.** By end of P4, the Companion is not a "nutrition report feature" — it's the platform's unified voice.
3. **Validates observation scale.** P1–2 tested single channels; P4 tests stacking all four (`diversity`, `streak`, `nutrition-trend`, `opportunities`) on dashboard. Silence Rules must handle the volume.
4. **Post-launch foundation.** Once household-level personality lands (G8), Dashboard becomes the household's entry point with household-voiced observations. P4 is the base layer.

**Risk:** Medium. More surfaces = more integration points. Mitigated by reusing P1–3 patterns; no new patterns introduced.

**Dependency:** Requires P1–3 validation. Soft dependency on WS2 (richer observations if benefit registry exists).

**Milestone metric:** Ship P4 if all three surfaces' observations + guidance are wired, Silence Rules work at scale, and no regression in existing surface behavior.

---

### Phase 5: Polish — Cross-Session + Household (Post-launch)

**Scope:** Persistence and household-level customization (deferred per architecture).

**What rolls out (subject to explicit post-launch gate):**
1. **Cross-session Silence Rules** (G6): `companion_observation_log` table tracks shown observations across sessions. New minimum-sample gate per observation type (e.g., "show diversity milestone only every 3 days").
2. **Household-level personality** (G8): Household admin sets a default Companion voice for the household. Per-eater override still works.
3. **Avatar + Theme rendering** (G5): `ExperienceProfile`'s `avatarId`, `colorTheme`, `voiceProfileId` rendered in FloatingAssistant.
4. **Unwired InteractionKind** (G4): Wire `welcome`, `encouragement`, `seasonal` to real producers.

**Why P5 (post-launch):**
1. **Adds schema changes.** P0–4 are code/config-only; P5 needs new table + column. Requires migration review (ENGINEERING_WORKFLOW.md STEP 7).
2. **Enables richer personalization.** Cross-session memory lets observations feel truly personal ("You got 12 plants yesterday, 15 today — keep building!"). Household personality makes the Companion feel like a family voice.
3. **Lower-urgency than core observation.** The Companion is delightful *without* cross-session memory; that's just the polish layer.
4. **Can ship independently.** P0–4 are a complete, shippable rollout. P5 is a separate programme (explicitly flagged in THA_COMPANION_PLATFORM_ARCHITECTURE.md §13).

**Risk:** Medium–High. Schema changes, migration, new persistence model. Requires architecture review.

**Milestone metric (post-launch gate):** Ship P5 only after explicit approval via ENGINEERING_WORKFLOW.md STEP 8 (AI Architecture Compliance) and confirmation that P0–4 shipped without cross-session memory defects.

---

## PART 4 — DEPENDENCY ANALYSIS

### Hard dependencies (must have before rollout)

| Dependency | Status | Blocks which phases? |
|---|---|---|
| **Behaviour Engine production validation (P0)** | ✅ Tested in EWO1–3 | All phases (foundation) |
| **Observation Engine tested (4 channels)** | ✅ Complete | P1–4 (variants of same pattern) |
| **Companion Growth signal (5-sample gate)** | ✅ Complete | P2 (trend observation) |
| **Personality Registry (6 voices)** | ✅ Complete | P0+ (all phases) |
| **Guidance capability wired** | ✅ (pre-existing) | P3+ (guidance layer) |
| **Plant diversity data + resolved canonical food identity** | ✅ (M5/M6 complete) | P1 |
| **Meal-to-recipe linking (via `mealId` seam)** | ⚠ WS0 dependency | P1 (for meal links in diversity notices) |

### Soft dependencies (make rollout easier but not required)

| Dependency | Status | Helpful for which phases? |
|---|---|---|
| **WS0 data quality (9-category enum, nutrient vocab)** | 🟡 In progress (per Master Roadmap) | P2+ (for richer trend observations) |
| **WS2 benefit registry** | 🟡 In progress (per Master Roadmap) | P2+ (for "Your Gut Health" observations), P3 (guidance examples) |
| **Household eaters data fully wired** | ✅ (existing) | P4 (dashboard summary) |
| **User health trends table (`UserHealthTrend`)** | ✅ (existing, assumed) | P2 (trend observation) |

### Blocker analysis

**P1 can ship independent of WS0/WS2.** Diversity milestones are based on canonical-food count, which is already resolved. No blockers.

**P2 depends on WS0 (soft) but not WS2.** Trend observation works as long as `UserHealthTrend` rows exist; benefits are optional. If WS2 slips, P2 ships with "You've held steady this week — great consistency!" instead of "Protein is up 8%". Still valuable.

**P3–4 have no WS2 dependency.** Guidance reordering is pure phrasing; works with any capability output.

**WS1 (Plant Diversity Tier A) and P1 (Companion) are orthogonal.** Both depend on WS0 only. Can roll out in parallel on the same landing date.

---

## PART 5 — IMPLEMENTATION REWORK ANALYSIS

### Minimal rework (why this sequence reduces thrashing)

**Why P1→P2→P3→P4 is optimal:**

1. **Pattern reuse.** P1 (diversity observation) teaches the implementation pattern. P2 applies the *same* pattern (4-channel observation engine, Silence Rules, behaviour voicing) to a different signal (trend). P3 applies the behaviour pattern (guidance reordering) to a new domain (suggestions). P4 applies all three patterns across surfaces without novel patterns.

2. **Cumulative validation.** Each phase validates the prior phase's patterns:
   - P0 validates per-turn voice
   - P1 validates single observation channel  
   - P2 validates multi-channel observation + priority stacking
   - P3 validates guidance layer  
   - P4 validates scale across surfaces
   
   **Result:** Each phase has one uncertain piece; prior phases de-risk it.

3. **No rewriting of shipped code.** P1 ships with `observeDiversity()`. P2 *adds* `observeNutritionTrend()` and `observeStreak()` to the same route, but `observeDiversity()` is unchanged. P4 reuses all three channels on new surfaces without refactoring them.

4. **Behaviour Engine changes once (P0).** Everything after P0 is configuration (which personality, which observation channel per surface, which guidance priorities). No code rewrites.

### Rework avoided by this sequence

**If sequence were different (e.g., P3 before P1):**
- P3 would ship guidance reordering without testing observations.
- When P1 lands, both systems would be in production simultaneously.
- Any interaction between guidance and observation (e.g., observation wording conflicts with guidance tone) would require rework.
- **Cost: 1 sprint of refactoring, 2–3 regression risks.**

**If P1 and P2 were attempted simultaneously:**
- Diversity observation and trend observation would be in development in parallel.
- Testing Silence Rules with both channels would be complex.
- When one ships first, the second would need regression testing.
- **Cost: 1 sprint of testing, 1 risk of cross-channel interaction bugs.**

**By sequencing P0→P1→P2→P3→P4:**
- Each phase validates the prior phase's patterns in production.
- Rework is *additive* (add new channels, add new surfaces), not *corrective*.
- **Result: Minimal thrashing, maximum confidence.**

---

## PART 6 — USER VALUE TIMELINE

### Phase-by-phase user impact

| Phase | User impact | Timeline | Launch value? |
|---|---|---|---|
| **P0 (Foundation)** | No user-facing change | — | (Validation only) |
| **P1 (Plant Diversity)** | "You hit 15 plants!" notice on diversity report | W1–W2 | ✅ **Yes.** Flagship feature; delightful. |
| **P2 (Weekly Nutrition Report)** | "Your protein is up 12%" notice on nutrition report | W3–W4 | ✅ **Yes.** If WS2 ready; fallback to streak if not. |
| **P3 (Guidance)** | Suggestions reordered per personality on Planner/Shopping | W5 | ⚠ **Optional.** Nice-to-have; guidance already shipped. |
| **P4 (Breadth)** | Companion greetings + observations on Dashboard, Pantry, Meals | W6–W8 | ✅ **Yes.** Complete experience; not entry-point dependent. |
| **P5 (Polish)** | Cross-session memory, household voice, avatar | Post-launch | 🚀 **Yes, post-launch.** Transforms Companion to household assistant. |

### Launch readiness by phase

**Phases P1 + P2 + P4 = "Companion is launched."**

- Plant Diversity (P1) offers the flagship observation (diversity milestone).
- Weekly Nutrition Report (P2) offers the trend observation.
- Dashboard (P4) offers the welcome + summary.

Together, these three surfaces give the Companion a complete, interconnected presence across the knowledge critical path. **The Companion is not "barely shipped" — it is the unified voice of the platform's three most important surfaces.**

P3 (Guidance) is valuable but not critical for launch; it's a polish layer on existing suggestions.

P5 (Cross-session, Household) is explicitly post-launch (per THA_COMPANION_PLATFORM_ARCHITECTURE.md §13).

---

## PART 7 — RISK ASSESSMENT

### Per-phase risk matrix

| Phase | Technical risk | Integration risk | Production risk | Mitigation |
|---|---|---|---|---|
| **P0** | Low (validation only) | Low (3 call sites, tested) | Low (no new data) | Run existing test suite; manual conversation flow test |
| **P1** | Low (simple math) | Low (new route, but isolated) | Low (read-only observation) | Silence Rules gate; notice cap = 2 |
| **P2** | Medium (trend signal depends on data freshness) | Medium (two channels, stacking) | Medium (makes a claim: "up 12%") | Fallback to streak; minimum-sample gate; source requirement |
| **P3** | Low (pure phrasing) | Low (no new logic) | Low (reorders, doesn't add) | Guidance already validated; behaviour reordering is deterministic |
| **P4** | Medium (scale; four channels) | High (three surfaces, cross-team) | Medium (multi-surface coordination) | Parallelize by surface; validate Silence Rules at scale; staged rollout per surface |
| **P5** | High (schema change) | High (new table + migration) | High (persistence, household scope) | Post-launch gate; explicit architecture review required |

### Production guardrails (inherited from architecture)

All phases inherit THA_COMPANION_PLATFORM_ARCHITECTURE.md's non-negotiables (§12):
- ✅ **Behaviour/Observation never change what is claimed, what is permitted, or what requires confirmation.** (Voicing only, routing unchanged.)
- ✅ **Behaviour/Observation never invoke a capability directly; they voice/notice already-produced output.** (Data flows through existing owners.)
- ✅ **One Companion, one conversation, one Behaviour Engine, one Observation Engine.** (No duplication by construction.)
- ✅ **Honest gaps over fabrication.** (Silence Rules, minimum-sample gates, fallbacks.)

**Risks that are mitigated by construction:**
- Companion can't bypass permission boundaries (voices same output existing owner already vetted).
- Companion can't fabricate facts (notices only "notable" milestones already computed).
- Companion can't create a second assistant (one conversation store, one voice pipeline).

---

## PART 8 — COMPARISON WITH ALTERNATIVE SEQUENCES

### Alternative 1: Breadth-first (P4 before deep features)

**Sequence:** P0 → P3 (guidance on all surfaces) → P1 → P2 → P4

**Pros:**
- Gets "Companion voice everywhere" earlier (surfaces all have personality tone in suggestions)

**Cons:**
- P3 (guidance) ships without validation of observations; when observations land in P1, both systems must coexist
- Guidance-observation interactions are untested; higher regression risk
- **Rework:** P1 might require tweaks to coexist with P3's guidance phrasing
- P2 can't validate trend stacking without P1 observation baseline

**Verdict:** Higher rework (1+ sprint), lower confidence. ❌

### Alternative 2: Observation-first (P2 before P1)

**Sequence:** P0 → P2 (WNR full observations) → P1 → P3 → P4

**Pros:**
- Trend observation is complex, so shipping it first "gets the hard part done"

**Cons:**
- P2 depends on WS0 + (soft) WS2; P1 needs only WS0
- If P2 slips on WS2 schedule, P1 can't ship independently
- **Rework:** If WS2 slips and trend observation fails, P2 must regress to streak-only observation (equivalent to what P1 validates)
- P1 can't validate Silence Rules at single-channel scale before P2 adds complexity

**Verdict:** Higher dependency risk, potential for p2 → P1 rework. ❌

### Alternative 3: Guidance-first (P3 before observations)

**Sequence:** P0 → P3 → P1 → P2 → P4

**Pros:**
- Guidance is lower-risk than observations

**Cons:**
- Observations are the flagship feature (diversity milestones); deferring them delays the core value
- Guidance alone doesn't showcase the Companion's unique value
- **User impact:** User sees "reordered suggestions" before seeing "You hit 15 plants!" — less delightful

**Verdict:** Suboptimal user value, harder to justify Companion investment. ❌

### Recommended sequence reaffirmed

**P0 → P1 → P2 → P3 → P4 is optimal because:**
1. ✅ **Minimal rework** (cumulative validation, pattern reuse)
2. ✅ **Highest user value first** (P1 is the killer feature)
3. ✅ **Least dependency risk** (P1 needs only WS0; P2 is soft-dependent on WS2)
4. ✅ **Production confidence** (each phase validates prior phase's patterns)
5. ✅ **Launchable by P1+P2+P4** (three surfaces = complete experience)

---

## PART 9 — LAUNCH DEFINITION

### Companion launch = P1 + P2 + P4 on critical-path surfaces

**"The Companion is launched" when:**

- [ ] **P1 complete:** Plant Diversity panel shows "You've reached [N] plants!" notices ✓
  - Diversity milestone observation wired
  - Behaviour voicing validated
  - Silence Rules gate verified
  - User can dismiss/interact with notices

- [ ] **P2 complete:** Weekly Nutrition Report panel shows trend/streak/opportunity notices ✓
  - Multi-channel observation stacking works
  - Growth signal validated in production
  - Fallback to streak if trend unavailable
  - All three notice types coexist without conflict

- [ ] **P4 (Dashboard) complete:** Dashboard entry point shows summary notices ✓
  - All observation channels integrated
  - Silence Rules handle 4-channel volume (2-notice cap verified)
  - No horizontal scroll / clipped notices / overcrowding at responsive breakpoints

**Additional requirements (cross-cutting):**

- [ ] Personality reads fresh per turn (no caching)
- [ ] Observation route is independent (no per-turn latency impact)
- [ ] All notices are dismissible/interactive (not just informational)
- [ ] Architecture compliance checklist from THA_COMPANION_PLATFORM_ARCHITECTURE.md §12 passes
- [ ] No regression in per-turn conversation quality (P0 validation still holds)

**Non-launch requirements (explicitly deferred):**

- ~~P3 (Guidance reordering)~~ — valuable, but not required for launch
- ~~P5 (Cross-session memory, household voice)~~ — post-launch (explicit gate)
- ~~Avatar/theme rendering (G5)~~ — scaffolded, not shipped
- ~~Unwired InteractionKind (G4)~~ — placeholder, can wait

---

## PART 10 — TIMELINE ESTIMATE

### Sprint breakdown

| Phase | Scope | Est. sprints | Owner | Parallel? |
|---|---|---|---|---|
| **P0** | Behaviour validation (conversation-gateway.ts) | 1 | AI/Conversation team | Sequential (foundation) |
| **P1** | Diversity observation (observation-engine, routes, FloatingAssistant) | 1 | AI team + Frontend (diversity) | After P0 |
| **P2** | Trend/streak/opportunity observation (multi-channel, stacking) | 1–2 | AI team + Analytics (growth signal) | After P1 |
| **P3** | Guidance reordering (companion-guidance, behaviour voicing) | 1 | AI team | Parallel with P2 or P4 |
| **P4** | Breadth (Pantry, Meals, Dashboard) | 2–3 | AI team + 2 Frontend teams | Parallel with P3 (or after P1) |
| **P5** | Cross-session + household (schema, migration, new table) | 2–3 | Data + AI team | Post-launch gate |

**Critical path:** P0 → P1 → P2 → P4 = **5–7 sprints** (2.5–3.5 months) *or concurrent with WS0–WS2 launch work.*

**If P3 parallelizes with P2 or P4:** Total time is ~5 sprints (not additive).

**If P4 parallelize with P2:** Total time is ~4–5 sprints (most optimistic).

### Interleaving with Master Evolution Roadmap

**Master Roadmap timeline (per docs):**
- WS0 (Knowledge Foundations): ~2 weeks (data quality only)
- WS1 (Plant Diversity Tier A): ~3 weeks (responsive polish)
- WS2 (Knowledge Layer V1): ~6–8 weeks (editorial, sourcing, nutritionist review)
- WS3–5 (Pantry, WNR, Choose Better): ~4–6 weeks (integration and polish)

**Companion timeline (recommended):**
- P0: Weeks 1–2 (validate behaviour; happens in parallel with WS0)
- P1: Weeks 2–4 (diversity observation; happens in parallel with WS1 responsive work)
- P2: Weeks 4–6 (trend/streak observation; happens as WS2 begins)
- P3–4: Weeks 6–10 (guidance, breadth; happens during WS3–5 integration)

**Result:** Companion is "ready to launch" (P0–P2 complete) around week 6, same time WS1 + WS2 begin converging. P4 completes as WS3–5 polish happens.

---

## PART 11 — DECISION POINTS

### Pre-P0: Architecture signoff

**Gate:** THA_COMPANION_PLATFORM_ARCHITECTURE.md is adopted as governing architecture.

**Verification:** ✅ Already done (promoted to governing 2026-07-03).

### Pre-P1: WS0 data quality

**Gate:** `mealId` seam exists on `WeekMealEntry`; 9-category enum reconciled (avocado → Healthy Fats); canonical food identity resolved.

**Verification:** ✅ M5/M6 complete; canonical foods activated; plant classification tested.

**Status:** Ready.

### P2→P3 decision: Skip P3 or include?

**Question:** Should Guidance reordering (P3) ship at launch, or defer?

**Data:**
- P3 is pure phrasing (low risk)
- P3 is not on the critical path (guidance already ships without reordering)
- P3 adds 1 sprint but unlocks personality on two feature-rich surfaces (Planner, Shopping)

**Recommendation:** Include P3 at launch. It is low-risk polish that makes the Companion feel cohesive across the app. Defer only if timeline is critical; it can always ship as a 1-sprint fast-follow.

### P2→P4 decision: How to parallelize?

**Question:** Can P4 (breadth) start before P2 (WNR) finishes?

**Answer:** Yes, but with dependency warning.

- P4 (Pantry, Meals, Dashboard) can start in parallel with P2 once P1 is validated.
- Pantry and Meals observations are independent (don't depend on trend signal).
- Dashboard depends on all channels; wire it last to avoid rework.

**Recommendation:** Start Pantry/Meals in P2 week 2 (parallel). Wire Dashboard in week 5, after trend observation stacking is tested.

### Post-launch: P5 approval

**Gate:** Explicit ENGINEERING_WORKFLOW.md STEP 8 review (AI Architecture Compliance) + confirmation that P0–P4 shipped without cross-session memory defects.

**Verification:** Pending. Record decision date when P4 ships.

---

## CONCLUSION

**The Companion Platform spine is complete and governing. Its rollout is not "how to build it" but "which surfaces unlock its value first."**

The recommended sequence **P0 → P1 → P2 → P3 → P4** optimizes for:
1. **Minimal rework** (cumulative validation; each phase teaches the next)
2. **Highest user value first** (diversity milestones, trend observations)
3. **Quickest path to launch** (P1+P2+P4 = complete experience by week 6)

**Launch value is delivered in three surfaces:**
- **Plant Diversity:** Flagship observation (diversity milestones) + personality voicing
- **Weekly Nutrition Report:** Multi-channel observation (trend/streak/opportunity) + growth validation
- **Dashboard:** Entry-point summary + personality greeting

Together, these three surfaces make the Companion the unified voice of THA's knowledge-critical path. The Companion is not a feature — it is how THA talks to its users.

**No implementation is recommended by this investigation. The sequence above is a proposal for the engineering team's review, approval, and execution.**

---

*Document created via investigation COMPANION_ROLLOUT_SEQUENCE (2026-07-04)*
*References: THA_COMPANION_PLATFORM_ARCHITECTURE.md (EWO-CPA1), THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md (TIP1), THA_MASTER_EVOLUTION_ROADMAP.md, M5/M6 Food Intelligence Activation*
*Status: READY FOR REVIEW — No code changes, architecture-level recommendation only*
