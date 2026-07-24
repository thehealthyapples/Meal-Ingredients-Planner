# Living Home Design Constitution — Rename & Reference Convergence

| Field | Value |
|---|---|
| **Task ID** | `LHDC-RENAME` (rename + reference convergence) |
| **Date** | 2026-07-22 |
| **Branch** | `int1-intelligence-platform` |
| **Rollback ID** | `rollback/LHDC-rename-living-home-design-constitution-20260722` → `a362e01b` (annotated tag, created **before any change**; covers committed state only — the working tree held one uncommitted `.engineering/session/CURRENT.md` heartbeat, not covered) |
| **Kind** | **Documentation rename + reference convergence only.** No runtime, UI, asset, schema, business-logic, or AI change. No rule altered; no ownership broadened. |

---

## 0 · What this task is, and what it is not

**Objective.** Rename the governing document `docs/architecture/ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` to `docs/architecture/LIVING_HOME_DESIGN_CONSTITUTION.md`, establish it as the **THA Living Home Design Constitution** (`LHDC1`), converge every repository reference on the new canonical filename and title, and preserve `EDDC1` / `ED3` as legacy identifiers for traceability.

**What it is.** A rename (`git mv`, so history follows the file) plus the reference convergence the rename requires — the document's own title/identifiers, the architecture README index (table row + prose blockquote + Live-status link), the historical `ED3` implementation report's path references, and the session records. It preserves the **approved substance and ownership** of the constitution exactly.

**What it is not.** It is **not** a rewrite of any approved rule, **not** a broadening of what the constitution owns, and **not** a second governing document. No room implementation, visual asset, renderer change, schema, or unrelated refactor is included. The historical report `docs/implementation/architecture/ED3_ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` **keeps its filename** (its `ED3` workstream identity is the historical record); only the architecture-doc path references inside it were updated.

---

## 1 · What changed

| # | Change | Where |
|---|---|---|
| 1 | **File renamed** (`git mv`, R094 — 94% identical; the 6% is the header/title/note) | `docs/architecture/ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` → `docs/architecture/LIVING_HOME_DESIGN_CONSTITUTION.md` |
| 2 | **Title** → *THA Living Home Design Constitution* | renamed doc, line 1 |
| 3 | **Document ID** → `LHDC1`, with `EDDC1` / `ED3` recorded as **legacy identifiers** | renamed doc, header |
| 4 | **Status** reframed → *the visual and material admission standard for the **Living Home**, including its **Environmental Dressing** layer* | renamed doc, header |
| 5 | **Rename & non-broadening note** added (name broadens, ownership does not) | renamed doc, header blockquote |
| 6 | **Self-name + self-path** references updated | renamed doc, § 0 + Definition of Done |
| 7 | **README** — table row title/link, blockquote title/ID + non-broadening note, Live-status link, rename-record pointer | `docs/architecture/README.md` |
| 8 | **ED3 report** — rename note at top + 4 architecture-doc path references (report filename unchanged) | `docs/implementation/architecture/ED3_ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` |
| 9 | **Session records** — ED3 run file path refs; new rename run file; CURRENT.md ED3-row path + new rename row | `.engineering/session/…` |
| 10 | **This task record** | `docs/implementation/architecture/LIVING_HOME_DESIGN_CONSTITUTION_RENAME.md` |

The **substance of the constitution** (its 22 sections, the two must-feel / must-never-feel lists, the § 1 ownership table, the with-and-without review, the rejection criteria, the Home Owner approval authority, the per-object admission evidence, and the deliberately-unresolved `EXP3` Verdict 3 medium question) is **byte-unchanged** apart from the header title/ID/status/note.

---

## 2 · Identifier lineage (traceability preserved)

| Identifier | Meaning | Status |
|---|---|---|
| `LHDC1` | The Living Home Design Constitution | **Current canonical** |
| `EDDC1` | The former Environmental Dressing Design Constitution | **Legacy — preserved** (same document) |
| `ED3` | The implementation workstream that established the document | **Legacy — preserved** (report keeps its `ED3` filename) |

There is **one** governing document with **one** current id and two preserved legacy ids. No duplicate governing document exists.

---

## Architecture Compliance

- **One canonical constitution after the rename** — exactly one governing file (`LIVING_HOME_DESIGN_CONSTITUTION.md`); the old filename no longer exists (`git mv`, not copy). ✔
- **No duplicate source of truth** — the rename moved the single file; no second constitution was created; the `ED3` report and session records are historical records, not rival governing documents. ✔
- **Existing ownership remains intact** — every colour/token stays UIA's, every feeling `EXPLANG`'s, materials/light/place the Blueprint's/`OHDB1`'s/`TRANSLATION1`'s, ED1–ED12 `LIVINGHOME2`'s, approval `HOMEOWNER1`'s. The § 1 ownership table is unchanged; no owner was added, moved, or broadened. ✔
- **Historical references remain traceable** — `EDDC1` and `ED3` are preserved as legacy identifiers in the document header, the README blockquote, and the `ED3` report; the rename is recorded in this task record. ✔
- **No runtime, UI, asset, schema, business-logic or AI change** — the diff is documentation and session records only; no `.ts/.tsx/.json/.css`, migration, asset, or token path is touched. ✔

---

## Data Impact

- **Reads existing data:** NO.
- **Writes new data:** NO.
- **Changes meaning of existing data:** NO.
- **Requires backfill:** NO.

---

## Definition of Done

