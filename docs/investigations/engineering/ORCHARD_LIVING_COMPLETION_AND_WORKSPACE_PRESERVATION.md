# Orchard Living Completion & Workspace Preservation

**Type:** Investigation (point-in-time analysis) — verification and preservation only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Preservation commit:** `3430b1c1`
**Rollback tag:** `rollback/PRESERVE-orchard-living-verification-20260716`
**Scope:** Verify whether the Orchard Living Design Blueprint workstream was completed; inventory all uncommitted, untracked and unpushed work; create a safe preservation point.
**Non-goals:** No UI, no Blueprint authoring, no refactor, no deletion, no push, no deploy. No application code was modified.

---

## 0. Filing deviation (read first)

The mission specified this report be written to `docs/investigations/ORCHARD_LIVING_COMPLETION_AND_WORKSPACE_PRESERVATION.md` — a **loose file at the root of `docs/investigations/`**.

That path conflicts with the governing architecture and would fail a mechanical gate:

- `REPOSITORY_CONVENTIONS.md` § 2 states `docs/investigations/` owns "point-in-time analysis and history, **filed by workstream** (§4)" and explicitly must not contain "**loose files at its root**".
- `.engineering/scripts/repo-structure-verify.sh` check #3 fails the structure verification when any file other than `README.md` sits at that root.

Per the Architecture Bootstrap (`docs/architecture/README.md`), a conflict with the governing architecture requires STOP-and-explain rather than silent compliance. The conflict here is one of **filing only** — it changes nothing about the report's content — so the report is filed at the compliant workstream path (`docs/investigations/engineering/`, which covers "repository structure, session/dev-status records" and already holds the precedent `PRESERVE_SINCE_LAST_PRODUCTION_CHECKPOINT.md`), and the deviation is declared here rather than passed over.

**Decision required:** accept this location, or direct a different one. It will not be moved to the root, as that location is forbidden and enforced.

---

## 1. Architecture Compliance

| Check | Result |
|---|---|
| Architecture Bootstrap (`docs/architecture/README.md`) read before acting | ✅ Read first, before any command |
| Governing architecture conflict found | ⚠️ One — the requested report path (§ 0). Declared, not silently followed |
| Application code modified | ✅ None. No `client/`, `server/`, `shared/` source was edited by this workstream |
| `REPOSITORY_CONVENTIONS.md` § 2 — report filed by workstream | ✅ `docs/investigations/engineering/` |
| `REPOSITORY_CONVENTIONS.md` § 2 — root permits no diagnostics | ✅ Upheld: `.glibcheck.txt` / `.libdirs_uxhome.txt` deliberately **not** committed into the root (§ 6) |
| Investigation vs implementation report (§ 3) | ✅ Investigation — analyses and recommends. It carries a rollback identifier but built no product change |
| Rollback protection before changing anything (`ENGINEERING_WORKFLOW.md` STEP 1) | ✅ Preservation commit + annotated tag, § 5 |
| AI / Experience & UI / Product Registry / Adoption Register compliance blocks | N/A — not a user-facing, AI, or building-block change |

The Experience & UI, Product Registry and Adoption Register gates are not engaged: this workstream produced one investigation document and one git checkpoint, and no surface, capability, component, token or route.

---

## 2. Orchard Living completion status

**Status: NOT STARTED — rollback protection only.**

The workstream exists in exactly one artefact: its rollback tag. Nothing else was ever produced.

| Evidence | Finding |
|---|---|
| Tag | `rollback/OLDB1-orchard-living-design-blueprint-20260715` — annotated, tagger `thehealthyapples`, **2026-07-15 23:51:03 +0000** |
| Tag message | *"Rollback protection for OLDB1 (Orchard Living Design Blueprint) — design investigation, docs-only. HEAD b3c650cd."* |
| Tag target | `b3c650cd` (RM4 — Planner Ready Meal Library) — i.e. the then-current HEAD |
| `docs/design/` | Does not exist anywhere in the repository |
| `docs/design/ORCHARD_LIVING_DESIGN_BLUEPRINT.md` | Does not exist |
| Any file named `*ORCHARD_LIVING_DESIGN*` / `*OLDB*` | None, tracked or untracked |
| Grep for `OLDB1` / "Orchard Living Design Blueprint" across the repo | **Zero hits** outside the tag object itself |
| Run file `.engineering/session/runs/OLDB1_*.md` | Does not exist |
| Row in `.engineering/session/CURRENT.md` | Absent — OLDB1 was never registered as a session |
| Commits mentioning OLDB1 / Orchard Living | None |
| Branches for the workstream | None |
| Commits of any kind after 2026-07-15 22:00 | **None** — `b3c650cd` (14:06) was the last commit before this preservation |

