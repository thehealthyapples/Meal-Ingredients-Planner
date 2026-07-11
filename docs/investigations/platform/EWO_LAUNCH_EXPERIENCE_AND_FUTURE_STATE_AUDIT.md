# EWO — THA Launch Experience & Future-State Completion Audit

**Date:** 2026-07-03
**Branch:** `int1-intelligence-platform`
**Type:** Investigation only. No code, schema, route, or capability change.
**Risk:** 🟢 GREEN (read-only audit)

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `ewo-launch-audit-rollback-20260703` → `3460519` |
| Working tree at start | Dirty with pre-existing, unrelated uncommitted work from prior sessions (FI5 Food Intelligence UI Activation, EWO1 Companion Platform Foundation, EWO2 Companion Personality Platform, EWX1 Living Companion Experience, EL2 Evidence & Learning Refinement — all already documented under `docs/implementation/` and `docs/investigations/`). None of these files are touched by this audit. |
| This task's writes | This file only: `docs/investigations/platform/EWO_LAUNCH_EXPERIENCE_AND_FUTURE_STATE_AUDIT.md` |
| Rollback to committed state | `git checkout ewo-launch-audit-rollback-20260703` |

**This is an investigation only.** No application code, database schema, services, routes, or prompts were modified. The single output is this document.

---

## ARCHITECTURE COMPLIANCE (confirmed before investigation)

