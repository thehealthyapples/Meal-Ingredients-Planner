# THA 30 Plants Modal V2 — Feasibility Review

**Investigation Date:** 2026-06-16  
**Rollback Point:** `rollback/30-plants-modal-v2-feasibility-review`  
**Status:** Investigation Only (No Code Changes)

---

## Executive Summary

The original THA_30_PLANTS_MODAL_V2.md investigation is **strong and comprehensive**, but five critical design refinements have emerged since that analysis. This review assesses whether those refinements are **implementable without major architectural changes** and identifies amendments needed to the original investigation.

### Updated Design Principles (New)

The modal is **NOT**:
- Ingredient inventory
- Alphabetical plant list

The modal **IS**:
- Plant Diversity Report
- Teaching: Health Outcome → Nutrient → Plant → Meals → Broaden your variety

### Key Changes from Original Investigation

| Aspect | Original Design | Updated Design | Impact |
|--------|-----------------|-----------------|---------|
| Plant row structure | Single row per plant | Multi-row (spanning Support↔Nutrient pairs) | HIGH |
| Meals display | Inline "7 meals" text | Expandable "7 meals ▶" below plant | MEDIUM |
| Try next naming | "Try next" label | "Broaden your variety" label | LOW |
| Category summaries | Per-category list items | Category-level education section | MEDIUM |
| Nested expansion | Category→Plant expansion | Category→Plant→Meals 3-level nesting | MEDIUM |

### Bottom Line

**Updated design is feasible.** All five refinements can be implemented with the data infrastructure described in the original investigation, but require **table rowspan management and nested state handling**. No new data sources required. Estimated additional effort: **+2–3 days** to Phase 2 scope.

---

## CRITICAL CHANGE 1: Plant Rowspan + Multi-Row Support↔Nutrient

### Change Description

**Original design (single row per plant):**
```
Plant          Support           Key Nutrient    Meals
🥦 Tomatoes    ❤️ Heart Health   Lycopene        7 ▶
```

**Updated design (multi-row plant with multiple supports):**
```
Tomatoes      ❤️ Heart Health      Lycopene        7 ▶
              🛡 Immunity           Vitamin C
              ✨ Skin Health       Potassium
```

### Questions Raised

1. Can plant rows span multiple lines (rowspan)?
2. Can Support↔Nutrient show multiple rows per plant?
3. Can meals column span plant rows?
4. Can this remain semantic, accessible, responsive?

### Feasibility Assessment

**Answer: YES — with design trade-offs**

#### Architecture Analysis

**Semantic HTML challenge:**
Native `<table>` rowspan is semantic but has limitations:
- Rowspan works well in static tables
- With dynamic expansion (collapsible categories), rowspan management becomes complex
- Nested expansions (category → plant → meals) push rowspan into edge cases

**Three implementation paths:**

##### Path A: Semantic Table with Rowspan (Recommended)

```html
<table>
  <tr>
    <td rowspan="3">🥦 Tomatoes</td>
    <td>❤️ Heart Health</td>
    <td>Lycopene</td>
    <td rowspan="3">7 ▶</td>
  </tr>
  <tr>
    <td>🛡 Immunity</td>
    <td>Vitamin C</td>
  </tr>
  <tr>
    <td>✨ Skin Health</td>
    <td>Potassium</td>
  </tr>
</table>
```

**Pros:**
- Semantically correct `<table>`
- Screen readers navigate naturally
- Standard CSS Grid fallback available
- Accessible keyboard navigation built-in

**Cons:**
- Rowspan math becomes complex during category collapse/expand
- Meal expansion adds another rowspan layer
- Testing required at all breakpoints

**Recommendation:** Use semantic rowspan. Complexity is manageable with proper state tracking.

##### Path B: CSS Grid Masonry (Alternative)

Use CSS Grid with `grid-row: span N` instead of table rowspan.

**Pros:**
- More flexible for dynamic heights
- Simpler row management
- Better mobile adaptation

**Cons:**
- Loses semantic `<table>` structure
- Requires ARIA labels for accessibility
- Screen reader experience less native

**Recommendation:** Secondary option if Path A proves too complex.

##### Path C: Card-based Layout (Mobile-only)

Collapse to card layout on mobile (no rowspan needed).

```
🥦 Tomatoes
❤️ Heart Health — Lycopene
🛡 Immunity — Vitamin C
✨ Skin Health — Potassium
7 meals ▶
```

**Recommendation:** Combine Path A (table on desktop/tablet) + Path C (cards on mobile).

#### Data Structure Impact

**Current PlantRow:**
```typescript
interface PlantRow {
  canonicalKey: string;
  displayName: string;
  category: PlantCategory;
  variants: string[];
  mealNames: string[];
  dayNames: string[];
  keyNutrients: string[];         // Single array
  benefitSummary: string | null;
}
```

**Updated PlantRow (with multi-support):**
```typescript
interface PlantRow {
  canonicalKey: string;
  displayName: string;
  category: PlantCategory;
  variants: string[];
  mealNames: string[];
  dayNames: string[];
  supports: SupportMapping[];      // Multiple support mappings
}

interface SupportMapping {
  support: string;                 // "Heart Health"
  emoji: string;                   // "❤️"
  keyNutrient: string;            // "Lycopene"
}
```

**Feasibility:** Low-risk change. New type is additive, doesn't break existing logic.

#### Responsive Behavior

**Desktop (1024px+):**
- Table with rowspan
- All columns visible
- Multi-row support display

**Tablet (640–1024px):**
- Table with rowspan (narrower columns)
- Nutrient column hidden, support shown
- Plant name takes 30%, support 40%, meals 30%

**Mobile (375–640px):**
- Card layout (no rowspan)
- Plant name + all supports stacked
- Meal count below

