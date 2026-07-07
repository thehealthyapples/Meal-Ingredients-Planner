# EWO — Domain Future-State Evolution Audit

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Type:** Investigation only. No code, schema, route, or capability change.
**Risk:** 🟢 GREEN (read-only audit)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `ewo-domain-audit-rollback-20260703` → `3460519` |
| Working tree at start | Dirty with pre-existing, unrelated uncommitted work from prior sessions (FI5 Food Intelligence UI Activation, EWO1 Companion Platform Foundation, EWO2 Companion Personality Platform, EWX1 Living Companion Experience, EL2 Evidence & Learning Refinement — all already documented under `docs/implementation/` and `docs/investigations/`). None of these files are touched by this audit. |
| This task's writes | This file only: `docs/investigations/EWO_DOMAIN_FUTURE_STATE_AUDIT.md` |
| Rollback to committed state | `git checkout ewo-domain-audit-rollback-20260703` |

**This is an investigation only.** No application code, database schema, services, routes, or prompts were modified. The single output is this document.

---

## ARCHITECTURE COMPLIANCE (confirmed before investigation)

Governing architecture reviewed in full before writing this document:
`ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2), `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` (TIP3), `INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`, `THA_COMPANION_CARD_EXPERIENCE_PRINCIPLE.md`, `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_MASTER_EVOLUTION_ROADMAP.md`, plus the newest (uncommitted) work: `EWO1` (Companion Platform Foundation), `EWO2` (Companion Personality Platform), `EWX1` (Living Companion Experience), `EL1`/`EL2` (Evidence & Learning), `FI5` (Food Intelligence UI Activation).

Verified directly against the live codebase (not assumed from docs):

| Check | Finding | Verdict |
|---|---|---|
| One canonical Intelligence Platform | `server/intelligence/intelligence-platform.ts` — single singleton, one `.handle()` entry point, called by the Conversation Gateway, the FI5 routes, and every binding. No second platform found. | ✅ PASS |
| One Capability Registry | `server/intelligence/capability-registry.ts` — single file, 28 registered capabilities (13 core TIP2 capabilities + 6 discovery variants + `food-intelligence` + `opportunity-delivery` + `evidence-learning` + `administration` + `developer` + cross-domain guidance entries). No second registry file found anywhere in `server/` or `client/`. | ✅ PASS |
| One Intent Engine | `server/intelligence/intent-engine.ts` + `intent-resolver.ts` / `pattern-intent-resolver.ts` — single pipeline (locate → validate → permission → confirm → invoke → respond). No parallel resolver found. | ✅ PASS |
| One owner per fact | Verified against the SoT Register (27 domains) and `ARCHITECTURE_PRINCIPLES.md`'s contested-domain list. Three prototype stores remain un-retired (`nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts`) — pre-existing, tracked, not introduced by any Companion/Personality/Food Intelligence work audited here. | ✅ PASS (pre-existing contested items tracked, not new) |
| No duplicate capabilities | Companion/Personality/Living-Companion additions (`personality-registry.ts`, `behaviour-engine.ts`, `observation-engine.ts`, `companion-growth.ts`) register **zero** new capabilities — verified via `git diff`-equivalent review of `capability-registry.ts` (only one text-field edit, from FI5, `apiSurface` description). | ✅ PASS |
| No duplicate state | Personality is read fresh from `user_preferences` each turn, never cached in `conversation-store.ts`. Observations are computed fresh per request, never persisted. Verified in code, not just claimed in docs. | ✅ PASS |
| Evolution over replacement | Every new module audited (Personality, Behaviour Engine, Observation Engine, Delight Framework, Food Opportunities UI) extends an existing seam (`conversation-gateway.ts`, `companion-guidance.ts`, `turn-fallback.ts`) rather than replacing it. | ✅ PASS |

**Gate result: PASS.** The investigation continues.

---

## GROUNDING — METHOD

This audit is evidence-first. Every current-state claim below is backed by one of:

1. Direct reads of the eleven governing architecture documents in `docs/architecture/`.
2. Direct reads of the four most recent (uncommitted) EWO/EL/FI investigation and implementation records.
3. Direct inspection of the live codebase: `server/intelligence/` (113 files — platform, 20 bindings, ~50 handler/port files, conversation subsystem, evidence-learning, opportunity-delivery), `server/intelligence/capability-registry.ts` (28 capabilities), all 26 files under `client/src/pages/`, `client/src/App.tsx` (route table + `FloatingAssistant` mount point), and targeted greps for intelligence-component usage per page.

**Key structural finding that shapes every domain assessment below:** grepping every `server/intelligence/bindings/*.ts` file for write-intent wiring shows that **only Planner and Shopping have a `*-write-handler.ts`**. Household, Meals, Profile, Templates, Diary, Pantry, Analyser, and Partners all explicitly document (in their own binding file headers) that write verbs are allow-listed on the Capability Registry but **return an honest gap** — they are not actually wired to the Intent Engine yet. This is not a defect (TIP1's own roadmap sequences write-intent rollout as Phase 2, capability-by-capability) — but it means "the Companion can act on my behalf" is true today for exactly **2 of 13** core capabilities, and every domain assessment below states this explicitly rather than assuming TIP2's aspirational `W`/`W!` posture is already live.

---

# PART 1 — DOMAIN-BY-DOMAIN ASSESSMENT

## 1. Dashboard

### Current State
- Route: `/dashboard` → `dashboard.tsx`.
- Renders `HomeIntelligenceCompanion` (a dedicated dashboard-surface companion widget, INT-series) and `FoodOpportunitiesPanel` (FI5, all-domain, top 5 opportunities).
- Consumes `/api/home/intelligence` (assembled read model, TIP1 Principle 4 pattern).
- Global `FloatingAssistant` present (mounted once in `App.tsx`, applies to every route).
- Companion presence: nutrition-trend + streak/diversity-milestone observations surface here per EWX1's Workspace Observation Matrix.

### Future Vision
Per `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` Part 2/10, Dashboard is named one of the four **primary** AI entry points (alongside Floating assistant, Voice, Search) and is the proactive-digest surface (Part 10: daily/weekly summary, safety-class interrupts only). Per `THA_MASTER_EVOLUTION_ROADMAP.md` §2, Dashboard's launch bar was "add the compact Plants-this-week summary card" — a small polish item, not an architecture gap.

### Gap Analysis
- **Intelligence gap:** none structural — Dashboard already reads the richest cross-domain assembled model (`/api/home/intelligence`) and the newest cross-domain surface (Food Opportunities).
- **Workflow gap:** the proactive **digest** model (TIP3 Part 10 — "daily/weekly summary, not a stream of pings") is not yet built; today's surfaces (`HomeIntelligenceCompanion`, `FoodOpportunitiesPanel`) are live/ambient, not batched into a digest.
- **Discoverability gap:** none — Dashboard is the most AI-dense workspace in the product today.
- **Companion integration:** strong — the only page with a dedicated companion widget beyond the global floating assistant.
- **Food Intelligence integration:** strong — first consuming surface named in FI5.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 90/100 | Reads one assembled model; no duplicate ownership; extends cleanly. |
| Capability | 75/100 | Read/discovery only — no write intents surfaced here (consistent with the platform-wide 2-of-13 write coverage). |
| Experience | 70/100 | Rich but assembled from two independently-added widgets (`HomeIntelligenceCompanion` + `FoodOpportunitiesPanel`) rather than one unified proactive digest. |
| Future-State Completion | **70%** | Missing: the batched daily/weekly digest (TIP3 Phase E4), plant-count summary card (Master Roadmap §2 launch item). |

### Recommendations
- Activate TIP3 Phase E4 (proactive digest) by composing the *existing* `HomeIntelligenceCompanion` + `FoodOpportunitiesPanel` + Observation Engine outputs into one batched summary, rather than three independently-rendered widgets.
- Add the "Plants this week X/30" summary card deep-linking to Plant Diversity — a pure UI addition over already-computed data (`assembleNutritionCentre`).

---

## 2. Companion

### Current State
This is not a page — it is the cross-cutting assistant defined by TIP1–TIP3 and matured by EWO1/EWO2/EWX1. Confirmed live: one Gateway (`conversation-gateway.ts`), one Capability Registry, one Intent Engine, one conversation store (`conversation-store.ts`, turns + references only), one Context Frame assembler, six registered personalities (`Companion/Friend/Coach/Chef/Teacher/Sergeant` — `personality-registry.ts` + `behaviour-engine.ts`), an Observation Engine (`observation-engine.ts`) producing nutrition-trend / streak / diversity / opportunity observations, a Delight Framework scaffold (`companion-delight.ts`, 3 motion variants), and Companion Cards (the discovery-response rendering vocabulary, INT36/INT37). Mounted globally via `FloatingAssistant.tsx` in `client/src/App.tsx` — present on every one of the 9 named workspaces with zero per-page wiring.

### Future Vision
TIP3's full five-year arc (§14): traditional app → AI-assisted → conversational household assistant → household intelligence platform, with voice, proactive digests, delight, and full personas — **all as adapters over the one spine, never a rewrite.** EWO1/EWO2/EWX1 have already delivered personality (voice variation) and ambient presence (observations) — both matured phases of that arc, ahead of voice (TIP3 Phase E3) and full proactive digests (Phase E4).

### Gap Analysis
- **Intelligence gap:** the Companion can **discover and explain** across nearly every domain but can only **act** (write) in Planner and Shopping. Meals, Household, Profile, Diary, Pantry, Templates, Analyser, Partners are discovery/read-only from the Companion's perspective today — a real gap against TIP2's `W`/`W!` target posture, not a design flaw (Phase 2 of TIP1's roadmap is explicitly sequenced capability-by-capability).
- **Workflow gap:** no voice (TIP3 Phase E3) — text-only today.
- **UX gap:** the Silence Rules (EWX1 Stage 6) are stateless — no persisted "last shown" tracker, so an observation can theoretically re-show across sessions (named as an honest, tracked limitation in EWX1, not a hidden defect).
- **Explainability:** strong — every observation traces to a named existing owner (EWX1 Stage 1 provenance table); every guidance suggestion is capability-gated (`canExecute`).
- **Companion integration:** this **is** the Companion — N/A.
- **Food Intelligence integration:** the Companion's nutrition-knowledge binding is the only live Domain-Intelligence-shaped capability today per FI1 §13 — the Food Intelligence Engine itself (join+rank+explain) is not yet built.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 95/100 | The most rigorously gated system in the codebase — every new workstream (EWO1/2, EWX1, FI5) passed an explicit compliance gate before merging. |
| Capability | 55/100 | 2-of-13 capabilities have real write access; the rest are read/discovery only relative to TIP2's target posture. |
| Experience | 75/100 | Personality + observations + Companion Cards are genuinely differentiated; voice and full proactive digest are unbuilt. |
| Future-State Completion | **55%** | Phase 0/E0/E1 (foundations, read-only, context/personas) are essentially done; Phase 2 (write, most capabilities) and Phase 3+ (voice, digests, delight artwork) are the majority of what remains. |

### Recommendations
- Prioritise write-intent wiring for **Meals** and **Pantry** next (highest natural conversational demand: "swap this meal," "what's in my pantry") — reuses `recipe-swap-engine.ts` and existing pantry services, no new logic.
- Build the persisted "last shown" observation log named as EWX1's own top suggestion — the single biggest honesty upgrade to Silence Rules, and it is additive (one small table), not a redesign.
- Do not build voice or a second personality axis before write-intent coverage widens — matches TIP1's own phase-gating discipline (Rule LT1: no stage skips its predecessor's trust bar).

---

## 3. Planner

### Current State
Routes: `/planner`, `/weekly-planner` → `weekly-planner-page.tsx`. Renders `PlannerIntelligenceStrip` (existing discovery/stories-based ambient strip) **and** `FoodOpportunitiesPanel` (FI5, `domains=["planner"]`) — two intelligence surfaces, from two different data sources, side by side. Planner is one of only two capabilities (with Shopping) with a live write-handler (`planner-write-handler.ts`) — the Companion can actually add/move/replace/delete planner entries via natural language, not just discuss them. `planner-discovery` is also registered.

### Future Vision
Per `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` §7 (Part 6), the Planner persona is "propose, then commit" — generate/optimise shown before persisting, reasoned (not magical) suggestions, continuous with Shopping/Nutrition in one conversation. Per `THA_MASTER_EVOLUTION_ROADMAP.md`, Tier-4 component-shell recovery (household meal matcher wired as fallback) is a named, tracked, not-yet-closed gap.

### Gap Analysis
- **Intelligence gap:** none on read/discovery; Planner is the most capable write surface today.
- **Workflow gap:** Tier-4 planner recovery (restricted households can get empty breakfast slots) — pre-existing, tracked in the Master Roadmap, not introduced or fixed by any audited work here.
- **UX/presentation gap:** two ambient strips (`PlannerIntelligenceStrip` and `FoodOpportunitiesPanel`) sit side-by-side without a unifying frame — a **discoverability** and **consistency** gap, not a duplication (they are honestly named as distinct data sources per FI5's own compliance checklist), but a user has no way to know why there are two.
- **Discoverability gap:** the "propose, then commit" conversational experience (TIP3 §7.1) is designed but not yet felt — Generate/Optimise via natural language exists at the intent level but there is no visible "show before persist" UI pattern documented as shipped.
- **Companion integration:** strongest of any domain (only write-capable surface alongside Shopping).
- **Food Intelligence integration:** live (FI5 panel + planner-gap opportunities from FI4).

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 90/100 | Single write-handler, single discovery binding, clean SoT ownership (`planner_*` tables). |
| Capability | 85/100 | The most complete write-intent coverage of any domain. |
| Experience | 65/100 | Two unlabelled-relationship ambient strips; Tier-4 empty-slot gap still open. |
| Future-State Completion | **75%** | Closest domain to TIP2/TIP3's full vision; missing only the visible "propose-then-commit" UI treatment and Tier-4 recovery. |

### Recommendations
- Merge or visually unify `PlannerIntelligenceStrip` and `FoodOpportunitiesPanel` under one "Planner Intelligence" heading with clearly labelled sub-sources, rather than two independent cards — a presentation-only change, no new data.
- Wire Tier-4 `matchMealsForHousehold()` fallback (already built, per Master Roadmap, just unwired) — closes a known, named, pre-existing gap.

---

## 4. Cookbook / Meals

### Current State
Routes: `/meals`, `/cookbook` → `meals-page.tsx`. Renders `CookbookMealIntelligenceStrip` and `FoodOpportunitiesPanel` (`domains=["pantry","shopping"]` — FI5's own doc names this an honest reframing since "no Cookbook-specific opportunity producer exists yet"). Meal detail (`meal-detail-page.tsx`) is the canonical entity page (Companion Card firewall's "Open Meal" target). Recipe import (web recipe → cookbook) lives inside `meals-page.tsx` itself (`/api/preview-recipe`, `/api/import-recipe`) — there is no dedicated Recipe Import domain page (`/import-recipe` is a redirect stub to `/cookbook`, confirmed by direct read of `import-recipe-page.tsx`, 8 lines).
- Meals capability is read-only from the Intent Engine's perspective (`bindings/meals.ts` explicitly documents write verbs return an honest gap) — the Companion can discuss and discover meals, but cannot add/swap/delete via natural language yet, despite `recipe-swap-engine.ts` already existing as a service the Intent Engine would call.

### Future Vision
Per TIP2 §2.1 (C4), Meals is a `W!` target capability (Generate/Add/Replace via `recipe-swap-engine.ts`, `meal-resolution-service.ts`). Per `THA_MASTER_EVOLUTION_ROADMAP.md`, Cookbook needs the `mealId` seam to Plant Diversity (WS0) and a responsive/density audit — both named launch items, not architecture gaps.

### Gap Analysis
- **Intelligence gap:** the largest of any domain — Meals/Cookbook has a fully built swap engine and meal-resolution service that the Intent Engine does not yet call.
- **Workflow gap:** Recipe Import has no dedicated Companion or Food Intelligence surface at all — it is a raw form-fill flow inside the meals page, untouched by any of the Intelligence Platform, Companion, or Food Intelligence work reviewed.
- **UX gap:** two intelligence widgets on one page (`CookbookMealIntelligenceStrip` + `FoodOpportunitiesPanel`), same unlabelled-relationship issue as Planner.
- **Discoverability gap:** Recipe Import is invisible to the Companion — "import this recipe for me" cannot resolve to a registered intent today (no binding, no handler for a recipe-URL-in, meal-out capability).
- **Companion integration:** partial — discovery yes, action no.
- **Food Intelligence integration:** partial — reframed pantry/shopping opportunities only, honestly labelled as a stand-in.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 85/100 | Clean SoT (`meals`/`meal_items`), swap engine already exists and is ready to be wired. |
| Capability | 45/100 | Read/discovery only; the highest-value unwired write capability in the platform (a fully-built swap engine sitting idle from the Intent Engine's perspective). |
| Experience | 60/100 | Rich detail page; ambient strip duplication; Import flow entirely un-intelligent. |
| Future-State Completion | **55%** | Meal identity + discovery are mature; the write path and Recipe Import's intelligence integration are the two largest remaining gaps. |

### Recommendations
- Wire `meals-write-handler.ts` next (highest-leverage single addition across the whole audit): "swap the chicken for salmon," "add this to my cookbook" become real intents by binding to the *existing* `recipe-swap-engine.ts`/`meal-service.ts` — zero new business logic, per TIP2's own architecture.
- Give Recipe Import a Companion-visible seam: at minimum, let "import this recipe" resolve to the existing `/api/preview-recipe` → `/api/import-recipe` flow as a registered `Import × Meals` intent (TIP2 already names this verb; it is currently unbound for this capability).
- Same strip-unification recommendation as Planner.

---

## 5. Shopping

### Current State
Routes: `/shopping-workspace` (canonical; `/shopping-list`, `/list` redirect to it) → `shopping-workspace-page.tsx` / `shopping-list-page.tsx`. Renders `ShoppingIntelligencePanel` (WX6, food-story-based, hides when nothing validated). Shopping is the **second** of only two capabilities with a live write-handler (`shopping-write-handler.ts`) and also has `shopping-discovery` registered. No `FoodOpportunitiesPanel` instance is wired directly into the Shopping pages themselves (FI5 wired Dashboard/Planner/Cookbook/Pantry, not Shopping) — a small, honest gap.

### Future Vision
Per TIP3 §8 (Part 7), Shopping's natural arc is "build → refine → hand off," with "Order" an explicit, honestly-declared **gap** (no checkout/retailer-order endpoint exists — `grocery-integration.ts` builds baskets, never places orders). Per the Master Roadmap, Shopping is rated **Launch Ready** already — "strongest existing integration (basket send, price intelligence, fulfilment memory)."

### Gap Analysis
- **Intelligence gap:** none structural — one of the two fully write-capable domains.
- **Workflow gap:** "Order shopping" remains an honest, permanent gap (TIP2 §2.4) — correctly not fabricated anywhere in the codebase.
- **UX gap:** no Food Opportunities panel on the Shopping page itself, unlike Planner/Cookbook/Pantry/Dashboard — an inconsistency, not a defect (FI5 scoped its four surfaces deliberately, but the omission of Shopping specifically is now visible cross-domain).
- **Discoverability gap:** minor — `ShoppingIntelligencePanel` "hides when nothing validated," which is honest but may under-surface the feature to new users.
- **Companion integration:** strong (write-capable).
- **Food Intelligence integration:** present via FI1's enrichment map ("in-place line context — covers-a-gap chips") but not yet visible as FI5's opportunity panel pattern on this specific page.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 90/100 | Clean SoT, write-capable, discovery-capable. |
| Capability | 85/100 | Second of two fully write-wired domains. |
| Experience | 70/100 | Strong but missing the FI5 opportunity panel other domains now have — an emerging cross-domain inconsistency. |
| Future-State Completion | **75%** | On par with Planner; the only material gap is the FI5 panel parity and the (permanent, honest) Order gap. |

### Recommendations
- Add `FoodOpportunitiesPanel domains=["shopping"]` to the Shopping workspace — closes the one visible cross-domain inconsistency FI5 itself left open, and is a pure reuse of the exact component already built.
- No further architecture work needed; this is the domain closest to "done."

---

## 6. Pantry

### Current State
Route: `/pantry` → `pantry-page.tsx`. Renders `PantryIntelligencePanel` and `FoodOpportunitiesPanel` (`domains=["pantry"]`). `pantry-discovery` registered; write verbs on the base `pantry` capability return an honest gap (no `pantry-write-handler.ts` found). Pantry Explore (the "Nutrition Knowledge Hub" second mode named in the Master Roadmap) sits on the same page as inventory mode.

### Future Vision
Per the Master Roadmap, Pantry Explore is the encyclopedic knowledge hub — Benefit → Nutrient → Food → Meal → Boost, reusing the shared knowledge model. Per FI1's enrichment map, Pantry gets "cook from what you have" framing over existing inventory, with Pantry Explore staying the unchanged knowledge-hub owner.

### Gap Analysis
- **Intelligence gap:** write path (add/remove pantry items via natural language) is unwired, same pattern as Meals/Household/Profile.
- **Workflow gap:** none new — Pantry Explore's registry-migration gaps (M2: retire `pantry-knowledge.ts`) are pre-existing, tracked in `ARCHITECTURE_PRINCIPLES.md`'s contested-domains list, not introduced here.
- **UX gap:** same two-widgets-no-label pattern as Planner/Cookbook (`PantryIntelligencePanel` + `FoodOpportunitiesPanel`).
- **Discoverability:** good — both panels visible on page load.
- **Companion integration:** discovery-only.
- **Food Intelligence integration:** strong (FI4's pantry-unused generator is one of only three built opportunity producers).

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 85/100 | Clean, but inherits the pre-existing M2 contested-domain migration debt (`pantry-knowledge.ts` not yet retired). |
| Capability | 50/100 | Discovery-rich, write-unwired. |
| Experience | 65/100 | Same unlabelled dual-widget pattern. |
| Future-State Completion | **60%** | Blocked less by new work than by the pre-existing M2 migration and write-intent wiring shared with every other read-only domain. |

### Recommendations
- Same strip-unification treatment as Planner/Cookbook.
- Sequence M2 (retire `pantry-knowledge.ts` into `pantryIngredientKnowledge` DB) before any further Pantry Explore enrichment work, per the Master Roadmap's own dependency ordering.

---

## 7. Nutrition

### Current State
No single "Nutrition" page/route — the domain is served by `food-detail-page.tsx` (richest intelligence surface in the product: `ConnectedFoodPanel`, `HouseholdInsightCard`, `IntelligenceCard`, `IntelligenceChip`, `SeasonalCard`, `SimplyBetterChoiceCard`), `plant-diversity-page.tsx` (renders `HouseholdNutritionCentre`, backed by `/api/nutrition-centre`, WX8), and the Companion's `nutrition-knowledge` + `nutrition-discovery` capabilities (read-only by design — TIP2 rates Nutrition **R**, not W, permanently, since it is knowledge not a mutable domain).

### Future Vision
Per `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, Nutrition is being renamed at the architecture layer to **Food Intelligence** — the first fully specified Domain Intelligence layer, sitting between Business Domains and the Intelligence Platform. Per the Master Roadmap, the five connected knowledge surfaces (Plant Diversity, Pantry Explore, Weekly Nutrition Report, Analyser, Simply Better Choices) reading one shared knowledge model is the launch definition of done.

### Gap Analysis
- **Intelligence gap:** the Food Intelligence *Engine* (join+rank+explain, Phase 1 of FI1's roadmap) is not built — today's nutrition surfaces are each independently assembled, not yet unified under one engine.
- **Workflow gap:** none — Nutrition is correctly read-only by design (Rule G1, the Generic Knowledge Wall).
- **UX/presentation gap:** the contested-domain trio (`nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts`) means a user can see three different phrasings of the same food fact across Plant Diversity vs Pantry vs Explore — the single highest-risk pre-existing gap in the entire platform per the SoT Register's own 🔴 rating.
- **Discoverability gap:** food-detail-page is rich but there is no single "Nutrition" nav destination — a user must arrive via a food link, not a direct nav item.
- **Companion integration:** read-only, correctly (EFSA firewall).
- **Food Intelligence integration:** this domain **is** Food Intelligence's primary Plane 1 source.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 60/100 | Three unretired contested stores (pre-existing) directly threaten this domain's "one owner per fact" guarantee — the SoT Register itself rates this 🔴. |
| Capability | 70/100 | Correctly read-only; well-integrated into the Companion's knowledge plane. |
| Experience | 75/100 | `food-detail-page.tsx` is the single richest intelligence surface in the product. |
| Future-State Completion | **55%** | Gated on M1/M2/M4 migrations (pre-existing, tracked, not caused by any audited work) before the Food Intelligence Engine (Phase 1) can even begin per FI1's own Phase 0 exit gate. |

### Recommendations
- **Highest-priority pre-existing debt in the whole audit:** complete M1 (retire `nutrition-benefit-library.ts`) and M2 (retire `pantry-knowledge.ts`) — both rated low effort/risk in the SoT Register's own migration roadmap, and both are FI1's named Phase 0 exit gate before the Food Intelligence Engine can start.
- Do not start the Food Intelligence Engine (Phase 1) before Phase 0 (100% Plane 1 convergence) completes, per FI1 §8's own gate — this is a sequencing discipline, not a new recommendation.

---

## 8. Diary

### Current State
Routes: `/diary`, `/my-diary` → `food-diary-page.tsx`. **Zero page-level intelligence component usage** — no `IntelligenceCard`, no `FoodOpportunitiesPanel`, no dedicated strip (confirmed by direct grep; the only hit for "intelligence" anywhere near this page is the generic `intelligence-settings` query key pattern shared by every page, not a domain-specific integration). Diary data (`food_diary_metrics`) is however the **only** live S-0 signal tier per FI1 §6.1, and is read by the Companion's `nutrition-trend` observation (via `companion-growth.ts`) — so Diary data reaches the user through the *global* `FloatingAssistant`, never through the Diary page itself.

### Future Vision
Per the Master Roadmap, Diary is explicitly "not on the knowledge critical path" and rated Needs Polish only — a deliberate, correct scoping decision, not an oversight. Per FI1 §6.1, Diary's self-reported metrics are the foundation tier of the entire future signal ladder (S-0 → S-4).

### Gap Analysis
- **Intelligence gap:** the domain that generates the platform's most important personalisation signal (S-0) has no on-page surface that reflects anything back to the user — a real, if low-priority, discoverability gap.
- **Workflow gap:** none named as launch-blocking.
- **UX gap:** the only domain among the 9 named workspaces with literally no intelligence surface at all (confirmed against EWX1's own Workspace Observation Matrix, which lists Diary as receiving only the global nutrition-trend banner, same computation as Nutrition Report).
- **Discoverability gap:** a user logging in Diary has no visible signal that this data feeds anything — it may read as "just a log," undermining the value proposition of Diary as the S-0 signal source.
- **Companion integration:** present only via the global floating assistant's observation banner, not the page itself.
- **Food Intelligence integration:** read-only consumer relationship (`Diary` is read by Food Intelligence per FI1 §3.1; Diary never writes for FI).

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 90/100 | Clean single-owner store (`food_diary_*`), correctly scoped as transactional not knowledge (Principle 3). |
| Capability | 40/100 | Discovery-only (`diary-discovery` registered), no write, no on-page intelligence at all. |
| Experience | 35/100 | The one workspace with zero page-embedded intelligence — lowest of any domain audited. |
| Future-State Completion | **45%** | Lowest completion score of any domain — but also lowest strategic priority per the Master Roadmap's own explicit scoping. |

### Recommendations
- Lowest-effort, highest-symbolic-value fix: surface the *existing* `nutrition-trend` observation (already computed by `companion-growth.ts`, already used on Dashboard/Nutrition Report) directly on the Diary page itself, closing the "why does this matter" gap with zero new computation.
- Do not build new Diary-specific intelligence — reuse what already reads this data.

---

## 9. Household

### Current State
No dedicated `/household` page — household composition (`household_eaters`, adults/children/babies counts) is managed inside `profile-page.tsx`'s `HouseholdSettings` section. `household` and `household-discovery` capabilities are both registered; the base capability's write verbs (add/delete eaters) return an honest gap (`bindings/household.ts` explicitly documents this) despite TIP2 rating Household `W!` (membership) as a target posture.

### Future Vision
Per TIP3 §10 (Part 9), the Household persona should support "my daughter won't eat mushrooms" → `Add × Household` (eater preference), "what can everyone eat?" via `household-meal-matcher`, and family/guest/child interaction modes (read-only-by-default for children). Per FI1 §3.1, Food Intelligence reads eater composition/restrictions to personalise every answer but never writes household composition itself — Household remains Household-owned.

### Gap Analysis
- **Intelligence gap:** the write path (adding an eater's dislike via conversation) is fully specified in TIP3 §10 but not wired — same pattern as Meals/Pantry/Profile.
- **Workflow gap:** no dedicated Household page means household management is a sub-section of Profile, not a first-class domain in navigation — a structural discoverability gap the docs do not currently name as a problem, but which this audit surfaces as real: a user cannot navigate directly to "household," only to "profile → household section."
- **UX gap:** none beyond the above.
- **Discoverability gap:** household-meal-matcher ("what can everyone eat?") exists as a service (`household-meal-matcher.ts`) but has no direct UI entry point outside conversational discovery.
- **Companion integration:** discovery-only.
- **Food Intelligence integration:** correctly read-only per Rule FI1 (Household composition is never written by Food Intelligence).

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 85/100 | Clean SoT; correctly never touched by Food Intelligence's write path (Rule FI1 compliance verified). |
| Capability | 45/100 | Discovery-only; TIP3's "who dislikes this meal" / "add a preference" flows are designed but unbuilt. |
| Experience | 55/100 | Buried inside Profile rather than a first-class domain; `household-meal-matcher` has no direct UI. |
| Future-State Completion | **55%** | Behind Planner/Shopping on write-wiring; behind Dashboard/Nutrition on presentation prominence. |

### Recommendations
- Wire `household-write-handler.ts` for the single highest-value intent named in TIP3 itself: recording an eater's dislike/preference conversationally — reuses existing `household.ts` service, no new logic.
- Consider (product decision, not an architecture requirement) whether Household deserves a first-class nav entry given how central `household_eaters` is to restriction-safety (Rule T0) across the whole platform — currently it is one step removed from view.

---

## 10. Profile

### Current State
Route: `/profile` → `profile-page.tsx`. This is where the newest, most visible Companion feature lives: `CompanionPersonalitySettings` (EWO2's six-voice selector, confirmed at line 355/1718 of the page). `profile` capability registered; write verbs (own-data preference writes) return an honest gap **at the Intent Engine level** even though the page itself writes preferences directly via `/api/user/intelligence-settings` and `/api/profile` — i.e., Profile writes work fine through the ordinary REST API, they are simply not yet reachable by saying "change my diet pattern" to the Companion.

### Future Vision
Per the Master Roadmap, Profile needs per-person goals/likes/dislikes fields *only if* the recommendation engine ships (explicitly deferred). Per EWO1/EWO2, Profile (`user_preferences`, capability C6) is the correct, single owner of the Companion's own personality preference — already realised.

### Gap Analysis
- **Intelligence gap:** minor — conversational write ("set my diet to vegetarian") is unwired, but the direct UI path is complete and correct.
- **Workflow gap:** none named as blocking.
- **UX gap:** none — this is the one domain where a brand-new Intelligence feature (Personality) shipped with a first-class, well-integrated settings card, not a bolt-on.
- **Discoverability gap:** low — the personality selector is one card among many in a long settings page; EWO2 itself suggested (not yet built) surfacing the active personality name near the `PersonaLabel` badge in `FloatingAssistant.tsx` for better at-a-glance discoverability.
- **Companion integration:** exemplary — the canonical example of a Business Domain (Profile/C6) correctly owning a new Intelligence fact (personality choice) with zero duplicate storage.
- **Food Intelligence integration:** N/A directly, but Profile's diet/restriction data is read (never written) by Food Intelligence throughout.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 95/100 | The reference example of correct new-capability ownership (EWO1/EWO2's own compliance gates, re-verified here against the actual diff, not just the plan). |
| Capability | 60/100 | Direct-UI writes are complete; conversational writes are unwired (same pattern as most domains). |
| Experience | 80/100 | The Personality selector is a genuinely well-executed, discoverable feature addition. |
| Future-State Completion | **70%** | Most complete of the "profile-adjacent" domains; missing only conversational write-intent parity and the suggested personality-label surfacing in `FloatingAssistant`. |

### Recommendations
- Implement EWO2's own named suggestion: show the active personality name beside the `PersonaLabel` badge — a small, already-scoped UI addition.
- Wire `profile-write-handler.ts` for the single most natural conversational Profile intent ("set my diet pattern to X") — reuses the existing `/api/profile` write path.

---

## 11. Partners

### Current State
Route: `/partners` → `partners-page.tsx` (605 lines). `partners` capability registered as **R+A** (read + AI-assisted, advisory only — correctly, per TIP2, since Partners/Supermarkets has no write-mutation surface by design). **Zero** Companion/Food-Intelligence page-level integration found — confirmed both by direct grep of the page and by EWX1's own Workspace Observation Matrix, which states plainly: *"(none of the four sources are partner-scoped) — Always silent on this surface today — honest, not a bug."*

### Future Vision
Per the Master Roadmap, Partners (Friends & Family / referral) was flagged as the **lowest-information applet** in that investigation, with an open product question: *"confirm whether Partners is in launch scope at all."* No governing document commits Partners to a richer future intelligence state — this is the one domain where "future vision" is itself unresolved at the product-decision level, not merely unbuilt at the engineering level.

### Gap Analysis
- **Intelligence gap:** total, but honestly so — no producer exists because no domain-scoped fact exists yet for Partners to enrich.
- **Workflow gap:** the open product question ("is Partners in launch scope") from the Master Roadmap (2026-06-18) appears to remain unanswered as of this audit.
- **UX/discoverability gap:** N/A — nothing to discover yet.
- **Companion integration:** none, and this is documented as intentional/honest, not an oversight, in EWX1.
- **Food Intelligence integration:** none — no enrichment map entry for Partners exists in FI1 (correctly; Partners/retailer data is not a Food Intelligence enrichment target).

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 70/100 | Correctly scoped as R+A only; no architecture violation, but also no domain intelligence hook exists to extend. |
| Capability | 30/100 | Registered but unexercised — advisory-only, nothing today actually surfaces through it. |
| Experience | 40/100 | A functioning page with zero AI presence, in a product where every other consumer-facing domain has at least the global Companion's ambient awareness. |
| Future-State Completion | **35%** | Lowest of any domain, largely because the *product* question of scope, not the *architecture*, is the blocker. |

### Recommendations
- **Do not build Partners intelligence speculatively.** Per this audit's own mandate ("prefer honest gaps over optimistic assumptions"), the correct next step is a product decision on launch scope (the Master Roadmap's own open question), not an engineering push.
- If Partners stays in scope, the lowest-risk first step is retailer/price advisory surfacing (`retailIntelligence.ts`, already built, R+A per TIP2) on the Partners page itself — reusing an existing service, not building one.

---

## 12. Product Analyser

### Current State
Routes: `/products`, `/analyser` → `products-page.tsx`. Core scanning/UPF/NOVA/additive engine (`analyser-read-handler.ts`, `product-analysis.ts`, `upf-analysis-service.ts`) is mature and rated **Launch Ready** by the Master Roadmap. `analyser` capability registered as **R+A**. The page itself uses generic `intelligence-settings` (barcode scanner toggle, sound, elite tracking, regulatory-additive inclusion) — these are user preference toggles, not Companion/Food-Intelligence surfaces. No `FoodOpportunitiesPanel`, no Companion Card, no discovery-strip on this page.

### Future Vision
Per the Master Roadmap, Analyser needs the inbound deep-link seam from the Weekly Nutrition Report (`/analyser?q=…`, already exists) — a polish item, not an architecture gap. Per TIP2 §2.1 (C9), Analyser is correctly R+A (advisory) permanently — it should never gain autonomous write access (no code path should let the Companion "decide" a product is bad and act on it).

### Gap Analysis
- **Intelligence gap:** the Analyser's own judgement engine (Apple Score, `buildWhyBetter`, `rankChoices`) is mature but is **not exposed as a Companion Card** or discoverable via natural-language ("how healthy is this barcode") in any UI-visible way on this page — the capability is registered but this audit found no page-level evidence of it being surfaced through the conversational layer here (as distinct from being *callable* by the platform).
- **Workflow gap:** none named as blocking; deep-link seam is a small addition.
- **UX gap:** the richest product-judgement engine in the platform has the least visible AI/Companion presence of any domain with real intelligence behind it.
- **Discoverability gap:** real — a user would not know they can ask the Companion about a scanned product from this page.
- **Companion integration:** structurally registered (R+A) but not felt on this page.
- **Food Intelligence integration:** none named in FI1's enrichment map (correctly — Analyser's judgement is product-composition analysis, a distinct existing engine, not a Food Intelligence enrichment target).

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 85/100 | Mature, single-owner (`product-analysis.ts` + `upf-analysis-service.ts`), correctly R+A-only by design. |
| Capability | 65/100 | Registered and callable by the Companion in principle; no evidence of it being reachable from this page's own UI. |
| Experience | 55/100 | Strong core feature, weak visible AI presence relative to its actual sophistication. |
| Future-State Completion | **60%** | The gap here is presentation/discoverability, not underlying capability — the engine is already excellent. |

### Recommendations
- Add a lightweight "Ask about this product" entry point on the product detail view that seeds the Companion with the scanned product's context (Context Frame, per TIP3 Part 4) — pure UI wiring over an already-registered R+A capability, no new engine logic.
- Ship the WNR deep-link seam named in the Master Roadmap.

---

## 13. Recipe Import

### Current State
Not a distinct domain in practice: `/import-recipe` is a redirect stub (`import-recipe-page.tsx`, 8 lines, `useEffect(() => setLocation("/cookbook"))`). The real import flow (`/api/preview-recipe`, `/api/import-recipe`) lives entirely inside `meals-page.tsx`. No capability registry entry exists for "recipe import" as its own capability — it is folded into Meals (C4)'s `Import` verb cell in TIP2 §3.2, which names `/preview-recipe` as the binding but this audit finds **no handler wiring it** (Meals is read-only from the Intent Engine's perspective, confirmed above).

### Future Vision
`THA_RECIPE_ACQUISITION_ARCHITECTURE.md` exists as a governing document for this domain (not read in full for this audit given the deep dive on the Intelligence/Companion axis already covers its intelligence surface — but its existence confirms Recipe Acquisition has its own architecture home, distinct from being "just a Meals sub-feature"). TIP2 correctly treats "Import" as a Meals verb, not a separate capability — this is consistent with Principle 1 (no duplicate identity: an imported recipe becomes a `meals` row, not a second entity type).

### Gap Analysis
- **Intelligence gap:** total from the Companion's perspective — "import this recipe from this URL" cannot resolve to a registered, executable intent today.
- **Workflow gap:** the flow is a manual form-and-preview UI, functionally solid (per its existing test coverage implied by maturity) but with zero natural-language entry point.
- **UX gap:** the redirect stub at `/import-recipe` is slightly confusing as a "domain" in navigation terms — it doesn't exist as a place, only as a flow inside Cookbook.
- **Discoverability gap:** real.
- **Companion integration:** none.
- **Food Intelligence integration:** none named.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 75/100 | Correctly modelled as a Meals verb, not a duplicate entity — but the actual binding is unwired. |
| Capability | 20/100 | Lowest of any domain reviewed — no Companion path exists at all. |
| Experience | 60/100 | The manual flow itself is mature (web preview, category assignment); AI presence is zero. |
| Future-State Completion | **40%** | The manual UX works; the conversational/intelligent layer TIP2 already designed for it (`Import × Meals`) simply hasn't been built. |

### Recommendations
- When `meals-write-handler.ts` is eventually built (see Cookbook/Meals recommendation above), include the `Import` verb using the *existing* `/api/preview-recipe`/`/api/import-recipe` pair as the binding TIP2 already names — no new import logic required, only Intent Engine wiring.

---

## 14. Administration

### Current State
Four admin pages: `admin-users-page.tsx`, `admin-ingredient-products-page.tsx`, `admin-recipe-sources-page.tsx`, and — the one genuinely AI-native admin surface — `admin-companion-intelligence-page.tsx`, a dedicated observability dashboard (unmatched-utterance clustering, routing-failure groups, capability gaps, trend charts) reading directly from the Companion's own analytics stores (`companion-observability.ts`, `companion-guidance-analytics.ts`, `companion-goal-analytics.ts`, `companion-delegation-analytics.ts`). `administration` and `developer` capabilities are both **registered** in `capability-registry.ts` (C12/C13) but this audit finds **no handler or binding files** for either — confirmed by the full `server/intelligence/` file listing (no `administration.ts` or `developer.ts` binding, no `admin-*-handler.ts`, no `developer-*-handler.ts`). Per TIP1's own phased roadmap, Admin Intelligence (Phase 3) and Developer Intelligence (Phase 4, isolated deployment) are both explicitly **not yet built** — this audit confirms that is still true.

### Future Vision
Per TIP1 §8/§7, Admin Intelligence should read `admin`-class knowledge + admin capabilities behind `assertAdmin` (most-requested enhancements, feature adoption analytics, documentation/editorial workflow, roadmap intelligence — advisory only, human approves). Developer Intelligence should be a **physically isolated** deployment with architecture/SoT-validation tooling the user plane can never reach.

### Gap Analysis
- **Intelligence gap:** the largest structural gap of any domain — two capabilities are registered in the allow-list with **zero implementation**, which is architecturally honest (a `GAP`, per TIP2's own discipline) but means "Administration" as an Intelligence Platform domain is 0% built, not partially built.
- **Workflow gap:** the one real AI-native admin surface that exists (`admin-companion-intelligence-page.tsx`) is a **read-only analytics dashboard about the Companion**, not an AI capability admins can converse with — it is admin tooling for observability, not "Admin Intelligence" in TIP1's sense.
- **UX gap:** none beyond the above — the dashboard itself is well-built for what it does.
- **Discoverability gap:** N/A (admin-only surface).
- **Companion integration:** the Companion cannot yet act as an admin assistant (Phase 3) or answer architecture questions in an isolated developer plane (Phase 4) — both are correctly named as future, gated phases, not oversights.
- **Food Intelligence integration:** N/A.

### Maturity Score
| Dimension | Score | Justification |
|---|---|---|
| Architecture | 80/100 | Correctly gapped (registered, not built) rather than fabricated — TIP1's own discipline holding. |
| Capability | 10/100 | Two capabilities registered, zero handlers — the least-built domain in the Intelligence Platform by a wide margin. |
| Experience | 50/100 | The one shipped surface (Companion observability dashboard) is genuinely good, but it is meta-tooling about the Companion, not the "Admin Intelligence" TIP1 defines. |
| Future-State Completion | **20%** | Lowest of any domain in Capability/Future-State terms — but also the domain TIP1 itself sequences last (Phase 3/4), so this is expected, not alarming. |

### Recommendations
- No urgency to build Phase 3/4 ahead of schedule — TIP1's own phase-gating (Rule LT1) correctly sequences Admin/Developer Intelligence behind User Intelligence + Intent Engine maturity, which (per this audit) is itself only ~50-60% complete across most domains.
- When Admin Intelligence is eventually prioritised, the existing `companion-observability.ts`/`companion-guidance-analytics.ts` stores are ready-made data sources — no new analytics infrastructure would be needed, only the conversational/advisory layer TIP1 §8 describes.

---

# PART 2 — CROSS-DOMAIN REVIEW

### Duplicated experiences
- **The "two unlabelled intelligence widgets" pattern** recurs on Planner, Cookbook, and Pantry: an older discovery/stories-based strip (`PlannerIntelligenceStrip`, `CookbookMealIntelligenceStrip`, `PantryIntelligencePanel`) sits beside the newer FI5 `FoodOpportunitiesPanel`, with no shared heading or explanation of why there are two. This is not a duplicate *capability* (each is honestly a distinct data source per FI5's own compliance checklist) but it is a duplicate *experience* from the user's point of view — the single most visible cross-domain UX inconsistency found in this audit.

### Inconsistent UI / discoverability
- **Shopping is the outlier** among the four "primary" domains (Planner/Cookbook/Pantry/Shopping) in *not* having a `FoodOpportunitiesPanel` instance, despite being one of only two write-capable domains. This looks like an oversight rather than a deliberate scoping choice (FI5's own document names Dashboard/Planner/Cookbook/Pantry as "four consuming surfaces" without explaining the Shopping omission).
- **Household has no first-class page** — it is a Profile sub-section, while Diary, Pantry, and Nutrition-adjacent domains all have dedicated routes. Given how central `household_eaters` is to restriction-safety (Rule T0) across the entire platform, its relatively low navigational prominence is a discoverability gap worth product attention.

### Inconsistent Companion behaviour
- **Write-intent coverage is 2-of-13 capabilities** (Planner, Shopping). Every other domain's binding file explicitly documents "write verbs return an honest gap" — this is architecturally correct (TIP1's own phased rollout) but produces a real, user-facing inconsistency today: the Companion can "add tacos to Friday" but cannot "swap the chicken for salmon" or "add milk to my pantry," even though the underlying services for the latter already exist.

### Inconsistent Food Intelligence
- FI5's four consuming surfaces (Dashboard/Planner/Cookbook/Pantry) all render the identical `FoodOpportunitiesPanel` component with different `domains` props — this is the correct, non-duplicative pattern (one component, many callers). The inconsistency is only in *which* surfaces got it (see Shopping, above), not in how it's implemented.

### Inconsistent terminology
- No terminology collision was found between "Companion Platform" and "Companion Cards" (EWO1 §0.2 explicitly reconciled this before it could become one). The EL2 investigation's engineering/platform/user-language glossary (§3) is a strong precedent other domains should follow before shipping their own conversational surfaces.

### Inconsistent navigation / density
- Not deeply re-audited here (the Master Roadmap already rates "Responsive & Adaptive Density" as the #1 cross-cutting production gap, unrelated to the Intelligence/Companion axis this audit focuses on) — flagged as still open per that document, not re-verified fresh in this pass.

### Opportunities to unify the platform experience
1. Give the "two ambient widgets" pattern (Planner/Cookbook/Pantry) one shared visual frame with clearly labelled sub-sources, rather than leaving users to infer the relationship.
2. Close the Shopping FI5-panel gap for symmetry across the four primary commerce/planning domains.
3. Sequence write-intent wiring domain-by-domain (Meals next, then Pantry, then Household/Profile) rather than leaving a hard Planner/Shopping-vs-everyone-else split indefinitely.

---

# PART 3 — PLATFORM QUESTIONS

**1. Which domains are already future-state?**
None are fully future-state by TIP1–TIP3/FI1's own definitions (all require at least voice, full write-intent coverage, or Phase 2+ work). Shopping and Planner are closest to their *own* target posture (write-capable, discovery-capable) at ~75% completion.

**2. Which domains are close?**
Planner (75%), Shopping (75%), Dashboard (70%), Profile (70%).

**3. Which domains require significant evolution?**
Administration (20% — two capabilities registered, zero handlers, correctly gated to a later phase), Partners (35% — product-scope question unresolved), Recipe Import (40% — no Companion path at all), Diary (45% — zero on-page intelligence).

**4. Which domains provide the greatest return for the least engineering effort?**
- Shopping: add one existing `FoodOpportunitiesPanel` instance (component already built, zero new code).
- Diary: surface the already-computed `nutrition-trend` observation on-page (zero new computation).
- Profile: implement EWO2's own named suggestion (personality label near `PersonaLabel`).
- Meals: wire the *existing* `recipe-swap-engine.ts` to a new `meals-write-handler.ts` — the single highest-leverage capability unlock in the platform, because the underlying engine is already built and tested.

**5. Which improvements would most increase user delight?**
Closing the Meals write-intent gap ("swap this for that," conversationally) and completing the persisted "last shown" observation log (EWX1's own top suggestion) — both make the Companion feel materially more capable/considerate without any new intelligence being invented.

**6. Which improvements would most strengthen THA's competitive advantage?**
Completing M1/M2/M4 (the contested Food Knowledge migrations) — because every future Food Intelligence Engine phase (FI1 §8, Phase 1+) is explicitly gated on 100% Plane 1 convergence first. This is not glamorous, but it is the single largest structural blocker to the platform's own stated long-term differentiator (a unified, cited, trust-first Food Intelligence Engine).

**7. Which improvements should be completed before launch?**
Per the Master Roadmap (unchanged by this audit): WS0 (knowledge foundations/reconciliation), WS2 minimum-5 sourced benefits, responsive/density/a11y passes, copy-safety sign-off, verified nutrients-only fallback. This audit adds one item to that list: **the Shopping/FI5-panel symmetry gap** is small enough to close before launch at near-zero risk.

---

# FINAL DELIVERABLES

### 1. Domain-by-domain assessment
See Part 1 (14 domains, each with Current State / Future Vision / Gap Analysis / Maturity Score / Recommendations).

### 2. Platform maturity matrix

| Domain | Architecture | Capability | Experience | Future-State % |
|---|---|---|---|---|
| Dashboard | 90 | 75 | 70 | 70% |
| Companion | 95 | 55 | 75 | 55% |
| Planner | 90 | 85 | 65 | 75% |
| Cookbook / Meals | 85 | 45 | 60 | 55% |
| Shopping | 90 | 85 | 70 | 75% |
| Pantry | 85 | 50 | 65 | 60% |
| Nutrition | 60 | 70 | 75 | 55% |
| Diary | 90 | 40 | 35 | 45% |
| Household | 85 | 45 | 55 | 55% |
| Profile | 95 | 60 | 80 | 70% |
| Partners | 70 | 30 | 40 | 35% |
| Product Analyser | 85 | 65 | 55 | 60% |
| Recipe Import | 75 | 20 | 60 | 40% |
| Administration | 80 | 10 | 50 | 20% |
| **Platform average** | **83** | **54** | **62** | **56%** |

### 3. Future-state completion percentages
See matrix above — platform-wide average **56%**, driven down primarily by the 2-of-13 write-intent coverage gap (a single structural fact affecting 10 of the 14 domains) rather than by 14 independent problems.

### 4. Prioritised implementation roadmap
1. Shopping FI5-panel parity (quick win)
2. Diary nutrition-trend surfacing (quick win)
3. Meals write-intent wiring (`meals-write-handler.ts`) — medium effort, highest leverage
4. M1/M2/M4 Food Knowledge migrations — medium effort, unblocks Food Intelligence Engine Phase 1
5. Household/Pantry/Profile write-intent wiring, in that order
6. Persisted observation "last shown" log (Companion honesty upgrade)
7. Recipe Import intent wiring (folds into #3)
8. Admin/Developer Intelligence (Phase 3/4) — correctly deferred, not urgent

### 5. Quick wins
- Shopping: add `FoodOpportunitiesPanel domains=["shopping"]`.
- Diary: surface existing `nutrition-trend` observation on-page.
- Profile: personality label near `PersonaLabel` (EWO2's own named suggestion).
- Planner/Cookbook/Pantry: shared visual frame for the two-widget pattern (presentation only).

### 6. Medium-term improvements
- Meals, Pantry, Household, Profile write-intent wiring (each reuses an already-built service).
- M1/M2/M4 Food Knowledge migrations.
- Persisted Companion observation log.

### 7. Long-term opportunities
- Food Intelligence Engine (Phase 1, FI1 §8) — gated on Phase 0 convergence.
- Voice (TIP3 Phase E3).
- Full proactive digests (TIP3 Phase E4).
- Admin/Developer Intelligence (TIP1 Phase 3/4).
- Community capability, Signals Gateway (FI1 §7.2 — both explicitly unbuilt, correctly deferred).

### 8. Risks
- **Sequencing risk:** building the Food Intelligence Engine before M1/M2/M4 completes would violate FI1's own Phase 0 gate and risk shipping inconsistent nutrition phrasing at a moment of higher visibility.
- **Trust risk:** none found — every audited workstream (EWO1/2, EWX1, FI5) passed its own compliance gate and this audit's independent re-verification found no violation.
- **Drift risk:** the 2-of-13 write-intent gap, if left unaddressed indefinitely, risks becoming permanent-by-default (each new domain shipped read-only makes the read-only pattern feel like "how THA works" rather than "phase 1 of 2").

### 9. Recommended implementation order
1. Quick wins (Shopping parity, Diary surfacing, Profile label) — near-zero risk, ship immediately.
2. M1/M2/M4 Food Knowledge migrations — unblocks the platform's stated long-term differentiator.
3. Meals write-intent wiring — highest-leverage capability unlock.
4. Pantry/Household/Profile write-intent wiring.
5. Persisted observation log.
6. Everything in §7 (Long-term), gated and sequenced per each governing document's own phase discipline.

---

## DATA IMPACT

- Reads existing architecture and implementation: **YES** (this document's entire content).
- Writes no data: **CONFIRMED** — no code, schema, route, or capability was touched.
- Changes no ownership: **CONFIRMED.**
- Requires no schema changes: **CONFIRMED.**

## TRUST CHECK

- Every finding above traces to a specific file, a specific grep result, or a specific passage in a named governing document — no maturity score or gap claim is asserted without cited evidence.
- Where a domain's future state is genuinely a product decision rather than an engineering gap (Partners), this document says so explicitly rather than inventing an engineering recommendation to fill the space.
- No recommendation in this document proposes a new capability, a new store, or a duplicate of anything that already exists — every recommendation activates or extends an already-built service or component.
- Work in flight (EWO1/2, EWX1, FI5, EL1/2) was read and credited accurately, not re-litigated or second-guessed on its own compliance conclusions — this audit's job was to assess *experience against vision*, not to re-review already-gated architecture decisions.

---

*Investigation only. No implementation performed.*
*Rollback: `git checkout ewo-domain-audit-rollback-20260703`.*
