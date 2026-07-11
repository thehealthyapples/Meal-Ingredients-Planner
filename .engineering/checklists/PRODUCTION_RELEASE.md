# Checklist — Production Release

> **No agent may deploy.** A release is prepared by engineering and executed by a
> named human who has read this checklist. Deployment requires explicit, separate
> approval and is never implied by any other approval.

Template: [`../templates/RELEASE_TEMPLATE.md`](../templates/RELEASE_TEMPLATE.md).
Protocol: [`../protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md`](../protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md).

## Authorisation

- [ ] A named human has approved this release.
- [ ] The approval is for **this** release, not inherited from a previous one.
- [ ] The approver has read the rollback procedure below.

## Pre-release verification

- [ ] `npm run typecheck` — result recorded.
- [ ] `npm run test` — result recorded; **pre-existing failures distinguished
      from new ones**.
- [ ] `npm run build` — succeeds.
- [ ] `.engineering/scripts/repo-structure-verify.sh` — passes.
- [ ] Every workstream in this release has a committed implementation report.
- [ ] The diff against the currently deployed commit has been reviewed.

## Safety

- [ ] No secrets, credentials, or `.env` values anywhere in the diff.
- [ ] Production configuration unchanged — or the change is named and reviewed.
- [ ] Schema change? If yes:
      - [ ] Migration reviewed.
      - [ ] Reversible — or an explicit recovery path is documented.
      - [ ] Backfill plan exists and has been tested against non-production data.
      - [ ] Destructive operations (`DROP`, `ALTER … DROP`, data deletion)
            identified and separately approved.
- [ ] Behaviour of in-flight requests during deploy considered.
- [ ] `.engineering/` is not in the deployed artefact *(it is excluded by
      construction — confirm the build inputs have not changed)*.

## Rollback readiness

- [ ] Rollback tag created for the pre-release state; identifier reported.
- [ ] Currently deployed commit SHA recorded.
- [ ] Rollback commands written out, exactly, in the release document.
- [ ] Database rollback path documented — **or the migration is explicitly
      one-way and that is accepted in writing.**
- [ ] An on-call engineer could execute the rollback from the document alone.

## Deploy

- [ ] Executed by the named human approver.
- [ ] Deployment steps followed in order, from the release document.

## Post-deploy

- [ ] Health checks pass.
- [ ] The specific behaviour this release changed has been observed working.
- [ ] Watched for the agreed period before declaring success.
- [ ] Outcome recorded in the release document.
- [ ] If rolled back: what happened, and why, recorded before anything else.
