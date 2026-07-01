# INT26 — Canonical Meal Discovery Capability: Design Investigation

**Date:** 2026-07-01  
**Status:** Investigation complete. No implementation performed.  
**Scope:** Design only — ownership, sources, result contract, capability registration, extensibility.

---

## 1. Problem Statement

The `meals` capability (INT15/INT25) provides personal-library search across two scoped
data sources: `getMeals(userId)` and `getSystemMeals()`. INT25C confirmed that this is
the first failing layer for all recipe discovery queries ("find me a chicken curry
recipe") — the personal library is empty for typical users and system meals carry no
recipe content. The platform has no path to external recipe sources, meal templates, or
future AI/partner sources.

The requirement is a single capability that unifies all discovery sources — today and
in future — while keeping the conversation layer and intent engine completely unaware
of which sources are queried.

---

## 2. Core Design Principle

> **Meal Discovery is not Meal Management.**

The existing `meals` capability is a **personal cookbook reader**: list your meals,
read a specific meal, search within what you've already saved. It is user-scoped by
construction and bounded to two storage methods.

**Meal Discovery** is a **cross-source research operation**: given a query, fan out to
every enabled source, merge, deduplicate, and return a unified answer. The caller does
not know — and must not need to know — whether the answer came from the personal
library, a THA-curated recipe, a meal template blueprint, or TheMealDB.

This distinction mandates a **new capability**, not an extension of `meals`.

---

## 3. Canonical Ownership

### Who owns Meal Discovery?

No single existing service owns the discovery operation. It spans:

| Source | Current owner |
|---|---|
| Personal library | `storage.getMeals(userId)` |
| THA system meals | `storage.getSystemMeals()` |
| Meal templates | `storage.getMealTemplates()` |
| External recipe APIs | `server/lib/external-meal-service.ts` |
| Future AI meals | (none yet) |
| Future partner sources | (none yet) |

The canonical owner of the **discovery operation** is a new **`MealDiscoveryService`**
(`server/intelligence/services/meal-discovery-service.ts`). It does not own any
data — each data source retains ownership of its own rows. The service owns:

1. The **source registry** (which sources are enabled and in what order).
2. The **fan-out coordination** (parallel queries to all enabled sources).
3. **Deduplication** (a personal meal imported from TheMealDB must appear once, flagged
   `isAlreadySaved: true`, not twice from two sources).
4. **Result capping and ranking** (top N results per source, overall cap).
5. **Timeout policy** (external sources are given a bounded window; slow APIs degrade
   gracefully to partial results, never blocking the response).

The Intelligence Platform capability handler delegates entirely to this service through
a narrow port. No fan-out, deduplication, or source logic lives in the handler.

---

## 4. Capability Registration

### New capability: `meal-discovery`

```
Capability ID:      meal-discovery
Display name:       Meal Discovery
Description:        Cross-source recipe and meal discovery. Given a search query,
                    searches personal cookbook, THA library, meal templates, and
                    enabled external recipe sources, returning a unified ranked result.
Owner:              MealDiscoveryService
                    (server/intelligence/services/meal-discovery-service.ts)
Owner scopes:       Personal library  → storage.getMeals(userId)
                    System / THA      → storage.getSystemMeals()
                    Templates         → storage.getMealTemplates()
                    External APIs     → external-meal-service.ts sources
                    (future AI / partner sources added without handler changes)
API surface:        Platform-internal only. No dedicated HTTP route. Callable only
                    via intelligencePlatform.handle().
Supported intents:  search, recommend
Executable intents: search  (recommend is registered but a gap until ranking logic
                    is owned by a single, delegate-only method in MealDiscoveryService)
Permissions:        minimumRole: "user"
                    knowledgeClass: "public"
                    ownershipScoped: true  (personal-library results scoped to caller)
                    audited: false
capabilityClass:    "read"
aiAccess:           "R"
```

This entry is added to `SEED_CAPABILITIES` in `server/intelligence/capability-registry.ts`.

### Relationship to `meals` and `templates`

Both existing capabilities are **unchanged**.

| Capability | Verb | Retained | Role |
|---|---|---|---|
| `meals` | `read` (list/summary/detail) | Yes | Personal cookbook: list, browse, read your saved meals |
| `meals` | `search` | Yes | "Search my saved meals for X" — bounded to personal + system only |
| `templates` | `read` | Yes | Plan template reading: list, browse, detail |
| **`meal-discovery`** | **`search`** | **New** | "Find me a recipe for X" — all sources unified |

The `meals/search` path is NOT deprecated. It remains the correct answer for explicit
personal-library queries ("do I have any pasta meals?"). `meal-discovery/search` is the
correct answer for discovery queries ("find me a recipe for X").

---

## 5. Source Inventory

### Source types and lifecycle status

```
SourceType enum:
  "personal"   — user's own saved/imported meals
  "system"     — THA-curated library (isSystemMeal=true)
  "template"   — meal template blueprints (meal_templates table)
  "external"   — live queries to external recipe APIs
  "ai"         — AI-generated meal suggestions (future)
  "partner"    — partner-curated recipe banks (future)
```

### Source registry (implementation order)

| # | Source ID | Type | Owner | Status | Notes |
|---|---|---|---|---|---|
| 1 | `personal` | personal | `storage.getMeals(userId)` | **Active — Day 1** | Always queried; ownership-scoped |
| 2 | `system` | system | `storage.getSystemMeals()` | **Active — Day 1** | Always queried; requires recipe seeding (INT25A F2a) |
| 3 | `meal-templates` | template | `storage.getMealTemplates()` | **Active — Day 1** | Match on name, cuisine, styleTags; lightweight result |
| 4 | `themealdb` | external | `external-meal-service.ts` | **Active — Day 1** | TheMealDB official API; no key required; fastest external source |
| 5 | `bbc-good-food` | external | `external-meal-service.ts` | **Active — Day 1** | Scraped; subject to `recipe_source_settings` gate |
| 6 | `allrecipes` | external | `external-meal-service.ts` | Config-gated | Scraped; same gate |
| 7 | `jamie-oliver` | external | `external-meal-service.ts` | Config-gated | Scraped; same gate |
| 8 | `edamam` | external | `external-meal-service.ts` | Credential-gated | `EDAMAM_APP_ID/KEY` required |
| 9 | `ai-suggestion` | ai | OpenAI / ILlmProvider | **Future** | Generates a meal outline when no other source matches; requires explicit `allowAI: true` parameter |
| 10 | `partner-*` | partner | Per-partner service | **Future** | Partner-curated recipe banks; per-partner enable flag |

### Source priority and ordering

Results are ranked within each source by match relevance (name-exact > name-partial >
ingredient-partial). Across sources, the ordering is:

```
personal > system > meal-templates > external (ordered by source config priority)
```

A `personal` result for the same recipe as an `external` result is deduplicated: only
the `personal` row appears, tagged `isAlreadySaved: true`. The user sees they already
have it.

---

## 6. Discovery Result Contract

### The unified result item

```typescript
/**
 * A single discovery result — source-agnostic from the caller's perspective.
 * The `sourceType` and `sourceLabel` provide attribution; the `id` is a
 * composite key that is stable within a turn but not persisted.
 */
export interface DiscoveryItem {
  /**
   * Composite stable key: "<sourceType>:<sourceId>:<externalId>"
   * Examples: "personal:42", "system:100", "template:7",
   *           "external:themealdb:12345", "ai:generated:0"
   * Used for deduplication and entity refs. NOT a database id.
   */
  readonly id: string;

  readonly name: string;
  readonly description?: string;
  readonly servings?: number;
  readonly mealFormat?: string;              // "family" | "batch" | "quick" | etc.
  readonly dietTypes: readonly string[];

  /** Source attribution — the only source information the caller ever sees. */
  readonly sourceType: "personal" | "system" | "template" | "external" | "ai" | "partner";
  readonly sourceLabel: string;              // "Your Cookbook", "THA Library", "TheMealDB"

  readonly imageUrl?: string;

  /**
   * True when the result already exists in the user's personal library.
   * Guides the LLM: "you already have this saved" vs "you can import this".
   */
  readonly isAlreadySaved: boolean;

  /**
   * True when the user can import this result into their library.
   * False for personal/system results (already in the system).
   */
  readonly importable: boolean;

  /**
   * Set for personal and system results so the LLM can produce entity refs
   * (e.g. { type: "meal", id: 42 }). Absent for external/template results.
   */
  readonly internalId?: number;

  /** Source URL if known (external results) — used in import flow. */
  readonly sourceUrl?: string;
}

/**
 * The result shape returned by the meal-discovery/search handler.
 * This is the ONLY shape the conversation gateway and LLM ever see.
 */
export interface MealDiscoverySearchResult {
  readonly scope: "discovery";
  readonly query: string;
  readonly totalCount: number;
  readonly results: readonly DiscoveryItem[];
  /**
   * Human-readable summary of which sources were queried successfully.
   * Example: "Searched your cookbook, THA library, and TheMealDB."
   * The LLM can surface this to explain the scope of the search.
   */
  readonly sourcesQueried: string;
  readonly source: "meal-discovery";
}
```

### Contract invariants (enforced by the handler, not the service)

1. `query` is always a non-empty string (gap if absent or blank).
2. `totalCount === results.length` always (no pagination in the first version).
3. `results` is capped at **15 items** (LLM context budget; matches `CAP_DATA_MAX_CHARS`
   budget established in the gateway).
4. No `nutrition` or `ingredients[]` on discovery items — nutrition is a separate table;
   full ingredients require a `meals/read/detail` call with the `internalId`.
5. `sourceType` values are closed-enum — adding a new source never adds a new `sourceType`
   value if it can be expressed as an existing type. New partner sources use `"partner"`;
   new AI sources use `"ai"`.
6. `sourcesQueried` always reflects only the sources that returned results (or were
   attempted), never all possible sources.

---

## 7. Port Interface

The handler delegates to a single, thin port. Fan-out, deduplication, and source
orchestration are entirely behind this interface — the handler does not see them.

```typescript
/**
 * MealDiscoveryPort — the narrow surface the meal-discovery handler
 * is allowed to call. One method. All source orchestration is behind it.
 *
 * Production: MealDiscoveryService implements this.
 * Tests: in-memory stub implements this (standard Port→Handler→Binding pattern).
 */
export interface MealDiscoveryPort {
  /**
   * Search across all enabled discovery sources for the given query, scoped
   * to the caller's userId. Returns merged, deduplicated, ranked results.
   * Never throws — returns an empty array on total failure (all sources failed).
   */
  discover(query: string, userId: number): Promise<DiscoveryItem[]>;
}
```

The handler is therefore:
```typescript
async function handleSearch(intent, userId, port): Promise<MealDiscoverySearchResult> {
  const query = intent.parameters?.query?.trim() ?? "";
  if (!query) throw gap("Meal discovery needs a non-empty { query } string.");
  const results = await port.discover(query, userId);
  return {
    scope: "discovery",
    query,
    totalCount: results.length,
    results: results.slice(0, DISCOVERY_MAX_RESULTS),
    sourcesQueried: buildSourcesSummary(results),
    source: "meal-discovery",
  };
}
```

Everything complex is in `MealDiscoveryService.discover()`, which the handler never
imports directly.

---

## 8. MealDiscoveryService Internal Architecture

```
MealDiscoveryService
├── SourceRegistry
│   ├── PersonalLibrarySource   (always enabled)
│   ├── SystemMealsSource       (always enabled)
│   ├── MealTemplatesSource     (always enabled)
│   ├── TheMealDBSource         (enabled by default)
│   ├── BbcGoodFoodSource       (gated by recipe_source_settings)
│   ├── AllRecipesSource        (gated by recipe_source_settings)
│   └── ... (future sources registered here, nowhere else)
│
└── discover(query, userId):
    1. Fan out in parallel to all enabled sources (Promise.allSettled — no source
       failure aborts the operation)
    2. Collect results with their sourceType and sourceLabel
    3. Deduplicate: if personal.internalId matches external.externalId → keep
       personal, flag isAlreadySaved=true
    4. Rank: personal first, then system, then templates, then external
       (within each type: name-exact > name-partial > ingredient-partial)
    5. Cap at DISCOVERY_MAX_RESULTS (15)
    6. Build sourcesQueried summary from successfully-returning sources
    7. Return DiscoveryItem[]
```

### Adding a new source

```typescript
// New source: implement DiscoverySource interface
class PartnerRecipeSource implements DiscoverySource {
  readonly id = "partner-tesco";
  readonly label = "Tesco Recipes";
  readonly sourceType = "partner" as const;

  async search(query: string, userId: number): Promise<DiscoveryItem[]> {
    // ...
  }
}

// Register in MealDiscoveryService constructor:
this.registry.register(new PartnerRecipeSource());

// That's it. No changes to:
// - handler, binding, capability card, intent resolver, conversation gateway, UI.
```

---

## 9. Conversation / Intent Engine Impact

### What changes

The intent resolver's MEALS_MATCHERS (currently routing discovery queries to
`meals/search`) must be updated to route to `meal-discovery/search`.

