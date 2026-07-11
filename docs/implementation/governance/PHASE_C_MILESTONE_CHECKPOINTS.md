# Phase C — Milestone Checkpoints

**Status:** Complete.
**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**Start:** `a432400` — UIA1 — UI Architecture Discovery investigation
**End of work commits:** `c273b38` — Phase C — Wire the new test suites into npm test
**Governance record:** this document, committed immediately after `c273b38` (a record cannot carry its own SHA).
**Executes:** [`WORKING_TREE_PROTECTION_PLAN.md`](./WORKING_TREE_PROTECTION_PLAN.md)

Phase C protected and checkpointed the working tree into nine coherent milestone
commits. It performed **no repository cleanup**, **no file reorganisation**, and **no
runtime behaviour change**. The working tree went from **793 changed entries to 5**.

---

## 1. What was actually protected

The Working Tree Protection Plan's headline finding was that the repository's history
contained **implementation reports whose code had never been committed**. `UX1` (`2fa5f61`),
`ATTN1` (`f85121e`), `UX0` (`610e4d7`) and `DEC1` (`678b1ae`) were Markdown-only commits;
`BottomNav` appeared **zero times** in the committed `nav-bar.tsx`, and `shared/attention/`,
`home-experience-page.tsx`, `household-observation.ts` and `server/development-world/`
existed nowhere but in the uncommitted working tree.

**That gap is now closed.** Commits 4–6 supply the code those four reports described. The
history no longer claims work that does not exist.

---

## 2. Commit order

| # | SHA | Commit | Files |
|---|---|---|---|
| 0 | — | *Pre-flight backup (not a commit)* | refs bundle + patch + untracked archive |
| 1 | `4c89cc0` | HOUSE3 — Repository structure, document filing, and engineering workflow framework | 684 |
| 2 | `64b1ee5` | PKR1/PKR2/PKR3 + EXP2 + UIA2 — Architecture governance | 12 |
| 3 | `f704210` | HOUSE3 (cont.) — Update doc-path references in source comments | 16 |
| 4 | `048e7fd` | KNOW4 + KNOW5 — Graduated food reports and the composition evidence contract | 19 |
| 5 | `e211186` | ATTN1 + DEC1 + LEARN1 + COACH1 + COMP2 + BENCHINT4 — Intelligence platform | 45 |
| 6 | `07b16a6` | UX0 + UX1 — Home Experience and the canonical Bottom Navigation | 5 |
| 7 | `d9de7b5` | DEVWORLD2 + DEVWORLD3 — Development World reader and admin surfaces | 11 |
| 8 | `13afc76` | COOKBOOK2 + COOKBOOK3 — THA Original Founding Cookbook import | 7 |
| 9 | `c273b38` | Phase C — Wire the new test suites into npm test | 1 |

Ordering principle: **inert before live, dependency before dependent, and the file that
cannot be split goes last.**

Two commits deviate from the plan's numbering, both for correctness:

- **`f704210` (HOUSE3 cont.)** was not in the plan. While preparing the Knowledge commit,
  16 source files turned out to have diffs that were *entirely* doc-path comment churn from
  the reorganisation (e.g. `docs/investigations/WS9_…` → `docs/investigations/knowledge/WS9_…`).
  They were housekeeping wearing a code file's clothing. Rather than let them contaminate
  the Knowledge, Intelligence and Benchmark commits, they were split into their own
  housekeeping continuation. **Verified mechanically: zero non-comment lines changed across
  all 16 files.**
- **Commit 4 (`048e7fd`) was amended** after it was first written. `server/routes.ts` turned
  out to span *three* workstreams, not two — a KNOW4 hunk reroutes a pantry read through the
  evidence-gated report (`server/lib/food-report-evidence.ts`, already in `HEAD` and
  unmodified). That hunk belonged with KNOW4 and was folded in before any later commit
  depended on it. The `rollback/KNOW5-…` tag was moved to the amended SHA.

---

## 3. What each commit protected

**`4c89cc0` — HOUSE3.** The HOUSE2/HOUSE3 reorganisation and the EOM1/ESR1/ESR2
`.engineering/` framework: 547 pure (`R100`) renames, 22 artefacts relocated out of the
repository root, 174 reports filed into workstream folders, index READMEs, and
`REPOSITORY_CONVENTIONS.md`. Also deletes **`tatus`** — a tracked root file containing the
*output of a `git diff`*, committed after a mistyped shell redirection. Docs and inert
tooling only; `.engineering/` is not shipped and not imported by the application.

**`64b1ee5` — Architecture governance.** PKR1/PKR2/PKR3 (the Product Knowledge Registry),
EXP2 (Premium Experience Principles) and UIA2 (the UI Architecture). Closes the
`ARCH-VERIFY1` gap, in which the Experience and UI checklists declared themselves mandatory
while `ENGINEERING_WORKFLOW.md` had never referenced them — leaving both unreachable by
anyone actually following the workflow. Docs only.

