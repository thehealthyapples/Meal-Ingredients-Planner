# Working Tree Protection Plan

**Status:** Plan only — no commits, no cleanup, no reorganisation performed.
**Date:** 2026-07-11
**Branch:** `int1-intelligence-platform`
**HEAD:** `a432400` — UIA1 — UI Architecture Discovery investigation
**Working tree:** 792 changed entries (547 renames, 88 staged adds, 67 unstaged modifications, 31 untracked, 24 staged deletions)

---

## 0. What this document is

A read-only review of the current working tree, grouping its changes into coherent
workstreams and recommending the safest order in which to commit them.

Every finding below was verified against the repository, not inferred. Nothing was
committed, moved, deleted, staged, or unstaged in producing it. The one operation that
touched Git at all was a temporary `git worktree` created from `HEAD` in a scratch
directory to obtain a typecheck baseline; it was removed afterwards, and the working
tree still reports the same 792 entries it did at the start.

---

## 1. The headline risk: none of this is backed up

This is the finding that should determine what happens next, ahead of any question
about commit grouping.

| What | State | Backed up? |
|---|---|---|
| 27 commits on `int1-intelligence-platform` | Local only | **No** — branch has no upstream and exists on neither `origin` nor `gitsafe-backup` |
| The working tree (792 entries, ~13 MB untracked) | Uncommitted | **No** |
| 21 stashes (`DEVWORLD1C_ROLLBACK` … `pre-nutrition-boost-fork-cache-fix`) | Local only | **No** |

Verified:

- `git branch -r --contains a432400` → empty.
- `git merge-base --is-ancestor a432400 origin/main` → **NO**.
- `git ls-remote --heads origin | grep int1` → 0 matches. Same for `gitsafe-backup`.
- The only refs containing `HEAD` are `refs/heads/int1-intelligence-platform` and five
  local `rollback/*` tags — all on this machine.

**The working tree is the sole copy of substantial completed engineering work**, and
this is not a general statement — it is specific and checkable. The repository's recent
history commits *implementation reports* whose *code was never committed*:

| Commit | What it added | Where the code actually is |
|---|---|---|
| `2fa5f61` UX1 — Canonical Bottom Navigation **implementation report** | 1 file, 282 lines of Markdown | `BottomNav` appears **0 times** in `HEAD:client/src/components/nav-bar.tsx` and 4 times in the working tree |
| `f85121e` ATTN1 — Canonical Attention Platform **implementation report** | 1 file, 396 lines of Markdown | `shared/attention/` — **untracked** |
| `610e4d7` UX0 — Home Experience **implementation report** | Markdown | `client/src/pages/home-experience-page.tsx` — **untracked** |
| `678b1ae` DEC1 — Canonical Decision Engine | Markdown | `server/intelligence/evidence-learning/household-observation.ts` — **untracked** |

Files confirmed to exist **only** in the working tree, with no copy in `HEAD`:

```
client/src/pages/home-experience-page.tsx
shared/attention/index.ts
shared/attention/decision.ts
server/intelligence/evidence-learning/household-observation.ts
server/development-world/world-reader.ts
```

The history therefore asserts that UX0, UX1, ATTN1 and DEC1 are *implemented* while the
implementations live nowhere but this uncommitted working tree. A `git checkout .`,
`git reset --hard`, `git clean -fd`, an interrupted rebase, or the loss of this machine
destroys them with no recovery path.

**Priority 0, before any commit in this plan, is to get an off-machine copy.** The
commit strategy below is worth doing carefully; it is not worth doing *first*.

---

## 2. Baseline facts established before planning

These determine which safety gates are meaningful and which are not.

**Typecheck is already red at `HEAD`, and this tree adds nothing to it.**
`npx tsc --noEmit` produces **175 errors on the working tree** and **175 errors on a
clean `HEAD` checkout** — the same files, same lines, same error codes. Diffing the two
sets yields only cosmetic differences (the absolute path in the message text, and one
type-display property ordering).

> Consequence: **`npm run typecheck` cannot be used as a commit gate here — it was
> already failing before any of this work began.** Do not treat its failure as evidence
> that a commit in this plan broke something, and do not attempt to fix the 175
> pre-existing errors as part of this exercise. That is separate work on a separate
> branch. The meaningful check is *"does the error count stay at 175?"*, not *"is it
> zero?"*.

