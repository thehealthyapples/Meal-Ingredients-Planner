---
entry: page-home
name: Home
section: pages
status: live
visibility: public
owner: Colin Clapson
route: /
last_verified: 2026-11-05
version: 3
---

# Home

> One Home address for the public welcome and the household's calm today screen.

## What it is

The root address shows a welcoming introduction to signed-out visitors. After
sign-in, the same address shows the household's Home screen. If onboarding is
incomplete, the household continues to onboarding first.

The household view opens with the date and a
two-line welcome in THA's display voice — "Welcome home," then the person's name —
followed by a "Today at a glance" group of cards: the meals planned for today, how
many items are still to buy, and this week's plant diversity against a target of
thirty. Each card is a doorway — tapping through goes to the planner, the shopping
list, or the nutrition screen. When there is nothing to say, a card shows a calm
empty state rather than inventing anything — including plant diversity, which says
so honestly when the week has no picture yet rather than showing a zero. The
Companion holds its entrance until the room has settled, then appears in its usual
chair. A quiet link at the foot leads to the fuller dashboard.

Home owns no data of its own. Every figure is read from the screen that truly
owns it, so nothing here is a second copy of the truth.

## Where it lives

| | |
|---|---|
| Route | `/` |
| Sources | `client/src/pages/home-page.tsx`, `client/src/pages/home-experience-page.tsx` |

## Related

- [[dom-home]] — the domain this page belongs to
- [[page-dashboard]] — the fuller statistics view

## Known defects

- ~~`fnd-dead-reminders`~~ — **fixed by PHASE5E** (repointed at the real
  `/api/intelligence/companion/notices` route). Reminders render live; verified
  on the running page 2026-07-16 (ODL1).
- `fnd-derived-today` — "today's meals" is not a stored date. The planner is
  week-number based with no calendar dates, so Home guesses today by matching the
  browser's current day-of-week against the locally remembered active week. When
  the remembered week is not the real calendar week, "today" is wrong. See PDA1;
  the schema anchor is Household Time work (`TIME3`, Rule HT8 territory).

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-16._
