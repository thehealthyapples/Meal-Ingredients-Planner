# PKR3 — Product Knowledge as a Platform Knowledge Domain — Implementation

**Workstream:** `PKR3` (governance)
**Date:** 2026-07-11
**Type:** Governance extension. **No code, schema, route, runtime, or API changes.**
**Branch:** `int1-intelligence-platform`

---

## ROLLBACK PROTECTION

| Field | Value |
|---|---|
| Rollback identifier | `rollback/PKR3-product-knowledge-domain-20260711` |
| Commit SHA | `a4324004d667406f65599c3af34865c8921ee88a` (`a432400`) |
| Created | Before any file was modified |

**Files modified (four; no files created in `docs/product/`, deliberately):**

| File | Change |
|---|---|
| `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` | **Extended.** New §0.1, §2.2, §4.3, §9; rows added to §1.1, §2.1, §3.1, §6.1, §7, §8; tail renumbered §9→§10 … §13→§14 |
| `docs/architecture/ENGINEERING_WORKFLOW.md` | Knowledge-domain checklist gate added; Product Registry Impact + Compliance + Completion Gate anchored in the domain law |
| `docs/architecture/README.md` | PKCA indexed with its `PKR3` extension; PKR paragraph placed under the platform-wide law |
| `docs/implementation/governance/PKR3_PRODUCT_KNOWLEDGE_AS_PLATFORM_DOMAIN.md` | This report |

**Rollback commands:**

```bash
git checkout rollback/PKR3-product-knowledge-domain-20260711 -- \
  docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md \
  docs/architecture/ENGINEERING_WORKFLOW.md \
  docs/architecture/README.md
rm -f docs/implementation/governance/PKR3_PRODUCT_KNOWLEDGE_AS_PLATFORM_DOMAIN.md
```

**Verification after rollback:** `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` contains no occurrence of "Product Knowledge"; `ENGINEERING_WORKFLOW.md` retains its `PKR2` registry wiring unchanged; `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` is untouched in both states (it was never modified).

---

## REFERENCE DOCUMENTS READ

- `docs/architecture/README.md` (bootstrap — STEP 2)
- `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (the document extended)
- `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` (`PKR1`/`PKR2` — the domain's existing architecture)
- `docs/architecture/ENGINEERING_WORKFLOW.md`
- `docs/architecture/REPOSITORY_CONVENTIONS.md` (report location)

---

## 1. WHAT THIS IMPLEMENTATION FOUND FIRST — AND WHY IT CHANGED THE WORK

The brief asked for seven things. **Five of them already existed**, delivered earlier the same day by `PKR1`/`PKR2` (`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, 968 lines):

| Asked for | Already existed |
|---|---|
| Discovery vs Ownership principles | `PKR1` § 5, Rules PKR3/PKR4 |
| One owner per page / capability / journey / feature / marketing message / screenshot / inventory record | `PKR1` § 6, Rules PKR5–PKR11 |
| Permission-aware knowledge (`public` · `household` · `admin` · `developer`) | `PKR2` § 11, Rules PKR22–PKR25 |
| Companion queries the registry, never duplicates | `PKR2` § 12, Rules PKR20/PKR21/PKR26/PKR27/PKR29 |
| Recommended `docs/product/` structure (README, Domains, Pages, Routes, Journeys, Features, Capabilities, Intelligence, Companion, Admin, Developer, Hidden, Marketing, Help, Screenshots, Assets, Glossary, inventory) | `PKR1` § 18 — all 28 canonical sections |
| Registry update as Definition of Done in `ENGINEERING_WORKFLOW` | `PKR2` § 16 — already wired: mandatory **Product Registry Impact** section, **Product Registry Compliance** block, **Completion Gate** step 3 |

**Writing any of that again would have been the single thing the architecture most explicitly forbids.** Rule PKR13 — *no parallel product descriptions; a document that restates a registry entry has created a second owner and must be reduced to a pointer* — applies with particular force to a document restating the **registry's own architecture**. Duplicating `PKR1` § 11 into the Platform Knowledge Completion Architecture would have produced two governing statements of the permission model, drifting apart from the day they were written, in the document whose entire subject is that facts must have one owner.

