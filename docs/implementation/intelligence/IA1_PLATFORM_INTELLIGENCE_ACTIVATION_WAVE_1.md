# IA1 — Platform Intelligence Activation, Wave 1

**Date:** 2026-07-04
**Branch:** `int1-intelligence-platform`
**Mode:** Implementation.
**Risk:** 🟢 GREEN — four small, additive wiring changes; zero new capabilities, zero schema changes, zero new business logic. Every line of behaviour activated here already existed, was already tested, and was already live on at least one other surface.

---

## OBJECTIVE

Progressively activate existing Intelligence Platform capabilities across THA, using the now-complete Platform Knowledge Foundations (`PKC0`–`PKC5`) as the trust floor underneath any claim this wave surfaces. Prioritise activating what is already built over introducing new intelligence. Ship the highest-value, platform-wide improvements that benefit multiple user journeys, while preserving: one Intelligence Platform, one source of truth, one owner, one Companion, permission-aware intelligence. Land Wave 1 as one independently releasable increment.

---

## GOVERNING ARCHITECTURE (reviewed before starting)

- **`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)** — the Intelligence Platform owns no business facts; it routes to and voices existing services. A capability can be `available` (handler bound, tested) yet still **dormant** — reachable in principle, never reached by any real client surface. Activation work closes that specific gap: wiring a real consumer to an already-available capability, never adding new business logic.
- **`docs/architecture/INTELLIGENCE_DISCOVERY_PRESENTATION_PRINCIPLE.md`** — the Conversation owns discovery; canonical THA pages own presentation. Nothing in this wave adds a new discovery surface or renders/edits an entity outside its owning page — every change below either voices an existing, already-Silence-Ruled Companion read, or reuses an existing presentational component verbatim on one more page.
- **`docs/architecture/THA_COMPANION_PLATFORM_ARCHITECTURE.md` / `PLATFORM_QUALITY_ARCHITECTURE.md`** — one Companion, one behaviour engine, one personality registry; no second assistant, no per-surface reimplementation.
- **`docs/implementation/knowledge/PKC5_PLATFORM_KNOWLEDGE_FOUNDATIONS_VERIFICATION.md`** — the immediate predecessor. Declares the graduation pipeline, one-owner/one-mouth enforcement, evidence-first gating, and identity integrity COMPLETE. This wave adds no new knowledge claims and does not touch any of PKC0–5's surfaces; it activates *capability reach*, a different axis from *knowledge content*.
- **`docs/investigations/platform/EWO_DOMAIN_FUTURE_STATE_AUDIT.md`** and **`docs/investigations/platform/EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md`** — the two most recent platform-wide audits (2026-07-03, uncommitted, read but not re-derived here). Both independently name the same pattern: *"real, well-built infrastructure sitting one activation step away from being felt."* The launch-experience audit's own Part 10 sequencing (`Wave 1 — Safety & trust floor`, `Wave 2 — Activate dormant infrastructure`, …) is a UX-completeness ordering across seven categories (A–G); this document is narrower and platform-scoped by design — it takes only the items that are genuinely **Intelligence Platform capability activation** (Category C/D: Companion + Intelligence) and are safe to ship as one small, independently releasable slice, deferring the broader UX/data/trust items (error boundaries, allergen coverage, sourced benefits) to their own named owners.

### Architecture compliance gate (confirmed before implementation)

| Check | Finding | Verdict |
|---|---|---|
| One canonical Intelligence Platform | No new capability registered; `capability-registry.ts` unchanged. | ✅ PASS |
| One Companion | `buildGreeting`, `phraseObservation`, personality resolution, and Silence Rules are all reused verbatim — zero new template content, zero new voicing logic. | ✅ PASS |
| One source of truth | The Diary and Companion-greeting activations read the *same* already-computed values (`observeNutritionTrend`, `buildGreeting`) already consumed elsewhere (Dashboard/Nutrition Report, this same panel's own test suite) — no second computation path created. | ✅ PASS |
| Permission-aware intelligence | Every new/changed route requires `req.isAuthenticated()` (same guard as every sibling Companion route) and derives all data from `req.user`'s own household/preferences — no cross-user read added. | ✅ PASS |
| No new capability, store, or duplicate state | Confirmed — see per-item sections below. | ✅ PASS |

**Gate result: PASS.** Implementation proceeded.

---

## WHAT WAS ACTIVATED

### 1. `buildGreeting()` wired into `FloatingAssistant` (Companion — global, every journey)

**Gap:** `server/intelligence/conversation/behaviour-engine.ts`'s `buildGreeting()` — six personalities × two variants each, deterministic per-day selection, fully unit-tested (`test-intelligence-personality-platform.ts`) — had zero call sites outside its own test. The Companion widget's empty state hardcoded `"Hi, I'm Apple!"` regardless of the household's chosen personality (Companion/Friend/Coach/Chef/Teacher/Sergeant).

**What changed:**
- `server/routes.ts` — new `GET /api/intelligence/companion/greeting`. Thinnest possible seam: resolve the caller's personality via `normalizePersonalityId(prefs?.companionPersonality)` (the exact helper every sibling Companion route already uses), pick a deterministic days-since-epoch seed, call `buildGreeting(personalityId, daySeed)`, return `{ text }`. No template content added; no fact ever inserted (the function's own documented contract).
- `client/src/hooks/use-companion-greeting.ts` — new, one-purpose hook mirroring `use-companion-observations.ts`'s exact shape (thin fetch wrapper, honest `401` → empty string, 5-minute `staleTime`).
- `client/src/components/conversation/FloatingAssistant.tsx` — the empty-state greeting now renders `greetingData?.text || "Hi, I'm Apple!"` — falls back to the original hardcoded line while loading or on any error, so the panel never renders blank.

**Why this is a Wave 1 item, not Wave 2:** `FloatingAssistant` is the one truly global surface — every journey that opens the Companion sees it. Activating it moves more users, in more journeys, per line of code than any single-page change.

### 2. `FoodOpportunitiesPanel` added to Shopping (Food Intelligence — closes the last of 5 primary domains)

**Gap:** FI5 wired the same `opportunity-delivery`-backed panel into Dashboard, Weekly Planner, Cookbook/Meals, and Pantry. Shopping — arguably the domain where "you have this in your pantry, use it before it goes off" opportunities are most actionable — was the one primary domain missing it, confirmed independently by both `EWO_DOMAIN_FUTURE_STATE_AUDIT.md` (D7) and `EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` (A19).

**What changed:** `client/src/pages/shopping-workspace-page.tsx` (the live route — `/list` and `/shopping-list` both redirect here; `shopping-list-page.tsx` is dead code, unrelated to this wave, not touched) — one `<FoodOpportunitiesPanel domains={["shopping"]} .../>` instance, gated to `mode !== "add"` so it never competes with the compose/writing surface, matching the same prop shape (`title`, `icon`, `limit`, `compact`, `data-testid`) already used on the other four pages. Zero new data, zero new capability, zero new producer — pure reuse of an already-registered, already-tested component.

### 3. Diary's own `nutrition-trend` observation surfaced on the Diary page (Companion — closes the platform's one zero-intelligence domain)

**Gap:** `companion-growth.ts`'s nutrition-trend signal is already computed, already voiced per-personality (`phraseObservation`), and already shown on Dashboard and the Nutrition Report — but Diary, the domain that *generates* the underlying data, had zero on-page intelligence of its own (confirmed by both audits, Category C/D item C7).

**What changed:** `client/src/pages/food-diary-page.tsx` — reuses `useCompanionObservations()` (the exact same hook `FloatingAssistant` already uses) to read the already-Silence-Ruled, already-personality-voiced observation list, finds the `category === "nutrition-trend"` entry if the Silence Rules let one survive, and renders it near the top of the Daily Log tab (before the meal-slot list) using `variantForInteraction()` from `companion-delight.ts` for the same motion treatment already used elsewhere. Zero new computation: if Silence Rules produce no nutrition-trend observation for this user today (e.g. below the minimum-sample floor, or another observation legitimately took priority), Diary honestly shows nothing extra — never a fabricated placeholder.

### Deliberately NOT done in this wave

Two items researched and explicitly deferred, with reasons:

- **"Wire Tier-4 planner recovery" (`household-meal-matcher.ts`)** — surfaced by the launch audit (D8/D14) as a "no new logic" quick win. On inspection this is materially larger and not yet fully scoped: three separate prior investigations (`HOUSEHOLD_EATERS_INTEGRATION_AUDIT.md`, `MATCH_MEALS_HOUSEHOLD_EATERS_MIGRATION_SCOPE.md`, `LIVE_HOUSEHOLD_COMPONENT_MEAL_VALIDATION.md`) identify open design questions — which profile source (`household_eaters` vs `householdMembers`), whether `plannerWeekEaterOverrides` is populated in practice, and where `weekId` propagates from at generation time. Wiring this without resolving those questions first would risk exactly the kind of silent-behaviour-change this platform's own architecture principles warn against. Left for its own scoped implementation, not rushed into Wave 1.
- **Unifying the "two ambient widgets" pattern on Planner/Cookbook/Pantry (D6/A18)** — each of these pages already shows an older discovery strip *and* the FoodOpportunitiesPanel side by side with no shared frame. This is real (both audits name it as the most visible cross-domain UX inconsistency), but it is a presentation-harmony refinement across three pages with real design judgement calls (shared heading? merged component? which strip wins visual priority?) — a good Wave 2 candidate, not a same-day activation.

---

## DATA IMPACT

- **Reads existing data only.** No new table, no new column, no new capability, no new producer.
- **Writes:** none. All three activations are read-and-voice paths; the Companion greeting and Diary observation are pure reads, the Shopping panel reuses the existing `opportunity-delivery` `report`/`review`/`approve`/`delete` verbs unchanged.
- **Schema:** unchanged.
- **Requires backfill:** no.

---

## TRUST CHECK

- **Could this mislead the user?** No. The greeting text comes verbatim from `buildGreeting()`'s own fixed template set (no fact interpolation — the function's own contract). The Diary observation is the same Silence-Ruled, non-fabricating read already live on Dashboard. The Shopping panel surfaces the same `opportunity-delivery` entries already shown (and already evidence-tagged) on four other pages.
- **Could this fabricate certainty?** No new claim type is introduced anywhere in this wave.
- **Is anything guessed but shown as real?** No — every rendered value traces to an existing, tested function; nothing here infers or estimates.
- **Permission-aware?** Every new/changed route requires authentication and reads only the calling user's own household/preferences/pantry/plan data — identical guard pattern to every sibling route it sits beside.
- **No architectural duplication introduced:** confirmed — no new capability, no new store, no second greeting/observation computation path.
- **No new source of truth created:** confirmed.

---

## VERIFICATION PERFORMED

- **`npx tsc --noEmit`** — zero errors in any file this wave touched (`server/routes.ts`, `client/src/components/conversation/FloatingAssistant.tsx`, `client/src/hooks/use-companion-greeting.ts`, `client/src/pages/shopping-workspace-page.tsx`, `client/src/pages/food-diary-page.tsx`). The repo's pre-existing baseline (170 errors, entirely in unrelated `server/scripts/*`, `server/tests/*`, and discovery-handler files) is unchanged by this wave — confirmed by diffing against a `git stash` of this wave's edits.
- **`npx tsx server/tests/test-intelligence-personality-platform.ts`** — 114 passed, 0 failed (covers `buildGreeting` across all six personalities).
- **`npx tsx server/tests/test-intelligence-observation-engine.ts`** — 32 passed, 0 failed (covers `observeNutritionTrend`/`phraseObservation`, the exact read Diary now surfaces).
- **Live, end-to-end, real server run:** started the dev server against the live dev database, registered a throwaway account (`ia1-wave1-smoketest@example.com`, deleted after use — no trace left in the `users` table), verified its email, logged in, and called the changed/added routes as that authenticated user:
  - `GET /api/intelligence/companion/greeting` → `{"text":"Hi, good to see you."}` — a real, personality-voiced line, not the hardcoded fallback.
  - `GET /api/intelligence/companion/observations` → returned pantry-opportunity observations honestly (this fresh test account had no health-trend history yet, so no nutrition-trend observation survived Silence Rules — the correct, honest outcome, not a bug).
  - `GET /api/intelligence/food-opportunities` → returned 10 real pantry-sourced opportunities, confirming the exact data `FoodOpportunitiesPanel` on the new Shopping instance will render.
- **Not performed:** a full browser/visual screenshot pass. Playwright is installed but headless Chromium's system shared libraries (`libglib-2.0.so.0`) are not present in this sandbox, and this environment manages system dependencies via Nix rather than `apt`/`playwright install-deps` (confirmed by attempting the install, which failed with that guidance printed explicitly). Stated here plainly rather than claimed — the JSX changes themselves are structurally identical, prop-for-prop, to already-live instances of the same components on four other pages, which is the basis for confidence short of an actual screenshot.
- **Environment left as found:** the dev server was restarted (once, to pick up code changes; a second time, after the registration-bypass test, to drop back to its normal non-bypass config) and is currently running cleanly on port 5000. The throwaway test account and its verification/cleanup scripts were fully removed — `git status` shows no trace of them.

---

## SCOPE LOCK

**Implemented (this wave):**
1. `GET /api/intelligence/companion/greeting` + `use-companion-greeting.ts` + `FloatingAssistant.tsx` wiring — `buildGreeting()` activated.
2. `FoodOpportunitiesPanel` added to `shopping-workspace-page.tsx` — Food Intelligence's opportunity surface now reaches all 5 primary domains (Dashboard, Planner, Cookbook, Pantry, Shopping).
3. Diary's existing `nutrition-trend` observation rendered on `food-diary-page.tsx` — the platform's one zero-on-page-intelligence domain now has one.

**Explicitly excluded from this wave (candidates for IA2 / Wave 2, not forgotten):**
- Tier-4 planner recovery wiring (`household-meal-matcher.ts`) — genuinely larger, has open design questions per three prior investigations; needs its own scoped plan.
- Unifying Planner/Cookbook/Pantry's "two ambient widgets" into one shared frame — a presentation-harmony task with real design judgement calls.
- `household-meal-matcher` direct UI entry point (household "what can everyone eat" discovery) — a new UI affordance, reasonable next step, larger than a same-day activation.
- Wiring Evidence & Learning to a first real *consumer* (beyond the one existing best-effort reporter) — PKC5 already named this as the recommended next Platform Knowledge Expansion programme; a separate, larger effort, not part of Intelligence Activation's own scope.
- Personality visual identity (`avatarId`/`colorTheme` rendering) — the fields exist but have no design mapping to real colours/assets yet; needs design input before implementation, not just wiring.
- All Category A/B/E/F/G items from the launch-experience audit (error boundaries, allergen coverage, sourced-benefit citation UI, responsive/a11y hardening) — real and tracked, but outside this task's Intelligence Platform scope.

**Suggestion for IA2 (not implemented without further scoping):** the three items above rated 🟢 risk and "Low" effort in the launch-experience audit — the ambient-widget unification and the household-meal-matcher UI entry point — are the next-most-defensible "activate what's already built" candidates once each has had its own short design/scope pass.

---

*Rollback: `git checkout rollback/before-ia1-wave1-20260704` (tag on `ff3b2cf`, the HEAD this wave started from — identical to the PKC5 verification's own baseline; nothing between that commit and this wave's edits was reverted or altered).*
