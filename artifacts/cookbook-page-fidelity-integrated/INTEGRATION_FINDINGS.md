# Phase B — crisp-text integration evidence

Status: **TECHNICALLY VERIFIED; NOT HOME OWNER-APPROVED**

Baseline: `e9757de9b0db333399054c5fdaa7d32f87a557bc` (`checkpoint/cookbook-functional-parity-verified-20260813`)

## Integrated delta

ChatGPT independently reviewed Claude Opus 4.8's bounded isolated-worktree result and integrated only the narrow clarity correction:

- removed desktop page-plane `perspective()/rotateY()` transforms;
- removed desktop page-plane `mask-image` gutter fades;
- removed `mix-blend-mode` from the live text slot;
- retained `mix-blend-mode: multiply` on page imagery/placeholders only;
- added objective Real Book contract assertions for those invariants.

No functionality, API, data, dependencies, credentials, navigation, routing, or TSX changed in Phase B.

Claude source report: `C:/Users/Colin/The Healthy Apples/GitHub/tha-cookbook-page-fidelity-claude/artifacts/cookbook-page-fidelity-claude/CLAUDE_FINDINGS.md`.

## Independent verification

- `git diff --check`: PASS (LF/CRLF notices only).
- Legacy-grid parity contract: PASS.
- Canonical scan-entry contract: PASS.
- Search/preview household-safety contract: PASS.
- Real Book contract, including crispness invariants: PASS.
- Canonical Cookbook seed suite: **28 passed, 0 failed**; live DB checks skipped because `DATABASE_URL` was not set.
- Safety-gate convergence: **160 passed, 0 failed** when rerun with a non-routable local placeholder `DATABASE_URL`; no database query was made. The first invocation without `DATABASE_URL` failed during module startup and is retained in `artifacts/cookbook-phase-b-focused-tests.log`.
- Production build: PASS. Existing warnings remain (Browserslist age, PostCSS `from`, large chunks, CJS `import.meta`); no build error.
- Deterministic Playwright desktop/mobile capture: PASS after using the Vite-only client server. The first full-server attempt failed because the deliberately non-routable placeholder database caused startup migration connection refusal; no external or real database was contacted.
- Browser journey: desktop and mobile local search, trusted source results, keyboard preview, source attribution, original link, save, return to My Cookbook, and saved recipe rendering all PASS; `errors: []` for both viewports.

## Evidence

- `artifacts/cookbook-page-fidelity-integrated/desktop-1440x900-collection.png`
- `artifacts/cookbook-page-fidelity-integrated/desktop-1440x900-recipe.png`
- `artifacts/cookbook-page-fidelity-integrated/desktop-1440x900-trusted-preview.png`
- `artifacts/cookbook-page-fidelity-integrated/desktop-1440x900-trusted-saved.png`
- `artifacts/cookbook-page-fidelity-integrated/mobile-390x844-collection.png`
- `artifacts/cookbook-page-fidelity-integrated/mobile-390x844-recipe.png`
- `artifacts/cookbook-page-fidelity-integrated/mobile-390x844-trusted-preview.png`
- `artifacts/cookbook-page-fidelity-integrated/mobile-390x844-trusted-saved.png`
- `artifacts/cookbook-page-fidelity-integrated/interaction-results.json`
- `artifacts/cookbook-phase-b-focused-tests.log`
- `artifacts/cookbook-phase-b-safety-convergence.log`
- `artifacts/cookbook-phase-b-build.log`

## Caveats

The after-state is captured and technically exercised, but this environment did not provide ChatGPT with an image-analysis tool, so no pixel-level visual acceptance claim is made. The known visual caveats from Phase A therefore remain unresolved pending a bounded visual pass and Colin's review: trusted-preview type scale, cramped desktop trusted-result labels, and weak mobile page-turn/bottom-navigation composition. The flat-page clarity correction also intentionally trades subtle 3D print direction for sharper live text.
