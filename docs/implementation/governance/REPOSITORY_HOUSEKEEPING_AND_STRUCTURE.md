# HOUSE2 — Repository Housekeeping and Structure

**Date:** 2026-07-10
**Type:** Repository housekeeping. No application behaviour, schema, or production change.
**Risk:** 🟢 GREEN — file moves, deletions of verified duplicates, and documentation.

---

## Rollback Information

| Item | Value |
|---|---|
| Rollback tag | `rollback/HOUSE2-repository-cleanup-20260710` |
| Commit | `678b1aee2eeb2df775d1bc7f163c30eda1d39df4` |
| Rollback command | `git checkout rollback/HOUSE2-repository-cleanup-20260710` |

Created before any file was touched, per `ENGINEERING_WORKFLOW.md` STEP 1.

**A tag protects committed state only.** The working tree carried 31 modified
tracked files and untracked sources from earlier INT1 workstreams (DEC1, ATTN1,
KNOW4/5, LEARN1, COACH1, COMP2) which the tag does not capture. This housekeeping
therefore touched **none of them**. Every file deleted here was additionally
snapshotted to a scratch directory before removal, and all 22 deletions were made
with `git rm`, so each remains recoverable from git history.

---

## Summary

The repository root held 43 report and diagnostic files. Twenty-one of them were
stubs, summaries, or byte-identical copies of documents already filed under
`docs/investigations/` — moving them would have overwritten the canonical
originals. One was a raw `git diff` dump from a mistyped shell command.

After this work the root contains only project configuration, application entry
files, and standard project files. Every implementation report is filed by
workstream, every document has exactly one canonical home, and the rules are
mechanically enforced.

---

## Files deleted (22)

**Accidental artefact (1)** — `tatus`: 8,780 bytes of raw `git diff` output for
`client/src/components/ShoppingListView.tsx`, produced by a redirect from a
mistyped `git status`.

**Redundant root copies (21)** — every one verified to have a canonical twin in
`docs/investigations/` before deletion, and verified to have **no inbound
reference to its root path** anywhere in the repository:

| Kind | Count | Evidence |
|---|---|---|
| Pointer stubs (`See full investigation: docs/investigations/X`) | 16 | e.g. `MEAL_ENHANCEMENT_PLATFORM_ARCHITECTURE.md` — 322 b at root vs 25,417 b canonical |
| Short summaries citing the full report | 4 | e.g. `PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md` — 1,343 b vs 15,034 b canonical |
| Byte-identical duplicate | 1 | `NUTRITION_BOOST_RUNTIME_PROOF_INVESTIGATION.md` |

Full list: `INGREDIENT_IMAGERY_INFRASTRUCTURE_IMPLEMENTATION.md`,
`INGREDIENT_IMAGERY_LIBRARY_INVESTIGATION.md`,
`MEAL_DIALOG_INFORMATION_DENSITY_REDUCTION.md`,
`MEAL_ENHANCEMENT_MEAL_FIT_PROTECTION_RULE.md`,
`MEAL_ENHANCEMENT_PLATFORM_ARCHITECTURE.md`,
`MEAL_ENHANCEMENT_SYSTEM_CONSOLIDATION_INVESTIGATION.md`,
`MEAL_ENHANCEMENT_WEEKLY_REUSE_IMPLEMENTATION.md`,
`MEAL_ENHANCEMENT_WEEKLY_REUSE_INVESTIGATION.md`,
`MEAL_VARIETY_NUDGE_RETIREMENT.md`, `NUTRITION_BOOST_COMPACT_UX_REFINEMENT.md`,
`NUTRITION_BOOST_INGREDIENT_VISIBILITY_FIX.md`,
`NUTRITION_BOOST_RUNTIME_PROOF_INVESTIGATION.md`,
`PLANNER_ARCHIVE_HOUSEHOLD_FAMILIARITY.md`,
`PLANNER_HISTORY_RETENTION_INVESTIGATION.md`,
`PLANT_DIVERSITY_CATEGORY_COMPLETION_IMPLEMENTATION.md`,
`PLANT_DIVERSITY_COUNTER_ACCURACY_FIX.md`,
`PLANT_DIVERSITY_COUNTER_INVESTIGATION.md`,
`PLANT_DIVERSITY_EXPLORER_IMPLEMENTATION.md`,
`PREMIUM_RECIPE_SMART_PLANNER_AUDIT.md`, `PREMIUM_RECIPE_SMART_PLANNER_FIX.md`,
`THIRTY_PLANTS_THIS_WEEK_COPY_REFRESH.md`.

