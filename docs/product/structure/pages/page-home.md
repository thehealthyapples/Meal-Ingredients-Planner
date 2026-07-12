---
entry: page-home
name: Home
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /home
last_verified: 2026-07-11
version: 1
---

# Home

> The calm today screen — today's meals, the shopping that follows from them, plant diversity, and anything gently worth attention.

## What it is

The screen a household lands on after signing in. It opens with the date and a
warm greeting, then shows a small set of cards about today: the meals planned for
today, how many items are still to buy, and this week's plant diversity against a
target of thirty. Each card is a doorway — tapping through goes to the planner,
the shopping list, or the nutrition screen. When there is nothing to say, a card
shows a calm empty state rather than inventing anything. A quiet link at the foot
leads to the fuller dashboard.

Home owns no data of its own. Every figure is read from the screen that truly
owns it, so nothing here is a second copy of the truth.

## Where it lives

| | |
|---|---|
| Route | `/home` |
| Source | `client/src/pages/home-experience-page.tsx` |

## Related

- [[dom-home]] — the domain this page belongs to
- [[page-dashboard]] — the fuller statistics view

## Known defects

- `fnd-dead-reminders` — the Reminders section is meant to surface the Companion's
  gentle notices, but the page reads from `/api/intelligence/companion/observations`
  while the server only serves `/api/intelligence/companion/notices`. The request
  never resolves to notices, so the section renders empty and no reminder ever
  appears. See PDA1.
- `fnd-derived-today` — "today's meals" is not a stored date. The planner is
  week-number based with no calendar dates, so Home guesses today by matching the
  browser's current day-of-week against the locally remembered active week. When
  the remembered week is not the real calendar week, "today" is wrong. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
