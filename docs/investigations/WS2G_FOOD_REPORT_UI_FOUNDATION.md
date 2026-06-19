# WS2G — Food Report UI Foundation

**Status:** COMPLETE  
**Branch:** safety/preserve-since-last-prod-20260617-1613  
**Rollback tag:** `rollback/pre-ws2g-food-report-ui-20260619`  
**Date:** 2026-06-19

---

## Summary

Created a reusable `FoodReport` UI component that consumes the WS2F `buildFoodReport()` adapter and integrated it into the existing Plant Diversity expanded-row pattern. No new data was created. No counts were changed. No schema changes.

---

## Files Changed

| File | Change |
|---|---|
| `client/src/components/FoodReport.tsx` | NEW — reusable Food Report UI component |
| `client/src/components/PlantDiversityReport.tsx` | INTEGRATION — expanded row now uses FoodReport; dead WS2B CanonicalVarietySections removed |

---

## FoodReport Component

**Location:** `client/src/components/FoodReport.tsx`

**Props:**
```ts
interface FoodReportProps {
  canonicalSlug: string;           // WS2A canonical food slug
  eatenVarietyLabels?: readonly string[];  // from WS2B yourVarieties
}
```

**Sections rendered (in order):**
1. Overview (description paragraph, hidden if empty)
2. Key Nutrients (emerald pills, max 5 from adapter, hidden if empty)
3. Health Benefits (muted pills + THA disclaimer, hidden if empty)
4. Nutrition Context (bullet list, hidden if empty)
5. Your Variety (emerald pills with check, matched via eatenVarietyLabels)
6. Broaden Your Variety (muted pills with circle, uneaten varieties)
7. Variety Additional Knowledge (per-variety sub-section, hidden if no unique facts)

**Null guard:** returns null when `buildFoodReport(canonicalSlug)` returns null. No crash, no placeholder.

---

## Integration

**Location:** `PlantDiversityReport.tsx` — `PlantReportRow` expanded section

**Before:** Expanded row showed WS0-based More Health Benefits (mostly empty), WS0 Key Nutrients, Used In, WS2B CanonicalVarietySections.

**After:** Expanded row shows `<FoodReport>` (canonical adapter output) + "Used In" (week-specific meal evidence).

**Canonical slug resolution:** Uses `variety?.canonicalSlug ?? row.canonicalKey`. The WS2B `CanonicalVarietyDisplay.canonicalSlug` is the resolver-authoritative slug; `row.canonicalKey` is the fallback for foods with no defined varieties.

**CanonicalVarietySections removed:** Dead code — FoodReport now owns variety display. WS2B computation (`buildRowVarietyDisplays`) is still run; `variety?.canonicalSlug` and `variety?.yourVarieties` are consumed by FoodReport.

---

## Validation Results

### Test suites (all pass, unchanged counts)

```
npm run test:food-report       → 94 passed, 0 failed
npm run test:variety-surfacing → 36 passed, 0 failed
npm run test:canonical-food    → 46 passed, 0 failed
```

### TypeScript

No errors in `FoodReport.tsx` or `PlantDiversityReport.tsx`. Pre-existing errors in unrelated server test files are unchanged.

---

## Manual Test Coverage (expected section behaviour)

### Tomato
- Overview: ✓ (canonical description)
- Key Nutrients: ✓ (Lycopene, Vitamin C, Potassium, etc.)
- Health Benefits: ✓ (Heart Health, etc.)
- Nutrition Context: ✓ (curated notes)
- Broaden Your Variety: Cherry, Plum, Beef (all uneaten → broaden section)
- Variety Additional Knowledge: none (tomato varieties have no knowledgeFoodSlug)
- FoodReport returns null for "grilled-tomatoes" ✓

### Spinach
- Overview: ✓
- Key Nutrients: ✓ (Folate, Iron, Vitamin K, etc.)
- Health Benefits: ✓
- Nutrition Context: ✓ (iron absorption context)
- Varieties: Baby, Mature split correctly between Your/Broaden per eaten state
- Variety Additional Knowledge: none (no knowledgeFoodSlug on spinach varieties)

### Mushroom
- Overview: ✓
- Key Nutrients: empty (parent mushroom has no knowledgeFoodSlug — correct)
- Health Benefits: empty (correct)
- Nutrition Context: ✓ (vitamin D context)
- Variety Additional Knowledge: ✓ for Chestnut (Copper+), Shiitake, Oyster, Button

### Lentils
- Overview: ✓
- Key Nutrients: empty (no parent conflation — correct)
- Nutrition Context: ✓
- Variety Additional Knowledge: ✓ Red Lentil only (Plant Protein, Fibre); Green has none

### Grilled Tomatoes
- `buildFoodReport("grilled-tomatoes")` returns null → FoodReport returns null ✓
- No crash, no placeholder shown

### Mixed Beans
- `buildFoodReport("mixed-beans")` returns null → FoodReport returns null ✓

---

## Data Impact

| | |
|---|---|
| Reads existing data | YES (canonical seed, knowledge seed, nutrition context) |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |
| DB changes | NO |
| Schema changes | NO |
| Route changes | NO |
| Plant count impacted | NO (count still from plantRows.length — unchanged) |

---

## Trust Check

**Could users think benefits are medical claims?**  
No. The THA disclaimer ("Health benefits and key nutrients are educational summaries, not medical advice.") is rendered directly below any Health Benefits section. Health benefits are only shown when real data exists in FOOD_BENEFITS.

**Could empty data look like missing/broken UI?**  
No. Sections are omitted entirely when empty — no empty cards, no "coming soon" placeholders, no skeleton loaders. A food with no knowledge simply renders nothing for that section.

**Could variety knowledge be confused with parent knowledge?**  
No. The `buildFoodReport` adapter deduplicates variety knowledge against the parent: `additionalNutrients` only contains nutrients NOT already in the parent's keyNutrients. The "What Each Variety Adds" section heading makes the additional nature explicit.

**Could this change the 30 Plants count?**  
No. `PlantDiversityReport.plantCount` is `plantRows.length`, computed in `computePlantData()` which is entirely unchanged. FoodReport is display-only, called after counting.

---

## Scope Lock

### Implemented (WS2G scope only)
- `FoodReport.tsx` — reusable component
- `PlantDiversityReport.tsx` — expanded-row integration

### Not implemented (future suggestions)
- **Pairings** — not in WS2F adapter
- **Healthier Alternatives** — not in WS2F adapter
- **Nutrition Boost Ideas** — separate system
- **Apple Score integration** — separate system
- **New data seeding** — not needed
- **Production plant count migration** — separate workstream
- **Pantry redesign** — FoodReport is reusable and can be added to Pantry hub
- **Planner redesign** — FoodReport can be surfaced in meal context view
- **Nutrition insights panel integration** — FoodReport could augment `nutrition-insights-panel.tsx`

### SUGGESTION — future integration points
1. `PantryKnowledgeHub.tsx` — FoodReport could replace or augment the WS0-only knowledge display
2. `food-knowledge-modal.tsx` — FoodReport could power a canonical food knowledge modal
3. Meal detail view — FoodReport could surface per-ingredient canonical knowledge

---

## Rollback

Tag: `rollback/pre-ws2g-food-report-ui-20260619`

To revert:
```
git checkout rollback/pre-ws2g-food-report-ui-20260619
```

Two files to revert:
- `client/src/components/FoodReport.tsx` — delete
- `client/src/components/PlantDiversityReport.tsx` — restore from tag
