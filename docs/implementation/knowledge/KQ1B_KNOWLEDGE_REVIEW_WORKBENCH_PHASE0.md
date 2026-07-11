# KQ1B — Knowledge Review Workbench, Phase 0

**Status:** ✅ Complete — persistent queue, resolver/importer capture, dedupe, and read-only admin browse implemented and verified.
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Design:** [`KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md`](../../investigations/knowledge/KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md)
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)

---

## 1. Executive summary

Phase 0 makes the unresolved knowledge terms the GOV2 resolver rejects **durable** for the first time. Previously they were ephemeral — accumulated into `ImportResult.rejected` and printed to the console, then lost. They are now captured into a persistent, governed **Knowledge Review Queue**, deduplicated by identity, and browsable by admins at `/admin/knowledge-review`.

Per the KQ1B architectural adjustment, the queue was **generalised beyond vocabulary**: it is a multi-review-type queue discriminated by `reviewType`. The first (and only) implemented type is **`vocabulary`**; future review types are additive — a new `reviewType` value plus any type-specific fields in the `details` jsonb, with **no schema redesign**.

Phase 0 is deliberately **capture + read only**. There is no editing, export, import, approval, alias application, rollback, or canonical entity creation — those are KQ1A Phases 1–4. **Knowledge Platform ownership is unchanged**: the queue owns no canonical identity, mints no entity, and does not fork the single resolver.

**Verified against the live DB:** one importer run captured **24 distinct queue rows** (12 nutrient + 12 benefit); re-sightings increment `occurrenceCount` and append contexts rather than duplicating (`meal_enrichment`, seen across 3 food drafts → one row, ×3, 3 contexts); a fresh process read the persisted rows (survives restarts).

---

## 2. Architectural adjustments applied (from the task)

| Adjustment | How it is realised |
|---|---|
| Generalise "Vocabulary Review" → "Knowledge Review" | Table `knowledge_review_queue`, page "Knowledge Review", route `/admin/knowledge-review`, store keyed on a generic `recordReviewItem()`. |
| Support multiple review types | `reviewType` discriminator column (indexed with `status`); the store's generic `recordReviewItem` accepts any type. |
| First implemented type is "Vocabulary" | `REVIEW_TYPE_VOCABULARY = "vocabulary"`; `recordUnresolvedVocabularyTerm()` is the only feed wired in Phase 0. |
| Future types additive without schema redesign | Type-specific payload lives in the `details` jsonb; `domain` + `dedupeKey` are generic. Adding a type needs zero DDL. |

---

## 3. What was built

### 3.1 Schema — `shared/schema.ts` (new table, additive)

`knowledge_review_queue` — one row per distinct review item:

| Column | Type | Role |
|---|---|---|
| `id` | serial PK | |
| `review_type` | text NN default `vocabulary` | discriminator (the generalisation) |
| `domain` | text NN | filterable sub-domain; for vocabulary `nutrient`/`benefit` |
| `dedupe_key` | text NN | stable dedupe discriminator; for vocabulary = resolver's **normalised** term |
| `label` | text NN | first-seen verbatim string (display) |
| `source` | text NN | origin of first sighting (`importer`) |
| `contexts` | jsonb NN `[]` | every distinct sighting `{ source, foodSlug?, file?, at }` (append-on-resight, capped 50) |
| `details` | jsonb NN `{}` | **review-type-specific payload** — the additive hatch; for vocabulary `{ normalisedTerm, rawTerm, reason }` |
| `occurrence_count` | int NN `1` | incremented every sighting |
| `status` | text NN default `unresolved` | Phase 0 only writes `unresolved` |
| `first_seen_at` / `last_seen_at` | timestamptz NN | |
| `created_at` / `updated_at` | timestamptz NN | |

**Unique** `uq_knowledge_review_item (review_type, domain, dedupe_key)` — enforces one row per distinct item and backs the dedupe upsert. **Index** `idx_knowledge_review_type (review_type, status)`. Insert schema + `KnowledgeReviewQueueItem` / `KnowledgeReviewContext` types exported.

