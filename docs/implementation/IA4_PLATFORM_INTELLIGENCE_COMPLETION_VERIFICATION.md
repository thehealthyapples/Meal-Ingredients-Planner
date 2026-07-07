# IA4 — Platform Intelligence Completion Verification

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Mode:** Implementation Verification (one activation gap found and closed; all other findings are governance findings, not implementation).
**Risk:** 🟢 GREEN — one small, additive conversational-routing change (zero new capabilities, zero new verbs, zero schema changes, zero new stores); everything else in this document is verification/audit output.
**Rollback tag:** `rollback/before-ia4-completion-verification-20260704` → `ff3b2cf` (the HEAD this wave started from — identical to IA1's, IA2's and IA3's own starting point; nothing between that commit and this wave's edits was reverted or altered).

---

## OBJECTIVE

Review the completed Intelligence Activation programme (`IA1`, `IA2`, `IA3`) against the governing architecture, treating the repository as the source of truth rather than the prior waves' own self-reported claims. Determine whether every existing Intelligence Platform capability has now been activated, and specifically verify:

1. No dormant platform capabilities remain.
2. No duplicate intelligence pathways exist.
3. All registered capabilities have at least one real consumer.
4. Intelligence remains permission-aware.
5. One Intelligence Platform and one Companion are preserved.
6. No remaining launch-critical Intelligence Activation gaps exist.

Where an activation gap was found, close it. Where a real finding is **not** an activation gap (a design decision, a dead-code hygiene item, a future phase not yet started), name it and prioritise it, but do not implement it — implementing non-activation-gap findings is out of this task's scope by its own governing instruction.

---

## METHOD

Every claim below was checked directly against the current working tree (`grep`, `read`, and running the actual test suites) — not assumed from `IA1`/`IA2`/`IA3`'s own prose. Three claims in the existing documentation set were found to be stale or inaccurate during this process; each is named at the point it is corrected, not silently fixed.

---

## GOVERNING ARCHITECTURE (reviewed before starting)

