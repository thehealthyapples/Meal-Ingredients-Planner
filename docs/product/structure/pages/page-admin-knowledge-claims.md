---
entry: page-admin-knowledge-claims
name: Admin — Nutrition Claim Review
section: pages
status: live
visibility: admin
owner: Colin Clapson
route: /admin/knowledge-claims
last_verified: 2026-07-19
version: 1
---

# Admin — Nutrition Claim Review

> Approve or reject individual nutrition health claims before a household is ever
> shown one.

## What it is

The page at `/admin/knowledge-claims`, where a qualified reviewer works through
nutrition health claims one at a time. Each claim is shown with its citations
rendered as openable links, the publisher and the date the link was last checked,
and a sentence stating what approving *that kind* of claim actually means — a
composition claim asserts that a food is a notable source of a nutrient, which is
a different statement from the nutrient being beneficial.

A reviewer can approve a claim, reject it with a recorded reason, withdraw a claim
they previously approved, or reopen a rejected one for re-examination. Every
decision names the reviewer from their signed-in account and is written to a
permanent audit history that can be read back per claim.

Approving a claim is what makes it visible to households — across Food, Meal,
Pantry and Planner Intelligence, the Companion, nutrition reports and Plant
Diversity. Nothing renders until a named human approves it.

## What it is not

It is **not** the [[page-admin-knowledge-review]] Workbench, which governs
*vocabulary aliases* — which written term means which nutrient — and never
touches claim evidence. The two lifecycles are separate and are deliberately kept
on separate pages.

There is **no bulk approve** here, by design. Claims are reviewed individually.
The approve-all-valid path exists only as a command line step
(`npm run knowledge:signoff`) behind a printed list and a typed confirmation.

## Where it lives

| | |
|---|---|
| Route | `/admin/knowledge-claims` |
| Source | `client/src/pages/admin-knowledge-claims-page.tsx` |
| Routing | `client/src/App.tsx` |
| API | `/api/admin/knowledge-claims/*` (`server/routes.ts`) |
| Writer | `server/lib/knowledge-claim-review-store.ts` |

## Related

- [[dom-admin]] — the domain this page belongs to
- [[adm-knowledge-claims]] — the Nutrition Claim Review capability this surface provides
- [[page-admin-knowledge-review]] — the separate vocabulary-alias workbench

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-19._