> Applied to the DB via a direct idempotent `CREATE TABLE IF NOT EXISTS` (the repo's `db:push` prompts interactively for create-vs-rename and cannot be driven non-interactively here). The created columns/constraints match the drizzle definition exactly, so a later `drizzle-kit push` is a no-op.

### 3.2 Store — `server/lib/knowledge-review-store.ts` (new)

- `recordReviewItem(input)` — the **generic** capture. Read-modify-write dedupe on `(reviewType, domain, dedupeKey)`: first sighting inserts; every subsequent sighting increments `occurrenceCount`, refreshes `lastSeenAt`, and appends a *distinct* context. An `onConflictDoUpdate` guard folds in a concurrent first-sighting instead of failing the unique key.
- `recordUnresolvedVocabularyTerm({ domain, rawTerm, reason, source, context })` — the Phase 0 feed. Derives `dedupeKey` from the **GOV2 single normaliser** (`normaliseVocabularyTerm`), so any casing/separator variant of a term dedupes to one row (GOV2 Rule 5).
- `listReviewQueue(params)` — read-only server-side filter (`reviewType`/`domain`/`status`/`source`), case-insensitive search (label + key), sort (last/first seen, occurrences, label), and pagination; returns `{ items, total }`.

### 3.3 Capture wired into the importer — `server/lib/canonical-foods-importer.ts`

After the resolver's rejected terms are collected, `captureRejectedTerms()` persists each to the queue with `{ source: "importer", foodSlug, file }` context. It is **best-effort**: any capture failure is swallowed into `result.warnings` so a queue outage can never fail an import — GOV2 ownership is untouched because the queue only records a *proposal to review*, never a canonical mutation.

### 3.4 Admin route — `server/routes.ts`

`GET /api/admin/knowledge-review/queue` (`assertAdmin`-guarded, matching the established admin pattern) — passes filter/search/sort/pagination query params through to `listReviewQueue`.

### 3.5 Admin page — `client/src/pages/admin-knowledge-review-page.tsx` (new)

Read-only browse at `/admin/knowledge-review`, following the `admin-ingredient-products-page` conventions (`react-query` + `apiRequest`, shadcn `Table.calm-table`, `Skeleton` loading):
- **Search** (term text) · **filters** (review type / domain / status via `Select`) · **sort** (clickable Term / Sightings / First seen / Last seen headers) · **row selection** (per-row + select-all checkboxes with a live selected count).
- Columns: Term (+ rejection reason), Type, Domain, Source, Status, Sightings, First seen, Last seen. No edit affordances (Phase 0).
- Registered in `client/src/App.tsx`; a **"Knowledge Review"** card added to `ADMIN_SECTIONS` in `admin-page.tsx`; a "← Admin" back-link addresses AUDIT1 finding F3.

---

## 4. Verification

Ran the canonical-food importer over the 10 drafts (`--force-upsert`), then queried the live table from a **separate process**:

```
TOTAL queue rows: 24                     (12 benefit + 12 nutrient — distinct terms)
Top by sightings:
  [benefit]  meal_enrichment          ×3   contexts=3   key=meal-enrichment
  [benefit]  fibre                    ×2   contexts=2   key=fibre
  [nutrient] high_quality_protein     ×2   contexts=2   key=high-quality-protein
  ...
Dedupe probe: capture "ZZZ_Dedupe_Probe" then "zzz-dedupe-probe" (different casing + food)
  → rows 0 → 1, occurrenceCount=2, contexts=2, key=zzz-dedupe-probe   ✓
```

| Definition of Done | Result |
|---|---|
| Every unresolved resolver/import item is persisted | ✅ 24 distinct rows; importer emitted **no** capture-failure warnings |
| Duplicate sightings increase occurrence count | ✅ `meal_enrichment` ×3 (3 foods) in one run; probe ×2 across casings — one row each |
| Queue survives restarts | ✅ read back by a separate process from Postgres |
| Admin can browse the queue | ✅ `/admin/knowledge-review` (search/sort/filter/select), `assertAdmin`-gated |
| Knowledge Platform ownership unchanged | ✅ no `knowledge_*` entity/vocabulary change; capture is best-effort and mints nothing |

- **Types:** `tsc --noEmit` clean for all new/modified files (`knowledge-review-store.ts`, `admin-knowledge-review-page.tsx`, importer, routes, App, schema).
- **Records:** the `dedupe_key` values confirm the GOV2 normaliser drives dedupe (`high_quality_protein` → `high-quality-protein`).

Reproduce:
```bash
npm run import:canonical-foods -- 'docs/knowledge/canonical-foods/drafts/*.yaml' --force-upsert
# then browse /admin/knowledge-review as an admin, or query knowledge_review_queue
```

---

## 5. Explicitly NOT built (per scope — later phases)

Export, import, approvals, alias application, rollback, canonical entity creation, and any editing of queue rows. The queue is capture + read only. The `status` column carries only `unresolved` in Phase 0; its later values (`in_review → proposed → approved → applied | handed_off | rejected | deferred`) and the batch/decision/overlay/audit tables are KQ1A Phases 1–4.

---

## 6. Files changed

**New**
- `shared/schema.ts` → `knowledge_review_queue` table, `KnowledgeReviewContext` / `KnowledgeReviewQueueItem` types, insert schema (additive).
- `server/lib/knowledge-review-store.ts` — generic `recordReviewItem`, `recordUnresolvedVocabularyTerm`, `listReviewQueue`.
- `client/src/pages/admin-knowledge-review-page.tsx` — read-only queue browse.

**Modified**
- `server/lib/canonical-foods-importer.ts` — best-effort `captureRejectedTerms()` after rejection collection.
- `server/routes.ts` — `GET /api/admin/knowledge-review/queue` (`assertAdmin`).
- `client/src/App.tsx` — route registration + import.
- `client/src/pages/admin-page.tsx` — "Knowledge Review" hub card.

**Unchanged (as required)**
- Canonical vocabularies (`nutrients.ts` / `health-benefits.ts`), the single resolver, and all `knowledge_*` entity/relationship tables.

---

*KQ1B Phase 0 complete: unresolved knowledge terms are now persisted, deduplicated, and browsable through a generalised, multi-review-type queue — with Knowledge Platform ownership and the single GOV2 resolver untouched.*
