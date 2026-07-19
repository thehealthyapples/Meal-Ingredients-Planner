# COMM1A — Invitation & Referral Foundation

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** Two new tables and an applied migration; the first THA surface that sends an unsolicited email to a person who is not a customer; a bearer token that survives an email round-trip and creates an account; and the first record of a fact a future reward will be computed from. Each of those is a thing that is expensive to get wrong later.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/COMM1A-invitation-and-referral-foundation-20260719` |
| Commit SHA | `993e1bc8e61a11c245cd35bcb40b5daae39e113f` |
| Code rollback | `git checkout rollback/COMM1A-invitation-and-referral-foundation-20260719` |

> **⚠️ This tag resolves to the SAME COMMIT as COMM2's** — HEAD has not moved, because COMM2 is uncommitted and awaiting review. **A rollback to this tag discards COMM2 as well as COMM1A.** Snapshotted out-of-repo before any edit: `scratchpad/pre-COMM1A-snapshot/` (458-line tracked patch, untracked tarball, status). Committing COMM2 would restore independent rollback.

> **⚠️ A MIGRATION HAS BEEN APPLIED.** `git checkout` does **not** undo it. Full data rollback below.

### Rollback plan — code, migration, data

**1. Code.** `git checkout rollback/COMM1A-invitation-and-referral-foundation-20260719`. Untracked files created by this session (`server/lib/household-invitation.ts`, `server/lib/referral.ts`, `client/src/pages/invitation-page.tsx`, the two test files, `scripts/capture-comm1a-invitation.ts`, this report) are **not** removed by that and must be deleted explicitly.

**2. Migration.** `2026-07-19_comm1a_invitation_and_referral` created two tables and nothing else. It altered no existing table, added no column to one, and reinterpreted no existing row. To reverse:

```sql
DROP TABLE IF EXISTS referral_attributions;
DROP TABLE IF EXISTS household_invitations;
DELETE FROM schema_migrations WHERE id = '2026-07-19_comm1a_invitation_and_referral';
```

Both tables are leaves: nothing references them except each other (`referral_attributions.invitation_id → household_invitations.id`, `ON DELETE SET NULL`), so the order above is sufficient and no other table is touched by the drop.

**3. Data.** There is no backfill to reverse and no existing row to restore. Both tables were created empty. **Verified empty at the end of this session** (`household_invitations: 0`, `referral_attributions: 0`) — every row created during development and manual verification was removed.

**One thing a rollback does NOT reverse:** any invitation email already sent. The link stops working the moment the table is dropped, so a recipient sees an honest "this invitation isn't available", but the email itself is gone from THA's control the instant it is sent.

---

## 1. SUMMARY

COMM2 shipped a room nobody could be invited into, and said so: *"`POST /api/community/:id/invitations` takes a numeric `householdId`, and a household has no way to learn another household's id… Building a form for an id nobody can obtain would be a door onto a wall."* COMM1A builds the wall a door fits in.

**The whole workstream is one idea: an invitation addressed to an EMAIL rather than to a household id.** An email is the only thing a household can honestly name about somebody who is not here yet, and naming an id would have defeated the probe resistance COMM1 built on purpose.

| | |
|---|---|
| New tables | **2** (`household_invitations`, `referral_attributions`) |
| New migration | **1**, applied and verified |
| New owning services | **2** — the link, and the attribution |
| New routes | **6** (one public) |
| New capability | **0** — live capabilities still **23** |
| New assertions | **115** (73 DB-backed multi-household + **42 route-level over real HTTP**) |
| tsc errors introduced | **0** (88 baseline exactly restored) |
| Coherence / adoption | **unchanged** (2 pre-existing / 80·1·9) |

### The three invitation mechanisms, now distinct and named

The brief's requirement to keep household-member invitations distinct from household-to-household ones turned out to be the load-bearing architectural question. There are now three, and the map is written into `shared/schema.ts` so the next person does not have to rediscover it:

| Mechanism | Question it answers | Owner |
|---|---|---|
| `households.invite_code` | A **PERSON** joins an **EXISTING HOME** | Domain 16 — **untouched** |
| `community_invitations` | **HOUSEHOLD → HOUSEHOLD**, both of which already exist | Domain 37 — **untouched; COMM1A never writes it** |
| `household_invitations` | **HOUSEHOLD → SOMEONE WHO MAY HAVE NO ACCOUNT** | Domain 38 — new |

**Why this could not be a column on `community_invitations`.** That table's `invited_household_id` is `NOT NULL` and foreign-keyed; its entire design assumes the recipient exists. Making it nullable to admit a stranger would have changed what every existing row means and given one table two grains. COMM1A sits *before* it in time instead: when a stranger becomes a household, COMM1A **asks COMM1 to issue a proper community invitation**, and COMM1 remains the only writer of community membership.

---

## 2. THE FOUR ATTACKS, AND WHAT STOPS EACH

### 2.1 Household enumeration

`POST /api/invitations` returns the **identical response** whether or not the address belongs to an existing THA household. Anything else turns the invite form into an oracle for *"is this person a customer?"*.

Every other route answers "not yours" and "does not exist" alike — asserted over HTTP as **byte-identical bodies with identical statuses**, not merely equal status codes.

### 2.2 Token replay

Redemption is a conditional `UPDATE … WHERE id = ? AND status = 'pending'`. Two concurrent redemptions race in Postgres and exactly one updates a row; the loser sees zero rows and is refused. **Single-use is a database outcome, not an `if`.**

### 2.3 Acceptance by the wrong recipient

A bearer token in an email can be forwarded, so **the token alone is never sufficient**: the accepting account's address must equal the invited address. This is COMM1 § 2.2's rule (*"the accepting household must be the household the invitation names"*) carried down to the only identity a stranger has.

Asserted three ways: at the service, over HTTP with a third signed-in household, and by confirming the failed attempt **did not consume the invitation**.

### 2.4 Self-referral

A household cannot invite its own address, cannot redeem its own invitation, and `referral_attributions` carries `CHECK (referrer_household_id <> referred_household_id)` in Postgres besides.

### And one that is not an attack but would have been a leak

**The invited address is redacted in place** the moment an invitation reaches a terminal state (accepted, revoked). It is personal data about a **third party who is not a THA user**, and once the invitation is spent there is no remaining purpose for holding it.

---

## 3. THE COMMERCIAL BOUNDARY — THE HONEST GAP, IN FULL

**The intended reward — 20% off for both households for three months — cannot be implemented, and COMM1A does not pretend otherwise.** This is the honest gap the brief asked for, and it is not a matter of effort: the platform is missing every input.

| Required for the reward | State today | Source |
|---|---|---|
| Configured pricing | **None.** `isPublishable()` returns false platform-wide | `shared/commerce/plans.ts:193`; `THA_PRICING_CONFIGURED` unset |
| A payment provider | **None.** `NoBillingProvider` is *"the correct, permanent implementation"*, not a stub | `server/commerce/billing-provider.ts:117` |
| A path that creates a subscriber | **None.** No code writes a `subscriptions` row; the webhook returns 503 | BUS2A § "deliberately NOT built" |
| A notion of "eligible" | **Does not exist.** Zero hits for `eligib*` in the entire commercial layer | verified by grep |
| A discount / coupon primitive | **Does not exist.** Zero hits for discount, coupon, promo, voucher, credit | verified by grep |

**Rule C3 forbids it outright** — *"a price, saving, discount, percentage or term may be shown to a household only if `isPublishable()` returns true… it fails closed."* BUS2A withdrew `TrialBanner.tsx`'s *"25% off your first 6 months"* for exactly this reason. **A referral page promising 20% off would be that same withdrawn copy in a new envelope**, and COMM1A refuses to ship it.

### What COMM1A does instead

It records **attribution and readiness**, and owns no money:

```
recorded → verified → eligible → entitlement_processed
```

One-way, each rung requiring the one below, **enforced by a CHECK constraint in Postgres** — so "no reward before verified eligibility" is a property of the database, not a promise in a comment. A direct `UPDATE` to `entitlement_processed` without an `eligible_at` is **rejected by the database**, and that is asserted.

`markEligible()` and `markEntitlementProcessed()` exist as the seam a future commercial implementation calls. **Nothing in COMM1A calls them, and nothing in COMM1A may** — they are unreachable from any route, capability or UI. Inventing an eligibility rule here would have created a second owner of *"who deserves money off"*, which is the architecture rule this workstream is bound by.

**Asserted mechanically:** neither owning service contains the strings `price`, `amount`, `percent`, `discount`, `coupon`, `currency`, `stripe` or `20%`; the referral owner reads no commercial table; and `GET /api/referrals/summary` contains none of those words either.

**Also verified:** **no referral anywhere in the database has ever reached `eligible`.**

---

## 4. HOW AN INVITATION SURVIVES SIGNUP

This is the requirement everything else hangs off, and the reason it is implemented where it is:

**Registration does not establish a session.** An account must verify its email and then log in. And `saveUninitialized: false` means an anonymous visitor has **no session row at all**. So there is no session to carry an invitation in, and nothing in a session survives the email round-trip. **The only thing that survives is a database row.**

```
1. A types an email in the Orchard's Village          POST /api/invitations
2. THA emails a link                                   /invitation?token=…      ← the ONLY place the token appears
3. The recipient lands on a PUBLIC page                previews, masked address
4. "Create an account"                                 /auth?invitation=<token> ← the token rides through
5. Registration redeems it                             household now provably exists
   → referral recorded (status `recorded`)
   → if the link named a community, COMM1 issues a community invitation
