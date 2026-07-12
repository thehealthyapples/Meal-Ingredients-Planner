---
entry: jrn-analyse-product
name: Analyse a product
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Analyse a product

> A household scans a product in a shop, sees what is in it, and finds a better swap without leaving the screen.

## What it is

The in-aisle check: point the phone at a barcode (or search a name), read what the
product actually contains, and see a cleaner alternative — all on one screen,
without navigating away.

## The path

1. **Open the Analyser** (`/analyser`, also reached at `/products`).
2. **Scan or search.** The barcode scanner resolves a code via
   `/api/products/barcode/:barcode`; a text query hits `/api/search-products`.
3. **Read the analysis.** The selected product opens `AnalyserDetailV2`, which
   shows its additives, its processing (NOVA / ultra-processed signals), and its
   THA apple rating.
4. **Find a better swap.** The same detail view ranks cleaner choices
   (`analyser-choice`, `whole-food-alternatives`) and explains why each is better —
   the household never leaves the screen to see it.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/products-page.tsx` |
| Source | `client/src/components/analyser/AnalyserDetailV2.tsx` |

## Related

- [[page-analyser]] — the surface this journey lives on
- [[dom-analyser]] — the domain it belongs to
- [[dlg-bad-apple]] — the warning shown when a chosen product is highly ultra-processed

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
