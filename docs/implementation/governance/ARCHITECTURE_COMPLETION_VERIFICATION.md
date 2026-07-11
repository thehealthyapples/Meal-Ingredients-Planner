# Architecture Completion & Verification

**Workstream:** `ARCH-VERIFY1` (governance)
**Date:** 2026-07-11
**Type:** Architecture completion + verification. **No code, schema, route, runtime, or API changes. No commits. No tags. No repository cleanup.**
**Branch:** `int1-intelligence-platform` — HEAD unchanged at `a432400`

---

## 0. CONSTRAINTS OBSERVED

| Instruction | Status |
|---|---|
| Read `docs/architecture/README.md` first | ✅ Read before any edit |
| Confirm git status | ✅ Confirmed — HEAD `a432400`, unchanged throughout |
| Do **not** create commits | ✅ **Zero commits.** `git log -1` is still `a432400 UIA1 — UI Architecture Discovery investigation` |
| Do **not** create tags or rollback points | ✅ **Zero tags created.** The four `*20260711` tags present are pre-existing (`EXP2` ×2, `PKR1`, `PKR3`) |
| Do **not** perform repository housekeeping | ✅ No file moved, renamed, deleted, or reorganised. No `.txt` cleanup, no folder restructuring |
| Work only on architecture documents in progress | ✅ Six documents touched, all in `docs/architecture/`, plus this report |

**Rollback for this work:** none needed and none created — every change is an uncommitted working-tree edit to six Markdown files. `git checkout -- <path>` reverts any tracked one; the three untracked architecture documents (`THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`) revert by deletion, exactly as their own footers state.

---

## 1. DOCUMENTS REVIEWED

| Document | Lines | Verdict on arrival |
|---|---|---|
| `docs/architecture/README.md` | 103 | Indexed all six architectures; Compliance section named only two of the four mandatory gates |
| `THA_EXPERIENCE_ARCHITECTURE.md` | 460 | Substantively complete (EXP1 + EXP2 premium principles). **Structurally isolated** — see Gap 2 |
| `THA_UI_ARCHITECTURE.md` | 319 | Substantively complete (UIA2). **Structurally isolated** — see Gap 3 |
| `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` | 968 | Complete (PKR1 + PKR2). Did not yet know `PKR3` had made it a domain owner — see Gap 4 |
| `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` | 501 | Complete, incl. the `PKR3` Product Knowledge domain (§ 9). No change required |
| `ENGINEERING_WORKFLOW.md` | 682 | **Did not reference the Experience or UI Architectures at all** — see Gap 1 |

**The headline finding: the architecture documents themselves were not the problem.** All three target documents were substantively finished, internally coherent, and well-written. What was missing was **connective tissue** — the cross-references and enforcement hooks that turn a set of good documents into a governing architecture. Three of the four gaps below are one-directional cross-references: a document asserting a relationship the other end had never heard of.

---

## 2. GAPS FOUND, AND WHAT WAS DONE

### Gap 1 — 🔴 **The UX and UI Governance Checklists were unenforceable** *(the significant one)*

**Found:** `THA_EXPERIENCE_ARCHITECTURE.md` § 18 and `THA_UI_ARCHITECTURE.md` § 18 each declare that their checklist *"stands beside the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md`"*. `ENGINEERING_WORKFLOW.md` **contained no reference to either document** — not in the Architecture Bootstrap, not in the compliance blocks, nowhere. A search for `Experience Architecture`, `UI Architecture`, `UX Governance` and `UI Governance` across all 682 lines returned nothing.

The consequence is precise, and it is the failure mode the platform already has a rule for: **an engineer following the workflow exactly, from STEP 1 to the Completion Gate, would never once be told the two checklists exist.** Both were reachable only by an author who already remembered them. That is `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` **Rule KC8** — *a rule that can only be satisfied by every author remembering to do the right thing is not a platform responsibility; it is a hope* — sitting unnoticed at the governance layer itself.

The asymmetry made it starker: **Product Knowledge was fully enforced** (PKR2 wired a mandatory report section, a compliance block, and a Completion Gate step), while Experience and UI — adopted a day earlier and governing everything a person sees — were enforced by nothing.

**Done:**
- Added an **EXPERIENCE & UI GOVERNANCE COMPLIANCE** block to `ENGINEERING_WORKFLOW.md`, alongside AI Architecture Compliance and Product Registry Compliance. It makes both checklists mandatory for every user-facing implementation and fixes the precedence (Experience prevails over UI).
- Added both documents — plus the Product Knowledge Registry — to **STEP 2 (Architecture Bootstrap)** as required reading for user-facing work.
- **Deliberately did not restate either checklist in the workflow.** Each checklist has one owner and the workflow points at it. A condensed copy in a second document is a second owner, and it drifts.