**Duplicate content removed (2, converted to stubs rather than deleted):**
`docs/investigations/knowledge/NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md` and
`docs/investigations/knowledge/NK2_THA_NUTRITION_METHODOLOGY.md` were byte-identical copies
of their promoted counterparts in `docs/architecture/`. Because documents link to
those investigation paths, they were replaced with pointer stubs rather than
removed — matching the convention the architecture README already states for
promoted investigations. The governing NK2 document's citation of NK1 was
repointed from the investigation path to the canonical architecture path.

---

## Files moved (21)

**Root → `docs/implementation/` (4 unique reports, no canonical twin):**
`INTQ4_INTELLIGENCE_BENCHMARK_EXECUTION_PLATFORM_IMPLEMENTATION.md`,
`INTQ6_BENCHMARK_HOUSEHOLD_WORLD_IMPLEMENTATION.md`,
`INTQ8_COMPANION_INTELLIGENCE_ARCHITECTURAL_HARDENING_IMPLEMENTATION.md`,
`COMPACT_EXPANDABLE_NUTRITION_BOOST_ROWS.md`.

**Root → `docs/investigations/` (3):**
`INTQ7_FIRST_THA_COMPANION_INTELLIGENCE_ASSESSMENT.md`,
`SMART_PLANNER_DIETARY_PATTERN_AUDIT.md`,
`GITHUB_TO_RENDER_RELEASE_MODEL_CHECK_2026-06-28.md`.

`docs/investigations/engineering/current_dev_status.md` had already recorded
`SMART_PLANNER_DIETARY_PATTERN_AUDIT.md` as *"created at root by mistake"*.

**Root → `docs/implementation/ux/` (11 legacy `.txt` reports):**
`active-tab-colour-report.txt`, `apple-score-trust-gate-complete.txt`,
`compact-pantry-row-report.txt`, `compact-qty-row-report.txt`,
`pantry-quantity-foundation-summary.txt`,
`pantry-quantity-foundation-workings.txt`, `shop-cta-align-report.txt`,
`shop-nav-report.txt`, `shopping-multiselect-resolution-fix.txt`,
`shopping-review-resolution-summary.txt`,
`shopping-row-standardisation-report.txt`.

Each records a rollback identifier and an implementation outcome, so they are
historical records rather than temporary diagnostics. Names are grandfathered.

**Root → `scripts/` (2 developer utilities):** `test-db-connect.ts` (database
connectivity probe), `_wx96_shoot.mjs` (Playwright screenshot harness). Nothing
imports either.

**Root → `docs/` (1):** `SMP-Features.md` — application documentation.

### Deliberately left at the root

- `eng.traineddata` — **runtime data asset, not an artefact.**
  `server/services/ocr.ts` calls `Tesseract.recognize(buffer, "eng", …)`, and
  `tesseract.js` resolves this language file from the working directory. Moving it
  would change OCR behaviour, which is out of scope.
- `RELEASE.md`, `MIGRATIONS.md`, `replit.md` — standard project documents;
  `scripts/verify-prod.ts` cites `RELEASE.md`.
- `deploy.sh`, and all build/tool configuration.
- `thehappyapplesexport1.zip` (340 MB) — gitignored, therefore never part of the
  repository. Not touched. **It almost certainly should not live in the workspace
  and is worth removing manually.**

---

## Folders created (8)

`docs/implementation/` previously held 174 loose files. They are now filed by
workstream — not one folder per implementation:

| Folder | Files | Covers |
|---|---|---|
| `intelligence/` | 75 | Intelligence Platform, capability bindings, companion, engines, Food Intelligence runtime |
| `knowledge/` | 40 | Canonical knowledge, evidence, food imports, knowledge review workbench |
| `ux/` | 20 | Companion presence and identity, UI reports (incl. the 11 legacy `.txt`) |
| `benchmarking/` | 17 | Benchmark framework, execution, measurement, reporting |
| `governance/` | 11 | Architecture promotions, specifications, engineering rules |
| `admin/` | 7 | Admin domain shell, navigation, regressions |
| `planner/` | 3 | Meal planning and meal discovery |
| `production/` | 1 | Platform resilience and operations |

`production/` holds a single report today. It is a durable home for a workstream,
not a folder created for one implementation; release and operations reports belong
there rather than being scattered.

---

## Repository conventions created