**Feasibility:** Requires careful CSS but well-established pattern.

#### Accessibility Audit

| Requirement | Path A | Path B | Status |
|-------------|--------|--------|--------|
| Keyboard navigation | ✓ Native | △ ARIA required | ✓ Feasible |
| Screen readers | ✓ Native rowspan | △ Needs labels | ✓ Feasible |
| Focus management | ✓ Table cells | ✓ Grid cells | ✓ Feasible |
| Zoom & magnification | ✓ Good | ✓ Good | ✓ Feasible |

**Recommendation:** Path A (semantic table) is accessible. Requires testing but no showstoppers.

#### Implementation Complexity

**Effort estimate (Path A):**
- Update PlantRow data structure: 1 day
- Refactor plant rendering (rowspan logic): 2 days
- Responsive CSS (all breakpoints): 1 day
- Accessibility testing: 1 day
- **Total: 5 days (already estimated in Phase 2)**

**Hidden complexity:**
1. **Rowspan math during category collapse:** When a category expands, all rowspans below it shift. State management must track which rows are visible.
2. **Meal expansion interaction:** Expanding meals beneath a multi-row plant adds another rowspan layer.
3. **Mobile card conversion:** Switching from table to cards requires duplicate rendering logic or clever CSS media queries.

**Mitigation:**
- Keep rowspan logic in a single utility function
- Render rowspan-aware plants separately from collapsed plant rows
- Use CSS `@media` to switch layouts, not JS-driven removal

### Conclusion: CRITICAL CHANGE 1

**Status: ✓ FEASIBLE**

Multi-row support display with rowspan is implementable. Recommend **Path A (semantic table) + Path C (cards on mobile)** hybrid. Adds **+2 days** to Phase 2 scope. No breaking changes to data or API.

---

## CRITICAL CHANGE 2: Meals Must Expand Inline (Not Display Inline)

### Change Description

**Original design (inline meals, desktop-only):**
```
Pasta Night, Pizza, +2
```

**Updated design (expandable inline list):**
```
7 meals ▶

Expand:
▼ Used in 7 meals
✓ Pasta Night - Monday
✓ Chicken Marengo - Wednesday
✓ Taco Bowl - Thursday
[... 4 more ...]
```

### Questions Raised

1. Can meals expand inline beneath the plant?
2. If not, what is recommended?

### Feasibility Assessment

**Answer: YES — meals can expand inline**

#### Current Implementation

Original investigation already proposes inline meal expansion (Level 4: Meal Expansion). This is already part of the design:

```typescript
// Current state:
// - Click "7 ▶" to expand
// - Shows all 7 meals in a list
// - Each meal shows: meal name + day of week
// - Collapse with "▼ Used in 7 meals"
```

#### Updated Requirement (New)

The change is naming/framing: instead of just clickable meal counts, emphasize the **expansion UI** as primary interaction:

```
7 meals ▶    → Click to expand meals below plant row
```

#### Architecture Assessment

**Option A: Expand Below Plant Row (Recommended)**

When expanded, meals appear directly below the plant:

```html
<tr>
  <td rowspan="3">🥦 Tomatoes</td>
  <td>❤️ Heart Health</td>
  <td>Lycopene</td>
  <td rowspan="3">7 ▶ [button]</td>
</tr>
<tr>
  <td>🛡 Immunity</td>
  <td>Vitamin C</td>
</tr>
<tr>
  <td>✨ Skin Health</td>
  <td>Potassium</td>
</tr>
<!-- Expanded meal list appears here -->
<tr>
  <td colspan="4">
    <div class="meal-expansion">
      <div>✓ Pasta Night - Monday</div>
      <div>✓ Chicken Marengo - Wednesday</div>
      ...
    </div>
  </td>
</tr>
```

**Pros:**
- Semantically correct (colspan spans all columns)
- Meals stay visually grouped with plant
- Keyboard navigation works naturally
- Mobile-friendly (full width on narrow screens)

**Cons:**
- colspan interacts complexly with rowspan above
- Meal rows add to table height dynamically
- Vertical scroll jumps possible

**Mitigation:** Meal expansion animation smooths height change.

**Option B: Separate Collapsible Below (Alternative)**

Meals expand in a separate accordion section below the plant table.

```html
<table>
  [plant rows with rowspan]
</table>
<details>
  <summary>Tomatoes — 7 meals ▶</summary>
  <ul>
    <li>Pasta Night - Monday</li>
    ...
  </ul>
</details>
```

**Pros:**
- Simplest implementation
- Avoids rowspan/colspan complexity
- Native HTML `<details>` element

**Cons:**
- Visually separated from plant (less intuitive)
- Takes more vertical space
- Two UI patterns (table + details)

**Recommendation:** Path A (inline expansion). Complexity is manageable.

#### Data Structure Impact

**No changes to data structure required.** MealNames and DayNames already available in PlantRow.

```typescript
interface PlantRow {
  // ... existing fields ...
  mealNames: string[];  // Already have this
  dayNames: string[];   // Already have this
}
```

#### State Management

**New UI state required:**

```typescript
interface ExpandedPlantState {
  [canonicalKey: string]: {
    categoryExpanded: boolean;  // Category is expanded
    mealsExpanded: boolean;     // Meals are expanded for this plant
    detailsExpanded: boolean;   // Full details (benefits, varieties) expanded
  }
}
```

**Complexity:** Low. Standard expand/collapse toggle pattern.

#### Responsive Behavior

**Desktop (1024px+):**
- Meals expand inline below plant rows
- Full day context shown
- All meals visible

**Tablet (640–1024px):**
- Meals expand inline (same as desktop)
- Abbreviated meal names if needed

