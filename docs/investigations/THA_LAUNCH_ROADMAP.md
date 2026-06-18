# The Healthy Apples — Launch Roadmap

**Document type:** Launch sequencing + architecture roadmap (**investigation only — no implementation**).
**Date:** 2026-06-18
**Author role:** Senior product architect + senior React/Node/Postgres engineer + launch lead.
**Synthesises (read together — this document sequences all of these into one launch):**
- `COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` — Plant Diversity Tier A / Tier B.
- `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` — the curated static knowledge layer (the nutrient bridge).
- `PANTRY_V2_NUTRITION_KNOWLEDGE_HUB.md` — Pantry Explore as the evergreen knowledge hub.
- `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md` — the aggregation shell + claim-safety rules + A→E sequence.
- `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` — the DB-backed graduation of the static registry.
- `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md` — editorial rules + automation curve.
- `THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md` — the retrieval-and-ranking recommendation engine.
- `project_overview.md`, `current_dev_status.md` — product/engine baseline.

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/launch-roadmap-20260618` |
| **Points to commit** | `bae3b99` (`bae3b992e021abe32182dcf13f9aff7f1e708a95`) |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard rollback/launch-roadmap-20260618` |
| **Undo this doc only** | `rm docs/investigations/THA_LAUNCH_ROADMAP.md` |

**Required rollback steps — completed before investigation began:**

1. ⚠️ **Git status checked.** No tracked files are modified or staged. **Six pre-existing untracked
   investigation docs are present** (`COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md`,
   `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md`,
   `NUTRITION_KNOWLEDGE_EDITORIAL_AND_AUTOMATION_FRAMEWORK.md`,
   `NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md`,
   `THA_PERSONALISED_NUTRITION_INTELLIGENCE_ARCHITECTURE.md`,
   `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`). These predate this task and are untouched by it.
   **The committed tree is clean** (`git status --porcelain --untracked-files=no` is empty); the rollback
   tag captures committed HEAD. The untracked docs are not affected by `git reset --hard` to the tag.
2. ✅ **Current branch confirmed:** `safety/preserve-since-last-prod-20260617-1613`.
3. ✅ **Rollback tag created:** `rollback/launch-roadmap-20260618` at `bae3b99`.
4. ✅ **Rollback identifier reported** (above) before any investigation work.

**This task makes no code, CSS, route, schema, API, migration, data, or ingestion change, and generates
no health claims.** It produces exactly two artefacts: this markdown file and one git tag. Full
confirmation in §13 and the Final Report.

---

# SECTION 1 — EXECUTIVE SUMMARY

THA is not one feature away from launch. It is one *layer* away — and that layer is **curated, sourced,
human-reviewed nutrition content**, not code. Across six prior investigations the engineering for the
launch experience is largely built or precisely specified; the shared display model, the nutrient
bridge, the trust guardrails, the empty-state discipline, and the aggregation seams all exist. The
remaining work is **craft (responsive polish, reconciliation) and editorial (the registry)** — and the
single longest pole is the editorial pole, because it cannot be rushed without violating the trust
philosophy that *is* the product.

**The defining strategic call: launch the connected five-surface knowledge experience — not the
automation, not the personalisation, not the progress system.** The brief's instinct to "launch a
complete, polished, interconnected product" is correct, but "complete" must be scoped to the
*connected knowledge experience*, because three of the seven proposed workstreams (Knowledge Management
System, the automation framework, Personalised Nutrition Intelligence learning, Household Progress) are
explicitly designed by their own authors as **post-launch graduations**. Trying to launch them is not
"the best launch" — it is the launch that never ships, or ships unsafe.

**Three findings shape the whole roadmap:**

1. **The keystone is a data-quality + content layer the brief's workstream list under-weights.** Before
   any health benefit can render correctly, two reconciliations must happen (the **9-category enum** and
   the **controlled nutrient vocabulary**), and the **static Health Benefits & Nutrition Context
   registry** must be authored, sourced, and nutritionist-signed-off. Every other launch surface is
   downstream of this. It is the critical path, and it is editorial-capacity-bound, not
   engineering-bound.

2. **Plant Diversity can — and should — launch before any of that lands.** It launches as **Tier A** (a
   plant-variety + key-nutrient experience with honest empty states) needing only responsive/density
   craft. The registry then upgrades it to **Tier B** in place, with zero UI rework. This decouples the
   visible flagship from the slow editorial pole and is the single most important sequencing decision
   for shipping *something excellent* on time.

3. **Claim safety is the gating constraint, and it is structural, not procedural.** The worst-case
   failure this roadmap must prevent is *shipping a fabricated or AI-generated health claim to hit a
   launch date*. Every architecture already encodes the defence (nutrient bridge, source-required gate,
   fallback to nutrients-only, banned-vocabulary rules). The roadmap's job is to **never create a phase
   whose only way to "finish on time" is to weaken one of those gates.**

