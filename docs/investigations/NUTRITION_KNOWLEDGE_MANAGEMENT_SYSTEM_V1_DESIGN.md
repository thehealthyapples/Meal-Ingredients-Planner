# THA Nutrition Knowledge Management System — V1 Design

**Document type:** Architecture + data-model investigation (**investigation only — no implementation**).
**Date:** 2026-06-18
**Author role:** Senior nutrition-education product architect + senior Node/Postgres/Drizzle engineer.
**Companion documents (read together):**
- `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` — the curated static-registry V1 (the *content* model + trust rules). **This KMS document is the database-backed evolution of that registry.**
- `COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md` — Tier A / Tier B framing.
- `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md` — weekly aggregation + claim-safety rules.
- `PANTRY_V2_NUTRITION_KNOWLEDGE_HUB.md` — Pantry Explore surface.

---

## 0. ROLLBACK & SAFETY HEADER

| Item | Value |
|---|---|
| **Rollback tag** | `rollback/nutrition-kms-v1-20260618` |
| **Tag object SHA** | `b1a420016b4954d6e1b9a24a99300bf58225a92c` |
| **Points to commit** | `bae3b99` (`bae3b992e021abe32182dcf13f9aff7f1e708a95`) |
| **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| **Restore command** | `git reset --hard rollback/nutrition-kms-v1-20260618` |
| **Undo this doc only** | `rm docs/investigations/NUTRITION_KNOWLEDGE_MANAGEMENT_SYSTEM_V1_DESIGN.md` |

**Required rollback steps — completed before investigation began:**

1. ✅ **Git status checked.** No tracked files modified or staged. Three pre-existing untracked artefacts from prior investigations were present (`COMPLETE_PLANT_DIVERSITY_LAUNCH_DESIGN.md`, `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md`, `WEEKLY_NUTRITION_REPORT_FINAL_ARCHITECTURE.md`). The committed tree is clean; these predate this task and are untouched by it.
2. ✅ **Current branch confirmed:** `safety/preserve-since-last-prod-20260617-1613`.
3. ✅ **Rollback tag created:** `rollback/nutrition-kms-v1-20260618` (object `b1a4200`) at `bae3b99`.
4. ✅ **Rollback identifier reported** (above) **before** any investigation work.

**This task makes no code, CSS, route, schema, API, migration, or data change.** It produces exactly two artefacts: this markdown file and one annotated git tag. Full confirmation in §12 and the Final Report.

---

# SECTION 1 — EXECUTIVE SUMMARY

This investigation designs THA's **long-term Nutrition Knowledge Management System (KMS)**: a Postgres-backed system that lets the nutrition knowledge base be **extensive, source-backed, reviewable, kept current, automatically monitored for upstream change, and never auto-published without human approval.**

It is the **deliberate graduation path** for the static V1 registry designed in `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md`. That document's central trust decision — the **nutrient bridge** (THA never authors a per-food health claim; it authors `Benefit → Nutrient` links and composes them with `Food → Nutrient` data) — is **preserved unchanged** here and becomes the spine of the database model.

**The core principle, restated for the KMS:**

> **Automatic discovery. Manual approval. Published-only app display. Automatic stale-data alerts.**

Concretely, four separated planes:

1. **Ingestion plane (automatic, write-only into a quarantine):** robots pull from USDA FDC, NIH ODS, NHS, BNF, EFSA, Open Food Facts and write *candidate* rows. **No ingested row is ever visible to the app.**
2. **Review plane (human-only):** a curator/nutritionist moves candidates through `draft → in_review → approved/rejected → published → deprecated`. Editing, sourcing, and EFSA wording checks happen here.
3. **Published registry (the only thing the app reads):** an immutable, versioned snapshot of approved knowledge. The five app surfaces read **exclusively** from here.
4. **Staleness plane (automatic, alert-only):** monitors `last_checked`, `last_reviewed`, source-hash change, source availability and review expiry. It **flags**, it never **publishes** or **unpublishes**.

**The single most important architectural rule:** the boundary between "discovered" and "published" is a **hard wall enforced in three independent places** — table separation (candidate tables vs. published tables), a `publish_state` gate, and a read-path that only ever queries the published registry. Automation can fill the candidate side without limit; **only a human action crosses the wall.**

**Recommendation in one line:** Build a **review-gated, source-backed Postgres knowledge base** (Drizzle, matching the existing `shared/schema.ts` conventions) structured as *candidate → review → published-snapshot*, fed by **fetch-and-quarantine** ingestion adapters, governed by the existing trust guardrails (no disease language, source required per health-outcome claim, fallback to nutrients only), with **alert-only** staleness monitoring. Ship it in phases behind the existing static registry, which remains the fallback until the published registry is populated and verified.

---

# SECTION 2 — KNOWLEDGE SYSTEM ARCHITECTURE

## 2.1 The four planes (and the hard wall)

