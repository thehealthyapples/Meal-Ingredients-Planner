# THA Commercial Architecture

**Status:** GOVERNING — required reading before any implementation that touches a plan, a subscription, an entitlement, a feature gate, a plan limit, or a price.
**Established:** `BUS2A`, 2026-07-18.
**Source of Truth Register:** Domain 26 (Membership / Subscription / Entitlement) — **extended, not replaced**.
**Subordinate to:** `ARCHITECTURE_PRINCIPLES.md` (which prevails in any conflict) and `THA_TRUST_AND_COMPLIANCE_ARCHITECTURE.md` on every question of what may be published, promised or charged.

---

## 1. What this document is for

THA is a product households will be asked to pay for. Before `BUS2A` it had a
*tier column* and four hand-written comparisons of it, and nothing that could be
called a commercial architecture: no definition of what a plan includes, no
subscription lifecycle, no trial, no entitlement projection, no plan limits
anybody could enumerate, and — most consequentially — **no rule about what THA
may say to a household about money.**

This document governs that layer. It creates **no payment path**: `BUS2A`
integrates no provider, processes no payment, and activates no subscription.

---

## 2. The one-line architecture

```
Billing Provider  →  Billing Events  →  Subscription Projection  →  Entitlements  →  Product Access
   (BUS2B, none)      billing_events         subscriptions           resolver        access.ts
```

**The direction of the arrow is the whole architecture.** A payment provider owns
**payment facts** — was a card charged, did an invoice settle, what is a customer
id. THA owns the **entitlement projection** — what a household may actually do.

Those are deliberately not the same thing. Everything downstream of the
projection reads THA's own data, so **a household's access to the product they
depend on is never an availability question about a third party's API.** If the
provider is unreachable, entitlement still answers.

---

## 3. The rules

### C1 — The payment provider stays behind one module

`server/commerce/billing-provider.ts` is the only module in the platform
permitted to know a payment provider exists. Provider vocabulary — price ids,
subscription ids, provider-specific statuses — may not appear past it, and may
not appear in `shared/commerce/` **at all**, which the client imports.

BUS2B writes **one translator** (provider webhook → `BillingEvent`) and
implements **one interface**. It changes nothing else.

### C2 — THA owns the entitlement projection; the provider never does

No gate, route, component or service may ask a provider a question to decide
access. Access is resolved from `subscriptions` and `users.subscription_tier`,
both THA's.

### C3 — No commercial claim without configured pricing

A price, saving, discount, percentage or term may be shown to a household **only
if `isPublishable()` returns true**, which requires pricing to have been
explicitly configured and approved. It **fails closed**: unset, empty or
malformed configuration publishes nothing.

**A saving is computed from the configured amounts, never typed.** A hand-written
"save 20%" beside prices that save 17% is the same defect as an invented
discount, only quieter.

> This rule exists because the opposite was already shipping. `TrialBanner.tsx`
> offered *"25% off your first 6 months"* and *"your 25% discount code is on its
> way"* — a discount off an unstated price, for a six-month term that did not
> exist, on a plan that could not be bought, sent by a mechanism that does not
> send anything. It contradicted THA's own published Terms of Service in the
> same repository. `BUS1` found it; `BUS2A` withdrew it.

### C4 — Safety is never a paid feature

No `FeatureKey` or `LimitKey` may gate allergen warnings, dietary restriction
handling, ingredient safety, or any other protective behaviour. **A household on
the free plan is exactly as safe as one paying.** Enforced by
`test:bus2a-commercial-foundation`, not by intention.

This is the commercial face of `THA_EXPERIENCE_ARCHITECTURE.md` § 17, which
defines premium as *"the perceptible result of care taken on the household's
behalf"* and says explicitly that it is **not exclusivity** — it is the quality
every household receives, **including the ones who pay nothing**.

### C5 — Entitlement is a household fact

A subscription is bought by a person and entitles a **home**. A family sharing
one meal plan, one shopping list and one set of allergies cannot have four
different answers to *"may we keep this?"*.

Only **active** members count. A departed member's subscription stops entitling
the household they left, and keeps entitling them.

