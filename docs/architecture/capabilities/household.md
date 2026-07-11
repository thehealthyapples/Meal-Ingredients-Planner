# Capability: Household

**Capability ID:** `household`
**Classification:** Governing Architecture — Canonical Capability Definition
**Status:** Bound under INT13 — see `docs/implementation/intelligence/INT13_HOUSEHOLD_CAPABILITY_BINDING_IMPLEMENTATION.md`. The OPEN DECISION below (excluding `inviteCode` from the AI-facing projection) was resolved: excluded.
**Promoted:** EPIC 1.5 (2026-06-30), from `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)

> This document is the single canonical Capability Card for `household`. It is governing architecture: required reading before any future binding implementation for this capability. The [Developer Capability Registry](../INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md) indexes this card (implementation status, binding status, executable intents, owner, link) but does not duplicate its content — this is the only place the full card lives. The original investigation evidence and methodology remain in `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md`.

---

## Capability Card

```
Capability ID:          household
Capability name:        Household
Owner service:          server/storage.ts — Household System section (line 2354 onward) +
                         Eaters section (line 2730 onward). Specifically:
                           getHouseholdWithMembers(householdId)   — line 2426 (read)
                           getHouseholdDietaryContext(userId)     — line 2700 (read)
                           getHouseholdEaters(householdId)        — line 2760 (read)
                         server/lib/household.ts contributes only getHouseholdForUser(userId)
                         (line 17 — resolves the caller's active householdId from session).
                         household-meal-matcher.ts is NOT a household read surface — it duplicates
                         a raw Drizzle read for unrelated meal-compatibility scoring logic; excluded.
Source of Truth:        SoT D16 — households / household_members / household_eaters
                         (shared/schema.ts:1063–1096)
Access scope:           own-data only (household-scoped). Scoping always flows from the
                         authenticated session via getHouseholdForUser(req.user!.id) — there is no
                         /api/household/:id route and no client-suppliable household id anywhere in
                         this surface, so there is no id-enumeration path to leak another
                         household's existence.
Supported read intents: read, explain, add, delete (capability-registry.ts:170)
Executable intents:     read   — explain has no stored rationale; add/delete are writes.
Allowed scopes:         household        — id, name, members (via getHouseholdWithMembers)
                         dietary-context  — aggregated diet types/exclusions across active members
                                            (getHouseholdDietaryContext)
                         eaters           — household_eaters rows, enriched at read time for adult
                                            (userId != null) eaters from users.dietPattern /
                                            users.dietRestrictions (mirrors server/routes.ts:8526–8541)
Honest gaps:            explain — no stored rationale on membership/eater records — gap
                         add/delete — write — gap
                         caller belongs to no household — getHouseholdForUser() throws; the handler
                           must translate this into gap, not a fabricated empty household
Permission model:       req.isAuthenticated() → 401; householdId resolved only from
                         getHouseholdForUser(req.user!.id) (server/lib/household.ts:17). Note:
                         requireHouseholdRole (household.ts:41) is unused dead code — not relevant
                         to a read-only binding's permission model.
Port methods:           getHouseholdForUser(userId)        → household.getHouseholdForUser(userId)
                         getHouseholdWithMembers(householdId) → storage.getHouseholdWithMembers(id)
                         getHouseholdDietaryContext(userId)   → storage.getHouseholdDietaryContext(userId)
                         getHouseholdEaters(householdId)      → storage.getHouseholdEaters(id)
Handler responsibilities: resolve householdId from session once; delegate per scope; project results.
                         OPEN DECISION: the live human route returns households.inviteCode to members
                         (server/routes.ts:8387). Recommend EXCLUDING inviteCode from the AI-facing
                         projection even though the human UI shows it — an AI capability is a new,
                         broader-blast-radius consumer of a join secret. This is a recommendation for
                         the implementer to confirm with a governance owner, not a decision made here.
Binding registration:   HOUSEHOLD_EXECUTABLE_INTENTS = ["read"]
Tests required:         Standard set + "caller has no household → gap, not denied" test +
                         inviteCode-exclusion trust-rule assertion (pending the open decision above).
Documentation updates:  server/intelligence/README.md row (future binding only); the Developer
                         Capability Registry's prior owner-service field (household.ts) is corrected
                         by this card.
Data impact:            Reads only
Trust rules:            Never surface another household's membership or eaters. Never fabricate
                         dietary restrictions. inviteCode handling per the open decision above.
```

---

**Source investigation:** `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
