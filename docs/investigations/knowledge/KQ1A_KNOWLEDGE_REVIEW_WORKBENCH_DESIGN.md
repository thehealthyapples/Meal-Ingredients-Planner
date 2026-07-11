# KQ1A — Knowledge Review Workbench Design

**Status:** DESIGN — not implemented (design-only per task rules)
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md) — required reading; every decision below is subordinate to it.
**Related:** [`NK6H_CANONICAL_FOOD_IMPORT_COMPLETION.md`](../../implementation/knowledge/NK6H_CANONICAL_FOOD_IMPORT_COMPLETION.md), `shared/knowledge/canonical-vocabulary-resolver.ts`, `server/lib/canonical-foods-importer.ts`, `shared/schema.ts`

> **What this document is.** A design for the Admin **Knowledge Review Workbench**: the governed pipeline that turns *unresolved knowledge terms* (the strings the single GOV2 resolver rejects) into *approved editorial decisions*, with export for external LLM review, import back into THA, batch tracking, rollback, and preserved audit history. It defines architecture, ownership, data-model impact, routes/pages, the rollback model, the approval workflow, and phased implementation. **It changes no code and creates no tables yet.**

---

## 1. Problem statement — why this exists

The GOV2 resolver is deliberately strict: an incoming nutrient/benefit/food name resolves to a canonical identity **only** by exact match or a curated alias; everything else is **rejected and reported, never minted** (GOV2 Rules 4/7 + Core Principle 6). NK6H proved this works — of the NK6 food drafts, ~46 terms resolved and a substantial set were rejected as genuine vocabulary gaps, compound strings, or planner framing.

**The gap:** those rejections are *ephemeral*. Today (`server/lib/canonical-foods-importer.ts`) unresolved terms are only:
- accumulated into `ImportResult.rejected` and appended to `result.warnings`, then
- printed to the console by `server/cli/import-canonical-foods.ts`.

**Nothing persists them.** There is no queue, no batch record, no proposal/approval workflow, and no audit trail for knowledge-term review (confirmed against `shared/schema.ts`: no import-batch table, no knowledge review queue, no rejected-term table exist). Each import run's rejections scroll past and are lost. The vocabulary owner has no durable worklist, no way to route terms to an external LLM for a considered decision, and no governed path to fold an approved decision back in.

The Workbench closes that gap **without** weakening GOV2: it is a *proposal and review layer that sits beside the Knowledge Platform*, never inside its canonical key space.

---

## 2. The one principle that shapes everything

> **The Workbench owns the review process. It never owns canonical identity.**

Canonical vocabularies (`NUTRIENT_SEED`, `HEALTH_BENEFIT_SEED`) stay TypeScript-owned (NK6F). Canonical entities (`knowledge_foods` / `knowledge_nutrients` / `knowledge_health_benefits` and their relationship tables) stay owned by the Knowledge Platform. The single resolver (`canonical-vocabulary-resolver.ts`) stays the only resolver (GOV2 Rule 5).

The Workbench adds a **queue → review → proposal → approval → apply → rollback** lifecycle *around* those owners. Its outputs are, at most, **alias pointers** (which GOV2 Rule 3 explicitly classes as *content edits*, not identity or schema changes) and **new-identity hand-off artifacts** (which it never applies itself — it hands them to the vocabulary owner). It cannot and does not create a canonical entity, a duplicate vocabulary, or a second identity.

Everything in §3–§9 is a mechanical consequence of this one line.

---

## 3. Recommended architecture

### 3.1 Layered view

```
┌──────────────────────────────────────────────────────────────────────┐
│  KNOWLEDGE PLATFORM  (unchanged owner — source of truth)              │
│  • NUTRIENT_SEED / HEALTH_BENEFIT_SEED   (TS-owned vocabularies)      │
│  • knowledge_foods / _nutrients / _health_benefits / relationships   │
│  • canonical-vocabulary-resolver.ts       (THE single resolver)      │
└───────────▲──────────────────────────────────────────┬───────────────┘
            │ reads TS seed aliases + governed overlay  │ rejects unknowns
            │ (single merge point, anti-fork guarded)   ▼
┌───────────┴──────────────────────────────────────────────────────────┐
│  KNOWLEDGE REVIEW WORKBENCH  (new — proposal & review layer)          │
│                                                                       │
│  CAPTURE      recordUnresolvedTerm()  ← importer / resolver callers   │
│      │                                                                │
│      ▼                                                                │
│  QUEUE        knowledge_review_terms   (unresolved → …→ applied)      │
│      │  sort / filter / search / select / edit review fields         │
│      ▼                                                                │
│  EXPORT ──►  JSON + CSV  (batch)  ──►  external LLM review            │
│      ▲                                        │                       │
│      └────  IMPORT  ◄── reviewed file (batch) ┘                       │
│      │                                                                │
│      ▼                                                                │
│  PROPOSALS    knowledge_review_decisions   (proposed → approved)      │
│      │  approve (human gate)                                          │
│      ▼                                                                │
│  APPLY  ── alias ──►  knowledge_vocabulary_aliases  (governed overlay)│
│          └ new_identity ──►  editorial hand-off artifact (no auto-DB) │
│      │                                                                │
│  ROLLBACK  (batch-scoped, reverses alias-overlay applies)            │
│  AUDIT      knowledge_review_audit   (append-only, every transition)  │
└───────────────────────────────────────────────────────────────────────┘
```

