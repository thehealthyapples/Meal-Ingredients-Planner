# CAPBOUND1 — Capability Boundary Assessment — Implementation

**Date:** 2026-07-25
**Branch:** `claude-work`
**Risk:** 🟢 GREEN
**Reason:** Governance documentation only — one new governing document plus three wiring edits. No runtime code, no schema, no asset, no user-facing surface, no deployment.
**Status:** DELIVERED — the standard is governing, indexed, gated and templated. **Awaiting owner review.**

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/CAPBOUND1-capability-boundary-assessment-20260725` → `deb63a13` (annotated, created **before** any file change) |
| Working tree | **Intentionally dirty** — 13 modified tracked files and 12 untracked paths of in-flight **LARDER6** work this task did not author. None of it was touched, staged, or committed. |
| What the tag does **not** cover | Uncommitted modifications to tracked files, and untracked files. Per `ROLLBACK_PROTECTION_PROTOCOL.md` § 3. |
| Pre-task dirty-tree snapshot | `0eb242d0` (`git stash create`) — captures the **tracked** modifications only. **The untracked LARDER6 files are captured by neither the tag nor the snapshot.** |
| This task's writes | `docs/architecture/CAPABILITY_BOUNDARY_ASSESSMENT.md` (new) · `docs/architecture/README.md` · `docs/architecture/ENGINEERING_WORKFLOW.md` · `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` · `.engineering/session/runs/CAPBOUND1_Capability_Boundary_Assessment.md` (new) · `.engineering/session/CURRENT.md` · this report |
| Rollback to committed state | `git checkout rollback/CAPBOUND1-capability-boundary-assessment-20260725 -- docs/architecture .engineering/templates` then delete the two new files |

> The one pre-existing modification to `.engineering/session/CURRENT.md` at the time of tagging was the **automatic Stop-hook heartbeat line** (`2026-07-24T23:02:25Z` → `23:21:59Z`) — a mechanical stamp, not authored work. It is carried in this commit because it is inseparable from the same file; it is disclosed here rather than absorbed silently.

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` (Architecture Bootstrap, `STEP 2` — read in full before any change)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight principles; Principle 6 is this document's spine)
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` (`STEP 1`–`STEP 9`, all compliance blocks, the Completion Gate)
- [x] `docs/architecture/REPOSITORY_CONVENTIONS.md` (§ 1–§ 4 — filing and the workstream vocabulary)
- [x] `docs/architecture/LIVING_LARDER_IMPLEMENTATION_CONSTITUTION.md` § 2 (the STOP rule — the nearest existing owner)
- [x] `docs/architecture/THA_CRAFTSMANSHIP_CONSTITUTION.md` (`CRAFT1` — the design method; architecture owns the design)
- [x] `.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md` · `.engineering/protocols/ENGINEERING_SESSION_RECOVERY_PROTOCOL.md`
- [x] `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`
- [x] `docs/implementation/pantry/LARDER_PRODUCTION_ASSET_GENERATION.md` (the boundary handled **well** — cited as evidence)
- [x] `.engineering/session/runs/LARDER6_North_Star_Implementation.md` (the boundary handled **badly** — cited as evidence)

---

## THE GAP THIS CLOSES

THA's canon already forbade the two dishonest ways an implementation can end — silent approximation (`LARDER4` § 2) and invented fact (Principle 6). No document owned what must *happen* at the stop:

> **When an implementation cannot be completed, whose limitation is it, how much of the work should already be finished, and what exactly must the report say?**

The cost is recorded in this repository, not argued abstractly:

- **Handled well:** `LARDER_PRODUCTION_ASSET_GENERATION.md` § 1 — *"this environment has no photographic or AI-image generation capability"* — medium disclosed, artefacts labelled candidates, aesthetic verdict routed to the Home Owner, and everything not needing the missing capability **finished**. One session invented that standard because none existed.
- **Handled badly:** the `LARDER6` run file — *"the prior session stalled on whether the room could be built at all without new photographic assets. Resolved on the Home Owner's instruction (2026-07-25): it can, and it is to be."* A full stop, on a boundary that was never an architecture question, costing the Home Owner's time to establish that the room was buildable from assets that already existed.

Two failure modes, with different costs. **Misattribution** invites an amendment to a document that was never wrong — and a canon amended to accommodate a tool is a canon weakened permanently, long after the tool has changed. **Premature stopping** halts work that never depended on the boundary.

---

## IMPLEMENTATION

### Files created

| File | What it is |
|---|---|
| `docs/architecture/CAPABILITY_BOUNDARY_ASSESSMENT.md` | The new governing document (`CAPBOUND1`) — 12 sections |
| `.engineering/session/runs/CAPBOUND1_Capability_Boundary_Assessment.md` | Session record |
| `docs/implementation/architecture/CAPBOUND1_CAPABILITY_BOUNDARY_ASSESSMENT.md` | This report |

### Files changed

| File | Change |
|---|---|
| `docs/architecture/README.md` | Indexed in the **Platform Governance** table; full descriptive block added before *Intelligence Governance*; **CAPABILITY BOUNDARY COMPLIANCE** added to the § Compliance list |
| `docs/architecture/ENGINEERING_WORKFLOW.md` | New **CAPABILITY BOUNDARY COMPLIANCE** block; new **Implementation Completion Report** mandatory section in `STEP 5`; new **Completion Gate item 5** in `STEP 9` (subsequent items renumbered 6–8); the stale *"all eight sections"* count corrected |
| `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` | Two new sections — the compliance block pointer and the copyable **Implementation Completion Report** |

### What the document establishes

**The Attribution Test** — one mechanical question, asked before anything else:

> *If a different implementer — with this same repository, this same governing architecture, and this same approval state — sat down right now, would this item still be blocked?*
> **YES** → the project's boundary. **NO** → the implementer's boundary.

It is mechanical on purpose: the failure it prevents is one of *framing*, not of honesty. It feels accurate to write *"the architecture requires photographic assets that cannot be produced"* when the true sentence is *"the specification is complete; this tool cannot produce photographs."* The first points at THA; only the second produces the right next action.

**The five classifications** — the four project kinds partition what a project can lack (an answer · code · an artefact · something outside itself); the fifth is what the implementer can lack:

| Classification | Blocks the remaining scope? | Recommended capability |
|---|---|---|
| **Architecture Gap** | **Yes** — building past it invents an owner | *Architecture decision required* |
| **Repository Gap** | **Almost never** — it *is* the work | *Continue implementation* · *Extend repository assets* |
| **Asset Gap** | Only the surfaces needing it | *Generate governed asset using ChatGPT Image Generation* · commission · photograph |
| **External Dependency** | **Yes** for the dependent items | Named party + named act |
| **Model Capability Gap** | Only the items needing it | The narrowest tool that closes it |

**The Stop Test** — *is there any remaining work that does not depend on this boundary?* If yes, it is not time to stop. This fixes the ordering: **classify → complete everything unblocked → then report.**

**The Implementation Completion Report** — six declarations, each with evidence (Architecture Complete · Engineering Complete · Interaction Complete · Existing Assets Used · New Assets Required · Remaining Gaps), and **five mandatory fields on every gap**: classification (with its evidence) · reason · impact (household first) · recommended next action · recommended capability. A full completion still files it, with Remaining Gaps **NONE**.

**Twelve rules `CB1`–`CB12`**, of which the load-bearing ones are `CB3` (no misattribution), `CB4` (no silent substitution — a placeholder is lawful only when **declared**), `CB5` (the architecture is never compromised for convenience or for a capability limitation), `CB6` (maximum completion first; *excluded scope* is never filed as a *remaining gap*), `CB7` (the smallest next action), `CB9` (an externally-produced artefact enters through `ASSET1` · `LHDC1` · candidate → checksum → recorded approval · Home Owner approval, **entirely unchanged**), and `CB10` (**a Model Capability Gap creates no amendment, no exception, and no permanent gap in the canon**).

### Three decisions worth recording as decisions

1. **The naming collision was resolved rather than ignored.** THA already uses *"capability boundary"* for TIP's **runtime authorisation** boundary (`THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` § 6 — the role→intent allow-list enforced by `server/lib/access.ts`). That meaning is **untouched and remains solely TIP's**. This document owns *"Capability Boundary Assessment"* and nothing shorter, concerns the capabilities of **the implementer of THA** rather than what any role may invoke **inside** it, and **can never authorise anything** (§ 1.2). Left unstated, a reader would eventually have taken one document's rule for the other's.

2. **`LARDER4` § 2 was not amended, and was not generalised in place.** It keeps the **trigger** for the Larder build, byte-untouched; this document owns the **content** of the stop — the classification and the report. One owns *when*, one owns *what*. Amending `LARDER4` to be platform-wide would have moved a room's law to the platform and made the Larder's own document the owner of everyone's practice.

3. **Three things are explicitly named as *not* capability boundaries** (§ 1.3), because each has an owner and misfiling them here would create a second one: **excluded scope** (`RISK_AND_SCOPE_STANDARD.md`), a **defect** (the owning workstream), and **difficulty** (`LARDER4` § 2 · `CRAFT1` § 3). The distinction between excluded scope and a remaining gap is stated as a rule (`CB6`) because a boundary filed as scope is never classified — which is exactly how a tool's limitation becomes THA's on the record.

---

## ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  No entity is touched. The one term coined — "Capability Boundary Assessment" —
  is held in one place and explicitly distinguished from TIP's runtime
  "capability boundary" (§ 1.2), which is untouched.

☑ One owner per fact
  This document owns exactly three things: the classification, the report shape,
  and CB1–CB12. Every other concern is cited to its owner (§ 1 table). The STOP
  trigger stays LARDER4 § 2's for the Larder; the gates stay
  ENGINEERING_WORKFLOW.md's; the scope vocabulary stays
  RISK_AND_SCOPE_STANDARD.md's; the session fields stay the recovery protocol's.

☑ No duplicate entities
  No store, register, table, or file of record created.

☑ No duplicate ownership
  No attribute or rule is given a second owner. The three wiring points INVOKE
  CB1–CB12 and deliberately do not restate them.

☑ No duplicate state
  No state of any kind. Governance documentation only.

☑ Extends existing architecture
  Uses ENGINEERING_WORKFLOW.md's existing gate pattern — a named compliance
  block + a STEP 5 section + a Completion Gate item + a template section — the
  identical mechanism PKR2, PX1-W5 and ARCH-VERIFY1 each used. No new workflow.

☑ Progressive enrichment where appropriate
  N/A — no knowledge entity, no transactional state.

☑ Knowledge domain compliance
  N/A. Engineering practice, not a knowledge domain: it publishes no fact about
  food, nutrition, a recipe, a household, or the product. No row in
  PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md § 1.1 created or extended.

☑ Honest gaps over fabricated information
  The document IS this principle applied to the report about the work (CB12).
  Its own enforcement gap — no script can verify an honest Attribution Test —
  is DISCLOSED in the document (§ 10) and in the workflow block, in the Rule KC8
  sense, on the day the standard is created.

☑ No permanent synchronisation bridge
  None. The rules exist once. A copy of CB1–CB12 in ENGINEERING_WORKFLOW.md or
  the template would be exactly the second owner Principle 2 forbids.

☑ Evolution over replacement
  Nothing replaced or retired. LARDER4 § 2 remains in force, byte-untouched.
```

