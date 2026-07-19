# BUS2A — Commercial Platform Foundation — Implementation

**Date:** 2026-07-18 (built) · 2026-07-19 (resumed, verified and completed)
**Branch:** `int1-intelligence-platform`
**Risk:** 🟠 AMBER
**Reason:** Creates two tables and the platform's first commercial vocabulary, and moves live plan limits and access decisions onto a single owner. It takes **no payment**, activates **no subscription**, and integrates **no provider** — so the blast radius is what households are *told* and *allowed*, not what they are *charged*.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/BUS2A-commercial-platform-foundation-20260718` → `fc9423ff20f61267f5de59c9b630daabd80d030a` |
| Working tree | **Intentionally dirty, and NOT this session's work** — ~26 modified tracked files and ~280 untracked paths from prior programmes were present at session start |
| What the tag does NOT cover | All of the above. A tag protects **committed state only** |
| Mitigation taken | Dirty tracked files were snapshotted to the session scratchpad before any edit (stash `BUS2A_ROLLBACK` lineage) |
| Rollback to committed state | `git checkout rollback/BUS2A-commercial-platform-foundation-20260718` |
| Database rollback | `DROP TABLE billing_events, subscriptions;` then `DELETE FROM schema_migrations WHERE id = '2026-07-18_bus2a_commercial_foundation';` **Both tables are empty in every environment**, so the drop loses nothing |
| Commit state at time of writing | **Uncommitted.** All BUS2A source is untracked; the tag protects the pre-BUS2A commit only |

---

## THE FINDING THAT SHAPED THE RESUME

The session run file recorded stage **"Rollback Complete"** with reconnaissance
unfinished. That was **stale**: the 2026-07-18 session had built the entire domain and
never updated the file. `shared/commerce/`, `server/commerce/`,
`server/commerce-routes.ts` and the test suite all existed already, untracked.

Resuming therefore meant **verifying and completing**, not rebuilding.

The decision that produced everything below was to **check the previous session's
completion claims against source rather than trust them**. Three of them did not hold:

1. **`share-plan-dialog.tsx:47` had not converged.** It still matched the user's tier
   against the two paid plan names by hand and compared a shared-plan count to a typed
   `1`. Both `THA_COMMERCIAL_ARCHITECTURE.md` § 4 and Register Domain 26 recorded this
   site as converged, and `shared/commerce/entitlements.ts:11` names it explicitly as a
   site BUS2A converges. It was still a second owner of both the plan rule and the limit.

2. **`server/auth.ts` still owned a plan limit.** `/api/config` served the private-template
   ceiling from `MAX_PRIVATE_TEMPLATES_FREE`/`_PREMIUM` while `routes.ts` enforced it from
   the catalogue. The values happened to agree, so nothing was visibly broken — but a
   deployment that set the variable would have **shown** households a limit the server did
   not **enforce**. A limit described by one owner and enforced by another is the defect
   Principle 2 exists to prevent, and it is invisible until the day it isn't.

3. **Nothing on the client consumed `/api/commerce/entitlements`.** The canonical
   projection had been built, exposed over HTTP, and given no reader.

A fourth, found by the platform's own checks: **Register Domain 26 declared no unsuffixed
`Authoritative Source` row**, failing `verify:coherence` (Register Rule 1).

> **The generalisable lesson, recorded because it caused all three:** a convergence written
> down in prose and not asserted by a test lasts until the next person writes the obvious
> line. § 8 of the test suite now proves the convergence the documents claim.

---

## WHAT BUS2A CREATED

**The one-line architecture** (`docs/architecture/THA_COMMERCIAL_ARCHITECTURE.md`):

```
Billing Provider  →  Billing Events  →  Subscription Projection  →  Entitlements  →  Product Access
   (BUS2B, none)      billing_events         subscriptions           resolver        access.ts
```

The direction of the arrow is the whole architecture. A payment provider owns **payment
facts**; THA owns the **entitlement projection**. Everything downstream reads THA's own
data, so a household's access is never an availability question about a third party.

| Layer | Artefact |
|---|---|
| Pure rules (client + server, zero-I/O) | `shared/commerce/` — `types.ts`, `plans.ts`, `subscription.ts`, `billing-events.ts`, `entitlements.ts`, `index.ts` |
| Server I/O | `server/commerce/` — `subscription-store.ts`, `entitlement-service.ts`, `billing-provider.ts` |
| HTTP | `server/commerce-routes.ts` — 3 endpoints |
| Client read path | `client/src/hooks/use-entitlements.ts` |
| Authorisation | `server/lib/access.ts` — unchanged signatures, now reading one rule |
| Tables | `subscriptions`, `billing_events` — **empty in every environment** |

**Deliberately NOT created:** any payment path, checkout, card capture, price confirmation,
upgrade route, cancellation route or live subscription; any scheduler; any commercial-terms
document; any new authorisation authority; any restriction a household does not already
live under.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