- **The governing file is named `LIVING_HOME_DESIGN_CONSTITUTION.md`** — confirmed present; old filename confirmed absent. ✔
- **The document title is "THA Living Home Design Constitution"** — line 1. ✔
- **README and repository references resolve to the new canonical filename** — README table row, blockquote, and Live-status link all point to `LIVING_HOME_DESIGN_CONSTITUTION.md`; the `repo-structure-verify.sh` *"every architecture document indexed in README"* check passes. ✔
- **The old governing file no longer exists as a competing source** — `git mv` removed it; no file at the old path. ✔
- **Historical identifiers remain traceable** — `EDDC1` / `ED3` preserved (§ 2). ✔
- **No runtime files are changed** — diff is documentation + session records only. ✔

---

## Trust Check

- **No approved rule altered or expanded to fit the new name.** The 22 governing sections are byte-unchanged apart from the header. Every colour, token, material, light value, feeling, room behaviour, and the Home Owner approval seat remains with its existing owner.
- **The one scope tension, reported rather than silently rewritten.** The new name *"Living Home Design Constitution"* could be read as governing the **whole** Living Home's design — which would collide with the existing owners of colour/tokens (UIA), materials/light (Blueprint / `OHDB1` / `TRANSLATION1`), feeling (`EXPLANG`), room behaviour, and approval (`HOMEOWNER1`). **This tension was resolved by naming, not by rule change:** an explicit non-broadening clause was added to the header and the README blockquote stating that the rename *broadens the name, not the ownership* — the document remains the Living Home's constitution for the **design of admitted objects** (the object-level visual and material admission standard), governing the Environmental Dressing layer today and any future admitted-object layer by the same standard, with § 1's owned scope unchanged. No section was rewritten to seize a broader remit.
- **Could this mislead the user?** No — there is no runtime surface; the change is a document name and its references. The lineage table (§ 2) and the in-document note keep the former identity legible.
- **Is anything guessed but shown as real?** No — the constitution's own honesty laws (claim-free, EXP3 Verdict 3 unresolved) are untouched.

---

## Rollback Plan

- **Rollback identifier:** `rollback/LHDC-rename-living-home-design-constitution-20260722` → `a362e01b` (annotated tag, created **before any change**; the uncommitted `CURRENT.md` heartbeat is not covered).
- **Exact restoration command:**
  ```bash
  # Return committed state to the pre-rename tag (restores the old filename and every reference):
  git checkout rollback/LHDC-rename-living-home-design-constitution-20260722 -- \
    docs/architecture/ docs/implementation/ .engineering/session/
  git rm -f docs/implementation/architecture/LIVING_HOME_DESIGN_CONSTITUTION_RENAME.md \
            .engineering/session/runs/LHDC_Rename_Living_Home_Design_Constitution.md
  git commit -m "Rollback LHDC rename"
  # (Or simply: git revert <this task's commit(s)>.)
  ```
- **Verification after rollback:** `git diff rollback/LHDC-rename-living-home-design-constitution-20260722 -- docs/ .engineering/` is empty; `docs/architecture/ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` exists again and `LIVING_HOME_DESIGN_CONSTITUTION.md` is gone; no runtime surface existed to verify.

---

## Scope Lock

- **Implemented scope:** the file rename; the document title/identifier/status/note update; the README index convergence; the `ED3` report reference convergence + rename note; the session records; this task record. **Nothing else.**
- **Explicitly excluded (and confirmed absent from the diff):** any rule change; any ownership broadening; any room implementation, visual asset, renderer change, schema, migration, route, token, business-logic, or AI change; any rename of the historical `ED3` report or session-run files; any unrelated refactor.

---

## Manual Verification

1. `git status` confirmed clean apart from the session heartbeat before work; the rollback tag was created and verified to resolve to `a362e01b` **before** any change.
2. **Old filename absent:** `test -e docs/architecture/ENVIRONMENTAL_DRESSING_DESIGN_CONSTITUTION.md` → absent ✔.
3. **New filename exists:** `test -e docs/architecture/LIVING_HOME_DESIGN_CONSTITUTION.md` → present ✔.
4. **Repository searched for stale references:** every remaining mention of the old filename is an intentional *"renamed from …"* note; **no clickable link targets the old path** — every `[...](./LIVING_HOME_DESIGN_CONSTITUTION.md)` resolves to the new file. The historical `ED3` report and both session-run files retain their own (correct) filenames.
5. **Architecture links resolve:** the README table row, blockquote, and Live-status link all point to the new file; `repo-structure-verify.sh` *"every architecture document indexed in README"* → PASS (the two pre-existing loose-file FAILs are unchanged baseline, unrelated to this rename).
6. **Diff scope:** `git diff --stat` against the tag shows only `docs/` and `.engineering/session/` paths (the rename detected as `R094`); no `.ts/.tsx/.json/.css`, migration, asset, or token path.

---

## User Acceptance Evidence

- **Starting point:** `docs/architecture/README.md`.
- **Action:** open the *Living Home Design Constitution* entry (Experience Governance table + blockquote).
- **Expected behaviour:** it resolves to the renamed governing document `LIVING_HOME_DESIGN_CONSTITUTION.md`. ✔
- **Success criteria:** one canonical constitution, with content and ownership preserved (§ 1 unchanged; header non-broadening note explicit). ✔
- **Regression check:** no competing *Environmental Dressing Design Constitution* remains — the old file is absent (`git mv`), `EDDC1`/`ED3` survive only as legacy identifiers pointing at the same single document. ✔
- **State: Waiting for User.** Acceptance is the Home Owner's confirmation that the rename is the intended one and that no rule or ownership shifted.

---

*The house did not change; only the name on its design constitution did. What was the Environmental Dressing Design Constitution is now the Living Home Design Constitution — one document, one owner, one admission standard, its former identity kept legible so nothing is lost — broadened in name to the home it has always served, and not one rule broadened with it.*
