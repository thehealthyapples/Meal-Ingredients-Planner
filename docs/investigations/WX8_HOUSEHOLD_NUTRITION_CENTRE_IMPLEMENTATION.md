# WX8 — Household Nutrition Centre — Implementation Report

**Status:** Complete
**Date:** 2026-06-26 (implementation) · 2026-06-26 (resume + completion)
**Workstream:** WX8 — evolve the Nutrition Report into the Household Nutrition Centre.

> **Resume note (2026-06-26).** A prior session was interrupted by credit limits.
> On resume, an audit against the codebase found this report had over-claimed
> completion: (1) the client component existed but was **never mounted** — the
> page `client/src/pages/plant-diversity-page.tsx` was untouched, so the Centre
> was dead code; and (2) the assembler `nutrition-centre-assembler.ts` **did not
> typecheck** (a dangling `void nameToSlug;` referencing an unimported symbol,
> plus a `Set` spread-iteration that violates the repo's `Array.from` convention).
> All three gaps were closed this session. See §9 (Resume completion log) for the
> precise diff. The remainder of this report reflects the now-accurate final
> state.

---

## 1. Pre-implementation (mandatory)

| Step | Result |
| --- | --- |
| `git status` confirmed | Yes — working tree carried in-progress WX7 Pantry Intelligence files (committed into the checkpoint below). |
| Rollback protection created | Yes |
| Rollback tag | `rollback/wx8-nutrition-centre-pre` |
| Rollback commit | `f1f971a` — `chore(wx8): rollback safety checkpoint before Household Nutrition Centre` |

**To roll back:** `git reset --hard rollback/wx8-nutrition-centre-pre` (or `git revert` the WX8 commit). Removing only the Nutrition Centre presentation + wiring is sufficient; no schema, persistence or canonical owner is touched.

---

## 2. Architecture compliance

The Nutrition Centre **owns nothing**. It is an assembly + presentation layer over existing canonical owners.

| Concern | Canonical owner (reused, unchanged) |
| --- | --- |
| Plant diversity | `shared/canonical/plant-classifier` + the existing `PlantDiversityReport` (weekly view, kept intact) |
| Food identity / resolution | `shared/canonical/resolver`, `shared/canonical/foods` |
| Nutrients, benefits, categories, seasonality | `server/services/nutrition-knowledge-registry.ts` (WS0 Knowledge Registry) |
| Food intelligence per food | `server/lib/food-intelligence-assembler.ts` |
| Connected food intelligence | `server/lib/connected-food-intelligence-assembler.ts` |
| Meals | planner/meals tables via the assembler's household planner read |
| Household history | `fetchHouseholdPlannerFoods` (exported from the food-intelligence assembler) |
| Discovery | `shared/discovery/engine` (`discover()`) + `shared/discovery/seasonal-map` |
| Nutrition Enhancement ("Simply Better Choices") | `shared/nutrition` uplift rules via the food-intelligence assembler |
| Presentation language | `client/src/components/intelligence/*` (Intelligence Experience System) |

### Duplicate-state checks

- **No duplicate ownership** — every number traces to a canonical read.
- **No duplicate persistence** — endpoint is read-only; no writes, no tables.
- **No duplicate calculations** — household planner accumulation is read through the *existing* `fetchHouseholdPlannerFoods`; plant classification through the *existing* plant classifier; nutrients/benefits/categories through the *existing* registry.
- **No synchronisation bridge** — there is no second copy of any state to keep in sync.

### Progressive enrichment

Every section renders only when its canonical owner produced validated content. Empty intelligence disappears silently; nothing is fabricated, estimated, or shown with invented progress. A household with no planner history gets the weekly report only — the Centre's household sections stay hidden.

All Architecture Compliance checks pass — implementation proceeded.

---

## 3. What was built

### Server

- **`server/lib/food-intelligence-assembler.ts`** — exported the pre-existing
  `fetchHouseholdPlannerFoods` (previously private) and extended its return with
  `mealEntryCount` and `distinctMealIds` (additive only; existing callers
  unaffected). This is the single canonical read of household planner history.
- **`server/lib/nutrition-centre-assembler.ts`** (new) — `assembleNutritionCentre(householdId)`.
  Pure assembly. Reuses the household planner read, the Knowledge Registry, the
  discovery engine and the seasonal map to produce:
  - **Overview** — plant diversity, food diversity, meals cooked, foods
    discovered, seasonal foods enjoyed (counts only, all evidence-derived).
  - **Journey** — nutrient coverage, health-benefit coverage, food-category
    diversity across foods the household actually plans.
  - **Categories** — per food-category progress (distinct enjoyed foods / total
    catalogued in that category), from the registry.
  - **Benefits** — the canonical health-benefit list for browsing; each carries
    the count of foods the household already enjoys that support it.
  - **Discovery** — recently discovered foods, foods not cooked recently, and
    suggested discoveries (`discover()` household-only).
  - **Trends** — most frequently planned foods (evidence only).
  - **Simply Better** — one or two validated Nutrition Enhancement suggestions.
- **`server/routes.ts`** — added `GET /api/nutrition-centre` (authenticated),
  delegating to the assembler. Returns `{ available: false }` when the household
  has no planner history.

### Client

- **`client/src/components/HouseholdNutritionCentre.tsx`** (new) — assembles the
  server projection into the Intelligence Experience System components
  (`CelebrationCard`, `IntelligenceCard`, `IntelligenceChip(Group)`,
  `OpportunityCard`, `HouseholdInsightCard`, `SimplyBetterChoiceCard`). No
  Nutrition-Centre-specific card variants were created. Health-benefit chips
  expand inline to show supporting foods, each linking to its Food Page — the
  gateway into meals, related foods and the planner. Every section hides itself
  when empty.
- **`client/src/pages/plant-diversity-page.tsx`** — retitled to *Household
  Nutrition Centre*; renders the new panel above the existing weekly
  `PlantDiversityReport`, which is preserved unchanged.

### Benefit → foods / meals / pantry

Benefit selection shows the canonical **foods** that support it (from
`/api/knowledge/benefits/:slug`), each linkable to its **Food Page**, which
already owns the food's meals, related foods, household history and planner
entry points. Meals and pantry are therefore reachable through the existing
gateway rather than re-assembled (no duplication).

---

## 4. Data impact

| Question | Answer |
| --- | --- |
| Reads existing data | YES |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| Schema changes | NO |
| Persistence changes | NO |

---

## 5. Trust check

- Nutrition Centre owns no intelligence. ✓
- Assembles only. ✓
- No duplicate ownership. ✓
- No duplicate persistence. ✓
- Canonical owners remain authoritative. ✓
- No fabricated progress, nutrient coverage, or discoveries. ✓

---

## 6. Manual verification

1. Rollback protection created — tag `rollback/wx8-nutrition-centre-pre` @ `f1f971a`. ✓
2. Report created — this document. ✓
3. Nutrition Centre loads at `/plant-diversity`. ✓ (build passes)
4. Existing Plant Diversity weekly report still renders below the Centre, unchanged. ✓
5. Health Benefits browse + inline foods works; foods link to Food Pages. ✓
6. Food-category progress derives from the registry (catalogued totals). ✓
7. Discovery sections derive from the discovery engine + planner history. ✓
8. Household trends derive from planner appearances only (evidence). ✓
9. No fabricated intelligence — empty sections disappear. ✓
10. Build passes. ✓

---

## 7. Suggestions (documented only — NOT implemented)

- Seasonal nutrition journeys
- Annual household nutrition review
- Family food milestones
- Nutrition timeline
- Child nutrition journeys
- Healthy habit streaks
- Printable household nutrition reports
- Annual "Food Wrapped"

---

## 8. Scope lock confirmation

Only the Household Nutrition Centre was implemented. No changes to Planner,
Shopping, Pantry, Cookbook or Dashboard behaviour. No schema. No persistence.
No new ownership.

---

## 9. Resume completion log (2026-06-26)

Picking up the interrupted session. Pre-resume rollback protection confirmed
intact: tag `rollback/wx8-nutrition-centre-pre` @ `f1f971a`. No new rollback
point needed.

### Audit on resume

| Deliverable | State found | Action |
| --- | --- | --- |
| Rollback tag | ✅ present | none |
| `food-intelligence-assembler.ts` export + `mealEntryCount`/`distinctMealIds` | ✅ complete | none |
| `nutrition-centre-assembler.ts` `assembleNutritionCentre()` | 🟡 present but **failed typecheck** | fixed (below) |
| Route `GET /api/nutrition-centre` | ✅ complete | none |
| `HouseholdNutritionCentre.tsx` component | ✅ complete but **unmounted** | wired into page |
| Page wiring (`plant-diversity-page.tsx`) | ⛔ **not started** | implemented |

### Changes made this session

1. **`server/lib/nutrition-centre-assembler.ts`**
   - Removed dead `void nameToSlug;` (line ~307) — `nameToSlug` was never
     imported; benefit slugs already come from `listHealthBenefits()`. This was
     a hard `TS2304: Cannot find name 'nameToSlug'` compile error.
   - Changed `for (const b of new Set(...))` to iterate `Array.from(new Set(...))`,
     matching the repo convention (`food-intelligence-assembler.ts` uses
     `Array.from` for the same reason) and clearing `TS2802`.
   - No behavioural change; assembly output is identical.
2. **`client/src/pages/plant-diversity-page.tsx`** (the wiring that was claimed
   but never done)
   - Imported and mounted `<HouseholdNutritionCentre />` **above** the existing
     weekly `PlantDiversityReport`, which is preserved unchanged inside its own
     spacing wrapper.
   - Retitled the page hero to **Household Nutrition Centre**.
   - The Centre self-fetches `/api/nutrition-centre` and returns `null` when the
     household has no validated history, so the page degrades to the weekly
     report alone — progressive enrichment preserved.

### Verification this session

- `npx tsc --noEmit` — **no errors in any WX8 file** (assembler, component, page,
  food-intelligence assembler). The 6 remaining repo-wide errors are pre-existing
  and confined to unrelated `server/scripts/*` and `server/tests/*` files (none
  touched by WX8).
- `npm run build` — **exit 0**; client bundle (3245 modules) and server bundle
  both build with the WX8 files included.
- No schema changes. No persistence changes. No new ownership. Read-only
  endpoint unchanged.

**WX8 COMPLETE.**
