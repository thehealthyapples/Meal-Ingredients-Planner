# THA ENGINEERING WORKFLOW

**Adopted:** 2026-06-25
**Amended:** 2026-07-10 (`EOM1`) — see *Document ownership* below.
**Supersedes:** `docs/change-control.md` is unchanged — this document adds architecture governance on top of it.
**Governing document:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`

---

## Document ownership (amended under EOM1, 2026-07-10)

This document is **Application Governance**. It answers: *is this change
architecturally correct?* It is the canonical home of the **Architecture
Compliance Checklist**, the **AI Architecture Compliance** block, **Domain Impact**,
the **Trust and Claims hard stops**, and **Architecture Convergence Status**. These
remain governing and are unchanged.

The **process** of an engineering session — how to take rollback protection, open
and resume a session, verify, build, review, commit, push, and deploy — is
**Engineering Governance** and is now owned by
[`.engineering/OPERATING_MANUAL.md`](../../.engineering/OPERATING_MANUAL.md).

Neither document restates the other. The Operating Manual tells you *when* to run
the checklist below; this document tells you *what it contains*. Step headings and
numbers here are unchanged, so every existing citation of `STEP N` remains valid.

---

## EVERY SIGNIFICANT IMPLEMENTATION MUST FOLLOW THIS WORKFLOW

Steps 1–3 are mandatory before any implementation begins. Steps 4–7 govern the implementation itself.

---

## STEP 1 — ROLLBACK PROTECTION (before anything else)

**Process owner:** [`.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md`](../../.engineering/protocols/ROLLBACK_PROTECTION_PROTOCOL.md)
— how to create, resolve, record, and use a rollback tag, and what a tag does
*not* protect.

The governing rule, unchanged:

**No implementation may begin until the rollback identifier is created and reported.**

---

## STEP 2 — ARCHITECTURE BOOTSTRAP (read the governing architecture)

Before any significant investigation, recommendation or implementation, read the canonical architecture entry point:

- **`docs/architecture/README.md`** — the single canonical index of the governing architecture.

The documents referenced by that README are the **governing architecture** for The Healthy Apples. Every proposal and implementation must comply with the governing architecture. This always includes, at minimum:

- `docs/architecture/ARCHITECTURE_PRINCIPLES.md` (the eight governing principles)
- `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (domain ownership register)

**For any user-facing implementation, it additionally always includes:**

