# THA Intelligence Developer Capability Registry

**Classification:** Implementation Guidance (NOT governing architecture)
**Status:** ACTIVE — established INT9A, 2026-06-30
**Applies to:** Intelligence capability implementation planning on the THA Intelligence Platform

> **This is planning documentation, not a runtime source of truth.**
> The Runtime Capability Registry at `server/intelligence/capability-registry.ts` owns runtime capability metadata. This document is a developer reference that reduces codebase discovery time for future capability bindings. Runtime behaviour must never depend on this document.

---

## Classification — Two Registries, Two Purposes

| Registry | File | Purpose | Runtime? |
|---|---|---|---|
| **Runtime Capability Registry** | `server/intelligence/capability-registry.ts` | Canonical allow-list of capabilities the Intelligence Platform may touch at runtime. Owns `availability`, `executableIntents`, and handler binding. | **Yes — authoritative** |
| **Developer Capability Registry** | This document (`docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md`) | Planning guide for future binding implementations. Reduces discovery time. Never a source of truth. | **No — planning only** |

**Rules:**
- This document must never become a runtime source of truth.
- It must never duplicate business ownership.
- Runtime behaviour must not depend on it.
- If this document conflicts with the capability-registry.ts, the runtime registry wins.

---

## How to Use This Document

A future prompt can be as compact as:

```
Using INT7A Capability Factory and the Developer Capability Registry,
bind Diary read-only.
```

The implementer reads this document to find: capability ID, owner service, SoT entry, access scope, executable intents, port methods, files to create, and the test pattern to follow — without re-reading all prior INT workstreams.

---

## Compact Future Prompt Template

```
Using INT7A Capability Factory (docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md)
and the Developer Capability Registry (docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md),
bind <Capability> read-only.

Capability ID:          <id>
Owner service:          <file>
Source of Truth:        <SoT entry>
Access scope:           <own-data / public>
Supported read intents: <verbs>
Honest gaps:            <list>
Trust rules:            <list>
```

---

## Phase 1 — Completed Bindings

### Planner (INT2)

| Field | Value |
|---|---|
| **Capability ID** | `planner` |
| **Workstream** | INT2 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` (planner data) + `server/lib/household.ts` (auth) |
| **Source of Truth** | SoT D14 — `planner_weeks / planner_days / planner_entries` tables |
| **Access scope** | Own-data only (household-scoped) |
| **AI access class** | `W!` (destructive capable) — bound read-only |
| **Capability class** | `destructive` |
| **Executable intents** | `read`, `explain` |
| **Supported future intents** | `recommend`, `generate`, `add`, `move`, `replace`, `delete`, `import`, `share` |
| **Port file** | `server/intelligence/handlers/planner-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/planner-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/planner.ts` |
| **Test file** | `server/tests/test-intelligence-planner-binding.ts` |
| **Implementation report** | `docs/implementation/INT2_FIRST_CAPABILITY_BINDING_IMPLEMENTATION.md` |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getHouseholdForUser(userId)` | `household.getHouseholdForUser(userId)` |
| `getPlannerWeeks(userId)` | `storage.getPlannerWeeks(userId)` |
| `getPlannerWeek(id)` | `storage.getPlannerWeek(id)` |
| `getPlannerDays(weekId)` | `storage.getPlannerDays(weekId)` |
| `getPlannerDay(id)` | `storage.getPlannerDay(id)` |
| `getPlannerEntriesForDay(dayId)` | `storage.getPlannerEntriesForDay(dayId)` |
| `getPlannerEntriesForWeek(weekId)` | `storage.getPlannerEntriesForWeek(weekId)` |
| `getPlannerEntryById(id)` | `storage.getPlannerEntryById(id)` |
| `getMeal(id)` | `storage.getMeal(id)` → `{ id, name }` |

**Read scopes:** `week` (by `weekId` or `weekNumber`), `day` (by `dayId`, or `weekId|weekNumber` + `dayOfWeek`)

**Honest gaps:**
- `scope: "today"` — the planner owns no calendar mapping; cannot resolve "today" to a planner slot
- Missing `weekId`/`weekNumber` parameter — gap, not an error
- Week or day outside caller's household — `denied` (no existence leak)
- `explain` with no `entryId` — gap
- Entry with no stored `adaptationResult` — honest gap (not fabricated)
- Any write verb (`generate`, `add`, `move`, `replace`, `delete`, `import`, `share`) — honest gap

**Trust rules:**
- Never fabricate a meal selection rationale; only surface the planner's stored `adaptationResult`
- No cross-household reads under any circumstance
- `explain` must only return `source: "planner-household-adaptation"`

---

### Shopping (INT3)

