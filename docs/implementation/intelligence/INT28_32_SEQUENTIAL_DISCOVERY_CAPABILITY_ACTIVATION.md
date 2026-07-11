# INT28–32 Sequential Discovery Capability Activation

**Document type**: Implementation deliverable  
**Capabilities activated**: INT28 · INT29 · INT30 · INT31 · INT32  
**Final live capability count**: 18 (scope lock updated by INT32)  
**Total registered**: 20  
**All tests**: 18 test files, 0 failures  

---

## Overview

EWO-INT28–32 activates five sequential read-only Intelligence Discovery capabilities — each one searches a distinct domain of the user's personal data through the platform's Port→Handler→Binding architecture. All five are pure read capabilities: no data is mutated, ownership is user-scoped, and every handler rejects write verbs.

| INT | Capability ID | Searches | Test file | Result |
|-----|--------------|---------|-----------|--------|
| INT28 | `planner-discovery` | 6-week planner entries by meal name or date | `test-intelligence-planner-discovery-binding.ts` | 40/40 |
| INT29 | `household-discovery` | Household members, dietary prefs, allergens | `test-intelligence-household-discovery-binding.ts` | 47/47 |
| INT30 | `shopping-discovery` | Shopping list items by name or category | `test-intelligence-shopping-discovery-binding.ts` | 41/41 |
| INT31 | `pantry-discovery` | Pantry items by display name or ingredient key | `test-intelligence-pantry-discovery-binding.ts` | 40/40 |
| INT32 | `diary-discovery` | Food diary entries by food name across all dates | `test-intelligence-diary-discovery-binding.ts` | 37/37 |

---

## Architecture

Every capability follows the same four-layer pattern:

```
Port (types + production factory)
  └── Engine (implements port, no DB coupling)
        └── Handler (routes verbs, calls requireUserId / readOnlyVerbGuard)
              └── Binding (wires engine→handler→platform, exports CAPABILITY_ID)
```

**Key invariants across all five**:
- `_read-kit.ts` provides `requireUserId`, `readOnlyVerbGuard`, `gap` — shared across all read-only handlers.
- Production ports use dynamic `import()` to avoid circular DB initialization at module load.
- An empty `query` parameter returns ALL items (not an error or gap). A gap only fires when a structural prerequisite is absent (e.g. no household found for household-discovery).
- `status === "ok"` in all success paths (not `"success"`).

---

## Files created

### INT28 — Planner Discovery

| File | Purpose |
|------|---------|
| `server/intelligence/handlers/planner-discovery-port.ts` | Port types + production factory |
| `server/intelligence/services/planner-discovery-engine.ts` | Engine: queries plannerEntries via `getUserPlannerEntriesForDiscovery` |
| `server/intelligence/handlers/planner-discovery-handler.ts` | Handler: search verb only |
| `server/intelligence/bindings/planner-discovery.ts` | Binding: `PLANNER_DISCOVERY_CAPABILITY_ID` |

### INT29 — Household Discovery

| File | Purpose |
|------|---------|
| `server/intelligence/handlers/household-discovery-port.ts` | Port types + production factory |
| `server/intelligence/services/household-discovery-engine.ts` | Engine: queries household members + dietary prefs |
| `server/intelligence/handlers/household-discovery-handler.ts` | Handler: search verb only; gap when no household |
| `server/intelligence/bindings/household-discovery.ts` | Binding: `HOUSEHOLD_DISCOVERY_CAPABILITY_ID` |

### INT30 — Shopping Discovery

| File | Purpose |
|------|---------|
| `server/intelligence/handlers/shopping-discovery-port.ts` | Port types + production factory |
| `server/intelligence/services/shopping-discovery-engine.ts` | Engine: queries `getShoppingList(userId)`, filters by name/category |
| `server/intelligence/handlers/shopping-discovery-handler.ts` | Handler: search verb only |
| `server/intelligence/bindings/shopping-discovery.ts` | Binding: `SHOPPING_DISCOVERY_CAPABILITY_ID` |

### INT31 — Pantry Discovery

| File | Purpose |
|------|---------|
| `server/intelligence/handlers/pantry-discovery-port.ts` | Port types + production factory |
| `server/intelligence/services/pantry-discovery-engine.ts` | Engine: queries `getPantryItems(userId)`; excludes `isDeleted` items; falls back to `ingredientKey` when `displayName` is null |
| `server/intelligence/handlers/pantry-discovery-handler.ts` | Handler: search verb only |
| `server/intelligence/bindings/pantry-discovery.ts` | Binding: `PANTRY_DISCOVERY_CAPABILITY_ID` |

### INT32 — Diary Discovery

| File | Purpose |
|------|---------|
| `server/intelligence/handlers/diary-discovery-port.ts` | Port types + production factory |
| `server/intelligence/services/diary-discovery-engine.ts` | Engine: queries `getDiaryEntriesForDiscovery(userId)`; most-recent first |
| `server/intelligence/handlers/diary-discovery-handler.ts` | Handler: search verb only |
| `server/intelligence/bindings/diary-discovery.ts` | Binding: `DIARY_DISCOVERY_CAPABILITY_ID` |

---

## Files modified

### `server/storage.ts`
- Added `desc` to the drizzle-orm import (line 4).
- Added `getDiaryEntriesForDiscovery(userId)` to `IStorage` interface (line 291).
- Added `getDiaryEntriesForDiscovery(userId)` implementation to `DatabaseStorage`: inner-joins `food_diary_entries` + `food_diary_days`, `ORDER BY date DESC`, `LIMIT 500`.