- `docs/architecture/THA_EXPERIENCE_ARCHITECTURE.md` (how THA behaves and feels — **prevails over UI in any conflict**)
- `docs/architecture/THA_UI_ARCHITECTURE.md` (how THA looks)
- `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (what THA *is* — and the registry this change must keep true)

These are required reading. Do not proceed until the README and its governing documents have been read.

**If any proposed change conflicts with the governing architecture: STOP. Explain why. Do not continue until approved.**

---

## STEP 3 — ARCHITECTURE COMPLIANCE CONFIRMATION

Complete the mandatory Architecture Compliance Checklist before implementation begins (see below).

If any item fails, implementation must stop and explain why before proceeding.

---

## STEP 4 — DECISION-GATED WORKFLOW

*(From `docs/change-control.md` — unchanged.)*

- Break work into one decision at a time.
- Present only ONE decision per response.
- Wait for explicit approval before the next decision.
- Do not generate implementation until all decisions are approved.

**Process owner:** [`.engineering/OPERATING_MANUAL.md`](../../.engineering/OPERATING_MANUAL.md)
Step 5 (Implement) and [`.engineering/standards/RISK_AND_SCOPE_STANDARD.md`](../../.engineering/standards/RISK_AND_SCOPE_STANDARD.md)
— risk rating, scope lock, and the handling of out-of-scope discoveries.

---

## STEP 5 — MANDATORY SECTIONS IN EVERY IMPLEMENTATION DOCUMENT

### Document location (file it by workstream — before writing a word)

Every report is filed by **workstream**, never at a folder root. The workstream
vocabulary and its rules are governed by
[`REPOSITORY_CONVENTIONS.md`](./REPOSITORY_CONVENTIONS.md) §4 and are **identical**
for both trees:

- An **investigation / audit / assessment / root-cause analysis** →
  `docs/investigations/<workstream>/<EWO_ID>_<SUBJECT>.md`
- An **implementation report** (has a Rollback Identifier + Changes Made) →
  `docs/implementation/<workstream>/<EWO_ID>_<SUBJECT>.md`

Pick the `<workstream>` from the table in `REPOSITORY_CONVENTIONS.md` §4
(`intelligence`, `knowledge`, `benchmarking`, `cookbook`, `planner`, `ux`,
`platform`, `governance`, `engineering`, `admin`, `development_world`). If a
report does not fit an existing folder, place it in the closest one rather than
creating a folder of one; materialise a new workstream folder only when a document
genuinely needs it. **Never** write a report to a folder root (`docs/implementation/`
or `docs/investigations/`) or to the repository root — the only file permitted at
either root is that tree's index `README.md`. This is enforced by
`.engineering/scripts/repo-structure-verify.sh`; run it after filing.

Every workstream implementation document must contain all seven sections:

### Architecture Compliance
*(See checklist below — copy and complete it.)*

### Definition of Done
- What success looks like
- What must not break
- Manual test steps

### Product Registry Impact
*(Added under `PKR2`, 2026-07-11. Mandatory for every **user-facing** implementation. Governed by [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md), and — since `PKR3` — by [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](./PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) §9, which makes **Product Knowledge** a first-class platform knowledge domain and the registry its canonical owner.)*

The test is one question: **would a person's answer to "what is THA?" be different after this change?** If yes, the Product Knowledge Registry is stale until updated — and updating it is part of *this* change, not a follow-up.

**Why this is a Definition of Done item and not a documentation chore (PKCA Rule KC15):** Product Knowledge is the one knowledge domain that **decays by default**. A food fact left alone stays true; a product fact left alone becomes false the moment the product moves. Maintenance is therefore not a follow-up — it *is* the work, and this is the only moment it is cheap, while the person changing the product still remembers what they changed.

- Registry affected: YES / NO *(if unsure, it is YES)*
- Entries **created**: [id — name — visibility — owner, or NONE]
- Entries **updated**: [id — what changed, or NONE]
- Entries **retired**: [id — replaced by, or NONE]
- Any entry set to `public` or `household`: [justify each, or N/A]
- Product knowledge written into a prompt, template, or fallback string: **must be NO** (Rule PKR27)

*(See the Product Registry Compliance block below — copy and complete it.)*

### Data Impact
- Reads existing data: YES / NO
- Writes new data: YES / NO
- Changes meaning of existing data: YES / NO
- Requires backfill: YES / NO

### Trust Check
- Could this mislead the user?
- Could this fabricate certainty?
- Is anything guessed but shown as real?
- What happens if the system is wrong?
- No architectural duplication introduced: YES / NO
- No new source of truth created: YES / NO
- No runtime behaviour altered (for governance-only work): YES / NO

### Rollback Plan
- Rollback identifier (tag name + commit SHA)
- Files modified
- Rollback commands
- Verification steps after rollback

### Architecture Convergence Status
*(Mandatory for all 🔴 RED architectural implementations. See STEP 8 for full guidance.)*

| Field | Value |
|-------|-------|
| Domain | |
| Current Canonical Owner | |
| Current Runtime Consumer(s) | |
| Duplicate Owners Remaining | |
| Duplicate State Remaining | |
| Duplicate Workflows Remaining | |
| Current Convergence (%) | |
| Target Convergence (%) | |
| Next Planned Milestone | |
| Remaining Architectural Risks | |

**Convergence percentages must be evidence-based. Never estimate without citing the current architecture.**

### Scope Lock
- Implemented scope
- Explicitly excluded scope (list what is NOT being done)
- Suggestions (anything useful observed outside scope — do not implement without approval)

---

## STEP 6 — DOMAIN IMPACT DECLARATION

Every workstream that touches any data domain must declare:

```
DOMAIN IMPACT
=============
Domain affected: [name]
Declared SoT: [file path or DB table]
New store created? YES / NO
  If YES: retirement plan for any replaced store: [plan or N/A]
