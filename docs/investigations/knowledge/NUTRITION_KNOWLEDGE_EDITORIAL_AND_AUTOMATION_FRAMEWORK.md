# THA Nutrition Knowledge — Editorial & Automation Framework

**Document type:** Architecture investigation (**investigation only — no implementation**).
**Date:** 2026-06-18
**Author role:** Senior nutrition-education product architect + senior Node/Postgres engineer + editorial-systems designer.
**Companion documents (this framework sits *on top* of these — read together):**
- `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` — the curated *content* model and the **nutrient bridge** trust decision.
- `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` — the four-plane KMS (ingest → review → published → staleness) and the **hard wall**.
- `COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` — Tier A / Tier B framing.
- `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md` — weekly aggregation + claim-safety rules.

> **Scope boundary.** The KMS document already specifies *storage, ingestion, the review state machine, the published registry and staleness*. This document does **not** re-specify those. It specifies the **editorial brain** that decides *wording*, and the **automation-maturity curve** that lets THA require less human effort over time **without ever weakening the trust guarantees**. Where the two overlap, the KMS is the system of record and this document refines the human/automation behaviour inside it.

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/nutrition-editorial-automation-20260618` |
| **Tag object SHA** | `ac364274f07693d0713bd768291122a960357bfa` |
| **Points to commit** | `bae3b99` (`bae3b992e021abe32182dcf13f9aff7f1e708a95`) |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard rollback/nutrition-editorial-automation-20260618` |
| **Undo this doc only** | `rm docs/investigations/knowledge/NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` |

**Required rollback steps — completed before investigation began:**

1. ✅ **Git status checked.** No tracked files modified or staged. Four pre-existing untracked artefacts from prior investigations are present (`COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md`, `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md`, `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md`, `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`). The committed tree is clean (`git status --porcelain --untracked-files=no` is empty); these predate this task and are untouched by it.
2. ✅ **Current branch confirmed:** `safety/preserve-since-last-prod-20260617-1613`.
3. ✅ **Rollback tag created:** `rollback/nutrition-editorial-automation-20260618` (object `ac36427`) at `bae3b99`.
4. ✅ **Rollback identifier reported** (above) **before** any investigation work.

**This task makes no code, CSS, route, schema, API, migration, data, or ingestion change, and generates no health claims.** It produces exactly two artefacts: this markdown file and one annotated git tag. Full confirmation in §12 and the Final Report.

---

# SECTION 1 — EXECUTIVE SUMMARY

The brief frames this as *"how do we approve health benefits with less admin effort?"* The honest reframing — and the spine of this document — is:

> **How does The Healthy Apples become a nutrition knowledge system that continuously improves while requiring less and less human intervention, without ever once becoming less trustworthy?**

The central finding is a **separation that the brief blurs and that this framework makes absolute**:

> **THA never automates *truth*. THA automates only *the THA-owned layers*: wording, presentation, citation-attachment, normalisation and triage. The science layer — does this nutrient relate to this outcome, and how strongly — is human-blessed once per *pattern* and never re-decided by a machine.**

This is the same line the companion docs draw ("THA OWNS trust, wording, presentation… THA DOES NOT OWN nutrient science, disease claims, research conclusions"), elevated into the design principle for automation. Everything that becomes autonomous is on the THA-owned side of that line. Nothing on the science side ever becomes autonomous.

**The mechanism that reduces admin effort is not "approve faster" — it is "approve a *pattern* once, then re-apply it mechanically."** An admin blesses a *wording pattern* for a nutrient (e.g. *"`{Nutrient}` contributes to areas including: `{benefit-list}`"* for Magnesium, drawn from EFSA-permitted phrasing). After that, the same pattern applied to *structurally identical, already-sourced* facts is mechanical instantiation, not a new claim — and *that* is what can auto-publish. A **novel** claim, a **new** nutrient↔benefit relationship, a **conflicting** source, or **changed** upstream guidance always returns to a human. Effort falls because the *space of novel decisions shrinks*, not because the bar drops.

**Five components, layered on the existing KMS:**

1. **Trusted Source Registry** (§2) — a tiered, machine-readable source model (refines the KMS `sources` table). Tier 1 official bodies / Tier 2 scientific organisations / Tier 3 reference-only, **plus an orthogonal "wording authority" role for EFSA** that the brief's three-tier model misses.
2. **Editorial Rules Engine** (§3) — a data-driven rulebook (`editorial_rules`) that encodes the THA Style Guide and Nutrition Claim Rules as *enforceable* allow/block/tone/claim-type/threshold rows — the thing that makes wording machine-checkable.
3. **Knowledge Normalisation** (§4) — how raw source text becomes a structured *candidate* (Benefit, Nutrient, Source, suggested wording), and how duplicates and conflicts are resolved deterministically.
4. **Suggested Wording Engine** (§5) — recommendation: **(C) constrained generation** — templates own the *structure and the claim*, AI is allowed only to *select and slot* within a blessed template and is then *validated back through the Editorial Rules Engine before a human ever sees it*. AI never originates a claim.
5. **Admin Blessing + Confidence & Automation** (§6, §7) — a four-phase autonomy curve where blessing graduates from *per-item* → *per-pattern* → *auto-apply-known-pattern* → *exceptions-only*, gated by explicit, measurable confidence metrics, with **anti-drift instrumentation** so autonomy can be *revoked automatically* the moment quality slips.

**The single most important rule for automation, stated once:** *auto-publication is only ever the re-application of a human-blessed pattern to a fact that is identical-in-kind to one a human already published. The first time anything is novel — new nutrient, new benefit, new source, new wording shape, conflicting evidence, changed guidance — it is an exception and a human decides.* This keeps the worst-case failure mode at *"showed slightly stale but once-human-approved wording"*, never *"published an unreviewed claim."*

**Recommendation in one line:** Build the **Editorial Rules Engine** (data-driven, enforceable) and a **constrained Suggested-Wording Engine** (template-owns-claim, AI-slots-only, validated pre-human), governed by **pattern-level blessings** that graduate through a **four-phase confidence-gated autonomy curve** with **automatic autonomy revocation on drift** — all inside the existing four-plane KMS, with the static registry as the standing fallback. Ship it strictly after the KMS review tooling exists, and never let autonomy cross from the THA-owned layer (wording/presentation) into the science layer.

---

# SECTION 2 — TRUSTED SOURCE REGISTRY

## 2.1 Per-source evaluation

This consolidates and extends the source analysis in both companion docs into the single canonical evaluation the brief asks for. (Storage shape = the KMS `sources` / `source_documents` / `source_citations` tables; this section sets the *policy* those rows encode.)

