# SEC1 — Departed Member Eater Exposure

**Stage:** Complete
**Date:** 2026-07-16
**Rollback ID:** `rollback/SEC1-departed-member-eater-exposure-20260716` → `7d1dd2ce`
**Authority:** CONV1 § 3 (`SEC-1`), § 5 rank 1, § 7 (P0). Source finding: PEOPLE1 § 8.1.
**Scope:** CONV1 item `SEC-1` only. **No schema, no migration, no client, no architecture modified.**

---

## Rollback protection

- Annotated tag created **before any file was touched**; resolved with `^{commit}`.
- **Working tree was already dirty (49 entries, ~20 concurrent sessions).** A tag covers
  **committed state only** — none of that work was authored or touched here.
- **No stash taken** — it would have destroyed the concurrent sessions' trees (LIFE2 precedent).
- `server/storage.ts` was **CLEAN at HEAD**, so the tag is fully sufficient for the edited file
  (`ROLLBACK_PROTECTION_PROTOCOL.md` § 3 — *"scope your change so the tag is sufficient"*).
  Additionally copied outside the repo before editing.

## What changed

`server/storage.ts` — `getHouseholdEaters` now returns children (`userId IS NULL`) plus adults who
are **still active members**. This is the rule `syncMembersAsEaters` (`:2897`) already applied on the
write side; the read was the looser of the two.

**Filter, not sever, not delete** — both refusals are load-bearing:
- Nulling `userId` triggers **PEOPLE1 § 8.6**: the row flips to `kind:"child"`, is promoted to
  canonical owner of allergens it stores as `[]`, silently emptying a real person's restrictions.
- Deleting breaks `planner_entry_eaters` and takes a retention decision this layer may not take.

## Verification

- **New suite:** `test:sec1-departed-member-eater-exposure` — **17/0**, DB-backed, not mocked.
- **★ Proved to detect the defect:** reverted `storage.ts` to `7d1dd2ce` → **13 passed, 4 failed**,
  exactly the four leak assertions. Restored → 17/0.
- **E2E on port 5098** (concurrent session's 5000 untouched): Alice left, then declared new
  Dairy/Eggs allergens — **never reached Bob**. Raw table still holds her row, `userId` intact.
- **Regressions:** 1,070 passed, 0 failed across 17 suites.
- **Typecheck:** 304 before, 304 after — identical; zero in touched files.
- **`verify:publication`:** unchanged (6 🔴) — correct; SEC-1 is not a publication item.
- Test data cleaned up; test server stopped; port 5000 confirmed still up.

## Reported, not absorbed

- **§ 3.2 residue:** `getPlannerEntryEaters` joins the table directly, so a departed member's
  **frozen** name can still appear on planner entries they were explicitly assigned to. **Not a live
  account read** (no `getUser` on that path) — it is planner history, and PEOPLE1 § 8.3's question.
- **The cause is untouched.** The ownership inversion that made this a live feed is exactly as live
  as before. STEP 8 convergence recorded as **Unknown — requires audit**; this change converged
  **zero** duplicate owners, and claiming otherwise would be false.
- One manual-verification step first returned **HTTP 400** on an invalid `dietPattern` enum value —
  my error, not a platform defect. Recorded rather than dropped.

## Files changed

1. `server/storage.ts` (+34 / −1, one function)
2. `server/tests/test-sec1-departed-member-eater-exposure.ts` (new)
3. `package.json` (+2 lines; concurrent session's `test:home2-*` lines preserved, JSON re-validated)
4. `docs/implementation/platform/SEC1_DEPARTED_MEMBER_EATER_EXPOSURE.md` (report)

## Next action

None — complete. **Next CONV1 item: `SEC-4`** (`/api/uplift/accept` accepts any caller-supplied
`ruleId`; 8 live phantom rows). Validate server-side **first**, then delete the client constant.
`OWN-1` still must not start until **`DOC-1`** lands.