### What happened

The session followed the Engineering Session Recovery Protocol § 3 step 1 ("**Rollback first** — create rollback protection (annotated git tag) and capture the identifier") at 23:51:03, and then stopped. It never reached step 2 ("**Open a run file**"), which is why there is no run file and no `CURRENT.md` row.

The surrounding evidence agrees: the tool-session logs show activity at 23:47–23:49 on 2026-07-15 and then a gap until 07:25 on 2026-07-16. The last session heartbeat recorded in `CURRENT.md` is `2026-07-15T22:29:55Z`, before OLDB1 began. **The session was interrupted within minutes of taking its rollback tag, having produced no content.**

This is the protocol working as designed — the tag is the recovery handle — but it also means **the tag is the only trace**, and a tag with no run file is invisible to the recovery dashboard. Anyone recovering from `CURRENT.md` alone would never learn OLDB1 was started.

### Files created by the workstream

**None.** No document, no directory, no code, no test.

### Required sections

**Not assessable — there is no document to assess.** No sections exist because no blueprint exists. Per the scope lock, no attempt was made to author or complete it.

### Naming collision — the most important finding for the next decision

`OLDB1` is one letter away from two workstreams that **are** complete, and whose documents were sitting uncommitted in the working tree until this preservation:

| ID | Document | State |
|---|---|---|
| **OLB1** | `docs/architecture/THA_ORCHARD_LIVING_BOOK.md` — "Orchard **Living Book**" | Complete; indexed in the architecture README |
| **OHDB1** | `docs/architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` — "Orchard **House Design Blueprint**" | Complete; indexed in the architecture README |
| **OLDB1** | "Orchard **Living Design Blueprint**" | Does not exist — rollback tag only |

"Orchard Living Design Blueprint" reads as a contraction of the two documents that already exist. Both were authored 2026-07-15 (18:24 and 18:38), roughly five hours *before* the OLDB1 tag was taken. Whether OLDB1 was intended as a **third, distinct document**, or was a restatement of work already delivered under OLB1/OHDB1, **cannot be determined from the repository** — the tag message ("design investigation, docs-only") is the only statement of intent that survives, and it does not say. This is the question § 9 puts to the user.

### Related work remaining only in the working tree

**Yes — and this was the material risk.** Every governing document in the Orchard/Experience family was **authored but never committed**. Before this preservation they existed only as untracked files in the working tree, unprotected by any tag or commit, including four documents already indexed as *governing* in `docs/architecture/README.md`:

- `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md` (EXPBLUE1/EXPBLUE2)
- `docs/architecture/THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md` (OHDB1)
- `docs/architecture/THA_ORCHARD_LIVING_BOOK.md` (OLB1)
- `docs/architecture/THA_KEPT_ROOM_TRANSLATION.md` (TRANSLATION1)
- `docs/architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md` (CPuBA1)

The README (itself modified and uncommitted) *indexed these as governing architecture while the documents themselves were untracked*. A `git clean` would have destroyed five governing documents and left a README pointing at nothing. All are now preserved in `3430b1c1`.

---

## 3. Current repository state (as found, before preservation)

| Item | Value |
|---|---|
| Current branch | `int1-intelligence-platform` |
| HEAD (as found) | `b3c650cd` — "RM4 — Planner Ready Meal Library", 2026-07-15 14:06:34 |
| Upstream | `origin/int1-intelligence-platform` |
| Commits ahead of remote | **44** (now 45) |
| Commits behind remote | 0 |
| Staged files | **0** — nothing was staged |
| Modified tracked files | **16** |
| Deleted tracked files | **1** (`scripts/ci/seed-know1-residue.ts`) |
| Untracked files | **371 files, 114.5 MB** (100 top-level entries; `docs/ui-audit/` accounts for 112.7 MB) |
| Merge / rebase / cherry-pick state | **None** — no `MERGE_HEAD`, `REBASE_HEAD` or `CHERRY_PICK_HEAD` |
| Conflicts | None |
| Stashes | 25 (pre-existing, untouched) |
| Rollback tags | 541 (pre-existing, untouched) |
| Ignored files of relevance | None. `.gitignore` excludes `node_modules`, `dist`, `client/dist`, `.cache/`, `.local/`, `.pythonlibs/`, `.upm/`, `.config/`, `*.zip` (incl. `thehappyapplesexport1.zip`), `.env`, `.claude/settings.local.json`, `.engineering/session/.CURRENT.lock` — all correctly excluded build output, caches and local settings |

### Files at risk of being overwritten or omitted

