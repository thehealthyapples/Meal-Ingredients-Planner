---
name: INT27 Nutrition Discovery design notes
description: Key quirks discovered building the nutrition-discovery capability — storage schema, context type shape, pre-existing TS errors in test files.
---

## Rule: nutrition macro columns are TEXT in the database

The `nutrition` table stores calorie/protein/carbs/fat/sugar columns as TEXT, not NUMERIC. Any engine that filters by these values must parse the text in application code. The `parseMacroText()` function in `NutritionDiscoveryEngine` handles:
- plain integer: `"320"` → 320
- with unit: `"320 kcal"` → 320
- with prefix: `"~300"` → 300
- range: `"300-400"` → 350 (midpoint)
- null/empty/N/A → null (meal excluded from filtered results, never assumed to pass)

**Why:** The column type was chosen at schema creation time and cannot be changed without a migration. Application-layer parsing is the architecture-compliant fix.

**How to apply:** Any future nutrition-filter query must go through `parseMacroText()` or an equivalent. Never cast in SQL — it silently fails on non-numeric strings.

## Rule: IntelligenceContext type shape

`IntelligenceContext` (in `server/intelligence/types.ts`) has exactly:
```ts
{ role: IntelligenceRole; userId?: string; premium?: boolean; }
```
- `userId` is `string | undefined`, NOT number.
- No `subscriptionTier`, no `surface`.

**Why:** Discovered when tsc flagged `userId: 1` (number) and `subscriptionTier` as unknown property in the test.

**How to apply:** When constructing a context in tests, use `{ role: "user", userId: "1", premium: false }` — always quote the userId.

## Pre-existing tsc TS1378 errors in test files

All intelligence test files use top-level `await`. The project's `tsconfig.json` does not set `module: esnext`, so `tsc --noEmit` always reports TS1378 on every top-level await in every test file. This is a pre-existing condition across all 12+ binding test files. `npx tsx` handles it correctly at runtime. Do NOT attempt to fix these unless the tsconfig is being updated deliberately.