**Repository structure is already clean.** `.engineering/scripts/repo-structure-verify.sh`
passes all 9 checks against the working tree, including "root contains only permitted
files" and "no loose files in `docs/implementation/` or `docs/investigations/`".

**The staged index is self-consistent.** The staged `docs/architecture/README.md`
contains **zero** references to the three untracked architecture documents
(`THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`,
`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`). The housekeeping commit can therefore
land on its own without dangling links.

**The index has already been staged as a coherent boundary.** Someone deliberately staged
the repository reorganisation and left the later workstreams unstaged. The three `MM`/`AM`
files are `MM`/`AM` precisely *because* their staged half and their working-tree half
belong to different workstreams (see §5).

> **The single greatest mechanical danger in this repository right now is `git add -A`.**
> It would fuse the repository reorganisation, the PKR/EXP/UIA architecture work, and
> every code workstream into one unreviewable, unrevertable commit, and destroy a
> boundary that already exists and is already correct.

---

## 3. Workstreams identified

| # | Workstream | Nature | Runtime risk |
|---|---|---|---|
| A | **Repository governance / housekeeping** — HOUSE2/HOUSE3 doc reorganisation | 547 renames, 24 deletions, index READMEs, `REPOSITORY_CONVENTIONS.md` | None (docs) |
| B | **Engineering workflow** — EOM1/ESR1/ESR2 `.engineering/` framework | 35 files: operating manual, checklists, protocols, hooks, scripts, session log | None (not shipped) |
| C | **Architecture governance** — PKR1/PKR2/PKR3, EXP2, UIA2 | 3 new governing docs + amendments to README / ENGINEERING_WORKFLOW / PLATFORM_KNOWLEDGE_COMPLETION | None (docs) |
| D | **Knowledge** — KNOW4 graduated food reports, KNOW5 composition evidence contract | **DB migration + schema**, evidence chain, seeds, `FoodReport.tsx` | **Highest** |
| E | **Intelligence** — ATTN1, DEC1, LEARN1, COACH1, COMP2, BENCHINT4 | `shared/attention/`, `server/intelligence/**`, benchmark harness, client hooks | High |
| F | **UX / Home** — UX0 Home Experience, UX1 Canonical Bottom Navigation | New home page, `BottomNav` replaces `DesktopSidebar`, nav/CSS | Medium (user-visible) |
| G | **Development World / Admin** — DEVWORLD2, DEVWORLD3 | `server/development-world/`, 2 admin pages, 2 admin API routes, 7.9 MB data | Medium (admin-only) |
| H | **Cookbook** — COOKBOOK2, COOKBOOK3 | 2 import scripts, 3.7 MB recipe data | Low (scripts, not wired to runtime) |
| — | **Unrelated / incidental** | See §4 | — |

### Unrelated changes found

- **`tatus`** — a file at the repository root, tracked in `HEAD`, 8,780 bytes, whose
  contents are the *output of `git diff`* against `client/src/components/ShoppingListView.tsx`.
  It is the residue of a mistyped shell redirection (`git s tatus` → `> tatus`) that was
  then committed. Its staged deletion is correct and should ship with the housekeeping
  commit.
- **`scripts/_wx96_shoot.mjs`, `scripts/test-db-connect.ts`** — two ad-hoc scripts being
  relocated from the repository root into `scripts/`. Part of the same root cleanup;
  pure `R100` renames, no content change.
- **`migrations/0001_m4_5_fermented_attribute.sql`, `server/migrations/runner.ts`** — both
  show as modified code, but the diffs are **comment-only**: they update doc paths
  (`docs/investigations/M4_5_…` → `docs/investigations/knowledge/M4_5_…`) to follow the
  reorganisation. These are reorg *fallout*, not code changes, and belong with the
  housekeeping commit. Verified: no executable line is touched in either file.

---

## 4. Files that must NOT be committed yet