```
            ┌───────────────────────── INGESTION PLANE (robots) ─────────────────────────┐
  USDA FDC ─┤  fetch → normalise → hash → write CANDIDATE rows (publish_state='candidate') │
  NIH ODS  ─┤  NEVER writes to published tables. NEVER deletes. Idempotent on source hash. │
  NHS / BNF─┤                                                                              │
  EFSA     ─┤                              source_documents                                │
  OFF      ─┤                              candidate_facts                                 │
           └──────────────────────────────────┬───────────────────────────────────────────┘
                                               │  (candidates only)
   ════════════════════════════════ THE HARD WALL ════════════════════════════════════════
                                               │  crossed ONLY by an authenticated human action
            ┌──────────────────────────── REVIEW PLANE (humans) ────────────────────────────┐
            │  review_queue: draft → in_review → approved | rejected → published → deprecated │
            │  edit · attach sources · EFSA wording check · set evidence strength            │
            └──────────────────────────────────┬────────────────────────────────────────────┘
                                               │  publish action writes a versioned snapshot
            ┌────────────────── PUBLISHED REGISTRY (immutable, versioned) ───────────────────┐
            │  published_* tables  ←── THE ONLY THING THE APP READS                            │
            └──────────────────────────────────┬────────────────────────────────────────────┘
                                               │
   Plant Diversity · Pantry Explore · Weekly Nutrition Report · Simply Better Choices · Analyser
                                               ▲
            ┌──────────────────── STALENESS PLANE (automatic, alert-only) ───────────────────┐
            │  watches last_checked / last_reviewed / source_hash / availability / expiry      │
            │  raises staleness_flags → curator dashboard.  NEVER auto-publishes/unpublishes.   │
            └────────────────────────────────────────────────────────────────────────────────┘
```

## 2.2 Why four planes and not one table with a status column

A single `status` column is the naive design and it fails the core principle in two ways: (1) a query bug that forgets `WHERE status='published'` leaks unreviewed robot output to users; (2) ingestion and serving contend on the same rows. **Physical table separation** makes the failure mode impossible: the read-path tables (`published_*`) *contain only approved data by construction*, so even a totally unguarded `SELECT *` is safe. Candidate data lives in different tables the app never imports.

## 2.3 Relationship to the existing static registry

The V1 static TypeScript registry (`nutrition-benefit-library.ts`, `pantry-knowledge.ts`, `health-benefits-model.ts`) is **not thrown away**. It becomes:
- the **fallback data source** when the published registry is empty or unreachable (Phase 1–2), and
- the **seed corpus** for the first batch of candidates (curators import the existing curated rows as pre-approved candidates rather than re-authoring them).

The app's existing display adapter (`health-benefits-model.ts`) keeps its shape; only its *data provider* changes from "static import" to "published registry query, falling back to static import."

---

# SECTION 3 — DATABASE MODEL PROPOSAL

> **Conventions matched to `shared/schema.ts`:** `serial` primary keys; `text` status columns (the codebase uses **no `pgEnum`** — status values are constrained by Zod + an app-level check, mirroring existing tables); `timestamp(..., { withTimezone: true })`; `jsonb().$type<…>()` for structured blobs; `createInsertSchema` for validation; `varchar` for short slugs. All names below are proposals for a **future** migration — none are created by this task.

## 3.1 Entity overview

Three layers of tables. **Reference/published** (app reads these), **review/governance** (humans use these), **ingestion/candidate** (robots write these).

| Layer | Tables |
|---|---|
| **Reference (published, app-readable)** | `nutrients`, `foods`, `food_nutrient_links`, `health_benefits`, `benefit_nutrient_links`, `nutrition_context`, `pairings`, `awareness_notes`, `published_registry`, `published_snapshots` |
| **Sourcing (shared)** | `sources`, `source_documents`, `source_citations` |
| **Governance / review** | `candidate_knowledge`, `review_events`, `curators` (or reuse `users.role`) |
| **Freshness** | `freshness_state`, `staleness_flags` |

## 3.2 Core reference tables

