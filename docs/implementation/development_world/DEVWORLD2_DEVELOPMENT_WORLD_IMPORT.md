# DEVWORLD2 — Development World Import

**Status:** IMPLEMENTED (DEV only).
**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Classification:** Platform Governance × Development World — dev-only operational importer.
**Governing documents read first:** `docs/architecture/README.md` (Architecture Bootstrap) and its Platform/Intelligence governance set.
**Predecessor investigations implemented:**
`docs/investigations/development_world/DEVWORLD1_DEVELOPMENT_WORLD_SCHEMA_DISCOVERY.md` (entity map, import order, field classification, validation rules) and
`docs/investigations/development_world/DEVWORLD2_PRE_IMPLEMENTATION_FINDINGS.md` (the reference-not-author delta, G2).

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| HEAD at start | `8e10ea32f41a6275d1fb1bc115be588ff8195a3d` (unchanged — nothing committed) |
| **Rollback tag** | `rollback/before-devworld2-development-world-import-20260710` (at HEAD `8e10ea3`) |
| Code modified | None (only NEW files added) |
| Schema modified | None |
| Migrations added | None |
| Files added | `scripts/import-development-world.ts`, `docs/implementation/development_world/DEVWORLD2_DEVELOPMENT_WORLD_IMPORT.md` (this file) |

**Rollback (code):** the change is purely additive. To remove it:
`git checkout rollback/before-devworld2-development-world-import-20260710 -- .` then delete the two untracked new files above (a tag does not remove untracked files).

**Rollback (DEV database):** the seeded world is DEV-only and scoped to the `@dev.thehealthyapples.dev` account domain. To wipe it:
`npx tsx scripts/import-development-world.ts --rollback` (scoped, dev-only; never touches production or any non-world account).

---

## 1. Mission

Import `data/development_world/` (the committed **Development World Foundation 50**) into the **DEV** database only, reusing existing production services, referencing meals by `recipe_id`/`import_key` without duplicating any recipe body, canonical food, nutrition, allergen, conversation, observation, learning signal or derived shopping row. Idempotent. Never runs in production.

The canonical dataset was authored first (per the DEVWORLD2 pre-implementation halt) and is committed at `data/development_world/development_world_foundation_50.v1.json` (world version `1.0.0`, `clock: reset-relative`, `accountDomain: dev.thehealthyapples.dev`, content checksum recorded in the file).

## 2. What was built

A single dev-only, idempotent importer: **`scripts/import-development-world.ts`**.

It follows the exact write-path discipline of the existing Benchmark World seeder (`server/benchmark/world-seeder.ts`) — accounts via `storage.createUser`, households via `storage.createHouseholdForUser`, the second adult via the real invite/accept path `storage.joinHousehold`, preferences/eaters/pantry/planner/diary via the ordinary `storage.*` methods, and evidence via the canonical EL1 orchestrator `recordOutcomeAndDetect`. It shares the Benchmark World's scoped-wipe, DEV-only-no-override and reset-relative-clock guarantees.

Its **one decisive difference** from the Benchmark World seeder — and the whole point of DEVWORLD2 — is that it **references meals, it never authors them** (DEVWORLD2 pre-implementation finding G2). Where the Benchmark seeder calls `storage.createMeal(owner.id, { ingredients: [...] })` per household (creating new per-household recipe rows), DEVWORLD2 resolves each authored `import_key` to the existing founding-cookbook **system meal** (`user_id=0`, `is_system_meal=true`, `acquisition_source_key = "tha_original:THA-###"`) and stores that system meal id on the planner / freezer / evidence rows. System meals are globally visible to every dev account, so a household's cookbook reference is satisfied **without a single meal write**.

### Usage

```
npx tsx scripts/import-development-world.ts                 # import/reset all 50
npx tsx scripts/import-development-world.ts --household DW006
npx tsx scripts/import-development-world.ts --validate-only # resolve refs, write nothing
npx tsx scripts/import-development-world.ts --rollback      # wipe all 50 DEV households
```

## 3. Validation before writing (the mission's hard gate)

Every referenced `import_key` across every household — planner, freezer, diary, evidence and all three cookbook-reference collections — is resolved against the existing system meals **before the first write**. If any reference does not resolve, the import **aborts** and lists the missing keys. This is the mission's *"Validate every recipe_id/import_key against existing system meals before writing"*, and DEVWORLD1 §8 rules 6–7 extended to referential integrity against the live corpus.

