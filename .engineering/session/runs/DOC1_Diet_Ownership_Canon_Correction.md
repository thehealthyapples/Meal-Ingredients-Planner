# Session: DOC1_Diet_Ownership_Canon_Correction

| Field | Value |
|---|---|
| **Session ID** | `DOC1_Diet_Ownership_Canon_Correction` |
| **Rollback ID** | `rollback/DOC1-architecture-conflict-resolution-20260716` → `7d1dd2ce` (annotated tag) **+ working-tree backup at `…/scratchpad/DOC1-pre-change-backup/`** |
| **Start time** | 2026-07-16T16:50:00Z UTC |
| **Current stage** | Waiting for User |

## Objective
Implement **CONV1 item `DOC-1` only**: resolve the conflicting governing documentation CONV1 identified, and establish **one canonical architectural position for each disputed ownership**. **No application code. No schemas. No `OWN-1`. No runtime behaviour.** Update only the governing architecture + register documents required to remove the conflicts. Report in `docs/implementation/`.

## Files being modified
- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — § 4 grade + status block
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — Domain 7, Domain 27, Phase 3 Dup. 4, Phase 4, Phase 5, Phase 7, Appendix A
- `docs/architecture/capabilities/household.md` — `eaters` scope + new DIET OWNERSHIP section
- `docs/implementation/governance/DOC1_DIET_OWNERSHIP_CANON_CORRECTION.md` — the report (new)
- `.engineering/session/CURRENT.md` + this run file — bookkeeping