The specific phrases that currently route to `meals/search` after INT25B:

| Pattern | Change |
|---|---|
| "find me a chicken curry recipe" | `meals/search` → `meal-discovery/search` |
| "show me a pasta recipe" | `meals/search` → `meal-discovery/search` |
| "I want a fish pie recipe" | `meals/search` → `meal-discovery/search` |
| "what can I cook with chickpeas?" | `meals/search` → `meal-discovery/search` |
| "give me something with salmon" | `meals/search` → `meal-discovery/search` |

The original pattern "find me a recipe for X" also moves to `meal-discovery`.

Personal-library queries stay on `meals`:

| Pattern | Stays |
|---|---|
| "what meals do I have?" | `meals/read/list` (unchanged) |
| "search my meals for X" | `meals/search` (unchanged) |
| "do I have any pasta meals?" | `meals/search` (unchanged) |

### What does NOT change

- The conversation gateway — no modifications.
- The `queryCapability` function — no modifications.
- The LLM system prompt — no modifications.
- The FloatingAssistant UI — no modifications.
- All existing capabilities — no modifications.

### Invariant maintained

The conversation layer never knows that `meal-discovery/search` internally queries
TheMealDB, BBC Good Food, or any external source. It receives a `MealDiscoverySearchResult`
and grounds the LLM from it. If a new partner source is added to the service, the
conversation layer sees more results in the same shape — nothing else changes.