- **`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)** — a capability can be `registered` (metadata only), `available` (handler bound, executable), or reachable-but-**dormant** (available, yet no real consumer ever calls it). Activation closes the gap between `available` and actually-reached. TIP1's own phased roadmap (§14) also makes Phase 3 (Admin Intelligence) and Phase 4 (Developer Intelligence, physically isolated) explicit **future** phases — a capability descriptor that exists for a phase that has not started yet is an honest placeholder, not a dormancy defect.
- **`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`** — the standard this document borrows for "duplicate pathway" analysis: two mechanisms answering the same question about the same domain are a defect; two mechanisms answering genuinely different questions that happen to share vocabulary are not.
- **`docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md`** — §10 ("One of Each — Confirmed") and §11 ("Gaps and Missing Governance") are the direct precedent for this document's own method: re-verify structural singularity directly (grep for a second engine/registry/store) rather than citing a prior verification as still valid.
- **`docs/implementation/IA1_PLATFORM_INTELLIGENCE_ACTIVATION_WAVE_1.md`, `IA2_DORMANT_CAPABILITY_ACTIVATION.md`, `IA3_INTELLIGENCE_LOOP_ACTIVATION.md`** — the three prior waves. Each named items it deliberately deferred; this document checks whether those deferrals are still accurately characterised and whether anything **not** named by any of the three waves has been missed.

---

## PART 1 — CAPABILITY-BY-CAPABILITY CONSUMER AUDIT

`server/intelligence/capability-registry.ts` declares **23 capabilities**. Each was checked for a real consumer — a route, page, or conversational pattern that actually reaches it, not merely a test that proves the handler works in isolation.

| # | Capability | Availability | Real consumer found | Verdict |
|---|---|---|---|---|
| 1 | `planner` | available | `/api/planner/*` routes (multiple pages) + conversational surface-primary | ✅ |
| 2 | `shopping` | available | `/api/shopping-list/*`, `/api/shopping/*`, Shopping page | ✅ |
| 3 | `nutrition-knowledge` | available | Pantry Explore, Food Report, extensive conversational pattern coverage | ✅ |
| 4 | `meals` | available | Cookbook/Meals pages, conversational patterns | ✅ |
| 5 | `meal-discovery` | available | Conversational search patterns (10 matcher hits) | ✅ |
| 6 | `diary` | available | Food Diary page, conversational patterns | ✅ |
| 7 | `profile` | available | Always-on baseline query, every conversational turn | ✅ |
| 8 | `partners` | available | `/api/basket/supermarkets-enhanced`, conversational patterns | ✅ |
| 9 | `pantry` | available | Pantry page, conversational patterns | ✅ |
| 10 | `analyser` | available | `/api/scan`, `/api/products/barcode/*`, conversational patterns | ✅ |
| 11 | `household` | available | Household routes, Profile page, conversational patterns | ✅ |
| 12 | `templates` | available | `/api/plan-templates/*`, conversational patterns | ✅ |
| 13 | `nutrition-discovery` | available | Conversational macro-filter patterns | ✅ |
| 14 | `planner-discovery` | available | Conversational patterns | ✅ |
| 15 | `pantry-discovery` | available | Conversational patterns | ✅ |
| 16 | `diary-discovery` | available | Conversational patterns | ✅ |
| 17 | `shopping-discovery` | available | Conversational patterns | ✅ |
| 18 | `household-discovery` | available | Conversational patterns | ✅ |
| 19 | `food-intelligence` | available | **`report` verb: yes (via `opportunity-delivery`, 5 pages). `recommend`/`explain` verbs: NO real consumer found — see Finding 1, closed this wave.** | ⚠️ → ✅ (fixed) |
| 20 | `opportunity-delivery` | available | `GET/POST /api/intelligence/food-opportunities/*`, 5 pages (Dashboard, Planner, Cookbook, Pantry, Shopping) | ✅ |
| 21 | `evidence-learning` | available | `GET/POST /api/intelligence/learning-signals/*`, Profile page (IA2) | ✅ |
| 22 | `administration` | **registered, not bound** | None via the platform — admin operations run through ordinary `/api/admin/*` routes and `assertAdmin`, unrelated to the Intelligence Platform. This is TIP1 Phase 3 ("Admin Intelligence"), an explicitly future, not-yet-started phase — not a regression. | ℹ️ not an activation gap (see Part 3) |
| 23 | `developer` | **`availability: "never"` by design** | None, intentionally — TIP1 §7 requires the developer plane to be physically isolated from user traffic; a capability marked `"never"` in the canonical user-facing registry is correct, not a defect. | ✅ (correct by design) |

**21 of 21 "available" capabilities now have at least one real consumer** (20 already did; `food-intelligence` did not, until this wave). The two capabilities without a bound handler (`administration`, `developer`) are honest placeholders for future, explicitly-named phases (TIP1 §14 Phases 3–4), not capabilities that were built and then left unreached — a materially different situation from "dormant," and outside Intelligence *Activation*'s own scope (which activates existing, already-built reach — it does not build Phase 3/4).

---

## FINDING 1 — `food-intelligence`'s `recommend`/`explain` verbs were genuinely dormant (closed this wave)

**What was claimed.** `capability-registry.ts`'s own description of `food-intelligence` (unchanged since FI3): *"The foundation Domain Intelligence engine consumed by Companion today…"* `docs/implementation/FI3_FOOD_INTELLIGENCE_ENGINE_FOUNDATION.md` line 7 makes the identical claim, then contradicts itself 300 lines later (line 375): *"Wire one real domain consumer… to prove the capability end-to-end for a real surface"* — named as **unstarted** future work in the same document.

**What the code actually showed.** A full-repository grep for the capability id `"food-intelligence"` combined with tracing `conversation-gateway.ts`'s default resolver (`PatternIntentResolver`) found:
- The `report` verb (FI4, ambient Food Opportunities) **is** genuinely reached — `opportunity-delivery`'s framework calls `intelligencePlatform.handle({ capabilityId: "food-intelligence", verb: "report" })` internally as its sole registered producer, and that chain is real, tested, and live on five pages (confirmed by tracing `defaultProducerFetch` in `server/intelligence/opportunity-delivery/framework.ts:300-307`).
- The `recommend` and `explain` verbs (FI3, the original join+rank+explain, citation-backed, household-aware engine) had **zero** references anywhere in `pattern-intent-resolver.ts`, `conversation-gateway.ts`, or `server/routes.ts` outside their own isolated unit tests (`test-intelligence-food-intelligence-binding.ts`) and one registry-executability assertion. `client/src/components/meal-detail/MealFoodIntelligenceSection.tsx` calls a **different, older, unrelated** system — `/api/meals/:id/food-intelligence` (`server/services/meal-food-intelligence.ts`, WS0X.6, a meal-detail context assembler that predates the Intelligence Platform entirely and reads WS0/discovery data directly, never through the capability registry). The name collision between these two systems is real but not a Source-of-Truth violation — they answer different questions (a meal's own ingredient context vs. a ranked, cross-food recommendation for a benefit/nutrient) — named here so a future reader does not conflate them (see Part 5, minor item).

**Why this is exactly the shape of gap `IA1`/`IA2`/`IA3` were built to close, and why none of them found it.** All three prior waves worked from the two launch-experience audits' own worklists (`EWO_DOMAIN_FUTURE_STATE_AUDIT.md`, `EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md`) — neither audit happened to name this specific verb-level gap, because both are UX-completeness surveys of pages, not a capability-by-capability registry audit. This document's method (enumerate every registered capability, grep for its real consumer, verb by verb) is what surfaced it.

**What was implemented.** `server/intelligence/pattern-intent-resolver.ts` gained one new matcher group, `FOOD_INTELLIGENCE_RECOMMEND_MATCHERS` (three patterns: *"recommend foods for X"*, *"suggest foods for X"*, *"what should I eat for X"*), reusing the exact same `KNOWN_NUTRIENT_TERMS`/`KNOWN_BENEFIT_TERMS` guards and `toSlug()` normalisation the adjacent, already-live `NUTRITION_BENEFIT_FOODS_MATCHERS` group already uses — zero new vocabulary, zero new entity-extraction logic. The new matchers are strictly **additive**: they target the `food-intelligence` capability while the existing matchers keep targeting `nutrition-knowledge`, and because the resolver's own deduplication is per-capability (INT33), both fire for a qualifying utterance — the LLM is grounded with *both* a keyword search list *and* a ranked, household-aware, citation-backed recommendation, never a replacement of the existing behaviour. A term matching neither vocabulary (e.g. *"recommend foods for dinner tonight"*) is an honest non-match — `food-intelligence` is never invoked with a guessed scope.

**What this activates for free, with zero further code change.** `capability-registry.ts`'s `GUIDANCE` and `ENRICHMENT` tables already declared a full `food-intelligence` journey (`recommend → meals(read) → planner(read)`) and contextual enrichment copy (INT39/INT41) — configured since FI3/FI4 but never triggered live, because the capability was never reached. The moment `recommend` returns `ok-data` for a real turn, the existing, unmodified `buildGuidanceSuggestions`/`voiceGuidanceSuggestions` pipeline (already exercised by every other capability) surfaces that journey for the first time. No guidance, enrichment, or Companion code was touched.

**What remains (named, not fixed).** `explain` (a single-food drill-down within an already-fetched `recommend` result) still has no conversational trigger of its own. This is a materially smaller residual: `recommend`'s own citations already answer "why is this food recommended" inline, and no real UI renders `recommend`'s output as cards with a per-food "explain more" affordance yet (which would be the natural second trigger for `explain`, mirroring how `opportunity-delivery`'s cards already work). Manufacturing a synthetic NL pattern for "explain broccoli's role in my iron recommendation" without that UI existing would be over-fitting the resolver to a phrasing no real user surface produces yet. Left as a small, non-launch-blocking follow-up, not part of this wave's fix.

---

## PART 2 — DUPLICATE INTELLIGENCE PATHWAY AUDIT

Two items were found and independently re-verified against current HEAD (not merely re-cited from `IA1`/`IA2`'s prose):

### D1 — Confirmed, real, NOT an activation gap: the Planner page's two "opportunity" surfaces

`client/src/pages/weekly-planner-page.tsx` (and, per `IA1`, other pages too) renders **both** `PlannerIntelligenceStrip` and `FoodOpportunitiesPanel` side by side. Tracing each to its source, live at current HEAD:

- `PlannerIntelligenceStrip`'s `opportunity` field (`client/src/components/PlannerIntelligenceStrip.tsx:44,133-134,251-254`) is fed by `GET /api/planner/weeks/:weekId/intelligence` (`server/routes.ts:11247-11253`), which calls `shared/discovery/engine.ts`'s `discover({ types: ["broaden_horizons", "seasonal"] })` — the WS8 Discovery Engine.
- `FoodOpportunitiesPanel` (same page) is fed by `opportunity-delivery`'s `report` verb — FI4's Food Opportunity Engine.

These are **two different engines, both legitimately named "opportunity," on the same page**, exactly as `IA2` found and named (not resolved) on 2026-07-04. Re-confirmed live: the code itself already carries a self-aware comment at `weekly-planner-page.tsx:1965` acknowledging the split ("a separate, own-owner strip"). This is not a Source-of-Truth violation (the two engines answer genuinely different questions — "what's seasonally interesting to try" vs. "here's an actionable gap in your own planner/pantry/shopping activity") but it is a real, user-visible duplication of *presentation vocabulary* that a household has no way to tell apart. **Not an activation gap** — nothing here is dormant; both pathways are fully live and correctly attributed. It requires a design decision (which visual frame wins, whether to fold one field into the other) that this document's own scope — verification plus activation-gap-only implementation — does not authorise. **Named and prioritised (Part 4), not implemented**, exactly as `IA1` and `IA2` each concluded.

### D2 — Confirmed, real, NOT an activation gap: the orphaned `growth-insight` route

`GET /api/intelligence/companion/growth-insight` (`server/routes.ts:11401`) remains registered and functional. Re-confirmed live: zero client-side references anywhere in `client/src` (the only remaining reference is a comment in `FloatingAssistant.tsx:1245` documenting its own supersession). It re-derives the exact same signal `companion-growth.ts` already computes for `GET /api/intelligence/companion/observations` — not a second *owner*, just a second, unreached *route* onto the same computation. Named in `THA_COMPANION_PLATFORM_ARCHITECTURE.md` §11 (G2) and deferred, unchanged, by `IA2` and `IA3` both ("safe, trivial, but a deletion, not an activation"). Still true. **Not an activation gap** (there is nothing to activate — it needs deletion, not a consumer) — named and prioritised (Part 4), not implemented.

### D3 — No other duplicate pathway found

Beyond D1/D2, no other case was found where two live mechanisms answer the same question for the same domain. The Companion Platform's own §7 (`opportunity-delivery`'s `observeOpportunities` vs. `FoodOpportunitiesPanel`) is **not** a third instance of this pattern — both read the *same* `opportunity-delivery` capability's output through two legitimately different, already-governed presentation channels (Companion's silence-ruled single notice vs. a page's persistent multi-item panel), exactly as that architecture document's §7 already names and permits.

---

## PART 3 — "NO DORMANT CAPABILITIES REMAIN" — FINAL STATE

- **21 of 21 bound capabilities** now have at least one real consumer (Part 1; `food-intelligence` closed this wave).
- **`administration` and `developer`** are registered-but-unbound by design, corresponding to TIP1's own explicitly future Phases 3 and 4. These are not part of Intelligence *Activation*'s scope (activating what already exists) — building Admin/Developer Intelligence is new capability construction, a different, later programme TIP1 itself already names and sequences. Recorded here so a future reader does not mistake "23 registered, 21 bound" for an incomplete activation — it is the correct, honest count for a programme whose job was never to build Phases 3–4.

**No dormant capability remains within Intelligence Activation's own scope.**

---

## PART 4 — PRIORITISED FINDINGS SUMMARY

| # | Finding | Activation gap? | Action this wave | Priority if ever picked up |
|---|---|---|---|---|
| 1 | `food-intelligence` `recommend`/`explain` had no real consumer | **Yes** | **Fixed** — `recommend` wired via 3 new resolver patterns | Closed |
| 1b | `food-intelligence` `explain` still has no trigger of its own | Marginal (needs a UI drill-down surface to be worth triggering) | Not fixed — no real surface would consume it yet | Low — revisit once/if `recommend`'s output gets its own card UI |
| 2 (D1) | Planner/Cookbook/Pantry's two differently-sourced "opportunity" widgets | No — both already live, needs a design call | Named, not implemented | Medium — real user-facing ambiguity, needs a design pass (unchanged from IA1/IA2's own conclusion) |
| 3 (D2) | Orphaned `GET /companion/growth-insight` route | No — needs deletion, not activation | Named, not implemented | Low — safe, trivial, a hygiene pass whenever convenient |
| 4 | `administration`/`developer` capabilities unbound | No — future phases (TIP1 §14 Phase 3/4), not started | Named, not implemented | N/A — belongs to a future, separate programme, not this one |
| 5 | Naming collision: two unrelated systems both called "food intelligence" | No — documentation clarity only, not a SoT violation | Named, not implemented | Low — a one-line disambiguating comment/rename would help a future reader, no functional risk today |

**No launch-critical Intelligence Activation gap remains.** Findings 2 and 3 are real but explicitly non-blocking (both have been correctly triaged as "safe to defer" by three successive prior waves, and this wave's independent re-verification agrees); findings 4 and 5 are out of this programme's scope by definition.

---

## PART 5 — PERMISSION-AWARENESS VERIFICATION

Every one of the 21 bound capabilities declares a `permissions` block (`minimumRole`, `knowledgeClass`, `ownershipScoped`, `audited`) enforced centrally by `server/intelligence/permissions.ts` (`resolveContext`, `canInvokeCapability`, `canAccessKnowledgeClass`, `roleMeetsMinimum`) — not by any per-handler ad hoc check. Spot-verified:

- **`food-intelligence`** (this wave's own change): `{ minimumRole: "user", knowledgeClass: "public", ownershipScoped: false }`. The handler (`food-intelligence-read-handler.ts`) answers anonymous callers with Stage-1 (static, cited) recommendations and upgrades to a Stage-2, household-aware answer **only** using `context.userId` — resolved server-side from the authenticated session by `intelligencePlatform.contextFor(user)`, never a client-supplied id. This wave's change adds a new conversational *trigger* only; it does not touch `context` resolution, the handler, or the permission gate — the exact same enforcement path every other capability already goes through.
- **`administration`**: `{ minimumRole: "admin", knowledgeClass: "admin", ownershipScoped: false, audited: true }` — correctly the most restrictive profile on the registry.
- **`developer`**: `availability: "never"` — physically unreachable in this (canonical, user-facing) registry instance, per TIP1 §7's isolation requirement.
- **`evidence-learning`/`opportunity-delivery`** (IA2/IA3's own additions): both `ownershipScoped: true`; both verified (by IA2/IA3, re-spot-checked here) to resolve `householdId`/`userId` server-side only, never from client input.

**No permission regression found anywhere in the current working tree.** Intelligence remains permission-aware exactly as TIP1 §6 requires.

---

## PART 6 — "ONE INTELLIGENCE PLATFORM, ONE COMPANION" — RE-VERIFIED, NOT ASSUMED

Re-run directly against current HEAD (not cited from a prior wave's own claim):

| Claim | Check | Result |
|---|---|---|
| One `CapabilityRegistry` / one `IntelligencePlatform` singleton | `grep -rl "new CapabilityRegistry(\|new IntelligencePlatform("` outside tests | Exactly one file (`server/intelligence/intelligence-platform.ts`) | ✅ |
| One Personality Registry, one Behaviour Engine, one Observation Engine | `find` for each filename | Exactly one of each (`personality-registry.ts`, `behaviour-engine.ts`, `observation-engine.ts`) | ✅ |
| One conversation store, one conversation gateway | `find` for each filename | Exactly one of each | ✅ |
| One default intent resolver | `conversation-gateway.ts` constructor | Defaults to the singleton `patternIntentResolver`; this wave extended it, did not fork it | ✅ |

**Confirmed: one Intelligence Platform, one Companion, no duplicated ownership anywhere in the current working tree.**

---

## VERIFICATION PERFORMED

- **`npx tsc --noEmit`** — zero errors in `server/intelligence/pattern-intent-resolver.ts` or `server/tests/test-intent-resolver.ts`. The repo's pre-existing baseline (170 errors, entirely in unrelated files, the same category IA1/IA2/IA3 each recorded) is unchanged — neither file this wave touched appears in the error output.
- **`npx tsx server/tests/test-intent-resolver.ts`** — **139 passed, 0 failed**, including 15 new assertions (§8: `food-intelligence recommend` fires correctly for benefit and nutrient terms, fires *alongside* the existing `nutrition-knowledge` match rather than replacing it, and correctly does **not** fire for a term matching neither vocabulary).
- **`npx tsx server/tests/test-intelligence-food-intelligence-binding.ts`** — 36 passed, 0 failed (unchanged; confirms the handler this wave's new triggers now reach was already correct and remains so).
- **`npx tsx server/tests/test-intelligence-conversation-gateway.ts`** — 64 passed, 0 failed (unchanged; confirms the generic, capability-agnostic grounding pipeline this wave relies on — `queryCapability`'s plain `JSON.stringify(outcome.result)`, no per-capability allow-list — needed no change to carry the new capability's data).
- **`npx tsx server/tests/test-intelligence-registry-executability.ts`** — 124 passed, 0 failed (unchanged; confirms `food-intelligence` was already correctly `available` with truthful `executableIntents` before this wave — the gap was reach, not registration).
- **`npm test`** (full chain, all `intelligence-*-binding` + platform suites) — run to confirm zero regressions platform-wide from this wave's one-file conversational-routing change.

---

## DATA IMPACT

- **Reads existing data only.** No new table, no new column, no new capability, no new verb, no new handler.
- **Writes:** none. This wave adds a conversational *trigger* (pattern-matching only) onto an already-existing, already-permission-checked, already-tested read-only handler.
- **Schema:** unchanged.
- **Requires backfill:** no.

---

## TRUST CHECK

- **Could this mislead the user?** No. The new matchers only ever produce `{ scope, slug }` when the entity matches the platform's own existing, already-reviewed nutrient/benefit vocabulary (`KNOWN_NUTRIENT_TERMS`/`KNOWN_BENEFIT_TERMS`) — the same guard every adjacent, already-live matcher uses. An unmatched term is an honest non-match, never a guessed scope.
- **Could this fabricate certainty?** No. The handler this wave's triggers reach was already built (FI3) to return an honest gap for any unknown slug or ungrounded query — untouched by this wave.
- **Is anything guessed but shown as real?** No — every value the LLM now receives traces to `food-intelligence-engine`'s own already-tested, citation-backed recommendation output.
- **Permission-aware?** Unchanged enforcement path — `intelligencePlatform.handle()` → `resolveContext`/`canInvokeCapability`, identical to every other capability's own trigger.
- **No architectural duplication introduced:** confirmed — no new capability, no new store, no second resolver, no second engine.
- **No new source of truth created:** confirmed.

---

## SCOPE LOCK

**Implemented (this wave):**
1. `FOOD_INTELLIGENCE_RECOMMEND_MATCHERS` (3 patterns) + `foodIntelligenceRecommend()` helper in `server/intelligence/pattern-intent-resolver.ts`, registered into `ALL_SPECIFIC_MATCHERS` — closes the one genuine activation gap found (`food-intelligence`'s `recommend` verb had zero real consumers).
2. New `§8` test section (15 assertions) in `server/tests/test-intent-resolver.ts` proving the new matchers fire correctly, fire additively (not exclusively), and correctly abstain on non-vocabulary terms.

**Named, not implemented (real findings, not activation gaps — see Part 4 for priority):**
- `food-intelligence`'s `explain` verb still has no conversational trigger — low priority, needs a drill-down UI surface to be worth triggering first.
- The Planner/Cookbook/Pantry "two opportunity widgets" duplication (D1) — needs a design decision, unchanged from `IA1`/`IA2`'s own conclusion.
- The orphaned `GET /api/intelligence/companion/growth-insight` route (D2) — needs deletion, not activation; unchanged from `IA2`/`IA3`'s own conclusion.
- `administration`/`developer` capabilities remain unbound — correctly out of scope; belongs to TIP1's own future Phase 3/4 programmes.
- The `meal-food-intelligence.ts` / `food-intelligence` capability naming collision — documentation clarity only.

---

## FORMAL DECLARATION

Verification against all six required checks:

| Check | Result |
|---|---|
| No dormant platform capabilities remain | ✅ (Part 1/3 — the one genuine gap found, `food-intelligence recommend`, is closed this wave) |
| No duplicate intelligence pathways exist | ✅ with two named, non-blocking exceptions carried forward from IA1/IA2, re-confirmed still real and still correctly non-urgent (Part 2/4) |
| All registered capabilities have at least one real consumer | ✅ for all 21 bound capabilities; 2 unbound capabilities are honest future-phase placeholders, not a violation (Part 1/3) |
| Intelligence remains permission-aware | ✅ (Part 5) |
| One Intelligence Platform and one Companion are preserved | ✅ (Part 6) |
| No remaining launch-critical Intelligence Activation gaps exist | ✅ (Part 4) |

**The Platform Intelligence Activation programme (`IA1`–`IA4`) is hereby declared COMPLETE.** Every Intelligence Platform capability built to date is now reachable by at least one real consumer; the two remaining named items (D1, D2) are design/hygiene work explicitly outside Activation's own charter, not gaps in it; and the platform's structural invariants (one platform, one Companion, permission-aware by construction, no duplicated source of truth) all independently re-verify against current HEAD rather than against any prior wave's own say-so.

---

## RECOMMENDATION — THE FIRST COMPANION ROLLOUT PROGRAMME

With Intelligence Activation complete, the platform's own architecture already names the natural next programme: `THA_COMPANION_PLATFORM_ARCHITECTURE.md` §11 lists several capabilities that are **built but not yet experienced** — the inverse of Intelligence Activation's own "available but unreached" problem, one layer higher, in the Companion's presentation rather than the platform's reach:

- **G5 — `ExperienceProfile` visual identity** (`avatarId`, `colorTheme`, `voiceProfileId`) exists as data for all six personalities but has zero client renderer — named by `IA1`, `IA2` and `IA3` alike as "needs design assets, not wiring."
- **G4 — Incomplete `InteractionKind` vocabulary** — `IA2` wired `seasonal`; `welcome` and `encouragement` remain declared but unused.
- **G8 — No household-level personality** — a straightforward extension of an already-owned fact (`user_preferences.companionPersonality`), following the existing `household_eaters` per-member-vs-default precedent.
- **G6 — No cross-session memory for Silence Rules** — the named, not-yet-built `companion_observation_log` table, needed for genuinely-dated "just noticed" milestone claims rather than present-state-only phrasing.

A **Companion Rollout** programme — bringing the six personalities' visual identity to real screens, finishing the `InteractionKind` vocabulary, and (if scoped) extending personality to the household level — is the natural first step after Intelligence Activation: the reasoning and reach are now proven; the next value is in how the one Companion actually looks, sounds, and is *found* by real households, not in building further platform capability. This recommendation names the programme; it does not scope or authorise it — that remains its own governed workstream, per Rule 8.

---

*Rollback: `git checkout rollback/before-ia4-completion-verification-20260704` (tag on `ff3b2cf`, the HEAD this wave started from — identical to IA1's, IA2's and IA3's own starting point; nothing between that commit and this wave's edits was reverted or altered).*
