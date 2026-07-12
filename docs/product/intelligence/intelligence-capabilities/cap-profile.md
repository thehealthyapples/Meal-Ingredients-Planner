---
entry: cap-profile
name: Profile capability
section: intelligence-capabilities
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Profile capability

> Apple can read the household's own preferences back to them; passwords and
> tokens are never exposed to it.

## What it means for the household

Ask Apple about the household's own settings and preferences and it will read
them back — diet, budget, the choices the household has already made. It is a
plain-language mirror of what the household told THA about itself.

## What it will never do

It never sees the household's secrets. Passwords and security tokens are not
exposed to Apple at all, so it cannot read, repeat or leak them. And it reads
preferences rather than changing them — updating a setting stays with the
person.

## Where it lives

| | |
|---|---|
| Registry | `server/intelligence/capability-registry.ts` (`profile`) |
| Capability Card | `docs/architecture/capabilities/profile.md` |

The Capability Card owns the architecture, including exactly which fields are
withheld; this entry only says what the capability means for a household.

## Related

- [[dom-household]] — the domain this capability serves
- [[page-profile]] — where the household edits these preferences

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
