# COMM1 — Community Foundation

**Date:** 2026-07-19
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED
**Reason:** A new governed domain, three new tables, an applied migration, and the first entity THA has ever created *above* the household. No UI ships, nothing is user-reachable, and no household data crosses the new boundary — but a domain that groups households is the structural precondition for every inter-household risk the platform has so far declined to take on.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| Rollback tag | `rollback/COMM1-community-foundation-20260719` |
| Commit SHA | `772eb6edc7f2fe7b5ee1e7c0f7a6f54ee2a94360` |
| Rollback to committed state | `git checkout rollback/COMM1-community-foundation-20260719` |

> **⚠️ This tag resolves to the SAME COMMIT as SHOP3's** — HEAD has not moved. It therefore covers **neither** the inherited dirty state from prior sessions **nor SHOP3's uncommitted work**, which includes the deletion of 7,773 lines. Snapshotted out-of-repo before any edit:
>
> - `…/scratchpad/pre-COMM1-snapshot/uncommitted-tracked.patch` (14,315 lines — 2.6× SHOP3's, because it now contains SHOP3 itself)
> - `…/scratchpad/pre-COMM1-snapshot/untracked.tar.gz`
> - `…/scratchpad/pre-COMM1-snapshot/status.txt`
>
> **A rollback to this tag would discard SHOP3 as well as COMM1.** The two workstreams are independent in content and disjoint in files, but they are not separable by tag. Committing SHOP3 before continuing would restore that separation.

> **⚠️ A MIGRATION HAS BEEN APPLIED to the database this session connects to.** `2026-07-19_comm1_community_foundation` created three tables. `git checkout` does **not** undo it. See §5.

---

## 1. SUMMARY

THA had no entity above the household. `households`, `household_members` and `household_eaters` (SoT Domain 16) describe who is in one home; nothing described a relationship between homes. COMM1 adds that layer as **Domain 37**, and defines it by what it refuses to carry.

Three tables, one owner, one capability:

| Table | Owns |
|---|---|
| `communities` | Which communities exist. A **neighbourhood is a `kind`**, not a second table |
| `community_members` | Which **households** belong to which communities, in what role |
| `community_invitations` | Who has been invited — targeted, expiring, revocable, single-use |

**The membership grain is the household, never the user.** A person reaches a community through their household's row in `household_members`, which remains the only user↔household relation in the platform.

**Membership is not a read grant.** Two households in one community learn that they share it, and nothing else. This is not a filter applied at the edge; it is the absence of any method that could return more.

### What COMM1 cost, measured

| Metric | Value |
|---|---|
| New tables | **3** |
| New migration | **1**, applied and verified |
| New owning service | **1** (`server/lib/community.ts`) |
| New capability | **1** (`community`, read-only) — live capabilities 22 → **23** |
| New client code | **0** — scope lock forbids Community UI |
| New assertions | **95** (81 architecture + 14 DB-backed) |
| tsc errors introduced | **0** (88 pre-existing, baseline exactly restored) |
| Duplicate user/household entities | **0** |

---

## 2. THE LOAD-BEARING DECISIONS

### 2.1 The grain: households join communities, not people

`community_members.household_id → households.id`. There is **no `user_id` column and no foreign key to `users`** — asserted at the source level *and* against the live database (§9).

The alternative would have created a second membership entity parallel to `household_members`, with three consequences: a person's community identity could drift from their household's; two tables would answer "who belongs to what"; and it would collide directly with `getHouseholdForUser` (`server/lib/household.ts:17`), which **assumes exactly one active household per user** and returns a non-deterministic answer otherwise. Household-grained membership adds no second scope for a user to be in, so that assumption is untouched.

### 2.2 One owner of "who may join"

`households` uses a permanent shared `inviteCode`. COMM1 **deliberately does not mirror it.** A permanent code has no expiry, no revocation, no target and no audit trail, and a leaked one admits anyone forever — the wrong default for a group of households holding allergy data about children.

`community_invitations` is therefore the **single** owner of who may join: targeted at one household, expiring (`expires_at NOT NULL` — the database refuses an invitation without one), revocable, and single-use. Adding a join code *alongside* it would have given one fact two owners, which is the architecture rule this workstream is bound by.

**The token alone is not sufficient.** `acceptInvitation` requires the accepting household to be the household the invitation names. A pure bearer token would have reintroduced exactly the property that made the shared code wrong.

### 2.3 Membership is not a read grant — the SEC1 lesson, one level up

SEC1 (departed-member eater exposure) was caused by a read and a write disagreeing about who was at the table, with the **read being looser**: the write only ever seated active members, the read filtered on household alone, and a person who had left kept leaking their allergens into the household they left.

The same defect is available here in a worse form — "who's in my neighbourhood?" answered with names and eaters would read Domain 16's rows through a Domain 37 door. Three structural defences:

1. **One membership predicate.** `activeMembership()` is composed by every read *and every write* in the owning service. There is deliberately no second way to ask whether a household is in a community.
2. **The port is the boundary.** `getMemberHouseholds` returns `{ householdId, role, joinedAt }`. The read port exposes **no method** that returns another household's name, eaters, restrictions, plans or lists — so the handler has nothing to leak.
3. **A declared readable set.** `COMMUNITY_READABLE_TABLES` names the four tables this domain may touch, and the test fails if the module references any of the forbidden ones.

### 2.4 Probe resistance

A community the caller is not in returns the **same** answer as one that does not exist — 404 on HTTP, an identical gap message on the capability. The test asserts the two messages are byte-identical. Without this, any household could enumerate every community on the platform by watching which error came back.

---

## 3. WHAT THE TYPE SYSTEM AND THE PLATFORM CAUGHT

Three of COMM1's decisions were made *by the existing architecture refusing the first attempt*, not by design foresight. Each is recorded because the refusal was correct.

**1. Community is `platform`, not a Companion room.** The first descriptor declared `companionDomain: "community"` and failed to compile: `CompanionDomain` is a closed union. `COMPANION_ROOMS` are **routable destinations**, and `types.ts:255-258` states that aiming guidance at a capability with no landing page routes a household to a route that does not exist. COMM1's scope lock forbids building Community UI — so there is no page to land on. `COMPANION_PLATFORM` ("attribution only, never routed to") is the honest declaration. When Community gains a room, that becomes a governed change rather than an oversight.

**2. Twenty test files asserting "exactly 22 live capabilities".** The platform's scope-lock tripwire, working precisely as designed: it exists so nobody adds a capability silently. All twenty were updated to 23 **deliberately**, plus two differently-worded locks (registered count 24 → 25, and a separate executable-count assertion). This is recorded loudly because a scope lock updated quietly is a scope lock that has been defeated.

**3. The platform refused to erase an account.** Adding a personal-data category without an erasure position made `assertOrderIsComplete` throw — and it throws *before deleting anything*, with the message *"Refusing to erase, because a partial erasure reported as complete is worse than no erasure."* This is the best failure encountered in either workstream this session: the system declined to perform a destructive operation it could not perform completely, rather than doing most of it and reporting success. `community-membership` now has a declared position.

---

## 4. ARCHITECTURE COMPLIANCE CHECKLIST

| Rule | Status | Evidence |
|---|---|---|
| One Community owner | ✅ | `server/lib/community.ts` — the only module reading or writing the three tables |
| One Household owner | ✅ | Domain 16 untouched. COMM1 adds no column to `households`, `household_members` or `household_eaters` |
| No duplicate user or household entities | ✅ | No `user_id` column, no FK to `users` — verified against the live database |
| Reuse existing Intelligence Platform | ✅ | Same Port → Handler → Binding pattern as thirteen other owners; no new platform machinery |
| Reuse existing permission model | ✅ | `canInvokeCapability` unchanged; the ownership walk lives in the owner, as `permissions.ts:82-85` requires |
| No duplicate conversation state | ✅ | COMM1 touches no conversation module |
| Community enriches rather than replaces | ✅ | No existing workflow changed. Community is additive and currently unreachable by any household |
| Registered as a capability, not an application | ✅ | One registry descriptor beside every other domain |

---

## 5. DATA IMPACT

### New entities — declared in full

| Entity | Key columns | Constraints enforced **in Postgres** |
|---|---|---|
| `communities` | `id`, `name`, `kind` (default `neighbourhood`), `created_by_household_id → households`, `status` | `status IN ('active','archived')` |
| `community_members` | `id`, `community_id → communities`, `household_id → households`, `role`, `status`, `joined_at`, `invited_by_household_id`, `left_at` | `UNIQUE(community_id, household_id)`; `role IN ('member','admin','owner')`; **a `left` row must be dated** |
| `community_invitations` | `id`, `community_id`, `invited_household_id`, `invited_by_household_id`, `token` (unique), `status`, `expires_at` **NOT NULL**, `responded_at` | closed status set; **a resolved invitation must record when it resolved** |

The CHECK constraints are in the database rather than in application code for the reason KNOW2 gave: TypeScript does not run inside Postgres, and these are the invariants that decide whether a household is in a community.

### Migration

**`2026-07-19_comm1_community_foundation`** — appended to the end of `MIGRATIONS`, idempotent (`IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS`), applied in one transaction. `expectedMigrationHead()` now returns it; migration count 96 → 97, no duplicate ids.

**Applied and verified this session:**
```
[Migrations] 1 pending migration(s) to apply
[Migrations] ✓ Applied "2026-07-19_comm1_community_foundation"
[Migrations] Schema at head: 2026-07-19_comm1_community_foundation
```

**Backfill required: none.** All three tables start empty. No existing row is read, written or reinterpreted; no household gains or loses anything. A rollback of the code leaves three unused empty tables, which is inert — but note again that `git checkout` does not drop them.

### Preserving existing household ownership

Domain 16 is **extended by zero columns**. COMM1 reads `household_members` only to derive which household a user acts for, via the existing `getHouseholdForUser`.

### GDPR

Declared as `community-membership` in `server/privacy/personal-data-registry.ts` (all three tables named for the completeness gate), with an erasure position in `ERASURE_ORDER`.

**The erasure semantics follow from the grain, and are the interesting part.** A community membership belongs to the *household*:

- If the erasing person is **not** the last member, the household continues and so do its memberships — erasing one person must not silently withdraw everyone else from their neighbourhood.
- If they **are** the last member, the household itself is erased and `ON DELETE CASCADE` removes its memberships and invitations.

Both paths are handled without a delete of COMM1's own, which is why `erase` is `null` — and the registry contract requires that a null erase explain which cascade covers it. **Invitation tokens are excluded from the export**: an export is a document a household may store or forward, and a live bearer token sitting in a file is a standing grant to join a community.

---

## 6. TRUST CHECK

| Question | Answer |
|---|---|
| Can one household read another's data? | **No.** No method on the owner or the port returns it. Not filtered — absent |
| Can a household discover communities it is not in? | **No.** "Not yours" and "does not exist" are byte-identical responses |
| Can a caller act as another household? | **No.** Every route and the capability resolve the household from the session; no endpoint accepts a household id from the client |
| Can the Companion join a household to a community? | **No.** The capability is read-only at two layers (§9 §2) |
| Can an invitation become a permanent grant? | **No.** `expires_at` is NOT NULL and the database refuses a row without it |
| Can a leaked token admit anyone? | **No.** The accepting household must be the invited household |
| Can a community be stranded unadministrable? | **No.** The last owner cannot leave |
| Does erasing one person withdraw their household? | **No.** Membership is household-grained — stated in the household-facing erasure note |

### The prior decision this workstream runs against

`LAUNCH1_THA_LAUNCH_READINESS_AUDIT.md:667-690` rates inter-household community **5% complete, priority Low**, and recommends **not building it for launch** — on the ground that *"the moment inter-household UGC ships you inherit moderation, reporting and takedown obligations — and given the app holds allergy data, a user-posted recipe that harms an allergic child is a genuine safety and liability surface."*

This was surfaced before any code was written, and the resolution taken was: **build the foundation, let nothing cross it.** LAUNCH1's risk begins at user-generated content and sharing, both of which this scope lock already forbids. COMM1 ships no feed, no post, no shared recipe, no profile and no UI — a household cannot currently reach any of it. The judgement is that a membership graph with a hard, tested boundary is *not* the surface LAUNCH1 warned about, and that building the boundary before the features is the order that makes the warning actionable later.

**That judgement should be re-examined by whoever builds the first capability that crosses the boundary.** It is a decision about where the risk starts, not proof that it never starts.

### Reconciliation with `community_cookbook`

`shared/recipe-acquisition.ts:34,44` declares `community_cookbook` and `community_share` as recipe-acquisition lanes, annotated *"(future)"*. These are **lane labels with no table, no route and no code**. COMM1 does not implement, extend or claim them; the word is now backed by a domain, and any future cookbook sharing must be built as a capability *on* Domain 37 that declares what it discloses — not as a second community concept.

---

## 7. CHANGES MADE

### Created (6)

| File | Purpose |
|---|---|
| `server/lib/community.ts` | The owning service — membership, roles, invitation lifecycle, the ownership walk |
| `server/intelligence/handlers/community-read-port.ts` | Narrow read-only seam. No write method by construction |
| `server/intelligence/handlers/community-read-handler.ts` | Read-only handler, three scopes |
| `server/intelligence/bindings/community.ts` | Capability binding |
| `server/tests/test-comm1-community-foundation.ts` | 81 assertions |
| `server/tests/test-comm1-community-database.ts` | 14 DB-backed assertions |

### Modified (8)

| File | Change |
|---|---|
| `shared/schema.ts` | Three tables + types |
| `server/migrations/runner.ts` | One appended migration |
| `server/routes.ts` | Nine `/api/community/*` routes |
| `server/intelligence/capability-registry.ts` | The `community` descriptor |
| `server/intelligence/intelligence-platform.ts` / `index.ts` | Binding wired and exported |
| `server/privacy/personal-data-registry.ts` | `community-membership` category |
| `server/privacy/account-erasure-service.ts` | Erasure position |
| `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | **Domain 37** |

### Modified — scope locks, deliberately (22 test files)

Twenty files' `live.length === 22` → `23`, plus the registered-count lock (24 → 25) and one differently-worded executable-count lock. See §3.

### Deliberately NOT built

- **Any UI.** Scope lock. There is no page, component or route in `client/`.
- **Feeds, posts, sharing, social features, public profiles.** Scope lock.
- **A shared community join code.** §2.2 — it would give "who may join" two owners.
- **Cross-household data access of any kind.** §2.3 — the point of the workstream.
- **A `neighbourhoods` table.** A neighbourhood is a `kind`.
- **Changes to `getHouseholdForUser`.** Its one-household-per-user assumption is a real constraint (documented in the run file), but household-grained membership does not touch it. Widening it is a Domain 16 change and belongs to whoever needs multi-household users.

---

## 8. INTEGRATION WITH THE INTELLIGENCE PLATFORM

Registered as capability `community`, bound read-only, live capabilities 22 → 23.

| Descriptor field | Value |
|---|---|
| `owner` | `DB communities / community_members / community_invitations (SoT D37)` |
| `owningService` | `server/lib/community.ts` — exactly one |
| `supportedIntents` | `["read"]` — **the whole architectural surface** |
| `capabilityClass` | `read-only` |
| `companionDomain` | `platform` — attribution only, never routed to (§3) |
| `permissions` | `{ minimumRole: "user", knowledgeClass: "public", ownershipScoped: true }` |

Three read scopes: `communities` (the caller's own), `members` (ids and roles, membership required), `invitations` (own pending, tokens excluded).

**Read-only is enforced at two layers**, and this is deliberately stricter than Household. Household allow-lists `add`/`delete`/`explain` and lets them reach its handler to be gapped there; Community declares `supportedIntents: ["read"]` and nothing else, so a write verb is refused as `unsupported_intent` **at the registry, before any handler runs**. A verb Community will never support should not be in its architectural surface at all. The handler's own guard is retained and tested directly as defence in depth, so widening the registry later still would not make a write executable.

---

## 9. VALIDATION PERFORMED

| Check | Result |
|---|---|
| `npm run test:comm1-community-foundation` | **81 passed, 0 failed** |
| `npm run test:comm1-community-database` (DB-backed) | **14 passed, 0 failed** |
| Migration applied | ✅ head = `2026-07-19_comm1_community_foundation`, 97 ids, no duplicates |
| `npx tsc --noEmit` | **88 — pre-existing baseline exactly restored, 0 introduced** |
| `npm run build` | ✅ clean |
| `npm run verify:coherence` | **2 failures — unchanged.** Both pre-existing (Domain 34; `pantry-intelligence-assembler.ts`, deleted by a prior session). Domain 37 introduced none |
| Platform / registry | `intelligence-platform` 33/33 · `registry-executability` 129/129 · `mat1` 25/25 · `read-kit` 50/50 · `fallback` 82/82 |
| Household & privacy | `household-binding` 50/50 · `household-discovery` 48/48 · **`bus1-trust-and-compliance` 42/42** · **`sec1-departed-member` 17/17** |
| Companion | `companion-card` ✅ · `companion-guidance` 74/74 · `capability-guidance-goals` 139/139 · `companion-actions` 93/93 · `observability` 60/60 |
| Safety & prior work | `restriction-safety` ✅ · `prod6` 158/158 · `shop3` 29/29 |

### Manual verification (Definition of Done)

Performed against the live database, not simulated. The database **refuses** every invalid state:

- ✓ `community_members` has **no `user_id` column** and **no FK to `users`** — the household grain holds physically, not just in the type system
- ✓ a `left` membership with no `left_at` is **refused**
- ✓ an invented role (`superuser`) is **refused**
- ✓ a household cannot be seated twice in one community
- ✓ an invitation with **no expiry** is **refused**
- ✓ an `accepted` invitation with no `responded_at` is **refused**
- ✓ invitation tokens are unique
- ✓ deleting a community cascades to its members and invitations

### An incident during verification, reported in full

Adding the privacy registry entry made `eraseAccount` throw (§3.3). That crash occurred **inside BUS1's DB-backed test, after it had created its fixture**, and because the throw happens before any deletion, the fixture was never cleaned up. Two aborted runs left **6 orphan `user_consents` rows** and **2 orphan `support_requests` rows** in the database.

BUS1 then reported **40/42** — and the two failures were *not* caused by the COMM1 code but by that residue, because those two assertions are **global** (`SELECT COUNT(*) … WHERE recorded_ip = '203.0.113.1'`) rather than scoped to the run's own fixture. The orphans were inspected before removal (all unlinked, `user_id IS NULL`, all carrying the reserved TEST-NET-3 documentation address or the literal `bus1-verify` marker — values no real household can hold), then deleted. BUS1 returned to **42/42**.

This is reported rather than quietly fixed for two reasons: I caused it, and it exposes a real fragility — **BUS1's assertions are global, so any aborted run poisons every subsequent run** until someone cleans the database by hand. Recorded as a follow-on.

---

## 10. DEFINITION OF DONE

| Objective | Status |
|---|---|
| Canonical Community architecture implemented | ✅ Domain 37, three tables, one owner |
| Membership and permissions operational | ✅ Full lifecycle; role ladder; ownership walk in the owner |
| Integrates with Household and Companion architecture | ✅ Domain 16 unchanged; capability 23 bound read-only |
| Manual verification completed | ✅ Migration applied; 14 DB-backed assertions against live Postgres |
| Implementation report completed | ✅ This document |

---

## 11. SCOPE LOCK

**Held.** No Orchard UI, no social features, no feeds, no sharing workflows. `client/` is untouched by COMM1.

### Follow-ons — reported, not built

1. **Service-level cross-household isolation test.** The DB-backed suite proves the *schema* refuses bad states; the foundation suite proves the *code* cannot reach across the boundary. Neither drives two real households through the owning service to prove household B cannot read household A's community data at runtime. **SEC1 is the precedent for why this matters** — 51 green mock-backed assertions sat on top of a live leak for that bug's entire life. This needs multi-household fixtures and should exist before any capability crosses the boundary.
2. **BUS1's global assertions.** An aborted run poisons every later run until the database is cleaned by hand (§9). Scoping those two assertions to the run's own fixture would make the suite self-healing.
3. **`getHouseholdForUser` assumes one active household per user.** Untouched by COMM1 and not a defect today, but it is the constraint any future multi-household feature meets first.
4. **No route-level integration test.** The nine `/api/community/*` routes are asserted by source inspection (session-resolved household, 404 parity), not by driving HTTP with two authenticated sessions.
5. **Community is unreachable by any household.** By design — but it means the lifecycle has been exercised by tests and by direct SQL, never by a person.

---

## 12. THE HONEST STATE OF IT

The foundation is real: the tables exist, the migration is applied, the constraints are enforced by Postgres, the capability is live, and the privacy boundary is asserted 95 ways. What has *not* happened is a household using it, because the scope lock deliberately prevents that.

Three things a reviewer should weigh:

- **The strongest claim here is a negative one, and negatives are hard to test.** "No household data crosses" is proven by the absence of methods that could return it, plus source-level assertions that the owner never references the forbidden tables. That is genuinely structural — but the runtime, two-household proof named in §11.1 does not exist yet, and SEC1 is the standing reminder of what mock-backed confidence is worth.
- **This workstream builds something a governing document recommended against.** LAUNCH1's reasoning was about UGC and liability, and this scope lock excludes both — but the disagreement is recorded rather than resolved, and the person who builds the first capability that crosses the boundary inherits it.
- **The rollback tag cannot separate COMM1 from SHOP3**, and a migration has been applied that `git checkout` will not undo. Committing SHOP3 before continuing would restore independent rollback for both.