| Source | Purpose for THA | Strengths | Weaknesses | API / access | Refresh | Licensing | Claim suitability | Trust level |
|---|---|---|---|---|---|---|---|---|
| **USDA FoodData Central** | Food → nutrient *composition* | Authoritative for *which nutrients a food contains*; bulk + per-food API; stable IDs | Says nothing about *health outcomes*; US portions/fortification | ✅ REST API (key) | Quarterly | Public domain | **Composition only** — "is a source of X", never "X helps Y" | **High (composition)** |
| **NIH Office of Dietary Supplements (ODS)** | Nutrient → outcome relationships | Gold-standard fact sheets *with explicit evidence grading*; ideal for the nutrient bridge | US English; not food-level | Factsheets (scrape/structured) | ~Twice/yr | US Gov, generally reusable w/ attribution | **Primary for Benefit↔Nutrient links** | **High** |
| **NHS (nhs.uk)** | Consumer-safe UK wording | UK authority; plain, legally-cautious phrasing THA can mirror; UK-first audience | Less granular evidence grading | Pages (scrape) | ~Twice/yr | Crown copyright / OGL (attribution) | **Primary for descriptions + awareness wording** | **High** |
| **British Nutrition Foundation (BNF)** | UK education / corroboration | Non-commercial, consensus-based, THA's voice | Rarely the *sole* novel source | Pages (scrape) | ~Twice/yr | Terms-of-use (attribution) | **Primary (corroborating)** | **High** |
| **EFSA health-claims register** | *Permitted wording* authority | The European authority on which nutrient/health phrasings are *permitted* | Not a discovery source; does not say what's true, only what's *sayable* | Structured register | On register update | EU reuse w/ attribution | **Wording firewall** — gates phrasing, does not author claims | **Authoritative (for wording only)** |
| **Open Food Facts (OFF)** | Branded product / barcode linkage | Huge branded coverage; barcode → product; packaging data | **Crowd-sourced ⇒ lowest trust**; vandalism risk; inconsistent | ✅ API | On demand | **ODbL (share-alike attribution)** | **Composition/linkage only; never sole source for a health claim** | **Low** |
| **Harvard (Nutrition Source)** | Corroboration | High quality, well-referenced | US academic voice; not UK-cautious | Pages | As needed | Copyright (cite, don't relicense) | **Secondary (corroborate, don't lead)** | **Medium** |
| **Examine.com** | Curator reading | Excellent evidence synthesis | Aggregates primary research; partly paywalled | n/a | n/a | Proprietary | **Reference only** — curators read it; cite the *underlying* primary source, never Examine | **Reference only** |
| Blogs / brands / influencers / **AI output** | — | — | Unverifiable, commercial, fabricable | — | — | — | **BANNED — never a source** | **None** |

## 2.2 Should THA tier sources? — challenging the brief's three-tier model

The brief proposes Tier 1 (official bodies) / Tier 2 (scientific organisations) / Tier 3 (reference only). **A pure three-tier ladder is *necessary but not sufficient*, because it conflates two independent axes the table above exposes:**

1. **Trust tier** — *how much we believe a fact from this source.*
2. **Source role** — *what kind of statement this source is allowed to back.*

USDA is highly trusted *for composition* and worthless *for outcomes*. EFSA is authoritative *for wording* but is not a *discovery* source at all. A single ladder cannot express "high trust, but only for nutrient amounts." **Recommend a two-dimensional model**: a trust tier **plus** a role tag.

```
trustTier:  tier1_official | tier2_scientific | tier3_reference | banned
sourceRole: composition | outcome | wording_authority | corroboration | linkage
```

| Source | trustTier | sourceRole(s) |
|---|---|---|
| NHS | `tier1_official` | `outcome`, `wording` (consumer-safe) |
| NIH ODS | `tier1_official` | `outcome` |
| EFSA | `tier1_official` | `wording_authority` |
| BNF | `tier2_scientific` | `outcome`, `corroboration` |
| USDA FDC | `tier1_official` | `composition` |
| Harvard | `tier2_scientific` | `corroboration` |
| Open Food Facts | `tier3_reference` | `composition`, `linkage` |
| Examine | `tier3_reference` | (curator-read only — never cited) |

**Decision rules this unlocks (and a flat ladder cannot):**
- An **outcome** claim requires ≥1 source with `sourceRole ⊇ outcome` at `tier1`/`tier2`. Tier 3 can never solely back an outcome.
- A **composition** fact requires a `composition` source (USDA primary; OFF only for branded items, never alone for a health claim).
- An `established` outcome claim must additionally pass the **`wording_authority`** (EFSA) firewall, or be downgraded to `emerging`.
- `tier3_reference` sources can *corroborate* and *enrich linkage*, never *originate* a health claim.

**Recommended final model:** **two-dimensional — trust tier × source role** — encoded as columns on the KMS `sources` table (`trustTier`, `sourceRoles[]`). It subsumes the brief's three tiers (the tiers remain) and adds the role axis that the real source list demands.

---

# SECTION 3 — EDITORIAL RULES ENGINE

## 3.1 Purpose — make wording *machine-checkable*, not just *documented*

The companion docs already specify the *content* of the wording standard (allowed verbs, banned vocabulary, area-level-only, many-to-many). Today that standard lives as prose in a design doc and in a curator's head. **The Editorial Rules Engine's job is to turn that prose into data that the Suggested-Wording Engine (§5) and the review gate (§6) can mechanically enforce** — so the same rule that a human applies by judgement, a machine applies by lookup. This is the precondition for *any* safe automation: you cannot auto-approve wording you cannot auto-check.

## 3.2 Proposed `editorial_rules` shape (refining the brief's table)

```ts
// Data-driven editorial rulebook. A FUTURE table (KMS conventions: serial pk, text status,
// jsonb blobs, no pgEnum). Created by NO migration in this task — proposal only.
editorial_rules = {
  id,
  category,            // 'benefit_description' | 'benefit_nutrient_link' | 'awareness_note'
                       //  | 'pairing' | 'composition' | 'global'
  claimType,           // 'outcome' | 'composition' | 'culinary' | 'awareness' | 'none'
  allowedPhrases,      // jsonb string[] — the ONLY verbs/frames permitted for this category
  blockedPhrases,      // jsonb string[] — hard-fail vocabulary (regex-backed)
  tone,                // 'plain-uk' | 'educational' | 'cautious'
  structuralRules,     // jsonb — machine-checkable invariants (see §3.4)
  confidenceThreshold, // 0..1 — min pattern-confidence for auto-apply of this category (§7)
  reviewRequired,      // 'always' | 'novel-only' | 'never'  ← the autonomy dial, per category
  efsaCheckRequired,   // boolean — must pass the wording-authority firewall
  sourceRoleRequired,  // 'outcome' | 'composition' | null — gate from §2.2
  version, active, createdAt, updatedAt,
}
```

