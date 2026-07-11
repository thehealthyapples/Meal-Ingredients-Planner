# Meal Detail Experience V3 — Refinement Report

**Investigation type:** Design refinement and architecture adjustment  
**Date:** 2026-06-16  
**Status:** Complete — Investigation and design only, no code changes  
**Rollback identifier:** `rollback/meal-detail-v3-refinement-investigation`

---

## 1. Executive Summary

The Meal Detail Experience V3 investigates THA as **The Trust Screen**. This refinement takes the V3 architecture and sharpens three areas to maximize user confidence and clarity:

1. **Family Confidence** — A new, permanently visible section that answers "Can my household trust this meal?"
2. **Simplified Household Adaptations** — Cleaner default view that answers "Can we eat this?" first, details available on demand
3. **Nutrition repositioned** — Moves from competing with trust messaging to supporting nutritional reference in existing tabs

### Core insight

Users ask two questions when viewing a meal:

> **1. "Why should I trust this?"** (answered by: Why THA chose this + Family Confidence)
>
> **2. "Can we eat this?"** (answered by: Simplified Household Adaptations)

Nutrition, ingredients, and recipe are reference materials that support these two questions, not alternatives to them.

---

## 2. Updated Trust Screen Principles

### The updated principle

```
Trust (Why THA chose this + Family Confidence)
    ↓
Household Fit (Simplified Adaptations)
    ↓
Health Improvements (Simply Better Choices)
    ↓
Recipe + Ingredients + Nutrition (Supporting reference)
```

### Key decisions

| Before | After | Why |
|--------|-------|-----|
| Nutrition card competing for hero space | Nutrition in supporting tabs | Nutrition is validation, not primary argument |
| Household Adaptations: full detail list (6+ restrictions per eater) | Simplified: "Needs changes" / "Fully compatible" with expandable | Users need yes/no first, details on demand |
| No visible trust metric | Family Confidence section with trust indicators | Users need proof the algorithm understands their family |
| Simply Better Choices only in modal | Simply Better Choices as expandable section on detail page | Users should see improvement opportunities without modal |

---

## 3. Family Confidence

### Purpose

**Family Confidence** is a permanently visible card that communicates:
- Whether the meal fits the household
- How much change is needed
- Familiarity with this meal
- Track record of success

This section answers the question: **"Has this worked for families like ours before?"**

### Visual Design

#### Option A: Card format

```
┌─────────────────────────────────────┐
│ Family Confidence                   │
├─────────────────────────────────────┤
│ Very High                           │
│ ✓ Fits entire household             │
│ ✓ No substitutions required         │
│ ✓ Already cooked 4 times            │
│ ★★★★★                              │
└─────────────────────────────────────┘
```

#### Option B: Moderate confidence example

```
┌─────────────────────────────────────┐
│ Family Confidence                   │
├─────────────────────────────────────┤
│ Moderate                            │
│ ✓ Fits 3 of 4 eaters                │
│ ⚠ One substitution required         │
│ ✓ New recipe                        │
│ ★★★★☆                              │
└─────────────────────────────────────┘
```

#### Option C: Low confidence example

```
┌─────────────────────────────────────┐
│ Family Confidence                   │
├─────────────────────────────────────┤
│ Getting Started                     │
│ ⓘ 1 of 4 eaters compatible          │
│ ⓘ Multiple changes needed           │
│ ⚠ First time                        │
│ ★★☆☆☆                              │
└─────────────────────────────────────┘
```

### Data sources

| Metric | Source | Status | Effort |
|--------|--------|--------|--------|
| Household compatibility % | `HouseholdSafeEaterSnapshot` or adapt check | Available | Expose |
| Required substitutions count | `EaterAdaptation` array length | Available | Count |
| Meal reuse count (past 4 weeks) | Planner entry history | Partial (need aggregation) | ~1 day |
| Star rating | Derived from above (5-point scale) | Derived | Calculate |
| "Already cooked X times" text | Weekly planner history | Partial (need query) | ~1 day |

### Confidence level algorithm

```
Very High (★★★★★)
├─ Fits entire household (100%)
├─ No substitutions needed
└─ Cooked 2+ times in past 4 weeks

High (★★★★☆)
├─ Fits entire household
├─ 0–1 substitutions needed
└─ Cooked 1 time or familiar meal

Moderate (★★★☆☆)
├─ Fits 75–99% of household
├─ 1–2 substitutions needed
└─ New or rarely used

Low (★★☆☆☆)
├─ Fits 50–75% of household
├─ 2+ substitutions needed
└─ New recipe

Getting Started (★☆☆☆☆)
├─ Fits <50% of household
├─ Major changes needed
└─ First time
```

