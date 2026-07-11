# KNOW5 — Scalable Knowledge Expansion Readiness

**Status:** Investigation only. No code, schema, data, or runtime behaviour changed.
**Date:** 2026-07-09
**Branch:** `int1-intelligence-platform`
**Risk:** 🟢 GREEN (documentation only; one read-only database baseline taken)
**Predecessors:** KNOW1 → KNOW2 → KNOW3 → KNOW4 (all 2026-07-09). KNOW4 SUGGESTION 1 is the direct trigger for this investigation.
**Governing documents read:** `docs/architecture/README.md` (bootstrap), `ARCHITECTURE_PRINCIPLES.md`, `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md`, `NK1_CANONICAL_NUTRITION_KNOWLEDGE_PLATFORM.md`, `THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md`, `ENGINEERING_WORKFLOW.md`

---

## 0. HEADLINE

**THA is not ready to scale canonical food knowledge, and the reason is not capacity — it is that the evidence chain has an ungated load-bearing edge, and the publish path cannot be reversed.**

Two findings, both measured against the live database, both absent from every governing document:

1. **A cited health claim rests on an uncited premise.** A food's benefit chip renders when three edges line up: `food → benefit`, `food → nutrient`, and `nutrient → benefit`. Only the third edge carries a `SourceRef` and a human `reviewedAt`. The first two are AI-drafted and gated by nothing. The citation the user sees (NHS, EFSA) backs the *nutrient-level* statement, never the *food-specific* premise. **755 benefit chips render today; 382 of them (50.6%) rest solely on an AI-drafted composition premise that no human ever reviewed.** Among them, `plain-wheat-flour → gut-health` and `arrowroot → heart-health` render with an NHS citation, on the false premise that refined white starches are notable fibre sources.

2. **Publishing is one-way.** `seed-knowledge-registry.ts` is a pure upsert — it contains no `DELETE` and no deactivation sweep. Retiring a fact from the TypeScript owner does not retire it from the database. Proof: `plant-protein` was removed from the nutrient vocabulary in `shared/knowledge/nutrients.ts` (35 seed nutrients), yet `knowledge_nutrients` still holds 36 active rows including `plant-protein`, and 38 `knowledge_food_nutrients` rows still point at it. **A bad import cannot be undone by fixing the seed and re-running it.**

Together these mean the corpus is a ratchet: every import adds ungated premises that can wear real citations, and nothing can take them back out. Importing the 139 outstanding drafts today would roughly double the count of uncited food-specific claims rendering under NHS/EFSA badges.

**The recommendation is therefore that KNOW5 must not be an import workstream.** It must be the workstream that makes importing safe and reversible. The import itself is KNOW6, and it is cheap once KNOW5 lands.

---

## 1. METHOD

- Read the governing architecture (bootstrap per `ENGINEERING_WORKFLOW.md` STEP 2).
- Static analysis of `shared/knowledge/`, `shared/canonical/`, `server/seeds/`, `server/services/nutrition-knowledge-registry.ts`, `server/lib/canonical-foods-gate.ts`, `scripts/`.
- Counted seed records by grep on record delimiters; counted drafts by `canonical_slug` across `docs/knowledge/canonical-foods/drafts/`.
- **One read-only baseline against the database this workspace is configured against (`DATABASE_URL`).** `SELECT` only; no writes, no DDL. Whether that database is production or a development instance was not established — findings quoting row counts are true of *that* database, and the structural findings hold for any database seeded by this repo.

Rollback protection created before any work: `stash@{0}` `KNOW5_ROLLBACK: pre-investigation snapshot 2026-07-09`.

---

## 2. CURRENT KNOWLEDGE OWNERSHIP

### 2.1 Who owns what (verified, not quoted from docs)

| Fact | Owning source of truth | Seed records | Live DB rows | Evidence fields on the row |
|---|---|---|---|---|
| Canonical food identity | `shared/canonical/foods.ts` | 312 | 362 `canonical_food` | `sourceRef`, `confidence`, `status` |
| Knowledge food identity | `shared/knowledge/foods.ts` (264) + `graduated-foods.ts` (346) | 610 | 610 `knowledge_foods` | none |
| Nutrient vocabulary | `shared/knowledge/nutrients.ts` | 35 | **36** (drift) | none |
| Benefit vocabulary | `shared/knowledge/health-benefits.ts` | 15 | 15 | none |
| **Food → nutrient (composition)** | `relationships.ts` + `graduated-relationships.ts` | 1,035 graduated | 1,988 active | **NONE** — no `source_refs`, no `reviewed_at` |
| **Food → benefit** | `relationships.ts` + `graduated-relationships.ts` | 667 graduated | 1,366 active | columns exist, **`reviewed_at` set on 0 rows, read by nothing** |
| **Nutrient → benefit** | `relationships.ts`, sourced by `claim-sources.ts` | 37 sourced claims | 70 active / 36 sourced / **21 signed off** | `source_refs` + `reviewed_at` — **the only gated edge** |

