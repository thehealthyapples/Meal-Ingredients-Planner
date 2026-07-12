---
entry: adm-companion-intelligence
name: Companion Intelligence Workbench
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Companion Intelligence Workbench

> Inspect how the Companion is performing and review its learning recommendations; it does not adjust the Companion's personality, despite the surface's name.

## What it is

The capability, available to admins, to inspect how the Companion is performing.
It surfaces aggregate, anonymised health — understanding rate, successful-conversation
rate, clarification rate, fallback distribution — and the largest learning gaps,
and lets an admin work a Learning Recommendation Queue by approving, rejecting or
completing advisory recommendations and taking a fresh snapshot.

Today this capability inspects only; it exposes no control that changes the
Companion's personality. Where a turn's personality is relevant, it is applied
live from the Personality Registry and shown on the [[adm-behaviour]] workbench.
See PDA1.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-companion-intelligence-page.tsx` |

## Related

- [[page-admin-companion-intelligence]] — the page this capability is reached at
- [[dom-companion]] — the Companion domain this observes

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
