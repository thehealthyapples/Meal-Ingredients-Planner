# FS3 — Recipe Acquisition Architecture — Implementation

**Date:** 2026-07-02
**Branch:** `int1-intelligence-platform`
**EWO:** EWO-FS3 (🟡 AMBER)
**Risk:** 🟡 AMBER
**Reason:** Introduces the canonical Recipe Acquisition Architecture: five additive provenance columns on `meals` with a deterministic backfill, a policy register that all acquisition paths now enforce, and a deliberate runtime change — unlicensed scraped sources become uncallable and Smart Suggest auto-imports stop being mislabelled as user-authored.
**Companion documents:** FS1 (`docs/investigations/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md`), FS2 (`docs/investigations/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md`) — the evidence base; the new governing document `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` — the canonical architecture this task introduces.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-fs3-recipe-acquisition-20260702` → `4a2da73` |
| Working tree | Intentionally dirty — substantial prior uncommitted INT35–NUT1/FS1/FS2 work on this branch, untouched by this task |
| This task's writes | New: `shared/recipe-acquisition.ts`, `scripts/apply-recipe-acquisition-columns.ts`, `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md`, this file. Modified: `shared/schema.ts`, `server/lib/recipe-source-gate.ts`, `server/lib/external-meal-service.ts`, `server/lib/auto-import-service.ts`, `server/storage.ts`, `docs/architecture/README.md` (one index row) |
| Rollback to committed state | `git checkout rollback/before-fs3-recipe-acquisition-20260702` (see Rollback Plan for the DB step) |

---

## REFERENCE DOCUMENTS READ

- [x] docs/architecture/README.md (architecture bootstrap — canonical entry point)
- [x] docs/architecture/ARCHITECTURE_PRINCIPLES.md
- [x] docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md (Domain 12 — Meal Identity)
- [x] docs/architecture/ENGINEERING_WORKFLOW.md
- [x] docs/investigations/FS1_THA_KNOWLEDGE_SOURCE_AND_LICENSING_AUDIT.md (via FS2's citations)
- [x] docs/investigations/FS2_RECIPE_ACQUISITION_ARCHITECTURE_AND_LICENSING_REVIEW.md (full)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Meals keep their single key space (meals.id). Acquisition sources get one
  key space: the source keys already used by recipe-source-gate, reused by
  the policy register and by meals.acquisition_source_key.

☑ One owner per fact
  Acquisition provenance (lane, type, source, licence, attribution) has one
  owner: the five new meals columns, vocabulary owned by
  shared/recipe-acquisition.ts. The legacy mealSourceType is NOT a second
  owner of these facts — it answers a different, coarser question at existing
  branch points and has a named retirement plan (see Evolution over
  replacement). Admin enablement stays owned by recipe_source_settings; the
  policy register owns licensing, a fact the settings table never held.

☑ No duplicate entities
  No new entity. Meals are extended; the source register extends the existing
  ALL_SOURCES source concept with policy fields rather than creating a rival
  source list (recipe-source-gate now consumes the register).

☑ No duplicate ownership
  recipe-source-gate.ALL_SOURCES keeps only presentation/enablement metadata;
  licensing policy lives only in the register. No attribute gained two owners.

☑ No duplicate state
  No user state involved. Backfill writes each row's provenance once; write
  paths set it at creation.

☑ Extends existing architecture
  Extends recipe-source-gate (FS2 R2's designated enforcement point), the
  existing scripts/apply-*.ts DDL precedent, the storage.createMeal write
  funnel, and the FS1 source-register concept.

☑ Progressive enrichment where appropriate
  Meal is a knowledge entity; provenance columns are additive identity-level
  facts (nullable in schema, backfilled deterministically). No enrichment
  pipeline bolted onto transactional state.

☑ Honest gaps over fabricated information
  20 legacy imported rows whose source domain maps to no register source keep
  acquisition_source_key NULL rather than a guessed source. Unregistered
  candidate sources are refused, not defaulted. Starter-meal provenance is
  recorded at the mapping FS2 §4.3 specifies with the E-a caveat carried
  forward in the governing document — not silently promoted to verified IP.

☑ No permanent synchronisation bridge
  storage.createMeal's legacy derivation is a many-inputs-to-one-owner funnel
  (permitted infrastructure): it writes the canonical columns once at insert;
  nothing keeps two stores in sync thereafter.

☑ Evolution over replacement
  mealSourceType is superseded as the provenance owner but retained for its
  ~6 runtime branch points (meal-resolution-service.ts:112, routes.ts:4885-4887,
  smart-suggest candidateIsProduct, openfoodfacts-importer, uplift-persistence,
  meals export). Retirement plan: a follow-up workstream migrates those branch
  points to acquisitionType/acquisitionSourceKey, then drops the column.
```