---

## 10. Implementation Sequence (for future INT26 implementation)

```
Phase 1 — Foundation (no external API calls)
  1. Add "meal-discovery" to SEED_CAPABILITIES (capability-registry.ts)
  2. Write MealDiscoveryPort interface (handlers/meal-discovery-port.ts)
  3. Write DiscoveryItem + MealDiscoverySearchResult types
  4. Write MealDiscoveryService with PersonalLibrarySource + SystemMealsSource +
     MealTemplatesSource only (no external yet)
  5. Write createMealsDiscoveryHandler
  6. Write bindMealDiscoveryCapability
  7. Register binding in intelligence-platform.ts
  8. Update MEALS_MATCHERS in pattern-intent-resolver.ts: discovery queries → meal-discovery
  9. Write capability card: docs/architecture/capabilities/meal-discovery.md
 10. Write tests: test-intelligence-meal-discovery-binding.ts

Phase 2 — External sources
 11. Add TheMealDBSource to MealDiscoveryService
 12. Add BbcGoodFoodSource (gated by recipe_source_settings)
 13. Update tests to cover external source fan-out and failure degradation

Phase 3 — Data coverage (INT25A F2a)
 14. Seed common recipes as system meals (isSystemMeal=true) so
     SystemMealsSource returns results without external API calls

Phase 4 — Future sources (per-source INT)
 15. AI-suggestion source (requires explicit allow flag, not default)
 16. Partner sources (per-partner enable config)
```

