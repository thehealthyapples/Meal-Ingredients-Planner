# Diet Compatibility Checking - Cross-Domain Extension Plan

## Overview
Extend the diet compatibility checking feature (currently working in nutrition-knowledge) to all food-related domains so users can ask questions like:
- "is there anything on this week's planner that conflicts with our household dietary requirements?"
- "are any items on my shopping list problematic for my wife's celiac?"
- "what recipes in my cookbook work for a vegan household?"

---

## Current State (Completed)

### Nutrition-Knowledge Domain ✅
- **Service**: `checkFoodCompatibility(foodName, userId)` → `FoodCompatibilityInfo`
- **Integration**: Added to `explain` verb (currently wired)
- **Result**: Companion shows diet compatibility in responses
- **Example**: "Chicken is linked to energy support... Chicken has no known dietary conflicts."

---

## Extension Architecture

### Core Principle
The reusable `checkFoodCompatibility()` service operates on:
- **Input**: `foodName` (string) + `userId` (number)
- **Output**: `FoodCompatibilityInfo` {compatible, restrictions, dietPatterns, conflictingRestrictions, conflictingDietPatterns, explanation}
- **Location**: `server/intelligence/handlers/nutrition-diet-compatibility.ts`

This service is **domain-agnostic** and can be called from any handler that deals with foods.

---

## Domain-by-Domain Extension

### 1. PLANNER (Priority 1 - What you asked for)

#### User Questions
- "is there anything on this week's planner that conflicts with our household dietary requirements?"
- "what meals next week don't work for my wife's keto diet?"
- "are there any allergy conflicts on my planner?"

#### Implementation Path

**A. Create new verb: `audit-diet`**
- File: `server/intelligence/handlers/planner-read-handler.ts`
- Purpose: Check all meals in a week for diet conflicts
- Input: `weekId` or `weekNumber` parameter
- Output: New result type `PlannerDietAuditResult`

**B. Result Type**
```typescript
interface PlannerDietConflict {
  readonly dayOfWeek: number;
  readonly mealType: string;
  readonly mealName: string | null;
  readonly conflictingItems: string[]; // which foods/ingredients conflict
  readonly conflictingDietPatterns: string[];
  readonly conflictingRestrictions: string[];
  readonly explanation: string;
}

interface PlannerDietAuditResult {
  readonly scope: "diet-audit";
  readonly weekId: number;
  readonly weekNumber: number;
  readonly weekStartDate: string | null;
  readonly totalMeals: number;
  readonly conflictCount: number;
  readonly conflicts: readonly PlannerDietConflict[];
  readonly deterministicAnswer: string; // "0 conflicts this week" or "3 conflicts found..."
}
```

**C. Handler Logic**
```typescript
// In planner-read-handler.ts
async function auditPlannerDiet(
  intent: Intent,
  port: PlannerReadPort,
  userId: number,
): Promise<PlannerDietAuditResult> {
  // 1. Fetch week data
  const week = await port.getWeekData(weekId);
  
  // 2. For each meal in week:
  for (const meal of allMeals) {
    // 3. Check meal name against diet
    const mealCompat = await checkFoodCompatibility(meal.mealName, userId);
    if (!mealCompat.compatible) {
      conflicts.push({mealInfo, mealCompat});
    }
    
    // 4. Check each ingredient against diet
    for (const ingredient of meal.ingredients) {
      const ingredCompat = await checkFoodCompatibility(ingredientName, userId);
      if (!ingredCompat.compatible) {
        conflicts.push({ingredientInfo, ingredCompat});
      }
    }
  }
  
  // 5. Return aggregated conflicts
  return {
    scope: "diet-audit",
    weekId: week.id,
    conflicts,
    deterministicAnswer: buildDietAuditAnswer(conflicts),
  };
}
```

**D. Pattern Matcher Integration**
- File: `server/intelligence/pattern-intent-resolver.ts`
- Add matcher for planner audit queries:
```typescript
// "is there anything on this week's planner that conflicts with dietary requirements?"
// "what on my planner doesn't work for keto?"
// "are there any allergy issues on my meal plan?"
(u) => {
  const dietMatch = /\b(?:diet|allerg|restrict|conflict|suitable|work|compatible)\b/i;
  const plannerMatch = /\b(?:planner|plan|meal\s+plan|this\s+week|next\s+week)\b/i;
  if (!dietMatch.test(u) || !plannerMatch.test(u)) return null;
  return {
    capability: "planner",
    verb: "audit-diet",
    parameters: {weekNumber: 0}, // 0 = current week
    confidence: 0.87,
  };
}
```

**E. Handler Factory Update**
- Add `audit-diet` case to planner handler switch statement
- Pass userId through (like nutrition-knowledge does)

---

### 2. JOURNAL (Food Logging)

#### User Questions
- "what have I logged today that conflicts with my diet?"
- "are any foods I ate this week problematic?"
- "which logged meals don't work for my household's restrictions?"

#### Implementation Path

