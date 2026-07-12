---
entry: ntf-trial-banner
name: Trial banner
section: notifications
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Trial banner

> The countdown a twenty-minute demo household sees, and the discount offer it
> makes near the end.

## What it is

The banner a demo household sees while their trial is running. It counts down the
time left on the demo (from the household's `demoExpiresAt`), turns to a warning
in the final minutes, and near the end offers to save the household's progress
with a 25%-off-your-first-six-months discount in exchange for an email address.
When the countdown reaches zero it sends the household to the auth page with a
`trial=expired` marker.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/TrialBanner.tsx` |

## Known defects

- `fnd-no-upgrade-path` — there is no completed upgrade path from the trial. See
  PDA1.

## Related

- [[mkt-trial-discount]] — the trial discount offer this banner presents

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