| Rule | Status |
|---|---|
| **C1** Provider stays behind one module | ✅ `billing-provider.ts` only; test scans every commerce module for provider vocabulary |
| **C2** THA owns the projection | ✅ Access resolves from `subscriptions` + `users.subscription_tier`, never a provider call |
| **C3** No commercial claim without configured pricing | ✅ `isPublishable()` false platform-wide; amounts **omitted from the response**, not merely flagged. Savings computed, never typed |
| **C4** Safety is never a paid feature | ✅ Asserted by test, not by intention |
| **C5** Entitlement is a household fact | ✅ Resolution is a **maximum**, not a precedence chain — one member's lapsed card cannot strip a family of a plan someone else pays for. Only `status = 'active'` members count |
| **C6** Lifecycle expires on read, not on a schedule | ✅ THA has no scheduler; `effectiveStatus(snapshot, now)` derives expiry from stored dates |
| **C7** Ingest idempotent at the database | ✅ `UNIQUE` on `provider_event_id` + `ON CONFLICT DO NOTHING` in the projection transaction. Verified against a **real** Postgres |
| **C8** Downgrades defer; upgrades do not | ✅ `cancelled` continues to entitle to period end; `past_due` entitles for a bounded window |
| **C9** Leaving is never made hard | ✅ No cancellation flow, no retention prompt, no loss-count |
| **C10** Never consumes Household Time | ✅ Permanently-INSTANT domain (HT10). Enforced by `publication-register.ts` and extended to every commerce module by the test |
| **C11** Projection classifies, never authorises | ✅ `access.ts` remains sole authority; `isAdmin` deliberately not an input |
| **C12** Closed vocabularies | ✅ Test fails a key granted by no plan (dead gate) or every plan (pointless gate) |

**Principle 2 — one owner per fact.** Tier rule: **4 owners → 1**. Plan limits: an
environment variable and an integer literal → the catalogue. Values unchanged.

---

## THE ONE HONEST WEAKNESS

`users.subscription_tier` is **still the live owner** of Domain 26 and is read by the
resolver as its last-resort input. Under Principle 2 the column and the table cannot
legitimately disagree, so one is redundant.

This is **not** a Principle 7 synchronisation bridge — nothing writes either to match the
other. It is a read-order with a **stated retirement condition** (`entitlements.ts`): the
column is dropped when BUS2B has (a) a live provider and (b) migrated every non-free row.
Until both hold, the column is the owner and the fallback is what keeps that honest rather
than a bridge that hides it.

**The consequence BUS2B must not discover late:** `entitlementsFromUser` (sync, used by
`access.ts`) agrees with the async household-aware path **only while zero subscription rows
exist**. The day the first row is written, every gate on the sync path is wrong. The test
asserts that precondition and fails the day it stops holding — that failure is a **gate**,
not a nuisance.

---

## PRODUCT REGISTRY IMPACT

- `docs/product/inventory/product.yaml` — `dom-commerce` extended (sources, `version` 1 → 2, `last_verified` 2026-07-19). **The only hand-authored file** (Rule PKR17).
- `docs/product/inventory/product.json` — regenerated via `scripts/build-product-inventory.ts`. Never hand-edited.
- `docs/product/structure/domains/dom-commerce.md` — client read path added.
- **No new domain.** Domain 26 was **extended, not replaced**: "what plan is this household on" is the fact it already owned.

---

## VALIDATION PERFORMED

| Check | Result |
|---|---|
| `test:bus2a-commercial-foundation` | **93/93** (86 → 93; § 8 added) |
| `test:bus1-trust-and-compliance` | 42/42 — no regression in the adjacent domain |
| `npm run build` | PASS |
| `tsc` on touched files | Clean. 94 repo-wide errors are **pre-existing**; none in any file touched here |
| `verify:coherence` — Domain 26 | **Now passes** (was failing Register Rule 1) |
| `verify:product-inventory` | 0 failures · bijection **TOTAL** · 40 pre-existing PKR23 warnings, none commercial |
| `verify:deployment-config` | PASS |
| `GET /api/config` (live) | `maxPrivateTemplatesFree: 4`, `maxPrivateTemplatesPremium: null` — **byte-identical to the pre-change values** |
| `GET /api/commerce/plans` (live) | `pricingPublishable: false`, `paymentsAvailable: false`, every `prices: []` |
| `GET /api/commerce/entitlements` (live, unauth) | `401` — hook falls back to free, fails closed |
| `POST /api/commerce/billing/webhook` (live) | `503` without reading, parsing or storing a byte |

**Idempotency was verified against a real database**, not a mock: the guarantee is a unique
constraint and a transaction — facts about Postgres, not about the code's intentions.

**The new regression guards were mutation-tested.** A tier comparison was reinserted at the
worst-case position (end of file, after the JSX that corrupts the comment-stripper's quote
state) and § 8 **caught it**. The checks are not vacuous.

