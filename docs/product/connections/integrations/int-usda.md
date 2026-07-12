---
entry: int-usda
name: USDA FoodData Central
section: integrations
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# USDA FoodData Central

> Whole-food nutrition data.

## What it is

USDA FoodData Central is the reference THA reads for the nutrition of whole
foods — the fruit, vegetables, grains and other unpackaged ingredients that do
not carry a barcode. It is an admin-configured data source that feeds THA's
nutrition figures.

## Where it lives

| | |
|---|---|
| Source | `server/lib/usda-whole-food-service.ts` |

## What breaks without it

If no USDA key is configured, the service falls back to USDA's public
`DEMO_KEY` (`usda-whole-food-service.ts`: `process.env.USDA_API_KEY || "DEMO_KEY"`).
That key is heavily rate-limited, so whole-food nutrition lookups still work but
can be throttled under load.

## Related

- [[dom-nutrition]] — the domain this data serves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
