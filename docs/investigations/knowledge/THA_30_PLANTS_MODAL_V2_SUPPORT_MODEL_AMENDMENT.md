# THA 30 Plants Modal V2 — Support Model Amendment: Primary + Secondary Relationship

**Investigation Date:** 2026-06-16  
**Rollback Identifier:** `rollback/30-plants-modal-v2-support-model-amendment` at commit `67ee85e`  
**Status:** Investigation & Design Amendment Only (No Code Changes)  
**Reviewed By:** Senior Nutrition Education Designer + Senior React Engineer

---

## EXECUTIVE SUMMARY

The original design validation recommended a **rigid 1:1 global mapping model**:

```
Heart Health → Lycopene (always)
Immunity → Vitamin C (always)
Sleep Quality → Magnesium (always)
```

This is **educationally simple but scientifically inaccurate**. Real nutrition relationships are many-to-many:
- Magnesium supports Sleep, Heart Health, AND Muscle Function
- Heart Health is supported by Lycopene, Omega-3, Magnesium, Fibre, and more

**This amendment proposes a flexible alternative:**

**Primary Support ↔ Nutrient** (collapsed, always visible)
- Simple, memorable teaching point
- Example: Pumpkin Seeds → **Magnesium → Sleep Quality**

**Expandable Secondary Supports ↔ Nutrients** (optional, "Show more")
- Educationally honest about nutrient complexity
- Example: Magnesium also supports Heart Health, Muscle Function
- Scientific accuracy without cognitive overload

### Key Findings

| Aspect | Original Model | Amended Model |
|--------|---|---|
| **Simplicity** | Very high (1 support per plant) | High (1 primary + optional secondary) |
| **Scientific accuracy** | Low (ignores multi-support nutrients) | High (shows all relationships) |
| **User experience** | Uncluttered (no expansion needed) | Progressive disclosure (expand if curious) |
| **Data structure** | Global mappings (array of 8–10) | Per-plant relationships (array per plant) |
| **Scalability** | Fixed (must curate all mappings) | Flexible (add nutrients as knowledge grows) |
| **Expandability** | Not expandable | Highly expandable |

**Bottom Line:** Amended model is **recommended**. It maintains simplicity while being scientifically honest, and it's more sustainable (relationships per plant, not global rules).

---

## SECTION 1: PROBLEMS WITH SINGLE NUTRIENT MAPPING

### Problem 1: Nutritional Relationships Are Many-to-Many

**Real world:** Magnesium supports multiple health outcomes.

```
Magnesium supports:
  • Sleep Quality (primary evidence)
  • Heart Health (secondary evidence)
  • Muscle Function (muscle relaxation)
  • Bone Health (mineral cofactor)
  • Stress Response (neurotransmitter regulation)
```

**Original model limitation:**
```
Sleep Quality → Magnesium (enforced globally)
```

**This means:** The UI can only show "Magnesium → Sleep Quality" for pumpkin seeds, hiding that magnesium also helps heart health, muscle function, and stress.

**Result:** User learns an incomplete picture.

---

### Problem 2: Same Nutrient, Different Primary Supports Across Plants

**Real world:** Vitamin C supports both immunity AND skin health.

```
Oranges:
  Primary: Immunity → Vitamin C
  Secondary: Skin Health → Vitamin C, Antioxidant Defense → Vitamin C

Strawberries:
  Primary: Skin Health → Vitamin C (due to antioxidants)
  Secondary: Immunity → Vitamin C, Antioxidant Defense → Vitamin C
```

**Original model problem:**
- Globally enforces: Immunity → Vitamin C
- Strawberries MUST show Immunity as primary, even if the user's mental model is "strawberries are good for skin"

**Result:** UI doesn't reflect plant-specific wisdom.

---

### Problem 3: Rigid Global Mappings Don't Scale

**Original model requires:** Pre-defining 8–10 global support↔nutrient pairs.

**What happens when:**
- Research changes (new health benefits discovered)
- New plants added (different nutrient profile)
- Seasonal ingredients (want different primary benefit)

**Original model response:** Must redefine the global mapping (breaks existing UI).

**Result:** System is brittle, not expandable.

---

### Problem 4: Single Primary Is Too Reductive

**Example:** Pumpkin Seeds

```
Real nutrition:
- Magnesium (high) → Sleep Quality, Heart Health, Muscle Function
- Zinc (moderate) → Immune Support
- Iron (moderate) → Energy
- Phosphorus (moderate) → Bone Health
- Plant Protein (moderate) → Muscle Recovery

Original model shows:
- Magnesium (primary, enforced globally)

User learns:
- Pumpkin Seeds = Magnesium = Sleep

User misses:
- Zinc for immunity, Iron for energy, Protein for muscle
```

**Result:** Too much nutrition hidden.

---

