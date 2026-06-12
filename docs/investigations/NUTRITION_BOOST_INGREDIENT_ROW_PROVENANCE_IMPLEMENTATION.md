# NUTRITION_BOOST_INGREDIENT_ROW_PROVENANCE_IMPLEMENTATION

Implements Option B from `NUTRITION_BOOST_INGREDIENT_ROW_PROVENANCE_MATCH_INVESTIGATION.md`:

- **Fix A** — immediately cache accepted `meal_uplift_applications` from the `POST /api/uplift/accept` response
- **Fix B** — show "Added via Nutrition Boost" + Remove directly on the visible meal ingredient rows, backed only by persisted accepted application rows

Date: 2026-06-11

---

## IMPLEMENTATION STATUS

**COMPLETE** — both fixes implemented, typecheck clean, server contract verified end-to-end against the running dev server (16/16 automated API checks passed). Browser click-through of the UI steps remains for the user to confirm (no authenticated browser session available to the agent); the rendering path is the only part not machine-verified.

## ROLLBACK IDENTIFIER

- Commit: `43fbdda` — `checkpoint: pre-nutrition-boost-provenance rollback point`
- Tag: `rollback-pre-boost-provenance`
- To restore: `git reset --hard rollback-pre-boost-provenance` (discards the implementation working-tree changes too: `git checkout -- .` first if needed)

Note: git status was **not clean** before work. Pre-existing unrelated changes (`server/lib/smart-suggest-service.ts`, `server/routes.ts`, the investigation doc) were included in the checkpoint commit so the rollback point captures the exact pre-implementation state. `server/tests/tmp_tier4_manual_tests.ts` was listed in the initial status snapshot but no longer existed on disk.

## FILES CHANGED

| File | Change |
|------|--------|
| `client/src/components/MealUpliftPanel.tsx` | Fix A — POST response type + immediate applications cache write; exported `SHOPPING_LIST_KEYS` |
| `client/src/pages/weekly-planner-page.tsx` | Fix B — dialog-level provenance query, dialog-level remove mutation, ingredient row label + Remove |
| `server/tests/tmp_boost_provenance_api_test.ts` | NEW, temporary — automated API verification script (self-cleaning; safe to delete) |

No server, schema, or migration changes.

## EXACT CHANGES

### Part 1 — `client/src/components/MealUpliftPanel.tsx`

1. **Line 50** — `SHOPPING_LIST_KEYS` is now exported so the dialog-level remove mutation reuses the identical invalidation set instead of duplicating it.

2. **Lines ~176–182** (`acceptMutation` return cast) — added the field the server already sends:

```ts
return res.json() as Promise<{
  mealId: number;
  forkedFromMealId: number | null;
  added: string[];
  applications: MealUpliftApplication[];   // ← added
}>;
```

3. **Lines ~255–273** (`onSuccess`, after the fork meals-cache write, before the invalidations) — immediate cache seed:

```ts
const acceptedApplications = (data.applications ?? []).filter(
  (a) => a.status === "accepted"
);
if (acceptedApplications.length) {
  qc.setQueryData<MealUpliftApplication[]>(
    ["/api/meals", data.mealId, "uplift-applications"],
    (old = []) => [
      ...old.filter((a) => !acceptedApplications.some((n) => n.id === a.id)),
      ...acceptedApplications,
    ]
  );
}
```

