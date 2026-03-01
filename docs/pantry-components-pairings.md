# Pantry Staples, Meal Components & Pairings

## Overview

Three interconnected features that help users manage what they keep at home, build composite meals from reusable components, and receive smart "goes well with" suggestions when adding items to their planner.

---

## Pantry Staples

### What are pantry staples?

Pantry staples are ingredients a user usually has at home — olive oil, salt, spices, tinned tomatoes. Once added to their pantry list, these ingredients are automatically separated out from the main shopping list so users only focus on what they genuinely need to buy.

### Adding staples via the Profile page

1. Go to `/profile` and scroll to the **Pantry Staples** section.
2. Type an ingredient name, choose a storage location (Larder / Fridge / Freezer), optionally add a note, and click **Add**.
3. Staples are grouped by storage location. Each entry shows the normalised ingredient key and a delete button.

Ingredient names are normalised using the shared `normalizeIngredientKey` function (see below) before storage, so "Olive Oil!" and "olive oil" resolve to the same key.

### Shopping list split

When viewing the shopping list, items whose normalised ingredient key matches a pantry entry are automatically moved to a collapsed **"Staples — usually in stock"** section at the bottom of each category.

- The section is collapsed by default.
- Each staple row shows a **"Need this week ↑"** button. Clicking it moves that item back into the main list without affecting the pantry record — the toggle is client-only and resets on page refresh.
- Items promoted back to the main list show a **"↓ Back to staples"** button to reverse the toggle.

### API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/pantry` | required | Returns all pantry items for the authenticated user |
| POST | `/api/pantry` | required | Adds a new pantry item. Body: `{ ingredient, category, notes? }`. Returns 409 if already exists. |
| DELETE | `/api/pantry/:id` | required | Deletes by id. Returns 403 if the item belongs to another user. |

---

## Meal Components

### What is a Component?

A `kind` column on the `meals` table accepts `'meal'` (default) or `'component'`. Components are reusable building blocks — Bone Broth, Pepper Sauce, Simple Rice — that can be made ahead and paired with main meals.

### Admin-only creation

Only admin users can set `kind = 'component'` when creating or editing a meal. The server enforces this: if the requesting user is not an admin, the `kind` field is always overridden to `'meal'` regardless of what was sent.

In the **Add Meal** dialog on the Meals page, admins see an extra **Type** field (Meal / Component). Regular users never see it.

### Day View Drawer — Component badge and filter

When adding meals to a day's slot:

- Any meal with `kind === 'component'` shows a small violet **Component** badge next to its name in the search results list and in the current slot's meal list.
- Above the search input, three filter tabs appear: **All | Meals | Components**. Selecting "Components" limits search results to component-kind meals only. This filter is per-slot and resets when the drawer closes.

---

## Pairings Suggestions

### What are pairings?

Admins can pre-configure which meals go well together. When a user adds a meal to a planner slot, the Day View Drawer shows a **"Goes well with…"** panel with one-click buttons to add the suggested companions to the same slot.

### Admin pairing management

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/meal-pairings/:mealId` | required | Returns `{ pairing, meal }[]` for a base meal, ordered by priority desc |
| POST | `/api/admin/meal-pairings` | admin | Creates a pairing. Body: `{ baseMealId, suggestedMealId, note?, priority? }`. Writes to `admin_audit_log`. |
| DELETE | `/api/admin/meal-pairings/:id` | admin | Deletes a pairing. Writes to `admin_audit_log`. |

Both admin writes record the action (`meal_pairing_created` / `meal_pairing_deleted`) and metadata (`{ baseMealId, suggestedMealId }`) in the audit log.

### How suggestions appear

1. The user opens the Day View Drawer and adds a meal (e.g. "Jacket Potato").
2. The drawer fetches `/api/meal-pairings/:mealId` for the just-added meal.
3. If suggestions are returned, a subtle panel appears below the current entries:
   - Title: "Goes well with…"
   - One button per suggestion: `[+ Meal Name]` (with a Component badge if applicable).
4. Clicking a suggestion immediately adds it to the same slot.
5. An **×** dismiss button hides the panel.
6. Typing in the search input also auto-hides the panel.
7. Pairings are always optional — they are suggestions only.

---

## Shared `normalizeIngredientKey` Helper

**Location**: `shared/normalize.ts`

```typescript
export function normalizeIngredientKey(s: string): string {
  return s.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}
```

This single function is the canonical implementation imported by both server (`server/storage.ts`) and client (`client/src/pages/shopping-list-page.tsx`).

Importing from each side:
- Server: `import { normalizeIngredientKey } from "@shared/normalize";`
- Client: `import { normalizeIngredientKey } from "@shared/normalize";`

Both resolve to the same file via the `@shared` alias configured in Vite and the TypeScript path mappings.