6. Email verification                                  referral → `verified`
7. The household explicitly accepts in the Orchard     COMM1 completes membership
```

**Step 4 is the one that did not exist before.** `/shared/:token` — described in `App.tsx` as *"the product's only viral loop"* — sends its visitors to a bare `/auth` and **drops the token**, so somebody who signs up loses the plan they came for. COMM1A does not repeat that, and the capture harness asserts the signup link carries the token.

**Redemption at registration is deliberately NON-FATAL.** A bad, expired or mismatched token must never destroy an account somebody just created — they typed a real password and agreed to real terms, and losing that because a link went stale would be the product punishing them for someone else's timing. The account stands; the invitation simply is not redeemed.

**Membership is never a side effect of clicking a link.** Redeeming creates an *offer*; the household accepts it at the Orchard's gate. Asserted twice at runtime: no membership after redemption, and still none after COMM1 issues the invitation.

### Referrals are attributed on the registration path ONLY

A household that **already had** a THA account and merely accepts a neighbourhood invitation is **not** a referral — it was not referred, it was already here. Attributing one would be a fabricated referral that a future reward would pay out on. The `/accept` route records nothing.

---

## 5. DATA IMPACT — DECLARED IN FULL

### Reads existing data
`households` (to resolve the acting household, via the existing `getHouseholdForUser`), `users.username` (the account address, for the recipient-identity check), `communities` (a name, for the email and preview), and `community_members` **only through COMM1's owner**, never directly.

### Writes new data
Two new tables, and nothing else. **No existing table gains a column, and no existing row is written by COMM1A.**

| Entity | Key columns | Enforced **in Postgres** |
|---|---|---|
| `household_invitations` | `token` (unique), `invited_by_household_id`, `invited_email`, `kind`, `community_id`, `status`, `expires_at`, `responded_at`, `accepted_by_household_id` | `kind IN ('tha','community')`; closed status set; **a `community` invitation must name one and a `tha` invitation must not**; a resolved invitation must record when; **an accepted one must say who accepted it, and a non-accepted one must not claim anyone did** |
| `referral_attributions` | `referrer_household_id`, `referred_household_id` (**UNIQUE**), `invitation_id`, `status`, `recorded_at`, `verified_at`, `eligible_at`, `entitlement_processed_at` | **`referred_household_id` UNIQUE — a household is referred once, ever**; `referrer <> referred`; closed status set; **the full one-way status ladder** |

### Changes meaning of existing data
**None.** No existing column is reinterpreted, no default changes, and no existing row means anything different than it did before. `households.invite_code` in particular is untouched and keeps its exact meaning.

### Migration and backfill
`2026-07-19_comm1a_invitation_and_referral` — appended, idempotent (`IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS`), applied in one transaction. **Backfill required: none** — both tables start empty and no existing household gains or loses anything.

```
[Migrations] 1 pending migration(s) to apply
[Migrations] ✓ Applied "2026-07-19_comm1a_invitation_and_referral"
[Migrations] Schema at head: 2026-07-19_comm1a_invitation_and_referral
```

### GDPR
Declared as `household-invitations-and-referrals` in `server/privacy/personal-data-registry.ts`, with an erasure position beside `community-membership`.

The export includes invitations this household **sent**, and whether this household **arrived by referral**. It deliberately excludes **tokens** (an export is a document a household may store or forward, and a live token in a file is a standing grant) and **the other household's identity in a referral** — an export is not a door through which to obtain another household's identifier.

---

## 6. TRUST CHECK

| Requirement | Status |
|---|---|
| No fabricated households or referrals | ✅ A referral is recorded only when a genuinely new household registers through a link. An already-existing household accepting records nothing |
| No discoverable household identifiers | ✅ No route accepts or returns a household id. Invitations are addressed to an email; the referral summary is **counts only**; `wasReferred` returns a **boolean**, never the referrer |
| No bearer token retained after acceptance | ✅ The token is never returned by any route, never in the response, never in the list, never persisted client-side; the invited **address is redacted** on acceptance |
| No reward before verified eligibility | ✅ The status ladder is enforced by a Postgres CHECK; `eligible` is unreachable from COMM1A; **no row has ever reached it** |
| Honest gaps where Commercial is unavailable | ✅ § 3, in full — including that the intended 20% cannot be built at all today |
| Prevent enumeration, replay, wrong recipient | ✅ § 2 — each asserted at both the service and the route |
| Invitations expire, revoke, single-use | ✅ Expiry evaluated **on read** (THA has no scheduler); revocation refused to non-senders; replay refused |
| Strict cross-household privacy preserved | ✅ COMM1's boundary untouched — COMM2's isolation suite still 22/22 and SEC1 still 17/17 |

---

## 7. CHANGES MADE

### Created (6)

| File | Purpose |
|---|---|
| `server/lib/household-invitation.ts` | The invitation owner — mint, preview, redeem, revoke, delegate |
| `server/lib/referral.ts` | The attribution owner — the status ladder and the commercial seam |
| `client/src/pages/invitation-page.tsx` | `/invitation` — the public doorstep |
| `server/tests/test-comm1a-invitation-referral.ts` | 73 DB-backed, multi-household assertions |
| `server/tests/test-comm1a-invitation-routes.ts` | 42 route-level assertions over real HTTP |
| `scripts/capture-comm1a-invitation.ts` | Browser verification harness |

### Modified (12)

| File | Change |
|---|---|
| `shared/schema.ts` | Two tables + the three-mechanism map |
| `server/migrations/runner.ts` | One appended migration |
| `server/routes.ts` | Six `/api/invitations*` + `/api/referrals/summary` routes |
| `server/auth.ts` | Redemption at registration; referral verification at email verification |
| `server/email/index.ts` | The sixth template |
| `server/privacy/personal-data-registry.ts` · `account-erasure-service.ts` | GDPR entry + erasure position |
| `client/src/App.tsx` | One public route |
| `client/src/pages/auth-page.tsx` · `hooks/use-user.ts` | The token rides through signup |
| `client/src/pages/orchard-page.tsx` | **The invite form — COMM2's blocking gap, closed** |
| `server/tests/test-comm2-orchard-experience.ts` | **Scope lock widened deliberately** (§ 8) |
| `server/tests/test-comm1-community-foundation.ts` | **A latent over-reach, bounded** (§ 8) |
| `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | **Domain 38** |

