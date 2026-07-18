---
entry: dom-trust-and-compliance
name: Trust & Compliance
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-18
version: 1
---

# Trust & Compliance

> The policies THA publishes, what it holds about a household, the rights they
> can exercise over it, and how they reach a person when something is wrong.

## What it is

Trust & Compliance is the part of THA that is about THA itself rather than about
food. It holds four surfaces and the declarations behind them.

The **policies** — Privacy Policy, Terms of Service and Cookie Policy — are
published at `/legal` and readable without an account, because a policy behind a
login is not published. They are written in `shared/legal/documents/` and
rendered from there, and the Privacy Policy carries the sub-processor list from
`shared/legal/subprocessors.ts` rather than a paragraph typed beside it. The
company profile is still a placeholder, and every surface that renders a document
is told so and says so.

**What THA holds** is declared once, in `server/privacy/personal-data-registry.ts`.
That one file is the owner of the fact "what personal data does THA hold about a
person, and what happens to it when they ask for it or ask us to delete it." The
data export, the account erasure and the summary shown in Privacy Settings all
read the same registry, so they cannot describe different platforms.

**Consent** is an append-only ledger in `user_consents`. A withdrawal is a new
row, never an edit, and every row records the version of the document it was
given against. Registration cannot complete without the three required consents.

**Support** is the Help Centre at `/help`, the contact form at `/contact`, and
the `support_requests` table the two feed. Before BUS1 nothing a household did
anywhere in the product created a row an operator could read as "this person
needs help".

## Where it lives

| | |
|---|---|
| Routes | `/legal`, `/legal/:slug`, `/privacy-settings`, `/help`, `/contact` |
| Source | `shared/legal/` |
| Source | `shared/privacy/consent.ts` |
| Source | `shared/support/help-centre.ts`, `shared/support/support-request.ts` |
| Source | `server/privacy/personal-data-registry.ts` |
| Source | `server/trust-routes.ts` |
| Tables | `user_consents`, `support_requests`, `privacy_activity_log` |
| Architecture | [Trust & Compliance](../../../architecture/THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md) |

## Related

- [[page-legal]] — the published policies
- [[page-privacy-settings]] — where a household acts on its own data
- [[page-help-centre]] — the written answers
- [[page-contact]] — the way to reach a person
- [[set-privacy-and-data]] — the consents and data controls
- [[hlp-help-centre]] — the articles themselves

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
