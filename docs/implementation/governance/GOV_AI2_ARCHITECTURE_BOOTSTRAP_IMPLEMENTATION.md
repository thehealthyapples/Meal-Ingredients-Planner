# GOV-AI2 — Add Architecture Bootstrap to System Control Layer — Implementation

**Date:** 2026-06-30
**Risk:** 🟢 GREEN — Governance & documentation only. No code, schema, runtime, or API changes.
**Reason:** Make loading the canonical architecture (`docs/architecture/README.md`) the mandatory first action before any significant investigation, recommendation, or implementation.
**Builds on:** GOV-AI1 (established the canonical `docs/architecture/` library and `README.md` entry point).

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Full working-tree snapshot tag | `rollback/before-arch-bootstrap-20260630` → commit `a222f84` |
| Committed-state reference tag | `rollback/before-arch-bootstrap-20260630-head` → commit `d0a9252` |
| Reported before changes | Yes — both tags created and reported prior to any edit |
| Working tree at start | 4 commits ahead of `origin/main`; uncommitted GOV-AI1 restructure present (staged renames + untracked architecture docs) |
| What the snapshot captures | **Full working tree** including uncommitted GOV-AI1 work and untracked files (`docs/architecture/README.md`, promoted docs, GOV-AI1 report). The 340 MB `*.zip` export is excluded via `.gitignore`. |
| Restore command | `git checkout rollback/before-arch-bootstrap-20260630 -- .` |
| Note | The snapshot was written via an isolated temporary index, so the user's carefully-staged GOV-AI1 index was left untouched. |

**No implementation began until the rollback identifiers above were reported.**

---

## OBJECTIVE

Every future AI investigation, recommendation, and implementation must begin by loading the canonical architecture from `docs/architecture/README.md`. Add an **Architecture Bootstrap** step that sits immediately before Architecture Compliance, and repoint begin-work documentation at the README entry point rather than at individual architecture documents.

---

## KEY FINDING — WHERE THE "SYSTEM CONTROL LAYER" LIVES

The 11-section **THA System Control Layer** (`Core Operating Mode → Architecture Compliance → Source of Truth → Engineering Principles → Implementation Prompt Rules → Decision Format → Implementation Format → Release Principles → Scope Lock → Core Principle`) is **not a file in this repository**. An exhaustive search (exact and case-insensitive) for "System Control Layer", "Core Operating Mode", and each section name returned nothing.

The System Control Layer is the project's **external master operating prompt** (the canonical prompt under which tasks like those in `attached_assets/` are issued, maintained in Replit/ChatGPT). Its constituent rules are *reflected* in-repo across:

- `docs/architecture/ENGINEERING_WORKFLOW.md` — the master workflow (rollback → read architecture → architecture compliance → decision-gated → mandatory sections → … → change control).
- `docs/change-control.md` — decision format, prompt discipline, scope lock, core principle.
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — engineering principles.
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — source of truth.

**Decision (confirmed with the project owner):** Deliver the Architecture Bootstrap as a **canonical text block to paste into the external System Control Layer** (below), AND **extend the in-repo governance** (`ENGINEERING_WORKFLOW.md` + `README.md`). A new, competing "System Control Layer" document was **not** created in-repo, because that would introduce a second governance source and fail the *"no duplicate governance / existing governance extended only"* checks this task mandates.

---

## CANONICAL TEXT BLOCK FOR THE EXTERNAL SYSTEM CONTROL LAYER

Paste the following section into the System Control Layer **immediately after `CORE OPERATING MODE` and before `Architecture Compliance`**:

```
----------------------------------------
ARCHITECTURE BOOTSTRAP (MANDATORY)
----------------------------------------

Before any significant investigation, recommendation or implementation:

Read:

docs/architecture/README.md

The documents referenced by this README are the governing architecture
for The Healthy Apples.

Every proposal and implementation must comply with the governing architecture.

If any proposed change conflicts with the governing architecture:

STOP.

Explain why.

Do not continue until approved.
```

### Updated System Control Layer governance order

1. Core Operating Mode
2. **Architecture Bootstrap**  ← new
3. Architecture Compliance
4. Source of Truth
5. Engineering Principles
6. Implementation Prompt Rules
7. Decision Format
8. Implementation Format
9. Release Principles
10. Scope Lock
11. Core Principle

---

## CHANGES MADE (in-repo)

### 1. `docs/architecture/ENGINEERING_WORKFLOW.md` — STEP 2 reframed as the Architecture Bootstrap
`STEP 2 — READ THE ARCHITECTURE PRINCIPLES` became **`STEP 2 — ARCHITECTURE BOOTSTRAP (read the governing architecture)`**. It now requires reading **`docs/architecture/README.md`** (the canonical entry point) first; the README's governing documents (Architecture Principles, Source of Truth Register, and the rest) remain required reading routed through it. A `STOP / explain / do not continue until approved` gate was added. This step sits **immediately before STEP 3 — Architecture Compliance Confirmation**, matching the required ordering (Bootstrap → Compliance). The previous direct pointers to individual documents were extended, not removed.

### 2. `docs/architecture/ENGINEERING_WORKFLOW.md` — implementation template
`## REFERENCE DOCUMENTS READ` now lists `docs/architecture/README.md (architecture bootstrap — canonical entry point)` as the first checkbox, ahead of the individual documents.

### 3. `docs/architecture/README.md` — bootstrap framing
Added a short **Architecture Bootstrap (mandatory entry point)** callout identifying the README as the first thing to read, restating the STOP-on-conflict gate as a pointer, and noting it is enforced as STEP 2 of `ENGINEERING_WORKFLOW.md`. This is a pointer, not a re-statement of governing rules — no rule is duplicated.

No other in-repo document instructs agents to *begin work* by reading individual architecture files; the remaining "required reading" mentions are status markers and were left unchanged.

---

## ARCHITECTURE COMPLIANCE REVIEW

| Check | Result |
|---|---|
| One canonical architecture entry point | ✅ `docs/architecture/README.md` |
| One governing architecture location | ✅ `docs/architecture/` |
| No duplicate governance rules | ✅ Bootstrap added to the existing STEP 2; README change is a pointer; external block delivered as reference text, not a second in-repo governance doc |
| Existing governance extended only | ✅ STEP 2 reframed/extended; nothing rewritten or replaced |
| No schema changes | ✅ None |
| No runtime changes | ✅ None |
| No API changes | ✅ None |
| No application code / AI implementation | ✅ None |

All checks pass.

---

## DEFINITION OF DONE

- [x] Architecture Bootstrap defined as a mandatory section (canonical block delivered for the external System Control Layer; reflected in-repo as STEP 2).
- [x] It appears immediately before Architecture Compliance (STEP 2 → STEP 3; SCL order item 2 → 3).
- [x] Governance order updated (documented above with Architecture Bootstrap inserted at position 2).
- [x] Begin-work references now point to `docs/architecture/README.md` rather than individual documents.
- [x] No duplicate governance rules introduced.
- [x] Governance implementation report created in `docs/implementation/`.
- [x] Rollback identifiers reported before changes.

---

## ROLLBACK

`git checkout rollback/before-arch-bootstrap-20260630 -- .` restores the full pre-GOV-AI2 working tree (tracked + untracked). The `…-head` tag (`d0a9252`) references the last committed state.
