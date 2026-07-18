---
entry: page-contact
name: Contact
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /contact
last_verified: 2026-07-18
version: 1
---

# Contact

> Send one message to a person — a question, a problem, an idea, or a
> request to correct something — and then see that it arrived.

## What it is

The page at `/contact`. It is one form with a `kind` field, not four forms. The
four kinds are question, issue, feature and data-correction, and the page holds
no wording of its own for them: every label, placeholder and acknowledgement
comes from `GET /api/support/kinds`, so the form and the server agree by
construction. The kind can be preselected from the query string, which is how
Privacy Settings links straight to a data-correction request.

Two things are shown rather than done quietly. The referring path is displayed
before it is attached, because a page that silently posts where you have been is
collecting rather than helping. And where a kind carries the UK GDPR Article 16
one-month deadline, the form says so — a right should not read like a favour.

Below the form, "Your messages" lists what this account has already sent, with
the operator lifecycle said in a household's words: Received, Being looked at,
Answered, Closed. A household that has sent nothing is told so plainly.

Sending requires a signed-in account. That is a deliberate limitation rather than
an oversight: an unauthenticated write endpoint that emails a mailbox is a spam
relay, and there is no captcha to put in front of one. Signed-out visitors are
given the support address to write to directly.

Each message becomes a row in `support_requests`, which is the operator's inbound
queue, and the sender receives an acknowledgement email.

## Where it lives

| | |
|---|---|
| Route | `/contact` |
| Source | `client/src/pages/contact-page.tsx` |
| Source | `shared/support/support-request.ts`, `server/support/support-service.ts` |
| API | `GET /api/support/kinds`, `GET`/`POST /api/support/requests` (`server/trust-routes.ts`) |
| Table | `support_requests` |
| Reached from | the Profile page, the Help Centre, and Privacy Settings |

## Related

- [[dom-trust-and-compliance]] — the domain this page belongs to
- [[page-help-centre]] — the written answers tried before this page
- [[page-privacy-settings]] — where a data-correction request starts

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
