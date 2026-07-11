# Capability: Meals / Cookbook

**Capability ID:** `meals`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Bound under INT15 — `read` executable, scoped to `list`/`summary`/`detail`; `explain`/`search`/`recommend` remain unbound (`search` is an unresolved open decision — see card; `recommend` ranking lives at the route layer; `explain` has no stored rationale)
**Promoted:** EPIC 1.5 (2026-06-30), from `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)

> This document is the single canonical Capability Card for `meals`. It is governing architecture: required reading before any future binding implementation for this capability. The [Developer Capability Registry](../INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) indexes this card (implementation status, binding status, executable intents, owner, link) but does not duplicate its content — this is the only place the full card lives. The original investigation evidence and methodology remain in `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md`.

---

## Capability Card

```
Capability ID:          meals
Capability name:        Cookbook / Meals
Owner service:          server/storage.ts — getMeals(userId) (line 433), getMeal(id) (line 437),
                         getMealsSummary(userId) (line 1040), getSystemMeals()/
                         getSystemMealsSummary() (lines 1000/1044), getMealItems(mealId)
                         (line 3408), lookupMeals(query) (line 1406).
                         NOT server/lib/meal-service.ts (starter-meals onboarding flow only — no
                         general list/get/search). NOT recipe-swap-engine.ts (write/generation
                         logic — applyRecipeSwaps mutates ingredients, no read surface). NOT
                         server/meal-resolution-service.ts (resolves meal-plan template slots, a
                         different concern from cookbook browsing/search).
Source of Truth:        SoT D12 — meals + meal_items tables (shared/schema.ts:95–133, 1260–1268).
                         Nutrition is a SEPARATE table (shared/schema.ts:135–145), joined by mealId
                         — not embedded in the meal record.
Access scope:           CORRECTION to prior stub: own-data is USER-scoped (storage.getMeals filters
                         by userId at the query, server/storage.ts:434), not household-scoped, plus
                         system meals (shared across all authenticated users, isSystemMeal=true).
                         There is no household-level meal scoping anywhere in the owner.
Supported read intents: read, explain, search, recommend, generate, add, replace, delete, import,
                         share (capability-registry.ts:86)
Executable intents:     read — search is a documented open decision (see gap below); ship read-only
                         first, add search once the scoping question is resolved.
Allowed scopes:         list    — getMeals(userId) + getSystemMeals(), merged (mirrors
                                  server/routes.ts:1160)
                         summary — getMealsSummary(userId) + getSystemMealsSummary()
                         detail  — getMeal(id) + getMealItems(mealId), WITH a mandatory ownership
                                  check (see Permission model — the owner method itself does not
                                  filter)
Honest gaps:            recommend — the existing /api/meals/recommended route computes ranking
                           (rankMealsByPreferences) INLINE AT THE ROUTE LAYER, not via a single
                           delegate-only owner method. Reimplementing that ranking in a capability
                           handler would be business logic in the handler (forbidden by INT7A
                           §"Avoiding Duplicate Business Logic") — gap until the owner exposes one
                           method that returns an already-ranked list.
                         generate/add/replace/delete/import/share — write — gap
                         explain — no stored rationale field on meals — gap
                         meal id not owned by caller and not a system meal — denied (see below)
                         search (lookupMeals) — OPEN DECISION, see below
Permission model:       CRITICAL FINDING: storage.getMeal(id) and storage.getMealItems(mealId) have
                         NO ownership filter at the storage layer — any id returns its row regardless
                         of caller. Ownership is enforced entirely at the ROUTE layer:
                         `meal.userId !== req.user!.id && !meal.isSystemMeal` → 404
                         (server/routes.ts:1183, duplicated at :1295, :1310, :10086, :10097).
                         A capability handler MUST replicate this exact check before returning detail/
                         items data — the owner does not expose a scoped method to delegate to. This
                         is a documented, narrow exception to "owner remains owner": the check is an
                         ownership/auth gate (analogous to requireUserId), not domain business logic,
                         so it is permitted in the handler per INT7A's allowed-list — but the
                         implementer should flag to the owner that a scoped getMealForUser(id, userId)
                         method would be architecturally cleaner.
                         OPEN DECISION — search: storage.lookupMeals(query) has ZERO scoping — it
                         ILIKE-matches meals.name across the ENTIRE table, including other users'
                         private (non-system) meals (server/storage.ts:1406–1423). The existing route
                         (server/routes.ts:5244) only checks isAuthenticated(), not ownership. Binding
                         this as-is would let any caller search other users' private meal names — NOT
                         safe to bind without a decision: either (a) the owner adds user/system
                         scoping to lookupMeals, or (b) the capability filters results post-hoc by
                         userId/isSystemMeal in the handler (defensible as a "safety filter," not
                         business logic, but flagged here for governance review before
                         implementation), or (c) gap the search verb entirely until resolved.
