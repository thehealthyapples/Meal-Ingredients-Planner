---
entry: page-dashboard
name: Dashboard
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /dashboard
last_verified: 2026-07-11
version: 1
---

# Dashboard

> A fuller statistics view for a household that wants more numbers than Home shows.

## What it is

The bigger picture screen. It greets the household by time of day and lays out
recent meals, a count of saved meals, the number of items in the basket, this
week's plan at a glance, the household's collection, and a row of quick actions.
Across the top sit quick log buttons — Log Food, Log Signals, Log Weight, Plan
Week — so a household can record how a day went or jump into planning without
leaving the page. Logging weight or daily signals opens a small dialog and saves
straight into the diary.

It covers much of the same ground as Home but with more figures and more shortcuts,
for a household that wants the detail rather than the calm summary.

## Where it lives

| | |
|---|---|
| Route | `/dashboard` |
| Source | `client/src/pages/dashboard.tsx` |

## Related

- [[page-home]] — the calmer today screen

## Known defects

- `fnd-home-dashboard-rivalry` — Home and Dashboard are two separate household
  landing surfaces that overlap heavily (both share the "home" realm, both show
  today's meals, basket and plan). There is no single owner of "the screen you
  land on"; the two compete for the same job. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
