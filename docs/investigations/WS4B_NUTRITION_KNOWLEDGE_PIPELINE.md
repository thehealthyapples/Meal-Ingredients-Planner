# WS4B — Nutrition Knowledge Ingestion and Editorial Pipeline

> **Trusted sources → approved knowledge → every THA experience.**
>
> Investigation only. No implementation. No schema changes. No UI changes. No automatic imports. No AI publishing.

| | |
|---|---|
| **Document type** | Investigation + pipeline architecture (no implementation) |
| **Date** | 2026-06-20 |
| **Branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **HEAD at investigation** | `72eccee` (WS3A complete) |
| **Rollback tag** | `rollback/ws4b-pre-investigation-20260620` → commit `72eccee` |
| **Restore command** | `git checkout rollback/ws4b-pre-investigation-20260620` |
| **Predecessor documents** | WS0 · WS1.5 · WS2A · WS2B · WS2C · WS2D · WS2E · WS2F · WS2G · WS3A · WS3B |
| **Prior pipeline investigations** | `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` · `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` |

**This document changes nothing executable.** Reads existing data: YES. Writes new data: NO.
Changes meaning of existing data: NO. Requires backfill: NO.

---

## 0. ROLLBACK & SAFETY HEADER (mandatory first step — completed)

1. ✅ **Git status confirmed clean.** Branch `safety/preserve-since-last-prod-20260617-1613`. Working tree: one untracked file (`WS3B_QUALIFIERS_ARCHITECTURE.md`) — committed tree is clean.
2. ✅ **WS3A protected.** Tag `rollback/ws3a-pre-impl-20260619` → commit `9a436f8`.
   WS3B protected. Tag `rollback/ws3b-pre-investigation-20260620` → commit `72eccee`.
   All prior workstreams (WS0–WS2G) also protected via their respective tags.
3. ✅ **Rollback tag created:** `rollback/ws4b-pre-investigation-20260620` → commit `72eccee`.
4. ✅ **Rollback identifier:** `rollback/ws4b-pre-investigation-20260620`

---

## EXECUTIVE SUMMARY

Two previous investigations already laid substantial groundwork:

- **`NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md`** — established the **four-plane architecture**: Ingestion plane (quarantine, never app-visible) → Review plane (human-only state machine) → Published registry (the only thing the app reads) → Staleness plane (alert-only). Also established the **hard wall principle**: no ingested row is ever visible without a human crossing the wall.

- **`NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md`** — established the **trusted source registry** with evidence-strength tiering, the **Editorial Rules Engine** (data-driven allow/block rules), the **constrained Suggested-Wording Engine** (templates own claims, AI only slots), and the **four-phase autonomy curve** (per-item → per-pattern → auto-apply → exceptions-only).

**WS4B does not re-specify those foundations. It synthesises them into the complete pipeline view** the architecture now requires: how does knowledge flow from a government health page into a Tomato card in the Nutrition Report, the Food Report, the Pantry, Broaden Your Week, Healthier Alternatives, Shopping, and the Analyser — with full editorial control, evidence traceability, stale-detection, and a trust firewall that never breaks?

**The pipeline in one line:**

```
Trusted Sources → Ingestion (quarantine) → Canonical Match → Draft Knowledge
     → Editorial Review → Approved Knowledge → One Published Registry
             → All THA Surfaces (read-only, one adapter)
```

**The three rules that govern the entire pipeline:**

1. **Nothing reaches users without a human approval action.** Automation feeds candidates. Only a human publishes.
2. **One knowledge store. No duplicate claims.** All surfaces read the same published registry through one adapter. No surface authors its own facts.
3. **Wording is THA-owned. Science is source-owned.** THA controls how a fact is expressed; THA never invents the relationship between a nutrient and a health outcome.

---

## SECTION 1 — ARCHITECTURE POSITION

### 1.1 Where WS4B sits in the THA knowledge stack

```
DiversityGroup
  └─ CanonicalFood                     ← identity spine (WS2A)
       ├─ FoodVariety                  ← cultivar/form distinctions (WS2B)
       ├─ CanonicalFoodAlias           ← slug resolver (WS2A)
       ├─ FoodQualifier                ← production/sourcing signals (WS3B)
       └─ knowledge_food_slug FK       ── bridge to:
                                              ↓
                              WS0 Knowledge Registry
                                   knowledge_foods
                                   knowledge_nutrients
                                   knowledge_health_benefits
                                   knowledge_food_nutrients
                                   knowledge_nutrient_benefits
                                   knowledge_food_relationships   ← pairings, alternatives (WS2D)
                                              ↓
                              ┌──────────────────────────────┐
                              │   WS4B PIPELINE GOES HERE    │
                              │   (feeds the registry above) │
                              └──────────────────────────────┘
                                              ↓
                              Published Knowledge Registry
                              (the only thing surfaces read)
                                              ↓
              ┌──────────┬────────────┬──────────┬──────────────┬──────────┬──────────┐
         Nutrition    Food        Pantry    Broaden      Healthier  Shopping Analyser
          Report     Report               Your Week    Alternatives
```

The WS4B pipeline is the **feed path** into the knowledge registry WS2D designed. Everything below the pipeline reads from published-only tables. Everything above the pipeline is external reality.

### 1.2 The gap this investigation addresses

WS2D confirmed the target knowledge model. The Editorial/Automation Framework confirmed the review state machine. What neither specified in full is:

- Which sources THA should actively trust — with explicit *why*, *strength*, *frequency*, *licensing*, and *citation* requirements
- The complete ingestion flow from "URL on the internet" to "candidate row in the database"
- Canonical food matching during ingestion (how does "tomatoes" in an NHS article become `canonical_food.slug = 'tomato'`?)
- The editorial queue experience for an admin who is not a nutrition researcher
- Evidence levels, how they map to wording, and how they change over time
- The stale-knowledge detection strategy (what fires, when, and what the admin sees)
- The integration contract each THA surface has with the published registry
- The full trust check / language guardrails
- The considered (but bounded) role of AI assistance

---

## SECTION 2 — PART 1: TRUSTED SOURCES

### 2.1 Source tier model

THA uses a **three-tier trust model** plus an orthogonal **wording-authority role** for EFSA.

```
TIER 1 — Government health authorities
  High trust. Legally cautious. UK/EU-appropriate phrasing. Machine-queryable.

TIER 2 — Scientific and nutrition organisations
  High trust for corroboration and educational framing. Not always UK-first.

TIER 3 — Academic and research literature
  Highest scientific weight for nutrient↔benefit relationships.
  Lowest editorial usability (language requires THA translation).

WORDING AUTHORITY (orthogonal) — EFSA
  Not a discovery source. Gates whether a claim is *sayable* in the EU.
  All published health claims must pass EFSA review regardless of tier.
```

### 2.2 Tier 1 — Government authorities (recommended: CORE)

#### NHS (nhs.uk)

| Property | Detail |
|---|---|
| **Use for** | UK consumer-safe health and food descriptions |
| **Strengths** | UK authority; plain English; legally cautious; THA's audience is UK-first; phrasing THA can mirror without adaptation |
| **Weaknesses** | Evidence grades not always explicit; content updated without version history |
| **Update frequency** | Pages updated 1–4× per year; no formal schedule |
| **Access** | Web scraping (no public API); pages stable with persistent URLs |
| **Licensing** | Crown copyright / Open Government Licence — attribution required, commercial reuse permitted with credit |
| **Citation requirement** | In-product: "Source: NHS" with URL and access date |
| **Claim suitability** | **Primary for description + awareness wording.** Strong for consumer-facing claims. |
| **Recommendation** | ✅ CORE SOURCE (Tier 1A) |