**So this implementation did not restate. It cited.**

What was genuinely missing is exactly what the brief's headline mission named, and nothing more: **`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` did not contain the words "Product Knowledge" anywhere.** The platform's law for how knowledge domains grow governed four domains — Food, Nutrition, Recipes, Household Evidence — and did not know the fifth existed. The registry had an architecture but no domain; the domain law had no fifth domain. That gap is what `PKR3` closes.

---

## 2. WHAT WAS IMPLEMENTED

### 2.1 Product Knowledge admitted as a platform knowledge domain (PKCA § 0.1, § 9)

Product Knowledge — *the canonical knowledge describing The Healthy Apples itself* — is now a first-class platform knowledge domain alongside Food, Nutrition, Recipes and Household Knowledge, governed by every rule (KC1–KC11) that already existed. Its canonical owner is named as the **Product Knowledge Registry**, which stands to Product Knowledge exactly as NK1/NK2 stand to Nutrition and FS1/FS2 stand to Recipes: **the domain's own architecture, subordinate to the platform-wide one.**

It fills a row in every table the document already had — inventing nothing:

| PKCA table | Product Knowledge's row |
|---|---|
| **§ 1.1 Graduation pipeline** | Candidate = a **discovery** (an investigation or audit finds a surface THA ships) · Gate = **entry-spine completeness** (`id`, `name`, `section`, `status`, `visibility`, `purpose`, `owner`, `sources`) · Confirm = the **named human owner** accepts accountability, never automatic · Published = a live entry composed into the Companion's Context View at its own visibility tier · Terminal = `declined` (Rule KC12) and `retired` (Rule PKR14) |
| **§ 2.1 One mouth (Rule KC4)** | Store = `docs/product/` · Mouth = the registry entry (human) and the Product Knowledge Capability's INT17-composed Context View (model) |
| **§ 3.1 MVF bar** | MVF = the entry spine. Enrichment (screenshots, help, marketing, the `related` graph) deepens an answer and never gates one |
| **§ 6.1 Completion criterion** | One owner, one truth, current — explicitly **not** comprehensiveness |
| **§ 7 Roadmap** | **Phase 7** — the Platform Discovery & Experience Audit populates the registry, shipping *with* its validator |

The Gate came from the Food row (a structural completeness check, exactly like `validateCanonicalSeed()`); the Confirmation came from the Household row (an explicit named act, never a threshold). **No new lifecycle was invented** — which is the point, and the clearest available evidence that PKCA's central claim (that the four pipelines are one shape) was true rather than merely tidy.

### 2.2 The self-describing domain — the evidence chain inverts (PKCA § 4.3, Rule KC14)

This is the substantive architectural finding, and it is what makes Product Knowledge more than a fifth row.

For Food, Nutrition and Recipes, **the world is the source and THA is the reader.** THA can be wrong about something external, so the whole three-layer evidence chain exists to stop an unsubstantiated claim being stated. The enemy is **fabrication**.

For Product Knowledge, **THA is the source.** The product cannot be wrong about whether it has a Planner page — the code is right there. Fabrication is nearly impossible and correspondingly uninteresting. What replaces it:

> **A food fact is wrong because it was never true. A product fact is wrong because it *stopped* being true.**

Nobody fabricates a page. They ship a change that quietly makes a true sentence false, and the sentence stays. **The enemy is staleness** — and staleness is invisible, because a stale entry is indistinguishable from a fresh one by reading it. That is precisely what makes it dangerous once the Companion reads it aloud with the product's authority behind it.

The three layers therefore re-project rather than being discarded: Layer 1 (source trust) becomes *the only citable source is the running product* — **an investigation is a finding, not a source**, and may populate an entry but never substantiate one; Layer 2 (claim trust) becomes *every claim THA makes about itself cites the product truth that makes it true, and dies when that truth is retired*; Layer 3 becomes **currency** — `last_verified` plus a named owner accountable for it being true *now* — a layer with **no analogue in the other four domains**, because it is the one this domain actually needs.

