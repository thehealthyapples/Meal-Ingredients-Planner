# ENGGOV1 — Engineering Governance Restoration

**Date:** 2026-07-18
**Branch:** int1-intelligence-platform
**Risk:** 🟢 GREEN
**Reason:** Governance records and `.engineering/` shell only. No application file, schema, route, capability, or deployment configuration touched.

**Engineering Governance is restored as far as it can honestly be restored by anyone other than the original authors — and the boundary between those two things is the finding. `engineering-verify.sh` went from 1 of 3 passing to 2 of 3, and on a modelled compliant repository it passes 3 of 3 with session completion working end-to-end. The remaining live failure is not repairable by this session: every one of the 10 loose files blocking it is untracked work authored by other sessions, and committed state already passes that check. Nothing was fabricated: 45 rollback defects across 43 sessions were recorded as documented exceptions rather than repaired, because repairing them means creating a tag today that claims to protect a state from days ago. Two new defects were found and one was fixed; one correction is owed to ENGAUTO1 and is made here.**

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ENGGOV1-engineering-governance-restoration-20260718` → `d535e7cb05b92d01080b14a9a6c79715c70421a9` |
| Working tree | **Intentionally dirty — ~245 uncommitted entries authored by others.** The tag captures committed state only and covers none of it. None was touched, staged, or committed. |
| This task's writes | 1 governance record created, 2 scripts modified, 3 ENGAUTO1 records corrected, this report, session run file, `CURRENT.md` |
| Rollback | `git checkout rollback/ENGGOV1-engineering-governance-restoration-20260718` |

---

## ARCHITECTURE COMPLIANCE

| Requirement | Compliance |
|---|---|
| **One canonical owner** | `GOVERNANCE_EXCEPTIONS.md` owns exactly one fact: **the decision to accept a defect**. Its header names what it does *not* own — session state, rollback rules, filing rules — and cites each owner |
| **One source of truth** | The exempt list exists **once**, in the register. `rollback-verify.sh` reads it and stores nothing. Delete the register and no fact is lost — the verifier simply reports every defect as FAIL again |
| **No duplicate governance** | Verified before creating it: `grep -rli "exception register\|governance exception\|waiver"` across `.engineering/` and `docs/architecture/` returned **nothing**. No existing document owned this |
| **No duplicate ownership** | No exception restates a protocol clause; each quotes and cites. Session facts stay owned by `CURRENT.md` |
| **No duplicate state** | The register holds session **identifiers** only — no stage, no rollback ID, no status copied from the dashboard |
| **Extend existing governance** | Two existing scripts extended. No new verifier, no new protocol, no new gate, no new capability |
| **Honest gaps over fabricated history** | The central design property — see below |
| **One gate** (`PRE_DEPLOYMENT_VERIFICATION_GATE.md` §1) | `.github/workflows/ci.yml` **byte-untouched**. Nothing added beside the deploy gate |

### AI Architecture Compliance

**Not applicable, and deliberately so.** ENGGOV1 adds no capability, no intent, no handler, no prompt, no context view, and no model call. Nothing here is read by the Intelligence Platform, and `.engineering/` may not be — that boundary is the subject of `ENGINT1-FIX1` and is verified green throughout this session (`session-verify.sh` exit 0). No AI-generated content reaches any household; no knowledge claim is rendered; no health claim exists. The `developer` capability is untouched.

---

## GOVERNANCE RESTORATION SUMMARY

### 1. Fixed — `repo-structure-verify.sh` false-positived inside a linked worktree

Its root allow-list check ran `find . -maxdepth 1 -type f`. In a **linked git worktree** `.git` is a *file* (a gitdir pointer), not a directory, so `.git` was reported as a stray and the verifier failed on a repository that was fine.

**This mattered more than a cosmetic bug.** `OPERATING_MANUAL.md` Step 6 instructs engineers to *"compare against the rollback tag in a temporary worktree if unsure"* — so the verifier was unreliable in exactly the place the manual sends you. It was hit twice during this programme before being diagnosed.

Fixed by skipping `.git` in either form. **Before:** `FAIL … stray: .git`. **After:** `.git` absent from the stray list; the same run correctly reports the one genuine committed stray (`.north3-probe.ts`).

### 2. Established — the governance exceptions register

`.engineering/GOVERNANCE_EXCEPTIONS.md`, holding **7 exceptions** covering **45 defects across 43 sessions**, each stating why the honest repair is impossible and who owns the resolution.

### 3. Extended — `rollback-verify.sh` honours the register

**Why this was necessary rather than cosmetic.** EXC-1's 12 sessions can *never* be repaired. Without this, `engineering-verify.sh` could never go green — and `PRE_DEPLOYMENT_VERIFICATION_GATE.md` §4 records where that ends: *"a gate that cannot be satisfied is a gate that gets switched off."* ENGAUTO1's automation would have been ignored within a month.

**It is an acknowledgement, never an erasure.** An excepted defect reports as `EXC   … [accepted — GOVERNANCE_EXCEPTIONS.md]`, is counted separately, and is printed on every run. It is never reported as `PASS`. The closing line states the count explicitly: *"45 accepted exception(s) — recorded in GOVERNANCE_EXCEPTIONS.md, not silently passed."*

**Proven to be a strict whitelist, not a silencer** — the safety property that matters most here:

| Test | Result |
|---|---|
| Standalone lightweight tag, no session context | **FAIL, exit 1** |
| A **new** session with a lightweight tag, not in the register | **FAIL, exit 1** |
| The 43 registered sessions | `EXC`, exit 0 |

A defect of the identical class still fails if it is not explicitly listed. Probe session, probe row, and probe tag were removed; residue check confirmed `0 rows, 0 files, 0 tags`.

### 4. Corrected — the ENGAUTO1 loose-file miscount

ENGAUTO1 reported **12** loose files. The true number is **10**: the check reads *"README.md index only"*, and the two `README.md` files are explicitly permitted. Corrected in `ENGAUTO1_ENGINEERING_AUTOMATION.md` (with a visible correction note, the house pattern used in the architecture README), its run file, and its dashboard row.

**The adjacent "12" was verified and left alone.** ENGAUTO1's *other* 12 — 12 sessions whose rollback tag does not exist — is correct, and `rollback-verify.sh` independently re-confirms it (`grep -c 'FAIL.*tag exists'` → 12). The two numbers were checked separately rather than blanket-replaced.

---

## VERIFICATION

### Repository filing verification

| Scope | Result |
|---|---|
| Working tree | **FAIL ×2** — loose files at `docs/implementation/` (9) and `docs/investigations/` (1) |
| **Committed state (clean worktree at `HEAD`)** | **PASS ×2** — *"docs/implementation/ has no loose files"*, *"docs/investigations/ has no loose files"* |
| All other structure checks, working tree | **PASS ×9** |

**The repository's committed filing is already compliant.** The failure exists only in the working tree, caused entirely by 10 untracked documents authored by other sessions.

### Session completion verification

Live repository: **still blocked** by the filing gate (EXC-5) — unchanged, and not repairable here.

Modelled compliant repository (worktree at `HEAD` + ENGGOV1's changes + the two EXC-6 remedies that already exist uncommitted + the 12 EXC-7 run files):

```
1. engineering-verify  →  ALL THREE PASS (exit 0)
2. session-new GOV1_Probe          →  session registered
   session-complete GOV1_Probe     →  "Session completed: GOV1_Probe (final stage: Complete)"
                                      "Other sessions are still active — dashboard stays ESR:ACTIVE."
