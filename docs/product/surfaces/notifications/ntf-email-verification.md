---
entry: ntf-email-verification
name: Verification email
section: notifications
status: live
visibility: public
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Verification email

> The email that confirms a new household's address.

## What it is

The email that confirms a new household's address. When a household signs up, the
server sends this message with a verification token so they can prove they own
the address they registered with.

## Where it lives

| | |
|---|---|
| Source | `server/email.ts#L28` (`sendVerificationEmail`) |

## Related

- [[jrn-first-run]] — the first-run journey this email is part of
- [[page-auth]] — the auth surface a household verifies from

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