---

## 11. Open Decisions

| # | Decision | Options | Recommendation |
|---|---|---|---|
| OD1 | External API fan-out timing | (a) synchronous blocking wait; (b) 2 s timeout, partial results; (c) fire-and-forget, return only local results first | (b) — 2 s timeout. External sources are best-effort; local sources always respond fast. Never block on a single slow API. |
| OD2 | Result cap | 10 / 15 / 20 items | **15** — matches `CAP_DATA_MAX_CHARS` budget. External results carry no ingredients/instructions (lightweight), so 15 rows fit comfortably. |
| OD3 | `meals/search` deprecation | Keep in parallel / deprecate / remove | **Keep in parallel.** `meals/search` serves explicit personal-library queries correctly. Only discovery queries move to `meal-discovery/search`. |
| OD4 | Template match fields | Name only / name+tags / name+cuisine+tags | **Name + cuisine + styleTags** — all are short strings, safe for substring matching without ingredients overhead. |
| OD5 | External source failure policy | Fail silently / log + degrade / surface in `sourcesQueried` | **Log + degrade + surface**: `sourcesQueried` should note "TheMealDB was unavailable" so the LLM can tell the user the search was partial. |
| OD6 | AI source gating | Always available / explicit `allowAI: true` param / admin toggle | **Admin toggle** — AI generation is a different quality of result from a grounded search. Default off; enable when the source can be trusted. |

---

## 12. Summary

| Design Question | Answer |
|---|---|
| Capability ID | `meal-discovery` (new; separate from `meals`) |
| Canonical owner | `MealDiscoveryService` (orchestrates; does not own data) |
| Primary verb | `search` |
| Port interface | One method: `discover(query, userId): Promise<DiscoveryItem[]>` |
| Sources (Day 1) | Personal library + System meals + Meal templates + TheMealDB |
| Sources (future) | BBC Good Food, AllRecipes, AI-generation, Partner banks |
| Extensibility mechanism | Register new `DiscoverySource` in `MealDiscoveryService`; zero handler/binding/intent/UI changes |
| Result contract | `MealDiscoverySearchResult` — source-agnostic, 15-item cap, no nutrition, no full ingredients |
| Deduplication | By composite key; personal beats external; `isAlreadySaved` flag |
| Conversation layer impact | Nil — same gateway, same `queryCapability`, same LLM prompt shape |
| Intent resolver impact | Minimal — discovery patterns route to `meal-discovery` instead of `meals` |
| `meals` capability | Unchanged — retains personal library read and search |
| `templates` capability | Unchanged |