---

## AI ARCHITECTURE COMPLIANCE

**Not applicable — and stated rather than skipped, because the subject matter invites the opposite conclusion.** This document concerns the *implementer* of THA, not THA's Intelligence. It touches no capability, registry, intent, prompt, Context View, conversation state, or model call; creates no assistant; the Companion neither reads it nor is affected by it; and **no runtime code reads it.** It grants no permission and authorises nothing — `server/lib/access.ts` remains the sole authority on who anyone is, and the Capability Registry the sole authority on what may be invoked.

---

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

**Not applicable.** No user-facing surface, route, component, token, string, colour, motion value, or behaviour is created or changed. A household cannot perceive this document's existence. It is subordinate to **GEA20** in one direction only — it exists to protect the downward flow of authority from architecture to implementation — and it **originates no experience law.**

---

## PRODUCT REGISTRY IMPACT

```
PRODUCT REGISTRY IMPACT
=======================
Registry affected: NO

A person's answer to "what is THA?" is unchanged. This governs how THA is
built, not what it is. No user-facing surface, route, capability, setting,
claim, or journey is created, changed, or retired.

Entries created:   NONE
Entries updated:   NONE
Entries retired:   NONE
Any entry set to `public` or `household`: N/A
Product knowledge written into a prompt, template, fallback string, fine-tune,
or capability code: NO   (Rule PKR27)
```

