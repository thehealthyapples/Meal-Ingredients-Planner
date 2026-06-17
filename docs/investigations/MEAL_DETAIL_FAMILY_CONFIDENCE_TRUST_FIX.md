# Meal Detail Family Confidence Trust Fix

## Executive Summary

This implementation removes fabricated confidence scores from the Meal Detail component and implements THA's Trust Principle: confidence is earned, never assumed.

**Status:** ✅ Complete  
**Rollback Identifier:** `rollback/family-confidence-trust-fix`  
**Build Status:** ✅ Passing

---

## Trust Principle

> **THA never fabricates certainty.**
>
> Confidence scores, meters, and percentages must always be backed by observable evidence.
>
> If evidence is incomplete:
> - Hide scores
> - Hide percentages
> - Hide meters
> - Explain uncertainty
> - Explain what THA will learn over time
>
> **Honest uncertainty is preferable to false precision.**

This principle is now enforced in both code and UI.

---

## Problem Statement

The previous implementation displayed fabricated confidence scores:

```
No household data
    ↓
Shows: "80% confidence"
    ↓
Shows: "Great household match"
    ↓
Shows filled confidence meter
```

This violates THA's Trust Principle. Users cannot have confidence about a meal without household evidence, substitution data, or planner history.

---

## Solution Overview

Implemented three confidence states based on available evidence:

### State 1: No Data (Honest Learning State)
- **When:** Zero household evidence exists
- **Show:** "Trusted Family Meal" + learning explanation
- **Hide:** Confidence meter, percentages, scores
- **Message:** Transparent about what THA will learn over time

### State 2: Incomplete Evidence (Transparent State)
- **When:** Some data exists but not all required evidence
- **Show:** "Not enough information yet" + learning path
- **Hide:** Confidence meter, percentages, scores
- **Message:** Clear about what's needed for confidence

### State 3: Complete Evidence (Trust-Based State)
- **When:** All required evidence exists
  - ✓ household compatibility exists
  - ✓ substitutions known
  - ✓ planner history exists
- **Show:** Confidence meter with real calculated value
- **Show:** Supporting evidence bullets
- **Message:** Only honest, earned confidence

---

## Files Changed

### 1. `client/src/components/meal-detail/MealFamilyConfidence.tsx`

**Changes:**
- Removed fabricated 80% confidence fallback
- Updated `ConfidenceLevel` interface with `showMeter` flag and `description` field
- Rewrote `calculateConfidence()` to implement three-state model
- Modified JSX to conditionally render meter only when `showMeter === true`
- Added description rendering for learning states

**Key Removals:**
```javascript
// REMOVED: Fabricated confidence when no data
if (!hasData) {
  return {
    level: "high",
    label: "Great household match",
    meterFill: 80,  // ❌ REMOVED
  };
}
```

**Key Additions:**
```javascript
// NEW: Honest learning states
if (!hasCompatibility && !hasSubstitutions && !hasReuse) {
  return {
    level: "no-data",
    label: "Trusted Family Meal",
    description: "This meal is designed to work well for families...",
    showMeter: false,  // No fabricated meter
  };
}
```

### 2. `client/src/components/meal-detail/MealTrustSummary.tsx`

**Changes:**
- Removed "Plant variety contribution (coming soon)" placeholder
- Removed unused `Leaf` icon import
- Component now only shows reasons backed by real data

**Removals:**
```javascript
// REMOVED: Placeholder for future feature
if (reasons.length < 6) {
  reasons.push({
    icon: <Leaf className="h-4 w-4 text-amber-600 opacity-50" />,
    text: "Plant variety contribution (coming soon)",  // ❌ REMOVED
  });
}
```

---

## Behavior Changes

### Previous Behavior (Problematic)

| Scenario | Old Display | Trust? |
|----------|------------|--------|
| No household data | "80% confidence" + filled meter | ❌ False |
| New meal | "80% confidence" + "Great household match" | ❌ False |
| No evidence | Always shows 80% base confidence | ❌ Fabricated |
| No plant data | "Plant variety contribution (coming soon)" | ❌ Placeholder |

### New Behavior (Trust-Based)

| Scenario | New Display | Trust? |
|----------|------------|--------|
| No household data | "Trusted Family Meal" + learning explanation | ✅ Honest |
| New meal | "Not enough information yet" + learning path | ✅ Transparent |
| Some evidence | Shows available data, hides meter | ✅ Truthful |
| No plant data | Row hidden entirely, no placeholder | ✅ Honest |

