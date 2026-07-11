# Capability: Meal Discovery

**Capability ID:** `meal-discovery`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Bound under INT26 — `search` executable; `recommend` declared but unbound (ranking has no delegate-only owner — see Honest gaps)
**Created:** BENCHINT4 (2026-07-10), to close BENCHINT3 §8 task 13 — the discovery half of the `meals` ↔ `meal-discovery` boundary had no card.

> This document is the single canonical Capability Card for `meal-discovery`. It is governing architecture: required reading before any future binding implementation for this capability. Its sibling owner card is [`meals.md`](./meals.md), and the ownership boundary between them is stated in both.

---

## Capability Card

```
Capability ID:          meal-discovery
Capability name:        Meal Discovery
Discovery sibling of:   meals   (declared on the Capability Registry as `discoveryOf: "meals"`,
                         capability-registry.ts; validated at construction)
Owner service:          server/intelligence/services/meal-discovery-engine.ts
                         (MealDiscoveryEngine, INT26). Reads meals + meal_templates via storage.
                         Owns NO table of its own.
Source of Truth:        None owned. Reads SoT D12 (meals + meal_items) and the meal_templates
                         table, both owned elsewhere. This capability is a READ VIEW across
                         sources, never a source.
Access scope:           ownershipScoped: true. Phase 1 sources are the caller's personal library,
                         THA system meals, and meal templates. A discovery search must never
                         surface another user's private meal.
Supported read intents: search, recommend (capability-registry.ts)
Executable intents:     search — bound by INT26. The seed entry declares `executableIntents: []`;
                         the binding flips availability to "available" and registers `search` at
                         runtime, which is the pattern every capability follows.
Allowed scopes:         search { query } — cross-source discovery. An EMPTY query is legitimate
                         and means "no lexical constraint"; the constraint is supplied by a
                         companion capability in the same turn (see Compound routing below).
Honest gaps:            recommend — declared in supportedIntents, NOT executable. Ranking a meal
                         against a user's goals requires reading profile/household data, which
                         this capability may not do (see Trust rules). The Intent Resolver
                         therefore emits `search`, never `recommend`, even when the utterance
                         literally says "recommend" (CB-021).
Permission model:       minimumRole: user. Own-data + system meals only.
Port methods:           delegated to MealDiscoveryEngine via a dynamic-import port; no direct
                         storage access from the handler.
Binding registration:   MEAL_DISCOVERY_EXECUTABLE_INTENTS = ["search"]
Tests required:         Standard set + a test proving a discovery search cannot leak another
                         user's private meal + the routing-boundary assertions in
                         server/tests/test-intent-resolver-routing-attribution.ts.
Data impact:            Reads only.
Trust rules:            This capability reads MEALS, not PEOPLE. It must never read profile,
                         household, or goal data to shape its results — a discovery search that
                         silently personalises its own output makes the answer generator unable
                         to say why a meal was returned. When a question needs both, the Intent
                         Resolver emits TWO intents and the Context Composition Engine composes
                         them (see Compound routing below).
```

---

## The ownership boundary with `meals`

**An ownership-qualified meal query belongs to `meals`. An unqualified one belongs to `meal-discovery`.**

This is stated in full, with its rationale and its two worked examples, in [`meals.md` § Governance decision](./meals.md#governance-decision--the-meals--meal-discovery-ownership-boundary-benchint4-2026-07-10). It is repeated here only as a pointer, deliberately: the rule has one home, and a second full statement of it would recreate exactly the drift BENCHINT3 §6.2 documented.

`test-intent-resolver-routing-attribution.ts` pins both directions.

## Compound routing — how a discovery search acquires a constraint it may not read

Two corpus questions need `meal-discovery` *and* a capability that owns personal data. The resolver emits both intents; neither capability reaches into the other:

| Question | Intents emitted | Why |
|---|---|---|
| CB-019 — "Which meals are suitable for everyone in my household?" | `meal-discovery:search { query: "" }` + `household:read` | The constraint is the household's dietary profile. `meal-discovery` may not read it; `household` owns it. |
| CB-021 — "Recommend one meal that fits my goals and explain why." | `meal-discovery:search { query: "" }` + `profile:read` (non-baseline) | The constraint is the user's stored goals. Same reason. The verb is `search`, not the `recommend` the user literally said, because `recommend` is an honest gap. |

The empty `query` is not a defect. It says: *no lexical constraint* — the constraint arrives from the sibling intent, and the answer generator composes the two. This is the platform's normal cross-domain shape (`ALL_COMPOUND_MATCHERS`), not a special case.

---

**Governance decision:** `docs/implementation/benchmarking/BENCHINT4_INTENT_ROUTING_CONVERGENCE.md` §6 (BENCHINT4, 2026-07-10) — closes BENCHINT3 §8 task 13.
**Binding implementation:** `server/intelligence/bindings/meal-discovery.ts` (INT26).
