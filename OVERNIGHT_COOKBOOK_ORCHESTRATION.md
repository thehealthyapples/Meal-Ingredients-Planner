# Cookbook Overnight Orchestration — 2026-08-13/14

Acceptance owner: Colin. Colin was asleep; no overnight artifact is Home Owner-approved.
Integration/orchestration owner: ChatGPT.
Visual worker: Claude Code, bounded isolated worktrees only.

## Safety and delivery constraints observed

- Local work only: no push, PR, staging, production deployment, or credential use.
- No Codex continuation was launched; the requested 64% allowance was preserved.
- Claude and Codex made no commits/tags/pushes/deployments.
- Every technically completed integration phase received a local commit and annotated rollback tag.
- No additional cron jobs were scheduled.

## Checkpoints

### Approved historical baseline

- Commit: `616e547cc3bca4a96fee12db73e4253914874473`
- Tag: `checkpoint/cookbook-phase-1-approved-20260813`
- This is the only Home Owner-approved framing checkpoint named here; it predates later page-correctness and functional parity.

### Phase A — functional parity + unapproved Page Correctness baseline

- Commit: `e9757de9b0db333399054c5fdaa7d32f87a557bc`
- Tag: `checkpoint/cookbook-functional-parity-verified-20260813`
- State: TECHNICALLY VERIFIED, NOT HOME OWNER-APPROVED.
- Verified at checkpoint: parity/scan/safety/Real Book contracts, 28/28 seed, 160/160 safety convergence, production build, deterministic desktop/mobile web-search→preview→save journey.
- Evidence: `artifacts/cookbook-real-book-functional-parity-review-diagnostic/` and `artifacts/cookbook-real-book-functional/LEGACY_GRID_PARITY_MATRIX.md`.

### Phase B — crisp-text integration

- Commit: `f4a563b2eac1245a8704647111fe2f1c71528b39`
- Tag: `checkpoint/cookbook-crisp-text-verified-20260814`
- State: TECHNICALLY VERIFIED, NOT HOME OWNER-APPROVED.
- Delta: removed text-rasterising page-plane 3D transforms and gutter masks; removed whole-slot multiply from live text; retained multiply on imagery; added objective clarity assertions.
- Passes: focused parity/scan/safety/Real Book contracts; 28/28 seed; 160/160 safety convergence; production build; deterministic desktop/mobile trusted-preview/save journey with empty browser-error arrays.
- Evidence: `artifacts/cookbook-page-fidelity-integrated/`, `artifacts/cookbook-phase-b-*.log`.
- Honest failures retained: first safety invocation lacked `DATABASE_URL` and failed at module startup; rerun with a non-routable local placeholder passed 160/160 without database contact. First full-server capture attempt failed because the placeholder DB could not run startup migrations; Vite-only client capture then passed.

### Phase C — trusted-preview legibility

- Commit: `aa001be68afdf91885e7ac6e1e8ca30cf7ed9bb7`
- Tag: `checkpoint/cookbook-trusted-preview-verified-20260814`
- State: TECHNICALLY VERIFIED, NOT HOME OWNER-APPROVED.
- Claude source: new isolated worktree `tha-cookbook-trusted-preview-claude`, exact Phase B baseline, verified `claude-opus-4-8`, narrow CSS/contract brief only.
- Claude early/final evidence:
  - `C:/Users/Colin/The Healthy Apples/GitHub/tha-cookbook-trusted-preview-claude/artifacts/cookbook-trusted-preview-claude/EARLY_FINDINGS.md`
  - `C:/Users/Colin/The Healthy Apples/GitHub/tha-cookbook-trusted-preview-claude/artifacts/cookbook-trusted-preview-claude/FINAL_FINDINGS.md`
  - `C:/Users/Colin/The Healthy Apples/GitHub/tha-cookbook-trusted-preview-claude/artifacts/claude-trusted-preview-run.json`
- Integrated delta: scoped print hierarchy for trusted results/preview, separate result name/source lines, mobile clamps, objective contract assertions. No TSX/functionality/API/data/credentials/dependencies/navigation/page-plane changes.
- Independent passes: focused parity/scan/safety/Real Book contracts; 28/28 seed; 160/160 safety convergence; production build; `git diff --check`; cached-diff secret-pattern scan; deterministic desktop/mobile trusted journey with no browser errors.
- Live computed layout: desktop title 34.56px/subhead 18.225px Georgia, mobile title 31.2px/subhead 13.1625px Georgia; representative preview last child inside page and page safe scroll/client heights equal (618/618 desktop, 585/585 mobile).
- Evidence: `artifacts/cookbook-trusted-preview-integrated/`, `artifacts/cookbook-phase-c-*.log`.

### Phase D — independent review and morning packet

- Status: COMPLETE; final governance commit/tag follows this ledger update.
- ChatGPT independently inspected the Phase B and Phase C diffs, reran focused contracts/build and governed safety gates, generated real-app captures, measured live computed layout/fit, checked staged content for common credential signatures, and stopped the local Vite server.
- No full-repository `npm test` was run; the governed Cookbook-focused suites and production build were run instead. No claim is made beyond those exact checks.

## Final technical candidate and rollback order

1. Current candidate code: `aa001be68afdf91885e7ac6e1e8ca30cf7ed9bb7` / `checkpoint/cookbook-trusted-preview-verified-20260814`.
2. Roll back trusted-preview typography only: `f4a563b2eac1245a8704647111fe2f1c71528b39` / `checkpoint/cookbook-crisp-text-verified-20260814`.
3. Roll back all overnight visual corrections: `e9757de9b0db333399054c5fdaa7d32f87a557bc` / `checkpoint/cookbook-functional-parity-verified-20260813`.
4. Historical Home Owner-approved framing baseline: `616e547cc3bca4a96fee12db73e4253914874473` / `checkpoint/cookbook-phase-1-approved-20260813`.

## Unresolved visual/acceptance caveats

- Colin has not reviewed or approved Phase A, B, or C.
- The flat-page crispness correction intentionally sacrifices subtle 3D text direction to avoid rasterisation blur.
- Very long external recipes may clip because trusted preview lists are complete inside a fixed non-scrolling paper field; changing that requires a functional/TSX decision and was out of scope.
- Mobile page-turn/bottom-navigation composition was explicitly outside the narrow Claude Phase C brief and remains a visual caveat for Colin.
