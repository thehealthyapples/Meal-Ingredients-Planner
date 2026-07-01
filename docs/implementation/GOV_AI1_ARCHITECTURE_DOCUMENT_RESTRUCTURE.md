# GOV-AI1 — Architecture Document Restructure — Implementation

**Date:** 2026-06-30
**Risk:** 🟢 GREEN — Governance & documentation restructuring only. No code, schema, runtime, or API changes.
**Reason:** Establishes a permanent canonical `docs/architecture/` directory and relocates/promotes governing architecture documents into it.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/before-arch-doc-restructure-20260630` → commit `d0a9252` (tag object `c157838`) |
| Reported before changes | Yes — tag created and reported prior to any file move |
| Working tree at start | 4 commits ahead of origin/main; 3 untracked TIP investigation files present |
| Rollback (committed state) | `git checkout rollback/before-arch-doc-restructure-20260630` |
| Note | The three TIP files were untracked at start; restoring committed state will not delete the promoted copies in `docs/architecture/`. Remove `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`, `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` manually for a full revert. |

---

## OBJECTIVE

Separate canonical governing architecture from investigations. Architecture documents must no longer live inside `docs/investigations/`. Create `docs/architecture/` and consolidate all governing architecture there.

---

## CHANGES MADE

### 1. Created canonical directory
- `docs/architecture/` — single canonical home for governing architecture.
- `docs/implementation/` — created to hold this report.

### 2. Platform Governance documents relocated (git history preserved via `git mv`)

| Governing document | From | To |
|---|---|---|
| THA Core Architecture Principles | `docs/ARCHITECTURE_PRINCIPLES.md` | `docs/architecture/ARCHITECTURE_PRINCIPLES.md` |
| THA Source of Truth Register | `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` |
| THA Engineering Workflow | `docs/ENGINEERING_WORKFLOW.md` | `docs/architecture/ENGINEERING_WORKFLOW.md` |
| THA Master Evolution Roadmap | `docs/investigations/THA_LAUNCH_ROADMAP.md` | `docs/architecture/THA_MASTER_EVOLUTION_ROADMAP.md` (renamed to canonical governance name) |

Established filenames (`ARCHITECTURE_PRINCIPLES.md`, `ENGINEERING_WORKFLOW.md`) were preserved deliberately: renaming `ARCHITECTURE_PRINCIPLES.md` to `THA_CORE_ARCHITECTURE_PRINCIPLES.md` would collide with the basename of the unrelated source investigation `docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES.md` and create a duplicate-ownership ambiguity. The roadmap carried a non-canonical name (`THA_LAUNCH_ROADMAP.md`) and was renamed to its governance identity `THA_MASTER_EVOLUTION_ROADMAP.md`.

### 3. Intelligence Governance documents promoted and renamed

| From (investigation) | To (governing) |
|---|---|
| `docs/investigations/TIP1_INTELLIGENCE_PLATFORM_ARCHITECTURE_INVESTIGATION.md` | `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` |
| `docs/investigations/TIP2_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` | `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` |
| `docs/investigations/TIP3_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` | `docs/architecture/THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md` |

Each promoted document's header was updated: title de-prefixed from `TIPn — … Investigation`, status changed from `INVESTIGATION ONLY` to `GOVERNING ARCHITECTURE — promoted … (GOV-AI1)`, and internal governing-document references repointed to `docs/architecture/`.

### 4. Investigation history preserved via pointer stubs
The seven former locations were replaced with short pointer stubs that redirect to the new canonical paths and state they are "pointer only … no longer the source of truth." This keeps historical links resolving while keeping single long-term ownership. Affected former paths:
- `docs/ARCHITECTURE_PRINCIPLES.md`, `docs/ENGINEERING_WORKFLOW.md`
- `docs/investigations/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/investigations/THA_LAUNCH_ROADMAP.md`
- `docs/investigations/TIP1_…`, `TIP2_…`, `TIP3_…`

### 5. Canonical governance structure defined
- New `docs/architecture/README.md` is the governance index, defining **Platform Governance** (4 docs) and **Intelligence Governance** (3 docs), plus the compliance summary.
- Cross-references inside the moved governing docs were repointed to `docs/architecture/` paths.

### 6. AI Architecture Compliance added
`docs/architecture/ENGINEERING_WORKFLOW.md` — the canonical home of the Architecture Compliance Checklist — was **extended** (not replaced) with a new `## AI ARCHITECTURE COMPLIANCE` section requiring every AI-related implementation to confirm: uses the canonical Intelligence Platform; uses the Capability Registry; uses the Intent Engine; reuses existing business services; does not create another assistant; does not duplicate conversation state; uses registered capabilities only; uses permission-aware access; produces honest gaps rather than fabricated knowledge — with a STOP-and-explain gate on any failure.

---

## CANONICAL GOVERNANCE STRUCTURE (RESULT)

**Platform Governance** (`docs/architecture/`)
- THA Core Architecture Principles — `ARCHITECTURE_PRINCIPLES.md`
- THA Source of Truth Register — `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`
- THA Engineering Workflow — `ENGINEERING_WORKFLOW.md`
- THA Master Evolution Roadmap — `THA_MASTER_EVOLUTION_ROADMAP.md`

**Intelligence Governance** (`docs/architecture/`)
- THA Intelligence Platform Architecture — `THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`
- THA AI Capability Registry & Intent Taxonomy — `THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md`
- THA AI Experience & Conversation Architecture — `THA_AI_EXPERIENCE_AND_CONVERSATION_ARCHITECTURE.md`

---

## ARCHITECTURE COMPLIANCE REVIEW

| Check | Result |
|---|---|
| One canonical architecture location | ✅ `docs/architecture/` only |
| No duplicate documents | ✅ Old paths are pointer stubs, not content copies |
| No duplicate ownership | ✅ Stubs explicitly mark themselves non-authoritative |
| Existing documentation extended only | ✅ Compliance checklist extended with an AI section; no governing content rewritten |
| No schema changes | ✅ None |
| No runtime changes | ✅ None |
| No API changes | ✅ None |

---

## NOTES & DECISIONS

- **Master Evolution Roadmap identity:** confirmed `THA_LAUNCH_ROADMAP.md` is the project's "Master Evolution Roadmap" (the Core Architecture Principles doc, Part 9, treats it as such). Promoted and renamed accordingly.
- **Core Architecture Principles vs investigation:** the governing principles document (`ARCHITECTURE_PRINCIPLES.md`) was moved. The separate source investigation `docs/investigations/THA_CORE_ARCHITECTURE_PRINCIPLES.md` is genuine history and was left untouched (it is not governing architecture).
- **Historical references left intact:** a small number of historical investigation files still reference `THA_LAUNCH_ROADMAP.md` and the old governing-doc paths. These resolve via the pointer stubs and were intentionally not rewritten, as they are point-in-time records.

---

## ROLLBACK

`git checkout rollback/before-arch-doc-restructure-20260630` restores all tracked files. Then delete the three promoted Intelligence docs from `docs/architecture/` (they were untracked at the rollback point) for a complete revert.