### 3.2 Capture — where unresolved terms enter the queue

A new persistence helper `recordUnresolvedTerm(term)` (server-side) is called at every point that already produces a rejection, so the queue is fed by the *same* resolver GOV2 mandates — never a private one:

- **Importer** (`canonical-foods-importer.ts`): where it currently pushes to `result.rejected.{nutrients,benefits}` and `result.warnings`, it *also* records the term. This is the primary feed today.
- **Any future resolver caller** (AI extraction, search, OCR — GOV2 Rule 5): each `via: "unresolved"` result is a capture candidate. The helper is deliberately colocated with the resolver so no surface can reject a term without it being reviewable.

Capture is **deduplicated** on `(normalisedTerm, kind)`: a term seen 40 times across imports is *one* queue row with `occurrenceCount = 40`, `firstSeenAt` / `lastSeenAt`, and a `contexts` list (which foods/files/paths surfaced it). This keeps the queue a worklist of distinct decisions, not a raw log.

### 3.3 Apply — the two, and only two, outcomes

An approved decision resolves to exactly one of:

1. **Alias** (`decisionType = "alias"`) — the term is a genuine same-thing synonym of an existing canonical identity. On apply, a row is written to a **governed DB alias overlay** (`knowledge_vocabulary_aliases`) that the *single resolver* merges on top of its TS seed alias tables at load. This is legitimate because **GOV2 Rule 3 explicitly defines adding an alias as a content edit, never a schema or identity change.** The overlay is subject to the same load-time anti-fork guard as the TS tables: the target **must** already be a canonical slug, or the resolver refuses it. No new identity, no duplicate vocabulary.

