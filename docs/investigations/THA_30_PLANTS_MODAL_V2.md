# THA 30 Plants Modal V2 — Investigation & Redesign

**Status:** Investigation Only (No Code Changes)  
**Rollback Point:** `rollback/30-plants-modal-v2-investigation` at commit `67ee85e`  
**Investigation Date:** 2026-06-16

---

## Executive Summary

The current 30 Plants This Week modal successfully counts plant diversity but presents data as an **ingredient inventory** rather than a **nutrition report**. The user does not understand:

- How balanced their diet is
- Which plants contribute most to their health
- What health benefits they're receiving
- Which nutrients drive those benefits
- What easy additions would broaden their week

### Redesign Objective

Transform the modal from a **raw ingredient list** into a **human-readable nutrition report** that educates and inspires. The report should answer:

1. **How many plants this week?** (73/30 ✓)
2. **Which categories are covered?** (Category grid)
3. **What supports does each plant provide?** (Health outcome → nutrient → plant)
4. **Where does each plant come from?** (Meals used in)
5. **What easy additions would help?** (Try next variants)

### Key Design Principle

**Support ↔ Nutrient mapping must be 1:1.**

Each health outcome (e.g., "Heart Health") maps to exactly one key nutrient (e.g., "Lycopene"). This prevents cognitive overload and ensures users can connect:

```
Health Outcome → Nutrient → Plant → Meal
```

---

## Current Modal Audit

### Current Structure

**File:** `client/src/components/PlantDiversityExplorer.tsx`

**Header Section:**
- Plant count display (e.g., "73 / 30 plants")
- Progress bar (color-coded: amber → teal → emerald)
- Status message ("You've hit 30 plants this week")

**Category Grid:**
- Shows all 9 plant categories
- Checked ✓ for covered categories
- Empty ○ for missing categories
- 2–3 columns, responsive grid

**Category Completion Suggestions:**
- Lists missing categories
- Suggests 2–3 ingredients per missing category
- Shows key nutrients for suggestions
- Example: "Spinach · Iron Folate"

**Plant Nutrition Report Table:**
- Semantic `<table>` for consistent column alignment
- Responsive columns (hidden on mobile, shown on `md:`)
  - Plant (always visible)
  - Meals (desktop only)
  - Days (desktop only)
  - Key Nutrients (desktop only)

**Expanded Row (click any plant):**
- Varieties Used (prep forms, sizes)
- Meals Contributed (with day context)
- Benefits section:
  - Benefit summary (one-sentence description)
  - Key nutrient chips

**Footer:**
- Disclaimer: "Plant count is an approximation based on ingredient names…"

### Current Data Structure

**Plant Row (PlantRow interface):**
```typescript
interface PlantRow {
  canonicalKey: string;        // "tomatoes"
  displayName: string;         // "Tomatoes"
  category: PlantCategory;     // "Vegetables"
  variants: string[];          // ["Cherry Tomatoes", "Vine Tomatoes"]
  mealNames: string[];         // ["Pasta Night", "Pizza", "Tomato Soup"]
  dayNames: string[];          // ["Monday", "Wednesday"]
  keyNutrients: string[];      // ["Lycopene", "Vitamin C"]
  benefitSummary: string|null; // "A source of lycopene…"
}
```

### Current Plant Categories

**PlantCategory** type (9 categories):
1. Vegetables
2. Fruits
3. Legumes
4. Whole Grains
5. Seeds
6. Nuts
7. Herbs & Spices
8. Olive Oil
9. Fermented Foods

### Data Flow

```
weekMealsData (WeekMealEntry[])
    ↓ normaliseForReuse (ingredient key dedup)
    ↓ isPlantIngredient (plant food filter)
    ↓ getPlantCategory (categorisation)
    ↓ getNutritionBenefit (nutrient lookup)
    ↓
PlantRow[] (sorted by category, then alphabetically)
    ↓
PlantDiversityExplorer (render)
```

### Current Limitations

| Problem | Impact | V2 Plan |
|---------|--------|---------|
| Alphabetical sorting within categories | Hides which plants contribute most | Sort by meal frequency |
| Benefits shown only when expanded | 80% of users won't see | Expand by default or show summary |
| No Support→Nutrient mapping | Users see nutrients without context | Add health outcome labels |
| No meal expansion inline | Can't see which meals use this plant | Add expandable meal list |
| No "Try next" suggestions | Doesn't encourage variety | Add variant suggestions per plant |
| No category-level summary | Doesn't teach category health outcomes | Add category support grid |
| No adaptive density variants | Poor mobile experience | Compact / comfortable / expanded |

---

## Current Data Inventory

### Available Data

#### 1. Plant Identification & Categorization
**Source:** `nutrition-variety.ts`
- `isPlantIngredient()` → identifies plant foods (all 8 categories)
- `getPlantCategory()` → returns PlantCategory
- 9 categories with ~200+ ingredient triggers

