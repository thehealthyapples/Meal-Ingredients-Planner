# THA Trust & Compliance Architecture

**Status:** Governing. Established under `BUS1` (2026-07-18).
**Scope:** How The Healthy Apples publishes what it promises, records what a household agreed to, honours their rights over their own data, and lets them reach a person.
**Governing document:** [`ARCHITECTURE_PRINCIPLES.md`](./ARCHITECTURE_PRINCIPLES.md)

---

## 0. The one sentence

**A household must be able to read what THA promises, see what THA holds, take it, correct it, delete it, and reach a person — and THA must be able to prove it did each of those things.**

Everything below is the architecture of that sentence.

---

## 1. Why this document exists

Before `BUS1`, The Healthy Apples had **no** Privacy Policy, **no** Terms of Service, **no** Cookie Policy, **no** consent record of any kind, **no** way for a household to get their data out, **no** way to delete an account, and **no** inbound channel to support beyond two `mailto:` links in Profile. `LAUNCH1` had already recorded the gap in one line — *"Legal and compliance: 0%"* — and named the reason it mattered: THA stores **Article 9 special category health data** (allergies, dietary restrictions, health goals, height and weight, children in the household) by design, because a food product that does not know a household's allergies is unsafe.

That is not a missing feature. It is the platform being unable to answer, at all, the questions a household is entitled by law to ask it.

This document is the architecture of the answers.

### What it does not do

It creates no new architecture where one exists. It **cites** the Experience Architecture for behaviour, the UI Architecture for presentation, the Source of Truth Register for ownership, and `server/lib/access.ts` for authorisation, and it restates none of them. It adds **no** payment processing, **no** subscription, and **no** commercial terms — those belong to `BUS2`, in the change that builds commerce (§ 11).

---

## 2. The four owners

`BUS1` creates exactly four canonical owners. Every surface in the trust layer reads from one of them and none holds a fact of its own.

| Owner | Owns | Path |
|---|---|---|
| **The legal register** | Which documents exist, what version each is at, and every word they say | `shared/legal/` |
| **The consent vocabulary** | What a household can be asked to agree to, and the lawful basis for each | `shared/privacy/consent.ts` |
| **The personal data registry** | What personal data THA holds, how it is exported, and how it is erased | `server/privacy/personal-data-registry.ts` |
| **The support vocabulary** | What a household can send THA, and the wording of each kind | `shared/support/support-request.ts` |

Three of the four are **pure, zero-I/O modules beside the entity spine** — the class `ARCHITECTURE_PRINCIPLES.md` Principle 5 describes and the Source of Truth Register's Appendix A already records for `ATTN1` and `DEC1`. They have no table, no cache, no column, and no DB owner.

The fourth — the personal data registry — is executable, and § 5 explains why it had to be.

---

## 3. The legal register

### 3.1 The separation that defines it

**Permanent policy content and placeholder company information are separate files, and the prose contains no company fact.**

Policy documents hold `{{company.*}}` tokens. `shared/legal/company-profile.ts` holds every invented value, and a machine-readable list of which values are still invented. Replacing them before launch is a one-file task, and it does not require re-reading three thousand words of policy to find what was made up.

### 3.2 Honest absence, applied to a legal page

`COMPANY_PROFILE.placeholder` is **derived** from the list of unverified fields, never set by hand. While it is true, every legal page renders an undismissable notice naming exactly which facts are not yet confirmed. It disappears by itself when the profile is completed.

THA does not publish an invented company registration number and hope nobody checks. An unverified legal fact renders as a stated gap — Core Principle 6, applied at the surface where getting it wrong matters most.

### 3.3 Versions are load-bearing

Every document carries a `version` and an `effectiveDate`, and every consent record stores the version consented to.

> *"Agreed to the privacy policy"* is not a demonstrable fact, because the policy may have changed since. *"Agreed to privacy policy 1.0.0 on this date"* is.

**Rule TC1 — A change to a document's prose that a household would care about MUST bump its version.** Editing prose without bumping the version silently invalidates every consent record citing it.

### 3.4 The sub-processor list is data, not prose

