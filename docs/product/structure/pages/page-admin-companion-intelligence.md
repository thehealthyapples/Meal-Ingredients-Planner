---
entry: page-admin-companion-intelligence
name: Admin — Companion Intelligence
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/companion-intelligence
last_verified: 2026-07-11
version: 1
---

# Admin — Companion Intelligence

> Inspect the Companion's health and gaps, and approve or reject its learning recommendations — a read-only dashboard, despite its name; it holds no personality control.

## What it is

The page at `/admin/companion-intelligence`, titled "Companion Intelligence
Dashboard". It shows aggregate, anonymised health for the Companion — overall
understanding rate, successful-conversation rate, clarification rate, fallback
state distribution, and the largest learning gaps (unmatched requests, capability
gaps, knowledge gaps). It carries a Learning Recommendation Queue where an admin
approves, rejects or completes advisory recommendations, and a "Generate
recommendations" button that takes a fresh snapshot. Every figure is aggregate
and anonymised; no user or household identity is shown.

The page inspects behaviour but does not edit it: at present it has no control
that changes the Companion's personality. See PDA1.

## Where it lives

| | |
|---|---|
| Route | `/admin/companion-intelligence` |
| Source | `client/src/pages/admin-companion-intelligence-page.tsx` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-companion-intelligence]] — the Companion Intelligence Workbench capability this surface provides
- [[dom-companion]] — the Companion domain this observes

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
