---
entry: page-privacy-settings
name: Privacy and your data
section: pages
status: live
visibility: household
owner: Colin Clapson
route: /privacy-settings
last_verified: 2026-07-18
version: 1
---

# Privacy and your data

> See what THA holds about you, download it, ask for a correction, review
> what you have agreed to, and delete your account.

## What it is

The page at `/privacy-settings`, reached from Profile. It is a quiet side room,
and it holds five sections.

**Download your data** requests `GET /api/privacy/export`, which sends the whole
export as a file attachment rather than a JSON body, so the browser saves
something the person can keep.

**What we hold about you** lists the categories from the personal data registry,
each with what it is, whether it is included in the export, and — where it is
not — why it was omitted.

**Correct your data** offers the two real routes: edit the profile directly, or
send a data-correction request to `/contact?kind=data-correction`.

**What you have agreed to** shows each consent, the version of the document it
was given against, the lawful basis, and the date. Where a document has been
updated since, it says so. Withdrawal is offered on every granted consent and
states its consequence before it is taken.

**Our policies** links to the three published documents.

Account deletion sits at the top of the page, inline rather than in a dialog. It
asks for the account password and the literal word DELETE, both checked
server-side. It does not ask why, does not offer a discount or a pause, and does
not warn about what will be lost beyond telling the person plainly what will
happen. On success the account and its data are erased, the session ends, and a
confirmation email is sent from an address held in memory only.

## Where it lives

| | |
|---|---|
| Route | `/privacy-settings` |
| Source | `client/src/pages/privacy-settings-page.tsx` |
| Source | `server/privacy/personal-data-registry.ts` |
| Source | `server/privacy/data-export-service.ts`, `server/privacy/account-erasure-service.ts` |
| API | `GET /api/privacy/summary`, `GET`/`POST /api/privacy/consents`, `GET /api/privacy/export`, `DELETE /api/privacy/account` (`server/trust-routes.ts`) |

## Related

- [[dom-trust-and-compliance]] — the domain this page belongs to
- [[set-privacy-and-data]] — the consents and data controls this page edits
- [[page-legal]] — the policies it links to
- [[page-contact]] — where a correction request is sent
- [[page-profile]] — where this page is reached from

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-18._