---

## ADOPTION REGISTER IMPACT

**Register affected: NO.** No component, hook, token, utility class, or shared client pattern is created, adopted, or retired. `npm run adoption:check` was not required by this change and its state is unchanged.

---

## DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: NONE
Declared SoT: N/A — no data domain is touched
New store created? NO
Existing store extended? NO
Consumer created? NO
```

---

## ARCHITECTURE CONVERGENCE STATUS

**Not applicable** — 🟢 GREEN, not a 🔴 RED architectural convergence. No domain, owner, duplicate state, or duplicate workflow is involved.

---

## VALIDATION PERFORMED

| Command | Outcome |
|---|---|
| `bash .engineering/scripts/repo-structure-verify.sh` | **11 PASS · 0 FAIL** — *"Repository structure is clean."* Includes check #7, *every architecture document indexed in README.md*, which the new document must satisfy and does |
| `bash .engineering/scripts/engineering-verify.sh` | Repository structure **PASS** · Engineering boundary **PASS** · Rollback protection **FAIL (pre-existing)**. This session's own five checks are **5/5 PASS** (run file exists · identifier identical in run file and dashboard · tag exists · tag is annotated · resolves to a commit `deb63a13`) |
| `npm run verify:coherence` | **2 FAIL — both pre-existing and both in `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`**, a file this change does not touch: Domain 34 declares no Authoritative Source row (COH-1), and line 542 cites `pantry-intelligence-assembler.ts:140`, which does not exist (COH-2). 115 file:line citations across 63 governing documents were checked; the new document adds no file:line citation and introduced no failure |
| Citation existence check | Every path cited by the new document was verified to exist on disk (11 of 11), and every anchor spot-checked (`KC8`, TIP § 6, `LARDER1`'s non-drag equivalence) |
| Build / typecheck | **Not run, deliberately.** No `.ts`, `.tsx`, `.css`, schema, or configuration file was touched — only Markdown. Running them would prove nothing about this change and would report the repository's pre-existing baseline as though it were a result |

**Pre-existing failures, distinguished.** `engineering-verify.sh` reports **8** rollback-protection failures — `HOSP1`, `HOMEROOM1`, `PRESENCE2`, `KNOW1`, `EXP3_Living_Home_Asset_System`, `LARDER_ASSET_GOVERNANCE_FOUNDATION`, `LIVING_LARDER_PRODUCTION_IMPLEMENTATION`, `LARDER_PRODUCTION_ASSET_GENERATION` — every one belonging to an **earlier session** (lightweight tags, or a tag that no longer exists). **This change introduces none of them and repairs none of them**; repairing another session's tag is outside this task's scope and would rewrite its rollback record.

---

## DEFINITION OF DONE

- **What success looks like:** the Capability Boundary Assessment is governing THA engineering architecture and is **reachable by anyone following the workflow** — indexed in the Architecture Bootstrap, gated in `ENGINEERING_WORKFLOW.md`, and templated in the implementation template, so every future implementation can reuse it without being told it exists. ✅
- **What must not break:** no runtime behaviour, no schema, no user-facing surface, no existing governing rule; `repo-structure-verify.sh` stays green; no governing document is amended except by the three deliberate wiring edits. ✅
- **Manual test steps:** (1) `bash .engineering/scripts/repo-structure-verify.sh` → 11 PASS; (2) open `docs/architecture/README.md` → the document appears in the Platform Governance table, has a descriptive block, and appears in § Compliance; (3) open `docs/architecture/ENGINEERING_WORKFLOW.md` → **CAPABILITY BOUNDARY COMPLIANCE** exists, `STEP 5` carries the **Implementation Completion Report** section, and `STEP 9`'s Completion Gate carries item 5; (4) open `.engineering/templates/IMPLEMENTATION_TEMPLATE.md` → the copyable report block is present. ✅

---

## DATA IMPACT

- Reads existing data: **NO** (repository documents only)
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**
- Database writes: **NONE**

---

## TRUST CHECK

- **Could this mislead the user?** No — a household never encounters it. Its purpose is to stop the *owner* being misled about the state of the work.
- **Could this fabricate certainty?** No. It forbids one specific fabrication — a confident claim that THA is the reason something stopped — and requires evidence for every classification.
- **Is anything guessed but shown as real?** No. Where a classification is unclear, § 3 requires looking rather than guessing; § 10 discloses that no script can verify an honest answer.
- **What happens if the system is wrong?** A misclassification is a recorded finding, corrected in the change that discovers it (§ 3). The worst case is a boundary attributed to the wrong side — which this document makes visible and correctable rather than invisible and permanent.
- No architectural duplication introduced: **YES** (none)
- No new source of truth created: **YES** (one document owns three things; every other concern is cited)
- No runtime behaviour altered: **YES** (governance only)
- Every "verified" claim backed by a command that ran: **YES** — and the one gate not run (build/typecheck) is named, with the reason

**The One Question** (`THA_BRAND_CONSTITUTION.md`, cited). *Does this leave the household with less to carry?* Indirectly and genuinely: rooms get **finished** to the last independent item rather than stopped at the first boundary, and a boundary is closed by the smallest correct act instead of by an amendment to the architecture that produced the house. *Could they trust everything it tells them?* This protects exactly that — a house built by a process that quietly downgrades the design when the design is inconvenient (`CB5`), or substitutes an unsuitable asset without saying so (`CB4`), is a house whose every other claim is a little less believable. `LARDER5` states it in its own domain — *a room that lies about its own light will not be believed about a household's allergens* — and this is the same reasoning applied to the act of building.

---

## ROLLBACK PLAN

- **Rollback identifier:** `rollback/CAPBOUND1-capability-boundary-assessment-20260725` → `deb63a13`
- **Files modified:** `docs/architecture/README.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `.engineering/templates/IMPLEMENTATION_TEMPLATE.md`, `.engineering/session/CURRENT.md`
- **Files created:** `docs/architecture/CAPABILITY_BOUNDARY_ASSESSMENT.md`, `.engineering/session/runs/CAPBOUND1_Capability_Boundary_Assessment.md`, this report
- **Rollback commands:**
  ```bash
  git checkout rollback/CAPBOUND1-capability-boundary-assessment-20260725 -- \
    docs/architecture/README.md \
    docs/architecture/ENGINEERING_WORKFLOW.md \
    .engineering/templates/IMPLEMENTATION_TEMPLATE.md
  git rm docs/architecture/CAPABILITY_BOUNDARY_ASSESSMENT.md \
         docs/implementation/architecture/CAPBOUND1_CAPABILITY_BOUNDARY_ASSESSMENT.md \
         .engineering/session/runs/CAPBOUND1_Capability_Boundary_Assessment.md
  # remove the CAPBOUND1 row from .engineering/session/CURRENT.md
  ```
  **Do not** `git reset --hard` to the tag: the in-flight LARDER6 work in the working tree would be destroyed.
