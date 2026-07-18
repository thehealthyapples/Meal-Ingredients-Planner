---
entry: hlp-help-centre
name: Help Centre articles
section: help
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-18
version: 1
---

# Help Centre articles

> Twenty written articles in seven categories — getting started, planning,
> food and allergies, the household, your data, the account, and things going
> wrong.

## What it is

THA's written help. Twenty articles live in `shared/support/help-centre.ts`,
each belonging to one of seven categories: Getting started, Planning, Food and
allergies, Household, Your data, Account, Troubleshooting. They cover trying THA
without an account, the first week, how the planner works, adding a recipe, the
pantry, the shopping list, the food diary, allergies and restrictions, diets
versus restrictions, scanning a barcode, what the Companion is, adding people and
adding children and eaters, downloading your data, correcting your data,
deleting your account, verifying your email, changing your password, reporting a
problem, and what to do when something looks wrong.

Every article is written, not generated. Each is a list of structured blocks —
paragraph, steps, list or note — so nothing here can be a free-form answer
assembled at request time. Articles cross-reference each other through a
`related` list.

The same module owns search. `searchHelpArticles` is the single definition of
what matching means, and both the API and the page defer to it.

## Where it lives

| | |
|---|---|
| Source | `shared/support/help-centre.ts` |
| Rendered by | `client/src/pages/help-centre-page.tsx` |
| API | `GET /api/help` (`server/trust-routes.ts`) |

## Related

- [[page-help-centre]] — the page that renders these articles
- [[dom-trust-and-compliance]] — the domain this belongs to
- [[hlp-first-visit-hints]] — THA's other in-product guidance
- [[page-contact]] — where a household goes when no article answers them

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