### Deliberately NOT built
- **Any pricing, discount, coupon, Stripe or entitlement logic.** § 3.
- **A second way to join a household.** `households.invite_code` keeps that job.
- **Any write to `community_members` or `community_invitations`.** COMM1A calls COMM1's owner.
- **Messaging, feeds, sharing, Community Intelligence.** Scope lock, held.
- **The sending household's name in the email or on the doorstep.** § 9.2.

---

## 8. TWO SCOPE LOCKS FIRED, AND BOTH ARE RECORDED

**1. COMM2's route allow-list and mutation census.** Adding the invite form put `/api/invitations` on the Orchard and made two mutating calls four. Both assertions refused it. They are **widened by exactly one door and re-enumerated by name**, not deleted — and the "no invite form" assertion was *kept*, because what it was really protecting is still true: the client never calls the household-id-taking community route.

**2. COMM1's join-code assertion — a latent bug my change exposed.** It sliced the migration file from COMM1's migration **to the end of the file**, which was indistinguishable from correct while COMM1's migration was last. COMM1A's migration carries a comment saying it is *distinct from* `households.invite_code`, and the assertion read that comment as COMM1 having grown a join code. **The slice is now bounded to COMM1's own migration block.** Worth recording: appending anything after a test that slices to EOF would have broken it, and the next workstream would have found this instead.

