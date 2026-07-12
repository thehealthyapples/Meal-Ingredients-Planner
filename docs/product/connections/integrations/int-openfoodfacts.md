---
entry: int-openfoodfacts
name: Open Food Facts
section: integrations
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Open Food Facts

> Where THA reads packaged-product data when a barcode is scanned.

## What it is

Open Food Facts is the open database THA queries when a household scans a
packaged product's barcode. It is where the name, brand and packaged-product
details come from, and it is also the source THA draws on to import its global
meal catalogue. It is an admin-level connection that works quietly behind the
scan.

## Where it lives

| | |
|---|---|
| Source | `server/lib/openfoodfacts-importer.ts` |

## What breaks without it

If Open Food Facts is unavailable, barcode lookup has no source to read from,
and the global meal catalogue cannot be imported. Scanning a packaged product
would return nothing to identify it by.

## Related

- [[dom-analyser]] — the domain that reads scanned products
- [[cap-analyser]] — the analyser capability it feeds

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