| Field | Value |
|---|---|
| **Capability ID** | `shopping` |
| **Workstream** | INT3 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` |
| **Source of Truth** | SoT D15 — `shopping_list / shopping_list_extras` tables |
| **Access scope** | Own-data only (household-scoped via owner getter) |
| **AI access class** | `W` (write capable) — bound read-only |
| **Capability class** | `write` |
| **Executable intents** | `read`, `explain` |
| **Supported future intents** | `add`, `delete`, `generate` |
| **Port file** | `server/intelligence/handlers/shopping-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/shopping-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/shopping.ts` |
| **Test file** | `server/tests/test-intelligence-shopping-binding.ts` |
| **Implementation report** | `docs/implementation/INT3_SHOPPING_CAPABILITY_BINDING_IMPLEMENTATION.md` |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getShoppingListItems(userId)` | `storage.getShoppingListItems(userId)` |
| `getShoppingListExtras(userId)` | `storage.getShoppingListExtras(userId)` |

**Read scopes:** `list` (items + extras), `unresolved` (owner-flagged items), `basket` (pricing summary from stored prices only)

**Honest gaps:**
- `basket` scope when owner has stored no prices — gap (£0 is a fabrication)
- `explain` when item has no meaningful stored status signal (`resolutionState: "raw"` / null, no `shopStatus`, no review reason, no match) — gap
- Item id not in the caller's household list — `denied` (no existence leak)
- Any write verb (`add`, `delete`, `generate`) — honest gap
- `order` verb — registered gap in runtime registry (no checkout endpoint exists)

**Trust rules:**
- Never fabricate a price or product match
- Never assert a store was chosen
- Unresolved items must always be surfaced explicitly, never hidden behind a fabricated total
- Low-confidence matches stay reviewable — `confidenceLevel` must be surfaced as-is

---

### Nutrition / Knowledge (INT4)

| Field | Value |
|---|---|
| **Capability ID** | `nutrition-knowledge` |
| **Workstream** | INT4 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/services/nutrition-knowledge-registry.ts` |
| **Source of Truth** | SoT D1 — WS0 `knowledge_*` tables |
| **Access scope** | Public (no auth required; general food knowledge only) |
| **AI access class** | `R` (read-only) |
| **Capability class** | `read-only` |
| **Executable intents** | `read`, `search`, `explain` |
| **Supported future intents** | `analyse`, `compare`, `report` |
| **Port file** | `server/intelligence/handlers/nutrition-knowledge-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/nutrition-knowledge-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/nutrition-knowledge.ts` |
| **Test file** | `server/tests/test-intelligence-nutrition-knowledge-binding.ts` |
| **Implementation report** | `docs/implementation/INT4_NUTRITION_KNOWLEDGE_CAPABILITY_BINDING_IMPLEMENTATION.md` |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getFoodDetailView(slug)` | `registry.getFoodDetailView(slug)` |
| `getNutrientDetailView(slug)` | `registry.getNutrientDetailView(slug)` |
| `getBenefitDetailView(slug)` | `registry.getBenefitDetailView(slug)` |
| `getFoodBenefitsForDisplay(foodSlug)` | `registry.getFoodBenefitsForDisplay(foodSlug)` |
| `searchKnowledgeRegistry(query)` | `registry.searchKnowledgeRegistry(query)` |
| `listFoodCategories()` | `registry.listFoodCategories()` |
| `listFoodCards(category?)` | `registry.listFoodCards(category)` |

**Read scopes:** `food` (by slug), `nutrient` (by slug), `benefit` (by slug), `categories` (all categories with counts), `foods` (food cards, optionally by category)

**Notable difference:** This binding does NOT call `requireUserId`. Port is resolved only inside executable verb cases, not at handler entry — gap-returning verbs never trigger owner resolution.

**Honest gaps:**
- Unknown food/nutrient/benefit slug — gap (no fabrication)
- Empty search result — returned as-is (empty arrays are honest; not a gap)
- `explain` with `benefitSlug` not linked to the food — gap (never assert an unlinked benefit)
- `explain` for food with no stored benefits — gap
- `analyse` — no grounded analysis read in owner's scope; honest gap
- `compare` — no grounded food comparison read; honest gap
- `report` — user-specific/diary-linked; out of scope; honest gap

**Trust rules:**
- Source-gated: every fact originates in `knowledge_*` tables via display-safe owner helpers
- Never author a nutrition fact or health claim
- Never assert a food↔benefit link the owner did not store
- `source: "nutrition-knowledge-registry"` must always be present in results

---

### Pantry (INT8)

| Field | Value |
|---|---|
| **Capability ID** | `pantry` |
| **Workstream** | INT8 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` |
| **Source of Truth** | SoT D8–D11 — `userPantryItems` + `pantry_ingredient_knowledge` tables |
| **Access scope** | Own-data only (household-scoped via owner getter) |
| **AI access class** | `W` (write capable) — bound read-only |
| **Capability class** | `write` |
| **Executable intents** | `read`, `explain` |
| **Supported future intents** | `add`, `delete`, `search`, `recommend` |
| **Port file** | `server/intelligence/handlers/pantry-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/pantry-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/pantry.ts` |
| **Test file** | `server/tests/test-intelligence-pantry-binding.ts` |
| **Implementation report** | `docs/implementation/INT8_PANTRY_READ_ONLY_CAPABILITY_IMPLEMENTATION.md` |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getPantryItems(userId)` | `storage.getPantryItems(userId)` |
| `getPantryIngredientKnowledge(ingredientKey)` | `storage.getPantryIngredientKnowledge(ingredientKey)` |