**Mobile (375–640px):**
- Meals expand in card view (full width)
- Day context preserved
- No table colspan needed

**Feasibility:** Standard pattern, no issues.

#### Accessibility

| Aspect | Status |
|--------|--------|
| Keyboard expand/collapse | ✓ Native (button or `<details>`) |
| Screen readers | ✓ Announce expanded state |
| Focus management | ✓ Focus moves to first meal |

### Conclusion: CRITICAL CHANGE 2

**Status: ✓ FEASIBLE**

Inline meal expansion is already part of the original design. No changes needed. Implementation is straightforward and adds **no additional effort** to Phase 2.

---

## CRITICAL CHANGE 3: Nested Expansion (Category ↓ Plant ↓ Meals)

### Change Description

Three levels of expansion:

```
▶ Vegetables (28)              — Level 1: Category collapsed

▼ Vegetables (28)              — Level 1: Category expanded
  Plant | Support | Nutrient   — Level 2: Plant table
  🥦 Tomatoes | ❤️ | Lycopene | 7 ▶

  ▼ Used in 7 meals            — Level 3: Meal expansion
  ✓ Pasta Night - Monday
  ✓ Chicken Marengo - Wednesday
```

### Questions Raised

1. Will 3-level nested expansion remain manageable?
2. What state model is recommended?

### Feasibility Assessment

**Answer: YES — but requires careful state management**

#### Current Implementation (Original Investigation)

Original investigation already proposes this structure:
- Level 1: Category grid (collapsed by default)
- Level 2: Category expansion (show plant table)
- Level 3: Meal expansion (click "7 ▶")

**Existing proof:** Section "Category Expansion Design" in THA_30_PLANTS_MODAL_V2.md covers this structure.

#### State Model

**Recommended approach: Hierarchical toggle state**

```typescript
interface ModalExpandState {
  // Level 1: Which categories are expanded?
  expandedCategories: Set<PlantCategory>;
  
  // Level 2: Which plants are expanded (within expanded categories)?
  expandedPlants: Set<string>; // canonicalKey
  
  // Level 3: Which plants have meals expanded?
  expandedMeals: Set<string>;  // canonicalKey
}
```

**Alternative: Flattened state**

```typescript
interface ExpandState {
  [key: string]: {
    category?: boolean;
    plant?: boolean;
    meals?: boolean;
  }
}
```

**Recommendation:** Hierarchical Set-based model. Easier to reason about, cleaner filtering.

#### Performance Analysis

**Worst-case scenario:**
- 9 categories (all expanded)
- 73 plants total
- Average 8 plants per category
- 3 meals per plant on average

**DOM impact:**
- 9 category rows
- 73 plant rows
- ~219 meal rows (only when expanded)
- Total: ~300 rows max

**Assessment:** Manageable. Modern browsers handle 300 rows easily. No virtual scrolling needed.

