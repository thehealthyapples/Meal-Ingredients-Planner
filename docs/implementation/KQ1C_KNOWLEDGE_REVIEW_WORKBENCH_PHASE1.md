# KQ1C — Knowledge Review Workbench, Phase 1

**Status:** ✅ Complete — the first Knowledge Review **Workspace**: inline & bulk editing, search, sorting, advanced filtering, editorial review fields, and export for external LLM review (JSON + CSV). Verified against the live DB.
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Design:** [`KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md`](../investigations/KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md)
**Builds on:** [`KQ1B_KNOWLEDGE_REVIEW_WORKBENCH_PHASE0.md`](./KQ1B_KNOWLEDGE_REVIEW_WORKBENCH_PHASE0.md)
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)

---

## 1. Executive summary

Phase 0 (KQ1B) made the unresolved terms the GOV2 resolver rejects **durable** and **browsable**. Phase 1 turns that read-only browse into the first working **review workspace**: an admin can now triage the queue — assign priority, classify knowledge origin, propose a suggested canonical match, add review notes, move a term's review status — inline per row or in bulk across a selection, then **export a self-contained package for external LLM review** in JSON or CSV.

Phase 1 is **triage + export only**. It deliberately implements **no import, no approvals, no canonical changes, and no rollback** — those remain later phases behind a human gate (KQ1A §8/§10). Every editable field is a **proposal-layer editorial annotation**: in particular the *Suggested Canonical Match* is a suggestion for a reviewer/LLM to consider, **never** an applied alias. **Knowledge Platform ownership is unchanged**: the workspace mints no entity, writes no vocabulary, and does not fork or feed the single resolver.

**Verified against the live DB (24-row queue):** inline edit persists all five fields; the resolver's normaliser is applied to a suggested slug (`"Omega 3"` → `omega-3`); invalid input is rejected (`priority="urgent"`, `status="approved"` both throw); bulk edit updated 2 rows in one call; priority-rank sort and the `hasSuggestion` filter work; and both JSON and CSV exports carry the full LLM-review context with a stable checksum.

---

## 2. Scope — implemented vs deferred

| Task requirement | Status | Where |
|---|---|---|
| Inline editing of review items | ✅ | per-row expand-to-edit panel (client) |
| Multi-select | ✅ | per-row + select-all checkboxes (carried from Phase 0) |
| Bulk editing | ✅ | bulk-edit bar → `PATCH …/terms/bulk` |
| Search | ✅ | label + dedupe-key substring (carried from Phase 0) |
| Sorting | ✅ | term / priority / status / sightings / seen dates |
| Advanced filtering | ✅ | type · domain · status · **priority** · **has-suggested-match** |
| Priority | ✅ | `priority` column + editor + rank-sort + filter |
| Knowledge Origin | ✅ | `knowledge_origin` column + editor (preset datalist) |
| Review Notes | ✅ | `review_notes` column + textarea editor |
| Suggested Canonical Match | ✅ | `suggested_canonical_slug` + slug datalist per domain |
| Review Status | ✅ | editable to triage statuses only (see §4) |
| Export: selected / filtered / entire queue | ✅ | `POST …/export` with `scope` |
| Formats: JSON, CSV | ✅ | `format: json \| csv` |
| Export includes LLM-review context | ✅ | §5 — every required field present |

**Explicitly NOT built (per scope):** import of reviewed files, approval/apply of decisions, alias-overlay writes, canonical entity/vocabulary creation, batch tracking, and rollback. The `status` editor exposes only `unresolved · in_review · deferred · rejected` — the approval/apply/hand-off statuses are unreachable from Phase 1.

---

## 3. Data-model impact — additive columns only, **no new table**

Phase 1 needs no new table: the editable review fields are added to the existing `knowledge_review_queue` (KQ1B), and export is a **stateless read** (no batch/decision tables — those pair with import in a later phase). Four additive, nullable `text` columns in `shared/schema.ts`:

| Column | Role |
|---|---|
| `priority` | reviewer triage priority — `high` \| `medium` \| `low` \| null |
| `knowledge_origin` | editorial classification of where the knowledge originates (distinct from `source`, the capture channel) |
| `review_notes` | free-text reviewer context for the external LLM |
| `suggested_canonical_slug` | reviewer's **suggested** canonical match — a suggestion only, stored normalised, never applied |