**Read scopes:** `list` (household pantry items only)

**Honest gaps:**
- `scope` other than `"list"` — gap
- `explain` with no `ingredientKey` — gap
- `ingredientKey` not in caller's household pantry — `denied` (no existence leak)
- `ingredientKey` in pantry but no stored knowledge in `pantry_ingredient_knowledge` — honest gap
- Any write verb (`add`, `delete`, `search`, `recommend`) — honest gap

**Trust rules:**
- Never fabricate ingredient descriptions, storage guidance, or dietary claims
- Knowledge gate: `explain` requires the item to appear in the caller's own pantry before exposing ingredient knowledge
- `source: "pantry-ingredient-knowledge"` must be present in explain results
- `enrichmentSource` field must be surfaced as-is (attribution — never a fabrication signal)

---

### Diary (INT10)

| Field | Value |
|---|---|
| **Capability ID** | `diary` |
| **Workstream** | INT10 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` |
| **Source of Truth** | SoT D21 — `food_diary_days / food_diary_entries / food_diary_metrics` tables |
| **Access scope** | Own-data only (user-scoped) |
| **AI access class** | `W` (write capable) — bound read-only |
| **Capability class** | `write` |
| **Executable intents** | `read`, `explain` |
| **Supported future intents** | `add`, `delete`, `import` |
| **Port file** | `server/intelligence/handlers/diary-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/diary-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/diary.ts` |
| **Test file** | `server/tests/test-intelligence-diary-binding.ts` |
| **Implementation report** | `docs/implementation/INT10_DIARY_CAPABILITY_BINDING_IMPLEMENTATION.md` |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getFoodDiaryDay(userId, date)` | `storage.getFoodDiaryDay(userId, date)` |
| `getFoodDiaryEntries(userId, date)` | `storage.getFoodDiaryEntries(userId, date)` |
| `getFoodDiaryMetrics(userId, date)` | `storage.getFoodDiaryMetrics(userId, date)` |

**Read scopes:** `day` (day header + all logged entries for a date). `explain` returns stored wellness metrics for a date.

**Honest gaps:**
- No diary day stored for the requested date — gap
- No stored wellness metrics for the requested date — gap
- Missing `date` parameter on `read` or `explain` — gap
- `scope` other than `"day"` — gap
- Any write verb (`add`, `delete`, `import`) — honest gap

**Trust rules:**
- Never fabricate diary entries, nutritional values, weight, mood, sleep, or energy values
- `source` always present (`"food-diary"` / `"food-diary-metrics"`)
- Internal fields (`userId`, `dayId`, `id`, `customValues`, `createdAt`) never surfaced in projections

---

### Profile / Preferences (INT12)

| Field | Value |
|---|---|
| **Capability ID** | `profile` |
| **Workstream** | INT12 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` |
| **Source of Truth** | SoT D7, D26, D27 — `users` + `user_preferences` tables |
| **Access scope** | Own-data only (user-scoped; no id parameter — always the caller's own row) |
| **AI access class** | `W` (write capable) — bound read-only |
| **Capability class** | `write` |
| **Executable intents** | `read` |
| **Supported future intents** | `explain`, `add` |
| **Port file** | `server/intelligence/handlers/profile-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/profile-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/profile.ts` |
| **Test file** | `server/tests/test-intelligence-profile-binding.ts` |
| **Implementation report** | `docs/implementation/INT12_PROFILE_CAPABILITY_BINDING_IMPLEMENTATION.md` |
| **Canonical Capability Card** | [`docs/architecture/capabilities/profile.md`](./capabilities/profile.md) |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getUser(userId)` | `storage.getUser(userId)` |
| `getUserPreferences(userId)` | `storage.getUserPreferences(userId)` |

**Read scopes:** `profile` (default/only scope) — a combined `{ profile, preferences }` result: an EXPLICIT `users` field allowlist (mirrors `buildProfileResponse` in `server/routes.ts`) plus every substantive `user_preferences` column.

**Honest gaps:**
- No stored `users` row for the resolved id — gap (should not happen for an authenticated session, but never fabricated)
- `scope` other than `"profile"` — gap (explicitly redirects `household-eaters`/`eaters` scope requests to the Household capability)
- `explain` — gap (no stored rationale for any profile field)
- `add` — gap (a write; profile/preference edits remain owned by the Profile service)

**Trust rules:**
- `password`, `emailVerificationToken`, `emailVerificationExpires`, `passwordResetToken`, `passwordResetExpires` never surfaced — explicit allowlist, never the raw `storage.getUser()` row
- No stored preferences row → `preferences: null`, never a fabricated default object
- Household eater dietary overrides never pulled into a profile read (belong to the Household capability)
- No computed/derived fields (BMI, calculated calories, `hasPremiumAccess`) — those are route-layer composition in `buildProfileResponse`, not owner reads, and are out of scope for a delegation-only binding

---

### Household (INT13)