| File / path | Why | Recommended action |
|---|---|---|
| **`.claude/scheduled_tasks.lock`** | A machine-local runtime lock file. Committing it will cause spurious conflicts on every machine and every session. | Add to `.gitignore`. Never commit. |
| **`data/development_world/`** (7.9 MB) | Contains `development_world_foundation_50.v1.json` (2.5 MB) **and** `development_world_foundation_50.v1.yaml` (1.7 MB) — the same data in two formats. | **Decide before committing** (see below). |
| **`data/cookbook/`** (3.7 MB) | Contains the same 500 recipes as `.json` (948 KB), `.md` (628 KB), `.csv` (580 KB) **and** re-cut into 10 `batches/*.json`. Roughly 4× redundancy. | **Decide before committing** (see below). |
| **`docs/implementation/cookbook/COOKBOOK3_pre_import_system_meal_ids.json`** | An import-time database snapshot filed as a document. It is data, not an implementation report. | Reclassify or exclude; do not let it set a precedent for `docs/`. |
| **`.engineering/session/CURRENT.md`** (unstaged half) | The unstaged delta is a single line: a Stop-hook heartbeat timestamp, rewritten automatically every session. It is machine churn. | Commit the staged version; leave the heartbeat delta uncommitted, or gitignore the heartbeat line's file if the hook can tolerate it. |

**On the ~11.6 MB of data:** this is the one decision in this plan that is effectively
irreversible. Git keeps blobs forever; once these land, every clone of this repository
downloads them for the rest of its life, and removing them later requires a history
rewrite. Before committing, choose deliberately between: (a) commit only the single
canonical format and drop the derived ones, (b) Git LFS, or (c) keep the data out of Git
entirely and treat it as a build/import artefact reproducible from the import scripts.
This plan does not make that decision — but it should be made *consciously*, not by
`git add data/`.

`.claude/settings.json` **is** safe to commit: it is portable (uses `$CLAUDE_PROJECT_DIR`),
contains no secrets or machine-local paths, and is what wires the `.engineering/` session
hooks. `REPOSITORY_CONVENTIONS.md` explicitly sanctions `.claude/` as the home for
"Claude Code project settings and hook wiring". It belongs with workstream B.

---

## 5. The three partially-staged files — read this before committing anything

`docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`,
`docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` are `MM`, and
`.engineering/templates/IMPLEMENTATION_TEMPLATE.md`, `.engineering/session/CURRENT.md`,
`.engineering/session/INDEX.md` are `AM`.

This is **not** a mistake to be tidied up. In each case the staged half and the unstaged
half belong to *different workstreams*:

| File | Staged half (→ Commit 1) | Unstaged half (→ Commit 2) |
|---|---|---|
| `docs/architecture/README.md` | Repository Conventions indexing (HOUSE2) | PKR1/PKR3 + Experience/UI Governance sections |
| `docs/architecture/ENGINEERING_WORKFLOW.md` | Document-structure rules | PRODUCT REGISTRY COMPLIANCE blocks (PKR2) |
| `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` | — | PKR3 fifth-domain extension (+207 lines) |
| `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` | Base template | PRODUCT REGISTRY COMPLIANCE block (PKR2) |
| `.engineering/session/INDEX.md` | Session index | UIA1 session row |
| `.engineering/session/CURRENT.md` | Session file | Heartbeat timestamp (machine churn) |

Committing the index as it stands preserves this split correctly and for free.

> **Hazard.** `git reset -- <path>` on any of these six files is **lossy in effect**: the
> file reverts to untracked/modified, and re-adding it with `git add` will stage the
> *working-tree* content — fusing the PKR architecture work into the housekeeping commit.
> `git reset` is index-only and never touches the working tree, so it is safe for the
> pure `A ` adds discussed in Commit 1; it is **not** safe for these six. Do not reset them.

---

## 6. Cross-cutting files — the real constraint on grouping

Three files are touched by more than one workstream. They, not the volume of changes,
are what makes this tree hard to split.

| File | Workstreams | Separable? |
|---|---|---|
| `client/src/App.tsx` | **F (UX)** — `/home` route, `BottomNav` replaces `DesktopSidebar`, `HomeExperiencePage` import<br>**G (DevWorld)** — 2 admin routes + 2 page imports | **Yes, by hunk.** The admin imports (`@@ -34`), the home import (`@@ -44`), and the two route blocks are in distinct, non-adjacent hunks. `git add -p` can split them cleanly. |
| `server/routes.ts` | **G (DevWorld)** — `GET /api/admin/development-world`, `GET /api/admin/development-world/:id`<br>**E (Intelligence)** — `GET /api/intelligence/companion/notices` | **Yes, by hunk.** The hunks sit at widely separated line ranges (`@@ -8428` vs `@@ -11450`). |
| `package.json` | **D (Knowledge)** — `test:know4`, `test:know5`<br>**E (Intelligence)** — `test:attn1`, `test:coach1`, `test:dec1`, `test:comp2`, `test:learn1`, `test:intent-routing-attribution`, `test:benchmark-conversation-isolation` | **No.** The `"test"` script is a **single line** chaining all of them. One line cannot be split across two commits. |