Port methods:           getMeals(userId)         → storage.getMeals(userId)
                         getSystemMeals()         → storage.getSystemMeals()
                         getMealsSummary(userId)  → storage.getMealsSummary(userId)
                         getSystemMealsSummary()  → storage.getSystemMealsSummary()
                         getMeal(id)              → storage.getMeal(id)
                         getMealItems(mealId)     → storage.getMealItems(mealId)
                         lookupMeals(query)       → storage.lookupMeals(query)  [pending open decision]
Binding registration:   MEALS_EXECUTABLE_INTENTS = ["read"]  (add "search" only after the open
                         decision above is resolved)
Tests required:         Standard set + explicit ownership-denial test for detail/items (id not owned,
                         not system → denied) + (once search ships) a test proving search cannot
                         leak another user's private meal.
Documentation updates:  server/intelligence/README.md row (future binding only). Developer Capability
                         Registry's "household-scoped" access-scope field is corrected to "user-scoped
                         + system meals" by this card.
Data impact:            Reads only
Trust rules:            Never fabricate ingredient quantities or nutritional values — nutrition is a
                         separate table, joined by mealId; gap if absent, never estimate. Never expose
                         another user's private meal via detail or (until resolved) search.
```

---

## Governance decision — the `meals` ↔ `meal-discovery` ownership boundary (BENCHINT4, 2026-07-10)

**Decision: an ownership-qualified meal query belongs to `meals`. An unqualified one belongs to `meal-discovery`. The qualifier is the boundary.**

This settles BENCHINT3 §6.2 and closes BENCHINT3 §8 task 13. It changes no behaviour: it records, as governing architecture, the rule the Intent Resolver already follows.

**Card correction.** `search` is now an executable intent of this capability (`MEALS_EXECUTABLE_INTENTS = ["read", "search"]`; the registry reports `executableIntents: ["read", "search"]`). The "pending open decision" language above predates that binding and is superseded by this section. The scoping question it worried about — *can search leak another user's private meal?* — is answered by the Permission model, not by withholding the verb.

**The rule.**

| Utterance carries… | Owner | Example |
|---|---|---|
| an ownership qualifier (*my meals*, *my cookbook*, *do I have*, *have I got*) | **`meals`** | CB-012 — "What chicken meals **do I have**?" |
| no ownership qualifier | **`meal-discovery`** | CB-018 — "Which meals include salmon?" |

Both questions filter meals by an ingredient. They are not the same question: the first asks the user's own library, the second asks what exists. `meals` is USER-scoped (`storage.getMeals` filters by `userId`) plus system meals; `meal-discovery` searches the discoverable corpus. Routing an unqualified query to `meals` silently narrows the answer to what the user already owns, and routing a qualified query to `meal-discovery` silently widens it past what they asked for. Neither error is visible in the answer text.

**Why this is recorded here, and not only in code.**

Until BENCHINT4 this rule existed in exactly one place: a prose comment in `pattern-intent-resolver.ts`, enforced by nothing. It was the third and least durable of three uncoordinated statements of the owner ↔ discovery relationship (BENCHINT3 §6.2). The other two — a stem rule in the Context Composition Engine and an inline `endsWith("-discovery")` in the Conversation Gateway — have been consolidated onto the Capability Registry (`Capability.discoveryOf`), which now validates the graph at construction. This card is where the *product* half of the relationship lives: the registry knows `meal-discovery` is the discovery sibling of `meals`; it does not and must not know which utterances belong to which.

The comment contradicted itself before it was enforced: it declared CB-021 a `meal-discovery` question while no `meal-discovery` matcher could route it. BENCHINT4 implements that routing. `test-intent-resolver-routing-attribution.ts` now pins both directions — CB-012 must stay with `meals`, CB-018 must reach `meal-discovery` — so the boundary cannot drift silently again.

**Known inconsistency, not yet reconciled.** The Companion Benchmark fixture assigns CB-012 to `meal-discovery.search`, contradicting this decision. The platform routes it to `meals` and answers correctly, and is scored a misroute for it. Re-targeting that fixture row to `meals.search` is a corpus change and is recorded as outstanding in `BENCHINT4_INTENT_ROUTING_CONVERGENCE.md` §7 — it is not applied here, because a Capability Card does not own the benchmark corpus.

---

**Source investigation:** `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
**Governance decision:** `docs/implementation/benchmarking/BENCHINT4_INTENT_ROUTING_CONVERGENCE.md` §6 (BENCHINT4, 2026-07-10) — closes BENCHINT3 §8 task 13. See the sibling card, [`meal-discovery.md`](./meal-discovery.md).
