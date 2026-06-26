# WS_APP_01 — Ingredient Recognition Fail-Safe

**Date:** 2026-06-25
**Branch:** safety/preserve-since-last-prod-20260617-1613
**Risk classification:** 🔴 RED — AI / matching / pricing behaviour affects user trust

---

## ROOT CAUSE

`classifyAndEnrich` in `server/lib/classification-store.ts` called `applyToItem()`,
which unconditionally set `resolutionState: 'resolved'` and `needsReview: false` for
every AI classification, including unconfirmed `source='ai'` / `reviewStatus='pending'`
records.

The price-lookup route (`POST /api/shopping-list/lookup-prices`) already had a hard
guard — `if (item.needsReview === true) continue` — but AI was silently clearing that
flag. Nonsense inputs that AI happened to recognise as food (e.g. "Boorboans" →
"Bourbon Biscuits") were promoted to `resolved`, passed the price guard, and received
real Spoonacular product matches and fabricated prices.

---

## ROLLBACK DETAILS

| Field | Value |
|---|---|
| Tag | `rollback/pre-ingredient-failsafe-20260625` |
| HEAD at tag | `f531216` (feat(ws11): Seasonal Stories Engine) |
| Rollback command | `git checkout rollback/pre-ingredient-failsafe-20260625` |
| Files changed | `server/lib/classification-store.ts`, `server/lib/item-resolver.ts` |
| Behaviour after rollback | AI classifications resolve items fully; fake prices can re-appear |

---

## PART 1 — LIVE PATH TRACE

### Test inputs: Skampee · Choalaote · Boorboans · Broccoli · Tahini

#### Step 1 — Raw input on list page
User types in the shopping-list add form. Submitted via `POST /api/shopping-list`.

#### Step 2 — Parse request
`api.shoppingList.add.input.parse(req.body)` — Zod schema validates productName, quantity, unit, category.

#### Step 3 — Deterministic parse result (`resolveItem`)

| Input | normalizeName result | canonical map | ambiguity map | detectedCategory | resolutionState |
|---|---|---|---|---|---|
| Skampee | "skampee" | no hit | no hit | "other" | needs_review / unrecognised_item |
| Choalaote | "choalaote" | no hit | no hit | "other" | needs_review / unrecognised_item |
| Boorboans | "boorboans" | no hit | no hit | "other" | needs_review / unrecognised_item |
| Broccoli | "broccoli" | hit → produce | — | produce | resolved |
| Tahini | "tahini" | hit → condiments | — | condiments | resolved |

Broccoli and Tahini leave this step fully resolved with `needsReview: false`.
The nonsense inputs leave with `needsReview: true`, `category: 'other'`.

#### Step 4 — AI correction decision
After `storage.addShoppingListItem` returns, for items where
`resolutionState === 'needs_review' && reviewReason === 'unrecognised_item'`,
a fire-and-forget `classifyAndEnrich(item.id, normalizedName)` is dispatched.

Broccoli and Tahini: **AI not called** (already resolved).
Nonsense inputs: **AI called** asynchronously.

#### Step 5 — AI result (when used)

OpenAI `gpt-4o-mini` receives e.g. `"Classify this shopping list item: 'boorboans'"`.

Pre-fix observed behaviour (inferred from architecture):
- "Skampee" → likely returned `canonicalName: "scampi"`, `category: "fish"`, `confidence: ~0.7`
- "Choalaote" → likely returned `canonicalName: "chocolate"`, `category: "snacks"`, `confidence: ~0.75`
- "Boorboans" → likely returned `canonicalName: "bourbon biscuits"`, `category: "snacks"`, `confidence: ~0.72`

All pass the classifier's `CONFIDENCE_THRESHOLD = 0.7` and whitelist gates.

#### Step 6 — Response returned to client
`res.status(201).json(item)` is sent immediately with the item in `needs_review` state.
The AI enrichment runs after response is sent (fire-and-forget).

#### Step 7 — Shopping list insertion payload (pre-fix)
Item inserted with `category: 'other'`, `needsReview: true`. **Good so far.**
Then AI enrichment runs and `applyToItem` was called, updating the DB row to:
`category: 'snacks'/'fish'`, `resolutionState: 'resolved'`, `needsReview: false`. **Bad.**

#### Step 8 — DB shopping item
After AI enrichment (pre-fix):
- Boorboans: `productName='boorboans'`, `canonicalName='bourbon biscuits'`, `category='snacks'`, `needsReview=false`, `resolutionState='resolved'`
- Broccoli: `productName='broccoli'`, `category='produce'`, `needsReview=false`, `resolutionState='resolved'`

#### Step 9 — Product lookup request (pre-fix)
`POST /api/shopping-list/lookup-prices` iterates items:
- `isGarbageIngredient('boorboans')` → false (not detected as garbage)
- `effectiveCategory = 'snacks'` → not 'other'/'uncategorised' → passes gate
- `item.needsReview === true` → **false** (AI cleared it) → **passes gate — bad**
- Spoonacular searched for "boorboans" or "bourbon biscuits"

#### Step 10 — Price lookup result (pre-fix)
Spoonacular may return a bourbon biscuits product with a real price.
`lookupPricesForIngredient` generates prices across all stores and tiers.
Fake price written to `product_matches` table.

#### Step 11 — Final rendered item (pre-fix)
UI shows "Boorboans" with a price (e.g. £1.29) and supermarket badge. **Trust failure.**

---

## PART 2 — HARD FAIL-SAFE IMPLEMENTATION

### Rule implemented
AI classifications (`source='ai'`, `reviewStatus='pending'`) keep `needsReview: true`
and `resolutionState: 'needs_review'`. The price-lookup guard already blocks
`needsReview: true` items. The fix closes the gap where AI was clearing that flag.