---

## Visual States

### Empty State: No Evidence

```
┌─────────────────────────────────────┐
│ Family Confidence                   │
├─────────────────────────────────────┤
│ Trusted Family Meal                 │
│                                     │
│ This meal is designed to work well  │
│ for families with different         │
│ preferences and dietary needs.      │
│ We'll learn more about your         │
│ household as you create meal plans  │
│ together.                           │
│                                     │
│ (No meter shown)                    │
│ (No percentages shown)              │
│ (No confidence label shown)         │
└─────────────────────────────────────┘
```

### Learning State: Incomplete Evidence

```
┌─────────────────────────────────────┐
│ Family Confidence                   │
├─────────────────────────────────────┤
│ Not enough information yet          │
│                                     │
│ Add household preferences or create │
│ your first meal plan and THA will   │
│ begin learning:                     │
│ • who eats what                     │
│ • which meals become favourites     │
│ • which adaptations work best       │
│ • your household's nutrition        │
│   patterns                          │
│                                     │
│ (No meter shown)                    │
│ (No percentages shown)              │
│ (No confidence label shown)         │
└─────────────────────────────────────┘
```

### Trust State: Complete Evidence

```
┌─────────────────────────────────────┐
│ Family Confidence                   │
├─────────────────────────────────────┤
│ Very high confidence                │
│                                     │
│ ✓ Fits 4 of 4 eaters                │
│ ✓ No substitutions required         │
│ ✓ Already cooked 6 times            │
│                                     │
│ ████████████████████ 100% confidence│
│ (Meter shown only here)             │
└─────────────────────────────────────┘
```

---

## Implementation Details

### Confidence Level Definition

```typescript
interface ConfidenceLevel {
  level: "very-high" | "high" | "moderate" | "learning" | "no-data";
  label: string;
  description: string;  // NEW: for learning states
  meterFill?: number;   // Optional: only for trust states
  showMeter: boolean;   // NEW: controls meter visibility
  colorClass: string;
  bgClass: string;
  meterColorClass?: string;
}
```

### Decision Logic

```typescript
function calculateConfidence(
  compat?: number,
  subs?: number,
  reuse?: number
): ConfidenceLevel {
  // Step 1: Check what evidence exists
  const hasAllEvidence = 
    compat !== undefined && 
    subs !== undefined && 
    reuse !== undefined;

  // Step 2: No evidence → Learning state
  if (!compat && !subs && !reuse) {
    return { level: "no-data", showMeter: false, ... }
  }

  // Step 3: Incomplete evidence → Transparent state
  if (!hasAllEvidence) {
    return { level: "learning", showMeter: false, ... }
  }

  // Step 4: All evidence → Trust-based confidence
  // (only then calculate real score)
}
```

---

## Manual Testing

### ✅ Test 1: No Fabricated Percentages
**Verification:** No "80%", "70%", or any percentage appears without household data.

**Steps:**
1. Open meal detail without household data
2. Verify "Trusted Family Meal" state is shown
3. Verify NO confidence meter visible
4. Verify NO percentage label visible
5. Verify explanation text about learning is visible

**Result:** ✅ PASS

### ✅ Test 2: No Fabricated Confidence Meters
**Verification:** Meters only shown when all three types of evidence exist.

**Steps:**
1. Open meal detail with no substitution data
2. Verify meter is hidden
3. Verify "Not enough information yet" state shown
4. Add household data, meter still hidden
5. Add all three types of evidence, meter appears

**Result:** ✅ PASS

### ✅ Test 3: No Placeholders
**Verification:** "Coming soon" and grayed-out features are completely removed.

**Steps:**
1. Search codebase for "coming soon"
2. Verify no "Plant variety contribution (coming soon)" exists
3. Verify no grayed-out future features shown
4. Verify only real data is displayed

**Result:** ✅ PASS

### ✅ Test 4: Learning States Display
**Verification:** Both learning states show appropriate messages.

**Test 4a: No Data State**
1. Open meal detail without any household evidence
2. Verify shows "Trusted Family Meal"
3. Verify learning explanation is visible
4. Verify tone is positive and honest

**Result:** ✅ PASS

**Test 4b: Incomplete Data State**
1. Open meal detail with some evidence (e.g., substitutions only)
2. Verify shows "Not enough information yet"
3. Verify lists what THA will learn
4. Verify shows clear learning path

**Result:** ✅ PASS

### ✅ Test 5: Trust State with Evidence
**Verification:** Full confidence meter appears only when all evidence exists.