```ts
// A nutrient is the join hub of the whole model (the nutrient bridge).
nutrients = pgTable("nutrients", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),   // "magnesium"
  name: text("name").notNull(),                               // "Magnesium"
  unit: text("unit"),                                         // "mg"
  category: text("category"),                                 // "mineral" | "vitamin" | "macronutrient" | ...
  createdAt, updatedAt,
});

// A food/ingredient. Maps to existing food entries; ingest enriches, never replaces curated.
foods = pgTable("foods", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 96 }).notNull().unique(),   // "pumpkin-seeds"
  name: text("name").notNull(),
  usdaFdcId: text("usda_fdc_id"),                             // external linkage (nullable)
  offBarcode: text("off_barcode"),                            // Open Food Facts (nullable)
  plantCategory: text("plant_category"),                      // ties to nutrition-variety taxonomy
  createdAt, updatedAt,
});

// Food → Nutrient (one side of the bridge). Carries provenance per link.
food_nutrient_links = pgTable("food_nutrient_links", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").notNull(),        // → foods.id
  nutrientId: integer("nutrient_id").notNull(),// → nutrients.id
  amountPer100g: real("amount_per_100g"),
  isKeyNutrient: boolean("is_key_nutrient").notNull().default(false),
  sourceCitationId: integer("source_citation_id"),  // → source_citations.id (provenance)
}, t => ({ uq: unique().on(t.foodId, t.nutrientId) }));

// Health benefit "outcome" node (area-level only — see §8).
health_benefits = pgTable("health_benefits", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),   // "heart-health"
  name: text("name").notNull(),                               // "Heart Health"
  icon: text("icon"),
  description: text("description").notNull(),                  // ONE safe-worded sentence
  evidenceStrength: text("evidence_strength").notNull().default("emerging"), // 'established' | 'emerging'
  displayPriority: integer("display_priority").notNull().default(0),
  active: boolean("active").notNull().default(true),          // kill-switch without delete
  createdAt, updatedAt,
});

// Benefit → Nutrient (the ONLY place an outcome is linked; citation lives HERE, never on a food).
benefit_nutrient_links = pgTable("benefit_nutrient_links", {
  id: serial("id").primaryKey(),
  benefitId: integer("benefit_id").notNull(),  // → health_benefits.id
  nutrientId: integer("nutrient_id").notNull(),// → nutrients.id
  strength: text("strength").notNull().default("emerging"),   // 'established' | 'emerging'
}, t => ({ uq: unique().on(t.benefitId, t.nutrientId) }));

// Structured nutrition context (formalises today's free-text pantry-knowledge fields).
nutrition_context = pgTable("nutrition_context", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").notNull(),        // → foods.id
  whyItMatters: text("why_it_matters"),
  howToChoose: text("how_to_choose"),
  goodToKnow: text("good_to_know"),
  createdAt, updatedAt,
});

pairings = pgTable("pairings", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id").notNull(),        // → foods.id
  pairedFoodId: integer("paired_food_id"),     // → foods.id (nullable; may be free-text)
  pairedLabel: text("paired_label"),
  rationale: text("rationale"),                // e.g. "vitamin C aids iron absorption"
  sourceCitationId: integer("source_citation_id"),
});

// Awareness / caution note. Requires a source when it makes a physiological claim.
awareness_notes = pgTable("awareness_notes", {
  id: serial("id").primaryKey(),
  foodId: integer("food_id"),                  // nullable: may attach to nutrient instead
  nutrientId: integer("nutrient_id"),
  note: text("note").notNull(),
  severity: text("severity").notNull().default("info"),  // 'info' | 'moderation' | 'caution'
  sourceCitationId: integer("source_citation_id"),       // required when severity != 'info'
});
```

## 3.3 Sourcing tables (shared by ingestion, review, published)

```ts
// A trusted source ORGANISATION/dataset (the "body").
sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 48 }).notNull().unique(),   // "usda-fdc", "nih-ods", "nhs", "bnf", "efsa", "off"
  name: text("name").notNull(),                               // "USDA FoodData Central"
  trustTier: text("trust_tier").notNull(),                    // 'primary' | 'secondary' | 'composition' | 'wording-firewall'
  baseUrl: text("base_url"),
  licenceNote: text("licence_note"),                          // attribution/licence obligations (e.g. OFF = ODbL)
  active: boolean("active").notNull().default(true),
});

// A specific fetched DOCUMENT/record from a source, with the content hash that drives staleness.
source_documents = pgTable("source_documents", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),    // → sources.id
  externalId: text("external_id"),             // FDC id / ODS factsheet id / EFSA claim id / URL
  url: text("url"),
  title: text("title"),
  contentHash: text("content_hash"),           // sha256 of normalised payload — staleness pivot
  fetchedAt: timestamp("fetched_at", { withTimezone: true }),
  httpStatus: integer("http_status"),
  available: boolean("available").notNull().default(true),    // false when last fetch failed/404
  rawPayload: jsonb("raw_payload").$type<unknown>(),          // quarantined raw response
});

// A CITATION = the human-readable, app-displayable reference, mirroring V1's SourceRef.
source_citations = pgTable("source_citations", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").notNull(),         // → sources.id
  sourceDocumentId: integer("source_document_id"),  // → source_documents.id (nullable for manual cites)
  title: text("title").notNull(),
  url: text("url"),
  evidenceLevel: text("evidence_level").notNull().default("emerging"), // 'established' | 'emerging'
  lastReviewed: timestamp("last_reviewed", { withTimezone: true }).notNull(), // NOT optional (V1 rule)
  efsaClaimRef: text("efsa_claim_ref"),             // permitted-claim id when EFSA-checked
});
```

`source_citations.lastReviewed` is deliberately **NOT NULL** — it is the difference between "cited" and "maintained", carried over from the V1 `SourceRef` design.

## 3.4 Governance / review tables