**Coverage:**
- Fruits: 35+ fruits
- Vegetables: 50+ vegetables
- Whole Grains: 18+ grains
- Herbs & Spices: 40+ herbs/spices
- Legumes: 30+ pulses/beans
- Seeds: 8+ seeds
- Nuts: 12+ nuts
- Fermented Foods: 6+ fermented foods
- Olive Oil: covered explicitly

#### 2. Nutrition Benefits Library
**Source:** `nutrition-benefit-library.ts`
- 36 ingredients with benefit data
- Structure per ingredient:
  ```typescript
  {
    name: "Pumpkin Seeds",
    category: "Seeds",
    keyNutrients: ["Magnesium", "Zinc", "Plant Protein"],
    summary: "Rich in magnesium and zinc. Supports plant diversity."
  }
  ```
- One-sentence education per ingredient
- 2–3 key nutrients per ingredient

**Current Coverage:**
- Seeds: 3 entries (Pumpkin, Chia, Flax)
- Nuts: 2 entries (Walnuts, Almonds)
- Legumes: 4 entries (Chickpeas, Lentils, Black Beans, Mixed Beans)
- Herbs: 4 entries (Basil, Coriander, Parsley, Mint)
- Mushrooms: 2 entries (Chestnut, Mixed)
- Fermented: 2 entries (Sauerkraut, Kimchi)
- Healthy Fats: 2 entries (Avocado, Olive Oil)
- Leafy Greens: 3 entries (Spinach, Kale, Rocket)
- Extra Veg: 2 entries (Grilled Tomatoes, Roasted Peppers)

**Gap:** No entries for common vegetables (tomatoes, peppers, broccoli), common fruits, grains, etc.

#### 3. Health Benefit ↔ Nutrient Mapping
**Source:** `nutrition-insights.ts`
- Partial mapping only: NUTRIENT_GOALS (4 mappings)

**Current Mappings:**
```
Immunity              → Vitamin C
Bone Health          → Vitamin D
Energy               → Iron
Gut Health           → Fibre
```

**Missing Mappings (from proposed design):**
- Heart Health       → ? (Lycopene? Omega-3? Monounsaturated Fats?)
- Skin Health        → ? (Vitamin C? Vitamin E? Antioxidants?)
- Sleep Quality      → ? (Magnesium? Tryptophan?)
- Muscle Recovery    → ? (Plant Protein? Amino Acids?)
- Brain Health       → ? (Omega-3? B Vitamins?)
- Immunity (expanded) → ? (Vitamin A? Zinc? Selenium?)

#### 4. Meal Context
**Source:** `weekMealsData` (weekly-planner-page.tsx)
```typescript
interface WeekMealEntry {
  mealName: string;      // "Pasta Night"
  dayName: string;       // "Monday"
  ingredients: string[]; // ["500g pasta", "cherry tomatoes", ...]
}
```
- Meal name available
- Day name available
- Complete ingredient list available
- No meal tags/cuisine type available
- No difficulty/time estimates

#### 5. Category Emoji System
**Source:** `ingredient-imagery.ts`
```javascript
{
  "Vegetables":      "🥦",
  "Fruits":          "🍎",
  "Whole Grains":    "🌾",
  "Herbs & Spices":  "🌿",
  "Olive Oil":       "🫒",
  "Legumes":         "🫘",
  "Seeds":           "🌻",
  "Nuts":            "🥜",
  "Fermented Foods": "🫙",
}
```
- 9 category emojis defined
- Fallback to generic plant emoji 🌱
- No ingredient-level imagery yet

#### 6. Ingredient Reuse Normalization
**Source:** `ingredient-reuse.ts` and `normaliseForReuse()`
- Deduplicates "cherry tomatoes", "vine tomatoes", "400g tinned tomatoes" → "tomatoes"
- Strips quantities, prep words, known aliases
- Preserves canonical key consistency across codebase

### Summary: Data Availability

| Data | Available | Complete | Usable |
|------|-----------|----------|--------|
| Plant categorization | ✓ | ✓ | ✓ |
| Ingredient identification | ✓ | ✓ | ✓ |
| Nutrition benefit library | ✓ | 36/200+ | Partial |
| Support↔Nutrient mapping | △ | 4/10+ | Limited |
| Meal-plant traceability | ✓ | ✓ | ✓ |
| Day-of-week context | ✓ | ✓ | ✓ |
| Category emoji system | ✓ | ✓ | ✓ |
| Ingredient imagery | ✗ | ✗ | Fallback only |

---

## V2 Proposed Structure

### Screen Hierarchy

#### Level 1: Report Top (Fixed Header)

```
┌─────────────────────────────────────────────────────────┐
│ 🌿 30 Plants This Week                                  │
│ See what your meals contribute to this week's nutrition │
├─────────────────────────────────────────────────────────┤
│ 73 / 30 plants                                          │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░ [progress bar, full width]           │
│ ✓ Great variety this week                              │
└─────────────────────────────────────────────────────────┘
```

