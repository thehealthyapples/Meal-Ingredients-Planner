# ENGAUTO1 — Engineering Automation

**Date:** 2026-07-18
**Branch:** int1-intelligence-platform
**Risk:** 🟢 GREEN
**Reason:** Entirely within `.engineering/`, which structurally cannot ship. Shell and Markdown only; no application file, schema, route, or capability touched; the single deployment gate is not modified.

**THA's engineering protocols were enforced by memory. `session-verify.sh` — the verifier of the `.engineering/` layer boundary — was referenced by the Operating Manual, the README, a protocol and a checklist, and executed by *nothing*: no script, no hook, no CI job. `repo-structure-verify.sh`, its sibling, is executed by both `session-complete.sh` and CI. That asymmetry is not academic: it is exactly how ENGINT1's boundary breach shipped and survived a second workstream. ENGAUTO1 makes the written rules executable — and on its first run against live data it found 45 rollback-protection defects across 98 active sessions, including 12 sessions whose recorded rollback tag does not exist at all.**

---

## FILING DEVIATION — REPORTED

The task specified `docs/implementation/ENGAUTO1_ENGINEERING_AUTOMATION.md`. That is a **loose file at the root of `docs/implementation/`**, which `REPOSITORY_CONVENTIONS.md` §4 forbids and which `repo-structure-verify.sh` fails on today. Filed at `docs/implementation/engineering/` instead, beside `ENGINT1`, `ENGINT2` and `ENGINT1-FIX1`. Precedent: `TIME2` reported the identical deviation and filed by workstream. **Nothing else about the task was altered.**

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/ENGAUTO1-engineering-automation-20260718` → `0eb293d76b4ac03ef09d33143cf496c07c4bb808` |
| Working tree | **Intentionally dirty — ~239 uncommitted entries authored by others**, including a concurrently-live `PROD1_Product_Completion_Programme` session (its run file appeared at 09:55 and `.prod1-verify-user.ts` at 10:07, both during this session). The tag captures committed state only and covers none of it. None was touched, staged, or committed. |
| This task's writes | 2 scripts created, 2 scripts modified, 2 governance documents modified, this report, session run file, `CURRENT.md` |
| Rollback | `git checkout rollback/ENGAUTO1-engineering-automation-20260718` |

---

## ARCHITECTURE COMPLIANCE

Confirmed **before** implementation, not after.

| Constraint | Source | Compliance |
|---|---|---|
| `.engineering/` contains only `.md`, `.sh`, `.gitignore` | `ENGINEERING_BOUNDARIES.md:76` | Two new `.sh` files. No `.ts`, `.js`, `.sql`. Verified by `session-verify.sh` |
| Hooks and scripts touch no database and no network | `session-verify.sh` | Local `git` and filesystem reads only |
| Never an input to `script/build.ts` | `ENGINEERING_BOUNDARIES.md:34-39` | Unchanged — nothing added to the build |
| No application file may reference `.engineering/` | `ENGINEERING_BOUNDARIES.md:31` | No application file touched; verifier green |
| **"There is one gate… Nothing may be added beside it"** | `PRE_DEPLOYMENT_VERIFICATION_GATE.md:14-26` | **Honoured.** `.github/workflows/ci.yml` is byte-untouched. `engineering-verify.sh` is deliberately *not* wired into CI and says so in its own header |
| One owner per fact | `ARCHITECTURE_PRINCIPLES.md` P2 | The new scripts **define no rule**. Every assertion cites the protocol that owns it; `ROLLBACK_PROTECTION_PROTOCOL.md` remains the owner |

**On the one-gate rule specifically.** This was the live risk flagged before the programme began. `engineering-verify.sh` answers *"is the engineering record internally consistent?"* — not *"is this safe to ship?"* It reads only `.engineering/` and `docs/` filing, asserts nothing about the application, gates **session completion** rather than deployment, and is not a CI job. The single deploy gate remains `typecheck · test · build`, untouched.

---

## THE GAP THIS CLOSES

### A verifier nobody runs is documentation

| Verifier | Referenced in | Actually executed by |
|---|---|---|
| `repo-structure-verify.sh` | README, Operating Manual, protocols, checklists | **`session-complete.sh:32-41` and `.github/workflows/ci.yml`** |
| `session-verify.sh` | README:121, `OPERATING_MANUAL.md:32`, `ENGINEERING_SESSION_RECOVERY_PROTOCOL.md:121`, `REPOSITORY_HOUSEKEEPING.md:55`, `ENGINEERING_BOUNDARIES.md:72` | **Nothing.** No script, no hook, no CI job |

**The cost has already been paid.** ENGINT1 (`bc360ba5`) breached the `.engineering/` boundary and completed its session cleanly — because completion checks repository *filing* and never checked the *boundary*. The breach then survived ENGINT2 and was found only by reading, in ENGINT1-FIX1. Five documents told engineers to run a script that no automation ever ran.

### A protocol nothing enforces

`ROLLBACK_PROTECTION_PROTOCOL.md` §1 states *"No implementation may begin until a rollback identifier has been created and reported."* `session-new.sh` accepted the identifier as an **unvalidated string**. A session could be registered against a rollback point that was never created, and nothing would reveal it until the moment it was needed.

---

## IMPLEMENTATION

Six files. No application file touched.

| File | Change |
|---|---|
| `.engineering/scripts/rollback-verify.sh` | **New, 168 lines.** Asserts the Rollback Protection Protocol against the live dashboard: the tag exists, is **annotated** (§2), resolves through `^{commit}` (§2), matches `rollback/<WORKSTREAM>-<slug>-<YYYYMMDD>` (§7), and is **identical in the run file and `CURRENT.md`** (§6). Three modes: all active sessions, one session, one tag. |
| `.engineering/scripts/engineering-verify.sh` | **New, 74 lines.** One command for Operating Manual Steps 2 and 6 — runs all three governance verifiers. Composes existing checks; introduces none of its own. Header states plainly that it is not a deploy gate and must never become one. |
| `.engineering/scripts/session-complete.sh` | **Boundary gate added.** `session-verify.sh` now blocks completion, beside the existing filing gate — same placement, before any state mutation, so a failure completes nothing. This is the change that would have stopped ENGINT1. |
| `.engineering/scripts/session-new.sh` | **Rollback gate added.** Refuses to register a session whose rollback tag does not exist; warns (does not fail) on a lightweight tag. |
| `.engineering/OPERATING_MANUAL.md` | Step 2 and the Quick Reference now call `engineering-verify.sh`. |
| `.engineering/standards/ENGINEERING_BOUNDARIES.md` | §4 documents both new verifiers and restates the not-a-deploy-gate boundary. |

### One deliberate severity split, and why

`rollback-verify.sh` **fails** on a missing, lightweight, or unresolvable tag, but only **warns** on a non-conforming *name*. §7 admits a historic `rollback/before-<name>-<date>` form and states existing tags are never renamed, so failing on those would leave the script permanently red on legitimate history — and `PRE_DEPLOYMENT_VERIFICATION_GATE.md` §4 records what happens then: *"a gate that cannot be satisfied is a gate that gets switched off."*

`session-new.sh` applies the same reasoning one notch tighter: **non-existence is fatal** (§1 forbids starting without protection), a **lightweight tag only warns**. 31 of 98 dashboard sessions use lightweight tags, so hard-failing would block real work on a protocol-versus-practice divergence that is the owner's to settle — see Decision 1 below.

---

## VALIDATION PERFORMED

### The new verifier refuses — proven, not assumed

*"A gate that has never refused anything is a hope, not a control"* (`PRE_DEPLOYMENT_VERIFICATION_GATE.md` §4).

| Case | Result |
|---|---|
| Valid annotated tag | PASS, exit 0 |
| Nonexistent tag | **FAIL, exit 1** |
| Lightweight tag (§2) | **FAIL, exit 1** |
| Malformed name, otherwise valid | WARN, exit 0 — as designed |
| `session-new.sh` with a nonexistent tag | **Refused, exit 1, and created nothing** — no run file, no dashboard row |

Probe tags were deleted immediately; `git tag -d` confirmed.

### The boundary gate refuses — proven end-to-end in an isolated repo

The boundary gate is currently *shadowed* in the real repository: the filing gate fails first (below), so completion never reaches it. Rather than assert it works, it was exercised in a throwaway git repository with clean filing:

| Test | Result |
|---|---|
| A — clean application | Session **completed**, exit 0. The gate does not block legitimate work |
| B — `server/leak.ts` referencing `.engineering` injected | Completion **REFUSED**: *"engineering boundary check failed — session 'GATE2_Probe' NOT completed"* |
| C — state after the refusal | Row still on `CURRENT.md`; **nothing** moved to `INDEX.md` — mutated nothing |

**Test B is the ENGINT1 scenario reproduced.** Had this gate existed, ENGINT1 could not have completed its session. The temp repository was removed.

### Real-repository state

| Command | Result |
|---|---|
| `bash -n` on all 6 scripts and 2 hooks | **All OK** |
| `.engineering/scripts/session-verify.sh` | **exit 0** — boundary green, new scripts conform |
| `.engineering/scripts/engineering-verify.sh` | **exit 1** — boundary PASS; structure FAIL and rollback FAIL, both pre-existing (below) |

### Build

**Not run, and not required.** Operating Manual Step 7 requires a build only if a code file changed. This session changed two shell scripts, two Markdown governance documents, and session records — all inside `.engineering/`, which is not an input to `script/build.ts`. No application file was touched, so the test suites were not re-run either. Stated rather than silently skipped.

---

## WHAT THE AUTOMATION FOUND ON ITS FIRST RUN

`rollback-verify.sh` against the live dashboard: **98 active sessions, 420 PASS, 45 FAIL, 1 WARN.**

| Class | Count | Meaning |
|---|---|---|
| **Rollback tag does not exist** | **12** | These sessions have **no rollback protection whatsoever**. The dashboard records an identifier that was never created |
| Lightweight tag (violates §2) | 31 | Protection exists but carries no author, date, or message |
| Identifier mismatch between run file and dashboard (§6) | 1 | `ARRIVAL1_Arrival_Experience_Prototype` |
| Missing run file | 1 | `BRAND1_Architectural_Branding` |

**The 12 sessions with no rollback protection at all:** `HOUSE5_KITCHEN_EXPERIENCE`, `HOME_ARRIVAL_PRODUCTION_LOCK`, `HOME_FINAL_CONCEPTS`, `INTLANG1_Intelligence_Language_Guide`, `BRAND1_Architectural_Branding`, `ARRIVAL1_Definitive_Home`, `NORTH5_Home_Refinement`, `NORTH4_Home_Concept_Exploration`, `RM2A_Analyser_To_Planner_Journey`, `COOK1_Orchard_Cookbook_Blueprint`, `HOUSE4_Orchard_House_Blueprint`, `VIS1_Orchard_House_Visual_Design_Programme`.

**None of this was fixed.** Remediation is out of scope and is a governance decision — see below.

### Why 98 sessions are sitting on the *active* dashboard

Established by probe, not inference. `session-complete.sh` gates on `repo-structure-verify.sh`, which **fails today** on **10** *(this report originally said 12 — corrected 2026-07-18 by `ENGGOV1`, which established that the two `README.md` files are explicitly permitted: the check reads "README.md index only". The count of actual violations is 9 in `docs/implementation/` + 1 in `docs/investigations/`.)* loose files. Therefore **no session can currently be completed at all** — attempting it on a genuinely finished session returns *"repository structure check failed — session NOT completed."* Sessions accumulate on `CURRENT.md` and the ESR marker never returns to `IDLE`.

The gate is working exactly as DOCGOV1 designed it — drift blocks completion instead of accumulating silently. The drift simply was never cleared, so the block became permanent. The probe mutated nothing (the gate runs before `flock`).

---

## DATA IMPACT

- Reads existing data: **YES** — git tags and `.engineering/` session records, read-only.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

No database, schema, migration, table, or route.

---

## TRUST CHECK

- **Could this mislead the user?** No. Nothing reaches a household; `.engineering/` never ships and has no UI or API.
- **Could this fabricate certainty?** The opposite — it replaces assumed compliance with measured compliance. The 45 defects were invisible before today.
- **Is anything guessed but shown as real?** No. Every check cites the protocol clause it enforces, and the one check that cannot be machine-verified (§6's third location, the prose report) is explicitly excluded in the script's own comment rather than silently claimed.
- **What happens if the system is wrong?** A false FAIL blocks a session completion — recoverable, visible, and never touches production. A false PASS returns the pre-ENGAUTO1 status quo. Both fail safe.
- No architectural duplication introduced: **YES (none)** — the scripts enforce existing protocols and own no rule.
- No new source of truth created: **YES (none)**
- No runtime behaviour altered: **YES** — no application file touched.
- Every "verified" claim backed by a command that ran: **YES**

---

## SCOPE LOCK

- **Implemented scope:** Execute the verifier nothing ran; enforce the Rollback Protection Protocol mechanically; give the Operating Manual's mechanical steps one entry point; document all of it.
- **Explicitly excluded scope:** ENGAUTO2 and every later phase — not begun, not designed, not scaffolded. Remediation of the 45 rollback defects. Filing the 10 loose files. The 29-regression typecheck baseline. Any change to `ci.yml` or the deployment gate.

---

## DECISIONS REQUIRED — STOPPED AND REPORTED, NOT TAKEN

Per instruction, these were surfaced rather than settled.

**1. Protocol versus practice on annotated tags.** §2 requires `-a`; **31 of 98** active sessions use lightweight tags. Either practice should change (and `session-new.sh` should hard-fail) or §2 should be relaxed to match reality. Enforcing a rule three-quarters honoured would block live work; leaving it advisory keeps a canonical clause that is routinely ignored. `session-new.sh` currently **warns**, which is the reversible choice pending a decision.

**2. The 12 sessions with no rollback protection.** They are historic and cannot be retroactively protected — a tag created today would point at today's commit, not the state those sessions began from, and would be **worse than nothing**: protection that looks real and is not. The honest options are to mark them explicitly unprotected on the dashboard, or to complete and archive them with that fact recorded. **Recommend against back-tagging**, for the same reason `HT7` refuses a back-filled week anchor.

**3. Filing the 10 loose files — this one unblocks everything.** It is the single change that would let *any* session be completed again, and it is a filing judgement (which workstream owns each document), not automation. Small, high-leverage, and blocked on nobody.

**4. Should `session-verify.sh` run in CI?** Deliberately **not** done. `.engineering/` never ships, so its boundary is not a shippability question, and adding it would put a non-shipping concern inside the one deploy gate. Recorded because it is the obvious next question, and the answer should be recorded rather than rediscovered.

---

## SUGGESTIONS — NOT IMPLEMENTED

1. `ARRIVAL1_Arrival_Experience_Prototype` records **different** rollback identifiers in its run file and the dashboard (§6 violation). One of the two is wrong; only its author knows which.
2. `BRAND1_Architectural_Branding` has a dashboard row and **no run file**.
3. The 29-regression typecheck baseline at `HEAD` (carried from ENGINT1-FIX1) is still open and still means a PR from this branch goes red on unrelated causes.
4. The `Stop` hook was considered as a home for automatic verification and **rejected**: it runs on every conversational turn and must stay silent and always exit 0. Completion is the correct trigger point.

---

## OUTCOME

THA's engineering rules are now executed rather than remembered. The boundary verifier that five documents told engineers to run — and that no automation had ever run — is a gate on session completion, proven in an isolated repository to refuse the exact breach that shipped in ENGINT1 and to leave state untouched when it does. The Rollback Protection Protocol, previously enforced by nothing, is now asserted against every active session, and reported 45 defects the moment it was first run, including 12 sessions carrying a rollback identifier that does not exist. The Operating Manual's Step 2 is one command instead of three remembered ones. Nothing was added beside the deployment gate, no application file was touched, and the three most consequential findings — the annotated-tag divergence, the unprotected historic sessions, and the 10 loose files that have made session completion impossible — were stopped at and reported rather than decided.

## NEXT STEPS

- Committed locally, **not pushed**. Pushing requires explicit approval; deployment is a separate approval again and nothing here authorises one.
- **Four decisions above are the owner's.** Decision 3 (filing 10 loose files) is the highest-leverage: it restores session completion for all 98 active sessions.
- **ENGAUTO2 was not begun**, per instruction.
- The ~239 uncommitted changes authored by others remain untouched, including a concurrently-live `PROD1` session.
