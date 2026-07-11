# DEVWORLD2 — Pre-Implementation Findings (HALTED before code)

**Status:** HALTED by mission owner before any implementation. No importer, no rollback tag, no seed data, no schema/migration/code changed. This document preserves investigation findings only.
**Reason for halt:** The canonical Development World dataset does not yet exist in the repository. The decision is to **author the canonical Development World Library under `data/development_world/` first**, and only then build the importer. This note exists so that work is not re-derived on return.
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Predecessors read:** `docs/architecture/README.md`, `docs/investigations/development_world/DEVWORLD1_DEVELOPMENT_WORLD_SCHEMA_DISCOVERY.md`, `docs/investigations/development_world/DEVWORLD1C_DEVELOPMENT_CAPABILITY_COVERAGE.md`.

---

## 1. The decisive finding — the mission's primary input is absent

There is **no external "supplied THA Development World Library" file** anywhere in the repository. Verified exhaustively: untracked files (`git status`), all stash entries, filename patterns (`*world*`, `*librar*`, `*.yaml`/`*.yml`), and content greps across `git log --all`. This mirrors DEVWORLD1C's finding that its required-reading `DEVWORLD1B` did not exist.

The mission owner has confirmed this and directed that the canonical dataset be **authored first** under `data/development_world/`. DEVWORLD2 (the importer) resumes after that exists.

## 2. What DOES exist (the two halves the importer must bridge)

| Asset | Location | State in dev DB (probed 2026-07-10) |
|---|---|---|
| **Founding cookbook (COOKBOOK3)** — 500 THA recipes, each with `recipe_id` `THA-###` and stable `import_key` `tha_original:THA-###` (stored in `meals.acquisition_source_key`), imported as SYSTEM meals (`user_id=0`, `is_system_meal=true`, `acquisition_lane='tha_library'`). | `data/cookbook/tha_original_founding_cookbook_500/` + `scripts/import-tha-founding-cookbook-500.ts` | **Present: 500 `tha_original:*` system meals** (884 system meals total; 2737 meals total; 362 canonical foods). |
| **Development-world households (INTQ6 / DEVWORLD)** — 10 households `BW01`–`BW10` as typed fixtures, imported through production write paths by a dev-only, idempotent seeder. | `server/benchmark/world-fixtures.ts` (1332 ln), `server/benchmark/world-seeder.ts` (624 ln) | **Present: seeded** — owner accounts `*.auto@benchmark.thehealthyapples.dev` exist. |

`DATABASE_URL` is set; `NODE_ENV` is not `production`.

## 3. The core delta DEVWORLD2 must close

The existing `world-seeder.ts` is already **dev-only** (`assertBenchmarkWorldAllowed`, no override), **idempotent** (resolve-by-username, wipe-then-reseed), and **reuses production services** (`storage.*`, `autoAnalyzeMeal`, `recordOutcomeAndDetect`). It satisfies most mission requirements **except one that is decisive**:

- It **authors meals inline** — `reseedHousehold` calls `storage.createMeal(owner.id, { ingredients: [...] })` per household (`world-seeder.ts:371-388`), creating **new per-household recipe rows**.
- The DEVWORLD2 mission forbids exactly this: *"Reference existing meals by recipe_id/import_key only"* and *"Do not create duplicate households, recipes or canonical foods."*

So DEVWORLD2 is **net-new work**, not a re-run: the development-world households must **reference the founding-cookbook system meals by `import_key`/`recipe_id`** (idempotency + reuse key already established by COOKBOOK3), never author duplicate recipe content. The canonical library under `data/development_world/` should therefore express cookbook references (e.g. `tha_original:THA-001`) rather than inline ingredient strings, for the meal/cookbook/planner content.

## 4. Design already settled by DEVWORLD1 / 1C (reuse on return, do not re-derive)

- **Import order** (FK/derivation-forced): DEVWORLD1 §5 — Phase 0 global reference seeds; Phase 1 per household in 13 steps (account → household+partner via `joinHousehold` → scoped wipe → preferences → eaters → pantry → meals → planner → freezer → **derived** shopping list → diary → evidence via `recordOutcomeAndDetect` → stamp).
- **Authored vs derived vs forbidden** field classification: DEVWORLD1 §6, and the forbidden-to-seed table set: DEVWORLD1 §3.1 (`nutrition`, `meal_allergens`, `household_learning_signals` confirmed, `platform_observations`, `opportunity_deliveries`, `conversations/threads/turns`, `ingredient_sources`, …).
- **Validation rules** (27, in 6 groups) incl. the F3 vocabulary gate and restriction-library mapping: DEVWORLD1 §8. Mission's *"Validate all meal references before import"* maps to referential rules 6–7 — here extended to: **every referenced `recipe_id`/`import_key` must resolve to an existing system meal, or the import aborts before writing.**
- **Entities to import** (mission list): households, users, planner history, cookbook references, pantry, supported behaviour. Note DEVWORLD1 F5: *planner history, skipped-meal events, favourites* have **no schema** and must not be invented — planner "history" is the rolling 6×7 canvas; behaviour is `household_evidence_events` via the EL1 orchestrator only.
- **Portfolio**: DEVWORLD1C §6 recommends retaining ten households, distributing `companionPersonality` (all 6) and `subscriptionTier` (all 3), one mixed-diet household, and one clean host per ambient opportunity type.
- **Open questions still unanswered** (DEVWORLD1 §12 Q1–Q5): fate of the six certification households; where the generalised world lives (`server/benchmark/` → `server/world/`?); YAML vs TS; whether `data/development_world/` is JSON/YAML; positive `dayOffset` policy.

## 5. Honest gaps carried forward

- **G1 — No supplied library.** The primary input does not exist; being authored first under `data/development_world/` (this halt).
- **G2 — Meal-reference model is new.** The existing seeder's inline-authored meals contradict the mission; DEVWORLD2 must convert to cookbook references by `import_key`.
- **G3 — Determinism / allergen / shopping-list defects** named by DEVWORLD1 (F2 network-bound nutrition; F4 `meal_allergens` cannot spell sesame/mustard/coconut; F6 orphan shopping lists) are inherited and must be honoured, not silently re-introduced.
- **G4 — Runtime-only capabilities** (confirmed understanding, grounded companion turns, opportunity deliveries) are un-seedable by architecture (DEVWORLD1C §5) — the library makes them *reachable*, never contains them.

## 6. State on halt

No code, schema, migration, seed data, rollback tag, or DB write was produced this session. A temporary read-only DB probe script was created and **removed**; the working tree carries none of my changes. The only artefact is this findings note.

---

*Resume point: once `data/development_world/` holds the canonical Development World Library, DEVWORLD2 implements the dev-only, idempotent importer that (a) validates every cookbook meal reference against existing system meals before writing, (b) reuses the production services already used by `world-seeder.ts`, and (c) references — never duplicates — recipes and canonical foods.*
