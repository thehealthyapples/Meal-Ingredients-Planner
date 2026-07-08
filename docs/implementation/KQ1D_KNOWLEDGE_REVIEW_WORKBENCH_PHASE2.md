# KQ1D — Knowledge Review Workbench, Phase 2

**Status:** ✅ Complete — governed **Knowledge Review Package** import and proposal workflow: import reviewed JSON packages with checksum/provenance validation, create `proposed` decision records linked to their queue items, preserve reviewer metadata and original context, display proposals, and gate approval behind a human. Verified end-to-end against the live DB.
**Date:** 2026-07-07
**Branch:** `int1-intelligence-platform`
**Design:** [`KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md`](../investigations/KQ1A_KNOWLEDGE_REVIEW_WORKBENCH_DESIGN.md)
**Builds on:** [`KQ1B_KNOWLEDGE_REVIEW_WORKBENCH_PHASE0.md`](./KQ1B_KNOWLEDGE_REVIEW_WORKBENCH_PHASE0.md), [`KQ1C_KNOWLEDGE_REVIEW_WORKBENCH_PHASE1.md`](./KQ1C_KNOWLEDGE_REVIEW_WORKBENCH_PHASE1.md)
**Governing architecture:** [`GOV2_CANONICAL_ALIAS_PRINCIPLE.md`](../architecture/GOV2_CANONICAL_ALIAS_PRINCIPLE.md)

---

## 1. Executive summary

Phase 1 (KQ1C) turned the review queue into a workspace and let an admin **export** a self-contained package for external LLM review. Phase 2 closes the loop: a reviewed package comes **back in**. The reviewing model/human fills a `decision` object per item; THA imports the package, **validates its checksum and provenance**, and materialises each filled decision as a **`proposed` decision record linked to the queue term it resolves** — preserving the reviewer's metadata (model, confidence, rationale, notes) and a snapshot of the term's original context. Imported proposals are displayed in a new **Proposals** tab, each behind a **human approve/reject gate**.

Per the task, "reviewed file import" is realised as **Knowledge Review Package import**: the unit of import is the versioned, checksummed export envelope, not an arbitrary file.

Phase 2 is deliberately **import + propose + human-gate only**. It **applies no aliases, modifies no canonical vocabulary, creates no canonical entity, writes nothing to the resolver, and implements no rollback** — those are KQ1A Phases 3–4. **Approval records intent only**; it changes no canonical knowledge. Knowledge Platform ownership and the single GOV2 resolver are untouched.

**Verified against the live DB:** a two-item package round-trips (export → fill decisions → import); filling the `decision` stub does **not** break the checksum, but altering any source field is **rejected** (tamper guard); 2 proposals are created and linked to their terms; the alias slug is normalised (`"Omega 3"` → `omega-3`); reviewer metadata and original context are preserved; re-importing the same package creates **no duplicates**; approve/reject move a proposal (only) between `proposed → approved | rejected`; and the canonical nutrient/benefit slug sets and alias tables are **byte-for-byte unchanged** across the whole flow.

---

## 2. Scope — implemented vs deferred

| Task requirement | Status | Where |
|---|---|---|
| Import JSON Review Packages | ✅ | `importReviewPackage`; `POST …/import` |
| Validate checksum and provenance | ✅ | `validateReviewPackage` (source-field checksum + schema-version allow-list) |
| Create proposal records only | ✅ | `knowledge_review_decisions`, status `proposed` |
| Preserve reviewer metadata | ✅ | `reviewerModel` · `confidence` · `rationale` · `reviewerNotes` columns |
| Preserve original context | ✅ | `original_context` jsonb snapshot per decision |
| Display imported proposals | ✅ | new **Proposals** tab (batches + proposals tables) |
| Human review before approval | ✅ | `approve`/`reject` routes (`assertAdmin`); nothing applied on import |
| Proposals linked to queue items | ✅ | `decisions.term_id` FK → `knowledge_review_queue.id` |

**Explicitly NOT built (per "Do not"):** applying aliases, modifying canonical vocabularies, creating canonical entities, writing to the resolver, and rollback. Approval sets `decisions.status = approved` and reflects it on the queue term — it performs **no** canonical write. The apply step (alias overlay + new-identity hand-off) and rollback remain KQ1A Phases 3–4.

---

## 3. The round-trip contract (export ⇄ import)

Phase 1's export already carried a versioned envelope + `checksum`. Phase 2 makes the round-trip explicit and provenance-safe:

- **Export now writes a `decision` stub** into every item — an all-null object the reviewer fills (`decisionType` ∈ `alias | new_identity | reject | defer`, plus `targetCanonicalSlug`/`aliasString`, or `proposedNewSlug`/`proposedNewName`/`proposedNewDescription`, plus `rationale`/`confidence`/`reviewerModel`/`reviewerNotes`). CSV mirrors these as `decision*` columns. A package-level `reviewerModel` field is added to the envelope.
- **The checksum guards only the SOURCE fields**, never the `decision`. `checksumItems` projects each item onto a fixed, ordered key set (`CHECKSUM_SOURCE_KEYS`) and hashes that. So **filling in a decision cannot change the checksum**, but editing any source field (label, term, contexts, …) does — which import detects as tampering. This projection is also **backward-compatible** with KQ1C exports (which carried exactly those fields and no decision), so their checksum is identical.
- **Import validates** (a) the `schemaVersion` is on the allow-list (`IMPORTABLE_SCHEMA_VERSIONS`), (b) a `checksum` is present, and (c) the recomputed source checksum matches. Any failure throws a `ReviewPackageError` → HTTP 400 with an actionable message.

---

## 4. Data-model impact — two additive tables (no canonical change)

Additive only; no change to any `knowledge_*` entity table, the queue's shape, or the canonical vocabularies. Applied via the idempotent `scripts/apply-knowledge-review-phase2-tables.ts` (mirrors the Drizzle defs exactly; a later `drizzle-kit push` is a no-op), matching KQ1B/KQ1C's DDL approach.

### 4.1 `knowledge_review_batches` — one row per imported package (provenance)

`id` · `direction` (`import`) · `format` (`json`) · `schema_version` · `checksum` · `exported_at` · `reviewer_model` · `source_filename` · `item_count` · `proposal_count` · `status` (`imported`) · `notes` · `created_by_user_id` FK → users · `created_at`. Holds package-level provenance so every proposal is traceable to the file that created it.

### 4.2 `knowledge_review_decisions` — the proposals

`id` · `batch_id` NN FK → batches (cascade) · `term_id` NN FK → `knowledge_review_queue` (cascade — **the linkage the DoD requires**) · `review_type` · `domain` · `decision_type` (`alias`/`new_identity`/`reject`/`defer`) · `target_canonical_slug` · `alias_string` · `proposed_new_slug`/`_name`/`_description` · `rationale` · `confidence` · `reviewer_model` · `reviewer_notes` · `original_context` jsonb · `status` (`proposed → approved | rejected`) · `approved_by_user_id` FK → users · `approved_at` · `rejected_at` · `created_at`/`updated_at`. Indexes: `(batch_id, status)` and `(term_id)`.

> The overlay/audit tables (`knowledge_vocabulary_aliases`, `knowledge_review_audit`) from KQ1A §6.4–6.5 are **not** created here — they pair with apply/rollback in Phases 3–4.

---

## 5. Server — store & routes

### 5.1 Store — `server/lib/knowledge-review-store.ts`

- **Export round-trip:** `ReviewDecisionEnvelope` type + `emptyDecision()` stub written by `toExportItem`; `checksumItems` refactored to hash the ordered `CHECKSUM_SOURCE_KEYS` projection (decision-independent, KQ1C-compatible); envelope gains `reviewerModel`; instructions rewritten to describe filling `decision`; CSV gains `decision*` columns.
- **`validateReviewPackage(raw)`** — envelope + provenance validation; throws `ReviewPackageError` on unknown schema version, missing checksum, non-array items, or checksum mismatch.
- **`importReviewPackage({ raw, filename, userId, importedAt })`** — validates, creates the batch, then per item: skips undecided/invalid decisions, resolves and validates the linked queue term (existence + `dedupeKey === normalisedTerm`), skips terms that already carry an active proposal (idempotent re-import), snapshots `original_context`, normalises alias/new-identity slugs (a **suggestion**, never applied), inserts a `proposed` decision, and reflects `status = proposed` on the queue term. Returns a per-outcome summary.
- **Reads + human gate:** `listImportBatches`, `getBatchDetail`, `listDecisions` (proposals enriched with their live term), `approveDecision` (guards `proposed`-only; sets `approved` + reflects on term), `rejectDecision` (sets `rejected`; returns the term to `in_review` when no active proposal remains). **None of these touch canonical space.**

### 5.2 Routes — `server/routes.ts` (all `assertAdmin`-guarded)

| Method & path | Purpose |
|---|---|
| `POST /api/admin/knowledge-review/import` | Import a package (body = package JSON, or `{ filename, package }`); 400 on validation/provenance failure. |
| `GET /api/admin/knowledge-review/batches` | List import batches (provenance records). |
| `GET /api/admin/knowledge-review/batches/:id` | Batch detail + its proposals. |
| `GET /api/admin/knowledge-review/decisions` | List proposals (filter `batchId`/`status`). |
| `POST /api/admin/knowledge-review/decisions/:id/approve` | Human gate — approve one proposal (records intent). |
| `POST /api/admin/knowledge-review/decisions/:id/reject` | Human gate — reject one proposal. |

---

## 6. Client — `client/src/pages/admin-knowledge-review-page.tsx`

