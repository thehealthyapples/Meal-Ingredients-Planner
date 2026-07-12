---
entry: int-smtp
name: SMTP email
section: integrations
status: live
visibility: admin
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# SMTP email

> Delivers the only two emails THA sends — verification and password reset.

## What it is

SMTP email is how THA sends the only two messages it ever emails a household: a
verification link when an account is created, and a reset link when a password
is forgotten. It is an admin-configured mail connection with no other job.

## Where it lives

| | |
|---|---|
| Source | `server/email.ts` |

## What breaks without it

When SMTP is not configured, the mail transporter is never created, and each
send returns `{ success: false }` (`email.ts`). Registration still succeeds —
the account is created and the server only logs a warning that the verification
email could not be sent — but the household never receives its verification
link, and cannot receive a password-reset link either.

## Related

- [[ntf-email-verification]] — the verification email
- [[ntf-email-password-reset]] — the password-reset email

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