### Placement

- **COMPACT / COMFORTABLE:** Directly below "Why THA chose this" section
- **EXPANDED:** Directly below "Why THA chose this" section, same visual prominence
- Always visible, never collapsible

---

## 4. Simplified Household Adaptations

### Problem with current design

Current design shows all restrictions per eater:

```
Lilly
├─ Vegetarian
├─ GF
├─ Dairy Free
├─ Eggs
└─ Soy

Swap: Chicken → Quorn
```

Users need to parse multiple restrictions and infer what changes are needed. The cognitive load is high.

### Refined design

Simplify to: **"Can this eater eat this meal?"** First, then expand for details.

#### Default (collapsed) view

```
Lilly
Needs changes
Chicken → Quorn
[View details]

────────────

Daisy
✓ Fully compatible
```

**Data shown:**
- Eater name
- Status badge: "Needs changes" (orange) or "✓ Fully compatible" (green)
- Primary swap (if applicable): `Original → Replacement`
- Optionally: "View details" link to expand

#### Expanded view (on click "View details")

```
Lilly — Vegetarian

Why changes are needed:
├─ Vegetarian diet
├─ GF intolerance
└─ Dairy sensitivity

Required swaps:
├─ Chicken → Quorn
├─ Butter → Plant-based butter
└─ Milk → Oat milk

Reasoning:
"Quorn is a complete plant-based protein that mimics chicken's 
texture while respecting vegetarian and GF restrictions. 
Oat milk provides creaminess without dairy."
```

### Visual design

#### Compact view (default)

```
┌──────────────────────────────┐
│ Household Adaptations        │
├──────────────────────────────┤
│                              │
│ Lilly                        │
│ Needs changes                │
│ Chicken → Quorn              │
│ [View details]               │
│                              │
│ ────────────────────────────  │
│                              │
│ Daisy                        │
│ ✓ Fully compatible           │
│                              │
└──────────────────────────────┘
```

#### Expanded view (on click)

```
┌──────────────────────────────┐
│ Household Adaptations        │
│ [Collapse all]               │
├──────────────────────────────┤
│                              │
│ Lilly — Vegetarian           │
│ Needs changes                │
│                              │
│ Why:                         │
│ • Vegetarian diet            │
│ • GF intolerance             │
│ • Dairy sensitivity          │
│                              │
│ Changes needed:              │
│ • Chicken → Quorn            │
│ • Butter → Plant butter      │
│ • Milk → Oat milk            │
│                              │
│ Reasoning: Quorn is ...      │
│                              │
│ ────────────────────────────  │
│                              │
│ Daisy                        │
│ ✓ Fully compatible           │
│ No changes needed.           │
│                              │
└──────────────────────────────┘
```

### Data sources

| Data | Source | Status | Effort |
|------|--------|--------|--------|
| Eater name | `household.eaters` | Need scope | ~1 day |
| Compatibility status | Adapt API (goal: "household") | Available | Expose |
| Required swaps/changes | `EaterAdaptation[]` | Available | Display |
| Swap reasoning | `EaterAdaptation.note` | Available | Display |
| Dietary restrictions | Household member profile | Need scope | ~1 day |

### When to show "Needs changes" vs. "✓ Fully compatible"

**Needs changes** if `EaterAdaptation.changeType !== "none"`

**Fully compatible** if `EaterAdaptation.changeType === "none"`

---

## 5. Simply Better Choices

### Current state

Simply Better Choices (uplift suggestions) exist in the planner meal modal but are not visible on the standalone meal detail page.

### Refined design

Add a collapsible "Simply Better Choices" section between Household Adaptations and the Ingredients/Recipe/Nutrition tabs.

#### Collapsed state

```
┌─────────────────────────────────────┐
│ Simply Better Choices           [⌄] │
│ 3 simple ways to make this           │
│ meal even better                    │
└─────────────────────────────────────┘
```

OR, with a preview hint:

```
┌─────────────────────────────────────┐
│ Simply Better Choices           [⌄] │
│ + Pumpkin seeds · Spinach · ...     │
└─────────────────────────────────────┘
```

#### Expanded state

