---
entry: ntf-email-password-reset
name: Password reset email
section: notifications
status: live
visibility: public
owner: Colin Clapson
last_verified: 2026-07-11
version: 1
---

# Password reset email

> The email that lets a household back into their account.

## What it is

The email that lets a household back into their account. When someone requests a
password reset, the server sends this message with a reset token so they can set
a new password and regain access.

## Where it lives

| | |
|---|---|
| Source | `server/email.ts#L90` (`sendPasswordResetEmail`) |

## Related

- [[page-auth]] — the auth surface a household resets from

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-11._