```ts
// Candidate knowledge: the quarantine. EVERY automated discovery lands here first.
candidate_knowledge = pgTable("candidate_knowledge", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),   // 'benefit_nutrient_link' | 'food_nutrient_link' | 'nutrition_context' | 'awareness_note' | 'pairing' | 'health_benefit'
  payload: jsonb("payload").$type<unknown>().notNull(), // proposed row, shape per entityType
  sourceDocumentId: integer("source_document_id"),      // where it came from
  originType: text("origin_type").notNull(),   // 'ingest' | 'manual' | 'static-import'
  // governance state — the gate:
  reviewState: text("review_state").notNull().default("draft"),
  // 'draft' | 'in_review' | 'approved' | 'rejected' | 'published' | 'deprecated'
  publishState: text("publish_state").notNull().default("candidate"),
  // 'candidate' | 'published'  ← the HARD-WALL boolean, redundant with table separation on purpose
  supersedesPublishedId: integer("supersedes_published_id"), // → published_registry.id (for updates)
  createdAt, updatedAt,
});

// Immutable audit log of every review action. Append-only.
review_events = pgTable("review_events", {
  id: serial("id").primaryKey(),
  candidateId: integer("candidate_id").notNull(),  // → candidate_knowledge.id
  actorUserId: integer("actor_user_id").notNull(), // → users.id (a human; never a robot)
  action: text("action").notNull(),  // 'create' | 'edit' | 'request_changes' | 'approve' | 'reject' | 'publish' | 'deprecate'
  fromState: text("from_state"),
  toState: text("to_state"),
  note: text("note"),
  diff: jsonb("diff").$type<unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

## 3.5 Published registry + snapshots (the app's read source)

```ts
// The published registry: a row here means "approved by a human and live."
// One row per published knowledge unit, versioned.
published_registry = pgTable("published_registry", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),        // → the reference table row (health_benefits.id, etc.)
  candidateId: integer("candidate_id"),            // provenance → candidate_knowledge.id
  version: integer("version").notNull().default(1),
  publishedByUserId: integer("published_by_user_id").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  retiredAt: timestamp("retired_at", { withTimezone: true }), // set when deprecated/superseded
  isLive: boolean("is_live").notNull().default(true),
}, t => ({ idx: index("pub_live_idx").on(t.entityType, t.isLive) }));

