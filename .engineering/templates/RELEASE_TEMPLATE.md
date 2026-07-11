<!-- Copy this file. A release reaches production and requires separate human approval. -->

# [RELEASE ID] — Production Release

**Date:** YYYY-MM-DD
**Release branch / tag:** [name]
**Risk:** 🟡 AMBER / 🔴 RED
**Approved by:** [human name — a release without a named approver is not approved]

> **No agent may deploy.** This document is prepared by engineering and executed
> by a human. See `.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md`.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/[name]-[YYYYMMDD]` → `[commit SHA]` |
| Currently deployed commit | `[SHA]` |
| Rollback command | `git checkout [previous release tag]` |
| Database rollback | [migration down path, or "none — additive only"] |

**Database rollback is not free.** If a migration is not reversible, say so here
and describe the recovery path before the release proceeds.

---

## WHAT IS IN THIS RELEASE

| Workstream | Report | Risk |
|---|---|---|
| | `docs/implementation/<workstream>/<report>.md` | |

## WHAT IS EXPLICITLY NOT IN THIS RELEASE

[Named. "Everything else" is not an answer.]

---

## PRE-RELEASE VERIFICATION

- [ ] `npm run typecheck` — [result]
- [ ] `npm run test` — [result; distinguish pre-existing failures]
- [ ] `npm run build` — [result]
- [ ] `.engineering/scripts/repo-structure-verify.sh` — [result]
- [ ] Migrations reviewed and reversible (or recovery path documented)
- [ ] No secrets, credentials, or `.env` values in the diff
- [ ] Production configuration unchanged, or change reviewed and named below

---

## SCHEMA AND DATA

- Schema change: YES / NO — [describe]
- Migration files: [list]
- Backfill required: YES / NO — [plan]
- Reversible: YES / NO — [if NO, the recovery path]
- Production data touched: YES / NO

---

## DEPLOYMENT STEPS

1. [Exact commands, in order, to be run by the approver]
2. …

## POST-DEPLOY VERIFICATION

1. [What to check, and what "healthy" looks like]
2. [How long to watch before declaring success]

## ROLLBACK PROCEDURE

1. [Exact commands to return production to the previous release]
2. [How to verify the rollback succeeded]

---

## TRUST CHECK

- Could this release mislead users about their data?
- Is any migration destructive?
- What happens to in-flight requests during deploy?
- If this fails at 3 a.m., can the on-call engineer follow this document alone?

---

## OUTCOME

[Filled in after deployment: what shipped, when, and what was observed.]
