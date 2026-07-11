# INT1 — Intelligence Platform Foundation — Implementation

**Date:** 2026-06-30
**Branch:** main
**Risk:** 🟡 AMBER
**Reason:** New runtime infrastructure (server-side modules + test), but no schema change, no route, no UI, no runtime behaviour change to existing surfaces.

> **Summary:** Built the canonical THA Intelligence Platform foundation — the Capability Registry, the Intent Engine, and the platform entry point — as infrastructure only. No user-facing AI functionality was introduced. No Developer / User / Voice assistant was built. Every capability is registered but not yet executable; invocation returns an honest gap.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | `rollback/before-INT1-intelligence-platform-20260630` → `d0a925260c3e8237c3ce423ff4412795ffe35c7d` |
| Working tree at start | Intentionally dirty — pre-existing uncommitted governance doc restructure (GOV-AI*) unrelated to INT1; left untouched |
| This task's writes | `server/intelligence/*` (6 files + README), `server/tests/test-intelligence-platform.ts`, `package.json` (+2 scripts), this report |
| Rollback to committed state | `git checkout rollback/before-INT1-intelligence-platform-20260630` (or `git reset --hard <tag>`) |
| Code modified outside new files | `package.json` only (added `test:intelligence-platform`, appended it to `test`) |
| Schema modified | **None** |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap — canonical entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md`
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (via the Principles' ownership reference + TIP1/TIP2 inheritance)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md`
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (TIP1)
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` (TIP2)

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

[x] One canonical identity
    The "intent" is a transient request object, not a stored entity. No new entity,
    no new key space introduced. Capabilities/intents are descriptors of existing
    entities owned elsewhere.

[x] One owner per fact
    The platform owns zero facts. Every capability row names the existing
    authoritative owner (SoT Register, via TIP2). The registry reads ownership; it
    never reassigns it.

[x] No duplicate entities
    The Capability Registry points at existing routes/services; it defines no parallel
    record and no parallel store.

[x] No duplicate ownership
    Each capability maps to exactly one owning service (TIP2 §5.3 duplicate-ownership
    check inherited). No capability is listed under two owners.

[x] No duplicate state
    No persistence added. No conversation/memory/history (explicitly out of scope).
    No user state stored anywhere by the platform.

[x] Extends existing architecture
    Builds on server/lib/access.ts (isAdmin/getTier/hasPremiumAccess) for permissions,
    reuses the SoT-declared owners and the existing route surface as registry metadata.
    Replaces nothing.

[x] Progressive enrichment where appropriate
    N/A — this is orchestration infrastructure, not a knowledge entity. No enrichment
    pipeline bolted onto transactional state.

[x] Honest gaps over fabricated information
    Invocation with no bound handler returns "not_executable" naming the owning
    service. Desired-but-unowned intents (order shopping; delete-week-record) return
    "gap". No fabricated success path exists.

[x] No permanent synchronisation bridge
    The registry is a derived, rebuildable projection of the route table + SoT
    Register. It is never written back to and is not an authoritative second store.

[x] Evolution over replacement
    Nothing is replaced or retired. The platform is purely additive new infrastructure.
```

---

## AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
[x] Uses the canonical Intelligence Platform — this IS the canonical platform (the one spine).
[x] Uses the Capability Registry — the platform routes only through it.
[x] Uses the Intent Engine — the single orchestration pipeline.
[x] Reuses existing business services — handlers (future) delegate to them; none re-implemented.
[x] Does not create another assistant — no User/Admin/Developer/Voice assistant built.
[x] Does not duplicate conversation state — no conversation/memory/history exists at all.
[x] Uses registered capabilities only — closed allow-list; no freeform execution; no raw DB/SQL path.
[x] Uses permission-aware access — server-side role + knowledge-class gates via access.ts.
[x] Produces honest gaps rather than fabricated knowledge — "not_executable" / "gap" outcomes.
```

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Intelligence Platform (NEW orchestration domain; no existing data domain mutated)
Declared SoT: server/intelligence/ (the canonical Intelligence Platform module)
New store created? NO (no DB store; the registry is an in-memory derived projection)
  If YES: retirement plan: N/A
Existing store extended? NO (no schema/store change; consumes access.ts + SoT metadata)
Consumer created? YES — the platform is a (future) consumer/invoker of existing services
  If YES: reads from declared SoT? YES — capability metadata is read from the SoT-declared owners
    No handler is bound in INT1, so no live read/write of any business domain occurs yet.
```

