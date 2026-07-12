---
entry: int-tesseract
name: Tesseract OCR
section: integrations
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Tesseract OCR

> Reads text out of photographed recipes and receipts.

## What it is

Tesseract is the optical-character-recognition engine THA runs over a photo to
pull the words out of it. When a household photographs a recipe or a receipt,
Tesseract turns that picture into text THA can work with. It runs in-process via
`tesseract.js`; the household never configures it and never sees it named.

## Where it lives

| | |
|---|---|
| Source | `server/services/ocr.ts` |

## What breaks without it

Scan-from-photo fails outright — there is no second OCR engine to fall back to.
The service loads a single `tesseract.js` recognizer, so if it is unavailable
the whole photo-to-text path stops rather than degrading to an alternative.

## Related

- [[jrn-add-recipe]] — the journey that photographs a recipe

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