Only `status === 'accepted'` rows are written because `GET /api/meals/:id/uplift-applications` returns accepted rows only — the cache keeps the exact shape the GET would produce, so the later server-confirmation refetch cannot change what the user sees. `duplicate_skipped` rows from the POST response are never cached (they would otherwise leak into the panel's `status !== "removed"` filter). Existing invalidation behaviour after the write is unchanged; the GET remains the server confirmation path.

### Part 2 — `client/src/pages/weekly-planner-page.tsx`

1. **Imports** — added `SHOPPING_LIST_KEYS` (line 44) and `MealUpliftApplication` type (line 50).

2. **Lines 769–815** — dialog-level provenance query + remove mutation (placed with the other dialog-level queries next to `entryEaters`):

- Query key is identical to MealUpliftPanel's: `["/api/meals", mealDetailMealId, "uplift-applications"]` where `mealDetailMealId = mealDetail?.meal.id`. Because `handleUpliftAccepted` already rewrites `mealDetail.meal.id` to the fork id on accept, this key always targets the effective (user-owned) meal and shares the cache entry Fix A seeds — provenance appears with zero additional latency and zero extra network calls.
- `enabled: !!mealDetail && !mealDetailMealIsSystem` — system meals are skipped because the endpoint 403s for them and they can never own application rows. This does **not** loosen authorisation; it just avoids firing a guaranteed-403 request. Server auth untouched.
- `removeBoostFromDialogMutation` — `DELETE /api/uplift/applications/:id`, then invalidates: uplift-applications (current meal), `/api/meals`, `/api/planner/full`, and the four shared `SHOPPING_LIST_KEYS`. Error → destructive toast.

3. **Lines ~3664–3745** (ingredient list render) — provenance lookup + row UI:

- `boostByIngredient: Map<string, MealUpliftApplication>` built from `mealDetailApplications`, **filtered to `status === "accepted"`**, keyed by `ingredient.toLowerCase().trim()` (the same safe matching already used in MealUpliftPanel).
- In the plain-bullet branch only (household-safe substitution rows are untouched), each ingredient is looked up with `ing.toLowerCase().trim()`. On a match the row renders with an emerald bullet, the ingredient text, and beneath it:
  - `Added via Nutrition Boost` label (`data-testid="ingredient-boost-label-{appId}"`)
  - `Remove` button (`data-testid="ingredient-boost-remove-{appId}"`) wired to `removeBoostFromDialogMutation`, with spinner while pending.
- No match → the exact pre-existing plain row markup. Provenance is **never** inferred from the ingredient name alone — it renders only when a persisted accepted application row matches.

### Part 3 — fork/system meal handling (no code change needed beyond the above)

- Pre-fork system meal: dialog query disabled (no 403 spam), no provenance shown — correct, no rows exist.
- On accept: server forks; panel calls `onUpliftAccepted(forkId)` → `handleUpliftAccepted` sets `mealDetail.meal.id = forkId`; the dialog query key flips to the fork and immediately hits the Fix A cache seed. Existing `onMealForked` planner/meals cache rewrites are untouched.
- GET for system meals still 403s (verified below). Server authorisation unchanged.

## MANUAL TEST RESULTS

**Automated API verification** — `server/tests/tmp_boost_provenance_api_test.ts` run against the live dev server with a throwaway beta user (created and deleted by the script): **16/16 passed**.

| Check | Result |
|-------|--------|
| POST accept returns 201 with `applications` array | ✓ |
| Application row `status: 'accepted'` for `pumpkin seeds` | ✓ |
| Ingredient added to meal | ✓ |
| GET uplift-applications returns the persisted row (close/reopen path) | ✓ |
| DELETE → `ingredientRemoved: true` | ✓ |
| Pumpkin seeds removed from meal; `pasta` / `tomato sauce` untouched | ✓ |
| GET after delete no longer returns the row | ✓ |
| `cannellini beans` accepted with application row | ✓ |
| GET uplift-applications for a system meal → 403 (auth unchanged) | ✓ |
| System-meal accept forks; applications keyed by fork id | ✓ |
| GET on fork returns accepted row | ✓ |

**TypeScript**: `npx tsc --noEmit` — zero errors in the two changed files (only pre-existing errors in untouched `server/seeds/` and `server/tests/` files).

**Browser click-through (steps 1–12 from the brief)**: NOT machine-executed — the agent has no authenticated browser session (registration is closed in dev). The server side of every step is verified above; the remaining unverified surface is purely the JSX rendering, which is typechecked and follows the existing row markup. Please run the 12 steps once in the browser to confirm visually.

## DATA IMPACT

- Reads existing data: YES
- Writes new data: YES — during testing only: the verification script created one temp user, one temp meal, one system-meal fork, and uplift application rows through the real register-equivalent/accept/remove flows, then **deleted all of them** (user 124, meals 2230/2231 — confirmed removed). No residual data.
- Changes meaning of existing data: NO
- Requires backfill: NO
- Schema changes: NO

## TRUST CHECK

- **Could this mislead the user?** The label renders only from a `boostByIngredient` map built from `status === "accepted"` rows returned by the server (or seeded verbatim from the server's POST response). Ingredient name alone can never produce a label.
- **Could this fabricate certainty?** The POST cache seed contains only rows the server just persisted and returned; it is filtered to `accepted` so it is byte-equivalent to what the confirmation GET returns. No optimistic invention.
- **Is anything guessed but shown as real?** No. If the applications query is disabled (system meal), errored, or empty, every ingredient renders as a plain bullet with no label and no Remove.
- **What happens if the system is wrong?** Fail-safe: missing/unmatched application row → normal ingredient row, no provenance UI. A stale label after an external removal self-corrects on the next GET (30 s staleTime + invalidations).

## REMAINING RISKS

1. **Visual confirmation pending** — the row UI has not been seen in a browser; layout within the two-column ingredient grid should be eyeballed once (label/Remove wrap under the ingredient text by design).
2. **Latent matching asymmetry (pre-existing, unchanged)** — if a future uplift rule stores `application.ingredient` with embedded quantity text, `.toLowerCase().trim()` won't match the meal-ingredient string and the label silently won't show (fail-safe direction). Noted in the investigation as Finding 4; out of scope here.
3. **Stale provenance window** — between an accept in the panel and the dialog query's refetch, the label relies on the cache seed. If a second device removed the boost meanwhile, the label could show for up to one refetch cycle before disappearing. Low impact, self-correcting.
4. **`[BOOST-PROOF]` console logs** — the investigation's diagnostic logging is still in both files. Left intentionally (scope lock: no unrelated cleanup).

## SUGGESTIONS ONLY

*(not implemented — listed for future consideration)*

1. Remove the `[BOOST-PROOF]` console.log instrumentation now that the root cause is fixed and verified.
2. Unify the panel's provenance filter (`status !== "removed"`) with the list's (`status === "accepted"`) into one shared helper.
3. Apply the server's `normaliseIngredientForDedupe` on the client (shared module) to close the latent quantity-prefix matching asymmetry.
4. Delete `server/tests/tmp_boost_provenance_api_test.ts` once the browser confirmation is done, or promote it to a permanent `test:boost-provenance` npm script — it is self-cleaning and re-runnable.
5. Consider seeding the meals cache for the non-fork (user meal) accept path too, so the ingredient itself also appears without waiting for the `/api/meals` refetch (the fork path already does this).
