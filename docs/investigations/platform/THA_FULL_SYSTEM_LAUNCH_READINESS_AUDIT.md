# THA — Full System + Security Launch Readiness Audit

> **Document type:** Whole-system launch readiness + security audit (**investigation only — no implementation**).
> **Date:** 2026-06-23
> **Branch:** `safety/preserve-since-last-prod-20260617-1613`
> **Author role:** Launch lead + senior full-stack engineer + security reviewer.
> **Central question:** *Can The Healthy Apples safely move toward production launch?*

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

Git status was **not clean** at the start of this audit: the WS2 Pantry Explore V2 work was
uncommitted in the working tree (two modified files + two untracked docs). Because WS2 is a protected
workstream, the rollback point was made to capture **both** the committed history **and** the working
tree, non-destructively (using `git stash create`, which produces a commit object **without** touching
your files).

| Item | Value |
|---|---|
| **Working tree at audit start** | `M client/src/components/PantryKnowledgeHub.tsx`, `M server/routes.ts`, `?? docs/investigations/knowledge/WS2_PANTRY_EXPLORE_V2.md`, `?? WS2_PANTRY_EXPLORE_V2_IMPLEMENTATION.md` |
| **Rollback tag (committed HEAD)** | `rollback/pre-audit-20260623-head` → `f531216` |
| **Rollback tag (full working tree, incl. untracked)** | `rollback/pre-audit-20260623-worktree` → `239853a` |
| **Restore committed state** | `git reset --hard rollback/pre-audit-20260623-head` |
| **Recover WS2 working-tree state** | `git stash apply 239853a` (or `git checkout 239853a -- <path>`) |
| **Undo this doc only** | `rm docs/investigations/platform/THA_FULL_SYSTEM_LAUNCH_READINESS_AUDIT.md` |

### Protected workstreams — confirmed present
| WS | Evidence | Protected by |
|---|---|---|
| **WS0.12 Catalogue Normalisation** | `docs/investigations/knowledge/WS0_12_CATALOGUE_NORMALISATION_AND_PROMOTION_READINESS.md`; commit `b47afcb` | HEAD tag |
| **WS2 Pantry Explore V2** | working-tree `PantryKnowledgeHub.tsx` + `routes.ts` + 2 docs | **Worktree tag `239853a`** |
| **WS7 Relationship Graph** | `WS7_RELATIONSHIP_GRAPH_POC.md`, `WS7_FOOD_RELATIONSHIPS_DISCOVERY_AND_STORIES.md`; `server/tests/test-food-graph.ts` | HEAD tag |
| **WS8 Discovery** | `shared/discovery/*`; commit `0a996f8`; tests pass | HEAD tag |
| **WS9 Alternatives** | `shared/alternatives/*`; commit `52cd86d`; tests pass | HEAD tag |
| **WS10 Stories** | `shared/stories/*`; commit `0dd662a`; tests pass | HEAD tag |
| **WS11 Seasonal Stories** | `shared/seasonal/*`; commit `f531216`; tests pass | HEAD tag |

**Rollback identifier reported. No investigation work began until the two tags above were created and verified.**
This audit makes **no** code, schema, route, UI, migration, data, or ingestion change. It produces exactly
one artefact: this markdown file (plus two git tags).

---

## 1. EXECUTIVE SUMMARY

**The Healthy Apples can move *toward* production launch, but cannot honestly be called "launch-ready
with no known blocking work."** The engineering is unusually mature and the newest layer (WS7–WS11 + the
read-only Pantry Explore V2 it feeds) is the **safest part of the entire system** — fully deterministic,
trust-gated, and test-green. The blockers are not in the new work; they are in **(a) two concrete
security hardening items**, **(b) a broken release gate (`typecheck` fails)**, and **(c) the editorial
content layer** the existing roadmap already identified as the true longest pole.

Three things are true at once:

1. **The flagship new experience is trustworthy by construction.** Discovery, Alternatives, Stories and
   Seasonal Stories make **zero** LLM/network calls — they are pure functions over authored maps, wrapped
   in dedicated `trust.ts` gates, and every engine test (including explicit "no fabrication" and "trust
   gate" assertions) passes. Pantry Explore V2 consuming them is **verified read-only** (zero mutations in
   `PantryKnowledgeHub.tsx`; API responses strip internal `source`/`familiar` fields).

2. **Two security items must be fixed before any public exposure.** The session secret has a hardcoded
   fallback and the session cookie is never marked `Secure`. Both are small fixes but both are genuine
   launch blockers.

3. **The content is thinner than the engines.** The knowledge registry seeds only a handful of foods.
   The engines are ready to surface curated knowledge; the curated knowledge does not yet exist at launch
   scale. This matches the 2026-06-18 roadmap's conclusion: *"THA is one layer away — and that layer is
   curated, human-reviewed nutrition content, not code."*

**Headline verdict:** ~**88%** overall. Not launchable today. Launchable within a focused window once the
two security items, the release gate, and a minimum editorial content bar are cleared.

---

## 2. PAGE / AREA SCORECARD

> Completion % reflects *shipped, working* functionality. "Prompts to green" = rough number of focused
> implementation passes. Confidence noted where assessment is structural rather than line-by-line.

