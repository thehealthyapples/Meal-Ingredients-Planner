# DOCSTRUCT2 — Workstream Vocabulary Ratification

**Date:** 2026-07-13
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN (documentation only — no code, schema, data, seed, or runtime behaviour changed)
**Predecessor:** `DOCSTRUCT1` (2026-07-10), which unified workstream filing across `docs/implementation/` and `docs/investigations/` — see [`ENGINEERING_DOCUMENT_STRUCTURE.md`](./ENGINEERING_DOCUMENT_STRUCTURE.md).
**Governing documents read:** `docs/architecture/README.md` (bootstrap), `REPOSITORY_CONVENTIONS.md`, `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/GOV-workstream-vocabulary-20260713` |
| Commit SHA | `10b418a0c8503b877de8be00ee8dfb6b801eb30e` |
| Rollback to committed state | `git checkout rollback/GOV-workstream-vocabulary-20260713` |

> **⚠️ The working tree was DIRTY when this tag was taken** — 73 modified and 38 untracked files from PANTRY1/SHOP1/HNP1/HHP2/HHP3/PX1 and the in-flight Canonical Food work, authored by others. Per `ROLLBACK_PROTECTION_PROTOCOL.md` §3, a tag protects **committed state only**; it does **not** cover those uncommitted changes.
>
> `DOCSTRUCT2` touched exactly one file that was already dirty — `docs/implementation/README.md` — and snapshotted it out-of-repo before editing:
>
> - `…/scratchpad/GOV-pre-change-snapshot/implementation-README.md.uncommitted`
>
> No other pre-existing uncommitted work was touched. No file was moved, renamed, or deleted.

---

## THE PROBLEM

`REPOSITORY_CONVENTIONS.md` §4 is the governing vocabulary for workstream filing, shared by
`docs/implementation/` and `docs/investigations/`. It listed **11** workstreams.
`docs/implementation/` had **15** folders on disk.

The four extra folders — `pantry/`, `shopping/`, `nutrition/`, `health/` — were materialised by
earlier implementations without §4 being updated. The filing was therefore *real but ungoverned*:
reports existed in folders the governing architecture did not recognise.

`shopping/` was the worst case. It held `SHOP1_INTELLIGENT_SHOPPING_EVOLUTION.md` and was indexed
**nowhere** — not in §4, and not in `docs/implementation/README.md`, which had been updated for
`pantry/`, `nutrition/` and `health/` but not for it. A report can be filed correctly and still be
unfindable, and that is what had happened.

A separate drift surfaced while reading the investigations index: `docs/investigations/backups/`
was listed there as a workstream row but appeared in no governing document.

**Why this blocked the Canonical Food promotion.** That work must file a knowledge-domain report
and update the Source of Truth Register. Filing against a vocabulary that does not describe the
tree is how the `shopping/` defect happened; ratifying first means the promotion inherits a
governance surface that is true.

---

## CHANGES MADE

### 1. `docs/architecture/REPOSITORY_CONVENTIONS.md` — governing

Four rows added to the §4 workstream table:

| Folder | Covers |
|---|---|
| `pantry/` | The household inventory — what a household has, and what each item *means for them* (PANTRY1) |
| `shopping/` | The shopping list as an intelligent surface — what to buy, and why it matters now (SHOP1) |
| `nutrition/` | Household nutrition reporting — score, weekly summary, insights, plant diversity, balance, opportunities (HNP1) |
| `health/` | Household Health as a platform capability — Opportunity Platform producer, and the convergence of every health surface onto one delivery path (HHP2, HHP3) |

A `DOCSTRUCT2` note records that the ratification confirms a decision the folders had already made,
and states why these are **four** workstreams rather than one: each has a distinct owner in the
governing architecture — the pantry is what a household *has*, shopping is what it *should buy*,
nutrition is how its health is *reasoned about*, health is how that reasoning is *delivered*.

A new subsection, **"The one folder that is not a workstream"**, names `docs/investigations/backups/`
as an explicit archive exception: it holds patch files preserved verbatim, nothing is filed into it as
analysis, and it therefore does not enter the vocabulary. It exists only in the investigations tree.

### 2. `docs/implementation/README.md` — index

Added the missing `shopping/` row. `pantry/`, `nutrition/` and `health/` were already present.

### 3. `docs/investigations/README.md` — index

The `backups/` row now states that it is an archive and not a workstream, pointing at the §4 exception.

Added a paragraph making the table's status explicit: it lists the workstreams **materialised in this
tree**, not the whole vocabulary, which is governed by §4 and shared with `docs/implementation/`. It
names `pantry/`, `shopping/`, `nutrition/` and `health/` as available-but-not-yet-materialised, so a
future investigation into any of them is filed under its own workstream rather than folded into the
closest existing one — which is how a vocabulary silently narrows.

No rows were added for folders that do not exist: §4 requires folders be materialised on demand, and
a row linking to a missing folder is a broken link, not an index.

---

## WHAT WAS DELIBERATELY NOT DONE

- **No file moved, renamed, or deleted.** The four folders and every report in them stay exactly where
  they are. Ratification is a change to the governing document, not to the tree.
- **`docs/investigations/backups/` was not relocated or cleaned**, though it holds 3.4 MB of generated
  patch files inside a documentation tree. It is pre-existing and committed (`9e06930d`), those patches
  may be the only surviving copy of stashed work, and removing them is a separate decision with its own
  rollback requirement. `DOCSTRUCT2` makes it *governed*; it does not make it *tidy*.
- **No feature implementation.** The Canonical Food promotion has not begun.

---

## VERIFICATION

| Check | Result |
|---|---|
| `.engineering/scripts/repo-structure-verify.sh` | PASS (exit 0) — all 9 checks |
| `.engineering/scripts/session-verify.sh` | PASS (exit 0) — all boundary checks |
| Every `docs/implementation/` folder governed by §4 | 15/15 |
| Every `docs/investigations/` folder governed by §4 (or named as the archive exception) | 11/11 |
| Both trees resolve against one shared vocabulary | Confirmed |

---

## DEFINITION OF DONE

- [x] Repository governance accurately reflects the current workstream structure.
- [x] Repository conventions, indexes and verification are mutually consistent.
- [x] The Canonical Food promotion can proceed without governance conflicts — a knowledge-domain
      report files under `knowledge/`, which §4 has always governed and which is now part of a
      vocabulary that describes the whole tree rather than two-thirds of it.
