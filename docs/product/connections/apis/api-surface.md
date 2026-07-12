---
entry: api-surface
name: THA API surface
section: apis
status: live
visibility: developer
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# THA API surface

> The 322 endpoints THA answers, grouped by domain, and which of them
> require a household, an admin, or nobody at all.

## What it is

The API surface is the full set of HTTP endpoints the THA server answers. There
are 322 of them: 308 registered in `server/routes.ts` and 14 in `server/auth.ts`
(the account, session and demo endpoints). They fall into three access classes.
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

## Where it lives

| | |
|---|---|
| Source | `server/routes.ts` |
| Source | `server/auth.ts` |
| Source | `server/lib/access.ts` |

## Related

- [[dev-capability-registry]] — the registry of what the API can do

## Known defects

- `fnd-unprotected-admin-endpoints` — a set of admin-shaped endpoints exists that
  is not protected by the admin guard. A defect exists here; see PDA1.
- `fnd-public-template-writes` — a set of template write endpoints exists that is
  reachable without authentication. A defect exists here; see PDA1.

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