> Applied to the live DB via idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` (matching KQ1B's approach — `db:push` prompts interactively and cannot be driven non-interactively here). Column names/types match the drizzle definition exactly, so a later `drizzle-kit push` is a no-op. No `knowledge_*` entity/vocabulary table changed.

---

## 4. Server — store & routes

### 4.1 Store — `server/lib/knowledge-review-store.ts`

- **Vocab constants:** `REVIEW_PRIORITIES` (`high`/`medium`/`low`), `EDITABLE_REVIEW_STATUSES` (`unresolved`/`in_review`/`deferred`/`rejected` — approval/apply statuses deliberately excluded), `KNOWLEDGE_ORIGIN_PRESETS`.
- **`updateReviewItem(id, patch)` / `bulkUpdateReviewItems(ids, patch)`** — inline & bulk edit. A shared `coercePatch()` validates: priority ∈ set, status ∈ *editable* set (rejecting `approved`/`applied`/etc.), trims blanks to `null`, and **runs a suggested slug through the GOV2 `normaliseVocabularyTerm`** so a suggestion lines up with canonical slugs. `undefined` = leave unchanged; `null`/blank = clear.
- **`listReviewQueue`** — extended with `priority`, `knowledgeOrigin`, and `hasSuggestion` filters, and `priority`/`status` sort keys. Priority sorts by **rank** (high > medium > low, NULLs last), not lexically. Filter/where logic is factored into `buildQueueWhere()` and reused by export so list and export always agree.
- **`buildReviewExport({ scope, ids?, filters?, exportedAt })` + `exportToCsv(pkg)`** — gathers rows per scope (`selected` by ids · `filtered` by the same filters as the list · `all`), enriches each with the **existing canonical entity** (looked up domain-scoped from `NUTRIENT_SEED`/`HEALTH_BENEFIT_SEED` — read-only, for context only), and returns a versioned envelope with a sha256 `checksum` over the items. `exportedAt` is passed in by the caller (the store reads no ambient clock).

### 4.2 Routes — `server/routes.ts` (all `assertAdmin`-guarded)

| Method & path | Purpose |
|---|---|
| `GET /api/admin/knowledge-review/queue` | list/filter/sort/search (extended with priority · knowledgeOrigin · hasSuggestion · new sort keys) |
| `GET /api/admin/knowledge-review/options` | editor vocab: priorities, editable statuses, origin presets, canonical slugs (nutrient/benefit) for the suggested-match picker |
| `PATCH /api/admin/knowledge-review/terms/bulk` | bulk edit a selection (registered **before** `:id` so `bulk` is not read as an id) |
| `PATCH /api/admin/knowledge-review/terms/:id` | inline edit one item's review fields |
| `POST /api/admin/knowledge-review/export` | export `scope: selected \| filtered \| all` × `format: json \| csv`; streams a file download, creates no batch, mutates nothing |

---

## 5. Export contract (external LLM review)

`POST …/export` returns a downloadable file. **JSON** is a versioned, self-contained envelope:

```jsonc
{
  "schemaVersion": "kq1c-phase1-export-1",
  "exportedAt": "2026-07-07T…Z",
  "scope": "selected | filtered | all",
  "count": 24,
  "checksum": "<sha256 of items>",       // provenance; forward-compatible with a later import round-trip
  "instructions": "For each item, decide ALIAS / NEW identity / not-a-term …",
  "items": [{
    "id": 24,
    "reviewType": "vocabulary",
    "domain": "benefit",
    "source": "importer",                 // capture channel
    "knowledgeOrigin": "import-draft",     // editorial origin
    "label": "plant_compounds",
    "normalisedTerm": "plant-compounds",
    "status": "in_review",
    "priority": "high",
    "occurrenceCount": 1,
    "contexts": [{ "source": "importer", "foodSlug": "…", "file": "…", "at": "…" }],
    "rejectionReason": "no canonical benefit identity or alias for \"plant-compounds\"",
    "suggestedCanonicalMatch": "anthocyanins",
    "existingCanonicalEntity": { "slug": "…", "name": "…", "description": "…" },  // null when N/A
    "reviewerNotes": "…"
  }]
}
```

**CSV** is a spreadsheet-friendly mirror — one row per item, with the existing canonical entity flattened into `existingCanonicalSlug/Name/Description` and `contexts` serialised as JSON. All cells are RFC-4180 quoted/escaped.

Every field the task requires is present: **review type · domain · source · origin · contexts · occurrence count · rejection reason · existing canonical entity (where applicable) · suggested canonical match · reviewer notes**.

---

## 6. Client — `client/src/pages/admin-knowledge-review-page.tsx`

Extends the Phase 0 browse (same `react-query` + `apiRequest` + shadcn `Table.calm-table` conventions) into a workspace:

- **Inline edit:** a pencil per row opens an expand-in-place edit panel (a full-width sub-row) with Priority (select), Review status (select, triage values only), Knowledge origin (input + preset datalist), Suggested canonical match (input + per-domain canonical-slug datalist), and Review notes (textarea) — Save/Cancel; only changed fields are PATCHed.
- **Bulk edit bar:** appears on selection — set priority / status / origin across all selected in one `…/terms/bulk` call.
- **Advanced filtering:** type · domain · status · **priority** · **has-suggested-match** toggle, plus search.
- **Sorting:** term · priority (by rank) · status · sightings · last seen.
- **Export menu:** a dropdown offering Selected / Filtered / Entire queue × JSON / CSV; triggers a blob download using the server's `Content-Disposition` filename.
- New at-a-glance columns (Priority badge, Suggested match); `← Admin` back-link retained.

---

## 7. GOV2 / ownership compliance

| Guarantee | How Phase 1 honours it |
|---|---|
| No new vocabulary, no minted entity | Only additive annotation columns on the proposal-layer queue; canonical seeds read-only, for export context only. |
| Suggested match is not an applied alias | `suggested_canonical_slug` is a reviewer suggestion; nothing writes it to the resolver or an overlay (apply is a later phase). |
| Single resolver unforked | The workspace never resolves names; it only *records* suggestions and *normalises* them with the one shared `normaliseVocabularyTerm`. |
| Proposals until approved | No approve/apply/import surface exists in Phase 1; status editor cannot reach `approved`/`applied`/`handed_off`. |
| Export is non-mutating | `POST …/export` is a pure read + serialise; creates no batch, changes no row. |

---

## 8. Verification

Exercised the store directly against the live 24-row queue:

```
inline edit id=24 → { priority: high, status: in_review, origin: import-draft, notes: "probe note", suggested: omega-3 }
  ("Omega 3" normalised → "omega-3"; benefit-domain item suggesting a nutrient slug → existingCanonicalEntity: null ✓)