```
┌─────────────────────────────────────┐
│ Simply Better Choices           [⌃] │
├─────────────────────────────────────┤
│                                     │
│ Pumpkin seeds                       │
│ Minerals + plant-based protein      │
│ Sprinkle on finished curry          │
│ ☐ Already used this week            │
│ [+ Add] [− Remove]                  │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Spinach                             │
│ Anti-inflammatory, rich in iron     │
│ Stir in at the end                  │
│ ☐ Already used this week            │
│ [+ Add] [− Remove]                  │
│                                     │
│ ─────────────────────────────────── │
│                                     │
│ Extra Virgin Olive Oil              │
│ Monounsaturated fats for heart      │
│ Drizzle to finish                   │
│ ✓ Already used this week            │
│ [+ Add] [− Remove]                  │
│                                     │
└─────────────────────────────────────┘
```

### Data sources

| Data | Source | Status |
|------|--------|--------|
| Uplift suggestions | `uplift-rules.ts` | Available (in modal only) |
| Benefit text | Uplift rule `why` | Available |
| How to use | Uplift rule `how` | Available |
| Already used this week | Compare to planner | Partial |

### Interaction rules

- **Default:** Collapsed
- **On [⌄] click:** Expand to show all suggestions
- **Per-suggestion actions:** Add or Remove (mutates meal variant)
- **Visual cue:** Show "Already used this week" with checkmark or indicator

---

## 6. Compact Wireframe (< 640px — Phone Portrait)

```
╔════════════════════════════════════════╗
║ PageHeader: [Back] Chicken Curry [⋯]   ║
╠════════════════════════════════════════╣
║                                        ║
║     ╔═══════════════════════════╗      ║
║     ║                           ║      ║
║     ║       [Image]             ║      ║
║     ║      (square)             ║      ║
║     ║                           ║      ║
║     ╚═══════════════════════════╝      ║
║                                        ║
║ Family Table · Comfort                 ║
║ 🌿 Variety: High                       ║
║ Simply Better Choices: 3               ║
║                                        ║
║ ──────────────────────────────────── ║
║ Why THA chose this                     ║
║ ──────────────────────────────────── ║
║ ✓ Fits 4 of 4 eaters                   ║
║ ✓ Mediterranean friendly                ║
║ ✓ Family favourite                     ║
║ ✓ Contributes 6 plants                 ║
║ ✓ Supports weekly variety              ║
║ ✓ Uses ingredients already in week     ║
║                                        ║
║ ──────────────────────────────────── ║
║ Family Confidence                      ║
║ ──────────────────────────────────── ║
║ Very High                              ║
║ ✓ Fits entire household                ║
║ ✓ No substitutions required            ║
║ ✓ Already cooked 4 times               ║
║ ★★★★★                                 ║
║                                        ║
║ ──────────────────────────────────── ║
║ Household Adaptations                 ║
║ ──────────────────────────────────── ║
║                                        ║
║ Lilly                                  ║
║ Needs changes                          ║
║ Chicken → Quorn                        ║
║ [View details]                         ║
║                                        ║
║ Daisy                                  ║
║ ✓ Fully compatible                     ║
║                                        ║
║ ──────────────────────────────────── ║
║ Simply Better Choices (3)         [⌄] ║
║ 3 simple ways to make this...          ║
║                                        ║
║ ──────────────────────────────────── ║
║ [Ingredients] [Recipe] [Nutrition]     ║
║ ──────────────────────────────────── ║
║                                        ║
║ • 4 chicken thighs                     ║
║ • 2 tbsp coconut oil                   ║
║ • 400g tinned tomatoes                 ║
║ • 1 onion, chopped                     ║
║ • 3 cloves garlic                      ║
║                                        ║
║ [+ Add to basket]                      ║
║                                        ║
╚════════════════════════════════════════╝
```

---

## 7. Comfortable Wireframe (640–1279px — Tablet / Small Laptop)