`package.json` is therefore the binding constraint, and it dictates the shape of the
plan: **it must land in a commit of its own, after every test file it references exists.**
If it landed earlier, `npm test` would invoke `tsx` on files not yet in the tree and the
suite would fail at that commit. Verified: every one of the 60 test scripts referenced by
the new `"test"` chain resolves to a file that exists in the working tree — including
`test-plan1-planner-intelligence.ts` and `test-benchmark-no-production-branch.ts`, which
are already tracked in `HEAD`. So the only missing prerequisites are the KNOW/ATTN/COACH/
COMP/DEC/LEARN test files, which arrive in Commits 3 and 4.

`shared/schema.ts`, by contrast, is **cleanly single-workstream** — every added line is
KNOW5 composition-evidence (`sourceRefs`, `reviewedAt`, `reviewedBy`). No split needed.

---

## 7. Recommended commit strategy

Ordering principle: **inert before live, dependency before dependent, and the file that
cannot be split goes last.** Commits 1–2 carry zero runtime risk and can be made with
confidence. Commits 3–7 carry real risk and each needs its own verification.

### Commit 0 — Backup (not a commit; do this first)

Not part of the sequence, and not optional. Before anything else:

- Push the branch: `git push -u origin int1-intelligence-platform` (27 commits currently
  exist nowhere else), and/or `git push gitsafe-backup int1-intelligence-platform`.
- Snapshot the *uncommitted* tree off-machine — a `git bundle` does not capture untracked
  files, so this needs a tar of the working tree (excluding `node_modules`, `dist`) or an
  equivalent copy.
- The 21 stashes are also local-only. If any still matters, it needs backing up too; if
  none does, say so explicitly rather than leaving them as unexamined risk.

Until this is done, every later step is being performed above a 13 MB drop with no net.

---

### Commit 1 — Repository housekeeping, document structure, and engineering workflow

**Purpose.** Land the HOUSE2/HOUSE3 repository reorganisation and the EOM1/ESR1/ESR2
`.engineering/` framework — the structural work that every later commit's file paths
depend on.

**Files included.** The staged index **exactly as it stands**, minus the deferrals below,
plus two unstaged comment-only fixes:

- 547 renames (root artefacts and loose `docs/` files → workstream folders).
- 24 staged deletions: 20 root reports (each verified to survive at a new path — see the
  audit in §8), 3 `docs/investigations/` files promoted to `docs/architecture/`, and the
  stray **`tatus`** file.
- `docs/architecture/REPOSITORY_CONVENTIONS.md`, `docs/implementation/README.md`,
  `docs/investigations/README.md`, `docs/implementation/governance/REPOSITORY_HOUSEKEEPING_AND_STRUCTURE.md`,
  `docs/implementation/engineering/ENGINEERING_DOCUMENT_STRUCTURE.md`.
- All 35 `.engineering/**` files (staged halves only), plus `.claude/settings.json`.
- Benchmark history artefacts under `docs/intelligence/benchmark/history/` (inert JSON/MD
  outputs of runs already in history).
- **Unstaged, to be added:** `migrations/0001_m4_5_fermented_attribute.sql` and
  `server/migrations/runner.ts` — comment-only doc-path corrections, reorg fallout.

**Files excluded.**

- **All code.** Nothing under `client/`, `server/` (except the comment-only `runner.ts`),
  or `shared/`.
- **The unstaged halves of the six partially-staged files** (§5) — they are PKR/EXP/UIA
  work and belong to Commit 2. Leaving them behind is automatic; simply do not run
  `git add` on them.
