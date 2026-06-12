# Household Eaters Full Visibility Implementation

## Summary

Replace the single truncated comma-separated text line under each eater's name with compact wrapping chips — neutral muted chips for diet patterns, red destructive chips for allergies/intolerances.

**Rollback tag:** `rollback/pre-household-eaters-full-visibility`

---

## Problem

The Household Eaters section showed restrictions as a single truncated line:

```
Lilly     Vegetarian, Gluten-Free, Nuts, Dairy-Fr…   [Child] [✏]
Daisy     Mediterranean, Dairy-Free, Eggs            [Child] [✏]
Colin     (nothing visible)                          [User]
```

Adult users showed only a blank "User" badge — no chips even when dietary data was present. Long restriction lists for children were truncated by `truncate` class, hiding constraints like Shellfish, Soy, Eggs.

---

## Implementation

**File changed:** `client/src/pages/profile-page.tsx`

### What changed

| Before | After |
|--------|-------|
| `flex items-center gap-3` row | `flex items-start gap-3` row |
| `<p class="text-xs text-muted-foreground truncate">` | `<div class="flex flex-wrap gap-1 mt-1">` chips |
| All constraints joined as one string | `defaultDietTypes.map()` + `hardRestrictions.map()` separate chip arrays |
| Badge + edit button as siblings in row | Badge + edit button wrapped in `flex items-center gap-1 shrink-0 mt-0.5` |
| Avatar: no top margin | Avatar: `mt-0.5` for top-alignment with wrapped chips |
| Eater name: `text-sm font-medium truncate` | Eater name: `text-sm font-medium` (no truncate) |

### Chip styling

- **Diet pattern chips** (`defaultDietTypes`): `text-xs px-2 py-0.5 rounded-full bg-muted border border-border text-muted-foreground`
- **Restriction chips** (`hardRestrictions`): `text-xs px-2 py-0.5 rounded-full bg-destructive/10 border border-destructive/20 text-destructive`

### Preserved

- Role badges: `[User]` / `[Child]` — styling unchanged
- Edit button: child eaters only — `onClick={() => openEdit(eater)}` — unchanged
- Add/Edit dialogs: no changes
- Conditional guard: `(eater.defaultDietTypes.length > 0 || eater.hardRestrictions.length > 0)` — no chips rendered for eaters with no constraints

---

## Data Shape

```json
[
  { "id": "1", "displayName": "colinclapson@hotmail.co.uk", "kind": "user", "defaultDietTypes": [], "hardRestrictions": [] },
  { "id": "3", "displayName": "Lilly", "kind": "child", "defaultDietTypes": ["Vegetarian"], "hardRestrictions": ["Gluten-Free","Nuts","Dairy-Free","Eggs","Shellfish","Soy"] },
  { "id": "4", "displayName": "Daisy", "kind": "child", "defaultDietTypes": ["Mediterranean"], "hardRestrictions": ["Dairy-Free","Eggs"] }
]
```

Adult eaters in the live DB have empty arrays — their profile preferences (`users.diet_pattern`, `users.diet_restrictions`) are not synced into `household_eaters`. This is a data-layer concern outside the scope of this change. The UI chip code is correct and will render chips for any eater whose fields are populated.

---

## Scope

- Reads existing data: YES
- Writes new data: NO
- DB schema changes: NO
- Dietary logic changes: NO
- Planner changes: NO
- Profile changes: NO

---

## Verification

- Vite live bundle confirmed all 5 new class tokens present: `flex-wrap gap-1`, `items-start gap-3`, `mt-0.5`, `rounded-full bg-destructive/10`, `rounded-full bg-muted border`
- `defaultDietTypes.map` and `hardRestrictions.map` confirmed in compiled output
- Conditional guard confirmed present — no phantom empty chip containers
- `button-edit-eater`, child-kind guard, badge wrapper all confirmed preserved
- `items-center gap-3` and `sm font-medium truncate` remaining in bundle confirmed to be from the Household **Members** section (line 814), not the Eaters section
- TypeScript check: no new errors introduced

---

## Definition of Done

- [x] Every eater with data shows visible planning constraint chips
- [x] Long restriction lists wrap correctly (Lilly: 6 restrictions)
- [x] Eaters with no constraints show no chip container (adults currently)
- [x] Role badges preserved
- [x] Edit button preserved for child eaters
- [x] No planner, profile, or database changes
