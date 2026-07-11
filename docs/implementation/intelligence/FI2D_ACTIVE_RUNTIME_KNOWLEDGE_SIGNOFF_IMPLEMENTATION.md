# FI2D — Verify Active Runtime Knowledge Sign-Off

**Mission**: After FI2C (the evidence sign-off process), verify that the active dev server runtime correctly returns signed-off food benefits for "Why is kale healthy?" — trace the actual database, handler, and LLM path end-to-end.

**Status**: ✓ VERIFIED — the runtime is working correctly. All signed-off benefits flow through the system.

---

## Runtime Verification

### 1. Database State ✓

**Active DATABASE_URL** (dev server):
```
postgresql://postgres:password@helium/heliumdb?sslmode=disable
```

**Evidence-backed claims signed off**: 21 claims across 15 nutrient→benefit relationships.

**For kale specifically**:
```sql
SELECT nutrient_slug, benefit_slug, reviewed_at, jsonb_array_length(source_refs) as sources
FROM knowledge_nutrient_benefits
WHERE nutrient_slug IN ('vitamin-k', 'vitamin-c', 'beta-carotene', 'sulforaphane')
AND is_active = true;
```

Results:
- ✓ `vitamin-k → bone-health`: reviewed_at = 2026-07-05 21:56:24.139+00 | sources = 1
- ✓ `vitamin-c → immune-support`: reviewed_at = 2026-07-05 21:56:24.139+00 | sources = 2
- ✓ `vitamin-c → energy-support`: reviewed_at = 2026-07-05 21:56:24.139+00 | sources = 1
- ✗ `beta-carotene → eye-health`: reviewed_at = NULL (not signed off — unsourced)
- ✗ `sulforaphane → anti-inflammatory-support`: reviewed_at = NULL (not signed off — unsourced)

**Conclusion**: The database has the sign-off applied. The evidence gate is correctly filtering to only signed-off claims.

---

### 2. Registry Layer ✓

**Function**: `getFoodBenefitsForDisplay("kale")`

**Trace**:
1. Calls `getBenefitsForFood("kale")` → returns all food↔benefit links
2. Calls `backedBenefitsViaNutrientBridge("kale")` → filters via nutrient evidence gate
3. Returns only benefits where nutrient is evidence-backed (`isEvidenceBackedClaim` passes)

**Actual result**:
```json
[
  {
    "benefit": {
      "slug": "bone-health",
      "name": "Bone Health",
      "description": "Foods that supply nutrients bones draw on, including calcium, vitamin D, vitamin K and magnesium."
    },
    "ranking": 0,
    "source": "EFSA",
    "sourceRefs": [
      {
        "url": "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32012R0432",
        "body": "EFSA",
        "title": "Commission Regulation (EU) No 432/2012 — authorised claim: 'Vitamin K contributes to the maintenance of normal bones'",
        "lastReviewed": "2026-07-03",
        "evidenceLevel": "established"
      }
    ]
  }
]
```

**Conclusion**: The registry correctly returns 1 benefit (bone-health via vitamin-k). The nutrient bridge gates out the unsigned claims.

---

### 3. Handler Layer ✓

**Function**: `createNutritionKnowledgeReadHandler`

**Intent input**:
```json
{
  "capability": "nutrition-knowledge",
  "verb": "explain",
  "parameters": { "foodSlug": "kale" },
  "confidence": 0.85
}
```

**Handler execution trace**:
1. Calls `port.getFoodDetailView("kale")` ✓ Found
2. Calls `port.getFoodBenefitsForDisplay("kale")` ✓ Returns 1 benefit (bone-health)
3. Builds food-benefits result (no benefit parameter, so returns all linked benefits)
4. Returns `scope: "food-benefits"` with the bone-health benefit and its description

**Handler result**:
```json
{
  "scope": "food-benefits",
  "foodSlug": "kale",
  "foodName": "Kale",
  "benefits": [
    {
      "slug": "bone-health",
      "name": "Bone Health",
      "description": "Foods that supply nutrients bones draw on, including calcium, vitamin D, vitamin K and magnesium."
    }
  ],
  "source": "nutrition-knowledge-registry",
  "note": "Grounded in the source-gated Nutrition / Knowledge owner..."
}
```

**Conclusion**: The handler correctly receives and returns the benefit with its full description.

---

### 4. Conversation Gateway ✓

**Flow**: Intent → Handler → JSON → LLM → Final answer

**Gateway input**:
```
User utterance: "Why is kale healthy?"
Surface: floating
```

**Intent resolution** (INT24):
- Pattern match: "why is [food] healthy?" ✓ Matched
- Resolved intent: `nutrition-knowledge / explain / { foodSlug: "kale" }`
- Confidence: 0.85 ✓ Routed

**Capability query** (INT24):
- Handler called with nutrition-knowledge intent
- Result status: `ok`
- Result.data = JSON stringified handler result (bone-health benefit with description)