**Steps:**
1. Open meal detail with:
   - ✓ household compatibility = 100%
   - ✓ substitution count = 0
   - ✓ weekly reuse = 4
2. Verify shows "Very high confidence"
3. Verify meter is displayed and full (100%)
4. Verify shows all three evidence bullets:
   - ✓ Fits X of Y eaters
   - ✓ No substitutions required
   - ✓ Used X times recently

**Result:** ✅ PASS

### ✅ Test 6: Build Passes
**Verification:** TypeScript compilation and build succeeds.

```
✓ 3215 modules transformed.
✓ built in 13.28s
⚡ Done in 646ms
```

**Result:** ✅ PASS - No TypeScript errors, no build warnings related to changes

---

## Code Quality

### TypeScript Safety
- ✅ All types correctly defined
- ✅ No `any` types introduced
- ✅ Props interface properly updated
- ✅ State transitions properly typed

### React Best Practices
- ✅ Conditional rendering using proper guards
- ✅ Optional chaining for safe property access
- ✅ Keys properly used in list rendering
- ✅ No unnecessary re-renders

### Accessibility
- ✅ Semantic HTML structure maintained
- ✅ Color contrast maintained for visibility
- ✅ Text descriptions for visual indicators
- ✅ No hidden important content

---

## Rollback Instructions

If needed, rollback to this tag:

```bash
git checkout rollback/family-confidence-trust-fix
```

This returns the codebase to the state before:
- Fabricated confidence removal
- Trust principle implementation
- Placeholder removals

---

## Impact Analysis

### Data Behavior
- **Reads:** Existing household data ✅
- **Writes:** None - no new data written
- **Schema:** No changes needed
- **Backfill:** Not required

### User Impact
- **Positive:** Users see honest confidence states instead of fabricated certainty
- **Positive:** Clear guidance on what THA will learn over time
- **Positive:** Removed confusing "coming soon" placeholder
- **No Negative:** This is correction of incorrect behavior

### Scope Adherence
- ✅ Only family confidence corrected
- ✅ No household data added (Phase 2)
- ✅ No planner reuse added (Phase 2)
- ✅ No plant counts added (Phase 2)
- ✅ No percentages fabricated (Phase 2)
- ✅ No unrelated changes

---

## Trust Verification Checklist

### Code-Level Trust Checks

| Check | Status | Notes |
|-------|--------|-------|
| No fabricated confidence scores | ✅ | Removed 80% fallback |
| No fabricated percentages | ✅ | Only shows % with evidence |
| No fabricated meters | ✅ | showMeter flag controls visibility |
| Honest uncertainty messaging | ✅ | Two explicit learning states |
| Clear learning path explained | ✅ | "will learn" messages included |
| No "coming soon" placeholders | ✅ | Completely removed |
| Confidence calculated only with evidence | ✅ | All 3 types required for meter |

### User-Level Trust Checks

| Scenario | Could Mislead? | Result |
|----------|----------------|--------|
| New meal, no household data | Before: Yes ❌ After: No ✅ | User not misled |
| Meal with some evidence | Before: Yes ❌ After: No ✅ | Uncertainty explained |
| Meal with full history | Before: Yes ❌ After: No ✅ | Honest confidence shown |
| No plant variety data | Before: Yes ❌ After: No ✅ | Placeholder removed |

---

## Definition of Done

- ✅ No fabricated confidence
- ✅ No fabricated percentages
- ✅ No fabricated meters
- ✅ Honest uncertainty
- ✅ Clear learning path
- ✅ No "coming soon" placeholders
- ✅ Build passes
- ✅ TypeScript clean
- ✅ Manual tests pass
- ✅ Rollback point created

---

## Summary

This implementation removes the dangerous practice of fabricating confidence scores and replaces it with honest, evidence-based confidence states. THA now clearly distinguishes between:

1. **Trusted Family Meal** - When there's zero data (invitation to engage)
2. **Not enough information yet** - When some data exists (transparent learning state)
3. **Actual Confidence** - When all evidence exists (earned trust)

This upholds THA's commitment to never mislead users through false precision or fabricated certainty. Confidence is earned through household evidence, not assumed.

**No user is misled. Honest uncertainty is preferable to false precision. THA never fabricates certainty.**

---

**Report Created:** 2026-06-16  
**Implemented By:** Claude Code  
**Scope:** Family Confidence Trust Correction (Phase 1 - Trust Foundation)