**Mitigation:**
- Only render expanded plants (lazy render)
- Cache meal lists (they don't change during session)
- Debounce category expansion if needed

#### UI/UX Considerations

**Discoverability:**
- Users might not realize meals expand (needs affordance)
- Recommendation: Show "7 meals ▶" as a button with distinct styling

**Cognitive load:**
- 3 levels isn't excessive (compare: file browser with 4+ levels)
- Visual hierarchy helps (indent, colors, icons)

**Mobile usability:**
- Multiple expansion levels can be overwhelming on mobile
- Recommendation: Collapse all by default on mobile, allow user expansion

#### Interaction Model

**Recommended rules:**
1. Categories collapsed by default (all breakpoints)
2. When category expands, plants shown but collapsed
3. Click "7 ▶" to expand meals inline (or click plant row for full details)
4. Closing a category collapses all plants within it

**Code pattern:**

```typescript
const toggleCategory = (category: PlantCategory) => {
  if (expandedCategories.has(category)) {
    expandedCategories.delete(category);
    // Close all plants in this category
    plants
      .filter(p => p.category === category)
      .forEach(p => expandedPlants.delete(p.canonicalKey));
  } else {
    expandedCategories.add(category);
  }
};
```

#### Testing Strategy

**Key test cases:**
1. Expand category A, then B (state isolation)
2. Expand plant meals, then collapse category (cleanup)
3. Expand all categories, then collapse one (no side effects)
4. Mobile: ensure collapsing category collapses all plants
5. Keyboard: Tab through nested levels, Escape closes levels

**Estimated testing effort:** 1 day

#### Hidden Complexity

1. **Parent-child expansion rules:** Closing parent should close children (handled above)
2. **Animation staggering:** Multiple nested expansions need smooth animation
3. **Scroll position:** Expanding category might shift scroll; consider `scrollIntoView()`
4. **Mobile adaptation:** Nested expansions take space; card layout needed on mobile

### Conclusion: CRITICAL CHANGE 3

**Status: ✓ FEASIBLE**

3-level nested expansion is already proposed in original investigation. Recommended state model: **hierarchical Set-based toggles**. No architectural changes needed. Adds **~1 day** for state management + testing to Phase 2.

---

## CRITICAL CHANGE 4: "Broaden Your Variety" (not "Try Next")

### Change Description

**Original label:** "Try next"

**Updated label:** "Broaden your variety"

**Context:** Shows variant suggestions for each plant.

### Questions Raised

1. Can suggestions be generated from existing variants?
2. Or would a new data structure be required?

### Feasibility Assessment

**Answer: YES — can be generated from variants with no new data**

#### Current Data Structure

```typescript
interface PlantRow {
  // ...
  variants: string[];  // ["Cherry Tomatoes", "Vine Tomatoes", "Tinned Tomatoes"]
}
```

**Example:**
```
canonicalKey: "tomatoes"
variants: ["Cherry Tomatoes", "Vine Tomatoes", "Tinned Tomatoes"]
mealNames: ["Pasta Night", "Chicken Marengo", "Taco Bowl"]
```

#### Generation Logic

**Algorithm:**

```typescript
function getBroadenSuggestions(
  plant: PlantRow,
  allVariantsUsed: Set<string>
): string[] {
  // Get all possible variants for this canonical key
  const allPossibleVariants = getVariantsFromNutritionDatabase(plant.canonicalKey);
  
  // Filter out already-used variants
  const suggestions = allPossibleVariants
    .filter(variant => !allVariantsUsed.has(variant))
    .slice(0, 3); // Limit to 3 suggestions
  
  return suggestions;
}
```

**Data source:** `nutrition-benefit-library.ts` already has variant coverage:

```typescript
{
  name: "Tomatoes",
  variants: ["Cherry Tomatoes", "Vine Tomatoes", "Roasted Tomatoes", "Sun-Dried Tomatoes", "Tinned Tomatoes"],
  // ...
}
```

#### Implementation Complexity

**Level of effort:** Minimal (1 day)

**Tasks:**
1. Add variants to nutrition-benefit-library.ts entries
2. Implement getBroadenSuggestions() helper function
3. Update PlantRow rendering to show suggestions
4. Rename "Try next" label to "Broaden your variety"

#### Data Gap Analysis

**Current status:**
- 36 ingredients have benefit data
- Only ~5 have variants listed

**Required work:**
- Add 5–10 variant suggestions per ingredient in nutrition-benefit-library.ts
- Estimated: 2–3 hours of data entry

#### Edge Cases

**What if no suggestions exist?**
```
// If allVariantsUsed covers all known variants:
if (suggestions.length === 0) {
  return null; // Hide "Broaden your variety" section
}
```

**What if plant has no variants?**
```
// If only one form exists:
{
  name: "Kale",
  variants: ["Kale"] // Only one variant
}
// Result: No suggestions shown (expected)
```

#### Alternative: AI-Generated Suggestions

**Not required but possible:**

Could use GPT to generate suggestions dynamically:
```
"You've used tomatoes 3 times. Try: heirloom tomatoes, cherry tomatoes, roasted tomato"
```

**Recommendation:** Start with curated variants. AI generation adds infrastructure complexity without clear benefit.

### Conclusion: CRITICAL CHANGE 4

**Status: ✓ FEASIBLE**

"Broaden your variety" can be generated from existing variant data. No new data structures required. Effort: **1 day** (already in Phase 3 scope). Requires expanding variants in nutrition-benefit-library.ts during Phase 1.

---

## CRITICAL CHANGE 5: Category-Level Education

### Change Description

Show education summary at the category level.

**Example:**

```
▼ Seeds

Supports
❤️ Heart health
😴 Sleep quality
🛡 Immunity

Key nutrients
Magnesium
Zinc
Omega-3

Plants
Pumpkin Seeds
Chia Seeds
Flax Seeds
```

### Questions Raised

1. Can category summaries be derived automatically?
2. Or must they be curated?

### Feasibility Assessment

**Answer: AUTOMATIC DERIVATION with manual curation option**

#### Data Source: Plants in Category

**Current structure already tracks plant-to-category mapping:**

```typescript
// For category "Seeds":
const plantsInSeedsCategory = plants.filter(p => p.category === "Seeds");
// Result: [Pumpkin Seeds, Chia Seeds, Flax Seeds, ...]
```

#### Algorithm: Auto-Derive Category Summary

```typescript
function getCategorySummaryAuto(category: PlantCategory): CategorySummary {
  const plantsInCategory = plants.filter(p => p.category === category);
  
  // Collect all supports from all plants
  const supports = new Set<string>();
  plantsInCategory.forEach(plant => {
    plant.supports.forEach(s => supports.add(s.support));
  });
  
  // Collect all nutrients
  const nutrients = new Set<string>();
  plantsInCategory.forEach(plant => {
    plant.supports.forEach(s => nutrients.add(s.keyNutrient));
  });
  
  return {
    category,
    supports: Array.from(supports).slice(0, 5), // Top 5
    nutrients: Array.from(nutrients).slice(0, 5),
    plantNames: plantsInCategory.map(p => p.displayName),
  };
}
```

**Result for "Seeds":**
```
Supports: [Heart Health, Sleep Quality, Immunity, ...]
Nutrients: [Magnesium, Omega-3, Zinc, ...]
Plants: [Pumpkin Seeds, Chia Seeds, Flax Seeds, ...]
```

#### Implementation Complexity

**Automatic derivation:** Very simple (3–4 hours)

**Manual curation:** Optional enhancement

**Hybrid approach:**
1. Auto-derive from plant data (fast, always accurate)
2. Allow optional curation (more control, future feature)

#### Data Structure

**New type:**

```typescript
interface CategorySummary {
  category: PlantCategory;
  supports: string[];         // [❤️ Heart Health, ...]
  nutrients: string[];        // [Magnesium, Zinc, ...]
  plantCount: number;
  description?: string;       // Optional curated description
}
```

**Storage:** Can be computed on-demand (no new database needed).

#### Responsive Display

**Desktop (1024px+):**
```
▼ Seeds
Supports: ❤️ Heart health  😴 Sleep quality  🛡 Immunity
Nutrients: Magnesium  Zinc  Omega-3
Plants: Pumpkin Seeds, Chia Seeds, Flax Seeds (5 total)
```

**Tablet (640–1024px):**
```
▼ Seeds
Supports
❤️ Heart health
😴 Sleep quality
🛡 Immunity

Nutrients
Magnesium  Zinc  Omega-3
```

**Mobile (375–640px):**
```
▼ Seeds
Health outcomes: Heart health, Sleep, Immunity
Nutrients: Magnesium, Zinc, Omega-3
5 plants used
```

#### Hidden Complexity

1. **Ordering:** Which supports/nutrients to show first?
   - **Solution:** Sort by frequency (most common first)

2. **Description accuracy:** Auto-derived summaries might feel generic
   - **Solution:** Show top 3–5, not all

3. **Edge cases:** What if category has only 1–2 plants?
   - **Solution:** Show anyway; even 1 plant is educational

### Conclusion: CRITICAL CHANGE 5

**Status: ✓ FEASIBLE**

Category-level education can be **automatically derived** from plant support data with no new infrastructure. Effort: **1 day** (Phase 2). Optional manual curation can be added later.

---

## Responsive Strategy Review

### Breakpoints

Updated investigation proposes 3 main breakpoints. Confirm all critical changes work across them:

| Breakpoint | Name | Width | Table | Rowspan | Meals | Nested |
|-----------|------|-------|-------|---------|-------|--------|
| Mobile | Compact | 375px | Cards | N/A | Expand | ✓ |
| Tablet | Comfortable | 640px | Table | ✓ | Expand | ✓ |
| Desktop | Expanded | 1024px+ | Table | ✓ | Expand | ✓ |

### Design Assessment

**Mobile (375px — Compact):**

```
┌─────────────────────────┐
│ 🌿 30 Plants This Week  │
│ 73 / 30 plants          │
│ ▓▓▓▓▓▓▓░░ [bar]        │
├─────────────────────────┤
│ ▶ Vegetables   (28)     │
│ ▶ Fruits       (12)     │
│ ...                     │
│                         │
│ [Expanded category]     │
│ ▼ Vegetables            │
│                         │
│ 🥦 Tomatoes             │
│    ❤️ Heart Health      │
│    Lycopene | 7 ▶       │
│                         │
│ ▼ Used in 7 meals       │
│ ✓ Pasta Night - Mon     │
│ ✓ Marengo - Wed         │
│ ...                     │
│                         │
│ Broaden variety:        │
│ • Cherry tom.           │
│ • Sun-dried             │
```

**Challenge:** Space is limited. Card layout needed, no table.

**Solution:** Use full-width cards, stack all fields.

**Feasibility:** ✓ Standard pattern

**Tablet (640px — Comfortable):**

```
┌────────────────────────────────┐
│ ▶ Vegetables  (28)             │
│ ▶ Fruits      (12)             │
│                                │
│ ▼ Vegetables                   │
│ Plant      | Support | Meals   │
│ 🥦 Tomato  | ❤️ Heart | 7 ▶   │
│ 🥬 Spinach | 🛡️ Immun | 5 ▶   │
│                                │
│ [Expanded meals for Tomatoes]  │
│ ▼ Used in 7 meals              │
│ ✓ Pasta Night - Monday         │
│ ✓ Marengo - Wednesday          │
│ ...                            │
```

**Challenge:** Rowspan works but nutrient column hidden (space constraint).

**Solution:** Show Plant | Support | Meals. Nutrient on hover or full details view.

**Feasibility:** ✓ Achievable with CSS

**Desktop (1024px+ — Expanded):**

```
Plant   | Support      | Nutrient    | Meals
🥦 Tom  | ❤️ Heart     | Lycopene    | 7 ▶
        | 🛡️ Immunity  | Vitamin C   |
        | ✨ Skin      | Potassium   |

🥬 Spin | 🛡️ Immunity  | Iron        | 5 ▶
```

**Challenge:** None. Rowspan works naturally.

**Solution:** Full 4-column table.

**Feasibility:** ✓ Standard

### CSS Implementation Strategy

**Recommended approach:**

```css
/* Desktop (default) — all columns visible */
.plant-table { display: table; }
.col-nutrient { display: table-cell; }

/* Tablet — hide nutrient, keep support/meals */
@media (max-width: 1024px) {
  .col-nutrient { display: none; }
  .plant-cell { width: 30%; }
  .support-cell { width: 40%; }
  .meals-cell { width: 30%; }
}

/* Mobile — switch to cards */
@media (max-width: 640px) {
  .plant-table { display: block; }
  .plant-row { display: block; margin-bottom: 1rem; }
  .plant-cell { display: block; width: 100%; font-weight: bold; }
  .support-cell { display: block; padding-left: 1rem; }
  .meals-cell { display: block; width: 100%; }
}
```

**Feasibility:** ✓ Standard responsive pattern

### Conclusion: Responsive Strategy

**Status: ✓ FEASIBLE**

All critical changes work across breakpoints. Mobile requires card layout (already planned). Tablet requires nutrient column hiding (CSS only). Desktop supports full rowspan. No hidden complexity.

---

## Amendments Required to Original Investigation

Based on critical changes review, the original THA_30_PLANTS_MODAL_V2.md requires these amendments:

### Section: "V2 Proposed Structure" → Level 3 Update

**Current text:**
```
Each plant row expandable
Plant rows sorted by meal frequency
One support per plant
```

**Amendment:**
```
Each plant row may span multiple lines (rowspan) if multiple supports exist
Plant rows sorted by meal frequency
Multiple supports displayed per plant (one support per row)
Meals expand inline (not displayed inline)
```

### Section: "Support↔Nutrient Mapping" → Add Detail

**Current:** Proposes 8 mappings, each with one support and one nutrient.

**Amendment:** 
```
Note: In UI, a single plant may display multiple support↔nutrient pairs.
Example: Tomatoes shows both "❤️ Heart Health → Lycopene" AND "🛡️ Immunity → Vitamin C".
This is acceptable; it teaches multiple health benefits from one plant.

However, a SINGLE support (e.g., "Heart Health") maps to exactly ONE nutrient (e.g., "Lycopene") globally.
This 1:1 support-nutrient mapping must be enforced at library level to avoid user confusion.
```

### Section: "Meal Expansion Design" → Clarification

**Current:** "Click '7 ▶' to expand"

**Amendment:**
```
The meal expansion button is prominent in the plant row.
When clicked, a full list of meals expands INLINE below the plant row (not in a separate accordion).
This expansion uses rowspan if multiple supports exist for the plant.

Example (Tomatoes with 3 supports):
[plant rowspan=3] [support 1] [meal button rowspan=3]
                  [support 2]
                  [support 3]
[expanded meals below — colspan all columns]
```

### New Section: "Multi-Support Plant Rows"

**Add after "Support↔Nutrient Mapping":**

```markdown
## Multi-Support Plant Rows

Plants may contribute to multiple health outcomes. When this occurs, show all supports in the modal.

### Example: Tomatoes

| Column | Display |
|--------|---------|
| Plant emoji + name | 🥦 Tomatoes |
| Support 1 | ❤️ Heart Health |
| Nutrient 1 | Lycopene |
| Meals [rowspan] | 7 ▶ |
| Support 2 | 🛡️ Immunity |
| Nutrient 2 | Vitamin C |
| Support 3 | ✨ Skin Health |
| Nutrient 3 | Potassium |

### Implementation

Use semantic `<table>` with rowspan on plant name and meal count.
On mobile, convert to card layout (no rowspan).

### Data Structure

Each PlantRow now has a `supports: SupportMapping[]` array instead of single nutrient.

```typescript
interface PlantRow {
  canonicalKey: string;
  displayName: string;
  category: PlantCategory;
  supports: SupportMapping[];  // Multiple supports
  variants: string[];
  mealNames: string[];
  dayNames: string[];
}

interface SupportMapping {
  support: string;         // "Heart Health"
  emoji: string;          // "❤️"
  keyNutrient: string;    // "Lycopene"
}
```
```

### Section: "Category Expansion Design" → Add Education

**Current:** Shows plant table only.

**Amendment:**
```
When a category is expanded, show optional category-level education summary before the plant table.

### Category Education Summary

Display (auto-derived):
- **Supports:** List unique support outcomes for all plants in category
- **Key Nutrients:** List unique nutrients for all plants in category
- **Plant Count:** Show total plants in category

Example (Seeds):
```
Supports: ❤️ Heart Health  😴 Sleep Quality  🛡️ Immunity
Nutrients: Magnesium  Zinc  Omega-3
Plants: 5 varieties used
```

This summary is automatically generated from plant data. No new database entries required.
```

### Section: "Try Next Suggestions" → Rename

**Current:** "Try next suggestions per plant"

**Amendment:**
```
### "Broaden Your Variety" Suggestions Per Plant

Formerly "Try next", now labeled "Broaden your variety" to emphasize variety encouragement.

Shows variant suggestions not yet used this week:

✗ Used: Vine tomatoes, Cherry tomatoes, Tinned tomatoes
✓ Broaden variety:
  • Sun-dried tomatoes
  • Roasted tomato chunks
  • Tomato paste
```

### Section: "Adaptive Density Wireframes" → Mobile Card Layout

**Current:** Mobile section shows stacked layout but still references table cells.

**Amendment:**
```
### Mobile (375px — Compact) — CARD LAYOUT

Switch from table to full-width cards on mobile. No rowspan needed.

```
┌─────────────────────────┐
│ ▼ Vegetables (28)       │
├─────────────────────────┤
│                         │
│ 🥦 TOMATOES             │
│                         │
│ ❤️ Heart Health         │
│    Lycopene             │
│ 7 meals ▶ [button]     │
│                         │
│ ▼ Used in 7 meals       │
│ ✓ Pasta Night - Mon     │
│ ✓ Marengo - Wed         │
│ ...                     │
│                         │
│ Broaden variety:        │
│ • Cherry tomatoes       │
│ • Sun-dried tomatoes    │
│                         │
```

Each support displayed as a separate line item within card.
```

### Section: "Missing Data" → Update Variants

**Current:** Nutrition benefit library is incomplete (36/200 ingredients).

**Amendment:**
```
Add variants to all nutrition-benefit-library entries (not just benefits).

Example:
```typescript
{
  name: "Tomatoes",
  category: "Vegetables",
  keyNutrients: ["Lycopene", "Vitamin C", "Potassium"],
  supports: [
    { support: "Heart Health", emoji: "❤️", nutrient: "Lycopene" },
    { support: "Immunity", emoji: "🛡️", nutrient: "Vitamin C" }
  ],
  variants: [
    "Cherry Tomatoes",
    "Vine Tomatoes",
    "Sun-Dried Tomatoes",
    "Roasted Tomatoes",
    "Tinned Tomatoes"
  ],
  summary: "Rich in lycopene..."
}
```

Data entry effort: +2–3 hours (Phase 1).
```

### Section: "Implementation Phases" → Phase 2 Update

**Current Phase 2 effort:** 3–4 days

**Amendment:**
```
### Phase 2 Revised (3–5 days)

Additional complexity from critical changes:

1. Rowspan handling for multi-support plants: +1 day
2. Nested category/plant/meals expansion state: +1 day
3. Category-level education summary: +0.5 days (auto-derived)
4. Mobile card layout (separate rendering): +0.5 days

Revised effort: **4–5 days** (was 3–4 days)

Note: "Broaden your variety" rename and inline meal expansion are 
already part of original design and require no additional effort.
```

### Section: "Effort Estimates" → Update Totals

**Current Phase 2 estimate:** 5 story points for "Table restructure"

**Amendment:**
```
| Task | Est. | Notes |
|------|-----|-------|
| Support↔Nutrient library | 3 | Data entry, 8–10 mappings |
| Expand benefits + variants | 5 | ~50 ingredients + 5–10 variants each |
| Support emoji system | 2 | Constants, simple |
| Refactor plant data structure (multi-support) | 2 | Add supports[] array |
| Category grid rebuild | 3 | Make collapsible, show counts |
| Table rowspan (multi-support) | 5 | Rowspan math, nested state |
| Meal expansion inline | 2 | Already designed, cleaner implementation |
| Category education summary | 2 | Auto-derive, no new data |
| Adaptive density (all breakpoints) | 5 | Cards on mobile, table on desktop |
| "Broaden your variety" label | 1 | Rename, use existing variant data |
| Animations & polish | 3 | Expand/collapse transitions |
| Testing & accessibility | 3 | Keyboard nav, rowspan handling |
| **Total (Updated MVP)** | **41** | ~3 weeks (no change from original) |
| **Total (With Extras)** | **49** | ~3.5 weeks |
```

**Rationale:** Additional rowspan complexity offset by simpler meal expansion logic.

---

## Hidden Complexity

### 1. Rowspan Math During Category Collapse

**Problem:** When categories collapse/expand, all plant rowspans below shift.

**Example:**
```
Before collapse:
Row 1: Category header
Row 2: Plant A (rowspan=2)
Row 3: Support 2 for Plant A
Row 4: Plant B (rowspan=1)
Row 5: Plant C (rowspan=3)
...

After collapsing Category:
All rows 2–5+ are hidden.
If Row 20 (Plant X) has rowspan=5, the rowspan now extends beyond visible rows.
```

**Solution:** Track visible row count, recalculate rowspans on collapse/expand.

**Effort:** Medium (1 day)

**Mitigation:** Use utility function to compute rowspan at render time.

### 2. Meal Expansion with Rowspan

**Problem:** Expanding meals creates a new table row spanning all columns. Must not break rowspan above.

**Example:**
```
<tr>
  <td rowspan="3">Plant</td>
  <td>Support 1</td>
  <td>Nutrient 1</td>
  <td rowspan="3">Meals</td>
</tr>
<tr>
  <td>Support 2</td>
  <td>Nutrient 2</td>
</tr>
<tr>
  <td>Support 3</td>
  <td>Nutrient 3</td>
</tr>
<!-- Meal expansion row — must span all columns -->
<tr>
  <td colspan="4">
    [Expanded meals list]
  </td>
</tr>
```

**Complexity:** Low if rowspan logic is clean.

**Mitigation:** Render plants + rowspans as a unit, append meal rows after.

### 3. Mobile Card Conversion

**Problem:** Table rowspan doesn't exist on mobile (cards don't use rowspan).

