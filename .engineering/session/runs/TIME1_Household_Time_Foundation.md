
# Session: TIME1_Household_Time_Foundation

| Field | Value |
|---|---|
| **Session ID** | `TIME1_Household_Time_Foundation` |
| **Rollback ID** | `rollback/TIME1-household-time-foundation-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T12:00:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Design the canonical **Household Time Foundation** — the governing architecture for how THA understands calendar time as a *platform capability*, not a Planner feature. Closes the gap HOME2 § 8.1 recorded: THA cannot determine "today", cannot relate planner weeks to calendar dates, and cannot support time-aware household intelligence. Investigation only — no implementation, no schema change, no Planner redesign, no architecture modified.

## Files being modified
- `docs/investigations/platform/TIME1_HOUSEHOLD_TIME_FOUNDATION.md` — the deliverable (new)
- `.engineering/session/CURRENT.md` + this run file — session recovery bookkeeping

No other file touched. All governing architecture byte-untouched. No code, no schema.

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`, STEP 2)
- [x] Governing architecture read: ARCHITECTURE_PRINCIPLES, SoT Register
- [x] HOME2 read (the mission's origin — § 8.1 the time gap)
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] Exhaustive time/date code audit — schema, timezone, "today", week semantics, seasonal engine, diary, holidays/cron
- [x] **Headline discovery: duplicate ownership of time is ALREADY LIVE** — six private clocks, none owned; the Foundation is a *convergence*, not an addition
- [x] **`max(weekNumber)` ≡ 6** (all 6 weeks created eagerly, `storage.ts:1220`; bounded 1–6, `routes.ts:7182`) — "current week" is a constant; dashboard says Week 1, Home says Week 6
- [x] Design settled against Principle 2 scope test + ATTN1/DEC1 precedent: one pure vocabulary module, two facts on two *existing* owners, zero new domains
- [x] One-morning law checked — TRANSLATION1 § 3/§ 6/§ 8 already *require* a clock; § 9 forbids it reaching the light. NORTH2 § 3.5 preserved
- [x] Investigation delivered

**Last checkpoint:** Investigation delivered — `docs/investigations/platform/TIME1_HOUSEHOLD_TIME_FOUNDATION.md`

## Next action
Await direction. Open items, none blocking, all the user's:
1. **The window-expired decision** (TIME1 § 15.1) — what the Planner should do when the six-slot window runs out. A **Planner product decision**; TIME1 deliberately does not answer it.
2. **Build Phase 1** (§ 10) — the pure module. Zero consumers, zero risk, no new dependency (`Intl` suffices). Reversible by deleting one file.
3. **Live defects reported, not fixed** (§ 15.2): dashboard week chart rotated one day (`dashboard.tsx:54`+`:192-196`); Home/dashboard contradict on "this week"; `approxDate` is a season filter not a recency hint (worse than HOME2 recorded); `buildHouseholdHistory` duplicated; **8 timezone-naive timestamps incl. 2 security token expiries** (`schema.ts:23,28`) — triage separately.
4. **False comment** `routes.ts:11371` ("0 = Monday") — one-line fix (§ 15.3).

## Blockers
None. No amendment proposed; nothing gated on governance. The single register amendment (§ 13) is due at implementation, not now.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
