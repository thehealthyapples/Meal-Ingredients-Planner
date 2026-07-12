# PHASE5A — THA Knowledge Platform Activation — Implementation

**Date:** 2026-07-12
**Branch:** `int1-intelligence-platform`
**Risk:** 🔴 RED — extends the canonical knowledge schema (3 new tables), registers a new Intelligence capability, and creates the first runtime read path onto the Product Knowledge Registry (a permission-bearing surface).
**Status:** ✅ COMPLETE

> **Filed by workstream, not at the folder root.** The brief asked for
> `docs/implementation/PHASE5A_KNOWLEDGE_PLATFORM_ACTIVATION.md`. `ENGINEERING_WORKFLOW.md` STEP 5
> forbids a report at a folder root — *"the only file permitted at either root is that tree's index
> `README.md`"* — and `.engineering/scripts/repo-structure-verify.sh` enforces it mechanically, so the
> requested path would have failed the repository check. The report is filed at
> **`docs/implementation/knowledge/PHASE5A_KNOWLEDGE_PLATFORM_ACTIVATION.md`** (workstream: `knowledge`,
> per `REPOSITORY_CONVENTIONS.md` §4). Same name, governed location.

---

## ROLLBACK PROTECTION

| Item | Value |
|------|-------|
| **Rollback tag** | **`rollback/PHASE5A-knowledge-platform-activation-20260711`** → **`d2ee8454`** |
| Working tree at start | Dirty — carried the uncommitted `PDA1` audit output (`docs/product/`, `scripts/build-product-inventory.ts`, `scripts/verify-product-inventory.ts`, and its investigation reports). **PHASE5A did not author those files and does not claim them.** It updates three of the registry's entries, which is a Definition-of-Done obligation (Rule KC15), not an adoption of the workstream that created them. |
| Rollback (code) | `git checkout rollback/PHASE5A-knowledge-platform-activation-20260711` |
| Rollback (schema) | The migration is **additive only** — three `CREATE TABLE IF NOT EXISTS`. Nothing is dropped, altered or backfilled, so reverting the code leaves three unread empty tables behind. To remove them: `DROP TABLE knowledge_preparation_effects, knowledge_food_preparations, knowledge_preparations;` and delete the `2026-07-11_phase5a_preparation_knowledge` row from `schema_migrations`. **No existing row was written, and no existing column changed** — so a rollback loses nothing that existed before this change. |
| Dev-DB side effect (disclosed) | Running `npm run seed:knowledge` triggered its own pre-existing reconcile sweep, which deactivated the retired `plant-protein` orphans (1 nutrient + 38 composition + 2 nutrient→benefit rows). `test-know5-evidence-contract.ts` uses those rows being **active** as its fixture premise, so it failed. **The rows were restored** (verified: 1/38/2 reactivated, suite back to 109/109). See SUGGESTION 1 — this is a latent test fragility, not a defect introduced here. |

---

## REFERENCE DOCUMENTS READ

- [x] `docs/architecture/README.md` — the architecture bootstrap (mandatory entry point)
- [x] `docs/architecture/ARCHITECTURE_PRINCIPLES.md` — the eight principles
- [x] `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` — domain ownership
- [x] `docs/architecture/ENGINEERING_WORKFLOW.md` — compliance checklists, STEP 1–9
- [x] `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` — Rules KC1–KC15; §7 roadmap
- [x] `docs/architecture/THA_INTELLIGENCE_PLATFORM_ARCHITECTURE.md` — TIP1
- [x] `docs/architecture/THA_AI_CAPABILITY_REGISTRY_AND_INTENT_TAXONOMY.md` — TIP2
- [x] `docs/architecture/THA_PRODUCT_KNOWLEDGE_REGISTRY_ARCHITECTURE.md` — PKR1/PKR2, §11, §12
- [x] `docs/architecture/INTELLIGENCE_CAPABILITY_FACTORY.md` — the binding pattern; Rule PER-1
- [x] `docs/investigations/knowledge/WS5A_PREPARATION_KNOWLEDGE_ARCHITECTURE.md` — the preparation design

---

## 1. WHAT PHASE 5A ACTUALLY FOUND — AND THEREFORE WHAT IT BUILT

The brief names fifteen knowledge areas to "complete and converge". The first act of this
workstream was to check which of them THA already has, because **the fastest way to violate this
brief would have been to build the ones that already exist.**

| # | Brief's area | State at HEAD | What PHASE5A did |
|---|---|---|---|
| 1 | Canonical Foods | ✅ Built — `canonical_food` / `food_variety` / `canonical_food_alias`, `validateCanonicalSeed()` | **Verified. Not touched.** |
| 2 | **Product Knowledge capability** | ❌ **Registry populated (154 entries, `PDA1`) but NO capability — the Companion could not read a word of it** | **BUILT** — §3 |
| 3 | Health attributes | ✅ `knowledge_health_benefits` | Verified. Not touched. |
| 4 | Food benefits | ✅ `knowledge_food_benefits` + the evidence gate (PKC0/KNOW5) | Verified. Not touched. |
| 5 | Nutrition attributes | ✅ `knowledge_nutrients`, `knowledge_food_nutrients` | Verified. Not touched. |
| 6 | **Cooking methods** | ❌ **Absent from schema and server** | **BUILT** — §2 |
| 7 | **Cooking techniques** | ❌ **Absent** | **BUILT** — §2 |
| 8 | **Preparation knowledge** | ❌ **Absent — designed in WS5A (2026-06-20), unbuilt; PKCA §7 Phase 4** | **BUILT** — §2 |
| 9 | Storage guidance | 🟡 `knowledge_foods.storage_guidance`, already exposed through the one mouth (`getFoodDetailView`) | **Verified reaching the surface. Not duplicated.** |
| 10 | Seasonal knowledge | ✅ `canonical_food.peak_seasons` is the canonical fact owner | Verified. Not touched. |
| 11 | Shopping intelligence | ✅ `shopping` + `shopping-discovery` capabilities | Verified. Not touched. |
| 12 | Product intelligence | ✅ `analyser` capability (`product-analysis.ts`, `upf-analysis-service.ts`) | Verified. Not touched. |
| 13 | Food comparison knowledge | ✅ `comparison-engine.ts` under `food-intelligence` (COMP1) | Verified. Not touched. |
| 14 | Evidence improvements | ✅ Layer-2 gate live (`isEvidenceBackedClaim`) | **EXTENDED to a third edge** — §2 |
| 15 | Knowledge review + publication workflow | ✅ KQ1B–KQ1F (queue → consensus → approve → **publish** → release → rollback → health) | **EXTENDED with a third sign-off edge** — §2 |