`shared/legal/subprocessors.ts` holds the third parties that process household data, each read out of the code that calls them. The Privacy Policy renders a table built from that list.

A sub-processor list is the most frequently-wrong section of every privacy policy in existence, because it is prose and prose is never checked against the code. Holding it as data makes adding a processor without declaring it a **visible** omission rather than an invisible one.

**Rule TC2 — A third party that receives household data is declared in `subprocessors.ts` in the change that introduces it.**

---

## 4. Consent

### 4.1 The ledger is append-only

`user_consents` records one row per **decision**, never per **state**. A withdrawal is a new row with `granted = false`. The current answer is the newest row for a `(user_id, consent_type)` pair.

This is not fastidiousness. UK GDPR Art. 7(1) requires THA to be able to *demonstrate* consent, and a mutable consent record demonstrates nothing — it cannot distinguish *"they consented and later withdrew"* from *"they never consented and somebody edited the row"*. **A ledger you can overwrite is not evidence.**

**Rule TC3 — Nothing updates or deletes a consent row while the account lives.**

### 4.2 Consent is a precondition of the account

Registration refuses without explicit agreement, checked **twice**: the form cannot submit unticked, and the server refuses the request regardless of what the client sends. The box starts unticked and is never pre-filled — Art. 4(11) requires a clear affirmative action, and a pre-ticked box is the canonical example of what is not one.

THA stores Art. 9 health data, lawful only on **explicit consent** under Art. 9(2)(a). An account created without it would be unlawful from its first row, so the consent write is **awaited** during registration: if the ledger write fails, registration fails.

### 4.3 There is no consent for things THA does not do

`CONSENT_TYPES` holds three entries and deliberately contains no analytics, marketing, or cookie-category consent, because THA runs no analytics, sends no marketing, and sets one strictly-necessary cookie.

**Rule TC4 — A consent type is added in the change that makes the thing it covers true, never speculatively.** A consent prompt for something that does not happen teaches households that these prompts are noise, and the next one that matters gets dismissed too.

### 4.4 No cookie banner — a decision, not an omission

THA sets exactly one cookie (`connect.sid`), and `saveUninitialized: false` means **no cookie exists at all until you sign in**. Under PECR reg. 6(4) a strictly necessary cookie requires no consent.

A banner asking permission for a cookie that needs none, with categories for analytics and marketing that do not exist, would be **consent theatre**: it would state, in the product's own voice, that THA does things it does not do (Core Principle 6), and it would train households to dismiss a dialog without reading it (UX Checklist — dark patterns).

So THA says so plainly in the Cookie Policy and gets out of the way.

**Rule TC5 — The change that introduces a non-essential cookie is the change that adds the banner, the categories, and granular consent — with refusal made exactly as easy as acceptance.** The ledger is already general enough to record them.

---

## 5. Personal data: one registry, two verbs

### 5.1 Why access and erasure share an owner

Article 15 (*what do you hold about me?*) and Article 17 (*delete what you hold about me*) are **the same question with different verbs**. Implemented separately they drift, and the direction of drift is always the same and always the dangerous one: the export gains a table because a developer wanted to see it, the erasure does not, and THA quietly keeps data it has told a household it destroyed.

`server/privacy/personal-data-registry.ts` is one declaration with two verbs. Adding a personal-data table means adding **one** entry.

**Rule TC6 — Export and erasure read the same registry. Neither may name a table the other does not.**

### 5.2 Why the registry is executable

The obvious design is metadata — table name, column, a strategy enum — interpreted by a generic engine. It was rejected because **this schema is not regular enough for one**:

| Shape | Example | Consequence |
|---|---|---|
| No foreign key at all | `meals`, `shopping_list`, `planner_weeks`, `user_preferences` | Nothing cascades; rows survive deletion silently |
| FK with no `ON DELETE` | `admin_audit_log`, the `knowledge_*` review chain | Postgres **blocks** the delete |
| `ON DELETE SET NULL` | `household_eaters` | Health data **orphans** rather than erasing |
| Two levels of parent, no cascade at either | `planner_weeks → planner_days → planner_entries` | Deleting a parent strands its children forever |
| Invisible to Drizzle | `session` (raw SQL, absent from `shared/schema.ts`) | A "deleted" account stays signed in |

