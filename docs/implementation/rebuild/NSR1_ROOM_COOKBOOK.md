# NSR1 Phase 2 — Cookbook (craft wave)

**Room:** Cookbook — `/cookbook`,`/meals` → `client/src/pages/meals-page.tsx`
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Owners:** UIOWN1 §5 (Cookbook — owns no nutrition verdict; Domain 1 owns knowledge) · CRAFT1 §3–6 · GEA8/9/13/16

## Design (architecture first)
The Cookbook is the household's living recipe book — a warm shelf you open, not a search index or an
analysis dashboard. It reports what a meal *is*; it never grades a meal or advises on it (that is the
Companion's, GEA8/9). COOKBOOK1 already rebuilt the browse/shelf experience to standard; this pass
removes the analysis-surface residue that still scored and counselled.

## Changes (presentation-only)
1. **Removed the `HealthScoreRing`** — a 0–100 grade with a red/amber/green traffic light (its own
   `#22c55e/#f59e0b/#ef4444`, off-palette). A verdict on a meal is exactly what **GEA13** forbids
   (*does this measure the food or grade the household?* — a 0–100 ring grades); UIOWN1 §5 records the
   Cookbook owns no nutrition verdict. Component and its render both deleted; nutrition facts stand alone.
2. **Removed the "Healthier Alternatives" swaps surface and the "this meal already uses great
   ingredients" line** — healthier-ingredient advice and any meal verdict are the Companion's
   (**GEA8/9/21**; rooms report, the Companion counsels). Allergens (safety) and the neutral
   "no common allergens detected" fact are kept.
3. **Muted the nutrient-icon rainbow** — six semantic colours (orange/red/amber/yellow/pink/blue) on
   Calories/Protein/… → one calm `text-muted-foreground` register (**CRAFT1 §3** — one coherent hand,
   not a dashboard), in both `NutritionBadges` and `AnalysisResultContent`.
4. **Removed the cascading grid stagger** (`delay: index * 0.03/0.02`, 3 sites) — a whole-grid fade
   cascade on every filter/search keystroke is decorative motion; **CRAFT1 §3** makes stillness the
   default. A gentle single-duration fade remains.

## Not done — routed to owners (per case-by-case scope)
- **Packaged-goods / barcode product-analysis sub-room** (Nutri-Score/NOVA/`thaRating`) — product
  analysis is Domain 19 (UIOWN1 §5/§7); relocating it out of the Cookbook is an owner/backend decision.
- **Whether the "Analyse" (health-scoring) endpoint should exist at all** — server-computed; the field
  remains, only its *grade visualisation* was removed. Owner call.
- **Food photography** (the room still has zero images) — commissioned/licensed imagery; owner item.

## Verification
- `tsc --noEmit`: 0 errors in `meals-page.tsx`. Diff: **47 insertions / 76 deletions** (net −29).
- No test/e2e asserts the removed strings (`data-testid="text-health-score"` was the ring's only hook).
- Live visual review recommended before Home-Owner sign-off.

## Data / Trust / Scope
No schema/API/route/storage/business-logic change; `server/` untouched. Removing the grade and the
advice *increases* honesty (GEA13, Core Principle 6): the room now reports facts and leaves judgement
to the one owner of it. Rollback: reset to the NSR1 tag; single-file, self-contained.

## Quality Standard
*"Would the Home Owner happily spend time here?"* — closer: the shelf is warm and the analysis panel
no longer grades the cook or plays a dashboard rainbow. Remaining owner items (packaged analysis,
photography) are what stand between "closer" and an unqualified yes.
