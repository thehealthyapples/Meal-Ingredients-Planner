# INT9A — Developer Capability Registry Specification — Implementation Report

**Status:** COMPLETE
**Date:** 2026-06-30
**Branch:** int1-intelligence-platform
**Workstream:** INT9A

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `int9a-rollback-pre-developer-registry` → `a5294f80265a245d4120e6786a170775eeecbeb9` |
| Code modified | None |
| Schema modified | None |
| Runtime behaviour modified | None |

To restore: `git checkout int9a-rollback-pre-developer-registry`

---

## ARCHITECTURE BOOTSTRAP (gate)

- [x] Read `docs/architecture/README.md` — no conflicts found. Architecture Bootstrap completed before any file was created.

---

## ARCHITECTURE COMPLIANCE

| Check | Result |
|---|---|
| No code changes | ✅ Pass — documentation only |
| No schema changes | ✅ Pass |
| No routes added | ✅ Pass |
| No UI changes | ✅ Pass |
| No runtime capability registry modified | ✅ Pass — `server/intelligence/capability-registry.ts` unchanged |
| No assistant created | ✅ Pass |
| No runtime behaviour changed | ✅ Pass |
| New document clearly classified as planning guidance, not governing architecture | ✅ Pass |
| Runtime Capability Registry remains the sole runtime source of truth | ✅ Pass |

Gate result: **PASS**

---

## WHAT WAS BUILT

### Developer Capability Registry

**File:** `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md`

A developer-facing planning document that records, for each Intelligence capability:

- Capability ID, workstream, owner service, source of truth, and access scope
- Current implementation status (complete or registered-only)
- Executable intents and supported future intents
- Port file, handler file, binding file, and test file paths (for completed bindings)
- Exact port methods with owner delegation mapping (for completed bindings)
- Read scopes, honest gaps, and trust rules
- Implementation report reference
- Next recommended action (for planned bindings)

Covers all thirteen capabilities registered in `capability-registry.ts` as of INT9A:

**Phase 1 — completed bindings (4):** planner, shopping, nutrition-knowledge, pantry

**Phase 2 — planned bindings (7):** diary, profile, household, partners, meals, templates, analyser

**Excluded (not Phase 2 candidates):** `administration` (admin-only, non-standard binding), `developer` (`availability: "never"`, physically isolated plane)

### Classification section

The registry opens with an explicit two-registry classification table distinguishing:

| Registry | Runtime? |
|---|---|
| `server/intelligence/capability-registry.ts` (Runtime) | Yes — authoritative |
| `INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` (this document) | No — planning only |

Rules stated explicitly: this document must never become a runtime source of truth, must never duplicate business ownership, and runtime behaviour must not depend on it.

### Compact future prompt template

A future binding prompt as short as:

```
Using INT7A Capability Factory and the Developer Capability Registry,
bind Diary read-only.
```

...allows the implementer to locate all pre-filled context in one document.

### Architecture README update

**File:** `docs/architecture/README.md`

Added the Developer Capability Registry row under Implementation Guidance (not Platform Governance or Intelligence Governance), with a clarifying note distinguishing it from the Runtime Capability Registry.

---

## FILES CREATED / MODIFIED

| File | Action |
|---|---|
| `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md` | **Created** — the registry document |
| `docs/architecture/README.md` | **Modified** — added row + note under Implementation Guidance |
| `docs/implementation/governance/INT9A_DEVELOPER_CAPABILITY_REGISTRY_SPECIFICATION.md` | **Created** — this report |

---

## DATA IMPACT

| Reads existing data | ❌ No |
| Writes new data | ❌ No |
| Changes meaning of existing data | ❌ No |
| Requires backfill | ❌ No |
| Schema changes | ❌ None |
| Runtime behaviour changes | ❌ None |

---

## TRUST CHECK

| Rule | Verified |
|---|---|
| Developer registry is NOT a runtime source of truth | ✅ Stated explicitly in classification section |
| Does not duplicate business ownership | ✅ All ownership entries point to existing owners, not re-declared |
| Runtime behaviour does not depend on this document | ✅ No code references this document |
| Runtime Capability Registry (`capability-registry.ts`) remains authoritative | ✅ Unchanged |
| Honest gaps recorded for each completed binding | ✅ Per-binding gap tables are accurate to handler source |
| Port methods accurately reflect the actual port interfaces | ✅ Verified against port files in handlers/ |
| Executable intents match binding constants | ✅ Verified against `*_EXECUTABLE_INTENTS` constants in bindings/ |

---

## DEFINITION OF DONE

- [x] Developer Capability Registry exists at `docs/architecture/INTELLIGENCE_DEVELOPER_CAPABILITY_REGISTRY.md`
- [x] It clearly separates the Runtime Capability Registry from this planning document
- [x] It documents all four completed Intelligence bindings (planner, shopping, nutrition-knowledge, pantry)
- [x] It documents seven planned Phase 2 bindings (diary, profile, household, partners, meals, templates, analyser)
- [x] It includes compact future prompt examples
- [x] It includes a cross-cutting pattern reference and quick-start checklist
- [x] `docs/architecture/README.md` updated with the registry under Implementation Guidance
- [x] No runtime behaviour changed
- [x] No code, schema, routes, UI, or assistant created
- [x] Rollback tag created before any file was written
- [x] This report saved under `docs/implementation/`