### 2.3 Four new rules, each an application of an existing one

| Rule | Statement | The rule it applies |
|---|---|---|
| **KC12** | A **declined discovery is recorded**, not forgotten — otherwise every audit rediscovers it and re-asks the same question forever | KC2 (rejection is terminal, not silent) applied to a domain whose candidates come from *audits* |
| **KC13** | **`visibility` is part of the MVF bar and fails closed** — the first domain in which a *missing* field is a **security** defect, not merely an invisible fact | KC5 (MVF) meeting `PKR2`'s permission model |
| **KC14** | For a self-describing domain, **currency is the evidence standard** | KC7/KC8 (the evidence chain), re-projected per § 4.3 |
| **KC15** | **Maintenance is the work, not a follow-up** — Product Knowledge decays by default, and no other knowledge domain does | KC8 (declared is not enforced) reaching into the Definition of Done |

### 2.4 The declared-vs-enforced gap, named at birth (PKCA § 4.3)

Rule KC8 holds that a trust rule living only in prose is a hope, not a guarantee. PKCA § 4.1 named the platform's largest such gap for Nutrition (Layer 2 `SourceRef` enforcement) *after it had already gone unenforced for months*. This extension declines to repeat that pattern and names Product Knowledge's gap **on the day the domain is created, before a single entry exists**:

> Currency (Layer 3) and the prose↔inventory bijection (Rule PKR11) are today **entirely declared and entirely unenforced.** Nothing checks that an entry's `sources` still resolve, that `last_verified` is within any bar, that every prose entry has an inventory record, or that every entry carries a `visibility` — which Rule KC13 makes a **security** check, not a hygiene one.

It is therefore the **gate on Phase 7, not a follow-up to it**: a registry populated before it can be checked is a registry that will be trusted before it can be trusted.

### 2.5 One mouth — the rule Product Knowledge is already breaking (PKCA § 2.2)

Every other row in PKCA § 2.1 was written pre-emptively. Product Knowledge is the exception, and it earned its row: product knowledge has been narrated for years by READMEs, 380+ investigations, slide decks, release notes — and, most dangerously, **by sentences about THA written into system prompts, templates, and fallback strings.** Each is a mouth; none is *the* mouth; they do not agree, and nothing ever required them to.

`PKR2`'s Rule PKR27 (*no product knowledge in a prompt*) is therefore **not a separate rule.** It is Rule KC4, stated for the one domain where the second narrator is not a hypothetical future surface but a string literal somebody can add in thirty seconds. Naming it as KC4 is what makes it a *knowledge-architecture* defect on sight, rather than a Companion-specific style preference.

### 2.6 ENGINEERING_WORKFLOW — what was already done, and what `PKR3` added

**The Definition of Done obligation the brief asked for already existed** (`PKR2`, earlier the same day): the mandatory **Product Registry Impact** section, the **Product Registry Compliance** block, and **Completion Gate** step 3 were all in place. This implementation verified that and **did not duplicate it.** It added the three things that were missing:

1. **A knowledge-domain gate in the Architecture Compliance Checklist.** PKCA's own **Risk R1** called for exactly this in 2026-07-03 — *"code review gate should ask 'which § 1.1 row is this closest to?' before approving a new lifecycle"* — and it was never wired in. It is now: any implementation introducing or extending a knowledge domain must name the § 1.1 row it fills, and any implementation changing *what THA is* is routed to Product Knowledge and its registry.
2. **The registry duty anchored in the domain law.** The Product Registry Impact section and Compliance block now cite PKCA § 9 alongside `PKR1`/`PKR2` — so the obligation rests on *why the domain works this way*, not only on *the registry says so*.
3. **The reason, stated where the duty is.** Product Knowledge decays by default and no other knowledge domain does. A food fact left alone stays true; a product fact left alone becomes false the moment the product moves. Maintenance is only ever cheap at one moment — while the person changing the product still remembers what they changed — and a Definition of Done item is the only thing that catches that moment.