**Allowed (from the companion standard, now enumerable):** *supports · source of · good source of · rich in · contributes to · associated with · may help · may support · often paired with · pairs well with · best enjoyed.*

**Blocked (hard-fail, regex-backed):** *cures · prevents · treats · protects against · detoxes · guarantees · superfood · fights · combats · heals · reverses · "good for your \[organ/disease]" · any named disease/diagnosis · "clinically proven" · "doctor recommended".*

## 3.3 How extensive should the rules be? — the brief's direct question

**Yes — they should formalise into two named, versioned artefacts, both *data*, not prose:**

1. **THA Style Guide** — `tone`, `allowedPhrases`, register (plain UK English), capitalisation, sentence-length, disclaimer placement. Governs *voice*. Low-risk, broad.
2. **Nutrition Claim Rules** — `claimType`, `blockedPhrases`, `structuralRules`, `efsaCheckRequired`, `sourceRoleRequired`. Governs *safety*. High-risk, narrow, the legally load-bearing set.

Keeping them as **two categories of rows in one engine** (not two codebases) means a single validator enforces both, and the Claim Rules can be locked-down (changes require nutrition sign-off) while the Style Guide evolves freely.

**Challenge — do not over-build.** The temptation is an NLP-grade grammar of nutrition language. Resist it. The engine needs to be *good enough to never let a banned construction through and to validate that a generated sentence matches a blessed template* — not to *understand* nutrition prose. Most safety is delivered by: (a) the blocked-phrase regex set, (b) the structural invariants below, (c) the fact that generation is template-constrained (§5) so the *shape* is known before validation even runs. Aim for a deterministic checker over a finite rule set, not a language model judging language.

## 3.4 Structural invariants (the high-value, low-complexity core)

These catch the dangerous errors that word-lists miss:

- **Area-level only:** an `outcome` line must reference a `health_benefit` *area* slug, never a diagnosis/condition token (deny-list of conditions).
- **Bridge mandatory:** an `outcome` line must name its bridging nutrient — no bare benefit claims (mirrors the nutrient-bridge rule).
- **Many-to-many framing:** outcome wording must use the "*nutrient contributes to areas including…*" frame, never "*food = outcome*".
- **Source presence:** `claimType='outcome'` ⇒ ≥1 linked citation with the required `sourceRole` (ties to §2.2 and the KMS approval gate).
- **Disclaimer co-presence:** any surface rendering an outcome must also render the standing `HEALTH_DISCLAIMER` (checked at the surface contract, not per-row).

**Recommendation:** the Editorial Rules Engine is a **deterministic validator over a versioned `editorial_rules` table**, split into a permissive **Style Guide** category set and a locked **Nutrition Claim Rules** category set, enforcing word-lists *and* structural invariants. It is the gate every piece of wording — human-written or machine-suggested — must pass before it can be blessed or published.

---

# SECTION 4 — KNOWLEDGE NORMALISATION

## 4.1 From source text to Candidate Knowledge

Normalisation is the deterministic transform from a fetched source document into a structured KMS `candidate_knowledge` row. Worked, using the brief's example:

```
RAW (NIH ODS factsheet):
  "Magnesium contributes to normal muscle function."
            │
            ▼  (1) extract & classify
  claimType = outcome
  nutrient  = "magnesium"        ← resolved to controlled vocabulary slug (NOT a free string)
  benefit   = "muscle-function"  ← resolved to an existing health_benefit area slug
  strength  = emerging|established (from the source's own evidence grading, never invented)
            │
            ▼  (2) attach provenance
  sourceDocumentId → the hashed NIH document
  sourceRole = outcome, trustTier = tier1
            │
            ▼  (3) suggest wording (§5) — template-constrained, validated by §3
  "Magnesium contributes to areas including muscle function."
            │
            ▼  (4) land as candidate (publishState='candidate', reviewState='draft')
  EVERY field above is a SUGGESTION a human can edit. Nothing is published.
```

## 4.2 What transformations are needed?

| Transformation | Deterministic? | Notes |
|---|---|---|
| **Entity resolution — nutrient string → controlled-vocab slug** | ✅ Yes (alias table) | Prerequisite for the bridge to connect; `"Mg"`/`"Omega 3"` must resolve to one slug. The #1 silent-failure risk. |
| **Benefit resolution — outcome phrase → area slug** | ⚠️ Mostly | New/unmatched phrases are an **exception** (§8), never auto-coined. |
| **Claim-type classification** | ✅ Yes | composition vs outcome vs awareness vs culinary — drives which rules apply. |
| **Evidence-strength capture** | ✅ Yes — *copied*, never inferred | Strength comes from the *source's* grading. THA never upgrades a source's own strength. |
| **Wording suggestion** | constrained (§5) | Template-owned; AI may only slot; validated by §3 before a human sees it. |
| **Unit / quantity normalisation** (composition) | ✅ Yes | per-100g normalisation for USDA/OFF amounts. |

## 4.3 Duplicate sources — how handled

**Dedupe deterministically on the *fact key*, not the prose.** Fact key = `(claimType, nutrientSlug, benefitSlug | foodSlug)`. Two sources asserting the *same* fact key are **not** a conflict — they are **corroboration**: merge into one candidate carrying *both* citations, and *raise* confidence (more independent tier-1/2 agreement ⇒ stronger). Idempotent re-fetch (same source, unchanged hash) updates `lastChecked` only and creates no new candidate (already specified in the KMS ingestion contract).

## 4.4 Conflicting sources — how handled

**Conflict = same fact key, contradictory assertion** (one says a link exists / is `established`, another contradicts or omits, or two sources give materially different strengths). **A conflict is never auto-resolved by the machine — it is the canonical exception (§8).** Rules:

- **Never silently pick a winner.** Surface both, ranked by `trustTier` × `sourceRole`, to a human.
- **Tier breaks ties for *attention*, not for *truth*.** A higher-tier source doesn't auto-win; it just orders the queue. A human decides.
- **Conservative default while unresolved:** the *lower* claim wins the *display* — i.e., the candidate cannot be published as `established` while a credible source contradicts it; at most it sits `emerging`/hidden, or falls back to nutrients-only.
- **Conflicts block auto-publish for the *whole pattern* touching that fact** until resolved — a conflict is a drift signal (§7.5).

