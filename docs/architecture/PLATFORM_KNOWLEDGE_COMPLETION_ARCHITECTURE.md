# THA Platform Knowledge Completion Architecture

**Status:** GOVERNING ARCHITECTURE — promoted from investigation `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE_INVESTIGATION.md` (workstream `EWO-PKCA1`), 2026-07-03. No code, schema, runtime, or API changes.
**Extended:** 2026-07-11 (`PKR3`) — **Product Knowledge** is admitted as a first-class platform knowledge domain, alongside Food, Nutrition, Recipes and Household Knowledge (§9). Its canonical owner is the **Product Knowledge Registry**, governed by [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md). No new governance scheme is created; the existing one is applied to a domain that never had it. Rows added to §1.1, §2.1, §3.1, §6.1, §7; new §4.3 and §9.
**Classification:** Platform Governance (canonical, cross-cutting — applies to every knowledge domain, not Food Intelligence-specific)
**Governing documents:** `docs/architecture/ARCHITECTURE_PRINCIPLES.md`, `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `docs/architecture/ENGINEERING_WORKFLOW.md`, `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`, `docs/architecture/PLATFORM_QUALITY_ARCHITECTURE.md`
**Domain architectures governed by this document:** WS0X (Food), WS4B/NK1/NK2 (Nutrition), FS1/FS2 (Recipes), EL1/EL2 (Household Evidence), **`PKR1`/`PKR2` (Product Knowledge — §9)**
**Source investigation:** `docs/investigations/platform/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE_INVESTIGATION.md`

---

## 0. MANDATE

**Every knowledge domain THA ships must grow through the same graduation pipeline, be governed by the same three-layer evidence chain, and be spoken by exactly one adapter — regardless of which team builds it or which knowledge type it holds.**

This document does not invent a new governance scheme. It names one that THA has already built correctly, four separate times, without ever writing down that it is one scheme: WS0X's food-catalogue promotion levels, WS4B's nutrition-fact evidence lifecycle, FS1/FS2's recipe-licensing lanes, and EL1/EL2's household-evidence lifecycle. Each was designed independently, and each arrived at the same underlying shape — candidate → gate → confirm → publish, with rejection as a first-class terminal state, never a silent retry. This is the same discipline the Source of Truth Register applies to fact *ownership* (one owner, no duplication) and `PLATFORM_QUALITY_ARCHITECTURE.md` applies to *quality* (one enforcement seam per dimension), generalised to a third axis: **knowledge completeness is a platform-owned pipeline shape, not a per-domain invention.**

This document does not replace the SoT Register, WS0X, WS4B, FS1/FS2, or EL1/EL2. It **names, generalises, and closes gaps between** them, and gives the next knowledge-heavy workstream (Preparation Knowledge, a future Signals Gateway, a future Community capability) one place to read before inventing a fifth variant of a pattern that already exists four times.

### 0.1 The `PKR3` extension — the domain the mandate always covered and never named

The mandate above says *every* knowledge domain THA ships. For three years it has been read as though it meant every domain of knowledge **about the world** — food, nutrition, recipes, and what a household does. There is a fifth body of knowledge THA ships, and it has never been governed by anything: **the knowledge of what The Healthy Apples itself is.**

That knowledge exists. It is shipped in every page, journey, capability, dialog, hidden surface, marketing claim, and screenshot the product has. What it has never had is an owner — so it is reconstructed from code and 380+ investigations on every ask, and retained nowhere. Measured against this document's own rules it fails all of them: it has no Candidate stage, no Gate, no Confirmation authority, no Published form (§1); it has many mouths and no adapter (§2); it has no MVF bar (§3); it has no evidence standard (§4); and it therefore has no completion criterion (§6). It is not a small domain with gaps. It is a domain with no pipeline at all.

`PKR3` admits it as one. **Product Knowledge becomes a first-class platform knowledge domain, on the same footing and under the same rules as the four that came before it**, and its canonical owner is the **Product Knowledge Registry** — defined by [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md) (`PKR1`, enhanced by `PKR2`), which stands to Product Knowledge exactly as NK1/NK2 stand to Nutrition and FS1/FS2 stand to Recipes: the domain's own architecture, subordinate to this one.

**This extension creates no new governing scheme, and no new architecture document.** Every rule Product Knowledge obeys — KC1 through KC11 — already existed. §9 does one thing: it applies them, names what each stage *is* for this domain, and points at the registry that owns the result. Where the registry's own mechanisms are concerned (its sections, entry spine, permission tiers, Companion query path, folder structure), this document **cites `PKR1`/`PKR2` and restates none of it** — because restating it would create the second owner that Rule PKR13 exists to forbid, in the very document that admits the rule.

---

## 1. THE KNOWLEDGE GRADUATION PIPELINE

Every knowledge entity in THA — a food, a nutrition claim, a recipe, a detected household pattern, **a fact about THA itself**, and every future knowledge type — moves through the same four stages. This is not a new mechanism; it is the shape already proven by four independent implementations, named here for the first time as one canonical pipeline.

```
   ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐     ┌───────────────┐
   │  1 CANDIDATE │ ──▶ │  2 GATED     │ ──▶ │  3 CONFIRMED /    │ ──▶ │  4 PUBLISHED  │
   │  raw input,  │     │  structural/ │     │    PROMOTED       │     │  visible,     │
   │  not yet a   │     │  automated   │     │  human decision   │     │  distinguish- │
   │  platform    │     │  filter —    │     │  or explicit      │     │  able from    │
   │  fact        │     │  never a     │     │  confirmation —   │     │  unpublished  │
   │              │     │  guess       │     │  never automatic  │     │               │
   └──────────────┘     └──────┬───────┘     └─────────┬─────────┘     └───────────────┘
                                │                        │
                                ▼                        ▼
                         ┌─────────────┐          ┌─────────────┐
                         │  DECLINED / │          │  NEEDS      │
                         │  BLOCKED    │          │  REVIEW     │
                         │  (terminal, │          │  (queued,   │
                         │  never re-  │          │  not lost)  │
                         │  asked      │          │             │
                         │  silently)  │          │             │
                         └─────────────┘          └─────────────┘
