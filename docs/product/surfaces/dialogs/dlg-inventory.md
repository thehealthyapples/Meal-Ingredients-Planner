---
entry: dlg-inventory
name: Dialog, drawer and sheet inventory
section: dialogs
status: live
visibility: developer
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Dialog, drawer and sheet inventory

> The eighty-nine modal surfaces THA ships across thirty-nine files, and which of them use the canonical dialog foundation — today, two.

## What it is

A developer-facing census of every modal surface in the client — dialogs, alert
dialogs, sheets, and drawers — and how many of them actually adopt the shared
dialog foundation (`client/src/components/ui/dialog-foundation.ts`). The foundation
exists to give every dialog one semantic language for size (`compact`,
`comfortable`, `expanded`, `workspace`) and presentation (`modal`, `drawer`,
`sheet`), plus a set of ready-made presets. The census is what tells us whether
that language is actually spoken.

## The real numbers (as of last verified)

Counting instances of the modal-content primitives outside the `components/ui`
definitions themselves:

| Surface | Count |
|---|---|
| `DialogContent` | 68 |
| `AlertDialogContent` | 6 |
| `SheetContent` | 4 |
| `DrawerContent` | 11 |
| **Total app-level modal surfaces** | **89** |
| Files hosting at least one | 39 |

Adoption of the foundation is genuinely tiny: exactly **two** files import from
`dialog-foundation.ts` — `components/upf-info-modal.tsx` and
`components/food-knowledge-modal.tsx` — and both use only `getDialogWidthClass`.
Nothing in the client uses `DIALOG_PRESETS`, and the `DialogSize` /
`DialogPresentation` types are otherwise unadopted. So of ~89 modal surfaces, 2 lean
on the foundation, and only for a width class.

## Substantiation note — the count diverges from the record

The record (and the verbatim `purpose` above) says **eighty-nine** modal surfaces.
Counting the code today gives **89** app-level modal surfaces across 39 files
(68 + 6 + 4 + 11), excluding the `components/ui` primitives. The "today, two"
adoption figure is exact and holds. The 85 figure is stale or was counted by a
different rule; this is a finding for PDA1, not a wording nuance — the inventory
record `product.yaml` should be reconciled to the real count (it was deliberately
left unedited here).

## Where it lives

| | |
|---|---|
| Source | `client/src/components/ui/dialog-foundation.ts` |

## Known defects

- `fnd-dialog-foundation-unadopted` — the dialog foundation is imported by only two
  files (both for `getDialogWidthClass`); `DIALOG_PRESETS` and the size/presentation
  types are used nowhere. The shared language exists but is not spoken. See PDA1.
- `fnd-destructive-guard-inverted` — the `AlertDialogAction` primitive defaults to
  `buttonVariants()` (the prominent primary style) while `AlertDialogCancel`
  defaults to the muted `outline` style. In a destructive confirmation, this
  emphasises the dangerous action and de-emphasises the safe one unless each caller
  remembers to add `bg-destructive` by hand — and several (e.g.
  `admin-users-page.tsx`, `admin-benchmark-households-page.tsx`) do not. The visual
  guard points at the wrong choice. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