**Recommendation:** normalisation is a **deterministic transform to a structured candidate** keyed on a `(claimType, nutrient, benefit/food)` fact key; **duplicates corroborate and raise confidence; conflicts never auto-resolve and always become a human exception**, with a conservative (lower-claim/ nutrient-only) default while open.

---

# SECTION 5 — SUGGESTED WORDING ENGINE

## 5.1 The decision — template / AI / constrained-generation

The brief asks A (template-based) / B (AI-generated) / C (AI generated then constrained by templates). **Recommend C, but precisely defined — because "C" can mean two very different things and only one is safe:**

| Option | What it means | Verdict |
|---|---|---|
| **A — Pure templates** | Wording is `template(slots)`; no model. e.g. *"`{Nutrient}` contributes to areas including: `{benefit-list}`."* | ✅ **Safe, and the floor.** Fully deterministic, auditable, no fabrication surface. Ships *everything* needed for V1. Limitation: rigid voice. |
| **B — Free AI generation** | A model writes the sentence from the fact + sources. | ❌ **Banned.** Reintroduces the exact failure the whole system exists to prevent: AI-authored health wording. Even "constrained by a prompt" is not constrained by *construction*. |
| **C(naive) — AI writes, template checks after** | Model free-writes, then we lint against §3. | ❌ **Rejected.** A linter can only catch *known-bad*; it cannot prove the *claim* is faithful to the source. AI could produce banned-free but subtly overclaiming prose that passes word-checks. |
| **C(constrained) — template owns the claim; AI selects & slots within it; output re-validated by §3 before any human sees it** | The *claim and structure* are fixed by a blessed template; the model's only freedom is choosing the template and filling enumerable slots (which benefit areas, ordering, register polish) from an allowed set. | ✅ **RECOMMENDED.** |

## 5.2 Why constrained generation, defined as "template owns the claim"

The trust-bearing decision in any nutrition sentence is **the claim** ("magnesium → muscle function, at this strength, area-level"). In C(constrained):

- **The claim is never generated** — it comes from the normalised candidate (§4), which came from a source. The template is a *frame with holes*; the holes are *facts and enumerable choices*, never *assertions*.
- **The model's entire job is selection within bounds:** pick the best-fitting blessed template for this fact-shape, choose which benefit areas to list (from the sourced set), order them, and apply register polish — all from finite, allowed options.
- **Every output is re-validated by the Editorial Rules Engine (§3) *before* it is shown to a human**, so a malformed generation is caught by construction *and* by check.
- **AI is optional, not load-bearing.** If the model is unavailable or distrusted, the engine degrades to **pure templates (A)** with no loss of safety — only of voice variety. This is the standing fallback.

```
candidate fact  ──►  pick blessed template (AI may choose)  ──►  slot sourced facts (AI may order/select)
                                                                          │
                                          §3 Editorial Rules validation ◄─┘   (deterministic, pre-human)
                                                                          │
                                              suggested wording shown to admin for blessing (§6)
```

## 5.3 Worked example (brief's example)

```
Blessed template T-NUTRIENT-AREAS:
  "{Nutrient} contributes to areas including:\n• {area_1}\n• {area_2}\n• {area_3}"
Facts (sourced, normalised):
  nutrient = Magnesium; areas = [Sleep Quality(emerging), Muscle Function(established), Bone Health(established)]
AI's only freedoms: which areas to include (sourced only), order, ≤3 cap.
Output:
  "Magnesium contributes to areas including:
   • Sleep Quality
   • Muscle Function
   • Bone Health"
§3 validation: allowed frame ✅ · no banned tokens ✅ · area-level ✅ · bridge present ✅ · sources present ✅
→ presented for blessing.  (Sleep Quality flagged emerging → hidden/tagged per companion §6.4.)
```

**Recommendation:** **C(constrained) — "template owns the claim, AI selects and slots within a blessed template, output re-validated by §3 before any human sees it," degrading cleanly to pure templates.** AI never originates, upgrades, or asserts a claim; it only chooses and arranges within human-blessed, source-bound frames.

---

# SECTION 6 — ADMIN BLESSING WORKFLOW

## 6.1 The unit of blessing — *patterns*, not just items

The brief's insight ("Approve this wording pattern forever?") is exactly right and is the lever for the whole effort-reduction story. THA admins are not nutrition scientists and have little time, so the workflow must let them **bless a reusable decision once** instead of re-deciding its every instance.

**Two blessing scopes:**

| Scope | What the admin approves | Effect | Reduces effort how |
|---|---|---|---|
| **Item blessing** | *This specific suggested wording, now.* | Publishes one candidate (the KMS publish action). | Baseline. One decision, one publish. |
| **Pattern blessing** | *This template + this claim-frame, for this nutrient (or nutrient class), forever.* | Registers a **blessed pattern**; future *structurally identical, sourced* candidates can be auto-instantiated under it (§7). | One decision now removes *all future identical decisions*. |

A **blessed pattern** = `(editorial template, claimType, nutrient|class, sourceRole requirement, evidence-strength ceiling)`. Crucially it is a blessing of **wording mechanics over an already-sourced relationship** — *it is not a blessing of the science*. The admin is saying *"when a tier-1 source already establishes nutrient N relates to an area, render it with template T"* — they are not adjudicating whether N relates to the area (the source did that).

## 6.2 The blessing surface (internal curator tool — out of consumer-app scope)