- **Tabs:** the page splits into **Queue** (the KQ1C workspace, unchanged) and **Proposals** (new).
- **Import package** button (header): a hidden file input reads the `.json` package, `JSON.parse`s it, and POSTs it; a toast reports `created`/`skipped`, and the view switches to Proposals. Malformed JSON is caught client-side.
- **Proposals tab (`ProposalsPanel`):** an **Imported packages** table (file, reviewer model, item/proposal counts, a "✓ verified" provenance chip with the checksum prefix, import date) and a **Proposals** table (term, domain, decision-type badge, detail `alias → target` / proposed slug, confidence, reviewer model, status badge, and **Approve/Reject** actions shown only while `proposed`), with a status filter. Same `react-query` + `apiRequest` + shadcn `Table.calm-table` conventions; `← Admin` back-link retained.

---

## 7. GOV2 / ownership compliance

| Guarantee | How Phase 2 honours it |
|---|---|
| Do not apply aliases | Import/approve write only proposal-layer rows; `alias_string`/`target_canonical_slug` are stored suggestions — never written to `NUTRIENT_ALIASES`/`BENEFIT_ALIASES` or any overlay. |
| Do not modify canonical vocabularies | No write to `nutrients.ts`/`health-benefits.ts` or any seed; canonical slug sets read-only. |
| Do not create canonical entities | No insert into any `knowledge_*` entity table; new-identity decisions are stored as **proposals** for a later hand-off. |
| Do not write to the resolver | The resolver is neither imported for mutation nor fed; only `normaliseVocabularyTerm` is reused to tidy suggested slugs. |
| Do not implement rollback | No rollback route, no soft-delete/reactivation logic; batches carry only `imported` status. |
| Proposals until approved | Import creates `proposed` only; a human `approve`/`reject` is the sole transition, and approve applies nothing. |
| Provenance preserved | Batch stores the package `checksum`, `schema_version`, `exported_at`, `reviewer_model`, filename; each decision preserves reviewer model/confidence/rationale/notes + an `original_context` snapshot. |

---

## 8. Verification

Exercised the real store functions end-to-end against the live DB (seed → export → fill → validate → import → gate → cleanup):

```
[2] export: 2 items, each with an empty decision stub, checksum 1a5add6a4cbe…
[3] validate after filling decisions → PASS (provenance intact; decision excluded from checksum)
[4] tamper: altering item.label → checksum mismatch REJECTED ✓
[5] import → created=2, skippedInvalid=0, skippedMissingTerm=0
[6] batch preserves checksum + reviewerModel; alias linked to term; "Omega 3"→omega-3;
    reviewer metadata + original context preserved; all decisions 'proposed'; term→'proposed'
[7] re-import same package → created=0, skippedExisting=2 (idempotent, no duplicates)
[8] approve one + reject other → approved / rejected; rejected term → 'in_review';
    approving a rejected proposal → REFUSED
[9] canonical nutrient/benefit slug counts + alias tables UNCHANGED ✓
```

| Definition of Done | Result |
|---|---|
| Review Packages import successfully | ✅ 2 proposals created from a valid package; 400 on invalid/tampered |
| Proposals are linked to queue items | ✅ `decisions.term_id` FK; validated against live term key |
| Provenance is preserved | ✅ checksum validated on import + stored on batch; reviewer metadata + original context on each decision |
| No canonical knowledge changes occur | ✅ canonical slug sets + alias tables unchanged; nothing written to resolver/vocabulary/entities |

- **Types:** `tsc --noEmit` clean for all new/modified files (`schema.ts`, `knowledge-review-store.ts`, `routes.ts`, `admin-knowledge-review-page.tsx`, the apply script).
- **Backward compatibility:** the source-field checksum projection reproduces KQ1C's export checksum exactly, so KQ1C-era packages validate unchanged.

Reproduce: browse `/admin/knowledge-review` as an admin → **Export ▸ Entire queue ▸ JSON** → fill each item's `decision` object → **Import package** → **Proposals** tab → Approve/Reject.

---

## 9. Files changed

**New**
- `shared/schema.ts` → `knowledge_review_batches`, `knowledge_review_decisions` tables + insert schemas/types (additive).
- `scripts/apply-knowledge-review-phase2-tables.ts` — idempotent DDL for the two tables.

**Modified**
- `server/lib/knowledge-review-store.ts` — decision stub in export + source-field checksum; `validateReviewPackage`, `importReviewPackage`, `listImportBatches`, `getBatchDetail`, `listDecisions`, `approveDecision`, `rejectDecision`, `ReviewPackageError`.
- `server/routes.ts` — import, batches list/detail, decisions list, approve/reject routes.
- `client/src/pages/admin-knowledge-review-page.tsx` — Queue/Proposals tabs, Import-package button, `ProposalsPanel`.

**Unchanged (as required)**
- Canonical vocabularies (`nutrients.ts`/`health-benefits.ts`), the single resolver, all `knowledge_*` entity/relationship tables. No overlay, audit, apply, or rollback surface (Phases 3–4).

---

*KQ1D Phase 2 complete: a reviewed Knowledge Review Package can be imported with validated checksum/provenance, materialised as `proposed` decisions linked to their queue terms with reviewer metadata and original context preserved, displayed for human review, and approved or rejected behind a human gate — with no alias applied, no canonical vocabulary or entity changed, nothing written to the single GOV2 resolver, and no rollback, exactly as scoped.*