#### USDA FoodData Central (FDC)

| Property | Detail |
|---|---|
| **Use for** | Food → nutrient *composition* data (which nutrients a food contains, in what amounts) |
| **Strengths** | Authoritative; REST API with stable food IDs; bulk download available; quarterly release cycle; structured JSON |
| **Weaknesses** | US portions and fortification norms; says nothing about *health outcomes*; cannot be used to author "X helps Y" claims |
| **Update frequency** | Quarterly releases |
| **Access** | ✅ REST API (free API key); bulk FDC JSON |
| **Licensing** | US Government — public domain; no licensing barrier |
| **Citation requirement** | In-product: "Composition data: USDA FoodData Central" |
| **Claim suitability** | **Composition only.** Powers "is a source of [nutrient]" claims. Never "helps [outcome]". |
| **Recommendation** | ✅ CORE SOURCE (Tier 1B — composition only) |

#### NIH Office of Dietary Supplements (ODS)

| Property | Detail |
|---|---|
| **Use for** | Nutrient → outcome relationships; evidence strength grading per nutrient |
| **Strengths** | Gold-standard nutrient fact sheets with explicit evidence quality levels (A/B/C/D/F); ideal input for the nutrient bridge; covers all major nutrients and many phytonutrients |
| **Weaknesses** | US English; not food-level (gives nutrient properties, not per-food composition); updated on scientific consensus cycles |
| **Update frequency** | 1–2× per year per fact sheet; tracks major meta-analyses |
| **Access** | Structured HTML/pages (scrape or structured export); persistent URLs |
| **Licensing** | US Government — public domain; no licensing barrier |
| **Citation requirement** | In-product: "Source: NIH ODS" with fact sheet URL and access date |
| **Claim suitability** | **Primary for Benefit↔Nutrient links.** The evidence grade from NIH ODS directly feeds the THA evidence strength field. |
| **Recommendation** | ✅ CORE SOURCE (Tier 1C — nutrient science only) |

#### EFSA (European Food Safety Authority)

| Property | Detail |
|---|---|
| **Use for** | **Wording authority only** — gates which health claim phrasings are permitted in the EU |
| **Strengths** | The legal standard for permitted health claims in Europe; register is structured and machine-readable; phrasing is pre-cleared |
| **Weaknesses** | Not a discovery source; does not indicate *what is true*, only *what is sayable*; some permitted phrases sound bureaucratic |
| **Update frequency** | Register updated as new claims are evaluated; register is versioned |
| **Access** | ✅ EFSA Health Claims Register (structured query) |
| **Licensing** | EU — reuse with attribution |
| **Citation requirement** | Internal only (editorial review); not displayed to users |
| **Claim suitability** | **Wording firewall.** All published health claims must pass EFSA-register check before approval. The editorial queue surfaces whether a claim has a matching EFSA-permitted phrase. |
| **Recommendation** | ✅ WORDING AUTHORITY (not a tier; orthogonal role) |

### 2.3 Tier 2 — Scientific and nutrition organisations (recommended: SECONDARY)

#### British Nutrition Foundation (BNF)

| Property | Detail |
|---|---|
| **Use for** | UK educational framing; corroboration of NHS claims |
| **Strengths** | Non-commercial; consensus-based; THA's editorial voice; UK-appropriate |
| **Weaknesses** | Rarely the sole novel source; pages behind a more text-heavy structure |
| **Update frequency** | ~Twice per year |
| **Licensing** | Website terms; attribution required; non-commercial implied |
| **Claim suitability** | **Corroboration.** Use to confirm claims already anchored in NHS/NIH. |
| **Recommendation** | ✅ SECONDARY (Tier 2A) |

#### British Heart Foundation (BHF)

| Property | Detail |
|---|---|
| **Use for** | Cardiovascular health claims; omega-3, fibre, sodium context |
| **Strengths** | UK authority; plain language; well-cited |
| **Weaknesses** | Narrow scope (cardiovascular focus); not appropriate for general nutrition |
| **Licensing** | Website terms; attribution required |
| **Claim suitability** | **Secondary for heart health claims only.** |
| **Recommendation** | ✅ SECONDARY for cardiovascular claims only (Tier 2B) |

#### British Dietetic Association (BDA)

| Property | Detail |
|---|---|
| **Use for** | Dietary pattern guidance; food-as-medicine framing |
| **Strengths** | UK professional body; trusted by NHS commissioners |
| **Weaknesses** | Factsheets can become stale without visible update dates |
| **Licensing** | Attribution required |
| **Claim suitability** | **Secondary for dietary pattern claims.** |
| **Recommendation** | ✅ SECONDARY (Tier 2C) |

#### Harvard T.H. Chan School of Public Health (The Nutrition Source)