**Discovery is not ownership** is now stated in the compliance block itself: an investigation **discovers**; the registry **owns**; implementations **maintain**. A finding that stays inside the document that found it has not been transferred to an owner and will be rediscovered from scratch by whoever asks next.

---

## 3. ARCHITECTURE COMPLIANCE CHECKLIST

```
□ One canonical identity              ✅ Product Knowledge has one owner: the Product Knowledge
                                         Registry (PKR1/PKR2). PKCA §9 names it; it creates no second.

□ One owner per fact                  ✅ No fact gains a second owner. Every registry mechanism
                                         (sections, entry spine, permission tiers, Companion path,
                                         folder structure) stays owned by PKR1/PKR2 and is CITED,
                                         never restated — Rule PKR13 observed in the document that
                                         admits it.

□ No duplicate entities               ✅ No new document, store, table, capability or registry is
                                         created. docs/product/ is NOT created.

□ No duplicate ownership              ✅ PKCA is the general law; PKR1/PKR2 is the domain
                                         architecture. Precedence stated explicitly (§9.2): PKCA is
                                         senior; the registry architecture is corrected on conflict.

□ No duplicate state                  ✅ No state of any kind is touched.

□ Extends existing architecture       ✅ This is the item. NO new governing architecture is created.
                                         Product Knowledge fills a row in tables that already
                                         existed and inherits rules KC1–KC11 unchanged. Four new
                                         rules (KC12–KC15) are each an APPLICATION of an existing
                                         rule to a self-describing domain, not a new scheme.

□ Progressive enrichment              ✅ Product Knowledge is a knowledge entity with an MVF bar
                                         (the entry spine) and additive enrichment that never gates
                                         (§3.1). It is not transactional state.

□ Knowledge domain compliance         ✅ Fills a NEW row of PKCA §1.1. Closest analogues named
  (the gate this change adds)            explicitly: Gate from the Food row, Confirmation from the
                                         Household row. No lifecycle invented (Rule KC1, Risk R1).

□ Honest gaps over fabrication        ✅ §4.3 names the domain's declared-vs-enforced gap BEFORE a
                                         single entry exists. The report claims nothing is populated,
                                         enforced, or complete — because none of it is.

□ No permanent sync bridge            ✅ None. The registry is authored once and read; there is no
                                         second copy to keep in sync.

□ Evolution over replacement          ✅ Nothing is replaced. PKR1/PKR2 is untouched (zero edits).
                                         PKCA gains sections; no existing rule is weakened, and no
                                         existing table row is altered.
```

**Renumbering safety:** PKCA's tail (`DEFINITION OF DONE` … `SCOPE LOCK`) moved from §9–§13 to §10–§14. Every citation of PKCA across `docs/` and `.engineering/` was checked first: all reference §1, §2, §4, §4.1, §6, §7 and rules KC4/KC7–KC10 — **nothing cites §9 or below.** No citation was broken.

---

## 4. DOMAIN IMPACT

| Domain | Impact |
|---|---|
| Platform Governance | **Extended** — a fifth knowledge domain admitted to the existing scheme |
| Product Knowledge | **Newly governed** — previously ungoverned by any knowledge-domain law |
| Food / Nutrition / Recipes / Household Evidence | **None** — no row altered, no rule weakened |
| Intelligence / Experience / UI / Data (SoT Register) | **None** — cited, unmodified |
| Code, schema, routes, runtime, API | **None** |

---

## 5. DEFINITION OF DONE

