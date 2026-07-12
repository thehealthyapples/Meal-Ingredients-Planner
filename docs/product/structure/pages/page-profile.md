---
entry: page-profile
name: Profile
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /profile
last_verified: 2026-07-11
version: 1
---

# Profile

> The household's own settings — who eats here, what they avoid, how THA should shop, plan and speak.

## What it is

Where a household tunes The Healthy Apples to itself. It gathers into three
groups: Personal (goals, diet and preferences, and the Companion's voice),
Household (who lives here — adults, children and babies — and how shared meals are
handled, with fuller household management tucked behind a collapsed section), and
Settings & Support (account details, measurement system, subscription standing,
change password, re-run preferences, contact, and sign out). Changes save as they
are made and flow back through the rest of the product.

## Where it lives

| | |
|---|---|
| Route | `/profile` |
| Source | `client/src/pages/profile-page.tsx` |

## Related

- [[dom-household]] — the domain this page belongs to
- [[set-diet-types]] — the diet settings it edits
- [[set-companion-personality]] — the Companion voice setting it edits

## Known defects

- `fnd-no-upgrade-path` — the Settings & Support section shows a Subscription row
  reading either "Free" or "Premium Active", but there is no control to actually
  upgrade. A free household is told its standing and given no way to change it from
  here. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