Existing store extended? YES / NO
Consumer created? YES / NO
  If YES: reads from declared SoT? YES / NO
    If NO: blocked by: [technical dependency]
          Resolution plan: [plan]
```

If any answer creates a duplication without a retirement plan, the workstream is incomplete.

---

## STEP 7 — TRUST AND CLAIMS HARD STOPS

Hard stops that must pause implementation and require explicit approval:

- Any knowledge claim displayed without a source reference (`SourceRef` with URL + `lastReviewed`)
- Any AI-generated health claim anywhere in the product
- Any `emerging` benefit shown as `established`
- Any bridge created that keeps two stores of the same fact in sync
- Any new static client `.ts` file that stores knowledge data overlapping with DB stores

---

## STEP 8 — ARCHITECTURE CONVERGENCE STATUS (🔴 RED implementations only)

Every architectural (🔴 RED) implementation must report the convergence state of each domain it touches.

This section is **mandatory** for RED implementations. It is optional but encouraged for 🟡 AMBER implementations that significantly alter a domain.

### Purpose

Convergence Status makes architectural progress visible and measurable. It prevents drift going undetected across workstreams by requiring every RED implementation to record the current state of duplication in the domain it touches.

### Required Fields

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  [Name of the domain — e.g. Food Intelligence, Pantry Knowledge, Meal Planning]

Current Canonical Owner:
  [The declared source of truth for this domain — file path or DB table from the SoT Register]

Current Runtime Consumer(s):
  [All surfaces currently reading from this domain — list each consumer]

Duplicate Owners Remaining:
  [Any files or tables that still own facts that should belong to the canonical owner.
   Write NONE if none remain.]

Duplicate State Remaining:
  [Any user state stored in more than one place for this domain.
   Write NONE if none remains.]

Duplicate Workflows Remaining:
  [Any code paths that duplicate logic already owned by the canonical owner.
   Write NONE if none remain.]

Current Convergence (%):
  [Percentage of the domain that has converged to the canonical owner.
   Must be supported by evidence from the current architecture.
   Do not estimate without citing specific duplicates counted.]

Target Convergence (%):
  [Target percentage for this workstream — typically 100% unless a phased approach is planned]

Next Planned Milestone:
  [The next workstream or milestone that will move convergence further.
   Write N/A if this workstream completes convergence.]

Remaining Architectural Risks:
  [Any duplication, divergence, or bridge that poses ongoing risk.
   Write NONE if there are no remaining risks.]
```

### Convergence Percentage Rules

- **Must be evidence-based.** Count the specific duplicates that remain and the specific owners that have converged.
- **Never invent a percentage.** If you cannot count the evidence, write "Unknown — requires audit" rather than guessing.
- **Must decrease if new duplication is introduced** by this implementation.
- **May only increase when duplication is genuinely removed** — not when it is hidden or bridged.
- **Must reference the SoT Register** (`docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`) as the authority for what counts as convergence.

### Example

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Food Intelligence

Current Canonical Owner:
  WS0 Knowledge Registry (shared/knowledge/foods.ts + DB canonical_foods table)

Current Runtime Consumer(s):
  Meal Detail, Nutrition Report, Pantry Knowledge Hub, Planner, Discovery

Duplicate Owners Remaining:
  - pantry-knowledge.ts (owns benefit summaries independently)
  - nutrition-variety.ts (owns variety groupings independently)
  - client dietRules.ts (owns diet rule logic independently)

Duplicate State Remaining:
  None

Duplicate Workflows Remaining:
  One remaining — benefit resolution runs in both pantry-knowledge.ts
  and the canonical registry for the same food entities.

Current Convergence (%):
  78% — 18 of 23 benefit attributes now resolve from canonical owner.
  5 attributes remain in pantry-knowledge.ts and nutrition-variety.ts.

