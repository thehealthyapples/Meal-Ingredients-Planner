---
entry: jrn-share-plan
name: Share a plan
section: journeys
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Share a plan

> A household shares its week with someone else, who can open it and copy it into their own planner.

## What it is

Two households, one plan. An owner generates a link to its six-week plan; a
recipient opens a read-only view of it and imports it into their own planner.

## The path

**The owner:**

1. Opens the Share dialog from the Planner.
2. If the planner has not been saved as a template yet, saves it first
   ("Save My Planner Now", `POST /api/plan-templates/mine`).
3. **Generate Share Link** (`POST /api/plan-templates/mine/:id/share`) returns a
   shareable URL, which can be copied or sent via WhatsApp or Email. (Free accounts
   may share one plan at a time; "Stop Sharing" revokes the link.)

**The recipient:**

4. Opens `/shared/:token` and sees a read-only six-week grid
   (`GET /api/shared/:token`). A revoked or expired link shows a calm
   "This plan is no longer shared".
5. **If signed in:** "Import into My Planner"
   (`POST /api/plan-templates/:id/import`, keep mode, empty slots only) fills the
   recipient's empty slots and sends them to `/planner`.
6. **If not signed in:** the page instead offers "Create a Free Account to Import".

## Where it breaks

For a logged-out recipient, "Create a Free Account to Import" is a plain link to
`/auth` (`shared-plan-page.tsx`) that carries no token and no return target. The
auth page, on success, always redirects to `/`. So after the recipient signs up
they land on the home screen with no memory of the plan they came to import — the
intent that brought them is lost, and they must find the original link again.

## Where it lives

| | |
|---|---|
| Source | `client/src/components/share-plan-dialog.tsx` |
| Source | `client/src/pages/shared-plan-page.tsx` |

## Related

- [[page-planner]] — where the owner shares from and the recipient imports into
- [[page-shared-plan]] — the read-only page the recipient opens

## Known defects

- `fnd-shared-plan-intent-lost` — a logged-out recipient's "Create a Free Account
  to Import" links to bare `/auth` with no token; after signup they land on `/` and
  the plan they intended to import is forgotten. See PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