- **Nine forward-looking implementation reports**, which describe code that this commit
  does not contain. These are pure `A ` adds with no working-tree delta, so
  `git reset -- <path>` is lossless for them (unlike the six in §5) and they can ride
  with their code:
  - `docs/implementation/knowledge/KNOW4_…md`, `KNOW5_…md` → Commit 3
  - `docs/implementation/intelligence/COACH1_…md`, `COMP2_…md`, `LEARN1_…md`,
    `docs/implementation/benchmarking/BENCHINT4_…md` → Commit 4
  - `docs/implementation/development_world/DEVWORLD2_…md`, `DEVWORLD2_IMPORT_VERIFICATION_FINDINGS.md`,
    `DEVWORLD3_…md` → Commit 6
  - `docs/implementation/cookbook/COOKBOOK2_…md`, `COOKBOOK3_…md`, + the 2 cookbook
    reference docs → Commit 7

  *If you would rather not touch the index at all, committing these nine along with the
  housekeeping is acceptable — it is docs-only and carries no build risk. It simply
  continues the existing pattern of reports landing ahead of their code, which is the
  pattern that produced the §1 problem in the first place.*

- `.claude/scheduled_tasks.lock`.

**Why the grouping is safe.**

- Docs and inert tooling only. Nothing under `.engineering/` is shipped or imported by the
  application (`session-verify.sh` exists specifically to enforce this).
- The staged snapshot was verified self-consistent: **zero** dangling references to the
  three untracked architecture documents.
- `repo-structure-verify.sh` passes all 9 checks against this content.
- Every one of the 20 root-file deletions was individually verified to have a surviving
  copy at its new path. No content is lost.
- The two code files touched are comment-only; the executable SQL and TypeScript are
  byte-identical.
- Renames are `R100` (pure moves), so Git tracks history across them and `git log --follow`
  keeps working.

**Rollback implications.** Cleanly revertable: `git revert` restores every path. The only
caveat is that a revert would resurrect `tatus` and re-scatter 22 artefacts across the
root — annoying, not dangerous. Because this commit is a prerequisite for every later
one's file paths, reverting it *after* Commits 2–7 have landed would break their doc
cross-references; revert the stack in reverse order, or fix forward.

---

### Commit 2 — Architecture governance: PKR1/PKR2/PKR3, EXP2, UIA2

**Purpose.** Land the Product Knowledge Registry architecture, the Premium Experience
Principles, and the UI Architecture — and the amendments that make the Experience and UI
checklists actually enforceable (per `ARCH-VERIFY1`, these checklists claimed to be
mandatory while `ENGINEERING_WORKFLOW.md` had never referenced them).

**Files included.**

- New governing documents: `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md`,
  `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`.
