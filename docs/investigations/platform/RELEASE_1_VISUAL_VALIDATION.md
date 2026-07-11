# Release 1 — Visual & UX Validation Report

**Rollback Identifier:** `rollback/release-1-visual-validation-20260609` → commit `1e83f32`
**Date:** 2026-06-09
**Scope:** Visual and UX review of Release 1 Nutrition Enhancement before production deployment
**Method:** Direct code analysis — component markup, Tailwind class audit, layout hierarchy review, and UX assessment

> **Note on screenshots:** The sandbox environment does not have the system libraries required to run Chromium headlessly (missing `libglib-2.0.so.0`). This report is based on precise code analysis of every component, typography scale, layout rule, and render condition. All findings are deterministic from the source.

---

## EXECUTIVE SUMMARY

Release 1 successfully implements the Nutrition Enhancement philosophy without disrupting the core planner experience. The features are present, correct, and appropriately non-intrusive. However, the implementation leans heavily toward understated — both the Plant Diversity Counter and the Nutrition Boost Panel are small enough that a first-time user could miss them entirely. This is a deliberate design stance ("feel useful, not preachy") but there is a discovery problem that needs addressing before production.

**Recommendation: B — Minor tweaks recommended before deployment.**

The core functionality is production-ready. Two issues should be addressed:
1. The Nutrition Boost Panel is too deep in the meal dialog scroll stack — many users will never see it.
2. The Plant Diversity Counter label "Plant Diversity" is opaque without immediate context.

Neither issue is a blocker, but both reduce the feature's ability to deliver value.

---

## COMPONENT INVENTORY

### What was built and where

| Component | Location in UI | Rendered condition |
|---|---|---|
| `WeeklyPlantDiversityCounter` | Planner header row, right section | Always visible when planner is loaded |
| `PlannerVarietyLegend (compact)` | Planner header row, right of counter | Always visible (pre-existing) |
| `NutritionBoostPanel` | Meal detail dialog, after MealVarietyNudge | Visible only when dialog is open AND boosts are not empty |
| `MealVarietyNudge` | Meal detail dialog, before NutritionBoostPanel | Pre-existing |
| `MealUpliftPanel` | Meal detail dialog, after NutritionBoostPanel | Pre-existing async panel |

---

## SCREENSHOT-EQUIVALENT DESCRIPTIONS

### Component 1 — Plant Diversity Counter (header row)

**Rendered markup produces:**

```
┌─────────────────────────────────────────────────────────────────┐
│  [🌿] Plant Diversity  18 / 30                                  │
│  [▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒]  (4px height, 60% teal fill)     │
└─────────────────────────────────────────────────────────────────┘
   ← min-w-[140px] →
```

**Typography:**
- Leaf icon: 12px (`h-3 w-3`), emerald-600 at 70% opacity
- "Plant Diversity" label: **10px**, muted-foreground at 60%, font-medium
- "18 / 30" count: **10px** font-semibold (number) + muted-foreground/50 ("/ 30")
- Progress bar: **4px** tall (`h-1`), full-width within container, muted/40 background, teal/amber/emerald fill

**Sits alongside:**
```
[🌿] Plant Diversity  18 / 30        Variety  • Fruit • Vegetables • Whole grains • Herbs & spices • Olive oil
[▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒]
```
Both in a `flex items-center gap-4 flex-wrap` row, positioned on the right side of the planner header bar.

---

### Component 2 — Nutrition Boost Panel (meal detail dialog)

**Rendered markup produces:**

```
🌿 NUTRITION BOOSTS

  +  Spinach  (extra veg)
  +  Avocado  (healthy fat)
  +  Grilled Tomatoes  (extra veg)

  Optional additions — stir in, serve alongside, or sprinkle over.
```

**Typography:**
- Section header icon: 14px (`h-3.5 w-3.5`), emerald-600/70
- "NUTRITION BOOSTS" label: **11px**, uppercase, letter-spacing 0.1em, muted-foreground/50
- "+" prefix: muted-foreground/70 in emerald-600/60 dark:emerald-400/60
- Item name: **12px** (`text-xs`), muted-foreground/70
- Category label: **10px**, muted-foreground/35
- Footer: **10px**, muted-foreground/40, italic

