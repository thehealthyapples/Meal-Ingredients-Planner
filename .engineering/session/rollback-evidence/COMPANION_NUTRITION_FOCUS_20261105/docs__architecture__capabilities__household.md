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
                         eaters           — household_eaters rows, served as stored. The eater row
                                            is the canonical owner of EVERY member's diets and
                                            restrictions (CONV1 P4 / OWN-1, 2026-07-16); the old
                                            adult read-time enrichment from users.diet* is deleted
                                            (READ-1) and those columns are dropped.
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

## DIET OWNERSHIP — corrected 2026-07-16 (`DOC-1`)

**The owner of a person's diet facts is `household_eaters`.** Declared by
[`ARCHITECTURE_PRINCIPLES.md`](../ARCHITECTURE_PRINCIPLES.md) Principle 2 since 2026-06-25, and by
[Source of Truth Register](../THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md) Domains 7 and 16.

**What this card previously said, and why it was the defect.** The `eaters` scope read:

> *"`household_eaters` rows, **enriched at read time** for adult (`userId != null`) eaters **from
> `users.dietPattern` / `users.dietRestrictions`** (mirrors `server/routes.ts:8526–8541`)"*

stated flatly, as the capability's contract. **It specified a Principle 2 violation as the design.**
`ARCHITECTURE_PRINCIPLES.md` had named those columns a redundant shadow of `household_eaters`, to be
retired, three weeks before this card was read by its implementer — and the implementer built the
card. That is the whole of the conflict `DOC-1` resolves.

**Precedence, stated once.** `ARCHITECTURE_PRINCIPLES.md` is Platform Governance and states the
general law of entity architecture. A Capability Card is *"required reading before implementing a
binding for **that capability**"* and is subordinate to it. **A Capability Card cannot override a
Principle. The Principles prevail; this card was the defect, and this section is its correction —
not an amendment to any rule.**

**The current state — CONVERGED 2026-07-16 (`CONV1 P4`):**

| | |
|---|---|
| **Owner** | `household_eaters` — Register Domain 16, *Authoritative* |
| **Where EVERY member's diet lives** | `household_eaters` — `default_diet_types` (the diet pattern stored as its canonical diet type) + `hard_restrictions`. The `users.diet*` shadow columns are **dropped** (`OWN-1`) |
| **The read-time enrichment** | **Deleted** (`READ-1`) — the eaters scope, the read handler, the matcher, and smart-suggest serve stored row values |
| **The write door** | `storage.updatePersonDiet` (profile/onboarding) and the eater PATCH, whose adult-row 403 is **lifted** (`WRITE-2`). Eater rows are created at membership events under a unique `(household_id, user_id)` index (`WRITE-3`) |

**Binding rules that follow (none of them new — each is an existing rule applied to this card):**

1. **Do not re-introduce a read-time enrichment.** The eater row is the owner; a second read
   strategy for one fact is the shape `READ-1` retired. The publication gate's
   `hh-contested-owner` check ratchets against the shadow returning.
2. **Never present an eater row's empty `hardRestrictions` as "no restrictions"** when the safety
   context is unresolved. An unresolved context is not an unrestricted household. This is the
   existing fail-closed contract and it is load-bearing.
3. **`user_preferences` is not the owner and is not a promotion target.** Its diet-pattern mirror
   was written by a one-way Principle 7 bridge, deleted 2026-07-16 (`WRITE-1`);
   `user_preferences.dietTypes` remains Domain 27's own soft-preference fact.

**Line-number citations removed (`DOC-1`).** This card once cited `server/routes.ts:8526–8541` for
the (now deleted) enrichment; the citation had already rotted onto unrelated code before the
enrichment was retired. **Cite the behaviour and the owner, not the line.**

---

**Source investigation:** `docs/implementation/governance/INT11_CAPABILITY_CARDS_SPECIFICATION.md` (INT11, EPIC 1, 2026-06-30)
