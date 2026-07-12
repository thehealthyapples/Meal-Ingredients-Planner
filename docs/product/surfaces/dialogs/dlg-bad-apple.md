---
entry: dlg-bad-apple
name: Highly Ultra-Processed warning
section: dialogs
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Highly Ultra-Processed warning

> A warning shown when a household picks a product THA rates lowest — a one-apple rating, or NOVA-4 with more than five additives — currently as a modal that blocks the action.

## What it is

A modal that interrupts product selection on the shopping list when the chosen
product is highly ultra-processed. It shows a sad-apple illustration, the product
name, and a breakdown — ultra-processed flag, NOVA group, additive and high-risk
additive counts, emulsifiers, and a UPF score out of 100 — then offers two ways
forward: "Find Better Option" or "Add Anyway".

In the code, the warning fires from `handleSelectProduct`
(`shopping-list-page.tsx`, around L838) when the picked product's THA rating is 1
or lower, or when it is NOVA group 4 with more than five additives. Until the
household picks one of the two buttons, the selection does not complete — the modal
blocks it.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/BadAppleWarningModal.tsx` |
| Source | `client/src/pages/shopping-list-page.tsx#L837` |

## Related

- [[jrn-analyse-product]] — the journey of understanding a product and finding a swap
- [[gls-bad-apple]] — the "bad apple" term this warning names

## Known defects

- `fnd-observation-as-modal` — an observation (this product is highly
  ultra-processed) is delivered as a blocking modal that halts the household's
  action, rather than as an inline observation it can absorb and move past. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