**`f704210` — HOUSE3 (cont.).** Doc-path references in source comments. Comment-only.

**`048e7fd` — KNOW4 + KNOW5.** The composition evidence contract: `source_refs`,
`reviewed_at`, `reviewed_by` on the `knowledge_food_nutrients` edge — the food-specific
premise on which every benefit chip rests, and which previously carried no evidence columns
at all. **This is the only commit that changes the database schema.**

**`e211186` — Intelligence.** The Attention Platform (ATTN1), the canonical Decision Engine
(DEC1), household learning (LEARN1), proactive coaching (COACH1), natural conversation
(COMP2) and intent-routing convergence (BENCHINT4). Committed as one unit because they are a
genuine dependency cluster, not a filing convenience: `shared/attention/decision.ts` is
imported by the notice engine, the opportunity engine, the delivery framework,
`intelligence/index.ts` and both client hooks. Splitting further would produce commits that
do not compile.

**`07b16a6` — UX0 + UX1.** The Home Experience page and the canonical BottomNav.
**The most user-visible commit in Phase C**: `/` now redirects to `/home` after login, and
the left DesktopSidebar is retired (retained dormant in `nav-bar.tsx` for cheap rollback).
Wants a look in a real browser, not just a green build.

**`d9de7b5` — DEVWORLD2 + DEVWORLD3.** The Development World reader and its two admin
surfaces, both behind `assertAdmin`. Admin-only: no household-facing change.

**`13afc76` — COOKBOOK2 + COOKBOOK3.** The two founding-cookbook import scripts. Nothing in
`client/`, `server/` or `shared/` imports them — they are run manually, so this commit cannot
change application behaviour.

**`c273b38` — Test wiring.** `package.json` alone, and last, for a mechanical reason given
in §5.

---

## 4. Rollback references

| Tag | SHA | Restores |
|---|---|---|
| `rollback/PHASEC-pre-checkpoint-20260711` | `a432400` | The state before Phase C began |
| `rollback/KNOW5-composition-evidence-20260711` | `048e7fd` | After the schema/evidence commit |
| `rollback/INT-attention-decision-20260711` | `e211186` | After the Intelligence platform commit |
| `rollback/UX-home-bottomnav-20260711` | `07b16a6` | After the user-visible navigation change |

Off-machine snapshot taken before the first commit, still present at
`<scratchpad>/phasec-backup/`:

- `repo-refs.bundle` (104 MB) — **all refs including the 21 stashes**; `git bundle verify`
  reports *"records a complete history"*.
- `uncommitted-tracked.patch` (8 MB) — the full pre-Phase-C diff across 761 tracked files.
- `untracked-files.tar.gz` (1 MB) — all 167 untracked files.
- `pre-flight-status.txt`, `pre-flight-HEAD.txt`, `pre-flight-stashes.txt`.

> **This backup is on the same disk.** It protects against a mistaken Git operation, which
> was the live risk during Phase C. It does **not** protect against loss of the machine. See
> §7.

**Rollback caveat — `048e7fd` is the one commit whose rollback is not purely a Git
operation.** The code reverts cleanly, but the database does not revert itself. **The
migration has not been applied** (Phase C ran no migrations and changed no data), so today a
`git revert` is sufficient. Once it *is* applied, a true rollback additionally requires the
`DROP COLUMN` statements documented in the migration header.

---

## 5. How the three cross-cutting files were handled

`client/src/App.tsx`, `server/routes.ts` and `package.json` were the real constraint on
grouping — not the volume of changes.

**`server/routes.ts` — split three ways by hunk.** Its Intelligence hunks (notice-engine
imports, `GET /api/intelligence/companion/notices`) went to `e211186`; its Development World
hunks (two `assertAdmin` admin routes) to `d9de7b5`; its KNOW4 hunks (the evidence-gated
pantry read) to `048e7fd`. The split was **verified lossless before anything was staged** by
applying all three patches to the `HEAD` version together.

**`client/src/App.tsx` — split two ways by hunk.** UX hunks (`/home` route, BottomNav
replacing DesktopSidebar, `HomeExperiencePage` import, removal of the now-dead `routeToPath`
redirect) to `07b16a6`; Development World hunks (two page imports, two admin routes) to
`d9de7b5`. Verified lossless by rebuilding the file from both patches and diffing against the
working tree, and separately verified that the `App.tsx` committed at `07b16a6` contains
**zero** references to `AdminDevelopmentWorld*` — so that commit stands alone and compiles.

**Both files were fully reassembled with no remainder** after `d9de7b5`, which is the proof
the splits were complete and not merely plausible.

**`package.json` — could not be split, so it went last.** Its `"test"` script is a *single
line* chaining suites from both the Knowledge and Intelligence workstreams. One line cannot
be split across two commits. Had it landed with either workstream, `npm test` would have
invoked `tsx` on test files that did not exist yet, and the suite would have failed at that
commit **for a filing reason rather than a code one**. Before committing, all **59** suites in
the chain were verified to resolve to files that are now committed.