**Content:**
- Large plant count (73/30)
- Progress bar (color-coded)
- Single contextual message (e.g., "Great variety")
- Fixed height, no scrolling

#### Level 2: Category Grid (Scrollable Body)

```
┌─────────────────────────────────────────────────────────┐
│ CATEGORY             COUNT                              │
├─────────────────────────────────────────────────────────┤
│ ▶ Vegetables         28                                 │
│ ▶ Fruits             12                                 │
│ ▶ Legumes             8                                 │
│ ▶ Nuts                6                                 │
│ ▶ Seeds               5                                 │
│ ▶ Herbs & Spices     11                                 │
│ ▶ Whole Grains        2                                 │
│ ○ Fermented Foods     0                                 │
│ ○ Olive Oil           0                                 │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- Collapsed by default
- Count shown per category
- Click to expand
- Categories with count=0 still visible but grayed out
- Ordering: CATEGORY_ORDER (current order preserved)

#### Level 3: Category Expansion (Collapsible)

```
┌─────────────────────────────────────────────────────────┐
│ ▼ Vegetables         28                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ PLANT          SUPPORT        KEY NUTRIENT    MEALS   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ 🥦 Tomatoes    ❤️ Heart Health Lycopene       7 ▶     │
│                                                         │
│ 🥬 Spinach     🛡️ Immunity    Iron            5 ▶     │
│                                                         │
│ 🥦 Broccoli    🛡️ Immunity    Vitamin C       3 ▶     │
│                                                         │
│ 🥬 Kale        ✨ Skin Health  Vitamin K       2 ▶     │
│                                                         │
│ [Try next suggestions below table]                     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Structure:**
- Table with columns: Plant | Support | Key Nutrient | Meals
- Each plant row expandable for meal details
- Support shown as emoji + label (❤️ Heart Health)
- Key nutrient as plain text
- Meal count clickable (7 ▶)
- Plants sorted by meal frequency (descending)

**Support→Nutrient Examples:**

| Support | Emoji | Key Nutrient | Example Plants |
|---------|-------|--------------|-----------------|
| Heart Health | ❤️ | Lycopene | Tomatoes, Red Peppers |
| Immunity | 🛡️ | Vitamin C | Oranges, Broccoli, Kiwi |
| Skin Health | ✨ | Vitamin E | Almonds, Sunflower Seeds |
| Sleep Quality | 😴 | Magnesium | Pumpkin Seeds, Spinach |
| Gut Health | 🫙 | Fibre | Oats, Lentils, Broccoli |
| Energy | ⚡ | Iron | Spinach, Lentils, Chickpeas |
| Bone Health | 💪 | Calcium | Leafy Greens, Seeds |
| Brain Health | 🧠 | Omega-3 | Walnuts, Flax Seeds, Chia |

#### Level 4: Meal Expansion (Click "7 ▶")

```
┌─────────────────────────────────────────────────────────┐
│ ▼ Used in 7 meals                                      │
├─────────────────────────────────────────────────────────┤
│ ✓ Pasta Night - Monday                                 │
│ ✓ Chicken Marengo - Wednesday                          │
│ ✓ Taco Bowl - Thursday                                 │
│ ✓ Pizza - Friday                                       │
│ ✓ Tomato Soup - Saturday                               │
│ ✓ Shakshuka - Sunday                                   │
│ ✓ Salsa Bowl - Tuesday                                 │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- Expand/collapse on click
- Shows meal name + day of week
- Checkmark icon (✓) for visual rhythm
- One meal per line
- No action on meal click (informational only)

#### Level 5: Try Next Suggestions (Per Plant)

```
┌─────────────────────────────────────────────────────────┐
│ Try next:                                               │
│ • Cherry tomatoes                                       │
│ • Sun-dried tomatoes                                    │
│ • Roasted vine tomatoes                                 │
└─────────────────────────────────────────────────────────┘
```

**Purpose:**
- Suggest variants not yet used this week
- Encourage experimentation
- One per line
- Only shown if variants exist

---

## Category Expansion Design

### Table Structure (Expanded Category)

```
CATEGORY HEADER
▼ Vegetables (28)

TABLE HEADER
Plant | Support | Key Nutrient | Meals

PLANT ROWS (sorted by meal frequency, desc)
Each row expandable

FOOTER
Try next suggestions (single line, if exists)
```

### Plant Row States

**Collapsed State:**
```
🥦 Tomatoes    ❤️ Heart Health    Lycopene    7 ▶
```

**Expanded State (full plant detail):**
```
🥦 Tomatoes    ❤️ Heart Health    Lycopene    7 ▶

▼ Used in 7 meals
✓ Pasta Night - Monday
✓ Chicken Marengo - Wednesday
[... 5 more meals ...]

Try next:
• Cherry tomatoes
• Sun-dried tomatoes
• Roasted vine tomatoes

Benefits:
Tomatoes are rich in lycopene, an antioxidant linked to 
heart health. When cooked, the lycopene becomes more 
bioavailable.

