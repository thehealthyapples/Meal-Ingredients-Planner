
# Session: TIME3_Household_Time_Architecture_Promotion

| Field | Value |
|---|---|
| **Session ID** | `TIME3_Household_Time_Architecture_Promotion` |
| **Rollback ID** | `rollback/TIME3-household-time-architecture-promotion-20260716` → `7d1dd2ce` |
| **Start time** | 2026-07-16T13:00:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Promote Household Time into the governing architecture — TIME2's **Step 0**. Create the permanent governing document from TIME1 + TIME2, update the Source of Truth Register and the architecture index, and retire both investigations as sources of rule. **Governance only** — no implementation, no application code, no schema.

## Files created
- `docs/architecture/THA_HOUSEHOLD_TIME_ARCHITECTURE.md` — **the governing document** (new)

## Files updated
- `docs/architecture/README.md` — Platform Governance table row + descriptive blockquote + History (promotion recorded, per the DEC1 precedent)
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Appendix A owner row; Domain 14 (`weekStartDate` + day-of-week key space declared); Domain 16 (`timeZone`)
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — Domain Ownership Quick Reference row
- `docs/investigations/platform/TIME1_…md` · `TIME2_…md` — **status banner only**, prepended; no analysis altered
- `.engineering/session/CURRENT.md` + this run file

**No application code. No schema. No migration. No `shared/`, `server/`, `client/` file touched.**

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`) — verified byte-unchanged before edits
- [x] Git status confirmed; rollback tag created → `7d1dd2ce`; session registered
- [x] **Promotion precedent established** — `DEC1_CANONICAL_DECISION_ENGINE.md` carries no banner; the README History records the promotion. Followed, plus a banner (see decision below)
- [x] **Declare-before-implement order verified sanctioned** — `CANONICAL_PUBLICATION_ARCHITECTURE.md`:462-465, *"Every new domain must be declared before implementation"*
- [x] **Verification coupling checked** — `publication-register.ts:1377`'s `xc-register-currency` greps only for specific stale strings; the register edits cannot trip it
- [x] Governing document created — 19 sections, **HT1–HT18**, no rule not already in TIME1/TIME2
- [x] Register + index + principles amended; repo structure gate re-run (only the pre-existing root-strays FAIL)
- [x] TIME1/TIME2 retired as sources of rule

**Last checkpoint:** Promotion complete — Household Time is a recognised platform capability.

## Decisions taken
1. **Banner added to TIME1/TIME2 despite the DEC1 precedent.** DEC1's promoted investigation is unbannered, but TIME1 § 13 and TIME2 § 10.2 both contained **recommendations this promotion completed** ("the register MUST evolve — at implementation, not now"; "next: TIME3"). Left unmarked, the next reader redoes this work. The banner is additive metadata; **no analysis was altered**.
2. **No new numbered SoT domain.** TIME1 § 13 specified an Appendix A row on ATTN1/DEC1's footing and two domain extensions — *"No new domain section."* Followed exactly; not redesigned.
3. **No verification entry added** to `server/verification/publication-register.ts` — that is application code (mission forbids), and a check asserting the properties of a file that does not exist would fail by design. It lands with Phase 1, per the architecture § 16.
4. **Domain 11's season-ownership inversion (TIME2 § 7.4) NOT resolved here** — resolving it is Phase 1a, a workstream. The architecture states the boundary (Rule HT17); the register is not amended for it, to avoid deciding a question TIME2 left open.

## Next action
Await direction. Recommended next workstream:
1. **TIME4 — Phase 1: the module** (`shared/time/household-time.ts`). Pure, zero-I/O, zero consumers, **no new dependency** (`Intl` suffices). Declares the key space (0=Sunday), the week convention (Monday-first), the phase vocabulary, and the four derivations. Reversible by deleting one file. **Must land with its verification entry** (architecture § 16) and a `Household Time` row in `server/verification/publication-register.ts`.
2. **Still out of band, do NOT sequence behind the roadmap — two security defects** (TIME2 § 9.4 #11/#12): `password_reset_expires` declared naive while the DB is `TIMESTAMPTZ`; `email_verification_expires` has **no migration at all**. INSTANT-domain; Household Time will never touch them.
3. **Phase 1a (season convergence)** — cheapest genuine ownership win; needs no zone, no anchor.

## Blockers
None. **Note:** the repo structure gate carries a pre-existing FAIL unrelated to this work — `.glibcheck.txt` and `.libdirs_uxhome.txt` at root, both untracked before this session. Not created or removed here.

---
_Stages: Planning → Rollback Complete → Implementation → Testing → Verification → Documentation → Waiting for User → Complete (or Blocked)._
_Record only concise engineering progress. Do NOT record chain-of-thought or conversation transcripts._