```

**Rule KC1 — Four stages, always.** Every knowledge-entity domain names its own Candidate source, its own structural Gate, its own Confirmation authority, and its own Published form. A domain that skips a stage (e.g. auto-publishing a candidate with no gate, or gating without a rejection path) has not built a knowledge pipeline — it has built a fabrication risk.

**Rule KC2 — Rejection is terminal, not silent.** A candidate that fails the gate, or a pattern a household declines, does not get silently re-asked on the next run. It is a named, first-class outcome (`blocked`, `declined`, `needs_review`) — never dropped, never retried without new evidence.

**Rule KC3 — Published is visibly distinct from unpublished.** A user-facing surface must never be able to confuse a `draft`/`pending_confirmation`/`needs_review` fact with a `published`/`confirmed` one. Where no visible distinction is possible yet, the fact does not render (Principle 6 — honest gaps).

### 1.1 The four existing instances, mapped onto the canonical pipeline

| Domain | 1. Candidate | 2. Gated | 3. Confirmed/Promoted | 4. Published | Terminal rejection |
|---|---|---|---|---|---|
| **Food catalogue** (WS0X.10) | USDA FDC raw ingestion | `validateCanonicalSeed()` (identity/context completeness) | `validatePromotion()` → `auto_promote / h1_qualify / needs_review` | Level 1 (MVF) live, Level 2/3 additive | `blocked` |
| **Nutrition facts** (WS4B, inherited by WS5A/WS6) | `candidate` | `draft → in_review` (evidence strength + wording-firewall check) | `approved` (editorial sign-off) | `published` | `deprecated` |
| **Recipes** (FS1/FS2, `THA_RECIPE_ACQUISITION_ARCHITECTURE.md`) | Acquired via a named lane (`tha_library`/`licensed_discovery`/`personal_cookbook`/`community_cookbook`) | Licence-state check (`owned/licensed/conditional` callable; `pending_review/unlicensed` not) | Lane-appropriate storage-policy applied (`import/cache_ttl/link_only`) | Row answers "under what right does THA hold this?" | `unlicensed` (forbidden, never silently imported anyway) |
| **Household evidence** (EL1/EL2) | `report` (an Evidence event) | `MIN_EVIDENCE_COUNT`(3) + `MIN_CONSISTENCY`(70%) structural bar | `approve` (strong confirmation tier, explicit household decision) | Confirmed Understanding, always carrying `rationale`/`supportingEventIds` | `declined` (never silently re-asked while evidence keeps accumulating) |
| **Product Knowledge** (`PKR1`/`PKR2`, added `PKR3` — §9) | A **discovery**: an investigation, audit, or implementation finds a surface, capability, journey, claim, or asset that THA ships | Entry-spine completeness — `id`, `name`, `section`, `status`, **`visibility`**, `purpose`, `owner`, `sources` all present and well-formed (`PKR1` §7). A discovery missing any of them is not yet an entry | The **named human owner** (`PKR1` Rule PKR12) accepts the entry and, with it, accountability for it being true *now*. Never automatic — a discovery does not become owned knowledge by being written down | A live entry in the Product Knowledge Registry (`docs/product/`), composed into the Companion's Context View **at its own visibility tier** (`PKR2` §12) | `declined` (discovered, judged not product knowledge, and **recorded as such** — see Rule KC12) and `retired` (`PKR1` Rule PKR14 — replaced in the same change that introduces its successor, and never composed again) |

**Why this table matters going forward:** a new knowledge domain (Preparation Knowledge, a Signals Gateway, Community) does not need to invent Candidate/Gate/Confirm/Publish semantics from scratch — it fills in a new row of this table, using whichever existing instance is the closest analogue (Preparation Knowledge, per `WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md`, is closest to the Nutrition Facts row: existence is a cheap Candidate, *effect* is the evidence-gated claim). Product Knowledge is the first domain to be added this way, and it is the proof the table was worth writing: it invented no lifecycle, and it took its Gate from the Food row (a structural completeness check, exactly like `validateCanonicalSeed()`) and its Confirmation from the Household row (an explicit, named act of acceptance, never a threshold).

> **Rule KC12 — A declined discovery is recorded, not forgotten.** This is Rule KC2 (rejection is terminal, not silent) applied to a domain whose Candidates are produced by *audits*. When a discovery is judged not to be product knowledge — because it belongs to another owner (`PKR1` §3.2), or because it is not a thing THA ships — that judgement is written down where the next audit will find it. Otherwise every audit rediscovers it, re-asks the same question, and the platform pays for the same decision forever. A discovery that is silently dropped has not been declined; it has been mislaid, and it will be back.

---

## 2. CANONICAL KNOWLEDGE OWNERSHIP

This document adds one rule to the Source of Truth Register's existing ownership model — it does not replace it.

**The SoT Register already answers:** *which store owns a fact* (Rules 1–8, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` Phase 6). That remains unchanged and is the senior rule.

**This document adds the surface-level complement:** *which adapter is allowed to speak that fact to a user.*

> **Rule KC4 — One owner, one mouth.** Every knowledge entity type has exactly one owning store (per the SoT Register) **and** exactly one runtime adapter that is the sole surface permitted to render facts about it. Every consuming surface calls that adapter; no surface re-derives, re-phrases, or independently queries the underlying store for the same fact.

This generalises `WS6_CANONICAL_FOOD_REPORT_ARCHITECTURE.md`'s "the report is the only mouth" rule — previously scoped only to Food Reports — into a platform-wide rule, because the identical failure mode recurs anywhere a fact has more than one narrator: three different phrasings of the same food fact across Plant Diversity/Pantry/Explore (the SoT Register's own 🔴-rated Food Knowledge duplication), a future recipe surface re-deriving licence/attribution text independently, or a future Analyser surface inventing its own additive commentary alongside `food_knowledge`'s.

### 2.1 The "one mouth" register (adapters that already exist)

| Knowledge entity type | Owning store (SoT Register) | The one mouth (adapter) |
|---|---|---|
| Food (nutrition + identity composed) | `shared/knowledge/` + `shared/canonical/` | `shared/canonical/food-report-adapter.ts` (`buildFoodReport`) |
| Meal | `meals` table | `meal-intelligence-assembler.ts` |
| Product (barcode/UPF) | live recompute, no persisted result | `product-analysis.ts`/`upf-analysis-service.ts` (recomputed, never cached as a second copy) |
| Household evidence/pattern | `household_evidence_events`/`household_learning_signals` | `evidence-learning/framework.ts`'s `rationale`+`supportingEventIds` contract (§7, ET6) — the "mouth" is structural: no signal may render without its own evidence trail attached |
| Platform/developer documentation | `docs/`, DB knowledge tables | The Intelligence Platform's derived knowledge index (TIP1 §3) — not yet built, but already designed as the one read projection |
| **Product Knowledge** (what THA *is*) — added `PKR3` | **The Product Knowledge Registry**, `docs/product/` — authored as `inventory/product.yaml`, generated to `inventory/product.json` (`PKR1` §18). One new row in the SoT Register (`PKR1` §4.2); no store loses one | **The registry entry itself** for a human reader; for the language model, the **Product Knowledge Capability's Context View, composed by INT17** (`PKR2` Rules PKR20/PKR21) — the only path by which a product fact may reach a prompt |

Any knowledge entity type in Part 1 of the companion investigation with no row in this table yet (Food Relationships, Preparation Knowledge, Recipe detail/licence attribution, Retailer/Partner data) is an open item for the roadmap (§7) — not a violation today, because none of those surfaces currently has *more than one* narrator. The rule exists so that the moment a second consuming surface appears, the adapter is built before the second narrator is, not after.

### 2.2 Product Knowledge is the domain where "one mouth" is already being violated

Every other row in §2.1 was written pre-emptively — the adapter exists, or the second narrator has not yet appeared. Product Knowledge is the exception, and it is the reason it needed a row.

Product Knowledge has been narrated for years by everything except an adapter: by READMEs, by 380+ investigations, by slide decks, by release notes, by the phrasing an engineer chose in a dialog, and — most dangerously — by **sentences about THA written into system prompts, templates, and fallback strings**. Each of those is a mouth. None of them is *the* mouth. They do not agree, and nothing has ever required them to.

This is not a new failure mode. It is the identical one Rule KC4 was written for — the SoT Register's 🔴-rated Food Knowledge duplication, where three surfaces phrased the same food fact three ways. What is new is the audience: a food fact phrased three ways is a quality defect, while a *product* fact phrased three ways is the Companion telling one household something the product does not do.

> **Rule KC4 applied to Product Knowledge:** `PKR2`'s Rule PKR27 — *no product knowledge in a prompt, template, fallback string, fine-tune, or capability's code; the Companion queries the registry and never duplicates it* — **is not a separate rule.** It is Rule KC4, stated for the one domain where the second narrator is not a hypothetical future surface but a string literal somebody can add in thirty seconds. The registry is the store; the composed Context View is the mouth; a hardcoded sentence about THA is a second mouth and is a defect on sight.

