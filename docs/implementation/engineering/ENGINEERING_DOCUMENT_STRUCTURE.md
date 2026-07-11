# DOCSTRUCT1 — Engineering Document Structure (Permanent Workstream Organisation)

**Date:** 2026-07-10
**Type:** Repository housekeeping + governance. No application behaviour, schema, or production change.
**Risk:** 🟢 GREEN — file moves (history-preserving), documentation-path updates in comments, and governance/tooling edits.
**Governing documents read first:** [`docs/architecture/README.md`](../../architecture/README.md) (Architecture Bootstrap), [`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md) (HOUSE2), [`ENGINEERING_WORKFLOW.md`](../../architecture/ENGINEERING_WORKFLOW.md).
**Extends:** [`../governance/REPOSITORY_HOUSEKEEPING_AND_STRUCTURE.md`](../governance/REPOSITORY_HOUSEKEEPING_AND_STRUCTURE.md) (HOUSE2), which established workstream filing for `docs/implementation/`. This applies the same standard to `docs/investigations/` and makes the vocabulary permanent and enforced.

---

## Rollback Information

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/before-docstruct-workstream-organisation-20260710` |
| Commit at tag | `610e4d7b427ddd71aa3e51dc86fbf588977d92d6` |
| Rollback command | `git checkout rollback/before-docstruct-workstream-organisation-20260710 -- docs .engineering` |

Created before any file was touched, per `ENGINEERING_WORKFLOW.md` STEP 1.

**A tag protects committed state only.** The working tree already carried extensive
uncommitted work from prior INT1 workstreams (DEC1, ATTN1, KNOW5, LEARN1, COACH1,
COMP2, DEVWORLD1–3, BENCHINT, and more — many files **untracked**). This work
**moved and re-pathed** those documents but changed none of their content beyond the
filing path. Because many moved files were untracked, the tag does not capture them;
they remain on disk and are recoverable from the working tree, and every *tracked*
move is a git rename (history preserved).

---

## 1. Mission

Make workstream-based documentation organisation a **permanent, governed standard**.
Before this work, `docs/implementation/` was already filed by workstream (HOUSE2) but
`docs/investigations/` held **383 loose files** at its root. This work files those by
workstream using the **same vocabulary**, updates every affected reference, adds an
index to each root, updates the Engineering Workflow so future reports are filed
automatically, and extends the structure verifier to enforce it.

## 2. Review of the starting structure

| Tree | Before |
|---|---|
| `docs/implementation/` | Filed by workstream (HOUSE2): 8 folders + 1 loose file (`DEVWORLD3…`, created by the preceding task) |
| `docs/investigations/` | **383 loose files** at the root + a `backups/` folder |

## 3. The governed workstream vocabulary (both trees)

One vocabulary now governs **both** `docs/implementation/` and `docs/investigations/`,
so a subject sits in the same-named folder in either tree. Defined canonically in
[`REPOSITORY_CONVENTIONS.md`](../../architecture/REPOSITORY_CONVENTIONS.md) §4:

`intelligence` · `knowledge` · `benchmarking` · `cookbook` · `planner` · `ux` ·
`platform` · `governance` · `engineering` · `admin` · `development_world`

Changes to the pre-existing implementation vocabulary: **`production/` folded into
`platform/`** (one name across both trees), and **`cookbook/`, `development_world/`,
`engineering/`** added. A workstream folder is materialised only when a document needs
it, so each tree carries a subset.

## 4. Files moved

**Total moves: 387** (383 investigations + 4 implementation), each history-preserving
(`git mv` where tracked; plain `mv` for files that were untracked, which have no history
to preserve). Git rename-detection confirms **526 renames** across the staged docs tree.

### `docs/investigations/` — 383 files → 10 workstream folders

| Workstream | Files |
|---|---|
| `knowledge/` | 121 |
| `planner/` | 70 |
| `ux/` | 60 |
| `intelligence/` | 58 |
| `cookbook/` | 30 |
| `engineering/` | 19 |
| `platform/` | 11 |
| `benchmarking/` | 7 |
| `governance/` | 4 |
| `development_world/` | 3 |

`backups/` (9 files — historical patch files and agent transcripts) was left in place
and **never rewritten**, matching the HOUSE2 rule that editing a stored patch or
transcript falsifies a historical record.

Classification was performed by a **deterministic ordered-rule classifier** (prefix/
keyword families + an explicit override list for cross-cutting cases), so the filing is
reproducible and auditable rather than ad-hoc. Files whose subject spans two workstreams
were filed in the closest single home per `REPOSITORY_CONVENTIONS.md` §4 (e.g. the
`NUTRITION_BOOST_*` feature stream → `intelligence/`; the `WS0/WS0X/WS1–WS11` food
programme → `knowledge/`; `HOUSEHOLD_COMPATIBILITY_*` → `planner/`). The one non-`.md`
artefact (`PREMIUM_RECIPE_RESTORE_1558_1559.sql`) was filed with its subject in
`cookbook/`.

### `docs/implementation/` — 4 moves

| From | To |
|---|---|
| `DEVWORLD3_DEVELOPMENT_WORLD_ADMIN_HOUSEHOLDS.md` (loose root) | `development_world/` |
| `benchmarking/DEVWORLD2_DEVELOPMENT_WORLD_IMPORT.md` | `development_world/` |
| `benchmarking/DEVWORLD2_IMPORT_VERIFICATION_FINDINGS.md` | `development_world/` |
| `production/PLATFORM_RESILIENCE_AND_OPERATIONS_IMPLEMENTATION.md` | `platform/` |

The now-empty `production/` directory was removed.

## 5. References updated

All references were updated by a mapping-driven rewrite across the **whole working tree**
(tracked *and* untracked files; `backups/` excluded), handling both reference forms:

- **Absolute-form citations** `docs/investigations/<FILE>` / `docs/implementation/<FILE>`
  (prose and source-code comments) → repointed to the workstream path.
- **Relative markdown links** `(../)+investigations/<FILE>` from sibling doc trees →
  workstream path inserted.
- **Outbound relative links inside the 383 moved investigation files** — each file moved
  one level deeper, so its `../` links gained one `../` (37 link fixes across 10 files),
  and one cross-workstream sibling link (`UI1` → `AUDIT1`) was repointed
  `./AUDIT1…` → `../platform/AUDIT1…`.

**Totals:** 407 absolute-form + 43 relative/unified replacements across ~200 files, plus
37 in-file relative-link depth fixes.

**Source files touched are comment-only.** ~20 `.ts`/`.tsx`/`shared/*` files changed, and
every hunk is inside a `//`, `*`, or `/*` documentation-path citation (verified line by
line). **No executable statement, import, type, schema, or configuration was altered.**

## 6. Workflow changes

- **`ENGINEERING_WORKFLOW.md` STEP 5** gained a **"Document location"** subsection: every
  future report is filed at `docs/<investigations|implementation>/<workstream>/<EWO_ID>_<SUBJECT>.md`;
  the folder roots and the repository root may never hold a report (only an index
  `README.md`). It names the §4 vocabulary and points at the enforcing verifier.
- **`REPOSITORY_CONVENTIONS.md`** updated: §2 (both `docs/…` roots forbid loose files),
  §3 (investigations belong in `<workstream>/`), §4 (unified vocabulary table for both
  trees; `production`→`platform`; `cookbook`/`engineering`/`development_world` added),
  §7 (verifier asserts both roots), §8 (DOCSTRUCT1 history).
- **`.engineering/scripts/repo-structure-verify.sh`** extended: it now fails on loose
  files in **either** `docs/implementation/` **or** `docs/investigations/`, permitting
  only a `README.md` index at each root.
- **Index `README.md`** added to each root (`docs/investigations/README.md`,
  `docs/implementation/README.md`) — the single governance/index document each root is
  permitted to hold, listing the workstream folders and pointing to the conventions.

## 7. Verification

**Structure — `.engineering/scripts/repo-structure-verify.sh`: 9/9 PASS**, including the
two new assertions that `docs/implementation/` and `docs/investigations/` hold no loose
files (README index only).

**References — 0 broken links introduced (measured, not assumed).** A link checker
resolved every markdown link and every `docs/(investigations|implementation)/…` citation
across the tree, at a **baseline captured before any move** and again after:

| | Baseline (before) | After |
|---|---|---|
| Broken markdown links (docs/**) | 0 | **0** |
| Broken citations | 21 (pre-existing) | 25 |

The 4 additional broken citations are **not regressions**: each targets a file that
**never existed** (`MIGRATION_JOURNAL_REPAIR_2026-06-28.md`, `DEVWORLD1B_…`,
`INT26_…_CAPABILITY_IMPLEMENTATION.md`, `THA_30_PLANTS_MODAL_V2_IMPLEMENTATION.md` — all
verified absent in the working tree *and* at the rollback tag) or is an ellipsis
placeholder (`BM2_…md`, `EL2_…md`) or a wrong-path self-citation. They surfaced only
because their **source files were untracked at the rollback tag** (prior uncommitted
work), so the baseline scan could not see them; none points at a file this work moved.
Every one of the 383 moved investigation files and 4 moved implementation files resolves
at its new path — proven by "broken markdown links = 0".

**Build.** Because source-file comments were touched, `npm run build` was run rather than
reasoned about. It **succeeded (exit 0)** — client + server bundled to `dist/index.cjs` in
~0.9 s. The only warnings are two pre-existing `import.meta`-in-cjs notes
(`server/tests/benchmark/bundle.ts`, already recorded by HOUSE2, and
`server/development-world/world-reader.ts` from the preceding DEVWORLD3 task) — neither is
in a line this work touched, and both concern code, not the comment edits made here.

## 8. Data Impact

None. No schema change, no migration, no production configuration, no production data
touched. Nothing deployed or pushed.

## 9. Honest gaps

- **Classification is a filing judgment, not a proof.** Cross-cutting documents were filed
  in their closest single workstream; a reasonable reviewer could re-file a handful (e.g.
  a `WX*` experience report that is heavily food-intelligence could sit in `intelligence/`
  rather than `ux/`). The rule set is documented and the moves are history-preserving, so
  any re-file is a one-line `git mv`.
- **Untracked prior work.** Many moved files and several citing files were untracked before
  this task. Their pre-existing dangling references (§7) were left as-is — repairing
  citations to files that never existed is out of this task's scope.
- **`backups/` untouched by design** — historical artefacts are never rewritten, so any
  path they mention is intentionally stale.

## 10. Final folder structure

```
docs/
  investigations/
    README.md            (index — the only file at the root)
    admin/               (none yet)      knowledge/        (121)
    benchmarking/  (7)    planner/          (70)
    cookbook/     (30)    platform/         (11)
    development_world/(3) ux/               (60)
    engineering/  (19)    backups/          (9, historical — never rewritten)
    governance/    (4)
    intelligence/ (58)
  implementation/
    README.md            (index — the only file at the root)
    admin/         (7)    intelligence/     (75)
    benchmarking/ (19)    knowledge/        (40)
    cookbook/      (5)    planner/           (3)
    development_world/(3) platform/          (1)
    engineering/   (1, this report)         ux/  (22)
    governance/   (12)
```

---

## Trust Check

- Rollback identifier created and reported before the first change: **yes**.
- Governing architecture read first (`docs/architecture/README.md`, conventions, workflow): **yes**.
- "0 broken links" is a measured baseline-vs-after result; the 4 extra broken citations were each proven to target never-existent files, not moved files.
- Document contents unchanged except where a path required updating (verified: source changes are comment-only; investigation bodies changed only in relative-link depth).
- History preserved: 526 git renames; filenames unchanged.
- Scope respected: no application behaviour, no schema, no production change.