Target Convergence (%):
  100%

Next Planned Milestone:
  M2 — Pantry Knowledge Convergence (retire pantry-knowledge.ts and nutrition-variety.ts)

Remaining Architectural Risks:
  client dietRules.ts duplication — client-side diet logic diverges from
  canonical diet attributes and is not currently in scope for retirement.
```

---

## MANDATORY ARCHITECTURE COMPLIANCE CHECKLIST

Copy this into every workstream implementation document. Complete it before any implementation begins.

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

□ One canonical identity
  Each entity touched has exactly one key space.
  Explain: [which entities and their keys]

□ One owner per fact
  No attribute has two stores that must always agree.
  Explain: [which facts and their single owners]

□ No duplicate entities
  No new entity is being created that duplicates an existing entity.
  Explain: [confirm or describe what is new and why it is not a duplicate]

□ No duplicate ownership
  No attribute is being given a second owner.
  Explain: [confirm]

□ No duplicate state
  No user state is being split across two stores.
  Explain: [confirm]

□ Extends existing architecture
  This implementation builds on existing patterns, not beside them.
  Explain: [which existing pattern this extends]

□ Progressive enrichment where appropriate
  If this is a knowledge entity, enrichment follows the identity→core→optional→runtime pattern.
  If this is transactional state, enrichment is not being added.
  Explain: [entity type and enrichment approach]

□ Knowledge domain compliance
  If this introduces or extends a KNOWLEDGE DOMAIN, it fills a row in
  PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md §1.1 — naming its Candidate
  source, its Gate, its Confirmation authority, its Published form, and its
  terminal rejection state. It does NOT invent a new lifecycle (Rule KC1;
  Risk R1). Which existing row is the closest analogue?
  If this changes what THA *is*, the domain is PRODUCT KNOWLEDGE and its
  canonical owner is the Product Knowledge Registry (PKCA §9) — complete the
  Product Registry Compliance block below.
  Explain: [which §1.1 row this fills or extends, or N/A]

□ Honest gaps over fabricated information
  Missing knowledge renders as empty/absent, never as invented content.
  Explain: [how gaps are handled]

□ No permanent synchronisation bridge
  No bridge is being built that keeps two owners of the same fact in sync.
  If a bridge exists, it funnels many inputs to one owner (permitted infrastructure).
  Explain: [any bridges and their classification]

□ Evolution over replacement
  If a new store replaces an existing one, the existing store is named and has a retirement plan.
  Explain: [what is being replaced and when/how it retires]
```

**If any item cannot be checked, implementation must stop and explain why before proceeding.**

---

## AI ARCHITECTURE COMPLIANCE

This section applies to **every AI-related implementation** in addition to the general Architecture Compliance Checklist above. It enforces the Intelligence Governance documents in `docs/architecture/` (THA Intelligence Platform Architecture, THA AI Capability Registry & Intent Taxonomy, THA AI Experience & Conversation Architecture).

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------

For every AI-related implementation confirm:

✓ Uses the canonical Intelligence Platform
✓ Uses the Capability Registry
✓ Uses the Intent Engine
✓ Reuses existing business services
✓ Does not create another assistant
✓ Does not duplicate conversation state
✓ Uses registered capabilities only
✓ Uses permission-aware access
✓ Produces honest gaps rather than fabricated knowledge
```

**If any check fails: STOP. Explain why. Do not continue.**

---

## EXPERIENCE & UI GOVERNANCE COMPLIANCE

**Adopted under `ARCH-VERIFY1` (2026-07-11), closing a governance gap.** This section applies to **every user-facing implementation** — anything a person sees, reads, hears, or does — in addition to the general Architecture Compliance Checklist above.

Two governing documents own the user-facing layer, and each holds its own full checklist. **This workflow does not restate them** (that would create a second owner of the same law, which drifts); it makes them mandatory and names the precedence between them:

| Document | Owns | Its checklist |
|---|---|---|
| [`THA_EXPERIENCE_ARCHITECTURE.md`](./THA_EXPERIENCE_ARCHITECTURE.md) (EXP1, + EXP2 Premium Experience Principles) | How THA **behaves and feels** — Home, progressive disclosure, calm before capability, one primary action, journeys, companion conduct, trust, language, errors, notifications, accessibility, and the premium standard of craft | **UX Governance Checklist** — its § 18, *including the Premium Standard block* |
| [`THA_UI_ARCHITECTURE.md`](./THA_UI_ARCHITECTURE.md) (UIA2) | How THA **looks** — the Calm Orchard visual language, visual hierarchy, layout, colour, typography, spacing, motion, brand identity, state presentation, Visual Trust, design tokens, and one-owner-per-visual-concern | **UI Governance Checklist** — its § 18 |

```
----------------------------------------
EXPERIENCE & UI GOVERNANCE COMPLIANCE
----------------------------------------