### Gap 2 — 🟠 Experience Architecture did not know the UI Architecture or the Registry existed

**Found:** `THA_UI_ARCHITECTURE.md` declares itself *"Governed by `THA_EXPERIENCE_ARCHITECTURE.md` — where this document and the Experience Architecture conflict, the Experience Architecture wins"*. The Experience Architecture **never claimed that authority**: it mentioned UI once, in passing, in a § 17.10 parenthesis, and never linked to it. Subordination was asserted by the subordinate alone.

Its § 2 also still read *"THA is governed by **four** architectures"* — Platform, Data, Intelligence, Experience — omitting both UI and Product Knowledge, and so **contradicting** `PKR1` § 4, which lists six.

**Done:** Rewrote § 2 as the six-architecture table (matching `PKR1` § 4 exactly), and added:
- **§ 2.1** — the UI Architecture is subordinate; behaviour vs presentation divided explicitly; both checklists required; Experience prevails.
- **§ 2.2** — *"The Experience Architecture is the law; the Product Knowledge Registry is the census."* This closes a real hole: **Experience Principle 6 (*one canonical place for everything*) has never been enforceable, because enforcing it requires a list of the places and no list existed.** The registry is that list. The boundary is stated in both directions — the registry records *that a surface exists and what it is for*, never *how it behaves*.
- Header now names UI as subordinate, PKR as peer, and the UX Governance Checklist as its enforcement hook.

### Gap 3 — 🟠 UI Architecture did not know the Registry existed — and two registers were on a collision course

**Found:** `PKR1` § 4.5 asserts a boundary with the UI Architecture (the registry owns *which screenshots exist and what each depicts*; UI owns *whether the screenshot is well designed*). `THA_UI_ARCHITECTURE.md` contained **no mention of the registry, product knowledge, or screenshots** — the boundary existed on one side only.

More seriously, this surfaced a **genuine duplicated-ownership risk that neither document had noticed**: the UI Architecture mandates an **adoption register** (§ 17), and the platform now has a **Product Knowledge Registry**. Both enumerate surfaces. Nothing said which owned what, and the natural drift — the adoption register starting to note what a surface is *for*, or the product registry starting to track which surfaces have *migrated* — would have produced exactly the two-owners-of-one-fact failure both documents exist to prevent.

**Done:** Added **§ 2.1 — Relationship to the Product Knowledge Registry** to the UI Architecture:
- The Screenshot Library boundary, stated from the UI side.
- A table separating the two registers on four axes: what each answers, the fact it owns, its nature (**operational** vs **knowledge**), and its lifespan (an adoption entry *closes* on migration; a registry entry lives as long as the thing it describes).
- An explicit rule: **neither register restates the other.** A surface appears in both, describing two different facts, owned in two different places.
- Three-way precedence: UI wins on *how a surface looks*; the registry wins on *what a surface is*; **Experience wins over both**.

### Gap 4 — 🟡 The Registry did not know it had become a knowledge domain

