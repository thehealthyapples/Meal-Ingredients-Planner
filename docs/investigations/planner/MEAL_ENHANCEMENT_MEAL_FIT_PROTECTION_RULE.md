# Meal Enhancement — Meal Fit Protection Rule

**Date:** 2026-06-10
**Status:** Approved specification

---

## Core Rule

Weekly reuse must NEVER override meal suitability.

A boost may only receive a reuse advantage if it is already a valid enhancement for the current meal.

---

## Examples

### Pizza — Basil used elsewhere this week

Basil suits pizza.

Result: **✓ Reuse signal may be applied**

---

### Porridge — Basil used elsewhere this week

Basil does not suit porridge.

Result:
- **✗ Reuse signal must NOT be applied**
- **✗ Basil must not be suggested**

---

## Suggestion Display Rules

| Condition | Display |
|-----------|---------|
| 1 suitable reused boost exists | 1 reused boost + 1 discovery boost |
| No suitable reused boosts exist | 2 discovery boosts |
| Multiple suitable reused boosts exist | Maximum 1 reused boost + minimum 1 discovery boost |
| Only 1 valid enhancement exists | 1 enhancement |

The minimum 1 discovery boost rule ensures the system continues introducing new ingredients.

---

## Priority Order

1. Safety
2. Meal Fit
3. Weekly Reuse
4. Nutrition Value
5. Discovery / Variety

This order is intentional.

Reuse improves practicality and reduces waste, but must never reduce meal quality or nutritional diversity.

The enhancement engine must continue introducing new ingredients — herbs, spices, legumes, seeds, and other nutritionally valuable additions — where appropriate.

---

## Architecture Implication

This rule confirms that weekly reuse detection must only operate on suggestions that have already passed the uplift engine's meal-fit matching. Reuse cannot introduce new suggestion candidates — it can only reorder candidates that already exist in the matched result set.

The correct implementation sequence:

1. Uplift engine matches rules against the meal → filtered by meal fit, diet, slot
2. Reuse ranking sorts matched suggestions — P1 (reuse) floats up within the already-valid set
3. Display slots filled: maximum 1 P1, minimum 1 non-P1

A suggestion that did not match a rule for this meal is never made eligible by the reuse signal alone.
