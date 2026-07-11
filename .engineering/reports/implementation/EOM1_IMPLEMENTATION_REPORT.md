# EOM1 — THA Engineering Operating Manual

**Date:** 2026-07-10
**Branch:** `int1-intelligence-platform`
**Type:** Engineering governance. Developer tooling only.
**Risk:** 🟢 GREEN — documentation, file moves, and one governing-document amendment. No application behaviour, schema, or production change.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/EOM1-engineering-operating-manual-20260710` → `678b1aee2eeb2df775d1bc7f163c30eda1d39df4` |
| Working tree | **Intentionally dirty** — carries uncommitted INT1 workstream changes and the HOUSE2 housekeeping, neither authored here |
| Rollback to committed state | `git checkout rollback/EOM1-engineering-operating-manual-20260710` |

**The tag protects committed state only.** It does not capture the uncommitted
INT1 changes or the HOUSE2 housekeeping already present in the tree. This work
therefore touched no application source file, and nothing was committed.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (architecture bootstrap)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (all 523 lines, before amending)
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md`
- [x] `docs/intelligence/benchmark/BENCHMARK_EXECUTION_PROCESS.md`
- [x] `docs/implementation/governance/ARCH_BENCHMARK_OWNERSHIP_RULE.md`

---

## SUMMARY

`.engineering/` now holds the canonical Engineering Operating Manual and the
machinery around it, organised by the same ownership model `docs/` uses:
**protocols say how engineering is performed; reports record what engineering was
performed.** They no longer share a folder.

The overlap with the existing governing `docs/architecture/ENGINEERING_WORKFLOW.md`
was resolved by **splitting on ownership** rather than duplicating or relocating:
process moved to `.engineering/`; the Architecture Compliance Checklist stayed
governing in `docs/`. Neither document restates the other.

---

## FILES CREATED (17)

```
.engineering/
├── README.md                        (rewritten) entry point for every session
├── OPERATING_MANUAL.md              the 11-step workflow — single source of truth
├── protocols/                       HOW engineering is performed
│   ├── ROLLBACK_PROTECTION_PROTOCOL.md
│   ├── COMMIT_PUSH_DEPLOY_PROTOCOL.md
│   └── ENGINEERING_SESSION_RECOVERY_PROTOCOL.md   (moved from protocol/)
├── standards/                       the rules protocols assume
│   ├── ENGINEERING_BOUNDARIES.md
│   ├── RISK_AND_SCOPE_STANDARD.md
│   └── VERIFICATION_STANDARD.md
├── templates/                       document shapes to copy
│   ├── IMPLEMENTATION_TEMPLATE.md   (relocated from ENGINEERING_WORKFLOW.md)
│   ├── INVESTIGATION_TEMPLATE.md
│   ├── RELEASE_TEMPLATE.md
│   └── REPOSITORY_HOUSEKEEPING_TEMPLATE.md
├── checklists/                      completed at Review
│   ├── NEW_IMPLEMENTATION.md
│   ├── INVESTIGATION.md
│   ├── REPOSITORY_HOUSEKEEPING.md
│   ├── PRODUCTION_RELEASE.md
│   ├── SESSION_RECOVERY.md
│   └── BENCHMARK_EXECUTION.md
└── reports/
    ├── implementation/
    │   ├── ESR2_IMPLEMENTATION_REPORT.md          (moved from protocol/)
    │   └── EOM1_IMPLEMENTATION_REPORT.md          this report
    └── investigations/
        └── README.md                              what belongs here
```

## FILES REORGANISED (2 moved, 4 folders added)

| From | To | Why |
|---|---|---|
| `.engineering/protocol/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md` | `.engineering/protocols/` | Standardise on plural |
| `.engineering/protocol/ESR2_IMPLEMENTATION_REPORT.md` | `.engineering/reports/implementation/` | A report is not a protocol |

`protocol/` (singular) no longer exists. New folders: `protocols/`, `standards/`,
`templates/`, `checklists/`, `reports/implementation/`, `reports/investigations/`.

Pre-existing `session/`, `hooks/`, and `scripts/` were **retained** — they are
load-bearing (session recovery, two Claude Code hooks wired into
`.claude/settings.json`, four verification scripts). The requested tree was
treated as additive.

---

## THE OWNERSHIP SPLIT

`docs/architecture/ENGINEERING_WORKFLOW.md` is cited by **93 files, 16 of them
governing architecture documents**, almost all for its Architecture Compliance
Checklist. Moving or duplicating it would have broken that, so it was split by
ownership:

| Content | Owner after EOM1 |
|---|---|
| Rollback protection procedure | `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` |
| Session process, verify, build, review | `.engineering/OPERATING_MANUAL.md` |
| Commit / push / deploy rules | `.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md` |
| Risk rating, scope lock, trust check | `.engineering/standards/RISK_AND_SCOPE_STANDARD.md` |
| Implementation template | `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` |
| **Architecture Compliance Checklist** | **unchanged — `docs/architecture/ENGINEERING_WORKFLOW.md`** |
| **AI Architecture Compliance** | **unchanged — same** |
| **Domain Impact, Trust hard stops, Convergence Status** | **unchanged — same** |