- **Five governing architecture documents were untracked** while indexed as governing in the README (§ 2). This was the single largest exposure; now closed.
- **44 unpushed commits** — the entire local branch exists in one place. Not addressed here (no push authorised); see § 8.
- **No file was at risk of being overwritten** — no merge or rebase was in progress, and no conflicting state existed.

### Changes grouped by workstream

| Workstream | Files | Nature |
|---|---|---|
| **Experience / design governance** (EXPBLUE1, EXPBLUE2, OHDB1, OLB1, TRANSLATION1, EXPLANG1B) | `docs/architecture/THA_EXPERIENCE_BLUEPRINT.md`, `THA_ORCHARD_HOUSE_DESIGN_BLUEPRINT.md`, `THA_ORCHARD_LIVING_BOOK.md`, `THA_KEPT_ROOM_TRANSLATION.md`, modified `THA_EXPERIENCE_LANGUAGE.md` + `README.md`, reports in `docs/implementation/architecture/` | New governing docs + README index — **untracked** |
| **Design exploration** (EXP2–EXP5, ORCHARD2, ORCHARD3, HOUSE1, DESIGN1, UXHOME1, PDA1) | `docs/implementation/ux/*`, `docs/investigations/ux/*`, `docs/ui-audit/*` (112.7 MB evidence), `client/src/pages/dev/arrival-*.tsx`, `material-*.tsx`, `exp2-shared.tsx`, modified `client/src/App.tsx`, `scripts/capture-*.ts` | Dev-only prototypes + screenshot/video evidence — **untracked** |
| **Canonical publication** (CPuBA1, CPI1, CPV1, PUB1) | `docs/architecture/CANONICAL_PUBLICATION_ARCHITECTURE.md`, `docs/investigations/platform/CPI1_*`, `docs/implementation/platform/CPV1_*`, `docs/implementation/knowledge/PUB1_*`, modified `server/verification/publication-register.ts`, `server/seeds/seed-canonical-food.ts`, `server/migrations/runner.ts`, `shared/canonical/plant-classifier.ts`, `scripts/ci/setup-test-database.ts`, **deleted** `scripts/ci/seed-know1-residue.ts`, modified `server/tests/test-know5-evidence-contract.ts` + `test-knowledge-food-ownership.ts` | Mixed tracked + untracked |
| **Household health / nutrition** (HHP2, HHP3, HNP1) | `server/intelligence/bindings/household-health.ts`, `server/intelligence/handlers/household-health-*.ts`, `server/lib/household-nutrition-assembler.ts`, `household-history.ts`, `client/src/components/HouseholdNutritionPanel.tsx`, `shared/nutrition/`, `docs/implementation/health/`, `docs/implementation/nutrition/`, tests | **Untracked** |
| **Domain evolution** (CBK2, PLAN2, PANTRY1, SHOP1, NTC_P2) | `docs/implementation/cookbook/CBK2_*`, `planner/PLAN2_*`, `pantry/`, `shopping/`, `intelligence/NTC_P2_*`, `server/lib/pantry-intelligence-assembler.ts`, `meal-unlock.ts`, `server/intelligence/conversation/notice-gateway.ts`, tests | **Untracked** |
| **Ready meals** (RM1) | `docs/investigations/platform/RM1_*` | **Untracked** |
| **Data coverage / knowledge** (DCA1, SURF1B5, KNOW) | `docs/investigations/platform/DCA1_*`, `AUDIT_2026-07-13.md`, `docs/investigations/knowledge/*` | **Untracked** |
| **Governance / engineering** (DOCSTRUCT2, PX1-W5) | `docs/implementation/engineering/DOCSTRUCT2_*`, modified `ENGINEERING_WORKFLOW.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/implementation/ux/ADOPTION_REGISTER.md` + `.json`, `scripts/build-registry-nav.ts` | Mixed |
| **Session records** | `.engineering/session/runs/*.md` (21 files), modified `CURRENT.md` | **Untracked** |
| **Platform config** | modified `.replit` (four dev port mappings added: 5051→4200, 5099→5000, 5199→5173) | Tracked |
| **Unclassified diagnostics** | `.glibcheck.txt`, `.libdirs_uxhome.txt` | **Excluded** — see § 6 |

---

## 4. Preservation commit

```
commit  3430b1c14deba0fdf23a39ab7ec8a50fe5e56f71
parent  b3c650cde2a552f51b8311dbcd0937a401fbde1f
subject chore: preserve current workspace before Orchard Living verification
stat    386 files changed, 29612 insertions(+), 231 deletions(-)
        369 added · 16 modified · 1 deleted
```