Per candidate, three actions (brief's set) **plus** the pattern action:

```
┌──────────────────────────────────────────────── CANDIDATE ────────────────────────────────────────────┐
│ Source: NIH ODS (tier1 · outcome)        Fact: Magnesium → Muscle Function (established)                 │
│ Suggested wording (template T-NUTRIENT-AREAS, §5):                                                        │
│   "Magnesium contributes to areas including: • Sleep Quality • Muscle Function • Bone Health"            │
│ §3 checks: ✅ all pass        Citations: ✅ NIH ODS, ✅ NHS (corroborating)                                │
│                                                                                                          │
│  [ Approve ]   [ Edit wording ]   [ Reject ]          [ ⭐ Bless this PATTERN for Magnesium ]            │
└──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Approve** → item blessing (one publish).
- **Edit wording** → human overrides the suggestion; the *edited* form can itself become the blessed template (the system learns the admin's preferred phrasing).
- **Reject** → declined; kept for audit (KMS `review_events`); a repeated rejection of a pattern is a strong negative signal (§7.5).
- **Bless pattern** → "use this structure globally for Magnesium" — the brief's exact ask.

## 6.3 Can approvals reduce over time? — yes, by three compounding mechanisms

1. **Pattern coverage grows.** Each blessed pattern removes a whole *class* of future decisions. Early on every item is novel; over time most incoming candidates match an existing blessed pattern and need no decision (§7).
2. **Corroboration auto-strengthens.** A new tier-1 source agreeing with an already-published fact (§4.3) needs no claim decision — it just attaches a citation and raises confidence. Admins review only *disagreement*.
3. **Exceptions-only triage.** As patterns mature, the admin's queue is filtered down to genuine novelty and conflict (§8), so volume falls even as the knowledge base grows.

**The effort curve is the inverse of the knowledge curve:** the knowledge base grows monotonically; required decisions per unit of growth fall toward "exceptions only." That is the whole point.

**Recommendation:** the blessing workflow supports **item *and* pattern blessings**; a pattern blessing is a one-time approval of *wording mechanics over an already-sourced relationship* (never of science), captured as a reusable `blessed_pattern`, with Edit-as-learning and Reject-as-signal. Effort reduces by pattern coverage + auto-corroboration + exceptions-only triage.

---

# SECTION 7 — CONFIDENCE & AUTOMATION

## 7.1 The four phases (the brief's progression, with the hard wall preserved)

```
PHASE 1  Everything approved.            Every candidate → human item-blessing. (= KMS launch behaviour)
PHASE 2  Known patterns auto-suggested,  Candidate matches a blessed pattern → wording auto-filled & pre-validated;
         human still approves; notified.  human still clicks approve, but reviews not writes. Effort: read-only.
PHASE 3  Known source + known nutrient +  Candidate matches blessed pattern AND tier1/2 source AND no conflict AND
         known wording → AUTO-PUBLISHED.   confidence ≥ threshold → published with NO click. Human NOTIFIED, can revert.
PHASE 4  Exceptions only.                 Humans see ONLY novelty/conflict/drift. Everything else flows autonomously.
```

## 7.2 The non-negotiable boundary on Phase 3 (the most dangerous part of the brief)

**Challenge: "known source + known nutrient + known wording → auto-published" is safe *only* under a definition the brief does not state.** Auto-publish must mean **re-application of a blessed pattern to a fact that is identical-in-kind to one a human has already published** — *never* the auto-publication of anything novel. Concretely, a candidate may auto-publish in Phase 3 **only if ALL hold**:

1. It matches a **blessed pattern** (§6) exactly — same template, same claim-frame, same nutrient/class.
2. Its claim is **composition** *or* an **outcome relationship a human has already published** for that nutrient↔area (i.e. the *science* was blessed once by a human; this is a *new instance/refresh*, not a new relationship).
3. It carries the **required `sourceRole` at tier1/2** with **no conflicting source** (§4.4).
4. Its EFSA wording-firewall status is **unchanged** from the blessed instance.
5. Pattern **confidence ≥ `confidenceThreshold`** for its category (§7.3) and the category's `reviewRequired = 'novel-only'`.

If *any* fails → it is an **exception** → human (§8). **The first instance of any new nutrient↔benefit relationship is always human-published.** Phase 3 automates the *second-through-Nth structurally identical instance and the refresh*, not the *first claim*. This keeps auto-publish strictly inside the THA-owned layer (wording/presentation/citation refresh) and out of the science layer.

## 7.3 Metrics — what determines confidence, pattern maturity, auto-approval

| Metric | Definition | Drives |
|---|---|---|
| **Pattern instance count** | # times this pattern was *human-approved unedited* | maturity |
| **Edit rate** | fraction of pattern instances a human *edited* before approving | confidence (high edit rate = pattern not trusted) |
| **Reject rate** | fraction rejected | confidence (any non-trivial reject rate caps the pattern at Phase 2) |
| **Source agreement** | # independent tier1/2 sources corroborating, conflicts = 0 | confidence |
| **Time stability** | wall-clock since last edit/reject/conflict on the pattern | maturity (recency of trouble resets it) |
| **EFSA-firewall stability** | wording-authority status unchanged since blessing | gate (any change → drop to Phase 2) |

A simple, auditable composite (not a black box): `confidence = f(instanceCount↑, sourceAgreement↑) × (1 − editRate) × (rejectRate==0) × (no open conflict) × (timeStable)`. **Promotion to Phase 3 for a pattern requires `confidence ≥ threshold` AND `instanceCount ≥ N` AND `editRate ≈ 0` AND `rejectRate == 0` — all of them, conjunctive.** Thresholds live in `editorial_rules.confidenceThreshold` per category, so *outcome* claims can demand far more than *composition* facts (composition may reach Phase 3 quickly; outcome relationships graduate slowly and conservatively, if at all).

## 7.4 How THA avoids silent drift, incorrect wording, overclaiming

| Failure | Mechanism that prevents it |
|---|---|
| **Silent drift** (quality erodes unnoticed) | Every auto-publish writes a `review_events` row and **notifies** a human (Phase 3 is *notify*, not *silent*); a sampled human audit of auto-published rows runs continuously; drift metrics (§7.5) trip auto-demotion. |
| **Incorrect wording** | Generation is template-owned + §3-validated *before* publish; auto-publish only re-uses a *blessed* template; a changed §3 rule re-validates all auto-eligible patterns. |
| **Overclaiming** | Strength is *copied from source, never inferred*; auto-publish cannot *raise* an evidence strength; EFSA firewall gates `established`; the first novel relationship is always human. |

## 7.5 Automatic autonomy *revocation* (the safety mechanism the brief omits)

**Autonomy must be losable automatically, faster than it was gained.** A pattern in Phase 3 is **auto-demoted to Phase 2 (human approval required) immediately** when any of: a new **conflict** appears on its fact key; its **edit/reject rate** rises on sampled audit; its **EFSA status** changes; its **source goes unavailable or its hash changes** (KMS staleness signal); or a periodic **§3 rule update** invalidates it. Demotion is conservative and cheap (a flag flip), needs no human to *initiate*, and is the counterpart to the staleness plane: *staleness flags content; drift flags autonomy*. This asymmetry — slow, conjunctive, human-gated promotion vs. fast, automatic, single-signal demotion — is what makes increasing autonomy safe.

**Recommendation:** a **four-phase, per-pattern, per-category autonomy curve** gated by **conjunctive confidence metrics**, where **Phase 3 auto-publish is strictly the re-application of a human-blessed pattern to a structurally identical, conflict-free, tier1/2-sourced fact** (never a novel claim), with **continuous sampled audit + automatic autonomy revocation on any drift signal.**

---

# SECTION 8 — EXCEPTION HANDLING

## 8.1 What always requires a human

| Exception | Why it can never be automated |
|---|---|
| **Conflicting sources** | Adjudicating contradictory evidence is a science judgement (§4.4). |
| **New nutrient** | Coining a controlled-vocab entry + its visibility/bridging policy. |
| **New Health Benefit area** | Defining a new outcome node is an editorial+science act. |
| **New Nutrition Context type** | New `reason`/awareness category needs a wording decision. |
| **Contradictory evidence** (vs. a *published* fact) | Could require *retracting* a live claim — highest stakes. |
| **New claim category** | A claim-type the Editorial Rules Engine has no rule for. |
| **First instance of any nutrient↔benefit relationship** | The science is being asserted for the first time (§7.2). |
| **EFSA-firewall status change** | The sayable-set changed; all dependent wording must be re-judged. |

## 8.2 How exceptions are surfaced

Exceptions are the **only** thing a Phase-4 admin sees — a single prioritised **Exception Queue** on the internal curator dashboard (extends the KMS review inbox), ordered by stakes:

1. **Critical** — contradiction against a *published* claim; EFSA status change invalidating live wording. *(May trigger immediate fallback to nutrients-only for the affected fact while open — the companion fallback contract.)*
2. **High** — conflicting sources on a new fact; new claim category.
3. **Medium** — new nutrient / benefit / context type awaiting definition.
4. **Low** — pattern proposed for blessing; emerging-evidence review.

Each exception carries its full provenance (sources, tiers, §3 results, the blessed pattern it failed) so the decision is *informed and fast*. **An unresolved exception never auto-resolves and never blocks the rest of the queue** — it holds *its* fact at the conservative default (nutrients-only / unpublished) while everything else flows.

**Recommendation:** a single **stakes-ordered Exception Queue** is the Phase-4 human surface; the eight exception classes above are permanently human; unresolved exceptions hold their own fact at the safe fallback without blocking others.

---

# SECTION 9 — PUBLISHED REGISTRY

## 9.1 The published model (system of record = KMS §3.5)

This framework does not re-define the published registry — the KMS document already specifies `published_registry` (versioned, `isLive`, immutable, the only thing the app reads) and `published_snapshots`. This section adds the **editorial/automation metadata** a published entry must additionally carry so trust and autonomy are auditable end-to-end:

| Published entry contains (KMS) | + Editorial/automation metadata (this framework) |
|---|---|
| Health Benefit, Nutrient, Food, Nutrition Context | `blessedPatternId` (which pattern produced it, if any) |
| Source citations (with `trustTier` × `sourceRole`) | `publishMode`: `human-item` \| `human-pattern` \| `auto-phase3` |
| Approved wording | `templateId` + `templateVersion` (which §5 template) |
| Last reviewed, trust metadata | `editorialRulesVersion` it passed; `confidenceAtPublish` |
| | `efsaClaimRef` / firewall status at publish |

This makes every live string answer: *which source, which tier, which template, which rule version, blessed by whom or auto-published under which pattern, at what confidence.* Full provenance for the THA-owned layer, on top of the KMS's content provenance.

## 9.2 Should all five surfaces read from `published_registry`? — yes, unconditionally

**Yes — all of Plant Diversity, Pantry Explore, Weekly Nutrition Report, Simply Better Choices, and Analyser read EXCLUSIVELY from the published registry, through the single shared read seam, with the static registry as fallback.** This is already the KMS §7 rule and it is reaffirmed here without exception:

- **One read seam, never per-surface forks.** No surface ever queries candidate, review, editorial-rule, pattern, or staleness tables. Those are internal-only.
- **Nutrient bridge preserved on read.** Surfaces compose `food→nutrient` (published) + `benefit→nutrient` (published); they never read a stored `food→benefit` claim.
- **Hard fallback.** Unpublished / inactive / emerging-hidden / open-exception ⇒ nutrients-only + safe empty state ⇒ static registry if the published registry is empty/unreachable.
- **Automation is invisible to the app.** Whether a row was human-blessed or auto-published in Phase 3 changes *nothing* the user sees — the read seam returns published wording either way. Autonomy is an *internal* property; the app reads only *published-or-not*.

**Recommendation:** **all five surfaces read only the published registry via one shared seam, nutrient-bridge-composed, with the standing nutrients-only/static fallback** — and published entries carry full editorial+automation provenance so any live string is traceable to source, template, rule version, and publish mode.

---

# SECTION 10 — ROADMAP TO AUTONOMOUS CURATION

## 10.1 What "autonomous" can and cannot mean

**Autonomous curation, correctly scoped, means:** the system *discovers, normalises, suggests wording for, corroborates, refreshes, and re-publishes* knowledge with little human input — *within the bounds of relationships a human has already blessed* — and *escalates everything novel or contradictory to a human.* It does **not** mean a machine deciding nutrition science. The asymptote is **"a knowledge base that maintains and grows itself, where humans only ever make genuinely new editorial/science decisions."**

## 10.2 What becomes automatic vs. stays human

| Becomes automatic (THA-owned layer) | Stays human responsibility (forever) |
|---|---|
| Fetch, hash, staleness detection (KMS) | Deciding a *new* nutrient↔benefit relationship is true |
| Entity resolution to controlled vocab | Coining new nutrients / benefit areas / context types |
| Claim-type classification | Adjudicating conflicting / contradictory sources |
| Wording suggestion within blessed templates | Blessing a *new* wording pattern (the first time) |
| Re-applying a blessed pattern to identical sourced facts (Phase 3) | Retracting / changing a *published* claim |
| Attaching corroborating citations; raising confidence | Responding to EFSA wording-authority changes |
| Auto-demoting autonomy on drift | Setting `editorial_rules` (esp. Nutrition Claim Rules) |
| Refreshing wording when source unchanged | Final nutrition/legal sign-off before claim-bearing cutover |

## 10.3 Build order (gated, each behind its own rollback point)

| Stage | Scope | Phase reached | Risk |
|---|---|---|---|
| **E0** | Stand up `editorial_rules` (data) + the deterministic §3 validator. No generation yet. | — | Low |
| **E1** | Pure-template (§5 option A) suggestion in the curator tool; item blessing only. | Phase 1 | Low |
| **E2** | Pattern blessing (`blessed_pattern`) + auto-suggest on match; human still approves. | Phase 2 | Low–Med |
| **E3** | Constrained generation (§5 C) feeding the template slot-selection; still Phase 2. | Phase 2 | Med |
| **E4** | Confidence metrics + sampled audit + **auto-demotion** wiring (revocation before autonomy). | Phase 2 | Med |
| **E5** | Phase-3 auto-publish for **composition** facts only (lowest claim risk), conjunctive gates live. | Phase 3 (comp) | Med |
| **E6** | Phase-3 auto-publish for **outcome** facts that re-instance a human-blessed relationship; EFSA firewall stability gate enforced. | Phase 3 (outcome) | **High** |
| **E7** | Exceptions-only operation; everything else autonomous within blessed bounds. | Phase 4 | Med (steady-state) |

**Rationale:** build *revocation before autonomy* (E4 before E5), automate the *least-risky claim type first* (composition before outcome), and never let outcome auto-publish (E6) ship without nutrition/legal sign-off. Each stage degrades cleanly to the prior one.

## 10.4 How THA maintains trust, transparency, accuracy as it automates

- **Trust** — the hard wall (KMS) and the science/THA-owned line (this doc) are *structural*, not procedural; automation fills only the THA-owned side. The static registry remains the standing fallback.
- **Transparency** — every published row carries publish-mode + pattern + template + rule-version provenance (§9.1); every auto-publish *notifies* a human and is sampled-audited; nothing is silent.
- **Accuracy** — strength is copied not inferred; corroboration raises confidence, conflict revokes autonomy; staleness + drift both feed conservative, automatic de-escalation; the worst case stays *"slightly stale but once-human-approved"*.

**Recommendation:** evolve through **E0→E7**, automating only the THA-owned layer, building **autonomy-revocation before autonomy-grant**, composition-before-outcome, with full per-row provenance and a permanent human responsibility set — reaching a steady state of *self-maintaining knowledge, human-only exceptions.*

---

# SECTION 11 — TRUST & CLAIM SAFETY

Inherited unchanged from the companion docs and made enforceable by this framework's engines:

- **No unsupported claims** — §3 `sourceRoleRequired` + KMS approval gate; no outcome publishes without a tier1/2 `outcome` citation.
- **No AI-published / AI-authored claims** — §5: AI selects/slots within blessed templates only, never originates a claim; every approve/publish (and every pattern blessing) is a human `review_events.actorUserId`; Phase-3 auto-publish only *re-applies* a human-blessed pattern to an already-human-established relationship.
- **No disease/diagnosis language** — §3 blocked-phrase regex + area-level structural invariant.
- **Source required, evidence copied not inferred** — §4; autonomy can never raise a strength or coin a relationship.
- **EFSA wording firewall** — §3 `efsaCheckRequired`; firewall change auto-demotes dependent autonomy (§7.5).
- **Fallback to nutrients-only** — §9; unpublished / open-exception / drift-demoted facts degrade to real nutrients, then to the static registry.

**Trust check on this document:** it contains **no health claims, no per-food benefit assertions, and no AI-generated nutrition statements.** Every nutrition string herein (e.g. the Magnesium example) is a *structural illustration of mechanism*, drawn from the companion docs' already-sourced examples, not a new claim. ✅

---

# SECTION 12 — DATA & CHANGE IMPACT DECLARATION

- **No code, CSS, route, API, schema, migration, or data change.** All tables/shapes (`editorial_rules`, `blessed_pattern`, the §9 metadata columns) are **proposals for future migrations** — none created.
- **No ingestion run, no source fetched, no candidate created, no claim published, no AI invoked.**
- **No commits beyond the rollback tag.** Exactly two artefacts produced: this file and the annotated tag `rollback/nutrition-editorial-automation-20260618`.

---

# SECTION 13 — RISKS

| # | Risk | Phase/Stage | Severity | Mitigation |
|---|---|---|---|---|
| R1 | **Phase 3 auto-publishes a *novel* claim** (mis-scoped automation) | E5–E6 | **Critical** | §7.2 conjunctive gates; first-instance-always-human; composition-before-outcome; sign-off at E6. |
| R2 | **AI originates/overclaims wording that passes word-lists** | E3+ | **Critical** | §5 template-owns-claim (not lint-after); §3 structural invariants; AI degradable to pure templates. |
| R3 | **Silent drift** — autonomous quality erodes unnoticed | E5+ | **High** | §7.5 auto-demotion on any drift signal; notify-not-silent; continuous sampled audit. |
| R4 | **Pattern blessing mistaken for science blessing** | E2+ | **High** | §6.1 a pattern blesses *wording over an already-sourced relationship*, never the science; relationship's first instance is always human. |
| R5 | **Conflicting sources auto-resolved** | E1+ | **High** | §4.4 conflicts never auto-resolve; conservative lower-claim default; conflict revokes pattern autonomy. |
| R6 | **EFSA wording-authority change leaves stale live wording** | E6+ | **High** | §7.5 firewall-change auto-demotes; §8 critical exception → fallback to nutrients-only while open. |
| R7 | **Nutrient/benefit string drift breaks the bridge** | E0+ | **Med** | controlled-vocab entity resolution (§4.2); unmatched → exception, never auto-coined. |
| R8 | **Editorial rules over-engineered** (NLP-grade) before value delivered | E0 | **Med** | §3.3 deterministic finite checker, not a language model; structural invariants over grammar. |
| R9 | **Confidence metric gamed / too lenient** (esp. low instance counts) | E4–E5 | **Med** | conjunctive promotion; per-category thresholds; outcome demands far more than composition; recency resets maturity. |
| R10 | **Curator over-trusts the queue** (rubber-stamps in Phase 2) | E2+ | **Med** | Edit-as-learning surfaces disagreement; reject-rate caps autonomy; sampled audit independent of the queue. |
| R11 | **Provenance gaps** make a live string untraceable | E5+ | **Low** | §9.1 publish-mode/pattern/template/rule-version stamped on every published row. |

---

# SECTION 14 — FINAL RECOMMENDATION

**Proceed to design-approval for an Editorial & Automation Framework that automates only the THA-owned layer (wording, presentation, citation-refresh, normalisation, triage) and never the science layer.** Build it as:

1. a **two-dimensional Trusted Source Registry** (trust tier × source role),
2. a **data-driven Editorial Rules Engine** (a deterministic validator over a versioned `editorial_rules` table, split Style-Guide / Nutrition-Claim-Rules),
3. a **constrained Suggested-Wording Engine** (template owns the claim; AI selects/slots within blessed templates; §3-validated pre-human; degradable to pure templates),
4. a **pattern-based Admin Blessing** workflow (bless wording-mechanics-over-sourced-relationships once, re-apply forever), and
5. a **four-phase, per-pattern autonomy curve** gated by conjunctive confidence metrics, where **Phase-3 auto-publish is strictly the re-application of a human-blessed pattern to a structurally identical, conflict-free, tier1/2-sourced fact**, protected by **automatic autonomy revocation on drift** and continuous sampled audit.

Everything rides inside the existing four-plane KMS and behind the hard wall; the static registry is the standing fallback; the worst-case failure is *"slightly stale, once-human-approved wording"* — never an unreviewed or fabricated claim. **Do not begin implementation under this task.** Open E0 (editorial rules + validator) as a separate, approved work item with its own rollback point; do not ship outcome auto-publish (E6) without explicit nutrition/legal sign-off.

---

# FINAL REPORT (required answers)

| # | Required item | Result |
|---|---|---|
| 1 | **Rollback identifier** | Tag `rollback/nutrition-editorial-automation-20260618` · object `ac364274f07693d0713bd768291122a960357bfa` · at commit `bae3b99`. Restore: `git reset --hard rollback/nutrition-editorial-automation-20260618`. |
| 2 | **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| 3 | **Recommended trusted source model** | §2 — **two-dimensional: trust tier (`tier1_official`/`tier2_scientific`/`tier3_reference`/`banned`) × source role (`composition`/`outcome`/`wording_authority`/`corroboration`/`linkage`)**. Subsumes the brief's three tiers and adds the role axis the real source list (USDA composition-only, EFSA wording-only) demands. Outcome claims need tier1/2 `outcome`; tier3 can only corroborate. |
| 4 | **Recommended editorial rules engine** | §3 — a **deterministic validator over a versioned `editorial_rules` table**, split **THA Style Guide** (permissive: tone/allowed phrases) and **Nutrition Claim Rules** (locked: blocked phrases + structural invariants — area-level, bridge-mandatory, many-to-many, source-present, EFSA-checked). Finite rule set, not an NLP model. |
| 5 | **Recommended wording engine** | §5 — **C(constrained): template owns the claim; AI may only select a blessed template and slot/order sourced facts within it; every output re-validated by §3 before any human sees it; degrades cleanly to pure templates.** AI never originates, upgrades, or asserts a claim. |
| 6 | **Recommended admin workflow** | §6 — **item *and* pattern blessings.** A pattern blessing approves *wording mechanics over an already-sourced relationship*, captured as a reusable `blessed_pattern`; Edit-as-learning, Reject-as-signal. Effort falls via pattern coverage + auto-corroboration + exceptions-only triage. |
| 7 | **Recommended automation phases** | §7 — **four-phase, per-pattern, per-category curve** (1 all-approved → 2 auto-suggest+human-approve → 3 auto-publish blessed patterns → 4 exceptions-only), with **Phase-3 strictly the re-application of a blessed pattern to a structurally identical, conflict-free, tier1/2-sourced fact (never a novel claim)**, conjunctive confidence gates, and **automatic autonomy revocation on drift**. |
| 8 | **Recommended stale-data detection** | §7.5 + §8 — reuse the KMS alert-only staleness plane; additionally **drift signals (new conflict, rising edit/reject, EFSA change, source hash/availability change, §3 rule update) auto-demote a pattern's autonomy** (fast, automatic, single-signal) — the asymmetric counterpart to slow, conjunctive, human-gated promotion. Critical changes drive a fact to nutrients-only fallback while open. |
| 9 | **Recommended published registry** | §9 — **all five surfaces read EXCLUSIVELY from the KMS `published_registry` via one shared, nutrient-bridge-composed read seam**, static fallback standing; published rows additionally carry **editorial/automation provenance** (`publishMode`, `blessedPatternId`, `templateId`+version, `editorialRulesVersion`, `confidenceAtPublish`, EFSA status). Automation is invisible to the app. |
| 10 | **Recommended autonomous roadmap** | §10 — **E0→E7**: editorial rules+validator → pure-template suggest → pattern blessing → constrained generation → confidence+**auto-demotion (revocation before autonomy)** → Phase-3 composition auto-publish → Phase-3 outcome auto-publish (gated by sign-off) → exceptions-only steady state. Automate only the THA-owned layer; a permanent human-responsibility set remains. |
| 11 | **Risks** | §13 — Critical: R1 mis-scoped Phase-3 (novel claim auto-published), R2 AI overclaim past word-lists. High: R3 silent drift, R4 pattern-vs-science confusion, R5 auto-resolved conflicts, R6 stale EFSA wording. Mitigations: conjunctive gates, template-owns-claim, auto-demotion, first-instance-always-human, conservative fallback. |
| 12 | **Confidence level** | **High** on the architecture and the trust boundaries — they extend code-verified companion designs (nutrient bridge, four-plane KMS, fallback contract) and the central science/THA-owned separation is structural. **Medium** on exact confidence thresholds and the precise pattern-maturity formula — these are operational tuning that must be set with nutrition sign-off and observed data, not guessed. **Highest-confidence single assertion:** auto-publication must never cross from re-applying a blessed pattern into authoring a novel claim. |
| 13 | **Confirmation: no code/schema/data changes made** | ✅ **Confirmed.** No code, CSS, route, API, schema, migration, data, ingestion, or AI-generated health claim. No commits beyond the rollback tag. Exactly two artefacts: this markdown file and the annotated tag `rollback/nutrition-editorial-automation-20260618`. |

---

## TRUST CHECK (brief's required self-audit)

- **Could this mislead users?** Potentially — *mitigated*: trusted-source tiering, enforceable editorial rules, full approval/provenance history, clear citations, and the hard wall + science/THA-owned line.
- **Could this fabricate certainty?** Potentially — *mitigated*: no unsupported claims, source citations required, strength copied-not-inferred, constrained (template-owned) wording, autonomy never raises a claim.
- **Is anything guessed but shown as real?** **No** — generation is template-bound and §3-validated; auto-publish only re-applies human-blessed patterns; unpublished/exception/drift facts fall back to real nutrients.
- **What happens if the system is wrong?** **Fallback:** hide unpublished claims; auto-demote autonomy; surface stale/drift warnings *internally*; degrade to nutrients-only, then to the static registry. Worst case is *slightly-stale, once-human-approved* — never unreviewed or fabricated.

---

**Investigation completed:** 2026-06-18
**Rollback available:** `git reset --hard rollback/nutrition-editorial-automation-20260618`
**STOP — investigation complete. No implementation performed.**