[`docs/architecture/REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md)
is now the canonical source for folder ownership, naming, where new reports
belong, where engineering tooling belongs, and what the root permits. It is
indexed in `docs/architecture/README.md` under Platform Governance.

The five rules it establishes:

1. The repository root contains only project configuration, application entry
   files, and standard project files.
2. Engineering tooling lives under `.engineering/`.
3. Application documentation lives under `docs/`.
4. Every document has exactly one canonical home.
5. New reports must never be written to the repository root.

Rule 5 is enforced, not merely asserted:
`.engineering/scripts/repo-structure-verify.sh` fails if a report appears at the
root, if `docs/implementation/` has loose files, or if any two documents share
identical content.

---

## Verification performed

**Structure — `.engineering/scripts/repo-structure-verify.sh`: 8/8 pass.**
Root allowlist; no `.md`/`.txt` reports at root; no loose files in
`docs/implementation/`; no duplicate documents by content hash; no engineering
tooling under `docs/`; conventions document exists and is indexed.

**References — 0 broken links introduced.** 361 markdown links across `docs/`
were resolved against the filesystem. To distinguish damage from pre-existing
breakage, the identical checker was run against the pre-cleanup tree in a
temporary git worktree checked out at the rollback tag:

| | Baseline (before) | After |
|---|---|---|
| Broken markdown links | 5 | 0 |

The reorganisation required rewriting **343 path references across 128 files**
(`docs/implementation/X` → `docs/implementation/<workstream>/X`), plus 110
relative-depth fixes and 66 sibling-link fixes inside the moved documents.

Of the 5 baseline breakages, 3 were repaired (`GOV2_NK1_NK2_ARCHITECTURE_PROMOTION.md`
pointed at `./NK1…`, `./NK2…`, `./THA_FOOD_INTELLIGENCE…`, none of which ever
existed beside it; the real targets are in `docs/architecture/`). The remaining 2
are false positives — a literal `![…](…)` ellipsis used in prose to explain
markdown image syntax.

Exactly **one** link was broken by this work and then fixed:
`INTQ7_FIRST_THA_COMPANION_INTELLIGENCE_ASSESSMENT.md` linked to the root-relative
target `server/scripts/intq7-run-full-benchmark.ts`, which resolved while the
document sat at the root; moving it to `docs/investigations/` required the link to
be repointed two levels up.

Three raw path citations remain unresolved and were **not** introduced here —
each is present verbatim at the baseline: a literal placeholder
`docs/implementation/BM2_...md`, and references to
`FI2_EVIDENCE_BACKED_RENDERING.md` and
`INT26_NUTRITION_DISCOVERY_CAPABILITY_IMPLEMENTATION.md`, neither of which has
ever existed.

**Historical records excluded from rewriting.** The 3 Replit agent transcripts
and the 8 patch files under `docs/investigations/backups/` were deliberately not
rewritten — editing a stored patch or transcript would falsify a historical record.

**Build.** No application logic changed. Exactly 6 source files were touched, and
in every case the change is inside a comment that cites a documentation path:

| File | Line | Change |
|---|---|---|
| `server/routes.ts` | 11937 | `// See docs/implementation/intelligence/COACH1_…` |
| `shared/knowledge/foods.ts` | 119 | `// docs/implementation/knowledge/KNOW1_…` |
| `server/tests/benchmark/bundle.ts` | 39, 47 | `/* See docs/implementation/benchmarking/BENCH2…` |
| `server/tests/benchmark/expectations.ts` | 15 | `* see docs/implementation/benchmarking/INTQ9_…` |
| `server/intelligence/handlers/uplift-read-handler.ts` | 11 | `* docs/implementation/intelligence/INT42_…` |
| `server/intelligence/conversation/companion-actions.ts` | 14 | `* See docs/implementation/intelligence/INT40_…` |

No executable statement, import, type, schema, or configuration was altered.
`.engineering/` is excluded from the build by construction.

Because source files were touched at all, `npm run build` was run rather than
merely reasoned about. It **succeeded (exit 0)**: client built in 13.35 s, server
bundled to `dist/index.cjs`. The one warning emitted — `"import.meta" is not
available with the "cjs" output format`, in `server/tests/benchmark/bundle.ts:19`
— is pre-existing, concerns a line this work never touched, and is unrelated to
the comment edits.

---

## Data Impact

None. No schema change, no migration, no production configuration change, no
production data touched. Nothing was deployed or pushed.

---

## Trust Check

- Rollback identifier created and reported before the first change: **yes**.
- Governing architecture read first (`docs/architecture/README.md`): **yes**.
- Every deletion verified against a canonical twin *at the moment of deletion*,
  not merely from earlier analysis, and snapshotted first.
- "0 broken references" is a measured result from a baseline comparison, not an
  assumption. The one regression this work introduced was found by that check and
  fixed.
- Scope respected: no application behaviour change, no refactoring, no schema
  change, no production configuration change.

---

## Outcome

Root reduced from 43 report/diagnostic files to 0. 174 implementation reports
filed across 8 workstream folders. 22 files deleted, 21 moved, 2 duplicates
stubbed. Repository conventions established, indexed, and mechanically enforced.

## Next Steps

Nothing in this work has been committed. The working tree also carries
pre-existing INT1 workstream changes that this housekeeping did not author and
did not touch; those should be reviewed separately before any commit that bundles
them. Nothing has been pushed or deployed.