---

## 3. THE DOMAIN COMPLETENESS MODEL

Generalises WS0X.10's three-level progressive-enrichment model (previously scoped only to the food catalogue) into the platform-wide shape every knowledge entity type uses, while keeping Architecture Principle 3's transactional/knowledge boundary exactly where it already is.

> **Rule KC5 — Minimum Viable Fact (MVF).** A knowledge entity is visible from the moment it clears a domain-specific, explicitly-named minimum bar — identity + at least one real, sourced fact. Nothing beyond the MVF bar may gate visibility; everything beyond it is additive enrichment, never a precondition.

> **Rule KC6 — Enrichment only ever adds a surface, never gates an existing one.** Level 2/3-equivalent enrichment (WS0X's own wording) unlocks new chips, new context, new depth — it never revokes or hides what Level 1/MVF already made visible. A later enrichment pass that failed does not un-publish an already-published MVF.

### 3.1 The MVF bar, per knowledge entity type (from the companion investigation, Part 1)

| Knowledge entity type | MVF (Level 1 — visible from here) | Additive enrichment (never gates) |
|---|---|---|
| Food | Slug, name, category, ≥1 alias, diversity group (if plant), ≥1 real nutrient fact (WS0X.10) | Availability/season/origin/benefits (L2); description/forms/storage/varieties/stories/image (L3) |
| Nutrition claim | A cited nutrient fact at `strong`/`moderate` evidence strength | `emerging` benefit context (never shown as `established` — Principle 6) |
| Recipe | A row that can answer "under what right does THA hold this?" (licence-state resolved) | Full instructions, imagery, nutrition analysis, variety/pairing links |
| Preparation | Existence (a named form/variant) — always cheap, always allowed | A stated nutritional *effect* — evidence-gated, rare, and only as strong as the evidence (WS5A §9.3) |
| Household pattern | N/A — patterns are never "visible" below Confirmed Understanding (§1, Rule KC2/ET5) | Rationale detail, supporting-event count, confidence bucket |
| **Product Knowledge** (added `PKR3`) | The **entry spine** (`PKR1` §7): `id`, `name`, `section`, `status`, `visibility`, `purpose`, `owner`, `sources`. A page with one honest sentence on why it exists for the person using it, a named owner, and a visibility tier **is complete enough to be answered from** | The `related` graph, screenshots, help articles, marketing messages, benefits, competitive advantages — every one of which deepens an answer and **none of which is a precondition for giving one** |

**Why the Product Knowledge MVF bar is set at the spine, and not higher.** The temptation with a registry is to hold entries back until they are *good* — until the help article is written and the screenshot is captured. Rule KC6 forbids exactly this, and the cost of ignoring it is unusually direct here: an entry withheld for enrichment is not a thin entry, it is a **question the Companion cannot answer**, and a Companion that cannot answer reaches for the nearest plausible sentence. The MVF bar is set where it is because a one-sentence `purpose` with an owner behind it beats silence, and beats invention by more.

> **Rule KC13 — Visibility is part of the MVF bar, and it fails closed.** Product Knowledge is the first domain in which a *missing* MVF field is a **security** defect rather than an invisible fact. Rule KC5 says nothing beyond the MVF bar may gate visibility; for this domain one MVF field *is* the visibility (`public` · `household` · `admin` · `developer` — `PKR2` §11), and its absence is never permission. An entry with no `visibility` label is not published to a wider audience by default; it fails closed to `developer` (`PKR2` Rule PKR22). Everywhere else in this document an incomplete entity is a gap. Here, an incomplete entity is also a disclosure risk, and the two are not traded off against each other.

**Why Household patterns have no MVF row:** this is a deliberate, correct exception, not a gap. Architecture Principle 3 draws a hard line between knowledge entities (which progressively enrich, gaps rendering as gaps) and this platform's newest lifecycle, which is confirmation-gated by design (ET5, EL2 §7) — a pattern below Confirmed Understanding is not a "thin" fact awaiting enrichment, it is *not yet a fact at all*. The Domain Completeness Model applies MVF/progressive-enrichment semantics only to Cluster A/B/C-style editorial knowledge (Part 1 of the investigation); it explicitly does not force Cluster D's confirmation-gated behavioural evidence into the same shape, and any future Signals Gateway or Community capability should ask which of the two this new knowledge more resembles before choosing a completeness model.

### 3.2 What this model does not apply to

Restated from Architecture Principle 3, unchanged: Planner state, Shopping state, and Diary are transactional, single-owner stores. They have no MVF bar because they are not knowledge entities — "one owner, no duplicate state" is their entire completeness requirement. A future workstream must not bolt a graduation pipeline onto transactional state; that is the exact over-engineering Principle 3 already forbids.

---

## 4. EVIDENCE STANDARDS

Generalises three independently-built trust vocabularies (FS1's source trust tiers, WS4B's evidence-strength/wording-firewall, EL2's Evidence Trust Rules ET1–ET6) into one three-layer chain, each layer gating the next.

```
LAYER 1 — SOURCE TRUST         LAYER 2 — CLAIM TRUST            LAYER 3 — PATTERN TRUST
(is this external source        (is this specific claim          (is this specific household
 trustworthy at all?)            strong enough to state?)         pattern real enough to confirm?)

tier1_official / tier2_scientific /   strong / moderate /          ET1 (≥3 events) + ET2 (≥70%
tier3_reference / banned              emerging / insufficient      consistency) + ET5 (explicit
(FS1 §4) — gates whether a            (WS4B) + EFSA wording        household `approve`, never
source may be cited at all            firewall — gates whether     automatic) — gates whether a
                                       a claim may be *stated*,     detected pattern becomes
                                       and in what words            Confirmed Understanding
        │                                     │                             │
        └───────────────── each layer's output is the only input the ──────┘
                            next layer is permitted to reason from
```

> **Rule KC7 — Layers gate downward, never sideways.** A claim (Layer 2) may only cite a source that has already cleared Layer 1 — a `banned` source (blogs, brand copy, AI-generated text per FS1 §3) can never become a claim's citation, regardless of how confident the claim's author feels. A household pattern (Layer 3) never reaches back to relax a claim's evidence strength, and a claim never reaches forward to auto-confirm a household pattern — the layers compose, they do not substitute for one another.

> **Rule KC8 — Declared is not enforced.** A trust rule that exists only as prose in a governing document is not yet a trust guarantee — it is a hope, in the same sense `PLATFORM_QUALITY_ARCHITECTURE.md` §3 already states for Security/Privacy ("if a rule can only be satisfied by every author remembering to do the right thing, it is not yet a platform responsibility"). Applied here: **every layer must have a running, automated validator**, not only a documented expectation.

### 4.1 The declared-vs-enforced gap this document names explicitly

The companion investigation (§2.5) found the platform's clearest violation of Rule KC8 already live: **Layer 2 (nutrition claim trust) is fully declared — `SourceRef`, `reviewedAt`, the EFSA wording firewall are all named requirements in `ARCHITECTURE_PRINCIPLES.md` (Principle 6) and `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` (Rule E1/E2) — but no automated check exists today confirming a live benefit row actually carries a `SourceRef` before it renders.** Every food↔benefit relationship in the live seed data is hardcoded `confidence: "established"` / `source: "THA editorial"`, with zero per-entry sourcing. Layer 1 (`validateCanonicalSeed()`) and Layer 3 (ET1–ET6, all structural `if` statements, not conventions) do not have this gap — they are real, running gates. Layer 2 is the priority closure item in the roadmap (§7).

### 4.2 What each layer forbids, explicitly

- **Layer 1:** No claim may cite a `banned` source. No AI-generated text may itself be treated as a citable source (FS1 §3 — a hard rule, not a style preference; this is distinct from, and does not relax, THA's own use of AI to *author* candidate content that a human then reviews against a real Layer-1 source).
- **Layer 2:** No `emerging` benefit may render as `established` (Principle 6, restated). No claim may exist without a `SourceRef` carrying a URL and `lastReviewed` date (Rule 6/E1 of `ARCHITECTURE_PRINCIPLES.md`/FI1).
- **Layer 3:** No pattern may be detected from fewer than `MIN_EVIDENCE_COUNT` events (ET1). No pattern may cross into Confirmed Understanding without an explicit, platform-gated confirmation (ET5). No Confirmed Understanding may itself auto-write a business-domain preference (EL1's "never adapts a preference itself" boundary).

### 4.3 The self-describing domain — how Product Knowledge inverts the evidence chain (added `PKR3`)

Product Knowledge is the platform's **first self-describing knowledge domain**, and this is not a curiosity — it changes which failure the evidence standard has to prevent.

For Food, Nutrition and Recipes, the world is the source and THA is the reader. THA can be *wrong about something external*, so the whole three-layer chain (§4) is built to stop a claim THA cannot substantiate from being stated: trust the source, then trust the claim, then trust the pattern. The enemy is **fabrication**.

For Product Knowledge, THA *is* the source. The product cannot be wrong about whether it has a Planner page — it either ships one or it does not, and the code is right there. Fabrication is nearly impossible and correspondingly uninteresting. What replaces it is a failure the other four domains barely have:

> **A food fact is wrong because it was never true. A product fact is wrong because it *stopped* being true.**

Nobody fabricates a page. They ship a change that quietly makes a true sentence false, and the sentence stays. **The enemy is staleness**, and staleness is invisible — a stale entry is indistinguishable from a fresh one by reading it, which is precisely what makes it dangerous when the Companion reads it aloud with the product's authority behind it (`PKR2` §12.5).

The three layers therefore re-project onto this domain rather than being discarded:

| Layer | The world-facing domains | Product Knowledge |
|---|---|---|
| **1 — Source trust** | Is this external source trustworthy? (`tier1_official`…`banned`, FS1 §4) | **The only citable source is the running product** — the route, the component, the table, the capability registration. An **investigation is not a source**: it is a dated finding that may *populate* an entry and may never *substantiate* one (`PKR1` Rule PKR3). A registry entry citing only an investigation is citing what was true on the day somebody looked. |
| **2 — Claim trust** | Is this claim strong enough to state, and in what words? (`strong`…`insufficient` + EFSA firewall) | **Every claim THA makes about itself cites the product truth that makes it true.** A Marketing Message, benefit, or competitive advantage names the entry that substantiates it. **When that entry is retired, the claim is no longer one THA may make** — this is the wording firewall's exact discipline (a claim may not outrun its evidence), applied to the product's claims about itself. |
| **3 — Currency** | Is this household pattern real enough to confirm? (ET1/ET2/ET5) | **Is this still true?** `last_verified` + a named owner accountable for it being true *now* (`PKR1` §7, §15.3). This layer has **no analogue in the other four domains**, because it is the one this domain actually needs: an unverified entry is not a weak fact, it is an **unknown** one. |

> **Rule KC14 — For a self-describing domain, currency is the evidence standard.** A Product Knowledge entry's trustworthiness is not a function of how well it was sourced when written, but of when a human last confirmed it is still true and whether the artefact it cites still exists. An entry whose `sources` point at a route that no longer exists has failed its evidence check as completely as a nutrition claim citing a `banned` source — and, unlike that claim, it will not look wrong to anyone reading it.

**The declared-vs-enforced gap, named at birth.** Rule KC8 says a trust rule that lives only in prose is a hope, not a guarantee. §4.1 named the platform's largest such gap for Nutrition (Layer 2 `SourceRef` enforcement) *after it had already gone unenforced for months*. This document declines to repeat that, and names Product Knowledge's gap **on the day the domain is created, before a single entry exists**:

**Currency (Layer 3) and the bijective inventory mapping (`PKR1` Rule PKR11) are, today, entirely declared and entirely unenforced.** Nothing checks that an entry's `sources` still resolve. Nothing checks that `last_verified` is inside any bar. Nothing checks that every prose entry has an inventory record and vice versa. Nothing checks that every entry carries a `visibility`. Until a validator does — and Rule KC13 makes the last of those a **security** check, not a hygiene one — this domain's evidence standard is exactly the hope Rule KC8 forbids. It is the gate on Phase 7 (§7), and it must be built **with** the registry's first entries, not after them: a registry populated before it can be checked is a registry that will be trusted before it can be trusted.

---

## 5. ENRICHMENT STRATEGY

Formalises WS0X.9's proven pipeline (already running at an ~87–90% automation ceiling for food) as the platform-wide enrichment strategy shape, while keeping each layer's human-judgement requirement exactly where Evidence Standards (§4) place it.

```
1. SOURCE INTAKE GATE       Is this source Layer-1 trusted (§4)? Is it under a resolvable
                            licence (FS1/FS2, for content types that need one)?
                                          │
2. IDENTITY RESOLUTION      Does this candidate already exist under a different alias?
                            (canonical anti-fork check — one string, one `alias_key`,
                            never two forks of the same real-world entity — Principle 1)
                                          │
3. AUTOMATED AUTHORING      Where the automation ceiling allows (~87–90% for food-fact
                            candidates, per WS0X.9 Part 4): batch-author via the existing,
                            reviewed pipeline. This is Candidate-stage output only —
                            never auto-published (Rule KC1).
                                          │
4. STRUCTURAL GATE          validateCanonicalSeed() / validatePromotion() / evidence-
                            strength check / licence-state check — whichever of the four
                            §1.1 instances this knowledge type maps to.
                                          │
5. HUMAN REVIEW             The ~10–13% the automated gate cannot resolve (name-quality
                            flag, score<50, new diversity group, benefit outside the
                            existing taxonomy, animal-product claims, anything the
                            Layer-1/Layer-2 evidence chain cannot itself resolve).
                                          │
6. CONFIRM / PROMOTE        Explicit human sign-off (nutrition/recipes) or explicit
                            household confirmation (behavioural evidence) — never a
                            timer, never an accumulation threshold alone (Rule KC1,
                            "3 CONFIRMED / PROMOTED").
                                          │
7. PUBLISH                  Idempotent upsert into the one owning store, by identity —
                            never a re-creation, never a parallel store (Principle 8,
                            "no duplicated effort").
```

> **Rule KC9 — Automation authors candidates, never publishes them.** Wherever THA uses AI to draft content (batch-authoring food context, drafting a claim summary), the output is always Candidate-stage (§1). No automated process may move a fact past the Gate stage on its own authority — that step is always a named human or an explicit platform confirmation tier (`strong`, per `permissions.ts::confirmationFor`).

> **Rule KC10 — Prioritise by demand once the signal exists, by editorial judgement until it does.** Today, every enrichment queue in the platform (WS0X's `needs_review`, the additive editorial backlog, the allergen Phase-4 candidate list) is prioritised by editorial judgement alone. The Evidence & Learning Platform (§1.1, row 4) is architecturally the correct future source of a demand-driven signal — once it has a first real reporter and a first real Domain Intelligence consumer (both still unbuilt, per EL1/EL2's own named next milestones), a `search` result that finds evidence with no matching canonical knowledge is itself a legitimate, evidence-based enrichment-priority input. Until that reporter exists, editorial judgement (real ingredient-frequency audits, scan-frequency data where available) remains the correct interim signal — this document does not fabricate a demand signal that does not yet flow.

---

## 6. FUTURE-STATE COMPLETION CRITERIA

There is no single "% knowledge complete" number for the platform — completeness is domain-specific by design (§3). What generalises is the *template shape* a domain's own completion criterion should take, borrowed from `THA_MASTER_EVOLUTION_ROADMAP.md`'s own launch Definition of Done and applied narrowly to knowledge (not feature/polish, which stay in that document's own scope).

> **Rule KC11 — Every knowledge domain states its own MVF bar, evidence layer requirement, and one-mouth adapter before it is considered "complete enough to ship."** A domain that cannot answer all three has not reached future-state completion, regardless of how much content it holds.

### 6.1 Per-cluster completion criteria (carried from the companion investigation, stated as the binding target here)

| Cluster | Completion criterion |
|---|---|
| Canonical Food Identity | One key-space, one runtime read model, one owner per property (WS0X.13) — no `knowledgeFoodSlug` orphans, no `canonical-map.json` second identity store |
| Food Knowledge (Nutrition facts) | Every curated food resolves to ≥1 real, cited nutrient fact; minimum 5 established, EFSA-signed-off benefits live via the nutrient bridge (Master Roadmap §9) |
| Preparation Knowledge | Existence stated freely; effect stated only where Layer-2 evidence earns it; the three honest states (effect known / no meaningful change / unknown) are visually distinct |
| Recipes | Every row can answer "under what right does THA hold this?" — zero rows in `pending_review`/`unlicensed` reachable by a live surface |
| Household Evidence & Learning | At least one real reporting capability and one real consuming capability wired (currently zero of either) |
| Retailer/Partner | A resolved product-scope decision exists (in scope with a real data partnership, or explicitly out of scope) — "silently inferred forever" is not a completion state |
| **Product Knowledge** (added `PKR3`) | Every surface THA ships has **exactly one** registry entry (Rules PKR5–PKR11); every entry carries a **named human owner** and a **deliberately chosen `visibility`**; the human and machine forms map **bijectively** (Rule PKR11); no entry is unverified beyond its currency bar (§4.3); and **no sentence about THA exists in a prompt, template, or fallback string** (Rule PKR27 / §2.2). Note what is *not* on this list: a word count, a screenshot for every page, or a help article for every feature. Completion for this domain is **one owner, one truth, current** — not comprehensiveness, which no registry has ever achieved and no honest criterion should demand |

### 6.2 What this document does not claim

This document does not assert any of the above criteria are met today. Per the companion investigation, most are not (Layer 2 evidence enforcement is the largest open gap; Evidence & Learning has zero real reporters; Preparation Knowledge is unbuilt). Stating the criterion is this document's job; closing it is the roadmap's (§7).

---

## 7. IMPLEMENTATION ROADMAP

Sequenced from the platform's actual current state (per the companion investigation), not a blank slate. Each phase is independently shippable and gated (mirrors `THA_FOOD_INTELLIGENCE_PLATFORM_ARCHITECTURE.md`'s own phase-gating discipline, Rule LT1: no stage skips its predecessor's trust bar).

| Phase | Delivers | Gate |
|---|---|---|
| **0 — Close the declared/enforced gap (§4.1)** | An automated validator confirming every live nutrition-benefit row carries a real `SourceRef` + `reviewedAt` before render; ship the Master Roadmap's own minimum-5-sourced-benefits content | Zero benefit rows render without a checked `SourceRef` — Rule KC8 satisfied for Layer 2 |
| **1 — Complete the contested-domain migrations (M1/M2/M4)** | Retire `nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `nutrition-variety.ts` — already named, scoped, and low-effort per the SoT Register | Rule KC4 ("one mouth") satisfied for Food Knowledge — no domain currently violates it more visibly |
| **2 — Name the "one mouth" adapter for every Cluster A/B/C entity type still missing one** | Extend §2.1's register: Food Relationships, Preparation Knowledge (once built), recipe licence/attribution detail | No knowledge entity type has more than zero adapters once it has more than one consuming surface |
| **3 — Wire the Evidence & Learning Platform's first real reporter and first real consumer** | Prove the Cluster D lifecycle end-to-end with genuine household data (EL1/EL2's own named next milestone) | A first Domain Intelligence layer reads `search`'s Confirmed Understanding as one re-weighting input (Rule P1 — re-weight, never author) |
| **4 — Build Preparation Knowledge (WS5A)** | The first knowledge type built *after* this document exists — the first real test of whether §1/§3/§4/§5 as written are sufficient guidance without further re-derivation | Ships using the existing Nutrition Facts pipeline row (§1.1) as its template, with zero new lifecycle invented |
| **5 — Resolve the demand-driven prioritisation loop (Rule KC10)** | Once Phase 3 has real reporters, wire enrichment-queue prioritisation to real evidence gaps instead of editorial judgement alone | First enrichment queue item prioritised by a genuine `search` result, cited as such |
| **6 — Product-scope decisions for Retailer/Partner knowledge** | A resolved decision (in-scope-with-partnership or explicitly out-of-scope) — a product decision, not an engineering task | The Master Roadmap's open question (unresolved since 2026-06-18) is closed one way or the other |
| **7 — Populate Product Knowledge (added `PKR3`)** | The **Platform Discovery & Experience Audit** discovers every surface, journey, capability, hidden experience, claim and asset THA ships; each finding lands as an owned entry in the Product Knowledge Registry, or is explicitly declined (Rule KC12). Built **with** its validator, not before it (§4.3) | **No finding lives only in the audit.** The audit is a Candidate source (§1.1) and nothing more: every discovery is an entry with an owner and a visibility, or a recorded decline. An audit that ends with its findings still inside itself has discovered without transferring ownership — the exact failure Rule PKR3 names — and has not passed this gate, however thorough it was |

**On Phase 7's ordering.** It is listed last and is not last in importance; it is simply the phase whose destination had to exist before it could run. This document's §9 and the registry it points at exist precisely so the audit has somewhere to put what it finds. An audit run before them would have produced one more investigation — read once, superseded, and never maintained.

---

## 8. RISKS

| # | Risk | Phase | Rating | Mitigation |
|---|---|---|---|---|
| R1 | A future knowledge domain invents a fifth graduation-pipeline variant instead of using §1's table | 4+ | 🟠 Med | This document exists precisely so the next workstream has a citable reference; code review gate should ask "which §1.1 row is this closest to?" before approving a new lifecycle |
| R2 | Layer 2 (claim trust) enforcement (Phase 0) is deferred indefinitely because it requires nutritionist/editorial time, not engineering time | 0 | 🔴 High | Named explicitly as the platform's single largest declared-not-enforced gap; tracked here and in the Master Roadmap so it cannot silently drop off either document's radar |
| R3 | The "one mouth" rule (KC4) is treated as aspirational rather than enforced, allowing a second narrator to appear before the adapter is built | 2 | 🟠 Med | Code review gate: any PR adding a second consuming surface for an existing knowledge entity type must either point at an existing adapter or build one in the same PR |
| R4 | Evidence & Learning's first reporter (Phase 3) ships without re-confirming `RecordOutcomeParams`'s shape is adequate for real data, repeating a mistake EL1 itself warned against | 3 | 🟡 Med | EL1's own "Remaining Architectural Risks" note is carried forward unchanged — this document adds no new mitigation, only reaffirms it |
| R5 | Rule KC10's demand-driven prioritisation is implemented as an inferred signal before real reporters exist, fabricating a demand signal that doesn't yet flow | 5 | 🟠 Med | Rule KC10 explicitly forbids this; editorial judgement remains the only legitimate interim signal |
| R6 | Preparation Knowledge (Phase 4) is built as a genuinely new fifth pipeline instead of reusing the Nutrition Facts template, undermining this document's own central claim | 4 | 🟡 Med | §1.1's table names Preparation Knowledge's closest analogue explicitly; a build that diverges without justification fails the Architecture Compliance Checklist's "extends existing architecture" item |
| R7 | **The Platform Discovery & Experience Audit discovers into an investigation file, and nothing lands in the registry.** The audit is thorough, well-received, and read once; six months later the questions it answered are being reconstructed from code again | 7 | 🔴 High | This is the single most likely way `PKR3` fails, because it is what has happened every previous time. It is now a *checklist* failure, not an oversight: Phase 7's gate (§7) and `PKR1` Rule PKR3 both state that discovery without transfer of ownership is an incomplete audit. The destination exists before the audit runs — which is the entire reason this extension precedes it |
| R8 | **Currency (§4.3, Layer 3) stays declared and unenforced**, exactly as Layer 2 did for Nutrition (§4.1). Entries silently decay; the registry keeps being trusted because a stale entry looks identical to a fresh one — and it is now read aloud to households in the Companion's voice | 7 | 🔴 High | Named at the domain's birth rather than discovered months later (§4.3). The validator (`sources` resolve · `last_verified` within bar · inventory bijective · **every entry carries a `visibility`**) is the **gate on Phase 7**, not a follow-up to it. Rule KC13 makes the last of those a security check, which is what should stop it being deferred |
| R9 | A second narrator of product knowledge appears — a sentence about THA written into a system prompt, a template, or a fallback string — because it takes thirty seconds and querying the registry does not | 7 | 🟠 Med | Rule KC4 as applied in §2.2, enforced by Rule PKR27 and the Product Registry Compliance block in `ENGINEERING_WORKFLOW.md`. This risk never reaches zero: the cheap wrong path stays cheap. It is mitigated by making the defect *visible on sight* in review, not by making it impossible |
| R10 | Product Knowledge is treated as documentation rather than as a knowledge domain — so it is skipped when work is "just a refactor", and the Definition of Done obligation is completed as a formality | 7+ | 🟠 Med | The test in `ENGINEERING_WORKFLOW.md` is deliberately not "did I touch the UI?" but *"would a person's answer to **what is THA?** be different now?"* — a question a refactor honestly answers NO to, and a shipped feature cannot |

---

## 9. PRODUCT KNOWLEDGE AS A PLATFORM KNOWLEDGE DOMAIN

*(Added by `PKR3`, 2026-07-11. This section admits the domain and states the rules it inherits. It defines **no registry mechanism** — those belong to [`THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md`](./THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md), which this section cites and never restates.)*

### 9.1 The domain

> **Product Knowledge is the canonical knowledge describing The Healthy Apples itself** — what surfaces it has, what they are for, who they serve, what they are called, what they claim, what they connect to, and who may be told about each.

It sits alongside Food, Nutrition, Recipes and Household Knowledge as a first-class platform knowledge domain, and is governed by every rule in §§1–8 of this document. It is distinguished from the other four by one property, from which everything else in §4.3 follows: **its subject and its source are the same system.**

### 9.2 Its canonical owner

> **The Product Knowledge Registry is the sole owner of Product Knowledge.** It lives at `docs/product/`, and its architecture — sections, entry spine, permission tiers, Companion query path, governance, lifecycle, and folder structure — is fixed by `PKR1` (enhanced by `PKR2`).

The registry stands to Product Knowledge as NK1/NK2 stand to Nutrition and FS1/FS2 stand to Recipes: **the domain's own architecture, subordinate to this document.** Where they conflict, this document is the senior rule and the registry architecture is corrected.

**The registry is not another architecture document.** It is the canonical living knowledge base describing the product:

- **human-readable** — an owner, and anyone asking what THA is, reads it directly;
- **machine-readable** — an authored `inventory/product.yaml`, generated to `inventory/product.json`, which is the only artefact in the tree the Intelligence Platform ever reads (`PKR1` §18, Rule PKR21);
- **continuously maintained** — an entry is corrected in place, and staleness in it is a defect, not drift (Rules PKR4/PKR15);
- **never regenerated from scratch** — a registry rebuilt is a registry with no owners, no `last_verified`, and no memory of what was deliberately declined (Rule KC12). Regeneration destroys precisely the knowledge that made it worth keeping: the `purpose` sentences, the ownership, and the decisions. **Nothing in this platform may ever bulk-regenerate the registry from code**;
- **updated incrementally by future implementations** — every user-facing change carries its own registry update, in the same change (§9.5).

### 9.3 Discovery versus ownership — the principle the domain rests on

> **Investigations discover. The Product Knowledge Registry owns. Implementations maintain.**

This is the domain's load-bearing distinction, stated in full in `PKR1` §5 and restated here in one line only because it is the rule this document's §1.1 Candidate stage encodes:

- **Investigations and audits discover.** They are point-in-time acts of finding out — past-tense, dated, never edited to stay current, and **history the moment they are written**. A discovery is a *Candidate* (§1.1), and nothing more.
- **The registry owns.** An owned fact is *maintained*: present-tense, carrying a named human accountable for it being true **now**, corrected rather than superseded.
- **Implementations maintain.** Every change to what THA is carries its own registry update (§9.5).

An investigation may **populate** a registry entry; it never **becomes** one. The entry is a new artefact in `docs/product/` with its own owner, citing the investigation as its source. The investigation stays where it is, unedited, forever.

> **The failure this prevents is the one THA has repeated for three years:** discovery without transfer of ownership. Something is found, written down beautifully, read once, and never maintained — so the next person to ask finds it out again. Discovery is cheap and THA is good at it. **Ownership is the part that has never happened**, and the registry exists to be the place it happens.

### 9.4 One owner, per everything

The domain inherits Rule KC4 ("one owner, one mouth") and states it at the granularity a product needs. Each of the following has **exactly one** registry entry; a second is a defect, not a redundancy, however differently it is phrased:

| One owner per… | Registry rule |
|---|---|
| **page** | `PKR1` Rule PKR7 — keyed by canonical route; a page under two routes has one entry naming the alias |
| **capability** | Rule PKR6 — cites its Capability Card and runtime registration; restates neither |
| **journey** | Rule PKR8 — a surface appears in many journeys; a journey appears once |
| **feature** | Rule PKR5 (one owner per product concept) |
| **marketing message** | Rule PKR9 — every claim THA makes about itself traces to exactly one entry |
| **screenshot** | Rule PKR10 — one canonical image per surface; alternates are marked, never interchangeable |
| **inventory record** | Rule PKR11 — the map between prose and machine form is **total and bijective**. A record without a document is an orphan; a document without a record is invisible |

And, spanning all of them: **every entry names a human owner** (Rule PKR12 — not a team, not a workstream, not "the platform"), and **no other document may describe authoritatively what the registry owns** (Rule PKR13 — other documents link to the entry; a README that restates one has created a second owner and is reduced to a pointer).

### 9.5 Permission-aware Product Knowledge

Product Knowledge is the first knowledge domain in THA where **the same fact is not shown to everyone**. Every entry declares the lowest audience permitted to be told it:

**`public` · `household` · `admin` · `developer`**

The tiers are **cumulative and monotonic**, they key on **role and never on subscription tier** (knowing what premium *does* is not access to it), and the label **fails closed** — absence of a `visibility` is never permission (Rule KC13; `PKR2` §11, Rules PKR22/PKR24).

> **The safety property, and it is not negotiable: the registry classifies; it never authorises.** It labels what each audience may be *told*. It does not decide who anyone *is*. `server/lib/access.ts` remains the sole authority on identity and role, unchanged and unshared — so that **a Markdown edit can never become a privilege escalation** (`PKR2` §11.4, Rule PKR25). This is the line the whole permission model rests on, and no future extension may cross it.

### 9.6 The Companion queries the registry; it never duplicates it

> **The Companion must query the Product Knowledge Registry through permission-aware access, rather than duplicating product knowledge.**

This is Rule KC4 for this domain (§2.2). Product Knowledge reaches the model through the front door that already exists and gets no bespoke path: as a **registered Knowledge Capability**, composed into a Context View by **INT17**, which keeps its ownership of every byte the model reads (`PKR2` Rules PKR20/PKR21).

Three consequences, all inherited and none new:

- **Filtering happens before composition.** Content above the user's tier is dropped *before the prompt is built* — never placed in context with an instruction to withhold it (Rule PKR26). A model asked to keep a secret it has been shown is not a permission model.
- **No product knowledge in a prompt.** Not one sentence about THA in a system prompt, template, fallback string, fine-tune, or capability's code (Rule PKR27). If the Companion must know it, the registry owns it.
- **Absence is never explained.** The Companion never says *"there is something here I can't show you"* — that discloses the very fact the tier protected (Rule PKR29).

### 9.7 The Definition of Done obligation

> **Rule KC15 — For a self-describing domain, maintenance is not a follow-up; it is the work.** Every implementation that changes what THA *is* must create, update, or retire the affected Product Knowledge Registry entries **in the same change**. A user-facing task with a stale registry is not complete, however finished its code is.

The test is one question: **would a person's answer to "what is THA?" be different after this change?** If yes, the registry is stale until updated. If unsure, it is yes.

This is enforced, not merely asserted — in `ENGINEERING_WORKFLOW.md`'s mandatory **Product Registry Impact** section, its **Product Registry Compliance** block, and its **Completion Gate** (all adopted under `PKR2`, 2026-07-11), and in the implementation template. `PKR3` adds the domain-level reason those exist: **Product Knowledge decays by default and no other knowledge domain does.** A food fact left alone stays true; a product fact left alone becomes a lie the moment the product moves. Nothing but a Definition-of-Done obligation makes maintenance happen at the only moment it is cheap — while the person changing the product still remembers what they changed.

---

## 10. DEFINITION OF DONE

- **What success looks like:** the four independently-built graduation pipelines (WS0X, WS4B, FS1/FS2, EL1/EL2) are named as one canonical pipeline (§1) with a citable table future workstreams fill a row into rather than re-deriving; the SoT Register's ownership rule is complemented by an explicit "one mouth" adapter rule (§2, Rule KC4); a platform-wide Domain Completeness Model generalises WS0X.10's MVF pattern without forcing it onto behavioural evidence, which correctly stays confirmation-gated (§3); the three pre-existing trust vocabularies are named as one layered Evidence Standard, with the platform's largest declared-vs-enforced gap (Layer 2 `SourceRef` enforcement) named explicitly rather than left implicit (§4); the enrichment pipeline's automation ceiling and human-review boundary are stated as a reusable strategy (§5); every domain's own completion criterion is stated as a target, not fabricated as already met (§6); a phased roadmap sequences real, already-identified gaps rather than inventing new ones (§7).
- **What success looks like (`PKR3` extension, 2026-07-11):** Product Knowledge — the knowledge of what THA itself is — is admitted as a first-class platform knowledge domain under the rules that already existed, with **no new governance scheme and no new architecture document** (§0.1, §9); its canonical owner is named as the Product Knowledge Registry, whose mechanisms are cited and nowhere restated (§9.2); it fills a row in every one of this document's tables — pipeline (§1.1), one-mouth (§2.1), MVF (§3.1), completion criteria (§6.1), roadmap (§7); the domain's inversion of the evidence chain is named rather than glossed — for a self-describing domain the enemy is staleness, not fabrication, and **currency is the evidence standard** (§4.3, Rule KC14); its declared-vs-enforced gap is named **on the day the domain is created**, rather than months after it started costing something as §4.1's was (§4.3); Discovery/Ownership/Maintenance is fixed as the domain's load-bearing distinction (§9.3); one-owner-per-page/capability/journey/feature/message/screenshot/inventory-record is stated at product granularity (§9.4); permission-awareness is admitted with the classify-never-authorise safety property intact (§9.5, Rule KC13); the Companion is bound to query and forbidden to duplicate (§9.6); and the Definition of Done obligation is given its domain-level justification — **Product Knowledge decays by default, and no other knowledge domain does** (§9.7, Rule KC15).
- **What must not break:** nothing can — no code, schema, route, or data was touched by either this document, its source investigation, or the `PKR3` extension. Specifically: no rule KC1–KC11 is weakened, no existing table row is altered, and no section numbering below §9 is cited by any other document (verified before renumbering).
- **Manual verification:** `git status` shows exactly the files listed in this document's and the investigation's Rollback Protection sections; rollback tags exist (`git tag -l 'rollback/before-pkca1*'`, `git tag -l 'rollback/PKR3*'`); `docs/architecture/README.md` lists this document.

## 11. DATA IMPACT

- Reads existing data: **NO** (documentation only).
- Writes new data: **NO**.
- Changes meaning of existing data: **NO**.
- Requires backfill: **NO**.

## 12. TRUST CHECK

- **Could this mislead the user?** No user-facing output exists. This document strengthens every existing evidence rule by making the declared-vs-enforced gap (§4.1) explicit rather than leaving it implicit. The `PKR3` extension applies the same discipline to the domain it adds, naming that domain's gap (currency enforcement, §4.3) before a single entry exists rather than after it has cost something.
- **Could this fabricate certainty?** No. §6.2 states directly that none of the per-cluster completion criteria are met today — this document names targets, it does not claim they are achieved. `PKR3` adds no claim that Product Knowledge is complete, populated, or enforced: **the registry contains zero entries, `docs/product/` does not exist, and this extension deliberately does not create it** (§9.2, §14).
- **Is anything guessed but shown as real?** No. Every pipeline instance in §1.1, every adapter in §2.1, and every gap in §4.1/§4.3 traces to a specific, cited document or code finding. Every Product Knowledge rule in §9 cites the `PKR1`/`PKR2` rule it inherits; none is invented here, and none is restated (Rule PKR13).
- **What happens if the system is wrong?** If a future phase proves this generalisation wrong (e.g. a knowledge type genuinely does not fit the four-stage shape), it is corrected by a successor governing document, exactly as this document itself generalises rather than replaces its four sources. If Product Knowledge proves not to fit — the first real test being whether the Platform Discovery & Experience Audit can populate the registry using §1.1's row without re-deriving a lifecycle — §9 is corrected, not worked around.
- No architectural duplication introduced: **YES** — this document creates no new store, table, or capability. `PKR3` creates **no new governing architecture**: it admits an existing domain to an existing scheme, and cites the domain's existing architecture rather than duplicating it.
- No new source of truth created: **YES** — every fact named here already has the owner the SoT Register or a cited investigation already gave it. Product Knowledge's owner (the registry) was established by `PKR1`; `PKR3` names it as this document's domain owner, and creates no second one.
- No runtime behaviour altered: **YES**.

## 13. ARCHITECTURE CONVERGENCE STATUS

```
Domain:
  Platform Knowledge Completion — a new cross-cutting governance layer (like
  PLATFORM_QUALITY_ARCHITECTURE.md) over every existing knowledge domain named
  in the SoT Register plus the newer Evidence & Learning and Preparation
  Knowledge domains.

Current Canonical Owner (unchanged by this document):
  Each knowledge domain's own owner exactly as declared in
  THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md, WS0X.13, WS4B/WS5A/WS6,
  FS1/FS2/THA_RECIPE_ACQUISITION_ARCHITECTURE.md, and EL1.

Current Runtime Consumer(s):
  Unchanged — this document adds no new consumer of any store.

Duplicate Owners Remaining (inherited, unchanged):
  The same three pre-existing contested stores named in ARCHITECTURE_PRINCIPLES.md
  (nutrition-benefit-library.ts, pantry-knowledge.ts, nutrition-variety.ts) —
  this document does not resolve them, it sequences their resolution as Phase 1
  of its own roadmap (§7).

Current Convergence (%):
  Governance-naming convergence (this document's own scope): 100% — the four
  pre-existing pipelines are now named as one canonical shape (§1.1) and the
  "one mouth" rule is stated platform-wide (§2) for the first time. Under PKR3
  this extends to five: Product Knowledge is admitted to the same scheme with
  no new pipeline invented (§9), and it is the first domain to be added via the
  table rather than to arrive with a lifecycle of its own — which is the
  clearest available evidence the generalisation was real.

  Enforcement convergence (whether every domain's Evidence Standard is
  code-enforced, not just declared):
    · Layer 2, Nutrition (§4.1): the platform's longest-standing gap, tracked
      as Phase 0 of §7 and worked by the PKC0 workstream. This extension makes
      no claim about its current state — §4.1 remains the owner of that fact.
    · Currency, Product Knowledge (§4.3): 0% code-enforced, and honestly so —
      the domain has zero entries and docs/product/ does not yet exist. This is
      an unbuilt validator for an unpopulated domain, not a live gap leaking
      today. It becomes one the moment Phase 7 populates a single entry, which
      is why it is that phase's GATE and not its follow-up.

Target Convergence (%):
  100% governance-naming (achieved by this document, extended to Product
  Knowledge by PKR3). Enforcement convergence target and roadmap are stated in
  §7; not committed to a number by this document, which is governance-only.

Next Planned Milestone:
  Phase 7 of §7 — the Platform Discovery & Experience Audit populates the
  Product Knowledge Registry, shipping WITH the currency/visibility/bijection
  validator that §4.3 names as its gate.

Remaining Architectural Risks:
  See §8. The two most consequential are now R7 (the audit discovers into an
  investigation and nothing lands in the registry — the failure THA has
  repeated every previous time) and R8 (currency stays declared and
  unenforced, exactly as Layer 2 did, but this time read aloud to households
  in the Companion's voice).
```

## 14. SCOPE LOCK

**Implemented scope (this promotion):** exactly EWO-PKCA1 — investigate every platform domain's knowledge ownership, gaps, and existing completion/evidence/enrichment patterns (the companion investigation); name the shared shape across WS0X/WS4B/FS1-FS2/EL1-EL2 as one canonical Knowledge Graduation Pipeline (§1); state the "one owner, one mouth" rule generalising WS6 platform-wide (§2); generalise WS0X.10's MVF model into a platform-wide Domain Completeness Model while explicitly excluding transactional state and confirmation-gated behavioural evidence from it (§3); name the three pre-existing trust vocabularies as one layered Evidence Standard and name the platform's largest declared-vs-enforced gap explicitly (§4); formalise the enrichment pipeline shape and its automation ceiling (§5); state per-cluster future-state completion criteria without claiming any are met (§6); sequence a phased roadmap from real, already-identified gaps (§7); create this document and its companion investigation; index both in `docs/architecture/README.md`.

**Implemented scope (`PKR3` extension, 2026-07-11):** admit **Product Knowledge** as a first-class platform knowledge domain under the existing scheme (§0.1, §9); name the **Product Knowledge Registry** (`PKR1`/`PKR2`) as its canonical owner, by citation only (§9.2); add its row to the graduation pipeline (§1.1), the one-mouth register (§2.1), the MVF table (§3.1), the completion criteria (§6.1), and the roadmap as Phase 7 (§7); state the self-describing domain's inversion of the evidence chain and name its declared-vs-enforced gap at birth (§4.3); add Rules **KC12** (a declined discovery is recorded), **KC13** (visibility is part of the MVF bar and fails closed), **KC14** (currency is the evidence standard for a self-describing domain), and **KC15** (maintenance is the work, not a follow-up); state Discovery/Ownership/Maintenance (§9.3), one-owner-per-product-concept at product granularity (§9.4), permission-aware knowledge (§9.5), and the Companion's query-never-duplicate obligation (§9.6); add risks R7–R10 (§8); cross-reference the extension in `ENGINEERING_WORKFLOW.md` and `docs/architecture/README.md`.

**Explicitly excluded (out of scope — not implemented by this promotion or the `PKR3` extension):** any code, schema, route, or validator change (including the Phase 0 SourceRef validator and the Phase 7 currency/visibility/bijection validator — both named, neither built, here); any resolution of the M1/M2/M4 contested-domain migrations; any build-out of Preparation Knowledge, a Signals Gateway, or a Community capability; any product decision on Partners/Retailer scope; any change to WS0X, WS4B, WS5A, WS6, FS1, FS2, EL1, or EL2's own content, code, or governing text — all are cited, none are rewritten.

**Explicitly excluded by `PKR3` in particular — and this is the boundary that matters most:**

- **No new governing architecture is created.** The Product Knowledge Registry Architecture (`PKR1`/`PKR2`) already exists and is the domain's architecture. `PKR3` admits its domain to this document's scheme and **cites** it; it does not restate, replace, supersede, or absorb it. Restating it would create the second owner Rule PKR13 forbids, in the document that admits the rule.
- **The registry is not implemented.** `docs/product/` is **not created**. Not one entry, folder, `README`, `OWNERS.md`, `VISIBILITY.md`, `inventory.yaml`, or `inventory.json` is written. The folder structure remains the specification in `PKR1` §18 — cited by §9.2, populated by nobody, and deliberately so.
- **No capability is registered, no query path is built, and no prompt is changed.** The Companion's read path (§9.6) is architecture, not code. Rules PKR20/PKR21 govern how it will be built; nothing here builds it.
- **The Platform Discovery & Experience Audit is not run.** This extension exists so that when it runs, it has a canonical destination for everything it discovers — and so that its findings become *owned knowledge* rather than one more investigation nobody maintains (§7 Phase 7, Risk R7).

---

*Governance only. No code was changed in the production of this document.*
*Rollback (original promotion): `rollback/before-pkca1-platform-knowledge-completion-architecture-20260703` → `3460519`.*
*Rollback (`PKR3` extension): `rollback/PKR3-product-knowledge-domain-20260711` → `a432400`.*