**Every `STEP N` heading and number was preserved**, so all existing citations of
"STEP 2", "STEP 7", "STEP 8" remain valid. Only the *bodies* of the process steps
(1, 4, 9) were replaced with pointers to their new owner. No compliance content
was moved, reworded, or weakened.

### A governing-document contradiction found and resolved

STEP 9 required **every** project document to be saved under
`docs/investigations/`. That predates the `docs/implementation/` split and
directly contradicted `REPOSITORY_CONVENTIONS.md`, which routes implementation
reports to `docs/implementation/<workstream>/`. Two governing documents disagreed
about where reports live.

STEP 9 now defers to `REPOSITORY_CONVENTIONS.md` as the canonical authority on
location. The rule is unchanged in substance — every task still produces a
committed document — only the destination is now consistent.

---

## THE FOUR LAYERS

The manual makes the distinction explicit and enforceable:

| Layer | Lives in | Ships to production? |
|---|---|---|
| Engineering Governance | `.engineering/` | **Never** |
| Application Governance | `docs/` | No |
| Runtime Application | `client/`, `server/`, `shared/`, `migrations/` | Yes |
| Production | the deployed artefact (`dist/`) | Is production |

Nothing in `.engineering/` may become part of the application or the production
deployment. This is structural, not aspirational: the directory contains only
`.md`, `.sh`, and `.gitignore` — zero `.ts`/`.tsx`/`.js`/`.sql` — so it cannot
declare a table, mount a route, or render a component. `npm run build`
(`script/build.ts`) bundles only `client/`, `server/`, and `shared/` into `dist/`;
`.engineering/` is outside every input.

---

## VALIDATION PERFORMED

| Check | Result |
|---|---|
| `.engineering/scripts/session-verify.sh` | **25/25 pass** |
| `.engineering/scripts/repo-structure-verify.sh` | **8/8 pass** |
| Link check across `docs/` + `.engineering/` (447 links) | **0 broken** |
| Stale `.engineering/protocol/` (singular) references | **0 remaining** |
| Application source files changed | **0** |
| `npm run build` | **not run — not required; see below** |

**A new boundary check was added** to `session-verify.sh`, enforcing this task's
central rule mechanically:

```
PASS  protocols/ contains no implementation reports
```

The structure check was also extended to require `protocols/`, `standards/`,
`templates/`, `checklists/`, `reports/implementation/`, `reports/investigations/`,
and `OPERATING_MANUAL.md`.

**The tooling was dogfooded.** `session-new.sh` opened
`EOM1_Engineering_Operating_Manual` against this rollback tag, and
`session-complete.sh` closed it — exercising the workflow the manual documents
rather than only describing it.

**Build not required, and not run.** No application code changed: zero files under
`client/`, `server/`, or `shared/` were touched — not even a comment. `.engineering/`
and `docs/` are excluded from the build by construction. Per the Verification
Standard this work introduces, that fact is stated rather than silently skipped.

---

## DATA IMPACT

- Reads existing data: **NO**
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

No schema change, no migration, no production configuration change, no production
data touched. Nothing deployed.

---

## TRUST CHECK

- Could this mislead the user? No — the manual describes only what exists, and every script it names was run.
- Could this fabricate certainty? The benchmark checklist deliberately defers mechanics to the existing `BENCHMARK_EXECUTION_PROCESS.md` rather than inventing steps.
- No architectural duplication introduced: **YES** — the split guarantees neither workflow document restates the other.
- No new source of truth created: **YES** — one workflow owner for process, one for compliance.
- No runtime behaviour altered: **YES** — zero application files touched.
- Every "verified" claim backed by a command that ran: **YES** — 25/25, 8/8, and 447 links are outputs, not estimates.

---

## SCOPE LOCK

**Implemented:** `.engineering/` operating manual, protocols, standards,
templates, checklists, reports split; the ownership amendment to
`docs/architecture/ENGINEERING_WORKFLOW.md`; conventions and verify-script updates.

**Explicitly excluded:**
- No application source, schema, or configuration changed.
- No commit, push, or deploy.
- The pre-existing INT1 workstream changes and HOUSE2 housekeeping in the working
  tree were not authored here and were left untouched.
- `docs/change-control.md` unchanged.

**SUGGESTION (not implemented):**
1. `docs/change-control.md` is cited by the workflow as governing decision-gating
   and push rules, but is not indexed in `docs/architecture/README.md`. It is
   either governing and should be indexed, or superseded and should say so.
2. The working tree now carries three unreviewed bodies of work (INT1, HOUSE2,
   EOM1). They should be reviewed and committed separately before any push.

---

## OUTCOME

Every future engineering session has one entry point (`.engineering/README.md`),
one workflow (`OPERATING_MANUAL.md`), a checklist and template for its task type,
and a protocol for each durable procedure. Protocols and reports are separated by
responsibility. The boundary between engineering governance, application
governance, runtime, and production is stated once and enforced by two scripts.

## NEXT STEPS

Nothing has been committed, pushed, or deployed. `HEAD` is unchanged at `678b1ae`.

The recommended future workflow is the manual itself: read the architecture,
check status, take rollback protection, open a session, implement, verify, build,
review, commit — and treat push and deploy as separate, explicitly approved acts.