- **Verification after rollback:** `bash .engineering/scripts/repo-structure-verify.sh` returns 11 PASS (check #7 passes again because the unindexed document no longer exists).

---

## SCOPE LOCK

- **Implemented scope:** the Capability Boundary Assessment and its five classifications; the Attribution Test and the Stop Test; the Implementation Completion Report and its six declarations; the five required fields on every gap; `CB1`–`CB12`; the six anti-patterns; the three wiring points; the architecture index entry; the session record; this report.
- **Explicitly excluded scope:** no automated verifier (disclosed in § 10 as a known gap, not silently omitted); no amendment to `LARDER4`, `CRAFT1`, `HOMEOWNER1`, `ASSET1`, `LHDC1`, or any Experience Governance document — all byte-untouched; no change to the risk/scope vocabulary or the session recovery protocol's fields; no retro-fitting of the new report onto past implementation reports; no repair of the 8 pre-existing rollback-protection failures belonging to other sessions; no new workstream folder; no runtime code, schema, migration, route, capability, asset, token, component, string, or business logic; **no deployment.**

**SUGGESTION** *(not implemented — do not action without approval):*
1. **A structural check is cheap and would be honest about its own limit.** A verifier asserting that every implementation report under `docs/implementation/` contains an `IMPLEMENTATION COMPLETION REPORT` heading, and that each gap block carries all five field labels, would catch the *vague handover* mechanically while making no claim about the truthfulness of a classification. It converts one of § 10's two enforcement halves from prose into a gate.
2. **8 pre-existing rollback-protection failures** (lightweight or missing tags across earlier sessions) keep `engineering-verify.sh` red, which means the one signal that would catch a *new* rollback defect is already failing. Worth a small dedicated session.
3. **The `LARDER6` session has a run file but no row in `CURRENT.md`** — it is invisible to the recovery dashboard and to `engineering-verify.sh`. Not touched here because it is another session's live record.

---

## IMPLEMENTATION COMPLETION REPORT

*(Filed under this document's own standard — `CAPABILITY_BOUNDARY_ASSESSMENT.md` § 7.1.)*

```
IMPLEMENTATION COMPLETION REPORT
================================

Architecture Complete:   YES
  Governing documents bound:
    ARCHITECTURE_PRINCIPLES.md (all eight; Principle 6 is the spine) ·
    ENGINEERING_WORKFLOW.md (STEP 1/2/3/5/9, the compliance blocks) ·
    REPOSITORY_CONVENTIONS.md (§ 1–§ 4 filing) ·
    CRAFT1 (design method) · GEA20 (downward authority) ·
    HOMEOWNER1 (recorded approvals) · LARDER4 § 2 (the STOP trigger) ·
    ROLLBACK_PROTECTION_PROTOCOL.md · ENGINEERING_SESSION_RECOVERY_PROTOCOL.md
  Rules satisfied:
    Rollback taken and reported BEFORE any change (STEP 1) — tag deb63a13 ·
    Architecture Bootstrap read in full before writing (STEP 2) ·
    Filed by workstream in docs/implementation/architecture/ (conventions § 3) ·
    Indexed in docs/architecture/README.md (conventions § 3; verifier check #7) ·
    Restate-no-rule held: every cited concern is a citation, and the three
      wiring points invoke CB1–CB12 without copying them ·
    Every cited path verified to exist (11/11)
  Rules NOT satisfied: NONE

Engineering Complete:    YES
  Commands run and outcome:
    repo-structure-verify.sh          → 11 PASS · 0 FAIL
    engineering-verify.sh             → this session 5/5 PASS;
                                        8 pre-existing failures, all other sessions
    npm run verify:coherence          → 2 FAIL, both pre-existing, both in a file
                                        this change does not touch
    citation existence check          → 11/11 paths exist; anchors spot-checked
  Gates not run, and why:
    npm run build / npx tsc --noEmit  → not run. Markdown-only change; no .ts,
                                        .tsx, .css, schema or config touched.
                                        Running them would report the
                                        repository's pre-existing baseline as
                                        though it were a result.
  Pre-existing failures:
    8 rollback-protection failures (lightweight/missing tags: HOSP1, HOMEROOM1,
    PRESENCE2, KNOW1, EXP3_Living_Home_Asset_System,
    LARDER_ASSET_GOVERNANCE_FOUNDATION,
    LIVING_LARDER_PRODUCTION_IMPLEMENTATION,
    LARDER_PRODUCTION_ASSET_GENERATION) + 2 coherence failures
    (SoT Register Domain 34; SoT Register:542 stale file citation).
    None introduced here; none repaired here.

Interaction Complete:    YES
  Interactions exercised:
    This is governance with no runtime surface, so "reachable" means reachable
    by a person following the workflow. All four reading paths were opened and
    confirmed after the edits: (1) the Architecture Bootstrap README table and
    § Compliance list; (2) ENGINEERING_WORKFLOW.md's CAPABILITY BOUNDARY
    COMPLIANCE block; (3) STEP 5's Implementation Completion Report section;
    (4) STEP 9's Completion Gate item 5 and the template's copyable block.
  Reachable but unproven: NONE

Existing Assets Used:
  ENGINEERING_WORKFLOW.md's existing gate pattern (compliance block + STEP 5
  section + Completion Gate item + template section — the PKR2 / PX1-W5 /
  ARCH-VERIFY1 mechanism, reused rather than reinvented) · the architecture
  README index · the existing implementation-report template · the session
  recovery files and scripts · repo-structure-verify.sh / engineering-verify.sh
  / verify:coherence as the verification gates · the existing rollback protocol.
  Nothing new was authored where an existing owner already held the concern.

New Assets Required:     NONE
  No artwork, photography, illustration, font, dataset, or media of any kind is
  required by this change or by the standard it establishes.

Remaining Gaps:          1 gap

  GAP 1 — No automated verification of the assessment
    Classification:      Repository Gap
      Evidence:          No script under scripts/ci/ or .engineering/scripts/
                         inspects implementation reports for the Completion
                         Report section or the five per-gap fields. The
                         structural half of this is buildable today with the
                         existing verifier patterns; the semantic half is not
                         buildable by anyone.
      Attribution Test:  YES — a different implementer, with this repository and
                         this architecture, would face the identical gap. It is
                         the project's, not the tool's.
    Reason:              Deliberately out of this task's scope, which is
                         architecture ("This is an architecture task. This is
                         not an implementation."). The gap is disclosed in the
                         document itself (§ 10) rather than left to be
                         discovered, in the Rule KC8 sense — a rule that lives
                         only in prose is a hope, not a guarantee.
    Impact:              Household: NONE — no household-visible effect, now or
                         later. Platform: the CAPABILITY BOUNDARY COMPLIANCE
                         block is enforced by discipline rather than by a gate,
                         the same class as the Trust Check. The *vague
                         handover* anti-pattern is catchable mechanically and
                         is currently not caught.
    Recommended next action:
                         A single structural verifier: assert every report
                         under docs/implementation/ contains an
                         "IMPLEMENTATION COMPLETION REPORT" heading, and that
                         each gap block carries all five field labels. It must
                         claim nothing about whether a classification is
                         *true* — that half is permanently unverifiable by a
                         machine and stays disclosed.
    Recommended capability to complete it:
                         Continue implementation (a scripts/ci verifier in the
                         existing style; no new capability of any kind needed)

Stop Test:               NO remaining work independent of this gap was left
                         unattempted. The document is written, indexed, gated
                         at two points, templated, verified, and reported; the
                         one gap is an explicitly excluded implementation task
                         with a named next action.
```

**Note on this section.** It is filed here as the first use of the standard it establishes, which is also the first honest test of it: the assessment produced exactly one gap, classified it as the **project's** (a Repository Gap) rather than the implementer's, and named a next action a subsequent session can perform with no new capability. Had that gap been recorded as *"verification not possible"*, it would have been the **Blamed Architecture** anti-pattern in the very document that names it.

---

## OUTCOME

**What is now true that was not true before.** THA has a governing standard for the one moment its canon had never governed: the moment an implementation cannot go further. Before this change, that moment was answered by whichever session reached it — well once (`LARDER_PRODUCTION_ASSET_GENERATION`, which had to invent the wording) and badly once (`LARDER6`, which stopped in full on a boundary that was never THA's and cost the Home Owner's time to clear). From now on the moment has a fixed shape: **finish everything that does not depend on the boundary, classify what remains against the Attribution Test, name whose limitation it is, and recommend the smallest act and narrowest capability that closes it.**

The single sentence it enforces is the one the mission asked for: **a limitation of the tool implementing THA is never reported as a limitation of THA** — and its corollary, which matters just as much, is that a Model Capability Gap never becomes a reason to amend, weaken, or partially apply the approved architecture. A canon amended to accommodate a tool is weakened permanently, long after the tool has changed.

It is **reachable**, which is the difference between a standard and a preference: indexed in the Architecture Bootstrap, gated in `ENGINEERING_WORKFLOW.md` at both a compliance block and the Completion Gate, and copyable from the implementation template. `ARCH-VERIFY1` recorded what the alternative looks like — two governance checklists that declared themselves binding while the workflow had never referenced either, *"leaving both checklists unreachable by anyone actually following the workflow."*

---

## NEXT STEPS

1. **Owner review** of the standard — in particular the five classifications, and whether *Repository Gap* should ever be permitted as a stopping boundary (this document says it is *"almost never"*, and names the only two circumstances, both of which are really something else wearing its clothes).
2. **The one remaining gap** (above): a structural verifier for the Completion Report section. Classified **Repository Gap**; recommended capability *Continue implementation*; requires approval as a separate scoped task.
3. **Committed and pushed to `claude-work` only. Not deployed** — deployment requires explicit, separate approval and was not requested.
4. **Uncommitted work remains in the tree:** the in-flight **LARDER6** changes (13 modified tracked files, 12 untracked paths), untouched by this session and still awaiting that session's own completion.