validation → priority "urgent" rejected; status "approved" rejected ✓
bulk edit [a,b] { priority: low, status: deferred } → 2 rows ✓
filters → priority=low → 2; hasSuggestion → 1 ✓; sortBy=priority ranks high→low ✓
export selected(JSON) → all required context fields present; checksum stable; schemaVersion kq1c-phase1-export-1 ✓
export all(CSV) → 24 rows + header (id,reviewType,domain,source,knowledgeOrigin,label,normalised…) ✓
```

Test annotations were reset afterward (queue returned to a clean `unresolved` state).

| Definition of Done | Result |
|---|---|
| Inline + bulk edit of priority/origin/notes/suggested-match/status | ✅ persisted; validated; blanks clear to null |
| Search / sort / advanced filter | ✅ incl. priority-rank sort + has-suggestion filter |
| Export selected / filtered / entire queue in JSON + CSV | ✅ downloadable, full LLM-review context, checksum |
| No import / approvals / canonical changes / rollback | ✅ none implemented; status editor cannot reach approval states |
| Knowledge Platform ownership unchanged | ✅ additive columns only; resolver/vocabulary/entities untouched |
| Types | ✅ `tsc --noEmit` clean for all new/modified files |

Reproduce: browse `/admin/knowledge-review` as an admin — edit a row, select several and bulk-edit, then Export ▸ (Selected/Filtered/Entire queue) ▸ JSON or CSV.

---

## 9. Files changed

**Modified**
- `shared/schema.ts` — four additive review columns on `knowledge_review_queue` (`priority`, `knowledge_origin`, `review_notes`, `suggested_canonical_slug`).
- `server/lib/knowledge-review-store.ts` — editable-field vocab; `updateReviewItem` / `bulkUpdateReviewItems` (validated); extended `listReviewQueue` filters/sort; `buildReviewExport` + `exportToCsv` with domain-scoped canonical enrichment and checksum.
- `server/routes.ts` — `options`, `terms/bulk`, `terms/:id`, `export` routes; extended `queue` filter parsing.
- `client/src/pages/admin-knowledge-review-page.tsx` — inline edit, bulk-edit bar, advanced filters, export menu.

**Unchanged (as required)**
- Canonical vocabularies (`nutrients.ts` / `health-benefits.ts`), the single resolver, and all `knowledge_*` entity/relationship tables. No new table, no batch/decision/overlay/audit tables (later phases).

---

*KQ1C Phase 1 complete: the review queue is now an editable workspace — triage inline or in bulk, filter and sort on the editorial fields, and export a fully-contextualised package for external LLM review in JSON or CSV — with the single GOV2 resolver, canonical vocabularies, and Knowledge Platform ownership all untouched, and no import/approval/apply/rollback surface introduced.*