| Property | Detail |
|---|---|
| **Use for** | Corroboration; evidence-level summary for complex topics |
| **Strengths** | Academically rigorous; synthesises literature well; accessible language |
| **Weaknesses** | US framing; copyright (cite, don't relicense); not a permitted-wording authority |
| **Licensing** | Copyright — cite only, do not reproduce at length |
| **Claim suitability** | **Secondary corroboration only.** Cite in evidence trail; do not mirror wording. |
| **Recommendation** | ✅ SECONDARY (Tier 2D — corroboration only, never sole source) |

#### American Heart Association (AHA)

| Property | Detail |
|---|---|
| **Use for** | Cardiovascular nutrition evidence; Mediterranean diet research |
| **Strengths** | Heavily evidence-based; well-cited |
| **Weaknesses** | US guidelines differ from UK on some claims; not EU-appropriate wording |
| **Licensing** | Copyright — cite only |
| **Claim suitability** | **Secondary for cardiovascular corroboration.** Never sole source for a UK consumer claim. |
| **Recommendation** | ✅ SECONDARY (Tier 2E — corroboration only) |

### 2.4 Tier 3 — Research literature (recommended: EVIDENCE TIER, not editorial)

#### Systematic Reviews & Meta-Analyses

| Property | Detail |
|---|---|
| **Use for** | Establishing evidence strength (Strong / Moderate / Emerging) for nutrient↔benefit relationships |
| **Strengths** | Highest level of evidence; Cochrane reviews especially rigorous |
| **Weaknesses** | Language requires significant editorial translation; cannot be mirrored |
| **Access** | PubMed, Cochrane Library |
| **Licensing** | Copyright (most); open-access increasing |
| **Claim suitability** | **Evidence anchor only.** Used to assign evidence strength; never used as wording source. |
| **Recommendation** | ✅ TIER 3 — evidence anchors only |

#### PREDIMED and Mediterranean Diet Literature

| Property | Detail |
|---|---|
| **Use for** | Mediterranean dietary pattern claims |
| **Strengths** | One of the largest diet-and-cardiovascular RCTs; foundational for olive oil, nuts, legumes, fish claims |
| **Weaknesses** | A retraction and republication episode (2018) means editorial care is required; study-specific, not a general source |
| **Claim suitability** | **Evidence anchor for Mediterranean-pattern claims only.** Requires NHS or BHF corroboration before publishing. |
| **Recommendation** | ✅ TIER 3 — Mediterranean claims evidence anchor |

### 2.5 Sources THA should NEVER use

| Source | Reason |
|---|---|
| **Open Food Facts** | Crowd-sourced; vandalism risk; share-alike licensing (ODbL) creates legal complications. May be used for product barcode linkage only — never for health claims. |
| **Wikipedia** | Crowd-sourced; not a primary source; claim stability too low |
| **Brand / manufacturer nutrition claims** | Commercial conflict of interest; marketing language |
| **Single observational studies** | No causal certainty; results frequently reversed by systematic review |
| **Blog posts, health influencers, press coverage** | Not peer-reviewed; responsible for most misinformation in consumer health |
| **Any source without an update mechanism** | Stale knowledge risk; cannot be monitored for change |
| **Any source without clear authorship** | Cannot be cited; trust cannot be established |

### 2.6 Source selection summary

```
CORE (always cite, auto-import candidates)
  NHS                   — UK consumer wording, health claims
  USDA FDC              — Composition data only
  NIH ODS               — Nutrient↔benefit relationships + evidence grades

WORDING AUTHORITY (gates all published claims)
  EFSA Health Claims Register

SECONDARY (corroboration; never sole source for a claim)
  British Nutrition Foundation
  British Heart Foundation     (cardiovascular only)
  British Dietetic Association
  Harvard Nutrition Source     (corroboration only)
  American Heart Association   (cardiovascular corroboration only)

EVIDENCE TIER (assigns evidence strength; no wording)
  Systematic reviews / meta-analyses (Cochrane, PubMed)
  PREDIMED literature             (Mediterranean claims only)

NEVER USE
  Open Food Facts (for claims)
  Wikipedia
  Brand/manufacturer content
  Single observational studies
  Blogs / influencers / press
  Undated or authorless sources
```

---

## SECTION 3 — PART 2: KNOWLEDGE MODEL

### 3.1 What WS2D established (not re-specified here)

WS2D (`WS2D_CANONICAL_NUTRITION_KNOWLEDGE_ARCHITECTURE.md`) confirmed the target model:

```
knowledge_foods
  └─ knowledge_food_nutrients (food → nutrient, with ranking + amount)
       └─ knowledge_nutrients
            └─ knowledge_nutrient_benefits (nutrient → benefit)
                 └─ knowledge_health_benefits
                      ├─ evidenceStrength
                      ├─ source
                      └─ confidence
```

WS4B adopts this as the knowledge spine. What WS4B adds is the **pipeline-facing view** of that model: the `editorial_status` dimension and the `evidence` traceability layer that feeds the pipeline.

### 3.2 Editorial status as a first-class dimension

Every knowledge claim at every level of the model carries an `editorial_status`. This is not a single table column — it is a **lifecycle state** present on any row that can be published.

```
Candidate
  │  (created by ingestion; never visible to users)
  ↓
Draft
  │  (curator has seen it; may have edited wording; not yet reviewed)
  ↓
In Review
  │  (submitted for approval; locked from editing)
  ↓
Approved
  │  (human signed off; awaiting publish action)
  ↓
Published
  │  (in the live registry; the only state the app reads from)
  ↓
Deprecated
     (superseded by newer evidence or editorial change;
      retained for audit; never shown to users)
```

**Rejected** is a terminal state from `In Review` or `Draft` (claim was evaluated and discarded). A rejected claim is retained in the candidate store for audit but never promoted.

### 3.3 The complete knowledge record for one food claim

Taking Tomato → Lycopene → Heart Health as the example:

```
CanonicalFood
  slug: "tomato"
  displayName: "Tomato"
  knowledge_food_slug: "tomatoes"         ← FK into WS0 registry

KnowledgeFoodNutrient
  food_slug: "tomatoes"
  nutrient_slug: "lycopene"
  ranking: 1                              ← primary nutrient for this food
  composition_source: "USDA:FDC:787793"  ← USDA FoodData Central food ID
  editorial_status: "published"

KnowledgeNutrient
  slug: "lycopene"
  displayName: "Lycopene"
  category: "antioxidant"

KnowledgeNutrientBenefit
  nutrient_slug: "lycopene"
  benefit_slug: "heart-health"
  evidence_strength: "moderate"           ← derived from NIH ODS grade
  source_ids: ["nih-ods-lycopene", "nhs-tomatoes-2024"]
  editorial_status: "published"

KnowledgeHealthBenefit
  slug: "heart-health"
  displayName: "Heart Health"
  approved_wording: "Associated with supporting heart health"
  wording_justification: "EFSA-adjacent phrasing; 'associated with' is non-causal"
  editorial_status: "published"

KnowledgeNutritionContext
  food_slug: "tomatoes"
  context_text: "Cooking tomatoes increases lycopene availability."
  context_type: "preparation_note"
  source_ids: ["nhs-tomatoes-2024"]
  editorial_status: "published"

Evidence (per source_id)
  id: "nhs-tomatoes-2024"
  source: "NHS"
  source_type: "government"
  source_url: "https://www.nhs.uk/live-well/eat-well/food-types/tomatoes/"
  accessed_date: "2026-06-20"
  evidence_strength: "moderate"
  confidence: "high"
  editorial_notes: "NHS page reviewed by registered dietitians"
  last_checked: "2026-06-20"
  content_hash: "<hash of page at access time>"
  status: "active"
```

### 3.4 The nutrient bridge — unchanged from prior investigations

The central trust decision established in `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` and carried into all successor investigations:

> **THA never authors a per-food health claim. THA authors `Food → Nutrient` links (composition data, from USDA/NHS) and `Nutrient → Benefit` links (science, from NIH ODS/systematic reviews). The health claim is composed, not invented.**

This means:
- "Tomatoes are rich in lycopene" → authored as a Food→Nutrient link
- "Lycopene is associated with heart health" → authored as a Nutrient→Benefit link
- "Tomatoes support heart health" → *composed* by the system from the two links above

THA never writes "Tomatoes support heart health" as a direct, unanchored claim. The composition proves it.

---

## SECTION 4 — PART 3: INGESTION ARCHITECTURE

### 4.1 The complete ingestion flow

```
Trusted Source
  (NHS page / USDA FDC / NIH ODS factsheet)
       │
       ▼
Source Fetcher
  • Retrieves content at scheduled interval
  • Hashes page content
  • Compares hash to last_content_hash in source_documents
  • If hash unchanged → records last_checked only, stops here (no candidate created)
  • If hash changed OR new source → proceeds
       │
       ▼
Source Parser
  • Extracts structured claims from raw content
  • Identifies food mentions, nutrient mentions, health outcome mentions
  • Notes explicit evidence gradings where present (NIH ODS)
       │
       ▼
Canonical Food Matcher
  (see §4.3 — this is the most complex step)
       │
       ▼
Candidate Writer
  • Writes to candidate_facts table (NOT the published tables)
  • Sets editorial_status = 'candidate'
  • Sets publish_state = 'quarantine'
  • Attaches source_document_id
  • Attaches canonical_food_id (if matched) or NULL (if unmatched)
  • NEVER writes to published_* tables
  • NEVER writes to knowledge_* live tables
       │
       ▼
Conflict Detector
  • Checks if an identical claim already exists in published registry
  • Checks if claim contradicts an existing published claim
  • Assigns conflict_flag: none / duplicate / contradiction / update
       │
       ▼
Editorial Queue
  (human picks up from here — §5)
```

### 4.2 Scheduling

| Source | Recommended check interval | Rationale |
|---|---|---|
| NHS | Weekly | Pages update infrequently; weekly check ensures no missed change goes beyond 7 days |
| USDA FDC | On quarterly release | FDC publishes release dates; check within 48h of each release |
| NIH ODS | Monthly | Fact sheets update 1–2× per year; monthly is safe and not noisy |
| BNF | Monthly | Similar update pace to NIH ODS |
| BHF / BDA | Monthly | Similar |
| Harvard | Quarterly | Lower priority; corroboration only |
| EFSA Register | On update notification | EFSA publishes an RSS/atom feed when the register changes |

**Key scheduling principle:** A scheduled check that finds no change (identical hash) creates **no candidate rows** and adds **zero editorial queue work**. The scheduler exists to catch changes — not to create busywork.

### 4.3 Canonical food matching during ingestion

This is the most consequential step. When an NHS page about "tomatoes" is parsed, the ingestion system must map "tomatoes" (plural, as found in the wild) to `canonical_food.slug = 'tomato'` (singular, the THA identity spine).

**Matching strategy (in order of confidence):**

```
Step 1 — Exact slug match
  source_term = "tomato" → canonical_food.slug = "tomato"   ✅ match
  confidence: high

Step 2 — Alias resolver (WS2A)
  source_term → canonical_food_alias.alias_key → canonical_food.slug
  "tomatoes" → alias_key = "tomatoes" → slug = "tomato"     ✅ match
  confidence: high

Step 3 — Variety resolver (WS2A)
  "cherry tomatoes" → food_variety → canonical_food.slug     ✅ match (with variety flag)
  confidence: high

Step 4 — Normalised lookup
  Remove plurals, stopwords, common suffixes → retry step 1–3
  "sun-dried tomatoes" → normalise → "sun-dried tomato" → alias check
  confidence: medium (flag for editorial confirmation)

Step 5 — No match found
  source_term placed in candidate_facts with canonical_food_id = NULL
  editorial_status = 'unmatched' (a sub-status of 'candidate')
  Admin sees it in a separate "Unmatched Claims" queue
```

**Unmatched claims are not discarded** — they surface in the editorial queue as items requiring a manual canonical match decision. If the claim is for a valid food THA does not yet have in the canonical spine, this becomes a trigger to add it there first.

### 4.4 Conflict handling

| Conflict type | Detection | Queue handling |
|---|---|---|
| **Duplicate** | Identical food + nutrient + benefit already published | Marked duplicate; admin can dismiss or use to update source citation |
| **Update** | Same claim; newer or updated source; same conclusion | Marked update; admin reviews whether to update last_reviewed and source |
| **Contradiction** | Same food + benefit; different conclusion (e.g. one source says moderate, another says insufficient) | Marked contradiction; elevated priority in queue; admin must resolve before either can be published |
| **Source disagreement** | Two Tier 1 sources disagree on evidence strength | Treated as contradiction; admin sets THA position; lower strength wins if in doubt |
| **New claim** | No matching claim in published registry | Standard review path |

**Source disagreement rule:** When two Tier 1 sources disagree, THA defaults to the *more cautious* position. "Moderate" beats "Strong" if there is any doubt. This is a trust rule, not an editorial rule — it is enforced in the conflict detector, not left to admin discretion.

### 4.5 Duplicate claim handling

The same benefit can appear in multiple source documents (e.g. both NHS and NIH ODS say tomatoes contain lycopene). THA treats these as **evidence accumulation**, not duplication:

- First source creates the candidate/claim
- Subsequent sources **add to the `source_ids` array** of the existing claim
- The claim is not duplicated
- The editorial review shows all sources for the claim
- More sources for the same claim increases confidence, not noise

---

## SECTION 5 — PART 4: EDITORIAL WORKFLOW

### 5.1 The editorial problem

THA admins are not nutrition researchers. They should not need to evaluate whether lycopene is associated with heart health — that is the NIH ODS's job. What they should do:

1. Confirm that THA is comfortable saying this fact, in this wording, attributed to these sources
2. Reject if the wording feels medical, promotional, or overstated
3. Approve, edit wording, or reject — nothing more complex

The system should present **everything the admin needs to decide** and **nothing they would need to research independently**.

### 5.2 Editorial queue design

The editorial queue is a prioritised list of claims awaiting decision. Each item shows:

```
┌────────────────────────────────────────────────────────────┐
│  DRAFT CLAIM                              Priority: Normal  │
│                                                            │
│  Food:    Tomato                                           │
│  Nutrient: Lycopene                                        │
│  Benefit:  Supports heart health                           │
│                                                            │
│  Suggested wording:                                        │
│  "Tomatoes are rich in lycopene, an antioxidant            │
│   associated with heart health."                           │
│                                                            │
│  Evidence:                                                 │
│  ✅ NHS — "Foods high in lycopene include tomatoes"        │
│     nhs.uk/live-well/eat-well · Accessed 2026-06-20       │
│  ✅ NIH ODS — Lycopene fact sheet, evidence grade B       │
│     ods.od.nih.gov · Accessed 2026-06-20                  │
│                                                            │
│  Evidence strength:  Moderate                              │
│  EFSA check:         ✅ Phrasing within permitted scope    │
│  Conflict:           None                                  │
│  Nutrition context:  "Cooking increases lycopene           │
│                       availability."                       │
│                                                            │
│  [✓ Approve]   [✎ Edit wording]   [✗ Reject]             │
└────────────────────────────────────────────────────────────┘
```

The admin sees:
- **What the claim says** — in plain English, not database language
- **Why THA believes it** — sources with URLs and access dates
- **How strong the evidence is** — in plain terms (Strong / Moderate / Emerging)
- **Whether the wording is safe** — EFSA status, flagged issues
- **Whether there are conflicts** — surfaced directly, not buried

The admin decides only: approve / edit / reject.

### 5.3 Wording workflow

When an admin selects "Edit wording":

1. The suggested wording is shown in a text editor
2. The editor checks wording against the Editorial Rules Engine (§8.2) in real time
3. Blocked phrases (disease language, cure claims) are highlighted immediately
4. Allowed phrases show a green indicator
5. The admin saves edited wording
6. The system re-checks EFSA alignment
7. The claim moves to "Approved" (not "Published" — publishing is a separate deliberate action)

**Publishing is always a separate step from approval.** An admin can approve many claims and then publish in a batch, or publish immediately — but approval and publication are never conflated into one click.

### 5.4 Audit trail

Every state transition in the review lifecycle is logged:

```
audit_log
  claim_id:        <uuid>
  from_status:     candidate
  to_status:       draft
  action:          system_ingest
  actor:           <ingestion job id>
  timestamp:       2026-06-20T14:23:00Z
  notes:           ""

audit_log
  claim_id:        <uuid>
  from_status:     draft
  to_status:       approved
  action:          admin_approve
  actor:           <admin user id>
  timestamp:       2026-06-20T15:02:00Z
  notes:           "Wording edited: changed 'helps' to 'associated with'"

audit_log
  claim_id:        <uuid>
  from_status:     approved
  to_status:       published
  action:          admin_publish
  actor:           <admin user id>
  timestamp:       2026-06-20T15:04:00Z
  notes:           ""
```

The audit log is immutable (append-only). Nothing can be edited in the audit trail.

### 5.5 Version history

When a published claim's wording is edited, the old version is retained:

```
claim_versions
  claim_id:        <uuid>
  version:         1
  wording:         "Tomatoes are rich in lycopene..."
  published_by:    <admin id>
  published_at:    2026-06-15T10:00:00Z
  superseded_at:   2026-06-20T15:04:00Z

claim_versions
  claim_id:        <uuid>
  version:         2        ← current
  wording:         "Tomatoes contain lycopene..."
  published_by:    <admin id>
  published_at:    2026-06-20T15:04:00Z
  superseded_at:   NULL
```

### 5.6 Queue prioritisation

| Priority | Trigger |
|---|---|
| **Critical** | Contradiction between published claim and new source; previously published claim source has become unavailable |
| **High** | Source update detected (content hash changed on a source feeding a published claim) |
| **Normal** | New candidate claim from a trusted source |
| **Low** | Corroboration source added to an existing published claim (no wording change needed) |
| **Deferred** | Unmatched claims (no canonical food match found) |

---

## SECTION 6 — PART 5: EVIDENCE MODEL

### 6.1 Per-claim evidence record

Every claim stored in the knowledge system carries:

| Field | Type | Description |
|---|---|---|
| `source_id` | FK | Reference to source document |
| `source_type` | enum | `government` / `scientific_org` / `academic_review` / `research_literature` |
| `evidence_strength` | enum | `strong` / `moderate` / `emerging` / `insufficient` |
| `last_reviewed_date` | date | When a human last confirmed this claim is current |
| `review_expiry_date` | date | When the claim must be reviewed again |
| `confidence` | enum | `high` / `medium` / `low` |
| `editorial_notes` | text | Free text from the reviewing admin |
| `efsa_status` | enum | `permitted` / `adjacent` / `not_checked` / `not_applicable` |
| `claim_type` | enum | `composition` / `nutrient_benefit` / `nutrition_context` / `dietary_pattern` |

### 6.2 Evidence strength definitions

**Strong**
- Source: systematic review, Cochrane review, or multi-study meta-analysis
- NIH ODS grade: A or B
- Multiple Tier 1 corroborating sources
- No contradicting Tier 1 or Tier 2 sources
- Allowed wording: "associated with", "contributes to", "supports"

**Moderate**
- Source: Tier 1 government body (NHS, NIH ODS) with explicit endorsement
- NIH ODS grade: B or C
- At least one corroborating Tier 2 source
- No contradicting sources, or contradictions from lower tiers only
- Allowed wording: "may support", "research suggests", "associated with in some studies"

**Emerging**
- Source: promising recent research; systematic review underway but not concluded
- NIH ODS grade: C or D
- Few or no corroborating sources
- Some contradicting evidence may exist
- Allowed wording: "early research suggests", "some research indicates"

**Insufficient**
- Contradictory evidence, or insufficient studies to draw conclusions
- NIH ODS grade: D or F
- Use only in nutrition context ("evidence is limited") or do not publish at all
- **Default action:** reject claim or publish only as nutrition context with explicit caveat

### 6.3 How evidence strength maps to approved wording

| Evidence strength | Approved constructions | Prohibited |
|---|---|---|
| **Strong** | "associated with", "contributes to", "supports", "is a source of", "rich in" | "proves", "cures", "prevents", "guarantees" |
| **Moderate** | "may support", "research suggests", "linked to" | "definitely", "will", "cures", "prevents" |
| **Emerging** | "early research suggests", "some studies indicate" | "associated with" (implies strength not earned), all strong language |
| **Insufficient** | Nutrition context only: "evidence is currently limited on whether…" | Any positive benefit claim |

### 6.4 Confidence vs evidence strength

These are distinct concepts that are often conflated.

- **Evidence strength** is a property of the scientific literature. It reflects how many studies exist, their quality, and their agreement.
- **Confidence** is THA's certainty that the sources THA is using accurately represent that literature. A well-cited NHS page gives high confidence in a moderate-strength claim.

A claim can have:
- High confidence, strong evidence: ideal; publish
- High confidence, moderate evidence: publish with appropriate wording
- High confidence, emerging evidence: publish with "early research" wording
- Low confidence, strong evidence: investigate why sources disagree before publishing
- Low confidence, insufficient evidence: do not publish

---

## SECTION 7 — PART 6: STALE KNOWLEDGE STRATEGY

### 7.1 What stale knowledge looks like

Knowledge becomes stale when:
1. A source page changes its content (the claim THA is citing no longer says what it said)
2. A source page is removed or moved (URL 404 or redirect)
3. New evidence emerges that contradicts or supersedes the claim
4. The review expiry date passes without a curator re-confirmation
5. The field of knowledge advances significantly (a large systematic review updates the evidence grade)

### 7.2 Automated detection mechanisms

**Content hash monitoring (scheduled)**
Every source document that feeds a published claim has a stored `content_hash`. The staleness monitor:
- Refetches each source URL at the scheduled interval (see §4.2)
- Hashes the fetched content
- Compares to stored hash
- If changed: raises a `source_changed` staleness flag; creates a new candidate from the updated content; marks existing claim as `needs_review`

**Availability monitoring (daily)**
- Checks all source URLs return a 200 status
- If 404/redirect: raises `source_unavailable` flag with priority `critical`
- The claim is not automatically unpublished — but the admin sees a critical alert

**Review expiry (rule-based)**
Every published claim has a `review_expiry_date`. Default expiry rules:

| Evidence strength | Default review interval |
|---|---|
| Strong | 18 months |
| Moderate | 12 months |
| Emerging | 6 months |
| Insufficient | Not published (no expiry needed) |

When expiry passes without a review action, the claim is flagged with a `review_overdue` staleness flag. The claim is NOT automatically deprecated — it remains live but surfaces in the admin dashboard with a staleness indicator.

**Manual expiry override**
Admins can set custom review dates on any claim (e.g. "re-review this in 3 months when the follow-up study is expected"). The system honours custom dates over defaults.

### 7.3 The staleness dashboard

Admins see a dedicated staleness view:

```
KNOWLEDGE HEALTH DASHBOARD

⚠ Critical (requires action)
  2 claims have unavailable source URLs
  1 claim has a contradicting new candidate from a Tier 1 source

⚡ High Priority
  7 claims have changed source content since last review

📋 Review Overdue
  14 claims past their review expiry date

ℹ Informational
  3 claims have new corroborating sources (no action required)
```

### 7.4 What the system does NOT do

- It does **not** automatically unpublish stale claims
- It does **not** automatically update wording when a source changes
- It does **not** make any automated changes to the published registry
- It does **not** send reminders to users that a claim "may be outdated"

Staleness detection is **alert-only**. Every change to published knowledge is a human action.

### 7.5 Retiring superseded evidence

When a claim is superseded (newer evidence changes the conclusion):

1. Admin creates a new claim (or approves the ingested candidate)
2. Admin publishes the new claim
3. Admin **explicitly deprecates** the old claim (a deliberate action, not automatic)
4. The deprecated claim moves to `editorial_status = 'deprecated'`
5. Audit trail records the supersession with reason
6. The old claim is retained in the archive (never deleted)

---

## SECTION 8 — PART 7: INTEGRATION POINTS

### 8.1 The one-source-of-truth contract

All THA surfaces read knowledge through **one adapter**:

```typescript
// The only public interface for nutrition knowledge
buildFoodKnowledge(canonicalSlug: string): FoodKnowledge

// FoodKnowledge shape (simplified)
{
  food: CanonicalFood
  keyNutrients: KeyNutrient[]         // from knowledge_food_nutrients (published)
  benefits: FoodBenefit[]             // composed via nutrient bridge (published)
  nutritionContext: NutritionContext[] // from knowledge_nutrition_context (published)
  qualifiers: FoodQualifier[]         // from WS3B (published separately)
  evidenceSummary: EvidenceSummary    // aggregate evidence strength
}
```

No surface creates its own knowledge store. No surface queries candidate or draft tables. No surface composes its own claims. The adapter is the **only** path from the published registry to the application.

### 8.2 Per-surface integration

#### Nutrition Report

- **What it needs:** per-food benefits, evidence strength, key nutrients, nutrition context for foods in the week's meals
- **How it reads:** `buildFoodKnowledge(slug)` for each distinct canonical food in the week; caches per request
- **What it does NOT show:** evidence strength scores directly (too technical); shows wording calibrated to strength
- **Trust concern:** claim wording in the report must match the evidence strength level; the adapter enforces this by returning the approved wording, never a raw claim
- **Integration contract:** report surfaces only `editorial_status = 'published'` items. If no published knowledge exists for a food, the report shows no benefit claim for that food (no fallback improvisation)

#### Food Report

- **What it needs:** full knowledge profile for a single canonical food — all benefits, key nutrients, nutrition context, varieties, qualifiers, dietary pattern associations
- **How it reads:** `buildFoodKnowledge(slug)` once per page load; rich display
- **What it does NOT show:** source URLs (these are editorial; not consumer-facing); confidence scores
- **Integration contract:** same published-only rule; Food Report is the most knowledge-dense surface; must not invent context

#### Pantry

- **What it needs:** `whyItMatters`, `goodToKnow`, `howToChoose` prose for foods in the pantry
- **How it reads:** adapter provides `nutritionContext` items typed by `context_type` (`why_it_matters`, `good_to_know`, `how_to_choose`)
- **Transition:** today `pantry-knowledge.ts` is a static client-side store; long-term it is a display cache of the published registry; the `context_type` field bridges the two
- **Integration contract:** pantry shows `nutrition_context` items only; no independent claims

#### Broaden Your Week

- **What it needs:** diversity group memberships, brief benefit summary per food group, variety suggestions
- **How it reads:** adapter provides group-level knowledge (which diversity groups this food covers) and brief benefit summary
- **Trust concern:** must not make specific health claims at the group level unless the evidence applies to the whole group, not just one food in it
- **Integration contract:** group-level claims are general educational framing ("Fermented foods contain live cultures") not specific benefit claims ("reduces bloating")

#### Healthier Alternatives

- **What it needs:** knowledge about *why* one food is a better choice than another (e.g. why Greek yoghurt over cream)
- **How it reads:** `knowledge_food_relationships` (type: `healthier_alternative`) + benefit comparison from the adapter
- **Trust concern:** comparison claims are the highest-risk wording ("X is healthier than Y"). Must only use "supports a balanced diet" framing, not comparative health claims
- **Integration contract:** alternatives surface never makes direct comparison health claims; shows nutrient differences, not benefit comparisons

#### Shopping

- **What it needs:** qualifier-level context (wild vs farmed salmon; organic certification), buying guidance, label literacy
- **How it reads:** `FoodQualifier` from the adapter (WS3B) + any published nutrition context typed as `buying_guidance`
- **Trust concern:** buying guidance must not imply a product is therapeutic; must not make claims that could be construed as advertising
- **Integration contract:** shopping surface shows qualifier and context knowledge only; no benefit claims directly on the shopping list

#### Analyser

- **What it needs:** the fullest picture — benefits, nutrients, qualifiers, evidence strength, dietary pattern alignment, preparation notes
- **How it reads:** full `buildFoodKnowledge()` output; Analyser is the most technical surface and can show evidence strength to users who want it
- **Trust concern:** Analyser users are actively seeking depth; evidence strength shown here must be explained, not just displayed as a label
- **Integration contract:** Analyser is the only surface allowed to show evidence strength labels; must always contextualise them ("Moderate means multiple studies suggest this, but evidence is not conclusive")

### 8.3 Shared contracts (all surfaces)

| Rule | Detail |
|---|---|
| **Published only** | All surfaces query only `editorial_status = 'published'` |
| **No empty-state improvisation** | If no knowledge exists for a food, return empty, not a fallback claim |
| **Adapter is the gatekeeper** | No surface queries knowledge tables directly; all go through the adapter |
| **Wording is pre-approved** | Surfaces display the `approved_wording` field; they do not compose their own sentences from nutrient names |
| **Source not shown to users** | Source URLs and confidence scores are editorial artefacts; not displayed in consumer UI |
| **One adapter update propagates everywhere** | A wording change to a published claim, once approved, flows to all surfaces immediately — no surface-specific copy |

---

## SECTION 9 — PART 8: TRUST CHECK

### 9.1 The language guardrail model

THA uses a **three-layer language guardrail**:

**Layer 1 — Hard blocks (never permitted)**

These phrases are blocked by the Editorial Rules Engine and cannot be approved regardless of evidence strength. No admin can override them without a system change.

```
BLOCKED LANGUAGE — DISEASE CLAIMS
  prevents [disease]
  cures [disease]
  treats [condition]
  reverses [condition]
  fights [disease]
  kills [bacteria/virus] (in a health context)
  heals [condition]

BLOCKED LANGUAGE — GUARANTEE CLAIMS
  will [benefit]
  guarantees [outcome]
  definitively [outcome]
  proven to [outcome]
  clinically proven to [outcome]

BLOCKED LANGUAGE — DIAGNOSTIC CLAIMS
  if you have [condition]
  for people with [disease]
  reduces symptoms of [disease]
  recommended for [medical condition]

BLOCKED LANGUAGE — MARKETING SUPERLATIVES
  superfood
  miracle food
  best source of
  uniquely powerful
  unmatched [benefit]
```

**Layer 2 — Strength-gated language (permitted only at correct evidence level)**

```
"associated with"          → allowed at Moderate and above
"supports"                 → allowed at Strong only
"contributes to"           → allowed at Strong only
"research suggests"        → allowed at Moderate and above
"early research suggests"  → allowed at Emerging only
"may support"              → allowed at Moderate only (not Strong — too weak for the evidence)
```

**Layer 3 — Tone guardrails (editorial review)**

These are flagged for human review but not automatically blocked:

- Nutritional absolutism ("X is the only food that...")
- Implied sufficiency ("eating X gives you all the Y you need")
- Frequency claims without evidence ("eating X daily...")
- Negative framing about foods THA doesn't editorially recommend

### 9.2 How THA avoids overstating evidence

The wording-to-strength mapping in §6.3 is enforced by the system, not left to admin judgment. An admin approving a "Moderate" claim is shown only wording templates appropriate for Moderate evidence. They cannot type "definitely supports heart health" on a Moderate claim — the rules engine blocks it on submit.

### 9.3 Trust check for automatic imports

**Could automatic imports introduce misinformation?**

The four-plane architecture addresses this directly: candidates are physically isolated from published tables. Even a completely incorrect import (wrong nutrient, wrong benefit, garbled source text) cannot reach users. It sits in the candidate store until a human evaluates it.

The risk model for the ingestion plane is not "could wrong information be imported" (yes, it could, and that is acceptable) but "could wrong information reach users without human review" (this is what the hard wall prevents).

**Could AI summarise incorrectly?**

When AI is used for wording suggestions (§10), the AI output is:
1. Constrained to a template (AI fills slots; AI does not choose the claim)
2. Validated against the Editorial Rules Engine before a human sees it
3. Shown to a human as a suggestion, not as published text
4. Never published automatically

An AI that summarises incorrectly produces a bad suggestion that a human rejects. No user sees it.

**How are claims explained to users?**

THA does not expose the evidence architecture to users. Users see approved wording ("Tomatoes are rich in lycopene, associated with heart health") and the food source attribution ("Source: NHS"). The evidence grade, confidence level, and source document details are editorial artefacts.

The one exception is the **Analyser** (§8.2), where users who request depth can see the evidence strength explained in plain language.

---

## SECTION 10 — PART 9: FUTURE AI SUPPORT

### 10.1 The AI boundary

The Editorial/Automation Framework established this line clearly; WS4B carries it forward without change:

> **THA never automates truth. THA automates only THA-owned layers: wording, presentation, citation-attachment, normalisation and triage. The science layer — does this nutrient relate to this outcome — is human-blessed once per pattern and never re-decided by a machine.**

AI is a tool that operates entirely within the THA-owned layers. It does not evaluate science. It does not approve claims. It does not publish. Every AI output is a suggestion visible only to a human reviewer.

### 10.2 Where AI can assist (bounded roles)

**Source summarisation**

AI can summarise a long NHS page or NIH factsheet to extract candidate claims in structured form. This reduces the parser engineering burden and handles unstructured prose better than regex.

Boundary: the summary is a candidate. It goes through the full review pipeline. The AI is not trusted as a source; the source is trusted. The AI is trusted only as a parser.

**Wording suggestions**

Given a claim structure (food, nutrient, benefit, evidence strength), AI can suggest a sentence using the appropriate template for that evidence level.

Boundary: AI can only slot values into a pre-approved template structure. AI cannot propose a new claim type, a new benefit, or a wording shape that doesn't already exist in the Editorial Rules Engine. AI suggestions are validated against the rules engine before presenting to the admin. An AI suggestion that fails the rules engine is silently discarded and the admin sees the template default instead.

**Conflict detection**

AI can flag potential contradictions between a new candidate and existing published claims — especially when the contradiction is semantic (different wording for the same underlying claim) rather than structurally identical (same nutrient, same benefit, explicit discrepancy).

Boundary: AI raises flags; humans resolve them. AI cannot mark a contradiction as resolved, cannot merge claims, cannot deprecate a published claim.

**Stale knowledge detection**

AI can compare the current content of a source page against the THA-stored version of that source's content (when hash-based detection alone is insufficient — e.g. a major page restructure that moves the relevant section).

Boundary: AI raises a `content_changed` flag. Human reviews. AI cannot update any claim based on the new content.

### 10.3 What AI must never do

| Action | Reason |
|---|---|
| Publish a claim | Crosses the hard wall; undermines the entire trust model |
| Deprecate a published claim | Same |
| Evaluate evidence quality | Science layer is human-and-source owned |
| Choose which source to trust in a conflict | Source trust hierarchy is a policy decision |
| Generate benefit claims not grounded in a source | Hallucination risk; the system is source-anchored by design |
| Access production published tables directly | AI reads only candidates and draft items |
| Act without a human downstream | Every AI action has a human review step |

### 10.4 The autonomy curve (editorial framework finding, summarised here)

The Editorial/Automation Framework proposed a four-phase autonomy model:

- **Phase 1 (per-item):** every claim reviewed individually — current position
- **Phase 2 (per-pattern):** admin blesses a wording pattern (e.g. the Magnesium→Energy template); new claims matching that exact pattern are auto-drafted with that wording
- **Phase 3 (auto-apply known pattern):** identical-in-kind claims using a blessed pattern with a Tier 1 source can auto-advance to `approved` (not `published`); human still publishes
- **Phase 4 (exceptions-only):** known patterns, known sources, known wording auto-publish; only novel claims, conflicts, and contradictions require a human decision

**WS4B position:** THA is not yet at Phase 1 in any implemented sense. The pipeline itself (the ingestion system, the review queue, the published registry) does not yet exist. Phase 2 onwards is a future consideration, not a design decision for now.

The recommendation is to **build Phase 1 correctly first** — with the full hard-wall architecture — before any consideration of autonomy escalation. A Phase 1 system that is trusted and understood is the prerequisite for Phase 2 being safe.

---

## SECTION 11 — RISKS

### 11.1 Ingestion risks

| Risk | Severity | Mitigation |
|---|---|---|
| Source page structure changes, breaking the parser | Medium | Hash-based change detection catches it; parser failure is logged; claim is not silently skipped |
| A Tier 1 source publishes incorrect information | Medium | Multiple-source corroboration requirement for health claims; no single-source publication |
| USDA composition data has US-specific fortification norms | Low | Flag USDA-only claims as "composition estimate"; always cross-check with NHS where possible |
| Licensed content (BNF) is mirrored without attribution | Medium | Attribution rules enforced in the evidence store; publishing workflow shows citation requirement |
| ODbL (Open Food Facts) share-alike contamination | High | OFF excluded from health claims entirely; used only for product linkage in a separate pipeline |

### 11.2 Editorial risks

| Risk | Severity | Mitigation |
|---|---|---|
| Admin approves a claim without reading the evidence | Medium | UI presents evidence before approval buttons; evidence is required (not collapsible) |
| Admin edits wording to introduce a disease claim | High | Editorial Rules Engine validates wording on submit; blocked phrases cannot be saved |
| Queue grows too large for admins to keep up | Medium | Priority tiers ensure critical items are acted on first; low-priority items can queue indefinitely |
| Admin approves a claim from memory without checking source | Medium | Claim always shows source with URL; clicking source confirms it is live |
| Two admins approve contradictory claims simultaneously | Low | Claim lock during `in_review` state; only one admin can review a claim at a time |

### 11.3 Stale knowledge risks

| Risk | Severity | Mitigation |
|---|---|---|
| A source quietly retires a claim (no 404, just content removal) | Medium | Content hash change triggers `source_changed` flag for admin review |
| Review expiry dates are never acted on | Medium | Dashboard surfacing; escalation if overdue count exceeds threshold |
| Knowledge grows faster than admins can review | Medium | Ingestion rate is tunable; new sources can be paused without code changes |
| A superseded claim is never formally deprecated | Low | Staleness monitor checks for claims where a newer published claim covers the same nutrient→benefit |

### 11.4 Wording risks

| Risk | Severity | Mitigation |
|---|---|---|
| EFSA register updates render a published phrase non-compliant | Medium | EFSA register monitoring; on register update, all published phrases are re-checked |
| A UK regulatory body (ASA/NHS) updates guidance on health claims | Medium | NHS is a monitored source; guidance changes are ingested as candidate items |
| Wording that was safe in context looks promotional in isolation (e.g. on Shopping) | Medium | Surface-specific wording review: all surfaces pre-test display of approved wording |

---

## SECTION 12 — CANONICAL MAPPING APPROACH (SYNTHESIS)

### 12.1 The canonical mapping challenge

The WS4B pipeline must bridge three distinct slug spaces:

```
External world:     "tomatoes", "cherry tomatoes", "Lycopene", "lyco-pene"
WS0 registry:       "tomatoes" (plural, WS0 convention)
WS2A canonical:     "tomato" (singular, THA canonical slug)
```

The ingestion system operates in the external world. The published registry operates in the WS2A/WS0 space. The canonical matcher must bridge them reliably.

### 12.2 Matching decision tree

```
Input: source_term = "cherry tomatoes"

1. Does source_term exactly match a canonical_food.slug? → NO
2. Does source_term match any canonical_food_alias.alias_key? → YES (cherry tomato → tomato)
3. Is there a food_variety for this? → YES (cherry tomato is a variety of tomato)
4. Assign: canonical_food_id = <tomato>, variety_flag = true, variety_id = <cherry-tomato>
5. Confidence: HIGH
```

```
Input: source_term = "sun-dried tomatoes"

1. Exact slug match? → NO
2. Alias match? → NO (sun-dried not in alias table yet)
3. Normalise: "sun-dried tomato" → alias match? → NO
4. Form decomposition: remove "sun-dried" → "tomato" → canonical match
5. Assign: canonical_food_id = <tomato>, form_note = "sun-dried"
6. Confidence: MEDIUM — flag for admin confirmation
```

```
Input: source_term = "oat milk"

1. Exact slug match? → YES (canonical_food.slug = "oat-milk")
2. Assign: canonical_food_id = <oat-milk>
3. Confidence: HIGH
```

```
Input: source_term = "quinoa"

1. Exact slug match? → YES
2. Assign: canonical_food_id = <quinoa>
3. Confidence: HIGH
```

```
Input: source_term = "adaptogenic mushrooms"

1. Exact slug match? → NO
2. Alias match? → NO
3. Normalise → NO match
4. Form decomposition → "mushrooms" → canonical match to mushroom
5. "adaptogenic" → qualifier? → NO (not in qualifier table; marketing term)
6. Assign: canonical_food_id = NULL, unmatched_reason = "qualifier not recognised"
7. Status: UNMATCHED — surfaces in admin queue
```

### 12.3 Canonical mapping governance

The canonical matcher is read-only against the canonical spine — it cannot add new canonical foods, aliases, or varieties during ingestion. If a food appears in a trusted source and has no canonical match:

1. The claim lands in the `unmatched` queue
2. An admin decides: add this food to the canonical spine (WS2A operation), add an alias, or classify as out of scope
3. Only after the canonical spine is updated does the claim re-enter the standard pipeline

This preserves the WS2A invariant: **the canonical food spine is curated, not auto-populated**.

---

## SECTION 13 — RECOMMENDATIONS

### 13.1 Build order

| Phase | What to build | Why |
|---|---|---|
| **Phase 0 (now)** | Formalise the trusted source list as a configuration (not code); document which sources feed which claim types | Zero implementation; establishes editorial policy before any pipeline |
| **Phase 1 (next)** | Published registry tables + the single read adapter (`buildFoodKnowledge`) | Surfaces can start reading from a structured source instead of static TS files; existing static content is the seed data |
| **Phase 2** | Editorial review UI + audit log + version history | Admins can promote items from static seed into the registry with proper tracking |
| **Phase 3** | Ingestion pipeline — USDA FDC first (structured API, composition only, lowest risk) | Proves the ingestion→candidate→review flow with the safest source type |
| **Phase 4** | Add NHS and NIH ODS ingestion (scraping); canonical matcher | Health claims pipeline |
| **Phase 5** | Staleness monitoring; review expiry; staleness dashboard | Knowledge maintenance |
| **Phase 6 (future)** | AI-assisted wording suggestions within constrained templates | Only after Phase 1–5 are stable and trusted |

### 13.2 Design decisions to preserve

These findings from prior investigations must not be reversed:

1. **The hard wall** — candidate tables are physically separate from published tables. This is not negotiable for trust reasons.
2. **The nutrient bridge** — THA composes claims from `food → nutrient → benefit`; THA does not author direct food→benefit claims
3. **One adapter** — all surfaces read through `buildFoodKnowledge()`; no surface has its own knowledge store
4. **Wording is pre-approved** — surfaces display approved_wording; they do not compose sentences
5. **AI never publishes** — any AI involvement stops before the publication action

### 13.3 Decisions WS4B leaves open (for implementation phase)

- Whether the ingestion jobs run server-side (Node cron) or as external workers
- Whether the editorial UI is a section of the existing admin panel or a standalone tool
- The exact Drizzle schema names for candidate and published tables (follow `shared/schema.ts` conventions when implementing)
- Whether staleness alerts are in-app dashboard items or email notifications
- Whether Phase 2 autonomy is ever pursued (depends on editorial workload observed in Phase 1)

---

## SECTION 14 — SUGGESTIONS (FUTURE IDEAS — OUT OF SCOPE FOR WS4B)

These are ideas that emerged during investigation but are explicitly out of scope for this workstream:

**SUGGESTION — Structured clinical trial monitoring**
Track ClinicalTrials.gov for registered studies related to foods in the THA knowledge base. Could give advance notice of upcoming evidence changes.

**SUGGESTION — Knowledge coverage report**
An internal dashboard showing which canonical foods have published knowledge, which are empty, and which have only partial knowledge (nutrients but no context). Useful for prioritising editorial effort.

**SUGGESTION — Localisation model**
UK users and US users may see different wording for the same claim based on the source authority most appropriate for their region (NHS for UK; USDA/AHA for US). Would require per-locale wording in the published registry.

**SUGGESTION — Source agreement scoring**
Automatically calculate a numerical agreement score across Tier 1–2 sources for each claim, to help prioritise editorial attention (low agreement = needs human resolution; high agreement = lower priority).

**SUGGESTION — User-facing "About this claim" disclosure**
A disclosure UI on benefit claims that surfaces evidence strength in user-friendly language ("Based on multiple studies, this is a well-supported finding") without exposing technical grades.

**SUGGESTION — Automated EFSA register diff alerts**
When the EFSA register changes, automatically diff against currently-published claim phrasings and flag anything that may need update.

---

## DEFINITION OF DONE (CONFIRMED)

| Item | Status |
|---|---|
| Trusted sources identified with strengths, weaknesses, frequency, licensing | ✅ Section 2 |
| Ingestion architecture proposed | ✅ Section 4 |
| Editorial workflow proposed | ✅ Section 5 |
| Evidence model proposed | ✅ Section 6 |
| Stale knowledge strategy proposed | ✅ Section 7 |
| Canonical mapping approach | ✅ Section 12 |
| Approval workflow | ✅ Sections 5.2–5.5 |
| Integration points mapped | ✅ Section 8 |
| Trust model documented | ✅ Sections 9 + 10.3 |
| Future AI role considered | ✅ Section 10 |
| Risks documented | ✅ Section 11 |
| Recommendations made | ✅ Section 13 |
| No implementation | ✅ |
| No schema changes | ✅ |
| No UI changes | ✅ |

---

## FINAL REPORT

**Rollback tag:** `rollback/ws4b-pre-investigation-20260620` → commit `72eccee`

**Document:** `docs/investigations/WS4B_NUTRITION_KNOWLEDGE_PIPELINE.md`

**Summary:**

WS4B proposes a complete Nutrition Knowledge Pipeline for The Healthy Apples. The design inherits and extends two prior investigations (the four-plane KMS and the Editorial/Automation Framework) into a concrete pipeline specification covering: a three-tier trusted source hierarchy with EFSA as a wording authority; a six-stage ingestion flow with content-hash change detection and canonical food matching; a five-state editorial review lifecycle (candidate → draft → in_review → approved → published/deprecated); a four-level evidence model (strong/moderate/emerging/insufficient) with direct wording consequences; an alert-only staleness monitoring system with content hash, URL availability, and review expiry detection; a single `buildFoodKnowledge()` adapter contract for all seven THA surfaces; a three-layer language guardrail model (hard blocks, strength-gated language, tone review); and a bounded AI assistance model where AI assists only in THA-owned layers (wording templates, parsing, conflict flagging) and never crosses the hard wall into publication.

No implementation. No schema changes. No UI changes. No automatic imports made.