A generic interpreter would need an escape hatch for each, at which point it is a worse version of a function. Each entry therefore carries the real query and reads as exactly what it does.

### 5.3 Erasure order is load-bearing

Declared once in `ERASURE_ORDER`, with three constraints:

1. **`operator-audit` runs first** — its columns are FKs with no `ON DELETE`, so until they are nulled the final delete is blocked by the database.
2. **`account` runs last** — every other step needs the `users` row to exist.
3. **`household` runs after `household-membership`** — whether the household is erased depends on whether anyone else remains in it.

A registry entry with no position in the order **fails the erasure at startup** rather than being silently skipped. A partial erasure reported as complete is worse than no erasure.

### 5.4 No transaction, and why that is correct

Every step is **idempotent** (`DELETE ... WHERE user_id =`, `UPDATE ... SET user_id = NULL WHERE user_id =`) and the ordering makes the operation **resumable**: the `users` row is deleted last, so any failure before that leaves the account fully intact and the erasure safely retryable.

One transaction over all of it would hold write locks across ~45 tables — including `meals` and `knowledge_*`, which every other household is reading — for the whole erasure. The failure mode that matters, *"we said we deleted it and we did not"*, is unreachable silently either way: **either the account row is gone, which can only happen once every reference to it is removed, or the caller got an error.**

### 5.5 What survives erasure, and why

Three things, each identifying nobody:

| Survives | Basis | How it is stripped |
|---|---|---|
| Consent rows | Art. 6(1)(c) / Art. 7(1) — THA may need to show consent for processing that already happened | `user_id`, IP and user-agent nulled |
| Support requests | Art. 5(2) — proof a data-subject request was answered | `user_id` and email nulled, subject and body redacted |
| `privacy_activity_log` | Art. 5(2) accountability | Holds only an integer, an action, a date and row counts — **no foreign key at all**, so it outlives the row it refers to |

**Rule TC7 — Anything retained past erasure is named in the Privacy Policy, holds no identifying value, and states its lawful basis in the registry.**

### 5.6 Operator audit trails are anonymised, never deleted

`admin_audit_log`, the knowledge-review chain and their siblings record who approved THA's food and knowledge decisions. An audit log a person can erase by asking is not an audit log, and Art. 17(3)(b) permits retention. So the decision stays and **the name is removed**.

Closing this required the one schema alteration in `BUS1`: `admin_audit_log.admin_user_id` was `NOT NULL` with a blocking FK, which meant **Article 17 was unsatisfiable for every operator account in the platform's history** — Postgres refused the delete outright. Dropping `NOT NULL` lets the actor be nulled while the row survives.

---

## 6. Support: one entity, four kinds

`support_requests` carries a `kind` — `question`, `issue`, `feature`, `data-correction` — and is one table.

Those four look like four features. They are one: a person writes THA a message, and a person at THA must read it, act on it, and close it. They differ only in what the sender wants; everything else is identical. Four tables would be four triage states, four operator queues, and four chances for one of them to be the queue nobody watches.

**`data-correction` is deliberately in the same queue.** A UK GDPR Art. 16 rectification request *is* a message a person must act on, with a one-month statutory deadline attached. A separate table would have split one queue in two and made it possible for a lawful request to sit unseen in the half nobody watches. It is additionally written to `privacy_activity_log` — the log is the accountability record, the queue is how a person answers it, and neither replaces the other.

**Rule TC8 — A new thing a household can send THA is a `kind`, not a table.**

### 6.1 The Support Hub finally has an inbound channel

`SUP1`–`SUP3` and `ADMIN2` built the operator-facing "Support Hub" — and it had **no inbound channel**: nothing a household did anywhere in the product created a row an operator could read as *"this person needs help"*. `GET /api/admin/support/requests` is that channel.

---

## 7. Transactional email

One layout (`server/email/layout.ts`), one send path, five templates: verification, password reset, welcome, support acknowledgement, account deleted.

Before `BUS1` there were two emails, each carrying its own complete inline HTML — two copies of one visual identity, kept in agreement by nobody, and a third could only have been a third copy. The predecessor `server/email.ts` was **deleted** in the same change (Principle 8 — no dormant predecessor); every import of `./email` resolves to the new module and both pre-existing functions keep their exact signatures and behaviour.