The commit is additive over `b3c650cd`. It records work that already existed in the working tree and changes no application behaviour of its own.

---

## 5. Rollback tag

```
rollback/PRESERVE-orchard-living-verification-20260716
  → tag object c418b3ac (annotated)
  → commit      3430b1c1
```

Proof recorded at creation:

```
$ git rev-parse 'rollback/PRESERVE-orchard-living-verification-20260716^{commit}'
3430b1c14deba0fdf23a39ab7ec8a50fe5e56f71
$ git rev-parse HEAD
3430b1c14deba0fdf23a39ab7ec8a50fe5e56f71
MATCH
```

To restore this exact workspace: `git checkout rollback/PRESERVE-orchard-living-verification-20260716`.

---

## 6. Exclusions from the commit

| Excluded | Why | Where it is now |
|---|---|---|
| `.glibcheck.txt` (0 bytes) | Temporary diagnostic at the repository root. `REPOSITORY_CONVENTIONS.md` § 2 forbids diagnostics at the root and § 1 Rule 5 is mechanically enforced — committing it would introduce a structure defect | **Left in the working tree** (not deleted) **and copied** to the session scratchpad `excluded-root-diagnostics/` |
| `.libdirs_uxhome.txt` (77 bytes — a single `/nix/store/...golden-cheetah.../lib` path) | Same: a throwaway library-path probe from the UXHOME1 session, forbidden at the root | Same as above |
| `node_modules/`, `dist/`, `client/dist/` | Build output and dependencies | Excluded by `.gitignore` |
| `.cache/`, `.local/`, `.pythonlibs/`, `.upm/`, `.config/` | Generated caches and tool state | Excluded by `.gitignore` |
| `.claude/settings.local.json`, `.engineering/session/.CURRENT.lock` | Local settings / lock file | Excluded by `.gitignore` |
| `thehappyapplesexport1.zip` | Archive artefact | Excluded by `.gitignore` (`*.zip`) |
| **This report** | Written after the preservation commit was taken, by design — the commit captures the workspace *as found*, not as annotated | Untracked; commit on request |

**Secret scan:** no `.env`, key, credential, certificate or token file was staged. All untracked text was scanned for private-key blocks, `sk-…` / `AKIA…` keys and credentialed `postgres://` URLs — **zero matches**. Nothing was excluded on secrecy grounds because nothing secret was present.

**On the 112.7 MB of `docs/ui-audit/` evidence:** included deliberately. It is design evidence cited by the EXP2–EXP5 / DESIGN1 reports, not build output, and it follows established precedent — `docs/ui-audit/` already tracks 65 files, and the repository already tracks 168 PNGs, 2 WebM and 2 GIFs. Omitting it would have broken the reports that reference it. It is, however, the largest single contributor to repository size and is flagged in § 8.

---

## 7. Verification of preservation

| Check | Result |
|---|---|
| `git status` after preservation | Clean except the two intentionally-excluded diagnostics |
| Working tree clean? | **Effectively yes** — 0 staged, 0 modified, 0 deleted, 2 untracked by design |
| Tag → preservation commit | ✅ Both resolve to `3430b1c1` (§ 5) |
| No original work deleted | ✅ 371 previously-untracked files are now tracked; 2 remain on disk untouched; nothing was removed |
| Deleted file still recoverable | ✅ `b3c650cd:scripts/ci/seed-know1-residue.ts` — 7,348 bytes, retrievable via `git show` |
| Pre-existing history intact | ✅ `b3c650cd` and `da368a39` still reachable; the preservation commit is a child, not a rewrite |
| Prior rollback tags intact | ✅ 541 tags; `rollback/OLDB1-…` still resolves to `b3c650cd` |
| Stashes intact | ✅ 25, untouched |
| Nothing pushed | ✅ 45 commits ahead of `origin/int1-intelligence-platform`, 0 behind. No push performed |
| Application code modified by this workstream | ✅ None |

### Intentionally left uncommitted

1. **`.glibcheck.txt`** and **`.libdirs_uxhome.txt`** — root-level temporary diagnostics. Committing them would violate `REPOSITORY_CONVENTIONS.md` § 2 and add root defects to history. They were **not deleted** (the scope lock forbids it and their legitimacy is uncertain), so they remain on disk *and* are backed up to the session scratchpad — preserved separately rather than destroyed, exactly as the mission directs for uncertain files.
2. **This report** — created after the checkpoint by design (§ 6).

### On `scripts/ci/seed-know1-residue.ts`