---

## 9. VALIDATION PERFORMED

### 9.1 Suites

| Check | Result |
|---|---|
| `npm run test:comm1a-invitation-referral` (DB-backed, 3 households) | **73 passed, 0 failed** |
| `npm run test:comm1a-invitation-routes` (real HTTP, 3 sessions) | **42 passed, 0 failed** — and **stable across three consecutive runs** |
| `npm run test:comm1-community-foundation` | **81 passed, 0 failed** |
| `npm run test:comm2-orchard-experience` / `-isolation` | **80 / 22 passed, 0 failed** |
| `npm run test:bus1-trust-and-compliance` | **42/42** |
| `npm run test:bus2a-commercial-foundation` | **93/93** |
| `npm run test:sec1-departed-member-eater-exposure` | **17 passed, 0 failed** |
| `npm run test:trust1-s5-authentication-rate-limiting` | **68 passed, 0 failed** |
| `npx tsc --noEmit` | **88 — baseline exactly restored, 0 introduced** |
| `npm run build` | ✅ clean |
| `npm run verify:coherence` | **2 failures — unchanged**, both pre-existing |
| `npm run adoption:check` | **80 · 1 · 9 — byte-identical to baseline** |

### 9.2 The route-level suite — COMM1 § 11.4, closed

COMM1 recorded, and COMM2 did not close: *"No route-level integration test. The nine routes are asserted by source inspection, not by driving HTTP with two authenticated sessions."*