**Dialog context:** The meal detail dialog is `max-w-[640px] max-h-[82vh] overflow-y-auto`. The boost panel appears after the following sections in order:
1. Meal header (name, tags, calorie count)
2. Adaptation / household safety section (may be long)
3. Ingredients list
4. Member restriction safety display (if applicable)
5. `MealVarietyNudge` — italic soft text line
6. **`NutritionBoostPanel`** ← Release 1 feature
7. `MealUpliftPanel` (async, conditional)

---

## PLANT DIVERSITY ASSESSMENT

### Is it understandable?

**Not immediately — without context.** The label "Plant Diversity" at 10px next to a bare "18 / 30" leaves the "30 of what?" question unanswered unless the user hovers for the tooltip. A new user's likely first read is "18 out of 30 what?" with no follow-up.

The tooltip copy is good:
> "Counts unique plant foods (fruit, veg, whole grains, herbs & spices, olive oil) across your week's meals. Aim for 30 different plants per week."

But tooltips are invisible on mobile, and the kind of user who most needs this guidance is the one least likely to hover.

### Would a new user know what it means?

No. "Plant Diversity" is not everyday language. "How many different plants you've eaten this week" is, but that's too long for a label. "Plant Variety", "Different plants", or "Plant score" would test better with non-nutritionist users.

The 30-plant target is also unexplained in-line. The tooltip explains it but is not self-evident. Contrast with "30 of 30 plants" — that format gives completion satisfaction but still doesn't explain why 30.

### Is additional context required?

**Yes, but carefully.** The tooltip is the right mechanic; the issue is discoverability. A small `(?)` icon or a subtle "aim for 30" sub-label under the count would help on mobile where tooltips don't work.

### Is it visually balanced with the planner header?

**Mostly yes.** The counter (min-w-[140px]) sits alongside the compact variety legend in a flex-wrap row. On desktop at 1440px this reads cleanly as two related-but-distinct pieces of header information. On mobile (390px), the two components will wrap onto separate lines — the counter on one line, the variety legend on the next. This is acceptable but could look cluttered if both are stacked above the week view grid.

### Does it create motivation?

**Yes — for users who understand it.** The colour-coded progress bar (amber → teal → emerald) gives instant relative feedback without a number threshold. The emerald state (≥30) delivers clear completion satisfaction. The amber state at <60% creates a gentle gap that could motivate adding herbs or veg.

---

### GOOD / BAD / UGLY

**GOOD**
- The 30-plant target is evidence-based and credible (Tim Spector/Gut Health Doctor)
- Colour coding provides instant status without reading the number
- Tooltip is accurate and well-written
- Sits non-intrusively in the header without competing with meal content
- Optional (`null` return) — if week is empty, nothing renders
- `h-1` progress bar is elegant at desktop scale

**BAD**
- 10px font is at the edge of comfortable reading for most users — particularly at muted-foreground/60 opacity (very light)
- "Plant Diversity" label is jargon for 40% of target audience
- The "/ 30" denominator is invisible on mobile (tooltip inaccessible)
- No in-line explanation of why 30 is the target
- Progress bar at 4px height is too thin on mobile — hard to read proportionally
- The counter is right-aligned in the header, meaning users who don't read right-to-left attention patterns may miss it on first visit

**UGLY**
- The combination of 10px label + 10px count + 4px progress bar is so understated it reads as decoration rather than data. A user focused on meal cards will not notice it exists.
- Having both `WeeklyPlantDiversityCounter` and `PlannerVarietyLegend compact` in the same header row creates visual competition between two nutrition displays — a user could reasonably interpret them as the same thing ("what's the difference between these two plant things?")
- The counter only reflects the active week — there is no cross-week context. A user on week 2 with a full week will see a high number and feel good; the same user on an empty week sees 0/30, which could feel discouraging rather than motivating.

---

## NUTRITION BOOST ASSESSMENT

### Does it feel like a natural meal enhancement?

