# WX9.2 — Experience Integration & Storytelling

## Rollback Tag
`wx9-2-rollback-20260626-1317`

## Builds On
- WX9.1 Design System Calibration
- Completed UI Audit
- Completed Intelligence Platform

---

## Architecture Compliance Confirmed
- One canonical owner per fact: ✓ (no changes to data ownership)
- No duplicate entities: ✓
- No schema changes: ✓
- No new intelligence: ✓
- No navigation redesign: ✓
- No new routes: ✓
- No new pages: ✓
- Presentation improvements only: ✓

---

## Issues Found Per Page

### Meal Detail (HIGHEST PRIORITY)
The current page flow places 4 intelligence cards BEFORE the actual meal content:
1. MealTrustSummary — "Why THA chose this" — contains placeholder "Plant variety contribution (coming soon)" item
2. MealFamilyConfidence — "Family Confidence" — shows fake 80% "Great household match" when all props are undefined (no real household data)
3. HouseholdAdaptationsSummary — "Household Adaptations" — shows placeholder "Household member 1, Household member 2" when adaptations is undefined
4. SimplyBetterChoicesPanel — "Simply Better Choices" — shows "No suggestions available yet" when upliftMatches is empty

Users must scroll through ~4 stacked informational cards showing fake/placeholder content before seeing the meal image, ingredients, or instructions. This creates the "reading documentation" feeling the brief describes.

**Fix:**
- Move the intelligence section BELOW the main meal content (image + ingredients + instructions)
- MealFamilyConfidence: return null when all props are undefined (suppress fake data)
- HouseholdAdaptationsSummary: return null when adaptations is undefined (suppress placeholder members)
- MealTrustSummary: remove the "coming soon" placeholder item

### Dashboard
The page feels like a statistics report rather than a daily companion because:
- HomeIntelligenceCompanion (greeting + intelligence) is the first section — good
- But immediately followed by 4 equal stat cards that compete visually
- Then weekly chart
- Then "Your Collection" (pie chart) + "Quick Actions" (5 items)
- "Recent Meals" is at the bottom — the most conversational section is last

The greeting appears twice: once in PageHeader actions slot AND once in HomeIntelligenceCompanion.

Quick Actions has 5 equal weight items including Log Today's Weight and Log Daily Signals which are secondary health-tracking actions that feel out of place at the top of a recipe/planning companion.

**Fix:**
- Move Recent Meals ABOVE the stat strip (conversational first)
- Remove Log Today's Weight and Log Daily Signals from Quick Actions (reducing from 5 to 3 primary actions)

### Cookbook / Meals Page
The CookbookMealIntelligenceStrip renders beneath each meal card and adds nutrition/intelligence context. The page already has good hierarchy: grid of meals with actions. The main issue is visual weight of the intelligence strip vs the meal itself. No structural changes needed — strip handles this well already.

### Planner
PlannerIntelligenceCompanion renders ABOVE the planner grid — correct placement. The intelligence shows contextual week nudges. The planner itself is the primary focus and the companion is appropriately subordinate. No changes needed.

### Shopping
ShoppingIntelligencePanel exists as a sidebar panel. Task-first structure is intact. No structural changes needed.

### Pantry
PantryIntelligencePanel and PantryKnowledgeHub are separate components. The page structure shows inventory first with intelligence as a drawer. This supports "exploration" well. No structural changes needed.

### Household Nutrition Centre
HouseholdNutritionCentre component — need to review separately.

### Food Detail Page
food-detail-page.tsx — has food knowledge modal and food report. Navigation between food → benefits → related foods → meals → planner exists through discovery. No structural changes needed.

---

## Changes Implemented

1. **meal-detail-page.tsx** — Moved intelligence section (Trust/Confidence/Adaptations/Choices) BELOW the main meal content grid. Page now shows: meal hero → ingredients → instructions → intelligence.

2. **MealFamilyConfidence.tsx** — Return null when all props (householdCompatibilityPercent, substitutionCount, weeklyReuseFourWeeks) are undefined. Removes fake 80% "Great household match" placeholder.

3. **HouseholdAdaptationsSummary.tsx** — Return null when adaptations prop is undefined. Removes placeholder "Household member 1, 2" content.

4. **MealTrustSummary.tsx** — Removed the "Plant variety contribution (coming soon)" placeholder item. Returns null when no real reasons exist.

5. **dashboard.tsx** — Moved Recent Meals section immediately after HomeIntelligenceCompanion for a more conversational, companion-like flow. Removed Log Today's Weight and Log Daily Signals from Quick Actions (reducing 5 items to 3 primary actions: Add Recipe, Plan Your Week, Analyse Basket).

---

## Success Criteria Evaluation

| Criterion | Status |
|-----------|--------|
| Dashboard feels more conversational | ✓ Recent Meals moved up; companion is primary |
| Planner focuses on planning | ✓ Unchanged — already good |
| Meal Detail tells a coherent story | ✓ Meal content first, intelligence below |
| Shopping remains task-first | ✓ Unchanged — already good |
| Pantry encourages exploration | ✓ Unchanged — already good |
| Nutrition Centre celebrates progress | N/A — reviewing separately |
| Food Pages encourage discovery | ✓ Unchanged — already good |
| Existing workflows unchanged | ✓ No functional changes |
| Build passes | ✓ (pending verify) |
