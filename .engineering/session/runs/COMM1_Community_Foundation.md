# Session: COMM1_Community_Foundation

| Field | Value |
|---|---|
| **Session ID** | `COMM1_Community_Foundation` |
| **Rollback ID** | `rollback/COMM1-community-foundation-20260719` → `772eb6edc7f2fe7b5ee1e7c0f7a6f54ee2a94360` |
| **Start time** | 2026-07-19T17:05:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Implement the canonical Community Foundation — households belong to
neighbourhoods — as a new governed domain above SoT Domain 16 (Household),
reusing the existing auth, household, permission and Intelligence Platform
architecture. Foundation only: no Orchard UI, no social features, no feeds,
no sharing workflows.

## Rollback coverage caveat
Tag resolves to `772eb6ed` — **the same commit as SHOP3's tag**, because HEAD
has not moved. It therefore covers **neither** the inherited dirty state from
prior sessions **nor SHOP3's uncommitted work** (which includes the deletion of
7,773 lines). Snapshot: `scratchpad/pre-COMM1-snapshot/` (14,315-line patch,
untracked tarball, status).

## Foundation facts established (investigation)
- Household owner = **SoT Domain 16**: `households`, `household_members`,
  `household_eaters` (`shared/schema.ts:1177-1244`). `users` has **no**
  `household_id` — the relation exists only via `household_members`.
- `getHouseholdForUser` (`server/lib/household.ts:17`) **assumes exactly one
  active household per user**; non-deterministic otherwise. ~50 call sites.
- `permissions.ts:82-85` — the platform **never** does ownership walks; they
  are delegated to the owning service. A new domain gets none for free.
- `requireHouseholdRole` (`server/lib/household.ts:41`) exists but is
  **unwired dead code** — the natural precedent for a community role gate.
- Migrations: append to `MIGRATIONS` in `server/migrations/runner.ts`, id
  `YYYY-MM-DD_workstream_desc`, idempotent SQL, `expectedMigrationHead()` moves.
- Nothing above household exists. `partners` is retailers, not social.
  `community_cookbook` / `community_share` are declared-but-unbuilt recipe
  acquisition lanes (`shared/recipe-acquisition.ts:34,44`) — reconcile, not collide.
- **LAUNCH1 recommends NOT building inter-household community**, citing
  moderation/liability and allergy data. Surfaced to user before building.
- SEC1 lesson: read and write must share the membership predicate; **binding
  tests prove delegation, not isolation** — a DB-backed leak test is required.
- `server/privacy/personal-data-registry.ts` needs entries or the domain
  silently escapes GDPR export/erasure.

## Files being modified
- `shared/schema.ts` — new Community tables
- `server/migrations/runner.ts` — one appended migration
- `server/lib/community.ts` — the owning service (new)
- `server/intelligence/handlers/community-read-port.ts` + handler (new)
- `server/intelligence/bindings/community.ts` (new)
- `server/intelligence/capability-registry.ts` — descriptor
- `server/privacy/personal-data-registry.ts` — export/erasure entries
- `server/routes.ts` — community routes
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — new domain
- `docs/implementation/community/COMM1_COMMUNITY_FOUNDATION.md` — report

## Checkpoints
- [x] Git status confirmed; rollback tag created and reported
- [x] Existing ownership model investigated (household, auth, permissions,
      capability registry, migrations, privacy) — no owner to duplicate
- [x] Design decisions confirmed with user (household grain; targeted
      invitations; zero cross-household read access; LAUNCH1 tension surfaced)
- [x] Schema + migration — applied, head moved, 97 ids, no duplicates
- [x] Owning service with the ownership walk and ONE membership predicate
- [x] Intelligence Platform binding — capability 23, read-only, `platform` domain
- [x] Privacy registry entry + erasure position (the platform REFUSED to erase
      until the position existed — see report §3.3)
- [x] DB-backed test (14) + architecture test (81)
- [x] SoT Register — Domain 37; BUS2A's stale "no Domain 37" note disambiguated
- [x] Implementation report

**Last checkpoint:** Implementation report written

## Next action
Await user review. Nothing is committed.

**Two things a reviewer must know:**
1. The COMM1 tag resolves to the same commit as SHOP3's, so a rollback would
   discard SHOP3 too. Committing SHOP3 restores independent rollback.
2. A migration HAS been applied to the live database. `git checkout` will not
   undo it; the three tables are empty and inert, but they persist.

Recommended before any Community capability is built: the service-level
two-household isolation test (report §11.1). SEC1 is the precedent — mock-backed
assertions proved delegation, not isolation, for that bug's entire life.

## Blockers
none

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
