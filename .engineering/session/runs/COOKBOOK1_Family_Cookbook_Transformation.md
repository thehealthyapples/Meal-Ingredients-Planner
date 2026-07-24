# COOKBOOK1 — Family Cookbook Transformation

**Commit:** `e3cd4a8e` (pushed to `int1-intelligence-platform`)
**Rollback identifier:** `rollback/COOKBOOK1-family-cookbook-transformation-20260720` → `d03e77ff`
**Tree state at tag time:** one tracked file modified (`.engineering/session/CURRENT.md`, the automated Stop-hook heartbeat line). The tag does not cover it. No other uncommitted work existed.
**Report:** `docs/implementation/cookbook/COOKBOOK1_FAMILY_COOKBOOK_TRANSFORMATION.md`

---

## Mission

Make the Cookbook feel like a treasured family cookbook rather than a generated recipe catalogue, judged against the Experience Constitution (`GOVERNING_EXPERIENCE_ARCHITECTURE.md`) and `EXPREVIEW1` § 6.

Preserve: canonical food ownership · meal ownership · planner architecture · intelligence platform. Introduce no duplicate models or ownership.

## The finding

EXPREVIEW1 read the room as a content problem — five hundred generated recipes, one named *"Rice Bowl 2"*. The actual defect was one layer down:

> **Nothing in THA owned the distinction between an authored recipe and a generated one.**

All 500 rows of the founding import carry `acquisition_type: "authored"`, including the 490 emitted from a template. `meals-page.tsx` then held a *private* `getMealDisplayCategory()` returning `"tha_meals"` for all of them, under a private label reading **"Wholefood Suggestions"**. A GEA17 violation (presentation owning a fact) with a GEA18 violation behind it.

## What was done

- **`shared/cookbook/curation.ts` (new)** — the single owner of shelving. Splits the founding import into `kitchen` (10 authored) and `library` (490 generated). Verified against the live DB: 10 / 490 / 384-not-recipes.
- **Retired in the same change (GEA18):** `getMealDisplayCategory`, `SECTION_LABELS`, `MEAL_CATEGORY_ORDER`, `sectionCounts`, the in-card tab strip, the six-icon `MealActionBar` on the grid card (**a pure duplicate of `CardActionsMenu`** — no capability lost), the images-first sort, `cardInfoTabs`.
- **The room:** library demoted behind an explicit door (not deleted, still searchable, still planner-reachable); 4:3 image with the name beneath it instead of printed across it; shelves named not counted; `"Show more (501 remaining)"` → `"More recipes"`.
- **Machine signals removed:** the `Wand2` placeholder (49 → 1 in the room); "Generate AI image" → "Illustrate this recipe"; "AI will extract…" rewritten.
- **`scripts/repair-cookbook-recipe-names.ts` (new)** — repaired 506 capitalisation defects (dev DB + source data); **refuses** to strip the 127 collision integers, because stripping produces identical names and would hide the finding.

## Measured

| | Before | After |
|---|---|---|
| Shelf header | `Wholefood Suggestions· 500` | `From the THA kitchen` |
| Card controls (48 cards) | 528 (11/card) | 96 (2/card) |
| Magic-wand glyphs | 49 | 1 (labelled "Build") |
| Counts above shelves | 1 | 0 |

typecheck:ci — no new regressions (16 pre-existing at `d03e77ff`, byte-identical after). Build OK. cbk1 37/37 · surf1c1 81/81 · planner-compliance 25/25 · rm4 21/21 · intelligence-platform 33/33 · intelligence-meals-binding 72/72.

Evidence: `docs/ui-audit/cookbook1-family-cookbook/`

## Two things this change does NOT claim

1. **There is still no photograph of food in the room.** The card can now hold one well; it has none, because the founding cookbook has zero images. Ten empty plates with good names beats five hundred with bad ones, and is not the finished room.
2. **43 generated recipes sit in households' OWN cookbooks** — `meal-service.ts` copies starter meals in at onboarding, so `shelfForMeal` shelves them as *"Your recipes"*. Their names were repaired; re-shelving them was not done, because it is an ownership question.

## Next action

Owner to review `docs/implementation/cookbook/COOKBOOK1_FAMILY_COOKBOOK_TRANSFORMATION.md` § 8 — six decisions, of which the load-bearing three are: **delete or keep the 490**; **commission photography**; **correct the provenance and persist the classification** (needs a reviewed migration in `server/migrations/runner.ts`, the only sanctioned schema route). Also: run the name repair against **production** — it ran against the disposable dev DB only.