For every user-facing implementation confirm:

✓ The UX Governance Checklist (THA_EXPERIENCE_ARCHITECTURE.md § 18) has been
    completed IN FULL — including the Premium Standard block (§ 17)
✓ The UI Governance Checklist (THA_UI_ARCHITECTURE.md § 18) has been
    completed IN FULL
✓ Any conflict between them was resolved in the EXPERIENCE Architecture's
    favour — Experience governs behaviour, UI governs presentation, and
    Experience prevails (EXPERIENCE § 2.1, UI § 2)
✓ Nothing in this change owns a fact, an entity, or a decision at the
    presentation layer — every value shown is read from its single owner, and
    gaps render as honest absence, never invented content (Core Principle 6)
✓ Any new visual pattern RETIRED its predecessor in this same change — no
    dormant predecessors, no two owners of one visual concern (UI Principle 5)
```

**If any check fails: STOP. Explain why. Do not continue.**

> **Why this block exists.** Both checklists have always declared that they *"stand beside the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`"* — but until now this workflow had never heard of either document, so neither checklist was ever reachable by anyone following the workflow. A governing rule that only fires when its author happens to remember it is not enforced; it is hoped for (`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` Rule KC8). This block makes the two checklists reachable from the one document every implementation is required to read.

> **Not applicable to non-user-facing work.** A migration, a query optimisation, a server-side refactor, or a governance document changes nothing a person sees and owes these checklists nothing. The question is simply: *will a person see, read, hear, or do anything differently?*

---

## PRODUCT REGISTRY COMPLIANCE

**Adopted under `PKR2` (2026-07-11); anchored in the domain law under `PKR3` (2026-07-11).** This section applies to **every user-facing implementation** in addition to the general Architecture Compliance Checklist above. It enforces [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md), whose § 19 holds the full Product Registry Governance Checklist, and [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](./PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) § 9, which governs **Product Knowledge** as a platform knowledge domain (Rules KC12–KC15).

The Product Knowledge Registry is the single source of truth for **what THA is** — the canonical owner of the Product Knowledge domain, alongside Food, Nutrition, Recipes and Household Knowledge. It is queried by the Intelligence Platform and read by the Companion, permission-aware. A stale entry is therefore not a documentation defect — it is the Companion telling a household something false, in the product's own voice.

**Discovery is not ownership (PKCA § 9.3).** An investigation or audit **discovers**; the registry **owns**; implementations **maintain**. A finding that stays inside the document that found it has not been transferred to an owner, and will be rediscovered from scratch by whoever asks next. If this change discovered something true about THA that the registry does not yet hold, the registry gets an entry — with a named human owner and a deliberate visibility — in this change.