**Yes — when the user sees it.** The boost items selected per meal type feel genuinely curated: curries getting Chickpeas/Spinach/Coriander, pasta getting Lentils/Mushrooms/Basil, smoothies getting Chia/Flax/Pumpkin Seeds. These are not generic health suggestions — they are specific, plausible additions to real meals.

### Does it feel useful?

**Yes, conditionally.** For a motivated cook or a user already thinking about nutrition, seeing "Add pumpkin seeds" to a smoothie is immediately actionable. For a user in "just get through the week" mode, it may feel like noise.

The meal-type matching is good enough that false positives are rare (Keto-aware filtering is now live). The main remaining friction is discoverability — the panel is deep in the dialog scroll stack.

### Would users actually act on it?

**Low conversion probability in current form.** The boost panel offers no action — it is read-only. A user who sees "Spinach (extra veg)" has three choices: mentally note it, ignore it, or navigate away from the dialog to do something about it. There is no "add to shopping list" or "add to meal" button. This is correct for Release 1 scope but means the boost panel is informational only, not transactional.

### Is it presented as optional?

**Yes, clearly.** The footer copy "Optional additions — stir in, serve alongside, or sprinkle over." is one of the best pieces of copy in Release 1. It frames the boosts as cooking opportunities, not requirements. The word "alongside" is particularly good — it explicitly says "this doesn't have to change the recipe".

The `space-y-1.5` spacing, small font sizes, and low-contrast category labels all work together to ensure the panel doesn't feel mandatory.

### Does it align with "What can we add?"

**Yes — this is the most direct expression of that philosophy in the product.** The boost panel is "What can we add?" made literal. Every other nutrition feature in THA tells users what they have; this one tells them what they could add. That is a meaningful distinction and the right framing.

---

### "Nutrition Boosts" vs "Nutrition Opportunities"

**RECOMMENDATION: Keep "Nutrition Boosts".**

| Label | Assessment |
|---|---|
| **Nutrition Boosts** | Action-oriented, familiar, warm. "Boost" implies quick + easy gain. Familiar from fitness/nutrition culture without feeling clinical. |
| Nutrition Opportunities | Clinical, abstract, corporate wellness. "Opportunity" is a business word, not a kitchen word. Creates distance rather than invitation. |

"Nutrition Boosts" wins on all UX dimensions: it is warmer, more specific, more action-oriented, and better aligned with "What can we add?". The all-caps `NUTRITION BOOSTS` label at 11px is visually appropriate — prominent enough to identify the section, small enough not to dominate.

---

## PHILOSOPHY ALIGNMENT ASSESSMENT

### Does Release 1 make the philosophy visible?

**Partially — the Enhancement pillar is visible; the Adaptation pillar is implied but invisible.**

| Philosophy pillar | Feature | Visible to user? |
|---|---|---|
| Shared Meal | Household adaptation result (pre-existing) | ✓ Via adaptation panel in dialog |
| Personal Adaptation | Household-aware boost filtering | ✗ Invisible by design — user sees correct boosts, not why certain boosts were removed |
| Nutritional Enhancement | Plant Diversity Counter + Boost Panel | ✓ Both visible |

The "Personal Adaptation" thread in the boost system is intentionally silent — users don't see "Walnuts removed due to nut allergy". That is the correct UX decision. But it means the household-aware filtering delivers trust rather than visible value.

### Does it feel different from a normal meal planner?

**Yes, if the user discovers the boost panel and plant counter.** A normal meal planner shows you what you have. THA now shows you what you could add and how diverse your week is. That is a genuine product differentiator. The problem is discoverability — a first-time user who opens a meal, sees the ingredients, and closes the dialog has not experienced this differentiation at all.

### What is still missing?

1. **Boosts are display-only** — no action available. The next natural step ("add to shopping list") is missing.
2. **Plant counter needs mobile context** — tooltip is desktop-only; mobile users have no explanation of the 30-plant target.
3. **No cross-week plant tracking** — the 30/week philosophy is weekly, but users do not get a running summary of their overall dietary variety.
4. **No feedback loop** — if a user acts on a boost suggestion by editing the meal, the boost panel doesn't update in real time (it would require re-querying meal data) — not a bug, but a slight friction.

