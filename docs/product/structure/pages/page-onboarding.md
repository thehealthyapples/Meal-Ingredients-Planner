---
entry: page-onboarding
name: Onboarding
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /onboarding
last_verified: 2026-07-11
version: 1
---

# Onboarding

> The twelve-step first run that learns the household's diet, allergies, shape and starting point.

## What it is

The first-run walkthrough a new household is taken through before the product opens
up. Across twelve steps — Welcome, Values, Approach, Real Food, About You,
Allergies, Diet, Style, Choices, Features, Tracking and Begin — it learns the
household's allergies and intolerances, dietary pattern and eating style, who lives
here, and what to track. It ends by asking where the household would like to start —
Cookbook, Analyser, Planner, Diary or Pantry — saves everything to the profile, and
drops them into their chosen area.

## Where it lives

| | |
|---|---|
| Route | `/onboarding` |
| Source | `client/src/pages/onboarding-page.tsx` |

## Related

- [[wiz-onboarding]] — the wizard this page runs
- [[jrn-first-run]] — the first-run journey

## Known defects

- `fnd-onboarding-not-resumable` — progress through the twelve steps is held only
  in the page's own memory, saved nowhere until the household finishes. Leave part
  way and the flow starts again at step one — and because an incomplete household
  is sent back to onboarding, there is no way to pick up where they left off.
  See PDA1.
- `fnd-unfulfilled-guidance-promise` — the chosen starting area is stored as a
  "preferred start area for soft contextual hints", but nothing in the product ever
  reads that value. The first-visit hints on each screen use their own fixed
  messages, so the guidance the onboarding implies never arrives. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