**Solution:** Duplicate rendering logic (table vs. cards) or use CSS to hide table + show cards.

**Effort:** 1 day

**Mitigation:** Use CSS `@media` to switch display modes, not JS-driven DOM manipulation.

### 4. State Explosion

**Problem:** 3-level nested expansion × 73 plants × 9 categories = complex state.

**Solution:** Hierarchical Set-based state (already designed in Change 3).

**Testing effort:** 1 day (to cover all combinations).

### 5. Accessibility of Rowspan

**Problem:** Screen readers may not announce rowspan relationships clearly.

**Solution:** Add ARIA labels:
```html
<td rowspan="3" aria-rowspan="3" aria-label="Tomatoes (3 supports)">
  🥦 Tomatoes
</td>
```

**Effort:** 0.5 day

### 6. Performance: Category Summaries

**Problem:** Auto-deriving category summaries on every render could be slow.

**Solution:** Memoize category summaries during component mount.

**Performance:** Negligible (9 categories × 8 supports each = ~72 operations).

**Effort:** Negligible

---

## Updated Implementation Estimates

### Revised Phase 1 (Data Infrastructure)

| Task | Original | Updated | Reason |
|------|----------|---------|--------|
| Support↔Nutrient library | 1 day | 1 day | No change |
| Expand benefits library | 1.5 days | 2 days | Add variant data |
| Support emoji system | 0.5 day | 0.5 day | No change |
| **Phase 1 Total** | **3 days** | **3.5 days** | +0.5 day for variants |