**AI ARCHITECTURE COMPLIANCE:** Not an AI implementation — no assistant, capability binding, intent or conversation state is created or altered. Intelligence capabilities are governed *indirectly*: they consume the same business services (Smart Suggest, meals store) that now enforce acquisition policy, which is the reuse the platform architecture requires.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Meal Identity (SoT Register Domain 12) — acquisition/provenance facet
Declared SoT: DB meals table (unchanged owner)
New store created? YES — the acquisition policy register in shared/recipe-acquisition.ts
  Retirement plan for any replaced store: it replaces nothing. It adds the
  licensing/policy layer FS2 §1.F proved did not exist anywhere. The
  recipe_source_settings table is NOT replaced — it keeps admin enablement;
  the register owns policy above it.
Existing store extended? YES — meals gains 5 nullable columns (additive DDL);
  recipe-source-gate extended to consult the register.
Consumer created? YES — recipe-source-gate, external-meal-service,
  auto-import-service, storage.createMeal consume the register.
  Reads from declared SoT? YES — policy from the register (its declared owner),
  meal provenance from the meals table.
```

---

## IMPLEMENTATION

### 1. Canonical policy owner — `shared/recipe-acquisition.ts` (new)

Single source of truth for the acquisition vocabulary and per-source policy:

- **Four lanes** (`AcquisitionLane`): `tha_library`, `licensed_discovery`, `personal_cookbook`, `community_cookbook` (defined-but-dormant future lane — a sharing feature becomes a feature implementation, not an architecture change).
- **Acquisition acts** (`AcquisitionType`): `authored`, `licensed_import`, `user_import`, `user_transcription`, `product`, `derived`, `community_share`.
- **Storage policies**: `import`, `cache_ttl`, `link_only`, `forbidden`.
- **Licence states**: `owned`, `licensed`, `conditional`, `pending_review`, `unlicensed` — only the first three are callable, ever.
- **`ACQUISITION_SOURCE_REGISTER`** — one evidence-backed entry per external source (all nine gate sources), each citing its FS1/FS2 finding. TheMealDB: `conditional`/`import` (supporter-key action outstanding, FS1 G2). Edamam: `licensed`/`link_only` with `allowContentFetch: false` (the FS2 R7 never-scrape rule is now code). The four scraped publishers: `unlicensed`/`forbidden`, no lane. API-Ninjas/BigOven/FatSecret: `pending_review`/`forbidden` (FS1 G7).
- **`INTERNAL_SOURCE_POLICIES`** — `meal_shell` (THA-owned, always persistable), so the shell-recovery flow through the shared persistence funnel is explicitly owned rather than accidentally allowed.
- **`deriveAcquisitionFromLegacy()`** — the canonical `mealSourceType` → lane/type mapping (FS2 §4.3), used by the write funnel and mirrored by the backfill SQL.

### 2. Provenance schema — `shared/schema.ts` + `scripts/apply-recipe-acquisition-columns.ts`

Five additive nullable columns on `meals`: `acquisition_lane`, `acquisition_type`, `acquisition_source_key`, `licence_ref`, `attribution_text`; added to `insertMealSchema`. The apply script (idempotent `ADD COLUMN IF NOT EXISTS` + fill-NULLs-only backfill, per the established scripts/apply-*.ts precedent) was **run against the dev database**:

```
tha_library / authored: 1323        (starter — E-a caveat recorded)
tha_library / product: 384          (ready_meal 309 + system openfoodfacts 75)
personal_cookbook / authored: 255   (scratch, no sourceUrl)
personal_cookbook / user_import: 186 (imports incl. recovered laundered rows)
personal_cookbook / derived: 21     (variants + planner placeholders)
personal_cookbook / product: 7      (user barcode scans)
NULL lanes remaining: 0
```

**Laundering recovery (FS2 C2-a, measured):** 155 rows stored as `"scratch"` with an external `sourceUrl` recovered their true source key from the URL domain — **148 BBC Good Food, 7 AllRecipes**. 20 further `scratch`+`sourceUrl` rows map to no register source and honestly keep `acquisition_source_key = NULL` as `user_import`.

### 3. Enforcement — policy above admin toggles

- **`server/lib/recipe-source-gate.ts`** — `isSourceCallable` now checks the policy register *first*: a source that is unregistered, `unlicensed` or `pending_review` is uncallable regardless of the admin toggle or credentials. The four scraped sources' `defaultEnabled` flipped to `false` (FS2 R1) so the admin UI reflects reality; `getAllSourceSettings` now also returns `acquisitionLane`/`storagePolicy`/`licenceState`/`acquirable`/`licenceNote` (additive) so the admin surface can display *why* a source cannot be enabled.
- **`server/lib/external-meal-service.ts`** — `fetchExternalCandidates` (the Smart Suggest harvesting path) now routes every source call through `isSourceCallable`, **closing FS2 C1-a** (it previously bypassed the gate entirely, including its generic-fallback second sweep). `enrichCandidateIngredients` refuses to fetch a candidate's detail page unless the source's policy sets `allowContentFetch` — true for no current source, encoding "no THA-initiated scraping" and the Edamam rule in the function itself rather than in its callers.
- **`server/lib/auto-import-service.ts`** — `autoImportExternalMeal` now (a) refuses to persist any candidate whose source is unregistered or lacks `storagePolicy: import` — including client-supplied `"Unknown"` candidates on `POST /api/smart-suggest/auto-import`, **closing FS2 C2**; (b) writes honest provenance: external candidates persist as `mealSourceType: "smart_import"` with lane `licensed_discovery`, type `licensed_import`, source key, licence ref and attribution text; internal `Meal Shell` applies keep their historical `"scratch"` value (behaviour-compatible) while the acquisition columns record `tha_library`/`authored` truthfully; (c) only re-fetches missing ingredients where policy permits (nowhere today).
- **`server/storage.ts`** — `createMeal` (the meal write funnel) defaults the acquisition columns from `deriveAcquisitionFromLegacy` whenever a caller doesn't set them, so every pre-FS3 call site (URL/social/paste imports, starter copies, variants, quick meals) writes canonical provenance with zero call-site churn. `summaryFields()` extended so `MealSummary` carries the new columns.

### 4. Behaviour changes (deliberate, the point of the architecture)

| Path | Before | After |
|---|---|---|
| Recipe search (B1) | Scraped BBC GF/AllRecipes/Jamie Oliver/Serious Eats live (default-on) | Those sources uncallable; TheMealDB remains |
| Smart Suggest harvesting (C1) | Scraped all four publishers on every plan generation, ungated | Gate-checked per source; only TheMealDB callable |
| Candidate enrichment | Scraped candidate detail pages (5 concurrent) | No content fetch (policy-gated; no source permits it) |
| Auto-import (C2) | Persisted anything as `"scratch"`, re-scraping when ingredients missing | Only `import`-policy sources persist, as `smart_import` with licence + attribution; unregistered sources refused (route returns its existing failure response) |
| Admin source toggles | Could enable scraped sources | Policy layer above toggles; unlicensed sources uncallable |

Verified end-to-end against the live gate + DB: `themealdb callable=true`; all four scraped sources, Edamam (uncredentialed) and the three unreviewed APIs `callable=false`; persistence gate allows `TheMealDB`/`Meal Shell`, refuses `BBC Good Food`/`Edamam`/`Unknown`; content fetch allowed nowhere.

### 5. Canonical architecture document

`docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md` added as governing architecture and indexed in `docs/architecture/README.md` (Platform Governance). It records the four lanes, the seven invariants, the enforcement map, and the **commercial extension rule**: adding Edamam Licensed Recipes, Good Food syndication, Whisk for Business or a Spoonacular-style live-fetch licence is a register entry plus credentials — never an architecture change.

---

## DEFINITION OF DONE

**Success looks like:**
- Every meal row answers "under what right is this held" — 0 NULL lanes after backfill ✅ (verified: 2,176 rows across 6 lane/type groups)
- No THA code path can scrape a publisher: search, harvesting, enrichment and re-import all policy-gated ✅ (verified via live gate check + code paths)
- Laundered auto-imports carry honest provenance ✅ (155 rows recovered to `user_import` with true source keys)
- A future licensed source is a register entry, not a refactor ✅ (extension rule §6 of the governing doc)

**What must not break (verified):**
- `test-shell-meal-metadata-write-path` — 11/11 pass (shell applies still import; template metadata still copied)
- `test-dietary-trust-fix` — 26/26 pass (enrichment pass-through and null contracts unchanged)
- `test-ingredient-verification` — 21/21 pass (no-title-guessing exclusion contract unchanged)
- `npx tsc --noEmit`: no new errors in any touched file (pre-existing unrelated debt in `server/intelligence/*`, `server/scripts/*`, one legacy test file — untouched)
- Meal Detail / Planner / Cookbook read paths: columns are additive; `MealSummary` extended in its single projection helper

**Manual test steps:**
1. `npx tsx scripts/apply-recipe-acquisition-columns.ts` — idempotent; reports lane distribution and 0 NULLs.
2. Restart the app; as admin, open recipe source settings — scraped sources show disabled with `acquirable: false`.
3. Run a Smart Suggest plan generation — log shows no BBC/AllRecipes/Jamie Oliver/Serious Eats fetches; TheMealDB candidates only.
4. Accept a TheMealDB suggestion — the created meal row has `meal_source_type='smart_import'`, `acquisition_source_key='themealdb'`, attribution text present.
5. POST a hand-crafted candidate with `source: "BBC Good Food"` to `/api/smart-suggest/auto-import` — refused (no meal created; warn log).

---

## DATA IMPACT

- Reads existing data: **YES** — backfill reads `meal_source_type`, `source_url`, `is_system_meal`.
- Writes new data: **YES** — 5 additive nullable columns on `meals`; backfill fills them for 2,176 existing rows (fill-NULL-only; no existing column value modified).
- Changes meaning of existing data: **NO** — `mealSourceType` values and semantics unchanged; one new value (`smart_import`) appears on future rows only.
- Requires backfill: **YES — performed** in the same script, deterministic per the FS2 §4.3 mapping, re-runnable, transaction-wrapped.

---

## TRUST CHECK

- **Could this mislead the user?** No. It removes an existing deception (scraped recipes labelled as user-authored) and adds visible attribution for licensed content.
- **Could this fabricate certainty?** The one uncertain mapping — starter meals as `tha_library/authored` — follows FS2 §4.3 with the E-a caveat recorded in the governing doc §8 and re-laning required if R8's archaeology contradicts it. Unmappable source domains stay NULL rather than guessed.
- **Is anything guessed but shown as real?** No. Recovered source keys come only from exact domain matches; licence states come from FS1/FS2's primary-source verification, each entry citing its finding.
- **What happens if the system is wrong?** A wrongly-forbidden source shows fewer discovery results (safe direction). A wrongly-permitted source would be TheMealDB only — whose terms permit use, with the key upgrade tracked as `conditional`.
- No architectural duplication introduced: **YES** — one policy owner; gate/services consume it.
- No new source of truth created for existing domains: **YES** — the register owns a fact (licensing policy) that previously had no owner anywhere (FS2 §1.F).
- No runtime behaviour altered: **N/A** — runtime behaviour is deliberately altered as scoped; changes enumerated in Implementation §4.

---

## ARCHITECTURE CONVERGENCE STATUS

*(Optional for 🟡 AMBER; included because this significantly alters the Meal Identity domain.)*

```
Domain: Meal Identity — acquisition/provenance facet
Current Canonical Owner: DB meals table; policy vocabulary in shared/recipe-acquisition.ts
Current Runtime Consumer(s): recipe-source-gate, external-meal-service (search +
  enrichment), auto-import-service, storage.createMeal, smart-suggest-service
  (via the gated services), admin source-settings API
Duplicate Owners Remaining: mealSourceType still answers coarse source-type
  questions at ~6 branch points (named under Evolution over replacement)
Duplicate State Remaining: NONE
Duplicate Workflows Remaining: NONE — the previously gate-bypassing harvesting
  path now uses the same isSourceCallable workflow as search
Current Convergence (%): 100% of rows carry canonical provenance (2,176/2,176);
  0 of ~6 mealSourceType branch points migrated to the canonical columns
Target Convergence (%): 100% rows (met); branch-point migration deferred
Next Planned Milestone: mealSourceType branch-point migration + column
  retirement; FS2 R5 (honest User-Agent on user imports); FS2 R8 (starter
  provenance archaeology)
Remaining Architectural Risks: direct db.insert(meals) seed paths
  (seed-ready-meals, openfoodfacts-importer, starter copy) bypass
  storage.createMeal and rely on the re-runnable backfill for provenance;
  acceptable because their mealSourceType values map deterministically, but
  they should adopt the funnel when next touched.
```

---

## ROLLBACK PLAN

- Rollback identifier: `rollback/before-fs3-recipe-acquisition-20260702` → `4a2da73`
- Files added: `shared/recipe-acquisition.ts`, `scripts/apply-recipe-acquisition-columns.ts`, `docs/architecture/THA_RECIPE_ACQUISITION_ARCHITECTURE.md`, `docs/implementation/FS3_RECIPE_ACQUISITION_ARCHITECTURE.md`
- Files modified: `shared/schema.ts`, `server/lib/recipe-source-gate.ts`, `server/lib/external-meal-service.ts`, `server/lib/auto-import-service.ts`, `server/storage.ts`, `docs/architecture/README.md`
- Code rollback: `git checkout rollback/before-fs3-recipe-acquisition-20260702 -- <the files above>` then delete the four added files (other uncommitted work on the branch is untouched by a per-file rollback).
- DB rollback (only if required): `ALTER TABLE meals DROP COLUMN IF EXISTS acquisition_lane, DROP COLUMN IF EXISTS acquisition_type, DROP COLUMN IF EXISTS acquisition_source_key, DROP COLUMN IF EXISTS licence_ref, DROP COLUMN IF EXISTS attribution_text;` — safe because no pre-existing column was modified. Note `recipe_source_settings.enabled` was reseeded to the new defaults for rows without `admin_updated_at`; re-running the app after code rollback reseeds the old defaults the same way.
- Verification after rollback: `git status` shows only the pre-FS3 dirty set; `tsc` reproduces the pre-FS3 error set; scraped sources callable again (the pre-FS3 exposure returns — rollback restores the liability FS2 documented).

---

## SCOPE LOCK

**Implemented scope:**
- Canonical Recipe Acquisition Architecture (governing doc + README index row)
- Four-lane separation with per-row provenance (schema + backfill: THA Library / Licensed Discovery / Personal Cookbook / Community Cookbook-dormant)
- Ownership/provenance/licensing recorded for every recipe row (0 NULL lanes)
- Capability-governed, reusable policy: one register enforced inside the shared services every consumer (routes, Smart Suggest, intelligence bindings) calls
- Commercial extension without architectural change (register-entry extension rule)
- FS2 R1 (scraped sources off + uncallable), R2 (harvesting gated), R3 (laundering fixed + backfilled), R6 (structured provenance + storage-policy registry), R7 (Edamam never-fetch as code), R11 (lane containment stated as invariant; Personal Cookbook rows already never feed discovery)

**Explicitly excluded scope (NOT done):**
- FS2 R4 — TheMealDB supporter key (commercial action; register entry marked `conditional`)
- FS2 R5 — honest User-Agent / removal of impersonation headers + WP-JSON fallback on the user URL-import path
- FS2 R8 — starter-meal provenance archaeology
- FS2 R9 — commercial evaluations (Edamam Licensed Recipes / Good Food syndication / Whisk)
- FS2 R10 — ToS user-content rights clause
- `mealSourceType` branch-point migration and column retirement
- Any Community Cookbook runtime feature (lane defined only)
- Client/admin UI rendering of the new policy fields and attribution text (server returns them; UI work is a follow-up)

**SUGGESTION (observed, not implemented):**
- The auto-import route returns a generic 500 when the policy gate refuses a candidate; a 403 with a licensing message would be clearer for the client.
- `server/lib/recipe-scraper.ts` and the four `search*` scraper functions are now unreachable on all automated paths; once FS2 R5 reworks the user-import fetch, the Chrome-impersonation header sets can be deleted outright.
- The 20 `user_import` rows with NULL source key could be shown to their owners for manual source confirmation ("where did this recipe come from?") — turning an honest gap into user-verified provenance.
