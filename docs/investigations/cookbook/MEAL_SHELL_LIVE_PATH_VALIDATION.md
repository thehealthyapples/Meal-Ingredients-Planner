# Meal Shell / Component Meal Recovery — Live Path Validation

**Date:** 2026-06-11
**Type:** Execution-trace investigation (no code changes)
**Rollback point:** git tag `rollback-meal-shell-live-path-validation-20260611` at commit `80c5b75`
**Note:** The working tree contained uncommitted modifications at investigation time (including `server/lib/household-meal-matcher.ts`, +41/−28 lines migrating it from `householdMembers` to `householdEaters`). The tag protects committed state only. All traces below were run against the working tree as-is.

---

## Verdict (Question 7)

> **STATUS B — Meal shell architecture exists but is disconnected.**

`matchMealsForHousehold()` and `scoreTemplate()` are fully implemented, the `meal_templates` shell columns exist, one populated shell (Cooked Breakfast) is seeded and active in the live database — and **nothing in any live execution path ever calls any of it**. The Smart Planner's generation pipeline (`generateSmartSuggestion`) has no Tier-4, no template query, and no import of the matcher module. For the exact household scenario the architecture was designed for (Lilly + Daisy, breakfast), the live planner produces **zero candidates at all three tiers and leaves the slot empty**, while the one shell template that would have solved it sits unqueried.

---

## Question 1 — Is `matchMealsForHousehold` referenced anywhere in live execution?

**NOT CALLED.**

Repo-wide search (server, client, shared; node_modules excluded) for `matchMealsForHousehold`:

| File | Line | Nature |
|---|---|---|
| `server/lib/household-meal-matcher.ts` | 159 | **Definition** (`export async function matchMealsForHousehold`) |

That is the only occurrence. No route, service, hook, or script imports it. A search for the module path `household-meal-matcher` finds exactly one other reference — a **comment** in `server/seeds/seed-meal-shell-templates.ts:276` ("Uses the same logic as household-meal-matcher.ts:scoreTemplate() but without…"), which explicitly re-implements the logic rather than calling it.

**Caller chain: none exists.** The function is exported dead code.

Notably, the uncommitted working-tree changes show the matcher is still being actively *developed* (migrated to the `householdEaters` table, weekly diet overrides added via `plannerWeekEaterOverrides`) — but no caller was added.

## Question 2 — Can Smart Planner ever execute `scoreTemplate()` during normal planner generation?

**No. Structurally impossible.**

`scoreTemplate()` (`server/lib/household-meal-matcher.ts:243`) is a **non-exported, module-private function**. Its only caller is `matchMealsForHousehold()` at `household-meal-matcher.ts:233`. Since Q1 establishes `matchMealsForHousehold` has no callers, `scoreTemplate` is unreachable from any entry point.

Actual Smart Planner execution path, traced end to end:

```
Smart Planner button
  client/src/components/PlannerAssistantPanel.tsx:352
    (data-testid="button-run-smart-suggest", onClick=onRunSmartSuggest)
→ client/src/hooks/use-smart-suggest.ts:191 (and :282 for re-runs)
    POST /api/meal-plans/smart-suggest
→ server/routes.ts:4797
    app.post('/api/meal-plans/smart-suggest', ...)
    • storage.getMeals(userId)                 — user's saved meals only
    • source-type / component / premium gates
    • household eater merge (hard restrictions ∪ diet types)
→ server/routes.ts:4950
    generateSmartSuggestion(userMeals, mergedPrefs, settings, ...)
→ server/lib/smart-suggest-service.ts:315
    generateSmartSuggestion()
    • candidate pool = filtered saved meals + fetchExternalCandidates()
    • per-slot selection: Tier-1 → Tier-2 → Tier-3 → empty
```

`smart-suggest-service.ts` imports only: `external-meal-service`, `meal-scoring-service`, `explainability-service`, `restriction-resolver`, `dietRules` (lines 1–7). No import of `household-meal-matcher`, no reference to templates of any kind. The only other generation-adjacent route, `POST /api/smart-suggest/auto-import` (`routes.ts:4965`), imports external candidates and also never touches the matcher.

## Question 3 — Does any planner generation path query `meal_templates` for component meals?

**No.** Every reference to the searched symbols, with classification:

| Symbol | File:Line | Live planner path? |
|---|---|---|
| `mealTemplates` | `server/lib/household-meal-matcher.ts:7,222–223` (the only *shell-aware* query: `select ... from mealTemplates where isActive`) | **No — dead code (Q1)** |
| `mealTemplates` | `server/storage.ts:926–951` (generic template CRUD: `getMealTemplates`, `getMealTemplateById`, etc.) | No — admin/CRUD plumbing, not called by smart-suggest route or service |
| `mealTemplates` | `server/template-migration.ts:18–30` | No — one-off name-dedup migration |
| `meal_templates` (SQL) | `server/seeds/seed-meal-shell-templates.ts:106,141,213,258,270` | No — seed script (`npm run seed:meal-shells`), not runtime |
| `meal_templates` (SQL) | `server/migrations/runner.ts:539–564` (`2026-03-15_extend_meal_templates`: adds shell columns) | No — schema migration only |
| `mealTemplates` | `shared/schema.ts:48,98,805,841` | Schema definition only |
| `matchMealsForHousehold` | `household-meal-matcher.ts:159` | Definition only (Q1) |
| `scoreTemplate` | `household-meal-matcher.ts:233,243`; simulated in `seed-meal-shell-templates.ts:275–330` | No (Q2); seed simulation is offline verification |
| `sharedBaseComponents` / `proteinSlots` / `carbSlots` / `vegSlots` / `toppingSlots` / `compatibleDiets` | Files: `shared/schema.ts`, `server/lib/household-meal-matcher.ts`, `server/seeds/seed-meal-shell-templates.ts` — **only** these three | No live path touches the slot fields |

`smart-suggest-service.ts` contains **zero** matches for any of these symbols, nor for "template", "shell", or "component meal".

## Question 4 — Is Tier-4 recovery currently active?

**No Tier-4 exists. Answer: first B (controlled repeat), then C (empty slot).**

The complete tier cascade in `generateSmartSuggestion` (`server/lib/smart-suggest-service.ts`):

1. **Tier-1** (line 544): unused candidates with strict slot fit via `getCandidateSlotFit` / `SLOT_CATEGORY_MAPPING` (line 234: breakfast → `["breakfast","smoothie"]`).
2. **Tier-2** (line 550): `getSafeFallbackCandidates` (line 272) — unused category-adjacent meals; for breakfast, still only `breakfast`/`smoothie` categories.
3. **Tier-3** (line 563): `getRepeatCandidates` (line 301) — relaxes only the "not yet used" constraint; this is the controlled-repeat fallback added in commit `1e83f32`.
4. **After Tier-3** (line 567–568): if still empty —

```ts
} else {
  // Genuinely zero compliant meals for this slot — leave empty.
  console.debug(`[SmartSuggest] No suitable candidates for slot "${slot}" — 0 compliant meals exist`);
}
```

`slotCandidates` stays `[]` and the slot is left **empty**. There is no further branch. Grep for `Tier-4`, `tier4`, `component meal`, `mealShell`, `template` in `smart-suggest-service.ts` returns nothing. So for a household that exhausts Tiers 1–3:

- If Tier-3 has any compliant meal: **B — controlled repeat**.
- If even Tier-3 is empty (zero compliant meals for the slot): **C — empty slot**.
- **A — component meal recovery: never.** The planned Tier-4 was never wired in.

## Question 5 — Are the meal shell templates actually available?

Queried the live database directly (2026-06-11). The shell columns are `text[]` (per `\d meal_templates`); "populated" = any of `protein_slots`/`carb_slots`/`veg_slots`/`topping_slots`/`sauce_slots` non-empty.

| Metric | Count |
|---|---|
| Total `meal_templates` rows | **638** |
| Populated shell templates | **1** |
| Populated **breakfast** shells | **1** |
| Populated **dinner** shells | **0** |

The single populated shell:

| id | name | category | is_active | protein | carb | veg | topping | sauce | base | compatible_diets |
|---|---|---|---|---|---|---|---|---|---|---|
| 633 | Cooked Breakfast | breakfast | true | 5 | 3 | 0 | 0 | 2 | 5 | Vegetarian, Gluten-Free, Dairy-Free, Mediterranean, Low-Carb, Keto |