**A. Extend existing read results**
- File: `server/intelligence/handlers/journal-read-handler.ts` (if exists)
- Or create `journal-diet-compatibility.ts`

**B. Add to Journal Entry/Day/Week results**
```typescript
interface JournalEntryWithDietCompat {
  readonly ...existingFields;
  readonly dietCompatibility?: DietCompatibilityInfo;
}
```

**C. Handler Logic**
- When fetching logged foods for a day/week
- Check each food's diet compatibility
- Include in response (similar to nutrition-knowledge)

---

### 3. COOKBOOK (Recipes)

#### User Questions
- "are any recipes in my cookbook vegan-friendly?"
- "which recipes work for a keto diet?"
- "do I have any recipes my wife can eat?"

#### Implementation Path

**A. Recipe Diet Audit**
```typescript
interface RecipeDietAuditResult {
  readonly scope: "recipe-diet-audit";
  readonly recipeName: string;
  readonly ingredients: readonly IngredientWithCompat[];
  readonly dietConflicts: readonly DietConflict[];
  readonly overallCompatible: boolean;
}
```

**B. Handler Logic**
- When explaining/reading a recipe
- Check each ingredient for diet compatibility
- Aggregate conflicts
- Return structured audit

---

### 4. SHOPPING (Grocery Items)

#### User Questions
- "what on my shopping list is incompatible with my household's diet?"
- "are there any allergy items I'm about to buy?"
- "which groceries don't work for celiac?"

#### Implementation Path

**A. Shopping List Diet Audit**
```typescript
interface ShoppingDietAuditResult {
  readonly scope: "shopping-diet-audit";
  readonly listId: number;
  readonly items: readonly ShoppingItemWithCompat[];
  readonly conflictCount: number;
  readonly conflicts: readonly DietConflict[];
}
```

**B. Handler Logic**
- When fetching shopping list
- Check each item for diet compatibility
- Flag problematic items
- Return with conflicts highlighted

---

## Implementation Priority

**Phase 1 (Immediate)**
1. Seed knowledge registry: `npm run seed:knowledge` (gets pasta, lasagne, etc.)
2. Planner `audit-diet` verb (highest user value)

**Phase 2 (High Value)**
3. Journal diet compatibility check
4. Add to pattern resolver matchers for all domains

**Phase 3 (Nice to Have)**
5. Cookbook recipe diet audit
6. Shopping list diet audit

---

## API Response Pattern (All Domains)

Each domain will follow this pattern:

```typescript
// When audit succeeds (found conflicts or no conflicts)
{
  status: "ok-data",
  scope: "diet-audit|recipe-audit|journal-audit|shopping-audit",
  items: [...],
  conflicts: [
    {
      itemName: string,
      conflictingDietPatterns: string[],
      conflictingRestrictions: string[],
      explanation: string,
    }
  ],
  conflictCount: number,
  deterministicAnswer: string, // "0 conflicts found" or "3 items conflict"
}

// When audit fails (no meals, no items, no audit capability)
{
  status: "gap",
  kind: "unknown|no-data|not-implemented",
  message: "honest gap explanation"
}
```

---

## Conversation Gateway Changes

**Minimal changes needed** because:
- Each domain already returns `deterministicAnswer` for single-capability queries
- Diet audit results will include deterministic answer with conflict summary
- Companion will speak the answer verbatim

Example flow:
1. User: "is there anything on this week's planner conflicting with our diet?"
2. Companion resolves to: `{verb: "audit-diet", capability: "planner", ...}`
3. Handler runs audit, returns: `{deterministicAnswer: "1 conflict found: Lasagne pasta on Tuesday conflicts with keto diet"}`
4. Companion speaks that answer directly

---

## Shared Implementation Details

### Error Handling
All domains should:
- Return honest gap if userId not available
- Return empty conflicts array (not gap) if no conflicts found
- Handle missing foods gracefully (treat as compatible)

### Performance Considerations
- For large meal plans/shopping lists: check in parallel with Promise.all()
- Cache household diet context per request (don't fetch for every food)
- Consider pagination for very large audits (100+ items)

### UI Considerations
- Show conflict details in summary (what conflicts + why)
- Link to alternative foods/recipes
- Allow dismissing/marking conflicts as "understood"

---

## Testing Strategy

For each domain:
1. Unit test: `checkFoodCompatibility()` with known diet patterns
2. Integration test: Handler returns audit results correctly
3. E2E test: Companion can ask diet audit questions and get correct answers

---

## Success Criteria

✅ User can ask diet compatibility questions in ALL food domains
✅ System correctly identifies conflicts across diet patterns + restrictions
✅ Companion displays conflicts in natural language
✅ No false positives (compatible foods marked as conflicts)
✅ No false negatives (conflicts actually show up)

---

## Notes

- **Knowledge Gap**: Pasta/Lasagne ARE in the seed but database needs `npm run seed:knowledge`
- **Service Location**: `checkFoodCompatibility` is single source of truth for all domains
- **Scaling**: Can add more diet patterns/restrictions without changing domain code