| # | Area | Completion | Risk | Status | Launch blocker? | Prompts→green | Effort |
|---|---|---|---|---|---|---|---|
| 1 | Authentication | 90% | 🟡 AMBER | 🟡 Mostly Complete | **YES (security)** | 2 | 0.5–1 day |
| 2 | Dashboard | 88% | 🟢 LOW | 🟡 Mostly Complete | NO | 1 | 0.5 day |
| 3 | Cookbook | 90% | 🟢 LOW | 🟡 Mostly Complete | NO | 1 | 0.5–1 day |
| 4 | Meal Pages | 90% | 🟢 LOW | 🟡 Mostly Complete | NO | 1–2 | 1 day |
| 5 | Planner | 87% | 🟡 AMBER | 🟡 Mostly Complete | NO | 2–3 | 2–4 days |
| 6 | Smart Planner | 82% | 🟡 AMBER | 🟠 Partial→Mostly | NO | 3–4 | 3–5 days |
| 7 | Pantry Inventory | 88% | 🟢 LOW | 🟡 Mostly Complete | NO | 1 | 0.5–1 day |
| 8 | Pantry Explore V2 | 85% | 🟡 AMBER | 🟡 Mostly Complete | NO (content-gated) | 2 | 1–2 days |
| 9 | Shopping | 80% | 🟡 AMBER | 🟠 Partial | NO | 3 | 3–5 days |
| 10 | Analyser | 86% | 🟢 LOW | 🟡 Mostly Complete | NO | 1–2 | 1–2 days |
| 11 | Diary | 85% | 🟢 LOW | 🟡 Mostly Complete | NO | 1 | 0.5–1 day |
| 12 | Profile | 86% | 🟡 AMBER | 🟡 Mostly Complete | NO | 2 | 1–2 days |
| 13 | Household Members | 88% | 🟢 LOW | 🟡 Mostly Complete | NO | 1 | 0.5–1 day |
| 14 | Dietary Restrictions | 92% | 🟢 LOW | 🟢 Complete | NO | 0–1 | 0.5 day |
| 15 | Nutrition Boost / Simply Better Choices | 84% | 🟡 AMBER | 🟡 Mostly Complete | NO | 2–3 | 2–3 days |
| 16 | Food Reports | 70% | 🟠 MED | 🟠 Partial | NO | 3–4 | 3–5 days |
| 17 | Plant Diversity / Nutrition Report | 80% | 🟡 AMBER | 🟠 Partial | NO | 3 | 2–4 days |
| 18 | Catalogue | 78% | 🟡 AMBER | 🟠 Partial | NO | 3 | 3–5 days |
| 19 | Canonical Foods | 72% | 🟠 MED | 🟠 Partial | NO | 3 | 3–5 days |
| 20 | Knowledge Foods (editorial registry) | 45% | 🔴 HIGH | 🟠 Partial | **YES (content bar)** | 6–10+ | 2–4 weeks (editorial) |
| 21 | Discovery Engine | 97% | 🟢 LOW | 🟢 Complete | NO | 0 | — |
| 22 | Alternatives Engine | 97% | 🟢 LOW | 🟢 Complete | NO | 0 | — |
| 23 | Stories Engine | 97% | 🟢 LOW | 🟢 Complete | NO | 0 | — |
| 24 | Seasonal Stories Engine | 97% | 🟢 LOW | 🟢 Complete | NO | 0 | — |
| 25 | Production Deployment | 75% | 🔴 HIGH | 🟠 Partial | **YES** | 2–3 | 1–2 days |

---

## 3. PER-AREA DETAIL

