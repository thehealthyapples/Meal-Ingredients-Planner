---
entry: dom-home
name: Home
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Home

> The calm place a household lands on every visit, telling them how today
> looks and what is next.

## What it is

Home is the screen a household sees first after signing in. It gathers the few
things that matter today — the meals planned for the current day, how much
shopping is still outstanding, and how the week's plant diversity is coming
along — and presents each as a card that leads straight into the relevant
domain. A gentle greeting names the household, and a quiet link at the bottom
offers the fuller dashboard for anyone who wants more detail.

Home owns no data of its own. Every figure it shows is read from an existing
owner: today's meals from the planner, the outstanding count from the shopping
list, plant diversity from the weekly-progress aggregate, and any reminders
from the Companion's Notice Engine. A section with no validated data renders as
a calm empty state rather than a fabricated one — the reminders card, for
instance, is simply absent when there is nothing worth saying.

## Where it lives

| | |
|---|---|
| Route | `/home` |
| Source | `client/src/pages/home-experience-page.tsx` |
| Registered | `client/src/App.tsx` (line 204) |

## Related

- [[page-home]] — the page that renders this domain
- [[jrn-first-run]] — the household's first arrival
- [[dom-planner]] — where today's meals are decided

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