Governing architecture reviewed in full before writing this document: `ARCHITECTURE_PRINCIPLES.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1), `THA_MASTER_EVOLUTION_ROADMAP.md`, and the same-day `EWO_DOMAIN_FUTURE_STATE_AUDIT.md` (a companion investigation covering the Intelligence/Capability axis in depth — this document deliberately does not re-derive its findings, it cites and extends them onto the Experience/UI/Delight/Data axis that document explicitly did not re-audit).

| Check | Finding | Verdict |
|---|---|---|
| One canonical Intelligence Platform | `server/intelligence/intelligence-platform.ts` — single singleton, one `.handle()` entry point. Re-confirmed, not re-derived (see `EWO_DOMAIN_FUTURE_STATE_AUDIT.md`). | ✅ PASS |
| One Capability Registry | `server/intelligence/capability-registry.ts` — single file. | ✅ PASS |
| One Intent Engine | `server/intelligence/intent-engine.ts` + `intent-resolver.ts` — single pipeline. | ✅ PASS |
| One owner per fact | Pre-existing contested trio (`nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts`) remains un-retired — tracked in the SoT Register, not introduced by this audit, not touched by this audit. | ✅ PASS (pre-existing, tracked) |
| No duplicate capabilities / state | No new capability, store, or state was created by this investigation. | ✅ PASS |
| Evolution over replacement | This document extends the same-day domain audit rather than replacing it; every recommendation below activates or refines existing architecture, never proposes a new store. | ✅ PASS |

**Gate result: PASS.** The investigation continues.

---

## METHOD & GROUNDING

This audit answers a different question than `EWO_DOMAIN_FUTURE_STATE_AUDIT.md`. That document asked *"does each domain match its own architected intelligence vision?"* (an engineering-completeness lens) and produced a Capability/Architecture-weighted maturity matrix (platform average 56%). **This document asks *"what would a first-time user actually notice?"*** — visual polish, loading/empty/error states, accessibility, animation, delight, data trustworthiness — and does not re-litigate that document's capability findings, only cites them where directly relevant (e.g. the 2-of-13 write-intent gap is a UX fact as much as an architecture fact).

Evidence sources, each verified against live code, not assumed from docs:
1. `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` (2026-06-18) — the last full production-readiness pass, used as a *baseline* to check what has and hasn't moved since.
2. `docs/investigations/platform/EWO_DOMAIN_FUTURE_STATE_AUDIT.md` (2026-07-03, same day) — the Intelligence/Capability axis, cited not repeated.
3. Three independent, parallel read-only research passes over the live codebase, run for this document specifically:
   - **UI/UX/Accessibility pass** — 18 pages, `nav-bar.tsx`/`workspace-header.tsx`/`PageHeader.tsx`, `tailwind.config.ts`, loading/empty/error state patterns, responsive-class density, a11y, animation, icons/illustrations, density/scrolling.
   - **Delight/Companion pass** — `companion-delight.ts`, `behaviour-engine.ts`, `personality-registry.ts`, `observation-engine.ts`, `FloatingAssistant.tsx`, celebration/greeting/silence/personality/micro-interaction/onboarding/empty-state/trust-UI code paths.
   - **Domain data completeness pass** — ingredient coverage, nutrition evidence sourcing, allergen coverage, retailer/partner data, recipe corpus, product/additive knowledge, household modelling depth, barcode coverage, the Evidence & Learning platform's actual usage.

Every finding below traces to a specific file/line or a specific passage in a named governing document. Where a claim could not be verified from static code (e.g. live DB row counts), this is stated explicitly rather than estimated.

---

# PART 1 — EXECUTIVE SUMMARY

THA's underlying engineering is substantially more capable than its surface experience communicates. The pattern repeating across every axis audited here is the same: **real, well-built infrastructure sitting one activation step away from being felt** — a fully-specified six-personality greeting system that is never called (`buildGreeting()`), a built celebration component rendered with no more visual weight than a static card, a proven "Why" evidence-disclosure pattern applied to three components but not to the app's highest-stakes nutrition-claim surface (`FoodReport.tsx`), an illustration asset (`orchard-hero.tsx`) that exists and is never imported. This is the single most important finding of this audit: **the majority of what would make THA feel premium is not "build it" — it is "wire it up."**

Three structural gaps sit underneath the polish gaps and would undermine any UI investment if left unaddressed:

1. **No global error boundary exists anywhere in the app.** A single render-time exception on any page produces a blank white screen. Combined with the finding that 17 of 18 audited pages never check `isError` on their data queries, a failed fetch today silently looks like "no data" rather than "something went wrong" — this is a trust problem disguised as a missing UI element.
2. **Nutrition claims carry no per-claim citation UI, and the underlying data matches that gap honestly**: every food↔benefit and nutrient↔benefit relationship in the knowledge graph is hardcoded to `confidence: "established"` / `source: "THA editorial"` — there is no per-entry `SourceRef` or `reviewedAt` anywhere in the live seed data. This is the same WS2 gap the Master Roadmap named as the launch keystone on 2026-06-18; it has not moved.
3. **Companion write-capability remains 2-of-13** (Planner, Shopping only) — confirmed independently by this audit's own code reads, matching `EWO_DOMAIN_FUTURE_STATE_AUDIT.md`. Every other domain's honest-gap messaging needs a consistency pass (Category F) so "I can't do that yet" reads as considerate, not broken.

**What is genuinely strong and should not be re-built:** the design token system for colour/surface (`tailwind.config.ts`), the empty-state discipline on Dashboard/Shopping/Cookbook (icon + heading + CTA), the six-personality Companion architecture (`personality-registry.ts`, 12-dimension behaviour profiles, not shallow), the observation Silence Rules (real dedup + priority + round-number gating, not naive), and onboarding's relative polish (custom progress indicator, `framer-motion` step transitions). These are premium-product-grade foundations that most of the rest of the app has not yet been brought up to.

---

# PART 2 — PLATFORM EXPERIENCE SCORE

**53 / 100 — Functional, Not Yet Premium.**

This score answers "how does THA feel to a first-time user today," not "how complete is the architecture" (see `EWO_DOMAIN_FUTURE_STATE_AUDIT.md` for that lens — platform average 56% on the intelligence axis, a related but distinct number arrived at independently). Scored per category against the evidence gathered in Part 3 below, on a 0–100 scale, investigator judgement grounded in cited evidence, not an automated metric.

| Category | Score | Basis |
|---|---|---|
| A — User Experience | 58 | Empty/loading-state discipline exists but is inconsistently applied (skeletons on 2 of 18 pages); zero error boundary; a11y coverage strong on shell chrome, weak inside page bodies; responsive density highly uneven across pages. |
| B — User Interface | 55 | Solid semantic colour/surface tokens; heavy escape-hatching to arbitrary Tailwind values on the densest pages (up to 100 arbitrary classes/page); animation applied to fewer than half of pages, no consistent page-enter pattern; one custom icon, one unused illustration. |
| C — Companion | 60 | Architecturally the most rigorously gated system in the codebase (95/100 per domain audit); but a fully-built greeting/personality-voice system sits unused, and write-capability is 2-of-13. |
| D — Intelligence | 58 | Matches `EWO_DOMAIN_FUTURE_STATE_AUDIT.md`'s Capability(54)/Experience(62) blend — cited, not re-derived. |
| E — Domain Data | 45 | Allergen coverage is Phase 3 of a stated 4 (5 major allergens missing); nutrition evidence has zero per-entry sourcing; no recipe corpus with instructions exists; household eater model is name + two arrays only. |
| F — Trust | 50 | Strong *principles* (disclaimers, EFSA firewall, honest-gap discipline) but the primary claim surface (`FoodReport.tsx`) has zero visible citation/confidence UI despite the "Why" disclosure pattern already existing elsewhere in the codebase. |
| G — Delight | 48 | Real celebration/observation infrastructure exists (round-number gating, dedicated `CelebrationCard`) but is rendered with no distinct visual treatment; zero `whileTap`/`whileHover` micro-interactions found anywhere in the client. |
| **Platform average** | **53.4 ≈ 53** | Simple mean across the seven categories. |

**Reading the score:** THA is not thin — it is *unevenly activated*. The categories that score lowest (E, G) are the ones where the gap is substantially content/wiring, not missing engineering. The fastest way to move this number is Part 6's Quick Wins list, almost none of which require new services.

---

# PART 3 — LAUNCH READINESS SCORE

**57 / 100 — Not Launch Ready. Critical path items remain open, and no new blockers were introduced since the last full assessment.**

This score is anchored to `THA_MASTER_EVOLUTION_ROADMAP.md`'s own Definition of Done (§9) and its Stop Conditions, cross-checked against this audit's independent code reads to confirm what has and hasn't changed since 2026-06-18.

| Roadmap gate | Status at 2026-06-18 | Status confirmed by this audit (2026-07-03) |
|---|---|---|
| WS0 — Knowledge Foundations (enum + nutrient vocab reconciled) | Blocking, open | Not independently re-verified in this pass (out of scope — data-shape, not experience); no evidence found that it has closed. |
| WS2 — Minimum 5 sourced, signed-off health benefits | Blocking, open | **Confirmed still open** — every relationship in `shared/knowledge/relationships.ts`/`index.ts` is hardcoded `source: "THA editorial"`, zero `SourceRef`/`reviewedAt`. This is the same gap, unchanged. |
| Responsive coverage at all 6 breakpoints | 🟡 partial, "the one true production gap" | **Still uneven** — responsive-class density varies from ~2/1000 lines to ~70/1000 lines across pages audited; `shopping-list-page.tsx` (the largest transactional flow at 4,251 lines) is among the thinnest. |
| Adaptive Density reconciled (768 vs 640 breakpoint mismatch) | 🔴 gap named explicitly | Not re-verified breakpoint-by-breakpoint in this pass; flagged as unresolved pending a dedicated check (Improvement A16). |
| A11y audit | 🟡 "unverified... recommend a focused pass before launch" | **Partially addressed, not complete.** Shell chrome (`nav-bar.tsx`, `workspace-header.tsx`) has solid `aria-label` coverage. In-page icon-only buttons (e.g. `pantry-page.tsx` delete buttons) frequently lack them. No dedicated audit artifact found. |
| Error handling / fallback | ✅ strong (fallback-to-nutrients) / 🟡 client error UI unconfirmed | **New finding, not in the June roadmap:** zero `ErrorBoundary` anywhere in the client; 17 of 18 pages never render an `isError` state for reads. This is a genuine regression risk if not caught before launch, not merely unpolished. |
| Trust messaging / empty states | ✅ strong | Confirmed still strong for the *disclaimer* layer; but per-claim citation UI is absent on `FoodReport.tsx` specifically (new, more granular finding than the June pass made). |
| Companion write-capability | Not assessed in June (Companion work postdates the roadmap) | 2 of 13 capabilities (Planner, Shopping) — confirmed by both this audit and the same-day domain audit. |

**Net assessment:** the June 18 roadmap's own Stop Conditions are still not fully met (WS2 unsourced benefits, responsive/density/a11y incomplete), and this audit surfaces one additional, previously-unnamed blocker-class issue: **the absence of any client-side error boundary**, which is a launch-safety issue independent of the knowledge-content critical path. Nothing found in this audit *worsens* launch readiness relative to June — the score reflects that the same critical-path items remain open three weeks later, not new regressions (excepting the newly-surfaced error-boundary gap, which was not checked in the prior pass).

---

# PART 4 — DOMAIN DATA COMPLETENESS MATRIX

Assessed on *knowledge sufficiency*, not architecture (architecture ownership is already governed by the SoT Register). Rating legend: 🟢 sufficient for launch · 🟡 thin/partial · 🔴 significant gap.

| Domain | Coverage found | Rating | What's missing |
|---|---|---|---|
| Food Knowledge (WS0) | 188 foods (`shared/knowledge/`) | 🟡 | Zero per-entry evidence sourcing (`SourceRef`/`reviewedAt`) — see Part 3 WS2. |
| Canonical Food Identity (WS2A) | 239 entries (`shared/canonical/foods.ts`) | 🟢 | Reconciliation status vs the 188 WS0 foods not independently re-verified this pass (flagged, Improvement E11). |
| Dietary Restrictions/Allergens | 10 of 14 UK-regulated allergens (`restriction-library.ts` v3.0.0); rich hidden-ingredient/substitution data *within* those 10 | 🟡 | Fish, celery, lupin, molluscs, sulphites explicitly named "Phase 4 candidates" — not yet built. |
| Ingredient Catalogue | Pipeline exists (`shared/catalogue/`); `ingredient_classifications` populated only at runtime, no seed | 🟡 | No static row count determinable from code — coverage is operationally unknown without a live DB query. |
| Ingredient Aliases | ~150–200 hand-curated US↔UK/synonym entries | 🟡 | Deliberately small and human-curated (by design) — sufficient for common terms, not exhaustive. |
| Recipe/Meal Corpus | 55 meal-shell frameworks (no ingredients), 310 name-only ready-meal rows, **zero** seeded recipe-type meals with instructions | 🔴 | No static recipe corpus with real instructions exists at all; recipes are fetched live per-import only. Edamam's licensed 40k+ corpus is a named future option, not yet acquired. |
| Product/Additive Knowledge | 300 E-number entries (`additives-seed.ts`) — broad; only 13 editorial concept explainers (`food_knowledge` table) — narrow | 🟡 | The raw E-number list is comprehensive; the "why it matters" editorial layer covering it is thin (13 entries). |
| Retailer/Partner Knowledge | 11 UK stores modelled via **static confidence-tiered availability inference** — explicitly "no external APIs called" | 🟡 | No live pricing; `groceryProducts.price` has no populating source found. "Price intelligence" should be described accurately as inference, not live pricing, wherever it's surfaced. |
| Partners (Friends & Family) | 12 wellness/local-service entries (`client/src/data/partners.ts`) | 🔴 | Reads as placeholder/sample content; the Master Roadmap's own open question ("is Partners in launch scope") appears unresolved. |
| Product Barcode Coverage | Live pass-through to Open Food Facts (crowd-sourced, "frequently incomplete" per THA's own code comment) | 🟡 | Not THA-authored; coverage is entirely dependent on OFF's live corpus + user scans. Honest, but should be communicated as such in-product. |
| Household Modelling | `displayName` + `defaultDietTypes[]` + `hardRestrictions[]` only | 🔴 | No age band, likes/dislikes, goals, or appetite/portion field — blocks any future personalisation without a schema extension (deferred by design per Master Roadmap, but still a real data gap). |
| Evidence & Learning Platform | Full architecture built (`household_evidence_events`, thresholds, decay logic) | 🔴 | **Zero real reporters, zero real consumers** — confirmed directly in `EL2`. No domain has wired into it yet; today's nutrition claims rely solely on static seed data, not any live evidence loop. |

**Reading the matrix:** the single most consequential gap is **nutrition evidence sourcing** (Food Knowledge row) — it is both a data gap and the direct cause of the Trust-category findings in Part 5. The single most consequential *content* gap for user-facing richness is the **absence of a real recipe corpus** — Cookbook's entire value proposition depends on this, and today it is live-fetch-and-import only.

---

# PART 5 — DOMAIN FUTURE-STATE MATRIX

This matrix is **inherited from `EWO_DOMAIN_FUTURE_STATE_AUDIT.md`** (same-day, Intelligence/Capability axis) and is reproduced here for a single-document reference, not re-derived. See that document for full per-domain Current State / Future Vision / Gap Analysis / Recommendations.

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

**This audit's addition to that matrix:** the "Experience" column above was scored against the intelligence-surface lens (does this domain have a Companion Card, a discovery strip, an opportunity panel). Layering this audit's UI/Delight findings on top, **Diary, Partners, and Administration remain the three weakest domains on both axes simultaneously** — they have neither rich intelligence surfacing nor strong visual/interaction polish, making them the platform's clearest "feels unfinished" surfaces to a first-time user.

---

# PART 6 — CROSS-DOMAIN REVIEW

Extends `EWO_DOMAIN_FUTURE_STATE_AUDIT.md` Part 2 with new findings from this audit's UI/Delight/Data passes.

**Duplicated experiences (new finding this audit):** `shopping-list-page.tsx` (4,251 lines) contains substantial live page logic — hand-built empty states, a custom fullscreen dialog implementation, ~100 arbitrary Tailwind classes — that is inconsistent with it being a pure redirect stub to `/shopping-workspace`. If both pages render live UI today, this is a duplicate-experience risk at a larger scale than the already-known Planner/Cookbook/Pantry "two ambient widgets" pattern. **Recommend verifying route behaviour directly** (Improvement A21) before assuming the redirect fully supersedes it.

**Inconsistent empty-state tone:** Diary and Planner empty states carry genuine Companion voice ("When things drift, we help you find your way back — simply."); Shopping and Pantry-category empty states are plain utility copy ("Your basket is empty.", "No larder staples yet."). No shared `EmptyState` component exists, so each page's visual treatment (icon size, circle background, copy tone) differs independently.

**Inconsistent animation investment:** `framer-motion` appears in 11 of ~26 client files, concentrated unevenly (`meals-page.tsx` 29 occurrences vs `weekly-planner-page.tsx` 1, despite the latter being equally interactive). Nine pages have zero animation-library usage at all. There is no shared page-transition wrapper at the router level.

**Inconsistent honest-gap Companion messaging:** 10 of 13 capabilities return a "not yet wired" gap when a write intent is attempted. This is architecturally correct and phased deliberately (`EWO_DOMAIN_FUTURE_STATE_AUDIT.md`), but this audit did not find evidence of a single shared copy pattern for these gap messages — worth a consistency pass so the *tone* of "I can't do that yet" is uniform (Category F, Improvement F7).

**Built-but-dormant infrastructure (the platform's dominant pattern):** `buildGreeting()` (6 personalities × 2 variants, fully implemented, zero call sites outside its own test), `orchard-hero.tsx` (illustration asset, zero imports), the `avatarId`/`colorTheme`/`voiceProfileId` personality fields (defined, "not yet rendered anywhere" per code comment), the Evidence & Learning platform (fully architected, zero real reporters). None of these are missing features — they are shipped, tested, unconnected features. This is the single strongest cross-cutting theme in this audit and should reframe how "100 improvements" is read: **a large fraction of the list below is wiring, not building.**

---

# PART 7 — TOP ~100 IMPROVEMENTS

Organized by category (A–G per the brief). Each row provides Problem/Why-it-matters (merged for density — every cell states both what's wrong and why it's consequential), Recommendation, Impact, Effort, Priority, Timeframe class, and Risk. IDs are stable references used in Parts 8–10.

## Category A — User Experience (21)

| ID | Title | Problem / Why it matters | Recommendation | Impact | Effort | Priority | Type | Risk |
|---|---|---|---|---|---|---|---|---|
| A1 | Give `food-detail-page.tsx` a workspace shell | It's the richest intelligence surface in the product yet the only main page with no `WorkspaceHeader`/shell — hand-rolled back link instead. Breaks the otherwise-universal pattern (16/18 pages compliant). | Wrap it in the same shell/header pattern as every other domain page. | High | Low | P1 | Quick Win | 🟢 |
| A2 | Delete or document the dead `PageHeader.tsx` | Zero imports anywhere — a maintained-looking component that is actually dead code, confusing to future contributors. | Delete it, or if intended for future use, note that in a comment. | Low | Low | P3 | Quick Win | 🟢 |
| A3 | Add skeleton loading states beyond Profile/Pantry | Only 2 of 18 pages use `<Skeleton>`; the rest (Meals, Planner, Shopping, Diary, Meal Detail, Products, Quick Meal) show a spinner or let content pop in — reads as unfinished on first load, THA's most frequent user touchpoint. | Add skeleton placeholders matching final layout on the 6+ highest-traffic pages first (Meals, Planner, Shopping). | High | Medium | P1 | Medium | 🟢 |
| A4 | Add a global `ErrorBoundary` | Zero exists anywhere in the client. A single render exception on any page produces a blank white screen with no recovery path — the single highest-severity finding in this audit's UX pass. | Wrap the route tree in `App.tsx` with a top-level `ErrorBoundary` that shows a calm "something went wrong, reload" state. | Critical | Low | P0 | Quick Win | 🔴 |
| A5 | Surface read/fetch errors, not just mutation errors | 17 of 18 pages never check `isError` on reads — a failed GET silently resolves to what looks like "no data," undermining trust in emptiness (is it really empty, or broken?). | Add a shared `isError` → inline error state pattern; apply to the highest-traffic pages first. | High | Medium | P0 | Medium | 🟡 |
| A6 | Build a shared `EmptyState` component | No shared component exists; every page hand-rolls icon+heading+copy+CTA independently, producing visibly inconsistent icon sizing, circle backgrounds, and copy tone page to page. | Extract one component from the best existing examples (Dashboard, Shopping, Cookbook) and migrate other pages to it. | Medium | Medium | P1 | Medium | 🟢 |
| A7 | Fix bare-text empty states (Pantry categories) | `pantry-page.tsx` renders category-empty states as plain italic text with no icon or CTA — inconsistent with the well-designed empty states elsewhere in the same app. | Apply the new shared `EmptyState` component (A6) here first. | Medium | Low | P2 | Quick Win | 🟢 |
| A8 | Responsive audit + fix: `shopping-list-page.tsx` | Lowest responsive-class density (~3.3/1000 lines) among the largest transactional pages (4,251 lines) — the biggest single mobile-risk surface in the app given its traffic. | Dedicated responsive pass at 375/640/768/1024/1280/1536 per the Master Roadmap's own DoD checklist. | High | Medium | P0 | Medium | 🟡 |
| A9 | Responsive audit: onboarding & food-diary | Thin responsive-class density (~3.7–5/1000 lines); onboarding is the first-run experience — a mobile layout problem here is a first-impression problem. | Same breakpoint audit as A8, applied here. | Medium | Medium | P1 | Medium | 🟡 |
| A10 | Add `aria-label` to icon-only action buttons | E.g. `pantry-page.tsx` delete buttons use only a `Trash2` icon with a `data-testid` (not exposed to assistive tech), no `aria-label`. Pattern likely recurs across other icon-only buttons in page bodies (shell chrome itself is already compliant). | Grep-and-fix pass for icon-only `Button` components missing `aria-label`. | Medium | Low | P1 | Quick Win | 🟢 |
| A11 | Add keyboard handling to custom interactive widgets | Chips/cards/dropdown rows outside Radix primitives have sparse `onKeyDown` coverage — keyboard-only users likely can't operate several custom widgets. | Audit + add keyboard handlers to the highest-traffic custom widgets first (shopping list rows, planner cards). | Medium | Medium | P1 | Medium | 🟡 |
| A12 | Replace custom fullscreen dialogs with Radix `Dialog` | `shopping-workspace-page.tsx` and `shopping-list-page.tsx` implement custom `fixed inset-0` fullscreen modes outside Radix — no `role="dialog"`, no focus trap, no Escape handling, despite Radix `Dialog` already being used in 13 other page files. | Migrate these two fullscreen modes onto the existing Radix `Dialog` primitive. | Medium | Medium | P2 | Medium | 🟡 |
| A13 | Standardize `<label>` vs `<Label>` | Native `<label>` (11 files) and Radix/shadcn `<Label>` (8 files) are used roughly evenly with no stated rule — a maintainability and a11y-consistency risk. | Pick `<Label>` as the standard (already accessible-by-default) and migrate. | Low | Medium | P3 | Long Term | 🟢 |
| A14 | Add list virtualization on the densest pages | No virtualization library anywhere in the client; `shopping-list-page.tsx` (60 `.map()` calls), `weekly-planner-page.tsx` (52), `shopping-workspace-page.tsx` (44), `products-page.tsx` (31) all render potentially-large lists with no windowing — a performance-perception risk as data grows. | Introduce `react-virtual` (or similar) on the largest list surfaces once list sizes are confirmed to warrant it. | Medium | High | P2 | Long Term | 🟡 |
| A15 | Reduce nested scroll containers | `meals-page.tsx` has 13 separate `overflow-y-auto` regions, nested inside the page's own scroll region, nested inside the app's global `<main>` scroll — a real scroll-within-scroll-within-scroll risk on the busiest pages. | Audit and flatten scroll containers on Meals/Shopping/Planner to at most one nested level. | Medium | Medium | P2 | Medium | 🟡 |
| A16 | Reconcile the Adaptive Density system | Foundation exists (`use-adaptive-density.tsx`, 640/1280/1536 breakpoints) but was found inconsistently consumed as of the June roadmap (Plant Diversity used a different 768 breakpoint). Not re-verified fixed in this pass. | Confirm current state; if still mismatched, migrate all launch surfaces to one density system. | High | Medium | P0 | Medium | 🟡 |
| A17 | Give Household a first-class nav destination | Household composition lives buried inside Profile's `HouseholdSettings` sub-section despite being central to restriction-safety (Rule T0) across the whole platform — a real discoverability gap for a safety-critical feature. | Product decision + small nav addition; no new architecture required (data already exists). | Medium | Low | P1 | Quick Win | 🟢 |
| A18 | Unify the "two ambient widgets" pattern (Planner/Cookbook/Pantry) | Each of these pages shows an older discovery strip *and* the newer `FoodOpportunitiesPanel` side by side with no shared heading — the most visible cross-domain UX inconsistency per the domain audit. | One shared visual frame with labelled sub-sources; presentation-only, no new data. | High | Low | P0 | Quick Win | 🟢 |
| A19 | Add `FoodOpportunitiesPanel` to Shopping | The only one of the four primary domains missing this panel — an unexplained asymmetry (component already built). | Add one `<FoodOpportunitiesPanel domains={["shopping"]} />` instance. | Medium | Low | P1 | Quick Win | 🟢 |
| A20 | Verify `shopping-list-page.tsx` route behaviour | Found to contain substantial live page code inconsistent with being a pure redirect stub to `/shopping-workspace` — risk of a large duplicate experience. | Confirm route table behaviour directly; if both render live, consolidate or fully retire one. | High | Medium | P0 | Medium | 🔴 |
| A21 | Increase typographic hierarchy on `products-page.tsx` | Nearly the entire page sits in `text-xs`/`text-sm` with weight as the only differentiator — comparative product data (the page's core purpose) reads flat. | Introduce `text-base`/`text-lg` for primary comparison data points. | Medium | Low | P2 | Quick Win | 🟢 |

## Category B — User Interface (17)

| ID | Title | Problem / Why it matters | Recommendation | Impact | Effort | Priority | Type | Risk |
|---|---|---|---|---|---|---|---|---|
| B1 | Replace arbitrary text-size classes with the type scale | `text-[10px]`/`text-[11px]`/`text-[9px]` etc. appear ~100 times each on `shopping-list-page.tsx` and `meals-page.tsx`, and 40–65 times on `products-page.tsx`/`shopping-workspace-page.tsx`/`weekly-planner-page.tsx` — sub-pixel one-offs instead of the design scale, the single biggest visual-inconsistency signal found. | Formalize a type scale in `tailwind.config.ts` and migrate the densest pages first. | High | High | P1 | Long Term | 🟡 |
| B2 | Replace hardcoded colours with design tokens | `dashboard.tsx` defines local `GREEN_DEEP`/`GREEN_PALE` hsl constants instead of using the `primary`/`accent` tokens already in `tailwind.config.ts`; `food-diary-page.tsx` hardcodes chart hex colours instead of the existing `--chart-1..5` variables. | Migrate both to existing tokens — zero new design work, pure consistency fix. | Medium | Low | P1 | Quick Win | 🟢 |
| B3 | Define a formal spacing/typography scale | `tailwind.config.ts` only defines colour/radius tokens today — no spacing or type scale, which is likely a root cause of B1's arbitrary-value sprawl. | Add a spacing/type scale to the config as the long-term fix underlying B1. | High | Medium | P1 | Medium | 🟢 |
| B4 | Activate the unused `orchard-hero.tsx` illustration | A built illustration asset with zero imports anywhere — onboarding instead reuses a repeated apple-icon image for its hero moments. | Use it as onboarding's hero art. | Medium | Low | P1 | Quick Win | 🟢 |
| B5 | Expand the custom icon set beyond `ThaAppleIcon` | Exactly one custom icon exists (used in 2 pages); everything else is generic `lucide-react` — a missed brand-distinctiveness opportunity relative to competitor apps. | Commission or design 5–10 brand icons for the most-used concepts (plants, pantry, planner, streak). | Medium | Medium | P2 | Long Term | 🟢 |
| B6 | Add a consistent page-enter transition | `framer-motion` usage is ad hoc (29 occurrences on Meals vs 1 on Planner); no `AnimatePresence` exists at the router level — page navigation feels abrupt and inconsistent. | Add one shared page-transition wrapper at the router level. | Medium | Medium | P2 | Medium | 🟡 |
| B7 | Bring animation to the 9 pages with zero `framer-motion` usage | Pantry, Profile, Shopping Workspace, Diary, Plant Diversity, Food Detail, Partners, Home, Quick Meal have no animation library usage at all — CSS-transition-only or none. | Introduce lightweight entrance/list-item animation on the highest-traffic of these first (Pantry, Shopping Workspace, Food Detail). | Medium | Medium | P2 | Medium | 🟢 |
| B8 | Add `whileTap`/`whileHover` micro-interactions | Zero occurrences found anywhere in the client — checking off a shopping item, completing a meal, dropping a planner card all rely on CSS colour-transition only, no satisfying scale/spring feedback. | Add to the 3–5 most-repeated user actions first. | High | Low | P1 | Quick Win | 🟢 |
| B9 | Elevate `meal-completion-dialog.tsx` visually | Plain `Check`/`Loader2` icons, generic toasts, no animation — a genuinely completion-worthy moment treated identically to any form submit. | Add a small celebratory animation + Companion-voiced toast copy. | Medium | Low | P1 | Quick Win | 🟢 |
| B10 | Standardize `EmptyState` visuals (design half of A6) | Icon sizes, circle backgrounds, and copy tone all differ independently per page even where a "designed" empty state exists. | Design half of the shared component work in A6. | Medium | Low | P2 | Quick Win | 🟢 |
| B11 | Increase icon-only button affordance consistency | Hover/press states on icon-only buttons vary across dense pages — inconsistent tactile feedback for the same interaction pattern. | Standardize via the shared `Button` component's `icon` variant. | Low | Low | P3 | Quick Win | 🟢 |
| B12 | Fix visual rhythm on `shopping-list-page.tsx`/`products-page.tsx` | These pages lean on tiny text sizes for compression instead of spacing discipline (per B1) — feels cramped rather than dense-by-design. | Apply B1/B3's new scale here first once available. | Medium | Medium | P2 | Medium | 🟡 |
| B13 | Render Companion personality visually, not just textually | `avatarId`/`colorTheme`/`voiceProfileId` fields are defined in `personality-registry.ts` but explicitly "not yet rendered anywhere" — choosing "Sergeant" vs "Friend" today only changes text tone. | Wire the existing fields into `FloatingAssistant.tsx`'s avatar/colour theme. | High | Medium | P1 | Medium | 🟢 |
| B14 | Add an optional richer audio/haptic feedback layer | No sound/haptic feedback exists anywhere; the deliberately-muted celebration design (per `companion-delight.ts`) is a reasonable default but offers no opt-in for users who want more. | Add an opt-in "richer feedback" toggle in Settings — additive, doesn't change the default. | Low | Medium | P3 | Long Term | 🟢 |
| B15 | Reconcile the 768-vs-640 Adaptive Density breakpoint (UI half of A16) | Named explicitly in the June roadmap as the #1 production gap; visual/breakpoint half of A16. | Same fix as A16, tracked here for the visual-QA checklist. | High | Medium | P0 | Medium | 🟡 |
| B16 | Polish first-run visual hierarchy on Dashboard's empty state | Good bones (icon-in-circle, CTA) but relies on locally-hardcoded colours (see B2) rather than the token system — first impression inconsistency. | Fix alongside B2. | Low | Low | P2 | Quick Win | 🟢 |
| B17 | Audit arbitrary-class usage platform-wide as a linting rule | The arbitrary-value sprawl (B1) has no guard rail today — nothing prevents it from growing further as new pages ship. | Add an ESLint/stylelint rule flagging new `text-[...]`/hex-colour usage outside the token system. | Medium | Low | P2 | Quick Win | 🟢 |

## Category C — Companion (14)

| ID | Title | Problem / Why it matters | Recommendation | Impact | Effort | Priority | Type | Risk |
|---|---|---|---|---|---|---|---|---|
| C1 | Wire `buildGreeting()` into `FloatingAssistant` | Fully built — 6 personalities × 2 variants each, day-seed variety — and never called anywhere outside its own unit test. The widget hardcodes `"Hi, I'm Apple!"` regardless of time or chosen personality. | Call `buildGreeting()` from `FloatingAssistant.tsx` on open. | High | Low | P0 | Quick Win | 🟢 |
| C2 | Consolidate the duplicated time-of-day greeting logic | Identical `getHours()`-based greeting logic exists independently in `dashboard.tsx` and `HomeIntelligenceCompanion.tsx` — should be one shared source, and (per C1) extended to the Companion widget too. | Extract to one shared helper; use everywhere greeting logic is needed. | Medium | Low | P1 | Quick Win | 🟢 |
| C3 | Show the active personality name near the `PersonaLabel` badge | EWO2's own named, unbuilt suggestion — small, already-scoped. | Implement as scoped. | Medium | Low | P1 | Quick Win | 🟢 |
| C4 | Build a persisted "last shown" observation log | Silence Rules are stateless today — an observation can theoretically re-show across sessions. Named as EWX1's own top suggestion. | One small additive table; the single biggest honesty upgrade to Silence Rules available. | High | Medium | P0 | Medium | 🟢 |
| C5 | Wire `meals-write-handler.ts` | The swap engine (`recipe-swap-engine.ts`) already exists and is fully built; the Intent Engine simply doesn't call it yet — the single highest-leverage capability unlock in the platform per the domain audit. | Bind the existing engine to a new handler file; zero new business logic. | High | Medium | P0 | Medium | 🟢 |
| C6 | Wire `pantry-write-handler.ts` / `household-write-handler.ts` / `profile-write-handler.ts` | Same read-only pattern repeats across Pantry, Household, Profile — each has an existing service ready to bind. | Sequence write-intent wiring domain by domain, reusing existing services. | High | High | P1 | Long Term | 🟢 |
| C7 | Surface Diary's `nutrition-trend` observation on the Diary page | Already computed by `companion-growth.ts`, already used on Dashboard/Nutrition Report — Diary itself is the one domain with zero on-page intelligence despite generating the platform's most important personalisation signal (S-0). | Render the existing observation directly on the Diary page — zero new computation. | Medium | Low | P0 | Quick Win | 🟢 |
| C8 | Give Recipe Import a Companion-visible seam | "Import this recipe for me" cannot resolve to a registered intent today, despite the underlying `/api/preview-recipe`/`/api/import-recipe` flow already existing. | Register the `Import` verb using the existing endpoints when `meals-write-handler.ts` (C5) is built. | Medium | Medium | P1 | Medium | 🟢 |
| C9 | Extend visual personality differentiation (Companion half of B13) | Cross-referenced with B13 — tracked here as a Companion-specific priority since it's the platform's newest headline feature. | Same fix as B13. | High | Medium | P1 | Medium | 🟢 |
| C10 | Add an "Ask about this product" Companion entry point on product detail | The richest judgement engine in the platform (Apple Score, `buildWhyBetter`, `rankChoices`) has the least visible AI presence of any domain with real intelligence behind it. | Seed the Companion with the scanned product's Context Frame from a lightweight entry point on the product detail view. | High | Medium | P1 | Medium | 🟢 |
| C11 | Resolve Partners' Companion silence honestly | Zero Companion/Food-Intelligence integration on Partners, correctly documented as intentional — but the open product-scope question ("is Partners in launch scope") appears unresolved since June. | Get a product decision before any further engineering investment (do not build speculatively). | Medium | Low | P1 | Quick Win | 🟢 |
| C12 | Give `household-meal-matcher` a direct UI entry point | "What can everyone eat?" exists as a working service but has no UI outside conversational discovery. | Add a direct button/surface on a Household-relevant page (ties to A17). | Medium | Medium | P2 | Medium | 🟢 |
| C13 | Voice interaction (TIP3 Phase E3) | Long-term, correctly sequenced behind write-intent maturity per TIP1's own phase-gating — not a near-term recommendation. | Do not build ahead of C5/C6 completing. | High | High | P3 | Long Term | 🟡 |
| C14 | Compose a proactive daily/weekly digest (TIP3 Phase E4) | `HomeIntelligenceCompanion`, `FoodOpportunitiesPanel`, and Observation Engine outputs render as three independent widgets today rather than one batched digest. | Compose existing outputs into one summary — no new computation, presentation-only. | Medium | Medium | P2 | Medium | 🟢 |

## Category D — Intelligence (14)

| ID | Title | Problem / Why it matters | Recommendation | Impact | Effort | Priority | Type | Risk |
|---|---|---|---|---|---|---|---|---|
| D1 | Complete Migration M1 — retire `nutrition-benefit-library.ts` | 25-food client library shadows the 188-food WS0 Registry; `PlantDiversityReport.tsx`/`MealUpliftPanel.tsx` currently read the smaller, non-authoritative store. Rated 🔴 launch risk by the SoT Register. | Route both consumers through WS0 via the existing adapter pattern. | High | Low | P0 | Quick Win | 🟢 |
| D2 | Complete Migration M2 — retire `pantry-knowledge.ts` | ~50-ingredient client file shadows `pantryIngredientKnowledge` DB table. | Seed the DB from the file, update `pantry-page.tsx` to read the API. | High | Medium | P0 | Medium | 🟡 |
| D3 | Complete Migration M3 — move `dietRules.ts` to `shared/` | Identical file exists in both `server/lib/` and `client/src/lib/` — a silent-split-brain risk on any future keyword change. | Pure refactor: one file move + import updates. | Medium | Low | P1 | Quick Win | 🟢 |
| D4 | Complete Migration M4 — canonical plant counting | `nutrition-variety.ts` keyword lists can disagree with the `diversity_group` DB table — an ingredient can be counted in the 30-plants widget but produce an empty Food Report. | Replace keyword matching with canonical slug lookup via a new `/api/canonical/plants` endpoint. | High | Medium | P0 | Medium | 🟡 |
| D5 | Build the Food Intelligence Engine (Phase 1) | Each nutrition surface (Plant Diversity, Pantry Explore, WNR, Analyser, SBC) is independently assembled today, not unified under one join+rank+explain engine. | Gated on D1/D2/D4 completing first (FI1's own Phase 0 exit gate) — do not start early. | High | High | P2 | Long Term | 🟡 |
| D6 | Unify Planner/Cookbook/Pantry's two ambient widgets (Intelligence half of A18) | Same finding as A18, tracked here for the Intelligence-surface owner. | Same fix as A18. | High | Low | P0 | Quick Win | 🟢 |
| D7 | Add `FoodOpportunitiesPanel` to Shopping (Intelligence half of A19) | Same finding as A19. | Same fix as A19. | Medium | Low | P1 | Quick Win | 🟢 |
| D8 | Wire Tier-4 planner recovery | `matchMealsForHousehold()` is built but unwired — restricted households can get empty breakfast slots. | Wire the existing fallback; no new logic. | Medium | Medium | P1 | Medium | 🟡 |
| D9 | Surface Analyser's engine via Companion Card (Intelligence half of C10) | Same finding as C10. | Same fix as C10. | High | Medium | P1 | Medium | 🟢 |
| D10 | Ship the WNR → Analyser deep-link seam | The `/analyser?q=…` pattern already exists; just needs wiring from the Weekly Nutrition Report. | Wire the existing pattern. | Low | Low | P2 | Quick Win | 🟢 |
| D11 | Build Admin Intelligence (Phase 3) | Two capabilities registered, zero handlers — correctly deferred per TIP1's own phase sequencing. | No urgency; sequence behind user-facing write-intent maturity (C5/C6). | Low | High | P3 | Long Term | 🟢 |
| D12 | Build Developer Intelligence (Phase 4, isolated deployment) | Same phase-gating logic as D11, additionally requires physical deployment isolation. | Same — no urgency. | Low | High | P3 | Long Term | 🟢 |
| D13 | Wire the Evidence & Learning platform to a first real reporter | Fully architected (`household_evidence_events`, threshold/decay logic) but zero real reporters or consumers exist — an investment sitting completely dormant. | Pick one high-value signal (e.g. meal repeat/reject patterns) as the first live reporter. | Medium | Medium | P2 | Medium | 🟢 |
| D14 | Give `household-meal-matcher` UI-level discovery (Intelligence half of C12) | Same finding as C12. | Same fix as C12. | Medium | Medium | P2 | Medium | 🟢 |

## Category E — Domain Data (12)

| ID | Title | Problem / Why it matters | Recommendation | Impact | Effort | Priority | Type | Risk |
|---|---|---|---|---|---|---|---|---|
| E1 | Complete UK allergen coverage | 10 of 14 regulated allergens modelled; fish, celery, lupin, molluscs, sulphites explicitly named "Phase 4 candidates," not yet built. A genuine safety-relevant data gap, not cosmetic. | Author the remaining 5 allergens with the same depth (aliases, hidden ingredients, substitutions) as the existing 10. | High | Medium | P0 | Medium | 🔴 |
| E2 | Source and cite nutrition evidence | Every food↔benefit/nutrient↔benefit relationship is hardcoded `confidence: "established"` / `source: "THA editorial"` — zero per-entry `SourceRef`/`reviewedAt` anywhere. This is the WS2 launch keystone, unchanged since June. | Author + source + get nutritionist/EFSA sign-off on the minimum 5 benefits, per the existing Master Roadmap plan. | Critical | High | P0 | Long Term | 🔴 |
| E3 | Build a real recipe corpus with instructions | No seed script for recipe-type meals with instructions exists anywhere; 310 ready-meals are name-only, 55 shells have no ingredients. Cookbook's core value proposition depends on this. | Evaluate the already-named Edamam licensed corpus, or scale THA-authored recipe authoring. | High | High | P1 | Long Term | 🟡 |
| E4 | Deepen household eater modelling | Only `displayName` + two diet-preference arrays exist — no age band, likes/dislikes, goals, or appetite/portion sizing. Blocks any future personalisation without a schema extension. | Scope an additive schema extension when/if the recommendation engine is prioritised (correctly deferred until then per Master Roadmap). | Medium | Medium | P2 | Long Term | 🟢 |
| E5 | Resolve Partners' data authenticity/scope | The 12 "partners" read as placeholder/sample content; the open product-scope question from June appears unresolved. | Get a product decision on launch scope before further data investment (same as C11). | Medium | Low | P1 | Quick Win | 🟢 |
| E6 | Verify the TheMealDB licensing fix is live in production | Was running on a shared test key in production, breaching terms; the code-level fix (paid-key fallback) exists per `EWO_MEALDB_API_ACTIVATION.md` — confirm the production environment variable is actually set. | Operational check, not a code change. | Medium | Low | P0 | Quick Win | 🔴 |
| E7 | Get operational visibility into `ingredient_classifications` review backlog | Populated only at runtime with no seed; pending-vs-approved state is unknown from code alone. | Add an admin-visible count/dashboard for classification review state. | Low | Low | P2 | Quick Win | 🟢 |
| E8 | Expand the `food_knowledge` additive-concept editorial set | Only 13 entries vs. the separate 300-row raw E-number list — the "why it matters" editorial layer is thin relative to the raw data it's meant to explain. | Author additional concept-level explainers for the most-scanned additive categories. | Medium | Medium | P2 | Medium | 🟡 |
| E9 | Communicate retailer data as inference, not live pricing | `retailIntelligence.ts` makes zero external API calls — it's a static confidence-tiered inference system, not live pricing. Any UI copy implying real-time pricing would overstate this. | Audit and correct any "price intelligence" copy that implies live data. | Medium | Low | P0 | Quick Win | 🔴 |
| E10 | Communicate barcode/product coverage honestly | Product data is Open Food Facts pass-through — crowd-sourced, admittedly incomplete by THA's own code comments — not a THA-curated database. | Ensure scan-result UI doesn't imply THA-verified completeness where it's OFF passthrough. | Medium | Low | P1 | Quick Win | 🟢 |
| E11 | Reconcile the WS0 (188 foods) vs WS2A (239 entries) food-count gap | Two related but numerically different food sets; reconciliation status not independently re-verified this pass. | Confirm every WS0 food has a WS2A canonical record (or document the intentional gap). | Medium | Low | P1 | Quick Win | 🟡 |
| E12 | Ship the minimum 5 sourced health benefits (E2's actionable subset) | The single largest launch-blocking content item, unchanged since the June roadmap; tracked separately here as the most time-boxed, first actionable slice of E2. | Ship Heart/Gut/Bone/Immune/Energy first (Master Roadmap's own prioritisation), fast-follow the rest. | Critical | High | P0 | Long Term | 🔴 |

## Category F — Trust (10)

| ID | Title | Problem / Why it matters | Recommendation | Impact | Effort | Priority | Type | Risk |
|---|---|---|---|---|---|---|---|---|
| F1 | Add per-claim citation UI to `FoodReport.tsx` | Zero "based on/source/confidence" evidence anywhere on the app's highest-stakes nutrition-claim surface — only the generic static disclaimer appears. | Extend the proven `IntelligenceCard` "Why" disclosure pattern (already live elsewhere) to this component. | Critical | Medium | P0 | Medium | 🔴 |
| F2 | Extend the "Why" disclosure pattern platform-wide | The pattern is proven on `FoodOpportunityCard`/`ConnectedFoodPanel` but not applied to every claim-bearing surface. | Systematic pass: list every claim-bearing card/surface, apply the existing pattern to each. | High | Medium | P1 | Medium | 🟢 |
| F3 | Make `ConnectedFoodPanel`'s reason tooltip touch-accessible | Currently a native `title` hover tooltip — invisible on touch/mobile devices, a mobile-specific trust gap. | Convert to a tap-to-reveal pattern consistent with the "Why" disclosure elsewhere. | Medium | Low | P1 | Quick Win | 🟢 |
| F4 | Sequence knowledge-store migrations before new benefit content | Until D1/D2/D4 (M1/M2/M4) complete, three surfaces can show three different phrasings of the same food fact in one session — the SoT Register's own 🔴-rated risk. | Enforce this sequencing discipline explicitly in the next content-authoring workstream. | High | Low | P0 | Quick Win | 🟢 |
| F5 | Make the nutritionist/EFSA sign-off gate visible and auditable | The "zero fabricated claims" principle is stated repeatedly across governing docs; confirm there's a visible internal audit trail, not just a stated intention. | Add a lightweight sign-off record (who approved, when) attached to each published benefit. | Medium | Medium | P1 | Medium | 🟢 |
| F6 | Audit honest-gap messaging consistency across all 10 read-only capabilities | Each unwired capability returns its own "not yet" copy — consistency across all 10 was not confirmed in this pass. | Grep and compare all `bindings/*.ts` honest-gap strings; standardize tone. | Medium | Low | P1 | Quick Win | 🟢 |
| F7 | Reframe "can't do that yet" as considerate, not broken | Related to F6 — the *tone* of gap messaging matters as much as its presence for a first-time user's trust in the Companion. | Write one shared "not yet, but here's what I can do" template used by every unwired capability. | Medium | Low | P1 | Quick Win | 🟢 |
| F8 | Make restriction-safety (Rule T0) visible to users | Hard-restriction safety is architecturally enforced but appears invisible-by-default in the UI — a user with allergies gets no visible reassurance that a suggestion was safety-filtered. | Add a small, honest "filtered for your restrictions" indicator where relevant. | High | Low | P1 | Quick Win | 🟢 |
| F9 | Don't overstate allergen coverage in product copy | Until E1 closes, ensure no marketing/UI copy implies comprehensive allergen checking beyond the current 10-of-14 scope. | Copy audit alongside E1. | Medium | Low | P0 | Quick Win | 🔴 |
| F10 | Confirm `admin_audit_log` coverage for Planner/Shopping writes | TIP1's security model requires privileged/mutating actions to be logged; confirm this is actually true for the two shipped write-capable domains, not just designed. | Verify via code read or a test write + log check. | Medium | Low | P1 | Quick Win | 🟡 |

## Category G — Delight (11)

| ID | Title | Problem / Why it matters | Recommendation | Impact | Effort | Priority | Type | Risk |
|---|---|---|---|---|---|---|---|---|
| G1 | Give celebrations real visual weight | `buildCelebration()`/`CelebrationCard` exist and are wired but render with the same visual weight as any other card — no motion, sound, or distinct chrome even at named milestones (streak ×7, diversity ×10). | Add a distinct celebratory treatment (subtle motion + colour accent) to `CelebrationCard`. | High | Low | P0 | Quick Win | 🟢 |
| G2 | Surface or remove the dead streak fetch | `/api/user/streak` is fetched on `products-page.tsx` but never rendered anywhere — a genuinely dead code path representing lost delight opportunity. | Either surface it (recommended — streaks are a proven motivator) or remove the unused fetch. | Medium | Low | P1 | Quick Win | 🟢 |
| G3 | Extend the shopping-complete moment pattern elsewhere | "All sorted! Happy shopping 🌿" is a genuine, warm completion moment found only in `ShoppingListView` — extend the same pattern to finishing a planner week, hitting a diversity milestone, completing onboarding. | Reuse the existing pattern/copy style at 3 more completion points. | High | Low | P0 | Quick Win | 🟢 |
| G4 | Add satisfying micro-interaction feedback to top actions | Zero `whileTap`/`whileHover` anywhere (Delight half of B8) — checking off a shopping item, completing a meal, dropping a planner card all rely on colour-transition only. | Same fix as B8, tracked here for the Delight-owner. | High | Low | P0 | Quick Win | 🟢 |
| G5 | Make `meal-completion-dialog.tsx` a genuine moment (Delight half of B9) | Same finding as B9. | Same fix as B9. | Medium | Low | P1 | Quick Win | 🟢 |
| G6 | Standardize empty-state emotional tone platform-wide (Delight half of A6/B10) | Diary/Planner carry genuine Companion voice; Shopping/Pantry-category empty states are plain utility copy — an inconsistent first impression of the brand's personality depending on which empty page a user hits first. | Bring every empty state to Diary's warmth level as the reference bar. | High | Low | P0 | Quick Win | 🟢 |
| G7 | Use `orchard-hero.tsx` for onboarding's hero moment (Delight half of B4) | Same finding as B4, tracked here since first impressions are the highest-leverage delight moment in the product. | Same fix as B4. | High | Low | P0 | Quick Win | 🟢 |
| G8 | Give personalities visual/audio identity (Delight half of B13/C9) | Same finding as B13/C9 — an easy, already-scaffolded differentiation win sitting unused. | Same fix as B13. | High | Medium | P1 | Medium | 🟢 |
| G9 | Add an opt-in richer celebration mode (Delight half of B14) | Same finding as B14 — respects the deliberately-muted default while giving delight-seeking users a toggle. | Same fix as B14. | Low | Medium | P3 | Long Term | 🟢 |
| G10 | Prioritize activating dormant delight infrastructure over building new | `buildGreeting()`, the personality visual fields, and `CelebrationCard`'s under-used styling are all *already built*. This is the single highest-leverage meta-recommendation in the Delight category. | Sequence C1/G1/G8 before any net-new delight feature is proposed. | High | Low | P0 | Quick Win | 🟢 |
| G11 | Close the "muted by design" vs "under-activated" ambiguity | `companion-delight.ts` documents restraint as intentional ("never bouncy-loud") — confirm the *current* rendering matches that intent, or whether it has simply never been finished (this audit found evidence for the latter: `CelebrationCard` has no distinct styling applied at any of its 2 call sites). | Design review: is today's flatness the intended "calm" outcome, or an unfinished implementation of it? | Medium | Low | P1 | Quick Win | 🟢 |

**Total: 21 + 17 + 14 + 14 + 12 + 10 + 11 = 99 improvements.**

---

# PART 8 — TOP 20 QUICK WINS

Near-zero risk, no new architecture, ship-ready in days not weeks. Ordered roughly by impact-per-effort.

1. **A4** — Add a global `ErrorBoundary` (prevents blank-screen failures app-wide).
2. **C1** — Wire `buildGreeting()` into `FloatingAssistant` (built, unused, six personalities ready to go).
3. **A18 / D6** — Unify the two-ambient-widgets pattern on Planner/Cookbook/Pantry.
4. **A19 / D7** — Add `FoodOpportunitiesPanel` to Shopping.
5. **C7** — Surface Diary's existing `nutrition-trend` observation on the Diary page.
6. **D1** — Complete Migration M1 (retire `nutrition-benefit-library.ts`).
7. **D3** — Complete Migration M3 (move `dietRules.ts` to `shared/`).
8. **F4** — Enforce migration-before-content-authoring sequencing discipline.
9. **G1** — Give `CelebrationCard` real visual weight.
10. **G3** — Extend the "All sorted!" completion-moment pattern to 3 more surfaces.
11. **G4 / B8** — Add `whileTap`/`whileHover` to the top 3–5 repeated actions.
12. **G6** — Standardize empty-state emotional tone platform-wide.
13. **G7 / B4** — Use `orchard-hero.tsx` for onboarding's hero art.
14. **G10** — Prioritize activating dormant delight infrastructure (meta quick win).
15. **C3** — Show the active personality name near `PersonaLabel`.
16. **B2** — Replace hardcoded colours with existing design tokens.
17. **F6 / F7** — Standardize honest-gap Companion messaging tone.
18. **F8** — Make restriction-safety filtering visible to users.
19. **E6** — Verify the TheMealDB licensing fix is live in production (operational check only).
20. **E9** — Correct any UI copy implying live retailer pricing.

---

# PART 9 — TOP 20 HIGHEST-IMPACT IMPROVEMENTS

Ranked by expected effect on how premium/trustworthy/complete the product feels, regardless of effort.

1. **E2 / E12** — Source and cite the minimum 5 nutrition benefits (the single largest trust and launch-readiness gap in the entire audit).
2. **F1** — Add per-claim citation UI to `FoodReport.tsx` (the highest-stakes surface with zero trust affordance today).
3. **A4** — Global `ErrorBoundary` (prevents the worst possible first-time-user experience: a blank screen).
4. **E1** — Complete UK allergen coverage (safety-relevant, not cosmetic).
5. **C5** — Wire `meals-write-handler.ts` (highest-leverage single Companion capability unlock; engine already built).
6. **D1/D2/D4** — Complete the M1/M2/M4 knowledge migrations (unblocks the Food Intelligence Engine and closes the 🔴-rated SoT Register risk).
7. **E3** — Build a real recipe corpus with instructions (Cookbook's core value proposition today runs on live-fetch-only).
8. **A16 / B15** — Reconcile the Adaptive Density system (the Master Roadmap's own named #1 production gap, still open).
9. **A8** — Fix `shopping-list-page.tsx` responsive coverage (the largest, highest-traffic transactional flow).
10. **A5** — Surface read/fetch errors platform-wide (trust: is it empty, or broken?).
11. **C1** — Wire `buildGreeting()` (biggest single "feels alive" upgrade for near-zero engineering cost).
12. **G6** — Standardize empty-state emotional tone (first impression of brand personality on any empty surface).
13. **B13 / C9 / G8** — Give personalities visual identity, not just text.
14. **C4** — Persisted "last shown" observation log (Companion honesty upgrade).
15. **F8** — Make restriction-safety visible (safety reassurance for allergen-restricted households).
16. **D5** — Food Intelligence Engine Phase 1 (long-term, but the platform's stated differentiator).
17. **G1 / G3 / G4** — Give celebrations, completions, and micro-interactions real weight (the platform's dominant "built but flat" pattern).
18. **A20** — Verify/resolve the `shopping-list-page.tsx` duplicate-experience risk.
19. **E4** — Deepen household eater modelling (unlocks all future personalisation).
20. **A6 / A3** — Shared `EmptyState` + skeleton loading states across all pages (the most repeated first-load experience in the app).

---

# PART 10 — RECOMMENDED IMPLEMENTATION ORDER

Sequenced to respect dependencies named throughout this document and `EWO_DOMAIN_FUTURE_STATE_AUDIT.md`, and to front-load the items that are pure activation of already-built work.

**Wave 1 — Safety & trust floor (do first, blocks nothing, blocked by nothing):**
A4 (error boundary), E1 (allergen coverage), F9/E9 (honest copy audit), F8 (restriction-safety visibility), E6 (licensing check).

**Wave 2 — Activate dormant infrastructure (near-zero risk, high visible return):**
C1 (greeting), G1/G3/G4/G6/G7 (delight activation cluster), C3, B2, B13/C9/G8 (personality visuals), F6/F7 (gap-message tone).

**Wave 3 — Knowledge-store convergence (unblocks everything downstream in Nutrition/Cookbook/Pantry):**
D1/D2/D3/D4 (M1–M4 migrations) → F4 sequencing discipline → E11 (WS0/WS2A reconciliation).

**Wave 4 — Cross-domain consistency (presentation-only, low risk):**
A18/D6 (widget unification), A19/D7 (Shopping panel parity), A6/A3/B10 (shared EmptyState + skeletons), A1/A2 (shell consistency).

**Wave 5 — Trust content & citation UI (the true critical path, editorial-paced):**
E2/E12 (sourced benefits) → F1/F2 (citation UI, depends on E2 data existing) → F5 (sign-off audit trail).

**Wave 6 — Companion write-capability expansion (medium effort, high leverage, reuses existing services):**
C5 (Meals) → C7 (Diary surfacing) → C6 (Pantry/Household/Profile) → C4 (persisted observation log) → C8 (Recipe Import seam).

**Wave 7 — Responsive/density/a11y hardening (verify-then-fix, spans many files):**
A16/B15 (density reconciliation) → A8/A9 (responsive audits) → A10/A11/A12/A13 (accessibility pass) → A14/A15 (density/scroll cleanup on largest pages).

**Wave 8 — Data depth & long-term intelligence (post the above, genuinely long-horizon):**
E3 (recipe corpus) → E4 (household modelling) → D5 (Food Intelligence Engine) → D13 (Evidence & Learning first reporter) → C13/C14 (voice, proactive digest) → D11/D12 (Admin/Developer Intelligence).

**Sequencing rationale:** Waves 1–2 are chosen because they carry essentially zero risk and either close a safety gap or activate work THA has already paid for but not yet shipped — the highest ROI available today. Wave 3 is placed before Wave 5 deliberately, mirroring the SoT Register and FI1's own gating: authoring new sourced content on top of un-migrated stores would recreate the exact 🔴 risk (three different phrasings of the same fact) this audit found still open. Wave 5 remains the true critical path (editorial-paced, not engineering-paced, per the Master Roadmap's own finding, unchanged since June).

---

# PART 11 — DATA IMPACT & TRUST CHECK

## Data Impact
- Reads existing architecture and implementation: **YES** (this document's entire content, plus three independent parallel research passes over live code).
- Writes no data: **CONFIRMED** — no code, schema, route, or capability was touched.
- Requires no schema changes: **CONFIRMED** (several improvements above note *future* schema needs, e.g. E4, E1 — none were implemented here).

## Trust Check
- No improvement in Part 7 proposes a new capability, a new store, or a duplicate of anything that already exists — every recommendation activates, wires, migrates, or refines already-built architecture. This was verified for each item against the governing docs and the live-code research passes, not assumed.
- Where a gap is genuinely a *product* decision rather than an engineering one (Partners' scope, E5/C11), this document says so explicitly rather than inventing an engineering recommendation to fill the space.
- Every data-completeness claim in Part 4 cites a specific file, seed script, or governing document passage — no coverage number is asserted without evidence; where a count could not be determined from static code (e.g. live `ingredient_classifications` row count), this is stated plainly rather than estimated.
- This document does not re-litigate `EWO_DOMAIN_FUTURE_STATE_AUDIT.md`'s Intelligence/Capability findings — it cites them once (Part 5) and spends its own effort on the Experience/UI/Delight/Data axis that document explicitly named as unaudited.
- The Platform Experience Score (53/100) and Launch Readiness Score (57/100) are investigator judgement grounded in the evidence tables throughout this document, explicitly not automated metrics — presented with their scoring basis visible so they can be checked, not just cited.

---

*Investigation only. No implementation performed.*
*Rollback: `git checkout ewo-launch-audit-rollback-20260703`.*