### Revised Phase 2 (Structure)

| Task | Original | Updated | Reason |
|------|----------|---------|--------|
| Category grid rebuild | 1 day | 1 day | No change |
| Table rowspan (multi-support) | 2 days | 3 days | Rowspan complexity |
| Nested expansion state | 0.5 day | 1 day | Tested thoroughly |
| Category education summary | — | 1 day | New feature |
| Meal expansion inline | 1 day | 0.5 day | Already designed |
| Adaptive density (all breakpoints) | 2 days | 2 days | No change |
| **Phase 2 Total** | **6.5 days** | **8.5 days** | +2 days |

### Revised Phase 3 (Polish)

| Task | Original | Updated | Reason |
|------|----------|---------|--------|
| "Broaden your variety" label | 0.5 day | 0.5 day | Rename only |
| Animations & polish | 1 day | 1.5 days | Rowspan animation |
| Testing & accessibility | 1 day | 1.5 days | Rowspan a11y testing |
| **Phase 3 Total** | **2.5 days** | **3.5 days** | +1 day |

### Revised Calendar

Assuming start 2026-06-17:

| Phase | Original | Updated | Dates | Deliverable |
|-------|----------|---------|-------|------------|
| 1 | 2–3 days | 3.5 days | Jun 17–21 | Data ready |
| 2 | 3–4 days | 4–5 days | Jun 24–28 | MVP structure |
| 3 | 2–3 days | 3–4 days | Jul 1–5 | Polished V2 |
| **Total** | **7–10 days** | **11–13 days** | **~2.5 weeks** | Ready to ship |