| Field | Value |
|---|---|
| **Capability ID** | `household` |
| **Workstream** | INT13 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` (Household System + Eaters sections) + `server/lib/household.ts` (`getHouseholdForUser` session resolver) |
| **Source of Truth** | SoT D16 — `households` / `household_members` / `household_eaters` tables |
| **Access scope** | Own-data only (household-scoped; no id parameter — always resolved from the caller's own membership via `getHouseholdForUser`) |
| **AI access class** | `W!` (destructive capable) — bound read-only |
| **Capability class** | `destructive` |
| **Executable intents** | `read` |
| **Supported future intents** | `explain`, `add`, `delete` |
| **Port file** | `server/intelligence/handlers/household-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/household-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/household.ts` |
| **Test file** | `server/tests/test-intelligence-household-binding.ts` |
| **Implementation report** | `docs/implementation/INT13_HOUSEHOLD_CAPABILITY_BINDING_IMPLEMENTATION.md` |
| **Canonical Capability Card** | [`capabilities/household.md`](./capabilities/household.md) |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getHouseholdForUser(userId)` | `household.getHouseholdForUser(userId)` |
| `getHouseholdWithMembers(householdId)` | `storage.getHouseholdWithMembers(householdId)` |
| `getHouseholdDietaryContext(userId)` | `storage.getHouseholdDietaryContext(userId)` |
| `getHouseholdEaters(householdId)` | `storage.getHouseholdEaters(householdId)` |
| `getUser(userId)` | `storage.getUser(userId)` (adult-eater enrichment only) |

**Read scopes:** `household` (id, name, the caller's own `myRole`, active members — `inviteCode` excluded, see Trust rules), `dietary-context` (the owner's aggregated diet types/restrictions/exclusions, surfaced unmodified), `eaters` (`household_eaters` rows; adult rows enriched at read time from `users.dietPattern`/`users.dietRestrictions`, mirroring `server/routes.ts:8526–8541`; child rows unchanged).

**Honest gaps:**
- Caller has no active household membership — `getHouseholdForUser()` throws; the handler translates this into a gap, never `denied`, never a fabricated empty household
- Missing or unsupported `scope` — gap listing the three supported scopes
- `explain` — gap (no stored rationale on membership/eater records)
- `add` / `delete` — gap (writes; household creation, member invite/removal, eater create/update remain owned by the Household service)

**Trust rules:**
- `inviteCode` (a join secret) is never surfaced — resolves the canonical Capability Card's documented OPEN DECISION (excluded, not a default-allow)
- No dietary restriction or diet type is ever fabricated — an adult eater with no stored `dietPattern` projects an empty `defaultDietTypes`, never invented
- Never surfaces another household's membership or eaters — structural, no id parameter exists
- `syncMembersAsEaters` (a write — lazily inserts missing eater rows) is never called by this read-only binding, unlike the human `/api/household/eaters` route

---

### Partners (INT14)

| Field | Value |
|---|---|
| **Capability ID** | `partners` |
| **Workstream** | INT14 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/lib/supermarket-basket-service.ts` (`getBasketSupermarkets()`, the static retailer list) |
| **Source of Truth** | None — a hardcoded static array of 9 UK retailers (no DB table) |
| **Access scope** | Not user-owned (public/advisory); the live human route still requires an authenticated caller |
| **AI access class** | `R+A` — bound read-only, single scope |
| **Capability class** | `ai-assisted` |
| **Executable intents** | `read` (scope `"retailers"` only) |
| **Supported future intents** | `explain`, `recommend`, `compare` — **no safe, grounded owner exists for any of them** (see Honest gaps) |
| **Port file** | `server/intelligence/handlers/partners-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/partners-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/partners.ts` |
| **Test file** | `server/tests/test-intelligence-partners-binding.ts` |
| **Implementation report** | `docs/implementation/INT14_PARTNERS_CAPABILITY_BINDING_IMPLEMENTATION.md` |
| **Canonical Capability Card** | [`capabilities/partners.md`](./capabilities/partners.md) |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getBasketSupermarkets()` | `supermarket-basket-service.getBasketSupermarkets()` (static, synchronous; wrapped in a Promise to match the port contract) |

**Read scopes:** `retailers` (the static 9-retailer list — `name`, `key`, `color`, `hasDirectBasket` — surfaced unmodified).

**Honest gaps:**
- Missing or unsupported `scope` — gap naming the one supported scope
- `explain` — gap (no live code path; the Card found no stored rationale)
- `recommend` / `compare` — gap (no safe, grounded owner; the only code path that could serve per-store price comparison makes a live external fetch and synthesizes per-store prices with hardcoded variance/tier multipliers, which would be a fabrication if presented as fact)

