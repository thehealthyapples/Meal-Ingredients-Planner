# MyFitnessPal comparison evidence update

- **Date:** 19 November 2026
- **Repository:** `G:\The Healthy Apples\Applications\GitHub\tha-integrated-dev-g-native-20261003`
- **Branch / starting HEAD:** `feat/integrated-dev` / `9b93b18b426f533e8043e888850c020c9c333303`
- **Governance preflight:** Read `AGENTS.md`, `PROJECT_GOVERNANCE.md`, `docs/architecture/README.md`, mandatory UX authority `docs/architecture/GOVERNING_EXPERIENCE_ARCHITECTURE.md`, `docs/ai-operating-model/principles.md`, `risk-and-approval.md`, `rollback-and-output.md`, `evidence-and-architecture.md`, and `implementation-and-compliance.md`. Standing authority for the verified dev branch and the user's instruction authorize this scoped update. Risk: **Amber** because public competitor capability claims are being refined.
- **Rollback:** `rollback/CMP-MFP-evidence-20261119` → `9b93b18b426f533e8043e888850c020c9c333303`.
- **Architecture:** The existing comparison component remains the single owner of its public competitor evidence row. No duplicate state, workflow, runtime store, service or API was introduced. **AI compliance:** Not applicable; no THA AI behavior changed.
- **Scope:** Review and update the MyFitnessPal row only, plus research/session records. No app-market ranking, product commitment, competitor login, or deployment.

## Changes and impact

Reviewed all 30 comparison tasks against MyFitnessPal official help pages. Updated claims for household-size planning, tier/region limits, recipe import, photo meal logging, grocery lists, diary/nutrition, weight, barcode and weekly reporting. Added source-specific neutral unknowns for individual eater profiles, social import, external plan import, budget comparison, mood/energy, offline barcode lookup, pantry functions, AI recipe tailoring and guided cooking. No confirmed No ratings were added.

**Data impact:** Static comparison copy/data and Markdown reports only; no user/persistent data reads or writes, schema changes or backfill.

**Trust check:** Material support claims link to official product help pages. Highest residual uncertainty: feature availability and real-world behavior may vary by account, region, language, platform and rollout; no hands-on test was conducted.

**Definition of done:** All 30 tasks reviewed; statuses preserve unknown vs absence; evidence saved; build passes; scoped changes committed locally; no push/deploy.

**Acceptance evidence:** Open `/features&compare`, select MyFitnessPal at the top, and review its sorted features and evidence details. Expected: tier and region caveats appear; undocumented items remain grey, never red by silence. Build succeeded. Browser acceptance was not run.

**Rollback:** Revert the scoped commit; rollback tag above anchors the pre-change commit. Preserve unrelated worktree changes.

## Verification

- `git diff --check` — passed after removing a trailing blank line in the session index.
- `npm run build` — completed successfully; output includes existing Browserslist, PostCSS, large-chunk, and server bundling warnings.`n- `npm run typecheck` — failed with existing TypeScript diagnostics in unrelated files; a second filtered run confirmed no diagnostic references `features-compare-page.tsx`.
- Tests were not run; user asked to continue the evidence update, not add or run tests.
- Live services, databases, scheduled tasks and configuration: not touched.

## SUGGESTIONS

Continue the same evidence audit with the next high-overlap competitor. Market popularity ranking remains a separate evidence task after the competitor pool is reviewed.