**Eleven of fifteen already existed.** Building them again would have created exactly the duplicate
knowledge stores the brief forbids. So PHASE5A is two things, not fifteen:

1. **Preparation Knowledge** — the domain WS5A designed in June and nobody built. It is PKCA §7's
   Phase 4, and it carries cooking methods, cooking techniques, and preparation.
2. **The Product Knowledge capability** — the read path that turns 154 registry entries the Companion
   *could not see* into knowledge it can *query*.

Everything else was verified and left alone. **The honest report on eleven areas is "already done",
and saying so is worth more than shipping a second copy of each.**

---

## 2. PREPARATION KNOWLEDGE (closes PKCA §7 Phase 4)

> *"The same food. A different thing done to it. Nutrition only changes if the evidence says so."* — WS5A

### 2.1 The two dimensions, and why keeping them apart is the whole design

WS5A §1.2 makes one distinction that everything else hangs off:

| | | |
|---|---|---|
| **EXISTENCE** | *People eat this food this way.* | Cheap, editorial, **always allowed**, no citation. This is the MVF bar (Rule KC5). |
| **EFFECT** | *This preparation measurably CHANGES the nutrition.* | A **health claim**. Expensive, evidence-gated, rare. |

Boiled eggs exist; saying so requires nothing. "Cooking tomatoes raises bioavailable lycopene" is a
claim about a person's body, and it goes through the same gate as every other health claim THA makes.

### 2.2 What was built

**Three tables** (`shared/schema.ts`; migration `2026-07-11_phase5a_preparation_knowledge`):

- `knowledge_preparations` — the catalogue. A reference vocabulary beside the spine (Principle 5).
- `knowledge_food_preparations` — **existence**. Carries **no evidence columns, deliberately**:
  demanding a citation to state that boiled eggs exist would be evidence theatre, and it would gate
  the MVF bar behind enrichment that Rule KC6 says may never gate it.
- `knowledge_preparation_effects` — **effect**. Carries the *identical* Layer-2 contract to
  `knowledge_food_benefits`: `source_refs` + `reviewed_at` + `reviewed_by`.

**The deliberate divergence from WS5A, and why it is the compliant choice.** WS5A §3.1 proposed a
bespoke five-state `editorialStatus` column (`candidate → draft → in_review → approved → published →
deprecated`). **It was not built, and Rule KC1 is the reason.** That column was designed in June, before
PKC0/KNOW5 made *the evidence chain itself* the render gate. Adding it now would give one fact two
lifecycles — a status column *and* an evidence gate — which is precisely the "fifth variant of a
pattern that already exists four times" that PKCA exists to prevent (Risk R6). The Candidate stage
already has an owner: `knowledge_review_queue` (KQ1B). The Confirm stage already has one:
`signoff-knowledge-claims.ts`. Preparation effects use both.

**One key space.** Preparations key on `knowledge_foods.slug` — the same key as every other knowledge
edge. WS5A §10.1 drew the layer under `canonical_food`, but the evidence machinery it mandates reusing
lives in the knowledge key space, and a second key space would have been a Principle 1 violation on
day one. The canonical spine reaches it through the FK that already exists
(`canonical_food.knowledge_food_slug`) — no new bridge (Principle 7).

**Cooking methods vs cooking techniques — one catalogue, not two.** The brief names both. WS5A defines
four sub-types and no fifth. Both land in the one catalogue: a *method* is the application of heat
(`prepType: cooking` — boiled, roasted, grilled, poached…), a *technique* is the non-heat
transformation (`prepType: processing` — smoked, fermented, soaked, rolled, ground, grated…). **No
fifth type was invented**, because inventing one to satisfy the wording of a brief would fork a
vocabulary to match a sentence.

### 2.3 The seed invents nothing — and the exclusions are recorded, not dropped

WS5A §10.2 calls `commonForms` "the seed" and the migration "a re-typing of data THA already
authored". That instinct is right and needed one correction before it could be executed.

`commonForms` holds **308 distinct strings**, and only a minority are preparations. It also holds cuts
("fillet", "breast"), packaging ("block", "bottle"), dish usages ("in salads"), and **other foods
entirely** ("flour", "butter", "hummus", "pasta"). A mechanical re-type would have imported all 308 as
"preparations" — failing WS5A's own tests P1/P2/P3, and handing the platform a vocabulary it would
then have to un-learn.

So `FORM_TO_PREPARATION` is **curated**. Every mapped form passes WS5A's tests. And every kind of form
that does *not* pass is written down in **`EXCLUDED_FORMS` with the reason it was declined** — because
a declined discovery that is silently dropped has not been declined, it has been **mislaid, and it
will be back** (Rule KC12).

The one that matters most: **`granola` is not a preparation of oats.** It adds sugar, oil and nuts. If
it were a preparation, it would inherit oats' clean nutrition profile, and "granola is just prepared
oats, so it's healthy" is exactly the failure WS5A Risk R9 names.

Asserted mechanically: **no edge exists that a human did not already author in `commonForms`**
(`test-preparation-knowledge.ts`).

### 2.4 The three honest states — and the one that must never masquerade as another

WS5A §4.3 names the biggest trust risk in this domain, and it is not overstatement. It is a household
being unable to tell:

> **"we know it doesn't matter"** *(an evidenced finding — reassuring)*
> from
> **"nobody knows yet"** *(an absence — honest)*

These are different facts. Collapsing them into one vague line is the failure. So they are a
**discriminated union**, and a caller cannot render them identically by accident — it must switch on
`state`, and the compiler will not let it forget one:

| `state` | Means | `approvedWording` |
|---|---|---|
| `"effect"` | An evidenced, signed-off claim exists | The approved sentence |
| `"no-change"` | An evidenced **finding** that it changes nothing | The approved sentence |
| `"unreviewed"` | **THA does not know.** The default, and the common case | **`null`, always** |

**`"no-change"` can only ever be produced by a row that cleared the evidence gate. It can never be
produced by the absence of one.** That is the load-bearing property, and it is asserted directly.

