---
entry: set-companion-personality
name: Companion voice
section: settings
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Companion voice

> How Apple speaks to the household.

## What it is

The Companion voice is the household's choice of how Apple, the Companion,
speaks to them. It selects a personality from THA's registry of Companion voices,
shaping the tone of the Companion's replies. It is set on the profile page and
read by the conversation layer.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/profile-page.tsx` |
| Source | `server/intelligence/conversation/personality-registry.ts` |

## Default

`companion` — the default voice a household has until it chooses another.

## Related

- [[dom-companion]] — the Companion this voice belongs to
- [[page-profile]] — where the voice is chosen

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