**Trust rules:**
- Never surfaces a per-store price, a price comparison, or a store recommendation — the only live result shape (`retailers`) has no such field
- `verifyStoreAvailability()` (an unimplemented stub) is never called or implied as a real verification
- `/api/routing` and `/api/savings/*` (named in the registry's `apiSurface` but unrelated to retailers, per the Card) are excluded from this binding entirely

---

### Meals (INT15)

| Field | Value |
|---|---|
| **Capability ID** | `meals` |
| **Workstream** | INT15 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` — `getMeals`, `getMeal`, `getMealsSummary`, `getSystemMeals`/`getSystemMealsSummary`, `getMealItems`. NOT `server/lib/meal-service.ts` (starter-meals onboarding only), NOT `recipe-swap-engine.ts` (write/generation, no read surface), NOT `server/meal-resolution-service.ts` (meal-plan slot resolution, a different concern) — corrects the registry's `owningService` string |
| **Source of Truth** | SoT D12 — `meals` + `meal_items` tables (`shared/schema.ts:95–133, 1260–1268`). Nutrition is a separate table, joined by `mealId` — out of this capability's scope entirely |
| **Access scope** | User-scoped (`storage.getMeals` filters by `userId`) plus system meals (shared, `isSystemMeal=true`) — corrects the registry's prior "household-scoped" description; there is no household-level meal scoping anywhere in the owner |
| **AI access class** | `W!` (destructive capable) — bound read-only |
| **Capability class** | `destructive` |
| **Executable intents** | `read` (scopes `"list"` / `"summary"` / `"detail"`) |
| **Supported future intents** | `explain`, `search`, `recommend`, `generate`, `add`, `replace`, `delete`, `import`, `share` — **no safe, grounded owner exists for `explain`/`search`/`recommend`** (see Honest gaps); the rest are writes |
| **Port file** | `server/intelligence/handlers/meals-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/meals-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/meals.ts` |
| **Test file** | `server/tests/test-intelligence-meals-binding.ts` |
| **Implementation report** | `docs/implementation/INT15_MEALS_CAPABILITY_BINDING_IMPLEMENTATION.md` |
| **Canonical Capability Card** | [`capabilities/meals.md`](./capabilities/meals.md) |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getMeals(userId)` | `storage.getMeals(userId)` |
| `getSystemMeals()` | `storage.getSystemMeals()` |
| `getMealsSummary(userId)` | `storage.getMealsSummary(userId)` |
| `getSystemMealsSummary()` | `storage.getSystemMealsSummary()` |
| `getMeal(id)` | `storage.getMeal(id)` — **NOT ownership-scoped by the owner** |
| `getMealItems(mealId)` | `storage.getMealItems(mealId)` — **NOT ownership-scoped by the owner** |

`lookupMeals(query)` is deliberately NOT exposed — see Honest gaps (`search`).

**Read scopes:** `list` (the caller's meals + system meals, full rows, merged exactly as `/api/meals` does), `summary` (the same, using the owner's own `MealSummary` projection — `ingredientCount` instead of raw ingredients/instructions), `detail` (a single meal + its `meal_items`, requires `{ mealId }`).

**Honest gaps:**
- Missing or unsupported `scope` — gap naming the three supported scopes
- `detail` with no `mealId` parameter — gap
- `explain` — gap (no stored rationale field on meals)
- `search` — gap. **OPEN DECISION, unresolved by this workstream:** `storage.lookupMeals(query)` has zero scoping — it ILIKE-matches `meals.name` across the ENTIRE table, including other users' private (non-system) meals (`server/storage.ts:1406–1423`); the existing route only checks `isAuthenticated()`, not ownership. Binding it as-is would let any caller search other users' private meal names — not safe without a governance decision (owner adds scoping, or the handler filters post-hoc, or the verb stays gapped — this workstream chose the last)
- `recommend` — gap. The existing `/api/meals/recommended` route computes ranking (`rankMealsByPreferences`) INLINE AT THE ROUTE LAYER, not via a delegate-only owner method; reimplementing that ranking in the handler would be business logic in the handler (forbidden by INT7A)
- `generate`/`add`/`replace`/`delete`/`import`/`share` — gap (writes; remain owned by the Meals service)
- A meal id that does not exist, or that exists but is owned by another user and is not a system meal — **`denied`**, with the identical message in both cases (no existence leak), exactly mirroring `server/routes.ts:1183`

**Trust rules:**
- Never fabricates ingredient quantities — only stored fields are surfaced, never estimated
- Never fabricates or surfaces a nutritional value — nutrition is a separate table, joined by `mealId`, and is outside this capability's allowed scopes/port methods entirely; the handler never reads it
- Never exposes another user's private meal via `detail` (replicated ownership check) or via `search` (gapped until the open decision above is resolved)

---

### Templates (INT16)

| Field | Value |
|---|---|
| **Capability ID** | `templates` |
| **Workstream** | INT16 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` — `getMealTemplates`, `getMealTemplate`, `getPublishedGlobalTemplates`, `getUserPrivateTemplates`, `getTemplateWithItems`, `getDefaultTemplate`. NOT `server/template-migration.ts` (a one-time backfill script with no read methods) — corrects the registry's `owningService` string |
| **Source of Truth** | SoT D13 — `meal_templates` (`shared/schema.ts:48-79`) + `meal_plan_templates` (865-883) + `meal_plan_template_items` (885-901) |
| **Access scope** | Mixed: `meal_templates` is fully PUBLIC (no ownership column on the table at all, `server/routes.ts:5378-5396`); `meal_plan_templates` is own-data (`ownerUserId = userId`) plus published-global (`ownerUserId IS NULL AND status = "published"`) |
| **AI access class** | `W` |
| **Capability class** | `write` |
| **Executable intents** | `read` (scopes `"meal-templates"` / `"meal-template"` / `"plan-templates"` / `"plan-templates-mine"` / `"plan-templates-default"` / `"plan-template"`) |
| **Supported future intents** | `explain`, `search`, `recommend`, `generate`, `add`, `import`, `delete`, `share` — **no safe, grounded owner exists for `explain`/`search`/`recommend`** (see Honest gaps); the rest are writes |
| **Port file** | `server/intelligence/handlers/templates-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/templates-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/templates.ts` |
| **Test file** | `server/tests/test-intelligence-templates-binding.ts` |
| **Implementation report** | `docs/implementation/INT16_TEMPLATES_CAPABILITY_BINDING_IMPLEMENTATION.md` |
| **Canonical Capability Card** | [`capabilities/templates.md`](./capabilities/templates.md) |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getMealTemplates()` | `storage.getMealTemplates()` |
| `getMealTemplate(id)` | `storage.getMealTemplate(id)` |
| `getPublishedGlobalTemplates(tier)` | `storage.getPublishedGlobalTemplates(tier)` |
| `getUserPrivateTemplates(userId)` | `storage.getUserPrivateTemplates(userId)` |
| `getTemplateWithItems(id)` | `storage.getTemplateWithItems(id)` — **NOT ownership/publish-scoped by the owner** |
| `getDefaultTemplate()` | `storage.getDefaultTemplate()` |

**Read scopes:** `meal-templates` (the public shell-template list), `meal-template` (a single shell template by `mealTemplateId`), `plan-templates` (the caller's library: published-global, tier-filtered from `context.premium`, plus own private — auth required), `plan-templates-mine` (own private only — auth required), `plan-templates-default` (the single `isDefault` template + items — public), `plan-template` (a single template + items by `planTemplateId` — public route, content-gated).

**Honest gaps:**
- Missing or unsupported `scope` — gap naming the six supported scopes
- `meal-template`/`plan-template` with no id parameter — gap
- An unknown `mealTemplateId` or `planTemplateId` — gap (not denied; there is no record to leak)
- No default template currently set — gap
- `explain` — gap (no stored rationale field on any template)
- `search` — gap. No search-by-name/tag method exists anywhere in `storage.ts` (grepped; zero matches for `searchTemplates`/`searchMealTemplates`/`searchPlanTemplates`/`templatesByTag`). Only an exact-match `getMealTemplateByName(name)` exists — not exposed by the port, not a search
- `recommend`/`generate`/`add`/`import`/`delete`/`share` — gap (writes/generation; remain owned by the Templates service)
- A `plan-template` id that exists but is a draft/private template requested by a non-owner, non-admin caller — **`denied`**, STRICTER than the existing route (`GET /api/plan-templates/:id`, `server/routes.ts:7522`, which has NO gate at all)

**Trust rules:**
- Never fabricates a template field — only stored values are surfaced
- Never surfaces `shareToken` — a plan-template join secret (the sharing-link equivalent of Household's `inviteCode`, INT13 precedent); no result shape carries it
- Never trusts a client-supplied tier — `plan-templates`' tier is resolved server-side from `context.premium`, mirroring `server/routes.ts:7193` exactly; a `tier` intent parameter is silently ignored

---

### Analyser (INT17)

| Field | Value |
|---|---|
| **Capability ID** | `analyser` |
| **Workstream** | INT17 |
| **Implementation status** | Complete — `availability: "available"` |
| **Owner service** | `server/storage.ts` — `getAllAdditives()` (the ONLY confirmed stored-read owner method in this capability's neighbourhood). NOT `server/lib/product-analysis.ts` / `server/lib/upf-analysis-service.ts` (pure computation over caller-supplied text/nutriments, not a stored read) — corrects the registry's `owningService` string |
| **Source of Truth** | SoT D19 claims "product analysis tables" — inaccurate; no such table exists in `shared/schema.ts`. The only genuinely stored table in this neighbourhood is `additives` (`shared/schema.ts:609-617`) |
| **Access scope** | Public/advisory (`ownershipScoped: false`); all three live routes named in the registry's `apiSurface` (additives/barcode/scan) require `req.isAuthenticated()` |
| **AI access class** | `R+A` |
| **Capability class** | `ai-assisted` |
| **Executable intents** | `read` (scope `"additives"` only) |
| **Supported future intents** | `explain`, `analyse`, `report` — **no safe, grounded STORED-read owner exists for any of them** (see Honest gaps) |
| **Port file** | `server/intelligence/handlers/analyser-read-port.ts` |
| **Handler file** | `server/intelligence/handlers/analyser-read-handler.ts` |
| **Binding file** | `server/intelligence/bindings/analyser.ts` |
| **Test file** | `server/tests/test-intelligence-analyser-binding.ts` |
| **Implementation report** | `docs/implementation/INT17_ANALYSER_CAPABILITY_BINDING_IMPLEMENTATION.md` |
| **Canonical Capability Card** | [`capabilities/analyser.md`](./capabilities/analyser.md) |

**Port methods:**

| Method | Owner delegation |
|---|---|
| `getAllAdditives()` | `storage.getAllAdditives()` |

**Read scopes:** `additives` (the static additives reference table — `id`, `name`, `type`, `riskLevel`, `description`, `isRegulatory`, `aliases`, surfaced unmodified).

**Honest gaps:**
- Missing or unsupported `scope` — gap naming the one supported scope
- `explain` — gap (additive descriptions are already covered by the `additives` read scope; no other stored rationale exists)
- `analyse` — gap. Barcode/product lookup is NOT a stored read — it live-fetches OpenFoodFacts and recomputes analysis fresh on every call via `analyzeProduct`/`analyzeProductUPF`; no result is ever persisted to a product-analysis table. Binding this would require either a live third-party network call from inside a read-only binding or a stored result table that does not currently exist
- `report` — user-specific/diary-linked, out of scope — gap
- `/api/scan` (named in the registry's `apiSurface`) was investigated and found to be recipe/shopping-list/planner OCR extraction with no call to `analyzeProduct`/`analyzeProductUPF` — excluded entirely from this capability's scope

**Trust rules:**
- Never fabricates a UPF classification, health score, or NOVA group for a product — there is no stored result; any such value can only come from a live recompute, which is explicitly NOT in the executable scope
- Additives are surfaced as-is from the reference table

---

## Phase 2 — Planned Bindings

The capabilities below are registered in the runtime registry (`availability: "registered"`) but have no execution handler. Each entry records what a future implementer needs to start an INT7A Factory binding without codebase discovery.

> **Before binding any of these:** confirm the capability is still `registered` in `capability-registry.ts`, confirm the owner service still exposes the expected read methods, and fill in the INT7A Factory fill-in template fully before writing a line of code.

---

### Diary

| Field | Value |
|---|---|
| **Capability ID** | `diary` |
| **Implementation status** | Registered only — not bound |
| **Owner service** | Routes-resident diary logic + `server/lib/meal-resolution-service.ts` |
| **Source of Truth** | SoT D21 — `food_diary_*` tables |
| **Access scope** | Own-data only (user-scoped) |
| **AI access class** | `W` |
| **Capability class** | `write` |
| **Supported intents** | `read`, `explain`, `add`, `delete`, `import` |
| **Recommended executable intents (read-only binding)** | `read`, `explain` |
| **Allowed read scopes (to confirm)** | Daily diary entries; nutritional totals (if owner exposes them) |
| **Honest gaps to document** | No stored nutritional total → gap; diary entry not found → `denied`; write verbs → gap |
| **Trust rules** | Never fabricate nutritional values; only surface what the diary owner stored |
| **Next recommended action** | Locate diary read methods in routes; confirm owner exposes day-level and entry-level reads; run INT7A Factory |

> **Note:** `diary` has since been bound under INT10 (`server/intelligence/bindings/diary.ts`, `availability: "available"`). The row above is kept for historical Phase 2 record-keeping; see the full **Diary (INT10)** entry under Phase 1 — Completed Bindings above, or `docs/implementation/INT10_DIARY_CAPABILITY_BINDING_IMPLEMENTATION.md`, for the completed binding.

---

## Phase 2 — Capability Index (canonical cards promoted to governing architecture, EPIC 1.5)

Six entries were upgraded from rough Phase 2 stubs to fully evidence-grounded **Capability Cards** under workstream INT11 (EPIC 1), then **promoted to governing architecture** under EPIC 1.5 (2026-06-30). The canonical Capability Card for each — owner evidence, allowed scopes, honest gaps, permission model, trust rules, and open decisions — lives in exactly one place: `docs/architecture/capabilities/`. This table is an index only; it does not restate card content.

`profile` has since been bound under INT12 (`server/intelligence/bindings/profile.ts`, `availability: "available"`) — see the full **Profile / Preferences (INT12)** entry under Phase 1 — Completed Bindings above. `household` has since been bound under INT13 (`server/intelligence/bindings/household.ts`, `availability: "available"`) — see the full **Household (INT13)** entry under Phase 1 — Completed Bindings above. `partners` has since been bound under INT14 (`server/intelligence/bindings/partners.ts`, `availability: "available"`) — see the full **Partners (INT14)** entry under Phase 1 — Completed Bindings above. `meals` has since been bound under INT15 (`server/intelligence/bindings/meals.ts`, `availability: "available"`) — see the full **Meals (INT15)** entry under Phase 1 — Completed Bindings above. `templates` has since been bound under INT16 (`server/intelligence/bindings/templates.ts`, `availability: "available"`) — see the full **Templates (INT16)** entry under Phase 1 — Completed Bindings above. `analyser` has since been bound under INT17 (`server/intelligence/bindings/analyser.ts`, `availability: "available"`) — see the full **Analyser (INT17)** entry under Phase 1 — Completed Bindings above. All six cards are now bound.

> **Before binding any of these:** read the full canonical card (linked below) for the open decisions and owner corrections — several diverge materially from what the capability registry's `apiSurface`/`owningService` strings imply.

| Capability | Implementation status | Binding status | Executable intents | Owner service | Canonical document |
|---|---|---|---|---|---|
| Profile / Preferences | Capability Card complete | **Bound (INT12)** | `read` | `server/storage.ts` | [`capabilities/profile.md`](./capabilities/profile.md) |
| Household | Capability Card complete | **Bound (INT13)** | `read` | `server/storage.ts` + `server/lib/household.ts` (session resolver) | [`capabilities/household.md`](./capabilities/household.md) |
| Partners / Supermarkets | Capability Card complete | **Bound (INT14)** | `read` (retailer list only) | `server/lib/supermarket-basket-service.ts` | [`capabilities/partners.md`](./capabilities/partners.md) |
| Meals / Cookbook | Capability Card complete | **Bound (INT15)** | `read` (search deferred) | `server/storage.ts` | [`capabilities/meals.md`](./capabilities/meals.md) |
| Plan Templates | Capability Card complete | **Bound (INT16)** | `read` | `server/storage.ts` | [`capabilities/templates.md`](./capabilities/templates.md) |
| Analyser (Product / UPF) | Capability Card complete | **Bound (INT17)** | `read` (additives only) | `server/storage.ts` | [`capabilities/analyser.md`](./capabilities/analyser.md) |

> Full evidence, owner corrections, allowed scopes, honest gaps, trust rules, permission models, and open governance decisions are recorded once, in each canonical document above. The original investigation report — `docs/implementation/INT11_CAPABILITY_CARDS_SPECIFICATION.md` — remains as historical record of how the cards were produced; it is not the canonical source for the cards themselves any longer.

---

## Cross-Cutting Patterns

These patterns apply to every future binding. They are proven by the eleven completed bindings (INT2–INT4, INT8, INT10, INT12, INT13, INT14, INT15, INT16, INT17) and enforced by the INT7A Factory.

### Port pattern (every binding)

```
server/intelligence/handlers/<capability>-read-port.ts
  export interface <Capability>ReadPort { ... }         // read-only, 1:1 owner delegation
  export async function createStorage<Capability>ReadPort()  // dynamic import factory
```

### Handler pattern (every binding)

```
server/intelligence/handlers/<capability>-read-handler.ts
  1. readOnlyVerbGuard(intent, EXECUTABLE_INTENTS, "<Capability>")
  2. requireUserId(context, "<Capability>")  — skip for public capabilities (nutrition-knowledge)
  3. port = await resolvePort()              — resolve once, before the verb switch
  4. switch(intent.verb) { case "read" / "explain" / "search": ... }
  5. throw gap(...) for every non-executable path
  6. throw denied(...) for ownership failures
```

### Binding pattern (every binding)

```
server/intelligence/bindings/<capability>.ts
  export const <CAPABILITY>_CAPABILITY_ID = "<id>"
  export const <CAPABILITY>_EXECUTABLE_INTENTS: readonly IntentVerb[] = [...]
  export function bind<Capability>ReadCapability(platform, resolvePort?)
    → platform.registerHandler(id, handler, executableIntents)
```

### Read Binding Kit imports (every handler)

```typescript
import { gap, denied, requireUserId, toInt, readOnlyVerbGuard } from "./_read-kit.js";
```

### Files created per binding (4 new + 4 edited)

**New:**
- `server/intelligence/handlers/<capability>-read-port.ts`
- `server/intelligence/handlers/<capability>-read-handler.ts`
- `server/intelligence/bindings/<capability>.ts`
- `server/tests/test-intelligence-<capability>-binding.ts`

**Edited:**
- `server/intelligence/intelligence-platform.ts` — add `bind<Capability>ReadCapability(intelligencePlatform)` call
- `server/intelligence/index.ts` — add exports
- `server/intelligence/README.md` — add row to live bindings table
- `package.json` — add `test:intelligence-<capability>-binding` script

**Also:** update the previous binding's scope-lock assertion from N to N+1.

---

## Quick-Start Checklist for Next Binding

Before starting any new binding, confirm:

- [ ] Capability ID exists in `server/intelligence/capability-registry.ts` with `availability: "registered"` (not `"never"`)
- [ ] Owner service is identified and its read methods are located
- [ ] INT7A Factory fill-in template is completed from codebase evidence (no guessing)
- [ ] `docs/architecture/README.md` Architecture Bootstrap has been read
- [ ] Architecture Compliance gates in INT7A Factory Step 1 are completed
- [ ] Rollback tag created before any file is modified

---

## Scope Lock

This document covers:
- Capabilities registered in `server/intelligence/capability-registry.ts` as of INT9A (2026-06-30)
- Eleven completed bindings (INT2, INT3, INT4, INT8, INT10, INT12, INT13, INT14, INT15, INT16, INT17)
- One historical Phase 2 stub retained for record-keeping (diary — superseded by its INT10 binding)
- Six Capability Cards completed under INT11 / EPIC 1 (profile, household, partners, meals, templates, analyser) and promoted to governing architecture under EPIC 1.5; all six have since been bound under INT12, INT13, INT14, INT15, INT16, and INT17 respectively; canonical documents at `docs/architecture/capabilities/`

This document does NOT cover:
- `administration` capability (`availability: "registered"` — admin-role only, not a candidate for standard read-only binding without separate governance)
- `developer` capability (`availability: "never"` — physically isolated developer plane; never in the user-facing registry)
- Any capability added after INT9A — update this document when new capabilities are registered
