---
entry: dom-household
name: Household & Profile
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-18
version: 2
---

# Household & Profile

> Who lives here, what each person eats and cannot eat, and how the
> household wants THA to behave.

## What it is

Household & Profile is where a household describes itself and sets how THA
should behave for it. The Profile page gathers this into groups: Personal
(goals, shopping preferences, meal-plan settings, the companion's voice, and
feature toggles), Household (who eats here — adults, children and babies — each
person's diet pattern and restrictions, meal mode and cooking limits, plus
household management), and Settings & Support (account and contact). The
dietary details here are what planning and shopping use to keep meals safe for
everyone at the table.

The household capability's read surface is always scoped to the caller's own
household, resolved from the signed-in session. That canonical definition lives
in its own card.

## Where it lives

| | |
|---|---|
| Route | `/profile` |
| Source | `client/src/pages/profile-page.tsx` |
| Capability | [Household](../../../architecture/capabilities/household.md) |

## Related

- [[page-profile]] — the page that renders this domain
- [[cap-household]] — the household capability
- [[cap-profile]] — the profile capability
- [[page-privacy-settings]] — the data rights reached from Settings & Support
- [[page-help-centre]] — the written help reached from Settings & Support
- [[page-contact]] — the contact form reached from Settings & Support

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