> **A defect found in the test harness itself, recorded not fixed.** `codeOf()`'s quote
> tracking is fragile on JSX: an apostrophe in rendered text flips it into string mode and
> it stops stripping comments from that point on. The new checks were written to avoid
> depending on it (comments do not restate the defective literals). Properly distinguishing
> JSX text from string literals needs a parser, which is out of BUS2A's scope.

---

## FILES

**Created (2026-07-19 resume)**
- `client/src/hooks/use-entitlements.ts` — the client's one reader; fails closed to the free plan; **presentation only, never a security boundary**

**Created (2026-07-18 build)**
- `shared/commerce/{types,plans,subscription,billing-events,entitlements,index}.ts`
- `server/commerce/{subscription-store,entitlement-service,billing-provider}.ts`
- `server/commerce-routes.ts`
- `server/tests/test-bus2a-commercial-foundation.ts`
- `docs/architecture/THA_COMMERCIAL_ARCHITECTURE.md`
- `docs/product/structure/domains/dom-commerce.md`

**Modified**
- `client/src/components/share-plan-dialog.tsx` — converged onto the projection; ceiling computed
- `server/auth.ts` — `/api/config` limits from the catalogue; env vars unread
- `server/tests/test-bus2a-commercial-foundation.ts` — § 8, +7 checks
- `docs/architecture/THA_COMMERCIAL_ARCHITECTURE.md` — § 4 correction recorded **in place**
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Domain 26: `Authoritative Source` row added, convergence claim corrected
- `docs/product/inventory/product.yaml` (+ generated `product.json`), `dom-commerce.md`
- `shared/schema.ts`, `server/migrations/runner.ts`, `server/routes.ts`, `server/lib/access.ts`, `package.json` (2026-07-18)
- `.engineering/session/runs/BUS2A_Commercial_Platform_Foundation.md`, `.engineering/session/INDEX.md`

---

## SCOPE LOCK

No Stripe. No payment path. No schema change and no new migration during the resume. No new
domain, route or capability. The two corrected convergence claims were recorded **as
corrections in place**, not quietly amended.

### Carried, not caused by BUS2A

- `verify:coherence` still fails **Domain 34 (Legal Agreement & Consent)** — the identical
  missing-`Authoritative Source`-row defect, owned by **BUS1**. Deliberately not amended:
  it is another workstream's governing record. One-line fix when BUS1 is next touched.
- `verify:publication` fails 4 domains (Meals, Meal Templates, Pantry, Nutrition
  Boost/Uplift) — pre-existing, recorded by PROD5, none commercial.
- Repo-wide `tsc`: 94 errors, all pre-existing, none in files touched here.

---

## DEFINITION OF DONE

- [x] Canonical commercial domain, subscription lifecycle, plan definitions, entitlements, feature gates, trial architecture, subscription projection, API boundaries
- [x] Convergence claims **verified against source**, not trusted — two found false and closed
- [x] Client read path built and failing closed
- [x] Tests 93/93; new guards mutation-tested
- [x] Build passes; endpoints driven live
- [x] Architecture and product registries updated and verified
- [x] No provider, no payment, no live subscription

---

## NEXT STEPS — BUS2B (Stripe Integration)

Named here and in `THA_COMMERCIAL_ARCHITECTURE.md` § 6 so they are not rediscovered, in the
order the risk falls:

1. **Migrate gates from the sync to the async path.** The single biggest constraint — see
   *The One Honest Weakness*. Do this **before** writing the first subscription row.
2. **The Stripe adapter** — one `BillingProvider` implementation, one webhook translator.
   Signature verification is the adapter's, contractually, because only it knows the scheme.
3. **Event → user routing.** The webhook returns `501` past translation: there is no mapping
   from a provider customer to a THA user, and inventing one before a provider is chosen
   would be a guess.
4. **Commercial terms and the consent to them.** The ToS promises the terms will be
   presented and agreed **before anything is charged**. BUS2B cannot take a first payment
   without discharging that; BUS1's ledger already supports the document, the consent type
   and the version.
5. **Approved pricing.** Every amount is a placeholder and `isPublishable()` is false
   platform-wide until somebody decides otherwise on purpose.
6. **Retire `users.subscription_tier`** once (a) and (b) of the retirement condition hold.
7. **The three defined-but-unenforced limits** (`max-saved-meals`,
   `max-product-analyses-per-month`, `max-planned-days-per-week`). Switching them on takes
   capability away from households who have it today — **a commercial decision, not an
   engineering one**.
8. **A scheduler**, if ever wanted. Not required: expiry derives on read (C6). If added, it
   may record transitions for reporting but **must not become what gates depend on**.

---

*Implementation report. Governing document: [`THA_COMMERCIAL_ARCHITECTURE.md`](../../architecture/THA_COMMERCIAL_ARCHITECTURE.md).*
*Owner: Colin Clapson. Written 2026-07-19.*
