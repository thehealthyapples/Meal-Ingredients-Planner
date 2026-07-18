---
entry: page-help-centre
name: Help Centre
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /help
last_verified: 2026-07-18
version: 1
---

# Help Centre

> Search twenty written articles across seven categories, and be told
> plainly when the answer has not been written.

## What it is

The page at `/help`. It lists twenty articles grouped into seven categories —
Getting started, Planning, Food and allergies, Household, Your data, Account and
Troubleshooting — and opens any one of them in place, with an "Also worth
reading" list of related articles at the foot.

There is one search box. Matching is not this page's job: `GET /api/help?q=`
calls `searchHelpArticles` in `shared/support/help-centre.ts`, which is the
single owner of what matching means, and the page renders what comes back. When
a search matches nothing it says so by name — "Nothing matches …" — and offers
the contact page. It never assembles an answer of its own, because a generated
answer here would be read as a written one.

Every article closes with "Still stuck?" and a link to `/contact`.

The articles are written in `shared/support/help-centre.ts` as structured blocks
— paragraphs, steps, lists and notes — not as free HTML.

## Where it lives

| | |
|---|---|
| Route | `/help` |
| Source | `client/src/pages/help-centre-page.tsx` |
| Source | `shared/support/help-centre.ts` |
| API | `GET /api/help` (`server/trust-routes.ts`) |
| Reached from | the Profile page |

## Related

- [[dom-trust-and-compliance]] — the domain this page belongs to
- [[hlp-help-centre]] — the articles this page renders
- [[page-contact]] — where the page sends someone it cannot help

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