### 2.5 Coverage today: 39 preparations, 420 links, **0 effects** — and that is the correct answer

**Not one preparation effect is seeded.** This is not an unfinished job; it is the architecture
working.

An effect is a health claim. Rule KC9: *automation authors candidates, never publishes them.* An
effect needs a real Layer-1 citation and a **named human** who signed it off. Neither this workstream
nor any script may be that human, and **inventing a plausible citation URL to make a table look
populated would be the single worst thing this workstream could ship** — a fabricated source
attached to a health claim, in a system whose entire value is that it does not do that.

So THA currently states that a preparation **exists**, and says nothing about what it changes. When a
household asks whether roasting broccoli changes anything, the honest answer is *"THA has no reviewed
note on that"* — and giving it is the point.

The pipeline to publish one is **built, wired, and proven end-to-end** (§6.2). It needs a nutritionist,
not an engineer.

---

## 3. THE PRODUCT KNOWLEDGE CAPABILITY (closes `fnd-no-product-knowledge-capability`)

### 3.1 What was wrong

`PDA1` populated the Product Knowledge Registry: **154 entries**, each with a named owner and a
deliberate visibility. And the registry's own entry for itself said, in as many words:

> *"What THA knows about itself — this registry — **which is not yet registered as a capability and
> which the Companion therefore cannot read.**"*

The knowledge existed on disk and **nothing could query it**. A household asking *"what can you do?"*
got nothing — and a Companion that cannot answer reaches for the nearest plausible sentence.

### 3.2 What was built — through the front door, with no shortcuts

Product Knowledge enters the platform as a **registered Knowledge Capability like any other** (Rule
PKR20). It gets no bespoke path, and four ownerships survive intact — which is the entire reason for
routing it this way rather than any shorter way:

| Owner | Still owns |
|---|---|
| **INT17** (Context Composition) | Every byte the model reads |
| **The Capability Registry** | Capability metadata and permission-aware access |
| **`server/lib/access.ts`** | Identity. **Unchanged, unshared, unduplicated** |
| **The registry (`docs/product/`)** | The knowledge — and *nothing else*: no transport, no filter, no prompt |

### 3.3 The permission model — four properties, each mechanically asserted

Product Knowledge is the **first domain in THA where an incomplete record is a *security* defect
rather than an invisible fact** (Rule KC13), and the first where the enemy is **disclosure** rather
than fabrication.

| Rule | Property | How it is enforced |
|---|---|---|
| **PKR22** | **Fails closed.** A missing / unrecognised / empty `visibility` → **`developer`** → served to **nobody**. Never `public`. **Absence of a label is never permission.** | `normaliseVisibility()` |
| **PKR23** | **Monotonic.** `developer ⊇ admin ⊇ household ⊇ public`. There is no fact an admin may not be told but a household may — that would need two versions of one fact, which is the failure this whole architecture exists to end | `VISIBILITY_RANK` |
| **PKR24** | **Keys on ROLE, never subscription tier.** A **free** household is told, fully, what premium does. They simply cannot use it. *A product that will not explain what it sells is indefensible* | `viewerTier()` ignores `premium` entirely |
| **PKR25** | **The registry CLASSIFIES; `access.ts` AUTHORISES.** The registry labels *what tier a fact belongs to*. It never decides *what tier a person belongs to* | The tier is an **input** to the owner, derived from the role the platform already resolved |
| **PKR26** | **Filtered BEFORE composition.** Over-tier content is never placed in the prompt. *A prompt containing admin content plus an instruction not to reveal it **has already leaked**, and no amount of instruction-following makes it not have leaked* | **No unfiltered read is exported.** Every port method takes the tier as its first argument — the unfiltered read is *untypeable* |
| **PKR29** | **Absence is never explained.** A hidden entry and a non-existent one return **the same `undefined`**, and the gap messages are **identical**. The Companion never says *"there's an admin feature I can't tell you about"* — **the existence of a hidden surface is itself admin-tier knowledge** | Asserted by string comparison in the test |

**Why PKR25 is the line everything rests on:** if registry visibility were itself the authorisation
decision, **a Markdown edit would be a privilege escalation** and a documentation typo would be a
security incident. The registry is authored in prose and reviewed as documentation. It must never hold
a power it is not reviewed as holding.

### 3.4 Rule PKR27 — and what this workstream will NOT claim

> **No product knowledge in a prompt, template, fallback string, or capability's code.**

