# Engineering Governance Exceptions

**Status:** Canonical engineering governance record. Established by `ENGGOV1` (2026-07-18).
**Owns:** the **decision to accept** a known governance defect that cannot be repaired honestly — and nothing else.
**Does not own:** session state (that is [`session/CURRENT.md`](./session/CURRENT.md) and [`session/INDEX.md`](./session/INDEX.md)), rollback rules ([`protocols/ROLLBACK_PROTECTION_PROTOCOL.md`](./protocols/ROLLBACK_PROTECTION_PROTOCOL.md)), or filing rules ([`../docs/architecture/REPOSITORY_CONVENTIONS.md`](../docs/architecture/REPOSITORY_CONVENTIONS.md)). Each exception **cites** its owner and restates none of it.

---

## Why this file exists

`ENGAUTO1` made THA's engineering protocols executable, and they immediately
reported defects that had been invisible for months. Some of those defects
**cannot be fixed without inventing history**:

- A rollback tag created today points at **today's** commit, not at the state the
  session began from. Creating one for a 2026-07-17 session produces protection
  that *looks* real and protects nothing — strictly worse than the honest absence,
  because the next engineer would trust it.
- Converting a lightweight tag to annotated stamps **today's** tagger date onto a
  historic rollback point, misrepresenting when the protection was established.

This is the same principle the platform already applies to household data:
`THA_HOUSEHOLD_TIME_ARCHITECTURE.md` **HT7** refuses to back-fill a planner week
anchor, because *"a back-filled anchor is `approxDate` with a schema"*, and 192 of
195 households therefore resolve to `anchored: false` **forever**. The honest
absence is the correct answer, and it is said plainly rather than papered over.

**An exception here is not a backlog item.** It is a recorded decision that the
defect is permanent and accepted, with the reason stated. Where a defect *is*
repairable it does not belong in this file — it belongs in a workstream.

## How to use it

- **Adding** an exception is a governance decision. Record who accepted it and why the honest repair is impossible.
- **An exception is not a licence.** It records a *historic* defect. New work is held to the full protocol; `session-new.sh` enforces the parts that can be enforced at creation time.
- **Review trigger:** when the cited session is archived to `INDEX.md`, or when its owner next opens it.

---

## EXC-1 — 12 sessions carry a rollback identifier that does not exist

**Accepted:** 2026-07-18 (`ENGGOV1`) · **Class:** permanent · **Owner of the underlying facts:** [`session/CURRENT.md`](./session/CURRENT.md)

`rollback-verify.sh` reports 12 active sessions whose recorded rollback tag is
absent from the repository. They therefore have **no rollback protection at all**,
and never will:

`HOUSE5_KITCHEN_EXPERIENCE` · `HOME_ARRIVAL_PRODUCTION_LOCK` ·
`HOME_FINAL_CONCEPTS` · `INTLANG1_Intelligence_Language_Guide` ·
`BRAND1_Architectural_Branding` · `ARRIVAL1_Definitive_Home` ·
`NORTH5_Home_Refinement` · `NORTH4_Home_Concept_Exploration` ·
`RM2A_Analyser_To_Planner_Journey` · `COOK1_Orchard_Cookbook_Blueprint` ·
`HOUSE4_Orchard_House_Blueprint` · `VIS1_Orchard_House_Visual_Design_Programme`

**Why it cannot be repaired.** A tag created now would point at the current commit,
not at the pre-session state. That is not rollback protection; it is a label
asserting protection that does not exist. Per `ROLLBACK_PROTECTION_PROTOCOL` §3,
*"the single most common false sense of safety in this repository"* is believing a
tag covers more than it does — back-tagging would institutionalise exactly that.

**Accepted consequence.** These sessions cannot be rolled back to their starting
state. Their work is recoverable only through ordinary git history.

**What is NOT accepted.** This does not excuse a future session. `session-new.sh`
now refuses to register a session whose rollback tag does not exist (`ENGAUTO1`),
so this class of defect **cannot recur**.

---

## EXC-2 — 31 sessions use lightweight rollback tags

**Accepted:** 2026-07-18 (`ENGGOV1`) · **Class:** permanent for existing tags · **Cites:** `ROLLBACK_PROTECTION_PROTOCOL.md` §2

§2 requires an **annotated** tag (`-a`): *"A lightweight tag carries no author,
date, or message."* 31 of 98 active sessions used lightweight tags.

**Why it cannot be repaired.** `git tag -a -f` at the same commit would preserve
the protected state but stamp **today's** tagger identity and date onto a tag
created days or weeks ago. The commit protection is real either way; the
*provenance* would be fabricated. Given the choice between a weaker true record
and a stronger false one, this repository takes the true one.

**Accepted consequence.** For these 31 tags, who created the rollback point and
when is not recorded and cannot be recovered. The commit each protects is intact
and correct — **the protection works; only its provenance is missing.**

**Open decision, not settled here.** Whether §2 should be enforced going forward
(making `session-new.sh` fail rather than warn) or relaxed to match a practice
three-quarters divergent from it is the accountable owner's call. `ENGAUTO1` left
it as a **warning** deliberately, because that is the reversible choice. Until it
is settled, this exception covers existing tags only.

