---
entry: wiz-onboarding
name: Onboarding wizard
section: wizards
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Onboarding wizard

> Twelve steps that ask a household who they are, what they avoid, and where they would like to start.

## What it is

The twelve-step first-run wizard on `/onboarding`. It opens with a few calm framing
screens, collects the household's dietary preferences and allergies, offers optional
tracking, and ends by letting the household choose which part of THA to land on.

## The steps

The wizard is a single component driving twelve steps by a local index:

1. Welcome · 2. Values · 3. Approach · 4. Real Food · 5. About You ·
6. Allergies · 7. Diet · 8. Style · 9. Choices · 10. Features · 11. Tracking ·
12. Begin.

- The **preferences** steps (Allergies, Diet, Style) carry a Skip button; the app's
  philosophy is that anything not applicable can be skipped.
- **Tracking** toggles (calories, macros, weight) all start off by default.
- The final step offers five **start areas** — Cookbook, Analyser, Planner, Diary,
  Pantry.
- "Get started" posts `/api/user/complete-onboarding` and routes the household to
  its chosen area.

An existing household re-running onboarding has its saved preferences pre-filled
from `/api/user/preferences`.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/onboarding-page.tsx#L28` |

## Related

- [[page-onboarding]] — the page that hosts this wizard
- [[jrn-first-run]] — the journey this wizard sits inside

## Known defects

- `fnd-onboarding-not-resumable` — the step index is React local state and no
  progress is persisted; leaving before the final step sends the household back to
  step 1 of 12 on their next visit. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
