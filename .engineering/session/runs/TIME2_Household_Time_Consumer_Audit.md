
# Session: TIME2_Household_Time_Consumer_Audit

| Field | Value |
|---|---|
| **Session ID** | `TIME2_Household_Time_Consumer_Audit` |
| **Rollback ID** | `rollback/TIME2-household-time-consumer-audit-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T12:30:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Create the governing **Household Time Consumer Audit** — using TIME1 as the foundation, identify every existing THA domain that should consume Household Time, with per-domain rationale, consumed vocabulary, ownership boundaries, dependencies and implementation order. Investigation only — no implementation, no TIME1 build, no code, no new features.

## Files being modified
- `docs/investigations/platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md` — the deliverable (new)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

**Filing deviation, reported to the user:** the mission specified `docs/investigations/TIME2_...md` (root). That path **violates governing architecture** — `REPOSITORY_CONVENTIONS.md:47` ("Do not put here: … loose files at its root"), `:74` (investigations file under `docs/investigations/<workstream>/`) — and would **fail** `.engineering/scripts/repo-structure-verify.sh:52-54`, which asserts the root file count is 0. Filed under `platform/` (TIME1's workstream); filename preserved.

No other file touched. All governing architecture byte-untouched. No code, no schema.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`, STEP 2) — confirmed byte-unchanged since TIME1
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] Filing conflict found and resolved compliantly (see above)
- [x] Two-part consumer census complete — 11 named domains + 9 discovered = **20 domains**
- [x] **CIVIL/INSTANT test** established as the audit's instrument — headline: *every INSTANT consumer is correct, every CIVIL consumer is broken; the line is exactly TIME1's*
- [x] **3 of the mission's 5 confirmations REFUTED** — duplicate today (5 current-weeks, 19 week-shapes, 5 frames), duplicate season (3 impls; declared owner ≠ actual), no-scheduler (vacuous)
- [x] **3 corrections to TIME1 recorded** — `dayOfWeek` is a live split not a coincidence (2 live defects incl. starter-meal seeder); duplication undercounted; § 9 retirement list incomplete
- [x] Repo structure gate run — `docs/investigations/ has no loose files` **PASS** (filing decision verified)
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/platform/TIME2_HOUSEHOLD_TIME_CONSUMER_AUDIT.md`

## Next action
Await direction. Recommended next workstream:
1. **TIME3 — the TIME1 register amendment (Step 0).** Docs only, no code. The root of the dependency graph: the register names no time owner today, so nothing can converge onto one. **Must include amending TIME1 § 9's retirement list** (TIME2 § 8.3 — it is incomplete). *Do not start with Step 3, however tempting the one-line `temporalAnchor` fix — a converged consumer pointing at an unregistered module is a rival owner with better manners.*
2. **Out of band, do NOT sequence behind Step 0 — two security defects** (TIME2 § 9.4 #11/#12): `password_reset_expires` declared naive while the DB is `TIMESTAMPTZ` (`schema.ts:28` vs `migrations/runner.ts:74`) — wrong-instant expiry if the process TZ is ever not UTC; `email_verification_expires` **has no migration at all** (push-only). Unrelated to household time; the Foundation will never touch them.
3. **Also out of band:** `storage.ts:3345-3348` starter-meal off-by-one (every new household); `dashboard.tsx:54` rotated week chart; `routes.ts:11371` false comment.
4. **Season convergence (Step 1a)** — 3 impls → 1, and Domain 11's declared owner ≠ its actual owner. Needs no zone, no anchor, no register row. Cheapest genuine ownership win available.

## Blockers
None. **Note:** the repo structure gate has a pre-existing FAIL unrelated to this work — `.glibcheck.txt` and `.libdirs_uxhome.txt` at root, both untracked before this session began. Not created or removed here.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