Resolution takes the **maximum** of the available sources, never a precedence
chain: under strict precedence one member's lapsed card would silently remove
the whole family's access to a plan somebody else is paying for.

### C6 — The lifecycle expires on read, not on a schedule

**THA has no scheduler** (`BUS1` recorded this and carried it forward). A
lifecycle whose correctness depends on a job that does not exist is wrong by
default: stored status would read `trialing` for a trial that ended in March.

So the **stored record says what happened**; the **projection says what is true
now**. `effectiveStatus(snapshot, now)` derives expiry from the stored dates.

When BUS2B adds a scheduler it may write these transitions down for reporting.
**It must not become the thing gates depend on**, or this property is lost.

### C7 — Billing event ingest is idempotent at the database

`billing_events.provider_event_id` is `UNIQUE`, and ingest inserts with
`ON CONFLICT DO NOTHING` inside a transaction with the projection write.

Every payment provider redelivers webhooks — on timeout, on a non-2xx, on their
own retry schedule — so **a duplicate is the normal case, not the edge case**.
A SELECT-then-INSERT check has a race that concurrent deliveries will find, and
the cost of losing it is a term extended for free or a paying household cut off.
A duplicate must be answered `2xx`, or the provider retries forever.

### C8 — Downgrades defer; upgrades do not

An upgrade takes effect immediately. A **downgrade takes effect at period end**,
because the household has already paid for the term they are in. A cancellation
produces `cancelled`, which **continues to entitle** until `currentPeriodEnd` —
cancelling is not the removal of access.

`past_due` **entitles** for a bounded recovery window. A declined card is usually
a bank's fraud heuristic or an expired card, not a decision to leave; THA does
not turn a payment problem into a food problem.

### C9 — Leaving is never made hard

`BUS1` § 8.1 governs account deletion; the same rule binds subscriptions. No
cancellation flow may offer a discount, a pause, a survey, a guilt prompt or a
count of what will be lost. THA does not reimplement cancellation inside the
product where the provider's own management surface will do.

### C10 — The commercial domain never consumes Household Time

Subscription/Trial is one of the five **permanently-INSTANT** domains
(`THA_HOUSEHOLD_TIME_ARCHITECTURE.md` § 8.1, HT10). A term is a **duration**, not
a date in anybody's calendar: **a trial must not be longer for a family in
Auckland.**

This is a **permanent verdict, not a migration backlog.** Enforced for
`server/lib/access.ts` by `publication-register.ts` (`ht-instant-domains-clean`,
severity `fail`), and extended to every commerce module by the BUS2A test.

### C11 — The entitlement projection classifies; it never authorises

`server/lib/access.ts` remains the platform's **sole authorisation authority**
(`BUS1` § 9). The projection answers only *what a plan grants*.

`isAdmin` is **not** an input to it. An operator bypass is a fact about a **role**;
folding it in would mean the plan catalogue — a data file — could grant operator
access, which is how a change that looks like configuration becomes a privilege
escalation. Where a bypass is wanted it sits at the call site, visibly.

### C12 — Feature keys and limit keys are closed vocabularies

A gate invented at a call site is a gate nobody can enumerate, and *"what does
premium actually get you?"* becomes answerable only by grep. Every key is
declared in `shared/commerce/types.ts`, and the test fails a key granted by no
plan (dead gate) or by every plan (pointless gate).

---

## 4. What BUS2A created, and what it deliberately did not

**Creates:** two tables (`subscriptions`, `billing_events`, both **empty in every
environment**); the pure vocabulary `shared/commerce/`; three server services;
three endpoints; and the extension of Register Domain 26.

**Converges (4 owners of the tier rule → 1):** `server/lib/access.ts`,
`server/routes.ts:7319`, `share-plan-dialog.tsx:47`, `templates-panel.tsx:211`.
Two live plan limits move onto the catalogue from an **environment variable**
(`MAX_PRIVATE_TEMPLATES_FREE`/`_PREMIUM`, now unread) and an **integer literal**
— values unchanged (free: 4 templates, 1 shared plan; premium: no ceiling).