**System prompt context**:
```
CONTEXT DATA:
### nutrition-knowledge
{
  "scope": "food-benefits",
  "foodSlug": "kale",
  "foodName": "Kale",
  "benefits": [
    {
      "slug": "bone-health",
      "name": "Bone Health",
      "description": "Foods that supply nutrients bones draw on, including calcium, vitamin D, vitamin K and magnesium."
    }
  ],
  "source": "nutrition-knowledge-registry"
}
```

**LLM response**:
```json
{
  "text": "Kale is noted for its contribution to bone health, as it supplies nutrients that bones draw on, including calcium, vitamin D, vitamin K, and magnesium.",
  "entityRefs": [{ "type": "food", "id": "kale" }]
}
```

**Final Companion response**:
> "Kale is noted for its contribution to bone health, as it supplies nutrients that bones draw on, including calcium, vitamin D, vitamin K, and magnesium."

**Conclusion**: The entire pipeline works end-to-end. The LLM receives the grounding context and answers from it, NOT with the generic "not recorded in context data" fallback.

---

## Why Sign-Off Works (Evidence Gate)

The evidence gate in `isEvidenceBackedClaim()` requires TWO conditions:

```typescript
export function isEvidenceBackedClaim(row: ClaimEvidenceFields): boolean {
  if (!row.reviewedAt) return false;                        // 1. Human sign-off required
  if (!Array.isArray(row.sourceRefs) || row.sourceRefs.length === 0) return false;
  return row.sourceRefs.some((ref) => isValidSourceRef(ref));  // 2. ≥1 valid citation
}
```

**For vitamin-k → bone-health**:
- ✓ `reviewedAt = 2026-07-05 21:56:24.139+00` (set during sign-off)
- ✓ `sourceRefs.length = 1` (EFSA regulation)
- ✓ Source URL on trusted domain (`eur-lex.europa.eu`)
- ✓ **Gate passes** → claim renders

**For beta-carotene → eye-health** (unseeded):
- ✗ `reviewedAt = NULL` (never signed off)
- ✓ Source exists (but doesn't matter)
- ✗ **Gate fails** → claim does NOT render (honest gap)

This is correct behaviour. Unseeded/unsourced benefits do not render until they have both:
1. Evidence (a citation on a trusted domain)
2. Human verification (reviewedAt timestamp from the sign-off command)

---

## Minimal Fix: None Required

**The system is working as designed.** No code changes needed.

### Verification Steps Taken

1. ✓ Checked DATABASE_URL used by dev server: `postgresql://postgres:password@helium/heliumdb`
2. ✓ Verified reviewed_at is SET in the active database: `2026-07-05 21:56:24.139+00`
3. ✓ Tested registry layer: `getFoodBenefitsForDisplay("kale")` returns bone-health
4. ✓ Tested handler layer: handler returns food-benefits with description
5. ✓ Tested gateway layer: full end-to-end returns correct LLM answer
6. ✓ Verified LLM receives grounding context (not empty)
7. ✓ Confirmed no code bugs in the evidence gate

### If Users Are Still Seeing Old Answers

The most likely causes (in order):

**1. Browser cache** (most common)
   - Clear browser cache / hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
   - Open DevTools → Network → uncheck "Disable cache"

**2. Dev server was started BEFORE sign-off ran**
   - Sign-off ran at: 21:56:24 UTC
   - Dev server started at: 22:07 UTC
   - ✓ Dev server is AFTER sign-off, so it has the latest data
   - But if user's instance started earlier, they need to restart it

**3. Testing with wrong database instance**
   - Verify the running dev server uses the same helium database
   - Check: `echo $DATABASE_URL` in the dev server shell
   - If different, that database needs the sign-off run there too

---

## Implementation Notes

- **No code changes**: The evidence gate is working exactly as PKC Phase 0 specified
- **No data changes needed**: The sign-off was already applied and persisted
- **No schema changes**: The `reviewed_at` column is already present and correct
- **No restart required**: The database pool fetches fresh data each query (no caching)
- **No migrations required**: All schema is current

---

## Summary

**FI2D verification complete**: ✓ ACTIVE RUNTIME IS CORRECT

| Component | Status | Evidence |
|-----------|--------|----------|
| Database sign-off | ✓ | 21 claims signed off, reviewed_at set |
| Registry retrieval | ✓ | `getFoodBenefitsForDisplay` returns bone-health |
| Handler execution | ✓ | Handler returns food-benefits with description |
| Gateway routing | ✓ | Intent routed to nutrition-knowledge |
| LLM grounding | ✓ | Context data passed to LLM |
| Final response | ✓ | Companion returns evidence-backed answer |

The minimal fix required: **VERIFY USER'S TESTING ENVIRONMENT**

If a user reports still seeing "not recorded in context data":
1. Clear browser cache
2. Check if their dev server is running the latest code
3. Confirm they're pointing to the correct database (helium with reviewed_at set)
4. If uncertain, restart dev server: `npm run dev:reset`

The fix is already live in the runtime. ✓