2. **New identity** (`decisionType = "new_identity"`) — the term names a real thing with **no** canonical home (e.g. NK6H's `choline`, `lutein_and_zeaxanthin`, generic `protein`). The Workbench **never auto-creates it.** Apply produces an **editorial hand-off artifact**: a proposed `NUTRIENT_SEED` / `HEALTH_BENEFIT_SEED` entry (slug + display name + description skeleton) for the vocabulary owner to add *in TypeScript*. The queue item moves to `handed_off`; it only becomes canonical when the owner edits the seed and re-seeds. This preserves "do not auto-create canonical entities" and keeps TS the vocabulary owner.

Two further terminal decisions record intent without touching canonical space: **`reject`** (not a valid knowledge term — e.g. planner framing like `meal_balance`) and **`defer`** (revisit later; e.g. a compound string like `iodine_and_selenium` that must be split in the source draft first).

> **Recommendation & its alternative (explicit).** I recommend the **governed DB alias overlay** (option B) over generating a code patch to `canonical-vocabulary-resolver.ts` (option A), because the Workbench is a runtime admin tool that cannot commit code, and because a DB overlay gives deterministic, per-batch **rollback** (§7) that a merged code patch cannot. Option A (Workbench emits a PR/diff against the TS alias tables, a human merges) keeps *all* aliases in one file and is the more conservative reading of "TS owns the vocabulary." The decisive point: GOV2 already calls aliases *content*, not *vocabulary* — so a governed, anti-fork-guarded overlay does not move vocabulary ownership; it moves *alias content* to a governed runtime store that the single resolver still solely reads. If the team prefers code-only aliases, the entire design holds with the apply step swapped for artifact-emission; only §6's `knowledge_vocabulary_aliases` table and §7's alias-rollback change.

---

## 4. Source-of-truth ownership

| Asset | Owner (unchanged unless noted) | Workbench's relationship to it |
|---|---|---|
| Canonical **vocabularies** (`NUTRIENT_SEED`, `HEALTH_BENEFIT_SEED`) | **TypeScript / Knowledge Platform** (NK6F) | Read-only. New-identity decisions are *proposed* to this owner as artifacts; never written by the Workbench. |
| Canonical **entities** (`knowledge_foods` / `_nutrients` / `_health_benefits`) | **Knowledge Platform DB** | Read-only. Never inserts, never mints. |
| Canonical **relationships** (`knowledge_food_*`, `knowledge_nutrient_benefits`) | **Knowledge Platform** (seed + importer, human sign-off via `knowledge:signoff`) | Read-only from the Workbench. Sign-off (`reviewedAt`) stays the existing gate. |
| **The resolver** (`canonical-vocabulary-resolver.ts`) | **Knowledge Platform** — the single resolver (GOV2 Rule 5) | The Workbench *feeds* it (aliases via overlay) but does not fork or bypass it. |
| **Alias overlay** (`knowledge_vocabulary_aliases`, new) | **Workbench**, but **governed by GOV2** — anti-fork guard enforced by the resolver at merge/load | Written only by an approved+applied `alias` decision; read only by the single resolver. |
| **Review queue / batches / decisions / audit** (new) | **Workbench** | Owned outright — this is proposal-layer state, not canonical state. |

**Net:** the Workbench introduces **no new vocabulary**, mints **no entity**, and forks **no resolver**. The single canonical key space and the single resolver are preserved exactly as GOV2 requires.

---

## 5. Constraint compliance (the task's rules, mapped to mechanism)

| Rule | How the design honours it |
|---|---|
| Do not implement yet | This document is design-only; no code/schema changes made. |
| Do not create duplicate vocabularies | The overlay holds *alias pointers*, not vocabulary; anti-fork guard rejects any target that is not already a canonical slug. |
| Do not auto-create canonical entities | New-identity decisions produce a hand-off artifact for the TS owner; the Workbench never inserts into `knowledge_*` entity tables. |
| Queue decisions are proposals until approved | `knowledge_review_decisions.status` starts `proposed`; only a human `approve` transition unlocks `apply`. Import creates proposals, not applied changes. |
| Follow GOV2 alias rules | Alias overlay merged by the *single* resolver; many-to-one only; anti-fork guard; scope test (alias vs `not_same_as`) is an explicit reviewer field. |
| Keep canonical vocabularies owned by the Knowledge Platform | §4 — vocabularies stay TS-owned; new identities are proposed, never written. |

---

## 6. Data-model impact

**Additive only. No change to any `knowledge_*` table, no change to the canonical vocabularies.** Four new tables (drizzle, in `shared/schema.ts`, applied via the repo's `db:push` workflow), plus one governed overlay table. All names are proposals.

### 6.1 `knowledge_review_terms` — the queue (one row per distinct unresolved term)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `normalisedTerm` | text NN | resolver's `normaliseVocabularyTerm()` output — the dedupe key |
| `rawTerm` | text NN | first-seen verbatim string (for display) |
| `kind` | text NN | `nutrient` \| `benefit` \| `food` \| … (extensible to future canonical vocabularies) |
| `contexts` | jsonb NN default `[]` | occurrences: `{ source, foodSlug?, file?, path? }[]` |
| `occurrenceCount` | int NN default 1 | incremented on re-capture |
| `firstSeenAt` / `lastSeenAt` | timestamptz NN | |
| `status` | text NN default `unresolved` | `unresolved` → `in_review` → `proposed` → `approved` → `applied` \| `handed_off` \| `rejected` \| `deferred` |
| `reviewProposedType` | text | editor's working proposal: `alias` \| `new_identity` \| `reject` \| `defer` |
| `reviewProposedSlug` | text | for `alias`: target canonical slug; for `new_identity`: suggested new slug |
| `reviewNotes` | text | editable reviewer field |
| `reviewConfidence` | text | `low` \| `medium` \| `high` (mirrors `companionLearningRecommendations` convention) |
| `currentBatchId` | int FK → `knowledge_review_batches.id` | nullable; set while in an export/import cycle |
| `createdAt` / `updatedAt` | timestamptz NN | |

**Unique:** `(normalisedTerm, kind)` — enforces one queue row per distinct decision.

### 6.2 `knowledge_review_batches` — export/import tracking

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `label` | text NN | human label, e.g. "2026-07 nutrient gaps" |
| `direction` | text NN | `export` \| `import` |
| `format` | text | `json` \| `csv` |
| `itemCount` | int NN default 0 | |
| `checksum` | text | sha256 of the exported payload; import validates the reviewed file references a known batch/checksum (tamper & provenance guard) |
| `status` | text NN default `open` | `open` → `exported` \| `imported` → `approved` → `applied` → `rolled_back` |
| `createdByUserId` | int FK → users | |
| `notes` | text | |
| `createdAt` | timestamptz NN | |

### 6.3 `knowledge_review_decisions` — proposals (imported reviewed decisions)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `batchId` | int NN FK → batches | the import batch that created it |
| `termId` | int NN FK → terms | the queue term it resolves |
| `decisionType` | text NN | `alias` \| `new_identity` \| `reject` \| `defer` |
| `targetCanonicalSlug` | text | for `alias`: existing canonical slug (must validate against the resolver's canonical set) |
| `aliasString` | text | for `alias`: the normalised alt-name to bind |
| `proposedNewSlug` / `proposedNewName` / `proposedNewDescription` | text | for `new_identity`: the hand-off artifact fields |
| `rationale` | text | the LLM's / reviewer's grounding (GOV2 requires a synonym be definitionally grounded) |
| `reviewerModel` | text | which external LLM/reviewer produced it (provenance) |
| `status` | text NN default `proposed` | `proposed` → `approved` \| `rejected` → `applied` → `rolled_back` |
| `approvedByUserId` | int FK → users | set on human approval |
| `approvedAt` / `appliedAt` / `rolledBackAt` | timestamptz | |
| `createdAt` | timestamptz NN | |

### 6.4 `knowledge_vocabulary_aliases` — governed alias overlay (the only canonical-adjacent write)

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `kind` | text NN | `nutrient` \| `benefit` |
| `aliasNormalised` | text NN | many-to-one alias key |
| `canonicalSlug` | text NN | **must** be a canonical slug — resolver enforces anti-fork at merge/load |
| `decisionId` | int FK → decisions | provenance: which approved decision created it (enables rollback) |
| `isActive` | boolean NN default true | rollback sets false (soft-delete keeps audit) |
| `createdAt` | timestamptz NN | |

**Unique:** `(kind, aliasNormalised)` — a normalised alias resolves to exactly one identity (GOV2 Rule 3: one string → many identities is forbidden).

### 6.5 `knowledge_review_audit` — append-only history

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `entity` | text NN | `term` \| `batch` \| `decision` \| `alias` |
| `entityId` | int NN | |
| `action` | text NN | `captured` \| `edited` \| `exported` \| `imported` \| `approved` \| `rejected` \| `applied` \| `handed_off` \| `rolled_back` |
| `actorKind` | text NN | `human` \| `llm` \| `system` |
| `actorUserId` | int FK → users | null for `llm`/`system` |
| `before` / `after` | jsonb | state snapshots for reconstruction |
| `createdAt` | timestamptz NN | |

> Reuse note: the repo already has `adminAuditLog` and `recipeSourceAuditLog`, but both are scoped to other domains (users / recipe sources). A domain-specific `knowledge_review_audit` keeps before/after snapshots the generic table lacks and is the pattern needed for rollback reconstruction. The closest existing *workflow* analogues to copy conventions from are `ingredientClassifications` (`reviewStatus: pending|approved|rejected`) and `companionLearningRecommendations` (`status` + `reviewedBy`/`reviewedAt` + `confidence`).

---

## 7. Rollback model

Rollback is **batch-scoped** and is safe precisely because the Workbench's only canonical-adjacent mutation is the **additive, idempotent alias overlay**.

- **Apply batch → rollback batch.** Rolling back an *applied* import batch:
  1. sets `isActive = false` on every `knowledge_vocabulary_aliases` row whose `decisionId` belongs to the batch (the single resolver stops merging them at next load / hot-reload),
  2. reverts each affected `decision.status` `applied → approved` (re-appliable) and each `term.status` back to `proposed`,
  3. sets `batch.status = rolled_back`,
  4. writes one `knowledge_review_audit` row per reversal with `before`/`after`.
- **Idempotent & non-destructive.** Because alias applies never delete or overwrite canonical rows (they only add pointers the resolver reads), removing them cannot corrupt canonical data — resolution simply reverts to pre-batch behaviour (exact-match + TS-seed aliases). This mirrors NK6H's proven non-destructive `onConflictDoNothing` posture.
- **New-identity hand-offs are not auto-rolled-back.** They were never applied to canonical space by the Workbench (they're external TS edits). Rollback marks the hand-off `retracted` and audits it; if the owner already seeded the identity, unwinding that is an ordinary editorial/seed change, out of the Workbench's authority by design.
- **Soft-delete, not hard-delete.** Overlay rows and decisions are deactivated, not removed, so the audit trail (§8) stays intact and a rolled-back batch can be re-approved.

---

## 8. Approval workflow

```
 capture          triage (human)        export        external        import (human)
 ─────────        ──────────────        ──────        ────────        ──────────────
 unresolved  ──►  in_review        ──►  batch(JSON   ──►  LLM      ──►  batch(reviewed
 (auto,           edit fields:          + CSV)            fills          file) →
  deduped)        proposed type,        status=           decision       decisions
                  slug, notes,          exported          fields         status=proposed
                  confidence                                             (PROPOSALS)
                                                                              │
                                                     ┌────────────────────────┘
                                                     ▼
                                        approve (human gate, assertAdmin)
                                        decision.status: proposed → approved
                                                     │
                                    ┌────────────────┴─────────────────┐
                                    ▼                                   ▼
                          decisionType = alias              decisionType = new_identity
                          apply → overlay row               apply → hand-off artifact
                          term/decision = applied           term = handed_off (no DB mint)
                                    │
                                    ▼
                          resolver merges overlay
                          (single resolver, anti-fork guarded)
```

Rules enforced by the workflow:
- **Proposals until approved.** Import never applies; it only creates `proposed` decisions. Nothing touches the overlay before a human `approve` (all transitions `assertAdmin`-guarded, matching the repo's admin pattern).
- **Human gate.** Approval, apply, and rollback are all human, admin-only actions. The LLM's role is confined to *filling decision fields* in an exported file — it proposes, it never commits (`actorKind = llm` is recorded on import; `human` on approve).
- **GOV2 scope test surfaced.** The triage/approval UI shows the `alias` vs `new_identity` choice with the GOV2 scope test inline ("can these two names ever need to disagree on a fact? yes → new identity; no → alias") and, for `alias`, validates the target is a real canonical slug before approve is enabled.
- **Provenance preserved.** `reviewerModel`, batch `checksum`, and `contexts` mean every applied alias is traceable to the term occurrence, the reviewing model, and the approving admin.

---

## 9. Required routes & pages

### 9.1 Client (wouter routes in `client/src/App.tsx`, `ProtectedRoute`-wrapped, admin-gated)

| Path | Page | Purpose |
|---|---|---|
| `/admin/knowledge-review` | `AdminKnowledgeReviewPage` | Queue: sortable/filterable/searchable table of terms; row select; inline edit of review fields; "Export selected / all" (JSON, CSV). |
| `/admin/knowledge-review/batches` | `AdminKnowledgeReviewBatchesPage` | Batch list: export/import history, status, item counts, "Import reviewed file". |
| `/admin/knowledge-review/batches/:id` | `AdminKnowledgeReviewBatchDetailPage` | Batch detail: its decisions, approve/reject, apply, and **Rollback**; audit trail for the batch. |

Plus **one card appended to `ADMIN_SECTIONS`** in `client/src/pages/admin-page.tsx` (`{ id: "knowledge-review", title: "Knowledge Review", description: "…", icon: <lucide>, href: "/admin/knowledge-review", status: "active" }`) — the hub grid picks it up automatically. Follow F3's guidance and include a "← Admin" return link.

**UI conventions to reuse** (from the admin-surface audit): `@tanstack/react-query` + `apiRequest`; the shadcn `Table` primitives with the `calm-table` class (as in `admin-ingredient-products-page.tsx`, the closest existing search-+-table analogue); `useToast` for outcomes; optimistic mutations with `invalidateQueries`. No new grid abstraction — compose the existing table primitives. Sort/filter/search/select are client-driven over a server-filtered query key (`["/api/admin/knowledge-review/terms", filters]`).

### 9.2 Server (all `assertAdmin`-guarded, Zod-validated — the established `server/routes.ts` pattern)

| Method & path | Purpose |
|---|---|
| `GET /api/admin/knowledge-review/terms` | List/filter/sort/search/paginate the queue. |
| `PATCH /api/admin/knowledge-review/terms/:id` | Edit review fields (proposed type/slug/notes/confidence, status→`in_review`). |
| `POST /api/admin/knowledge-review/export` | Export selected/all terms → JSON+CSV; create an `export` batch + checksum. |
| `POST /api/admin/knowledge-review/import` | Upload a reviewed file → validate checksum/provenance → create `proposed` decisions + an `import` batch. |
| `GET /api/admin/knowledge-review/batches` / `…/:id` | Batch list / detail (with decisions + audit). |
| `POST /api/admin/knowledge-review/decisions/:id/approve` \| `…/reject` | Human gate on a single proposal. |
| `POST /api/admin/knowledge-review/batches/:id/apply` | Apply all approved decisions in the batch (alias → overlay; new_identity → hand-off artifact). |
| `POST /api/admin/knowledge-review/batches/:id/rollback` | Batch rollback (§7). |
| `GET /api/admin/knowledge-review/audit` | Audit history (filterable by entity/batch). |

Plus the non-route capture helper `recordUnresolvedTerm()` wired into the importer (and, per GOV2 Rule 5, any future resolver caller).

### 9.3 Export/import file contract

- **JSON** (canonical, machine round-trips): versioned envelope `{ schemaVersion, batchId, checksum, exportedAt, items: [{ termId, normalisedTerm, rawTerm, kind, contexts, occurrenceCount, decision: { decisionType: null, targetCanonicalSlug: null, aliasString: null, proposedNewSlug: null, rationale: null } }] }`. The external LLM fills the `decision` object per item; import reads it back.
- **CSV** (spreadsheet-friendly mirror): one row per term with empty decision columns; import maps columns back to the same decision fields. CSV is convenience for human/tool review — JSON is the source of truth for round-tripping (carries `batchId`/`checksum` for provenance).
- Import **rejects** a file whose `batchId`/`checksum` doesn't match a known export batch (tamper/provenance guard), and validates every `alias` decision's `targetCanonicalSlug` against the resolver's canonical set *before* creating the proposal.

---

## 10. Implementation phases (for a later, separate task)

| Phase | Deliverable | Gate to next |
|---|---|---|
| **P0 — Capture** | `knowledge_review_terms` table + `recordUnresolvedTerm()` wired into the importer (and resolver call sites). Read-only admin queue list. No approvals. | Rejections that were ephemeral are now a durable, deduped worklist. |
| **P1 — Triage & Export** | Sort/filter/search/select + inline edit of review fields; `knowledge_review_batches`; export to JSON + CSV with checksum. | An admin can curate and hand a batch to an external LLM. |
| **P2 — Import & Proposals** | `knowledge_review_decisions`; import reviewed file → `proposed` decisions with provenance validation; approve/reject per decision. | Reviewed decisions exist as proposals; nothing applied yet. |
| **P3 — Apply** | `knowledge_vocabulary_aliases` overlay + resolver merge (anti-fork guard extended to the overlay); apply `alias` decisions; emit `new_identity` hand-off artifacts. | Approved aliases resolve through the single resolver; new identities routed to the TS owner. |
| **P4 — Rollback & Audit** | `knowledge_review_audit`; batch rollback; full audit surface in batch detail. | Every applied batch is reversible and every transition is on record. |

Each phase is independently shippable and leaves GOV2 invariants intact; P0–P2 touch **no** canonical-adjacent state at all (pure proposal layer), so the risky surface (P3's resolver merge) lands last, behind an approval gate, with rollback (P4) close behind.

---

## 11. Open decisions for the vocabulary owner (not blockers)

1. **Alias overlay vs code-patch** (§3.3): recommended overlay; alternative is Workbench-emitted PRs against the TS alias tables. Affects only the apply/rollback step.
2. **Which resolver callers feed capture in P0**: importer is certain; whether search/AI/OCR feed the queue from day one depends on when those paths start calling the resolver in anger (GOV2 Rule 5 says they must, eventually).
3. **New-identity hand-off format**: a generated TS snippet (paste-ready `NUTRIENT_SEED` entry) vs a structured ticket. Recommend the former for lowest owner friction.
4. **Overlay hot-reload**: whether the resolver re-reads the overlay live or only at process boot (affects how fast an applied alias takes effect and how rollback propagates). Recommend boot-time load + an explicit admin "reload vocabulary" action, mirroring the existing seed/sign-off cadence, to keep the single-resolver load-time anti-fork guard authoritative.

---

*KQ1A design complete. The Workbench is a governed proposal layer that makes unresolved knowledge terms durable, reviewable, exportable for external LLM review, importable as proposals, approvable under a human gate, applyable only as GOV2-legal alias content or new-identity hand-offs, fully rollbackable per batch, and fully audited — without minting an entity, forking the resolver, or moving vocabulary ownership away from the Knowledge Platform. No code written; implementation deferred to the phased plan in §10.*
