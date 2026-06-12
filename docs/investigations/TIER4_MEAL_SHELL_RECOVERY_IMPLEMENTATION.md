# Tier-4 Meal Shell Recovery — Implementation

**Date:** 2026-06-11
**Type:** Implementation (approved scope: connect existing meal shell architecture as Tier-4)
**Rollback point:** commit `8838d9e` / tag `rollback-tier4-meal-shell-recovery-20260611`
(checkpoint commit capturing the full pre-change working tree, 101 paths;
`git reset --hard rollback-tier4-meal-shell-recovery-20260611` restores everything)
**Predecessor:** `docs/investigations/MEAL_SHELL_LIVE_PATH_VALIDATION.md` (STATUS B — architecture existed but disconnected)

---

## 1. Investigation

### Tier-3 exhaustion point

The exact termination point was the else-branch of the Tier-3 block in
`generateSmartSuggestion` (`server/lib/smart-suggest-service.ts`, formerly lines 567–569):

```ts
} else {
  // Genuinely zero compliant meals for this slot — leave empty.
  console.debug(`[SmartSuggest] No suitable candidates for slot "${slot}" — 0 compliant meals exist`);
}
```

`slotCandidates` stayed `[]`, `chosen` was `undefined`, and the slot was silently skipped.

### Critical design findings

1. **The matcher scores but never hard-filters.** `scoreTemplate()` records diet
   conflicts and excluded ingredients only as score reductions and swap suggestions
   (`remove X` / `X → Y` member changes). Connecting it raw would have surfaced
   non-compliant meals. The Tier-4 adapter therefore enforces the planner's hard
   gates itself, leaving matcher scoring untouched (scope requirement 4).

2. **Apply-time consistency.** When a plan is applied, non-external candidates post
   `Number(candidate.id)` as a mealId; a shell has no meal record, so the shell
   candidate is flagged `isExternal: true` and flows through the existing
   `/api/smart-suggest/auto-import` path, whose compliance gate
   (`isMealCompliantForUser` → `candidateDietExcluded` / `candidateHardExcluded`)
   re-checks the same rules. The Tier-4 adapter pre-applies those exact gates at
   generation time, so a suggested shell can never be silently skipped at apply time.

3. **Slot ingredients are options, not a fixed recipe.** Dropping a non-compliant
   slot option (e.g. `eggs` under an Eggs hard restriction) is the shell
   architecture's documented adaptation mechanism — equivalent to the matcher's
   own `remove X` member changes. Empirical gate probe against the live Cooked
   Breakfast shell (household 44 merged restrictions + Keto profile):
   - removed by hard restrictions: `eggs`, `gluten-free roll`, `gluten-free keto bread roll`
   - removed by Keto diet rules: `sweet potato hash`, `tomato ketchup` (+ the keto bread roll)
   - surviving 10: mushrooms, tomatoes, onions, avocado, asparagus, pork sausages,
     chicken breast, chickpea patty, plant-based sausages, brown sauce
   - assembled candidate passes both whole-candidate gates → also passes apply-time compliance.

4. **`getHouseholdForUser` throws** for users without an active household
   membership and the matcher hits the DB — Tier-4 wraps the call in a cached
   catch-to-empty so the planner can never crash on it (requirement 6).

## 2. Implementation notes

### Execution path — BEFORE

```
Smart Planner button → use-smart-suggest.ts → POST /api/meal-plans/smart-suggest
→ routes.ts:4797 → generateSmartSuggestion()
   per slot: Tier-1 (unused slot-fit) → Tier-2 (unused safe fallback)
           → Tier-3 (controlled repeat) → EMPTY SLOT (terminal)
matchMealsForHousehold(): zero callers (dead code)
```

### Execution path — AFTER