```
╔═══════════════════════════════════════════════════════════════════╗
║ PageHeader: [Back] [Edit] [Basket] [Adapt] [Delete]              ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║ ╔═════════════════════╗  Chicken Curry                            ║
║ ║                     ║  Family Table · Comfort                   ║
║ ║    [Image]          ║  Mediterranean · Dairy-free               ║
║ ║   (square)          ║  🌿 Variety: High                         ║
║ ║                     ║  Simply Better Choices: 3                 ║
║ ║                     ║                                           ║
║ ║                     ║  Allergens: ⚠ Sesame                     ║
║ ║                     ║                                           ║
║ ╚═════════════════════╝                                           ║
║                                                                   ║
║ ─────────────────────────────────────────────────────────────── ║
║ Why THA chose this                                               ║
║ ─────────────────────────────────────────────────────────────── ║
║ ✓ Fits 4 of 4 eaters                                            ║
║ ✓ Mediterranean friendly                                         ║
║ ✓ Family favourite                                               ║
║ ✓ Contributes 6 plants                                           ║
║ ✓ Supports weekly variety                                        ║
║ ✓ Uses ingredients already in week                               ║
║                                                                   ║
║ ─────────────────────────────────────────────────────────────── ║
║ Family Confidence                                                ║
║ ─────────────────────────────────────────────────────────────── ║
║ Very High                                                        ║
║ ✓ Fits entire household                                          ║
║ ✓ No substitutions required                                      ║
║ ✓ Already cooked 4 times                                         ║
║ ★★★★★                                                            ║
║                                                                   ║
║ ─────────────────────────────────────────────────────────────── ║
║ Household Adaptations                                            ║
║ ─────────────────────────────────────────────────────────────── ║
║                                                                   ║
║ Lilly              Daisy                                          ║
║ Needs changes      ✓ Fully compatible                            ║
║ Chicken → Quorn                                                  ║
║                                                                   ║
║ ─────────────────────────────────────────────────────────────── ║
║ Simply Better Choices (3)                                  [⌄]   ║
║ 3 simple ways to make this even healthier                        ║
║                                                                   ║
║ ─────────────────────────────────────────────────────────────── ║
║ [Ingredients] [Recipe] [Nutrition]                               ║
║ ─────────────────────────────────────────────────────────────── ║
║                                                                   ║
║ Serves 4 · Adjust: [−] 2 [+]                                     ║
║                                                                   ║
║ • 4 chicken thighs (120g per serving)                             ║
║ • 2 tbsp coconut oil (½ tbsp per serving)                         ║
║ • 400g tinned tomatoes (100g per serving)                         ║
║ • 1 onion, chopped (¼ per serving)                                ║
║ • 3 cloves garlic (¾ per serving)                                 ║
║ • 1 tbsp curry powder                                             ║
║ • ½ tsp turmeric                                                  ║
║ • 200ml coconut milk                                              ║
║                                                                   ║
║ [+ Add to basket]                                                 ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## 8. Expanded Wireframe (≥ 1280px — Large Desktop)

```
╔════════════════════════════════════════════════════════════════════════════╗
║ PageHeader: [Back] [Edit] [Basket] [Adapt] [Delete]                        ║
╠════════════════════════════════════════════════════════════════════════════╣
║                                                                            ║
║ ╔════════════════════╗  Chicken Curry                                      ║
║ ║                    ║  Family Table · Comfort                             ║
║ ║   [Image]          ║  Mediterranean · Dairy-free                         ║
║ ║  (450×450)         ║  🌿 Variety: High · Simply Better Choices: 3        ║
║ ║                    ║                                                     ║
║ ║                    ║  Allergens: ⚠ Sesame                               ║
║ ║                    ║                                                     ║
║ ║                    ║  NUTRITION QUICK LOOK (per serving)                 ║
║ ║                    ║  ┌─────────────────────────────────────┐            ║
║ ║                    ║  │ 🔥 285 cal  │ 🥩 28g protein        │            ║
║ ║                    ║  │ 🌾 18g carbs │ 🧈 12g fat            │            ║
║ ║                    ║  │ 🍪 2g sugar  │ 🧂 0.8g salt           │            ║
║ ║                    ║  └─────────────────────────────────────┘            ║
║ ║                    ║                                                     ║
║ ╚════════════════════╝                                                     ║
║                                                                            ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ Why THA chose this                                                         ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ ✓ Fits 4 of 4 eaters    ✓ Family favourite                                ║
║ ✓ Mediterranean friendly ✓ Contributes 6 plants                            ║
║ ✓ Supports weekly       ✓ Uses ingredients already in week                 ║
║   variety                                                                  ║
║                                                                            ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ Family Confidence                                                          ║
║ ────────────────────────────────────────────────────────────────────────  ║
║                                                                            ║
║ Very High                                                                  ║
║ ✓ Fits entire household                                                   ║
║ ✓ No substitutions required                                               ║
║ ✓ Already cooked 4 times                                                  ║
║ ★★★★★                                                                     ║
║                                                                            ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ Household Adaptations                                                      ║
║ ────────────────────────────────────────────────────────────────────────  ║
║                                                                            ║
║ ┌──────────────────────────────────┬───────────────────────────────────┐  ║
║ │ Lilly                            │ Daisy                             │  ║
║ │ Needs changes                    │ ✓ Fully compatible               │  ║
║ │ Chicken → Quorn                  │ No changes needed.              │  ║
║ │ Why: Vegetarian & GF compatible  │                                  │  ║
║ └──────────────────────────────────┴───────────────────────────────────┘  ║
║                                                                            ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ Simply Better Choices (3)                                            [⌄]   ║
║ 3 simple ways to make this even healthier                                 ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ (collapsed preview — [+] Expand all)                                      ║
║                                                                            ║
║ ────────────────────────────────────────────────────────────────────────  ║
║ [Ingredients] [Recipe] [Nutrition]                                        ║
║ ────────────────────────────────────────────────────────────────────────  ║
║                                                                            ║
║ Serves 4                                                                   ║
║ Adjust servings: [−] 2 [+]                                                 ║
║                                                                            ║
║ INGREDIENTS (all scaled to 2 servings):                                    ║
║ • 2 chicken thighs (240g)          • 1 tbsp curry powder                  ║
║ • 1 tbsp coconut oil               • ¼ tsp turmeric                       ║
║ • 200g tinned tomatoes             • 100ml coconut milk                    ║
║ • ½ onion, chopped                 • Salt & pepper to taste               ║
║ • 1½ cloves garlic                                                        ║
║                                                                            ║
║ [+ Add to basket]                                                          ║
║                                                                            ║
╚════════════════════════════════════════════════════════════════════════════╝
```

---

## 9. Implementation Implications

### New components required

| Component | Purpose | Dependencies | Effort |
|-----------|---------|---|---|
| `MealFamilyConfidence` | Render Family Confidence card | Household context, adapt API | 1–2 days |
| `HouseholdAdaptationsSummary` | Simplified adaptations view with expand | Adapt API, modal extraction | 1–2 days |
| `SimplyBetterChoicesPanel` | Reusable uplift suggestions | Extract from MealUpliftPanel | 1 day |
| `MealTrustSummary` | Render "Why THA chose this" | Meal-scoring-service exposure | 1 day |

### Data queries needed

| Query | Purpose | Status | Effort |
|-------|---------|--------|--------|
| Household context on detail page | For eater names, compatibility % | Missing scope | ~1 day |
| Weekly meal reuse count | For "Already cooked X times" | Missing | ~1 day |
| Adapted household snapshot | For per-eater changes | Available (modal) | Expose |
| Planner entries (ingredients comparison) | For "already in week" indicator | Missing | ~2 days |

### Layout changes

| Change | File | Complexity | Effort |
|--------|------|---|---|
| Add Family Confidence section | `meal-detail-page.tsx` | Low | 1 day |
| Simplify Household Adaptations | `meal-detail-page.tsx` | Medium | 1–2 days |
| Add Simply Better Choices section | `meal-detail-page.tsx` | Low | 1 day |
| Implement adaptive density (COMPACT/COMFORTABLE/EXPANDED) | `meal-detail-page.tsx` + CSS | Medium | 1–2 days |
| Nutrition quick-look in EXPANDED header | `meal-detail-page.tsx` | Low | 1 day |

### Effort breakdown

| Phase | Tasks | Effort | Dependencies |
|-------|-------|--------|---|
| **Phase 1: Core structure** | Extract components, wire sections | 3–4 days | None |
| **Phase 2: Data queries** | Household context, reuse count, ingredient matching | 3–4 days | Phase 1 |
| **Phase 3: Layouts** | Adaptive density (COMPACT/COMFORTABLE/EXPANDED) | 2–3 days | Phase 1, adaptive-density hook |
| **Total** | All phases | **8–11 days** | — |

---

## 10. Risks

### Risk 1 — Household context not available on detail page (MEDIUM)

**Issue:** Eater names and household compatibility require household scope, which detail page may not have.

**Mitigation:**
- Load household from user context if logged in
- Fallback: Generic "household members" if scope unavailable
- Test with and without household context
- Phase 2 task: confirm scope design with backend

---

### Risk 2 — Family Confidence data aggregation (MEDIUM)

**Issue:** "Already cooked X times" requires aggregating planner history, which may not be currently queryable.

**Mitigation:**
- Phase 1: Use placeholder text ("Common choice", "Trusted recipe")
- Phase 2: Implement planner history aggregation
- Start with "star rating" derived from compatibility % + substitution count
- Don't block MVP on full historical data

---

### Risk 3 — Simply Better Choices requires extraction (MEDIUM)

**Issue:** MealUpliftPanel is tightly coupled to planner modal; extracting it may introduce bugs.

**Mitigation:**
- Create wrapper component `SimplyBetterChoicesPanel` (don't modify original)
- Test both contexts (planner modal + detail page) after extraction
- Use feature flag if needed (can disable on detail page)

---

### Risk 4 — Layout regression on edge cases (LOW)

**Issue:** New sections may cause unexpected wraps or overflow at intermediate breakpoints.

**Mitigation:**
- Test at 6 breakpoints: 375px, 640px, 768px, 1024px, 1280px, 1536px
- Use existing grid/spacing primitives (no custom hardcoded widths)
- Mobile-first: start with COMPACT, layer up
- Visual regression test before/after

---

### Risk 5 — Nutrition section displacement confusion (LOW)

**Issue:** Moving nutrition from hero to supporting may confuse users who expect it upfront.

**Mitigation:**
- Keep nutrition in expanded header at EXPANDED density (quick-look mini view)
- Nutrition tab content unchanged (full detail still available)
- Test user expectation: users looking for nutrition should find it easily
- Monitor analytics: time-to-nutrition-tab

---

## 11. Recommendation

### **PROCEED with phased rollout.**

The three refinements strengthen V3 without adding complexity:

1. **Family Confidence** adds trust signaling (new section, medium effort)
2. **Simplified Household Adaptations** improves clarity (medium complexity, great UX impact)
3. **Nutrition repositioned** reduces visual noise while preserving access (low effort, high clarity gain)

### Recommended approach

**Phase 1 — Core structure (3–4 days)**
- Extract components (MealTrustSummary, MealFamilyConfidence, HouseholdAdaptationsSummary)
- Wire sections into detail page
- Use placeholder/hardcoded data for Family Confidence ("Very High" for all meals, for now)
- Preserve existing tabs unchanged

**Phase 2 — Data integration (3–4 days)**
- Expose household context to detail page
- Query weekly reuse count
- Aggregate family confidence data
- Implement ingredient-in-week matching for Simply Better Choices

**Phase 3 — Polish (2–3 days)**
- Adaptive density layouts (COMPACT/COMFORTABLE/EXPANDED)
- Nutrition quick-look in EXPANDED header
- Visual regression testing at 6 breakpoints

### Success criteria

- ✅ User sees "Why THA chose this" (always visible, never competing with nutrition)
- ✅ User sees "Family Confidence" (trust metric, always visible)
- ✅ User sees simplified household status ("Needs changes" / "✓ Fully compatible")
- ✅ User can expand to see detailed adaptations
- ✅ User can expand "Simply Better Choices" inline
- ✅ Nutrition remains in full detail tabs
- ✅ No regression to existing interactions
- ✅ Responsive at COMPACT / COMFORTABLE / EXPANDED densities

---

## 12. Confirmation

> **Investigation only. No code changes made.**

### Files reviewed (read-only):
- `docs/investigations/cookbook/MEAL_DETAIL_EXPERIENCE_V3.md` (existing investigation)
- `client/src/pages/meal-detail-page.tsx` (structure audit)
- `shared/meal-adaptation.ts` (data types)
- `client/src/components/MealUpliftPanel.tsx` (uplift component structure)

### Investigation scope completed:
- ✅ Three refinements documented in detail
- ✅ Family Confidence design finalized (algorithm, data sources, visual design)
- ✅ Simplified Household Adaptations design finalized (default + expanded views)
- ✅ Simply Better Choices repositioning finalized (expandable on detail page)
- ✅ Three wireframes created (COMPACT, COMFORTABLE, EXPANDED)
- ✅ Implementation phases outlined (3 phases, 8–11 days total)
- ✅ Data inventory updated (what exists, what's needed)
- ✅ Risks identified and mitigated
- ✅ Rollback identifier created

### Out of scope (as required):
- ❌ No code changes
- ❌ No CSS modifications
- ❌ No component creation
- ❌ No API changes
- ❌ No schema changes
- ❌ No migrations

---

## Appendix A: Family Confidence Algorithm Detail

### Data inputs

```typescript
interface FamilyConfidenceInput {
  householdCompatibilityPercent: number;  // 0–100
  substitutionCount: number;               // 0–N
  weeklyReuseFourWeeks: number;            // 0–N
  weeklyReusePreviousWeek: number;        // 0–1
  isFavorited: boolean;                    // true/false
}
```

### Confidence level calculation

```
confidence_score = (
  (householdCompatibilityPercent / 100) * 0.5 +     // 50% weight
  max(0, 1 - substitutionCount / 3) * 0.2 +          // 20% weight (1–2 subs = lower)
  min(weeklyReuseCount, 4) / 4 * 0.3                 // 30% weight (familiarity)
)