**What success looks like:**
- Product Knowledge is a first-class platform knowledge domain, on the same footing as Food, Nutrition, Recipes and Household Knowledge — governed by rules that already existed, with **no new governing architecture created** (PKCA § 0.1, § 9).
- The **Product Knowledge Registry** is named its canonical owner, by citation, with precedence fixed (§ 9.2).
- Discovery / Ownership / Maintenance is fixed as the domain's load-bearing distinction (§ 9.3).
- One-owner-per page · capability · journey · feature · marketing message · screenshot · inventory record is stated at product granularity (§ 9.4).
- Permission-aware Product Knowledge (`public` · `household` · `admin` · `developer`) is admitted with the **classify-never-authorise** safety property intact — `server/lib/access.ts` remains the sole authority on identity, so a Markdown edit can never become a privilege escalation (§ 9.5).
- The Companion is bound to **query** and forbidden to **duplicate** (§ 9.6).
- The registry is defined as **human-readable, machine-readable, continuously maintained, never regenerated from scratch, and updated incrementally by future implementations** (§ 9.2) — with the reason regeneration is forbidden stated, not merely asserted: it destroys the ownership, the `purpose` sentences, and the record of what was deliberately declined.
- Updating the registry is a **Definition of Done** item in `ENGINEERING_WORKFLOW.md`, now anchored in the domain law (Rule KC15).
- The forthcoming **Platform Discovery & Experience Audit** has a canonical destination, and a gate that fails it if its findings stay inside itself (§ 7 Phase 7, Risk R7).

**What must not break:** nothing can — no code, schema, route, runtime, or data was touched. No rule KC1–KC11 is weakened; no existing table row is altered; `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` has **zero edits**; `PKR2`'s existing `ENGINEERING_WORKFLOW` wiring is intact and was not rewritten.

**Manual verification:**
```bash
git tag -l 'rollback/PKR3*'                                   # tag exists
grep -c "Product Knowledge" docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md   # was 0, now >0
git diff --stat rollback/PKR3-product-knowledge-domain-20260711 -- docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md   # must be EMPTY
ls docs/product 2>&1                                          # must be: No such file or directory
bash .engineering/scripts/repo-structure-verify.sh            # report is filed correctly
```

---

## 6. PRODUCT REGISTRY IMPACT

- **Registry affected:** NO.
- **Entries created / updated / retired:** NONE — the registry has no entries, and this change creates none.
- **Any entry set to `public` or `household`:** N/A.
- **Product knowledge written into a prompt, template, or fallback string:** **NO.**

**Why NO, when the change is entirely about the registry.** The test is *"would a person's answer to **what is THA?** be different after this change?"* It would not. This change alters **how THA governs knowledge about itself**, not what THA *is*. No page, journey, capability, claim or surface changed. Governance work is exactly the case the `PKR2` note carves out: the question is not "did I touch something registry-adjacent?" but "did what THA *is* change?"

This is also the first live test of the boundary, and it is worth recording that it held: a document *about* the registry is not *in* the registry.

---

## 7. DATA IMPACT

- Reads existing data: **NO**
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO**

---

## 8. TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. No runtime path was touched.
- **Could this fabricate certainty?** No — and this was actively guarded. The report claims **nothing** about Product Knowledge is populated, enforced, or complete, because none of it is: `docs/product/` does not exist, the registry holds zero entries, and its evidence standard (currency) is 0% enforced. § 4.3 names that gap rather than glossing it. One earlier draft of this work asserted that Nutrition's Layer 2 gap had been *closed* by the PKC0 workstream; that claim was **removed** because it was not verified — § 4.1 remains the owner of that fact, and PKCA now says so explicitly rather than guessing.
- **Is anything guessed but shown as real?** No. Every Product Knowledge rule in PKCA § 9 cites the `PKR1`/`PKR2` rule it inherits. Every claim about what already existed was verified by reading the documents, not assumed from their titles — which is how the five-of-seven overlap in § 1 was found.
- **What happens if the system is wrong?** If Product Knowledge proves not to fit the four-stage pipeline, § 9 is corrected by a successor document — exactly as PKCA itself generalises rather than replaces its sources. The first real test is whether the Platform Discovery & Experience Audit can populate the registry using § 1.1's row **without re-deriving a lifecycle**. If it cannot, § 1.1's row is wrong and gets fixed.
- No architectural duplication introduced: **YES** — the whole design turns on this. `PKR1`/`PKR2` is cited and nowhere restated.
- No new source of truth created: **YES** — Product Knowledge's owner was established by `PKR1`; `PKR3` names it, and creates no second.
- No runtime behaviour altered: **YES**.