// Optional: whole-registry point-in-time snapshot for atomic rollback of a publish batch.
published_snapshots = pgTable("published_snapshots", {
  id: serial("id").primaryKey(),
  label: text("label"),                       // "2026-Q3 launch set"
  manifest: jsonb("manifest").$type<unknown>(),// list of published_registry ids + versions
  createdByUserId: integer("created_by_user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

**Read-path rule:** every app query joins reference tables to `published_registry WHERE isLive = true`. Reference rows with no live registry row are invisible. This is how "published-only app display" is enforced at the data layer.

## 3.6 Freshness tables

```ts
freshness_state = pgTable("freshness_state", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  sourceDocumentId: integer("source_document_id"),
  lastChecked: timestamp("last_checked", { withTimezone: true }),  // robot last looked upstream
  lastReviewed: timestamp("last_reviewed", { withTimezone: true }),// human last re-verified
  reviewIntervalDays: integer("review_interval_days").notNull().default(365),
  lastKnownHash: text("last_known_hash"),       // compare to source_documents.contentHash
}, t => ({ uq: unique().on(t.entityType, t.entityId) }));

staleness_flags = pgTable("staleness_flags", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id").notNull(),
  reason: text("reason").notNull(),
  // 'source_changed' | 'source_unavailable' | 'review_expired' | 'never_reviewed' | 'manual'
  severity: text("severity").notNull().default("warn"),  // 'info' | 'warn' | 'critical'
  detectedAt: timestamp("detected_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  resolvedByUserId: integer("resolved_by_user_id"),
});
```

**Critical property:** `staleness_flags` has **no column that can change `published_registry.isLive`.** Staleness is a *signal to a human*, never an actuator. (See §6.)

## 3.7 Entity-relationship summary

```
sources ─< source_documents ─< source_citations
                  │                    │
                  │            (provenance on every link/claim)
                  ▼                    ▼
nutrients ─< benefit_nutrient_links >─ health_benefits
   │  └──< food_nutrient_links >── foods ──< nutrition_context
   │                                  ├──< pairings
   └──────────────< awareness_notes ──┘

candidate_knowledge ─< review_events            (governance)
published_registry  → (reference rows)          (read source)
freshness_state ─< staleness_flags              (alert-only)
```

---

# SECTION 4 — SOURCE INGESTION STRATEGY

## 4.1 Model: fetch-and-quarantine (never fetch-and-serve)

Every ingestion adapter follows the identical five-step contract and **may only write to `source_documents` and `candidate_knowledge`:**

1. **Fetch** the source record (respecting rate limits, licence, robots).
2. **Normalise** into THA's internal shape (nutrient slugs, food slugs).
3. **Hash** the normalised payload → `contentHash`. If unchanged from `freshness_state.lastKnownHash`, only bump `lastChecked` and stop (idempotent, cheap).
4. **Write `source_documents`** with raw payload, hash, availability, fetch time.
5. **Emit `candidate_knowledge`** rows (`originType='ingest'`, `reviewState='draft'`, `publishState='candidate'`) for any *new or changed* facts — or, if the fact maps to an existing published row, a candidate with `supersedesPublishedId` set so a human can review the *delta*.

**Adapters are forbidden** (by code review + the table separation) from writing reference or published tables. There is no code path from an adapter to the app.

## 4.2 Per-source plan

| Source | Role / trust tier | What we ingest | Cadence | Notes |
|---|---|---|---|---|
| **USDA FoodData Central** | `composition` (food→nutrient facts) | `food_nutrient_links` amounts, `usdaFdcId` linkage | Quarterly | Authoritative for *which nutrients a food has*. Bulk + per-food API. |
| **NIH ODS** | `primary` (nutrient→benefit) | `benefit_nutrient_links`, nutrient roles, awareness notes | Twice/yr | Factsheets are stable; hash whole factsheet. |
| **NHS** | `primary` (consumer-safe wording) | benefit descriptions, awareness/caution notes | Twice/yr | Use for **plain, safe** UK-English phrasing. |
| **British Nutrition Foundation** | `secondary` | corroboration of benefit↔nutrient, context | Twice/yr | Corroborating cite, rarely sole source. |
| **EFSA health-claims register** | `wording-firewall` | permitted-claim references (`efsaClaimRef`) | On register update | **Does not generate claims** — it *gates wording*. A candidate `established` benefit↔nutrient claim should carry an EFSA permitted-claim ref or be downgraded. |
| **Open Food Facts** | `secondary/composition` (branded) | barcode → food linkage, packaging data | On demand | Crowd-sourced ⇒ **lowest trust**; never sole source for a health claim. Respect **ODbL** attribution. |
| **Other trusted (future)** | per-source tier | — | — | Each new source needs a `sources` row + a written trust-tier rationale before any adapter ships. |

## 4.3 Ingestion guarantees

- **Idempotent:** re-running an adapter produces no duplicate candidates (dedupe on `sourceDocumentId` + normalised key).
- **Append-only to history:** a changed upstream value creates a *new* candidate; it never edits a published row directly.
- **Attribution-preserving:** `sources.licenceNote` records obligations (OFF = ODbL, USDA = public domain, NHS/EFSA = terms-of-use) so the app can render required attributions.
- **No claim synthesis:** adapters extract structured facts and *quoted/paraphrased source text into candidate payloads.* **No adapter, and no AI step, may author a new health claim** (see §8).

## 4.4 Where AI is and isn't allowed in ingestion

AI/LLM assistance is permitted **only** for *mechanical normalisation suggestions* inside the candidate quarantine (e.g. "this USDA nutrient name maps to slug `magnesium`", "summarise this factsheet paragraph for the curator to edit"). Any such output is a **draft candidate a human must approve** and is tagged `originType='ingest'` with the AI suggestion flagged. **AI never sets `reviewState='approved'`, never sets `publishState='published'`, and never authors a health-outcome claim that ships.** This is the same firewall as §8.6.

---

# SECTION 5 — REVIEW & PUBLISHING WORKFLOW

## 5.1 State machine

```
                 (ingest / manual / static-import)
                            │
                            ▼
   ┌────────┐  submit   ┌───────────┐  approve   ┌──────────┐  publish   ┌───────────┐
   │ draft  │ ────────▶ │ in_review │ ─────────▶ │ approved │ ─────────▶ │ published │
   └────────┘           └───────────┘            └──────────┘            └───────────┘
       ▲   │ edit            │  request_changes        │                       │ deprecate
       │   └─────────────────┘                         │ reject                ▼
       │                                               ▼                  ┌────────────┐
       └──────────────── edit (re-draft) ───────  ┌──────────┐            │ deprecated │
                                                  │ rejected │            └────────────┘
                                                  └──────────┘
```

| State | Meaning | Who/what | App-visible? |
|---|---|---|---|
| `draft` | Candidate created (robot or human); not yet submitted | ingest / curator | ❌ |
| `in_review` | A curator is actively reviewing | curator | ❌ |
| `approved` | Content + sources + wording accepted, **not yet live** | curator (reviewer role) | ❌ |
| `rejected` | Declined; kept for audit, not deleted | curator | ❌ |
| `published` | Live; a `published_registry` row exists with `isLive=true` | curator (publisher role) | ✅ |
| `deprecated` | Was live, now retired (stale/superseded/withdrawn) | curator / staleness-triggered human | ❌ (registry row `isLive=false`) |

## 5.2 Rules

- **Two-key option for `approved → published`:** recommended that the *publish* action require a user with a `publisher` capability distinct from `reviewer`, so approving and going-live are separable (configurable; single-curator mode allowed for early phase).
- **Publishing is the only wall-crossing action.** It (a) writes/updates the reference row, (b) inserts a `published_registry` row (`isLive=true`, version++), (c) stamps `freshness_state.lastReviewed=now`, (d) appends a `review_events` row. All in one transaction.
- **Every transition writes `review_events`** (append-only audit; immutable).
- **A published row is never edited in place.** An update = new candidate (`supersedesPublishedId`) → review → publish → old registry row `isLive=false, retiredAt=now`, new row `version+1`. This gives free version history and instant rollback (flip `isLive`).
- **Source requirement gate:** the system refuses to move a candidate to `approved` if it asserts a **health outcome** and lacks ≥1 `source_citation` (see §8.4). Composition-only facts (food→nutrient amounts) require a composition source (USDA) but not a benefit cite.

## 5.3 Curator surface (admin, out of app scope)

A small internal review dashboard (separate from the consumer app): inbox of `draft`/`in_review` candidates, side-by-side *current published vs. proposed*, source panel, EFSA-wording checklist, approve/reject/publish buttons, and the staleness queue (§6). **This is internal tooling, gated by `users.role`; it is not a consumer surface and is out of scope for V1 app integration.**

---

# SECTION 6 — STALE DATA & UPDATE DETECTION

## 6.1 Signals (all alert-only)

| Signal | How detected | Flag reason | Default severity |
|---|---|---|---|
| **Source changed** | adapter computes `contentHash` ≠ `freshness_state.lastKnownHash` | `source_changed` | `warn` |
| **Source unavailable** | fetch returns 4xx/5xx/timeout → `source_documents.available=false` | `source_unavailable` | `warn` (→`critical` after N consecutive failures) |
| **Review expired** | `now − lastReviewed > reviewIntervalDays` | `review_expired` | `warn` |
| **Never reviewed** | published row whose `lastReviewed` is null/older than publish | `never_reviewed` | `critical` |
| **Manual concern** | curator raises a flag | `manual` | curator-set |

## 6.2 The cardinal rule

> **Staleness flags. It never publishes, unpublishes, edits, or deprecates anything by itself.**

A `source_changed` event does **not** pull the old data; the live published row stays live and correct-as-last-approved until a **human** reviews the new candidate that the change generated. This is intentional: an upstream edit (or upstream vandalism, in OFF's case) must never silently alter what users see. Worst case under this model is *showing slightly old but human-approved data* — never *showing unreviewed new data.*

## 6.3 What the user sees

Nothing about staleness leaks to the consumer app by default. Staleness is an **internal** signal surfaced on the curator dashboard. (Optional, far future: an internal "last reviewed" timestamp could power an app-side "reviewed YYYY-MM" footnote, but only for *published* rows and only if product wants it — out of V1 scope.)

## 6.4 Cadence

A scheduled job (cron/worker, not in this task) runs adapters on their per-source cadence (§4.2), recomputes hashes, updates `freshness_state`, and raises/resolves `staleness_flags`. Review-expiry is a daily cheap scan over `freshness_state`. None of these jobs hold any publish capability.

---

# SECTION 7 — APP SURFACE INTEGRATION

All five surfaces read **only** from the published registry via a single shared read module (the evolution of `health-benefits-model.ts`), which exposes the *same display shape they already consume*. Data provider swaps; component contracts don't.

| Surface | What it reads | Fallback when published registry empty |
|---|---|---|
| **Plant Diversity** | food→plant-category, key nutrients, benefit chips via nutrient bridge | existing static `nutrition-variety` + library |
| **Pantry Explore** | `nutrition_context` (`whyItMatters`/`howToChoose`/`goodToKnow`), pairings, awareness notes | existing `pantry-knowledge.ts` |
| **Weekly Nutrition Report** | aggregated nutrients across the week → benefits via bridge; awareness/caution notes | static library + WNR caution-foods model |
| **Simply Better Choices** | nutrient deltas + safe benefit framing for swaps | static library |
| **Analyser** | per-food/meal nutrient breakdown + context + awareness | static library |

**Integration rules:**
- **Single read seam.** One module resolves `published_registry`-joined data; if a query returns nothing, it falls back to the static registry. No surface queries candidate or review tables — ever.
- **Nutrient bridge preserved.** Surfaces never read a "food→benefit" claim; they read `food→nutrient` (published) + `benefit→nutrient` (published) and compose. No new claim surface is introduced.
- **Hard fallback to nutrients only.** If a benefit is unpublished, inactive, or emerging-and-hidden, the surface shows nutrients only and hides the benefit (carried from V1 §8 fallback discipline).
- **No app reads of staleness.** Staleness is curator-only.

---

# SECTION 8 — TRUST & CLAIM SAFETY

These rules are **inherited unchanged** from `HEALTH_BENEFITS_AND_NUTRITION_CONTEXT_V1_DESIGN.md` and made enforceable by the database.

## 8.1 No unsupported claims
A health-outcome claim cannot reach `approved` without ≥1 `source_citation` (DB-enforced gate, §5.2/§8.4).

## 8.2 No AI-published claims
AI may suggest normalisation/summaries inside the candidate quarantine only. **No AI actor can set `approved`/`published`, and no AI-authored health-outcome claim ships.** `review_events.actorUserId` must reference a human `users.id` for every approve/publish.

## 8.3 No disease / prevention language
Banned vocabulary (rejected at review, ideally lint-checked on `description`/`note` text):
> treats · prevents · cures · protects against · guarantees · fights · combats · detoxes · boosts (as guarantee) · heals · reverses · "good for your \[organ/disease]" · any named disease/diagnosis

Claims are **area-level, never diagnosis-level**: "supports heart health" ✅ / "prevents heart disease" ❌.

## 8.4 Source required for every health-outcome claim
Enforced at the `in_review → approved` transition: candidates of `entityType` that assert an outcome (`benefit_nutrient_link`, outcome-bearing `awareness_note`) **must** have linked `source_citations`. Composition facts require a composition source (USDA).

## 8.5 Fallback to nutrients only
When evidence is thin, unsourced, or the benefit is `emerging`/hidden/inactive, surfaces drop to nutrients-only (§7). `established` benefits show plainly (presence is the confidence signal); `emerging` are hidden or carry an explicit "emerging evidence" tag, curator's choice, defaulting to hidden.

## 8.6 EFSA wording firewall
Before an `established` benefit↔nutrient claim publishes, it is checked against the EFSA permitted-claims register; if EFSA permits a phrasing for that nutrient, mirror it and store `efsaClaimRef`. If no permitted basis exists, downgrade to `emerging` or reject.

## 8.7 Trust check (this document)
This investigation contains **no health claims, no per-food benefit assertions, and no AI-generated nutrition statements.** It defines structures and rules only. ✅

---

# SECTION 9 — IMPLEMENTATION PHASES

> All phases are **future work**, gated behind their own rollback points and approvals. None are executed by this task.

| Phase | Scope | Output | Risk |
|---|---|---|---|
| **P0 — Schema foundation** | Add the tables in §3 via one Drizzle migration; **no data, no app reads change**. Static registry still serves. | Empty KMS tables + `sources` seeded. | **Low** |
| **P1 — Curator review tooling** | Internal admin dashboard: candidate inbox, review state machine, audit log. Manual candidate authoring only (no robots yet). | Humans can create→review→publish by hand. | **Low–Med** |
| **P2 — Seed via static import** | Import existing curated static registry as pre-approved candidates → publish. App read seam dual-reads (published, else static). | Published registry populated; parity with today. | **Medium** (read-path swap) |
| **P3 — Ingestion adapters (read-only quarantine)** | USDA + NIH ODS + NHS adapters writing candidates only; hashing + `freshness_state`. | Robots fill candidate queue; humans still gate. | **Medium** |
| **P4 — Staleness monitoring** | Scheduled hash/availability/expiry scans → `staleness_flags` → dashboard. Alert-only. | Auto stale detection live. | **Med** |
| **P5 — Remaining sources + EFSA firewall + app cutover** | BNF, EFSA, OFF adapters; EFSA wording checklist enforced; surfaces read published-first with static fallback retired only after parity verified. | Full KMS live; static registry becomes pure fallback. | **Med–High** (claim safety surface) |

**Build order rationale:** schema → human tooling → seed → robots → monitoring → full cutover. The app never depends on the KMS until P2, and even then keeps the static fallback. Robots (P3) cannot affect users because publishing tooling (P1) and the wall already exist.

---

# SECTION 10 — ROLLBACK / RELEASE CONSIDERATIONS

- **This task:** revert with `git reset --hard rollback/nutrition-kms-v1-20260618`, or simply `rm` this doc. Nothing else changed.
- **Per-phase future rollback:** each phase gets its own tag before work. Schema phases ship as **additive-only** migrations (new tables, no alters to existing 59 tables) so a down-migration is a clean `DROP TABLE` with zero impact on live data.
- **Instant content rollback (runtime):** because published rows are versioned, reverting a bad publish is flipping `published_registry.isLive` back to the prior version — no deploy, no migration. `published_snapshots` enables atomic rollback of a whole publish batch.
- **Fallback safety net:** the static registry remains wired as fallback through P2–P5, so an empty/broken published registry degrades to today's behaviour rather than to a blank screen.
- **Release gating:** P5 (claim-bearing app cutover) must not ship without an explicit nutrition/legal sign-off on the published claim set (the EFSA firewall + banned-word lint are necessary, not sufficient).

---

# SECTION 11 — RISKS

| # | Risk | Phase(s) | Severity | Mitigation |
|---|---|---|---|---|
| R1 | Unreviewed robot data leaks to users | P3–P5 | **Critical** | Table separation + `publishState` gate + read-seam only queries `published_registry`; defence in depth. |
| R2 | AI-authored claim reaches publish | P3–P5 | **Critical** | §8.2 firewall; `review_events.actorUserId` must be human; AI confined to candidate quarantine. |
| R3 | Disease/diagnosis language slips through | P1–P5 | **High** | §8.3 banned-word lint at review + EFSA firewall + human approval. |
| R4 | Upstream source change silently alters app | P3–P5 | **High** | Staleness is alert-only (§6.2); live data unchanged until human review. |
| R5 | OFF (crowd-sourced) treated as authoritative | P5 | **High** | Trust tiers; OFF never sole source for a health claim; ODbL attribution stored. |
| R6 | Source licence/attribution breach | P3–P5 | **Med** | `sources.licenceNote`; attribution rendered; legal review at P5. |
| R7 | Read-path swap regresses existing surfaces | P2 | **Med** | Dual-read with static fallback; parity tests before retiring fallback. |
| R8 | Curator bottleneck (queue grows unbounded) | P3+ | **Med** | Prioritised inbox; batch approve for composition facts; emerging defaults to hidden. |
| R9 | Schema churn vs. existing 59 tables | P0 | **Low** | Additive-only migration; no alters to existing tables. |
| R10 | Stale-flag noise fatigues curators | P4 | **Low** | Severity tiers; auto-resolve when hash reverts; dedupe per entity. |

---

# SECTION 12 — FINAL RECOMMENDATION

**Proceed to design-approval for a phased, review-gated, source-backed Postgres KMS** that graduates the existing static V1 registry without ever weakening its trust guarantees. Build it as **four separated planes** (ingest / review / published / staleness) with a **hard wall** between discovery and publication enforced in three independent places (table separation, `publishState` gate, published-only read seam). Preserve the **nutrient bridge** as the spine, keep the **static registry as fallback** through cutover, and gate every phase behind its own rollback point and (for P5) an explicit claim sign-off.

**Do not begin implementation under this task.** This is investigation only. The recommended next step is to open P0 (schema foundation) as a *separate, approved* work item with its own rollback tag.

---

# FINAL REPORT

| # | Required item | Result |
|---|---|---|
| 1 | **Rollback identifier** | Tag `rollback/nutrition-kms-v1-20260618` · object `b1a420016b4954d6e1b9a24a99300bf58225a92c` · at commit `bae3b99` |
| 2 | **Current branch** | `safety/preserve-since-last-prod-20260617-1613` |
| 3 | **Recommended database schema** | §3 — reference/published tables (`nutrients`, `foods`, `food_nutrient_links`, `health_benefits`, `benefit_nutrient_links`, `nutrition_context`, `pairings`, `awareness_notes`, `published_registry`, `published_snapshots`), sourcing (`sources`, `source_documents`, `source_citations`), governance (`candidate_knowledge`, `review_events`), freshness (`freshness_state`, `staleness_flags`). Drizzle/Postgres, additive-only, matching `shared/schema.ts` conventions. |
| 4 | **Recommended ingestion model** | §4 — **fetch-and-quarantine**: adapters write only `source_documents` + `candidate_knowledge`, idempotent on content hash, attribution-preserving, no claim synthesis. Sources tiered (USDA composition, NIH ODS/NHS primary, BNF secondary, EFSA wording-firewall, OFF lowest-trust). |
| 5 | **Recommended review workflow** | §5 — `draft → in_review → approved → published → deprecated` (+ `rejected`), publish as the only wall-crossing action, append-only `review_events` audit, versioned published rows, source-required gate before approval. |
| 6 | **Recommended stale-data controls** | §6 — alert-only signals (`source_changed`/`source_unavailable`/`review_expired`/`never_reviewed`/`manual`) → `staleness_flags` on a curator dashboard. **Never auto-publishes or unpublishes.** |
| 7 | **Recommended app integration** | §7 — all five surfaces (Plant Diversity, Pantry Explore, Weekly Nutrition Report, Simply Better Choices, Analyser) read **only** the published registry through one shared seam, nutrient bridge preserved, hard fallback to nutrients-only / static registry. |
| 8 | **Data impact declaration** | **No data created, modified, deleted, ingested, or migrated.** No tables created. No rows touched. The schema in §3 is a *proposal* for future migrations. |
| 9 | **Trust check** | §8.7 — document contains no health claims, no per-food benefit assertions, no AI-generated nutrition statements. Trust rules (no unsupported/AI/disease claims, source-required, nutrient fallback, EFSA firewall) carried forward and made DB-enforceable. ✅ |
| 10 | **Rollback plan for future implementation** | §10 — additive-only migrations (clean `DROP TABLE` down), per-phase tags, runtime content rollback via `isLive` version flip + `published_snapshots`, static-registry fallback net, P5 claim sign-off gate. |
| 11 | **Risk rating per phase** | §9 + §11 — P0 Low · P1 Low–Med · P2 Med · P3 Med · P4 Med · P5 Med–High; R1/R2 Critical mitigated by defence-in-depth wall. |
| 12 | **Confirmation: no code/schema/data changes made** | ✅ **Confirmed.** This task produced exactly two artefacts: this markdown file and the annotated tag `rollback/nutrition-kms-v1-20260618`. No source, CSS, route, API, schema, migration, or data change. |

**STOP — investigation complete. No implementation performed.**