**Recommended launch definition:** THA is "launched" when the **five connected surfaces** (Plant
Diversity, Pantry Explore, Weekly Nutrition Report, Analyser, Simply Better Choices) are
responsive, density-aware, trust-safe, and reading from one shared knowledge model — with the **minimum
5 established, sourced health benefits** populated, and every gated section degrading to an honest
shell. Everything else (KMS automation, the recommendation engine's learning stages, Household
Progress, Choose Better's caution classifier) is post-launch, sequenced behind explicit gates.

**Confidence: High** on the architecture and sequencing (this is a synthesis of code-verified designs).
**Medium** on the editorial timeline, because the registry's content does not yet exist and must not be
guessed or AI-generated.

---

# SECTION 2 — CURRENT PRODUCT READINESS

Per-applet assessment, grounded in `project_overview.md`, `current_dev_status.md`, the six design docs,
and the live page/nav surface (`client/src/pages/`, `nav-bar.tsx`). Ratings: **Launch Ready** ·
**Needs Polish** · **Needs Architecture** · **Needs Implementation** · **Blocked**.

| # | Applet | Route / page | Rating | What it needs for launch |
|---|---|---|---|---|
| 1 | **Dashboard** | `/dashboard` (`dashboard.tsx`) | **Needs Polish** | Add the compact "Plants this week 24/30" summary card deep-linking to Plant Diversity (per PD §2). Responsive/density pass. No architecture gap. |
| 2 | **Cookbook** | `/cookbook` (`meals-page.tsx`, `meal-detail-page.tsx`) | **Needs Polish** | Mature (meal library, detail V3, Family Confidence). Needs the `mealId` seam to Plant Diversity (PD §6/§11) and a responsive/density audit. No new architecture. |
| 3 | **Planner** | `/planner`, `/weekly-planner` | **Needs Polish** | The product's data spine; mature. Add the **second entry point** to the Weekly Nutrition Report (WNR §5) alongside the existing Plant Diversity link. Tier-4 component-shell recovery is *not* a launch blocker (it's a candidate-pool depth improvement) — see note. |
| 4 | **Plant Diversity** | `/plant-diversity` (`PlantDiversityReport.tsx`, 728 lines) | **Needs Polish** (Tier A) / **Needs Architecture+Implementation** (Tier B) | Tier A: responsive card/table at 640px, adopt `useAdaptiveDensity`, disambiguate the two "variety" mechanics, one spoken name, `mealId` on seam. Tier B: the curated registry (WS-Knowledge). ~80% built. |
| 5 | **Pantry** | `/pantry` (`pantry-page.tsx`, ~1,019 lines) | **Needs Architecture** (Explore mode) | Inventory mode is **Launch Ready**. The "Explore / Nutrition Knowledge Hub" second mode is net-new UI on the shared model + the benefit reverse-index. Read-only Explore is the launch target. |
| 6 | **Shopping** | `/shopping-list`, `/shopping-workspace`, `/supermarkets` | **Launch Ready** | Strongest existing integration (basket send, price intelligence, fulfilment memory). Responsive audit only. No architecture gap. |
| 7 | **Analyser** | `/analyser` (`products-page.tsx`) | **Launch Ready** (core) / **Needs Polish** (deep-links) | Authoritative product-judgement engine is mature (UPF, NOVA, additive risk, `apple-score-trust`, `buildWhyBetter`, `rankChoices`). Needs the inbound deep-link seam from WNR §6/§7/§8 (the `/analyser?q=…` pattern already exists). **Additive-risk wording is gated on `sources` on the `additives` table.** |
| 8 | **Diary** | `/my-diary` (`food-diary-page.tsx`) | **Needs Polish** | Functional food/wellbeing log. Responsive/density audit; confirm it is not a claim-bearing surface (it is not). Not on the knowledge critical path. |
| 9 | **Profile** | `/profile` (`profile-page.tsx`) | **Needs Polish** | Mature (diet pattern, restrictions, household eaters). Add per-person **goals / likes / dislikes** fields *only if* the recommendation engine ships at launch (it should not — see §10). Without that, polish only. |
| 10 | **Partners** | `/partners` (`partners-page.tsx`) | **Needs Polish** *(confirm scope)* | Lowest-information applet for this investigation. Confirm whether Partners (Friends & Family / referral) is in launch scope at all; if yes, responsive + content pass; if no, hide from launch nav. **Open question for product.** |

**Cross-cutting (applies to every applet):**

- **Responsive & Adaptive Density** — the Adaptive Density Foundation (`use-adaptive-density.tsx`,
  breakpoints 640/1280/1536) exists but is **inconsistently consumed**. Plant Diversity's table uses a
  *different* breakpoint (768 `md`) and ignores density entirely. This is the #1 production-readiness
  gap and it recurs across applets (see §8).
- **Trust messaging / empty states** — already disciplined (`HEALTH_DISCLAIMER`, `EMPTY_STATES`,
  honest `[]` health benefits). A strength, not a gap.
- **Knowledge surfaces (PD Tier B, Pantry Explore, WNR strengths)** — all blocked on the *same* single
  thing: the curated registry. They are not independent gaps; they are one gap seen from three angles.

> **Note on Tier-4 component-shell recovery** (`current_dev_status.md` Stream A/B, `project_overview.md`
> W2/W3): the household meal matcher is built but unwired, and restricted households can get empty
> breakfast slots. This is a **planner quality-of-service** issue, **not a knowledge-launch blocker**.
> It belongs to the planner workstream and should be sequenced on its own merits (it is high-value for
> the restricted-household segment), but it does not gate the connected-knowledge launch and is not
> part of the seven proposed workstreams. Flagged here so it is not lost.

---

# SECTION 3 — LAUNCH WORKSTREAMS

### Is the brief's 7-workstream breakdown correct? — **Mostly, but it must be re-cut.**

The brief proposes: (1) Plant Diversity, (2) Pantry Explore V2, (3) Knowledge Management System,
(4) Personalised Nutrition Intelligence, (5) Choose Better, (6) Weekly Nutrition Report,
(7) Household Progress. **Three corrections are required for a launch-quality plan:**

1. **The breakdown conflates the launch-critical *static knowledge registry* with the long-term
   *Knowledge Management System*.** They are different timelines. The static registry (curated TS files,
   no schema) is the launch keystone; the KMS (DB-backed, ingestion, automation) is its post-launch
   graduation. Folding them into one "Workstream 3" hides the single most important launch dependency.
   → **Split into a launch workstream (Knowledge Layer V1) and a post-launch programme (KMS + Editorial
   & Automation).**