The other 637 rows are legacy name-only templates (from `template-migration.ts` dedup) with all slot columns NULL. The matcher's query (`where isActive = true`) would fetch all active rows, but `scoreTemplate` returns null for templates with empty slots — so in practice exactly **one** template could ever produce a match, and only for breakfast.

## Question 6 — Dry-run trace: Lilly + Daisy breakfast generation

**Setup (live data):** household 44 (`colinclapson@hotmail.co.uk's Household`), generation runs as user 1 (dietPattern **Keto** — passed by the route as `settings.dietPattern` and enforced as a hard pool filter). Eaters confirmed in DB:

- **Lilly** — diets `[Vegetarian]`, hard restrictions `[Gluten-Free, Nuts, Dairy-Free, Eggs, Shellfish, Soy]`
- **Daisy** — diets `[Mediterranean]`, hard restrictions `[Dairy-Free, Eggs]`

Merged hard-exclusion set applied to the pool: `gluten-free, nuts, dairy-free, eggs, shellfish, soy`.

**Method:** temporary script (`server/tests/tmp_meal_shell_dryrun.ts`, deleted after the run) replicating the route's pool prep verbatim and calling the service's real exported filter functions (`candidateHardExcluded`, `candidateDietExcluded`, `convertMealToCandidate`, `fetchExternalCandidates`/`enrichExternalCandidates`) against the live DB and live external API, then applying the tier filters exactly as written in `smart-suggest-service.ts`. Fidelity caveat: the unexported drink/alcohol secondary checks (`isAlcoholicCandidate`/`isDrinkCandidate`) were not applied; in the real service they remove 5 more (drink-category) candidates, none of which are breakfast — results below are therefore an upper bound and the breakfast counts are exact.

**Pool construction results:**

- 207 saved meals → 117 after route gates (drinks, source-type, component, premium)
- Exclusions during candidate conversion: 82 hard-restriction, 23 diet-pattern (Keto), 3 no-ingredients-under-restriction, 1 ready-meal-product
- External: 170 enriched candidates fetched, 12 survived the same filters
- **Final pool: 20 candidates** (15 after the in-service drink checks) — categories: dinner ×10, lunch ×4, drink ×5, null ×1. **Breakfast/smoothie: 0.**

**Breakfast slot tier counts (week start, empty `usedIds`):**

| Tier | Candidates |
|---|---|
| After Tier-1 (unused, slot-fit) | **0** |
| After Tier-2 (unused, safe fallback) | **0** |
| After Tier-3 (controlled repeat) | **0** |

Outcome per `smart-suggest-service.ts:568`: breakfast slot is left **empty for all 7 days**.

**Would Tier-4 ever execute? NO** — for two independent reasons:

1. **It does not exist.** There is no code after the Tier-3 else-branch; the cascade terminates at "leave empty" (Q4).
2. Even as a thought experiment, this is precisely the scenario Tier-4 was designed for: the pool genuinely exhausts (0 breakfast candidates survive the merged Vegetarian/Keto + 6-restriction filter), and the one populated shell — **Cooked Breakfast, id 633, whose `compatible_diets` covers every requirement of both Lilly and Daisy** (Vegetarian, Gluten-Free, Dairy-Free, Mediterranean, Keto) — is active in the database and is never queried.

## Question 7 — Final verdict

**STATUS B — Meal shell architecture exists but is disconnected.**

Supporting summary:

- The matcher module is complete, compiles, and is even receiving active uncommitted development (householdEaters migration) — but has zero callers (Q1, Q2).
- No planner path queries `meal_templates` for component meals; only seeds, migrations, and dead code touch the shell columns (Q3).
- The live planner's fallback chain was extended with Tier-3 controlled repeat (commit `1e83f32`) instead of connecting Tier-4 component recovery; exhaustion now terminates at "empty slot" (Q4).
- Exactly one usable shell exists in production data (Cooked Breakfast, breakfast, active) — seeded and verified offline, never read at runtime (Q5).
- The live dry-run for the target household produces 0/0/0 breakfast candidates across all tiers and seven empty breakfast slots, while the compatible shell sits unused (Q6).

It is not STATUS A (nothing executes it), not STATUS C (no partial connection exists — zero runtime references), and not strictly STATUS D (the architecture was never wired in to be bypassed; newer planner logic — Tier-3 — grew *around* the gap rather than replacing a connection that once existed).

*Investigation only — no fixes, designs, or recommendations included per scope.*