---

## 9. ARCHITECTURE CONVERGENCE STATUS

| Field | Value |
|---|---|
| **Domain** | Platform Knowledge Completion — extended to a fifth domain, Product Knowledge |
| **Current Canonical Owner** | The Product Knowledge Registry (`PKR1`/`PKR2`, `docs/product/`), named as the domain owner by PKCA § 9.2. Unchanged for all four pre-existing domains |
| **Current Runtime Consumer(s)** | **None.** The registry has no entries, no query path, and no registered capability. Rules PKR20/PKR21 govern how it *will* be read; nothing reads it today |
| **Duplicate Owners Remaining** | Product Knowledge has **many de facto narrators** and no adapter (PKCA § 2.2) — READMEs, 380+ investigations, release notes, and any sentence about THA sitting in a prompt or fallback string. This extension **names** that as a Rule KC4 violation for the first time; it does not resolve it. Resolution is Phase 7 |
| **Duplicate State Remaining** | None — no state exists |
| **Duplicate Workflows Remaining** | None |
| **Current Convergence (%)** | **Governance-naming: 100%** — Product Knowledge is admitted to the scheme with no lifecycle invented. **Enforcement: 0%**, honestly — the domain has zero entries and no validator. This is an unbuilt check for an unpopulated domain, not a live gap leaking today; it *becomes* one the moment Phase 7 writes a single entry, which is why it is that phase's **gate** and not its follow-up |
| **Target Convergence (%)** | 100% governance-naming (achieved). Enforcement convergence is Phase 7's gate; not committed to a number by this governance-only change |
| **Next Planned Milestone** | **Phase 7** — the Platform Discovery & Experience Audit populates the registry, shipping **with** the currency / visibility / bijection validator |
| **Remaining Architectural Risks** | **R7 (🔴)** the audit discovers into an investigation and nothing lands in the registry — the failure THA has repeated every previous time. **R8 (🔴)** currency stays declared and unenforced, exactly as Nutrition's Layer 2 did, but this time read aloud to households in the Companion's voice. **R9 (🟠)** a second narrator appears in a prompt because it takes thirty seconds and querying does not. **R10 (🟠)** the domain is treated as documentation and the DoD obligation becomes a formality |

---

## 10. SCOPE LOCK

**Implemented:** extend `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` to admit Product Knowledge as a first-class knowledge domain (§ 0.1, § 9) with the Product Knowledge Registry as its canonical owner (by citation); add its row to § 1.1, § 2.1, § 3.1, § 6.1 and § 7 (Phase 7); add § 2.2 (the one-mouth violation this domain is already committing) and § 4.3 (the self-describing domain's inverted evidence chain); add Rules KC12–KC15; add Risks R7–R10; renumber the tail (§ 9–13 → § 10–14) after verifying no document cites it; add a knowledge-domain gate to the Architecture Compliance Checklist in `ENGINEERING_WORKFLOW.md` and anchor its existing `PKR2` registry wiring in the domain law; index the extension in `docs/architecture/README.md`; file this report.

**Explicitly NOT implemented — the boundary that matters most:**

- **No new governing architecture.** `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` already exists and remains the domain's architecture. It received **zero edits**. It is cited, not restated, replaced, superseded, or absorbed.
- **The registry is not implemented.** `docs/product/` is **not created**. Not one entry, folder, `README.md`, `OWNERS.md`, `VISIBILITY.md`, `inventory.yaml`, or `inventory.json` was written. The folder structure remains the specification in `PKR1` § 18.
- **No capability registered, no query path built, no prompt changed.** The Companion's read path is architecture here, not code.
- **The Platform Discovery & Experience Audit was not run.** This extension exists so that when it runs, everything it discovers has a canonical destination — and so its findings become *owned knowledge* rather than one more investigation nobody maintains.

---

*Governance only. No code was changed in the production of this document.*
*Rollback: `rollback/PKR3-product-knowledge-domain-20260711` → `a432400`.*
