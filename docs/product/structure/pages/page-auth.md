---
entry: page-auth
name: Sign in
section: pages
status: live
visibility: public
owner: Colin Clapson
route: /auth
last_verified: 2026-07-11
version: 1
---

# Sign in

> Where a household signs in, registers, verifies an email, or resets a password.

## What it is

The single door for getting into an account. From here a household can sign in,
register a new account, ask for a password reset, set a new password from a reset
link, or resend a verification email — the page switches between these modes as
needed. When registration needs an email confirmed, it says so and waits; when a
sign-in is blocked because an email is unverified, it explains and offers to resend.
Arriving with a reset link opens the reset step, and arriving from a "create
account" button opens registration directly.

## Where it lives

| | |
|---|---|
| Route | `/auth` |
| Source | `client/src/pages/auth-page.tsx`, `server/auth.ts` |

## Related

- [[jrn-first-run]] — the first-run journey
- [[page-landing]] — where its sign-up and sign-in buttons come from

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
