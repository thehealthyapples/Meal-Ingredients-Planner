# Profile "Cuisine" → "Dietary Pattern" Label Rename

## Rollback Protection

- **Rollback tag:** `rollback/pre-dietary-pattern-label-rename`
- **Base commit:** `43fbdda` (checkpoint: pre-nutrition-boost-provenance rollback point)
- **Recovery command:** `git checkout rollback/pre-dietary-pattern-label-rename -- client/src/pages/profile-page.tsx`

---

## Summary

The Profile page displayed "Cuisine" as the section header and field label for values that are dietary patterns (Vegetarian, Vegan, Keto, Paleo, Mediterranean, DASH, MIND, Flexitarian, Carnivore, Low-Carb). This is a label accuracy fix — no data, schema, logic, or API changes.

---

## Files Changed

| File | Change |
|------|--------|
| `client/src/pages/profile-page.tsx` | Two user-facing label strings updated |

### Exact changes

**Line 1332** — section header:
```diff
- {showDiet ? "Cuisine" : "Goals"}
+ {showDiet ? "Dietary Pattern" : "Goals"}
```

**Line 1344** — SettingRow label prop:
```diff
- <SettingRow label="Cuisine" summary={cuisineSummary} testId="row-cuisine">
+ <SettingRow label="Dietary Pattern" summary={cuisineSummary} testId="row-cuisine">
```

### Internal variable names left unchanged (not user-facing)

- `cuisine` (line 151) — local variable, holds `profile.dietPattern` value
- `cuisineSummary` (line 1315) — local variable, summary string for SettingRow
- `testId="row-cuisine"` — test identifier, not user-visible

---

## Scope Lock Compliance

| Action | Status |
|--------|--------|
| Schema modified | NO |
| Stored data altered | NO |
| API changed | NO |
| Planner logic changed | NO |
| Validation changed | NO |
| Mediterranean moved | NO |
| Migration created | NO |
| Diet rules changed | NO |

Only the two user-facing string literals were modified.

---

## Data Impact

| Question | Answer |
|----------|--------|
| Reads existing data | YES — displays existing `dietPattern` value |
| Writes new data | NO |
| Changes meaning of existing data | NO |
| Requires backfill | NO |

---

## Manual Test Plan & Results

### Test 1 — Label displays correctly
- Open Profile page
- Verify section header shows **"Dietary Pattern"** (not "Cuisine")
- Verify SettingRow label shows **"Dietary Pattern"** (not "Cuisine")

### Test 2 — Existing values still display
- Confirm all dietary pattern values render correctly:
  - Vegetarian ✓
  - Vegan ✓
  - Keto ✓
  - Mediterranean ✓
  - DASH ✓
  - MIND ✓
  - Flexitarian ✓
  - Carnivore ✓
  - Low-Carb ✓
  - Paleo ✓

### Test 3 — Save and reload
- Select a dietary pattern value
- Save profile
- Reload page
- Confirm label still reads "Dietary Pattern"
- Confirm selected value persists

---

## Trust Check

| Question | Answer |
|----------|--------|
| Could this mislead users? | No — "Dietary Pattern" is more accurate than "Cuisine" |
| Could this fabricate certainty? | No |
| Is anything guessed but shown as real? | No |
| What happens if wrong? | Only text labels change. No behaviour changes. |

---

## Final Verification

```
grep -n '"Cuisine"' client/src/pages/profile-page.tsx
# Expected: no results (all user-facing "Cuisine" strings replaced)

grep -n '"Dietary Pattern"' client/src/pages/profile-page.tsx
# Expected: lines 1332 and 1344
```

**Result:** Confirmed — no remaining `"Cuisine"` label strings. Both replaced with `"Dietary Pattern"`.
