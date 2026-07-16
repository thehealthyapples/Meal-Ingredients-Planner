# DOC4 — The Product Knowledge Architecture Said `docs/product/` Does Not Exist — Implementation

**Status:** IMPLEMENTED — governing documentation only.
**Date:** 2026-07-16
**Branch:** `int1-intelligence-platform`
**Workstream:** `DOC4_Product_Knowledge_Status_Correction`
**Authority:** [`CONV1 — Architecture Convergence Programme`](../../investigations/governance/CONV1_ARCHITECTURE_CONVERGENCE_PROGRAMME.md) § Tier 1, item `DOC-4`; § 7 phase **P1 — Correct the canon**.
**Governing architecture read:** `docs/architecture/README.md` (Architecture Bootstrap, STEP 2), `ARCHITECTURE_PRINCIPLES.md`, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` (Rules KC8/KC14), `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (Domain 29), `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`, `REPOSITORY_CONVENTIONS.md`.

---

## ROLLBACK PROTECTION

| Item | Value |
|---|---|
| **Rollback ID** | `rollback/DOC4-product-knowledge-status-correction-20260716` → `7d1dd2ce` |
| Created | **Before any file was touched** (STEP 1) |
| **File snapshot** | `THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` → session scratchpad (`PKR.md.DOC4-pre`) |
| Working tree | Intentionally dirty — concurrent sessions hold uncommitted work, including in `docs/architecture/README.md`. **No stash taken across the tree** |
| Files this workstream touched | **2 governing documents + this report.** No code, no schema, no runtime |

