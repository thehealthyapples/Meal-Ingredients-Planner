# Admin Preferred Products — THA Picks

## What are THA Picks?

THA Picks are admin-curated product recommendations that appear as inline suggestions inside the Basket "Analyse Basket" / "Match Products" view. They let the admin team highlight preferred buyable products for common ingredients — for example, recommending "Aldi Passata 500g" for any shopping list item whose ingredient key normalises to "passata".

THA Picks are **suggestions only**. They never override existing product matches, pricing totals, or any user-selected settings automatically. If the user clicks [Use], they apply the recommendation using the same mechanic as the existing "Change" button.

---

## How ingredient key normalisation works

Ingredient keys are normalised using `normalizeIngredientKey` from `shared/normalize.ts`:

```typescript
// lowercase → trim → remove punctuation → collapse spaces
normalizeIngredientKey("Olive Oil!") // → "olive oil"
normalizeIngredientKey("Tinned Tomatoes (chopped)") // → "tinned tomatoes chopped"
```

This same function is used server-side when storing a THA Pick and client-side when matching shopping list items to picks. It is the single canonical implementation for the project.

---

## Admin workflow

### Managing THA Picks at `/admin/ingredient-products`

Admins access the THA Picks management page at `/admin/ingredient-products` (visible only to `role = 'admin'` users).

**Creating a pick:**
1. Click **+ Add THA Pick**
2. Fill in:
   - **Ingredient** — the common ingredient name (e.g. "Passata"). The form shows a live preview of the normalised key ("Will match: passata") so you can verify it.
   - **Product Name** — the retail product display name (e.g. "Aldi Passata 500g")
   - **Retailer** — the store (e.g. "Aldi")
   - **Size** — optional, e.g. "500g"
   - **Notes** — optional, e.g. "100% tomatoes, no additives". Shown as a tooltip in the basket.
   - **Priority** — integer, default 0. Higher numbers are preferred when multiple picks exist for the same ingredient.
3. Click **Save**. The system normalises the ingredient key before storing.

**Multiple picks per ingredient are supported** — ordered by priority descending. Only the highest-priority pick is shown inline in the basket; others are available via the lookup API.

**Deactivating a pick:**
- Click **Deactivate** on any row. This performs a soft-delete (`is_active = false`). The row is preserved in the database but will not appear in any lookup.
- A unique constraint (`ingredient_key + product_name + retailer`) prevents accidentally creating duplicate picks.

---

## How picks appear in the Basket

1. The user opens the Basket and clicks **Match Products**.
2. The system runs the existing price-matching pipeline (unchanged).
3. After matching completes, the client silently fetches THA Picks for all the basket's ingredient keys from `POST /api/ingredient-products/lookup`.
4. For any row where a THA Pick exists and is not already the matched product, a subtle one-line hint appears in the **Matched Product** column:

   ```
   ⭐ THA Pick: Aldi Passata 500g (Aldi) [Use]
   ```

   - If the pick has notes, they appear as a tooltip when hovering the product name.
   - **[Use]** applies the recommendation by updating the shopping list item's `matchedStore` and `matchedProductId` — the same fields used by the "Change" button. The Ingredient column label is never changed.

5. The user can ignore the hint completely — it has no automatic effect.

---

## Safety guarantees

- **No picks in DB** → basket behaviour is 100% identical to before.
- **Lookup endpoint fails** → the failure is silently swallowed. The basket continues working as if no picks exist.
- **Unique constraint** → prevents duplicate picks for the same ingredient + product + retailer combination.
- **Soft-delete** → deactivated picks are preserved in the DB and excluded from all lookups.
- **No changes** to: basket math, pricing totals, tier selection, store selection, exports, or any other basket behaviour.

---

## API reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/ingredient-products?query=` | admin | List/search picks (ILIKE on key or product name) |
| POST | `/api/admin/ingredient-products` | admin | Create a pick. Key is normalised before storage. |
| PUT | `/api/admin/ingredient-products/:id` | admin | Update a pick. |
| DELETE | `/api/admin/ingredient-products/:id` | admin | Soft-delete (sets `is_active = false`). |
| POST | `/api/ingredient-products/lookup` | auth | Body: `{ ingredientKeys: string[] }`. Returns `{ recommendations: { [key]: IngredientProduct[] } }`. Never returns an error status — on exception returns `{ recommendations: {} }`. |