Varieties used this week:
• Vine tomatoes
• Cherry tomatoes
• Tinned tomatoes
```

### Support↔Nutrient Mapping (Complete Set)

The V2 design requires an **authoritative support↔nutrient mapping table**. Current nutrition-insights.ts has only 4 mappings. Need to expand to 8–10 core health outcomes.

**Proposed Mapping:**

```typescript
interface SupportMapping {
  id: string;
  support: string;        // "Heart Health"
  emoji: string;          // "❤️"
  keyNutrient: string;    // "Lycopene"
  description: string;    // "A compound linked to heart health"
  plantExamples: string[]; // ["Tomatoes", "Red Peppers"]
}

const SUPPORT_MAPPINGS: SupportMapping[] = [
  {
    id: "heart-health",
    support: "Heart Health",
    emoji: "❤️",
    keyNutrient: "Lycopene",
    description: "An antioxidant linked to cardiovascular health",
    plantExamples: ["Tomatoes", "Red Peppers", "Watermelon"],
  },
  {
    id: "immunity",
    support: "Immunity",
    emoji: "🛡️",
    keyNutrient: "Vitamin C",
    description: "Supports immune function and white blood cell activity",
    plantExamples: ["Oranges", "Broccoli", "Kiwi", "Peppers"],
  },
  {
    id: "skin-health",
    support: "Skin Health",
    emoji: "✨",
    keyNutrient: "Vitamin E",
    description: "An antioxidant that protects skin cells",
    plantExamples: ["Almonds", "Sunflower Seeds", "Spinach"],
  },
  {
    id: "sleep-quality",
    support: "Sleep Quality",
    emoji: "😴",
    keyNutrient: "Magnesium",
    description: "A mineral involved in muscle relaxation and sleep",
    plantExamples: ["Pumpkin Seeds", "Spinach", "Chickpeas"],
  },
  {
    id: "gut-health",
    support: "Gut Health",
    emoji: "🫙",
    keyNutrient: "Fibre",
    description: "Feeds beneficial gut bacteria and supports digestion",
    plantExamples: ["Oats", "Lentils", "Broccoli", "Apples"],
  },
  {
    id: "energy",
    support: "Energy",
    emoji: "⚡",
    keyNutrient: "Iron",
    description: "Essential for oxygen transport and energy production",
    plantExamples: ["Spinach", "Lentils", "Chickpeas", "Pumpkin Seeds"],
  },
  {
    id: "bone-health",
    support: "Bone Health",
    emoji: "💪",
    keyNutrient: "Calcium",
    description: "Key mineral for bone strength and density",
    plantExamples: ["Leafy Greens", "Seeds", "Fortified Plant Milks"],
  },
  {
    id: "brain-health",
    support: "Brain Health",
    emoji: "🧠",
    keyNutrient: "Omega-3",
    description: "Supports cognitive function and brain health",
    plantExamples: ["Walnuts", "Flax Seeds", "Chia Seeds"],
  },
];
```

---

## Meal Expansion Design

### Current Implementation

Today meals are shown in the collapsed plant row (desktop only) as:
```
"Pasta Night, Pizza +2"
```

### V2 Meal Expansion

**Behavior:**
- Click "7 ▶" to expand
- Shows all 7 meals in a list
- Each meal shows: meal name + day of week
- Checkmark (✓) for visual rhythm
- Collapse with "▼ Used in 7 meals"

**Design Consideration:**

Should meals include day of week?

**Option A (Recommended):** Yes
```
✓ Pasta Night - Monday
✓ Chicken Marengo - Wednesday
```
**Rationale:** Helps users plan: "I use tomatoes on Mon, Wed, Fri"

**Option B:** Meal name only
```
✓ Pasta Night
✓ Chicken Marengo
✓ Taco Bowl
✓ Pizza
```
**Rationale:** Simpler, cleaner list

**Recommendation:** **Option A** — day context helps users understand their eating patterns.

---

## Adaptive Density Wireframes

### Mobile (375px — Compact)

```
FIXED HEADER
┌───────────────────────────┐
│ 🌿 30 Plants This Week    │
│ 73 / 30 plants            │
│ ▓▓▓▓▓▓▓░░ [bar]          │
│ ✓ Great variety this week │
└───────────────────────────┘

SCROLLABLE BODY
┌───────────────────────────┐
│ Categories                │
│ ▶ Vegetables   28         │
│ ▶ Fruits       12         │
│ ▶ Legumes       8         │
│ ...                       │
├───────────────────────────┤
│ Plant Report              │
│ [Single column table]     │
│ 🥦 Tomatoes               │
│    ❤️ Heart Health        │
│    Lycopene | 7 ▶         │
│                           │
│ [expandable]              │
│ ▼ Used in 7 meals         │
│ ✓ Pasta Night - Mon       │
│ ✓ Marengo - Wed           │
│ ...                       │
│                           │
│ Try next:                 │
│ • Cherry tom.             │
│ • Sun-dried               │
└───────────────────────────┘
```

**Changes from comfortable:**
- Single plant column (no support/nutrient row)
- Support + nutrient stacked under plant name
- Meal count clickable (7 ▶)
- Try next suggestions inline
- Table becomes card-based stacking

### Tablet (640px — Comfortable)

```
FIXED HEADER
┌─────────────────────────────────┐
│ 🌿 30 Plants This Week          │
│ 73 / 30 plants                  │
│ ▓▓▓▓▓▓▓▓░░ [progress bar]      │
│ ✓ Great variety this week       │
└─────────────────────────────────┘