**Comparison to original estimate:** +2–3 days. Still within 3-week window if started immediately.

---

## Can Updated Design Be Implemented?

### Executive Answer: **YES — With Caveats**

**Summary:**
- ✓ All 5 critical changes are **implementable**
- ✓ No new data sources required
- ✓ Original investigation data structure supports all changes
- ✓ Effort increased by ~2–3 days (still within 3-week window)
- ⚠️ Rowspan complexity is the primary risk (manageable with careful implementation)
- ⚠️ Mobile card layout requires duplicate rendering logic (mitigation: CSS-only, no JS duplication)

### Detailed Assessment

| Change | Feasible? | Effort | Risk | Notes |
|--------|-----------|--------|------|-------|
| 1. Multi-support rowspan | ✓ YES | +2 days | MEDIUM | Rowspan math tricky, mitigatable |
| 2. Meals expand inline | ✓ YES | 0 days | LOW | Already designed |
| 3. 3-level nesting | ✓ YES | +1 day | LOW | Standard pattern, good state design |
| 4. "Broaden variety" | ✓ YES | +0.5 day | VERY LOW | Simple rename, use existing data |
| 5. Category education | ✓ YES | +1 day | LOW | Auto-derived, no new data |

### Risk Mitigation Summary

| Risk | Mitigation | Effort |
|------|-----------|--------|
| Rowspan breaks on collapse | Use utility function for dynamic rowspan | 1 day |
| Mobile card layout too complex | CSS-only switch, no JS duplication | 0.5 day |
| Screen reader confusion (rowspan) | Add ARIA labels | 0.5 day |
| Performance (category summaries) | Memoize at component load | negligible |
| State explosion (3-level nesting) | Hierarchical Set-based state | 1 day |

