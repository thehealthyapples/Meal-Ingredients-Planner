
# Session: LAUNCH1_THA_Launch_Readiness_Audit

| Field | Value |
|---|---|
| **Session ID** | `LAUNCH1_THA_Launch_Readiness_Audit` |
| **Rollback ID** | `rollback/LAUNCH1-launch-readiness-audit-20260718` → `24e37d20` |
| **Start time** | 2026-07-18T11:55:11Z UTC |
| **Current stage** | Complete — awaiting owner review |

## Objective
Fresh first-principles launch readiness audit of The Healthy Apples across 17 areas.
**AUDIT ONLY — implement nothing.** Prior completion reports and percentages are
explicitly disregarded; the repository is assessed exactly as it exists today.

## Files being modified
- `docs/investigations/platform/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md` — the sole deliverable (new file).
- `.engineering/session/` — run file and dashboard only.
No product source, schema, config or test file is touched by this session.

## Checkpoints
- [x] Read `docs/architecture/README.md` (Architecture Bootstrap, STEP 2).
- [x] Rollback protection created: `rollback/LAUNCH1-launch-readiness-audit-20260718` → `24e37d20`.
- [x] Baseline gates executed directly (not read from docs):
      - `tsc --noEmit` → **251 errors**; baseline records 168; `typecheck:ci` → **RED, 20 regressions**.
      - `npm run verify:publication` → **RED**, 4 domains in publication failure (Meals, Meal Templates, Pantry, Nutrition Boost/Uplift); 76 checks: 50 pass / 21 warn / 5 fail.
      - `npm run build` → **PASS** (dist/index.cjs 3.9 MB).
      - `origin/main` = `3ef7e8ef` (2026-06-29); working branch **147 commits ahead** — 19 days of work never deployed.
      - 5 orphan test files referenced by no npm script; 147 of 150 `test:*` scripts wired into `npm test`.
- [x] Ten parallel first-principles area audits commissioned across all 17 assessed areas.

- [x] All 17 areas assessed; `docs/investigations/platform/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md` written.

**Last checkpoint:** deliverable complete. Nothing implemented; no product source touched.

## Headline result
**Overall build completion 41% · commercial launch readiness 25%.**
Four areas independently block a paid launch: Commercial Readiness (12%),
Production Foundation (32%), Cookbook (30%), Food Intelligence (30%).
Recommended route is Path B (§6) — narrow the launch surface by *withdrawing*
indefensible features rather than fixing them: ~10–14 weeks.

## Next action
Owner to review the audit. First decision required: accept or reject **Path B**
(§6) — specifically whether to withdraw pricing/store-comparison/partners, the
Apple Score and derived NOVA, the unsigned nutrition-benefit layer, and the
pantry inventory claims before launch rather than fixing them.

## Blockers
None for the audit itself. Two repository facts the owner should know immediately:
1. **The committed repository does not build** — `client/src/App.tsx:35` imports
   `food-comparison-page.tsx`, which is untracked (verified by fresh clone). The
   Companion write-action layer is untracked too and would be lost to `git clean`.
2. **`origin/main` is 147 commits / 19 days behind** the working branch, and
   production deploys from `main` — so no recent security or convergence work is live.
3. **`npm test` cannot pass in CI.** Measured: 33/147 suites in 50 min → ~3.7 h
   projected, against `timeout-minutes: 45` in `.github/workflows/ci.yml:51`. This
   is the root cause of CI never having passed (2 runs, 2 failures, `npm test` and
   `npm run build` skipped both times). Parallelising the runner is the fix, and it
   is a prerequisite for every other quality claim in the repository.

## Note on file placement
The deliverable sits at `docs/investigations/platform/LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md`
as explicitly instructed. `repo-structure-verify.sh` fails "docs/investigations/ has
no loose files" — this check was **already failing** before this session
(`AFI_VERIFY1_…md` was already loose); this file adds to it. Moving it into a
workstream subfolder would clear the check, and needs an owner decision.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