`product-knowledge-read-handler.ts` contains **no sentence describing THA**. Every product fact it
emits came out of `product.json` microseconds earlier. The strings in it are about the *registry* ("nothing
here was invented"), never about the *product* ("THA has a Planner"). That line is the whole discipline.

The **routing** obeys it too, and this was the subtler trap. The pattern matchers route on the **shape**
of a product question — *"what can you do?"*, *"does THA have …?"*, *"what is the … page?"* — and
**never on THA's own vocabulary.** There is deliberately no list of page names anywhere in the resolver.
Such a list would be a second owner (Rule PKR13): it would drift the moment a page was renamed, nothing
would point at it, and the failure would surface as the Companion confidently routing a household to a
surface that no longer exists. **The router asks; the registry knows.**

> **What is NOT claimed:** `fnd-pkr27-prompt-knowledge` **remains open.** This change makes Rule PKR27
> *possible to obey* by giving the Companion something to query. It does **not** prove the rule *is*
> being obeyed: **nobody has audited the existing system prompts, templates and fallback strings** for
> sentences about THA that duplicate the registry. The second narrator is now **avoidable**. It has not
> been shown to be **absent**, and the registry entry says exactly that. See SUGGESTION 2.

---

## 4. ARCHITECTURE COMPLIANCE CHECKLIST

```
ARCHITECTURE COMPLIANCE CHECKLIST
==================================

☑ One canonical identity
  Preparations key on knowledge_foods.slug — the SAME key space as
  knowledge_food_nutrients and knowledge_food_benefits. No second key space was
  created. A preparation NEVER mints a canonical food (WS5A Risk R6); identity
  resolution is untouched, and the preparation read is a second, independent pass
  over the same string (the two-reads principle, WS5A §1.7). Plant counting is
  unchanged: raw carrot + cooked carrot = one carrot.
  Product entries key on the registry `id` — the key PKR1 §7 already defined.

☑ One owner per fact
  Preparation knowledge → the WS0 Knowledge Registry (SoT D28), read through
  nutrition-knowledge-registry.ts — the SAME one mouth as every other food fact
  (Rule KC4). Product knowledge → docs/product/ (SoT D29), read through
  product-knowledge-registry.ts. Neither fact has a second store, and neither has
  a second narrator.

☑ No duplicate entities
  Three new tables, none duplicating an existing one. `commonForms` is UNCHANGED
  and is not replaced — the preparation layer READS it. No new capability was
  created for preparation: it EXTENDS the existing `nutrition-knowledge`
  capability, because a second capability over the same owner would be a second
  mouth.

☑ No duplicate ownership
  Effects reuse the EXISTING Layer-2 contract verbatim (sourceRefs / reviewedAt /
  reviewedBy, gated by isEvidenceBackedClaim). No new evidence vocabulary. The
  bespoke `editorialStatus` column WS5A §3.1 proposed was REJECTED for exactly
  this reason (Rule KC1 / Risk R6).

☑ No duplicate state
  No user state introduced. Both new domains are editorial/derived knowledge.

☑ Extends existing architecture
  Preparation: the same single writer (seed-knowledge-registry.ts), the same human
  confirm gate (signoff-knowledge-claims.ts + one edge), the same evidence gate,
  the same key space, the same read layer, the same capability.
  Product: the same Capability Registry, the same Port→Handler→Binding pattern
  (INTELLIGENCE_CAPABILITY_FACTORY.md), the same access.ts, the same INT17.
  Zero new platforms. Zero new assistants. Zero new engines.

☑ Progressive enrichment where appropriate
  Preparation is a knowledge entity: MVF = the catalogue + existence (visible
  immediately); effect is ADDITIVE and never gates existence (Rule KC6). A food
  with no recognised form gets ZERO preparations — an honest gap, never a default
  set.

☑ Knowledge domain compliance
  Preparation Knowledge fills PKCA §1.1's row using the NUTRITION FACTS row as its
  template, exactly as §1.1 predicted it would ("existence is a cheap Candidate,
  *effect* is the evidence-gated claim"). Zero new lifecycle invented:
    CANDIDATE  → knowledge_review_queue (reviewType: preparation_effect)
    GATE       → Layer-1 source trust + entry completeness (isEvidenceBackedClaim)
    CONFIRM    → a NAMED HUMAN (npm run knowledge:signoff --edge preparation-effect)
    PUBLISHED  → evidence-backed + active; renders through the one mouth
    REJECTION  → is_active = false (terminal, never silently re-asked)
  Product Knowledge fills the §9 row PKR3 already wrote; PHASE5A builds its read
  path and creates no rule of its own.

☑ Honest gaps over fabricated information
  ZERO preparation effects seeded — a health claim needs a real citation and a
  named human, and this workstream is neither. An unknown food, a food with no
  recorded preparations, an unregistered product surface, and a query the registry
  cannot answer are ALL honest gaps. The Companion's fallback with an EMPTY
  registry is to know nothing about THA — asserted, because a hardcoded fallback
  set of product facts is exactly the failure Rule PKR27 forbids.

☑ No permanent synchronisation bridge
  product.json is a DERIVED projection of product.yaml — rebuildable, never
  written back to (Principle 7). The preparation layer reads `commonForms`; it does
  not keep a second copy of it in sync. canonical_food.knowledge_food_slug is the
  EXISTING FK — no new bridge was built.

☑ Evolution over replacement
  Nothing is replaced and nothing is retired. `commonForms` keeps its display job,
  untouched. Every existing read behaves exactly as before: `preparations` is an
  additive field, and a surface that ignores it is unchanged.
```

**Gate result: PASS.**

---

## 5. AI ARCHITECTURE COMPLIANCE

```
----------------------------------------
AI ARCHITECTURE COMPLIANCE
----------------------------------------
✓ Uses the canonical Intelligence Platform
    The `intelligencePlatform` singleton. No second platform. 24 capabilities
    registered (was 23); 22 bound and executable (was 21).
✓ Uses the Capability Registry
    `product-knowledge` is a SEED_CAPABILITIES entry, registered like every other.
    Its `report` verb is a recorded honest GAP in SEED_GAPS.
✓ Uses the Intent Engine
    Full pipeline: resolve → capability → permission → confirm → invoke → respond.
    New pattern matchers route through the same resolver; no second router.
✓ Reuses existing business services
    Preparation delegates to nutrition-knowledge-registry.ts (the existing owner).
    Product delegates to product-knowledge-registry.ts. Handlers hold ZERO domain
    logic — no scoring, no ranking, no interpretation, no sentence-building.
✓ Does not create another assistant
    No new assistant, persona, prompt or conversation surface.
✓ Does not duplicate conversation state
    None touched.
✓ Uses registered capabilities only
    executableIntents is TRUTHFUL: product-knowledge executes read/search/explain;
    `report` is NOT listed, because it gaps.
✓ Uses permission-aware access
    Per-entry visibility, filtered BEFORE composition, failing closed to
    `developer`. Role comes from access.ts and from nowhere else.
✓ Produces honest gaps rather than fabricated knowledge
    0 preparation effects. No fallback product facts. A hidden entry and a missing
    entry are INDISTINGUISHABLE to the caller (Rule PKR29).
```

**Gate result: PASS.**

---

## 6. KNOWLEDGE CAPABILITY SUMMARY

### 6.1 Where each of the fifteen areas now stands

| Area | Owner (one, canonical) | The one mouth | Status |
|---|---|---|---|
| Canonical Foods | `canonical_food` (+ variety, alias) | `shared/canonical/food-report-adapter.ts` | ✅ pre-existing |
| Health attributes | `knowledge_health_benefits` | `nutrition-knowledge-registry.ts` | ✅ pre-existing |
| Food benefits | `knowledge_food_benefits` | `getFoodBenefitsForDisplay()` — evidence-gated | ✅ pre-existing |
| Nutrition attributes | `knowledge_nutrients` / `knowledge_food_nutrients` | `nutrition-knowledge-registry.ts` | ✅ pre-existing |
| **Cooking methods** | `knowledge_preparations` (`prepType: cooking`) | `getPreparationsForFood()` | 🆕 **PHASE5A** |
| **Cooking techniques** | `knowledge_preparations` (`prepType: processing`) | `getPreparationsForFood()` | 🆕 **PHASE5A** |
| **Preparation knowledge** | `knowledge_food_preparations` + `_effects` | `getPreparationsForFood()` | 🆕 **PHASE5A** |
| Storage guidance | `knowledge_foods.storage_guidance` | `getFoodDetailView()` | ✅ verified reaching the surface |
| Seasonal knowledge | `canonical_food.peak_seasons` | canonical read model | ✅ pre-existing |
| Shopping intelligence | `shopping_list` | `shopping` / `shopping-discovery` | ✅ pre-existing |
| Product intelligence | `product-analysis.ts` / `upf-analysis-service.ts` | `analyser` | ✅ pre-existing |
| Food comparison | `comparison-engine.ts` (COMP1) | `food-intelligence` | ✅ pre-existing |
| Evidence | `shared/knowledge/evidence.ts` | `isEvidenceBackedClaim()` | ✅ **extended to a 3rd edge** |
| Knowledge review | `knowledge_review_queue` (KQ1B–E) | Knowledge Review Workbench | ✅ **extended: `preparation_effect`** |
| Knowledge publication | `knowledge_releases` (KQ1F) + sign-off | `publishApprovedDecisions` / `knowledge:signoff` | ✅ **extended: 3rd edge** |
| **Product Knowledge** | `docs/product/` (154 entries) | **`product-knowledge` capability** | 🆕 **PHASE5A** |

### 6.2 The graduation pipeline, proven end-to-end (Rule KC1 — four stages, always)

Driven against the **live database inside a rolled-back transaction**, so the lifecycle is proven
without publishing a single health claim:

```
1 CANDIDATE : inserted with a citation, reviewedAt = null
            → speaks? false   ✓ (no human sign-off — Rule KC9)
2 GATE      : a claim citing a BANNED source (a blog), even WITH a sign-off
            → speaks? false   ✓ (Layer 1 gates Layer 2 — Rule KC7)
3 CONFIRM   : reviewedBy = a named human
4 PUBLISHED → speaks? true    ✓

Transaction ROLLED BACK — no claim was persisted.
knowledge_preparation_effects rows after rollback: 0  ✓
```

### 6.3 Future engines consume the same knowledge

Companion, Planner, Shopping and Recommendation engines reach both new domains through the **same
Capability Registry** every existing engine already uses — `nutrition-knowledge` (`read`, scope
`preparations`) and `product-knowledge` (`read`/`search`/`explain`). No engine gets a private path, and
**the day a Coach needs its own copy of preparation knowledge is the day the architecture has failed.**

---

## 7. DOMAIN IMPACT

```
DOMAIN IMPACT
=============
Domain affected: Preparation Knowledge (NEW — SoT Domain 28)
Declared SoT: DB knowledge_preparations / knowledge_food_preparations /
              knowledge_preparation_effects (WS0 Knowledge Registry, extended)
New store created? YES — three tables, extending an existing domain's store set.
  Retirement plan for any replaced store: N/A — nothing is replaced. `commonForms`
  is READ, not superseded, and keeps its existing display job unchanged.
Existing store extended? YES — the WS0 Knowledge Registry.
Consumer created? YES — nutrition-knowledge-registry.ts (the EXISTING read layer).
  Reads from declared SoT? YES.

Domain affected: Product Knowledge (SoT Domain 29 — owner declared by PKR1/PKR3;
                 PHASE5A builds the read path)
Declared SoT: docs/product/ (authored product.yaml → generated product.json)
New store created? NO — the registry already existed (PDA1 populated it).
Existing store extended? NO — three entries UPDATED (Rule KC15), zero created.
Consumer created? YES — server/services/product-knowledge-registry.ts +
  the `product-knowledge` capability.
  Reads from declared SoT? YES — product.json ONLY (Rule PKR21). It reads no code,
  no prose, no YAML.
```

---

## 8. ARCHITECTURE CONVERGENCE STATUS

```
ARCHITECTURE CONVERGENCE STATUS
================================
Domain:
  Platform Knowledge (Preparation Knowledge; Product Knowledge)

Current Canonical Owner:
  Preparation → WS0 Knowledge Registry (knowledge_preparations,
    knowledge_food_preparations, knowledge_preparation_effects), read through
    server/services/nutrition-knowledge-registry.ts
  Product     → docs/product/ (inventory/product.yaml → product.json), read through
    server/services/product-knowledge-registry.ts

Current Runtime Consumer(s):
  Preparation → getFoodDetailView(); the `nutrition-knowledge` capability
    (read, scope "preparations"); the Companion via the pattern resolver
  Product     → the `product-knowledge` capability (read / search / explain);
    the Companion via the pattern resolver

Duplicate Owners Remaining:
  NONE INTRODUCED. Pre-existing and unchanged: SoT Domain 7 (users.dietPattern vs
  user_preferences.dietTypes) — the one disclosed, tested, low-risk exception,
  out of scope here and neither worsened nor silently declared resolved.

Duplicate State Remaining:      NONE
Duplicate Workflows Remaining:  NONE — preparation effects flow through the
  EXISTING review + sign-off workflow. No second lifecycle exists.

Current Convergence (%):
  Knowledge-domain COVERAGE: 15 of 15 areas in the brief now have exactly one
  declared owner and one mouth (11 pre-existing and verified, 4 built here).

  Knowledge-domain ENFORCEMENT (whether the evidence standard is code-enforced,
  not merely declared — Rule KC8):
    · Preparation (Layer 2): 100% — the gate is the SAME running validator as the
      benefit chip's (isEvidenceBackedClaim), asserted by 30 tests. It cannot
      drift onto a weaker bar because there is no second bar.
    · Product Knowledge (bijection + visibility): ENFORCED —
      scripts/verify-product-inventory.ts asserts a TOTAL prose↔inventory
      bijection (154/154) and that every entry carries a visibility; the runtime
      fails closed on a malformed one.
    · Product Knowledge (CURRENCY — Rule KC14): 0% — NOT ENFORCED. Nothing checks
      that `last_verified` is inside a bar, and nothing checks that an entry's
      `sources` still resolve. This is Risk R8, named by PKCA §4.3 at the domain's
      birth and NOT closed here. It is stated plainly rather than rounded up.

Target Convergence (%):
  100% enforcement. The open item is Product Knowledge currency (SUGGESTION 3).

Next Planned Milestone:
  The currency validator (Risk R8) and the PKR27 prompt audit (SUGGESTION 2).
  Neither is in PHASE5A's scope, and neither is claimed as done.

Remaining Architectural Risks:
  R8 (PKCA §8) — Product Knowledge currency stays declared and unenforced. It
  MATTERS MORE NOW than it did yesterday: before PHASE5A a stale entry misled a
  reader who went looking for it; now it is read aloud to a household in the
  Companion's voice, with the product's authority behind it. The Companion will
  always be more convincing than the registry is accurate. This change did not
  create that risk — PKR2 did, deliberately — but it is the change that ACTIVATES
  it, and saying so is the honest report.
```

---

## 9. DATA IMPACT ASSESSMENT

| | |
|---|---|
| Reads existing data | **YES** — `FOOD_SEED.commonForms` (to project preparations); `docs/product/inventory/product.json` |
| Writes new data | **YES** — 39 `knowledge_preparations` rows, 420 `knowledge_food_preparations` rows. **0 `knowledge_preparation_effects` rows** |
| Changes meaning of existing data | **NO** — `commonForms` keeps its exact meaning and its display job. No column's semantics changed |
| Requires backfill | **NO** — additive only. No existing row was rewritten |
| Schema changes | **YES** — 3 new tables (`CREATE TABLE IF NOT EXISTS` × 3, + 2 indexes). Nothing dropped, nothing altered |
| Production migration | `2026-07-11_phase5a_preparation_knowledge`, appended to `server/migrations/runner.ts` — **the only sanctioned path** (TRUST1-O8). `db:push` was NOT used against anything but a disposable DB |
| Reversibility | Total. The migration adds; it never destroys. Rolling back the code leaves three empty, unread tables |
| Seed reconciliation | The preparation tables ARE reconciled (a retired preparation deactivates, never deletes). **`knowledge_preparation_effects` is deliberately NOT reconciled** — the seed does not author effects, and a sweep would deactivate every human sign-off on the next re-seed |

---

## 10. TRUST CHECK

**Could this mislead the user?**
The single largest risk in this whole workstream is a household hearing *"we know it doesn't matter"*
when the truth is *"nobody has looked"*. It is structurally prevented: `"no-change"` is reachable
**only** from a row that cleared the evidence gate, and the absence of a row can only ever produce
`"unreviewed"`. The two states are separate members of a discriminated union — a caller must switch on
`state`, and cannot collapse them by accident. Asserted directly.

**Could this fabricate certainty?**
No. **Zero preparation effects are seeded.** A preparation effect is a health claim; publishing one
requires a Layer-1 citation and a named human sign-off, and no automated process may perform that step
(Rule KC9). The tables ship empty and every preparation reports `unreviewed`, which is the truth. A
claim citing a banned source does not render **even when signed off** — asserted.

**Is anything guessed but shown as real?**
No. Every preparation edge traces to a `commonForms` string a human already authored — mechanically
asserted, with **zero** unauthored edges. Every product fact traces to a `product.json` entry with a
named owner. With an **empty** registry, the Companion knows nothing about THA — there is no hardcoded
fallback set of product facts, and that is asserted, because such a fallback is exactly the second
narrator Rule PKR27 forbids.

**What happens if the system is wrong?**
- *A preparation is miscatalogued* → a household is told people eat a food a way they don't. Mild,
  visible, correctable in one seed file. No health claim is attached to it.
- *A product entry is stale* → **this is the serious one, and it is now more serious than it was
  yesterday.** The Companion reads it aloud with the product's authority. PHASE5A does not close this
  (Risk R8); it activates the risk PKR2 accepted, and the report says so rather than burying it.
- *A visibility label is wrong* → it fails **closed**. A malformed label reaches nobody, including an
  admin. Wrongly hiding a fact costs a reader an answer; wrongly exposing one cannot be undone, and
  the asymmetry is deliberate.

| | |
|---|---|
| No architectural duplication introduced | **YES** — no second store, no second lifecycle, no second evidence vocabulary, no second assistant, no second key space, no second mouth |
| No new source of truth created | **YES** — Preparation extends the WS0 Knowledge Registry (an existing owner); Product Knowledge's owner was declared by PKR1/PKR3, and PHASE5A builds only its read path |
| No runtime behaviour altered | **NO** — behaviour IS altered, deliberately: `getFoodDetailView` gains an additive `preparations` field, and two new conversational routes exist. **No existing field changed, and no existing route was re-pointed** (verified: 15/15 routing cases, of which the one "failure" is a pre-existing behaviour reproduced identically at HEAD) |

---

## 11. PRODUCT REGISTRY IMPACT

*(Mandatory — Rule KC15. The test: **would a person's answer to "what is THA?" be different now?** YES — THA can now explain itself, and can now talk about how food is prepared.)*

- **Registry affected:** **YES**
- **Entries created:** NONE
- **Entries updated:**
  - `cap-product-knowledge` — **`status: hidden → live`, `visibility: developer → household`, v1 → v2.** Its own purpose line said the capability *"is not yet registered … and the Companion therefore cannot read"* it. That is no longer true, which under Rule PKR15 made the entry a **defect** the moment the capability was bound. `fnd-no-product-knowledge-capability` → **CLOSED**. `fnd-pkr27-prompt-knowledge` → **KEPT OPEN**, with the reason stated in the entry.
  - `cap-nutrition-knowledge` — v1 → v2. Now names preparation knowledge, and states plainly that **no preparation effect has been signed off**, so THA says a preparation exists and says nothing about what it changes.
  - `dev-capability-registry` — v1 → v2. Known defect cleared; 24 registered / 22 executable.
- **Entries retired:** NONE
- **Any entry set to `public` or `household`:** `cap-product-knowledge` → **`household`**. Justified: it describes a capability every signed-in household uses when it asks Apple what THA can do. It is not `public` (it names internal-facing siblings) and no longer `developer` (a household is now its actual audience). Per-**entry** visibility, not the capability's reachability, is what gates any individual product fact.
- **Product knowledge written into a prompt, template, or fallback string:** **NO** — and the routing carries no product vocabulary either (§3.4).
- **Bijection re-verified:** `scripts/verify-product-inventory.ts` → **154 records ↔ 154 prose entries, bijection TOTAL, 0 failures.**

---

## 12. DEFINITION OF DONE

**What success looks like**
- Preparation Knowledge exists as a first-class knowledge domain, filling PKCA §1.1's row with **zero new lifecycle invented** — the first real test of whether PKCA is sufficient guidance without re-derivation, and it passed.
- Cooking methods, cooking techniques and preparation live in **one catalogue, one key space**, keyed the same way as every other knowledge edge.
- A preparation **effect** cannot be published by any automated process; it needs a citation and a named human, and the pipeline for that is built and proven.
- The three honest states are **structurally** distinct: `"no-change"` can never be produced by an absence.
- The Product Knowledge Registry is **queryable**: the Companion answers questions about THA from an owned, permission-aware source instead of from nothing (or from an invented sentence).
- Visibility is monotonic, fails closed, keys on role, filters before composition, and never explains an absence — each asserted mechanically, not asserted in prose.

**What must not break** *(and did not)*
- Identity resolution and plant counting — untouched. A preparation never mints a food.
- Every existing food read — `preparations` is additive; a surface that ignores it is unchanged.
- Every existing conversational route — 15/15 verified; the one non-routing case reproduces **identically** at HEAD (`git stash` proof).
- The benefit evidence gate — unchanged, and now shared with a third edge.

**Manual test steps** → §13.

---

## 13. MANUAL VERIFICATION CHECKLIST

```bash
# 0. Rollback tag exists
git tag -l 'rollback/PHASE5A*'
#    → rollback/PHASE5A-knowledge-platform-activation-20260711

# 1. Migration is present and applies cleanly (additive; safe to re-run)
grep -n "2026-07-11_phase5a_preparation_knowledge" server/migrations/runner.ts

# 2. Seed — EXISTENCE only. Expect 39 / 420 / 0.
npm run seed:knowledge
#    knowledge_preparations        : 39
#    knowledge_food_preparations   : 420
#    knowledge_preparation_effects : 0   ← MUST be 0. Any other number means a
#                                          health claim was published without a
#                                          human, which is the one thing that
#                                          must never happen.

# 3. Preparation Knowledge — the honest-state model (30 assertions)
npm run test:preparation-knowledge

# 4. Product Knowledge — permission + disclosure (32 assertions)
npm run test:intelligence-product-knowledge-binding

# 5. The evidence gate is unchanged and now shared by three edges
npm run test:knowledge-evidence-gate
npm run test:know5-evidence-contract

# 6. No routing regression
npm run test:benchmark-routing
npm run test:intent-routing-attribution
npm run test:comp2-natural-conversation

# 7. Capability count: 24 registered / 22 executable
npm run test:intelligence-platform
npm run test:intelligence-registry-executability

# 8. The Product Registry is internally true (bijection + visibility)
npx tsx scripts/verify-product-inventory.ts
#    → 154 records ↔ 154 prose entries · bijection: TOTAL · 0 failures

# 9. Repository structure
bash .engineering/scripts/repo-structure-verify.sh
```

**Manual sign-off — the human gate (this is the step no script may take):**

```bash
npm run knowledge:signoff -- --edge preparation-effect     # dry run: prints pending claims
#    → "No sourced claims awaiting sign-off."  (correct — none are authored yet)
```

---

## 14. USER ACCEPTANCE EVIDENCE

**Verified against the live database, not asserted from a document.**

**A. Preparation reads, through the one mouth:**
```
Tomatoes (tomatoes)
  storage     : Keep fresh at room temperature for best flavour.
  seasonality : Summer (tinned year-round)
  · Fresh        [state]        state=unreviewed  note=(none — honest gap)
  · Tinned       [preservation] state=unreviewed  note=(none — honest gap)
  · Sun-dried    [preservation] state=unreviewed  note=(none — honest gap)

Salmon (salmon)
  · Tinned       [preservation] state=unreviewed  note=(none — honest gap)
  · Smoked       [processing]   state=unreviewed  note=(none — honest gap)

Oats (oats)
  · Rolled       [processing]   state=unreviewed  note=(none — honest gap)
  · Ground       [processing]   state=unreviewed  note=(none — honest gap)
```
THA says people eat tomatoes tinned and sun-dried. It says **nothing** about what that changes,
because nobody has signed off a claim that it does. **That is the product working.**

**B. The four-stage pipeline, driven live in a rolled-back transaction:** see §6.2. Candidate cannot
speak; a banned source cannot speak even when signed off; only cited + human-confirmed publishes;
nothing persisted.

**C. Conversation routing — new routes land, existing routes do not move:**
```
✓ what can you do?                     → product-knowledge
✓ does THA have a shopping list?       → product-knowledge
✓ what is the planner page?            → product-knowledge
✓ how should I cook broccoli?          → nutrition-knowledge [scope=preparations]
✓ is frozen spinach as good as fresh?  → nutrition-knowledge [scope=preparations]
✓ what nutrients does broccoli have?   → nutrition-knowledge [scope=food]        (unchanged)
✓ what can I cook with chicken?        → meal-discovery                          (unchanged)
✓ what's on my shopping list?          → shopping-discovery                      (unchanged)
```

**D. Test results (all green):**

| Suite | Result |
|---|---|
| `test:preparation-knowledge` (new) | **30 / 30** |
| `test:intelligence-product-knowledge-binding` (new) | **32 / 32** |
| `test:intelligence-platform` | 33 / 33 |
| `test:intelligence-registry-executability` | 124 / 124 |
| `test:knowledge-evidence-gate` | 116 / 116 |
| `test:know5-evidence-contract` | 109 / 109 |
| `test:benchmark-routing` | 117 / 117 |
| `test:intent-routing-attribution` | 79 / 79 |
| `test:comp2-natural-conversation` | 210 / 210 |
| `test:comp1-food-comparison` | 56 / 56 |
| `test:intelligence-context-composition` | 164 / 164 |
| All 18 other capability-binding suites (scope-lock 21 → 22) | **all pass** |
| `verify-product-inventory` | 154 ↔ 154, bijection TOTAL, **0 failures** |

---

## 15. FILES CHANGED

**Created (7)**
| File | Purpose |
|---|---|
| `shared/knowledge/preparations.ts` | The catalogue, the `commonForms` map, the **recorded exclusions**, the seed validator |
| `server/services/product-knowledge-registry.ts` | The Product Knowledge owner-side read layer + the permission filter |
| `server/intelligence/handlers/product-knowledge-read-port.ts` | Delegation surface — the tier is a required first argument, so an unfiltered read is untypeable |
| `server/intelligence/handlers/product-knowledge-read-handler.ts` | Read/search/explain; honest gaps; **no sentence about THA anywhere in it** |
| `server/intelligence/bindings/product-knowledge.ts` | Registers the handler on the singleton |
| `server/tests/test-preparation-knowledge.ts` | 30 assertions — the honest-state model |
| `server/tests/test-intelligence-product-knowledge-binding.ts` | 32 assertions — permission + disclosure |

**Modified (11 + 20 scope-lock test files)**
| File | Change |
|---|---|
| `shared/schema.ts` | 3 tables + vocabularies + insert schemas + types |
| `server/migrations/runner.ts` | Migration `2026-07-11_phase5a_preparation_knowledge` (additive) |
| `server/services/nutrition-knowledge-registry.ts` | `getPreparationsForFood()`, `listPreparations()`, the three-state gate; `FoodDetailView.preparations` |
| `server/seeds/seed-knowledge-registry.ts` | Seeds catalogue + existence (never effects); reconciles both, **never the effects table** |
| `server/seeds/signoff-knowledge-claims.ts` | Third edge: `--edge preparation-effect` |
| `server/intelligence/capability-registry.ts` | `product-knowledge` capability + its `report` honest gap; `nutrition-knowledge` description |
| `server/intelligence/handlers/nutrition-knowledge-read-handler.ts` | `preparations` read scope + the passthrough projection |
| `server/intelligence/intelligence-platform.ts` | Binds `product-knowledge` |
| `server/intelligence/index.ts` | Exports |
| `server/intelligence/pattern-intent-resolver.ts` | Product-knowledge + preparation matchers (routing on **shape**, never on THA's vocabulary) |
| `package.json` | Two test scripts, added to the `test` chain |
| 20 × `server/tests/test-intelligence-*.ts` | Scope lock 21 → 22 live capabilities |

**Documentation (6)**
| File | Change |
|---|---|
| `docs/implementation/knowledge/PHASE5A_KNOWLEDGE_PLATFORM_ACTIVATION.md` | This report |
| `docs/architecture/THA_SOURCE_OF_TRUTH_ARCHITECTURE_REGISTER.md` | **Domain 28** (Preparation) + **Domain 29** (Product Knowledge) |
| `docs/architecture/PLATFORM_KNOWLEDGE_COMPLETION_ARCHITECTURE.md` | §7 Phase 4 → **BUILT**; Phase 7 → **read path built, currency still open** |
| `docs/product/inventory/product.yaml` (+ generated `product.json`) | 3 entries updated |
| `docs/product/intelligence/knowledge-capabilities/cap-product-knowledge.md` | hidden/developer → **live/household** |
| `docs/product/intelligence/knowledge-capabilities/cap-nutrition-knowledge.md`, `docs/product/surfaces/developer/dev-capability-registry.md` | Preparation knowledge; defect closed |

---

## 16. SCOPE LOCK

**Implemented:** exactly PHASE5A. Preparation Knowledge (catalogue, existence, evidence-gated effect,
review + sign-off + publication path, capability read scope, conversational routing). The Product
Knowledge capability (owner read layer, permission filter, port, handler, binding, registration,
routing). Verification of the eleven areas that already existed. Registry, SoT and roadmap updates.

**Explicitly NOT implemented:**
- **No preparation effect content.** Zero rows. It needs a nutritionist and a citation, not an engineer.
- **No Observation, Behaviour, Decision, Insight, Recommendation or Companion activation** — the scope lock in the brief, honoured exactly.
- **No UI.** No client file was touched. `preparations` reaches `getFoodDetailView`; **no surface renders it yet.** Because nothing user-visible changed, the Experience/UI Governance checklists do not apply to this change — they will apply, in full, to the workstream that renders it.
- **No prompt audit.** `fnd-pkr27-prompt-knowledge` remains open (SUGGESTION 2).
- **No currency validator.** Risk R8 remains open (SUGGESTION 3).
- **No `commonForms` migration or deletion.** It keeps its display job, unchanged.

---

## SUGGESTIONS *(out of scope — do not implement without approval)*

1. **`test-know5-evidence-contract.ts` depends on un-reconciled DB state.** It asserts the retired
   `plant-protein` orphans are *active* as a fixture premise — so **anyone who runs the sanctioned
   `npm run seed:knowledge` breaks it**, and must then know to restore 41 rows by hand (as this
   workstream did). The fixture should create its own orphan inside its transaction rather than
   depending on the shared dev database being in a stale state.

2. **Audit prompts, templates and fallback strings for product knowledge (Rule PKR27).** PHASE5A makes
   the rule *possible* to obey; it does not prove it *is* obeyed. A grep for sentences about THA in
   `server/intelligence/conversation/**` is the obvious first pass, and `fnd-pkr27-prompt-knowledge`
   stays open until someone does it.

3. **Build the Product Knowledge currency validator (Risk R8 / Rule KC14).** Assert that every entry's
   `sources` still resolve to a file that exists, and that `last_verified` is inside a bar. **This is
   now the platform's largest declared-and-unenforced gap**, and PHASE5A is what made it expensive:
   the registry is no longer read by a person who went looking — it is read aloud to a household in
   the Companion's voice.

4. **Author the first preparation effects.** WS5A §2.3 lists the genuinely evidenced cases (cooked
   tomato → lycopene bioavailability; smoked salmon → sodium caution). Each needs a real Layer-1
   citation and a named reviewer through `npm run knowledge:signoff --edge preparation-effect`. The
   pipeline is built and proven; it is waiting on editorial, not engineering.

5. **Render preparations on the food-detail surface.** The three honest states are visually distinct by
   design (WS5A §4.3) and this is where that pays off. A UI workstream, with the full Experience + UI
   governance checklists.

6. **Dead binding: `server/intelligence/bindings/uplift.ts`.** It declares `UPLIFT_CAPABILITY_ID = "uplift"`
   and calls `platform.registerHandler("uplift", …)`, but **`uplift` is not in the capability registry**
   and the binding is **never called** — it would throw `Cannot bind handler: unknown capability "uplift"`
   if it ever were. Its handler and port are unwired. Found while mapping the platform; not touched.

---

*Rollback: `git checkout rollback/PHASE5A-knowledge-platform-activation-20260711` → `d2ee8454`.*
