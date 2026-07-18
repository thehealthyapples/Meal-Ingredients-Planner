---
entry: api-surface
name: THA API surface
section: apis
status: live
visibility: developer
owner: Colin Clapson
last_verified: 2026-07-18
version: 2
---

# THA API surface

> The 340 endpoints THA answers, grouped by domain, and which of them
> require a household, an admin, or nobody at all.

## What it is

The API surface is the full set of HTTP endpoints the THA server answers. There
are 340 of them: 313 registered in `server/routes.ts`, 14 in `server/auth.ts`
(the account, session and demo endpoints), and 13 in `server/trust-routes.ts`.
They fall into three access classes.
Most require an authenticated household. A distinct group under `/api/admin/*` is
meant for admins only. A small number are open to anyone — the config endpoint,
login and registration, email verification, and the public reads a signed-out
visitor needs.

Access is enforced per-route, not by a single gate. Admin routes are guarded
either by the shared `assertAdmin` middleware from `server/lib/access.ts` or by
an equivalent inline check at the top of the handler. Premium entitlement has its
own `requirePremium` middleware in the same file. The only application-level
`/api` middleware, in `server/auth.ts`, handles demo-session expiry and does not
itself perform authentication or admin checks.

## Trust & Compliance endpoints

Thirteen endpoints live in their own module, `server/trust-routes.ts`, registered
from `server/routes.ts` by `registerTrustRoutes(app)` — a bounded domain owning
its own endpoints rather than appending to the route monolith. They follow the
same recipe as the rest: inline `req.isAuthenticated()`, zod validation,
`{ message }` error bodies.

| Endpoint | Access |
|---|---|
| `GET /api/legal` | anyone — the index of published policies |
| `GET /api/legal/:slug` | anyone — one document, plus the sub-processor list for the privacy policy |
| `GET /api/help` | anyone — help articles and categories, optionally filtered by `?q=` |
| `GET /api/support/kinds` | anyone — the four request kinds, their limits and the support address |
| `POST /api/support/requests` | signed in — send one support request |
| `GET /api/support/requests` | signed in — this account's own requests |
| `GET /api/admin/support/requests` | admin (`assertAdmin`) — the operator queue and open counts |
| `PATCH /api/admin/support/requests/:id` | admin (`assertAdmin`) — change a request's status |
| `GET /api/privacy/summary` | signed in — what THA holds, current consents, the DPO contact |
| `GET /api/privacy/consents` | signed in — the full consent ledger |
| `POST /api/privacy/consents` | signed in — record a grant or a withdrawal |
| `GET /api/privacy/export` | signed in — Article 15, sent as a file attachment |
| `DELETE /api/privacy/account` | signed in — Article 17, gated on password and the typed word DELETE |

Legal and help are deliberately unauthenticated: a policy behind a login is not
published, and help that requires a working account cannot help someone whose
account is not working. Sending a support request is not, because an
unauthenticated endpoint that emails a mailbox is a spam relay.

## Where it lives

| | |
|---|---|
| Source | `server/routes.ts` |
| Source | `server/auth.ts` |
| Source | `server/trust-routes.ts` |
| Source | `server/lib/access.ts` |

## Related

- [[dev-capability-registry]] — the registry of what the API can do
- [[dom-trust-and-compliance]] — the domain the trust endpoints serve

## Known defects

- `fnd-unprotected-admin-endpoints` — a set of admin-shaped endpoints exists that
  is not protected by the admin guard. A defect exists here; see PDA1.
- `fnd-public-template-writes` — a set of template write endpoints exists that is
  reachable without authentication. A defect exists here; see PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
