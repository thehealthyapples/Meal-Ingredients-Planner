# THA Intelligence Platform

**Status:** INT17 — eleventh live capability bound (read-only Analyser), reusing the INT2–INT16 Port → Handler → Binding pattern. Still no user-facing AI behaviour, no assistant, no conversation, no public endpoint.
**Governing architecture:** [`docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`](../../docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md) (TIP1) · [`docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`](../../docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md) (TIP2)

This directory is the **single canonical home** for the THA Intelligence Platform — the one orchestration point all future intelligence (User / Admin / Developer / Voice assistants) will share. It is a thin **orchestration + governance layer over existing services**, never a new application and never a chatbot.

## What it is

| Module | Responsibility |
|---|---|
| `types.ts` | The canonical type contract (roles, verbs, capability/intent shapes, outcomes). Models no business logic. |
| `capability-registry.ts` | The **Capability Registry** — the closed allow-list of capabilities, each a descriptor of an *existing* owner. Seeded with C1–C13 from TIP2. |
| `permissions.ts` | The **permission model** — extends `server/lib/access.ts`; server-side role + knowledge-class gates; deterministic confirmation tiers. |
| `intent-engine.ts` | The **Intent Engine** — orchestration only: locate → validate → permission → confirm → invoke → respond. Holds zero business rules. Surfaces a handler's honest non-result (`CapabilityExecutionError`) as a structured `gap`/`denied` outcome (INT2). |
| `intelligence-platform.ts` | The canonical **entry point** (`intelligencePlatform` singleton) composing the above. Binds the read-only Planner on construction (INT2). |
| `handlers/_read-kit.ts` | INT6B — the **Read Binding Kit**. Shared infrastructure for all read-only handlers: `toInt`, `requireUserId`, `gap`, `denied`, `readOnlyVerbGuard`. Contains **no business logic and no domain knowledge** — only common plumbing. |
| `handlers/planner-read-port.ts` | INT2 — the **read-only delegation surface** to the Planner owner (storage + household). 1:1 forwards, no business logic; injectable for tests. |
| `handlers/planner-read-handler.ts` | INT2 — the **first execution handler**. Read-only (`read`/`explain` only); delegates every read to the owner; enforces own-data access; returns honest gaps. Uses the Read Binding Kit for shared infrastructure. |
| `bindings/planner.ts` | INT2 — binds the Planner handler to the `planner` capability (`registered` → `available`). Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/shopping-read-port.ts` | INT3 — the **read-only delegation surface** to the Shopping owner (storage). 1:1 forwards, household-scoped by the owner; injectable for tests. |
| `handlers/shopping-read-handler.ts` | INT3 — the **second execution handler**. Read-only (`read`/`explain` only); delegates every read to the Shopping owner; surfaces only stored prices/matches (never fabricated); honest gaps. Uses the Read Binding Kit for shared infrastructure. |
| `bindings/shopping.ts` | INT3 — binds the Shopping handler to the `shopping` capability (`registered` → `available`), reusing the INT2 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/nutrition-knowledge-read-port.ts` | INT4 — the **read-only delegation surface** to the Nutrition / Knowledge owner (`nutrition-knowledge-registry.ts`). 1:1 forwards to display-safe, source-gated helpers; injectable for tests. |
| `handlers/nutrition-knowledge-read-handler.ts` | INT4 — the **third execution handler**. Read-only (`read`/`explain`/`search`); delegates every read to the source-gated owner; never authors a fact or benefit; honest gaps. Uses `gap` from the Read Binding Kit. |
| `bindings/nutrition-knowledge.ts` | INT4 — binds the Nutrition / Knowledge handler to the `nutrition-knowledge` capability (`registered` → `available`), reusing the INT2/INT3 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/pantry-read-port.ts` | INT8 — the **read-only delegation surface** to the Pantry owner (`storage.ts`). 1:1 forwards to `getPantryItems` (household-scoped) and `getPantryIngredientKnowledge` (static knowledge); injectable for tests. |
| `handlers/pantry-read-handler.ts` | INT8 — the **fourth execution handler**. Read-only (`read`/`explain` only); delegates every read to the Pantry owner; enforces own-data access (household-scoped list + ownership gate on explain); honest gaps for unknown ingredients, unstored knowledge, and all write/search/recommend verbs. Uses the Read Binding Kit. |
| `bindings/pantry.ts` | INT8 — binds the Pantry handler to the `pantry` capability (`registered` → `available`), reusing the INT2–INT4 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/diary-read-port.ts` | INT10 — the **read-only delegation surface** to the Diary owner (`storage.ts`). 1:1 forwards to `getFoodDiaryDay`, `getFoodDiaryEntries`, and `getFoodDiaryMetrics` (all user-scoped); injectable for tests. |
| `handlers/diary-read-handler.ts` | INT10 — the **fifth execution handler**. Read-only (`read`/`explain` only); delegates every read to the Diary owner; enforces own-data access (user-scoped by owner getters); honest gaps for no diary day, no stored metrics, missing date param, and all write/import verbs. Uses the Read Binding Kit. |
| `bindings/diary.ts` | INT10 — binds the Diary handler to the `diary` capability (`registered` → `available`), reusing the INT2–INT8 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/profile-read-port.ts` | INT12 — the **read-only delegation surface** to the Profile owner (`storage.ts`). 1:1 forwards to `getUser` and `getUserPreferences` (both user-scoped); injectable for tests. |
| `handlers/profile-read-handler.ts` | INT12 — the **sixth execution handler**. Read-only (`read` only); delegates every read to the Profile owner; projects an EXPLICIT field allowlist (never the raw `users` row — `password`/token fields are never forwarded); enforces own-data access (no id parameter — always the caller's own row); honest gaps for an unsupported scope and for `explain`/`add`. Uses the Read Binding Kit. |
| `bindings/profile.ts` | INT12 — binds the Profile handler to the `profile` capability (`registered` → `available`), reusing the INT2–INT10 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/household-read-port.ts` | INT13 — the **read-only delegation surface** to the Household owner (`storage.ts` + `lib/household.ts`). 1:1 forwards to `getHouseholdForUser`, `getHouseholdWithMembers`, `getHouseholdDietaryContext`, `getHouseholdEaters`, and `getUser` (the last used only to enrich adult eater rows); injectable for tests. |
| `handlers/household-read-handler.ts` | INT13 — the **seventh execution handler**. Read-only (`read` only); delegates every read to the Household owner; projects an EXPLICIT result that never includes `inviteCode` (a join secret — resolved Capability Card open decision); enforces own-data access (no id parameter — household always resolved server-side from the caller's own membership); honest gaps for no household membership, missing/unsupported scope, and `explain`/`add`/`delete`. Uses the Read Binding Kit. |
| `bindings/household.ts` | INT13 — binds the Household handler to the `household` capability (`registered` → `available`), reusing the INT2–INT12 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/partners-read-port.ts` | INT14 — the **read-only delegation surface** to the Partners owner (`lib/supermarket-basket-service.ts`). 1:1 forward of `getBasketSupermarkets()`, the static 9-retailer list; injectable for tests. |
| `handlers/partners-read-handler.ts` | INT14 — the **eighth execution handler**. Read-only (`read` only, single scope `"retailers"`); delegates to the Partners owner; never synthesizes a per-store price, comparison, or recommendation; honest gaps for `explain`/`recommend`/`compare` (no safe, grounded owner per the Capability Card) and for any unsupported scope. Uses the Read Binding Kit. |
| `bindings/partners.ts` | INT14 — binds the Partners handler to the `partners` capability (`registered` → `available`), reusing the INT2–INT13 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/meals-read-port.ts` | INT15 — the **read-only delegation surface** to the Meals owner (`storage.ts`). 1:1 forwards to `getMeals`, `getSystemMeals`, `getMealsSummary`, `getSystemMealsSummary`, `getMeal`, and `getMealItems`; injectable for tests. `lookupMeals` (search) is deliberately NOT exposed — unresolved ownership-scoping open decision. |
| `handlers/meals-read-handler.ts` | INT15 — the **ninth execution handler**. Read-only (`read` only, scopes `"list"`/`"summary"`/`"detail"`); delegates every read to the Meals owner; for `"detail"` REPLICATES the existing route's ownership check (`storage.getMeal`/`getMealItems` have no ownership filter at the storage layer) so a missing meal and another user's private meal return the identical denial, never leaking existence; never reads or surfaces nutrition (a separate table, out of scope); honest gaps for `explain`/`search`/`recommend` (no safe, grounded owner) and any unsupported scope. Uses the Read Binding Kit. |
| `bindings/meals.ts` | INT15 — binds the Meals handler to the `meals` capability (`registered` → `available`), reusing the INT2–INT14 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/templates-read-port.ts` | INT16 — the **read-only delegation surface** to the Templates owner (`storage.ts`). 1:1 forwards to `getMealTemplates`, `getMealTemplate`, `getPublishedGlobalTemplates`, `getUserPrivateTemplates`, `getTemplateWithItems`, and `getDefaultTemplate`; injectable for tests. |
| `handlers/templates-read-handler.ts` | INT16 — the **tenth execution handler**. Read-only (`read` only, scopes `"meal-templates"`/`"meal-template"`/`"plan-templates"`/`"plan-templates-mine"`/`"plan-templates-default"`/`"plan-template"`); delegates every read to the Templates owner; resolves tier server-side from `context.premium` (never a request parameter, mirroring `server/routes.ts:7193`); for `"plan-template"` REPLICATES a STRICTER gate than the existing route (published-global, own, or admin only — the Card's CRITICAL FINDING is that the live route has no gate at all); never surfaces `shareToken`; honest gaps for `explain`/`search`/`recommend` (no safe, grounded owner) and any unsupported scope. Uses the Read Binding Kit. |
| `bindings/templates.ts` | INT16 — binds the Templates handler to the `templates` capability (`registered` → `available`), reusing the INT2–INT15 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `handlers/analyser-read-port.ts` | INT17 — the **read-only delegation surface** to the Analyser owner (`storage.ts`). 1:1 forward of `getAllAdditives()`, the static additives reference table; injectable for tests. |
| `handlers/analyser-read-handler.ts` | INT17 — the **eleventh execution handler**. Read-only (`read` only, single scope `"additives"`); delegates to the Analyser owner; never synthesizes a UPF classification, health score, or NOVA group (no stored owner exists for any of those — only pure computation or a live, unstored OpenFoodFacts recompute); honest gaps for `explain`/`analyse`/`report` (no safe, grounded stored-read owner) and for any unsupported scope. Uses the Read Binding Kit. |
| `bindings/analyser.ts` | INT17 — binds the Analyser handler to the `analyser` capability (`registered` → `available`), reusing the INT2–INT16 pattern. Accepts an optional `resolvePort` parameter for test injection (INT6B). |
| `index.ts` | The single import surface. |

## What it must never own

Business logic · business data · planner / shopping / nutrition / profile logic · conversation / memory / history. The platform **routes to** the existing owners; they remain the source of truth (Principles 2 & 7).

## Architecture

```
            interpreted typed Intent + IntelligenceContext (server-resolved role)
                                   │
                    ┌──────────────▼───────────────┐
                    │     IntelligencePlatform      │  canonical entry point
                    │  (capability lookup · route)  │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────▼────────────────────┐
              │              IntentEngine                │  orchestration only
              │  LOCATE → VALIDATE → PERMISSION →        │
              │  CONFIRM → INVOKE → RESPOND              │
              └───┬───────────────┬──────────────┬───────┘
                  │ lookup        │ permission   │ invoke (future)
        ┌─────────▼──────┐ ┌──────▼───────┐ ┌────▼──────────────────────────┐
        │ CapabilityReg. │ │ Permissions  │ │ CapabilityHandler             │
        │ (C1..C13)      │ │ (access.ts)  │ │ planner read-only (INT2)      │
        │                │ │              │ │ shopping read-only (INT3)     │
        │                │ │              │ │ nutrition/knowledge RO (INT4) │
        │                │ │              │ │ pantry read-only (INT8)       │
        │                │ │              │ │ diary read-only (INT10)       │
        │                │ │              │ │ profile read-only (INT12)     │
        │                │ │              │ │ household read-only (INT13)   │
        │                │ │              │ │ partners read-only (INT14)    │
        │                │ │              │ │ meals read-only (INT15)       │
        │                │ │              │ │ templates read-only (INT16)   │
        │                │ │              │ │ analyser read-only (INT17)    │
        └────────────────┘ └──────────────┘ └────┬──────────────────────────┘
                                                  │ delegates (read-only) via Planner/Shopping/Knowledge/Pantry/Diary/Profile/Household/Partners/Meals/Templates/Analyser ReadPort
                                   ┌──────────────▼───────────────┐
                                   │   EXISTING THA SERVICES       │
                                   │ planner owner: storage +      │
                                   │ household; shopping owner:    │
                                   │ storage; nutrition/knowledge  │
                                   │ owner: knowledge registry;    │
                                   │ pantry owner: storage;        │
                                   │ diary owner: storage;         │
                                   │ profile owner: storage;       │
                                   │ household owner: storage +    │
                                   │ lib/household.ts; partners    │
                                   │ owner: lib/supermarket-       │
                                   │ basket-service.ts; meals,     │
                                   │ templates, analyser owner:    │
                                   │ storage.ts — unchanged SoT    │
                                   └───────────────────────────────┘
```

## State

**INT1 foundation** (unchanged):
- Capabilities default to **`registered`** (metadata). Invoking an unbound one returns honest **`not_executable`** — never a fabricated result (Principle 6).
- Honest **gaps** (e.g. "order shopping") return `gap`, not an invented owner (TIP2 §2.4).
- The developer capability is **`never`** in this user-facing plane (TIP1 §7 physical isolation).

**INT2 — first live capability (read-only Planner):**
- The `planner` capability is **`available`** on the canonical singleton — and it is the **only** bound capability (scope lock).
- Only **`read`** and **`explain`** execute; every write/plan/generate verb returns an honest gap. There is **no write path** in the binding.
- Access is **own-data only**: an authenticated user, scoped to their household. Anonymous and cross-household reads are **`denied`** with no existence leak.
- Honest gaps where the Planner owns no answer: **today's meals** (no calendar mapping), unknown read scope, and a meal with **no recorded selection rationale** (`explain` will not fabricate one).
- The Planner remains the sole owner of all planner data and logic — the platform only orchestrates reads to it.

**INT3 — second live capability (read-only Shopping):**
- The `shopping` capability is **`available`** on the canonical singleton, alongside the Planner. These are the **only two** live capabilities (scope lock).
- Only **`read`** and **`explain`** execute; every write verb in the shopping allow-list (`add`, `delete`, `generate`) returns an honest gap. There is **no write path** — no add item, delete item, price mutation, basket creation, ordering, or checkout.
- Read scopes: **`list`** (current shopping list + extras), **`unresolved`** (items the owner has flagged for review), **`basket`** (pricing summary from **stored** prices only). `explain` reports an item's stored shopping status.
- Access is **own-data only**: the owner getters are household-scoped by `userId`, so cross-user access is structurally impossible. Anonymous → `denied`; a foreign item id → `denied` with no existence leak.
- **THA trust rules preserved:** never fabricates a price or a product match (only stored values are surfaced); unresolved items stay unresolved; low-confidence matches stay reviewable; no silent generic-supermarket fallback. No stored prices → honest gap, never a £0 basket.
- The Shopping service remains the sole owner of all shopping data and logic — the platform only orchestrates reads to it.

**INT4 — third live capability (read-only Nutrition / Knowledge):**
- The `nutrition-knowledge` capability is **`available`** on the canonical singleton, alongside the Planner and Shopping. These are read-only bindings (scope lock updated by INT8 to four).
- Executes **`read`**, **`explain`** and **`search`**. The other allow-listed verbs (`analyse`, `compare`, `report`) have **no safe grounded owner read** in this binding's scope, so they return honest gaps — the platform never fabricates an analysis, a comparison judgement, or a user-specific report.
- Read scopes: **`food`** / **`nutrient`** / **`benefit`** (each by `slug`), **`categories`**, **`foods`** (optional `category`). `search` runs the owner's unified search; `explain` surfaces a food's source-gated benefit wording.
- Access is **public general knowledge**, mirroring the owner's existing access rules (`/api/knowledge/*` is unauthenticated). The platform's capability gate (role ≥ user, public class) still applies. There is no user-specific surface; user-specific / diary-linked summaries (e.g. nutrition centre) are out of scope and return an honest gap.
- **THA trust rules preserved:** never authors a nutrition fact or health benefit; surfaces only the owner's source-gated, display-safe output (internal evidence/confidence signals never leak); an unlinked (food, benefit) → honest gap, never a fabricated claim; unknown slug / empty search → honest gap.
- The Nutrition / Knowledge service remains the sole owner of all nutrition facts, health knowledge and source references — the platform only orchestrates reads to it.

**INT8 — fourth live capability (read-only Pantry):**
- The `pantry` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping and Nutrition / Knowledge. These are the **only four** live capabilities, all read-only bindings (scope lock updated by INT10 to five).
- Executes **`read`** and **`explain`** only. The other allow-listed verbs (`add`, `delete`, `search`, `recommend`) have no live code path in this read-only binding and return honest gaps.
- Read scope: **`list`** returns the caller's household pantry items (non-deleted, owner-sorted). `explain` returns the owner's stored ingredient knowledge for an item in the caller's pantry.
- Access is **own-data only**: `getPantryItems` is household-scoped by the owner from `userId`. The `explain` verb additionally confirms the requested `ingredientKey` appears in the caller's own pantry before surfacing knowledge — cross-household reads are structurally impossible. Anonymous → `denied`; foreign ingredientKey → `denied` with no existence leak.
- **THA trust rules preserved:** never fabricates ingredient descriptions, dietary claims, storage guidance, or highlights; surfaces only what the owner has stored in `pantry_ingredient_knowledge`. An ingredient with no stored knowledge returns an honest gap.
- The Pantry service remains the sole owner of all pantry data and ingredient knowledge — the platform only orchestrates reads to it.

**INT10 — fifth live capability (read-only Diary):**
- The `diary` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping, Nutrition / Knowledge and Pantry. These were the **only five** live capabilities at the time (scope lock updated by INT12 to six).
- Executes **`read`** and **`explain`** only. The other allow-listed verbs (`add`, `delete`, `import`) have no live code path in this read-only binding and return honest gaps.
- Read scope: **`day`** (via `{ scope: "day", date: "YYYY-MM-DD" }`) returns the day header (notes, date) plus all logged diary entries for that date. `explain` (via `{ date: "YYYY-MM-DD" }`) returns the owner's stored wellness metrics (weight, BMI, mood, sleep, energy, stuckToPlan) for that date.
- Access is **own-data only**: all owner methods are user-scoped by `userId`; cross-user reads are structurally impossible. Anonymous → `denied`. A date with no logged diary day → honest `gap`; a date with no stored wellness metrics → honest `gap`.
- **THA trust rules preserved:** never fabricates diary entries, nutritional values, weight, mood, sleep, or energy values. All data is surfaced exactly as the Diary owner stored it; internal fields (`userId`, `dayId`, `id`) are projected out. The `source` field is always present in results (`"food-diary"` / `"food-diary-metrics"`).
- The Diary service (storage) remains the sole owner of all diary data and wellness metrics — the platform only orchestrates reads to it.

**INT12 — sixth live capability (read-only Profile):**
- The `profile` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping, Nutrition / Knowledge, Pantry and Diary. These are the **only six** live capabilities, all read-only bindings (scope lock).
- Executes **`read`** only. `explain` (no stored rationale for any profile field) and `add` (a write) both have no live code path in this read-only binding and return honest gaps.
- Read scope: a single combined result — the caller's own `profile` (an EXPLICIT field allowlist of the `users` row, mirroring `buildProfileResponse` in `server/routes.ts`) plus `preferences` (every substantive `user_preferences` column, or `null` when the caller has not saved preferences yet). There is no id parameter; the binding only ever reads the server-resolved caller's own row.
- Access is **own-data only**, structurally: every method is keyed by the caller's own `userId`; there is no parameter through which another user's id could be requested. Anonymous → `denied`. No stored `users` row for the resolved id → honest `gap` (should not happen for an authenticated session, but never fabricated).
- **THA trust rules preserved:** `password`, `emailVerificationToken`, `emailVerificationExpires`, `passwordResetToken`, and `passwordResetExpires` are never surfaced — the handler projects an explicit allowlist, never the raw `storage.getUser()` row. No preferences row → `preferences: null`, never a fabricated default. Household eater dietary overrides are explicitly out of scope (honest gap pointing at the Household capability), never pulled into a profile read.
- The Profile service (storage) remains the sole owner of all profile data and preferences — the platform only orchestrates reads to it.

**INT13 — seventh live capability (read-only Household):**
- The `household` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping, Nutrition / Knowledge, Pantry, Diary and Profile. These are the **only seven** live capabilities, all read-only bindings (scope lock).
- Executes **`read`** only. `explain` (no stored rationale on membership/eater records) and `add`/`delete` (writes — household creation, member invite/removal, eater create/update remain owned by the Household service) all have no live code path in this read-only binding and return honest gaps.
- Read scopes: **`household`** (id, name, the caller's own `myRole`, active members), **`dietary-context`** (the owner's aggregated diet types/restrictions/exclusions across active members, surfaced unmodified), **`eaters`** (`household_eaters` rows; adult rows, i.e. `userId != null`, are enriched at read time from `users.dietPattern`/`users.dietRestrictions`, mirroring `server/routes.ts:8526–8541` — child rows are returned unchanged).
- Access is **own-data only**, structurally: every method is keyed by the caller's own `userId`, with the household always resolved server-side via `getHouseholdForUser(userId)` — there is no id parameter through which another household could be requested. Anonymous → `denied`. A caller with no active household membership → honest `gap` (the owner throws; the handler translates this into a gap, never a fabricated empty household, never `denied`).
- **THA trust rules preserved:** `inviteCode` (a join secret the human `/api/household` route returns) is never surfaced — this AI-facing projection deliberately excludes it, resolving the canonical Capability Card's documented open decision. No dietary restriction or diet type is ever fabricated — an adult eater with no stored `dietPattern` projects an empty `defaultDietTypes`, never invented.
- The Household service (storage + `lib/household.ts`) remains the sole owner of all household, membership and eater data — the platform only orchestrates reads to it.

**INT14 — eighth live capability (read-only Partners):**
- The `partners` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping, Nutrition / Knowledge, Pantry, Diary, Profile and Household. These are the **only eight** live capabilities, all read-only bindings (scope lock).
- Executes **`read`** only, and only for a single scope: **`retailers`**. `explain`, `recommend`, and `compare` all have no live code path — the canonical Capability Card (`docs/architecture/capabilities/partners.md`) found no safe, grounded owner for any of them: per-store price comparison would require either a stored price table (none exists) or presenting a live external fetch run through hardcoded variance/tier multipliers as fact, which would be a fabrication.
- Read scope: **`retailers`** — the static list of supported UK retailers (`name`, `key`, `color`, `hasDirectBasket`) from `getBasketSupermarkets()`, surfaced unmodified. `/api/routing` and `/api/savings/*` (named in the registry's `apiSurface` but unrelated to retailers, per the Card) and `verifyStoreAvailability()` (an unimplemented stub) are explicitly out of scope.
- Access: the retailer list is not user-owned (no ownership scoping applies or is needed), but the live human route (`/api/basket/supermarkets-enhanced`) still requires `req.isAuthenticated()` — this handler mirrors that gate. Anonymous → `denied`.
- **THA trust rules preserved:** no per-store price, price comparison, or store recommendation is ever surfaced — the only live result shape (`retailers`) carries no such field. `verifyStoreAvailability()` (a stub) is never called or implied.
- The Partners service (`lib/supermarket-basket-service.ts`) remains the sole owner of the retailer list — the platform only orchestrates reads to it.

**INT15 — ninth live capability (read-only Meals):**
- The `meals` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping, Nutrition / Knowledge, Pantry, Diary, Profile, Household and Partners. These are the **only nine** live capabilities, all read-only bindings (scope lock).
- Executes **`read`** only, for scopes **`list`**, **`summary`**, and **`detail`**. `explain` (no stored rationale on a meal), `search` (the owner's `lookupMeals` has zero ownership scoping — an unresolved open decision the Card flags as unsafe to bind as-is), `recommend` (the live route ranks meals inline at the route layer, not via a delegate-only owner method), and every write verb all have no live code path.
- Read scopes: **`list`** (the caller's own meals + system meals, full rows, merged exactly as `/api/meals` does), **`summary`** (the same, using the owner's own lighter `MealSummary` projection — `ingredientCount` instead of raw ingredients/instructions), **`detail`** (a single meal + its typed `meal_items`, requires `{ mealId }`).
- Access: list/summary are user-scoped by the owner from the caller's `userId`. **`detail` REPLICATES the existing route's ownership check** (`meal.userId !== callerId && !meal.isSystemMeal` → denied) because `storage.getMeal`/`storage.getMealItems` have no ownership filter at the storage layer (a documented, narrow exception to "owner remains owner" — an auth gate, not business logic). A nonexistent meal id and another user's private meal id produce the IDENTICAL denial message — no existence leak. Anonymous → `denied`.
- **THA trust rules preserved:** nutrition is a separate table joined by `mealId` and is outside this capability's allowed scopes/port methods entirely — the handler never reads it, so it can never fabricate or estimate a nutritional value. No ingredient quantity is ever invented — only stored fields are surfaced.
- The Meals service (storage) remains the sole owner of all meal and recipe data — the platform only orchestrates reads to it.

**INT16 — tenth live capability (read-only Templates):**
- The `templates` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping, Nutrition / Knowledge, Pantry, Diary, Profile, Household, Partners and Meals. These are the **only ten** live capabilities, all read-only bindings (scope lock).
- Executes **`read`** only, for six scopes. **`explain`** (no stored rationale), **`search`** (no search-by-name/tag method exists anywhere in `storage.ts`), **`recommend`**, and every write verb (`generate`/`add`/`import`/`delete`/`share`) all have no live code path.
- Two distinct entities are exposed, never conflated: **`meal_templates`** (shell/component templates for the personal-plate composer — a small, fully PUBLIC reference table with no ownership column at all) via scopes **`meal-templates`** (list) and **`meal-template`** (detail by `mealTemplateId`); and **`meal_plan_templates`** (full weekly plan templates — own-data + published-global) via scopes **`plan-templates`** (the caller's library: published-global + own private, auth required), **`plan-templates-mine`** (own private only, auth required), **`plan-templates-default`** (the single `isDefault` template, public), and **`plan-template`** (a single template + its items by `planTemplateId`, public route but content-gated).
- Access: `meal-templates`/`meal-template`/`plan-templates-default` are public (mirroring `server/routes.ts:5378-5396` and `:7508-7519`, neither of which checks `isAuthenticated()`). `plan-templates`/`plan-templates-mine` hard-require auth (mirroring the live routes' 401). `plan-template` is **STRICTER than the existing route**: `GET /api/plan-templates/:id` (`server/routes.ts:7522`) has no owner/published/admin check at all — this binding only returns a template that is published-and-global, owned by the caller, or requested by an admin (`context.role === "admin"`).
- **Tier is server-resolved, never client-supplied:** the live `/api/plan-templates/library` route derives `tier` from `hasPremiumAccess(user)` server-side (`server/routes.ts:7193`); this handler mirrors that exactly via `context.premium` — a `tier` intent parameter, if supplied, is silently ignored, closing off a privilege-escalation path this binding does not introduce.
- **THA trust rules preserved:** `shareToken` (a plan-template join secret, the sharing-link equivalent of Household's `inviteCode` — INT13 precedent) is never surfaced in any result shape. No template field is ever fabricated — only stored fields are projected.
- The Templates service (storage) remains the sole owner of all template and plan-template data — the platform only orchestrates reads to it.

**INT17 — eleventh live capability (read-only Analyser):**
- The `analyser` capability is **`available`** on the canonical singleton, alongside the Planner, Shopping, Nutrition / Knowledge, Pantry, Diary, Profile, Household, Partners, Meals and Templates. These are the **only eleven** live capabilities, all read-only bindings (scope lock).
- Executes **`read`** only, and only for a single scope: **`additives`**. `explain`, `analyse`, and `report` all have no live code path — the canonical Capability Card (`docs/architecture/capabilities/analyser.md`) found no safe, grounded STORED-read owner for any of them: `product-analysis.ts`/`upf-analysis-service.ts` are pure computation over caller-supplied text/nutriments, and barcode lookup live-fetches OpenFoodFacts and recomputes analysis fresh on every call — neither is a stored read, and no `product_analysis` table exists in `shared/schema.ts`.
- Read scope: **`additives`** — the static additives reference table (`id`, `name`, `type`, `riskLevel`, `description`, `isRegulatory`, `aliases`) from `storage.getAllAdditives()`, surfaced unmodified. `/api/scan` (named in the registry's `apiSurface` but actually recipe/shopping-list/planner OCR extraction, per the Card) is explicitly out of scope.
- Access: the additives table is not user-owned (no ownership scoping applies or is needed), but all three live routes named in the registry's apiSurface (additives/barcode/scan) require `req.isAuthenticated()` — this handler mirrors that gate. Anonymous → `denied`.
- **THA trust rules preserved:** no UPF classification, health score, or NOVA group is ever surfaced — the only live result shape (`additives`) carries no such field; any such value can only come from a live recompute, which is explicitly not in the executable scope. Additives are surfaced as-is from the reference table.
- The Analyser service (storage) remains the sole owner of the additives reference table — the platform only orchestrates reads to it.

## Usage (internal only — no HTTP/UI surface)

```ts
import { intelligencePlatform } from "server/intelligence";

const ctx = intelligencePlatform.contextFor(req.user);          // resolve role via access.ts
const outcome = await intelligencePlatform.handle(              // route a typed intent
  { verb: "read", capabilityId: "planner", parameters: { scope: "week", weekNumber: 1 } },
  ctx,
);
// INT2: outcome.status === "ok" (delegated to the Planner owner) for an owned week;
//       "denied" for someone else's week; "gap" for { scope: "today" }.
```

## Extending (future workstreams — INT5+)

A future workstream makes another capability executable by binding **one** handler that delegates to the owning service — and holds no business logic itself. The read-only Planner (INT2), Shopping (INT3) and Nutrition / Knowledge (INT4) bindings in `handlers/` + `bindings/` are the proven reference pattern: a narrow read-only **Port** (1:1 forwards to the owner), a **Handler** that projects stored data and returns honest gaps, and a one-line **Binding** onto the singleton:

```ts
intelligencePlatform.registerHandler("pantry", async (intent, ctx) => {
  // call the EXISTING owning service here; never re-implement its business logic
});
```

Adding a brand-new capability is `registry.register(...)` — no architectural change required.

## Read Binding Kit

All read-only handlers share one infrastructure module: `handlers/_read-kit.ts`. It contains:

| Export | Purpose |
|---|---|
| `toInt(value)` | Coerce an intent parameter to a positive integer; `undefined` if absent or non-integer string. |
| `requireUserId(context, capabilityName)` | Throw `denied` when the server-resolved context has no authenticated user id. |
| `gap(message)` | Construct a `CapabilityExecutionError("gap", message)` — no answer for this request. |
| `denied(message)` | Construct a `CapabilityExecutionError("denied", message)` — ownership or auth check failed. |
| `readOnlyVerbGuard(intent, executableVerbs, capabilityName)` | Throw `gap` for any verb not in the executable list; passes the verb back on the error. |

**Rule:** if a utility touches a domain concept (planner, shopping, nutrition…) it does **not** belong here. Capability-specific per-verb gap messages (e.g. why `analyse` is a gap for nutrition-knowledge), ownership resolution, read projections, and stored-state predicates all remain explicit inside their handler.

## Tests

- `npm run test:intelligence-platform` — INT1: discovery, the pipeline, permission gates, confirmation tiers, honest gaps, foundation `not_executable`.
- `npm run test:intelligence-planner-binding` — INT2: capability lookup, permission validation (auth + cross-household), handler invocation, planner delegation, read scopes, unsupported-intent handling, read-only enforcement, and honest-gap behaviour (injected in-memory owner — no DB needed).
- `npm run test:intelligence-shopping-binding` — INT3: capability lookup (planner + shopping remain live), permission validation (auth + own-data only), shopping-owner delegation, read scopes (list/unresolved/basket), explain-status, unsupported-intent handling, read-only enforcement (no write/order path), and the THA trust rules — no fabricated price/product, unresolved stays unresolved (injected in-memory owner — no DB needed).
- `npm run test:intelligence-nutrition-knowledge-binding` — INT4: capability lookup (three live capabilities, all read-only), permission validation (public general knowledge), knowledge-owner delegation, read scopes (food/nutrient/benefit/categories/foods), search, source-gated explanation, unknown-slug handling, no fabricated benefits (unlinked → gap), unsupported-intent + honest-gap behaviour (analyse/compare/report), and no write path (injected in-memory owner — no DB needed).
- `npm run test:intelligence-registry-executability` — INT6A: executableIntents accuracy, `isExecutable` / `listExecutable` / `canExecute`, bind-time metadata, singleton correctness.
- `npm run test:intelligence-read-kit` — INT6B: shared kit — `toInt` coercion, `requireUserId` auth guard, `gap`/`denied` constructors, `readOnlyVerbGuard` enforcement.
- `npm run test:intelligence-pantry-binding` — INT8: capability lookup (five live capabilities), permission validation (auth + own-data only), pantry-owner delegation, read list scope, explain (ownership gate + stored knowledge), unknown ingredientKey, unstored knowledge gap, unsupported-intent + honest-gap behaviour (add/delete/search/recommend), and no write path (injected in-memory owner — no DB needed).
- `npm run test:intelligence-diary-binding` — INT10: capability lookup (five live capabilities), permission validation (auth + own-data only), diary-owner delegation, read "day" scope (day header + entries), explain (stored wellness metrics), no diary day → gap, no stored metrics → gap, missing date param → gap, unsupported-intent + honest-gap behaviour (add/delete/import), and no write path (injected in-memory owner — no DB needed).
- `npm run test:intelligence-profile-binding` — INT12: capability lookup (six live capabilities at the time), permission validation (auth-only, no cross-user code path), profile-owner delegation (`getUser` + `getUserPreferences`), no stored preferences row → `null` (never a fabricated default), unsupported-scope gap (incl. household-eaters redirect), unsupported-intent + honest-gap behaviour (explain/add), and the THA trust rule that `password`/token/internal fields are never surfaced (injected in-memory owner — no DB needed).
- `npm run test:intelligence-household-binding` — INT13: capability lookup (seven live capabilities), permission validation (auth-only) and no-household-membership → honest gap (never denied, never fabricated), read scopes (household/dietary-context/eaters), adult-eater enrichment from the caller's own profile (children unchanged), missing/unsupported-scope gap, unsupported-intent handling, read-only enforcement (explain/add/delete never execute), and the THA trust rule that `inviteCode` is never surfaced (injected in-memory owner — no DB needed).
- `npm run test:intelligence-partners-binding` — INT14: capability lookup (eight live capabilities), permission validation (auth-only, mirroring the live route's `req.isAuthenticated()` gate), partners-owner delegation (`getBasketSupermarkets`), the single "retailers" read scope, missing/unsupported-scope gap, unsupported-intent handling, read-only + single-scope enforcement (explain/recommend/compare never execute, none require confirmation), and the THA trust rule that no price/comparison/recommendation is ever fabricated (injected in-memory owner — no live import needed).
- `npm run test:intelligence-meals-binding` — INT15: capability lookup (nine live capabilities), permission validation (auth-only), meals-owner delegation (`getMeals`/`getSystemMeals`/`getMealsSummary`/`getSystemMealsSummary`/`getMeal`/`getMealItems`), read scopes (list/summary/detail), detail ownership enforcement (own meal ok, system meal ok, another user's private meal → denied with the identical message as a nonexistent id — no existence leak), missing/unsupported scope, missing `mealId`, unsupported-intent handling, read-only enforcement (explain/search/recommend never execute), and the THA trust rule that nutrition is never surfaced (injected in-memory owner — no DB needed).
- `npm run test:intelligence-templates-binding` — INT16: capability lookup (ten live capabilities), permission validation (public scopes allow anonymous; own-data scopes deny anonymous), templates-owner delegation (`getMealTemplates`/`getMealTemplate`/`getPublishedGlobalTemplates`/`getUserPrivateTemplates`/`getTemplateWithItems`/`getDefaultTemplate`), all six read scopes, tier resolved from `context.premium` and a spoofed `tier` parameter proven to be ignored, the plan-template detail gate (published-global ok, own draft ok, foreign draft denied, admin override ok, unknown id → gap not denied), missing/unsupported scope, unsupported-intent handling, read-only enforcement (explain/search/recommend never execute), and the THA trust rule that `shareToken` is never surfaced (injected in-memory owner — no DB needed).
- `npm run test:intelligence-analyser-binding` — INT17: capability lookup (eleven live capabilities), permission validation (auth-only, mirroring the live routes' `req.isAuthenticated()` gate), analyser-owner delegation (`getAllAdditives`), the single "additives" read scope, missing/unsupported-scope gap, unsupported-intent handling, read-only + single-scope enforcement (explain/analyse/report never execute, none require confirmation), and the THA trust rule that no UPF classification/health score/NOVA group is ever fabricated (injected in-memory owner — no live import needed).