Provenance of the 610 knowledge foods, from the live database:

| `knowledge_foods.source` | Rows |
|---|---|
| `NK6 canonical food draft` (AI-authored) | 346 |
| `THA editorial` | 187 |
| `USDA FDC / WS0X.2 H1 batch 2026-06-24` | 77 |

### 2.2 What is genuinely converged

Ownership convergence achieved by KNOW2–KNOW4 is real and should not be relitigated:

- **One writer for `knowledge_foods`.** KNOW2 stripped the writes from `canonical-foods-importer.ts`, leaving `canonical-foods-gate.ts` write-free. `seed-knowledge-registry.ts` is the sole writer, enforced by `test-knowledge-food-ownership.ts`.
- **One mouth for benefit claims.** KNOW4 made `getEvidenceBackedFoodReport()` the only surface that speaks a benefit. `buildFoodReport()` (`shared/canonical/food-report-adapter.ts:170,183`) hard-returns empty benefit arrays, so no client bundle can speak an ungated claim. This satisfies Rule KC4.
- **The three contested stores named in the SoT Register are gone.** `nutrition-benefit-library.ts`, `nutrition-variety.ts` no longer exist; `pantry-knowledge.ts` survives only as the separate `pantry_ingredient_knowledge` table serving pantry UI copy, not canonical food knowledge.

### 2.3 What the Source of Truth Register still claims

`THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` (dated 2026-06-23) Domain 1 states **"Foods covered: 188 foods"**. The true figure is **610**. It names migrations M1/M2/M4 as unimplemented plans; their target files were deleted some time ago. The register predates KNOW1–KNOW4 by sixteen days and mentions none of them. KNOW1 SUGGESTION 3 and KNOW2 SUGGESTION 5 both flagged this and both correctly declined to amend a governing document unilaterally. **It is stale and should be corrected as part of KNOW5's closing act, under approval.**

---

## 3. FINDING F1 (CRITICAL) — The cited claim rests on an uncited premise

### 3.1 The mechanism

`getFoodBenefitsForDisplay()` (`server/services/nutrition-knowledge-registry.ts:196`) renders a chip when:

```
  knowledge_food_benefits (food → benefit)        ← AI-drafted, UNGATED
    ∩
  knowledge_food_nutrients (food → nutrient)      ← AI-drafted, UNGATED, no evidence columns exist
    ⋈
  knowledge_nutrient_benefits (nutrient → benefit) ← isEvidenceBackedClaim(): SourceRef + reviewedAt ✓
```

The chip then **inherits the nutrient claim's citations** (`nutrition-knowledge-registry.ts:204`). The comment at `:192-195` states this plainly and honestly. What the architecture never states is the consequence: *the citation attests that fibre supports gut health; it does not attest that this food contains notable fibre.* The food-specific premise — the part that is actually food knowledge — is the one link in the chain with no source, no reviewer, and no schema column to hold either.

`knowledge_food_nutrients` has columns `food_slug, nutrient_slug, amount, confidence, ranking, source, is_active, created_at`. There is **no `source_refs` and no `reviewed_at`**. Its `confidence` column defaults to `'established'` and is **never read by the render gate**. 671 AI-drafted rows are stored as `confidence: established` — an AI draft self-certifying as established fact.

### 3.2 The measured blast radius

Against the live database:

| Measure | Count |
|---|---|
| Benefit chips that render today | **755** (across 486 foods) |
| …whose `food → benefit` row is AI-drafted (`NK6 canonical food draft`) | 384 (50.9%) |
| …whose corroborating `food → nutrient` premise is **exclusively** AI-drafted | **382 (50.6%)** |
| Signed-off `nutrient → benefit` claims doing all the citation work | 21 |

Half of everything THA currently asserts about foods and health rests on a premise generated by ChatGPT and reviewed by no one, presented to the user with a genuine NHS or EFSA citation attached.

### 3.3 It is not theoretical — it is wrong today

Querying the twelve AI-drafted "notable fibre" premises on refined starches, oils and sugars, and the chips they light up:

```
plain-wheat-flour        → fibre → gut-health, heart-health   [NHS cited]
arrowroot                → fibre → gut-health, heart-health   [NHS cited]
cornflour                → fibre → …
potato-starch            → fibre → …
tapioca-flour            → fibre → …
self-raising-flour       → fibre → …
strong-white-bread-flour → fibre → …
semolina-flour           → fibre → …
active-dry-yeast         → fibre → …   (portion-implausible: eaten in ~7 g)
```

Plain white wheat flour, arrowroot, cornflour, potato starch and tapioca flour are refined starches from which the bran has been removed. They are not notable fibre sources. **32 rendering chips derive from this one implausible-premise class.** `strong-wholemeal-bread-flour` and `chestnut-flour` in the same list are legitimate; the gate cannot tell the difference because it never looks.

