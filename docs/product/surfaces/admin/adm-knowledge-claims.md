---
entry: adm-knowledge-claims
name: Nutrition Claim Review
section: admin-experiences
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-19
version: 1
---

# Nutrition Claim Review

> Approve, reject or withdraw individual nutrition health claims, with every
> decision permanently attributed and auditable.

## What it is

The capability, available to admins, to decide claim by claim whether a statement
about food and health may be shown to a household at all.

A nutrition claim carries citations but stays invisible until a named human
approves it. This capability is where that decision is made. For each claim a
reviewer sees the citations as openable links, what approving that class of claim
asserts, and — for preparation effects — the exact sentence a household would be
shown, because the wording *is* the claim.

Four decisions are available, and which ones are offered depends on the claim's
current state:

| State | Available |
|---|---|
| Awaiting review | Approve · Reject |
| Approved | Withdraw |
| Rejected | Reopen for review |

A rejected claim cannot be approved in one step. It must be reopened first, so
that reversing a colleague's refusal of a health claim is always a deliberate
two-part act and never a mis-click, and so the reopening is itself recorded.

Approval requires the claim to carry at least one structurally valid citation from
a trusted source. A reviewer's judgement is necessary but never sufficient — they
cannot vouch a claim past a missing or untrusted source.

Every decision names the reviewer from their signed-in account (never from
anything the browser sends), records a reason where one is required, and is
written to permanent, append-only history alongside a snapshot of the citations as
they read at the moment of the decision.

## What it is not

It does not create, edit or delete claims, and it does not attach citations. It
decides only whether an existing claim may be published.

It is distinct from the [[adm-knowledge-review]] Workbench, which governs
vocabulary aliases and never touches claim evidence.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/admin-knowledge-claims-page.tsx` |
| Writer | `server/lib/knowledge-claim-review-store.ts` |
| Vocabulary | `shared/knowledge/evidence.ts` |

## Related

- [[page-admin-knowledge-claims]] — the page this capability is reached at
- [[adm-knowledge-review]] — the separate vocabulary-alias workbench

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-19._