This suite **boots its own server on its own port with registration enabled** and drives three real sessions over the wire. The class of defect only it can catch is where the service is right and the route is not:

- ✓ all five authenticated routes return **401** without a session; the preview is the only public one
- ✓ **no token in the create response, and none in the list** — asserted by regex over the whole body
- ✓ the preview **masks** the address; the full address is never disclosed
- ✓ "not yours" and "does not exist" return **identical status and byte-identical bodies**
- ✓ a signed-in third household **cannot** accept, and the attempt does not consume the invitation
- ✓ a stranger **registers through the link**, the invitation is consumed, and a referral is attributed at `recorded`
- ✓ **email verification promotes it to `verified`** and stamps when
- ✓ the referral summary contains **no commercial word and no household id**
- ✓ **no referral in the entire database has reached `eligible`**
- ✓ the spent token no longer previews and cannot be accepted again

### 9.3 Manual verification — in a browser

Driven with Playwright against the live app as a real signed-in household; captures in `docs/ui-audit/comm1a-invitation/`.

- ✓ the **invite form renders in the Orchard's Village** at desktop and mobile — COMM2's gap, visibly closed
- ✓ a real invitation is created (`201`), and the response carries **`id, invitedEmail, kind, expiresAt, delivered` — no token**
- ✓ the **doorstep renders signed-out**, with the masked address and one primary action
- ✓ **the full address is not leaked** to whoever holds the link
- ✓ **the signup link carries the token** — the exact thing `/shared/:token` drops
- ✓ an invalid token renders the same "isn't available" message as an expired or spent one
- ✓ every fixture row removed afterwards: `household_invitations: 0`, `referral_attributions: 0`

> **Two things found by looking rather than by testing.** The invite form first shipped with a **raw `<select>`**, forking the canonical Select owner that 5+ pages already use — Blueprint § 5.2 says the component owners may never vary per domain. Replaced. And **SMTP is configured in this environment**, so `delivered: true` came back on the first manual call: a real send was attempted. Every address used in development and verification is on the **RFC 2606 reserved `.test` TLD**, which cannot resolve, so no email could reach a real person.

### 9.4 An incident, reported in full

The route suite passed alone and then produced **no output at all** inside a sweep — which reads like a crash. Two causes, both mine:

1. **The auth rate limiter.** `authRateLimit("/api/register")` is a shared, IP-keyed counter in Postgres; a second run inside the window returned **429** before any assertion was meaningful. The fixture now clears the counters — the limiter keeps its behaviour and its own suite, rather than gaining a test-only bypass.
2. **The spawned server outlived the test.** Teardown did not wait for the child to exit, so the next run found the port held. It now awaits exit with a SIGKILL fallback, and the harness retries **connection errors only** (never an HTTP status — retrying a 401 or 429 would hide exactly what this suite exists to assert).