> **`README.md` carries uncommitted concurrent-session work** (TIME3's Household Time entry, among others). DOC-4 edited **one sentence** of it, inside the Product Knowledge paragraph only. The rollback tag points at committed `HEAD` and **must not be checked out over that file** — it would destroy another session's work. Roll back by reverting the two passages named in § 3.

---

## 1. WHAT DOC-4 WAS

**A currency correction.** A domain's own governing architecture had gone stale about the domain — while the Source of Truth Register, which does not own it, was right about it the whole time.

**This is the failure the document's own domain exists to name.** `PKR3` established Product Knowledge as THA's first **self-describing** knowledge domain, where the evidence standard is **currency**, not sourcing (**Rule KC14**):

> *"A food fact is wrong because it was **never** true; a product fact is wrong because it **stopped** being true. Fabrication is nearly impossible; **staleness is the whole risk**, and a stale entry is indistinguishable from a fresh one by reading it."*

The status block stopped being true on **2026-07-11** and stayed that way. **Rule PKR15** requires an entry to be *corrected, never superseded*; **Rule PKR18** puts that duty on *the person who changed the thing*. Neither happened.

---

## 2. VERIFICATION COMPLETED — EVERY CITED CLAIM CHECKED BEFORE EDITING

The mission required all cited claims be verified against the current repository first. **CONV1's three claims are all true, and its line citation resolves** — the first CONV1 item in three where the citation had *not* drifted (`DOC-2` found `NK1:418` mis-cited; `DOC-3` found `routes.ts:11371` off by 19 lines).

| # | CONV1 claim | Method | Result |
|---|---|---|---|
| V1 | Citation `:896-942` resolves | Read the range | ✅ **Accurate** — holds §20's checks through §23's convergence line |
| V2 | *"`docs/product/` does not exist"* is **false** | `find docs/product -name '*.md'` | ✅ **False claim confirmed** — **151 `.md` files** (173 total), 7 section folders |
| V3 | *"151 files"* | Counted | ✅ **Exact** — 148 section files + `README.md` + `OWNERS.md` + `VISIBILITY.md` |
| V4 | *"154 entries"* | Parsed `inventory/product.json`; cross-checked `product.yaml` | ✅ **Exact** — `entry_count: 154`; 154 `id:` keys in the YAML |
| V5 | *"capability live"* is **registered** | `capability-registry.ts:430` | ✅ `id: "product-knowledge"`, `owningService: server/services/product-knowledge-registry.ts` |
| V6 | The read path is **built**, not just declared | `server/intelligence/index.ts:93-104` | ✅ Bindings, read handler **and** read port all exported. Service file exists (15 KB) |
| V7 | *"Current Convergence 0%"* is **false** | Section histogram over 154 entries | ✅ **22 of 28 canonical sections populated** |
| V8 | Who populated it, and when | `product.json` provenance | ✅ `populated_by: PDA1…`, `populated_on: 2026-07-11` |
| V9 | Who built the capability, and when | `PHASE5A_KNOWLEDGE_PLATFORM_ACTIVATION.md` | ✅ **2026-07-12**, status COMPLETE — *"registers a new Intelligence capability, and creates the first runtime read path"* |
| V10 | Entry currency (Rule KC14) | Field audit over all 154 | ✅ **154/154** carry `owner`, `visibility`, `last_verified` (151 → 2026-07-11; 3 → 2026-07-12) — **inside §15.3's 90-day window** |
| V11 | The registry is internally consistent | `npx tsx scripts/verify-product-inventory.ts` (the validator Domain 29 names) | ✅ **154 prose entries; bijection TOTAL; 0 failures** — *"The registry is internally true"*. 38 `PKR23` advisory warnings are **pre-existing** and untouched by DOC-4 |
| V12 | The Register really was right | `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md:443-462` (Domain 29) | ✅ **Fully current** — it even records *"given its runtime read path by `PHASE5A`, 2026-07-12"* |

### 2.1 The convergence figure was established, not assumed — and deliberately not expressed as a percentage

CONV1 says *"Current Convergence 0%"* is false. **It is — but the honest replacement is not a percentage.**

The schema enum (`inventory/schema/product-schema.json`) defines **26 entry sections**; §8 defines **28 canonical sections** (the last two being the JSON and YAML inventories themselves, which exist and are generated). Counting entries by section:

- **22 sections populated** — Domains (12), Pages (34), Journeys (10), Admin Experiences (12), Hidden Experiences (11), Notifications (11), Intelligence Capabilities (10), Marketing Messages (9), Glossary (8), Integrations (8), Settings (5), Benefits (4), Help (4), Developer Experiences (3), Competitive Advantages (3), Dialogs (2), Wizards (2), Knowledge Capabilities (2), Routes (1), APIs (1), Screenshots (1), Companion Capabilities (1).
- **4 sections hold zero entries** — **Features** (§8.5), **Capabilities** (§8.6), **Drawers** (§8.15), **Product Assets** (§8.25).

**No percentage is claimed in the correction, on purpose.** The document's own *Target Convergence* is *"every one of the 28 sections owned, current, verified within 90 days, **and correctly classified for visibility**"*. Population is measurable; **"correctly classified" is not mechanically checked** — it is exactly the declared-vs-enforced gap **Rule KC8** names, and which Domain 29 records as *"declared and NOT yet enforced"*. Converting *22/28* into *"79% converged"* would assert a completeness THA cannot verify — **reproducing DOC-4's own defect class in the act of fixing it**. The block states coverage, and says so.

---

## 3. DOCUMENTS UPDATED

| Document | Passages | Nature |
|---|---|---|
| [`docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](../../architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md) | **4** — the mandate (§0), §20's Definition of Done checks, §22's Trust Check (×2), §23's status block | Currency correction |
| [`docs/architecture/README.md`](../../architecture/README.md) | **1 sentence** — the Product Knowledge paragraph's closing claim | Currency correction (see § 3.2) |

**No application code, no schema, no migration, no runtime behaviour, no registry content.** Nothing under `docs/product/` was touched: DOC-4 corrects the *architecture*, never the registry it governs.

### 3.1 The distinction the whole item turns on: **historical statements were preserved, not "corrected"**

The document is full of sentences saying `docs/product/` was not created and no capability registered. **Most of them are still true, and changing them would have introduced errors.**

| Class | Passages | Action |
|---|---|---|
| **Statements about what `PKR1`/`PKR2` *themselves did*** — *"This document creates no registry content"* (`:42`), *"This document does not create it"* (`:718`), **§24 Scope Lock**'s exclusion list, and the closing footer | 4 | ✅ **PRESERVED, BYTE-UNTOUCHED.** They are **true**. PKR1/PKR2 defined the registry and built none of it. **PDA1 and PHASE5A did the building, later, under their own authority.** "Correcting" them would have falsely credited PKR1 with work it deliberately refused, and destroyed the scope discipline §24 records |
| **Present-tense claims about the world** — §20's last two checks, §22's *"nothing is populated and no query path exists"*, §23's *"None"* / *"0%"* / retired risks | 4 passages | ✅ **CORRECTED** — these are what DOC-4 exists to fix |

**§20's two checks were preserved verbatim and re-scoped to authoring rather than rewritten.** They are that section's record that PKR1/PKR2 *verified their own refusal to build*. Deleting them would have erased the evidence of the discipline; leaving them unqualified would have kept two falsehoods in the canon. They now carry a date and a correction note.

**§23's original block is preserved beneath the corrected one, in a `<details>` element** — DOC-1's precedent: *"the original text is preserved, struck, so the error is legible rather than erased."*

### 3.2 The Bootstrap carried the same false claim — corrected, and reported

**`docs/architecture/README.md:33` ended: *"The registry is still **defined here and populated nowhere**: `docs/product/` does not exist, and `PKR3` deliberately does not create it."***

**This is the same stale claim, in the mandatory Architecture Bootstrap** — the document `README.md:8` declares *"the first thing to read before any significant investigation, recommendation or implementation"*. It is arguably **worse-placed than the original**: the PKR architecture is read by whoever goes looking; the Bootstrap is read by everyone, first.

**Corrected, and inside DOC-4's scope**, because the README paragraph is the index entry **of the very document DOC-4 owns**. Leaving it would have meant shipping a correction whose own summary contradicted it — **manufacturing the document-vs-document conflict CONV1 § 8 says THA cannot detect**, in the act of closing one. The clause crediting PKR1/PKR2/PKR3 with creating nothing is **kept**, because it is true (§ 3.1).

---

## 4. STALE CLAIMS CORRECTED

| # | Where | Was | Now |
|---|---|---|---|
| 1 | §23 `Current Convergence` | *"**0%** — the registry is defined; no section is populated"* | **POPULATED, NOT COMPLETE** — 151 files, 154 entries, 22 of 28 sections; the four empty sections named; coverage stated, no completeness percentage claimed |
| 2 | §23 `Current Runtime Consumer(s)` | *"**None.** … No capability is registered, no query path is built, no byte reaches a prompt"* | **Registered and live since 2026-07-12 (PHASE5A)** — cited to `capability-registry.ts:430` and `intelligence/index.ts`; reads `product.json` only (Rule PKR21) |
| 3 | §20 Manual verification | *"`docs/product/` **does not exist**"*; *"No registry entry has been populated, no capability registered, no query path built"* | Preserved verbatim, **scoped to authoring (2026-07-11)**, with a correction note naming PDA1 and PHASE5A |
| 4 | §22 Trust Check | *"Could this mislead the user? **Not yet** — nothing is populated and no query path exists"* | **"Yes — as of 2026-07-12, this is live."** The conditions PKR2 anticipated **are now met** |
| 5 | §22 Trust Check | *"§23 states convergence honestly as **0%**"* | Corrected cross-reference; original quoted |
| 6 | §23 `Next Planned Milestone` | *"A coverage-first population workstream: Domains, Pages, Routes, Journeys"* | **Delivered by PDA1.** Next: the four empty sections |
| 7 | §23 Risk 1 | *"Population is never started… an architecture for a registry that does not exist"* | **RETIRED** — population happened |
| 8 | §23 Risk 3 | *"The Companion path is built before the registry has content"* | **RETIRED** — § 4.1 |
| 9 | §0 mandate | *"the Companion **cannot answer a single question about THA**… it has nothing to read"* | Preserved as the problem-as-it-stood, with a dated note: both paragraphs have since been answered |
| 10 | `README.md` | *"`docs/product/` does not exist"* | § 3.2 |

### 4.1 Two findings that improve on CONV1

1. **Risk 3 did not merely fail to occur — the architecture's ordering was obeyed.** §23 required *"The Companion read path comes AFTER content exists — a grounded assistant pointed at an empty knowledge source is worse than an ungrounded one."* **PDA1 populated on 2026-07-11; PHASE5A built the path on 2026-07-12.** Content preceded the path by one day. The rule held, and nobody recorded that it had. **The block was stale in the honest direction too** — it was still warning about a risk the platform had already navigated correctly.
2. **Retiring Risk 1 is what arms Risk 2.** *"Population is never started"* is dead; *"population is started and never maintained"* is now the principal risk — **and DOC-4 is its first instance.** 154 entries now exist to go stale, and this item is proof that a governing document can rot for five days with nobody noticing. The correction says so in the block rather than leaving it as a lesson in a report nobody re-reads.

---

## 5. WHAT THIS ITEM DELIBERATELY DID NOT DO

| Not done | Why |
|---|---|
| **Change any rule, tier, section definition, or boundary** | A currency correction, not an amendment. **Not one rule moved** |
| **Touch §24 Scope Lock or the closing footer** | They record what PKR1/PKR2 did — **still exactly true** (§ 3.1) |
| **Rewrite the mandate (§0)** | A mandate records why a document was written. Rewriting it erases the argument that justified the registry. **Dated, not rewritten** |
| **Claim a convergence percentage** | Would assert a completeness THA cannot verify (§ 2.1) |
| **Populate the four empty sections, or touch `docs/product/`** | DOC-4 corrects the architecture; populating the registry is a separate, authorised workstream |
| **Fix the 38 `PKR23` validator warnings** | Pre-existing registry-content advisories, not this item's, and not architecture |

### 5.1 A third document carries the same false claim — reported, not fixed

**`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md:414`** (PKCA §12 Trust Check) still reads:

> *"`PKR3` adds no claim that Product Knowledge is complete, populated, or enforced: **the registry contains zero entries, `docs/product/` does not exist**, and this extension deliberately does not create it (§9.2, §14)."*

The final clause is **true** (PKR3 created nothing). **The first two are the same false present-tense claim DOC-4 just corrected**, and PKCA is senior to the domain architecture — so a reader can still be told the registry is empty by Platform Governance.

**Left deliberately.** DOC-4's canonical owner is *"the Product Knowledge Registry architecture"* (CONV1), and PKCA is a **different governing document** with a different owner — the same line `DOC-2` drew when it declined to correct `NK2`'s status block under a mandate naming only `NK1`. The README was in scope because it indexes the document DOC-4 owns (§ 3.2); PKCA is not.

> **Recommended as the next `DOC`-class item** (a one-passage PKCA currency correction, docs-only, no dependencies). It is a genuine **governing-document-vs-governing-document conflict** as of today: PKCA says zero entries; the PKR architecture, the SoT Register Domain 29, and the repository all say 154. **Filed here so it is not rediscovered a fourth time** (`PKR1` Risk R7).

---

## 6. NEXT CONV1 ITEM

> ### **`OWN-5` — Pantry has no Source of Truth Register domain at all**

**Why it is next.** P1 (*"Correct the canon"*) is `DOC-1` · `DOC-2` · `DOC-3` · `DOC-4` · `OWN-5`. **The four `DOC` items are now closed; `OWN-5` is the last, and it closes P1** — which unblocks Tier 2 and, with it, `OWN-1` (P4), the largest convergence in the programme.

**What it is.** **Register Rule 1** — *"Every major domain must declare a named source of truth"* — **breached by omission**. `user_pantry_items` is a live, table-owning, runtime-read domain with **no row in the Register**: *"the document that owns ownership does not know the domain exists."* CPI1 found the same of **Benchmarks, Learning and Observations** — while `evidence-learning-store.ts:6` and `capability-registry.ts:725` **assert in shipped code** that their tables are *"SoT-registered under EL1"*. They are not. 🟡 Medium: **a domain with no declared owner cannot be given a new fact (Rule 8)**, so this blocks pantry freshness *independently of Household Time*. Documentation-only; four Register rows; no dependencies.

> **Carry forward:** verify by content, not by line number. CONV1's citations resolved cleanly for `DOC-4` but had drifted for `DOC-2` and `DOC-3`. **And check whether those two code assertions still exist** before repeating them — they are the same class of claim DOC-4 just found rotting.

---

## 7. COMPLIANCE

- **Architecture Bootstrap (STEP 2):** `docs/architecture/README.md` read before any change.
- **STEP 1 — Rollback:** tag + file snapshot created **before any file was touched**; concurrent sessions' uncommitted work in `README.md` preserved (one sentence edited).
- **Rule PKR15 (corrected, never superseded) / Rule PKR18 (the changer updates it):** this item performs, five days late, the duty those rules place on `PDA1` and `PHASE5A`.
- **Rule KC14 (currency is the evidence standard):** the whole content of this item.
- **Core Principle 6 (honest gaps over invented facts):** the four empty sections are **named**, and no completeness percentage is invented (§ 2.1).
- **`REPOSITORY_CONVENTIONS.md`:** filed under `docs/implementation/governance/` by workstream; `repo-structure-verify.sh` passes every `docs/` rule.
- **Product Registry Compliance:** **not applicable** — no product-knowledge *entry* is created, changed, or retired. DOC-4 corrects the architecture that governs the registry, not the registry.
- **Deviations:** two — the README expansion (§ 3.2) and the PKCA refusal (§ 5.1). **Both reported, neither silently applied.**

---

*Implementation completed: 2026-07-16*
*Rollback: `rollback/DOC4-product-knowledge-status-correction-20260716` → `7d1dd2ce`*
*Next CONV1 item: `OWN-5` — declare Pantry + 3 missing Register domains (closes P1)*