- The **unstaged halves** of `docs/architecture/README.md`, `ENGINEERING_WORKFLOW.md`,
  `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, and
  `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`.
- `docs/implementation/governance/PKR1_…md`, `PKR3_…md`, `ARCHITECTURE_COMPLETION_VERIFICATION.md`.
- `docs/implementation/ux/EXP2_…md`, `UIA2_…md`.
- The remaining modified `docs/architecture/*` files and `capabilities/*`.

**Files excluded.** All code. `.engineering/session/CURRENT.md`'s heartbeat delta.

**Why the grouping is safe.** Docs only — zero runtime surface. It must come *after*
Commit 1 because it edits the same three files Commit 1 stages, and because its links
assume the reorganised paths. Splitting PKR from EXP/UIA is possible but buys little:
both are architecture-governance, both are inert, and they interleave inside
`README.md` and `ENGINEERING_WORKFLOW.md`, so separating them would require hunk-splitting
for no safety gain.

**Rollback implications.** Trivially revertable, no runtime consequence. Note that
reverting it re-opens the `ARCH-VERIFY1` gap (Experience/UI checklists unreachable from
the workflow) — a governance regression, not a functional one.

---

### Commit 3 — Knowledge: KNOW4 graduated food reports + KNOW5 composition evidence contract

> **This is the highest-risk commit in the plan. It changes the database.**

**Purpose.** Add the composition evidence contract — `sourceRefs`, `reviewedAt`,
`reviewedBy` on the `knowledge_food_nutrients` edge — so a benefit chip can no longer
inherit a nutrient-level citation while its food-specific premise is an unreviewed AI draft.

**Files included.**

- `migrations/0002_know5_composition_evidence.sql` **(new — DB schema change)**
- `shared/schema.ts` (KNOW5 columns only — verified single-workstream)
- `shared/knowledge/evidence.ts`, `index.ts`, `foods.ts`
- `shared/knowledge/composition-sources.ts` **(new)**, `shared/knowledge/food-relationships.ts` **(new)**
- `shared/canonical/food-report-adapter.ts`, `shared/canonical/food-context.ts`
- `server/services/nutrition-knowledge-registry.ts`
- `server/seeds/seed-knowledge-registry.ts`, `server/seeds/signoff-knowledge-claims.ts`
- `server/tests/test-know4-graduated-food-reports.ts` **(new)**, `test-know5-evidence-contract.ts` **(new)**,
  `test-knowledge-food-ownership.ts`, `test-food-report-adapter.ts`
- `client/src/components/FoodReport.tsx`
- `docs/implementation/knowledge/KNOW4_…md`, `KNOW5_…md` (deferred from Commit 1)

**Files excluded.** `package.json` (see Commit 8 — its `test:know4`/`test:know5` wiring
cannot be separated from the Intelligence wiring on the same line). `server/routes.ts`,
`shared/attention/**` — Intelligence, Commit 4.

**Why the grouping is safe.** The migration is explicitly **additive, reversible, and
un-backfilled** — it states its own rollback SQL in its header, adds only nullable
columns, and deliberately performs no backfill (a `NULL reviewed_at` means "not reviewed",
which is the truth for every pre-KNOW5 row). Schema, migration, seeds, consumers and
tests move together, so no intermediate state exists where the code expects columns the
database lacks.

**But note the intended behavioural consequence, stated in the migration itself:**
*"benefit chips go dark until a human signs off the composition claims — that is the
point, not a regression."* **This commit will visibly remove benefit chips from the
product until sign-off is run.** That is by design, but it is a user-visible change and
must not be discovered in production. Confirm it is intended before shipping.

**Rollback implications.** The **code** reverts cleanly. The **database does not revert
itself** — a `git revert` leaves the three added columns in place. They are nullable and
additive, so an older build tolerates them, but a true rollback requires running the
`DROP COLUMN` statements the migration documents. **This is the only commit in the plan
whose rollback is not purely a Git operation.** Tag before it lands.

---

### Commit 4 — Intelligence: ATTN1, DEC1, LEARN1, COACH1, COMP2, BENCHINT4

**Purpose.** Land the Attention Platform, the canonical Decision Engine, household
learning, proactive coaching, natural conversation, and intent-routing convergence —
the code behind four implementation reports that are *already in the history* (§1).

**Files included.**

- `shared/attention/` **(new — 2 files)**
- `server/intelligence/evidence-learning/household-observation.ts` **(new)**
- `server/intelligence/**`: `capability-registry.ts`, `context/context-composition-engine.ts`,
  `conversation/{companion-actions,conversation-gateway,notice-engine}.ts`,
  `food-intelligence/opportunity-engine.ts`, `handlers/{opportunity-delivery,uplift-read}-handler.ts`,
  `index.ts`, `observation/observation-engine.ts`, `opportunity-delivery/framework.ts` (+622 lines),
  `pattern-intent-resolver.ts` (+685 lines), `types.ts`
- `server/lib/{food,meal}-intelligence-assembler.ts`
- `server/tests/benchmark/**` (9 files) and the new tests: `test-attn1-…`, `test-coach1-…`,
  `test-comp2-…`, `test-dec1-…`, `test-learn1-…`, `test-intent-resolver-routing-attribution.ts`
- `client/src/hooks/{use-companion-observations,use-food-opportunities}.ts`,
  `client/src/components/intelligence/index.ts`
- **`server/routes.ts` — Intelligence hunk only** (`GET /api/intelligence/companion/notices`),
  staged with `git add -p`
- The deferred COACH1 / COMP2 / LEARN1 / BENCHINT4 reports

**Files excluded.** `package.json` (Commit 8). The DevWorld hunks of `server/routes.ts`
(Commit 6). `client/src/App.tsx` (Commits 5 and 6).

**Why the grouping is safe.** These six workstreams are genuinely one dependency cluster
and resist separation: `shared/attention/decision.ts` is imported by `notice-engine.ts`,
`opportunity-engine.ts`, `framework.ts`, `server/intelligence/index.ts` and both client
hooks, and `household-observation.ts` is imported by `framework.ts` and four test files.
Splitting them would produce intermediate commits that do not compile.

**Depends on Commit 3** — `shared/attention/decision.ts` and `shared/attention/index.ts`
import from `shared/knowledge/evidence`. Landing this before Commit 3 breaks the build.

**Rollback implications.** Revertable as a unit, code-only, no schema. Because it is a
single large commit spanning six workstreams, a revert takes all six back together —
accepted deliberately, as the alternative is broken intermediate commits.

---

### Commit 5 — UX / Home: UX0 Home Experience, UX1 Canonical Bottom Navigation

**Purpose.** Land the new Home experience and make `BottomNav` the sole primary
navigation on all screen sizes, retiring the left `DesktopSidebar`.

**Files included.**

- `client/src/pages/home-experience-page.tsx` **(new)**
- `client/src/components/nav-bar.tsx` (one `NAV_ITEMS` list becomes the single source of
  truth; `DesktopSidebar` retained but dormant, for rollback)
- `client/src/components/workspace-header.tsx`, `client/src/index.css`
- **`client/src/App.tsx` — UX hunks only**: the `HomeExperiencePage` import, the
  `/home` route, `BottomNav` replacing `DesktopSidebar`/`MobileNav`, and the removal of the
  now-dead `routeToPath` / `/api/routing` redirect logic. Staged with `git add -p`.

**Files excluded.** The DevWorld hunks of `App.tsx` (Commit 6) — verified to be distinct,
non-adjacent hunks.

**Why the grouping is safe.** UX0 and UX1 are inseparable in practice: UX1's `NAV_ITEMS`
list has `/home` as its first entry, so committing the nav without the page yields a
navigation item that 404s. Self-contained to the client; touches no server code, no
schema, no intelligence.

**This is the most user-visible commit in the plan.** It changes what every household sees
on login (`/` now redirects to `/home` rather than to an intent-routed destination) and
removes the desktop sidebar. It needs a real look in a browser, not just a green build.

**Rollback implications.** Clean revert, and deliberately cheap: `DesktopSidebar` is
retained-but-dormant in `nav-bar.tsx` precisely so navigation can be restored without
resurrecting deleted code. Note that the commit makes the `/api/routing` intent-routing
telemetry dormant — reverting restores it, but any routing-correction data not gathered in
the interim is simply not gathered.

---

### Commit 6 — Development World + Admin: DEVWORLD2, DEVWORLD3

**Purpose.** Land the Development World reader, its two admin surfaces, and the imported
world data.

**Files included.**

- `server/development-world/` **(new — 2 files)**, `scripts/import-development-world.ts` **(new)**
- `client/src/pages/admin-development-world-page.tsx` **(new)**,
  `admin-development-world-household-page.tsx` **(new)**, `client/src/pages/admin-page.tsx`
- **`server/routes.ts` — DevWorld hunks only** (2 admin routes, both `assertAdmin`-guarded)
- **`client/src/App.tsx` — DevWorld hunks only** (2 imports, 2 admin routes)
- `data/development_world/` — **only after the §4 data decision is made**
- The deferred DEVWORLD2 / DEVWORLD3 reports

**Files excluded.** Everything else. The 7.9 MB payload if the data decision defers it.

**Why the grouping is safe.** Admin-only surface: both new API routes are behind
`assertAdmin`, and both pages are admin-chromed. No household-facing path changes. The
data is read-only input to a reader module.

**Depends on Commit 5** for `App.tsx` hunk ordering (both commits touch that file; take
UX first so the DevWorld hunks apply on top of the settled nav structure).

**Rollback implications.** Clean code revert. **But if the 7.9 MB of data lands here, the
blobs stay in history forever even after a revert** — a revert removes the files from the
tree, not from the object store. This is the commit where the irreversible decision gets
made. Split the data into its own commit if you want the option to revert the *code*
independently of the *payload*.

---

### Commit 7 — Cookbook: COOKBOOK2, COOKBOOK3

**Purpose.** Land the THA Original Founding Cookbook import scripts and source data.

**Files included.** `scripts/import-tha-founding-cookbook-500.ts` **(new)**,
`scripts/import-tha-founding-cookbook-batch-001.ts` **(new)**, `data/cookbook/` (3.7 MB —
subject to the §4 decision), and the deferred COOKBOOK2/COOKBOOK3 reports.

**Files excluded.** Everything else.

**Why the grouping is safe.** Fully self-contained: two standalone import scripts and
their input data. Nothing in `client/`, `server/` or `shared/` imports them — they are run
manually, not wired into the runtime. This commit cannot break the application. It is last
among the code commits for exactly that reason: it is the one whose failure costs least.

**Rollback implications.** Code reverts cleanly and harmlessly. The data blobs are
permanent once committed (same caveat as Commit 6). If the import has already been run
against a database, reverting the scripts does not un-import the recipes — that is a data
operation, not a Git one.

---

### Commit 8 — Test wiring (`package.json`)

**Purpose.** Wire the 11 new test suites into `npm test`.

**Files included.** `package.json`, alone.

**Files excluded.** Everything else.

**Why the grouping is safe — and why it must be last.** The `"test"` script is a single
line chaining ~60 suites across both the Knowledge and Intelligence workstreams. **One line
cannot be split across two commits.** If `package.json` landed with Commit 3, `npm test`
would immediately invoke `tsx` on `test-attn1-…`, `test-coach1-…` etc., which do not exist
until Commit 4 — so the suite would fail at that commit *for a filing reason, not a code
reason*. Deferring it to a commit of its own means every intermediate commit keeps a
working `npm test` (running the old chain), and no commit ever references a file that is
not yet in the tree. Verified: after Commits 3 and 4, all 60 referenced test files exist.

May land any time after Commit 4; recommended last, so that it is the commit that turns
the new suites on and its failure (if any) is unambiguous.

**Rollback implications.** Trivial — reverts to the previous test chain. No runtime effect
whatsoever; `package.json`'s `dependencies` are untouched.

---

## 8. Verification performed for this plan (all read-only)

| Check | Result |
|---|---|
| `git status --porcelain` | 792 entries; unchanged before and after this review |
| `npx tsc --noEmit` on working tree | 175 errors |
| `npx tsc --noEmit` on clean `HEAD` (temporary worktree, since removed) | **175 errors — identical set** |
| `.engineering/scripts/repo-structure-verify.sh` | **9/9 PASS** |
| Every staged deletion has a surviving copy | 23/23 verified; the 24th is the stray `tatus`, correctly deleted |
| Staged `README.md` references untracked arch docs? | **0 references** — no dangling links |
| All 60 `npm test` script targets resolve to real files | **Yes** |
| Import graph of the 5 new untracked modules | Mapped; drives the Commit 3 → 4 dependency |
| Branch reachable from any remote | **No** — 27 local-only commits |

---

## 9. Do not do these

1. **`git add -A` / `git add .`** — fuses the reorganisation, the architecture work and
   every code workstream into one unreviewable commit and destroys a correct, already-existing
   boundary.
2. **`git reset --hard` / `git checkout .` / `git clean -fd`** — the working tree is the
   sole copy of UX0, UX1, ATTN1, DEC1, COACH1, COMP2, LEARN1, KNOW4/KNOW5, DEVWORLD and
   COOKBOOK code. There is no remote to recover from.
3. **`git reset` on the six partially-staged files in §5** — index-only and safe in
   general, but here it silently fuses PKR architecture content into the housekeeping commit.
4. **Treating a red `npm run typecheck` as a regression** — it was already red at `HEAD`
   with the same 175 errors. The signal to watch is the *count staying at 175*, not it reaching 0.
5. **Committing `data/` without deciding** — ~11.6 MB, with ~4× format redundancy, permanent
   in history, removable only by rewriting it.
6. **Squashing Commits 3–7 into one "land the work" commit** — it would put an
   un-revertable schema migration in the same commit as a user-visible navigation change,
   and there would be no way to roll back one without the other.

---

## 10. Recommended immediate next step

Not a commit. **Back up the branch and the working tree** (§7, Commit 0). Twenty-seven
commits and roughly 13 MB of uncommitted, unbacked-up engineering work currently exist on
exactly one disk, and four implementation reports in the history describe code that lives
nowhere else. Everything else in this plan can wait until that is no longer true.