### Problem 5: "Primary Nutrient" Field Becomes Ambiguous

**Question:** If the global mapping says "Sleep Quality → Magnesium", what does "primary nutrient" mean in the UI?

**Option A:** It's the nutrient from the global mapping
```
🥦 Tomatoes — ❤️ Heart Health — Lycopene (from global)
```
**Problem:** Limited, doesn't show full nutrient profile

**Option B:** It's the nutrient that appears most in the plant
```
🥦 Tomatoes — ❤️ Heart Health — Lycopene (plant has most)
```
**Problem:** Lycopene isn't actually the most abundant nutrient in tomatoes (Vitamin C is).

**Result:** Confusion about what "primary" means.

---

## SECTION 2: ORIGINAL MODEL ANALYSIS

### What the Original Model Does Well

1. **Simple to understand:** One support per plant, no expansion needed
2. **Easy to render:** No rowspan complexity, straightforward UI
3. **Prevents confusion:** User learns one clear link per plant

### Where It Falls Short

1. **Scientifically inaccurate:** Hides actual nutrient complexity
2. **Not expandable:** Can't add secondary benefits without redesign
3. **Rigid global rules:** Doesn't account for plant-specific wisdom
4. **Data structure mismatch:** Global mappings don't reflect plant reality

### Verdict

**Original model is too restrictive for a "Plant Diversity Report".**

The goal is education, not oversimplification. Users should learn that pumpkin seeds offer multiple benefits, not just one.

---

## SECTION 3: PRIMARY SUPPORT MODEL (RECOMMENDED)

### Core Principle: Primary ↔ Nutrient Per Plant

**Each plant shows ONE PRIMARY support↔nutrient pair.**

