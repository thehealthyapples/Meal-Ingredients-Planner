# THA AI Work Handoff

Operational checkpoint only. Architecture and governance remain authoritative in the documents listed below.

CURRENT_OBJECTIVE: Diagnose the Hermes ENAMETOOLONG failure without retrying registryPath; preserve the resulting investigation and stop before implementation.
CURRENT_REPOSITORY: C:\Users\Colin\The Healthy Apples\GitHub\tha-integrated-dev; related governed bridge: C:\Users\Colin\The Healthy Apples\tha-chatgpt-bridge
BRANCH: feat/integrated-dev (bridge: main)
HEAD: a007b37f7f62bd9cbb59c20edf8ced2c22144a56 (bridge: aae2ea30e34aa92c1a24ecccd40820160d4576c6)

LAST_COMPLETED_DECISION: tha-dec-0f328c043e695a5941846f6811d1203b — decision-factory-baseline-directory-safety Gate 8 scope bootstrap (classification only, no behaviour change)
LAST_COMPLETED_EXECUTION: tha-exec-1787854096363-3145f5cc
LAST_VERIFIED_RESULT: SUCCEEDED (first attempt); new scope family verified live, both bridge-orchestration regressions (test-gate8-repair-loop.mjs, test-gate8-verification-scope.mjs) still pass

CURRENT_DECISION: tha-dec-4305b675ed73f4812977e1157dc01dff — failed Hermes verification; no replacement decision created
CURRENT_EXECUTION: tha-exec-1787859067395-dcd2736a — FAILED before Hermes review
APPROVAL_STATUS: historical decision was APPROVED; execution failed
REQUIRED_APPROVAL_PHRASE: n/a — investigation only

LIVE_BLOCKER: registryPath seam (tha-dec-9999275355fb88cbf5c08db487313eea) FAILED. Root cause is now CONFIRMED (not the seam's design): decision-factory.mjs's dirty-pre-state baseline-capture loop crashes with EISDIR whenever `git status --porcelain -uall` reports a nested-git-repo directory (e.g. this repo's own execution-worktrees/<decisionId>/, which every Gate 8 execution creates) — git treats nested repos as opaque single entries even with -uall. Any test that targets the real governed root from inside its own active Gate 8 worktree (the exact "no sandboxed alternative" pattern both registryPath's and sourceRequestId's tests require) triggers this deterministically. See docs/investigations/governance/DIRTY_PRESTATE_BASELINE_DIRECTORY_EISDIR_INVESTIGATION.md.
BLOCKER_STATUS: Verified — confirmed via persisted FAILED-execution diagnostics (generatedScope, see below) plus a live empirical `git worktree add` reproduction

FILES_CHANGED_THIS_SESSION (bridge repo, all via governed Gate 8/9 execution, none hand-edited): gate8-repair-loop.mjs, gate8-execute-approved-decision.mjs, test-gate8-repair-loop.mjs, test-gate8-verification-scope.mjs (five scope-family bootstraps: gitignore-config, decision-factory-provenance, decision-factory-registry-path, disposable-json-fixture, decision-factory-baseline-directory-safety); disposable-json-fixture.mjs + test-disposable-json-fixture.mjs (new fixture helper, implemented and verified). test-decision-factory-baseline-directory-safety.mjs does NOT exist yet — only its scope classification exists so far. Plus this handoff file and several docs/investigations/governance/*.md files in tha-integrated-dev.
FILES_CURRENTLY_IN_SCOPE: none — no decision is currently minted/pending
LIVE_TREE_STATUS: Both worktrees intentionally dirty with substantial pre-existing changes; preserve all unrelated state. Hermes investigation report added only; no implementation, decision, approval, execution, or registryPath retry performed.

AUTHORITATIVE_DOCS_TO_READ:

- governing architecture: docs/architecture/README.md (verified: contains zero Gate 8/9/execution/diagnostic content — not relevant to bridge execution-governance work); PROJECT_GOVERNANCE.md (the actually-authoritative document for Gate 8/9/bridge execution governance)
- current investigations: docs/investigations/governance/HERMES_INGESTION_ENAMETOOLONG_INVESTIGATION.md; docs/investigations/governance/DIRTY_PRESTATE_BASELINE_DIRECTORY_EISDIR_INVESTIGATION.md; docs/investigations/governance/REGISTRY_PATH_EISDIR_ROOT_CAUSE.md; docs/investigations/governance/REGISTRY_PATH_SEAM_RETRY_FAILURE_INVESTIGATION.md
- current decision/report: bridge executions/tha-exec-1787846059369-c857dc7b.json (registryPath's FAILED execution, now carrying full generatedScope diagnostics thanks to the new attempt-diagnostic-preservation capability — tha-dec-6500227a0828c2a22c91d2038708439d, SUCCEEDED)

NEXT_EXACT_ACTION: Review the Hermes input contract and, only after explicit governed approval, prepare a fresh RED decision for bounded Hermes prompt transport. Do not retry tha-exec-1787859067395-dcd2736a or registryPath.
DO_NOT_REOPEN: the five completed scope bootstraps listed above; the disposable-json-fixture helper implementation; the Gate 8 attempt-diagnostic-preservation capability (tha-dec-6500227a0828c2a22c91d2038708439d) — all SUCCEEDED and verified live
DO_NOT_TOUCH: historical decisions/receipts, gate9-current-decision.json (other than via the governed approve/execute flow), transition-current-decision-owner.mjs (pre-existing independent registry-writer, out of scope, not to be resolved incidentally), sourceRequestId, Activity Projection, Admin UI, application source, Cookbook/Pantry/Planner/Hermes, secrets, and unrelated dirty work

SAFE_FOR_OTHER_AGENT_TO_CONTINUE: yes
IF_NO_WHY: n/a

TRUST_CHECK:

- highest-risk unresolved claim: whether the recommended Option A fix (skip directory entries) could ever hide a case where a directory legitimately needed dirty-pre-state protection; investigation concluded no (every downstream consumer already assumes file-shaped entries, and outsideScopeStatus() already treats execution-worktrees/ as excluded for a related purpose) but this has not yet been proven by an actual implementation + regression
- evidence needed: the repair decision's own dedicated regression (real scratch git repo + real nested worktree, per the investigation's verification plan), genuinely executed and Hermes-reviewed