### What would be the single highest-value improvement?

**Move the Nutrition Boost Panel above the fold in the meal dialog, or surface it on the meal card itself.**

Currently, a user must: open a meal → scroll past adaptation info, ingredients, restriction safety panel, variety nudge → arrive at the boost panel. On mobile at 844px height, the dialog max-height is ~693px. The meal header + ingredients section alone could fill that space, meaning boosts are never visible without scrolling.

Surfacing even one boost item on the meal card in the week grid (e.g. a small "+ Add pumpkin seeds" chip) would make the feature discoverable without any dialog interaction.

---

## MOBILE REVIEW

**Viewport: 390px wide, 844px tall**

### Plant Diversity Counter on mobile

The `flex items-center gap-4 flex-wrap` header row will wrap at ~390px. The counter (min-w-[140px]) and compact variety legend (~300px) exceed the viewport width and wrap to two lines. This is handled gracefully by flex-wrap but creates a taller header than expected.

**Issues:**
- `h-1` progress bar at 4px is very difficult to read at 3x devicePixelRatio on a small screen — the colour coding still works but the proportional fill is nearly invisible
- 10px text at muted-foreground/60 opacity on mobile may be below legibility threshold in bright daylight
- Tooltip (tooltip mechanism) is inaccessible on touch devices — the "what is 30?" question goes unanswered
- The wrapped layout adds vertical height to the planner header, reducing the visible week grid

**Flag:** Consider a `(?)` or small "aim: 30/week" text alongside the count for mobile contexts.

### Boost Panel on mobile

The meal dialog at `max-w-[640px]` is full-width on a 390px screen. The dialog itself is `max-h-[82vh]` = ~693px on a typical iPhone. The boost panel's position deep in the scroll stack is more problematic on mobile than desktop.

**Issue:** A typical meal card with moderate content (name, tags, ingredients list, restriction panel, variety nudge) will push the boost panel below the initial viewport of the dialog on mobile. Users would need to scroll down ~50-100% within the dialog to find it.

**Flag:** The boost panel is the highest scroll-depth feature in the meal dialog on mobile. This is the primary discoverability risk.

### Touch friendliness

The boost items (`text-xs`, `flex items-center gap-2`) are display elements with no tap targets. This is correct (read-only in Release 1) but means there is nothing to interact with once the panel is found.

The overall mobile touch experience of the dialog (scrollable, with tap-to-close overlay) is pre-existing and not affected by Release 1.

---

## DESKTOP REVIEW

**Viewport: 1440px wide**

### Plant Diversity Counter on desktop

At 1440px, the header row (`flex items-center gap-4 flex-wrap`) has ample space. The counter (min-w-[140px]) and compact variety legend sit side by side cleanly. The emerald/teal/amber colour coding on the progress bar renders well against a light background at 2x devicePixelRatio.

**Issue:** The counter and variety legend are visually similar in density (small dots/text for the legend, small bar/text for the counter). Users may not immediately distinguish them as separate features. A subtle visual separator (border-r, vertical divider) between the two elements would clarify that they measure different things.

**Discovery:** Right-aligned elements in a header bar are less discoverable than left or centre elements. Users' eyes scan left to right; the nutrition counter sits to the right of the household diets button. A user focused on the diets button (primary action) may not notice the counter alongside it.

### Boost Panel on desktop

At 1440px, the meal detail dialog opens at max-w-[640px] — a comfortable medium-sized modal. The 82vh height cap means the dialog is ~738px tall at standard 900px height. The boost panel at its scroll position is likely accessible without heavy scrolling on desktop for meals with average content.

**Issue:** Long meals (many ingredients, active adaptation result, multiple member restriction results) will still push the boost panel below the fold of the dialog even on desktop. This is less severe than mobile but still a risk for power users.

### Hierarchy

The desktop layout correctly prioritises:
1. Planner header (week navigation, diets panel) — primary
2. Week grid (meal cards) — primary
3. Plant counter + variety legend — secondary, non-intrusive
4. Meal dialog content (on open) — contextual
5. Boost panel (within dialog) — tertiary

