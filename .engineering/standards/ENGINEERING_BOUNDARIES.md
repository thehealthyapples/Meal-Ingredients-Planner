# Engineering Boundaries Standard

**Status:** Canonical engineering standard. `EOM1` (2026-07-10).

Defines the four layers of this repository and the boundaries between them.

---

## 1. The four layers

| Layer | Lives in | Owns | Ships to production? |
|---|---|---|---|
| **Engineering Governance** | `.engineering/` | How engineering is performed: workflow, protocols, standards, templates, checklists, session recovery, hooks, verification scripts | **Never** |
| **Application Governance** | `docs/` | What the product is and whether a change is correct: governing architecture, capability cards, investigations, implementation reports | No |
| **Runtime Application** | `client/`, `server/`, `shared/`, `migrations/` | Product behaviour, data, schema | Yes |
| **Production** | the deployed artefact (`dist/`) | What users actually run | Is production |

## 2. The boundaries

**Engineering Governance → Application.** Forbidden, in both directions.

`.engineering/` must never:

- become part of the application,
- be deployed to production,
- expose an API or any UI,
- create database tables,
- store user or business data,
- integrate with the Intelligence Platform.

No file under `client/`, `server/`, or `shared/` may import from `.engineering/`.
No file in `.engineering/` may import from them.

**Why it cannot reach production.** `npm run build` (`script/build.ts`) bundles
only `client/`, `server/`, and `shared/` into `dist/`; production runs
`node dist/index.cjs`. `.engineering/` is outside every input to that build. It
contains only Markdown, shell scripts, and `.gitignore` — no TypeScript, no SQL,
no migrations — so it *structurally cannot* declare a table, mount a route, or
render a component.

**Engineering Governance ↔ Application Governance.** They reference each other
and duplicate nothing.

- The Operating Manual (`.engineering/`) says *when* to run the Architecture
  Compliance Checklist.
- The Checklist (`docs/architecture/ENGINEERING_WORKFLOW.md`) says *what* it
  contains and remains governing.

A document belongs to `docs/` if it describes the product; to `.engineering/` if
it describes how we build it. When in doubt: would this document still be true if
the product were replaced entirely? If yes, it is engineering governance.

**Application → Production.** Only by explicit, separate human approval. See
[`../protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md`](../protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md).

## 3. Reports follow their subject

| A report about… | Lives in |
|---|---|
| A product feature or capability | `docs/implementation/<workstream>/` |
| Product analysis or a root cause | `docs/investigations/` |
| The engineering tooling itself | `.engineering/reports/implementation/` |
| Engineering practice | `.engineering/reports/investigations/` |

`.engineering/protocols/` holds **only** protocols, standards, and operating
procedures. A report is never a protocol. Protocols say how engineering is
performed; reports record what engineering was performed.

## 4. Verification

```bash
.engineering/scripts/session-verify.sh
```

Asserts these boundaries structurally rather than by keyword: the directory
contains only `.md`, `.sh`, and `.gitignore`; no application file references it;
hooks and scripts touch no database and no network; it is not an input to
`script/build.ts`; session records contain no conversation transcript.

```bash
.engineering/scripts/repo-structure-verify.sh
```

Asserts the repository structure rules in
[`../../docs/architecture/REPOSITORY_CONVENTIONS.md`](../../docs/architecture/REPOSITORY_CONVENTIONS.md).

```bash
.engineering/scripts/rollback-verify.sh
```

Asserts [`../protocols/ROLLBACK_PROTECTION_PROTOCOL.md`](../protocols/ROLLBACK_PROTECTION_PROTOCOL.md)
against the live dashboard: every active session's rollback identifier exists,
is annotated, resolves to a commit, and matches between its run file and
`CURRENT.md`. Added by `ENGAUTO1`.

```bash
.engineering/scripts/engineering-verify.sh
```

Runs all three in one command. Added by `ENGAUTO1`, which found that
`session-verify.sh` — the verifier of this document — was referenced by the
Operating Manual, the README and a checklist, and **executed by nothing**: no
script, no hook, no CI job. It is now a gate on session completion. This
aggregate is **not** a pre-deployment gate and is deliberately not wired into
CI; the single deploy gate remains
[`../protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md`](../protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md) §1.

Run these after any structural change. None touches the application.
