# Meal Detail Experience V3 — The Trust Screen

**Investigation type:** Feasibility & Architecture Review  
**Date:** 2026-06-16  
**Status:** Complete — No code changes  
**Rollback identifier:** `rollback/meal-detail-v3-investigation` (tag at commit `67ee85e`)

---

## 1. Executive Summary

Meal Detail Page is positioned to become **The Trust Screen** — the moment where users understand why THA chose this meal, how it fits their household, what health improvements it offers, and how to cook it.

**Vision:**
```
Recipe + Household + Nutrition + Education + Simply Better Choices
    ↓
The Trust Screen
```

### Key Findings

1. **The foundation exists.** Current meal-detail-page.tsx has:
   - Image, serving controls, nutrition, ingredients, instructions ✓
   - Allergen data ✓
   - Category & diet tags ✓
   - Household adaptation modal (MealUpliftPanel) ✓
   - "Adapt recipe" actions (vegetarian, keto, less-processed, etc.) ✓

2. **Critical gap:** There is no visible section answering **"Why THA chose this"**
   - No compatibility indicators for the household
   - No plant/variety contribution metrics
   - No "meal-already-used-this-week" indicator
   - No visual summary of how this meal builds weekly health

3. **The V3 design is feasible.**
   - Household compatibility data exists (HouseholdSafeForSnapshot, EaterAdaptation)
   - Plant/variety scoring exists (explainability-service.ts, meal-scoring-service.ts)
   - Simply Better Choices interface exists (MealUpliftPanel)
   - Adaptive density framework is planned (Phase 1 starting)

4. **Progressive disclosure works.**
   - Section 1 (Why THA chose this) → Always visible
   - Section 2 (Household Adaptations) → Always visible
   - Section 3 (Simply Better Choices) → Expandable
   - Section 4 (Tabs: Ingredients/Recipe/Nutrition) → Existing, preserved

5. **Mobile-first implementation possible.**
   - Current 3-layout model (COMPACT / COMFORTABLE / EXPANDED) in THA audit covers all needs
   - Current meal-detail-page already uses adaptive margins and grid layouts
   - Image + summary side-by-side at EXPANDED density tier only (≥1280px)

---

## 2. Current Meal Detail Audit

### 2.1 Page Structure (meal-detail-page.tsx, lines 468–1203)

```
PageHeader
  ├─ Title: meal.name
  ├─ Context: category, servings, ingredient count
  └─ Actions: Edit, Add to Basket, Adapt, Delete, Save (if editing)

Motion container (pt-4 sm:pt-6)
  ├─ Edit mode: Name input (if isEditedCopy && isEditing)
  │
  ├─ Adapt results: Card[] (if adaptResults.length > 0)
  │
  └─ Main grid (grid-cols-1 md:col-span-3 gap-6)
        ├─ LEFT COLUMN (md:col-span-1)
        │   ├─ Image (meal.imageUrl or placeholder)
        │   ├─ Badges: Category, Servings, Diet tags
        │   ├─ Allergens section (if allergens.length > 0)
        │   └─ Nutrition card (if nutritionData exists)
        │
        └─ RIGHT COLUMNS (md:col-span-2)
              ├─ Card: Ingredients (view / edit modes)
              └─ Card: Instructions (view / edit / grouped modes)
```

### 2.2 Data Flow