```
Smart Planner button → use-smart-suggest.ts → POST /api/meal-plans/smart-suggest
→ routes.ts:4797 (now passes userId + optional weekId into settings)
→ generateSmartSuggestion()
   per slot: Tier-1 → Tier-2 → Tier-3
           → Tier-4: matchMealsForHousehold(userId, weekId)   [lazy, cached, catch-to-empty]
                     → selectShellRecoveryCandidate(matches, slot, hardExcluded, dietPattern, dietRestrictions)
                     → shell candidate fills slot
           → EMPTY SLOT only when Tier-4 also yields nothing
```

### What was added (all within `server/lib/smart-suggest-service.ts` unless noted)

1. **Import** of `matchMealsForHousehold` + `MealMatch` type (first-ever live caller).
2. **`SmartSuggestSettings.userId` / `.weekId`** — plumbing so the matcher can
   resolve the household and honour planner-week eater diet overrides.
3. **`selectShellRecoveryCandidate()`** (exported) — picks the highest-scoring
   match (matcher output is pre-sorted by its own `fitScore`; first survivor wins)
   that passes, in order:
   - slot fit via the same `SLOT_CATEGORY_MAPPING` boundary Tiers 1–3 use;
   - full member diet compatibility: `match.scoreBreakdown.compatibility === 1`
     (⇔ zero diet conflicts across all household eaters, weekly overrides included
     since the matcher applied them);
   - per-ingredient hard restriction + profile diet pattern filtering of the
     template's slot ingredients (canonical `candidateHardExcluded` /
     `candidateDietExcluded` — the same single-source-of-truth engines as the pool);
   - non-empty compliant ingredient list;
   - final whole-candidate pass through both gates (apply-time parity).
   Returns a `ScoredCandidate` (`id: "shell-<templateId>"`, `source: "Meal Shell"`,
   `dietTypes` = template `compatibleDiets`, `isExternal: true`).
4. **Lazy matcher cache** in `generateSmartSuggestion` — `matchMealsForHousehold`
   is called at most once per generation, only when some slot exhausts Tiers 1–3,
   never when `userId` is absent, and any throw resolves to `[]`.
5. **Tier-4 branch** inside the former terminal else: shell found → fills the slot
   (then flows through the unchanged scoring/selection/explanation code); no shell
   → identical empty-slot behaviour and log line as before.
6. **`server/routes.ts`** — `userId: req.user!.id` and `weekId: body.weekId ? Number(body.weekId) : undefined`
   added to the settings object. No other route changes.

### Deliberate choices

- The shell candidate repeats across multiple exhausted slots of the same kind
  (e.g. 7 breakfasts) — Tier-4 intentionally ignores `usedIds`, mirroring Tier-3
  repeat semantics; a repeated compliant shell beats an empty slot.
- `primaryProtein` is left `null` (a shell offers multiple protein options;
  picking one would be arbitrary and would distort fish/red-meat caps).
- `isExternal: true` so plan-apply persists the shell via the existing auto-import
  + compliance gate; no client changes needed and the apply flow cannot NaN-fail.

## 3. Files changed

| File | Change |
|---|---|
| `server/lib/smart-suggest-service.ts` | +111/−2: matcher import, settings fields, `selectShellRecoveryCandidate()`, lazy matcher cache, Tier-4 branch |
| `server/routes.ts` | +5: pass `userId`/`weekId` into smart-suggest settings |

No schema changes, no migrations, no client changes, no matcher-logic changes,
no scoring-model changes, no new templates.

## 4. Testing results

**Typecheck:** `tsc --noEmit` — no errors in changed files (pre-existing, untouched
errors remain in `seed-meal-shell-templates.ts` and `test-slot-filling-recovery.ts`,
both present before this change).

**Existing suite:** `npm test` — all green: 14/14, 13/13, 12/12, 18/18, 76/76,
planner-compliance 25/25. Zero failures.

**Manual tests** (temporary harness `tmp_tier4_manual_tests.ts`, since deleted;
called the **real** `generateSmartSuggestion` with route-faithful pool prep against
the live database — read-only, no writes):

### Test A — Lilly/Daisy restricted household (PASS)

Household 44 (Lilly: Vegetarian + Gluten-Free/Nuts/Dairy-Free/Eggs/Shellfish/Soy;
Daisy: Mediterranean + Dairy-Free/Eggs), generating user dietPattern Keto,
merged hard restrictions, mealsPerDay 3:

