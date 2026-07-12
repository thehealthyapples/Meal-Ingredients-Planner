---
entry: hid-scan-confirm-dialog
name: Scan Confirm dialog (orphaned)
section: hidden-experiences
status: hidden
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Scan Confirm dialog (orphaned)

> A 416-line scan-review dialog with no importers, apparently the shared
> predecessor of the three scan reviewers that replaced it.

## What it is

`ScanConfirmDialog` is a 416-line scan-review dialog. Nothing imports it. It
appears to be the shared predecessor of the three scan reviewers that replaced
it — one each for recipes, planner and shopping — and it was left in the tree
after they took over.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/scan-confirm-dialog.tsx` (416 lines) |

## Why it is unreachable

The only reference to `scan-confirm-dialog` / `ScanConfirmDialog` in the whole
repository is its own export at `scan-confirm-dialog.tsx#L371`. It has zero
importers. The three current, actively imported scan reviewers that supersede it
are:

- `client/src/components/RecipeScanReview.tsx`
- `client/src/components/PlannerScanReview.tsx`
- `client/src/components/ShoppingListScanReview.tsx`

## What it would take to reach it

Nothing worth doing. Its role is filled by three purpose-built reviewers; this
file is an orphaned predecessor, so the deliberate action is deletion rather than
revival.

## Related

_None._

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
