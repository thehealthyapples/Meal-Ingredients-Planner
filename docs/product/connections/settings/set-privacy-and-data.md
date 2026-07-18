---
entry: set-privacy-and-data
name: Privacy and your data
section: settings
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-18
version: 1
---

# Privacy and your data

> What the household has agreed to, and the controls for taking a copy of
> their data, asking for a correction, or deleting the account.

## What it is

The choices a household can make about its own data, rather than about how THA
behaves. There are three consents — the Terms of Service, the Privacy Policy, and
storing the household's allergies, dietary restrictions and health goals. All
three are required, and all three are given at registration by a clear
affirmative action; nothing is pre-ticked, and an account cannot be created
without them.

Consent is stored as an append-only ledger in `user_consents`. A withdrawal is a
new row with `granted: false`, never an edit to the row that granted it, and
every row records the version of the document the consent was given against.
Withdrawal is offered on each granted consent in Privacy Settings, and the
consequence is stated before the choice is taken — for the two contract consents,
that is the end of the account; for the health-data consent, it is the erasure of
the household's allergies and the end of food filtering.

Alongside the consents sit the actions: download everything THA holds, ask for a
correction, and delete the account. Deletion requires the account password and
the typed word DELETE, both checked on the server.

Data exports, erasures and support requests are recorded in
`privacy_activity_log`.

## Where it lives

| | |
|---|---|
| Source | `client/src/pages/privacy-settings-page.tsx` |
| Source | `shared/privacy/consent.ts` |
| Source | `server/privacy/consent-service.ts` |
| Source | `server/privacy/personal-data-registry.ts` |
| Tables | `user_consents`, `privacy_activity_log` |
| Default | terms of service, privacy policy and health-data processing, all agreed at registration |

## Related

- [[page-privacy-settings]] — where these are reviewed and changed
- [[dom-trust-and-compliance]] — the domain these settings belong to
- [[set-inventory]] — the household's other settings
- [[page-legal]] — the documents the consents are given against

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
