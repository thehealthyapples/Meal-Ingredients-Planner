---
entry: page-features-compare
name: Features & compare
section: pages
status: live
visibility: public
owner: Colin Clapson
route: /features-and-compare
aliases: ["/features&compare"]
last_verified: 2026-11-19
version: 3
---

# Features & compare

> A public introduction to how THA helps with a whole household's food decisions, plus an evidence-led comparison with twenty-one competitor apps.

## What it is

The page describes THA's household-first meal, restriction, recipe, planning, nutrition, diary, pantry and shopping capabilities. A single grid compares twenty-one competitor apps across granular tasks. Click any competitor name in the table header to order feature rows by that app's evidence (Yes, Some limits, No, then Not verified); click it again to return to priority order. The selected app is highlighted beside THA. Each coloured dot opens the evidence note and relevant official developer source. Green means Yes, amber means Some limits, red means No, and grey means Not verified. Missing information stays unknown; no overall winner or aggregate score is published.

The comparison includes app availability and tier limits where the reviewed developer sources state them. Evidence was checked on 2026-11-19; app features can change by region, device and subscription tier.

The closing opportunity cards translate competitor capabilities into possible THA improvements. They are exploratory ideas, not product commitments or current feature claims.

## Where it lives

| | |
|---|---|
| Route | `/features-and-compare` |
| Alias | `/features&compare` |
| Source | `client/src/pages/features-compare-page.tsx` |
| Entry | Public Home navigation in `client/src/pages/home-page.tsx`; both routes are registered in `client/src/App.tsx` |

## Claim boundaries

The page's headline is owned by [[mkt-one-table]] and supported by the public benefit [[ben-everyone-fed-safely]]. THA capability claims are checked against the current app source and must distinguish existing functionality from partial coverage. AI suggestions, image scans, restriction adaptations and recipe imports remain reviewable. The page does not promise medical or allergen safety, universal social import, measured superiority, or absence of a competitor feature based only on an unmentioned feature. Competitor evidence links to official developer sources and is dated because plan tiers and features may change.

## Evidence reviewed

- THA household, meal, planner, pantry, shopping, analyser, nutrition and diary source code and API routes.
- Official developer pages/help centres for Yuka, MyFitnessPal, Mealime, Samsung Food and the other listed apps.
- `docs/investigations/ux/THA_FOOD_APP_COMPARISON_CAPABILITY_AUDIT_2026-11-19.md` (point-in-time findings).

## Related

- [[page-home]]
- [[mkt-one-table]]

---

_Registry entry. Present tense; if it is no longer true it is a defect, not history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-11-19._