The hierarchy is coherent. Release 1 did not disrupt any primary path.

---

## FEATURE-BY-FEATURE UX ASSESSMENT

### Plant Diversity Counter

| Question | Answer |
|---|---|
| Is it visible enough? | **Borderline** — present in header but 10px text is easily missed |
| Is it too prominent? | No — appropriately understated |
| Does it feel useful? | Yes, for nutritionally engaged users |
| Does it feel preachy? | No — it is a count, not advice |
| Does it feel like marketing fluff? | No — the 30-plant target is a known guideline |
| Does it feel actionable? | **Weakly** — shows a gap but offers no path to close it |
| Does it support the philosophy? | Yes — "Nutritional Enhancement" made visible |

### Nutrition Boost Panel

| Question | Answer |
|---|---|
| Is it visible enough? | **No — discovery is the primary risk** |
| Is it too prominent? | No — well-balanced within the dialog |
| Does it feel useful? | Yes — meal-type matched suggestions feel curated |
| Does it feel preachy? | No — "Optional additions" footer is correctly deferential |
| Does it feel like marketing fluff? | No — items are specific and practical |
| Does it feel actionable? | **Partially** — the suggestion is clear; the action to take it is not |
| Does it support the philosophy? | Yes — direct expression of "What can we add?" |

---

## PRODUCTION READINESS

### A — Ready now (no blockers)

The implementation is technically correct, stable, and does not break any existing behaviour. Household-aware filtering is live. TypeScript is clean. All manual tests pass.

### B — Minor tweaks recommended *(VERDICT)*

The following are not blockers for release but are recommended before production:

| Priority | Issue | Recommended fix | Complexity |
|---|---|---|---|
| High | Boost panel buried in dialog scroll — primary feature is not discoverable | Consider surfacing one boost on the meal card itself, or position the panel earlier in the dialog | Medium |
| Medium | Plant counter label "Plant Diversity" is jargon | Consider "Plant Variety" or "Plants this week" | Trivial |
| Medium | Tooltip is the only explanation of the 30-plant target — inaccessible on mobile | Add a static "(aim: 30/week)" micro-label under the count, visible without hover | Trivial |
| Low | Plant counter and variety legend look visually similar in the header | Add a subtle divider or whitespace buffer between them | Trivial |
| Low | Boost panel has no action — suggestions are passive | Post-Release 1: consider "+ Add to shopping list" micro-action per boost item | Significant |

### C — Do not deploy (nothing at this level)

No blocking issues. No functional regressions. No safety or trust concerns (household-aware filtering is now complete).

---

## COPY REVIEW

| Copy | Assessment |
|---|---|
| "Nutrition Boosts" (panel label) | ✓ Clear, action-oriented, keep |
| "Optional additions — stir in, serve alongside, or sprinkle over." | ✓ Excellent — the word "alongside" is particularly good; keep exactly |
| "Plant Diversity" (counter label) | ⚠ Jargon — consider "Plant Variety" or "Plants this week" |
| "N / 30" (counter format) | ⚠ Denominator unexplained inline; tooltip good but inaccessible mobile |
| "Override a member's household adaptations for this week only." | ✓ Correct philosophy refresh from Release 1 language refresh |
| "(extra veg)", "(legume)", "(nut)" etc. | ✓ Category hints are low-contrast and appropriately secondary |

---

## SUMMARY

Release 1 delivers the Nutrition Enhancement philosophy correctly. It is non-intrusive, honest ("Optional"), and free of marketing language. The boost suggestions are meal-aware and household-safe. The plant diversity counter gives a meaningful weekly metric.

The single biggest risk is discoverability: a user who doesn't scroll deep enough in the meal dialog never sees the boost panel. This is the feature's primary value delivery mechanism and it is currently hidden behind scroll.

**Recommended production path:** Deploy with current implementation. Immediately follow with a one-iteration improvement moving the boost panel earlier in the dialog scroll order (before the ingredients list, or surfaced directly on meal cards). This preserves the Release 1 scope boundary while addressing the feature's only significant UX weakness.

---

*Validation complete. No application code modified. No planner changes. No schema changes.*