This is chosen based on:
1. **Strongest scientific evidence** (what the nutrient does best)
2. **Plant abundance** (what's most plentiful in the ingredient)
3. **User recognition** (what users already know/expect)

**Example:**

```
🥦 Tomatoes
  Primary: ❤️ Heart Health ↔ Lycopene

🥬 Spinach
  Primary: 🛡️ Immunity ↔ Iron

🌻 Pumpkin Seeds
  Primary: 😴 Sleep Quality ↔ Magnesium

🥕 Carrots
  Primary: 🛡️ Immunity ↔ Beta-Carotene (Vitamin A)

🫘 Lentils
  Primary: ⚡ Energy ↔ Iron

🥜 Almonds
  Primary: 💪 Bone Health ↔ Calcium
```

### Why Primary?

**Educational principle:** Teach users the STRONGEST link first.

Users remember:
```
Tomatoes → Lycopene → Heart Health
```

This is accurate, memorable, and actionable.

### Collapsed State (Default)

```
Plant         | Primary Support | Primary Nutrient | Meals
🥦 Tomatoes   | ❤️ Heart Health | Lycopene         | 7 ▶
🥬 Spinach    | 🛡️ Immunity     | Iron             | 5 ▶
🌻 Pumpkin S. | 😴 Sleep Quality| Magnesium        | 3 ▶
```

**User learns:** Simple 1:1 relationship per plant (maintains simplicity of original model).

---

## SECTION 4: SECONDARY SUPPORTS MODEL

### Core Principle: Expandable Additional Relationships

**Once the user understands the primary support, they can optionally expand to see additional support↔nutrient relationships.**

### Example: Pumpkin Seeds Expanded

**Collapsed (default):**
```
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▶
```

**Expanded:**
```
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▼

  Additional Supports:
  ❤️ Heart Health — Magnesium
  💪 Muscle Function — Magnesium
  🛡️ Immune Support — Zinc
  ⚡ Energy — Iron
```

**User learns progressively:**
1. First: Pumpkin Seeds → Magnesium → Sleep (primary)
2. If curious: Magnesium also supports heart health, muscle function
3. If curious: Zinc and Iron provide additional benefits

### How to Present Secondary Supports

**Option A: "Show More" Button (Recommended)**

```
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▶

[Plant row continues normally — no expansion]

[At end of plant row or below:]
Show additional supports +3 [button]

[Click expands inline:]
  ❤️ Heart Health — Magnesium
  💪 Muscle Function — Magnesium
  🛡️ Immune Support — Zinc
  ⚡ Energy — Iron
```

**Pros:**
- Doesn't clutter UI (only show if user asks)
- Progressive disclosure (simple → detailed)
- Easy to ignore (user stays focused on primary)

**Cons:**
- Hidden knowledge (users might not click)
- Extra interaction cost

---

**Option B: Always Visible (Alternative)**

```
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▶
                 | ❤️ Heart Health | Magnesium |
                 | 💪 Muscle Func. | Magnesium |
                 | 🛡️ Immune Sup. | Zinc |
                 | ⚡ Energy | Iron |
```

**Pros:**
- All information visible
- Educational (shows nutrient complexity)
- Matches "rowspan multi-support" design from original

**Cons:**
- Visually dense (many rows per plant)
- Might overwhelm casual users
- Harder to implement with current table design

---

**Option C: Accordion (Alternative)**

```
▼ 🌻 Pumpkin Seeds — 😴 Sleep Quality — Magnesium — 3 meals

  Additional supports found:
  ❤️ Heart Health (Magnesium)
  💪 Muscle Function (Magnesium)
  🛡️ Immune Support (Zinc)
  ⚡ Energy (Iron)

[Expand to show meals]
▼ Used in 3 meals
✓ Breakfast Bowl - Monday
✓ Thai Feast - Thursday
✓ Mediterranean Salad - Saturday
```

**Pros:**
- All secondary supports visible when expanded
- Consistent with meal expansion pattern
- Progressive disclosure

**Cons:**
- Extra click to see secondary supports
- May feel redundant (already expanding meals)

---

### Recommendation: Option A ("Show More" Button)

**Why:**
1. **Maintains simplicity** (primary support visible by default)
2. **Invites exploration** (optional expansion for curious users)
3. **Fits existing design** (no rowspan changes needed)
4. **Progressive disclosure** (matches UX principles)
5. **Teachable moment** ("Magnesium does more than sleep!")

---

## SECTION 5: RECOMMENDED DATA STRUCTURE

### Data Model: Plant-Centric Support Relationships

**Replace:**
```typescript
// Original model: Global mapping
interface SupportMapping {
  support: string;      // "Heart Health"
  emoji: string;        // "❤️"
  nutrient: string;     // "Lycopene"
}

// Used globally:
const SUPPORT_NUTRIENT_LIBRARY: SupportMapping[] = [
  { support: "Heart Health", emoji: "❤️", nutrient: "Lycopene" },
  { support: "Immunity", emoji: "🛡️", nutrient: "Vitamin C" },
  // ... etc
];
```

**WITH:**

```typescript
// Amended model: Per-plant relationships
interface SupportRelationship {
  support: string;      // "Heart Health"
  emoji: string;        // "❤️"
  nutrient: string;     // "Lycopene"
  primary: boolean;     // true = show by default, false = show in "more"
  evidence: string;     // "high" | "medium" | "low" (optional, for future)
  description?: string; // "An antioxidant linked to cardiovascular health"
}

interface PlantNutritionProfile {
  canonicalKey: string;
  displayName: string;
  category: PlantCategory;
  relationships: SupportRelationship[]; // Can have 1–5 relationships
  variants: string[];
  mealNames: string[];
  dayNames: string[];
  summary: string;
}

// Updated nutrition-benefit-library.ts:
{
  canonicalKey: "pumpkin-seeds",
  displayName: "Pumpkin Seeds",
  category: "Seeds",
  relationships: [
    {
      support: "Sleep Quality",
      emoji: "😴",
      nutrient: "Magnesium",
      primary: true,
      evidence: "high",
      description: "Magnesium promotes muscle relaxation and sleep cycles"
    },
    {
      support: "Heart Health",
      emoji: "❤️",
      nutrient: "Magnesium",
      primary: false,
      evidence: "medium",
      description: "Supports cardiovascular function"
    },
    {
      support: "Muscle Function",
      emoji: "💪",
      nutrient: "Magnesium",
      primary: false,
      evidence: "medium",
      description: "Involved in muscle contraction and relaxation"
    },
    {
      support: "Immune Support",
      emoji: "🛡️",
      nutrient: "Zinc",
      primary: false,
      evidence: "medium",
      description: "Essential for immune cell function"
    },
    {
      support: "Energy",
      emoji: "⚡",
      nutrient: "Iron",
      primary: false,
      evidence: "medium",
      description: "Required for oxygen transport and ATP production"
    }
  ],
  variants: ["Raw Pumpkin Seeds", "Roasted Pumpkin Seeds", "Pumpkin Seed Oil"],
  mealNames: ["Breakfast Bowl", "Thai Feast", "Mediterranean Salad"],
  dayNames: ["Monday", "Thursday", "Saturday"],
  summary: "Rich in magnesium, zinc, and plant-based protein. Supports sleep quality and immune function."
}
```

### Why This Structure?

1. **Per-plant flexibility:** Each plant defines its own relationships
2. **Primary flag:** Easy to render (separate UI logic for primary vs. secondary)
3. **Evidence tracking:** Optional field for future "Why do we say this?" tooltips
4. **Expandable:** Can add new relationships without global rule changes
5. **Scalable:** Works with any number of relationships (1–5+ per plant)

### Data Migration Path

**From original model:**
```typescript
// Old: Global mapping forces one nutrient per support
{
  support: "Sleep Quality",
  emoji: "😴",
  nutrient: "Magnesium"
}
// Used by: All plants that promote sleep
```

**To amended model:**
```typescript
// New: Plant defines its relationships
{
  canonicalKey: "pumpkin-seeds",
  relationships: [
    {
      support: "Sleep Quality",
      emoji: "😴",
      nutrient: "Magnesium",
      primary: true
    },
    {
      support: "Heart Health",
      emoji: "❤️",
      nutrient: "Magnesium",
      primary: false
    },
    // ... more relationships
  ]
}
```

**Effort:** Refactor nutrition-benefit-library.ts structure (Phase 1 amendment, 1–2 days)

---

## SECTION 6: RENDERING EXAMPLES

### Collapsed State (All Breakpoints)

**Desktop (1024px+):**

```
┌────────────────────────────────────────────────────┐
│ Plant         | Primary Support | Nutrient | Meals │
├────────────────────────────────────────────────────┤
│ 🥦 Tomatoes   | ❤️ Heart Health | Lycopene | 7 ▶  │
│ 🥬 Spinach    | 🛡️ Immunity    | Iron     | 5 ▶  │
│ 🌻 Pumpkin S. | 😴 Sleep Qual.  | Magnesium| 3 ▶  │
│ 🥕 Carrots    | 🛡️ Immunity    | Carotene | 2 ▶  │
│ 🫘 Lentils    | ⚡ Energy       | Iron     | 4 ▶  │
└────────────────────────────────────────────────────┘
```

**Tablet (640–1024px):**

```
┌──────────────────────────────────────┐
│ Plant      | Primary Support | Meals │
├──────────────────────────────────────┤
│ 🥦 Tom.    | ❤️ Heart Health | 7 ▶  │
│ 🥬 Spinach | 🛡️ Immunity     | 5 ▶  │
│ 🌻 Pump.   | 😴 Sleep        | 3 ▶  │
│ 🥕 Carrots | 🛡️ Immunity     | 2 ▶  │
│ 🫘 Lentils | ⚡ Energy       | 4 ▶  │
└──────────────────────────────────────┘
```

**Mobile (375–640px):**

```
┌──────────────────────────┐
│ 🥦 Tomatoes              │
│ ❤️ Heart Health          │
│ Lycopene | 7 meals ▶    │
│                          │
│ 🥬 Spinach               │
│ 🛡️ Immunity              │
│ Iron | 5 meals ▶         │
│                          │
│ 🌻 Pumpkin Seeds         │
│ 😴 Sleep Quality         │
│ Magnesium | 3 meals ▶   │
│                          │
└──────────────────────────┘
```

---

### Expanded State: Pumpkin Seeds Example

**Desktop (1024px+) — All Secondary Supports Visible:**

```
┌────────────────────────────────────────────────────────────┐
│ Plant         | Support            | Nutrient    | Meals   │
├────────────────────────────────────────────────────────────┤
│ 🌻 Pumpkin    | 😴 Sleep Quality   | Magnesium   | 3 ▼    │
│ Seeds         | ❤️ Heart Health    | Magnesium   |        │
│               | 💪 Muscle Function | Magnesium   |        │
│               | 🛡️ Immune Support  | Zinc        |        │
│               | ⚡ Energy          | Iron        |        │
│               |                    |             |        │
│               | Show more supports | [link]      |        │
│               |                    |             |        │
│               | ▼ Used in 3 meals  |             |        │
│               | ✓ Breakfast Bowl   | Monday      |        │
│               | ✓ Thai Feast       | Thursday    |        │
│               | ✓ Med. Salad       | Saturday    |        │
│               |                    |             |        │
│               | Broaden variety:   |             |        │
│               | • Raw Seeds        |             |        │
│               | • Roasted Seeds    |             |        │
└────────────────────────────────────────────────────────────┘
```

**Tablet (640–1024px) — "Show More" Option:**

```
┌──────────────────────────────────────────┐
│ Plant      | Support      | Meals        │
├──────────────────────────────────────────┤
│ 🌻 Pump.   | 😴 Sleep     | 3 ▼         │
│            |              |              │
│ Additional supports (+4):                │
│ ❤️ Heart Health (Magnesium)             │
│ 💪 Muscle Function (Magnesium)          │
│ 🛡️ Immune Support (Zinc)                │
│ ⚡ Energy (Iron)                        │
│ [Hide additional]                       │
│                                         │
│ ▼ Used in 3 meals                       │
│ ✓ Breakfast Bowl - Monday               │
│ ✓ Thai Feast - Thursday                 │
│ ✓ Med. Salad - Saturday                 │
│                                         │
│ Broaden variety:                        │
│ • Raw Pumpkin Seeds                     │
│ • Roasted Pumpkin Seeds                 │
└──────────────────────────────────────────┘
```

**Mobile (375–640px) — Card Layout:**

```
┌──────────────────────────┐
│ 🌻 PUMPKIN SEEDS         │
│                          │
│ 😴 Sleep Quality         │
│    Magnesium             │
│ 3 meals ▼ [expand]      │
│                          │
│ Additional supports (+4) │
│ [+] Show more           │
│                          │
│ ▼ Used in 3 meals        │
│ ✓ Breakfast Bowl - Mon   │
│ ✓ Thai Feast - Thu       │
│ ✓ Med. Salad - Sat       │
│                          │
│ Broaden variety:         │
│ • Raw Pumpkin Seeds      │
│ • Roasted Pumpkin Seeds  │
└──────────────────────────┘
```

---

### Additional Supports: "Show More" Interaction

**Click interaction flow:**

```
BEFORE (collapsed):
────────────────────
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▼
[Additional supports (+4) - Show more]

AFTER (expanded):
────────────────────
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▼
                 | ❤️ Heart Health  | Magnesium |
                 | 💪 Muscle Func.  | Magnesium |
                 | 🛡️ Immune Sup.   | Zinc      |
                 | ⚡ Energy        | Iron      |
[Hide additional supports]

[Then meals expand below all of this]
```

---

## SECTION 7: IMPACT ON EXISTING INVESTIGATIONS

### Impact on THA_30_PLANTS_MODAL_V2.md

**Section to amend: "Support↔Nutrient Mapping (Complete Set)"**

**Current text:**
```
The V2 design requires an authoritative support↔nutrient mapping table.
Current nutrition-insights.ts has only 4 mappings. Need to expand to 8–10 core health outcomes.

interface SupportMapping {
  id: string;
  support: string;
  emoji: string;
  keyNutrient: string;
  description: string;
  plantExamples: string[];
}
```

**Amended text:**
```
The V2 design requires plant-centric support relationships (not global mappings).

Each plant defines its own relationships:
- One PRIMARY support↔nutrient (shown by default)
- Multiple SECONDARY supports↔nutrients (shown via "Show more")

interface SupportRelationship {
  support: string;
  emoji: string;
  nutrient: string;
  primary: boolean;
  evidence?: string;
  description?: string;
}

This replaces the global mapping approach with a per-plant model that:
- Accommodates nutrient complexity (same nutrient, multiple supports)
- Remains educationally simple (primary shown first)
- Scales gracefully (add relationships as knowledge grows)
```

**Required changes to original investigation:**
1. Remove section "Support↔Nutrient Mapping (Complete Set)" with global mappings
2. Replace with "Plant-Centric Support Relationships"
3. Update data structure section to reflect SupportRelationship[]
4. Amend "Effort Estimates" to include relationship curation (still Phase 1)

---

### Impact on THA_30_PLANTS_MODAL_V2_DESIGN_VALIDATION.md

**Section to amend: "Support ↔ Nutrient Educational Model"**

**Current text:**
```
### Core Principle: 1:1 Global Mapping

Each support maps to exactly one nutrient globally...

Heart Health → Lycopene
Immunity → Vitamin C
...
```

**Amended text:**
```
### Core Principle: Primary + Expandable Secondary

Each plant has:
- ONE PRIMARY support↔nutrient (shown by default)
- MULTIPLE SECONDARY supports↔nutrients (shown via "Show more")

This replaces global 1:1 mapping with plant-centric relationships.

**Why:**
- Original model too restrictive (Magnesium only = Sleep?)
- Amended model: Magnesium = Sleep (primary) + Heart + Muscle (secondary)
- Users learn simply first, discover complexity if curious
- More scientifically accurate without cognitive overload
```

**Required changes:**
1. Rewrite "Core Principle" section
2. Remove "What about plants with multiple supports?" (now the standard model)
3. Add "Show more" interaction pattern to Section 4 (Expansion Strategy)
4. Update rendering examples in Section 6

---

### Impact on Data Entry (Phase 1)

**Current effort:** Expand nutrition-benefit-library.ts from 36 → 80+ ingredients

**Amended effort:** Same, but structure each ingredient with:
1. **Primary relationship** (strongest evidence)
2. **Secondary relationships** (additional benefits)
3. **Evidence level** (optional, for transparency)

**Example (single ingredient):**

Current:
```typescript
{
  name: "Pumpkin Seeds",
  keyNutrients: ["Magnesium", "Zinc", "Iron"],
  summary: "Rich in magnesium..."
}
```

Amended:
```typescript
{
  canonicalKey: "pumpkin-seeds",
  displayName: "Pumpkin Seeds",
  relationships: [
    {
      support: "Sleep Quality",
      nutrient: "Magnesium",
      primary: true,
      evidence: "high"
    },
    {
      support: "Heart Health",
      nutrient: "Magnesium",
      primary: false,
      evidence: "medium"
    },
    // ... more relationships
  ]
}
```

**Effort impact:** +30 minutes per ingredient (defining relationships vs. just listing nutrients)

**Total effort:** 1–2 days additional (Phase 1 amendment)

---

## SECTION 8: RISKS

### Risk 1: User Confusion About "Primary" vs "Secondary"

**Problem:** "Primary" and "Secondary" might be unclear terminology.

**Severity:** LOW  
**Likelihood:** MEDIUM

**Mitigation:**
- Use clear labels: "Main benefit" / "Additional benefits" instead of "Primary" / "Secondary"
- Show tooltip: "Click to learn more health benefits from this nutrient"
- Highlight the primary support visually (bolder font, color)

**Effort:** Negligible (UI copy + styling)

---

### Risk 2: "Show More" Button Has Low Discoverability

**Problem:** Users might not notice the "Show more" link and miss secondary benefits.

**Severity:** MEDIUM  
**Likelihood:** MEDIUM

**Mitigation:**
- Make "Show more" prominent (button style, not just text link)
- Badge with count: "+4 more supports" (shows value upfront)
- Optional: Auto-expand on first view (show all supports, collapsible)

**Effort:** 1 day (UI implementation)

---

### Risk 3: Secondary Supports Overcomplicate the Table

**Problem:** Expanding secondary supports adds rows to table, makes it visually dense.

**Severity:** MEDIUM  
**Likelihood:** HIGH

**Mitigation:**
- Keep secondary supports in a clearly separated section
- Use indentation or color to distinguish from primary
- Consider card layout on mobile (no rowspan complexity)
- Test at actual breakpoints (375/640/1024px)

**Effort:** 1 day (CSS + responsive testing)

---

### Risk 4: Data Curation Burden Increases

**Problem:** Instead of 8–10 global mappings, must curate 1–5 relationships per plant (80+ plants).

**Severity:** MEDIUM  
**Likelihood:** HIGH (by design)

**Mitigation:**
- Create curation guide: "How to choose primary support for each plant"
- Have nutritionist review a sample of plants (10–15) to validate approach
- Start conservative (only 1–2 secondary per plant)
- Plan for growth (can add more relationships in future)

**Effort:** 1–2 days (Phase 1 curation + nutritionist review)

---

### Risk 5: Nutrient Duplication Across Plants

**Problem:** Same nutrient (e.g., Magnesium) appears as primary in one plant, secondary in another. Might confuse users.

**Severity:** LOW  
**Likelihood:** MEDIUM

**Example:**
```
🌻 Pumpkin Seeds — PRIMARY: Magnesium → Sleep
🥬 Spinach — SECONDARY: Magnesium → Heart Health
```

**User questions:** "Is magnesium for sleep or heart? Why is it primary in one plant but secondary in another?"

**Mitigation:**
- This is actually GOOD (educationally honest)
- Add tooltip explaining: "Different plants are rich in different nutrients. In pumpkin seeds, magnesium is abundant. In spinach, iron is the standout nutrient."
- Consistent messaging helps: "Each plant has different strengths."

**Effort:** Negligible (educational messaging)

---

### Risk 6: Scaling Beyond 5 Secondary Supports

**Problem:** Some plants might have 6+ relationships. How many show in the table?

**Severity:** LOW  
**Likelihood:** LOW (unusual)

**Mitigation:**
- Limit to top 4–5 secondary supports (based on evidence level)
- Use "Show more" to reveal additional if needed
- Or accept that some plants are nutritional powerhouses

**Effort:** 1 day (logic + testing)

---

### Risk 7: Mobile Rendering Complexity

**Problem:** Multi-row secondary supports might make mobile cards very tall.

**Severity:** MEDIUM  
**Likelihood:** MEDIUM

**Mitigation:**
- Mobile: Show primary only by default
- "Show more" button takes user to full details view (not inline expansion)
- Or: Accordion-style expand/collapse per plant

**Effort:** 1 day (mobile-specific CSS)

---

### Risk 8: Nutritionist Review Takes Time

**Problem:** Curation of 80+ plants with relationships requires nutritionist validation.

**Severity:** MEDIUM  
**Likelihood:** HIGH (by design)

**Mitigation:**
- Engage nutritionist EARLY in Phase 1 (not at end)
- Create "plant curation template" for nutritionist to fill in
- Batch review (10–15 plants at a time, iterate)
- Plan 1–2 weeks for full review (parallel with engineering)

**Effort:** Ongoing during Phase 1 (coordination, not engineering)

---

### Overall Risk Profile

**Risk Level: MEDIUM**

**Highest risk:** Data curation burden, mobile rendering, "Show more" discoverability  
**Lowest risk:** User confusion about terminology, nutrient duplication  
**Mitigation strategy:** Early nutritionist engagement, clear UI design, mobile testing

**No blockers. Risks are solvable with proper planning.**

---

## SECTION 9: RECOMMENDATION

### Adopt the Primary + Secondary Support Model

**Recommendation:** Replace the rigid 1:1 global mapping with the flexible plant-centric support relationship model.

**Why:**

1. **Scientifically honest:** Acknowledges nutrient complexity without overwhelming users
2. **Educationally sound:** Primary support teaches first, secondary supports teach depth
3. **Scalable:** Can add relationships as science evolves
4. **User-friendly:** "Show more" is optional, doesn't clutter the UI
5. **Plant-centric:** Each plant's unique benefits are visible

### Implementation Approach

**Phase 1 (Data Infrastructure):**
1. Refactor nutrition-benefit-library.ts to use SupportRelationship[]
2. Curate 80+ plants with relationships (1 primary + 2–4 secondary each)
3. Engage nutritionist for validation (sample of 10–15 plants)
4. Create curation guide for future additions

**Phase 2 (UI/UX):**
1. Update plant row rendering to show primary support
2. Add "Show more" button to reveal secondary supports
3. Implement secondary support display (rowspan or separate section)
4. Test at all breakpoints (mobile card layout + desktop table)

**Phase 3 (Polish):**
1. Finalize "Show more" interaction (button style, affordance)
2. Add tooltip: "Magnesium supports sleep, but also helps heart health"
3. Responsive testing (ensure secondary supports don't break layout)
4. Final nutritionist review of all plants

### Timeline

```
Phase 1 (Data): 4–5 days
  - Refactor data structure: 1 day
  - Curate relationships: 2–3 days
  - Nutritionist review: 1 day (parallel)

Phase 2 (UI): 4–5 days
  - Primary support rendering: 2 days
  - Secondary support expansion: 1–2 days
  - Mobile optimization: 1 day
  - Testing: 1 day

Phase 3 (Polish): 2–3 days
  - Interaction refinement: 1 day
  - Responsive fine-tuning: 1 day
  - Final review: 0.5 day

Total: 10–13 days (~2 weeks)
```

### Success Criteria

| Criterion | Measure |
|-----------|---------|
| **Data completeness** | 80+ plants with 1 primary + 2–4 secondary relationships |
| **Scientific accuracy** | All relationships verified by nutritionist |
| **UI clarity** | Primary support always visible, secondary via "Show more" |
| **Discoverability** | "Show more" button has >40% click rate (goal) |
| **Accessibility** | WCAG 2.1 AA, keyboard nav, screen reader friendly |
| **Responsive** | Works at 375/640/1024px, mobile cards don't overflow |
| **Performance** | Expanding secondary supports < 100ms |

---

## SECTION 10: WHAT THIS MEANS FOR EXISTING DESIGNS

### Changes to THA_30_PLANTS_MODAL_V2.md

**Sections requiring amendment:**
1. "V2 Proposed Structure" → Update Level 3 to show primary support
2. "Support↔Nutrient Mapping" → Replace with "Plant-Centric Relationships"
3. "Implementation Phases" → Phase 1 includes relationship curation
4. "Effort Estimates" → Add data curation effort

**Sections unchanged:**
1. Category grid, collapsible design
2. Three-level expansion (category → plant → meals)
3. Meal expansion inline
4. "Broaden your variety" suggestions
5. Adaptive density wireframes

---

### Changes to THA_30_PLANTS_MODAL_V2_DESIGN_VALIDATION.md

**Sections requiring amendment:**
1. "Executive Summary" → Update model description
2. "Support ↔ Nutrient Educational Model" → Replace with amended model
3. "Risks" → Add new risks specific to relationship curation
4. "Recommendation" → Update to reflect new model

**Sections that stay the same:**
1. "Rendering Model" (semantic table still works)
2. "Expansion Strategy" (3-level expansion unchanged)
3. "Responsive Strategy" (breakpoints unchanged)
4. Overall architecture recommendations

---

### Impact on Implementation Timeline

**Original estimate:** 2.5 weeks (11–13 days for Phases 1–3)

**Amended estimate:** 2.5–3 weeks (13–16 days for Phases 1–3)

**Why +2–3 days:**
- Relationship curation (additional data work)
- "Show more" UI implementation
- Mobile rendering adjustments
- Nutritionist review coordination

**Trade-off:** Slightly longer timeline, but significantly better design (more scientific, more flexible, more educational).

---

## FINAL REPORT

### Rollback Identifier
```
rollback/30-plants-modal-v2-support-model-amendment
Commit: 67ee85e
Tag created: 2026-06-16
```

### Is the Primary + Secondary Model Recommended?

**✓ YES — STRONGLY RECOMMENDED**

The amended model is superior to the original 1:1 global mapping:
- **Scientifically accurate:** Shows nutrient complexity
- **Educationally sound:** Primary teaches first, secondary teaches depth
- **Scalable:** Grows with science
- **User-friendly:** Simple by default, detailed on request
- **Flexible:** Plant-centric, not rule-based

### Suggested Data Structure

```typescript
interface SupportRelationship {
  support: string;        // "Sleep Quality"
  emoji: string;          // "😴"
  nutrient: string;       // "Magnesium"
  primary: boolean;       // true = show by default
  evidence?: string;      // "high" | "medium" | "low"
  description?: string;   // Educational explanation
}

// In nutrition-benefit-library.ts:
{
  canonicalKey: "pumpkin-seeds",
  displayName: "Pumpkin Seeds",
  category: "Seeds",
  relationships: SupportRelationship[], // 1 primary + 2–4 secondary
  variants: string[],
  mealNames: string[],
  dayNames: string[],
  summary: string
}
```

### Rendering Examples

**Collapsed (default):**
```
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▶
[Additional supports (+4) - Show more]
```

**Expanded (via "Show more"):**
```
🌻 Pumpkin Seeds | 😴 Sleep Quality | Magnesium | 3 ▼
                 | ❤️ Heart Health  | Magnesium |
                 | 💪 Muscle Func.  | Magnesium |
                 | 🛡️ Immune Sup.   | Zinc      |
                 | ⚡ Energy        | Iron      |
```

### Required Amendments

**To THA_30_PLANTS_MODAL_V2.md:**
1. Replace "Support↔Nutrient Mapping" section with plant-centric model
2. Update Phase 1 effort to include relationship curation (2–3 days)
3. Revise data structure sections

**To THA_30_PLANTS_MODAL_V2_DESIGN_VALIDATION.md:**
1. Rewrite "Support ↔ Nutrient Educational Model" section
2. Update "Recommendation" to reflect new model
3. Add new risks specific to relationship curation

**New document:** THA_30_PLANTS_MODAL_V2_SUPPORT_MODEL_AMENDMENT.md (this document)

### Risks (All Manageable)

1. **User confusion about primary/secondary** → Clear labeling, tooltips (negligible effort)
2. **"Show more" button low discoverability** → Prominent badge, button styling (1 day)
3. **Secondary supports complicate table** → Indentation, color, mobile cards (1 day)
4. **Data curation burden** → Nutritionist engagement, curation guide (1–2 days)
5. **Scaling beyond 5 secondary** → Limit to top 4–5, use "Show more" (1 day)
6. **Mobile rendering complexity** → Mobile-specific CSS, accordion pattern (1 day)

**Total risk mitigation effort:** 4–5 days (already included in amended timeline)

---

### Recommendation

**PROCEED with amended model immediately.**

The Primary + Secondary support relationship model is:
1. **Better** than 1:1 global mapping (more accurate, more flexible)
2. **Implementable** within timeline (2.5–3 weeks vs. 2.5 weeks)
3. **Sustainable** (scales as science grows)
4. **Educational** (simple first, details on request)

Do not revert to the original 1:1 model. The amendment addresses the core limitation of the original design.

---

### Confidence Level

| Aspect | Confidence |
|--------|-----------|
| Primary + Secondary model is superior | **Very High (95%)** |
| Data structure is sound | **Very High (95%)** |
| Implementation is feasible | **High (85%)** |
| Timeline is realistic | **High (85%)** |
| Risks are manageable | **High (85%)** |
| **Overall confidence** | **High (88%)** |

---

## CONFIRMATION: NO CODE CHANGES MADE

This investigation and design amendment is **research and design analysis only**:

✓ No component changes  
✓ No CSS modifications  
✓ No data structure changes  
✓ No schema updates  
✓ No API changes  
✓ No migrations created  
✓ No commits beyond rollback tag  

**Working directory status:** Stashed during investigation (stashed changes restored after)  
**Rollback available:** `git reset --hard rollback/30-plants-modal-v2-support-model-amendment`

---

## APPENDIX: GLOSSARY

**Primary Support:** The main health benefit a plant is known for (e.g., Pumpkin Seeds → Sleep)

**Primary Nutrient:** The nutrient that drives the primary support (e.g., Magnesium)

**Secondary Support:** Additional health benefit from the plant (e.g., Pumpkin Seeds → Heart Health)

**Secondary Nutrient:** The nutrient that drives a secondary support (e.g., Magnesium, Zinc, Iron)

**Support Relationship:** A connection between a nutrient and a health outcome (Magnesium → Sleep)

**Plant-centric model:** Each plant defines its own relationships (vs. global rules)

**"Show more" pattern:** Progressive disclosure (primary visible, secondary hidden until requested)

**Relationship curation:** Process of defining which support↔nutrient pairs belong to each plant

---

**Investigation completed:** 2026-06-16  
**Amendment status:** ✓ RECOMMENDED  
**Next action:** Product owner review + Phase 1 amendment approval
