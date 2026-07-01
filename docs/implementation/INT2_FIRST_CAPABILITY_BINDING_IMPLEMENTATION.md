# INT2 — First Capability Binding (Planner, Read-only) — Implementation

**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Risk:** 🟡 AMBER
**Reason:** First *executable* binding on the Intelligence Platform — new server-side handler/port/binding + test. No schema change, no route, no public endpoint, no UI, no change to any existing user-facing surface. The only runtime change is that the `planner` capability flips from `registered` to `available` on the canonical singleton (internal-only; nothing calls it yet).

> **Summary:** Bound the **first live capability** to the THA Intelligence Platform: the **read-only Planner**. The full orchestration pipeline now runs end-to-end — intent → Capability Registry → permission check → Planner owner → response — for read-only planner intents only. The Intelligence Platform gained **no business logic**; the handler delegates every read to the existing Planner owner (`storage` + `household`). Unsupported requests (including "today's meals", which the planner has no calendar mapping for) return **honest structured gaps**, never fabricated answers. No write path exists in the binding.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/before-INT2-first-capability-binding-20260630` → `a5294f80265a245d4120e6786a170775eeecbeb9` (INT1 foundation commit) |
| Working tree at start | Intentionally dirty — pre-existing uncommitted governance doc restructure (GOV-AI*/TIP*) unrelated to INT2; left untouched |
| This task's writes (new) | `server/intelligence/handlers/planner-read-port.ts`, `server/intelligence/handlers/planner-read-handler.ts`, `server/intelligence/bindings/planner.ts`, `server/tests/test-intelligence-planner-binding.ts`, this report |
| This task's edits (existing) | `server/intelligence/types.ts` (+`CapabilityExecutionError`), `server/intelligence/intent-engine.ts` (honest-failure catch), `server/intelligence/intelligence-platform.ts` (bind on singleton), `server/intelligence/index.ts` (exports), `server/intelligence/README.md`, `package.json` (+1 test script, appended to `test`) |
| Schema modified | **None** |
| Rollback | `git checkout rollback/before-INT2-first-capability-binding-20260630` (or `git reset --hard <tag>`) |

---

## REFERENCE DOCUMENTS READ (Architecture Bootstrap)

- [x] `docs/architecture/README.md` (mandatory entry point)
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2)
- [x] `server/intelligence/*` (the INT1 foundation being extended)
- [x] Planner owner: `server/routes.ts` (`/api/planner/*` read routes), `server/storage.ts` (planner getters), `server/lib/household.ts` (ownership)

**Bootstrap result:** No conflict with the governing architecture. This implementation *extends* the INT1 foundation along the exact extension point it was built around (`registerHandler`) and introduces no second platform, registry, or assistant.

---

## OBJECTIVE — proven

The platform now successfully routes a read-only planner request through the full pipeline:

```
Intent  →  Capability Registry  →  Permission Check  →  Planner Service  →  Response
 read           planner (found)        own household        storage reads      week view
{scope:week}    available              authenticated        (delegated)        (honest)
```

No business logic executes inside the Intelligence Platform. The handler is the single seam that calls the owning service, and it only *reads*.

---

## WHAT WAS BUILT

### 1. `handlers/planner-read-port.ts` — the delegation surface
A narrow, **read-only** interface (`PlannerReadPort`) whose every method is a 1:1 forward to an existing owner method (`storage.getPlanner*`, `storage.getMeal`, `household.getHouseholdForUser`). It has **no write methods by construction** and **no planner business rule**. `createStoragePlannerReadPort()` builds the production port with **dynamic imports**, so binding the handler opens **no database connection at import time**. The interface is injectable, which lets tests prove delegation with an in-memory owner.

### 2. `handlers/planner-read-handler.ts` — the first execution handler
- Executes **only** `read` and `explain`. Any other verb → honest `gap` ("read-only binding; the Planner remains the owner of all write/plan/generate operations").
- **Read scopes:** `week` (by `weekId` or `weekNumber`), `day` (by `dayId`, or `weekId|weekNumber` + `dayOfWeek`). `today` → honest `gap` (the planner is organised by week-number × day-of-week and **owns no calendar mapping**).
- **Explain** surfaces *existing* planner intelligence only — the household-adaptation rationale recorded on an entry. An entry with no recorded rationale → honest `gap` (will not fabricate a reason).
- **Permission-aware, own-data only:** requires an authenticated numeric user; resolves the caller's household and refuses any week/day/entry outside it as `denied` with no existence leak. Ownership is delegated authorization (matching the existing `/api/planner/*` routes), not re-implemented planner logic.

### 3. `bindings/planner.ts` — activation
`bindPlannerReadCapability(platform)` registers the handler against the `planner` capability, flipping its availability `registered → available`. Called once on the canonical singleton in `intelligence-platform.ts`.

### 4. Engine honesty extension (`types.ts` + `intent-engine.ts`)
Added `CapabilityExecutionError(failureStatus, message)`. The Intent Engine wraps handler invocation: a thrown `CapabilityExecutionError` becomes a structured `gap` / `denied` / `unsupported_intent` outcome; any other throw propagates unchanged. This keeps the platform **honest end-to-end** — it never reports `ok` for a non-result (Principle 6 / Risk R2). This is an orchestration/honesty concern, not business logic.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
[x] One canonical Intelligence Platform
    Extended the existing singleton; no second platform constructed.

[x] One Capability Registry
    Bound to the existing 'planner' entry via registerHandler; no new registry,
    no new capability invented.

[x] One Intent Engine
    Unchanged routing; added only an honest-failure catch around invoke. No second
    engine, no business branch.

[x] Planner remains the owner of planner data and planner business logic
    The handler delegates every read to storage/household. It holds no planner rule,
    no meal generation, no selection reasoning of its own.

[x] No duplicate planner workflows / no duplicate planner state
    Read-only delegation; no parallel store, no cached planner state, no re-derived
    workflow. The port forwards to the single owner (SoT D14).

[x] Existing architecture extended only
    Used the INT1 extension point (registerHandler) exactly as designed.
```

## AI ARCHITECTURE COMPLIANCE

```
[x] Uses the canonical Intelligence Platform        (intelligencePlatform singleton)
[x] Uses the AI Capability Registry                 (binds the existing 'planner' capability)
[x] Uses the Intent Engine                          (full LOCATE→…→RESPOND pipeline)
[x] Reuses the existing Planner business service    (storage + household via the port)
[x] Does not create another assistant               (no assistant, no chat, no LLM)
[x] Does not duplicate conversation state            (none exists; none added)
[x] Uses registered capabilities only                (closed allow-list enforced)
[x] Permission-aware access                          (server-side role + own-household only)
[x] Produces honest gaps rather than fabricated knowledge  (today / unknown scope / no rationale)
```

---

## DATA IMPACT

| Declaration | Status |
|---|---|
| **Reads existing data** | ✅ Yes — planner weeks/days/entries + meal names, via the existing owner, scoped to the caller's household. |
| **Writes new data** | ❌ No — the binding has no write path. |
| **Changes meaning of existing data** | ❌ No. |
| **Requires backfill** | ❌ No. |
| **Schema changes** | ❌ **None** (zero — the preferred outcome per the brief). |

---

## TESTING

New: `npm run test:intelligence-planner-binding` — **31 assertions, all passing**, using an injected in-memory owner (no live DB). Coverage:

- **Capability lookup** — planner is `available` on the singleton and is the *only* live capability (scope lock).
- **Permission validation** — anonymous → `denied`; cross-household week/day → `denied` (no leak); owner reads own data → `ok`.
- **Handler invocation + planner delegation** — read week/day return owned data; delegation to the owner methods is observed (spy).
- **Read scopes** — week by id and by number; day by id and by week+dayOfWeek.
- **Unsupported intent** — `order` (not in allow-list) → `unsupported_intent`.
- **Read-only enforcement** — `delete`/`add` stop at confirmation, and even when `confirmed` → honest `gap` (no mutation path).
- **Honest gaps** — `today`, missing scope, week without id, and `explain` with no recorded rationale.

Regression: `npm run test:intelligence-platform` — **33/33 passing** (INT1 foundation unchanged). All new/edited intelligence files are **typecheck-clean** (`tsc --noEmit`); the repository's pre-existing unrelated `tsc` errors are unchanged from the rollback tag.

---

## TRUST CHECK

- [x] Planner ownership unchanged — handler only reads via the owner.
- [x] Source of Truth unchanged — no new store, no schema change.
- [x] No duplicate planner implementation — delegation only.
- [x] Intelligence Platform only orchestrates — no business logic added.
- [x] Unsupported requests return honest gaps — verified by test.
- [x] Existing planner behaviour unchanged — no route/service edited; regression tests green.

---

## SCOPE LOCK — honoured

Implemented **only** the first Planner read-only capability. **Not** started: Conversation Platform, User Assistant, Voice, Planner write operations, Shopping Intelligence, Nutrition Intelligence.

### SUGGESTION (not implemented)

- **INT3 — second binding (read-only Nutrition/Knowledge or Shopping):** the port+handler+binding pattern here is the reference; the next read-only capability should follow it.
- **Calendar mapping owner:** "today's meals" is currently an honest gap because no service owns a calendar→(week,day) mapping. If a "current week/day" concept is desired, it should be added to the **Planner** owner (not the platform), then surfaced through the existing `read {scope:"today"}` path.
- **Confirmed-write execution (much later):** when planner writes are eventually bound, they must reuse the existing confirmation tiers and delegate mutation wholly to the Planner service — a separate, governed workstream.
- **Thin internal accessor for surfaces:** when a future assistant needs planner reads, expose them through the platform (not a new route) so permission/honesty stay centralised.