```
----------------------------------------
PRODUCT REGISTRY COMPLIANCE
----------------------------------------

For every user-facing implementation confirm:

✓ Registry impact assessed — would "what is THA?" answer differently now?
✓ Every new page, route, journey, feature, capability, dialog, drawer,
    wizard, notification, integration, API and setting has a registry entry
✓ Every entry names a human owner
✓ Every entry declares a visibility: public / household / admin / developer
    — chosen deliberately, never defaulted. Absence of a label is never
    permission; it fails closed to `developer` (Rule PKR22)
✓ Visibility keys on ROLE, never on subscription tier — a free household may
    still be TOLD what premium does (Rule PKR24)
✓ The registry labels; server/lib/access.ts authorises. No registry value
    determines who a user is or grants access to anything (Rule PKR25)
✓ Permission filtering happens BEFORE prompt composition — never by asking
    the model to withhold what it has been shown (Rule PKR26)
✓ NO product knowledge written into a prompt, template, fallback string,
    fine-tune, or capability code. The Companion queries; it never duplicates
    (Rule PKR27)
✓ Every replaced surface has its predecessor's entry RETIRED in this change
    (Rule PKR14)
✓ Anything shipped-but-unlinked is in Hidden Experiences, visibility: admin
✓ Every new claim has a Marketing Message entry citing what substantiates it
✓ The implementation report names every entry created, updated or retired
```

**If any check fails: STOP. Explain why. Do not continue.**

> **Not applicable to non-user-facing work.** A refactor, a query optimisation, a
> bug fix, or a spacing adjustment does not change what THA *is* and owes the
> registry nothing. The question is not "did I touch the UI?" — it is "would a
> person's answer to *what is THA?* be different now?"

---

## IMPLEMENTATION TEMPLATE

**Relocated under `EOM1` (2026-07-10).** The canonical, copyable template now
lives at
[`.engineering/templates/IMPLEMENTATION_TEMPLATE.md`](../../.engineering/templates/IMPLEMENTATION_TEMPLATE.md),
alongside the investigation, release, and repository-housekeeping templates.
Document shapes are engineering governance; the compliance content they invoke
remains governing here.

The copy below is retained for reference only. **If it disagrees with the
template file, the template file wins.**

```markdown
# [WORKSTREAM NAME] — Implementation

**Date:** YYYY-MM-DD
**Branch:** [branch name]
**Risk:** 🟢 GREEN / 🟡 AMBER / 🔴 RED
**Reason:** [one sentence explaining the risk level]

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| Rollback tag | `rollback/[name]-[YYYYMMDD]` → `[commit SHA]` |
| Working tree | Clean / Intentionally dirty — [reason] |
| This task's writes | [files changed] |
| Rollback to committed state | `git checkout rollback/[name]-[YYYYMMDD]` |

---

## REFERENCE DOCUMENTS READ

- [ ] docs/architecture/README.md (architecture bootstrap — canonical entry point)
- [ ] docs/architecture/ARCHITECTURE_PRINCIPLES.md
- [ ] docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md
- [ ] [any workstream-specific documents]

---

## ARCHITECTURE COMPLIANCE CHECKLIST

[Copy and complete the checklist from docs/architecture/ENGINEERING_WORKFLOW.md]

---

## DOMAIN IMPACT

[Copy and complete the Domain Impact Declaration from docs/architecture/ENGINEERING_WORKFLOW.md]

---

## ARCHITECTURE CONVERGENCE STATUS

*(Mandatory for 🔴 RED implementations. See STEP 8 in docs/architecture/ENGINEERING_WORKFLOW.md for guidance and rules.)*

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  [name]

Current Canonical Owner:
  [file path or DB table]

Current Runtime Consumer(s):
  [list each consumer]

Duplicate Owners Remaining:
  [list or NONE]

Duplicate State Remaining:
  [list or NONE]

Duplicate Workflows Remaining:
  [list or NONE]

Current Convergence (%):
  [X% — cite the evidence: N of M attributes / files / workflows converged]

Target Convergence (%):
  [target for this workstream]

Next Planned Milestone:
  [milestone name or N/A if this completes convergence]

Remaining Architectural Risks:
  [list or NONE]
```

---

## IMPLEMENTATION

[Implementation content]

---

## DEFINITION OF DONE

[DoD section]

---

## PRODUCT REGISTRY IMPACT

[Registry affected YES/NO; entries created / updated / retired, each with id,
visibility and owner; justification for any public or household visibility.
Mandatory for user-facing implementations — see PRODUCT REGISTRY COMPLIANCE.]