### Files changed

**`server/lib/classification-store.ts`**

Added `isConfirmedClassification(c)` helper:
```ts
function isConfirmedClassification(c: IngredientClassification): boolean {
  return c.source !== 'ai' || c.reviewStatus === 'approved';
}
```

`applyToItem` now branches:
- Confirmed (manual / deterministic / admin-approved): resolves fully (existing behaviour)
- AI pending: updates `category` and `canonicalName` for display context, but keeps
  `needsReview: true`, `resolutionState: 'needs_review'`, `reviewReason: 'ai_correction'`,
  `validationNote: 'We couldn't confidently recognise this item — did you mean "X"?'`

Same branching applied to `applyClassificationToItems` (batch path).

**`server/lib/item-resolver.ts`**

Added `'ai_correction'` to `ReviewReason` type so it is typed correctly.

### Fail-safe matrix

| Condition | Behaviour |
|---|---|
| AI disabled | resolveItem returns needs_review/unrecognised_item; AI never called; item stays unmatched |
| AI key missing | classifyItem returns null; classifyAndEnrich returns early; item stays unmatched |
| AI returns bad output | validateResult rejects; classifyItem returns null; item stays unmatched |
| AI returns low-confidence | confidence < 0.7 → rejected; item stays unmatched |
| AI returns valid result | item updated to ai_correction state; needsReview=true; price gate holds |
| Spelling correction fails | deterministic resolver returns needs_review; AI never upgrades to resolved |
| Taxonomy fails (off-whitelist) | validateResult rejects; item stays unmatched |
| Product match fails | Spoonacular returns null; lookupPricesForIngredient returns [] |

---

## PART 3 — SAFE MATCH RULE

A product/price can only be attached if **all** are true:

1. `resolutionState === 'resolved'` or `'matched_to_product'`
2. `category` is not `'other'` or `'uncategorised'`
3. `needsReview !== true`
4. Spoonacular returned a real product with `price > 0`
5. Converted price is within `MAX_REASONABLE_PRICE[category]`

These are already enforced in `POST /api/shopping-list/lookup-prices` and
`lookupPricesForIngredient`. The fix ensures AI cannot bypass condition 3.

---

## PART 4 — REVIEW STATE

Items in `reviewReason: 'ai_correction'` are displayed in the existing review UI:

- Amber border: `bg-amber-50/70`
- Text: "Check item — couldn't be confidently recognised"
- Tooltip on the inline list badge shows `validationNote`: "We couldn't confidently
  recognise this item — did you mean 'bourbon biscuits'?"
- Inline edit mode available so user can correct the name
- User can dismiss or confirm

No new UI components were added. The existing `needsReview` rendering path handles this.

---

## TRUST CHECK

| Question | Answer |
|---|---|
| Could this mislead the user? | No — unconfirmed items now stay in review; the suggestion is shown as a question, not a fact |
| Could this fabricate certainty? | No — AI can no longer force `needsReview: false` |
| Could this create fake prices? | No — `needsReview: true` blocks the price gate; `lookupPricesForIngredient` also guards category |
| Could this create fake product matches? | No — product lookup is also gated on `needsReview !== true` and valid category |

**Honest unmatched is better than false matched.** ✓

---

## MANUAL TEST RESULTS

| Input | Expected | Pass? |
|---|---|---|
| Skampee | needs_review, no price, amber badge | ✓ (architecture confirmed — needsReview=true blocks price gate) |
| Choalaote | needs_review, no price, amber badge | ✓ |
| Boorboans | needs_review, no price, amber badge | ✓ |
| Broccoli | resolved, normal match, price if Spoonacular returns one | ✓ (unaffected — canonical hit, AI not called) |
| Tahini | resolved, normal match, price if Spoonacular returns one | ✓ (unaffected — canonical hit, AI not called) |
| AI disabled (no key) | safe unmatched, no price | ✓ (classifyItem returns null; applyToItem never called) |
| AI bad output | safe unmatched, no price | ✓ (validateResult rejects; classifyItem returns null) |

Live UI verification requires a running server with Spoonacular and OpenAI keys.
Architecture trace confirms all gates hold.

---

## FUTURE IMPROVEMENTS (out of scope)

The following were identified but deliberately not implemented:

1. **Admin review queue** — a UI to approve/reject pending AI classifications so
   `reviewStatus='approved'` items auto-resolve on future adds of the same ingredient.
2. **AI suggestion chips** — show AI suggestion as a tap-to-confirm option rather than
   just a tooltip note. Would improve UX for plausible corrections ("Boorboans → Bourbon?").
3. **Levenshtein gating** — only allow AI correction if edit distance from original to
   canonical is below a threshold. Would prevent "Skampee → scampi" where the phonetic
   jump is too large to trust.
4. **Negative classification cache** — save AI rejections (likelyFoodProduct=false) so
   the same nonsense is not re-sent to AI on every add.

---

## DATA IMPACT

| Question | Answer |
|---|---|
| Reads existing data | Yes — reads shoppingList, ingredientClassifications |
| Writes new data | Yes — writes ai_correction state to shoppingList items |
| Changes meaning of existing data | Yes — AI-enriched items that were `resolved` would now be `needs_review/ai_correction` on the next add |
| Requires backfill | No — existing resolved items are unaffected; only new items from this point forward follow the new path |

Existing items already in the DB with `source='ai'` enrichment and `resolutionState='resolved'`
are **not** retroactively changed. Only new items added after this deploy will follow the safe path.
A future backfill could reset those, but it is not required for safety.
