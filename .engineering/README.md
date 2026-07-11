# `.engineering/` — Engineering Governance

**Start every engineering session here.**

This directory owns **how The Healthy Apples is built**. It is not part of The
Healthy Apples, and it never ships.

---

## Start here

1. **Read the [Engineering Operating Manual](./OPERATING_MANUAL.md).** It is the
   single source of truth for every engineering session — the eleven steps from
   reading the architecture to (optionally, and only with separate approval)
   deploying.

2. **Resuming interrupted work?**

   ```
   claude --continue
   ```

   or:

   > Read .engineering/session/CURRENT.md and continue the active session.

   Recovery takes under a minute. See [`session/README.md`](./session/README.md).

3. **Pick your checklist** from [`checklists/`](./checklists/) and your document
   shape from [`templates/`](./templates/). Do not invent either.

---

## The four layers

| Layer | Lives in | Answers | Ships? |
|---|---|---|---|
| **Engineering Governance** | `.engineering/` | How do we perform engineering? | **Never** |
| **Application Governance** | `docs/` | What is the product? Is this change correct? | No |
| **Runtime Application** | `client/`, `server/`, `shared/`, `migrations/` | What the product does | Yes |
| **Production** | the deployed artefact | What users run | Is production |

`.engineering/` describes *how the codebase is built*. `docs/` describes *what
the product is*. A session record, a hook, and a protocol are engineering. An
architecture document and an implementation report about a feature are
documentation.

The one document that spans both is
[`docs/architecture/ENGINEERING_WORKFLOW.md`](../docs/architecture/ENGINEERING_WORKFLOW.md):
it is **Application Governance** and owns the Architecture Compliance Checklist.
The Operating Manual tells you *when* to run that checklist; the checklist itself
stays governing in `docs/`.

---

## Layout

```
.engineering/
├── README.md            ← you are here (entry point)
├── OPERATING_MANUAL.md  ← the 11-step workflow: single source of truth
├── protocols/           ← HOW engineering is performed (durable procedures)
├── standards/           ← the rules a protocol assumes (boundaries, risk, verification)
├── templates/           ← document shapes to start from
├── checklists/          ← per-task checklists, completed during Review
├── reports/
│   ├── implementation/  ← WHAT engineering was performed on the tooling
│   └── investigations/  ← analysis of engineering practice
├── session/             ← live session recovery: CURRENT.md, INDEX.md, runs/
├── hooks/               ← Claude Code SessionStart + Stop hooks
└── scripts/             ← session lifecycle and verification scripts
```

**Protocols define how engineering is performed. Reports record what engineering
was performed.** They never share a folder.

### What lives where

| You want… | Go to |
|---|---|
| The workflow | [`OPERATING_MANUAL.md`](./OPERATING_MANUAL.md) |
| To resume a dropped session | [`session/CURRENT.md`](./session/CURRENT.md) |
| How rollback protection works | [`protocols/ROLLBACK_PROTECTION_PROTOCOL.md`](./protocols/ROLLBACK_PROTECTION_PROTOCOL.md) |
| How session recovery works | [`protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`](./protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md) |
| When I may push or deploy | [`protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md`](./protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md) |
| What must be green before a merge reaches production — and the emergency bypass | [`protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md`](./protocols/PRE_DEPLOYMENT_VERIFICATION_GATE.md) |
| What `.engineering/` may never do | [`standards/ENGINEERING_BOUNDARIES.md`](./standards/ENGINEERING_BOUNDARIES.md) |
| What GREEN / AMBER / RED mean | [`standards/RISK_AND_SCOPE_STANDARD.md`](./standards/RISK_AND_SCOPE_STANDARD.md) |
| What counts as verified | [`standards/VERIFICATION_STANDARD.md`](./standards/VERIFICATION_STANDARD.md) |
| To write an implementation report | [`templates/IMPLEMENTATION_TEMPLATE.md`](./templates/IMPLEMENTATION_TEMPLATE.md) |
| To write an investigation | [`templates/INVESTIGATION_TEMPLATE.md`](./templates/INVESTIGATION_TEMPLATE.md) |
| To prepare a release | [`templates/RELEASE_TEMPLATE.md`](./templates/RELEASE_TEMPLATE.md) |
| To tidy the repository | [`templates/REPOSITORY_HOUSEKEEPING_TEMPLATE.md`](./templates/REPOSITORY_HOUSEKEEPING_TEMPLATE.md) |

---

## Hard boundaries

This directory must **never**:

- become part of the application,
- be deployed to production,
- expose an API or any UI,
- create database tables,
- store user or business data,
- integrate with the Intelligence Platform.

Nothing under `client/`, `server/`, or `shared/` may import from here, and
nothing here may import from them. The only runtime that executes this code is a
developer's Claude Code session, via the hooks in `.claude/settings.json`.

**Why it never deploys.** `npm run build` (`script/build.ts`) bundles only
`client/`, `server/`, and `shared/` into `dist/`; production runs
`node dist/index.cjs`. A top-level `.engineering/` is outside every input to that
build. Its content is Markdown and developer shell scripts — no TypeScript, no
schema, no migrations.

Both boundaries are asserted mechanically:

```bash
.engineering/scripts/session-verify.sh        # .engineering has not leaked into the app
.engineering/scripts/repo-structure-verify.sh # repository structure is clean
```

---

## Privacy

Session records contain **concise engineering progress only** — stage,
checkpoints, next action, blockers, file paths. They never contain
chain-of-thought or conversation transcripts.