2. **It omits the keystone reconciliation work.** The 9-category enum fracture and the uncontrolled
   nutrient vocabulary are prerequisites for *any* benefit to render correctly, and they are called out
   in three separate design docs. They deserve to be a named, sequenced-first workstream, not an
   implicit chore. → **Add Workstream 0 — Knowledge Foundations.**

3. **Three of the seven are post-launch by their own authors' design.** KMS automation, Personalised
   Nutrition Intelligence (learning stages), and Household Progress are explicitly deferred behind trust
   gates in their source documents. Listing them as launch workstreams invites scope creep that makes
   the launch *worse* (rushed, unsafe), not better. → **Move them to the post-launch roadmap (§10).**

### Recommended launch workstreams (re-cut)

| WS | Name | Maps to brief | Scope | Gates launch? |
|---|---|---|---|---|
| **WS0** | **Knowledge Foundations** | (implicit) | 9-category enum reconciliation (avocado → Healthy Fats; library strings → enum); controlled nutrient vocabulary (`public`/`internal`/`hidden`); `keyNutrients` reconciled; `mealId` on `WeekMealEntry` seam. **Data-quality only, no new claims.** | **Yes — first.** |
| **WS1** | **Plant Diversity Launch (Tier A)** | WS1 | Responsive card/table switch at 640; adopt `useAdaptiveDensity`; one spoken name; disambiguate "Your Variety" vs "Broaden Your Variety"; meal→recipe links; honest empty states. **No registry needed.** | **Yes.** |
| **WS2** | **Knowledge Layer V1 (static registry)** | part of WS3 | Author + source + nutritionist-sign-off the **5 (min) / 8 (ideal)** Health Benefits via the nutrient bridge; structured Nutrition Context for the launch food set; `sources` with `lastReviewed`; EFSA wording firewall; wire into the existing `health-benefits-model.ts` adapter. **The keystone content.** | **Yes (for benefits-bearing surfaces).** |
| **WS3** | **Pantry Explore V2** | WS2 | Second "Explore" mode (read-only): browse Benefit → Nutrient → Food → Meal → Boost on the shared model; "already in your meals ✓ / easy additions ○"; reuse the shopping loop. The encyclopedic surface. | **Yes (the knowledge hub).** |
| **WS4** | **Weekly Nutrition Report** | WS6 | New `/weekly-nutrition` aggregation shell on `useWeekMealEntries`; embed Plant Diversity as §1; ship low-risk sections (counts/strengths/gaps/better-additions) live; gated sections (Protein & Whole Foods, UPF risk wording, Occasional Foods) as **honest shells**; Analyser deep-links. | **Yes (the story).** |
| **WS5** | **Choose Better (launch subset)** | WS5 | Ship the **positive half** — affirm + balance-the-plate (reuses Simply Better Choices) + factual same-category comparison via the *existing* Analyser product data. **Defer the net-new ingredient-tier caution classifier** (highest claim risk) to post-launch. | **Partial — positive half only.** |

