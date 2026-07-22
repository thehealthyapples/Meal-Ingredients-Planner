# NSR1 Phase 2 — Planner (craft wave)

**Room:** Planner — `/planner`,`/weekly-planner` → `weekly-planner-page.tsx` (+ `PlannerIntelligenceStrip.tsx`)
**Rollback:** `rollback/NSR1-north-star-reconstruction-20260722` (→ `e16117d5`)
**Owners:** UIOWN1 §4 (Planner = Domain 14, the family table) · CRAFT1 §4/§6 · GEA11/13/18/21

## Design (architecture first)
The family planning table — sitting down to lay out the week, not filling a spreadsheet or clearing a
queue. PRESENCE1/UX3/PLANNER1 already did the constitutional work (removed the "14/28" target, the
"/30" denominator, the advisory voice, and window-expiry; time/date honesty passes — the room never
invents a week or day). What remained was craft debt.

## Changes (presentation-only)
1. **Deleted two dead copies of the UPF traffic-light grade** — `getUPFColorFn`/`getUPFLabelFn`
   (module level) and `getUPFColor`/`getUPFLabel` (component level), a green/yellow/red
   "Minimal/Moderate/High" scheme with **zero call sites** in the page (`SmartReviewPanelContent`
   holds its own copies). **CRAFT1 §6** (delete before adding) and **GEA18** (no duplicate ownership).
2. **Neutralised the empty-state copy** — "Nothing planned for this week **yet**" → "…this week" (the
   "yet" implied an expected completion); "…a week **built around your household**" → "…a week to
   start from" (less interpretive). **GEA21/15**.
3. **Named the plant count's unit inline** in the intelligence strip — a bare Leaf + number read as
   cryptic, with "plants" living only in the `title` tooltip; now visible inline (**CRAFT1 §4** —
   immediately understandable).

## Not done — larger / owner decisions (flagged)
- **Header contextBar density** — rename + nav + week-select + Plan + Send-to-basket + review + count +
   overflow crowd one strip, with Plan/Send duplicated inline *and* in the overflow. Consolidating is a
   genuine recomposition (GEA11); deferred as an owner character pass rather than a surgical edit.
- **The live UPF verdict colour** in `SmartReviewPanelContent` (red "High") — owner call on whether it
   reads as a food fact or a grade of the plate (GEA13).
- **The ungoverned `/api/planner/weeks/:id/intelligence` binding** for the plant count (UIOWN1 §14
   convergence debt; discards celebration/opportunity fields) — backend/roadmap (INT20).

## Verification
`tsc --noEmit`: 0 errors across both files; no leftover `getUPF*` reference. Diff: **12 insertions /
26 deletions** (net −14). Live visual review recommended.

## Data / Trust / Scope
No schema/API/storage/business-logic change; `server/` untouched. Rollback: reset to the NSR1 tag.

## Quality Standard
The table is cleaner — dead grading code gone, the invitation plainer, the count legible. The header
density and the two owner items are what stand between this and an unqualified "happily spend time here."