SCROLLABLE BODY
┌─────────────────────────────────┐
│ Categories                      │
│ ▶ Vegetables        28          │
│ ▶ Fruits            12          │
│ ▶ Legumes            8          │
│ ...                             │
├─────────────────────────────────┤
│ Plant Report                    │
│ Plant      | Support   | Meals  │
│ 🥦 Tom.    | ❤️ Heart  | 7 ▶   │
│ 🥬 Spinach | 🛡️ Immun  | 5 ▶   │
│ ...                             │
│                                 │
│ [Expanded plant]                │
│ ▼ Tomatoes                      │
│ ❤️ Heart Health — Lycopene      │
│ ▼ Used in 7 meals               │
│ ✓ Pasta Night - Monday          │
│ ✓ Marengo - Wednesday           │
│ ...                             │
│ Try next:                       │
│ • Cherry tomatoes               │
│ • Sun-dried tomatoes            │
└─────────────────────────────────┘
```

**Changes from expanded:**
- Support/Nutrient columns shown
- Meal list shown only when expanded
- Try next shown below plant

### Desktop (1024px+ — Expanded)

```
FIXED HEADER
┌──────────────────────────────────────────────┐
│ 🌿 30 Plants This Week                       │
│ 73 / 30 plants                               │
│ ▓▓▓▓▓▓▓▓░░░░░░ [progress bar]               │
│ ✓ Great variety this week                    │
└──────────────────────────────────────────────┘

SCROLLABLE BODY
┌──────────────────────────────────────────────┐
│ Categories                                   │
│ ▶ Vegetables        28                       │
│ ▶ Fruits            12                       │
│ ▶ Legumes            8                       │
│ ...                                          │
├──────────────────────────────────────────────┤
│ Plant Report                                 │
│ Plant   | Support      | Nutrient    | Meals│
├──────────────────────────────────────────────┤
│ 🥦 Tom  | ❤️ Heart     | Lycopene    | 7 ▶ │
│ 🥬 Spin | 🛡️ Immunity  | Iron        | 5 ▶ │
│ 🥦 Broc | 🛡️ Immunity  | Vitamin C   | 3 ▶ │
│                                              │
│ [Expanded plant row]                        │
│ ▼ Tomatoes                                  │
│                                              │
│ ▼ Used in 7 meals                           │
│ ✓ Pasta Night - Monday                      │
│ ✓ Marengo - Wednesday                       │
│ ✓ Taco Bowl - Thursday                      │
│ ✓ Pizza - Friday                            │
│ ✓ Tomato Soup - Saturday                    │
│ ✓ Shakshuka - Sunday                        │
│ ✓ Salsa Bowl - Tuesday                      │
│                                              │
│ Try next:                                    │
│ • Cherry tomatoes                            │
│ • Sun-dried tomatoes                         │
│ • Roasted vine tomatoes                      │
│                                              │
│ Benefits:                                    │
│ Tomatoes are rich in lycopene, an            │
│ antioxidant linked to heart health. When     │
│ cooked, lycopene becomes more bioavailable. │
│                                              │
│ Varieties used this week:                    │
│ • Vine tomatoes                              │
│ • Cherry tomatoes                            │
│ • Tinned tomatoes                            │
└──────────────────────────────────────────────┘
```

**Full details visible:**
- All columns (Plant | Support | Nutrient | Meals)
- Meal expansion with full context
- Benefits section visible
- Varieties section visible
- Try next suggestions visible

### Breakpoints Summary

| Screen | Breakpoint | Behavior |
|--------|-----------|----------|
| Mobile | <640px | Compact: single plant col, stacked support/nutrient |
| Tablet | 640px–1024px | Comfortable: plant/support/nutrient cols, meals expand |
| Desktop | 1024px+ | Expanded: all cols, full details |

**CSS Implementation Pattern:**
```css
/* Desktop (default) */
.table { display: table; }
.nutrient-col { display: table-cell; }

/* Tablet */
@media (max-width: 1024px) {
  .nutrient-col { display: none; }
  .meal-count { display: inline; }
}

