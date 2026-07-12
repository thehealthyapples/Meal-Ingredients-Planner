---
entry: set-diet-types
name: Diet, allergies and exclusions
section: settings
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Diet, allergies and exclusions

> What the household will not eat — the setting that everything else in
> THA must respect.

## What it is

This is where a household records what it will not eat: its diet, its allergies,
and any specific exclusions. It is the most consequential setting in THA, because
everything downstream — planning, shopping, recipes and suggestions — is expected
to respect it. It is edited on the profile page and stored against the household.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/profile-page.tsx` |
| Source | `shared/schema.ts` |

## Default

None set. A new household starts with no diet, allergies or exclusions recorded.

## Related

- [[page-profile]] — where this is set
- [[dom-household]] — the domain that owns it
- [[ntf-shopping-opportunity]] — a notification that must respect it

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