if confidence_score >= 0.85: Very High ★★★★★
else if confidence_score >= 0.70: High ★★★★☆
else if confidence_score >= 0.55: Moderate ★★★☆☆
else if confidence_score >= 0.40: Low ★★☆☆☆
else: Getting Started ★☆☆☆☆
```

### Message examples

| Level | Message variant 1 | Message variant 2 |
|-------|---|---|
| Very High | "Fits entire household\nNo substitutions required\nAlready cooked 4 times" | "Trusted recipe\nWorks for everyone\nFamily favourite" |
| High | "Fits entire household\n0–1 substitution needed\nCooked recently" | "Good fit\nMinimal changes\nFamiliar choice" |
| Moderate | "Fits 3 of 4 eaters\n1–2 substitutions needed\nNew recipe" | "Partial fit\nSome changes needed\nFirst time trying" |
| Low | "Fits 2 of 4 eaters\n2+ substitutions\nNew recipe" | "Limited fit\nMultiple changes\nUnfamiliar" |
| Getting Started | "Fits <50% of household\nMajor changes needed\nFirst time" | "Exploring options\nSignificant changes\nNew adventure" |

---

## Appendix B: Visual Design System

### Family Confidence colors

- **Very High:** Green accent (`text-green-600`, `bg-green-50`)
- **High:** Light green
- **Moderate:** Amber accent (`text-amber-600`, `bg-amber-50`)
- **Low:** Orange accent (`text-orange-600`, `bg-orange-50`)
- **Getting Started:** Gray accent (`text-gray-600`, `bg-gray-50`)

### Household Adaptations status badges

- **Needs changes:** Orange badge (`bg-orange-100 text-orange-700`)
- **Fully compatible:** Green checkmark with text (`text-green-600`)

### Section spacing

- **Between sections:** 1.5 rem (24px) vertical spacing
- **Within section:** 1 rem (16px) padding, 0.75 rem (12px) item spacing
- **Responsive:** Reduce by 25% at COMPACT density, increase by 25% at EXPANDED

---

## Appendix C: Implementation Checklist

### Phase 1: Core Structure

- [ ] Create `MealFamilyConfidence.tsx` component
- [ ] Create `HouseholdAdaptationsSummary.tsx` component
- [ ] Create `SimplyBetterChoicesPanel.tsx` wrapper (extract from MealUpliftPanel)
- [ ] Refactor `meal-detail-page.tsx` layout to include new sections
- [ ] Wire sections with placeholder data
- [ ] Test at 375px, 768px, 1024px breakpoints
- [ ] Verify no regression to existing tabs

### Phase 2: Data Integration

- [ ] Query household context (if available)
- [ ] Implement weekly reuse count query
- [ ] Implement ingredient-in-week matching
- [ ] Populate Family Confidence algorithm
- [ ] Populate "Why THA chose this" with real data
- [ ] Test data display at all breakpoints

### Phase 3: Layouts & Polish

- [ ] Implement COMPACT density layout
- [ ] Implement COMFORTABLE density layout
- [ ] Implement EXPANDED density layout
- [ ] Add nutrition quick-look to EXPANDED header
- [ ] Test at 6 breakpoints: 375, 640, 768, 1024, 1280, 1536
- [ ] Visual regression testing
- [ ] Accessibility audit (contrast, ARIA, keyboard navigation)

### Phase 4: Mobile Gestures & A11y

- [ ] Add loading states for adapt action
- [ ] Add error states for failed queries
- [ ] Smooth expand/collapse animations
- [ ] Touch targets ≥44px at mobile
- [ ] Test on iOS Safari, Chrome Android
- [ ] Final user testing

---

**End of refinement report.**