No business data domain (Planner, Shopping, Meals, Diary, Profile, Pantry, Household, Templates, Knowledge, Admin) is read or written by this implementation. The platform only *describes* them in the registry.

---

## ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Intelligence Platform / AI orchestration

Current Canonical Owner:
  server/intelligence/ (IntelligencePlatform + CapabilityRegistry + IntentEngine)

Current Runtime Consumer(s):
  None yet — the platform exposes no route/UI in INT1 (by design). The test harness
  (server/tests/test-intelligence-platform.ts) is the only consumer.

Duplicate Owners Remaining:
  NONE — pre-implementation search confirmed no existing intelligence-platform,
  capability-registry, or intent-engine module. Existing *-intelligence-assembler.ts
  files are read-models the platform will CONSUME, not duplicate (TIP2 §2.2).

Duplicate State Remaining:
  NONE — no persistence introduced.

Duplicate Workflows Remaining:
  NONE — no business logic implemented; orchestration only.

Current Convergence (%):
  100% of the orchestration domain — exactly one platform, one registry, one engine
  exist (0 duplicates counted across server/ and shared/).

Target Convergence (%):
  100% (maintained: future workstreams must extend this spine, not create siblings).

Next Planned Milestone:
  INT2 — first capability handler binding (read-only) on this spine. NOT started.

Remaining Architectural Risks:
  R4/R6 (business logic creeping into the engine) — mitigated by the handler contract
  + "orchestration only" review gate. Developer-role schema (R9) deferred to a governed
  workstream; modelled as an additive type only, no schema change made.