Recorded because a flaky test is worse than no test: run alone it passed, and the failure looked like broken routes.

---

## 10. DEFINITION OF DONE

| Objective | Status |
|---|---|
| Secure invitation link works end-to-end | ✅ Verified over HTTP and in a browser |
| New users can sign up and complete the invitation | ✅ Real registration through a real token, asserted |
| Existing households can accept safely | ✅ `/accept`, with the recipient-identity check; **no referral attributed** |
| Invitations expire, revoke, single-use | ✅ All three at runtime; expiry on read |
| Referral attribution recorded without duplicate discount logic | ✅ § 3 — attribution only, asserted by absence |
| Runtime tests cover multiple households and authenticated routes | ✅ 73 + 42, three households, three sessions |
| Manual verification completed | ✅ § 9.3 — and it is how two defects were found |
| Existing referral capability reused | ✅ **None existed** (verified: zero hits platform-wide). The **email rail was reused** — one new template on the existing `send()` |
| No duplicate invitation systems | ✅ Three distinct mechanisms, mapped in schema and register |

---

## 11. THE SINGLE HIGHEST-VALUE NEXT STEP

**Configure pricing, or decide not to — because everything downstream of COMM1A is blocked on that one flag, and nothing else is.**

`isPublishable()` returns false platform-wide, and it fails closed on purpose. Until it is true:

- no household can be shown what a referral is worth,
- no household can become a paying subscriber, so **no referral can ever reach `eligible`**,
- and the 20%/3-month reward cannot be expressed anywhere in the product without violating Rule C3.

COMM1A has already recorded the attribution the reward will be computed from, so **no data is being lost while that decision is pending** — a household referred today will still be attributed, verified, and ready when the commercial layer arrives. That is the whole point of building attribution before entitlement.

The work that follows it — a Stripe adapter, event routing, migrating gates from the sync to the async entitlement path — is already sequenced in BUS2A's handover, and **BUS2A's own first item is the constraint: migrate the gates *before* the first subscription row is written.**

### Other follow-ons, ranked

1. **An invitation cannot be resent.** Re-inviting the same address revokes and re-mints, which is correct but means a lost email needs the sender to notice and retry. A "resend" that reuses the live token would be kinder.
2. **No bounce handling.** `delivered: true` means SMTP accepted it, not that it arrived. A bounce leaves an invitation that will never be used, expiring silently in 14 days.
3. **No rate limit on invitation creation.** `/api/register` and `/api/login` are limited; `POST /api/invitations` is not, so a household could send many invitations quickly. Not an enumeration risk (§ 2.1) but it is an outbound-email surface.
4. **The Orchard's referral standing is not surfaced.** `GET /api/referrals/summary` exists and is tested; no room renders it — deliberately, because "3 households referred" invites the question "and what do I get?", which § 3 cannot yet answer honestly.
5. **COMM2's bottom-nav regression is still open** (COMM2 § 9.4) and is unaffected by this workstream.

---

## 12. THE HONEST STATE OF IT

The chain now runs end to end: a household types an address, a stranger receives a link, signs up, and is attributed — and each step is proven at runtime rather than by inspection. The two strongest properties are that **the token alone is never enough** and that **no reward can be computed from an unverified claim**, and both are enforced by Postgres rather than by care.

Four things a reviewer should weigh:

- **The reward does not exist and cannot be built today.** COMM1A records who referred whom and stops. If the commercial decision is deferred indefinitely, what has shipped is an invitation system with a bookkeeping table nobody reads — still worth having, because attribution is only truthful if recorded at the time, but it is not a referral *programme*.
- **THA now sends unsolicited email to people who are not customers.** That is new, and it is the surface with the least protection in this workstream: there is no send rate limit (§ 11.3) and no bounce handling (§ 11.2). The email names no household and promises nothing, which limits the harm, but the volume control is missing.
- **The strongest claims are still negative ones.** "No token is returned", "no household id is exposed", "no referral has reached eligible" are proven by absence — over real HTTP, which is a genuine advance on source inspection, but SEC1 remains the standing reminder of what confidence in absence is worth.
- **This tag cannot separate COMM1A from COMM2**, and a migration has been applied that `git checkout` will not undo. The SQL to reverse it is in the Rollback Plan, and both tables are verified empty.
