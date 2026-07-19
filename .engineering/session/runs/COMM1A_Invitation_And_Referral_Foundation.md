# Session: COMM1A_Invitation_And_Referral_Foundation

| Field | Value |
|---|---|
| **Session ID** | `COMM1A_Invitation_And_Referral_Foundation` |
| **Rollback ID** | `rollback/COMM1A-invitation-and-referral-foundation-20260719` → `993e1bc8e61a11c245cd35bcb40b5daae39e113f` |
| **Start time** | 2026-07-19T19:40:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Complete secure household invitation links and create the referral foundation
without exposing household identities. Support recipients with no account,
preserve the invitation through signup, complete Community membership only on
explicit acceptance, record referral attribution without duplicating any
pricing, subscription or Stripe ownership.

## Rollback coverage caveat
Tag resolves to `993e1bc8` — **the same commit as COMM2's**, because HEAD has
not moved (COMM2 is uncommitted, awaiting review). A rollback would discard
**both**. Snapshot: `scratchpad/pre-COMM1A-snapshot/` (458-line patch,
untracked tarball, status).

**A MIGRATION HAS BEEN APPLIED.** `git checkout` does not undo it. The reversing
SQL is in the report's Rollback Plan; both tables are leaves and were verified
empty at session end.

## Checkpoints
- [x] Governing docs read (Architecture Bootstrap, Commercial Architecture)
- [x] Git status confirmed; rollback tag created and reported
- [x] Existing mechanisms investigated — **no referral system existed**; the
      email rail DOES exist and was reused; three invitation mechanisms mapped
- [x] Schema + migration — applied, head moved, two tables, no backfill
- [x] Two owning services: the link, and the attribution
- [x] Registration + email-verification hooks (the invitation survives signup)
- [x] Six routes, one public; GDPR entry + erasure position
- [x] Client: public doorstep, token through signup, **invite form in the
      Orchard — COMM2's blocking gap closed**
- [x] 73 DB-backed multi-household + **42 route-level over real HTTP**
- [x] **COMM1 § 11.4 closed** — the route-level integration test now exists
- [x] Manual browser verification; two defects found by looking
- [x] tsc/coherence/adoption baselines all exactly restored
- [x] SoT Register — Domain 38
- [x] Implementation report

**Last checkpoint:** Implementation report written

## Next action
Await owner review of
`docs/implementation/community/COMM1A_INVITATION_AND_REFERRAL_FOUNDATION.md`.
Nothing is committed.

**Three things a reviewer must know:**
1. **The 20% reward cannot be built today, and COMM1A does not fake it.** No
   configured pricing (`isPublishable()` fails closed), no payment provider, no
   path that creates a subscriber, and **no notion of "eligible" exists in the
   commercial layer at all**. Rule C3 forbids showing a discount without
   configured pricing. COMM1A records attribution and readiness only; the
   status ladder is enforced by a Postgres CHECK so no reward can precede
   verified eligibility. Report § 3.
2. **THA now sends unsolicited email to non-customers.** New surface. There is
   no send rate limit and no bounce handling (§ 11.2–11.3). The email names no
   household and promises nothing.
3. **Two scope locks fired and both are recorded** (§ 8) — COMM2's route
   allow-list was widened by exactly one door, and a latent over-reach in
   COMM1's join-code assertion (it sliced the migration file to EOF) was
   bounded to COMM1's own migration.

**Single highest-value next step:** configure pricing, or decide not to.
Everything downstream is blocked on that one flag; nothing is being lost
meanwhile, because attribution is already recorded.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