```

---

## IMPLEMENTATION

### Deliverables

| Deliverable | File |
|---|---|
| Intelligence Platform (entry point) | `server/intelligence/intelligence-platform.ts` |
| Capability Registry | `server/intelligence/capability-registry.ts` |
| Intent Engine | `server/intelligence/intent-engine.ts` |
| Permission model | `server/intelligence/permissions.ts` |
| Type contract | `server/intelligence/types.ts` |
| Module surface | `server/intelligence/index.ts` |
| Internal documentation + architecture diagram | `server/intelligence/README.md` |
| Tests | `server/tests/test-intelligence-platform.ts` (33 assertions) |

### Capability Registry

Seeded with the **13 canonical capabilities (C1–C13)** from TIP2 §2.1 as placeholder
registrations representing existing services — Planner, Shopping, Nutrition/Knowledge,
Meals, Diary, Profile, Partners, Pantry, Analyser, Household, Templates,
Administration, Developer. Each entry carries: unique id, display name, description,
owning service, SoT owner, API surface, required permissions (minimum role +
knowledge class + ownership scope + audit), supported intents (closed allow-list),
capability class, AI-access posture, and availability. **No new business capability
was invented.** Two honest gaps (TIP2 §2.4) are recorded: `order × shopping` and the
delete-whole-week-record GAP.

New capabilities can be added via `registry.register(...)` and new gaps via
`registry.registerGap(...)` with no architectural change — the discovery extension
point required by the brief.

### Intent Engine

Pure orchestration: `LOCATE → VALIDATE → PERMISSION → CONFIRM → INVOKE → RESPOND`.
It receives an already-interpreted typed intent (NL parsing is a future workstream),
locates the registered capability, validates the verb against the closed allow-list,
enforces permissions server-side, applies the deterministic confirmation gate, and —
where a handler is bound — invokes the one owning-service handler. It contains **zero
business rules** and has **no path that touches a database directly**.

### Intelligence Platform (entry point)

`intelligencePlatform` singleton composes registry + engine + permissions and is the
single orchestration point: `contextFor()`, `listCapabilities()`, `getCapability()`,
`registerHandler()` (future binding), and `handle()` (the pipeline).

### Permissions

`resolveContext()` maps the live `users.role` enum to an `IntelligenceRole` via the
existing `access.ts`. Roles `User`, `Administrator`, `Developer`, and internal
`service` are modelled from day one; `developer`/`service` are additive future roles
(no schema change — they are never derived from the current schema). Server-side gates:
`roleMeetsMinimum`, `canAccessKnowledgeClass`, `canInvokeCapability`, and the
deterministic `confirmationFor` tiering.

---

## DEFINITION OF DONE

**Success looks like:**
- [x] One canonical Intelligence Platform exists (`intelligencePlatform`).
- [x] One Capability Registry exists (13 canonical capabilities).
- [x] One Intent Engine exists (orchestration only).
- [x] Existing services remain the owners of business logic (none moved or duplicated).
- [x] No duplicate AI systems introduced (pre-implementation search confirmed).
- [x] No user-facing functionality changed (no route, no UI, no public AI endpoint).
- [x] Documentation updated (internal README + this report).
- [x] Implementation report saved under `docs/implementation/`.
- [x] Rollback identifier reported before modifications.

**What must not break:** existing routes, services, schema, and the existing test
suite. The platform is not wired into any runtime path.

**Manual test steps:**
1. `npm run test:intelligence-platform` → 33 passed, 0 failed.
2. `npx tsc --noEmit` → no new type errors in `server/intelligence/*`.

---

## DATA IMPACT

- Reads existing data: **NO** (reads only static SoT/route metadata as registry seed; no DB access).
- Writes new data: **NO**.
- Changes meaning of existing data: **NO**.
- Requires backfill: **NO**.
- Schema change: **NO** (none required; none made).

---

## TRUST CHECK

- Could this mislead the user? **No** — there is no user-facing surface; outcomes are honest.
- Could this fabricate certainty? **No** — invocation returns `not_executable`/`gap`, never a fabricated success.
- Is anything guessed but shown as real? **No** — gaps are recorded as gaps.
- What happens if the system is wrong? Worst case is an internal call returning a structured non-`ok` outcome; nothing user-facing and no state mutated (no handlers bound).
- No architectural duplication introduced: **YES (none)**.
- No new source of truth created: **YES (none — registry is a derived projection)**.
- No runtime behaviour altered: **YES (no existing surface is wired to the platform)**.
- Intelligence enriches existing workflows: **YES (by design — routes to existing owners)**.
- Business ownership unchanged: **YES**. Source-of-Truth ownership unchanged: **YES**.
  Capability ownership unchanged: **YES**. No duplicate AI orchestration: **YES**.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/before-INT1-intelligence-platform-20260630` → `d0a925260c3e8237c3ce423ff4412795ffe35c7d`
- **Files added:** `server/intelligence/{types,capability-registry,permissions,intent-engine,intelligence-platform,index}.ts`, `server/intelligence/README.md`, `server/tests/test-intelligence-platform.ts`, `docs/implementation/intelligence/INT1_INTELLIGENCE_PLATFORM_FOUNDATION_IMPLEMENTATION.md`
- **Files modified:** `package.json` (two test scripts)
- **Rollback commands:** `git checkout rollback/before-INT1-intelligence-platform-20260630` (or remove `server/intelligence/`, the test, and revert `package.json`).
- **Verification after rollback:** `npm run typecheck` clean; `npm run test` passes (without the intelligence test).

---

## SCOPE LOCK

**Implemented scope:** Intelligence Platform entry point, Capability Registry (C1–C13
placeholders), Intent Engine, permission model, type contract, internal documentation
+ diagram, tests, test script.

**Explicitly excluded (NOT done):**
- No Developer / User / Voice assistant.
- No Planner / Shopping / Nutrition / Feedback AI.
- No NL parsing, no LLM call, no embeddings, no knowledge index.
- No conversation storage, memory, or history.
- No UI, no pages, no routes, no public AI endpoint.
- No execution handlers bound (no live service invocation).
- No schema change.
- INT2 and later workstreams not begun.

**SUGGESTION** *(observations only — not implemented; require approval):*
1. **INT2 first handler binding** — bind a single read-only handler (e.g. `read × planner` → existing planner-intelligence assembler) to prove the end-to-end pipeline against a real service.
2. **Registry self-audit test** — a CI check asserting every capability's `owningService`/`apiSurface` still resolves to a live module/route (keeps the derived projection honest, mitigating R3 drift).
3. **Audit hook** — wire `permissions.audited` capabilities to `storage.createAuditLog` at the point handlers are bound (TIP1 §6.4), rather than at INT1 (nothing to audit yet).
4. **Developer-role grant** — the additive `developer`/`service` role grant is a governed schema/flag workstream (TIP1 §6.3, Risk R9) when Developer Intelligence is built.