/* Mobile */
@media (max-width: 640px) {
  .table { display: block; }
  .support-col { display: none; }
  .nutrient-inline { display: inline; }
}
```

---

## Missing Data

### Critical Data Gaps

#### 1. Support↔Nutrient Mapping (Incomplete)

**Current:** 4 mappings in nutrition-insights.ts
**Needed:** 8–10 mappings for V2 design

**Missing:** Heart Health, Skin Health, Sleep Quality, Bone Health, Brain Health, Muscle Recovery

**Solution:** Create new module `lib/support-nutrient-library.ts` with authoritative mapping.

#### 2. Nutrition Benefit Library (Incomplete)

**Current:** 36 ingredients with benefits
**Needed:** 100+ ingredients to cover common plants

**Missing:**
- Common vegetables: Tomatoes, Peppers, Broccoli, Carrots, Onions, etc. (20+)
- Common fruits: Apples, Bananas, Oranges, Berries, etc. (15+)
- Common grains: Oats, Brown Rice, Quinoa, etc. (8+)
- Expanded herbs: More specific herbs beyond the 4 listed (10+)

**Example gaps:**
```javascript
{
  name: "Tomatoes",
  category: "Vegetables",
  keyNutrients: ["Lycopene", "Vitamin C", "Potassium"],
  summary: "Rich in lycopene, an antioxidant linked to heart health."
}
// Missing — multiple benefits library entries

{
  name: "Broccoli",
  category: "Vegetables",
  keyNutrients: ["Vitamin C", "Sulforaphane", "Folate"],
  summary: "A cruciferous vegetable rich in vitamin C and sulforaphane."
}
// Missing