**`layout.ts` is the one place in the platform permitted to hold literal colour values.** Email is the one surface THA's design tokens cannot reach — no custom properties, no stylesheet, no cascade. A literal colour anywhere else in an email is a defect.

The welcome email is sent **after verification, not at registration**, because until then THA does not know the address belongs to the person who typed it.

---

## 8. Where the surfaces live

| Surface | Route | Who |
|---|---|---|
| Policies index and documents | `/legal`, `/legal/:slug` | **Public — unauthenticated** |
| Privacy Settings | `/privacy-settings` | Household |
| Help Centre | `/help` | Household |
| Contact / report / suggest / correct | `/contact` | Household |
| Support queue | `/api/admin/support/requests` | Admin |

**Rule TC9 — Legal documents are public.** A policy a person must agree to before signing up cannot live behind a login, and a privacy policy behind a login is not published.

### 8.1 Leaving is not made hard

Deletion lives on Privacy Settings, one step from Profile — not buried, and not behind an email to support. It asks for a password and the literal word `DELETE`: friction that protects the person from a mis-click, never friction that protects THA from losing them.

It does not ask why they are leaving. It offers no discount, no pause, and no *"are you sure? you'll lose 47 recipes"*. It states plainly what will happen and then does it. (UX Governance Checklist — *free of manufactured urgency, guilt copy, confirm-shaming, hidden opt-outs, and friction on leaving*.)

---

## 9. What this creates, and what it deliberately does not

**Creates:** three tables (`user_consents`, `support_requests`, `privacy_activity_log`), four canonical owners, four pages, one new client building block, five email templates, and Source of Truth Register Domains 34–36.

**Retires:** `server/email.ts` (deleted), the two hardcoded contact-address copies in `profile-page.tsx` and `server/auth.ts` (converged onto the company profile), and the body of `storage.cleanupDemoUser`, which is now a thin alias over the canonical erasure service.

**Does NOT create:** any payment path, subscription, billing record, or commercial term; any analytics or tracking; any cookie beyond the one that already existed; any second authorisation authority (`server/lib/access.ts` remains the only one — the registry *labels*, it never *authorises*); any scheduler.

---

## 10. Compliance obligations this adds

Every implementation must additionally satisfy:

```
TRUST & COMPLIANCE CHECK
────────────────────────
✓ Does this change what personal data THA holds? If yes, the personal data
    registry has an entry for it IN THIS CHANGE — with both verbs decided.
✓ Does it introduce a third party that receives household data? If yes, it is
    declared in shared/legal/subprocessors.ts in this change.
✓ Does it change what a household is agreeing to? If yes, the document version
    is bumped, or the consent record it produces is a lie.
✓ Does it add a cookie that is not strictly necessary? If yes, this change adds
    the banner and granular consent — refusal exactly as easy as acceptance.
✓ Does it make leaving harder than it was?  Must be NO.
```

**If any check fails: STOP, explain why, do not continue.**

---

## 11. Left to `BUS2`

Named here so they are not rediscovered:

- **Commercial terms and payments.** No dormant payment clauses were shipped; the Terms say plainly that there are none and that new terms will be presented if that changes.
- **A scheduler.** THA has none. Expired trial accounts are still only cleaned when an admin manually calls the endpoint, and any retention policy that must run on a timer has nothing to hang off.
- **Grace-period deletion.** Erasure is immediate and irreversible, which is fully compliant and needs no scheduler. A 30-day recoverable window would need one.
- **Help Centre editorial workflow.** Content is a module today. Governance Rule 6 requires it to move to the database when it exceeds ~30 entries or needs non-developer editing; it is at 20.
- **Re-consent prompting.** The ledger detects that a household agreed to a superseded version and Privacy Settings shows it, but nothing yet asks them to agree again.
- **The company profile itself.** Six placeholder values, listed in one file, blocking launch and nothing else.

---

*This document governs the trust and compliance layer of The Healthy Apples.*
*Questions or conflicts → stop and report before implementing.*
