---
entry: int-recipe-sources
name: External recipe and price sources
section: integrations
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# External recipe and price sources

> Edamam, Spoonacular, BigOven, FatSecret and API Ninjas — optional
> sources for recipes, nutrition and prices.

## What it is

This is the set of optional third-party services THA can draw on for extra
recipes, nutrition detail and price data: Edamam, Spoonacular, BigOven,
FatSecret and API Ninjas. Each is admin-configured by its own API key, and each
is genuinely optional — THA works without any of them, and simply gains more
sources as keys are added.

## Where it lives

| | |
|---|---|
| Source | `server/lib/external-meal-service.ts` |
| Source | `server/lib/price-lookup.ts` |

## What breaks without it

Each source disables itself independently when its key is absent. In
`external-meal-service.ts`, each lookup checks for its own key first — Edamam for
`EDAMAM_APP_ID`/`EDAMAM_APP_KEY`, API Ninjas for `API_NINJAS_API_KEY`, BigOven
for `BIGOVEN_API_KEY`, and so on — and returns an empty result rather than
failing when that key is missing. So a missing key removes one source; it never
takes down the others or the feature as a whole.

## Related

- [[dom-cookbook]] — where recipes are gathered
- [[dom-shopping]] — where prices are used

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