The one deleted tracked file was verified as a **legitimate, intentional deletion**, not accidental loss. `PUB1` retired it deliberately: it was a CI script that re-inserted a known `plant-protein` defect into every test database so that two suites asserting the defect's presence would keep passing — what `CPI1` § 4.5 named *"a synchronisation bridge whose synchronised artefact is a bug"*, and what the script's own header admitted (*"THIS SHOULD NOT EXIST FOREVER"*). Both affected suites (`test-know5-evidence-contract.ts`, `test-knowledge-food-ownership.ts`) carry matching updates in the same working tree. The remaining references to the filename are historical documentation and the publication register's record of the retirement. The deletion is preserved as part of that work, and the file remains recoverable from `b3c650cd`.

---

## 8. Remaining risks

1. **44 pre-existing commits (now 45) are unpushed.** The entire branch — including all five governing documents — exists only on this machine. The preservation commit protects against `git clean` and `git checkout`; it protects against **nothing** involving loss of the machine or the repository. No push was authorised, so this risk is **unchanged and open**. It is the largest surviving exposure.
2. **The architecture README indexes documents whose governance status is unratified.** The README (until now uncommitted) describes EXPBLUE1/2, OHDB1, OLB1 and TRANSLATION1 as governing architecture. Preservation makes them durable; it does **not** ratify them. They are governing-by-index, and were never reviewed as a set.
3. **OLDB1's intent is unrecoverable from the repository.** Only the tag message survives. If OLDB1 was meant to be a third distinct document, nothing records what it was to contain (§ 2).
4. **A rollback tag with no run file is invisible to recovery.** OLDB1 is protected by a tag that `CURRENT.md` never mentions. Any future session recovering via the dashboard — as the recovery protocol instructs — would not learn OLDB1 exists. Other such orphan tags may exist; this was not audited.
5. **`docs/ui-audit/` is now 112.7 MB of tracked binaries** and will grow with each design exploration. Consistent with precedent, but the trend deserves a decision before it becomes one that is expensive to reverse.
6. **Fifteen workstreams' worth of work now sits in one undifferentiated commit.** The preservation commit is a safety net, not a history. If clean per-workstream history is wanted, it must be reconstructed from `3430b1c1` — which is possible (the tag holds every file) but is work.
7. **25 stashes and 541 rollback tags** remain unreviewed. Some stashes date to 2026-07-09 and earlier and may hold work never landed. Out of scope here; unexamined.
8. **`.replit` port additions were preserved without provenance.** Four dev port mappings were added by an unrecorded session. They are harmless dev config, but no workstream claims them.

---

## 9. Recommended next single decision

> **Decide what OLDB1 was meant to be — a third document, or a duplicate of work already delivered.**

Everything else waits on this, and only the user can answer it: the repository has no record of the intent, and the naming collision (§ 2) makes guessing actively unsafe.

The three outcomes:

- **(a) It was already delivered under OLB1 + OHDB1** — then the correct action is to **delete the `rollback/OLDB1-…` tag** and close the workstream. Authoring a third document would create the second owner that `REPOSITORY_CONVENTIONS.md` § 1 Rule 4 and the Experience Governance documents explicitly forbid. This is the most likely reading: "Orchard Living Design Blueprint" reads as a contraction of the "Orchard **Living** Book" and the "Orchard **House Design Blueprint**", both authored hours before the tag.
- **(b) It is genuinely a distinct document** — then it needs a run file, a stated scope, and, critically, an answer to *what does it own that the five existing Experience documents do not?* before a line is written. That question is the one every document in that family had to answer.
- **(c) It was a mis-tagged session** — then delete the tag and move on.

**Do not begin authoring under any outcome until the ownership question is answered.** The Experience family already has five documents that each had to justify owning a question none of the others owned; a sixth that cannot do so is a governance defect, not a gap.

**The runner-up decision, if OLDB1 is closed:** authorise a push. Risk 1 is the only open risk that can destroy work, and it is one command away from being closed.

---

## 10. Commands used (audit trail)

```
git status ; git rev-parse HEAD ; git rev-list --left-right --count @{u}...HEAD
git tag --list 'rollback/*' ; git cat-file -p a677f493
git log --all --oneline --grep='OLDB\|orchard living'
grep -rIl 'OLDB1\|Orchard Living Design Blueprint\|ORCHARD_LIVING_DESIGN' .
git ls-files --others --exclude-standard        # 371 files, 114.5 MB
git add -A ; git reset HEAD -- .glibcheck.txt .libdirs_uxhome.txt
git commit -F <message>                          # 3430b1c1
git tag -a rollback/PRESERVE-orchard-living-verification-20260716
```

No `reset --hard`, `clean`, `rebase`, `stash`, `push` or `rm` was run at any point.