3. rows on CURRENT.md: 0   rows on INDEX.md: 1
```

**Session completion functions correctly end-to-end**, including the `CURRENT.md → INDEX.md` move and correct retention of the `ESR:ACTIVE` marker. The machinery is sound; only other sessions' uncommitted work stands between the live repository and a green baseline.

### Engineering verification results

| Stage | Repository structure | Engineering boundary | Rollback protection | Overall |
|---|---|---|---|---|
| Before ENGGOV1 | FAIL | PASS | FAIL | **1 of 3** |
| After ENGGOV1 (live tree) | FAIL *(EXC-5)* | PASS | **PASS** — 425 PASS · 45 EXC · **0 FAIL** | **2 of 3** |
| Modelled compliant repository | **PASS** | **PASS** | **PASS** | **3 of 3, exit 0** |

### Rollback protection validated

`rollback/ENGGOV1-engineering-governance-restoration-20260718` verified by the tool this programme built: exists · **annotated** · resolves to `d535e7cb` · identifier identical in run file and dashboard (§6).

### Build

**Not run, and not required.** Operating Manual Step 7 requires a build only if a code file changed. This session changed `.engineering/` shell scripts and Markdown governance records only — not an input to `script/build.ts`. No application file was touched, so no test suite was re-run. Stated rather than silently skipped.

---

## FILES CHANGED

| File | Change |
|---|---|
| `.engineering/GOVERNANCE_EXCEPTIONS.md` | **New.** 7 exceptions; machine-readable exempt block of 43 session IDs |
| `.engineering/scripts/repo-structure-verify.sh` | Worktree `.git` false-positive fixed (+6 lines, comment included) |
| `.engineering/scripts/rollback-verify.sh` | Reads the register; `EXC` severity; exception count in the summary |
| `docs/implementation/engineering/ENGAUTO1_ENGINEERING_AUTOMATION.md` | Loose-file count corrected 12 → 10, with a visible correction note |
| `.engineering/session/runs/ENGAUTO1_Engineering_Automation.md` | Same correction |
| `.engineering/session/CURRENT.md` | Same correction; ENGGOV1 row |
| `docs/implementation/engineering/ENGGOV1_…md` | This report |

**No application file. No schema. No migration. No route. No `ci.yml`.**

---

## REMAINING GOVERNANCE EXCEPTIONS

| # | Defect | Class | Owner |
|---|---|---|---|
| **EXC-1** | 12 sessions whose rollback tag does not exist | **Permanent** | — cannot be repaired |
| **EXC-2** | 31 sessions using lightweight tags | **Permanent** for existing tags | Open decision: enforce §2 or relax it |
| **EXC-3** | `ARRIVAL1_Arrival_Experience_Prototype` — two different identifiers | Open | Its author |
| **EXC-4** | `BRAND1_Architectural_Branding` — dashboard row, no run file | Open | Its author |
| **EXC-5** | 10 loose files blocking all session completion | Open — **blocks 98 completions** | The 10 files' authors |
| **EXC-6** | Committed state carries 2 structural violations, both already fixed uncommitted | Open | Whoever commits them |
| **EXC-7** | **12 session run files exist only in the working tree, not in git** | Open | Each session's author |

**EXC-7 is new to this session and is the most consequential finding.** Found by running `rollback-verify.sh` inside a clean worktree at `HEAD`, where 12 sessions report `run file exists` **FAIL** while passing in the working tree. Their dashboard rows are committed; the run files they point at are not in git. The Session Recovery Protocol's premise is *read `CURRENT.md`, open the run file, continue* — for these 12, a fresh clone resolves that link to **nothing**. The working tree is currently the only copy of those session records.

---

## DATA IMPACT

- Reads existing engineering governance: **YES** — git tags, session records, protocols. Read-only.
- Writes engineering governance records: **YES** — one new register, two scripts, corrections to three ENGAUTO1 records.
- No schema · No runtime change · No production impact · No backfill.

---

## TRUST CHECK

- **Never fabricate historic rollback protection.** **Honoured.** Zero tags created for historic sessions, and zero lightweight tags converted. Both were technically trivial and both were refused: a tag made today protects today, and `git tag -a -f` would stamp today's tagger date onto a rollback point established days ago. EXC-1 and EXC-2 record the absence instead.
- **Never invent missing engineering history.** **Honoured.** `BRAND1_Architectural_Branding`'s missing run file was **not** generated (EXC-4) — a placeholder would satisfy the verifier while recording nothing true. `ARRIVAL1`'s identifier conflict was **not** resolved by guessing (EXC-3).
- **Prefer documented exceptions over false compliance.** **Honoured.** The live repository still reports `2 of 3`, and this report says so in its own summary table rather than presenting the modelled result as the live one.
- **Could this mislead?** The one real risk is the exempt register becoming a place to hide defects. Mitigated three ways: excepted defects print on every run and are never shown as `PASS`; the count is stated in the closing line; and the register itself says a line added without a justifying exception *"is a defect being hidden, which is the one thing this file must never become."*
- No new source of truth: **correct** — the register owns one fact nobody owned. No duplicate ownership · no duplicate state · no application behaviour changed · no deployment behaviour changed: **all correct**.
- Every "verified" claim backed by a command that ran: **YES**

---

## USER ACCEPTANCE EVIDENCE

| Definition of Done | Status | Evidence |
|---|---|---|
| Repository filing conforms | **Committed state: YES. Working tree: NO** | `HEAD` worktree PASSes both loose-file checks; working tree fails on 10 untracked files owned by others (EXC-5) |
| Session completion functions correctly | **YES, proven** | Full `session-new → session-complete` cycle on the compliant model: `CURRENT.md` 0 rows, `INDEX.md` 1 row, marker correctly retained |
| Engineering verification passes | **2 of 3 live · 3 of 3 on a compliant repository** | Rollback protection went FAIL → PASS (0 FAIL). Structure remains blocked by EXC-5 |
| Rollback protection validated | **YES** | 425 PASS · 45 EXC · 0 FAIL; ENGGOV1's own tag verified on all four §2/§6/§7 properties |
| Governance exceptions documented | **YES** | 7 exceptions, 43 sessions, each with a stated reason and named owner |
| No application behaviour changes | **YES** | No file under `client/`, `server/`, `shared/`, `migrations/` touched |
| No deployment behaviour changes | **YES** | `.github/workflows/ci.yml` byte-untouched; nothing added beside the one gate |

---

## SCOPE LOCK

- **Implemented:** the worktree verifier fix; the exceptions register; exception-aware rollback verification; the ENGAUTO1 miscount correction.
- **Explicitly excluded:** ENGAUTO2 · Release Intelligence · Engineering Assistant · Remote Operations — **none begun, designed, or scaffolded.** Also excluded: moving or committing any of the 10 loose files, the 12 untracked run files, the pending `.north3-probe.ts` deletion, or the pending README index edit — all authored by others.

---

## OUTCOME

Engineering Governance now tells the truth about itself and can be verified doing so. The verifier that was unusable in the one place the Operating Manual sends you is fixed. The 45 defects `ENGAUTO1` surfaced are no longer an undifferentiated red wall: 43 sessions carry a written, reasoned, owner-attributed exception, and the verifier distinguishes *accepted* from *unactioned* while still printing every one. Rollback protection reports **0 FAIL** for the first time, and a compliant repository passes all three verifiers with session completion working end-to-end — so what remains between the live tree and a green baseline is precisely and only other people's uncommitted work, now named in EXC-5, EXC-6, and EXC-7. Nothing was invented: not one historic tag was created, not one lightweight tag was silently upgraded, and not one missing run file was generated. The one number this programme got wrong has been corrected in all three places it appeared.

## NEXT STEPS

- Committed locally, **not pushed**. Deployment is a separate approval and nothing here authorises one.
- **The three highest-leverage actions all belong to other authors:** file the 10 loose files (EXC-5 — unblocks all 98 completions), commit the 12 session run files (EXC-7 — makes those sessions recoverable at all), and commit the two pending EXC-6 remedies.
- **One decision remains open for the accountable owner:** EXC-2 — enforce `ROLLBACK_PROTECTION_PROTOCOL` §2's annotated-tag requirement, or relax it to match a practice that diverges from it in 31 of 98 sessions.
- **ENGAUTO2 and all later phases not begun**, per instruction.