**Queries (useQuery):**
- `api.meals.get` → Meal (name, ingredients, instructions, servings, categoryId, sourceUrl, mealFormat)
- `api.nutrition.get` → Nutrition (calories, protein, carbs, fat, sugar, salt, source)
- `api.allergens.get` → MealAllergen[] (allergen names)
- `api.categories.list` → MealCategory[] (all categories for lookup)
- `api.diets.list` → Diet[] (all diets for lookup)
- `api.diets.getMealDiets` → MealDiet[] (meal's assigned diets)
- `api.meals.list` (if mealFormat === "grouped") → Meal[] (for grouped meal components)

**Mutations:**
- `copyMutation` → Create editable copy
- `saveMutation` → Save changes
- `saveAsMutation` → Save as new recipe
- `deleteMutation` → Delete meal
- `addToListMutation` → Add to shopping list
- `reimportMutation` → Reimport instructions from URL
- `applyAdaptations` → POST `/api/meals/{id}/adapt` with goal

### 2.3 Current Sections

| Section | Component | Always visible? | Editable? | Data source |
|---------|-----------|-----------------|-----------|-------------|
| **Image** | `<img>` or placeholder | Yes | No | meal.imageUrl |
| **Title** | PageHeader or Input | Yes | If editing | meal.name |
| **Category badge** | Badge | Yes | No | allCategories lookup |
| **Servings** | Badge or counter | Yes | Yes (if editing) | meal.servings |
| **Diet tags** | Badge[] | Yes | No | mealDiets → allDiets |
| **Allergens** | Card (if any) | Conditional | No | allergens |
| **Nutrition** | Card (if data exists) | Conditional | No | nutritionData |
| **Ingredients** | Card | Yes | Yes (if editing) | meal.ingredients |
| **Instructions** | Card | Yes | Yes (if editing) | meal.instructions |
| **Adapt results** | Card[] | Conditional | Yes (remove results) | adaptResults state |
| **Adapt button** | PageHeader action | Yes | No | — |

### 2.4 Current Interaction Patterns

**View mode (original recipe):**
- Page displays meal as read-only
- User can: view all data, adjust servings (view only), add to basket, trigger adapt, delete, create copy

**Edit mode (edited copy):**
- Name, ingredients, instructions all editable inline
- Save, Save as new, or exit without saving
- Adapt not available during edit mode

**Adaptation workflow:**
- User clicks "Adapt" button
- Popover opens with 6 adaptation goals (household, vegetarian, keto, lower-cost, less-processed, under-time)
- User selects goals, clicks Apply
- Server returns AdaptResult[] with explanation + ingredient changes
- Results display as Card[] above ingredients section
- User can dismiss individual results

---

## 3. Data Inventory

### 3.1 "Why THA chose this" — What exists vs. missing

#### Currently available in meal-detail-page:
- ✅ **Meal.categoryId** → Category name (e.g. "Dinner", "Breakfast")
- ✅ **Nutrition data** → Calories, protein, carbs, fat, sugar, salt (but not yet displayed as "contribution")
- ✅ **Meal.dietTypes** → Array of diet tags (e.g. ["vegetarian", "gluten-free"])
- ✅ **MealDiet** → Dietary compatibility (e.g. Mediterranean, low-sodium)
- ✅ **Allergens** → Already displayed, safe/unsafe indicators

#### Available in meal-scoring-service.ts (backend):
- ✅ **varietyScore** (0–100) — measure of plant variety contribution
- ✅ **varietyScore explanation** — "Adds variety to your protein sources this week"
- ✅ **budgetAlignment** — cost tier alignment
- ✅ **dietMatch** — percentage of household eaters it suits
- ✅ **mealScoring.reasons** — human-readable explanations

#### Available in planner context (weekly-planner-page.tsx):
- ✅ **PlannerEntry** → know which week/day the meal appears
- ✅ **How many times this meal used in plan** — can derive from planner entries
- ✅ **Complementary meals in the week** — can derive from other planner entries

#### **NOT currently available (would need backend):**
- ❌ **Plant count** (0–N) — e.g. "Contributes 6 plants to your week"
- ❌ **Weekly variety delta** — how much does adding this meal increase weekly variety?
- ❌ **Household compatibility %" — e.g. "Fits 4 of 4 household members"
- ❌ **Eater-specific adaptations needed** — which family members need changes?
- ❌ **Is this a "family favourite"** (planner reuse count, user ratings)
- ❌ **Ingredients-already-in-week indicator** — "Uses 5 ingredients you're buying anyway"

---

### 3.2 "Household Adaptations" — What exists vs. missing

#### Currently available:
- ✅ **HouseholdSafeForSnapshot** — knows which eaters + restrictions at variant creation
- ✅ **HouseholdSafePreview** — ingredient changes needed for household safety
- ✅ **EaterAdaptation** → eater name, change type (none/swap/add_on/omission), note
- ✅ **Adapt action** (goal: "household") → already triggers AI-generated adaptation

#### Available in adaptation-service (inferred):
- ✅ **Dietary restriction matching** — knows vegetarian, keto, dairy-free, gluten-free, etc.
- ✅ **Substitution logic** — can generate swaps (e.g. "Chicken → Quorn")

#### **NOT currently available:**
- ❌ **Household member names** on the meal-detail page (only available on planner if entry has adaptationResult)
- ❌ **Pre-computed compatibility summary** — e.g. "3 of 4 eaters, changes needed for Emma"
- ❌ **Explicit visual per-eater breakdown** (eater name + required change + explanation)

---

### 3.3 "Simply Better Choices" — What exists vs. missing

#### Currently available:
- ✅ **MealUpliftPanel.tsx** → Shows uplift ideas (Simply Better Choices)
- ✅ **Uplift actions** → add, swap, remove
- ✅ **Simply Better Choices interface** with provenance labels
- ✅ **Backend uplift rules** (uplift-rules.ts) — ingredient suggestions with "why" text
- ✅ **Plant variety framing** — "Adds fibre and plant variety"

#### Currently NOT shown on meal-detail:
- ❌ **MealUpliftPanel is only rendered on weekly-planner-page** (planner meal modal)
- ❌ **Not visible on standalone meal-detail-page.tsx**
- ❌ **Would need to be extracted and made reusable** for V3

---

### 3.4 Data Summary Table

| Information | Current? | Visible on detail page? | Data source | Effort to add |
|---|---|---|---|---|
| **WHY THA CHOSE THIS** | | | | |
| Category/meal type | ✅ Yes | ✅ Badge | meal.categoryId | 0 |
| Compatible diets | ✅ Yes | ✅ Badges | mealDiets | 0 |
| Variety contribution | ✅ Yes (backend) | ❌ No | meal-scoring-service | ~2 days |
| Plant count | ❌ No | ❌ — | — | ~3–5 days |
| Cost alignment | ✅ Yes (backend) | ❌ No | meal-scoring-service | ~2 days |
| Household fit % | ❌ No | ❌ — | — | ~2 days |
| Family favourite | ❌ No | ❌ — | — | ~1–2 days |
| **HOUSEHOLD ADAPTATIONS** | | | | |
| Eater compatibility | ✅ Yes | ❌ Modal only | adaptation-service | ~1 day |
| Per-eater changes | ✅ Yes | ❌ Modal only | adaptation-service | ~1 day |
| Substitution options | ✅ Yes | ❌ Modal only | adaptation-service | 0 |
| **SIMPLY BETTER CHOICES** | | | | |
| Uplift suggestions | ✅ Yes | ❌ Missing | uplift-rules.ts | ~1 day |
| Per-item benefits | ✅ Yes | ❌ Missing | uplift-rules.ts | 0 |
| How to use | ✅ Yes | ❌ Missing | uplift-rules.ts | 0 |

---

## 4. V3 Architecture

### 4.1 Proposed Layout — All Densities

#### SECTION 0: HEADER (always visible)

```
┌─────────────────────────────────────┐
│ [Image/Summary]                     │
│                                     │
│ Meal Name                           │
│ Family Table · Comfort              │
│ [Variety indicator] ↳ SBC count     │
└─────────────────────────────────────┘
```

**Data:**
- meal.name
- meal.imageUrl (or placeholder)
- Inferred tags: "Family Table" (if fits multiple eaters), "Comfort" (if high reuse/scores)
- Variety indicator: plant count (future) or variety chip (current)
- Simply Better Choices count

---

#### SECTION 1: WHY THA CHOSE THIS (always visible)

```
┌────────────────────────────────────┐
│ Why THA chose this                 │
├────────────────────────────────────┤
│ ✓ Fits 4 of 4 eaters              │
│ ✓ Mediterranean friendly            │
│ ✓ Family favourite                  │
│ ✓ Contributes 6 plants              │
│ ✓ Supports weekly variety           │
│ ✓ Uses ingredients already in week  │
└────────────────────────────────────┘
```

**Data sources:**
- `Fits X of Y eaters` → compute from HouseholdSafeEaterSnapshot or household.eaters
- `X friendly` → mealDiets → allDiets (e.g. "Mediterranean", "Low-sodium")
- `Family favourite` → planner reuse count (how many times in last N weeks?)
- `Contributes X plants` → plant counting logic (new or enhanced)
- `Supports weekly variety` → variety score from meal-scoring-service
- `Uses ingredients already in week` → compare ingredients to other planner entries

**Design:**
- Checkmark icon + brief text
- Max 6 reasons (truncate if more)
- Never behind a tab — always visible

---

#### SECTION 2: HOUSEHOLD ADAPTATIONS (always visible)

```
┌────────────────────────────────────────────────────┐
│ Household Adaptations                              │
├────────────────────────────────────────────────────┤
│ Lilly                                              │
│   Vegetarian                                       │
│   Swap: Chicken → Quorn                            │
│                                                    │
│ Daisy                                              │
│   No changes required                              │
│   ✓ Fully compatible                              │
│                                                    │
│ Emma, Jack                                         │
│   (No restrictions on file — may need changes)    │
└────────────────────────────────────────────────────┘
```

**Data sources:**
- Household.eaters (or context)
- Trigger adapt action (goal: "household") to get EaterAdaptation[]
- Display: eater name, change type, substitution (if swap), note

**Design:**
- One group per eater (or per shared restriction)
- Substitution shown as visual flow: `Original → Replacement`
- Checkmark for "no changes needed"
- Note for "no restrictions on file"
- Never behind a tab — always visible

---

#### SECTION 3: SIMPLY BETTER CHOICES (expandable)

```
┌──────────────────────────────────────────────┐
│ Simply Better Choices (3)                    │
│ [+] Expand / [-] Collapse                    │
├──────────────────────────────────────────────┤
│ If collapsed: hint: "3 healthier swaps …"    │
│                                              │
│ If expanded:                                 │
│  ┌─────────────────────────────────────────┐ │
│  │ Spinach                                 │ │
│  │ Anti-inflammatory, rich in iron         │ │
│  │ Add fresh after baking                  │ │
│  │ ☐ Already used this week                │ │
│  │ [+ Add to meal] [- Remove]              │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │ Red lentils                             │ │
│  │ Fibre + plant variety                   │ │
│  │ Blend into bolognese invisibly          │ │
│  │ ☐ Already used this week                │ │
│  │ [+ Add to meal] [- Remove]              │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

**Data sources:**
- MealUpliftPanel.tsx + uplift-rules.ts
- Benefits: from uplift rule `why` text
- How to use: from uplift rule `how` text (if available)
- Already used this week: query planner entries for ingredient matches

**Design:**
- Initially collapsed with hint text
- Expandable to show full list
- Each item: ingredient name, benefits, how to use, weekly indicator, actions
- Never a tab — expandable section for progressive disclosure

---

#### SECTION 4: TABS (Ingredients, Recipe, Nutrition)

**Preserved from current design.**

```
┌──────────────────────────────────────────────────┐
│ [Ingredients] [Recipe] [Nutrition]               │
├──────────────────────────────────────────────────┤
│                                                  │
│ ... content for selected tab ...                 │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

### 4.2 Responsive Density Layouts

#### COMPACT (< 640px — phone portrait)

```
┌────────────────────┐
│ Image (square)     │
├────────────────────┤
│ Title              │
│ Tags               │
│                    │
│ Why THA chose this │ ← Checkmarks, compact text
│                    │
│ Household          │ ← Per-eater, narrow
│ Adaptations        │
│                    │
│ Simply Better      │ ← Collapsed by default
│ Choices (3)        │   [Expand] hint
│                    │
│ [Ingredients]      │ ← Tab selection buttons
│ [Recipe]           │   Compact icon-only if needed
│ [Nutrition]        │
│                    │
│ Tab content...     │
└────────────────────┘
```

**CSS classes:**
- Image: `w-full h-auto aspect-square`
- Text: `text-sm` for body, `text-lg` for section headers
- Padding: `p-3 sm:p-4` (not tighter than current)
- Grid: single column (`grid-cols-1`)

---

#### COMFORTABLE (640–1279px — tablet, small laptop)

```
┌─────────────────────────────────────────────┐
│ Image (square)   Title                      │
│ (50%)           Family Table · Comfort      │
│                 Variety indicator           │
│                                             │
│                 Why THA chose this          │ ← More breathing room
│                 ✓ Fits 4 of 4 eaters       │
│                 ✓ Mediterranean friendly    │
│                 ✓ Family favourite          │
│                 ✓ Contributes 6 plants      │
│                                             │
│                 Household Adaptations       │
│                 [Eater blocks]              │
│                                             │
│                 Simply Better Choices (3)   │ ← Closed by default
│                                             │
│ ────────────────────────────────────────────│
│ [Ingredients]  [Recipe]  [Nutrition]        │ ← Tab bar
│ ────────────────────────────────────────────│
│                                             │
│ Tab content (full width)                    │
│                                             │
└─────────────────────────────────────────────┘
```

**CSS classes:**
- Image + Title: `grid grid-cols-1 md:grid-cols-2 gap-6`
- Image: `md:col-span-1 h-auto`
- Title section: `md:col-span-1`
- Text: `text-sm md:text-base` (scale up slightly)
- Padding: `p-4 md:p-5` (current baseline)
- Section boxes: `rounded-lg border p-5 space-y-3`

---

#### EXPANDED (≥ 1280px — large desktop, ultrawide)

```
┌──────────────────────────────────────────────────────────┐
│ Image              Title · Family Table · Comfort        │
│ (square, larger)   Variety [SBC: 3]                      │
│                                                          │
│                    Why THA chose this                    │
│                    ✓ Fits 4 of 4 eaters                 │
│                    ✓ Mediterranean friendly              │
│                    ✓ Family favourite                    │
│                    ✓ Contributes 6 plants                │
│                    ✓ Supports weekly variety             │
│                    ✓ Uses ingredients already in week    │
│                                                          │
│                    Household Adaptations (4 eaters)     │
│                    [Eater blocks in grid or flex]        │
│                                                          │
│ ─────────────────────────────────────────────────────────│
│                    Simply Better Choices (3)             │
│                    [Expandable cards in grid]            │
│                                                          │
│ ─────────────────────────────────────────────────────────│
│                                                          │
│ [Ingredients]   [Recipe]   [Nutrition]                   │
│ ─────────────────────────────────────────────────────────│
│                                                          │
│ Tab content (full width, more breathing room)            │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**CSS classes:**
- Grid: `grid lg:grid-cols-[400px_1fr] gap-8` (image fixed width, summary flows)
- Image: `lg:col-span-1 h-[400px]` (larger, fixed aspect)
- Title section: `lg:col-span-1`
- Text: `text-base lg:text-lg` (more generous)
- Padding: `p-5 lg:p-6` (airy)
- Section boxes: `rounded-lg border p-6 space-y-4` (more whitespace)

**Question: Should image + summary be side-by-side at EXPANDED?**
- **Yes, at ≥1280px.**
- Image stays square (400×400 or 450×450)
- Summary flows to the right with max-width constraint
- Visually balanced, less scroll needed to see full section

---

### 4.3 Interaction Model

#### "Why THA chose this" section

- **Always expanded**
- Max 6 reasons (most important 6)
- If more than 6: show top 6, add "[+2 more]" link → expand remaining below

#### "Household Adaptations" section

- **Always expanded (normal view)**
- Show all eaters at once (not a popover)
- If > 4 eaters: arrange in grid or list with horizontal scroll if needed
- Action: Click an eater → show more detail (optional expansion)

#### "Simply Better Choices" section

- **Collapsed by default** (toggle icon)
- Collapsed state: "3 Simply Better Choices — Add ingredients to make this even healthier"
- Expanded state: Show all uplift ideas
- Per-item actions: [+ Add to meal] [- Remove]
- No separate modal — all inline

#### Tab section (Ingredients / Recipe / Nutrition)

- **Identical to current design**
- Tabs always visible
- Content swaps below

---

## 5. Compact Wireframe (Phone Portrait, < 640px)

```
╔═══════════════════════════════════════╗
║ PageHeader: [Back] Chicken Curry [⋯]  ║
╠═══════════════════════════════════════╣
║                                       ║
║        ╔═══════════════════════╗      ║
║        ║                       ║      ║
║        ║     [Image]           ║      ║
║        ║    (square)           ║      ║
║        ║                       ║      ║
║        ║                       ║      ║
║        ╚═══════════════════════╝      ║
║                                       ║
║  Family Table · Comfort               ║
║  🌿 Variety: High                     ║
║  Simply Better Choices: 3             ║
║                                       ║
║ ─────────────────────────────────────  ║
║ Why THA chose this                     ║
║ ─────────────────────────────────────  ║
║ ✓ Fits 4 of 4 eaters                  ║
║ ✓ Mediterranean friendly               ║
║ ✓ Family favourite                     ║
║ ✓ Contributes 6 plants                 ║
║ ✓ Supports weekly variety              ║
║ ✓ Uses ingredients already in week     ║
║                                       ║
║ ─────────────────────────────────────  ║
║ Household Adaptations                 ║
║ ─────────────────────────────────────  ║
║                                       ║
║ Lilly                                  ║
║ Vegetarian                             ║
║ Swap: Chicken → Quorn                  ║
║                                       ║
║ Daisy                                  ║
║ No changes required ✓                  ║
║                                       ║
║ ─────────────────────────────────────  ║
║ Simply Better Choices (3)          [⌄] ║
║ Add ingredients to make healthier      ║
║                                       ║
║ ─────────────────────────────────────  ║
║ [Ingredients] [Recipe] [Nutrition]     ║
║ ─────────────────────────────────────  ║
║                                       ║
║ • 4 chicken thighs                     ║
║ • 2 tbsp coconut oil                   ║
║ • 400g tinned tomatoes                 ║
║ • 1 onion, chopped                     ║
║ • 3 cloves garlic                      ║
║                                       ║
║ [+ Add to basket]                      ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

## 6. Comfortable Wireframe (Tablet / Small Laptop, 640–1279px)

```
╔═══════════════════════════════════════════════════════════════════╗
║ PageHeader: [Back] Chicken Curry [Edit] [Basket] [Adapt] [Delete] ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║  ╔═══════════════════╗  Chicken Curry                             ║
║  ║                   ║  Family Table · Comfort                    ║
║  ║   [Image]         ║  🌿 Variety: High                          ║
║  ║   (square)        ║  Simply Better Choices: 3                  ║
║  ║                   ║                                            ║
║  ║                   ║  Dietary tags:                             ║
║  ║                   ║  [Mediterranean] [Dairy-free]              ║
║  ║                   ║                                            ║
║  ║                   ║  Allergens:                                ║
║  ║                   ║  ⚠ Sesame                                  ║
║  ╚═══════════════════╝                                            ║
║                                                                   ║
║  ─────────────────────────────────────────────────────────────  ║
║  Why THA chose this                                              ║
║  ─────────────────────────────────────────────────────────────  ║
║  ✓ Fits 4 of 4 eaters                                           ║
║  ✓ Mediterranean friendly                                        ║
║  ✓ Family favourite                                              ║
║  ✓ Contributes 6 plants                                          ║
║  ✓ Supports weekly variety                                       ║
║  ✓ Uses ingredients already in week                              ║
║                                                                   ║
║  ─────────────────────────────────────────────────────────────  ║
║  Household Adaptations                                           ║
║  ─────────────────────────────────────────────────────────────  ║
║                                                                   ║
║  Lilly                          Daisy                            ║
║  Vegetarian                     No changes required ✓            ║
║  Swap: Chicken → Quorn                                           ║
║                                                                   ║
║  ─────────────────────────────────────────────────────────────  ║
║  Simply Better Choices (3)                                 [⌄]   ║
║  Add ingredients to make this even healthier                     ║
║                                                                   ║
║  ─────────────────────────────────────────────────────────────  ║
║                                                                   ║
║  [Ingredients] [Recipe] [Nutrition]                              ║
║  ─────────────────────────────────────────────────────────────  ║
║                                                                   ║
║  Serves 4 · Adjust: [−] 2 [+]                                    ║
║                                                                   ║
║  • 4 chicken thighs (120g per serving)                            ║
║  • 2 tbsp coconut oil (½ tbsp per serving)                        ║
║  • 400g tinned tomatoes (100g per serving)                        ║
║  • 1 onion, chopped (¼ per serving)                               ║
║  • 3 cloves garlic (¾ per serving)                                ║
║  • 1 tbsp curry powder                                            ║
║  • ½ tsp turmeric                                                 ║
║  • 200ml coconut milk                                             ║
║                                                                   ║
║  ─────────────────────────────────────────────────────────────  ║
║  [+ Add to basket]                                                ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 7. Expanded Wireframe (Large Desktop, ≥ 1280px)

```
╔══════════════════════════════════════════════════════════════════════════════╗
║ PageHeader: [Back] [Edit] [Basket] [Adapt] [Delete]                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║ ╔══════════════════╗  Chicken Curry                                          ║
║ ║                  ║  Family Table · Comfort · Mediterranean · Dairy-free    ║
║ ║   [Image]        ║  🌿 Variety: High  ·  Simply Better Choices: 3          ║
║ ║  (450×450)       ║                                                         ║
║ ║                  ║  ⚠ Allergen: Sesame                                    ║
║ ║                  ║                                                         ║
║ ║                  ║  NUTRITION (per serving)                                ║
║ ║                  ║  ┌──────────────────────────────────────┐               ║
║ ║                  ║  │ 🔥 285 cal  │ 🥩 28g protein │ 🌾 18g carbs         ║
║ ║                  ║  │ 🧈 12g fat  │ 🍪 2g sugar    │ 🧂 0.8g salt          ║
║ ║                  ║  └──────────────────────────────────────┘               ║
║ ║                  ║                                                         ║
║ ╚══════════════════╝                                                         ║
║                                                                              ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  Why THA chose this                                                          ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  ✓ Fits 4 of 4 eaters      ✓ Family favourite                               ║
║  ✓ Mediterranean friendly   ✓ Contributes 6 plants                           ║
║  ✓ Supports weekly variety  ✓ Uses ingredients already in week               ║
║                                                                              ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  Household Adaptations                                                       ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║                                                                              ║
║  ┌─────────────────────────────────────┬──────────────────────────────────┐  ║
║  │ Lilly                               │ Daisy                             │  ║
║  │ Vegetarian                          │ No changes required ✓             │  ║
║  │ Swap: Chicken → Quorn               │                                  │  ║
║  │ Why: Plant-based protein            │                                  │  ║
║  └─────────────────────────────────────┴──────────────────────────────────┘  ║
║                                                                              ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  Simply Better Choices (3)                                             [⌄]   ║
║  Add ingredients to make this even healthier                                 ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║  (collapsed preview — [+] Expand all)                                        ║
║                                                                              ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║                                                                              ║
║  [Ingredients]  [Recipe]  [Nutrition]                                        ║
║                                                                              ║
║  ──────────────────────────────────────────────────────────────────────────  ║
║                                                                              ║
║  Serves 4                                                                    ║
║  Adjust servings: [−] 2 [+]                                                  ║
║                                                                              ║
║  INGREDIENTS (all scaled to 2 servings):                                     ║
║  • 2 chicken thighs (240g)            • 1 tbsp curry powder                 ║
║  • 1 tbsp coconut oil                 • ¼ tsp turmeric                      ║
║  • 200g tinned tomatoes               • 100ml coconut milk                   ║
║  • ½ onion, chopped                   • Salt & pepper to taste              ║
║  • 1½ cloves garlic                                                         ║
║                                                                              ║
║  [+ Add to basket]                                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 8. Progressive Disclosure Rules

### Rule 1: "Why THA chose this"
- **ALWAYS visible** (expanded)
- Never tab, never collapsible
- Show max 6 reasons (top priority)
- If > 6: show 6 + "[+2 more]" → expand below

### Rule 2: "Household Adaptations"
- **ALWAYS visible** (expanded)
- Never tab, never collapsible
- Show all eaters
- If > 4 eaters: arrange in flex row or 2-column grid (responsive)
- Never truncate eater names

### Rule 3: "Simply Better Choices"
- **Collapsed by default** (toggle icon in header)
- Collapsed: show hint text only
- Expanded: show all items
- Each item expandable for more details (optional)

### Rule 4: "Ingredients / Recipe / Nutrition"
- **Preserved as tabs** from current design
- Always visible as tab bar
- One active at a time
- No changes to existing pattern

### Rule 5: "Image + Metadata"
- **COMPACT / COMFORTABLE**: Image full-width above title
- **EXPANDED**: Image side-by-side (left 450px, summary flows right)
- Image always square aspect ratio
- Metadata (tags, allergens, nutrition) always visible near image

---

## 9. Missing Data / Required Enhancements

### 9.1 Backend / Data Changes Needed

| Feature | Current? | Where missing? | Effort | Blocker? |
|---------|----------|---|---|---|
| **Plant count per meal** | Partial (scoring exists, not exposed) | meal-detail-page | 3–5 days | No |
| **Variety contribution %** | Yes (meal-scoring-service) | Not exposed to detail page | 2 days | No |
| **Household fit %** (e.g. "4 of 4 eaters") | No | Would need household context on detail page | 1–2 days | No |
| **Weekly reuse count** (e.g. "used 3× this month") | Partial (planner data exists) | Needs aggregation query | 1–2 days | No |
| **Ingredients-already-in-week** | No | Needs comparison to planner entries | 2–3 days | No |
| **Eater names on detail page** | No (available in planner modal only) | Needs household context in scope | 1 day | No |
| **Expanded household adaptation** | Exists in modal, not on detail page | Would need to extract MealUpliftPanel logic | 1 day | No |
| **Simply Better Choices on detail page** | Exists in planner modal, not here | Would need to extract + reuse MealUpliftPanel | 1–2 days | No |
| **Per-adaptation explanations** | Partial (AI provides, not fully displayed) | Expand display of reasoning | 1 day | No |

### 9.2 Frontend / UI Changes Needed

| Feature | Current? | Component | Effort | Blocker? |
|---------|----------|---|---|---|
| **Section 1: Why THA chose this** | No | New component `MealTrustSummary` | 1–2 days | No |
| **Section 2: Household Adaptations** | Partial (modal only) | Extract from modal, make inline | 1–2 days | No |
| **Section 3: Simply Better Choices** | No (exists in modal only) | Extract MealUpliftPanel, adapt to detail page | 1 day | No |
| **Density-aware layout** | Partial (current page has some) | Integrate with adaptive-density hook (Phase 1 THA) | 1–2 days | No |
| **Image + summary side-by-side** | No | Conditional layout at EXPANDED density | 1 day | No |

### 9.3 Implementation Order

**Phase 1 (Foundation):**
1. Extract and reuse MealUpliftPanel as standalone component
2. Create `MealTrustSummary` component for "Why THA chose this"
3. Create `HouseholdAdaptationSummary` component for inline adaptations

**Phase 2 (Data):**
1. Expose plant count to detail page (derive from meal or backend)
2. Expose household fit % (need household context)
3. Add weekly reuse count indicator
4. Add ingredients-already-in-week matching

**Phase 3 (Layouts):**
1. Implement adaptive density layouts (COMPACT / COMFORTABLE / EXPANDED)
2. Side-by-side image + summary at EXPANDED
3. Responsive eater grid for adaptations

---

## 10. Implementation Phases

### Phase 1: "Trust Screen — Core Structure" (~3–4 days)

**Goal:** Wire up sections 1–3 with available data, establish layout

**Tasks:**
1. Extract `MealUpliftPanel` to reusable component `SimplyBetterChoicesPanel`
2. Create `MealTrustSummary` component
   - Hardcoded reasons for MVP (category, diet tags, allergen-free)
   - Future: integrate with meal-scoring-service
3. Create `HouseholdAdaptationSummary` component
   - Show household context if available
   - Trigger adapt action for "household" goal
   - Display eater names + changes inline
4. Refactor meal-detail-page layout
   - Add new sections above current ingredients/instructions
   - Preserve existing tabs unchanged
5. Test at 375px, 768px, 1024px, 1440px

**Output:** Meal Detail V3 with 3 new sections, ready for data backend

---

### Phase 2: "Plant & Variety Data" (~3–4 days)

**Goal:** Populate Section 1 with real plant count and variety metrics

**Tasks:**
1. Expose plant count from backend (new API endpoint or enhanced `/nutrition`)
2. Expose variety score from meal-scoring-service to detail page
3. Implement "weekly reuse count" query (planner entries for this meal)
4. Implement "ingredients-already-in-week" matching (if household context available)
5. Update `MealTrustSummary` to consume real data
6. Test with sample meals

**Output:** "Why THA chose this" section showing real, computed reasons

---

### Phase 3: "Adaptive Density & Polish" (~2–3 days)

**Goal:** Implement COMPACT / COMFORTABLE / EXPANDED layouts, side-by-side image

**Tasks:**
1. Integrate with adaptive-density hook (assumes Phase 1 of THA audit done)
2. Implement COMPACT layout (stacked, tighter spacing)
3. Implement COMFORTABLE layout (current baseline + breathing room)
4. Implement EXPANDED layout (image + summary side-by-side, 450px image)
5. Responsive eater grid for household adaptations
6. Test at all density breakpoints

**Output:** Meal Detail V3 fully responsive across all device sizes

---

### Phase 4: "Mobile Gestures & Interactions" (~1–2 days)

**Goal:** Smooth interactions, loading states, error handling

**Tasks:**
1. Add loading state for adapt action
2. Add error state for failed adaptations
3. Smooth section expand/collapse animations
4. Mobile-optimized touch targets (min 44px)
5. Accessibility review (headings, contrast, ARIA)
6. Test on iOS Safari, Chrome Android

**Output:** Meal Detail V3 ready for user testing

---

## 11. Key Questions Answered

### Q1: Can Meal Detail become THA's Trust Screen?

**YES.** The foundation is solid:
- Image & title exist ✓
- Household adaptation logic exists ✓
- Simply Better Choices exist ✓
- Nutrition data exists ✓
- Allergen data exists ✓

The missing piece is **presentation**: making these hidden or scattered data visible and cohesive.

---

### Q2: Does "Why THA chose this" belong permanently visible?

**YES.** This is THA's core value prop:
- Users don't trust algorithms they can't see
- The "why" should be as prominent as the recipe itself
- A collapsed section would defeat the purpose
- Never put this behind a tab

---

### Q3: Should "Household Adaptations" always remain visible?

**YES.** Household fit is essential:
- If a meal doesn't work for someone, that's critical info upfront
- Buried in a modal, users might not discover it before cooking
- Visible adaptations build trust in THA's household awareness
- Responsive grid handles ≥4 eaters without clutter

---

### Q4: Should "Simply Better Choices" be expandable?

**YES.** Progressive disclosure is key:
- 3–6 suggestions is helpful, but not critical upfront
- Users want to see the recipe first
- Expandable section keeps the page uncluttered
- Collapsed hint text still teases the feature

---

### Q5: What existing backend capabilities support this already?

**Strong support exists:**
- ✅ Household adaptation (HouseholdSafeForSnapshot, EaterAdaptation, adapt API)
- ✅ Meal scoring (varietyScore, budgetAlignment, dietMatch)
- ✅ Uplift suggestions (uplift-rules.ts, MealUpliftPanel)
- ✅ Allergen data (meal_allergens table)
- ✅ Nutrition data (nutrition table)
- ✅ Dietary tags (meal_diets table)

---

### Q6: What is missing?

**Frontend:**
- Section components (MealTrustSummary, HouseholdAdaptationSummary)
- Reusable SimplyBetterChoicesPanel (extracted from modal)
- Adaptive density layouts

**Backend / Data:**
- Plant count endpoint (or derived field)
- Household fit % computation
- Weekly reuse count aggregation
- Ingredients-already-in-week matching

**None of these are blockers** — all are straightforward, 1–3 days each.

---

### Q7: Estimated implementation effort?

| Phase | Duration | Complexity |
|-------|----------|-----------|
| 1. Core structure + layout | 3–4 days | Medium |
| 2. Plant & variety data | 3–4 days | Medium |
| 3. Adaptive density & polish | 2–3 days | Medium |
| 4. Mobile interactions & A11y | 1–2 days | Low |
| **Total** | **~9–13 days** | **Medium overall** |

**Dependencies:**
- Phase 1 is independent — can start immediately
- Phase 2 requires backend queries (can parallelize with Phase 1)
- Phase 3 requires adaptive-density hook (Phase 1 of THA audit)
- Phase 4 depends on Phases 1–3 being complete

**Risk mitigation:**
- Preserve existing ingredients/instructions/nutrition tabs (no regression risk)
- Start with hardcoded reasons in Phase 1 (MVP)
- Test at 3 density points (375px, 768px, 1440px)

---

## 12. Risks

### Risk 1 — Household context not always available (MEDIUM)

**Issue:** Detail page is standalone; household may not be in scope.

**Mitigation:**
- Load household from context or query if available
- Graceful fallback: "Adapt for your household" CTA instead of data
- Don't break existing view when household unavailable

---

### Risk 2 — Plant count not currently exposed (MEDIUM)

**Issue:** Meal-scoring-service has variety logic; detail page doesn't consume it.

**Mitigation:**
- Implement as Phase 2 task
- Phase 1 uses placeholder text ("Good variety", "Supports plant diversity")
- Backend endpoint is straightforward (one more compute step)

---

### Risk 3 — MealUpliftPanel is tightly coupled to planner (MEDIUM)

**Issue:** Extracting it for detail page may expose dependencies.

**Mitigation:**
- Create wrapper component `SimplyBetterChoicesPanel` that adapts MealUpliftPanel
- Don't modify MealUpliftPanel itself (avoid regression)
- Test both contexts (planner modal + detail page) after extraction

---

### Risk 4 — Eater names require household scope (MEDIUM)

**Issue:** Detail page doesn't currently have household context.

**Mitigation:**
- Query household from context if logged in
- Fallback: "Household members" (generic) if not available
- Phase 2 task: confirm household scope design

---

### Risk 5 — Layout regression on edge cases (LOW)

**Issue:** New sections may cause unexpected wraps or overflow.

**Mitigation:**
- Test at 375px, 640px, 768px, 1024px, 1280px, 1536px (6 points)
- Mobile-first: start with COMPACT, layer up
- Use existing grid/spacing primitives (no custom hardcoded widths)

---

## 13. Recommendation

### **PROCEED with confidence.**

The Meal Detail Experience V3 is architecturally sound and achievable within 2 weeks. The core feedback loop is strong:
- THA has clear reasons it chooses meals
- Users need to understand those reasons
- V3 makes those reasons visible and trustworthy

**Recommended starting point:**

1. **Begin Phase 1 immediately** (Core structure)
   - No dependencies, can parallelize with other work
   - Extract MealUpliftPanel (1 day)
   - Create MealTrustSummary and HouseholdAdaptationSummary components (1–2 days)
   - Wire layout (1 day)
   - Result: MVP with 3 new sections, basic data

2. **Follow with Phase 2** (Data)
   - Backend plant count exposure (1 day)
   - Household fit % (1 day)
   - Weekly reuse count (1 day)
   - Result: Section 1 fully populated

3. **Phase 3 only after adaptive-density hook exists** (THA audit Phase 1)
   - Parallel with other density refactors
   - Low risk, visual polish only

**Success criteria:**
- User sees "Why THA chose this" on every meal
- User sees household compatibility without modal
- User can expand Simply Better Choices inline
- Page responsive at COMPACT / COMFORTABLE / EXPANDED
- No regression to existing tabs

---

## 14. Confirmation

> **No code changes were made during this investigation.**  
> All findings are architectural and read-only observations.  
> No components, APIs, schemas, CSS, or database changes were created.  
> The only git operation performed was creating the rollback tag.

### Files read (not modified):
- `client/src/pages/meal-detail-page.tsx` (complete, 1205 lines)
- `shared/schema.ts` (partial, data structures)
- `shared/meal-adaptation.ts` (adaptation types)
- `docs/investigations/SIMPLY_BETTER_CHOICES_RENAME.md`
- `docs/investigations/THA_ADAPTIVE_LAYOUT_ENGINE_AUDIT.md`
- Server lib files (grep-only, pattern matching)

### Investigation scope:
- ✅ Current Meal Detail architecture audited
- ✅ Data inventory mapped (what exists, what's missing)
- ✅ V3 design feasibility assessed
- ✅ Wireframes created (3 density levels)
- ✅ Implementation phases outlined
- ✅ Risks identified and mitigated
- ✅ Effort estimates provided (~9–13 days)

### Out of scope (as requested):
- ❌ No code changes
- ❌ No CSS modifications
- ❌ No dialog migrations
- ❌ No schema changes
- ❌ No API changes

---

## Appendix: Data Mapping Reference

### "Why THA chose this" — Reason sources

| Reason | Data source | Current availability |
|--------|---|---|
| "Fits X of Y eaters" | HouseholdSafeEaterSnapshot or household.eaters + adapt check | Missing (need household context) |
| "[Diet] friendly" | meal_diets → diets | ✅ Available |
| "Family favourite" | planner entries count (how many weeks used?) | Missing (need aggregation) |
| "Contributes X plants" | plant-count logic (future) or variety score | Partial (variety exists, count missing) |
| "Supports weekly variety" | meal-scoring-service.varietyScore | ✅ Available (not exposed) |
| "Uses ingredients already in week" | Compare ingredients to other planner entries | Missing (need comparison logic) |

### "Household Adaptations" — Data sources

| Data | Source | Availability |
|------|--------|---|
| Eater names | household.eaters or HouseholdSafeEaterSnapshot | Partial (scope issue) |
| Change type (none/swap/add_on/omission) | EaterAdaptation.changeType | ✅ Available |
| Substitution (A → B) | EaterAdaptation for swap type | ✅ Available |
| Why (reasoning) | EaterAdaptation.note | ✅ Available |
| Compatibility check | Trigger adapt action with goal: "household" | ✅ Available |

### "Simply Better Choices" — Data sources

| Data | Source | Availability |
|------|--------|---|
| Suggestions (ingredients) | uplift-rules.ts | ✅ Available |
| Benefits text | uplift rule `why` field | ✅ Available |
| How to use | uplift rule `how` field (if present) | Partial |
| Already used this week? | Compare ingredient to planner entries | Missing |
| Add/remove actions | MealUpliftPanel mutations | ✅ Available |

---

**End of investigation.**
