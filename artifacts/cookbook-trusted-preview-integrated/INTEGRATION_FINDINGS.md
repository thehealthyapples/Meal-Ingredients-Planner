# Phase C — trusted-preview legibility integration

Status: **TECHNICALLY VERIFIED; NOT HOME OWNER-APPROVED**

Baseline: `f4a563b2eac1245a8704647111fe2f1c71528b39` (`checkpoint/cookbook-crisp-text-verified-20260814`).

## Bounded Claude input

Claude Code ran in a new isolated worktree from the exact Phase B checkpoint using verified model `claude-opus-4-8`. It was restricted to the missing trusted-results/preview CSS hierarchy and contract assertions. It did not commit, tag, push, deploy, change functionality/API/data, or access a real database.

- Worktree: `C:/Users/Colin/The Healthy Apples/GitHub/tha-cookbook-trusted-preview-claude`
- Early report: `artifacts/cookbook-trusted-preview-claude/EARLY_FINDINGS.md` in that worktree
- Final report: `artifacts/cookbook-trusted-preview-claude/FINAL_FINDINGS.md` in that worktree
- Run record: `artifacts/claude-trusted-preview-run.json` in that worktree; canonical model recorded as `claude-opus-4-8`

## Integrated change

ChatGPT independently inspected the isolated diff and integrated only:

- scoped `.rb-web-results` typography/list spacing so result name and source render as separate printed lines;
- scoped `.rb-web-preview` title/subhead/body hierarchy matching the existing recipe-page print language;
- mobile-specific trusted-region type clamps;
- objective contract guards for heading scale, serif face, body minimum, separate result-line layout, spacing, muted source, and no leakage into the global page font.

No TSX, functionality, API, route, data, dependency, lockfile, page-plane geometry, compositing, navigation, or capture-script change was integrated.

## Independent verification

- Real Book contract: PASS.
- Legacy-grid parity contract: PASS.
- Canonical scan-entry contract: PASS.
- Search/preview household-safety contract: PASS.
- Canonical Cookbook seed suite: **28 passed, 0 failed**; live DB checks skipped.
- Safety-gate convergence: **160 passed, 0 failed**, using only a non-routable local placeholder `DATABASE_URL` to satisfy module initialization; no database query/contact.
- Production build: PASS with pre-existing warnings only.
- `git diff --check`: PASS (LF/CRLF notices only).
- Deterministic real-app Playwright journey at 1440×900 and 390×844: PASS; trusted search, keyboard preview, source/original link, save and return all exercised; browser error arrays empty.
- Computed live layout at preview state:
  - desktop title `34.56px`, Georgia; subhead `18.225px`, Georgia; last child inside page; page safe area `618/618` scroll/client height;
  - mobile title `31.2px`, Georgia; subhead `13.1625px`, Georgia; last child inside page; page safe area `585/585` scroll/client height.

## Evidence

- `artifacts/cookbook-trusted-preview-integrated/desktop-1440x900-trusted-preview.png`
- `artifacts/cookbook-trusted-preview-integrated/mobile-390x844-trusted-preview.png`
- sibling collection, recipe and trusted-saved captures in the same directory
- `artifacts/cookbook-trusted-preview-integrated/interaction-results.json`
- `artifacts/cookbook-trusted-preview-integrated/computed-layout.json`
- `artifacts/cookbook-trusted-preview-integrated/measure-preview.mjs`
- `artifacts/cookbook-phase-c-focused-tests.log`
- `artifacts/cookbook-phase-c-seed-safety.log`
- `artifacts/cookbook-phase-c-build.log`

## Remaining caveats

- Representative deterministic preview content fits, but unusually long real external recipes can still clip because the trusted preview renders complete ingredient/method lists in a fixed, non-scrolling paper field. Solving that would require a functional/TSX decision and was deliberately not attempted.
- The separate mobile page-turn/bottom-navigation composition caveat was explicitly outside Claude's narrow brief and remains for Colin's review.
- Captures and technical checks establish candidacy only. Colin has not reviewed or approved this visual state.
