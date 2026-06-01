# PHASE 5A SMART PLANNER RESTRICTION FILTER IMPLEMENTED: YES

**SMART PLANNER FLOW REVIEWED: YES**

## Rollback identifier
- **Tag:** `rollback-phase5a-smartplanner` → `f4cb474a4cbfb64564ea72f3972bdc0721243ff2`
- This is a `git stash create` snapshot of the **dirty working tree** (status was *not* clean at start — pre-existing Phase 3/4 restriction work and other modified files were already present). The working tree was left untouched.
- **Base commit:** `a77f546`
- Restore with: `git stash apply f4cb474` (or `git checkout f4cb474 -- <path>` for specific files).

## Smart Planner flow reviewed
- `server/lib/smart-suggest-service.ts` — `isHardExcluded()` (old: `allText.includes(exc.toLowerCase())` over name+ingredients joined), applied at both the user-meal loop (`:193`) and external-candidate loop (`:217`).
- `/api/meal-plans/smart-suggest` (`server/routes.ts:~4801–4862`) — collects each eater's `hardRestrictions`, unions them into `mergedExcludedIngredients`, and assigns to `settings.hardExcludedIngredients`.
- Existing tests: `test-smart-suggest-tailoring.ts` (has its own local raw `isHardExcluded` copy — untouched/unaffected by this change).
- Reference pattern: `routes.ts` already does canonical-resolver-with-fallback for uplift via `upliftIngredientConflictsWithRestrictions()` (`:91`). Mirrored it.

## Files changed
- `server/lib/smart-suggest-service.ts` — resolver integration (the only behaviour change).
- `package.json` — added `test:smart-suggest-restrictions` script.
- `server/tests/test-smart-suggest-restrictions.ts` — **new** test file (28 assertions).

## Resolver integration
- Added imports of `resolveActiveRestrictions` / `resolveIngredientRestrictions` and the `RestrictionDefinition` type from `@shared/restrictions/restriction-resolver`.
- `generateSmartSuggestion` now pre-resolves `activeRestrictionDefs = resolveActiveRestrictions(hardExcluded)` **once** and passes it to both `isHardExcluded` call sites (efficiency; same pattern as the uplift route).
- `isHardExcluded` now runs the resolver **per field** (meal name + each ingredient individually, not the joined string) — deliberate, so forward-substring derived/hidden matching can't accidentally match across the boundary between two unrelated ingredients.
- Catches derived + hidden ingredients: sesame→tahini/sesame oil/hummus, soy→tofu/miso/tamari, peanut→peanut butter/satay sauce, gluten→couscous/soy sauce, dairy→cheese/yoghurt, etc. Legacy `nut_free` expands to peanut + tree_nut via the resolver's `LEGACY_ALIAS_EXPANSIONS`.

## Custom restriction fallback
- `customRestrictionMatches()` preserves the **exact** pre-Phase-5A conservative substring behaviour (over the joined name+ingredients text) for restrictions the canonical library does not recognise (e.g. "kiwi", "banana", "red meat").
- Restrictions already handled by the resolver are **skipped** in the fallback (matched by id/alias against `activeRestrictionDefs`), so the loose substring check can never re-introduce a word-boundary false positive the resolver protects against (e.g. "soy" can't re-match "savoy").
- Kept the fallback as substring (not word-boundary) to avoid unsafe false negatives on a safety filter, matching the established `routes.ts` fallback.

## Tests added/updated
New `test-smart-suggest-restrictions.ts` exercises `candidateHardExcluded()` — the exact predicate the planner applies — covering all 12 required scenarios plus extras (28 assertions, all passing): sesame→tahini/sesame oil/hummus; soy→tofu/miso/tamari; soy ≠ savoy cabbage; peanut→satay sauce/peanut butter; nut_free→peanut + tree nut + pesto; coeliac/gluten still work; dairy still works; custom kiwi/banana still block; no-restrictions excludes nothing.

Exported a small testable helper `candidateHardExcluded(name, ingredients, hardExcluded)`; the internal `isHardExcluded(candidate, hardExcluded, defs)` signature is otherwise unchanged in spirit.

## Compatibility verification
- `test:restriction-resolver` — 255 passed
- `test:substitution-rules` — 132 passed
- `test:restriction-safety` — 65 passed
- `test:uplift` — 45 passed
- `test:smart-suggest-tailoring` — 14 passed (unaffected; uses its own local matcher)
- `test:smart-suggest-restrictions` — 28 passed

## Data impact
- Reads existing data: yes. Writes new data: no. Changes meaning of existing data: **yes** — the planner now treats canonical derived/hidden ingredients as restricted (more meals filtered out than before). Requires migration: no. Requires backfill: no. No schema/DB/UI changes.

## Trust check
1. **Could this mislead users?** No new claims are made; it removes more unsafe meals from suggestions. Strictly fewer false negatives.
2. **Could this fabricate certainty?** No — no "household-safe" badge or guarantee was added; this is exclusion logic only.
3. **What if a restriction is unknown?** Falls through to conservative substring matching (preserved behaviour); it still blocks.
4. **What if canonical resolution fails?** Resolver functions never throw and return `[]` on unrecognised input; the custom fallback then applies. Empty restrictions → nothing excluded.
5. **Safer than raw substring?** Yes — deterministic, catches derived/hidden ingredients, and respects word boundaries (soy ≠ savoy) while keeping the conservative fallback.

## Build result
- `npx tsc --noEmit` — exit 0 (clean).
- `npm run build` — exit 0; client + server bundle succeeded (confirms `@shared` alias resolves under esbuild).

## Manual test result
TASK E behaviours were verified deterministically through the new test suite, which calls `candidateHardExcluded()` — the identical predicate `generateSmartSuggestion` applies to every user and external candidate. All scenarios (sesame→tahini/hummus/sesame-oil; soy→tofu/miso/soy-sauce but not savoy; peanut→satay/peanut-butter; nut_free→peanut + tree nut; custom restriction; no restrictions) pass.

**Not done:** Did not exercise the live `/api/meal-plans/smart-suggest` HTTP route against a seeded household database (that needs a running server + DB + real eater records, and risks side effects outside approved scope). The filtering logic itself is fully covered by the unit tests against the exact predicate.

## Remaining risks
- The custom-restriction fallback remains plain substring, so an unusual short custom string could in principle over-match inside a longer word (e.g. custom "rice" matching "liquorice"). This is unchanged from before and only affects non-canonical user strings; erring toward over-exclusion is the safe direction for an allergy filter.
- Resolver coverage is bounded by the canonical library (Phase 3 allergens). Allergens not yet in the library (fish, celery, etc.) rely on the substring fallback until added in a later phase.
- No schema changes were needed, so implementation did not stop.