**Not launch workstreams (→ §10 post-launch / §11 long-term):**
- **Knowledge Management System (DB-backed)** + **Editorial & Automation Framework** — graduation of WS2.
- **Personalised Nutrition Intelligence** — Stages 1–2 are a fast-follow; Stages 3–5 are long-term.
- **Household Progress** — post-launch (the brief's own example places it there).

---

# SECTION 4 — DEPENDENCY MAP

```
                         ┌─────────────────────────────────────────────┐
                         │  WS0  KNOWLEDGE FOUNDATIONS (data-quality)    │
                         │  • 9-category enum reconciled (avocado→Fats)  │
                         │  • controlled nutrient vocabulary             │
                         │  • keyNutrients reconciled to vocab           │
                         │  • mealId on WeekMealEntry seam               │
                         └───────────────┬───────────────┬──────────────┘
                                         │               │
              (nutrient bridge needs     │               │  (mealId, category enum
               a clean nutrient vocab)   │               │   needed for correct grouping)
                                         ▼               ▼
   ┌──────────────────────────────────────────┐   ┌──────────────────────────────────┐
   │  WS2  KNOWLEDGE LAYER V1 (static registry) │   │  WS1  PLANT DIVERSITY TIER A       │
   │  Health Benefits (5 min) + Nutrition       │   │  (responsive + density + variety  │
   │  Context, sourced, nutritionist-signed,    │   │   disambiguation + meal links)     │
   │  EFSA-checked → health-benefits-model.ts   │   │  ⚠ NEEDS ONLY WS0, NOT WS2         │
   └───────┬───────────────┬───────────────┬────┘   └──────────────┬─────────────────────┘
           │               │               │                       │
           │ (benefit       │ (full        │ (benefits as           │ (Tier B upgrade
           │  chips, Tier B)│  knowledge   │  Strengths/Gaps)       │  in place)
           ▼               ▼               ▼                       ▼
   ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────────────────────────┐
   │ WS1→Tier B    │  │ WS3 PANTRY   │  │  WS4  WEEKLY NUTRITION REPORT (aggregation)    │
   │ (PD benefits  │  │ EXPLORE V2   │  │  embeds PD §1; strengths/gaps/additions live;  │
   │  light up)    │  │ (the hub)    │  │  Protein/UPF-risk/Occasional = honest shells   │
   └───────────────┘  └──────────────┘  └───────────────┬────────────────────────────────┘
                                                          │ (deep-links, reuse existing engine)
                                                          ▼
                                          ┌──────────────────────────────────────────────┐
                                          │  WS5  CHOOSE BETTER (positive half at launch)  │
                                          │  affirm + balance (=SBC) + factual compare via │
                                          │  EXISTING Analyser data. Caution classifier →  │
                                          │  POST-LAUNCH (needs sources + copy sign-off).  │
                                          └──────────────────────────────────────────────┘

   ── existing, reused as-is (NOT blockers) ───────────────────────────────────────────────
   Analyser engine · Simply Better Choices (nutrition-boosts) · Shopping loop · Planner spine
   · useWeekMealEntries seam · Adaptive Density Foundation · health-benefits-model.ts adapter

   ── POST-LAUNCH (depend on WS2 existing + extra gates) ───────────────────────────────────
   KMS (DB) → Editorial/Automation → Recommendation Engine (Stages 3+) → Household Progress
```

**Reading of the map:**

- **WS0 is the universal upstream.** Nothing benefit-related is correct until the nutrient vocabulary and
  category enum are reconciled. A single nutrient-string mismatch (`Omega-3` vs `Omega 3`) silently
  breaks the bridge — this is a *correctness* dependency, not a nice-to-have.
- **WS1 (Plant Diversity Tier A) depends only on WS0, not on WS2.** This is the decoupling that lets the
  flagship ship while the registry is still in editorial review.
- **WS2 (the static registry) is the convergence point.** PD Tier B, Pantry Explore's benefit lens, and
  the WNR Strengths/Gaps phrasing all light up from the *same* WS2 data. They are one dependency seen
  three ways.
- **WS4 (WNR) and WS5 (Choose Better) sit downstream** but reuse mature engines (Analyser, SBC) — they
  are integration/aggregation, not new engines.
- **Everything post-launch depends on WS2 *existing first*** (the KMS seeds itself from the static
  registry; the recommendation engine reads only the published/registry snapshot).

---

# SECTION 5 — CRITICAL PATH

**The critical path is editorial, not engineering.**

```
WS0 reconciliation  ──►  WS2 content authoring  ──►  WS2 sourcing + EFSA  ──►  nutritionist sign-off
 (engineering, days)      (editorial, weeks)         (editorial, weeks)        (review, gating)
                                                                                      │
                                                                                      ▼
                                              WS1 Tier B + WS3 Pantry Explore + WS4 WNR benefits
                                                            light up together
```

The longest pole is **WS2 — authoring, sourcing, and securing nutritionist + EFSA sign-off on the
minimum 5 health benefits and the launch food set's Nutrition Context.** Engineering for the surfaces
that consume it is already built or thin. Therefore:

- **The schedule is paced by curation/review capacity, not by sprint velocity.** Adding engineers does
  not speed the critical path; adding a nutritionist reviewer does.
- **The mitigation is the Tier A / Tier B split.** WS1 Tier A, WS3 Explore's *nutrient* lens, and WS4's
  *counts-only* sections **all ship without WS2**, so the visible product is excellent and complete-
  feeling even while the benefit content is in review. The benefits then "light up" across all surfaces
  the day WS2 publishes — one content drop, three surfaces upgraded, zero UI rework.

**Critical-path-shortening levers (all safe):**
1. Ship the **minimum 5** benefits (Heart/Gut/Bone/Immune/Energy) — highest coverage, lowest claim
   risk — and treat the additional 3 (Muscle/Brain/Sleep) as a fast-follow content drop.
2. Reconcile the nutrient vocabulary **first** (WS0), so authoring never stalls on string drift.
3. Author Nutrition Context by *formalising* the existing `pantry-knowledge.ts` proto-data rather than
   writing from scratch (it is already in the right voice).

**What is NOT on the critical path (and must not be allowed onto it):** the KMS, the automation
framework, the recommendation engine's learning, Household Progress. Pulling any of these forward
lengthens the path and adds risk for no launch-quality gain.

---

# SECTION 6 — LAUNCH BLOCKERS

**What MUST exist before launch** (a blocker is something whose absence makes the launch *unsafe* or
*incoherent*, not merely *less rich*):

### Blocking — data quality (WS0)
- [ ] **9-category enum reconciled** across `nutrition-variety.ts` and `nutrition-benefit-library.ts`;
      avocado reclassified to Healthy Fats; off-enum library strings (`Herbs`, `Mushrooms`,
      `Fermented`, `Leafy Greens`, `Extra Veg`) mapped. *Without this, category grouping/filtering is
      silently wrong.*
- [ ] **Controlled nutrient vocabulary** built; every `keyNutrients` string reconciled to it;
      `public`/`internal`/`hidden` visibility set. *Without this, the nutrient bridge breaks silently.*
- [ ] **`mealId` added to `WeekMealEntry`** seam (additive). *Blocks meal→recipe cross-links.*

### Blocking — trust & claims (WS2, if any benefit ships)
- [ ] **Minimum 5 established benefits**, each via the nutrient bridge, each with ≥1 `SourceRef`
      (NHS/BNF/NIH ODS/EFSA) + `url` + `lastReviewed`.
- [ ] **Nutritionist sign-off** on all shipped benefits and bridge links; **EFSA wording firewall**
      applied to every `established` claim.
- [ ] **Zero AI-generated / fabricated health claims** anywhere. `emerging` benefits hidden or tagged,
      never shown as `established`.
- [ ] **Copy-safety sign-off** on the banned/allowed vocabulary; `HEALTH_DISCLAIMER` +
      "associations, not causation" present on every benefit-bearing surface.
- [ ] **Fallback verified live:** missing/unsourced/inactive benefit → Key Nutrients only + safe empty
      state; Analyser benefits gated by `apple-score-trust`.

### Blocking — production readiness (cross-cutting)
- [ ] **Responsive coverage** verified at 375 / 640 / 768 / 1024 / 1280 / 1536 on every launch surface;
      no horizontal scroll, no clipped tables, no JSON-like overcrowding.
- [ ] **Adaptive Density** wired into Plant Diversity (and audited elsewhere) — the 768-vs-640
      breakpoint mismatch resolved.
- [ ] **Plant Diversity Tier A** complete: one spoken name; the two variety mechanics disambiguated.

### Blocking — Analyser claim wording (only if WNR §6 ships risk wording)
- [ ] **`sources` on the `additives` table** before any additive-*risk* wording is shown as a public
      claim. *Until then, §6 ships as counts + Analyser deep-link only — which is acceptable for launch.*

### NOT blockers (explicitly safe to launch without)
- The ingredient-tier **caution/occasional classifier** (Choose Better's net-new, highest-risk piece) —
  defer; ship Choose Better's positive half only.
- The **KMS**, automation, source ingestion — all post-launch.
- The **recommendation engine** (goals → foods) — fast-follow, not a blocker.
- **Household Progress**, **Tier-4 planner recovery** — post-launch.
- Benefits 6–8 (Muscle/Brain/Sleep) — fast-follow content drop after the minimum 5.

---

# SECTION 7 — KNOWLEDGE SYSTEM ROLLOUT

### When each piece is built — and the answer to *"Can Plant Diversity launch before full automation?"*

> **Yes — emphatically. Plant Diversity launches before any automation, and before any benefit data at
> all (Tier A). The static registry (Tier B) is the launch knowledge layer. Automation is years of
> post-launch graduation and never gates launch.**

| Knowledge component | When | Why then |
|---|---|---|
| **Controlled nutrient vocabulary** | **WS0 — launch, first** | Prerequisite for the bridge to connect; pure data quality. |
| **Static Knowledge Registry V1** (Benefit→Nutrient + Nutrition Context, curated TS) | **WS2 — launch** | The keystone content; matches every existing pattern (`nutrition-benefit-library.ts`); no schema, instant rollback. |
| **`sources` field on registry entries** (static) | **WS2 — launch** | Required before any benefit phrasing ships publicly. Lives in the static TS for V1. |
| **`sources` on `additives` table** | **Launch *only if* WNR ships additive-risk wording** | Otherwise post-launch; §6 ships as counts + deep-link until then. |
| **Editorial Rules Engine** (data-driven validator) | **Post-launch (E0)** | Makes wording machine-checkable; needed for automation, not for a curated hand-authored launch set. |
| **KMS DB schema** (candidate/review/published planes) | **Post-launch (P0)** | Graduation of the static registry; additive-only migration; static remains the fallback through cutover. |
| **Source ingestion adapters** (USDA/NIH/NHS, fetch-and-quarantine) | **Post-launch (P3)** | Robots fill candidates only; humans still gate. No app dependency until parity is proven. |
| **Automation curve** (pattern blessing → auto-publish) | **Long-term (E2–E7)** | Automates only the THA-owned layer (wording), never the science; revocation-before-autonomy. |
| **Staleness monitoring** | **Post-launch (P4)** | Alert-only; needs the DB planes to exist first. |

**The rollout principle (carried from the KMS + WNR docs):** the static registry is authored by hand
for launch, then becomes (a) the **seed corpus** for the KMS's first candidates and (b) the **standing
fallback** through and after DB cutover. The app's read adapter (`health-benefits-model.ts`) keeps its
shape forever; only its *data provider* changes (static → published-with-static-fallback). **No surface
ever waits on automation.**

---

# SECTION 8 — PRODUCTION READINESS

Assessment against the brief's checklist. Legend: ✅ strong · 🟡 partial/needs work · 🔴 gap.

| Dimension | State | What's needed for launch |
|---|---|---|
| **Responsive design** | 🟡 | The largest gap. Per-surface audit at 375/640/768/1024/1280/1536. Plant Diversity needs a card↔table switch at 640. |
| **Adaptive Density** | 🔴 | Foundation exists (`use-adaptive-density.tsx`, 640/1280/1536) but is inconsistently consumed — only Simply Better Choices honours it; Plant Diversity ignores it and uses a *different* breakpoint (768). **Reconcile to one density system across launch surfaces.** |
| **Error handling** | 🟡 | Server engines are deterministic and isolated; confirm graceful client error/empty states on every knowledge surface (the empty-state discipline is already strong). |
| **Fallback behaviour** | ✅ | Best-in-class by design: `getFoodHealthProfile()` returns `[]` by default; missing benefit → nutrients-only + safe empty state. The fallback *is* the default state. |
| **Trust messaging** | ✅ | `HEALTH_DISCLAIMER`, banned/allowed vocabulary, "associations not causation" all specified. Enforce presence on every benefit-bearing surface. |
| **Empty states** | ✅ | `EMPTY_STATES` covers no-plants / no-benefits / no-meals / no-variety — all safe, no fabrication. |
| **Source citations** | 🟡 | The display path exists; the *data* (sourced registry entries) is WS2. Citations are real the day WS2 publishes; until then surfaces show nutrients-only. **No surface shows an uncited claim.** |
| **Performance** | ✅ | `computePlantData`/sorting memoised; uplift engine sub-30ms; deterministic engines. Confirm no resize layout-thrash once density listeners are wired. |
| **Accessibility** | 🟡 | Some good signals (`aria-pressed` on sort pills, semantic `<table>`). **No evidence of a full a11y audit** — recommend a focused pass (keyboard nav, focus order, contrast, screen-reader labels on chips/expanders) before launch. |

**What is missing (ranked):**
1. **Responsive + Adaptive Density consistency** — the one true cross-cutting production gap.
2. **A11y audit** — likely small fixes, but unverified; do it before launch, not after.
3. **Source data** (WS2) — gating for benefit wording, mitigated by nutrients-only fallback.
4. **`sources` on `additives`** — gating only for additive-*risk* wording; deferrable.

---

# SECTION 9 — LAUNCH DEFINITION OF DONE

> **"The Healthy Apples is launched" means: the five connected nutrition surfaces are responsive,
> trust-safe, and reading one shared knowledge model — with the minimum sourced benefit set live and
> every gated claim degrading to an honest shell. Not more; not less.**

**Feature completeness**
- [ ] Plant Diversity (Tier A min; Tier B if WS2 ready), Pantry Explore (read-only hub), Weekly
      Nutrition Report (shell with live low-risk sections), Analyser (with inbound deep-links), Simply
      Better Choices — all shipped and cross-linked per the "separate but connected" model.
- [ ] Each surface answers **one question** and links out for the others (no surface re-implements
      another's logic).

**Knowledge completeness**
- [ ] Minimum **5 established benefits** live via the nutrient bridge; Nutrition Context for the launch
      food set; nutrient vocabulary + 9-category enum reconciled.
- [ ] Every curated food resolves to ≥1 real fact (key nutrients); benefits optional, never required.

**Responsiveness & density**
- [ ] No horizontal scroll / clipped tables / overcrowding at 375/640/768/1024/1280/1536; density-aware
      across compact/comfortable/expanded.

**Data freshness**
- [ ] Every shipped `SourceRef` has `lastReviewed`; review cadence + owner assigned (the static-registry
      maintenance model).

**Performance**
- [ ] Knowledge surfaces memoised; no resize thrash; weekly aggregation within existing seam budgets.

**Trust**
- [ ] Zero fabricated/AI-generated claims; nutritionist + EFSA sign-off on shipped benefits; disclaimers
      present; fallback-to-nutrients verified live; Analyser gated by `apple-score-trust`.

**Polish**
- [ ] One spoken name per surface; variety mechanics disambiguated; a11y pass complete; copy-safety
      sign-off recorded.

**Household experience**
- [ ] Plant Diversity / WNR read the household week via `useWeekMealEntries`; hard-restriction safety
      intact wherever foods are surfaced (no recommendation engine at launch, so this is read-only).

**Educational value**
- [ ] Every plant/food shows a real fact or honest empty state; category-coverage grid teaches the
      "spread your week" lesson; the Benefit→Nutrient→Food→Meal chain is visible and auditable.

**Stop conditions (no launch until all true):** WS0 reconciliations merged · WS2 minimum-5 signed off ·
responsive + density + a11y passes complete · copy-safety sign-off recorded · fallback verified live ·
no uncited claim on any surface.

---

# SECTION 10 — POST LAUNCH

Sequenced fast-follows, each behind its own rollback point and approval.

| Order | Item | Source design | Gate |
|---|---|---|---|
| 1 | **Benefits 6–8** (Muscle, Brain, Sleep[emerging]) | Health Benefits V1 §2.2 | Content drop; nutritionist sign-off. |
| 2 | **WNR gated sections go live** (Protein & Whole Foods; UPF-risk wording) | WNR §4 | Needs curated protein/dairy/fish data + `sources` on `additives`. |
| 3 | **Choose Better — caution classifier** (occasional foods) | WNR §8 + Intelligence §7 | Highest claim/tone risk; needs copy-safety sign-off + caution-food→alternatives table. |
| 4 | **Recommendation Engine — Stages 1–2** (static → household-aware) | Personalised Intelligence §11 | Goals/SBC/Choose Better as one pipeline; needs Profile goals/likes fields; no AI; Rule T0 safety gate. |
| 5 | **Pantry Explore — personalisation** ("already in your meals ✓ / easy additions ○") | Pantry V2 §8 Phase 2 | Reuses planner data + boosts + shopping loop. |
| 6 | **KMS — P0→P2** (schema → curator tooling → seed-from-static) | KMS §9 | Additive-only migration; static stays fallback; parity tests before any read-path swap. |
| 7 | **Tier-4 component-shell planner recovery** | current_dev_status Stream A/B | Wire `matchMealsForHousehold()` as Tier-4 fallback; closes the restricted-household empty-slot gap. |
| 8 | **Household Progress** (streaks, week-over-week, seasonal insights) | (brief) | Needs a progress/achievement model; explicitly post-launch. |

---

# SECTION 11 — LONG TERM VISION

| Horizon | Capability | Source design | Hard constraints |
|---|---|---|---|
| **KMS automation** | Source ingestion (P3) → staleness monitoring (P4) → editorial rules (E0) → pattern blessing → Phase-3 auto-publish (E5 composition, E6 outcome) → exceptions-only (E7) | KMS §9, Editorial/Automation §10 | Automate only the **THA-owned layer** (wording/presentation), never the science. Revocation-before-autonomy. First instance of any nutrient↔benefit relationship is always human. EFSA firewall + nutrition/legal sign-off before outcome auto-publish. |
| **Predictive guidance** | Recommendation Engine Stage 4 — "you usually plan curry on Fridays — here's a plant boost"; seasonal, gap-aware | Intelligence §11 | LLM may *phrase*, never *decide*. Offers, never assumes (Rule LT2). Frequency caps + easy opt-out. |
| **Autonomous curation** | Self-maintaining, self-growing knowledge base; humans only on genuine novelty/conflict | Editorial/Automation §10 | Worst case stays "slightly stale, once-human-approved" — never unreviewed or fabricated. |
| **Nutrition Companion** | Recommendation Engine Stage 5 — conversational, goal-tracking-over-time, multi-eater reconciliation | Intelligence §11 | The decision-brain stays deterministic, cited, explainable at every stage (Rule LT3). Companion verbs only — never diagnose/dose/predict/prescribe. |

**The invariant across all horizons:** the trust guarantees and explainability are **constant**; only
personalisation depth and automation maturity grow. The two structural walls — the KMS *discovered↔
published* wall and the Intelligence *generic↔personalised* (G1) wall — never move.

---

# SECTION 12 — RISKS

Per-phase, with rating. Phases: **WS0** (foundations) · **WS1** (Plant Diversity) · **WS2** (registry) ·
**WS3** (Pantry Explore) · **WS4** (WNR) · **WS5** (Choose Better positive) · **PL** (post-launch).

| # | Risk | Phase(s) | Rating | Mitigation |
|---|---|---|---|---|
| R1 | **Pressure to fabricate / AI-fill health claims to hit a launch date** | WS2 | 🔴 **High** | Ship the minimum 5 sourced benefits only; everything else falls back to nutrients. The defining risk across every design doc. Hard gate: no uncited claim ships. |
| R2 | **Nutrient-string drift silently breaks the bridge** (`Omega-3` vs `Omega 3`) | WS0 | 🟠 Med | Build the controlled vocabulary first; lint that every bridge nutrient is `public` and exists. |
| R3 | **Diagnosis-level wording creep** ("prevents", "good for diabetes") | WS2, WS4, WS5 | 🔴 High | Banned-word review + EFSA firewall + area-level-only + nutritionist sign-off. |
| R4 | **Scope creep — pulling KMS / automation / recommendation engine / Household Progress into launch** | all | 🟠 Med | This roadmap's explicit workstream re-cut (§3); post-launch list (§10) is the holding pen. "Best launch" ≠ "most features". |
| R5 | **Responsive / density inconsistency ships** (breakpoint mismatch, overcrowding) | WS1, all surfaces | 🟠 Med | Reconcile to one density system; verify the six-breakpoint matrix per surface in DoD. |
| R6 | **Shaming / negative tone** (Choose Better, Occasional Foods) | WS5, PL | 🔴 High | Launch only Choose Better's *positive* half; defer the caution classifier; affirm-inform-offer; neutral "occasional" taxonomy; copy-safety gate. |
| R7 | **Surface sprawl** — every surface tries to show everything; one-question discipline blurs | WS3, WS4 | 🟠 Med | Enforce the field-to-surface matrix; only Pantry Explore is encyclopedic. |
| R8 | **Category fracture** (avocado double-classified, off-enum strings) | WS0 | 🟠 Med | WS0 reconciliation before any grouping/filtering goes live. |
| R9 | **"Broaden Your Variety" mislabelled** at launch (shows used forms, not suggestions) | WS1 | 🟠 Med | Rename to "Your Variety"; build the curated same-category suggestion engine. |
| R10 | **`additives` risk wording shipped without `sources`** | WS4 | 🔴 High | §6 ships as counts + Analyser deep-link until `sources` lands; no public risk claim before citation. |
| R11 | **Editorial capacity underestimated** (the real critical path) | WS2 | 🟠 Med | Pace the schedule on curation/review capacity; ship minimum 5, fast-follow the rest; formalise existing `pantry-knowledge` proto-data. |
| R12 | **A11y gaps discovered late** | all surfaces | 🟡 Low–Med | Dedicated a11y pass in DoD, not post-launch. |
| R13 | **Tier-4 gap leaves restricted households with empty planner slots at launch** | Planner | 🟡 Low–Med | Out of the knowledge-launch scope, but flag prominently; sequence as post-launch item 7; meanwhile Tier-3 controlled-repeat prevents empty slots. |

**Per-phase aggregate rating:** WS0 = **Low–Med** (data quality) · WS1 = **Low–Med** (craft) ·
WS2 = **Med–High** (claim discipline + editorial pole) · WS3 = **Low–Med** (read-only on shared model) ·
WS4 = **Low–Med** (a view; inherits §6/§7 risk) · WS5 = **Med** (positive half only; caution deferred) ·
PL = **Med–High** (automation + caution + personalisation carry the residual risk, all gated).

---

# SECTION 13 — FINAL RECOMMENDATION

**Launch the connected five-surface knowledge experience — and nothing more — and it will be the best
launch, not the fastest.** The fastest launch ships empty shells or fabricated claims; the best launch
ships a small, sourced, beautifully responsive, honestly-connected product whose every claim is
auditable and whose gaps degrade gracefully to real nutrients.

**The seven non-negotiables:**

1. **Re-cut the workstreams** (§3): add WS0 (Knowledge Foundations), split the static registry (launch)
   from the KMS (post-launch), and move automation / personalisation-learning / Household Progress to
   the post-launch roadmap.
2. **Sequence:** WS0 → WS2 (critical path, editorial-paced) running parallel to WS1 (Tier A) →
   WS3 + WS4 light up on WS2 → WS5 positive half. KMS/automation/recommendation/progress all post-launch.
3. **Decouple the flagship from the editorial pole** via Tier A / Tier B: Plant Diversity ships
   excellent *now*; benefits light up *in place* the day WS2 publishes.
4. **The critical path is editorial, not engineering** — pace the plan on curation/review capacity; ship
   the minimum 5 sourced benefits; fast-follow the rest.
5. **Claim safety is structural** — the nutrient bridge, source-required gate, and nutrients-only
   fallback are already built; never create a phase whose only path to "done on time" weakens them.
6. **Fix the one true production gap** — responsive + Adaptive Density consistency across surfaces — and
   run an a11y pass before launch.
7. **Defer Choose Better's caution classifier** and ship only its positive (affirm + balance + factual
   compare) half; defer the recommendation engine to a fast-follow; never ship an uncited claim or
   additive-risk wording without `sources`.

This is the safest, most efficient, highest-value path from today to a public launch THA can stand
behind: *trusted knowledge → personalised understanding → positive guidance → progress over time*, with
the launch owning the first two-and-a-half links and the post-launch roadmap owning the rest.

---

## TRUST CHECK (brief's required self-audit)

- **Could this roadmap cause architecture drift?** The main risk is *scope drift* — pulling post-launch
  programmes (KMS, automation, recommendation learning, Household Progress) into launch. Mitigated by the
  explicit workstream re-cut (§3) and the post-launch holding pen (§10). The roadmap introduces **no new
  architecture** — it sequences already-approved designs and preserves their walls (nutrient bridge, KMS
  hard wall, generic↔personalised wall).
- **How are dependencies protected?** WS0 is forced first (the bridge can't connect on a dirty
  vocabulary); WS2 is the single convergence point so its sign-off gates all benefit-bearing surfaces at
  once; the static registry remains the standing fallback through any future DB cutover; every surface
  reads one shared adapter, never a fork.
- **What can be safely deferred?** The KMS and automation, the recommendation engine, Household Progress,
  Choose Better's caution classifier, benefits 6–8, Tier-4 planner recovery, and additive-risk wording —
  all deferrable with no loss of launch coherence (they degrade to nutrients-only / counts / honest
  shells).
- **What MUST exist before launch?** WS0 reconciliations; the minimum 5 sourced + signed-off benefits
  (for any benefit-bearing surface); responsive + density + a11y; copy-safety sign-off; verified
  fallback; zero uncited or AI-generated claims. (§6, §9.)

---

# FINAL REPORT (brief's required 13 answers)

1. **Rollback identifier:** tag `rollback/launch-roadmap-20260618` → commit `bae3b99`. Restore:
   `git reset --hard rollback/launch-roadmap-20260618`. *(Caveat: 6 pre-existing untracked investigation
   docs are present and predate this task; the committed tree is clean.)*

2. **Current branch:** `safety/preserve-since-last-prod-20260617-1613`.

3. **Launch workstreams (re-cut from the brief's 7):** **WS0** Knowledge Foundations (enum + nutrient
   vocab + `mealId`), **WS1** Plant Diversity Tier A, **WS2** Knowledge Layer V1 (static registry — the
   keystone), **WS3** Pantry Explore V2 (read-only hub), **WS4** Weekly Nutrition Report (aggregation
   shell), **WS5** Choose Better (positive half only). **Moved to post-launch:** KMS + Editorial/
   Automation, Personalised Nutrition Intelligence, Household Progress. (§3)

4. **Dependency graph:** §4 — WS0 is universal upstream; WS1 depends only on WS0 (not WS2); WS2 is the
   convergence point that lights up PD Tier B + Pantry Explore + WNR benefits together; WS4/WS5 reuse
   mature engines; all post-launch depends on WS2 existing first.

5. **Critical path:** §5 — **editorial, not engineering**: WS0 reconciliation → WS2 authoring → sourcing
   + EFSA → nutritionist sign-off → surfaces light up. Paced by curation capacity; mitigated by the
   Tier A / Tier B split.

6. **Launch blockers:** §6 — enum + nutrient-vocab reconciliation; `mealId` seam; minimum 5 sourced +
   signed-off benefits; copy-safety sign-off; disclaimers; verified nutrients-only fallback; responsive
   + density + a11y; `sources` on `additives` *only if* additive-risk wording ships. NOT blockers:
   caution classifier, KMS, recommendation engine, Household Progress, benefits 6–8, Tier-4 recovery.

7. **Production readiness gaps:** §8 — **responsive + Adaptive Density inconsistency** (the one true
   gap; breakpoint mismatch 768 vs 640), **accessibility audit** (unverified), source *data* (WS2),
   `sources` on `additives` (deferrable). Strong already: fallback, trust messaging, empty states,
   performance.

8. **Launch Definition of Done:** §9 — five connected surfaces, responsive/density/a11y, minimum 5
   sourced benefits live, every gated claim degrading to an honest shell, zero uncited/AI claims,
   nutritionist + EFSA + copy-safety sign-off, fallback verified live.

9. **Post-launch roadmap:** §10 — benefits 6–8 → WNR gated sections → Choose Better caution classifier →
   recommendation engine Stages 1–2 → Pantry Explore personalisation → KMS P0–P2 → Tier-4 planner
   recovery → Household Progress.

10. **Long-term roadmap:** §11 — KMS automation (ingestion → staleness → editorial rules → pattern
    blessing → auto-publish → exceptions-only), predictive guidance (Stage 4), autonomous curation,
    Nutrition Companion (Stage 5) — automating only the THA-owned layer, trust guarantees constant.

11. **Risk rating per phase:** §12 — WS0 Low–Med · WS1 Low–Med · WS2 **Med–High** (claim discipline +
    editorial pole) · WS3 Low–Med · WS4 Low–Med · WS5 Med · Post-launch Med–High. Defining risk: R1
    pressure to fabricate claims (🔴).

12. **Confidence level:** **High** on the architecture and sequencing (a synthesis of six code-verified,
    mutually consistent designs). **Medium** on the editorial timeline (the registry content does not yet
    exist and must not be guessed or AI-generated) and on post-launch Stages 4–5 (depend on data volume
    THA does not yet have).

13. **Confirmation — no code, schema or data changes made:** ✅ Confirmed. No source, CSS, route, API,
    schema, migration, data, ingestion, AI-generated content, or commits beyond the rollback tag. Exactly
    two artefacts created: this markdown file and the git tag `rollback/launch-roadmap-20260618`.

---

**Investigation completed:** 2026-06-18
**Rollback available:** `git reset --hard rollback/launch-roadmap-20260618`
**STOP — roadmap only. No implementation performed.**