---

## EXC-3 — `ARRIVAL1_Arrival_Experience_Prototype` records two different rollback identifiers

**Accepted:** 2026-07-18 (`ENGGOV1`) · **Class:** open, owner-resolvable · **Cites:** `ROLLBACK_PROTECTION_PROTOCOL.md` §6

§6 requires the identifier to be **identical** in the run file, the dashboard, and
the report. This session's run file and dashboard disagree.

**Why it is not repaired here.** One of the two is correct and the other is not.
Choosing between them from the outside would be a guess presented as a
correction — and a wrong guess writes a false rollback identifier into the
canonical record, which is worse than a visible disagreement. **Only the session's
author knows which is right.**

**Review trigger:** the author's next visit, or archival to `INDEX.md`.

---

## EXC-4 — `BRAND1_Architectural_Branding` has a dashboard row and no run file

**Accepted:** 2026-07-18 (`ENGGOV1`) · **Class:** open, owner-resolvable

The session is registered on the dashboard but
`session/runs/BRAND1_Architectural_Branding.md` does not exist.

**Why it is not repaired here.** A run file records objective, checkpoints, and
next action. Generating one now would be **invented engineering history** — the
precise failure mode `ENGINT1` was praised for refusing. An empty placeholder
would be equally dishonest: it would satisfy the verifier while recording nothing
true.

*(Distinct from `BRAND1_Brand_Constitution`, a different session that has its own
run file. The two share a prefix only.)*

---

## EXC-5 — Repository filing cannot be restored by anyone but the authors

**Accepted:** 2026-07-18 (`ENGGOV1`) · **Class:** open, blocks session completion repo-wide · **Cites:** `REPOSITORY_CONVENTIONS.md` §4, `OPERATING_MANUAL.md` §2 and §9

`repo-structure-verify.sh` fails on loose files at the roots of
`docs/implementation/` (9) and `docs/investigations/` (1). Because
`session-complete.sh` gates on that verifier, **no session can be completed at
all**, and 98 sessions have accumulated on the active dashboard.

**Why it cannot be repaired by this session.** All 10 files are **untracked** —
every one is uncommitted work authored by other sessions. Verified: the same
verifier run against committed state alone (a clean worktree at `HEAD`) reports
**PASS** on both checks. The repository's *committed* filing is compliant; only
the working tree is not.

> *"If you did not author it, do not touch it and do not commit it."* — `OPERATING_MANUAL` §2
> *"Do not commit work you did not author and have not reviewed."* — §9

`ROLLBACK_PROTECTION_PROTOCOL` §3 compounds it: a tag **cannot capture untracked
files**, so no rollback protection can be created for a move of these documents.

**Owner:** the authoring sessions. Each files its own report into the workstream
folder `REPOSITORY_CONVENTIONS.md` §4 assigns. This is small, mechanical work for
whoever authored each document, and **it unblocks all 98 completions.**

**This exception expires the moment those files are filed.** It records a
blockage, not a permanent state.

---

## EXC-6 — Committed state carries two structural violations, both already remedied uncommitted

**Accepted:** 2026-07-18 (`ENGGOV1`) · **Class:** open, resolves on someone else's commit

Run against `HEAD`, `repo-structure-verify.sh` reports two failures that the
working tree does **not** have, because uncommitted work by other sessions
already fixes them:

| At `HEAD` | Already fixed in the working tree by |
|---|---|
| `.north3-probe.ts` — a stray at the repository root, committed in `a9116faa` | An uncommitted deletion (` D`) authored by another session |
| 3 architecture documents not indexed in `docs/architecture/README.md` — `GOV2_CANONICAL_ALIAS_PRINCIPLE`, `PLATFORM_QUALITY_ARCHITECTURE`, `THA_COMPANION_PLATFORM_ARCHITECTURE` | An uncommitted edit (` M`) to that README |

**The honest summary: the repository is fully compliant in neither state.**
Committed state fails on these two; the working tree fails on EXC-5's loose files.
Every remedy for both sits in uncommitted work belonging to other sessions.

**Why it is not repaired here.** Committing another session's deletion and another
session's README edit is precisely what §9 forbids, and neither was reviewed by
this session.

---

## EXC-7 — 12 session records exist only in the working tree, not in git

**Accepted:** 2026-07-18 (`ENGGOV1`) · **Class:** open, resolves on the authors' commits · **Cites:** `ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`, `OPERATING_MANUAL.md` §9

Found by running `rollback-verify.sh` inside a clean worktree at `HEAD`, where it
reported `run file exists` **FAIL** for 12 sessions that pass in the working
tree. Their run files are **untracked**:

`ADMIN2_Support_Hub_Experience` · `AFI2_Planner_Ambient_Intelligence` · `BRAND1_Brand_Constitution` · `COMP_ACT2_Companion_Action_Surfacing` · `CONV1_Phase_P10_Schema_Coverage` · `FI20_Food_Intelligence_Activation` · `INT20_Natural_Language_Action_Resolution` · `MAT1_Platform_Maturity_And_Trust` · `PROD1_Product_Completion_Programme` · `SUP1_Support_Hub_Foundation` · `SUP2_Steward_Dashboard` · `SUP3_Support_Hub_Checkin`

