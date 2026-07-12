---
entry: dom-analyser
name: Analyser
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Analyser

> Scan or search any packaged product to see what is really in it, and
> find a better choice before buying.

## What it is

The Analyser lets a household look inside a packaged product before buying it.
A household can search for a packaged food by name or scan its barcode, and the
Analyser breaks down its ingredients, additives, and processing so it is clear
what is really in it. Products can be compared side by side, and the Analyser
points towards whole-food alternatives and better choices. From here a product
can be added into the week.

The underlying capability's grounded read surface is the additives reference
list; per-product analysis is computed fresh on each lookup rather than read
from a stored result. The canonical definition of what the capability can and
cannot ground, including that boundary, lives in its own card.

## Where it lives

| | |
|---|---|
| Route | `/analyser` (also `/products`) |
| Source | `client/src/pages/products-page.tsx` |
| Capability | [Analyser (Product / UPF)](../../../architecture/capabilities/analyser.md) |

## Related

- [[page-analyser]] — the page that renders this domain
- [[jrn-analyse-product]] — analysing a product
- [[cap-analyser]] — the analyser capability

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
