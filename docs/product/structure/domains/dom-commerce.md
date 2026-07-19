---
entry: dom-commerce
name: Plans and Entitlements
section: domains
status: live
visibility: household
owner: Colin Clapson
last_verified: 2026-07-18
version: 1
---

# Plans and Entitlements

> What each plan includes, what a household is entitled to, and how a
> subscription would begin, change and end.

## What it is

**THA takes no payments.** There is no card capture, no checkout, no live
subscription and no payment provider configured in any environment. The Terms of
Service say so in the product's own voice, and they remain true. What exists is
the *domain* — the definitions, the lifecycle, the entitlement projection and
the persistence — built so that adding a payment provider later is one adapter
rather than a rebuild.

There are **three plans**. `free` is a real plan, not an absence: a household on
it gets the whole of THA's food knowledge, the whole of its safety behaviour, and
the Companion. `premium` lifts volume and convenience — how many plans you may
keep, how many you may share. `friends_family` entitles exactly as premium does,
is never sold, carries no price in any currency, and can only be granted by an
operator.

**Nothing safety-related is ever a paid feature.** Allergen warnings, dietary
restriction handling and every other protective behaviour are unconditional. A
household paying nothing is exactly as safe as one paying. This is enforced by a
test, not by intention.

**Pricing is placeholder and is not shown to anybody.** Every amount in the
catalogue is unapproved, and the gate that decides whether a price may be quoted
returns false for the whole platform. Where a saving would be stated it is
computed from the two configured amounts, never typed by hand, so a percentage
can never be claimed that the prices do not actually produce.

**Entitlement is a household fact.** A subscription is bought by a person and
entitles a home — because a family sharing one plan, one shopping list and one
set of allergies cannot sensibly have four different answers to "may we keep
this?". Only active members count; a departed member's subscription stops
entitling the household they left, and keeps entitling them.

**A trial or term ends without anything having to run.** THA has no scheduler, so
expiry is derived when the question is asked rather than written by a job that
does not exist. The stored record says what happened; the projection says what is
true now.

## Where it lives

| | |
|---|---|
| Routes | `/api/commerce/plans` (public), `/api/commerce/entitlements`, `/api/commerce/billing/webhook` |
| Source | `shared/commerce/` — plans, entitlements, lifecycle, billing events (pure, zero-I/O) |
| Source | `server/commerce/entitlement-service.ts` — the projection |
| Source | `server/commerce/subscription-store.ts` — persistence and idempotent ingest |
| Source | `server/commerce/billing-provider.ts` — the provider boundary; `NoBillingProvider` everywhere |
| Source | `server/lib/access.ts` — the sole authorisation authority, now reading one rule |
| Source | `client/src/hooks/use-entitlements.ts` — the client's one reader; fails closed to the free plan. Presentation only, never a security boundary |
| Tables | `subscriptions`, `billing_events` — both empty in every environment |
| Architecture | [Commercial Architecture](../../../architecture/THA_COMMERCIAL_ARCHITECTURE.md) |

## Related

- [[dom-trust-and-compliance]] — the Terms that govern what may be charged, and the consent ledger a future commercial agreement would be recorded in
- [[api-surface]] — the endpoints
- [[routes-map]] — the addresses

---

_Registry entry. Present tense; if it is no longer true it is a defect, not
history (Rule PKR15). Owner: Colin Clapson. Last verified 2026-07-19._