- Tier-4 executed: 7 debug lines `Tier-4 shell recovery for slot "breakfast" — template "Cooked Breakfast"`.
- **All 7 breakfast slots filled** with `Cooked Breakfast` (`id=shell-633`,
  `source="Meal Shell"`, `isExternal=true`) — previously all 7 were empty
  (predecessor investigation: Tier-1/2/3 = 0/0/0).
- Shell ingredients fully compliant: `mushrooms, tomatoes, onions, avocado,
  asparagus, pork sausages, chicken breast, chickpea patty, plant-based sausages,
  brown sauce` — no eggs, no gluten items, no keto-violating items.
- Lunch/dinner slots unchanged (filled by Tiers 1–3 from the normal pool).

### Test B — no suitable shell (PASS)

- **B1:** real matcher output (1 match, Cooked Breakfast fit=88) offered to
  `dinner` and `lunch` slots → `null` both times (no dinner/lunch shell exists) →
  existing empty-slot branch retained.
- **B2 (matcher throws):** `userId=999999` (no household membership →
  `getHouseholdForUser` throws) with an exhausted pool → error caught and logged
  (`Tier-4 shell matcher failed`), **no crash**, breakfast slots left empty (0/7),
  generation completed normally.
- **B3 (no userId):** Tier-4 skipped entirely, 0 shell fills, empty slots —
  pre-change behaviour byte-for-byte.

### Test C — normal household, abundant candidates (PASS)

Unrestricted profile (no dietPattern, no hard exclusions), same user's 117-meal
pool + externals: 21/21 slots filled (breakfast=7, lunch=7, dinner=7),
**0 shell entries, 0 Tier-4 executions** — Tiers 1–3 behave exactly as before.

## 5. Final verification

Definition of done:

1. ✅ Tier-1/2/3 untouched — the change adds code only inside the previously
   terminal else-branch; Test C shows identical behaviour with abundant pools.
2. ✅ Tier-4 executes on exhaustion (Test A: 7 executions).
3. ✅ Cooked Breakfast shell is selected (fitScore 88, highest/only match).
4. ✅ Breakfast slots no longer empty when a valid shell exists (7/7 filled vs 0/7 before).
5. ✅ Slot remains empty when no shell fits (Test B1/B2/B3).

Trust check: restrictions verified enforced — per-ingredient and whole-candidate
gates use the same canonical engines as pool construction and the apply-time
compliance gate (probe + Test A confirm eggs/gluten/keto violations removed).
Matcher failure degrades to empty slot; planner cannot crash on Tier-4.

Data impact: reads existing data only (templates, eaters, overrides, preferences,
swaps); no writes; no meaning changes; no backfill.

## 6. Remaining gaps (observed, out of scope)

- **Post-tier caps can still empty a slot without Tier-4 retry.** The fish/red-meat
  weekly caps and budget filter run *after* the tier cascade; in Test A, lunch
  Thursday–Sunday remained empty because the fish cap drained an otherwise
  non-empty Tier pool. This is pre-existing behaviour, unchanged by this work
  (Tier-4 only replaces the "pool genuinely exhausted" terminal branch).
- Only one populated shell exists (Cooked Breakfast, breakfast). Lunch/dinner
  exhaustion has no shell to recover with until more templates are authored
  (explicitly out of scope: no new templates).
- The client does not currently send `weekId`, so weekly eater diet overrides are
  honoured only if a future client change supplies it; the server plumbing is ready.
- Shell entries render with `source: "Meal Shell"` and the template's (currently
  absent) image; any richer shell presentation (member variants, swaps) is UI work
  outside this scope.

## 7. Scope confirmation

Only the approved Tier-4 connection was implemented: no schema/migrations, no
template editor or planner UI changes, no new shells, no scoring-model changes,
no candidate-pool changes, no dietary-rule changes, and no household-matcher
changes (it compiles and runs as found, scoring intact).