---

## DATA IMPACT

[Data Impact section]

---

## TRUST CHECK

[Trust Check section]

---

## ROLLBACK PLAN

[Rollback Plan section]

---

## SCOPE LOCK

[Scope Lock section]

SUGGESTION:
[Any out-of-scope observations — do not implement without approval]
```

---

## STEP 9 — MANDATORY PROJECT DOCUMENTATION

**Adopted:** 2026-06-29

Every investigation, implementation, review, audit, repair, release, prompt, architecture decision, planning document, or significant engineering task MUST create a corresponding Markdown project document.

### File Requirements

The file must:
- use the same name as the task or report (SCREAMING_SNAKE_CASE.md)
- be saved in its **canonical location**, per [`REPOSITORY_CONVENTIONS.md`](./REPOSITORY_CONVENTIONS.md) § 3
- include relevant sections where applicable: Summary, Findings, Decisions, Architecture Compliance, Changes Made, Validation Performed, Data Impact, Trust Check, Rollback Information, Outcome, and Next Steps

> **Amended under `EOM1` (2026-07-10).** This step previously required *every*
> project document to be saved under `docs/investigations/`. That predates the
> `docs/implementation/` split and contradicted `REPOSITORY_CONVENTIONS.md`, which
> is the canonical authority on location. The rule is unchanged in substance —
> every task produces a document — only the destination now defers to the
> conventions:
>
> | Document | Canonical home |
> |---|---|
> | Investigation, audit, root-cause analysis | `docs/investigations/` |
> | Implementation report | `docs/implementation/<workstream>/` |
> | Report about the engineering tooling itself | `.engineering/reports/implementation/` |
>
> Start from a template in [`.engineering/templates/`](../../.engineering/templates/).

### Completion Gate

**No task, prompt, investigation, implementation, review, release, or architecture decision is considered complete until ALL of the following have occurred:**

1. The project document has been created.
2. The project document has been saved in its canonical location (see File Requirements above).
3. **For user-facing implementations: every affected Product Knowledge Registry entry has been created, updated, or retired — in this change — and named in the project document.** *(Added under `PKR2`, 2026-07-11. A user-facing task with a stale registry is not complete, however finished the code is; see [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md) § 16, and — for why this is a knowledge-domain obligation rather than a documentation chore — [`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`](./PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md) § 9.7, Rule KC15.)*
4. The project document has been staged with git (`git add <canonical path>`).
5. The project document has been committed locally with an appropriate commit message.
6. Claude has reported:

```
Project File Created:     <canonical path>
Git Commit SHA:           <full SHA of the documentation commit>
Current Branch:           <branch name>
Rollback Identifier:      <rollback tag name> → <commit SHA>
```

### Commit Rule

**Process owner:** [`.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md`](../../.engineering/protocols/COMMIT_PUSH_DEPLOY_PROTOCOL.md).

The governing rules, unchanged:

- **Local commit is mandatory.** No task is complete without a committed documentation record.
- **Pushing to GitHub is NOT automatically required.** Pushing is governed by the release workflow in `docs/change-control.md`.
- The documentation commit may be included in a later feature or release push.
- Staging alone (without committing) does not satisfy this requirement.
- **Deployment is never implied.** It requires explicit, separate approval.

### Scope

This rule applies to all task types without exception:
- Architecture investigations and feasibility reviews
- Feature implementations and workstream tasks
- Bug fixes and hotfixes
- Release preparation and production verification
- Audits and compliance checks
- Repairs and rollback operations
- Prompts and architecture decisions
- Planning documents
- Any task that spans more than a single file edit

---

## CHANGE CONTROL (unchanged from `docs/change-control.md`)

All existing change control rules remain in force. This workflow adds architecture compliance governance on top of them. See `docs/change-control.md` for the full decision-gated workflow, risk ratings, and prompt discipline rules.

---

*This document governs all future THA implementation work.*
*Questions or conflicts → stop and report before implementing.*