**Nothing else touched.** `server/`, `client/`, `shared/`, migrations: **byte-untouched by this item** (verified by `git diff`; the pre-existing modifications there are earlier sessions' — SEC1/SEC4/LIFE2/SEC23).

## Checkpoints
<!-- Append one line per checkpoint. Newest at the bottom. -->
- [x] Architecture Bootstrap read (`docs/architecture/README.md`); git status confirmed
- [x] **Rollback: annotated tag → `7d1dd2ce`. ⚠️ AND a working-tree backup, because a tag was NOT sufficient** — all three target docs already carried **uncommitted** TIME3 changes; `git checkout <tag> -- <file>` would have silently discarded them. Pre-change copies taken to scratchpad **before the first edit**. **Rollback = restore from backup, not from the tag**
- [x] CONV1 read (`DOC-1` § 3 Tier 1, § 1.3, § 7 P1); `CPI1` and `PEOPLE1` § 9.1 read as instructed
- [x] **DOC-1's scope: 4 named sites + a 5th routed to it by `WRITE-1`** (`ARCHITECTURE_PRINCIPLES.md:192`'s grade)
- [x] **Every CONV1 line-number citation re-verified against the live files** — the working tree has moved since `7d1dd2ce` (TIME3 +9 lines), so no citation was inherited
- [x] **ROOT CAUSE FOUND — bigger than DOC-1 enumerated.** Phase 3 **Duplication 4** compared `users.diet*` against **`user_preferences`** (a genuinely low-risk overlap), graded it *Conflict LOW / Launch GREEN*, and **never compared it against `household_eaters`**. **Domain 7, Phase 4, Phase 5, Phase 7 and Appendix A all inherit that comparison.** Correcting the leaves and not the root would guarantee the error regrew
- [x] **Scope decision: 4 named → 8 corrected.** Justified by the mission's own standard (*"remove the conflicts"*): leaving Phase 3/5/7/Domain 27 would leave the conflict standing in three places and make the register **freshly inconsistent with itself** — the exact defect DOC-1 exists to remove. **Reported in the report § 3.1, not hidden**
- [x] **VERIFIED, NOT INHERITED (V6/V7):** the bridge fires **only** on a `dietPattern` write; `PUT /api/user/preferences` writes `dietTypes` **without touching `dietPattern`** → **divergence is reachable**. Confirmed by reading both routes
- [x] **CONV1 CORRECTED (report § 5.2).** `WRITE-1` says *"`:192`'s grade is out of date … the split-brain is live"* — **imprecise about which pair.** `:192` is about `users.diet*` vs `household_eaters`, and for **that** pair *"no live split-brain"* is **still literally true** (adult eater rows empty + 403). `WRITE-1`'s live split-brain is vs **`user_preferences.dietTypes`** — a different pair, and on the **pattern** (soft preference), **not** `dietRestrictions` (the hard safety fact). **`:192` was not false — it was misleading**, because the absence of divergence is *manufactured by locking the correct owner's write door*. Propagating CONV1 verbatim would have written a false statement into a Principle
- [x] **CPI1 S1-1 VERIFIED CLOSED (V9)** — the hardcoded `dietRestrictions: []` is **gone**; `storage.ts` now reads `safety.hardRestrictions` (SEC-1). **Not written into the register as live.** Checking this changed what was written
- [x] **CPI1:263 SUPERSEDED — and CPI1 predicted it.** Its proposed repair rests on Phase 4's *"Retain … the SoT"* ruling, hedged *"**if that ruling still stands**"*. It no longer stands; DOC-1 corrected it. Recorded in report § 5.3
- [x] **`household.md`'s citation is stale — worse than PEOPLE1 recorded (V10).** It cites `routes.ts:8526–8541` as the enrichment mirror; **those lines are now the CPV1 publication-integrity route.** Real sites: `:4770`, `:9034`. Line-number citations **removed** in favour of behaviour + owner
- [x] **`NK1` AGREES — a 4th governing doc CONV1 didn't count (V11).** `NK1:139-140` already declares `household_eaters` **Authoritative** for dietary restrictions. The corrected position has Principles + NK1 + Domain 16 behind it. *(NK1's `age` defect is `DOC-2` — untouched)*
- [x] **README states no diet-ownership position (V12)** — nothing to correct there
- [x] **Remaining *"Contested — see Phase 3"* traced (V13)** — Domain 6 (Dietary Rules) + Domain 18 (Nutrition Boost). **Different duplications; correctly untouched**
- [x] **Grade regraded 🟢 SAFE → 🟡 IMPORTANT, and 🟡 not 🔴 under CP11** — the plate-safety symptom is closed, the safety fact holds no divergent value, the live divergence is a preference. **Not 🟢**, because ownership is inverted and the retirement moves live allergens. **Reported as a judgement a reviewer may overrule**
- [x] **Heading regrade justified structurally**, not just by CONV1's routing: leaving **🟢 SAFE** above a body describing a live split-brain would create a **new** document-contradicts-itself defect
- [x] **Phase 5 verdicts inverted YES→NO with an explicit *"not a work queue"* preamble** — a bare NO reads as *fix now*, which would invert CP3 and discard live allergens
- [x] **Grade vocabulary aligned to each section's own scale** (Phase 3: `HIGH/MEDIUM/LOW` + `HIGH/YELLOW/GREEN`; Principles: 🔴🟡🟢). **No new scale invented.** Heading changed `CONTESTED` → `MODERATE (ownership inverted)` to match Duplications 1–3
- [x] **Errors preserved, not erased** — every corrected site records what it previously said; Phase 3's original text kept in a `<details>` block. A register that silently rewrites its own history cannot be audited
- [x] **ONE-POSITION TEST PASSED — 11 sites across 4 governing docs, one owner at every one.** Zero name `user_preferences` as a rival; zero name the `users.diet*` columns as the SoT
- [x] Gates: `repo-structure-verify.sh` filing checks **PASS**; `<details>` balanced 1:1; **`git diff` confirms zero code/schema/runtime change** *(pre-existing root FAIL on `.glibcheck.txt`/`.libdirs_uxhome.txt` persists — untracked before this session)*
- [x] Report delivered — `docs/implementation/governance/DOC1_DIET_OWNERSHIP_CANON_CORRECTION.md`

**Last checkpoint:** DOC-1 complete. Canon presents one canonical position on diet ownership.

## Next action
None — complete. Awaiting review.

**Next CONV1 item: `DOC-2`** — `NK1` asserts a safety-relevant field (`age`) is stored and **Authoritative** on `household_eaters`; **the column does not exist and never has** (confirmed live at `NK1:139` during this session's V11). No dependencies. Must also resolve the dangling `NK1:418` §6.3 pointer — **without inventing the missing section** (LIFE1 § 4.1). Then `DOC-3` (one comment, out of band) · `DOC-4` (Product Knowledge status block) · `OWN-5`, closing CONV1 § 7's P1 phase.

**`OWN-1`'s CP4 precondition is now satisfied for diet ownership** — but CONV1 § 7 gates `OWN-1` behind the whole of P1, and `DOC-2`'s false inventory sits on the **same entity** `OWN-1` converges onto, with `undefined`-fails-open as its failure mode. **Do not start `OWN-1` until P1 lands.**