**Found:** `PKR3` (yesterday's work) named the Product Knowledge Registry the canonical owner of the Product Knowledge domain in `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` § 9, and said so in the architecture README. **The registry's own document never acknowledged it** — another one-directional reference, and one introduced by the previous change rather than inherited.

**Done:** Amended `PKR1` § 4.1 (Relationship to Platform Architecture) and the document header. The registry now records that it stands to Product Knowledge as NK1/NK2 stand to Nutrition — *the domain's own architecture, subordinate to the platform-wide one* — and names the four PKCA rules that bind it (**KC12** declined discoveries are recorded · **KC13** visibility is an MVF field and fails closed · **KC14** currency is the evidence standard for a self-describing domain · **KC15** maintenance is the work). No rule was added to the registry and none was restated from PKCA.

### Gap 5 — 🟡 README's Compliance section named two of four gates

**Found:** the README listed the Architecture Compliance Checklist and the AI Architecture Compliance block, but neither the Experience/UI gate (which did not exist) nor the Product Registry gate (which did). Its Experience Governance blurb also predated `EXP2` and did not mention the Premium Experience Principles.

**Done:** Compliance section now lists all four gates. The Experience Governance note records `EXP2`, states what premium means in THA (*the perceptible result of care taken on the household's behalf* — explicitly **not** exclusivity: it is the quality every household receives, including the ones who pay nothing), and records that both checklists became enforceable today.

---

## 3. DOCUMENTS UPDATED

| Document | Change | Behaviour changed? |
|---|---|---|
| `ENGINEERING_WORKFLOW.md` | New **EXPERIENCE & UI GOVERNANCE COMPLIANCE** block; Experience/UI/Registry added to STEP 2 Architecture Bootstrap | No |
| `THA_EXPERIENCE_ARCHITECTURE.md` | § 2 rewritten (four → six architectures); new § 2.1 (UI subordination) and § 2.2 (registry as census); header cross-refs | No |
| `THA_UI_ARCHITECTURE.md` | New § 2.1 (registry relationship; adoption-register vs product-registry boundary; three-way precedence); header cross-refs | No |
| `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` | § 4.1 amended (`PKR3` domain placement; the four binding KC rules); header | No |
| `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` | **None — no change required.** Verified consistent with all five others | No |
| `README.md` | Compliance section lists all four gates; Experience Governance blurb records `EXP2` and the new enforceability | No |

**No document had content removed.** Every edit is additive or a correction of a statement that had become false (the "four architectures" count).

---

## 4. VERIFICATION

| Claim to verify | Method | Result |
|---|---|---|
| **Architecture documents are internally consistent** | Cross-checked the governing-architecture tables in `EXP § 2`, `PKR § 4`, `UI § 2`. All three now enumerate the same six architectures with the same owned question each | ✅ Consistent. The one contradiction found (EXP said four, PKR said six) is corrected |
| **No duplicated ownership introduced** | Traced every ownership claim across the six documents. Each question has exactly one owner; every other document *cites* that owner | ✅ Confirmed — **and one latent duplication was found and closed** (UI adoption register vs Product Knowledge Registry, Gap 3) |
| **UX, UI and Experience responsibilities clearly separated** | Verified the behaviour/presentation split is stated from **both** sides with consistent precedence | ✅ Experience owns behaviour; UI owns presentation; **Experience prevails**, now stated in EXP § 2.1, UI § 2 + § 2.1, `ENGINEERING_WORKFLOW`, and the README |
| **Product Knowledge Registry ownership defined** | Verified a single owner for *what THA is* | ✅ The registry, named as canonical owner in PKCA § 9, acknowledged in `PKR § 4.1`, cited (never restated) by EXP, UI, EW and README |
| **Cross-references are valid** | Scripted check: every `](./FILE.md)` target in the six documents resolves on disk | ✅ **All links resolve.** All seven document-pair references are now bidirectional (EXP↔UI, EXP↔PKR, UI↔PKR, PKR↔PKCA, EW→EXP/UI) |
| **No implementation behaviour changed** | Every file written by this workstream is under `docs/`. Verified: the complete set of files this work touched is the seven listed in § 3 | ✅ **This workstream changed no code.** Not one line of code, schema, route or config was written by it |
| **No repository cleanup performed** | Reviewed working tree | ✅ No file moved, renamed, deleted or reorganised |
| **No commits created** | `git log -1` | ✅ HEAD is `a432400`, unchanged. **Zero commits, zero tags** |

> **⚠️ An important correction, and a caveat on the working tree.** An earlier check in this session reported the code tree as clean. **That check was wrong** — it was run from inside `docs/architecture/`, so its `client/ server/ shared/ db/` pathspecs matched nothing and returned a false negative. It is corrected here rather than quietly dropped.
>
> The working tree in fact carries **~65 modified and ~20 untracked source files** — the Canonical Bottom Navigation (`UX1`), the Development World admin surfaces, the Attention/Coaching/Learning intelligence work, and more. **None of it belongs to this workstream**, and none of it was touched by it: every file this work wrote is under `docs/`, and the full list is in § 3.
>
> But it changes the readiness advice in § 6, and materially: the repository is carrying a large volume of **uncommitted, untracked application code alongside three untracked governing architecture documents**. Any cleanup that runs `git clean`, `git stash`, or a hard checkout would destroy all of it, with nothing to recover from. **This is now the highest-value thing to do next, ahead of the audit: commit the working tree.**

---

## 5. REMAINING ARCHITECTURAL GAPS

These are **named, not closed** — each is out of scope for a verification pass, and none blocks the Platform Audit.

| # | Gap | Severity | Note |
|---|---|---|---|
| **G1** | **Workstream ID collision: `EXP2` is already taken.** `EXP2` denotes the **Premium Experience Principles** enhancement (2026-07-11), recorded in the Experience Architecture header and in two rollback tags (`rollback/EXP2-premium-experience*`). The forthcoming audit is also being called **"the EXP2 Platform Audit"** | 🟠 **Needs your decision** | Two different pieces of work under one ID will corrupt every future citation — and citations are how this architecture holds together. **Recommend the audit take a fresh ID** (e.g. `EXP3` or `PDA1` — Platform Discovery Audit). I have not renamed anything: it is your vocabulary, and a silent rename by me would be exactly the kind of unilateral correction the architecture forbids |
| **G2** | The **Product Knowledge Registry contains zero entries**; `docs/product/` does not exist | ⚪ By design | This is the Platform Audit's job (PKCA § 7, Phase 7). Not a defect — the destination now exists, which is the point |
| **G3** | The registry's **currency validator is unbuilt** — nothing checks that `sources` resolve, `last_verified` is within bar, `visibility` is present, or that prose and inventory map bijectively | 🟠 Named at birth | PKCA § 4.3 names this as the domain's declared-vs-enforced gap and makes it the **gate on Phase 7, not a follow-up**. It must ship **with** the first entries, not after them: a registry populated before it can be checked is a registry that will be trusted before it can be trusted |
| **G4** | The **UI adoption register is mandated but does not exist** (UI § 17). Its existence is architectural; its content is operational | 🟡 Implementation debt | UIA1's central finding was that ungoverned visual infrastructure is *authored, partially adopted, never retired*. The register is the countermeasure, and it is not yet built |
| **G5** | Experience § 18 and UI § 18 are now mandatory but **have never been run against the existing product** | 🟡 Expected | Both were adopted 2026-07-10 and enforced today. Existing surfaces predate both. The Platform Audit is the natural first pass |

---

## 6. READINESS

### Ready for repository cleanup — ✅ **Yes**

The architecture is now self-consistent and self-referencing. No cleanup operation can break a cross-reference that a document depends on, because every cross-reference has been verified to resolve, and every document that is *referred to* also *refers back*.

Two conditions apply, and they are not optional:

1. **🔴 The working tree is unprotected, and it holds far more than architecture.** Three governing architecture documents are untracked (`THA_EXPERIENCE_ARCHITECTURE.md`, `THA_UI_ARCHITECTURE.md`, `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`) — and so are roughly **20 source files**, alongside **~65 modified ones** (`UX1` bottom navigation, Development World, Attention/Coaching/Learning intelligence, and more). None of it exists in any commit. A housekeeping pass that runs `git clean`, `git stash`, or a hard checkout **destroys all of it with nothing to recover from**. **Commit the tree before cleanup begins.** This is now the single highest-value next action — ahead of both cleanup and the audit.
2. `docs/architecture/` is **fully governed and must not be reorganised** by a housekeeping pass. Its filenames are cited by path from ~30 documents; the Repository Conventions already forbid renaming existing documents for precisely this reason.

### Ready for the Platform Audit — ✅ **Yes**

The audit has what it did not have before:

- **A destination.** Everything it discovers has an owned home — the Product Knowledge Registry, a first-class knowledge domain with a canonical owner (PKCA § 9), rather than one more investigation file nobody maintains.
- **A pipeline.** Discovery is a *Candidate*, not a finding (PKCA § 1.1). Ownership transfers, or the discovery is recorded as declined (**Rule KC12**) — it is never silently dropped, which is what guarantees the next audit does not rediscover it.
- **A standard to audit against.** The UX and UI Governance Checklists are now reachable from the workflow every implementation reads — so the audit can measure existing surfaces against a law that is actually in force, rather than one that was merely written down.
- **A gate that will fail it if it behaves like every previous audit.** PKCA § 7 Phase 7: *an audit that ends with its findings still inside itself has discovered without transferring ownership, and has not passed this gate, however thorough it was.* This is Risk **R7**, rated 🔴, and it is the single most likely way this whole line of work fails.

**One thing to settle first: G1, the `EXP2` ID collision.** The audit should not begin under an ID that already means something else.

---

## 7. TRUST CHECK

- **Could this mislead the user?** No user-facing output exists; no runtime path was touched.
- **Could this fabricate certainty?** No. Every gap in § 5 is stated as open. The report claims nothing about the registry being populated (it is not), the validator being built (it is not), or the checklists having been run against the product (they have not).
- **Is anything guessed but shown as real?** No. Every gap in § 2 was verified by direct search against the file contents, not inferred. The Gap 1 finding — that `ENGINEERING_WORKFLOW.md` referenced neither document — was confirmed by grep across all 682 lines before anything was written.
- **What happens if the system is wrong?** If the behaviour/presentation split proves unworkable in practice, the Experience Architecture is the senior document and is corrected first; the UI Architecture follows. The precedence exists precisely so the question never has to be re-litigated per implementation.
- No architectural duplication introduced: **YES** — and one pre-existing latent duplication (Gap 3) was found and closed.
- No new source of truth created: **YES** — no document gained ownership of a fact another already owned. Every addition is a citation or a boundary.
- No runtime behaviour altered: **YES**.

---

*Verification only. No code was changed, no commits were created, no tags were created, and no repository cleanup was performed in the production of this document.*
