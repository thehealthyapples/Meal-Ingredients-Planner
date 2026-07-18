---
entry: page-legal
name: Policies
section: pages
status: live
visibility: public
owner: Colin Clapson
route: /legal
last_verified: 2026-07-18
version: 1
---

# Policies

> Read the Privacy Policy, Terms of Service and Cookie Policy in full,
> without an account and before agreeing to anything.

## What it is

The page at `/legal`, and every document under `/legal/:slug`. One component
serves both: with no slug it lists the three published documents — Privacy
Policy, Terms of Service and Cookie Policy — each with its summary, version and
effective date; with a slug it renders that document in full.

It is public and unauthenticated. A person must be able to read what they are
agreeing to before they have an account, so neither the page nor the `/api/legal`
endpoints behind it require a session.

The documents are written in `shared/legal/documents/` and rendered from there.
The Privacy Policy additionally renders the sub-processor table from
`shared/legal/subprocessors.ts` — the same list the platform is built against,
not a paragraph typed beside it. The company profile is still a placeholder, and
the API sends the placeholder state with the content so the page says so rather
than each surface deciding for itself.

The page is deliberately plain: no orchard, no Living Detail, no motion. An
unknown slug is answered with "We could not find that policy" and a link back to
the index.

## Where it lives

| | |
|---|---|
| Route | `/legal` |
| Route | `/legal/:slug` |
| Source | `client/src/pages/legal-page.tsx` |
| Source | `client/src/components/legal/legal-document-view.tsx` |
| Source | `shared/legal/index.ts`, `shared/legal/documents/`, `shared/legal/subprocessors.ts` |
| API | `GET /api/legal`, `GET /api/legal/:slug` (`server/trust-routes.ts`) |
| Reached from | the Profile page, Privacy Settings, and the registration consents on `/auth` |

## Related

- [[dom-trust-and-compliance]] — the domain this page belongs to
- [[page-auth]] — where the consents given against these documents are taken

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