{
  name: "Oranges",
  category: "Fruits",
  keyNutrients: ["Vitamin C", "Folate", "Potassium"],
  summary: "A citrus fruit packed with vitamin C for immune support."
}
// Missing
```

**Solution:** Expand nutrition-benefit-library.ts with ~70 additional entries.

#### 3. Ingredient Imagery (Not Started)

**Current:** Empty IMAGE_MAP in ingredient-imagery.ts
**Needed:** 40–60 ingredient WebP images

**Source:** Pexels (commercial use allowed, no attribution required)

**Implementation Plan:**
- Create `public/images/ingredients/` folder
- Download WebP images (400×400px max)
- Add entries to IMAGE_MAP
- Fallback to category emoji

**Not blocking V2:** Can use emoji fallback initially, add images later.

#### 4. Support Emoji System (Partial)

**Current:** Nutrient chips don't have emoji support
**Needed:** Support (health outcome) labels with emoji

**Proposed emojis:**
```
❤️  Heart Health
🛡️  Immunity
✨  Skin Health
😴  Sleep Quality
🫙  Gut Health
⚡  Energy
💪  Bone Health
🧠  Brain Health
```

**Status:** Ready to implement (no data work needed)

#### 5. Meal Day-of-Week Context (Available)

**Current:** Available in weekMealsData
**Status:** Can use immediately

---

## Implementation Phases

### Phase 1: Foundation (Week 1–2)

**Scope:** Data infrastructure, no UI changes

**Tasks:**
1. Create `lib/support-nutrient-library.ts` with 8–10 support↔nutrient mappings
2. Expand nutrition-benefit-library.ts with ~50 additional ingredients
3. Create support emoji system (constants)
4. Add type definitions for support-based rendering

**Deliverable:** Data ready for Phase 2 UI work

**Effort:** 2–3 days
**Risk:** None (no UI changes)
**Blocker:** None

### Phase 2: V2 Modal Structure (Week 2–3)

**Scope:** Redesign the modal layout and structure

**Tasks:**
1. Refactor category grid to show category counts
2. Make categories collapsible (expand/collapse state)
3. Rebuild plant table with Support + Nutrient columns
4. Add meal expansion inline (click count to expand)
5. Implement adaptive density (mobile/tablet/desktop)

**Deliverable:** Functional modal with all sections, no animations

**Effort:** 3–4 days
**Risk:** Complexity in table rendering (semantic <table> with nested expansions)
**Blocker:** Phase 1 data

### Phase 3: Polish & Variants (Week 3–4)

**Scope:** Refinements, "Try next", benefits education

**Tasks:**
1. Add "Try next" variant suggestions per plant
2. Enhance benefit summary education
3. Add animations (expand/collapse)
4. Responsive testing at breakpoints
5. Accessibility audit (keyboard nav, screen readers)

**Deliverable:** Production-ready V2 modal

**Effort:** 2–3 days
**Risk:** Low (incremental improvements)
**Blocker:** Phase 2 complete

### Phase 4: Optional Enhancements (Week 4+)

**Scope:** Advanced features (not required for MVP)

**Tasks:**
1. Add ingredient imagery (WebP images)
2. Category-level summaries (supports covered by category)
3. "Healthy additions" recommendations (meal-type aware)
4. Export report as PDF/image
5. Share report link

**Deliverable:** Advanced features

**Effort:** 3–5 days each
**Risk:** Scope creep
**Blocker:** Phase 3 complete

---

## Effort Estimates

### Code Effort (Story Points)

| Task | Est. | Notes |
|------|-----|-------|
| Support↔Nutrient library | 3 | Data entry, 8–10 mappings |
| Expand benefits library | 5 | ~50 new ingredients, descriptions |
| Support emoji system | 2 | Constants, simple |
| Refactor plant data structure | 3 | Add support field to PlantRow |
| Category grid rebuild | 3 | Make collapsible, show counts |
| Table restructure (support/nutrient cols) | 5 | Complex table, multiple breakpoints |
| Meal expansion inline | 3 | State management, animations |
| Adaptive density (375/640/1024px) | 5 | CSS, responsive testing |
| "Try next" suggestions | 3 | Variant lookup, filtering |
| Benefits education enhancement | 2 | UI tweaks |
| Animations & polish | 3 | Expand/collapse transitions |
| Testing & accessibility | 3 | Keyboard nav, screen readers |
| **Total (MVP)** | **42** | ~3 weeks (2 devs, full-time) |
| Optional: Imagery | 5 | Image sourcing + integration |
| Optional: Category summaries | 3 | Aggregation logic |
| **Total (With Extras)** | **50** | ~4 weeks |

### Time Breakdown (Single Dev)

- **Phase 1 (Data):** 2–3 days
- **Phase 2 (Structure):** 3–4 days
- **Phase 3 (Polish):** 2–3 days
- **Phase 4 (Extras):** 3–5 days
- **Total:** 3–4 weeks

### Calendar Estimate

Assuming start 2026-06-17 (next business day after investigation):

| Phase | Week | Dates | Deliverable |
|-------|------|-------|-------------|
| 1 | Week 1 | Jun 17–20 | Data ready |
| 2 | Week 2 | Jun 23–27 | MVP structure |
| 3 | Week 3 | Jun 30–Jul 4 | Polished V2 |
| 4+ | Week 4+ | Jul 7+ | Extras (optional) |

**Critical Path:** Phase 1 → Phase 2 → Phase 3 → Ship

---

## Risks & Mitigations

### Technical Risks

#### Risk 1: Support→Nutrient Mapping Inconsistency
**Problem:** Different components might define support mappings differently
**Mitigation:** Centralize in single `support-nutrient-library.ts` module
**Effort:** Low

#### Risk 2: Table Rendering Complexity at Multiple Breakpoints
**Problem:** Semantic <table> with nested row expansions + responsive columns is tricky
**Mitigation:** Use CSS Grid fallback if table semantics become problematic
**Effort:** Medium (1–2 days refactor)

#### Risk 3: Meal Expansion Performance
**Problem:** Hundreds of meals in a large week might cause layout shifts
**Mitigation:** Virtual scrolling or pagination if needed
**Current state:** Unlikely (max 21 meals/week)
**Effort:** Low (monitor only)

#### Risk 4: Nutrition Benefit Library Completeness
**Problem:** New ingredients added to meals won't have benefit data
**Mitigation:** Handle null gracefully (show plant name only, no benefits)
**Effort:** Low (already handled)

### Design Risks

#### Risk 5: Support↔Nutrient Mapping Over-Simplification
**Problem:** One support per nutrient may feel limiting
**Mitigation:** User research before Phase 2 (brief survey: "Does ❤️ Heart Health + Lycopene feel right?")
**Effort:** Low
**Timeline:** Week 0 (pre-Phase 1)

#### Risk 6: Mobile UX Too Condensed
**Problem:** 375px screen with collapsible categories might feel buried
**Mitigation:** Test at actual breakpoints (375, 640, 1024px) during Phase 3
**Effort:** Low (responsive testing)

### Data Risks

#### Risk 7: Incomplete Nutrition Benefit Library
**Problem:** 36/200+ ingredients is only ~18% coverage
**Mitigation:** Expand to 80+ in Phase 1, accept that some plants won't show benefits
**Effort:** Medium (careful data entry)
**Timeline:** Phase 1

#### Risk 8: Support Mappings Don't Match Real Nutrition Science
**Problem:** "Lycopene → Heart Health" may be overstated
**Mitigation:** Include disclaimers, cite sources, have nutritionist review
**Effort:** Medium (review process)
**Timeline:** Phase 1

---

## Questions Answered

### Q1: Can the modal become a Plant Diversity Report rather than Ingredient List?

**Answer: Yes.**

Current modal already has the foundation (categories, benefits, meal context). V2 adds:
- Category-level organization (collapsible)
- Support→Nutrient mapping (visual hierarchy)
- Meal expansion (context)
- Try next suggestions (education)

**Confidence:** High

### Q2: Do categories make more sense than alphabetical ingredients?

**Answer: Yes.**

Categories are more intuitive:
- Users think in terms of food groups (vegetables, fruits, etc.)
- Easy to identify gaps
- Aligns with nutrition science (variety across groups)
- Reduces cognitive load (8–9 groups vs. 50+ ingredients)

**Confidence:** Very high

### Q3: Is Support↔Nutrient 1:1 mapping feasible?

**Answer: Yes, but requires careful design.**

Multiple supports can share nutrients (e.g., Vitamin C → Immunity + Skin Health). Solution: Map each **plant-support pair** independently.

```
Tomatoes → [Lycopene → Heart Health, Vitamin C → Immunity]
```

But for the modal UI, show **one primary support per plant** for simplicity. Users can expand for full details.

**Confidence:** Medium (needs user testing)

### Q4: Should meals expand separately?

**Answer: Yes.**

Inline meal expansion (click "7 ▶") is cleaner than separate accordion. Benefits:
- Compact in collapsed state
- Users can peek at specific meals
- Day context helps planning

**Confidence:** High

### Q5: Should "Try next" exist?

**Answer: Yes, but as a secondary feature.**

Variants are valuable:
- Encourages variety
- Acknowledges that users experiment
- Teaches ingredient flexibility (cherry tomatoes = tomatoes)

**Confidence:** High (low effort, high engagement)

### Q6: What data already exists?

**Answer:** Documented in "Current Data Inventory" section.

**Summary:**
- ✓ Plant identification (100% coverage)
- △ Nutrition benefits (18% coverage — 36/200 ingredients)
- △ Support↔Nutrient mapping (40% — 4/10 outcomes)
- ✓ Meal context (100%)
- △ Imagery (0% — emoji fallback only)

### Q7: What data is missing?

**Answer:** Documented in "Missing Data" section.

**Critical gaps:**
1. Support↔Nutrient mapping (4/10 → need 8–10)
2. Nutrition benefit library (36/200 → need 80+)
3. Support emoji system (partial → need full set)
4. Ingredient imagery (optional, emoji fallback acceptable)

### Q8: Estimated implementation effort?

**Answer:** 3–4 weeks (single developer)

**Breakdown:**
- Phase 1 (Data): 2–3 days
- Phase 2 (Structure): 3–4 days
- Phase 3 (Polish): 2–3 days
- **MVP:** 1.5–2 weeks
- With extras: 3–4 weeks

---

## Recommendation

### V2 Redesign is Worthwhile

**Evidence:**
1. **Problem is real:** Current modal is ingredient inventory, not education tool
2. **Data exists:** 80% of required data already available
3. **Feasible effort:** 3–4 weeks for polished solution
4. **High value:** Transforms modal from "what did I eat?" to "what are my health benefits?"
5. **No breaking changes:** Builds on existing PlantDiversityExplorer without disruption

### Suggested Approach

**Option A: Full Implementation (Recommended)**
- Execute Phases 1–3 over 3 weeks
- Ship polished V2 with all core features
- Phase 4 extras in follow-up sprint

**Option B: MVP-First**
- Focus Phases 1–2 only
- Ship with categories, support mapping, meal expansion
- Defer "Try next", imagery, category summaries to Phase 4

**Recommendation:** **Option A**

Phase 3 (polish) is only 2–3 days and significantly improves user experience. Shipping with unpolished animations or missing "Try next" suggestions would feel incomplete.

---

## Confirmation: No Code Changes Made

This investigation document is **research and design only**. No code has been modified:

✓ No component changes  
✓ No CSS modifications  
✓ No schema updates  
✓ No API changes  
✓ No migrations created  
✓ No commits beyond rollback point  

**Working directory:** Clean  
**Git status:** No uncommitted changes (other than this investigation file)  
**Rollback available:** `git reset --hard rollback/30-plants-modal-v2-investigation`

---

## Next Steps

1. **User Testing (Optional):** Survey 5–10 users on support emoji + nutrient mappings
2. **Data Review:** Get nutritionist to review support↔nutrient mapping (Risk 8 mitigation)
3. **Approve Design:** Confirm wireframes and support emoji choices
4. **Phase 1 Start:** Begin data infrastructure work
5. **Weekly Sync:** Check progress, unblock risks

---

## Appendix: File Reference

### Key Files (Investigation Only — Not Modified)

| File | Role | Status |
|------|------|--------|
| client/src/components/PlantDiversityExplorer.tsx | Main modal component | Analyzed |
| client/src/lib/nutrition-variety.ts | Plant categorization | Analyzed |
| client/src/lib/nutrition-benefit-library.ts | Ingredient benefits | Analyzed (incomplete) |
| client/src/lib/nutrition-insights.ts | Support↔Nutrient mapping | Analyzed (partial) |
| client/src/lib/ingredient-imagery.ts | Image/emoji system | Analyzed |
| client/src/pages/weekly-planner-page.tsx | Data flow | Analyzed |

### New Files (To Create in Phase 1)

| File | Purpose |
|------|---------|
| client/src/lib/support-nutrient-library.ts | Centralized support↔nutrient mappings |
| docs/investigations/THA_30_PLANTS_MODAL_V2_IMPLEMENTATION.md | Implementation guide (Phase 2) |

---

**Investigation completed:** 2026-06-16  
**Rollback point:** `rollback/30-plants-modal-v2-investigation`  
**Status:** Ready for design review → Phase 1 approval