### 1. Authentication — 90% · 🟡 AMBER · Launch blocker: YES (security)
**What exists:** passport local strategy; scrypt password hashing with `timingSafeEqual`; email
verification flow; forgot/reset password (enumeration-safe responses); change-password; demo accounts
with expiry middleware; beta/production registration gating; `ProtectedRoute` on the client; consistent
`if (!req.isAuthenticated()) return res.sendStatus(401)` guard on API routes.
**Missing features:** rate limiting / brute-force protection on `/api/login`; account lockout; MFA (likely
post-launch).
**Bugs / weaknesses:** **(1) hardcoded session secret fallback** `process.env.SESSION_SECRET || "r3pl1t_s3cr3t_k3y_123456"` (`server/auth.ts:41`); **(2) `cookie.secure: false`** (`server/auth.ts:48`) — session cookie can ride plaintext HTTP; **(3)** password minimum is only 6 chars; **(4)** no login rate limiting.
**User impact:** Critical (security) / Hidden (users won't see it until exploited).
**Launch risk:** 🔴 Launch blocker (items 1 & 2).
**Path to green:**
1. Require `SESSION_SECRET` in production (fail-fast if unset); remove the literal fallback. *Risk: low. Prompts: 1. Effort: <0.5 day.*
2. Set `cookie.secure: true` in production (behind `trust proxy`, already configured). *Risk: low (verify cookie still issues over HTTPS). Prompts: 1. Effort: <0.5 day.*
3. (Polish) Add login rate limiting + raise password floor to 8. *Risk: low. Prompts: 1. Effort: 0.5 day.*

### 2. Dashboard — 88% · 🟢 LOW · blocker: NO
**What exists:** `/dashboard` (and `/`) behind `ProtectedRoute`; entry point to all surfaces.
**Missing features:** assessed structurally — likely empty-state polish for brand-new accounts.
**Bugs / weaknesses:** none identified at audit depth.
**User impact:** Low. **Launch risk:** 🟢 Safe.
**Path to green:** verify cold-start (zero data) empty states. *Prompts: 1. Effort: 0.5 day.*

### 3. Cookbook — 90% · 🟢 LOW · blocker: NO
**What exists:** `/cookbook` + `/meals` → `MealsPage`; import (`/import-recipe`), quick-meal, OCR recipe scan; cookbook workspace iterations (multiple rollback tags show mature evolution).
**Missing features:** multi-page recipe capture and recipe photos are explicitly deferred (`RecipeScanReview.tsx` TODOs).
**Bugs / weaknesses:** OCR/recipe-parser depends on OpenAI — graceful-degradation path should be confirmed.
**User impact:** Low. **Launch risk:** 🟢 Safe.
**Path to green:** confirm OCR failure UX. *Prompts: 1. Effort: 0.5–1 day.*

### 4. Meal Pages — 90% · 🟢 LOW · blocker: NO
**What exists:** `meal-detail-page` with documented V3 experience (header consistency, family confidence trust fix, collapse behaviour); servings scaling; ingredient verification.
**Missing features:** Discovery↔Meal-page linkage (Discovery engine exists but its surfacing on meal pages is not yet wired — see coherence §6).
**Bugs / weaknesses:** large historical churn (many rollback tags) suggests fragility around header/collapse state.
**User impact:** Medium. **Launch risk:** 🟢 Safe.
**Path to green:** regression-check meal-detail collapse/header. *Prompts: 1–2. Effort: 1 day.*

### 5. Planner — 87% · 🟡 AMBER · blocker: NO
**What exists:** `/planner` + `/weekly-planner`; profile compliance gate (**25/25 gate tests pass**); household familiarity; archive/history retention; native + web recipe search.
**Missing features:** planner-history retention policy (investigation exists, not finalised).
**Bugs / weaknesses:** high complexity; many compliance/cleanup investigations indicate edge-case fragility around restriction enforcement.
**User impact:** Medium. **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Finalise history-retention behaviour. *Risk: med. Prompts: 2. Effort: 2–3 days.*
2. Edge-case pass on multi-week restriction compliance. *Risk: med. Prompts: 1. Effort: 1 day.*

### 6. Smart Planner — 82% · 🟡 AMBER · blocker: NO
**What exists:** `smart-suggest-service` + `smart-meal-creation-engine`; restriction/diet-pattern/product/premium filters (**dedicated tests pass**); household tailoring; advanced overrides; external backfill.
**Missing features:** robust slot-fill recovery at scale (recovery investigations + `test-slot-filling-recovery.ts` — which currently has **typecheck errors**).
**Bugs / weaknesses:** the densest fix-churn area in the repo (candidate-pool exhaustion, slot-fill failures, vegan/anchovy false positives historically). Complexity is high; behaviour is sensitive to catalogue coverage.
**User impact:** High (a visibly empty/repetitive plan erodes trust). **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Resolve slot-fill recovery edge cases + fix test typecheck errors. *Risk: med-high. Prompts: 2. Effort: 2–3 days.*
2. Repetition/exhaustion guardrails when catalogue is thin. *Risk: med. Prompts: 1–2. Effort: 1–2 days.*

### 7. Pantry Inventory — 88% · 🟢 LOW · blocker: NO
**What exists:** `/pantry`; CRUD (`POST/PATCH/DELETE /api/pantry`) all auth-guarded and **ownership-scoped by `userId`** at the storage layer; quantity/unit model; default seed on registration; category fixes.
**Missing features:** none material.
**Bugs / weaknesses:** historical category-classification edge cases (resolved via backfill).
**User impact:** Low. **Launch risk:** 🟢 Safe.
**Path to green:** spot-check category accuracy. *Prompts: 1. Effort: 0.5 day.*

### 8. Pantry Explore V2 — 85% · 🟡 AMBER · blocker: NO (content-gated)
**What exists:** `PantryKnowledgeHub.tsx` (965 lines) — **verified READ-ONLY** (zero `useMutation`, all `useQuery`); search + alias resolution + food pages; consumes Discovery, Alternatives, Stories, Seasonal via `/api/pantry/{discover,alternatives,stories,seasonal}` + `/api/knowledge/*`; API layer strips internal fields (`source`, `familiar`).
**Missing features:** the surface is only as rich as the knowledge registry (see #20). Depth currently bounded by sparse content.
**Bugs / weaknesses:** **the entire feature is uncommitted** (working tree only) — at risk until committed; protected here by the worktree rollback tag.
**User impact:** Medium. **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Commit WS2 to history (remove uncommitted risk). *Risk: low. Prompts: 1. Effort: <0.5 day.*
2. Validate empty-state discipline when a food has no authored knowledge. *Risk: low. Prompts: 1. Effort: 0.5–1 day.*

### 9. Shopping — 80% · 🟡 AMBER · blocker: NO
**What exists:** multiple surfaces — `/list` + `/shopping-list` → `ListPage`, `/shopping-workspace` → `ShoppingWorkspacePage`, `/basket` + `/analyse-basket` → `ShoppingListPage`; supermarket basket service; price lookup; many phased iterations.
**Missing features:** convergence — there are **three distinct shopping page components** plus a workspace, an architectural smell (see §5).
**Bugs / weaknesses:** route/ownership confusion: `ListPage`, `ShoppingListPage`, `ShoppingWorkspacePage` overlap. Risk of users landing in inconsistent surfaces.
**User impact:** Medium–High (core conversion path). **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Decide the canonical shopping surface; redirect/retire the others. *Risk: med. Prompts: 2. Effort: 2–3 days.*
2. End-to-end planner→shopping reconciliation test. *Risk: med. Prompts: 1. Effort: 1 day.*

### 10. Analyser — 86% · 🟢 LOW · blocker: NO
**What exists:** `/analyser` + `/products` → `ProductsPage`; `product-analysis` lib; UPF analysis; additive/extract detection (**tests pass**); THA scoring (**tests pass**); product→alternatives wiring (`/api/product-alternatives`, auth-guarded; deliberately excludes editorial-flagged items from swaps).
**Missing features:** premium gating not enforced (`TODO [PREMIUM]` at `routes.ts:3530`).
**Bugs / weaknesses:** none material.
**User impact:** Low. **Launch risk:** 🟢 Safe.
**Path to green:** confirm analysis empty/low-confidence UX. *Prompts: 1–2. Effort: 1–2 days.*

### 11. Diary — 85% · 🟢 LOW · blocker: NO
**What exists:** `/diary` + `/my-diary` → `FoodDiaryPage`; log-meal-to-diary path (`test-log-meal-to-diary.ts`).
**Missing features:** assessed structurally — likely trend/aggregation depth.
**Bugs / weaknesses:** none identified at audit depth.
**User impact:** Low. **Launch risk:** 🟢 Safe.
**Path to green:** verify diary aggregation + empty state. *Prompts: 1. Effort: 0.5–1 day.*

### 12. Profile — 86% · 🟡 AMBER · blocker: NO
**What exists:** `/profile`; dietary pattern + restrictions; compliance certification report; mobile restructure; profile-save validation fix history.
**Missing features:** none material.
**Bugs / weaknesses:** history of profile-save 400 errors (invalid profile data) — validation surface is sensitive; confirm fully resolved.
**User impact:** Medium (a failed save blocks personalisation). **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Regression-test profile save across all dietary permutations. *Risk: med. Prompts: 1–2. Effort: 1–2 days.*

### 13. Household Members — 88% · 🟢 LOW · blocker: NO
**What exists:** household eater model (adults + guests); `test-household-eater.ts`, `test-guest-eater.ts` pass; adult chip / userId mapping; full-visibility implementation. **All household data scoped to the owning `userId`** — single-account-owns-household model.
**Missing features:** none material.
**Bugs / weaknesses:** historical chip-display/userId-mapping churn (resolved).
**User impact:** Low. **Launch risk:** 🟢 Safe.
**Path to green:** spot-check member→planner propagation. *Prompts: 1. Effort: 0.5–1 day.*

### 14. Dietary Restrictions — 92% · 🟢 LOW · blocker: NO
**What exists:** `restriction-resolver` + `dietRules` + substitution rules; **strongest test coverage in the app** — restriction-resolver, restriction-safety, substitution-rules, vegan/vegetarian hard enforcement, keto/low-carb dictionary, plant-milk-vegan, ingredient-verification all pass (the planner-compliance suite alone: 25/25).
**Missing features:** none material.
**Bugs / weaknesses:** vegan/vegetarian enforcement historically subtle (anchovy/derived-ingredient cases) — now covered by explicit tests.
**User impact:** Critical *if wrong* (safety) — but verification is the most robust in the codebase.
**Launch risk:** 🟢 Safe.
**Path to green:** none required; optional new-edge-case tests. *Prompts: 0–1.*

### 15. Nutrition Boost / Simply Better Choices — 84% · 🟡 AMBER · blocker: NO
**What exists:** `uplift-engine` + `uplift-persistence` + `uplift-rules`; household-aware boosts; provenance display; accept-transaction verification; rename to "Simply Better Choices"; tests (`test-uplift-*`) pass.
**Missing features:** none material; lots of UX refinement already done.
**Bugs / weaknesses:** very high historical churn (cache/state refresh, duplication, fork-state, transaction boundary) — indicates a fragile client-state surface.
**User impact:** Medium. **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Soak-test boost accept/refresh/cache under rapid interaction. *Risk: med. Prompts: 2. Effort: 1–2 days.*
2. Confirm provenance always shows (no silent empty). *Risk: low. Prompts: 1. Effort: 1 day.*

### 16. Food Reports — 70% · 🟠 MED · blocker: NO
**What exists:** WS2F canonical food report foundation + WS2G food report UI foundation; `test-food-report-adapter.ts`.
**Missing features:** "foundation" only — full report depth depends on canonical/knowledge content (#19, #20).
**Bugs / weaknesses:** report richness gated by sparse canonical data.
**User impact:** Medium. **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Populate canonical food report content for launch food set. *Risk: med. Prompts: 2–3. Effort: 2–4 days (content-bound).*
2. Empty-state discipline for foods without a report. *Risk: low. Prompts: 1. Effort: 1 day.*

### 17. Plant Diversity / Nutrition Report — 80% · 🟡 AMBER · blocker: NO
**What exists:** `/plant-diversity` page; "30 plants this week" modal V2; counter accuracy fix; imagery fallback; educational report redesign; WS3A nutrition report page redesign + WS3B qualifiers architecture.
**Missing features:** weekly nutrition report final architecture is designed but not fully shipped (caution-foods model, A→E sequence).
**Bugs / weaknesses:** counter accuracy historically buggy (now fixed); imagery fallback dependency.
**User impact:** Medium. **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Ship/confirm weekly nutrition report aggregation + claim-safety. *Risk: med. Prompts: 2. Effort: 2–3 days.*
2. Verify plant counter accuracy across diet patterns. *Risk: low. Prompts: 1. Effort: 1 day.*

### 18. Catalogue — 78% · 🟡 AMBER · blocker: NO
**What exists:** WS0.10 global food catalogue ingestion pipeline; WS0.11 real USDA pilot; WS0.12 normalisation + promotion readiness; `usda-whole-food-service`, importers (OpenFoodFacts), canonicaliser.
**Missing features:** full promotion of ingested data to launch-ready canonical set; coverage breadth.
**Bugs / weaknesses:** ingestion is mature but the *promoted/normalised* launch slice is partial.
**User impact:** Medium (drives Smart Planner + reports quality). **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Run normalisation→promotion for launch food coverage. *Risk: med. Prompts: 2. Effort: 2–3 days.*
2. Validate dedup + canonical identity on promoted set. *Risk: med. Prompts: 1. Effort: 1–2 days.*

### 19. Canonical Foods — 72% · 🟠 MED · blocker: NO
**What exists:** WS2A canonical food foundations; canonical food identity architecture; slug reconciliation (WS2E); `test-canonical-food.ts` passes; seed exists.
**Missing features:** **canonical seed is tiny** (`seed-canonical-food.ts` ~4 entries) — the schema/engine are ready, the populated set is not.
**Bugs / weaknesses:** depth gated by content authoring.
**User impact:** Medium. **Launch risk:** 🟡 Needs polish.
**Path to green:**
1. Expand canonical food set to launch coverage. *Risk: med. Prompts: 3. Effort: 3–5 days (content-bound).*

### 20. Knowledge Foods (editorial registry) — 45% · 🔴 HIGH · **blocker: YES (content bar)**
**What exists:** `nutrition-knowledge-registry` service; `seed-knowledge-registry.ts`; `test-knowledge-registry.ts` passes; full editorial + automation framework designed (`NUTRITION_KNOWLEDGE_*` docs); KMS V1 design.
**Missing features:** **the actual curated, sourced, human-reviewed entries.** The seed contains only a
handful of entries. This is the layer the engines exist to surface, and it is the thinnest part of the system.
**Bugs / weaknesses:** none in code — the gap is *content volume + editorial review throughput*. The
product's trust philosophy forbids fabricating it, so it cannot be rushed.
**User impact:** High — a knowledge hub with almost no knowledge reads as unfinished.
**Launch risk:** 🔴 Launch blocker *for the knowledge experience specifically* (the rest can launch around it).
**Path to green:**
1. Define a **minimum launch food set** (e.g. top 50–100 foods) and author/review knowledge entries. *Risk: high (editorial throughput). Prompts: 6–10+. Effort: 2–4 weeks editorial.*
2. Gate Pantry Explore surfaces so unauthored foods degrade gracefully (already partly designed). *Risk: low. Prompts: 1–2. Effort: 1–2 days.*

### 21–24. Discovery / Alternatives / Stories / Seasonal Engines — 97% each · 🟢 LOW · blocker: NO
**What exists:** four engines under `shared/{discovery,alternatives,stories,seasonal}`, each with
`engine.ts`, `types.ts`, `index.ts`, a dedicated **`trust.ts` gate**, and authored maps (cuisine-map 70
entries, seasonal-map 31, alternatives-map 48, stories journey-map 9). **All four are pure/deterministic
— zero OpenAI/LLM/`fetch`/`http` calls.** Every test passes with explicit trust assertions:
- WS8: "no fabricated relationships for an unknown food", all ranking/judgement phrases flagged — **ALL CHECKS PASSED**.
- WS9: "46 authored options across 10 anchors are trustworthy", dishonest "less processed milk" claim stays SILENT — **all gates passed**.
- WS10: "42 story cards pass the trust gate" — **passed**.
- WS11: "77 seasonal cards pass the trust gate", sparse-season empty-state discipline — **passed**.
**Missing features:** authored-map breadth scales with the editorial registry (#20).
**Bugs / weaknesses:** none identified.
**User impact:** High value, low risk. **Launch risk:** 🟢 Safe.
**Path to green:** none required.

### 25. Production Deployment — 75% · 🔴 HIGH · **blocker: YES**
**What exists:** `build` (vite + esbuild) **passes**; `start` script; `trust proxy`; env-driven config; demo cleanup admin job; one baseline drizzle migration (`migrations/0000_conscious_nuke.sql`).
**Missing features / weaknesses:**
- **`typecheck` FAILS (exit 1, 24 errors)** — so `npm run release:check` (typecheck → test → build) **cannot pass**. All 24 errors are in **test/dev scripts**, not production code (see §4), but the documented release gate is red.
- **Schema is managed by `drizzle-kit push`** (`db:push`), not versioned migrations — only one baseline SQL migration exists. Dev↔prod schema drift cannot be diffed from migration history; no schema rollback.
- **Client ships a single 3.27 MB JS chunk** (864 KB gzip) — no code-splitting; slow first load, especially mobile.
- Session secret / cookie issues (see #1) are deployment-time security blockers.
**User impact:** Hidden→High. **Launch risk:** 🔴 Launch blocker.
**Path to green:**
1. Fix/segregate test-file type errors so `typecheck` (and `release:check`) is green. *Risk: low. Prompts: 1–2. Effort: 0.5–1 day.*
2. Establish prod schema parity procedure (snapshot dev schema, verify against prod). *Risk: med. Prompts: 1. Effort: 0.5–1 day.*
3. (Perf, can follow launch) code-split the client bundle. *Risk: low. Prompts: 1. Effort: 1 day.*

---

## 4. MANDATORY TESTS — exact commands & outputs

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` (`tsc --noEmit`) | ❌ **exit 1 — 24 errors** |
| Build | `npm run build` (`tsx script/build.ts`) | ✅ **exit 0** (warns: 3.27 MB chunk) |
| Full test suite | `npm run test` | ✅ **exit 0** |
| WS8 Discovery | `npx tsx server/tests/test-discovery-engine.ts` | ✅ **ALL CHECKS PASSED** |
| WS9 Alternatives | `npx tsx server/tests/test-alternatives-engine.ts` | ✅ **all gates passed** |
| WS10 Stories | `npx tsx server/tests/test-stories-engine.ts` | ✅ **42 cards pass trust gate** |
| WS11 Seasonal | `npx tsx server/tests/test-seasonal-stories-engine.ts` | ✅ **77 cards pass trust gate** |
| Migration status | `ls migrations/` | ⚠️ 1 baseline SQL migration + `meta`; schema otherwise via `db:push` |
| Dev↔prod schema diff | (no migration history) | ⚪ **Unknown — not derivable**; `db:push` model has no diffable history |

**Typecheck failures (24, all in non-production files):**
- `server/scripts/query-investigation.ts` (1) — dev script
- `server/scripts/query-user1-meals.ts` (2) — dev script
- `server/tests/test-household-vegan-vegetarian-hard-enforcement.ts` (12)
- `server/tests/test-slot-filling-recovery.ts` (7) — top-level `await` + module target
- `server/tests/test-tier4-shell-recovery-activation.ts` (2) — type cast + top-level `await`

**Warnings:** client chunk 3.27 MB / server bundle 2.6 MB (esbuild) — no code-splitting.
**Unknowns:** dev vs prod schema parity (no migration history to compare); runtime behaviour of OCR/enrichment when OpenAI key absent (not exercised in this audit).

**Critical reassurance:** **no production code path fails typecheck** — every error is in a test or
investigation script. The shipped server/client/shared code is type-clean and the build succeeds.

---

## 5. USER JOURNEY TESTS

| # | Journey | Verdict | Notes |
|---|---|---|---|
| 1 | New user → Sign in → Dashboard | 🟡 Works, polish | Auth solid; verify cold-start empty states + email-verification gate copy. |
| 2 | Import/create meal → Cookbook → Meal page | 🟢 Works | Mature; Discovery not yet surfaced on meal page (enhancement, not break). |
| 3 | Create weekly plan → Planner → Shopping | 🟡 Confusing | Planner solid (gate 25/25); **shopping has 3 overlapping surfaces** — handoff ambiguous. |
| 4 | Smart Planner → Household compatibility → Nutrition Boost → Shopping | 🟡 Works, fragile | Filters/tests pass; slot-fill recovery + boost client-state are the fragile links; thin catalogue degrades quality. |
| 5 | Analyser → Product analysis → Alternatives → Shopping | 🟢 Works | Analysis + `/api/product-alternatives` solid (editorial-flagged items correctly excluded from swaps). |
| 6 | Pantry Explore → Search → Alias → Food page → Discovery → Alternatives → Stories → Seasonal | 🟢 Works (content-bound) | The whole chain is wired, read-only, trust-gated; **value limited by sparse knowledge registry**, not by code. |
| 7 | Profile → Dietary restrictions → Household members → Planner compatibility | 🟢 Works | Strongest-tested chain; restriction propagation verified end-to-end by tests. |

**Launch-blocking journeys:** none are *broken*. Journey 3 (shopping fragmentation) and Journey 6
(content thinness) are the two that read as "unfinished" to a user.

---

## 6. ARCHITECTURAL DEBT

| # | Problem | Impact | Risk | Recommended action | Wait until after launch? |
|---|---|---|---|---|---|
| 1 | **`server/routes.ts` is 10,403 lines / 241 handlers** in one file | Maintainability, merge risk | Med | Split by domain into routers | **YES** |
| 2 | **`server/storage.ts` is 3,661 lines** | Same | Med | Modularise storage | **YES** |
| 3 | **Three shopping page components** (`ListPage`, `ShoppingListPage`, `ShoppingWorkspacePage`) + workspace | User confusion, duplicate logic | Med-High | Choose one canonical surface; retire others | **NO** (pre-launch) |
| 4 | **Duplicate route aliases** (`/meals`+`/cookbook`, `/products`+`/analyser`, `/list`+`/shopping-list`, `/diary`+`/my-diary`, `/planner`+`/weekly-planner`, `/basket`+`/analyse-basket`) | Mostly intentional, some legacy | Low | Confirm each alias is intended; retire dead ones | YES |
| 5 | **Three admin-auth styles** (`assertAdmin` middleware, `isAdmin(user)`, inline `role!=="admin"`) | Inconsistency, audit difficulty | Low (all enforce) | Standardise on `assertAdmin` | YES |
| 6 | **`db:push` schema management** with single baseline migration | No diffable schema history / rollback | Med-High | Adopt versioned migrations before launch | **NO** |
| 7 | **No client code-splitting** (3.27 MB chunk) | Slow first load | Med | Route-level dynamic imports | Soon after launch OK |
| 8 | Many ingestion/seed/dev scripts mixed into `server/scripts` & `server/lib` | Dead-code ambiguity | Low | Triage one-off scripts | YES |
| 9 | Premium gating stubbed (`TODO [PREMIUM]` ×3) | Monetisation not enforced | Low (business) | Implement before charging | Depends on pricing launch |

**No obsolete WS architecture found** — WS7–WS11 are additive (new `shared/` engines + read-only consumers),
not replacements that left dead predecessors behind. Older nutrition surfaces (Nutrition Boost, Plant
Diversity) coexist with, rather than duplicate, the new engines.

---

## 7. PRODUCT COHERENCE

**Verdict: mostly ONE product, with two visible seams.** The data model is unified (everything scopes to
one `userId`; household, planner, pantry, diary, shopping share it), and WS7–WS11 deliberately reuse the
same authored vocabulary and trust discipline, which makes the new knowledge layer feel native.

| Seam | State |
|---|---|
| Planner ↔ Pantry | Coherent (planner history feeds `buildHouseholdHistory`). |
| Pantry ↔ Food Pages | Coherent (Explore V2 → knowledge food pages). |
| Shopping ↔ Planner | **Fragmented** — multiple shopping surfaces blur the handoff. |
| Analyser ↔ Pantry | Coherent (shared scoring/additive model). |
| Stories ↔ Pantry | Coherent (Stories rendered inside Explore, read-only). |
| Discovery ↔ Meal Pages | **Underwired** — Discovery exists but isn't surfaced on meal detail yet. |
| Alternatives ↔ Household Compatibility | Coherent (alternatives respect diet context; restriction engine shared). |

**Inconsistent terminology:** "Cookbook" vs "Meals"; "Analyser" vs "Products"; "Shopping list" vs
"Basket" vs "Workspace"; "Nutrition Boost" vs "Simply Better Choices" (rename in progress). Worth a
single naming pass.
**Duplicate journeys:** shopping (3 surfaces). **Confusing ownership:** which shopping page is canonical.
**Hidden complexity:** Smart Planner candidate-pool/slot-fill internals. **UX fragmentation:** shopping +
terminology.

---

## 8. SECURITY & PRIVACY AUDIT

### Authentication — 🟡 Needs hardening
- ✅ Consistent `isAuthenticated()` guard across API routes; `ProtectedRoute` on client.
- ✅ scrypt + `timingSafeEqual`; enumeration-safe forgot/reset; verification flow.
- 🔴 **Hardcoded session-secret fallback** (`server/auth.ts:41`).
- 🔴 **`cookie.secure: false`** (`server/auth.ts:48`).
- 🟡 No login rate limiting; 6-char password floor; 7-day session, no idle timeout.
- ✅ Demo accounts expire and are force-logged-out by middleware.

### Household separation — 🟢 Safe
- One account owns its household; **all reads/writes scope to `req.user!.id`** (verified in pantry CRUD,
  `buildHouseholdHistory`, planner queries). No cross-account access path observed. Pantry/planner/
  shopping/stories feeds are all per-`userId`. **One household cannot see another's data** on the paths reviewed.

### Children — 🟢 Safe (by design)
- The knowledge engines are **planning/education-framed, not consumption-claiming**, and are trust-gated.
  WS9 explicitly keeps dishonest claims SILENT; WS8 refuses to fabricate relationships for unknown foods;
  WS10/WS11 cards all pass trust gates. No fabricated behaviour, no overstated certainty, no unsafe
  assumption surfaced. Stories describe *planned* meals (source: "planned"), not asserted eating.

### API exposure — 🟢 Safe (good hygiene observed)
- Pantry V2 responses **strip internal fields** (`source`, `familiar`) before returning.
- `/api/product-alternatives` deliberately **excludes editorial-flagged items** from swap output.
- `sanitizeUser` used on all user payloads.
- ⚪ Recommend a final sweep for stray confidence/debug/source fields on other engine-adjacent endpoints.

### Environment & secrets — 🟡 Needs hardening
- ✅ No `.env` committed; secrets via env (OpenAI, USDA, Edamam, Spoonacular, FatSecret, SMTP, etc.).
- 🔴 `SESSION_SECRET` unsafe default (above).
- 🟡 Many third-party keys — confirm all are set in prod and none have insecure defaults; confirm
  OpenAI-dependent features degrade gracefully when unset.

### AI / Trust — 🟢 Safe (strongest part of the system)
- **The four user-facing knowledge engines make zero LLM/network calls** — they are deterministic over
  authored maps + `trust.ts` gates (~384 lines of guards). **They cannot hallucinate.**
- OpenAI is confined to **internal/ingestion paths**: item classification, recipe OCR/parsing, enrichment
  — never the editorial knowledge shown to users as fact. AI output feeds curation, not direct claims.
- Result: no fabricated stories, no hallucinated benefits, no AI-suggested unsafe swaps on user surfaces.

**Overall security classification: 🟡 Needs hardening** — gated on the two auth items; everything else is
green or easily closed.

---

## 9. LAUNCH READINESS DASHBOARD

```text
THA Launch Readiness

Overall            ~88%
Risk               🟡 AMBER (with 🔴 gates)

Green areas        7   (Dietary Restrictions, Discovery, Alternatives, Stories,
                        Seasonal, Pantry Inventory, Analyser — + several "mostly" near-green)
Amber areas        14
Red areas          2   (Knowledge Foods content, Production Deployment)

Launch blockers    3   (1) Auth security (session secret + cookie.secure)
                       (2) Release gate green (typecheck) + schema/deploy hygiene
                       (3) Minimum editorial knowledge content bar

Estimated prompts to green   12–18 (code) + 6–10 (editorial, ongoing)
Estimated time to green      Code/security/deploy: ~1 week.
                             Editorial content to a credible bar: 2–4 weeks (parallelisable).
```

---

## 10. IF THIS WAS MY COMPANY — TOP 10 TO FIX FIRST (30-day launch)

| # | Issue | Why it matters | Risk | Effort | Blocker? |
|---|---|---|---|---|---|
| 1 | Require `SESSION_SECRET`; remove hardcoded fallback | Forgeable sessions = account takeover | High | <0.5 day | **YES** |
| 2 | `cookie.secure: true` in production | Session theft over plaintext | High | <0.5 day | **YES** |
| 3 | Make `typecheck`/`release:check` green (fix test-file errors) | The release gate currently can't pass | Med | 0.5–1 day | **YES** |
| 4 | Define + author a minimum launch knowledge set (top 50–100 foods) | A knowledge hub with no knowledge reads as broken | High | 2–4 wks (parallel) | **YES** (for Explore) |
| 5 | Commit WS2 Pantry Explore V2 to history | Flagship feature is uncommitted | Med | <0.5 day | NO (but urgent) |
| 6 | Adopt versioned migrations / verify dev↔prod schema parity | `db:push` gives no rollback/diff | Med-High | 0.5–1 day | NO (strongly advised) |
| 7 | Converge shopping to one canonical surface | Core conversion path is fragmented | Med-High | 2–3 days | NO |
| 8 | Add login rate limiting | Brute-force exposure at launch | Med | 0.5 day | NO |
| 9 | Smart Planner slot-fill/repetition guardrails on thin catalogue | Empty/repetitive plans erode trust | Med | 2–3 days | NO |
| 10 | Code-split the 3.27 MB client bundle | Slow first load, esp. mobile | Med | 1 day | NO |

---

## 11. FINAL QUESTION

> **Can Claude honestly say: "The Healthy Apples has no known launch-blocking unfinished work."?**

# NO.

There are **three** launch-blocking items (ordered by importance):

1. **Authentication security hardening** — hardcoded `SESSION_SECRET` fallback + `cookie.secure: false`.
   *Prompts: 2. Effort: <1 day. Confidence of fix: very high.*
2. **Green release gate + deploy hygiene** — `typecheck`/`release:check` fails (24 test-file errors);
   `db:push` schema management has no diffable history/rollback.
   *Prompts: 2–3. Effort: 1–2 days. Confidence: high.*
3. **Minimum editorial knowledge content bar** — the knowledge registry is near-empty, so the
   Pantry Explore / knowledge experience the engines were built to power has little to show.
   *Prompts: 6–10+. Effort: 2–4 weeks editorial (parallelisable). Confidence: high it can be done, but
   throughput-bound, not code-bound.*

**Important nuance:** none of these are in the recently completed WS7–WS11 work, which is the
most production-ready part of the system. Blockers 1 and 2 are small, fast, high-confidence fixes.
Blocker 3 is the genuine longest pole and was already identified by the 2026-06-18 roadmap.

---

## 12. DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | **YES** (read-only inspection of code, tests, git) |
| Writes new data | **NO** |
| Changes meaning of existing data | **NO** |
| Requires backfill | **NO** |

---

## 13. SCOPE LOCK

Investigation only. **No implementation, no fixes, no schema changes, no UI changes, no refactors** were
performed. Artefacts produced: this document + two rollback git tags. All improvement ideas are recorded
below as suggestions only.

### SUGGESTIONS (no action taken)
- **SUGGESTION:** Require `SESSION_SECRET` at boot in production; delete the literal fallback (`server/auth.ts:41`).
- **SUGGESTION:** Set `cookie.secure: true` when `NODE_ENV==="production"` (`server/auth.ts:48`).
- **SUGGESTION:** Add rate limiting to `/api/login`; raise password floor to 8; consider idle session timeout.
- **SUGGESTION:** Fix or exclude-from-`tsc` the 5 failing test/dev scripts so `release:check` is green
  (consider a separate `tsconfig` for `server/tests` + `server/scripts`).
- **SUGGESTION:** Adopt versioned drizzle migrations; snapshot current schema as a baseline; add a
  dev↔prod schema parity check to the release procedure.
- **SUGGESTION:** Commit WS2 Pantry Explore V2 to git history (currently working-tree only).
- **SUGGESTION:** Author a "minimum launch food set" (50–100 foods) for the knowledge registry; gate
  Explore surfaces to degrade gracefully for unauthored foods.
- **SUGGESTION:** Converge the three shopping surfaces into one canonical page; redirect the rest.
- **SUGGESTION:** Standardise admin auth on the `assertAdmin` middleware (retire the two inline styles).
- **SUGGESTION:** Code-split the client bundle (route-level dynamic imports / manualChunks).
- **SUGGESTION:** Split `server/routes.ts` (10.4k lines) and `server/storage.ts` (3.7k lines) by domain — post-launch.
- **SUGGESTION:** Single naming pass (Cookbook/Meals, Analyser/Products, Shopping/Basket/Workspace, Boost/Simply Better Choices).
- **SUGGESTION:** Implement the three stubbed `TODO [PREMIUM]` gates before charging.
- **SUGGESTION:** Wire Discovery onto meal-detail pages to close the Discovery↔Meal-page seam.
- **SUGGESTION:** Final endpoint sweep for stray confidence/source/debug fields beyond the Pantry V2 routes already verified clean.

---

*End of audit. Rollback: `git reset --hard rollback/pre-audit-20260623-head` (committed) ·
`git stash apply 239853a` (WS2 working tree).*