**Why this matters more than it looks.** The Engineering Session Recovery
Protocol's entire premise is *read `CURRENT.md`, open the run file, continue from
"Next action"*. For these 12 sessions the dashboard row is committed and the
run file it points at **is not in git**. A fresh clone, a CI runner, or any
machine but this one resolves that link to nothing — so the recovery system
cannot recover them. The working tree is currently the only copy.

**Why it is not repaired here.** Committing another session's run file is work
this session did not author and has not reviewed (`OPERATING_MANUAL` §9), and
those sessions are still open — several were active during `ENGAUTO1` and
`ENGGOV1`.

**Owner:** each session's author, by committing its run file. **This exception
expires as they do so.** It is not listed in the exempt register below, because in
the working tree these sessions pass; the defect is in what has been *committed*,
not in what the verifier sees locally.

---

## The exempt register — machine-readable

`rollback-verify.sh` reads the block below and reports these sessions as **EXC**
(acknowledged exception) instead of **FAIL**. Everything not listed here still
fails normally.

**This is an acknowledgement, never an erasure.** The defect is still printed on
every run, still counted, and still labelled. What changes is only that a
*consciously accepted, documented* defect stops being reported as unactioned
work — because a verifier that can never go green is one nobody runs, and
`PRE_DEPLOYMENT_VERIFICATION_GATE.md` §4 records where that ends: *"a gate that
cannot be satisfied is a gate that gets switched off."*

**Adding a line here is a governance act, not a convenience.** It requires an
exception above (EXC-1 … EXC-4) that states why the honest repair is impossible.
A session added here without that justification is a defect being hidden, which
is the one thing this file must never become. Removing a line is always allowed
and needs no justification.

The 43 sessions below are covered by **EXC-1** (no tag exists),
**EXC-2** (lightweight tag), **EXC-3** (identifier mismatch) and **EXC-4**
(missing run file). All predate `ENGAUTO1`; none can recur, because
`session-new.sh` now refuses a session whose rollback tag does not exist.

<!-- EXEMPT:BEGIN — read by .engineering/scripts/rollback-verify.sh. One session ID per line. -->
```
AFI1_Ambient_Food_Intelligence
ARRIVAL1_Arrival_Experience_Prototype
ARRIVAL1_Definitive_Home
BRAND1_Architectural_Branding
COH3_Wire_Coherence_Into_Release_Check
COH4_Enforce_Coherence_In_CI
CONV1_Phase_P2_Gate_Convergence
CONV1_Phase_P4_Household_Person
COOK1_Orchard_Cookbook_Blueprint
DEV1_Diet_Pattern_Launch_Recovery
DOC5_Source_Of_Truth_Path_Corrections
EXP2_Arrival_Experience_Exploration
EXP3_Arrival_Synthesis_Prototypes
EXP4_Materiality_And_Depth
EXP5_One_Home_Many_Places
EXPLANG1A_Experience_Language_Enhancements
EXPLANG1B_Emotional_Palette
HOME1_Arrival_Behaviour_Investigation
HOME2_Canonical_Home_Decision_Model
HOME3_Home_Primary_Action_Implementation
HOME_ARRIVAL_PRODUCTION_LOCK
HOME_FINAL_CONCEPTS
HOUSE4_Orchard_House_Blueprint
HOUSE5_KITCHEN_EXPERIENCE
INT19_Intelligence_Activation
INTLANG1_Intelligence_Language_Guide
LIFE2_Remove_Fabricated_Age_Assumptions
NORTH1_Home_Implementation
NORTH2_Home_Refinement
NORTH3_Home_Reimagined
NORTH4_Home_Concept_Exploration
NORTH5_Home_Refinement
ODL2_Visual_Language_Foundation
OLB1_Orchard_Living_Book
P0_Food_Intelligence_Recovery
PLAN1_Orchard_Planner_Blueprint
RM2A_Analyser_To_Planner_Journey
SURF1A_Existing_Data_Surfacing
SURF1B3_Onboarding_Allergy_Safety_Routing
SURF1C1_Starter_Cookbook_Diet_Classification
SURF1C2_Canonical_Restriction_Matcher_Boundary_Safety
TRANSLATION1_Kept_Room_Into_UI_Language
VIS1_Orchard_House_Visual_Design_Programme
```
<!-- EXEMPT:END -->

---

## History

Established by `ENGGOV1` (2026-07-18) —
[`../docs/implementation/engineering/ENGGOV1_ENGINEERING_GOVERNANCE_RESTORATION.md`](../docs/implementation/engineering/ENGGOV1_ENGINEERING_GOVERNANCE_RESTORATION.md).
Every exception above was found by `ENGAUTO1`'s verifiers on their first run
against live data, having been invisible while the same protocols were enforced
by memory.