### `server/intelligence/capability-registry.ts`
- Added `pantry-discovery` seed (availability: `"registered"`, before `shopping-discovery`).
- Added `diary-discovery` seed (availability: `"registered"`, before `shopping-discovery`).

### `server/intelligence/intelligence-platform.ts`
- Added `import { bindPantryDiscoveryCapability }` from `./bindings/pantry-discovery.js`.
- Added `import { bindDiaryDiscoveryCapability }` from `./bindings/diary-discovery.js`.
- Added `bindPantryDiscoveryCapability(intelligencePlatform)` call.
- Added `bindDiaryDiscoveryCapability(intelligencePlatform)` call.

### `server/intelligence/index.ts`
- Added INT31 exports: `bindPantryDiscoveryCapability`, `PANTRY_DISCOVERY_CAPABILITY_ID`, `PANTRY_DISCOVERY_BINDING_EXECUTABLE_INTENTS`, handler, port types.
- Added INT32 exports: `bindDiaryDiscoveryCapability`, `DIARY_DISCOVERY_CAPABILITY_ID`, `DIARY_DISCOVERY_BINDING_EXECUTABLE_INTENTS`, handler, port types.

### `server/intelligence/pattern-intent-resolver.ts`
- Added `PANTRY_DISCOVERY_MATCHERS` (6 patterns: "what's in my pantry?", "search pantry for X", "find X in my pantry", "do I have X in my pantry?", "is X in my pantry?", "show me my pantry").
- Added `DIARY_DISCOVERY_MATCHERS` (6 patterns: "search my diary for X", "find X in my food diary", "what have I eaten/logged?", "show me my diary", "have I eaten X?", "did I eat X?").
- Both spread into `ALL_SPECIFIC_MATCHERS` after shopping-discovery.

### Scope-lock bulk update (all 13 pre-existing test files + registry + platform)
- Scope-lock string: `16 → 18` (directly, since both INT31 and INT32 were activated together).
- `live.length === 16` → `live.length === 18` in all binding tests.
- `caps.length === 18` → `caps.length === 20` in `test-intelligence-platform.ts`.
- `execCapabilities.length === 16` → `execCapabilities.length === 18` in `test-intelligence-registry-executability.ts`.
- Added `PANTRY_DISCOVERY_CAPABILITY_ID` and `DIARY_DISCOVERY_CAPABILITY_ID` to registry executability assertions.

---

## Engine behaviour details

### PantryDiscoveryEngine (INT31)
- Source table: `user_pantry_items` via `getPantryItems(userId)`.
- `isDeleted === true` rows are silently excluded.
- `displayName` is nullable — falls back to `ingredientKey` for display.
- Match is case-insensitive substring on both `displayName` and `ingredientKey`.
- Empty query returns all non-deleted items (up to cap).
- Cap: `PANTRY_DISCOVERY_MAX_RESULTS = 100`.
- Result shape: `{ id, pantryItemId, name, ingredientKey, quantity, unit, location, source }`.

### DiaryDiscoveryEngine (INT32)
- Source tables: `food_diary_entries` inner-joined with `food_diary_days` (for the `date` field).
- Storage method `getDiaryEntriesForDiscovery(userId)` returns rows ordered by `date DESC LIMIT 500`.
- Match is case-insensitive substring on `name`.
- Empty query returns all recent entries (up to cap).
- Cap: `DIARY_DISCOVERY_MAX_RESULTS = 50`.
- Result shape: `{ id, diaryEntryId, foodName, mealSlot, date, quantity, unit, source }`.

---

## Scope lock

```
EIGHTEEN capabilities are live
  (planner + shopping + nutrition-knowledge + pantry + diary + profile +
   household + partners + meals + templates + analyser + meal-discovery +
   nutrition-discovery + planner-discovery + household-discovery +
   shopping-discovery + pantry-discovery + diary-discovery)
— scope lock (updated by INT32)
```

- **18 live** (executable, handler-bound).
- **20 registered** in the registry (includes the 2 non-live seeds for future INT33+).

---

## Full test suite result

| Test file | Tests | Failures |
|-----------|-------|---------|
| `test-intelligence-platform.ts` | 33 | 0 |
| `test-intelligence-registry-executability.ts` | 123 | 0 |
| `test-intelligence-analyser-binding.ts` | 30 | 0 |
| `test-intelligence-diary-binding.ts` | 56 | 0 |
| `test-intelligence-household-binding.ts` | 51 | 0 |
| `test-intelligence-meal-discovery-binding.ts` | 68 | 0 |
| `test-intelligence-meals-binding.ts` | 72 | 0 |
| `test-intelligence-nutrition-discovery-binding.ts` | 86 | 0 |
| `test-intelligence-nutrition-knowledge-binding.ts` | 37 | 0 |
| `test-intelligence-pantry-binding.ts` | 47 | 0 |
| `test-intelligence-partners-binding.ts` | 30 | 0 |
| `test-intelligence-profile-binding.ts` | 50 | 0 |
| `test-intelligence-templates-binding.ts` | 56 | 0 |
| `test-intelligence-planner-discovery-binding.ts` | 40 | 0 |
| `test-intelligence-household-discovery-binding.ts` | 47 | 0 |
| `test-intelligence-shopping-discovery-binding.ts` | 41 | 0 |
| `test-intelligence-pantry-discovery-binding.ts` | 40 | 0 |
| `test-intelligence-diary-discovery-binding.ts` | 37 | 0 |
| **Total** | **924** | **0** |