The client reads the projection through **one** hook,
`client/src/hooks/use-entitlements.ts`, which consumes
`GET /api/commerce/entitlements`. It **fails closed** — the free plan until the
real answer arrives — because failing open shows a household an unlocked control
the server then refuses, which is an offer withdrawn at the moment it is
accepted. It is **presentation only and not a security boundary**: it decides
what to *draw*, never what is *permitted* (C11).

> **A correction, recorded rather than quietly amended.** The first version of
> this section claimed all four tier owners and both limits had converged. Two
> had not: `share-plan-dialog.tsx:47` was still comparing tier strings and still
> comparing a shared-plan count to a typed `1`, and `server/auth.ts` was still
> serving the template ceiling to the client from the environment while
> `routes.ts` enforced it from the catalogue — so a deployment that set the
> variable would have *shown* households a limit the server did not *enforce*.
> Both are now converged, and — the actual lesson — **§ 8 of
> `test:bus2a-commercial-foundation` now proves it**. A convergence recorded in
> prose and not in a test lasts until the next person writes the obvious line.

**Withdraws:** the "25% off your first 6 months" claim and its discount-code
confirmation.

**Does NOT create:** any payment path, checkout, card capture, price
confirmation, upgrade route, cancellation route, or live subscription; any
scheduler; any commercial-terms legal document (there is nothing yet to agree
to, and `BUS1` refused to ship dormant clauses for things that do not exist);
any new authorisation authority; any restriction a household does not already
live under.

---

## 5. The obligation this adds

Every implementation must additionally satisfy:

```
COMMERCIAL CHECK
────────────────
✓ Does this show a household a price, saving, discount or term? If yes, it is
    behind isPublishable() and the number is COMPUTED, never typed.
✓ Does it gate anything safety-related behind a plan? Must be NO.
✓ Does it add a feature gate or limit? If yes, it is declared in the closed
    vocabulary and granted by at least one plan and withheld by at least one.
✓ Does it name a payment provider outside server/commerce/billing-provider.ts?
    Must be NO.
✓ Does it decide access by comparing a tier string? If yes, it must resolve
    through the entitlement projection instead — `useEntitlements()` on the
    client, `access.ts` on the server.
✓ Does it print a plan limit? The number must be READ from the catalogue and
    interpolated, never typed into the copy.
✓ Does it make cancelling or leaving harder than it was? Must be NO.
✓ Does it read a clock to decide a trial or term? It must take an explicit
    instant and must NOT consume Household Time (HT10).
```

**If any check fails: STOP, explain why, do not continue.**

---

## 6. Left to `BUS2B`

Named here so they are not rediscovered:

- **The Stripe adapter** — one `BillingProvider` implementation and one webhook translator. Signature verification is the adapter's, contractually, because only it knows the scheme.
- **Event → user routing.** The webhook endpoint returns `501` past translation: there is no mapping from a provider customer to a THA user yet, and inventing one before a provider is chosen would be a guess.
- **Retiring `users.subscription_tier`** — the condition is in `shared/commerce/entitlements.ts`: a live provider, plus every non-free row migrated.
- **Migrating gates from the synchronous to the async path.** `access.ts` resolves from the `User` object alone, which is *correct only while no subscription rows exist*. The BUS2A test asserts that precondition and fails the day it stops holding.
- **Commercial terms, and the consent to them.** The Terms of Service promise: *"If we introduce paid features in future, we will present the commercial terms to you then, clearly, and ask you to agree to them before anything is charged."* BUS2B cannot take a first payment without discharging that — a document, a consent type, and a version recorded against the agreement. `BUS1`'s ledger already supports all three.
- **Approved pricing.** Every amount is a placeholder and `isPublishable()` is false platform-wide until somebody decides otherwise on purpose.
- **The three defined-but-unenforced limits** (`max-saved-meals`, `max-product-analyses-per-month`, `max-planned-days-per-week`). Switching them on takes capability away from households who have it today — a commercial decision, not an engineering one.
- **A scheduler**, if ever wanted. Not required: expiry derives on read (C6).

---

*This document governs the commercial layer of The Healthy Apples.*
*Questions or conflicts → stop and report before implementing.*