This is precisely the hazard KNOW4 SUGGESTION 1 named (`plain-wheat-flour → fibre → gut-health` was its worked example). This investigation's contribution is to **measure it (382 chips), demonstrate a factual defect class (32 chips), and identify the structural cause (no evidence contract on the composition edge)** — not merely an editorial backlog, as KNOW4 framed it.

### 3.4 The fault is structural, not "AI bad, human good"

Editorial rows are ungated too. `semolina → fibre` is a `THA editorial` row and is equally questionable. The defect is that **the composition edge has no evidence contract at all**, so neither provenance can be checked. AI authorship raises the error *rate*; it did not create the *hole*. Any remediation that only cleans the 1,035 graduated rows leaves the hole open for the next import.

---

## 4. FINDING F2 (CRITICAL) — Publishing is a one-way ratchet

`server/seeds/seed-knowledge-registry.ts` performs `insert(...).onConflictDoUpdate` keyed on identity. Grep for `delete` in `server/seeds/` returns nothing. There is no deactivation sweep, no tombstone, no reconciliation of DB against seed.

**Consequence: the database is a superset of the seed and can only ever grow.** Removing a row from `shared/knowledge/` and re-running `npm run seed:knowledge` leaves the DB row live, active, and rendering.

Proof, from the live database:

- `shared/knowledge/nutrients.ts` exports **35** nutrients. `plant-protein` was retired from it (the file's comments at lines 14 and 78 describe it as "the former `plant-protein` identity").
- `knowledge_nutrients` holds **36** active rows. `plant-protein` is still there, `is_active = true`.
- **38** `knowledge_food_nutrients` rows still reference the retired nutrient (36 editorial + 2 graduated). This is the exact source of the 1,035-in-file vs 1,037-in-DB discrepancy.
- Two `knowledge_nutrient_benefits` edges (`plant-protein → muscle-recovery`, `→ energy-support`) also persist. Neither is signed off, so neither renders — today.

KNOW2 SUGGESTION 2 called the 38 `plant-protein` rows "the only thing between this domain and 100%" without diagnosing *why* they survive re-seeding. This is why: **the seed physically cannot remove them.**

For a large import this is the difference between a reversible and an irreversible operation. If 139 foods and ~800 relationship rows are imported and a defect class is found afterwards, correcting the YAML and the seed file achieves nothing. Recovery requires hand-authored `DELETE`/deactivate SQL against live tables — the least governed, highest-risk operation in the platform, with no test covering it.

---

## 5. FINDING F3 (HIGH) — The sign-off gate does not scale

`server/seeds/signoff-knowledge-claims.ts` is the sole mechanism that sets `reviewed_at`, and therefore the sole mechanism by which any claim ever renders.

```
npm run knowledge:signoff -- --confirm REVIEWED
```

One command signs off **every structurally valid pending row at once** (`signoff-knowledge-claims.ts:87-90`). It:

- records **no reviewer identity** — no `reviewed_by`;
- records **no per-claim decision** — approve-all or nothing;
- writes **no audit row**;
- offers **no way to reject** a claim (a rejected claim simply stays pending forever, indistinguishable from an unreviewed one — violating Rule KC2, "rejection is terminal, not silent");
- covers **only `knowledge_nutrient_benefits`**.

At today's 36 sourced claims a human can read the printout and mean it. At the hundreds a large import implies, `--confirm REVIEWED` becomes a rubber stamp wearing the costume of a human gate. Rule KC9 ("automation authors candidates, never publishes them") is satisfied in letter and hollowed out in spirit. There are currently 15 sourced-but-unsigned claims that a single invocation would light up simultaneously.

Related: **`knowledge_food_benefits.reviewed_at` is written by nothing and read by nothing.** It is set on 0 rows. The column implies a food-level sign-off that does not exist and cannot occur. It is vestigial and actively misleading — a reader of the schema would reasonably conclude food-level claims are human-reviewed.

**A governed workbench for exactly this problem already exists.** KQ1B–KQ1F built `knowledge_review_queue` → `knowledge_review_decisions` (`proposed → approved | rejected → published | superseded | rolled_back`), `knowledge_releases`, `knowledge_rollback_points`, `knowledge_review_audit`, multi-reviewer consensus, 18 admin routes, and a live client page at `/admin/knowledge-review`. Its published output feeds the live resolver at boot (`server/index.ts:147-148`). **Its scope is vocabulary aliases only.** It has the exact state machine, audit trail, reviewer identity, release and rollback semantics that food composition claims need, and it does not govern them. This is the single largest piece of leverage available to KNOW5: extend a proven chassis rather than build a fifth pipeline (Rule R1).

---

## 6. FINDING F4 (MEDIUM) — Layer 3, the wording firewall, is declared-only

`PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §4 requires an EFSA wording firewall. No validator inspects stored claim text for `prevents` / `treats` / `cures` / `diagnoses`. What exists:

- `server/lib/openai-enrichment.ts:129` — an *instruction to a model* inside a prompt, not a check on output;
- `server/lib/uplift-rules.ts:9` — a code comment;
- `server/tests/test-plan1-planner-intelligence.ts:122` — a test on planner recommendation output, not on knowledge claims;
- `shared/knowledge/claim-sources.ts:22-34` — a record of three wordings a human corrected **by hand** against the EU Register.

Layer 1 (source trust) is genuinely code-enforced: `isTrustedSourceUrl()` + `validateSourceRef()` run at both seed time and render time, over a 7-domain allowlist. Layer 2's gate code is correct and correctly placed. Layer 3 has no code at all. Per Rule KC8 — "declared is not enforced" — Layer 3 is not yet a trust guarantee.

This matters more after an import than before it: the 690 drafts contain free-text `benefit_language[].approved_wording` and `companion_behaviour.suggested_user_facing_phrases[]` authored by ChatGPT. None of it is currently imported — but the moment a workstream decides to import editorial prose, there is nothing standing between an AI-authored phrase and a user.

---

## 7. FINDING F5 (MEDIUM) — Vocabulary and category fragmentation

- **Category vocabulary is split.** `knowledge_foods.category` holds two vocabularies: ~13 editorial categories and ~27 raw draft enums carried in from the NK6 YAML. Graduated foods are therefore unreachable under editorial category filters. KNOW2 SUGGESTION 1 called this "the largest remaining Principle 1 exposure" and it remains open. An import of 139 more drafts widens the split.
- **The canonical ↔ knowledge bridge is 12% connected.** Only **44 of 362** `canonical_food` rows carry a `knowledgeFoodSlug`. KNOW3 built `resolveKnowledgeBinding()` and made `validateCanonicalSeed()` refuse on binding failures, achieving 99.3% of *bindable* pairs — but bindable is a small subset. 318 canonical foods have no knowledge counterpart bound.
- **Duplicate identities persist.** KNOW2 SUGGESTION 3 (10 duplicate canonical slugs across batches) and KNOW3 SUGGESTION 2 (15 duplicate knowledge-seed identities, e.g. `lentils` ↔ `red-lentils`) are both unresolved. The gate's anti-fork check runs against `FOOD_SEED`, **not against the database** (`canonical-foods-gate.ts:257`) — so it cannot see a duplicate that exists only in the DB.

---

## 8. READINESS FOR LARGE-SCALE IMPORT

### 8.1 What exists

The four-stage graduation pipeline of `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` §1 is real and correctly shaped:

```
1 CANDIDATE   docs/knowledge/canonical-foods/drafts/*.yaml     723 files, 690 distinct slugs, 23 batches
2 GATED       server/lib/canonical-foods-gate.ts               identity reconciliation, vocabulary resolution,
              (npm run knowledge:graduate)                     MVF check, anti-fork. WRITES NOTHING.
3 PROMOTED    human copies emitted TS into                     manual, deliberate (Rule KC9)
              shared/knowledge/graduated-*.ts
4 PUBLISHED   npm run seed:knowledge                           the one writer. Upsert-only. NO DELETE.
```

Supporting assets that are genuinely built and running: the gate; `validateKnowledgeSeed()` and `validateCanonicalSeed()` (both refuse to seed on failure); Layer-1 evidence validation; the one-mouth adapter; six knowledge tests wired into `npm test`; the Knowledge Review Workbench with full release/rollback semantics (for aliases).

### 8.2 What does not exist

- **No bulk import automation.** Stage 3 is a human copy-paste of emitted TypeScript. This is correct as a *gate* and unworkable as a *throughput mechanism* for 139 foods.
- **No external importer.** A repo-wide search for USDA FDC / Open Food Facts ingestion code in `server/`, `shared/`, `scripts/` finds nothing. The 77 rows sourced `USDA FDC / WS0X.2 H1 batch` were loaded by a process that no longer exists in the tree. NK1's Plane 3 claim that USDA is "ingested via `ingredient_classifications` seeding" does not correspond to any code path found.
- **No evidence contract on composition** (F1).
- **No un-publish path** (F2).
- **No scalable sign-off** (F3).
- **No wording firewall** (F4).

### 8.3 The outstanding corpus

Of 690 distinct draft slugs: 346 graduated, 264 already in the editorial seed (overlapping), leaving **139 slugs that exist only as YAML and have never reached any store** — including `apple`, `banana`, `carrot`, `chicken-breast`, `beef-mince`, `basmati-rice`, `cheddar`, `mozzarella`, `turmeric`, `cinnamon`, `black-peppercorns`.

That list is itself the finding: **THA's knowledge base contains 346 AI-drafted foods and does not contain `apple`, `banana` or `carrot`.** The import was performed slug-by-slug and partially, never batch-by-batch, and it left the everyday foods behind while admitting `agar-agar` and `arame`. The gate is not at fault — nothing ever swept the batches in.

The drafts also carry far more than the gate reads. `canonical-foods-gate.ts:532-573` consumes only `canonical_slug`, `display_name`, `food_category`, `aliases`, `plant_count_policy`, `whole_food_status`, `notable_nutrients[].nutrient/.confidence`, and `benefit_language[].area`. Everything else — shopping intelligence, cooking and storage, planner metadata, safety and limitations, companion phrasing, all numeric nutrition — is parsed and discarded. Drafts explicitly set `do_not_display_numeric_values_yet: true` and `quantitative_values_status: not_populated`, so **no numeric nutrition exists to import**, which is why `knowledge_food_nutrients.amount` is unused. The drafts assert *which nutrients a food is known for*, never *how much*. That is exactly the assertion F1 shows is ungated.

### 8.4 Verdict

**Not ready.** The pipeline's shape is right and its gates are honest about identity. It has no gate for the fact type the import is actually about — what a food contains — and no way back if it gets it wrong. Scaling now converts an editorial backlog into a permanent, cited, user-facing error surface.

---

## 9. THE SAFEST IMPORT PROCESS

Stated as the target state KNOW5 should build toward. Each step maps to an existing mechanism wherever one exists.

1. **Source intake.** Reject any candidate whose asserted composition cannot cite a Layer-1 trusted source. For composition specifically this means a real nutrient database (USDA FDC, McCance & Widdowson via `gov.uk`), not a language model. *A model may propose; only a table may attest.*
2. **Identity resolution.** Existing `reconcileFoodIdentity()`, extended to check the **database** as well as `FOOD_SEED` (closes F5's blind spot).
3. **Automated authoring → Candidate.** Existing gate emits `GraduationRecord`. Unchanged. Never publishes (Rule KC9).
4. **Structural gate.** Existing `validateCanonicalSeed()` / `validateKnowledgeSeed()`. Add: **composition evidence contract** (F1) and **portion plausibility** (§10.3).
5. **Human review, per claim.** Route composition claims through the existing `knowledge_review_decisions` state machine — reviewer identity, per-claim approve/reject, `rejected` as a terminal state, audit row. Not a bulk `--confirm`.
6. **Publish as a release.** Existing `knowledge_releases` + `knowledge_rollback_points`. An import becomes a named, reversible release, not an unbounded upsert.
7. **Reconcile, don't just upsert.** The seed must be able to deactivate rows the owner no longer authors (F2), inside a release so the deactivation is itself reversible.

Steps 5, 6 and 7 are the ones that do not exist. Steps 5 and 6 are extensions of the Workbench chassis; step 7 is a change to one seed script's semantics.

---

## 10. VALIDATION AND EVIDENCE REQUIREMENTS

### 10.1 The composition edge needs its own evidence contract

This is the central architectural proposal. `knowledge_food_nutrients` must carry the same Layer-2 shape the nutrient→benefit edge already carries:

| Column | Purpose |
|---|---|
| `source_refs jsonb` | ≥1 `KnowledgeSourceRef`, Layer-1 validated. For composition the trusted set should extend to a nutrient-composition authority (USDA FDC, `gov.uk` CoFID). |
| `reviewed_at timestamptz` | Human sign-off, per claim. |
| `reviewed_by text` | Reviewer identity (missing platform-wide today). |

And `backedBenefitsViaNutrientBridge()` must require **both** edges to pass `isEvidenceBackedClaim()`, not one.

The immediate effect is that **382 chips go dark**. That is not a regression. It is Principle 6 — honest gaps over fabricated information — finally applied to the edge that was exempt from it. A food showing nutrients and no benefit chip is honest. `plain-wheat-flour → gut-health [NHS]` is not.

This is the same trade KNOW4 already made deliberately: it removed 320 unsourced health claims from live surfaces and recorded the reduction as convergence, not loss.

### 10.2 `knowledge_food_benefits.reviewed_at` must be resolved, not left

Either wire it (a food-level editorial sign-off distinct from the composition premise) or drop it. Leaving a `reviewed_at` column that nothing writes and nothing reads, on the table whose rows are 50% AI-drafted, invites a future reader to assume a review happened.

### 10.3 Portion plausibility

The drafts contain foods eaten in gram quantities — `active-dry-yeast`, and the whole of `batch-010-spices-seasoning-plants` (turmeric, cinnamon, black peppercorns, nutmeg, star anise). A "notable nutrient" assertion that is true per 100 g and meaningless per realistic serving is a fabrication in effect if not in intent. **A nutrient claim should be gated on plausibility at a realistic serving, not per 100 g.** Spices and oils should import with identity, diversity classification and aliases, and with **no nutrient or benefit claims at all**. Nothing in the current gate or drafts expresses this, and the drafts' own `nutrition_profile.notable_nutrients` for spices assert nutrients regardless.

### 10.4 Evidence a KNOW5 implementation must produce

- A test asserting no benefit chip renders unless **both** its composition edge and its nutrient→benefit edge are evidence-backed. This is the KC8 closure for the composition layer.
- A test asserting the seed can deactivate a row removed from the owner (F2), with `plant-protein` as the fixture — 38 rows, already wrong, already identified.
- A test asserting `reviewed_at` cannot be set without `reviewed_by`.
- A wording-firewall validator over stored claim text, run at seed time (F4).
- Before/after counts of rendering chips, published in the implementation record. The number **must be allowed to fall**.

The Companion Benchmark is *not* adequate evidence here. It scores the Companion through `processUserTurn` against fixture households; knowledge coverage is not a scored axis, and a run without an LLM provider or judge is not a valid measurement. Direct evidence lives in the KNOW test suite and in the DB counts above.

---

## 11. RECOMMENDED IMPORT ORDER

Ordered by **premise risk** — how likely an AI-drafted composition claim is to be wrong and consequential — not by batch number.

| Wave | Content | Rationale | Claims permitted |
|---|---|---|---|
| **W1** | The everyday whole foods missing today: `apple`, `banana`, `carrot`, `blueberry`, `cantaloupe-melon` etc. (batch-002, batch-003) | Highest user value, lowest premise risk. Composition is unambiguous and trivially citable against CoFID/FDC. Their absence is the most visible gap in the platform. | Identity + composition + benefits |
| **W2** | Legumes, whole grains, nuts and seeds (batch-007, batch-011) | Composition well-characterised; fibre/protein/mineral claims are the ones users most rely on. Cite before importing. | Identity + composition + benefits |
| **W3** | Animal foods — poultry, eggs, meat, fish (batch-017, batch-018) | Composition citable, but claims are ethically and nutritionally contested; `beef-liver` (batch-019) carries genuine upper-limit safety content (vitamin A) that the drafts' `safety_and_limitations` block holds and the gate discards. | Identity + composition; benefits only with review |
| **W4** | Dairy and cheeses (batch-021) | Straightforward composition; high duplicate-identity risk (`mozzarella` vs `buffalo-mozzarella`) against F5's unresolved duplicates. | Identity + composition + benefits |
| **W5** | Spices, herbs, seasoning plants (batch-010) | **Identity only.** Portion-implausible for any nutrient claim (§10.3). They matter for plant-diversity counting, not for benefits. | Identity + diversity group only |
| **W6** | Oils, fats, vinegars (batch-012); refined starches, pasta, noodles (batch-023) | **Identity only, and remediate first.** This is the exact class that produced F1's 32 defective chips. Do not import more refined starches until the composition gate exists. | Identity only |

**Precondition on every wave: F1 and F2 closed.** Waves W5 and W6 additionally require §10.3.

An import of W1+W2 after KNOW5 lands is a genuinely valuable, low-risk delivery: it puts `apple` and `carrot` into a knowledge base that currently knows `arame`.

---

## 12. REMAINING ARCHITECTURE GAPS (consolidated)

| # | Gap | Severity | Named before? |
|---|---|---|---|
| G1 | Composition edge (`food → nutrient`) has no evidence contract, yet is load-bearing for cited claims. 382 chips affected; 32 demonstrably wrong. | 🔴 Critical | Partially — KNOW4 SUGGESTION 1 named the hazard, not the structural cause or the scale |
| G2 | Seed is upsert-only; no un-publish. DB is a superset of its owner and can only grow. Imports are irreversible. | 🔴 Critical | **No — new** |
| G3 | Sign-off is bulk, anonymous, unauditable, non-rejecting, and covers one table. | 🟠 High | **No — new** |
| G4 | `knowledge_food_benefits.reviewed_at` is dead and misleading. | 🟠 High | **No — new** |
| G5 | Layer 3 (EFSA wording firewall) has no validator. | 🟡 Medium | Yes — PKCA §4.1 named Layer 2; Layer 3 unnamed |
| G6 | Category vocabulary split (13 editorial vs 27 draft enums). | 🟡 Medium | Yes — KNOW2 SUGGESTION 1 |
| G7 | Canonical ↔ knowledge bridge 44/362 (12%). | 🟡 Medium | Yes — KNOW2 SUGGESTION 6 |
| G8 | Duplicate identities (10 canonical, 15 knowledge); anti-fork check reads seed, not DB. | 🟡 Medium | Yes — KNOW2/3 |
| G9 | SoT Register stale (claims 188 foods; actual 610). | 🟡 Medium | Yes — KNOW1/2, deferred for approval |
| G10 | No external composition importer (USDA/CoFID) exists; NK1 Plane 3 describes one that isn't there. | 🟡 Medium | **No — new** |

---

## 13. RECOMMENDED IMPLEMENTATION PLAN

**KNOW5 is a safety-and-reversibility workstream. It imports nothing.** Import is KNOW6.

### KNOW5A — Composition Evidence Contract (🔴 the blocking EWO)

*This is the recommended next implementation EWO.*

- Add `source_refs`, `reviewed_at`, `reviewed_by` to `knowledge_food_nutrients` (additive migration; no backfill — NULL means "not reviewed", which is the truth).
- Extend Layer-1 trusted domains with a composition authority (`fdc.nal.usda.gov`, `gov.uk` CoFID) — a governance decision requiring approval, since it widens the citable set.
- Require **both** edges to pass `isEvidenceBackedClaim()` in `backedBenefitsViaNutrientBridge()` and `getFoodsForBenefit()`.
- Test: no chip renders on an unreviewed premise. Record the chip count falling from 755 → (editorial-reviewed subset), and state it as convergence.
- Retire or wire `knowledge_food_benefits.reviewed_at` (G4).

**Expected effect: ~382 chips go dark until reviewed.** This must be presented to the user as an honest gap, and it needs explicit product sign-off before implementation — it is a visible reduction in what the app appears to know, and it is the correct one. *This is a TRUST AND CLAIMS HARD STOP under `ENGINEERING_WORKFLOW.md` STEP 7 and requires approval before work begins.*

### KNOW5B — Reversible Publish

- Give `seed-knowledge-registry.ts` reconciliation semantics: rows absent from the owner are deactivated (`is_active = false`), never hard-deleted, inside a `knowledge_releases` entry so the change is itself reversible.
- Fixture: `plant-protein` — 38 orphan rows and one orphan vocabulary row, already wrong, already identified. Closes KNOW2 SUGGESTION 2 as a side effect, correctly, for the first time.
- Test: removing a seed row deactivates its DB row; re-adding it reactivates.

### KNOW5C — Governed Claim Review at Scale

- Extend the KQ1B–KQ1F Workbench chassis (`knowledge_review_decisions`, `knowledge_releases`, `knowledge_rollback_points`, `knowledge_review_audit`) from vocabulary aliases to composition and benefit claims.
- Per-claim approve/reject with reviewer identity; `rejected` terminal (Rule KC2); audit row per decision.
- Retire the bulk `knowledge:signoff -- --confirm REVIEWED` path, or reduce it to a dry-run reporter.
- No new pipeline (Rule R1 / PKCA Risk R1). Fill in the fifth row of PKCA §1.1's table.

### KNOW5D — Layer 3 Wording Firewall

- Seed-time validator over stored claim text and any imported editorial prose: banned diagnosis verbs, `emerging` never rendered as `established`.
- Cheap, isolated, and a precondition for ever importing the drafts' `benefit_language` / `companion_behaviour` prose.

### KNOW5E — Composition Source Ingestion (enables KNOW6)

- Build the USDA FDC / CoFID reader NK1 Plane 3 already assumes exists (G10). Candidate-stage output only.
- This is what allows a composition claim to cite a table instead of a language model, making W1/W2 import cheap and safe.

### KNOW6 — The Import (only after 5A–5E)

Waves W1 → W6 per §11.

### Deferred, tracked, not in KNOW5

G6 (category vocabulary), G7 (bridge coverage), G8 (duplicate identities). Each is real and each is independent of import safety. G9 (SoT Register correction) should be proposed for approval as KNOW5's closing act, since KNOW5 establishes the true figures.

### Sequencing rationale

5A before everything, because every subsequent row imported without it is a permanent liability (F2 makes it permanent). 5B before any import, because without it no import can be undone. 5C before any *large* import, because bulk sign-off at scale is a rubber stamp. 5D before importing prose. 5E to make 5A's citation requirement satisfiable in bulk rather than by hand.

---

## 14. ARCHITECTURE COMPLIANCE

| Item | Status |
|---|---|
| One canonical identity | ✅ Investigation proposes no new identity; §9.2 proposes strengthening the existing resolver to check DB as well as seed |
| One owner per fact | ✅ Confirms `seed-knowledge-registry.ts` as sole writer (KNOW2); F2 shows the owner cannot currently *retract*, which this plan fixes |
| No duplicate entities | ⚠️ G8 records 25 known duplicates; not resolved here, tracked |
| No duplicate ownership | ✅ None introduced |
| No duplicate state | ✅ KNOW5C extends the existing Workbench state machine rather than creating a second one |
| Extends existing architecture | ✅ Every proposal extends PKCA §1's pipeline, the KQ Workbench chassis, or the existing evidence module |
| Progressive enrichment | ✅ §11 imports identity before composition before benefits; §10.3 permits identity-only foods |
| Honest gaps over fabricated information | ✅ Central to the plan. KNOW5A deliberately darkens 382 chips rather than let uncited premises wear citations |
| No permanent synchronisation bridge | ✅ None proposed |
| Evolution over replacement | ✅ No store replaced; `signoff-knowledge-claims.ts` named with a retirement path (KNOW5C) |

**AI ARCHITECTURE COMPLIANCE:** no assistant, capability, intent, or conversation state is created or altered by this investigation. The plan's central purpose is item 9 of that block — *produces honest gaps rather than fabricated knowledge*.

**Conflict with governing architecture:** none. This investigation **strengthens** `PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` by locating a second declared-vs-enforced gap (Rule KC8) that §4.1 did not name: the composition edge. §4.1 identified Layer 2 nutrient→benefit enforcement as "the platform's single largest declared-not-enforced gap" and recorded it as closed by PKC Phase 0. It was closed — for one of the three edges a chip depends on.

---

## 15. DATA IMPACT

- Reads existing data: **YES** — one read-only `SELECT`-only baseline against `DATABASE_URL`. No writes, no DDL, no transactions left open.
- Writes new data: **NO**
- Changes meaning of existing data: **NO**
- Requires backfill: **NO** (KNOW5A, if approved, would add nullable columns with no backfill — NULL correctly means "not reviewed")

---

## 16. TRUST CHECK

- **Could this mislead the user?** This document produces no user-facing output. It reports that the *platform* is currently misleading users on 382 benefit chips, of which 32 are demonstrably false, and proposes the fix.
- **Could this fabricate certainty?** No. Every count is either grep-verified against a named file or `SELECT`-verified against the live database, and the method for each is stated. Where the roadmap docs and the code disagree, the code is reported.
- **Is anything guessed but shown as real?** No. Explicit unknowns: whether `DATABASE_URL` points at production or development; the exact provenance of the 77 `USDA FDC / WS0X.2 H1 batch` rows, whose loader is absent from the tree; whether `agar-agar → fibre` is defensible (it is arguable, and is excluded from the 32-chip defect claim's core examples).
- **What happens if this is wrong?** The two critical findings are structural and independently checkable in under a minute: `grep -c delete server/seeds/seed-knowledge-registry.ts` returns 0 (F2); `\d knowledge_food_nutrients` shows no evidence columns (F1). If the plan's sequencing is wrong, no harm is done — nothing was built.
- No architectural duplication introduced: **YES**
- No new source of truth created: **YES**
- No runtime behaviour altered: **YES**

---

## 17. ROLLBACK INFORMATION

| Item | Value |
|---|---|
| Rollback identifier | `stash@{0}` — `KNOW5_ROLLBACK: pre-investigation snapshot 2026-07-09` |
| Working tree at start | Dirty (10 modified, 25 untracked — pre-existing KNOW4/COMP2/PLAN1 work, preserved and restored) |
| This task's writes | `docs/investigations/knowledge/KNOW5_KNOWLEDGE_EXPANSION_READINESS.md` only |
| Restore command | `git checkout -- . && git stash apply stash@{0}` (working tree was restored after stashing; no changes were lost) |
| Database | Read-only `SELECT` only. Nothing to roll back. |

---

## 18. SCOPE LOCK

**Implemented scope:** read the governing architecture; create rollback protection; investigate current knowledge ownership, import readiness, architecture gaps, the safest import process, validation and evidence requirements, recommended import order, and the next implementation EWO; take one read-only database baseline; write this document.

**Explicitly excluded — not done:** no code changed; no schema changed; no data imported, seeded, signed off, or deleted; no runtime behaviour altered; no migration written or applied; no governing document amended (including the stale SoT Register, whose correction is *proposed* for approval, not performed); no draft YAML modified; KNOW5A–E are specified, not built.

---

## 19. OUTCOME

The platform's knowledge architecture is well-designed and its ownership genuinely converged — KNOW2–KNOW4 did real work. But the evidence chain gates the edge that is easy to cite (a nutrient supports a benefit) and leaves ungated the edge that is the actual food knowledge (this food contains that nutrient). Half the claims THA makes today rest on that ungated edge, authored by a language model, wearing an NHS citation earned by a different sentence. And because the seed cannot retract, every one of those rows is permanent.

Expansion is not blocked by editorial bandwidth. It is blocked by two missing mechanisms — an evidence contract on composition, and a reversible publish — each of which is a contained piece of engineering, and each of which becomes exponentially more expensive to add after another 139 foods land.

**Recommended next EWO: KNOW5A — Composition Evidence Contract.** It requires approval before work begins, because it will visibly reduce what the application appears to know, and that reduction is the point.

---

## 20. NEXT STEPS

1. **Decision required:** approve KNOW5A's premise — that ~382 benefit chips should go dark pending review, in preference to rendering uncited food-specific claims under real citations. *(TRUST AND CLAIMS HARD STOP, `ENGINEERING_WORKFLOW.md` STEP 7.)*
2. **Decision required:** approve extending the Layer-1 trusted-domain allowlist to a composition authority (USDA FDC / `gov.uk` CoFID). Without this, composition claims cannot be cited at all and KNOW5A darkens everything.
3. Confirm whether the `DATABASE_URL` measured here is production. If so, the 32 defective chips in §3.3 are live to users and warrant a targeted deactivation ahead of KNOW5A.
4. On approval, open **KNOW5A** per §13, following the `ENGINEERING_WORKFLOW.md` template.
5. Propose the SoT Register correction (188 → 610 foods; M1/M2/M4 status) for approval as KNOW5's closing act.

---

*Investigation completed 2026-07-09. No code was changed in the production of this document.*