**Validation result (this run):**

```
system meals indexed : 500
meal references      : 4711 (328 unique)
unresolved           : 0
✓ every meal reference resolves to an existing system meal
```

328 unique references — matching `manifests/validation_manifest.json` (`validatedRecipeRefs: 328`).

## 4. Import order (per household)

Forced by foreign keys and by production semantics, per DEVWORLD1 §5:

1. **Owner account** — `storage.createUser` (atomically creates household + owner member); profile + dev flags set by direct column update; `subscriptionTier` via `storage.setUserSubscriptionTier`.
2. **Household + partner** — name set; partner attached through `storage.joinHousehold` (real invite path — never a raw membership insert, which would orphan the partner's solo household; BENCHINT2 D11).
3. **Scoped wipe** — household-scoped (planner cascades from weeks; eaters; evidence/signals) then user-scoped, for a total wipe-then-reseed. Scope resolves only from the file's own usernames.
4. *(cold-start households stop here — account + empty household only.)*
5. **Preferences** — `storage.upsertUserPreferences`, including `companionPersonality` (the one owner of the Companion voice) and `healthGoals`/`goalType` (the "goals").
6. **Eaters** — `storage.syncMembersAsEaters` (adults), then `updateHouseholdEater` (adults) / `createHouseholdEater` (children). `hardRestrictions` authored verbatim.
7. **Pantry** — `storage.addPantryItem`.
8. **Planner** — `storage.createPlannerWeeks` (fixed 6×7 canvas) → `addPlannerEntry(dayId, mealType, "adult", systemMealId)` → `setPlannerEntryEaters` from the entry's authored eater names.
9. **Freezer** — `storage.addFreezerMeal` with the resolved system meal id; portions + frozen date authored.
10. **Shopping extras** — `storage.addShoppingListExtra` (authored staples only — **not** the derived shopping list).
11. **Diary** — `storage.createFoodDiaryEntry` (meal *name*, free text) + `upsertFoodDiaryMetrics` (self-report).
12. **Evidence** — `recordOutcomeAndDetect`; a meal subject's `subjectId` is `meal:<systemMealId>`, a swap's is its authored `subjectId`; `occurredAt` backdates to the fixture day-offset. Learning signals emerge from detection here — never seeded.
13. **Stamp** — `storage.setSiteSetting("development_world:<id>:last_reset_at", …)` and `development_world:version`.

## 5. Import counts (full run, all 50 households)

| Entity | Imported | Coverage manifest | Match |
|---|---|---|---|
| Accounts (users) | 96 | 96 | ✓ |
| Households | 50 | 50 | ✓ |
| Eaters | 139 | 140 | ✓ (see gap G-EATER) |
| Pantry items | 775 | 775 | ✓ |
| Planner entries | 1352 | 1352 | ✓ |
| Planner entry eaters | 3834 | — | (derived from authored eater lists) |
| Freezer meals | 4 | — | (2 households × 2) |
| Shopping extras | 245 | — | authored staples |
| Diary entries | 392 | 392 | ✓ |
| Diary metrics | 245 | — | self-report days |
| Evidence events | 343 | 343 | ✓ |
| Learning signals | 0 | — | derived; none reached the bar (see G-SIGNAL) |
| Dev-user-owned meals | **0** | — | ✓ **references only, no recipe body duplicated** |

## 6. Idempotency (proven)

The importer was run, then run again. Database totals were **identical** across both runs — no duplicated accounts, households, eaters, planner entries or evidence:

```
after 1st import : {devUsers:96, devHouseholds:50, eaters:139, pantry:775, plannerEntries:1352, evidence:343, devUserOwnedMeals:0}
after re-run     : {devUsers:96, devHouseholds:50, eaters:139, pantry:775, plannerEntries:1352, evidence:343, devUserOwnedMeals:0}
```

Identity is the deterministic username, not a row id; each run performs a scoped wipe of the resolved accounts + household state and reseeds to canonical state.

## 7. Environment safety (proven)

`NODE_ENV=production` is refused with no override:

```
$ NODE_ENV=production npx tsx scripts/import-development-world.ts --validate-only
Error: DEVWORLD2 import is DEV-only. Refusing to touch a production environment.
```

The scoped wipe deletes only rows belonging to accounts resolved from the file's own `@dev.thehealthyapples.dev` usernames, and never deletes a system meal (`user_id=0`, outside every account scope). Production data is unreachable.

## 8. Honest gaps (authored intent the platform has nowhere to store — never fabricated)

| ID | Gap | Why honest, not faked |
|---|---|---|
| G-MEAL | Recipe bodies, canonical foods, nutrition and allergens are **referenced, never authored**. | The Cookbook owns recipe content; `autoAnalyzeMeal` derives nutrition/allergens. DEVWORLD2 writes none of them — it points at the system meal. |
| G-COOKBOOK | Cookbook **segmentation** (`adoptedMealRefs` / `regularMealRefs` / `discoveryQueueMealRefs`) is validated but **not persisted**. | No schema exists for cookbook segmentation. System meals are globally visible to every dev account, so the cookbook reference is satisfied without a write. DEVWORLD1 §3 #10: the cookbook "is not a table". |
| G-SHOPPING | The **shopping list is not seeded**; `generateShoppingList` is honoured as intent only. | The list is a derived output (planner + freezer → `generate-from-meals`, which also writes `ingredient_sources`). The mission forbids duplicating derived shopping rows. It regenerates on demand. Authored `shoppingExtras` **are** imported (they are not derived). |
| G-PERSONA | `persona.*`, `qualityPurpose`, eater `ageYears`, and the diary `fromPlannerMeal` planner-linkage are written **nowhere**. | None has a schema column. A question about any of them yields an honest gap, exactly as DEVWORLD1 §6 requires (persona is canonical-but-unwritten narrative; `ageYears` is admin-view narrative only). |
| G-DERIVED | `nutrition`, `meal_allergens`, `household_learning_signals`, `platform_observations`, `opportunity_deliveries`, `conversations`, `ingredient_sources` are never authored. | Each is derived or forbidden with exactly one owner (DEVWORLD1 §3.1 / the dataset's own `architectureControls.forbiddenAuthoredFields`). Seeding one would forge intelligence the platform never inferred. |
| G-SIGNAL | **0 learning signals** were produced. | Signals are derived by `detectPatterns` from ≥3 polarised evidence events on one dimension (subjectType+subjectKey) within the window at consistency ≥0.7. Each household's 7 evidence events span distinct meal dimensions, so none clears the bar. This is correct behaviour — signals emerge from detection, are never seeded. |
| G-EATER | **139** eaters seeded vs **140** authored. | The one cold-start household (DW050) is imported as *account + empty household only* (DEVWORLD1 §6.2: `coldStart` ⇒ every content collection empty), so its owner has no eater row yet. The other 139 authored eaters are all seeded. |
| G-PRODUCT | Product / ready-meal references are absent from the dataset. | The dataset's own README records that no stable product-meal export was supplied; the foundation pack references only `tha_original:*` cookbook meals. Carried forward as the dataset authored it. |

## 9. Architecture compliance

- **Reuses production services only** — no parallel schema, no second identity space, no benchmark-specific data pathway. A development-world household is an ordinary household with frozen, referenced content.
- **One owner per fact** — the importer owns no fact; it translates authored strings into one canonical identity via existing services (Principle 7: permitted input-funnelling, not a synchronisation bridge). The YAML/JSON is not read back.
- **No fabricated knowledge** — `knownGaps` are reported, derived/forbidden tables are never written, and unresolved references abort the run rather than being invented.
- **Not an AI implementation** — creates no capability, intent, prompt or context view; it only produces household state that capabilities read.

## 10. Data impact

| Question | Answer |
|---|---|
| Production data affected? | **No.** DEV-only assert with no override; wipe scoped to the `@dev.thehealthyapples.dev` domain. |
| Schema changed? | No. |
| Migration added? | No. |
| Recipe bodies / canonical foods / nutrition / allergens duplicated? | **No** — referenced only; `devUserOwnedMeals = 0`. |
| Rows written | 50 households, 96 accounts, 139 eaters, 775 pantry, 1352 planner entries (+3834 entry-eaters), 4 freezer, 245 shopping extras, 392 diary entries, 245 metric days, 343 evidence events. |

---

*DEVWORLD2 implements the importer the pre-implementation findings deferred: dev-only, idempotent, validates every reference against the existing system meals before writing, reuses the production write paths already proven by the Benchmark World, and references — never duplicates — the founding cookbook.*