**Total risk mitigation effort:** 3 days (included in Phase 2–3 estimates)

### Recommended Approach

**Do NOT defer critical changes.** Implement them as part of Phase 2–3:

1. **Phase 1:** Expand data (variants, supports, benefits)
2. **Phase 2:** Rebuild table with rowspan + nested expansion + category education
3. **Phase 3:** Polish, accessibility testing, animations

**Do NOT do** a simpler v1 without critical changes and promise v2 later. The current design without multi-support rowspan will feel incomplete.

---

## Required Amendments to THA_30_PLANTS_MODAL_V2.md

### Summary of Changes

1. **Section "V2 Proposed Structure" → Level 3:** Add multi-support rowspan examples
2. **Section "Support↔Nutrient Mapping":** Clarify 1:1 support-nutrient mapping at library level
3. **New section "Multi-Support Plant Rows":** Document rowspan implementation
4. **Section "Category Expansion Design":** Add optional category education summary
5. **Section "Try Next Suggestions" → rename:** "Broaden Your Variety"
6. **Section "Adaptive Density Wireframes" → Mobile:** Update to card layout
7. **Section "Missing Data" → Variants:** Add variant data to nutrition-benefit-library
8. **Section "Implementation Phases" → Phase 2:** Update effort estimate (+1–2 days)
9. **Section "Effort Estimates":** Update story points and calendar

### Files to Update

- **Primary:** `docs/investigations/THA_30_PLANTS_MODAL_V2.md`
- **Reference:** This feasibility review (standalone)

### Level of Change

- **Major:** Section "V2 Proposed Structure" (add rowspan examples)
- **Medium:** Section "Implementation Phases" (effort increase)
- **Minor:** Section "Missing Data" (add variants detail)
- **Clarification:** Section "Support↔Nutrient Mapping" (no breaking changes)

---

## Conclusion

### Can the Updated Design Be Implemented?

**✓ YES — 100% feasible**

All five critical design refinements can be implemented with the data infrastructure already described in THA_30_PLANTS_MODAL_V2.md. No new data sources, APIs, or database schemas required.

### Amendments Needed?

**✓ YES — Update 7 sections**

The original investigation is strong but needs clarifications on:
1. Multi-support plant rowspan (new complexity)
2. Category-level education (new feature)
3. Variant data structure (new requirement)
4. Effort estimates (+2–3 days)

### Hidden Complexity?

**✓ YES — Manageable**

Key risks:
1. Rowspan math during collapse/expand (1 day mitigation)
2. Mobile card conversion (0.5 day mitigation)
3. Accessibility of rowspan (0.5 day mitigation)
4. State management at 3-level nesting (1 day mitigation)

**All mitigatable. No blockers.**

### Updated Implementation Effort?

**~11–13 days (2.5 weeks)** vs. original estimate of 10 days

- Phase 1: 3.5 days (was 2–3)
- Phase 2: 4–5 days (was 3–4)
- Phase 3: 3–4 days (was 2–3)

**Still ships within 3-week window if started immediately.**

### Recommendation

**Proceed with Phase 1 immediately.** All critical changes are feasible and worth implementing together. Do not defer multi-support rowspan to v2; it's essential to the "Plant Diversity Report" positioning.

---

## Confirmation: Investigation Only

This review is **research and design analysis only**:

✓ No component changes  
✓ No CSS modifications  
✓ No data structure changes  
✓ No code written  
✓ No commits beyond rollback  

**Working directory status:** Stashed during investigation, now restored.  
**Rollback available:** `git reset --hard rollback/30-plants-modal-v2-feasibility-review`

---

**Investigation completed:** 2026-06-16  
**Feasibility:** ✓ CONFIRMED — All changes implementable  
**Status:** Ready for Phase 1 approval