---

## 6. Work intentionally left uncommitted

| Path | Size | Why |
|---|---|---|
| `data/development_world/` | 7.9 MB | **Owner decision, deliberately deferred.** Git keeps blobs forever, so committing is a one-way door. The payload is redundant: the same world as a 2.5 MB `.json` *and* a 1.7 MB `.yaml`. |
| `data/cookbook/` | 3.7 MB | Same. Roughly 4× redundancy: the same 500 recipes as `.json` + `.md` + `.csv` + ten re-cut batch files. |
| `.engineering/session/CURRENT.md` | 1 line | A Stop-hook heartbeat timestamp, rewritten automatically every session. Machine churn; committing it is pointless noise. |
| `.claude/scheduled_tasks.lock` | — | Machine-local runtime lock. **Now gitignored** (`4c89cc0`) so it can never be committed by accident. |

The data decision was put to the repository owner and the answer was **leave uncommitted for
now**. The consequence is explicit and accepted: `server/development-world/`'s reader and the
cookbook import scripts have **no data to read on a fresh clone** until the data (or a
reproducible import) is supplied. Behaviour on this machine is unchanged — the files are still
present, merely untracked, and they are captured in the Phase C backup archive.

Holding the payload back also preserves something useful: the Development World and Cookbook
**code remains independently revertable from the data**.

### Noted, not acted on

Phase C performs no cleanup or reorganisation, so these were recorded rather than fixed:

- `docs/implementation/cookbook/COOKBOOK3_pre_import_system_meal_ids.json` — a 52 KB
  import-time database snapshot filed under `docs/`. It is data, not a document.
- `docs/architecture/capabilities/meal-discovery.md` — a Capability Card that is **not indexed**
  in the architecture README's capabilities table, unlike the other six. (Its code,
  `server/intelligence/bindings/meal-discovery.ts`, was already committed, so the card is
  retrospective filing and was safe to land in `4c89cc0`.)
- **175 pre-existing typecheck errors** at `a432400`. Not caused by, and not touched by, Phase C.

---

## 7. Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` before Phase C (`a432400`) | 175 errors |
| `npx tsc --noEmit` after Phase C (`c273b38`) | **175 errors — identical file set. Zero new errors introduced.** |
| `.engineering/scripts/repo-structure-verify.sh` | **9/9 PASS — "Repository structure is clean"** |
| `App.tsx` / `routes.ts` fully reassembled after their splits | Yes — no unstaged remainder |
| All 59 `npm test` chain targets resolve to committed files | Yes |
| Every content deletion in `4c89cc0` has a surviving copy | 23/23 (the 24th is `tatus`, correctly deleted) |
| Working tree | 793 entries → **5** |

> **`npm test` was not run, and no migration was applied.** Phase C's mandate was to protect
> and checkpoint **without changing runtime behaviour**. Running the suite requires a database,
> and applying `0002_know5_composition_evidence.sql` has an intended, user-visible consequence —
> *benefit chips go dark until a human signs off the composition claims*. That is a deliberate
> product decision, not a checkpoint step, and it is now safely committed and awaiting its own
> gate. Typecheck parity (175 → 175) is the strongest signal available without crossing that line.

### Still outstanding: the branch is not backed up off-machine

`int1-intelligence-platform` now carries **36 local-only commits** (27 before Phase C, plus
these nine) and still exists on **neither `origin` nor `gitsafe-backup`**. The Phase C backup
archive lives on the same disk as the repository.

**Recommended next action, before anything else:**

```
git push -u origin int1-intelligence-platform
```

---

## 8. Readiness

**Ready for repository housekeeping.** The working tree is clean apart from the two data
directories and one heartbeat line. `repo-structure-verify.sh` passes 9/9, the root holds only
permitted files, and every document has one canonical home. Housekeeping now operates on a
committed baseline with per-workstream rollback tags — its blast radius is a `git revert`, not
a lost afternoon.

**Ready for the Platform Discovery & Experience Audit.** The audit needs a repository whose
history tells the truth about what exists, and that was precisely what was broken: four
implementation reports described code that had never been committed. An audit run against
`a432400` would have surveyed a platform whose Attention Platform, Decision Engine, Home
Experience and Bottom Navigation were invisible to every tool that reads the repository — and
would have drawn confident, wrong conclusions. Running it against `c273b38`, the code and the
claims agree.

Two things the audit should be told rather than left to discover:

1. **`docs/product/` does not exist.** PKR1/PKR3 define the Product Knowledge Registry's 28
   sections and deliberately create and populate nothing (`64b1ee5`). Per Phase 7 of the
   roadmap, the registry is the audit's canonical destination — it is defined and empty *by
   design*, and that is the point, not an omission.
2. **The KNOW5 migration is committed but not applied.** Any audit of benefit-chip behaviour is
   auditing the pre-KNOW5 world.
